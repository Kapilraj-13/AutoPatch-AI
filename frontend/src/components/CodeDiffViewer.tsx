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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Automated Patch Verification & Code Diff
          </h3>
        </div>

        {/* Patch selector & View Toggle */}
        <div className="flex items-center gap-2">
          {patches.length > 1 && (
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
              {patches.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono font-medium transition ${
                    selectedIdx === idx
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Patch #{idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="flex bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`px-3 py-1 rounded font-medium transition ${
                viewMode === 'SPLIT' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('DIFF')}
              className={`px-3 py-1 rounded font-medium transition ${
                viewMode === 'DIFF' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unified Diff
            </button>
          </div>
        </div>
      </div>

      {/* AI Explanation Banner */}
      <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-800/40 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-teal-300">
            🤖 AutoPatch Explanation ({currentPatch.engine}):
          </span>
          <span className="font-mono text-slate-400 text-[10px]">
            File: {currentPatch.relative_file}
          </span>
        </div>
        <p className="text-slate-200 leading-relaxed">{currentPatch.explanation}</p>
      </div>

      {/* Code Display */}
      {viewMode === 'SPLIT' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Before */}
          <div className="border border-rose-900/40 rounded-xl overflow-hidden bg-slate-950">
            <div className="bg-rose-950/30 px-4 py-2 border-b border-rose-900/30 flex items-center justify-between text-rose-300 font-semibold">
              <span>❌ ORIGINAL (Vulnerable)</span>
              <span className="text-[10px] text-rose-400/80">a/{currentPatch.relative_file}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-rose-200/90 max-h-96 leading-5">
              <code>{currentPatch.original_code}</code>
            </pre>
          </div>

          {/* After */}
          <div className="border border-emerald-900/40 rounded-xl overflow-hidden bg-slate-950">
            <div className="bg-emerald-950/30 px-4 py-2 border-b border-emerald-900/30 flex items-center justify-between text-emerald-300 font-semibold">
              <span>✅ REPAIRED (AutoPatch AI)</span>
              <span className="text-[10px] text-emerald-400/80">b/{currentPatch.relative_file}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-200/90 max-h-96 leading-5">
              <code>{currentPatch.fixed_code}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-xs font-mono">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-300">
            <span>Unified Patch Diff</span>
            <span className="text-[10px] text-slate-400">{currentPatch.relative_file}</span>
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
                      isAdd ? 'bg-emerald-950/50 text-emerald-300' :
                      isSub ? 'bg-rose-950/50 text-rose-300' : ''
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
