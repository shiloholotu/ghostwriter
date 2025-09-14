import os
import anthropic
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('ANTHROPIC_API_KEY')

if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in environment variables")
    exit(1)

client = anthropic.Anthropic(
    api_key=api_key,
)

def prompt_claude(prompt, max_tokens=1024, model="claude-sonnet-4-0"):
    if not api_key:
        print("No API key available")
        return None
    
    valid_models = ("claude-opus-4-1", "claude-opus-4-0", "claude-sonnet-4-0")
    if model not in valid_models:
        model = "claude-sonnet-4-0"
    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": "If the prompt is requesting information or asking a question, provide the information without extra flavor text. If the user is asking for content generation, return it without extra flavor text.\nPrompt:\n" + prompt
                }
            ]
        )
        
        # return just the text content
        return response.content[0].text
        
    except Exception as e:
        print(f"Claude API error: {e}")
        return None