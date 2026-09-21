import ast
from pathlib import Path
from typing import Dict, Any, List

class ContextExtractor(ast.NodeVisitor):
    def __init__(self, target_line: int):
        self.target_line = target_line
        self.imports = []
        self.enclosing_function = "<global>"
        self.enclosing_class = None
        self.function_args = []
        self.variables_in_scope = set()
        self.function_source_range = None

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        module = node.module or ""
        for alias in node.names:
            self.imports.append(f"{module}.{alias.name}" if module else alias.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        if node.lineno <= self.target_line <= getattr(node, "end_lineno", node.lineno):
            self.enclosing_class = node.name
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        end_line = getattr(node, "end_lineno", node.lineno)
        if node.lineno <= self.target_line <= end_line:
            self.enclosing_function = node.name
            self.function_source_range = (node.lineno, end_line)
            for arg in node.args.args:
                self.function_args.append(arg.arg)
                self.variables_in_scope.add(arg.arg)
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name):
        if hasattr(node, "lineno") and abs(node.lineno - self.target_line) <= 5:
            self.variables_in_scope.add(node.id)
        self.generic_visit(node)


def build_finding_context(finding: Dict[str, Any], context_lines_count: int = 5) -> Dict[str, Any]:
    """Extracts structural context around a vulnerability finding using AST and source code slicing."""
    filepath = finding.get("file")
    line_no = finding.get("line", 1)

    if not filepath or not Path(filepath).exists():
        return {**finding, "context_available": False}

    with open(filepath, "r", encoding="utf-8") as f:
        source = f.read()

    lines = source.splitlines()
    total_lines = len(lines)

    # Calculate window
    start_line = max(1, line_no - context_lines_count)
    end_line = min(total_lines, line_no + context_lines_count)

    surrounding_lines = lines[start_line - 1: end_line]
    surrounding_code = "\n".join(surrounding_lines)

    # AST analysis for enclosing function, imports, and variables
    extractor = ContextExtractor(target_line=line_no)
    try:
        tree = ast.parse(source, filename=filepath)
        extractor.visit(tree)
    except Exception:
        pass

    function_code = ""
    if extractor.function_source_range:
        fn_start, fn_end = extractor.function_source_range
        function_code = "\n".join(lines[fn_start - 1: fn_end])

    return {
        "finding_id": finding.get("id"),
        "file": filepath,
        "relative_file": finding.get("relative_file", Path(filepath).name),
        "line": line_no,
        "issue": finding.get("type"),
        "rule": finding.get("rule_name"),
        "rule_id": finding.get("rule_id"),
        "severity": finding.get("severity"),
        "vulnerable_code": finding.get("code_snippet"),
        "enclosing_function": extractor.enclosing_function,
        "enclosing_class": extractor.enclosing_class,
        "function_args": extractor.function_args,
        "variables": sorted(list(extractor.variables_in_scope)),
        "imports": extractor.imports,
        "surrounding_code": surrounding_code,
        "function_code": function_code or surrounding_code,
        "full_source": source
    }


def build_contexts_for_findings(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [build_finding_context(f) for f in findings]
