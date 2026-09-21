import os
import shutil
import time
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .core.config import TEST_PROJECT_DIR, BASE_DIR
from .scanner.detector import scan_directory
from .scanner.rules import RULES
from .context.builder import build_contexts_for_findings
from .llm.ollama_client import OllamaClient
from .llm.verifier import verify_finding
from .llm.repair_agent import generate_patch
from .patch.applier import PatchApplier
from .validation.syntax import check_syntax
from .validation.tests import run_tests
from .validation.rescan import verify_clean_rescan
from .git.manager import GitManager

app = FastAPI(
    title="AutoPatch AI Backend API",
    description="Agentic AI Framework for Intelligent Code Error Detection and Automated Repair",
    version="1.0.0"
)

# Enable CORS for Vite frontend (typically localhost:5173 or 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ollama_client = OllamaClient()
patch_applier = PatchApplier()
git_manager = GitManager(repo_dir=str(TEST_PROJECT_DIR))

# In-memory run history
RUN_HISTORY: List[Dict[str, Any]] = []

class ScanRequest(BaseModel):
    target_path: Optional[str] = None

class DebugRequest(BaseModel):
    target_path: Optional[str] = None
    auto_push: Optional[bool] = True

class VerifyPushRequest(BaseModel):
    target_path: Optional[str] = None
    commit_message: Optional[str] = "chore: verified clean codebase passed security scan"


@app.get("/api/status")
def get_system_status():
    """System health check, LLM connectivity, and Git status."""
    ollama_info = ollama_client.check_connection()
    git_info = git_manager.get_git_status()
    return {
        "status": "online",
        "framework": "AutoPatch AI",
        "llm_service": ollama_info,
        "git_status": git_info,
        "rules_count": len(RULES),
        "target_project": str(TEST_PROJECT_DIR)
    }


@app.get("/api/project/files")
def get_project_files():
    """List source files in the target project."""
    vulnerable_file = TEST_PROJECT_DIR / "vulnerable.py"
    test_file = TEST_PROJECT_DIR / "test_vulnerable.py"
    
    files = []
    if vulnerable_file.exists():
        with open(vulnerable_file, "r", encoding="utf-8") as f:
            files.append({"name": "vulnerable.py", "content": f.read(), "type": "target"})
    if test_file.exists():
        with open(test_file, "r", encoding="utf-8") as f:
            files.append({"name": "test_vulnerable.py", "content": f.read(), "type": "test"})
            
    return {"files": files, "project_dir": str(TEST_PROJECT_DIR)}


@app.post("/api/project/reset")
def reset_project():
    """Resets vulnerable.py to its original vulnerable state for repeated live demo runs."""
    orig = TEST_PROJECT_DIR / "vulnerable.original.py"
    target = TEST_PROJECT_DIR / "vulnerable.py"
    if orig.exists():
        shutil.copy(orig, target)
        return {"success": True, "message": "test_project/vulnerable.py has been reset to original vulnerable state."}
    return {"success": False, "message": "Original backup not found."}


UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

