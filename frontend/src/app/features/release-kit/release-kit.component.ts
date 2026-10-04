import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  ReleaseKitFile,
  ReleaseKitOptions,
  ReleaseKitResult,
  ReleaseMetadata,
} from '../../core/models/release-kit.models';
import { ReleaseKitService } from '../../core/services/release-kit.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { ImageCropDialogComponent } from '../../shared/image-crop-dialog.component';

const AUDIO_ACCEPT = '.wav,.wave,.flac,.aif,.aiff,.mp3,.m4a';
const COVER_ACCEPT = '.png,.jpg,.jpeg,.webp';
const LOSSY = /\.(mp3|m4a)$/i;

/** The details that stay the same from one release to the next, remembered on this browser when asked. */
const REMEMBER_KEY = 'animstudio.release.artist';
const REMEMBERED_FIELDS = [
  'primaryArtist', 'songwriters', 'producers', 'genre', 'secondaryGenre', 'language',
  'recordLabel', 'recordingCopyright', 'compositionCopyright',
] as const;
type RememberedField = (typeof REMEMBERED_FIELDS)[number];

/** The form as the user edits it: list fields are comma-separated text until submit. */
interface ReleaseForm {
  title: string;
  versionTitle: string;
  primaryArtist: string;
  featuredArtists: string;
  songwriters: string;
  producers: string;
  genre: string;
  secondaryGenre: string;
  language: string;
  explicit: boolean;
  instrumental: boolean;
  releaseDate: string;
  recordLabel: string;
  recordingCopyright: string;
  compositionCopyright: string;
  isrc: string;
  upc: string;
  lyrics: string;
  rightsConfirmed: boolean;
}

interface KitError {
  message: string;
  hint?: string;
}

@Component({
  selector: 'app-release-kit',
  imports: [FormsModule, DecimalPipe, FileDropDirective, ImageCropDialogComponent, RouterLink],
  templateUrl: './release-kit.component.html',
  styleUrls: ['./release-kit.component.css'],
})
export class ReleaseKitComponent {
  private readonly releases = inject(ReleaseKitService);
  private readonly status = inject(StatusService);

  readonly audioAccept = AUDIO_ACCEPT;
  readonly coverAccept = COVER_ACCEPT;

  readonly genres = [
    'Pop', 'Hip-Hop/Rap', 'R&B/Soul', 'Rock', 'Alternative', 'Electronic', 'Dance', 'Indie',
    'Singer/Songwriter', 'Folk', 'Country', 'Jazz', 'Blues', 'Classical', 'Indian Classical',
    'Bollywood', 'Devotional', 'Punjabi', 'Latin', 'K-Pop', 'Reggae', 'Metal', 'Ambient',
    'Lo-Fi', 'Soundtrack', 'Children\'s Music', 'Spoken Word', 'World',
  ];

