import { CommonModule, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AssetFolder, DEFAULT_BRAND_CHANNEL, Project } from '../../core/models/api.models';
import {
  ChunkItemResponse,
  MediaDownloadRequest,
  MediaDownloadResult,
  MediaError,
  MediaProbeResponse,
  MediaSources,
  MediaSystemSettings,
  SupportedPlatform,
  VideoChunkResult,
} from '../../core/models/media-tools.models';
import { ApiService } from '../../core/services/api.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

/** What the pasted link looks like before the API has seen it. */
type DetectedSource =
  | { state: 'empty' }
  | { state: 'invalid' }
  | { state: 'unsupported'; host: string }
  | { state: 'supported'; host: string; platform: SupportedPlatform };

/** A finished download, kept for the session's "recent downloads" list. */
interface CompressionPreset {
  id: string;
  label: string;
  icon: string;
  tone: 'sky' | 'green' | 'amber' | 'pink';
  factor: number;
  saving: string;
  desc: string;
}

interface RecentDownload {
  result: MediaDownloadResult;
  title: string;
  platformName: string;
  savedLocally: boolean;
  projectName?: string;
}

/** The File System Access API's save picker (Chromium only); typed here because lib.dom lags. */
type SaveFileHandle = {
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
};
type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: { suggestedName?: string }) => Promise<SaveFileHandle>;
};

const NEW_PROJECT = '__new__';
const NEW_FOLDER = '__new__';
const DEFAULT_FOLDER_NAME = 'Downloads';

@Component({
  selector: 'app-media-tools',
  imports: [CommonModule, FormsModule, DecimalPipe, FileDropDirective],
  templateUrl: './media-tools.component.html',
  styleUrls: ['./media-tools.component.css'],
})
export class MediaToolsComponent implements OnInit, AfterViewInit {
  private readonly mediaTools = inject(MediaToolsService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  readonly status = inject(StatusService);

  // Optional project context if accessed under /projects/:projectId/...
  readonly store = inject(ProjectStore, { optional: true });

  // ViewChildren for chunk video players (keyed by index)
  @ViewChildren('chunkPlayer') chunkPlayers!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly activeTab = signal<'downloader' | 'chunker'>('downloader');

  // --- Downloader state ---
  readonly url = signal<string>('');
  readonly probing = signal<boolean>(false);
  readonly probeResult = signal<MediaProbeResponse | null>(null);
  readonly probeError = signal<MediaError | null>(null);

  readonly sources = signal<MediaSources | null>(null);
  readonly showSources = signal<boolean>(false);

  readonly detected = computed<DetectedSource>(() => {
    const raw = this.url().trim();
    if (!raw) return { state: 'empty' };

    let host: string;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { state: 'invalid' };
      host = parsed.hostname.toLowerCase().replace(/\.$/, '');
    } catch {
      return { state: 'invalid' };
    }

    const platform = this.sources()?.platforms.find((p) => p.domains.includes(host));
    return platform ? { state: 'supported', host, platform } : { state: 'unsupported', host };
  });

  /** Set when the API is up but cannot download at all, so the input explains why up front. */
  readonly downloaderProblem = computed<MediaError | null>(() => {
    const s = this.sources();
    if (!s) return null;
    if (!s.downloadEnabled) {
      return { code: 'download-disabled', message: 'Media downloading is turned off on this server.',
        hint: 'An administrator can enable it with Ingest:AllowMediaDownload.' };
    }
    if (!s.downloaderAvailable) {
      return { code: 'downloader-missing', message: 'The video downloader (yt-dlp) isn\'t installed on the API machine.',
        hint: 'Install it with "winget install yt-dlp", or set Ingest:YtDlp:ExecutablePath, then restart the API.' };
    }
    return null;
  });

  // --- Destination ---
  readonly saveToComputer = signal<boolean>(true);
  readonly askWhereToSave = signal<boolean>(false);
  readonly supportsSavePicker = typeof (window as SavePickerWindow).showSaveFilePicker === 'function';
  readonly addToProject = signal<boolean>(false);
  readonly projects = signal<Project[]>([]);
  readonly projectChoice = signal<string>('');
  readonly newProjectName = signal<string>('');
  readonly projectFolders = signal<AssetFolder[]>([]);
  readonly folderChoice = signal<string>(NEW_FOLDER);
  readonly newFolderName = signal<string>(DEFAULT_FOLDER_NAME);
  readonly addToTimeline = signal<boolean>(true);
  readonly NEW_PROJECT = NEW_PROJECT;
  readonly NEW_FOLDER = NEW_FOLDER;

