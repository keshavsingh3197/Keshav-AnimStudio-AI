import { DatePipe } from '@angular/common';
import {
  Component, DestroyRef, ElementRef, HostListener, Injector, OnDestroy, OnInit, afterNextRender, computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, catchError, concatMap, from, map, mergeMap, of, tap, toArray } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { BrandChannel } from '../../core/models/api.models';
import { YouTubeChannel, YouTubePublishStatus } from '../../core/models/youtube.models';
import { AdminSettingsService, ChannelBranding, ChannelPublishSettings, OMKR_BRANDING } from '../../core/services/admin-settings.service';
import { ApiService } from '../../core/services/api.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { AdminIconComponent } from './admin-channel-kit';
import { copyText, fold, isTypingTarget, messageOf, plural, readStored, safePicture, writeStored } from './admin-channel-utils';
import {
  BRAND_TAG_RULES, BRAND_TEXT_MAX, BrandTextField, BulkChoice, BulkPlan, BulkTagMode, CHANNEL_TAG_RULES, HASHTAG_RULES, Health, HealthAction,
  HealthLevel, MAX_COMMENT_LENGTH, MAX_FOOTER_BYTES, NO_BULK, PRIVACY_OPTIONS, Privacy, brandKey, brandTextProblem, brandUrlProblem,
  bulkFieldCount, bulkStamp, channelHealth, commentProblem, describeChoice, emptyBranding, footerProblem, footerReport, footerSegments,
  hasAnyBranding, inheritedBranding, isPrivacy, planBulk, tagListProblem,
} from './admin-publishing.logic';
import { AdminTagEditorComponent } from './admin-tag-editor.component';

type Phase = 'loading' | 'ready' | 'error';
type Settled = 'loading' | 'ok' | 'error';
type ListFilter = 'all' | 'attention' | 'linked' | 'unlinked';
type BulkPhase = 'pick' | 'reading' | 'preview' | 'applying' | 'done';

interface Entry {
  c: BrandChannel;
  key: string;
  settings: ChannelPublishSettings | undefined;
  health: Health;
}

interface Problem {
  /** The id of the field to take the user to. */
  id: string;
  message: string;
}

interface BulkRow {
  key: string;
  name: string;
  before: ChannelPublishSettings | null;
  plan: BulkPlan | null;
  error: string | null;
}

interface BulkResult {
  ok: boolean;
  message: string;
}

interface BrandIssues {
  channelName: string | null;
  tagline: string | null;
  channelUrl: string | null;
  studioUrl: string | null;
  creatorUrl: string | null;
  engineName: string | null;
  visualsCredit: string | null;
  hashtags: string | null;
  tags: string | null;
}

const PREFS_KEY = 'animstudio.admin.publishing.view';
const LIST_STEP = 40;

/**
 * Per brand channel: the YouTube channel its videos publish to and what every upload starts
 * with. The Publish dialog pre-fills from this for any project on the channel, so once it is
 * set up publishing is a single click.
 * <p>
 * Pick a channel on the left (each shows whether it is ready to publish), edit it on the right,
 * and - for a studio with many channels - copy chosen defaults to others with a preview first.
 * </p>
 */
