import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ActionCards } from './components/ActionCards';
import { PipelineStepper } from './components/PipelineStepper';
import { FindingsList } from './components/FindingsList';
import { CodeDiffViewer } from './components/CodeDiffViewer';
import { GitStatusCard } from './components/GitStatusCard';
import { GitHubConnectModal } from './components/GitHubConnectModal';
import {
  fetchStatus,
  fetchProjectFiles,
  resetProject,
  runDetectError,
  runDebugAndPush,
  runVerifyAndPush,
  uploadZipFile,
} from './services/api';
import { SystemStatus, Finding, TimelineStep, PatchInfo, GitInfo, GitHubUser } from './types';

export const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [projectFiles, setProjectFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [patches, setPatches] = useState<PatchInfo[]>([]);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);

  // GitHub Account & Repo State
  const [ghToken, setGhToken] = useState<string>(() => localStorage.getItem('autopatch_gh_token') || '');
  const [ghUser, setGhUser] = useState<GitHubUser | null>(() => {
    try {
      const saved = localStorage.getItem('autopatch_gh_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [ghRepo, setGhRepo] = useState<string>(() => localStorage.getItem('autopatch_gh_repo') || '');
  const [isGhModalOpen, setIsGhModalOpen] = useState<boolean>(false);

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

  const handleRepoImported = (targetPath: string, repoName: string) => {
    setActiveTarget(targetPath);
    setActiveTargetLabel(`github/${repoName}`);
    setAlert({
      type: 'success',
      message: `Repository '${repoName}' successfully imported from GitHub! Active target switched.`
    });
    setFindings([]);
    setTimeline([]);
    setPatches([]);
    setGitInfo(null);
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
      const res = await runDebugAndPush(activeTarget || undefined, true, ghToken, ghRepo);
      setTimeline(res.timeline || []);
      if (res.success) {
        setPatches(res.patches || []);
        setGitInfo(res.git || null);
        
        if (res.git?.pr_url) {
          setAlert({
            type: 'success',
            message: `🎉 All vulnerabilities repaired and Pull Request #${res.git.pr_number} created on GitHub!`
          });
        } else {
          setAlert({
            type: 'success',
            message: 'All vulnerabilities repaired, validated with syntax check + pytest + AST re-scan, and committed to Git!'
          });
        }
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
      const res = await runVerifyAndPush(activeTarget || undefined, ghToken, ghRepo);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <Header
        status={status}
        onReset={handleReset}
        isResetting={isResetting}
        user={ghUser}
        targetRepo={ghRepo}
        onOpenGitHubModal={() => setIsGhModalOpen(true)}
      />

      {/* GitHub Account Connect Modal */}
      <GitHubConnectModal
        isOpen={isGhModalOpen}
        onClose={() => setIsGhModalOpen(false)}
        user={ghUser}
        setUser={setGhUser}
        token={ghToken}
        setToken={setGhToken}
        targetRepo={ghRepo}
        setTargetRepo={setGhRepo}
        onRepoImported={handleRepoImported}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert */}
        {alert && (
          <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between transition-all shadow-xs ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
            alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
            'bg-sky-50 border-sky-200 text-sky-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {alert.type === 'success' ? '✅' : alert.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="font-medium">{alert.message}</span>
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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center text-xl">
              📁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Target:</span>
                <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                  {activeTargetLabel}
                </span>
                {activeTarget && (
                  <button
                    onClick={() => {
                      setActiveTarget('');
                      setActiveTargetLabel('test_project/vulnerable.py');
                      setAlert({ type: 'info', message: 'Switched back to default test_project' });
                    }}
                    className="text-[11px] text-sky-600 hover:text-sky-800 underline font-medium ml-1"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTarget
                  ? 'Custom project workspace unpacked and ready for automated security scan & repair.'
                  : 'Default sample project with SQLi (R001), Command Injection (R002), and Dynamic Execution (R003).'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Import / Connect GitHub button */}
            <button
              onClick={() => setIsGhModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>🐙</span>
              <span>{ghUser ? (ghRepo ? `Repo: ${ghRepo.split('/')[1] || ghRepo}` : 'Select Repo') : 'Connect GitHub'}</span>
            </button>

            {/* Upload ZIP button */}
            <label className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs">
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
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono font-semibold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
              >
                <span>📄</span>
                <span>{pf.name}</span>
                <span className="text-[10px] text-slate-400">{selectedFileContent === pf.name ? '▲' : '▼'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Content Preview */}
        {selectedFileContent && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs font-mono shadow-sm">
            <div className="flex items-center justify-between mb-3 text-slate-600 font-semibold">
              <span>Previewing: {selectedFileContent}</span>
              <button onClick={() => setSelectedFileContent(null)} className="text-slate-400 hover:text-slate-800">✕ Close</button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 overflow-x-auto text-slate-200 max-h-64 border border-slate-800">
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
            <GitStatusCard git={gitInfo} onOpenGitHubModal={() => setIsGhModalOpen(true)} />
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
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        AutoPatch AI Framework • AST Static Scanner + Context Builder + LLM Verification & Closed-Loop Repair
      </footer>
    </div>
  );
};
