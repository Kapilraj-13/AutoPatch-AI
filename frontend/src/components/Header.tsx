import React from 'react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  onReset: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ status, onReset, isResetting }) => {
  const isLlmOnline = status?.llm_service?.connected && status?.llm_service?.model_available;
  const isLlmDaemonRunning = status?.llm_service?.connected;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 sticky top-0 z-50 shadow-sm">
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
                First Review Prototype
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              AST Security Analysis • LLM Verification • Closed-Loop Repair • Git Integration
            </p>
          </div>
        </div>

        {/* Status Indicators & Reset Action */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Engine Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span className={`w-2 h-2 rounded-full ${isLlmOnline ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`}></span>
            <span>
              {isLlmOnline ? (
                <>AI: <strong className="text-emerald-700">{status?.llm_service.target_model}</strong></>
              ) : isLlmDaemonRunning ? (
                <>Ollama Active <span className="text-amber-600">(Model pending pull)</span></>
              ) : (
                <>Engine: <strong className="text-sky-700">Deterministic AST Repair (Offline)</strong></>
              )}
            </span>
          </div>

          {/* Git Branch Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span>🌿</span>
            <span>Branch: <strong className="text-slate-900">{status?.git_status?.current_branch || 'main'}</strong></span>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            title="Reset test_project/vulnerable.py back to unpatched state for a fresh demonstration"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition font-medium disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{isResetting ? 'Resetting...' : 'Reset Code'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
