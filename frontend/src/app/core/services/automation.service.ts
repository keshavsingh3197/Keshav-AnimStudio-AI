import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { silentHttpContext } from '../interceptors/loading.interceptor';
import { ApiResponse } from '../models/api.models';
import { ContentTopic } from '../models/calendar.models';
import { YouTubeChannel } from '../models/youtube.models';
import { EcosystemWebsite } from './ecosystem-config.service';
import { MediaTicketService } from './media-ticket.service';

export type AutomationSourceType =
  | 'HinduPanchang'
  | 'HinduFestival'
  | 'DailyKatha'
  | 'AajKaItihaas'
  | 'Pratiyogita'
  | 'EcosystemSpotlight'
  | 'CustomPrompt'
  | 'FunnyComedy'
  | 'DailyRashifal';

export type AutomationPostMode = 'PreviewOnly' | 'AutoVideoAndPreview' | 'FullAutopilot';

export type AutomationVideoStrategy =
  | 'PreferUnusedDriveClipThenAiRender'
  | 'PreferUnusedDriveClipOnly'
  | 'PreferFinishedRenderJob'
  | 'AutoGenerateStoryVideo'
  | 'ManualAttachOnly'
  | 'AutoGenerateAnimated3DVideo';

export type ProceduralSceneTheme =
  | 'Auto'
  | 'VedicTempleSunrise3D'
  | 'CosmosSacred3D'
  | 'HistoryChronicle3D'
  | 'NeonCyberGrid3D'
  | 'SereneNatureGlow';

export type AutomationVideoFormat = 'Vertical' | 'Wide' | 'CommunityPost';

export type AutomationVisualEngine =
  | 'Auto'
  | 'AiRealisticStory'
  | 'StorageImagesStory'
  | 'Procedural3D';

export type AutomationNarrativeMode = 'Auto' | 'ShortReel' | 'FullStory';

export type ComedyToneStyle =
  | 'Auto'
  | 'KhadiBhasha'
  | 'TuTadak'
  | 'RoastAndTwist'
  | 'FamilyClean'
  | 'GlobalSlapstick'
  | 'TankSeries'
  | 'DesiKhadiSitcom';

export type SubtitleMotionPreset = 'event-glow' | 'karaoke-pulse' | 'classic-clean';

export interface AutomationStorageImageItem {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  width?: number | null;
  height?: number | null;
  updatedAtUtc: string;
}

export interface AutomationCharacterProfileItem {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  description?: string | null;
  isNarrator: boolean;
  subtitleColorHex?: string | null;
}

export interface AutomationStorageCatalog {
  images: AutomationStorageImageItem[];
  characters: AutomationCharacterProfileItem[];
}

export interface ProceduralEventPalette {
  eventKey: string;
  displayLabel: string;
  headerBadgeText: string;
  recommendedTheme: ProceduralSceneTheme;
  primaryHex: string;
  secondaryHex: string;
  speakerAHex: string;
  speakerBHex: string;
  titleHex: string;
}

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
  nextTithi?: string | null;
  nextNakshatra?: string | null;
  moonSign?: string | null;
  sunSign?: string | null;
  panchakStatus?: string | null;
  chandrabalamGoodRashis?: string[] | null;
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
  isVerified?: boolean;
  sourceName?: string | null;
  sourceUrl?: string | null;
  verificationNote?: string | null;
  isExactDateMatch?: boolean | null;
}

export interface SignalVerificationCheck {
  category: string;
  status: string;
  message: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  verifySearchUrl?: string | null;
}

