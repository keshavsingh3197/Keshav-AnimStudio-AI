/** Mirrors the API's /api/youtube/queue contracts: the publishing board. */

import { YouTubePrivacy, YouTubeThumbnailChoice, YouTubeVideoMetadata } from './youtube.models';

export type PublishQueueState = 'Waiting' | 'Held' | 'Uploading' | 'Published' | 'Failed' | 'Cancelled';

/**
 * How the time is kept. `ReleaseOnYouTube`: uploaded ahead as private and made public by
 * YouTube exactly on time (public videos only). `UploadAtTime`: the upload starts at the time.
 */
export type PublishQueueMode = 'ReleaseOnYouTube' | 'UploadAtTime';

export interface PublishQueueItem {
  id: string;
  jobId: string;
  projectId: string;
  projectName?: string | null;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  categoryName: string;
  privacy: YouTubePrivacy;
  madeForKids: boolean;
  notifySubscribers: boolean;
  firstComment?: string | null;
  relatedVideoIds: string[];
  planItemId?: string | null;
  hasCustomThumbnail: boolean;
  thumbnailFrameAt?: number | null;
  notes?: string | null;
  /** When it should be out (UTC ISO). Null while held without a time. */
  scheduledAt?: string | null;
  mode: PublishQueueMode;
  effectiveMode: PublishQueueMode;
  /** When the upload starts (UTC ISO); earlier than scheduledAt for a YouTube release. */
  dueAt?: string | null;
  state: PublishQueueState;
  attempts: number;
  errorCode?: string | null;
  error?: string | null;
  warning?: string | null;
  percent?: number | null;
  videoId?: string | null;
  videoUrl?: string | null;
  studioUrl?: string | null;
  youTubePublishAt?: string | null;
  durationSeconds?: number | null;
  isVertical: boolean;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  canEdit: boolean;
}

export interface PublishQueueBoard {
  items: PublishQueueItem[];
  counts: { waiting: number; held: number; uploading: number; published: number; failed: number; cancelled: number };
  serverTimeUtc: string;
  releaseLeadMinutes: number;
  /** False when the scheduler is off or YouTube isn't set up: nothing goes out on its own. */
  autoPublish: boolean;
}

export interface PublishQueueCandidate {
  jobId: string;
  projectId: string;
  projectName: string;
  name: string;
  createdAt: string;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  isVertical: boolean;
  onYouTube: boolean;
  inQueue: boolean;
}

export interface PublishSlot {
  at: string;
  reason: string;
}

export interface CategorySuggestion {
  categoryId: string;
  name: string;
  score: number;
  confidence: 'strong' | 'good' | 'weak';
  reason: string;
}

/** A render for the board: the publish dialog's request plus when and how it goes out. */
export interface PublishQueueAdd {
  channelId: string;
  metadata: YouTubeVideoMetadata;
  relatedVideoIds?: string[];
  firstComment?: string | null;
  thumbnail?: YouTubeThumbnailChoice | null;
  planItemId?: string | null;
  scheduledAt?: string | null;
  mode: PublishQueueMode;
  hold: boolean;
  notes?: string | null;
}

export interface PublishQueueUpdate {
  channelId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacy?: YouTubePrivacy;
  madeForKids?: boolean;
  notifySubscribers?: boolean;
  firstComment?: string;
  scheduledAt?: string;
  mode?: PublishQueueMode;
  notes?: string;
  removeThumbnail?: boolean;
}

export type QueueBulkStrategy = 'Slots' | 'Interval' | 'Hold' | 'Now';

export interface PublishQueueBulk {
  jobIds: string[];
  channelId: string;
  strategy: QueueBulkStrategy;
  startAt?: string | null;
  intervalHours?: number | null;
  timeZone?: string | null;
  mode: PublishQueueMode;
  privacy?: YouTubePrivacy | null;
  madeForKids?: boolean | null;
  notifySubscribers?: boolean | null;
  /** A category id, or 'auto' to suggest one per video from its own words. */
  categoryId?: string | null;
  titleSuffix?: string | null;
  tags?: string[] | null;
  skipPublished: boolean;
}

export interface PublishQueueBulkResult {
  started: number;
  skipped: number;
  failed: number;
  results: { jobId: string; ok: boolean; skipped: boolean; code?: string | null; message: string }[];
}

export const QUEUE_MODE_LABELS: Record<PublishQueueMode, string> = {
  ReleaseOnYouTube: 'Upload ahead · YouTube releases on time',
  UploadAtTime: 'Upload at the time',
};

/** A Date as a datetime-local value (the viewer's own time zone), e.g. 2026-10-28T18:00. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local value back to a Date; a string without a zone is read as local time. */
export function fromLocalInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Tue 28 Oct, 18:00" in the viewer's locale and time zone. */
export function formatWhen(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** "in 3h 12m", "in 2d 4h", "5m ago". */
export function relativeTime(value: string | Date, now: number): string {
  const ms = (typeof value === 'string' ? Date.parse(value) : value.getTime()) - now;
  const past = ms < 0;
  let mins = Math.round(Math.abs(ms) / 60000);
  if (mins < 1) return past ? 'just now' : 'now';
  const days = Math.floor(mins / 1440);
  mins -= days * 1440;
  const hours = Math.floor(mins / 60);
  mins -= hours * 60;
  const text = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return past ? `${text} ago` : `in ${text}`;
}
