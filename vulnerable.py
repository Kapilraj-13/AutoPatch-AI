import os
import sqlite3

def login(username, password):
    """Vulnerability 1: SQL Injection via string concatenation"""
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = (
        "SELECT * FROM users "
        "WHERE username='" + username +
        "' AND password='" + password + "'"
    )
    cursor.execute(query)
    return cursor.fetchone()


def run_command(user_input):
    """Vulnerability 2: Command Injection via os.system"""
    return os.system(user_input)


def dynamic_code(code):
    """Vulnerability 3: Dynamic Code Execution via eval"""
    return eval(code)
