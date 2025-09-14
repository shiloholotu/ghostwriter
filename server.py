from flask import Flask, render_template, request, jsonify
from waitress import serve
from claude import *
from wolfram import *
from firebase_config import initialize_firebase, create_user, verify_id_token, get_user_by_email, verify_password

app = Flask(__name__)

def handle_requests(prompt):
    result = ""
    try:
        result = eval(prompt)
    except (SyntaxError, NameError, ZeroDivisionError) as e:
        print("Error:", e)
    else:
        return result
    
    wolf_request = request_wolf(prompt)

    if wolf_request != None:
        result = wolf_request
    else:
        claude_request = prompt_claude(prompt)

        if claude_request != None:
            result = claude_request

    return result

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
    prompt = request.args.get("prompt")
    return handle_requests(prompt)

@app.route("/signup", methods=["POST"])
def signup():
    print("GOT HERE")
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['fullName', 'email', 'password']):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        full_name = data['fullName']
        email = data['email']
        password = data['password']
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        if '@' not in email:
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        result = create_user(email, password, full_name)
        
        if result['success']:
            print(f"New user created with Firebase: {email}")
            return jsonify({
                'success': True, 
                'message': 'Account created successfully',
                'user': {
                    'uid': result['uid'],
                    'fullName': result['display_name'],
                    'email': result['email']
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400    
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['email', 'password']):
            return jsonify({'success': False, 'message': 'Missing email or password'}), 400
        
        email = data['email']
        password = data['password']
        

        user_result = get_user_by_email(email)
        
        if user_result['success']:
            password_result = verify_password(email, password)
            
            if password_result['success']:
                print(f"User login successful: {email}")
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'uid': user_result['uid'],
                        'email': user_result['email'],
                        'fullName': user_result['display_name']
                    }
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Invalid email or password'
                }), 401
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
            
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

if __name__ == "__main__":
    initialize_firebase()
    app.run()