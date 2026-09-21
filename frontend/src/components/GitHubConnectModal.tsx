import React, { useState, useEffect } from 'react';
import { GitHubUser, GitHubRepoItem } from '../types';
import { verifyGitHub, fetchGitHubRepos, importGitHubRepo } from '../services/api';

interface GitHubConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GitHubUser | null;
  setUser: (user: GitHubUser | null) => void;
  token: string;
  setToken: (token: string) => void;
  targetRepo: string;
  setTargetRepo: (repo: string) => void;
  onRepoImported?: (targetPath: string, repoName: string) => void;
}

export const GitHubConnectModal: React.FC<GitHubConnectModalProps> = ({
  isOpen,
  onClose,
  user,
  setUser,
  token,
  setToken,
  targetRepo,
  setTargetRepo,
  onRepoImported,
}) => {
  const [inputToken, setInputToken] = useState(token);
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [customRepo, setCustomRepo] = useState(targetRepo);

  useEffect(() => {
    setInputToken(token);
    setCustomRepo(targetRepo);
    if (token && user) {
      loadRepos(token);
    }
  }, [isOpen, token, user, targetRepo]);

  const loadRepos = async (tok: string) => {
    try {
      const res = await fetchGitHubRepos(tok);
      setRepos(res.repos || []);
    } catch {
      // Repos list optional
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setError('Please paste your GitHub Personal Access Token.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await verifyGitHub(inputToken.trim());
      setUser(res.user);
      setToken(inputToken.trim());
      localStorage.setItem('autopatch_gh_token', inputToken.trim());
      localStorage.setItem('autopatch_gh_user', JSON.stringify(res.user));
      setSuccessMsg(`Connected successfully as @${res.user.login}!`);
      loadRepos(inputToken.trim());
    } catch (err: any) {
      setError(err.message || 'Verification failed. Check token permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setUser(null);
    setToken('');
    setTargetRepo('');
    setInputToken('');
    setCustomRepo('');
    setRepos([]);
    localStorage.removeItem('autopatch_gh_token');
    localStorage.removeItem('autopatch_gh_user');
    localStorage.removeItem('autopatch_gh_repo');
    setSuccessMsg('GitHub account disconnected.');
  };

  const handleSaveRepo = (repoName: string) => {
    setTargetRepo(repoName);
    localStorage.setItem('autopatch_gh_repo', repoName);
    setSuccessMsg(`Target repository set to '${repoName}'. Fixes will be pushed here.`);
  };

  const handleImportAndScan = async (repoName: string) => {
    if (!repoName.trim()) {
      setError('Please specify a repository name or URL to import.');
      return;
    }
    setIsImporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await importGitHubRepo(repoName.trim(), token || undefined);
      setTargetRepo(res.repo_full_name);
      localStorage.setItem('autopatch_gh_repo', res.repo_full_name);
      if (onRepoImported) {
        onRepoImported(res.target_path, res.repo_full_name);
      }
      setSuccessMsg(`Repository '${res.repo_full_name}' imported and set as active target!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to import repository from GitHub.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 text-xl font-bold">
              🐙
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Connect GitHub Account</h2>
              <p className="text-xs text-slate-500 font-medium">Push repair branches & open Pull Requests automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="font-bold text-rose-500 hover:text-rose-800 ml-2">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
              <span>✓ {successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-500 hover:text-emerald-800 ml-2">✕</button>
            </div>
          )}

          {/* User Profile Card (if connected) */}
          {user ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-12 h-12 rounded-full border border-slate-300 shadow-xs"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {user.name}
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium border border-emerald-200">
                        Connected
                      </span>
                    </div>
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline font-mono text-xs"
                    >
                      @{user.login} ↗
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 font-medium transition"
                >
                  Disconnect
                </button>
              </div>

              {/* Target Repository Selection */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <label className="block font-bold text-slate-700 text-xs">
                  Target GitHub Repository:
                </label>

                {repos.length > 0 && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Pick from your repositories:</span>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      value={targetRepo}
                      onChange={(e) => {
                        setCustomRepo(e.target.value);
                        handleSaveRepo(e.target.value);
                      }}
                    >
                      <option value="">-- Choose a repository --</option>
                      {repos.map((r) => (
                        <option key={r.id} value={r.full_name}>
                          {r.full_name} ({r.private ? '🔒 Private' : '🌐 Public'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Or enter repository identifier (owner/repo):</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. your-username/your-repo"
                      value={customRepo}
                      onChange={(e) => setCustomRepo(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRepo(customRepo)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Direct Clone & Scan Button */}
                {customRepo && (
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={() => handleImportAndScan(customRepo)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>📥</span>
                    <span>{isImporting ? 'Cloning & Preparing Repository...' : `Import & Scan '${customRepo}'`}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Connect with Token Form */
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>🔑</span> Personal Access Token (PAT)
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  Provide a GitHub token with <code className="bg-white/80 px-1 py-0.5 rounded text-sky-900 font-mono font-bold">repo</code> scope. This enables AutoPatch AI to create repair branches, commit secure patches, and open Pull Requests directly on your repositories.
                </p>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=AutoPatch-AI-Agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 underline"
                >
                  Generate Token on GitHub ↗
                </a>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 text-xs">
                  GitHub Token:
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    className="w-full px-3 py-2.5 pr-16 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-[11px] text-slate-400 hover:text-slate-700 font-medium"
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Token is stored locally in your browser and used only to communicate with GitHub.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>🐙</span>
                <span>{isLoading ? 'Verifying with GitHub...' : 'Connect GitHub Account'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {user ? `Active: ${targetRepo || 'No repo selected'}` : 'Offline demo mode active if disconnected.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
