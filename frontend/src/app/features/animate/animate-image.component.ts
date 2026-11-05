import { Component, DestroyRef, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AnimateCapabilities, AnimateFormat, AnimatePlan, AnimateService } from '../../core/services/animate.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

const MOTIONS: readonly { id: string; label: string }[] = [
  { id: 'zoom-in', label: 'Push in' },
  { id: 'zoom-out', label: 'Pull back' },
  { id: 'pan-left', label: 'Pan left' },
  { id: 'pan-right', label: 'Pan right' },
  { id: 'pan-up', label: 'Tilt up' },
  { id: 'pan-down', label: 'Tilt down' },
  { id: 'drift', label: 'Drift' },
  { id: 'handheld', label: 'Handheld' },
  { id: 'breathe', label: 'Breathe' },
];

const LOOKS: readonly { id: string; label: string }[] = [
  { id: 'none', label: 'Original' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'noir', label: 'Noir' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'matte', label: 'Matte' },
];

/** One click fills the description: a quick way to see what the page can do. */
const IDEAS: readonly string[] = [
  'Slow push in on the face, warm golden light',
  'Pan right across the landscape, cinematic',
  'Dreamy drift, vintage film look',
  'Epic reveal: pull back with cinema bars',
  'Handheld documentary feel',
  'Gentle breathing zoom, cool night mood',
];

/** The browser preview's stand-in for each server grade. Close, not exact: the MP4 is the real thing. */
const LOOK_FILTERS: Record<string, string> = {
  none: 'none',
  cinematic: 'contrast(1.08) saturate(1.12) hue-rotate(-4deg)',
  warm: 'sepia(0.18) saturate(1.12) brightness(1.02)',
  cool: 'saturate(0.95) hue-rotate(12deg) brightness(0.98)',
  vintage: 'sepia(0.35) saturate(0.85) contrast(0.95)',
  noir: 'grayscale(1) contrast(1.3) brightness(0.97)',
  vivid: 'saturate(1.4) contrast(1.06)',
  matte: 'contrast(0.84) saturate(0.85) brightness(1.06)',
};

const ACCEPT = 'image/png,image/jpeg,image/webp';

/**
 * Animate Image: drop in a picture, say how it should move, and get an MP4. The move is a virtual camera over the
 * still (zoom, pan, drift, sway) plus a colour grade, rendered by the same ffmpeg pass as image clips in the editor.
 * The text AI, when one is configured, only turns the description into those settings; without one, a keyword reader
 * does, so the page works with no AI at all.
 */