@app.post("/api/projects/upload")
async def upload_project_zip(file: UploadFile = File(...)):
    """Accepts a ZIP file (e.g. 40MB+), extracts it into uploads/extracted/, and prepares it for scanning."""
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")
    
    zip_dest = UPLOADS_DIR / file.filename
    with open(zip_dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    extract_folder = UPLOADS_DIR / "extracted" / Path(file.filename).stem
    extract_folder.mkdir(parents=True, exist_ok=True)
    
    try:
        with zipfile.ZipFile(zip_dest, "r") as zip_ref:
            zip_ref.extractall(extract_folder)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to unzip archive: {str(e)}")
        
    return {
        "success": True,
        "message": f"Successfully extracted '{file.filename}'",
        "extracted_path": str(extract_folder),
        "target_path": str(extract_folder),
        "filename": file.filename
    }


# ==========================================
# OPTION 1: 🔍 DETECT ERROR
# ==========================================
@app.post("/api/scan")
def detect_errors(payload: Optional[ScanRequest] = None):
    """
    Option 1: 🔍 DETECT ERROR
    Runs AST scanner -> Rule Engine -> Context Builder -> LLM Verification.
    Strictly read-only; no code is modified.
    """
    if payload is None:
        payload = ScanRequest()
    target = payload.target_path or str(TEST_PROJECT_DIR)
    scan_res = scan_directory(target)

    if "error" in scan_res:
        raise HTTPException(status_code=400, detail=scan_res["error"])

    findings = scan_res.get("findings", [])
    
    # Step 2: Context Building
    contexts = build_contexts_for_findings(findings)

    # Step 3: LLM Verification (Filters false positives, adds explanation)
    verified_findings = []
    for ctx in contexts:
        verification = verify_finding(ctx, ollama_client)
        verified_findings.append({
            **ctx,
            "verification": verification,
            "is_true_positive": verification.get("is_true_positive", True),
            "verified_severity": verification.get("severity", ctx.get("severity")),
            "ai_reason": verification.get("reason"),
            "ai_recommendation": verification.get("recommendation")
        })

    result = {
        "run_id": f"RUN-SCAN-{int(time.time())}",
        "mode": "DETECT_ERROR",
        "target_path": target,
        "stats": scan_res.get("stats", {}),
        "findings": verified_findings,
        "message": f"Scan completed. Found {len(verified_findings)} potential security issues."
    }
    
    RUN_HISTORY.insert(0, {
        "id": result["run_id"],
        "mode": "DETECT_ERROR",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "issues_found": len(verified_findings),
        "status": "COMPLETED"
    })
    return result


# ==========================================
# OPTION 2: 🛠️ DEBUG & PUSH
# ==========================================
@app.post("/api/debug")
def debug_and_push(payload: Optional[DebugRequest] = None):
    """
    Option 2: 🛠️ DEBUG & PUSH
    Closed Loop: Scan -> Context -> LLM Verify -> Repair -> Validate (Syntax + Pytest + Re-scan) -> Git Branch & Push.
    """
    if payload is None:
        payload = DebugRequest()
    target = payload.target_path or str(TEST_PROJECT_DIR)
    run_id = f"RUN-DEBUG-{int(time.time())}"
    timeline = []

    def log_step(step_name: str, status: str, details: str = ""):
        timeline.append({
            "step": step_name,
            "status": status,  # "PASSED", "RUNNING", "FAILED"
            "details": details,
            "time": time.strftime("%H:%M:%S")
        })

    # 1. AST SCAN
    log_step("AST Scanner", "RUNNING", "Scanning Python files for security rule violations...")
    scan_res = scan_directory(target)
    findings = scan_res.get("findings", [])
    if not findings:
        log_step("AST Scanner", "PASSED", "No security issues found in codebase.")
        return {
            "run_id": run_id,
            "mode": "DEBUG_AND_PUSH",
            "success": True,
            "timeline": timeline,
            "message": "Project is already clean! No repair needed."
        }
    log_step("AST Scanner", "PASSED", f"Identified {len(findings)} potential security findings.")

    # 2. CONTEXT BUILDING
    log_step("Context Builder", "RUNNING", "Extracting AST scopes, functions, imports, and variables...")
    contexts = build_contexts_for_findings(findings)
    log_step("Context Builder", "PASSED", f"Constructed execution contexts for {len(contexts)} findings.")

    # 3. LLM VERIFICATION
    log_step("LLM Verification", "RUNNING", "Verifying findings against false positives...")
    verified = []
    for ctx in contexts:
        v = verify_finding(ctx, ollama_client)
        if v.get("is_true_positive", True):
            verified.append((ctx, v))
    log_step("LLM Verification", "PASSED", f"{len(verified)} findings confirmed as genuine vulnerabilities.")

    # 4. PATCH GENERATION & CLOSED-LOOP REPAIR
    log_step("Patch Generation & Closed Loop Repair", "RUNNING", "Generating and validating candidate patches...")
    generated_patches = []
    repaired_files = set()
    current_file_contents: Dict[str, str] = {}

    for ctx, verif in verified:
        filepath = ctx["file"]
        if filepath not in current_file_contents:
            with open(filepath, "r", encoding="utf-8") as f:
                current_file_contents[filepath] = f.read()
        
        patch = generate_patch(ctx, current_source=current_file_contents[filepath], ollama_client=ollama_client)
        generated_patches.append(patch)
        current_file_contents[filepath] = patch["fixed_code"]
        repaired_files.add(filepath)

    # Apply the combined clean code to filesystem
    for fp, final_content in current_file_contents.items():
        patch_applier.apply(fp, final_content)

    log_step("Patch Generation & Closed Loop Repair", "PASSED", f"Generated and applied {len(generated_patches)} sequential patches across {len(repaired_files)} files.")

    # 5. VALIDATION ENGINE: SYNTAX CHECK
    log_step("Syntax Validation", "RUNNING", "Running AST parse and py_compile on modified files...")
    syntax_errors = []
    for fp in repaired_files:
        syn_res = check_syntax(fp)
        if not syn_res["passed"]:
            syntax_errors.append(f"{Path(fp).name}: {syn_res.get('error')}")

    if syntax_errors:
        log_step("Syntax Validation", "FAILED", f"Syntax error: {'; '.join(syntax_errors)}. Rolling back.")
        patch_applier.rollback_all()
        return {
            "run_id": run_id,
            "mode": "DEBUG_AND_PUSH",
            "success": False,
            "timeline": timeline,
            "error": "Syntax validation failed on generated patch."
        }
    log_step("Syntax Validation", "PASSED", "All modified files compiled cleanly.")

    # 6. VALIDATION ENGINE: UNIT TESTS
    log_step("Unit Test Validation (pytest)", "RUNNING", "Executing pytest test suite to ensure functionality...")
    test_res = run_tests(target)
    if not test_res["passed"]:
        log_step("Unit Test Validation (pytest)", "FAILED", f"Pytest tests failed. Rolling back patch.")
        patch_applier.rollback_all()
        return {
            "run_id": run_id,
            "mode": "DEBUG_AND_PUSH",
            "success": False,
            "timeline": timeline,
            "pytest_output": test_res.get("stdout", "") + test_res.get("stderr", ""),
            "error": "Unit tests failed after patch application."
        }
    log_step("Unit Test Validation (pytest)", "PASSED", "All unit tests passed successfully!")

    # 7. VALIDATION ENGINE: SECURITY RE-SCAN
    log_step("Security Re-scan", "RUNNING", "Re-running AST scanner to confirm vulnerability eradication...")
    rescan_res = scan_directory(target)
    remaining = rescan_res.get("findings", [])
    if len(remaining) > 0:
        log_step("Security Re-scan", "FAILED", f"{len(remaining)} vulnerabilities remain. Rolling back.")
        patch_applier.rollback_all()
        return {
            "run_id": run_id,
            "mode": "DEBUG_AND_PUSH",
            "success": False,
            "timeline": timeline,
            "remaining_findings": remaining,
            "error": "Security re-scan detected remaining vulnerabilities."
        }
    log_step("Security Re-scan", "PASSED", "Re-scan clean: 0 vulnerabilities detected.")

    # Accept patches
    patch_applier.commit_patches()

    # 8. GIT & GITHUB INTEGRATION
    git_result = {}
    if payload.auto_push:
        log_step("Git Integration", "RUNNING", "Creating repair branch and committing secure patches...")
        git_result = git_manager.commit_and_branch(
            commit_message="fix(security): automated code repair via AutoPatch AI"
        )
        log_step("Git Integration", "PASSED", f"Committed to {git_result.get('branch')} [{git_result.get('commit_hash')}]. {git_result.get('push_message')}")

    result = {
        "run_id": run_id,
        "mode": "DEBUG_AND_PUSH",
        "success": True,
        "timeline": timeline,
        "patches": generated_patches,
        "git": git_result,
        "message": "AutoPatch AI repair completed! Code verified and committed."
    }

    RUN_HISTORY.insert(0, {
        "id": result["run_id"],
        "mode": "DEBUG_AND_PUSH",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "issues_repaired": len(generated_patches),
        "status": "PASSED & COMMITTED"
    })
    return result


# ==========================================
# OPTION 3: ✅ VERIFY & PUSH
# ==========================================
@app.post("/api/verify-push")
def verify_and_push(payload: Optional[VerifyPushRequest] = None):
    """
    Option 3: ✅ VERIFY & PUSH
    Checks if project is completely clean. If 0 errors, runs syntax & pytest, then pushes clean code.
    """
    if payload is None:
        payload = VerifyPushRequest()
    target = payload.target_path or str(TEST_PROJECT_DIR)
    run_id = f"RUN-VERIFY-{int(time.time())}"
    timeline = []

    # 1. AST SCAN
    scan_res = scan_directory(target)
    findings = scan_res.get("findings", [])

    if len(findings) > 0:
        return {
            "run_id": run_id,
            "mode": "VERIFY_AND_PUSH",
            "success": False,
            "clean": False,
            "issues_count": len(findings),
            "findings": findings,
            "message": f"Verification FAILED: {len(findings)} unresolved vulnerabilities detected! Cannot push unverified code. Use 'Debug & Push' first."
        }

    # 2. SYNTAX & PYTEST
    test_res = run_tests(target)
    if not test_res["passed"]:
        return {
            "run_id": run_id,
            "mode": "VERIFY_AND_PUSH",
            "success": False,
            "clean": False,
            "message": "Unit tests failed. Cannot push broken project."
        }

    # 3. GIT PUSH
    git_result = git_manager.commit_and_branch(
        branch_name="verified-main",
        commit_message=payload.commit_message or "chore: verified clean codebase"
    )

    result = {
        "run_id": run_id,
        "mode": "VERIFY_AND_PUSH",
        "success": True,
        "clean": True,
        "git": git_result,
        "message": "Codebase verified clean! AST: Clean. Tests: Passed. Pushed to Git."
    }

    RUN_HISTORY.insert(0, {
        "id": result["run_id"],
        "mode": "VERIFY_AND_PUSH",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "VERIFIED & PUSHED"
    })
    return result


@app.get("/api/runs/history")
def get_run_history():
    return {"history": RUN_HISTORY}


# Mount compiled React frontend for unified single-port presentation
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str = ""):
        # Don't intercept API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