  readonly chosenProjectName = computed(() => {
    const choice = this.projectChoice();
    if (choice === NEW_PROJECT) return this.newProjectName().trim() || 'new project';
    return this.projects().find((p) => p.id === choice)?.name ?? '';
  });

  /** Why the download button is disabled, or null when it can be pressed. */
  readonly destinationProblem = computed<string | null>(() => {
    if (!this.saveToComputer() && !this.addToProject()) return 'Choose at least one destination.';
    if (this.addToProject()) {
      if (!this.projectChoice()) return 'Pick a project, or create a new one.';
      if (this.projectChoice() === NEW_PROJECT && !this.newProjectName().trim()) return 'Name the new project.';
      if (this.folderChoice() === NEW_FOLDER && this.newFolderName().trim().length > 100) return 'Folder names are limited to 100 characters.';
    }
    return null;
  });

  readonly primaryActionLabel = computed(() => {
    const local = this.saveToComputer();
    const project = this.addToProject() ? this.chosenProjectName() : '';
    if (local && project) return `Download & add to ${project}`;
    if (project) return `Add to ${project}`;
    return this.askWhereToSave() && this.supportsSavePicker ? 'Download — choose location…' : 'Download to computer';
  });

  readonly recentDownloads = signal<RecentDownload[]>([]);
  readonly downloadStartedAt = signal<number | null>(null);
  readonly elapsedSeconds = signal<number>(0);
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  readonly downloadType = signal<'video' | 'audio'>('video');
  readonly selectedVideoFormat = signal<string>('mp4');
  readonly selectedResolution = signal<string>('1080p');
  readonly selectedAudioFormat = signal<string>('mp3');
  readonly selectedAudioBitrate = signal<string>('320k');
  readonly selectedCompression = signal<string>('original'); // 'original' | 'balanced' | 'high' | 'ultracompact'

  readonly downloading = signal<boolean>(false);
  readonly downloadProgressText = signal<string>('');
  readonly downloadResult = signal<RecentDownload | null>(null);
  readonly downloadError = signal<MediaError | null>(null);

  // --- Chunker state ---
  readonly chunkSourceType = signal<'url' | 'file' | 'asset'>('url');
  readonly chunkUrl = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileObjectUrl = signal<string | null>(null);
  readonly selectedAssetId = signal<string>('');
  readonly chunkDurationSeconds = signal<number>(10);
  readonly globalDefaultDuration = signal<number>(10);
  readonly accurateCut = signal<boolean>(false);
  readonly convertTo916 = signal<boolean>(false);
  readonly importAsClips = signal<boolean>(true);
  readonly chunkCompression = signal<string>('original'); // 'original' | 'balanced' | 'high' | 'ultracompact'

  readonly chunking = signal<boolean>(false);
  readonly chunkResult = signal<VideoChunkResult | null>(null);
  readonly chunkError = signal<string | null>(null);
  readonly savingGlobalDefault = signal<boolean>(false);

  // --- Live progress state ---
  readonly chunkProgressStep = signal<number>(0);    // 1 = downloading, 2 = splitting, 3 = packaging
  readonly chunkProgressPct = signal<number>(0);
  readonly chunkProgressText = signal<string>('');
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  // --- Synchronized playback state ---
  readonly activeChunkIndex = signal<number>(0);
  readonly isPlaying = signal<boolean>(false);
  readonly playFromChunkIndex = signal<number>(0);

  // --- Source video player ---
  readonly sourceVideoUrl = signal<string | null>(null);
  readonly sourceYoutubeEmbedUrl = signal<SafeResourceUrl | null>(null);
  readonly showSourcePlayer = signal<boolean>(false);

