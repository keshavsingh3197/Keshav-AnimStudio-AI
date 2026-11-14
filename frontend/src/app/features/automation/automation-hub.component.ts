import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AutomationOverview,
  AutomationPost,
  AutomationPostMode,
  AutomationPostStatus,
  AutomationRule,
  AutomationService,
  AutomationSourceType,
  AutomationVideoCandidate,
  AutomationVideoFormat,
  AutomationVideoStrategy,
  AutomationWorkspaceConfig,
} from '../../core/services/automation.service';
import { StatusService } from '../../core/services/status.service';

type HubTab = 'queue' | 'rules' | 'settings';
type QueueStatusFilter = 'all' | 'pending' | 'ready' | 'generating' | 'published' | 'failed';

const SOURCE_LABELS: Record<AutomationSourceType, { label: string; icon: string; badge: string }> = {
  HinduPanchang: { label: 'Hindu Panchang', icon: 'ॐ', badge: 'Hindu / Spiritual' },
  HinduFestival: { label: 'Hindu Festival / Vrat', icon: '🪔', badge: 'Festival Alert' },
  DailyKatha: { label: 'Daily Vedic Katha', icon: '📿', badge: 'Sacred Story' },
  AajKaItihaas: { label: 'Aaj Ka Itihaas', icon: '🌍', badge: 'World / History' },
  Pratiyogita: { label: 'Pratiyogita Spotlight', icon: '🏆', badge: 'Contests & GK' },
  EcosystemSpotlight: { label: 'Ecosystem Promo', icon: '🚀', badge: 'Website Traffic' },
  CustomPrompt: { label: 'Custom AI Prompt', icon: '✨', badge: 'Custom Pipeline' },
};

const MODE_LABELS: Record<AutomationPostMode, string> = {
  PreviewOnly: 'Preview List Only (Manual Video/Post)',
  AutoVideoAndPreview: 'Auto-Attach / AI Video -> Wait Approval',
  FullAutopilot: 'Full Autopilot (Prepare -> Video -> YouTube)',
};

