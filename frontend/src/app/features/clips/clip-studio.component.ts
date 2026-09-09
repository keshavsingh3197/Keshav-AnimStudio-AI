import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, from, map, of } from 'rxjs';

import {
  Clip, ClipFit, ClipOrder, ClipStudio, RenderJob, TRANSITIONS,
  WATERMARK_POSITIONS, WatermarkKind, WatermarkPosition, isTerminal,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** One clip in the running order. The array position is the order; `included` is the cut. */
interface ClipRow {
  clip: Clip;
  included: boolean;
}

/** A transition customised for one specific gap, overriding the timeline's default. */
interface JunctionSetting {
  transition: string;
  seconds: number;
}

/** One gap between two adjacent clips IN THE CUT, and what plays across it right now. */
interface JunctionView {
  key: string;
  left: Clip;
  right: Clip;
  transition: string;
  seconds: number;
}

/** One music (or other audio) clip placed at its own point on the timeline. */
interface MusicTrackRow {
  key: string;
  assetId: string;
  startSeconds: number;
  volume: number;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
}

/**
 * Joins finished video clips into one downloadable file.
 *
 * Two decisions shape this whole screen.
 *
 * First, there is ONE list, not a library and a separate timeline. The list's order is the
 * running order and each row's checkbox decides whether it is in the cut, so "choose some
 * clips" and "put them in order" are the same gesture on the same rows - there is no
 * second copy of the list that can disagree with the first.
 *
 * Second, the order can be TYPED as well as dragged. The order usually already exists
 * somewhere - a script, a shot list, a message - and reproducing twenty positions by drag
 * is slow and easy to get wrong. Pasting it is checked against the clips, reported line by
 * line, and applied in one step.
 */
@Component({
  selector: 'app-clip-studio',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './clip-studio.component.html',
})
export class ClipStudioComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly transitions = TRANSITIONS;
  readonly positions = WATERMARK_POSITIONS;

  /** Held as a field, not an array literal in the template, so it is not rebuilt per pass. */
  readonly watermarkKinds: readonly { kind: WatermarkKind; label: string }[] = [
    { kind: 'None', label: 'No watermark' },
    { kind: 'Text', label: 'Text or site address' },
    { kind: 'Logo', label: 'Logo image' },
  ];

  readonly studio = signal<ClipStudio | null>(null);
  readonly rows = signal<ClipRow[]>([]);

  // --- upload
  readonly dropActive = signal(false);
  readonly uploadTotal = signal(0);
  readonly uploadDone = signal(0);
  readonly uploading = computed(() => this.uploadTotal() > 0);

  // --- running order from text
  readonly orderText = signal('');
  readonly orderResult = signal<ClipOrder | null>(null);

  // --- watermark
  readonly watermarkKind = signal<WatermarkKind>('None');
  readonly watermarkText = signal('');
  readonly watermarkLogoId = signal('');
  readonly watermarkPosition = signal<WatermarkPosition>('TopRight');
  readonly watermarkOpacity = signal(0.8);
  readonly watermarkHeight = signal(5.5);
  readonly watermarkMargin = signal(4);
  readonly watermarkColor = signal('#ffffff');
  readonly watermarkBackplate = signal(0.3);

  // --- output
  readonly fit = signal<ClipFit>('Contain');
  readonly transition = signal<string>('None');
  readonly transitionSeconds = signal(0.5);
  readonly musicAssetId = signal('');
  readonly musicVolume = signal(0.18);
  readonly muteClipAudio = signal(false);

  // --- timeline scale, in pixels per second of finished video
  readonly pxPerSecond = signal(44);

  // --- per-junction transition overrides, keyed by "leftClipId>rightClipId" so a
  // customised gap survives reordering and ticking as long as the same two clips are
  // still next to each other.
  readonly junctionOverrides = signal<Map<string, JunctionSetting>>(new Map());
  readonly openJunctionKey = signal<string | null>(null);

  // --- the in-browser transition preview: a style demonstration, not a real render.
  readonly previewJunction = signal<{
    key: string; leftClip: Clip; rightClip: Clip; transition: string; seconds: number;
  } | null>(null);
  readonly previewPlaying = signal(false);
  private previewVideoA: HTMLVideoElement | null = null;
  private previewVideoB: HTMLVideoElement | null = null;

  // --- music track lane: any number of clips, each starting at its own point in time
  readonly musicTracks = signal<MusicTrackRow[]>([]);
  readonly addMusicAssetId = signal('');
  private musicDrag: { key: string; startClientX: number; startSeconds: number } | null = null;
  private musicTrim:
    { key: string; edge: 'start' | 'end'; startClientX: number; startValue: number } | null = null;

  // --- the job
  readonly job = signal<RenderJob | null>(null);
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  /** Reorder state. Held here so the row being dragged over can be highlighted. */
  readonly dragIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  readonly included = computed(() => this.rows().filter((r) => r.included));

  /**
   * The same rows, but keeping each one's position in the FULL list. The timeline only
   * draws the clips that are in the cut, but reordering has to move the real row - the one
   * the checklist below also shows - or the two views would disagree about the order.
   */
  readonly includedWithIndex = computed(() =>
    this.rows()
      .map((row, index) => ({ row, index }))
      .filter((entry) => entry.row.included));

  /**
   * One entry per gap between clips IN THE CUT, in order. A gap that was never customised
   * reads the timeline's default transition; the moment it is (see setJunctionTransition),
   * it keeps its own setting even while clips are reordered or ticked in and out around it.
   */
  readonly junctions = computed<JunctionView[]>(() => {
    const clips = this.included().map((r) => r.clip);
    const overrides = this.junctionOverrides();
    const list: JunctionView[] = [];

    for (let i = 0; i < clips.length - 1; i++) {
      const left = clips[i];
      const right = clips[i + 1];
      const key = this.junctionKey(left.id, right.id);
      const override = overrides.get(key);

      list.push({
        key,
        left,
        right,
        transition: override?.transition ?? this.transition(),
        seconds: override?.seconds ?? this.transitionSeconds(),
      });
    }

    return list;
  });

  readonly totalSeconds = computed(() => {
    const clips = this.included();
    const measured = clips.reduce((sum, r) => sum + (r.clip.durationSeconds ?? 0), 0);

    // Every crossfade shortens the timeline by its own length, so the joins have to be
    // subtracted or the estimate reads long by several seconds on a twenty-clip cut. Each
    // junction now carries its own length, so a stitch with three customised gaps and
    // seventeen default ones still adds up correctly.
    const overlap = this.junctions()
      .reduce((sum, j) => sum + (j.transition === 'None' ? 0 : j.seconds), 0);

    return Math.max(measured - overlap, 0);
  });

  /** The timeline's total width, wide enough for the video AND whatever music overhangs it. */
  readonly timelineSeconds = computed(() => {
    const musicEnd = this.musicTracks()
      .reduce((max, t) => Math.max(max, t.startSeconds + this.musicTrackDurationSeconds(t)), 0);

    return Math.max(this.totalSeconds(), musicEnd, 1);
  });

  readonly running = computed(() => {
    const current = this.job();
    return current !== null && !isTerminal(current.status);
  });

  /** Why the build button is disabled, phrased as something the user can act on. */
  readonly blockedReason = computed(() => {
    const studio = this.studio();
    if (!studio) return null;

    if (!studio.rendererAvailable) {
      return studio.unavailableReason
        ?? 'Video rendering is not configured on this server.';
    }

    if (this.rows().length === 0) return 'Add some video clips first.';
    if (this.included().length === 0) return 'Tick the clips you want in the video.';

    if (this.included().length > studio.maxClips)
      return `At most ${studio.maxClips} clips can go into one video.`;

    if (this.watermarkKind() === 'Text' && this.watermarkText().trim().length === 0)
      return 'Type the watermark text, or set the watermark to None.';

    if (this.watermarkKind() === 'Logo' && !this.watermarkLogoId())
      return 'Choose the watermark image, or set the watermark to None.';

    if (this.musicTracks().length > studio.maxMusicTracks)
      return `At most ${studio.maxMusicTracks} music clips can go on the timeline.`;

    if (this.muteClipAudio() && !this.musicAssetId() && this.musicTracks().length === 0)
      return 'Muting the clips with no music would produce a silent video.';

    return null;
  });

  /**
   * Geometry for the watermark preview, in pixels against a fixed preview height.
   *
   * The preview matters more than it looks: the settings are FRACTIONS, and a fraction of
   * a canvas is not something anyone can picture. Deriving the preview from the same
   * numbers the renderer uses means what is shown here is what lands on the video.
   */
  readonly preview = computed(() => {
    const height = 190;
    const project = this.store.project();
    const aspect = project ? project.width / project.height : 16 / 9;

    const position = this.watermarkPosition();
    const inset = (this.watermarkMargin() / 100) * height;

    return {
      width: Math.round(height * aspect),
      height,
      fontSize: (this.watermarkHeight() / 100) * height,
      inset,
      top: position.startsWith('Top'),
      align: position.endsWith('Left') ? 'flex-start'
        : position.endsWith('Right') ? 'flex-end'
          : 'center',
    };
  });

  readonly logoUrl = computed(() => {
    const id = this.watermarkLogoId();
    return id ? this.api.assetUrl(id) : null;
  });

  constructor() {
    this.reload(true);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // --- getting clips in ----------------------------------------------------

  onDragOver(event: DragEvent): void {
    // Both handlers must preventDefault or the browser navigates to the dropped file
    // instead of handing it over.
    event.preventDefault();
    this.dropActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dropActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dropActive.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.upload(Array.from(files));
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.upload(Array.from(input.files));

    // Cleared so picking the same file again still fires a change event.
    input.value = '';
  }

  /**
   * Uploads a batch one file at a time.
   *
   * Sequential rather than parallel on purpose: a dropped folder can be twenty clips of
   * several hundred megabytes, and firing those at once saturates the connection, makes
   * every individual upload slow, and gives no usable progress. One at a time is both
   * faster overall and countable.
   *
   * A failure does not stop the batch. One clip over the size limit should not abandon the
   * other nineteen, so failures are collected and reported at the end.
   */
  private upload(files: File[]): void {
    const projectId = this.store.projectId();
    const studio = this.studio();
    if (!projectId || this.uploading()) return;

    const limit = studio?.maxClipUploadBytes ?? 0;
    const problems: string[] = [];
    const queue: File[] = [];

    for (const file of files) {
      if (!this.looksLikeVideo(file)) {
        problems.push(`"${file.name}" is not an MP4 video, so it was skipped.`);
        continue;
      }

      if (limit > 0 && file.size > limit) {
        problems.push(
          `"${file.name}" is ${this.megabytes(file.size)}MB, over the `
          + `${this.megabytes(limit)}MB limit, so it was skipped.`);
        continue;
      }

      queue.push(file);
    }

    if (queue.length === 0) {
      this.status.notify(problems);
      return;
    }

    this.uploadTotal.set(queue.length);
    this.uploadDone.set(0);

    from(queue)
      .pipe(
        concatMap((file) =>
          this.api.uploadAsset(projectId, file).pipe(
            map(() => null),
            catchError(() => of(`"${file.name}" could not be uploaded.`)))),
      )
      .subscribe({
        next: (failure) => {
          this.uploadDone.update((done) => done + 1);
          if (failure) problems.push(failure);
        },
        complete: () => {
          this.uploadTotal.set(0);
          this.uploadDone.set(0);
          this.status.notify(problems);
          this.reload(false);
        },
      });
  }

  /**
   * MP4 is the only container the server's upload allowlist admits, so anything else is
   * rejected here rather than after a round trip. The server still checks the bytes - a
   * filename is not evidence of anything.
   */
  private looksLikeVideo(file: File): boolean {
    return file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
  }

  private megabytes(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(0);
  }

  // --- choosing ------------------------------------------------------------

  toggle(index: number): void {
    this.rows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, included: !row.included } : row)));
  }

  selectAll(included: boolean): void {
    this.rows.update((rows) => rows.map((row) => ({ ...row, included })));
  }

  /**
   * Two steps, like every other delete in the app. This one deletes several files at once
   * and cannot be undone, and new uploads arrive ticked - so the single most likely misclick
   * is "delete everything I just imported".
   */
  readonly confirmingDelete = signal(false);

  removeFromLibrary(): void {
    const projectId = this.store.projectId();
    const ids = this.included().map((r) => r.clip.id);

    if (!projectId || ids.length === 0) {
      this.confirmingDelete.set(false);
      return;
    }

    this.status.run(this.api.deleteClips(projectId, ids), () => {
      this.confirmingDelete.set(false);
      this.store.refreshAssets();
      this.reload(false);
    });
  }

  // --- ordering ------------------------------------------------------------

  move(index: number, delta: number): void {
    const target = index + delta;
    this.rows.update((rows) => {
      if (target < 0 || target >= rows.length) return rows;

      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  onRowDragStart(index: number): void {
    this.dragIndex.set(index);
  }

  onRowDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  onRowDrop(index: number, event: DragEvent): void {
    event.preventDefault();

    const from = this.dragIndex();
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);

    if (from === null || from === index) return;

    this.rows.update((rows) => {
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  onRowDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  reverse(): void {
    this.rows.update((rows) => [...rows].reverse());
  }

  /**
   * Filename order, counted rather than spelled - clip2 before clip10.
   *
   * Asked of the server rather than sorted here, so there is exactly one definition of
   * "filename order" in the system. A second implementation in TypeScript would drift, and
   * the symptom would be a video whose order disagrees with the order on screen.
   */
  sortByName(): void {
    const projectId = this.store.projectId();
    if (!projectId || this.rows().length === 0) return;

    const ids = this.rows().map((r) => r.clip.id);

    this.status.run(this.api.clipOrder(projectId, ids, ''), (order) => {
      this.applyOrder(order.assetIds);
      this.orderResult.set(null);
    });
  }

  /** Reads the pasted running order and applies it, keeping the diagnostics on screen. */
  applyTextOrder(): void {
    const projectId = this.store.projectId();
    const text = this.orderText().trim();
    if (!projectId || text.length === 0 || this.rows().length === 0) return;

    const ids = this.rows().map((r) => r.clip.id);

    this.status.run(this.api.clipOrder(projectId, ids, text), (order) => {
      this.applyOrder(order.assetIds);
      this.orderResult.set(order);
    });
  }

  /**
   * Drops the clips the pasted list never named out of the cut - without deleting them, so
   * the decision is one click to undo.
   */
  keepOnlyNamed(): void {
    const order = this.orderResult();
    if (!order) return;

    const appended = new Set(order.appendedAssetIds);
    this.rows.update((rows) =>
      rows.map((row) => ({ ...row, included: !appended.has(row.clip.id) })));
  }

  private applyOrder(assetIds: string[]): void {
    const position = new Map(assetIds.map((id, index) => [id, index]));

    this.rows.update((rows) =>
      [...rows].sort((a, b) =>
        (position.get(a.clip.id) ?? Number.MAX_SAFE_INTEGER)
        - (position.get(b.clip.id) ?? Number.MAX_SAFE_INTEGER)));
  }

  /**
   * This row's place in the finished video, counting only ticked rows - so the numbers
   * still read 1, 2, 3 when a clip in the middle has been left out of the cut.
   */
  cutPosition(index: number): number {
    return this.rows().slice(0, index + 1).filter((r) => r.included).length;
  }

  matchClass(match: string): string {
    if (match === 'Matched') return 'pill ok';
    if (match === 'Unmatched') return 'pill err';
    return 'pill warn';
  }

  clipName(assetId: string | undefined): string {
    if (!assetId) return '';
    return this.rows().find((r) => r.clip.id === assetId)?.clip.name ?? '';
  }

  /** Direct URL to a clip's or a music file's bytes, for a <video> or <audio> element. */
  assetUrl(assetId: string): string {
    return this.api.assetUrl(assetId);
  }

  // --- timeline geometry -----------------------------------------------------

  secondsToPx(seconds: number): number {
    return seconds * this.pxPerSecond();
  }

  blockWidthPx(clip: Clip): number {
    return Math.max(this.secondsToPx(clip.durationSeconds ?? 3), 34);
  }

  zoom(delta: number): void {
    this.pxPerSecond.update((px) => Math.min(160, Math.max(12, px + delta)));
  }

  /** Evenly spaced marks for the ruler, roughly every 5 seconds of screen space. */
  rulerTicks(): number[] {
    const total = this.timelineSeconds();
    const step = this.pxPerSecond() < 24 ? 10 : this.pxPerSecond() < 60 ? 5 : 2;
    const ticks: number[] = [];
    for (let t = 0; t <= total; t += step) ticks.push(t);
    return ticks;
  }

  // --- per-junction transitions ----------------------------------------------

  private junctionKey(leftId: string, rightId: string): string {
    return `${leftId}>${rightId}`;
  }

  toggleJunctionEditor(key: string): void {
    this.openJunctionKey.set(this.openJunctionKey() === key ? null : key);
  }

  setJunctionTransition(junction: JunctionView, value: string): void {
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      next.set(junction.key, { transition: value, seconds: junction.seconds });
      return next;
    });
  }

  setJunctionSeconds(junction: JunctionView, value: number): void {
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      next.set(junction.key, { transition: junction.transition, seconds: value });
      return next;
    });
  }

  /** Drops the override, so this gap goes back to following the timeline's default. */
  resetJunction(key: string): void {
    this.junctionOverrides.update((map) => {
      if (!map.has(key)) return map;
      const next = new Map(map);
      next.delete(key);
      return next;
    });
  }

  isJunctionCustom(key: string): boolean {
    return this.junctionOverrides().has(key);
  }

  // --- the in-browser transition preview --------------------------------------

  openPreview(junction: JunctionView): void {
    this.previewPlaying.set(false);
    this.previewVideoA = null;
    this.previewVideoB = null;
    this.previewJunction.set({
      key: junction.key,
      leftClip: junction.left,
      rightClip: junction.right,
      transition: junction.transition,
      seconds: junction.seconds,
    });
  }

  closePreview(): void {
    this.previewPlaying.set(false);
    this.previewJunction.set(null);
    this.previewVideoA = null;
    this.previewVideoB = null;
  }

  /** Seeks the tail of the outgoing clip and the head of the incoming one, once loaded. */
  onPreviewVideoReady(event: Event, which: 'A' | 'B'): void {
    const video = event.target as HTMLVideoElement;

    if (which === 'A') {
      this.previewVideoA = video;
      video.currentTime = Math.max(video.duration - 1.4, 0);
    } else {
      this.previewVideoB = video;
      video.currentTime = 0;
    }
  }

  /** (Re)starts the preview animation. A tick between stop and start, or CSS will not replay it. */
  replayPreview(): void {
    this.previewPlaying.set(false);
    this.previewVideoA?.pause();
    this.previewVideoB?.pause();

    if (this.previewVideoA) this.previewVideoA.currentTime = Math.max(this.previewVideoA.duration - 1.4, 0);
    if (this.previewVideoB) this.previewVideoB.currentTime = 0;

    setTimeout(() => {
      this.previewPlaying.set(true);
      this.previewVideoA?.play().catch(() => undefined);
      this.previewVideoB?.play().catch(() => undefined);
    });
  }

  onPreviewAnimationEnd(): void {
    this.previewPlaying.set(false);
    this.previewVideoA?.pause();
    this.previewVideoB?.pause();
  }

  /** Which CSS animation demonstrates this transition. The real motion is rendered server-side. */
  previewClass(): string {
    const pj = this.previewJunction();
    if (!pj || pj.transition === 'None') return 'pv-cut';

    switch (pj.transition) {
      case 'Fade':
      case 'Dissolve': return 'pv-fade';
      case 'WipeLeft': return 'pv-wipe-left';
      case 'WipeRight': return 'pv-wipe-right';
      case 'SlideLeft': return 'pv-slide-left';
      case 'SlideRight': return 'pv-slide-right';
      case 'CircleOpen': return 'pv-circle-open';
      case 'CircleClose': return 'pv-circle-close';
      default: return 'pv-fade';
    }
  }

  // --- music track lane --------------------------------------------------------

  addMusicTrack(): void {
    const assetId = this.addMusicAssetId();
    if (!assetId) return;

    const key = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    this.musicTracks.update((tracks) => [
      ...tracks,
      { key, assetId, startSeconds: 0, volume: 0.5, trimStartSeconds: null, trimEndSeconds: null },
    ]);
    this.addMusicAssetId.set('');
  }

  removeMusicTrack(key: string): void {
    this.musicTracks.update((tracks) => tracks.filter((t) => t.key !== key));
  }

  musicTrackAsset(track: MusicTrackRow) {
    return this.studio()?.musicCandidates.find((a) => a.id === track.assetId);
  }

  musicTrackName(track: MusicTrackRow): string {
    return this.musicTrackAsset(track)?.name ?? 'Unknown file';
  }

  musicTrackDurationSeconds(track: MusicTrackRow): number {
    const total = this.musicTrackAsset(track)?.durationSeconds ?? 6;
    const start = track.trimStartSeconds ?? 0;
    const end = track.trimEndSeconds ?? total;
    return Math.max(end - start, 0.25);
  }

  setMusicVolume(key: string, value: number): void {
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, volume: value } : t)));
  }

  onMusicBlockPointerDown(track: MusicTrackRow, event: PointerEvent): void {
    event.preventDefault();
    this.musicDrag = { key: track.key, startClientX: event.clientX, startSeconds: track.startSeconds };
  }

  onMusicTrimPointerDown(track: MusicTrackRow, edge: 'start' | 'end', event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const total = this.musicTrackAsset(track)?.durationSeconds ?? this.musicTrackDurationSeconds(track);
    const startValue = edge === 'start' ? (track.trimStartSeconds ?? 0) : (track.trimEndSeconds ?? total);

    this.musicTrim = { key: track.key, edge, startClientX: event.clientX, startValue };
  }

  /** Bound to (document:pointermove); only does anything while a block or handle is held. */
  onTimelinePointerMove(event: PointerEvent): void {
    const perSecond = this.pxPerSecond();

    if (this.musicDrag) {
      const drag = this.musicDrag;
      const next = Math.max(0, drag.startSeconds + (event.clientX - drag.startClientX) / perSecond);
      this.musicTracks.update((tracks) =>
        tracks.map((t) => (t.key === drag.key ? { ...t, startSeconds: next } : t)));
      return;
    }

    if (this.musicTrim) {
      const trim = this.musicTrim;
      const next = Math.max(0, trim.startValue + (event.clientX - trim.startClientX) / perSecond);

      this.musicTracks.update((tracks) => tracks.map((t) => {
        if (t.key !== trim.key) return t;

        if (trim.edge === 'start') {
          const end = t.trimEndSeconds;
          return { ...t, trimStartSeconds: end != null ? Math.min(next, Math.max(end - 0.25, 0)) : next };
        }

        const start = t.trimStartSeconds ?? 0;
        return { ...t, trimEndSeconds: Math.max(next, start + 0.25) };
      }));
    }
  }

  /** Bound to (document:pointerup) and (document:pointercancel). */
  onTimelinePointerUp(): void {
    this.musicDrag = null;
    this.musicTrim = null;
  }

  // --- building ------------------------------------------------------------

  build(): void {
    const projectId = this.store.projectId();
    if (!projectId || this.blockedReason() !== null) return;

    this.status.run(
      this.api.mergeClips(projectId, {
        assetIds: this.included().map((r) => r.clip.id),
        fit: this.fit(),
        transition: this.transition(),
        transitionSeconds: this.transition() === 'None' ? 0 : this.transitionSeconds(),
        // Always exactly one entry per gap, so it either names every junction or is empty -
        // never a partial list the server would have to reject.
        junctions: this.junctions().map((j) => ({
          transition: j.transition,
          transitionSeconds: j.transition === 'None' ? 0 : j.seconds,
        })),
        muteClipAudio: this.muteClipAudio(),
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: this.musicVolume(),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: t.volume,
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        watermark: {
          kind: this.watermarkKind(),
          text: this.watermarkText().trim() || null,
          logoAssetId: this.watermarkLogoId() || null,
          position: this.watermarkPosition(),
          opacity: this.watermarkOpacity(),
          // Sent as fractions; the sliders are in percent because a percentage is a thing
          // people can reason about and 0.055 is not.
          heightFraction: this.watermarkHeight() / 100,
          marginFraction: this.watermarkMargin() / 100,
          colorHex: this.watermarkColor(),
          backplateOpacity: this.watermarkBackplate(),
        },
      }),
      (job) => {
        this.job.set(job);
        this.startPolling(job.jobId);
      });
  }

  cancel(): void {
    const current = this.job();
    if (current) this.status.run(this.api.cancelJob(current.jobId));
  }

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  statusClass(jobStatus: string): string {
    if (jobStatus === 'Completed' || jobStatus === 'CompletedWithWarnings') return 'pill ok';
    if (jobStatus === 'Failed') return 'pill err';
    if (jobStatus === 'Cancelled') return 'pill warn';
    return 'pill';
  }

  // --- loading -------------------------------------------------------------

  /**
   * Reloads the clip list, keeping the running order and the ticks the user has already
   * set. Rebuilding the rows from scratch after every upload would throw away the ordering
   * work - which is the whole point of the screen - so existing rows keep their place and
   * only genuinely new clips are appended.
   */
  private reload(firstLoad: boolean): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.clipStudio(projectId), (studio) => {
      this.studio.set(studio);

      if (firstLoad && studio.defaultWatermarkText) {
        this.watermarkText.set(studio.defaultWatermarkText);
        this.watermarkKind.set('Text');
      }

      const previous = new Map(this.rows().map((row) => [row.clip.id, row]));
      const byId = new Map(studio.clips.map((clip) => [clip.id, clip]));

      const kept = this.rows()
        .filter((row) => byId.has(row.clip.id))
        .map((row) => ({ clip: byId.get(row.clip.id)!, included: row.included }));

      // New clips arrive ticked: a clip that was just dropped onto the page is almost
      // certainly wanted, and un-ticking is one click.
      const added = studio.clips
        .filter((clip) => !previous.has(clip.id))
        .map((clip) => ({ clip, included: true }));

      this.rows.set([...kept, ...added]);

      // Reattach to a stitch that is still running, so leaving the page does not lose it.
      if (firstLoad) this.reattach(projectId);
    });
  }

  private reattach(projectId: string): void {
    this.api.listJobs(projectId).subscribe({
      next: (jobs) => {
        const active = jobs.find((j) => j.kind === 'ClipMerge' && !isTerminal(j.status))
          ?? jobs.find((j) => j.kind === 'ClipMerge');

        if (!active) return;

        this.job.set(active);
        if (!isTerminal(active.status)) this.startPolling(active.jobId);
      },
      // Not knowing whether an old job exists is not worth a banner over the screen.
      error: () => undefined,
    });
  }

  private startPolling(jobId: string): void {
    this.stopPolling();

    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);

          if (isTerminal(job.status)) {
            this.stopPolling();
            this.status.notify(job.warnings.map((w) => this.explainWarning(w)));
          }
        },
        error: () => this.stopPolling(),
      });
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  /** Renderer warning codes are for logs; this is what a person should read instead. */
  private explainWarning(code: string): string {
    switch (code) {
      case 'TRANSITION_SHORTENED':
        return 'Some transitions were shortened to fit the clips they join.';
      case 'BLUR_BACKDROP_UNAVAILABLE':
        return 'This server\'s renderer cannot blur, so letterboxed clips got black bars.';
      case 'WATERMARK_UNAVAILABLE':
        return 'This server has no font available, so the text watermark was left off. '
          + 'A logo image would work.';
      default:
        return code;
    }
  }
}
