import { DecimalPipe } from '@angular/common';
import {
  Component, ElementRef, OnDestroy, afterNextRender, computed, effect, inject, input, output, signal, untracked, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MediaTranscript, MediaTranscriptLine } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import {
  cueIndexAt, cuesAsSrt, cuesAsText, cuesAsTimedText, formatClock, parseSubtitleCues,
} from './transcript-cues';

/** The file to inspect, and - when it was opened from the timeline - where it sits there. */
export interface InspectTarget {
  assetId: string;
  name: string;
  /** 'Video' | 'Audio' | 'Image' | 'Subtitle', as the asset reports it. */
  kind: string;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  /**
   * The part of the file used on the timeline: it starts at `startSeconds` there and plays
   * the file from `trimStartSeconds` for `durationSeconds`. Lets every time be read, copied
   * and exported in timeline time.
   */
  timeline?: { startSeconds: number; trimStartSeconds: number; durationSeconds: number; label: string } | null;
}

/** The languages the server accepts as a hint; '' lets the recognizer detect it (and copes with Hinglish). */
export const TRANSCRIPT_LANGUAGES = [
  { code: '', label: 'Detect automatically' },
  { code: 'hi', label: 'Hindi' }, { code: 'en', label: 'English' }, { code: 'ur', label: 'Urdu' },
  { code: 'pa', label: 'Punjabi' }, { code: 'bn', label: 'Bengali' }, { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' }, { code: 'ta', label: 'Tamil' }, { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' }, { code: 'ml', label: 'Malayalam' },
] as const;

/** Files up to this size are decoded in the browser to draw their waveform. */
const WAVEFORM_MAX_BYTES = 80 * 1024 * 1024;
const WAVEFORM_BARS = 720;

type CopyKind = 'text' | 'timed' | 'line';

/** A transcript line as listed: its place in the file, on the timeline, and the search hits in it. */
interface CueRow {
  index: number;
  cue: MediaTranscriptLine;
  /** Shown time, in whichever time base is chosen. */
  at: number;
  /** False when the line falls in a part of the file trimmed off the timeline. */
  used: boolean;
  parts: { text: string; hit: boolean }[];
}

/**
 * Inspect any media file: play it, see its waveform, and read, search, copy or export what is
 * said in it - with times in the file, or on the timeline when it was opened from there. A
 * subtitle file shows its own lines. Extra actions can be projected with `inspectorActions`:
 *
 *   @if (inspect(); as target) {
 *     <app-media-inspector-dialog [target]="target" (closed)="inspect.set(null)" />
 *   }
 */
