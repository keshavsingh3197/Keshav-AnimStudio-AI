import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Scene } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/**
 * The running order. Everything here is about the sequence - what plays, in what order,
 * for how long; the inside of a scene belongs to the scene editor.
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

  newTitle = '';
  newDuration = 5;
  bulkBackgroundId = '';
  bulkAudioId = '';

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
      });
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

  thumbnail(assetId: string | undefined): string | null {
    return assetId ? this.api.assetUrl(assetId) : null;
  }
}
