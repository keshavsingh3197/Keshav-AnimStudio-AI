import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ClipFit, ExportQuality, ImageCameraMotion, TRANSITIONS } from '../../../../core/models/api.models';
import { PhotoStorySlide, StudioStateService } from '../../services/studio-state.service';
import {
  CinematicImage, DEFAULT_CINEMATIC, IMAGE_LOOKS, IMAGE_MOTIONS, IMAGE_MOTION_MAX, IMAGE_MOTION_MIN,
  autoMotion, cameraTransform, cinemaBarPercent, lookFilter,
} from '../../services/cinematic-image';
import {
  CAPTION_MAX_CHARS, SLIDE_MAX_SECONDS, SLIDE_MIN_SECONDS, STORY_PRESETS, StoryPreset,
  byDate, byName, evenDurations, fitDurations, formatRunTime, moveItem, shuffled,
} from './photo-story-logic';

interface StoryFormat { id: string; label: string; width: number; height: number }

const FORMATS: readonly StoryFormat[] = [
  { id: '16:9', label: '16:9 YouTube', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16 Shorts / Reels', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 Square', width: 1080, height: 1080 },
];

type StoryStep = 'photos' | 'style' | 'timing' | 'create';

const STEPS: readonly { id: StoryStep; label: string }[] = [
  { id: 'photos', label: 'Photos' },
  { id: 'style', label: 'Style' },
  { id: 'timing', label: 'Music & timing' },
  { id: 'create', label: 'Create' },
];

/** A slide in the builder; the id lets the same picture appear twice. */
interface Slide extends PhotoStorySlide { id: string }

/** Most pictures one story takes, as the builder has always opened with. */
const MAX_SLIDES = 40;
const UNDO_DEPTH = 30;

let nextSlideId = 0;

