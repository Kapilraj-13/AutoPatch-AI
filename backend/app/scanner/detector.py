import os
from pathlib import Path
from typing import List, Dict, Any
from .ast_scanner import scan_file
from .rules import RULES

def scan_directory(directory_path: str) -> Dict[str, Any]:
    """Recursively scans a directory for Python files and applies AST security analysis."""
    path = Path(directory_path)
    if not path.exists():
        return {"error": f"Path '{directory_path}' does not exist.", "findings": [], "stats": {}}

    py_files = []
    if path.is_file():
        if path.suffix == ".py":
            py_files.append(path)
    else:
        for root, dirs, files in os.walk(path):
            # Skip hidden dirs, virtualenvs, __pycache__, .git
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["__pycache__", "venv", "node_modules", ".pytest_cache"]]
            for file in files:
                if file.endswith(".py") and not file.startswith("test_") and not file.endswith(".original.py"):
                    py_files.append(Path(root) / file)

    all_findings = []
    for py_file in py_files:
        findings = scan_file(str(py_file))
        # Make file path relative for clean presentation
        for f in findings:
            try:
                f["relative_file"] = os.path.relpath(f["file"], directory_path)
            except Exception:
                f["relative_file"] = os.path.basename(f["file"])
        all_findings.extend(findings)

    # Re-index finding IDs globally
    for idx, f in enumerate(all_findings, start=1):
        f["id"] = f"F{idx:03d}"

    stats = {
        "files_scanned": len(py_files),
        "total_rules_applied": len(RULES),
        "total_findings": len(all_findings),
        "high_severity": sum(1 for f in all_findings if f["severity"] in ["HIGH", "CRITICAL"]),
        "medium_severity": sum(1 for f in all_findings if f["severity"] == "MEDIUM"),
        "low_severity": sum(1 for f in all_findings if f["severity"] == "LOW"),
    }

    return {
        "target_directory": str(path),
        "stats": stats,
        "findings": all_findings
    }
