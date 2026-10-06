export interface MediaProbeResponse {
  videoId: string;
  canonicalUrl: string;
  title: string;
  channel: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  isShort: boolean;
  aspectLabel: string;
  availableResolutions: string[];
  availableAudioFormats: string[];
  platformId: string;
  platformName: string;
  /** False when the site reports no dimensions (LinkedIn); the aspect is known after download. */
  aspectKnown: boolean;
}

export interface MediaDownloadRequest {
  url: string;
  format?: string;
  resolution?: string;
  audioBitrate?: string;
  projectId?: string;
  importAsAsset?: boolean;
  assetName?: string;
  compressionPreset?: string;
  /** An existing folder in the target project. */
  folderId?: string;
  /** A top-level folder to use, created if the project has none by that name. */
  folderName?: string;
  addToClipOrder?: boolean;
}

export interface MediaDownloadResult {
  ticket: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds: number;
  isAudioOnly: boolean;
  assetId?: string;
  streamUrl: string;
  projectId?: string;
  folderId?: string;
  folderName?: string;
}

export interface SupportedPlatform {
  id: string;
  name: string;
  domains: string[];
  example: string;
  notes: string;
  loginOftenRequired: boolean;
}

export interface MediaSources {
  downloadEnabled: boolean;
  downloaderAvailable: boolean;
  downloaderVersion?: string;
  cookiesConfigured: boolean;
  platforms: SupportedPlatform[];
}

/** A probe or download failure, as the API explained it. */
export interface MediaError {
  code: string;
  message: string;
  hint?: string;
  detail?: string;
}

export interface ChunkItemResponse {
  index: number;
  fileName: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  startFormatted: string;
  endFormatted: string;
  fileSizeBytes: number;
  streamUrl: string;
  assetId?: string;
  clipId?: string;
}

export interface VideoChunkResult {
  jobId: string;
  sourceTitle: string;
  totalDurationSeconds: number;
  chunkDurationSeconds: number;
  totalChunks: number;
  chunks: ChunkItemResponse[];
  zipDownloadUrl: string;
}

export interface MediaSystemSettings {
  defaultChunkDurationSeconds: number;
  allowMediaDownload: boolean;
  ytDlpAvailable: boolean;
  ffmpegAvailable: boolean;
}

