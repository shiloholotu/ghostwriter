from pprint import pprint
import requests
from dotenv import load_dotenv
import os
import urllib.parse
load_dotenv()


def request_wolf(prompt):
    try:
        print(f"Making Wolfram Alpha request for: {prompt}")
        
        appid = os.getenv('WA_APPID') or os.getenv('appid')
        if not appid:
            print("Wolfram Alpha API key not found")
            return None

        query = urllib.parse.quote_plus(prompt)
        query_url = f"http://api.wolframalpha.com/v2/query?" \
            f"appid={appid}" \
            f"&input={query}" \
            f"&format=plaintext" \
            f"&output=json"
        
        response = requests.get(query_url)
        print(f"Wolfram Alpha response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Wolfram Alpha API returned status code: {response.status_code}")
            return None
        
        try:
            r = response.json()
            print(f"Wolfram Alpha response keys: {list(r.keys())}")
        except Exception as json_error:
            print(f"Failed to parse JSON response: {json_error}")
            print(f"Raw response: {response.text}")
            return None
        
        # Check if the response has the expected structure
        if "queryresult" not in r:
            print("Wolfram Alpha response missing 'queryresult' key")
            print(f"Full response: {r}")
            return None

        queryresult = r["queryresult"]
        print(f"Query result success: {queryresult.get('success', 'Unknown')}")
        
        if queryresult.get("success") == True and "pods" in queryresult:
            pods = queryresult["pods"]
            print(f"Number of pods: {len(pods)}")
            if len(pods) > 1 and "subpods" in pods[1]:
                subpods = pods[1]["subpods"]
                if len(subpods) > 0 and "plaintext" in subpods[0]:
                    plaintext = subpods[0]["plaintext"]
                    if plaintext:
                        print(f"Wolfram Alpha result: {plaintext}")
                        return plaintext

        print("Wolfram Alpha could not process the query or returned no results")
        return None

    except Exception as e:
        print(f"Complete Wolfram Alpha error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
