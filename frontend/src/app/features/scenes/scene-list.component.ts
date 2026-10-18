import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs';

import { BACKGROUND_EFFECTS, Scene, TRANSITIONS } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/**
 * The running order. Everything here is about the sequence - what plays, in what order,
 * for how long. Supports both visual Storyboard Cards and compact Table views, with
 * drag-and-drop reordering, search/filtering, 1-click scene duplication, and batch polish.
 */
@Component({
  selector: 'app-scene-list',
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './scene-list.component.html',
})
export class SceneListComponent {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly confirming = signal<string | null>(null);
  readonly showBatchPanel = signal<boolean>(false);

  // View mode & search/filter
  readonly viewMode = signal<'storyboard' | 'table'>('storyboard');
  readonly searchQuery = signal<string>('');
  readonly filterType = signal<'all' | 'nobg' | 'dialogue' | 'characters'>('all');

  // Drag-and-drop state
  readonly draggedSceneId = signal<string | null>(null);
  readonly dragOverSceneId = signal<string | null>(null);

  readonly effects = BACKGROUND_EFFECTS;
  readonly transitions = TRANSITIONS;

  newTitle = '';
  newDuration = 5;
  bulkBackgroundId = '';
  bulkAudioId = '';
  bulkEffect = 'ZoomIn';
  bulkTransition = 'Fade';
  bulkTransitionDuration = 0.5;

  readonly totalDurationSeconds = computed(() =>
    this.store.scenes().reduce((sum, s) => sum + (s.durationSeconds || 0), 0)
  );

  readonly totalDurationFormatted = computed(() => {
    const total = Math.round(this.totalDurationSeconds());
    if (total <= 0) return '0s';
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  });

  readonly totalDialogueLines = computed(() =>
    this.store.scenes().reduce((sum, s) => sum + (s.dialogueLines || 0), 0)
  );

  readonly scenesWithMotion = computed(() =>
    this.store.scenes().filter((s) => s.backgroundEffect && s.backgroundEffect !== 'None').length
  );

  readonly filteredScenes = computed(() => {
    const all = this.store.scenes();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.filterType();

    return all.filter((scene) => {
      if (filter === 'nobg' && scene.backgroundAssetId) return false;
      if (filter === 'dialogue' && scene.dialogueLines === 0) return false;
      if (filter === 'characters' && scene.characterCount === 0) return false;

      if (query.length > 0) {
        const titleMatch = (scene.title ?? '').toLowerCase().includes(query);
        const numMatch = `scene ${scene.sceneNumber}`.includes(query) || `${scene.sceneNumber}` === query;
        if (!titleMatch && !numMatch) return false;
      }

      return true;
    });
  });

  subtitlesUrl(): string | null {
    const pid = this.store.projectId();
    return pid ? this.api.subtitlesUrl(pid) : null;
  }

  add(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    const last = this.store.scenes().at(-1);

    this.status.run(
      this.api.createScene(projectId, {
        title: this.newTitle.trim() || undefined,
        durationSeconds: this.newDuration,
        afterSceneId: last?.id,
      }),
      () => {
        this.newTitle = '';
        this.store.refreshScenes();
      }
    );
  }

  duplicate(scene: Scene): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(
      this.api.duplicateScene(scene.id).pipe(
        catchError(() => {
          return this.api.createScene(projectId, {
            title: scene.title ? `${scene.title} (Copy)` : 'Untitled scene (Copy)',
            durationSeconds: scene.durationSeconds,
            backgroundAssetId: scene.backgroundAssetId ?? undefined,
            afterSceneId: scene.id,
          });
        })
      ),
      () => {
        this.store.refreshScenes();
      }
    );
  }

  remove(sceneId: string): void {
    this.status.run(this.api.deleteScene(sceneId), () => {
      this.confirming.set(null);
      this.store.refreshScenes();
    });
  }

  move(scene: Scene, delta: number): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    const ids = this.store.scenes().map((s) => s.id);
    const from = ids.indexOf(scene.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;

    ids.splice(to, 0, ...ids.splice(from, 1));

    this.status.run(
      this.api.reorderScenes(projectId, ids), (list) => this.store.scenes.set(list));
  }

  onDragStart(event: DragEvent, scene: Scene): void {
    this.draggedSceneId.set(scene.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', scene.id);
    }
  }

  onDragOver(event: DragEvent, scene: Scene): void {
    event.preventDefault();
    if (this.draggedSceneId() && this.draggedSceneId() !== scene.id) {
      this.dragOverSceneId.set(scene.id);
    }
  }

  onDragEnd(): void {
    this.draggedSceneId.set(null);
    this.dragOverSceneId.set(null);
  }

  onDrop(event: DragEvent, targetScene: Scene): void {
    event.preventDefault();
    const projectId = this.store.projectId();
    const sourceId = this.draggedSceneId();
    this.draggedSceneId.set(null);
    this.dragOverSceneId.set(null);

    if (!projectId || !sourceId || sourceId === targetScene.id) return;

    const ids = this.store.scenes().map((s) => s.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetScene.id);
    if (from < 0 || to < 0) return;

    ids.splice(to, 0, ...ids.splice(from, 1));
    this.status.run(
      this.api.reorderScenes(projectId, ids),
      (list) => this.store.scenes.set(list)
    );
  }

  applyBackgroundToAll(): void {
    const projectId = this.store.projectId();
    if (!projectId || !this.bulkBackgroundId) return;

    this.status.run(
      this.api.setAllBackgrounds(projectId, this.bulkBackgroundId),
      () => this.store.refreshScenes());
  }

  applyAudioToAll(): void {
    const projectId = this.store.projectId();
    if (!projectId || !this.bulkAudioId) return;

    this.status.run(this.api.setAllAudio(projectId, this.bulkAudioId), (count) => {
      this.store.refreshScenes();

      if (count === 0) {
        this.status.notify([
          'No scene had a timed window to cut from, so nothing was linked. Scenes built from '
          + 'pasted text have estimated timings and no audio; set audio per scene instead.',
        ]);
      }
    });
  }

  applyStyleToAll(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(
      this.api.setAllSceneStyles(projectId, {
        backgroundEffect: this.bulkEffect,
        transition: this.bulkTransition,
        transitionDurationSeconds: this.bulkTransition === 'None' ? 0 : this.bulkTransitionDuration,
      }),
      (count) => {
        this.store.refreshScenes();
        this.status.notify([`Updated camera motion & transitions across ${count} scene(s).`]);
      }
    );
  }

  autoPolishStoryboard(): void {
    const projectId = this.store.projectId();
    if (!projectId || this.store.scenes().length === 0) return;

    this.status.run(
      this.api.setAllSceneStyles(projectId, {
        randomizeMotion: true,
        intensity: 0.14,
        easing: 'EaseInOut',
        transition: 'Fade',
        transitionDurationSeconds: 0.5,
      }),
      (count) => {
        this.store.refreshScenes();
        this.status.notify([`Polished ${count} scene(s) with alternating Ken Burns camera motion and 0.5s crossfades.`]);
      }
    );
  }

  thumbnail(assetId: string | undefined): string | null {
    return assetId ? this.api.assetUrl(assetId) : null;
  }
}

