from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from waitress import serve
from claude import *
from wolfram import *
import os
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple in-memory storage for demo
users_db = {}
documents_db = {}
current_user_sessions = {}

# Clear any existing documents to prevent welcome document persistence
documents_db.clear()

print("Server initialized with simple authentication")

def handle_requests(prompt):
    if not prompt or not prompt.strip():
        return jsonify({"error": "No prompt provided"}), 400
        
    result = ""
    try:
        # First try eval for mathematical expressions
        result = str(eval(prompt))
        return jsonify({"result": result})
    except (SyntaxError, NameError, ZeroDivisionError) as e:
        print("Eval failed, trying other methods:", e)
    
    # Try Wolfram Alpha
    wolf_request = request_wolf(prompt)
    if wolf_request is not None:
        return jsonify({"result": wolf_request})
    
    # Try Claude as last resort
    claude_request = prompt_claude(prompt)
    if claude_request is not None:
        # prompt_claude returns a tuple (content, count), we only need the content
        if isinstance(claude_request, tuple):
            claude_result = claude_request[0]
            # Extract text from Claude's response format
            if hasattr(claude_result, '__iter__') and len(claude_result) > 0:
                # Claude returns a list of content blocks
                text_content = ""
                for block in claude_result:
                    if hasattr(block, 'text'):
                        text_content += block.text
                return jsonify({"result": text_content})
            else:
                return jsonify({"result": str(claude_result)})
        else:
            return jsonify({"result": str(claude_request)})
    
    # If all methods failed
    return jsonify({"error": "Could not process the request"}), 400

@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/")
def sign_up():
    return render_template("signup.html")

@app.route("/login")
def log_in():
    return render_template("login.html")

@app.route("/data", methods=["GET"])
def get_data():
    try:
        prompt = request.args.get("prompt")
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400
        
        print(f"Processing prompt: {prompt}")
        result = handle_requests(prompt)
        print(f"Result: {result}")
        return result
    except Exception as e:
        print(f"Error in /data endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/signup", methods=["POST"])
def signup():
    print("Signup endpoint called")
    
    # Check if Firebase is initialized
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['email', 'password', 'fullName']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({
                    'success': False, 
                    'message': f'{field} is required'
                }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        full_name = data['fullName'].strip()
        
        # Validate email format
        if '@' not in email or '.' not in email.split('@')[1]:
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 6 characters long'
            }), 400
        
        # Check if user already exists
        if email in users_db:
            return jsonify({
                'success': False,
                'message': 'Email already exists'
            }), 400
        
        # Create user
        user_id = f"user_{len(users_db) + 1}"
        users_db[email] = {
            'uid': user_id,
            'email': email,
            'password': password,
            'fullName': full_name
        }
        
        # Generate session token
        session_token = f"token_{user_id}_{len(current_user_sessions)}"
        current_user_sessions[session_token] = user_id
        
        print(f"User created successfully: {email}")
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'user': {
                'uid': user_id,
                'email': email,
                'fullName': full_name
            },
            'idToken': session_token
        }), 201
            
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Check if user exists
        if email not in users_db:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 401
        
        user = users_db[email]
        
        # Check password
        if user['password'] != password:
            return jsonify({
                'success': False,
                'message': 'Invalid password'
            }), 401
        
        # Generate session token
        session_token = f"token_{user['uid']}_{len(current_user_sessions)}"
        current_user_sessions[session_token] = user['uid']
        
        print(f"Login successful for user: {email}")
        print(f"Generated token: {session_token}")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'uid': user['uid'],
                'email': email,
                'fullName': user['fullName']
            },
            'idToken': session_token
        }), 200
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

