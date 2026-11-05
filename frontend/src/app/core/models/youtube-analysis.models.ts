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
}
