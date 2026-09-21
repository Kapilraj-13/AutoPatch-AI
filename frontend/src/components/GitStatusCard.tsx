import React from 'react';
import { GitInfo } from '../types';

interface GitStatusCardProps {
  git: GitInfo | null;
  onOpenGitHubModal?: () => void;
}

export const GitStatusCard: React.FC<GitStatusCardProps> = ({ git, onOpenGitHubModal }) => {
  if (!git) return null;

  const isRemotePushed = git.push_status === 'pushed';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Git & GitHub Integration Result
            </h3>
            {git.remote_repo && (
              <span className="text-[11px] text-slate-500 font-mono">
                Target: {git.remote_repo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {git.pr_url && (
            <a
              href={git.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <span>🎉</span>
              <span>View Pull Request #{git.pr_number || ''} ↗</span>
            </a>
          )}
          {git.branch_url && (
            <a
              href={git.branch_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs border border-sky-200 transition"
            >
              View Branch ↗
            </a>
          )}
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            isRemotePushed
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-sky-50 text-sky-700 border-sky-200'
          }`}>
            {isRemotePushed ? 'Remote Pushed' : 'Committed Locally'}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-bold">
            Branch Name
          </span>
          <span className="font-bold text-sky-700 font-mono text-sm mt-0.5 block truncate" title={git.branch}>
            {git.branch || 'main'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-bold">
            Commit SHA
          </span>
          <span className="font-bold text-slate-800 font-mono text-sm mt-0.5 block">
            {git.commit_hash || 'HEAD'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-bold">
            Status
          </span>
          <span className={`font-bold text-sm mt-0.5 block ${isRemotePushed ? 'text-emerald-700' : 'text-sky-700'}`}>
            {isRemotePushed ? '✓ Pushed to GitHub' : '✓ Staged & Committed'}
          </span>
        </div>
      </div>

      {/* Commit Message */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
        <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Commit Message:</span>
        "{git.commit_message || 'fix(security): automated repair'}"
      </div>

      {/* Notice Message */}
      {git.push_message && (
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <span>ℹ️</span> {git.push_message}
        </p>
      )}

      {/* Prompt to connect GitHub if not pushed to remote */}
      {!isRemotePushed && onOpenGitHubModal && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
              <span>🐙</span> Push to your GitHub Repository & Create a PR?
            </span>
            <p className="text-[11px] text-sky-800">
              Connect your GitHub account to automatically create repair branches and Pull Requests on your repositories.
            </p>
          </div>
          <button
            onClick={onOpenGitHubModal}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs whitespace-nowrap"
          >
            Connect GitHub
          </button>
        </div>
      )}
    </div>
  );
};
