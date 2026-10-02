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

import {
  ChunkItemResponse,
  MediaDownloadRequest,
  MediaDownloadResult,
  MediaProbeResponse,
  MediaSystemSettings,
  VideoChunkResult,
} from '../../core/models/media-tools.models';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

@Component({
  selector: 'app-media-tools',
  imports: [CommonModule, FormsModule, DecimalPipe, FileDropDirective],
  templateUrl: './media-tools.component.html',
  styleUrls: ['./media-tools.component.css'],
})
export class MediaToolsComponent implements OnInit, AfterViewInit {
  private readonly mediaTools = inject(MediaToolsService);
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
  readonly url = signal<string>('https://www.youtube.com/shorts/a84JRsB_3gI?t=15&feature=share');
  readonly probing = signal<boolean>(false);
  readonly probeResult = signal<MediaProbeResponse | null>(null);
  readonly probeError = signal<string | null>(null);

  readonly downloadType = signal<'video' | 'audio'>('video');
  readonly selectedVideoFormat = signal<string>('mp4');
  readonly selectedResolution = signal<string>('1080p');
  readonly selectedAudioFormat = signal<string>('mp3');
  readonly selectedAudioBitrate = signal<string>('320k');
  readonly selectedCompression = signal<string>('original'); // 'original' | 'balanced' | 'high' | 'ultracompact'

  readonly downloading = signal<boolean>(false);
  readonly downloadProgressText = signal<string>('');
  readonly downloadResult = signal<MediaDownloadResult | null>(null);
  readonly downloadError = signal<string | null>(null);

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

  readonly compressionPresets = [
    { id: 'original', label: 'Original Quality', desc: 'No extra re-encoding / fast' },
    { id: 'balanced', label: 'Balanced (~35% smaller)', desc: 'CRF 24 - visually lossless' },
    { id: 'high', label: 'High Compression (~55% smaller)', desc: 'CRF 28 - compact size' },
    { id: 'ultracompact', label: 'Ultra Compact (~75% smaller)', desc: 'CRF 32 (720p) - minimum size' },
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

    // Apply compression factor to estimate
    const factor = comp === 'ultracompact' ? 0.25 : comp === 'high' ? 0.45 : comp === 'balanced' ? 0.65 : 1.0;
    const effectiveTotalBytes = totalSizeBytes * factor;

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
    const res = this.selectedResolution();

    // Base bitrate estimates (bytes/sec) by resolution
    let baseBytesPerSec: number;
    if (isAudio) {
      const br = this.selectedAudioBitrate();
      baseBytesPerSec = br === '320k' ? 40_000 : br === '128k' ? 16_000 : 24_000;
    } else {
      baseBytesPerSec = res === '360p' ? 150_000
        : res === '480p' ? 250_000
        : res === '720p' ? 400_000
        : res === '1080p' ? 600_000
        : 700_000; // 'best'
    }

    let totalBytes = probe.durationSeconds * baseBytesPerSec;

    // Apply compression factor
    if (!isAudio) {
      const factor = comp === 'ultracompact' ? 0.25 : comp === 'high' ? 0.45 : comp === 'balanced' ? 0.65 : 1.0;
      totalBytes *= factor;
    }

    return {
      sizeMB: totalBytes / (1024 * 1024),
      durationFormatted: probe.durationFormatted,
      isCompressed: comp !== 'original',
    };
  });

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
    if (!rawUrl) {
      this.probeError.set('Please enter a YouTube or video URL.');
      return;
    }

    this.probing.set(true);
    this.probeError.set(null);
    this.downloadResult.set(null);
    this.downloadError.set(null);

    this.mediaTools.probeUrl(rawUrl).subscribe({
      next: (res) => {
        this.probing.set(false);
        this.probeResult.set(res);
        this.chunkUrl.set(res.canonicalUrl || rawUrl);
        if (res.isShort) {
          this.convertTo916.set(false); // Already vertical
        }
        // Set up YouTube embed for source preview
        if (res.videoId) {
          const embedUrl = `https://www.youtube.com/embed/${res.videoId}?enablejsapi=1&controls=1`;
          this.sourceYoutubeEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
          this.showSourcePlayer.set(true);
        }
      },
      error: (err) => {
        this.probing.set(false);
        const msg = err.error?.message || err.message || 'Failed to inspect URL.';
        this.probeError.set(msg);
      },
    });
  }

  download(andChunk = false): void {
    const rawUrl = this.url().trim();
    if (!rawUrl) return;

    this.downloading.set(true);
    this.downloadProgressText.set(andChunk ? 'Downloading media to split into chunks...' : 'Downloading media from URL...');
    this.downloadResult.set(null);
    this.downloadError.set(null);

    const isAudio = this.downloadType() === 'audio';
    const projectId = this.store?.projectId?.() || undefined;

    const req: MediaDownloadRequest = {
      url: rawUrl,
      format: isAudio ? this.selectedAudioFormat() : this.selectedVideoFormat(),
      resolution: isAudio ? undefined : this.selectedResolution(),
      audioBitrate: isAudio ? this.selectedAudioBitrate() : undefined,
      projectId,
      importAsAsset: !andChunk && !!projectId,
      assetName: this.probeResult()?.title,
      compressionPreset: this.selectedCompression(),
    };

    this.mediaTools.downloadMedia(req).subscribe({
      next: (res) => {
        this.downloading.set(false);
        this.downloadResult.set(res);

        if (andChunk) {
          // Switch to chunker tab and begin chunking immediately!
          this.activeTab.set('chunker');
          this.chunkSourceType.set('url');
          this.chunkUrl.set(rawUrl);
          this.chunkVideo();
        } else {
          // Trigger direct browser download
          this.triggerBrowserDownload(res.streamUrl, res.fileName);
          this.status.notify([`Downloaded ${res.fileName}`]);
        }
      },
      error: (err) => {
        this.downloading.set(false);
        const msg = err.error?.message || err.message || 'Download failed.';
        this.downloadError.set(msg);
      },
    });
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
      error: (err) => {
        this.stopProgressSimulation(false);
        this.chunking.set(false);
        const msg = err.error?.message || err.message || 'Video chunking failed.';
        this.chunkError.set(msg);
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
