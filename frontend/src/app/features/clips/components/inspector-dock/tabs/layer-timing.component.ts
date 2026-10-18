import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { FrameTiming, layerWindow } from '../../../services/text-overlay-layout';

type Mode = 'whole' | 'clips' | 'custom';

/** Durations offered as one click, in seconds. */
const QUICK_SECONDS = [1, 2, 3, 5, 10];

/**
 * When a frame layer shows: the whole video, a run of clips, or a custom window set by its
 * start and its length. Shared by text layers and pictures so both are timed the same way,
 * with a bar showing where the window falls in the video.
 */
@Component({
  selector: 'app-layer-timing',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @let w = window();
    <div class="lt">
      <div class="lt-seg" role="radiogroup" aria-label="When it shows">
        <button type="button" role="radio" [class.on]="mode() === 'whole'" [attr.aria-checked]="mode() === 'whole'"
                (click)="setWhole()" title="From the first frame to the last">Whole video</button>
        <button type="button" role="radio" [class.on]="mode() === 'clips'" [attr.aria-checked]="mode() === 'clips'"
                [disabled]="clips().length === 0" (click)="setClips(currentIndex(), currentIndex())"
                title="Exactly one clip, or a run of clips">Clips</button>
        <button type="button" role="radio" [class.on]="mode() === 'custom'" [attr.aria-checked]="mode() === 'custom'"
                (click)="setCustom()" title="Any start and length">Custom</button>
      </div>

      <!-- Where the window falls in the video. -->
      <div class="lt-bar" [title]="(w[0] | number:'1.1-1') + 's – ' + (w[1] | number:'1.1-1') + 's'">
        <span class="lt-fill" [style.left.%]="pct(w[0])" [style.width.%]="pct(w[1]) - pct(w[0])"></span>
        <span class="lt-head" [style.left.%]="pct(state.currentTime())"></span>
      </div>

      @if (mode() === 'clips') {
        <div class="lt-row">
          <span class="lt-lbl">From</span>
          <select class="lt-sel" [value]="clipRange()[0]" (change)="setClips(+$any($event.target).value, clipRange()[1])"
                  aria-label="First clip">
            @for (c of clips(); track c.index) { <option [value]="c.index">{{ c.label }}</option> }
          </select>
        </div>
        <div class="lt-row">
          <span class="lt-lbl">To</span>
          <select class="lt-sel" [value]="clipRange()[1]" (change)="setClips(clipRange()[0], +$any($event.target).value)"
                  aria-label="Last clip">
            @for (c of clips(); track c.index) {
              <option [value]="c.index" [disabled]="c.index < clipRange()[0]">{{ c.label }}</option>
            }
          </select>
        </div>
      }

      @if (mode() === 'custom') {
        <div class="lt-row">
          <span class="lt-lbl">Start</span>
          <input type="number" class="lt-num" min="0" step="0.1" [value]="w[0] | number:'1.0-2'"
                 (change)="setStart($any($event.target).value)" aria-label="Start (seconds)" />
          <span class="lt-unit">s</span>
          <button type="button" class="lt-mini" (click)="startAtPlayhead()" title="Start at the playhead, keeping the length">⏱ Here</button>
        </div>
        <div class="lt-row">
          <span class="lt-lbl">Length</span>
          <input type="number" class="lt-num" min="0.1" step="0.1" [value]="layer().end == null ? '' : (w[1] - w[0] | number:'1.0-2')"
                 placeholder="to end" (change)="setLength($any($event.target).value)" aria-label="Length (seconds); empty runs to the end" />
          <span class="lt-unit">s</span>
          <span class="lt-hint">ends {{ w[1] | number:'1.1-1' }}s</span>
        </div>
        <div class="lt-chips">
          @for (s of quick; track s) {
            <button type="button" class="lt-chip" [class.on]="layer().end != null && near(w[1] - w[0], s)"
                    (click)="setLength(s)">{{ s }}s</button>
          }
          <button type="button" class="lt-chip" [class.on]="layer().end == null" (click)="setLength('')"
                  title="Until the video ends">to end</button>
        </div>
      }

      <div class="lt-foot">
        <span class="lt-hint">{{ summary() }}</span>
        <button type="button" class="lt-mini" (click)="state.seekTo(w[0])" title="Move the playhead to where it starts">⏮ Go to start</button>
      </div>
    </div>
  `,
  styles: [`
    .lt { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
    .lt-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: #0b1020;
      border: 1px solid #263044; border-radius: 6px; padding: 2px; }
    .lt-seg button { background: none; border: 0; color: #94a3b8; font-size: .7rem; padding: 3px 0; border-radius: 4px; cursor: pointer; }
    .lt-seg button.on { background: #312e81; color: #e0e7ff; }
    .lt-seg button:disabled { opacity: .4; cursor: not-allowed; }
    .lt-bar { position: relative; height: 6px; background: #1e293b; border-radius: 3px; }
    .lt-fill { position: absolute; top: 0; bottom: 0; background: #6366f1; border-radius: 3px; min-width: 2px; }
    .lt-head { position: absolute; top: -2px; bottom: -2px; width: 2px; background: #f8fafc; translate: -1px 0; }
    .lt-row { display: flex; align-items: center; gap: 6px; }
    .lt-lbl { width: 44px; font-size: .7rem; color: #94a3b8; flex-shrink: 0; }
    .lt-num { width: 64px; background: #0b1020; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px;
      font-size: .72rem; padding: 2px 5px; }
    .lt-sel { flex: 1; min-width: 0; background: #0b1020; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 4px; font-size: .72rem; padding: 2px 4px; }
    .lt-unit, .lt-hint { font-size: .68rem; color: #64748b; }
    .lt-chips { display: flex; flex-wrap: wrap; gap: 4px; padding-left: 50px; }
    .lt-chip { background: #111827; border: 1px solid #334155; color: #cbd5e1; font-size: .68rem;
      padding: 1px 8px; border-radius: 10px; cursor: pointer; }
    .lt-chip.on { background: #4f46e5; border-color: #6366f1; color: #fff; }
    .lt-mini { background: #111827; border: 1px solid #334155; color: #cbd5e1; font-size: .68rem;
      padding: 1px 6px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
    .lt-foot { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  `],
})
export class LayerTimingComponent {
  readonly state = inject(StudioStateService);
  readonly layer = input.required<FrameTiming & { id: string }>();
  readonly quick = QUICK_SECONDS;

  private readonly duration = computed(() => Math.max(0.1, this.state.contentDurationSeconds()));

  readonly window = computed(() => layerWindow(this.layer(), this.duration()));

  readonly clips = computed(() => this.state.clipSchedule().map((c) => ({
    index: c.index,
    start: c.startSeconds,
    end: c.endSeconds,
    label: `${c.index + 1} · ${c.clip.name} (${c.startSeconds.toFixed(1)}–${c.endSeconds.toFixed(1)}s)`,
  })));

  /** The clips the window lines up with exactly, or null when it does not. */
  private readonly matchedClips = computed<[number, number] | null>(() => {
    const { start, end } = this.layer();
    if (start == null || end == null) return null;
    const clips = this.clips();
    const first = clips.find((c) => this.near(c.start, start));
    const last = clips.find((c) => this.near(c.end, end));
    return first && last && last.index >= first.index ? [first.index, last.index] : null;
  });

  /** Custom picked over a window that also lines up with clips: show the numbers, not the clips. */
  private readonly pickedCustom = signal(false);

  readonly mode = computed<Mode>(() => {
    const { start, end } = this.layer();
    if (start == null && end == null) return 'whole';
    return this.matchedClips() && !this.pickedCustom() ? 'clips' : 'custom';
  });

  readonly clipRange = computed<[number, number]>(() => this.matchedClips() ?? [this.currentIndex(), this.currentIndex()]);

  readonly currentIndex = computed(() => this.state.currentScheduledClip()?.index ?? 0);

  readonly summary = computed(() => {
    const [s, e] = this.window();
    if (this.mode() === 'whole') return `Shows for the whole ${e.toFixed(1)}s`;
    const range = this.matchedClips();
    const what = range ? (range[0] === range[1] ? `clip ${range[0] + 1}` : `clips ${range[0] + 1}–${range[1] + 1}`) : `${s.toFixed(1)}s → ${e.toFixed(1)}s`;
    return `Shows on ${what} · ${(e - s).toFixed(1)}s`;
  });

  pct(seconds: number): number {
    return Math.min(100, Math.max(0, (seconds / this.duration()) * 100));
  }

  near(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.02;
  }

  setWhole(): void {
    this.pickedCustom.set(false);
    this.state.updateFrameLayerTiming(this.layer().id, { start: null, end: null });
  }

  setClips(from: number, to: number): void {
    this.pickedCustom.set(false);
    const clips = this.clips();
    const a = clips.find((c) => c.index === from);
    const b = clips.find((c) => c.index === Math.max(from, to));
    if (a && b) this.state.updateFrameLayerTiming(this.layer().id, { start: a.start, end: b.end });
  }

  /** Custom starts from the window it has, or 3 seconds at the playhead when it had none. */
  setCustom(): void {
    this.pickedCustom.set(true);
    const { start, end } = this.layer();
    if (start == null && end == null) this.state.frameLayerFromPlayhead(this.layer().id, 3);
  }

  setStart(value: string): void {
    const start = Number(value);
    if (!Number.isFinite(start) || value === '') return;
    const { end } = this.layer();
    const [s, e] = this.window();
    // Moving the start keeps the length, so a 3s title stays a 3s title.
    this.state.updateFrameLayerTiming(this.layer().id, { start, end: end == null ? null : start + (e - s) });
  }

  setLength(value: string | number): void {
    const text = String(value).trim();
    const start = this.window()[0];
    if (text === '') {
      this.state.updateFrameLayerTiming(this.layer().id, { start, end: null });
      return;
    }
    const length = Number(text);
    if (!Number.isFinite(length) || length <= 0) return;
    this.state.updateFrameLayerTiming(this.layer().id, { start, end: start + length });
  }

  startAtPlayhead(): void {
    const [s, e] = this.window();
    const t = Math.round(this.state.currentTime() * 100) / 100;
    this.state.updateFrameLayerTiming(this.layer().id, { start: t, end: this.layer().end == null ? null : t + (e - s) });
  }
}
