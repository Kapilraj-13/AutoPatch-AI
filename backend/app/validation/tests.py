import subprocess
import sys
from pathlib import Path
from typing import Dict, Any

def run_tests(project_dir: str) -> Dict[str, Any]:
    """Runs pytest on the specified directory."""
    path = Path(project_dir)
    test_files = list(path.glob("test_*.py")) + list(path.glob("*_test.py"))
    
    if not test_files:
        return {
            "passed": True,
            "tests_found": False,
            "message": "No unit tests found in directory. Test verification skipped."
        }

    cmd = [sys.executable, "-m", "pytest", "-v", str(path)]
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(path),
            capture_output=True,
            text=True,
            timeout=30
        )
        passed = proc.returncode == 0
        return {
            "passed": passed,
            "tests_found": True,
            "returncode": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "message": "All unit tests passed!" if passed else "Unit tests failed."
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "tests_found": True,
            "error": "Pytest execution timed out after 30 seconds."
        }
    except Exception as e:
        return {
            "passed": False,
            "tests_found": True,
            "error": f"Failed to execute pytest: {str(e)}"
        }
