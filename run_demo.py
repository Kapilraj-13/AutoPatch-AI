"""
AutoPatch AI — One-Click Prototype Runner
Starts the FastAPI backend and serves the compiled React dashboard on http://localhost:8000
"""

import sys
import os
import uvicorn

def main():
    banner = """
======================================================================
                         ⚡ AUTOPATCH AI ⚡
       Agentic AI Framework for Intelligent Code Repair
======================================================================

  [1] Web Interface:   http://localhost:8000
  [2] Interactive API: http://localhost:8000/docs
  [3] Target Project:  ./test_project/vulnerable.py

  Core Actions Supported:
    🔍  DETECT ERROR   -> Non-invasive AST scan + context + LLM verify
    🛠️  DEBUG & PUSH   -> Closed-loop repair + pytest + re-scan + git
    ✅  VERIFY & PUSH  -> Clean project verification + git push

======================================================================
"""
    print(banner)
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
