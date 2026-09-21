import subprocess
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

from .github_service import create_github_pull_request

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
                timeout=25
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

    def commit_and_branch(
        self,
        branch_name: Optional[str] = None,
        commit_message: Optional[str] = None,
        github_token: Optional[str] = None,
        github_repo: Optional[str] = None,
        create_pr: bool = True,
        pr_title: Optional[str] = None,
        pr_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates branch, stages changes, commits, and optionally pushes to remote GitHub repo and creates a PR."""
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

        # Handle Remote Push
        pr_url = None
        pr_number = None
        branch_url = None
        remote_repo_name = None

        # Scenario 1: User provided GitHub Personal Access Token & Repo
        if github_token and github_repo:
            clean_repo = github_repo.strip().replace("https://github.com/", "").rstrip(".git").strip("/")
            parts = clean_repo.split("/")
            if len(parts) == 2:
                owner, repo = parts[0], parts[1]
                remote_repo_name = f"{owner}/{repo}"
                auth_remote_url = f"https://x-access-token:{github_token.strip()}@github.com/{remote_repo_name}.git"

                # Check if origin exists
                remotes = self._run_git(["remote"])
                if "origin" in remotes.get("stdout", "").split():
                    self._run_git(["remote", "set-url", "origin", auth_remote_url])
                else:
                    self._run_git(["remote", "add", "origin", auth_remote_url])

                # Push branch
                push_res = self._run_git(["push", "-u", "origin", branch])
                if push_res["success"]:
                    push_status = "pushed"
                    branch_url = f"https://github.com/{remote_repo_name}/tree/{branch}"
                    push_msg = f"Successfully pushed branch '{branch}' directly to https://github.com/{remote_repo_name}!"

                    # Create Pull Request if requested
                    if create_pr:
                        pr_res = create_github_pull_request(
                            token=github_token,
                            repo_full_name=remote_repo_name,
                            head_branch=branch,
                            title=pr_title or "🛡️ AutoPatch AI: Automated Code Security Repair",
                            body=pr_body or (
                                f"### 🛡️ AutoPatch AI Security Repair Summary\n\n"
                                f"- **Branch**: `{branch}`\n"
                                f"- **Commit**: `{commit_hash}`\n"
                                f"- **Status**: Verified by AST Static Scanner + Syntax Compiler + Closed-Loop Validation.\n\n"
                                f"*Generated automatically by [AutoPatch AI](https://github.com/Kapilraj-13/AutoPatch-AI).*"
                            )
                        )
                        if pr_res.get("success"):
                            pr_url = pr_res.get("pr_url")
                            pr_number = pr_res.get("pr_number")
                            push_msg += f" Pull Request #{pr_number} created: {pr_url}"
                else:
                    push_status = "push_error"
                    push_msg = f"Remote push error on GitHub repo '{remote_repo_name}': {push_res.get('stderr')}"
            else:
                push_status = "pushed_local"
                push_msg = f"Committed locally. Invalid repository format '{github_repo}' (expected 'owner/repo')."

        # Scenario 2: No GitHub token provided, check existing remote origin
        else:
            remote_res = self._run_git(["remote", "get-url", "origin"])
            has_remote = remote_res["success"]
            if has_remote:
                push_res = self._run_git(["push", "-u", "origin", branch])
                if push_res["success"]:
                    push_status = "pushed"
                    push_msg = f"Successfully pushed branch '{branch}' to origin!"
                else:
                    push_status = "pushed_local"
                    push_msg = f"Branch '{branch}' committed locally ({commit_hash}). Connect GitHub account to push directly to your repository."
            else:
                push_status = "pushed_local"
                push_msg = f"Branch '{branch}' committed locally ({commit_hash}). Connect GitHub account to push directly to your repository."

        return {
            "success": True,
            "branch": branch,
            "commit_hash": commit_hash,
            "commit_message": msg,
            "push_status": push_status,
            "push_message": push_msg,
            "pr_url": pr_url,
            "pr_number": pr_number,
            "branch_url": branch_url,
            "remote_repo": remote_repo_name
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
