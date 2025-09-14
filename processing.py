from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import math
import requests
import anthropic
import os

app = Flask(__name__)
CORS(app)

# Initialize APIs
claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY', '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'))
wolfram_api_key = os.getenv('WOLFRAM_API_KEY', '25WVP3AK88')

def handle_requests(prompt):
    """Main processing function: Python -> Wolfram -> Claude"""
    result = ""
    try:
        # Step 1: Try Python evaluation
        result = eval_python(prompt)
        return result
    except Exception as e:
        print(f"Python eval failed: {e}")
        
        # Step 2: Try Wolfram Alpha
        wolf_result = request_wolf(prompt)
        if wolf_result is not None:
            return wolf_result
        
        # Step 3: Try Claude
        claude_result = prompt_claude(prompt)
        if claude_result is not None:
            return claude_result
        
        return f"Error: Could not process '{prompt}'"

def eval_python(prompt):
    """Try to evaluate as Python/math expression"""
    expression = prompt.strip()
    
    # Remove common prefixes
    prefixes = [
        r'^(?:calculate|compute|eval|evaluate)\s+',
        r'^(?:what\s+is|what\'s)\s+',
        r'^(?:solve|find)\s+'
    ]
    
    for prefix in prefixes:
        expression = re.sub(prefix, '', expression, flags=re.IGNORECASE)
    
    # Convert math notation
    expression = expression.replace('^', '**')
    expression = expression.replace('×', '*')
    expression = expression.replace('÷', '/')
    
    # Only allow safe mathematical expressions
    safe_pattern = r'^[\d\s\+\-\*\/\(\)\.\%\*\*]+$'
    if not re.match(safe_pattern, expression):
        raise ValueError("Not a safe mathematical expression")
    
    # Evaluate safely
    result = eval(expression)
    return str(result)

def request_wolf(prompt):
    """Try Wolfram Alpha"""
    # Check if prompt is suitable for Wolfram
    wolfram_patterns = [
        r'\b(?:integral|derivative|limit|solve|equation)\b',
        r'\b(?:convert|conversion|unit)\b',
        r'\b(?:capital|population|area|distance)\s+of\b',
        r'\b(?:chemical|formula|element)\b',
        r'\b(?:when\s+was|who\s+invented)\b'
    ]
    
    is_wolfram = any(re.search(pattern, prompt, re.IGNORECASE) for pattern in wolfram_patterns)
    
    if not is_wolfram:
        return None
    
    if wolfram_api_key == 'your-wolfram-key':
        # Mock responses for demo
        mock_responses = {
            'integral': f'∫{prompt} = [Integration result]',
            'derivative': f'd/dx({prompt}) = [Derivative result]',
            'solve': f'Solution to {prompt}: x = [solution]',
            'convert': f'{prompt} = [conversion result]',
            'capital': f'Capital: [city name]',
            'population': f'Population: [number] people'
        }
        
        for keyword, response in mock_responses.items():
            if keyword.lower() in prompt.lower():
                return f"[DEMO WOLFRAM] {response}"
        
        return None
    
    # Real Wolfram Alpha API call
    try:
        url = "http://api.wolframalpha.com/v1/result"
        params = {'i': prompt, 'appid': wolfram_api_key}
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            return response.text.strip()
        else:
            return None
            
    except Exception as e:
        print(f"Wolfram error: {e}")
        return None

def prompt_claude(prompt):
    """Try Claude API"""
    try:
        message = claude_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
        
    except Exception as e:
        print(f"Claude error: {e}")
        return f"Claude unavailable: {str(e)}"

@app.route('/api/process', methods=['POST'])
def process():
    """Main endpoint that receives the JavaScript array"""
    try:
        data = request.json
        prompts = data.get('prompts', [])
        
        if not prompts:
            return jsonify({'error': 'No prompts provided'}), 400
        
        print(f"Processing {len(prompts)} prompts: {prompts}")
        
        # Process each prompt
        results = []
        for prompt in prompts:
            result = handle_requests(prompt)
            results.append(result)
            print(f"'{prompt}' -> '{result}'")
        
        return jsonify({'results': results})
        
    except Exception as e:
        print(f"Processing error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Python processor ready'})

if __name__ == '__main__':
    print("🐍 Python processor starting...")
    print("📋 Endpoints:")
    print("  POST /api/process - Process prompts array")
    print("  GET  /health     - Health check")
    app.run(debug=True, host='0.0.0.0', port=5000)