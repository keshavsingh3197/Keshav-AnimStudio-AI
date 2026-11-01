import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ContentTopic } from '../../core/models/calendar.models';
import {
  MAX_THUMBNAIL_UPLOAD_BYTES, YouTubeCategory, YouTubeCheckupPlaylist, YouTubeCheckupVideo, YouTubePrivacy, YouTubeSuggestEngine, YouTubeThumbnailChoice,
  YouTubeVideoEditContext,
} from '../../core/models/youtube.models';
import { ApiService } from '../../core/services/api.service';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { AssetThumbnailPickerComponent } from '../../shared/asset-thumbnail-picker.component';
import { fold, rank, search } from './checkup-match';
import { seoChecks, seoScore } from './checkup-seo';
import {
  Draft, HASHTAGS, RowState, YOUTUBE_LANGUAGES, draftChecklist, draftDiffers, earliestScheduleLocal, fitTags, hasFooter, insertAboveFooter, scheduleDiffers, scheduleProblem,
  splitTags, toneLabel, trimUtf8Bytes, viewerZone, withFooter,
} from './checkup-draft';

/** Where the frame picker samples the render, as fractions of its length; "Other moments" shifts them. */
const FRAME_SPOTS = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9];

/** YouTube video ids are 11 URL-safe characters; nothing else is ever put in the player's URL. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** The most search results drawn at once; a channel can have thousands of playlists. */
const PICKER_LIMIT = 50;

