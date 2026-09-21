export interface Finding {
  id: string;
  file: string;
  relative_file: string;
  line: number;
  end_line?: number;
  col?: number;
  rule_id: string;
  rule_name: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
  function: string;
  code_snippet: string;
  is_true_positive?: boolean;
  verified_severity?: string;
  ai_reason?: string;
  ai_recommendation?: string;
  verification?: {
    is_true_positive: boolean;
    confidence: number;
    reason: string;
    evidence: string;
    engine: string;
  };
}

export interface TimelineStep {
  step: string;
  status: 'RUNNING' | 'PASSED' | 'FAILED' | 'PENDING';
  details: string;
  time: string;
}

export interface PatchInfo {
  file: string;
  relative_file: string;
  original_code: string;
  fixed_code: string;
  diff: string;
  explanation: string;
  engine: string;
}

export interface GitInfo {
  success: boolean;
  branch?: string;
  commit_hash?: string;
  commit_message?: string;
  push_status?: string;
  push_message?: string;
  remote_origin?: string | null;
}

export interface SystemStatus {
  status: string;
  framework: string;
  llm_service: {
    connected: boolean;
    models: string[];
    target_model: string;
    model_available: boolean;
    status: string;
  };
  git_status: {
    current_branch: string;
    modified_files: string[];
    last_commit: string;
  };
  rules_count: number;
  target_project: string;
}