const STRATEGY_LABELS: Record<AutomationVideoStrategy, string> = {
  PreferUnusedDriveClipThenAiRender: 'Unused Drive Clip -> Else AI Story Render',
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

@Component({
  selector: 'app-automation-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            @if (busyAction() === 'prepare') { Preparing… } @else { Prepare Daily List }
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
        <!-- Live Signals Ribbon -->
        <section class="signals-ribbon" aria-label="Live ecosystem signals">
          <div class="sig-card">
            <div class="sig-head">ॐ Panchang ({{ ov.signals.location }})</div>
            @if (ov.signals.panchang; as p) {
              <div class="sig-main">{{ p.tithi }} • {{ p.nakshatra }}</div>
              <div class="sig-meta">Abhijit: {{ p.abhijitMuhurat }} | Rahu: {{ p.rahuKaal }}</div>
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
              @if (highlightedSource()) {
                <button type="button" class="btn tiny ghost" (click)="highlightedSource.set(null)">
                  Clear source filter: {{ sourceInfo(highlightedSource()!).label }} ×
                </button>
              }
              <label class="toggle-inline">
                <input type="checkbox" [ngModel]="showAllDates()" (ngModelChange)="showAllDates.set($event)" />
                <span>Show all prepared dates ({{ ov.posts.length }})</span>
              </label>
            </div>
          </div>

          @if (filteredPosts().length === 0) {
            <div class="empty-state">
              <h3>No prepared posts match this filter yet</h3>
              <p>
                Click <strong>Prepare Daily List</strong> above to generate titles, scripts, AI video prompts &amp; tracked website links for {{ selectedDate() }}.
              </p>
            </div>
          } @else {
            <div class="posts-grid">
              @for (post of filteredPosts(); track post.id) {
                <article class="post-card" [class.is-published]="post.status === 'Published'">
                  <div class="post-top">
                    <div class="badges-wrap">
                      <span class="pill source">{{ sourceInfo(post.sourceType).icon }} {{ sourceInfo(post.sourceType).label }}</span>
                      <span class="pill" [ngClass]="'tone-' + statusInfo(post.status).tone">
                        {{ statusInfo(post.status).label }}
                      </span>
                      <span class="pill subtle">{{ post.format }} • {{ post.language.toUpperCase() }}</span>
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

                  <!-- Video attachment box -->
                  <div class="video-box" [class.has-video]="!!(post.attachedHandoffId || post.attachedRenderJobId)">
                    @if (post.attachedVideoSourceLabel) {
                      <div class="video-info">
                        <strong>Video:</strong> {{ post.attachedVideoSourceLabel }}
                      </div>
                    } @else {
                      <div class="video-info muted">
                        No video attached yet — attach a Drive clip, attach a Studio Render, or generate one with AI.
                      </div>
                    }
                    @if (post.status !== 'Published' && post.status !== 'Publishing') {
                      <div class="video-actions">
                        <button type="button" class="btn tiny" [disabled]="busy()" (click)="openVideoPicker(post)">
                          Pick Drive / Render
                        </button>
                        <button type="button" class="btn tiny ghost" [disabled]="busy()" (click)="triggerAiVideo(post)">
                          Generate AI Video
                        </button>
                      </div>
                    }
                  </div>

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

                  @if (post.publishedVideoUrl) {
                    <div class="published-bar">
                      Published: <a [href]="post.publishedVideoUrl" target="_blank" rel="noopener">{{ post.publishedVideoUrl }}</a>
                    </div>
                  }

                  <div class="post-actions">
                    <button type="button" class="btn ghost" (click)="openPostEditor(post)">
                      Preview &amp; Edit Full Details
                    </button>
                    @if (post.status !== 'Published' && post.status !== 'Publishing') {
                      <button type="button" class="btn ok"
                              [disabled]="busy() || (!post.attachedHandoffId && !post.attachedRenderJobId) || !post.targetChannelId"
                              [title]="!post.targetChannelId ? 'Assign a YouTube channel in Edit or Rule first' : (!(post.attachedHandoffId || post.attachedRenderJobId) ? 'Attach or generate a video first' : 'Publish to YouTube now')"
                              (click)="publishNow(post)">
                        Publish to YouTube
                      </button>
                      @if (post.scheduledAtUtc) {
                        <button type="button" class="btn ghost"
                                [disabled]="busy() || (!post.attachedHandoffId && !post.attachedRenderJobId) || !post.targetChannelId"
                                (click)="scheduleForRuleTime(post)">
                          Approve Schedule
                        </button>
                      }
                      <button type="button" class="btn danger-ghost" [disabled]="busy()" (click)="removePost(post)">
                        Delete
                      </button>
                    }
                  </div>
                </article>
              }
            </div>
          }
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

            <div class="form-footer">
              <button type="submit" class="btn primary" [disabled]="busy()">Save Global Settings</button>
            </div>
          </form>
        }
      } @else if (loading()) {
        <div class="empty-state">Loading live Panchang, History, Funnel &amp; Pipeline overview…</div>
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
                  <span>YouTube Title (max 100 chars)</span>
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
                <label class="field">
                  <span>Visibility</span>
                  <select [(ngModel)]="draft.privacy">
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </label>
                <label class="field">
                  <span>Tags (comma separated)</span>
                  <input type="text" [(ngModel)]="editingTagsCsv" />
                </label>
              </div>

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
              <button type="button" class="btn ghost" (click)="editingPost.set(null)">Cancel</button>
              <button type="button" class="btn primary" [disabled]="busy()" (click)="savePostEdits()">Save Edits</button>
            </div>
          </div>
        </div>
      }

      <!-- VIDEO PICKER MODAL -->
      @if (pickingPost(); as targetPost) {
        <div class="modal-backdrop" (click)="pickingPost.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>Attach Video to: {{ targetPost.sourceTitle }}</h2>
              <button type="button" class="link-btn" (click)="pickingPost.set(null)">Close ×</button>
            </div>

            <div class="modal-body">
              @if (loadingCandidates()) {
                <p>Loading Google Drive clips &amp; finished Studio renders…</p>
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
                  <select [(ngModel)]="rDraft.sourceType">
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
                  <span>Format</span>
                  <select [(ngModel)]="rDraft.videoFormat">
                    <option value="Vertical">9:16 Vertical (Shorts)</option>
                    <option value="Wide">16:9 Wide (Long Video)</option>
                  </select>
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
    .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(430px, 1fr)); gap: 16px; }
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
    .btn:disabled { opacity: .48; cursor: not-allowed; }
    .settings-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .settings-panel h2 { margin: 0; font-size: 18px; }
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    .check-tile { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface-2); cursor: pointer; }
    .check-tile strong { display: block; font-size: 13.5px; margin-bottom: 3px; }
    .check-tile small { color: var(--text-dim); font-size: 12px; }
    .form-2col { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-dim); font-weight: 600; }
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
    @media (max-width: 680px) {
      .auto-page { padding: 14px 12px 48px; }
      .posts-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AutomationHubComponent implements OnInit {
  private readonly api = inject(AutomationService);
  private readonly route = inject(ActivatedRoute);
  private readonly status = inject(StatusService);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly pickingPost = signal<AutomationPost | null>(null);
  readonly loadingCandidates = signal(false);
  readonly videoCandidates = signal<AutomationVideoCandidate[]>([]);

  readonly editingRule = signal<AutomationRule | null>(null);
  readonly editingRuleIsNew = signal(false);

  readonly dayNames = DAY_NAMES;
  readonly sourceTypes: AutomationSourceType[] = [
    'HinduPanchang',
    'HinduFestival',
    'DailyKatha',
    'AajKaItihaas',
    'Pratiyogita',
    'EcosystemSpotlight',
    'CustomPrompt',
  ];
  readonly modes: AutomationPostMode[] = ['PreviewOnly', 'AutoVideoAndPreview', 'FullAutopilot'];
  readonly strategies: AutomationVideoStrategy[] = [
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
    if (f === 'all') return afterSrc;
    if (f === 'pending') return afterSrc.filter((p) => p.status === 'PreparedPreview' || p.status === 'Approved');
    if (f === 'ready') return afterSrc.filter((p) => p.status === 'VideoReadyForReview');
    if (f === 'generating') return afterSrc.filter((p) => p.status === 'GeneratingVideo' || p.status === 'Publishing');
    if (f === 'published') return afterSrc.filter((p) => p.status === 'Published');
    return afterSrc.filter((p) => p.status === 'Failed' || p.status === 'Skipped');
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;

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
    }, 15_000);
    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
    });
  }

  sourceInfo(type: AutomationSourceType) {
    return SOURCE_LABELS[type] ?? SOURCE_LABELS.CustomPrompt;
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

  async onDateChange(date: string): Promise<void> {
    if (!date) return;
    this.selectedDate.set(date);
    await this.loadOverview();
  }

  async loadOverview(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    try {
      const ov = await firstValueFrom(this.api.getOverview(this.selectedDate()));
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
    this.editingPost.set({ ...post, tags: [...post.tags], trackedFunnelUrls: [...post.trackedFunnelUrls] });
    this.editingTagsCsv = post.tags.join(', ');
  }

  async savePostEdits(): Promise<void> {
    const draft = this.editingPost();
    if (!draft) return;
    draft.tags = this.editingTagsCsv
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    await this.runAction('save-post', async () => {
      await firstValueFrom(this.api.updatePost(draft.id, draft));
      this.editingPost.set(null);
      this.status.showNotice('Post metadata and prompt updated.');
      await this.loadOverview(true);
    });
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

  async triggerAiVideo(post: AutomationPost): Promise<void> {
    await this.runAction('ai-video', async () => {
      await firstValueFrom(this.api.generateVideo(post.id));
      this.status.showNotice('Started AI Story Agent render. It will attach automatically when finished.');
      await this.loadOverview(true);
    });
  }

  async publishNow(post: AutomationPost): Promise<void> {
    await this.runAction('publish', async () => {
      await firstValueFrom(this.api.publishPost(post.id, { publishNow: true }));
      this.status.showNotice(`Uploading "${post.title}" to YouTube!`);
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

  async removePost(post: AutomationPost): Promise<void> {
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
      sortOrder: (ov?.rules.length ?? 0) + 1,
    });
  }

  openEditRuleModal(rule: AutomationRule): void {
    this.editingRuleIsNew.set(false);
    this.editingRule.set({
      ...rule,
      daysOfWeek: [...rule.daysOfWeek],
      funnelWebsiteKeys: [...rule.funnelWebsiteKeys],
    });
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

  private async runAction(actionName: string, work: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.busyAction.set(actionName);
    this.errorMessage.set(null);
    try {
      await work();
    } catch (err: unknown) {
      this.errorMessage.set(this.readErr(err, 'Action failed.'));
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
