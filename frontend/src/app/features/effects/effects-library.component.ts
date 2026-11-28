import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  EFFECT_ACCEPT, EFFECT_CATEGORIES, EffectCategory, EffectClip, EffectKind, SfxLibraryEntry,
  effectCategoryIcon, effectCategoryLabel,
} from '../../core/models/effects.models';
import { EffectsService } from '../../core/services/effects.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { LoadingStateComponent } from '../../shared/loading-state.component';
import { drawReaction, REACTION_PRESETS, ReactionExpression } from './reaction-graphic';
import {
  drawStudioGraphic,
  generateStudioAnimatedClipFile,
  generateStudioGraphicFile,
  generateStudioSfxFile,
  STUDIO_GRAPHIC_TEMPLATES,
  STUDIO_SFX_PRESETS,
  STUDIO_VIDEO_PRESETS,
  StudioAnimatedClipId,
  StudioGraphicTemplateId,
  StudioSfxId,
  StudioThemeId,
} from './studio-effect-generators';

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
  imports: [FormsModule, DecimalPipe, FileDropDirective, RouterLink, LoadingStateComponent],
  templateUrl: './effects-library.component.html',
  styleUrl: './effects-library.component.css',
})
export class EffectsLibraryComponent implements OnInit, OnDestroy {
  private readonly api = inject(EffectsService);
  private readonly media = inject(MediaToolsService);
  private readonly status = inject(StatusService);
  readonly reactionsPage = inject(ActivatedRoute).snapshot.data['reactions'] === true;

  readonly categories = EFFECT_CATEGORIES;
  readonly accept = EFFECT_ACCEPT;
  readonly categoryLabel = effectCategoryLabel;
  readonly categoryIcon = effectCategoryIcon;

