/** Mirrors AnimStudio.Application.Releases.ReleaseMetadata. */
export interface ReleaseMetadata {
  title: string;
  versionTitle?: string;
  primaryArtist: string;
  featuredArtists: string[];
  songwriters: string[];
  producers: string[];
  genre: string;
  secondaryGenre?: string;
  language: string;
  explicit: boolean;
  instrumental: boolean;
  /** yyyy-MM-dd */
  releaseDate?: string;
  recordLabel?: string;
  recordingCopyright?: string;
  compositionCopyright?: string;
  isrc?: string;
  upc?: string;
  lyrics?: string;
  rightsConfirmed: boolean;
}

export interface ReleaseKitOptions {
  targetLufs: number;
  truePeakDb: number;
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24;
  makeVisualizer: boolean;
  makePromoLoop: boolean;
}

export interface LoudnessMeasurement {
  integratedLufs: number;
  truePeakDb: number;
  loudnessRange: number;
}

export interface ReleaseKitFile {
  name: string;
  label: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
}

export interface ReleaseKitWarning {
  code: string;
  message: string;
}

export interface ReleaseKitResult {
  jobId: string;
  title: string;
  primaryArtist: string;
  durationSeconds: number;
  sourceSampleRate: number;
  sourceChannels: number;
  sourceCodec: string;
  before: LoudnessMeasurement;
  after: LoudnessMeasurement;
  files: ReleaseKitFile[];
  warnings: ReleaseKitWarning[];
  zipDownloadUrl: string;
}
