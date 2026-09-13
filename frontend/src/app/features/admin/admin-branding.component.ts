import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { StatusService } from '../../core/services/status.service';

@Component({
  selector: 'app-admin-branding',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './admin-branding.component.html',
})
export class AdminBrandingComponent {
  private readonly api = inject(ApiService);
  private readonly mediaTools = inject(MediaToolsService);
  readonly status = inject(StatusService);

  readonly watermarkPositions = WATERMARK_POSITIONS;
  readonly watermarkKinds: readonly { kind: WatermarkKind; label: string }[] = [
    { kind: 'None', label: 'No Hallmark / Watermark' },
    { kind: 'Text', label: 'Studio Hallmark Text / Brand Name' },
    { kind: 'Logo', label: 'Studio Hallmark Logo (PNG / JPG / WEBP)' },
  ];

  readonly logoPreviewUrl = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly defaultChunkDuration = signal<number>(10);
  readonly chunkDurationSaved = signal<boolean>(false);

  form = {
    kind: 'None' as WatermarkKind,
    text: '',
    logoAssetId: '',
    position: 'TopRight' as WatermarkPosition,
    opacity: 0.8,
    height: 5.5,
    margin: 4,
    color: '#ffffff',
    backplate: 0.3,
  };

  constructor() {
    this.reload();
  }

  reload(): void {
    this.saveSuccess.set(false);
    this.status.run(this.api.getGlobalBranding(), (wm) => {
      if (wm) {
        this.form = {
          kind: (wm.kind as WatermarkKind) ?? 'None',
          text: wm.text ?? '',
          logoAssetId: wm.logoAssetId ?? '',
          position: (wm.position as WatermarkPosition) ?? 'TopRight',
          opacity: wm.opacity ?? 0.8,
          height: Math.round((wm.heightFraction ?? 0.055) * 1000) / 10,
          margin: Math.round((wm.marginFraction ?? 0.04) * 1000) / 10,
          color: wm.colorHex ?? '#ffffff',
          backplate: wm.backplateOpacity ?? 0.3,
        };
        if (wm.kind === 'Logo' && wm.logoAssetId) {
          this.logoPreviewUrl.set(this.api.globalLogoUrl());
        } else {
          this.logoPreviewUrl.set(null);
        }
      }
    });

    this.mediaTools.getMediaSettings().subscribe({
      next: (settings) => {
        this.defaultChunkDuration.set(settings.defaultChunkDurationSeconds || 10);
      },
      error: () => {},
    });
  }

  saveChunkDuration(): void {
    const dur = this.defaultChunkDuration();
    if (dur <= 0) return;

    this.chunkDurationSaved.set(false);
    this.status.run(this.mediaTools.updateChunkDuration(dur), (val) => {
      this.defaultChunkDuration.set(val);
      this.chunkDurationSaved.set(true);
      setTimeout(() => this.chunkDurationSaved.set(false), 4000);
    });
  }

  onUploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.saveSuccess.set(false);
    this.status.run(this.api.uploadGlobalLogo(file), (wm) => {
      if (wm) {
        this.form.kind = 'Logo';
        this.form.logoAssetId = wm.logoAssetId ?? '';
        this.logoPreviewUrl.set(this.api.globalLogoUrl() + '?t=' + Date.now());
      }
      input.value = '';
    });
  }

  clearLogo(): void {
    this.form.logoAssetId = '';
    this.logoPreviewUrl.set(null);
    if (this.form.kind === 'Logo') {
      this.form.kind = 'None';
    }
  }

  save(): void {
    this.saveSuccess.set(false);
    const body: WatermarkBody = {
      kind: this.form.kind,
      text: this.form.text.trim() || null,
      logoAssetId: this.form.logoAssetId || null,
      position: this.form.position,
      opacity: this.form.opacity,
      heightFraction: this.form.height / 100,
      marginFraction: this.form.margin / 100,
      colorHex: this.form.color,
      backplateOpacity: this.form.backplate,
    };

    this.status.run(this.api.updateGlobalBranding(body), () => {
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 4000);
    });
  }
}

