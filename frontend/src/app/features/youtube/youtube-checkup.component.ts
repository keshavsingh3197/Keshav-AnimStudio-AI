import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  YouTubeCategory, YouTubeChannel, YouTubeCheckup, YouTubeCheckupVideo, YouTubeSuggestEngine, YouTubeSuggestion, YouTubeUrlSeoResult,
} from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { MAX_ANSWER_CHARS, MAX_PROMPT_VIDEOS, buildHandoffPrompt, parseHandoffAnswer } from './checkup-ai-handoff';
import {
  Draft, EMPTY_STATE, HASHTAG, HASHTAGS, RowState, YOUTUBE_LANGUAGES, draftDiffers, fitTags, fromLocalInput, insertAboveFooter, languageLabel, scheduleDiffers, splitTags, toLocalInput, toneLabel,
} from './checkup-draft';
import { CheckupVideoEditorComponent } from './checkup-video-editor.component';
import { csvCell } from './csv';

/** The issues the page counts and filters by, in the order they're shown. */
const ISSUE_LABELS: readonly { code: string; label: string }[] = [
  { code: 'description-missing', label: 'No description' },
  { code: 'description-short', label: 'Short description' },
  { code: 'tags-missing', label: 'No tags' },
  { code: 'hashtags-missing', label: 'No hashtags' },
  { code: 'playlist-missing', label: 'No playlist' },
  { code: 'audience-unset', label: 'Audience not set' },
  { code: 'title-default', label: 'File-name title' },
];

/** Valid 11-char YouTube video ID */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Two drafts at a time: the server only writes two suggestions at once anyway. */
const PARALLEL = 2;

export type Filter = 'needs' | 'all' | 'complete' | string;

export type ViewMode = 'list' | 'grid' | 'compact';

type Sort = 'newest' | 'oldest' | 'most-missing' | 'title';

/** Rows per page: enough to scan, few enough that 500 videos don't make one endless list. */
export const PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

export type FormatFilter = 'all' | 'long' | 'short';
export type PrivacyFilter = 'all' | 'public' | 'unlisted' | 'private';

/** Remembered per browser: how the list is sorted, paged and narrowed. */
const UI_KEY = 'animstudio.youtube.checkup.ui';
interface UiPrefs { sort: Sort; pageSize: number; format: FormatFilter; privacy: PrivacyFilter }
const SORTS: readonly Sort[] = ['newest', 'oldest', 'most-missing', 'title'];

/** The AI choices (tone, language, engine, notes) are remembered, so each visit starts as the last ended. */
const AI_KEY = 'animstudio.youtube.checkup.ai';
function loadAiPrefs(): { tone: string; language: string; engine: string; brief: string } {
  const fallback = { tone: 'auto', language: 'hi', engine: '', brief: '' };
  try {
    const raw = JSON.parse(localStorage.getItem(AI_KEY) ?? '{}') as Partial<typeof fallback>;
    return {
      tone: typeof raw.tone === 'string' ? raw.tone : fallback.tone,
      language: YOUTUBE_LANGUAGES.some((l) => l.id === raw.language) ? raw.language! : fallback.language,
      engine: typeof raw.engine === 'string' ? raw.engine : fallback.engine,
      brief: typeof raw.brief === 'string' ? raw.brief.slice(0, 1000) : fallback.brief,
    };
  } catch {
    return fallback;
  }
}

function loadUiPrefs(): UiPrefs {
  const fallback: UiPrefs = { sort: 'newest', pageSize: DEFAULT_PAGE_SIZE, format: 'all', privacy: 'all' };
  try {
    const raw = JSON.parse(localStorage.getItem(UI_KEY) ?? '{}') as Partial<UiPrefs>;
    return {
      sort: SORTS.includes(raw.sort as Sort) ? raw.sort! : fallback.sort,
      pageSize: (PAGE_SIZES as readonly number[]).includes(raw.pageSize as number) ? raw.pageSize! : fallback.pageSize,
      format: ['all', 'long', 'short'].includes(raw.format as string) ? raw.format! : fallback.format,
      privacy: ['all', 'public', 'unlisted', 'private'].includes(raw.privacy as string) ? raw.privacy! : fallback.privacy,
    };
  } catch {
    return fallback;
  }
}

/** How many of the newest videos a check reads. Fewer is quicker and spends less YouTube quota. */
const CHECK_SIZES = [10, 25, 50, 100, 250, 500] as const;
const DEFAULT_CHECK_SIZE = 25;

/** Remembered per browser, so the page opens with the last chosen size. */
const PREFS_KEY = 'animstudio.youtube.checkup';
const VIEW_MODE_KEY = 'animstudio.youtube.checkup.viewMode';

