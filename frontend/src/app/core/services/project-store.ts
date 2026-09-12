import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Asset, Character, Project, RendererStatus, Scene } from '../models/api.models';
import { ApiService } from './api.service';
import { StatusService } from './status.service';

/**
 * The open project and everything hanging off it.
 *
 * Provided by the project editor route rather than at the root, so the state is created
 * when a project is opened and thrown away when it is closed - and so a stale project can
 * never leak into the next one.
 */
@Injectable()
export class ProjectStore {
  private readonly api = inject(ApiService);
  private readonly status = inject(StatusService);

  readonly project = signal<Project | null>(null);

  /** Cheap to fetch - the server probes ffmpeg once at startup - and every screen wants it. */
  readonly renderer = signal<RendererStatus | null>(null);
  readonly assets = signal<Asset[]>([]);
  readonly characters = signal<Character[]>([]);
  readonly scenes = signal<Scene[]>([]);

  readonly images = computed(() => this.assets().filter((a) => a.kind === 'Image'));

  /** Anything that can supply a soundtrack: an audio file, or a video's audio track. */
  readonly playable = computed(() =>
    this.assets().filter((a) => a.kind === 'Audio' || a.kind === 'Video'));

  readonly audioOnly = computed(() => this.assets().filter((a) => a.kind === 'Audio'));
  readonly imagesOnly = computed(() => this.assets().filter((a) => a.kind === 'Image'));

  /** Imported caption files. Reference material for an import, never scene content. */
  readonly subtitles = computed(() => this.assets().filter((a) => a.kind === 'Subtitle'));

  /** Characters that can actually appear on screen. */
  readonly cast = computed(() => this.characters().filter((c) => !c.isNarrator));

  readonly scenesMissingBackground = computed(() =>
    this.scenes().filter((s) => !s.backgroundAssetId));

  readonly renderable = computed(() =>
    this.scenes().length > 0 && this.scenesMissingBackground().length === 0);

  load(projectId: string): void {
    this.status.run(
      forkJoin({
        project: this.api.getProject(projectId),
        assets: this.api.listAssets(projectId),
        characters: this.api.listCharacters(projectId),
        scenes: this.api.listScenes(projectId),
        renderer: this.api.rendererStatus(),
      }),
      (loaded) => {
        this.project.set(loaded.project);
        this.assets.set(loaded.assets);
        this.characters.set(loaded.characters);
        this.scenes.set(loaded.scenes);
        this.renderer.set(loaded.renderer);
      });
  }

  refreshAssets(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.listAssets(id), (list) => this.assets.set(list));
  }

  refreshCharacters(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.listCharacters(id), (list) => this.characters.set(list));
  }

  refreshScenes(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.listScenes(id), (list) => this.scenes.set(list));
  }

  projectId(): string | null {
    return this.project()?.id ?? null;
  }

  assetName(assetId: string | null | undefined): string | null {
    if (!assetId) return null;
    return this.assets().find((a) => a.id === assetId)?.name ?? null;
  }

  characterName(characterId: string | null | undefined): string {
    if (!characterId) return 'Unattributed';
    return this.characters().find((c) => c.id === characterId)?.name ?? 'Unknown';
  }
}