  // Video resolution & audio format options
  readonly videoFormats = ['mp4', 'webm', 'mov'];
  readonly resolutions = ['best', '1080p', '720p', '480p', '360p'];
  readonly audioFormats = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'opus'];
  readonly audioBitrates = ['320k', '192k', '128k'];

  // `factor` is the share of the original size each preset keeps; `tone` picks the card's
  // accent colour. The labels stay short because the cards show the estimate beside them.
  readonly compressionPresets: readonly CompressionPreset[] = [
    { id: 'original', label: 'Original', icon: '💎', tone: 'sky', factor: 1, saving: 'As downloaded', desc: 'No re-encode · fastest' },
    { id: 'balanced', label: 'Balanced', icon: '⚖️', tone: 'green', factor: 0.65, saving: '~35% smaller', desc: 'CRF 24 · visually lossless' },
    { id: 'high', label: 'High', icon: '🗜️', tone: 'amber', factor: 0.45, saving: '~55% smaller', desc: 'CRF 28 · compact' },
    { id: 'ultracompact', label: 'Ultra Compact', icon: '🪶', tone: 'pink', factor: 0.25, saving: '~75% smaller', desc: 'CRF 32 · 720p · smallest' },
  ];

  readonly durationPresets = [5, 10, 15, 20, 30, 60];

  // --- Computed size estimates ---
  readonly sizeEstimate = computed(() => {
    const probe = this.probeResult();
    const file = this.selectedFile();
    const chunkDur = this.chunkDurationSeconds();
    const comp = this.chunkCompression();

    let totalSizeBytes: number | null = null;
    let totalDuration: number | null = null;

    if (this.chunkSourceType() === 'url' && probe) {
      totalDuration = probe.durationSeconds;
      totalSizeBytes = probe.durationSeconds * 500_000; // ~500KB/s heuristic
    } else if (this.chunkSourceType() === 'file' && file) {
      totalSizeBytes = file.size;
      totalDuration = null; // unknown until probed
    }

    if (totalSizeBytes === null || chunkDur <= 0) return null;

    const effectiveTotalBytes = totalSizeBytes * this.compressionFactor(comp);

    if (totalDuration && totalDuration > 0) {
      const numChunks = Math.ceil(totalDuration / chunkDur);
      const chunkSizeBytes = (effectiveTotalBytes / totalDuration) * chunkDur;
      return {
        numChunks,
        chunkSizeMB: chunkSizeBytes / (1024 * 1024),
        totalSizeMB: effectiveTotalBytes / (1024 * 1024),
        totalDuration,
        isCompressed: comp !== 'original',
      };
    } else if (this.chunkSourceType() === 'file' && file) {
      return {
        numChunks: null,
        chunkSizeMB: null,
        totalSizeMB: effectiveTotalBytes / (1024 * 1024),
        totalDuration: null,
        isCompressed: comp !== 'original',
      };
    }
    return null;
  });

  // --- Download size estimate (for Downloader tab) ---
  readonly downloadSizeEstimate = computed(() => {
    const probe = this.probeResult();
    if (!probe || probe.durationSeconds <= 0) return null;

    const isAudio = this.downloadType() === 'audio';
    const comp = this.selectedCompression();
    const bytes = isAudio
      ? probe.durationSeconds * this.audioBytesPerSecond(this.selectedAudioBitrate())
      : this.videoBytes(this.selectedResolution(), comp);

    return {
      sizeMB: (bytes ?? 0) / (1024 * 1024),
      durationFormatted: probe.durationFormatted,
      isCompressed: !isAudio && comp !== 'original',
    };
  });

  /** Every compression preset with its estimated output, so the cards can be compared at a glance. */
  readonly compressionOptions = computed(() => {
    const res = this.selectedResolution();
    const original = this.videoBytes(res, 'original');
    return this.compressionPresets.map((p) => {
      const bytes = this.videoBytes(res, p.id);
      return {
        ...p,
        sizeMB: bytes === null ? null : bytes / (1024 * 1024),
        // Bar width relative to the uncompressed download, floored so the smallest stays visible.
        barPct: bytes === null || !original ? p.factor * 100 : Math.max(8, (bytes / original) * 100),
      };
    });
  });

  /** Estimated MB per resolution pill, so picking a resolution shows what it costs. */
  readonly resolutionSizes = computed(() => {
    const comp = this.selectedCompression();
    const sizes: Record<string, number | null> = {};
    for (const r of this.probeResult()?.availableResolutions ?? []) {
      const bytes = this.videoBytes(r.toLowerCase(), comp);
      sizes[r.toLowerCase()] = bytes === null ? null : bytes / (1024 * 1024);
    }
    return sizes;
  });

  /** Estimated MB per audio bitrate. */
  readonly audioBitrateSizes = computed(() => {
    const duration = this.probeResult()?.durationSeconds ?? 0;
    const sizes: Record<string, number | null> = {};
    for (const br of this.audioBitrates) {
      sizes[br] = duration > 0 ? (duration * this.audioBytesPerSecond(br)) / (1024 * 1024) : null;
    }
    return sizes;
  });

  /** Chunk-tab presets with the total size each would produce for the current source. */
  readonly chunkCompressionOptions = computed(() => {
    const est = this.sizeEstimate();
    const currentFactor = this.compressionFactor(this.chunkCompression());
    const baseMB = est ? est.totalSizeMB / currentFactor : null;
    return this.compressionPresets.map((p) => ({ ...p, sizeMB: baseMB === null ? null : baseMB * p.factor }));
  });

  readonly compressionLabel = computed(
    () => this.compressionPresets.find((p) => p.id === this.selectedCompression())?.label ?? 'Original',
  );

  compressionFactor(id: string): number {
    return this.compressionPresets.find((p) => p.id === id)?.factor ?? 1;
  }

  private audioBytesPerSecond(bitrate: string): number {
    const kbps = parseInt(bitrate, 10);
    return Number.isFinite(kbps) ? (kbps * 1000) / 8 : 24_000;
  }

  /**
   * A rough download size: a typical web bitrate for the output height times the duration,
   * scaled by the compression preset. A resolution above the source's own height can't make
   * the file bigger, so the source height caps it.
   */
  private videoBytes(resolution: string, compression: string): number | null {
    const probe = this.probeResult();
    if (!probe || probe.durationSeconds <= 0) return null;

    const sourceHeight = probe.height && probe.width ? Math.min(probe.width, probe.height) : 1080;
    const requested = resolution === 'best' ? sourceHeight : parseInt(resolution, 10) || sourceHeight;
    const height = Math.min(requested, sourceHeight);

    // Bytes/second at common heights (H.264, web delivery); interpolated by pixel count elsewhere.
    const bytesPerSecondAt1080 = 600_000;
    const bytesPerSecond = bytesPerSecondAt1080 * Math.max(0.15, (height * height) / (1080 * 1080));
    return probe.durationSeconds * bytesPerSecond * this.compressionFactor(compression);
  }

  ngOnInit(): void {
    // Load initial settings
    this.mediaTools.getMediaSettings().subscribe({
      next: (settings: MediaSystemSettings) => {
        const dur = settings.defaultChunkDurationSeconds || 10;
        this.globalDefaultDuration.set(dur);
        this.chunkDurationSeconds.set(dur);
      },
      error: () => {},
    });

    this.mediaTools.getSources().subscribe({
      next: (s) => this.sources.set(s),
      error: (err: unknown) => this.probeError.set(this.toMediaError(err, 'Could not load the supported sources.')),
    });

    this.api.listProjects().subscribe({
      next: (list) => {
        this.projects.set(list);
        // Opened inside a project: default to filing the download there.
        const current = this.store?.projectId?.();
        if (current && list.some((p) => p.id === current)) {
          this.addToProject.set(true);
          this.saveToComputer.set(false);
          this.selectProject(current);
        }
      },
      error: () => this.projects.set([]),
    });

    // Check query params for prefilled URL or tab
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'chunker') {
        this.activeTab.set('chunker');
      }
      if (params['url']) {
        this.url.set(params['url']);
        this.chunkUrl.set(params['url']);
        this.probe();
      }
      if (params['assetId']) {
        this.activeTab.set('chunker');
        this.chunkSourceType.set('asset');
        this.selectedAssetId.set(params['assetId']);
      }
    });
  }

  ngAfterViewInit(): void {}

  // --- Downloader actions ---
  probe(): void {
    const rawUrl = this.url().trim();
    const detected = this.detected();
    if (detected.state === 'empty') {
      this.probeError.set({ code: 'url-required', message: 'Paste a video link to get started.' });
      return;
    }
    // Obvious problems are explained locally; the API still validates everything it receives.
    if (detected.state === 'invalid') {
      this.probeError.set({ code: 'url-malformed', message: 'That isn\'t a complete link.',
        hint: 'Copy the full address, starting with https://' });
      return;
    }
    if (detected.state === 'unsupported' && this.sources()) {
      this.probeError.set({ code: 'url-host-not-allowed', message: `Downloading from ${detected.host} isn't supported.`,
        hint: `Supported sources: ${this.sources()!.platforms.map((p) => p.name).join(', ')}.` });
      return;
    }

    this.probing.set(true);
    this.probeError.set(null);
    this.probeResult.set(null);
    this.downloadResult.set(null);
    this.downloadError.set(null);
    this.sourceYoutubeEmbedUrl.set(null);

    this.mediaTools.probeUrl(rawUrl).subscribe({
      next: (res) => {
        this.probing.set(false);
        this.probeResult.set(res);
        this.chunkUrl.set(res.canonicalUrl || rawUrl);
        if (res.isShort) {
          this.convertTo916.set(false); // Already vertical
        }
        if (!res.availableResolutions.some((r) => r.toLowerCase() === this.selectedResolution())) {
          this.selectedResolution.set('best');
        }
        if (!this.newProjectName()) {
          this.newProjectName.set(res.title.slice(0, 80));
        }
        // Only YouTube ids can be embedded; other sites get the thumbnail and a link out.
        if (res.platformId === 'youtube' && res.videoId) {
          const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(res.videoId)}?enablejsapi=1&controls=1`;
          this.sourceYoutubeEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
          this.showSourcePlayer.set(false);
        }
      },
      error: (err: unknown) => {
        this.probing.set(false);
        this.probeError.set(this.toMediaError(err, 'Could not read that link.'));
      },
    });
  }

  /** A link pasted into the box is inspected straight away when it is from a supported site. */
  onUrlPaste(): void {
    setTimeout(() => {
      if (this.detected().state === 'supported' && !this.probing()) this.probe();
    });
  }

  async pasteFromClipboard(): Promise<void> {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;
      this.url.set(text);
      this.onUrlPaste();
    } catch {
      this.status.notify(['Clipboard access was blocked - paste the link with Ctrl+V instead.']);
    }
  }

  clearUrl(): void {
    this.url.set('');
    this.probeResult.set(null);
    this.probeError.set(null);
    this.downloadError.set(null);
    this.downloadResult.set(null);
    this.sourceYoutubeEmbedUrl.set(null);
  }

  useExample(platform: SupportedPlatform): void {
    this.showSources.set(false);
    this.probeError.set({ code: 'example', message: `${platform.name} links look like ${platform.example}`,
      hint: platform.notes });
  }

  selectProject(id: string): void {
    this.projectChoice.set(id);
    this.projectFolders.set([]);
    this.folderChoice.set(NEW_FOLDER);
    this.newFolderName.set(DEFAULT_FOLDER_NAME);
    if (!id || id === NEW_PROJECT) return;

    this.api.getFolders(id).subscribe({
      next: (list) => {
        if (this.projectChoice() !== id) return;
        const roots = (list ?? []).filter((f) => !f.parentId);
        this.projectFolders.set(roots);
        const downloads = roots.find((f) => f.name.toLowerCase() === DEFAULT_FOLDER_NAME.toLowerCase());
        if (downloads) this.folderChoice.set(downloads.id);
      },
      error: () => this.projectFolders.set([]),
    });
  }

  async download(andChunk = false): Promise<void> {
    const rawUrl = this.url().trim();
    const probe = this.probeResult();
    if (!rawUrl || !probe) return;

    if (andChunk) {
      this.sendToChunker();
      this.chunkVideo();
      return;
    }

    if (this.destinationProblem()) return;

    const isAudio = this.downloadType() === 'audio';
    const format = isAudio ? this.selectedAudioFormat() : this.selectedVideoFormat();

    // The save picker needs the click's user activation, so it opens before anything slow.
    let fileHandle: SaveFileHandle | null = null;
    if (this.saveToComputer() && this.askWhereToSave() && this.supportsSavePicker) {
      try {
        fileHandle = await (window as SavePickerWindow).showSaveFilePicker!({
          suggestedName: `${this.safeFileStem(probe.title)}.${format}`,
        });
      } catch {
        return; // Picker dismissed.
      }
    }

    this.downloading.set(true);
    this.downloadResult.set(null);
    this.downloadError.set(null);
    this.startElapsed();

    try {
      let projectId: string | undefined;
      let projectName: string | undefined;

      if (this.addToProject()) {
        if (this.projectChoice() === NEW_PROJECT) {
          this.downloadProgressText.set('Creating project…');
          const created = await firstValueFrom(this.api.createProject({
            name: this.newProjectName().trim().slice(0, 100),
            width: probe.isShort ? 1080 : 1920,
            height: probe.isShort ? 1920 : 1080,
            fps: 30,
            distributionIntent: 'Public',
            brandChannelId: DEFAULT_BRAND_CHANNEL,
          }));
          this.projects.update((list) => [created, ...list]);
          this.projectChoice.set(created.id);
          projectId = created.id;
          projectName = created.name;
        } else {
          projectId = this.projectChoice();
          projectName = this.chosenProjectName();
        }
      }

      this.downloadProgressText.set(`Downloading from ${probe.platformName}…`);
      const folderChoice = this.folderChoice();
      const req: MediaDownloadRequest = {
        url: rawUrl,
        format,
        resolution: isAudio ? undefined : this.selectedResolution(),
        audioBitrate: isAudio ? this.selectedAudioBitrate() : undefined,
        projectId,
        importAsAsset: !!projectId,
        assetName: probe.title,
        compressionPreset: this.selectedCompression(),
        folderId: projectId && folderChoice && folderChoice !== NEW_FOLDER ? folderChoice : undefined,
        folderName: projectId && folderChoice === NEW_FOLDER ? this.newFolderName().trim() || undefined : undefined,
        addToClipOrder: this.addToTimeline(),
      };

      const res = await firstValueFrom(this.mediaTools.downloadMedia(req));

      if (this.saveToComputer()) {
        if (fileHandle) {
          this.downloadProgressText.set('Saving to the chosen location…');
          const blob = await firstValueFrom(this.mediaTools.fetchFile(res.streamUrl));
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          this.triggerBrowserDownload(res.streamUrl, res.fileName);
        }
      }

      const recent: RecentDownload = {
        result: res,
        title: probe.title,
        platformName: probe.platformName,
        savedLocally: this.saveToComputer(),
        projectName,
      };
      this.downloadResult.set(recent);
      this.recentDownloads.update((list) => [recent, ...list].slice(0, 8));
      this.status.notify([projectName ? `Added ${res.fileName} to ${projectName}` : `Downloaded ${res.fileName}`]);

      if (projectId && projectId === this.store?.projectId?.()) {
        this.store?.refreshAssets?.();
        this.store?.refreshFolders?.();
      }
      if (projectId && res.folderId) this.selectProject(projectId);
    } catch (err: unknown) {
      this.downloadError.set(this.toMediaError(err, 'Download failed.'));
    } finally {
      this.downloading.set(false);
      this.stopElapsed();
    }
  }

  openProjectAssets(projectId: string): void {
    void this.router.navigate(['/projects', projectId, 'assets']);
  }

  sendToChunker(): void {
    const rawUrl = this.url().trim();
    this.activeTab.set('chunker');
    this.chunkSourceType.set('url');
    this.chunkUrl.set(rawUrl);
    // carry over embed url if available
  }

  triggerBrowserDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // --- Chunker actions ---
  setDuration(sec: number): void {
    this.chunkDurationSeconds.set(sec);
  }

  saveAsGlobalDefault(): void {
    const dur = this.chunkDurationSeconds();
    if (dur <= 0) return;

    this.savingGlobalDefault.set(true);
    this.mediaTools.updateChunkDuration(dur).subscribe({
      next: (val) => {
        this.savingGlobalDefault.set(false);
        this.globalDefaultDuration.set(val);
        this.status.notify([`Global default chunk duration updated to ${val}s`]);
      },
      error: () => {
        this.savingGlobalDefault.set(false);
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.useFile(input.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.useFile(event.dataTransfer.files[0]);
    }
  }

  /** Picked, dropped or pasted (Ctrl+V) source video. */
  useFile(file: File): void {
    this.selectedFile.set(file);
    this.chunkSourceType.set('file');
    // Create object URL for source preview
    const oldUrl = this.selectedFileObjectUrl();
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    this.selectedFileObjectUrl.set(URL.createObjectURL(file));
    this.sourceYoutubeEmbedUrl.set(null);
    this.showSourcePlayer.set(true);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // --- Live progress simulation ---
  private startProgressSimulation(estimatedChunks: number): void {
    this.chunkProgressStep.set(1);
    this.chunkProgressPct.set(0);
    this.chunkProgressText.set('Step 1/3: Downloading source video...');

    let tick = 0;
    const totalTicks = 100;
    const step1End = 25; // 0–25%  → downloading
    const step2End = 85; // 25–85% → splitting
    // 85–100% → packaging (handled on completion)

    this.progressInterval = setInterval(() => {
      tick++;
      const raw = (tick / totalTicks) * 100;
      const pct = Math.min(raw, 88); // don't reach 100 until done

      if (pct <= step1End) {
        this.chunkProgressStep.set(1);
        const localPct = (pct / step1End) * 100;
        this.chunkProgressText.set(`Step 1/3: Downloading source video... (${localPct.toFixed(0)}%)`);
      } else if (pct <= step2End) {
        this.chunkProgressStep.set(2);
        const progress = ((pct - step1End) / (step2End - step1End));
        const chunksDone = Math.floor(progress * estimatedChunks);
        this.chunkProgressText.set(
          `Step 2/3: Splitting into chunks... (${chunksDone}/${estimatedChunks} clips processed)`
        );
      } else {
        this.chunkProgressStep.set(3);
        this.chunkProgressText.set('Step 3/3: Packaging ZIP archive...');
      }

      this.chunkProgressPct.set(pct);
    }, 500);
  }

  private stopProgressSimulation(success: boolean): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (success) {
      this.chunkProgressPct.set(100);
      this.chunkProgressStep.set(3);
      this.chunkProgressText.set('✅ Done! All chunks ready.');
    }
  }

  chunkVideo(): void {
    const form = new FormData();
    const sourceType = this.chunkSourceType();

    if (sourceType === 'file') {
      const file = this.selectedFile();
      if (!file) {
        this.chunkError.set('Please select a video file to upload.');
        return;
      }
      form.append('file', file, file.name);
    } else if (sourceType === 'asset') {
      const assetId = this.selectedAssetId();
      if (!assetId) {
        this.chunkError.set('Please select a project video asset.');
        return;
      }
      form.append('assetId', assetId);
    } else {
      const url = this.chunkUrl().trim();
      if (!url) {
        this.chunkError.set('Please enter a video URL to chunk.');
        return;
      }
      form.append('url', url);
    }

    form.append('chunkDurationSeconds', this.chunkDurationSeconds().toString());
    form.append('accurateCut', this.accurateCut().toString());
    form.append('convertTo916', this.convertTo916().toString());
    form.append('compressionPreset', this.chunkCompression());

    const projectId = this.store?.projectId?.();
    if (projectId) {
      form.append('projectId', projectId);
      form.append('importAsClips', this.importAsClips().toString());
    }

    this.chunking.set(true);
    this.chunkError.set(null);
    this.chunkResult.set(null);
    this.activeChunkIndex.set(0);
    this.playFromChunkIndex.set(0);

    // Estimate chunks for progress simulation
    const probe = this.probeResult();
    const dur = this.chunkDurationSeconds();
    const estimatedChunks = probe ? Math.ceil(probe.durationSeconds / dur) : 5;
    this.startProgressSimulation(estimatedChunks);

    this.mediaTools.chunkVideo(form).subscribe({
      next: (res) => {
        this.stopProgressSimulation(true);
        this.chunking.set(false);
        this.chunkResult.set(res);
        this.status.notify([`Generated ${res.totalChunks} clips (${res.chunkDurationSeconds}s each)`]);
        if (this.importAsClips() && projectId) {
          this.store?.refreshAssets?.();
        }
      },
      error: (err: unknown) => {
        this.stopProgressSimulation(false);
        this.chunking.set(false);
        const e = this.toMediaError(err, 'Video chunking failed.');
        this.chunkError.set(e.hint ? `${e.message} ${e.hint}` : e.message);
      },
    });
  }

  downloadAllZip(): void {
    const result = this.chunkResult();
    if (!result) return;
    const url = this.mediaTools.getZipDownloadUrl(result.jobId);
    this.triggerBrowserDownload(url, `${result.jobId}_chunks.zip`);
  }

  openInClipStudio(): void {
    const projectId = this.store?.projectId?.();
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'clips']);
    }
  }

  sampleShortsUrl(): void {
    this.url.set('https://www.youtube.com/shorts/a84JRsB_3gI?t=15&feature=share');
    this.probe();
  }

  /** The API's explanation of a failure, falling back to something generic but true. */
  private toMediaError(err: unknown, fallback: string): MediaError {
    if (err instanceof ApiFailure) {
      return { code: err.code, message: err.message || fallback, hint: err.hint, detail: err.detail };
    }
    if (err instanceof DOMException) {
      return { code: 'save-failed', message: 'The file was downloaded but could not be written to the chosen location.',
        hint: 'Pick a folder you can write to, or turn off "Choose where to save".', detail: err.message };
    }
    return { code: 'unknown', message: fallback };
  }

  private safeFileStem(title: string): string {
    const stem = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 120);
    return stem || 'media';
  }

  private startElapsed(): void {
    this.downloadStartedAt.set(Date.now());
    this.elapsedSeconds.set(0);
    this.elapsedTimer = setInterval(() => {
      const started = this.downloadStartedAt();
      if (started) this.elapsedSeconds.set(Math.floor((Date.now() - started) / 1000));
    }, 1000);
  }

  private stopElapsed(): void {
    if (this.elapsedTimer) clearInterval(this.elapsedTimer);
    this.elapsedTimer = null;
    this.downloadStartedAt.set(null);
  }

  platformIcon(id: string | undefined): string {
    switch (id) {
      case 'youtube': return '▶';
      case 'linkedin': return 'in';
      case 'instagram': return '◎';
      case 'facebook': return 'f';
      case 'x': return '𝕏';
      case 'tiktok': return '♪';
      case 'vimeo': return 'v';
      case 'reddit': return 'r/';
      case 'dailymotion': return 'd';
      case 'twitch': return '⌁';
      default: return '🔗';
    }
  }

  // --- Synchronized chunk playback ---
  playFromChunk(index: number): void {
    const result = this.chunkResult();
    if (!result || index < 0 || index >= result.chunks.length) return;

    this.activeChunkIndex.set(index);
    this.playFromChunkIndex.set(index);

    // Pause all other players, play this one
    setTimeout(() => {
      const players = this.chunkPlayers.toArray();
      players.forEach((ref, i) => {
        const el = ref.nativeElement;
        if (i === index) {
          el.currentTime = 0;
          el.play().catch(() => {});
          // Scroll chunk card into view
          el.closest('.chunk-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          el.pause();
        }
      });
    }, 50);
  }

  onChunkEnded(index: number): void {
    const result = this.chunkResult();
    if (!result) return;
    const next = index + 1;
    if (next < result.chunks.length) {
      this.playFromChunk(next);
    } else {
      // Playback finished all chunks
      this.activeChunkIndex.set(0);
      this.isPlaying.set(false);
    }
  }

  onChunkPlay(index: number): void {
    this.activeChunkIndex.set(index);
    this.isPlaying.set(true);
    // Pause all others
    const players = this.chunkPlayers.toArray();
    players.forEach((ref, i) => {
      if (i !== index) {
        ref.nativeElement.pause();
      }
    });
  }

  onChunkPause(index: number): void {
    if (this.activeChunkIndex() === index) {
      this.isPlaying.set(false);
    }
  }

  playAll(): void {
    const start = this.playFromChunkIndex();
    this.playFromChunk(start);
  }

  stopAll(): void {
    this.isPlaying.set(false);
    const players = this.chunkPlayers.toArray();
    players.forEach((ref) => ref.nativeElement.pause());
  }

  toggleSourcePlayer(): void {
    this.showSourcePlayer.update((v) => !v);
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  totalChunkSizeBytes(chunks: ChunkItemResponse[]): number {
    return chunks.reduce((acc, c) => acc + c.fileSizeBytes, 0);
  }

  avgChunkSizeBytes(chunks: ChunkItemResponse[]): number {
    if (!chunks.length) return 0;
    return this.totalChunkSizeBytes(chunks) / chunks.length;
  }
}
