import { Injectable, computed, inject, signal, OnDestroy } from '@angular/core';
import { catchError, concatMap, finalize, from, map, of } from 'rxjs';

import {
  Clip, ClipAudioBody, ClipFit, ClipOrder, ClipStudio, MAX_CLIP_GAIN, RenderJob,
  SHORTS_MAX_SECONDS, TRANSITIONS, WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition,
  aspectRatioLabel, isTerminal, videoFormat,
  TimelineItem, TimelineItemType, TrackControlState, TimelineItemTransform, TimelineItemTextStyle,
} from '../../../core/models/api.models';
import { ApiService } from '../../../core/services/api.service';
import { AudioEngineService } from '../../../core/services/audio-engine.service';
import { ProjectStore } from '../../../core/services/project-store';
import { StatusService } from '../../../core/services/status.service';
import {
  ClipAudioSetting, ClipColorSetting, ClipRow, ClipTextSetting, FILTER_PRESETS,
  FileUploadConflict, FilterPreset, JunctionSetting, JunctionView, MusicTrackRow, ScheduledClip, SideUploadTarget, TRACK_COLORS
} from '../models/clip-studio.models';

const DRAFT_KEY_PREFIX = 'animstudio_studio_draft_';

@Injectable()
export class StudioStateService implements OnDestroy {
  readonly api = inject(ApiService);
  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);
  readonly audioEngine = inject(AudioEngineService);

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
  readonly musicAssetId = signal<string>('');
  readonly musicVolume = signal<number>(1.0);
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

    // Check if ID has a split suffix like '_a_123', '_b_123', '_part_123'
    const cleaned = id.replace(/_[ab]_\d+.*$/, '').replace(/_part.*$/, '');
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

  assetThumbnailUrl(clipOrId: string | Clip | undefined): string {
    if (!clipOrId) return '';
    const resolved = this.resolveAssetId(clipOrId);
    return this.api.assetThumbnailUrl(resolved);
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
  readonly exportQuality = signal<'high' | 'medium' | 'fast'>('high');

  // Edit Settings
  readonly orderText = signal<string>('');
  readonly orderResult = signal<ClipOrder | null>(null);
  readonly fit = signal<ClipFit>('Contain');
  readonly transition = signal<string>('Dissolve');
  readonly transitionSeconds = signal<number>(0.5);
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
  readonly targetScope = signal<'auto' | 'selected' | 'all' | 'current' | 'under_music'>('selected');
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
  readonly v1AudioMode = signal<'Never' | 'Always' | 'Overlap' | 'MuteOnAudio'>('Never');
  readonly muteClipAudio = this.v1AudioMode;
  readonly isGlobalDuckingEnabled = signal<boolean>(true);
  readonly isGlobalDuckingBypassed = computed(() => !this.isGlobalDuckingEnabled());
  readonly audioInspectorViewMode = signal<'auto' | 'clip' | 'mixer'>('auto');
  readonly videoDuckLevel = signal<number>(0.25);

  readonly effectiveAudioInspectorView = computed<'clip' | 'mixer'>(() => {
    const mode = this.audioInspectorViewMode();
    if (mode === 'mixer') return 'mixer';
    if (mode === 'clip') return 'clip';
    if (this.targetScope() === 'all') return 'mixer';
    if (this.selectedClipId() || this.selectedTimelineItemId() || this.selectedTimelineItemIds().size > 0 || this.targetScope() === 'under_music' || (this.targetScope() === 'current' && this.currentScheduledClip())) {
      return 'clip';
    }
    return 'mixer';
  });

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

  junctionKey(leftId: string, rightId: string): string {
    return `${leftId}:${rightId}`;
  }

  isJunctionCustom(key: string): boolean {
    return this.junctionOverrides().has(key);
  }

  readonly clipSchedule = computed<ScheduledClip[]>(() => {
    const rows = this.included();
    const junctionsMap = this.junctionOverrides();
    const defaultTrans = this.transition();
    const defaultSecs = this.transitionSeconds();

    let curStart = 0;
    const schedule: ScheduledClip[] = [];

    for (let i = 0; i < rows.length; i++) {
      const clip = rows[i].clip;
      const dur = clip.durationSeconds ?? 5.0;

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

      schedule.push({
        clip,
        index: i,
        startSeconds: curStart,
        endSeconds: curStart + dur,
        durationSeconds: dur,
        junctionTransition: jTrans,
        junctionSeconds: jSecs,
      });

      curStart += Math.max(0, dur - jSecs);
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
    return Math.max(this.contentDurationSeconds(), 10);
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

  readonly hasMusicOnTimeline = computed<boolean>(() => {
    return this.musicAssetId() !== '' || this.musicTracks().length > 0;
  });

  readonly activeMusicTrackName = computed<string>(() => {
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
    if (this.selectedTimelineItemIds().size > 1) return true;
    if (this.selectedLibraryIds().size > 1) return true;
    if (this.targetScope() === 'all' && this.included().length > 1) return true;
    if (this.targetScope() === 'under_music' && this.clipsUnderMusic().length > 1) return true;
    if (this.targetScope() === 'selected' && (this.selectedCount() > 1 || this.selectedTimelineItemIds().size > 1)) return true;
    return false;
  });

  readonly multiSelectionCount = computed(() => {
    if (this.targetScope() === 'under_music') return this.clipsUnderMusic().length;
    if (this.selectedTimelineItemIds().size > 1) return this.selectedTimelineItemIds().size;
    if (this.selectedLibraryIds().size > 1) return this.selectedLibraryIds().size;
    if (this.targetScope() === 'all') return this.included().length;
    if (this.targetScope() === 'selected') return Math.max(this.selectedCount(), this.selectedTimelineItemIds().size);
    return 1;
  });

  readonly selectedClipsCount = computed(() => {
    if (this.targetScope() === 'under_music') return this.clipsUnderMusic().length;
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
    const scope = this.targetScope();
    if (scope === 'current') {
      const current = this.currentScheduledClip();
      if (current) return current.clip;
      return null;
    }
    if (scope === 'all') {
      const first = this.included()[0];
      return first ? first.clip : null;
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
    // 1. Direct selected clip
    const direct = this.selectedClip();
    if (direct) return direct;
    // 2. First selected from library
    const libIds = Array.from(this.selectedLibraryIds());
    if (libIds.length > 0) {
      const row = this.allMediaRows().find((r) => r.clip.id === libIds[0]);
      if (row) return row.clip;
    }
    // 3. Current playhead clip fallback
    const sched = this.currentScheduledClip();
    if (sched) return sched.clip;
    // 4. First included clip fallback
    const firstInc = this.included()[0];
    if (firstInc) return firstInc.clip;
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
    duckMode: 'Normal' | 'Ducked' | 'MuteOnAudio' | 'LeadVoice';
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
        duckMode: tlItem.duckMode ?? 'Normal',
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
        duckMode: sound.duckMode ?? 'Normal',
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
      const def = this.store.project()?.defaultWatermark;
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
      case 'effects': return '✨ FX';
      case 'transitions': return '⚡ Trans';
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
    this.audioEngine.dispose();
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
      this.selectedClipId.set(clipId);
      this.selectedLibraryIds.set(new Set([clipId]));
      this.selectedTimelineItemId.set(null);
      this.selectedTimelineItemIds.set(new Set());
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
    this.selectedTimelineClipIndex.set(index);
    this.selectedClipId.set(clipId);
    this.selectedLibraryIds.set(new Set([clipId]));
    this.selectedTimelineItemId.set(null);
    this.selectedTimelineItemIds.set(new Set());
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

  clearAllSelections(): void {
    this.selectedTimelineClipIndex.set(null);
    this.selectedClipId.set(null);
    this.selectedLibraryIds.set(new Set());
    this.selectedTimelineItemId.set(null);
    this.selectedTimelineItemIds.set(new Set());
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

    // Video clips route strictly to V1 Base Video track
    const rows = [...this.rows()];
    const existingIdx = rows.findIndex((r) => r.clip.id === clipId);
    if (existingIdx >= 0) {
      rows[existingIdx] = { ...rows[existingIdx], included: true };
      this.rows.set(rows);
    } else {
      rows.push({ clip, included: true });
      this.rows.set(rows);
    }
    this.markDirty();
    this.status.notify([`Added video "${clip.name}" to V1 sequence cut.`]);
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
    const selectedIds = this.selectedLibraryIds();
    if (selectedIds.size === 0) return;

    let addedCount = 0;
    let skippedCount = 0;

    for (const clipId of selectedIds) {
      if (this.isClipOnTimeline(clipId)) {
        skippedCount++;
        continue;
      }
      this.addClipToTimeline(clipId);
      addedCount++;
    }

    this.markDirty();

    if (addedCount > 0 && skippedCount > 0) {
      this.status.notify([`Added ${addedCount} new clip${addedCount > 1 ? 's' : ''} to timeline (skipped ${skippedCount} already in cut).`]);
    } else if (addedCount > 0) {
      this.status.notify([`Added ${addedCount} clip${addedCount > 1 ? 's' : ''} to timeline.`]);
    } else if (skippedCount > 0) {
      this.status.notify([`Selected media (${skippedCount} item${skippedCount > 1 ? 's' : ''}) is already on the timeline.`]);
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
    this.audioEngine.ensureContext();
    this.isPlaying.set(true);
  }

  pause(): void {
    this.isPlaying.set(false);
    this.audioEngine.pauseAll();
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
    this.audioEngine.setMasterVolume(clamped, this.isMonitorMuted());
  }

  toggleMonitorMute(): void {
    const next = !this.isMonitorMuted();
    this.isMonitorMuted.set(next);
    this.audioEngine.setMasterVolume(this.monitorVolume(), next);
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
      this.audioEngine.setTrackVolume(trackId, clamped);
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
      this.v1AudioMode.set(nextMuted ? 'Always' : 'Never');
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
    this.audioEngine.setTrackMute(trackId, nextMuted);
    this.markDirty();
  }

  isTrackMuted(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master'): boolean {
    if (trackId === 'V1') return this.trackV1Muted();
    if (trackId === 'V2') return this.trackV2Muted();
    if (trackId === 'A1') return this.trackA1Muted();
    if (trackId === 'A2') return this.trackA2Muted();
    return this.isMonitorMuted();
  }

  toggleGlobalDucking(enable?: boolean): void {
    const next = enable !== undefined ? enable : !this.isGlobalDuckingEnabled();
    this.isGlobalDuckingEnabled.set(next);
    this.audioEngine.setGlobalDuckingEnabled(next);
    this.markDirty();
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
      duckMode: 'Normal',
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

  setClipDuckMode(clipId: string, mode: 'Normal' | 'Ducked' | 'MuteOnAudio' | 'LeadVoice'): void {
    const isTlItem = this.timelineItems().some((it) => it.id === clipId);
    if (isTlItem) {
      this.timelineItems.update((items) =>
        items.map((it) => (it.id === clipId ? { ...it, duckMode: mode } : it))
      );
      this.markDirty();
      return;
    }

    const targetIds = this.getTargetClipIds(clipId);
    for (const id of targetIds) {
      this.updateClipAudioSetting(id, { duckMode: mode });
    }
    this.markDirty();
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
          duckMode: 'Normal',
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

  setBatchDuckMode(mode: 'Normal' | 'Ducked' | 'MuteOnAudio' | 'LeadVoice'): void {
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
          duckMode: 'Normal',
        };
        next[id] = { ...curr, duckMode: mode };
      }
      return next;
    });
    this.markDirty();
  }

  setAudioInspectorView(mode: 'auto' | 'clip' | 'mixer'): void {
    this.audioInspectorViewMode.set(mode);
    if (mode === 'clip' && !this.selectedClipId() && !this.selectedTimelineItemId() && this.selectedLibraryIds().size === 0) {
      const sched = this.currentScheduledClip();
      if (sched) {
        this.selectedClipId.set(sched.clip.id);
        this.selectedLibraryIds.set(new Set([sched.clip.id]));
      } else if (this.included().length > 0) {
        const first = this.included()[0].clip;
        this.selectedClipId.set(first.id);
        this.selectedLibraryIds.set(new Set([first.id]));
      }
    }
  }

  // Inspector Header Bar Controls
  setTargetScope(scope: 'selected' | 'current' | 'all' | 'under_music'): void {
    this.targetScope.set(scope);
    if (scope === 'current') {
      const curr = this.currentScheduledClip();
      if (curr) {
        this.selectedClipId.set(curr.clip.id);
      }
    } else if (scope === 'under_music') {
      const clips = this.clipsUnderMusic();
      const ids = new Set(clips.map((c) => c.id));
      this.selectedLibraryIds.set(ids);
      if (clips.length > 0) {
        this.selectedClipId.set(clips[0].id);
      }
    }
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

  selectScopeOption(scope: 'selected' | 'current' | 'all' | 'under_music'): void {
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
    if (scope === 'current') {
      const curr = this.currentScheduledClip();
      if (curr?.clip?.id) return [curr.clip.id];
      if (fallbackClipId) return fallbackList;
      const first = this.included()[0];
      return first ? [first.clip.id] : [];
    }
    if (scope === 'selected') {
      const selIds = Array.from(this.selectedLibraryIds());
      if (selIds.length > 0) return selIds;
      const selId = this.selectedClipId();
      if (selId) return [selId];
      const curr = this.currentScheduledClip();
      if (curr?.clip?.id) return [curr.clip.id];
      if (fallbackClipId) return fallbackList;
      const all = this.included().map((r) => r.clip.id);
      return all.length > 0 ? all : [];
    }
    // 'auto' scope fallback: selected -> current -> all
    const selIds = Array.from(this.selectedLibraryIds());
    if (selIds.length > 0) return selIds;
    const selId = this.selectedClipId();
    if (selId) return [selId];
    const curr = this.currentScheduledClip();
    if (curr?.clip?.id) return [curr.clip.id];
    if (fallbackClipId) return fallbackList;
    return this.included().map((r) => r.clip.id);
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
  splitClipAtPlayhead(): void {
    const t = this.currentTime();
    const sched = this.clipSchedule();
    const hit = sched.find((c) => t > c.startSeconds + 0.05 && t < c.endSeconds - 0.05);
    if (!hit) {
      this.status.notify(['No clip under playhead to split.']);
      return;
    }

    const splitOffset = t - hit.startSeconds;
    const origClip = hit.clip;
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
    if (total <= 0 || containerWidth <= 100) return;
    const targetPx = (containerWidth - 100) / total;
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
          this.audioEngine.setTrackMute(t.id as 'A1' | 'A2', nextMuted);
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

  setV1AudioMode(mode: 'Never' | 'MuteOnAudio' | 'Always'): void {
    this.v1AudioMode.set(mode);
    if (mode === 'Always') {
      this.trackV1Muted.set(true);
      this.status.notify(['All video clips muted (Music Only).']);
    } else if (mode === 'MuteOnAudio') {
      this.trackV1Muted.set(false);
      this.status.notify(['Video audio muted under background music (Auto-Duck).']);
    } else {
      this.trackV1Muted.set(false);
      this.status.notify(['All video audio active (Full Mix).']);
    }
    this.markDirty();
  }

  cycleV1AudioMode(): void {
    const current = this.v1AudioMode();
    const next = current === 'Never' ? 'MuteOnAudio' : current === 'MuteOnAudio' ? 'Always' : 'Never';
    this.v1AudioMode.set(next);
    this.markDirty();
    this.status.notify([`V1 Audio Mode: ${next}`]);
    this.setV1AudioMode(next);
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
    this.setInspectorTab('audio');
    this.setAudioInspectorView('clip');
    if (this.clipsUnderMusic().length > 0) {
      this.selectClipsUnderMusic();
    }
  }

  blockWidthPx(clip: Clip): number {
    const dur = clip.durationSeconds ?? 3;
    return Math.max(24, dur * this.pxPerSecond());
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
    this.markDirty();
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
    this.openJunctionKey.update((cur) => (cur === key ? null : key));
    this.selectedJunctionKey.set(key);
  }

  selectJunction(key: string | null): void {
    this.selectedJunctionKey.set(key);
  }

  openTransitionDialog(key?: string): void {
    if (key) {
      this.selectedJunctionKey.set(key);
      this.openJunctionKey.set(key);
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
    this.openJunctionKey.set(key);
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

  openPreview(junction: JunctionView): void {
    this.previewJunction.set({
      key: junction.key,
      leftClip: junction.left,
      rightClip: junction.right,
      transition: junction.transition,
      seconds: junction.seconds,
    });
    this.previewPlaying.set(true);
  }

  readonly previewPlaying = signal<boolean>(false);

  closePreview(): void {
    this.previewPlaying.set(false);
    this.previewJunction.set(null);
  }

  onPreviewAnimationEnd(): void {
    this.previewPlaying.set(false);
  }

  onPreviewVideoReady(event: Event, which: 'A' | 'B'): void {
    const video = event.target as HTMLVideoElement;
    if (which === 'A') {
      video.currentTime = Math.max((video.duration || 1) - 1.4, 0);
    } else {
      video.currentTime = 0;
    }
  }

  replayPreview(): void {
    this.previewPlaying.set(false);
    setTimeout(() => {
      this.previewPlaying.set(true);
    }, 50);
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
      this.markDirty();
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
  addMusicTrackFromAsset(assetId: string): void {
    const studio = this.studio();
    const candidate = studio?.musicCandidates?.find((m) => m.id === assetId);
    const dur = candidate?.durationSeconds ?? 10.0;
    const newTrack: MusicTrackRow = {
      key: `music_${Date.now()}`,
      assetId,
      startSeconds: 0,
      volume: 1.0,
      trimStartSeconds: 0,
      trimEndSeconds: dur,
    };
    this.musicTracks.update((t) => [...t, newTrack]);
    this.showTrackManually('A1');
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
      trackV1Volume: this.trackV1Volume(),
      trackV2Volume: this.trackV2Volume(),
      trackA1Volume: this.trackA1Volume(),
      trackA2Volume: this.trackA2Volume(),
      v1AudioMode: this.v1AudioMode(),
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
    if (draft.trackV1Volume !== undefined) this.trackV1Volume.set(draft.trackV1Volume);
    if (draft.trackV2Volume !== undefined) this.trackV2Volume.set(draft.trackV2Volume);
    if (draft.trackA1Volume !== undefined) this.trackA1Volume.set(draft.trackA1Volume);
    if (draft.trackA2Volume !== undefined) this.trackA2Volume.set(draft.trackA2Volume);
    if (draft.v1AudioMode !== undefined) this.v1AudioMode.set(draft.v1AudioMode);
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
    return s.volume !== 1 || !!s.audioAssetId || s.audioVolume !== 1 || !s.keepOriginalAudio || Boolean(s.duckMode && s.duckMode !== 'Normal');
  }

  timelineItemsPayload(): TimelineItem[] | null {
    const items = [...this.timelineItems()];
    // Include V1 primary video timeline items so backend receives their transforms/crops
    const schedule = this.clipSchedule();
    for (const entry of schedule) {
      const clipId = entry.clip.id;
      const realAssetId = this.resolveAssetId(entry.clip);
      const t = this.clipTransformSetting(clipId);
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
      const existingIdx = items.findIndex((it) => (it.trackId === 'V1' || it.trackId === 'video') && (it.src === clipId || it.id === clipId || it.src === realAssetId || it.id === `v1_${clipId}`));
      if (existingIdx >= 0) {
        items[existingIdx] = {
          ...items[existingIdx],
          src: realAssetId,
          transform: transformSpec,
          trimStartSeconds: entry.clip.trimStartSeconds,
          trimEndSeconds: entry.clip.trimEndSeconds,
        };
      } else {
        items.push({
          id: `v1_${clipId}`,
          type: 'video',
          trackId: 'V1',
          startTime: entry.startSeconds,
          duration: Math.max(0.1, entry.endSeconds - entry.startSeconds),
          src: realAssetId,
          name: entry.clip.name,
          transform: transformSpec,
          trimStartSeconds: entry.clip.trimStartSeconds,
          trimEndSeconds: entry.clip.trimEndSeconds,
        });
      }
    }
    if (items.length === 0) return null;
    return items.map((item) => ({
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
      duckMode: item.duckMode,
    }));
  }

  clipAudioPayload(): ClipAudioBody[] | null {
    const clips = this.included();
    const mode = this.v1AudioMode();
    const hasPerClipMuteOnAudio = clips.some((r) => {
      const d = this.clipSound(r.clip.id).duckMode;
      return d === 'MuteOnAudio' || d === 'Ducked';
    });
    const needsOverlapCheck = mode === 'MuteOnAudio' || hasPerClipMuteOnAudio;
    if (!needsOverlapCheck && !clips.some((r) => this.isClipSoundCustom(r.clip.id))) return null;

    const schedule = this.clipSchedule();
    const hasBg = this.musicAssetId() !== '';
    const available = new Set(this.studio()?.musicCandidates.map((a) => a.id) ?? []);
    const audioTimelineItems = this.timelineItems().filter((i) => i.type === 'audio' && !i.muted && (i.volume ?? 1.0) > 0);

    return clips.map((row) => {
      const sound = this.clipSound(row.clip.id);
      const assetId = sound.audioAssetId && available.has(sound.audioAssetId)
        ? sound.audioAssetId
        : null;

      let vol = sound.volume;
      const clipDuck = sound.duckMode ?? 'Normal';
      const s = schedule.find((x) => x.clip.id === row.clip.id);

      if (s) {
        const hasMusicOverlap = hasBg || this.musicTracks().some((t) => {
          const mStart = t.startSeconds;
          const mEnd = t.startSeconds + this.musicTrackDurationSeconds(t);
          return mStart < s.endSeconds && mEnd > s.startSeconds;
        });
        const hasTimelineAudioOverlap = audioTimelineItems.some((i) => {
          return i.startTime < s.endSeconds && (i.startTime + i.duration) > s.startSeconds;
        });
        const isOverlap = hasMusicOverlap || hasTimelineAudioOverlap;

        if (mode === 'Always') {
          vol = 0;
        } else if (clipDuck === 'MuteOnAudio') {
          if (isOverlap) vol = 0;
        } else if (clipDuck === 'Ducked') {
          vol = Math.round(sound.volume * this.videoDuckLevel() * 100) / 100;
        } else if (clipDuck === 'LeadVoice') {
          vol = sound.volume;
        } else if (mode === 'MuteOnAudio' && isOverlap) {
          vol = 0;
        }
      }

      let trimStart = sound.audioTrimStartSeconds ?? null;
      let trimEnd = sound.audioTrimEndSeconds ?? null;
      const sRef = schedule.find((x) => x.clip.id === row.clip.id);
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
        duckMode: sound.duckMode === 'MuteOnAudio' ? undefined : sound.duckMode,
      };
    });
  }

  private pollHandle: any = null;

  private startPolling(jobId: string): void {
    this.stopPolling();

    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);

          if (isTerminal(job.status)) {
            this.stopPolling();
            this.status.notify(job.warnings.map((w) => this.explainWarning(w)));
          }
        },
        error: () => this.stopPolling(),
      });
    }, 2000);
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

    this.status.run(
      this.api.mergeClips(projectId, {
        assetIds: includedClips,
        fit: this.fit(),
        transition: this.transition(),
        transitionSeconds: this.transition() === 'None' ? 0 : this.transitionSeconds(),
        junctions: this.junctionsList().map((j) => ({
          transition: j.transition,
          transitionSeconds: j.transition === 'None' ? 0 : j.seconds,
        })),
        muteClipAudio: this.v1AudioMode() === 'Always' || this.trackV1Muted(),
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: this.musicVolume(),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: t.volume,
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        timelineItems: this.timelineItemsPayload(),
        clipAudio: this.clipAudioPayload(),
        watermark: wm,
      }),
      (job: RenderJob) => {
        this.job.set(job);
        this.running.set(false);
        this.startPolling(job.jobId);
        this.status.notify(['Build started successfully.']);
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

    this.status.run(
      this.api.mergeClips(projectId, {
        assetIds: ids,
        fit: fitMode,
        outputWidth: 1080,
        outputHeight: 1920,
        transition: this.transition(),
        transitionSeconds: this.transition() === 'None' ? 0 : this.transitionSeconds(),
        junctions: this.junctionsList().map((j) => ({
          transition: j.transition,
          transitionSeconds: j.transition === 'None' ? 0 : j.seconds,
        })),
        muteClipAudio: this.v1AudioMode() === 'Always' || this.trackV1Muted(),
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: this.musicVolume(),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: t.volume,
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        timelineItems: this.timelineItemsPayload(),
        clipAudio: this.clipAudioPayload(),
        watermark: wm,
      }),
      (job: RenderJob) => {
        this.job.set(job);
        this.running.set(false);
        this.startPolling(job.jobId);
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
}
