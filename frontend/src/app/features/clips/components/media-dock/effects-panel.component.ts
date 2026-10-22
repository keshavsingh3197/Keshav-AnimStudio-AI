import { Component, OnDestroy, OnInit, computed, inject, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiFailure } from '../../../../core/interceptors/api-error.interceptor';
import {
  EFFECT_CATEGORIES, EffectCategory, EffectClip, effectCategoryIcon, effectCategoryLabel,
} from '../../../../core/models/effects.models';
import { EffectsService } from '../../../../core/services/effects.service';
import { StudioStateService } from '../../services/studio-state.service';

/**
 * The Effects tab of the media panel: the user's effects library, favourites first, ready to
 * drop on the timeline or add at the playhead / at the end. Adding copies the effect into
 * this project once; the studio places it (see StudioStateService.addEffect).
 */
@Component({
  selector: 'app-effects-panel',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="ef">
      <div class="ef-head">
        <button type="button" class="ef-back" (click)="closed.emit()" title="Back to this project media">‹ Media</button>
        <strong class="ef-title">✨ Effects</strong>
        <a class="ef-manage" routerLink="/effects" target="_blank" rel="noopener" title="Upload and organise effects (opens a new tab)">Manage ↗</a>
      </div>

      <div class="ef-filters">
        <input type="search" class="media-search-input ef-search" placeholder="Search effects..." maxlength="100"
               [ngModel]="query()" (ngModelChange)="query.set($event)" aria-label="Search effects" />
        <select class="ef-select" [ngModel]="category()" (ngModelChange)="category.set($event)" aria-label="Category">
          <option value="">All</option>
          @for (c of categories; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
        </select>
      </div>

      @if (loading()) {
        <p class="ef-note">Loading your effects...</p>
      } @else if (error(); as err) {
        <p class="ef-note err">{{ err }} <button type="button" class="ef-link" (click)="load()">Retry</button></p>
      } @else if (effects().length === 0) {
        <div class="ef-empty">
          <span class="ef-empty-icon">✨</span>
          <p>Your effects library is empty.</p>
          <p class="ef-note">Upload subscribe buttons, stingers, end screens and sounds once on the
            <a routerLink="/effects" target="_blank" rel="noopener">Effects page</a>, or use 🌟 on any file here to save it.</p>
        </div>
      } @else if (visible().length === 0) {
        <p class="ef-note">Nothing matches.</p>
      } @else {
        <ul class="ef-list">
          @for (e of visible(); track e.id) {
            <li class="ef-row" draggable="true" (dragstart)="onDragStart(e, $event)" (dragend)="state.draggingEffect.set(null)"
                title="Drag onto the timeline, or use the buttons">
              <div class="ef-thumb" [attr.data-kind]="e.kind">
                @if (e.kind === 'Audio') {
                  <button type="button" class="ef-play" (click)="toggleAudio(e)" [attr.aria-label]="playingId() === e.id ? 'Stop' : 'Play'">
                    {{ playingId() === e.id ? '⏸' : '▶' }}
                  </button>
                } @else if (thumbUrl(e); as t) {
                  <img [src]="t" loading="lazy" alt="" draggable="false" />
                } @else {
                  <span>🎬</span>
                }
              </div>
              <div class="ef-info">
                <span class="ef-name">
                  @if (e.favorite) { <span class="ef-star">★</span> }
                  {{ e.name }}
                </span>
                <span class="ef-meta">
                  {{ icon(e.category) }} {{ label(e.category) }}
                  @if (e.durationSeconds) { · {{ e.durationSeconds | number:'1.1-1' }}s }
                  @if (e.isGreenScreen) { · <span class="ef-gs">GS</span> }
                  @if (e.hasAlpha) { · α }
                </span>
              </div>
              <div class="ef-actions">
                @if (state.addingEffectIds().has(e.id)) {
                  <span class="ef-note">Adding...</span>
                } @else {
                  <button type="button" class="ef-btn" (click)="state.addEffect(e, 'playhead')" title="Add at the playhead">+ Here</button>
                  @if (e.kind !== 'Audio') {
                    <button type="button" class="ef-btn" (click)="state.addEffect(e, 'end')" title="Add so it finishes with the video">+ End</button>
                  }
                }
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .ef { display: flex; flex-direction: column; gap: 8px; min-height: 0; flex: 1; }
    .ef-head { display: flex; align-items: center; gap: 8px; }
    .ef-title { flex: 1; font-size: .86rem; }
    .ef-back, .ef-btn, .ef-link { background: var(--surface-2, #161b27); border: 1px solid var(--border); color: var(--text-dim, #c4cadc);
      border-radius: 6px; padding: 3px 8px; font-size: .74rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .ef-back:hover, .ef-btn:hover { color: #fff; border-color: var(--brand); transform: none; }
    .ef-manage { font-size: .74rem; color: var(--brand-bright, #8aa4ff); text-decoration: none; white-space: nowrap; }
    .ef-filters { display: flex; gap: 6px; }
    .ef-search { flex: 1; min-width: 0; }
    .ef-select { width: auto; max-width: 45%; font-size: .76rem; padding: 3px 6px; background: var(--surface-3, #1c2333); color: var(--text); border: 1px solid var(--border); border-radius: 6px; }
    .ef-note { margin: 0; font-size: .76rem; color: var(--muted); }
    .ef-note.err { color: var(--err); }
    .ef-empty { text-align: center; padding: 18px 8px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .ef-empty p { margin: 0; font-size: .82rem; }
    .ef-empty-icon { font-size: 1.6rem; opacity: .7; }
    .ef-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; overflow-y: auto; min-height: 0; }
    .ef-row { display: flex; align-items: center; gap: 8px; padding: 6px; border: 1px solid var(--border); border-radius: 8px;
      background: rgba(21, 26, 38, .7); cursor: grab; }
    .ef-row:hover { border-color: color-mix(in srgb, var(--brand) 50%, var(--border)); }
    .ef-thumb { flex: none; width: 64px; aspect-ratio: 16 / 9; border-radius: 5px; overflow: hidden; display: grid; place-items: center;
      background: repeating-conic-gradient(#171c2a 0 25%, #10141f 0 50%) 0 0 / 10px 10px; }
    .ef-thumb[data-kind='Audio'] { background: linear-gradient(135deg, #12213a, #0e1626); }
    .ef-thumb img { width: 100%; height: 100%; object-fit: contain; }
    .ef-play { background: none; border: none; color: var(--accent-cyan, #06b6d4); font-size: .95rem; padding: 0; cursor: pointer; }
    .ef-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .ef-name { font-size: .8rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ef-star { color: var(--warn, #f59e0b); }
    .ef-meta { font-size: .7rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ef-gs { color: var(--ok, #22d36b); font-weight: 700; }
    .ef-actions { display: flex; flex-direction: column; gap: 4px; flex: none; }
  `],
})
export class EffectsPanelComponent implements OnInit, OnDestroy {
  readonly state = inject(StudioStateService);
  private readonly api = inject(EffectsService);

  readonly closed = output<void>();

  readonly categories = EFFECT_CATEGORIES;
  readonly label = effectCategoryLabel;
  readonly icon = effectCategoryIcon;

  readonly effects = signal<EffectClip[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly category = signal<EffectCategory | ''>('');
  readonly playingId = signal<string | null>(null);
  private audio: HTMLAudioElement | null = null;

  /** The server already orders favourites first, then most used. */
  readonly visible = computed(() => {
    const cat = this.category();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.effects().filter((e) =>
      (!cat || e.category === cat)
      && words.every((w) => e.name.toLowerCase().includes(w) || e.tags.some((t) => t.includes(w))));
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.stopAudio();
    this.state.draggingEffect.set(null);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.effects.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(err instanceof ApiFailure ? err.message : 'Could not load your effects.');
        this.loading.set(false);
      },
    });
  }

  thumbUrl(effect: EffectClip): string | null {
    return this.api.thumbnailUrl(effect);
  }

  onDragStart(effect: EffectClip, event: DragEvent): void {
    this.state.draggingEffect.set(effect);
    // Firefox starts no drag without data; the timeline reads the effect from state.
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/x-animstudio-effect', effect.id);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  toggleAudio(effect: EffectClip): void {
    if (this.playingId() === effect.id) {
      this.stopAudio();
      return;
    }
    this.stopAudio();
    if (this.state.isPlaying()) this.state.pause();
    const audio = new Audio(this.api.contentUrl(effect.id));
    audio.onended = () => this.playingId.set(null);
    audio.onerror = () => this.playingId.set(null);
    audio.play().catch(() => this.playingId.set(null));
    this.audio = audio;
    this.playingId.set(effect.id);
  }

  private stopAudio(): void {
    this.audio?.pause();
    this.audio = null;
    this.playingId.set(null);
  }
}
