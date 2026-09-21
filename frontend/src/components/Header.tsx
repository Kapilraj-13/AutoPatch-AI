import React from 'react';
import { SystemStatus, GitHubUser } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  onReset: () => void;
  isResetting: boolean;
  user: GitHubUser | null;
  targetRepo: string;
  onOpenGitHubModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onReset,
  isResetting,
  user,
  targetRepo,
  onOpenGitHubModal,
}) => {
  const isLlmOnline = status?.llm_service?.connected && status?.llm_service?.model_available;
  const isLlmDaemonRunning = status?.llm_service?.connected;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold text-lg">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                AutoPatch <span className="text-sky-600">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Agentic Code Repair
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              AST Static Scanner • LLM Verification • Closed-Loop Repair • GitHub Pull Request Automation
            </p>
          </div>
        </div>

        {/* Status Indicators, GitHub Connect & Reset Action */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* GitHub Connection Button / Pill */}
          {user ? (
            <button
              onClick={onOpenGitHubModal}
              title="Click to manage GitHub connection or change repository"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 font-medium transition shadow-xs"
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-5 h-5 rounded-full border border-sky-300"
              />
              <span className="font-semibold">@{user.login}</span>
              {targetRepo && (
                <span className="text-[10px] bg-white text-sky-700 font-mono font-bold px-1.5 py-0.5 rounded border border-sky-200">
                  {targetRepo.split('/')[1] || targetRepo}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenGitHubModal}
              title="Connect your GitHub account to push repair branches and open Pull Requests directly"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-700 border border-slate-200 hover:border-sky-300 transition font-semibold shadow-xs"
            >
              <span className="text-sm">🐙</span>
              <span>Connect GitHub</span>
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            </button>
          )}

          {/* Engine Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span className={`w-2 h-2 rounded-full ${isLlmOnline ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`}></span>
            <span>
              {isLlmOnline ? (
                <>AI: <strong className="text-emerald-700">{status?.llm_service.target_model}</strong></>
              ) : isLlmDaemonRunning ? (
                <>Ollama Active <span className="text-amber-600">(Model pending pull)</span></>
              ) : (
                <>Engine: <strong className="text-sky-700">Deterministic AST Repair</strong></>
              )}
            </span>
          </div>

          {/* Git Branch Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span>🌿</span>
            <span>Branch: <strong className="text-slate-900">{status?.git_status?.current_branch || 'main'}</strong></span>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            title="Reset sample vulnerable.py back to unpatched state"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition font-medium disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{isResetting ? 'Resetting...' : 'Reset'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
