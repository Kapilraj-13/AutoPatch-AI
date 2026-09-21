import React from 'react';

interface ActionCardsProps {
  onDetect: () => void;
  onDebugPush: () => void;
  onVerifyPush: () => void;
  isLoading: boolean;
  activeMode: string | null;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onDetect,
  onDebugPush,
  onVerifyPush,
  isLoading,
  activeMode
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Action 1: DETECT ERROR */}
      <div className={`relative group p-6 rounded-2xl border transition-all duration-200 bg-gradient-to-b from-slate-900/90 to-slate-950/90 ${
        activeMode === 'DETECT'
          ? 'border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
          : 'border-slate-800 hover:border-sky-500/50 hover:shadow-md hover:shadow-sky-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-2xl">
            🔍
          </div>
          <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
            Read-Only Analysis
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition">
          1. Detect Error
        </h3>
        <p className="text-xs text-slate-400 mt-2 mb-5 leading-relaxed">
          Executes AST parser across Python files, maps violations to 8 security rules, and performs LLM contextual verification. <strong>Code is not modified.</strong>
        </p>

        <button
          onClick={onDetect}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-semibold shadow-md shadow-sky-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && activeMode === 'DETECT' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Scanning AST...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Run Detect Scan</span>
            </>
          )}
        </button>
      </div>

      {/* Action 2: DEBUG & PUSH */}
      <div className={`relative group p-6 rounded-2xl border transition-all duration-200 bg-gradient-to-b from-slate-900/90 to-slate-950/90 ${
        activeMode === 'DEBUG'
          ? 'border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
          : 'border-slate-800 hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
            🛠️
          </div>
          <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Autonomous Repair
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
          2. Debug & Push
        </h3>
        <p className="text-xs text-slate-400 mt-2 mb-5 leading-relaxed">
          Closed-loop workflow: Detects bugs, LLM generates minimal secure patch, validates with py_compile & pytest, re-scans AST, commits to branch and pushes.
        </p>

        <button
          onClick={onDebugPush}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold shadow-md shadow-amber-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && activeMode === 'DEBUG' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Repairing & Validating...</span>
            </>
          ) : (
            <>
              <span>🛠️</span>
              <span>Run Debug & Push</span>
            </>
          )}
        </button>
      </div>

      {/* Action 3: VERIFY & PUSH */}
      <div className={`relative group p-6 rounded-2xl border transition-all duration-200 bg-gradient-to-b from-slate-900/90 to-slate-950/90 ${
        activeMode === 'VERIFY'
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
          : 'border-slate-800 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
            ✅
          </div>
          <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Clean Verification
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
          3. Verify & Push
        </h3>
        <p className="text-xs text-slate-400 mt-2 mb-5 leading-relaxed">
          Verifies project has 0 vulnerabilities. If clean, runs unit tests and pushes codebase to Git. If vulnerabilities remain, blocks push until repaired.
        </p>

        <button
          onClick={onVerifyPush}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && activeMode === 'VERIFY' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Verifying Integrity...</span>
            </>
          ) : (
            <>
              <span>✅</span>
              <span>Verify & Push to Git</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