/**
 * Photo Story: a video made from stills. Every picture becomes a shot with its own camera
 * move, grade and lens finish; the preview runs the same motion formulas the export does.
 * The four steps only change which settings the right-hand panel shows - the filmstrip and
 * the preview stay put, so the story can be judged while any of it is changed.
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
  readonly presets = STORY_PRESETS;
  readonly steps = STEPS;
  readonly minIntensity = IMAGE_MOTION_MIN;
  readonly maxIntensity = IMAGE_MOTION_MAX;
  readonly minSeconds = SLIDE_MIN_SECONDS;
  readonly maxSeconds = SLIDE_MAX_SECONDS;
  readonly captionMax = CAPTION_MAX_CHARS;
  readonly runTime = formatRunTime;
  readonly Math = Math;

  readonly step = signal<StoryStep>('photos');
  readonly stepIndex = computed(() => STEPS.findIndex((s) => s.id === this.step()));

  readonly slides = signal<Slide[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.slides().find((s) => s.id === this.selectedId()) ?? null);
  readonly selectedIndex = computed(() => this.slides().findIndex((s) => s.id === this.selectedId()));

  /** Shots ticked for a bulk action; when none are, bulk actions take every shot. */
  readonly checked = signal<ReadonlySet<string>>(new Set());
  readonly checkedCount = computed(() => this.slides().filter((s) => this.checked().has(s.id)).length);
  readonly bulkLabel = computed(() => (this.checkedCount() > 0 ? `${this.checkedCount()} selected` : 'all shots'));

  /** The preset last applied to the whole story; cleared by a by-hand style change. */
  readonly presetId = signal<string | null>(null);
  readonly presetLabel = computed(() => STORY_PRESETS.find((p) => p.id === this.presetId())?.label ?? null);

  readonly name = signal('Photo story');
  readonly formatId = signal('16:9');
  readonly format = computed(() => FORMATS.find((f) => f.id === this.formatId()) ?? FORMATS[0]);
  readonly fit = signal<ClipFit>('Cover');
  readonly quality = signal<ExportQuality>('High');
  readonly transitionSeconds = signal(1);
  readonly includeMusic = signal(true);
  readonly watermark = signal(false);
  readonly outro = signal(false);

  /** The export lengthens each still by its transitions' overlap, so the sum is the length. */
  readonly totalSeconds = computed(() => Math.round(this.slides().reduce((sum, s) => sum + s.seconds, 0) * 10) / 10);
  readonly barPercent = computed(() => cinemaBarPercent(this.format().width, this.format().height));
  readonly captionCount = computed(() => this.slides().filter((s) => (s.caption ?? '').trim()).length);

  // --- music & timing ---

  readonly musicSeconds = this.state.photoStoryMusicSeconds;
  /** Target for "fit to length"; starts at the music's length, else the story's own. */
  readonly targetSeconds = signal(30);
  /** Fit keeps each shot's share of the story; off, every shot gets the same time. */
  readonly keepShares = signal(true);
  /** Value for "set every shot to". */
  readonly bulkSeconds = signal(5);
  /** Story minus music: positive runs past the music, negative stops before it ends. */
  readonly musicGap = computed(() => {
    const music = this.musicSeconds();
    return music === null ? null : Math.round((this.totalSeconds() - music) * 10) / 10;
  });

  /** Preview: which slide is on screen and how far through it. */
  readonly playing = signal(false);
  readonly previewIndex = signal(0);
  readonly previewTransform = signal('none');
  readonly previewProgress = signal(0);
  /** Elapsed story time while the whole story plays. */
  readonly previewClock = signal(0);
  /** A move the pointer rests on, tried out on the selected shot without applying it. */
  readonly tryMotion = signal<ImageCameraMotion | null>(null);
  readonly tryLabel = computed(() => IMAGE_MOTIONS.find((m) => m.id === this.tryMotion())?.label ?? '');
  private raf = 0;
  private playStart = 0;

  // --- drag to reorder ---

  /** The shot being dragged inside the filmstrip, or a library picture being dragged in. */
  private dragSlideId: string | null = null;
  private dragAsset: { id: string; name: string } | null = null;
  /** Where a drop would land, as an insertion index; null when nothing is over the strip. */
  readonly dropIndex = signal<number | null>(null);
  readonly fileOver = signal(false);

  /** Polite screen-reader announcement for moves that are otherwise only visual. */
  readonly announce = signal('');

  private undoStack: Slide[][] = [];
  readonly canUndo = signal(false);

  @ViewChild('frame') frame?: ElementRef<HTMLDivElement>;
  @ViewChild('strip') strip?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

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
    this.slides.set(start.slice(0, MAX_SLIDES).map((c, k) => this.newSlide(c.id, c.name, c.seconds, k, this.state.shotOfPicture(c.id))));
    this.selectedId.set(this.slides()[0]?.id ?? null);
    const music = this.musicSeconds();
    this.targetSeconds.set(music ?? Math.max(SLIDE_MIN_SECONDS, this.totalSeconds() || 30));
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.state.photoStoryOpen.set(false);
  }

  // --- steps ---

  goTo(step: StoryStep): void {
    this.step.set(step);
  }

  nextStep(by: 1 | -1): void {
    const at = Math.min(STEPS.length - 1, Math.max(0, this.stepIndex() + by));
    this.step.set(STEPS[at].id);
  }

  /** The short status each step shows in the header. */
  stepSummary(step: StoryStep): string {
    switch (step) {
      case 'photos': return `${this.slides().length} photo${this.slides().length === 1 ? '' : 's'}`;
      case 'style': return this.presetLabel() ?? 'Custom';
      case 'timing': return formatRunTime(this.totalSeconds());
      default: return this.format().id;
    }
  }

  // --- slides ---

  private newSlide(assetId: string, name: string, seconds: number, index: number, shot: CinematicImage | null = null): Slide {
    return {
      id: `s${++nextSlideId}`,
      assetId, name,
      seconds: Math.min(SLIDE_MAX_SECONDS, Math.max(SLIDE_MIN_SECONDS, Math.round((seconds || 5) * 10) / 10)),
      cinematic: shot ? { ...shot } : { ...DEFAULT_CINEMATIC, motion: autoMotion(index) },
      transition: 'Fade',
      caption: '',
    };
  }

  /** Keeps the story as it was before a change, so Undo can put it back. */
  private remember(): void {
    this.undoStack.push(this.slides());
    if (this.undoStack.length > UNDO_DEPTH) this.undoStack.shift();
    this.canUndo.set(true);
  }

  undo(): void {
    const prev = this.undoStack.pop();
    this.canUndo.set(this.undoStack.length > 0);
    if (!prev) return;
    this.slides.set(prev);
    if (!prev.some((s) => s.id === this.selectedId())) this.selectedId.set(prev[0]?.id ?? null);
    this.pruneChecked();
    this.say('Undone.');
  }

  isInStory(assetId: string): boolean {
    return this.slides().some((s) => s.assetId === assetId);
  }

  /** Adds a picture at `at` (the end by default); false when the story is full. */
  addPicture(assetId: string, name: string, at: number = this.slides().length): boolean {
    if (this.slides().length >= MAX_SLIDES) {
      this.state.status.notify([`A photo story holds up to ${MAX_SLIDES} pictures.`]);
      return false;
    }
    this.remember();
    const slide = this.newSlide(assetId, name, this.selected()?.seconds ?? 5, this.slides().length);
    this.slides.update((list) => [...list.slice(0, at), slide, ...list.slice(at)]);
    this.selectedId.set(slide.id);
    this.say(`Added ${name} as shot ${Math.min(at, this.slides().length - 1) + 1}.`);
    return true;
  }

  /** Every library picture not yet in the story, in library order. */
  addAllUnused(): void {
    const unused = this.state.frameImageCandidates().filter((c) => !this.isInStory(c.id));
    const room = MAX_SLIDES - this.slides().length;
    if (unused.length === 0 || room <= 0) return;
    this.remember();
    const base = this.slides().length;
    const added = unused.slice(0, room).map((c, k) => this.newSlide(c.id, c.name, 5, base + k));
    this.slides.update((list) => [...list, ...added]);
    this.selectedId.set(this.selectedId() ?? added[0].id);
    this.say(`Added ${added.length} picture(s).`);
  }

  duplicate(id: string): void {
    const at = this.slides().findIndex((s) => s.id === id);
    const from = this.slides()[at];
    if (!from || this.slides().length >= MAX_SLIDES) return;
    this.remember();
    const copy: Slide = { ...from, id: `s${++nextSlideId}`, cinematic: { ...from.cinematic } };
    this.slides.update((list) => [...list.slice(0, at + 1), copy, ...list.slice(at + 1)]);
    this.selectedId.set(copy.id);
  }

  remove(id: string): void {
    this.removeMany(new Set([id]));
  }

  removeChecked(): void {
    if (this.checkedCount() > 0) this.removeMany(this.checked());
  }

  private removeMany(ids: ReadonlySet<string>): void {
    const list = this.slides();
    if (!list.some((s) => ids.has(s.id))) return;
    this.remember();
    const at = list.findIndex((s) => ids.has(s.id));
    const rest = list.filter((s) => !ids.has(s.id));
    this.slides.set(rest);
    if (this.selectedId() !== null && ids.has(this.selectedId()!)) this.selectedId.set(rest[Math.min(at, rest.length - 1)]?.id ?? null);
    this.pruneChecked();
    this.say(`Removed ${list.length - rest.length} shot(s). ${rest.length} left.`);
  }

  move(id: string, by: -1 | 1): void {
    const at = this.slides().findIndex((s) => s.id === id);
    const to = at + by;
    if (at < 0 || to < 0 || to >= this.slides().length) return;
    this.remember();
    this.slides.set(moveItem(this.slides(), at, to));
    this.say(`Moved to position ${to + 1} of ${this.slides().length}.`);
  }

  select(id: string): void {
    this.stop();
    this.selectedId.set(id);
    this.playStart = performance.now();
  }

  /** Click on a filmstrip shot: plain selects; Ctrl/Cmd ticks it; Shift ticks a range. */
  onShotClick(event: MouseEvent, id: string): void {
    if (event.shiftKey && this.selectedId()) {
      const list = this.slides();
      const a = list.findIndex((s) => s.id === this.selectedId());
      const b = list.findIndex((s) => s.id === id);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      const next = new Set(this.checked());
      for (let k = lo; k <= hi; k++) next.add(list[k].id);
      this.checked.set(next);
    } else if (event.ctrlKey || event.metaKey) {
      this.toggleChecked(id);
    }
    this.select(id);
  }

  toggleChecked(id: string): void {
    const next = new Set(this.checked());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.checked.set(next);
  }

  checkAll(on: boolean): void {
    this.checked.set(on ? new Set(this.slides().map((s) => s.id)) : new Set());
  }

  private pruneChecked(): void {
    const ids = new Set(this.slides().map((s) => s.id));
    this.checked.set(new Set([...this.checked()].filter((id) => ids.has(id))));
  }

  /** Bulk actions work on the ticked shots, or every shot when none are ticked. */
  private isTarget(s: Slide): boolean {
    return this.checkedCount() === 0 || this.checked().has(s.id);
  }

  update(id: string, patch: Partial<Pick<Slide, 'seconds' | 'transition' | 'caption'>>): void {
    const clean = { ...patch };
    if (clean.seconds !== undefined) {
      const n = Number(clean.seconds);
      clean.seconds = Number.isFinite(n) ? Math.min(SLIDE_MAX_SECONDS, Math.max(SLIDE_MIN_SECONDS, Math.round(n * 10) / 10)) : SLIDE_MIN_SECONDS;
    }
    if (clean.caption !== undefined) clean.caption = String(clean.caption).slice(0, CAPTION_MAX_CHARS);
    this.slides.update((list) => list.map((s) => (s.id === id ? { ...s, ...clean } : s)));
  }

  updateLook(id: string, patch: Partial<CinematicImage>): void {
    this.slides.update((list) => list.map((s) => (s.id === id ? { ...s, cinematic: { ...s.cinematic, ...patch } } : s)));
    this.presetId.set(null);
    this.playStart = performance.now();
  }

  // --- bulk order ---

  shuffle(): void {
    if (this.slides().length < 2) return;
    this.remember();
    this.slides.set(shuffled(this.slides()));
    this.say('Shuffled the story.');
  }

  reverse(): void {
    if (this.slides().length < 2) return;
    this.remember();
    this.slides.set([...this.slides()].reverse());
    this.say('Reversed the story.');
  }

  sortByName(): void {
    if (this.slides().length < 2) return;
    this.remember();
    this.slides.set(byName(this.slides()));
    this.say('Sorted by file name.');
  }

  /** Oldest first, by when each file was added to the project. */
  sortByDate(): void {
    if (this.slides().length < 2) return;
    const added = new Map<string, number>();
    for (const c of this.state.studio()?.clips ?? []) {
      const t = c.createdAt ? Date.parse(c.createdAt) : NaN;
      if (Number.isFinite(t)) added.set(c.id, t);
    }
    this.remember();
    this.slides.set(byDate(this.slides(), (s) => added.get(s.assetId) ?? null));
    this.say(added.size > 0 ? 'Sorted by date added, oldest first.' : 'No upload dates known; order kept.');
  }

  // --- bulk style ---

  /** Copies the selected slide's look, finish and timing (not its move or focus) to the targets. */
  applyToAll(): void {
    const from = this.selected();
    if (!from) return;
    this.remember();
    const { look, vignette, grain, cinemaBars, intensity, easing } = from.cinematic;
    this.slides.update((list) => list.map((s) => (!this.isTarget(s) ? s : {
      ...s, seconds: from.seconds, transition: from.transition,
      cinematic: { ...s.cinematic, look, vignette, grain, cinemaBars, intensity, easing },
    })));
    this.presetId.set(null);
  }

  /** The selected slide's camera move (and its strength and easing) on the targets. */
  applyMoveToAll(): void {
    const from = this.selected();
    if (!from) return;
    this.remember();
    const { motion, intensity, easing } = from.cinematic;
    this.slides.update((list) => list.map((s) => (this.isTarget(s) ? { ...s, cinematic: { ...s.cinematic, motion, intensity, easing } } : s)));
    this.presetId.set(null);
    this.playStart = performance.now();
  }

  /** A different move on every slide, in an order that never repeats back to back. */
  autoCinematic(): void {
    this.remember();
    this.slides.update((list) => list.map((s, k) => ({ ...s, cinematic: { ...s.cinematic, motion: autoMotion(k) } })));
    this.presetId.set(null);
    this.playStart = performance.now();
  }

  /** Move, pace, transition and (when the preset has one) the grade, on every shot. */
  applyPreset(p: StoryPreset): void {
    if (this.slides().length === 0) return;
    this.remember();
    this.slides.update((list) => list.map((s, k) => ({
      ...s,
      seconds: p.seconds,
      transition: p.transition,
      cinematic: {
        ...s.cinematic,
        motion: p.motionAt(k),
        intensity: p.intensity,
        easing: p.easing,
        ...(p.look ? { look: p.look } : {}),
        vignette: p.vignette ?? false,
        grain: p.grain ?? false,
        cinemaBars: p.cinemaBars ?? false,
      },
    })));
    this.transitionSeconds.set(p.transitionSeconds);
    this.presetId.set(p.id);
    this.playStart = performance.now();
    this.say(`${p.label} style applied to ${this.slides().length} shots.`);
  }

  // --- bulk timing ---

  /** Every target shot on screen for the same time. */
  setAllSeconds(): void {
    const secs = Number(this.bulkSeconds());
    if (!Number.isFinite(secs)) return;
    this.remember();
    const v = Math.min(SLIDE_MAX_SECONDS, Math.max(SLIDE_MIN_SECONDS, Math.round(secs * 10) / 10));
    this.slides.update((list) => list.map((s) => (this.isTarget(s) ? { ...s, seconds: v } : s)));
  }

  /** The selected shot's transition on every target shot. */
  applyTransitionToAll(): void {
    const from = this.selected();
    if (!from) return;
    this.remember();
    this.slides.update((list) => list.map((s) => (this.isTarget(s) ? { ...s, transition: from.transition } : s)));
  }

  /** Stretches or squeezes every shot so the story runs `target` seconds. */
  fitTo(target: number | null): void {
    const list = this.slides();
    const goal = Number(target);
    if (list.length === 0 || !Number.isFinite(goal) || goal <= 0) return;
    this.remember();
    const secs = this.keepShares() ? fitDurations(list.map((s) => s.seconds), goal) : evenDurations(list.length, goal);
    this.slides.set(list.map((s, k) => ({ ...s, seconds: secs[k] })));
    const got = this.totalSeconds();
    this.say(Math.abs(got - goal) < 0.05
      ? `Story now runs ${formatRunTime(got)}.`
      : `Closest reachable length is ${formatRunTime(got)} (each shot is ${SLIDE_MIN_SECONDS}-${SLIDE_MAX_SECONDS}s).`);
  }

  fitToMusic(): void {
    this.fitTo(this.musicSeconds());
  }

  // --- keyboard ---

  /**
   * Filmstrip keys: arrows pick a shot, Ctrl/Alt+arrows move it, Delete removes it (or the
   * ticked shots), Space plays, Ctrl+A ticks all, Ctrl+Z undoes. Ignored while typing.
   */
  onStripKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    const list = this.slides();
    const at = this.selectedIndex();
    const mod = event.ctrlKey || event.metaKey;
    const pick = (k: number) => {
      const s = list[Math.min(list.length - 1, Math.max(0, k))];
      if (s) { this.select(s.id); this.focusShot(s.id); }
    };

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const by = event.key === 'ArrowLeft' ? -1 : 1;
        if ((mod || event.altKey) && at >= 0) { this.move(list[at].id, by); this.focusShot(list[at].id); }
        else pick(at + by);
        break;
      }
      case 'Home': pick(0); break;
      case 'End': pick(list.length - 1); break;
      case 'Delete':
      case 'Backspace':
        if (this.checkedCount() > 0) this.removeChecked();
        else if (at >= 0) this.remove(list[at].id);
        if (this.selectedId()) this.focusShot(this.selectedId()!);
        break;
      case ' ':
        if (this.playing()) this.stop(); else this.play();
        break;
      case 'a':
      case 'A':
        if (!mod) return;
        this.checkAll(true);
        break;
      case 'z':
      case 'Z':
        if (!mod) return;
        this.undo();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Keeps keyboard focus on a shot after it moves or the selection changes. */
  private focusShot(id: string): void {
    setTimeout(() => {
      const el = this.strip?.nativeElement.querySelector<HTMLElement>(`[data-shot="${CSS.escape(id)}"]`);
      el?.focus();
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  private say(text: string): void {
    // Re-set even when unchanged, so the same message is read out again.
    this.announce.set('');
    setTimeout(() => this.announce.set(text));
  }

  // --- drag & drop ---

  onShotDragStart(event: DragEvent, id: string): void {
    this.dragSlideId = id;
    this.dragAsset = null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
    }
  }

  onLibraryDragStart(event: DragEvent, id: string, name: string): void {
    this.dragAsset = { id, name };
    this.dragSlideId = null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', name);
    }
  }

  onDragEnd(): void {
    this.dragSlideId = null;
    this.dragAsset = null;
    this.dropIndex.set(null);
    this.fileOver.set(false);
  }

  /** Over a shot: the drop lands before it or after it, by which half the pointer is in. */
  onShotDragOver(event: DragEvent, index: number): void {
    if (!this.acceptsDrop(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dropIndex.set(event.clientX > box.left + box.width / 2 ? index + 1 : index);
  }

  /** Over the strip's empty space (shots stop their own dragover): the drop goes on the end. */
  onStripDragOver(event: DragEvent): void {
    if (!this.acceptsDrop(event)) return;
    event.preventDefault();
    if (this.isFileDrag(event)) this.fileOver.set(true);
    this.dropIndex.set(this.slides().length);
  }

  onStripDragLeave(event: DragEvent): void {
    const into = event.relatedTarget as Node | null;
    if (into && (event.currentTarget as HTMLElement).contains(into)) return;
    this.dropIndex.set(null);
    this.fileOver.set(false);
  }

  onStripDrop(event: DragEvent): void {
    event.preventDefault();
    const at = this.dropIndex() ?? this.slides().length;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.upload(Array.from(files), at);
    } else if (this.dragSlideId) {
      const from = this.slides().findIndex((s) => s.id === this.dragSlideId);
      // Removing the shot first shifts every later slot down by one.
      const to = at > from ? at - 1 : at;
      if (from >= 0 && to !== from) {
        this.remember();
        this.slides.set(moveItem(this.slides(), from, to));
        this.say(`Moved to position ${to + 1} of ${this.slides().length}.`);
      }
    } else if (this.dragAsset) {
      this.addPicture(this.dragAsset.id, this.dragAsset.name, at);
    }
    this.onDragEnd();
  }

  /** Files dragged from the computer onto the library or the empty drop zone. */
  onFileDragOver(event: DragEvent): void {
    if (!this.isFileDrag(event)) return;
    event.preventDefault();
    this.fileOver.set(true);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.upload(Array.from(files), this.slides().length);
    this.onDragEnd();
  }

  private acceptsDrop(event: DragEvent): boolean {
    return this.dragSlideId !== null || this.dragAsset !== null || this.isFileDrag(event);
  }

  private isFileDrag(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
  }

  // --- upload ---

  chooseFiles(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesChosen(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length > 0) this.upload(files, this.slides().length);
  }

  /** Uploads to the project library, then adds each picture to the story in order from `at`. */
  private upload(files: File[], at: number): void {
    const room = MAX_SLIDES - this.slides().length;
    if (room <= 0) {
      this.state.status.notify([`A photo story holds up to ${MAX_SLIDES} pictures.`]);
      return;
    }
    let next = at;
    this.state.uploadPhotoStoryPictures(files.slice(0, room), (asset) => {
      if (this.addPicture(asset.id, asset.name, Math.min(next, this.slides().length))) next++;
    });
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
    this.tryMotion.set(null);
    this.previewIndex.set(0);
    this.previewClock.set(0);
    this.playing.set(true);
    this.playStart = performance.now();
  }

  /** Plays from the selected shot to the end. */
  playFromSelected(): void {
    const at = this.selectedIndex();
    if (at < 0) { this.play(); return; }
    this.tryMotion.set(null);
    this.previewIndex.set(at);
    this.playing.set(true);
    this.playStart = performance.now();
  }

  stop(): void {
    this.playing.set(false);
  }

  /** Pointer rests on a move: the preview shows it on the selected shot from the top. */
  previewMotion(motion: ImageCameraMotion | null): void {
    if (this.playing()) return;
    this.tryMotion.set(motion);
    this.playStart = performance.now();
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
    const trying = this.playing() ? null : this.tryMotion();
    const shot = trying ? { ...slide.cinematic, motion: trying } : slide.cinematic;
    this.previewProgress.set(p);
    this.previewTransform.set(cameraTransform(shot, p, t));
    if (this.playing()) {
      const before = this.slides().slice(0, this.previewIndex()).reduce((sum, s) => sum + s.seconds, 0);
      this.previewClock.set(before + t);
    }
  };

  filterOf(slide: Slide | null): string {
    return slide ? lookFilter(slide.cinematic.look) : 'none';
  }

  motionOf(slide: Slide): { label: string; icon: string } {
    const m = IMAGE_MOTIONS.find((o) => o.id === slide.cinematic.motion);
    return { label: m?.label ?? 'Still', icon: m?.icon ?? '■' };
  }

  transitionLabel(t: string): string {
    return t === 'None' ? 'Cut' : t.replace(/([a-z])([A-Z])/g, '$1 $2');
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
