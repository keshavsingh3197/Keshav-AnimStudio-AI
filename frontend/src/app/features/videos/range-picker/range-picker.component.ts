import {
  Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, untracked, viewChild,
} from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ClipStudio, EDIT_FORMATS, EditFormat, ProjectEdit } from '../../../core/models/api.models';
import { PreviewItem, PreviewLane, PreviewTimeline, buildPreviewTimeline, clipIndexAt } from './preview-timeline';

type DragMode = 'seek' | 'start' | 'end' | 'move';

interface Drag {
  mode: DragMode;
  pointerId: number;
  /** Seconds between the grab point and the selection start, for 'move'. */
  grabOffset: number;
}

export interface TimeRange { start: number; end: number }

const LANES: { id: PreviewLane; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Images' },
  { id: 'audio', label: 'Audio' },
];

const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];
const MIN_RANGE = 1;
const SNAP_PX = 7;

/**
 * Plays a cut's timeline and lets the user mark the part to keep - on a lane view of its
 * clips, text, images and audio, or straight from the playhead. The parent owns the range;
 * this only proposes changes through `rangeChange`.
 */
@Component({
  selector: 'app-range-picker',
  standalone: true,
  templateUrl: './range-picker.component.html',
  styleUrl: './range-picker.component.css',
  host: { '(keydown)': 'onKey($event)' },
})
export class RangePickerComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  readonly projectId = input.required<string>();
  readonly source = input.required<ProjectEdit>();
  readonly start = input.required<number>();
  readonly end = input.required<number>();
  readonly targetFormat = input.required<EditFormat>();
  /** Longest the kept part may be (the Shorts limit), or null for no limit. */
  readonly maxSeconds = input<number | null>(null);

  readonly rangeChange = output<TimeRange>();
  /** The source's real length once its timeline is read - the listing can be stale. */
  readonly lengthKnown = output<number>();

  private readonly vidA = viewChild<ElementRef<HTMLVideoElement>>('vidA');
  private readonly vidB = viewChild<ElementRef<HTMLVideoElement>>('vidB');
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly root = viewChild<ElementRef<HTMLElement>>('root');

  readonly lanes = LANES;

  // --- data
  readonly timeline = signal<PreviewTimeline | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  private studioCache: { projectId: string; studio: ClipStudio } | null = null;
  private loadSub: Subscription | null = null;

  readonly length = computed(() => this.timeline()?.length ?? 0);

  // --- playback
  readonly time = signal(0);
  readonly playing = signal(false);
  readonly loopSelection = signal(true);
  readonly muted = signal(false);
  /** Playing only the selection: stops (or loops) at its end. */
  private selectionPlay = false;
  private clockBase = 0;
  private clockAt = 0;
  private raf = 0;
  /** Which clip index each of the two video elements holds; the front one is on screen. */
  private readonly slotClip: [number, number] = [-1, -1];
  readonly frontSlot = signal<0 | 1>(0);
  private readonly audio = new Map<string, HTMLAudioElement>();

  // --- strip
  readonly zoom = signal(1);
  readonly showFrame = signal(true);
  private drag: Drag | null = null;
  readonly dragging = signal<DragMode | null>(null);

  readonly sourceFormat = computed(() => EDIT_FORMATS.find((f) => f.value === this.source().format) ?? EDIT_FORMATS[0]);
  readonly targetSpec = computed(() => EDIT_FORMATS.find((f) => f.value === this.targetFormat()) ?? EDIT_FORMATS[0]);
  readonly frameDiffers = computed(() => this.targetFormat() !== this.source().format);

  /** The target frame as a centred box inside the source frame, in percent. */
  readonly frameGuide = computed(() => {
    const src = this.sourceFormat();
    const dst = this.targetSpec();
    const srcRatio = src.width / src.height;
    const dstRatio = dst.width / dst.height;
    return dstRatio < srcRatio
      ? { width: (dstRatio / srcRatio) * 100, height: 100 }
      : { width: 100, height: (srcRatio / dstRatio) * 100 };
  });

  readonly selLength = computed(() => Math.max(0, this.end() - this.start()));
  readonly overLimit = computed(() => {
    const max = this.maxSeconds();
    return max !== null && this.selLength() > max;
  });

  readonly activeClipIndex = computed(() => clipIndexAt(this.timeline()?.clips ?? [], this.time()));
  readonly activeClip = computed(() => this.timeline()?.clips[this.activeClipIndex()] ?? null);

  readonly activeText = computed(() => this.activeItems('text'));
  readonly activeImages = computed(() => this.activeItems('image').filter((i) => i.kind === 'image'));

  readonly laneItems = computed(() => {
    const items = this.timeline()?.items ?? [];
    return LANES
      .map((l) => ({ ...l, items: items.filter((i) => i.lane === l.id) }))
      .filter((l) => l.items.length > 0);
  });

  readonly ticks = computed(() => {
    const len = this.length();
    if (len <= 0) return [];
    // Aim for a label about every 70px of strip.
    const width = (this.scroller()?.nativeElement.clientWidth || 560) * this.zoom();
    const wanted = (len / width) * 70;
    const step = TICK_STEPS.find((s) => s >= wanted) ?? TICK_STEPS[TICK_STEPS.length - 1];
    const out: number[] = [];
    for (let t = 0; t <= len + 1e-6; t += step) out.push(t);
    return out;
  });

  /** What the new cut will hold: everything that overlaps the chosen part. */
  readonly carried = computed(() => {
    const t = this.timeline();
    const s = this.start();
    const e = this.end();
    if (!t) return null;
    const hit = <T extends { start: number; end: number }>(x: T) => x.end > s && x.start < e;
    const cut = <T extends { start: number; end: number }>(x: T) => x.start < s || x.end > e;
    const clips = t.clips.filter(hit);
    const items = t.items.filter(hit);
    const texts = items.filter((i) => i.kind === 'text');
    const images = items.filter((i) => i.kind === 'image' || i.kind === 'video');
    const audio = items.filter((i) => i.kind === 'audio');
    return {
      clips: clips.length,
      trimmedClips: clips.filter(cut).length,
      texts,
      images,
      audio,
      trimmedItems: items.filter(cut).length,
    };
  });

  constructor() {
    effect(() => {
      // Keyed on the id: a refreshed copy of the same video must not restart playback.
      const projectId = this.projectId();
      const sourceId = this.source().id;
      untracked(() => this.load(projectId, sourceId));
    });
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    cancelAnimationFrame(this.raf);
    for (const v of [this.vidA(), this.vidB()]) {
      if (!v) continue;
      v.nativeElement.pause();
      v.nativeElement.removeAttribute('src');
      v.nativeElement.load();
    }
    for (const a of this.audio.values()) {
      a.pause();
      a.removeAttribute('src');
    }
    this.audio.clear();
  }

  // --- loading

  private load(projectId: string, sourceId: string): void {
    this.loadSub?.unsubscribe();
    this.pause();
    this.timeline.set(null);
    this.loadError.set(null);
    this.loading.set(true);
    this.slotClip[0] = -1;
    this.slotClip[1] = -1;

    const cached = this.studioCache?.projectId === projectId ? this.studioCache.studio : null;
    this.loadSub = forkJoin({
      edit: this.api.getEdit(projectId, sourceId),
      studio: cached ? of(cached) : this.api.clipStudio(projectId),
    }).subscribe({
      next: ({ edit, studio }) => {
        this.studioCache = { projectId, studio };
        const t = buildPreviewTimeline(edit, studio);
        this.timeline.set(t);
        this.loading.set(false);
        if (t.length > 0) this.lengthKnown.emit(t.length);
        this.seek(Math.min(this.start(), t.length));
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load this video for preview. You can still type the times below.');
      },
    });
  }

  // --- helpers for the template

  pct(seconds: number): number {
    const len = this.length();
    return len > 0 ? (seconds / len) * 100 : 0;
  }

  /** A CSS background value; the id is URL-encoded, so it cannot close the quoted url(). */
  thumbBackground(assetId: string): string {
    return `url("${this.api.assetThumbnailUrl(assetId)}")`;
  }

  mediaUrl(assetId: string): string {
    return this.api.assetUrl(encodeURIComponent(assetId));
  }

  clock(seconds: number, fine = false): string {
    const total = Math.max(0, seconds);
    const whole = fine ? Math.floor(total) : Math.round(total);
    const h = Math.floor(whole / 3600);
    const m = Math.floor((whole % 3600) / 60);
    const s = String(whole % 60).padStart(2, '0');
    const tenth = fine ? `.${Math.floor((total - whole) * 10)}` : '';
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}${tenth}` : `${m}:${s}${tenth}`;
  }

  /** Accepts "90", "1:30", "1:30.5" or "0:01:30". */
  parseClock(text: string): number | null {
    const parts = text.trim().split(':').map((p) => Number(p));
    if (parts.length === 0 || parts.length > 3 || parts.some((p) => !Number.isFinite(p) || p < 0)) return null;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }

  textScale(fontSize: number | undefined): string {
    // Text sizes are in output pixels; the stage is a size container.
    return `calc(${fontSize ?? 36} * 100cqh / ${this.sourceFormat().height})`;
  }

  overlayOpacity(item: PreviewItem): number {
    const base = item.transform?.opacity ?? 1;
    const t = this.time();
    const fadeIn = Math.min(1, (t - item.start) / 0.5);
    const fadeOut = Math.min(1, (item.end - t) / 0.5);
    return Math.max(0, base * Math.min(fadeIn, fadeOut));
  }

  overlayTransform(item: PreviewItem): string {
    const tr = item.transform;
    if (!tr) return 'none';
    return `translate(${tr.x ?? 0}px, ${tr.y ?? 0}px) scale(${tr.scale ?? 1}) rotate(${tr.rotation ?? 0}deg)`;
  }

  textList(items: PreviewItem[]): string {
    return items.map((i) => `${i.label} (${this.clock(i.start)}–${this.clock(i.end)})`).join('\n');
  }

  private activeItems(lane: PreviewLane): PreviewItem[] {
    const t = this.time();
    return (this.timeline()?.items ?? []).filter((i) => i.lane === lane && t >= i.start && t < i.end);
  }

  // --- range

  private emitRange(start: number, end: number): void {
    const len = this.length() || Number.POSITIVE_INFINITY;
    let s = Math.max(0, Math.min(start, len));
    let e = Math.max(0, Math.min(end, len));
    if (e - s < MIN_RANGE) {
      if (e + MIN_RANGE <= len) e = s + MIN_RANGE;
      else s = Math.max(0, e - MIN_RANGE);
    }
    this.rangeChange.emit({ start: Math.round(s * 10) / 10, end: Math.round(e * 10) / 10 });
  }

  setStartHere(): void {
    const t = this.time();
    // Marking a start past the end keeps the old length, so I-then-O and O-then-I both work.
    this.emitRange(t, t < this.end() - MIN_RANGE ? this.end() : t + this.selLength());
  }

  setEndHere(): void {
    const t = this.time();
    this.emitRange(t > this.start() + MIN_RANGE ? this.start() : Math.max(0, t - this.selLength()), t);
  }

  typed(which: 'start' | 'end', text: string): void {
    const v = this.parseClock(text);
    if (v === null) return;
    if (which === 'start') this.emitRange(v, Math.max(this.end(), v + MIN_RANGE));
    else this.emitRange(Math.min(this.start(), v - MIN_RANGE), v);
  }

  preset(where: 'first' | 'middle' | 'last' | 'playhead', seconds: number): void {
    const len = this.length();
    if (len <= 0) return;
    const span = Math.min(seconds, len);
    const start = where === 'first' ? 0
      : where === 'last' ? len - span
        : where === 'middle' ? (len - span) / 2
          : Math.min(this.time(), len - span);
    this.emitRange(start, start + span);
    this.seek(start);
  }

  selectSpan(seg: { start: number; end: number }): void {
    this.emitRange(seg.start, seg.end);
    this.seek(seg.start);
  }

  fitToLimit(): void {
    const max = this.maxSeconds();
    if (max !== null) this.emitRange(this.start(), this.start() + max);
  }

  // --- zoom

  zoomBy(factor: number): void {
    this.setZoom(this.zoom() * factor, this.time());
  }

  setZoomAll(): void {
    this.setZoom(1, 0);
  }

  zoomToSelection(): void {
    const len = this.length();
    if (len <= 0) return;
    const span = Math.max(this.selLength(), MIN_RANGE);
    this.setZoom((len / span) * 0.8, (this.start() + this.end()) / 2);
  }

  private setZoom(z: number, around: number): void {
    const len = this.length();
    const zoom = Math.max(1, Math.min(z, Math.max(1, len / 4)));
    this.zoom.set(zoom);
    // Keep `around` in the middle of the view once the strip has its new width.
    requestAnimationFrame(() => {
      const sc = this.scroller()?.nativeElement;
      if (!sc || len <= 0) return;
      sc.scrollLeft = (around / len) * sc.scrollWidth - sc.clientWidth / 2;
    });
  }

  onWheel(ev: WheelEvent): void {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    this.setZoom(this.zoom() * (ev.deltaY < 0 ? 1.25 : 0.8), this.timeAtX(ev.clientX));
  }

  // --- strip dragging

  private timeAtX(clientX: number): number {
    const el = this.track()?.nativeElement;
    const len = this.length();
    if (!el || len <= 0) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(len, ((clientX - r.left) / r.width) * len));
  }

  /** Clip edges and the playhead pull a dragged edge onto them; Alt drags freely. */
  private snap(t: number, ev: PointerEvent): number {
    const el = this.track()?.nativeElement;
    const len = this.length();
    if (ev.altKey || !el || len <= 0) return t;
    const tolerance = (SNAP_PX / el.getBoundingClientRect().width) * len;
    const targets = [0, len, this.time(), ...(this.timeline()?.clips.flatMap((c) => [c.start, c.end]) ?? [])];
    let best = t;
    let bestGap = tolerance;
    for (const x of targets) {
      const gap = Math.abs(x - t);
      if (gap < bestGap) { best = x; bestGap = gap; }
    }
    return best;
  }

  startDrag(ev: PointerEvent, mode: DragMode): void {
    if (ev.button !== 0 || this.length() <= 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    // preventDefault keeps focus where it was; take it so the keyboard shortcuts work.
    this.root()?.nativeElement.focus({ preventScroll: true });
    const at = this.timeAtX(ev.clientX);
    this.drag = { mode, pointerId: ev.pointerId, grabOffset: at - this.start() };
    this.dragging.set(mode);
    this.track()?.nativeElement.setPointerCapture(ev.pointerId);
    if (mode === 'seek') this.seek(at);
  }

  onDragMove(ev: PointerEvent): void {
    const d = this.drag;
    if (!d || d.pointerId !== ev.pointerId) return;
    const at = this.timeAtX(ev.clientX);
    const len = this.length();
    if (d.mode === 'seek') {
      this.seek(at);
    } else if (d.mode === 'start') {
      this.emitRange(Math.min(this.snap(at, ev), this.end() - MIN_RANGE), this.end());
    } else if (d.mode === 'end') {
      this.emitRange(this.start(), Math.max(this.snap(at, ev), this.start() + MIN_RANGE));
    } else {
      const span = this.selLength();
      const s = Math.max(0, Math.min(len - span, this.snap(at - d.grabOffset, ev)));
      this.emitRange(s, s + span);
    }
  }

  endDrag(ev: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== ev.pointerId) return;
    const mode = this.drag.mode;
    this.drag = null;
    this.dragging.set(null);
    // After moving an edge, show the frame there.
    if (mode === 'start') this.seek(this.start());
    else if (mode === 'end') this.seek(Math.max(0, this.end() - 0.1));
    else if (mode === 'move') this.seek(this.start());
  }

  overviewSeek(ev: PointerEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const t = ((ev.clientX - r.left) / r.width) * this.length();
    this.seek(t);
    this.revealTime(t);
  }

  private revealTime(t: number): void {
    const sc = this.scroller()?.nativeElement;
    const len = this.length();
    if (!sc || len <= 0 || this.zoom() <= 1) return;
    const x = (t / len) * sc.scrollWidth;
    if (x < sc.scrollLeft + 24 || x > sc.scrollLeft + sc.clientWidth - 24) {
      sc.scrollLeft = x - sc.clientWidth / 2;
    }
  }

  // --- keyboard

  onKey(ev: KeyboardEvent): void {
    const target = ev.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    const step = ev.shiftKey ? 5 : 1;
    switch (ev.key) {
      case ' ': this.toggle(); break;
      case 'i': case 'I': this.setStartHere(); break;
      case 'o': case 'O': this.setEndHere(); break;
      case 'ArrowLeft': this.seek(this.time() - step); break;
      case 'ArrowRight': this.seek(this.time() + step); break;
      case ',': this.seek(this.time() - 0.1); break;
      case '.': this.seek(this.time() + 0.1); break;
      default: return;
    }
    ev.preventDefault();
  }

  // --- playback

  toggle(): void {
    if (this.playing()) this.pause();
    else this.play(false);
  }

  playSelection(): void {
    this.seek(this.start());
    this.play(true);
  }

  play(selectionOnly: boolean): void {
    const len = this.length();
    if (len <= 0) return;
    this.selectionPlay = selectionOnly;
    if (this.time() >= len - 0.05) this.time.set(0);
    if (selectionOnly && (this.time() < this.start() || this.time() >= this.end())) this.time.set(this.start());
    this.clockBase = this.time();
    this.clockAt = performance.now();
    this.playing.set(true);
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.tick());
  }

  pause(): void {
    this.playing.set(false);
    cancelAnimationFrame(this.raf);
    this.sync();
  }

  seek(t: number): void {
    const len = this.length();
    const v = Math.max(0, Math.min(len, t));
    this.time.set(v);
    this.clockBase = v;
    this.clockAt = performance.now();
    this.sync();
    this.revealTime(v);
  }

  private tick(): void {
    if (!this.playing()) return;
    const now = performance.now();
    const front = this.frontVideo();
    // Hold the clock while the picture is still loading, so sound and text wait for it.
    if (front && this.activeClip() && front.readyState < 3 && !front.ended && !front.error) {
      this.clockBase = this.time();
      this.clockAt = now;
    }
    let t = this.clockBase + (now - this.clockAt) / 1000;

    if (this.selectionPlay && t >= this.end()) {
      if (this.loopSelection()) {
        t = this.start();
        this.clockBase = t;
        this.clockAt = now;
      } else {
        this.time.set(this.end());
        this.pause();
        return;
      }
    }
    if (t >= this.length()) {
      this.time.set(this.length());
      this.pause();
      return;
    }
    this.time.set(t);
    this.sync();
    this.revealTime(t);
    this.raf = requestAnimationFrame(() => this.tick());
  }

  private frontVideo(): HTMLVideoElement | null {
    const slot = this.frontSlot();
    return (slot === 0 ? this.vidA() : this.vidB())?.nativeElement ?? null;
  }

  private slotVideo(slot: 0 | 1): HTMLVideoElement | null {
    return (slot === 0 ? this.vidA() : this.vidB())?.nativeElement ?? null;
  }

  /** Puts every media element where the clock says it should be. */
  private sync(): void {
    const tl = this.timeline();
    if (!tl) return;
    const t = this.time();
    const playing = this.playing();
    const i = clipIndexAt(tl.clips, t);

    if (i >= 0) {
      const clip = tl.clips[i];
      let front = this.frontSlot();
      if (this.slotClip[front] !== i) {
        const back: 0 | 1 = front === 0 ? 1 : 0;
        if (this.slotClip[back] === i) {
          front = back;
          this.frontSlot.set(back);
        } else {
          this.loadInto(front, i);
        }
      }
      const v = this.slotVideo(front);
      if (v) {
        const local = clip.trimStart + (t - clip.start);
        const drift = Math.abs(v.currentTime - local);
        if (!v.seeking && drift > (playing ? 0.35 : 0.04)) v.currentTime = local;
        v.muted = this.muted();
        if (playing && v.paused) v.play().catch(() => undefined);
        if (!playing && !v.paused) v.pause();
      }

      // The other element waits on the next clip's first frame.
      const back: 0 | 1 = front === 0 ? 1 : 0;
      const bv = this.slotVideo(back);
      if (bv) {
        if (!bv.paused) bv.pause();
        bv.muted = true;
        if (i + 1 < tl.clips.length && this.slotClip[back] !== i + 1) this.loadInto(back, i + 1);
      }
    } else {
      for (const slot of [0, 1] as const) this.slotVideo(slot)?.pause();
    }

    this.syncAudio(tl, t, playing);
  }

  private loadInto(slot: 0 | 1, index: number): void {
    const v = this.slotVideo(slot);
    const clip = this.timeline()?.clips[index];
    if (!v || !clip) return;
    const url = this.mediaUrl(clip.assetId);
    if (v.getAttribute('src') !== url) v.src = url;
    v.currentTime = clip.trimStart;
    this.slotClip[slot] = index;
  }

  private syncAudio(tl: PreviewTimeline, t: number, playing: boolean): void {
    for (const item of tl.items) {
      if (item.kind !== 'audio') continue;
      const soon = t >= item.start - 2 && t < item.end;
      let el = this.audio.get(item.id);
      if (!soon) {
        if (el && !el.paused) el.pause();
        continue;
      }
      if (!el) {
        el = new Audio();
        el.preload = 'auto';
        el.src = this.mediaUrl(item.src);
        this.audio.set(item.id, el);
      }
      const active = t >= item.start;
      const local = item.trimStart + Math.max(0, t - item.start);
      if (!el.seeking && Math.abs(el.currentTime - local) > (playing && active ? 0.35 : 0.05)) {
        try { el.currentTime = local; } catch { /* not seekable until metadata arrives */ }
      }
      el.volume = Math.max(0, Math.min(1, item.volume));
      el.muted = this.muted();
      if (playing && active && el.paused) el.play().catch(() => undefined);
      if ((!playing || !active) && !el.paused) el.pause();
    }
  }

  toggleMute(): void {
    this.muted.update((m) => !m);
    this.sync();
  }
}