export interface SignalVerificationReport {
  overallStatus: string;
  summary: string;
  checks: SignalVerificationCheck[];
  mismatchesCount: number;
  warningsCount: number;
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
  verification?: SignalVerificationReport | null;
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
  subtitlePreset?: SubtitleMotionPreset | string;
  enableCharacterDialogue?: boolean;
  speakerAName?: string | null;
  speakerBName?: string | null;
  visualEngine?: AutomationVisualEngine;
  narrativeMode?: AutomationNarrativeMode;
  attachedAssetIds?: string[];
  comedyStyle?: ComedyToneStyle;
  autoInsertMemes?: boolean;
  showWatermark?: boolean | null;
  preferFast2DAnimation?: boolean;
  sortOrder: number;
  lastPreparedDateKey?: string | null;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface AutomationScriptTemplate {
  kind: 'story' | 'dialogue';
  ready: boolean;
  prompt?: string | null;
  message?: string | null;
}

/** An earlier upload of a card that is no longer on YouTube. */
export interface AutomationRemovedVideo {
  videoId: string;
  channelId?: string | null;
  channelTitle?: string | null;
  removedAtUtc: string;
  /** True when the app deleted it; false when it was found missing / marked as deleted in YouTube Studio. */
  deletedByApp: boolean;
}

export interface AutomationYouTubeRemoval {
  /** Delete the video on YouTube through the API; false = it was already deleted in YouTube Studio. */
  deleteOnYouTube: boolean;
  /** Move the card to another connected channel (null keeps the current one). */
  targetChannelId?: string | null;
  /** Upload again right away (to the new channel when given). */
  republishNow: boolean;
}

/** Fractions of the video frame: x = figure centre across, y = ground line (feet) down, scale = size multiplier. */
export interface AutomationCharacterPlacement {
  x: number;
  y: number;
  scale: number;
}

export interface AutomationStageSettings {
  /** A Studio Storage image used as the whole, still background; characters and light effects play on top. */
  backgroundTemplateAssetId?: string | null;
  /** Where the story happens; picks the 3D setting and guides the script. */
  locationPrompt?: string | null;
  leftCharacter?: AutomationCharacterPlacement | null;
  rightCharacter?: AutomationCharacterPlacement | null;
  includeBackgroundMusic: boolean;
  /** Speak every line as written at natural speed; the video ends with the narration. */
  followScriptExactly: boolean;
  /** Story engines: pause after the voices, the music and the finished video for a check in the Story Studio. */
  reviewSteps?: boolean;
  /** Optional SongLibrary track id (`song_<hex>`) to mux behind the 3D scene. */
  attachedSongId?: string | null;
  /** Camera move over the background picture; 'Still' keeps characters exactly on their spots. */
  backgroundMotion?: AutomationBackdropMotion;
  /**
   * The user's own picture for each directed scene, in order (picture 1 = first [SCENE] line). Used when there is no
   * single background picture.
   */
  sceneBackgroundAssetIds?: string[];
}

/** One scene that gets its own picture, in render order. */
export interface AutomationScenePicture {
  number: number;
  setting: string;
  timeOfDay: string;
  mood?: string | null;
  prompt: string;
}

/** The pictures a script needs (picture n = scene n) and one numbered prompt to make the whole set elsewhere. */
export interface AutomationScenePicturePlan {
  width: number;
  height: number;
  aspectRatio: string;
  scenes: AutomationScenePicture[];
  batchPrompt: string;
  negativePrompt: string;
}

export type AutomationBackdropMotion = 'Still' | 'GentleZoom' | 'SlowPan';

/** Image prompt for a post's background picture: paste into any image tool, or let the app's image engine make it. */
export interface AutomationBackgroundPrompt {
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  width: number;
  height: number;
  /** What the place was taken from: 'location' | 'script' | 'topic' | 'event'. */
  basis: string;
}

export interface AutomationGeneratedBackground {
  assetId: string;
  provider: string;
  prompt: string;
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
  thumbnailStorageKey?: string | null;
  thumbnailFrameAtSeconds?: number | null;
  thumbnailSource?: string | null;
  status: AutomationPostStatus;
  scheduledAtUtc?: string | null;
  queueItemId?: string | null;
  uploadId?: string | null;
  publishedVideoId?: string | null;
  publishedVideoUrl?: string | null;
  publishedChannelId?: string | null;
  publishedChannelTitle?: string | null;
  removedVideos?: AutomationRemovedVideo[];
  lastError?: string | null;
  notes?: string | null;
  generatedByAi: boolean;
  communityPostText?: string | null;
  communityPollOptions?: string[];
  communityCardStorageKey?: string | null;
  eventColorHex?: string | null;
  headerBannerText?: string | null;
  enableCharacterDialogue?: boolean;
  speakerAName?: string | null;
  speakerBName?: string | null;
  subtitlePreset?: SubtitleMotionPreset | string | null;
  visualEngine?: AutomationVisualEngine;
  narrativeMode?: AutomationNarrativeMode;
  targetSeconds?: number | null;
  attachedAssetIds?: string[];
  /** Enhanced 3D stage choices (background template, character spots, location, music, pacing). */
  stage?: AutomationStageSettings | null;
  provisionedCharacterNames?: string[];
  storyStageSummary?: string | null;
  storyProgressPercent?: number | null;
  syncedToEcosystemAtUtc?: string | null;
  verificationStatus?: string | null;
  verificationSummary?: string | null;
  verificationSourceName?: string | null;
  verificationSourceUrl?: string | null;
  verificationIssues?: string[] | null;
  verifiedAtUtc?: string | null;
  showWatermark?: boolean | null;
  preferFast2DAnimation?: boolean;
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
  panchangShowWatermark?: boolean;
  panchangUseFast2DAnimation?: boolean;
  panchangDefaultThumbnailAssetId?: string | null;
  panchangDefaultBackgroundAssetId?: string | null;
  panchangThumbnailTitleTemplate?: string | null;
  panchangThumbnailSubtitleTemplate?: string | null;
  updatedAtUtc: string;
}

export interface RecommendedPublishSlot {
  atUtc: string;
  localLabel: string;
  reason: string;
  expectedReachTier: string;
}

export interface PromotionDestinationAdvice {
  platform: string;
  title: string;
  timingHint: string;
  actionSummary: string;
  priority: string;
}

export interface AutomationPublishAdvice {
  sourceType: string;
  timeZoneId: string;
  recommendedAtUtc: string;
  slots: RecommendedPublishSlot[];
  promotions: PromotionDestinationAdvice[];
}

export interface DailyRashiForecast {
  key: string;
  order: number;
  hindiName: string;
  englishName: string;
  symbol: string;
  rulerHindi: string;
  elementHindi: string;
  meaningSummary: string;
  todayPredictionHindi: string;
  todayPredictionEnglish: string;
  aacharanUpayHindi: string;
  aacharanUpayEnglish: string;
  luckyColor: string;
  luckyNumber: number;
  mantra: string;
  isShubhChandrabalam: boolean;
  gocharHouseFromMoon: number;
  favorabilityScore: number;
  statusBadge: string;
}

export interface DailyRashifalReport {
  dateKey: string;
  location: string;
  moonSign?: string | null;
  sunSign?: string | null;
  tithi: string;
  nakshatra: string;
  vaara: string;
  abhijitMuhurat: string;
  rahuKaal: string;
  isVerifiedPanchang: boolean;
  rashis: DailyRashiForecast[];
}

export interface RenderTemplateThumbnailRequest {
  dateText?: string | null;
  titleText?: string | null;
  subtitleText?: string | null;
  backgroundAssetId?: string | null;
  showWatermark?: boolean | null;
  watermarkText?: string | null;
  saveAsDefaultBackground?: boolean;
}

export interface GenerateRashifalShortsRequest {
  dateKey?: string | null;
  location?: string | null;
  language?: string;
  rashiKeys?: string[] | null;
  renderVideosNow?: boolean;
  showWatermark?: boolean | null;
  backgroundAssetId?: string | null;
  targetChannelId?: string | null;
  autoSchedulePeakSlots?: boolean;
}

export interface GenerateRashifalShortsResult {
  dateKey: string;
  location: string;
  createdCount: number;
  renderedCount: number;
  warnings: string[];
  posts: AutomationPost[];
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
  private readonly media = inject(MediaTicketService);
  private readonly base = `${environment.apiUrl}/api/automation`;

