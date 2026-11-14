import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { ContentTopic } from '../models/calendar.models';
import { YouTubeChannel } from '../models/youtube.models';
import { EcosystemWebsite } from './ecosystem-config.service';

export type AutomationSourceType =
  | 'HinduPanchang'
  | 'HinduFestival'
  | 'DailyKatha'
  | 'AajKaItihaas'
  | 'Pratiyogita'
  | 'EcosystemSpotlight'
  | 'CustomPrompt';

export type AutomationPostMode = 'PreviewOnly' | 'AutoVideoAndPreview' | 'FullAutopilot';

export type AutomationVideoStrategy =
  | 'PreferUnusedDriveClipThenAiRender'
  | 'PreferUnusedDriveClipOnly'
  | 'PreferFinishedRenderJob'
  | 'AutoGenerateStoryVideo'
  | 'ManualAttachOnly';

export type AutomationVideoFormat = 'Vertical' | 'Wide';

export type AutomationPostStatus =
  | 'PreparedPreview'
  | 'GeneratingVideo'
  | 'VideoReadyForReview'
  | 'Approved'
  | 'Publishing'
  | 'Published'
  | 'Failed'
  | 'Skipped';

export interface EcosystemPanchangSignal {
  dateKey: string;
  location: string;
  tithi: string;
  tithiEndTime?: string | null;
  nakshatra: string;
  nakshatraEndTime?: string | null;
  yoga: string;
  karana: string;
  vaara: string;
  paksha?: string | null;
  monthPurnimanta?: string | null;
  vikramSamvat?: string | null;
  sunrise: string;
  sunset: string;
  abhijitMuhurat: string;
  brahmaMuhurat: string;
  amritKaal: string;
  rahuKaal: string;
  dailySanskritSutra?: string | null;
  dailySutraMeaning?: string | null;
}

export interface EcosystemFestivalSignal {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  dateKey: string;
  tithi?: string | null;
  monthVedic?: string | null;
  description: string;
  ritualsAndPujaVidhi?: string | null;
  fastingRules?: string | null;
  isMajorFestival: boolean;
  category?: string | null;
}

export interface EcosystemDailyKathaSignal {
  id?: string | null;
  title: string;
  deityOrSage: string;
  storySummary: string;
  moralTeaching?: string | null;
  sanskritMantra?: string | null;
}

export interface EcosystemHistoricalSignal {
  id?: string | null;
  dateKey: string;
  year: number;
  title: string;
  category: string;
  description: string;
  culturalSignificance?: string | null;
}

export interface EcosystemCompetitionSignal {
  id: string;
  title: string;
  category: string;
  status: string;
  prizeOrHighlight?: string | null;
  deadlineLabel?: string | null;
  webUrl?: string | null;
}

export interface EcosystemFunnelCampaignSignal {
  id: string;
  slug: string;
  title: string;
  sourcePlatform: string;
  destinationUrl: string;
  callToActionText?: string | null;
}

export interface EcosystemSignalsSnapshot {
  dateKey: string;
  location: string;
  panchang?: EcosystemPanchangSignal | null;
  upcomingFestivals: EcosystemFestivalSignal[];
  dailyKatha?: EcosystemDailyKathaSignal | null;
  historicalIncidents: EcosystemHistoricalSignal[];
  competitions: EcosystemCompetitionSignal[];
  funnelCampaigns: EcosystemFunnelCampaignSignal[];
  warnings: string[];
  fetchedAtUtc: string;
}

export interface AutomationWebsiteLink {
  key: string;
  label: string;
  baseUrl: string;
  trackedUrl: string;
}

