import React from 'react';
import { GitInfo } from '../types';

interface GitStatusCardProps {
  git: GitInfo | null;
}

export const GitStatusCard: React.FC<GitStatusCardProps> = ({ git }) => {
  if (!git) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Git & GitHub Integration Result
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Commit Created
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-bold">
            Target Branch
          </span>
          <span className="font-bold text-sky-700 font-mono text-sm mt-0.5 block">
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
          <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
            {git.push_status === 'pushed' ? '✓ Pushed to Origin' : '✓ Staged & Committed'}
          </span>
        </div>
      </div>

      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
        <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Commit Message:</span>
        "{git.commit_message || 'fix(security): automated repair'}"
      </div>

      {git.push_message && (
        <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
          <span>ℹ️</span> {git.push_message}
        </p>
      )}
    </div>
  );
};
