import subprocess
import sys
import time
import urllib.request

BASE_URL = "http://localhost:3000"

def is_server_running(url):
    try:
        response = urllib.request.urlopen(url, timeout=3)
        return response.status in (200, 301, 302, 404)
    except Exception:
        return False

def main():
    print(f"[Selenium E2E] Checking web application server at {BASE_URL}...")
    if not is_server_running(BASE_URL):
        print(f"[Warning] Web app is not reachable on {BASE_URL}.")
        print("[Info] Make sure `npm run dev` or `npm run dev:web` is running.")
    else:
        print(f"[Success] Web app is active on {BASE_URL}.")

    print("\n[Selenium E2E] Running PyTest Selenium Test Suite...")
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/e2e/test_erp_selenium.py",
        "-v",
        "--html=tests/e2e/report.html",
        "--self-contained-html"
    ]
    
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
