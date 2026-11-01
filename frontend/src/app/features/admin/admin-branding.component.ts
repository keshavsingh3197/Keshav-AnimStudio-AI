import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, CanDeactivateFn, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subscription, concat, finalize, map, tap, toArray } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { BrandChannel, DEFAULT_BRAND_CHANNEL, OutroKind, WatermarkKind, WatermarkPosition } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { StatusService } from '../../core/services/status.service';
import { ChannelPickerComponent } from '../../shared/channel-picker.component';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { ImageCropDialogComponent } from '../../shared/image-crop-dialog.component';
import { BrandDialogComponent } from './brand-dialog.component';
import { BrandEndCardMockComponent } from './brand-endcard-mock.component';
import { BrandRangeComponent } from './brand-range.component';
import { BrandWatermarkStageComponent } from './brand-watermark-stage.component';
import { DraftStore } from './branding-draft';
import {
  BACKDROPS, CHUNK_EXAMPLES, CHUNK_FIELDS, CHUNK_PRESETS, CONTRAST_BACKDROPS, DEFAULT_PREFS, DEFAULT_WATERMARK_STYLE, END_FORMATS,
  IMAGE_PRESETS, OUTRO_FIELDS, OUTRO_LIMITS, PREFS_KEY, PREVIEW_ASPECTS, POSITION_ARROW, POSITION_GRID, POSITION_LABEL,
  WATERMARK_FIELDS, WM_LIMITS,
  checkQrSize, checkUpload, chunkPlan, contrastRatio, diffDrafts, effectiveInsetPct, formatDuration, framesToSeconds,
  normalizeHex, outroBodyFromDraft, outroDraftFromBody, parsePrefs, parseRgb, placementHint, round, scriptLang, secondsToFrames,
  stepPosition, suggestBackplate, summarizeChanges, textMarkContrast, transitionLabel, trimNumber, validateChunkSeconds,
  validateImageSeconds, watermarkBodyFromDraft, watermarkDraftFromBody,
  type Aspect, type ChunkDraft, type EndCardFormat, type FieldChange, type OutroDraft, type PreviewBackdrop, type QrCheck,
  type WatermarkDraft,
} from './branding.logic';

type BrandingSection = 'watermark' | 'outro' | 'chunking';
type PreviewMode = 'layout' | 'render';
type SaveStep = Observable<unknown>;

interface Note {
  readonly tone: 'ok' | 'info' | 'warn' | 'error';
  readonly text: string;
}

interface Flash {
  readonly text: string;
  readonly tone: 'ok' | 'info';
  /** Offer an Undo link next to the message. */
  readonly undo: boolean;
}

interface LanguagePreset {
  readonly id: string;
  readonly label: string;
  readonly headline: string;
  readonly subtext: string;
  readonly headline2: string;
  readonly subtext2: string;
}

const HEADINGS: Record<BrandingSection | 'all', { title: string; subtitle: string }> = {
  watermark: {
    title: 'Watermark',
    subtitle: 'The mark stamped on every video of a channel. Projects on that channel follow it unless they set their own.',
  },
  outro: {
    title: 'End card',
    subtitle: 'What each channel\'s videos finish with: a bumper video, a graphic, or a support card with a QR code.',
  },
  chunking: {
    title: 'Video chunking',
    subtitle: 'How long videos are cut into clips, and how long an image plays when it joins a timeline.',
  },
  all: { title: 'Branding & video defaults', subtitle: 'Watermarks, end cards and video segmentation.' },
};

/** The route's leave guard: asks about unsaved edits before the page is left. */
const leaveGuard: CanDeactivateFn<AdminBrandingComponent> = (component) => component.confirmLeave();

