import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CANVAS_PRESETS, DISTRIBUTION_INTENTS } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** Project-wide settings: canvas, frame rate, intended use and the music bed. */
@Component({
  selector: 'app-project-settings',
  imports: [FormsModule],
  templateUrl: './project-settings.component.html',
})
export class ProjectSettingsComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly presets = CANVAS_PRESETS;
  readonly intents = DISTRIBUTION_INTENTS;
  readonly confirmingDelete = signal(false);

  /** -1 while the canvas does not match any preset. */
  presetIndex = -1;

  form = {
    name: '',
    description: '',
    width: 1920,
    height: 1080,
    fps: 30,
    distributionIntent: 'Personal' as string,
    acceptShareAlikeObligation: false,
    backgroundMusicAssetId: '',
    musicVolumePercent: 18,
  };

  constructor() {
    // Fills the form as soon as the project lands, and again if it is reloaded.
    effect(() => {
      const project = this.store.project();
      if (!project) return;

      this.form = {
        name: project.name,
        description: project.description ?? '',
        width: project.width,
        height: project.height,
        fps: project.fps,
        distributionIntent: project.distributionIntent,
        acceptShareAlikeObligation: project.acceptShareAlikeObligation,
        backgroundMusicAssetId: project.backgroundMusicAssetId ?? '',
        musicVolumePercent: Math.round(project.backgroundMusicVolume * 100),
      };

      this.presetIndex = this.matchPreset(project.width, project.height);
    });
  }

  applyPreset(index: number): void {
    const preset = this.presets[index];
    if (!preset) return;

    this.form.width = preset.width;
    this.form.height = preset.height;
  }

  /** Shows the preset that matches the saved canvas, or Custom when none does. */
  private matchPreset(width: number, height: number): number {
    return this.presets.findIndex((p) => p.width === width && p.height === height);
  }

  save(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(
      this.api.updateProject(projectId, {
        name: this.form.name,
        description: this.form.description.trim() || undefined,
        width: this.form.width,
        height: this.form.height,
        fps: this.form.fps,
        distributionIntent: this.form.distributionIntent,
        acceptShareAlikeObligation: this.form.acceptShareAlikeObligation,
        backgroundMusicAssetId: this.form.backgroundMusicAssetId || null,
        backgroundMusicVolume: this.form.musicVolumePercent / 100,
      }),
      (project) => {
        this.store.project.set(project);
        // A frame-rate change rewrites every scene's frame counts server-side.
        this.store.refreshScenes();
      });
  }

  deleteProject(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.deleteProject(projectId), () => {
      void this.router.navigate(['/projects']);
    });
  }
}
