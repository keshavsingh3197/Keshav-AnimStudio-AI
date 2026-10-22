import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  EFFECT_ACCEPT, EFFECT_CATEGORIES, EffectCategory, EffectClip, EffectKind,
  effectCategoryIcon, effectCategoryLabel,
} from '../../core/models/effects.models';
import { EffectsService } from '../../core/services/effects.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

/** The inline editor's working copy of one card. */
interface EffectDraft {
  id: string;
  name: string;
  category: EffectCategory;
  tags: string;
  isGreenScreen: boolean;
}

/**
 * Effects & overlays: the user's own library of subscribe buttons, stingers, end screens,
 * lower thirds, sound effects and green-screen clips. Uploaded once here, then added to any
 * video from the editor's media panel. Everything is the signed-in user's; the server checks
 * that on every call.
 */
@Component({
  selector: 'app-effects-library',
  standalone: true,
  imports: [FormsModule, DecimalPipe, FileDropDirective],
  templateUrl: './effects-library.component.html',
  styleUrl: './effects-library.component.css',
})
export class EffectsLibraryComponent implements OnInit, OnDestroy {
  private readonly api = inject(EffectsService);
  private readonly status = inject(StatusService);

  readonly categories = EFFECT_CATEGORIES;
  readonly accept = EFFECT_ACCEPT;
  readonly categoryLabel = effectCategoryLabel;
  readonly categoryIcon = effectCategoryIcon;

