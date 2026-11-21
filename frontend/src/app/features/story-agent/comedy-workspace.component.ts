import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ApiResponse } from '../../core/models/api.models';
import { EffectClip } from '../../core/models/effects.models';
import { StoryExportFile } from '../../core/models/story-agent.models';
import { YouTubeChannel } from '../../core/models/youtube.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  AutomationBackdropMotion,
  AutomationBackgroundPrompt,
  AutomationNarrativeMode,
  AutomationOverview,
  AutomationPost,
  AutomationPublishAdvice,
  AutomationService,
  AutomationStageSettings,
  AutomationStorageCatalog,
  AutomationVideoFormat,
  AutomationVisualEngine,
  SubtitleMotionPreset,
} from '../../core/services/automation.service';
import { EffectsService } from '../../core/services/effects.service';
import { Song, SongsService } from '../../core/services/songs.service';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { ComedyReview, reviewComedyStory } from './comedy-review';
import { parseComedyStory, readComedyStoryUpload } from './comedy-story-file';
import { comedyStoryTemplate } from './comedy-story-template';
import { COMEDY_TONE_OPTIONS, ComedyToneStyle } from './comedy-templates';
import { saveBlob, saveStoryFile } from './story-agent.utils';

export type ComedyAudienceTrack = 'local' | 'international';

export interface PolicyCheckResult {
  readyToPublish: boolean;
  checks: { label: string; ok: boolean; hint?: string }[];
}

