from pprint import pprint
import requests
from dotenv import load_dotenv
import os
import urllib.parse
load_dotenv()

def request_wolf(prompt):
    try:
        appid = os.getenv('WA_APPID')
        query = urllib.parse.quote_plus(prompt)
        query_url = f"http://api.wolframalpha.com/v2/query?" \
             f"appid={appid}" \
             f"&input={query}" \
             f"&format=plaintext" \
             f"&output=json"
        r = requests.get(query_url).json()
        
        if r["queryresult"]["success"] == True:
            plaintext = r["queryresult"]["pods"][1]["subpods"][0]["plaintext"]
            return plaintext
    except requests.exceptions.Timeout:
        print("The request timed out.")
    except requests.exceptions.ConnectionError:
        print("Failed to connect to the server.")
    except requests.exceptions.HTTPError as e:
        print("HTTP error occurred:", e)
    except requests.exceptions.RequestException as e:
        print("Some other request error occurred:", e)
    
    return None
