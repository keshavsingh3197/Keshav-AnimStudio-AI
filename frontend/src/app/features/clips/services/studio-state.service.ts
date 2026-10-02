import { Injectable, computed, inject, signal, OnDestroy } from '@angular/core';
import { catchError, concatMap, finalize, from, map, of } from 'rxjs';

import {
  Clip, ClipAudioBody, ClipFit, ClipOrder, ClipStudio, ExportQuality, MAX_CLIP_GAIN, RenderJob, ExportTimelineFormat,
  SHORTS_MAX_SECONDS, TRANSITIONS, WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition,
  aspectRatioLabel, isTerminal, videoFormat, OutroBody,
  TimelineItem, TimelineItemType, TrackControlState, TimelineItemTransform, TimelineItemTextStyle,
} from '../../../core/models/api.models';
import { ApiService } from '../../../core/services/api.service';
import { ProjectStore } from '../../../core/services/project-store';
import { StatusService } from '../../../core/services/status.service';
import {
  AudioOverlapRule, AudioOverlapRuleOrInherit, AudioOverlapSource,
  ClipAudioSetting, ClipColorSetting, ClipRow, ClipTextSetting, FILTER_PRESETS,
  FileUploadConflict, FilterPreset, JunctionSetting, JunctionView, MusicTrackRow, ScheduledClip, SideUploadTarget, TRACK_COLORS
} from '../models/clip-studio.models';

/** What the precedence chain decided for one clip, and the gains that follow from it. */
export interface ResolvedOverlap {
  rule: AudioOverlapRule;
  /** Which level won, so the inspector can say so instead of leaving the user guessing. */
  source: AudioOverlapSource;
  /** Name of the winning music track, when source is 'track'. */
  sourceLabel: string;
  /** Duck depth actually applied, 0-1. */
  level: number;
  /** Multiplier for the clip's own sound where music overlaps it. */
  videoGain: number;
  /** Multiplier for the music where this clip overlaps it. */
  musicGain: number;
  /** False when no music plays under this clip, in which case the rule is moot. */
  hasMusicUnder: boolean;
}

const DRAFT_KEY_PREFIX = 'animstudio_studio_draft_';

@Injectable()
export class StudioStateService implements OnDestroy {
  readonly api = inject(ApiService);
  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly Math = Math;
  readonly trackColors = TRACK_COLORS;

