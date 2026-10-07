import sqlite3
import os
from vulnerable import login, run_command, dynamic_code

def setup_module():
    """Create a temporary test sqlite database"""
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)")
    cursor.execute("DELETE FROM users")
    cursor.execute("INSERT INTO users VALUES ('admin', 'secret123')")
    cursor.execute("INSERT INTO users VALUES ('alice', 'alicepass')")
    conn.commit()
    conn.close()

def teardown_module():
    """Clean up test database"""
    if os.path.exists("users.db"):
        try:
            os.remove("users.db")
        except Exception:
            pass

def test_login_valid():
    user = login('admin', 'secret123')
    assert user is not None
    assert user[0] == 'admin'

def test_login_invalid():
    user = login('admin', 'wrongpassword')
    assert user is None

def test_dynamic_code():
    res = dynamic_code("2 + 3")
    assert res == 5
