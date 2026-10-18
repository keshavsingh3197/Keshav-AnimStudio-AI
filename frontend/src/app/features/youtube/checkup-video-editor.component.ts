import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  MAX_THUMBNAIL_UPLOAD_BYTES, YouTubeCategory, YouTubeCheckupPlaylist, YouTubeCheckupVideo, YouTubeThumbnailChoice,
  YouTubeVideoEditContext,
} from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { Draft, RowState, draftChecklist, draftDiffers, fitTags, hasFooter, insertAboveFooter, splitTags, trimUtf8Bytes, withFooter } from './checkup-draft';

/** Where the frame picker samples the render, as fractions of its length; "Other moments" shifts them. */
const FRAME_SPOTS = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9];

/** YouTube video ids are 11 URL-safe characters; nothing else is ever put in the player's URL. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type ThumbMode = 'current' | 'frame' | 'upload';

interface FrameOption { at: number; url: string | null; failed: boolean }

/**
 * The checkup's edit dialog for one video: the video and its thumbnail on one side, its
 * details on the other, with what the channel's setup and the AnimStudio project add, and a
 * live list of what is still missing. The draft lives in the checkup page (so bulk save sees
 * it); this dialog only edits it. The thumbnail is the exception - it is set on YouTube
 * straight away, on its own button, because YouTube stores it apart from the details.
 */
@Component({
  selector: 'app-checkup-video-editor',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './checkup-video-editor.component.html',
  styleUrl: './checkup-video-editor.component.css',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class CheckupVideoEditorComponent {
  private readonly api = inject(YouTubePublishService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly channelId = input.required<string>();
  readonly video = input.required<YouTubeCheckupVideo>();
  readonly state = input.required<RowState>();
  readonly playlists = input<YouTubeCheckupPlaylist[]>([]);
  readonly playlistsKnown = input(true);
  readonly categories = input<YouTubeCategory[]>([]);
  /** "3 of 25" in the current list, for the header. */
  readonly position = input('');
  readonly hasPrev = input(false);
  readonly hasNext = input(false);
  readonly promptCopied = input(false);
  /** Short line describing the page's AI settings, e.g. "tone auto, English". */
  readonly aiSummary = input('');

  readonly draftChange = output<Partial<Draft>>();
  readonly suggest = output<void>();
  readonly save = output<{ next: boolean }>();
  readonly reset = output<void>();
  readonly copyPrompt = output<void>();
  readonly move = output<-1 | 1>();
  readonly closed = output<void>();
  /** The thumbnail on YouTube changed (the video's id); the page refreshes its row's picture. */
  readonly thumbnailChanged = output<string>();

  readonly context = signal<YouTubeVideoEditContext | null>(null);
  readonly contextError = signal<string | null>(null);

  readonly playing = signal(false);

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
    switch (this.thumbMode()) {
      case 'upload': return this.thumbImage();
      case 'frame': {
        const at = this.frameAt();
        return at === null ? null : this.frames().find((f) => f.at === at)?.url ?? this.frameUrls.get(at) ?? null;
      }
      default: return this.currentThumb();
    }
  });

  readonly thumbChoice = computed<YouTubeThumbnailChoice | null>(() => {
    if (this.thumbMode() === 'upload' && this.thumbImage()) return { imageBase64: this.thumbImage() };
    if (this.thumbMode() === 'frame' && this.frameAt() !== null) return { frameAtSeconds: this.frameAt() };
    return null;
  });

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
    this.playing.set(false);
    this.thumbMode.set('current');
    this.frameAt.set(null);
    this.thumbImage.set(null);
    this.thumbBusy.set(false);
    this.thumbError.set(null);
    this.thumbDone.set(false);
    this.thumbVersion.set(0);
    this.clearFrames();

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
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (this.canSave()) this.save.emit({ next: event.shiftKey && this.hasNext() });
    }
  }

  canSave(): boolean {
    const d = this.draft();
    return !!d && !this.state().busy && d.madeForKids !== null
      && this.descriptionBytes(d.description) <= 5000
      && this.tagsLength(d.tagsText) <= 500
      && d.title.trim().length > 0 && d.title.length <= 100;
  }

  set(change: Partial<Draft>): void {
    this.draftChange.emit(change);
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
    this.set({ addPlaylistIds: has ? d.addPlaylistIds.filter((p) => p !== playlistId) : [...d.addPlaylistIds, playlistId] });
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
  private readThumb(file: File): void {
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
      this.thumbImage.set(typeof reader.result === 'string' ? reader.result : null);
      this.thumbMode.set('upload');
    };
    reader.onerror = () => this.thumbError.set("That picture couldn't be read. Choose another.");
    reader.readAsDataURL(file);
  }
}

function message(e: unknown): string {
  return e instanceof ApiFailure || e instanceof Error ? e.message : 'Something went wrong.';
}
