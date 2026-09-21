import difflib
from typing import Dict, Any, Tuple
from .ollama_client import OllamaClient

SYSTEM_REPAIR_PROMPT = """You are an automated secure-code repair agent in the AutoPatch AI system.
Given a verified vulnerability and surrounding context, generate the smallest safe patch.
Requirements:
1. Preserve existing business logic and unit test compatibility.
2. Fix ONLY the security issue.
3. Return valid JSON only with keys: "fixed_file_content", "explanation", "summary".
"""

def generate_patch(context: Dict[str, Any], current_source: str = None, ollama_client: OllamaClient = None) -> Dict[str, Any]:
    """Generates a secure replacement patch for the target file."""
    client = ollama_client or OllamaClient()
    conn_info = client.check_connection()
    filepath = context.get("file")

    if current_source is not None:
        full_source = current_source
    elif filepath and Path(filepath).exists():
        with open(filepath, "r", encoding="utf-8") as f:
            full_source = f.read()
    else:
        full_source = context.get("full_source", "")

    full_source = full_source.replace("\r\n", "\n")

    # 1. Try Ollama LLM if available
    if conn_info["connected"] and conn_info["model_available"]:
        user_prompt = f"""Vulnerability: {context.get('issue')} (Rule {context.get('rule_id')})
File: {context.get('relative_file')}
Line: {context.get('line')}
Vulnerable snippet: {context.get('vulnerable_code')}
Surrounding context:
{context.get('surrounding_code')}

Complete file content:
```python
{full_source}
```

Generate the secure repaired version of the complete file. Return JSON."""
        result = client.generate_json(user_prompt, system_prompt=SYSTEM_REPAIR_PROMPT)
        if result and "fixed_file_content" in result:
            fixed_code = result["fixed_file_content"]
            diff = _compute_diff(full_source, fixed_code, context.get("relative_file", "file.py"))
            return {
                "file": filepath,
                "relative_file": context.get("relative_file"),
                "original_code": full_source,
                "fixed_code": fixed_code,
                "diff": diff,
                "explanation": result.get("explanation", "LLM-generated patch addressing vulnerability."),
                "engine": f"Ollama ({conn_info['target_model']})"
            }

    # 2. Deterministic Fallback Repair Generator
    fixed_code, explanation = _deterministic_repair(full_source, context)
    diff = _compute_diff(full_source, fixed_code, context.get("relative_file", "file.py"))

    return {
        "file": filepath,
        "relative_file": context.get("relative_file"),
        "original_code": full_source,
        "fixed_code": fixed_code,
        "diff": diff,
        "explanation": explanation,
        "engine": "AutoPatch AI Deterministic Repair Engine"
    }


def _deterministic_repair(source: str, context: Dict[str, Any]) -> Tuple[str, str]:
    rule_id = context.get("rule_id")

    # Repair 1: SQL Injection (R001)
    if rule_id == "R001":
        # Target: login query concatenation
        if "query =" in source and "cursor.execute(query)" in source:
            old_block = """    query = (
        "SELECT * FROM users "
        "WHERE username='" + username +
        "' AND password='" + password + "'"
    )
    cursor.execute(query)"""
            new_block = """    # AutoPatch AI Fix: Parameterized query to prevent SQL Injection
    query = "SELECT * FROM users WHERE username = ? AND password = ?"
    cursor.execute(query, (username, password))"""
            if old_block in source:
                return source.replace(old_block, new_block), "Replaced dynamic SQL string concatenation with secure parameterized query binding."

    # Repair 2: Command Injection (R002)
    if rule_id == "R002":
        if "return os.system(user_input)" in source:
            old_block = "return os.system(user_input)"
            new_block = """# AutoPatch AI Fix: Secure execution using subprocess with argument separation
    import shlex
    import subprocess
    cmd = shlex.split(user_input) if isinstance(user_input, str) else user_input
    res = subprocess.run(cmd, shell=False, capture_output=True, text=True)
    return res.returncode"""
            return source.replace(old_block, new_block), "Replaced os.system() with subprocess.run(shell=False) and safe tokenized arguments."

    # Repair 3: Dynamic Code Execution eval() (R003)
    if rule_id == "R003":
        if "return eval(code)" in source:
            old_block = "return eval(code)"
            new_block = """# AutoPatch AI Fix: Safe AST arithmetic parser replacing unsafe eval()
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
        return None"""
            return source.replace(old_block, new_block), "Replaced unsafe eval() with a strictly bounded AST arithmetic evaluator."

    return source, "No automated transform available for this rule."


def _compute_diff(original: str, modified: str, filename: str) -> str:
    orig_lines = original.splitlines(keepends=True)
    mod_lines = modified.splitlines(keepends=True)
    diff = difflib.unified_diff(
        orig_lines, mod_lines,
        fromfile=f"a/{filename}",
        tofile=f"b/{filename}",
        n=3
    )
    return "".join(diff)
