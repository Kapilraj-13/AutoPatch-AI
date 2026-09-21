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
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-bold text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">AUTOPATCH AI</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AST Security Analysis • LLM Verification • Closed-Loop Repair • Git Push
            </p>
          </div>
        </div>

        {/* Status Indicators & Reset Action */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Engine Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className={`w-2 h-2 rounded-full ${isLlmOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">
              {isLlmOnline ? (
                <>AI: <strong className="text-emerald-300">{status?.llm_service.target_model}</strong></>
              ) : isLlmDaemonRunning ? (
                <>Ollama Active <span className="text-amber-400">(Model pending pull)</span></>
              ) : (
                <>AI Engine: <strong className="text-teal-300">Deterministic + AST Repair</strong></>
              )}
            </span>
          </div>

          {/* Git Branch Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <span>🌿</span>
            <span>Branch: <strong className="text-indigo-300">{status?.git_status?.current_branch || 'main'}</strong></span>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            title="Reset test_project/vulnerable.py back to unpatched state for a fresh demonstration"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{isResetting ? 'Resetting...' : 'Reset Vulnerable Code'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
