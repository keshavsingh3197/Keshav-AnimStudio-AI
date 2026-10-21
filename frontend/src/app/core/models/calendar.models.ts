/** The content calendar: topics, the posts they plan, and the source links saved per topic. */

export type ContentPlanStatus = 'Idea' | 'InProgress' | 'Ready' | 'Scheduled' | 'Published' | 'Skipped';

export type DayOfWeekName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const WEEK_DAYS: DayOfWeekName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const STATUS_LABELS: Record<ContentPlanStatus, string> = {
  Idea: 'Idea',
  InProgress: 'In progress',
  Ready: 'Ready',
  Scheduled: 'Scheduled on YouTube',
  Published: 'Live',
  Skipped: 'Skipped',
};

/** The statuses the owner picks; Scheduled/Published normally come from YouTube but can be set by hand. */
export const STATUS_ORDER: ContentPlanStatus[] = ['Idea', 'InProgress', 'Ready', 'Scheduled', 'Published', 'Skipped'];

export interface ContentTopic {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  channelId?: string | null;
  channelTitle?: string | null;
  days: DayOfWeekName[];
  publishTime: string;
  timeZone: string;
  leadDays: number;
  planAheadDays: number;
  autoSchedule: boolean;
  autoLinkUploads: boolean;
  tags: string[];
  checklist: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContentTopicRequest = Omit<ContentTopic, 'id' | 'createdAt' | 'updatedAt'>;

export type ContentAttentionLevel = 'Info' | 'Warning' | 'Problem';

export interface ContentAttention {
  code: string;
  level: ContentAttentionLevel;
  message: string;
}

export interface ContentChecklistItem {
  text: string;
  done: boolean;
}

export interface ContentYouTubeState {
  title: string;
  privacy?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  exists: boolean;
  checkedAt: string;
}

export interface ContentPlanItem {
  id: string;
  topicId: string;
  title: string;
  notes?: string | null;
  publishAt: string;
  prepareBy: string;
  status: ContentPlanStatus;
  autoPlanned: boolean;
  checklist: ContentChecklistItem[];
  projectId?: string | null;
  fileLink?: string | null;
  channelId?: string | null;
  videoId?: string | null;
  videoUrl?: string | null;
  studioUrl?: string | null;
  videoAutoLinked: boolean;
  youTube?: ContentYouTubeState | null;
  syncMessage?: string | null;
  readyAt?: string | null;
  attention: ContentAttention[];
  updatedAt: string;
}

export interface ContentPlanItemRequest {
  topicId: string;
  title: string;
  notes?: string | null;
  publishAt: string;
  status: ContentPlanStatus;
  checklist?: ContentChecklistItem[];
  projectId?: string | null;
  fileLink?: string | null;
}

export type ContentLinkOrigin = 'Manual' | 'Download';

export interface ContentSourceLink {
  id: string;
  url: string;
  platformId?: string | null;
  platformName: string;
  title: string;
  note?: string | null;
  topicId?: string | null;
  planItemId?: string | null;
  projectId?: string | null;
  assetId?: string | null;
  origin: ContentLinkOrigin;
  downloadCount: number;
  used: boolean;
  createdAt: string;
  lastCapturedAt: string;
}

export interface ContentSourceLinkRequest {
  url?: string;
  title?: string | null;
  note?: string | null;
  topicId?: string | null;
  planItemId?: string | null;
  used: boolean;
}

export interface ContentUploadCandidate {
  videoId: string;
  title: string;
  privacy?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  suggested: boolean;
}

/** Worst attention level on a post, or null when it's on track. */
export function worstAttention(item: ContentPlanItem): ContentAttentionLevel | null {
  if (item.attention.some((a) => a.level === 'Problem')) return 'Problem';
  if (item.attention.some((a) => a.level === 'Warning')) return 'Warning';
  if (item.attention.some((a) => a.level === 'Info')) return 'Info';
  return null;
}
