import os
import anthropic

api_key = os.getenv('claude-api', '')

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key=api_key,
)

def prompt_claude(prompt, max_tokens=1024, model="claude-sonnet-4-0"):
    if model not in ("claude-opus-4-1", "claude-opus-4-0", "claude-sonnet-4-0"):
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

        count = client.messages.count_tokens(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": "If the prompt is requesting information or asking a question, provide the information without extra flavor text. If the user is asking for content generation, return it without extra flavor text.\nPrompt:\n" + prompt
                }
            ]
        )
        
        return response.content, count
    except anthropic.BadRequestError as e:
        return None
    except anthropic.AuthenticationError as e:
        return None
    except anthropic.PermissionDeniedError as e:
        return None
    except anthropic.NotFoundError as e:
        return None
    except anthropic.UnprocessableEntityError as e:
        return None
    except anthropic.APIConnectionError as e:
        return None
        # print("The server could not be reached")
        print(e.__cause__)  # an underlying Exception, likely raised within httpx.
    except anthropic.RateLimitError as e:
        return None
        # print("A 429 status code was received; we should back off a bit.")
    except anthropic.InternalServerError as e:
        return None
    except anthropic.APIStatusError as e:
        # print("Another non-200-range status code was received")
        # print(e.status_code)
        # print(e.response)
        return None