  // View & Layout State
  viewMode: 'grid' | 'list' = 'grid';
  selectAllCheckbox = false;
  showOrganizeMenu = false;
  readonly screenMode = signal<'normal' | 'window' | 'display'>('normal');
  readonly screenModeDropdownOpen = signal<boolean>(false);
  readonly appFullscreen = signal<boolean>(false);
  readonly showShortcutsModal = signal<boolean>(false);
  readonly dropActive = signal<boolean>(false);
  readonly uploadConflictModalOpen = signal<boolean>(false);
  readonly uploadConflicts = signal<FileUploadConflict[]>([]);
  readonly pendingNonConflictFiles = signal<File[]>([]);
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && this.screenMode() === 'display') {
          this.screenMode.set('window');
        }
      });
    }
  }

  // Core Data Signals
  readonly studio = signal<ClipStudio | null>(null);
  readonly rows = signal<ClipRow[]>([]);
  readonly timelineItems = signal<TimelineItem[]>([]);
  readonly timelineTracks = signal<TrackControlState[]>([
    { id: 'TXT1', name: 'Text', label: 'TXT1', kind: 'text', muted: false, locked: false, visible: true, color: '#10b981' },
    { id: 'IMG1', name: 'Image', label: 'IMG1', kind: 'image', muted: false, locked: false, visible: true, color: '#10b981' },
    { id: 'V2', name: 'Video Overlay', label: 'V2', kind: 'video', muted: false, locked: false, visible: true, color: '#06b6d4' },
    { id: 'V1', name: 'Primary Video', label: 'V1', kind: 'video', muted: false, locked: false, visible: true, color: '#3b82f6' },
    { id: 'A1', name: 'Voiceover', label: 'A1', kind: 'audio', muted: false, locked: false, visible: true, color: '#8b5cf6' },
    { id: 'A2', name: 'Music Bed', label: 'A2', kind: 'audio', muted: false, locked: false, visible: true, color: '#a855f7' },
  ]);
  readonly musicTracks = signal<MusicTrackRow[]>([]);
  readonly selectedMusicTrackKey = signal<string | null>(null);

  readonly selectedMusicTrack = computed<MusicTrackRow | null>(() => {
    const key = this.selectedMusicTrackKey();
    if (!key) return null;
    return this.musicTracks().find((t) => t.key === key) ?? null;
  });
  readonly musicAssetId = signal<string>('');
  readonly musicVolume = signal<number>(1.0);
  readonly musicCandidates = computed(() => this.studio()?.musicCandidates ?? []);
  readonly watermark = signal<WatermarkBody | null>(null);

  readonly watermarkSource = signal<'project' | 'custom' | 'none'>('project');
  readonly watermarkKind = signal<WatermarkKind>('None');
  readonly watermarkText = signal<string>('');
  readonly watermarkLogoId = signal<string>('');
  readonly watermarkPosition = signal<WatermarkPosition>('TopRight');
  readonly watermarkOpacity = signal<number>(0.8);
  readonly watermarkHeight = signal<number>(5.5);
  readonly watermarkMargin = signal<number>(4);
  readonly watermarkColor = signal<string>('#ffffff');
  readonly watermarkBackplate = signal<number>(0.3);
  readonly globalWatermark = signal<WatermarkBody | null>(null);

  resolveAssetId(clipOrId: string | Clip | undefined): string {
    if (!clipOrId) return '';
    if (typeof clipOrId !== 'string') {
      if (clipOrId.assetId) return clipOrId.assetId;
      return this.resolveAssetId(clipOrId.id);
    }
    const id = clipOrId;
    const studioClips = this.studio()?.clips || [];
    const directMatch = studioClips.find((c) => c.id === id);
    if (directMatch) return directMatch.assetId || directMatch.id;

    const rowMatch = this.rows().find((r) => r.clip.id === id) || this.allMediaRows().find((r) => r.clip.id === id);
    if (rowMatch && rowMatch.clip.assetId) return rowMatch.clip.assetId;

    // Check if ID has a split or duplicate suffix like '_dup_123', '_part_123', '_a_123', '_b_123'
    const underscoreIdx = id.indexOf('_');
    let cleaned = id;
    if (underscoreIdx >= 24) {
      cleaned = id.slice(0, underscoreIdx);
    } else {
      cleaned = id.replace(/_(dup|part|[ab]|copy|split).*$/i, '');
    }
    if (cleaned !== id) {
      return this.resolveAssetId(cleaned);
    }
    return id;
  }

  assetUrl(clipOrId: string | Clip | undefined): string {
    if (!clipOrId) return '';
    const resolved = this.resolveAssetId(clipOrId);
    return this.api.assetUrl(resolved);
  }

  readonly thumbnailVersion = signal<number>(2);

  assetThumbnailUrl(clipOrId: string | Clip | undefined): string {
    if (!clipOrId) return '';
    const resolved = this.resolveAssetId(clipOrId);
    return this.api.assetThumbnailUrl(resolved, this.thumbnailVersion());
  }

  refreshThumbnails(): void {
    this.thumbnailVersion.update((v) => v + 1);
  }

  // Cross-Component Drag-and-Drop Contract (Guardrail 4)
  readonly draggingAsset = signal<ClipRow | null>(null);

  // Media Library Filtering & Paging
  readonly searchQuery = signal<string>('');
  readonly activeCategory = signal<'all' | 'video' | 'image' | 'audio'>('all');
  readonly statusFilter = signal<'all' | 'unused' | 'in_cut'>('all');
  readonly pageSize = signal<number>(12);
  readonly currentPage = signal<number>(0);
  readonly selectedLibraryIds = signal<Set<string>>(new Set<string>());

  readonly allMediaRows = computed<ClipRow[]>(() => {
    const studio = this.studio();
    if (!studio) return [];

    const seenIds = new Set<string>();
    const mediaList: ClipRow[] = [];

    // 1. Project visual/video clips from studio.clips
    for (const clip of studio.clips || []) {
      if (!seenIds.has(clip.id)) {
        seenIds.add(clip.id);
        const type = this.getClipType(clip);
        let isIncluded = false;
        if (type === 'video') {
          isIncluded = this.rows().some((r) => (r.clip.id === clip.id || this.resolveAssetId(r.clip) === clip.id) && r.included);
        } else if (type === 'image') {
          isIncluded = this.timelineItems().some(
            (it) => (it.trackId === 'IMG1' || it.trackId === 'IMG') && (it.src === clip.id || it.id === clip.id)
          );
        } else if (type === 'audio') {
          isIncluded = this.musicAssetId() === clip.id || this.musicTracks().some((t) => t.assetId === clip.id);
        }
        mediaList.push({ clip, included: isIncluded });
      }
    }

    // 2. Extra project image/logo candidates
    for (const img of studio.logoCandidates || []) {
      if (!seenIds.has(img.id)) {
        seenIds.add(img.id);
        const isIncluded = this.timelineItems().some(
          (it) => (it.trackId === 'IMG1' || it.trackId === 'IMG' || it.trackId === 'V3' || it.trackId === 'V2') && (it.src === img.id || it.id === img.id)
        );
        mediaList.push({
          clip: {
            id: img.id,
            name: img.name,
            fileSizeBytes: img.fileSizeBytes,
            durationSeconds: 5.0,
            width: img.width,
            height: img.height,
            hasAudio: false,
          },
          included: isIncluded,
        });
      }
    }

    // 3. Audio / music candidates
    for (const aud of studio.musicCandidates || []) {
      if (!seenIds.has(aud.id)) {
        seenIds.add(aud.id);
        mediaList.push({
          clip: {
            id: aud.id,
            name: aud.name,
            fileSizeBytes: aud.fileSizeBytes,
            durationSeconds: aud.durationSeconds,
            hasAudio: true,
          },
          included: this.musicAssetId() === aud.id || this.musicTracks().some((t) => t.assetId === aud.id),
        });
      }
    }

    return mediaList;
  });

  readonly filteredRows = computed(() => {
    let list = this.allMediaRows();
    const cat = this.activeCategory();
    if (cat !== 'all') {
      list = list.filter((r) => this.getClipType(r.clip) === cat);
    }
    const stat = this.statusFilter();
    if (stat === 'unused') {
      list = list.filter((r) => !this.isClipOnTimeline(r.clip.id));
    } else if (stat === 'in_cut') {
      list = list.filter((r) => this.isClipOnTimeline(r.clip.id));
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter((r) => r.clip.name.toLowerCase().includes(q));
    }
    return list;
  });

  readonly totalItems = computed(() => this.filteredRows().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  readonly pagedRows = computed(() => {
    const r = this.filteredRows();
    const start = this.currentPage() * this.pageSize();
    return r.slice(start, start + this.pageSize());
  });
  readonly startIndex = computed(() => (this.totalItems() === 0 ? 0 : this.currentPage() * this.pageSize() + 1));
  readonly endIndex = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalItems()));

  readonly selectedCount = computed(() => this.selectedLibraryIds().size);
  readonly videoCount = computed(() => this.allMediaRows().filter((r) => this.getClipType(r.clip) === 'video').length);
  readonly imageCount = computed(() => this.allMediaRows().filter((r) => this.getClipType(r.clip) === 'image').length);
  readonly audioCount = computed(() => this.allMediaRows().filter((r) => this.getClipType(r.clip) === 'audio').length);
  readonly totalMediaCount = computed(() => this.videoCount() + this.imageCount() + this.audioCount());

  readonly unusedCount = computed(() => this.allMediaRows().filter((r) => !this.isClipOnTimeline(r.clip.id)).length);
  readonly inCutCount = computed(() => this.allMediaRows().filter((r) => this.isClipOnTimeline(r.clip.id)).length);

  readonly selectedUnplacedCount = computed(() => {
    let count = 0;
    for (const id of this.selectedLibraryIds()) {
      if (!this.isClipOnTimeline(id)) count++;
    }
    return count;
  });

  readonly selectedPlacedCount = computed(() => {
    let count = 0;
    for (const id of this.selectedLibraryIds()) {
      if (this.isClipOnTimeline(id)) count++;
    }
    return count;
  });

  // Export & Project Signals
  readonly job = signal<RenderJob | null>(null);
  readonly blockedReason = signal<string | null>(null);
  readonly uploading = signal<boolean>(false);
  readonly uploadDone = signal<number>(0);
  readonly uploadTotal = signal<number>(0);
  readonly running = signal<boolean>(false);
  readonly sideUpload = signal<SideUploadTarget | null>(null);
  readonly lastSavedTime = signal<string | null>(null);
  readonly restoredDraftTime = signal<string | null>(null);
  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly exportName = signal<string>('');
  readonly exportFormat = signal<'mp4' | 'webm'>('mp4');
  readonly exportModalOpen = signal<boolean>(false);
  readonly exportResolution = signal<'1080p' | '720p' | '4k' | 'short_9_16' | 'square_1_1'>('1080p');
  /** Picture quality of the delivered encode; High unless the user picks otherwise. */
  readonly exportQuality = signal<ExportQuality>('High');
  readonly exportIncludeWatermark = signal<boolean>(true);
  /** End the export with the saved outro / "support us" QR card. Ignored when none is set up. */
  readonly exportIncludeOutro = signal<boolean>(true);

  /** The project's brand channel's outro, which an export uses when the project has none of its own. */
  readonly globalOutro = signal<OutroBody | null>(null);
  /** That channel's display name (one per YouTube channel). */
  readonly brandChannelName = signal<string | null>(null);
  /** That channel's watermark - the project's, while it follows its channel (the default). */
  readonly channelWatermark = signal<WatermarkBody | null>(null);

  /** The end card an export appends - mirrors the server: the project's own, else the studio's. */
  readonly endCard = computed<{ source: 'project' | 'global'; label: string; seconds: number } | null>(() => {
    const own = this.store.project()?.defaultOutro;
    if (own && own.kind !== 'None') {
      // A bumper video runs its own length; the asset knows it when it is in this project.
      const asset = own.kind === 'Video' && own.assetId
        ? this.store.assets().find((a) => a.id === own.assetId) : undefined;
      return {
        source: 'project',
        label: own.kind === 'Video' ? 'Project outro video' : 'Project end-card graphic',
        seconds: asset?.durationSeconds || own.durationSeconds || 4,
      };
    }
    const g = this.globalOutro();
    if (g && g.kind !== 'None') {
      const what = g.kind === 'Card' ? 'QR end card' : `outro ${g.kind.toLowerCase()}`;
      const channel = this.brandChannelName() ?? 'Default';
      return { source: 'global', label: `"${channel}" channel ${what}`, seconds: g.durationSeconds || 4 };
    }
    return null;
  });

  /** Seconds the end card adds after the cut, when this export will include it. */
  readonly endCardTailSeconds = computed(() => (this.exportIncludeOutro() ? this.endCard()?.seconds ?? 0 : 0));

  // Live Export Progress Monitor Signals
  readonly exportProgressOpen = signal<boolean>(false);
  readonly exportProgressMinimized = signal<boolean>(false);
  readonly exportElapsedSeconds = signal<number>(0);
  readonly exportEtaSeconds = signal<number | null>(null);
  readonly exportSpeed = signal<string>('1.0x');
  readonly stageDurations = signal<Record<string, number>>({});
  readonly exportPreviewModalOpen = signal<boolean>(false);

  readonly scenesTotal = computed(() => {
    const j = this.job();
    if (j && j.scenesTotal > 0) return j.scenesTotal;
    return this.included().length || 1;
  });

  readonly scenesDone = computed(() => {
    const j = this.job();
    return j ? j.scenesDone : 0;
  });

  readonly scenesRemaining = computed(() => {
    return Math.max(0, this.scenesTotal() - this.scenesDone());
  });

  readonly exportElapsedFormatted = computed(() => {
    const j = this.job();
    let totalSecs = this.exportElapsedSeconds();
    if (this.exportIsCompleted() && j) {
      if (j.diagnostics?.totalSeconds) {
        totalSecs = Math.round(j.diagnostics.totalSeconds);
      } else if (j.completedAt && j.createdAt) {
        totalSecs = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      }
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly exportEtaFormatted = computed(() => {
    const eta = this.exportEtaSeconds();
    if (eta === null || eta <= 0) return '--:--';
    const mins = Math.floor(eta / 60);
    const secs = eta % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly exportIsCompleted = computed(() => {
    const s = this.job()?.status;
    return s === 'Completed' || s === 'CompletedWithWarnings';
  });

  readonly exportIsFailed = computed(() => {
    return this.job()?.status === 'Failed';
  });

  readonly currentProcessingClipIndex = computed<number>(() => {
    const done = this.scenesDone();
    const total = this.scenesTotal();
    if (done >= total) return total;
    return done + 1;
  });

  readonly currentProcessingClipName = computed<string>(() => {
    const idx = this.scenesDone();
    const sched = this.clipSchedule();
    if (idx >= 0 && idx < sched.length) {
      return sched[idx].clip.name;
    }
    const inc = this.included();
    if (idx >= 0 && idx < inc.length) {
      return inc[idx].clip.name;
    }
    return '';
  });

  readonly timelineDurationFormatted = computed<string>(() => {
    const totalSec = Math.round(this.totalSeconds());
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s (${totalSec}s)`;
  });

  readonly hasNonCutTransitions = computed<boolean>(() => {
    const list = this.junctionsList();
    return list.some((j) => j.transition && j.transition !== 'None');
  });

  readonly exportPipelineMode = computed<string>(() => {
    if (this.hasNonCutTransitions()) {
      return 'Multi-Batch Crossfade Blending (High Quality)';
    }
    return 'Lossless Concat Demuxer Stream-Copy (Ultra-Fast)';
  });

  readonly timelineMatrixItems = computed(() => {
    const sched = this.clipSchedule();
    const done = this.scenesDone();
    const isCompleted = this.exportIsCompleted();
    const isRunning = this.running();

    return sched.map((entry, index) => {
      let status: 'completed' | 'active' | 'queued' = 'queued';
      if (isCompleted) {
        status = 'completed';
      } else if (index < done) {
        status = 'completed';
      } else if (index === done && isRunning) {
        status = 'active';
      }
      return {
        index: index + 1,
        name: entry.clip.name,
        duration: entry.durationSeconds,
        status,
      };
    });
  });

  readonly exportSpeedDisplay = computed(() => {
    const j = this.job();
    if (j?.diagnostics?.speedFactor) return j.diagnostics.speedFactor;
    if (this.exportIsCompleted() && j?.outputDurationSeconds && j?.completedAt && j?.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      return `${(j.outputDurationSeconds / totalSec).toFixed(1)}x`;
    }
    return this.exportSpeed();
  });

  readonly pipelineStages = computed(() => {
    const j = this.job();
    const curStage = j?.currentStage ?? (this.running() ? 'Preparing' : 'Pending');
    const isDone = j?.status === 'Completed' || j?.status === 'CompletedWithWarnings';

    let durations = this.stageDurations();
    if (j?.diagnostics) {
      durations = {
        Preparing: Math.round(j.diagnostics.preparingSeconds),
        RenderingScene: Math.round(j.diagnostics.encodingSeconds),
        Merging: Math.round(j.diagnostics.mergingSeconds),
        Publishing: Math.round(j.diagnostics.publishingSeconds),
      };
    } else if (isDone && j?.completedAt && j?.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      const prep = Math.max(1, Math.round(totalSec * 0.08));
      const enc = Math.max(1, Math.round(totalSec * 0.72));
      const merge = Math.max(1, Math.round(totalSec * 0.15));
      const pub = Math.max(1, totalSec - (prep + enc + merge));
      durations = { Preparing: prep, RenderingScene: enc, Merging: merge, Publishing: pub };
    }

    const itemsCount = j?.diagnostics?.itemsCount || this.scenesTotal();

    const stages = [
      {
        id: 'Preparing',
        name: 'Step 1: Asset Preparation & Media Staging',
        summary: 'Resolving media sources, local caching and pre-flight validation',
        icon: '📁',
        durationSec: durations['Preparing'] ?? 0,
      },
      {
        id: 'RenderingScene',
        name: 'Step 2: Clip Conformance & Filter Graph Encoding',
        summary: isDone ? `Conformed and encoded ${itemsCount} clip streams` : `${this.scenesDone()} of ${this.scenesTotal()} items processed (${this.scenesRemaining()} remaining)`,
        icon: '🎬',
        durationSec: durations['RenderingScene'] ?? 0,
      },
      {
        id: 'Merging',
        name: 'Step 3: Stream Concat & Seamless Transitions',
        summary: 'Crossfade blending, multi-batch cascades & timeline assembly',
        icon: '🔀',
        durationSec: durations['Merging'] ?? 0,
      },
      {
        id: 'Publishing',
        name: 'Step 4: Final Multiplexing & MP4 FastStart',
        summary: 'Validating output container, FastStart atom placement & storage upload',
        icon: '📦',
        durationSec: durations['Publishing'] ?? 0,
      },
    ];

    const order = ['Preparing', 'RenderingScene', 'Merging', 'Publishing'];
    const currentIdx = order.indexOf(curStage);

    return stages.map((st, idx) => {
      let state: 'completed' | 'active' | 'pending' = 'pending';
      if (isDone) {
        state = 'completed';
      } else if (currentIdx > idx) {
        state = 'completed';
      } else if (currentIdx === idx) {
        state = 'active';
      } else {
        state = 'pending';
      }
      return { ...st, state };
    });
  });

  // Edit Settings
  readonly orderText = signal<string>('');
  readonly orderResult = signal<ClipOrder | null>(null);
  readonly fit = signal<ClipFit>('Contain');
  readonly transition = signal<string>('None');
  readonly transitionSeconds = signal<number>(0);
  readonly exportOverrideTransitions = signal<boolean>(false);
  readonly junctions = signal<Record<string, JunctionSetting>>({});
  readonly junctionOverrides = signal<Map<string, JunctionSetting>>(new Map());
  readonly openJunctionKey = signal<string | null>(null);
  readonly selectedJunctionKey = signal<string | null>(null);
  readonly transitionModalOpen = signal<boolean>(false);
  readonly previewJunction = signal<{ key: string; leftClip: Clip; rightClip: Clip; transition: string; seconds: number } | null>(null);
  readonly clipSounds = signal<Record<string, ClipAudioSetting>>({});
  readonly clipTransforms = signal<Record<string, TimelineItemTransform>>({});
  readonly clipColors = signal<Record<string, ClipColorSetting>>({});
  readonly clipTexts = signal<Record<string, ClipTextSetting>>({});
  readonly transitions = TRANSITIONS;
  readonly filterPresets = FILTER_PRESETS;

  // Trims, Framing, Fade, Color, Lower-Third Maps
  readonly clipTrims = signal<Map<string, { startSeconds: number; endSeconds: number }>>(new Map());
  readonly clipFraming = signal<Map<string, { fit: 'Contain' | 'Cover'; zoom: number; panY: 'center' | 'top' | 'bottom' }>>(new Map());
  readonly clipAudioFade = signal<Map<string, { fadeInSeconds: number; fadeOutSeconds: number }>>(new Map());
  readonly clipColor = signal<Map<string, ClipColorSetting>>(new Map());
  readonly clipText = signal<Map<string, ClipTextSetting>>(new Map());

  // Global Look / Filter Defaults
  readonly activeFilter = signal<string>('none');
  readonly filterBrightness = signal<number>(100);
  readonly filterContrast = signal<number>(100);
  readonly filterSaturation = signal<number>(100);
  readonly filterSepia = signal<number>(0);
  readonly filterBlur = signal<number>(0);

  // Lower-third Defaults
  readonly lowerThirdEnabled = signal<boolean>(false);
  readonly lowerThirdTitle = signal<string>('');
  readonly lowerThirdSubtitle = signal<string>('');

  // Zoom & Safe Zones
  readonly zoomLevel = signal<'Fit' | '50%' | '100%'>('Fit');
  readonly snapshotFlash = signal<boolean>(false);

  // Timeline Navigation & Playback Signals
  readonly isPlaying = signal<boolean>(false);
  readonly playbackSpeed = signal<number>(1.0);
  readonly pxPerSecond = signal<number>(40);
  readonly timelineThumbnailMode = signal<'filmstrip' | 'simple'>('filmstrip');
  readonly snapEnabled = signal<boolean>(true);
  readonly snapLineTime = signal<number | null>(null);
  readonly snapLineLeftPx = signal<number | null>(null);
  readonly dragIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);
  readonly previewAspectOverride = signal<'auto' | '16:9' | '9:16' | '1:1' | '4:5'>('auto');
  readonly showShortsSafeZone = signal<boolean>(false);
  readonly showBroadcastSafeZone = signal<boolean>(false);
  readonly monitorVolume = signal<number>(1.0);
  readonly isMonitorMuted = signal<boolean>(false);
  readonly isLooping = signal<boolean>(false);

  // Playhead Performance Isolation (Guardrail 2):
  // Throttle currentTime signal to 10fps for text timecode displays
  readonly currentTime = signal<number>(0);
  private exactCurrentTime = 0;
  private lastTimeSignalEmit = 0;
  readonly seekRequest = signal<{ time: number; nonce: number } | null>(null);

  // Selection & Inspector State
  readonly selectedClipId = signal<string | null>(null);
  readonly selectedTimelineClipIndex = signal<number | null>(null);
  readonly selectedTimelineItemId = signal<string | null>(null);
  readonly selectedTimelineItemIds = signal<Set<string>>(new Set<string>());
  readonly activeInspectorTab = signal<'clip' | 'color' | 'audio' | 'text' | 'effects' | 'transitions'>('clip');
  readonly targetScope = signal<'auto' | 'selected' | 'all' | 'current' | 'under_music' | 'under_selected_music'>('selected');
  readonly scopeDropdownOpen = signal<boolean>(false);
  readonly toolDropdownOpen = signal<boolean>(false);

  // Audio Mixer Signals
  readonly trackV1Volume = signal<number>(1.0);
  readonly trackV2Volume = signal<number>(1.0);
  readonly trackA1Volume = signal<number>(1.0);
  readonly trackA2Volume = signal<number>(0.8);
  readonly trackV1Muted = signal<boolean>(false);
  readonly trackV2Muted = signal<boolean>(false);
  readonly trackA1Muted = signal<boolean>(false);
  readonly trackA2Muted = signal<boolean>(false);
  /**
   * Project-wide default for how clip sound and music share the mix. The bottom of the
   * precedence chain: a music track or an individual clip may override it, nothing else.
   */
  readonly projectOverlapRule = signal<AudioOverlapRule>('PlayBoth');
  /** How far the ducked side drops, 0-1. Shared by DuckMusic and DuckVideo. */
  readonly duckLevel = signal<number>(0.25);
  /** @deprecated Kept as an alias while older call sites are migrated. */
  readonly videoDuckLevel = this.duckLevel;
  readonly audioInspectorViewMode = signal<'auto' | 'clip' | 'mixer'>('auto');

  /**
   * Which of the two audio views is showing. Timeline selection is the only thing that
   * decides it automatically - the scope chooser no longer swaps panels behind the user's
   * back, it only widens what an edit applies to.
   */
  readonly effectiveAudioInspectorView = computed<'clip' | 'mixer'>(() => {
    const mode = this.audioInspectorViewMode();
    if (mode === 'mixer') return 'mixer';
    if (mode === 'clip') return 'clip';
    return this.hasAudioSelection() ? 'clip' : 'mixer';
  });

  /** True when something on the timeline is selected for the Selection view to describe. */
  readonly hasAudioSelection = computed<boolean>(() =>
    Boolean(
      this.selectedClipId() ||
      this.selectedTimelineItemId() ||
      this.selectedTimelineItemIds().size > 0 ||
      this.selectedMusicTrackKey()
    )
  );

  // Project Aspect and Format
  readonly format = computed(() => {
    const project = this.store.project();
    return project ? videoFormat(project.width, project.height) : 'Video';
  });

  readonly aspect = computed(() => {
    const project = this.store.project();
    return project ? aspectRatioLabel(project.width, project.height) : '';
  });

  readonly formatClass = computed(() => (this.format() === 'Short' ? 'pill ok' : 'pill'));
  readonly overShortsLimit = computed(() => this.format() !== 'Video' && this.totalSeconds() > SHORTS_MAX_SECONDS);
  readonly shortsMaxSeconds = SHORTS_MAX_SECONDS;

  // Computed Values
  readonly included = computed(() => this.rows().filter((r) => r.included));
  readonly includedWithIndex = computed(() => {
    const result: { row: ClipRow; index: number }[] = [];
    this.rows().forEach((r, idx) => {
      if (r.included) result.push({ row: r, index: idx });
    });
    return result;
  });

  // ────────────────────────────────────────────────────────────────
  // THE INSERT CARET
  //
  // The V1 cut is an ordered list, so it gets a cursor, exactly like text. Everything that
  // adds clips - the library "Add to Cut", a drag from the media dock, a paste - lands at
  // the caret instead of being appended to the end, and the caret is drawn on the timeline
  // so the landing spot is visible BEFORE the action rather than explained after it.
  // ────────────────────────────────────────────────────────────────

  /** Position in the CUT order where new clips land. null means "at the end". */
  readonly insertIndex = signal<number | null>(null);

  /** The caret clamped to the cut as it stands now; clips may have been removed under it. */
  readonly effectiveInsertIndex = computed<number>(() => {
    const count = this.included().length;
    const raw = this.insertIndex();
    if (raw === null) return count;
    return Math.max(0, Math.min(count, raw));
  });

  /** Plain words for the caret, for the media dock and the paste toast. */
  readonly insertPointLabel = computed<string>(() => {
    const cut = this.included();
    const at = this.effectiveInsertIndex();
    if (cut.length === 0) return 'as the first clip';
    if (at >= cut.length) return `at the end (after ${cut[cut.length - 1].clip.name})`;
    if (at === 0) return `at the start (before ${cut[0].clip.name})`;
    return `after ${cut[at - 1].clip.name}`;
  });

  /**
   * The pending "where should these go?" question, or null when nothing is being placed.
   * The caret supplies the default, but the user asked to be asked, so adding and pasting
   * both stop here first and show the resulting order before committing to it.
   */
  readonly insertPrompt = signal<{
    kind: 'add' | 'paste';
    /** Library clips waiting to be added; empty for a paste, which reads the clipboard. */
    clipIds: string[];
    count: number;
  } | null>(null);

  /** The cut position the dialog currently proposes. */
  readonly insertPromptIndex = signal<number>(0);

  /** Ticked in the dialog to stop it appearing again until the page is reloaded. */
  readonly skipInsertPrompt = signal<boolean>(false);

  /** The cut, as choices for the dialog's "after which clip" list. */
  readonly insertPromptOptions = computed<{ index: number; label: string }[]>(() => {
    const cut = this.included();
    const options: { index: number; label: string }[] = [
      { index: 0, label: cut.length === 0 ? 'As the first clip' : `At the start — before #1 ${cut[0].clip.name}` },
    ];
    cut.forEach((row, i) => {
      options.push({ index: i + 1, label: `After #${i + 1} ${row.clip.name}` });
    });
    return options;
  });

  /** Cut position nearest the playhead, offered as its own choice in the dialog. */
  readonly playheadCutIndex = computed<number>(() => {
    const time = this.currentTime();
    const schedule = this.clipSchedule();
    for (let i = 0; i < schedule.length; i++) {
      if (time < schedule[i].endSeconds) {
        const mid = (schedule[i].startSeconds + schedule[i].endSeconds) / 2;
        return time < mid ? i : i + 1;
      }
    }
    return schedule.length;
  });

  /** "… #6 Sage Dancing → [4 new clips] → #7 Narada Walking …" for the dialog preview. */
  readonly insertPromptPreview = computed<{ before: string; after: string }>(() => {
    const cut = this.included();
    const at = Math.max(0, Math.min(cut.length, this.insertPromptIndex()));
    return {
      before: at > 0 ? `#${at} ${cut[at - 1].clip.name}` : 'start of the timeline',
      after: at < cut.length ? `#${at + 1} ${cut[at].clip.name}` : 'end of the timeline',
    };
  });

  /**
   * Opens the placement dialog, or places straight away when the user has said not to ask.
   * Returns true when the caller should stop and wait for the dialog.
   */
  private askWhereToInsert(kind: 'add' | 'paste', clipIds: string[], count: number): boolean {
    if (this.skipInsertPrompt()) return false;
    this.insertPromptIndex.set(this.effectiveInsertIndex());
    this.insertPrompt.set({ kind, clipIds, count });
    return true;
  }

  confirmInsertPrompt(): void {
    const prompt = this.insertPrompt();
    if (!prompt) return;

    this.insertIndex.set(this.insertPromptIndex());
    this.insertPrompt.set(null);

    if (prompt.kind === 'paste') this.performPaste();
    else this.performAddToCut(prompt.clipIds);
  }

  cancelInsertPrompt(): void {
    this.insertPrompt.set(null);
  }

  // ---------------------------------------------------------------------------
  // Split dialog (Task 2 — HANDOFF_TRANSITIONS_AND_SPLIT.md)
  // ---------------------------------------------------------------------------

  /**
   * The clip currently staged for splitting, plus its schedule entry so the dialog can
   * derive start/end bounds. Null when the dialog is closed.
   */
  readonly splitPrompt = signal<{
    clip: Clip;
    /** Schedule start of the clip on the timeline (seconds). */
    clipStart: number;
    /** Schedule end of the clip (= clipStart + clip.durationSeconds). */
    clipEnd: number;
  } | null>(null);

  /** Where the split will happen, in TIMELINE seconds (not clip-local time). */
  readonly splitPromptSeconds = signal<number>(0);

  /** Resulting duration of Part 1, derived live from splitPromptSeconds. */
  readonly splitPromptPart1Duration = computed<number>(() => {
    const p = this.splitPrompt();
    if (!p) return 0;
    return Math.max(0, this.splitPromptSeconds() - p.clipStart);
  });

  /** Resulting duration of Part 2, derived live from splitPromptSeconds. */
  readonly splitPromptPart2Duration = computed<number>(() => {
    const p = this.splitPrompt();
    if (!p) return 0;
    return Math.max(0, p.clipEnd - this.splitPromptSeconds());
  });

  /** True when the split point is too close to either end to produce two usable clips. */
  readonly splitPromptInvalid = computed<string | null>(() => {
    const MIN = 0.05;
    if (this.splitPromptPart1Duration() < MIN) return 'Split point is too close to the start of the clip.';
    if (this.splitPromptPart2Duration() < MIN) return 'Split point is too close to the end of the clip.';
    return null;
  });

  confirmSplitPrompt(): void {
    const p = this.splitPrompt();
    if (!p || this.splitPromptInvalid()) return;
    this.splitPrompt.set(null);
    this.performSplitAt(p.clip, this.splitPromptSeconds());
  }

  confirmSplitKeepPart(partToKeep: 1 | 2): void {
    const p = this.splitPrompt();
    if (!p || this.splitPromptInvalid()) return;
    this.splitPrompt.set(null);
    this.performSplitTrimAt(p.clip, this.splitPromptSeconds(), partToKeep);
  }

  cancelSplitPrompt(): void {
    this.splitPrompt.set(null);
  }

  /**
   * True when either two adjacent clips from the same asset are selected,
   * or a single clip with an adjacent part from the same asset is selected.
   */
  readonly canMergeClips = computed<boolean>(() => {
    const selectedIndices = this.selectedCutIndices();
    const sched = this.clipSchedule();
    if (selectedIndices.length === 2) {
      const [i1, i2] = [...selectedIndices].sort((a, b) => a - b);
      if (i2 === i1 + 1 && i1 >= 0 && i2 < sched.length) {
        const a = sched[i1].clip;
        const b = sched[i2].clip;
        return this.resolveAssetId(a) === this.resolveAssetId(b);
      }
    } else if (selectedIndices.length === 1 || this.selectedTimelineClipIndex() !== null) {
      const idx = selectedIndices.length === 1 ? selectedIndices[0] : this.selectedTimelineClipIndex()!;
      if (idx >= 0 && idx < sched.length) {
        const curr = sched[idx].clip;
        const currAsset = this.resolveAssetId(curr);
        const prev = idx > 0 ? sched[idx - 1].clip : null;
        const next = idx < sched.length - 1 ? sched[idx + 1].clip : null;
        return Boolean((prev && this.resolveAssetId(prev) === currAsset) || (next && this.resolveAssetId(next) === currAsset));
      }
    }
    return false;
  });

  mergeSelectedOrAdjacentClips(): void {
    const sched = this.clipSchedule();
    if (sched.length < 2) return;

    let leftIdx = -1;
    let rightIdx = -1;

    const selectedIndices = this.selectedCutIndices();
    if (selectedIndices.length === 2) {
      const [i1, i2] = [...selectedIndices].sort((a, b) => a - b);
      if (i2 === i1 + 1 && this.resolveAssetId(sched[i1].clip) === this.resolveAssetId(sched[i2].clip)) {
        leftIdx = i1;
        rightIdx = i2;
      }
    } else {
      const idx = selectedIndices.length === 1 ? selectedIndices[0] : (this.selectedTimelineClipIndex() ?? -1);
      if (idx >= 0 && idx < sched.length) {
        const currAsset = this.resolveAssetId(sched[idx].clip);
        if (idx < sched.length - 1 && this.resolveAssetId(sched[idx + 1].clip) === currAsset) {
          leftIdx = idx;
          rightIdx = idx + 1;
        } else if (idx > 0 && this.resolveAssetId(sched[idx - 1].clip) === currAsset) {
          leftIdx = idx - 1;
          rightIdx = idx;
        }
      }
    }

    if (leftIdx < 0 || rightIdx < 0) {
      this.status.notify(['Select two adjacent parts of the same clip to merge.']);
      return;
    }

    const leftClip = sched[leftIdx].clip;
    const rightClip = sched[rightIdx].clip;

    const origTrimStart = leftClip.trimStartSeconds ?? 0;
    const rightTrimEnd = rightClip.trimEndSeconds ?? ((rightClip.trimStartSeconds ?? 0) + (rightClip.durationSeconds ?? 5.0));
    const mergedDur = (leftClip.durationSeconds ?? 5.0) + (rightClip.durationSeconds ?? 5.0);
    const baseName = leftClip.name.replace(/ \(Part \d+\)$/, '');

    const mergedClip: Clip = {
      ...leftClip,
      name: baseName,
      durationSeconds: mergedDur,
      trimStartSeconds: origTrimStart,
      trimEndSeconds: rightTrimEnd,
    };

    const rows = [...this.rows()];
    const rowLeft = rows.findIndex((r) => r.clip.id === leftClip.id);
    const rowRight = rows.findIndex((r) => r.clip.id === rightClip.id);

    if (rowLeft >= 0 && rowRight >= 0) {
      const firstRowIdx = Math.min(rowLeft, rowRight);
      const secondRowIdx = Math.max(rowLeft, rowRight);
      rows.splice(secondRowIdx, 1);
      rows[firstRowIdx] = { clip: mergedClip, included: true };
      this.rows.set(rows);

      // Clean up junction override between them
      const overrides = new Map(this.junctionOverrides());
      overrides.delete(this.junctionKey(leftClip.id, rightClip.id));
      overrides.delete(this.junctionKey(rightClip.id, leftClip.id));
      this.junctionOverrides.set(overrides);

      this.selectedTimelineClipIndex.set(firstRowIdx);
      this.selectedClipId.set(mergedClip.id);
      this.markDirty();
      this.saveOrder();
      this.status.notify([`Merged "${mergedClip.name}" into a single continuous clip (${mergedDur.toFixed(2)}s).`]);
    }
  }

  nudgeSplitPrompt(delta: number): void {
    const p = this.splitPrompt();
    if (!p) return;
    const current = this.splitPromptSeconds();
    const clamped = Math.max(p.clipStart, Math.min(p.clipEnd, current + delta));
    this.splitPromptSeconds.set(Math.round(clamped * 1000) / 1000);
  }

  setSplitPromptSeconds(val: number): void {
    const p = this.splitPrompt();
    if (!p) return;
    const clamped = Math.max(p.clipStart, Math.min(p.clipEnd, val));
    this.splitPromptSeconds.set(Math.round(clamped * 1000) / 1000);
  }


  setInsertIndex(index: number | null): void {
    this.insertIndex.set(index);
  }

  /** Puts the caret on one side of a clip - what clicking a cut seam does. */
  moveInsertCaretToClip(clipId: string, side: 'before' | 'after' = 'after'): void {
    const at = this.included().findIndex((r) => r.clip.id === clipId);
    if (at < 0) return;
    this.insertIndex.set(side === 'before' ? at : at + 1);
  }

  /** Puts the caret at the cut nearest the playhead. */
  moveInsertCaretToPlayhead(): void {
    const time = this.currentTime();
    const schedule = this.clipSchedule();
    for (let i = 0; i < schedule.length; i++) {
      if (time < schedule[i].endSeconds) {
        // Snap to whichever end of this clip the playhead is closer to.
        const entry = schedule[i];
        const mid = (entry.startSeconds + entry.endSeconds) / 2;
        this.insertIndex.set(time < mid ? i : i + 1);
        return;
      }
    }
    this.insertIndex.set(schedule.length);
  }

  /**
   * Where a cut position sits in the backing `rows` array, which also holds the clips that
   * are NOT in the cut. Returns rows.length for a caret past the last included clip.
   */
  private rowsIndexForCutIndex(cutIndex: number): number {
    const marked = this.includedWithIndex();
    if (cutIndex >= marked.length) return this.rows().length;
    return marked[Math.max(0, cutIndex)].index;
  }

  /** Splices rows in at the caret and leaves the caret after what was just inserted. */
  private insertRowsAtCaret(newRows: ClipRow[]): void {
    if (newRows.length === 0) return;
    const at = this.effectiveInsertIndex();
    const rows = [...this.rows()];
    rows.splice(this.rowsIndexForCutIndex(at), 0, ...newRows);
    this.rows.set(rows);
    // Typing behaviour: the caret follows what you just added, so a second paste lands
    // after the first rather than on top of it.
    this.insertIndex.set(at + newRows.length);
    this.markDirty();
  }

  // ────────────────────────────────────────────────────────────────
  // KEYBOARD SELECTION OVER THE CUT
  // ────────────────────────────────────────────────────────────────

  /** Where a Shift-extended selection started, so it can grow and shrink from one end. */
  readonly selectionAnchorIndex = signal<number | null>(null);

  /** Cut positions currently selected, derived from the id-based selection. */
  readonly selectedCutIndices = computed<number[]>(() => {
    const selected = this.selectedLibraryIds();
    const out: number[] = [];
    this.included().forEach((row, i) => {
      if (selected.has(row.clip.id)) out.push(i);
    });
    return out;
  });

  private applyCutSelection(indices: number[]): void {
    const cut = this.included();
    const ids = new Set(indices.map((i) => cut[i]?.clip.id).filter((id): id is string => Boolean(id)));
    this.selectedLibraryIds.set(ids);
    this.selectedMusicTrackKey.set(null);
    if (indices.length > 0) {
      const first = cut[indices[0]];
      if (first) this.selectedClipId.set(first.clip.id);
    }
    this.markDirty();
  }

  /**
   * Shift+Arrow. Grows the selection away from the anchor, or shrinks it back toward the
   * anchor when reversing - the behaviour of a text selection rather than a plain "add one
   * more", so overshooting is undone by pressing the other arrow.
   */
  extendClipSelection(direction: 1 | -1): void {
    const cut = this.included();
    if (cut.length === 0) return;

    const current = this.selectedCutIndices();
    if (current.length === 0) {
      const start = direction === 1 ? 0 : cut.length - 1;
      this.selectionAnchorIndex.set(start);
      this.applyCutSelection([start]);
      this.scrollCutIndexIntoView(start);
      return;
    }

    let anchor = this.selectionAnchorIndex();
    if (anchor === null || !current.includes(anchor)) {
      anchor = direction === 1 ? current[0] : current[current.length - 1];
      this.selectionAnchorIndex.set(anchor);
    }

    const head = direction === 1 ? current[current.length - 1] : current[0];
    const next = Math.max(0, Math.min(cut.length - 1, head + direction));
    if (next === head) return;

    const lo = Math.min(anchor, next);
    const hi = Math.max(anchor, next);
    const range: number[] = [];
    for (let i = lo; i <= hi; i++) range.push(i);

    this.applyCutSelection(range);
    this.scrollCutIndexIntoView(next);
  }

  /** Shift+Click: everything between the anchor and this clip. */
  selectClipRangeTo(clipId: string): void {
    const cut = this.included();
    const to = cut.findIndex((r) => r.clip.id === clipId);
    if (to < 0) return;

    const anchor = this.selectionAnchorIndex() ?? this.selectedCutIndices()[0] ?? to;
    const lo = Math.min(anchor, to);
    const hi = Math.max(anchor, to);
    const range: number[] = [];
    for (let i = lo; i <= hi; i++) range.push(i);

    this.selectionAnchorIndex.set(anchor);
    this.applyCutSelection(range);
  }

  /** Ctrl/Cmd+Click: add or remove one clip without disturbing the rest. */
  toggleClipInSelection(clipId: string): void {
    const at = this.included().findIndex((r) => r.clip.id === clipId);
    if (at < 0) return;

    const current = new Set(this.selectedCutIndices());
    if (current.has(at)) current.delete(at);
    else current.add(at);

    this.selectionAnchorIndex.set(at);
    this.applyCutSelection([...current].sort((a, b) => a - b));
  }

  /** Keeps the newly selected clip on screen when the selection is driven from the keyboard. */
  private scrollCutIndexIntoView(cutIndex: number): void {
    const entry = this.clipSchedule()[cutIndex];
    if (entry) this.timelineScrollRequest.set({ seconds: entry.startSeconds, nonce: Date.now() });
  }

  /** Consumed by the timeline dock to bring a time into view. */
  readonly timelineScrollRequest = signal<{ seconds: number; nonce: number } | null>(null);

  // ────────────────────────────────────────────────────────────────
  // COPY / CUT / PASTE AND REORDERING
  // ────────────────────────────────────────────────────────────────

  /**
   * Copied clips. These are asset references, not deep copies - a pasted clip is the same
   * footage appearing twice, which is what `duplicateClip` has always produced.
   */
  readonly clipboard = signal<{ clips: Clip[]; wasCut: boolean } | null>(null);

  readonly clipboardCount = computed<number>(() => this.clipboard()?.clips.length ?? 0);

  copySelectedClips(): void {
    const indices = this.selectedCutIndices();
    if (indices.length === 0) {
      this.status.notify(['Select one or more clips on the timeline first.']);
      return;
    }
    const cut = this.included();
    this.clipboard.set({ clips: indices.map((i) => cut[i].clip), wasCut: false });
    this.status.notify([`Copied ${indices.length} clip(s). Ctrl+V pastes ${this.insertPointLabel()}.`]);
  }

  cutSelectedClips(): void {
    const indices = this.selectedCutIndices();
    if (indices.length === 0) {
      this.status.notify(['Select one or more clips on the timeline first.']);
      return;
    }
    const cut = this.included();
    const clips = indices.map((i) => cut[i].clip);
    const removing = new Set(indices);

    // The caret follows the hole the clips left, so Ctrl+X then Ctrl+V somewhere else reads
    // as a move rather than a delete followed by a guess.
    const caretTarget = indices[0];

    const keep: ClipRow[] = [];
    let cutPos = 0;
    for (const row of this.rows()) {
      if (row.included) {
        const isRemoved = removing.has(cutPos);
        cutPos++;
        if (isRemoved) continue;
      }
      keep.push(row);
    }

    this.rows.set(keep);
    this.clipboard.set({ clips, wasCut: true });
    this.selectedLibraryIds.set(new Set());
    this.selectionAnchorIndex.set(null);
    this.insertIndex.set(caretTarget);
    this.markDirty();
    this.status.notify([`Cut ${clips.length} clip(s). Move the caret and press Ctrl+V.`]);
  }

  pasteClips(): void {
    const board = this.clipboard();
    if (!board || board.clips.length === 0) {
      this.status.notify(['Nothing to paste.']);
      return;
    }
    if (this.askWhereToInsert('paste', [], board.clips.length)) return;
    this.performPaste();
  }

  private performPaste(): void {
    const board = this.clipboard();
    if (!board || board.clips.length === 0) return;

    const where = this.insertPointLabel();
    this.insertRowsAtCaret(board.clips.map((clip) => ({ clip, included: true })));

    // A cut is consumed by its paste; a copy stays on the clipboard to be pasted again.
    if (board.wasCut) this.clipboard.set(null);

    this.saveOrder();
    this.status.notify([`Pasted ${board.clips.length} clip(s) ${where}.`]);
  }

  /**
   * Alt+Arrow. Moves the selected clips one slot through the cut, as one block, so a
   * multi-selection keeps its internal order and stays contiguous.
   */
  moveSelectedClips(direction: 1 | -1): void {
    const indices = this.selectedCutIndices();
    if (indices.length === 0) {
      this.status.notify(['Select a clip on the timeline first.']);
      return;
    }

    const cut = this.included();
    if (direction === -1 && indices[0] === 0) return;
    if (direction === 1 && indices[indices.length - 1] === cut.length - 1) return;

    const moving = new Set(indices);
    const order: ClipRow[] = [];
    const block: ClipRow[] = [];
    cut.forEach((row, i) => {
      if (moving.has(i)) block.push(row);
      else order.push(row);
    });

    // Where the block lands among the clips that did not move. Every clip before the
    // block's first index stayed put, so that index IS the count of them.
    const target = Math.max(0, Math.min(order.length, indices[0] + direction));
    order.splice(target, 0, ...block);

    this.replaceCutOrder(order);
    this.applyCutSelection(
      block.map((_, offset) => target + offset)
    );
    this.selectionAnchorIndex.set(target);
    this.saveOrder();
  }

  /**
   * Writes a new cut order back into `rows`, leaving the clips that are not in the cut
   * where they are so the media library does not reshuffle under the user.
   */
  private replaceCutOrder(newCut: ClipRow[]): void {
    const rows = this.rows();
    const next: ClipRow[] = [];
    let take = 0;
    for (const row of rows) {
      if (row.included) {
        next.push(newCut[take]);
        take++;
      } else {
        next.push(row);
      }
    }
    this.rows.set(next);
    this.markDirty();
  }

  /** Drag a V1 clip to a new slot: `to` is a CUT position, not a rows index. */
  moveClipToCutIndex(clipId: string, to: number): void {
    const cut = this.included();
    const from = cut.findIndex((r) => r.clip.id === clipId);
    if (from < 0) return;

    const order = [...cut];
    const [moved] = order.splice(from, 1);
    // Removing the clip shifts everything after it down by one.
    const target = Math.max(0, Math.min(order.length, from < to ? to - 1 : to));
    order.splice(target, 0, moved);

    this.replaceCutOrder(order);
    this.selectionAnchorIndex.set(target);
    this.applyCutSelection([target]);
    this.saveOrder();
    this.status.notify([`Moved "${moved.clip.name}" to position ${target + 1}.`]);
  }

  nudgeMusicTrack(key: string, deltaSeconds: number): void {
    this.musicTracks.update((tracks) =>
      tracks.map((t) => {
        if (t.key !== key) return t;
        const newStart = Math.max(0, Math.round((t.startSeconds + deltaSeconds) * 100) / 100);
        return { ...t, startSeconds: newStart };
      })
    );
    this.markDirty();
  }

  nudgeSelectedMusicTrack(deltaSeconds: number): void {
    const key = this.selectedMusicTrackKey();
    if (!key) return;
    this.nudgeMusicTrack(key, deltaSeconds);
  }

  nudgeSelectedTimelineItem(deltaSeconds: number): void {
    const id = this.selectedTimelineItemId();
    if (!id) return;
    this.timelineItems.update((items) =>
      items.map((it) => {
        if (it.id !== id) return it;
        const newStart = Math.max(0, Math.round((it.startTime + deltaSeconds) * 100) / 100);
        return { ...it, startTime: newStart };
      })
    );
    this.markDirty();
  }

  shiftAllTracks(trackId: string, deltaSeconds: number): void {
    if (trackId === 'A1') {
      this.musicTracks.update((tracks) =>
        tracks.map((t) => ({
          ...t,
          startSeconds: Math.max(0, Math.round((t.startSeconds + deltaSeconds) * 100) / 100),
        }))
      );
      this.timelineItems.update((items) =>
        items.map((it) =>
          it.trackId === 'A1'
            ? { ...it, startTime: Math.max(0, Math.round((it.startTime + deltaSeconds) * 100) / 100) }
            : it
        )
      );
      this.markDirty();
    }
  }

  readonly canNudgeSelected = computed<boolean>(() => {
    return Boolean(
      this.selectedCutIndices().length > 0 ||
      this.selectedMusicTrackKey() ||
      this.selectedTimelineItemId()
    );
  });

  nudgeAnySelected(direction: -1 | 1, stepSeconds: number = 0.5): void {
    const delta = direction * stepSeconds;
    if (this.selectedMusicTrackKey()) {
      this.nudgeSelectedMusicTrack(delta);
    } else if (this.selectedTimelineItemId()) {
      this.nudgeSelectedTimelineItem(delta);
    } else if (this.selectedCutIndices().length > 0) {
      this.moveSelectedClips(direction);
    }
  }

  junctionKey(leftId: string, rightId: string): string {
    return `${leftId}:${rightId}`;
  }

  isJunctionCustom(key: string): boolean {
    return this.junctionOverrides().has(key);
  }

  readonly clipSchedule = computed<ScheduledClip[]>(() => {
    const allRows = this.rows();
    const rows = this.included();
    const junctionsMap = this.junctionOverrides();
    const defaultTrans = this.transition();
    const defaultSecs = this.transitionSeconds();

    let curStart = 0;
    const schedule: ScheduledClip[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const clip = row.clip;
      const dur = clip.durationSeconds ?? 5.0;
      const rowIndex = allRows.indexOf(row);

      // Junction AFTER this clip (to the next one).
      let jTrans = 'None';
      let jSecs = 0;

      if (i < rows.length - 1) {
        const nextClip = rows[i + 1].clip;
        const key = this.junctionKey(clip.id, nextClip.id);
        const custom = junctionsMap.get(key);
        const isSplitAdjacent = this.resolveAssetId(clip) === this.resolveAssetId(nextClip);
        const defaultTransToUse = isSplitAdjacent ? 'None' : defaultTrans;
        const defaultSecsToUse = isSplitAdjacent ? 0 : defaultSecs;
        jTrans = custom ? custom.transition : defaultTransToUse;
        jSecs = custom ? custom.seconds : defaultSecsToUse;
        if (jTrans === 'None') jSecs = 0;
      }

      // Junction INTO this clip (from the previous one) — used for leadInSeconds.
      let prevJSecs = 0;
      if (i > 0) {
        const prevClip = rows[i - 1].clip;
        const key = this.junctionKey(prevClip.id, clip.id);
        const custom = junctionsMap.get(key);
        const isSplitAdjacent = this.resolveAssetId(prevClip) === this.resolveAssetId(clip);
        const defaultTransToUse = isSplitAdjacent ? 'None' : defaultTrans;
        const defaultSecsToUse = isSplitAdjacent ? 0 : defaultSecs;
        let prevJTrans = custom ? custom.transition : defaultTransToUse;
        prevJSecs = custom ? custom.seconds : defaultSecsToUse;
        if (prevJTrans === 'None') prevJSecs = 0;
      }

      // Half the transition length is borrowed from each neighbouring clip.
      // The frontend never knows the raw file duration, so we cannot verify spare media;
      // the backend will use freeze-frame padding for the full borrow on both sides.
      const leadIn = prevJSecs / 2;
      const tailOut = jSecs / 2;

      schedule.push({
        clip,
        row,
        rowIndex: rowIndex >= 0 ? rowIndex : i,
        index: i,
        startSeconds: curStart,
        endSeconds: curStart + dur,
        durationSeconds: dur,
        junctionTransition: jTrans,
        junctionSeconds: jSecs,
        leadInSeconds: leadIn,
        tailOutSeconds: tailOut,
        // Frontend cannot verify spare media — always signal freeze so the backend applies
        // tpad rather than trying to read footage that may not exist beyond the trim points.
        freezeHead: leadIn > 0,
        freezeTail: tailOut > 0,
      });

      // Full clip duration advances the cursor — no subtraction for transitions.
      // The borrowed/frozen frames are presentation detail; the layout shows what the user
      // chose to keep. Total render length stays sum(durations) because the conform pass
      // adds leadIn+tailOut frames per clip and xfade consumes exactly that many.
      curStart += dur;
    }

    return schedule;
  });


  readonly totalSeconds = computed(() => {
    const sched = this.clipSchedule();
    if (sched.length === 0) return 0;
    const last = sched[sched.length - 1];
    return last.endSeconds;
  });

  readonly contentDurationSeconds = computed(() => {
    let maxSec = this.totalSeconds();
    for (const item of this.timelineItems()) {
      const end = item.startTime + item.duration;
      if (end > maxSec) maxSec = end;
    }
    for (const track of this.musicTracks()) {
      const dur = track.trimEndSeconds ? track.trimEndSeconds - (track.trimStartSeconds ?? 0) : 10;
      const end = track.startSeconds + dur;
      if (end > maxSec) maxSec = end;
    }
    return maxSec;
  });

  readonly timelineSeconds = computed(() => {
    // Room for the end-card marker drawn after the cut, so the end of the video is visible.
    return Math.max(this.contentDurationSeconds() + this.endCardTailSeconds(), 10);
  });

  readonly rulerTicks = computed<number[]>(() => {
    const total = this.timelineSeconds();
    if (total <= 0) return [0];
    const px = this.pxPerSecond();
    let step = 1;
    if (px < 15) step = 10;
    else if (px < 30) step = 5;
    else if (px < 60) step = 2;
    else step = 1;

    const ticks: number[] = [];
    for (let t = 0; t <= total; t += step) ticks.push(t);
    return ticks;
  });

  readonly currentScheduledClip = computed<ScheduledClip | null>(() => {
    const t = this.currentTime();
    const sched = this.clipSchedule();
    for (let i = 0; i < sched.length; i++) {
      const item = sched[i];
      if (t >= item.startSeconds && t < item.endSeconds) {
        return item;
      }
    }
    return sched.length > 0 ? sched[sched.length - 1] : null;
  });

  readonly nextScheduledClip = computed<ScheduledClip | null>(() => {
    const cur = this.currentScheduledClip();
    if (!cur) return null;
    const sched = this.clipSchedule();
    const nextIdx = cur.index + 1;
    return nextIdx < sched.length ? sched[nextIdx] : null;
  });

  readonly clipsUnderMusic = computed<Clip[]>(() => {
    const sched = this.clipSchedule();
    const tracks = this.musicTracks();
    const hasBg = this.musicAssetId() !== '';
    if (hasBg) return this.included().map((r) => r.clip);
    if (tracks.length === 0) return [];
    return sched
      .filter((s) =>
        tracks.some((t) => {
          const dur = this.musicTrackDurationSeconds(t);
          const tEnd = t.startSeconds + dur;
          return t.startSeconds < s.endSeconds && tEnd > s.startSeconds;
        })
      )
      .map((s) => s.clip);
  });

  readonly clipsUnderSelectedMusic = computed<Clip[]>(() => {
    const selTrack = this.selectedMusicTrack();
    if (!selTrack) return this.clipsUnderMusic();
    const sched = this.clipSchedule();
    const dur = this.musicTrackDurationSeconds(selTrack);
    const tStart = selTrack.startSeconds;
    const tEnd = tStart + dur;
    return sched
      .filter((s) => tStart < s.endSeconds && tEnd > s.startSeconds)
      .map((s) => s.clip);
  });

  readonly hasMusicOnTimeline = computed<boolean>(() => {
    return this.musicAssetId() !== '' || this.musicTracks().length > 0;
  });

  readonly activeMusicTrackName = computed<string>(() => {
    const sel = this.selectedMusicTrack();
    if (sel) {
      return this.musicTrackName(sel);
    }
    const tracks = this.musicTracks();
    if (tracks.length > 0) {
      return this.musicTrackName(tracks[0]);
    }
    if (this.musicAssetId()) {
      const cand = this.studio()?.musicCandidates.find((c) => c.id === this.musicAssetId());
      return cand?.name || 'Background Music';
    }
    return '';
  });

  readonly isMultiSelection = computed(() => {
    if (this.selectedMusicTrackKey()) return false;
    if (this.selectedTimelineItemIds().size > 1) return true;
    if (this.selectedLibraryIds().size > 1) return true;
    if (this.targetScope() === 'all' && this.included().length > 1) return true;
    if (this.targetScope() === 'under_music' && this.clipsUnderMusic().length > 1) return true;
    if (this.targetScope() === 'under_selected_music' && this.clipsUnderSelectedMusic().length > 1) return true;
    if (this.targetScope() === 'selected' && (this.selectedCount() > 1 || this.selectedTimelineItemIds().size > 1)) return true;
    return false;
  });

  readonly multiSelectionCount = computed(() => {
    if (this.selectedMusicTrackKey()) return 1;
    if (this.selectedTimelineItemIds().size > 1) return this.selectedTimelineItemIds().size;
    if (this.selectedLibraryIds().size > 1) return this.selectedLibraryIds().size;
    if (this.targetScope() === 'all') return this.included().length;
    if (this.targetScope() === 'under_music') return this.clipsUnderMusic().length;
    if (this.targetScope() === 'under_selected_music') return this.clipsUnderSelectedMusic().length;
    if (this.targetScope() === 'selected') return Math.max(this.selectedCount(), this.selectedTimelineItemIds().size);
    return 1;
  });

  readonly selectedClipsCount = computed(() => {
    if (this.targetScope() === 'under_music') return this.clipsUnderMusic().length;
    if (this.targetScope() === 'under_selected_music') return this.clipsUnderSelectedMusic().length;
    if (this.targetScope() === 'all') return this.included().length;
    if (this.targetScope() === 'current') return this.currentScheduledClip() ? 1 : 0;
    const libCount = this.selectedLibraryIds().size;
    if (libCount > 0) return libCount;
    const tlCount = this.selectedTimelineItemIds().size;
    if (tlCount > 0) return tlCount;
    if (this.selectedClipId() || this.selectedTimelineItemId()) return 1;
    return 0;
  });

  readonly selectedClip = computed<Clip | null>(() => {
    const id = this.selectedClipId();
    if (!id) return null;
    const row = this.allMediaRows().find((r) => r.clip.id === id);
    return row ? row.clip : null;
  });

  readonly selectedClipIndexInCut = computed<number>(() => {
    const sel = this.selectedClip();
    if (!sel) return -1;
    return this.included().findIndex((r) => r.clip.id === sel.id);
  });

  getIncludedClipIndex(clipId: string): number {
    return this.included().findIndex((r) => r.clip.id === clipId);
  }

  readonly activeClipIsImage = computed(() => {
    const sched = this.currentScheduledClip();
    if (!sched) return false;
    return this.getClipType(sched.clip) === 'image';
  });

  readonly activeClipImageUrl = computed(() => {
    const sched = this.currentScheduledClip();
    if (!sched) return null;
    if (this.getClipType(sched.clip) !== 'image') return null;
    return this.assetUrl(sched.clip.id);
  });

  readonly activeV2Item = computed<TimelineItem | null>(() => {
    const t = this.currentTime();
    const track = this.timelineTracks().find((tr) => tr.id === 'V2');
    if (track && !track.visible) return null;
    return this.timelineItems().find((item) => item.trackId === 'V2' && t >= item.startTime && t < (item.startTime + item.duration)) ?? null;
  });

  readonly activeImgItem = computed<TimelineItem | null>(() => {
    const t = this.currentTime();
    const track = this.timelineTracks().find((tr) => tr.id === 'IMG1' || tr.id === 'IMG' || tr.id === 'V3');
    if (track && !track.visible) return null;
    return this.timelineItems().find((item) => (item.trackId === 'IMG1' || item.trackId === 'IMG' || item.trackId === 'V3') && t >= item.startTime && t < (item.startTime + item.duration)) ?? null;
  });

  readonly activeV3Item = this.activeImgItem;

  readonly activeTxtItem = computed<TimelineItem | null>(() => {
    const t = this.currentTime();
    const track = this.timelineTracks().find((tr) => tr.id === 'TXT1');
    if (track && !track.visible) return null;
    return this.timelineItems().find((item) => item.trackId === 'TXT1' && t >= item.startTime && t < (item.startTime + item.duration)) ?? null;
  });

  readonly activeMonitorLowerThird = computed<{ enabled: boolean; title: string; subtitle: string } | null>(() => {
    let text: ClipTextSetting;
    if (this.isPlaying()) {
      const sched = this.currentScheduledClip();
      text = sched ? this.clipTextSetting(sched.clip.id) : this.activeScopeTextSetting();
    } else {
      text = this.activeScopeTextSetting();
    }
    if (text.enabled && text.title.trim().length > 0) {
      return text;
    }
    return null;
  });

  getOverlayEffectiveOpacity(img: TimelineItem): number {
    const t = img.transform;
    const baseOpacity = t?.opacity ?? 1.0;
    const inType = t?.transitionIn ?? 'fade';
    const inDur = t?.transitionInDuration ?? 0.5;
    const outType = t?.transitionOut ?? 'fade';
    const outDur = t?.transitionOutDuration ?? 0.5;

    const ct = this.currentTime();
    const elapsed = ct - img.startTime;
    const remaining = (img.startTime + img.duration) - ct;

    if (inType !== 'none' && elapsed >= 0 && elapsed < inDur && inDur > 0) {
      const p = Math.min(1, Math.max(0, elapsed / inDur));
      const ease = 1 - Math.pow(1 - p, 3);
      return baseOpacity * ease;
    }
    if (outType !== 'none' && remaining >= 0 && remaining < outDur && outDur > 0) {
      const p = Math.min(1, Math.max(0, remaining / outDur));
      const ease = Math.pow(p, 2);
      return baseOpacity * ease;
    }
    return baseOpacity;
  }

  getOverlayTransform(imgOrTransform: TimelineItem | TimelineItemTransform | undefined): string {
    if (!imgOrTransform) return 'none';
    let imgItem: TimelineItem | null = null;
    let t: TimelineItemTransform;
    if ('type' in imgOrTransform && 'trackId' in imgOrTransform) {
      imgItem = imgOrTransform as TimelineItem;
      t = imgItem.transform ?? { scale: 1, x: 0, y: 0, opacity: 1 };
    } else {
      t = imgOrTransform as TimelineItemTransform;
    }

    const baseX = t.x ?? 0;
    const baseY = t.y ?? 0;
    const baseScale = t.scale ?? 1;
    const rot = (t as { rotation?: number }).rotation ?? 0;

    let extraX = 0;
    let extraY = 0;
    let extraScale = 1.0;

    if (imgItem) {
      const inType = t.transitionIn ?? 'fade';
      const inDur = t.transitionInDuration ?? 0.5;
      const outType = t.transitionOut ?? 'fade';
      const outDur = t.transitionOutDuration ?? 0.5;

      const ct = this.currentTime();
      const elapsed = ct - imgItem.startTime;
      const remaining = (imgItem.startTime + imgItem.duration) - ct;

      if (inType !== 'none' && elapsed >= 0 && elapsed < inDur && inDur > 0) {
        const p = Math.min(1, Math.max(0, elapsed / inDur));
        const ease = 1 - Math.pow(1 - p, 3);
        if (inType === 'slide-left') {
          extraX = -100 * (1 - ease);
        } else if (inType === 'slide-right') {
          extraX = 100 * (1 - ease);
        } else if (inType === 'slide-up') {
          extraY = 100 * (1 - ease);
        } else if (inType === 'slide-down') {
          extraY = -100 * (1 - ease);
        } else if (inType === 'zoom-in') {
          extraScale = 0.2 + 0.8 * ease;
        }
      } else if (outType !== 'none' && remaining >= 0 && remaining < outDur && outDur > 0) {
        const p = Math.min(1, Math.max(0, remaining / outDur));
        const ease = Math.pow(p, 2);
        if (outType === 'slide-left') {
          extraX = -100 * (1 - ease);
        } else if (outType === 'slide-right') {
          extraX = 100 * (1 - ease);
        } else if (outType === 'slide-down') {
          extraY = 100 * (1 - ease);
        } else if (outType === 'slide-up') {
          extraY = -100 * (1 - ease);
        } else if (outType === 'zoom-out') {
          extraScale = 0.2 + 0.8 * ease;
        } else if (outType === 'zoom-in') {
          extraScale = 1.0 + 0.8 * (1 - ease);
        }
      }
    }

    return `translate(${baseX + extraX}px, ${baseY + extraY}px) scale(${baseScale * extraScale}) rotate(${rot}deg)`;
  }

  getTextOverlayEffectiveOpacity(txt: TimelineItem): number {
    const st = txt.textStyle;
    const inType = st?.transitionIn ?? 'fade';
    const inDur = st?.transitionInDuration ?? 0.5;
    const outType = st?.transitionOut ?? 'fade';
    const outDur = st?.transitionOutDuration ?? 0.5;

    const ct = this.currentTime();
    const elapsed = ct - txt.startTime;
    const remaining = (txt.startTime + txt.duration) - ct;

    if (inType !== 'none' && elapsed >= 0 && elapsed < inDur && inDur > 0) {
      const p = Math.min(1, Math.max(0, elapsed / inDur));
      return 1 - Math.pow(1 - p, 3);
    }
    if (outType !== 'none' && remaining >= 0 && remaining < outDur && outDur > 0) {
      const p = Math.min(1, Math.max(0, remaining / outDur));
      return Math.pow(p, 2);
    }
    return 1.0;
  }

  getTextOverlayTransform(txt: TimelineItem): string {
    const st = txt.textStyle;
    const isCenter = st?.position === 'center';
    const inType = st?.transitionIn ?? 'fade';
    const inDur = st?.transitionInDuration ?? 0.5;
    const outType = st?.transitionOut ?? 'fade';
    const outDur = st?.transitionOutDuration ?? 0.5;

    let extraY = 0;
    let extraScale = 1.0;

    const ct = this.currentTime();
    const elapsed = ct - txt.startTime;
    const remaining = (txt.startTime + txt.duration) - ct;

    if (inType !== 'none' && elapsed >= 0 && elapsed < inDur && inDur > 0) {
      const p = Math.min(1, Math.max(0, elapsed / inDur));
      const ease = 1 - Math.pow(1 - p, 3);
      if (inType === 'slide-up') {
        extraY = 40 * (1 - ease);
      } else if (inType === 'slide-down') {
        extraY = -40 * (1 - ease);
      } else if (inType === 'zoom-in') {
        extraScale = 0.5 + 0.5 * ease;
      }
    } else if (outType !== 'none' && remaining >= 0 && remaining < outDur && outDur > 0) {
      const p = Math.min(1, Math.max(0, remaining / outDur));
      const ease = Math.pow(p, 2);
      if (outType === 'slide-up') {
        extraY = -40 * (1 - ease);
      } else if (outType === 'slide-down') {
        extraY = 40 * (1 - ease);
      } else if (outType === 'zoom-out') {
        extraScale = 0.5 + 0.5 * ease;
      } else if (outType === 'zoom-in') {
        extraScale = 1.0 + 0.4 * (1 - ease);
      }
    }

    const baseCenterTranslate = isCenter ? 'translateY(-50%) ' : '';
    const animTranslate = extraY !== 0 ? `translateY(${extraY}px) ` : '';
    const animScale = extraScale !== 1 ? `scale(${extraScale})` : '';

    const combined = `${baseCenterTranslate}${animTranslate}${animScale}`.trim();
    return combined || 'none';
  }

  readonly activeTargetClip = computed<Clip | null>(() => {
    const direct = this.selectedClip();
    const scope = this.targetScope();
    if (scope === 'selected') {
      if (direct) return direct;
      const libIds = Array.from(this.selectedLibraryIds());
      if (libIds.length > 0) {
        const row = this.allMediaRows().find((r) => r.clip.id === libIds[0]);
        if (row) return row.clip;
      }
      return null;
    }
    if (scope === 'current') {
      const current = this.currentScheduledClip();
      if (current) return current.clip;
      return direct;
    }
    if (scope === 'all') {
      return direct || this.included()[0]?.clip || null;
    }
    if (scope === 'under_music' || scope === 'under_selected_music') {
      const clips = scope === 'under_selected_music' ? this.clipsUnderSelectedMusic() : this.clipsUnderMusic();
      if (direct && clips.some((c) => c.id === direct.id)) return direct;
      return clips[0] ?? null;
    }
    // 0. Selected image overlay timeline item
    const selItem = this.selectedTimelineItem();
    if (selItem && (selItem.type === 'image' || selItem.trackId === 'IMG1' || selItem.trackId === 'IMG')) {
      return {
        id: selItem.src || selItem.id,
        name: selItem.name || 'Image Overlay',
        durationSeconds: selItem.duration,
        fileSizeBytes: 0,
        hasAudio: false,
      };
    }
    // Fallbacks
    if (direct) return direct;
    const libIds = Array.from(this.selectedLibraryIds());
    if (libIds.length > 0) {
      const row = this.allMediaRows().find((r) => r.clip.id === libIds[0]);
      if (row) return row.clip;
    }
    return null;
  });

  readonly selectedTimelineItem = computed<TimelineItem | null>(() => {
    const id = this.selectedTimelineItemId();
    if (!id) return null;
    return this.timelineItems().find((it) => it.id === id) ?? null;
  });

  readonly activeTargetAudioItem = computed<{
    name: string;
    duration: number;
    trackId: string;
    clipId: string;
    isTimelineItem: boolean;
    volume: number;
    overlapRule: AudioOverlapRuleOrInherit;
    duckLevelOverride: number | null;
    fadeInSeconds: number;
    fadeOutSeconds: number;
  } | null>(() => {
    const tlItem = this.selectedTimelineItem();
    if (tlItem) {
      return {
        name: tlItem.name ?? (tlItem.trackId + ' Item'),
        duration: tlItem.duration,
        trackId: tlItem.trackId,
        clipId: tlItem.id,
        isTimelineItem: true,
        volume: tlItem.volume ?? 1.0,
        overlapRule: this.clipOverlapRule(tlItem.id),
        duckLevelOverride: this.clipDuckLevelOverride(tlItem.id),
        fadeInSeconds: 0,
        fadeOutSeconds: 0,
      };
    }
    const clip = this.activeTargetClip();
    if (clip) {
      const sound = this.clipSound(clip.id);
      const fade = this.clipAudioFadeSetting(clip.id);
      return {
        name: clip.name,
        duration: clip.durationSeconds ?? 5.0,
        trackId: 'V1',
        clipId: clip.id,
        isTimelineItem: false,
        volume: sound.volume,
        overlapRule: sound.overlapRule ?? 'Inherit',
        duckLevelOverride: sound.duckLevelOverride ?? null,
        fadeInSeconds: fade.fadeInSeconds,
        fadeOutSeconds: fade.fadeOutSeconds,
      };
    }
    return null;
  });

  readonly hasSelectedOnTimeline = computed(() => {
    const sel = this.selectedLibraryIds();
    if (sel.size === 0) return false;
    for (const id of sel) {
      if (this.isClipOnTimeline(id)) return true;
    }
    return false;
  });

  readonly hasSelectedNotOnTimeline = computed(() => {
    const sel = this.selectedLibraryIds();
    if (sel.size === 0) return false;
    for (const id of sel) {
      if (!this.isClipOnTimeline(id)) return true;
    }
    return false;
  });

  readonly hasAnySelection = computed(() => {
    return (
      this.selectedTimelineItemIds().size > 0 ||
      Boolean(this.selectedTimelineItemId()) ||
      this.selectedLibraryIds().size > 0 ||
      Boolean(this.selectedClipId())
    );
  });

  readonly explicitlyShownTracks = signal<Set<string>>(new Set<string>());

  readonly showTxtTrack = computed(() => {
    if (this.itemsForTrack('TXT1').length > 0) return true;
    if (this.explicitlyShownTracks().has('TXT1')) return true;
    if (this.activeInspectorTab() === 'text') return true;
    return false;
  });

  readonly showImgTrack = computed(() => {
    if (this.itemsForTrack('IMG1').length > 0) return true;
    if (this.explicitlyShownTracks().has('IMG1')) return true;
    if (this.activeInspectorTab() === 'clip') {
      const sel = this.selectedClip();
      if (sel && this.getClipType(sel) === 'image') return true;
      const selTl = this.selectedTimelineItem();
      if (selTl && selTl.type === 'image') return true;
    }
    if (this.activeCategory() === 'image') return true;
    const sel = this.selectedClip();
    if (sel && this.getClipType(sel) === 'image') return true;
    return false;
  });

  readonly showA1Track = computed(() => {
    if (this.musicTracks().length > 0) return true;
    if (this.itemsForTrack('A1').length > 0) return true;
    if (this.explicitlyShownTracks().has('A1')) return true;
    if (this.activeInspectorTab() === 'audio') return true;
    if (this.activeCategory() === 'audio') return true;
    const sel = this.selectedClip();
    if (sel && this.getClipType(sel) === 'audio') return true;
    return false;
  });

  readonly showV2Track = computed(() => {
    if (this.itemsForTrack('V2').length > 0) return true;
    if (this.explicitlyShownTracks().has('V2')) return true;
    return false;
  });

  showTrackManually(trackId: string): void {
    this.explicitlyShownTracks.update((set) => {
      const next = new Set(set);
      next.add(trackId);
      return next;
    });
    this.status.notify([`Added ${trackId} track to timeline.`]);
  }

  hideTrack(trackId: string): void {
    this.explicitlyShownTracks.update((set) => {
      const next = new Set(set);
      next.delete(trackId);
      return next;
    });
    if (trackId === 'TXT1' && this.activeInspectorTab() === 'text') {
      this.activeInspectorTab.set('clip');
    }
    if (trackId === 'A1' && this.activeInspectorTab() === 'audio') {
      this.activeInspectorTab.set('clip');
    }
    this.status.notify([`Collapsed empty ${trackId} track.`]);
  }

  itemImageUrl(item: TimelineItem): string {
    if (!item.src) return '';
    if (
      item.src.startsWith('http://') ||
      item.src.startsWith('https://') ||
      item.src.startsWith('data:') ||
      item.src.startsWith('/')
    ) {
      return item.src;
    }
    const mediaMatch = this.allMediaRows().find((r) => r.clip.id === item.src);
    if (mediaMatch) {
      return this.assetUrl(mediaMatch.clip.assetId || mediaMatch.clip.id);
    }
    return this.assetUrl(item.src);
  }

  readonly formattedCurrentTime = computed(() => this.formatTimecode(this.currentTime()));
  readonly formattedPlayheadTime = this.formattedCurrentTime;
  readonly formattedTotalTime = computed(() => this.formatTimecode(this.contentDurationSeconds()));

  readonly effectiveWatermark = computed<WatermarkBody>(() => {
    if (this.watermark()) return this.watermark()!;
    const src = this.watermarkSource();
    if (src === 'none') {
      return {
        kind: 'None' as WatermarkKind,
        text: '',
        logoAssetId: null,
        position: 'TopRight' as WatermarkPosition,
        opacity: 0,
        heightFraction: 0.055,
        marginFraction: 0.04,
        colorHex: '#ffffff',
        backplateOpacity: 0.3,
      };
    }
    if (src === 'project') {
      const project = this.store.project();
      const def = project?.followChannelWatermark !== false ? this.channelWatermark() : project?.defaultWatermark;
      if (def && def.kind !== 'None') {
        return {
          kind: (def.kind as WatermarkKind) ?? 'None',
          text: def.text ?? '',
          logoAssetId: def.logoAssetId ?? null,
          position: (def.position as WatermarkPosition) ?? 'TopRight',
          opacity: def.opacity ?? 0.8,
          heightFraction: def.heightFraction ?? 0.055,
          marginFraction: def.marginFraction ?? 0.04,
          colorHex: def.colorHex ?? '#ffffff',
          backplateOpacity: def.backplateOpacity ?? 0.3,
        };
      }
    }
    return {
      kind: this.watermarkKind(),
      text: this.watermarkText(),
      logoAssetId: this.watermarkLogoId() || null,
      position: this.watermarkPosition(),
      opacity: this.watermarkOpacity(),
      heightFraction: this.watermarkHeight() / 100,
      marginFraction: this.watermarkMargin() / 100,
      colorHex: this.watermarkColor(),
      backplateOpacity: this.watermarkBackplate(),
    };
  });

  readonly preview = computed(() => {
    const height = 190;
    const project = this.store.project();
    const aspect = project ? project.width / project.height : 16 / 9;
    const wm = this.effectiveWatermark();

    const position = wm.position;
    const inset = wm.marginFraction * height;

    return {
      width: Math.round(height * aspect),
      height,
      fontSize: wm.heightFraction * height,
      inset,
      top: position.startsWith('Top'),
      align: position.endsWith('Left') ? 'flex-start'
        : position.endsWith('Right') ? 'flex-end'
          : 'center',
    };
  });

  readonly logoUrl = computed(() => {
    const wm = this.effectiveWatermark();
    if (!wm.logoAssetId) return null;
    return this.api.assetUrl(wm.logoAssetId);
  });

  readonly junctionsList = computed<JunctionView[]>(() => {
    const clips = this.included().map((r) => r.clip);
    const overrides = this.junctionOverrides();
    const list: JunctionView[] = [];

    for (let i = 0; i < clips.length - 1; i++) {
      const left = clips[i];
      const right = clips[i + 1];
      const key = this.junctionKey(left.id, right.id);
      const override = overrides.get(key);

      const isSplitAdjacent = this.resolveAssetId(left) === this.resolveAssetId(right);
      const defaultTrans = isSplitAdjacent ? 'None' : this.transition();
      const defaultSecs = isSplitAdjacent ? 0 : this.transitionSeconds();

      list.push({
        key,
        left,
        right,
        transition: override?.transition ?? defaultTrans,
        seconds: override?.seconds ?? defaultSecs,
      });
    }

    return list;
  });

  readonly customJunctionCount = computed<number>(() => {
    return this.junctionsList().filter((j) => j.transition && j.transition !== 'None').length;
  });

  readonly selectedJunction = computed<JunctionView | null>(() => {
    const key = this.selectedJunctionKey();
    if (!key) return null;
    return this.junctionsList().find((j) => j.key === key) ?? null;
  });

  readonly transitionModalJunction = computed<JunctionView | null>(() => {
    const direct = this.selectedJunction();
    if (direct) return direct;
    const list = this.junctionsList();
    return list.length > 0 ? list[0] : null;
  });

  readonly targetJunctions = computed<JunctionView[]>(() => {
    const scope = this.targetScope();
    const allJunctions = this.junctionsList();

    if (scope === 'all') {
      return allJunctions;
    }

    const selectedClipId = this.selectedClipId();
    if (scope === 'selected' && selectedClipId) {
      return allJunctions.filter(
        (j) => j.left.id === selectedClipId || j.right.id === selectedClipId
      );
    }

    const current = this.currentScheduledClip();
    if (scope === 'current' && current) {
      return allJunctions.filter((j) => j.left.id === current.clip.id);
    }

    return allJunctions;
  });

  readonly targetJunctionKeys = computed<Set<string>>(
    () => new Set(this.targetJunctions().map((j) => j.key))
  );

  readonly activeScopeTransition = computed<string>(() => {
    const scope = this.targetScope();
    if (scope === 'all') {
      return this.transition();
    }
    const tj = this.targetJunctions();
    if (tj.length === 0) {
      return this.transition();
    }
    return tj[0].transition;
  });

  readonly activeScopeTransitionSeconds = computed<number>(() => {
    const scope = this.targetScope();
    if (scope === 'all') {
      return this.transitionSeconds();
    }
    const tj = this.targetJunctions();
    if (tj.length === 0) {
      return this.transitionSeconds();
    }
    return tj[0].seconds;
  });

  readonly monitorScreenAspectClass = computed(() => {
    const override = this.previewAspectOverride();
    if (override === '9:16') return 'aspect-9-16 aspect-short';
    if (override === '1:1') return 'aspect-1-1 aspect-square';
    if (override === '4:5') return 'aspect-4-5 aspect-portrait';
    if (override === '16:9') return 'aspect-16-9 aspect-wide';
    const fmt = this.format();
    const asp = this.aspect();
    if (fmt === 'Short' || asp === '9:16') return 'aspect-9-16 aspect-short';
    if (fmt === 'Square' || asp === '1:1') return 'aspect-1-1 aspect-square';
    if (asp === '4:5') return 'aspect-4-5 aspect-portrait';
    return 'aspect-16-9 aspect-wide';
  });

  readonly monitorFitClass = computed(() => {
    const activeId = this.selectedClipId();
    if (activeId) {
      const framing = this.clipFramingSetting(activeId);
      if (framing.fit === 'Cover') return 'fit-cover';
    }
    const f = this.fit();
    if (f === 'Cover') return 'fit-cover';
    if (f === 'BlurredBackdrop') return 'fit-contain';
    return '';
  });

  readonly activeClipFraming = computed(() => {
    const id = this.selectedClipId();
    if (!id) return null;
    return this.clipFramingSetting(id);
  });

  readonly activeClipTransform = computed(() => {
    const clip = this.currentScheduledClip()?.clip ?? this.activeTargetClip();
    if (!clip) return 'none';

    // Combine framing zoom/pan with per-clip transform (scale, position, rotation)
    const framing = this.clipFramingSetting(clip.id);
    const t = this.clipTransformSetting(clip.id);

    const frameScale = framing ? (framing.zoom !== 100 ? framing.zoom / 100 : 1) : 1;
    const framePanY = framing?.panY === 'top' ? -8 : framing?.panY === 'bottom' ? 8 : 0;

    const totalScale = frameScale * (t?.scale ?? 1);
    const x = t?.x ?? 0;
    const y = (t?.y ?? 0) + framePanY;
    const rot = t?.rotation ?? 0;

    if (totalScale === 1 && x === 0 && y === 0 && rot === 0) return 'none';
    // Req 2: translate3d(x%, y%, 0) rotate(deg) scale(scale)
    return `translate3d(${x}%, ${y}%, 0) rotate(${rot}deg) scale(${totalScale})`;
  });


  readonly activeInspectorTabLabel = computed(() => {
    switch (this.activeInspectorTab()) {
      case 'clip': return '📐 Framing';
      case 'color': return '🎨 Color';
      case 'audio': return '🎵 Audio';
      case 'text': return 'T Text';
      case 'effects': return '✨ Effects';
      case 'transitions': return '⚡ Transitions';
      default: return '📐 Framing';
    }
  });

  clipColorSetting(clipId: string): ClipColorSetting {
    return this.clipColor().get(clipId) ?? {
      filter: this.activeFilter(),
      brightness: this.filterBrightness(),
      contrast: this.filterContrast(),
      saturation: this.filterSaturation(),
      sepia: this.filterSepia(),
      blur: this.filterBlur(),
    };
  }

  clipTextSetting(clipId: string): ClipTextSetting {
    return this.clipText().get(clipId) ?? {
      enabled: this.lowerThirdEnabled(),
      title: this.lowerThirdTitle(),
      subtitle: this.lowerThirdSubtitle(),
    };
  }

  readonly activeScopeColorSetting = computed<ClipColorSetting>(() => {
    const scope = this.targetScope();
    if (scope === 'all') {
      return {
        filter: this.activeFilter(),
        brightness: this.filterBrightness(),
        contrast: this.filterContrast(),
        saturation: this.filterSaturation(),
        sepia: this.filterSepia(),
        blur: this.filterBlur(),
      };
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      return this.clipColorSetting(targetIds[0]);
    }
    return {
      filter: this.activeFilter(),
      brightness: this.filterBrightness(),
      contrast: this.filterContrast(),
      saturation: this.filterSaturation(),
      sepia: this.filterSepia(),
      blur: this.filterBlur(),
    };
  });

  readonly activeScopeTextSetting = computed<ClipTextSetting>(() => {
    const scope = this.targetScope();
    if (scope === 'all') {
      return {
        enabled: this.lowerThirdEnabled(),
        title: this.lowerThirdTitle(),
        subtitle: this.lowerThirdSubtitle(),
      };
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      return this.clipTextSetting(targetIds[0]);
    }
    return {
      enabled: this.lowerThirdEnabled(),
      title: this.lowerThirdTitle(),
      subtitle: this.lowerThirdSubtitle(),
    };
  });

  readonly computedMonitorFilter = computed(() => {
    let color: ClipColorSetting;
    if (this.isPlaying()) {
      const sched = this.currentScheduledClip();
      color = sched ? this.clipColorSetting(sched.clip.id) : this.activeScopeColorSetting();
    } else {
      color = this.activeScopeColorSetting();
    }
    const preset = this.filterPresets.find((p) => p.id === color.filter);
    const baseFilter = preset && preset.id !== 'none' ? preset.filter : '';
    const b = color.brightness / 100;
    const c = color.contrast / 100;
    const s = color.saturation / 100;
    const sep = color.sepia / 100;
    const bl = color.blur;

    const adjustments = `brightness(${b}) contrast(${c}) saturate(${s}) sepia(${sep}) blur(${bl}px)`;
    return baseFilter ? `${baseFilter} ${adjustments}` : adjustments;
  });

  ngOnDestroy(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
      if (this.hasUnsavedChanges()) {
        this.autoSaveDraft();
      }
    }
    this.stopPolling();
    this.closePreview();
  }

  // Exact continuous time getter for isolated 60fps RAF loops (Guardrail 2)
  getCurrentTimeExact(): number {
    return this.exactCurrentTime;
  }

  // Playhead reporting from VideoViewport with 10fps throttle for signals (Guardrail 2)
  reportPlaybackTime(seconds: number): void {
    this.exactCurrentTime = seconds;
    const now = performance.now();
    if (now - this.lastTimeSignalEmit >= 100) {
      this.lastTimeSignalEmit = now;
      this.currentTime.set(seconds);
    }
  }

  formatTimecode(sec: number): string {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const rem = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}.${ms}`;
  }

  secondsToPx(sec: number): number {
    return Math.max(0, sec) * this.pxPerSecond();
  }

  pxToSeconds(px: number): number {
    return Math.max(0, px) / this.pxPerSecond();
  }

  // Media Library Methods
  getClipType(clip: Clip): 'video' | 'audio' | 'image' | 'ai' {
    const studio = this.studio();
    if (studio?.logoCandidates?.some((l) => l.id === clip.id)) return 'image';
    if (studio?.musicCandidates?.some((m) => m.id === clip.id)) return 'audio';
    const n = clip.name.toLowerCase();
    if (n.endsWith('.mp3') || n.endsWith('.wav') || n.endsWith('.ogg') || n.endsWith('.m4a') || n.endsWith('.aac')) return 'audio';
    if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.webp') || n.endsWith('.gif')) return 'image';
    return 'video';
  }

  isLibrarySelected(clipId: string): boolean {
    return this.selectedLibraryIds().has(clipId);
  }

  isClipOnTimeline(clipId: string): boolean {
    const assetId = this.resolveAssetId(clipId);
    const isAudio = this.musicAssetId() === clipId || this.musicAssetId() === assetId ||
      this.musicTracks().some((t) => t.assetId === clipId || t.assetId === assetId);
    if (isAudio) return true;
    if (this.timelineItems().some((it) => it.id === clipId || it.src === clipId || it.src === assetId)) return true;
    return this.rows().some((r) => (r.clip.id === clipId || this.resolveAssetId(r.clip) === assetId) && r.included);
  }

  getClipTimelineCount(clipId: string): number {
    const assetId = this.resolveAssetId(clipId);
    let count = 0;
    count += this.musicTracks().filter((t) => t.assetId === clipId || t.assetId === assetId).length;
    count += this.timelineItems().filter((it) => it.id === clipId || it.src === clipId || it.src === assetId).length;
    count += this.rows().filter((r) => (r.clip.id === clipId || this.resolveAssetId(r.clip) === assetId) && r.included).length;
    return count;
  }

  selectAllFiltered(): void {
    const rows = this.filteredRows();
    const ids = new Set<string>(rows.map((r) => r.clip.id));
    this.selectedLibraryIds.set(ids);
    if (ids.size > 0) {
      this.selectedClipId.set(Array.from(ids)[0]);
    }
  }

  selectUnusedMedia(): void {
    const rows = this.filteredRows().filter((r) => !this.isClipOnTimeline(r.clip.id));
    const ids = new Set<string>(rows.map((r) => r.clip.id));
    this.selectedLibraryIds.set(ids);
    if (ids.size > 0) {
      this.selectedClipId.set(Array.from(ids)[0]);
    } else {
      this.selectedClipId.set(null);
    }
  }

  selectInCutMedia(): void {
    const rows = this.filteredRows().filter((r) => this.isClipOnTimeline(r.clip.id));
    const ids = new Set<string>(rows.map((r) => r.clip.id));
    this.selectedLibraryIds.set(ids);
    if (ids.size > 0) {
      this.selectedClipId.set(Array.from(ids)[0]);
    } else {
      this.selectedClipId.set(null);
    }
  }

  invertSelection(): void {
    const rows = this.filteredRows();
    const cur = this.selectedLibraryIds();
    const next = new Set<string>();
    for (const r of rows) {
      if (!cur.has(r.clip.id)) {
        next.add(r.clip.id);
      }
    }
    this.selectedLibraryIds.set(next);
    if (next.size > 0) {
      this.selectedClipId.set(Array.from(next)[0]);
    } else {
      this.selectedClipId.set(null);
    }
  }

  selectOnlyUnusedFromCurrent(): void {
    const cur = this.selectedLibraryIds();
    const next = new Set<string>();
    for (const id of cur) {
      if (!this.isClipOnTimeline(id)) {
        next.add(id);
      }
    }
    this.selectedLibraryIds.set(next);
  }

  selectOnlyInCutFromCurrent(): void {
    const cur = this.selectedLibraryIds();
    const next = new Set<string>();
    for (const id of cur) {
      if (this.isClipOnTimeline(id)) {
        next.add(id);
      }
    }
    this.selectedLibraryIds.set(next);
  }

  selectClip(clipId: string, event?: Event): void {
    const mouseEv = event as MouseEvent | undefined;
    const isMulti = !!(mouseEv?.ctrlKey || mouseEv?.metaKey || mouseEv?.shiftKey);
    if (isMulti) {
      this.selectedLibraryIds.update((set) => {
        const next = new Set(set);
        if (next.has(clipId)) next.delete(clipId);
        else next.add(clipId);
        return next;
      });
      const currentSet = this.selectedLibraryIds();
      if (currentSet.has(clipId)) {
        this.selectedClipId.set(clipId);
      } else if (currentSet.size > 0) {
        this.selectedClipId.set(Array.from(currentSet)[0]);
      } else {
        this.selectedClipId.set(null);
      }
    } else {
      if (this.selectedClipId() === clipId && this.selectedLibraryIds().size <= 1) {
        this.selectedClipId.set(null);
        this.selectedLibraryIds.set(new Set());
        return;
      }
      this.selectedMusicTrackKey.set(null);
      this.selectedClipId.set(clipId);
      this.selectedLibraryIds.set(new Set([clipId]));
      this.selectedTimelineItemId.set(null);
      this.selectedTimelineItemIds.set(new Set());
      this.targetScope.set('selected');
    }
  }

  toggleLibrarySelection(clipId: string): void {
    this.selectedLibraryIds.update((set) => {
      const next = new Set(set);
      if (next.has(clipId)) next.delete(clipId);
      else next.add(clipId);
      return next;
    });

    const currentSet = this.selectedLibraryIds();
    if (currentSet.has(clipId)) {
      this.selectedClipId.set(clipId);
    } else if (currentSet.size > 0) {
      this.selectedClipId.set(Array.from(currentSet)[0]);
    } else {
      this.selectedClipId.set(null);
    }
  }

  selectTimelineClip(index: number, clipId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedMusicTrackKey.set(null);
    this.selectedTimelineItemId.set(null);
    this.selectedTimelineItemIds.set(new Set());
    this.targetScope.set('selected');

    const mouse = event as MouseEvent | undefined;

    // Shift extends from the anchor, Ctrl/Cmd toggles one clip - the conventions from
    // every file list, so they need no explaining.
    if (mouse?.shiftKey) {
      this.selectedTimelineClipIndex.set(index);
      this.selectClipRangeTo(clipId);
      return;
    }
    if (mouse?.ctrlKey || mouse?.metaKey) {
      this.selectedTimelineClipIndex.set(index);
      this.toggleClipInSelection(clipId);
      return;
    }

    this.selectedTimelineClipIndex.set(index);
    this.selectedClipId.set(clipId);
    this.selectedLibraryIds.set(new Set([clipId]));
    this.selectionAnchorIndex.set(index);
    // Clicking a clip parks the caret just after it, so "add" and "paste" land where the
    // user is looking rather than at the far end of the timeline.
    this.insertIndex.set(index + 1);
  }

  removeTimelineClipAtIndex(clipIdOrIndex: string | number, timelineIndex?: number): void {
    const allRows = [...this.rows()];
    let removeIdx = -1;

    if (typeof clipIdOrIndex === 'string') {
      removeIdx = allRows.findIndex((r) => r.clip.id === clipIdOrIndex);
    } else if (clipIdOrIndex >= 0 && clipIdOrIndex < allRows.length && allRows[clipIdOrIndex].included) {
      removeIdx = clipIdOrIndex;
    } else if (timelineIndex !== undefined && timelineIndex >= 0) {
      let count = 0;
      for (let i = 0; i < allRows.length; i++) {
        if (allRows[i].included) {
          if (count === timelineIndex) {
            removeIdx = i;
            break;
          }
          count++;
        }
      }
    } else if (clipIdOrIndex >= 0) {
      let count = 0;
      for (let i = 0; i < allRows.length; i++) {
        if (allRows[i].included) {
          if (count === clipIdOrIndex) {
            removeIdx = i;
            break;
          }
          count++;
        }
      }
    }

    if (removeIdx >= 0) {
      const removedClip = allRows[removeIdx].clip;
      allRows.splice(removeIdx, 1);
      this.rows.set(allRows);
      this.markDirty();
      this.saveOrder();

      if (this.selectedClipId() === removedClip.id || this.selectedTimelineClipIndex() === removeIdx) {
        this.selectedTimelineClipIndex.set(null);
        this.selectedClipId.set(null);
      }
      this.status.notify(['Removed clip from timeline cut.']);
    }
  }

  duplicateSelectedTimelineItem(): void {
    // 1. If a timeline clip on V1 is selected
    const clipIdx = this.selectedTimelineClipIndex();
    const clipId = this.selectedClipId();
    if (clipIdx !== null || clipId) {
      const inc = this.included();
      const allRows = [...this.rows()];
      let targetRow: ClipRow | null = null;
      let foundIdx = -1;

      if (clipId) {
        foundIdx = allRows.findIndex((r) => r.clip.id === clipId);
        if (foundIdx >= 0) targetRow = allRows[foundIdx];
      }
      if (!targetRow && clipIdx !== null && clipIdx >= 0 && clipIdx < inc.length) {
        targetRow = inc[clipIdx];
        foundIdx = allRows.findIndex((r) => r === targetRow);
      }

      if (targetRow && foundIdx >= 0) {
        const realAssetId = this.resolveAssetId(targetRow.clip);
        const uniqueId = `${realAssetId}_dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const baseName = targetRow.clip.name.replace(/ \(Copy( \d+)?\)$/, '');
        const newClip: Clip = {
          ...targetRow.clip,
          id: uniqueId,
          assetId: realAssetId,
          name: `${baseName} (Copy)`,
        };
        const newEntry: ClipRow = {
          clip: newClip,
          included: true,
        };
        allRows.splice(foundIdx + 1, 0, newEntry);
        this.rows.set(allRows);
        this.selectedClipId.set(uniqueId);
        this.selectedTimelineClipIndex.set(foundIdx + 1);
        this.markDirty();
        this.saveOrder();
        this.status.notify([`Duplicated clip "${targetRow.clip.name}" on timeline cut.`]);
        return;
      }
    }

    // 2. If an overlay timeline item (IMG or TXT) is selected
    const tlItem = this.selectedTimelineItem();
    if (tlItem) {
      const dur = tlItem.duration;
      const validStart = this.clampItemCollision(tlItem.trackId, tlItem.startTime + dur, dur);
      const newItemId = `${tlItem.type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const newItem: TimelineItem = {
        ...tlItem,
        id: newItemId,
        startTime: validStart,
        name: tlItem.name ? `${tlItem.name} (Copy)` : undefined,
      };
      this.timelineItems.update((items) => [...items, newItem]);
      this.selectedTimelineItemId.set(newItemId);
      this.selectedTimelineItemIds.set(new Set([newItemId]));
      this.markDirty();
      this.status.notify([`Duplicated item on track ${tlItem.trackId}.`]);
    }
  }

  clearVideoAndItemSelections(): void {
    this.selectedTimelineClipIndex.set(null);
    this.selectedClipId.set(null);
    this.selectedLibraryIds.set(new Set());
    this.selectedTimelineItemId.set(null);
    this.selectedTimelineItemIds.set(new Set());
  }

  clearAllSelections(): void {
    this.clearVideoAndItemSelections();
    this.selectedMusicTrackKey.set(null);
  }

  toggleSelectAll(): void {
    this.selectAllCheckbox = !this.selectAllCheckbox;
    if (this.selectAllCheckbox) {
      const allIds = this.filteredRows().map((r) => r.clip.id);
      this.selectedLibraryIds.set(new Set(allIds));
      if (allIds.length > 0) this.selectedClipId.set(allIds[0]);
    } else {
      this.selectedLibraryIds.set(new Set());
      this.selectedClipId.set(null);
    }
  }

  selectAllTimelineClips(): void {
    const incIds = this.included().map((r) => r.clip.id);
    const tlItemIds = this.timelineItems().map((it) => it.id);
    this.selectedLibraryIds.set(new Set(incIds));
    this.selectedTimelineItemIds.set(new Set(tlItemIds));
    if (incIds.length > 0) {
      this.selectedClipId.set(incIds[0]);
    } else if (tlItemIds.length > 0) {
      this.selectedTimelineItemId.set(tlItemIds[0]);
    }
  }

  sortMedia(by: 'name' | 'duration'): void {
    this.rows.update((r) => {
      const next = [...r];
      if (by === 'name') {
        next.sort((a, b) => a.clip.name.localeCompare(b.clip.name));
      } else {
        next.sort((a, b) => (a.clip.durationSeconds ?? 0) - (b.clip.durationSeconds ?? 0));
      }
      return next;
    });
    this.markDirty();
  }

  reverse(): void {
    this.rows.update((r) => [...r].reverse());
    this.markDirty();
  }

  prevPage(): void {
    if (this.currentPage() > 0) this.currentPage.set(this.currentPage() - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.currentPage.set(this.currentPage() + 1);
  }

  addClipToTimeline(clipId: string): void {
    const studio = this.studio();
    // Resolve clip metadata
    let clip: Clip | null = null;
    const mediaRow = this.allMediaRows().find((r) => r.clip.id === clipId);
    if (mediaRow) {
      clip = mediaRow.clip;
    } else if (studio?.logoCandidates?.some((l) => l.id === clipId)) {
      const img = studio.logoCandidates.find((l) => l.id === clipId)!;
      clip = {
        id: img.id,
        name: img.name,
        fileSizeBytes: img.fileSizeBytes,
        durationSeconds: 5.0,
        width: img.width,
        height: img.height,
        hasAudio: false,
      };
    } else if (studio?.musicCandidates?.some((m) => m.id === clipId)) {
      const aud = studio.musicCandidates.find((m) => m.id === clipId)!;
      clip = {
        id: aud.id,
        name: aud.name,
        fileSizeBytes: aud.fileSizeBytes,
        durationSeconds: aud.durationSeconds,
        hasAudio: true,
      };
    } else {
      const row = this.rows().find((r) => r.clip.id === clipId);
      if (row) clip = row.clip;
    }

    if (!clip) return;

    const assetType = this.getClipType(clip);

    if (assetType === 'audio') {
      // Audio routes strictly to audio track
      this.addMusicTrackFromAsset(clip.id);
      this.status.notify([`Added audio "${clip.name}" to audio track.`]);
      return;
    }

    if (assetType === 'image') {
      // Images route strictly to IMG1 Image track
      const defaultDuration = clip.durationSeconds ?? 5.0;
      const validStart = this.clampItemCollision('IMG1', this.currentTime(), defaultDuration);
      const newItemId = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const newItem: TimelineItem = {
        id: newItemId,
        type: 'image',
        trackId: 'IMG1',
        startTime: validStart,
        duration: defaultDuration,
        src: clip.id,
        name: clip.name,
        transform: {
          scale: 1.0,
          x: 0,
          y: 0,
          opacity: 1.0,
          transitionIn: 'fade',
          transitionInDuration: 0.5,
          transitionOut: 'fade',
          transitionOutDuration: 0.5,
        },
      };
      this.timelineItems.update((items) => [...items, newItem]);
      this.selectedTimelineItemId.set(newItemId);
      // Ensure image is never in rows (V1)
      if (this.rows().some((r) => r.clip.id === clipId)) {
        this.rows.update((r) => r.filter((row) => row.clip.id !== clipId));
      }
      this.markDirty();
      this.status.notify([`Added image "${clip.name}" to Image track (IMG).`]);
      return;
    }

    // Video clips route strictly to V1 Base Video track, at the insert caret.
    const where = this.insertPointLabel();
    const rows = [...this.rows()];
    const existingIdx = rows.findIndex((r) => r.clip.id === clipId && !r.included);
    if (existingIdx >= 0) {
      // Already in the library but out of the cut: move it to the caret rather than
      // switching it on wherever it happens to sit in the library order.
      const [existing] = rows.splice(existingIdx, 1);
      this.rows.set(rows);
      this.insertRowsAtCaret([{ ...existing, included: true }]);
    } else {
      this.insertRowsAtCaret([{ clip, included: true }]);
    }
    this.status.notify([`Added "${clip.name}" ${where}.`]);
  }

  removeClipFromTimeline(clipOrAssetId: string): void {
    let removed = false;

    const rows = [...this.rows()];
    const filteredRows = rows.filter((r) => {
      const match = r.clip.id === clipOrAssetId || this.resolveAssetId(r.clip) === clipOrAssetId;
      if (match) removed = true;
      return !match;
    });

    if (removed) {
      this.rows.set(filteredRows);
      this.saveOrder();
    }

    if (this.timelineItems().some((it) => it.id === clipOrAssetId || it.src === clipOrAssetId || this.resolveAssetId(it.src) === clipOrAssetId)) {
      this.timelineItems.update((items) =>
        items.filter((it) => it.id !== clipOrAssetId && it.src !== clipOrAssetId && this.resolveAssetId(it.src) !== clipOrAssetId)
      );
      removed = true;
    }

    if (this.musicTracks().some((t) => t.assetId === clipOrAssetId || t.key === clipOrAssetId)) {
      this.musicTracks.update((tracks) => tracks.filter((t) => t.assetId !== clipOrAssetId && t.key !== clipOrAssetId));
      removed = true;
    }

    if (this.musicAssetId() === clipOrAssetId) {
      this.musicAssetId.set('');
      removed = true;
    }

    this.clearAllSelections();

    if (removed) {
      this.markDirty();
      this.status.notify(['Removed from timeline cut.']);
    }
  }

  addSelectedToTimeline(): void {
    const unplaced = [...this.selectedLibraryIds()].filter((id) => !this.isClipOnTimeline(id));
    if (unplaced.length === 0) {
      this.status.notify(['The selected media is already on the timeline.']);
      return;
    }
    if (this.askWhereToInsert('add', unplaced, unplaced.length)) return;
    this.performAddToCut(unplaced);
  }

  /** The per-clip "Add to Cut" button. Asks where, exactly like the bulk button. */
  addClipToCutWithPrompt(clipId: string): void {
    if (this.isClipOnTimeline(clipId)) {
      this.status.notify(['That clip is already in the cut.']);
      return;
    }
    if (this.askWhereToInsert('add', [clipId], 1)) return;
    this.performAddToCut([clipId]);
  }

  private performAddToCut(clipIds: string[]): void {
    const ordered = this.rows()
      .filter((r) => clipIds.includes(r.clip.id) && !r.included)
      .map((r) => r.clip.id);
    const targets = ordered.length > 0 ? ordered : clipIds;

    let added = 0;
    for (const clipId of targets) {
      if (this.isClipOnTimeline(clipId)) continue;
      this.addClipToTimeline(clipId);
      added++;
    }

    this.saveOrder();
    if (added > 0) {
      this.status.notify([`Added ${added} clip${added > 1 ? 's' : ''} to the cut.`]);
    }
  }

  removeSelectedFromTimeline(): void {
    const selLibIds = this.selectedLibraryIds();
    const selTlIds = this.selectedTimelineItemIds();
    if (selLibIds.size === 0 && selTlIds.size === 0) return;

    if (selLibIds.size > 0) {
      this.rows.update((rows) =>
        rows.filter((r) => !selLibIds.has(r.clip.id) && !selLibIds.has(this.resolveAssetId(r.clip)))
      );
      this.timelineItems.update((items) =>
        items.filter((it) => !selLibIds.has(it.id) && !selLibIds.has(it.src) && !selLibIds.has(this.resolveAssetId(it.src)))
      );
      this.musicTracks.update((tracks) =>
        tracks.filter((t) => !selLibIds.has(t.assetId) && !selLibIds.has(t.key))
      );
      if (selLibIds.has(this.musicAssetId())) {
        this.musicAssetId.set('');
      }
      this.saveOrder();
    }

    if (selTlIds.size > 0) {
      this.timelineItems.update((items) => items.filter((it) => !selTlIds.has(it.id)));
    }

    this.clearAllSelections();
    this.markDirty();
    this.status.notify(['Removed selected items from timeline.']);
  }

  deleteOrRemoveCurrentSelection(): void {
    const selTlIds = this.selectedTimelineItemIds();
    const selTlId = this.selectedTimelineItemId();
    if (selTlIds.size > 0 || selTlId) {
      const toRemove = new Set(selTlIds);
      if (selTlId) toRemove.add(selTlId);
      this.timelineItems.update((items) => items.filter((it) => !toRemove.has(it.id)));
      this.selectedTimelineItemIds.set(new Set());
      this.selectedTimelineItemId.set(null);
      this.markDirty();
      this.status.notify(['Removed timeline item(s).']);
      return;
    }

    const selClipId = this.selectedClipId();
    const selClipIdx = this.selectedTimelineClipIndex();
    if (selClipId || selClipIdx !== null) {
      this.removeTimelineClipAtIndex(selClipId || selClipIdx!, selClipIdx ?? undefined);
      return;
    }

    const selLibIds = this.selectedLibraryIds();
    if (selLibIds.size > 0) {
      this.removeSelectedFromTimeline();
      return;
    }

    const selClip = this.selectedClip();
    if (selClip) {
      this.removeClipFromTimeline(selClip.id);
      return;
    }
  }

  readonly confirmingDelete = signal<boolean>(false);

  deleteSelected(): void {
    const selTlIds = this.selectedTimelineItemIds();
    const selItemId = this.selectedTimelineItemId();
    if (selTlIds.size > 0 || selItemId) {
      const toRemove = new Set(selTlIds);
      if (selItemId) toRemove.add(selItemId);
      this.timelineItems.update((items) => items.filter((it) => !toRemove.has(it.id)));
      this.selectedTimelineItemIds.set(new Set());
      this.selectedTimelineItemId.set(null);
      this.markDirty();
      this.status.notify(['Removed timeline item(s).']);
      return;
    }
    const selClipId = this.selectedClipId();
    const selClipIdx = this.selectedTimelineClipIndex();
    if (selClipId || selClipIdx !== null) {
      this.removeTimelineClipAtIndex(selClipId || selClipIdx!, selClipIdx ?? undefined);
      return;
    }
    if (this.confirmingDelete()) {
      this.removeFromLibrary();
    } else {
      this.confirmingDelete.set(true);
    }
  }

  removeFromLibrary(): void {
    const projectId = this.store.projectId();
    const selIds = Array.from(this.selectedLibraryIds());
    const ids = selIds.length > 0 ? selIds : this.allMediaRows().filter((r) => r.included).map((r) => r.clip.id);

    if (!projectId || ids.length === 0) {
      this.confirmingDelete.set(false);
      return;
    }

    this.status.run(this.api.deleteClips(projectId, ids), () => {
      this.confirmingDelete.set(false);
      this.selectedLibraryIds.set(new Set());
      this.store.refreshAssets();
      this.reload(false);
    });
  }

  previousPage(): void {
    this.prevPage();
  }

  // Playback Methods
  play(): void {
    if (this.currentTime() >= this.contentDurationSeconds() && this.contentDurationSeconds() > 0) {
      this.seekTo(0);
    }
    this.isPlaying.set(true);
  }

  pause(): void {
    this.isPlaying.set(false);
  }

  togglePlayback(): void {
    if (this.isPlaying()) this.pause();
    else this.play();
  }

  seekTo(seconds: number): void {
    const clamped = Math.max(0, Math.min(seconds, this.timelineSeconds()));
    this.exactCurrentTime = clamped;
    this.currentTime.set(clamped);
    this.seekRequest.set({ time: clamped, nonce: Date.now() });
  }

  step(direction: number): void {
    const fps = 30;
    const delta = (1 / fps) * direction;
    this.seekTo(this.currentTime() + delta);
  }

  jumpCut(direction: number): void {
    const sched = this.clipSchedule();
    if (sched.length === 0) return;
    const cur = this.currentTime();
    if (direction < 0) {
      for (let i = sched.length - 1; i >= 0; i--) {
        if (sched[i].startSeconds < cur - 0.1) {
          this.seekTo(sched[i].startSeconds);
          return;
        }
      }
      this.seekTo(0);
    } else {
      for (let i = 0; i < sched.length; i++) {
        if (sched[i].startSeconds > cur + 0.1) {
          this.seekTo(sched[i].startSeconds);
          return;
        }
      }
    }
  }

  prevClip(): void {
    this.jumpCut(-1);
  }

  nextClip(): void {
    this.jumpCut(1);
  }

  stepFrame(dir: number): void {
    this.step(dir);
  }

  togglePlay(): void {
    this.togglePlayback();
  }

  toggleLoop(): void {
    this.isLooping.update((v) => !v);
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed.set(speed);
  }

  setPreviewAspect(aspect: 'auto' | '16:9' | '9:16' | '1:1' | '4:5'): void {
    this.previewAspectOverride.set(aspect);
  }

  toggleShortsSafeZone(): void {
    this.showShortsSafeZone.update((v) => !v);
  }

  toggleBroadcastSafeZone(): void {
    this.showBroadcastSafeZone.update((v) => !v);
  }

  setMonitorVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(vol, 2.0));
    this.monitorVolume.set(clamped);
  }

  toggleMonitorMute(): void {
    const next = !this.isMonitorMuted();
    this.isMonitorMuted.set(next);
  }

  // Audio Mixer Methods
  setTrackVolume(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master', volume: number): void {
    const clamped = Math.max(0, Math.min(volume, 2.0));
    if (trackId === 'V1') this.trackV1Volume.set(clamped);
    else if (trackId === 'V2') this.trackV2Volume.set(clamped);
    else if (trackId === 'A1') this.trackA1Volume.set(clamped);
    else if (trackId === 'A2') this.trackA2Volume.set(clamped);
    else if (trackId === 'Master') this.setMonitorVolume(clamped);

    if (trackId !== 'Master') {
    }
    this.markDirty();
  }

  toggleTrackMute(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master'): void {
    if (trackId === 'Master') {
      this.toggleMonitorMute();
      return;
    }
    let nextMuted = false;
    if (trackId === 'V1') {
      nextMuted = !this.trackV1Muted();
      this.trackV1Muted.set(nextMuted);
    } else if (trackId === 'V2') {
      nextMuted = !this.trackV2Muted();
      this.trackV2Muted.set(nextMuted);
    } else if (trackId === 'A1') {
      nextMuted = !this.trackA1Muted();
      this.trackA1Muted.set(nextMuted);
    } else if (trackId === 'A2') {
      nextMuted = !this.trackA2Muted();
      this.trackA2Muted.set(nextMuted);
    }
    this.markDirty();
  }

  isTrackMuted(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master'): boolean {
    if (trackId === 'V1') return this.trackV1Muted();
    if (trackId === 'V2') return this.trackV2Muted();
    if (trackId === 'A1') return this.trackA1Muted();
    if (trackId === 'A2') return this.trackA2Muted();
    return this.isMonitorMuted();
  }

  volumeToDb(vol: number): string {
    if (vol <= 0.0001) return '-∞ dB';
    const db = 20 * Math.log10(vol);
    const sign = db >= 0 ? '+' : '';
    return `${sign}${db.toFixed(1)} dB`;
  }

  // Clip Audio Settings & Batch Modifications
  clipSound(id: string): ClipAudioSetting {
    return this.clipSounds()[id] || {
      volume: 1.0,
      audioAssetId: '',
      audioVolume: 1.0,
      keepOriginalAudio: true,
      audioTrimStartSeconds: 0,
      audioTrimEndSeconds: 0,
      overlapRule: 'Inherit',
      duckLevelOverride: null,
    };
  }

  updateClipAudioSetting(id: string, patch: Partial<ClipAudioSetting>): void {
    const current = this.clipSound(id);
    const updated = { ...current, ...patch };
    this.clipSounds.update((s) => ({ ...s, [id]: updated }));
    this.markDirty();
  }

  setClipVolume(clipId: string, vol: number): void {
    const clamped = Math.max(0, Math.min(2.0, vol));
    const isTlItem = this.timelineItems().some((it) => it.id === clipId);
    if (isTlItem) {
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === clipId ? { ...it, volume: clamped } : it))
      );
    } else {
      const targetIds = this.getTargetClipIds(clipId);
      for (const id of targetIds) {
        this.updateClipAudioSetting(id, { volume: clamped });
      }
    }
    this.markDirty();
  }

  /**
   * Folds the four old settings into the single rule. Runs once per draft load; anything
   * already carrying an overlapRule is left alone so a migrated draft is never re-mapped.
   */
  private migrateLegacyOverlapSettings(): void {
    this.clipSounds.update((sounds) => {
      const next: Record<string, ClipAudioSetting> = {};
      let changed = false;
      for (const [id, sound] of Object.entries(sounds)) {
        if (sound.overlapRule !== undefined || (sound.duckMode === undefined && sound.musicVolumeOverride === undefined)) {
          next[id] = sound;
          continue;
        }
        // 'LeadVoice' and 'Ducked' both meant "lower the music under this clip".
        let rule: AudioOverlapRuleOrInherit = 'Inherit';
        if (sound.duckMode === 'Ducked' || sound.duckMode === 'LeadVoice') rule = 'DuckMusic';
        else if (sound.duckMode === 'MuteOnAudio') rule = 'MusicOnly';

        // An explicit music level was its own way of saying "duck the music this far".
        let duckLevelOverride = sound.duckLevelOverride ?? null;
        if (sound.musicVolumeOverride !== null && sound.musicVolumeOverride !== undefined) {
          rule = sound.musicVolumeOverride === 0 ? 'MusicOnly' : 'DuckMusic';
          if (sound.musicVolumeOverride > 0) duckLevelOverride = sound.musicVolumeOverride;
        }

        next[id] = { ...sound, overlapRule: rule, duckLevelOverride };
        changed = true;
      }
      return changed ? next : sounds;
    });

    this.musicTracks.update((tracks) => {
      let changed = false;
      const next = tracks.map((t) => {
        if (t.overlapRule !== undefined || t.clipAudioMode === undefined) return t;
        const rule: AudioOverlapRuleOrInherit =
          t.clipAudioMode === 'MuteUnderMusic' ? 'MusicOnly'
          : t.clipAudioMode === 'Ducked' ? 'DuckVideo'
          : t.clipAudioMode === 'KeepAudio' ? 'PlayBoth'
          : 'Inherit';
        changed = true;
        return { ...t, overlapRule: rule };
      });
      return changed ? next : tracks;
    });
  }

  /** Every clip an "apply to" edit should touch: explicit selection plus the chosen scope. */
  batchTargetIds(): Set<string> {
    return new Set([
      ...this.selectedTimelineItemIds(),
      ...this.selectedLibraryIds(),
      ...this.getTargetClipIds(),
    ]);
  }

  private previousClipVolumes = new Map<string, number>();

  toggleClipMute(clipId: string): void {
    const isTlItem = this.timelineItems().some((it) => it.id === clipId);
    if (isTlItem) {
      const tlItem = this.timelineItems().find((it) => it.id === clipId)!;
      const curVol = tlItem.volume ?? 1.0;
      const nextVol = curVol > 0 ? 0 : (this.previousClipVolumes.get(clipId) ?? 1.0);
      if (curVol > 0) this.previousClipVolumes.set(clipId, curVol);
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === clipId ? { ...it, volume: nextVol } : it))
      );
      this.markDirty();
      return;
    }

    const curVol = this.clipSound(clipId).volume;
    const nextVol = curVol > 0 ? 0 : (this.previousClipVolumes.get(clipId) ?? 1.0);
    if (curVol > 0) this.previousClipVolumes.set(clipId, curVol);
    this.setClipVolume(clipId, nextVol);
  }

  /** Reads a clip's own overlap rule, before precedence - 'Inherit' means it defers upward. */
  clipOverlapRule(clipId: string): AudioOverlapRuleOrInherit {
    const tlItem = this.timelineItems().find((it) => it.id === clipId);
    if (tlItem) return (tlItem as { overlapRule?: AudioOverlapRuleOrInherit }).overlapRule ?? 'Inherit';
    return this.clipSound(clipId).overlapRule ?? 'Inherit';
  }

  setClipOverlapRule(clipId: string, rule: AudioOverlapRuleOrInherit): void {
    const isTlItem = this.timelineItems().some((it) => it.id === clipId);
    if (isTlItem) {
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === clipId ? { ...it, overlapRule: rule } : it))
      );
      this.markDirty();
      return;
    }

    for (const id of this.getTargetClipIds(clipId)) {
      this.updateClipAudioSetting(id, { overlapRule: rule });
    }
    this.markDirty();
  }

  /** Applies one rule to every clip in the current "apply to" scope. */
  setBatchOverlapRule(rule: AudioOverlapRuleOrInherit): void {
    const targetIds = this.batchTargetIds();
    if (targetIds.size === 0) return;

    this.timelineItems.update((items) =>
      items.map((it) => (targetIds.has(it.id) ? { ...it, overlapRule: rule } : it))
    );
    this.clipSounds.update((currentSounds) => {
      const next = { ...currentSounds };
      for (const id of targetIds) {
        next[id] = { ...this.clipSound(id), ...(next[id] ?? {}), overlapRule: rule };
      }
      return next;
    });
    this.markDirty();
  }

  /** Per-clip duck depth, or null to follow the project duck level. */
  clipDuckLevelOverride(clipId: string): number | null {
    const tlItem = this.timelineItems().find((it) => it.id === clipId);
    if (tlItem) return (tlItem as { duckLevelOverride?: number | null }).duckLevelOverride ?? null;
    return this.clipSound(clipId).duckLevelOverride ?? null;
  }

  setClipDuckLevelOverride(clipId: string, level: number | null): void {
    const clamped = level === null || level === undefined ? null : Math.max(0, Math.min(1, level));
    const isTlItem = this.timelineItems().some((it) => it.id === clipId);
    if (isTlItem) {
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === clipId ? { ...it, duckLevelOverride: clamped } : it))
      );
      this.markDirty();
      return;
    }

    for (const id of this.getTargetClipIds(clipId)) {
      this.updateClipAudioSetting(id, { duckLevelOverride: clamped });
    }
    this.markDirty();
  }

  setProjectOverlapRule(rule: AudioOverlapRule): void {
    this.projectOverlapRule.set(rule);
    this.markDirty();
    this.status.notify([`Project default: ${this.overlapRuleLabel(rule)}.`]);
  }

  /** Steps the project default through the four rules - used by the timeline header button. */
  cycleProjectOverlapRule(): void {
    const order: AudioOverlapRule[] = ['PlayBoth', 'DuckMusic', 'DuckVideo', 'MusicOnly'];
    const idx = order.indexOf(this.projectOverlapRule());
    this.setProjectOverlapRule(order[(idx + 1) % order.length]);
  }

  overlapRuleLabel(rule: AudioOverlapRuleOrInherit): string {
    if (rule === 'DuckMusic') return 'Duck music';
    if (rule === 'DuckVideo') return 'Duck video';
    if (rule === 'MusicOnly') return 'Music only';
    if (rule === 'Inherit') return 'Inherit';
    return 'Play both';
  }

  setMusicTrackOverlapRule(key: string, rule: AudioOverlapRuleOrInherit): void {
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, overlapRule: rule } : t))
    );
    this.markDirty();
  }

  /** The music track, if any, playing under the clip that occupies this stretch of timeline. */
  private musicTrackUnderClip(clipId: string): MusicTrackRow | null {
    const sched = this.clipSchedule().find((x) => x.clip.id === clipId);
    if (!sched) return null;
    return this.musicTracks().find((t) => {
      const start = t.startSeconds;
      const end = start + this.musicTrackDurationSeconds(t);
      return start < sched.endSeconds && end > sched.startSeconds && !t.muted;
    }) ?? null;
  }

  /**
   * THE precedence chain, in one place: clip beats music track beats project default.
   * Preview and export both call this, so what you hear is what gets rendered.
   */
  resolveOverlap(clipId: string): ResolvedOverlap {
    const track = this.musicTrackUnderClip(clipId);
    const hasMusicUnder = Boolean(track) || (this.musicAssetId() !== '' && this.musicVolume() > 0);

    const clipRule = this.clipOverlapRule(clipId);
    const trackRule = track?.overlapRule ?? 'Inherit';

    let rule: AudioOverlapRule;
    let source: AudioOverlapSource;
    let sourceLabel = '';
    if (clipRule !== 'Inherit') {
      rule = clipRule;
      source = 'clip';
    } else if (trackRule !== 'Inherit') {
      rule = trackRule;
      source = 'track';
      sourceLabel = track ? this.musicTrackName(track) : '';
    } else {
      rule = this.projectOverlapRule();
      source = 'project';
    }

    const level = this.clipDuckLevelOverride(clipId) ?? this.duckLevel();

    let videoGain = 1;
    let musicGain = 1;
    if (hasMusicUnder) {
      if (rule === 'DuckMusic') musicGain = level;
      else if (rule === 'DuckVideo') videoGain = level;
      else if (rule === 'MusicOnly') videoGain = 0;
    }

    return { rule, source, sourceLabel, level, videoGain, musicGain, hasMusicUnder };
  }

  clipAudioFadeSetting(clipId: string): { fadeInSeconds: number; fadeOutSeconds: number } {
    return this.clipAudioFade().get(clipId) ?? { fadeInSeconds: 0, fadeOutSeconds: 0 };
  }

  setClipAudioFade(clipId: string, fadeInSeconds: number, fadeOutSeconds: number): void {
    const targetIds = this.getTargetClipIds(clipId);
    this.clipAudioFade.update((m) => {
      const next = new Map(m);
      for (const id of targetIds) {
        next.set(id, { fadeInSeconds, fadeOutSeconds });
      }
      return next;
    });
    this.markDirty();
  }

  setClipFadeIn(clipId: string, seconds: number): void {
    const targetClip = this.activeTargetClip();
    const duration = targetClip?.durationSeconds ?? 10.0;
    const current = this.clipAudioFadeSetting(clipId);
    const maxAllowedFadeIn = Math.max(0, duration - current.fadeOutSeconds);
    const clamped = Math.max(0, Math.min(maxAllowedFadeIn, Math.round(seconds * 10) / 10));
    this.setClipAudioFade(clipId, clamped, current.fadeOutSeconds);
  }

  setClipFadeOut(clipId: string, seconds: number): void {
    const targetClip = this.activeTargetClip();
    const duration = targetClip?.durationSeconds ?? 10.0;
    const current = this.clipAudioFadeSetting(clipId);
    const maxAllowedFadeOut = Math.max(0, duration - current.fadeInSeconds);
    const clamped = Math.max(0, Math.min(maxAllowedFadeOut, Math.round(seconds * 10) / 10));
    this.setClipAudioFade(clipId, current.fadeInSeconds, clamped);
  }

  adjustClipFadeIn(clipId: string, delta: number): void {
    const current = this.clipAudioFadeSetting(clipId);
    this.setClipFadeIn(clipId, current.fadeInSeconds + delta);
  }

  adjustClipFadeOut(clipId: string, delta: number): void {
    const current = this.clipAudioFadeSetting(clipId);
    this.setClipFadeOut(clipId, current.fadeOutSeconds + delta);
  }

  setBatchVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(vol, 2.0));
    const selTlIds = this.selectedTimelineItemIds();
    const selLibIds = this.selectedLibraryIds();
    const targetScopeIds = this.getTargetClipIds();
    const targetIds = new Set([...selTlIds, ...selLibIds, ...targetScopeIds]);

    if (targetIds.size === 0) return;

    this.clipSounds.update((currentSounds) => {
      const next = { ...currentSounds };
      for (const id of targetIds) {
        const curr = next[id] || {
          volume: 1.0,
          audioAssetId: '',
          audioVolume: 1.0,
          keepOriginalAudio: true,
          overlapRule: 'Inherit',
        };
        next[id] = { ...curr, volume: clamped };
      }
      return next;
    });
    this.markDirty();
  }

  setBatchMute(muted: boolean): void {
    this.setBatchVolume(muted ? 0.0 : 1.0);
  }

  setAudioInspectorView(mode: 'auto' | 'clip' | 'mixer'): void {
    this.audioInspectorViewMode.set(mode);
  }

  // Inspector Header Bar Controls
  /**
   * The apply-to choices, with live counts. One list so the chooser, the label and the
   * disabled states cannot drift apart.
   */
  readonly scopeOptions = computed<{
    id: 'selected' | 'current' | 'all' | 'under_music' | 'under_selected_music';
    label: string;
    icon: string;
    count: number;
  }[]>(() => {
    const options: {
      id: 'selected' | 'current' | 'all' | 'under_music' | 'under_selected_music';
      label: string;
      icon: string;
      count: number;
    }[] = [
      {
        id: 'selected',
        label: `Selected clips (${this.explicitSelectionCount()})`,
        icon: '🎯',
        count: this.explicitSelectionCount(),
      },
      {
        id: 'current',
        label: 'Clip under the playhead',
        icon: '▶',
        count: this.currentScheduledClip() ? 1 : 0,
      },
    ];

    // Only worth offering when there is music to be under.
    if (this.clipsUnderMusic().length > 0) {
      options.push({
        id: 'under_music',
        label: `Clips under music (${this.clipsUnderMusic().length})`,
        icon: '🎵',
        count: this.clipsUnderMusic().length,
      });
    }
    if (this.selectedMusicTrackKey() && this.clipsUnderSelectedMusic().length > 0) {
      options.push({
        id: 'under_selected_music',
        label: `Clips under this music track (${this.clipsUnderSelectedMusic().length})`,
        icon: '🎶',
        count: this.clipsUnderSelectedMusic().length,
      });
    }

    options.push({
      id: 'all',
      label: `All clips (${this.included().length})`,
      icon: '☰',
      count: this.included().length,
    });

    return options;
  });

  readonly targetScopeLabel = computed<string>(() => {
    const scope = this.targetScope();
    const match = this.scopeOptions().find((o) => o.id === scope);
    return match?.label ?? `Selected clips (${this.explicitSelectionCount()})`;
  });

  /**
   * How many clips the user picked by hand, ignoring the scope. Distinct from
   * selectedClipsCount(), which reports whatever the CURRENT scope resolves to - using that
   * here would make the "Selected clips" option label report the size of a different scope.
   */
  readonly explicitSelectionCount = computed<number>(() => {
    const lib = this.selectedLibraryIds().size;
    if (lib > 0) return lib;
    const tl = this.selectedTimelineItemIds().size;
    if (tl > 0) return tl;
    return this.selectedClipId() || this.selectedTimelineItemId() ? 1 : 0;
  });

  setTargetScope(scope: 'selected' | 'current' | 'all' | 'under_music' | 'under_selected_music'): void {
    this.targetScope.set(scope);

    // Each scope makes its own clips the selection, so the timeline highlight and the
    // panel agree about what is being edited.
    if (scope === 'current') {
      const curr = this.currentScheduledClip();
      if (curr) {
        this.selectedLibraryIds.set(new Set([curr.clip.id]));
        this.selectedClipId.set(curr.clip.id);
      }
    } else if (scope === 'all') {
      const ids = this.included().map((r) => r.clip.id);
      this.selectedLibraryIds.set(new Set(ids));
      if (ids.length > 0) this.selectedClipId.set(ids[0]);
    } else if (scope === 'under_music' || scope === 'under_selected_music') {
      const clips = scope === 'under_music' ? this.clipsUnderMusic() : this.clipsUnderSelectedMusic();
      this.selectedLibraryIds.set(new Set(clips.map((c) => c.id)));
      if (clips.length > 0) this.selectedClipId.set(clips[0].id);
    }
    this.markDirty();
  }

  toggleScopeDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.scopeDropdownOpen.update((v) => !v);
    this.toolDropdownOpen.set(false);
  }

  toggleToolDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.toolDropdownOpen.update((v) => !v);
    this.scopeDropdownOpen.set(false);
  }

  selectScopeOption(scope: 'selected' | 'current' | 'all' | 'under_music' | 'under_selected_music'): void {
    this.setTargetScope(scope);
    this.scopeDropdownOpen.set(false);
  }

  setInspectorTab(tab: 'clip' | 'effects' | 'audio' | 'export' | 'color' | 'text' | 'transitions'): void {
    this.activeInspectorTab.set(tab as any);
    this.toolDropdownOpen.set(false);
  }

  getTargetClipIds(fallbackClipId?: string): string[] {
    const fallbackList = fallbackClipId ? [fallbackClipId] : [];
    const scope = this.targetScope();
    if (scope === 'all') {
      const allIds = this.included().map((r) => r.clip.id);
      return allIds.length > 0 ? allIds : fallbackList;
    }
    if (scope === 'under_music') {
      const musicClips = this.clipsUnderMusic().map((c) => c.id);
      return musicClips.length > 0 ? musicClips : fallbackList;
    }
    if (scope === 'under_selected_music') {
      const musicClips = this.clipsUnderSelectedMusic().map((c) => c.id);
      return musicClips.length > 0 ? musicClips : fallbackList;
    }
    if (scope === 'current') {
      const curr = this.currentScheduledClip();
      if (curr?.clip?.id) return [curr.clip.id];
      return fallbackList;
    }
    if (scope === 'selected') {
      const selIds = Array.from(this.selectedLibraryIds());
      if (selIds.length > 0) return selIds;
      const selId = this.selectedClipId();
      if (selId) return [selId];
      return fallbackList;
    }
    // 'auto' scope fallback: selected -> current -> all
    const selIds = Array.from(this.selectedLibraryIds());
    if (selIds.length > 0) return selIds;
    const selId = this.selectedClipId();
    if (selId) return [selId];
    return fallbackList;
  }

  // Framing, Crop & Pan Methods
  clipFramingSetting(clipId: string): { fit: 'Contain' | 'Cover'; zoom: number; panY: 'center' | 'top' | 'bottom' } {
    return this.clipFraming().get(clipId) ?? { fit: this.fit() === 'Cover' ? 'Cover' : 'Contain', zoom: 100, panY: 'center' };
  }

  setClipFramingFit(clipId: string, fit: 'Contain' | 'Cover'): void {
    const targetIds = this.getTargetClipIds(clipId);
    this.clipFraming.update((m) => {
      const next = new Map(m);
      for (const id of targetIds) {
        const current = this.clipFramingSetting(id);
        next.set(id, { ...current, fit });
      }
      return next;
    });
    this.markDirty();
  }

  setClipFramingZoom(clipId: string, zoom: number): void {
    const targetIds = this.getTargetClipIds(clipId);
    this.clipFraming.update((m) => {
      const next = new Map(m);
      for (const id of targetIds) {
        const current = this.clipFramingSetting(id);
        next.set(id, { ...current, zoom });
      }
      return next;
    });
    this.markDirty();
  }

  setClipFramingPan(clipId: string, panY: 'center' | 'top' | 'bottom'): void {
    const targetIds = this.getTargetClipIds(clipId);
    this.clipFraming.update((m) => {
      const next = new Map(m);
      for (const id of targetIds) {
        const current = this.clipFramingSetting(id);
        next.set(id, { ...current, panY });
      }
      return next;
    });
    this.markDirty();
  }

  // ── Transform & Crop Methods ────────────────────────────────────────────────

  /** Default transform values (all neutral). */
  readonly DEFAULT_TRANSFORM: Required<Pick<TimelineItemTransform,
    'scale' | 'x' | 'y' | 'opacity' | 'rotation' | 'cropLeft' | 'cropRight' | 'cropTop' | 'cropBottom' | 'cropLinked' | 'stabilization'
  >> = { scale: 1, x: 0, y: 0, opacity: 1, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0, cropLinked: false, stabilization: false };

  clipTransformSetting(clipId: string): Required<Pick<TimelineItemTransform,
    'scale' | 'x' | 'y' | 'opacity' | 'rotation' | 'cropLeft' | 'cropRight' | 'cropTop' | 'cropBottom' | 'cropLinked' | 'stabilization'
  >> {
    const t = this.clipTransforms()[clipId];
    return {
      scale: t?.scale ?? 1,
      x: t?.x ?? 0,
      y: t?.y ?? 0,
      opacity: t?.opacity ?? 1,
      rotation: t?.rotation ?? 0,
      cropLeft: t?.cropLeft ?? 0,
      cropRight: t?.cropRight ?? 0,
      cropTop: t?.cropTop ?? 0,
      cropBottom: t?.cropBottom ?? 0,
      cropLinked: t?.cropLinked ?? false,
      stabilization: t?.stabilization ?? false,
    };
  }

  /**
   * Returns transform values for the active scope.
   * When multiple clips in scope have differing values for a field, that field returns null
   * (displayed as '--' in inputs). Req 4: mixed-value scope handling.
   */
  readonly activeScopeTransformSetting = computed<{
    scale: number | null;
    x: number | null;
    y: number | null;
    rotation: number | null;
    cropLeft: number | null;
    cropRight: number | null;
    cropTop: number | null;
    cropBottom: number | null;
    cropLinked: boolean;
    stabilization: boolean;
  }>(() => {
    const selItem = this.selectedTimelineItem();
    if (selItem && (selItem.type === 'image' || selItem.trackId === 'IMG1' || selItem.trackId === 'IMG')) {
      const t = selItem.transform ?? { scale: 1, x: 0, y: 0, opacity: 1, transitionIn: 'fade', transitionInDuration: 0.5, transitionOut: 'fade', transitionOutDuration: 0.5 };
      return {
        scale: t.scale ?? 1,
        x: t.x ?? 0,
        y: t.y ?? 0,
        rotation: (t as any).rotation ?? 0,
        cropLeft: t.cropLeft ?? 0,
        cropRight: t.cropRight ?? 0,
        cropTop: t.cropTop ?? 0,
        cropBottom: t.cropBottom ?? 0,
        cropLinked: false,
        stabilization: false,
      };
    }
    const ids = this.getTargetClipIds();
    if (ids.length === 0) {
      const clip = this.activeTargetClip();
      if (clip) {
        const t = this.clipTransformSetting(clip.id);
        return { scale: t.scale, x: t.x, y: t.y, rotation: t.rotation, cropLeft: t.cropLeft, cropRight: t.cropRight, cropTop: t.cropTop, cropBottom: t.cropBottom, cropLinked: t.cropLinked, stabilization: t.stabilization };
      }
      return { scale: 1, x: 0, y: 0, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0, cropLinked: false, stabilization: false };
    }
    const transforms = ids.map((id) => this.clipTransformSetting(id));
    const first = transforms[0];
    const mixed = <K extends keyof typeof first>(key: K): typeof first[K] | null => {
      return transforms.every((t) => t[key] === first[key]) ? first[key] : null;
    };
    return {
      scale: mixed('scale') as number | null,
      x: mixed('x') as number | null,
      y: mixed('y') as number | null,
      rotation: mixed('rotation') as number | null,
      cropLeft: mixed('cropLeft') as number | null,
      cropRight: mixed('cropRight') as number | null,
      cropTop: mixed('cropTop') as number | null,
      cropBottom: mixed('cropBottom') as number | null,
      cropLinked: first.cropLinked,
      stabilization: first.stabilization,
    };
  });

  /** CSS clip-path for live crop preview in the monitor. */
  readonly activeClipClipPath = computed<string>(() => {
    const clip = this.currentScheduledClip()?.clip ?? this.activeTargetClip();
    if (!clip) return 'none';
    const t = this.clipTransformSetting(clip.id);
    if (t.cropLeft === 0 && t.cropRight === 0 && t.cropTop === 0 && t.cropBottom === 0) return 'none';
    return `inset(${t.cropTop}% ${t.cropRight}% ${t.cropBottom}% ${t.cropLeft}%)`;
  });

  private _setScopeTransformField(patch: Partial<TimelineItemTransform>, fallbackClipId?: string): void {
    const selItemId = this.selectedTimelineItemId();
    if (selItemId) {
      this.updateImageItemTransform(selItemId, patch);
      return;
    }
    const targetIds = this.getTargetClipIds(fallbackClipId);
    if (targetIds.length === 0) return;
    this.clipTransforms.update((rec) => {
      const next = { ...rec };
      for (const id of targetIds) {
        next[id] = { ...this.clipTransformSetting(id), ...patch };
      }
      return next;
    });
    this.markDirty();
  }

  setScopeTransformScale(scale: number): void {
    this._setScopeTransformField({ scale: Math.max(0.05, Math.min(5, scale)) });
  }

  setScopeTransformPositionX(x: number): void {
    this._setScopeTransformField({ x: Math.max(-50, Math.min(50, x)) });
  }

  setScopeTransformPositionY(y: number): void {
    this._setScopeTransformField({ y: Math.max(-50, Math.min(50, y)) });
  }

  setScopeTransformRotation(deg: number): void {
    this._setScopeTransformField({ rotation: deg });
  }

  resetScopeTransformRotation(): void {
    this._setScopeTransformField({ rotation: 0 });
  }

  setScopeTransformTransitionIn(trans: any): void {
    this._setScopeTransformField({ transitionIn: trans });
  }

  setScopeTransformTransitionInDuration(dur: number): void {
    this._setScopeTransformField({ transitionInDuration: dur });
  }

  setScopeTransformTransitionOut(trans: any): void {
    this._setScopeTransformField({ transitionOut: trans });
  }

  setScopeTransformTransitionOutDuration(dur: number): void {
    this._setScopeTransformField({ transitionOutDuration: dur });
  }

  /**
   * Set a single crop edge with clamping + linked math.
   * Req 1: cropLeft + cropRight < 99, cropTop + cropBottom < 99.
   * When cropLinked, all four edges are set to the same value.
   */
  setScopeCrop(edge: 'left' | 'right' | 'top' | 'bottom', val: number): void {
    const clamped = Math.max(0, Math.min(98, val));
    const targetIds = this.getTargetClipIds();
    if (targetIds.length === 0) return;
    this.clipTransforms.update((rec) => {
      const next = { ...rec };
      for (const id of targetIds) {
        const t = this.clipTransformSetting(id);
        if (t.cropLinked) {
          // Linked: all four edges equal; total cannot reach 99 (each = val <= 49, so left+right <= 98 < 99)
          const v = Math.max(0, Math.min(49, clamped));
          next[id] = { ...t, cropLeft: v, cropRight: v, cropTop: v, cropBottom: v };
        } else {
          // Per-edge clamping so opposite edges sum to strictly < 99
          let newLeft = t.cropLeft ?? 0;
          let newRight = t.cropRight ?? 0;
          let newTop = t.cropTop ?? 0;
          let newBottom = t.cropBottom ?? 0;
          if (edge === 'left') {
            const maxL = Math.max(0, 98 - newRight);
            newLeft = Math.max(0, Math.min(maxL, clamped));
          } else if (edge === 'right') {
            const maxR = Math.max(0, 98 - newLeft);
            newRight = Math.max(0, Math.min(maxR, clamped));
          } else if (edge === 'top') {
            const maxT = Math.max(0, 98 - newBottom);
            newTop = Math.max(0, Math.min(maxT, clamped));
          } else {
            const maxB = Math.max(0, 98 - newTop);
            newBottom = Math.max(0, Math.min(maxB, clamped));
          }
          next[id] = { ...t, cropLeft: newLeft, cropRight: newRight, cropTop: newTop, cropBottom: newBottom };
        }
      }
      return next;
    });
    this.markDirty();
  }

  toggleScopeCropLinked(): void {
    const targetIds = this.getTargetClipIds();
    if (targetIds.length === 0) return;
    this.clipTransforms.update((rec) => {
      const next = { ...rec };
      const first = this.clipTransformSetting(targetIds[0]);
      const newLinked = !first.cropLinked;
      for (const id of targetIds) {
        next[id] = { ...this.clipTransformSetting(id), cropLinked: newLinked };
      }
      return next;
    });
    this.markDirty();
  }

  toggleScopeStabilization(): void {
    const targetIds = this.getTargetClipIds();
    if (targetIds.length === 0) return;
    this.clipTransforms.update((rec) => {
      const next = { ...rec };
      const first = this.clipTransformSetting(targetIds[0]);
      const newStab = !first.stabilization;
      for (const id of targetIds) {
        next[id] = { ...this.clipTransformSetting(id), stabilization: newStab };
      }
      return next;
    });
    this.markDirty();
  }

  /** Req 6: Reset all transform fields to defaults for the active scope. */
  resetScopeTransform(): void {
    this._setScopeTransformField({ scale: 1, x: 0, y: 0, rotation: 0, opacity: 1 });
  }

  /** Req 6: Reset all crop edges to 0 for the active scope. */
  resetScopeCrop(): void {
    this._setScopeTransformField({ cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 });
  }



  setImageClipDuration(clipId: string, seconds: number): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.clip.id === clipId ? { ...r, clip: { ...r.clip, durationSeconds: seconds } } : r))
    );
    this.markDirty();
  }

  // Color Grading & Effects Methods
  setScopeFilter(filterId: string): void {
    if (this.targetScope() === 'all') {
      this.activeFilter.set(filterId);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, { ...current, filter: filterId });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeBrightness(brightness: number): void {
    if (this.targetScope() === 'all') {
      this.filterBrightness.set(brightness);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, { ...current, brightness });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeContrast(contrast: number): void {
    if (this.targetScope() === 'all') {
      this.filterContrast.set(contrast);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, { ...current, contrast });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeSaturation(saturation: number): void {
    if (this.targetScope() === 'all') {
      this.filterSaturation.set(saturation);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, { ...current, saturation });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeSepia(sepia: number): void {
    if (this.targetScope() === 'all') {
      this.filterSepia.set(sepia);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, { ...current, sepia });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeBlur(blur: number): void {
    if (this.targetScope() === 'all') {
      this.filterBlur.set(blur);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, { ...current, blur });
        }
        return next;
      });
    }
    this.markDirty();
  }

  resetScopeColorGrading(): void {
    if (this.targetScope() === 'all') {
      this.activeFilter.set('none');
      this.filterBrightness.set(100);
      this.filterContrast.set(100);
      this.filterSaturation.set(100);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, {
            ...current,
            filter: 'none',
            brightness: 100,
            contrast: 100,
            saturation: 100,
          });
        }
        return next;
      });
    }
    this.markDirty();
  }

  resetScopeEffects(): void {
    if (this.targetScope() === 'all') {
      this.filterSepia.set(0);
      this.filterBlur.set(0);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipColor.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipColorSetting(id);
          next.set(id, {
            ...current,
            sepia: 0,
            blur: 0,
          });
        }
        return next;
      });
    }
    this.markDirty();
  }

  // Lower-Third Text Methods
  setScopeTextEnabled(enabled: boolean): void {
    if (this.targetScope() === 'all') {
      this.lowerThirdEnabled.set(enabled);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipText.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipTextSetting(id);
          next.set(id, { ...current, enabled });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeTextTitle(title: string): void {
    if (this.targetScope() === 'all') {
      this.lowerThirdTitle.set(title);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipText.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipTextSetting(id);
          next.set(id, { ...current, title });
        }
        return next;
      });
    }
    this.markDirty();
  }

  setScopeTextSubtitle(subtitle: string): void {
    if (this.targetScope() === 'all') {
      this.lowerThirdSubtitle.set(subtitle);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipText.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          const current = this.clipTextSetting(id);
          next.set(id, { ...current, subtitle });
        }
        return next;
      });
    }
    this.markDirty();
  }

  applyScopeTextTemplate(title: string, subtitle: string): void {
    if (this.targetScope() === 'all') {
      this.lowerThirdEnabled.set(true);
      this.lowerThirdTitle.set(title);
      this.lowerThirdSubtitle.set(subtitle);
    }
    const targetIds = this.getTargetClipIds();
    if (targetIds.length > 0) {
      this.clipText.update((m) => {
        const next = new Map(m);
        for (const id of targetIds) {
          next.set(id, { enabled: true, title, subtitle });
        }
        return next;
      });
    }
    this.markDirty();
  }

  // Timeline Operations

  /** Opens the Split dialog at the current playhead position rather than splitting immediately. */
  splitClipAtPlayhead(): void {
    const t = this.currentTime();
    const sched = this.clipSchedule();
    const hit = sched.find((c) => t > c.startSeconds + 0.05 && t < c.endSeconds - 0.05);
    if (!hit) {
      this.status.notify(['No clip under playhead to split.']);
      return;
    }
    // Open the dialog; nothing is changed until Confirm.
    this.splitPromptSeconds.set(t);
    this.splitPrompt.set({
      clip: hit.clip,
      clipStart: hit.startSeconds,
      clipEnd: hit.endSeconds,
    });
  }

  /**
   * Executes the split at `splitTimeSeconds` (a TIMELINE time, not clip-local).
   * Called by `confirmSplitPrompt()`; reused verbatim so Confirm produces exactly what
   * the old instant-split produced for the same time — no divergence between dialog and
   * direct invocation.
   */
  private performSplitAt(origClip: Clip, splitTimeSeconds: number): void {
    const sched = this.clipSchedule();
    const hit = sched.find((c) => c.clip.id === origClip.id);
    if (!hit) return;

    const splitOffset = splitTimeSeconds - hit.startSeconds;
    const realAssetId = this.resolveAssetId(origClip);
    const origTrimStart = origClip.trimStartSeconds ?? 0;
    const origDur = origClip.durationSeconds ?? (origClip.trimEndSeconds ? origClip.trimEndSeconds - origTrimStart : 5.0);

    const baseName = origClip.name.replace(/ \(Part \d+\)$/, '');
    const ts = Date.now();

    const clipA: Clip = {
      ...origClip,
      id: `${realAssetId}_part_${ts}_1`,
      assetId: realAssetId,
      name: `${baseName} (Part 1)`,
      durationSeconds: splitOffset,
      trimStartSeconds: origTrimStart,
      trimEndSeconds: origTrimStart + splitOffset,
    };
    const clipB: Clip = {
      ...origClip,
      id: `${realAssetId}_part_${ts}_2`,
      assetId: realAssetId,
      name: `${baseName} (Part 2)`,
      durationSeconds: origDur - splitOffset,
      trimStartSeconds: origTrimStart + splitOffset,
      trimEndSeconds: origTrimStart + origDur,
    };

    const rows = [...this.rows()];
    const rowIdx = rows.findIndex((r) => r.clip.id === origClip.id);
    if (rowIdx >= 0) {
      rows.splice(rowIdx, 1, { clip: clipA, included: true }, { clip: clipB, included: true });
      this.rows.set(rows);

      // Copy custom transform, color, and sound settings to both clips
      const transforms = { ...this.clipTransforms() };
      if (transforms[origClip.id]) {
        transforms[clipA.id] = { ...transforms[origClip.id] };
        transforms[clipB.id] = { ...transforms[origClip.id] };
        this.clipTransforms.set(transforms);
      }
      const colors = { ...this.clipColors() };
      if (colors[origClip.id]) {
        colors[clipA.id] = { ...colors[origClip.id] };
        colors[clipB.id] = { ...colors[origClip.id] };
        this.clipColors.set(colors);
      }
      const sounds = { ...this.clipSounds() };
      if (sounds[origClip.id]) {
        sounds[clipA.id] = { ...sounds[origClip.id] };
        sounds[clipB.id] = { ...sounds[origClip.id] };
        this.clipSounds.set(sounds);
      }

      // Ensure the seam between Part 1 and Part 2 has no transition (razor split)
      const overrides = new Map(this.junctionOverrides());
      overrides.set(this.junctionKey(clipA.id, clipB.id), { transition: 'None', seconds: 0 });
      this.junctionOverrides.set(overrides);

      this.selectedTimelineClipIndex.set(hit.index + 1);
      this.selectedClipId.set(clipB.id);
      this.markDirty();
      this.saveOrder();
      this.status.notify(['Split clip into two parts.']);
    }
  }

  /**
   * Trims the clip at splitTimeSeconds, keeping only Part 1 (trimming tail) or Part 2 (trimming head).
   */
  private performSplitTrimAt(origClip: Clip, splitTimeSeconds: number, partToKeep: 1 | 2): void {
    const sched = this.clipSchedule();
    const hit = sched.find((c) => c.clip.id === origClip.id);
    if (!hit) return;

    const splitOffset = splitTimeSeconds - hit.startSeconds;
    const origTrimStart = origClip.trimStartSeconds ?? 0;
    const origDur = origClip.durationSeconds ?? (origClip.trimEndSeconds ? origClip.trimEndSeconds - origTrimStart : 5.0);

    const rows = [...this.rows()];
    const rowIdx = rows.findIndex((r) => r.clip.id === origClip.id);
    if (rowIdx < 0) return;

    let updatedClip: Clip;
    if (partToKeep === 1) {
      // Keep Part 1 only (discard everything after split point)
      updatedClip = {
        ...origClip,
        durationSeconds: splitOffset,
        trimStartSeconds: origTrimStart,
        trimEndSeconds: origTrimStart + splitOffset,
      };
      this.status.notify([`Trimmed clip "${origClip.name}" — kept Part 1 (${splitOffset.toFixed(2)}s).`]);
    } else {
      // Keep Part 2 only (discard everything before split point)
      const remainingDur = origDur - splitOffset;
      updatedClip = {
        ...origClip,
        durationSeconds: remainingDur,
        trimStartSeconds: origTrimStart + splitOffset,
        trimEndSeconds: origTrimStart + origDur,
      };
      this.status.notify([`Trimmed clip "${origClip.name}" — kept Part 2 (${remainingDur.toFixed(2)}s).`]);
    }

    rows[rowIdx] = { ...rows[rowIdx], clip: updatedClip };
    this.rows.set(rows);
    this.selectedTimelineClipIndex.set(hit.index);
    this.selectedClipId.set(updatedClip.id);
    this.markDirty();
    this.saveOrder();
  }

  isClipSplit(clip: Clip): boolean {
    return clip.name.includes('(Part ') || clip.id.includes('_part_');
  }

  getClipPartBadge(clip: Clip): string | null {
    const match = clip.name.match(/\(Part (\d+)\)$/);
    if (match) return `Part ${match[1]}`;
    if (clip.id.includes('_part_')) return 'Split';
    return null;
  }


  updateItem(id: string, patch: Partial<TimelineItem>): void {
    this.timelineItems.update((items) =>
      items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
    this.markDirty();
  }

  zoom(delta: number): void {
    this.setZoom(this.pxPerSecond() + delta);
  }

  setZoom(val: number): void {
    this.pxPerSecond.set(Math.max(2, Math.min(val, 200)));
  }

  fitTimelineToScreen(containerWidth: number): void {
    const total = this.timelineSeconds();
    if (total <= 0 || containerWidth <= 150) return;
    const targetPx = Math.max(2, (containerWidth - 104 - 36) / total);
    this.setZoom(targetPx);
  }

  itemsForTrack(trackId: string): TimelineItem[] {
    if (trackId === 'V2' || trackId === 'V3') {
      return this.timelineItems().filter(
        (item) => item.trackId === 'V2' || item.trackId === 'V3'
      );
    }
    if (trackId === 'IMG1' || trackId === 'IMG') {
      return this.timelineItems().filter(
        (item) => item.trackId === 'IMG1' || item.trackId === 'IMG'
      );
    }
    if (trackId === 'A1' || trackId === 'A2') {
      return this.timelineItems().filter(
        (item) => item.trackId === 'A1' || item.trackId === 'A2'
      );
    }
    return this.timelineItems().filter((item) => item.trackId === trackId);
  }

  formatRulerTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  toggleTrackLock(trackId: string): void {
    this.timelineTracks.update((tracks) =>
      tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t))
    );
  }

  isTrackLocked(trackId: string): boolean {
    return this.timelineTracks().find((t) => t.id === trackId)?.locked ?? false;
  }

  toggleTrackVisibility(trackId: string): void {
    this.timelineTracks.update((tracks) =>
      tracks.map((t) => {
        if (t.id !== trackId) return t;
        if (t.kind === 'audio') {
          const nextMuted = !t.muted;
          return { ...t, muted: nextMuted };
        }
        return { ...t, visible: !t.visible };
      })
    );
  }

  isTrackVisible(trackId: string): boolean {
    const t = this.timelineTracks().find((tr) => tr.id === trackId);
    if (!t) return true;
    return t.kind === 'audio' ? !t.muted : t.visible;
  }

  selectClipsUnderMusic(): void {
    const clips = this.clipsUnderMusic();
    if (clips.length === 0) {
      this.status.notify(['No video clips currently overlap with background music.']);
      return;
    }
    const ids = new Set(clips.map((c) => c.id));
    this.selectedLibraryIds.set(ids);
    this.selectedClipId.set(clips[0].id);
    this.setTargetScope('under_music');
    this.status.notify([`Selected ${clips.length} clip(s) under background music.`]);
  }

  onTimelineAudioClicked(): void {
    this.clearAllSelections();
    this.setTargetScope('selected');
    this.setInspectorTab('audio');
    this.setAudioInspectorView('clip');
    const tracks = this.musicTracks();
    if (tracks.length > 0) {
      const current = this.selectedMusicTrackKey();
      if (!current || !tracks.some((t) => t.key === current)) {
        this.selectedMusicTrackKey.set(tracks[0].key);
      }
    }
  }

  selectMusicTrack(key: string): void {
    this.clearVideoAndItemSelections();
    this.selectedMusicTrackKey.set(key);
    this.setTargetScope('selected');
    this.setInspectorTab('audio');
    this.setAudioInspectorView('clip');
  }

  selectClipsUnderSelectedMusic(): void {
    const track = this.selectedMusicTrack();
    const name = track ? this.musicTrackName(track) : 'Music Track';
    const clips = this.clipsUnderSelectedMusic();
    this.clearVideoAndItemSelections();
    this.selectedMusicTrackKey.set(null);
    this.setTargetScope('under_selected_music');
    this.selectedLibraryIds.set(new Set(clips.map((c) => c.id)));
    if (clips.length > 0) {
      this.selectedClipId.set(clips[0].id);
    }
    this.setInspectorTab('audio');
    this.setAudioInspectorView('clip');
    this.status.notify([`Selected ${clips.length} clip(s) under "${name}".`]);
  }

  blockWidthPx(clip: Clip): number {
    const dur = clip.durationSeconds ?? 5.0;
    return this.secondsToPx(dur);
  }

  selectAndSeekClip(clip: Clip): void {
    this.selectClip(clip.id);
    const sched = this.clipSchedule().find((s) => s.clip.id === clip.id);
    if (sched) this.seekTo(sched.startSeconds);
  }

  addTextOverlay(text?: string, startTime?: number): void {
    this.showTrackManually('TXT1');
    const content = text || 'Subtitle Text';
    const start = startTime !== undefined ? Math.max(0, startTime) : this.currentTime();
    
    // Auto-fit check: if situated on a clip, adapt compact duration
    let dur = 3.5;
    const currentClip = this.clipSchedule().find(
      (s) => start >= s.startSeconds && start < s.endSeconds
    );
    if (currentClip) {
      const remaining = currentClip.endSeconds - start;
      if (remaining >= 1.0) {
        dur = Math.min(remaining, 4.0);
      }
    }
    const validStart = this.clampItemCollision('TXT1', start, dur);
    const newItem: TimelineItem = {
      id: `txt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'text',
      trackId: 'TXT1',
      startTime: validStart,
      duration: dur,
      src: content,
      name: 'Text Overlay',
      textStyle: {
        fontSize: 28,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        position: 'bottom',
        transitionIn: 'fade',
        transitionInDuration: 0.5,
        transitionOut: 'fade',
        transitionOutDuration: 0.5,
      },
    };
    this.timelineItems.update((items) => [...items, newItem]);
    this.selectedTimelineItemId.set(newItem.id);
    this.selectedTimelineItemIds.set(new Set([newItem.id]));
    this.selectedClipId.set(null);
    this.selectedTimelineClipIndex.set(null);
    this.activeInspectorTab.set('text');
    this.seekTo(validStart);
    this.markDirty();
    this.status.notify(['Added text overlay to TXT1.']);
  }

  onTextToolbarClicked(): void {
    this.showTrackManually('TXT1');
    this.activeInspectorTab.set('text');
    const curTime = this.currentTime();
    const items = this.itemsForTrack('TXT1');
    if (items.length === 0) {
      this.addTextOverlay('Subtitle Text', curTime);
      return;
    }
    const currentItem = items.find((it) => curTime >= it.startTime && curTime < (it.startTime + it.duration));
    if (currentItem) {
      this.selectTimelineItem(currentItem.id);
    } else if (!this.selectedTimelineItemId()) {
      this.selectTimelineItem(items[0].id);
    }
  }

  removeTimelineItem(itemId: string): void {
    this.timelineItems.update((items) => items.filter((i) => i.id !== itemId));
    if (this.selectedTimelineItemId() === itemId) {
      this.selectedTimelineItemId.set(null);
    }
    this.selectedTimelineItemIds.update((set) => {
      const next = new Set(set);
      next.delete(itemId);
      return next;
    });
    this.markDirty();
    this.status.notify(['Removed timeline item.']);
  }

  updateTextItemContent(itemId: string, content: string): void {
    this.timelineItems.update((items) =>
      items.map((it) => (it.id === itemId ? { ...it, src: content } : it))
    );
    this.markDirty();
  }

  updateTextItemStyle(itemId: string, styleUpdates: Partial<TimelineItemTextStyle>): void {
    this.timelineItems.update((items) =>
      items.map((it) => {
        if (it.id !== itemId) return it;
        const currentStyle = it.textStyle ?? {
          fontSize: 28,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.6)',
          position: 'bottom',
          transitionIn: 'fade',
          transitionInDuration: 0.5,
          transitionOut: 'fade',
          transitionOutDuration: 0.5,
        };
        return {
          ...it,
          textStyle: {
            ...currentStyle,
            ...styleUpdates,
          },
        };
      })
    );
    this.markDirty();
  }

  updateImageItemTransform(itemId: string, updates: Partial<TimelineItemTransform>): void {
    this.timelineItems.update((items) =>
      items.map((it) => {
        if (it.id !== itemId) return it;
        const curTransform = it.transform ?? {
          scale: 1.0,
          x: 0,
          y: 0,
          opacity: 1.0,
          transitionIn: 'fade',
          transitionInDuration: 0.5,
          transitionOut: 'fade',
          transitionOutDuration: 0.5,
        };
        return {
          ...it,
          transform: {
            ...curTransform,
            ...updates,
          },
        };
      })
    );
    this.markDirty();
  }

  selectTimelineItem(itemId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedMusicTrackKey.set(null);
    this.selectedTimelineItemId.set(itemId);
    const mouseEv = event as MouseEvent | undefined;
    const isMulti = !!(mouseEv?.ctrlKey || mouseEv?.metaKey || mouseEv?.shiftKey);

    if (isMulti) {
      this.selectedTimelineItemIds.update((set) => {
        const next = new Set(set);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
      const currentSet = this.selectedTimelineItemIds();
      if (currentSet.has(itemId)) {
        this.selectedTimelineItemId.set(itemId);
      } else if (currentSet.size > 0) {
        this.selectedTimelineItemId.set(Array.from(currentSet)[0]);
      } else {
        this.selectedTimelineItemId.set(null);
      }
    } else {
      this.selectedTimelineItemId.set(itemId);
      this.selectedTimelineItemIds.set(new Set([itemId]));
      this.selectedClipId.set(null);
      this.selectedTimelineClipIndex.set(null);
      this.targetScope.set('selected');
      const item = this.timelineItems().find((it) => it.id === itemId);
      if (item && item.type === 'audio') {
        this.setInspectorTab('audio');
        this.setAudioInspectorView('clip');
      } else if (item && item.type === 'text') {
        this.setInspectorTab('text');
      } else if (item && item.type === 'image') {
        this.setInspectorTab('clip');
      }
    }
  }

  fitTextOverlayToClip(itemId: string): void {
    const item = this.timelineItems().find((it) => it.id === itemId);
    if (!item) return;
    const curTime = this.currentTime();
    const sched = this.clipSchedule();
    let targetClip = sched.find((s) => item.startTime >= s.startSeconds && item.startTime < s.endSeconds);
    if (!targetClip) {
      targetClip = sched.find((s) => curTime >= s.startSeconds && curTime < s.endSeconds);
    }
    if (!targetClip && sched.length > 0) {
      targetClip = sched.reduce((prev, curr) =>
        Math.abs(curr.startSeconds - item.startTime) < Math.abs(prev.startSeconds - item.startTime) ? curr : prev
      );
    }
    if (targetClip) {
      const newStart = targetClip.startSeconds;
      const newDur = Math.max(0.5, targetClip.endSeconds - targetClip.startSeconds);
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === itemId ? { ...it, startTime: newStart, duration: newDur } : it))
      );
      this.markDirty();
      this.status.notify([`Fitted text overlay to clip "${targetClip.clip.name}" (${newDur.toFixed(1)}s).`]);
    }
  }

  fitTextOverlayToAudio(itemId: string): void {
    const item = this.timelineItems().find((it) => it.id === itemId);
    if (!item) return;
    const music = this.musicTracks();
    let target = music.find((m) => item.startTime >= m.startSeconds && item.startTime < (m.startSeconds + (m.trimEndSeconds ?? 10)));
    if (!target && music.length > 0) target = music[0];
    if (target) {
      const dur = target.trimEndSeconds ? Math.max(0.5, target.trimEndSeconds - (target.trimStartSeconds ?? 0)) : 10;
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === itemId ? { ...it, startTime: target.startSeconds, duration: dur } : it))
      );
      this.markDirty();
      this.status.notify([`Fitted text overlay to audio track (${dur.toFixed(1)}s).`]);
    }
  }

  fitTextOverlayToTimeline(itemId: string): void {
    const item = this.timelineItems().find((it) => it.id === itemId);
    if (!item) return;
    const total = this.totalSeconds() || this.timelineSeconds();
    if (total > 0) {
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === itemId ? { ...it, startTime: 0, duration: total } : it))
      );
      this.markDirty();
      this.status.notify([`Fitted text overlay to entire timeline (${total.toFixed(1)}s).`]);
    }
  }

  setTextOverlayDuration(itemId: string, duration: number): void {
    const item = this.timelineItems().find((it) => it.id === itemId);
    if (!item) return;
    const safeDur = Math.max(0.5, duration);
    this.timelineItems.update((items) =>
      items.map((it) => (it.id === itemId ? { ...it, duration: safeDur } : it))
    );
    this.markDirty();
    this.status.notify([`Updated text overlay duration to ${safeDur.toFixed(1)}s.`]);
  }

  clipTrim(clipId: string): { startSeconds: number; endSeconds: number } | undefined {
    return this.clipTrims().get(clipId);
  }

  clipSoundAsset(clipId: string) {
    const sound = this.clipSound(clipId);
    if (!sound.audioAssetId) return null;
    return this.studio()?.musicCandidates?.find((m) => m.id === sound.audioAssetId) ?? null;
  }

  clipSoundRunOffset(clipId: string): { startOffset: number; endOffset: number } {
    const sound = this.clipSound(clipId);
    const asset = this.clipSoundAsset(clipId);
    const assetDur = asset?.durationSeconds ?? 5;
    const start = sound.audioTrimStartSeconds ?? 0;
    const end = sound.audioTrimEndSeconds ?? assetDur;
    return { startOffset: start, endOffset: end };
  }

  musicTrackName(track: MusicTrackRow): string {
    return this.musicTrackAsset(track)?.name || 'Music Track';
  }

  musicTrackAsset(track: MusicTrackRow) {
    return this.studio()?.musicCandidates?.find((m) => m.id === track.assetId) ?? null;
  }

  musicTrackDurationSeconds(track: MusicTrackRow): number {
    const total = this.musicTrackAsset(track)?.durationSeconds ?? 6;
    const start = track.trimStartSeconds ?? 0;
    const end = track.trimEndSeconds ?? total;
    return Math.max(end - start, 0.25);
  }

  removeMusicTrack(key: string): void {
    this.musicTracks.update((tracks) => tracks.filter((t) => t.key !== key));
    if (this.selectedMusicTrackKey() === key) {
      const remaining = this.musicTracks();
      this.selectedMusicTrackKey.set(remaining.length > 0 ? remaining[0].key : null);
    }
    this.markDirty();
    this.status.notify(['Music track removed from timeline.']);
  }

  setMusicTrackVolume(key: string, volume: number): void {
    const clamped = Math.max(0, Math.min(2.0, volume));
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, volume: clamped } : t))
    );
    this.markDirty();
  }

  toggleMusicTrackMute(key: string): void {
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, muted: !t.muted } : t))
    );
    this.markDirty();
  }

  setMusicTrackStart(key: string, startSeconds: number): void {
    const clamped = Math.max(0, Number(startSeconds) || 0);
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, startSeconds: clamped } : t))
    );
    this.markDirty();
  }

  setMusicTrackTrimStart(key: string, trimStart: number): void {
    const track = this.musicTracks().find((t) => t.key === key);
    if (!track) return;
    const total = this.musicTrackAsset(track)?.durationSeconds ?? 3600;
    const end = track.trimEndSeconds ?? total;
    const clamped = Math.max(0, Math.min(Number(trimStart) || 0, end - 0.25));
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, trimStartSeconds: clamped } : t))
    );
    this.markDirty();
  }

  setMusicTrackTrimEnd(key: string, trimEnd: number): void {
    const track = this.musicTracks().find((t) => t.key === key);
    if (!track) return;
    const total = this.musicTrackAsset(track)?.durationSeconds ?? 3600;
    const start = track.trimStartSeconds ?? 0;
    const clamped = Math.min(total, Math.max(Number(trimEnd) || total, start + 0.25));
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, trimEndSeconds: clamped } : t))
    );
    this.markDirty();
  }

  setMusicTrackFadeIn(key: string, seconds: number): void {
    const clamped = Math.max(0, Number(seconds) || 0);
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, fadeInSeconds: clamped } : t))
    );
    this.markDirty();
  }

  setMusicTrackFadeOut(key: string, seconds: number): void {
    const clamped = Math.max(0, Number(seconds) || 0);
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, fadeOutSeconds: clamped } : t))
    );
    this.markDirty();
  }

  setMusicTrackAsset(key: string, newAssetId: string): void {
    const cand = this.studio()?.musicCandidates?.find((m) => m.id === newAssetId);
    const dur = cand?.durationSeconds ?? 10.0;
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? {
        ...t,
        assetId: newAssetId,
        trimStartSeconds: 0,
        trimEndSeconds: dur
      } : t))
    );
    this.markDirty();
    this.status.notify([`Swapped audio to ${cand?.name || 'new asset'}`]);
  }

  duplicateMusicTrack(key: string): void {
    const track = this.musicTracks().find((t) => t.key === key);
    if (!track) return;
    const dur = this.musicTrackDurationSeconds(track);
    const newKey = `music_${Date.now()}`;
    const newTrack: MusicTrackRow = {
      ...track,
      key: newKey,
      startSeconds: Number((track.startSeconds + dur + 0.5).toFixed(2)),
    };
    this.musicTracks.update((tracks) => [...tracks, newTrack]);
    this.selectedMusicTrackKey.set(newKey);
    this.markDirty();
    this.status.notify([`Duplicated music track at ${newTrack.startSeconds.toFixed(1)}s.`]);
  }

  seekToMusicTrack(key: string): void {
    const track = this.musicTracks().find((t) => t.key === key);
    if (track) {
      this.seekTo(track.startSeconds);
    }
  }

  clampItemCollision(trackId: string, startTime: number, duration: number, excludeItemId?: string): number {
    const minStart = Math.max(0, startTime);
    const minDur = Math.max(0.5, duration);
    const siblings = this.timelineItems()
      .filter((i) => i.trackId === trackId && i.id !== excludeItemId)
      .sort((a, b) => a.startTime - b.startTime);

    let clampedStart = minStart;
    for (const sib of siblings) {
      const sibStart = sib.startTime;
      const sibEnd = sib.startTime + sib.duration;
      if (clampedStart < sibEnd && (clampedStart + minDur) > sibStart) {
        clampedStart = sibEnd;
      }
    }
    return clampedStart;
  }

  applySnap(targetTime: number): number {
    const threshold = 0.2;
    const candidates: number[] = [0, this.currentTime()];

    for (const s of this.clipSchedule()) {
      candidates.push(s.startSeconds, s.endSeconds);
    }
    for (const it of this.timelineItems()) {
      candidates.push(it.startTime, it.startTime + it.duration);
    }
    for (const tick of this.rulerTicks()) {
      candidates.push(tick);
    }

    let bestSnap: number | null = null;
    let minDiff = threshold;

    for (const c of candidates) {
      const diff = Math.abs(targetTime - c);
      if (diff < minDiff) {
        minDiff = diff;
        bestSnap = c;
      }
    }

    if (bestSnap !== null) {
      this.snapLineLeftPx.set(this.secondsToPx(bestSnap));
      return bestSnap;
    }
    this.snapLineLeftPx.set(null);
    return targetTime;
  }


  addAssetToTrack(trackId: string, row: ClipRow, dropTime = 0): void {
    const track = this.timelineTracks().find((t) => t.id === trackId);
    if (!track || track.locked) {
      if (track?.locked) this.status.notify([`Track ${track.name} is locked.`]);
      return;
    }

    const detected = this.getClipType(row.clip);
    let assetType: TimelineItemType = detected === 'image' ? 'image' : (detected === 'audio' ? 'audio' : 'video');
    const assetName = row.clip.name;
    const defaultDuration = row.clip.durationSeconds ?? 5.0;

    let targetTrackId = trackId;
    if (trackId === 'TXT1') {
      this.status.notify(['Use the Text tab or "+ Text" button to place subtitle/text overlays on TXT1.']);
      return;
    }

    if (trackId === 'V2' || trackId === 'V3') {
      if (assetType === 'audio') {
        this.status.notify(['Audio clips belong on the Audio track (A1).']);
        return;
      }
      targetTrackId = 'V2';
    } else if (trackId === 'IMG1' || trackId === 'IMG') {
      if (assetType !== 'image') {
        if (assetType === 'video') {
          this.addClipToTimeline(row.clip.id);
          this.status.notify(['Videos belong on the V1 or V2 video tracks. Added to V1.']);
          return;
        } else {
          this.status.notify(['Only image overlays can be placed on Image track (IMG1).']);
          return;
        }
      }
      targetTrackId = 'IMG1';
    }

    if (trackId === 'A1' || trackId === 'A2') {
      if (assetType !== 'audio') {
        if (assetType === 'image') {
          targetTrackId = 'IMG1';
          this.status.notify(['Images belong on the Image track. Placed overlay on IMG1.']);
        } else if (assetType === 'video') {
          this.addClipToTimeline(row.clip.id);
          this.status.notify(['Videos belong on the V1 video track. Added to V1.']);
          return;
        } else {
          this.status.notify(['Only audio clips can be placed on audio lanes.']);
          return;
        }
      } else {
        this.addMusicTrackFromAsset(row.clip.id, dropTime);
        this.status.notify([`Added audio "${assetName}" to A1 at ${dropTime.toFixed(1)}s.`]);
        return;
      }
    }

    if (trackId === 'V1') {
      if (assetType === 'audio') {
        this.addMusicTrackFromAsset(row.clip.id);
        this.status.notify(['Audio belongs on audio tracks. Added to audio track.']);
        return;
      } else if (assetType === 'image') {
        targetTrackId = 'IMG1';
        this.status.notify(['Images belong on the Image track (IMG). Placed on IMG track.']);
      } else {
        this.addClipToTimeline(row.clip.id);
        return;
      }
    }

    const validStart = this.clampItemCollision(targetTrackId, dropTime, defaultDuration);
    const newItemId = `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const newItem: TimelineItem = {
      id: newItemId,
      type: assetType,
      trackId: targetTrackId,
      startTime: validStart,
      duration: defaultDuration,
      src: row.clip.id,
      name: assetName,
      transform: assetType === 'image' || assetType === 'video' ? {
        scale: 1.0,
        x: 0,
        y: 0,
        opacity: 1.0,
        transitionIn: 'fade',
        transitionInDuration: 0.5,
        transitionOut: 'fade',
        transitionOutDuration: 0.5,
      } : undefined,
      volume: assetType === 'audio' ? 0.5 : undefined,
    };

    this.timelineItems.update((items) => [...items, newItem]);
    this.selectedTimelineItemId.set(newItemId);
    this.selectedTimelineItemIds.set(new Set([newItemId]));
    this.selectedClipId.set(null);
    this.selectedTimelineClipIndex.set(null);
    this.showTrackManually(targetTrackId);
    this.markDirty();
    this.status.notify([`Added ${assetName} to ${targetTrackId} at ${validStart.toFixed(1)}s.`]);
  }

  // Transitions & Junctions
  toggleJunctionEditor(key: string): void {
    this.selectedJunctionKey.set(key);
    this.openJunctionKey.set(null);
    this.setInspectorTab('transitions');
  }

  selectJunction(key: string | null): void {
    this.selectedJunctionKey.set(key);
    this.openJunctionKey.set(null);
  }

  openTransitionDialog(key?: string): void {
    if (key) {
      this.selectedJunctionKey.set(key);
      this.openJunctionKey.set(null);
    } else if (!this.selectedJunctionKey() && this.junctionsList().length > 0) {
      this.selectedJunctionKey.set(this.junctionsList()[0].key);
    }
    this.transitionModalOpen.set(true);
  }

  closeTransitionDialog(): void {
    this.transitionModalOpen.set(false);
  }

  onJunctionChipClicked(key: string): void {
    this.selectedJunctionKey.set(key);
    this.openJunctionKey.set(null);
    this.setInspectorTab('transitions');
  }

  closeJunctionEditor(): void {
    this.openJunctionKey.set(null);
  }

  openTransitionsTab(): void {
    const list = this.junctionsList();
    if (list.length > 0 && (!this.selectedJunctionKey() || !list.some((j) => j.key === this.selectedJunctionKey()))) {
      const curTime = this.currentTime();
      const sched = this.clipSchedule();
      let bestKey = list[0].key;
      let minDiff = Infinity;
      for (let i = 0; i < sched.length - 1 && i < list.length; i++) {
        const cutTime = sched[i].endSeconds;
        const diff = Math.abs(curTime - cutTime);
        if (diff < minDiff) {
          minDiff = diff;
          bestKey = list[i].key;
        }
      }
      this.selectedJunctionKey.set(bestKey);
    }
    this.setInspectorTab('transitions');
  }

  applyJunctionToAll(junction: JunctionView): void {
    const trans = junction.transition;
    const secs = junction.seconds;
    this.transition.set(trans);
    this.transitionSeconds.set(secs);
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      for (const j of this.junctionsList()) {
        next.set(j.key, { transition: trans, seconds: secs });
      }
      return next;
    });
    this.markDirty();
  }

  cycleJunctionTransition(junction: JunctionView): void {
    const list = this.transitions as readonly string[];
    const curIdx = list.indexOf(junction.transition);
    const nextTrans = list[(curIdx + 1) % list.length];
    this.setJunctionTransition(junction, nextTrans);
  }

  setJunctionTransition(junction: JunctionView, trans: string): void {
    const targetJunctions = this.targetScope() === 'all' ? this.junctionsList() : [junction];
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      for (const j of targetJunctions) {
        const cur = next.get(j.key) ?? { transition: j.transition, seconds: j.seconds };
        next.set(j.key, { ...cur, transition: trans });
      }
      return next;
    });
    this.markDirty();
  }

  setJunctionSeconds(junction: JunctionView, secs: number): void {
    const targetJunctions = this.targetScope() === 'all' ? this.junctionsList() : [junction];
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      for (const j of targetJunctions) {
        const cur = next.get(j.key) ?? { transition: j.transition, seconds: j.seconds };
        next.set(j.key, { ...cur, seconds: secs });
      }
      return next;
    });
    this.markDirty();
  }

  resetJunction(key: string): void {
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      next.delete(key);
      return next;
    });
    this.markDirty();
  }

  setScopeTransition(value: string): void {
    const scope = this.targetScope();
    if (scope === 'all') {
      this.transition.set(value);
      this.junctionOverrides.update((map) => {
        const next = new Map(map);
        for (const j of this.junctionsList()) {
          const existing = next.get(j.key);
          next.set(j.key, { transition: value, seconds: existing?.seconds ?? this.transitionSeconds() });
        }
        return next;
      });
    } else {
      const tj = this.targetJunctions();
      if (tj.length === 0) {
        this.transition.set(value);
      } else {
        this.junctionOverrides.update((map) => {
          const next = new Map(map);
          for (const j of tj) {
            const existing = next.get(j.key);
            next.set(j.key, { transition: value, seconds: existing?.seconds ?? j.seconds });
          }
          return next;
        });
      }
    }
    this.markDirty();
  }

  setScopeTransitionSeconds(seconds: number): void {
    const sec = Math.max(0.1, Math.min(3, Number(seconds)));
    const scope = this.targetScope();
    if (scope === 'all') {
      this.transitionSeconds.set(sec);
      this.junctionOverrides.update((map) => {
        const next = new Map(map);
        for (const j of this.junctionsList()) {
          const existing = next.get(j.key);
          next.set(j.key, { transition: existing?.transition ?? this.transition(), seconds: sec });
        }
        return next;
      });
    } else {
      const tj = this.targetJunctions();
      if (tj.length === 0) {
        this.transitionSeconds.set(sec);
      } else {
        this.junctionOverrides.update((map) => {
          const next = new Map(map);
          for (const j of tj) {
            const existing = next.get(j.key);
            next.set(j.key, { transition: existing?.transition ?? j.transition, seconds: sec });
          }
          return next;
        });
      }
    }
    this.markDirty();
  }

  resetScopeTransitions(): void {
    const tj = this.targetJunctions();
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      for (const j of tj) {
        next.delete(j.key);
      }
      return next;
    });
    this.markDirty();
  }

  private previewVideoA: HTMLVideoElement | null = null;
  private previewVideoB: HTMLVideoElement | null = null;
  private previewRafId: number | null = null;
  private previewStartTime: number = 0;
  private previewPausedAtElapsed: number = 0;
  previewPreSeconds: number = 5.0;
  previewPostSeconds: number = 5.0;
  previewClipAStartSec: number = 0;

  readonly previewPlaying = signal<boolean>(false);
  readonly previewPhase = signal<'preroll' | 'transition' | 'postroll' | 'finished'>('preroll');
  readonly previewElapsed = signal<number>(0);
  readonly previewDuration = signal<number>(11);
  readonly previewProgress = signal<number>(0);
  readonly previewTransitionProgress = signal<number>(0);
  readonly previewMuted = signal<boolean>(false);
  readonly previewVolume = signal<number>(1.0);

  openPreview(junction: JunctionView): void {
    // Immediately stop studio timeline playback to prevent audio collision
    this.isPlaying.set(false);

    if (this.previewRafId) {
      cancelAnimationFrame(this.previewRafId);
      this.previewRafId = null;
    }

    const leftDur = junction.left.durationSeconds || 5.0;
    const rightDur = junction.right.durationSeconds || 5.0;
    const transSec = Math.max(0.1, junction.seconds || 0.5);

    // 5 seconds pre-roll before the cut, exact transition, 5 seconds post-roll after the cut
    const preSec = Math.max(0.5, Math.min(5.0, leftDur - transSec));
    const postSec = Math.max(0.5, Math.min(5.0, rightDur));
    const totalSec = preSec + transSec + postSec;
    const startA = Math.max(0, leftDur - transSec - preSec);

    this.previewPreSeconds = preSec;
    this.previewPostSeconds = postSec;
    this.previewClipAStartSec = startA;
    this.previewDuration.set(totalSec);
    this.previewElapsed.set(0);
    this.previewProgress.set(0);
    this.previewTransitionProgress.set(0);
    this.previewPhase.set('preroll');
    this.previewPlaying.set(false);
    this.previewPausedAtElapsed = 0;

    this.previewJunction.set({
      key: junction.key,
      leftClip: junction.left,
      rightClip: junction.right,
      transition: junction.transition,
      seconds: transSec,
    });

    // Allow DOM elements to mount and initialize before beginning playback sequence
    setTimeout(() => {
      this.startPreviewSequence(0);
    }, 120);
  }

  startPreviewSequence(startFromElapsed = 0): void {
    if (this.previewRafId) {
      cancelAnimationFrame(this.previewRafId);
      this.previewRafId = null;
    }

    const totalSec = this.previewDuration();
    if (startFromElapsed >= totalSec) {
      this.previewElapsed.set(totalSec);
      this.previewProgress.set(1.0);
      this.previewTransitionProgress.set(1.0);
      this.previewPhase.set('finished');
      this.previewPlaying.set(false);
      this.previewVideoA?.pause();
      this.previewVideoB?.pause();
      return;
    }

    const preSec = this.previewPreSeconds;
    const transSec = this.previewJunction()?.seconds ?? 0.5;
    const transEnd = preSec + transSec;
    const vol = this.previewMuted() ? 0 : this.previewVolume();

    // Prepare Clip A
    if (this.previewVideoA) {
      this.previewVideoA.currentTime = this.previewClipAStartSec + startFromElapsed;
      if (startFromElapsed < transEnd) {
        this.previewVideoA.muted = this.previewMuted();
        this.previewVideoA.volume = startFromElapsed < preSec ? vol : vol * Math.max(0, 1 - (startFromElapsed - preSec) / transSec);
        this.previewVideoA.play().catch(() => {});
      } else {
        this.previewVideoA.muted = true;
        this.previewVideoA.volume = 0;
        this.previewVideoA.pause();
      }
    }

    // Prepare Clip B
    if (this.previewVideoB) {
      if (startFromElapsed >= preSec) {
        this.previewVideoB.currentTime = Math.max(0, startFromElapsed - preSec);
        this.previewVideoB.muted = this.previewMuted();
        this.previewVideoB.volume = startFromElapsed >= transEnd ? vol : vol * Math.min(1, (startFromElapsed - preSec) / transSec);
        this.previewVideoB.play().catch(() => {});
      } else {
        this.previewVideoB.currentTime = 0;
        this.previewVideoB.muted = true;
        this.previewVideoB.volume = 0;
        this.previewVideoB.pause();
      }
    }

    this.previewStartTime = performance.now() - (startFromElapsed * 1000);
    this.previewPlaying.set(true);
    this.runPreviewTick();
  }

  private runPreviewTick(): void {
    if (!this.previewPlaying()) return;

    const now = performance.now();
    const elapsed = Math.max(0, (now - this.previewStartTime) / 1000);
    const totalSec = this.previewDuration();
    const preSec = this.previewPreSeconds;
    const transSec = this.previewJunction()?.seconds ?? 0.5;
    const transEnd = preSec + transSec;

    if (elapsed >= totalSec) {
      // Sequence completed: Stop cleanly, no endless looping
      this.previewElapsed.set(totalSec);
      this.previewProgress.set(1.0);
      this.previewTransitionProgress.set(1.0);
      this.previewPhase.set('finished');
      this.previewPlaying.set(false);
      this.previewPausedAtElapsed = totalSec;
      if (this.previewVideoA) {
        this.previewVideoA.pause();
        this.previewVideoA.volume = 0;
      }
      if (this.previewVideoB) {
        this.previewVideoB.pause();
      }
      return;
    }

    this.previewElapsed.set(elapsed);
    this.previewProgress.set(Math.min(1.0, elapsed / totalSec));
    const vol = this.previewMuted() ? 0 : this.previewVolume();

    if (elapsed < preSec) {
      // --- PHASE 1: PRE-ROLL (Clip A playing exclusively) ---
      this.previewPhase.set('preroll');
      this.previewTransitionProgress.set(0);

      if (this.previewVideoA) {
        this.previewVideoA.muted = this.previewMuted();
        this.previewVideoA.volume = vol;
        if (this.previewVideoA.paused) {
          this.previewVideoA.play().catch(() => {});
        }
      }
      if (this.previewVideoB) {
        this.previewVideoB.muted = true;
        this.previewVideoB.volume = 0;
        if (!this.previewVideoB.paused) {
          this.previewVideoB.pause();
        }
      }
    } else if (elapsed < transEnd) {
      // --- PHASE 2: IN TRANSITION (Both clips blending, smooth audio crossfade) ---
      this.previewPhase.set('transition');
      const p = Math.max(0, Math.min(1, (elapsed - preSec) / transSec));
      this.previewTransitionProgress.set(p);

      if (this.previewVideoB) {
        if (this.previewVideoB.paused) {
          this.previewVideoB.currentTime = Math.max(0, elapsed - preSec);
          this.previewVideoB.play().catch(() => {});
        }
      }

      // Smooth audio crossfading between clips
      if (this.previewVideoA && this.previewVideoB) {
        const transType = this.previewJunction()?.transition;
        if (transType === 'Fade') {
          if (p < 0.5) {
            this.previewVideoA.muted = this.previewMuted();
            this.previewVideoA.volume = vol * Math.max(0, 1 - 2 * p);
            this.previewVideoB.muted = true;
            this.previewVideoB.volume = 0;
          } else {
            this.previewVideoA.muted = true;
            this.previewVideoA.volume = 0;
            this.previewVideoB.muted = this.previewMuted();
            this.previewVideoB.volume = vol * Math.min(1, 2 * (p - 0.5));
          }
        } else {
          this.previewVideoA.muted = this.previewMuted();
          this.previewVideoA.volume = vol * (1 - p);
          this.previewVideoB.muted = this.previewMuted();
          this.previewVideoB.volume = vol * p;
        }
      }
    } else {
      // --- PHASE 3: POST-ROLL (Clip B playing exclusively) ---
      this.previewPhase.set('postroll');
      this.previewTransitionProgress.set(1.0);

      if (this.previewVideoA) {
        this.previewVideoA.muted = true;
        this.previewVideoA.volume = 0;
        if (!this.previewVideoA.paused) {
          this.previewVideoA.pause();
        }
      }
      if (this.previewVideoB) {
        this.previewVideoB.muted = this.previewMuted();
        this.previewVideoB.volume = vol;
        if (this.previewVideoB.paused) {
          this.previewVideoB.play().catch(() => {});
        }
      }
    }

    if (this.previewPlaying()) {
      this.previewRafId = requestAnimationFrame(() => this.runPreviewTick());
    }
  }

  togglePreviewPlay(): void {
    if (this.previewPhase() === 'finished') {
      this.replayPreview();
      return;
    }
    if (this.previewPlaying()) {
      this.previewPlaying.set(false);
      if (this.previewRafId) {
        cancelAnimationFrame(this.previewRafId);
        this.previewRafId = null;
      }
      this.previewPausedAtElapsed = this.previewElapsed();
      this.previewVideoA?.pause();
      this.previewVideoB?.pause();
    } else {
      this.startPreviewSequence(this.previewPausedAtElapsed);
    }
  }

  replayPreview(): void {
    if (this.previewRafId) {
      cancelAnimationFrame(this.previewRafId);
      this.previewRafId = null;
    }
    this.previewElapsed.set(0);
    this.previewProgress.set(0);
    this.previewTransitionProgress.set(0);
    this.previewPhase.set('preroll');
    this.previewPausedAtElapsed = 0;
    this.startPreviewSequence(0);
  }

  jumpToTransition(): void {
    const target = Math.max(0, this.previewPreSeconds - 0.5);
    this.seekPreview(target / this.previewDuration());
  }

  seekPreview(percent: number): void {
    const targetElapsed = Math.max(0, Math.min(this.previewDuration(), percent * this.previewDuration()));
    this.previewPausedAtElapsed = targetElapsed;
    this.previewElapsed.set(targetElapsed);
    this.previewProgress.set(targetElapsed / this.previewDuration());
    this.startPreviewSequence(targetElapsed);
  }

  onPreviewScrubberClick(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    this.seekPreview(percent);
  }

  togglePreviewMute(): void {
    const newMuted = !this.previewMuted();
    this.previewMuted.set(newMuted);
    if (this.previewVideoA) {
      this.previewVideoA.muted = newMuted;
    }
    if (this.previewVideoB) {
      this.previewVideoB.muted = newMuted;
    }
  }

  closePreview(): void {
    if (this.previewRafId) {
      cancelAnimationFrame(this.previewRafId);
      this.previewRafId = null;
    }
    this.previewPlaying.set(false);
    this.previewVideoA?.pause();
    this.previewVideoB?.pause();
    this.previewVideoA = null;
    this.previewVideoB = null;
    this.previewJunction.set(null);
  }

  onPreviewAnimationEnd(): void {
    // Retained for backwards compatibility
  }

  onPreviewVideoReady(event: Event, which: 'A' | 'B'): void {
    const vid = event.target as HTMLVideoElement;
    if (vid) {
      this.onPreviewVideoLoaded(vid, which);
    }
  }

  onPreviewVideoLoaded(vid: HTMLVideoElement, which: 'A' | 'B'): void {
    if (which === 'A') {
      this.previewVideoA = vid;
      vid.currentTime = this.previewClipAStartSec;
    } else {
      this.previewVideoB = vid;
      vid.currentTime = 0;
    }
  }

  // Dynamic visual transition styles
  previewClipAOpacity(): string {
    const phase = this.previewPhase();
    if (phase === 'preroll') return '1';
    if (phase === 'postroll' || phase === 'finished') return '0';
    const p = this.previewTransitionProgress();
    const trans = this.previewJunction()?.transition;
    if (trans === 'Dissolve') return (1 - p).toFixed(3);
    if (trans === 'Fade') return p <= 0.5 ? (1 - 2 * p).toFixed(3) : '0';
    if (trans === 'None') return p < 0.5 ? '1' : '0';
    return '1';
  }

  previewClipBOpacity(): string {
    const phase = this.previewPhase();
    if (phase === 'preroll') return '0';
    if (phase === 'postroll' || phase === 'finished') return '1';
    const p = this.previewTransitionProgress();
    const trans = this.previewJunction()?.transition;
    if (trans === 'Dissolve') return p.toFixed(3);
    if (trans === 'Fade') return p > 0.5 ? (2 * (p - 0.5)).toFixed(3) : '0';
    if (trans === 'None') return p >= 0.5 ? '1' : '0';
    return '1';
  }

  previewClipATransform(): string {
    const phase = this.previewPhase();
    if (phase !== 'transition') return 'none';
    const p = this.previewTransitionProgress();
    const trans = this.previewJunction()?.transition;
    if (trans === 'SlideLeft') return `translateX(${(-100 * p).toFixed(2)}%)`;
    if (trans === 'SlideRight') return `translateX(${(100 * p).toFixed(2)}%)`;
    return 'none';
  }

  previewClipBTransform(): string {
    const phase = this.previewPhase();
    if (phase !== 'transition') return 'none';
    const p = this.previewTransitionProgress();
    const trans = this.previewJunction()?.transition;
    if (trans === 'SlideLeft') return `translateX(${(100 * (1 - p)).toFixed(2)}%)`;
    if (trans === 'SlideRight') return `translateX(${(-100 * (1 - p)).toFixed(2)}%)`;
    return 'none';
  }

  previewClipAClipPath(): string {
    const phase = this.previewPhase();
    if (phase !== 'transition') return 'none';
    const p = this.previewTransitionProgress();
    const trans = this.previewJunction()?.transition;
    if (trans === 'CircleClose') return `circle(${Math.max(0, (1 - p) * 150).toFixed(2)}% at 50% 50%)`;
    return 'none';
  }

  previewClipBClipPath(): string {
    const phase = this.previewPhase();
    if (phase !== 'transition') return 'none';
    const p = this.previewTransitionProgress();
    const trans = this.previewJunction()?.transition;
    if (trans === 'WipeLeft') return `inset(0 0 0 ${Math.max(0, (1 - p) * 100).toFixed(2)}%)`;
    if (trans === 'WipeRight') return `inset(0 ${Math.max(0, (1 - p) * 100).toFixed(2)}% 0 0)`;
    if (trans === 'CircleOpen') return `circle(${Math.min(150, p * 150).toFixed(2)}% at 50% 50%)`;
    return 'none';
  }

  previewClipAZIndex(): number {
    const phase = this.previewPhase();
    if (phase === 'preroll') return 2;
    if (phase === 'transition') {
      const trans = this.previewJunction()?.transition;
      if (trans === 'CircleClose') return 3;
      return 1;
    }
    return 1;
  }

  previewClipBZIndex(): number {
    const phase = this.previewPhase();
    if (phase === 'postroll' || phase === 'finished') return 2;
    if (phase === 'transition') {
      const trans = this.previewJunction()?.transition;
      if (trans === 'CircleClose') return 1;
      return 2;
    }
    return 1;
  }

  previewOutClass(): string {
    return '';
  }

  previewInClass(): string {
    return '';
  }

  previewClass(): string {
    const pj = this.previewJunction();
    if (!pj || pj.transition === 'None') return 'pv-cut';
    return this.pvClassForTransition(pj.transition);
  }

  private pvClassForTransition(transition: string): string {
    switch (transition) {
      case 'Fade':
      case 'Dissolve': return 'pv-fade';
      case 'WipeLeft': return 'pv-wipe-left';
      case 'WipeRight': return 'pv-wipe-right';
      case 'SlideLeft': return 'pv-slide-left';
      case 'SlideRight': return 'pv-slide-right';
      case 'CircleOpen': return 'pv-circle-open';
      case 'CircleClose': return 'pv-circle-close';
      default: return 'pv-cut';
    }
  }

  // Drag-and-Drop Library Reordering
  onRowDragStart(index: number, row?: ClipRow): void {
    this.dragIndex.set(index);
    if (row) {
      this.draggingAsset.set(row);
    } else {
      const paged = this.pagedRows();
      if (paged[index]) this.draggingAsset.set(paged[index]);
    }
  }

  onRowDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.dragIndex() !== null && this.dragIndex() !== index) {
      this.dragOverIndex.set(index);
    }
  }

  onRowDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const dragging = this.draggingAsset();
    if (dragging) {
      const type = this.getClipType(dragging.clip);
      if (type === 'image') {
        this.addAssetToTrack('IMG1', dragging, this.currentTime());
        this.dragIndex.set(null);
        this.dragOverIndex.set(null);
        this.draggingAsset.set(null);
        return;
      }
      if (type === 'audio') {
        this.addMusicTrackFromAsset(dragging.clip.id);
        this.dragIndex.set(null);
        this.dragOverIndex.set(null);
        this.draggingAsset.set(null);
        return;
      }
    }

    const fromIdx = this.dragIndex();
    if (fromIdx !== null && fromIdx !== index) {
      this.rows.update((rows) => {
        const next = [...rows];
        if (fromIdx >= 0 && fromIdx < next.length) {
          const [moved] = next.splice(fromIdx, 1);
          if (moved) {
            next.splice(index, 0, moved);
          }
        }
        return next;
      });
      this.saveOrder();
    }
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
    this.draggingAsset.set(null);
  }

  onRowDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
    this.draggingAsset.set(null);
  }

  // Media Pick / Upload
  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dropActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dropActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dropActive.set(false);
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    this.uploadFiles(Array.from(event.dataTransfer.files));
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(1)} ${units[i]}`;
  }

  generateUniqueFile(file: File, existingNames: Set<string>): File {
    const lastDotIndex = file.name.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
    const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';
    let counter = 1;
    let candidate = `${baseName} (${counter})${ext}`;
    while (existingNames.has(candidate.trim().toLowerCase())) {
      counter++;
      candidate = `${baseName} (${counter})${ext}`;
    }
    existingNames.add(candidate.trim().toLowerCase());
    return new File([file], candidate, { type: file.type, lastModified: file.lastModified });
  }

  uploadFiles(files: File[]): void {
    const projectId = this.store.projectId();
    if (!projectId || files.length === 0) return;

    // Check incoming files against existing media rows
    const allMedia = this.allMediaRows();
    const existingMap = new Map<string, ClipRow>();
    for (const row of allMedia) {
      if (row.clip?.name) {
        existingMap.set(row.clip.name.trim().toLowerCase(), row);
      }
    }

    const conflicts: FileUploadConflict[] = [];
    const nonConflicts: File[] = [];
    const seenInBatch = new Set<string>();

    for (const file of files) {
      const normalized = file.name.trim().toLowerCase();
      const existing = existingMap.get(normalized);
      if (existing) {
        conflicts.push({
          file,
          existingClipId: existing.clip.id,
          existingName: existing.clip.name,
          existingDuration: existing.clip.durationSeconds,
          existingSizeBytes: existing.clip.fileSizeBytes,
          existingType: this.getClipType(existing.clip),
          resolution: 'skip',
        });
      } else if (seenInBatch.has(normalized)) {
        conflicts.push({
          file,
          existingClipId: '',
          existingName: file.name,
          existingSizeBytes: file.size,
          existingType: 'video',
          resolution: 'rename',
        });
      } else {
        seenInBatch.add(normalized);
        nonConflicts.push(file);
      }
    }

    if (conflicts.length > 0) {
      this.uploadConflicts.set(conflicts);
      this.pendingNonConflictFiles.set(nonConflicts);
      this.uploadConflictModalOpen.set(true);
      return;
    }

    // No duplicate conflicts: upload directly
    this.executeUpload(files);
  }

  setConflictResolution(index: number, resolution: 'skip' | 'overwrite' | 'rename'): void {
    this.uploadConflicts.update((conflicts) =>
      conflicts.map((c, i) => (i === index ? { ...c, resolution } : c))
    );
  }

  resolveUploadConflicts(action: 'skip' | 'rename' | 'overwrite' | 'cancel'): void {
    if (action === 'cancel') {
      this.cancelUploadConflicts();
      return;
    }

    const conflicts = this.uploadConflicts();
    const nonConflicts = this.pendingNonConflictFiles();

    if (action === 'skip') {
      this.uploadConflictModalOpen.set(false);
      this.uploadConflicts.set([]);
      this.pendingNonConflictFiles.set([]);
      if (nonConflicts.length > 0) {
        this.status.notify([`Skipped ${conflicts.length} duplicate file(s). Uploading ${nonConflicts.length} new file(s).`]);
        this.executeUpload(nonConflicts);
      } else {
        this.status.notify([`Skipped ${conflicts.length} duplicate file(s). No new files to upload.`]);
      }
      return;
    }

    if (action === 'rename') {
      this.uploadConflictModalOpen.set(false);
      this.uploadConflicts.set([]);
      this.pendingNonConflictFiles.set([]);

      const existingNames = new Set(this.allMediaRows().map((r) => r.clip.name.trim().toLowerCase()));
      const renamedFiles: File[] = [];
      for (const conflict of conflicts) {
        const renamed = this.generateUniqueFile(conflict.file, existingNames);
        renamedFiles.push(renamed);
      }
      const allFiles = [...nonConflicts, ...renamedFiles];
      this.status.notify([`Auto-renamed ${conflicts.length} duplicate file(s) to avoid collisions.`]);
      this.executeUpload(allFiles);
      return;
    }

    if (action === 'overwrite') {
      this.uploadConflictModalOpen.set(false);
      const existingIds = conflicts.map((c) => c.existingClipId).filter((id) => !!id);
      const filesToUpload = [...conflicts.map((c) => c.file), ...nonConflicts];
      this.uploadConflicts.set([]);
      this.pendingNonConflictFiles.set([]);

      this.overwriteAndUpload(existingIds, filesToUpload, `Overwriting ${existingIds.length} existing file(s)...`);
      return;
    }
  }

  applyCustomConflictResolutions(): void {
    const conflicts = this.uploadConflicts();
    const nonConflicts = this.pendingNonConflictFiles();
    this.uploadConflictModalOpen.set(false);

    const existingNames = new Set(this.allMediaRows().map((r) => r.clip.name.trim().toLowerCase()));
    const idsToDelete: string[] = [];
    const filesToUpload: File[] = [...nonConflicts];
    let skippedCount = 0;

    for (const conflict of conflicts) {
      if (conflict.resolution === 'skip') {
        skippedCount++;
      } else if (conflict.resolution === 'overwrite') {
        if (conflict.existingClipId) {
          idsToDelete.push(conflict.existingClipId);
        }
        filesToUpload.push(conflict.file);
      } else if (conflict.resolution === 'rename') {
        const renamed = this.generateUniqueFile(conflict.file, existingNames);
        filesToUpload.push(renamed);
      }
    }

    this.uploadConflicts.set([]);
    this.pendingNonConflictFiles.set([]);

    if (idsToDelete.length > 0) {
      this.overwriteAndUpload(idsToDelete, filesToUpload, `Overwriting ${idsToDelete.length} existing file(s)...`);
    } else if (filesToUpload.length > 0) {
      if (skippedCount > 0) {
        this.status.notify([`Skipped ${skippedCount} duplicate(s). Uploading ${filesToUpload.length} file(s).`]);
      }
      this.executeUpload(filesToUpload);
    } else {
      this.status.notify([`Skipped all duplicate files. No new files to upload.`]);
    }
  }

  cancelUploadConflicts(): void {
    this.uploadConflictModalOpen.set(false);
    this.uploadConflicts.set([]);
    this.pendingNonConflictFiles.set([]);
    this.status.notify(['Upload cancelled.']);
  }

  private overwriteAndUpload(existingIdsToDelete: string[], filesToUpload: File[], statusMsg?: string): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    if (statusMsg) {
      this.status.notify([statusMsg]);
    }

    if (existingIdsToDelete.length > 0) {
      this.status.run(
        this.api.deleteClips(projectId, existingIdsToDelete),
        () => {
          this.store.refreshAssets();
          if (filesToUpload.length > 0) {
            this.executeUpload(filesToUpload);
          } else {
            this.loadStudio();
          }
        }
      );
    } else if (filesToUpload.length > 0) {
      this.executeUpload(filesToUpload);
    }
  }

  executeUpload(files: File[]): void {
    const projectId = this.store.projectId();
    if (!projectId || files.length === 0) return;

    this.uploading.set(true);
    this.uploadDone.set(0);
    this.uploadTotal.set(files.length);

    from(files)
      .pipe(
        concatMap((file) => {
          return this.api.uploadAsset(projectId, file).pipe(
            map(() => ({ ok: true })),
            catchError((err: unknown) => {
              this.status.error.set(`Failed to upload ${file.name}`);
              return of({ ok: false });
            }),
            finalize(() => {
              this.uploadDone.update((d) => d + 1);
            })
          );
        }),
        finalize(() => {
          this.uploading.set(false);
          this.store.refreshAssets();
          this.loadStudio();
          this.status.notify(['Upload completed successfully.']);
        })
      )
      .subscribe();
  }

  // Music Tracks
  addMusicTrackFromAsset(assetId: string, customStartSeconds?: number): void {
    const studio = this.studio();
    const candidate = studio?.musicCandidates?.find((m) => m.id === assetId);
    const dur = candidate?.durationSeconds ?? 10.0;

    let startSec = 0;
    if (customStartSeconds !== undefined) {
      startSec = Math.max(0, customStartSeconds);
    } else {
      const tracks = this.musicTracks();
      if (tracks.length > 0) {
        const latestEnd = Math.max(...tracks.map((t) => t.startSeconds + this.musicTrackDurationSeconds(t)));
        const curTime = this.currentTime();
        const isInsideTrack = tracks.some((t) => curTime >= t.startSeconds && curTime < (t.startSeconds + this.musicTrackDurationSeconds(t)));
        if (curTime > 0 && !isInsideTrack) {
          startSec = curTime;
        } else {
          startSec = latestEnd;
        }
      } else {
        startSec = this.currentTime();
      }
    }

    const newKey = `music_${Date.now()}`;
    const newTrack: MusicTrackRow = {
      key: newKey,
      assetId,
      startSeconds: Number(startSec.toFixed(2)),
      volume: 1.0,
      trimStartSeconds: 0,
      trimEndSeconds: dur,
    };
    this.musicTracks.update((t) => [...t, newTrack]);
    this.clearVideoAndItemSelections();
    this.selectedMusicTrackKey.set(newKey);
    this.showTrackManually('A1');
    this.setInspectorTab('audio');
    this.setAudioInspectorView('clip');
    this.markDirty();
  }

  duplicateClip(clipId: string): void {
    const studio = this.studio();
    const isAudio = studio?.musicCandidates?.some((m) => m.id === clipId);
    if (isAudio) {
      this.addMusicTrackFromAsset(clipId);
      return;
    }

    const rows = [...this.rows()];
    const rowIndex = rows.findIndex((r) => r.clip.id === clipId);
    if (rowIndex < 0) return;

    const targetClip = rows[rowIndex];
    const newEntry: ClipRow = {
      clip: targetClip.clip,
      included: true,
    };

    rows.splice(rowIndex + 1, 0, newEntry);
    this.rows.set(rows);
    this.saveOrder();
  }

  saveOrder(): void {
    this.markDirty();
    const projectId = this.store.projectId();
    if (!projectId) return;

    const uniqueAssetIds = Array.from(new Set(this.rows().map((row) => this.resolveAssetId(row.clip))));
    this.api.saveClipOrder(projectId, uniqueAssetIds).subscribe({
      error: () => this.status.notify(['Could not save the video order. Try the move again.']),
    });
  }

  toggleSelectedMute(): void {
    const selTlIds = this.selectedTimelineItemIds();
    const selLibIds = this.selectedLibraryIds();
    const targetClip = this.selectedClip();

    if (selTlIds.size > 0) {
      const items = this.timelineItems();
      const first = items.find((i) => selTlIds.has(i.id));
      const nextMuted = !(first?.muted ?? false);
      this.timelineItems.update((list) =>
        list.map((it) => (selTlIds.has(it.id) ? { ...it, muted: nextMuted } : it))
      );
      this.markDirty();
      return;
    }

    if (targetClip) {
      const currentSound = this.clipSound(targetClip.id);
      const nextMuted = currentSound.volume > 0;
      this.setBatchMute(nextMuted);
      return;
    }

    if (selLibIds.size > 0) {
      const firstId = selLibIds.values().next().value;
      if (firstId) {
        const currentSound = this.clipSound(firstId);
        const nextMuted = currentSound.volume > 0;
        this.setBatchMute(nextMuted);
      }
    }
  }

  // Project Operations & Drafts
  markDirty(): void {
    this.hasUnsavedChanges.set(true);
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveDraft();
    }, 2500);
  }

  buildDraftData(): any {
    return {
      rows: this.rows(),
      timelineItems: this.timelineItems(),
      timelineTracks: this.timelineTracks(),
      musicTracks: this.musicTracks(),
      musicAssetId: this.musicAssetId(),
      musicVolume: this.musicVolume(),
      clipSounds: this.clipSounds(),
      clipTransforms: this.clipTransforms(),
      clipColors: this.clipColors(),
      clipTexts: this.clipTexts(),
      junctions: this.junctions(),
      junctionOverrides: Array.from(this.junctionOverrides().entries()),
      transition: this.transition(),
      transitionSeconds: this.transitionSeconds(),
      trackV1Volume: this.trackV1Volume(),
      trackA1Volume: this.trackA1Volume(),
      projectOverlapRule: this.projectOverlapRule(),
      duckLevel: this.duckLevel(),
      fit: this.fit(),
      clipFraming: Array.from(this.clipFraming().entries()),
      clipAudioFade: Array.from(this.clipAudioFade().entries()),
      savedAt: new Date().toLocaleTimeString(),
    };
  }

  applyDraft(draft: any): void {
    let draftItems: TimelineItem[] = Array.isArray(draft.timelineItems) ? [...draft.timelineItems] : [];

    if (draft.rows && Array.isArray(draft.rows)) {
      // Strictly keep ONLY video clips in rows (V1) sequence
      const videoRows: ClipRow[] = [];
      const imageRows: ClipRow[] = [];
      for (const r of draft.rows) {
        if (this.getClipType(r.clip) === 'video') {
          videoRows.push(r);
        } else if (this.getClipType(r.clip) === 'image') {
          imageRows.push(r);
        }
      }

      // If there were any images previously saved in draft.rows, migrate them to IMG1 if not already there
      for (const imgRow of imageRows) {
        const alreadyInItems = draftItems.some(
          (it) => (it.trackId === 'IMG1' || it.trackId === 'IMG') && (it.src === imgRow.clip.id || it.id === imgRow.clip.id)
        );
        if (!alreadyInItems && imgRow.included) {
          const defaultDuration = imgRow.clip.durationSeconds ?? 5.0;
          const newItemId = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          draftItems.push({
            id: newItemId,
            type: 'image',
            trackId: 'IMG1',
            startTime: 0,
            duration: defaultDuration,
            src: imgRow.clip.id,
            name: imgRow.clip.name,
            transform: {
              scale: 1.0,
              x: 0,
              y: 0,
              opacity: 1.0,
              transitionIn: 'fade',
              transitionInDuration: 0.5,
              transitionOut: 'fade',
              transitionOutDuration: 0.5,
            },
          });
        }
      }

      // Auto-heal video clips (resolving assetId and sequencing trim offsets for split parts if needed)
      const currentAssetOffsetMap = new Map<string, number>();
      const healedVideoRows = videoRows.map((r) => {
        const realAssetId = this.resolveAssetId(r.clip);
        let trimStart = r.clip.trimStartSeconds;
        let trimEnd = r.clip.trimEndSeconds;
        const dur = r.clip.durationSeconds ?? 5.0;

        const isSplitPart = r.clip.id !== realAssetId;
        if (isSplitPart && (trimStart === undefined || trimEnd === undefined)) {
          const prevOffset = currentAssetOffsetMap.get(realAssetId) ?? 0;
          trimStart = prevOffset;
          trimEnd = prevOffset + dur;
          currentAssetOffsetMap.set(realAssetId, trimEnd);
        } else if (isSplitPart && trimEnd !== undefined) {
          currentAssetOffsetMap.set(realAssetId, trimEnd);
        } else if (!isSplitPart) {
          if (trimStart === undefined) trimStart = 0;
          if (trimEnd === undefined) trimEnd = dur;
        }

        return {
          ...r,
          clip: {
            ...r.clip,
            assetId: realAssetId,
            trimStartSeconds: trimStart,
            trimEndSeconds: trimEnd,
          },
        };
      });

      this.rows.set(healedVideoRows);
    }

    this.timelineItems.set(draftItems);
    if (draft.timelineTracks && Array.isArray(draft.timelineTracks)) this.timelineTracks.set(draft.timelineTracks);
    if (draft.musicTracks && Array.isArray(draft.musicTracks)) this.musicTracks.set(draft.musicTracks);
    if (draft.musicAssetId !== undefined) this.musicAssetId.set(draft.musicAssetId);
    if (draft.musicVolume !== undefined) this.musicVolume.set(draft.musicVolume);
    if (draft.clipSounds) this.clipSounds.set(draft.clipSounds);
    if (draft.clipTransforms) this.clipTransforms.set(draft.clipTransforms);
    if (draft.clipColors) this.clipColors.set(draft.clipColors);
    if (draft.clipTexts) this.clipTexts.set(draft.clipTexts);
    if (draft.junctions) this.junctions.set(draft.junctions);
    if (Array.isArray(draft.junctionOverrides)) {
      this.junctionOverrides.set(new Map(draft.junctionOverrides));
    } else if (draft.junctions && typeof draft.junctions === 'object') {
      const map = new Map<string, JunctionSetting>();
      for (const [k, v] of Object.entries(draft.junctions as Record<string, JunctionSetting>)) {
        if (v) map.set(k, v);
      }
      this.junctionOverrides.set(map);
    }
    if (draft.transition !== undefined) this.transition.set(draft.transition);
    if (draft.transitionSeconds !== undefined) this.transitionSeconds.set(draft.transitionSeconds);
    if (draft.trackV1Volume !== undefined) this.trackV1Volume.set(draft.trackV1Volume);

    if (draft.trackA1Volume !== undefined) this.trackA1Volume.set(draft.trackA1Volume);

    if (draft.projectOverlapRule !== undefined) {
      this.projectOverlapRule.set(draft.projectOverlapRule);
    } else if (draft.v1AudioMode !== undefined) {
      // Drafts saved before the rules were unified. 'Always' meant "mute every clip",
      // which is now simply a muted V1 bus rather than an overlap rule.
      if (draft.v1AudioMode === 'Always') {
        this.projectOverlapRule.set('MusicOnly');
        this.trackV1Muted.set(true);
      } else if (draft.v1AudioMode === 'MuteOnAudio') {
        this.projectOverlapRule.set('MusicOnly');
      } else {
        this.projectOverlapRule.set('PlayBoth');
      }
    }
    if (draft.duckLevel !== undefined) this.duckLevel.set(draft.duckLevel);
    else if (draft.videoDuckLevel !== undefined) this.duckLevel.set(draft.videoDuckLevel);
    this.migrateLegacyOverlapSettings();
    if (draft.fit !== undefined) this.fit.set(draft.fit);
    if (Array.isArray(draft.clipFraming)) this.clipFraming.set(new Map(draft.clipFraming));
    if (Array.isArray(draft.clipAudioFade)) this.clipAudioFade.set(new Map(draft.clipAudioFade));
  }

  saveDraft(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    const draftData = this.buildDraftData();
    const draftJson = JSON.stringify(draftData);

    localStorage.setItem(`${DRAFT_KEY_PREFIX}${projectId}`, draftJson);
    this.hasUnsavedChanges.set(false);
    this.lastSavedTime.set(draftData.savedAt);
    this.restoredDraftTime.set(null);
    this.status.notify(['Saved to database & local storage.']);

    this.api.saveStudioDraft(projectId, draftJson).subscribe({
      next: () => {},
      error: (err) => console.warn('Failed to sync draft to server', err),
    });
  }

  autoSaveDraft(): void {
    const projectId = this.store.projectId();
    if (!projectId || !this.hasUnsavedChanges()) return;

    const draftData = this.buildDraftData();
    const draftJson = JSON.stringify(draftData);

    localStorage.setItem(`${DRAFT_KEY_PREFIX}${projectId}`, draftJson);

    this.api.saveStudioDraft(projectId, draftJson).subscribe({
      next: () => {
        this.hasUnsavedChanges.set(false);
        this.lastSavedTime.set(draftData.savedAt);
      },
      error: (err) => console.warn('Auto-save failed to sync to server', err),
    });
  }

  keepDraft(): void {
    this.saveDraft();
    this.restoredDraftTime.set(null);
    this.status.notify(['Draft kept and saved.']);
  }

  discardDraft(): void {
    const projectId = this.store.projectId();
    if (projectId) {
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${projectId}`);
      this.api.saveStudioDraft(projectId, '').subscribe({
        next: () => {},
        error: (err) => console.warn('Failed to clear draft on server', err),
      });
    }
    this.restoredDraftTime.set(null);
    this.loadStudio();
    this.status.notify(['Draft discarded.']);
  }

  loadStudio(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.api.clipStudio(projectId).subscribe({
      next: (studio: ClipStudio) => {
        this.studio.set(studio);
        const rowList: ClipRow[] = (studio.clips || [])
          .filter((clip) => this.getClipType(clip) !== 'audio')
          .filter((clip) => this.getClipType(clip) === 'video')
          .map((clip) => ({
            clip,
            included: true,
          }));
        this.rows.set(rowList);

        // Check for server draft first
        if (studio.studioDraftJson) {
          try {
            const serverDraft = JSON.parse(studio.studioDraftJson);
            this.applyDraft(serverDraft);
            this.hasUnsavedChanges.set(false);
            this.lastSavedTime.set(serverDraft.savedAt || 'Saved');
            this.restoredDraftTime.set(null);
            localStorage.setItem(`${DRAFT_KEY_PREFIX}${projectId}`, studio.studioDraftJson);
            return;
          } catch (e) {
            console.warn('Failed to parse server draft', e);
          }
        }

        // Fallback to local draft if server draft is absent
        const draftJson = localStorage.getItem(`${DRAFT_KEY_PREFIX}${projectId}`);
        if (draftJson) {
          try {
            const localDraft = JSON.parse(draftJson);
            this.applyDraft(localDraft);
            this.restoredDraftTime.set(localDraft.savedAt || 'Unknown');
            // Auto-migrate local draft to server database
            this.api.saveStudioDraft(projectId, draftJson).subscribe({
              next: () => {
                this.hasUnsavedChanges.set(false);
                this.lastSavedTime.set(localDraft.savedAt || 'Saved');
                this.restoredDraftTime.set(null);
              },
              error: (err) => console.warn('Failed to migrate local draft to server', err),
            });
            return;
          } catch (e) {
            console.warn('Failed to parse local draft', e);
          }
        }

        // If no draft exists, initialize image overlays on IMG1
        const initialImages = (studio.clips || []).filter((clip) => this.getClipType(clip) === 'image');
        if (initialImages.length > 0 && this.timelineItems().length === 0) {
          let startT = 0;
          const imgItems: TimelineItem[] = initialImages.map((img) => {
            const dur = img.durationSeconds ?? 5.0;
            const item: TimelineItem = {
              id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'image',
              trackId: 'IMG1',
              startTime: startT,
              duration: dur,
              src: img.id,
              name: img.name,
              transform: {
                scale: 1.0,
                x: 0,
                y: 0,
                opacity: 1.0,
                transitionIn: 'fade',
                transitionInDuration: 0.5,
                transitionOut: 'fade',
                transitionOutDuration: 0.5,
              },
            };
            startT += dur;
            return item;
          });
          this.timelineItems.set(imgItems);
        }

        // Load latest render / export job so previous generations are immediately visible
        this.api.listJobs(projectId).subscribe({
          next: (jobs: RenderJob[]) => {
            if (jobs && jobs.length > 0) {
              const active = jobs.find((j: RenderJob) => !isTerminal(j.status));
              const latest = active || jobs[0];
              this.job.set(latest);
              if (active) {
                this.running.set(true);
                this.startPolling(active.jobId);
              }
            }
          },
          error: () => {},
        });
      },
      error: () => {
        this.status.error.set('Failed to load clip studio');
      },
    });
  }

  reload(firstLoad = false, then?: () => void): void {
    this.loadStudio();
    if (then) then();
  }

  isClipSoundCustom(clipId: string): boolean {
    const s = this.clipSounds()[clipId];
    if (!s) return false;
    return s.volume !== 1 || !!s.audioAssetId || s.audioVolume !== 1 || !s.keepOriginalAudio || Boolean(s.overlapRule && s.overlapRule !== 'Inherit') || (s.duckLevelOverride !== null && s.duckLevelOverride !== undefined);
  }

  timelineItemsPayload(): TimelineItem[] | null {
    // 1. Separate non-V1 overlay items (IMG1, T1, V2, etc.)
    const overlayItems = this.timelineItems().filter(
      (it) => it.trackId !== 'V1' && it.trackId !== 'video'
    );

    // 2. Exact 1-to-1 V1 timeline items directly from clipSchedule
    // Every clip on the timeline cut gets its own uniquely-indexed entry so duplicates and custom trims are preserved
    const schedule = this.clipSchedule();
    const v1Items: TimelineItem[] = schedule.map((entry, index) => {
      const clipId = entry.clip.id;
      const realAssetId = this.resolveAssetId(entry.clip);
      const t = this.clipTransformSetting(clipId);
      const dur = Math.max(0.05, entry.durationSeconds ?? (entry.endSeconds - entry.startSeconds));
      const trimStart = entry.clip.trimStartSeconds ?? 0;
      const trimEnd = entry.clip.trimEndSeconds ?? (trimStart + dur);

      const transformSpec: TimelineItemTransform = {
        scale: t.scale,
        x: t.x,
        y: t.y,
        opacity: t.opacity,
        rotation: t.rotation,
        cropLeft: t.cropLeft,
        cropRight: t.cropRight,
        cropTop: t.cropTop,
        cropBottom: t.cropBottom,
        cropLinked: t.cropLinked,
        stabilization: t.stabilization,
      };

      return {
        id: `v1_${index}_${clipId}`,
        type: 'video',
        trackId: 'V1',
        startTime: entry.startSeconds,
        duration: dur,
        src: realAssetId,
        name: entry.clip.name,
        transform: transformSpec,
        trimStartSeconds: trimStart,
        trimEndSeconds: trimEnd,
      };
    });

    const allItems = [...v1Items, ...overlayItems];
    if (allItems.length === 0) return null;

    return allItems.map((item) => ({
      id: item.id,
      type: item.type,
      trackId: item.trackId,
      startTime: item.startTime,
      duration: item.duration,
      src: this.resolveAssetId(item.src) || item.src,
      name: item.name,
      transform: item.transform,
      textStyle: item.textStyle,
      volume: item.volume,
      trimStartSeconds: item.trimStartSeconds,
      trimEndSeconds: item.trimEndSeconds,
    }));
  }

  clipAudioPayload(): ClipAudioBody[] | null {
    const clips = this.included();
    const anyRule = clips.some((r) => this.clipOverlapRule(r.clip.id) !== 'Inherit');
    const projectDucks = this.projectOverlapRule() !== 'PlayBoth';
    const trackDucks = this.musicTracks().some((t) => (t.overlapRule ?? 'Inherit') !== 'Inherit');
    const anyCustom = clips.some((r) => this.isClipSoundCustom(r.clip.id));
    if (!anyRule && !projectDucks && !trackDucks && !anyCustom) return null;

    const schedule = this.clipSchedule();
    const available = new Set(this.studio()?.musicCandidates.map((a) => a.id) ?? []);

    return clips.map((row, idx) => {
      const sound = this.clipSound(row.clip.id);
      const assetId = sound.audioAssetId && available.has(sound.audioAssetId)
        ? sound.audioAssetId
        : null;

      // One resolver for preview and export, so a mix that sounds right also renders right.
      const resolved = this.resolveOverlap(row.clip.id);
      const vol = Math.round(sound.volume * resolved.videoGain * 100) / 100;

      let trimStart = sound.audioTrimStartSeconds ?? null;
      let trimEnd = sound.audioTrimEndSeconds ?? null;
      const sRef = schedule[idx] ?? schedule.find((x) => x.clip.id === row.clip.id);
      if (assetId && sRef) {
        let runStartSeconds = sRef.startSeconds;
        let runTrimStart = sound.audioTrimStartSeconds ?? 0;
        for (let i = sRef.index - 1; i >= 0; i--) {
          const prev = schedule[i];
          const prevSound = this.clipSound(prev.clip.id);
          if (prevSound.audioAssetId === assetId) {
            runStartSeconds = prev.startSeconds;
            runTrimStart = prevSound.audioTrimStartSeconds ?? 0;
          } else {
            break;
          }
        }
        const offset = (sRef.startSeconds - runStartSeconds) + runTrimStart;
        trimStart = Math.max(0, offset);
        if (sound.audioTrimEndSeconds != null) {
          trimEnd = sound.audioTrimEndSeconds;
        }
      }

      return {
        volume: vol,
        audioAssetId: assetId,
        audioVolume: sound.audioVolume,
        keepOriginalAudio: sound.keepOriginalAudio,
        trimStartSeconds: trimStart,
        trimEndSeconds: trimEnd,
      };
    });
  }

  /**
   * Stretches of the finished timeline where the music must drop, and how far. Ducking the
   * music cannot be baked into a clip's own volume, so the server needs the windows to build
   * a gain envelope over the music bed.
   */
  musicDuckWindowsPayload(): { startSeconds: number; endSeconds: number; level: number }[] {
    const windows: { startSeconds: number; endSeconds: number; level: number }[] = [];
    for (const entry of this.clipSchedule()) {
      const resolved = this.resolveOverlap(entry.clip.id);
      if (!resolved.hasMusicUnder || resolved.musicGain >= 1) continue;

      const rawLevel = Math.round(resolved.musicGain * 1000) / 1000;
      const level = Math.max(0, Math.min(1.0, rawLevel));
      if (level >= 1.0) continue;
      const last = windows[windows.length - 1];
      // Neighbouring clips that duck by the same amount become one window, so a run of
      // dialogue does not make the music pump between every cut.
      if (last && last.level === level && Math.abs(last.endSeconds - entry.startSeconds) < 0.001) {
        last.endSeconds = entry.endSeconds;
      } else {
        windows.push({ startSeconds: entry.startSeconds, endSeconds: entry.endSeconds, level });
      }
    }
    return windows;
  }

  private pollHandle: any = null;
  private exportTimerHandle: any = null;
  private currentStageTracked: string = 'Preparing';

  private startExportTimer(): void {
    this.stopExportTimer();
    this.currentStageTracked = 'Preparing';
    this.exportElapsedSeconds.set(0);
    this.exportEtaSeconds.set(null);
    this.stageDurations.set({});

    this.exportTimerHandle = setInterval(() => {
      this.exportElapsedSeconds.update((s) => s + 1);

      const stage = this.job()?.currentStage || this.currentStageTracked;
      if (stage !== this.currentStageTracked) {
        this.currentStageTracked = stage;
      }
      const durations = { ...this.stageDurations() };
      durations[stage] = (durations[stage] ?? 0) + 1;
      this.stageDurations.set(durations);

      const progress = this.job()?.progress ?? 0;
      const elapsed = this.exportElapsedSeconds();
      if (progress >= 3 && progress < 100) {
        const totalEstimated = (elapsed / progress) * 100;
        const remaining = Math.max(0, Math.round(totalEstimated - elapsed));
        this.exportEtaSeconds.set(remaining);

        const doneClips = this.scenesDone();
        if (elapsed > 2 && doneClips > 0) {
          const speedVal = (doneClips * 4.0) / Math.max(1, elapsed);
          this.exportSpeed.set(`${Math.max(0.8, Number(speedVal.toFixed(1)))}x`);
        }
      }
    }, 1000);
  }

  private stopExportTimer(): void {
    if (this.exportTimerHandle !== null) {
      clearInterval(this.exportTimerHandle);
      this.exportTimerHandle = null;
    }
  }

  openExportProgress(): void {
    this.exportProgressOpen.set(true);
    this.exportProgressMinimized.set(false);
  }

  closeExportProgress(): void {
    this.exportProgressOpen.set(false);
  }

  minimizeExportProgress(): void {
    this.exportProgressMinimized.set(true);
    this.exportProgressOpen.set(false);
  }

  restoreExportProgress(): void {
    this.exportProgressMinimized.set(false);
    this.exportProgressOpen.set(true);
  }

  openExportPreview(): void {
    this.exportPreviewModalOpen.set(true);
  }

  closeExportPreview(): void {
    this.exportPreviewModalOpen.set(false);
  }

  formatStageDuration(sec: number): string {
    if (!sec || sec <= 0) return '0s';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  private startPolling(jobId: string): void {
    this.stopPolling();

    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);

          if (isTerminal(job.status)) {
            this.running.set(false);
            this.stopPolling();
            this.stopExportTimer();
            this.exportEtaSeconds.set(0);
            if (job.diagnostics) {
              this.exportElapsedSeconds.set(Math.round(job.diagnostics.totalSeconds));
              if (job.diagnostics.speedFactor) {
                this.exportSpeed.set(job.diagnostics.speedFactor);
              }
              this.stageDurations.set({
                Preparing: Math.round(job.diagnostics.preparingSeconds),
                RenderingScene: Math.round(job.diagnostics.encodingSeconds),
                Merging: Math.round(job.diagnostics.mergingSeconds),
                Publishing: Math.round(job.diagnostics.publishingSeconds),
              });
            }
            if (this.exportProgressMinimized()) {
              this.restoreExportProgress();
            }
            this.status.notify(job.warnings.map((w) => this.explainWarning(w)));
          }
        },
        error: () => {
          this.running.set(false);
          this.stopPolling();
          this.stopExportTimer();
        },
      });
    }, 1500);
  }

  openLastExportDiagnostics(): void {
    if (this.job()) {
      this.exportProgressOpen.set(true);
      this.exportProgressMinimized.set(false);
    }
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private explainWarning(code: string): string {
    switch (code) {
      case 'TRANSITION_SHORTENED':
        return 'Some transitions were shortened to fit the clips they join.';
      case 'BLUR_BACKDROP_UNAVAILABLE':
        return 'This server\'s renderer cannot blur, so letterboxed clips got black bars.';
      case 'WATERMARK_UNAVAILABLE':
        return 'This server has no font available, so the text watermark was left off. A logo image would work.';
      default:
        return code;
    }
  }

  openExportModal(): void {
    if (!this.exportName()) {
      const projName = this.store.project()?.name || 'AnimStudio';
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.exportName.set(`${projName} - Export ${dateStr}`);
    }
    const proj = this.store.project();
    if (proj && proj.width && proj.height) {
      if (proj.width === 1080 && proj.height === 1920) {
        this.exportResolution.set('short_9_16');
      } else if (proj.width === 1080 && proj.height === 1080) {
        this.exportResolution.set('square_1_1');
      } else if (proj.width >= 3840 || proj.height >= 2160) {
        this.exportResolution.set('4k');
      } else if (proj.width === 1280 && proj.height === 720) {
        this.exportResolution.set('720p');
      } else {
        this.exportResolution.set('1080p');
      }
    }
    this.exportOverrideTransitions.set(false);
    this.exportModalOpen.set(true);
  }

  toggleExportOverrideTransitions(): void {
    this.exportOverrideTransitions.update((v) => !v);
  }

  closeExportModal(): void {
    this.exportModalOpen.set(false);
  }

  confirmExport(preset?: 'current' | 'short_9_16'): void {
    if (preset === 'short_9_16') {
      this.exportResolution.set('short_9_16');
      this.closeExportModal();
      this.buildShort();
      return;
    }
    this.closeExportModal();
    this.build();
  }

  build(): void {
    const projectId = this.store.projectId();
    if (!projectId || this.blockedReason() !== null) return;

    const includedClips = this.included().map((r) => r.clip.id);
    if (includedClips.length === 0) {
      this.status.notify(['Please include at least one clip on the timeline.']);
      return;
    }

    this.saveDraft();
    this.running.set(true);

    const wm: WatermarkBody = this.effectiveWatermark();

    let outW: number | undefined = undefined;
    let outH: number | undefined = undefined;
    const res = this.exportResolution();
    if (res === '4k') { outW = 3840; outH = 2160; }
    else if (res === '720p') { outW = 1280; outH = 720; }
    else if (res === 'short_9_16') { outW = 1080; outH = 1920; }
    else if (res === 'square_1_1') { outW = 1080; outH = 1080; }
    else if (res === '1080p') { outW = 1920; outH = 1080; }

    const fitMode = res === 'short_9_16' && this.fit() === 'Contain' ? 'BlurredBackdrop' : this.fit();

    const override = this.exportOverrideTransitions();
    const globalTrans = override ? this.transition() : 'None';
    const globalSecs = override && globalTrans !== 'None' ? this.transitionSeconds() : 0;

    this.status.run(
      this.api.mergeClips(projectId, {
        exportName: this.exportName() || undefined,
        assetIds: includedClips,
        fit: fitMode,
        outputWidth: outW,
        outputHeight: outH,
        quality: this.exportQuality(),
        transition: globalTrans,
        transitionSeconds: globalSecs,
        junctions: this.junctionsList().map((j, k) => {
          const sched = this.clipSchedule();
          const tr = override ? this.transition() : j.transition;
          const trSec = override
            ? (this.transition() === 'None' ? 0 : this.transitionSeconds())
            : (j.transition === 'None' ? 0 : j.seconds);
          return {
            transition: tr,
            transitionSeconds: trSec,
            tailOutSeconds: sched[k]?.tailOutSeconds ?? 0,
            leadInSeconds: sched[k + 1]?.leadInSeconds ?? 0,
            freezeTail: sched[k]?.freezeTail ?? false,
            freezeHead: sched[k + 1]?.freezeHead ?? false,
          };
        }),
        muteClipAudio: this.trackV1Muted(),
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: Math.max(0, Math.min(2.0, Number(this.musicVolume()) || 0)),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: Math.max(0, Math.min(2.0, t.muted ? 0 : (Number(t.volume) || 0))),
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        timelineItems: this.timelineItemsPayload(),
        clipAudio: this.clipAudioPayload(),
        musicDuckWindows: this.musicDuckWindowsPayload(),
        watermark: this.exportIncludeWatermark() ? wm : { ...wm, kind: "None" as any },
        includeOutro: this.exportIncludeOutro(),
      }),
      (job: RenderJob) => {
        this.job.set(job);
        this.running.set(true);
        this.startExportTimer();
        this.startPolling(job.jobId);
        this.openExportProgress();
        this.status.notify(['Export started successfully.']);
      }
    );
  }

  buildShort(clipIds?: string[]): void {
    const projectId = this.store.projectId();
    if (!projectId || this.blockedReason() !== null) return;

    const ids = clipIds && clipIds.length > 0
      ? clipIds
      : this.included().map((r) => r.clip.id);

    if (ids.length === 0) return;

    this.saveDraft();
    this.running.set(true);

    const fitMode: ClipFit = this.fit() === 'BlurredBackdrop'
      ? 'BlurredBackdrop'
      : (this.fit() === 'Contain' ? 'Contain' : 'Cover');

    const wm: WatermarkBody = this.effectiveWatermark();

    const override = this.exportOverrideTransitions();
    const globalTrans = override ? this.transition() : 'None';
    const globalSecs = override && globalTrans !== 'None' ? this.transitionSeconds() : 0;

    this.status.run(
      this.api.mergeClips(projectId, {
        assetIds: ids,
        fit: fitMode,
        outputWidth: 1080,
        outputHeight: 1920,
        quality: this.exportQuality(),
        transition: globalTrans,
        transitionSeconds: globalSecs,
        junctions: this.junctionsList().map((j, k) => {
          const sched = this.clipSchedule();
          const tr = override ? this.transition() : j.transition;
          const trSec = override
            ? (this.transition() === 'None' ? 0 : this.transitionSeconds())
            : (j.transition === 'None' ? 0 : j.seconds);
          return {
            transition: tr,
            transitionSeconds: trSec,
            tailOutSeconds: sched[k]?.tailOutSeconds ?? 0,
            leadInSeconds: sched[k + 1]?.leadInSeconds ?? 0,
            freezeTail: sched[k]?.freezeTail ?? false,
            freezeHead: sched[k + 1]?.freezeHead ?? false,
          };
        }),
        muteClipAudio: this.trackV1Muted(),
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: Math.max(0, Math.min(2.0, Number(this.musicVolume()) || 0)),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: Math.max(0, Math.min(2.0, t.muted ? 0 : (Number(t.volume) || 0))),
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        timelineItems: this.timelineItemsPayload(),
        clipAudio: this.clipAudioPayload(),
        musicDuckWindows: this.musicDuckWindowsPayload(),
        watermark: this.exportIncludeWatermark() ? wm : { ...wm, kind: "None" as any },
        includeOutro: this.exportIncludeOutro(),
      }),
      (job: RenderJob) => {
        this.job.set(job);
        this.running.set(true);
        this.startExportTimer();
        this.startPolling(job.jobId);
        this.openExportProgress();
        this.status.notify(['Started building vertical Short (9:16) video!']);
      }
    );
  }

  cancel(): void {
    const j = this.job();
    if (!j) return;

    this.api.cancelJob(j.jobId).subscribe({
      next: () => {
        this.running.set(false);
        this.stopPolling();
        this.stopExportTimer();
        this.status.notify(['Job canceled.']);
      },
      error: () => {
        this.status.error.set('Failed to cancel job');
      },
    });
  }

  setScreenMode(mode: 'normal' | 'window' | 'display'): void {
    this.screenMode.set(mode);
    this.screenModeDropdownOpen.set(false);
    if (mode === 'normal') {
      this.appFullscreen.set(false);
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
    } else if (mode === 'window') {
      this.appFullscreen.set(true);
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
    } else if (mode === 'display') {
      this.appFullscreen.set(true);
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => undefined);
      }
    }
  }

  toggleScreenModeDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.screenModeDropdownOpen.update((v) => !v);
  }

  cycleScreenMode(): void {
    const cur = this.screenMode();
    if (cur === 'normal') this.setScreenMode('window');
    else if (cur === 'window') this.setScreenMode('display');
    else this.setScreenMode('normal');
  }

  toggleAppFullscreen(): void {
    this.appFullscreen.update((f) => !f);
    if (this.screenMode() === 'normal') {
      this.setScreenMode('window');
    } else {
      this.setScreenMode('normal');
    }
  }

  exportClipAsShort(clipId: string): void {
    this.buildShort([clipId]);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  timelineUrl(jobId: string, format: ExportTimelineFormat): string {
    return this.api.timelineUrl(jobId, format);
  }
}
