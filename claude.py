import os
import anthropic

api_key = os.getenv('claude-api', '')

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key=api_key,
)

def prompt_claude(prompt):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Answer the following text without any additional commentary." + prompt
            }
        ]
    )
    return response.content