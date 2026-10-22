import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  YouTubeChannel, YouTubePrivacy, YouTubeSuggestEngine, YouTubeVideoInspection,
} from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { splitTags, toneLabel } from './checkup-draft';

/** The most videos one run reads; each one is a watch page, captions and an AI draft. */
export const MAX_VIDEOS = 25;

/** Two at a time: the server writes two suggestions at once anyway, and YouTube stays friendly. */
const PARALLEL = 2;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_TITLE = 100;
const MAX_DESCRIPTION_BYTES = 5000;
const MAX_TAGS = 500;

type Status = 'queued' | 'running' | 'done' | 'error' | 'cancelled';

/** One video on the page: its progress, what was found, and the details being reviewed. */
export interface DetailsItem {
  videoId: string;
  /** What is sent to the server: the ID, or a Shorts link so it is treated as a Short. */
  reference: string;
  status: Status;
  error: string | null;
  result: YouTubeVideoInspection | null;
  title: string;
  description: string;
  tagsText: string;
  pinned: string;
  madeForKids: boolean | null;
  confirming: boolean;
  applying: boolean;
  applied: boolean;
  applyError: string | null;
}

/**
 * Video details from IDs: paste up to 25 video IDs or links - your own or anyone's - and each
 * video is read in full (captions, the music it uses, chapters from the caption timing) with
 * fresh titles, a description, tags, hashtags and a pinned comment written for it. Everything
 * can be copied or exported; a video on one of your channels can also be updated on YouTube.
 * Nothing changes on YouTube until "Apply to YouTube" is confirmed.
 */
