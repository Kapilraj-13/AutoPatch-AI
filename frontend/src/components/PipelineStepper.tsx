import React from 'react';
import { TimelineStep } from '../types';

interface PipelineStepperProps {
  timeline: TimelineStep[];
  isCompleted?: boolean;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ timeline, isCompleted }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>⚡</span> Closed-Loop Pipeline Execution Trace
        </h3>
        {isCompleted && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Pipeline Finished
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {timeline.map((step, idx) => {
          const isPassed = step.status === 'PASSED';
          const isFailed = step.status === 'FAILED';
          const isRunning = step.status === 'RUNNING';

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                isPassed
                  ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                  : isFailed
                  ? 'bg-rose-50/60 border-rose-200/80 text-rose-900'
                  : 'bg-sky-50/60 border-sky-200/80 text-sky-900 animate-pulse'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 font-bold">
                  {isPassed && <span className="text-emerald-600 text-sm">✓</span>}
                  {isFailed && <span className="text-rose-600 text-sm">✕</span>}
                  {isRunning && <span className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin inline-block"></span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                      [{idx + 1}/{timeline.length}] {step.step}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                      isPassed ? 'bg-emerald-100 text-emerald-800' :
                      isFailed ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{step.details}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{step.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
