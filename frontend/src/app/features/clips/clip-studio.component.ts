import { DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, concatMap, finalize, from, map, of } from 'rxjs';

import {
  Clip, ClipAudioBody, ClipFit, ClipOrder, ClipStudio, MAX_CLIP_GAIN, RenderJob,
  SHORTS_MAX_SECONDS, TRANSITIONS, WATERMARK_POSITIONS, WatermarkBody, WatermarkKind, WatermarkPosition,
  aspectRatioLabel, isTerminal, videoFormat,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

export interface ClipRow {
  clip: Clip;
  included: boolean;
}

export interface JunctionSetting {
  transition: string;
  seconds: number;
}

export interface JunctionView {
  key: string;
  left: Clip;
  right: Clip;
  transition: string;
  seconds: number;
}

export type SideUploadTarget =
  | { kind: 'logo' }
  | { kind: 'music' }
  | { kind: 'clip'; clipId: string };

export interface ClipAudioSetting {
  volume: number;
  audioAssetId: string;
  audioVolume: number;
  keepOriginalAudio: boolean;
  audioTrimStartSeconds?: number;
  audioTrimEndSeconds?: number;
}

export interface MusicTrackRow {
  key: string;
  assetId: string;
  startSeconds: number;
  volume: number;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
}

export interface ScheduledClip {
  clip: Clip;
  index: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  junctionTransition: string;
  junctionSeconds: number;
}

export interface FilterPreset {
  id: string;
  label: string;
  filter: string;
  swatch: string;
}

export interface MusicTrackRow {
  key: string;
  assetId: string;
  startSeconds: number;
  volume: number;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
}

/**
 * Modern Video Studio 2.0:
 * Real-time program monitor with live transition, watermark and audio playback,
 * color grading look filters, speed control, split/blade cut tool, interactive
 * Video editor: sequence video clips, fit them to the canvas, crossfade or wipe them,
 * overlay a watermark or branding, and stitch them into a single MP4 on the server.
 * Includes interactive master preview with live color grading looks, lower-third overlays,
 * multi-track timeline with magnetic snapping, and keyboard shortcuts.
 */
@Component({
  selector: 'app-clip-studio',
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './clip-studio.component.html',
  styleUrls: ['./clip-studio.component.css'],
})
export class ClipStudioComponent implements OnDestroy, AfterViewInit {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);
  readonly Math = Math;

  readonly transitions = TRANSITIONS;
  readonly positions = WATERMARK_POSITIONS;

  readonly watermarkKinds: readonly { kind: WatermarkKind; label: string }[] = [
    { kind: 'None', label: 'No watermark' },
    { kind: 'Text', label: 'Text or site address' },
    { kind: 'Logo', label: 'Logo image' },
  ];

  readonly filterPresets: readonly FilterPreset[] = [
    { id: 'none', label: 'Natural', filter: 'none', swatch: '#64748b' },
    { id: 'warm', label: 'Cinematic Warm', filter: 'sepia(0.2) contrast(1.1) brightness(1.04)', swatch: '#d97706' },
    { id: 'cool', label: 'Cool Sci-Fi', filter: 'hue-rotate(185deg) contrast(1.15)', swatch: '#0284c7' },
    { id: 'vivid', label: 'Vivid Pop', filter: 'saturate(1.5) contrast(1.12)', swatch: '#16a34a' },
    { id: 'golden', label: 'Golden Hour', filter: 'sepia(0.35) saturate(1.3) contrast(1.05) brightness(1.05)', swatch: '#f59e0b' },
    { id: 'teal-orange', label: 'Teal & Orange', filter: 'contrast(1.2) saturate(1.3) hue-rotate(-15deg)', swatch: '#0d9488' },
    { id: 'cyberpunk', label: 'Cyberpunk', filter: 'hue-rotate(280deg) saturate(1.7) contrast(1.25)', swatch: '#a855f7' },
    { id: 'noir', label: 'Film Noir', filter: 'grayscale(1) contrast(1.35) brightness(0.95)', swatch: '#1e293b' },
    { id: 'vintage', label: 'Faded 90s', filter: 'sepia(0.3) saturate(0.85) contrast(0.95) brightness(1.08)', swatch: '#b45309' },
  ];

  readonly studio = signal<ClipStudio | null>(null);
  readonly rows = signal<ClipRow[]>([]);

  // --- upload
  readonly dropActive = signal(false);
  readonly uploadTotal = signal(0);
  readonly uploadDone = signal(0);
  readonly uploading = computed(() => this.uploadTotal() > 0);

  readonly sideUpload = signal<SideUploadTarget | null>(null);

  // --- running order from text
  readonly orderText = signal('');
  readonly orderResult = signal<ClipOrder | null>(null);

  // --- watermark
  readonly watermarkSource = signal<'project' | 'custom' | 'none'>('project');
  readonly watermarkKind = signal<WatermarkKind>('None');
  readonly watermarkText = signal('');
  readonly watermarkLogoId = signal('');
  readonly watermarkPosition = signal<WatermarkPosition>('TopRight');
  readonly watermarkOpacity = signal(0.8);
  readonly watermarkHeight = signal(5.5);
  readonly watermarkMargin = signal(4);
  readonly watermarkColor = signal('#ffffff');
  readonly watermarkBackplate = signal(0.3);
  readonly globalWatermark = signal<WatermarkBody | null>(null);

  readonly activeLayer = signal<'A' | 'B'>('A');
  private loadedClipIdA: string | null = null;
  private loadedClipIdB: string | null = null;
  private lastPlayedClipIndex: number | null = null;
  private loadedSoundAssetId: string | null = null;
  private loadedMusicAssetId: string | null = null;

  // --- output
  readonly fit = signal<ClipFit>('Contain');
  readonly transition = signal<string>('None');
  readonly transitionSeconds = signal(0.5);
  readonly musicAssetId = signal('');
  readonly musicVolume = signal(0.18);
  readonly muteClipAudio = signal<"Never" | "Always" | "Overlap">("Never");

  // --- timeline scale, in pixels per second of finished video
  readonly pxPerSecond = signal(44);

  // --- per-junction transition overrides
  readonly junctionOverrides = signal<Map<string, JunctionSetting>>(new Map());
  readonly openJunctionKey = signal<string | null>(null);

  // --- per-clip sound
  readonly clipAudio = signal<Map<string, ClipAudioSetting>>(new Map());
  readonly openSoundClipId = signal<string | null>(null);

  readonly maxGain = MAX_CLIP_GAIN;

  // --- ViewChild references for live studio playback & DOM interactions
  @ViewChild('videoMonitorA') videoMonitorARef?: ElementRef<HTMLVideoElement>;
  @ViewChild('videoMonitorB') videoMonitorBRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('monitorContainer') monitorContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('timelineArea') timelineAreaRef?: ElementRef<HTMLElement>;
  @ViewChild('timelineInner') timelineInnerRef?: ElementRef<HTMLElement>;
  @ViewChild('bgMusicAudio') bgMusicAudioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('clipSoundAudio') clipSoundAudioRef?: ElementRef<HTMLAudioElement>;
  private timelineAudioElements: Map<string, HTMLAudioElement> = new Map();

  // --- Live Studio Monitor Player state
  readonly isPlaying = signal(false);
  readonly isLooping = signal(false);
  readonly playheadTime = signal(0);
  readonly playbackSpeed = signal<number>(1);
  readonly isMonitorMuted = signal<boolean>(false);
  readonly selectedClipId = signal<string | null>(null);
  readonly activeInspectorTab = signal<'clip' | 'effects' | 'audio' | 'export'>('clip');
  readonly isScrubbing = signal(false);
  readonly exportName = signal<string>('');
  readonly liveTransitionActive = signal(false);
  readonly liveTransitionClass = signal('');
  readonly liveTransitionDuration = signal(0.5);

  // --- Pro Monitor Controls & Guides
  readonly previewAspectOverride = signal<'auto' | '16:9' | '9:16' | '1:1' | '4:5'>('auto');
  readonly showShortsSafeZone = signal<boolean>(false);
  readonly showBroadcastSafeZone = signal<boolean>(false);
  readonly snapshotFlash = signal<boolean>(false);
  readonly monitorVolume = signal<number>(1);

  // --- Per-Clip In/Out Trims, Framing & Audio Fade
  readonly clipTrims = signal<Map<string, { startSeconds: number; endSeconds: number }>>(new Map());
  readonly clipFraming = signal<Map<string, { fit: 'Contain' | 'Cover'; zoom: number; panY: 'center' | 'top' | 'bottom' }>>(new Map());
  readonly clipAudioFade = signal<Map<string, { fadeInSeconds: number; fadeOutSeconds: number }>>(new Map());

  // --- Color grading look filters
  readonly activeFilter = signal<string>('none');
  readonly filterBrightness = signal<number>(100);
  readonly filterContrast = signal<number>(100);
  readonly filterSaturation = signal<number>(100);
  readonly filterSepia = signal<number>(0);
  readonly filterBlur = signal<number>(0);

  // --- Lower-third title card
  readonly lowerThirdEnabled = signal<boolean>(false);
  readonly lowerThirdTitle = signal<string>('');
  readonly lowerThirdSubtitle = signal<string>('');

  // --- Draft saving & unsaved changes tracking
  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly lastSavedTime = signal<string | null>(null);
  readonly restoredDraftTime = signal<string | null>(null);
  private isInitialized = false;

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  markDirty(): void {
    this.hasUnsavedChanges.set(true);
  }

  // --- Shortcuts modal
  readonly showShortcutsModal = signal<boolean>(false);

  private animFrameId: number | null = null;
  private lastTickMs: number = 0;

  // --- the in-browser transition preview (dialog)
  readonly previewJunction = signal<{
    key: string; leftClip: Clip; rightClip: Clip; transition: string; seconds: number;
  } | null>(null);
  readonly previewPlaying = signal(false);
  private previewVideoA: HTMLVideoElement | null = null;
  private previewVideoB: HTMLVideoElement | null = null;

  // --- music track lane
  readonly musicTracks = signal<MusicTrackRow[]>([]);
  readonly addMusicAssetId = signal('');
  private musicDrag: { key: string; startClientX: number; startSeconds: number } | null = null;
  private musicTrim:
    { key: string; edge: 'start' | 'end'; startClientX: number; startValue: number } | null = null;

  // --- the job
  readonly job = signal<RenderJob | null>(null);
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  /** Reorder state. Held here so the row being dragged over can be highlighted. */
  readonly dragIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  readonly included = computed(() => this.rows().filter((r) => r.included));

  readonly includedWithIndex = computed(() =>
    this.rows()
      .map((row, index) => ({ row, index }))
      .filter((entry) => entry.row.included));

  readonly junctions = computed<JunctionView[]>(() => {
    const clips = this.included().map((r) => r.clip);
    const overrides = this.junctionOverrides();
    const list: JunctionView[] = [];

    for (let i = 0; i < clips.length - 1; i++) {
      const left = clips[i];
      const right = clips[i + 1];
      const key = this.junctionKey(left.id, right.id);
      const override = overrides.get(key);

      list.push({
        key,
        left,
        right,
        transition: override?.transition ?? this.transition(),
        seconds: override?.seconds ?? this.transitionSeconds(),
      });
    }

    return list;
  });

  readonly totalSeconds = computed(() => {
    const clips = this.included();
    const measured = clips.reduce((sum, r) => sum + (r.clip.durationSeconds ?? 0), 0);
    const overlap = this.junctions()
      .reduce((sum, j) => sum + (j.transition === 'None' ? 0 : j.seconds), 0);

    return Math.max(measured - overlap, 0);
  });

  readonly timelineSeconds = computed(() => {
    const musicEnd = this.musicTracks()
      .reduce((max, t) => Math.max(max, t.startSeconds + this.musicTrackDurationSeconds(t)), 0);

    return Math.max(this.totalSeconds(), musicEnd, 1);
  });

  readonly running = computed(() => {
    const current = this.job();
    return current !== null && !isTerminal(current.status);
  });

  readonly blockedReason = computed(() => {
    const studio = this.studio();
    if (!studio) return null;

    if (!studio.rendererAvailable) {
      return studio.unavailableReason
        ?? 'Video rendering is not configured on this server.';
    }

    if (this.rows().length === 0) return 'Add some video clips first.';
    if (this.included().length === 0) return 'Tick the clips you want in the video.';

    if (this.included().length > studio.maxClips)
      return `At most ${studio.maxClips} clips can go into one video.`;

    const wm = this.effectiveWatermark();
    if (wm.kind === 'Text' && wm.text.trim().length === 0)
      return 'Type the watermark text, or set the watermark to None.';

    if (wm.kind === 'Logo' && !wm.logoAssetId)
      return 'Choose the watermark image, or set the watermark to None.';

    if (this.musicTracks().length > studio.maxMusicTracks)
      return `At most ${studio.maxMusicTracks} music clips can go on the timeline.`;

    if (this.muteClipAudio() === 'Always' && !this.musicAssetId() && this.musicTracks().length === 0)
      return 'Muting the clips with no music would produce a silent video.';

    return null;
  });

  readonly effectiveWatermark = computed(() => {
    const src = this.watermarkSource();
    if (src === 'none') {
      return {
        kind: 'None' as WatermarkKind,
        text: '',
        logoAssetId: null as string | null,
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
      const gw = this.globalWatermark();
      if (gw && gw.kind !== 'None') {
        return {
          kind: (gw.kind as WatermarkKind) ?? 'None',
          text: gw.text ?? '',
          logoAssetId: gw.logoAssetId ?? null,
          position: (gw.position as WatermarkPosition) ?? 'TopRight',
          opacity: gw.opacity ?? 0.8,
          heightFraction: gw.heightFraction ?? 0.055,
          marginFraction: gw.marginFraction ?? 0.04,
          colorHex: gw.colorHex ?? '#ffffff',
          backplateOpacity: gw.backplateOpacity ?? 0.3,
        };
      }
      return {
        kind: 'None' as WatermarkKind,
        text: '',
        logoAssetId: null as string | null,
        position: 'TopRight' as WatermarkPosition,
        opacity: 0,
        heightFraction: 0.055,
        marginFraction: 0.04,
        colorHex: '#ffffff',
        backplateOpacity: 0.3,
      };
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
    if (wm.logoAssetId === this.globalWatermark()?.logoAssetId) {
      return this.api.globalLogoUrl();
    }
    return this.api.assetUrl(wm.logoAssetId);
  });

  readonly format = computed(() => {
    const project = this.store.project();
    return project ? videoFormat(project.width, project.height) : 'Video';
  });

  readonly aspect = computed(() => {
    const project = this.store.project();
    return project ? aspectRatioLabel(project.width, project.height) : '';
  });

  readonly formatClass = computed(() => (this.format() === 'Short' ? 'pill ok' : 'pill'));

  readonly overShortsLimit = computed(() =>
    this.format() !== 'Video' && this.totalSeconds() > SHORTS_MAX_SECONDS);

  readonly shortsMaxSeconds = SHORTS_MAX_SECONDS;

  // --- Live Studio Computed Schedules & Selectors ---

  readonly clipSchedule = computed<ScheduledClip[]>(() => {
    const rows = this.included();
    const junctions = this.junctions();
    const schedule: ScheduledClip[] = [];
    let currentStart = 0;

    for (let i = 0; i < rows.length; i++) {
      const clip = rows[i].clip;
      const dur = clip.durationSeconds ?? 3;
      const end = currentStart + dur;
      const junction = i < junctions.length ? junctions[i] : null;
      const trans = junction?.transition ?? 'None';
      const transSec = trans === 'None' ? 0 : (junction?.seconds ?? 0);

      schedule.push({
        clip,
        index: i,
        startSeconds: currentStart,
        endSeconds: end,
        durationSeconds: dur,
        junctionTransition: trans,
        junctionSeconds: transSec,
      });

      currentStart = Math.max(end - transSec, 0);
    }

    return schedule;
  });

  readonly selectedClip = computed<Clip | null>(() => {
    const id = this.selectedClipId();
    if (id) {
      const match = this.rows().find((r) => r.clip.id === id);
      if (match) return match.clip;
    }
    return this.included()[0]?.clip ?? null;
  });

  readonly selectedClipIndexInCut = computed<number>(() => {
    const sel = this.selectedClip();
    if (!sel) return -1;
    return this.included().findIndex((r) => r.clip.id === sel.id);
  });

  readonly currentScheduledClip = computed<ScheduledClip | null>(() => {
    const schedule = this.clipSchedule();
    if (schedule.length === 0) return null;
    const time = this.playheadTime();
    const found = schedule.find((s) => time >= s.startSeconds && time < s.endSeconds);
    return found ?? schedule[schedule.length - 1];
  });

  readonly formattedPlayheadTime = computed(() => {
    const total = Math.max(0, this.playheadTime());
    const mins = Math.floor(total / 60);
    const secs = (total % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  });

  readonly formattedTotalTime = computed(() => {
    const total = Math.max(0, this.totalSeconds());
    const mins = Math.floor(total / 60);
    const secs = (total % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  });

  readonly monitorScreenAspectClass = computed(() => {
    const override = this.previewAspectOverride();
    if (override === '9:16') return 'aspect-short';
    if (override === '1:1') return 'aspect-square';
    if (override === '4:5') return 'aspect-portrait';
    if (override === '16:9') return '';
    const fmt = this.format();
    if (fmt === 'Short') return 'aspect-short';
    if (fmt === 'Square') return 'aspect-square';
    return '';
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

  /** Combined CSS filter string for live grading preview on the monitor. */
  readonly computedMonitorFilter = computed(() => {
    const preset = this.filterPresets.find((p) => p.id === this.activeFilter());
    const baseFilter = preset && preset.id !== 'none' ? preset.filter : '';
    const b = this.filterBrightness() / 100;
    const c = this.filterContrast() / 100;
    const s = this.filterSaturation() / 100;
    const sep = this.filterSepia() / 100;
    const bl = this.filterBlur();

    const adjustments = `brightness(${b}) contrast(${c}) saturate(${s}) sepia(${sep}) blur(${bl}px)`;
    return baseFilter ? `${baseFilter} ${adjustments}` : adjustments;
  });

  resetColorGrading(): void {
    this.activeFilter.set('none');
    this.filterBrightness.set(100);
    this.filterContrast.set(100);
    this.filterSaturation.set(100);
    this.filterSepia.set(0);
    this.filterBlur.set(0);
  }

  readonly activeClipFraming = computed(() => {
    const id = this.selectedClipId();
    if (!id) return null;
    return this.clipFramingSetting(id);
  });

  readonly activeClipTransform = computed(() => {
    const framing = this.activeClipFraming();
    if (!framing || (framing.zoom === 100 && framing.panY === 'center')) return 'none';
    const scale = framing.zoom / 100;
    const yOffset = framing.panY === 'top' ? '-8%' : framing.panY === 'bottom' ? '8%' : '0%';
    return `scale(${scale}) translateY(${yOffset})`;
  });

  switchShape(): void {
    const project = this.store.project();
    if (!project) return;

    const width = project.height;
    const height = project.width;

    this.status.run(
      this.api.updateProject(project.id, {
        name: project.name,
        description: project.description ?? undefined,
        width,
        height,
        fps: project.fps,
        distributionIntent: project.distributionIntent,
        acceptShareAlikeObligation: project.acceptShareAlikeObligation,
        backgroundMusicAssetId: project.backgroundMusicAssetId ?? null,
        backgroundMusicVolume: project.backgroundMusicVolume,
      }),
      (updated) => {
        this.store.project.set(updated);
        this.status.notify([
          `This project is now ${videoFormat(updated.width, updated.height)} `
          + `(${updated.width}×${updated.height}). The clips are re-fitted to the new `
          + 'shape on the next build - nothing already uploaded was changed.',
        ]);
      });
  }

  constructor() {
    this.reload(true);
    this.api.getGlobalBranding().subscribe({
      next: (wm) => this.globalWatermark.set(wm),
      error: () => {},
    });

    // Auto-sync initial monitor frame as soon as clips are loaded into the studio
    effect(() => {
      const sched = this.clipSchedule();
      if (sched.length > 0) {
        setTimeout(() => {
          this.syncMediaElements(this.isPlaying());
        }, 80);
      }
    });

    // Auto-detect changes to studio signals and flag unsaved changes
    effect(() => {
      this.rows();
      this.clipTrims();
      this.clipFraming();
      this.clipAudioFade();
      this.clipAudio();
      this.junctionOverrides();
      this.musicTracks();
      this.musicAssetId();
      this.musicVolume();
      this.muteClipAudio();
      this.fit();
      this.transition();
      this.transitionSeconds();
      this.watermarkSource();
      this.watermarkKind();
      this.watermarkText();
      this.watermarkLogoId();
      this.watermarkPosition();
      this.watermarkOpacity();
      this.watermarkHeight();
      this.watermarkMargin();
      this.watermarkColor();
      this.watermarkBackplate();
      this.activeFilter();
      this.filterBrightness();
      this.filterContrast();
      this.filterSaturation();
      this.filterSepia();
      this.filterBlur();
      this.lowerThirdEnabled();
      this.lowerThirdTitle();
      this.lowerThirdSubtitle();

      if (this.isInitialized) {
        this.hasUnsavedChanges.set(true);
      }
    }, { allowSignalWrites: true });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.syncMediaElements(false);
    }, 150);
  }

  ngOnDestroy(): void {
    this.pausePlayback();
    this.stopPolling();
  }

  // --- Keyboard Shortcuts --------------------------------------------------

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Skip shortcut processing if typing in input, select or textarea
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      this.togglePlay();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.seekRelative(event.shiftKey ? -5 : -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.seekRelative(event.shiftKey ? 5 : 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.seekToTime(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.seekToTime(this.totalSeconds());
    } else if (event.key === 's' || event.key === 'S' || event.key === 'b' || event.key === 'B') {
      event.preventDefault();
      this.splitClipAtPlayhead();
    } else if (event.key === 'm' || event.key === 'M') {
      event.preventDefault();
      this.toggleMonitorMute();
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      this.toggleFullscreen();
    } else if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      this.showShortcutsModal.update((v) => !v);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      const selIdx = this.selectedClipIndexInCut();
      if (selIdx >= 0) {
        event.preventDefault();
        this.toggle(selIdx);
      }
    }
  }

  // --- getting clips in ----------------------------------------------------

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

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.upload(Array.from(files));
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.upload(Array.from(input.files));
    input.value = '';
  }

  private upload(files: File[]): void {
    const projectId = this.store.projectId();
    const studio = this.studio();
    if (!projectId || this.uploading()) return;

    const limit = studio?.maxClipUploadBytes ?? 0;
    const problems: string[] = [];
    const queue: File[] = [];

    for (const file of files) {
      if (!this.looksLikeVideo(file)) {
        problems.push(
          `"${file.name}" is not an MP4 video, so it was skipped. A watermark image or a `
          + 'music file goes in through its own box further down this page.');
        continue;
      }

      if (limit > 0 && file.size > limit) {
        problems.push(
          `"${file.name}" is ${this.megabytes(file.size)}MB, over the `
          + `${this.megabytes(limit)}MB limit, so it was skipped.`);
        continue;
      }

      queue.push(file);
    }

    if (queue.length === 0) {
      this.status.notify(problems);
      return;
    }

    this.uploadTotal.set(queue.length);
    this.uploadDone.set(0);

    from(queue)
      .pipe(
        concatMap((file) =>
          this.api.uploadAsset(projectId, file).pipe(
            map(() => null),
            catchError(() => of(`"${file.name}" could not be uploaded.`)))),
      )
      .subscribe({
        next: (failure) => {
          this.uploadDone.update((done) => done + 1);
          if (failure) problems.push(failure);
        },
        complete: () => {
          this.uploadTotal.set(0);
          this.uploadDone.set(0);
          this.status.notify(problems);
          this.reload(false);
        },
      });
  }

  onPickLogo(event: Event): void {
    this.pickOne(event, { kind: 'logo' });
  }

  onPickMusic(event: Event): void {
    this.pickOne(event, { kind: 'music' });
  }

  onPickClipSound(event: Event, clipId: string): void {
    this.pickOne(event, { kind: 'clip', clipId });
  }

  isUploadingFor(clipId: string): boolean {
    const target = this.sideUpload();
    return target?.kind === 'clip' && target.clipId === clipId;
  }

  private pickOne(event: Event, target: SideUploadTarget): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (file) this.uploadOne(file, target);
  }

  private uploadOne(file: File, target: SideUploadTarget): void {
    const projectId = this.store.projectId();
    if (!projectId || this.sideUpload() !== null) return;

    const limit = this.studio()?.maxImageOrAudioUploadBytes ?? 0;
    if (limit > 0 && file.size > limit) {
      this.status.notify([
        `"${file.name}" is ${this.megabytes(file.size)}MB, over the `
        + `${this.megabytes(limit)}MB limit for an image or an audio file.`,
      ]);
      return;
    }

    this.sideUpload.set(target);

    this.status.run(
      this.api.uploadAsset(projectId, file).pipe(finalize(() => this.sideUpload.set(null))),
      (asset) => {
        this.store.refreshAssets();

        const wanted = target.kind === 'logo' ? 'Image' : 'Audio';
        if (asset.kind !== wanted) {
          this.status.notify([
            `"${asset.name}" is ${asset.kind.toLowerCase()}, not ${wanted.toLowerCase()}. `
            + 'It was added to this project, but not used here.',
          ]);
          return;
        }

        this.reload(false, () => {
          switch (target.kind) {
            case 'logo':
              this.watermarkLogoId.set(asset.id);
              if (!asset.hasAlpha) {
                this.status.notify([
                  `"${asset.name}" has no transparency, so it will sit on the video as a `
                  + 'solid rectangle. A PNG with a transparent background looks better.',
                ]);
              }
              break;

            case 'music':
              this.addMusicAssetId.set(asset.id);
              break;

            case 'clip':
              this.setClipSound(target.clipId, asset.id);
              break;
          }
        });
      });
  }

  private looksLikeVideo(file: File): boolean {
    return file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
  }

  private megabytes(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(0);
  }

  // --- choosing & ordering -------------------------------------------------

  toggle(index: number): void {
    this.rows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, included: !row.included } : row)));
  }

  selectAll(included: boolean): void {
    this.rows.update((rows) => rows.map((row) => ({ ...row, included })));
  }

  readonly confirmingDelete = signal(false);

  removeFromLibrary(): void {
    const projectId = this.store.projectId();
    const ids = this.included().map((r) => r.clip.id);

    if (!projectId || ids.length === 0) {
      this.confirmingDelete.set(false);
      return;
    }

    this.status.run(this.api.deleteClips(projectId, ids), () => {
      this.confirmingDelete.set(false);
      this.store.refreshAssets();
      this.reload(false);
    });
  }

  move(index: number, delta: number): void {
    const target = index + delta;
    this.rows.update((rows) => {
      if (target < 0 || target >= rows.length) return rows;

      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    this.saveOrder();
  }

  moveToExplicitIndex(currentIndex: number, newDisplayIndex: number): void {
    if (newDisplayIndex < 1) newDisplayIndex = 1;
    
    this.rows.update((rows) => {
      const maxIndex = rows.length;
      if (newDisplayIndex > maxIndex) newDisplayIndex = maxIndex;
      
      const targetIndex = newDisplayIndex - 1;
      if (currentIndex === targetIndex) return rows;

      const next = [...rows];
      const [item] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    this.saveOrder();
  }

  onRowDragStart(index: number): void {
    this.dragIndex.set(index);
  }

  onRowDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  onRowDrop(index: number, event: DragEvent): void {
    event.preventDefault();

    const from = this.dragIndex();
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);

    if (from === null || from === index) return;

    this.rows.update((rows) => {
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    this.saveOrder();
  }

  onRowDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  reverse(): void {
    this.rows.update((rows) => [...rows].reverse());
    this.saveOrder();
  }

  sortByName(): void {
    const projectId = this.store.projectId();
    if (!projectId || this.rows().length === 0) return;

    const ids = this.rows().map((r) => r.clip.id);

    this.status.run(this.api.clipOrder(projectId, ids, ''), (order) => {
      this.applyOrder(order.assetIds);
      this.orderResult.set(null);
      this.saveOrder();
    });
  }

  applyTextOrder(): void {
    const projectId = this.store.projectId();
    const text = this.orderText().trim();
    if (!projectId || text.length === 0 || this.rows().length === 0) return;

    const ids = this.rows().map((r) => r.clip.id);

    this.status.run(this.api.clipOrder(projectId, ids, text), (order) => {
      this.applyOrder(order.assetIds);
      this.orderResult.set(order);
      this.saveOrder();
    });
  }

  keepOnlyNamed(): void {
    const order = this.orderResult();
    if (!order) return;

    const appended = new Set(order.appendedAssetIds);
    this.rows.update((rows) =>
      rows.map((row) => ({ ...row, included: !appended.has(row.clip.id) })));
  }

  private applyOrder(assetIds: string[]): void {
    const position = new Map(assetIds.map((id, index) => [id, index]));

    this.rows.update((rows) =>
      [...rows].sort((a, b) =>
        (position.get(a.clip.id) ?? Number.MAX_SAFE_INTEGER)
        - (position.get(b.clip.id) ?? Number.MAX_SAFE_INTEGER)));
  }

  private saveOrder(): void {
    this.markDirty();
    const projectId = this.store.projectId();
    if (!projectId) return;

    const uniqueAssetIds = Array.from(new Set(this.rows().map((row) => row.clip.id)));
    this.api.saveClipOrder(projectId, uniqueAssetIds).subscribe({
      error: () => this.status.notify(['Could not save the video order. Try the move again.']),
    });
  }

  // --- Draft State Persistence ---------------------------------------------

  saveDraft(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    const draftData = {
      projectId,
      savedAt: new Date().toISOString(),
      rows: this.rows().map((r) => ({
        clipId: r.clip.id,
        included: r.included,
      })),
      clipTrims: Array.from(this.clipTrims().entries()),
      clipFraming: Array.from(this.clipFraming().entries()),
      clipAudioFade: Array.from(this.clipAudioFade().entries()),
      clipAudio: Array.from(this.clipAudio().entries()),
      junctionOverrides: Array.from(this.junctionOverrides().entries()),
      musicTracks: this.musicTracks(),
      musicAssetId: this.musicAssetId(),
      musicVolume: this.musicVolume(),
      muteClipAudio: this.muteClipAudio() === 'Always',
      fit: this.fit(),
      transition: this.transition(),
      transitionSeconds: this.transitionSeconds(),
      watermarkSource: this.watermarkSource(),
      watermarkKind: this.watermarkKind(),
      watermarkText: this.watermarkText(),
      watermarkLogoId: this.watermarkLogoId(),
      watermarkPosition: this.watermarkPosition(),
      watermarkOpacity: this.watermarkOpacity(),
      watermarkHeight: this.watermarkHeight(),
      activeFilter: this.activeFilter(),
      filterBrightness: this.filterBrightness(),
      filterContrast: this.filterContrast(),
      filterSaturation: this.filterSaturation(),
      filterSepia: this.filterSepia(),
      filterBlur: this.filterBlur(),
      lowerThirdEnabled: this.lowerThirdEnabled(),
      lowerThirdTitle: this.lowerThirdTitle(),
      lowerThirdSubtitle: this.lowerThirdSubtitle(),
    };

    try {
      localStorage.setItem(`animstudio_clip_draft_${projectId}`, JSON.stringify(draftData));
    } catch {
      // ignore quota exceeded errors
    }

    const uniqueAssetIds = Array.from(new Set(this.rows().map((row) => row.clip.id)));
    if (uniqueAssetIds.length > 0) {
      this.api.saveClipOrder(projectId, uniqueAssetIds).subscribe({
        next: () => {},
        error: () => {},
      });
    }

    this.hasUnsavedChanges.set(false);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.lastSavedTime.set(timeStr);
    this.status.notify([`Draft saved at ${timeStr}`]);
  }

  loadDraftIfExists(projectId: string): void {
    try {
      const raw = localStorage.getItem(`animstudio_clip_draft_${projectId}`);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || draft.projectId !== projectId) return;

      if (Array.isArray(draft.rows) && draft.rows.length > 0) {
        const currentRows = this.rows();
        const rowMap = new Map(currentRows.map((r) => [r.clip.id, r]));
        const reconstructed: ClipRow[] = [];

        for (const dr of draft.rows) {
          const match = rowMap.get(dr.clipId);
          if (match) {
            reconstructed.push({ clip: match.clip, included: dr.included });
            rowMap.delete(dr.clipId);
          }
        }
        for (const remaining of rowMap.values()) {
          reconstructed.push(remaining);
        }
        this.rows.set(reconstructed);
      }

      if (Array.isArray(draft.clipTrims)) {
        this.clipTrims.set(new Map(draft.clipTrims));
      }
      if (Array.isArray(draft.clipFraming)) {
        this.clipFraming.set(new Map(draft.clipFraming));
      }
      if (Array.isArray(draft.clipAudioFade)) {
        this.clipAudioFade.set(new Map(draft.clipAudioFade));
      }
      if (Array.isArray(draft.clipAudio)) {
        this.clipAudio.set(new Map(draft.clipAudio));
      }
      if (Array.isArray(draft.junctionOverrides)) {
        this.junctionOverrides.set(new Map(draft.junctionOverrides));
      }
      if (Array.isArray(draft.musicTracks)) {
        this.musicTracks.set(draft.musicTracks);
      }
      if (typeof draft.musicAssetId === 'string') this.musicAssetId.set(draft.musicAssetId);
      if (typeof draft.musicVolume === 'number') this.musicVolume.set(draft.musicVolume);
      if (typeof draft.muteClipAudio === 'boolean') {
      this.muteClipAudio.set(draft.muteClipAudio ? 'Always' : 'Never');
    } else if (typeof draft.muteClipAudio === 'string') {
      this.muteClipAudio.set(draft.muteClipAudio as any);
    }
      if (draft.fit) this.fit.set(draft.fit);
      if (draft.transition) this.transition.set(draft.transition);
      if (typeof draft.transitionSeconds === 'number') this.transitionSeconds.set(draft.transitionSeconds);

      if (draft.watermarkSource) this.watermarkSource.set(draft.watermarkSource);
      if (draft.watermarkKind) this.watermarkKind.set(draft.watermarkKind);
      if (typeof draft.watermarkText === 'string') this.watermarkText.set(draft.watermarkText);
      if (typeof draft.watermarkLogoId === 'string') this.watermarkLogoId.set(draft.watermarkLogoId);
      if (draft.watermarkPosition) this.watermarkPosition.set(draft.watermarkPosition);
      if (typeof draft.watermarkOpacity === 'number') this.watermarkOpacity.set(draft.watermarkOpacity);
      if (typeof draft.watermarkHeight === 'number') this.watermarkHeight.set(draft.watermarkHeight);

      if (draft.activeFilter) this.activeFilter.set(draft.activeFilter);
      if (typeof draft.filterBrightness === 'number') this.filterBrightness.set(draft.filterBrightness);
      if (typeof draft.filterContrast === 'number') this.filterContrast.set(draft.filterContrast);
      if (typeof draft.filterSaturation === 'number') this.filterSaturation.set(draft.filterSaturation);
      if (typeof draft.filterSepia === 'number') this.filterSepia.set(draft.filterSepia);
      if (typeof draft.filterBlur === 'number') this.filterBlur.set(draft.filterBlur);

      if (typeof draft.lowerThirdEnabled === 'boolean') this.lowerThirdEnabled.set(draft.lowerThirdEnabled);
      if (typeof draft.lowerThirdTitle === 'string') this.lowerThirdTitle.set(draft.lowerThirdTitle);
      if (typeof draft.lowerThirdSubtitle === 'string') this.lowerThirdSubtitle.set(draft.lowerThirdSubtitle);

      if (draft.savedAt) {
        const d = new Date(draft.savedAt);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.restoredDraftTime.set(timeStr);
        this.lastSavedTime.set(timeStr);
      }
      this.hasUnsavedChanges.set(false);
    } catch {
      // ignore
    }
  }

  discardDraft(): void {
    const projectId = this.store.projectId();
    if (projectId) {
      localStorage.removeItem(`animstudio_clip_draft_${projectId}`);
    }
    this.isInitialized = false;
    this.restoredDraftTime.set(null);
    this.lastSavedTime.set(null);
    this.hasUnsavedChanges.set(false);
    this.clipTrims.set(new Map());
    this.clipFraming.set(new Map());
    this.clipAudioFade.set(new Map());
    this.clipAudio.set(new Map());
    this.junctionOverrides.set(new Map());
    this.musicTracks.set([]);
    this.resetColorGrading();
    this.reload(false, () => {
      setTimeout(() => {
        this.isInitialized = true;
      }, 200);
    });
    this.status.notify(['Draft discarded. Restored project defaults.']);
  }

  cutPosition(index: number): number {
    return this.rows().slice(0, index + 1).filter((r) => r.included).length;
  }

  matchClass(match: string): string {
    if (match === 'Matched') return 'pill ok';
    if (match === 'Unmatched') return 'pill err';
    return 'pill warn';
  }

  clipName(assetId: string | undefined): string {
    if (!assetId) return '';
    return this.rows().find((r) => r.clip.id === assetId)?.clip.name ?? '';
  }

  assetUrl(assetId: string): string {
    return this.api.assetUrl(assetId);
  }

  // --- timeline geometry & navigation ----------------------------------------

  secondsToPx(seconds: number): number {
    return seconds * this.pxPerSecond();
  }

  blockWidthPx(clip: Clip): number {
    return Math.max(this.secondsToPx(clip.durationSeconds ?? 3), 34);
  }

  zoom(delta: number): void {
    this.pxPerSecond.update((px) => Math.min(160, Math.max(12, px + delta)));
  }

  fitTimelineToScreen(): void {
    const container = this.timelineAreaRef?.nativeElement;
    const total = this.timelineSeconds();
    if (!container || total <= 0) return;

    const availableWidth = container.clientWidth - 40;
    const computedPx = Math.max(12, Math.min(160, Math.floor(availableWidth / total)));
    this.pxPerSecond.set(computedPx);
  }

  rulerTicks(): number[] {
    const total = this.timelineSeconds();
    const step = this.pxPerSecond() < 24 ? 10 : this.pxPerSecond() < 60 ? 5 : 2;
    const ticks: number[] = [];
    for (let t = 0; t <= total; t += step) ticks.push(t);
    return ticks;
  }

  // --- per-junction transitions ----------------------------------------------

  private junctionKey(leftId: string, rightId: string): string {
    return `${leftId}>${rightId}`;
  }

  toggleJunctionEditor(key: string): void {
    this.openJunctionKey.set(this.openJunctionKey() === key ? null : key);
  }

  setJunctionTransition(junction: JunctionView, value: string): void {
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      next.set(junction.key, { transition: value, seconds: junction.seconds });
      return next;
    });
  }

  setJunctionSeconds(junction: JunctionView, value: number): void {
    this.junctionOverrides.update((map) => {
      const next = new Map(map);
      next.set(junction.key, { transition: junction.transition, seconds: value });
      return next;
    });
  }

  resetJunction(key: string): void {
    this.junctionOverrides.update((map) => {
      if (!map.has(key)) return map;
      const next = new Map(map);
      next.delete(key);
      return next;
    });
  }

  isJunctionCustom(key: string): boolean {
    return this.junctionOverrides().has(key);
  }

  // --- per-clip sound ----------------------------------------------------------

  clipSoundAsset(clipId: string) {
    const assetId = this.clipSound(clipId).audioAssetId;
    return this.studio()?.musicCandidates.find((a) => a.id === assetId);
  }

  clipSound(clipId: string): ClipAudioSetting {
    return this.clipAudio().get(clipId)
      ?? { volume: 1, audioAssetId: '', audioVolume: 1, keepOriginalAudio: false };
  }

  isClipSoundCustom(clipId: string): boolean {
    return this.clipAudio().has(clipId);
  }

  toggleSoundEditor(clipId: string): void {
    this.openSoundClipId.update((open) => (open === clipId ? null : clipId));
  }

  setClipVolume(clipId: string, value: number): void {
    this.updateClipSound(clipId, (current) => ({
      ...current,
      volume: Math.min(Math.max(value, 0), MAX_CLIP_GAIN),
    }));
  }

  setClipSound(clipId: string, assetId: string): void {
    this.updateClipSound(clipId, (current) => ({ ...current, audioAssetId: assetId }));
  }

  setClipSoundTrimStart(clipId: string, seconds: number): void {
    this.updateClipSound(clipId, (c) => ({ ...c, audioTrimStartSeconds: seconds }));
  }

  setClipSoundTrimEnd(clipId: string, seconds: number): void {
    this.updateClipSound(clipId, (c) => ({ ...c, audioTrimEndSeconds: seconds }));
  }

  setClipSoundVolume(clipId: string, value: number): void {
    this.updateClipSound(clipId, (current) => ({
      ...current,
      audioVolume: Math.min(Math.max(value, 0), MAX_CLIP_GAIN),
    }));
  }

  setClipKeepOriginal(clipId: string, keep: boolean): void {
    this.updateClipSound(clipId, (current) => ({ ...current, keepOriginalAudio: keep }));
  }

  resetClipSound(clipId: string): void {
    this.clipAudio.update((map) => {
      if (!map.has(clipId)) return map;
      const next = new Map(map);
      next.delete(clipId);
      return next;
    });
  }

  clipSoundName(clipId: string): string | null {
    const id = this.clipSound(clipId).audioAssetId;
    if (!id) return null;

    return this.studio()?.musicCandidates.find((a) => a.id === id)?.name ?? 'Unknown file';
  }

  clipSoundSummary(clipId: string): string | null {
    if (!this.isClipSoundCustom(clipId)) return null;

    const sound = this.clipSound(clipId);
    const parts: string[] = [];
    const name = this.clipSoundName(clipId);

    if (name) {
      parts.push(sound.keepOriginalAudio ? `+ ${name}` : name);
    }

    if (!name || sound.keepOriginalAudio) {
      parts.push(sound.volume === 0
        ? 'own sound off'
        : `own sound ${Math.round(sound.volume * 100)}%`);
    }

    return parts.join(' · ');
  }

  private updateClipSound(
    clipId: string, change: (current: ClipAudioSetting) => ClipAudioSetting): void {
    const updated = change(this.clipSound(clipId));

    this.clipAudio.update((map) => {
      const next = new Map(map);
      if (updated.volume === 1 && !updated.audioAssetId) {
        next.delete(clipId);
      } else {
        next.set(clipId, updated);
      }
      return next;
    });
  }

  // --- live studio monitor player engine -------------------------------------

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pausePlayback();
    } else {
      if (this.playheadTime() >= this.totalSeconds() && this.totalSeconds() > 0) {
        this.seekToTime(0);
      }
      this.startPlayback();
    }
  }

  startPlayback(): void {
    if (this.clipSchedule().length === 0) return;
    this.isPlaying.set(true);
    this.lastTickMs = performance.now();
    this.syncMediaElements(true);
    this.scheduleNextTick();
  }

  pausePlayback(): void {
    this.isPlaying.set(false);
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.pauseAllMedia();
  }

  stopPlayback(): void {
    this.pausePlayback();
    this.seekToTime(0);
  }

  toggleLoop(): void {
    this.isLooping.update((v) => !v);
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed.set(speed);
    const videoA = this.videoMonitorARef?.nativeElement;
    const videoB = this.videoMonitorBRef?.nativeElement;
    if (videoA) videoA.playbackRate = speed;
    if (videoB) videoB.playbackRate = speed;
  }

  toggleMonitorMute(): void {
    this.isMonitorMuted.update((m) => !m);
    this.syncMediaElements(this.isPlaying());
  }

  toggleFullscreen(): void {
    const el = this.monitorContainerRef?.nativeElement;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  seekToTime(seconds: number): void {
    const clamped = Math.max(0, Math.min(seconds, this.timelineSeconds()));
    this.playheadTime.set(clamped);
    this.syncMediaElements(this.isPlaying());
  }

  seekRelative(deltaSeconds: number): void {
    this.seekToTime(this.playheadTime() + deltaSeconds);
  }

  setMonitorVolume(vol: number): void {
    this.monitorVolume.set(vol);
    const video = this.activeLayer() === 'A'
      ? this.videoMonitorARef?.nativeElement
      : this.videoMonitorBRef?.nativeElement;
    if (video) video.volume = this.isMonitorMuted() ? 0 : vol;
  }

  stepFrame(frames: number): void {
    const delta = frames * (1 / 30);
    this.seekToTime(this.playheadTime() + delta);
  }

  jumpToStart(): void {
    this.seekToTime(0);
  }

  jumpToEnd(): void {
    this.seekToTime(this.totalSeconds());
  }

  captureFrame(): void {
    const video = this.activeLayer() === 'A'
      ? this.videoMonitorARef?.nativeElement
      : this.videoMonitorBRef?.nativeElement;
    if (!video || video.videoWidth === 0) {
      this.status.notify(['Play or load video to capture a snapshot frame.']);
      return;
    }

    this.snapshotFlash.set(true);
    setTimeout(() => this.snapshotFlash.set(false), 300);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${this.playheadTime().toFixed(1)}s.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        this.status.notify([`Captured video frame at ${this.playheadTime().toFixed(1)}s as image.`]);
      }, 'image/jpeg', 0.92);
    } catch {
      this.status.notify(['Could not capture frame from video.']);
    }
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

  // --- In/Out Trimming Methods ---
  clipTrim(clipId: string): { startSeconds: number; endSeconds: number } | null {
    return this.clipTrims().get(clipId) ?? null;
  }

  setInPointAtPlayhead(clipId: string): void {
    const schedule = this.clipSchedule();
    const curr = schedule.find((s) => s.clip.id === clipId);
    if (!curr) return;
    const localTime = Math.max(0, this.playheadTime() - curr.startSeconds);
    const dur = curr.clip.durationSeconds ?? 5;
    const currentTrim = this.clipTrim(clipId) ?? { startSeconds: 0, endSeconds: dur };
    const newStart = Math.min(localTime, currentTrim.endSeconds - 0.25);
    this.clipTrims.update((m) => {
      const next = new Map(m);
      next.set(clipId, { startSeconds: newStart, endSeconds: currentTrim.endSeconds });
      return next;
    });
    this.markDirty();
    this.status.notify([`Trim In-point set to ${newStart.toFixed(1)}s`]);
  }

  setOutPointAtPlayhead(clipId: string): void {
    const schedule = this.clipSchedule();
    const curr = schedule.find((s) => s.clip.id === clipId);
    if (!curr) return;
    const localTime = Math.max(0, this.playheadTime() - curr.startSeconds);
    const dur = curr.clip.durationSeconds ?? 5;
    const currentTrim = this.clipTrim(clipId) ?? { startSeconds: 0, endSeconds: dur };
    const newEnd = Math.max(localTime, currentTrim.startSeconds + 0.25);
    this.clipTrims.update((m) => {
      const next = new Map(m);
      next.set(clipId, { startSeconds: currentTrim.startSeconds, endSeconds: newEnd });
      return next;
    });
    this.markDirty();
    this.status.notify([`Trim Out-point set to ${newEnd.toFixed(1)}s`]);
  }

  resetClipTrim(clipId: string): void {
    this.clipTrims.update((m) => {
      if (!m.has(clipId)) return m;
      const next = new Map(m);
      next.delete(clipId);
      return next;
    });
    this.markDirty();
    this.status.notify(['Reset clip trim to full length.']);
  }

  // --- Framing & Zoom Methods ---
  clipFramingSetting(clipId: string): { fit: 'Contain' | 'Cover'; zoom: number; panY: 'center' | 'top' | 'bottom' } {
    return this.clipFraming().get(clipId) ?? { fit: this.fit() === 'Cover' ? 'Cover' : 'Contain', zoom: 100, panY: 'center' };
  }

  setClipFramingFit(clipId: string, fit: 'Contain' | 'Cover'): void {
    this.clipFraming.update((m) => {
      const next = new Map(m);
      const current = this.clipFramingSetting(clipId);
      next.set(clipId, { ...current, fit });
      return next;
    });
    this.markDirty();
  }

  setClipFramingZoom(clipId: string, zoom: number): void {
    this.clipFraming.update((m) => {
      const next = new Map(m);
      const current = this.clipFramingSetting(clipId);
      next.set(clipId, { ...current, zoom });
      return next;
    });
    this.markDirty();
  }

  setClipFramingPan(clipId: string, panY: 'center' | 'top' | 'bottom'): void {
    this.clipFraming.update((m) => {
      const next = new Map(m);
      const current = this.clipFramingSetting(clipId);
      next.set(clipId, { ...current, panY });
      return next;
    });
    this.markDirty();
  }

  // --- Audio Fade Methods ---
  clipAudioFadeSetting(clipId: string): { fadeInSeconds: number; fadeOutSeconds: number } {
    return this.clipAudioFade().get(clipId) ?? { fadeInSeconds: 0, fadeOutSeconds: 0 };
  }

  setClipAudioFade(clipId: string, fadeInSeconds: number, fadeOutSeconds: number): void {
    this.clipAudioFade.update((m) => {
      const next = new Map(m);
      next.set(clipId, { fadeInSeconds, fadeOutSeconds });
      return next;
    });
    this.markDirty();
  }

  // --- Transition Quick Cycle ---
  cycleJunctionTransition(junction: JunctionView): void {
    const list = ['None', 'Dissolve', 'Fade', 'WipeLeft', 'WipeRight', 'SlideLeft', 'SlideRight', 'CircleOpen'];
    const curIdx = list.indexOf(junction.transition);
    const next = list[(curIdx + 1) % list.length];
    this.setJunctionTransition(junction, next);
    this.markDirty();
    this.status.notify([`Transition set to ${next} (${junction.seconds}s)`]);
  }

  prevClip(): void {
    const schedule = this.clipSchedule();
    if (schedule.length === 0) return;
    const time = this.playheadTime();
    const currIdx = schedule.findIndex((s) => time >= s.startSeconds && time < s.endSeconds);
    if (currIdx > 0) {
      this.seekToTime(schedule[currIdx - 1].startSeconds);
      this.selectedClipId.set(schedule[currIdx - 1].clip.id);
    } else {
      this.seekToTime(0);
    }
  }

  nextClip(): void {
    const schedule = this.clipSchedule();
    if (schedule.length === 0) return;
    const time = this.playheadTime();
    const currIdx = schedule.findIndex((s) => time >= s.startSeconds && time < s.endSeconds);
    if (currIdx >= 0 && currIdx < schedule.length - 1) {
      this.seekToTime(schedule[currIdx + 1].startSeconds);
      this.selectedClipId.set(schedule[currIdx + 1].clip.id);
    }
  }

  selectClip(clipId: string): void {
    this.selectedClipId.set(clipId);
    this.activeInspectorTab.set('clip');
  }

  selectAndSeekClip(clip: Clip): void {
    this.selectClip(clip.id);
    const sched = this.clipSchedule().find((s) => s.clip.id === clip.id);
    if (sched) {
      this.seekToTime(sched.startSeconds);
    }
  }

  // --- Blade / Split tool & Clip Duplication ---------------------------------

  splitClipAtPlayhead(): void {
    const schedule = this.clipSchedule();
    if (schedule.length === 0) return;

    const time = this.playheadTime();
    const curr = schedule.find((s) => time >= s.startSeconds && time < s.endSeconds);
    if (!curr) return;

    // Find the row in rows()
    const rows = [...this.rows()];
    const rowIndex = rows.findIndex((r) => r.clip.id === curr.clip.id);
    if (rowIndex < 0) return;

    // Duplicate clip right after it in the edit
    const targetClip = rows[rowIndex];
    const newEntry: ClipRow = {
      clip: targetClip.clip,
      included: true,
    };

    rows.splice(rowIndex + 1, 0, newEntry);
    this.rows.set(rows);
    this.saveOrder();
    this.status.notify([`Split "${targetClip.clip.name}" at ${time.toFixed(1)}s.`]);
  }

  duplicateClip(clipId: string): void {
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
    this.status.notify([`Duplicated "${targetClip.clip.name}".`]);
  }

  private syncMediaElements(playing: boolean): void {
    const schedule = this.clipSchedule();
    if (schedule.length === 0) return;

    const time = this.playheadTime();
    const curr = schedule.find((s) => time >= s.startSeconds && time < s.endSeconds)
      ?? schedule[schedule.length - 1];

    if (!curr) return;

    if (!this.isScrubbing()) {
      this.selectedClipId.set(curr.clip.id);
    }

    // Ping-pong layer switch when transitioning to next clip
    if (this.lastPlayedClipIndex !== null && curr.index !== this.lastPlayedClipIndex) {
      if (this.liveTransitionActive()) {
        this.liveTransitionActive.set(false);
        this.activeLayer.update((l) => (l === 'A' ? 'B' : 'A'));
      }
    }
    this.lastPlayedClipIndex = curr.index;

    const localTime = Math.max(0, time - curr.startSeconds);
    const videoA = this.videoMonitorARef?.nativeElement;
    const videoB = this.videoMonitorBRef?.nativeElement;
    const bgAudio = this.bgMusicAudioRef?.nativeElement;
    const clipSoundEl = this.clipSoundAudioRef?.nativeElement;

    const currentActiveIsA = this.activeLayer() === 'A';
    const currentActiveVideo = currentActiveIsA ? videoA : videoB;
    const currentStandbyVideo = currentActiveIsA ? videoB : videoA;

    const transSec = curr.junctionSeconds;
    const hasTrans = curr.junctionTransition !== 'None' && transSec > 0;
    const transStart = curr.endSeconds - transSec;
    const inTransition = hasTrans && time >= transStart && curr.index < schedule.length - 1;

    const sound = this.clipSound(curr.clip.id);
    let isOverlap = false;
    if (this.muteClipAudio() === 'Overlap') {
      const hasBg = this.musicAssetId() !== '';
      if (hasBg) {
        isOverlap = true;
      } else {
        isOverlap = this.musicTracks().some(t => {
          const mStart = t.startSeconds;
          const mEnd = t.startSeconds + this.musicTrackDurationSeconds(t);
          return mStart < curr.endSeconds && mEnd > curr.startSeconds;
        });
      }
    }
    const isMuted = this.isMonitorMuted() || this.muteClipAudio() === 'Always' || isOverlap;
    const clipVol = isMuted ? 0 : Math.min(1, sound.volume);
    const speed = this.playbackSpeed();

    // 1. Synchronize the active playing video
    if (currentActiveVideo) {
      const activeLoadedId = currentActiveIsA ? this.loadedClipIdA : this.loadedClipIdB;
      if (activeLoadedId !== curr.clip.id) {
        if (currentActiveIsA) this.loadedClipIdA = curr.clip.id;
        else this.loadedClipIdB = curr.clip.id;
        currentActiveVideo.src = this.assetUrl(curr.clip.id);
        currentActiveVideo.currentTime = Math.max(0.001, localTime);
        currentActiveVideo.load();
      } else if (!playing || (Math.abs(currentActiveVideo.currentTime - localTime) > 0.4 && !currentActiveVideo.seeking)) {
        currentActiveVideo.currentTime = Math.max(0.001, localTime);
      }
      currentActiveVideo.volume = this.isMonitorMuted() ? 0 : this.monitorVolume() * clipVol;
      currentActiveVideo.muted = isMuted;
      currentActiveVideo.playbackRate = speed;
      if (playing) {
        if (currentActiveVideo.paused) currentActiveVideo.play().catch(() => undefined);
      } else {
        if (!currentActiveVideo.paused) currentActiveVideo.pause();
      }
    }

    // 2. Synchronize the standby video: transition or preloading
    const nextSched = curr.index < schedule.length - 1 ? schedule[curr.index + 1] : null;

    if (inTransition && nextSched && currentStandbyVideo) {
      const nextLocalTime = Math.max(0, time - transStart);
      const standbyLoadedId = currentActiveIsA ? this.loadedClipIdB : this.loadedClipIdA;
      if (standbyLoadedId !== nextSched.clip.id) {
        if (currentActiveIsA) this.loadedClipIdB = nextSched.clip.id;
        else this.loadedClipIdA = nextSched.clip.id;
        currentStandbyVideo.src = this.assetUrl(nextSched.clip.id);
        currentStandbyVideo.currentTime = nextLocalTime;
      } else if (!playing || (Math.abs(currentStandbyVideo.currentTime - nextLocalTime) > 0.4 && !currentStandbyVideo.seeking)) {
        currentStandbyVideo.currentTime = nextLocalTime;
      }
      currentStandbyVideo.volume = 0;
      currentStandbyVideo.muted = true;
      currentStandbyVideo.playbackRate = speed;
      if (playing) {
        if (currentStandbyVideo.paused) currentStandbyVideo.play().catch(() => undefined);
      } else {
        if (!currentStandbyVideo.paused) currentStandbyVideo.pause();
      }

      this.liveTransitionActive.set(true);
      this.liveTransitionClass.set(this.pvClassForTransition(curr.junctionTransition));
      this.liveTransitionDuration.set(transSec);
    } else {
      this.liveTransitionActive.set(false);
      // Preload next incoming clip onto the standby video layer so transitions start instantly
      if (nextSched && currentStandbyVideo) {
        const standbyLoadedId = currentActiveIsA ? this.loadedClipIdB : this.loadedClipIdA;
        if (standbyLoadedId !== nextSched.clip.id) {
          if (currentActiveIsA) this.loadedClipIdB = nextSched.clip.id;
          else this.loadedClipIdA = nextSched.clip.id;
          currentStandbyVideo.src = this.assetUrl(nextSched.clip.id);
          currentStandbyVideo.currentTime = 0;
          currentStandbyVideo.load();
        }
        if (!currentStandbyVideo.paused) {
          currentStandbyVideo.pause();
        }
      } else if (currentStandbyVideo && !currentStandbyVideo.paused) {
        currentStandbyVideo.pause();
      }
    }

    if (clipSoundEl) {
      if (sound.audioAssetId) {
        const trimStart = sound.audioTrimStartSeconds ?? 0;
        const trimEnd = sound.audioTrimEndSeconds ?? 999999;
        const audioLocalTime = localTime + trimStart;
        
        if (audioLocalTime > trimEnd) {
          if (!clipSoundEl.paused) clipSoundEl.pause();
        } else {
          if (this.loadedSoundAssetId !== sound.audioAssetId) {
            this.loadedSoundAssetId = sound.audioAssetId;
            clipSoundEl.src = this.assetUrl(sound.audioAssetId);
            clipSoundEl.currentTime = audioLocalTime;
          } else if (!playing || Math.abs(clipSoundEl.currentTime - audioLocalTime) > 0.35) {
            clipSoundEl.currentTime = audioLocalTime;
          }
          clipSoundEl.volume = this.isMonitorMuted() ? 0 : sound.audioVolume;
          clipSoundEl.muted = this.isMonitorMuted();
          clipSoundEl.playbackRate = speed;
          if (playing) {
            if (clipSoundEl.paused) clipSoundEl.play().catch(() => undefined);
          } else {
            if (!clipSoundEl.paused) clipSoundEl.pause();
          }
        }
      } else {
        clipSoundEl.pause();
        if (this.loadedSoundAssetId !== null) {
          this.loadedSoundAssetId = null;
          clipSoundEl.pause();
          clipSoundEl.removeAttribute('src');
          clipSoundEl.load();
        }
      }
    }

    // Sync Timeline Music Tracks
    const currentTracks = this.musicTracks();
    const validKeys = new Set(currentTracks.map(t => t.key));

    for (const [key, audio] of this.timelineAudioElements.entries()) {
      if (!validKeys.has(key)) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        this.timelineAudioElements.delete(key);
      }
    }

    for (const track of currentTracks) {
      let audio = this.timelineAudioElements.get(track.key);
      if (!audio) {
        audio = new Audio();
        audio.src = this.assetUrl(track.assetId);
        this.timelineAudioElements.set(track.key, audio);
      }

      const dur = this.musicTrackDurationSeconds(track);
      if (time >= track.startSeconds && time < track.startSeconds + dur) {
        const trackLocalTime = (time - track.startSeconds) + (track.trimStartSeconds ?? 0);
        
        if (Math.abs(audio.currentTime - trackLocalTime) > 0.35 || !playing) {
          audio.currentTime = trackLocalTime;
        }
        audio.volume = this.isMonitorMuted() ? 0 : track.volume;
        audio.muted = this.isMonitorMuted();
        audio.playbackRate = speed;

        if (playing) {
          if (audio.paused) audio.play().catch(() => undefined);
        } else {
          if (!audio.paused) audio.pause();
        }
      } else {
        if (!audio.paused) audio.pause();
      }
    }

    if (bgAudio) {
      const musicId = this.musicAssetId();
      if (musicId) {
        if (this.loadedMusicAssetId !== musicId) {
          this.loadedMusicAssetId = musicId;
          bgAudio.src = this.assetUrl(musicId);
        }
        bgAudio.volume = this.isMonitorMuted() ? 0 : this.musicVolume();
        bgAudio.muted = this.isMonitorMuted();
        bgAudio.playbackRate = speed;
        if (playing) {
          if (bgAudio.paused) bgAudio.play().catch(() => undefined);
        } else {
          if (!bgAudio.paused) bgAudio.pause();
        }
      } else {
        bgAudio.pause();
        if (this.loadedMusicAssetId !== null) {
          this.loadedMusicAssetId = null;
          bgAudio.pause();
          bgAudio.removeAttribute('src');
          bgAudio.load();
        }
      }
    }
  }

  private pauseAllMedia(): void {
    this.videoMonitorARef?.nativeElement.pause();
    this.videoMonitorBRef?.nativeElement.pause();
    this.bgMusicAudioRef?.nativeElement.pause();
    this.clipSoundAudioRef?.nativeElement.pause();
    for (const audio of this.timelineAudioElements.values()) {
      audio.pause();
    }
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

  private scheduleNextTick(): void {
    if (!this.isPlaying()) return;
    this.animFrameId = requestAnimationFrame((now) => {
      if (!this.isPlaying()) return;

      const activeEl = this.activeLayer() === 'A'
        ? this.videoMonitorARef?.nativeElement
        : this.videoMonitorBRef?.nativeElement;

      // If active video is buffering or seeking, pause tick progression until ready
      if (activeEl && (activeEl.seeking || (activeEl.readyState < 2 && !activeEl.paused))) {
        this.lastTickMs = now;
        this.scheduleNextTick();
        return;
      }

      const delta = ((now - this.lastTickMs) / 1000) * this.playbackSpeed();
      this.lastTickMs = now;

      const safeDelta = Math.min(Math.max(delta, 0), 0.25);
      let nextTime = this.playheadTime() + safeDelta;

      // Synchronize with active video playback position
      if (activeEl && !activeEl.paused && !activeEl.seeking && activeEl.readyState >= 2) {
        const schedule = this.clipSchedule();
        const curr = schedule.find((s) => this.playheadTime() >= s.startSeconds && this.playheadTime() < s.endSeconds);
        if (curr) {
          const videoTime = curr.startSeconds + activeEl.currentTime;
          if (Math.abs(videoTime - nextTime) < 0.25) {
            nextTime = videoTime;
          }
        }
      }

      const total = this.totalSeconds();

      if (nextTime >= total && total > 0) {
        if (this.isLooping()) {
          this.seekToTime(0);
          this.scheduleNextTick();
        } else {
          this.seekToTime(total);
          this.pausePlayback();
        }
        return;
      }

      this.playheadTime.set(nextTime);
      this.syncMediaElements(true);
      this.scheduleNextTick();
    });
  }

  onTimelineScrubDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.tl-clip') || target.closest('.tl-junction') || target.closest('.tl-music-clip')) {
      return;
    }
    event.preventDefault();
    this.isScrubbing.set(true);
    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {}
    this.handleTimelineScrubEvent(event);
  }

  onTimelineScrubMove(event: PointerEvent): void {
    if (!this.isScrubbing()) return;
    this.handleTimelineScrubEvent(event);
  }

  onTimelineScrubUp(event: PointerEvent): void {
    if (this.isScrubbing()) {
      this.isScrubbing.set(false);
      try {
        (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
      } catch {}
    }
  }

  private handleTimelineScrubEvent(event: PointerEvent): void {
    const el = this.timelineInnerRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, event.clientX - rect.left);
    let targetSeconds = x / this.pxPerSecond();

    // Magnetic snapping: check if within 0.25s of clip junctions
    const schedule = this.clipSchedule();
    for (const item of schedule) {
      if (Math.abs(targetSeconds - item.startSeconds) < 0.25) {
        targetSeconds = item.startSeconds;
        break;
      }
      if (Math.abs(targetSeconds - item.endSeconds) < 0.25) {
        targetSeconds = item.endSeconds;
        break;
      }
    }

    this.seekToTime(targetSeconds);
  }

  // --- legacy transition preview dialog -------------------------------------

  openPreview(junction: JunctionView): void {
    this.previewPlaying.set(false);
    this.previewVideoA = null;
    this.previewVideoB = null;
    this.previewJunction.set({
      key: junction.key,
      leftClip: junction.left,
      rightClip: junction.right,
      transition: junction.transition,
      seconds: junction.seconds,
    });
  }

  closePreview(): void {
    this.previewPlaying.set(false);
    this.previewJunction.set(null);
    this.previewVideoA = null;
    this.previewVideoB = null;
  }

  onPreviewVideoReady(event: Event, which: 'A' | 'B'): void {
    const video = event.target as HTMLVideoElement;
    if (which === 'A') {
      this.previewVideoA = video;
      video.currentTime = Math.max(video.duration - 1.4, 0);
    } else {
      this.previewVideoB = video;
      video.currentTime = 0;
    }
  }

  replayPreview(): void {
    this.previewPlaying.set(false);
    this.previewVideoA?.pause();
    this.previewVideoB?.pause();

    if (this.previewVideoA) this.previewVideoA.currentTime = Math.max(this.previewVideoA.duration - 1.4, 0);
    if (this.previewVideoB) this.previewVideoB.currentTime = 0;

    setTimeout(() => {
      this.previewPlaying.set(true);
      this.previewVideoA?.play().catch(() => undefined);
      this.previewVideoB?.play().catch(() => undefined);
    });
  }

  onPreviewAnimationEnd(): void {
    this.previewPlaying.set(false);
    this.previewVideoA?.pause();
    this.previewVideoB?.pause();
  }

  previewClass(): string {
    const pj = this.previewJunction();
    if (!pj || pj.transition === 'None') return 'pv-cut';
    return this.pvClassForTransition(pj.transition);
  }

  // --- music track lane --------------------------------------------------------

  addMusicTrack(): void {
    const assetId = this.addMusicAssetId();
    if (!assetId) return;

    const key = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    this.musicTracks.update((tracks) => [
      ...tracks,
      { key, assetId, startSeconds: 0, volume: 0.5, trimStartSeconds: null, trimEndSeconds: null },
    ]);
    this.addMusicAssetId.set('');
  }

  removeMusicTrack(key: string): void {
    this.musicTracks.update((tracks) => tracks.filter((t) => t.key !== key));
  }

  musicTrackAsset(track: MusicTrackRow) {
    return this.studio()?.musicCandidates.find((a) => a.id === track.assetId);
  }

  musicTrackName(track: MusicTrackRow): string {
    return this.musicTrackAsset(track)?.name ?? 'Unknown file';
  }

  musicTrackDurationSeconds(track: MusicTrackRow): number {
    const total = this.musicTrackAsset(track)?.durationSeconds ?? 6;
    const start = track.trimStartSeconds ?? 0;
    const end = track.trimEndSeconds ?? total;
    return Math.max(end - start, 0.25);
  }

  setMusicVolume(key: string, value: number): void {
    this.musicTracks.update((tracks) =>
      tracks.map((t) => (t.key === key ? { ...t, volume: value } : t)));
  }

  onMusicBlockPointerDown(track: MusicTrackRow, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.musicDrag = { key: track.key, startClientX: event.clientX, startSeconds: track.startSeconds };
  }

  onMusicTrimPointerDown(track: MusicTrackRow, edge: 'start' | 'end', event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const total = this.musicTrackAsset(track)?.durationSeconds ?? this.musicTrackDurationSeconds(track);
    const startValue = edge === 'start' ? (track.trimStartSeconds ?? 0) : (track.trimEndSeconds ?? total);

    this.musicTrim = { key: track.key, edge, startClientX: event.clientX, startValue };
  }

  onTimelinePointerMove(event: PointerEvent): void {
    if (this.isScrubbing()) {
      this.handleTimelineScrubEvent(event);
      return;
    }

    const perSecond = this.pxPerSecond();

    if (this.musicDrag) {
      const drag = this.musicDrag;
      const next = Math.max(0, drag.startSeconds + (event.clientX - drag.startClientX) / perSecond);
      this.musicTracks.update((tracks) =>
        tracks.map((t) => (t.key === drag.key ? { ...t, startSeconds: next } : t)));
      return;
    }

    if (this.musicTrim) {
      const trim = this.musicTrim;
      const next = Math.max(0, trim.startValue + (event.clientX - trim.startClientX) / perSecond);

      this.musicTracks.update((tracks) => tracks.map((t) => {
        if (t.key !== trim.key) return t;

        if (trim.edge === 'start') {
          const end = t.trimEndSeconds;
          return { ...t, trimStartSeconds: end != null ? Math.min(next, Math.max(end - 0.25, 0)) : next };
        }

        const start = t.trimStartSeconds ?? 0;
        return { ...t, trimEndSeconds: Math.max(next, start + 0.25) };
      }));
    }
  }

  onTimelinePointerUp(): void {
    this.isScrubbing.set(false);
    this.musicDrag = null;
    this.musicTrim = null;
  }

  // --- building ------------------------------------------------------------

  build(): void {
    const projectId = this.store.projectId();
    if (!projectId || this.blockedReason() !== null) return;

    this.saveDraft();

    this.status.run(
      this.api.mergeClips(projectId, {
        assetIds: this.included().map((r) => r.clip.id),
        fit: this.fit(),
        transition: this.transition(),
        transitionSeconds: this.transition() === 'None' ? 0 : this.transitionSeconds(),
        junctions: this.junctions().map((j) => ({
          transition: j.transition,
          transitionSeconds: j.transition === 'None' ? 0 : j.seconds,
        })),
        muteClipAudio: this.muteClipAudio() === 'Always',
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: this.musicVolume(),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: t.volume,
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        clipAudio: this.clipAudioPayload(),
        watermark: {
          kind: this.effectiveWatermark().kind,
          text: this.effectiveWatermark().text.trim() || null,
          logoAssetId: this.effectiveWatermark().logoAssetId || null,
          position: this.effectiveWatermark().position,
          opacity: this.effectiveWatermark().opacity,
          heightFraction: this.effectiveWatermark().heightFraction,
          marginFraction: this.effectiveWatermark().marginFraction,
          colorHex: this.effectiveWatermark().colorHex,
          backplateOpacity: this.effectiveWatermark().backplateOpacity,
        },
      }),
      (job) => {
        this.job.set(job);
        this.startPolling(job.jobId);
      });
  }

  buildShort(clipIds?: string[]): void {
    const projectId = this.store.projectId();
    if (!projectId || this.blockedReason() !== null) return;

    const ids = clipIds && clipIds.length > 0
      ? clipIds
      : this.included().map((r) => r.clip.id);

    if (ids.length === 0) return;

    this.saveDraft();

    // Respect user's selected fit mode (e.g. BlurredBackdrop to protect original corner logos)
    const fitMode: ClipFit = this.fit() === 'BlurredBackdrop'
      ? 'BlurredBackdrop'
      : (this.fit() === 'Contain' ? 'Contain' : 'Cover');

    this.status.run(
      this.api.mergeClips(projectId, {
        assetIds: ids,
        fit: fitMode,
        outputWidth: 1080,
        outputHeight: 1920,
        transition: this.transition(),
        transitionSeconds: this.transition() === 'None' ? 0 : this.transitionSeconds(),
        junctions: this.junctions().map((j) => ({
          transition: j.transition,
          transitionSeconds: j.transition === 'None' ? 0 : j.seconds,
        })),
        muteClipAudio: this.muteClipAudio() === 'Always',
        backgroundMusicAssetId: this.musicAssetId() || null,
        backgroundMusicVolume: this.musicVolume(),
        musicTracks: this.musicTracks().map((t) => ({
          assetId: t.assetId,
          startSeconds: t.startSeconds,
          volume: t.volume,
          trimStartSeconds: t.trimStartSeconds,
          trimEndSeconds: t.trimEndSeconds,
        })),
        clipAudio: this.clipAudioPayload(),
        watermark: {
          kind: this.effectiveWatermark().kind,
          text: this.effectiveWatermark().text.trim() || null,
          logoAssetId: this.effectiveWatermark().logoAssetId || null,
          position: this.effectiveWatermark().position,
          opacity: this.effectiveWatermark().opacity,
          heightFraction: this.effectiveWatermark().heightFraction,
          marginFraction: this.effectiveWatermark().marginFraction,
          colorHex: this.effectiveWatermark().colorHex,
          backplateOpacity: this.effectiveWatermark().backplateOpacity,
        },
      }),
      (job) => {
        this.job.set(job);
        this.startPolling(job.jobId);
        this.status.notify(['Started building vertical Short (9:16) video!']);
      });
  }

  exportClipAsShort(clipId: string): void {
    this.buildShort([clipId]);
  }

  private clipAudioPayload(): ClipAudioBody[] | null {
    const clips = this.included();
    const needsOverlapCheck = this.muteClipAudio() === 'Overlap';
    if (!needsOverlapCheck && !clips.some((r) => this.isClipSoundCustom(r.clip.id))) return null;

    const schedule = this.clipSchedule();
    const hasBg = this.musicAssetId() !== '';
    const available = new Set(this.studio()?.musicCandidates.map((a) => a.id) ?? []);

    return clips.map((row) => {
      const sound = this.clipSound(row.clip.id);
      const assetId = sound.audioAssetId && available.has(sound.audioAssetId)
        ? sound.audioAssetId
        : null;
        
      let vol = sound.volume;
      if (needsOverlapCheck) {
        const s = schedule.find(x => x.clip.id === row.clip.id);
        if (s) {
           let isOverlap = hasBg;
           if (!hasBg) {
             isOverlap = this.musicTracks().some(t => {
                const mStart = t.startSeconds;
                const mEnd = t.startSeconds + this.musicTrackDurationSeconds(t);
                return mStart < s.endSeconds && mEnd > s.startSeconds;
             });
           }
           if (isOverlap) vol = 0;
        }
      }

      return {
        volume: vol,
        audioAssetId: assetId,
        audioVolume: sound.audioVolume,
        keepOriginalAudio: sound.keepOriginalAudio,
        trimStartSeconds: sound.audioTrimStartSeconds ?? null,
        trimEndSeconds: sound.audioTrimEndSeconds ?? null,
      };
    });
  }

  cancel(): void {
    const current = this.job();
    if (current) this.status.run(this.api.cancelJob(current.jobId));
  }

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  statusClass(jobStatus: string): string {
    if (jobStatus === 'Completed' || jobStatus === 'CompletedWithWarnings') return 'pill ok';
    if (jobStatus === 'Failed') return 'pill err';
    if (jobStatus === 'Cancelled') return 'pill warn';
    return 'pill';
  }

  // --- loading -------------------------------------------------------------

  private reload(firstLoad: boolean, then?: () => void): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.clipStudio(projectId), (studio) => {
      this.studio.set(studio);

      if (firstLoad && studio.defaultWatermarkText) {
        this.watermarkText.set(studio.defaultWatermarkText);
        this.watermarkKind.set('Text');
      }

      const previous = new Map(this.rows().map((row) => [row.clip.id, row]));
      const byId = new Map(studio.clips.map((clip) => [clip.id, clip]));

      const kept = this.rows()
        .filter((row) => byId.has(row.clip.id))
        .map((row) => ({ clip: byId.get(row.clip.id)!, included: row.included }));

      const added = studio.clips
        .filter((clip) => !previous.has(clip.id))
        .map((clip) => ({ clip, included: true }));

      this.rows.set([...kept, ...added]);

      if (firstLoad) {
        this.reattach(projectId);
        this.loadDraftIfExists(projectId);
        setTimeout(() => {
          this.isInitialized = true;
        }, 200);
      }

      then?.();
    });
  }

  private reattach(projectId: string): void {
    this.api.listJobs(projectId).subscribe({
      next: (jobs) => {
        const active = jobs.find((j) => j.kind === 'ClipMerge' && !isTerminal(j.status))
          ?? jobs.find((j) => j.kind === 'ClipMerge');

        if (!active) return;

        this.job.set(active);
        if (!isTerminal(active.status)) this.startPolling(active.jobId);
      },
      error: () => undefined,
    });
  }

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
        return 'This server has no font available, so the text watermark was left off. '
          + 'A logo image would work.';
      default:
        return code;
    }
  }
}





