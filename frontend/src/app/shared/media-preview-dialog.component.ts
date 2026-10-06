import { Component, computed, input, output, signal } from '@angular/core';

/** What the dialog plays and describes. Exactly one of `src` (playable) or `externalUrl` (a link) is normally set. */
export interface MediaPreview {
  title: string;
  /** "Video", "Song", "Clip Studio export", ... */
  type: string;
  /** Playable URL: an object URL or an API content URL. */
  src?: string;
  /** Plays as audio, with `coverSrc` (or a placeholder) as the picture. */
  audio?: boolean;
  coverSrc?: string;
  /** A link that can't be played here; shown with its thumbnail and opened on its own site. */
  externalUrl?: string;
  thumbnailUrl?: string;
  /** Known up front; replaced by the player's own measurement once it loads. */
  durationSeconds?: number;
  /** Extra facts, e.g. "1920×1080", "48 MB", "From RAM NAM KI MAHIMA". */
  facts?: string[];
  /** A note shown under the facts, e.g. how a song will look on air. */
  note?: string;
}

/**
 * A centred preview of one source - play it and check its length, size and type - before
 * it goes into a stream. Optionally offers an "Add" action, for previews opened from a picker.
 *
 *   @if (preview(); as p) {
 *     <app-media-preview-dialog [preview]="p" [canAdd]="true" (add)="..." (closed)="preview.set(null)" />
 *   }
 */
@Component({
  selector: 'app-media-preview-dialog',
  standalone: true,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="mp-backdrop" (click)="closed.emit()">
      <div class="mp-dialog" role="dialog" aria-modal="true" [attr.aria-label]="'Preview: ' + preview().title"
           (click)="$event.stopPropagation()">
        <div class="mp-head">
          <div class="mp-title">
            <span class="mp-type">{{ preview().type }}</span>
            <h4>{{ preview().title }}</h4>
          </div>
          <button type="button" class="mp-x" aria-label="Close preview" (click)="closed.emit()">✕</button>
        </div>

        <div class="mp-stage">
          @if (preview().src; as src) {
            @if (preview().audio) {
              <div class="mp-audio">
                @if (preview().coverSrc; as cover) {
                  <img [src]="cover" alt="Cover art" class="mp-cover" />
                } @else {
                  <div class="mp-cover mp-cover-none">🎵</div>
                }
                <audio [src]="src" controls autoplay (loadedmetadata)="measure($event)" (error)="failed.set(true)"></audio>
              </div>
            } @else {
              <video [src]="src" controls autoplay playsinline
                     (loadedmetadata)="measure($event)" (error)="failed.set(true)"></video>
            }
            @if (failed()) {
              <p class="mp-err">This file can't be played in the browser. It can still be streamed - converting it is part of preparing.</p>
            }
          } @else if (preview().externalUrl; as url) {
            <div class="mp-link">
              @if (preview().thumbnailUrl; as thumb) {
                <img [src]="thumb" alt="" referrerpolicy="no-referrer" />
              } @else {
                <div class="mp-cover mp-cover-none">🔗</div>
              }
              <p class="mp-muted">Links are downloaded on the server when the stream is prepared - after that every item can be watched exactly as it will be sent.</p>
              <a [href]="url" target="_blank" rel="noopener noreferrer">Open on its site ↗</a>
            </div>
          }
        </div>

        <dl class="mp-facts">
          <div><dt>Type</dt><dd>{{ preview().type }}</dd></div>
          <div><dt>Length</dt><dd>{{ duration() != null ? clock(duration()!) : 'unknown until prepared' }}</dd></div>
          @if (size(); as s) { <div><dt>Picture</dt><dd>{{ s }}</dd></div> }
          @for (f of preview().facts ?? []; track f) { <div><dt></dt><dd>{{ f }}</dd></div> }
        </dl>
        @if (preview().note) { <p class="mp-muted mp-note">{{ preview().note }}</p> }

        <div class="mp-actions">
          <button type="button" class="secondary" (click)="closed.emit()">Close</button>
          @if (canAdd()) {
            <button type="button" (click)="add.emit()">＋ Add to playlist</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mp-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(2, 6, 23, 0.78);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .mp-dialog { background: var(--surface, #0f172a); border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
      border-radius: 12px; padding: 1rem 1.25rem; width: min(820px, 100%); max-height: calc(100vh - 32px);
      overflow: auto; color: var(--text, #e2e8f0); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
    .mp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: .75rem; }
    .mp-title { min-width: 0; }
    .mp-title h4 { margin: .15rem 0 0; font-size: 1.05rem; overflow-wrap: anywhere; }
    .mp-type { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--brand, #6c8cff); font-weight: 700; }
    .mp-x { background: transparent; border: 0; color: inherit; font-size: 1.1rem; cursor: pointer; padding: .2rem .4rem; }
    .mp-stage { background: #000; border-radius: 8px; overflow: hidden; }
    .mp-stage video { display: block; width: 100%; max-height: 60vh; background: #000; }
    .mp-audio { display: grid; justify-items: center; gap: .75rem; padding: 1.25rem; }
    .mp-audio audio { width: min(520px, 100%); }
    .mp-cover { width: min(260px, 60vw); aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
    .mp-cover-none { display: grid; place-items: center; font-size: 3rem; background: #111827; }
    .mp-link { display: grid; justify-items: center; gap: .6rem; padding: 1.25rem; text-align: center; }
    .mp-link img { max-width: 100%; max-height: 50vh; border-radius: 8px; }
    .mp-err { color: #fca5a5; font-size: .85rem; padding: .5rem .75rem; margin: 0; background: #111827; }
    .mp-muted { color: var(--muted, #94a3b8); font-size: .85rem; margin: 0; }
    .mp-note { margin-top: .5rem; }
    .mp-facts { display: flex; flex-wrap: wrap; gap: .4rem 1.25rem; margin: .9rem 0 0; font-size: .85rem; }
    .mp-facts div { display: flex; gap: .35rem; }
    .mp-facts dt { color: var(--muted, #94a3b8); }
    .mp-facts dd { margin: 0; font-variant-numeric: tabular-nums; }
    .mp-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
  `],
})
export class MediaPreviewDialogComponent {
  readonly preview = input.required<MediaPreview>();
  readonly canAdd = input(false);

  readonly add = output<void>();
  readonly closed = output<void>();
  /** The player's own measurements, for the playlist to keep. */
  readonly measured = output<{ durationSeconds: number; width?: number; height?: number }>();

  readonly failed = signal(false);
  private readonly measuredDuration = signal<number | null>(null);
  private readonly measuredSize = signal<string | null>(null);

  readonly duration = computed(() => this.measuredDuration() ?? this.preview().durationSeconds ?? null);
  readonly size = computed(() => this.measuredSize());

  measure(event: Event): void {
    const media = event.target as HTMLMediaElement;
    const seconds = Number.isFinite(media.duration) ? media.duration : NaN;
    const video = media instanceof HTMLVideoElement && media.videoWidth > 0 ? media : null;
    if (video) this.measuredSize.set(`${video.videoWidth}×${video.videoHeight}`);
    if (!Number.isNaN(seconds)) {
      this.measuredDuration.set(seconds);
      this.measured.emit({ durationSeconds: seconds, width: video?.videoWidth, height: video?.videoHeight });
    }
  }

  clock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = (total % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`;
  }
}
