import { Component, DestroyRef, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  AnimateCapabilities,
  AnimateFormat,
  AnimatePlan,
  AnimateService,
  ProceduralResolution,
  ProceduralSceneTheme,
  ProceduralThemePreset,
} from '../../core/services/animate.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

const DEFAULT_PROCEDURAL_THEMES: readonly ProceduralThemePreset[] = [
  { id: 'auto', theme: 'Auto', name: 'Smart Auto-Match', bestFor: 'Panchang, Katha, History & Tech', accentHex: '#F59E0B', description: 'Automatically selects 3D geometry, lighting and soundtrack from your title & prompt.' },
  { id: 'vedic-sunrise', theme: 'VedicTempleSunrise3D', name: 'Vedic Temple Sunrise 3D', bestFor: 'Aarti, Katha & Festivals', accentHex: '#EA580C', description: 'Rotating 3D Sri Yantra geometry, rising solar rays, temple silhouettes & glowing diya sparks.' },
  { id: 'cosmos-sacred', theme: 'CosmosSacred3D', name: 'Cosmos & Nakshatra 3D', bestFor: 'Panchang & Astronomy', accentHex: '#6366F1', description: '3D orbital celestial rings, warp starfield & deep indigo nebula glow.' },
  { id: 'history-chronicle', theme: 'HistoryChronicle3D', name: 'History Chronicle 3D', bestFor: 'Aaj Ka Itihaas & Events', accentHex: '#D97706', description: 'Rotating 3D meridian wireframe globe, radar sweeps & archival lighting.' },
  { id: 'neon-cyber', theme: 'NeonCyberGrid3D', name: 'Neon Cyber Grid 3D', bestFor: 'Pratiyogita, Tech & Analytics', accentHex: '#06B6D4', description: 'Scrolling 3D perspective synthwave grid, floating polyhedra & reactive pulses.' },
  { id: 'serene-nature', theme: 'SereneNatureGlow', name: 'Serene Aurora Nature', bestFor: 'Wisdom, Quotes & Peace', accentHex: '#10B981', description: 'Layered parallax mountains, glowing aurora ribbons & golden fireflies.' },
];

