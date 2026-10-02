import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  OUTRO_KINDS, OutroBody, OutroKind, WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { StatusService } from '../../core/services/status.service';

@Component({
  selector: 'app-admin-branding',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './admin-branding.component.html',
  styleUrls: ['./admin-branding.component.css'],
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

  readonly outroKinds: readonly { kind: OutroKind; label: string }[] = [
    { kind: 'None', label: 'No Channel Outro' },
    { kind: 'Video', label: 'Outro Video Bumper (MP4 / WebM / MOV)' },
    { kind: 'Image', label: 'End-Card Graphic (PNG / JPG / WEBP)' },
    { kind: 'Card', label: 'Support Us End Card (QR code + message)' },
  ];

  readonly outroTransitions: readonly string[] = ['Fade', 'Dissolve', 'None', 'WipeLeft', 'WipeRight'];

  readonly chunkPresets: readonly number[] = [5, 10, 15, 30, 60, 120];

  readonly logoPreviewUrl = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly outroMediaUrl = signal<string | null>(null);
  readonly saveOutroSuccess = signal(false);
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

  outroForm = {
    kind: 'None' as OutroKind,
    assetId: '',
    durationSeconds: 4,
    transition: 'Fade',
    transitionDurationFrames: 15,
    qrAssetId: '',
    headline: 'Support us for more videos like this',
    subtext: 'Scan the QR code',
    headlineSecondary: '',
    subtextSecondary: '',
    backgroundHex: '#101828',
    textHex: '#FFFFFF',
  };

  /** The rendered end card, as an object URL, and which shape it was rendered for. */
  readonly outroPreviewUrl = signal<string | null>(null);
  readonly outroPreviewFormat = signal<'landscape' | 'vertical' | 'square'>('landscape');
  readonly outroPreviewBusy = signal(false);
  readonly outroPreviewError = signal<string | null>(null);
  private outroPreviewBlob: Blob | null = null;

  constructor() {
    this.reload();
  }

  reload(): void {
    this.saveSuccess.set(false);
    this.saveOutroSuccess.set(false);

    // 1. Watermark / Hallmark
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

    // 2. Outro Bumper
    this.api.getGlobalOutro().subscribe({
      next: (outro) => {
        if (outro) {
          this.outroForm = {
            kind: (outro.kind as OutroKind) ?? 'None',
            assetId: outro.assetId ?? '',
            durationSeconds: outro.durationSeconds || 4,
            transition: outro.transition || 'Fade',
            transitionDurationFrames: outro.transitionDurationFrames || 15,
            qrAssetId: outro.qrAssetId ?? '',
            headline: outro.headline ?? '',
            subtext: outro.subtext ?? '',
            headlineSecondary: outro.headlineSecondary ?? '',
            subtextSecondary: outro.subtextSecondary ?? '',
            backgroundHex: outro.backgroundHex || '#101828',
            textHex: outro.textHex || '#FFFFFF',
          };
          if (outro.kind !== 'None' && outro.kind !== 'Card' && outro.assetId) {
            this.outroMediaUrl.set(this.api.globalOutroMediaUrl() + '?t=' + Date.now());
          } else {
            this.outroMediaUrl.set(null);
          }
        }
      },
      error: () => {},
    });

    // 3. Media Chunking
    this.mediaTools.getMediaSettings().subscribe({
      next: (settings) => {
        this.defaultChunkDuration.set(settings.defaultChunkDurationSeconds || 10);
      },
      error: () => {},
    });
  }

  setWatermarkKind(kind: WatermarkKind): void {
    this.form.kind = kind;
  }

  setWatermarkPosition(pos: WatermarkPosition): void {
    this.form.position = pos;
  }

  formatPosLabel(pos: WatermarkPosition): string {
    switch (pos) {
      case 'TopLeft': return '↖ Top-Left';
      case 'TopCenter': return '↑ Top-Center';
      case 'TopRight': return '↗ Top-Right';
      case 'BottomLeft': return '↙ Bottom-Left';
      case 'BottomCenter': return '↓ Bottom-Center';
      case 'BottomRight': return '↘ Bottom-Right';
      default: return pos;
    }
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

  // --- Outro management ---

  setOutroKind(kind: OutroKind): void {
    this.outroForm.kind = kind;
  }

  setOutroTransition(trans: string): void {
    this.outroForm.transition = trans;
  }

  onUploadOutro(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.saveOutroSuccess.set(false);
    this.status.run(this.api.uploadGlobalOutro(file), (res) => {
      if (res) {
        this.outroForm.kind = res.kind;
        this.outroForm.assetId = res.assetId ?? '';
        this.outroMediaUrl.set(this.api.globalOutroMediaUrl() + '?t=' + Date.now());
      }
      input.value = '';
    });
  }

  clearOutro(): void {
    this.outroForm.assetId = '';
    this.outroMediaUrl.set(null);
    this.outroForm.kind = 'None';
  }

  onUploadOutroQr(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.saveOutroSuccess.set(false);
    this.status.run(this.api.uploadGlobalOutroQr(file), (res) => {
      if (res) {
        this.outroForm.kind = 'Card';
        this.outroForm.qrAssetId = res.qrAssetId ?? '';
      }
      input.value = '';
    });
  }

  /** Ready-made wording, so a bilingual card is one click rather than four fields. */
  readonly cardLanguagePresets: readonly { label: string; headline: string; subtext: string; headline2: string; subtext2: string }[] = [
    {
      label: 'English',
      headline: 'Support us for more videos like this', subtext: 'Scan the QR code',
      headline2: '', subtext2: '',
    },
    {
      label: 'हिन्दी',
      headline: 'इस तरह के और वीडियो के लिए हमारा समर्थन करें', subtext: 'QR कोड स्कैन करें',
      headline2: '', subtext2: '',
    },
    {
      label: 'English + हिन्दी',
      headline: 'Support us for more videos like this', subtext: 'Scan the QR code',
      headline2: 'इस तरह के और वीडियो के लिए हमारा समर्थन करें', subtext2: 'QR कोड स्कैन करें',
    },
    {
      label: 'हिन्दी + English',
      headline: 'इस तरह के और वीडियो के लिए हमारा समर्थन करें', subtext: 'QR कोड स्कैन करें',
      headline2: 'Support us for more videos like this', subtext2: 'Scan the QR code',
    },
  ];

  applyCardLanguagePreset(preset: (typeof this.cardLanguagePresets)[number]): void {
    this.outroForm.headline = preset.headline;
    this.outroForm.subtext = preset.subtext;
    this.outroForm.headlineSecondary = preset.headline2;
    this.outroForm.subtextSecondary = preset.subtext2;
  }

  qrImageUrl(): string | null {
    return this.outroForm.qrAssetId ? this.api.assetContentUrl(this.outroForm.qrAssetId) : null;
  }

  clearOutroQr(): void {
    this.outroForm.qrAssetId = '';
  }

  /** Renders the form as it stands - saved or not - so the card can be checked first. */
  previewOutro(format: 'landscape' | 'vertical' | 'square'): void {
    this.outroPreviewBusy.set(true);
    this.outroPreviewError.set(null);
    this.outroPreviewFormat.set(format);

    this.api.previewGlobalOutro(this.outroBody(), format).subscribe({
      next: (blob) => {
        this.setPreview(blob);
        this.outroPreviewBusy.set(false);
      },
      error: () => {
        this.setPreview(null);
        this.outroPreviewBusy.set(false);
        this.outroPreviewError.set('Could not render the end card. Add a QR code or a headline, then try again.');
      },
    });
  }

  downloadOutroPreview(): void {
    if (!this.outroPreviewBlob) return;
    const url = URL.createObjectURL(this.outroPreviewBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `end-card-${this.outroPreviewFormat()}.mp4`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private setPreview(blob: Blob | null): void {
    const previous = this.outroPreviewUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.outroPreviewBlob = blob;
    this.outroPreviewUrl.set(blob ? URL.createObjectURL(blob) : null);
  }

  private outroBody(): OutroBody {
    return {
      kind: this.outroForm.kind,
      assetId: this.outroForm.assetId || null,
      durationSeconds: this.outroForm.durationSeconds,
      transition: this.outroForm.transition,
      transitionDurationFrames: this.outroForm.transitionDurationFrames,
      qrAssetId: this.outroForm.qrAssetId || null,
      headline: this.outroForm.headline?.trim() || null,
      subtext: this.outroForm.subtext?.trim() || null,
      headlineSecondary: this.outroForm.headlineSecondary?.trim() || null,
      subtextSecondary: this.outroForm.subtextSecondary?.trim() || null,
      backgroundHex: this.outroForm.backgroundHex,
      textHex: this.outroForm.textHex,
    };
  }

  saveOutro(): void {
    this.saveOutroSuccess.set(false);
    const body = this.outroBody();

    this.status.run(this.api.updateGlobalOutro(body), () => {
      this.saveOutroSuccess.set(true);
      setTimeout(() => this.saveOutroSuccess.set(false), 4000);
    });
  }

  // --- Chunk Duration ---

  setChunkDurationPreset(sec: number): void {
    this.defaultChunkDuration.set(sec);
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
}
