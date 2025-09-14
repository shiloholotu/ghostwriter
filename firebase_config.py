import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv
import requests
from datetime import datetime
load_dotenv()

# Initialize Firestore client
db = None

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account key"""
    global db
    try:
        # Initialize with service account key
        if not firebase_admin._apps:
            # Use absolute path to service account key
            import os
            current_dir = os.path.dirname(os.path.abspath(__file__))
            key_path = os.path.join(current_dir, "serviceAccountKey.json")
            
            print(f"Looking for Firebase key at: {key_path}")
            
            if not os.path.exists(key_path):
                print(f"Firebase service account key not found at: {key_path}")
                return False
                
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        
        # Initialize Firestore client
        db = firestore.client()
        print("Firestore client initialized successfully")
        return True
    except Exception as e:
        print(f"Firebase initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_user(email, password, display_name):
    """Create a new user with Firebase Auth"""
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        return {
            'success': True,
            'uid': user.uid,
            'email': user.email,
            'display_name': user.display_name
        }
    except auth.EmailAlreadyExistsError:
        return {'success': False, 'message': 'Email already exists'}
    except ValueError as e:
        # Handle password validation errors
        if 'password' in str(e).lower():
            return {'success': False, 'message': 'Password is too weak'}
        return {'success': False, 'message': f'Invalid input: {str(e)}'}
    except Exception as e:
        return {'success': False, 'message': f'Authentication error: {str(e)}'}

def verify_id_token(id_token):
    """Verify Firebase ID token"""
    try:
        print(f"Attempting to verify token: {id_token[:20]}...")
        decoded_token = auth.verify_id_token(id_token)
        print(f"Token verification successful for user: {decoded_token.get('email')}")
        return {
            'success': True,
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name')
        }
    except auth.InvalidIdTokenError as e:
        print(f"Invalid ID token error: {str(e)}")
        return {'success': False, 'message': f'Invalid token format: {str(e)}'}
    except auth.ExpiredIdTokenError as e:
        print(f"Expired ID token error: {str(e)}")
        return {'success': False, 'message': f'Token expired: {str(e)}'}
    except Exception as e:
        print(f"Token verification failed with error: {str(e)}")
        return {'success': False, 'message': f'Token verification failed: {str(e)}'}

def get_user_by_email(email):
    """Get user by email"""
    try:
        user = auth.get_user_by_email(email)
        return {
            'success': True,
            'uid': user.uid,
            'email': user.email,
            'display_name': user.display_name
        }
    except auth.UserNotFoundError:
        return {'success': False, 'message': 'User not found'}
    except Exception as e:
        return {'success': False, 'message': f'Error: {str(e)}'}

def verify_password(email, password):
    API_KEY = os.getenv('FIREBASE_API_KEY')
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    res = requests.post(url, json=payload)
    
    if res.status_code == 200:
        data = res.json()
        # You get idToken, refreshToken, and localId (Firebase UID)
        return {
            "idToken": data["idToken"],         # JWT to authorize requests
            "refreshToken": data["refreshToken"],
            "uid": data["localId"]
        }
    else:
        return {"error": res.json()}

# Document operations
def save_document(user_id, doc_id, title, content):
    """Save a document to Firestore"""
    try:
        doc_data = {
            'id': doc_id,
            'title': title,
            'content': content,
            'timestamp': datetime.now(),
            'updated_at': datetime.now()
        }
        
        doc_ref = db.collection('users').document(user_id).collection('documents').document(doc_id)
        doc_ref.set(doc_data)
        
        return {'success': True, 'message': 'Document saved successfully'}
    except Exception as e:
        return {'success': False, 'message': f'Error saving document: {str(e)}'}

def get_user_documents(user_id):
    """Get all documents for a user"""
    try:
        docs_ref = db.collection('users').document(user_id).collection('documents')
        docs = docs_ref.order_by('updated_at', direction=firestore.Query.DESCENDING).stream()
        
        documents = []
        for doc in docs:
            doc_data = doc.to_dict()
            # Convert timestamp to string for JSON serialization
            if 'timestamp' in doc_data:
                doc_data['timestamp'] = doc_data['timestamp'].isoformat() if doc_data['timestamp'] else None
            if 'updated_at' in doc_data:
                doc_data['updated_at'] = doc_data['updated_at'].isoformat() if doc_data['updated_at'] else None
            documents.append(doc_data)
        
        return {'success': True, 'documents': documents}
    except Exception as e:
        return {'success': False, 'message': f'Error retrieving documents: {str(e)}'}

def delete_document(user_id, doc_id):
    """Delete a document from Firestore"""
    try:
        doc_ref = db.collection('users').document(user_id).collection('documents').document(doc_id)
        doc_ref.delete()
        
        return {'success': True, 'message': 'Document deleted successfully'}
    except Exception as e:
        return {'success': False, 'message': f'Error deleting document: {str(e)}'}

def get_document(user_id, doc_id):
    """Get a specific document"""
    try:
        doc_ref = db.collection('users').document(user_id).collection('documents').document(doc_id)
        doc = doc_ref.get()
        
        if doc.exists:
            doc_data = doc.to_dict()
            # Convert timestamp to string for JSON serialization
            if 'timestamp' in doc_data:
                doc_data['timestamp'] = doc_data['timestamp'].isoformat() if doc_data['timestamp'] else None
            if 'updated_at' in doc_data:
                doc_data['updated_at'] = doc_data['updated_at'].isoformat() if doc_data['updated_at'] else None
            return {'success': True, 'document': doc_data}
        else:
            return {'success': False, 'message': 'Document not found'}
    except Exception as e:
        return {'success': False, 'message': f'Error retrieving document: {str(e)}'}
