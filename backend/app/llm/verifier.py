import json
from typing import Dict, Any
from .ollama_client import OllamaClient

SYSTEM_VERIFIER_PROMPT = """You are an expert secure-code auditor in the AutoPatch AI framework.
Your task is to analyze static analysis findings, filter out false positives, and determine if an AST security finding is a genuine vulnerability.
Respond ONLY with valid JSON matching this schema:
{
  "is_true_positive": true,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": 0.95,
  "vulnerability_type": "...",
  "reason": "Detailed explanation of why this code is vulnerable or why it is a false positive.",
  "evidence": "Specific code lines or token patterns that prove the vulnerability.",
  "recommendation": "repair" | "ignore"
}
"""

def verify_finding(context: Dict[str, Any], ollama_client: OllamaClient = None) -> Dict[str, Any]:
    """Verifies an AST security finding using Ollama LLM, falling back to deterministic expert logic."""
    client = ollama_client or OllamaClient()
    conn_info = client.check_connection()

    prompt = f"""Evaluate this security finding:
File: {context.get('relative_file')}
Line: {context.get('line')}
Rule ID: {context.get('rule_id')}
Vulnerability Type: {context.get('issue')}
Enclosing Function: {context.get('enclosing_function')}
Target Code:
```python
{context.get('vulnerable_code')}
```

Surrounding Code:
```python
{context.get('surrounding_code')}
```

Determine if this finding is a true positive or false positive. Return strictly JSON."""

    # 1. Try Ollama LLM if online
    if conn_info["connected"] and conn_info["model_available"]:
        result = client.generate_json(prompt, system_prompt=SYSTEM_VERIFIER_PROMPT)
        if result and "is_true_positive" in result:
            result["engine"] = f"Ollama ({conn_info['target_model']})"
            return result

    # 2. Deterministic Fallback Expert Logic
    rule_id = context.get("rule_id")
    vuln_type = context.get("issue", "Security Finding")
    code = context.get("vulnerable_code", "")

    if rule_id == "R001":
        return {
            "is_true_positive": True,
            "severity": "HIGH",
            "confidence": 0.96,
            "vulnerability_type": "SQL Injection",
            "reason": "SQL query is assembled via string concatenation. Unsanitized user parameters directly alter SQL execution logic.",
            "evidence": code,
            "recommendation": "repair",
            "engine": "AutoPatch Verification Engine (Deterministic Security Rule)"
        }
    elif rule_id == "R002":
        return {
            "is_true_positive": True,
            "severity": "HIGH",
            "confidence": 0.94,
            "vulnerability_type": "Command Injection",
            "reason": "os.system() spawns a subshell with unfiltered user input, enabling arbitrary shell command execution.",
            "evidence": code,
            "recommendation": "repair",
            "engine": "AutoPatch Verification Engine (Deterministic Security Rule)"
        }
    elif rule_id in ["R003", "R004"]:
        return {
            "is_true_positive": True,
            "severity": "CRITICAL",
            "confidence": 0.99,
            "vulnerability_type": "Dynamic Code Execution",
            "reason": f"Call to '{code.split('(')[0]}' parses and executes arbitrary Python statements within the current process runtime.",
            "evidence": code,
            "recommendation": "repair",
            "engine": "AutoPatch Verification Engine (Deterministic Security Rule)"
        }
    elif rule_id == "R005":
        return {
            "is_true_positive": True,
            "severity": "HIGH",
            "confidence": 0.92,
            "vulnerability_type": "Command Injection",
            "reason": "subprocess call with shell=True bypasses argument escaping and is vulnerable to shell metacharacters.",
            "evidence": code,
            "recommendation": "repair",
            "engine": "AutoPatch Verification Engine (Deterministic Security Rule)"
        }
    elif rule_id == "R006":
        return {
            "is_true_positive": True,
            "severity": "MEDIUM",
            "confidence": 0.88,
            "vulnerability_type": "Hardcoded Credential",
            "reason": "Secret literal embedded directly in source code will be exposed in version control history.",
            "evidence": code,
            "recommendation": "repair",
            "engine": "AutoPatch Verification Engine (Deterministic Security Rule)"
        }

    return {
        "is_true_positive": True,
        "severity": context.get("severity", "MEDIUM"),
        "confidence": 0.85,
        "vulnerability_type": vuln_type,
        "reason": f"AST detected pattern violating rule {rule_id}.",
        "evidence": code,
        "recommendation": "repair",
        "engine": "AutoPatch Verification Engine (Deterministic Security Rule)"
    }
