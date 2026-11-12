/** One upload as the analysis sees it, with how it has done for its age. */
export interface AnalyzedVideo {
  videoId: string;
  title: string;
  publishedAtUtc: string | null;
  durationSeconds: number | null;
  /** public, unlisted or private. Only public videos count towards the findings. */
  privacy: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
  viewsPerDay: number;
  /** Likes and comments per hundred views. */
  engagement: number | null;
  isShort: boolean;
  url: string;
  /** YouTube Analytics totals; null until read (the channel must allow Analytics). */
  analytics: VideoAnalytics | null;
}

/** What YouTube Analytics says about one video over its life. */
export interface VideoAnalytics {
  watchMinutes: number;
  averageViewSeconds: number;
  /** Average share of the video watched, 0-100 (a rewatched Short can pass 100). */
  averageViewPercent: number;
  subscribersGained: number;
  subscribersLost: number;
  shares: number;
}

/** One day of Analytics numbers; `day` is yyyy-MM-dd. */
export interface DailyPoint {
  day: string;
  views: number;
  watchMinutes: number;
  subscribersGained: number;
  subscribersLost: number;
}

/** How videos did when they went up this many days after the one before. */
export interface GapBucket {
  label: string;
  minDays: number;
  videos: number;
  /** Median of views a day over the typical video of its kind: 1 is typical. */
  medianScore: number;
}

/** How long to leave between uploads, learnt from the channel's history where it shows something. */
export interface UploadRhythm {
  recommendedGapDays: number;
  fromHistory: boolean;
  buckets: GapBucket[];
  lastUploadAtUtc: string | null;
  lastUploadTitle: string | null;
  lastIsShort: boolean;
  /** The last upload is young and doing better than usual. */
  lastIsHot: boolean;
  reason: string;
}

/** A video looked up by link. Another channel's video has public numbers only. */
export interface VideoLookup {
  videoId: string;
  title: string;
  own: boolean;
  publishedAtUtc: string | null;
  durationSeconds: number | null;
  privacy: string | null;
  thumbnailUrl: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  viewsPerDay: number;
  engagement: number | null;
  isShort: boolean;
  tags: string[];
  analytics: VideoAnalytics | null;
  /** Empty in the channel list; opening a lookup reads them. */
  daily: DailyPoint[];
  hasDaily: boolean;
  analyticsNote: string | null;
  lookedUpAtUtc: string;
  url: string;
}

export interface ChannelFinding {
  kind: 'good' | 'warn' | 'info';
  text: string;
}

/** What the numbers show, worked out on the server without any model. */
export interface ChannelInsights {
  publicVideos: number;
  medianViewsPerDay: number;
  engagement: number | null;
  shorts: number;
  longVideos: number;
  shortsMedianViewsPerDay: number | null;
  longMedianViewsPerDay: number | null;
  daysBetweenUploads: number | null;
  daysSinceLastUpload: number | null;
  bestWeekday: string | null;
  top: AnalyzedVideo[];
  low: AnalyzedVideo[];
  findings: ChannelFinding[];
  rhythm: UploadRhythm | null;
}

export interface ChannelSuggestion {
  title: string;
  detail: string | null;
  priority: 'high' | 'medium' | 'low';
}

export interface ChannelPlanStep {
  when: string | null;
  action: string;
}

export interface ChannelVideoIdea {
  title: string;
  why: string | null;
  format: 'short' | 'long';
}

/** The advice: from a text model when one is on, otherwise from fixed rules ('built-in'). */
export interface ChannelReport {
  summary: string;
  whatWorks: string[];
  whatToFix: string[];
  suggestions: ChannelSuggestion[];
  plan: ChannelPlanStep[];
  ideas: ChannelVideoIdea[];
  by: string;
  goal: string | null;
  createdAtUtc: string;
}

/** A connected channel and what was last found out about it. */
export interface ChannelAnalysis {
  channelId: string;
  channelTitle: string;
  channelHandle: string | null;
  thumbnailUrl: string | null;
  needsReconnect: boolean;
  /** The numbers can be read from YouTube again now. */
  canRefresh: boolean;
  /** While the numbers are fresh: when they can be read again. */
  nextRefreshAtUtc: string | null;
  /** When the numbers shown were read; null before the first read. */
  fetchedAtUtc: string | null;
  fetchError: string | null;
  subscribers: number | null;
  totalViews: number | null;
  totalVideos: number | null;
  insights: ChannelInsights | null;
  videos: AnalyzedVideo[];
  report: ChannelReport | null;
  /** The connection allows YouTube Analytics; false for one connected before it was asked for. */
  canReadAnalytics: boolean;
  analyticsFetchedAtUtc: string | null;
  analyticsError: string | null;
  /** The channel day by day over the last 90 days, oldest first. */
  daily: DailyPoint[];
  /** Videos looked up by link, newest first. */
  lookups: VideoLookup[];
}
