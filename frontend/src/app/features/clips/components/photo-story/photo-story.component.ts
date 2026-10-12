import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ClipFit, ExportQuality, TRANSITIONS } from '../../../../core/models/api.models';
import { PhotoStorySlide, StudioStateService } from '../../services/studio-state.service';
import {
  CinematicImage, DEFAULT_CINEMATIC, IMAGE_LOOKS, IMAGE_MOTIONS, IMAGE_MOTION_MAX, IMAGE_MOTION_MIN,
  autoMotion, cameraTransform, cinemaBarPercent, lookFilter,
} from '../../services/cinematic-image';

interface StoryFormat { id: string; label: string; width: number; height: number }

const FORMATS: readonly StoryFormat[] = [
  { id: '16:9', label: '16:9 YouTube', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16 Shorts / Reels', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 Square', width: 1080, height: 1080 },
];

/** A slide in the builder; the id lets the same picture appear twice. */
interface Slide extends PhotoStorySlide { id: string }

let nextSlideId = 0;

/**
 * Photo Story: a video made from stills. Every picture becomes a shot with its own camera
 * move, grade and lens finish; the preview runs the same motion formulas the export does.
 */
@Component({
  selector: 'app-photo-story',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './photo-story.component.html',
  styleUrl: './photo-story.component.css',
})
export class PhotoStoryComponent implements OnDestroy {
  readonly state = inject(StudioStateService);

  readonly motions = IMAGE_MOTIONS;
  readonly looks = IMAGE_LOOKS;
  readonly formats = FORMATS;
  readonly transitions = TRANSITIONS;
  readonly minIntensity = IMAGE_MOTION_MIN;
  readonly maxIntensity = IMAGE_MOTION_MAX;

  readonly slides = signal<Slide[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.slides().find((s) => s.id === this.selectedId()) ?? null);

  readonly name = signal('Photo story');
  readonly formatId = signal('16:9');
  readonly format = computed(() => FORMATS.find((f) => f.id === this.formatId()) ?? FORMATS[0]);
  readonly fit = signal<ClipFit>('Cover');
  readonly quality = signal<ExportQuality>('High');
  readonly transitionSeconds = signal(1);
  readonly includeMusic = signal(true);
  readonly watermark = signal(false);
  readonly outro = signal(false);

  readonly totalSeconds = computed(() => this.slides().reduce((sum, s) => sum + s.seconds, 0));
  readonly barPercent = computed(() => cinemaBarPercent(this.format().width, this.format().height));

  /** Preview: which slide is on screen and how far through it. */
  readonly playing = signal(false);
  readonly previewIndex = signal(0);
  readonly previewTransform = signal('none');
  readonly previewProgress = signal(0);
  private raf = 0;
  private playStart = 0;

  @ViewChild('frame') frame?: ElementRef<HTMLDivElement>;

  readonly previewSlide = computed(() => {
    const list = this.slides();
    if (this.playing()) return list[this.previewIndex()] ?? null;
    return this.selected() ?? list[0] ?? null;
  });

  constructor() {
    // Start from the pictures already on the timeline, else every picture in the project.
    const onTimeline = this.state.timelineItems()
      .filter((it) => it.type === 'image')
      .sort((a, b) => a.startTime - b.startTime)
      .map((it) => ({ id: it.src, name: it.name ?? 'Picture', seconds: it.duration }));
    const start = onTimeline.length > 0
      ? onTimeline
      : this.state.frameImageCandidates().map((c) => ({ id: c.id, name: c.name, seconds: 5 }));
    // A picture that already moves in the edit opens with that move, so both stay one shot.
    this.slides.set(start.slice(0, 40).map((c, k) => this.newSlide(c.id, c.name, c.seconds, k, this.state.shotOfPicture(c.id))));
    this.selectedId.set(this.slides()[0]?.id ?? null);
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.state.photoStoryOpen.set(false);
  }

  // --- slides ---

  private newSlide(assetId: string, name: string, seconds: number, index: number, shot: CinematicImage | null = null): Slide {
    return {
      id: `s${++nextSlideId}`,
      assetId, name,
      seconds: Math.min(60, Math.max(1, Math.round((seconds || 5) * 10) / 10)),
      cinematic: shot ? { ...shot } : { ...DEFAULT_CINEMATIC, motion: autoMotion(index) },
      transition: 'Fade',
    };
  }

  isInStory(assetId: string): boolean {
    return this.slides().some((s) => s.assetId === assetId);
  }

  addPicture(assetId: string, name: string): void {
    const slide = this.newSlide(assetId, name, 5, this.slides().length);
    this.slides.update((list) => [...list, slide]);
    this.selectedId.set(slide.id);
  }