@Component({
  selector: 'app-admin-publishing',
  imports: [DatePipe, RouterLink, AdminIconComponent, AdminTagEditorComponent],
  templateUrl: './admin-publishing.component.html',
  styleUrl: './admin-publishing.component.css',
})
export class AdminPublishingComponent implements OnInit, OnDestroy {
  private readonly admin = inject(AdminSettingsService);
  private readonly api = inject(ApiService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly privacyOptions = PRIVACY_OPTIONS;
  readonly channelTagRules = CHANNEL_TAG_RULES;
  readonly hashtagRules = HASHTAG_RULES;
  readonly brandTagRules = BRAND_TAG_RULES;
  readonly brandMax = BRAND_TEXT_MAX;
  readonly maxFooter = MAX_FOOTER_BYTES;
  readonly maxComment = MAX_COMMENT_LENGTH;
  readonly plural = plural;
  readonly skeletons = [0, 1, 2, 3, 4];

  // ---- what the server told us
  readonly brandChannels = signal<BrandChannel[]>([]);
  readonly phase = signal<Phase>('loading');
  readonly loadError = signal<string | null>(null);
  readonly yt = signal<YouTubePublishStatus | null>(null);
  readonly ytState = signal<Settled>('loading');
  /** The settings of every channel read so far, by brand key - what the list's health and visibility come from. */
  readonly details = signal<Record<string, ChannelPublishSettings>>({});

  // ---- the channel being edited
  readonly channelId = signal<string | null>(null);
  readonly form = signal<ChannelPublishSettings | null>(null);
  private readonly original = signal('');
  readonly editor = signal<'idle' | 'loading' | 'error'>('loading');
  readonly editorError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<{ message: string; code: string } | null>(null);
  readonly savedAt = signal<Date | null>(null);
  readonly pendingSwitch = signal<string | null>(null);
  readonly staleNotice = signal<string | null>(null);

  // ---- the list
  private readonly saved = this.readPrefs();
  readonly query = signal('');
  readonly listFilter = signal<ListFilter>(this.saved.filter);
  readonly brandingOpen = signal(this.saved.brandingOpen);
  readonly pickerOpen = signal(false);
  readonly shown = signal(LIST_STEP);

  // ---- YouTube actions
  readonly connecting = signal(false);
  readonly checking = signal(false);
  readonly checkReport = signal<{ count: number; failed: { channelId: string; channelTitle: string; reason: string }[] } | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly liveMessage = signal('');

  // ---- bulk apply
  readonly bulkOpen = signal(false);

  // ---- studio-wide AI branding (one form for every channel, saved on its own)
  /** What the server has: what every channel's blank fields inherit right now. */
  readonly studio = signal<ChannelBranding | null>(null);
  readonly studioForm = signal<ChannelBranding | null>(null);
  readonly studioState = signal<'loading' | 'idle' | 'error'>('loading');
  readonly studioError = signal<string | null>(null);
  readonly studioSaving = signal(false);
  readonly studioSavedAt = signal<Date | null>(null);
  readonly studioOpen = signal(false);
  readonly bulkPhase = signal<BulkPhase>('pick');
  readonly bulkChoice = signal<BulkChoice>(NO_BULK);
  readonly bulkTargets = signal<ReadonlySet<string>>(new Set());
  readonly bulkQuery = signal('');
  readonly bulkRows = signal<BulkRow[]>([]);
  readonly bulkProgress = signal({ done: 0, total: 0, name: '' });
  readonly bulkResults = signal<Record<string, BulkResult>>({});
  readonly bulkUndo = signal<{ key: string; name: string; before: ChannelPublishSettings }[]>([]);
  readonly bulkUndone = signal(false);
  private readonly bulkStampAtPreview = signal('');

  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('search');
  private loadSub?: Subscription;
  private bulkSub?: Subscription;
  private patienceTimer?: ReturnType<typeof setTimeout>;
  private copiedTimer?: ReturnType<typeof setTimeout>;
  private readonly prefetch$ = new Subject<string>();
  private readonly requested = new Set<string>();
  /** After a moment the page stops waiting for the connection status and shows what it has. */
  private readonly patience = signal(false);
  readonly copied = signal(false);

  /**
   * The list waits (as a skeleton) until the connections have answered, so the banners they
   * decide on don't push everything down a moment after the page appeared.
   */
  readonly stage = computed<'loading' | 'ready' | 'error'>(() => {
    if (this.phase() === 'error') return 'error';
    return this.phase() === 'ready' && (this.ytState() !== 'loading' || this.patience()) ? 'ready' : 'loading';
  });

  // ---- derived
  readonly currentKey = computed(() => this.channelId() ?? 'default');
  readonly currentBrand = computed(() => this.brandChannels().find((c) => brandKey(c) === this.currentKey()) ?? null);
  readonly dirty = computed(() => {
    const f = this.form();
    return !!f && JSON.stringify(f) !== this.original();
  });

  readonly entries = computed<Entry[]>(() => {
    const yt = this.yt();
    const det = this.details();
    return this.brandChannels().map((c) => {
      const key = brandKey(c);
      const settings = det[key];
      return { c, key, settings, health: channelHealth(c, yt, settings) };
    });
  });
  private readonly searched = computed(() => {
    const tokens = fold(this.query()).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return this.entries();
    return this.entries().filter((e) => {
      const text = fold([e.c.name, e.c.youTubeChannelHandle, e.c.youTubeChannelTitle, e.key].filter(Boolean).join(' '));
      return tokens.every((t) => text.includes(t));
    });
  });
  readonly visible = computed(() => this.searched().filter((e) => this.matches(e, this.listFilter())));
  readonly listed = computed(() => this.visible().slice(0, this.shown()));
  readonly counts = computed(() => {
    const s = this.searched();
    return {
      all: s.length,
      attention: s.filter((e) => this.matches(e, 'attention')).length,
      linked: s.filter((e) => this.matches(e, 'linked')).length,
      unlinked: s.filter((e) => this.matches(e, 'unlinked')).length,
    };
  });
  readonly kpis = computed(() => {
    const all = this.entries();
    return {
      total: all.length,
      linked: all.filter((e) => !!e.c.youTubeChannelId).length,
      ready: all.filter((e) => e.health.level === 'ok').length,
      attention: all.filter((e) => e.health.level === 'warn' || e.health.level === 'err').length,
      unlinked: all.filter((e) => !e.c.youTubeChannelId).length,
      unread: all.filter((e) => !e.settings).length,
    };
  });
  readonly reconnectCount = computed(() => this.entries().filter((e) => e.health.issues.some((i) => i.id === 'token')).length);

  /** The channel's health as it would be if the form were saved now. */
  readonly health = computed(() => {
    const b = this.currentBrand();
    const f = this.form();
    if (!b) return null;
    return channelHealth({ ...b, youTubeChannelId: f ? f.youTubeChannelId : b.youTubeChannelId }, this.yt(), f);
  });
  readonly connection = computed<YouTubeChannel | undefined>(() => {
    const id = this.form()?.youTubeChannelId;
    return id ? this.yt()?.channels.find((c) => c.channelId === id) : undefined;
  });
  readonly connectedHere = computed(() => !!this.connection());
  readonly pickedPicture = computed(() => {
    const url = this.connection()?.thumbnailUrl ?? this.form()?.youTubeThumbnailUrl;
    return safePicture(url);
  });
  /** YouTube channel id → name of the other brand channel already publishing to it. */
  readonly linkedElsewhere = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.brandChannels()) {
      if (c.youTubeChannelId && brandKey(c) !== this.currentKey()) map.set(c.youTubeChannelId, c.name);
    }
    return map;
  });
  readonly categories = computed(() => this.yt()?.categories ?? []);

  readonly brand = computed<ChannelBranding>(() => this.form()?.branding ?? emptyBranding());
  readonly brandIssues = computed<BrandIssues>(() => {
    const b = this.brand();
    return {
      channelName: brandTextProblem(b.channelName, BRAND_TEXT_MAX.channelName),
      tagline: brandTextProblem(b.tagline, BRAND_TEXT_MAX.tagline),
      channelUrl: brandUrlProblem(b.channelUrl),
      studioUrl: brandUrlProblem(b.studioUrl),
      creatorUrl: brandUrlProblem(b.creatorUrl),
      engineName: brandTextProblem(b.engineName, BRAND_TEXT_MAX.engineName),
      visualsCredit: brandTextProblem(b.visualsCredit, BRAND_TEXT_MAX.visualsCredit),
      hashtags: tagListProblem(b.hashtags, HASHTAG_RULES),
      tags: tagListProblem(b.tags, BRAND_TAG_RULES),
    };
  });

  /** What each blank field of this channel falls back to: the saved studio defaults, else its YouTube link. */
  readonly inherited = computed(() => inheritedBranding(this.studio(), this.form(), this.currentBrand()?.name));

  readonly studioBrand = computed<ChannelBranding>(() => this.studioForm() ?? emptyBranding());
  readonly studioDirty = computed(() => {
    const f = this.studioForm();
    return !!f && JSON.stringify(f) !== JSON.stringify(this.studio() ?? emptyBranding());
  });
  readonly studioIssues = computed(() => {
    const b = this.studioBrand();
    return {
      tagline: brandTextProblem(b.tagline, BRAND_TEXT_MAX.tagline),
      studioUrl: brandUrlProblem(b.studioUrl),
      creatorUrl: brandUrlProblem(b.creatorUrl),
      engineName: brandTextProblem(b.engineName, BRAND_TEXT_MAX.engineName),
      visualsCredit: brandTextProblem(b.visualsCredit, BRAND_TEXT_MAX.visualsCredit),
      hashtags: tagListProblem(b.hashtags, HASHTAG_RULES),
      tags: tagListProblem(b.tags, BRAND_TAG_RULES),
    };
  });
  readonly canSaveStudio = computed(() =>
    this.studioDirty() && !this.studioSaving() && this.studioState() === 'idle' && Object.values(this.studioIssues()).every((v) => !v));
  /** This site's own address, offered as the studio link. */
  readonly siteUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/`;

  readonly footer = computed(() => footerReport(this.form()?.descriptionFooter));
  readonly footerPercent = computed(() => Math.min(100, Math.round((this.footer().bytes / MAX_FOOTER_BYTES) * 100)));
  readonly footerLines = computed(() => this.footer().text.split('\n'));
  readonly commentLength = computed(() => (this.form()?.firstComment ?? '').replace(/\r\n/g, '\n').trim().length);
  readonly commentNote = computed(() => {
    const f = this.form();
    if (!f || !(f.firstComment ?? '').trim()) return null;
    if (f.madeForKids) return 'YouTube turns comments off on videos made for kids, so this won’t be posted while uploads are marked that way.';
    if ((f.privacy ?? '').toLowerCase() === 'private') return 'A private video has no one to read a comment, so it isn’t posted while uploads start private.';
    return null;
  });

  readonly problems = computed<Problem[]>(() => {
    const f = this.form();
    if (!f) return [];
    const out: Problem[] = [];
    if (!isPrivacy((f.privacy ?? '').toLowerCase())) out.push({ id: 'pb-privacy', message: 'Choose a default visibility.' });
    const tags = tagListProblem(f.tags ?? [], CHANNEL_TAG_RULES);
    if (tags) out.push({ id: 'pb-tags', message: tags });
    const foot = footerProblem(f.descriptionFooter);
    if (foot) out.push({ id: 'pb-footer', message: foot });
    const comment = commentProblem(f.firstComment);
    if (comment) out.push({ id: 'pb-comment', message: comment });
    const owner = f.youTubeChannelId ? this.linkedElsewhere().get(f.youTubeChannelId) : undefined;
    if (owner) out.push({ id: 'pb-link', message: `That YouTube channel already publishes for “${owner}”. Unlink it there first.` });
    const bi = this.brandIssues();
    const labels: [keyof BrandIssues, string][] = [
      ['channelName', 'Channel name'], ['tagline', 'Tagline'], ['channelUrl', 'YouTube channel link'], ['studioUrl', 'Studio link'],
      ['creatorUrl', 'Creator link'], ['engineName', 'Animation tool'], ['visualsCredit', 'Visuals credit'], ['hashtags', 'Brand hashtags'], ['tags', 'Brand search tags'],
    ];
    for (const [k, label] of labels) if (bi[k]) out.push({ id: `pb-b-${k}`, message: `${label}: ${bi[k]}` });
    return out;
  });
  readonly canSave = computed(() => this.dirty() && !this.saving() && this.editor() === 'idle' && this.problems().length === 0);

  // ---- bulk, derived
  readonly bulkCount = computed(() => bulkFieldCount(this.bulkChoice()));
  readonly bulkCandidates = computed(() => {
    const tokens = fold(this.bulkQuery()).split(/\s+/).filter(Boolean);
    return this.entries().filter((e) => e.key !== this.currentKey()
      && tokens.every((t) => fold(`${e.c.name} ${e.c.youTubeChannelHandle ?? ''} ${e.key}`).includes(t)));
  });
  readonly bulkSourceProblem = computed(() => {
    const f = this.form();
    const c = this.bulkChoice();
    if (!f) return null;
    if (c.privacy && !isPrivacy((f.privacy ?? '').toLowerCase())) return 'The form has no visibility to copy yet.';
    if (c.tags !== 'off') { const p = tagListProblem(f.tags ?? [], CHANNEL_TAG_RULES); if (p) return p; }
    if (c.descriptionFooter) { const p = footerProblem(f.descriptionFooter); if (p) return p; }
    if (c.firstComment) { const p = commentProblem(f.firstComment); if (p) return p; }
    if (c.branding) {
      const bi = this.brandIssues();
      const p = bi.tagline ?? bi.studioUrl ?? bi.creatorUrl ?? bi.engineName ?? bi.visualsCredit ?? bi.hashtags ?? bi.tags;
      if (p) return `AI branding: ${p}`;
    }
    return null;
  });
  readonly canPreview = computed(() =>
    this.bulkCount() > 0 && [...this.bulkTargets()].some((k) => k !== this.currentKey()) && !this.bulkSourceProblem() && this.editor() === 'idle');
  readonly bulkStale = computed(() => this.bulkPhase() === 'preview' && this.bulkStampAtPreview() !== bulkStamp(this.form(), this.bulkChoice()));
  readonly bulkSummary = computed(() => {
    const rows = this.bulkRows();
    const changing = rows.filter((r) => r.plan && !r.plan.blocked && r.plan.changes.length > 0).length;
    const blocked = rows.filter((r) => r.error || r.plan?.blocked).length;
    return { changing, blocked, same: rows.length - changing - blocked };
  });
  readonly bulkOutcome = computed(() => {
    const r = Object.values(this.bulkResults());
    return { ok: r.filter((x) => x.ok).length, failed: r.filter((x) => !x.ok).length };
  });

  constructor() {
    effect(() => writeStored(PREFS_KEY, { filter: this.listFilter(), brandingOpen: this.brandingOpen() }));

    // The list shows each channel's health and visibility, which live in its own settings: read them
    // for the rows on screen, a few at a time, so a long list never fires a burst of requests.
    effect(() => {
      const keys = this.listed().map((e) => e.key);
      untracked(() => keys.forEach((k) => this.prefetch(k)));
    });
    this.prefetch$.pipe(
      mergeMap((key) => this.admin.publishing(key === 'default' ? null : key).pipe(
        map((s) => ({ key, s })),
        catchError(() => of(null))), 3),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((r) => { if (r) this.cache(r.key, r.s); });
  }

  ngOnInit(): void {
    const channel = this.route.snapshot.queryParamMap.get('channel');
    this.channelId.set(channel && channel !== 'default' ? channel : null);
    this.patienceTimer = setTimeout(() => this.patience.set(true), 2500);
    this.loadBrands();
    this.loadYouTube();
    this.loadStudio();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    this.bulkSub?.unsubscribe();
    clearTimeout(this.patienceTimer);
    clearTimeout(this.copiedTimer);
  }

  private readPrefs(): { filter: ListFilter; brandingOpen: boolean } {
    const raw = readStored(PREFS_KEY) as { filter?: unknown; brandingOpen?: unknown } | null;
    const filters: ListFilter[] = ['all', 'attention', 'linked', 'unlinked'];
    return {
      filter: filters.find((f) => f === raw?.filter) ?? 'all',
      brandingOpen: raw?.brandingOpen === true,
    };
  }

  // ---------------------------------------------------------------------------------- loading

  loadBrands(): void {
    this.phase.set('loading');
    this.loadError.set(null);
    this.api.listBrandChannels().subscribe({
      next: (list) => {
        this.brandChannels.set(list);
        this.phase.set('ready');
        this.ensureKnownChannel(list);
        this.loadSettings();
      },
      error: (e: unknown) => { this.phase.set('error'); this.loadError.set(messageOf(e)); },
    });
  }

  loadYouTube(): void {
    this.ytState.set('loading');
    this.youtube.status().subscribe({
      next: (st) => { this.yt.set(st); this.ytState.set('ok'); },
      error: () => { this.yt.set(null); this.ytState.set('error'); },
    });
  }

  /** A link to a channel that was deleted falls back to the default, and says so. */
  private ensureKnownChannel(list: BrandChannel[]): void {
    const id = this.channelId();
    if (id && !list.some((c) => c.id === id)) {
      this.channelId.set(null);
      this.staleNotice.set('That brand channel no longer exists (it may have been deleted), so the default channel is shown.');
      void this.router.navigate([], { relativeTo: this.route, queryParams: { channel: null }, replaceUrl: true });
    }
  }

  loadSettings(): void {
    this.loadSub?.unsubscribe();
    this.editor.set('loading');
    this.editorError.set(null);
    const key = this.currentKey();
    // The list needn't read this channel again for its own row.
    this.requested.add(key);
    this.loadSub = this.admin.publishing(this.channelId()).subscribe({
      next: (s) => {
        this.apply(s);
        this.cache(key, s);
        this.editor.set('idle');
      },
      error: (e: unknown) => {
        // Never leave the previous channel's values on screen as if they were this one's.
        this.form.set(null);
        this.original.set('');
        this.editor.set('error');
        this.editorError.set(messageOf(e));
      },
    });
  }

  private apply(s: ChannelPublishSettings): void {
    const f: ChannelPublishSettings = { ...s, tags: s.tags ?? [] };
    this.form.set(f);
    this.original.set(JSON.stringify(f));
  }

  private cache(key: string, s: ChannelPublishSettings): void {
    this.details.update((d) => ({ ...d, [key]: { ...s, tags: s.tags ?? [] } }));
  }

  private prefetch(key: string): void {
    if (this.requested.has(key)) return;
    this.requested.add(key);
    this.prefetch$.next(key);
  }

  private refreshBrandChannels(): void {
    // Linking a YouTube channel renames the brand after it, so the names are read again.
    this.api.listBrandChannels().subscribe({ next: (list) => this.brandChannels.set(list), error: () => undefined });
  }

  // ------------------------------------------------------------------------------- list controls

  val(e: Event): string {
    return (e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  checked(e: Event): boolean {
    return (e.target as HTMLInputElement).checked;
  }

  private matches(e: Entry, f: ListFilter): boolean {
    switch (f) {
      case 'attention': return e.health.level === 'warn' || e.health.level === 'err';
      case 'linked': return !!e.c.youTubeChannelId;
      case 'unlinked': return !e.c.youTubeChannelId;
      default: return true;
    }
  }

  setFilter(f: ListFilter): void {
    this.listFilter.set(f);
    this.shown.set(LIST_STEP);
  }

  onQuery(e: Event): void {
    this.query.set(this.val(e));
    this.shown.set(LIST_STEP);
  }

  onQueryKey(e: Event): void {
    if (this.query()) {
      this.query.set('');
      e.stopPropagation();
    } else {
      (e.target as HTMLElement).blur();
    }
  }

  focusSearch(): void {
    this.pickerOpen.set(true);
    afterNextRender(() => {
      const el = this.searchBox()?.nativeElement;
      el?.focus();
      el?.select();
    }, { injector: this.injector });
  }

  isCurrent(c: BrandChannel): boolean {
    return brandKey(c) === this.currentKey();
  }

  // ---------------------------------------------------------------------------- switching channel

  selectBrand(c: BrandChannel): void {
    const key = brandKey(c);
    if (key === this.currentKey()) { this.pickerOpen.set(false); return; }
    if (this.dirty()) { this.pendingSwitch.set(key); return; }
    this.switchTo(key);
  }

  confirmSwitch(save: boolean): void {
    const target = this.pendingSwitch();
    if (!target) return;
    if (!save) { this.switchTo(target); return; }
    if (!this.canSave()) return;
    this.save(() => this.switchTo(target));
  }

  private switchTo(key: string): void {
    this.pendingSwitch.set(null);
    this.pickerOpen.set(false);
    this.saveError.set(null);
    this.savedAt.set(null);
    this.staleNotice.set(null);
    this.resetBulk();
    // Switching on purpose gives up the edits: the old values stay on screen, dimmed, until the new ones arrive.
    const old = this.form();
    if (old) this.original.set(JSON.stringify(old));
    this.channelId.set(key === 'default' ? null : key);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { channel: this.channelId() }, replaceUrl: true });
    this.loadSettings();
  }

  nameOf(key: string): string {
    return this.brandChannels().find((c) => brandKey(c) === key)?.name ?? 'another channel';
  }

  discard(): void {
    const original = this.original();
    if (original) this.form.set(JSON.parse(original) as ChannelPublishSettings);
    this.saveError.set(null);
  }

  // ---------------------------------------------------------------------------------- the form

  patch(change: Partial<ChannelPublishSettings>): void {
    this.savedAt.set(null);
    this.saveError.set(null);
    this.form.update((f) => f && { ...f, ...change });
  }

  privacyOf(f: ChannelPublishSettings): Privacy | null {
    const p = (f.privacy ?? '').toLowerCase();
    return isPrivacy(p) ? p : null;
  }

  privacyLabel(value: string | null | undefined): string {
    return PRIVACY_OPTIONS.find((o) => o.id === (value ?? '').toLowerCase())?.label ?? '';
  }

  categoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  pickYouTube(id: string): void {
    const match = this.yt()?.channels.find((c) => c.channelId === id);
    const keep = id && id === this.form()?.youTubeChannelId;
    this.patch({
      youTubeChannelId: id || null,
      youTubeChannelTitle: match?.channelTitle ?? (keep ? this.form()?.youTubeChannelTitle ?? null : null),
      youTubeChannelHandle: match?.channelHandle ?? (keep ? this.form()?.youTubeChannelHandle ?? null : null),
      youTubeThumbnailUrl: match?.thumbnailUrl ?? (keep ? this.form()?.youTubeThumbnailUrl ?? null : null),
    });
  }

  patchBrand(change: Partial<ChannelBranding>): void {
    this.patch({ branding: { ...this.brand(), ...change } });
  }

  useOmkrBranding(): void {
    this.patch({ branding: { ...OMKR_BRANDING, hashtags: [...OMKR_BRANDING.hashtags], tags: [...OMKR_BRANDING.tags] } });
  }

  clearBranding(): void {
    this.patch({ branding: null });
  }

  /** The placeholder a blank branding field shows: what it inherits, else an example. */
  brandHint(field: BrandTextField, example: string): string {
    return this.inherited().fields[field].value ?? example;
  }

  /** Whether a blank field is inheriting something, and from where - for the small note under it. */
  inheritNote(field: BrandTextField): string | null {
    if ((this.brand()[field] ?? '').trim()) return null;
    const i = this.inherited().fields[field];
    if (!i.source) return null;
    const from = i.source === 'studio' ? 'Inherited from studio defaults' : 'Auto from YouTube';
    return this.inherited().active ? from : `${from} once any branding is set`;
  }

  // ---------------------------------------------------------------------------- studio branding

  loadStudio(): void {
    this.studioState.set('loading');
    this.studioError.set(null);
    this.admin.studioBranding().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (b) => { this.applyStudio(b); this.studioState.set('idle'); },
      error: (e: unknown) => { this.studioState.set('error'); this.studioError.set(messageOf(e)); },
    });
  }

  private applyStudio(b: ChannelBranding): void {
    const clean: ChannelBranding = { ...emptyBranding(), ...b, channelName: null, channelUrl: null, hashtags: b.hashtags ?? [], tags: b.tags ?? [] };
    this.studio.set(hasAnyBranding(clean) ? clean : null);
    this.studioForm.set({ ...clean, hashtags: [...clean.hashtags], tags: [...clean.tags] });
  }

  patchStudio(change: Partial<ChannelBranding>): void {
    this.studioSavedAt.set(null);
    this.studioError.set(null);
    this.studioForm.update((f) => ({ ...(f ?? emptyBranding()), ...change }));
  }

  /** Fills the studio link with this site's address - taken from the browser, never from the server. */
  useThisSite(): void {
    if (this.siteUrl) this.patchStudio({ studioUrl: this.siteUrl });
  }

  useOmkrStudio(): void {
    const o = OMKR_BRANDING;
    this.patchStudio({
      tagline: o.tagline, studioUrl: o.studioUrl, creatorUrl: o.creatorUrl, engineName: o.engineName, visualsCredit: o.visualsCredit,
      hashtags: [...o.hashtags], tags: [...o.tags],
    });
  }

  resetStudio(): void {
    const s = this.studio() ?? emptyBranding();
    this.studioForm.set({ ...s, hashtags: [...s.hashtags], tags: [...s.tags] });
    this.studioError.set(null);
  }

  saveStudio(): void {
    const f = this.studioForm();
    if (!f || !this.canSaveStudio()) return;
    this.studioSaving.set(true);
    this.studioError.set(null);
    this.admin.saveStudioBranding({ ...f, channelName: null, channelUrl: null }).subscribe({
      next: (b) => {
        this.studioSaving.set(false);
        this.applyStudio(b);
        this.studioSavedAt.set(new Date());
        this.liveMessage.set('Studio branding saved. Every channel’s blank branding fields now use it.');
      },
      error: (e: unknown) => { this.studioSaving.set(false); this.studioError.set(messageOf(e)); },
    });
  }

  lineParts(line: string): { text: string; link: boolean }[] {
    return footerSegments(line);
  }

  initial(name: string): string {
    return (Array.from(name.trim())[0] ?? '?').toUpperCase();
  }

  safePicture(url: string | null | undefined): string | null {
    return safePicture(url);
  }

  handleOf(c: BrandChannel): string {
    return c.youTubeChannelHandle || c.youTubeChannelTitle || c.youTubeChannelId || '';
  }

  levelIcon(level: HealthLevel): string {
    return level === 'ok' ? 'check' : level === 'info' ? 'info' : 'alert';
  }

  /** Takes the user to a field, whichever card it is in. */
  goTo(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'pb-b-channelName' || id.startsWith('pb-b-')) this.brandingOpen.set(true);
    afterNextRender(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      (target?.matches('input,select,textarea,button') ? target : target?.querySelector<HTMLElement>('input,select,textarea,button'))?.focus({ preventScroll: true });
    }, { injector: this.injector });
  }

  runAction(action: HealthAction): void {
    switch (action) {
      case 'reconnect': this.connect(); break;
      case 'link': this.goTo('pb-link'); break;
      case 'visibility': this.goTo('pb-privacy'); break;
      case 'tags': this.goTo('pb-tags'); break;
      case 'footer': this.goTo('pb-footer'); break;
      case 'comment': this.goTo('pb-comment'); break;
      default: break;
    }
  }

  actionLabel(action: HealthAction): string {
    switch (action) {
      case 'reconnect': return 'Reconnect';
      case 'link': return 'Link a channel';
      case 'visibility': return 'Choose';
      case 'tags': case 'footer': case 'comment': return 'Show';
      default: return '';
    }
  }

  // ---------------------------------------------------------------------------- keyboard shortcuts

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (this.canSave()) this.save();
      return;
    }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
      // The settings sidebar also answers "/"; on this page the channel list's own search wins.
      e.preventDefault();
      this.focusSearch();
      return;
    }
    if (e.key === 'Escape') {
      if (this.pendingSwitch()) this.pendingSwitch.set(null);
      else if (this.pickerOpen()) this.pickerOpen.set(false);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.dirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  onListKey(e: KeyboardEvent): void {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.pb-item'));
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    items[Math.max(0, Math.min(items.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  }

  // ------------------------------------------------------------------------------------- YouTube

  connect(): void {
    if (this.connecting()) return;
    const channel = this.channelId();
    const returnPath = `/admin/branding/publishing${channel ? `?channel=${encodeURIComponent(channel)}` : ''}`;
    this.connecting.set(true);
    this.actionError.set(null);
    this.youtube.startConnect(returnPath).subscribe({
      next: (url) => {
        if (url.startsWith('https://accounts.google.com/')) window.location.assign(url);
        else { this.actionError.set('The server returned an unexpected sign-in address.'); this.connecting.set(false); }
      },
      error: (e: unknown) => { this.actionError.set(messageOf(e)); this.connecting.set(false); },
    });
  }

  async copyYouTubeId(): Promise<void> {
    const id = this.form()?.youTubeChannelId;
    if (!id || !(await copyText(id))) return;
    this.copied.set(true);
    this.liveMessage.set('YouTube channel ID copied.');
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  /** Asks YouTube about every connection of this account, which is what turns up an expired one. */
  checkConnections(): void {
    if (this.checking()) return;
    this.checking.set(true);
    this.actionError.set(null);
    this.youtube.refreshChannels().subscribe({
      next: (r) => {
        this.checking.set(false);
        this.checkReport.set({ count: r.channels.length, failed: r.failed });
        this.liveMessage.set(r.failed.length ? `${r.failed.length} connection(s) need attention.` : 'All connections work.');
        this.loadYouTube();
        this.refreshBrandChannels();
      },
      error: (e: unknown) => { this.checking.set(false); this.actionError.set(messageOf(e)); },
    });
  }

  // ---------------------------------------------------------------------------------------- save

  save(then?: () => void): void {
    const f = this.form();
    if (!f || this.saving() || (!then && !this.canSave())) return;
    const key = this.currentKey();
    this.saving.set(true);
    this.saveError.set(null);
    this.admin.savePublishing(this.channelId(), { ...f }).subscribe({
      next: (s) => {
        this.saving.set(false);
        this.cache(key, s);
        if (this.currentKey() === key) {
          this.apply(s);
          this.savedAt.set(new Date());
          this.liveMessage.set('Saved. New publishes for this channel start with these details.');
        }
        this.refreshBrandChannels();
        then?.();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.saveError.set({ message: messageOf(e), code: e instanceof ApiFailure ? e.code : '' });
      },
    });
  }

  /** Where a refusal belongs on the page, from the server's error code. */
  fieldForError(code: string): string | null {
    if (code.startsWith('tag')) return 'pb-tags';
    if (code.startsWith('footer') || code === 'description-invalid-character') return 'pb-footer';
    if (code.startsWith('comment')) return 'pb-comment';
    if (code === 'privacy-invalid') return 'pb-privacy';
    if (code === 'category-invalid') return 'pb-category';
    if (code === 'channel-invalid' || code === 'youtube-channel-in-use') return 'pb-link';
    if (code.startsWith('branding')) return 'pb-b-channelName';
    return null;
  }

  // ---------------------------------------------------------------------------------- bulk apply

  toggleBulk(): void {
    if (this.bulkPhase() === 'reading' || this.bulkPhase() === 'applying') return;
    if (this.bulkOpen()) this.resetBulk(); else this.bulkOpen.set(true);
  }

  resetBulk(): void {
    this.bulkSub?.unsubscribe();
    this.bulkOpen.set(false);
    this.bulkPhase.set('pick');
    this.bulkRows.set([]);
    this.bulkResults.set({});
    this.bulkUndo.set([]);
    this.bulkUndone.set(false);
    this.bulkTargets.set(new Set());
    this.bulkQuery.set('');
    this.bulkChoice.set(NO_BULK);
  }

  setBulk(field: Exclude<keyof BulkChoice, 'tags'>, on: boolean): void {
    this.bulkChoice.update((c) => ({ ...c, [field]: on }));
  }

  setBulkTags(mode: BulkTagMode): void {
    this.bulkChoice.update((c) => ({ ...c, tags: mode }));
  }

  toggleTarget(key: string, on: boolean): void {
    this.bulkTargets.update((s) => { const n = new Set(s); if (on) n.add(key); else n.delete(key); return n; });
  }

  selectShown(): void {
    this.bulkTargets.update((s) => { const n = new Set(s); this.bulkCandidates().forEach((e) => n.add(e.key)); return n; });
  }

  clearTargets(): void {
    this.bulkTargets.set(new Set());
  }

  backToPick(): void {
    this.bulkPhase.set('pick');
    this.bulkRows.set([]);
  }

  previewBulk(): void {
    const source = this.form();
    if (!source || !this.canPreview()) return;
    const keys = [...this.bulkTargets()].filter((k) => k !== this.currentKey() && this.brandChannels().some((c) => brandKey(c) === k));
    const choice = this.bulkChoice();
    this.bulkPhase.set('reading');
    this.bulkProgress.set({ done: 0, total: keys.length, name: '' });
    this.bulkSub?.unsubscribe();
    // Always read fresh: the preview must be about what is stored now, not what was cached earlier.
    this.bulkSub = from(keys).pipe(
      mergeMap((key) => this.admin.publishing(key === 'default' ? null : key).pipe(
        map((s) => ({ key, s, error: null as string | null })),
        catchError((e: unknown) => of({ key, s: null as ChannelPublishSettings | null, error: messageOf(e) }))), 3),
      tap(() => this.bulkProgress.update((p) => ({ ...p, done: p.done + 1 }))),
      toArray(),
    ).subscribe((results) => {
      const byKey = new Map(results.map((r) => [r.key, r]));
      const rows: BulkRow[] = keys.map((key) => {
        const r = byKey.get(key);
        const name = this.nameOf(key);
        if (!r?.s) return { key, name, before: null, plan: null, error: r?.error ?? 'Couldn’t read its settings.' };
        this.cache(key, r.s);
        return { key, name, before: r.s, plan: planBulk(source, { ...r.s, tags: r.s.tags ?? [] }, choice, this.categories()), error: null };
      });
      this.bulkRows.set(rows);
      this.bulkStampAtPreview.set(bulkStamp(source, choice));
      this.bulkPhase.set('preview');
    });
  }

  applyBulk(): void {
    const todo = this.bulkRows().filter((r) => r.plan && !r.plan.blocked && r.plan.changes.length > 0);
    if (todo.length === 0 || this.bulkStale()) return;
    this.runBulk(todo.map((r) => ({ key: r.key, name: r.name, body: r.plan!.after, before: r.before })), false);
  }

  retryFailed(): void {
    const failed = this.bulkRows().filter((r) => r.plan && this.bulkResults()[r.key]?.ok === false);
    if (failed.length === 0) return;
    this.runBulk(failed.map((r) => ({ key: r.key, name: r.name, body: r.plan!.after, before: r.before })), true);
  }

  undoBulk(): void {
    const undo = this.bulkUndo();
    if (undo.length === 0) return;
    this.runBulk(undo.map((u) => ({ key: u.key, name: u.name, body: u.before, before: null })), false, true);
  }

  /**
   * One channel at a time, never in parallel: every channel lives in one settings document on the
   * server, so two saves at once could overwrite each other.
   */
  private runBulk(
    items: { key: string; name: string; body: ChannelPublishSettings; before: ChannelPublishSettings | null }[],
    keepResults: boolean, undoing = false,
  ): void {
    this.bulkPhase.set('applying');
    this.bulkUndone.set(undoing);
    this.bulkProgress.set({ done: 0, total: items.length, name: '' });
    if (!keepResults) this.bulkResults.set({});
    const undone: { key: string; name: string; before: ChannelPublishSettings }[] = keepResults ? [...this.bulkUndo()] : [];
    this.bulkSub?.unsubscribe();
    this.bulkSub = from(items).pipe(
      concatMap((item) => {
        this.bulkProgress.update((p) => ({ ...p, name: item.name }));
        return this.admin.savePublishing(item.key === 'default' ? null : item.key, item.body).pipe(
          map((saved) => ({ item, saved, error: null as string | null })),
          catchError((e: unknown) => of({ item, saved: null as ChannelPublishSettings | null, error: messageOf(e) })));
      }),
      tap(({ item, saved, error }) => {
        this.bulkProgress.update((p) => ({ ...p, done: p.done + 1 }));
        if (saved) {
          this.cache(item.key, saved);
          this.bulkResults.update((r) => ({ ...r, [item.key]: { ok: true, message: undoing ? 'Restored' : 'Saved' } }));
          if (!undoing && item.before && !undone.some((u) => u.key === item.key)) undone.push({ key: item.key, name: item.name, before: item.before });
        } else {
          this.bulkResults.update((r) => ({ ...r, [item.key]: { ok: false, message: error ?? 'Failed' } }));
        }
      }),
    ).subscribe({
      complete: () => {
        this.bulkUndo.set(undoing ? [] : undone);
        this.bulkUndone.set(undoing);
        this.bulkPhase.set('done');
        this.refreshBrandChannels();
        const out = this.bulkOutcome();
        this.liveMessage.set(undoing
          ? `Restored ${plural(out.ok, 'channel')}.`
          : `Applied to ${plural(out.ok, 'channel')}${out.failed ? `, ${out.failed} failed` : ''}.`);
      },
    });
  }

  choiceSummary(): string {
    return describeChoice(this.bulkChoice());
  }

  resultOf(key: string): BulkResult | undefined {
    return this.bulkResults()[key];
  }

  bulkLabel(): string {
    const n = this.bulkSummary().changing;
    return `Apply to ${plural(n, 'channel')}`;
  }
}
