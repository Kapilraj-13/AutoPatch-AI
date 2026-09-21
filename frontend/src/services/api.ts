import { SystemStatus, Finding, TimelineStep, PatchInfo, GitInfo, GitHubUser, GitHubRepoItem } from '../types';

const API_BASE = '/api';

export async function fetchStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchProjectFiles(): Promise<{ files: { name: string; content: string; type: string }[]; project_dir: string }> {
  const res = await fetch(`${API_BASE}/project/files`);
  if (!res.ok) throw new Error('Failed to fetch project files');
  return res.json();
}

export async function resetProject(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/project/reset`, { method: 'POST' });
  return res.json();
}

export async function uploadZipFile(file: File): Promise<{ success: boolean; message: string; target_path: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/projects/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

// ==========================================
// 🐙 GITHUB API INTEGRATION
// ==========================================
export async function verifyGitHub(token: string): Promise<{ valid: boolean; user: GitHubUser }> {
  const res = await fetch(`${API_BASE}/github/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'GitHub authentication failed');
  }
  return res.json();
}

export async function fetchGitHubRepos(token: string): Promise<{ repos: GitHubRepoItem[] }> {
  const res = await fetch(`${API_BASE}/github/repos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch repositories');
  }
  return res.json();
}

export async function importGitHubRepo(repoIdentifier: string, token?: string): Promise<{ success: boolean; target_path: string; repo_full_name: string; message: string }> {
  const res = await fetch(`${API_BASE}/github/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_identifier: repoIdentifier, token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to import repository');
  }
  return res.json();
}

export interface ScanResponse {
  run_id: string;
  mode: string;
  target_path: string;
  stats: {
    files_scanned: number;
    total_rules_applied: number;
    total_findings: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
  };
  findings: Finding[];
  message: string;
}

export async function runDetectError(targetPath?: string): Promise<ScanResponse> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_path: targetPath }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Scan failed');
  }
  return res.json();
}

export interface DebugResponse {
  run_id: string;
  mode: string;
  success: boolean;
  timeline: TimelineStep[];
  patches?: PatchInfo[];
  git?: GitInfo;
  message?: string;
  error?: string;
  remaining_findings?: Finding[];
}

export async function runDebugAndPush(
  targetPath?: string,
  autoPush = true,
  ghToken?: string,
  ghRepo?: string,
  createPr = true
): Promise<DebugResponse> {
  const res = await fetch(`${API_BASE}/debug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_path: targetPath,
      auto_push: autoPush,
      github_token: ghToken || undefined,
      github_repo: ghRepo || undefined,
      create_pr: createPr,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Debug & Push failed');
  }
  return res.json();
}

export interface VerifyPushResponse {
  run_id: string;
  mode: string;
  success: boolean;
  clean: boolean;
  issues_count?: number;
  findings?: Finding[];
  git?: GitInfo;
  message: string;
}

export async function runVerifyAndPush(
  targetPath?: string,
  ghToken?: string,
  ghRepo?: string
): Promise<VerifyPushResponse> {
  const res = await fetch(`${API_BASE}/verify-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_path: targetPath,
      github_token: ghToken || undefined,
      github_repo: ghRepo || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Verify & Push failed');
  }
  return res.json();
}
