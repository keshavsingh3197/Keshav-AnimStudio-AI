import { RenderJob } from './api.models';
import { PhoneHandoff } from './youtube.models';

/** The latest copy of a short to Google Drive. */
export interface ShortDrive {
  handoffId: string;
  /** Sending, WaitingForRender, Saved, Failed, WaitingForPhone, Applied, Expired, or Missing (deleted on Drive since). */
  state: string;
  /** The folder path on Drive, e.g. "OMKR Shorts / KATHU SHYAM / 2026-10-17 Single exports". */
  folderName: string;
  driveUrl: string | null;
  error: string | null;
  /** The topic (e.g. Mahadev) the copy is filed under. */
  topic?: string | null;
  /** When it was marked used (downloaded or posted); null when not used yet. */
  usedAt?: string | null;
  archived?: boolean;
}

export type LibraryView = 'active' | 'unused' | 'used' | 'archived' | 'all';

export interface LibraryQuery {
  search?: string;
  /** A topic id, or 'none' for shorts without one. */
  topicId?: string;
  view?: LibraryView;
  sort?: 'newest' | 'oldest' | 'name' | 'used';
  page: number;
  pageSize: number;
}

export interface LibraryItem {
  handoffId: string;
  jobId: string;
  projectId: string;
  projectName: string;
  title: string;
  durationSeconds: number | null;
  sizeBytes: number | null;
  createdAt: string;
  topicId: string | null;
  topicName: string | null;
  topicColor: string | null;
  usedAt: string | null;
  archived: boolean;
  drivePath: string;
  driveUrl: string | null;
}

export interface LibraryTopicCount {
  topicId: string;
  name: string;
  color: string;
  shorts: number;
  unused: number;
}

export interface LibraryPage {
  items: LibraryItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  counts: { active: number; unused: number; used: number; archived: number; noTopic: number };
  topics: LibraryTopicCount[];
}

export interface LibraryBulk {
  done: number;
  failed: number;
  error: string | null;
}

/** Where a short stands on YouTube. */
export interface ShortYouTube {
  state: 'Published' | 'Queued' | 'Uploading' | 'Failed';
  videoId: string | null;
  videoUrl: string | null;
  channelTitle: string | null;
  privacy: string | null;
  percent: number;
  error: string | null;
}

/** What a Drive check found: copies still there, gone, moved into project folders, or not checkable. */
export interface ShortsDriveCheck {
  checked: number;
  present: number;
  missing: number;
  moved: number;
  failed: number;
  error: string | null;
}

export interface ShortRow {
  job: RenderJob;
  projectName: string;
  drive: ShortDrive | null;
  youtube: ShortYouTube | null;
}

export interface ShortsCounts {
  total: number;
  rendering: number;
  ready: number;
  failed: number;
  onYouTube: number;
  notOnYouTube: number;
  onDrive: number;
  notOnDrive: number;
  madeThisWeek: number;
  /** 0 when no goal is set. */
  weeklyGoal: number;
}

/** A project's clips and pictures, and how many no short has used yet. */
export interface ShortsPool {
  projectId: string;
  projectName: string;
  videos: number;
  images: number;
  unusedVideos: number;
  unusedImages: number;
  batches: number;
  shorts: number;
}

export interface ShortsAlert {
  /** pool-empty, pool-low, weekly-goal, not-on-youtube, render-failed, drive-failed */
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  projectId: string | null;
  count: number;
}

export interface ShortsOverview {
  shorts: ShortRow[];
  counts: ShortsCounts;
  pools: ShortsPool[];
  alerts: ShortsAlert[];
}

/** Work still going on the server, for the activity panel to pick back up after a refresh. */
export interface ShortsActive {
  jobs: RenderJob[];
  driveCopies: PhoneHandoff[];
}

export interface ShortsBulkResult {
  jobId: string;
  ok: boolean;
  skipped: boolean;
  code: string | null;
  message: string;
}

export interface ShortsBulkResponse {
  started: number;
  skipped: number;
  failed: number;
  results: ShortsBulkResult[];
}

/** Many renders to one channel; anything left unset comes from each render's draft and the channel defaults. */
export interface YouTubeBulkPublishBody {
  jobIds: string[];
  channelId: string;
  privacy?: 'public' | 'unlisted' | 'private' | null;
  madeForKids?: boolean | null;
  notifySubscribers?: boolean | null;
  titleSuffix?: string | null;
  description?: string | null;
  tags?: string[] | null;
  skipPublished: boolean;
}

/** A batch of shorts as the Shorts page groups them: one Auto Shorts run, or a project's one-off renders. */
export interface ShortsGroup {
  key: string;
  title: string;
  projectId: string;
  projectName: string;
  /** True for an Auto Shorts batch; false for the one-off renders of a project. */
  isBatch: boolean;
  createdAt: string;
  rows: ShortRow[];
}

/** Groups rows into batches (newest first), with each project's one-off renders as their own group. */
export function groupShorts(rows: readonly ShortRow[]): ShortsGroup[] {
  const groups = new Map<string, ShortsGroup>();
  for (const row of rows) {
    const key = row.job.batchId ? `batch:${row.job.batchId}` : `single:${row.job.projectId}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        title: row.job.batchId ? row.job.batchName || 'Auto shorts' : 'Single exports',
        projectId: row.job.projectId,
        projectName: row.projectName,
        isBatch: !!row.job.batchId,
        createdAt: row.job.createdAt,
        rows: [],
      };
      groups.set(key, group);
    }
    group.rows.push(row);
    if (row.job.createdAt > group.createdAt) group.createdAt = row.job.createdAt;
  }
  for (const g of groups.values()) {
    g.rows.sort((a, b) => (a.job.batchIndex ?? 0) - (b.job.batchIndex ?? 0) || a.job.createdAt.localeCompare(b.job.createdAt));
  }
  return [...groups.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isReady(row: ShortRow): boolean {
  return (row.job.status === 'Completed' || row.job.status === 'CompletedWithWarnings') && row.job.hasOutput;
}

export function isOnDrive(row: ShortRow): boolean {
  return !!row.drive && ['Saved', 'WaitingForPhone', 'Applied', 'Expired'].includes(row.drive.state);
}

export function isOnYouTube(row: ShortRow): boolean {
  return row.youtube?.state === 'Published';
}