  readonly effects = signal<EffectClip[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly category = signal<EffectCategory | 'all'>('all');
  readonly kind = signal<EffectKind | ''>('');
  readonly query = signal('');
  readonly favoritesOnly = signal(false);

  /** Category for the next upload; empty lets the server file it by type. */
  readonly uploadCategory = signal<EffectCategory | ''>('');
  readonly uploadGreen = signal(false);
  readonly uploading = signal(false);
  readonly uploadDone = signal(0);
  readonly uploadTotal = signal(0);
  readonly uploadPercent = signal(0);

  /** The card whose video is playing, or whose sound is. One at a time. */
  readonly previewId = signal<string | null>(null);
  private audio: HTMLAudioElement | null = null;

  readonly draft = signal<EffectDraft | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  readonly counts = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.effects()) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  });

  /** Same order the server sends (favourites, then most used, then newest), narrowed here so chips are instant. */
  readonly visible = computed(() => {
    const cat = this.category();
    const kind = this.kind();
    const fav = this.favoritesOnly();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.effects().filter((e) =>
      (cat === 'all' || e.category === cat)
      && (!kind || e.kind === kind)
      && (!fav || e.favorite)
      && words.every((w) =>
        e.name.toLowerCase().includes(w)
        || effectCategoryLabel(e.category).toLowerCase().includes(w)
        || e.tags.some((t) => t.includes(w))));
  });

  readonly filtersActive = computed(() =>
    this.category() !== 'all' || !!this.kind() || this.favoritesOnly() || !!this.query().trim());

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.stopAudio();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.effects.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(this.errorText(err, 'Could not load your effects. Try again.'));
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.category.set('all');
    this.kind.set('');
    this.favoritesOnly.set(false);
    this.query.set('');
  }

  // ---------------------------------------------------------------- upload

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.uploadFiles(files);
  }

  /** One at a time, so a long video doesn't starve the rest and each failure names its file. */
  uploadFiles(files: File[]): void {
    if (files.length === 0 || this.uploading()) return;
    this.uploading.set(true);
    this.uploadDone.set(0);
    this.uploadTotal.set(files.length);

    const failures: string[] = [];
    const next = (index: number): void => {
      if (index >= files.length) {
        this.uploading.set(false);
        this.uploadPercent.set(0);
        const added = files.length - failures.length;
        this.status.notify([
          ...(added > 0 ? [`Added ${added} effect${added === 1 ? '' : 's'} to your library.`] : []),
          ...failures,
        ]);
        return;
      }
      this.uploadPercent.set(0);
      this.api.upload({
        file: files[index],
        category: this.uploadCategory() || null,
        isGreenScreen: this.uploadGreen(),
      }, (p) => this.uploadPercent.set(p)).subscribe({
        next: (effect) => {
          this.effects.update((list) => [effect, ...list.filter((e) => e.id !== effect.id)]);
          this.uploadDone.update((n) => n + 1);
          next(index + 1);
        },
        error: (err) => {
          failures.push(`${files[index].name}: ${this.errorText(err, 'could not be added.')}`);
          this.uploadDone.update((n) => n + 1);
          next(index + 1);
        },
      });
    };
    next(0);
  }

  // ---------------------------------------------------------------- preview

  thumbUrl(effect: EffectClip): string | null {
    return this.api.thumbnailUrl(effect);
  }

  contentUrl(effect: EffectClip): string {
    return this.api.contentUrl(effect.id);
  }

  /** Hover starts a video preview; a tap does too on touch screens, where there is no hover. */
  startPreview(effect: EffectClip): void {
    if (effect.kind === 'Video') this.previewId.set(effect.id);
  }

  stopPreview(effect: EffectClip): void {
    if (effect.kind === 'Video' && this.previewId() === effect.id) this.previewId.set(null);
  }

  togglePreview(effect: EffectClip): void {
    if (effect.kind === 'Audio') {
      this.toggleAudio(effect);
      return;
    }
    if (effect.kind === 'Video') this.previewId.set(this.previewId() === effect.id ? null : effect.id);
  }

  toggleAudio(effect: EffectClip, event?: Event): void {
    event?.stopPropagation();
    if (this.previewId() === effect.id) {
      this.stopAudio();
      return;
    }
    this.stopAudio();
    const audio = new Audio(this.contentUrl(effect));
    audio.onended = () => this.previewId.set(null);
    audio.onerror = () => this.previewId.set(null);
    audio.play().catch(() => this.previewId.set(null));
    this.audio = audio;
    this.previewId.set(effect.id);
  }

  private stopAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.previewId.set(null);
  }

  // ---------------------------------------------------------------- edit

  toggleFavorite(effect: EffectClip): void {
    this.save(effect.id, { favorite: !effect.favorite });
  }

  startEdit(effect: EffectClip): void {
    this.confirmDeleteId.set(null);
    this.draft.set({
      id: effect.id,
      name: effect.name,
      category: effect.category,
      tags: effect.tags.join(', '),
      isGreenScreen: effect.isGreenScreen,
    });
  }

  patchDraft(patch: Partial<EffectDraft>): void {
    const d = this.draft();
    if (d) this.draft.set({ ...d, ...patch });
  }

  saveDraft(): void {
    const d = this.draft();
    if (!d) return;
    const tags = d.tags.split(',').map((t) => t.trim()).filter(Boolean);
    this.save(d.id, { name: d.name, category: d.category, tags, isGreenScreen: d.isGreenScreen }, () => this.draft.set(null));
  }

  private save(id: string, body: Parameters<EffectsService['update']>[1], done?: () => void): void {
    this.busyId.set(id);
    this.api.update(id, body).subscribe({
      next: (updated) => {
        this.effects.update((list) => list.map((e) => (e.id === id ? updated : e)));
        this.busyId.set(null);
        done?.();
      },
      error: (err) => {
        this.busyId.set(null);
        this.status.notify([this.errorText(err, 'Could not save that change.')]);
      },
    });
  }

  remove(effect: EffectClip): void {
    this.busyId.set(effect.id);
    this.api.delete(effect.id).subscribe({
      next: () => {
        if (this.previewId() === effect.id) this.stopAudio();
        this.effects.update((list) => list.filter((e) => e.id !== effect.id));
        this.confirmDeleteId.set(null);
        this.busyId.set(null);
      },
      error: (err) => {
        this.busyId.set(null);
        this.status.notify([this.errorText(err, 'Could not delete that effect.')]);
      },
    });
  }

  sizeLabel(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private errorText(err: unknown, fallback: string): string {
    if (err instanceof ApiFailure) return err.hint ? `${err.message} ${err.hint}` : err.message;
    return fallback;
  }
}