@app.route("/verify-token", methods=["POST"])
def verify_token():
    try:
        data = request.get_json()
        
        if not data or 'idToken' not in data:
            return jsonify({'success': False, 'message': 'Missing ID token'}), 400
        
        id_token = data['idToken']
        result = verify_id_token(id_token)
        
        if result['success']:
            return jsonify({
                'success': True,
                'user': {
                    'uid': result['uid'],
                    'email': result['email'],
                    'fullName': result['name']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 401
            
    except Exception as e:
        print(f"Token verification error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

# Document management endpoints
@app.route("/documents", methods=["GET"])
def get_documents():
    """Get all documents for the authenticated user"""
    try:
        # Get user ID from Authorization header
        auth_header = request.headers.get('Authorization')
        print(f"Authorization header received: {auth_header}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            print("Missing or invalid Authorization header format")
            return jsonify({'success': False, 'message': 'Authorization required'}), 401
        
        session_token = auth_header.split('Bearer ')[1]
        print(f"Extracted token: {session_token}")
        
        # Verify session token
        if session_token not in current_user_sessions:
            print(f"Invalid session token: {session_token}")
            return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
        
        user_id = current_user_sessions[session_token]
        print(f"Token verified for user: {user_id}")
        
        # Get user documents
        user_docs = []
        for doc_id, doc_data in documents_db.items():
            if doc_data['user_id'] == user_id:
                user_docs.append({
                    'id': doc_id,
                    'title': doc_data['title'],
                    'content': doc_data['content'],
                    'updated_at': doc_data['updated_at']
                })
        
        print(f"Found {len(user_docs)} documents for user {user_id}")
        print(f"Document IDs: {[doc['id'] for doc in user_docs]}")
        
        return jsonify({
            'success': True,
            'documents': user_docs
        }), 200
            
    except Exception as e:
        print(f"Get documents error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

@app.route("/documents", methods=["POST"])
def save_document():
    """Save a document for the authenticated user"""
    try:
        # Get user ID from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Authorization required'}), 401
        
        session_token = auth_header.split('Bearer ')[1]
        
        # Verify session token
        if session_token not in current_user_sessions:
            return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
        
        user_id = current_user_sessions[session_token]
        
        # Get document data
        data = request.get_json()
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'success': False, 'message': 'Title and content are required'}), 400
        
        doc_id = data.get('id', f"doc_{len(documents_db) + 1}")
        title = data['title']
        content = data['content']
        
        # Save document
        documents_db[doc_id] = {
            'user_id': user_id,
            'title': title,
            'content': content,
            'updated_at': '2025-09-14T08:43:00Z'
        }
        
        print(f"Document saved: {doc_id} for user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Document saved successfully',
            'document_id': doc_id
        }), 200
            
    except Exception as e:
        print(f"Save document error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

@app.route("/documents/<doc_id>", methods=["DELETE"])
def delete_document_endpoint(doc_id):
    """Delete a document for the authenticated user"""
    try:
        # Get user ID from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Authorization required'}), 401
        
        session_token = auth_header.split('Bearer ')[1]
        
        # Verify session token
        if session_token not in current_user_sessions:
            return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
        
        user_id = current_user_sessions[session_token]
        
        # Check if document exists and belongs to user
        if doc_id not in documents_db:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        if documents_db[doc_id]['user_id'] != user_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Delete document
        del documents_db[doc_id]
        
        print(f"Document deleted: {doc_id} for user {user_id}")
        print(f"Remaining documents in DB: {list(documents_db.keys())}")
        
        return jsonify({
            'success': True,
            'message': 'Document deleted successfully'
        }), 200
            
    except Exception as e:
        print(f"Delete document error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

@app.route("/documents/<doc_id>", methods=["GET"])
def get_document_endpoint(doc_id):
    """Get a specific document for the authenticated user"""
    try:
        # Get user ID from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Authorization required'}), 401
        
        id_token = auth_header.split('Bearer ')[1]
        token_result = verify_id_token(id_token)
        
        if not token_result['success']:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        
        user_id = token_result['uid']
        result = get_document(user_id, doc_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if 'not found' in result['message'].lower() else 400
            
    except Exception as e:
        print(f"Get document error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

if __name__ == "__main__":
    app.run()