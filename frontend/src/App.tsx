import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ActionCards } from './components/ActionCards';
import { PipelineStepper } from './components/PipelineStepper';
import { FindingsList } from './components/FindingsList';
import { CodeDiffViewer } from './components/CodeDiffViewer';
import { GitStatusCard } from './components/GitStatusCard';
import {
  fetchStatus,
  fetchProjectFiles,
  resetProject,
  runDetectError,
  runDebugAndPush,
  runVerifyAndPush,
  uploadZipFile,
} from './services/api';
import { SystemStatus, Finding, TimelineStep, PatchInfo, GitInfo } from './types';

export const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [projectFiles, setProjectFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [patches, setPatches] = useState<PatchInfo[]>([]);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);

  const [activeTarget, setActiveTarget] = useState<string>('');
  const [activeTargetLabel, setActiveTargetLabel] = useState<string>('test_project/vulnerable.py');
  const [isUploading, setIsUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);

  const refreshSystem = async () => {
    try {
      const s = await fetchStatus();
      setStatus(s);
      const pf = await fetchProjectFiles();
      setProjectFiles(pf.files);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshSystem();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadZipFile(file);
      setActiveTarget(res.target_path);
      setActiveTargetLabel(`uploads/extracted/${res.filename}`);
      setAlert({
        type: 'success',
        message: `Project archive '${res.filename}' uploaded and unpacked! Active target switched.`
      });
      // Reset previous results for clean slate
      setFindings([]);
      setTimeline([]);
      setPatches([]);
      setGitInfo(null);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to upload ZIP file' });
    } finally {
      setIsUploading(false);
    }
  };

  // Action 1: DETECT ERROR
  const handleDetect = async () => {
    setIsLoading(true);
    setActiveMode('DETECT');
    setAlert(null);
    setPatches([]);
    setGitInfo(null);
    setTimeline([
      { step: 'AST Scanner', status: 'RUNNING', details: `Scanning target: ${activeTargetLabel}...`, time: new Date().toLocaleTimeString() }
    ]);

    try {
      const res = await runDetectError(activeTarget || undefined);
      setFindings(res.findings);
      setTimeline([
        { step: 'AST Scanner', status: 'PASSED', details: `Parsed ${res.stats.files_scanned} files. Applied ${res.stats.total_rules_applied} rules.`, time: new Date().toLocaleTimeString() },
        { step: 'Context Building', status: 'PASSED', details: `Built AST contexts for ${res.findings.length} findings.`, time: new Date().toLocaleTimeString() },
        { step: 'LLM Verification', status: 'PASSED', details: `Verified ${res.findings.length} findings against false positives.`, time: new Date().toLocaleTimeString() },
      ]);
      setAlert({
        type: res.findings.length > 0 ? 'info' : 'success',
        message: `Detect completed: ${res.findings.length} issues identified. Codebase remains untouched.`
      });
      await refreshSystem();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Detection failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Action 2: DEBUG & PUSH
  const handleDebugPush = async () => {
    setIsLoading(true);
    setActiveMode('DEBUG');
    setAlert(null);
    setFindings([]);
    setPatches([]);
    setGitInfo(null);

    try {
      const res = await runDebugAndPush(activeTarget || undefined);
      setTimeline(res.timeline || []);
      if (res.success) {
        setPatches(res.patches || []);
        setGitInfo(res.git || null);
        setAlert({
          type: 'success',
          message: 'All vulnerabilities repaired, validated with syntax check + pytest + AST re-scan, and committed to Git!'
        });
      } else {
        setAlert({
          type: 'error',
          message: res.error || 'Automated repair or validation check failed.'
        });
      }
      await refreshSystem();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Debug & Push failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Action 3: VERIFY & PUSH
  const handleVerifyPush = async () => {
    setIsLoading(true);
    setActiveMode('VERIFY');
    setAlert(null);
    setPatches([]);
    setGitInfo(null);

    try {
      const res = await runVerifyAndPush(activeTarget || undefined);
      if (res.clean) {
        setTimeline([
          { step: 'AST Security Scan', status: 'PASSED', details: 'Zero vulnerabilities detected in codebase.', time: new Date().toLocaleTimeString() },
          { step: 'Syntax & Pytest Validation', status: 'PASSED', details: 'All automated tests passed.', time: new Date().toLocaleTimeString() },
          { step: 'Git Integration', status: 'PASSED', details: `Pushed clean project to ${res.git?.branch}.`, time: new Date().toLocaleTimeString() }
        ]);
        setGitInfo(res.git || null);
        setAlert({
          type: 'success',
          message: 'Clean Project Verified! 0 vulnerabilities detected. Pushed successfully to Git.'
        });
      } else {
        setFindings(res.findings || []);
        setTimeline([
          { step: 'AST Security Scan', status: 'FAILED', details: `Found ${res.issues_count} unpatched vulnerabilities! Push rejected.`, time: new Date().toLocaleTimeString() }
        ]);
        setAlert({
          type: 'error',
          message: `Cannot push: ${res.issues_count} unpatched vulnerabilities found! Please use 'Debug & Push' first.`
        });
      }
      await refreshSystem();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Verify & Push failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Demo
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetProject();
      setFindings([]);
      setTimeline([]);
      setPatches([]);
      setGitInfo(null);
      setActiveMode(null);
      setAlert({ type: 'info', message: res.message });
      await refreshSystem();
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Failed to reset project' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Header */}
      <Header status={status} onReset={handleReset} isResetting={isResetting} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert */}
        {alert && (
          <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between transition-all ${
            alert.type === 'success' ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' :
            alert.type === 'error' ? 'bg-rose-950/40 border-rose-800/60 text-rose-200' :
            'bg-sky-950/40 border-sky-800/60 text-sky-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {alert.type === 'success' ? '✅' : alert.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{alert.message}</span>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Project Target Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Target:</span>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {activeTargetLabel}
                </span>
                {activeTarget && (
                  <button
                    onClick={() => {
                      setActiveTarget('');
                      setActiveTargetLabel('test_project/vulnerable.py');
                      setAlert({ type: 'info', message: 'Switched back to default test_project' });
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline ml-1"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTarget ? 'Custom uploaded project archive unpacked and ready for security scan.' : 'Default sample project with SQLi, Command Injection, and Dynamic Execution.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Upload ZIP button */}
            <label className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer">
              <span>📦</span>
              <span>{isUploading ? 'Unpacking ZIP...' : 'Upload Project (.zip)'}</span>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {projectFiles.map((pf) => (
              <button
                key={pf.name}
                onClick={() => setSelectedFileContent(selectedFileContent === pf.name ? null : pf.name)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>📄</span>
                <span>{pf.name}</span>
                <span className="text-[10px] text-slate-500">{selectedFileContent === pf.name ? '▲' : '▼'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Content Preview */}
        {selectedFileContent && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between mb-2 text-slate-400">
              <span>Previewing: {selectedFileContent}</span>
              <button onClick={() => setSelectedFileContent(null)} className="text-slate-500 hover:text-white">✕ Close</button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 overflow-x-auto text-slate-200 max-h-64">
              <code>
                {projectFiles.find((f) => f.name === selectedFileContent)?.content || ''}
              </code>
            </pre>
          </div>
        )}

        {/* The 3 Core Actions */}
        <section>
          <ActionCards
            onDetect={handleDetect}
            onDebugPush={handleDebugPush}
            onVerifyPush={handleVerifyPush}
            isLoading={isLoading}
            activeMode={activeMode}
          />
        </section>

        {/* Execution Pipeline Stepper */}
        {timeline.length > 0 && (
          <section>
            <PipelineStepper timeline={timeline} isCompleted={!isLoading} />
          </section>
        )}

        {/* Code Diff Viewer (from Debug & Push) */}
        {patches.length > 0 && (
          <section>
            <CodeDiffViewer patches={patches} />
          </section>
        )}

        {/* Git & GitHub Result Panel */}
        {gitInfo && (
          <section>
            <GitStatusCard git={gitInfo} />
          </section>
        )}

        {/* Findings List */}
        {findings.length > 0 && (
          <section>
            <FindingsList findings={findings} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        AutoPatch AI Framework • AST Static Scanner + Context Builder + LLM Verification & Closed-Loop Repair
      </footer>
    </div>
  );
};
