import React from 'react';
import { GitHubUser, GitInfo } from '../types';

interface GitHubStatusCardProps {
  user: GitHubUser | null;
  targetRepo: string;
  gitInfo: GitInfo | null;
  onOpenGitHubModal: () => void;
  onDisconnect?: () => void;
}

export const GitHubStatusCard: React.FC<GitHubStatusCardProps> = ({
  user,
  targetRepo,
  gitInfo,
  onOpenGitHubModal,
  onDisconnect,
}) => {
  const isPushed = gitInfo?.push_status === 'pushed';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Bar: Connection Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: User & Repo Details */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center text-xl shadow-xs">
            🐙
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GitHub Connection & Target
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                user
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {user ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                    <img src={user.avatar_url} alt={user.login} className="w-4 h-4 rounded-full border border-slate-300" />
                    <span>@{user.login}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">Target Repo:</span>
                  {targetRepo ? (
                    <a
                      href={`https://github.com/${targetRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 hover:underline"
                    >
                      {targetRepo} ↗
                    </a>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">None selected</span>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  Connect your GitHub token to automatically push repair branches and create Pull Requests.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {user ? (
            <>
              <button
                onClick={onOpenGitHubModal}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition"
              >
                ⚙️ Manage / Switch Repo
              </button>
              <button
                onClick={onOpenGitHubModal}
                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs border border-sky-200 transition"
              >
                ➕ Create New Repo
              </button>
            </>
          ) : (
            <button
              onClick={onOpenGitHubModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition flex items-center gap-1.5"
            >
              <span>🐙</span>
              <span>Connect GitHub Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Latest Push Result Sub-Banner (if a push happened) */}
      {gitInfo && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isPushed
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950'
            : gitInfo.push_status === 'push_error'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-sky-50 border-sky-200 text-sky-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">
              {isPushed ? '🚀' : gitInfo.push_status === 'push_error' ? '⚠️' : '🌿'}
            </span>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>
                  {isPushed
                    ? 'Push Completed Successfully!'
                    : gitInfo.push_status === 'push_error'
                    ? 'Committed Locally (Remote Push Notice)'
                    : 'Committed Locally'}
                </span>
                {gitInfo.branch && (
                  <span className="font-mono text-[11px] bg-white/80 px-1.5 py-0.5 rounded border border-emerald-300/60 font-semibold">
                    {gitInfo.branch}
                  </span>
                )}
                {gitInfo.commit_hash && (
                  <span className="font-mono text-[10px] text-slate-500">
                    [{gitInfo.commit_hash}]
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-85 mt-0.5">
                {gitInfo.push_message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {gitInfo.pr_url && (
              <a
                href={gitInfo.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
              >
                <span>🎉</span>
                <span>View PR #{gitInfo.pr_number} ↗</span>
              </a>
            )}
            {gitInfo.branch_url && (
              <a
                href={gitInfo.branch_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs shadow-2xs transition"
              >
                View Branch ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
