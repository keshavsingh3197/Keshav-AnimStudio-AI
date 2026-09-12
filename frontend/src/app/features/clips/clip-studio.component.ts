import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, finalize, from, map, of } from 'rxjs';

import {
  Clip, ClipAudioBody, ClipFit, ClipOrder, ClipStudio, MAX_CLIP_GAIN, RenderJob,
  SHORTS_MAX_SECONDS, TRANSITIONS, WATERMARK_POSITIONS, WatermarkKind, WatermarkPosition,
  aspectRatioLabel, isTerminal, videoFormat,
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

/**
 * What a one-file upload started from this screen is FOR: the watermark image, the music
 * lane, or one clip's own sound. Carrying the clip id here is what lets the row that
 * started the upload be the row that shows it running.
 */
type SideUploadTarget =
  | { kind: 'logo' }
  | { kind: 'music' }
  | { kind: 'clip'; clipId: string };

/**
 * One clip's sound, as the screen holds it.
 *
 * Kept in a map beside the rows rather than on them, so that reordering, ticking a clip
 * out of the cut and reloading the clip list all leave a clip's sound settings alone -
 * the same reason the junction overrides live in their own map.
 */
interface ClipAudioSetting {
  /** The clip's own audio, 1 being as recorded. */
  volume: number;
  /** A sound of this clip's own. Empty string means none. */
  audioAssetId: string;
  audioVolume: number;
  keepOriginalAudio: boolean;
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

  /**
   * Which single-file upload is in flight, if any: the watermark image, a music file for
   * the timeline, or a sound for one particular clip.
   *
   * None of these are clips, so they do not go through the dropzone or the batch counter
   * above - but they are all chosen on this screen, and sending someone to another tab to
   * fetch one is what made them look impossible to upload.
   */
  readonly sideUpload = signal<SideUploadTarget | null>(null);

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

  // --- per-clip sound, keyed by clip id. Absent means "as recorded", which is why a clip
  // that was never touched contributes nothing to the request.
  readonly clipAudio = signal<Map<string, ClipAudioSetting>>(new Map());
  readonly openSoundClipId = signal<string | null>(null);

  readonly maxGain = MAX_CLIP_GAIN;

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

  // --- what this video IS ---------------------------------------------------

  /** Short / Video / Square, read off the project canvas the clips are conformed to. */
  readonly format = computed(() => {
    const project = this.store.project();
    return project ? videoFormat(project.width, project.height) : 'Video';
  });

  readonly aspect = computed(() => {
    const project = this.store.project();
    return project ? aspectRatioLabel(project.width, project.height) : '';
  });

  readonly formatClass = computed(() => (this.format() === 'Short' ? 'pill ok' : 'pill'));

  /**
   * Whether an upright video has outgrown the Shorts shelf.
   *
   * Worth saying HERE rather than at upload time, because the length is the sum of the
   * clips in the cut and nowhere else knows it. A Short over three minutes still renders
   * perfectly - YouTube just publishes it as an ordinary video, which is a surprise best
   * had before the render rather than after the upload.
   */
  readonly overShortsLimit = computed(() =>
    this.format() !== 'Video' && this.totalSeconds() > SHORTS_MAX_SECONDS);

  readonly shortsMaxSeconds = SHORTS_MAX_SECONDS;

  /**
   * Turns the project upright, or back. Offered here because this is the screen where the
   * shape matters and where the mistake is discovered - it writes the same project fields
   * the Settings tab does, so there is one canvas and two ways to reach it.
   */
  switchShape(): void {
    const project = this.store.project();
    if (!project) return;

    // Swapped rather than set to a fixed pair, so a 720p or 4K project keeps its
    // resolution instead of being quietly downgraded to 1080.
    const width = project.height;
    const height = project.width;

    this.status.run(
      this.api.updateProject(project.id, {
        name: project.name,
        description: project.description ?? undefined,
        width,
        height,
        fps: project.fps,
        distributionIntent: project.distributionIntent,
        acceptShareAlikeObligation: project.acceptShareAlikeObligation,
        backgroundMusicAssetId: project.backgroundMusicAssetId ?? null,
        backgroundMusicVolume: project.backgroundMusicVolume,
      }),
      (updated) => {
        this.store.project.set(updated);
        this.status.notify([
          `This project is now ${videoFormat(updated.width, updated.height)} `
          + `(${updated.width}×${updated.height}). The clips are re-fitted to the new `
          + 'shape on the next build - nothing already uploaded was changed.',
        ]);
      });
  }

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
        // Named where it DOES go: an image or a music file dropped here is almost always
        // the watermark or the soundtrack, each of which has its own box on this screen.
        problems.push(
          `"${file.name}" is not an MP4 video, so it was skipped. A watermark image or a `
          + 'music file goes in through its own box further down this page.');
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

  onPickLogo(event: Event): void {
    this.pickOne(event, { kind: 'logo' });
  }

  onPickMusic(event: Event): void {
    this.pickOne(event, { kind: 'music' });
  }

  /** A sound for one clip, uploaded from that clip's own row. */
  onPickClipSound(event: Event, clipId: string): void {
    this.pickOne(event, { kind: 'clip', clipId });
  }

  /** True while THIS row's upload is the one running, so only it shows a spinner. */
  isUploadingFor(clipId: string): boolean {
    const target = this.sideUpload();
    return target?.kind === 'clip' && target.clipId === clipId;
  }

  private pickOne(event: Event, target: SideUploadTarget): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // Cleared so picking the same file again still fires a change event.
    input.value = '';

    if (file) this.uploadOne(file, target);
  }

  /**
   * Uploads ONE image or audio file and immediately puts it to work.
   *
   * Using it is the point. The file was picked to be this video's watermark, its music, or
   * one clip's voice-over, so leaving it merely present in the library - one more name in
   * a list the user then has to find again - would be doing half the job.
   *
   * The kind is taken from the SERVER's answer, never from the file's name: it sniffs the
   * bytes, so this is the only trustworthy statement about what was actually uploaded.
   */
  private uploadOne(file: File, target: SideUploadTarget): void {
    const projectId = this.store.projectId();
    if (!projectId || this.sideUpload() !== null) return;

    const limit = this.studio()?.maxImageOrAudioUploadBytes ?? 0;
    if (limit > 0 && file.size > limit) {
      this.status.notify([
        `"${file.name}" is ${this.megabytes(file.size)}MB, over the `
        + `${this.megabytes(limit)}MB limit for an image or an audio file.`,
      ]);
      return;
    }

    this.sideUpload.set(target);

    this.status.run(
      // finalize rather than the success path, so a refused upload releases the box too.
      this.api.uploadAsset(projectId, file).pipe(finalize(() => this.sideUpload.set(null))),
      (asset) => {
        this.store.refreshAssets();

        const wanted = target.kind === 'logo' ? 'Image' : 'Audio';
        if (asset.kind !== wanted) {
          this.status.notify([
            `"${asset.name}" is ${asset.kind.toLowerCase()}, not ${wanted.toLowerCase()}. `
            + 'It was added to this project, but not used here.',
          ]);
          return;
        }

        // Reloaded first so the new file is among the candidates before it is selected -
        // a <select> cannot hold a value it has no option for.
        this.reload(false, () => {
          switch (target.kind) {
            case 'logo':
              this.watermarkLogoId.set(asset.id);

              // Said now rather than letting it surface in a finished render.
              if (!asset.hasAlpha) {
                this.status.notify([
                  `"${asset.name}" has no transparency, so it will sit on the video as a `
                  + 'solid rectangle. A PNG with a transparent background looks better.',
                ]);
              }
              break;

            case 'music':
              this.addMusicAssetId.set(asset.id);
              break;

            case 'clip':
              this.setClipSound(target.clipId, asset.id);
              break;
          }
        });
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
    this.saveOrder();
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
    this.saveOrder();
  }

  onRowDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  reverse(): void {
    this.rows.update((rows) => [...rows].reverse());
    this.saveOrder();
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
      this.saveOrder();
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
      this.saveOrder();
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

  /** The server owns the saved order; a refresh deliberately reloads from that one source. */
  private saveOrder(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.api.saveClipOrder(projectId, this.rows().map((row) => row.clip.id)).subscribe({
      error: () => this.status.notify(['Could not save the video order. Try the move again.']),
    });
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

  // --- per-clip sound ----------------------------------------------------------

  /**
   * What this clip sounds like right now - its stored settings, or the defaults.
   *
   * Always returns something, so the template never branches on presence and the sliders
   * always have a number to sit at. Whether a clip was actually TOUCHED is a separate
   * question, answered by isClipSoundCustom, because that is what decides whether the
   * request carries per-clip audio at all.
   */
  clipSound(clipId: string): ClipAudioSetting {
    return this.clipAudio().get(clipId)
      ?? { volume: 1, audioAssetId: '', audioVolume: 1, keepOriginalAudio: false };
  }

  isClipSoundCustom(clipId: string): boolean {
    return this.clipAudio().has(clipId);
  }

  /** Opens one clip's sound panel, closing any other - only one is ever useful at a time. */
  toggleSoundEditor(clipId: string): void {
    this.openSoundClipId.update((open) => (open === clipId ? null : clipId));
  }

  setClipVolume(clipId: string, value: number): void {
    this.updateClipSound(clipId, (current) => ({
      ...current,
      volume: Math.min(Math.max(value, 0), MAX_CLIP_GAIN),
    }));
  }

  /** The sound file itself. An empty id puts the clip back on its own audio alone. */
  setClipSound(clipId: string, assetId: string): void {
    this.updateClipSound(clipId, (current) => ({ ...current, audioAssetId: assetId }));
  }

  setClipSoundVolume(clipId: string, value: number): void {
    this.updateClipSound(clipId, (current) => ({
      ...current,
      audioVolume: Math.min(Math.max(value, 0), MAX_CLIP_GAIN),
    }));
  }

  setClipKeepOriginal(clipId: string, keep: boolean): void {
    this.updateClipSound(clipId, (current) => ({ ...current, keepOriginalAudio: keep }));
  }

  /** Drops the entry entirely, so the clip goes back to playing exactly as recorded. */
  resetClipSound(clipId: string): void {
    this.clipAudio.update((map) => {
      if (!map.has(clipId)) return map;
      const next = new Map(map);
      next.delete(clipId);
      return next;
    });
  }

  /** The chosen sound's name, for the row's summary. */
  clipSoundName(clipId: string): string | null {
    const id = this.clipSound(clipId).audioAssetId;
    if (!id) return null;

    return this.studio()?.musicCandidates.find((a) => a.id === id)?.name ?? 'Unknown file';
  }

  /**
   * One line saying what this clip will sound like, shown on the row so the state is
   * legible without opening anything. Null when there is nothing worth saying.
   */
  clipSoundSummary(clipId: string): string | null {
    if (!this.isClipSoundCustom(clipId)) return null;

    const sound = this.clipSound(clipId);
    const parts: string[] = [];
    const name = this.clipSoundName(clipId);

    if (name) {
      parts.push(sound.keepOriginalAudio ? `+ ${name}` : name);
    }

    if (!name || sound.keepOriginalAudio) {
      parts.push(sound.volume === 0
        ? 'own sound off'
        : `own sound ${Math.round(sound.volume * 100)}%`);
    }

    return parts.join(' · ');
  }

  private updateClipSound(
    clipId: string, change: (current: ClipAudioSetting) => ClipAudioSetting): void {
    const updated = change(this.clipSound(clipId));

    this.clipAudio.update((map) => {
      const next = new Map(map);

      // An entry that says nothing is removed rather than stored, so "put it back how it
      // was" and "never touched" end up as the same state instead of two that look alike.
      if (updated.volume === 1 && !updated.audioAssetId) {
        next.delete(clipId);
      } else {
        next.set(clipId, updated);
      }

      return next;
    });
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
        // All or nothing, and in the cut's own order: the server reads this list by
        // position, so a partial one would give a clip the sound of a different clip. Sent
        // only when at least one clip was actually touched.
        clipAudio: this.clipAudioPayload(),
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

  /**
   * The per-clip sound list, in the order of the cut, or null when no clip was touched.
   *
   * A sound whose file has since been deleted is sent as no file rather than as a dead id:
   * the server would refuse the whole build over it, and losing one voice-over is not a
   * reason to refuse to make the video.
   */
  private clipAudioPayload(): ClipAudioBody[] | null {
    const clips = this.included();
    if (!clips.some((r) => this.isClipSoundCustom(r.clip.id))) return null;

    const available = new Set(this.studio()?.musicCandidates.map((a) => a.id) ?? []);

    return clips.map((row) => {
      const sound = this.clipSound(row.clip.id);
      const assetId = sound.audioAssetId && available.has(sound.audioAssetId)
        ? sound.audioAssetId
        : null;

      return {
        volume: sound.volume,
        audioAssetId: assetId,
        audioVolume: sound.audioVolume,
        keepOriginalAudio: sound.keepOriginalAudio,
      };
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
   *
   * `then` runs once the new payload is in hand, for the caller that has to pick something
   * out of a list this very request is what supplies.
   */
  private reload(firstLoad: boolean, then?: () => void): void {
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

      then?.();
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