  getPalettes(): Observable<ProceduralEventPalette[]> {
    return this.unwrap(
      this.http.get<ApiResponse<ProceduralEventPalette[]>>(`${this.base}/palettes`)
    );
  }

  /** `background` marks refresh polls so they never raise the global "waking up" loader. */
  getOverview(date?: string, background = false): Observable<AutomationOverview> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.unwrap(
      this.http.get<ApiResponse<AutomationOverview>>(`${this.base}/overview`, {
        params,
        context: background ? silentHttpContext() : undefined,
      })
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

  postThumbnailUrl(postId: string, versionKey?: string | null): string {
    const suffix = versionKey ? `?v=${encodeURIComponent(versionKey)}` : '';
    return this.media.sign(`${this.base}/queue/${encodeURIComponent(postId)}/thumbnail${suffix}`);
  }

  setPostThumbnail(
    postId: string,
    body: { imageBase64?: string | null; frameAtSeconds?: number | null; storageAssetId?: string | null }
  ): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/thumbnail`, body)
    );
  }

  generateAiThumbnail(postId: string, prompt?: string | null): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/thumbnail/generate`,
        { prompt: prompt ?? null },
        { context: silentHttpContext() }
      )
    );
  }

  deletePostThumbnail(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.delete<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/thumbnail`)
    );
  }

  autoFillDetails(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/autofill-details`, {})
    );
  }

  getStorageMediaCatalog(): Observable<AutomationStorageCatalog> {
    return this.unwrap(
      this.http.get<ApiResponse<AutomationStorageCatalog>>(`${this.base}/storage-images`)
    );
  }

  storageAssetThumbnailUrl(assetId: string): string {
    return this.media.sign(`${environment.apiUrl}/api/assets/${encodeURIComponent(assetId)}/thumbnail`);
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

  generateVideo(
    postId: string,
    body?: {
      visualEngine?: AutomationVisualEngine;
      narrativeMode?: AutomationNarrativeMode;
      targetSeconds?: number | null;
      attachedAssetIds?: string[];
      /** Start the Story Agent run in manual-writer mode: it waits for a script pasted from an outside AI. */
      useTemplateScript?: boolean;
    }
  ): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/generate-video`,
        body ?? {}
      )
    );
  }

  /** Starts the post's failed story run again from the step it stopped at; what was already made is kept. */
  retryVideo(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/retry-video`, {})
    );
  }

  /** The copy-and-paste script template for an outside AI tool (story JSON, or Enhanced 3D dialogue lines). */
  /** `targetSeconds` is the length picked in the wizard (0 = let the server choose from the post and rule). */
  getScriptTemplate(postId: string, engine: AutomationVisualEngine, targetSeconds = 0): Observable<AutomationScriptTemplate> {
    const params: Record<string, string> = { engine };
    if (targetSeconds > 0) params['targetSeconds'] = String(targetSeconds);
    return this.unwrap(
      this.http.get<ApiResponse<AutomationScriptTemplate>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/script-template`,
        { params }
      )
    );
  }

  /** Sends the outside AI's reply; the video continues from it on the server. */
  submitScriptTemplate(
    postId: string,
    engine: AutomationVisualEngine,
    reply: string,
    options: { targetSeconds?: number; subtitlePreset?: string | null } = {}
  ): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/script-template`,
        {
          engine,
          reply,
          targetSeconds: options.targetSeconds && options.targetSeconds > 0 ? options.targetSeconds : null,
          subtitlePreset: options.subtitlePreset || null,
        },
        // A 3D reply renders inside this request for minutes; the wizard shows that progress itself.
        { context: engine === 'Procedural3D' ? silentHttpContext() : undefined }
      )
    );
  }

  generateAnimatedVideo(
    postId: string,
    body?: {
      theme?: ProceduralSceneTheme;
      durationSeconds?: number;
      resolution?: '720p' | '1080p';
      format?: AutomationVideoFormat;
      enableCharacterDialogue?: boolean;
      subtitlePreset?: SubtitleMotionPreset | string;
      speakerAName?: string | null;
      speakerBName?: string | null;
      narrativeMode?: AutomationNarrativeMode;
      attachedAssetIds?: string[];
    }
  ): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/generate-animated-video`,
        body ?? {},
        // Renders inside this request for minutes; the hub shows live progress, so it is not a "server waking up" wait.
        { context: silentHttpContext() }
      )
    );
  }

  /** Saves the Enhanced 3D stage choices for a post; used by the next render (AI, template paste or autopilot). */
  saveStage(postId: string, stage: AutomationStageSettings): Observable<AutomationPost> {
    return this.unwrap(
      this.http.put<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/stage`, stage)
    );
  }

  /** The project uploaded background templates go into (created on first use); upload through its asset upload. */
  backgroundTemplateProject(): Observable<{ projectId: string }> {
    return this.unwrap(
      this.http.post<ApiResponse<{ projectId: string }>>(`${this.base}/background-templates/project`, {})
    );
  }

  /** A ready image prompt for this post's background picture, built from the wizard's unsaved stage choices. */
  backgroundPicturePrompt(postId: string, stage: AutomationStageSettings): Observable<AutomationBackgroundPrompt> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationBackgroundPrompt>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/background-picture/prompt`,
        { stage }
      )
    );
  }

  /** The scene pictures a script needs, in render order. Uses the pasted reply when given, else the post's script. */
  scenePicturePlan(postId: string, script: string | null, stage: AutomationStageSettings): Observable<AutomationScenePicturePlan> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationScenePicturePlan>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/scene-pictures/plan`,
        { script, stage },
        { context: silentHttpContext() }
      )
    );
  }

  /** Makes the background picture with the configured image engine; returns the new Studio Storage asset id. */
  generateBackgroundPicture(postId: string, stage: AutomationStageSettings, prompt: string | null): Observable<AutomationGeneratedBackground> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationGeneratedBackground>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/background-picture/generate`,
        { stage, prompt },
        // The hub shows its own spinner; image engines can take up to a couple of minutes.
        { context: silentHttpContext() }
      )
    );
  }

  generateCommunityCard(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/community-card`,
        {}
      )
    );
  }

  communityCardUrl(postId: string): string {
    return this.media.sign(`${this.base}/queue/${encodeURIComponent(postId)}/community-card`);
  }

  markCommunityPosted(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/mark-community-posted`,
        {}
      )
    );
  }

  /** Deletes the card's video from YouTube (or records it is already gone) and optionally re-publishes elsewhere. */
  removeFromYouTube(postId: string, body: AutomationYouTubeRemoval): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/youtube-removal`,
        body
      )
    );
  }

  syncToPanchang(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/sync-panchang`,
        {}
      )
    );
  }

  removeFromPanchang(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.delete<ApiResponse<AutomationPost>>(
        `${this.base}/queue/${encodeURIComponent(postId)}/sync-panchang`
      )
    );
  }

  verifyPost(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/verify`, {})
    );
  }

  reverifyAndFixPost(postId: string): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/reverify-fix`, {})
    );
  }

  publishPost(postId: string, body?: { publishNow?: boolean; scheduledAtUtc?: string | null; scheduleOnYouTube?: boolean }): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/publish`, body ?? { publishNow: true })
    );
  }

  renderTemplateThumbnail(postId: string, body: RenderTemplateThumbnailRequest): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/queue/${encodeURIComponent(postId)}/thumbnail/template`, body)
    );
  }

  getPublishAdvice(sourceType: AutomationSourceType, format: AutomationVideoFormat, channelId?: string | null, timeZone?: string | null): Observable<AutomationPublishAdvice> {
    let params = new HttpParams().set('sourceType', sourceType).set('format', format);
    if (channelId) params = params.set('channelId', channelId);
    if (timeZone) params = params.set('timeZone', timeZone);
    return this.unwrap(
      this.http.get<ApiResponse<AutomationPublishAdvice>>(`${this.base}/publish-advice`, { params })
    );
  }

  getDailyRashifal(date?: string | null, location?: string | null): Observable<DailyRashifalReport> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (location) params = params.set('location', location);
    return this.unwrap(
      this.http.get<ApiResponse<DailyRashifalReport>>(`${this.base}/rashifal`, { params })
    );
  }

  generateRashifalShorts(body: GenerateRashifalShortsRequest): Observable<GenerateRashifalShortsResult> {
    return this.unwrap(
      this.http.post<ApiResponse<GenerateRashifalShortsResult>>(`${this.base}/rashifal/generate`, body, {
        context: silentHttpContext(),
      })
    );
  }

  compileComedy(body: {
    postIds: string[];
    title?: string | null;
    maxSeconds?: number;
    targetChannelId?: string | null;
  }): Observable<CompileComedyResult> {
    return this.unwrap(
      this.http.post<ApiResponse<CompileComedyResult>>(`${this.base}/compile-comedy`, body)
    );
  }

  bootstrapDualComedy(): Observable<DualComedyBootstrapResult> {
    return this.unwrap(
      this.http.post<ApiResponse<DualComedyBootstrapResult>>(`${this.base}/comedy/bootstrap-dual`, {})
    );
  }

  createComedyPost(body: CreateComedyPostRequest): Observable<AutomationPost> {
    return this.unwrap(
      this.http.post<ApiResponse<AutomationPost>>(`${this.base}/comedy/create-post`, body, {
        context: silentHttpContext(),
      })
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

export interface CreateComedyPostRequest {
  title: string;
  scriptOrIdeas?: string | null;
  audienceTrack: 'local' | 'international';
  language: 'hi' | 'en';
  comedyStyle: ComedyToneStyle;
  format: AutomationVideoFormat;
  narrativeMode: AutomationNarrativeMode;
  visualEngine: AutomationVisualEngine;
  targetSeconds: number;
  speakerAName?: string | null;
  speakerBName?: string | null;
  subtitlePreset?: SubtitleMotionPreset | string;
  enableCharacterDialogue?: boolean;
  includeMidMemes?: boolean;
  includeBackgroundMusic?: boolean;
  backgroundTemplateAssetId?: string | null;
  backgroundMotion?: AutomationBackdropMotion;
  locationPrompt?: string | null;
  attachedSongId?: string | null;
  targetChannelId?: string | null;
  attachedAssetIds?: string[];
  renderAction?: 'draft' | 'render3d' | 'renderAi';
}

export interface DualComedyBootstrapResult {
  rules: AutomationRule[];
  createdCount: number;
}

export interface CompileComedyResult {
  post: AutomationPost;
  renderJobId: string;
  durationSeconds: number;
  clipCount: number;
  chapters: string[];
}