const MAX_BG_BYTES = 25 * 1024 * 1024;
const ALLOWED_BG_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Component({
  selector: 'app-comedy-workspace',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './comedy-workspace.component.html',
  styleUrl: './comedy-workspace.component.css',
})
export class ComedyWorkspaceComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stories = inject(StoryAgentService);
  private readonly effects = inject(EffectsService);
  private readonly automation = inject(AutomationService);
  private readonly studioApi = inject(ApiService);
  private readonly songsApi = inject(SongsService);
  private readonly status = inject(StatusService);
  readonly auth = inject(AuthService);

  // Audience track & channel routing
  readonly audienceTrack = signal<ComedyAudienceTrack>('local');
  readonly selectedChannelId = signal<string>('');
  readonly activePostId = signal<string | null>(null);

  // Unified 3D Video Studio inputs
  readonly title = signal('');
  readonly material = signal('');
  readonly reference = signal('');
  readonly language = signal<'hi' | 'en'>('hi');
  readonly style = signal<'2D' | '3D'>('3D');
  readonly visualEngine = signal<AutomationVisualEngine>('Procedural3D');
  readonly format = signal<AutomationVideoFormat>('Vertical');
  readonly narrativeMode = signal<AutomationNarrativeMode>('ShortReel');
  readonly targetSeconds = signal(30);
  readonly voicing = signal<'CharactersOnly' | 'Narrated'>('CharactersOnly');
  readonly comedyStyle = signal<ComedyToneStyle>('Auto');
  readonly subtitlePreset = signal<SubtitleMotionPreset>('karaoke-pulse');
  readonly speakerAName = signal('पप्पू भैया');
  readonly speakerBName = signal('बबलू यार');
  readonly includeMidMemes = signal(true);
  readonly includeBackgroundMusic = signal(true);
  readonly attachedSongId = signal<string>('');

  // Auto Background Tools state
  readonly useCustomBackground = signal(false);
  readonly backgroundTemplateAssetId = signal<string | null>(null);
  readonly backgroundMotion = signal<AutomationBackdropMotion>('Still');
  readonly locationPrompt = signal('lively North Indian chai tapri courtyard, sunlit 3D cartoon style');
  readonly bgPromptData = signal<AutomationBackgroundPrompt | null>(null);
  readonly bgPromptText = signal('');
  readonly showStoragePicker = signal(false);
  readonly storageCatalog = signal<AutomationStorageCatalog | null>(null);
  readonly loadingStorage = signal(false);
  readonly selectedStorageAssetIds = signal<string[]>([]);

  // Effects, songs, channels & Comedy Queue
  readonly memeLibrary = signal<EffectClip[]>([]);
  readonly selectedMemeNames = signal<string[]>([]);
  readonly comedyToneOptions = COMEDY_TONE_OPTIONS;
  readonly overview = signal<AutomationOverview | null>(null);
  readonly songs = signal<Song[]>([]);
  readonly loadingWorkspace = signal(false);

  // UI Collapsibility, Filtering & Pagination (handles large libraries smoothly; cards & policy collapsed by default)
  readonly showStudioSection = signal(true);
  readonly showCompilePanel = signal(false);
  readonly expandedCardIds = signal<Record<string, boolean>>({});
  readonly expandedPolicyIds = signal<Record<string, boolean>>({});
  readonly autoConfirmPolicy = signal(true);
  readonly queueQuery = signal('');
  readonly queueFilter = signal<'all' | 'ready' | 'removed' | 'published' | 'rendering' | 'failed'>('all');
  readonly queuePageSize = signal(6);
  readonly queuePage = signal(0);

  // Peak Time & Cross-Promotion Suggestions
  readonly publishAdvice = signal<AutomationPublishAdvice | null>(null);
  readonly bestPublishSlot = computed(() => this.publishAdvice()?.slots?.[0] ?? null);
  readonly loadingAdvice = signal(false);

  // Inline post editor & Policy / Publishing controls
  readonly expandedPostId = signal<string | null>(null);
  readonly policyConfirmedByPost = signal<Record<string, boolean>>({});
  readonly editDraftTitle = signal('');
  readonly editDraftDescription = signal('');
  readonly editDraftTags = signal('');
  readonly editDraftScheduledAt = signal('');
  readonly editDraftMadeForKids = signal(false);
  readonly editDraftTargetChannelId = signal('');
  readonly compileSelectedIds = signal<string[]>([]);
  readonly compileTitle = signal('Best 3D Comedy Highlights Compilation 😂');
  readonly compileMaxSeconds = signal(150);

  // Legacy JSON Story Converter & Prompt Exporter state (preserved in collapsible panel)
  readonly prompt = signal('');
  readonly reply = signal('');
  readonly review = signal<ComedyReview | null>(null);
  readonly videoPrompt = signal('');

  // Global busy / status signals
  readonly busy = signal(false);
  readonly busyAction = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  private lastAuthKey: string | null = null;
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  readonly ready = computed(() =>
    this.title().trim().length >= 3
    && this.material().trim().length >= 3
    && this.title().length <= 160
    && this.material().length <= 20000
    && this.reference().length <= 1000
  );

  readonly connectedChannels = computed<YouTubeChannel[]>(() => this.overview()?.connectedChannels ?? []);

  readonly comedyRules = computed(() =>
    (this.overview()?.rules ?? []).filter((r) => r.sourceType === 'FunnyComedy')
  );

  readonly comedyPosts = computed(() =>
    (this.overview()?.posts ?? [])
      .filter((p) => p.sourceType === 'FunnyComedy')
      .sort((a, b) => new Date(b.updatedAtUtc).getTime() - new Date(a.updatedAtUtc).getTime())
  );

  readonly filteredComedyPosts = computed(() => {
    const q = this.queueQuery().trim().toLowerCase();
    const filter = this.queueFilter();
    return this.comedyPosts().filter((p) => {
      if (filter === 'ready' && !(p.status === 'VideoReadyForReview' || p.status === 'Approved' || p.status === 'PreparedPreview')) return false;
      if (filter === 'removed' && !(p.removedVideos && p.removedVideos.length > 0 && !p.publishedVideoId)) return false;
      if (filter === 'published' && p.status !== 'Published') return false;
      if (filter === 'rendering' && !(p.status === 'GeneratingVideo' || p.status === 'Publishing')) return false;
      if (filter === 'failed' && p.status !== 'Failed') return false;
      if (q) {
        const hay = `${p.title} ${p.targetChannelHandle ?? ''} ${p.targetChannelTitle ?? ''} ${p.language}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  readonly totalQueuePages = computed(() =>
    Math.max(1, Math.ceil(this.filteredComedyPosts().length / Math.max(1, this.queuePageSize())))
  );

  readonly clampedQueuePage = computed(() =>
    Math.min(this.queuePage(), Math.max(0, this.totalQueuePages() - 1))
  );

  readonly pagedComedyPosts = computed(() => {
    const size = Math.max(1, this.queuePageSize());
    const start = this.clampedQueuePage() * size;
    return this.filteredComedyPosts().slice(start, start + size);
  });

  readonly renderedComedyPosts = computed(() =>
    this.comedyPosts().filter((p) => !!p.attachedRenderJobId)
  );

  readonly hasActiveRenders = computed(() =>
    this.comedyPosts().some((p) => p.status === 'GeneratingVideo' || p.status === 'Publishing')
  );

  readonly selectedChannel = computed<YouTubeChannel | null>(() => {
    const id = this.selectedChannelId();
    const list = this.connectedChannels();
    return (id ? list.find((c) => c.channelId === id) : null) ?? list[0] ?? null;
  });

  readonly isSeriousChannelSelected = computed(() => {
    const ch = this.selectedChannel();
    if (!ch) return false;
    return this.isDevotionalHandleOrTitle(ch.channelHandle, ch.channelTitle);
  });

  constructor() {
    this.effects.list({}, true).subscribe({
      next: (list) => {
        const sorted = [...list].sort((a, b) => Number(b.category === 'Reaction') - Number(a.category === 'Reaction'));
        this.memeLibrary.set(sorted);
        const autoPick = sorted
          .filter((c) => c.category === 'Reaction')
          .slice(0, 6)
          .map((c) => c.name);
        if (autoPick.length) this.selectedMemeNames.set(autoPick);
      },
      error: () => { /* meme library optional for guests */ },
    });

    effect(() => {
      const authed = this.auth.isAuthenticated();
      const key = authed ? (this.auth.user()?.userId || 'authenticated') : 'guest';
      if (key === this.lastAuthKey) return;
      this.lastAuthKey = key;
      if (authed) {
        void this.loadWorkspaceData(true);
      } else {
        this.overview.set(null);
        this.songs.set([]);
        this.storageCatalog.set(null);
      }
    });

    this.pollHandle = setInterval(() => {
      if (this.auth.isAuthenticated() && this.hasActiveRenders()) {
        void this.loadWorkspaceData(true);
      }
    }, 5_000);

    this.destroyRef.onDestroy(() => {
      if (this.pollHandle) clearInterval(this.pollHandle);
    });
  }

  async loadWorkspaceData(background = false): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    if (!background) this.loadingWorkspace.set(true);
    try {
      const ov = await firstValueFrom(this.automation.getOverview(undefined, background));
      this.overview.set(ov);
      if (!this.selectedChannelId() && ov.connectedChannels.length > 0) {
        this.pickDefaultChannelForTrack(this.audienceTrack(), ov.connectedChannels);
      }
      if (!this.publishAdvice()) {
        void this.loadPublishAdvice(true);
      }
      if (this.songs().length === 0 || !background) {
        try {
          const songRes = await firstValueFrom(this.songsApi.list(background));
          this.songs.set(songRes.songs ?? []);
        } catch {
          /* songs list optional */
        }
      }
    } catch (failure: unknown) {
      if (!background) {
        this.error.set(this.message(failure, 'Could not load Comedy Auto-Post workspace.'));
      }
    } finally {
      if (!background) this.loadingWorkspace.set(false);
    }
  }

  selectAudienceTrack(track: ComedyAudienceTrack): void {
    this.audienceTrack.set(track);
    if (track === 'international') {
      this.language.set('en');
      if (this.comedyStyle() === 'Auto' || this.comedyStyle() === 'DesiKhadiSitcom' || this.comedyStyle() === 'KhadiBhasha' || this.comedyStyle() === 'TuTadak') {
        this.comedyStyle.set('GlobalSlapstick');
      }
      if (this.speakerAName() === 'पप्पू भैया') this.speakerAName.set('Woody Buddy');
      if (this.speakerBName() === 'बबलू यार') this.speakerBName.set('Cuppy Mug');
      this.locationPrompt.set('stylized glowing doorway gauntlet stage with bouncy spring props, 3D cartoon style');
    } else {
      this.language.set('hi');
      if (this.comedyStyle() === 'GlobalSlapstick' || this.comedyStyle() === 'TankSeries') {
        this.comedyStyle.set('DesiKhadiSitcom');
      }
      if (this.speakerAName() === 'Woody Buddy') this.speakerAName.set('पप्पू भैया');
      if (this.speakerBName() === 'Cuppy Mug') this.speakerBName.set('बबलू यार');
      this.locationPrompt.set('lively North Indian chai tapri courtyard, steaming kettle, warm sunlit 3D cartoon style');
    }
    this.pickDefaultChannelForTrack(track, this.connectedChannels());
  }

  private isDevotionalHandleOrTitle(handle?: string | null, title?: string | null): boolean {
    const hay = `${handle ?? ''} ${title ?? ''}`.toLowerCase();
    return ['bhakti', 'panchang', 'sanatan', 'katha', 'purana', 'mantra', 'aarti', 'mandir', 'devotional', 'shiv', 'krishna']
      .some((tok) => hay.includes(tok));
  }

  private pickDefaultChannelForTrack(track: ComedyAudienceTrack, channels: YouTubeChannel[]): void {
    if (!channels.length) return;
    // 1. Prefer configured FunnyComedy rule channel (when it is not a devotional channel)
    const rule = this.comedyRules().find((r) =>
      track === 'international'
        ? r.language === 'en'
        : r.language !== 'en'
    );
    if (rule?.targetChannelId) {
      const configured = channels.find((c) => c.channelId === rule.targetChannelId);
      if (configured && !this.isDevotionalHandleOrTitle(configured.channelHandle, configured.channelTitle)) {
        this.selectedChannelId.set(configured.channelId);
        return;
      }
    }

    if (track === 'international') {
      const intl = channels.find((c) => {
        const hay = `${c.channelHandle ?? ''} ${c.channelTitle}`.toLowerCase();
        return !this.isDevotionalHandleOrTitle(c.channelHandle, c.channelTitle)
          && (hay.includes('global') || hay.includes('tank') || hay.includes('toon') || hay.includes('world') || hay.includes('en'))
          && !hay.includes('keshav-anim-ff');
      }) ?? channels.find((c) => !this.isDevotionalHandleOrTitle(c.channelHandle, c.channelTitle));
      if (intl) {
        this.selectedChannelId.set(intl.channelId);
        return;
      }
    } else {
      const desi = channels.find((c) => {
        const hay = `${c.channelHandle ?? ''} ${c.channelTitle}`.toLowerCase();
        return !this.isDevotionalHandleOrTitle(c.channelHandle, c.channelTitle)
          && (hay.includes('keshav-anim-ff') || hay.includes('comedy') || hay.includes('funny') || hay.includes('anim'));
      }) ?? channels.find((c) => !this.isDevotionalHandleOrTitle(c.channelHandle, c.channelTitle));
      if (desi) {
        this.selectedChannelId.set(desi.channelId);
        return;
      }
    }
    this.selectedChannelId.set(channels[0].channelId);
  }

  toggleMemeName(name: string): void {
    const cur = this.selectedMemeNames();
    this.selectedMemeNames.set(cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
  }

  applyAutoComedyPreset(track: 'desi' | 'international' | 'tank' = 'desi'): void {
    this.activePostId.set(null);
    this.style.set('3D');
    this.visualEngine.set('Procedural3D');
    this.format.set('Vertical');
    this.targetSeconds.set(30);
    this.voicing.set('CharactersOnly');
    this.includeMidMemes.set(true);
    if (track === 'international') {
      this.selectAudienceTrack('international');
      this.comedyStyle.set('GlobalSlapstick');
      this.speakerAName.set('Woody Buddy');
      this.speakerBName.set('Cuppy Mug');
      this.title.set('Midnight Trophy Heist 😂 | #Shorts');
      this.material.set(
        '[SCENE]: bedroom | night | playful\n' +
        '[Woody Buddy]: (sleeping) Zzz... sneaking out for the golden trophy in five minutes...\n' +
        '[Cuppy Mug]: (angry, pointing) Wake up! Why are your shoes already by the door?!\n' +
        '[Woody Buddy]: (waking up, surprised) Whoa! Caught red-handed before I even left the bed!\n' +
        '[SCENE]: doorway set | day | slapstick\n' +
        '[Woody Buddy]: (walking) Okay okay, tip-toeing silently through the hallway now...\n' +
        '[MEME]: brain_buffering | LOOK BEHIND THE DOOR!\n' +
        '[Cuppy Mug]: (laughing) Spoiler alert: both doors open straight onto the bouncy sky bridge!',
      );
      this.notice.set('Applied International 3D Slapstick Loop preset (multi-scene action blocking).');
    } else if (track === 'tank') {
      this.selectAudienceTrack('international');
      this.comedyStyle.set('TankSeries');
      this.speakerAName.set('KV-Tiny Tank');
      this.speakerBName.set('Blitz Tank');
      this.title.set('KV-Mini vs Mega Cannon Trap | Cartoon Tank Series | EP 01');
      this.material.set(
        '[SCENE]: tank arena | sunset | dramatic\n' +
        '[KV-Tiny Tank]: (proud) Step aside tiny tank — one blast from this mega cannon ends the whole episode!\n' +
        '[Blitz Tank]: (surprised) Bro wait, did you check what ammo you actually loaded in that barrel?!\n' +
        '[MEME]: shocked_face | WRONG AMMO LOADED!\n' +
        '[KV-Tiny Tank]: (confused) Wait... why did my super cannon shoot a bouncy rubber duck?!\n' +
        '[Blitz Tank]: (laughing) Victory by rubber ducky — see you next episode!',
      );
      this.notice.set('Applied International Cartoon Tank Series (| EP XX) preset.');
    } else {
      this.selectAudienceTrack('local');
      this.comedyStyle.set('DesiKhadiSitcom');
      this.speakerAName.set('पप्पू भैया');
      this.speakerBName.set('बबलू यार');
      this.title.set('आधी रात का रबड़ी कांड 😂 | EP 01');
      this.material.set(
        '[SCENE]: bedroom | night | playful\n' +
        '[पप्पू भैया]: (sleeping) ख्र्र्र... बस पाँच मिनट... रसोई से गरम रबड़ी की खुशबू आ रही है...\n' +
        '[बबलू यार]: (waking up, confused) अरे पप्पू! आधी रात को ये रसोई में कड़ाही कौन खड़का रहा है?!\n' +
        '[SCENE]: kitchen | night | mischievous\n' +
        '[पप्पू भैया]: (walking, eating) आहाहा! आज मलाईदार रबड़ी अकेले साफ कर दूँगा...\n' +
        '[MEME]: shocked_face | रबड़ी चोर लाइव पकड़ा गया!\n' +
        '[बबलू यार]: (angry, pointing) पकड़ लिया बे! सारी रबड़ी अकेले चट कर गया नालायक?!\n' +
        '[पप्पू भैया]: (shocked) अरे नहीं यार! मैं तो बस चेक कर रहा था कि कड़ाही गरम है या ठंडी!\n' +
        '[बबलू यार]: (facepalm, laughing) अबे पूरी रबड़ी चाट के टेम्परेचर चेक होता है क्या?!',
      );
      this.notice.set('Applied Desi MJO-Style Multi-Scene Action Sitcom preset (Bedroom -> Kitchen + SFX).');
    }
    const autoPick = this.memeLibrary().slice(0, 6).map((c) => c.name);
    if (autoPick.length) this.selectedMemeNames.set(autoPick);
  }

  startNewEpisode(): void {
    this.activePostId.set(null);
    this.title.set('');
    this.material.set('');
    this.backgroundTemplateAssetId.set(null);
    this.bgPromptData.set(null);
    this.bgPromptText.set('');
    this.notice.set('Started a fresh episode draft.');
    this.error.set(null);
  }

  loadPostIntoStudio(post: AutomationPost): void {
    this.activePostId.set(post.id);
    this.title.set(post.title);
    this.material.set(post.script);
    this.selectAudienceTrack(post.language === 'en' ? 'international' : 'local');
    this.format.set(post.format === 'Wide' ? 'Wide' : 'Vertical');
    this.visualEngine.set(post.visualEngine && post.visualEngine !== 'Auto' ? post.visualEngine : 'Procedural3D');
    this.narrativeMode.set(post.narrativeMode ?? 'ShortReel');
    this.targetSeconds.set(post.targetSeconds ?? 30);
    this.subtitlePreset.set((post.subtitlePreset as SubtitleMotionPreset) || 'karaoke-pulse');
    this.speakerAName.set(post.speakerAName || (post.language === 'en' ? 'Woody Buddy' : 'पप्पू भैया'));
    this.speakerBName.set(post.speakerBName || (post.language === 'en' ? 'Cuppy Mug' : 'बबलू यार'));
    if (post.targetChannelId) this.selectedChannelId.set(post.targetChannelId);
    const stage = post.stage;
    this.backgroundTemplateAssetId.set(stage?.backgroundTemplateAssetId ?? null);
    this.useCustomBackground.set(!!stage?.backgroundTemplateAssetId);
    this.backgroundMotion.set(stage?.backgroundMotion ?? 'Still');
    if (stage?.locationPrompt) this.locationPrompt.set(stage.locationPrompt);
    this.includeBackgroundMusic.set(stage?.includeBackgroundMusic ?? true);
    this.attachedSongId.set(stage?.attachedSongId ?? '');
    this.selectedStorageAssetIds.set([...(post.attachedAssetIds ?? [])]);
    this.notice.set(`Loaded "${post.title}" into the 3D Comedy editor.`);
    this.error.set(null);
  }

  // ---------------------------------------------------------------- Dual Local + International Autopilot Setup

  async bootstrapDualPipelines(): Promise<void> {
    if (!this.requireSignIn('setup Dual Local & International pipelines')) return;
    await this.runBusy('bootstrap', async () => {
      const res = await firstValueFrom(this.automation.bootstrapDualComedy());
      await this.loadWorkspaceData(false);
      this.notice.set(
        res.createdCount > 0
          ? `Ready! Added ${res.createdCount} new pipeline(s). Both Local (@KESHAV-ANIM-FF) & International 3D channels are configured (${res.rules.length} total rules).`
          : `Both Local & International 3D Comedy pipelines are already active (${res.rules.length} rules).`,
      );
    });
  }

  // ---------------------------------------------------------------- Direct 3D / AI MP4 Creation & Rendering

  async createOrRenderPost(action: 'draft' | 'render3d' | 'renderAi'): Promise<void> {
    if (!this.requireSignIn('create and render 3D Comedy MP4 videos')) return;
    if (this.title().trim().length < 3) {
      this.error.set('Enter an episode title (at least 3 characters) or click a starter preset above.');
      return;
    }

    const engineToUse: AutomationVisualEngine =
      action === 'render3d' ? 'Procedural3D'
        : this.visualEngine() === 'Procedural3D' ? 'AiRealisticStory' : this.visualEngine();

    await this.runBusy(`studio-${action}`, async () => {
      let postId = this.activePostId();
      if (postId) {
        const stage = this.currentStageSettings();
        await firstValueFrom(this.automation.updatePost(postId, {
          title: this.title().trim(),
          script: this.material().trim() || undefined,
          targetChannelId: this.selectedChannel()?.channelId ?? null,
          language: this.audienceTrack() === 'international' ? 'en' : 'hi',
          format: this.format(),
          targetSeconds: this.targetSeconds(),
          subtitlePreset: this.subtitlePreset(),
          speakerAName: this.speakerAName().trim() || null,
          speakerBName: this.speakerBName().trim() || null,
        }));
        await firstValueFrom(this.automation.saveStage(postId, stage));

        if (action === 'render3d') {
          await firstValueFrom(this.automation.generateAnimatedVideo(postId, {
            durationSeconds: this.targetSeconds(),
            resolution: '720p',
            format: this.format(),
            enableCharacterDialogue: true,
            subtitlePreset: this.subtitlePreset(),
            speakerAName: this.speakerAName().trim() || null,
            speakerBName: this.speakerBName().trim() || null,
            narrativeMode: this.narrativeMode(),
            attachedAssetIds: this.selectedStorageAssetIds(),
          }));
        } else if (action === 'renderAi') {
          await firstValueFrom(this.automation.generateVideo(postId, {
            visualEngine: engineToUse,
            narrativeMode: this.narrativeMode(),
            targetSeconds: this.targetSeconds(),
            attachedAssetIds: this.selectedStorageAssetIds(),
          }));
        }
      } else {
        const created = await firstValueFrom(this.automation.createComedyPost({
          title: this.title().trim(),
          scriptOrIdeas: this.material().trim() || null,
          audienceTrack: this.audienceTrack(),
          language: this.audienceTrack() === 'international' ? 'en' : 'hi',
          comedyStyle: this.comedyStyle(),
          format: this.format(),
          narrativeMode: this.narrativeMode(),
          visualEngine: action === 'render3d' ? 'Procedural3D' : engineToUse,
          targetSeconds: this.targetSeconds(),
          speakerAName: this.speakerAName().trim() || null,
          speakerBName: this.speakerBName().trim() || null,
          subtitlePreset: this.subtitlePreset(),
          enableCharacterDialogue: true,
          includeMidMemes: this.includeMidMemes(),
          includeBackgroundMusic: this.includeBackgroundMusic(),
          backgroundTemplateAssetId: this.useCustomBackground() ? this.backgroundTemplateAssetId() : null,
          backgroundMotion: this.backgroundMotion(),
          locationPrompt: this.locationPrompt().trim() || null,
          attachedSongId: this.attachedSongId() || null,
          targetChannelId: this.selectedChannel()?.channelId ?? null,
          attachedAssetIds: this.selectedStorageAssetIds(),
          renderAction: action,
        }));
        this.activePostId.set(created.id);
        postId = created.id;
      }

      await this.loadWorkspaceData(false);
      if (postId) this.openPostEditor(postId);
      this.notice.set(
        action === 'draft'
          ? 'Saved Comedy episode draft + SEO metadata below! Review or generate background/thumbnail.'
          : action === 'render3d'
            ? '3D Comedy MP4 render completed/started! Preview, check policy & publish below.'
            : 'AI Video generation triggered! Live status updates automatically every 5 seconds.',
      );
    });
  }

  // ---------------------------------------------------------------- Auto Background Tools inside /comedy

  private currentStageSettings(): AutomationStageSettings {
    return {
      backgroundTemplateAssetId: this.useCustomBackground() ? this.backgroundTemplateAssetId() : null,
      locationPrompt: this.locationPrompt().trim() || null,
      includeBackgroundMusic: this.includeBackgroundMusic(),
      followScriptExactly: true,
      attachedSongId: this.attachedSongId() || null,
      backgroundMotion: this.backgroundMotion(),
    };
  }

  private async ensureDraftPostId(): Promise<string> {
    const existing = this.activePostId();
    if (existing) return existing;
    const seedTitle = this.title().trim().length >= 3
      ? this.title().trim()
      : (this.audienceTrack() === 'international'
        ? 'Global 3D Comedy Short 😂'
        : 'देसी टपरी कॉमेडी शॉर्ट 😂');
    if (this.title().trim().length < 3) this.title.set(seedTitle);
    const created = await firstValueFrom(this.automation.createComedyPost({
      title: seedTitle,
      scriptOrIdeas: this.material().trim() || null,
      audienceTrack: this.audienceTrack(),
      language: this.audienceTrack() === 'international' ? 'en' : 'hi',
      comedyStyle: this.comedyStyle(),
      format: this.format(),
      narrativeMode: this.narrativeMode(),
      visualEngine: this.visualEngine(),
      targetSeconds: this.targetSeconds(),
      speakerAName: this.speakerAName().trim() || null,
      speakerBName: this.speakerBName().trim() || null,
      subtitlePreset: this.subtitlePreset(),
      includeMidMemes: this.includeMidMemes(),
      includeBackgroundMusic: this.includeBackgroundMusic(),
      locationPrompt: this.locationPrompt().trim() || null,
      targetChannelId: this.selectedChannel()?.channelId ?? null,
      renderAction: 'draft',
    }));
    this.activePostId.set(created.id);
    await this.loadWorkspaceData(true);
    return created.id;
  }

  async buildBackgroundPrompt(): Promise<void> {
    if (!this.requireSignIn('build AI background prompts')) return;
    await this.runBusy('bg-prompt', async () => {
      this.useCustomBackground.set(true);
      const postId = await this.ensureDraftPostId();
      const built = await firstValueFrom(this.automation.backgroundPicturePrompt(postId, this.currentStageSettings()));
      this.bgPromptData.set(built);
      this.bgPromptText.set(built.prompt);
      this.notice.set(`Built ${built.aspectRatio} background prompt (${built.width}x${built.height}). Edit or generate with AI!`);
    });
  }

  async generateAiBackground(): Promise<void> {
    if (!this.requireSignIn('generate an AI 3D background plate')) return;
    await this.runBusy('bg-generate', async () => {
      this.useCustomBackground.set(true);
      const postId = await this.ensureDraftPostId();
      const promptToUse = this.bgPromptText().trim() || null;
      const result = await firstValueFrom(
        this.automation.generateBackgroundPicture(postId, this.currentStageSettings(), promptToUse),
      );
      this.backgroundTemplateAssetId.set(result.assetId);
      if (result.prompt && !this.bgPromptText().trim()) this.bgPromptText.set(result.prompt);
      await firstValueFrom(this.automation.saveStage(postId, this.currentStageSettings()));
      this.storageCatalog.set(null);
      await this.loadWorkspaceData(true);
      this.notice.set(`Generated AI background image (${result.provider}) & saved to Studio Storage!`);
    });
  }

  async uploadBackgroundImage(event: Event): Promise<void> {
    if (!this.requireSignIn('upload a background image')) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!ALLOWED_BG_MIME.has(file.type)) {
      this.error.set('Pick a PNG, JPG, or WebP background image.');
      return;
    }
    if (file.size > MAX_BG_BYTES) {
      this.error.set('Background image exceeds 25 MB limit.');
      return;
    }
    await this.runBusy('bg-upload', async () => {
      this.useCustomBackground.set(true);
      const { projectId } = await firstValueFrom(this.automation.backgroundTemplateProject());
      const asset = await firstValueFrom(this.studioApi.uploadAsset(projectId, file));
      this.backgroundTemplateAssetId.set(asset.id);
      if (this.activePostId()) {
        await firstValueFrom(this.automation.saveStage(this.activePostId()!, this.currentStageSettings()));
      }
      this.storageCatalog.set(null);
      this.notice.set('Uploaded background image & attached to your Comedy 3D stage.');
    });
  }

  async toggleStoragePicker(): Promise<void> {
    if (!this.requireSignIn('browse Studio Storage images')) return;
    const next = !this.showStoragePicker();
    this.showStoragePicker.set(next);
    if (next && !this.storageCatalog()) {
      this.loadingStorage.set(true);
      try {
        const cat = await firstValueFrom(this.automation.getStorageMediaCatalog());
        this.storageCatalog.set(cat);
      } catch (failure: unknown) {
        this.error.set(this.message(failure, 'Could not load Studio Storage catalog.'));
      } finally {
        this.loadingStorage.set(false);
      }
    }
  }

  selectStorageBackground(assetId: string): void {
    this.useCustomBackground.set(true);
    this.backgroundTemplateAssetId.set(assetId);
    if (!this.selectedStorageAssetIds().includes(assetId)) {
      this.selectedStorageAssetIds.set([...this.selectedStorageAssetIds(), assetId]);
    }
    this.notice.set('Selected Studio Storage image as 3D stage background.');
  }

  toggleAttachedStoryAsset(assetId: string): void {
    const cur = this.selectedStorageAssetIds();
    this.selectedStorageAssetIds.set(
      cur.includes(assetId) ? cur.filter((x) => x !== assetId) : [...cur, assetId],
    );
  }

  clearCustomBackground(): void {
    this.backgroundTemplateAssetId.set(null);
    this.useCustomBackground.set(false);
    this.notice.set('Switched back to built-in dynamic 3D cartoon comedy stage.');
  }

  // ---------------------------------------------------------------- Queue Editor, SEO, Policy & YouTube Publishing

  isCardExpanded(postId: string): boolean {
    return !!this.expandedCardIds()[postId];
  }

  toggleCardExpanded(postId: string): void {
    const cur = this.expandedCardIds();
    this.expandedCardIds.set({ ...cur, [postId]: !cur[postId] });
  }

  expandAllQueueCards(): void {
    const next: Record<string, boolean> = {};
    for (const p of this.pagedComedyPosts()) next[p.id] = true;
    this.expandedCardIds.set(next);
  }

  collapseAllQueueCards(): void {
    this.expandedCardIds.set({});
    this.expandedPolicyIds.set({});
  }

  isPolicyExpanded(postId: string): boolean {
    return !!this.expandedPolicyIds()[postId];
  }

  togglePolicyExpanded(postId: string): void {
    const cur = this.expandedPolicyIds();
    this.expandedPolicyIds.set({ ...cur, [postId]: !cur[postId] });
  }

  setQueueFilter(filter: 'all' | 'ready' | 'removed' | 'published' | 'rendering' | 'failed'): void {
    this.queueFilter.set(filter);
    this.queuePage.set(0);
  }

  setQueuePageSize(size: number): void {
    this.queuePageSize.set(Math.max(1, Number(size) || 6));
    this.queuePage.set(0);
  }

  prevQueuePage(): void {
    this.queuePage.set(Math.max(0, this.clampedQueuePage() - 1));
  }

  nextQueuePage(): void {
    this.queuePage.set(Math.min(this.totalQueuePages() - 1, this.clampedQueuePage() + 1));
  }

  async loadPublishAdvice(quiet = false): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    if (!quiet) this.loadingAdvice.set(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const advice = await firstValueFrom(
        this.automation.getPublishAdvice('FunnyComedy', this.format(), this.selectedChannel()?.channelId ?? null, tz),
      );
      this.publishAdvice.set(advice);
    } catch {
      /* advice optional */
    } finally {
      if (!quiet) this.loadingAdvice.set(false);
    }
  }

  async schedulePostAtPeakSlot(post: AutomationPost, atUtc: string, scheduleOnYouTube: boolean): Promise<void> {
    if (!this.requireSignIn('schedule videos to YouTube')) return;
    const report = this.policyReport(post);
    if (!report.readyToPublish) {
      const missing = report.checks.filter((c) => !c.ok).map((c) => c.label).join('; ');
      this.error.set(`Resolve before scheduling: ${missing}`);
      return;
    }
    await this.runBusy(`pub-${post.id}`, async () => {
      await firstValueFrom(this.automation.publishPost(post.id, {
        publishNow: false,
        scheduledAtUtc: atUtc,
        scheduleOnYouTube,
      }));
      await this.loadWorkspaceData(false);
      const localLabel = new Date(atUtc).toLocaleString();
      this.notice.set(
        scheduleOnYouTube
          ? `Uploaded "${post.title}" as Private to YouTube — YouTube will auto-publish it at peak time (${localLabel})!`
          : `Queued "${post.title}" for automated upload at peak time (${localLabel}).`,
      );
    });
  }

  /**
   * One click from "rendered" to "on YouTube at the right time": fills SEO, tags and a thumbnail frame through the
   * server's policy sanitizer, re-checks the policy list on the filled post, then uploads it Private now with
   * YouTube releasing it at the earliest peak slot that leaves processing time (or publishes now if none fits).
   */
  async autoReadyAndPublishAtPeak(post: AutomationPost): Promise<void> {
    if (!this.requireSignIn('publish videos to YouTube')) return;
    await this.runBusy(`auto-${post.id}`, async () => {
      const filled = await firstValueFrom(this.automation.autoFillDetails(post.id));
      const report = this.policyReport(filled);
      if (!report.readyToPublish) {
        await this.loadWorkspaceData(false);
        const missing = report.checks.filter((c) => !c.ok).map((c) => c.label).join('; ');
        throw new Error(`Auto-filled SEO & thumbnail, but still needs: ${missing}`);
      }

      await this.loadPublishAdvice(true);
      const minLeadMs = 30 * 60_000;
      const slot = (this.publishAdvice()?.slots ?? [])
        .map((s) => s.atUtc)
        .filter((at) => new Date(at).getTime() - Date.now() >= minLeadMs)
        .sort()[0] ?? null;

      await firstValueFrom(this.automation.publishPost(filled.id, {
        publishNow: !slot,
        scheduledAtUtc: slot,
        scheduleOnYouTube: !!slot,
      }));
      await this.loadWorkspaceData(false);
      this.notice.set(slot
        ? `"${filled.title}" is uploading Private with SEO & thumbnail — YouTube makes it public at ${new Date(slot).toLocaleString()}.`
        : `"${filled.title}" is uploading now with SEO & thumbnail (no peak slot left in the window).`);
    });
  }

  /** Script helper chips: tags the parser turns into 3D actions, camera moves, SFX and place ambience. */
  readonly scriptTagChips: readonly { label: string; insert: string; hint: string }[] = [
    { label: '👊 Punch', insert: '(punch) ', hint: 'Jab-cross combo, POW flash, punch SFX; the other character recoils' },
    { label: '🦵 Kick', insert: '(kick) ', hint: 'Snap kick with thud SFX; the other character falls back' },
    { label: '🤕 Ouch', insert: '(ouch) ', hint: 'Hit reaction / recoil' },
    { label: '🏃 Run', insert: '(running) ', hint: 'Running cycle with footstep SFX' },
    { label: '💃 Dance', insert: '(dancing) ', hint: 'Dance groove with boing SFX' },
    { label: '🤦 Facepalm', insert: '(facepalm) ', hint: 'Forehead slap with bonk SFX & dizzy stars' },
    { label: '😱 Shocked', insert: '(surprised) ', hint: 'Shock fall, crash zoom & vine boom' },
    { label: '🌳 Forest scene', insert: '\n[SCENE]: forest | day | calm\n', hint: 'Forest set with birds & breeze ambience' },
    { label: '🌊 River ghat', insert: '\n[SCENE]: river ghat | dawn | calm\n', hint: 'River ghat with flowing-water ambience' },
    { label: '🏔️ Himalaya', insert: '\n[SCENE]: himalaya | day | dramatic\n', hint: 'Mountain set with wind ambience' },
    { label: '🏙️ City', insert: '\n[SCENE]: city | sunset | playful\n', hint: 'City street with traffic ambience' },
    { label: '🌙 Village night', insert: '\n[SCENE]: village | night | mysterious\n', hint: 'Village at night with crickets' },
  ];

  insertScriptTag(insert: string, textarea: HTMLTextAreaElement): void {
    const value = this.material();
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const next = (value.slice(0, start) + insert + value.slice(end)).slice(0, 20000);
    this.material.set(next);
    queueMicrotask(() => {
      textarea.focus();
      const caret = Math.min(next.length, start + insert.length);
      textarea.setSelectionRange(caret, caret);
    });
  }

  async markDeletedAndSwitchChannel(post: AutomationPost, newChannelId?: string | null, republishNow = false): Promise<void> {
    if (!this.requireSignIn('manage YouTube uploads')) return;
    await this.runBusy(`switch-${post.id}`, async () => {
      await firstValueFrom(this.automation.removeFromYouTube(post.id, {
        deleteOnYouTube: false,
        targetChannelId: newChannelId || null,
        republishNow,
      }));
      await this.loadWorkspaceData(false);
      this.notice.set(
        republishNow
          ? `Reset removed video & re-uploading "${post.title}" now!`
          : `Re-enabled upload for "${post.title}". Pick a channel & click Publish / Schedule below.`,
      );
    });
  }

  openPostEditor(postId: string): void {
    const post = this.comedyPosts().find((p) => p.id === postId);
    if (!post) return;
    if (this.expandedPostId() === postId) {
      this.expandedPostId.set(null);
      return;
    }
    this.expandedCardIds.set({ ...this.expandedCardIds(), [postId]: true });
    this.expandedPostId.set(postId);
    this.editDraftTitle.set(post.title);
    this.editDraftDescription.set(post.description);
    this.editDraftTags.set((post.tags ?? []).join(', '));
    this.editDraftMadeForKids.set(!!post.madeForKids);
    this.editDraftTargetChannelId.set(post.targetChannelId ?? this.selectedChannel()?.channelId ?? '');
    this.editDraftScheduledAt.set(post.scheduledAtUtc ? post.scheduledAtUtc.slice(0, 16) : '');
  }

  async savePostDetails(post: AutomationPost): Promise<void> {
    await this.runBusy(`save-${post.id}`, async () => {
      const tags = this.editDraftTags()
        .split(',')
        .map((t) => t.trim())
        .filter((t) => !!t);
      await firstValueFrom(this.automation.updatePost(post.id, {
        title: this.editDraftTitle().trim() || post.title,
        description: this.editDraftDescription().trim() || post.description,
        tags,
        madeForKids: this.editDraftMadeForKids(),
        targetChannelId: this.editDraftTargetChannelId() || post.targetChannelId || null,
        scheduledAtUtc: this.editDraftScheduledAt()
          ? new Date(this.editDraftScheduledAt()).toISOString()
          : post.scheduledAtUtc ?? null,
      }));
      await this.loadWorkspaceData(false);
      this.notice.set(`Saved metadata & channel for "${this.editDraftTitle().trim() || post.title}".`);
    });
  }

  async autoFillPostSeo(post: AutomationPost): Promise<void> {
    await this.runBusy(`seo-${post.id}`, async () => {
      const updated = await firstValueFrom(this.automation.autoFillDetails(post.id));
      await this.loadWorkspaceData(false);
      if (this.expandedPostId() === post.id) {
        this.editDraftTitle.set(updated.title);
        this.editDraftDescription.set(updated.description);
        this.editDraftTags.set((updated.tags ?? []).join(', '));
      }
      this.notice.set('Auto-filled title, tags, description & keshavsingh.in attribution link.');
    });
  }

  async generatePostThumbnail(post: AutomationPost): Promise<void> {
    await this.runBusy(`thumb-${post.id}`, async () => {
      await firstValueFrom(this.automation.generateAiThumbnail(post.id, post.aiThumbnailPrompt));
      await this.loadWorkspaceData(false);
      this.notice.set('Generated YouTube thumbnail preview!');
    });
  }

  async verifyPostCompliance(post: AutomationPost): Promise<void> {
    await this.runBusy(`verify-${post.id}`, async () => {
      const updated = await firstValueFrom(this.automation.verifyPost(post.id));
      await this.loadWorkspaceData(false);
      if (post.publishedVideoId && !updated.publishedVideoId) {
        this.notice.set(`Detected "${updated.title}" was deleted from YouTube — upload options have been re-enabled!`);
      } else {
        this.notice.set(
          updated.publishedVideoId
            ? `Verified: "${updated.title}" is still live on YouTube & compliant.`
            : 'Completed policy & fact verification check on post.',
        );
      }
    });
  }

  policyReport(post: AutomationPost): PolicyCheckResult {
    const channel = this.connectedChannels().find((c) => c.channelId === post.targetChannelId) ?? this.selectedChannel();
    const tagsLen = (post.tags ?? []).join(',').length;
    const hashtagsCount = (post.description.match(/#[^\s#]+/g) ?? []).length;
    const hasSpamBait = /(sub4sub|sub 4 sub|sub for sub|subscribe back|watch4watch|buy views|free views|bit\.ly\/|tinyurl\.com\/)/i
      .test(`${post.title} ${post.description}`);
    const confirmed = this.isPolicyConfirmed(post.id);
    const checks: { label: string; ok: boolean; hint?: string }[] = [
      { label: `Title <= 100 chars (${post.title.length}/100)`, ok: post.title.trim().length >= 3 && post.title.trim().length <= 100 },
      { label: 'Original description & hub link present', ok: post.description.trim().length >= 20, hint: 'Auto-populated via Policy Sanitizer' },
      { label: `Hashtag hygiene <= 15 (${hashtagsCount}/15)`, ok: hashtagsCount <= 15, hint: 'Keep 3–8 focused hashtags; >15 triggers YouTube spam rejection' },
      { label: 'Zero engagement-bait / URL-shortener spam', ok: !hasSpamBait, hint: 'Remove sub4sub, view-exchange bait, or bit.ly/tinyurl links' },
      { label: `YouTube tags limit <= 500 chars (${tagsLen}/500)`, ok: tagsLen <= 500 },
      { label: 'Non-Made-For-Kids classification checked', ok: !post.madeForKids, hint: 'Roast/satire comedy should stay general audience (not Made for Kids)' },
      { label: 'Rendered MP4 attached', ok: !!post.attachedRenderJobId || !!post.attachedHandoffId, hint: 'Click Generate 3D Comedy Video above' },
      {
        label: channel ? `YouTube channel ready (${channel.channelHandle || channel.channelTitle})` : 'YouTube channel connected',
        ok: !!channel && !channel.needsReconnect,
        hint: channel?.needsReconnect ? 'Reconnect channel on /youtube' : 'Connect channel on /youtube',
      },
      {
        label: 'Originality, Ad Policy & Invalid-Traffic (no self-watch on own account/device/Wi-Fi) confirmed',
        ok: confirmed,
        hint: 'Confirm once (or leave Standing Policy Attestation enabled)',
      },
    ];
    return {
      readyToPublish: checks.every((c) => c.ok),
      checks,
    };
  }

  isPolicyConfirmed(postId: string): boolean {
    const explicit = this.policyConfirmedByPost()[postId];
    return explicit !== undefined ? explicit : this.autoConfirmPolicy();
  }

  setPolicyConfirmed(postId: string, val: boolean): void {
    this.policyConfirmedByPost.set({ ...this.policyConfirmedByPost(), [postId]: val });
  }

  async publishPostToYouTube(post: AutomationPost, publishNow: boolean, scheduleOnYouTube = false): Promise<void> {
    if (!this.requireSignIn('publish videos to YouTube')) return;
    const report = this.policyReport(post);
    if (!report.readyToPublish) {
      const missing = report.checks.filter((c) => !c.ok).map((c) => c.label).join('; ');
      this.error.set(`Please resolve before publishing: ${missing}`);
      return;
    }
    const chosenSlot = publishNow
      ? null
      : (post.scheduledAtUtc ?? this.publishAdvice()?.recommendedAtUtc ?? null);
    await this.runBusy(`pub-${post.id}`, async () => {
      await firstValueFrom(this.automation.publishPost(post.id, {
        publishNow,
        scheduledAtUtc: chosenSlot,
        scheduleOnYouTube,
      }));
      await this.loadWorkspaceData(false);
      this.notice.set(
        publishNow
          ? `Uploading "${post.title}" directly to ${post.targetChannelHandle || post.targetChannelTitle || 'YouTube'}!`
          : scheduleOnYouTube
            ? `Uploaded "${post.title}" Private -> YouTube will auto-publish at peak slot!`
            : `Scheduled "${post.title}" on your YouTube publishing queue.`,
      );
    });
  }

  toggleCompilePost(postId: string): void {
    const cur = this.compileSelectedIds();
    this.compileSelectedIds.set(cur.includes(postId) ? cur.filter((x) => x !== postId) : [...cur, postId]);
  }

  async compileBestOfVideo(): Promise<void> {
    if (!this.requireSignIn('compile multiple comedy clips')) return;
    const ids = this.compileSelectedIds();
    if (ids.length < 2) {
      this.error.set('Select at least 2 rendered comedy videos to compile.');
      return;
    }
    await this.runBusy('compile', async () => {
      const res = await firstValueFrom(this.automation.compileComedy({
        postIds: ids,
        title: this.compileTitle().trim() || undefined,
        maxSeconds: this.compileMaxSeconds(),
        targetChannelId: this.selectedChannel()?.channelId ?? null,
      }));
      this.compileSelectedIds.set([]);
      await this.loadWorkspaceData(false);
      this.notice.set(
        `Compiled ${res.clipCount} comedy clips (${Math.round(res.durationSeconds)}s) into "${res.post.title}"! Preview & publish below.`,
      );
    });
  }

  // URL helpers
  assetThumbUrl(assetId: string): string {
    return this.automation.storageAssetThumbnailUrl(assetId);
  }

  bgPreviewUrl(assetId: string): string {
    return this.studioApi.assetUrl(assetId);
  }

  postThumbUrl(post: AutomationPost): string {
    return this.automation.postThumbnailUrl(post.id, post.updatedAtUtc);
  }

  previewVideoUrl(jobId: string): string {
    return this.studioApi.previewUrl(jobId);
  }

  downloadVideoUrl(jobId: string): string {
    return this.studioApi.downloadUrl(jobId);
  }

  async copyText(text: string, feedback = 'Copied!'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.notice.set(feedback);
      this.error.set(null);
    } catch {
      this.error.set('Clipboard blocked by browser; copy text manually.');
    }
  }

  // ---------------------------------------------------------------- Preserved Legacy AI Script & Story JSON Workflows

  private body() {
    return {
      title: this.title().trim(), material: this.material().trim(), reference: this.reference().trim() || null,
      language: this.language(), style: this.style(), targetSeconds: this.targetSeconds(), voicing: this.voicing(),
      comedyStyle: this.comedyStyle(), includeMidMemes: this.includeMidMemes(),
      memeNames: this.includeMidMemes() ? this.selectedMemeNames() : [],
    };
  }

  async preparePrompt(): Promise<void> {
    if (!this.ready() || this.busy()) return;
    await this.runBusy('json-prompt', async () => {
      const response = await firstValueFrom(this.http.post<ApiResponse<{ prompt: string }>>(
        `${environment.apiUrl}/api/comedy-workspace/prompt`, this.body()));
      if (!response.data?.prompt) throw new Error('The server returned an empty prompt.');
      this.prompt.set(response.data.prompt);
    });
  }

  async convert(): Promise<void> {
    if (!this.ready() || this.busy()) return;
    await this.runBusy('json-convert', async () => {
      const response = await firstValueFrom(this.http.post<ApiResponse<{ reply: string; provider: string }>>(
        `${environment.apiUrl}/api/comedy-workspace/convert`, this.body()));
      if (!response.data?.reply) throw new Error('The model returned an empty response.');
      this.updateReply(response.data.reply);
      this.notice.set(`Response from ${response.data.provider}. Review it before importing.`);
    });
  }

  async copyPrompt(): Promise<void> {
    await this.copyText(this.prompt(), 'Prompt copied.');
  }

  downloadPrompt(): void {
    saveBlob(new Blob([this.prompt()], { type: 'text/plain;charset=utf-8' }), 'comedy-conversion-prompt.txt');
  }

  downloadTemplate(): void {
    saveStoryFile(comedyStoryTemplate(this.language(), this.style(), this.targetSeconds(), this.voicing()), 'comedy-template');
    this.error.set(null);
    this.notice.set('Example template downloaded. Replace its two sample scenes before importing.');
  }

  async pickScript(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 80 * 1024) {
      this.error.set('The text file is too large. Use up to 20,000 characters.');
      return;
    }
    try {
      const text = await file.text();
      if (text.length > 20000) throw new Error('The text file is too long. Use up to 20,000 characters.');
      this.material.set(text);
      this.error.set(null);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The text file could not be read.'));
    }
  }

  private showStory(file: StoryExportFile, text: string): void {
    this.reply.set(text);
    this.review.set(reviewComedyStory(file));
    this.videoPrompt.set('');
    if (typeof file.story.title === 'string') this.title.set(file.story.title.slice(0, 160));
    if (file.story.language === 'hi' || file.story.language === 'en') this.language.set(file.story.language);
    if (file.story.options?.artStyle === 'Cartoon') this.style.set('2D');
    if (file.story.options?.artStyle === 'Cartoon3D') this.style.set('3D');
    if (file.story.targetSeconds === 30 || file.story.targetSeconds === 60) this.targetSeconds.set(file.story.targetSeconds);
    if (file.story.voicing === 'CharactersOnly' || file.story.voicing === 'Narrated') this.voicing.set(file.story.voicing);
    this.error.set(null);
    this.notice.set(`Loaded "${file.story.title || 'story'}" with ${file.script?.scenes.length ?? 0} scenes. Review the JSON before importing.`);
  }

  updateReply(value: string): void {
    this.reply.set(value);
    this.review.set(null);
    this.videoPrompt.set('');
  }

  prepareVideoPrompt(): void {
    const review = this.review();
    if (!review) return;
    this.videoPrompt.set(review.prompt);
    this.notice.set('Video prompt prepared from the reviewed JSON. Check it before sending it to a video tool.');
    this.error.set(null);
  }

  async copyVideoPrompt(): Promise<void> {
    await this.copyText(this.videoPrompt(), 'Video prompt copied.');
  }

  downloadVideoPrompt(): void {
    saveBlob(new Blob([this.videoPrompt()], { type: 'text/plain;charset=utf-8' }), 'comedy-video-prompt.txt');
  }

  async loadPastedStory(): Promise<void> {
    try {
      const file = await parseComedyStory(this.reply());
      this.showStory(file, this.reply());
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story could not be read.'));
      this.notice.set(null);
    }
  }

  async pickStory(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';
    if (!picked) return;
    try {
      const { story, text } = await readComedyStoryUpload(picked);
      this.showStory(story, text);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story file could not be read.'));
      this.notice.set(null);
    }
  }

  async downloadStory(): Promise<void> {
    try {
      const file = await parseComedyStory(this.reply());
      saveStoryFile(file, file.story.title || 'comedy');
      this.error.set(null);
      this.notice.set('Story file downloaded. The script is checked when imported.');
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story file could not be prepared.'));
    }
  }

  async importStory(): Promise<void> {
    if (this.busy()) return;
    await this.runBusy('import-story', async () => {
      const file = await parseComedyStory(this.reply());
      const run = await firstValueFrom(this.stories.importStory(file));
      await this.router.navigate(['/story-agent', run.id]);
    });
  }

  // ---------------------------------------------------------------- Internal utilities

  private requireSignIn(goal: string): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.error.set(`Please sign in first to ${goal}.`);
    this.auth.openAuthModal();
    return false;
  }

  private async runBusy(actionKey: string, work: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.busyAction.set(actionKey);
    this.error.set(null);
    try {
      await work();
    } catch (failure: unknown) {
      const msg = this.message(failure, 'Operation failed.');
      this.error.set(msg);
      this.status.showError(msg);
    } finally {
      this.busy.set(false);
      this.busyAction.set(null);
    }
  }

  private message(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure || failure instanceof Error ? failure.message : fallback;
  }
}
