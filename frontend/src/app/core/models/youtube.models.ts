/** Mirrors the API's /api/youtube contracts. */

export interface YouTubeChannel {
  channelId: string;
  channelTitle: string;
  channelHandle?: string;
  thumbnailUrl?: string;
  connectedAt: string;
  lastUploadAt?: string;
  /** Google refused the saved access; the channel must be connected again. */
  needsReconnect: boolean;
}

export interface YouTubeCategory {
  id: string;
  name: string;
}

export interface YouTubePublishStatus {
  configured: boolean;
  channels: YouTubeChannel[];
  categories: YouTubeCategory[];
  limits: { maxTitleLength: number; maxDescriptionBytes: number; maxTagsLength: number };
}

export interface YouTubeCheck {
  field: string;
  code: string;
  message: string;
}

export type YouTubePrivacy = 'public' | 'unlisted' | 'private';

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacy: YouTubePrivacy;
  madeForKids: boolean | null;
  notifySubscribers: boolean;
}

export interface YouTubeDraft {
  title: string;
  description: string;
  /** The video's own tags. */
  tags: string[];
  /** The brand channel's default tags (Admin > Publishing), added to every upload's own. */
  channelTags: string[];
  categoryId: string;
  privacy: YouTubePrivacy;
  madeForKids: boolean;
  notifySubscribers: boolean;
  /** The YouTube channel the project's brand channel publishes to, if set up. */
  channelId?: string;
  brandChannelName: string;
  video: {
    durationSeconds?: number;
    sizeBytes?: number;
    width?: number;
    height?: number;
    isVertical: boolean;
  };
  errors: YouTubeCheck[];
  warnings: YouTubeCheck[];
}

/** An AI-written title, description and tags; the user reviews them before publishing. */
export interface YouTubeSuggestion {
  title: string;
  description: string;
  tags: string[];
  providerId: string;
}

export type YouTubeUploadState = 'Queued' | 'Uploading' | 'Completed' | 'Failed' | 'Cancelled';

export interface YouTubeUpload {
  uploadId: string;
  jobId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  privacy: string;
  state: YouTubeUploadState;
  bytesSent: number;
  totalBytes: number;
  percent: number;
  videoId?: string;
  videoUrl?: string;
  studioUrl?: string;
  errorCode?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export function isUploadFinished(upload: YouTubeUpload): boolean {
  return upload.state === 'Completed' || upload.state === 'Failed' || upload.state === 'Cancelled';
}

/** YouTube counts tags as typed: comma-joined, with quotes around any tag containing a space. */
export function youTubeTagsLength(tags: string[]): number {
  return tags.reduce((sum, t) => sum + t.length + (t.includes(' ') ? 2 : 0), 0) + Math.max(0, tags.length - 1);
}

/** "#Wildlife, nature comedy,#Kalahari" → ["Wildlife", "nature comedy", "Kalahari"], de-duplicated. */
export function parseYouTubeTags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of text.split(/[,\n]/)) {
    const tag = raw.trim().replace(/^#+/, '').trim();
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}
