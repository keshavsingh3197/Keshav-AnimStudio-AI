import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SongSeed } from '../../core/services/songs.service';
import { firstValueFrom } from 'rxjs';

import {
  AutomationNarrativeMode,
  AutomationOverview,
  AutomationPost,
  AutomationPostMode,
  AutomationPostStatus,
  AutomationPublishAdvice,
  AutomationRule,
  AutomationService,
  AutomationSourceType,
  AutomationBackdropMotion,
  AutomationBackgroundPrompt,
  AutomationScenePicturePlan,
  AutomationStageSettings,
  AutomationStorageCatalog,
  AutomationVideoCandidate,
  AutomationVideoFormat,
  AutomationVideoStrategy,
  AutomationVisualEngine,
  AutomationWorkspaceConfig,
  AutomationYouTubeRemoval,
  ComedyToneStyle,
  DailyRashiForecast,
  DailyRashifalReport,
  SubtitleMotionPreset,
} from '../../core/services/automation.service';
import { StatusService } from '../../core/services/status.service';
import { ApiService } from '../../core/services/api.service';
import { Song, SongsService } from '../../core/services/songs.service';
import { LoadingStateComponent } from '../../shared/loading-state.component';
import { FileDropDirective } from '../../shared/file-drop.directive';
import {
  formatSceneBatchPrompt,
  planScenePictureUploads,
  ScenePictureMatchReason,
  suggestedSceneFileName,
  summarizeSceneUploadPlan,
} from '../../shared/scene-batch-media';

type HubTab = 'queue' | 'rashifal' | 'rules' | 'settings';
type QueueStatusFilter = 'all' | 'pending' | 'ready' | 'generating' | 'published' | 'failed';

const SOURCE_LABELS: Record<AutomationSourceType, { label: string; icon: string; badge: string; color: string; banner: string }> = {
  HinduPanchang: { label: 'Hindu Panchang', icon: 'ॐ', badge: 'Hindu / Spiritual', color: '#F59E0B', banner: "TODAY'S HINDU PANCHANG" },
  DailyRashifal: { label: 'Daily Rashifal (12 Rashis)', icon: '♈', badge: 'Zodiac & Upay', color: '#8B5CF6', banner: 'AAJ KA RASHIFAL • 12 RASHIS' },
  HinduFestival: { label: 'Hindu Festival / Vrat', icon: '🪔', badge: 'Festival Alert', color: '#EC4899', banner: 'FESTIVAL & VRAT SPECIAL' },
  DailyKatha: { label: 'Daily Vedic Katha', icon: '📿', badge: 'Sacred Story', color: '#A855F7', banner: 'PAURANIK KATHA & DIALOGUE' },
  AajKaItihaas: { label: 'Aaj Ka Itihaas', icon: '🌍', badge: 'World / History', color: '#E11D48', banner: 'AAJ KA ITIHAAS • ON THIS DAY' },
  Pratiyogita: { label: 'Pratiyogita Spotlight', icon: '🏆', badge: 'Contests & GK', color: '#06B6D4', banner: 'PRATIYOGITA • EXAM & QUIZ PULSE' },
  EcosystemSpotlight: { label: 'Ecosystem Promo', icon: '🚀', badge: 'Website Traffic', color: '#10B981', banner: 'CONTENT OF THE DAY • SPOTLIGHT' },
  CustomPrompt: { label: 'Custom AI Prompt', icon: '✨', badge: 'Custom Pipeline', color: '#10B981', banner: 'CONTENT OF THE DAY • SPOTLIGHT' },
  FunnyComedy: { label: 'Comedy Shorts', icon: '😂', badge: 'Comedy / Memes', color: '#F97316', banner: 'KESHAV-ANIM-FF • COMEDY SHORT' },
};

const FORMAT_OPTIONS: { value: AutomationVideoFormat; label: string; shortLabel: string }[] = [
  { value: 'Vertical', label: '9:16 Vertical (Shorts / Reels)', shortLabel: 'Short 9:16' },
  { value: 'Wide', label: '16:9 Wide (Full Video)', shortLabel: 'Full 16:9' },
  { value: 'CommunityPost', label: 'YouTube Community Post + 1:1 Card', shortLabel: 'Community Post' },
];

const SUBTITLE_PRESETS: { value: SubtitleMotionPreset; label: string }[] = [
  { value: 'event-glow', label: 'Event Color Glow' },
  { value: 'karaoke-pulse', label: 'Karaoke Word Pulse' },
  { value: 'classic-clean', label: 'Classic Editorial' },
];

const MODE_LABELS: Record<AutomationPostMode, string> = {
  PreviewOnly: 'Preview List Only (Manual Video/Post)',
  AutoVideoAndPreview: 'Auto-Attach / AI Video -> Wait Approval',
  FullAutopilot: 'Full Autopilot (Prepare -> Video -> YouTube)',
};

const STRATEGY_LABELS: Record<AutomationVideoStrategy, string> = {
  AutoGenerateAnimated3DVideo: 'Built-in 3D Animated Engine (Auto & Free)',
  PreferUnusedDriveClipThenAiRender: 'Unused Drive Clip -> Else AI Story / 3D Auto',
  PreferUnusedDriveClipOnly: 'Unused Drive Clip Only',
  PreferFinishedRenderJob: 'Finished Studio Render Only',
  AutoGenerateStoryVideo: 'Always Generate AI Story Video',
  ManualAttachOnly: 'Manual Video Attach Only',
};