@Component({
  selector: 'app-video-details',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './video-details.component.html',
  styleUrl: './video-details.component.css',
})
export class VideoDetailsComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);

  readonly maxVideos = MAX_VIDEOS;
  readonly maxTags = MAX_TAGS;
  readonly maxDescriptionBytes = MAX_DESCRIPTION_BYTES;

  readonly channels = signal<YouTubeChannel[]>([]);
  readonly tones = signal<string[]>(['auto']);
  readonly engines = signal<YouTubeSuggestEngine[]>([]);

  readonly input = signal('');
  readonly channelId = signal('');
  readonly tone = signal('auto');
  readonly language = signal('en');
  readonly engine = signal('');
  readonly brief = signal('');

  readonly items = signal<DetailsItem[]>([]);
  readonly running = signal(false);
  readonly notice = signal<string | null>(null);
  readonly copied = signal<string | null>(null);

  private readonly active = new Map<string, Subscription>();

  /** What the box holds right now: the videos it names (deduplicated) and what isn't a video. */
  readonly parsed = computed(() => parseVideoList(this.input()));
  readonly doneCount = computed(() => this.items().filter((i) => i.status === 'done').length);
  readonly finishedCount = computed(() => this.items().filter((i) => i.status !== 'queued' && i.status !== 'running').length);
  readonly progress = computed(() => {
    const total = this.items().length;
    return total === 0 ? 0 : Math.round((this.finishedCount() / total) * 100);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancel());
  }

  ngOnInit(): void {
    this.api.status().pipe(catchError(() => of(null))).subscribe((s) => {
      if (s) this.channels.set(s.channels.filter((c) => !c.needsReconnect));
    });
    this.api.suggestOptions().pipe(catchError(() => of(null))).subscribe((o) => {
      if (!o) return;
      this.engines.set(o.engines);
      if (o.tones.length > 0) this.tones.set(o.tones);
    });
  }

  toneLabel(t: string): string {
    return toneLabel(t);
  }

  // --- running

  run(): void {
    if (this.running()) return;
    const { videos, rejected } = this.parsed();
    if (videos.length === 0) {
      this.notice.set('Paste at least one video ID or YouTube link.');
      return;
    }
    const list = videos.slice(0, MAX_VIDEOS);
    const skipped: string[] = [];
    if (videos.length > MAX_VIDEOS) skipped.push(`Only the first ${MAX_VIDEOS} videos are read; run the rest next.`);
    if (rejected.length > 0) skipped.push(`Not a YouTube video: ${rejected.slice(0, 5).join(', ')}${rejected.length > 5 ? '…' : ''}`);
    this.notice.set(skipped.length > 0 ? skipped.join(' ') : null);

    this.items.set(list.map((v) => emptyItem(v.videoId, v.reference)));
    this.running.set(true);
    this.pump();
  }

  cancel(): void {
    for (const sub of this.active.values()) sub.unsubscribe();
    this.active.clear();
    this.items.update((all) => all.map((i) => (i.status === 'queued' || i.status === 'running' ? { ...i, status: 'cancelled' as const } : i)));
    this.running.set(false);
  }

  retry(item: DetailsItem): void {
    this.patch(item.videoId, { status: 'queued', error: null });
    this.running.set(true);
    this.pump();
  }

  clear(): void {
    this.cancel();
    this.items.set([]);
    this.notice.set(null);
  }

  /** Starts queued videos until two are running; one failing never stops the others. */
  private pump(): void {
    for (const item of this.items()) {
      if (this.active.size >= PARALLEL) break;
      if (item.status !== 'queued') continue;
      this.start(item);
    }
    if (this.active.size === 0 && !this.items().some((i) => i.status === 'queued')) this.running.set(false);
  }

  private start(item: DetailsItem): void {
    const id = item.videoId;
    this.patch(id, { status: 'running', error: null });
    const finish = () => {
      this.active.delete(id);
      this.pump();
    };
    const sub = this.api.inspectVideo({
      video: item.reference,
      channelId: this.channelId() || null,
      tone: this.tone(),
      language: this.language(),
      brief: this.brief().trim() || undefined,
      providerId: this.engine() || undefined,
    }).subscribe({
      next: (r) => {
        const s = r.suggestion;
        this.patch(id, {
          status: 'done',
          result: r,
          title: s.title,
          description: s.description,
          tagsText: s.tags.join(', '),
          pinned: s.pinnedComment ?? '',
          madeForKids: r.madeForKids,
        });
        finish();
      },
      error: (e: unknown) => {
        this.patch(id, { status: 'error', error: message(e) });
        finish();
      },
    });
    // A synchronous answer has already finished; only a pending call is tracked.
    if (this.items().find((i) => i.videoId === id)?.status === 'running') this.active.set(id, sub);
  }

  // --- editing

  patch(videoId: string, change: Partial<DetailsItem>): void {
    this.items.update((all) => all.map((i) => (i.videoId === videoId ? { ...i, ...change } : i)));
  }

  useTitle(item: DetailsItem, title: string): void {
    this.patch(item.videoId, { title, applied: false });
  }

  useDescription(item: DetailsItem, description: string): void {
    this.patch(item.videoId, { description, applied: false });
  }

  addTag(item: DetailsItem, tag: string): void {
    const tags = splitTags(item.tagsText);
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    this.patch(item.videoId, { tagsText: [...tags, tag].join(', '), applied: false });
  }

  tagsLength(text: string): number {
    return splitTags(text).join(',').length;
  }

  descriptionBytes(text: string): number {
    return new TextEncoder().encode(text).length;
  }

  titleOptions(item: DetailsItem): string[] {
    const s = item.result?.suggestion;
    if (!s) return [];
    return [...new Set([s.title, ...(s.titleOptions ?? [])])].filter((t) => t && t !== item.title).slice(0, 4);
  }

  descriptionOptions(item: DetailsItem): string[] {
    const s = item.result?.suggestion;
    if (!s) return [];
    return [s.description, ...(s.descriptionOptions ?? [])].filter((d) => d && d !== item.description).slice(0, 3);
  }

  tagIdeas(item: DetailsItem): string[] {
    const have = new Set(splitTags(item.tagsText).map((t) => t.toLowerCase()));
    return (item.result?.suggestion.tagIdeas ?? []).filter((t) => !have.has(t.toLowerCase())).slice(0, 15);
  }

  /** Why the reviewed details can't go to YouTube as they are, or null. */
  applyProblem(item: DetailsItem): string | null {
    const title = item.title.trim();
    if (!title) return 'Write a title first.';
    if (title.length > MAX_TITLE) return `The title is over ${MAX_TITLE} characters.`;
    if (/[<>]/.test(title) || /[<>]/.test(item.description)) return 'Remove the < and > characters - YouTube refuses them.';
    if (this.descriptionBytes(item.description) > MAX_DESCRIPTION_BYTES) return 'The description is over YouTube’s 5,000-byte limit.';
    if (this.tagsLength(item.tagsText) > MAX_TAGS) return `The tags are over ${MAX_TAGS} characters.`;
    if (item.madeForKids === null) return 'Choose whether the video is made for kids.';
    return null;
  }

  applyToYouTube(item: DetailsItem): void {
    const r = item.result;
    if (!r?.ownerChannelId || item.applying || this.applyProblem(item)) return;
    const privacy = (['public', 'unlisted', 'private'] as const).find((p) => p === r.privacy) ?? 'private';
    this.patch(item.videoId, { applying: true, confirming: false, applyError: null });
    this.api.saveVideoDetails(r.ownerChannelId, r.videoId, {
      metadata: {
        title: item.title.trim(),
        description: item.description.trim(),
        tags: splitTags(item.tagsText),
        categoryId: r.categoryId ?? '22',
        privacy: privacy as YouTubePrivacy,
        madeForKids: item.madeForKids,
        notifySubscribers: false,
      },
      addToPlaylistIds: [],
      currentPlaylistIds: [],
      playlistsKnown: false,
    }).subscribe({
      next: (res) => this.patch(item.videoId, {
        applying: false,
        applied: true,
        applyError: res.warnings.length > 0 ? res.warnings.join(' ') : null,
        result: { ...r, title: res.video.title, description: res.video.description, tags: res.video.tags },
      }),
      error: (e: unknown) => this.patch(item.videoId, { applying: false, applyError: message(e) }),
    });
  }

  // --- copy and export

  async copy(key: string, text: string | null | undefined): Promise<void> {
    if (!text?.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(key);
      setTimeout(() => { if (this.copied() === key) this.copied.set(null); }, 2000);
    } catch {
      this.notice.set('The browser did not allow copying. Allow clipboard access for this site and try again.');
    }
  }

  copyAll(item: DetailsItem): void {
    this.copy(`all-${item.videoId}`, packageText(item));
  }

  hashtagsText(item: DetailsItem): string {
    return (item.result?.hashtags ?? []).join(' ');
  }

  songsText(item: DetailsItem): string {
    return (item.result?.songs ?? []).map(songLine).join('\n');
  }

  chaptersText(item: DetailsItem): string {
    return (item.result?.chapters ?? []).map((c) => `${c.stamp} ${c.title}`).join('\n');
  }

  exportJson(): void {
    const rows = this.items().filter((i) => i.status === 'done' && i.result).map(exportRow);
    download(`video-details-${stamp()}.json`, JSON.stringify(rows, null, 2), 'application/json');
  }

  exportCsv(): void {
    const rows = this.items().filter((i) => i.status === 'done' && i.result).map(exportRow);
    if (rows.length === 0) return;
    const header = Object.keys(rows[0]);
    const lines = [header.join(','), ...rows.map((r) => header.map((h) => csvCell((r as Record<string, unknown>)[h])).join(','))];
    download(`video-details-${stamp()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  }

  clock(seconds: number | null): string {
    if (seconds === null || !Number.isFinite(seconds)) return '';
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  }

  sourceLabel(source: string): string {
    return source === 'youtube-music-card' ? 'YouTube music card' : source === 'description' ? 'From description' : source;
  }
}

function emptyItem(videoId: string, reference: string): DetailsItem {
  return {
    videoId, reference, status: 'queued', error: null, result: null,
    title: '', description: '', tagsText: '', pinned: '', madeForKids: null,
    confirming: false, applying: false, applied: false, applyError: null,
  };
}

/**
 * The videos a pasted list names - IDs or watch, Shorts, youtu.be, live, embed or Studio links,
 * separated by spaces, commas or lines - each once, in order. The server checks every one again.
 */
export function parseVideoList(text: string): { videos: { videoId: string; reference: string }[]; rejected: string[] } {
  const seen = new Set<string>();
  const videos: { videoId: string; reference: string }[] = [];
  const rejected: string[] = [];
  for (const token of text.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).slice(0, 500)) {
    const id = token.length <= 2048 ? videoIdOf(token) : null;
    if (!id) {
      rejected.push(token.length > 40 ? `${token.slice(0, 40)}…` : token);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    videos.push({ videoId: id, reference: /\/shorts\//i.test(token) ? `https://www.youtube.com/shorts/${id}` : id });
  }
  return { videos, rejected };
}

