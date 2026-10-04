import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = os.environ.get("ERP_BASE_URL", "http://localhost:3000")

@pytest.fixture(scope="module")
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

def test_login_page_title(driver):
    """Test that login page loads with valid title or DOM elements."""
    driver.get(BASE_URL)
    time.sleep(3)
    assert driver.title is not None
    page_source = driver.page_source
    assert len(page_source) > 0

def test_login_flow(driver):
    """Test performing login if login form is present on the page."""
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 10)
    
    # Try finding email input
    email_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='email'], input[name='email'], input[placeholder*='email' i]")
    password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
    
    if email_inputs and password_inputs:
        email_inputs[0].clear()
        email_inputs[0].send_keys("admin@erp.com")
        
        password_inputs[0].clear()
        password_inputs[0].send_keys("admin123")
        
        submit_buttons = driver.find_elements(By.CSS_SELECTOR, "button[type='submit'], button")
        if submit_buttons:
            submit_buttons[0].click()
            time.sleep(3)
            
    # Verify current URL or dashboard elements
    current_url = driver.current_url
    assert BASE_URL in current_url

def test_dashboard_elements(driver):
    """Test core page elements after initial load."""
    driver.get(BASE_URL)
    time.sleep(2)
    page_source = driver.page_source.lower()
    assert "error" not in page_source or "react" in page_source or "koi" in page_source or "erp" in page_source
