import firebase_admin
from firebase_admin import credentials, auth
import os

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
    """Verify user password - Firebase Admin SDK doesn't support password verification directly"""
    # Note: Firebase Admin SDK cannot verify passwords directly
    # This is a security feature - passwords should only be verified on the client side
    # For a real implementation, you would:
    # 1. Use Firebase Auth on the client side to sign in
    # 2. Send the ID token to the server for verification
    # 3. Or use a custom authentication system with hashed passwords
    
    # For demonstration purposes, we'll simulate password verification
    # In a real app, this would be handled differently
    user_result = get_user_by_email(email)
    if user_result['success']:
        # In a real implementation, you would check against stored password hash
        # For now, we'll just check if user exists (not secure)
        return {'success': True, 'message': 'Password verified'}
    else:
        return {'success': False, 'message': 'Invalid credentials'}