function messageOf(error: unknown): string {
  return error instanceof ApiFailure ? error.message : 'Something went wrong.';
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

/**
 * Watermark, end card and video chunking: one component, three pages (the route says which).
 * <p>
 * Every form is a draft kept next to what the server holds, so the page always knows what is
 * unsaved: the bar at the bottom shows it, Ctrl+S saves, Escape asks before discarding, undo
 * steps back through the edits, and leaving the page (a link, the channel picker, a reload, a
 * closed tab) asks first. Uploads are the one thing the server applies at once; they update
 * the baseline too, so they never read as unsaved changes.
 * </p>
 */
@Component({
  selector: 'app-admin-branding',
  imports: [
    NgTemplateOutlet, RouterLink, FileDropDirective, ChannelPickerComponent, ImageCropDialogComponent,
    BrandRangeComponent, BrandDialogComponent, BrandWatermarkStageComponent, BrandEndCardMockComponent,
  ],
  templateUrl: './admin-branding.component.html',
  styleUrls: ['./admin-branding.component.css'],
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class AdminBrandingComponent {
  private readonly api = inject(ApiService);
  private readonly mediaTools = inject(MediaToolsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly status = inject(StatusService);

  // --- Static options -----------------------------------------------------------------------

  readonly watermarkKinds: readonly { kind: WatermarkKind; title: string; hint: string }[] = [
    { kind: 'None', title: 'No watermark', hint: 'Videos export clean' },
    { kind: 'Text', title: 'Text mark', hint: 'A brand name or web address' },
    { kind: 'Logo', title: 'Logo image', hint: 'A PNG with a transparent background' },
  ];
  readonly outroKinds: readonly { kind: OutroKind; title: string; hint: string }[] = [
    { kind: 'None', title: 'No end card', hint: 'Videos end on their last scene' },
    { kind: 'Video', title: 'Bumper video', hint: 'MP4, WebM or MOV' },
    { kind: 'Image', title: 'End graphic', hint: 'PNG, JPG or WEBP' },
    { kind: 'Card', title: 'Support card', hint: 'A QR code and a message' },
  ];
  readonly outroTransitions: readonly string[] = ['Fade', 'Dissolve', 'None', 'WipeLeft', 'WipeRight'];
  readonly transitionLabel = transitionLabel;
  readonly aspects = PREVIEW_ASPECTS;
  readonly endFormats = END_FORMATS;
  readonly backdropOptions: readonly { id: PreviewBackdrop; label: string }[] = [
    { id: 'scene', label: 'Scene' }, { id: 'dark', label: 'Dark' }, { id: 'mid', label: 'Mid' }, { id: 'bright', label: 'Bright' },
  ];
  readonly positionRows = POSITION_GRID.map((row) => ({
    clear: row.every((cell) => cell === null),
    cells: row.filter((cell): cell is WatermarkPosition => cell !== null),
  }));
  readonly positionLabel = (p: WatermarkPosition): string => POSITION_LABEL[p];
  readonly positionArrow = (p: WatermarkPosition): string => POSITION_ARROW[p];
  readonly wmLimits = WM_LIMITS;
  readonly outroLimits = OUTRO_LIMITS;
  readonly looks = [
    { id: 'subtle', label: 'Subtle', hint: 'small, see-through', opacity: 0.6, height: 4.5, margin: 3 },
    { id: 'standard', label: 'Standard', hint: 'the studio default', opacity: 0.8, height: 5.5, margin: 4 },
    { id: 'bold', label: 'Bold', hint: 'large and solid', opacity: 1, height: 8, margin: 4 },
  ] as const;
  readonly chunkPresets = CHUNK_PRESETS;
  readonly imagePresets = IMAGE_PRESETS;
  readonly chunkExamples = CHUNK_EXAMPLES;
  readonly formatDuration = formatDuration;
  readonly trimNumber = trimNumber;
  readonly scriptLang = scriptLang;
  readonly saveKey = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '\u2318S' : 'Ctrl+S';

  /** Ready-made wording, so a bilingual card is one click rather than four fields. */
  readonly languagePresets: readonly LanguagePreset[] = [
    {
      id: 'en', label: 'English',
      headline: 'Support us for more videos like this', subtext: 'Scan the QR code', headline2: '', subtext2: '',
    },
    {
      id: 'hi', label: 'हिन्दी',
      headline: 'इस तरह के और वीडियो के लिए हमारा समर्थन करें', subtext: 'QR कोड स्कैन करें', headline2: '', subtext2: '',
    },
    {
      id: 'en-hi', label: 'English + हिन्दी',
      headline: 'Support us for more videos like this', subtext: 'Scan the QR code',
      headline2: 'इस तरह के और वीडियो के लिए हमारा समर्थन करें', subtext2: 'QR कोड स्कैन करें',
    },
    {
      id: 'hi-en', label: 'हिन्दी + English',
      headline: 'इस तरह के और वीडियो के लिए हमारा समर्थन करें', subtext: 'QR कोड स्कैन करें',
      headline2: 'Support us for more videos like this', subtext2: 'Scan the QR code',
    },
  ];

  // --- Which page this is ---------------------------------------------------------------------
  // One component serves the Watermark, End card and Video chunking pages; the route says
  // which. With no section (an old /admin/branding bookmark) everything shows, as before.

  readonly section = toSignal(this.route.data.pipe(map((d) => (d['section'] as BrandingSection | undefined) ?? null)),
    { initialValue: null });

  shows(s: BrandingSection): boolean {
    const current = this.section();
    return current === null || current === s;
  }

  readonly heading = computed(() => HEADINGS[this.section() ?? 'all']);

  // --- The three drafts --------------------------------------------------------------------------

  readonly wm = new DraftStore<WatermarkDraft>(() => watermarkDraftFromBody(null), WATERMARK_FIELDS);
  readonly outro = new DraftStore<OutroDraft>(() => outroDraftFromBody(null), OUTRO_FIELDS);
  readonly chunk = new DraftStore<ChunkDraft>(() => ({ chunkSeconds: 10, imageSeconds: 5 }), CHUNK_FIELDS);

  private readonly visibleStores = computed(() => {
    const stores: DraftStore<any>[] = [];
    if (this.shows('watermark')) stores.push(this.wm);
    if (this.shows('outro')) stores.push(this.outro);
    if (this.shows('chunking')) stores.push(this.chunk);
    return stores;
  });

  /** Undo and redo act on the page's own form. */
  readonly activeStore = computed<DraftStore<any>>(() =>
    this.section() === 'outro' ? this.outro : this.section() === 'chunking' ? this.chunk : this.wm);

  readonly hasUnsaved = computed(() => this.visibleStores().some((s) => s.dirty()));
  readonly allChanges = computed<FieldChange[]>(() => this.visibleStores().flatMap((s) => s.changes()));
  readonly changeSummary = computed(() => summarizeChanges(this.allChanges()));

  // --- Loading ---------------------------------------------------------------------------------------

  private readonly wmLoaded = signal(false);
  private readonly outroLoaded = signal(false);
  private readonly mediaLoaded = signal(false);
  private readonly wmError = signal<string | null>(null);
  private readonly outroError = signal<string | null>(null);
  private readonly mediaError = signal<string | null>(null);
  private loadSeq = 0;

  readonly loading = computed(() =>
    (this.shows('watermark') && !this.wmLoaded() && !this.wmError())
    || (this.shows('outro') && !this.outroLoaded() && !this.outroError())
    || (this.shows('chunking') && !this.mediaLoaded() && !this.mediaError()));

  readonly loadError = computed(() =>
    (this.shows('watermark') ? this.wmError() : null)
    ?? (this.shows('outro') ? this.outroError() : null)
    ?? (this.shows('chunking') ? this.mediaError() : null));

  readonly ready = computed(() => !this.loading() && !this.loadError());

  // --- Brand channels: one watermark + end card per YouTube channel ---------------------------------
  // Everything below the channel bar edits the selected channel; "default" is the studio's
  // original branding, used by every project that has not picked a channel.

  readonly channels = signal<BrandChannel[]>([]);
  readonly channelsError = signal<string | null>(null);
  /** Starts from ?channel= so the Channels page can link straight to one channel's look. */
  readonly selectedChannelId = signal<string>(
    this.route.snapshot.queryParamMap.get('channel') || DEFAULT_BRAND_CHANNEL);

  selectedChannel(): BrandChannel | undefined {
    return this.channels().find((c) => c.id === this.selectedChannelId());
  }

  readonly otherChannels = computed(() => this.channels().filter((c) => c.id !== this.selectedChannelId()));

  selectChannel(id: string): void {
    if (id === this.selectedChannelId()) return;
    void this.confirmUnsaved('switch channels').then((ok) => {
      if (!ok) return;
      this.selectedChannelId.set(id);
      this.resetRender();
      this.loadChannelBranding();
      // In the address too, so a reload or a shared link opens the same channel.
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { channel: id === DEFAULT_BRAND_CHANNEL ? null : id },
        replaceUrl: true,
      });
    });
  }

  retryChannels(): void {
    this.loadChannels();
  }

  private loadChannels(): void {
    this.api.listBrandChannels().subscribe({
      next: (list) => {
        this.channelsError.set(null);
        this.applyChannels(list);
      },
      error: (e) => this.channelsError.set(messageOf(e)),
    });
  }

  private applyChannels(list: BrandChannel[]): void {
    this.channels.set(list);
    // The selected channel was deleted (here or elsewhere): fall back to the default.
    if (!list.some((c) => c.id === this.selectedChannelId())) {
      this.selectedChannelId.set(DEFAULT_BRAND_CHANNEL);
      this.loadChannelBranding();
    }
  }

  // --- Preview preferences (remembered in this browser) -----------------------------------------------

  readonly aspect = signal<Aspect>(PREVIEW_ASPECTS[0]);
  readonly guides = signal(DEFAULT_PREFS.guides);
  readonly backdrop = signal<PreviewBackdrop>(DEFAULT_PREFS.backdrop);
  readonly endFormat = signal<EndCardFormat>(DEFAULT_PREFS.endFormat);
  readonly previewMode = signal<PreviewMode>('layout');
  readonly exampleSeconds = signal(600);
  /** Height of the app's sticky top bar, so the sticky preview parks just below it (the bar grows on a phone). */
  readonly topOffset = signal(60);

  constructor() {
    const prefs = parsePrefs(this.readPrefs());
    this.aspect.set(PREVIEW_ASPECTS.find((a) => a.label === prefs.aspect) ?? PREVIEW_ASPECTS[0]);
    this.guides.set(prefs.guides);
    this.backdrop.set(BACKDROPS.includes(prefs.backdrop) ? prefs.backdrop : DEFAULT_PREFS.backdrop);
    this.endFormat.set(prefs.endFormat);

    const topbar = document.querySelector<HTMLElement>('.topbar');
    const topbarWatcher = topbar && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => this.topOffset.set(Math.round(topbar.getBoundingClientRect().height)))
      : null;
    if (topbar && topbarWatcher) {
      this.topOffset.set(Math.round(topbar.getBoundingClientRect().height));
      topbarWatcher.observe(topbar);
    }

    effect(() => {
      const stored = {
        aspect: this.aspect().label, guides: this.guides(), backdrop: this.backdrop(), endFormat: this.endFormat(),
      };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(stored));
      } catch {
        // Storage blocked (private mode): the choices still apply for this visit.
      }
    });

    // A closed tab or a reload: the browser's own "leave site?" prompt.
    const beforeUnload = (event: BeforeUnloadEvent): void => {
      if (!this.hasUnsaved()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);

    // The route table is owned elsewhere, so the page adds its own leave guard to its route.
    const config = this.route.routeConfig;
    if (config && !(config.canDeactivate ?? []).includes(leaveGuard)) {
      config.canDeactivate = [...(config.canDeactivate ?? []), leaveGuard];
    }

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('beforeunload', beforeUnload);
      topbarWatcher?.disconnect();
      if (config?.canDeactivate) config.canDeactivate = config.canDeactivate.filter((g) => g !== leaveGuard);
      if (config && config.canDeactivate?.length === 0) delete config.canDeactivate;
      if (this.flashTimer) clearTimeout(this.flashTimer);
      if (this.savedTimer) clearTimeout(this.savedTimer);
      this.renderSub?.unsubscribe();
      this.setRender(null, '');
      this.prompt()?.resolve(false);
    });

    this.reload();
  }

  private readPrefs(): string | null {
    try {
      return localStorage.getItem(PREFS_KEY);
    } catch {
      return null;
    }
  }

  // --- Loading, reloading -------------------------------------------------------------------------------

  /** Re-reads everything this page shows from the server (asks first when edits would be lost). */
  requestReload(): void {
    void this.confirmUnsaved('reload').then((ok) => {
      if (ok) this.reload();
    });
  }

  reload(): void {
    if (this.shows('watermark') || this.shows('outro')) {
      this.loadChannels();
      this.loadChannelBranding();
    }
    if (this.shows('chunking')) this.loadMedia();
  }

  /** Loads the selected channel's watermark and end card into the forms. */
  private loadChannelBranding(): void {
    const channel = this.selectedChannelId();
    const seq = ++this.loadSeq;
    const stale = () => seq !== this.loadSeq || channel !== this.selectedChannelId();
    this.saveError.set(null);
    this.recentlySaved.set(false);
    this.logoNote.set(null);
    this.qrNote.set(null);
    this.mediaNote.set(null);
    this.qrInfo.set(null);

    if (this.shows('watermark')) {
      // A channel with nothing set yet shows blank forms, not the previous channel's values.
      this.wm.load(null);
      this.wmLoaded.set(false);
      this.wmError.set(null);
      this.status.run(
        this.api.getGlobalBranding(channel).pipe(tap({ error: (e) => { if (!stale()) this.wmError.set(messageOf(e)); } })),
        (wm) => {
          if (stale()) return; // switched away meanwhile
          this.wm.load(watermarkDraftFromBody(wm));
          this.logoStamp.set(Date.now());
          this.wmLoaded.set(true);
        },
      );
    }

    if (this.shows('outro')) {
      this.outro.load(null);
      this.outroLoaded.set(false);
      this.outroError.set(null);
      this.api.getGlobalOutro(channel).subscribe({
        next: (o) => {
          if (stale()) return;
          this.outro.load(outroDraftFromBody(o));
          this.mediaStamp.set(Date.now());
          this.outroLoaded.set(true);
        },
        error: (e) => { if (!stale()) this.outroError.set(messageOf(e)); },
      });
    }
  }

  private loadMedia(): void {
    const seq = ++this.loadSeq;
    this.mediaLoaded.set(false);
    this.mediaError.set(null);
    this.mediaTools.getMediaSettings().subscribe({
      next: (settings) => {
        if (seq !== this.loadSeq) return;
        this.chunk.load({
          chunkSeconds: settings.defaultChunkDurationSeconds || 10,
          imageSeconds: settings.defaultImageDurationSeconds || 5,
        });
        this.mediaLoaded.set(true);
      },
      error: (e) => { if (seq === this.loadSeq) this.mediaError.set(messageOf(e)); },
    });
  }

  // --- Saving --------------------------------------------------------------------------------------------------

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly recentlySaved = signal(false);
  readonly savedAt = signal<Date | null>(null);
  readonly savedAtLabel = computed(() => this.savedAt()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '');
  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly chunkError = computed(() => validateChunkSeconds(this.chunk.draft().chunkSeconds));
  readonly imageError = computed(() => validateImageSeconds(this.chunk.draft().imageSeconds));

  private readonly chunkChanged = computed(() => this.chunk.changes().some((c) => c.key === 'chunkSeconds'));
  private readonly imageChanged = computed(() => this.chunk.changes().some((c) => c.key === 'imageSeconds'));

  /** Why Save is off, in words. Only what the person has changed can block a save. */
  readonly blockers = computed<string[]>(() => {
    const reasons: string[] = [];
    if (this.shows('chunking')) {
      const chunkError = this.chunkError();
      const imageError = this.imageError();
      if (this.chunkChanged() && chunkError) reasons.push(chunkError);
      if (this.imageChanged() && imageError) reasons.push(imageError);
    }
    return reasons;
  });

  readonly canSave = computed(() =>
    this.ready() && this.hasUnsaved() && this.blockers().length === 0 && !this.status.busy() && !this.saving());

  /** Saves every changed form on this page, one after the other (the server rewrites one settings document). */
  saveAll(done?: () => void, failed?: () => void): void {
    if (!this.canSave()) {
      failed?.();
      return;
    }
    const steps = this.saveSteps();
    if (steps.length === 0) {
      done?.();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.status.run(
      concat(...steps).pipe(
        toArray(),
        tap({ error: (e) => { this.saveError.set(messageOf(e)); failed?.(); } }),
        finalize(() => this.saving.set(false)),
      ),
      () => {
        this.savedAt.set(new Date());
        this.recentlySaved.set(true);
        if (this.savedTimer) clearTimeout(this.savedTimer);
        this.savedTimer = setTimeout(() => this.recentlySaved.set(false), 6000);
        done?.();
      },
    );
  }

  private saveSteps(): SaveStep[] {
    const steps: SaveStep[] = [];
    const channel = this.selectedChannelId();
    if (this.shows('watermark') && this.wm.dirty()) steps.push(this.saveWatermark(channel));
    if (this.shows('outro') && this.outro.dirty()) steps.push(this.saveOutro(channel));
    if (this.shows('chunking') && this.chunkChanged()) steps.push(this.saveChunk());
    if (this.shows('chunking') && this.imageChanged()) steps.push(this.saveImage());
    return steps;
  }

  private saveWatermark(channel: string): SaveStep {
    const sent = this.wm.draft();
    return this.api.updateGlobalBranding(watermarkBodyFromDraft(sent), channel).pipe(tap((saved) => {
      if (channel !== this.selectedChannelId()) return;
      this.wm.markSaved(saved ? watermarkDraftFromBody(saved) : sent, sent);
      this.logoStamp.set(Date.now());
      this.loadChannels();
    }));
  }

  private saveOutro(channel: string): SaveStep {
    const sent = this.outro.draft();
    return this.api.updateGlobalOutro(outroBodyFromDraft(sent), channel).pipe(tap((saved) => {
      if (channel !== this.selectedChannelId()) return;
      this.outro.markSaved(saved ? outroDraftFromBody(saved) : sent, sent);
      this.mediaStamp.set(Date.now());
      this.loadChannels();
    }));
  }

  private saveChunk(): SaveStep {
    const sent = this.chunk.draft().chunkSeconds;
    if (!(sent > 0)) return EMPTY;
    return this.mediaTools.updateChunkDuration(sent).pipe(tap((saved) => this.settleChunk('chunkSeconds', sent, saved)));
  }

  private saveImage(): SaveStep {
    const sent = Number(this.chunk.draft().imageSeconds);
    if (!Number.isFinite(sent) || sent < 0.5 || sent > 120) {
      this.status.notify(['Image duration must be between 0.5 and 120 seconds.']);
      return EMPTY;
    }
    return this.mediaTools.updateImageDuration(sent).pipe(tap((saved) => this.settleChunk('imageSeconds', sent, saved)));
  }

  /** One of the two chunk settings is now on the server: it becomes the baseline, and the field adopts the server's value. */
  private settleChunk(key: keyof ChunkDraft, sent: number, saved: number): void {
    const patch: Partial<ChunkDraft> = {};
    patch[key] = saved;
    this.chunk.adoptSaved(patch);
    if (this.chunk.draft()[key] === sent && saved !== sent) this.chunk.draft.update((d) => ({ ...d, ...patch }));
  }

  // --- Discarding, undoing ---------------------------------------------------------------------------------------

  readonly flash = signal<Flash | null>(null);
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  private showFlash(text: string, undo = false): void {
    this.flash.set({ text, tone: 'info', undo });
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.flash.set(null), 8000);
  }

  undo(): void {
    this.activeStore().undo();
    this.flash.set(null);
  }

  redo(): void {
    this.activeStore().redo();
    this.flash.set(null);
  }

  private discardAll(): void {
    for (const store of this.visibleStores()) store.discard();
    this.saveError.set(null);
  }

  // --- Dialogs ------------------------------------------------------------------------------------------------------

  readonly dialog = signal<'discard' | 'copy' | 'apply' | null>(null);

  closeDialog(): void {
    if (this.applyBusy()) return;
    this.dialog.set(null);
  }

  requestDiscard(): void {
    if (this.hasUnsaved() && !this.saving()) this.dialog.set('discard');
  }

  confirmDiscard(): void {
    this.dialog.set(null);
    this.discardAll();
    this.showFlash('Changes discarded.', true);
  }

  /** The "you have unsaved changes" prompt shown before leaving, switching channel or reloading. */
  readonly prompt = signal<{ verb: string; resolve: (ok: boolean) => void } | null>(null);

  /** Resolves true when it is fine to carry on: nothing unsaved, or the person saved or discarded it. */
  confirmUnsaved(verb: string): Promise<boolean> {
    if (!this.hasUnsaved()) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => this.prompt.set({ verb, resolve }));
  }

  /** For the route's canDeactivate guard. */
  confirmLeave(): Promise<boolean> {
    return this.confirmUnsaved('leave this page');
  }

  promptStay(): void {
    this.finishPrompt(false);
  }

  promptDiscard(): void {
    this.discardAll();
    this.finishPrompt(true);
  }

  promptSave(): void {
    if (!this.canSave()) return;
    this.saveAll(() => this.finishPrompt(true), () => this.finishPrompt(false));
  }

  private finishPrompt(ok: boolean): void {
    const prompt = this.prompt();
    this.prompt.set(null);
    prompt?.resolve(ok);
  }

  // --- Keyboard ------------------------------------------------------------------------------------------------------

  onKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;
    const modal = !!(this.dialog() || this.prompt() || this.qrCropSource());

    if (mod && key === 's') {
      // Always ours: the browser's "save page" is never what this page's Ctrl+S means.
      event.preventDefault();
      if (!modal) this.saveAll();
      return;
    }
    if (modal) return;

    if (mod && key === 'z' && !this.inTextField(event.target)) {
      event.preventDefault();
      if (event.shiftKey) this.redo(); else this.undo();
      return;
    }
    if (mod && key === 'y' && !this.inTextField(event.target)) {
      event.preventDefault();
      this.redo();
      return;
    }
    // A picker or popup that used Escape has already marked it handled.
    if (event.key === 'Escape' && !event.defaultPrevented && this.hasUnsaved() && !this.saving()) {
      this.requestDiscard();
    }
  }

  private inTextField(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    if (el.tagName !== 'INPUT') return false;
    return !['range', 'checkbox', 'radio', 'button', 'color', 'file'].includes((el as HTMLInputElement).type);
  }

  // --- Template helpers -----------------------------------------------------------------------------------------------

  textOf(event: Event): string {
    return readValue(event);
  }

  numberOf(event: Event): number {
    return Number(readValue(event));
  }

  checkedOf(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  pct(fraction: number): number {
    return Math.round(fraction * 100);
  }

  // ===========================================================================================
  // Watermark
  // ===========================================================================================

  /** Cache-busters for the saved logo / media URLs (they keep their address when replaced). */
  private readonly logoStamp = signal(Date.now());
  private readonly mediaStamp = signal(Date.now());

  readonly logoNote = signal<Note | null>(null);

  /** The saved logo comes from the channel endpoint; a logo that is only in the draft (copied, undone) from its asset. */
  readonly logoUrl = computed(() => {
    const d = this.wm.draft();
    if (!d.logoAssetId) return null;
    return d.logoAssetId === this.wm.saved().logoAssetId
      ? `${this.api.globalLogoUrl(this.selectedChannelId())}&t=${this.logoStamp()}`
      : this.api.assetContentUrl(d.logoAssetId);
  });

  readonly insetPct = computed(() => {
    const a = this.aspect();
    return round(effectiveInsetPct(this.wm.draft().margin, a.width, a.height), 1);
  });

  readonly activeLook = computed(() => {
    const d = this.wm.draft();
    return this.looks.find((l) => Math.abs(l.opacity - d.opacity) < 0.005 && l.height === d.height && l.margin === d.margin)?.id ?? null;
  });

  readonly contrast = computed(() => {
    const d = this.wm.draft();
    return textMarkContrast(d.color, d.opacity, d.backplate);
  });

  /** The lightest shading that fixes weak contrast, when there is one. */
  readonly contrastFix = computed(() => {
    const d = this.wm.draft();
    if (this.contrast().verdict === 'good') return null;
    const fix = suggestBackplate(d.color, d.opacity);
    return fix !== null && fix > d.backplate ? fix : null;
  });

  readonly contrastMessage = computed(() => {
    const c = this.contrast();
    if (c.verdict === 'good') return 'Reads clearly on dark, mid-tone and bright scenes.';
    const weakest = c.bright <= c.mid && c.bright <= c.dark ? 'very bright scenes'
      : c.dark <= c.mid ? 'dark scenes' : 'mid-tone scenes';
    const ratio = `${round(c.worst, 1)}:1`;
    return c.verdict === 'poor'
      ? `This can disappear on ${weakest} (${ratio}). Add shading, change the colour or raise the opacity.`
      : `Readable, but weak on ${weakest} (${ratio}).`;
  });

  /** The mark drawn over each test backdrop, so the numbers have a picture next to them. */
  readonly tones = computed(() => {
    const d = this.wm.draft();
    const c = this.contrast();
    const [r, g, b] = parseRgb(d.color) ?? [255, 255, 255];
    const grey = (v: number) => `rgb(${v}, ${v}, ${v})`;
    const ink = `rgba(${r}, ${g}, ${b}, ${d.opacity})`;
    const plate = d.backplate > 0 ? `rgba(0, 0, 0, ${d.backplate})` : 'transparent';
    const ring = d.backplate > 0 ? `0 0 0 3px rgba(0, 0, 0, ${d.backplate})` : 'none';
    return [
      { id: 'dark', label: 'Dark scene', bg: grey(CONTRAST_BACKDROPS.dark), ratio: round(c.dark, 1), ink, plate, ring },
      { id: 'mid', label: 'Mid-tone scene', bg: grey(CONTRAST_BACKDROPS.mid), ratio: round(c.mid, 1), ink, plate, ring },
      { id: 'bright', label: 'Very bright scene', bg: grey(CONTRAST_BACKDROPS.bright), ratio: round(c.bright, 1), ink, plate, ring },
    ];
  });

  readonly placementNote = computed(() => placementHint(this.wm.draft().position, this.aspect()));

  /** Sits under the text field: a text mark with no text draws nothing. */
  readonly wmTextNote = computed<Note | null>(() => {
    const d = this.wm.draft();
    return d.kind === 'Text' && !d.text.trim() ? { tone: 'warn', text: 'No text yet, so nothing will be drawn on the video.' } : null;
  });

  /** Sits under the sliders: values that tend to disappoint. */
  readonly wmStyleNotes = computed<Note[]>(() => {
    const d = this.wm.draft();
    const notes: Note[] = [];
    if (d.opacity < 0.5) notes.push({ tone: 'info', text: 'Below 50% opacity a mark can fade away when YouTube re-compresses the video.' });
    if (d.height < 3) notes.push({ tone: 'info', text: 'Very small marks are hard to read on a phone.' });
    return notes;
  });

  setWatermarkKind(kind: WatermarkKind): void {
    this.wm.patch({ kind });
  }

  setPosition(position: WatermarkPosition): void {
    // A discrete choice: every move is its own undo step, however quickly they follow each other.
    this.wm.patch({ position });
  }

  /** Arrow keys move around the grid by place (up and down skip the empty middle row). */
  onGridKey(event: KeyboardEvent): void {
    const directions: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const next = stepPosition(this.wm.draft().position, direction);
    this.setPosition(next);
    document.getElementById(`wm-pos-${next}`)?.focus();
  }

  setOpacity(percent: number): void {
    this.wm.patch({ opacity: round(percent / 100, 2) }, 'opacity');
  }

  setBackplate(percent: number): void {
    this.wm.patch({ backplate: round(percent / 100, 2) }, 'backplate');
  }

  setHeight(percent: number): void {
    this.wm.patch({ height: percent }, 'height');
  }

  setMargin(percent: number): void {
    this.wm.patch({ margin: percent }, 'margin');
  }

  onWmColor(event: Event): void {
    this.wm.patch({ color: readValue(event) }, 'color');
  }

  /** The hex field applies once it holds a whole colour; until then it keeps what was typed. */
  onWmColorHex(event: Event): void {
    const hex = normalizeHex(readValue(event));
    if (hex) this.wm.patch({ color: hex }, 'color');
  }

  syncHex(event: Event, current: string): void {
    (event.target as HTMLInputElement).value = current.toUpperCase();
  }

  applyLook(look: (typeof this.looks)[number]): void {
    this.wm.patch({ opacity: look.opacity, height: look.height, margin: look.margin });
  }

  resetStyle(): void {
    this.wm.patch({ ...DEFAULT_WATERMARK_STYLE });
    this.showFlash('Style reset to the defaults.', true);
  }

  applyShading(backplate: number): void {
    this.wm.patch({ backplate });
  }

  onUploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadLogo(file);
  }

  uploadLogo(file: File): void {
    const problem = checkUpload(file, 'image');
    if (problem) {
      this.logoNote.set({ tone: 'error', text: problem });
      return;
    }
    this.logoNote.set({ tone: 'info', text: `Uploading ${file.name}…` });
    const channel = this.selectedChannelId();
    this.status.run(
      this.api.uploadGlobalLogo(file, channel).pipe(tap({ error: (e) => this.logoNote.set({ tone: 'error', text: messageOf(e) }) })),
      (wm) => {
        if (!wm || channel !== this.selectedChannelId()) return;
        // The server attached it to the channel at once, so the baseline moves with the draft.
        const attached = { kind: 'Logo' as const, logoAssetId: wm.logoAssetId ?? '' };
        this.wm.patch(attached);
        this.wm.adoptSaved(attached);
        this.logoStamp.set(Date.now());
        this.logoNote.set({ tone: 'ok', text: 'Logo uploaded and attached to this channel.' });
      },
    );
  }

  clearLogo(): void {
    this.wm.patch(this.wm.draft().kind === 'Logo' ? { logoAssetId: '', kind: 'None' } : { logoAssetId: '' });
    this.logoNote.set(null);
  }

  // ===========================================================================================
  // End card
  // ===========================================================================================

  readonly fadeSeconds = computed(() => round(framesToSeconds(this.outro.draft().transitionDurationFrames), 2));
  /** A card's fade can be no longer than half the card. */
  readonly effectiveFade = computed(() => round(Math.min(this.fadeSeconds(), this.outro.draft().durationSeconds / 2), 2));
  readonly fadeHint = computed(() => {
    const o = this.outro.draft();
    if (o.kind === 'Card') {
      return this.fadeSeconds() > o.durationSeconds / 2
        ? `A card's fade is capped at half its length, so this one fades in over ${this.effectiveFade()} s.`
        : 'How long the card takes to fade up from black. It never exceeds half the card\'s length.';
    }
    return 'How long the last scene and the end card overlap. Clamped to half of the shorter clip.';
  });

  readonly activeLanguage = computed(() => {
    const o = this.outro.draft();
    const same = (a: string, b: string) => a.trim() === b.trim();
    return this.languagePresets.find((p) => same(o.headline, p.headline) && same(o.subtext, p.subtext)
      && same(o.headlineSecondary, p.headline2) && same(o.subtextSecondary, p.subtext2))?.id ?? null;
  });

  readonly colorContrast = computed(() => {
    const o = this.outro.draft();
    const bg = parseRgb(o.backgroundHex);
    const fg = parseRgb(o.textHex);
    return bg && fg ? round(contrastRatio(bg, fg), 1) : null;
  });

  readonly mediaAccept = computed(() => this.outro.draft().kind === 'Video'
    ? 'video/mp4,video/webm,video/quicktime' : 'image/png,image/jpeg,image/webp');

  readonly mediaNote = signal<Note | null>(null);
  readonly qrNote = signal<Note | null>(null);
  readonly qrInfo = signal<QrCheck | null>(null);

  /** The saved media comes from the channel endpoint; media that is only in the draft (copied, undone) from its asset. */
  readonly outroMediaUrl = computed(() => {
    const o = this.outro.draft();
    if (o.kind === 'Card' || o.kind === 'None' || !o.assetId) return null;
    return o.assetId === this.outro.saved().assetId
      ? `${this.api.globalOutroMediaUrl(this.selectedChannelId())}&t=${this.mediaStamp()}`
      : this.api.assetContentUrl(o.assetId);
  });

  readonly qrImageUrl = computed(() => {
    const id = this.outro.draft().qrAssetId;
    return id ? this.api.assetContentUrl(id) : null;
  });

  readonly endFormatInfo = computed(() => END_FORMATS.find((f) => f.id === this.endFormat()) ?? END_FORMATS[0]);

  /** A card with neither a code nor a headline is a blank screen, so exports leave it out. */
  readonly cardNote = computed<Note | null>(() => {
    const o = this.outro.draft();
    return o.kind === 'Card' && !o.qrAssetId && !o.headline.trim() && !o.headlineSecondary.trim()
      ? { tone: 'warn', text: 'A card needs a QR code or a headline. Without either, exports end without it.' } : null;
  });

  setOutroKind(kind: OutroKind): void {
    this.outro.patch({ kind });
  }

  patchOutro(partial: Partial<OutroDraft>, key?: string): void {
    this.outro.patch(partial, key);
  }

  /** A card only knows "fades in" or "hard cut"; any named transition counts as the fade. */
  setCardFade(on: boolean): void {
    const current = this.outro.draft().transition;
    if (on && current !== 'None') return;
    this.outro.patch({ transition: on ? 'Fade' : 'None' });
  }

  setTransition(transition: string): void {
    this.outro.patch({ transition });
  }

  setFadeSeconds(seconds: number): void {
    this.outro.patch({ transitionDurationFrames: secondsToFrames(seconds) }, 'fade');
  }

  onOutroColor(key: 'backgroundHex' | 'textHex', event: Event): void {
    const patch: Partial<OutroDraft> = {};
    patch[key] = readValue(event);
    this.outro.patch(patch, key);
  }

  onOutroColorHex(key: 'backgroundHex' | 'textHex', event: Event): void {
    const hex = normalizeHex(readValue(event));
    if (!hex) return;
    const patch: Partial<OutroDraft> = {};
    patch[key] = hex;
    this.outro.patch(patch, key);
  }

  applyLanguagePreset(preset: LanguagePreset): void {
    this.outro.patch({
      headline: preset.headline, subtext: preset.subtext,
      headlineSecondary: preset.headline2, subtextSecondary: preset.subtext2,
    });
  }

  onUploadOutro(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadOutro(file);
  }

  uploadOutro(file: File): void {
    const problem = checkUpload(file, 'video-or-image');
    if (problem) {
      this.mediaNote.set({ tone: 'error', text: problem });
      return;
    }
    this.mediaNote.set({ tone: 'info', text: `Uploading ${file.name}…` });
    const channel = this.selectedChannelId();
    this.status.run(
      this.api.uploadGlobalOutro(file, channel).pipe(tap({ error: (e) => this.mediaNote.set({ tone: 'error', text: messageOf(e) }) })),
      (res) => {
        if (!res || channel !== this.selectedChannelId()) return;
        const attached = { kind: res.kind, assetId: res.assetId ?? '' };
        this.outro.patch(attached);
        this.outro.adoptSaved(attached);
        this.mediaStamp.set(Date.now());
        this.mediaNote.set({ tone: 'ok', text: 'File uploaded and attached to this channel.' });
      },
    );
  }

  clearOutro(): void {
    this.outro.patch({ assetId: '', kind: 'None' });
    this.mediaNote.set(null);
  }

  onUploadOutroQr(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadOutroQr(file);
  }

  /** The image waiting in the crop dialog; every way of adding a QR goes through it. */
  readonly qrCropSource = signal<Blob | null>(null);

  uploadOutroQr(file: File): void {
    const problem = checkUpload(file, 'image');
    if (problem) {
      this.qrNote.set({ tone: 'error', text: problem });
      return;
    }
    this.qrNote.set(null);
    this.qrCropSource.set(file);
  }

  /** Re-opens the saved QR in the crop dialog, e.g. to trim a payment-app screenshot. */
  cropCurrentQr(): void {
    const id = this.outro.draft().qrAssetId;
    if (id) this.status.run(this.api.assetContent(id), (blob) => this.qrCropSource.set(blob));
  }

  onQrCropped(file: File): void {
    this.qrCropSource.set(null);
    this.sendOutroQr(file);
  }

  private sendOutroQr(file: File): void {
    this.qrNote.set({ tone: 'info', text: 'Uploading the QR code…' });
    const channel = this.selectedChannelId();
    this.status.run(
      this.api.uploadGlobalOutroQr(file, channel).pipe(tap({ error: (e) => this.qrNote.set({ tone: 'error', text: messageOf(e) }) })),
      (res) => {
        if (!res || channel !== this.selectedChannelId()) return;
        const attached = { kind: 'Card' as const, qrAssetId: res.qrAssetId ?? '' };
        this.outro.patch(attached);
        this.outro.adoptSaved(attached);
        this.qrNote.set({ tone: 'ok', text: 'QR code uploaded and attached to this channel.' });
      },
    );
  }

  clearOutroQr(): void {
    this.outro.patch({ qrAssetId: '' });
    this.qrInfo.set(null);
    this.qrNote.set(null);
  }

  onQrLoaded(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.qrInfo.set(checkQrSize(img.naturalWidth, img.naturalHeight));
  }

  onQrBroken(): void {
    this.qrInfo.set({ tone: 'warn', text: 'The QR image could not be loaded. It may have been removed; upload it again.' });
  }

  // --- The exact render (the server draws the card to an MP4) -------------------------------------------

  /** The rendered end card, as an object URL, and which shape it was rendered for. */
  readonly outroPreviewUrl = signal<string | null>(null);
  readonly outroPreviewFormat = signal<EndCardFormat>('landscape');
  readonly outroPreviewBusy = signal(false);
  readonly outroPreviewError = signal<string | null>(null);
  private outroPreviewBlob: Blob | null = null;
  private outroPreviewKey = '';
  private renderSub: Subscription | null = null;
  private readonly currentOutroKey = computed(() => JSON.stringify(outroBodyFromDraft(this.outro.draft())));

  /** The render no longer matches the form (edited since, or another shape is selected). */
  readonly renderStale = computed(() =>
    !!this.outroPreviewUrl()
    && (this.outroPreviewKey !== this.currentOutroKey() || this.outroPreviewFormat() !== this.endFormat()));

  /** Renders the form as it stands - saved or not - so the card can be checked first. */
  renderPreview(): void {
    this.previewOutro(this.endFormat());
  }

  previewOutro(format: EndCardFormat): void {
    this.renderSub?.unsubscribe();
    this.outroPreviewBusy.set(true);
    this.outroPreviewError.set(null);
    this.outroPreviewFormat.set(format);
    const body = outroBodyFromDraft(this.outro.draft());
    const key = JSON.stringify(body);

    this.renderSub = this.api.previewGlobalOutro(body, format).subscribe({
      next: (blob) => {
        this.setRender(blob, key);
        this.outroPreviewBusy.set(false);
        this.previewMode.set('render');
      },
      error: (e) => {
        this.setRender(null, '');
        this.outroPreviewBusy.set(false);
        this.outroPreviewError.set(e instanceof ApiFailure && e.message
          ? e.message : 'Could not render the end card. Add a QR code or a headline, then try again.');
      },
    });
  }

  cancelRender(): void {
    this.renderSub?.unsubscribe();
    this.outroPreviewBusy.set(false);
  }

  downloadOutroPreview(): void {
    if (!this.outroPreviewBlob) return;
    const url = URL.createObjectURL(this.outroPreviewBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `end-card-${this.outroPreviewFormat()}.mp4`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private resetRender(): void {
    this.cancelRender();
    this.setRender(null, '');
    this.outroPreviewError.set(null);
    this.previewMode.set('layout');
  }

  private setRender(blob: Blob | null, key: string): void {
    const previous = this.outroPreviewUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.outroPreviewBlob = blob;
    this.outroPreviewKey = key;
    this.outroPreviewUrl.set(blob ? URL.createObjectURL(blob) : null);
  }

  // ===========================================================================================
  // Chunking
  // ===========================================================================================

  readonly chunkPlan = computed(() => chunkPlan(this.exampleSeconds(), this.chunk.draft().chunkSeconds));
  readonly exampleLabel = computed(() => formatDuration(this.exampleSeconds()));

  /** "13 of 45 s and a last one of 15 s". */
  readonly planSentence = computed(() => {
    const plan = this.chunkPlan();
    if (!plan) return '';
    const parts: string[] = [];
    if (plan.fullClips > 0) parts.push(`${plan.fullClips} of ${formatDuration(this.chunk.draft().chunkSeconds)}`);
    if (plan.fullClips < plan.count) {
      parts.push(`${plan.fullClips > 0 ? 'a last one' : 'one'} of ${formatDuration(plan.lastSeconds)}`);
    }
    return parts.join(' and ');
  });

  /** One bar per clip, as wide as the clip is long; a very long run is drawn as a single ruled bar. */
  readonly timeline = computed(() => {
    const plan = this.chunkPlan();
    if (!plan || plan.count > 60) return null;
    const c = this.chunk.draft().chunkSeconds;
    return Array.from({ length: plan.count }, (_, i) => ({
      flex: i === plan.count - 1 ? plan.lastSeconds : c,
      last: i === plan.count - 1 && plan.lastSeconds < c - 1e-9,
    }));
  });

  readonly examplePlans = computed(() => CHUNK_EXAMPLES.map((e) => ({
    label: e.label, seconds: e.seconds, count: chunkPlan(e.seconds, this.chunk.draft().chunkSeconds)?.count ?? 0,
  })));

  readonly shortsNote = computed(() => {
    const c = this.chunk.draft().chunkSeconds;
    if (!(c > 0)) return null;
    return c <= 60 ? 'Each clip is 60 s or less, so it fits a YouTube Short.' : 'Longer than 60 s: too long for a classic Short.';
  });

  readonly imageExample = computed(() => {
    const s = this.chunk.draft().imageSeconds;
    return Number.isFinite(s) && s > 0 ? `10 images play for ${formatDuration(s * 10)}.` : null;
  });

  setChunkSeconds(seconds: number): void {
    this.chunk.patch({ chunkSeconds: seconds }, 'chunkSeconds');
  }

  setImageSeconds(seconds: number): void {
    this.chunk.patch({ imageSeconds: seconds }, 'imageSeconds');
  }

  // ===========================================================================================
  // Copy from another channel, apply to all channels
  // ===========================================================================================

  readonly copySourceId = signal<string | null>(null);
  readonly copyQuery = signal('');
  private static readonly MAX_LISTED = 50;

  readonly canCopy = computed(() => this.ready() && this.otherChannels().length > 0);

  readonly copyMatches = computed(() => {
    const q = this.copyQuery().trim().toLowerCase();
    return q ? this.otherChannels().filter((c) => c.name.toLowerCase().includes(q)) : this.otherChannels();
  });
  readonly copyListed = computed(() => this.copyMatches().slice(0, AdminBrandingComponent.MAX_LISTED));
  readonly copyHidden = computed(() => Math.max(0, this.copyMatches().length - AdminBrandingComponent.MAX_LISTED));
  readonly copySource = computed(() => this.otherChannels().find((c) => c.id === this.copySourceId()) ?? null);
  readonly copyTarget = computed<'watermark' | 'outro'>(() => (this.section() === 'outro' ? 'outro' : 'watermark'));

  readonly copyChanges = computed<FieldChange[]>(() => {
    const source = this.copySource();
    if (!source) return [];
    return this.copyTarget() === 'outro'
      ? diffDrafts(OUTRO_FIELDS, this.outro.draft(), outroDraftFromBody(source.outro))
      : diffDrafts(WATERMARK_FIELDS, this.wm.draft(), watermarkDraftFromBody(source.watermark));
  });

  channelSummary(c: BrandChannel): string {
    const outro = this.copyTarget() === 'outro';
    const kind = outro ? c.outro?.kind : c.watermark?.kind;
    if (!kind || kind === 'None') return outro ? 'No end card' : 'No watermark';
    return outro ? `${kind} end card` : `${kind} watermark`;
  }

  openCopy(): void {
    if (!this.canCopy()) return;
    const others = this.otherChannels();
    this.copySourceId.set((others.find((c) => c.isDefault) ?? others[0]).id);
    this.copyQuery.set('');
    this.dialog.set('copy');
  }

  confirmCopy(): void {
    const source = this.copySource();
    if (!source) return;
    if (this.copyTarget() === 'outro') this.outro.set(outroDraftFromBody(source.outro));
    else this.wm.set(watermarkDraftFromBody(source.watermark));
    this.dialog.set(null);
    this.showFlash(`Copied from ${source.name}. Review it, then save.`, true);
  }

  readonly applyBusy = signal(false);
  readonly applyError = signal<string | null>(null);
  readonly applyDone = signal(0);

  /** What applying the current watermark would do to each other channel. */
  readonly applyPlan = computed(() => {
    const draft = this.wm.draft();
    return this.otherChannels().map((channel) => ({
      channel,
      changes: diffDrafts(WATERMARK_FIELDS, watermarkDraftFromBody(channel.watermark), draft),
    }));
  });
  readonly applyChanging = computed(() => this.applyPlan().filter((p) => p.changes.length > 0));
  readonly applyMatching = computed(() => this.applyPlan().filter((p) => p.changes.length === 0));
  /** The channel being edited is saved too, when it has unsaved edits. */
  readonly applyTotal = computed(() => this.applyChanging().length + (this.wm.dirty() ? 1 : 0));

  openApply(): void {
    if (!this.canCopy()) return;
    this.applyError.set(null);
    this.applyDone.set(0);
    this.dialog.set('apply');
  }

  /** One channel after another: each save rewrites the whole settings document, so they must not overlap. */
  confirmApply(): void {
    if (this.applyBusy()) return;
    const sent = this.wm.draft();
    const body = watermarkBodyFromDraft(sent);
    const current = this.selectedChannelId();
    const targets = [
      ...(this.wm.dirty() ? [current] : []),
      ...this.applyChanging().map((p) => p.channel.id),
    ];
    if (targets.length === 0) return;

    this.applyBusy.set(true);
    this.applyError.set(null);
    this.applyDone.set(0);
    const steps = targets.map((id) => this.api.updateGlobalBranding(body, id).pipe(tap((saved) => {
      this.applyDone.update((n) => n + 1);
      if (id === current && current === this.selectedChannelId()) {
        this.wm.markSaved(saved ? watermarkDraftFromBody(saved) : sent, sent);
        this.logoStamp.set(Date.now());
      }
    })));

    this.status.run(
      concat(...steps).pipe(
        toArray(),
        tap({
          error: (e) => this.applyError.set(
            `${messageOf(e)} ${this.applyDone()} of ${targets.length} channels were updated before it stopped.`),
        }),
        finalize(() => {
          this.applyBusy.set(false);
          this.loadChannels();
        }),
      ),
      () => {
        this.dialog.set(null);
        this.savedAt.set(new Date());
        this.showFlash(`Watermark applied to ${targets.length} ${targets.length === 1 ? 'channel' : 'channels'}.`);
      },
    );
  }
}