/** Colours a topic made from the dialog can get, so new ones don't all look alike in the calendar. */
const TOPIC_COLORS = ['#6c8cff', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#06b6d4', '#ec4899'];

type ThumbMode = 'current' | 'youtube' | 'frame' | 'library' | 'upload';

interface FrameOption { at: number; url: string | null; failed: boolean }

/** The pictures YouTube itself makes for every video; each is a JPG on its public image host. */
const YOUTUBE_STILLS: readonly { key: string; label: string; file: string }[] = [
  { key: 'max', label: 'HD', file: 'maxresdefault.jpg' },
  { key: '1', label: 'Start', file: 'hq1.jpg' },
  { key: '2', label: 'Middle', file: 'hq2.jpg' },
  { key: '3', label: 'End', file: 'hq3.jpg' },
];

/**
 * The checkup's edit dialog for one video: the video and its thumbnail on one side, its
 * details on the other, with what the channel's setup and the AnimStudio project add, and a
 * live list of what is still missing. The draft lives in the checkup page (so bulk save sees
 * it); this dialog only edits it. The thumbnail is the exception - it is set on YouTube
 * straight away, on its own button, because YouTube stores it apart from the details.
 */
@Component({
  selector: 'app-checkup-video-editor',
  imports: [DatePipe, FormsModule, RouterLink, AssetThumbnailPickerComponent],
  templateUrl: './checkup-video-editor.component.html',
  styleUrl: './checkup-video-editor.component.css',
  host: { '(document:keydown)': 'onKey($event)', '(document:paste)': 'onPaste($event)' },
})
export class CheckupVideoEditorComponent {
  private readonly api = inject(YouTubePublishService);
  private readonly assets = inject(ApiService);
  private readonly calendar = inject(ContentCalendarService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly Math = Math;
  readonly languages = YOUTUBE_LANGUAGES;
  readonly stills = YOUTUBE_STILLS;
  readonly channelId = input.required<string>();
  readonly video = input.required<YouTubeCheckupVideo>();
  readonly state = input.required<RowState>();
  readonly playlists = input<YouTubeCheckupPlaylist[]>([]);
  readonly playlistsKnown = input(true);
  readonly topics = input<ContentTopic[]>([]);
  /** A topic was created from the dialog; the page adds it to its list. */
  readonly topicCreated = output<ContentTopic>();
  readonly categories = input<YouTubeCategory[]>([]);
  /** "3 of 25" in the current list, for the header. */
  readonly position = input('');
  readonly hasPrev = input(false);
  readonly hasNext = input(false);
  readonly promptCopied = input(false);
  /** Short line describing the page's AI settings, e.g. "tone auto, English". */
  readonly aiSummary = input('');

  // The AI settings belong to the page (every draft uses them); the dialog edits them in place.
  readonly tones = input<string[]>([]);
  readonly engines = input<YouTubeSuggestEngine[]>([]);
  readonly tone = model('auto');
  readonly language = model('hi');
  readonly engine = model('');
  readonly brief = model('');
  readonly aiOpen = signal(false);

  readonly draftChange = output<Partial<Draft>>();
  readonly suggest = output<void>();
  /** A new take instead of the cached answer. */
  readonly suggestFresh = output<void>();
  readonly save = output<{ next: boolean }>();
  readonly reset = output<void>();
  readonly copyPrompt = output<void>();
  readonly move = output<-1 | 1>();
  readonly closed = output<void>();
  /** The thumbnail on YouTube changed (the video's id); the page refreshes its row's picture. */
  readonly thumbnailChanged = output<string>();

  // Scheduling: private now, public by itself at a time picked in the viewer's own zone.
  readonly zone = viewerZone();
  readonly minSchedule = signal(earliestScheduleLocal());
  /** YouTube refuses to schedule a video that is already public. */
  readonly canSchedule = computed(() => this.video().privacy !== 'public');
  readonly scheduleError = computed(() => {
    const d = this.draft();
    // An unchanged schedule is YouTube's already; only a new time has to be ten minutes ahead.
    return d?.scheduled && scheduleDiffers(this.video(), d) ? scheduleProblem(d.publishAtLocal) : null;
  });

  // Posting the suggested pinned comment as the channel.
  readonly commentBusy = signal(false);
  readonly commentPostedUrl = signal<string | null>(null);
  readonly commentError = signal<string | null>(null);
  readonly canPostComment = computed(() => this.video().privacy !== 'private' && this.video().madeForKids !== true);

  readonly context = signal<YouTubeVideoEditContext | null>(null);
  readonly contextError = signal<string | null>(null);

  readonly playing = signal(false);
  readonly copiedKey = signal<string | null>(null);

  async copyField(key: string, text: string | undefined | null): Promise<void> {
    if (!text?.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copiedKey.set(key);
      setTimeout(() => {
        if (this.copiedKey() === key) this.copiedKey.set(null);
      }, 2000);
    } catch {}
  }

  // Thumbnail
  readonly thumbMode = signal<ThumbMode>('current');
  readonly frames = signal<FrameOption[]>([]);
  readonly frameAt = signal<number | null>(null);
  readonly thumbImage = signal<string | null>(null);
  readonly thumbBusy = signal(false);
  readonly thumbError = signal<string | null>(null);
  readonly thumbDone = signal(false);
  readonly thumbDragOver = signal(false);
  /** Bumped after a new thumbnail is set, so the picture reloads past the browser cache. */
  readonly thumbVersion = signal(0);
  private readonly frameUrls = new Map<number, string>();
  private frameRound = 0;
  /** Bumped per video, so an answer that arrives after Previous/Next is dropped. */
  private generation = 0;

  readonly draft = computed(() => this.state().draft);
  readonly footer = computed(() => this.context()?.descriptionFooter ?? null);
  readonly project = computed(() => this.context()?.project ?? null);
  readonly canUseFrames = computed(() => !!this.project()?.renderJobId && (this.project()?.durationSeconds ?? 0) > 0);

  readonly isShort = computed(() => this.video().isShort || !!this.project()?.isVertical);
  readonly checklist = computed(() => {
    const d = this.draft();
    return d ? draftChecklist(this.video(), d, this.footer(), this.playlistsKnown()) : [];
  });
  readonly missing = computed(() => this.checklist().filter((i) => !i.ok && !i.optional).length);
  readonly completedCount = computed(() => this.checklist().filter((i) => i.ok).length);
  readonly totalChecklistCount = computed(() => this.checklist().length);

  readonly footerIncluded = computed(() => hasFooter(this.draft()?.description ?? '', this.footer()));
  readonly channelTagsToAdd = computed(() => {
    const have = new Set(splitTags(this.draft()?.tagsText ?? '').map((t) => t.toLowerCase()));
    return (this.context()?.defaultTags ?? []).filter((t) => !have.has(t.replace(/^#/, '').toLowerCase()));
  });
  readonly projectDescriptionUsable = computed(() => {
    const text = this.project()?.description.trim() ?? '';
    return text.length > 0 && !(this.draft()?.description ?? '').includes(text);
  });

  /** Whether the draft differs from what YouTube has now. */
  readonly dirty = computed(() => {
    const d = this.draft();
    return !!d && draftDiffers(this.video(), d);
  });

  // Per-field "back to what YouTube has".
  readonly titleChanged = computed(() => !!this.draft() && this.draft()!.title !== this.video().title);
  readonly descriptionChanged = computed(() => !!this.draft() && this.draft()!.description.trim() !== this.video().description.trim());
  readonly tagsChanged = computed(() => {
    const d = this.draft();
    return !!d && splitTags(d.tagsText).join('\n') !== this.video().tags.join('\n');
  });

  /** YouTube ignores every hashtag in a video when it has more than 15. */
  readonly hashtagCount = computed(() => new Set((this.draft()?.description ?? '').match(HASHTAGS)?.map((h) => h.toLowerCase()) ?? []).size);
  /** What shows before "...more": roughly the first three lines, cut at about 140 characters. */
  readonly aboveFold = computed(() => {
    const text = (this.draft()?.description ?? '').trim().split('\n').slice(0, 3).join('\n');
    return text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text;
  });
  readonly tagsToHashtag = computed(() => {
    const d = this.draft();
    if (!d) return [] as string[];
    const have = new Set((d.description.match(HASHTAGS) ?? []).map((h) => h.toLowerCase()));
    return splitTags(d.tagsText)
      .filter((t) => /^[\p{L}\p{M}\p{N}_]+$/u.test(t))
      .map((t) => `#${t}`)
      .filter((h) => !have.has(h.toLowerCase()))
      .slice(0, 3);
  });

  revertTitle(): void {
    this.set({ title: this.video().title });
  }

  revertDescription(): void {
    this.set({ description: this.video().description });
  }

  revertTags(): void {
    this.set({ tagsText: this.video().tags.join(', ') });
  }

  clearTags(): void {
    this.set({ tagsText: '' });
  }

  /** Puts up to three of the video's tags at the end of the description as hashtags - the ones YouTube shows above the title. */
  addHashtagsFromTags(): void {
    const d = this.draft();
    const add = this.tagsToHashtag();
    if (d && add.length > 0) this.set({ description: `${d.description.trimEnd()}\n\n${add.join(' ')}`.trim() });
  }

  readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const id = this.video().videoId;
    // Only a validated id goes into a fixed youtube-nocookie URL, so the trusted URL can't point anywhere else.
    return VIDEO_ID.test(id)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`)
      : null;
  });

  readonly currentThumb = computed(() => {
    const url = this.video().thumbnailUrl ?? `https://i.ytimg.com/vi/${this.video().videoId}/hqdefault.jpg`;
    const v = this.thumbVersion();
    return v === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}v=${v}`;
  });

  readonly thumbPreview = computed(() => {
    const mode = this.thumbMode();
    switch (mode) {
      case 'upload':
      case 'youtube':
      case 'library': return this.thumbSource() === mode ? this.thumbImage() : null;
      case 'frame': {
        const at = this.frameAt();
        return at === null ? null : this.frames().find((f) => f.at === at)?.url ?? this.frameUrls.get(at) ?? null;
      }
      default: return this.currentThumb();
    }
  });

  readonly thumbChoice = computed<YouTubeThumbnailChoice | null>(() => {
    const mode = this.thumbMode();
    if ((mode === 'upload' || mode === 'youtube' || mode === 'library') && this.thumbSource() === mode && this.thumbImage()) return { imageBase64: this.thumbImage() };
    if (mode === 'frame' && this.frameAt() !== null) return { frameAtSeconds: this.frameAt() };
    return null;
  });

  /** Which tab the held picture came from, so switching tabs never shows one tab's picture under another. */
  readonly thumbSource = signal<ThumbMode | null>(null);

  // More ways to pick a thumbnail: YouTube's own stills, the project's assets, a pasted picture.
  readonly ytStillPick = signal<string | null>(null);
  readonly libraryOpen = signal(false);
  readonly thumbSize = signal<{ w: number; h: number } | null>(null);
  readonly thumbSizeNote = computed(() => {
    const s = this.thumbSize();
    if (!s) return null;
    const vertical = s.h > s.w;
    const ratio = vertical ? '9:16' : Math.abs(s.w / s.h - 16 / 9) < 0.05 ? '16:9' : `${(s.w / s.h).toFixed(2)}:1`;
    const small = vertical ? s.h < 1280 : s.w < 1280;
    return { text: `${s.w}×${s.h} · ${ratio}`, warn: small ? 'Smaller than the 1280×720 YouTube recommends - it may look soft.' : null };
  });

  // How well the draft follows common YouTube search practice (guidance only).
  readonly seo = computed(() => {
    const d = this.draft();
    if (!d) return { score: 0, checks: [] as ReturnType<typeof seoChecks> };
    const checks = seoChecks({
      title: d.title, description: d.description, tagsText: d.tagsText, pinnedComment: d.pinnedComment,
      isShort: this.isShort(), durationSeconds: this.video().durationSeconds,
    });
    return { score: seoScore(checks), checks };
  });
  readonly seoOpen = signal(false);
  readonly seoTips = computed(() => this.seo().checks.filter((c) => c.status !== 'ok'));

  private contextLoad: Subscription | null = null;

  /** The id alone, so a save (which hands in a fresh copy of the same video) doesn't restart the dialog. */
  private readonly videoId = computed(() => this.video().videoId);

  constructor() {
    // Previous/Next swap the video under the same dialog: start its side panel afresh.
    effect(() => {
      const videoId = this.videoId();
      const channelId = this.channelId();
      untracked(() => this.startVideo(channelId, videoId));
    });
    inject(DestroyRef).onDestroy(() => {
      this.contextLoad?.unsubscribe();
      this.clearFrames();
    });
  }

  private startVideo(channelId: string, videoId: string): void {
    this.generation++;
    this.commentBusy.set(false);
    this.commentPostedUrl.set(null);
    this.commentError.set(null);
    this.minSchedule.set(earliestScheduleLocal());
    this.playing.set(false);
    this.thumbMode.set('current');
    this.frameAt.set(null);
    this.thumbImage.set(null);
    this.thumbSource.set(null);
    this.thumbBusy.set(false);
    this.thumbError.set(null);
    this.thumbDone.set(false);
    this.thumbVersion.set(0);
    this.ytStillPick.set(null);
    this.libraryOpen.set(false);
    this.thumbSize.set(null);
    this.playlistQuery.set('');
    this.topicQuery.set('');
    this.topicOpen.set(false);
    this.topicError.set(null);
    this.topicBusy.set(false);
    this.clearFrames();
    // The side panel and the form keep their scroll position across Previous/Next; start both at the top.
    setTimeout(() => {
      for (const el of this.host.nativeElement.querySelectorAll<HTMLElement>('.ve-side, .ve-main, .ve-body')) el.scrollTop = 0;
    });

    this.context.set(null);
    this.contextError.set(null);
    this.contextLoad?.unsubscribe();
    this.contextLoad = this.api.videoContext(channelId, videoId).subscribe({
      next: (c) => this.context.set(c),
      error: (e: unknown) => this.contextError.set(`The channel setup couldn't be loaded: ${message(e)}`),
    });
  }

  private clearFrames(): void {
    for (const url of this.frameUrls.values()) URL.revokeObjectURL(url);
    this.frameUrls.clear();
    this.frames.set([]);
    this.frameRound = 0;
  }

  onKey(event: KeyboardEvent): void {
    if (this.libraryOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
    } else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      if (this.state().busy || (step < 0 ? !this.hasPrev() : !this.hasNext())) return;
      event.preventDefault();
      this.move.emit(step);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (this.canSave()) this.save.emit({ next: event.shiftKey && this.hasNext() });
    }
  }

  canSave(): boolean {
    const d = this.draft();
    return !!d && !this.state().busy && d.madeForKids !== null
      && !this.scheduleError()
      && this.descriptionBytes(d.description) <= 5000
      && this.tagsLength(d.tagsText) <= 500
      && d.title.trim().length > 0 && d.title.length <= 100;
  }

  set(change: Partial<Draft>): void {
    this.draftChange.emit(change);
  }

  /** The visibility select's value: a scheduled draft is private with a time. */
  visibility(d: Draft): string {
    return d.scheduled ? 'scheduled' : d.privacy;
  }

  setVisibility(value: string): void {
    if (value === 'scheduled') {
      this.minSchedule.set(earliestScheduleLocal());
      // About an hour ahead to start with; the creator picks the real time.
      const start = this.draft()?.publishAtLocal || earliestScheduleLocal(Date.now() + 50 * 60 * 1000);
      this.set({ scheduled: true, privacy: 'private', publishAtLocal: start });
    } else if (value === 'public' || value === 'unlisted' || value === 'private') {
      this.set({ scheduled: false, privacy: value as YouTubePrivacy });
    }
  }

  /** Posts the pinned-comment draft as the channel; pinning itself is one click in Studio. */
  postPinnedComment(): void {
    const text = this.draft()?.pinnedComment?.trim();
    if (!text || this.commentBusy() || !this.canPostComment()) return;
    const generation = this.generation;
    this.commentBusy.set(true);
    this.commentError.set(null);
    this.api.postVideoComment(this.channelId(), this.video().videoId, text).subscribe({
      next: (res) => {
        if (generation !== this.generation) return;
        this.commentBusy.set(false);
        this.commentPostedUrl.set(res.studioCommentsUrl);
      },
      error: (e: unknown) => {
        if (generation !== this.generation) return;
        this.commentBusy.set(false);
        this.commentError.set(message(e));
      },
    });
  }

  // --- details helpers

  trimDescription(): void {
    const d = this.draft();
    if (!d) return;
    this.set({ description: trimUtf8Bytes(d.description, 5000) });
  }

  descCounterTooltip(text: string): string {
    const chars = text.length;
    const bytes = this.descriptionBytes(text);
    return `${chars.toLocaleString()} characters (${bytes.toLocaleString()} UTF-8 bytes). YouTube Data API limits descriptions to 5,000 UTF-8 bytes. Non-Latin scripts like Devanagari/Hindi use 3 bytes per letter; emojis use 3–4 bytes.`;
  }

  studioPlaylistsUrl(): string {
    return `https://studio.youtube.com/channel/${encodeURIComponent(this.channelId())}/playlists`;
  }

  addFooter(): void {
    const d = this.draft();
    if (d) this.set({ description: withFooter(d.description, this.footer()) });
  }

  /** An AI description option, ending with the channel footer like the rest. */
  withFooterText(text: string): string {
    return withFooter(text, this.footer());
  }

  addProjectDescription(): void {
    const d = this.draft();
    const text = this.project()?.description ?? '';
    if (d) this.set({ description: insertAboveFooter(d.description, text, this.footer()) });
  }

  addChannelTags(): void {
    const d = this.draft();
    if (d) this.set({ tagsText: fitTags([...splitTags(d.tagsText), ...this.channelTagsToAdd()]).join(', ') });
  }

  addTag(tag: string): void {
    const d = this.draft();
    if (!d) return;
    this.set({ tagsText: fitTags([...splitTags(d.tagsText), tag]).join(', '), tagIdeas: d.tagIdeas.filter((t) => t !== tag) });
  }

  removeTag(tag: string): void {
    const d = this.draft();
    if (d) this.set({ tagsText: splitTags(d.tagsText).filter((t) => t !== tag).join(', ') });
  }

  togglePlaylist(playlistId: string): void {
    const d = this.draft();
    if (!d) return;
    const has = d.addPlaylistIds.includes(playlistId);
    this.set({
      addPlaylistIds: has ? d.addPlaylistIds.filter((p) => p !== playlistId) : [...d.addPlaylistIds, playlistId],
      autoPlaylistIds: (d.autoPlaylistIds ?? []).filter((p) => p !== playlistId),
    });
    this.playlistQuery.set('');
  }

  // --- playlists: searched rather than listed, so a channel with thousands stays usable

  readonly playlistQuery = signal('');
  private readonly playlistById = computed(() => new Map(this.playlists().map((p) => [p.id, p])));
  /** What the video is about, in words, for matching playlists and topics against. */
  private readonly videoText = computed(() => {
    const d = this.draft();
    return d ? `${d.title}\n${d.tagsText}\n${d.description.slice(0, 600)}` : this.video().title;
  });
  readonly inPlaylists = computed(() => this.video().playlistIds.map((id) => this.playlistById().get(id)).filter((p): p is YouTubeCheckupPlaylist => !!p));
  readonly pickedPlaylists = computed(() => (this.draft()?.addPlaylistIds ?? []).map((id) => this.playlistById().get(id)).filter((p): p is YouTubeCheckupPlaylist => !!p));
  private readonly takenPlaylists = computed(() => new Set([...this.video().playlistIds, ...(this.draft()?.addPlaylistIds ?? [])]));
  readonly suggestedPlaylists = computed(() => {
    const free = this.playlists().filter((p) => !this.takenPlaylists().has(p.id));
    return rank(free, (p) => p.title, this.videoText(), this.currentTopic()?.name).slice(0, 4).map((r) => r.item);
  });
  readonly playlistResults = computed(() => {
    if (!this.playlistQuery().trim()) return [];
    return search(this.playlists(), this.playlistQuery(), (p) => p.title).filter((p) => !this.takenPlaylists().has(p.id));
  });
  readonly playlistResultsShown = computed(() => this.playlistResults().slice(0, PICKER_LIMIT));

  /** Enter in the search box adds the first match. */
  addFirstPlaylist(event: Event): void {
    event.preventDefault();
    const first = this.playlistResultsShown()[0];
    if (first) this.togglePlaylist(first.id);
  }

  // --- topic: the content series the video belongs to; it steers the AI and the playlist picks

  readonly topicQuery = signal('');
  readonly topicOpen = signal(false);
  readonly topicBusy = signal(false);
  readonly topicError = signal<string | null>(null);
  readonly currentTopic = computed(() => {
    const id = this.draft()?.topicId;
    return id ? this.topics().find((t) => t.id === id) ?? null : null;
  });
  readonly topicResults = computed(() => search(this.topics(), this.topicQuery(), (t) => t.name).slice(0, PICKER_LIMIT));
  /** "Create topic" is offered only for a name that isn't one already. */
  readonly canCreateTopic = computed(() => {
    const name = this.topicQuery().trim();
    return name.length > 0 && name.length <= 80 && !this.topics().some((t) => fold(t.name) === fold(name));
  });
  /** The topic the video's words point to, offered when none is picked yet. */
  readonly suggestedTopic = computed(() => {
    if (this.currentTopic()) return null;
    const best = rank(this.topics(), (t) => [t.name, ...t.tags].join(' '), this.videoText(), null, 0.6)[0];
    return best?.item ?? null;
  });
  readonly topicTagsToAdd = computed(() => {
    const have = new Set(splitTags(this.draft()?.tagsText ?? '').map((t) => t.toLowerCase()));
    return (this.currentTopic()?.tags ?? []).filter((t) => !have.has(t.toLowerCase()));
  });

  pickTopic(topic: ContentTopic | null): void {
    this.set({ topicId: topic?.id ?? null });
    this.topicQuery.set('');
    this.topicOpen.set(false);
    this.topicError.set(null);
  }

  addTopicTags(): void {
    const d = this.draft();
    if (d) this.set({ tagsText: fitTags([...splitTags(d.tagsText), ...this.topicTagsToAdd()]).join(', ') });
  }

  /** Enter picks the first match, or creates the typed topic when nothing matches. */
  onTopicEnter(event: Event): void {
    event.preventDefault();
    const first = this.topicResults()[0];
    if (first && !this.canCreateTopic()) this.pickTopic(first);
    else if (this.canCreateTopic()) this.createTopic();
  }

  /** A new topic for this channel, with no posting cadence - it can be planned in the calendar later. */
  createTopic(): void {
    const name = this.topicQuery().trim();
    if (!this.canCreateTopic() || this.topicBusy()) return;
    const generation = this.generation;
    this.topicBusy.set(true);
    this.topicError.set(null);
    this.calendar.createTopic({
      name,
      description: null,
      color: TOPIC_COLORS[this.topics().length % TOPIC_COLORS.length],
      channelId: this.channelId(),
      channelTitle: null,
      days: [],
      publishTime: '18:00',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      leadDays: 3,
      planAheadDays: 21,
      autoSchedule: false,
      autoLinkUploads: false,
      tags: [],
      checklist: [],
      archived: false,
    }).subscribe({
      next: (topic) => {
        this.topicBusy.set(false);
        this.topicCreated.emit(topic);
        if (generation === this.generation) this.pickTopic(topic);
      },
      error: (e: unknown) => {
        this.topicBusy.set(false);
        if (generation === this.generation) this.topicError.set(message(e));
      },
    });
  }

  /** Who wrote the last suggestion, in words. */
  engineName(id: string | undefined): string {
    if (!id) return '';
    return this.engines().find((e) => e.id === id)?.name ?? (id === 'free-local-seo' ? 'Free built-in engine' : id);
  }

  tags(text: string): string[] {
    return splitTags(text);
  }

  descriptionBytes(text: string): number {
    return new TextEncoder().encode(text).length;
  }

  tagsLength(text: string): number {
    return splitTags(text).join(',').length;
  }

  clock(seconds: number | null): string {
    if (seconds === null || !Number.isFinite(seconds)) return '';
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  preview(text: string): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat;
  }

  // --- thumbnail

  setThumbMode(mode: ThumbMode): void {
    this.thumbMode.set(mode);
    this.thumbError.set(null);
    this.thumbDone.set(false);
    if (mode === 'frame' && this.frames().length === 0) this.loadFrames(false);
  }

  clearUploadedThumb(): void {
    this.thumbImage.set(null);
    this.thumbSource.set(null);
    this.ytStillPick.set(null);
    this.thumbMode.set('current');
    this.thumbError.set(null);
  }

  /** A row of frames spread over the render; `another` moves them to other moments. */
  loadFrames(another: boolean): void {
    const length = this.project()?.durationSeconds ?? 0;
    if (length <= 0) return;
    if (another) this.frameRound++;
    const shift = (this.frameRound * 0.07) % 0.14;
    const spots = FRAME_SPOTS.map((p) => Math.round(Math.min(length - 0.1, Math.max(0, (p + shift) * length)) * 10) / 10);
    const unique = [...new Set(spots)];
    this.frames.set(unique.map((at) => ({ at, url: this.frameUrls.get(at) ?? null, failed: false })));
    for (const at of unique) if (!this.frameUrls.has(at)) this.fetchFrame(at);
  }

  pickFrame(at: number): void {
    this.frameAt.set(at);
    this.thumbError.set(null);
    this.thumbDone.set(false);
  }

  onThumbFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (file) this.readThumb(file);
  }

  onThumbDragOver(event: DragEvent): void {
    if (this.thumbBusy() || !Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
    event.preventDefault();
    this.thumbDragOver.set(true);
  }

  onThumbDrop(event: DragEvent): void {
    event.preventDefault();
    this.thumbDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.thumbBusy()) this.readThumb(file);
  }

  applyThumbnail(): void {
    const choice = this.thumbChoice();
    if (!choice || this.thumbBusy()) return;
    const videoId = this.video().videoId;
    const generation = this.generation;
    this.thumbBusy.set(true);
    this.thumbError.set(null);
    this.api.setVideoThumbnail(this.channelId(), videoId, choice).subscribe({
      next: () => {
        this.thumbnailChanged.emit(videoId);
        if (generation !== this.generation) return;
        this.thumbBusy.set(false);
        this.thumbDone.set(true);
        this.thumbMode.set('current');
        this.thumbVersion.set(Date.now());
      },
      error: (e: unknown) => {
        if (generation !== this.generation) return;
        this.thumbBusy.set(false);
        this.thumbError.set(message(e));
      },
    });
  }

  private fetchFrame(at: number): void {
    const jobId = this.project()?.renderJobId;
    if (!jobId) return;
    const generation = this.generation;
    this.api.frame(jobId, at, 'render').subscribe({
      next: (blob) => {
        if (generation !== this.generation) return;
        const url = URL.createObjectURL(blob);
        this.frameUrls.set(at, url);
        this.frames.update((list) => list.map((f) => (f.at === at ? { ...f, url } : f)));
      },
      error: () => {
        if (generation === this.generation) this.frames.update((list) => list.map((f) => (f.at === at ? { ...f, failed: true } : f)));
      },
    });
  }

  /** The server checks the bytes and re-encodes anyway; this only catches the obvious early. */
  private readThumb(file: File, mode: ThumbMode = 'upload'): void {
    this.thumbError.set(null);
    this.thumbDone.set(false);
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      this.thumbError.set('A thumbnail must be a JPG or PNG picture.');
      return;
    }
    if (file.size > MAX_THUMBNAIL_UPLOAD_BYTES) {
      this.thumbError.set(`That picture is over ${MAX_THUMBNAIL_UPLOAD_BYTES / 1048576} MB. Use a smaller one.`);
      return;
    }
    const reader = new FileReader();
    const generation = this.generation;
    reader.onload = () => {
      if (generation !== this.generation) return;
      this.thumbSize.set(null);
      this.thumbImage.set(typeof reader.result === 'string' ? reader.result : null);
      this.thumbSource.set(mode);
      this.thumbMode.set(mode);
    };
    reader.onerror = () => this.thumbError.set("That picture couldn't be read. Choose another.");
    reader.readAsDataURL(file);
  }

  /** A picture pasted with Ctrl+V becomes the custom thumbnail, wherever in the dialog the cursor is. */
  onPaste(event: ClipboardEvent): void {
    if (this.thumbBusy()) return;
    const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    event.preventDefault();
    this.readThumb(file.type === 'image/jpeg' || file.type === 'image/png' ? file : new File([file], 'pasted.png', { type: 'image/png' }));
  }

  /** Uses one of the stills YouTube made for the video (fetched as a picture, so it can be re-sent as the thumbnail). */
  async pickYouTubeStill(still: { key: string; file: string }): Promise<void> {
    if (this.thumbBusy()) return;
    const id = this.video().videoId;
    if (!VIDEO_ID.test(id)) return;
    this.ytStillPick.set(still.key);
    this.thumbError.set(null);
    this.thumbDone.set(false);
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/${still.file}`);
      if (!res.ok) throw new Error('missing');
      const blob = await res.blob();
      this.readThumb(new File([blob], still.file, { type: 'image/jpeg' }), 'youtube');
    } catch {
      this.ytStillPick.set(null);
      this.thumbError.set(still.key === 'max'
        ? "YouTube has no HD picture for this video. Try one of the other stills."
        : "That YouTube picture couldn't be loaded. Try another.");
    }
  }

  /** A picture from the project's assets: its bytes are read and sent like an upload. */
  pickLibraryAsset(assetId: string): void {
    this.libraryOpen.set(false);
    this.thumbError.set(null);
    this.thumbBusy.set(true);
    const generation = this.generation;
    this.assets.assetContent(assetId).subscribe({
      next: (blob) => {
        if (generation !== this.generation) return;
        this.thumbBusy.set(false);
        const type = blob.type === 'image/jpeg' || blob.type === 'image/png' ? blob.type : '';
        if (!type) {
          this.thumbError.set('That asset is not a JPG or PNG picture. Pick another, or upload one.');
          return;
        }
        this.readThumb(new File([blob], 'asset', { type }), 'library');
      },
      error: () => {
        if (generation !== this.generation) return;
        this.thumbBusy.set(false);
        this.thumbError.set("That picture couldn't be loaded. Pick another.");
      },
    });
  }

  onThumbLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.thumbSize.set(img.naturalWidth > 0 ? { w: img.naturalWidth, h: img.naturalHeight } : null);
  }

  toneLabel(t: string): string {
    return toneLabel(t);
  }
}

function message(e: unknown): string {
  return e instanceof ApiFailure || e instanceof Error ? e.message : 'Something went wrong.';
}