  readonly languages: { code: string; name: string }[] = [
    { code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' }, { code: 'pa', name: 'Punjabi' },
    { code: 'bn', name: 'Bengali' }, { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' }, { code: 'gu', name: 'Gujarati' }, { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' }, { code: 'ur', name: 'Urdu' }, { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }, { code: 'de', name: 'German' }, { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' }, { code: 'ar', name: 'Arabic' },
  ];

  readonly loudnessPresets = [
    { lufs: -14, label: '-14 LUFS — Spotify, YouTube, Amazon (recommended)' },
    { lufs: -16, label: '-16 LUFS — Apple Music, podcasts' },
    { lufs: -11, label: '-11 LUFS — loud master (EDM, hip-hop)' },
  ];

  form: ReleaseForm = {
    title: '', versionTitle: '', primaryArtist: '', featuredArtists: '', songwriters: '', producers: '',
    genre: '', secondaryGenre: '', language: 'en', explicit: false, instrumental: false,
    releaseDate: '', recordLabel: '', recordingCopyright: '', compositionCopyright: '',
    isrc: '', upc: '', lyrics: '', rightsConfirmed: false,
  };

  options: ReleaseKitOptions = {
    targetLufs: -14,
    truePeakDb: -1,
    sampleRate: 44100,
    bitDepth: 24,
    makeVisualizer: true,
    makePromoLoop: true,
  };

  readonly audioFile = signal<File | null>(null);
  readonly coverFile = signal<File | null>(null);
  readonly coverPreview = signal<string | null>(null);
  readonly coverSize = signal<{ width: number; height: number } | null>(null);

  readonly building = signal(false);
  readonly elapsed = signal(0);
  readonly error = signal<KitError | null>(null);
  readonly result = signal<ReleaseKitResult | null>(null);

  /** Object URLs for previews and downloads, by file name; revoked on rebuild and on leave. */
  readonly previews = signal<Record<string, string>>({});
  readonly loadingFile = signal<string | null>(null);

  readonly audioIsLossy = computed(() => LOSSY.test(this.audioFile()?.name ?? ''));
  readonly coverTooSmall = computed(() => {
    const size = this.coverSize();
    return !!size && Math.min(size.width, size.height) < 3000;
  });
  readonly coverNotSquare = computed(() => {
    const size = this.coverSize();
    return !!size && size.width !== size.height;
  });

  readonly mediaFiles = computed(() =>
    (this.result()?.files ?? []).filter((f) => f.mimeType.startsWith('audio/') || f.mimeType.startsWith('video/')),
  );

  readonly hasVisualizer = computed(() => (this.result()?.files ?? []).some((f) => f.name.startsWith('visualizer_')));

  /** The cover being cropped to a square, when the crop dialog is open. */
  readonly cropSource = signal<File | null>(null);

  /** Opt-in: keep the artist, credits and label lines on this browser for the next release. */
  readonly rememberDetails = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.restoreDetails();
    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      this.revokePreviews();
      const cover = this.coverPreview();
      if (cover) URL.revokeObjectURL(cover);
    });
  }

  /** The reasons the Build button is disabled, so the page can say what's missing. */
  missing(): string[] {
    const missing: string[] = [];
    if (!this.audioFile()) missing.push('the audio file');
    if (!this.form.title.trim()) missing.push('a title');
    if (!this.form.primaryArtist.trim()) missing.push('the primary artist');
    if (!this.form.genre.trim()) missing.push('a genre');
    if (!this.form.rightsConfirmed) missing.push('the rights confirmation');
    return missing;
  }

  onAudioPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.useAudio(input.files?.[0] ?? null);
    input.value = '';
  }

  onCoverPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.useCover(input.files?.[0] ?? null);
    input.value = '';
  }

  useAudio(file: File | null): void {
    if (!file) return;
    this.audioFile.set(file);
    // A sensible default, never an overwrite of something the user typed.
    if (!this.form.title.trim()) {
      this.form.title = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
    }
  }

  useCover(file: File | null): void {
    if (!file) return;
    const old = this.coverPreview();
    if (old) URL.revokeObjectURL(old);

    const url = URL.createObjectURL(file);
    this.coverFile.set(file);
    this.coverPreview.set(url);
    this.coverSize.set(null);

    const image = new Image();
    image.onload = () => this.coverSize.set({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = url;
  }

  /** Opens the crop dialog on the current cover, locked to a square - better than the server's centre crop. */
  cropCover(): void {
    const cover = this.coverFile();
    if (cover) this.cropSource.set(cover);
  }

  onCropped(file: File): void {
    this.cropSource.set(null);
    const original = this.coverFile()?.name.replace(/\.[^.]+$/, '') ?? 'cover';
    this.useCover(new File([file], `${original}-square.png`, { type: file.type || 'image/png' }));
  }

  onRememberChange(value: boolean): void {
    this.rememberDetails.set(value);
    if (value) {
      this.saveDetails();
    } else {
      try { localStorage.removeItem(REMEMBER_KEY); } catch { /* storage unavailable */ }
    }
  }

  clearCover(): void {
    const old = this.coverPreview();
    if (old) URL.revokeObjectURL(old);
    this.coverFile.set(null);
    this.coverPreview.set(null);
    this.coverSize.set(null);
  }

  onInstrumentalChange(value: boolean): void {
    this.form.instrumental = value;
    if (value) this.form.lyrics = '';
  }

  async build(): Promise<void> {
    const audio = this.audioFile();
    if (!audio || this.missing().length > 0 || this.building()) return;

    this.error.set(null);
    this.result.set(null);
    this.revokePreviews();
    this.building.set(true);
    this.startTimer();
    if (this.rememberDetails()) this.saveDetails();

    try {
      const result = await firstValueFrom(
        this.releases.buildKit(audio, this.coverFile(), this.toMetadata(), this.options),
      );
      this.result.set(result);
      this.status.notify([`Release kit ready: ${result.files.length} files`]);
    } catch (err: unknown) {
      this.error.set(
        err instanceof ApiFailure
          ? { message: err.message, hint: err.hint }
          : { message: 'Building the release kit failed.' },
      );
    } finally {
      this.building.set(false);
      this.stopTimer();
    }
  }

  async preview(file: ReleaseKitFile): Promise<void> {
    await this.ensureObjectUrl(file);
  }

  async download(file: ReleaseKitFile): Promise<void> {
    const url = await this.ensureObjectUrl(file);
    if (!url) return;

    const result = this.result();
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name === 'release_kit.zip' && result
      ? `${this.safeName(`${result.primaryArtist} - ${result.title}`)}.zip`
      : file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  downloadZip(): void {
    const zip = this.result()?.files.find((f) => f.name === 'release_kit.zip');
    if (zip) void this.download(zip);
  }

  isVideo(file: ReleaseKitFile): boolean {
    return file.mimeType.startsWith('video/');
  }

  formatDuration(seconds: number): string {
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private async ensureObjectUrl(file: ReleaseKitFile): Promise<string | null> {
    const existing = this.previews()[file.name];
    if (existing) return existing;

    this.loadingFile.set(file.name);
    try {
      const blob = await firstValueFrom(this.releases.fetchFile(file.downloadUrl));
      const url = URL.createObjectURL(blob);
      this.previews.update((p) => ({ ...p, [file.name]: url }));
      return url;
    } catch (err: unknown) {
      this.error.set({
        message: err instanceof ApiFailure ? err.message : `Couldn't fetch ${file.label}.`,
        hint: 'Kits are kept for 24 hours and are lost when the API restarts. Build it again if it has expired.',
      });
      return null;
    } finally {
      this.loadingFile.set(null);
    }
  }

  private toMetadata(): ReleaseMetadata {
    const f = this.form;
    const list = (value: string) => value.split(',').map((v) => v.trim()).filter(Boolean);
    const optional = (value: string) => value.trim() || undefined;

    return {
      title: f.title.trim(),
      versionTitle: optional(f.versionTitle),
      primaryArtist: f.primaryArtist.trim(),
      featuredArtists: list(f.featuredArtists),
      songwriters: list(f.songwriters),
      producers: list(f.producers),
      genre: f.genre.trim(),
      secondaryGenre: optional(f.secondaryGenre),
      language: f.language,
      explicit: f.explicit,
      instrumental: f.instrumental,
      releaseDate: optional(f.releaseDate),
      recordLabel: optional(f.recordLabel),
      recordingCopyright: optional(f.recordingCopyright),
      compositionCopyright: optional(f.compositionCopyright),
      isrc: optional(f.isrc),
      upc: optional(f.upc),
      lyrics: f.instrumental ? undefined : optional(f.lyrics),
      rightsConfirmed: f.rightsConfirmed,
    };
  }

  private saveDetails(): void {
    const saved: Partial<Record<RememberedField, string>> = {};
    for (const field of REMEMBERED_FIELDS) saved[field] = String(this.form[field] ?? '').slice(0, 500);
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(saved));
    } catch {
      // Storage unavailable: nothing is remembered, which is the safe outcome.
    }
  }

  private restoreDetails(): void {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Record<RememberedField, unknown>>;
      for (const field of REMEMBERED_FIELDS) {
        if (typeof saved[field] === 'string') this.form[field] = saved[field] as string;
      }
      this.rememberDetails.set(true);
    } catch {
      // Unreadable or unavailable: start blank.
    }
  }

  private safeName(value: string): string {
    return value.replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').trim().slice(0, 80) || 'release';
  }

  private revokePreviews(): void {
    Object.values(this.previews()).forEach((url) => URL.revokeObjectURL(url));
    this.previews.set({});
  }

  private startTimer(): void {
    this.elapsed.set(0);
    this.timer = setInterval(() => this.elapsed.update((s) => s + 1), 1000);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
