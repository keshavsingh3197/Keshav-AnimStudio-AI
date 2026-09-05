/** Mirrors the backend's single response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  width: number;
  height: number;
  fps: number;
  distributionIntent: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  kind: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  hasAlpha: boolean;
  durationSeconds?: number;
  reviewStatus: string;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  aliases: string[];
  closedMouthAssetId?: string;
  openMouthAssetId?: string;
  isNarrator: boolean;
  subtitleColorHex?: string;
}

export interface IngestResult {
  ingestId: string;
  scriptId?: string;
  cueCount: number;
  segmentCount: number;
  timingSource: string;
  hasSourceTimings: boolean;
  warnings: string[];
}

export interface SceneGenerationResult {
  scenesCreated: number;
  scenesPreserved: number;
  unresolvedSpeakers: string[];
  warnings: string[];
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title?: string;
  durationFrames: number;
  durationSeconds: number;
  backgroundAssetId?: string;
  dialogueLines: number;
  transition: string;
  backgroundEffect: string;
}

export interface RenderJob {
  jobId: string;
  projectId: string;
  status: string;
  progress: number;
  message?: string;
  currentStage: string;
  scenesTotal: number;
  scenesDone: number;
  errorCode?: string;
  errorMessage?: string;
  warnings: string[];
  hasOutput: boolean;
  outputDurationSeconds?: number;
  createdAt: string;
  completedAt?: string;
}

export interface RendererStatus {
  available: boolean;
  version?: string;
  unavailableReason?: string;
  burnedSubtitles: boolean;
  kenBurns: boolean;
  transitions: boolean;
}

export interface TranscriptSourceStatus {
  kind: string;
  available: boolean;
  unavailableReason?: string;
  toolVersion?: string;
  requiresAttestation: boolean;
}

export interface IngestCapabilities {
  defaultSource: string;
  mediaDownloadAllowed: boolean;
  sources: TranscriptSourceStatus[];
}

/** Terminal statuses; polling stops on any of these. */
export const TERMINAL_JOB_STATUSES = [
  'Completed',
  'CompletedWithWarnings',
  'Failed',
  'Cancelled',
] as const;

export function isTerminal(status: string): boolean {
  return (TERMINAL_JOB_STATUSES as readonly string[]).includes(status);
}
