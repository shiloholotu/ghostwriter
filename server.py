from flask import Flask, render_template, request, jsonify
from waitress import serve
from claude import *
from wolfram import *
app = Flask(__name__)

claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY', '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'))
wolfram_api_key = os.getenv('WOLFRAM_API_KEY', '25WVP3AK88')

def handle_requests(prompt):
    """Main processing function: Python -> Wolfram -> Claude"""
    result = ""
    try:
        result = eval(prompt)
    except Exception as e:
        print(f"Python eval failed. Error: {e}")
        
        wolf_result = request_wolf(prompt)
        if wolf_result is not None:
            result = wolf_result
        else:
            claude_result = prompt_claude(prompt)
            if claude_result is not None:
                result = claude_result
    return result if result else f"Error: Could not process '{prompt}'"

@app.route("/")
def sign_up():
    return render_template("index.html")

@app.route("/login")
def log_in():
    return render_template("login.html")

# @app.route("/data", methods=["GET"])
# def get_data():
#    prompt = request.args.get("prompt")
#    return handle_requests(prompt)

@app.route('/api/process', methods=['POST'])
def process():
    data = request.json
    prompts = data['prompts']
    results = []
    
    for prompt in prompts:
        result = handle_requests(prompt)  # Your function
        results.append(result)
    
    return jsonify({'results': results})

if __name__ == "__main__":
    app.run()