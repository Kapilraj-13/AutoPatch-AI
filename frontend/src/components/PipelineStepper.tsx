import React from 'react';
import { TimelineStep } from '../types';

interface PipelineStepperProps {
  timeline: TimelineStep[];
  isCompleted?: boolean;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ timeline, isCompleted }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>⚡</span> Closed-Loop Pipeline Execution Trace
        </h3>
        {isCompleted && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Pipeline Finished
          </span>
        )}
      </div>

      <div className="space-y-3">
        {timeline.map((step, idx) => {
          const isPassed = step.status === 'PASSED';
          const isFailed = step.status === 'FAILED';
          const isRunning = step.status === 'RUNNING';

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                isPassed
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                  : isFailed
                  ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                  : 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200 animate-pulse'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isPassed && <span className="text-emerald-400 text-sm">✓</span>}
                  {isFailed && <span className="text-rose-400 text-sm">✕</span>}
                  {isRunning && <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block"></span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      [{idx + 1}/{timeline.length}] {step.step}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      isPassed ? 'bg-emerald-500/20 text-emerald-300' :
                      isFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{step.details}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{step.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
