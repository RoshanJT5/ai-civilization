import urllib.request
import json
try:
    req = urllib.request.urlopen("https://pypi.org/pypi/supermemory-client/json")
    print("Found supermemory-client")
except Exception as e:
    print("supermemory-client:", e)

try:
    req = urllib.request.urlopen("https://pypi.org/pypi/supermemory/json")
    print("Found supermemory")
except Exception as e:
    print("supermemory:", e)
