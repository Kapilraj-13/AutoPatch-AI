import os
import zipfile
from pathlib import Path

# Create a realistic test project directory structure
project_files = {
    "auth_service.py": '''import sqlite3

DATABASE = "users.db"
INTERNAL_DEV_TOKEN = "local_dev_token_sample_12345"

def get_user_by_username(username: str):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    # SQL Injection vulnerability (R001)
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    return user

def authenticate_user(username: str, token: str):
    if token == INTERNAL_DEV_TOKEN:
        return get_user_by_username(username)
    return None
''',

    "system_utils.py": '''import os
import subprocess

def ping_server(hostname: str):
    # Command Injection vulnerability (R002)
    command = "ping -c 1 " + hostname
    os.system(command)
    return {"status": "pinged", "host": hostname}

def read_system_report(filename: str):
    # Command Injection vulnerability (R002)
    os.system("cat reports/" + filename)
    return True
''',

    "calculator.py": '''def compute_expression(expr: str):
    # Dynamic execution vulnerability (R003)
    return eval(expr)

def safe_add(a: int, b: int):
    return a + b
''',

    "test_services.py": '''import pytest
from calculator import safe_add, compute_expression
from system_utils import ping_server

def test_safe_add():
    assert safe_add(10, 20) == 30

def test_compute_expression():
    assert compute_expression("5 * 5") == 25

def test_ping_server():
    res = ping_server("127.0.0.1")
    assert res["status"] == "pinged"
'''
}

zip_filename = "sample_vulnerable_project.zip"
with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
    for filename, content in project_files.items():
        zipf.writestr(filename, content)

print(f"Created '{zip_filename}' successfully with {len(project_files)} files!")
