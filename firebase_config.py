import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
import requests
load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account key"""
    try:
        # Initialize with service account key
        if not firebase_admin._apps:
            # Replace with your actual service account key file path
            cred = credentials.Certificate("ghostwriter/serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        return True
    except Exception as e:
        print(f"Firebase initialization error: {e}")
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
        decoded_token = auth.verify_id_token(id_token)
        return {
            'success': True,
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name')
        }
    except Exception as e:
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