@Component({
  selector: 'app-animate-image',
  imports: [FormsModule, FileDropDirective],
  templateUrl: './animate-image.component.html',
  styleUrl: './animate-image.component.css',
})
export class AnimateImageComponent implements OnInit {
  private readonly api = inject(AnimateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stage = viewChild<ElementRef<HTMLImageElement>>('stage');

  readonly motions = MOTIONS;
  readonly looks = LOOKS;
  readonly ideas = IDEAS;
  readonly accept = ACCEPT;

  readonly caps = signal<AnimateCapabilities | null>(null);
  readonly file = signal<File | null>(null);
  readonly imageUrl = signal<string | null>(null);

  readonly description = signal('');
  readonly useAi = signal(true);
  readonly planning = signal(false);
  readonly plannedBy = signal<string | null>(null);
  readonly note = signal<string | null>(null);

  readonly plan = signal<AnimatePlan>({
    motion: 'zoom-in',
    intensity: 0.15,
    focusX: 50,
    focusY: 50,
    easing: 'ease-in-out',
    look: 'none',
    vignette: false,
    grain: false,
    cinemaBars: false,
    durationSeconds: 6,
    format: 'landscape',
    summary: '',
  });

  readonly rendering = signal(false);
  readonly videoUrl = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly aspect = computed(() => {
    switch (this.plan().format) {
      case 'vertical': return '9 / 16';
      case 'square': return '1 / 1';
      default: return '16 / 9';
    }
  });
  readonly lookFilter = computed(() => LOOK_FILTERS[this.plan().look] ?? 'none');
  readonly canRender = computed(() => !!this.file() && !this.rendering() && this.caps()?.rendererAvailable !== false);
  readonly minSeconds = computed(() => this.caps()?.minSeconds ?? 2);
  readonly maxSeconds = computed(() => this.caps()?.maxSeconds ?? 20);

  private animation: Animation | null = null;

  constructor() {
    // Replays the preview whenever the move, its length or the picture changes.
    effect(() => {
      const plan = this.plan();
      const el = this.stage()?.nativeElement;
      this.imageUrl();
      if (el) this.preview(el, plan);
    });

    this.destroyRef.onDestroy(() => {
      this.animation?.cancel();
      this.revoke(this.imageUrl());
      this.revoke(this.videoUrl());
    });
  }

  ngOnInit(): void {
    this.api.capabilities().subscribe({
      next: (caps) => this.caps.set(caps),
      // The page still works as a preview; the render button reports the problem if there is one.
      error: () => this.caps.set(null),
    });
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.choose(file);
    input.value = '';
  }

  onDropped(files: File[]): void {
    if (files[0]) this.choose(files[0]);
  }

  useIdea(idea: string): void {
    this.description.set(idea);
    this.planFromWords();
  }

  planFromWords(): void {
    const text = this.description().trim();
    if (!text || this.planning()) return;

    this.planning.set(true);
    this.error.set(null);
    this.api.plan(text, this.useAi(), null).subscribe({
      next: (result) => {
        this.planning.set(false);
        this.plannedBy.set(result.plannedBy);
        this.note.set(result.note);
        const { plannedBy: _by, note: _note, ...plan } = result;
        this.plan.set(plan);
      },
      error: (err) => {
        this.planning.set(false);
        this.error.set(this.errorText(err, 'Could not read that description. Try again, or set the motion by hand.'));
      },
    });
  }

  update<K extends keyof AnimatePlan>(key: K, value: AnimatePlan[K]): void {
    this.plan.update((p) => ({ ...p, [key]: value }));
  }

  /** Range inputs hand back strings. */
  setNumber(key: 'intensity' | 'durationSeconds', value: string | number): void {
    const n = Number(value);
    if (Number.isFinite(n)) this.update(key, n);
  }

  setFormat(format: AnimateFormat): void {
    this.update('format', format);
  }

  /** Click the preview to say where a zoom heads. */
  pickFocus(event: MouseEvent): void {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.round(((event.clientX - box.left) / box.width) * 100);
    const y = Math.round(((event.clientY - box.top) / box.height) * 100);
    this.plan.update((p) => ({ ...p, focusX: clamp(x, 0, 100), focusY: clamp(y, 0, 100) }));
  }

  render(): void {
    const file = this.file();
    if (!file || this.rendering()) return;

    this.rendering.set(true);
    this.error.set(null);
    this.api.render(file, this.plan()).subscribe({
      next: (blob) => {
        this.rendering.set(false);
        this.revoke(this.videoUrl());
        this.videoUrl.set(URL.createObjectURL(blob));
      },
      error: (err) => {
        this.rendering.set(false);
        this.error.set(this.errorText(err, 'The video could not be made. Try again.'));
      },
    });
  }

  clearPicture(): void {
    this.revoke(this.imageUrl());
    this.revoke(this.videoUrl());
    this.imageUrl.set(null);
    this.videoUrl.set(null);
    this.file.set(null);
  }

  private choose(file: File): void {
    if (!ACCEPT.split(',').includes(file.type)) {
      this.error.set('Choose a PNG, JPEG or WebP picture.');
      return;
    }
    const max = this.caps()?.maxImageBytes ?? 20 * 1024 * 1024;
    if (file.size > max) {
      this.error.set(`Pictures can be up to ${Math.round(max / 1024 / 1024)} MB.`);
      return;
    }

    this.error.set(null);
    this.revoke(this.imageUrl());
    this.revoke(this.videoUrl());
    this.videoUrl.set(null);
    this.file.set(file);
    this.imageUrl.set(URL.createObjectURL(file));
  }

  /**
   * A looping CSS approximation of the server's zoompan move, so a change is seen at once. The transform is
   * translate-then-scale about the centre: at scale s each side has (s-1)/2 of the frame to travel into.
   */
  private preview(el: HTMLImageElement, plan: AnimatePlan): void {
    this.animation?.cancel();

    const s = 1 + plan.intensity;
    const room = ((s - 1) / 2) * 100;
    const fx = (0.5 - plan.focusX / 100) * 2 * room;
    const fy = (0.5 - plan.focusY / 100) * 2 * room;
    const at = (x: number, y: number, scale: number) => ({ transform: `translate(${x}%, ${y}%) scale(${scale})` });

    let frames: Keyframe[];
    switch (plan.motion) {
      case 'zoom-out': frames = [at(fx, fy, s), at(0, 0, 1)]; break;
      case 'pan-left': frames = [at(-room, fy, s), at(room, fy, s)]; break;
      case 'pan-right': frames = [at(room, fy, s), at(-room, fy, s)]; break;
      case 'pan-up': frames = [at(fx, -room, s), at(fx, room, s)]; break;
      case 'pan-down': frames = [at(fx, room, s), at(fx, -room, s)]; break;
      case 'drift': {
        // Half pushed in, from the corner opposite the focus, towards it.
        const half = 1 + plan.intensity * 0.5;
        const k = room > 0 ? ((half - 1) / 2) * 100 / room : 0;
        frames = [at(-fx * k, -fy * k, half), at(fx, fy, s)];
        break;
      }
      case 'handheld':
        frames = [
          at(0, 0, s), at(room * 0.4, -room * 0.3, s), at(-room * 0.3, room * 0.2, s),
          at(room * 0.2, room * 0.35, s), at(-room * 0.4, -room * 0.2, s), at(0, 0, s),
        ];
        break;
      case 'breathe': frames = [at(0, 0, 1), at(fx, fy, s), at(0, 0, 1)]; break;
      default: frames = [at(0, 0, 1), at(fx, fy, s)];
    }

    this.animation = el.animate(frames, {
      duration: plan.durationSeconds * 1000,
      easing: plan.easing === 'linear' || plan.motion === 'handheld' ? 'linear' : 'ease-in-out',
      iterations: Infinity,
      fill: 'both',
    });
  }

  private revoke(url: string | null): void {
    if (url) URL.revokeObjectURL(url);
  }

  private errorText(err: unknown, fallback: string): string {
    if (err instanceof ApiFailure) return err.hint ? `${err.message} ${err.hint}` : err.message;
    return fallback;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
