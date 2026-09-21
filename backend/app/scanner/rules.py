from dataclasses import dataclass
from typing import Dict

@dataclass
class SecurityRule:
    rule_id: str
    name: str
    vulnerability_type: str
    severity: str  # HIGH, MEDIUM, LOW
    description: str
    recommendation: str

RULES: Dict[str, SecurityRule] = {
    "R001": SecurityRule(
        rule_id="R001",
        name="SQL_DYNAMIC_EXECUTION",
        vulnerability_type="SQL Injection",
        severity="HIGH",
        description="String formatting or concatenation used in SQL query execution without parameterization.",
        recommendation="Use parameterized queries with placeholder binding (e.g. cursor.execute(query, (params,)))."
    ),
    "R002": SecurityRule(
        rule_id="R002",
        name="OS_SYSTEM_CALL",
        vulnerability_type="Command Injection",
        severity="HIGH",
        description="Invoking shell commands via os.system allows arbitrary command execution if user input is untrusted.",
        recommendation="Use subprocess.run(..., shell=False) with an argument list or validate against an allowlist."
    ),
    "R003": SecurityRule(
        rule_id="R003",
        name="EVAL_EXECUTION",
        vulnerability_type="Dynamic Code Execution",
        severity="CRITICAL",
        description="Dynamic code evaluation using eval() parses and executes arbitrary Python code.",
        recommendation="Use ast.literal_eval() for safe literal parsing or replace with structured logic."
    ),
    "R004": SecurityRule(
        rule_id="R004",
        name="EXEC_EXECUTION",
        vulnerability_type="Dynamic Code Execution",
        severity="CRITICAL",
        description="Dynamic code execution using exec() executes statements directly in Python runtime.",
        recommendation="Avoid exec(); refactor to use standard functions, dictionaries, or dispatch tables."
    ),
    "R005": SecurityRule(
        rule_id="R005",
        name="SUBPROCESS_SHELL_TRUE",
        vulnerability_type="Command Injection",
        severity="HIGH",
        description="subprocess call initiated with shell=True bypasses argument escaping and is vulnerable to shell injection.",
        recommendation="Set shell=False and pass arguments as a list."
    ),
    "R006": SecurityRule(
        rule_id="R006",
        name="HARDCODED_SECRET",
        vulnerability_type="Hardcoded Credential",
        severity="MEDIUM",
        description="Hardcoded password, secret key, or token detected directly in source code.",
        recommendation="Load secrets from environment variables (os.getenv) or secret managers."
    ),
    "R007": SecurityRule(
        rule_id="R007",
        name="UNSAFE_DESERIALIZATION",
        vulnerability_type="Insecure Deserialization",
        severity="HIGH",
        description="Unpickling untrusted data using pickle.loads() can execute arbitrary code during object reconstruction.",
        recommendation="Use safer serialization formats such as JSON or Protocol Buffers."
    ),
    "R008": SecurityRule(
        rule_id="R008",
        name="INSECURE_TEMP_FILE",
        vulnerability_type="Insecure Temporary File",
        severity="LOW",
        description="mktemp() creates insecure temporary files prone to race conditions and symlink attacks.",
        recommendation="Use tempfile.NamedTemporaryFile() or tempfile.TemporaryDirectory()."
    ),
}