  remove(id: string): void {
    const list = this.slides();
    const at = list.findIndex((s) => s.id === id);
    this.slides.set(list.filter((s) => s.id !== id));
    if (this.selectedId() === id) this.selectedId.set(this.slides()[Math.min(at, this.slides().length - 1)]?.id ?? null);
  }

  move(id: string, by: -1 | 1): void {
    const list = [...this.slides()];
    const at = list.findIndex((s) => s.id === id);
    const to = at + by;
    if (at < 0 || to < 0 || to >= list.length) return;
    [list[at], list[to]] = [list[to], list[at]];
    this.slides.set(list);
  }

  select(id: string): void {
    this.stop();
    this.selectedId.set(id);
    this.playStart = performance.now();
  }

  update(id: string, patch: Partial<Pick<Slide, 'seconds' | 'transition'>>): void {
    this.slides.update((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  updateLook(id: string, patch: Partial<CinematicImage>): void {
    this.slides.update((list) => list.map((s) => (s.id === id ? { ...s, cinematic: { ...s.cinematic, ...patch } } : s)));
    this.playStart = performance.now();
  }

  /** Copies the selected slide's look, finish and timing (not its move or focus) to every slide. */
  applyToAll(): void {
    const from = this.selected();
    if (!from) return;
    const { look, vignette, grain, cinemaBars, intensity, easing } = from.cinematic;
    this.slides.update((list) => list.map((s) => ({
      ...s, seconds: from.seconds, transition: from.transition,
      cinematic: { ...s.cinematic, look, vignette, grain, cinemaBars, intensity, easing },
    })));
  }

  /** A different move on every slide, in an order that never repeats back to back. */
  autoCinematic(): void {
    this.slides.update((list) => list.map((s, k) => ({ ...s, cinematic: { ...s.cinematic, motion: autoMotion(k) } })));
    this.playStart = performance.now();
  }

  /** Click on the preview: that spot becomes where the zoom heads. */
  setFocus(event: MouseEvent): void {
    const slide = this.selected();
    const box = this.frame?.nativeElement.getBoundingClientRect();
    if (!slide || !box || this.playing()) return;
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    this.updateLook(slide.id, { focusX: Math.round(Math.min(100, Math.max(0, x))), focusY: Math.round(Math.min(100, Math.max(0, y))) });
  }

  // --- preview ---

  play(): void {
    if (this.slides().length === 0) return;
    this.previewIndex.set(0);
    this.playing.set(true);
    this.playStart = performance.now();
  }

  stop(): void {
    this.playing.set(false);
  }

  /** One frame of the preview: the camera of whichever slide is showing. */
  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const slide = this.previewSlide();
    if (!slide) return;

    const elapsed = (performance.now() - this.playStart) / 1000;
    if (this.playing() && elapsed >= slide.seconds) {
      const next = this.previewIndex() + 1;
      if (next >= this.slides().length) { this.stop(); return; }
      this.previewIndex.set(next);
      this.playStart = performance.now();
      return;
    }

    // A single slide's preview loops so its move can be judged again and again.
    const t = this.playing() ? elapsed : elapsed % slide.seconds;
    const p = t / slide.seconds;
    this.previewProgress.set(p);
    this.previewTransform.set(cameraTransform(slide.cinematic, p, t));
  };

  filterOf(slide: Slide | null): string {
    return slide ? lookFilter(slide.cinematic.look) : 'none';
  }

  motionLabel(slide: Slide): string {
    return IMAGE_MOTIONS.find((m) => m.id === slide.cinematic.motion)?.label ?? 'Still';
  }

  numberOr(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  // --- back to the edit ---

  /** Puts each slide's move and look on the same picture in the edit, so the monitor plays it. */
  applyToTimeline(): void {
    this.stop();
    const applied = this.state.applyShotsToTimeline(this.slides().map(({ id: _id, ...s }) => s));
    this.state.status.notify([applied > 0
      ? `Applied camera and look to ${applied} picture(s) in your edit - play it in the editor to see them.`
      : 'None of these pictures are in your edit yet. Add them to the timeline first.']);
    if (applied > 0) this.close();
  }

  // --- export ---

  build(): void {
    const f = this.format();
    this.stop();
    this.state.buildPhotoStory(
      this.slides().map(({ id: _id, ...s }) => s),
      {
        name: this.name(),
        width: f.width,
        height: f.height,
        fit: this.fit(),
        quality: this.quality(),
        transitionSeconds: this.transitionSeconds(),
        includeMusic: this.includeMusic(),
        watermark: this.watermark(),
        outro: this.outro(),
      });
  }
}
