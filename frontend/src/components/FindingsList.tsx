import React, { useState } from 'react';
import { Finding } from '../types';

interface FindingsListProps {
  findings: Finding[];
  title?: string;
  onFixFinding?: (finding: Finding) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings, title = "Security Vulnerability Findings" }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!findings || findings.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center text-xl mb-3">
          ✓
        </div>
        <h4 className="text-base font-semibold text-white">No Security Vulnerabilities Detected</h4>
        <p className="text-xs text-slate-400 mt-1">
          AST rules and static analyzers reported zero rule violations.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {title} ({findings.length})
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Deterministic AST Scan + LLM Verification
        </span>
      </div>

      <div className="space-y-4">
        {findings.map((f) => {
          const isExpanded = expandedId === f.id;
          const severityColors = {
            CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            LOW: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          }[f.severity] || 'bg-slate-500/20 text-slate-300';

          return (
            <div
              key={f.id}
              className="border border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-xl overflow-hidden transition"
            >
              {/* Finding Summary Bar */}
              <div
                onClick={() => toggleExpand(f.id)}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start md:items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {f.id}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{f.type}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColors}`}>
                        {f.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {f.relative_file}:{f.line}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {f.verification && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <span>✓</span> LLM Confirmed
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {isExpanded ? '▲ Hide' : '▼ Details'}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-900/40 p-4 space-y-3 text-xs">
                  {/* Code Snippet */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Vulnerable Code Snippet:
                    </span>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-rose-950/60 text-rose-300 font-mono overflow-x-auto">
                      <code>{f.code_snippet}</code>
                    </pre>
                  </div>

                  {/* LLM Analysis */}
                  {f.ai_reason && (
                    <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40">
                      <span className="font-semibold text-indigo-300 block mb-1">
                        🧠 AI Verification Analysis ({f.verification?.engine || 'AutoPatch LLM'}):
                      </span>
                      <p className="text-slate-300 leading-relaxed">{f.ai_reason}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                    <span className="font-semibold text-teal-300 block mb-1">
                      💡 Security Recommendation ({f.rule_name}):
                    </span>
                    <p className="text-slate-300">{f.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
