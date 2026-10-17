import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AUTO_SHORT_STYLES, AutoShortStyle, AutoShortTextMode, Clip, ClipFit, ExportQuality, RenderJob,
} from '../../../../core/models/api.models';
import { StudioStateService } from '../../services/studio-state.service';
import { formatRunTime } from '../photo-story/photo-story-logic';

interface ShortFormat { id: string; label: string; width: number; height: number }

const FORMATS: readonly ShortFormat[] = [
  { id: '9:16', label: '9:16 Shorts / Reels', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 Square', width: 1080, height: 1080 },
  { id: '16:9', label: '16:9 YouTube', width: 1920, height: 1080 },
];

const STYLE_HINTS: Record<AutoShortStyle, { icon: string; hint: string }> = {
  Mixed: { icon: '🎲', hint: 'Every short picks its own pace and look' },
  Energetic: { icon: '⚡', hint: '2-3s cuts, slides and wipes, strong moves' },
  Cinematic: { icon: '🎬', hint: '3-5s shots, dissolves, film grade' },
  Calm: { icon: '🌿', hint: '4-6s shots, soft fades, gentle zooms' },
};

const TEXT_MODES: readonly { id: AutoShortTextMode; label: string }[] = [
  { id: 'Hook', label: 'Hook on top' },
  { id: 'PerShot', label: 'Caption per shot' },
  { id: 'HookAndPerShot', label: 'Hook + captions' },
  { id: 'None', label: 'No text' },
];

type SourceFilter = 'all' | 'video' | 'image';

export const AUTO_SHORT_MAX_COUNT = 20;
export const AUTO_SHORT_MIN_SECONDS = 5;
export const AUTO_SHORT_MAX_SECONDS = 180;
const MAX_LINES = 100;

/**
 * Auto Shorts: pick the clips, pictures and lines once, say how many shorts and how long,
 * and the server cuts that many different ones - shuffled, trimmed to length, with camera
 * moves, transitions and text applied. Each short renders as its own job.
 */
@Component({
  selector: 'app-auto-shorts',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auto-shorts.component.html',
  styleUrl: './auto-shorts.component.css',
})
export class AutoShortsComponent {
  readonly state = inject(StudioStateService);

  readonly formats = FORMATS;
  readonly styles = AUTO_SHORT_STYLES;
  readonly styleHints = STYLE_HINTS;
  readonly textModes = TEXT_MODES;
  readonly durations = [15, 30, 45, 60, 90] as const;
  readonly counts = [3, 5, 10] as const;
  readonly maxCount = AUTO_SHORT_MAX_COUNT;
  readonly minSeconds = AUTO_SHORT_MIN_SECONDS;
  readonly maxSeconds = AUTO_SHORT_MAX_SECONDS;
  readonly runTime = formatRunTime;

  // --- sources ---
  readonly filter = signal<SourceFilter>('all');
  readonly query = signal('');
  readonly picked = signal<ReadonlySet<string>>(this.initialPick());

  readonly sources = computed(() => this.state.autoShortSources());
  readonly visible = computed(() => {
    const f = this.filter();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.sources().filter((c) => {
      const kind = this.kindOf(c);
      if (f !== 'all' && kind !== f) return false;
      const name = c.name.toLowerCase();
      return words.every((w) => name.includes(w));
    });
  });
  readonly pickedClips = computed(() => this.sources().filter((c) => this.picked().has(this.idOf(c))));
  readonly pickedVideos = computed(() => this.pickedClips().filter((c) => this.kindOf(c) === 'video').length);
  readonly pickedImages = computed(() => this.pickedClips().filter((c) => this.kindOf(c) === 'image').length);

  // --- options ---
  readonly count = signal(3);
  readonly seconds = signal(30);
  readonly formatId = signal('9:16');
  readonly format = computed(() => FORMATS.find((f) => f.id === this.formatId()) ?? FORMATS[0]);
  readonly style = signal<AutoShortStyle>('Mixed');
  readonly textMode = signal<AutoShortTextMode>('Hook');
  readonly linesText = signal('');
  readonly lines = computed(() =>
    this.linesText().split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, MAX_LINES));
  readonly musicIds = signal<ReadonlySet<string>>(this.initialMusic());
  readonly transitions = signal(true);
  readonly motion = signal(true);
  readonly keepClipAudio = signal(true);
  readonly watermark = signal(true);
  readonly outro = signal(false);
  readonly fit = signal<ClipFit>('BlurredBackdrop');
  readonly quality = signal<ExportQuality>('High');
  readonly name = signal(this.defaultName());

  readonly musicOptions = computed(() => this.state.musicCandidates());

  readonly totalSeconds = computed(() => this.count() * this.seconds());
  readonly blocked = computed<string | null>(() => {
    if (this.state.blockedReason()) return this.state.blockedReason();
    if (this.pickedClips().length === 0) return 'Pick at least one clip or picture.';
    return null;
  });

  readonly submitting = signal(false);
  readonly queued = signal<RenderJob[] | null>(null);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.submitting()) this.close();
  }

  close(): void {
    this.state.autoShortsOpen.set(false);
  }

  idOf(c: Clip): string {
    return this.state.resolveAssetId(c);
  }

  kindOf(c: Clip): 'video' | 'image' {
    return this.state.getClipType(c) === 'image' ? 'image' : 'video';
  }

  thumb(c: Clip): string {
    return this.state.assetThumbnailUrl(c);
  }

  isPicked(c: Clip): boolean {
    return this.picked().has(this.idOf(c));
  }

  toggle(c: Clip): void {
    const id = this.idOf(c);
    this.picked.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  pickVisible(on: boolean): void {
    const ids = this.visible().map((c) => this.idOf(c));
    this.picked.update((s) => {
      const next = new Set(s);
      for (const id of ids) { if (on) next.add(id); else next.delete(id); }
      return next;
    });
  }

  toggleMusic(id: string): void {
    this.musicIds.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  setCount(v: number): void {
    this.count.set(Math.min(AUTO_SHORT_MAX_COUNT, Math.max(1, Math.round(Number(v) || 1))));
  }

  setSeconds(v: number): void {
    this.seconds.set(Math.min(AUTO_SHORT_MAX_SECONDS, Math.max(AUTO_SHORT_MIN_SECONDS, Math.round(Number(v) || 30))));
  }

  formatDuration(c: Clip): string {
    return c.durationSeconds ? formatRunTime(c.durationSeconds) : '';
  }

  create(): void {
    if (this.blocked() || this.submitting()) return;
    const f = this.format();
    this.submitting.set(true);
    this.state.queueAutoShorts(
      {
        sourceAssetIds: [...this.picked()].filter((id) => this.sources().some((c) => this.idOf(c) === id)),
        lines: this.lines(),
        musicAssetIds: [...this.musicIds()],
        count: this.count(),
        targetSeconds: this.seconds(),
        style: this.style(),
        textMode: this.lines().length > 0 ? this.textMode() : 'None',
        transitions: this.transitions(),
        motion: this.motion(),
        keepClipAudio: this.keepClipAudio(),
        exportName: this.name().trim() || null,
        width: f.width,
        height: f.height,
        fit: this.fit(),
        quality: this.quality(),
        watermark: this.watermark(),
        includeOutro: this.outro(),
      },
      (jobs) => this.queued.set(jobs),
      () => this.submitting.set(false),
    );
  }

  private initialPick(): ReadonlySet<string> {
    const lib = [...this.state.selectedLibraryIds()].map((id) => this.state.resolveAssetId(id));
    const available = new Set(this.state.autoShortSources().map((c) => this.state.resolveAssetId(c)));
    const chosen = lib.filter((id) => available.has(id));
    return new Set(chosen.length > 0 ? chosen : available);
  }

  private initialMusic(): ReadonlySet<string> {
    const bed = this.state.musicAssetId();
    return new Set(bed ? [bed] : []);
  }

  private defaultName(): string {
    const project = this.state.store.project()?.name;
    return project ? `${project} short` : 'Auto short';
  }
}
