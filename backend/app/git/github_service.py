import os
import shutil
import zipfile
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
import requests

GITHUB_API_BASE = "https://api.github.com"

def get_github_headers(token: Optional[str]) -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AutoPatch-AI-Agent"
    }
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"
    return headers


def verify_github_token(token: str) -> Dict[str, Any]:
    """Validates GitHub Personal Access Token and retrieves user profile information."""
    if not token or not token.strip():
        return {"valid": False, "error": "GitHub token is empty."}
    
    try:
        resp = requests.get(
            f"{GITHUB_API_BASE}/user",
            headers=get_github_headers(token),
            timeout=10
        )
        if resp.status_code == 200:
            user_data = resp.json()
            return {
                "valid": True,
                "user": {
                    "login": user_data.get("login"),
                    "name": user_data.get("name") or user_data.get("login"),
                    "avatar_url": user_data.get("avatar_url"),
                    "html_url": user_data.get("html_url"),
                    "public_repos": user_data.get("public_repos", 0),
                    "total_private_repos": user_data.get("total_private_repos", 0),
                }
            }
        elif resp.status_code == 401:
            return {"valid": False, "error": "Invalid GitHub token or expired permissions."}
        else:
            return {"valid": False, "error": f"GitHub API error ({resp.status_code}): {resp.text}"}
    except Exception as e:
        return {"valid": False, "error": f"Network error contacting GitHub: {str(e)}"}


def list_user_repositories(token: str) -> List[Dict[str, Any]]:
    """Fetches recently updated repositories accessible by the user's token."""
    if not token:
        return []
    
    try:
        resp = requests.get(
            f"{GITHUB_API_BASE}/user/repos?sort=updated&per_page=30&affiliation=owner,collaborator",
            headers=get_github_headers(token),
            timeout=10
        )
        if resp.status_code == 200:
            repos = []
            for r in resp.json():
                repos.append({
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "full_name": r.get("full_name"),
                    "private": r.get("private", False),
                    "default_branch": r.get("default_branch", "main"),
                    "html_url": r.get("html_url"),
                    "description": r.get("description") or "No description"
                })
            return repos
        return []
    except Exception:
        return []


def import_github_repository(repo_identifier: str, token: Optional[str], destination_root: Path) -> Dict[str, Any]:
    """
    Imports a repository into destination_root / repo_name.
    Supports either full clone URL or 'owner/repo'.
    Uses token authentication if provided.
    """
    clean_id = repo_identifier.strip().replace("https://github.com/", "").rstrip(".git").strip("/")
    parts = clean_id.split("/")
    if len(parts) != 2:
        return {"success": False, "error": "Repository must be in 'owner/repo' format or full GitHub URL."}
    
    owner, repo_name = parts[0], parts[1]
    repo_full_name = f"{owner}/{repo_name}"
    target_dir = destination_root / repo_name

    # If directory already exists, clear it for a fresh import
    if target_dir.exists():
        try:
            shutil.rmtree(target_dir)
        except Exception:
            pass
    target_dir.mkdir(parents=True, exist_ok=True)

    # Method A: Try git clone --depth 1
    auth_clone_url = f"https://x-access-token:{token.strip()}@github.com/{repo_full_name}.git" if token else f"https://github.com/{repo_full_name}.git"
    try:
        res = subprocess.run(
            ["git", "clone", "--depth", "1", auth_clone_url, str(target_dir)],
            capture_output=True,
            text=True,
            timeout=40
        )
        if res.returncode == 0:
            # Set git author credentials for this repo
            subprocess.run(["git", "config", "user.name", "AutoPatch AI Agent"], cwd=str(target_dir), capture_output=True)
            subprocess.run(["git", "config", "user.email", "agent@autopatch.ai"], cwd=str(target_dir), capture_output=True)
            return {
                "success": True,
                "repo_full_name": repo_full_name,
                "target_path": str(target_dir),
                "message": f"Successfully cloned '{repo_full_name}' via Git."
            }
    except Exception:
        pass

    # Method B: Fallback to downloading archive zipball via GitHub REST API
    try:
        zip_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/zipball"
        resp = requests.get(zip_url, headers=get_github_headers(token), stream=True, timeout=30)
        if resp.status_code == 200:
            temp_zip = destination_root / f"{repo_name}_temp.zip"
            with open(temp_zip, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            with zipfile.ZipFile(temp_zip, "r") as z:
                z.extractall(target_dir)
            temp_zip.unlink(missing_ok=True)

            # Move contents if single nested folder
            subdirs = [d for d in target_dir.iterdir() if d.is_dir()]
            if len(subdirs) == 1 and not (target_dir / ".git").exists():
                inner_dir = subdirs[0]
                temp_extract = destination_root / f"{repo_name}_unpacked"
                shutil.move(str(inner_dir), str(temp_extract))
                shutil.rmtree(target_dir)
                shutil.move(str(temp_extract), str(target_dir))

            # Initialize git in extracted dir
            subprocess.run(["git", "init"], cwd=str(target_dir), capture_output=True)
            subprocess.run(["git", "config", "user.name", "AutoPatch AI Agent"], cwd=str(target_dir), capture_output=True)
            subprocess.run(["git", "config", "user.email", "agent@autopatch.ai"], cwd=str(target_dir), capture_output=True)
            subprocess.run(["git", "add", "."], cwd=str(target_dir), capture_output=True)
            subprocess.run(["git", "commit", "-m", "chore: initial import from GitHub"], cwd=str(target_dir), capture_output=True)

            return {
                "success": True,
                "repo_full_name": repo_full_name,
                "target_path": str(target_dir),
                "message": f"Successfully downloaded and extracted '{repo_full_name}' archive."
            }
        else:
            return {"success": False, "error": f"Failed to download repository archive (status {resp.status_code}): {resp.text}"}
    except Exception as e:
        return {"success": False, "error": f"Import failed: {str(e)}"}


def create_github_pull_request(
    token: str,
    repo_full_name: str,
    head_branch: str,
    base_branch: str = "main",
    title: str = "🛡️ AutoPatch AI: Automated Code Repair & Security Fixes",
    body: str = "This pull request was automatically generated by **AutoPatch AI** after AST security scanning, LLM verification, and closed-loop validation."
) -> Dict[str, Any]:
    """Creates a Pull Request on GitHub using the user's personal access token."""
    if not token or not repo_full_name:
        return {"success": False, "error": "Missing token or repo_full_name"}

    url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/pulls"
    payload = {
        "title": title,
        "head": head_branch,
        "base": base_branch,
        "body": body
    }

    try:
        resp = requests.post(url, headers=get_github_headers(token), json=payload, timeout=15)
        if resp.status_code in (200, 201):
            pr_data = resp.json()
            return {
                "success": True,
                "pr_url": pr_data.get("html_url"),
                "pr_number": pr_data.get("number"),
                "state": pr_data.get("state")
            }
        else:
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"message": resp.text}
            # Check if base branch might be 'master' instead of 'main'
            if "base" in str(err_data).lower() and base_branch == "main":
                payload["base"] = "master"
                retry = requests.post(url, headers=get_github_headers(token), json=payload, timeout=15)
                if retry.status_code in (200, 201):
                    pr_data = retry.json()
                    return {
                        "success": True,
                        "pr_url": pr_data.get("html_url"),
                        "pr_number": pr_data.get("number"),
                        "state": pr_data.get("state")
                    }
            return {
                "success": False,
                "error": err_data.get("message", resp.text),
                "details": err_data
            }
    except Exception as e:
        return {"success": False, "error": str(e)}