export interface AutomationRule {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  sourceType: AutomationSourceType;
  mode: AutomationPostMode;
  videoStrategy: AutomationVideoStrategy;
  videoFormat: AutomationVideoFormat;
  targetChannelId?: string | null;
  targetChannelHandle?: string | null;
  targetChannelTitle?: string | null;
  brandChannelId?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  language: string;
  targetSeconds: number;
  location: string;
  preferredPublishTime: string;
  timeZoneId: string;
  daysOfWeek: number[];
  festivalLeadDays: number;
  funnelWebsiteKeys: string[];
  socialFunnelSlug?: string | null;
  privacy: string;
  categoryId: string;
  madeForKids: boolean;
  includePinnedComment: boolean;
  promptTemplateOverride?: string | null;
  descriptionFooterOverride?: string | null;
  customTopicPrompt?: string | null;
  sortOrder: number;
  lastPreparedDateKey?: string | null;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface AutomationPost {
  id: string;
  userId?: string;
  ruleId: string;
  ruleName: string;
  sourceType: AutomationSourceType;
  dateKey: string;
  fingerprint: string;
  sourceItemKey: string;
  sourceTitle: string;
  sourceSummary?: string | null;
  targetChannelId?: string | null;
  targetChannelHandle?: string | null;
  targetChannelTitle?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  title: string;
  script: string;
  aiVideoPrompt: string;
  aiThumbnailPrompt: string;
  description: string;
  pinnedComment?: string | null;
  tags: string[];
  categoryId: string;
  privacy: string;
  madeForKids: boolean;
  format: AutomationVideoFormat;
  language: string;
  primaryDestinationUrl?: string | null;
  trackedFunnelUrls: AutomationWebsiteLink[];
  attachedHandoffId?: string | null;
  attachedHandoffTitle?: string | null;
  attachedRenderJobId?: string | null;
  attachedStoryRunId?: string | null;
  attachedVideoSourceLabel?: string | null;
  status: AutomationPostStatus;
  scheduledAtUtc?: string | null;
  queueItemId?: string | null;
  uploadId?: string | null;
  publishedVideoId?: string | null;
  publishedVideoUrl?: string | null;
  lastError?: string | null;
  notes?: string | null;
  generatedByAi: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc?: string | null;
}

export interface AutomationWorkspaceConfig {
  globalAutopilotEnabled: boolean;
  autoPrepareDaily: boolean;
  defaultLocation: string;
  defaultTimeZone: string;
  panchangApiBaseUrl?: string | null;
  socialApiBaseUrl?: string | null;
  pratiyogitaApiBaseUrl?: string | null;
  useAiScriptRefinement: boolean;
  updatedAtUtc: string;
}

export interface AutomationVideoCandidate {
  kind: 'drive' | 'render' | string;
  id: string;
  title: string;
  topicId?: string | null;
  topicName?: string | null;
  durationSeconds?: number | null;
  sizeBytes?: number | null;
  isVertical: boolean;
  isUsed: boolean;
  createdAtUtc: string;
}

export interface AutomationPrepareResult {
  dateKey: string;
  rulesEvaluated: number;
  postsCreated: number;
  postsUpdated: number;
  autoVideosStarted: number;
  autoQueuedOrPublished: number;
  warnings: string[];
  posts: AutomationPost[];
}

export interface AutomationOverview {
  dateKey: string;
  settings: AutomationWorkspaceConfig;
  signals: EcosystemSignalsSnapshot;
  websites: EcosystemWebsite[];
  connectedChannels: YouTubeChannel[];
  topics: ContentTopic[];
  rules: AutomationRule[];
  posts: AutomationPost[];
  unusedDriveClipsCount: number;
  finishedRendersCount: number;
}

@Injectable({ providedIn: 'root' })
export class AutomationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/automation`;

  getOverview(date?: string): Observable<AutomationOverview> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.unwrap(
      this.http.get<ApiResponse<AutomationOverview>>(`${this.base}/overview`, { params })
    );
  }

  getSettings(): Observable<AutomationWorkspaceConfig> {
    return this.unwrap(
      this.http.get<ApiResponse<AutomationWorkspaceConfig>>(`${this.base}/settings`)
    );
  }

  saveSettings(config: AutomationWorkspaceConfig): Observable<AutomationWorkspaceConfig> {
    return this.unwrap(
      this.http.put<ApiResponse<AutomationWorkspaceConfig>>(`${this.base}/settings`, config)
    );
  }

  bootstrapRules(): Observable<AutomationRule[]> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationRule[]>>(`${this.base}/rules/bootstrap`, {})
    );
  }

  createRule(rule: Partial<AutomationRule>): Observable<AutomationRule> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationRule>>(`${this.base}/rules`, rule)
    );
  }

  updateRule(id: string, rule: Partial<AutomationRule>): Observable<AutomationRule> {
    return this.unwrap(
      this.http.put<ApiResponse<AutomationRule>>(`${this.base}/rules/${encodeURIComponent(id)}`, rule)
    );
  }

  deleteRule(id: string): Observable<void> {
    return this.unwrap(
      this.http.delete<ApiResponse<unknown>>(`${this.base}/rules/${encodeURIComponent(id)}`)
    ).pipe(map(() => undefined));
  }

  prepare(body: { dateKey?: string | null; ruleId?: string | null; forceRegenerate?: boolean }): Observable<AutomationPrepareResult> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPrepareResult>>(`${this.base}/prepare`, body)
    );
  }

  listQueue(filters?: { from?: string; to?: string; status?: AutomationPostStatus; limit?: number }): Observable<AutomationPost[]> {
    let params = new HttpParams();
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.limit) params = params.set('limit', String(filters.limit));
    return this.unwrap(
      this.http.get<ApiResponse<AutomationPost[]>>(`${this.base}/queue`, { params })
    );
  }

  updatePost(id: string, post: Partial<AutomationPost>): Observable<AutomationPost> {
    return this.unwrap(
      this.http.put<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(id)}`, post)
    );
  }

  deletePost(id: string): Observable<void> {
    return this.unwrap(
      this.http.delete<ApiResponse<unknown>>(`${this.base}/queue/${encodeURIComponent(id)}`)
    ).pipe(map(() => undefined));
  }

  getVideoCandidates(postId: string): Observable<AutomationVideoCandidate[]> {
    return this.unwrap(
      this.http.get<ApiResponse<AutomationVideoCandidate[]>>(`${this.base}/queue/${encodeURIComponent(postId)}/video-candidates`)
    );
  }

  attachVideo(postId: string, body: { handoffId?: string | null; renderJobId?: string | null }): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/attach-video`, body)
    );
  }

  generateVideo(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/generate-video`, {})
    );
  }

  publishPost(postId: string, body?: { publishNow?: boolean; scheduledAtUtc?: string | null }): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/publish`, body ?? { publishNow: true })
    );
  }

  private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || res.errors?.[0]?.message || 'Request failed');
        }
        return res.data as T;
      })
    );
  }
}
