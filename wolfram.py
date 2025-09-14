from pprint import pprint
import requests
from dotenv import load_dotenv
import os
import urllib.parse
load_dotenv()

def request_wolf(prompt):
    try:
        appid = os.getenv('appid')
        query = urllib.parse.quote_plus(prompt)
        query_url = f"http://api.wolframalpha.com/v2/query?appid={appid}" \
             f"&input={query}" \
             f"&format=plaintext" \
             f"&output=json"
        r = requests.get(query_url, timeout=10)
        data = r.json()
        
        # DEBUG: Print what we actually get
        print("Wolfram response:", data)
        
        if data.get("queryresult", {}).get("success"):
            pods = data["queryresult"].get("pods", [])
            if len(pods) > 1 and pods[1].get("subpods"):
                plaintext = pods[1]["subpods"][0].get("plaintext")
                return plaintext
        
        return None
    except Exception as e:
        print(f"Wolfram error: {e}")
        return None