@Component({
  selector: 'app-media-inspector-dialog',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  host: { '(document:keydown)': 'onKey($event)' },
  templateUrl: './media-inspector-dialog.component.html',
  styleUrls: ['./media-inspector-dialog.component.css'],
})
export class MediaInspectorDialogComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly status = inject(StatusService);
  private readonly store = inject(ProjectStore, { optional: true });

  readonly target = input.required<InspectTarget>();
  /** Project the transcript is asked for in; defaults to the open project. */
  readonly projectId = input<string | null>(null);

  readonly closed = output<void>();
  /** Timeline seconds to move the playhead to, from a line's "on timeline" button. */
  readonly seekTimeline = output<number>();

  readonly languages = TRANSCRIPT_LANGUAGES;
  readonly clock = formatClock;

  private readonly player = viewChild<ElementRef<HTMLMediaElement>>('player');
  private readonly waveCanvas = viewChild<ElementRef<HTMLCanvasElement>>('wave');
  private readonly cueList = viewChild<ElementRef<HTMLElement>>('cueList');
  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  readonly kind = computed(() => this.target().kind);
  readonly isVideo = computed(() => this.kind() === 'Video');
  readonly isAudio = computed(() => this.kind() === 'Audio');
  readonly isImage = computed(() => this.kind() === 'Image');
  /** A subtitle or plain-text file: its own lines are shown, there is nothing to play. */
  readonly isSubtitle = computed(() => isTextDocument(this.target()));
  readonly isPlayable = computed(() => this.isVideo() || this.isAudio());
  readonly url = computed(() => this.api.assetUrl(this.target().assetId));

  // ── Player ────────────────────────────────────────────────────
  readonly playing = signal(false);
  readonly currentTime = signal(0);
  readonly mediaDuration = signal<number | null>(null);
  readonly rate = signal(1);
  readonly mediaFailed = signal(false);
  readonly measuredSize = signal<string | null>(null);
  readonly duration = computed(() => this.mediaDuration() ?? this.target().durationSeconds ?? this.lastCueEnd());

  // ── Waveform ──────────────────────────────────────────────────
  readonly peaks = signal<Float32Array | null>(null);
  readonly waveState = signal<'idle' | 'loading' | 'ready' | 'skipped' | 'failed'>('idle');
  readonly hoverRatio = signal<number | null>(null);

  // ── Transcript ────────────────────────────────────────────────
  readonly cues = signal<MediaTranscriptLine[] | null>(null);
  /** Where the lines came from: recognized now, a saved .srt in the library, or the file itself. */
  readonly cueSource = signal<'recognized' | 'library' | 'file' | null>(null);
  readonly transcript = signal<MediaTranscript | null>(null);
  /** A subtitle or text file that holds no timed lines, shown as it is. */
  readonly rawText = signal<string | null>(null);
  readonly loadingText = signal(false);
  readonly language = signal('');
  readonly transcribing = signal<'idle' | 'reading' | 'saving'>('idle');
  readonly error = signal<string | null>(null);
  readonly copied = signal<{ kind: CopyKind; index?: number } | null>(null);
  readonly query = signal('');
  readonly follow = signal(true);
  readonly timeBase = signal<'file' | 'timeline'>('file');

  /** Timeline seconds = file seconds + this, for a file opened from the timeline. */
  readonly timelineOffset = computed(() => {
    const t = this.target().timeline;
    return t ? t.startSeconds - t.trimStartSeconds : 0;
  });

  readonly activeIndex = computed(() => {
    const cues = this.cues();
    return cues ? cueIndexAt(cues, this.currentTime()) : -1;
  });

  readonly rows = computed<CueRow[]>(() => {
    const cues = this.cues() ?? [];
    const q = this.query().trim().toLowerCase();
    const onTimeline = this.timeBase() === 'timeline';
    const offset = onTimeline ? this.timelineOffset() : 0;
    const rows: CueRow[] = [];
    cues.forEach((cue, index) => {
      if (q && !cue.text.toLowerCase().includes(q)) return;
      rows.push({ index, cue, at: cue.startSeconds + offset, used: this.isUsed(cue), parts: highlight(cue.text, q) });
    });
    return rows;
  });

  readonly wordCount = computed(() =>
    (this.cues() ?? []).reduce((n, c) => n + c.text.split(/\s+/).filter(Boolean).length, 0));

  readonly languageLabel = computed(() => languageName(this.transcript()?.language ?? null));

  private readonly lastCueEnd = computed(() => {
    const cues = this.cues();
    return cues && cues.length > 0 ? cues[cues.length - 1].endSeconds : null;
  });

  private transcribeSub?: Subscription;
  private textSub?: Subscription;
  private waveSub?: Subscription;
  private frameId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private copiedTimer?: ReturnType<typeof setTimeout>;
  private destroyed = false;

  constructor() {
    // A new file: start over, and fetch whatever can be shown without asking.
    effect(() => {
      const target = this.target();
      untracked(() => this.load(target));
    });

    // Keep the line being spoken in view while it plays.
    effect(() => {
      const index = this.activeIndex();
      if (!this.follow() || !this.playing() || index < 0) return;
      untracked(() => {
        const row = this.cueList()?.nativeElement.querySelector<HTMLElement>(`[data-cue="${index}"]`);
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });

    // Redraw the waveform when its data, the playhead, the hover or the cues change.
    effect(() => {
      this.peaks();
      this.currentTime();
      this.hoverRatio();
      this.cues();
      this.duration();
      untracked(() => this.drawWave());
    });

    afterNextRender(() => {
      const canvas = this.waveCanvas()?.nativeElement;
      if (canvas && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.drawWave());
        this.resizeObserver.observe(canvas);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.transcribeSub?.unsubscribe();
    this.textSub?.unsubscribe();
    this.waveSub?.unsubscribe();
    this.stopFrames();
    this.resizeObserver?.disconnect();
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.player()?.nativeElement.pause();
  }

  private load(target: InspectTarget): void {
    this.transcribeSub?.unsubscribe();
    this.textSub?.unsubscribe();
    this.waveSub?.unsubscribe();
    this.cues.set(null);
    this.cueSource.set(null);
    this.transcript.set(null);
    this.rawText.set(null);
    this.error.set(null);
    this.query.set('');
    this.transcribing.set('idle');
    this.currentTime.set(0);
    this.mediaDuration.set(null);
    this.mediaFailed.set(false);
    this.measuredSize.set(null);
    this.peaks.set(null);
    this.waveState.set('idle');
    this.timeBase.set(target.timeline ? 'timeline' : 'file');

    if (isTextDocument(target)) {
      this.loadText(target.assetId, 'file');
      return;
    }
    if (target.kind === 'Video' || target.kind === 'Audio') {
      // A transcript saved earlier ("<name> - transcript.srt") opens straight away.
      const saved = this.savedTranscriptFor(target.name);
      if (saved) this.loadText(saved.id, 'library');
      this.loadWaveform(target);
    }
  }

  private savedTranscriptFor(name: string): { id: string } | undefined {
    const base = name.replace(/\.[^.]+$/, '').trim().toLowerCase();
    if (!base) return undefined;
    return this.store?.subtitles().find((a) => {
      const n = a.name.toLowerCase();
      return n === `${base} - transcript.srt` || n === `${base}.srt` || n === `${base}.vtt`;
    });
  }

  /** Reads a subtitle/text asset and lists its lines, or shows it as text when it has none. */
  private loadText(assetId: string, source: 'library' | 'file'): void {
    this.loadingText.set(true);
    this.textSub = this.api.assetContent(assetId).subscribe({
      next: (blob) => {
        void blob.text().then((text) => {
          if (this.destroyed) return;
          this.loadingText.set(false);
          const cues = parseSubtitleCues(text);
          if (cues.length > 0) {
            this.cues.set(cues);
            this.cueSource.set(source);
          } else if (source === 'file') {
            this.rawText.set(text);
          }
        });
      },
      error: () => {
        this.loadingText.set(false);
        if (source === 'file') this.error.set('This file could not be read.');
      },
    });
  }

  // ── Waveform ──────────────────────────────────────────────────

  private loadWaveform(target: InspectTarget): void {
    if (typeof OfflineAudioContext === 'undefined') {
      this.waveState.set('skipped');
      return;
    }
    if ((target.fileSizeBytes ?? 0) > WAVEFORM_MAX_BYTES) {
      this.waveState.set('skipped');
      return;
    }
    this.waveState.set('loading');
    this.waveSub = this.api.assetContent(target.assetId).subscribe({
      next: (blob) => {
        if (blob.size > WAVEFORM_MAX_BYTES) {
          this.waveState.set('skipped');
          return;
        }
        void blob.arrayBuffer()
          .then((bytes) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(bytes))
          .then((audio) => {
            if (this.destroyed || this.target().assetId !== target.assetId) return;
            this.peaks.set(computePeaks(audio, WAVEFORM_BARS));
            this.waveState.set('ready');
          })
          .catch(() => {
            if (!this.destroyed) this.waveState.set('failed');
          });
      },
      error: () => this.waveState.set('failed'),
    });
  }

  private drawWave(): void {
    const canvas = this.waveCanvas()?.nativeElement;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const style = getComputedStyle(canvas);
    const played = style.getPropertyValue('--wave-played').trim() || '#6c8cff';
    const rest = style.getPropertyValue('--wave-rest').trim() || 'rgba(148, 163, 184, 0.45)';
    const cueColor = style.getPropertyValue('--wave-cue').trim() || 'rgba(250, 204, 21, 0.55)';
    const total = this.duration() ?? 0;
    const progress = total > 0 ? Math.min(1, this.currentTime() / total) : 0;
    const cueBand = 5;
    const mid = (height - cueBand - 2) / 2;

    const peaks = this.peaks();
    if (peaks) {
      const bars = Math.max(1, Math.min(peaks.length, Math.floor(width / 3)));
      const step = width / bars;
      for (let i = 0; i < bars; i++) {
        const peak = peaks[Math.floor((i / bars) * peaks.length)];
        const h = Math.max(1.5, peak * mid * 0.95);
        ctx.fillStyle = (i + 0.5) / bars <= progress ? played : rest;
        ctx.fillRect(i * step + 0.5, mid - h, Math.max(1, step - 1), h * 2);
      }
    } else {
      // No waveform (still loading, or too large to decode): a plain track to scrub on.
      ctx.fillStyle = rest;
      ctx.fillRect(0, mid - 1.5, width, 3);
      ctx.fillStyle = played;
      ctx.fillRect(0, mid - 1.5, width * progress, 3);
    }

    // Where each transcript line is said, along the bottom.
    const cues = this.cues();
    if (cues && total > 0) {
      ctx.fillStyle = cueColor;
      for (const c of cues) {
        const x = (c.startSeconds / total) * width;
        const w = Math.max(2, ((c.endSeconds - c.startSeconds) / total) * width - 1);
        ctx.fillRect(x, height - cueBand, w, cueBand);
      }
    }

    // Playhead and hover line.
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(Math.round(progress * width) - 1, 0, 2, height);
    const hover = this.hoverRatio();
    if (hover !== null) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.35)';
      ctx.fillRect(Math.round(hover * width), 0, 1, height);
    }
  }

  onWavePointer(event: PointerEvent, commit: boolean): void {
    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    if (commit) {
      const total = this.duration();
      if (total) this.seek(ratio * total, false);
    } else {
      this.hoverRatio.set(ratio);
    }
  }

  hoverTime(): number | null {
    const r = this.hoverRatio();
    const total = this.duration();
    return r !== null && total ? r * total : null;
  }

  // ── Player ────────────────────────────────────────────────────

  onMetadata(event: Event): void {
    const media = event.target as HTMLMediaElement;
    if (Number.isFinite(media.duration)) this.mediaDuration.set(media.duration);
    if (media instanceof HTMLVideoElement && media.videoWidth > 0) {
      this.measuredSize.set(`${media.videoWidth} × ${media.videoHeight}`);
    }
    media.playbackRate = this.rate();
  }

  onPlayState(playing: boolean): void {
    this.playing.set(playing);
    if (playing) this.startFrames();
    else {
      this.stopFrames();
      this.syncTime();
    }
  }

  /** The playhead at display rate while playing; timeupdate alone only fires ~4 times a second. */
  private startFrames(): void {
    if (this.frameId !== null) return;
    const tick = () => {
      this.syncTime();
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private stopFrames(): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  syncTime(): void {
    const media = this.player()?.nativeElement;
    if (media) this.currentTime.set(media.currentTime);
  }

  togglePlay(): void {
    const media = this.player()?.nativeElement;
    if (!media) return;
    if (media.paused) void media.play().catch(() => undefined);
    else media.pause();
  }

  /** Moves the player to `seconds` in the file, and plays from there unless told not to. */
  seek(seconds: number, play = true): void {
    const media = this.player()?.nativeElement;
    if (!media) return;
    media.currentTime = Math.max(0, seconds);
    this.currentTime.set(media.currentTime);
    if (play) void media.play().catch(() => undefined);
  }

  skip(delta: number): void {
    const media = this.player()?.nativeElement;
    if (media) this.seek(media.currentTime + delta, !media.paused);
  }

  setRate(rate: number): void {
    this.rate.set(rate);
    const media = this.player()?.nativeElement;
    if (media) media.playbackRate = rate;
  }

  // ── Transcript ────────────────────────────────────────────────

  /**
   * Gets what is said in the file. Asking again with `save` is quick: the server keeps each
   * part it has already recognized, so saving after reading does not transcribe twice.
   */
  transcribe(save = false): void {
    const projectId = this.projectId() ?? this.store?.projectId() ?? null;
    const target = this.target();
    if (!projectId || this.transcribing() !== 'idle') return;

    this.transcribeSub?.unsubscribe();
    this.transcribing.set(save ? 'saving' : 'reading');
    this.error.set(null);
    this.transcribeSub = this.api
      .transcribeAsset(projectId, target.assetId, this.language() || null, save)
      .subscribe({
        next: (result) => {
          this.transcribing.set('idle');
          if (this.target().assetId !== target.assetId) return;
          this.transcript.set(result);
          this.cues.set(result.lines);
          this.cueSource.set('recognized');
          if (result.savedAsset) {
            this.store?.refreshAssets();
            this.status.notify([`Saved "${result.savedAsset.name}" to the library.`]);
          }
        },
        error: (err: unknown) => {
          this.transcribing.set('idle');
          this.error.set(err instanceof Error ? err.message : 'The speech in this file could not be turned into text.');
        },
      });
  }

  /** A line counts as on the timeline when it is said inside the part of the file used there. */
  isUsed(cue: MediaTranscriptLine): boolean {
    const t = this.target().timeline;
    if (!t) return true;
    return cue.endSeconds > t.trimStartSeconds && cue.startSeconds < t.trimStartSeconds + t.durationSeconds;
  }

  /** The lines a copy or export takes: on the timeline, only those said in the part used there. */
  private exportCues(): MediaTranscriptLine[] {
    const cues = this.cues() ?? [];
    return this.timeBase() === 'timeline' ? cues.filter((c) => this.isUsed(c)) : cues;
  }

  private exportOffset(): number {
    return this.timeBase() === 'timeline' ? this.timelineOffset() : 0;
  }

  copyText(): void {
    this.copy(cuesAsText(this.exportCues()), { kind: 'text' });
  }

  copyTimed(): void {
    this.copy(cuesAsTimedText(this.exportCues(), this.exportOffset()), { kind: 'timed' });
  }

  copyLine(row: CueRow, event: Event): void {
    event.stopPropagation();
    this.copy(`[${formatClock(row.at)}] ${row.cue.text}`, { kind: 'line', index: row.index });
  }

  copyRaw(): void {
    const text = this.rawText();
    if (text) this.copy(text, { kind: 'text' });
  }

  isCopied(kind: CopyKind, index?: number): boolean {
    const c = this.copied();
    return !!c && c.kind === kind && (index === undefined || c.index === index);
  }

  private copy(text: string, what: { kind: CopyKind; index?: number }): void {
    if (!text || typeof navigator === 'undefined' || !navigator.clipboard) {
      this.error.set('The browser would not let the text be copied.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(what);
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(null), 1800);
    }, () => this.error.set('The browser would not let the text be copied.'));
  }

  downloadSrt(): void {
    const suffix = this.timeBase() === 'timeline' ? ' - timeline' : '';
    this.download(cuesAsSrt(this.exportCues(), this.exportOffset()), `transcript${suffix}.srt`, 'application/x-subrip');
  }

  downloadTxt(): void {
    const suffix = this.timeBase() === 'timeline' ? ' - timeline' : '';
    this.download(cuesAsTimedText(this.exportCues(), this.exportOffset()), `transcript${suffix}.txt`, 'text/plain');
  }

  private download(content: string, suffix: string, type: string): void {
    if (!content) return;
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.target().name.replace(/\.[^.]+$/, '')} - ${suffix}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /** Plays the file from where a line is said. */
  playCue(row: CueRow): void {
    if (this.isPlayable()) this.seek(row.cue.startSeconds);
  }

  /** Moves the studio's playhead to where a line is said on the timeline. */
  goToOnTimeline(row: CueRow, event: Event): void {
    event.stopPropagation();
    this.player()?.nativeElement.pause();
    this.seekTimeline.emit(row.cue.startSeconds + this.timelineOffset());
  }

  // ── Facts & keys ─────────────────────────────────────────────

  formatSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '—';
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closed.emit();
      return;
    }
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
      || event.target instanceof HTMLTextAreaElement;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f' && this.cues()) {
      event.preventDefault();
      this.searchBox()?.nativeElement.focus();
      return;
    }
    if (typing) return;
    // Space toggles this player; it must not reach the studio behind and start the timeline.
    if (event.key === ' ' && this.isPlayable()) {
      event.preventDefault();
      event.stopPropagation();
      this.togglePlay();
    }
  }
}

