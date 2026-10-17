import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  YouTubeCategory, YouTubeChannel, YouTubeCheckup, YouTubeCheckupVideo, YouTubePrivacy, YouTubeSuggestEngine,
  YouTubeSuggestion,
} from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';

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

/** Tags are sent comma-joined; YouTube's limit is 500 characters, so drafts stop a little short. */
const TAGS_BUDGET = 450;

/** Two drafts at a time: the server only writes two suggestions at once anyway. */
const PARALLEL = 2;

type Filter = 'needs' | 'all' | string;

interface Draft {
  title: string;
  description: string;
  tagsText: string;
  categoryId: string;
  privacy: YouTubePrivacy;
  madeForKids: boolean | null;
  addPlaylistIds: string[];
  titleOptions: string[];
  descriptionOptions: string[];
  tagIdeas: string[];
}

interface RowState {
  draft: Draft | null;
  busy: 'suggest' | 'save' | null;
  error: string | null;
  saved: boolean;
  warnings: string[];
}

const EMPTY_STATE: RowState = { draft: null, busy: null, error: null, saved: false, warnings: [] };

/**
 * Details checkup: every video on a connected channel - however it was uploaded - with what
 * its details are missing (description, tags, hashtags, playlist, audience). Drafts are
 * written by AI one by one or for a whole selection, reviewed here, and saved to YouTube.
 * Nothing is changed on YouTube until Save.
 */
@Component({
  selector: 'app-youtube-checkup',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './youtube-checkup.component.html',
  styleUrl: './youtube-checkup.component.css',
})
export class YouTubeCheckupComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);

  readonly issueLabels = ISSUE_LABELS;

  readonly channels = signal<YouTubeChannel[]>([]);
  readonly categories = signal<YouTubeCategory[]>([]);
  readonly engines = signal<YouTubeSuggestEngine[]>([]);
  readonly tones = signal<string[]>([]);
  readonly configured = signal(true);

  readonly channelId = signal('');
  readonly max = signal(100);
  readonly checkup = signal<YouTubeCheckup | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filter = signal<Filter>('needs');
  readonly query = signal('');

  // AI settings shared by every draft.
  readonly tone = signal('auto');
  readonly language = signal('en');
  readonly engine = signal('');
  readonly brief = signal('');

  readonly states = signal<Record<string, RowState>>({});
  readonly open = signal<string | null>(null);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly bulkRunning = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

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

  readonly rows = computed(() => {
    const f = this.filter();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.videos().filter((v) => {
      if (f === 'needs' && v.issues.length === 0) return false;
      if (f !== 'needs' && f !== 'all' && !v.issues.some((i) => i.code === f)) return false;
      const text = `${v.title} ${v.description} ${v.tags.join(' ')}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  });

  readonly selectedVideos = computed(() => this.videos().filter((v) => this.selected().has(v.videoId)));
  readonly draftsToSave = computed(() => this.selectedVideos().filter((v) => this.states()[v.videoId]?.draft && !this.states()[v.videoId]?.saved));

  ngOnInit(): void {
    this.api.status().pipe(catchError((e: unknown) => { this.error.set(message(e)); return of(null); })).subscribe((s) => {
      if (!s) return;
      this.configured.set(s.configured);
      this.channels.set(s.channels);
      this.categories.set(s.categories);
      const first = s.channels.find((c) => !c.needsReconnect && c.canComment) ?? s.channels[0];
      if (first) this.pickChannel(first.channelId);
    });
    this.api.suggestOptions().pipe(catchError(() => of(null))).subscribe((o) => {
      if (!o) return;
      this.engines.set(o.engines);
      this.tones.set(o.tones);
    });
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
    this.api.checkup(channel.channelId, this.max()).subscribe({
      next: (c) => { this.checkup.set(c); this.loading.set(false); },
      error: (e: unknown) => { this.error.set(message(e)); this.loading.set(false); },
    });
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

  toggleOpen(v: YouTubeCheckupVideo): void {
    if (this.open() === v.videoId) { this.open.set(null); return; }
    if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
    this.open.set(v.videoId);
  }

  setDraft(videoId: string, change: Partial<Draft>): void {
    const st = this.state(videoId);
    if (!st.draft) return;
    this.patch(videoId, { draft: { ...st.draft, ...change }, saved: false });
  }

  togglePlaylist(videoId: string, playlistId: string): void {
    const d = this.state(videoId).draft;
    if (!d) return;
    const has = d.addPlaylistIds.includes(playlistId);
    this.setDraft(videoId, { addPlaylistIds: has ? d.addPlaylistIds.filter((p) => p !== playlistId) : [...d.addPlaylistIds, playlistId] });
  }

  addTag(videoId: string, tag: string): void {
    const d = this.state(videoId).draft;
    if (!d) return;
    this.setDraft(videoId, { tagsText: fitTags([...splitTags(d.tagsText), tag]).join(', '), tagIdeas: d.tagIdeas.filter((t) => t !== tag) });
  }

  reset(v: YouTubeCheckupVideo): void {
    this.patch(v.videoId, { draft: this.draftFrom(v), error: null, warnings: [], saved: false });
  }

  suggest(v: YouTubeCheckupVideo): void {
    this.runSuggest(v).subscribe();
  }

  save(v: YouTubeCheckupVideo): void {
    this.runSave(v).subscribe();
  }

  descriptionBytes(text: string): number {
    return new TextEncoder().encode(text).length;
  }

  tagsLength(text: string): number {
    return splitTags(text).join(',').length;
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

  // --- internals

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
  private runSuggest(v: YouTubeCheckupVideo): Observable<boolean> {
    return new Observable<boolean>((sub) => {
      if (!this.state(v.videoId).draft) this.patch(v.videoId, { draft: this.draftFrom(v) });
      this.patch(v.videoId, { busy: 'suggest', error: null });
      return this.api.suggestForVideo(this.channelId(), v.videoId, {
        language: this.language(),
        fresh: false,
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
      return this.api.saveVideoDetails(this.channelId(), v.videoId, {
        metadata: {
          title: d.title.trim(),
          description: d.description.trim(),
          tags: splitTags(d.tagsText),
          categoryId: d.categoryId,
          privacy: d.privacy,
          madeForKids: d.madeForKids,
          notifySubscribers: false,
        },
        addToPlaylistIds: d.addPlaylistIds,
        currentPlaylistIds: v.playlistIds,
        playlistsKnown: !this.checkup()?.playlistError,
      }).subscribe({
        next: (res) => {
          this.checkup.update((c) => c ? { ...c, videos: c.videos.map((x) => x.videoId === v.videoId ? res.video : x) } : c);
          this.patch(v.videoId, { busy: null, saved: true, warnings: res.warnings, draft: this.draftFrom(res.video) });
          if (this.open() === v.videoId) this.open.set(null);
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
    return {
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
    };
  }
}

const HASHTAG = /(^|\s)#[\p{L}\p{M}\p{N}_]+/u;
const HASHTAGS = /#[\p{L}\p{M}\p{N}_]+/gu;

function splitTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(',')) {
    const tag = raw.trim().replace(/^#/, '');
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out;
}

/** Keeps tags in order until the comma-joined list would pass the budget. */
function fitTags(tags: string[]): string[] {
  const out: string[] = [];
  let length = 0;
  for (const tag of splitTags(tags.join(','))) {
    const add = (out.length ? 1 : 0) + tag.length;
    if (length + add > TAGS_BUDGET) break;
    out.push(tag);
    length += add;
  }
  return out;
}

function message(e: unknown): string {
  return e instanceof ApiFailure || e instanceof Error ? e.message : 'Something went wrong.';
}
