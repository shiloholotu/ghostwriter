from pprint import pprint
import requests
from dotenv import load_dotenv
import os
import urllib.parse
load_dotenv()

def request_wolf(prompt):
    appid = os.getenv('WA_APPID')
    query = urllib.parse.quote_plus(prompt)
    query_url = f"http://api.wolframalpha.com/v2/query?" \
             f"appid={appid}" \
             f"&input={query}" \
             f"&format=plaintext" \
             f"&output=json"
    r = requests.get(query_url).json()
    print(r)
    plaintext = r["queryresult"]["pods"][1]["subpods"][0]["plaintext"]
    return plaintext