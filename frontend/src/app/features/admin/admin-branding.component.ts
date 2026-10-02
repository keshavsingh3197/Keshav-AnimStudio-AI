import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';

import {
  BrandChannel, DEFAULT_BRAND_CHANNEL,
  OUTRO_KINDS, OutroBody, OutroKind, WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { WatermarkPreviewComponent } from '../../shared/watermark-preview.component';

@Component({
  selector: 'app-admin-branding',
  standalone: true,
  imports: [FormsModule, DecimalPipe, FileDropDirective, WatermarkPreviewComponent],
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

  // --- Which page of the settings this is -----------------------------------------------
  // One component serves the Watermark, End card and Video chunking pages; the route says
  // which. With no section (an old /admin/branding bookmark) everything shows, as before.

  private readonly route = inject(ActivatedRoute);
  readonly section = toSignal(this.route.data.pipe(map((d) => (d['section'] as BrandingSection | undefined) ?? null)),
    { initialValue: null });

  shows(s: BrandingSection): boolean {
    const current = this.section();
    return current === null || current === s;
  }

  readonly heading = computed(() => HEADINGS[this.section() ?? 'all']);

  // --- Live preview ---------------------------------------------------------------------

  readonly previewAspects = [
    { label: '16:9', width: 1920, height: 1080 },
    { label: '9:16', width: 1080, height: 1920 },
    { label: '1:1', width: 1080, height: 1080 },
    { label: '4:5', width: 1080, height: 1350 },
  ] as const;
  readonly previewAspect = signal<(typeof this.previewAspects)[number]>(this.previewAspects[0]);

  /** The unsaved form as the renderer would read it. */
  formAsBody(): WatermarkBody {
    return {
      kind: this.form.kind,
      text: this.form.text,
      logoAssetId: this.form.logoAssetId || null,
      position: this.form.position,
      opacity: this.form.opacity,
      heightFraction: this.form.height / 100,
      marginFraction: this.form.margin / 100,
      colorHex: this.form.color,
      backplateOpacity: this.form.backplate,
    };
  }

  readonly logoPreviewUrl = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly outroMediaUrl = signal<string | null>(null);
  readonly saveOutroSuccess = signal(false);
  readonly defaultChunkDuration = signal<number>(10);
  readonly chunkDurationSaved = signal<boolean>(false);

  form = blankWatermarkForm();
  outroForm = blankOutroForm();

  // --- Brand channels: one watermark + end card per YouTube channel ---------------------
  // Everything below the channel bar edits the selected channel; "default" is the
  // studio's original branding, used by every project that has not picked a channel.

  readonly channels = signal<BrandChannel[]>([]);
  readonly selectedChannelId = signal<string>(DEFAULT_BRAND_CHANNEL);
  readonly newChannelName = signal('');
  readonly renamingChannel = signal(false);
  readonly renameValue = signal('');
  readonly confirmingChannelDelete = signal(false);

  selectedChannel(): BrandChannel | undefined {
    return this.channels().find((c) => c.id === this.selectedChannelId());
  }

  /** "🛡 Logo · 🎬 Card" - what a channel has set up, for its tab. */
  channelSummary(c: BrandChannel): string {
    const wm = c.watermark && c.watermark.kind !== 'None' ? c.watermark.kind : 'none';
    const outro = c.outro && c.outro.kind !== 'None' ? c.outro.kind : 'none';
    return `🛡 ${wm} · 🎬 ${outro}`;
  }

  selectChannel(id: string): void {
    if (id === this.selectedChannelId()) return;
    this.selectedChannelId.set(id);
    this.renamingChannel.set(false);
    this.confirmingChannelDelete.set(false);
    this.setPreview(null);
    this.loadChannelBranding();
  }

  private loadChannels(): void {
    this.api.listBrandChannels().subscribe({
      next: (list) => this.applyChannels(list),
      error: () => {},
    });
  }

  private applyChannels(list: BrandChannel[]): void {
    this.channels.set(list);
    // The selected channel was deleted (here or elsewhere): fall back to the default.
    if (!list.some((c) => c.id === this.selectedChannelId())) {
      this.selectedChannelId.set(DEFAULT_BRAND_CHANNEL);
      this.loadChannelBranding();
    }
  }

  /** Adds a channel that starts as a copy of the selected one, then switches to it. */
  createChannel(): void {
    const name = this.newChannelName().trim();
    if (!name) return;
    this.status.run(this.api.createBrandChannel(name, this.selectedChannelId()), (list) => {
      this.newChannelName.set('');
      this.channels.set(list);
      const created = list.find((c) => !c.isDefault && c.name === name);
      if (created) {
        this.selectedChannelId.set(created.id);
        this.setPreview(null);
        this.loadChannelBranding();
      }
      this.status.notify([`Channel "${name}" added as a copy - now change its logo and end card.`]);
    });
  }

  startRename(): void {
    this.renameValue.set(this.selectedChannel()?.name ?? '');
    this.renamingChannel.set(true);
  }

  saveRename(): void {
    const name = this.renameValue().trim();
    if (!name) return;
    this.status.run(this.api.renameBrandChannel(this.selectedChannelId(), name), (list) => {
      this.renamingChannel.set(false);
      this.applyChannels(list);
    });
  }

  deleteChannel(): void {
    const id = this.selectedChannelId();
    if (id === DEFAULT_BRAND_CHANNEL) return;
    this.status.run(this.api.deleteBrandChannel(id), (list) => {
      this.confirmingChannelDelete.set(false);
      this.applyChannels(list);
    });
  }

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
    this.loadChannels();
    this.loadChannelBranding();

    // 3. Media Chunking (studio-wide, not per channel)
    this.mediaTools.getMediaSettings().subscribe({
      next: (settings) => {
        this.defaultChunkDuration.set(settings.defaultChunkDurationSeconds || 10);
      },
      error: () => {},
    });
  }

  /** Loads the selected channel's watermark and end card into the two forms. */
  private loadChannelBranding(): void {
    this.saveSuccess.set(false);
    this.saveOutroSuccess.set(false);
    const channel = this.selectedChannelId();
    // A channel with nothing set yet shows blank forms, not the previous channel's values.
    this.form = blankWatermarkForm();
    this.outroForm = blankOutroForm();
    this.logoPreviewUrl.set(null);
    this.outroMediaUrl.set(null);

    // 1. Watermark / Hallmark
    this.status.run(this.api.getGlobalBranding(channel), (wm) => {
      if (channel !== this.selectedChannelId()) return; // switched away meanwhile
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
          this.logoPreviewUrl.set(this.api.globalLogoUrl(channel) + '&t=' + Date.now());
        } else {
          this.logoPreviewUrl.set(null);
        }
      }
    });

    // 2. Outro Bumper
    this.api.getGlobalOutro(channel).subscribe({
      next: (outro) => {
        if (channel !== this.selectedChannelId()) return;
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
            this.outroMediaUrl.set(this.api.globalOutroMediaUrl(channel) + '&t=' + Date.now());
          } else {
            this.outroMediaUrl.set(null);
          }
        }
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
    input.value = '';
    if (file) this.uploadLogo(file);
  }

  uploadLogo(file: File): void {
    this.saveSuccess.set(false);
    const channel = this.selectedChannelId();
    this.status.run(this.api.uploadGlobalLogo(file, channel), (wm) => {
      if (wm) {
        this.form.kind = 'Logo';
        this.form.logoAssetId = wm.logoAssetId ?? '';
        this.logoPreviewUrl.set(this.api.globalLogoUrl(channel) + '&t=' + Date.now());
      }
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

    this.status.run(this.api.updateGlobalBranding(body, this.selectedChannelId()), () => {
      this.loadChannels();
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
    input.value = '';
    if (file) this.uploadOutro(file);
  }

  uploadOutro(file: File): void {
    this.saveOutroSuccess.set(false);
    const channel = this.selectedChannelId();
    this.status.run(this.api.uploadGlobalOutro(file, channel), (res) => {
      if (res) {
        this.outroForm.kind = res.kind;
        this.outroForm.assetId = res.assetId ?? '';
        this.outroMediaUrl.set(this.api.globalOutroMediaUrl(channel) + '&t=' + Date.now());
      }
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
    input.value = '';
    if (file) this.uploadOutroQr(file);
  }

  uploadOutroQr(file: File): void {
    this.saveOutroSuccess.set(false);
    this.status.run(this.api.uploadGlobalOutroQr(file, this.selectedChannelId()), (res) => {
      if (res) {
        this.outroForm.kind = 'Card';
        this.outroForm.qrAssetId = res.qrAssetId ?? '';
      }
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

    this.status.run(this.api.updateGlobalOutro(body, this.selectedChannelId()), () => {
      this.loadChannels();
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

function blankWatermarkForm() {
  return {
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
}

function blankOutroForm() {
  return {
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
}

type BrandingSection = 'watermark' | 'outro' | 'chunking';

const HEADINGS: Record<BrandingSection | 'all', { icon: string; title: string; subtitle: string }> = {
  watermark: { icon: '🛡️', title: 'Watermark', subtitle: 'The mark stamped on every video of a channel. Projects on that channel follow it unless they set their own.' },
  outro: { icon: '🎬', title: 'End card', subtitle: 'What each channel\'s videos finish with: a bumper video, a graphic, or a support card with a QR code.' },
  chunking: { icon: '✂️', title: 'Video chunking', subtitle: 'The default segment length when long videos are split into clips.' },
  all: { icon: '🎨', title: 'Branding & video defaults', subtitle: 'Watermarks, end cards and video segmentation.' },
};
