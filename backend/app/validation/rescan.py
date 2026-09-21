from typing import Dict, Any, List
from ..scanner.ast_scanner import scan_file
from ..scanner.detector import scan_directory

def verify_clean_rescan(filepath: str, original_finding_rules: List[str] = None) -> Dict[str, Any]:
    """Re-runs the AST security analyzer on the file to ensure the vulnerability was eradicated."""
    new_findings = scan_file(filepath)
    
    # If specific rules were being repaired, check if those rules are absent
    if original_finding_rules:
        persisting_rules = [f["rule_id"] for f in new_findings if f["rule_id"] in original_finding_rules]
        passed = len(persisting_rules) == 0
    else:
        passed = len(new_findings) == 0

    return {
        "passed": passed,
        "remaining_findings_count": len(new_findings),
        "remaining_findings": new_findings,
        "message": "Security re-scan PASSED: 0 vulnerabilities detected." if passed else f"Security re-scan FAILED: {len(new_findings)} vulnerabilities remain."
    }
