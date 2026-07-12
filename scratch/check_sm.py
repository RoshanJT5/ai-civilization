import urllib.request
import json
url = "https://pypi.org/pypi/supermemory/json"
try:
    req = urllib.request.urlopen(url)
    data = json.loads(req.read())
    print("Supermemory versions:")
    print(list(data["releases"].keys()))
except Exception as e:
    print(e)
