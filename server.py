from flask import Flask, render_template, request, jsonify
from waitress import serve
from claude import *
from wolfram import *
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


@app.route("/signup")
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

if __name__ == "__main__":
    app.run()