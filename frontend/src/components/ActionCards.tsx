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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Action 1: DETECT ERROR */}
      <div className={`relative group p-6 rounded-2xl border transition-all duration-200 bg-white ${
        activeMode === 'DETECT'
          ? 'border-sky-500 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/20'
          : 'border-slate-200 hover:border-sky-400 hover:shadow-md hover:shadow-sky-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-xl font-bold">
            🔍
          </div>
          <span className="text-[11px] tracking-wide uppercase font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Read-Only Analysis
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition">
          1. Detect Error
        </h3>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
          Scans Python AST for 8 deterministic security rules and performs LLM contextual verification. <strong>Code remains untouched.</strong>
        </p>

        <button
          onClick={onDetect}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-semibold shadow-sm shadow-sky-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <div className={`relative group p-6 rounded-2xl border transition-all duration-200 bg-white ${
        activeMode === 'DEBUG'
          ? 'border-blue-600 shadow-xl shadow-blue-500/15 ring-2 ring-blue-500/20'
          : 'border-slate-200 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-xl font-bold">
            🛠️
          </div>
          <span className="text-[11px] tracking-wide uppercase font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Autonomous Repair
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
          2. Debug & Push
        </h3>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
          Closed-loop repair: Detects bugs, LLM creates minimal safe patches, tests with py_compile & pytest, re-scans AST, and commits to Git.
        </p>

        <button
          onClick={onDebugPush}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <div className={`relative group p-6 rounded-2xl border transition-all duration-200 bg-white ${
        activeMode === 'VERIFY'
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
          : 'border-slate-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl font-bold">
            ✅
          </div>
          <span className="text-[11px] tracking-wide uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Clean Verification
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">
          3. Verify & Push
        </h3>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
          Verifies project has 0 vulnerabilities. If clean, runs unit tests and pushes codebase to Git. Blocks push if vulnerabilities are still open.
        </p>

        <button
          onClick={onVerifyPush}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
