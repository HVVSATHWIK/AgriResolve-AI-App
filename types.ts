
export enum AssessmentStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PERCEIVING = 'PERCEIVING',
  EVALUATING = 'EVALUATING',
  DEBATING = 'DEBATING',
  ARBITRATING = 'ARBITRATING',
  EXPLAINING = 'EXPLAINING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AgentResult {
  agentName: string;
  role: string;
  output: string;
  status: 'pending' | 'active' | 'success' | 'warning' | 'danger';
}

export interface AssessmentData {
  imageUrl: string | null;
  visionEvidence: any;
  qualityScore: number;
  qualityFlags: string[];
  healthyHypothesis: string;
  diseaseHypothesis: string;
  arbitrationVerdict: 'Likely Healthy' | 'Possibly Healthy' | 'Possibly Abnormal' | 'Likely Abnormal' | 'Indeterminate';
  explanation: string;
  guidance: string[];
}
