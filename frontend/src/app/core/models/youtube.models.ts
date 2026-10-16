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
  /** False when connected before comment permission was asked for; reconnecting fixes it. */
  canComment: boolean;
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

/**
 * What is being published: a finished render, or a release kit's visualizer - a song, sent
 * as a Music-category video so it is listed on YouTube Music under the channel.
 */
export type YouTubePublishSource = 'render' | 'release';

/** YouTube's Music category; what makes an upload show up on YouTube Music. */
export const YOUTUBE_MUSIC_CATEGORY_ID = '10';

/**
 * Where an upload is meant to be found. Both are one YouTube upload with one video id: the
 * Music destination only sends it in the Music category, which lists it on YouTube Music
 * as well, at music.youtube.com/watch?v=<same id>.
 */
export type YouTubeDestination = 'youtube' | 'music';

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
  /** The brand channel's default first comment (Admin > Publishing). */
  firstComment?: string;
  /** A song, or a render of a music project: the dialog opens set to YouTube Music. */
  isMusic?: boolean;
}

/** An AI-written title, description and tags; the user reviews them before publishing. */
export interface YouTubeSuggestion {
  title: string;
  description: string;
  tags: string[];
  providerId: string;
  /** Other titles to pick from; the main one is not repeated. */
  titleOptions?: string[];
  /** Other descriptions in different styles (short, detailed), each with the same chapters, credits and footer. */
  descriptionOptions?: string[];
  /** More tags to pick from, none already in `tags`. */
  tagIdeas?: string[];
}

/** A text engine that can write suggestions now - a hosted model or a local signed-in CLI. */
export interface YouTubeSuggestEngine {
  id: string;
  name: string;
  runsLocally: boolean;
}

export interface YouTubeSuggestOptions {
  engines: YouTubeSuggestEngine[];
  tones: string[];
}

/** What to ask for, beyond the project's own material. */
export interface YouTubeSuggestParams {
  language: string;
  fresh: boolean;
  tone?: string;
  brief?: string;
  providerId?: string;
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
  /** The saved record of a finished upload. */
  publicationId?: string;
  /** e.g. the video is on YouTube but its link couldn't be saved. */
  warning?: string;
  /** The first comment's thread id, once it is posted. */
  commentId?: string;
  /** The same video on music.youtube.com; set for a Music-category upload. */
  musicUrl?: string;
  /** A custom thumbnail went up with the video and YouTube accepted it. */
  thumbnailSet?: boolean;
}

/**
 * The custom thumbnail sent with an upload: a frame of the video, or a JPG/PNG picture as a
 * data URL. Neither leaves YouTube to pick one of its own frames.
 */
export interface YouTubeThumbnailChoice {
  frameAtSeconds?: number | null;
  imageBase64?: string | null;
}

/** YouTube's limit is 2 MB, but the server re-encodes, so a larger photo is fine to pick. */
export const MAX_THUMBNAIL_UPLOAD_BYTES = 8 * 1024 * 1024;

export type YouTubeVideoHealth = 'Unknown' | 'Processing' | 'Ok' | 'Issue' | 'Removed';

/** A video uploaded from the app, saved automatically when the upload finished. */
export interface YouTubePublication {
  id: string;
  projectId: string;
  jobId: string;
  channelId: string;
  channelTitle: string;
  videoId: string;
  title: string;
  privacy: string;
  videoUrl: string;
  studioUrl: string;
  relatedVideoIds: string[];
  publishedAt: string;
  health: YouTubeVideoHealth;
  privacyStatus?: string;
  issueCode?: string;
  issueMessage?: string;
  thumbnailUrl?: string;
  lastCheckedAt?: string;
  /** The same video on music.youtube.com; set when it went up in the Music category. */
  musicUrl?: string;
}

export const MAX_RELATED_VIDEOS = 10;

/** True when the owner should look at the video on YouTube. */
export function needsAttention(p: YouTubePublication): boolean {
  return p.health === 'Issue' || p.health === 'Removed';
}

/** Mirrors the server's block, so the review screen and the byte count show what will be sent. */
export function relatedVideosBlock(related: Pick<YouTubePublication, 'videoId' | 'title'>[]): string {
  if (related.length === 0) return '';
  const lines = related.map((r) => `▶ ${r.title.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, '').trim() || 'Video'}: https://youtu.be/${r.videoId}`);
  return `Related videos:\n${lines.join('\n')}`;
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

/** A connected channel with its live counters; counters are null when they couldn't be read. */
export interface YouTubeChannelOverview {
  channelId: string;
  channelTitle: string;
  channelHandle?: string | null;
  thumbnailUrl?: string | null;
  channelUrl: string;
  studioUrl: string;
  connectedAt: string;
  lastUploadAt?: string | null;
  needsReconnect: boolean;
  subscribers?: number | null;
  /** The owner hides the subscriber count on YouTube. */
  subscribersHidden: boolean;
  totalViews?: number | null;
  totalVideos?: number | null;
  /** Videos uploaded to this channel from the app. */
  appUploads: number;
  /** Why the counters couldn't be read, if they couldn't. */
  statsError?: string | null;
}

export interface YouTubeVideoStats {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
}

/** Everything the YouTube page shows, in one call. */
export interface YouTubeDashboard {
  configured: boolean;
  channels: YouTubeChannelOverview[];
  videos: YouTubePublication[];
  /** Keyed by YouTube video id; videos YouTube no longer has are absent. */
  videoStats: Record<string, YouTubeVideoStats>;
  statsFetchedAt?: string | null;
}

/** A broadcast on a connected channel that Go Live can stream to. Never carries the stream key. */
export interface YouTubeLiveBroadcast {
  broadcastId: string;
  title: string;
  privacy: string;
  lifeCycleStatus: string;
  scheduledStartTime?: string;
  watchUrl: string;
  studioUrl: string;
}

/** What the live setup panel opens with for one connected channel. */
export interface YouTubeLiveSetup {
  /** False when the channel was connected without live-stream permission; reconnecting fixes it. */
  canManageLive: boolean;
  privacy: YouTubePrivacy;
  categoryId: string;
  madeForKids: boolean;
  tags: string[];
  descriptionFooter?: string;
  upcoming: YouTubeLiveBroadcast[];
  warning?: string;
}

export type YouTubeLiveKind = 'camera' | 'playlist' | 'music';

export interface YouTubeLiveSuggestParams {
  topic: string;
  brief?: string;
  tone?: string;
  language: string;
  kind: YouTubeLiveKind;
  channelId?: string;
  providerId?: string;
  fresh: boolean;
}