const STATUS_BADGE: Record<AutomationPostStatus, { label: string; tone: string }> = {
  PreparedPreview: { label: 'Preview Ready', tone: 'warn' },
  GeneratingVideo: { label: 'Rendering AI Video…', tone: 'info' },
  VideoReadyForReview: { label: 'Video Attached — Ready', tone: 'ok' },
  Approved: { label: 'Scheduled / Approved', tone: 'info' },
  Publishing: { label: 'Uploading to YouTube…', tone: 'info' },
  Published: { label: 'Published Live', tone: 'ok' },
  Failed: { label: 'Needs Attention', tone: 'err' },
  Skipped: { label: 'Skipped', tone: 'muted' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type WizardEngine = Exclude<AutomationVisualEngine, 'Auto'>;
type WizardStep = 'engine' | 'source' | 'background' | 'audio' | 'template';
type StageSide = 'left' | 'right';
interface ScenePicMeta {
  name: string;
  reasonText: string;
}
interface GenerateWizardState {
  postId: string;
  engine: WizardEngine;
  source: 'ai' | 'template';
  step: WizardStep;
  /** Enhanced 3D stage draft; saved to the post just before the render or template step. */
  stage: AutomationStageSettings;
  /** 'default' keeps the animated 3D stage; 'picture' uses a background template. */
  backdrop: 'default' | 'picture';
}

/**
 * Default spots of the two main characters (mirrors ProceduralCharacterRenderer) and the figure box size per unit of
 * scale, as fractions of the frame, so the placement editor matches the rendered video.
 */
const STAGE_DEFAULTS = {
  vertical: { left: { x: 0.27, y: 0.555 }, right: { x: 0.73, y: 0.555 }, boxW: 0.143, boxH: 0.127 },
  wide: { left: { x: 0.24, y: 0.77 }, right: { x: 0.76, y: 0.77 }, boxW: 0.086, boxH: 0.242 },
} as const;

const DEFAULT_STAGE: AutomationStageSettings = {
  backgroundTemplateAssetId: null,
  locationPrompt: null,
  leftCharacter: null,
  rightCharacter: null,
  // Voice only unless chosen: most posts get their own song or score added later in YouTube or an editor.
  includeBackgroundMusic: false,
  followScriptExactly: true,
  reviewSteps: false,
  attachedSongId: null,
};
const MAX_TEMPLATE_BYTES = 25 * 1024 * 1024;
const TEMPLATE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Story-engine stage summaries (set by the server's poller) that mean the run is waiting for a pasted script. */
const AWAITING_SCRIPT_SUMMARIES = new Set(['Waiting for your pasted script', 'Preparing script template']);
/** Start of the stage summary while a story waits for a review (mirrors the server's ReviewSummaryPrefix). */
const REVIEW_SUMMARY_PREFIX = 'Waiting for your review: ';
const TEMPLATE_POLL_MS = 3_000;
/** Poll faster than the 5s background poll while an Enhanced 3D render request is in flight. */
const RENDER_POLL_MS = 2_000;

/** Enhanced 3D render steps, keyed by the percent each starts at (mirrors backend ProceduralRenderStages). */
const RENDER_STEPS: ReadonlyArray<{ label: string; from: number }> = [
  { label: 'Dialogue', from: 0 },
  { label: 'Voices', from: 12 },
  { label: 'Music & subtitles', from: 42 },
  { label: 'Animating frames', from: 50 },
  { label: 'Encode & save', from: 92 },
];

const WIZARD_ENGINE_OPTIONS: { value: WizardEngine; icon: string; label: string; hint: string; quality: string }[] = [
  {
    value: 'AiRealisticStory', icon: '🎬', label: 'AI Realistic Story',
    hint: 'Film-like AI pictures per scene, a consistent cast, one voice per character, talking faces, cinematic moves and music.',
    quality: 'Best quality',
  },
  {
    value: 'StorageImagesStory', icon: '🖼', label: 'Storage Images Story',
    hint: 'Your own Studio Storage pictures, animated scene by scene with the cast voices and music.',
    quality: 'Your pictures',
  },
  {
    value: 'Procedural3D', icon: '⚡', label: 'Enhanced 3D (fast)',
    hint: 'A stylised multi-act stage rendered locally with FFmpeg. No AI image credits needed.',
    quality: 'Fast & free',
  },
];

const VISUAL_ENGINE_OPTIONS: { value: AutomationVisualEngine; label: string; hint: string }[] = [
  { value: 'Auto', label: 'Auto Engine', hint: 'Follow rule strategy' },
  { value: 'AiRealisticStory', label: 'AI Realistic Story', hint: 'Multi-scene AI visuals + characters + TTS + BGM' },
  { value: 'StorageImagesStory', label: 'Storage Images + Story', hint: 'Animate your Studio Storage pictures with AI voice & cast' },
  { value: 'Procedural3D', label: 'Enhanced 3D Animated', hint: 'Fast local multi-act 3D stage + optional storage backdrops' },
];

const NARRATIVE_MODE_OPTIONS: { value: AutomationNarrativeMode; label: string; shortLabel: string }[] = [
  { value: 'Auto', label: 'Auto (Short 9:16 / Full Story 16:9)', shortLabel: 'Auto Length' },
  { value: 'ShortReel', label: 'Short Reel (<= 60s)', shortLabel: 'Short <= 60s' },
  { value: 'FullStory', label: 'Full Complete Story (Short < 3 min · 16:9 video up to 60 min)', shortLabel: 'Full Story' },
];

/** YouTube's limit for a Short; vertical and community videos stay within it. */
const SHORT_MAX_SECONDS = 180;
/** A full 16:9 video may run the whole story up to 1 hour (matches the server's limit). */
const FULL_VIDEO_MAX_SECONDS = 3600;

@Component({
  selector: 'app-automation-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingStateComponent, FileDropDirective],
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    <div class="auto-page">
      <header class="auto-hero">
        <div class="hero-copy">
          <div class="hero-kicker">Ecosystem Content & Traffic Autopilot</div>
          <h1>Daily Auto-Post Hub</h1>
          <p class="hero-sub">
            Fetches live Hindu Panchang, Festivals, Vedic Katha, Aaj Ka Itihaas &amp; Pratiyogita signals daily,
            builds scripts + AI video prompts + UTM website funnels, pairs Drive clips or AI Story Agent videos,
            and publishes or schedules to your connected YouTube channels.
          </p>
        </div>

        <div class="hero-controls">
          <label class="date-field">
            <span>Target Date</span>
            <input type="date" [ngModel]="selectedDate()" (ngModelChange)="onDateChange($event)" />
          </label>
          <button type="button" class="btn primary" [disabled]="busy()" (click)="prepareToday(false)">
            @if (busyAction() === 'prepare') { <span class="btn-spin" aria-hidden="true"></span> Preparing… } @else { Prepare Daily List }
          </button>
          <button type="button" class="btn primary" [disabled]="busy()" (click)="runPreparePublishPack()"
                  title="Rebalance Bhakti & Keshav channels, prepare posts, generate 3D/2D videos & thumbnails, sync Calendar, and upload Private scheduled at each channel's peak viewer time">
            @if (busyAction() === 'prepare-pack') { <span class="btn-spin" aria-hidden="true"></span> Scheduling Pack… } @else { 🚀 Auto-Prepare &amp; Private Schedule }
          </button>
          <button type="button" class="btn ghost" [disabled]="busy()" (click)="prepareToday(true)" title="Re-compose non-published items from fresh signals">
            Re-Compose Unposted
          </button>
          <button type="button" class="btn ghost" [disabled]="busy()" (click)="loadOverview()">
            Refresh
          </button>
        </div>
      </header>

      @if (errorMessage()) {
        <div class="alert-banner err" role="alert">
          <span>{{ errorMessage() }}</span>
          <button type="button" class="link-btn" (click)="errorMessage.set(null)">Dismiss</button>
        </div>
      }

      @if (overview(); as ov) {
        <!-- Live Fact & Date Verification Banner (collapsed by default unless Mismatch) -->
        @if (ov.signals.verification; as ver) {
          <section class="verify-ribbon" [class.has-mismatch]="ver.overallStatus === 'Mismatch'" [class.has-warn]="ver.overallStatus === 'NeedsReview'" aria-label="Live date and fact verification">
            <div class="verify-ribbon-head">
              <strong>
                {{ ver.overallStatus === 'Mismatch' ? '🚫 Fact &amp; Date Verification Alert' : ver.overallStatus === 'NeedsReview' ? '⚠ Fact Verification Notes' : '✓ Live Date &amp; Fact Verification Passed' }}
              </strong>
              <div class="toolbar-right">
                <span class="pill" [class.ok]="ver.overallStatus === 'Verified'" [class.err]="ver.overallStatus === 'Mismatch'" [class.warn]="ver.overallStatus !== 'Verified' && ver.overallStatus !== 'Mismatch'">
                  {{ ver.summary }}
                </span>
                <button type="button" class="btn tiny ghost" (click)="showVerificationDetails.set(!showVerificationDetails())">
                  {{ (showVerificationDetails() || ver.overallStatus === 'Mismatch') ? 'Hide Checks ▲' : 'Show Checks (' + ver.checks.length + ') ▼' }}
                </button>
              </div>
            </div>
            @if (showVerificationDetails() || ver.overallStatus === 'Mismatch') {
              <div class="verify-checks-grid">
                @for (chk of ver.checks; track chk.category) {
                  <div class="verify-check-pill" [class.err]="chk.status === 'Mismatch'" [class.warn]="chk.status === 'NeedsReview' || chk.status === 'Unverified'">
                    <div class="vcp-top">
                      <span class="vcp-cat">{{ chk.status === 'Verified' ? '✓' : chk.status === 'Mismatch' ? '🚫' : '⚠' }} {{ chk.category }}</span>
                      <div class="vcp-links">
                        @if (chk.sourceUrl) {
                          <a class="verify-ext-link" [href]="chk.sourceUrl" target="_blank" rel="noopener">{{ chk.sourceName || 'Source' }} ↗</a>
                        }
                        @if (chk.verifySearchUrl) {
                          <a class="verify-ext-link" [href]="chk.verifySearchUrl" target="_blank" rel="noopener">Google Check ↗</a>
                        }
                      </div>
                    </div>
                    <small class="vcp-msg">{{ chk.message }}</small>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- Live Signals Ribbon (collapsed by default to compact bar) -->
        <section class="signals-summary-bar" aria-label="Live ecosystem signals">
          <div class="ssb-left">
            <span class="pill subtle">ॐ {{ ov.signals.panchang?.tithi || 'Panchang' }}</span>
            @if (ov.signals.panchang; as panchang) {
              @if (panchang.moonSign) {
                <span class="pill info">🌙 Chandra: {{ panchang.moonSign }}</span>
              }
            }
            <span class="pill subtle">🪔 {{ ov.signals.upcomingFestivals.length }} Festivals</span>
            <span class="pill subtle">🎬 {{ ov.unusedDriveClipsCount }} Drive • {{ ov.connectedChannels.length }} Channels</span>
          </div>
          <button type="button" class="btn tiny ghost" (click)="showSignalsCards.set(!showSignalsCards())">
            {{ showSignalsCards() ? 'Collapse Signals ▲' : 'Expand Live Signals ▼' }}
          </button>
        </section>

        @if (showSignalsCards()) {
          <section class="signals-ribbon" aria-label="Live ecosystem signal details">
            <div class="sig-card">
              <div class="sig-head">ॐ Panchang ({{ ov.signals.location }})</div>
              @if (ov.signals.panchang; as p) {
                <div class="sig-main">
                  {{ p.tithi }}
                  @if (p.tithiEndTime) {
                    <small class="sig-sub"> ({{ p.tithiEndTime }}@if (p.nextTithi) { &rarr; {{ p.nextTithi }} })</small>
                  }
                  • {{ p.nakshatra }}
                </div>
                <div class="sig-meta">
                  Abhijit: {{ p.abhijitMuhurat }} | Rahu: {{ p.rahuKaal }}
                  @if (p.moonSign) { | Moon: {{ p.moonSign }} }
                </div>
              } @else {
                <div class="sig-muted">Panchang signal unavailable for this date</div>
              }
            </div>

            <div class="sig-card">
              <div class="sig-head">🪔 Festivals &amp; Katha</div>
              <div class="sig-main">
                {{ ov.signals.upcomingFestivals.length }} upcoming •
                {{ ov.signals.dailyKatha ? ov.signals.dailyKatha.title : 'No katha signal' }}
              </div>
              <div class="sig-meta">
                @if (ov.signals.upcomingFestivals[0]; as f) {
                  Next: {{ f.nameHindi || f.nameEnglish }} ({{ f.dateKey }})
                } @else {
                  Check Spiritual channel pipelines
                }
              </div>
            </div>

            <div class="sig-card">
              <div class="sig-head">🌍 History &amp; Contests</div>
              <div class="sig-main">
                {{ ov.signals.historicalIncidents.length }} Aaj Ka Itihaas •
                {{ ov.signals.competitions.length }} Pratiyogita
              </div>
              <div class="sig-meta">
                @if (ov.signals.historicalIncidents[0]; as h) {
                  Lead: {{ h.year }} — {{ h.title }}
                } @else {
                  Ready for world/GK channels
                }
              </div>
            </div>

            <div class="sig-card">
              <div class="sig-head">🎬 Media &amp; Channels Ready</div>
              <div class="sig-main">
                {{ ov.unusedDriveClipsCount }} Unused Drive • {{ ov.finishedRendersCount }} Studio Renders
              </div>
              <div class="sig-meta">
                {{ ov.connectedChannels.length }} YouTube connected • {{ ov.websites.length }} tracked sites
              </div>
            </div>
          </section>
        }

        @if (ov.signals.warnings.length > 0) {
          <div class="warn-strip">
            Signal notes: {{ ov.signals.warnings.join(' • ') }}
          </div>
        }

        @if (ov.rules.length === 0) {
          <div class="onboarding-card">
            <div>
              <h2>Set up your Dynamic Ecosystem Pipelines in 1 click</h2>
              <p>
                AnimStudio will read your connected YouTube channels &amp; Central Admin channel niches and auto-create
                routing rules (Hindu Panchang / Festivals / Katha to devotional channels, Aaj Ka Itihaas &amp; Pratiyogita to
                world/learning channels) with tracked website traffic links. You can customize every field afterwards.
              </p>
            </div>
            <button type="button" class="btn primary" [disabled]="busy()" (click)="bootstrapStarterRules()">
              Auto-Setup Ecosystem Pipelines
            </button>
          </div>
        }

        <!-- Sub-navigation Tabs -->
        <div class="hub-tabs" role="tablist">
          <button type="button" role="tab" [class.active]="activeTab() === 'queue'" (click)="activeTab.set('queue')">
            Prepared Post List ({{ postsForSelectedDate().length }})
          </button>
          <button type="button" role="tab" [class.active]="activeTab() === 'rashifal'" (click)="activeTab.set('rashifal'); loadRashifal()">
            ♈ Daily Rashifal &amp; 2D Panchang (12 Rashis)
          </button>
          <button type="button" role="tab" [class.active]="activeTab() === 'rules'" (click)="activeTab.set('rules')">
            Channel Routing Pipelines ({{ ov.rules.length }})
          </button>
          <button type="button" role="tab" [class.active]="activeTab() === 'settings'" (click)="activeTab.set('settings')">
            Global Autopilot &amp; API Settings
          </button>
        </div>

        <!-- TAB 1: DAILY PREPARED LIST & PREVIEW -->
        @if (activeTab() === 'queue') {
          <div class="toolbar-row">
            <div class="filter-pills">
              <button type="button" [class.active]="statusFilter() === 'all'" (click)="statusFilter.set('all')">
                All ({{ postsForSelectedDate().length }})
              </button>
              <button type="button" [class.active]="statusFilter() === 'pending'" (click)="statusFilter.set('pending')">
                Preview Only
              </button>
              <button type="button" [class.active]="statusFilter() === 'ready'" (click)="statusFilter.set('ready')">
                Video Ready
              </button>
              <button type="button" [class.active]="statusFilter() === 'generating'" (click)="statusFilter.set('generating')">
                AI Rendering
              </button>
              <button type="button" [class.active]="statusFilter() === 'published'" (click)="statusFilter.set('published')">
                Published
              </button>
              <button type="button" [class.active]="statusFilter() === 'failed'" (click)="statusFilter.set('failed')">
                Failed
              </button>
            </div>

            <div class="toolbar-right">
              <input type="search" class="queue-search-input"
                     placeholder="Search title, channel, category…"
                     [ngModel]="queueSearchQuery()"
                     (ngModelChange)="setQueueSearchQuery($event)" />
              <select class="queue-page-size" [ngModel]="queuePageSize()" (ngModelChange)="setQueuePageSize(+$event)">
                <option [ngValue]="8">8 / page</option>
                <option [ngValue]="16">16 / page</option>
                <option [ngValue]="32">32 / page</option>
              </select>
              <button type="button" class="btn tiny ghost" (click)="expandAllQueueCards()">Expand Page</button>
              <button type="button" class="btn tiny ghost" (click)="collapseAllQueueCards()">Collapse All</button>
              @if (highlightedSource()) {
                <button type="button" class="btn tiny ghost" (click)="highlightedSource.set(null)">
                  Clear source filter: {{ sourceInfo(highlightedSource()!).label }} ×
                </button>
              }
              <label class="toggle-inline">
                <input type="checkbox" [ngModel]="showAllDates()" (ngModelChange)="showAllDates.set($event); queuePage.set(0)" />
                <span>Show all dates ({{ ov.posts.length }})</span>
              </label>
            </div>
          </div>

          @if (hasRenderedComedyPosts(filteredPosts())) {
            <div class="warn-strip" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:rgba(249,115,22,0.12);border-color:rgba(249,115,22,0.4);">
              <div>
                <strong>😂 Comedy Compilation Stitcher (&lt; 3 min)</strong>
                <span class="muted-note" style="margin-left:8px;">
                  {{ selectedComedyIds().length >= 2 ? selectedComedyIds().length + ' selected' : 'Auto-picks up to 6 rendered comedy shorts' }} (capped at 180s).
                </span>
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <input type="text" placeholder="Optional compilation title..." [ngModel]="compilationTitle()" (ngModelChange)="compilationTitle.set($event)"
                       style="padding:5px 9px;border-radius:6px;border:1px solid var(--border);background:var(--sunk-2);color:var(--text);font-size:12px;min-width:200px;" />
                <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="compileSelectedComedy(filteredPosts())">
                  @if (busyAction() === 'compile-comedy') { <span class="btn-spin" aria-hidden="true"></span> Compiling… }
                  @else { 🎞️ Compile &lt;3 min Best-Of }
                </button>
              </div>
            </div>
          }

          @if (filteredPosts().length === 0) {
            <div class="empty-state">
              <h3>No prepared posts match this filter yet</h3>
              <p>
                Click <strong>Prepare Daily List</strong> above to generate titles, scripts, AI video prompts &amp; tracked website links for {{ selectedDate() }}.
              </p>
            </div>
          } @else {
            <div class="posts-grid">
              @for (post of pagedPosts(); track post.id) {
                <article class="post-card compact" [class.is-published]="post.status === 'Published'"
                         [style.border-top]="'3px solid ' + postEventColor(post)"
                         tabindex="0" role="button" [attr.aria-label]="'Open details: ' + post.title"
                         (click)="openPostDetail(post)" (keydown.enter)="openPostDetail(post)">
                  <div class="template-banner" [style.border-color]="postEventColor(post) + '55'">
                    <span class="event-dot" [style.background]="postEventColor(post)"></span>
                    <span class="banner-text">{{ postHeaderBanner(post) }}</span>
                    <span class="date-tag">{{ post.dateKey }}</span>
                    <button type="button" class="btn tiny ghost" (click)="$event.stopPropagation(); toggleQueueCardExpanded(post.id)">
                      {{ isQueueCardExpanded(post.id) ? '▲' : '▼' }}
                    </button>
                  </div>

                  <div class="badges-wrap">
                    <span class="pill source"
                          [style.background]="postEventColor(post) + '22'"
                          [style.border-color]="postEventColor(post) + '88'"
                          [style.color]="postEventColor(post)">
                      {{ sourceInfo(post.sourceType).icon }} {{ sourceInfo(post.sourceType).label }}
                    </span>
                    <span class="pill" [ngClass]="'tone-' + statusInfo(post.status).tone">{{ statusInfo(post.status).label }}</span>
                    <span class="pill subtle">{{ formatDisplay(post.format) }} • {{ post.language.toUpperCase() }}</span>
                    <span class="pill subtle">{{ privacyDisplay(post) }}</span>
                    @if (post.scheduledAtUtc && post.status !== 'Published') {
                      <span class="pill info" [title]="'UTC: ' + post.scheduledAtUtc">🕒 {{ formatLocalSchedule(post.scheduledAtUtc) }}</span>
                    }
                    @if (post.sourceType === 'FunnyComedy' && post.attachedRenderJobId) {
                      <label class="pill subtle" style="cursor:pointer;" (click)="$event.stopPropagation()">
                        <input type="checkbox" [checked]="isComedySelected(post.id)" (change)="toggleComedySelect(post.id)" style="margin-right:4px;" />
                        Best-Of
                      </label>
                    }
                    @if (post.syncedToEcosystemAtUtc && post.publishedVideoId) {
                      <span class="pill ok" title="Listed on panchang.keshavsingh.in/videos">🕉️ On Panchang</span>
                    }
                  </div>

                  <div class="card-thumb-row">
                    @if (hasPostThumbnail(post)) {
                      <div class="card-thumb-box" [class.portrait]="post.format === 'Vertical'">
                        <img class="thumb-preview-img" [src]="postThumbnailUrl(post)" [alt]="post.title" loading="lazy" />
                      </div>
                    }
                    <div class="card-thumb-meta">
                      <h3 class="post-title clamp-2">{{ post.title }}</h3>
                      <div class="channel-line">
                        @if (post.targetChannelTitle || post.targetChannelHandle) {
                          <span class="chan-badge">▶ {{ post.targetChannelTitle || post.targetChannelHandle }}</span>
                        } @else {
                          <span class="chan-missing">No YouTube channel assigned</span>
                        }
                        @if (!isQueueCardExpanded(post.id)) {
                          <span class="muted-note">• {{ post.attachedHandoffId || post.attachedRenderJobId ? '🎬 Video Ready' : 'Draft Only' }} • {{ hasPostThumbnail(post) ? '🖼 Thumb ✓' : 'No Thumb' }}</span>
                        }
                      </div>
                    </div>
                  </div>

                  @if (isQueueCardExpanded(post.id)) {
                    <div class="compact-video" [class.has-video]="!!(post.attachedHandoffId || post.attachedRenderJobId)">
                      <span class="compact-video-label">{{ post.attachedVideoSourceLabel || 'No video yet' }}</span>
                      @if (post.status === 'GeneratingVideo' || ((post.storyProgressPercent ?? 0) > 0 && (post.storyProgressPercent ?? 0) < 100)) {
                        <div class="story-progress-track">
                          <div class="story-progress-fill" [style.width.%]="post.storyProgressPercent ?? 5"></div>
                        </div>
                      }
                    </div>

                    @if (post.format !== 'CommunityPost' && post.status !== 'Published') {
                      <div class="card-readiness-row">
                        @if (post.verificationStatus === 'Mismatch') {
                          <span class="mini-chip err" [title]="post.verificationSummary || 'Date/fact mismatch'">
                            🚫 Fact/Date Mismatch
                          </span>
                        } @else if (post.verificationStatus === 'NeedsReview' || post.verificationStatus === 'Unverified') {
                          <span class="mini-chip warn" [title]="post.verificationSummary || 'Needs review'">
                            ⚠ Fact Check
                          </span>
                        } @else {
                          <span class="mini-chip ok" [title]="post.verificationSummary || 'Facts & date verified'">
                            ✓ Verified
                          </span>
                        }
                        @if (hasPostThumbnail(post)) {
                          <span class="mini-chip ok" [title]="post.thumbnailSource || 'Thumbnail configured'">
                            🖼 Thumb ✓
                          </span>
                        } @else {
                          <span class="mini-chip warn" title="No YouTube thumbnail set yet — open Details to upload or template generate">
                            ⚠ No thumb
                          </span>
                        }
                        @if (postReadiness(post).missingCount > 0) {
                          <span class="mini-chip warn" [title]="postReadiness(post).summary">
                            ⚠ {{ postReadiness(post).missingCount }} detail{{ postReadiness(post).missingCount > 1 ? 's' : '' }} needed
                          </span>
                        } @else {
                          <span class="mini-chip ok">✓ Ready</span>
                        }
                      </div>
                    }
                  }

                  @if (post.verificationStatus === 'Mismatch') {
                    <div class="err-note verify-alert-card" (click)="$event.stopPropagation()">
                      <div><strong>Date / Fact Mismatch:</strong> {{ post.verificationSummary }}</div>
                      <div class="verify-card-actions">
                        @if (post.status !== 'Published' && post.status !== 'Publishing') {
                          <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="reverifyAndFixPost(post)">
                            {{ busyAction() === 'fix:' + post.id ? 'Fixing…' : '🔄 Fix Verified Data' }}
                          </button>
                        }
                        <a class="verify-ext-link"
                           [href]="post.verificationSourceUrl || postGoogleVerifyUrl(post)"
                           target="_blank" rel="noopener">
                          Verify Source ↗
                        </a>
                      </div>
                    </div>
                  }

                  @if (post.lastError) {
                    <div class="err-note clamp-2" [title]="post.lastError">{{ post.lastError }}</div>
                  }

                  <div class="post-actions" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                    <button type="button" class="btn tiny ghost" (click)="openPostDetail(post)">Details</button>
                    @if (post.status !== 'Published' && post.status !== 'Publishing' && post.format !== 'CommunityPost') {
                      @if (isAwaitingScript(post)) {
                        <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="resumeTemplate(post)">📋 Paste Script</button>
                      } @else if (isAwaitingReview(post)) {
                        <a class="btn tiny primary" [routerLink]="['/story-agent', post.attachedStoryRunId]"
                           [title]="post.storyStageSummary">👂 Review</a>
                      } @else if (canRetryVideo(post)) {
                        <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="retryVideo(post)"
                                title="Carry on from the step that failed. The script, pictures and voices already made are kept.">↻ Retry</button>
                      } @else {
                        <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="openGenerateWizard(post)">🎬 Generate Video</button>
                      }
                    }
                    @if (post.attachedRenderJobId) {
                      <button type="button" class="btn tiny ok" (click)="openVideoPreview(post)">▶ Preview</button>
                    }
                    @if (post.status !== 'Published' && post.status !== 'Publishing' && post.format !== 'CommunityPost') {
                      <button type="button" class="btn tiny primary"
                              [disabled]="busy() || post.verificationStatus === 'Mismatch' || (!post.attachedHandoffId && !post.attachedRenderJobId) || !post.targetChannelId"
                              title="Auto-fill SEO + Thumbnail and upload Private on YouTube scheduled at peak viewer time"
                              (click)="uploadPrivateAtPeak(post)">
                        {{ busyAction() === 'peak:' + post.id ? 'Scheduling…' : '⏰ Private Peak' }}
                      </button>
                      <button type="button" class="btn tiny ok"
                              [disabled]="busy() || post.verificationStatus === 'Mismatch' || (!post.attachedHandoffId && !post.attachedRenderJobId) || !post.targetChannelId"
                              [title]="post.verificationStatus === 'Mismatch' ? 'Date/fact mismatch detected — click Fix Verified Data first' : (!post.targetChannelId ? 'Assign a YouTube channel in Details first' : (!(post.attachedHandoffId || post.attachedRenderJobId) ? 'Generate or attach a video first' : 'Publish to YouTube now'))"
                              (click)="publishNow(post)">
                        Publish
                      </button>
                    }
                    @if (post.publishedVideoId && post.status === 'Published') {
                      <button type="button" class="btn tiny ghost" [disabled]="busy()"
                              title="Verify on live YouTube API whether this video still exists — if deleted on YouTube, re-enables upload options"
                              (click)="verifyPostFacts(post)">
                        {{ busyAction() === 'verify:' + post.id ? 'Checking…' : '🔍 Check YouTube' }}
                      </button>
                    }
                    @if (post.publishedVideoId && post.status === 'Published' && post.format !== 'CommunityPost') {
                      @if (post.syncedToEcosystemAtUtc) {
                        <button type="button" class="btn tiny ghost" [disabled]="busy()"
                                title="Take this video off the Panchang Videos Hub (it stays on YouTube)"
                                (click)="removeFromPanchangHub(post)">
                          {{ busyAction() === 'unsync:' + post.id ? 'Removing…' : 'Unlist Panchang' }}
                        </button>
                      } @else {
                        <button type="button" class="btn tiny primary" [disabled]="busy()"
                                title="Show this YouTube video on panchang.keshavsingh.in/videos"
                                (click)="syncToPanchangHub(post)">
                          {{ busyAction() === 'sync:' + post.id ? 'Publishing…' : '🕉️ To Panchang' }}
                        </button>
                      }
                    }
                    @if (post.publishedVideoId && post.status === 'Published') {
                      <button type="button" class="btn tiny danger-ghost" [disabled]="busy()"
                              title="Delete this video on YouTube, or publish it to a different channel"
                              (click)="openYouTubeRemoval(post)">
                        Remove / Move
                      </button>
                    }
                  </div>
                </article>
              }
            </div>
            @if (totalQueuePages() > 1) {
              <div class="queue-pagination">
                <button type="button" class="btn tiny ghost" [disabled]="clampedQueuePage() === 0" (click)="prevQueuePage()">
                  ← Prev
                </button>
                <span class="muted-note">
                  Page {{ clampedQueuePage() + 1 }} / {{ totalQueuePages() }} ({{ filteredPosts().length }} total posts)
                </span>
                <button type="button" class="btn tiny ghost" [disabled]="clampedQueuePage() + 1 >= totalQueuePages()" (click)="nextQueuePage()">
                  Next →
                </button>
              </div>
            }
          }
        }

        <!-- TAB 1B: DAILY RASHIFAL & FAST 2D PANCHANG GENERATOR (12 RASHIS) -->
        @if (activeTab() === 'rashifal') {
          <section class="rashifal-panel" aria-label="Daily Rashifal all 12 zodiac signs">
            <div class="rashifal-banner">
              <div>
                <h2>♈ Aaj Ka Daily Rashifal &amp; 2D Panchang (Verified Gochar)</h2>
                @if (rashifalReport(); as rep) {
                  <p class="muted-note">
                    {{ rep.dateKey }} • {{ rep.location }} •
                    <strong>Tithi:</strong> {{ rep.tithi }} •
                    <strong>Nakshatra:</strong> {{ rep.nakshatra }} •
                    <strong>Chandra Rashi:</strong> {{ rep.moonSign || 'Verified' }} •
                    <strong>Abhijit:</strong> {{ rep.abhijitMuhurat }}
                  </p>
                } @else {
                  <p class="muted-note">Verified MoonSign, Nakshatra, Meaning, Today's Forecast, and Aacharan / Upay for all 12 Rashis.</p>
                }
              </div>
              <div class="toolbar-right">
                <label class="toggle-inline">
                  <input type="checkbox" [ngModel]="rashifalRenderVideos()" (ngModelChange)="rashifalRenderVideos.set($event)" />
                  <span>Fast 2D Motion Shorts (no slow 3D wait)</span>
                </label>
                <label class="toggle-inline">
                  <input type="checkbox" [ngModel]="rashifalShowWatermark()" (ngModelChange)="rashifalShowWatermark.set($event)" />
                  <span>Show Watermark</span>
                </label>
                <button type="button" class="btn ghost" [disabled]="loadingRashifal() || busy()" (click)="loadRashifal()">
                  {{ loadingRashifal() ? 'Refreshing…' : '↻ Refresh Verified Gochar' }}
                </button>
                <button type="button" class="btn primary" [disabled]="busy() || loadingRashifal()" (click)="generateRashifalShorts()">
                  {{ busyAction() === 'rashifal-all' ? 'Generating 12 Shorts…' : '⚡ Generate All 12 Rashi 2D Shorts' }}
                </button>
              </div>
            </div>

            @if (loadingRashifal()) {
              <app-loading-state mode="cards" [count]="4" title="Computing verified Jyotish Gochar for all 12 Rashis…" />
            } @else if (rashifalReport(); as rep) {
              <div class="rashifal-grid">
                @for (r of rep.rashis; track r.key) {
                  <article class="rashi-card" [class.shubh]="r.isShubhChandrabalam">
                    <div class="rashi-card-head">
                      <div>
                        <strong>{{ r.symbol }} {{ r.hindiName }} ({{ r.englishName }})</strong>
                        <small>{{ r.rulerHindi }} • {{ r.elementHindi }} • Gochar Bhava {{ r.gocharHouseFromMoon }}</small>
                      </div>
                      <span class="pill" [ngClass]="r.isShubhChandrabalam ? 'tone-ok' : 'tone-info'">
                        {{ r.statusBadge }} ({{ r.favorabilityScore }}%)
                      </span>
                    </div>
                    <div class="rashi-meaning"><strong>अर्थ / स्वभाव:</strong> {{ r.meaningSummary }}</div>
                    <div class="rashi-body">
                      <p><strong>आज क्या हो रहा है (Forecast):</strong> {{ r.todayPredictionHindi }}</p>
                      <p class="rashi-en">{{ r.todayPredictionEnglish }}</p>
                      <p><strong>🙏 आज का आचरण एवं उपाय (Aacharan):</strong> {{ r.aacharanUpayHindi }}</p>
                    </div>
                    <div class="rashi-foot">
                      <div class="badges-wrap">
                        <span class="pill subtle">🎨 {{ r.luckyColor }}</span>
                        <span class="pill subtle">🔢 शुभ अंक {{ r.luckyNumber }}</span>
                        <span class="pill subtle" [title]="r.mantra">🕉️ {{ r.mantra }}</span>
                      </div>
                      <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="generateRashifalShorts([r.key])">
                        {{ busyAction() === 'rashifal:' + r.key ? 'Rendering…' : '⚡ Create ' + r.englishName + ' Short' }}
                      </button>
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        }

        <!-- TAB 2: CHANNEL ROUTING PIPELINES -->
        @if (activeTab() === 'rules') {
          <div class="toolbar-row">
            <div class="toolbar-left">
              <button type="button" class="btn primary" (click)="openNewRuleModal()">
                + New Routing Pipeline
              </button>
              <button type="button" class="btn ghost" [disabled]="busy()" (click)="bootstrapStarterRules()">
                Auto-Discover Channels &amp; Starter Rules
              </button>
              <button type="button" class="btn ghost" [disabled]="busy()" (click)="rebalanceStarterChannels()"
                      title="Route Panchang / Festival / Katha to Devotional channel and Aaj Ka Itihaas / Promo to Keshav World/History channel">
                {{ busyAction() === 'rebalance' ? 'Routing…' : '🔀 Fix Bhakti & History Channels' }}
              </button>
            </div>
            <div class="muted-note">
              Rules run dynamically using DB config. Nothing is hardcoded to any static channel.
            </div>
          </div>

          <div class="rules-list">
            @for (rule of ov.rules; track rule.id) {
              <div class="rule-card" [class.disabled]="!rule.enabled">
                <div class="rule-head">
                  <div>
                    <div class="badges-wrap">
                      <span class="pill source">{{ sourceInfo(rule.sourceType).icon }} {{ sourceInfo(rule.sourceType).label }}</span>
                      <span class="pill info">{{ rule.mode }}</span>
                      <span class="pill subtle">{{ rule.preferredPublishTime }} IST • {{ rule.language.toUpperCase() }} • {{ rule.videoFormat }}</span>
                    </div>
                    <h3>{{ rule.name }}</h3>
                    @if (rule.description) {
                      <p class="rule-desc">{{ rule.description }}</p>
                    }
                  </div>
                  <div class="rule-toggles">
                    <label class="switch">
                      <input type="checkbox" [checked]="rule.enabled" (change)="toggleRuleEnabled(rule)" />
                      <span>{{ rule.enabled ? 'Enabled' : 'Paused' }}</span>
                    </label>
                  </div>
                </div>

                <div class="rule-meta-grid">
                  <div><span class="lbl">Target Channel:</span> {{ rule.targetChannelTitle || rule.targetChannelHandle || 'Unassigned (select channel)' }}</div>
                  <div><span class="lbl">Drive Topic:</span> {{ rule.topicName || 'Any Topic' }}</div>
                  <div><span class="lbl">Video Strategy:</span> {{ strategyLabel(rule.videoStrategy) }}</div>
                  <div><span class="lbl">Visual Engine &amp; Length:</span> {{ visualEngineLabel(rule.visualEngine) }} • {{ narrativeModeLabel(rule.narrativeMode) }} ({{ rule.targetSeconds }}s)</div>
                  @if (rule.sourceType === 'FunnyComedy') {
                    <div><span class="lbl">Comedy Auto-Config:</span> {{ comedyToneLabel(rule.comedyStyle) }} • {{ rule.autoInsertMemes !== false ? 'Mid Memes Auto On' : 'Memes Off' }}</div>
                  }
                  <div><span class="lbl">Storage Images:</span> {{ rule.attachedAssetIds?.length ?? 0 }} selected</div>
                  <div><span class="lbl">Websites Linked:</span> {{ rule.funnelWebsiteKeys.length ? rule.funnelWebsiteKeys.join(', ') : 'Auto-matched' }}</div>
                </div>

                <div class="rule-actions">
                  <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="runSingleRule(rule)">
                    Prepare This Pipeline Today
                  </button>
                  <button type="button" class="btn tiny ghost" (click)="openEditRuleModal(rule)">Edit Pipeline</button>
                  <button type="button" class="btn tiny danger-ghost" [disabled]="busy()" (click)="deleteRule(rule)">Delete</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- TAB 3: GLOBAL AUTOPILOT & API SETTINGS -->
        @if (activeTab() === 'settings' && settingsForm()) {
          <form class="settings-panel" (ngSubmit)="saveGlobalSettings()">
            <h2>Global Autopilot &amp; Ecosystem Endpoints</h2>
            <p class="muted-note">
              Control background automated daily preparation, AI script refinement, default Panchang city, and overrideable ecosystem microservice URLs.
            </p>

            <div class="settings-grid">
              <label class="check-tile">
                <input type="checkbox" [(ngModel)]="settingsForm()!.globalAutopilotEnabled" name="globalAutopilotEnabled" />
                <div>
                  <strong>Enable Background Autopilot Worker</strong>
                  <small>Evaluates Full Autopilot schedules every 3 minutes and pushes due posts.</small>
                </div>
              </label>

              <label class="check-tile">
                <input type="checkbox" [(ngModel)]="settingsForm()!.autopilotReleaseAtPeakTime" name="autopilotReleaseAtPeakTime" />
                <div>
                  <strong>Upload Private, Go Public at Peak Time</strong>
                  <small>Autopilot fills SEO, thumbnail &amp; policy checks, uploads private at once, and YouTube releases it at the next audience peak (same day for Panchang / Rashifal / festivals).</small>
                </div>
              </label>

              <label class="check-tile">
                <input type="checkbox" [(ngModel)]="settingsForm()!.autoPrepareDaily" name="autoPrepareDaily" />
                <div>
                  <strong>Auto-Prepare Daily Content List</strong>
                  <small>Pre-generates daily preview scripts, AI prompts &amp; website funnel links automatically.</small>
                </div>
              </label>

              <label class="check-tile">
                <input type="checkbox" [(ngModel)]="settingsForm()!.useAiScriptRefinement" name="useAiScriptRefinement" />
                <div>
                  <strong>Use AI Script &amp; Prompt Refinement</strong>
                  <small>Polishes hooks and delivery via Studio AI while keeping exact Panchang times and URLs intact.</small>
                </div>
              </label>
            </div>

            <div class="form-2col">
              <label class="field">
                <span>Default Panchang City / Location</span>
                <input type="text" [(ngModel)]="settingsForm()!.defaultLocation" name="defaultLocation" placeholder="New Delhi, India" />
              </label>
              <label class="field">
                <span>Default Schedule TimeZone ID</span>
                <input type="text" [(ngModel)]="settingsForm()!.defaultTimeZone" name="defaultTimeZone" placeholder="Asia/Kolkata" />
              </label>
              <label class="field">
                <span>Hindu Panchang API Base URL (optional override)</span>
                <input type="url" [(ngModel)]="settingsForm()!.panchangApiBaseUrl" name="panchangApiBaseUrl" placeholder="Auto-discovered or https://..." />
              </label>
              <label class="field">
                <span>SocialPulse API Base URL (optional override)</span>
                <input type="url" [(ngModel)]="settingsForm()!.socialApiBaseUrl" name="socialApiBaseUrl" placeholder="Auto-discovered or https://..." />
              </label>
              <label class="field">
                <span>Pratiyogita API Base URL (optional override)</span>
                <input type="url" [(ngModel)]="settingsForm()!.pratiyogitaApiBaseUrl" name="pratiyogitaApiBaseUrl" placeholder="Auto-discovered or https://..." />
              </label>
            </div>

            <div class="verify-detail-box">
              <strong>🕉️ 2D Panchang &amp; Daily Rashifal Defaults (No Watermark • Fast 2D • Default Backgrounds)</strong>
              <div class="settings-grid" style="margin-top: 8px;">
                <label class="check-tile">
                  <input type="checkbox" [(ngModel)]="settingsForm()!.panchangShowWatermark" name="panchangShowWatermark" />
                  <div>
                    <strong>Show Bottom Watermark on Panchang &amp; Rashifal</strong>
                    <small>Unchecked by default for clean devotional 2D templates without lower corner watermark.</small>
                  </div>
                </label>
                <label class="check-tile">
                  <input type="checkbox" [(ngModel)]="settingsForm()!.panchangUseFast2DAnimation" name="panchangUseFast2DAnimation" />
                  <div>
                    <strong>Ultra-Fast 2D Motion Animation (CpuFast)</strong>
                    <small>Skips heavy 3D frame queues so daily Panchang &amp; 12-Rashi Shorts render in seconds.</small>
                  </div>
                </label>
              </div>
              <div class="form-2col" style="margin-top: 10px;">
                <label class="field">
                  <span>Fixed Thumbnail Title Template</span>
                  <input type="text" [(ngModel)]="settingsForm()!.panchangThumbnailTitleTemplate" name="panchangThumbnailTitleTemplate" placeholder="आज का पंचांग | Aaj Ka Panchang" />
                </label>
                <label class="field">
                  <span>Fixed Thumbnail Subtitle Template</span>
                  <input type="text" [(ngModel)]="settingsForm()!.panchangThumbnailSubtitleTemplate" name="panchangThumbnailSubtitleTemplate" placeholder="तिथि • नक्षत्र • राहुकाल • शुभ मुहूर्त" />
                </label>
                <div class="field">
                  <span>Default Panchang / Rashifal Background Image</span>
                  <div class="sched-input-row">
                    <span class="pill subtle">{{ settingsForm()!.panchangDefaultBackgroundAssetId ? 'Asset: ' + settingsForm()!.panchangDefaultBackgroundAssetId!.slice(0, 8) + '…' : 'None (Auto gradient)' }}</span>
                    <button type="button" class="btn tiny ghost" (click)="openStoragePicker({ kind: 'settings-bg' })">🖼 Choose Background</button>
                    @if (settingsForm()!.panchangDefaultBackgroundAssetId) {
                      <button type="button" class="btn tiny danger-ghost" (click)="settingsForm()!.panchangDefaultBackgroundAssetId = null">Clear</button>
                    }
                  </div>
                </div>
                <div class="field">
                  <span>Default Panchang Fixed Thumbnail Asset</span>
                  <div class="sched-input-row">
                    <span class="pill subtle">{{ settingsForm()!.panchangDefaultThumbnailAssetId ? 'Asset: ' + settingsForm()!.panchangDefaultThumbnailAssetId!.slice(0, 8) + '…' : 'None (Auto Fixed Template)' }}</span>
                    <button type="button" class="btn tiny ghost" (click)="openStoragePicker({ kind: 'settings-thumb' })">🖼 Choose Default Thumb</button>
                    @if (settingsForm()!.panchangDefaultThumbnailAssetId) {
                      <button type="button" class="btn tiny danger-ghost" (click)="settingsForm()!.panchangDefaultThumbnailAssetId = null">Clear</button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="form-footer">
              <button type="submit" class="btn primary" [disabled]="busy()">Save Global Settings</button>
            </div>
          </form>
        }
      } @else if (loading()) {
        <app-loading-state mode="cards" [count]="4" title="Loading live Panchang, History, Funnel &amp; Pipeline overview…" subtitle="Connecting ecosystem content &amp; channel signals…" />
      }

      <!-- POST DETAIL MODAL (one post at a time) -->
      @if (detailPost(); as post) {
        <div class="modal-backdrop" (click)="closePostDetail()">
          <div class="modal-card large" role="dialog" aria-modal="true" aria-labelledby="post-detail-title" (click)="$event.stopPropagation()">
            <div class="modal-head" [style.border-top]="'3px solid ' + postEventColor(post)">
              <h2 id="post-detail-title" class="clamp-1">{{ postHeaderBanner(post) }}</h2>
              <button type="button" class="link-btn" (click)="closePostDetail()">Close ×</button>
            </div>
            <div class="modal-body detail-body">
                  <div class="post-top">
                    <div class="badges-wrap">
                      <span class="pill source"
                            [style.background]="postEventColor(post) + '22'"
                            [style.border-color]="postEventColor(post) + '88'"
                            [style.color]="postEventColor(post)">
                        {{ sourceInfo(post.sourceType).icon }} {{ sourceInfo(post.sourceType).label }}
                      </span>
                      <span class="pill" [ngClass]="'tone-' + statusInfo(post.status).tone">
                        {{ statusInfo(post.status).label }}
                      </span>
                      <span class="pill subtle">{{ formatDisplay(post.format) }} • {{ post.language.toUpperCase() }}</span>
                    </div>
                    <span class="date-tag">{{ post.dateKey }}</span>
                  </div>

                  <h3 class="post-title">{{ post.title }}</h3>
                  <div class="channel-line">
                    <span>Pipeline: <strong>{{ post.ruleName }}</strong></span>
                    <span>•</span>
                    @if (post.targetChannelTitle || post.targetChannelHandle) {
                      <span class="chan-badge">▶ {{ post.targetChannelTitle || post.targetChannelHandle }}</span>
                    } @else {
                      <span class="chan-missing">No YouTube channel assigned yet</span>
                    }
                  </div>
                  @if (post.format !== 'CommunityPost') {
                    <div class="meta-pills-row">
                      <span class="pill subtle">📂 {{ categoryName(post.categoryId) }}</span>
                      <span class="pill subtle">{{ privacyDisplay(post) }}</span>
                      <span class="pill subtle">👶 Kids: {{ post.madeForKids ? 'Yes' : 'No' }}</span>
                      <span class="pill subtle">🏷 {{ post.tags.length }} tags</span>
                      @if (post.scheduledAtUtc) {
                        <span class="pill tone-info" [title]="'UTC: ' + post.scheduledAtUtc">
                          🕒 Scheduled: {{ formatLocalSchedule(post.scheduledAtUtc) }}
                        </span>
                      } @else {
                        <span class="pill tone-warn">🕒 Not scheduled yet</span>
                      }
                    </div>
                  }

                  @if (post.status !== 'Published' && post.status !== 'Publishing') {
                    <div class="format-strip">
                      <span class="lbl">Format:</span>
                      <div class="filter-pills">
                        @for (fmt of formatOptions; track fmt.value) {
                          <button type="button" [class.active]="post.format === fmt.value"
                                  [disabled]="busy()" (click)="changePostFormat(post, fmt.value)">
                            {{ fmt.shortLabel }}
                          </button>
                        }
                      </div>
                    </div>
                    <div class="format-strip">
                      <span class="lbl">Length:</span>
                      <div class="filter-pills">
                        @for (nm of narrativeModeOptions; track nm.value) {
                          <button type="button" [class.active]="(post.narrativeMode || 'Auto') === nm.value"
                                  [disabled]="busy()" (click)="changePostNarrativeMode(post, nm.value)">
                            {{ nm.shortLabel }}
                          </button>
                        }
                      </div>
                    </div>
                  }

                  @if (post.format === 'CommunityPost') {
                    <div class="community-box" [style.border-color]="postEventColor(post)">
                      <div class="snip-label">
                        <span>YouTube Community Post &amp; 1:1 Promo Card</span>
                        <button type="button" class="copy-btn" (click)="copyCommunityPost(post)">Copy Post + Poll</button>
                      </div>
                      <p class="community-copy">{{ post.communityPostText || post.script }}</p>
                      @if ((post.communityPollOptions?.length ?? 0) > 0) {
                        <div class="poll-list">
                          @for (opt of post.communityPollOptions ?? []; track $index) {
                            <span class="poll-chip">{{ $index + 1 }}. {{ opt }}</span>
                          }
                        </div>
                      }
                      @if (post.communityCardStorageKey) {
                        <div class="promo-preview-wrap">
                          <img class="promo-card-thumb" [src]="communityCardUrl(post.id)" [alt]="post.title" loading="lazy" />
                        </div>
                      }
                      <div class="video-actions">
                        <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="generateCommunityCard(post)">
                          {{ busyAction() === 'card:' + post.id ? 'Generating Card…' : (post.communityCardStorageKey ? 'Regenerate 1:1 Card' : 'Generate 1:1 Promo Card') }}
                        </button>
                        @if (post.communityCardStorageKey) {
                          <a class="btn tiny ok" [href]="communityCardUrl(post.id)" [download]="'promo-' + post.dateKey + '-' + post.id + '.png'">
                            Download 1:1 PNG
                          </a>
                        }
                        <a class="btn tiny ghost" [href]="youtubeCommunityUrl(post)" target="_blank" rel="noopener">
                          Open YT Studio Posts ↗
                        </a>
                        @if (post.status !== 'Published') {
                          <button type="button" class="btn tiny ok" [disabled]="busy()" (click)="markCommunityPosted(post)">
                            {{ busyAction() === 'mark-community:' + post.id ? 'Saving…' : 'Mark Community Posted' }}
                          </button>
                        }
                      </div>
                      <small class="muted-note">
                        YouTube Data API v3 does not expose automated Community Tab posting — download your 1:1 card + copy text, post in YouTube Studio, then mark posted.
                      </small>
                    </div>
                  } @else {
                    <!-- Video attachment box -->
                    <div class="video-box" [class.has-video]="!!(post.attachedHandoffId || post.attachedRenderJobId)">
                      <div class="video-box-main">
                        @if (post.attachedVideoSourceLabel) {
                          <div class="video-info">
                            <strong>Video:</strong> {{ post.attachedVideoSourceLabel }}
                          </div>
                        } @else {
                          <div class="video-info muted">
                            No video attached yet. Click Generate Video to make one, or pick a Drive clip or Studio render.
                          </div>
                        }

                        @if (post.status === 'GeneratingVideo' || ((post.storyProgressPercent ?? 0) > 0 && (post.storyProgressPercent ?? 0) < 100)) {
                          <div class="story-progress-wrap">
                            <div class="story-progress-head">
                              <span>{{ post.storyStageSummary || 'Processing Story Stages…' }}</span>
                              <strong>{{ post.storyProgressPercent ?? 5 }}%</strong>
                            </div>
                            <div class="story-progress-track">
                              <div class="story-progress-fill" [style.width.%]="post.storyProgressPercent ?? 5"></div>
                            </div>
                          </div>
                        }

                        @if ((post.provisionedCharacterNames?.length ?? 0) > 0) {
                          <div class="cast-chips-row">
                            <span class="cast-lbl">Cast:</span>
                            @for (cname of post.provisionedCharacterNames ?? []; track cname) {
                              <span class="pill subtle">{{ cname }}</span>
                            }
                          </div>
                        }
                      </div>

                      <div class="video-actions">
                        @if (post.status !== 'Published' && post.status !== 'Publishing') {
                          @if (isAwaitingScript(post)) {
                            <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="resumeTemplate(post)">
                              📋 Paste Script
                            </button>
                          } @else if (isAwaitingReview(post)) {
                            <a class="btn tiny primary" [routerLink]="['/story-agent', post.attachedStoryRunId]">
                              👂 Review {{ reviewTarget(post) }} in Story Studio ↗
                            </a>
                          } @else {
                            @if (canRetryVideo(post)) {
                              <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="retryVideo(post)"
                                      title="Carry on from the step that failed. The script, pictures and voices already made are kept.">
                                ↻ Retry from failed step
                              </button>
                            }
                            <button type="button" class="btn tiny" [class.primary]="!canRetryVideo(post)" [class.ghost]="canRetryVideo(post)"
                                    [disabled]="busy()" (click)="openGenerateWizard(post)">
                              🎬 {{ canRetryVideo(post) ? 'Start Over…' : 'Generate Video…' }}
                            </button>
                          }
                          <button type="button" class="btn tiny ghost" [disabled]="busy()" (click)="openStoragePicker({ kind: 'post', post })">
                            🖼 Storage Images ({{ post.attachedAssetIds?.length ?? 0 }})
                          </button>
                          <button type="button" class="btn tiny ghost" [disabled]="busy()" (click)="openVideoPicker(post)">
                            Pick Drive / Render
                          </button>
                        }
                        @if (post.attachedStoryRunId) {
                          <a class="btn tiny ghost" [routerLink]="['/story-agent', post.attachedStoryRunId]">
                            Open in Story Studio ↗
                          </a>
                        }
                        <button type="button" class="btn tiny ghost" (click)="openSongFor(post)"
                                title="Write lyrics from this post's story and compose a song with Google Lyria">
                          🎵 Make a song
                        </button>
                        @if (post.attachedRenderJobId) {
                          <button type="button" class="btn tiny ok" (click)="openVideoPreview(post)">
                            ▶ Preview MP4
                          </button>
                        }
                      </div>
                    </div>

                    @if (post.status !== 'Published' && post.status !== 'Publishing') {
                      <div class="dialogue-bar">
                        <label class="toggle-inline">
                          <input type="checkbox" [ngModel]="post.enableCharacterDialogue ?? true"
                                 (ngModelChange)="post.enableCharacterDialogue = $event; savePostAnimationPrefs(post)" />
                          <span>Multi-Character Dialogue</span>
                        </label>
                        <select class="compact-select" [ngModel]="post.subtitlePreset || 'event-glow'"
                                (ngModelChange)="post.subtitlePreset = $event; savePostAnimationPrefs(post)">
                          @for (sp of subtitlePresets; track sp.value) {
                            <option [value]="sp.value">{{ sp.label }}</option>
                          }
                        </select>
                      </div>
                      @if (post.enableCharacterDialogue ?? true) {
                        <div class="speaker-row">
                          <input type="text" [(ngModel)]="post.speakerAName" placeholder="Speaker A (e.g. भक्त ध्रुव)"
                                 (blur)="savePostAnimationPrefs(post)" />
                          <input type="text" [(ngModel)]="post.speakerBName" placeholder="Speaker B (e.g. देवर्षि नारद मुनि)"
                                 (blur)="savePostAnimationPrefs(post)" />
                        </div>
                      }
                      <select class="preset-select"
                              [ngModel]="postDurationSeconds(post.id)"
                              (ngModelChange)="setPostDurationSeconds(post.id, $event)"
                              aria-label="Target video duration">
                        @for (opt of durationOptionsFor(post.format); track opt.value) {
                          <option [ngValue]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                    }
                  }

                  <!-- Script & Prompt preview -->
                  <div class="preview-snippet">
                    <div class="snip-block">
                      <div class="snip-label">
                        <span>AI Video Prompt (Veo / Flow / Studio)</span>
                        <button type="button" class="copy-btn" (click)="copyText(post.aiVideoPrompt, 'AI prompt copied!')">Copy</button>
                      </div>
                      <p>{{ post.aiVideoPrompt }}</p>
                    </div>
                    <div class="snip-block">
                      <div class="snip-label">
                        <span>Narration Script</span>
                        <button type="button" class="copy-btn" (click)="copyText(post.script, 'Script copied!')">Copy</button>
                      </div>
                      <p>{{ post.script }}</p>
                    </div>
                  </div>

                  <!-- Tracked Website Funnel Links -->
                  @if (post.trackedFunnelUrls.length > 0) {
                    <div class="funnel-row">
                      <span class="funnel-lbl">Traffic Funnels:</span>
                      @for (link of post.trackedFunnelUrls; track link.key) {
                        <a class="funnel-chip" [href]="link.trackedUrl" target="_blank" rel="noopener">
                          ↗ {{ link.label }}
                        </a>
                      }
                    </div>
                  }

                  @if (post.lastError) {
                    <div class="err-note">{{ post.lastError }}</div>
                  }

                  @if (post.format !== 'CommunityPost') {
                    <!-- Pre-Schedule Completeness Checklist + Thumbnail Studio -->
                    <div class="readiness-panel">
                      <div class="readiness-head">
                        <div class="readiness-title-wrap">
                          <strong>Pre-Upload Details &amp; Thumbnail Check</strong>
                          <span class="pill" [ngClass]="postReadiness(post).missingCount === 0 ? 'tone-ok' : 'tone-warn'">
                            {{ postReadiness(post).readyCount }} / {{ postReadiness(post).totalCount }} Complete
                          </span>
                        </div>
                        @if (post.status !== 'Published' && post.status !== 'Publishing') {
                          <div class="readiness-head-actions">
                            <button type="button" class="btn tiny primary" [disabled]="busy()"
                                    title="Automatically populate missing tags, description, category, schedule time and default video frame thumbnail"
                                    (click)="autoFillPostDetails(post)">
                              {{ busyAction() === 'autofill:' + post.id ? 'Filling…' : '✨ Auto-Fill Missing' }}
                            </button>
                            <button type="button" class="btn tiny ghost" (click)="openPostEditor(post)">
                              ✎ Edit Metadata &amp; Schedule
                            </button>
                          </div>
                        }
                      </div>

                      <div class="readiness-chips">
                        @for (chk of postReadiness(post).items; track chk.label) {
                          <span class="check-pill" [class.ok]="chk.ok" [class.warn]="!chk.ok" [title]="chk.hint || chk.label">
                            {{ chk.ok ? '✓' : '⚠' }} {{ chk.label }}
                          </span>
                        }
                      </div>

                      <div class="verify-detail-box"
                           [class.is-mismatch]="post.verificationStatus === 'Mismatch'"
                           [class.is-warn]="post.verificationStatus === 'NeedsReview' || post.verificationStatus === 'Unverified'">
                        <div class="verify-detail-head">
                          <div class="verify-detail-title">
                            <strong>Fact &amp; Date Verification</strong>
                            <span class="pill"
                                  [ngClass]="post.verificationStatus === 'Mismatch' ? 'tone-err' : (post.verificationStatus === 'NeedsReview' || post.verificationStatus === 'Unverified' ? 'tone-warn' : 'tone-ok')">
                              {{ post.verificationStatus === 'Mismatch' ? '🚫 Date/Fact Mismatch' : (post.verificationStatus === 'NeedsReview' || post.verificationStatus === 'Unverified' ? '⚠ Review Recommended' : '✓ Verified Accurate') }}
                            </span>
                          </div>
                          @if (post.status !== 'Publishing') {
                            <div class="readiness-head-actions">
                              <button type="button" class="btn tiny ghost" [disabled]="busy()" (click)="verifyPostFacts(post)">
                                {{ busyAction() === 'verify:' + post.id ? 'Checking…' : (post.status === 'Published' ? '🔍 Verify Live on YouTube' : '↻ Verify Now') }}
                              </button>
                              @if (post.status !== 'Published') {
                                <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="reverifyAndFixPost(post)"
                                        title="Re-compose script, title and description strictly from live verified facts for this date">
                                  {{ busyAction() === 'fix:' + post.id ? 'Fixing…' : '🔄 Fix with Verified Data' }}
                                </button>
                              }
                            </div>
                          }
                        </div>
                        <p class="verify-detail-msg">{{ post.verificationSummary || 'Click Verify Now to cross-check live sources.' }}</p>
                        @if (post.verificationIssues?.length) {
                          <ul class="verify-issues-list">
                            @for (issue of post.verificationIssues; track issue) {
                              <li>{{ issue }}</li>
                            }
                          </ul>
                        }
                        <div class="verify-links-bar">
                          @if (post.verificationSourceUrl) {
                            <a class="verify-ext-link" [href]="post.verificationSourceUrl" target="_blank" rel="noopener">
                              📚 Source: {{ post.verificationSourceName || 'Verified Reference' }} ↗
                            </a>
                          }
                          <a class="verify-ext-link" [href]="postGoogleVerifyUrl(post)" target="_blank" rel="noopener">
                            🔍 Google Double-Check ↗
                          </a>
                        </div>
                      </div>

                      <div class="thumb-studio-box">
                        <div class="thumb-preview-slot" [class.portrait]="post.format === 'Vertical'">
                          @if (hasPostThumbnail(post)) {
                            <img class="thumb-preview-img" [src]="postThumbnailUrl(post)" [alt]="post.title" />
                          } @else {
                            <div class="thumb-empty-slot">
                              <span>🖼</span>
                              <small>No thumbnail yet</small>
                            </div>
                          }
                        </div>

                        <div class="thumb-controls-col">
                          <div class="thumb-status-line">
                            <strong>YouTube Thumbnail:</strong>
                            @if (hasPostThumbnail(post)) {
                              <span class="pill tone-ok">{{ post.thumbnailSource || 'Custom Thumbnail Ready' }}</span>
                            } @else {
                              <span class="pill tone-warn">Missing — upload PNG/JPG, pick frame or AI-generate</span>
                            }
                          </div>

                          @if (post.status !== 'Published' && post.status !== 'Publishing') {
                            <div class="thumb-actions-row">
                              <label class="btn tiny primary" [class.disabled]="busy() || thumbnailBusyId() === post.id">
                                📤 Upload Image
                                <input type="file" accept="image/png,image/jpeg" hidden
                                       [disabled]="busy() || thumbnailBusyId() === post.id"
                                       (change)="onPostThumbnailFile(post, $event)" />
                              </label>
                              <button type="button" class="btn tiny" [disabled]="busy() || thumbnailBusyId() === post.id"
                                      (click)="generateAiPostThumbnail(post)">
                                {{ thumbnailBusyId() === 'ai:' + post.id ? 'Generating…' : '✨ AI Generate' }}
                              </button>
                              <button type="button" class="btn tiny ghost" [disabled]="busy() || thumbnailBusyId() === post.id"
                                      (click)="openStoragePicker({ kind: 'thumbnail', post })">
                                🖼 Storage Image
                              </button>
                              @if (post.attachedRenderJobId || post.attachedHandoffId) {
                                <div class="frame-pick-inline">
                                  <input type="number" min="0" step="0.5" [ngModel]="post.thumbnailFrameAtSeconds ?? thumbFrameSeconds()"
                                         (ngModelChange)="thumbFrameSeconds.set($event)" aria-label="Thumbnail frame seconds" />
                                  <button type="button" class="btn tiny ghost" [disabled]="busy() || thumbnailBusyId() === post.id"
                                          (click)="setFrameThumbnail(post)">
                                    🎞 Use Frame (s)
                                  </button>
                                </div>
                              }
                              @if (hasPostThumbnail(post)) {
                                <button type="button" class="btn tiny danger-ghost" [disabled]="busy() || thumbnailBusyId() === post.id"
                                        (click)="clearPostThumbnail(post)">
                                  × Clear
                                </button>
                              }
                            </div>
                          }

                          @if (post.aiThumbnailPrompt) {
                            <div class="thumb-prompt-line">
                              <small class="clamp-2"><strong>Prompt:</strong> {{ post.aiThumbnailPrompt }}</small>
                              <button type="button" class="copy-btn" (click)="copyText(post.aiThumbnailPrompt, 'Thumbnail prompt copied!')">Copy</button>
                            </div>
                          }
                        </div>
                      </div>

                      <div class="meta-preview-grid">
                        <div class="snip-block">
                          <div class="snip-label">
                            <span>YouTube Description ({{ (post.description || '').length }} chars)</span>
                            <button type="button" class="copy-btn" (click)="copyText(post.description || '', 'Description copied!')">Copy</button>
                          </div>
                          <p>{{ post.description || 'Missing description — click Auto-Fill Missing or Edit Metadata.' }}</p>
                        </div>
                        <div class="snip-block">
                          <div class="snip-label">
                            <span>Tags ({{ post.tags.length }} • {{ youtubeTagsLength(post.tags) }}/500 chars)</span>
                            <button type="button" class="copy-btn" (click)="copyText(post.tags.join(', '), 'Tags copied!')">Copy</button>
                          </div>
                          @if (post.tags.length > 0) {
                            <div class="tags-chip-list">
                              @for (tg of post.tags; track tg) {
                                <span class="tag-chip">{{ tg }}</span>
                              }
                            </div>
                          } @else {
                            <p class="muted-note">No tags yet — click Auto-Fill Missing or Edit Metadata to add tags.</p>
                          }
                          @if (post.pinnedComment) {
                            <div class="pinned-note"><small><strong>Pinned Comment:</strong> {{ post.pinnedComment }}</small></div>
                          }
                        </div>
                      </div>
                    </div>
                  }

                  @if (post.publishedVideoUrl) {
                    <div class="published-bar">
                      Published{{ post.publishedChannelTitle ? ' on ' + post.publishedChannelTitle : '' }}:
                      <a [href]="post.publishedVideoUrl" target="_blank" rel="noopener">{{ post.publishedVideoUrl }}</a>
                      @if (post.syncedToEcosystemAtUtc) {
                        <span class="pill ok">Synced to Panchang Hub</span>
                      }
                    </div>
                  }
                  @if (post.removedVideos?.length) {
                    <div class="removed-history">
                      <strong>Earlier uploads removed from YouTube</strong>
                      @for (rv of post.removedVideos; track rv.videoId + rv.removedAtUtc) {
                        <div class="removed-row">
                          <code>{{ rv.videoId }}</code>
                          <span>{{ rv.channelTitle || rv.channelId || 'unknown channel' }}</span>
                          <span class="pill subtle">{{ rv.deletedByApp ? 'Deleted from app' : 'Gone from YouTube' }}</span>
                          <span class="muted">{{ rv.removedAtUtc | date: 'medium' }}</span>
                        </div>
                      }
                    </div>
                  }

                  <div class="post-actions">
                    <button type="button" class="btn ghost" (click)="openPostEditor(post)">
                      Preview &amp; Edit Full Details
                    </button>
                    @if (post.status === 'Published' && post.publishedVideoUrl && post.format !== 'CommunityPost') {
                      <button type="button" class="btn ghost" [disabled]="busy()" (click)="syncToPanchangHub(post)"
                              title="Show this YouTube video on panchang.keshavsingh.in/videos (any channel)">
                        {{ busyAction() === 'sync:' + post.id ? 'Publishing…' : (post.syncedToEcosystemAtUtc ? 'Re-sync to Panchang Hub' : '🕉️ Publish to Panchang Hub') }}
                      </button>
                      @if (post.syncedToEcosystemAtUtc) {
                        <button type="button" class="btn ghost" [disabled]="busy()" (click)="removeFromPanchangHub(post)">
                          {{ busyAction() === 'unsync:' + post.id ? 'Removing…' : 'Remove from Panchang Hub' }}
                        </button>
                      }
                    }
                    @if (post.status === 'Published' && post.publishedVideoId) {
                      <button type="button" class="btn danger-ghost" [disabled]="busy()" (click)="openYouTubeRemoval(post)">
                        Remove from YouTube / Move channel
                      </button>
                    }
                    @if (post.status !== 'Published' && post.status !== 'Publishing') {
                      @if (post.format !== 'CommunityPost') {
                        <button type="button" class="btn ok"
                                [disabled]="busy() || post.verificationStatus === 'Mismatch' || (!post.attachedHandoffId && !post.attachedRenderJobId) || !post.targetChannelId"
                                [title]="post.verificationStatus === 'Mismatch' ? 'Date/fact mismatch detected — click Fix with Verified Data first' : (!post.targetChannelId ? 'Assign a YouTube channel in Edit or Rule first' : (!(post.attachedHandoffId || post.attachedRenderJobId) ? 'Attach or generate a video first' : 'Publish to YouTube now'))"
                                (click)="publishNow(post)">
                          Publish to YouTube
                        </button>
                        @if (post.scheduledAtUtc) {
                          <button type="button" class="btn ghost"
                                  [disabled]="busy() || post.verificationStatus === 'Mismatch' || (!post.attachedHandoffId && !post.attachedRenderJobId) || !post.targetChannelId"
                                  [title]="post.verificationStatus === 'Mismatch' ? 'Date/fact mismatch detected — click Fix with Verified Data first' : 'Approve & Schedule'"
                                  (click)="scheduleForRuleTime(post)">
                            Approve Schedule
                          </button>
                        }
                      }
                    }
                    @if (post.status !== 'Publishing') {
                      <button type="button" class="btn danger-ghost" [disabled]="busy()" (click)="removePost(post)">
                        Delete
                      </button>
                    }
                  </div>
            </div>
          </div>
        </div>
      }

      <!-- GENERATE VIDEO WIZARD: engine -> who writes the script -> (template: copy, fill in any AI, paste back) -->
      @if (wizard(); as wz) {
        @if (wizardPost(); as wp) {
          <div class="modal-backdrop" (click)="closeWizard()">
            <div class="modal-card large" role="dialog" aria-modal="true" aria-labelledby="gen-wizard-title" (click)="$event.stopPropagation()">
              <div class="modal-head">
                <h2 id="gen-wizard-title" class="clamp-1">Generate Video · {{ wp.title }}</h2>
                <button type="button" class="link-btn" (click)="closeWizard()">Close ×</button>
              </div>

              <ol class="wiz-steps" aria-label="Steps">
                @for (s of wizardSteps(); track s.key; let i = $index) {
                  <li [class.active]="wz.step === s.key" [class.done]="i < wizardStepIndex()">{{ i + 1 }}. {{ s.label }}</li>
                }
              </ol>

              <div class="modal-body">
                @if (wizardRender(); as rp) {
                  <div class="render-progress" role="status" aria-live="polite">
                    <div class="rp-head">
                      <span class="rp-stage"><span class="btn-spin" aria-hidden="true"></span>{{ rp.stage }}</span>
                      <strong class="rp-pct">{{ rp.percent }}%</strong>
                    </div>
                    <div class="rp-track" role="progressbar" aria-label="Render progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="rp.percent">
                      <div class="rp-fill" [style.width.%]="rp.percent"></div>
                    </div>
                    <ol class="rp-steps">
                      @for (s of rp.steps; track s.label) {
                        <li [class.done]="s.state === 'done'" [class.active]="s.state === 'active'">
                          <span class="rp-dot" aria-hidden="true">{{ s.state === 'done' ? '✓' : '' }}</span>{{ s.label }}
                        </li>
                      }
                    </ol>
                    <small class="muted-note">
                      Elapsed {{ rp.elapsed }}. Voices usually take the longest. You can hide this window; the render keeps going and the card shows its progress.
                    </small>
                  </div>
                } @else {
                @if (wz.step === 'engine') {
                  <div class="choice-grid">
                    @for (opt of wizardEngineOptions; track opt.value) {
                      <button type="button" class="choice-card" [class.selected]="wz.engine === opt.value" (click)="setWizardEngine(opt.value)">
                        <span class="choice-icon" aria-hidden="true">{{ opt.icon }}</span>
                        <strong>{{ opt.label }}</strong>
                        <small>{{ opt.hint }}</small>
                        <span class="pill subtle">{{ opt.quality }}</span>
                      </button>
                    }
                  </div>
                  @if (wz.engine === 'StorageImagesStory' && (wp.attachedAssetIds?.length ?? 0) === 0) {
                    <p class="muted-note">No storage images picked. The first 16 images in your Studio Storage will be used.
                      <button type="button" class="link-btn" (click)="openStoragePicker({ kind: 'post', post: wp })">Pick images</button>
                    </p>
                  }
                }

                @if (wz.step === 'source') {
                  <div class="choice-grid two">
                    <button type="button" class="choice-card" [class.selected]="wz.source === 'ai'" (click)="setWizardSource('ai')">
                      <span class="choice-icon" aria-hidden="true">✨</span>
                      <strong>AI writes the full story</strong>
                      <small>Uses the configured text model. Fully automatic. If no model is reachable, the run pauses and asks you to paste a script.</small>
                    </button>
                    <button type="button" class="choice-card" [class.selected]="wz.source === 'template'" (click)="setWizardSource('template')">
                      <span class="choice-icon" aria-hidden="true">📋</span>
                      <strong>Template → my AI tool</strong>
                      <small>
                        Copy a ready template into ChatGPT, Gemini or Claude, then paste the answer back.
                        @if (wz.engine === 'Procedural3D') { It returns a cast list (main + supporting characters), scene lines with realistic background image prompts, and the dialogue. }
                        @else { It returns every scene: seconds, background, characters and their looks, camera and dialogue. }
                      </small>
                    </button>
                  </div>

                  <div class="form-2col">
                    <label class="field">
                      <span>Target length</span>
                      <select [ngModel]="postDurationSeconds(wp.id)" (ngModelChange)="setPostDurationSeconds(wp.id, $event)">
                        @for (opt of durationOptionsFor(wp.format); track opt.value) {
                          <option [ngValue]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                      <small class="muted-note">
                        @if (wp.format === 'Wide') { Full 16:9 video: up to 10 minutes. }
                        @else { Shorts are limited to 3 minutes by YouTube. Switch this post to Full 16:9 for a longer video. }
                      </small>
                    </label>
                    @if (wz.engine === 'Procedural3D') {
                      <label class="field">
                        <span>Subtitle style</span>
                        <select [ngModel]="wp.subtitlePreset || 'event-glow'" (ngModelChange)="wp.subtitlePreset = $event">
                          @for (sp of subtitlePresets; track sp.value) {
                            <option [value]="sp.value">{{ sp.label }}</option>
                          }
                        </select>
                      </label>
                    }
                  </div>
                  @if (wz.engine === 'Procedural3D') {
                    <p class="muted-note">Enhanced 3D renders a stylised stage on this server. It is fast and free, but for the most realistic result use AI Realistic Story. Next: choose the background, then music.</p>
                  }
                }

                @if (wz.step === 'background') {
                  <div class="choice-grid two">
                    <button type="button" class="choice-card" [class.selected]="wz.backdrop === 'default'" (click)="setWizardBackdrop('default')">
                      <span class="choice-icon" aria-hidden="true">🌌</span>
                      <strong>Animated 3D stage</strong>
                      <small>Moving 3D scenery picked from the script. With an image engine set up, each scene gets its own realistic AI picture with a slow zoom and a soft transition between scenes.
                        With "Template → my AI tool", you can also upload your own picture for every scene after pasting the answer.</small>
                    </button>
                    <button type="button" class="choice-card" [class.selected]="wz.backdrop === 'picture'" (click)="setWizardBackdrop('picture')">
                      <span class="choice-icon" aria-hidden="true">🖼</span>
                      <strong>My background picture</strong>
                      <small>Generate one with AI from a ready prompt, or upload or pick your own. Characters, voices, captions and light effects play on top; the picture can stay still or move slowly.</small>
                    </button>
                  </div>

                  @if (wz.backdrop === 'picture') {
                    <div class="bg-make">
                      <div class="snip-label">
                        <span>✨ Picture prompt for this post</span>
                        <span class="bg-make-actions">
                          <button type="button" class="copy-btn" [disabled]="!bgPromptText().trim()"
                                  (click)="copyText(bgPromptText(), 'Picture prompt copied! Paste it into Gemini or ChatGPT.')">Copy prompt</button>
                          <button type="button" class="link-btn" [disabled]="bgPromptLoading()" (click)="loadBackgroundPrompt(true)">↻ Rebuild</button>
                        </span>
                      </div>
                      @if (bgPromptLoading() && !bgPromptText()) {
                        <div class="template-wait" role="status"><span class="btn-spin" aria-hidden="true"></span><span>Writing the picture prompt…</span></div>
                      } @else {
                        <textarea class="tpl-text" rows="5" maxlength="2000" [ngModel]="bgPromptText()" (ngModelChange)="setBackgroundPromptText($event)"
                                  aria-label="Background picture prompt"></textarea>
                      }
                      @if (bgPrompt(); as bp) {
                        <small class="muted-note">
                          Built from {{ promptBasisLabel(bp.basis) }} for a {{ bp.width }}×{{ bp.height }} ({{ bp.aspectRatio }}) frame, with open ground where your characters stand.
                          Edit it freely. Rebuild after changing the location or the character spots.
                          <button type="button" class="link-btn" (click)="copyText(bp.negativePrompt, 'Negative prompt copied!')">Copy negative prompt</button>
                        </small>
                      }
                      <div class="bg-pick-row">
                        <button type="button" class="btn primary" [disabled]="busy() || !bgPromptText().trim()" (click)="generateBackgroundPicture()">
                          @if (busyAction() === 'bg-generate') { <span class="btn-spin" aria-hidden="true"></span> Making your picture… }
                          @else { ✨ {{ wz.stage.backgroundTemplateAssetId ? 'Generate another' : 'Generate with AI' }} }
                        </button>
                        <a class="funnel-chip" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">↗ Gemini</a>
                        <a class="funnel-chip" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">↗ ChatGPT</a>
                        <small class="muted-note">Generate uses your image engine (or Gemini). Or copy the prompt, make the picture in any tool, then upload it below.</small>
                      </div>
                    </div>

                    <div class="bg-pick-row">
                      <label class="btn ghost file-btn" [class.disabled]="busy()">
                        @if (busyAction() === 'bg-upload') { <span class="btn-spin" aria-hidden="true"></span> Uploading… }
                        @else { ⬆ Upload picture }
                        <input type="file" accept="image/png,image/jpeg,image/webp" (change)="uploadBackgroundTemplate($event)" [disabled]="busy()" hidden />
                      </label>
                      <button type="button" class="btn ghost" (click)="toggleTemplateLibrary()">
                        {{ showTemplateLibrary() ? 'Hide my images' : '📁 Pick from Studio Storage' }}
                      </button>
                      <small class="muted-note">PNG, JPG or WebP up to 25 MB. Best size: {{ wp.format === 'Wide' ? '1920×1080 (16:9)' : '1080×1920 (9:16)' }}; other shapes are cropped to fill.</small>
                    </div>

                    @if (showTemplateLibrary()) {
                      @if (storageCatalog(); as cat) {
                        @if (cat.images.length === 0) {
                          <p class="muted-note">No images in your Studio Storage yet. Upload one above.</p>
                        } @else {
                          <div class="bg-library" role="list">
                            @for (img of cat.images; track img.id) {
                              <button type="button" role="listitem" class="bg-thumb" [class.selected]="wz.stage.backgroundTemplateAssetId === img.id"
                                      (click)="chooseBackgroundTemplate(img.id)" [attr.aria-label]="'Use ' + img.name">
                                <img [src]="storageAssetThumbnailUrl(img.id)" [alt]="img.name" loading="lazy" />
                              </button>
                            }
                          </div>
                        }
                      } @else {
                        <div class="template-wait" role="status"><span class="btn-spin" aria-hidden="true"></span><span>Loading your images…</span></div>
                      }
                    }

                    @if (wz.stage.backgroundTemplateAssetId; as bgId) {
                      <div class="snip-label"><span>Drag each character to where it should stand. The dot is the feet.</span>
                        <button type="button" class="link-btn" (click)="resetPlacements()">Reset spots</button></div>
                      <div class="stage-editor" [class.wide]="wp.format === 'Wide'"
                           (pointermove)="onStageDrag($event)" (pointerup)="endStageDrag()" (pointercancel)="endStageDrag()">
                        <img class="stage-bg" [src]="templateImageUrl(bgId)" alt="Background template" draggable="false" />
                        <div class="safe-zone" aria-hidden="true" title="Captions and YouTube buttons cover this area"></div>
                        @for (side of stageSides; track side) {
                          @let p = placementFor(side, wp.format);
                          <div class="stage-char" [class.right]="side === 'right'" tabindex="0" role="slider"
                               [attr.aria-label]="(side === 'left' ? characterName(wp, 'left') : characterName(wp, 'right')) + ' position'"
                               [attr.aria-valuetext]="'across ' + pct(p.x) + ', down ' + pct(p.y)"
                               [style.left.%]="p.x * 100" [style.top.%]="p.y * 100"
                               [style.width.%]="stageBox(wp.format).boxW * p.scale * 100"
                               [style.height.%]="stageBox(wp.format).boxH * p.scale * 100"
                               (pointerdown)="startStageDrag(side, $event)" (keydown)="nudgePlacement(side, wp.format, $event)">
                            <span class="stage-char-name">{{ side === 'left' ? characterName(wp, 'left') : characterName(wp, 'right') }}</span>
                            <span class="stage-char-feet" aria-hidden="true"></span>
                          </div>
                        }
                      </div>
                      <div class="form-2col">
                        @for (side of stageSides; track side) {
                          <label class="field">
                            <span>{{ side === 'left' ? characterName(wp, 'left') : characterName(wp, 'right') }} size: {{ pct(placementFor(side, wp.format).scale) }}</span>
                            <input type="range" min="0.5" max="1.8" step="0.05" [ngModel]="placementFor(side, wp.format).scale"
                                   (ngModelChange)="setPlacementScale(side, wp.format, $event)" />
                          </label>
                        }
                      </div>
                      <small class="muted-note">Tip: keep faces out of the shaded bottom area; captions and the YouTube buttons sit there. Arrow keys move a selected character.</small>

                      <div class="field">
                        <span>Picture motion</span>
                        <div class="filter-pills" role="radiogroup" aria-label="Picture motion">
                          @for (m of backdropMotions; track m.value) {
                            <button type="button" role="radio" [attr.aria-checked]="(wz.stage.backgroundMotion ?? 'Still') === m.value"
                                    [class.active]="(wz.stage.backgroundMotion ?? 'Still') === m.value" (click)="setStageMotion(m.value)">{{ m.label }}</button>
                          }
                        </div>
                        <small class="muted-note">{{ backdropMotionHint(wz.stage.backgroundMotion) }} Light rays, glowing particles and scene-change dips play on top either way.</small>
                      </div>
                    }
                  }

                  <label class="field">
                    <span>Location of the story (optional)</span>
                    <input type="text" maxlength="200" [ngModel]="wz.stage.locationPrompt ?? ''" (ngModelChange)="setStageLocation($event)"
                           placeholder="e.g. temple courtyard at sunrise, river ghat at night, royal palace court" />
                    <small class="muted-note">
                      @if (wz.backdrop === 'picture') { Describe the place in your picture. The script is written for it, and the light (dawn, night…) follows it. }
                      @else { Picks the 3D setting and, when an image engine is set up, the realistic background that gets painted. Leave empty to choose from the script. }
                    </small>
                  </label>
                }

                @if (wz.step === 'audio') {
                  <div class="choice-grid two">
                    <button type="button" class="choice-card" [class.selected]="wz.stage.includeBackgroundMusic" (click)="setStageMusic(true)">
                      <span class="choice-icon" aria-hidden="true">🎵</span>
                      <strong>With background music</strong>
                      <small>A soft music bed under the voices that dips while characters speak.</small>
                    </button>
                    <button type="button" class="choice-card" [class.selected]="!wz.stage.includeBackgroundMusic" (click)="setStageMusic(false)">
                      <span class="choice-icon" aria-hidden="true">🔇</span>
                      <strong>Voice only</strong>
                      <small>No music in the file, so you can add any track or sound in YouTube or another editor later.</small>
                    </button>
                  </div>
                  @if (wz.engine === 'Procedural3D') {
                    <label class="field" style="margin-top:12px;">
                      <span>Song-to-3D Audio Bridge (optional track from Songs Library)</span>
                      <select [ngModel]="wz.stage.attachedSongId ?? ''" (ngModelChange)="setStageSong($event)">
                        <option value="">-- Use automatic theme instrumental music --</option>
                        @for (s of librarySongs(); track s.id) {
                          <option [value]="s.id">🎵 {{ s.title }} ({{ s.language.toUpperCase() }} • {{ s.style }})</option>
                        }
                      </select>
                      <small class="muted-note">
                        @if (librarySongs().length === 0) { No saved songs in Studio Songs yet — compose one on the Songs tab or use automatic theme BGM above. }
                        @else { Selected song is normalized to -22 LUFS and automatically ducked behind dialogue! }
                      </small>
                    </label>
                  }
                  @if (wz.engine !== 'Procedural3D') {
                    <p class="muted-note">With music, a score is composed for the story (Google Lyria when set up). Voice only skips that step and saves a Lyria request.</p>
                    <label class="check-row">
                      <input type="checkbox" [ngModel]="!!wz.stage.reviewSteps" (ngModelChange)="setStageReview($event)" />
                      <span>
                        <strong>Let me review each step</strong><br />
                        <small class="muted-note">The build pauses after the voices, the music and the finished video. The card shows a Review button that opens the Story Studio, where you can listen, redo a scene's voice or the music, then approve and carry on. Off runs straight through to the video.</small>
                      </span>
                    </label>
                  } @else {
                  <label class="check-row">
                    <input type="checkbox" [ngModel]="wz.stage.followScriptExactly" (ngModelChange)="setStageFollowScript($event)" />
                    <span>
                      <strong>Follow the script exactly</strong> (recommended)<br />
                      <small class="muted-note">Every line is spoken in full at natural speed, with no lines dropped or sped up, and the video ends when the story ends (no silent padding).
                        @if (wp.format !== 'Wide') { If the story runs past 3 minutes, YouTube treats it as a normal video instead of a Short. }</small>
                    </span>
                  </label>
                  @if (!wz.stage.followScriptExactly) {
                    <p class="muted-note">Fit to length: voices may be sped up slightly and middle lines dropped to stay within {{ wp.format === 'Wide' ? '10 minutes' : 'the 3-minute Shorts limit' }}.</p>
                  }
                  }
                }

                @if (wz.step === 'template') {
                  @if (templateState(); as ts) {
                    @if (!ts.ready) {
                      <div class="template-wait" role="status">
                        <span class="btn-spin" aria-hidden="true"></span>
                        <span>{{ ts.message || 'Preparing your template…' }}</span>
                      </div>
                    } @else {
                      <div class="tpl-step">
                        <div class="snip-label">
                          <span>Step A: copy this template into your AI tool</span>
                          <button type="button" class="copy-btn" (click)="copyText(ts.prompt || '', 'Template copied! Paste it into your AI tool.')">Copy template</button>
                        </div>
                        <small class="muted-note">Written for: {{ postDurationLabel(wp.id) }}. To change it, go Back and pick another target length.</small>
                        <textarea class="tpl-text" rows="8" readonly [value]="ts.prompt || ''" aria-label="Script template"></textarea>
                        <div class="chips-row">
                          <a class="funnel-chip" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">↗ ChatGPT</a>
                          <a class="funnel-chip" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">↗ Gemini</a>
                          <a class="funnel-chip" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">↗ Claude</a>
                        </div>
                      </div>
                      <div class="tpl-step">
                        <div class="snip-label">
                          <span>Step B: paste the AI's full answer here</span>
                          <span>{{ templateReply().length | number }} chars</span>
                        </div>
                        <textarea class="tpl-text" rows="10" [ngModel]="templateReply()" (ngModelChange)="onTemplateReplyChange($event)"
                                  [placeholder]="wz.engine === 'Procedural3D' ? dialoguePlaceholder : storyPlaceholder"
                                  aria-label="Pasted AI reply"></textarea>
                        <small class="muted-note">
                          The answer is checked before use.
                          @if (wz.engine === 'Procedural3D') { Only [CAST], [SCENE] and [Name]: line lines are kept; scene lines pick the 3D setting and background and are never spoken. }
                          @else { After it is accepted, voices, pictures, music and the render start on their own. }
                        </small>
                      </div>

                      @if (showScenePictures() && templateReply().trim().length >= 20) {
                        <div class="tpl-step scene-pics scene-pics-drop"
                             [appFileDrop]="'image/png,image/jpeg,image/webp'"
                             [fileDropMultiple]="true"
                             [fileDropDisabled]="sceneBusy() !== null || busy()"
                             (filesDropped)="uploadSceneFileBatch($event)">
                          <div class="snip-label">
                            <span>Step C (optional): a real picture for every scene</span>
                            @if (scenePlanLoading()) { <span class="btn-spin" aria-hidden="true"></span> }
                          </div>
                          @if (scenePlan(); as plan) {
                            @if (plan.scenes.length === 0) {
                              <small class="muted-note">This answer has no [SCENE] lines, so the animated 3D stage is used. Ask your AI tool to follow the template's format to get one picture per scene.</small>
                            } @else {
                              <small class="muted-note">
                                Your script has {{ plan.scenes.length }} scenes. Copy all picture prompts at once into Gemini, ChatGPT or any image tool to make the whole set
                                ({{ plan.aspectRatio }}, {{ plan.width }}×{{ plan.height }}), then upload or drop them all together.
                                Pictures match automatically by filename (<span class="mono">01.png</span>, <span class="mono">scene-2.jpg</span>, <span class="mono">river_ghat.png</span>)
                                or in upload order (<span class="mono">1, 2 … 10</span>). Leave every slot empty to keep the animated 3D stage.
                              </small>
                              <div class="bg-pick-row">
                                <button type="button" class="copy-btn" [class.copied]="copiedKey() === 'batch'"
                                        (click)="copyBatchPrompts(plan)"
                                        title="Copies all scene picture prompts together with framing, naming convention and avoid rules">
                                  @if (copiedKey() === 'batch') { ✓ Copied all {{ plan.scenes.length }} prompts }
                                  @else { Copy all {{ plan.scenes.length }} picture prompts }
                                </button>
                                <button type="button" class="link-btn"
                                        (click)="copyWithFlash('neg', plan.negativePrompt, 'Negative prompt copied!')">
                                  {{ copiedKey() === 'neg' ? '✓ Copied negative' : 'Copy negative prompt' }}
                                </button>
                                <a class="funnel-chip" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">↗ Gemini</a>
                                <a class="funnel-chip" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">↗ ChatGPT</a>
                              </div>
                              <div class="bg-pick-row">
                                <label class="btn ghost file-btn" [class.disabled]="sceneBusy() !== null || busy()"
                                       title="Select multiple pictures at once. Named files (01.png, scene-2.jpg, temple.png) match their scene automatically; unnamed files fill in order.">
                                  @if (sceneBusy() !== null) { <span class="btn-spin" aria-hidden="true"></span> Uploading… }
                                  @else { ⬆ Upload all pictures (name or order) }
                                  <input type="file" multiple accept="image/png,image/jpeg,image/webp" (change)="uploadScenePictures($event)"
                                         [disabled]="sceneBusy() !== null || busy()" hidden />
                                </label>
                                <button type="button" class="btn ghost" [disabled]="sceneBusy() !== null || busy() || scenePicsFilled() === plan.scenes.length"
                                        (click)="generateMissingScenePictures()">✨ Make missing ones with AI</button>
                                @if (scenePicsFilled() > 0) {
                                  <button type="button" class="link-btn" [disabled]="sceneBusy() !== null" (click)="clearAllScenePics()">Clear all</button>
                                }
                                <small class="muted-note">{{ scenePicsFilled() }} of {{ plan.scenes.length }} scenes have a picture. Drop files here or pick multiple — matches 01 / scene-2 / setting name, else file order.</small>
                              </div>
                              <ol class="scene-pic-list">
                                @for (scene of plan.scenes; track scene.number; let i = $index) {
                                  @let picId = scenePics()[i];
                                  @let picMeta = scenePicMeta()[i];
                                  <li class="scene-pic"
                                      [appFileDrop]="'image/png,image/jpeg,image/webp'"
                                      [fileDropDisabled]="sceneBusy() !== null || busy()"
                                      (filesDropped)="uploadSceneFile(i, $event[0])">
                                    <div class="scene-pic-thumb" [class.wide]="wp.format === 'Wide'">
                                      @if (sceneBusy() === i) {
                                        <span class="btn-spin" aria-hidden="true"></span>
                                      } @else if (picId) {
                                        <img [src]="storageAssetThumbnailUrl(picId)" [alt]="'Picture for scene ' + scene.number" loading="lazy" />
                                      } @else {
                                        <span class="scene-pic-empty">{{ scene.number }}</span>
                                      }
                                    </div>
                                    <div class="scene-pic-body">
                                      <div class="scene-pic-head">
                                        <strong>Scene {{ scene.number }} · {{ sceneLabel(scene.setting, scene.timeOfDay) }}@if (scene.mood) { · {{ scene.mood }} }</strong>
                                        <span class="mono scene-file-chip" title="Suggested file name when saving for batch upload">{{ suggestedFileLabel(scene, plan.scenes.length) }}</span>
                                        @if (picId && picMeta) {
                                          <span class="scene-match-chip" [title]="picMeta.name + ' (' + picMeta.reasonText + ')'">✓ {{ picMeta.name }} · {{ picMeta.reasonText }}</span>
                                        }
                                      </div>
                                      <small class="scene-pic-prompt">{{ scene.prompt }}</small>
                                      <div class="scene-pic-actions">
                                        <button type="button" class="link-btn"
                                                (click)="copyWithFlash('scene-' + i, scene.prompt, 'Scene ' + scene.number + ' prompt copied!')">
                                          {{ copiedKey() === 'scene-' + i ? '✓ Copied' : 'Copy prompt' }}
                                        </button>
                                        <label class="link-btn" [class.disabled]="sceneBusy() !== null">
                                          {{ picId ? 'Replace' : 'Upload' }}
                                          <input type="file" accept="image/png,image/jpeg,image/webp" (change)="uploadScenePicture(i, $event)" [disabled]="sceneBusy() !== null" hidden />
                                        </label>
                                        <button type="button" class="link-btn" [disabled]="sceneBusy() !== null" (click)="generateScenePicture(i)">✨ {{ picId ? 'Make another' : 'Make with AI' }}</button>
                                        @if (picId) {
                                          <button type="button" class="link-btn" [disabled]="i === 0" (click)="moveScenePic(i, -1)" [attr.aria-label]="'Move picture to scene ' + i">↑</button>
                                          <button type="button" class="link-btn" [disabled]="i === plan.scenes.length - 1" (click)="moveScenePic(i, 1)" [attr.aria-label]="'Move picture to scene ' + (i + 2)">↓</button>
                                          <button type="button" class="link-btn" (click)="clearScenePic(i)">Remove</button>
                                        }
                                      </div>
                                    </div>
                                  </li>
                                }
                              </ol>
                            }
                          } @else if (!scenePlanLoading()) {
                            <button type="button" class="link-btn" (click)="loadScenePlan()">Find the scenes in this answer</button>
                          }
                        </div>
                      }
                    }
                  }
                }
                }
              </div>

              <div class="modal-foot">
                @if (wizardRender()) {
                  <button type="button" class="btn ghost" (click)="closeWizard()">Hide (keeps rendering)</button>
                } @else {
                @if (wz.step !== 'engine') {
                  <!-- Back from the paste step is allowed for every engine: a run waiting for its script is idle,
                       and "Get Template" on the Script step starts a fresh run that replaces it on the post. -->
                  <button type="button" class="btn ghost" [disabled]="busy()" (click)="wizardBack()">Back</button>
                }
                <button type="button" class="btn ghost" (click)="closeWizard()">{{ wz.step === 'template' ? 'Finish later' : 'Cancel' }}</button>
                @if (wz.step === 'engine' || wz.step === 'background' || wz.step === 'source') {
                  <button type="button" class="btn primary" [disabled]="busy()" (click)="wizardNext()">Next</button>
                }
                @if (wz.step === 'audio') {
                  <button type="button" class="btn primary" [disabled]="busy()" (click)="startWizard()">
                    @if (busy()) { <span class="btn-spin" aria-hidden="true"></span> }
                    {{ wz.source === 'template' ? 'Get Template' : (wz.engine === 'Procedural3D' ? 'Render 3D Video' : 'Start AI Story') }}
                  </button>
                }
                @if (wz.step === 'template') {
                  <button type="button" class="btn primary" [disabled]="busy() || !templateState()?.ready || templateReply().trim().length < 20"
                          (click)="submitTemplateReply()">
                    @if (busy()) { <span class="btn-spin" aria-hidden="true"></span> }
                    {{ wz.engine === 'Procedural3D' ? 'Use Script & Render' : 'Use Script & Make Video' }}
                  </button>
                }
                }
              </div>
            </div>
          </div>
        }
      }

      <!-- POST EDITOR MODAL -->
      @if (editingPost(); as draft) {
        <div class="modal-backdrop" (click)="editingPost.set(null)">
          <div class="modal-card large" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>Preview &amp; Edit Prepared Post</h2>
              <button type="button" class="link-btn" (click)="editingPost.set(null)">Close ×</button>
            </div>

            <div class="modal-body">
              <div class="form-2col">
                <label class="field">
                  <span>YouTube Title ({{ (draft.title || '').length }}/100 chars)</span>
                  <input type="text" maxlength="100" [(ngModel)]="draft.title" />
                </label>
                <label class="field">
                  <span>Target Connected Channel</span>
                  <select [(ngModel)]="draft.targetChannelId">
                    <option [ngValue]="null">-- Unassigned --</option>
                    @for (ch of overview()?.connectedChannels ?? []; track ch.channelId) {
                      <option [ngValue]="ch.channelId">{{ ch.channelTitle }} ({{ ch.channelHandle || ch.channelId }})</option>
                    }
                  </select>
                </label>
                <div class="field">
                  <span>Scheduled Upload Time (Local)</span>
                  <div class="sched-input-row">
                    <input type="datetime-local" [(ngModel)]="editingScheduledLocal" />
                    <button type="button" class="btn tiny ghost" title="Clear schedule time" (click)="editingScheduledLocal = ''">Clear</button>
                    <button type="button" class="btn tiny primary" [disabled]="loadingAdvice()" (click)="loadPublishAdvice(draft.sourceType, draft.format, draft.targetChannelId)">
                      {{ loadingAdvice() ? 'Loading…' : '⏰ Peak Times & Promo' }}
                    </button>
                  </div>
                </div>
                <label class="field">
                  <span>YouTube Category</span>
                  <select [(ngModel)]="draft.categoryId">
                    @for (cat of youtubeCategories; track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span>Visibility</span>
                  <select [(ngModel)]="draft.privacy">
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </label>
                <label class="field">
                  <span>Audience / Kids Setting (COPPA)</span>
                  <label class="toggle-inline check-inline-box">
                    <input type="checkbox" [(ngModel)]="draft.madeForKids" />
                    <span>Yes, Made for Kids (unchecked = General audience)</span>
                  </label>
                </label>
                <label class="field">
                  <span>Tags (comma separated — {{ editingTagsLength() }}/500 chars • {{ editingTagsCount() }} tags)</span>
                  <input type="text" [(ngModel)]="editingTagsCsv" placeholder="tag1, tag2, Shorts, Panchang" />
                </label>
                <label class="field">
                  <span>Post Format</span>
                  <select [(ngModel)]="draft.format">
                    @for (fmt of formatOptions; track fmt.value) {
                      <option [value]="fmt.value">{{ fmt.label }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span>Visual Rendering Engine</span>
                  <select [(ngModel)]="draft.visualEngine">
                    @for (ve of visualEngineOptions; track ve.value) {
                      <option [value]="ve.value">{{ ve.label }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span>Story Length Mode</span>
                  <select [(ngModel)]="draft.narrativeMode">
                    @for (nm of narrativeModeOptions; track nm.value) {
                      <option [value]="nm.value">{{ nm.label }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span>Subtitle Animation Style</span>
                  <select [(ngModel)]="draft.subtitlePreset">
                    @for (sp of subtitlePresets; track sp.value) {
                      <option [value]="sp.value">{{ sp.label }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span>Top Template Banner Label</span>
                  <input type="text" [(ngModel)]="draft.headerBannerText" placeholder="e.g. TODAY'S HINDU PANCHANG" />
                </label>
                <label class="field">
                  <span>Speaker A Character Name (2-Char Dialogue)</span>
                  <input type="text" [(ngModel)]="draft.speakerAName" placeholder="e.g. Raja Harishchandra" />
                </label>
                <label class="field">
                  <span>Speaker B Character Name (2-Char Dialogue)</span>
                  <input type="text" [(ngModel)]="draft.speakerBName" placeholder="e.g. Maharishi Vishwamitra" />
                </label>
              </div>

              <label class="toggle-inline">
                <input type="checkbox" [(ngModel)]="draft.enableCharacterDialogue" />
                <span>Enable animated 2-character dialogue stage in 3D Auto Video</span>
              </label>

              <div class="settings-grid">
                <label class="toggle-inline">
                  <input type="checkbox" [ngModel]="postShowWatermark(draft)" (ngModelChange)="setPostShowWatermark(draft, $event)" />
                  <span>Show Bottom Watermark (uncheck for clean Panchang / Rashifal look)</span>
                </label>
                <label class="toggle-inline">
                  <input type="checkbox" [(ngModel)]="draft.preferFast2DAnimation" />
                  <span>Ultra-Fast 2D Motion Animation (CpuFast)</span>
                </label>
              </div>

              @if (publishAdvice(); as adv) {
                <div class="advice-box">
                  <div class="advice-head">
                    <strong>⏰ Recommended Peak Upload Times &amp; Where to Promote ({{ adv.timeZoneId }})</strong>
                    <button type="button" class="link-btn" (click)="publishAdvice.set(null)">Hide ×</button>
                  </div>
                  <div class="advice-slots">
                    @for (slot of adv.slots; track slot.atUtc) {
                      <div class="advice-slot-chip">
                        <div>
                          <strong>{{ slot.localLabel }}</strong>
                          <small>{{ slot.expectedReachTier }} • {{ slot.reason }}</small>
                        </div>
                        <div class="sched-input-row">
                          <button type="button" class="btn tiny ghost" (click)="useSuggestedSlot(slot.atUtc)">Pick Time</button>
                          <button type="button" class="btn tiny primary"
                                  [disabled]="busy() || (!draft.attachedHandoffId && !draft.attachedRenderJobId) || !draft.targetChannelId"
                                  title="Upload Private to YouTube now with native YouTube publishAt schedule"
                                  (click)="schedulePostOnYouTube(draft, slot.atUtc)">
                            🚀 Schedule on YT
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="advice-promos">
                    @for (promo of adv.promotions; track promo.platform + promo.title) {
                      <div class="advice-promo-item">
                        <span class="pill subtle">{{ promo.platform }} • {{ promo.priority }}</span>
                        <strong>{{ promo.title }}</strong>
                        <small>{{ promo.timingHint }} — {{ promo.actionSummary }}</small>
                      </div>
                    }
                  </div>
                </div>
              }

              <label class="field">
                <span>YouTube Community Post Copy</span>
                <textarea rows="3" [(ngModel)]="draft.communityPostText"></textarea>
              </label>

              <label class="field">
                <span>Narration / Spoken Script</span>
                <textarea rows="5" [(ngModel)]="draft.script"></textarea>
              </label>

              <label class="field">
                <span>AI Video Generation Prompt (Veo / Google Flow / Runway / Story Agent)</span>
                <textarea rows="3" [(ngModel)]="draft.aiVideoPrompt"></textarea>
              </label>

              <label class="field">
                <span>AI Thumbnail Image Prompt</span>
                <textarea rows="2" [(ngModel)]="draft.aiThumbnailPrompt"></textarea>
              </label>

              @if (draft.format !== 'CommunityPost') {
                <div class="thumb-studio-box">
                  <div class="thumb-preview-slot" [class.portrait]="draft.format === 'Vertical'">
                    @if (hasPostThumbnail(draft)) {
                      <img class="thumb-preview-img" [src]="postThumbnailUrl(draft)" [alt]="draft.title" />
                    } @else {
                      <div class="thumb-empty-slot">
                        <span>🖼</span>
                        <small>No thumbnail yet</small>
                      </div>
                    }
                  </div>
                  <div class="thumb-controls-col">
                    <div class="thumb-status-line">
                      <strong>Thumbnail for Scheduled / YouTube Upload:</strong>
                      <span class="pill" [ngClass]="hasPostThumbnail(draft) ? 'tone-ok' : 'tone-warn'">
                        {{ draft.thumbnailSource || (hasPostThumbnail(draft) ? 'Configured' : 'Not set') }}
                      </span>
                    </div>
                    <div class="thumb-actions-row">
                      <label class="btn tiny primary" [class.disabled]="busy() || thumbnailBusyId() === draft.id">
                        📤 Upload Image
                        <input type="file" accept="image/png,image/jpeg" hidden
                               [disabled]="busy() || thumbnailBusyId() === draft.id"
                               (change)="onPostThumbnailFile(draft, $event)" />
                      </label>
                      <button type="button" class="btn tiny" [disabled]="busy() || thumbnailBusyId() === draft.id"
                              (click)="generateAiPostThumbnail(draft, draft.aiThumbnailPrompt)">
                        {{ thumbnailBusyId() === 'ai:' + draft.id ? 'Generating…' : '✨ AI Generate' }}
                      </button>
                      <button type="button" class="btn tiny ghost" [disabled]="busy() || thumbnailBusyId() === draft.id"
                              (click)="openStoragePicker({ kind: 'thumbnail', post: draft })">
                        🖼 Storage Image
                      </button>
                      @if (draft.attachedRenderJobId || draft.attachedHandoffId) {
                        <div class="frame-pick-inline">
                          <input type="number" min="0" step="0.5" [ngModel]="draft.thumbnailFrameAtSeconds ?? thumbFrameSeconds()"
                                 (ngModelChange)="thumbFrameSeconds.set($event)" aria-label="Thumbnail frame seconds" />
                          <button type="button" class="btn tiny ghost" [disabled]="busy() || thumbnailBusyId() === draft.id"
                                  (click)="setFrameThumbnail(draft)">
                            🎞 Frame (s)
                          </button>
                        </div>
                      }
                      @if (hasPostThumbnail(draft)) {
                        <button type="button" class="btn tiny danger-ghost" [disabled]="busy() || thumbnailBusyId() === draft.id"
                                (click)="clearPostThumbnail(draft)">
                          × Clear
                        </button>
                      }
                    </div>

                    <details class="tpl-thumb-box" [open]="draft.sourceType === 'HinduPanchang' || draft.sourceType === 'DailyRashifal'">
                      <summary>📐 Fixed 2D Template Thumbnail (&lt;1s Instant Render — Editable Date, Title, Subtitle &amp; BG)</summary>
                      <div class="form-2col" style="margin-top: 8px;">
                        <label class="field">
                          <span>Date / Vara Stamp</span>
                          <input type="text" [ngModel]="templateDateText()" (ngModelChange)="templateDateText.set($event)" />
                        </label>
                        <label class="field">
                          <span>Main Overlay Title</span>
                          <input type="text" [ngModel]="templateTitleText()" (ngModelChange)="templateTitleText.set($event)" />
                        </label>
                        <label class="field">
                          <span>Subtitle / Tithi Line</span>
                          <input type="text" [ngModel]="templateSubtitleText()" (ngModelChange)="templateSubtitleText.set($event)" />
                        </label>
                        <div class="field">
                          <span>Background Image (Default or Picked)</span>
                          <div class="sched-input-row">
                            <span class="pill subtle">{{ templateBgAssetId() ? 'BG: ' + templateBgAssetId().slice(0, 8) + '…' : 'Gradient Theme BG' }}</span>
                            <button type="button" class="btn tiny ghost" (click)="openStoragePicker({ kind: 'template-thumb', post: draft })">🖼 Pick BG</button>
                            @if (templateBgAssetId()) {
                              <button type="button" class="btn tiny danger-ghost" (click)="templateBgAssetId.set('')">Clear</button>
                            }
                          </div>
                        </div>
                      </div>
                      <div class="sched-input-row" style="margin-top: 8px; flex-wrap: wrap;">
                        <label class="toggle-inline">
                          <input type="checkbox" [ngModel]="templateShowWatermark()" (ngModelChange)="templateShowWatermark.set($event)" />
                          <span>Show Watermark</span>
                        </label>
                        <label class="toggle-inline">
                          <input type="checkbox" [ngModel]="templateSaveDefaultBg()" (ngModelChange)="templateSaveDefaultBg.set($event)" />
                          <span>Save BG as Default</span>
                        </label>
                        <button type="button" class="btn tiny primary" [disabled]="busy() || thumbnailBusyId() === draft.id" (click)="applyFixedTemplateThumbnail(draft)">
                          {{ thumbnailBusyId() === 'tpl:' + draft.id ? 'Rendering…' : '⚡ Render Fixed Template PNG' }}
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
              }

              <label class="field">
                <span>SEO Description (includes Website Funnel Links)</span>
                <textarea rows="5" [(ngModel)]="draft.description"></textarea>
              </label>

              <label class="field">
                <span>First Pinned Comment (CTA Website Link)</span>
                <textarea rows="3" [(ngModel)]="draft.pinnedComment"></textarea>
              </label>

              <label class="field">
                <span>Internal Production Notes</span>
                <input type="text" [(ngModel)]="draft.notes" />
              </label>
            </div>

            <div class="modal-foot">
              @if (draft.format !== 'CommunityPost') {
                <button type="button" class="btn ghost" [disabled]="busy()" (click)="autoFillPostDetails(draft)" style="margin-right: auto;">
                  {{ busyAction() === 'autofill:' + draft.id ? 'Filling…' : '✨ Auto-Fill Missing' }}
                </button>
              }
              <button type="button" class="btn ghost" (click)="editingPost.set(null)">Cancel</button>
              <button type="button" class="btn primary" [disabled]="busy()" (click)="savePostEdits()">Save Edits</button>
            </div>
          </div>
        </div>
      }

      <!-- REMOVE FROM YOUTUBE / MOVE TO ANOTHER CHANNEL -->
      @if (removalPost(); as rmPost) {
        @if (removalForm(); as rf) {
          <div class="modal-backdrop" (click)="closeYouTubeRemoval()">
            <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="yt-removal-title" (click)="$event.stopPropagation()">
              <div class="modal-head">
                <h2 id="yt-removal-title" class="clamp-1">Remove / Move · {{ rmPost.title }}</h2>
                <button type="button" class="link-btn" (click)="closeYouTubeRemoval()">Close ×</button>
              </div>
              <div class="modal-body">
                <p class="muted">
                  Currently on <strong>{{ rmPost.publishedChannelTitle || rmPost.targetChannelTitle || 'YouTube' }}</strong>:
                  <a [href]="rmPost.publishedVideoUrl" target="_blank" rel="noopener">{{ rmPost.publishedVideoUrl }}</a>.
                  The rendered video stays attached to this card either way, so you can publish it again.
                </p>

                <div class="choice-stack" role="radiogroup" aria-label="What happened to the video on YouTube">
                  <label class="check-tile">
                    <input type="radio" name="ytRemovalMode" [checked]="rf.deleteOnYouTube" (change)="patchRemoval({ deleteOnYouTube: true })" />
                    <div>
                      <strong>Delete it on YouTube now</strong>
                      <small>Permanently deletes the video (views and comments are lost). Needs the channel connected with manage-videos permission.</small>
                    </div>
                  </label>
                  <label class="check-tile">
                    <input type="radio" name="ytRemovalMode" [checked]="!rf.deleteOnYouTube" (change)="patchRemoval({ deleteOnYouTube: false })" />
                    <div>
                      <strong>I already deleted it in YouTube Studio</strong>
                      <small>Only updates this card. Nothing is sent to YouTube.</small>
                    </div>
                  </label>
                </div>

                <label class="field">
                  <span>Publish it next on</span>
                  <select [ngModel]="rf.targetChannelId" (ngModelChange)="patchRemoval({ targetChannelId: $event })" name="ytRemovalChannel">
                    <option [ngValue]="null">Same channel ({{ rmPost.targetChannelTitle || 'unassigned' }})</option>
                    @for (ch of overview()?.connectedChannels ?? []; track ch.channelId) {
                      @if (ch.channelId !== rmPost.targetChannelId) {
                        <option [ngValue]="ch.channelId">{{ ch.channelTitle }} ({{ ch.channelHandle || ch.channelId }})</option>
                      }
                    }
                  </select>
                </label>

                <label class="toggle-inline">
                  <input type="checkbox" [ngModel]="rf.republishNow" (ngModelChange)="patchRemoval({ republishNow: $event })" name="ytRemovalRepublish" />
                  Upload it again right away
                </label>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn ghost" (click)="closeYouTubeRemoval()">Cancel</button>
                <button type="button" class="btn danger" [disabled]="busy()" (click)="confirmYouTubeRemoval()">
                  {{ busyAction() === 'yt-removal' ? 'Working…' : removalActionLabel(rf) }}
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- VIDEO PICKER MODAL -->
      @if (previewingPost(); as pvPost) {
        <div class="modal-backdrop" (click)="previewingPost.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>Preview: {{ pvPost.title }}</h2>
              <button type="button" class="link-btn" (click)="previewingPost.set(null)">Close ×</button>
            </div>
            <div class="modal-body">
              @if (pvPost.attachedRenderJobId; as rJobId) {
                <video class="preview-player" [src]="previewVideoUrl(rJobId)" controls autoplay playsinline></video>
                <div class="modal-foot">
                  <a class="btn primary" [href]="downloadVideoUrl(rJobId)" download>Download MP4</a>
                  <button type="button" class="btn ghost" (click)="previewingPost.set(null)">Close</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (pickingPost(); as targetPost) {
        <div class="modal-backdrop" (click)="pickingPost.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>Attach Video to: {{ targetPost.sourceTitle }}</h2>
              <button type="button" class="link-btn" (click)="pickingPost.set(null)">Close ×</button>
            </div>

            <div class="modal-body">
              @if (loadingCandidates()) {
                <app-loading-state mode="list" [count]="3" [compact]="true" title="Loading Google Drive clips &amp; finished Studio renders…" />
              } @else if (videoCandidates().length === 0) {
                <div class="empty-state">
                  No Drive clips or completed renders found yet. Click <strong>Generate AI Video</strong> on the card to create one automatically via Story Agent!
                </div>
              } @else {
                <div class="candidates-list">
                  @for (cand of videoCandidates(); track cand.id + cand.kind) {
                    <div class="cand-row" [class.used]="cand.isUsed">
                      <div class="cand-info">
                        <div class="badges-wrap">
                          <span class="pill" [class.ok]="cand.kind === 'drive'" [class.info]="cand.kind === 'render'">
                            {{ cand.kind === 'drive' ? 'Google Drive' : 'Studio Render' }}
                          </span>
                          @if (cand.topicName) {
                            <span class="pill subtle">{{ cand.topicName }}</span>
                          }
                          <span class="pill" [class.ok]="!cand.isUsed" [class.muted]="cand.isUsed">
                            {{ cand.isUsed ? 'Already Used' : 'Unused Ready' }}
                          </span>
                        </div>
                        <strong>{{ cand.title }}</strong>
                        <small>
                          {{ cand.isVertical ? '9:16 Vertical' : '16:9 Wide' }}
                          @if (cand.durationSeconds) { • {{ cand.durationSeconds | number:'1.0-0' }}s }
                        </small>
                      </div>
                      <button type="button" class="btn tiny primary" [disabled]="busy()" (click)="selectVideoCandidate(cand)">
                        Attach
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- STORAGE IMAGES PICKER MODAL -->
      @if (storagePickerTarget(); as spTarget) {
        <div class="modal-backdrop" (click)="storagePickerTarget.set(null)">
          <div class="modal-card large" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>
                {{
                  spTarget.kind === 'thumbnail' ? 'Pick Thumbnail Image for ' + spTarget.post.sourceTitle
                  : spTarget.kind === 'template-thumb' ? 'Pick Background Image for Fixed Template'
                  : spTarget.kind === 'settings-bg' ? 'Pick Default Panchang / Rashifal Background Image'
                  : spTarget.kind === 'settings-thumb' ? 'Pick Default Panchang / Rashifal Thumbnail Image'
                  : spTarget.kind === 'post' ? 'Pick Storage Images for ' + spTarget.post.sourceTitle
                  : 'Pick Storage Images for ' + (spTarget.kind === 'rule' ? spTarget.rule.name : '')
                }}
              </h2>
              <button type="button" class="link-btn" (click)="storagePickerTarget.set(null)">Close ×</button>
            </div>

            <div class="modal-body">
              <p class="muted-note">
                @if (isSingleStoragePicker(spTarget)) {
                  Click an image from your Studio Storage library to select it.
                } @else {
                  Selected images are animated scene-by-scene in Story Mode or crossfaded as backdrops in Enhanced 3D Mode.
                  ({{ storageSelectedIds().length }} selected)
                }
              </p>

              @if (loadingStorageCatalog()) {
                <app-loading-state mode="list" [count]="3" [compact]="true" title="Loading Studio Storage images &amp; character library…" />
              } @else {
                @if ((storageCatalog()?.characters?.length ?? 0) > 0) {
                  <div class="library-chars-strip">
                    <span class="lbl">Reusable Characters in Studio Library:</span>
                    <div class="chips-row">
                      @for (ch of storageCatalog()?.characters ?? []; track ch.id) {
                        <span class="pill subtle" [style.border-color]="ch.subtitleColorHex || ''">
                          {{ ch.name }} ({{ ch.projectName }})
                        </span>
                      }
                    </div>
                  </div>
                }

                @if ((storageCatalog()?.images?.length ?? 0) === 0) {
                  <div class="empty-state">
                    No uploaded images found in your Studio projects yet. Upload images in any Project Assets tab, or switch Visual Engine to <strong>AI Realistic Story</strong> so scenes are generated automatically.
                  </div>
                } @else {
                  <div class="storage-grid">
                    @for (img of storageCatalog()?.images ?? []; track img.id) {
                      <button type="button"
                              class="storage-tile"
                              [class.selected]="isStorageAssetSelected(img.id)"
                              (click)="toggleStorageAsset(img.id)">
                        <img class="storage-thumb" [src]="storageAssetThumbnailUrl(img.id)" [alt]="img.name" loading="lazy" />
                        <div class="storage-meta">
                          <strong>{{ img.name }}</strong>
                          <small>{{ img.projectName }} @if (img.width && img.height) { • {{ img.width }}×{{ img.height }} }</small>
                        </div>
                      </button>
                    }
                  </div>
                }
              }
            </div>

            <div class="modal-foot">
              <button type="button" class="btn ghost" (click)="storageSelectedIds.set([])">Clear All</button>
              <button type="button" class="btn ghost" (click)="storagePickerTarget.set(null)">Cancel</button>
              <button type="button" class="btn primary" [disabled]="busy() || (isSingleStoragePicker(spTarget) && storageSelectedIds().length === 0)" (click)="applyStoragePicker()">
                {{ isSingleStoragePicker(spTarget) ? 'Use Selected Image' : 'Use Selected (' + storageSelectedIds().length + ')' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- RULE EDITOR MODAL -->
      @if (editingRule(); as rDraft) {
        <div class="modal-backdrop" (click)="editingRule.set(null)">
          <div class="modal-card large" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>{{ editingRuleIsNew() ? 'Create Dynamic Routing Pipeline' : 'Edit Pipeline: ' + rDraft.name }}</h2>
              <button type="button" class="link-btn" (click)="editingRule.set(null)">Close ×</button>
            </div>

            <div class="modal-body">
              <div class="form-2col">
                <label class="field">
                  <span>Pipeline Name</span>
                  <input type="text" [(ngModel)]="rDraft.name" placeholder="e.g. Daily Panchang Morning Short" />
                </label>
                <label class="field">
                  <span>Signal Source Type</span>
                  <select [ngModel]="rDraft.sourceType" (ngModelChange)="onRuleSourceTypeChange(rDraft, $event)">
                    @for (st of sourceTypes; track st) {
                      <option [ngValue]="st">{{ sourceInfo(st).label }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Target Connected YouTube Channel</span>
                  <select [(ngModel)]="rDraft.targetChannelId">
                    <option [ngValue]="null">-- Choose Connected Channel --</option>
                    @for (ch of overview()?.connectedChannels ?? []; track ch.channelId) {
                      <option [ngValue]="ch.channelId">{{ ch.channelTitle }} ({{ ch.channelHandle || ch.channelId }})</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Drive / Calendar Topic Folder</span>
                  <select [(ngModel)]="rDraft.topicId">
                    <option [ngValue]="null">-- Any Topic --</option>
                    @for (t of overview()?.topics ?? []; track t.id) {
                      <option [ngValue]="t.id">{{ t.name }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Automation Mode</span>
                  <select [(ngModel)]="rDraft.mode">
                    @for (m of modes; track m) {
                      <option [ngValue]="m">{{ modeLabel(m) }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Video Acquisition Strategy</span>
                  <select [(ngModel)]="rDraft.videoStrategy">
                    @for (vs of strategies; track vs) {
                      <option [ngValue]="vs">{{ strategyLabel(vs) }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Visual Rendering Engine</span>
                  <select [(ngModel)]="rDraft.visualEngine">
                    @for (ve of visualEngineOptions; track ve.value) {
                      <option [ngValue]="ve.value">{{ ve.label }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Story Length Mode</span>
                  <select [ngModel]="rDraft.narrativeMode || 'Auto'" (ngModelChange)="onRuleNarrativeChange(rDraft, $event)">
                    @for (nm of narrativeModeOptions; track nm.value) {
                      <option [ngValue]="nm.value">{{ nm.label }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Target Duration (seconds, 25–{{ maxSecondsFor(rDraft.videoFormat) }}{{ rDraft.videoFormat === 'Wide' ? ', full video' : ', Short' }})</span>
                  <input type="number" min="25" [max]="maxSecondsFor(rDraft.videoFormat)" [(ngModel)]="rDraft.targetSeconds" />
                </label>

                <div class="field">
                  <span>Default Storage Images (Story / 3D Backdrops)</span>
                  <button type="button" class="btn ghost" (click)="openStoragePicker({ kind: 'rule', rule: rDraft })">
                    🖼 Pick Storage Images ({{ rDraft.attachedAssetIds?.length ?? 0 }})
                  </button>
                </div>

                <label class="field">
                  <span>Format</span>
                  <select [(ngModel)]="rDraft.videoFormat">
                    @for (fmt of formatOptions; track fmt.value) {
                      <option [value]="fmt.value">{{ fmt.label }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Subtitle Animation Preset</span>
                  <select [(ngModel)]="rDraft.subtitlePreset">
                    @for (sp of subtitlePresets; track sp.value) {
                      <option [value]="sp.value">{{ sp.label }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>Default Speaker A (2-Character Stage)</span>
                  <input type="text" [(ngModel)]="rDraft.speakerAName" placeholder="Optional default Speaker A" />
                </label>

                <label class="field">
                  <span>Default Speaker B (2-Character Stage)</span>
                  <input type="text" [(ngModel)]="rDraft.speakerBName" placeholder="Optional default Speaker B" />
                </label>

                <label class="field">
                  <span>Language</span>
                  <select [(ngModel)]="rDraft.language">
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="en">English</option>
                  </select>
                </label>

                <label class="field">
                  <span>Preferred Local Publish Time (HH:mm)</span>
                  <input type="text" [(ngModel)]="rDraft.preferredPublishTime" placeholder="07:00" />
                </label>

                <label class="field">
                  <span>Panchang Location</span>
                  <input type="text" [(ngModel)]="rDraft.location" placeholder="New Delhi, India" />
                </label>

                <label class="field">
                  <span>YouTube Privacy</span>
                  <select [(ngModel)]="rDraft.privacy">
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </label>

                <label class="field">
                  <span>Festival Advance Lead Days (0–7)</span>
                  <input type="number" min="0" max="7" [(ngModel)]="rDraft.festivalLeadDays" />
                </label>
              </div>

              <label class="toggle-inline">
                <input type="checkbox" [(ngModel)]="rDraft.enableCharacterDialogue" />
                <span>Enable animated 2-character dialogue stage on 3D Auto Videos for this pipeline</span>
              </label>

              <div class="settings-grid">
                <label class="toggle-inline">
                  <input type="checkbox" [ngModel]="postShowWatermark(rDraft)" (ngModelChange)="setPostShowWatermark(rDraft, $event)" />
                  <span>Show Bottom Watermark (uncheck for clean Panchang / Rashifal look)</span>
                </label>
                <label class="toggle-inline">
                  <input type="checkbox" [(ngModel)]="rDraft.preferFast2DAnimation" />
                  <span>Prefer Ultra-Fast 2D Motion Animation (CpuFast)</span>
                </label>
              </div>

              <div class="field-group">
                <span class="group-label">Days of Week (leave all unchecked for Daily)</span>
                <div class="chips-row">
                  @for (day of dayNames; track $index) {
                    <button type="button" class="day-chip"
                            [class.active]="rDraft.daysOfWeek.includes($index)"
                            (click)="toggleRuleDay(rDraft, $index)">
                      {{ day }}
                    </button>
                  }
                </div>
              </div>

              <div class="field-group">
                <span class="group-label">Websites Linked in Description &amp; Pinned Comment (Website Traffic Funnels)</span>
                <div class="chips-row">
                  @for (site of overview()?.websites ?? []; track site.key) {
                    <button type="button" class="day-chip"
                            [class.active]="rDraft.funnelWebsiteKeys.includes(site.key)"
                            (click)="toggleRuleWebsite(rDraft, site.key)">
                      {{ site.shortLabel || site.name }} ({{ site.key }})
                    </button>
                  }
                </div>
              </div>

              @if ((overview()?.signals?.funnelCampaigns?.length ?? 0) > 0) {
                <label class="field">
                  <span>Optional SocialPulse Campaign Slug</span>
                  <select [(ngModel)]="rDraft.socialFunnelSlug">
                    <option [ngValue]="null">-- None --</option>
                    @for (fc of overview()?.signals?.funnelCampaigns ?? []; track fc.id) {
                      <option [ngValue]="fc.slug">{{ fc.title }} (/{{ fc.slug }})</option>
                    }
                  </select>
                </label>
              }

              @if (rDraft.sourceType === 'FunnyComedy') {
                <div class="field-group" style="border: 1px solid rgba(249, 115, 22, 0.35); border-radius: 10px; padding: 12px; background: rgba(249, 115, 22, 0.06);">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                    <span class="group-label" style="margin: 0;">😂 Funnier Channel Auto-Configuration (Kept Separate From Devotional)</span>
                    <button type="button" class="btn tiny secondary" (click)="applyFunnyRuleAutoConfig(rDraft)">
                      ⚡ Auto-Configure For Comedy Channel
                    </button>
                  </div>
                  <div class="form-2col">
                    <label class="field">
                      <span>Spoken Comedy Tone / Dialect</span>
                      <select [(ngModel)]="rDraft.comedyStyle">
                        @for (ct of comedyToneOptions; track ct.value) {
                          <option [ngValue]="ct.value">{{ ct.label }}</option>
                        }
                      </select>
                    </label>
                    <label class="toggle-inline" style="align-self: end;">
                      <input type="checkbox" [(ngModel)]="rDraft.autoInsertMemes" />
                      <span>Auto-insert in-app Reaction Memes mid-video &amp; at punchline</span>
                    </label>
                  </div>
                  <label class="field" style="margin-top: 8px;">
                    <span>Optional Comedy Topic Seed / Twist (leave blank for rotating tapri/roast skits)</span>
                    <input type="text" [(ngModel)]="rDraft.customTopicPrompt" placeholder="e.g. पप्पू भैया का खड़ी भाषा जिम चैलेंज और छोले-भटूरे" />
                  </label>
                </div>
              }

              @if (rDraft.sourceType === 'CustomPrompt') {
                <label class="field">
                  <span>Custom Daily AI Theme / Topic Seed</span>
                  <input type="text" [(ngModel)]="rDraft.customTopicPrompt" placeholder="e.g. Daily Bhagavad Gita shloka & practical mindset" />
                </label>
              }

              <label class="field">
                <span>AI Prompt Template Override (optional)</span>
                <textarea rows="2" [(ngModel)]="rDraft.promptTemplateOverride" placeholder="Prepended to every generated AI video prompt"></textarea>
              </label>

              <label class="field">
                <span>Custom Description Footer Override (optional)</span>
                <textarea rows="2" [(ngModel)]="rDraft.descriptionFooterOverride" placeholder="Extra sponsors, disclaimers or channel bio links"></textarea>
              </label>

              <label class="toggle-inline">
                <input type="checkbox" [(ngModel)]="rDraft.includePinnedComment" />
                <span>Auto-prepare and pin first CTA comment with website links</span>
              </label>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn ghost" (click)="editingRule.set(null)">Cancel</button>
              <button type="button" class="btn primary" [disabled]="busy()" (click)="saveRule()">Save Pipeline</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .auto-page { max-width: 1360px; margin: 0 auto; padding: 20px 24px 64px; display: flex; flex-direction: column; gap: 18px; }
    .auto-hero {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 18px;
      padding: 22px 24px; border-radius: var(--radius-lg); border: 1px solid var(--border);
      background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
    }
    .hero-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: var(--brand-bright); font-weight: 700; margin-bottom: 6px; }
    .auto-hero h1 { margin: 0; font-size: 26px; font-weight: 800; color: var(--text); }
    .hero-sub { margin: 6px 0 0; max-width: 680px; color: var(--text-dim); font-size: 13.5px; line-height: 1.5; }
    .hero-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
    .date-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--muted); font-weight: 600; }
    .date-field input, .field input, .field select, .field textarea {
      background: var(--sunk-2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius-sm);
      padding: 8px 11px; font-size: 13px; font-family: inherit;
    }
    .signals-ribbon { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .sig-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 13px 15px; display: flex; flex-direction: column; gap: 4px; }
    .sig-head { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--brand-bright); font-weight: 700; }
    .sig-main { font-size: 14px; font-weight: 700; color: var(--text); }
    .sig-meta { font-size: 12px; color: var(--text-dim); }
    .sig-muted { font-size: 12.5px; color: var(--muted); }
    .warn-strip { padding: 9px 14px; border-radius: var(--radius-sm); background: var(--warn-dim); color: var(--c-amber, var(--warn)); font-size: 12.5px; border: 1px solid var(--warn); }
    .alert-banner { display: flex; justify-content: space-between; align-items: center; padding: 11px 14px; border-radius: var(--radius-sm); background: var(--err-dim); color: var(--c-red); border: 1px solid var(--err); font-size: 13px; }
    .onboarding-card {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;
      padding: 18px 22px; border-radius: var(--radius); border: 1px solid var(--brand); background: var(--brand-subtle);
    }
    .onboarding-card h2 { margin: 0 0 6px; font-size: 17px; }
    .onboarding-card p { margin: 0; max-width: 780px; color: var(--text-dim); font-size: 13px; line-height: 1.5; }
    .hub-tabs { display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
    .hub-tabs button {
      background: transparent; border: 1px solid transparent; color: var(--text-dim); padding: 8px 14px; border-radius: var(--radius-sm);
      cursor: pointer; font-weight: 600; font-size: 13px;
    }
    .hub-tabs button.active { background: var(--brand-subtle); border-color: var(--brand); color: var(--brand-bright); }
    .toolbar-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
    .toolbar-left, .toolbar-right { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .filter-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter-pills button, .day-chip {
      background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); border-radius: 999px;
      padding: 5px 12px; font-size: 12px; cursor: pointer; font-weight: 600;
    }
    .filter-pills button.active, .day-chip.active { background: var(--brand); border-color: var(--brand); color: #fff; }
    .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 14px; }
    .post-card, .rule-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 16px 18px; display: flex; flex-direction: column; gap: 11px;
    }
    .post-card.is-published { border-color: var(--ok); }
    .rule-card.disabled { opacity: .66; }
    .post-top, .rule-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .badges-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
    .pill { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: var(--surface-3); color: var(--text-dim); border: 1px solid var(--border); }
    .pill.source { background: var(--brand-subtle); border-color: var(--brand-dim); color: var(--brand-bright); }
    .pill.tone-ok, .pill.ok { background: var(--ok-dim); color: var(--ok); border-color: var(--ok); }
    .pill.tone-warn { background: var(--warn-dim); color: var(--warn); border-color: var(--warn); }
    .pill.tone-info, .pill.info { background: var(--brand-subtle); color: var(--brand-bright); border-color: var(--brand); }
    .pill.tone-err { background: var(--err-dim); color: var(--c-red); border-color: var(--err); }
    .pill.subtle { opacity: .85; }
    .date-tag { font-size: 11.5px; color: var(--muted); white-space: nowrap; font-weight: 600; }
    .post-title { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.35; }
    .channel-line { display: flex; flex-wrap: wrap; gap: 6px; font-size: 12.5px; color: var(--text-dim); }
    .chan-badge { color: var(--ok); font-weight: 600; }
    .chan-missing { color: var(--warn); font-weight: 600; }
    .video-box {
      padding: 10px 12px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px dashed var(--border-bright);
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;
    }
    .video-box.has-video { border-style: solid; border-color: var(--ok); background: var(--ok-dim); }
    .video-info { font-size: 12.5px; color: var(--text); flex: 1 1 200px; }
    .video-info.muted { color: var(--text-dim); }
    .video-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .preview-snippet { display: flex; flex-direction: column; gap: 8px; }
    .snip-block { background: var(--sunk-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 9px 11px; }
    .snip-label { display: flex; justify-content: space-between; align-items: center; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 700; margin-bottom: 4px; }
    .snip-block p { margin: 0; font-size: 12.5px; color: var(--text-dim); line-height: 1.45; white-space: pre-line; max-height: 92px; overflow: auto; }
    .copy-btn, .link-btn { background: transparent; border: none; color: var(--brand-bright); cursor: pointer; font-size: 11.5px; font-weight: 700; padding: 0; }
    .funnel-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .funnel-lbl { font-size: 11.5px; color: var(--muted); font-weight: 600; }
    .funnel-chip { font-size: 11.5px; padding: 3px 9px; border-radius: 6px; background: var(--surface-2); border: 1px solid var(--border); color: var(--brand-bright); text-decoration: none; }
    .err-note { font-size: 12px; color: var(--c-red); background: var(--err-dim); padding: 6px 10px; border-radius: 6px; }
    .published-bar { font-size: 12px; color: var(--ok); background: var(--ok-dim); padding: 6px 10px; border-radius: 6px; word-break: break-all; }
    .published-bar a { color: var(--ok); font-weight: 700; }
    .post-actions, .rule-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 6px; border-top: 1px solid var(--border-subtle); }
    .rules-list { display: flex; flex-direction: column; gap: 12px; }
    .rule-card h3 { margin: 8px 0 4px; font-size: 16.5px; }
    .rule-desc { margin: 0; color: var(--text-dim); font-size: 13px; }
    .rule-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; font-size: 12.5px; color: var(--text-dim); background: var(--sunk-1); padding: 10px 12px; border-radius: var(--radius-sm); }
    .rule-meta-grid .lbl { color: var(--muted); font-weight: 600; }
    .btn {
      border-radius: var(--radius-sm); padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
      border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
    }
    .btn.tiny { padding: 5px 10px; font-size: 12px; }
    .btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
    .btn.ok { background: var(--ok); border-color: var(--ok); color: #052e16; }
    .btn.ghost { background: transparent; color: var(--text-dim); }
    .btn.danger-ghost { background: transparent; border-color: transparent; color: var(--c-red); }
    .btn.danger { background: var(--c-red); border-color: var(--c-red); color: #fff; }
    .btn.danger:disabled { opacity: 0.6; }
    .btn:disabled { opacity: .48; cursor: not-allowed; }
    .settings-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .settings-panel h2 { margin: 0; font-size: 18px; }
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    .check-tile { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface-2); cursor: pointer; }
    .check-tile strong { display: block; font-size: 13.5px; margin-bottom: 3px; }
    .check-tile small { color: var(--text-dim); font-size: 12px; }
    .form-2col { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-dim); font-weight: 600; }
    .choice-stack { display: grid; gap: 8px; margin: 12px 0; }
    .removed-history { display: grid; gap: 6px; margin-top: 10px; padding: 10px 12px; border: 1px dashed var(--border); border-radius: var(--radius-sm); font-size: 12.5px; }
    .removed-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; color: var(--text-dim); }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .group-label { font-size: 12px; color: var(--text-dim); font-weight: 600; }
    .chips-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .toggle-inline { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-dim); cursor: pointer; }
    .switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
    .empty-state { text-align: center; padding: 36px 20px; border: 1px dashed var(--border-bright); border-radius: var(--radius); color: var(--text-dim); }
    .muted-note { font-size: 12.5px; color: var(--muted); margin: 0; }
    .modal-backdrop { position: fixed; inset: 0; background: var(--scrim); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1200; }
    .modal-card { width: min(720px, 100%); max-height: 90vh; background: var(--surface); border: 1px solid var(--border-bright); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-lg); }
    .modal-card.large { width: min(920px, 100%); }
    .modal-head, .modal-foot { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--border); }
    .modal-foot { border-bottom: none; border-top: 1px solid var(--border); justify-content: flex-end; gap: 10px; }
    .modal-head h2 { margin: 0; font-size: 17px; }
    .modal-body { padding: 18px 20px; overflow: auto; display: flex; flex-direction: column; gap: 13px; }
    .candidates-list { display: flex; flex-direction: column; gap: 9px; }
    .cand-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-2); }
    .cand-row.used { opacity: .65; }
    .cand-info { display: flex; flex-direction: column; gap: 3px; }
    .cand-info small { color: var(--muted); font-size: 11.5px; }
    .preview-player { width: 100%; max-height: 62vh; background: #000; border-radius: var(--radius-sm); object-fit: contain; }
    .template-banner { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
    .event-dot { width: 9px; height: 9px; border-radius: 999px; flex: 0 0 auto; }
    .banner-text { color: var(--text); flex: 1; }
    .banner-sub { color: var(--muted); font-family: monospace; font-size: 10.5px; }
    .format-strip { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .format-strip .lbl { font-size: 11.5px; color: var(--muted); font-weight: 700; }
    .dialogue-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 7px 10px; border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border-subtle); }
    .compact-select { background: var(--surface-2); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 8px; font-size: 12px; }
    .speaker-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .speaker-row input { background: var(--sunk-2); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 6px 9px; font-size: 12px; }
    .community-box { padding: 11px 13px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--border-bright); display: flex; flex-direction: column; gap: 8px; }
    .community-copy { margin: 0; font-size: 12.5px; color: var(--text); white-space: pre-line; line-height: 1.45; max-height: 120px; overflow: auto; }
    .poll-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .poll-chip { font-size: 11.5px; padding: 3px 9px; border-radius: 999px; background: var(--sunk-1); border: 1px solid var(--border); color: var(--text-dim); }
    .promo-preview-wrap { display: flex; justify-content: center; background: #090b12; border-radius: var(--radius-sm); padding: 8px; border: 1px solid var(--border); }
    .promo-card-thumb { width: min(220px, 100%); aspect-ratio: 1 / 1; border-radius: 6px; object-fit: cover; }
    .video-box-main { display: flex; flex-direction: column; gap: 6px; flex: 1 1 260px; min-width: 0; }
    .story-progress-wrap { display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; border-radius: 6px; background: var(--sunk-1); border: 1px solid var(--border); }
    .story-progress-head { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--brand-bright); gap: 8px; }
    .story-progress-track { width: 100%; height: 6px; border-radius: 999px; background: var(--surface-3); overflow: hidden; }
    .story-progress-fill { height: 100%; background: linear-gradient(90deg, var(--brand), var(--ok)); transition: width .35s ease; }
    .cast-chips-row { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
    .cast-lbl { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .library-chars-strip { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border); }
    .library-chars-strip .lbl { font-size: 11.5px; font-weight: 700; color: var(--text-dim); }
    .storage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .storage-tile {
      display: flex; flex-direction: column; text-align: left; padding: 6px; gap: 6px; cursor: pointer;
      background: var(--surface-2); border: 2px solid var(--border); border-radius: var(--radius-sm); color: var(--text);
    }
    .storage-tile.selected { border-color: var(--brand); background: var(--brand-subtle); box-shadow: 0 0 0 1px var(--brand); }
    .storage-thumb { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 4px; background: #090b12; }
    .storage-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .storage-meta strong { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .storage-meta small { font-size: 10.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .post-card.compact { gap: 9px; padding: 13px 15px; cursor: pointer; transition: border-color .15s ease, transform .15s ease; }
    .post-card.compact:hover, .post-card.compact:focus-visible { border-color: var(--brand); transform: translateY(-1px); outline: none; }
    .post-card.compact .post-title { font-size: 14.5px; }
    .post-card.compact .post-actions { cursor: default; }
    .clamp-1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .compact-video { display: flex; flex-direction: column; gap: 5px; padding: 7px 9px; border-radius: 6px; background: var(--sunk-1); border: 1px dashed var(--border-bright); font-size: 12px; color: var(--text-dim); }
    .compact-video.has-video { border-style: solid; border-color: var(--ok); color: var(--text); }
    .compact-video-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .detail-body { gap: 12px; }
    .detail-body .snip-block p { max-height: 220px; }
    .card-readiness-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
    .mini-chip { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--border); background: var(--sunk-1); color: var(--text-dim); }
    .mini-chip.ok { background: var(--ok-dim); border-color: var(--ok); color: var(--ok); }
    .mini-chip.warn { background: var(--warn-dim); border-color: var(--warn); color: var(--warn); }
    .mini-chip.info { background: var(--brand-subtle); border-color: var(--brand-dim); color: var(--brand-bright); }
    .meta-pills-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .readiness-panel {
      display: flex; flex-direction: column; gap: 11px; padding: 12px 14px;
      border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border-bright);
    }
    .readiness-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; }
    .readiness-title-wrap { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
    .readiness-head-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .readiness-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .check-pill { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--border); }
    .check-pill.ok { background: var(--ok-dim); border-color: var(--ok); color: var(--ok); }
    .check-pill.warn { background: var(--warn-dim); border-color: var(--warn); color: var(--warn); }
    .mini-chip.err, .pill.err, .pill.tone-err { background: var(--err-dim); border-color: var(--err); color: var(--c-red); }
    .verify-ribbon {
      display: flex; flex-direction: column; gap: 8px; padding: 11px 14px;
      border-radius: var(--radius); background: var(--surface); border: 1px solid var(--ok);
    }
    .verify-ribbon.has-mismatch { border-color: var(--err); background: rgba(239, 68, 68, 0.08); }
    .verify-ribbon.has-warn { border-color: var(--warn); background: rgba(245, 158, 11, 0.07); }
    .verify-ribbon-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; font-size: 13px; }
    .verify-checks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; }
    .verify-check-pill {
      display: flex; flex-direction: column; gap: 4px; padding: 8px 10px;
      border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border);
    }
    .verify-check-pill.err { border-color: var(--err); background: var(--err-dim); }
    .verify-check-pill.warn { border-color: var(--warn); background: var(--warn-dim); }
    .vcp-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; }
    .vcp-cat { font-size: 11.5px; font-weight: 800; color: var(--text); }
    .vcp-links { display: flex; flex-wrap: wrap; gap: 8px; }
    .vcp-msg { font-size: 11.5px; color: var(--text-dim); line-height: 1.4; }
    .verify-ext-link { font-size: 11.5px; font-weight: 700; color: var(--brand-bright); text-decoration: none; }
    .verify-ext-link:hover { text-decoration: underline; }
    .verify-alert-card { display: flex; flex-direction: column; gap: 7px; border: 1px solid var(--err); }
    .verify-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .verify-detail-box {
      display: flex; flex-direction: column; gap: 7px; padding: 10px 12px;
      border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--ok);
    }
    .verify-detail-box.is-mismatch { border-color: var(--err); background: var(--err-dim); }
    .verify-detail-box.is-warn { border-color: var(--warn); background: var(--warn-dim); }
    .verify-detail-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; }
    .verify-detail-title { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; }
    .verify-detail-msg { margin: 0; font-size: 12.5px; color: var(--text); line-height: 1.45; }
    .verify-issues-list { margin: 0; padding-left: 18px; font-size: 12px; color: var(--c-red); display: flex; flex-direction: column; gap: 3px; }
    .verify-links-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .thumb-studio-box {
      display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; padding: 10px 12px;
      border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border);
    }
    .thumb-preview-slot { width: 176px; flex: 0 0 auto; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; background: #090b12; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; }
    .thumb-preview-slot.portrait { width: 112px; aspect-ratio: 9 / 16; }
    .thumb-preview-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .card-thumb-row { display: flex; gap: 10px; align-items: flex-start; margin: 2px 0; }
    .card-thumb-box { width: 128px; flex: 0 0 auto; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; background: #090b12; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; }
    .card-thumb-box.portrait { width: 54px; aspect-ratio: 9 / 16; }
    .card-thumb-meta { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .thumb-empty-slot { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--muted); font-size: 11px; text-align: center; padding: 6px; }
    .thumb-empty-slot span { font-size: 20px; line-height: 1; }
    .thumb-controls-col { flex: 1 1 260px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .thumb-status-line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12.5px; }
    .thumb-actions-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .thumb-actions-row label.btn { cursor: pointer; margin: 0; }
    .thumb-actions-row label.btn.disabled { opacity: .48; pointer-events: none; }
    .frame-pick-inline { display: inline-flex; align-items: center; gap: 4px; }
    .frame-pick-inline input { width: 64px; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font-size: 12px; }
    .thumb-prompt-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--text-dim); }
    .meta-preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
    .tags-chip-list { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
    .tag-chip { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); }
    .pinned-note { margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-subtle); color: var(--text-dim); word-break: break-word; }
    .sched-input-row { display: flex; gap: 6px; align-items: center; }
    .sched-input-row input { flex: 1 1 auto; }
    .check-inline-box { padding: 8px 10px; border-radius: var(--radius-sm); background: var(--sunk-2); border: 1px solid var(--border); min-height: 38px; }
    .wiz-steps { display: flex; gap: 6px; list-style: none; margin: 0; padding: 10px 20px 0; flex-wrap: wrap; }
    .wiz-steps li { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); }
    .wiz-steps li.active { border-color: var(--brand); color: var(--brand-bright); background: var(--brand-subtle); }
    .wiz-steps li.done { color: var(--ok); border-color: var(--ok); }
    .bg-pick-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 12px 0; }
    .bg-make { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; padding: 11px 13px; border-radius: var(--radius-sm);
      background: var(--sunk-1); border: 1px solid var(--border-bright); }
    .bg-make .bg-pick-row { margin: 4px 0 0; }
    .bg-make-actions { display: inline-flex; gap: 12px; align-items: center; }
    .file-btn { cursor: pointer; }
    .file-btn.disabled { opacity: 0.6; pointer-events: none; }
    .bg-library { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; max-height: 190px; overflow-y: auto; margin-bottom: 12px; }
    .bg-thumb { padding: 0; border: 2px solid var(--border); border-radius: 8px; overflow: hidden; background: none; cursor: pointer; aspect-ratio: 1; }
    .bg-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .bg-thumb.selected { border-color: var(--brand); box-shadow: 0 0 0 2px var(--brand-subtle); }
    .scene-pics-drop { border-radius: 10px; padding: 2px; }
    .scene-pic-list { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; max-height: 420px; overflow-y: auto; }
    .scene-pic { display: flex; gap: 10px; align-items: flex-start; padding: 8px; border: 1px solid var(--border); border-radius: 10px; }
    .scene-pic-thumb { flex: 0 0 56px; aspect-ratio: 9 / 16; border-radius: 6px; overflow: hidden; border: 1px dashed var(--border);
      display: flex; align-items: center; justify-content: center; background: var(--surface-2, transparent); }
    .scene-pic-thumb.wide { flex-basis: 96px; aspect-ratio: 16 / 9; }
    .scene-pic-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .scene-pic-empty { font-weight: 700; color: var(--muted); }
    .scene-pic-body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .scene-pic-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
    .scene-file-chip { font-size: 11px; padding: 1px 6px; border-radius: 5px; background: var(--sunk-1); border: 1px solid var(--border); color: var(--text-dim); }
    .scene-match-chip { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(16, 185, 129, 0.14); border: 1px solid rgba(16, 185, 129, 0.45); color: var(--ok); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mono { font-family: ui-monospace, monospace; }
    .copy-btn.copied { border-color: var(--ok); color: var(--ok); }
    .scene-pic-prompt { color: var(--muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
    .scene-pic-actions { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: center; }
    .scene-pic-actions label.disabled { opacity: 0.5; pointer-events: none; }
    .stage-editor { position: relative; width: min(100%, 300px); aspect-ratio: 9 / 16; margin: 8px auto 12px; border-radius: 10px; overflow: hidden;
      border: 1px solid var(--border); background: #111; touch-action: none; user-select: none; }
    .stage-editor.wide { width: 100%; max-width: 560px; aspect-ratio: 16 / 9; }
    /* Same crop as the renderer: scale to cover, centred. */
    .stage-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .safe-zone { position: absolute; left: 0; right: 0; bottom: 0; height: 27%; background: linear-gradient(transparent, rgba(0, 0, 0, 0.45));
      border-top: 1px dashed rgba(255, 255, 255, 0.35); pointer-events: none; }
    .stage-editor.wide .safe-zone { height: 12%; }
    .stage-char { position: absolute; transform: translate(-50%, -100%); border: 2px dashed #f59e0b; border-radius: 40% 40% 8px 8px;
      background: rgba(245, 158, 11, 0.18); cursor: grab; display: flex; align-items: flex-start; justify-content: center; min-width: 22px; min-height: 30px; }
    .stage-char.right { border-color: #38bdf8; background: rgba(56, 189, 248, 0.18); }
    .stage-char:active { cursor: grabbing; }
    .stage-char:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    .stage-char-name { margin-top: -20px; font-size: 11px; font-weight: 700; color: #fff; background: rgba(0, 0, 0, 0.65); padding: 1px 6px; border-radius: 6px; white-space: nowrap; }
    .stage-char-feet { position: absolute; bottom: -5px; left: 50%; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5); }
    .check-row { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; cursor: pointer; }
    .check-row input { margin-top: 4px; }
    .choice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .choice-grid.two { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .choice-card {
      display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; gap: 6px; text-align: left; cursor: pointer;
      padding: 13px 14px; border-radius: var(--radius-sm); border: 2px solid var(--border); background: var(--surface-2); color: var(--text);
      /* The global button rule is nowrap; these cards hold paragraphs that must wrap inside the card. */
      white-space: normal; min-width: 0; height: 100%; box-shadow: none; font-weight: 400;
    }
    .choice-card strong { font-weight: 700; }
    .choice-card small { color: var(--text-dim); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
    .choice-card.selected { border-color: var(--brand); background: var(--brand-subtle); box-shadow: 0 0 0 1px var(--brand); }
    .choice-icon { font-size: 20px; }
    .render-progress { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border-bright); }
    .rp-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .rp-stage { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text); min-width: 0; overflow-wrap: anywhere; }
    .rp-pct { font-size: 22px; color: var(--brand-bright); font-variant-numeric: tabular-nums; }
    .rp-track { width: 100%; height: 10px; border-radius: 999px; background: var(--surface-3); overflow: hidden; }
    .rp-fill { height: 100%; background: linear-gradient(90deg, var(--brand), var(--ok)); transition: width .5s ease; }
    .rp-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--text-dim); }
    .rp-steps li { display: inline-flex; align-items: center; gap: 6px; }
    .rp-steps li.active { color: var(--brand-bright); font-weight: 600; }
    .rp-steps li.done { color: var(--ok); }
    .rp-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid currentColor; display: inline-grid; place-items: center; font-size: 9px; }
    .rp-steps li.active .rp-dot { background: currentColor; box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 25%, transparent); }
    .template-wait { display: flex; align-items: center; gap: 10px; padding: 18px; border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px dashed var(--border-bright); color: var(--text-dim); font-size: 13px; }
    .tpl-step { display: flex; flex-direction: column; gap: 6px; }
    .tpl-text { width: 100%; box-sizing: border-box; background: var(--sunk-2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius-sm); padding: 9px 11px; font-size: 12.5px; font-family: ui-monospace, monospace; line-height: 1.45; resize: vertical; }
    .signals-summary-bar {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
      padding: 8px 14px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border);
    }
    .ssb-left { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .queue-search-input {
      padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--sunk-2); color: var(--text); font-size: 12.5px; min-width: 190px;
    }
    .queue-page-size {
      padding: 6px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--surface-2); color: var(--text); font-size: 12px;
    }
    .queue-pagination {
      display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 0 4px;
    }
    .rashifal-panel { display: flex; flex-direction: column; gap: 16px; }
    .rashifal-banner {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
      padding: 16px 18px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border);
    }
    .rashifal-banner h2 { margin: 0 0 4px; font-size: 18px; }
    .rashifal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)); gap: 14px; }
    .rashi-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .rashi-card.shubh { border-color: var(--ok); }
    .rashi-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .rashi-card-head small { display: block; color: var(--muted); font-size: 11.5px; margin-top: 2px; }
    .rashi-meaning { font-size: 12px; padding: 6px 9px; border-radius: 6px; background: var(--sunk-1); color: var(--text-dim); }
    .rashi-body p { margin: 0 0 6px; font-size: 12.5px; line-height: 1.45; }
    .rashi-body p:last-child { margin-bottom: 0; }
    .rashi-en { color: var(--muted); font-style: italic; }
    .rashi-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border-subtle); }
    .advice-box {
      padding: 12px 14px; border-radius: var(--radius-sm); background: var(--sunk-1); border: 1px solid var(--border-bright);
      display: flex; flex-direction: column; gap: 10px;
    }
    .advice-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .advice-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px; }
    .advice-slot-chip {
      display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface-2); font-size: 12px;
    }
    .advice-slot-chip small { display: block; color: var(--muted); }
    .advice-promos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
    .advice-promo-item {
      padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--border); background: var(--surface);
      display: flex; flex-direction: column; gap: 3px; font-size: 12px;
    }
    .advice-promo-item small { color: var(--text-dim); }
    .tpl-thumb-box {
      margin-top: 8px; padding: 8px 10px; border-radius: var(--radius-sm);
      background: var(--sunk-1); border: 1px dashed var(--border-bright); font-size: 12px;
    }
    .tpl-thumb-box summary { cursor: pointer; font-weight: 700; color: var(--brand-bright); }
    @media (max-width: 680px) {
      .auto-page { padding: 14px 12px 48px; }
      .posts-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AutomationHubComponent implements OnInit {
  private readonly api = inject(AutomationService);
  private readonly studioApi = inject(ApiService);
  private readonly songsApi = inject(SongsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly status = inject(StatusService);
  private readonly destroyRef = inject(DestroyRef);

  /** Opens the Songs page with this post's story filled in, to write and compose a song about it. */
  openSongFor(post: AutomationPost): void {
    const seed: SongSeed = {
      title: post.title.slice(0, 120),
      theme: `${post.title}\n\n${post.script ?? ''}`.slice(0, 6000),
      language: post.language === 'en' ? 'en' : 'hi',
      postId: post.id,
    };
    void this.router.navigate(['/songs'], { state: seed });
  }

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly busyAction = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly overview = signal<AutomationOverview | null>(null);
  readonly selectedDate = signal(new Date().toISOString().slice(0, 10));
  readonly activeTab = signal<HubTab>('queue');
  readonly statusFilter = signal<QueueStatusFilter>('all');
  readonly showAllDates = signal(false);
  readonly highlightedSource = signal<AutomationSourceType | null>(null);

  readonly settingsForm = signal<AutomationWorkspaceConfig | null>(null);
  readonly editingPost = signal<AutomationPost | null>(null);
  editingTagsCsv = '';
  editingScheduledLocal = '';
  readonly thumbFrameSeconds = signal<number>(2);
  readonly thumbnailBusyId = signal<string | null>(null);

  readonly previewingPost = signal<AutomationPost | null>(null);
  readonly removalPost = signal<AutomationPost | null>(null);
  readonly removalForm = signal<AutomationYouTubeRemoval | null>(null);
  readonly pickingPost = signal<AutomationPost | null>(null);
  readonly loadingCandidates = signal(false);
  readonly videoCandidates = signal<AutomationVideoCandidate[]>([]);

  readonly editingRule = signal<AutomationRule | null>(null);
  readonly editingRuleIsNew = signal(false);

  readonly storageCatalog = signal<AutomationStorageCatalog | null>(null);
  readonly loadingStorageCatalog = signal(false);
  readonly librarySongs = signal<Song[]>([]);
  readonly selectedComedyIds = signal<string[]>([]);
  readonly compilationTitle = signal('');
  readonly comedyCompilationTargetSeconds = 180;
  readonly storagePickerTarget = signal<
    | { kind: 'post'; post: AutomationPost }
    | { kind: 'rule'; rule: AutomationRule }
    | { kind: 'thumbnail'; post: AutomationPost }
    | { kind: 'settings-thumb' | 'settings-bg' | 'template-thumb'; post?: AutomationPost }
    | null
  >(null);
  readonly storageSelectedIds = signal<string[]>([]);

  // UI Scalability (collapse by default + search + pagination)
  readonly showVerificationDetails = signal(false);
  readonly showSignalsCards = signal(false);
  readonly expandedQueueCardIds = signal<Record<string, boolean>>({});
  readonly queueSearchQuery = signal('');
  readonly queuePageSize = signal(8);
  readonly queuePage = signal(0);

  // Daily Rashifal & 2D Fixed Thumbnail Template + Peak Publish Advice
  readonly rashifalReport = signal<DailyRashifalReport | null>(null);
  readonly loadingRashifal = signal(false);
  readonly rashifalRenderVideos = signal(true);
  readonly rashifalShowWatermark = signal(false);
  readonly publishAdvice = signal<AutomationPublishAdvice | null>(null);
  readonly loadingAdvice = signal(false);
  readonly templateDateText = signal('');
  readonly templateTitleText = signal('');
  readonly templateSubtitleText = signal('');
  readonly templateBgAssetId = signal('');
  readonly templateShowWatermark = signal(false);
  readonly templateSaveDefaultBg = signal(false);

  /** The one post whose full details are open in the pop-up; looked up live so polling refreshes it. */
  readonly detailPostId = signal<string | null>(null);
  readonly detailPost = computed(() => this.findPost(this.detailPostId()));

  readonly wizard = signal<GenerateWizardState | null>(null);
  readonly wizardPost = computed(() => this.findPost(this.wizard()?.postId ?? null));
  readonly templateState = signal<{ ready: boolean; prompt?: string | null; message?: string | null } | null>(null);
  readonly templateReply = signal('');
  private templatePollTimer: ReturnType<typeof setTimeout> | null = null;

  /** Scene pictures for an Enhanced 3D template script: the server's plan (picture n = scene n) and the chosen ids. */
  readonly scenePlan = signal<AutomationScenePicturePlan | null>(null);
  readonly scenePlanLoading = signal(false);
  readonly scenePics = signal<(string | null)[]>([]);
  readonly scenePicMeta = signal<(ScenePicMeta | null)[]>([]);
  readonly copiedKey = signal<string | null>(null);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  /** Slot being uploaded or generated (-1 for a batch upload), null when idle. */
  readonly sceneBusy = signal<number | null>(null);
  private scenePlanTimer: ReturnType<typeof setTimeout> | null = null;
  readonly scenePicsFilled = computed(() => this.scenePics().filter((id) => !!id).length);

  /** When the in-flight Enhanced 3D render request started (null when none), plus a 1s clock for the elapsed label. */
  readonly renderStartedAt = signal<number | null>(null);
  readonly nowMs = signal(Date.now());
  private renderTickTimer: ReturnType<typeof setInterval> | null = null;

  /** Live progress for the wizard while its post's 3D render request runs; the server saves stage + percent on the post. */
  readonly wizardRender = computed(() => {
    const wz = this.wizard();
    if (!wz || this.busyAction() !== `anim3d:${wz.postId}`) return null;
    const post = this.wizardPost();
    // Until the first poll sees the post as GeneratingVideo, its percent is from an older render.
    const live = post?.status === 'GeneratingVideo';
    const percent = live ? Math.min(99, Math.max(1, post?.storyProgressPercent ?? 1)) : 1;
    const stage = live ? (post?.storyStageSummary || 'Rendering…') : 'Starting render…';
    const started = this.renderStartedAt();
    const secs = started ? Math.max(0, Math.floor((this.nowMs() - started) / 1000)) : 0;
    const elapsed = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const steps = RENDER_STEPS.map((s, i) => {
      const next = RENDER_STEPS[i + 1]?.from ?? 101;
      const state: 'done' | 'active' | 'pending' = percent >= next ? 'done' : percent >= s.from ? 'active' : 'pending';
      return { label: s.label, state };
    });
    return { percent, stage, elapsed, steps };
  });

  readonly wizardEngineOptions = WIZARD_ENGINE_OPTIONS;
  readonly dialoguePlaceholder =
    '[CAST]: Character Name | role | look\n[SCENE]: forest ashram | dawn | serene | IMAGE: ...\n[सूत्रधार]: ...\n[Character Name]: ...\n[Character Name]: ...';
  readonly storyPlaceholder = 'Paste the whole JSON answer here: { "title": ..., "cast": [...], "scenes": [...] }';

  readonly dayNames = DAY_NAMES;
  readonly formatOptions = FORMAT_OPTIONS;
  readonly subtitlePresets = SUBTITLE_PRESETS;
  readonly visualEngineOptions = VISUAL_ENGINE_OPTIONS;
  readonly narrativeModeOptions = NARRATIVE_MODE_OPTIONS;
  readonly comedyToneOptions: { value: ComedyToneStyle; label: string }[] = [
    { value: 'Auto', label: 'YouTube Auto (Khadi Bhasha + Tu Tadak)' },
    { value: 'GlobalSlapstick', label: '🌍 International Slapstick Loop (Zero-Dialogue 3D)' },
    { value: 'TankSeries', label: '🛡️ Cartoon Tank Series (| EP XX)' },
    { value: 'DesiKhadiSitcom', label: '🇮🇳 Desi Khadi Sitcom (MJO / HardToonz Style)' },
    { value: 'KhadiBhasha', label: 'Khadi Bhasha / Desi Tapri Dialect' },
    { value: 'TuTadak', label: 'Tu Tadak Buddy Roast Banter' },
    { value: 'RoastAndTwist', label: 'Deadpan Roast + Twist Ending' },
    { value: 'FamilyClean', label: 'Family Clean Slapstick' },
  ];
  readonly youtubeCategories: ReadonlyArray<{ id: string; name: string }> = [
    { id: '1', name: 'Film & Animation' },
    { id: '2', name: 'Autos & Vehicles' },
    { id: '10', name: 'Music' },
    { id: '15', name: 'Pets & Animals' },
    { id: '17', name: 'Sports' },
    { id: '19', name: 'Travel & Events' },
    { id: '20', name: 'Gaming' },
    { id: '22', name: 'People & Blogs' },
    { id: '23', name: 'Comedy' },
    { id: '24', name: 'Entertainment' },
    { id: '25', name: 'News & Politics' },
    { id: '26', name: 'Howto & Style' },
    { id: '27', name: 'Education' },
    { id: '28', name: 'Science & Technology' },
    { id: '29', name: 'Nonprofits & Activism' },
  ];
  readonly sourceTypes: AutomationSourceType[] = [
    'HinduPanchang',
    'DailyRashifal',
    'HinduFestival',
    'DailyKatha',
    'AajKaItihaas',
    'Pratiyogita',
    'EcosystemSpotlight',
    'CustomPrompt',
    'FunnyComedy',
  ];
  readonly modes: AutomationPostMode[] = ['PreviewOnly', 'AutoVideoAndPreview', 'FullAutopilot'];
  readonly strategies: AutomationVideoStrategy[] = [
    'AutoGenerateAnimated3DVideo',
    'PreferUnusedDriveClipThenAiRender',
    'PreferUnusedDriveClipOnly',
    'PreferFinishedRenderJob',
    'AutoGenerateStoryVideo',
    'ManualAttachOnly',
  ];

  readonly postsForSelectedDate = computed(() => {
    const ov = this.overview();
    if (!ov) return [];
    const target = this.selectedDate();
    return this.showAllDates() ? ov.posts : ov.posts.filter((p) => p.dateKey === target);
  });

  readonly filteredPosts = computed(() => {
    const base = this.postsForSelectedDate();
    const srcFilter = this.highlightedSource();
    const afterSrc = srcFilter ? base.filter((p) => p.sourceType === srcFilter) : base;
    const f = this.statusFilter();
    let byStatus = afterSrc;
    if (f === 'pending') byStatus = afterSrc.filter((p) => p.status === 'PreparedPreview' || p.status === 'Approved');
    else if (f === 'ready') byStatus = afterSrc.filter((p) => p.status === 'VideoReadyForReview');
    else if (f === 'generating') byStatus = afterSrc.filter((p) => p.status === 'GeneratingVideo' || p.status === 'Publishing');
    else if (f === 'published') byStatus = afterSrc.filter((p) => p.status === 'Published');
    else if (f === 'failed') byStatus = afterSrc.filter((p) => p.status === 'Failed' || p.status === 'Skipped');

    const q = this.queueSearchQuery().trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((p) =>
      `${p.title} ${p.sourceTitle ?? ''} ${p.targetChannelTitle ?? ''} ${p.targetChannelHandle ?? ''} ${p.sourceType}`
        .toLowerCase()
        .includes(q));
  });

  readonly totalQueuePages = computed(() =>
    Math.max(1, Math.ceil(this.filteredPosts().length / Math.max(1, this.queuePageSize())))
  );

  readonly clampedQueuePage = computed(() =>
    Math.min(this.queuePage(), Math.max(0, this.totalQueuePages() - 1))
  );

  readonly pagedPosts = computed(() => {
    const size = Math.max(1, this.queuePageSize());
    const start = this.clampedQueuePage() * size;
    return this.filteredPosts().slice(start, start + size);
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Lengths a Short can be (YouTube caps Shorts at 3 minutes). */
  private readonly shortDurationOptions: ReadonlyArray<{ value: number; label: string }> = [
    { value: 0, label: 'Auto Fit (Short <= 60s / Story <= 165s)' },
    { value: 10, label: 'Ultra-Short Comedy Loop (~10s)' },
    { value: 15, label: 'Punchy Comedy Short (~15s)' },
    { value: 30, label: 'Comedy Skit / Fast Short (~30s)' },
    { value: 55, label: 'Short Reel (~55s)' },
    { value: 90, label: 'Medium Story (~90s)' },
    { value: 145, label: 'Full Story (~2.5 min)' },
    { value: 180, label: 'Complete Katha / Story (< 3 min / 180s)' },
  ];
  /** A full 16:9 video is not a Short, so it may run the whole story: up to 60 minutes (1 hour). */
  private readonly fullVideoDurationOptions: ReadonlyArray<{ value: number; label: string }> = [
    ...this.shortDurationOptions,
    { value: 240, label: 'Long Story (~4 min)' },
    { value: 300, label: 'Detailed Katha (~5 min)' },
    { value: 420, label: 'Extended Katha (~7 min)' },
    { value: 600, label: 'Complete Episode (~10 min)' },
    { value: 780, label: 'Deep Episode (~13 min)' },
    { value: 900, label: 'Feature Episode (~15 min)' },
    { value: 1200, label: 'MJO / Katha Feature (~20 min)' },
    { value: 1800, label: 'Half-Hour Special (~30 min)' },
    { value: 2700, label: 'Extended Feature (~45 min)' },
    { value: 3600, label: '1-Hour Full Epic (~60 min)' },
  ];
  private readonly postDurationMap = new Map<string, number>();

  maxSecondsFor(format: AutomationVideoFormat | null | undefined): number {
    return format === 'Wide' ? FULL_VIDEO_MAX_SECONDS : SHORT_MAX_SECONDS;
  }

  durationOptionsFor(format: AutomationVideoFormat | null | undefined): ReadonlyArray<{ value: number; label: string }> {
    return format === 'Wide' ? this.fullVideoDurationOptions : this.shortDurationOptions;
  }

  /** The picked length, or 0 (Auto) when it is longer than the post's current format allows (e.g. switched back to Short). */
  postDurationSeconds(postId: string): number {
    const seconds = this.postDurationMap.get(postId) ?? 0;
    return seconds > this.maxSecondsFor(this.findPost(postId)?.format) ? 0 : seconds;
  }

  postDurationLabel(postId: string): string {
    const seconds = this.postDurationSeconds(postId);
    return this.fullVideoDurationOptions.find((o) => o.value === seconds)?.label ?? `${seconds}s`;
  }

  setPostDurationSeconds(postId: string, seconds: number | string): void {
    const val = Number(seconds);
    if (!Number.isFinite(val) || val <= 0) {
      this.postDurationMap.delete(postId);
    } else {
      this.postDurationMap.set(postId, val);
    }
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const qDate = params.get('date');
    const qSource = params.get('source') as AutomationSourceType | null;
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      this.selectedDate.set(qDate);
    }
    if (qSource && this.sourceTypes.includes(qSource)) {
      this.highlightedSource.set(qSource);
    }

    void this.loadOverview();
    this.pollTimer = setInterval(() => {
      const ov = this.overview();
      if (ov?.posts.some((p) => p.status === 'GeneratingVideo' || p.status === 'Publishing')) {
        void this.loadOverview(true);
      }
    }, 5_000);
    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.stopTemplatePoll();
      this.stopRenderTicker();
    });
  }

  /** Runs a blocking Enhanced 3D render request while polling the post's saved progress. */
  private async withRenderProgress(work: () => Promise<void>): Promise<void> {
    this.stopRenderTicker();
    this.renderStartedAt.set(Date.now());
    this.nowMs.set(Date.now());
    let lastPoll = Date.now();
    let polling = false;
    this.renderTickTimer = setInterval(() => {
      const now = Date.now();
      this.nowMs.set(now);
      // One poll at a time: an overview can take longer than the poll interval, and overlapping polls queue up behind
      // the browser's per-host connection limit until progress stops arriving at all.
      if (!polling && now - lastPoll >= RENDER_POLL_MS) {
        lastPoll = now;
        polling = true;
        void this.loadOverview(true).finally(() => (polling = false));
      }
    }, 1_000);
    try {
      await work();
    } finally {
      this.stopRenderTicker();
    }
  }

  private stopRenderTicker(): void {
    if (this.renderTickTimer) clearInterval(this.renderTickTimer);
    this.renderTickTimer = null;
    this.renderStartedAt.set(null);
  }

  private findPost(id: string | null): AutomationPost | null {
    if (!id) return null;
    return this.overview()?.posts.find((p) => p.id === id) ?? null;
  }

  // ---------------------------------------------------------------- details pop-up

  openPostDetail(post: AutomationPost): void {
    this.detailPostId.set(post.id);
  }

  closePostDetail(): void {
    this.detailPostId.set(null);
  }

  /** Escape closes the top-most pop-up only. */
  onEscape(): void {
    if (this.storagePickerTarget()) this.storagePickerTarget.set(null);
    else if (this.previewingPost()) this.previewingPost.set(null);
    else if (this.pickingPost()) this.pickingPost.set(null);
    else if (this.editingPost()) this.editingPost.set(null);
    else if (this.wizard()) this.closeWizard();
    else if (this.editingRule()) this.editingRule.set(null);
    else if (this.detailPostId()) this.closePostDetail();
  }

  /** The post's story paused for a listen or a look (the wizard's "Let me review each step"). */
  isAwaitingReview(post: AutomationPost): boolean {
    return post.status === 'GeneratingVideo'
      && !!post.attachedStoryRunId
      && (post.storyStageSummary ?? '').startsWith(REVIEW_SUMMARY_PREFIX);
  }

  /** "the voices", "the music" or "the finished video", from the server's summary. */
  reviewTarget(post: AutomationPost): string {
    return (post.storyStageSummary ?? '').slice(REVIEW_SUMMARY_PREFIX.length);
  }

  /** A story run that failed or was stopped can carry on from its failed step instead of starting over. */
  canRetryVideo(post: AutomationPost): boolean {
    return post.status === 'Failed'
      && !!post.attachedStoryRunId
      && post.visualEngine !== 'Procedural3D';
  }

  async retryVideo(post: AutomationPost): Promise<void> {
    await this.runAction(`ai-video:${post.id}`, async () => {
      await firstValueFrom(this.api.retryVideo(post.id));
      this.status.showNotice('Retrying from the failed step. What was already made is kept.');
      await this.loadOverview(true);
    });
  }

  isAwaitingScript(post: AutomationPost): boolean {
    return post.status === 'GeneratingVideo'
      && !!post.attachedStoryRunId
      && AWAITING_SCRIPT_SUMMARIES.has(post.storyStageSummary ?? '');
  }

  // ---------------------------------------------------------------- generate wizard

  openGenerateWizard(post: AutomationPost): void {
    const current = post.visualEngine && post.visualEngine !== 'Auto' ? post.visualEngine : 'AiRealisticStory';
    this.resetTemplate();
    this.resetBackgroundPrompt();
    this.showTemplateLibrary.set(false);
    if (this.librarySongs().length === 0) {
      void firstValueFrom(this.songsApi.list()).then((res) => this.librarySongs.set(res.songs ?? [])).catch(() => {});
    }
    const stage: AutomationStageSettings = { ...DEFAULT_STAGE, ...(post.stage ?? {}) };
    this.wizard.set({
      postId: post.id, engine: current, source: 'ai', step: 'engine', stage,
      backdrop: stage.backgroundTemplateAssetId ? 'picture' : 'default',
    });
  }

  /** Re-opens the paste step for a story run that is waiting for its script (template run, or AI fallback). */
  resumeTemplate(post: AutomationPost): void {
    const engine = post.visualEngine === 'StorageImagesStory' ? 'StorageImagesStory' : 'AiRealisticStory';
    this.resetTemplate();
    this.resetBackgroundPrompt();
    const stage: AutomationStageSettings = { ...DEFAULT_STAGE, ...(post.stage ?? {}) };
    this.wizard.set({
      postId: post.id, engine, source: 'template', step: 'template', stage,
      backdrop: stage.backgroundTemplateAssetId ? 'picture' : 'default',
    });
    this.pollTemplate();
  }

  setWizardEngine(engine: WizardEngine): void {
    this.wizard.update((w) => (w ? { ...w, engine } : w));
  }

  setWizardSource(source: 'ai' | 'template'): void {
    this.wizard.update((w) => (w ? { ...w, source } : w));
  }

  /** Steps shown for the chosen engine: Enhanced 3D adds Background and Music & voice, one decision per step. */
  wizardSteps(): { key: WizardStep; label: string }[] {
    const wz = this.wizard();
    const steps: { key: WizardStep; label: string }[] = [
      { key: 'engine', label: 'Engine' },
      { key: 'source', label: 'Script' },
    ];
    if (wz?.engine === 'Procedural3D') {
      steps.push({ key: 'background', label: 'Background' }, { key: 'audio', label: 'Music & voice' });
    } else {
      steps.push({ key: 'audio', label: 'Music' });
    }
    if (wz?.source === 'template' || wz?.step === 'template') steps.push({ key: 'template', label: 'Template & Paste' });
    return steps;
  }

  wizardStepIndex(): number {
    const step = this.wizard()?.step;
    return this.wizardSteps().findIndex((s) => s.key === step);
  }

  wizardNext(): void {
    const steps = this.wizardSteps();
    const next = steps[this.wizardStepIndex() + 1];
    if (!next || next.key === 'template') return;
    this.wizard.update((w) => (w ? { ...w, step: next.key } : w));
    if (next.key === 'background' && !this.bgPromptText()) void this.loadBackgroundPrompt();
  }

  wizardBack(): void {
    this.stopTemplatePoll();
    this.stageDrag = null;
    const prev = this.wizardSteps()[this.wizardStepIndex() - 1];
    this.wizard.update((w) => (w ? { ...w, step: prev?.key ?? 'engine' } : w));
  }

  // ---------------------------------------------------------------- Enhanced 3D stage (background, spots, music)

  readonly stageSides: readonly StageSide[] = ['left', 'right'];
  readonly showTemplateLibrary = signal(false);
  private stageDrag: { side: StageSide; box: DOMRect } | null = null;

  private updateStage(change: Partial<AutomationStageSettings>): void {
    this.wizard.update((w) => (w ? { ...w, stage: { ...w.stage, ...change } } : w));
  }

  setWizardBackdrop(backdrop: 'default' | 'picture'): void {
    this.wizard.update((w) => (w ? {
      ...w,
      backdrop,
      // The animated stage has no picture to place characters on, so its spots go back to the defaults.
      stage: backdrop === 'default'
        ? { ...w.stage, backgroundTemplateAssetId: null, leftCharacter: null, rightCharacter: null, backgroundMotion: 'Still' }
        : w.stage,
    } : w));
    if (backdrop === 'picture' && !this.bgPromptText()) void this.loadBackgroundPrompt();
  }

  setStageLocation(value: string): void {
    const v = (value ?? '').slice(0, 200);
    this.updateStage({ locationPrompt: v.trim() ? v : null });
    this.scheduleBackgroundPrompt();
  }

  // ---------------------------------------------------------------- background picture: prompt, AI generation, motion

  readonly bgPrompt = signal<AutomationBackgroundPrompt | null>(null);
  readonly bgPromptText = signal('');
  readonly bgPromptLoading = signal(false);
  /** True once the user typed in the prompt box: automatic rebuilds then leave their text alone. */
  private bgPromptEdited = false;
  private bgPromptTimer: ReturnType<typeof setTimeout> | null = null;

  readonly backdropMotions: ReadonlyArray<{ value: AutomationBackdropMotion; label: string }> = [
    { value: 'Still', label: 'Still' },
    { value: 'GentleZoom', label: 'Gentle zoom' },
    { value: 'SlowPan', label: 'Slow pan' },
  ];

  backdropMotionHint(motion: AutomationBackdropMotion | undefined): string {
    switch (motion) {
      case 'GentleZoom': return 'The camera breathes in and out a little (about 7%), so characters stay close to their spots.';
      case 'SlowPan': return 'The picture glides slowly sideways behind the characters, back and forth.';
      default: return 'The picture stays still, so characters stand exactly where you placed them.';
    }
  }

  setStageMotion(motion: AutomationBackdropMotion): void {
    this.updateStage({ backgroundMotion: motion });
  }

  promptBasisLabel(basis: string): string {
    switch (basis) {
      case 'location': return 'your location';
      case 'script': return "the script's first scene";
      case 'topic': return 'the post topic';
      default: return 'the event type';
    }
  }

  setBackgroundPromptText(value: string): void {
    this.bgPromptText.set((value ?? '').slice(0, 2000));
    this.bgPromptEdited = true;
  }

  /** Builds the picture prompt from the wizard's current choices. `force` (Rebuild) replaces text the user edited. */
  async loadBackgroundPrompt(force = false): Promise<void> {
    const wz = this.wizard();
    if (!wz || wz.backdrop !== 'picture' || (this.bgPromptEdited && !force)) return;
    this.bgPromptLoading.set(true);
    try {
      const built = await firstValueFrom(this.api.backgroundPicturePrompt(wz.postId, wz.stage));
      const still = this.wizard();
      if (!still || still.postId !== wz.postId || (this.bgPromptEdited && !force)) return;
      this.bgPrompt.set(built);
      this.bgPromptText.set(built.prompt);
      this.bgPromptEdited = false;
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Could not build the picture prompt.'));
    } finally {
      this.bgPromptLoading.set(false);
    }
  }

  private scheduleBackgroundPrompt(): void {
    if (this.bgPromptTimer) clearTimeout(this.bgPromptTimer);
    this.bgPromptTimer = setTimeout(() => {
      this.bgPromptTimer = null;
      void this.loadBackgroundPrompt();
    }, 700);
  }

  private resetBackgroundPrompt(): void {
    if (this.bgPromptTimer) clearTimeout(this.bgPromptTimer);
    this.bgPromptTimer = null;
    this.bgPrompt.set(null);
    this.bgPromptText.set('');
    this.bgPromptEdited = false;
  }

  /** Makes the background picture with the server's image engine and selects it, ready for placing characters. */
  async generateBackgroundPicture(): Promise<void> {
    const wz = this.wizard();
    const text = this.bgPromptText().trim();
    if (!wz || !text) return;
    await this.runAction('bg-generate', async () => {
      // An untouched prompt is rebuilt on the server from the same choices; only an edited one is sent.
      const made = await firstValueFrom(this.api.generateBackgroundPicture(wz.postId, wz.stage, this.bgPromptEdited ? text : null));
      if (this.wizard()?.postId !== wz.postId) return;
      this.updateStage({ backgroundTemplateAssetId: made.assetId });
      this.storageCatalog.set(null); // the new picture shows next time the library opens
      this.status.showNotice('Background picture made. Place your characters on it, or generate another.');
    });
  }

  setStageMusic(on: boolean): void {
    this.updateStage({ includeBackgroundMusic: on });
  }

  setStageSong(songId: string | null): void {
    const clean = songId && songId.trim() ? songId.trim() : null;
    this.updateStage({
      attachedSongId: clean,
      includeBackgroundMusic: clean ? true : (this.wizard()?.stage.includeBackgroundMusic ?? false),
    });
  }

  hasRenderedComedyPosts(posts: AutomationPost[]): boolean {
    return posts.filter((p) => p.sourceType === 'FunnyComedy' && !!p.attachedRenderJobId).length >= 2;
  }

  isComedySelected(postId: string): boolean {
    return this.selectedComedyIds().includes(postId);
  }

  toggleComedySelect(postId: string): void {
    const cur = this.selectedComedyIds();
    this.selectedComedyIds.set(cur.includes(postId) ? cur.filter((id) => id !== postId) : [...cur, postId]);
  }

  async compileSelectedComedy(posts: AutomationPost[]): Promise<void> {
    let ids = this.selectedComedyIds();
    if (ids.length < 2) {
      ids = posts
        .filter((p) => p.sourceType === 'FunnyComedy' && !!p.attachedRenderJobId)
        .slice(0, 6)
        .map((p) => p.id);
    }
    if (ids.length < 2) {
      this.status.showError('Select (or render) at least 2 FunnyComedy shorts to compile.');
      return;
    }
    await this.runAction('compile-comedy', async () => {
      const res = await firstValueFrom(
        this.api.compileComedy({
          postIds: ids,
          title: this.compilationTitle().trim() || null,
          maxSeconds: this.comedyCompilationTargetSeconds,
        })
      );
      this.selectedComedyIds.set([]);
      this.compilationTitle.set('');
      this.status.showNotice(`Compiled ${res.clipCount} comedy clips (${res.durationSeconds}s) into a ready-to-publish post!`);
      await this.loadOverview(true);
    });
  }

  setStageFollowScript(on: boolean): void {
    this.updateStage({ followScriptExactly: !!on });
  }

  setStageReview(on: boolean): void {
    this.updateStage({ reviewSteps: !!on });
  }

  async toggleTemplateLibrary(): Promise<void> {
    const show = !this.showTemplateLibrary();
    this.showTemplateLibrary.set(show);
    if (!show || this.storageCatalog()) return;
    try {
      this.storageCatalog.set(await firstValueFrom(this.api.getStorageMediaCatalog()));
    } catch (err: unknown) {
      this.showTemplateLibrary.set(false);
      this.status.showError(this.readErr(err, 'Could not load your Studio Storage images.'));
    }
  }

  chooseBackgroundTemplate(assetId: string): void {
    this.updateStage({ backgroundTemplateAssetId: assetId });
  }

  async uploadBackgroundTemplate(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    // Quick checks for a clear message; the server validates the real file type and size again.
    if (!TEMPLATE_TYPES.includes(file.type)) {
      this.status.showError('Pick a PNG, JPG or WebP picture.');
      return;
    }
    if (file.size > MAX_TEMPLATE_BYTES) {
      this.status.showError('That picture is larger than 25 MB.');
      return;
    }
    await this.runAction('bg-upload', async () => {
      const { projectId } = await firstValueFrom(this.api.backgroundTemplateProject());
      const asset = await firstValueFrom(this.studioApi.uploadAsset(projectId, file));
      this.updateStage({ backgroundTemplateAssetId: asset.id });
      this.storageCatalog.set(null); // the new picture shows next time the library opens
      this.status.showNotice('Background picture uploaded. Now place your characters on it.');
    });
  }

  templateImageUrl(assetId: string): string {
    return this.studioApi.assetUrl(assetId);
  }

  stageBox(format: AutomationVideoFormat | undefined) {
    return format === 'Wide' ? STAGE_DEFAULTS.wide : STAGE_DEFAULTS.vertical;
  }

  placementFor(side: StageSide, format: AutomationVideoFormat | undefined): { x: number; y: number; scale: number } {
    const stage = this.wizard()?.stage;
    const saved = side === 'left' ? stage?.leftCharacter : stage?.rightCharacter;
    if (saved) return saved;
    const d = this.stageBox(format)[side];
    return { x: d.x, y: d.y, scale: 1 };
  }

  private setPlacement(side: StageSide, p: { x: number; y: number; scale: number }): void {
    const clamped = {
      x: Math.round(Math.min(0.95, Math.max(0.05, p.x)) * 1000) / 1000,
      y: Math.round(Math.min(0.95, Math.max(0.25, p.y)) * 1000) / 1000,
      scale: Math.round(Math.min(1.8, Math.max(0.5, p.scale)) * 100) / 100,
    };
    this.updateStage(side === 'left' ? { leftCharacter: clamped } : { rightCharacter: clamped });
  }

  setPlacementScale(side: StageSide, format: AutomationVideoFormat | undefined, scale: number): void {
    this.setPlacement(side, { ...this.placementFor(side, format), scale: Number(scale) });
  }

  resetPlacements(): void {
    this.updateStage({ leftCharacter: null, rightCharacter: null });
    this.scheduleBackgroundPrompt();
  }

  startStageDrag(side: StageSide, event: PointerEvent): void {
    const marker = event.currentTarget as HTMLElement;
    const box = marker.parentElement?.getBoundingClientRect();
    if (!box) return;
    event.preventDefault();
    marker.focus();
    marker.setPointerCapture?.(event.pointerId);
    this.stageDrag = { side, box };
  }

  onStageDrag(event: PointerEvent): void {
    const drag = this.stageDrag;
    const post = this.wizardPost();
    if (!drag || !post) return;
    const x = (event.clientX - drag.box.left) / drag.box.width;
    const y = (event.clientY - drag.box.top) / drag.box.height;
    this.setPlacement(drag.side, { ...this.placementFor(drag.side, post.format), x, y });
  }

  endStageDrag(): void {
    // The prompt names the open ground where the characters stand, so it follows a finished drag.
    if (this.stageDrag) this.scheduleBackgroundPrompt();
    this.stageDrag = null;
  }

  nudgePlacement(side: StageSide, format: AutomationVideoFormat | undefined, event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.05 : 0.01;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    const move = d[event.key];
    if (!move) return;
    event.preventDefault();
    const p = this.placementFor(side, format);
    this.setPlacement(side, { ...p, x: p.x + move[0], y: p.y + move[1] });
  }

  characterName(post: AutomationPost, side: StageSide): string {
    const name = side === 'left' ? post.speakerAName : post.speakerBName;
    return name?.trim() || (side === 'left' ? 'Character A' : 'Character B');
  }

  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  /** Saves the stage draft to the post so every render path (AI, template paste, autopilot) uses it. */
  private async saveWizardStage(): Promise<boolean> {
    const wz = this.wizard();
    if (!wz) return true;
    // Story engines save the stage too: the server reads its music choice when it starts the run.
    if (wz.engine === 'Procedural3D' && wz.backdrop === 'picture' && !wz.stage.backgroundTemplateAssetId) {
      this.status.showError('Upload or pick a background picture, or go Back and choose the animated 3D stage.');
      return false;
    }
    // An AI-written script has new scenes, so pictures chosen for an earlier pasted script would land on the wrong ones.
    const stage: AutomationStageSettings = wz.source === 'ai' && wz.step !== 'template'
      ? { ...wz.stage, sceneBackgroundAssetIds: [] }
      : wz.stage;
    let ok = false;
    await this.runAction('stage-save', async () => {
      const saved = await firstValueFrom(this.api.saveStage(wz.postId, stage));
      const post = this.wizardPost();
      if (post) post.stage = saved.stage ?? stage;
      ok = true;
    });
    return ok;
  }

  closeWizard(): void {
    this.stopTemplatePoll();
    this.wizard.set(null);
    this.resetTemplate();
    this.resetBackgroundPrompt();
  }

  async startWizard(): Promise<void> {
    const wz = this.wizard();
    const post = this.wizardPost();
    if (!wz || !post) return;
    if (!(await this.saveWizardStage())) return;

    if (wz.source === 'ai') {
      // The ai path closes the wizard only when the request went through; a failure stays visible in the banner.
      if (wz.engine === 'Procedural3D') {
        await this.triggerAnimated3DVideo(post);
      } else {
        post.visualEngine = wz.engine;
        await this.triggerAiVideo(post);
      }
      if (!this.errorMessage()) this.closeWizardFor(post.id);
      return;
    }

    // A template fetched for an earlier length/engine choice must not show while the new one loads.
    this.templateState.set(null);
    if (wz.engine === 'Procedural3D') {
      this.wizard.set({ ...wz, step: 'template' });
      this.pollTemplate();
      return;
    }

    // Story engines: start a manual-writer run; its research runs first, then the template becomes available.
    post.visualEngine = wz.engine;
    await this.triggerAiVideo(post, true);
    if (this.errorMessage()) return;
    this.wizard.set({ ...wz, step: 'template' });
    this.pollTemplate();
  }

  private pollTemplate(): void {
    this.stopTemplatePoll();
    const wz = this.wizard();
    if (!wz) return;
    if (!this.templateState()) this.templateState.set({ ready: false, message: 'Preparing your template…' });

    void firstValueFrom(this.api.getScriptTemplate(wz.postId, wz.engine, this.postDurationSeconds(wz.postId))).then(
      (tpl) => {
        const still = this.wizard();
        if (!still || still.postId !== wz.postId || still.step !== 'template') return;
        this.templateState.set(tpl);
        if (!tpl.ready) this.templatePollTimer = setTimeout(() => this.pollTemplate(), TEMPLATE_POLL_MS);
      },
      (err: unknown) => {
        if (!this.wizard()) return;
        this.templateState.set({ ready: false, message: this.readErr(err, 'Could not load the template.') });
      }
    );
  }

  private stopTemplatePoll(): void {
    if (this.templatePollTimer) clearTimeout(this.templatePollTimer);
    this.templatePollTimer = null;
  }

  private resetTemplate(): void {
    this.templateState.set(null);
    this.templateReply.set('');
    if (this.scenePlanTimer) clearTimeout(this.scenePlanTimer);
    this.scenePlanTimer = null;
    this.scenePlan.set(null);
    this.scenePics.set([]);
    this.scenePicMeta.set([]);
    this.sceneBusy.set(null);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
    this.copiedKey.set(null);
  }

  // ---------------------------------------------------------------- scene pictures (template path, Enhanced 3D)

  /** Scene pictures apply to Enhanced 3D without a single background picture (that one covers the whole video). */
  showScenePictures(): boolean {
    const wz = this.wizard();
    return !!wz && wz.engine === 'Procedural3D' && wz.backdrop !== 'picture';
  }

  onTemplateReplyChange(value: string): void {
    this.templateReply.set(value ?? '');
    if (!this.showScenePictures()) return;
    if (this.scenePlanTimer) clearTimeout(this.scenePlanTimer);
    this.scenePlanTimer = setTimeout(() => {
      this.scenePlanTimer = null;
      void this.loadScenePlan();
    }, 800);
  }

  /** Asks the server which pictures the pasted script needs, in the order the video uses them. */
  async loadScenePlan(): Promise<void> {
    const wz = this.wizard();
    const reply = this.templateReply().trim();
    if (!wz || reply.length < 20) {
      this.scenePlan.set(null);
      return;
    }
    this.scenePlanLoading.set(true);
    try {
      const plan = await firstValueFrom(this.api.scenePicturePlan(wz.postId, reply, wz.stage));
      if (this.wizard()?.postId !== wz.postId) return;
      this.scenePlan.set(plan);
      // Keep pictures already chosen; the slot count follows the script.
      const current = this.scenePics();
      const currentMeta = this.scenePicMeta();
      const nextPics = plan.scenes.map((_, i) => current[i] ?? wz.stage.sceneBackgroundAssetIds?.[i] ?? null);
      this.scenePics.set(nextPics);
      this.scenePicMeta.set(plan.scenes.map((_, i) => (nextPics[i] ? currentMeta[i] ?? null : null)));
    } catch (err: unknown) {
      this.scenePlan.set(null);
      this.status.showError(this.readErr(err, 'Could not read the scenes of this script.'));
    } finally {
      this.scenePlanLoading.set(false);
    }
  }

  private setScenePic(index: number, assetId: string | null, meta: ScenePicMeta | null = null): void {
    this.scenePics.update((list) => list.map((id, i) => (i === index ? assetId : id)));
    this.scenePicMeta.update((list) => list.map((m, i) => (i === index ? meta : m)));
  }

  clearScenePic(index: number): void {
    this.setScenePic(index, null, null);
  }

  clearAllScenePics(): void {
    this.scenePics.update((list) => list.map(() => null));
    this.scenePicMeta.update((list) => list.map(() => null));
  }

  moveScenePic(index: number, delta: -1 | 1): void {
    const target = index + delta;
    this.scenePics.update((list) => {
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    this.scenePicMeta.update((list) => {
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  private checkPictureFile(file: File): string | null {
    // Quick checks for a clear message; the server validates the real file type and size again.
    if (!TEMPLATE_TYPES.includes(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      return `${file.name}: pick a PNG, JPG or WebP picture.`;
    }
    if (file.size > MAX_TEMPLATE_BYTES) return `${file.name} is larger than 25 MB.`;
    return null;
  }

  suggestedFileLabel(scene: { number: number; setting: string }, count: number): string {
    return suggestedSceneFileName(scene.number, count, scene.setting);
  }

  copyWithFlash(key: string, text: string, label: string): void {
    this.copyText(text, label);
    this.copiedKey.set(key);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => {
      this.copiedTimer = null;
      this.copiedKey.update((cur) => (cur === key ? null : cur));
    }, 1800);
  }

  copyBatchPrompts(plan: AutomationScenePicturePlan): void {
    const text = formatSceneBatchPrompt(plan, true);
    if (!text) return;
    this.copyWithFlash(
      'batch',
      text,
      `All ${plan.scenes.length} picture prompts copied (with filenames & avoid rules)! Paste into your AI image tool.`,
    );
  }

  private matchReasonLabel(reason: ScenePictureMatchReason): string {
    switch (reason) {
      case 'number': return 'by number';
      case 'setting': return 'by setting';
      default: return 'by order';
    }
  }

  private async uploadSceneSlotAsset(
    projectId: string,
    postId: string,
    index: number,
    file: File,
    meta: ScenePicMeta,
  ): Promise<boolean> {
    const asset = await firstValueFrom(this.studioApi.uploadAsset(projectId, file));
    if (this.wizard()?.postId !== postId) return false;
    this.setScenePic(index, asset.id, meta);
    return true;
  }

  /**
   * Uploads several pictures at once — via file picker or drag-and-drop — matching each file
   * by filename convention (01.png, scene-2.jpg, river_ghat.png) or browser-safe order (1, 2 … 10).
   */
  async uploadScenePictures(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    await this.uploadSceneFileBatch(files);
  }

  async uploadSceneFileBatch(files: File[]): Promise<void> {
    const wz = this.wizard();
    const plan = this.scenePlan();
    if (!wz || !plan || files.length === 0) return;

    const bad = files.map((f) => this.checkPictureFile(f)).find((m) => m);
    if (bad) {
      this.status.showError(bad);
      return;
    }

    const matchPlan = planScenePictureUploads(files, plan.scenes, this.scenePics());
    if (matchPlan.assignments.length === 0) {
      const detail = matchPlan.skipped[0]?.reason ? ` (${matchPlan.skipped[0].reason})` : '';
      this.status.showError(`${summarizeSceneUploadPlan([], matchPlan.skipped.length)}${detail}`);
      return;
    }

    this.sceneBusy.set(-1);
    const completed: typeof matchPlan.assignments = [];
    try {
      const { projectId } = await firstValueFrom(this.api.backgroundTemplateProject());
      for (const item of matchPlan.assignments) {
        this.sceneBusy.set(item.sceneIndex);
        const ok = await this.uploadSceneSlotAsset(projectId, wz.postId, item.sceneIndex, item.file, {
          name: item.file.name,
          reasonText: this.matchReasonLabel(item.reason),
        });
        if (!ok) return;
        completed.push(item);
      }
      this.storageCatalog.set(null);
      const summary = summarizeSceneUploadPlan(completed, matchPlan.skipped.length);
      const skipNote = matchPlan.skipped[0]?.reason ? ` First skipped: ${matchPlan.skipped[0].file.name} (${matchPlan.skipped[0].reason})` : '';
      this.status.showNotice(`${summary}${skipNote}`);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'A picture could not be uploaded. The ones before it are kept.'));
    } finally {
      this.sceneBusy.set(null);
    }
  }

  async uploadScenePicture(index: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    await this.uploadSceneFile(index, file);
  }

  async uploadSceneFile(index: number, file: File | undefined): Promise<void> {
    const wz = this.wizard();
    if (!wz || !file) return;
    const bad = this.checkPictureFile(file);
    if (bad) {
      this.status.showError(bad);
      return;
    }
    this.sceneBusy.set(index);
    try {
      const { projectId } = await firstValueFrom(this.api.backgroundTemplateProject());
      await this.uploadSceneSlotAsset(projectId, wz.postId, index, file, {
        name: file.name,
        reasonText: 'picked for scene',
      });
      this.storageCatalog.set(null);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Could not upload that picture.'));
    } finally {
      this.sceneBusy.set(null);
    }
  }

  /** Makes one scene's picture with the app's image engine from that scene's prompt. */
  async generateScenePicture(index: number): Promise<boolean> {
    const wz = this.wizard();
    const scene = this.scenePlan()?.scenes[index];
    if (!wz || !scene) return false;
    this.sceneBusy.set(index);
    try {
      const made = await firstValueFrom(this.api.generateBackgroundPicture(wz.postId, wz.stage, scene.prompt));
      if (this.wizard()?.postId !== wz.postId) return false;
      this.setScenePic(index, made.assetId, { name: `AI (${made.provider})`, reasonText: 'generated' });
      this.storageCatalog.set(null);
      return true;
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, `Could not make the picture for scene ${index + 1}.`));
      return false;
    } finally {
      this.sceneBusy.set(null);
    }
  }

  /** Fills every empty slot with the image engine, one after another; stops at the first failure. */
  async generateMissingScenePictures(): Promise<void> {
    const empty = this.scenePics().map((id, i) => (id ? -1 : i)).filter((i) => i >= 0);
    for (const i of empty) {
      if (!(await this.generateScenePicture(i))) return;
    }
    if (empty.length > 0) this.status.showNotice('Every scene has a picture now.');
  }

  sceneLabel(setting: string, time: string): string {
    const words = (v: string) => v.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    const place = setting === 'Auto' ? 'scene' : words(setting);
    return time === 'Auto' ? place : `${place}, ${words(time)}`;
  }

  async submitTemplateReply(): Promise<void> {
    const wz = this.wizard();
    const post = this.wizardPost();
    const reply = this.templateReply().trim();
    if (!wz || !post || !reply) return;
    const is3d = wz.engine === 'Procedural3D';

    // Scene pictures are all-or-nothing: a gap would move every later scene onto the wrong picture.
    if (is3d && this.showScenePictures()) {
      const pics = this.scenePics();
      const filled = pics.filter((id) => !!id).length;
      if (filled > 0 && filled < pics.length) {
        this.status.showError(`Add a picture for every scene (${filled} of ${pics.length} done), or clear them to use the 3D stage.`);
        return;
      }
      const ids = filled > 0 ? (pics as string[]) : [];
      const same = JSON.stringify(ids) === JSON.stringify(wz.stage.sceneBackgroundAssetIds ?? []);
      if (!same) {
        this.wizard.set({ ...wz, stage: { ...wz.stage, sceneBackgroundAssetIds: ids } });
        if (!(await this.saveWizardStage())) return;
      }
    }

    const submit = async () => {
      await firstValueFrom(this.api.submitScriptTemplate(post.id, wz.engine, reply, {
        targetSeconds: this.postDurationSeconds(post.id),
        subtitlePreset: is3d ? (post.subtitlePreset || 'event-glow') : null,
      }));
      this.status.showNotice(
        is3d
          ? 'Script accepted. Enhanced 3D video rendered.'
          : 'Script accepted. Scenes, voices, music and the render are now being made.'
      );
      this.closeWizardFor(post.id);
      await this.loadOverview(true);
    };
    await this.runAction(is3d ? `anim3d:${post.id}` : `ai-video:${post.id}`, is3d ? () => this.withRenderProgress(submit) : submit);
  }

  /** Closes the wizard only if it is still showing this post (the user may have hidden it and opened another). */
  private closeWizardFor(postId: string): void {
    if (this.wizard()?.postId === postId) this.closeWizard();
  }

  sourceInfo(type: AutomationSourceType) {
    return SOURCE_LABELS[type] ?? SOURCE_LABELS.CustomPrompt;
  }

  postEventColor(post: AutomationPost): string {
    return post.eventColorHex || this.sourceInfo(post.sourceType).color;
  }

  postHeaderBanner(post: AutomationPost): string {
    return post.headerBannerText || this.sourceInfo(post.sourceType).banner;
  }

  communityCardUrl(postId: string): string {
    return this.api.communityCardUrl(postId);
  }

  youtubeCommunityUrl(post: AutomationPost): string {
    if (post.targetChannelId && post.targetChannelId.startsWith('UC')) {
      return `https://www.youtube.com/channel/${encodeURIComponent(post.targetChannelId)}/community`;
    }
    return 'https://studio.youtube.com/';
  }

  copyCommunityPost(post: AutomationPost): void {
    const body = (post.communityPostText || post.script || '').trim();
    const poll = (post.communityPollOptions?.length ?? 0) > 0
      ? `\n\nPoll Options:\n${post.communityPollOptions!.map((o, idx) => `${idx + 1}. ${o}`).join('\n')}`
      : '';
    this.copyText(`${body}${poll}`, 'Community post text + poll copied!');
  }

  statusInfo(st: AutomationPostStatus) {
    return STATUS_BADGE[st] ?? STATUS_BADGE.PreparedPreview;
  }

  modeLabel(mode: AutomationPostMode): string {
    return MODE_LABELS[mode] ?? mode;
  }

  strategyLabel(strategy: AutomationVideoStrategy): string {
    return STRATEGY_LABELS[strategy] ?? strategy;
  }

  visualEngineLabel(engine?: AutomationVisualEngine | null): string {
    return VISUAL_ENGINE_OPTIONS.find((v) => v.value === (engine ?? 'Auto'))?.label ?? 'Auto Engine';
  }

  narrativeModeLabel(mode?: AutomationNarrativeMode | null): string {
    return NARRATIVE_MODE_OPTIONS.find((m) => m.value === (mode ?? 'Auto'))?.shortLabel ?? 'Auto Length';
  }

  storageAssetThumbnailUrl(assetId: string): string {
    return this.api.storageAssetThumbnailUrl(assetId);
  }

  async onDateChange(date: string): Promise<void> {
    if (!date) return;
    this.selectedDate.set(date);
    await this.loadOverview();
  }

  async loadOverview(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    try {
      const ov = await firstValueFrom(this.api.getOverview(this.selectedDate(), silent));
      this.overview.set(ov);
      this.settingsForm.set({ ...ov.settings });
      this.errorMessage.set(null);
    } catch (err: unknown) {
      if (!silent) {
        this.errorMessage.set(this.readErr(err, 'Failed to load Auto-Post workspace overview.'));
      }
    } finally {
      if (!silent) this.loading.set(false);
    }
  }

  async bootstrapStarterRules(): Promise<void> {
    await this.runAction('bootstrap', async () => {
      const created = await firstValueFrom(this.api.bootstrapRules());
      this.status.showNotice(`Configured ${created.length} dynamic ecosystem pipeline(s).`);
      await this.loadOverview(true);
      this.activeTab.set('rules');
    });
  }

  async prepareToday(forceRegenerate: boolean): Promise<void> {
    await this.runAction('prepare', async () => {
      const res = await firstValueFrom(
        this.api.prepare({ dateKey: this.selectedDate(), forceRegenerate })
      );
      this.status.showNotice(
        `Prepared ${res.postsCreated} new / ${res.postsUpdated} updated post(s) for ${res.dateKey}.`
      );
      await this.loadOverview(true);
      this.activeTab.set('queue');
    });
  }

  async rebalanceStarterChannels(): Promise<void> {
    await this.runAction('rebalance', async () => {
      const res = await firstValueFrom(this.api.rebalanceChannels());
      this.status.showNotice(
        `Routed ${res.rulesUpdated} rule(s), ${res.topicsUpdated} topic(s) & ${res.postsUpdated} draft(s) cleanly across Bhakti and World/History channels.`
      );
      await this.loadOverview(true);
    });
  }

  async runPreparePublishPack(): Promise<void> {
    await this.runAction('prepare-pack', async () => {
      const res = await firstValueFrom(
        this.api.preparePublishPack({
          dateKey: this.selectedDate(),
          rebalanceChannels: true,
          generateVideos: true,
          syncToCalendar: true,
          scheduleOnYouTubePrivate: true,
        })
      );
      const warnSuffix = res.warnings.length > 0 ? ` (${res.warnings.length} note(s): ${res.warnings[0]})` : '';
      this.status.showNotice(
        `Prepared ${res.preparedCount} item(s) for ${res.dateKey}: ${res.videosReadyCount} video(s), ${res.thumbnailsReadyCount} thumb(s), ${res.calendarSyncedCount} synced to Calendar, ${res.scheduledPrivateOnYouTubeCount} uploaded Private/Scheduled${warnSuffix}.`
      );
      await this.loadOverview(true);
      this.activeTab.set('queue');
    });
  }

  async runSingleRule(rule: AutomationRule): Promise<void> {
    await this.runAction('prepare-rule', async () => {
      const res = await firstValueFrom(
        this.api.prepare({ dateKey: this.selectedDate(), ruleId: rule.id, forceRegenerate: true })
      );
      this.status.showNotice(`Prepared ${res.posts.length} item(s) from "${rule.name}".`);
      await this.loadOverview(true);
      this.activeTab.set('queue');
    });
  }

  openPostEditor(post: AutomationPost): void {
    this.editingPost.set({
      ...post,
      tags: [...post.tags],
      trackedFunnelUrls: [...post.trackedFunnelUrls],
      attachedAssetIds: [...(post.attachedAssetIds ?? [])],
    });
    this.editingTagsCsv = post.tags.join(', ');
    this.editingScheduledLocal = this.toLocalDateTimeInput(post.scheduledAtUtc);

    const cfg = this.overview()?.settings;
    this.templateDateText.set(post.dateKey);
    this.templateTitleText.set(post.title);
    this.templateSubtitleText.set(post.headerBannerText || post.sourceTitle || '');
    this.templateBgAssetId.set((post.attachedAssetIds?.[0]) || cfg?.panchangDefaultBackgroundAssetId || '');
    const defaultWm = post.sourceType === 'HinduPanchang' || post.sourceType === 'DailyRashifal'
      ? (cfg?.panchangShowWatermark ?? false)
      : true;
    this.templateShowWatermark.set(post.showWatermark ?? defaultWm);
    this.templateSaveDefaultBg.set(false);
    this.publishAdvice.set(null);
  }

  async savePostEdits(): Promise<void> {
    const draft = this.editingPost();
    if (!draft) return;
    draft.tags = this.editingTagsCsv
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const parsedSchedule = this.fromLocalDateTimeInput(this.editingScheduledLocal);
    if (parsedSchedule) {
      draft.scheduledAtUtc = parsedSchedule;
    }
    await this.runAction('save-post', async () => {
      await firstValueFrom(this.api.updatePost(draft.id, draft));
      this.editingPost.set(null);
      this.status.showNotice('Post metadata, schedule and YouTube details updated.');
      await this.loadOverview(true);
    });
  }

  hasPostThumbnail(post: AutomationPost): boolean {
    return !!(post.thumbnailStorageKey || (post.thumbnailFrameAtSeconds !== null && post.thumbnailFrameAtSeconds !== undefined));
  }

  postThumbnailUrl(post: AutomationPost): string {
    return this.api.postThumbnailUrl(post.id, post.updatedAtUtc);
  }

  categoryName(categoryId?: string | null): string {
    return this.youtubeCategories.find((c) => c.id === categoryId)?.name ?? (categoryId || 'People & Blogs');
  }

  youtubeTagsLength(tags: readonly string[]): number {
    let total = 0;
    let count = 0;
    for (const raw of tags) {
      const t = raw.trim();
      if (!t) continue;
      total += t.length + (t.includes(' ') ? 2 : 0);
      count++;
    }
    return total + Math.max(0, count - 1);
  }

  editingTagsCount(): number {
    return this.editingTagsCsv.split(',').map((t) => t.trim()).filter((t) => t.length > 0).length;
  }

  editingTagsLength(): number {
    return this.youtubeTagsLength(this.editingTagsCsv.split(','));
  }

  formatLocalSchedule(utcIso?: string | null): string {
    if (!utcIso) return 'Not scheduled';
    const d = new Date(utcIso);
    if (Number.isNaN(d.getTime())) return utcIso;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatDisplay(format?: string | null): string {
    if (format === 'Wide') return '📺 Video (16:9)';
    if (format === 'Vertical') return '📱 Short (9:16)';
    if (format === 'CommunityPost') return '🖼 Community (1:1)';
    return format || 'Video';
  }

  isFutureUtc(utcIso?: string | null): boolean {
    if (!utcIso) return false;
    const d = new Date(utcIso);
    return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
  }

  privacyDisplay(post: AutomationPost): string {
    if (post.status === 'Published' && this.isFutureUtc(post.scheduledAtUtc)) {
      return '🔒 Private (Releases at Scheduled Time)';
    }
    const p = (post.privacy ?? '').toLowerCase();
    if (p === 'private') return '🔒 Private';
    if (p === 'unlisted') return '🔗 Unlisted';
    return `👁 ${post.privacy || 'Public'}`;
  }

  toLocalDateTimeInput(utcIso?: string | null): string {
    if (!utcIso) return '';
    const d = new Date(utcIso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  fromLocalDateTimeInput(localStr: string): string | null {
    const trimmed = (localStr ?? '').trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  postReadiness(post: AutomationPost): {
    items: ReadonlyArray<{ label: string; ok: boolean; hint?: string }>;
    readyCount: number;
    totalCount: number;
    missingCount: number;
    summary: string;
  } {
    const titleOk = !!post.title?.trim() && post.title.trim().length <= 100;
    const descOk = (post.description?.trim().length ?? 0) >= 30;
    const tagsLen = this.youtubeTagsLength(post.tags ?? []);
    const tagsOk = (post.tags?.length ?? 0) >= 3 && tagsLen <= 500;
    const catOk = !!post.categoryId?.trim();
    const channelOk = !!post.targetChannelId?.trim();
    const schedOk = !!post.scheduledAtUtc;
    const videoOk = !!(post.attachedRenderJobId || post.attachedHandoffId);
    const thumbOk = this.hasPostThumbnail(post);

    const items = [
      { label: 'Title', ok: titleOk, hint: titleOk ? 'Title within 100 chars' : 'Title required (<= 100 chars)' },
      { label: 'Description', ok: descOk, hint: descOk ? 'SEO description ready' : 'Add a detailed description (30+ chars)' },
      { label: 'Tags', ok: tagsOk, hint: tagsOk ? `${post.tags.length} tags` : 'Add at least 3 tags (<= 500 chars total)' },
      { label: 'Category', ok: catOk, hint: catOk ? this.categoryName(post.categoryId) : 'Pick a YouTube category' },
      { label: 'Channel', ok: channelOk, hint: channelOk ? (post.targetChannelTitle || 'Channel assigned') : 'Assign a target channel' },
      { label: 'Schedule', ok: schedOk, hint: schedOk ? this.formatLocalSchedule(post.scheduledAtUtc) : 'Pick scheduled upload time' },
      { label: 'Video', ok: videoOk, hint: videoOk ? (post.attachedVideoSourceLabel || 'Video attached') : 'Generate or attach video' },
      { label: 'Thumbnail', ok: thumbOk, hint: thumbOk ? (post.thumbnailSource || 'Thumbnail set') : 'Upload or AI-generate a thumbnail' },
    ];
    const readyCount = items.filter((i) => i.ok).length;
    const missing = items.filter((i) => !i.ok).map((i) => i.label);
    return {
      items,
      readyCount,
      totalCount: items.length,
      missingCount: missing.length,
      summary: missing.length === 0 ? 'All details ready' : `Missing: ${missing.join(', ')}`,
    };
  }

  private syncUpdatedPostState(updated: AutomationPost, refreshFullEditor = false): void {
    const editing = this.editingPost();
    if (editing && editing.id === updated.id) {
      if (refreshFullEditor) {
        this.editingPost.set({
          ...updated,
          tags: [...updated.tags],
          trackedFunnelUrls: [...updated.trackedFunnelUrls],
          attachedAssetIds: [...(updated.attachedAssetIds ?? [])],
        });
        this.editingTagsCsv = updated.tags.join(', ');
        this.editingScheduledLocal = this.toLocalDateTimeInput(updated.scheduledAtUtc);
      } else {
        this.editingPost.set({
          ...editing,
          thumbnailStorageKey: updated.thumbnailStorageKey,
          thumbnailFrameAtSeconds: updated.thumbnailFrameAtSeconds,
          thumbnailSource: updated.thumbnailSource,
          aiThumbnailPrompt: updated.aiThumbnailPrompt,
          updatedAtUtc: updated.updatedAtUtc,
        });
      }
    }
    this.overview.update((ov) =>
      ov
        ? { ...ov, posts: ov.posts.map((p) => (p.id === updated.id ? updated : p)) }
        : ov
    );
  }

  async onPostThumbnailFile(post: AutomationPost, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!/^image\/(jpeg|png)$/i.test(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
      this.status.showError('A thumbnail must be a JPG or PNG picture.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.status.showError('Thumbnail upload must be 2 MB or smaller.');
      return;
    }

    let dataUrl: string;
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read file')));
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
    } catch {
      this.status.showError('That thumbnail picture could not be read.');
      return;
    }

    this.thumbnailBusyId.set(post.id);
    try {
      const updated = await firstValueFrom(this.api.setPostThumbnail(post.id, { imageBase64: dataUrl }));
      this.syncUpdatedPostState(updated);
      this.status.showNotice(`Thumbnail uploaded for "${updated.title}".`);
      await this.loadOverview(true);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Thumbnail upload failed.'));
    } finally {
      this.thumbnailBusyId.set(null);
    }
  }

  async generateAiPostThumbnail(post: AutomationPost, promptOverride?: string | null): Promise<void> {
    this.thumbnailBusyId.set(`ai:${post.id}`);
    try {
      const updated = await firstValueFrom(this.api.generateAiThumbnail(post.id, promptOverride ?? post.aiThumbnailPrompt));
      this.syncUpdatedPostState(updated);
      this.status.showNotice(`Generated AI thumbnail for "${updated.title}".`);
      await this.loadOverview(true);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'AI thumbnail generation failed.'));
    } finally {
      this.thumbnailBusyId.set(null);
    }
  }

  async setFrameThumbnail(post: AutomationPost): Promise<void> {
    const secs = Math.max(0, Number(this.thumbFrameSeconds() || 0));
    this.thumbnailBusyId.set(post.id);
    try {
      const updated = await firstValueFrom(this.api.setPostThumbnail(post.id, { frameAtSeconds: secs }));
      this.syncUpdatedPostState(updated);
      this.status.showNotice(`Thumbnail set to video frame at ${secs}s.`);
      await this.loadOverview(true);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Could not pick video frame for thumbnail.'));
    } finally {
      this.thumbnailBusyId.set(null);
    }
  }

  async clearPostThumbnail(post: AutomationPost): Promise<void> {
    this.thumbnailBusyId.set(post.id);
    try {
      const updated = await firstValueFrom(this.api.deletePostThumbnail(post.id));
      this.syncUpdatedPostState(updated);
      this.status.showNotice('Custom thumbnail cleared.');
      await this.loadOverview(true);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Could not remove thumbnail.'));
    } finally {
      this.thumbnailBusyId.set(null);
    }
  }

  async autoFillPostDetails(post: AutomationPost): Promise<void> {
    await this.runAction(`autofill:${post.id}`, async () => {
      const updated = await firstValueFrom(this.api.autoFillDetails(post.id));
      this.syncUpdatedPostState(updated, true);
      this.status.showNotice(`Auto-filled missing metadata, tags & thumbnail check for "${updated.title}".`);
      await this.loadOverview(true);
    });
  }

  async verifyPostFacts(post: AutomationPost): Promise<void> {
    const hadPublishedVideo = !!post.publishedVideoId;
    await this.runAction(`verify:${post.id}`, async () => {
      const updated = await firstValueFrom(this.api.verifyPost(post.id));
      this.syncUpdatedPostState(updated, true);
      if (hadPublishedVideo && !updated.publishedVideoId && updated.status !== 'Published') {
        this.status.showNotice('Detected video was deleted on YouTube — upload & schedule buttons re-enabled!');
      } else if (updated.verificationStatus === 'Mismatch') {
        this.status.showError(updated.verificationSummary || 'Date/fact mismatch detected.');
      } else {
        this.status.showNotice(updated.verificationSummary || `Facts verified for "${updated.title}".`);
      }
      await this.loadOverview(true);
    });
  }

  async reverifyAndFixPost(post: AutomationPost): Promise<void> {
    await this.runAction(`fix:${post.id}`, async () => {
      const updated = await firstValueFrom(this.api.reverifyAndFixPost(post.id));
      this.syncUpdatedPostState(updated, true);
      this.status.showNotice(`Refreshed "${updated.title}" with live verified facts for ${updated.dateKey}.`);
      await this.loadOverview(true);
    });
  }

  googleVerifyUrl(query: string): string {
    return `https://www.google.com/search?q=${encodeURIComponent(query || '')}`;
  }

  postGoogleVerifyUrl(post: AutomationPost): string {
    const label = post.sourceTitle || post.title;
    if (post.sourceType === 'HinduFestival' && post.sourceItemKey) {
      const m = /^festival:(\d{4}-\d{2}-\d{2}):/.exec(post.sourceItemKey);
      if (m) return this.googleVerifyUrl(`${label} ${m[1]} DrikPanchang`);
    }
    return this.googleVerifyUrl(`${label} ${post.dateKey}`);
  }

  async openVideoPicker(post: AutomationPost): Promise<void> {
    this.pickingPost.set(post);
    this.loadingCandidates.set(true);
    this.videoCandidates.set([]);
    try {
      const list = await firstValueFrom(this.api.getVideoCandidates(post.id));
      this.videoCandidates.set(list);
    } catch (err: unknown) {
      this.errorMessage.set(this.readErr(err, 'Could not load video candidates.'));
    } finally {
      this.loadingCandidates.set(false);
    }
  }

  async selectVideoCandidate(cand: AutomationVideoCandidate): Promise<void> {
    const post = this.pickingPost();
    if (!post) return;
    await this.runAction('attach', async () => {
      await firstValueFrom(
        this.api.attachVideo(post.id, cand.kind === 'drive' ? { handoffId: cand.id } : { renderJobId: cand.id })
      );
      this.pickingPost.set(null);
      this.status.showNotice(`Attached "${cand.title}" to post.`);
      await this.loadOverview(true);
    });
  }

  async triggerAiVideo(post: AutomationPost, useTemplateScript = false): Promise<void> {
    const chosenDuration = this.postDurationSeconds(post.id);
    const engine = post.visualEngine ?? 'Auto';
    await this.runAction(`ai-video:${post.id}`, async () => {
      const updated = await firstValueFrom(
        this.api.generateVideo(post.id, {
          visualEngine: engine,
          narrativeMode: post.narrativeMode ?? 'Auto',
          targetSeconds: chosenDuration > 0 ? chosenDuration : (post.targetSeconds ?? null),
          attachedAssetIds: post.attachedAssetIds ?? [],
          useTemplateScript,
        })
      );
      if (useTemplateScript) {
        this.status.showNotice('Template story started. Researching the topic, then your template will be ready to copy.');
      } else if (engine === 'Procedural3D') {
        this.status.showNotice(`Rendered Enhanced 3D video: ${updated.attachedVideoSourceLabel ?? 'Ready to review'}.`);
      } else {
        this.status.showNotice('Started multi-scene Story Agent render (cast + voice + visuals + BGM). Live progress will update automatically.');
      }
      await this.loadOverview(true);
    });
  }

  async triggerAnimated3DVideo(post: AutomationPost): Promise<void> {
    const chosenDuration = this.postDurationSeconds(post.id);
    await this.runAction(`anim3d:${post.id}`, () => this.withRenderProgress(async () => {
      const updated = await firstValueFrom(
        this.api.generateAnimatedVideo(post.id, {
          format: post.format === 'CommunityPost' ? 'Vertical' : post.format,
          durationSeconds: chosenDuration > 0 ? chosenDuration : undefined,
          enableCharacterDialogue: post.enableCharacterDialogue ?? true,
          subtitlePreset: (post.subtitlePreset as SubtitleMotionPreset | undefined) || 'event-glow',
          speakerAName: post.speakerAName ?? null,
          speakerBName: post.speakerBName ?? null,
          narrativeMode: post.narrativeMode ?? 'Auto',
          attachedAssetIds: post.attachedAssetIds ?? [],
        })
      );
      this.status.showNotice(`Generated enhanced 3D animated MP4: ${updated.attachedVideoSourceLabel ?? 'Ready to review'}.`);
      await this.loadOverview(true);
    }));
  }

  async changePostNarrativeMode(post: AutomationPost, mode: AutomationNarrativeMode): Promise<void> {
    if ((post.narrativeMode ?? 'Auto') === mode) return;
    post.narrativeMode = mode;
    if (mode === 'FullStory') {
      post.targetSeconds = 165;
      this.setPostDurationSeconds(post.id, 180);
    } else if (mode === 'ShortReel') {
      post.targetSeconds = 55;
      this.setPostDurationSeconds(post.id, 55);
    } else {
      post.targetSeconds = null;
      this.setPostDurationSeconds(post.id, 0);
    }
    await this.savePostAnimationPrefs(post);
  }

  isSingleStoragePicker(
    target:
      | { kind: 'post'; post: AutomationPost }
      | { kind: 'rule'; rule: AutomationRule }
      | { kind: 'thumbnail'; post: AutomationPost }
      | { kind: 'settings-thumb' | 'settings-bg' | 'template-thumb'; post?: AutomationPost }
      | null
  ): boolean {
    return !!target && (
      target.kind === 'thumbnail'
      || target.kind === 'settings-thumb'
      || target.kind === 'settings-bg'
      || target.kind === 'template-thumb'
    );
  }

  async openStoragePicker(
    target:
      | { kind: 'post'; post: AutomationPost }
      | { kind: 'rule'; rule: AutomationRule }
      | { kind: 'thumbnail'; post: AutomationPost }
      | { kind: 'settings-thumb' | 'settings-bg' | 'template-thumb'; post?: AutomationPost }
  ): Promise<void> {
    const current =
      target.kind === 'post'
        ? (target.post.attachedAssetIds ?? [])
        : target.kind === 'rule'
          ? (target.rule.attachedAssetIds ?? [])
          : target.kind === 'template-thumb' && this.templateBgAssetId()
            ? [this.templateBgAssetId()]
            : target.kind === 'settings-bg' && this.settingsForm()?.panchangDefaultBackgroundAssetId
              ? [this.settingsForm()!.panchangDefaultBackgroundAssetId!]
              : target.kind === 'settings-thumb' && this.settingsForm()?.panchangDefaultThumbnailAssetId
                ? [this.settingsForm()!.panchangDefaultThumbnailAssetId!]
                : [];
    this.storageSelectedIds.set([...current]);
    this.storagePickerTarget.set(target);
    if (this.storageCatalog()) return;
    this.loadingStorageCatalog.set(true);
    try {
      const cat = await firstValueFrom(this.api.getStorageMediaCatalog());
      this.storageCatalog.set(cat);
    } catch (err: unknown) {
      this.errorMessage.set(this.readErr(err, 'Could not load Studio Storage image library.'));
    } finally {
      this.loadingStorageCatalog.set(false);
    }
  }

  isStorageAssetSelected(assetId: string): boolean {
    return this.storageSelectedIds().includes(assetId);
  }

  toggleStorageAsset(assetId: string): void {
    if (this.isSingleStoragePicker(this.storagePickerTarget())) {
      this.storageSelectedIds.set([assetId]);
      return;
    }
    const cur = this.storageSelectedIds();
    if (cur.includes(assetId)) {
      this.storageSelectedIds.set(cur.filter((id) => id !== assetId));
    } else {
      this.storageSelectedIds.set([...cur, assetId]);
    }
  }

  async applyStoragePicker(): Promise<void> {
    const target = this.storagePickerTarget();
    if (!target) return;
    const picked = [...this.storageSelectedIds()];
    this.storagePickerTarget.set(null);

    if (target.kind === 'settings-bg') {
      const assetId = picked[0] ?? null;
      this.settingsForm.update((f) => (f ? { ...f, panchangDefaultBackgroundAssetId: assetId } : f));
      this.status.showNotice('Default Panchang / Rashifal background selected (remember to click Save Global Settings).');
      return;
    }

    if (target.kind === 'settings-thumb') {
      const assetId = picked[0] ?? null;
      this.settingsForm.update((f) => (f ? { ...f, panchangDefaultThumbnailAssetId: assetId } : f));
      this.status.showNotice('Default Panchang / Rashifal fixed thumbnail selected (remember to click Save Global Settings).');
      return;
    }

    if (target.kind === 'template-thumb') {
      this.templateBgAssetId.set(picked[0] ?? '');
      this.status.showNotice('Background image selected for Fixed 2D Template.');
      return;
    }

    if (target.kind === 'thumbnail') {
      const assetId = picked[0];
      if (!assetId) return;
      this.thumbnailBusyId.set(target.post.id);
      try {
        const updated = await firstValueFrom(this.api.setPostThumbnail(target.post.id, { storageAssetId: assetId }));
        this.syncUpdatedPostState(updated);
        this.status.showNotice(`Thumbnail set from Studio Storage for "${updated.title}".`);
        await this.loadOverview(true);
      } catch (err: unknown) {
        this.status.showError(this.readErr(err, 'Could not apply storage image as thumbnail.'));
      } finally {
        this.thumbnailBusyId.set(null);
      }
      return;
    }

    if (target.kind === 'rule') {
      target.rule.attachedAssetIds = picked;
      if (picked.length > 0 && (!target.rule.visualEngine || target.rule.visualEngine === 'Auto')) {
        target.rule.visualEngine = 'StorageImagesStory';
      }
      return;
    }

    if (target.kind !== 'post') return;

    target.post.attachedAssetIds = picked;
    if (picked.length > 0 && (!target.post.visualEngine || target.post.visualEngine === 'Auto')) {
      target.post.visualEngine = 'StorageImagesStory';
    }
    await this.savePostAnimationPrefs(target.post);
  }

  async changePostFormat(post: AutomationPost, format: AutomationVideoFormat): Promise<void> {
    if (post.format === format) return;
    await this.runAction(`fmt:${post.id}`, async () => {
      await firstValueFrom(this.api.updatePost(post.id, { ...post, format }));
      this.status.showNotice(`Switched "${post.title}" format to ${format}.`);
      await this.loadOverview(true);
    });
  }

  async savePostAnimationPrefs(post: AutomationPost): Promise<void> {
    await this.runAction(`prefs:${post.id}`, async () => {
      await firstValueFrom(this.api.updatePost(post.id, { ...post }));
      await this.loadOverview(true);
    });
  }

  async generateCommunityCard(post: AutomationPost): Promise<void> {
    await this.runAction(`card:${post.id}`, async () => {
      await firstValueFrom(this.api.generateCommunityCard(post.id));
      this.status.showNotice('Generated 1080×1080 event-themed PNG promo card!');
      await this.loadOverview(true);
    });
  }

  async markCommunityPosted(post: AutomationPost): Promise<void> {
    await this.runAction(`mark-community:${post.id}`, async () => {
      await firstValueFrom(this.api.markCommunityPosted(post.id));
      this.status.showNotice('Marked Community Post as published.');
      await this.loadOverview(true);
    });
  }

  async syncToPanchangHub(post: AutomationPost): Promise<void> {
    await this.runAction(`sync:${post.id}`, async () => {
      try {
        await firstValueFrom(this.api.syncToPanchang(post.id));
        this.status.showNotice(`Published "${post.title}" to the Panchang Videos Hub.`);
      } finally {
        await this.loadOverview(true);
      }
    });
  }

  async removeFromPanchangHub(post: AutomationPost): Promise<void> {
    if (!window.confirm(`Take "${post.title}" off the Panchang Videos Hub? It stays on YouTube.`)) return;
    await this.runAction(`unsync:${post.id}`, async () => {
      try {
        await firstValueFrom(this.api.removeFromPanchang(post.id));
        this.status.showNotice(`Removed "${post.title}" from the Panchang Videos Hub.`);
      } finally {
        await this.loadOverview(true);
      }
    });
  }

  openVideoPreview(post: AutomationPost): void {
    this.previewingPost.set(post);
  }

  previewVideoUrl(jobId: string): string {
    return this.studioApi.previewUrl(jobId);
  }

  downloadVideoUrl(jobId: string): string {
    return this.studioApi.downloadUrl(jobId);
  }

  async publishNow(post: AutomationPost): Promise<void> {
    await this.runAction('publish', async () => {
      await firstValueFrom(this.api.publishPost(post.id, { publishNow: true }));
      this.status.showNotice(`Uploading "${post.title}" to YouTube!`);
      await this.loadOverview(true);
    });
  }

  async uploadPrivateAtPeak(post: AutomationPost): Promise<void> {
    await this.runAction(`peak:${post.id}`, async () => {
      const filled = await firstValueFrom(this.api.autoFillDetails(post.id));
      let targetUtc = filled.scheduledAtUtc ?? null;
      if (!targetUtc || new Date(targetUtc).getTime() <= Date.now() + 20 * 60_000) {
        const adv = await firstValueFrom(
          this.api.getPublishAdvice(filled.sourceType, filled.format, filled.targetChannelId, null, filled.dateKey)
        );
        targetUtc = adv.recommendedAtUtc || adv.slots[0]?.atUtc || targetUtc;
      }
      await firstValueFrom(
        this.api.publishPost(post.id, {
          publishNow: false,
          scheduledAtUtc: targetUtc,
          scheduleOnYouTube: true,
        })
      );
      this.status.showNotice(`Uploaded "${filled.title}" Private -> scheduled on YouTube for peak time!`);
      await this.loadOverview(true);
    });
  }

  async scheduleForRuleTime(post: AutomationPost): Promise<void> {
    await this.runAction('schedule', async () => {
      await firstValueFrom(
        this.api.publishPost(post.id, { publishNow: false, scheduledAtUtc: post.scheduledAtUtc ?? null })
      );
      this.status.showNotice('Approved and scheduled on the automation queue.');
      await this.loadOverview(true);
    });
  }

  openYouTubeRemoval(post: AutomationPost): void {
    this.removalPost.set(post);
    this.removalForm.set({ deleteOnYouTube: true, targetChannelId: null, republishNow: false });
  }

  closeYouTubeRemoval(): void {
    this.removalPost.set(null);
    this.removalForm.set(null);
  }

  patchRemoval(patch: Partial<AutomationYouTubeRemoval>): void {
    const current = this.removalForm();
    if (current) this.removalForm.set({ ...current, ...patch });
  }

  removalActionLabel(form: AutomationYouTubeRemoval): string {
    const first = form.deleteOnYouTube ? 'Delete on YouTube' : 'Mark as removed';
    if (!form.republishNow) return form.targetChannelId ? `${first} & move card` : first;
    return form.targetChannelId ? `${first} & publish to new channel` : `${first} & publish again`;
  }

  async confirmYouTubeRemoval(): Promise<void> {
    const post = this.removalPost();
    const form = this.removalForm();
    if (!post || !form) return;
    if (form.deleteOnYouTube) {
      const ok = window.confirm(
        `Permanently delete ${post.publishedVideoUrl ?? 'this video'} from YouTube?\n\nViews, likes and comments on it are lost. This cannot be undone.`
      );
      if (!ok) return;
    }

    await this.runAction('yt-removal', async () => {
      const updated = await firstValueFrom(this.api.removeFromYouTube(post.id, form));
      this.closeYouTubeRemoval();
      const target = updated.targetChannelTitle ?? 'the channel';
      this.status.showNotice(
        updated.status === 'Publishing'
          ? `Removed from YouTube. Uploading again to ${target}…`
          : `Removed from YouTube. The card is ready to publish${form.targetChannelId ? ` to ${target}` : ''}.`
      );
      await this.loadOverview(true);
    });
  }

  async removePost(post: AutomationPost): Promise<void> {
    if (post.status === 'Published') {
      const refUrl = post.publishedVideoUrl ? ` (${post.publishedVideoUrl})` : '';
      const confirmed = window.confirm(
        `Remove this Auto Post card${refUrl} from AnimStudio?\n\nThis only removes the card here; the video stays on YouTube. To delete the video on YouTube or publish it to another channel, use "Remove / Move" instead.`
      );
      if (!confirmed) return;
    }

    await this.runAction('delete-post', async () => {
      await firstValueFrom(this.api.deletePost(post.id));
      this.status.showNotice('Prepared post removed.');
      await this.loadOverview(true);
    });
  }

  openNewRuleModal(): void {
    const ov = this.overview();
    const firstChannel = ov?.connectedChannels[0];
    this.editingRuleIsNew.set(true);
    this.editingRule.set({
      id: '',
      name: 'New Daily Pipeline',
      description: '',
      enabled: true,
      sourceType: 'HinduPanchang',
      mode: 'PreviewOnly',
      videoStrategy: 'PreferUnusedDriveClipThenAiRender',
      videoFormat: 'Vertical',
      targetChannelId: firstChannel?.channelId ?? null,
      targetChannelHandle: firstChannel?.channelHandle ?? null,
      targetChannelTitle: firstChannel?.channelTitle ?? null,
      topicId: null,
      language: 'hi',
      targetSeconds: 55,
      location: ov?.settings.defaultLocation ?? 'New Delhi, India',
      preferredPublishTime: '07:00',
      timeZoneId: ov?.settings.defaultTimeZone ?? 'Asia/Kolkata',
      daysOfWeek: [],
      festivalLeadDays: 1,
      funnelWebsiteKeys: ov?.websites.slice(0, 2).map((w) => w.key) ?? [],
      socialFunnelSlug: null,
      privacy: 'public',
      categoryId: '22',
      madeForKids: false,
      includePinnedComment: true,
      subtitlePreset: 'event-glow',
      enableCharacterDialogue: true,
      speakerAName: null,
      speakerBName: null,
      visualEngine: 'Auto',
      narrativeMode: 'Auto',
      attachedAssetIds: [],
      comedyStyle: 'Auto',
      autoInsertMemes: true,
      sortOrder: (ov?.rules.length ?? 0) + 1,
    });
  }

  openEditRuleModal(rule: AutomationRule): void {
    this.editingRuleIsNew.set(false);
    this.editingRule.set({
      ...rule,
      daysOfWeek: [...rule.daysOfWeek],
      funnelWebsiteKeys: [...rule.funnelWebsiteKeys],
      visualEngine: rule.visualEngine ?? 'Auto',
      narrativeMode: rule.narrativeMode ?? 'Auto',
      comedyStyle: rule.comedyStyle ?? 'Auto',
      autoInsertMemes: rule.autoInsertMemes ?? true,
      attachedAssetIds: [...(rule.attachedAssetIds ?? [])],
    });
  }

  comedyToneLabel(style?: ComedyToneStyle | null): string {
    return this.comedyToneOptions.find((x) => x.value === (style ?? 'Auto'))?.label ?? 'YouTube Auto';
  }

  onRuleSourceTypeChange(rule: AutomationRule, nextType: AutomationSourceType): void {
    rule.sourceType = nextType;
    if (nextType === 'FunnyComedy' && this.editingRuleIsNew()) {
      this.applyFunnyRuleAutoConfig(rule);
    }
  }

  applyFunnyRuleAutoConfig(rule: AutomationRule): void {
    const comedyHints = ['keshav-anim-ff', 'ploptoonz', 'gigglebot', 'kaleshadda', 'gappatoonz', 'funny', 'comedy', 'meme', 'roast', 'hasya', 'tapri'];
    const intlHints = ['keshav-anim-ff', 'ploptoonz', 'gigglebot', 'zanyloop', 'global', 'tank'];
    const devHints = ['panchang', 'bhakti', 'devotional', 'shiv', 'krishna', 'ram', 'aarti', 'katha', 'rashifal'];
    const isDevotional = (s?: string | null) => {
      const lower = (s ?? '').toLowerCase();
      return !!lower && devHints.some((h) => lower.includes(h));
    };
    const isComedyHint = (s?: string | null) => {
      const lower = (s ?? '').toLowerCase();
      return !!lower && !isDevotional(lower) && comedyHints.some((h) => lower.includes(h));
    };
    const channels = this.overview()?.connectedChannels ?? [];
    const comedyChannel =
      channels.find((c) => isComedyHint(c.channelHandle) || isComedyHint(c.channelTitle))
      ?? channels.find((c) => !isDevotional(c.channelHandle) && !isDevotional(c.channelTitle));
    if (comedyChannel) {
      rule.targetChannelId = comedyChannel.channelId;
      rule.targetChannelHandle = comedyChannel.channelHandle ?? null;
      rule.targetChannelTitle = comedyChannel.channelTitle;
    }
    const handleLower = `${rule.targetChannelHandle ?? ''} ${rule.targetChannelTitle ?? ''}`.toLowerCase();
    const isIntl = intlHints.some((h) => handleLower.includes(h));
    if (!rule.name.trim() || rule.name === 'New Daily Pipeline') {
      rule.name = isIntl ? 'Global 3D Slapstick Shorts' : 'Funny 3D Desi Comedy Shorts';
    }
    rule.language = isIntl ? 'en' : 'hi';
    rule.categoryId = '23';
    rule.narrativeMode = 'ShortReel';
    rule.targetSeconds = 25;
    rule.enableCharacterDialogue = true;
    rule.speakerAName = rule.speakerAName?.trim() || (isIntl ? 'Woody Buddy' : 'पप्पू भैया');
    rule.speakerBName = rule.speakerBName?.trim() || (isIntl ? 'Cuppy Mascot' : 'बबलू यार');
    rule.subtitlePreset = 'karaoke-pulse';
    rule.comedyStyle = rule.comedyStyle && rule.comedyStyle !== 'Auto'
      ? rule.comedyStyle
      : (isIntl ? 'GlobalSlapstick' : 'DesiKhadiSitcom');
    rule.autoInsertMemes = true;
    this.status.showNotice(
      isIntl
        ? 'Applied International Zero-Dialogue 3D Slapstick config (Global Shorts + Auto Memes).'
        : 'Applied Desi Khadi Sitcom auto-config (Tu-Tadak + Auto Memes).',
    );
  }

  onRuleNarrativeChange(rule: AutomationRule, mode: AutomationNarrativeMode): void {
    rule.narrativeMode = mode;
    if (mode === 'FullStory' && (!rule.targetSeconds || rule.targetSeconds < 95)) {
      rule.targetSeconds = 165;
    } else if (mode === 'ShortReel' && (!rule.targetSeconds || rule.targetSeconds > 60)) {
      rule.targetSeconds = 55;
    }
  }

  toggleRuleDay(rule: AutomationRule, dayIdx: number): void {
    const i = rule.daysOfWeek.indexOf(dayIdx);
    if (i >= 0) rule.daysOfWeek.splice(i, 1);
    else rule.daysOfWeek.push(dayIdx);
  }

  toggleRuleWebsite(rule: AutomationRule, siteKey: string): void {
    const i = rule.funnelWebsiteKeys.indexOf(siteKey);
    if (i >= 0) rule.funnelWebsiteKeys.splice(i, 1);
    else rule.funnelWebsiteKeys.push(siteKey);
  }

  async saveRule(): Promise<void> {
    const draft = this.editingRule();
    if (!draft) return;
    draft.targetSeconds = Math.min(this.maxSecondsFor(draft.videoFormat), Math.max(25, Number(draft.targetSeconds || 55)));
    await this.runAction('save-rule', async () => {
      if (this.editingRuleIsNew()) {
        await firstValueFrom(this.api.createRule(draft));
        this.status.showNotice(`Created pipeline "${draft.name}".`);
      } else {
        await firstValueFrom(this.api.updateRule(draft.id, draft));
        this.status.showNotice(`Updated pipeline "${draft.name}".`);
      }
      this.editingRule.set(null);
      await this.loadOverview(true);
    });
  }

  async toggleRuleEnabled(rule: AutomationRule): Promise<void> {
    await this.runAction('toggle-rule', async () => {
      await firstValueFrom(this.api.updateRule(rule.id, { ...rule, enabled: !rule.enabled }));
      await this.loadOverview(true);
    });
  }

  async deleteRule(rule: AutomationRule): Promise<void> {
    await this.runAction('delete-rule', async () => {
      await firstValueFrom(this.api.deleteRule(rule.id));
      this.status.showNotice(`Deleted pipeline "${rule.name}".`);
      await this.loadOverview(true);
    });
  }

  async saveGlobalSettings(): Promise<void> {
    const form = this.settingsForm();
    if (!form) return;
    await this.runAction('save-settings', async () => {
      await firstValueFrom(this.api.saveSettings(form));
      this.status.showNotice('Global Autopilot & Ecosystem API settings saved.');
      await this.loadOverview(true);
    });
  }

  copyText(text: string, label: string): void {
    void navigator.clipboard?.writeText(text);
    this.status.showNotice(label);
  }

  postShowWatermark(item: { showWatermark?: boolean | null; sourceType: AutomationSourceType }): boolean {
    if (item.showWatermark !== null && item.showWatermark !== undefined) {
      return item.showWatermark;
    }
    const cfg = this.overview()?.settings;
    if (item.sourceType === 'HinduPanchang' || item.sourceType === 'DailyRashifal') {
      return cfg?.panchangShowWatermark ?? false;
    }
    return true;
  }

  setPostShowWatermark(item: { showWatermark?: boolean | null }, value: boolean): void {
    item.showWatermark = value;
  }

  isQueueCardExpanded(postId: string): boolean {
    return !!this.expandedQueueCardIds()[postId];
  }

  toggleQueueCardExpanded(postId: string): void {
    this.expandedQueueCardIds.update((cur) => ({ ...cur, [postId]: !cur[postId] }));
  }

  expandAllQueueCards(): void {
    const next = { ...this.expandedQueueCardIds() };
    for (const p of this.pagedPosts()) {
      next[p.id] = true;
    }
    this.expandedQueueCardIds.set(next);
  }

  collapseAllQueueCards(): void {
    this.expandedQueueCardIds.set({});
  }

  setQueueSearchQuery(q: string): void {
    this.queueSearchQuery.set(q);
    this.queuePage.set(0);
  }

  setQueuePageSize(size: number): void {
    this.queuePageSize.set(Math.max(4, size || 8));
    this.queuePage.set(0);
  }

  prevQueuePage(): void {
    this.queuePage.set(Math.max(0, this.clampedQueuePage() - 1));
  }

  nextQueuePage(): void {
    this.queuePage.set(Math.min(Math.max(0, this.totalQueuePages() - 1), this.clampedQueuePage() + 1));
  }

  async loadRashifal(): Promise<void> {
    this.loadingRashifal.set(true);
    try {
      const report = await firstValueFrom(
        this.api.getDailyRashifal(this.selectedDate(), this.overview()?.settings.defaultLocation),
      );
      this.rashifalReport.set(report);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Could not load Daily Rashifal report.'));
    } finally {
      this.loadingRashifal.set(false);
    }
  }

  async generateRashifalShorts(rashiKeys?: string[]): Promise<void> {
    const actionKey = rashiKeys && rashiKeys.length === 1 ? `rashifal:${rashiKeys[0]}` : 'rashifal-all';
    await this.runAction(actionKey, async () => {
      const cfg = this.overview()?.settings;
      const res = await firstValueFrom(
        this.api.generateRashifalShorts({
          dateKey: this.selectedDate(),
          location: cfg?.defaultLocation,
          language: 'hi',
          rashiKeys: rashiKeys ?? null,
          renderVideosNow: this.rashifalRenderVideos(),
          showWatermark: this.rashifalShowWatermark(),
          backgroundAssetId: cfg?.panchangDefaultBackgroundAssetId ?? null,
          autoSchedulePeakSlots: true,
        }),
      );
      this.status.showNotice(
        `Prepared ${res.posts.length} Rashifal Short(s) (${res.renderedCount} fast 2D video(s) attached).`,
      );
      await this.loadOverview(true);
      this.highlightedSource.set('DailyRashifal');
      this.activeTab.set('queue');
      this.queuePage.set(0);
    });
  }

  async loadPublishAdvice(
    sourceType: AutomationSourceType,
    format: AutomationVideoFormat,
    channelId?: string | null,
    dateKey?: string | null,
  ): Promise<void> {
    this.loadingAdvice.set(true);
    try {
      const targetDate = dateKey ?? this.editingPost()?.dateKey ?? this.selectedDate();
      const adv = await firstValueFrom(this.api.getPublishAdvice(sourceType, format, channelId, null, targetDate));
      this.publishAdvice.set(adv);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Could not compute peak publish slots.'));
    } finally {
      this.loadingAdvice.set(false);
    }
  }

  useSuggestedSlot(atUtc: string): void {
    const draft = this.editingPost();
    if (!draft) return;
    draft.scheduledAtUtc = atUtc;
    this.editingScheduledLocal = this.toLocalDateTimeInput(atUtc);
  }

  async schedulePostOnYouTube(post: AutomationPost, atUtc?: string | null): Promise<void> {
    const targetUtc = atUtc ?? this.fromLocalDateTimeInput(this.editingScheduledLocal) ?? post.scheduledAtUtc ?? null;
    await this.runAction(`yt-schedule:${post.id}`, async () => {
      await firstValueFrom(
        this.api.publishPost(post.id, {
          publishNow: false,
          scheduledAtUtc: targetUtc,
          scheduleOnYouTube: true,
        }),
      );
      this.status.showNotice('Uploaded to YouTube (Private -> Auto-Public at scheduled peak time)!');
      this.editingPost.set(null);
      await this.loadOverview(true);
    });
  }

  async applyFixedTemplateThumbnail(post: AutomationPost): Promise<void> {
    this.thumbnailBusyId.set(`tpl:${post.id}`);
    try {
      const updated = await firstValueFrom(
        this.api.renderTemplateThumbnail(post.id, {
          dateText: this.templateDateText(),
          titleText: this.templateTitleText(),
          subtitleText: this.templateSubtitleText(),
          backgroundAssetId: this.templateBgAssetId() || null,
          showWatermark: this.templateShowWatermark(),
          saveAsDefaultBackground: this.templateSaveDefaultBg(),
        }),
      );
      this.syncUpdatedPostState(updated, true);
      this.status.showNotice(`Rendered instant Fixed 2D Template thumbnail for "${updated.title}".`);
      await this.loadOverview(true);
    } catch (err: unknown) {
      this.status.showError(this.readErr(err, 'Fixed 2D template thumbnail generation failed.'));
    } finally {
      this.thumbnailBusyId.set(null);
    }
  }

  private async runAction(actionName: string, work: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.busyAction.set(actionName);
    this.errorMessage.set(null);
    this.status.clearError();
    try {
      await work();
    } catch (err: unknown) {
      const msg = this.readErr(err, 'Action failed.');
      this.errorMessage.set(msg);
      this.status.showError(msg);
    } finally {
      this.busy.set(false);
      this.busyAction.set(null);
    }
  }

  private readErr(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object' && err && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    return fallback;
  }
}
