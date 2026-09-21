import React, { useState } from 'react';
import { PatchInfo } from '../types';

interface CodeDiffViewerProps {
  patches: PatchInfo[];
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ patches }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'SPLIT' | 'DIFF'>('SPLIT');

  if (!patches || patches.length === 0) return null;

  const currentPatch = patches[selectedIdx] || patches[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Automated Patch Verification & Code Diff
          </h3>
        </div>

        {/* Patch selector & View Toggle */}
        <div className="flex items-center gap-2">
          {patches.length > 1 && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {patches.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono font-semibold transition ${
                    selectedIdx === idx
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patch #{idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`px-3 py-1 rounded font-semibold transition ${
                viewMode === 'SPLIT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('DIFF')}
              className={`px-3 py-1 rounded font-semibold transition ${
                viewMode === 'DIFF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unified Diff
            </button>
          </div>
        </div>
      </div>

      {/* AI Explanation Banner */}
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sky-900">
            🤖 AutoPatch Explanation ({currentPatch.engine}):
          </span>
          <span className="font-mono text-slate-500 text-[11px] font-medium">
            File: {currentPatch.relative_file}
          </span>
        </div>
        <p className="text-slate-700 leading-relaxed font-medium">{currentPatch.explanation}</p>
      </div>

      {/* Code Display */}
      {viewMode === 'SPLIT' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Before */}
          <div className="border border-rose-200 rounded-xl overflow-hidden bg-slate-950 shadow-sm">
            <div className="bg-rose-50 px-4 py-2 border-b border-rose-200 flex items-center justify-between text-rose-700 font-bold">
              <span>❌ ORIGINAL (Vulnerable)</span>
              <span className="text-[10px] text-rose-600">a/{currentPatch.relative_file}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-rose-200 max-h-96 leading-5">
              <code>{currentPatch.original_code}</code>
            </pre>
          </div>

          {/* After */}
          <div className="border border-emerald-200 rounded-xl overflow-hidden bg-slate-950 shadow-sm">
            <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 flex items-center justify-between text-emerald-700 font-bold">
              <span>✅ REPAIRED (AutoPatch AI)</span>
              <span className="text-[10px] text-emerald-600">b/{currentPatch.relative_file}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-200 max-h-96 leading-5">
              <code>{currentPatch.fixed_code}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 text-xs font-mono shadow-sm">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-slate-700 font-semibold">
            <span>Unified Patch Diff</span>
            <span className="text-[10px] text-slate-500">{currentPatch.relative_file}</span>
          </div>
          <pre className="p-4 overflow-x-auto text-slate-300 max-h-96 leading-5">
            {currentPatch.diff ? (
              currentPatch.diff.split('\n').map((line, idx) => {
                const isAdd = line.startsWith('+') && !line.startsWith('+++');
                const isSub = line.startsWith('-') && !line.startsWith('---');
                return (
                  <div
                    key={idx}
                    className={
                      isAdd ? 'bg-emerald-950/70 text-emerald-300' :
                      isSub ? 'bg-rose-950/70 text-rose-300' : ''
                    }
                  >
                    {line}
                  </div>
                );
              })
            ) : (
              <code>{currentPatch.fixed_code}</code>
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