  readonly effects = signal<EffectClip[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly category = signal<EffectCategory | 'all'>(this.reactionsPage ? 'Reaction' : 'all');
  readonly kind = signal<EffectKind | ''>('');
  readonly query = signal('');
  readonly favoritesOnly = signal(false);
  readonly selectedTag = signal<string>('');
  readonly quickTags = ['comedy', 'meme', 'bandook', 'reaction', 'devotional', 'temple'] as const;

  readonly sfxLibrary = signal<SfxLibraryEntry[]>([]);
  readonly sfxGenre = signal<'all' | 'comedy' | 'devotional'>('all');
  readonly sfxImporting = signal(false);
  readonly sfxPreview = new Audio();
  readonly visibleSfx = computed(() => {
    const g = this.sfxGenre();
    return g === 'all' ? this.sfxLibrary() : this.sfxLibrary().filter((s) => s.genre === g);
  });

  /** Category for the next upload; empty lets the server file it by type. */
  readonly uploadCategory = signal<EffectCategory | ''>(this.reactionsPage ? 'Reaction' : '');
  readonly uploadGreen = signal(false);
  readonly uploading = signal(false);
  readonly uploadDone = signal(0);
  readonly uploadTotal = signal(0);
  readonly uploadPercent = signal(0);
  readonly reactionPresets = REACTION_PRESETS;
  readonly graphicTemplates = STUDIO_GRAPHIC_TEMPLATES;
  readonly sfxPresets = STUDIO_SFX_PRESETS;
  readonly videoPresets = STUDIO_VIDEO_PRESETS;

  readonly generatorTab = signal<'graphics' | 'reactions' | 'audioVideo'>(
    this.reactionsPage ? 'reactions' : 'graphics',
  );
  readonly studioTemplate = signal<StudioGraphicTemplateId>('subscribe-pill');
  readonly studioTheme = signal<StudioThemeId>('royal-gold');
  readonly studioAspect = signal<'16:9' | '9:16'>('16:9');
  readonly studioTitle = signal('KESHAV STUDIO');
  readonly studioSubtitle = signal('Subscribe for 3D Comedy & Music');
  readonly studioPreview = signal<string | null>(null);
  readonly studioBusy = signal(false);
  readonly studioStatus = signal<string | null>(null);
  readonly studioError = signal<string | null>(null);
  readonly playingSfxId = signal<StudioSfxId | null>(null);
  private synthAudioUrl: string | null = null;

  readonly reactionExpression = signal<ReactionExpression>('surprised');
  readonly reactionCaption = signal('');
  readonly reactionPreview = signal<string | null>(null);
  readonly linkUrl = signal('');
  readonly linkType = signal<'platform' | 'file'>('platform');
  readonly linkRights = signal(false);
  readonly linkBusy = signal(false);
  readonly linkError = signal<string | null>(null);
  readonly linkNotice = signal<string | null>(null);

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
    const tag = this.selectedTag().trim().toLowerCase();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.effects().filter((e) =>
      (cat === 'all' || e.category === cat)
      && (!kind || e.kind === kind)
      && (!fav || e.favorite)
      && (!tag || e.tags.some((t) => t.toLowerCase() === tag))
      && words.every((w) =>
        e.name.toLowerCase().includes(w)
        || effectCategoryLabel(e.category).toLowerCase().includes(w)
        || e.tags.some((t) => t.includes(w))));
  });

  readonly filtersActive = computed(() =>
    this.category() !== 'all' || !!this.kind() || this.favoritesOnly() || !!this.selectedTag() || !!this.query().trim());

  ngOnInit(): void {
    this.makeStudioGraphicPreview();
    this.makeReaction();
    this.load();
    this.loadSfxLibrary();
  }

  ngOnDestroy(): void {
    this.stopAudio();
    this.sfxPreview.pause();
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
    this.selectedTag.set('');
    this.query.set('');
  }

  loadSfxLibrary(): void {
    this.api.getSfxLibrary().subscribe({
      next: (items) => this.sfxLibrary.set(items ?? []),
      error: () => { /* optional built-in pack */ },
    });
  }

  previewPackSfx(item: SfxLibraryEntry): void {
    this.sfxPreview.pause();
    this.sfxPreview.src = this.api.sfxAssetUrl(item.url);
    this.sfxPreview.currentTime = 0;
    void this.sfxPreview.play();
  }

  importSfx(req: { id?: string; genre?: string }): void {
    if (this.sfxImporting()) return;
    this.sfxImporting.set(true);
    this.api.importSfxPack(req).subscribe({
      next: (res) => {
        this.sfxImporting.set(false);
        this.status.notify([
          res.imported > 0
            ? `Added ${res.imported} tagged SFX to your Effects Library (${res.skipped} already present).`
            : 'All selected SFX are already in your Effects Library.',
        ]);
        this.load();
      },
      error: (err) => {
        this.sfxImporting.set(false);
        this.status.notify([this.errorText(err, 'Could not import SFX pack.')]);
      },
    });
  }

  selectCategory(category: EffectCategory | 'all'): void {
    this.category.set(category);
    this.uploadCategory.set(category === 'all' ? '' : category);
  }

  // ---------------------------------------------------------------- upload

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.uploadFiles(files);
  }

  /** One at a time, so a long video doesn't starve the rest and each failure names its file. */
  uploadFiles(files: File[], category = this.uploadCategory(), green = this.uploadGreen()): void {
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
        category: category || null,
        isGreenScreen: green,
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

  updateReactionExpression(value: ReactionExpression): void {
    this.reactionExpression.set(value);
    const preset = this.reactionPresets.find((p) => p.id === value);
    if (preset && !this.reactionCaption().trim()) this.reactionCaption.set(preset.defaultCaption);
    this.makeReaction();
  }

  updateReactionCaption(value: string): void {
    this.reactionCaption.set(value);
    this.reactionPreview.set(null);
  }

  makeReaction(): void {
    try {
      const canvas = document.createElement('canvas');
      drawReaction(canvas, this.reactionExpression(), this.reactionCaption());
      const preview = canvas.toDataURL('image/png');
      if (!preview.startsWith('data:image/png;base64,')) throw new Error('PNG encoding failed.');
      this.reactionPreview.set(preview);
    } catch (error) {
      this.reactionPreview.set(null);
      this.status.notify([this.errorText(error, 'Could not create the reaction graphic in this browser.')]);
    }
  }

  saveReaction(): void {
    const preview = this.reactionPreview();
    if (!preview || this.uploading() || this.studioBusy()) return;
    try {
      const bytes = Uint8Array.from(atob(preview.split(',')[1]), (character) => character.charCodeAt(0));
      const expr = this.reactionExpression();
      const file = new File([bytes], `reaction-${expr}.png`, { type: 'image/png' });
      const label = this.reactionPresets.find((p) => p.id === expr)?.label.replace(/^[^\w]+/, '').trim() || expr;
      void this.uploadGeneratedBatch([{ file, name: `Reaction: ${label}`, category: 'Reaction', tags: ['reaction', 'sticker', expr] }]);
    } catch (error) {
      this.status.notify([this.errorText(error, 'Could not prepare the reaction for upload.')]);
    }
  }

  // ---------------------------------------------------------------- studio effect generators

  makeStudioGraphicPreview(): void {
    try {
      const canvas = document.createElement('canvas');
      drawStudioGraphic(canvas, {
        template: this.studioTemplate(),
        theme: this.studioTheme(),
        title: this.studioTitle(),
        subtitle: this.studioSubtitle(),
        aspect: this.studioAspect(),
      });
      this.studioPreview.set(canvas.toDataURL('image/png'));
    } catch (err) {
      this.studioPreview.set(null);
      this.status.notify([this.errorText(err, 'Could not preview that studio graphic.')]);
    }
  }

  async saveStudioGraphic(): Promise<void> {
    if (this.studioBusy()) return;
    const tpl = this.studioTemplate();
    const meta = this.graphicTemplates.find((t) => t.id === tpl)!;
    const file = await generateStudioGraphicFile({
      template: tpl,
      theme: this.studioTheme(),
      title: this.studioTitle(),
      subtitle: this.studioSubtitle(),
      aspect: this.studioAspect(),
    });
    await this.uploadGeneratedBatch([{
      file,
      name: `${meta.label.replace(/^[^a-zA-Z0-9]+/, '').trim()} (${this.studioTheme()})`.slice(0, 80),
      category: meta.category,
      tags: [...meta.tags, this.studioTheme()],
    }]);
  }

  previewSfx(id: StudioSfxId): void {
    this.stopAudio();
    const file = generateStudioSfxFile(id);
    if (this.synthAudioUrl) URL.revokeObjectURL(this.synthAudioUrl);
    this.synthAudioUrl = URL.createObjectURL(file);
    const audio = new Audio(this.synthAudioUrl);
    audio.onended = () => this.playingSfxId.set(null);
    audio.onerror = () => this.playingSfxId.set(null);
    this.audio = audio;
    this.playingSfxId.set(id);
    void audio.play().catch(() => this.playingSfxId.set(null));
  }

  async saveSfx(id: StudioSfxId): Promise<void> {
    if (this.studioBusy()) return;
    const meta = this.sfxPresets.find((s) => s.id === id)!;
    await this.uploadGeneratedBatch([{
      file: generateStudioSfxFile(id),
      name: meta.name,
      category: 'SoundEffect',
      tags: [...meta.tags, 'sfx'],
    }]);
  }

  async saveAllSfx(): Promise<void> {
    if (this.studioBusy()) return;
    const items = this.sfxPresets.map((meta) => ({
      file: generateStudioSfxFile(meta.id),
      name: meta.name,
      category: 'SoundEffect' as EffectCategory,
      tags: [...meta.tags, 'sfx'],
    }));
    await this.uploadGeneratedBatch(items);
  }

  async saveAnimatedClip(id: StudioAnimatedClipId): Promise<void> {
    if (this.studioBusy()) return;
    const meta = this.videoPresets.find((v) => v.id === id)!;
    this.studioBusy.set(true);
    this.studioStatus.set(`Rendering animated "${meta.name}" WebM clip (~${meta.durationSec}s)...`);
    try {
      const file = await generateStudioAnimatedClipFile(id, this.studioTheme(), this.studioTitle());
      await this.uploadGeneratedBatch([{
        file,
        name: meta.name,
        category: meta.category,
        tags: [...meta.tags, this.studioTheme()],
        isGreenScreen: meta.isGreenScreen,
      }]);
    } catch (err) {
      this.status.notify([this.errorText(err, 'Could not generate animated WebM effect.')]);
      this.studioBusy.set(false);
      this.studioStatus.set(null);
    }
  }

  async installStarterPack(): Promise<void> {
    if (this.studioBusy()) return;
    this.studioBusy.set(true);
    this.studioStatus.set('Building 8 essential graphics, frames, animations & SFX...');
    try {
      const graphicIds: StudioGraphicTemplateId[] = ['subscribe-pill', 'lower-third', 'palace-frame', 'cinema-vignette', 'end-screen'];
      const items: { file: File; name: string; category: EffectCategory; tags: string[]; isGreenScreen?: boolean }[] = [];
      for (const gid of graphicIds) {
        const meta = this.graphicTemplates.find((t) => t.id === gid)!;
        const file = await generateStudioGraphicFile({
          template: gid,
          theme: this.studioTheme(),
          title: this.studioTitle(),
          subtitle: this.studioSubtitle(),
          aspect: this.studioAspect(),
        });
        items.push({
          file,
          name: meta.label.replace(/^[^a-zA-Z0-9]+/, '').trim().slice(0, 80),
          category: meta.category,
          tags: [...meta.tags, this.studioTheme()],
        });
      }
      for (const sid of ['boing', 'whoosh', 'tabla-taal'] as StudioSfxId[]) {
        const meta = this.sfxPresets.find((s) => s.id === sid)!;
        items.push({ file: generateStudioSfxFile(sid), name: meta.name, category: 'SoundEffect', tags: [...meta.tags, 'sfx'] });
      }
      await this.uploadGeneratedBatch(items);
    } finally {
      this.studioBusy.set(false);
    }
  }

  private async uploadGeneratedBatch(
    items: readonly { file: File; name: string; category: EffectCategory; tags: string[]; isGreenScreen?: boolean }[],
  ): Promise<void> {
    if (items.length === 0) return;
    this.studioBusy.set(true);
    this.studioError.set(null);
    let added = 0;
    const errors: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.studioStatus.set(`Uploading ${i + 1} of ${items.length}: ${item.name}...`);
      try {
        const effect = await firstValueFrom(this.api.upload({
          file: item.file,
          name: item.name,
          category: item.category,
          tags: item.tags,
          isGreenScreen: !!item.isGreenScreen,
        }));
        this.effects.update((list) => [effect, ...list.filter((e) => e.id !== effect.id)]);
        added++;
      } catch (err) {
        errors.push(`${item.name}: ${this.errorText(err, 'upload failed.')}`);
      }
    }
    this.studioBusy.set(false);
    this.studioStatus.set(added > 0 ? `Added ${added} effect${added === 1 ? '' : 's'} to your library!` : null);
    this.studioError.set(errors.length > 0 ? errors.join(' · ') : null);
    this.status.notify([
      ...(added > 0 ? [`Added ${added} studio effect${added === 1 ? '' : 's'} ready for your videos & clips.`] : []),
      ...errors,
    ]);
  }

  async importLink(): Promise<void> {
    if (this.linkBusy() || !this.linkRights()) return;
    this.linkError.set(null);
    this.linkNotice.set(null);
    this.linkBusy.set(true);
    try {
      let url: URL;
      try {
        url = new URL(this.linkUrl().trim());
      } catch {
        throw new Error('Enter a valid HTTPS link.');
      }
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('Enter a public HTTPS link without credentials.');

      let file: File;
      if (this.linkType() === 'platform') {
        const download = await firstValueFrom(this.media.downloadMedia({ url: url.href, format: 'mp4', resolution: 'best' }));
        if (download.fileSizeBytes > 200 * 1024 * 1024) throw new Error('Videos can be at most 200 MB.');
        const blob = await firstValueFrom(this.media.fetchFile(download.streamUrl));
        file = new File([blob], download.fileName, { type: download.mimeType });
      } else {
        const response = await fetch(url.href, { credentials: 'omit', redirect: 'follow' });
        if (!response.ok) throw new Error(`The file host returned HTTP ${response.status}.`);
        const max = 200 * 1024 * 1024;
        if (Number(response.headers.get('content-length')) > max) throw new Error('Files can be at most 200 MB.');
        if (!response.body) throw new Error('The file host returned no file.');
        const reader = response.body.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let size = 0;
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.byteLength;
            if (size > max) { await reader.cancel(); throw new Error('Files can be at most 200 MB.'); }
            chunks.push(part.value);
          }
        } finally {
          reader.releaseLock();
        }
        const name = decodeURIComponent(url.pathname.split('/').pop() || 'effect');
        file = new File(chunks, name, { type: response.headers.get('content-type')?.split(';')[0] ?? '' });
      }

      const effect = await firstValueFrom(this.api.upload({ file, category: this.uploadCategory() || null }));
      this.effects.update((list) => [effect, ...list.filter((item) => item.id !== effect.id)]);
      this.linkNotice.set(`Added "${effect.name}" to your Effects library.`);
      this.linkUrl.set('');
    } catch (error: unknown) {
      this.linkError.set(error instanceof ApiFailure ? this.errorText(error, 'Import failed.')
        : error instanceof TypeError ? 'The file host did not allow access from your browser. Download the file and upload it instead.'
        : error instanceof Error ? error.message : 'Could not import that link.');
    } finally {
      this.linkBusy.set(false);
    }
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
    if (this.synthAudioUrl) {
      URL.revokeObjectURL(this.synthAudioUrl);
      this.synthAudioUrl = null;
    }
    this.playingSfxId.set(null);
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
