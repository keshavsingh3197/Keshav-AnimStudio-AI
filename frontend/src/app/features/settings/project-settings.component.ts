import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  CANVAS_PRESETS, DISTRIBUTION_INTENTS, WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition,
  aspectRatioLabel, videoFormat,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** Project-wide settings: canvas, frame rate, intended use and the music bed. */
@Component({
  selector: 'app-project-settings',
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './project-settings.component.html',
})
export class ProjectSettingsComponent {
  readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly presets = CANVAS_PRESETS;
  readonly intents = DISTRIBUTION_INTENTS;
  readonly watermarkPositions = WATERMARK_POSITIONS;
  readonly watermarkKinds: readonly { kind: WatermarkKind; label: string }[] = [
    { kind: 'None', label: 'No watermark' },
    { kind: 'Text', label: 'Text or site address' },
    { kind: 'Logo', label: 'Logo image' },
  ];
  readonly confirmingDelete = signal(false);
  readonly globalWatermark = signal<WatermarkBody | null>(null);

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
    defaultWatermarkKind: 'None' as WatermarkKind,
    defaultWatermarkText: '',
    defaultWatermarkLogoId: '',
    defaultWatermarkPosition: 'TopRight' as WatermarkPosition,
    defaultWatermarkOpacity: 0.8,
    defaultWatermarkHeight: 5.5,
    defaultWatermarkMargin: 4,
    defaultWatermarkColor: '#ffffff',
    defaultWatermarkBackplate: 0.3,
  };

  constructor() {
    // Fills the form as soon as the project lands, and again if it is reloaded.
    effect(() => {
      const project = this.store.project();
      if (!project) return;

      const wm = project.defaultWatermark;
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
        defaultWatermarkKind: (wm?.kind as WatermarkKind) ?? 'None',
        defaultWatermarkText: wm?.text ?? '',
        defaultWatermarkLogoId: wm?.logoAssetId ?? '',
        defaultWatermarkPosition: (wm?.position as WatermarkPosition) ?? 'TopRight',
        defaultWatermarkOpacity: wm?.opacity ?? 0.8,
        defaultWatermarkHeight: wm ? Math.round(wm.heightFraction * 1000) / 10 : 5.5,
        defaultWatermarkMargin: wm ? Math.round(wm.marginFraction * 1000) / 10 : 4,
        defaultWatermarkColor: wm?.colorHex ?? '#ffffff',
        defaultWatermarkBackplate: wm?.backplateOpacity ?? 0.3,
      };

      this.presetIndex = this.matchPreset(project.width, project.height);
    });

    this.api.getGlobalBranding().subscribe({
      next: (wm) => this.globalWatermark.set(wm),
      error: () => {},
    });
  }

  applyGlobalBranding(): void {
    const wm = this.globalWatermark();
    if (!wm || wm.kind === 'None') return;

    this.form.defaultWatermarkKind = (wm.kind as WatermarkKind) ?? 'None';
    this.form.defaultWatermarkText = wm.text ?? '';
    this.form.defaultWatermarkLogoId = wm.logoAssetId ?? '';
    this.form.defaultWatermarkPosition = (wm.position as WatermarkPosition) ?? 'TopRight';
    this.form.defaultWatermarkOpacity = wm.opacity ?? 0.8;
    this.form.defaultWatermarkHeight = wm.heightFraction ? Math.round(wm.heightFraction * 1000) / 10 : 5.5;
    this.form.defaultWatermarkMargin = wm.marginFraction ? Math.round(wm.marginFraction * 1000) / 10 : 4;
    this.form.defaultWatermarkColor = wm.colorHex ?? '#ffffff';
    this.form.defaultWatermarkBackplate = wm.backplateOpacity ?? 0.3;
  }

  applyPreset(index: number): void {
    const preset = this.presets[index];
    if (!preset) return;

    this.form.width = preset.width;
    this.form.height = preset.height;
  }

  /**
   * What the size currently in the form makes. Read from the form rather than from the
   * saved project, so a custom width and height describe themselves as they are typed.
   */
  format(): string {
    return videoFormat(this.form.width, this.form.height);
  }

  formatClass(): string {
    return this.format() === 'Short' ? 'pill ok' : 'pill';
  }

  aspect(): string {
    return aspectRatioLabel(this.form.width, this.form.height);
  }

  /** Shows the preset that matches the saved canvas, or Custom when none does. */
  private matchPreset(width: number, height: number): number {
    return this.presets.findIndex((p) => p.width === width && p.height === height);
  }

  onPickLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const projectId = this.store.projectId();
    if (!file || !projectId) return;

    this.status.run(this.api.uploadAsset(projectId, file), (asset) => {
      this.store.refreshAssets();
      this.form.defaultWatermarkLogoId = asset.id;
      if (!asset.hasAlpha) {
        this.status.notify([
          `"${asset.name}" has no transparency. A PNG with a transparent background is recommended for logos.`,
        ]);
      }
    });
  }

  logoUrl(): string | null {
    const id = this.form.defaultWatermarkLogoId;
    if (!id) return null;
    if (id === this.globalWatermark()?.logoAssetId) {
      return this.api.globalLogoUrl();
    }
    return this.api.assetUrl(id);
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
        defaultWatermark: {
          kind: this.form.defaultWatermarkKind,
          text: this.form.defaultWatermarkText.trim() || null,
          logoAssetId: this.form.defaultWatermarkLogoId || null,
          position: this.form.defaultWatermarkPosition,
          opacity: this.form.defaultWatermarkOpacity,
          heightFraction: this.form.defaultWatermarkHeight / 100,
          marginFraction: this.form.defaultWatermarkMargin / 100,
          colorHex: this.form.defaultWatermarkColor,
          backplateOpacity: this.form.defaultWatermarkBackplate,
        },
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
