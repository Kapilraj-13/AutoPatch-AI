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
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center text-xl mb-3 font-bold">
          ✓
        </div>
        <h4 className="text-base font-bold text-slate-900">No Security Vulnerabilities Detected</h4>
        <p className="text-xs text-slate-500 mt-1">
          AST security rules and static analyzers reported zero violations.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {title} ({findings.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Deterministic AST Scan + LLM Verification
        </span>
      </div>

      <div className="space-y-3">
        {findings.map((f) => {
          const isExpanded = expandedId === f.id;
          const severityColors = {
            CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
            HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
            MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
            LOW: 'bg-sky-50 text-sky-700 border-sky-200',
          }[f.severity] || 'bg-slate-50 text-slate-700 border-slate-200';

          return (
            <div
              key={f.id}
              className="border border-slate-200 hover:border-sky-300 bg-white rounded-xl overflow-hidden transition shadow-xs"
            >
              {/* Finding Summary Bar */}
              <div
                onClick={() => toggleExpand(f.id)}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start md:items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {f.id}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{f.type}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColors}`}>
                        {f.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-medium">
                        {f.relative_file}:{f.line}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {f.verification && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span>✓</span> LLM Confirmed
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {isExpanded ? '▲ Hide' : '▼ Details'}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3 text-xs">
                  {/* Code Snippet */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Vulnerable Code Snippet:
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-900 text-rose-300 font-mono overflow-x-auto border border-slate-800">
                      <code>{f.code_snippet}</code>
                    </pre>
                  </div>

                  {/* LLM Analysis */}
                  {f.ai_reason && (
                    <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80">
                      <span className="font-bold text-sky-900 block mb-1">
                        🧠 AI Verification Analysis ({f.verification?.engine || 'AutoPatch LLM'}):
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">{f.ai_reason}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                    <span className="font-bold text-emerald-900 block mb-1">
                      💡 Security Recommendation ({f.rule_name}):
                    </span>
                    <p className="text-slate-700 font-medium">{f.recommendation}</p>
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
