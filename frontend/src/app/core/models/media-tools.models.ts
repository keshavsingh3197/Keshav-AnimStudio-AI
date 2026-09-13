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
}

export interface MediaDownloadRequest {
  url: string;
  format?: string;
  resolution?: string;
  audioBitrate?: string;
  projectId?: string;
  importAsAsset?: boolean;
  assetName?: string;
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

