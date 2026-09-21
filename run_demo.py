import sys
import os

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import uvicorn

def main():
    banner = """
======================================================================
                         [+] AUTOPATCH AI [+]
       Agentic AI Framework for Intelligent Code Repair
======================================================================

  [1] Web Interface:   http://localhost:8000
  [2] Interactive API: http://localhost:8000/docs
  [3] Target Project:  ./test_project/vulnerable.py

  Core Actions:
    [1] DETECT ERROR   -> Non-invasive AST scan + context + LLM verify
    [2] DEBUG & PUSH   -> Closed-loop repair + pytest + re-scan + git
    [3] VERIFY & PUSH  -> Clean project verification + git push

======================================================================
"""
    try:
        print(banner)
    except Exception:
        print("AutoPatch AI starting on http://localhost:8000")

    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
