import subprocess
import time
from pathlib import Path
from typing import Dict, Any, List

class GitManager:
    def __init__(self, repo_dir: str):
        self.repo_dir = str(Path(repo_dir).resolve())

    def _run_git(self, args: List[str]) -> Dict[str, Any]:
        try:
            res = subprocess.run(
                ["git"] + args,
                cwd=self.repo_dir,
                capture_output=True,
                text=True,
                timeout=15
            )
            return {
                "success": res.returncode == 0,
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1
            }

    def ensure_repo_initialized(self) -> bool:
        """Initializes a local git repository if not present."""
        git_dir = Path(self.repo_dir) / ".git"
        if not git_dir.exists():
            init_res = self._run_git(["init"])
            if not init_res["success"]:
                return False
            # Set default user config if not present
            self._run_git(["config", "user.name", "AutoPatch AI Agent"])
            self._run_git(["config", "user.email", "agent@autopatch.ai"])
            self._run_git(["add", "."])
            self._run_git(["commit", "-m", "chore: initial project commit"])
        return True

    def commit_and_branch(self, branch_name: str = None, commit_message: str = None) -> Dict[str, Any]:
        """Creates branch, stages changes, and commits."""
        self.ensure_repo_initialized()

        timestamp = int(time.time())
        branch = branch_name or f"autopatch/repair-{timestamp}"
        msg = commit_message or f"fix(security): automated repair via AutoPatch AI [{timestamp}]"

        # Checkout new branch
        checkout_res = self._run_git(["checkout", "-b", branch])
        if not checkout_res["success"]:
            # If branch already exists, switch to it
            self._run_git(["checkout", branch])

        # Stage files
        add_res = self._run_git(["add", "."])
        if not add_res["success"]:
            return {"success": False, "error": f"git add failed: {add_res['stderr']}"}

        # Commit
        commit_res = self._run_git(["commit", "-m", msg])

        # Get latest commit hash
        hash_res = self._run_git(["rev-parse", "--short", "HEAD"])
        commit_hash = hash_res["stdout"] if hash_res["success"] else "unknown"

        # Check remote origin
        remote_res = self._run_git(["remote", "get-url", "origin"])
        has_remote = remote_res["success"]
        push_status = "simulated"
        push_msg = f"Branch '{branch}' staged and committed locally. (No remote origin configured)"

        if has_remote:
            push_res = self._run_git(["push", "-u", "origin", branch])
            if push_res["success"]:
                push_status = "pushed"
                push_msg = f"Successfully pushed branch '{branch}' to origin!"
            else:
                push_status = "push_error"
                push_msg = f"Remote push notice: {push_res['stderr']}"
        else:
            push_status = "pushed_local"
            push_msg = f"Branch '{branch}' committed with hash {commit_hash}. Ready for remote pull request."

        return {
            "success": True,
            "branch": branch,
            "commit_hash": commit_hash,
            "commit_message": msg,
            "push_status": push_status,
            "push_message": push_msg,
            "remote_origin": remote_res["stdout"] if has_remote else None
        }

    def get_git_status(self) -> Dict[str, Any]:
        self.ensure_repo_initialized()
        branch_res = self._run_git(["rev-parse", "--abbrev-ref", "HEAD"])
        status_res = self._run_git(["status", "--short"])
        hash_res = self._run_git(["rev-parse", "--short", "HEAD"])
        return {
            "current_branch": branch_res["stdout"] if branch_res["success"] else "main",
            "modified_files": status_res["stdout"].splitlines() if status_res["success"] else [],
            "last_commit": hash_res["stdout"] if hash_res["success"] else "none"
        }
