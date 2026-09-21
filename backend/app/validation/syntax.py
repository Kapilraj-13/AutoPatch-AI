import py_compile
import ast
from pathlib import Path
from typing import Dict, Any

def check_syntax(filepath: str) -> Dict[str, Any]:
    path = Path(filepath)
    if not path.exists():
        return {"passed": False, "error": f"File not found: {filepath}"}

    # 1. AST parse check
    try:
        with open(path, "r", encoding="utf-8") as f:
            code = f.read()
        ast.parse(code, filename=filepath)
    except SyntaxError as e:
        return {
            "passed": False,
            "error": f"AST SyntaxError at line {e.lineno}: {e.msg}",
            "line": e.lineno
        }
    except Exception as e:
        return {"passed": False, "error": str(e)}

    # 2. py_compile check
    try:
        py_compile.compile(filepath, doraise=True)
    except py_compile.PyCompileError as e:
        return {"passed": False, "error": f"Compilation failed: {e.msg}"}

    return {"passed": True, "message": "Python syntax verification passed successfully."}
