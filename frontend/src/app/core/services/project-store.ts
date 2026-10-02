import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Asset, Character, Project, RendererStatus, Scene } from '../models/api.models';
import { ApiService } from './api.service';
import { StatusService } from './status.service';

/**
 * The open project and everything hanging off it.
 *
 * Provided by the project editor component rather than at the root, so the state is
 * created when a project is opened and thrown away when it is closed. It still guards
 * itself: every response is checked against the project it was requested for, so a slow
 * reply for one project can never land in another project's lists.
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
  readonly folders = signal<import('../models/api.models').AssetFolder[]>([]);

  /** The project this store is loading or showing; responses for any other are dropped. */
  private currentId: string | null = null;

  readonly images = computed(() => this.assets().filter((a) => a.kind === 'Image'));

  /** Anything that can supply a soundtrack: an audio file, or a video's audio track. */
  readonly playable = computed(() =>
    this.assets().filter((a) => a.kind === 'Audio' || a.kind === 'Video'));

  readonly audioOnly = computed(() => this.assets().filter((a) => a.kind === 'Audio'));
  readonly imagesOnly = computed(() => this.assets().filter((a) => a.kind === 'Image'));
  readonly videos = computed(() => this.assets().filter((a) => a.kind === 'Video'));

  /** Imported caption files. Reference material for an import, never scene content. */
  readonly subtitles = computed(() => this.assets().filter((a) => a.kind === 'Subtitle'));

  /** Characters that can actually appear on screen. */
  readonly cast = computed(() => this.characters().filter((c) => !c.isNarrator));

  readonly scenesMissingBackground = computed(() =>
    this.scenes().filter((s) => !s.backgroundAssetId));

  readonly renderable = computed(() =>
    this.scenes().length > 0 && this.scenesMissingBackground().length === 0);

  load(projectId: string): void {
    if (this.currentId !== projectId) {
      // Cleared before the new project arrives, so no screen ever shows - or acts on - the
      // previous project's files, cast or scenes while the next one is loading.
      this.project.set(null);
      this.assets.set([]);
      this.folders.set([]);
      this.characters.set([]);
      this.scenes.set([]);
    }
    this.currentId = projectId;

    this.status.run(
      forkJoin({
        project: this.api.getProject(projectId),
        assets: this.api.listAssets(projectId),
        folders: this.api.getFolders(projectId),
        characters: this.api.listCharacters(projectId),
        scenes: this.api.listScenes(projectId),
        renderer: this.api.rendererStatus(),
      }),
      (loaded) => {
        if (this.currentId !== projectId) return;
        this.project.set(loaded.project);
        this.assets.set(loaded.assets);
        this.folders.set(loaded.folders);
        this.characters.set(loaded.characters);
        this.scenes.set(loaded.scenes);
        this.renderer.set(loaded.renderer);
      });
  }

  refreshFolders(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.getFolders(id), (list) => {
      if (this.projectId() === id) this.folders.set(list);
    });
  }

  refreshAssets(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.listAssets(id), (list) => {
      if (this.projectId() === id) this.assets.set(list);
    });
  }

  refreshCharacters(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.listCharacters(id), (list) => {
      if (this.projectId() === id) this.characters.set(list);
    });
  }

  refreshScenes(): void {
    const id = this.projectId();
    if (id) this.status.run(this.api.listScenes(id), (list) => {
      if (this.projectId() === id) this.scenes.set(list);
    });
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
