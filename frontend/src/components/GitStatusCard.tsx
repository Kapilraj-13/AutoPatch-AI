import React from 'react';
import { GitInfo } from '../types';

interface GitStatusCardProps {
  git: GitInfo | null;
}

export const GitStatusCard: React.FC<GitStatusCardProps> = ({ git }) => {
  if (!git) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-900/40 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Git & GitHub Integration Result
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Commit Created
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
            Target Branch
          </span>
          <span className="font-bold text-indigo-300 font-mono text-sm">
            {git.branch || 'main'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
            Commit SHA
          </span>
          <span className="font-bold text-amber-300 font-mono text-sm">
            {git.commit_hash || 'HEAD'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
            Status
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            {git.push_status === 'pushed' ? '✓ Pushed to Origin' : '✓ Staged & Committed'}
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 font-mono">
        <span className="text-slate-500 block text-[10px] mb-1">Commit Message:</span>
        "{git.commit_message || 'fix(security): automated repair'}"
      </div>

      {git.push_message && (
        <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
          <span>ℹ️</span> {git.push_message}
        </p>
      )}
    </div>
  );
};
