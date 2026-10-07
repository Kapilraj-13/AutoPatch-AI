import os
import sqlite3

def login(username, password):
    """Vulnerability 1: SQL Injection via string concatenation"""
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # AutoPatch AI Fix: Parameterized query to prevent SQL Injection
    query = "SELECT * FROM users WHERE username = ? AND password = ?"
    cursor.execute(query, (username, password))
    return cursor.fetchone()


def run_command(user_input):
    """Vulnerability 2: Command Injection via os.system"""
    # AutoPatch AI Fix: Secure execution using subprocess with argument separation
    import shlex
    import subprocess
    cmd = shlex.split(user_input) if isinstance(user_input, str) else user_input
    res = subprocess.run(cmd, shell=False, capture_output=True, text=True)
    return res.returncode


def dynamic_code(code):
    """Vulnerability 3: Dynamic Code Execution via eval"""
    # AutoPatch AI Fix: Safe AST arithmetic parser replacing unsafe eval()
    import ast
    import operator
    ops = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}
    try:
        def _safe_eval(node):
            if isinstance(node, ast.Constant):
                return node.value
            elif isinstance(node, ast.BinOp):
                return ops[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
            raise ValueError("Unsupported operation")
        tree = ast.parse(code, mode='eval')
        return _safe_eval(tree.body)
    except Exception:
        return None
