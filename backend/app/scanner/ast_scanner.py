import ast
from typing import List, Dict, Any
from .rules import RULES, SecurityRule

class ASTSecurityVisitor(ast.NodeVisitor):
    def __init__(self, filename: str, source_code: str):
        self.filename = filename
        self.source_code = source_code
        self.source_lines = source_code.splitlines()
        self.findings: List[Dict[str, Any]] = []
        self.scope_stack: List[str] = ["<global>"]

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.scope_stack.append(node.name)
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.scope_stack.append(node.name)
        self.generic_visit(node)
        self.scope_stack.pop()

    def _get_line_content(self, lineno: int) -> str:
        if 1 <= lineno <= len(self.source_lines):
            return self.source_lines[lineno - 1].strip()
        return ""

    def _add_finding(self, rule_id: str, node: ast.AST, custom_msg: str = None):
        rule: SecurityRule = RULES.get(rule_id)
        if not rule:
            return
        
        lineno = getattr(node, "lineno", 1)
        end_lineno = getattr(node, "end_lineno", lineno)
        col_offset = getattr(node, "col_offset", 0)

        finding = {
            "id": f"F{len(self.findings) + 1:03d}",
            "file": self.filename,
            "line": lineno,
            "end_line": end_lineno,
            "col": col_offset,
            "rule_id": rule.rule_id,
            "rule_name": rule.name,
            "type": rule.vulnerability_type,
            "severity": rule.severity,
            "description": custom_msg or rule.description,
            "recommendation": rule.recommendation,
            "function": self.scope_stack[-1] if self.scope_stack else "<global>",
            "code_snippet": self._get_line_content(lineno)
        }
        self.findings.append(finding)

    def visit_Call(self, node: ast.Call):
        # 1. eval()
        if isinstance(node.func, ast.Name) and node.func.id == "eval":
            self._add_finding("R003", node, "Dynamic code execution via eval()")

        # 2. exec()
        elif isinstance(node.func, ast.Name) and node.func.id == "exec":
            self._add_finding("R004", node, "Dynamic code execution via exec()")

        # 3. os.system()
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name) and node.func.value.id == "os" and node.func.attr == "system":
                self._add_finding("R002", node, "Arbitrary command execution via os.system()")

            # 4. subprocess call with shell=True
            elif isinstance(node.func.value, ast.Name) and node.func.value.id == "subprocess":
                for kw in node.keywords:
                    if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                        self._add_finding("R005", node, "subprocess execution with shell=True")

            # 5. pickle.loads()
            elif isinstance(node.func.value, ast.Name) and node.func.value.id == "pickle" and node.func.attr == "loads":
                self._add_finding("R007", node, "Insecure object deserialization via pickle.loads()")

            # 6. tempfile.mktemp()
            elif isinstance(node.func.value, ast.Name) and node.func.value.id == "tempfile" and node.func.attr == "mktemp":
                self._add_finding("R008", node, "Insecure temporary file creation via mktemp()")

            # 7. SQL Injection in cursor.execute() or conn.execute()
            elif node.func.attr == "execute":
                if node.args:
                    first_arg = node.args[0]
                    # Check if first arg is string concatenation or formatting
                    if self._is_dynamic_sql(first_arg):
                        self._add_finding("R001", node, "Unparameterized SQL query execution with dynamic string concatenation")

        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        # Check for hardcoded secrets
        for target in node.targets:
            if isinstance(target, ast.Name):
                var_name = target.id.lower()
                if any(secret_kw in var_name for secret_kw in ["password", "secret_key", "api_key", "auth_token"]):
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str) and len(node.value.value) > 3:
                        # Exclude dummy placeholders
                        if not any(placeholder in node.value.value.lower() for placeholder in ["example", "dummy", "placeholder", "xxx"]):
                            self._add_finding("R006", node, f"Potential hardcoded credential assigned to variable '{target.id}'")

        # Also check if a variable named 'query' or 'sql' was built using concatenation
        for target in node.targets:
            if isinstance(target, ast.Name) and any(sql_kw in target.id.lower() for sql_kw in ["query", "sql", "stmt"]):
                if self._is_dynamic_sql(node.value):
                    self._add_finding("R001", node, f"SQL query constructed using dynamic string concatenation in variable '{target.id}'")

        self.generic_visit(node)

    def _is_dynamic_sql(self, node: ast.AST) -> bool:
        if isinstance(node, ast.BinOp):
            if isinstance(node.op, (ast.Add, ast.Mod)):
                return True
        elif isinstance(node, ast.JoinedStr):  # f-string
            return True
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and node.func.attr == "format":
                return True
        return False


def scan_file(filepath: str) -> List[Dict[str, Any]]:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            source_code = f.read()
        tree = ast.parse(source_code, filename=filepath)
        visitor = ASTSecurityVisitor(filepath, source_code)
        visitor.visit(tree)
        return visitor.findings
    except SyntaxError as e:
        return [{
            "id": "SYNTAX_ERR",
            "file": filepath,
            "line": e.lineno or 1,
            "rule_id": "SYNTAX",
            "rule_name": "SYNTAX_ERROR",
            "type": "Syntax Error",
            "severity": "CRITICAL",
            "description": f"Failed to parse AST: {e.msg}",
            "recommendation": "Fix Python syntax error",
            "function": "<unknown>",
            "code_snippet": ""
        }]
    except Exception as e:
        return []
