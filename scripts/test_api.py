import requests

url = "http://localhost:3002/telemedicine/api/daily/top-performance"
try:
    print(f"Fetching {url}...")
    res = requests.get(url, timeout=10)
    print(f"Status: {res.status_code}")
    data = res.json()
    print("Hospitals count:", len(data.get("hospitals", [])))
    print("Primary Care count:", len(data.get("primaryCare", [])))
    if data.get("hospitals"):
        print("Sample hospital:", data["hospitals"][0])
except Exception as e:
    print(f"Error: {e}")
