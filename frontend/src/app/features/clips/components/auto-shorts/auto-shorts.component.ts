import { Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AUTO_SHORT_STYLES, AutoShortLayout, AutoShortOrder, AutoShortStyle, AutoShortTextMode, AutoShortsBody,
  AutoShortsPreview, AutoShortsResult, Clip, ClipFit, ExportQuality,
} from '../../../../core/models/api.models';
import { GoogleDriveStatus, isValidDriveFolderName } from '../../../../core/models/youtube.models';
import { ActivityService } from '../../../../core/services/activity.service';
import { ShortsService } from '../../../../core/services/shorts.service';
import { YouTubePublishService } from '../../../../core/services/youtube-publish.service';
import { TopicPickerComponent } from '../../../../shared/topic-picker.component';
import { StudioStateService } from '../../services/studio-state.service';
import { formatRunTime } from '../photo-story/photo-story-logic';

interface ShortFormat { id: string; label: string; width: number; height: number }

const FORMATS: readonly ShortFormat[] = [
  { id: '9:16', label: '9:16 Shorts / Reels', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 Square', width: 1080, height: 1080 },
  { id: '16:9', label: '16:9 YouTube', width: 1920, height: 1080 },
];

const STYLE_HINTS: Record<AutoShortStyle, { icon: string; hint: string }> = {
  Auto: { icon: '✨', hint: 'Suits your length and picks' },
  Mixed: { icon: '🎲', hint: 'A different style per short' },
  Viral: { icon: '🚀', hint: 'Whip cuts, punch-ins, yellow captions' },
  DirectResponse: { icon: '🌌', hint: 'Cosmic glass pills, 1-word pop, Order Now CTA' },
  Explainer: { icon: '📊', hint: 'Clean slide reveals, comparison & info cards' },
  Energetic: { icon: '⚡', hint: 'Slides and wipes, strong moves' },
  Hype: { icon: '🔥', hint: '1-2s cuts, shaky and punchy' },
  Cinematic: { icon: '🎬', hint: 'Dissolves, film grade' },
  Dramatic: { icon: '🎭', hint: 'Iris wipes, dark contrast' },
  Calm: { icon: '🌿', hint: 'Soft fades, gentle zooms' },
  Dreamy: { icon: '☁️', hint: 'Long dissolves, warm glow' },
  Retro: { icon: '📼', hint: 'Faded film, slow pans' },
};

/** What each style does, for the preview: the same numbers the server cuts with. */
interface StylePreview {
  /** Seconds per shot in the animated tile. */
  cut: number;
  /** How the tile's shots change. */
  kind: 'fade' | 'slide' | 'up' | 'zoom' | 'iris';
  /** CSS filter standing in for the colour grade. */
  grade: string;
  bold?: boolean;
  shots: string;
  transitions: string;
  moves: string;
  look: string;
  text: string;
}

const STYLE_PREVIEWS: Record<AutoShortStyle, StylePreview> = {
  Auto: { cut: 1.2, kind: 'slide', grade: 'none', shots: 'Chosen for your length and picks', transitions: 'From the chosen styles', moves: 'From the chosen styles', look: 'From the chosen styles', text: 'Hook on top, captions under each shot' },
  Mixed: { cut: 1.2, kind: 'fade', grade: 'none', shots: 'Each short gets a different style', transitions: 'Varies per short', moves: 'Varies per short', look: 'Varies per short', text: 'Hook on top, captions under each shot' },
  Viral: { cut: 0.7, kind: 'up', grade: 'saturate(1.4) contrast(1.05)', bold: true, shots: '1.4-2.8s, fast like creator Shorts', transitions: 'Whip up / down, zoom-through, slide', moves: 'Punch-in and punch-out zooms, handheld', look: 'Vivid colour', text: 'White-box hook, big YELLOW words per shot' },
  DirectResponse: { cut: 0.85, kind: 'slide', grade: 'contrast(1.12) saturate(1.25)', bold: true, shots: '1.8-3.5s, high-retention ad pacing', transitions: 'Slide & push entrances, zoom-through', moves: 'Subtle slow push-in (Ken Burns) & punch zooms', look: 'Cosmic starry FX, neon glass cards', text: 'Glassmorphic hook, [accent] highlights & Order Now CTA' },
  Explainer: { cut: 1.1, kind: 'slide', grade: 'contrast(1.08) saturate(1.15)', shots: '2.0-4.0s, clear showcase cuts', transitions: 'Clean horizontal & vertical slides', moves: 'Steady slow push-in and pan', look: 'Crisp high-clarity grade', text: 'Structured pill cards & kinetic word pop' },
  Energetic: { cut: 0.9, kind: 'slide', grade: 'saturate(1.3)', shots: '1.6-3.2s', transitions: 'Slides and wipes', moves: 'Zooms, pans, handheld', look: 'Vivid colour', text: 'Black-box hook, typed captions' },
  Hype: { cut: 0.55, kind: 'slide', grade: 'saturate(1.5) contrast(1.1)', shots: '1-2s, the quickest', transitions: 'Hard slides and wipes', moves: 'Shaky, punchy zooms and tilts', look: 'Vivid colour', text: 'Black-box hook, typed captions' },
  Cinematic: { cut: 1.6, kind: 'fade', grade: 'contrast(1.1) saturate(0.85) sepia(0.12)', shots: '3-5s', transitions: 'Dissolves, fades, iris', moves: 'Slow drifts, zooms and pans', look: 'Film grade, warm or cool, vignette', text: 'Black-box hook, typed captions' },
  Dramatic: { cut: 1.4, kind: 'iris', grade: 'contrast(1.3) brightness(0.8) saturate(0.7)', shots: '2.5-4.5s', transitions: 'Iris open / close, dissolves', moves: 'Push-ins and tilts', look: 'Dark, contrasty, vignette', text: 'Black-box hook, typed captions' },
  Calm: { cut: 2, kind: 'fade', grade: 'saturate(0.9) sepia(0.15)', shots: '4-6.5s', transitions: 'Soft fades and dissolves', moves: 'Gentle breathing zooms', look: 'Warm or matte', text: 'Black-box hook, typed captions' },
  Dreamy: { cut: 2.4, kind: 'fade', grade: 'brightness(1.08) sepia(0.2) saturate(1.1)', shots: '4.5-7s, the slowest', transitions: 'Long dissolves', moves: 'Slow breathing and drift', look: 'Warm glow, vignette', text: 'Black-box hook, typed captions' },
  Retro: { cut: 1.6, kind: 'slide', grade: 'sepia(0.5) contrast(0.9) saturate(0.8)', shots: '3-5s', transitions: 'Fades and wipes', moves: 'Gentle pans', look: 'Faded film', text: 'Black-box hook, typed captions' },
};

/** A finished short to show as an example of a style. */
interface StyleExample { jobId: string; name: string; projectName: string }

const ORDERS: readonly { id: AutoShortOrder; label: string; hint: string }[] = [
  { id: 'InOrder', label: 'In order (1 → N)', hint: 'Keeps the exact sequence from your timeline or selection without shuffling.' },
  { id: 'VideosFirst', label: 'Videos first', hint: 'Each short plays its videos, then its pictures.' },
  { id: 'VideoFirst', label: 'Open on a video', hint: 'Each short starts on a video; the rest is mixed.' },
  { id: 'Shuffle', label: 'Shuffle', hint: 'Videos and pictures in any order.' },
];

interface Preset {
  id: string;
  icon: string;
  label: string;
  hint: string;
  layout: AutoShortLayout;
  seconds: number;
  count: number;
  style: AutoShortStyle;
  order: AutoShortOrder;
  imageSeconds?: number;
}

/** One click to a sensible batch; every setting stays editable afterwards. */
const PRESETS: readonly Preset[] = [
  { id: 'direct-ad', icon: '🌌', label: 'Direct Ad 30s', hint: 'Cosmic glass hook, 1-word pop & CTA in exact order', layout: 'Spread', seconds: 30, count: 0, style: 'DirectResponse', order: 'InOrder' },
  { id: 'teaser', icon: '🔥', label: 'Teasers 15s', hint: 'Five quick-cut 15s hooks', layout: 'FitLength', seconds: 15, count: 5, style: 'Hype', order: 'VideoFirst' },
  { id: 'reels', icon: '⚡', label: 'Reels 30s', hint: 'Exact 30s shorts, picks shared out', layout: 'Spread', seconds: 30, count: 0, style: 'Energetic', order: 'VideosFirst' },
  { id: 'shorts', icon: '▶️', label: 'Shorts 60s', hint: 'Exact 60s shorts, picks shared out', layout: 'Spread', seconds: 60, count: 0, style: 'Auto', order: 'VideosFirst' },
  { id: 'viral', icon: '🚀', label: 'Viral 30s', hint: 'Videos first, whip cuts, yellow captions', layout: 'Spread', seconds: 30, count: 0, style: 'Viral', order: 'VideosFirst' },
  { id: 'story', icon: '🎬', label: 'Story 90s', hint: 'Exact 90s, longer picture holds', layout: 'Spread', seconds: 90, count: 0, style: 'Cinematic', order: 'VideosFirst', imageSeconds: 7 },
];

const TEXT_MODES: readonly { id: AutoShortTextMode; label: string }[] = [
  { id: 'Hook', label: 'Hook on top' },
  { id: 'PerShot', label: 'Caption per shot' },
  { id: 'HookAndPerShot', label: 'Hook + captions' },
  { id: 'WordPop', label: '⚡ 1-Word Pop' },
  { id: 'HookAndWordPop', label: '⚡ Hook + 1-Word Pop' },
  { id: 'None', label: 'No text' },
];

const LAYOUTS: readonly { id: AutoShortLayout; icon: string; label: string; hint: string }[] = [
  { id: 'Spread', icon: '🧩', label: 'Share out', hint: 'Each pick goes into one short only, so no two shorts repeat. Pictures hold for the time you set; videos play in full (or up to your limit).' },
  { id: 'AllInEach', icon: '🔁', label: 'All in each', hint: 'Every short uses all your picks, each in its own order with its own moves.' },
  { id: 'FitLength', icon: '✂️', label: 'Quick cuts', hint: 'Fast shots from all your picks until each short hits the length exactly.' },
];

type SourceFilter = 'all' | 'video' | 'image' | 'unused' | 'leftover';
type SourceView = 'grid' | 'large' | 'list';
type SourceSort = 'videos' | 'name' | 'newest' | 'longest' | 'least-used';

const SOURCE_SORTS: readonly { id: SourceSort; label: string }[] = [
  { id: 'videos', label: 'Videos first' },
  { id: 'name', label: 'Name' },
  { id: 'newest', label: 'Newest' },
  { id: 'longest', label: 'Longest' },
  { id: 'least-used', label: 'Least used' },
];

const PREFS_KEY = 'animstudio.autoShorts.sources';
type AutoShortsRequest = Omit<AutoShortsBody, 'watermark'> & { watermark: boolean };

export const AUTO_SHORT_MIN_SECONDS = 5;
export const AUTO_SHORT_MAX_SECONDS = 180;
export const AUTO_SHORT_MIN_IMAGE_SECONDS = 1;
export const AUTO_SHORT_MAX_IMAGE_SECONDS = 30;
const MAX_LINES = 100;

const newSeed = (): number => Math.floor(Math.random() * 2_000_000_000);

/**
 * Auto Shorts: pick the clips, pictures and lines once, say how they are shared out and how
 * long each picture holds, and the server cuts that many different shorts - with camera
 * moves, transitions and text applied. Each short renders as its own job; together they are
 * one batch, which the Shorts page keeps after this dialog is closed.
 */
@Component({
  selector: 'app-auto-shorts',
  standalone: true,
  imports: [FormsModule, RouterLink, TopicPickerComponent],
  templateUrl: './auto-shorts.component.html',
  styleUrl: './auto-shorts.component.css',
})
export class AutoShortsComponent {
  readonly state = inject(StudioStateService);
  readonly activity = inject(ActivityService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly shorts = inject(ShortsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly formats = FORMATS;
  readonly styles = AUTO_SHORT_STYLES;
  readonly styleHints = STYLE_HINTS;
  readonly stylePreviews = STYLE_PREVIEWS;
  readonly textModes = TEXT_MODES;
  readonly layouts = LAYOUTS;
  readonly orders = ORDERS;
  readonly presets = PRESETS;
  readonly sorts = SOURCE_SORTS;
  readonly durations = [15, 30, 45, 60, 90, 180] as const;
  readonly counts = [3, 5, 10] as const;
  readonly imageChoices = [3, 5, 7, 10] as const;
  readonly clipChoices = [5, 10, 15, 30] as const;
  readonly maxCount = computed(() => this.state.studio()?.maxAutoShortsCount ?? 20);
  readonly minSeconds = AUTO_SHORT_MIN_SECONDS;
  readonly maxSeconds = AUTO_SHORT_MAX_SECONDS;
  readonly minImageSeconds = AUTO_SHORT_MIN_IMAGE_SECONDS;
  readonly maxImageSeconds = AUTO_SHORT_MAX_IMAGE_SECONDS;
  readonly runTime = formatRunTime;

  // --- sources ---
  readonly filter = signal<SourceFilter>('all');
  readonly query = signal('');
  readonly view = signal<SourceView>('grid');
  readonly sort = signal<SourceSort>('videos');
  readonly picked = signal<ReadonlySet<string>>(this.initialPick());

  /** How many renders each file is already in; null until loaded (or when it couldn't be). */
  readonly usage = signal<Record<string, number> | null>(null);

  readonly sources = computed(() => this.state.autoShortSources());
  readonly visible = computed(() => {
    const f = this.filter();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = this.sources().filter((c) => {
      if (f === 'unused') { if (this.uses(c) > 0) return false; }
      else if (f === 'leftover') { if (!this.isPicked(c) || !this.isLeftOver(c)) return false; }
      else if (f !== 'all' && this.kindOf(c) !== f) return false;
      const name = c.name.toLowerCase();
      return words.every((w) => name.includes(w));
    });
    return this.sorted(shown);
  });
  readonly pickedClips = computed(() => this.sources().filter((c) => this.picked().has(this.idOf(c))));
  readonly pickedVideos = computed(() => this.pickedClips().filter((c) => this.kindOf(c) === 'video').length);
  readonly pickedImages = computed(() => this.pickedClips().filter((c) => this.kindOf(c) === 'image').length);
  readonly unusedCount = computed(() => this.sources().filter((c) => this.uses(c) === 0).length);
  readonly byId = computed(() => new Map(this.sources().map((c) => [this.idOf(c), c] as const)));
  /** Which planned shorts (1-based) each file plays in. */
  readonly shortsOf = computed(() => {
    const map = new Map<string, number[]>();
    (this.preview()?.shorts ?? []).forEach((s, k) => {
      for (const id of s.assetIds) map.set(id, [...(map.get(id) ?? []), k + 1]);
    });
    return map;
  });
  readonly leftOverCount = computed(() => this.preview()?.unusedAssetIds.length ?? 0);

  // --- options ---
  readonly layout = signal<AutoShortLayout>('Spread');
  readonly layoutHint = computed(() => LAYOUTS.find((l) => l.id === this.layout())?.hint ?? '');
  /** 0 with Share out: as many shorts as it takes to use every pick once. */
  readonly count = signal(0);
  /** The exact length with quick cuts; the most a short may run otherwise. */
  readonly seconds = signal(60);
  /** Share out and All in each: every short runs exactly the length instead of up to it. */
  readonly exact = signal(true);
  readonly order = signal<AutoShortOrder>('VideosFirst');
  readonly orderHint = computed(() => ORDERS.find((o) => o.id === this.order())?.hint ?? '');
  /** Fixed until reshuffled, so the plan shown is the plan that renders. */
  readonly seed = signal(newSeed());
  readonly showPlan = signal(false);
  readonly imageSeconds = signal(5);
  /** null plays every video in full. */
  readonly maxClipSeconds = signal<number | null>(null);
  readonly formatId = signal('9:16');
  readonly format = computed(() => FORMATS.find((f) => f.id === this.formatId()) ?? FORMATS[0]);
  readonly style = signal<AutoShortStyle>('Auto');
  readonly stylePreview = computed(() => STYLE_PREVIEWS[this.style()]);
  /** The latest finished short in each style: this project's first, then any project's. */
  readonly styleExamples = signal<ReadonlyMap<string, StyleExample>>(new Map());
  readonly styleExample = computed(() => this.styleExamples().get(this.style()) ?? null);
  /** The example short playing under the styles, if one is open. */
  readonly playingExample = signal<string | null>(null);
  readonly textMode = signal<AutoShortTextMode>('Hook');
  readonly linesText = signal('');
  readonly lines = computed(() =>
    this.linesText().split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, MAX_LINES));
  readonly musicIds = signal<ReadonlySet<string>>(this.initialMusic());
  readonly transitions = signal(true);
  readonly motion = signal(true);
  readonly keepClipAudio = signal(true);
  readonly watermark = signal(true);
  readonly outro = signal(false);
  readonly fit = signal<ClipFit>('BlurredBackdrop');
  readonly quality = signal<ExportQuality>('High');
  readonly name = signal(this.defaultName());

  readonly musicOptions = computed(() => this.state.musicCandidates());

  // --- Google Drive: copy each short there as it finishes (done on the server) ---
  /** The personal Drive, then what each connected channel uses; null while loading. */
  readonly drives = signal<GoogleDriveStatus[] | null>(null);
  readonly anyDrive = computed(() => (this.drives() ?? []).some((d) => d.connected && !d.needsReconnect));
  readonly driveOn = signal(false);
  /** The shared topic every short of the batch is for; null for none. */
  readonly topicId = signal<string | null>(null);
  /** '' is the personal Drive. */
  readonly driveChannelId = signal('');
  readonly driveTarget = computed(() =>
    (this.drives() ?? []).find((d) => (d.channelId ?? '') === this.driveChannelId()) ?? null);
  /** Empty uses the channel's (or the Drive's) own folder. */
  readonly driveFolder = signal('');
  readonly driveFolders = signal<string[]>([]);
  readonly driveFolderOrDefault = computed(() => this.driveFolder().trim() || this.driveTarget()?.folderName || '');
  readonly driveFolderError = computed<string | null>(() => {
    const name = this.driveFolder().trim();
    return name && !isValidDriveFolderName(name)
      ? 'Use a folder name of up to 100 letters, digits, spaces and - _ . ( ) &.'
      : null;
  });

  /** The request as the settings stand; drives both the preview and the real thing. */
  readonly body = computed<AutoShortsRequest>(() => {
    const f = this.format();
    const known = new Set(this.sources().map((c) => this.idOf(c)));
    return {
      sourceAssetIds: [...this.picked()].filter((id) => known.has(id)),
      lines: this.lines(),
      musicAssetIds: [...this.musicIds()],
      count: this.count(),
      targetSeconds: this.seconds(),
      layout: this.layout(),
      imageSeconds: this.imageSeconds(),
      maxClipSeconds: this.maxClipSeconds(),
      exactLength: this.layout() === 'FitLength' || this.exact(),
      order: this.order(),
      seed: this.seed(),
      style: this.style(),
      textMode: this.lines().length > 0 ? this.textMode() : 'None',
      transitions: this.transitions(),
      motion: this.motion(),
      keepClipAudio: this.keepClipAudio(),
      exportName: this.name().trim() || null,
      width: f.width,
      height: f.height,
      fit: this.fit(),
      quality: this.quality(),
      watermark: this.watermark(),
      includeOutro: this.outro(),
      saveToDrive: this.driveOn(),
      topicId: this.topicId(),
      driveChannelId: this.driveOn() ? this.driveChannelId() || null : null,
      driveFolderName: this.driveOn() ? this.driveFolder().trim() || null : null,
    };
  });

  /** The plan the server would make with the settings as they are; null while it's being worked out. */
  readonly preview = signal<AutoShortsPreview | null>(null);
  readonly previewError = signal<string | null>(null);
  readonly plannedRange = computed(() => {
    const p = this.preview();
    if (!p || p.shorts.length === 0) return null;
    const lengths = p.shorts.map((s) => s.seconds);
    return { min: Math.min(...lengths), max: Math.max(...lengths), total: lengths.reduce((a, b) => a + b, 0) };
  });
  /** How many shorts the button promises: the plan's count once known. */
  readonly planned = computed(() => this.preview()?.shorts.length ?? (this.count() || null));
  private readonly previewRequests = new Subject<AutoShortsRequest>();

  readonly blocked = computed<string | null>(() => {
    if (this.state.blockedReason()) return this.state.blockedReason();
    if (this.pickedClips().length === 0) return 'Pick at least one clip or picture.';
    if (this.driveOn()) {
      const d = this.driveTarget();
      if (!d?.connected) return 'Choose a Drive that is connected, or turn off saving to Drive.';
      if (d.needsReconnect) return 'That Google Drive needs connecting again.';
      if (this.driveFolderError()) return this.driveFolderError();
    }
    return null;
  });

  readonly submitting = signal(false);
  readonly queued = signal<AutoShortsResult | null>(null);
  /** Live state of each queued short, from the activity panel's polling. */
  readonly queuedRows = computed(() => (this.queued()?.jobs ?? []).map((job) => {
    const live = this.activity.jobItem(job.jobId);
    return {
      job,
      state: live?.state ?? 'running',
      percent: live?.percent ?? 0,
      detail: live?.detail ?? job.status,
    };
  }));
  readonly queuedDone = computed(() => this.queuedRows().filter((r) => r.state !== 'running').length);

  constructor() {
    this.readPrefs();
    this.loadUsage();
    this.loadStyleExamples();

    effect(() => {
      if (this.count() > this.maxCount()) this.setCount(this.maxCount());
    });

    // Re-plan on the server (nothing queued) whenever a setting that shapes the batch changes.
    this.previewRequests.pipe(
      debounceTime(350),
      switchMap((body) => {
        const call = this.state.previewAutoShorts(body);
        if (!call) return of(null);
        return call.pipe(catchError((err: unknown) => {
          this.previewError.set((err as { message?: string } | null)?.message || 'Could not work out the plan.');
          return of(null);
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((p) => this.preview.set(p));

    effect(() => {
      const body = this.body();
      this.preview.set(null);
      this.previewError.set(null);
      if (body.sourceAssetIds.length > 0) this.previewRequests.next(body);
    });

    // Optional: without it the batch still renders, just without the Drive copies.
    this.youtube.driveConnections().pipe(catchError(() => of([] as GoogleDriveStatus[]))).subscribe((list) => {
      this.drives.set(list);
      const first = list.find((d) => d.connected && !d.needsReconnect);
      if (first) {
        this.pickDriveChannel(first.channelId ?? '');
        if (this.topicId()) this.driveOn.set(true);
      }
    });
  }

  pickTopic(id: string | null): void {
    this.topicId.set(id);
    if (id && this.anyDrive()) {
      this.driveOn.set(true);
    }
  }

  pickDriveChannel(channelId: string): void {
    this.driveChannelId.set(channelId);
    this.driveFolder.set('');
    this.driveFolders.set([]);
    const d = this.driveTarget();
    if (!d?.connected || d.needsReconnect) return;
    this.youtube.driveFolders(channelId || null).pipe(catchError(() => of([] as string[])))
      .subscribe((f) => { if (this.driveChannelId() === channelId) this.driveFolders.set(f); });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.submitting()) this.close();
  }

  close(): void {
    this.state.autoShortsOpen.set(false);
  }

  idOf(c: Clip): string {
    return this.state.resolveAssetId(c);
  }

  kindOf(c: Clip): 'video' | 'image' {
    return this.state.getClipType(c) === 'image' ? 'image' : 'video';
  }

  thumb(c: Clip): string {
    return this.state.assetThumbnailUrl(c);
  }

  isPicked(c: Clip): boolean {
    return this.picked().has(this.idOf(c));
  }

  /** How many renders the file is already in (0 when unknown). */
  uses(c: Clip): number {
    return this.usage()?.[this.idOf(c)] ?? 0;
  }

  /** Picked, but the plan leaves it out of every short. */
  isLeftOver(c: Clip): boolean {
    return this.preview()?.unusedAssetIds.includes(this.idOf(c)) ?? false;
  }

  toggle(c: Clip): void {
    const id = this.idOf(c);
    this.picked.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  pickVisible(on: boolean): void {
    const ids = this.visible().map((c) => this.idOf(c));
    this.picked.update((s) => {
      const next = new Set(s);
      for (const id of ids) { if (on) next.add(id); else next.delete(id); }
      return next;
    });
  }

  /** Only what no short has used yet - for a batch that is all new. */
  pickUnused(): void {
    this.picked.set(new Set(this.sources().filter((c) => this.uses(c) === 0).map((c) => this.idOf(c))));
  }

  /**
   * Picks the clips arranged on the open timeline in exact sequence order (1 → N)
   * and sets Order to 'InOrder' so sequential shorts follow the timeline cut.
   */
  pickTimelineInOrder(): void {
    const ids = this.state.timelineOrderedAssetIds();
    if (ids.length === 0) return;
    this.picked.set(new Set(ids));
    this.layout.set('Spread');
    this.count.set(0);
    this.order.set('InOrder');
  }

  toggleMusic(id: string): void {
    this.musicIds.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  setLayout(l: AutoShortLayout): void {
    this.layout.set(l);
    // "Auto" only means something when picks are shared out.
    if (l !== 'Spread' && this.count() === 0) this.setCount(Math.min(3, this.maxCount()));
    if (l === 'FitLength' && this.seconds() > 90) this.seconds.set(30);
  }

  setCount(v: number): void {
    const min = this.layout() === 'Spread' ? 0 : 1;
    this.count.set(Math.min(this.maxCount(), Math.max(min, Math.round(Number(v) || min))));
  }

  setSeconds(v: number): void {
    this.seconds.set(Math.min(AUTO_SHORT_MAX_SECONDS, Math.max(AUTO_SHORT_MIN_SECONDS, Math.round(Number(v) || 30))));
  }

  setImageSeconds(v: number): void {
    this.imageSeconds.set(Math.min(AUTO_SHORT_MAX_IMAGE_SECONDS, Math.max(AUTO_SHORT_MIN_IMAGE_SECONDS, Math.round(Number(v) || 5))));
  }

  setMaxClipSeconds(v: number | null): void {
    const n = Math.round(Number(v));
    this.maxClipSeconds.set(v === null || !n ? null : Math.min(AUTO_SHORT_MAX_SECONDS, Math.max(1, n)));
  }

  formatDuration(c: Clip): string {
    return this.kindOf(c) === 'video' && c.durationSeconds ? formatRunTime(c.durationSeconds) : '';
  }

  /** "#2" or "#2, #5" - which planned shorts a pick plays in. */
  shortsLabel(c: Clip): string {
    return (this.shortsOf().get(this.idOf(c)) ?? []).map((n) => '#' + n).join(', ');
  }

  thumbFor(id: string): string | null {
    const c = this.byId().get(id);
    return c ? this.thumb(c) : null;
  }

  nameFor(id: string): string {
    return this.byId().get(id)?.name ?? '';
  }

  setView(v: SourceView): void {
    this.view.set(v);
    this.savePrefs();
  }

  setSort(v: SourceSort): void {
    this.sort.set(v);
    this.savePrefs();
  }

  reshuffle(): void {
    this.seed.set(newSeed());
  }

  applyPreset(p: Preset): void {
    this.setLayout(p.layout);
    this.setSeconds(p.seconds);
    this.setCount(p.count);
    this.exact.set(true);
    this.style.set(p.style);
    // Kept even before any video is picked: a short with no video comes out the same either
    // way, and dropping to Shuffle here used to stick once videos were added.
    this.order.set(p.order);
    if (p.imageSeconds) this.setImageSeconds(p.imageSeconds);
    this.motion.set(true);
    this.transitions.set(true);
    if (this.lines().length > 0 && this.textMode() === 'None') this.textMode.set('Hook');
  }

  /**
   * Settings that suit the picks: shared out, exact length, videos first, and a length the
   * picks can fill - 60s when they run that long, else 30s (90s for a 16:9 video).
   */
  autoSetup(): void {
    this.setImageSeconds(5);
    this.setMaxClipSeconds(null);
    const natural = this.pickedClips().reduce((sum, c) => sum + (this.kindOf(c) === 'video'
      ? c.durationSeconds ?? 0
      : this.imageSeconds()), 0);
    const seconds = this.formatId() === '16:9' && natural >= 90 ? 90 : natural >= 60 ? 60 : 30;
    this.applyPreset({ ...PRESETS[2], seconds });
    this.reshuffle();
  }

  create(): void {
    if (this.blocked() || this.submitting()) return;
    this.submitting.set(true);
    this.state.queueAutoShorts(
      this.body(),
      (result) => {
        this.queued.set(result);
        this.reshuffle();
        // What this batch used is no longer new.
        this.loadUsage();
      },
      () => this.submitting.set(false),
    );
  }

  private sorted(list: Clip[]): Clip[] {
    const name = (a: Clip, b: Clip) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    const out = [...list];
    switch (this.sort()) {
      case 'name': return out.sort(name);
      case 'newest': return out.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || name(a, b));
      case 'longest': return out.sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0) || name(a, b));
      case 'least-used': return out.sort((a, b) => this.uses(a) - this.uses(b) || name(a, b));
      default: {
        // Videos first, each kind in library order.
        const rank = (c: Clip) => (this.kindOf(c) === 'video' ? 0 : 1);
        return out.sort((a, b) => rank(a) - rank(b));
      }
    }
  }

  private readPrefs(): void {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { view?: SourceView; sort?: SourceSort };
      if (p.view === 'grid' || p.view === 'large' || p.view === 'list') this.view.set(p.view);
      const sort = SOURCE_SORTS.find((s) => s.id === p.sort);
      if (sort) this.sort.set(sort.id);
    } catch {
      // Storage blocked or unreadable: the defaults do.
    }
  }

  private savePrefs(): void {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ view: this.view(), sort: this.sort() }));
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  }

  pickStyle(s: AutoShortStyle): void {
    this.style.set(s);
    this.playingExample.set(null);
  }

  /** Each style's latest finished short, so a style can be watched before a batch uses it. */
  private loadStyleExamples(): void {
    const projectId = this.state.store.project()?.id ?? null;
    this.shorts.overview(null).pipe(catchError(() => of(null))).subscribe((o) => {
      if (!o) return;
      const map = new Map<string, StyleExample>();
      const ready = o.shorts
        .filter((r) => r.job.batchStyle && r.job.hasOutput && r.job.status.startsWith('Completed'))
        // This project's own shorts first, newest first within each.
        .sort((a, b) => Number(b.job.projectId === projectId) - Number(a.job.projectId === projectId)
          || b.job.createdAt.localeCompare(a.job.createdAt));
      for (const r of ready) {
        const style = r.job.batchStyle!;
        if (!map.has(style)) map.set(style, { jobId: r.job.jobId, name: r.job.name ?? 'Short', projectName: r.projectName });
      }
      this.styleExamples.set(map);
    });
  }

  private loadUsage(): void {
    const projectId = this.state.store.project()?.id;
    if (!projectId) return;
    this.shorts.usage(projectId).pipe(catchError(() => of(null))).subscribe((u) => { if (u) this.usage.set(u); });
  }

  private initialPick(): ReadonlySet<string> {
    const lib = [...this.state.selectedLibraryIds()].map((id) => this.state.resolveAssetId(id));
    const available = new Set(this.state.autoShortSources().map((c) => this.state.resolveAssetId(c)));
    const chosen = lib.filter((id) => available.has(id));
    return new Set(chosen.length > 0 ? chosen : available);
  }

  private initialMusic(): ReadonlySet<string> {
    const bed = this.state.musicAssetId();
    return new Set(bed ? [bed] : []);
  }

  private defaultName(): string {
    const project = this.state.store.project()?.name;
    return project ? `${project} short` : 'Auto short';
  }
}