function loadViewMode(): ViewMode {
  try {
    const m = localStorage.getItem(VIEW_MODE_KEY);
    if (m === 'grid' || m === 'list' || m === 'compact') return m;
  } catch {}
  return 'list';
}

/**
 * Details checkup: every video on a connected channel - however it was uploaded - with what
 * its details are missing (description, tags, hashtags, playlist, audience). Drafts are
 * written by AI one by one or for a whole selection, reviewed here, and saved to YouTube.
 * Nothing is changed on YouTube until Save.
 */
@Component({
  selector: 'app-youtube-checkup',
  imports: [DatePipe, FormsModule, RouterLink, CheckupVideoEditorComponent],
  templateUrl: './youtube-checkup.component.html',
  styleUrl: './youtube-checkup.component.css',
})
export class YouTubeCheckupComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);

  /** A video to open once its channel's check has loaded - from "Open in checkup" on the details page. */
  private pendingOpen: string | null = null;

  readonly issueLabels = ISSUE_LABELS;
  readonly maxPromptVideos = MAX_PROMPT_VIDEOS;
  readonly maxAnswerChars = MAX_ANSWER_CHARS;
  readonly checkSizes = CHECK_SIZES;

  readonly channels = signal<YouTubeChannel[]>([]);
  readonly categories = signal<YouTubeCategory[]>([]);
  readonly engines = signal<YouTubeSuggestEngine[]>([]);
  readonly tones = signal<string[]>([]);
  readonly configured = signal(true);

  readonly channelId = signal('');
  readonly max = signal(loadCheckSize());
  readonly checkup = signal<YouTubeCheckup | null>(null);
  readonly loading = signal(false);
  /** Seconds the current check has been running, so a slow channel doesn't look stuck. */
  readonly loadingSeconds = signal(0);
  readonly error = signal<string | null>(null);

  private readonly ui = loadUiPrefs();
  readonly pageSizes = PAGE_SIZES;
  readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  readonly filter = signal<Filter>('needs');
  readonly query = signal('');
  readonly sort = signal<Sort>(this.ui.sort);
  readonly format = signal<FormatFilter>(this.ui.format);
  readonly privacy = signal<PrivacyFilter>(this.ui.privacy);
  readonly onlyUnsaved = signal(false);
  readonly pageSize = signal<number>(this.ui.pageSize);
  readonly page = signal(0);
  readonly viewMode = signal<ViewMode>(loadViewMode());

  // Edit many drafts at once: tags and a description block added to every selected video.
  readonly bulkOpen = signal(false);
  readonly bulkTags = signal('');
  readonly bulkDescription = signal('');

  // Video preview player modal
  readonly previewVideo = signal<YouTubeCheckupVideo | null>(null);
  readonly previewEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const v = this.previewVideo();
    if (!v) return null;
    return VIDEO_ID.test(v.videoId)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0`)
      : null;
  });

  // AI settings shared by every draft.
  readonly languages = YOUTUBE_LANGUAGES;
  private readonly aiPrefs = loadAiPrefs();
  readonly tone = signal(this.aiPrefs.tone);
  readonly language = signal(this.aiPrefs.language);
  readonly engine = signal(this.aiPrefs.engine);
  readonly brief = signal(this.aiPrefs.brief);

  readonly states = signal<Record<string, RowState>>({});
  readonly open = signal<string | null>(null);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly bulkRunning = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  // Hand-off to the creator's own AI tool.
  readonly pasteOpen = signal(false);
  readonly pasteText = signal('');
  readonly pasteReport = signal<{ ok: boolean; lines: string[] } | null>(null);
  readonly promptCopied = signal<string | null>(null);

  // Automated YouTube URL -> Transcript + SEO Generator (100% Free supported)
  readonly urlSeoOpen = signal(false);
  readonly urlSeoInput = signal('');
  readonly urlSeoBusy = signal(false);
  readonly urlSeoError = signal<string | null>(null);
  readonly urlSeoResult = signal<YouTubeUrlSeoResult | null>(null);
  readonly urlCopiedKey = signal<string | null>(null);

  /** Per video, when its thumbnail was last changed here - so the row's picture reloads. */
  private readonly thumbVersions = signal<Record<string, number>>({});

  private loadingTimer: ReturnType<typeof setInterval> | null = null;

  readonly channel = computed(() => this.channels().find((c) => c.channelId === this.channelId()) ?? null);
  readonly videos = computed(() => this.checkup()?.videos ?? []);
  readonly playlists = computed(() => this.checkup()?.playlists ?? []);

  readonly counts = computed(() => {
    const byIssue: Record<string, number> = {};
    let needs = 0;
    for (const v of this.videos()) {
      if (v.issues.length > 0) needs++;
      for (const i of v.issues) byIssue[i.code] = (byIssue[i.code] ?? 0) + 1;
    }
    return { all: this.videos().length, needs, complete: this.videos().length - needs, byIssue };
  });

  readonly healthPercent = computed(() => {
    const c = this.counts();
    return c.all > 0 ? Math.round((c.complete / c.all) * 100) : 0;
  });

  readonly rows = computed(() => {
    const f = this.filter();
    const format = this.format();
    const privacy = this.privacy();
    const unsaved = this.onlyUnsaved();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = this.videos().filter((v) => {
      if (f === 'needs' && v.issues.length === 0) return false;
      if (f === 'complete' && v.issues.length > 0) return false;
      if (f !== 'needs' && f !== 'all' && f !== 'complete' && !v.issues.some((i) => i.code === f)) return false;
      if (format !== 'all' && (format === 'short') !== v.isShort) return false;
      if (privacy !== 'all' && v.privacy !== privacy) return false;
      if (unsaved && !this.hasChanges(v)) return false;
      const text = `${v.title} ${v.description} ${v.tags.join(' ')} ${v.videoId}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
    return sortVideos(shown, this.sort());
  });

  readonly hasExtraFilters = computed(() =>
    this.format() !== 'all' || this.privacy() !== 'all' || this.onlyUnsaved() || this.query().trim() !== '');

  /** Videos whose draft differs from what is on YouTube - lost if the page is closed. */
  readonly unsavedCount = computed(() => this.videos().filter((v) => this.hasChanges(v)).length);

  /** What the current list holds, so a narrowed view still says what is in it. */
  readonly listStats = computed(() => {
    let shorts = 0, missing = 0;
    for (const v of this.rows()) {
      if (v.isShort) shorts++;
      missing += v.issues.length;
    }
    return { shorts, videos: this.rows().length - shorts, missing };
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize())));
  /** The page actually shown; clamped so a narrower filter never leaves an empty page. */
  readonly pageIndex = computed(() => Math.min(this.page(), this.pageCount() - 1));
  readonly pageRows = computed(() => this.rows().slice(this.pageIndex() * this.pageSize(), (this.pageIndex() + 1) * this.pageSize()));
  readonly pageFrom = computed(() => (this.rows().length === 0 ? 0 : this.pageIndex() * this.pageSize() + 1));
  readonly pageTo = computed(() => Math.min(this.rows().length, (this.pageIndex() + 1) * this.pageSize()));
  readonly pageButtons = computed<(number | null)[]>(() => {
    const last = this.pageCount() - 1;
    const cur = this.pageIndex();
    const wanted = [...new Set([0, cur - 1, cur, cur + 1, last])].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
    const out: (number | null)[] = [];
    wanted.forEach((p, i) => {
      if (i > 0 && p - wanted[i - 1] > 1) out.push(null);
      out.push(p);
    });
    return out;
  });
  readonly pageAllSelected = computed(() => this.pageRows().length > 0 && this.pageRows().every((v) => this.selected().has(v.videoId)));

  readonly selectedVideos = computed(() => this.videos().filter((v) => this.selected().has(v.videoId)));
  /** The video open in the edit dialog, and its neighbours in the filtered, sorted list. */
  readonly openVideo = computed(() => this.videos().find((v) => v.videoId === this.open()) ?? null);
  private readonly openIndex = computed(() => this.rows().findIndex((v) => v.videoId === this.open()));
  readonly openPosition = computed(() => (this.openIndex() < 0 ? '' : `${this.openIndex() + 1} of ${this.rows().length}`));
  readonly hasPrev = computed(() => this.openIndex() > 0);
  readonly hasNext = computed(() => this.openIndex() >= 0 && this.openIndex() < this.rows().length - 1);
  readonly aiSummary = computed(() => {
    const engine = this.engines().find((e) => e.id === this.engine())?.name ?? 'Auto engine';
    return `${engine}, tone ${this.tone()}, ${languageLabel(this.language())}`;
  });

  /** Selected drafts that would change something - an untouched draft isn't worth a YouTube call. */
  readonly draftsToSave = computed(() => this.selectedVideos().filter((v) => this.hasChanges(v)));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());
    effect(() => {
      const prefs = { tone: this.tone(), language: this.language(), engine: this.engine(), brief: this.brief() };
      try { localStorage.setItem(AI_KEY, JSON.stringify(prefs)); } catch { /* private window: not remembered */ }
    });
  }

  ngOnInit(): void {
    this.api.status().pipe(catchError((e: unknown) => { this.error.set(message(e)); return of(null); })).subscribe((s) => {
      if (!s) return;
      this.configured.set(s.configured);
      this.channels.set(s.channels);
      this.categories.set(s.categories);
      const query = this.route.snapshot.queryParamMap;
      const wanted = s.channels.find((c) => c.channelId === query.get('channel'));
      const video = query.get('video');
      if (wanted && video && VIDEO_ID.test(video)) this.pendingOpen = video;
      const first = wanted ?? s.channels.find((c) => !c.needsReconnect && c.canComment) ?? s.channels[0];
      if (first) this.pickChannel(first.channelId);
    });
    this.api.suggestOptions().pipe(catchError(() => of(null))).subscribe((o) => {
      if (!o) return;
      this.engines.set(o.engines);
      this.tones.set(o.tones);
      if (!o.tones.includes(this.tone())) this.tone.set('auto');
    });
  }

  setCheckSize(size: number): void {
    this.max.set(CHECK_SIZES.find((s) => s === size) ?? DEFAULT_CHECK_SIZE);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ max: this.max() }));
    } catch {
      // Storage is off (private window): the size just isn't remembered.
    }
    this.load();
  }

  pickChannel(channelId: string): void {
    this.channelId.set(channelId);
    this.load();
  }

  load(): void {
    const channel = this.channel();
    this.checkup.set(null);
    this.states.set({});
    this.selected.set(new Set());
    this.open.set(null);
    if (!channel || channel.needsReconnect || !channel.canComment) return;

    this.loading.set(true);
    this.error.set(null);
    this.page.set(0);
    this.startTimer();
    this.api.checkup(channel.channelId, this.max()).subscribe({
      next: (c) => { this.checkup.set(c); this.loading.set(false); this.stopTimer(); this.openPending(); },
      error: (e: unknown) => { this.error.set(message(e)); this.loading.set(false); this.stopTimer(); },
    });
  }

  /** Opens the video asked for in the link, or says why it can't. */
  private openPending(): void {
    const id = this.pendingOpen;
    this.pendingOpen = null;
    if (!id) return;
    const v = this.videos().find((x) => x.videoId === id);
    if (v) {
      this.filter.set('all');
      this.openEditor(v);
    } else {
      this.notice.set(`That video isn't among the newest ${this.max()} checked. Raise the scan depth to find it.`);
    }
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.page.set(0);
  }

  setQuery(query: string): void {
    this.query.set(query);
    this.page.set(0);
  }

  setSort(sort: Sort): void {
    this.sort.set(sort);
    this.page.set(0);
    this.saveUi();
  }

  setFormat(format: FormatFilter): void {
    this.format.set(format);
    this.page.set(0);
    this.saveUi();
  }

  setPrivacy(privacy: PrivacyFilter): void {
    this.privacy.set(privacy);
    this.page.set(0);
    this.saveUi();
  }

  setOnlyUnsaved(on: boolean): void {
    this.onlyUnsaved.set(on);
    this.page.set(0);
  }

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.page.set(0);
    this.saveUi();
  }

  resetFilters(): void {
    this.filter.set('all');
    this.query.set('');
    this.format.set('all');
    this.privacy.set('all');
    this.onlyUnsaved.set(false);
    this.page.set(0);
    this.saveUi();
  }

  private saveUi(): void {
    const prefs: UiPrefs = { sort: this.sort(), pageSize: this.pageSize(), format: this.format(), privacy: this.privacy() };
    try { localStorage.setItem(UI_KEY, JSON.stringify(prefs)); } catch { /* private window: just not remembered */ }
  }

  /** Starts the one-by-one review: opens the first video in the list, and "Save & next" walks on from there. */
  reviewFirst(): void {
    const first = this.rows()[0];
    if (!first) return;
    this.page.set(0);
    this.openEditor(first);
  }

  @HostListener('window:beforeunload', ['$event'])
  warnUnsaved(e: BeforeUnloadEvent): void {
    if (this.unsavedCount() > 0) e.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || this.previewVideo() || this.open()) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
    const box = this.searchBox()?.nativeElement;
    if (box) { e.preventDefault(); box.focus(); box.select(); }
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch {}
  }

  openPreview(v: YouTubeCheckupVideo): void {
    this.previewVideo.set(v);
  }

  closePreview(): void {
    this.previewVideo.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.previewVideo()) this.closePreview();
  }

  /** The audit as a spreadsheet: every video the filters show, with what each one is missing. */
  exportAudit(): void {
    const rows = this.rows();
    if (rows.length === 0) return;
    const header = ['Title', 'Video ID', 'URL', 'Published', 'Privacy', 'Format', 'Issues', 'Issue codes', 'Description chars', 'Tags', 'Playlists'];
    const lines = rows.map((v) => [
      v.title, v.videoId, v.videoUrl, v.publishedAt ?? '', v.privacy ?? '', v.isShort ? 'Short' : 'Video',
      v.issues.map((i) => i.message).join('; '), v.issues.map((i) => i.code).join(' '),
      v.description.length, v.tags.length, v.playlistIds.length,
    ].map(csvCell).join(','));
    const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-details-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notice.set(`Exported ${rows.length} video${rows.length === 1 ? '' : 's'} to CSV.`);
  }

  goToPage(index: number): void {
    this.page.set(Math.max(0, Math.min(index, this.pageCount() - 1)));
    this.open.set(null);
  }

  reconnect(): void {
    this.api.startConnect('/youtube/checkup').subscribe({
      next: (url) => { window.location.href = url; },
      error: (e: unknown) => this.error.set(message(e)),
    });
  }

  // --- rows

  state(videoId: string): RowState {
    return this.states()[videoId] ?? EMPTY_STATE;
  }

  /** 0-100: how many of the checks this video passes. */
  rowScore(v: YouTubeCheckupVideo): number {
    return Math.max(0, Math.round(((ISSUE_LABELS.length - v.issues.length) / ISSUE_LABELS.length) * 100));
  }

  hasChanges(v: YouTubeCheckupVideo): boolean {
    const d = this.state(v.videoId).draft;
    return !!d && draftDiffers(v, d);
  }

  openEditor(v: YouTubeCheckupVideo): void {
    if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
    this.open.set(v.videoId);
  }

  closeEditor(): void {
    this.open.set(null);
  }

  /** Opens the previous or next video in the list, and turns the page so its row is in view. */
  moveEditor(step: -1 | 1): void {
    const index = this.openIndex() + step;
    const v = this.rows()[index];
    if (!v) return;
    this.page.set(Math.floor(index / this.pageSize()));
    this.openEditor(v);
  }

  /** Saves from the dialog; "next" moves on to the following video once the save succeeds. */
  saveFromEditor(v: YouTubeCheckupVideo, next: boolean): void {
    const following = next ? this.rows()[this.openIndex() + 1] ?? null : null;
    this.runSave(v).subscribe((ok) => {
      if (!ok || this.open() !== v.videoId) return;
      if (following) this.openEditor(following); else this.closeEditor();
    });
  }

  thumbnailChanged(videoId: string): void {
    this.thumbVersions.update((all) => ({ ...all, [videoId]: Date.now() }));
  }

  /** The row's picture, reloaded past the browser cache after its thumbnail was changed here. */
  thumbSrc(v: YouTubeCheckupVideo): string | null {
    const version = this.thumbVersions()[v.videoId];
    if (!v.thumbnailUrl || !version) return v.thumbnailUrl;
    return `${v.thumbnailUrl}${v.thumbnailUrl.includes('?') ? '&' : '?'}v=${version}`;
  }

  setDraft(videoId: string, change: Partial<Draft>): void {
    const st = this.state(videoId);
    if (!st.draft) return;
    this.patch(videoId, { draft: { ...st.draft, ...change }, saved: false });
  }

  reset(v: YouTubeCheckupVideo): void {
    this.patch(v.videoId, { draft: this.draftFrom(v), error: null, warnings: [], saved: false });
  }

  suggest(v: YouTubeCheckupVideo, fresh = false): void {
    this.runSuggest(v, fresh).subscribe();
  }

  playlistTitle(id: string): string {
    return this.playlists().find((p) => p.id === id)?.title ?? id;
  }

  runTime(seconds: number | null): string {
    if (seconds === null || !Number.isFinite(seconds)) return '';
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // --- selection and bulk

  isSelected(v: YouTubeCheckupVideo): boolean {
    return this.selected().has(v.videoId);
  }

  toggleSelected(v: YouTubeCheckupVideo): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(v.videoId)) next.delete(v.videoId); else next.add(v.videoId);
      return next;
    });
  }

  selectShown(): void {
    this.selected.set(new Set(this.rows().map((v) => v.videoId)));
  }

  /** Ticks, or unticks if all are already ticked, every video on the current page. */
  togglePage(): void {
    const all = this.pageAllSelected();
    this.selected.update((s) => {
      const next = new Set(s);
      for (const v of this.pageRows()) { if (all) next.delete(v.videoId); else next.add(v.videoId); }
      return next;
    });
  }

  /** Adds the typed tags to every selected video's draft, keeping what each has and the tag-length budget. */
  addTagsToSelected(): void {
    const add = splitTags(this.bulkTags());
    const targets = this.selectedVideos();
    if (add.length === 0 || targets.length === 0) return;
    for (const v of targets) {
      if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
      const d = this.state(v.videoId).draft!;
      this.setDraft(v.videoId, { tagsText: fitTags([...splitTags(d.tagsText), ...add]).join(', ') });
    }
    this.bulkTags.set('');
    this.notice.set(`Added ${add.length} tag${add.length === 1 ? '' : 's'} to ${targets.length} draft${targets.length === 1 ? '' : 's'}. Review, then Save.`);
  }

  /** Appends a block of text (links, credits, hashtags) to the end of every selected video's description draft, once. */
  addDescriptionToSelected(): void {
    const block = this.bulkDescription().trim();
    const targets = this.selectedVideos();
    if (!block || targets.length === 0) return;
    let changed = 0;
    for (const v of targets) {
      if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
      const d = this.state(v.videoId).draft!;
      const next = insertAboveFooter(d.description, block, null);
      if (next !== d.description) { this.setDraft(v.videoId, { description: next }); changed++; }
    }
    this.bulkDescription.set('');
    this.notice.set(changed === 0
      ? 'Every selected description already has that text.'
      : `Added the text to ${changed} description${changed === 1 ? '' : 's'}. Review, then Save.`);
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  /** Sets the audience on every selected video's draft - a declaration the creator makes, so never by default. */
  setAudienceForSelected(madeForKids: boolean): void {
    for (const v of this.selectedVideos()) {
      if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
      this.setDraft(v.videoId, { madeForKids });
    }
  }

  addPlaylistForSelected(playlistId: string): void {
    if (!playlistId) return;
    for (const v of this.selectedVideos()) {
      if (v.playlistIds.includes(playlistId)) continue;
      if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
      const d = this.state(v.videoId).draft!;
      if (!d.addPlaylistIds.includes(playlistId)) this.setDraft(v.videoId, { addPlaylistIds: [...d.addPlaylistIds, playlistId] });
    }
  }

  draftAllSelected(): void {
    this.runQueue(this.selectedVideos(), 'Writing drafts', (v) => this.runSuggest(v));
  }

  saveAllSelected(): void {
    this.runQueue(this.draftsToSave(), 'Saving to YouTube', (v) => this.runSave(v));
  }

  // --- hand-off to the creator's own AI tool

  /** Copies a prompt for the selected videos (or just `v`) to paste into ChatGPT, Gemini or any AI tool. */
  async copyPrompt(v?: YouTubeCheckupVideo): Promise<void> {
    const list = v ? [v] : this.selectedVideos();
    if (list.length === 0) return;
    const prompt = buildHandoffPrompt(list, {
      channelTitle: this.channel()?.channelTitle ?? this.checkup()?.channelTitle ?? '',
      tone: this.tone(),
      language: this.language(),
      brief: this.brief(),
    });
    try {
      await navigator.clipboard.writeText(prompt);
      this.promptCopied.set(v?.videoId ?? 'selected');
      this.pasteOpen.set(true);
      setTimeout(() => this.promptCopied.set(null), 2500);
      if (!v && list.length > MAX_PROMPT_VIDEOS) {
        this.notice.set(`The prompt has the first ${MAX_PROMPT_VIDEOS} of ${list.length} selected videos - paste the answer, then copy again for the rest.`);
      }
    } catch {
      this.error.set('The browser did not allow copying. Allow clipboard access for this site and try again.');
    }
  }

  /** Fills drafts from a pasted answer. Saves nothing - each draft is reviewed and saved as usual. */
  applyPasted(): void {
    const byId = new Map(this.videos().map((v) => [v.videoId, v]));
    const result = parseHandoffAnswer(this.pasteText(), new Set(byId.keys()));
    if (result.error) {
      this.pasteReport.set({ ok: false, lines: [result.error] });
      return;
    }

    const filled: string[] = [];
    for (const a of result.answers) {
      const v = byId.get(a.videoId)!;
      const draft = this.state(v.videoId).draft ?? this.draftFrom(v);
      this.patch(v.videoId, {
        draft: this.merge(v, draft, {
          title: a.title || draft.title,
          description: a.description || draft.description,
          tags: a.tags,
          pinnedComment: a.pinnedComment,
          engagementComment: a.engagementComment,
          providerId: 'pasted',
        }),
        saved: false,
        error: null,
      });
      filled.push(v.videoId);
    }

    // Select what was filled so "Save N to YouTube" picks those drafts up.
    this.selected.set(new Set([...this.selected(), ...filled]));
    this.pasteReport.set({
      ok: filled.length > 0,
      lines: [
        `Filled ${filled.length} draft${filled.length === 1 ? '' : 's'}. Review them (Edit), choose the audience if it's missing, then Save.`,
        ...result.skipped,
      ],
    });
    if (filled.length > 0) this.pasteText.set('');
  }

  // --- internals

  private startTimer(): void {
    this.stopTimer();
    this.loadingSeconds.set(0);
    this.loadingTimer = setInterval(() => this.loadingSeconds.update((s) => s + 1), 1000);
  }

  private stopTimer(): void {
    if (this.loadingTimer !== null) clearInterval(this.loadingTimer);
    this.loadingTimer = null;
  }

  private runQueue(list: YouTubeCheckupVideo[], label: string, work: (v: YouTubeCheckupVideo) => Observable<boolean>): void {
    if (list.length === 0 || this.bulkRunning()) return;
    const queue = [...list];
    let done = 0, ok = 0, running = 0;
    this.bulkRunning.set(`${label} 0/${list.length}…`);
    const next = (): void => {
      while (running < PARALLEL && queue.length > 0) {
        const v = queue.shift()!;
        running++;
        work(v).subscribe((good) => {
          running--;
          done++;
          if (good) ok++;
          this.bulkRunning.set(`${label} ${done}/${list.length}…`);
          if (done === list.length) {
            this.bulkRunning.set(null);
            this.notice.set(`${label}: ${ok} of ${list.length} done${ok < list.length ? ' - the others show why on their row' : ''}.`);
          } else {
            next();
          }
        });
      }
    };
    next();
  }

  /** Emits once: whether a draft was written. Never errors - the row shows what went wrong. */
  private runSuggest(v: YouTubeCheckupVideo, fresh = false): Observable<boolean> {
    return new Observable<boolean>((sub) => {
      if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
      this.patch(v.videoId, { busy: 'suggest', error: null });
      return this.api.suggestForVideo(this.channelId(), v.videoId, {
        language: this.language(),
        fresh,
        tone: this.tone(),
        brief: this.brief().trim() || undefined,
        providerId: this.engine() || undefined,
      }).subscribe({
        next: (s) => {
          this.patch(v.videoId, { busy: null, draft: this.merge(v, this.state(v.videoId).draft!, s), saved: false });
          sub.next(true);
          sub.complete();
        },
        error: (e: unknown) => {
          this.patch(v.videoId, { busy: null, error: message(e) });
          sub.next(false);
          sub.complete();
        },
      });
    });
  }

  private runSave(v: YouTubeCheckupVideo): Observable<boolean> {
    return new Observable<boolean>((sub) => {
      const d = this.state(v.videoId).draft;
      if (!d) { sub.next(false); sub.complete(); return; }
      this.patch(v.videoId, { busy: 'save', error: null, warnings: [] });
      const channelId = this.channelId();
      // A schedule is set (or taken off) after the details, which leave a private video's own schedule alone.
      const scheduleChange = scheduleDiffers(v, d);
      const publishAt = d.scheduled ? fromLocalInput(d.publishAtLocal) : null;
      return this.api.saveVideoDetails(channelId, v.videoId, {
        metadata: {
          title: d.title.trim(),
          description: d.description.trim(),
          tags: splitTags(d.tagsText),
          categoryId: d.categoryId,
          privacy: d.scheduled ? 'private' : d.privacy,
          madeForKids: d.madeForKids,
          notifySubscribers: false,
        },
        addToPlaylistIds: d.addPlaylistIds,
        currentPlaylistIds: v.playlistIds,
        playlistsKnown: !this.checkup()?.playlistError,
      }).pipe(
        switchMap((res) => !scheduleChange
          ? of(res)
          : this.api.scheduleVideo(channelId, v.videoId, publishAt).pipe(
            map((s) => ({ ...res, video: { ...res.video, privacy: s.privacy, scheduledAt: s.scheduledAt } })),
            // The details are saved; a refused schedule is reported on the row, not lost with them.
            catchError((e: unknown) => of({ ...res, warnings: [...res.warnings, `Details saved, but the schedule wasn't: ${message(e)}`] })),
          )),
      ).subscribe({
        next: (res) => {
          this.checkup.update((c) => c ? { ...c, videos: c.videos.map((x) => x.videoId === v.videoId ? res.video : x) } : c);
          this.patch(v.videoId, { busy: null, saved: true, warnings: res.warnings, draft: this.draftFrom(res.video) });
          sub.next(true);
          sub.complete();
        },
        error: (e: unknown) => {
          this.patch(v.videoId, { busy: null, error: message(e) });
          sub.next(false);
          sub.complete();
        },
      });
    });
  }

  private patch(videoId: string, change: Partial<RowState>): void {
    this.states.update((all) => ({ ...all, [videoId]: { ...(all[videoId] ?? EMPTY_STATE), ...change } }));
  }

  private draftFrom(v: YouTubeCheckupVideo): Draft {
    const categories = this.categories();
    const categoryId = v.categoryId && categories.some((c) => c.id === v.categoryId)
      ? v.categoryId
      : (categories.find((c) => c.id === '22') ?? categories[0])?.id ?? '22';
    const privacy = (['public', 'unlisted', 'private'] as const).find((p) => p === v.privacy) ?? 'public';
    const scheduled = privacy === 'private' && !!v.scheduledAt;
    return {
      scheduled,
      publishAtLocal: scheduled ? toLocalInput(v.scheduledAt) : '',
      title: v.title,
      description: v.description,
      tagsText: v.tags.join(', '),
      categoryId,
      privacy,
      madeForKids: v.madeForKids,
      addPlaylistIds: [],
      titleOptions: [],
      descriptionOptions: [],
      tagIdeas: [],
    };
  }

  /**
   * Folds an AI suggestion into the draft without throwing away what the creator wrote: a
   * real title stays (the AI's goes to the options), a real description stays and only gains
   * the hashtags it lacks, and tags are added to rather than replaced.
   */
  private merge(v: YouTubeCheckupVideo, d: Draft, s: YouTubeSuggestion): Draft {
    const has = (code: string) => v.issues.some((i) => i.code === code);
    const replaceTitle = has('title-default') || d.title.trim().length === 0;
    const replaceDescription = has('description-missing') || has('description-short') || d.description.trim().length === 0;

    let description = d.description;
    const offered = [...(s.descriptionOptions ?? [])];
    if (replaceDescription) {
      description = s.description;
    } else {
      offered.unshift(s.description);
      if (!HASHTAG.test(`${d.title}\n${d.description}`)) {
        const tags = [...new Set(s.description.match(HASHTAGS) ?? [])].slice(0, 5);
        if (tags.length > 0) description = `${d.description.trimEnd()}\n\n${tags.join(' ')}`;
      }
    }

    const titles = [s.title, ...(s.titleOptions ?? [])].filter((t) => t && t !== d.title);
    return {
      ...d,
      title: replaceTitle ? s.title : d.title,
      description,
      tagsText: fitTags([...splitTags(d.tagsText), ...s.tags]).join(', '),
      titleOptions: replaceTitle ? titles.filter((t) => t !== s.title) : titles,
      descriptionOptions: offered.filter((o) => o && o !== description),
      tagIdeas: (s.tagIdeas ?? []).filter((t) => !splitTags(d.tagsText).includes(t)),
      pinnedComment: s.pinnedComment || d.pinnedComment,
      engagementComment: s.engagementComment || d.engagementComment,
      transcriptText: s.transcriptText ?? d.transcriptText,
    };
  }

  toneLabel(t: string): string {
    return toneLabel(t);
  }

  languageLabel(id: string): string {
    return languageLabel(id);
  }

  generateUrlSeo(): void {
    const url = this.urlSeoInput().trim();
    if (!url || this.urlSeoBusy()) return;
    this.urlSeoBusy.set(true);
    this.urlSeoError.set(null);
    this.api.generateSeoFromUrl({
      url,
      language: this.language(),
      tone: this.tone(),
      brief: this.brief().trim() || undefined,
      providerId: this.engine() || undefined,
      channelId: this.channelId() || undefined,
    }).subscribe({
      next: (res) => {
        this.urlSeoResult.set(res);
        this.urlSeoBusy.set(false);
      },
      error: (e: unknown) => {
        this.urlSeoError.set(message(e));
        this.urlSeoBusy.set(false);
      },
    });
  }

  async copyUrlField(key: string, text: string): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.urlCopiedKey.set(key);
      setTimeout(() => {
        if (this.urlCopiedKey() === key) this.urlCopiedKey.set(null);
      }, 2000);
    } catch {
      this.error.set('Clipboard access was blocked by the browser.');
    }
  }

  hasChannelVideo(videoId: string): boolean {
    return this.videos().some((v) => v.videoId === videoId);
  }

  applyUrlSeoToChannelVideo(res: YouTubeUrlSeoResult): void {
    const v = this.videos().find((x) => x.videoId === res.videoId);
    if (!v) return;
    const draft = this.state(v.videoId).draft ?? this.draftFrom(v);
    this.patch(v.videoId, {
      draft: this.merge(v, draft, res.suggestion),
      saved: false,
      error: null,
    });
    this.openEditor(v);
  }
}

function sortVideos(list: YouTubeCheckupVideo[], sort: Sort): YouTubeCheckupVideo[] {
  const time = (v: YouTubeCheckupVideo) => (v.publishedAt ? Date.parse(v.publishedAt) || 0 : 0);
  const weight = (v: YouTubeCheckupVideo) => v.issues.reduce((n, i) => n + (i.severity === 'high' ? 10 : 1), 0);
  const sorted = [...list];
  switch (sort) {
    case 'oldest': return sorted.sort((a, b) => time(a) - time(b));
    case 'most-missing': return sorted.sort((a, b) => weight(b) - weight(a) || time(b) - time(a));
    case 'title': return sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
    default: return sorted.sort((a, b) => time(b) - time(a));
  }
}

/** The last check size chosen in this browser, or the default when none was (or storage is off). */
function loadCheckSize(): number {
  try {
    const saved = Number((JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { max?: unknown }).max);
    return CHECK_SIZES.find((s) => s === saved) ?? DEFAULT_CHECK_SIZE;
  } catch {
    return DEFAULT_CHECK_SIZE;
  }
}

function message(e: unknown): string {
  return e instanceof ApiFailure || e instanceof Error ? e.message : 'Something went wrong.';
}