/** Splits `text` around case-insensitive matches of `q`, for highlighting without innerHTML. */
function highlight(text: string, q: string): { text: string; hit: boolean }[] {
  if (!q) return [{ text, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  const lower = text.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(q); at >= 0; at = lower.indexOf(q, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), hit: false });
    parts.push({ text: text.slice(at, at + q.length), hit: true });
    from = at + q.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), hit: false });
  return parts;
}

/** Loudest sample in each of `bars` slices, scaled so the loudest slice is 1. */
function computePeaks(audio: AudioBuffer, bars: number): Float32Array {
  const peaks = new Float32Array(bars);
  const size = Math.max(1, Math.floor(audio.length / bars));
  for (let ch = 0; ch < audio.numberOfChannels; ch++) {
    const data = audio.getChannelData(ch);
    for (let b = 0; b < bars; b++) {
      let max = 0;
      const end = Math.min(data.length, (b + 1) * size);
      for (let i = b * size; i < end; i += 4) {
        const v = Math.abs(data[i]);
        if (v > max) max = v;
      }
      if (max > peaks[b]) peaks[b] = max;
    }
  }
  let loudest = 0;
  for (const p of peaks) loudest = Math.max(loudest, p);
  if (loudest > 0) for (let b = 0; b < bars; b++) peaks[b] /= loudest;
  return peaks;
}

/** "hi" → "Hindi"; the code itself when the browser can't name it. */
function languageName(code: string | null): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Subtitle or text files, whose contents the dialog reads and lists. */
function isTextDocument(target: InspectTarget): boolean {
  if (target.kind === 'Subtitle') return true;
  if (target.kind === 'Video' || target.kind === 'Audio' || target.kind === 'Image') return false;
  return (target.mimeType ?? '').startsWith('text/') || /\.(srt|vtt|txt)$/i.test(target.name);
}