function videoIdOf(token: string): string | null {
  if (VIDEO_ID.test(token)) return token;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(token) ? token : `https://${token}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  if (host === 'youtu.be') id = parts[0] ?? null;
  else if (host === 'studio.youtube.com') id = parts[0] === 'video' ? parts[1] ?? null : null;
  else if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? (['shorts', 'live', 'embed', 'v'].includes(parts[0] ?? '') ? parts[1] ?? null : null);
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

function songLine(s: { title: string; artist: string | null; album: string | null; credits: string | null }): string {
  return [s.title, s.artist ? `- ${s.artist}` : '', s.album ? `(${s.album})` : '', s.credits ? `· ${s.credits}` : '']
    .filter(Boolean).join(' ');
}

/** Everything for one video as plain text, ready to paste anywhere. */
function packageText(item: DetailsItem): string {
  const r = item.result;
  if (!r) return '';
  const s = r.suggestion;
  const parts = [
    `Video: ${r.videoUrl}`,
    `Title: ${item.title}`,
    s.titleOptions?.length ? `Other titles:\n${s.titleOptions.map((t) => `- ${t}`).join('\n')}` : '',
    `Description:\n${item.description}`,
    `Tags: ${splitTags(item.tagsText).join(', ')}`,
    r.hashtags.length ? `Hashtags: ${r.hashtags.join(' ')}` : '',
    item.pinned ? `Pinned comment:\n${item.pinned}` : '',
    r.songs.length ? `Music:\n${r.songs.map(songLine).join('\n')}` : '',
    r.chapters.length ? `Chapters:\n${r.chapters.map((c) => `${c.stamp} ${c.title}`).join('\n')}` : '',
  ];
  return parts.filter(Boolean).join('\n\n');
}

function exportRow(item: DetailsItem): Record<string, string | number | null> {
  const r = item.result!;
  return {
    videoId: r.videoId,
    url: r.videoUrl,
    originalTitle: r.title,
    channel: r.channelTitle,
    durationSeconds: r.durationSeconds,
    published: r.publishedAt ?? r.publishedText,
    captionsLanguage: r.captions.language,
    captionsAuto: r.captions.isAuto === null ? null : String(r.captions.isAuto),
    music: r.songs.map(songLine).join(' | '),
    chapters: r.chapters.map((c) => `${c.stamp} ${c.title}`).join(' | '),
    title: item.title,
    titleOptions: (r.suggestion.titleOptions ?? []).join(' | '),
    description: item.description,
    tags: splitTags(item.tagsText).join(', '),
    hashtags: r.hashtags.join(' '),
    pinnedComment: item.pinned,
  };
}

/** A CSV field, quoted, with formulas defused so a spreadsheet never runs a cell. */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
}

function message(e: unknown): string {
  return e instanceof ApiFailure || e instanceof Error ? e.message : 'Something went wrong.';
}