const PROCEDURAL_IDEAS: readonly { label: string; title: string; prompt: string; script: string; theme: ProceduralSceneTheme }[] = [
  {
    label: 'ॐ Aaj Ka Panchang Short',
    title: 'आज का शुभ पंचांग एवं राहुकाल',
    prompt: 'Sacred 3D Vedic sunrise over golden temple spires, rotating Sri Yantra geometry, warm diya particles',
    script: 'हर हर महादेव! आइए जानते हैं आज का शुभ मुहूर्त, तिथि, नक्षत्र और राहुकाल। अभिजीत मुहूर्त में आज के सभी शुभ कार्य संपन्न करें।',
    theme: 'CosmosSacred3D',
  },
  {
    label: '🌍 Aaj Ka Itihaas Reel',
    title: 'Aaj Ka Itihaas — Historical Turning Point',
    prompt: '3D rotating golden meridian globe in space with historical timeline radar waves and glowing stardust',
    script: 'On this day in history, an unforgettable milestone shaped modern science and global civilization.',
    theme: 'HistoryChronicle3D',
  },
  {
    label: '🏆 Pratiyogita Quiz Motion',
    title: 'Daily GK & Coding Challenge',
    prompt: 'Futuristic 3D cyan and magenta perspective grid with floating rotating octahedron and equalizer bars',
    script: 'Test your knowledge! Pause the screen, solve today’s top competitive question, and drop your answer in the comments.',
    theme: 'NeonCyberGrid3D',
  },
];

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
  private readonly studioApi = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stage = viewChild<ElementRef<HTMLImageElement>>('stage');

  readonly studioMode = signal<'procedural' | 'image'>('procedural');

  // --- Procedural 3D Animated Video Generator state
  readonly procTitle = signal('आज का शुभ पंचांग एवं प्रेरणा');
  readonly procPrompt = signal('Sacred 3D Vedic sunrise with rotating golden Sri Yantra geometry, temple horizon and floating diya lights');
  readonly procScript = signal('हर हर महादेव! शुभ प्रभात। आज के पावन दिन की शुरुआत सकारात्मक ऊर्जा और शुभ मुहूर्त के साथ करें।');
  readonly procTheme = signal<ProceduralSceneTheme>('Auto');
  readonly procFormat = signal<AnimateFormat>('vertical');
  readonly procResolution = signal<ProceduralResolution>('720p');
  readonly procDuration = signal(15);
  readonly procIncludeCaptions = signal(true);
  readonly procIncludeAudio = signal(true);
  readonly procLanguage = signal('hi');
  readonly procFooter = signal('');
  readonly procSaveToLibrary = signal(true);
  readonly procRendering = signal(false);
  readonly procResultUrl = signal<string | null>(null);
  readonly procDownloadUrl = signal<string | null>(null);
  readonly procRenderJobId = signal<string | null>(null);
  readonly procSummary = signal<string | null>(null);
  readonly procError = signal<string | null>(null);
  readonly procCopiedNotice = signal<string | null>(null);
  readonly proceduralIdeas = PROCEDURAL_IDEAS;
  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly proceduralThemes = computed(() => this.caps()?.proceduralThemes ?? DEFAULT_PROCEDURAL_THEMES);
  readonly procMinSeconds = computed(() => this.caps()?.proceduralMinSeconds ?? 5);
  readonly procMaxSeconds = computed(() => this.caps()?.proceduralMaxSeconds ?? 90);
  readonly procAspect = computed(() => {
    switch (this.procFormat()) {
      case 'vertical': return '9 / 16';
      case 'square': return '1 / 1';
      default: return '16 / 9';
    }
  });

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
      this.revokeBlobIfObjectUrl(this.procResultUrl());
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

  applyProceduralIdea(idea: (typeof PROCEDURAL_IDEAS)[number]): void {
    this.procTitle.set(idea.title);
    this.procPrompt.set(idea.prompt);
    this.procScript.set(idea.script);
    this.procTheme.set(idea.theme);
  }

  copyProceduralPrompt(): void {
    const text = this.procPrompt().trim();
    if (!text) return;
    void navigator.clipboard?.writeText(text);
    this.procCopiedNotice.set('AI prompt copied to clipboard!');
    setTimeout(() => this.procCopiedNotice.set(null), 2500);
  }

  setProceduralDuration(value: string | number): void {
    const n = Number(value);
    if (Number.isFinite(n)) this.procDuration.set(clamp(Math.round(n), this.procMinSeconds(), this.procMaxSeconds()));
  }

  generateProceduralVideo(): void {
    if (this.procRendering()) return;
    const title = this.procTitle().trim();
    const prompt = this.procPrompt().trim();
    const script = this.procScript().trim();
    if (!title && !prompt && !script) {
      this.procError.set('Enter a title, motion prompt, or script to render.');
      return;
    }

    this.procRendering.set(true);
    this.procError.set(null);
    this.procSummary.set(null);
    this.procRenderJobId.set(null);

    const payload = {
      title: title || prompt || 'AnimStudio 3D',
      prompt,
      script,
      theme: this.procTheme(),
      format: this.procFormat(),
      resolution: this.procResolution(),
      durationSeconds: this.procDuration(),
      includeCaptions: this.procIncludeCaptions(),
      includeAmbientAudio: this.procIncludeAudio(),
      language: this.procLanguage(),
      footerLabel: this.procFooter().trim() || null,
      saveAsRenderJob: this.isAuthenticated() && this.procSaveToLibrary(),
    };

    if (this.isAuthenticated() && this.procSaveToLibrary()) {
      this.api.generateProceduralRenderJob(payload).subscribe({
        next: (res) => {
          this.procRendering.set(false);
          this.procRenderJobId.set(res.renderJobId);
          this.procSummary.set(res.summary);
          this.revokeBlobIfObjectUrl(this.procResultUrl());
          const signedPreview = res.renderJobId ? this.studioApi.previewUrl(res.renderJobId) : null;
          const signedDownload = res.renderJobId ? this.studioApi.downloadUrl(res.renderJobId) : null;
          this.procResultUrl.set(signedPreview);
          this.procDownloadUrl.set(signedDownload);
        },
        error: (err) => {
          this.procRendering.set(false);
          this.procError.set(this.errorText(err, 'Could not render 3D procedural video. Check FFmpeg availability.'));
        },
      });
      return;
    }

    this.api.generateProceduralVideo(payload).subscribe({
      next: (blob) => {
        this.procRendering.set(false);
        this.revokeBlobIfObjectUrl(this.procResultUrl());
        const blobUrl = URL.createObjectURL(blob);
        this.procResultUrl.set(blobUrl);
        this.procDownloadUrl.set(blobUrl);
        this.procSummary.set(`Rendered ${payload.durationSeconds}s ${payload.format} (${payload.resolution}) 3D animated MP4 ready to download.`);
      },
      error: (err) => {
        this.procRendering.set(false);
        this.procError.set(this.errorText(err, 'Could not render 3D procedural video. Check FFmpeg availability.'));
      },
    });
  }

  private revokeBlobIfObjectUrl(url: string | null): void {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
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
