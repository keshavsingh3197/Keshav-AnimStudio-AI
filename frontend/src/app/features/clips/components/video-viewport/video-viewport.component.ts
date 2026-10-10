import {
  Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, computed, effect, inject, signal, untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorEraseRegion, MonitorTextBlock, StudioStateService } from '../../services/studio-state.service';
import { TEXT_REFERENCE_SHORT_SIDE, hexToRgba } from '../../services/text-overlay-layout';
import { erasePatchOrigin } from '../../services/erase-geometry';
import { ERASE_DEFAULT_STRENGTH, TimelineItemTransform } from '../../../../core/models/api.models';
import { MusicTrackRow, isCutEffectTrack, isVoiceoverTrack } from '../../models/clip-studio.models';

@Component({
  selector: 'app-video-viewport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-viewport.component.html',
  styleUrls: ['./video-viewport.component.css'],
})
export class VideoViewportComponent implements OnInit, OnDestroy {
  readonly state = inject(StudioStateService);

  // Guardrail 1: DOM References Isolated strictly in Viewport
  @ViewChild('videoMonitorA') videoMonitorARef?: ElementRef<HTMLVideoElement>;
  @ViewChild('videoMonitorB') videoMonitorBRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayVideoMonitor') overlayVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('bgMusicAudio') bgMusicAudioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('clipSoundAudio') clipSoundAudioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('voiceoverAudio') voiceoverAudioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('effectAudio') effectAudioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('monitorContainer') monitorContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('endCardVideo') endCardVideoRef?: ElementRef<HTMLVideoElement>;

  /** Playback has run past the last thing on the timeline into the end card. */
  readonly endCardActive = computed(() =>
    this.state.endCardPlaysInPreview() && this.state.currentTime() >= this.state.endCardStartSeconds() - 1e-3);

  // Dual-layer ping-pong state
  readonly activeLayer = signal<'A' | 'B'>('A');
  readonly liveTransitionActive = signal<boolean>(false);
  readonly liveTransitionType = signal<string>('Dissolve');
  readonly liveTransitionClass = signal<string>('');
  readonly liveTransitionDuration = signal<number>(0.5);

  private loadedClipIdA: string | null = null;
  private loadedClipIdB: string | null = null;
  private loadedMusicAssetId: string | null = null;
  private loadedVoiceoverAssetId: string | null = null;
  private loadedEffectAssetId: string | null = null;
  private loadedClipSoundAssetId: string | null = null;
  private animFrameId: number | null = null;
  private lastTickMs = 0;
  private lastPlayedClipIndex: number | null = null;
  private bufferWaitStartMs: number | null = null;
  private lastPrefetchSec = -1;
  private readonly prefetchedAssetIds = new Set<string>();

  constructor() {
    // React to Seek Requests
    effect(() => {
      const req = this.state.seekRequest();
      if (req) {
        untracked(() => this.syncSeek(req.time));
      }
    });

    // React to Play/Pause
    effect(() => {
      const playing = this.state.isPlaying();
      untracked(() => {
        if (playing) {
          this.startPlaybackLoop();
        } else {
          this.pausePlayback();
        }
      });
    });

    // The end card's own player follows play/pause, seeks and its arrival on screen.
    effect(() => {
      this.endCardActive();
      this.state.isPlaying();
      this.state.endCardMedia();
      untracked(() => setTimeout(() => this.syncEndCard(this.state.getCurrentTimeExact(), true)));
    });

    // React to Playback Speed
    effect(() => {
      const speed = this.state.playbackSpeed();
      untracked(() => this.updatePlaybackSpeed(speed));
    });

    // React to Volume & Mute Changes (Live acoustic feedback for video and audio sliders)
    effect(() => {
      this.state.monitorVolume();
      this.state.isMonitorMuted();
      this.state.trackV1Volume();
      this.state.trackA1Volume();
      this.state.trackA2Volume();
      this.state.isTrackMuted('V1');
      this.state.isTrackMuted('A1');
      this.state.isTrackMuted('A2');
      this.state.clipSounds();
      this.state.musicTracks();
      this.state.projectOverlapRule();
      this.state.duckLevel();

      untracked(() => {
        this.syncMediaElements(this.state.isPlaying());
      });
    });

    // Patch / Brand erase boxes are painted from the footage; start painting once their
    // canvases are in the DOM. The loop stops by itself when the last one goes.
    effect(() => {
      const patched = this.state.monitorEraseRegions()
        .some((m) => m.region.style === 'Patch' || m.region.style === 'Brand');
      if (patched) untracked(() => setTimeout(() => this.schedulePatchPaint()));
    });

    // React to Schedule or Clip Layout changes while paused to render current frame
    effect(() => {
      const sched = this.state.clipSchedule();
      const playing = this.state.isPlaying();
      if (!playing && sched.length > 0) {
        untracked(() => this.syncMediaElements(false));
      }
    });
  }

  ngOnInit(): void {
    // Initial sync
    setTimeout(() => {
      this.syncMediaElements(false);
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.patchFrameId !== null) {
      cancelAnimationFrame(this.patchFrameId);
      this.patchFrameId = null;
    }
    this.pauseAllMedia();
  }

  // Playback Loop Implementation
  private startPlaybackLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.bufferWaitStartMs = null;
    this.lastTickMs = performance.now();
    this.scheduleNextTick();
  }

  private scheduleNextTick(): void {
    if (!this.state.isPlaying()) return;

    this.animFrameId = requestAnimationFrame((now) => {
      if (!this.state.isPlaying()) return;

      const activeEl = this.activeLayer() === 'A'
        ? this.videoMonitorARef?.nativeElement
        : this.videoMonitorBRef?.nativeElement;

      // Pause tick progression if video is actively seeking/buffering (with max 500ms stall timeout)
      // Past the last clip the picture is a held frame, so nothing there is worth waiting on.
      const sched = this.state.clipSchedule();
      const pastPicture = sched.length > 0
        && this.state.getCurrentTimeExact() >= sched[sched.length - 1].endSeconds;
      const isBuffering = !pastPicture && Boolean(
        activeEl &&
        !activeEl.error &&
        (activeEl.seeking || (activeEl.readyState < 2 && !activeEl.paused))
      );

      if (isBuffering) {
        if (this.bufferWaitStartMs === null) {
          this.bufferWaitStartMs = now;
        }
        if (now - this.bufferWaitStartMs < 500) {
          this.lastTickMs = now;
          this.scheduleNextTick();
          return;
        }
      }
      this.bufferWaitStartMs = null;

      const delta = ((now - this.lastTickMs) / 1000) * this.state.playbackSpeed();
      this.lastTickMs = now;

      const safeDelta = Math.min(Math.max(delta, 0), 0.25);
      let nextTime = this.state.getCurrentTimeExact() + safeDelta;

      // Sync with active video playback timestamp (soft drift correction; never pins to 0 on start)
      if (activeEl && !activeEl.paused && !activeEl.seeking && activeEl.readyState >= 2 && activeEl.currentTime > 0.05) {
        const schedule = this.state.clipSchedule();
        const curr = schedule.find((s) => this.state.getCurrentTimeExact() >= s.startSeconds && this.state.getCurrentTimeExact() < s.endSeconds);
        if (curr) {
          const videoTime = curr.startSeconds + activeEl.currentTime;
          if (Math.abs(videoTime - nextTime) > 0.03 && Math.abs(videoTime - nextTime) < 0.3) {
            nextTime += (videoTime - nextTime) * 0.25;
          }
        }
      }

      // The end card is rendered on the server; ask for it a little before it is needed.
      if (this.state.endCardPlaysInPreview() && nextTime > this.state.endCardStartSeconds() - 5) {
        this.state.renderEndCardPreview();
      }

      const total = Math.max(this.state.totalSeconds(), this.state.previewEndSeconds());
      if (nextTime >= total && total > 0) {
        if (this.state.isLooping()) {
          this.state.seekTo(0);
          this.scheduleNextTick();
        } else {
          this.state.seekTo(total);
          this.state.pause();
        }
        return;
      }

      // Guardrail 2: Report exact continuous time, throttles reactive signal to 10fps
      this.state.reportPlaybackTime(nextTime);
      this.syncMediaElements(true);
      this.syncEndCard(nextTime, false);
      if (Math.abs(nextTime - this.lastPrefetchSec) > 1.5) {
        this.lastPrefetchSec = nextTime;
        this.prefetchUpcomingMedia();
      }
      this.scheduleNextTick();
    });
  }

  /** Keeps the end-card player on the timeline's clock; `hard` also re-seeks it. */
  private syncEndCard(time: number, hard: boolean): void {
    const el = this.endCardVideoRef?.nativeElement;
    if (!el) return;
    const local = Math.max(0, time - this.state.endCardStartSeconds());
    el.playbackRate = this.state.playbackSpeed();
    if (hard || Math.abs(el.currentTime - local) > 0.3) {
      if (el.readyState >= 1) el.currentTime = Math.min(local, Math.max(0, (el.duration || local) - 0.05));
    }
    if (this.state.isPlaying() && this.endCardActive()) {
      if (el.paused) el.play().catch(() => {});
    } else if (!el.paused) {
      el.pause();
    }
  }

  private pausePlayback(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.pauseAllMedia();
  }

  private pauseAllMedia(): void {
    this.videoMonitorARef?.nativeElement.pause();
    this.videoMonitorBRef?.nativeElement.pause();
    if (this.overlayVideoRef?.nativeElement && !this.overlayVideoRef.nativeElement.paused) {
      this.overlayVideoRef.nativeElement.pause();
    }
    this.endCardVideoRef?.nativeElement.pause();
    this.bgMusicAudioRef?.nativeElement.pause();
    this.clipSoundAudioRef?.nativeElement.pause();
    this.voiceoverAudioRef?.nativeElement.pause();
    this.effectAudioRef?.nativeElement.pause();
  }

  private syncSeek(time: number): void {
    this.syncEndCard(time, true);
    const activeEl = this.activeLayer() === 'A'
      ? this.videoMonitorARef?.nativeElement
      : this.videoMonitorBRef?.nativeElement;

    const sched = this.state.clipSchedule();
    const curr = sched.find((s) => time >= s.startSeconds && time < s.endSeconds) ?? sched[sched.length - 1];

    if (curr && activeEl) {
      const clipTrimStart = curr.clip.trimStartSeconds ?? 0;
      const localTime = Math.max(0.05, clipTrimStart + (time - curr.startSeconds));
      activeEl.currentTime = localTime;
    }

    // Immediately sync background music seek
    const bg = this.bgMusicAudioRef?.nativeElement;
    if (bg) {
      const activeMusic = this.state.musicTracks().find((t) => {
        if (isVoiceoverTrack(t) || isCutEffectTrack(t)) return false;
        const d = this.state.musicTrackDurationSeconds(t);
        return time >= t.startSeconds && time < (t.startSeconds + d);
      });
      if (activeMusic) {
        bg.currentTime = Math.max(0, (time - activeMusic.startSeconds) + (activeMusic.trimStartSeconds ?? 0));
      } else if (this.state.musicAssetId() !== '') {
        bg.currentTime = Math.max(0, time);
      }
    }

    this.syncMediaElements(this.state.isPlaying());
  }

  private updatePlaybackSpeed(speed: number): void {
    if (this.videoMonitorARef?.nativeElement) this.videoMonitorARef.nativeElement.playbackRate = speed;
    if (this.videoMonitorBRef?.nativeElement) this.videoMonitorBRef.nativeElement.playbackRate = speed;
    if (this.overlayVideoRef?.nativeElement) this.overlayVideoRef.nativeElement.playbackRate = speed;
    if (this.bgMusicAudioRef?.nativeElement) this.bgMusicAudioRef.nativeElement.playbackRate = speed;
    if (this.clipSoundAudioRef?.nativeElement) this.clipSoundAudioRef.nativeElement.playbackRate = speed;
    if (this.voiceoverAudioRef?.nativeElement) this.voiceoverAudioRef.nativeElement.playbackRate = speed;
    if (this.effectAudioRef?.nativeElement) this.effectAudioRef.nativeElement.playbackRate = speed;
  }



  togglePlayback(): void {
    // Synchronously initiate playback on media elements within user gesture to unlock audio
    if (!this.state.isPlaying()) {
      this.syncMediaElements(true);
      this.prefetchUpcomingMedia();
      const activeEl = this.activeLayer() === 'A'
        ? this.videoMonitorARef?.nativeElement
        : this.videoMonitorBRef?.nativeElement;
      if (activeEl && activeEl.paused) {
        activeEl.play().catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            activeEl.muted = true;
            activeEl.play().catch(() => undefined);
          }
        });
      }
      const bg = this.bgMusicAudioRef?.nativeElement;
      if (bg && bg.src && bg.paused) {
        bg.play().catch(() => undefined);
      }
    }
    this.state.togglePlayback();
  }

  /**
   * Look-ahead prefetching: Loads the next scenes (video, image, audio, overlays)
   * in advance so playback across cut transitions is instant with zero stutter.
   */
  private prefetchUpcomingMedia(): void {
    const schedule = this.state.clipSchedule();
    if (schedule.length === 0) return;
    const time = this.state.getCurrentTimeExact();
    const currIdx = schedule.findIndex((s) => time >= s.startSeconds && time < s.endSeconds);
    if (currIdx === -1) return;

    // Look ahead to next 2 clips
    for (let offset = 1; offset <= 2; offset++) {
      const upcomingIdx = currIdx + offset;
      if (upcomingIdx >= schedule.length) break;
      const upcoming = schedule[upcomingIdx];
      const assetId = this.state.resolveAssetId(upcoming.clip);
      if (!assetId) continue;

      const type = this.state.getClipType(upcoming.clip);
      if (type === 'image' && !this.prefetchedAssetIds.has(assetId)) {
        this.prefetchedAssetIds.add(assetId);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = this.state.assetUrl(assetId);
      } else if (type === 'video' && offset === 1) {
        const currentActiveIsA = this.activeLayer() === 'A';
        const standby = currentActiveIsA
          ? this.videoMonitorBRef?.nativeElement
          : this.videoMonitorARef?.nativeElement;
        if (standby) {
          const url = this.state.assetUrl(assetId);
          if (standby.src !== url) {
            if (currentActiveIsA) this.loadedClipIdB = assetId;
            else this.loadedClipIdA = assetId;
            standby.crossOrigin = 'anonymous';
            standby.src = url;
            standby.currentTime = upcoming.clip.trimStartSeconds ?? 0;
            standby.load();
          }
        }
      }

      // Preload replacement sound / soundtrack
      const sound = this.state.clipSound(upcoming.clip.id);
      if (sound?.audioAssetId && !this.prefetchedAssetIds.has(sound.audioAssetId)) {
        this.prefetchedAssetIds.add(sound.audioAssetId);
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audio.src = this.state.assetUrl(sound.audioAssetId);
      }
    }

    // Also prefetch upcoming V2 video overlays within 4 seconds ahead
    const v2Items = this.state.itemsForTrack('V2');
    const upcomingV2 = v2Items.find((v) => v.startTime > time && v.startTime <= time + 4);
    if (upcomingV2 && upcomingV2.src && !this.prefetchedAssetIds.has(upcomingV2.src)) {
      this.prefetchedAssetIds.add(upcomingV2.src);
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.preload = 'metadata';
      v.src = this.state.assetUrl(upcomingV2.src);
    }

    // Also prefetch upcoming V3 image overlays within 4 seconds ahead
    const v3Items = this.state.itemsForTrack('V3');
    const upcomingV3 = v3Items.find((img) => img.startTime > time && img.startTime <= time + 4);
    if (upcomingV3 && upcomingV3.src && !this.prefetchedAssetIds.has(upcomingV3.src)) {
      this.prefetchedAssetIds.add(upcomingV3.src);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.state.assetUrl(upcomingV3.src);
    }
  }

  // Core Sync of Dual-Layer Ping-Pong Video and Overlays
  private syncMediaElements(playing: boolean): void {
    const schedule = this.state.clipSchedule();
    if (schedule.length === 0) return;

    const time = this.state.getCurrentTimeExact();
    const curr = schedule.find((s) => time >= s.startSeconds && time < s.endSeconds)
      ?? schedule[schedule.length - 1];

    if (!curr) return;

    // Past the last clip only audio is left (a voiceover line that runs on): hold the final
    // frame. Seeking the video beyond its end kept it "seeking" on every tick, which stalled
    // the playhead there.
    const pastPicture = time >= schedule[schedule.length - 1].endSeconds;

    // Ping-pong layer switch when transitioning to next clip
    if (this.lastPlayedClipIndex !== null && curr.index !== this.lastPlayedClipIndex) {
      if (this.liveTransitionActive()) {
        this.liveTransitionActive.set(false);
        this.activeLayer.update((l) => (l === 'A' ? 'B' : 'A'));
      }
    }
    this.lastPlayedClipIndex = curr.index;

    const clipTrimStart = curr.clip.trimStartSeconds ?? 0;
    const localTime = Math.max(0, clipTrimStart + (time - curr.startSeconds));
    const videoA = this.videoMonitorARef?.nativeElement;
    const videoB = this.videoMonitorBRef?.nativeElement;

    const currentActiveIsA = this.activeLayer() === 'A';
    const currentActiveVideo = currentActiveIsA ? videoA : videoB;
    const currentStandbyVideo = currentActiveIsA ? videoB : videoA;

    const transSec = curr.junctionSeconds;
    const hasTrans = curr.junctionTransition !== 'None' && transSec > 0;
    const transStart = curr.endSeconds - transSec;
    const inTransition = hasTrans && time >= transStart && curr.index < schedule.length - 1;

    const sound = this.state.clipSound(curr.clip.id);
    // Same call the export path makes, so the preview is not a separate opinion.
    const overlap = this.state.resolveOverlap(curr.clip.id);

    // Check active audio sources on timeline at playhead time
    const a1Items = this.state.timelineItems().filter((i) => (i.trackId === 'A1' || i.trackId === 'A2') && i.type === 'audio');
    const currentTracks = this.state.musicTracks();

    const activeA1Item = a1Items.find((i) => time >= i.startTime && time < (i.startTime + i.duration));
    const isActiveTrack = (t: MusicTrackRow) => {
      const dur = this.state.musicTrackDurationSeconds(t);
      return time >= t.startSeconds && time < (t.startSeconds + dur);
    };
    // Voiceover lines get their own player so they are heard over music, as in the export.
    // Cut effects play over the music on a player of their own, not instead of it.
    const activeMusicTrack = currentTracks.find((t) => !isVoiceoverTrack(t) && !isCutEffectTrack(t) && isActiveTrack(t));
    const activeEffectTrack = currentTracks.find((t) => isCutEffectTrack(t) && isActiveTrack(t));
    const activeVoiceoverTrack = currentTracks.find((t) => isVoiceoverTrack(t) && isActiveTrack(t));
    const hasGlobalMusic = this.state.musicAssetId() !== '' && this.state.musicVolume() > 0;

    // Is any music or soundtrack cue active at THIS playhead time?
    const hasActiveMusicAtTime = Boolean(activeMusicTrack) || Boolean(activeVoiceoverTrack) || Boolean(activeA1Item) || hasGlobalMusic;

    // The clip's own level, attenuated only where music actually overlaps it.
    let effectiveClipGain = sound.volume * (hasActiveMusicAtTime ? overlap.videoGain : 1);

    // If replacement voiceover is active and user unchecked keepOriginalAudio
    if (sound.audioAssetId && !sound.keepOriginalAudio) {
      effectiveClipGain = 0;
    }

    if (this.state.isTrackMuted('V1')) {
      effectiveClipGain = 0;
    } else {
      effectiveClipGain *= this.state.trackV1Volume();
    }

    const nextSched = curr.index < schedule.length - 1 ? schedule[curr.index + 1] : null;
    const isNextImage = nextSched ? this.state.getClipType(nextSched.clip) === 'image' : false;

    const progress = inTransition && transSec > 0 ? Math.min(1, Math.max(0, (time - transStart) / transSec)) : 0;
    const offsetBeforeStart = Math.max(0, curr.endSeconds - time);
    const nextTrimStart = nextSched ? (nextSched.clip.trimStartSeconds ?? 0) : 0;
    const canBorrowHead = inTransition && !nextSched?.freezeHead && nextTrimStart >= offsetBeforeStart && offsetBeforeStart > 0;

    let nextClipVol = 0;
    let isNextVideoMuted = true;
    if (inTransition && nextSched && !isNextImage) {
      const nextSound = this.state.clipSound(nextSched.clip.id);
      const nextOverlap = this.state.resolveOverlap(nextSched.clip.id);
      let nextEffectiveGain = nextSound.volume * (hasActiveMusicAtTime ? nextOverlap.videoGain : 1);
      if (nextSound.audioAssetId && !nextSound.keepOriginalAudio) {
        nextEffectiveGain = 0;
      }
      if (this.state.isTrackMuted('V1')) {
        nextEffectiveGain = 0;
      } else {
        nextEffectiveGain *= this.state.trackV1Volume();
      }
      isNextVideoMuted = this.state.isMonitorMuted() || nextEffectiveGain <= 0.001;
      nextClipVol = isNextVideoMuted ? 0 : Math.min(1, nextEffectiveGain);
    }

    const activeVolumeFactor = (inTransition && canBorrowHead) ? (1 - progress) : 1;
    const effectiveActiveGain = effectiveClipGain * activeVolumeFactor;
    const isVideoMuted = this.state.isMonitorMuted() || effectiveActiveGain <= 0.001;
    const clipVol = isVideoMuted ? 0 : Math.min(1, effectiveActiveGain);
    const speed = this.state.playbackSpeed();

    // 1. Sync active video
    const isCurrImage = this.state.getClipType(curr.clip) === 'image';

    if (isCurrImage) {
      if (currentActiveVideo && !currentActiveVideo.paused) {
        currentActiveVideo.pause();
      }
    } else if (pastPicture && currentActiveVideo) {
      if (!currentActiveVideo.paused) currentActiveVideo.pause();
      currentActiveVideo.muted = true;
      const lastFrame = Math.max(0.05, clipTrimStart + curr.durationSeconds - 0.05);
      if (!currentActiveVideo.seeking && Math.abs(currentActiveVideo.currentTime - lastFrame) > 0.15) {
        currentActiveVideo.currentTime = lastFrame;
      }
    } else if (currentActiveVideo) {
      const currAssetId = this.state.resolveAssetId(curr.clip);
      const activeLoadedId = currentActiveIsA ? this.loadedClipIdA : this.loadedClipIdB;
      if (activeLoadedId !== currAssetId || !currentActiveVideo.src) {
        if (currentActiveIsA) this.loadedClipIdA = currAssetId;
        else this.loadedClipIdB = currAssetId;
        currentActiveVideo.src = this.state.assetUrl(currAssetId);
        const targetTime = Math.max(0.05, localTime);
        if (currentActiveVideo.readyState >= 1) {
          currentActiveVideo.currentTime = targetTime;
        } else {
          currentActiveVideo.onloadedmetadata = () => {
            currentActiveVideo.currentTime = targetTime;
            currentActiveVideo.onloadedmetadata = null;
          };
        }
      } else if (!playing && Math.abs(currentActiveVideo.currentTime - localTime) > 0.05 && !currentActiveVideo.seeking) {
        currentActiveVideo.currentTime = Math.max(0.05, localTime);
      } else if (playing && Math.abs(currentActiveVideo.currentTime - localTime) > 0.4 && !currentActiveVideo.seeking) {
        currentActiveVideo.currentTime = Math.max(0.05, localTime);
      }
      currentActiveVideo.volume = this.state.isMonitorMuted() ? 0 : Math.min(1, this.state.monitorVolume() * clipVol);
      currentActiveVideo.muted = isVideoMuted;
      currentActiveVideo.playbackRate = speed;
      if (playing) {
        if (currentActiveVideo.paused) {
          currentActiveVideo.play().catch((err: unknown) => {
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
              currentActiveVideo.muted = true;
              currentActiveVideo.play().catch(() => undefined);
            }
          });
        }
      } else {
        if (!currentActiveVideo.paused) currentActiveVideo.pause();
      }
    }

    // 2. Sync standby video (transitions / preloading)
    if (inTransition && nextSched && currentStandbyVideo) {
      if (isNextImage) {
        if (!currentStandbyVideo.paused) currentStandbyVideo.pause();
        currentStandbyVideo.volume = 0;
        currentStandbyVideo.muted = true;
      } else {
        const nextAssetId = this.state.resolveAssetId(nextSched.clip);
        const nextLocalTime = canBorrowHead
          ? Math.max(0, nextTrimStart - offsetBeforeStart)
          : Math.max(0.05, nextTrimStart);
        const standbyLoadedId = currentActiveIsA ? this.loadedClipIdB : this.loadedClipIdA;
        if (standbyLoadedId !== nextAssetId) {
          if (currentActiveIsA) this.loadedClipIdB = nextAssetId;
          else this.loadedClipIdA = nextAssetId;
          currentStandbyVideo.src = this.state.assetUrl(nextAssetId);
          currentStandbyVideo.currentTime = nextLocalTime;
        } else if (!playing || (Math.abs(currentStandbyVideo.currentTime - nextLocalTime) > 0.4 && !currentStandbyVideo.seeking)) {
          currentStandbyVideo.currentTime = nextLocalTime;
        }

        if (canBorrowHead) {
          const standbyGain = progress * nextClipVol;
          currentStandbyVideo.volume = this.state.isMonitorMuted() ? 0 : Math.min(1, this.state.monitorVolume() * standbyGain);
          currentStandbyVideo.muted = isNextVideoMuted || standbyGain <= 0.001;
          currentStandbyVideo.playbackRate = speed;
          if (playing) {
            if (currentStandbyVideo.paused) currentStandbyVideo.play().catch(() => undefined);
          } else {
            if (!currentStandbyVideo.paused) currentStandbyVideo.pause();
          }
        } else {
          currentStandbyVideo.volume = 0;
          currentStandbyVideo.muted = true;
          currentStandbyVideo.playbackRate = speed;
          if (!currentStandbyVideo.paused) currentStandbyVideo.pause();
        }
      }

      this.liveTransitionActive.set(true);
      this.liveTransitionType.set(curr.junctionTransition || 'Dissolve');
      this.liveTransitionClass.set(this.pvClassForTransition(curr.junctionTransition));
      this.liveTransitionDuration.set(transSec);
    } else {
      this.liveTransitionActive.set(false);
      if (currentStandbyVideo) {
        currentStandbyVideo.volume = 0;
        currentStandbyVideo.muted = true;
        if (!currentStandbyVideo.paused) currentStandbyVideo.pause();
      }
      // Preload next incoming clip
      if (nextSched && !isNextImage && currentStandbyVideo) {
        const nextAssetId = this.state.resolveAssetId(nextSched.clip);
        const standbyLoadedId = currentActiveIsA ? this.loadedClipIdB : this.loadedClipIdA;
        if (standbyLoadedId !== nextAssetId) {
          if (currentActiveIsA) this.loadedClipIdB = nextAssetId;
          else this.loadedClipIdA = nextAssetId;
          currentStandbyVideo.src = this.state.assetUrl(nextAssetId);
          currentStandbyVideo.currentTime = nextSched.clip.trimStartSeconds ?? 0;
        }
      }
    }

    // 3. Sync Overlays (V2 Video)
    const v2Item = this.state.activeV2Item();
    const overlayVideo = this.overlayVideoRef?.nativeElement;
    if (overlayVideo && v2Item) {
      const v2LocalTime = time - v2Item.startTime;
      if (Math.abs(overlayVideo.currentTime - v2LocalTime) > 0.3) {
        overlayVideo.currentTime = Math.max(0, v2LocalTime);
      }
      overlayVideo.playbackRate = speed;
      if (playing && overlayVideo.paused) overlayVideo.play().catch(() => undefined);
      else if (!playing && !overlayVideo.paused) overlayVideo.pause();
    } else if (overlayVideo && !overlayVideo.paused) {
      overlayVideo.pause();
    }

    // 4. Sync Background Music & Audio Track
    const bgAudio = this.bgMusicAudioRef?.nativeElement;
    let targetMusicAssetId: string | null = null;
    let targetMusicTime = 0;
    let targetMusicVolume = 1.0;
    // Music rides the A2 bus; a loose audio item follows the lane it sits on.
    let musicBus: 'A1' | 'A2' = 'A2';

    if (activeMusicTrack) {
      targetMusicAssetId = activeMusicTrack.assetId;
      targetMusicTime = (time - activeMusicTrack.startSeconds) + (activeMusicTrack.trimStartSeconds ?? 0);
      targetMusicVolume = activeMusicTrack.volume ?? 1.0;
    } else if (activeA1Item) {
      musicBus = activeA1Item.trackId === 'A1' ? 'A1' : 'A2';
      targetMusicAssetId = activeA1Item.src;
      targetMusicTime = (time - activeA1Item.startTime) + (activeA1Item.trimStartSeconds ?? 0);
      targetMusicVolume = activeA1Item.volume ?? 1.0;
    } else if (hasGlobalMusic) {
      targetMusicAssetId = this.state.musicAssetId();
      targetMusicTime = time;
      targetMusicVolume = this.state.musicVolume();
    }
    targetMusicVolume *= this.state.audioBusGain(musicBus);
    const isMusicTrackMuted = this.state.isMonitorMuted() || this.state.isTrackMuted(musicBus)
      || Boolean(activeMusicTrack?.muted) || (!activeMusicTrack && Boolean(activeA1Item?.muted));

    // The resolved rule may ask the music to step back under this clip.
    // Under a voiceover line too; where both apply, the deeper duck wins, as in the export.
    targetMusicVolume *= Math.min(overlap.musicGain, this.state.voiceDuckGainAt(time));

    if (bgAudio && targetMusicAssetId) {
      const musicUrl = this.state.assetUrl(targetMusicAssetId);
      if (this.loadedMusicAssetId !== targetMusicAssetId) {
        this.loadedMusicAssetId = targetMusicAssetId;
        bgAudio.src = musicUrl;
        bgAudio.currentTime = Math.max(0, targetMusicTime);
      } else if (!playing || Math.abs(bgAudio.currentTime - targetMusicTime) > 0.35) {
        bgAudio.currentTime = Math.max(0, targetMusicTime);
      }
      bgAudio.volume = isMusicTrackMuted ? 0 : Math.min(1, this.state.monitorVolume() * targetMusicVolume);
      bgAudio.muted = isMusicTrackMuted;
      bgAudio.playbackRate = speed;
      if (playing) {
        if (bgAudio.paused) bgAudio.play().catch(() => undefined);
      } else {
        if (!bgAudio.paused) bgAudio.pause();
      }
    } else if (bgAudio && !bgAudio.paused) {
      bgAudio.pause();
    }

    // 4b. Sync Voiceover lines on A1
    const voAudio = this.voiceoverAudioRef?.nativeElement;
    if (voAudio && activeVoiceoverTrack) {
      const voTime = (time - activeVoiceoverTrack.startSeconds) + (activeVoiceoverTrack.trimStartSeconds ?? 0);
      const voMuted = this.state.isMonitorMuted() || this.state.isTrackMuted('A1') || Boolean(activeVoiceoverTrack.muted)
        || this.state.auditioningVoiceover();
      if (this.loadedVoiceoverAssetId !== activeVoiceoverTrack.assetId) {
        this.loadedVoiceoverAssetId = activeVoiceoverTrack.assetId;
        voAudio.src = this.state.assetUrl(activeVoiceoverTrack.assetId);
        voAudio.currentTime = Math.max(0, voTime);
      } else if (!playing || Math.abs(voAudio.currentTime - voTime) > 0.35) {
        voAudio.currentTime = Math.max(0, voTime);
      }
      // The voice leads: a Duck music rule lowers the music around it, never the voice itself.
      const voGain = (activeVoiceoverTrack.volume ?? 1.0) * this.state.trackA1Volume();
      voAudio.volume = voMuted ? 0 : Math.min(1, this.state.monitorVolume() * voGain);
      voAudio.muted = voMuted;
      voAudio.playbackRate = speed;
      if (playing) {
        if (voAudio.paused) voAudio.play().catch(() => undefined);
      } else if (!voAudio.paused) {
        voAudio.pause();
      }
    } else if (voAudio && !voAudio.paused) {
      voAudio.pause();
    }

    // 4c. Sound effects on cuts, heard over the music bed rather than swapping it out
    const fxAudio = this.effectAudioRef?.nativeElement;
    if (fxAudio && activeEffectTrack) {
      const fxTime = (time - activeEffectTrack.startSeconds) + (activeEffectTrack.trimStartSeconds ?? 0);
      const fxMuted = this.state.isMonitorMuted() || this.state.isTrackMuted('A2') || Boolean(activeEffectTrack.muted);
      if (this.loadedEffectAssetId !== activeEffectTrack.assetId) {
        this.loadedEffectAssetId = activeEffectTrack.assetId;
        fxAudio.src = this.state.assetUrl(activeEffectTrack.assetId);
        fxAudio.currentTime = Math.max(0, fxTime);
      } else if (!playing || Math.abs(fxAudio.currentTime - fxTime) > 0.35) {
        fxAudio.currentTime = Math.max(0, fxTime);
      }
      const fxGain = (activeEffectTrack.volume ?? 1.0) * this.state.audioBusGain('A2');
      fxAudio.volume = fxMuted ? 0 : Math.min(1, this.state.monitorVolume() * fxGain);
      fxAudio.muted = fxMuted;
      fxAudio.playbackRate = speed;
      if (playing) {
        if (fxAudio.paused) fxAudio.play().catch(() => undefined);
      } else if (!fxAudio.paused) {
        fxAudio.pause();
      }
    } else if (fxAudio && !fxAudio.paused) {
      fxAudio.pause();
    }

    // 5. Sync Replacement Clip Sound (Voiceover)
    const clipSoundAudio = this.clipSoundAudioRef?.nativeElement;
    if (clipSoundAudio && sound.audioAssetId && sound.audioVolume > 0 && !pastPicture) {
      const clipSoundUrl = this.state.assetUrl(sound.audioAssetId);
      const clipRun = this.state.clipSoundRunOffset(curr.clip.id);
      const targetClipSoundTime = localTime + clipRun.startOffset;
      const isClipSoundMuted = this.state.isMonitorMuted() || this.state.isTrackMuted('V1');
      const clipSoundVol = isClipSoundMuted ? 0 : Math.min(1, sound.audioVolume * this.state.trackV1Volume() * this.state.monitorVolume());

      if (this.loadedClipSoundAssetId !== sound.audioAssetId) {
        this.loadedClipSoundAssetId = sound.audioAssetId;
        clipSoundAudio.src = clipSoundUrl;
        clipSoundAudio.currentTime = Math.max(0, targetClipSoundTime);
      } else if (!playing || Math.abs(clipSoundAudio.currentTime - targetClipSoundTime) > 0.35) {
        clipSoundAudio.currentTime = Math.max(0, targetClipSoundTime);
      }
      clipSoundAudio.volume = clipSoundVol;
      clipSoundAudio.muted = isClipSoundMuted;
      clipSoundAudio.playbackRate = speed;
      if (playing) {
        if (clipSoundAudio.paused) clipSoundAudio.play().catch(() => undefined);
      } else {
        if (!clipSoundAudio.paused) clipSoundAudio.pause();
      }
    } else if (clipSoundAudio && !clipSoundAudio.paused) {
      clipSoundAudio.pause();
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

  getMonitorLayerClass(layer: 'A' | 'B'): string {
    const isCurrentActive = this.activeLayer() === layer;
    if (!this.liveTransitionActive()) {
      return isCurrentActive ? 'layer-front' : 'layer-back';
    }

    const trans = this.liveTransitionType();
    if (isCurrentActive) {
      // Outgoing layer
      switch (trans) {
        case 'Fade': return 'trans-outgoing trans-dip-out';
        case 'SlideLeft': return 'trans-outgoing trans-slide-left-out';
        case 'SlideRight': return 'trans-outgoing trans-slide-right-out';
        case 'CircleClose': return 'trans-outgoing trans-circle-close-out';
        default: return 'trans-outgoing-underneath';
      }
    } else {
      // Incoming layer
      switch (trans) {
        case 'Dissolve': return 'trans-incoming trans-dissolve-in';
        case 'Fade': return 'trans-incoming trans-dip-in';
        case 'WipeLeft': return 'trans-incoming trans-wipe-left-in';
        case 'WipeRight': return 'trans-incoming trans-wipe-right-in';
        case 'SlideLeft': return 'trans-incoming trans-slide-left-in';
        case 'SlideRight': return 'trans-incoming trans-slide-right-in';
        case 'CircleOpen': return 'trans-incoming trans-circle-open-in';
        case 'CircleClose': return 'trans-incoming-underneath';
        default: return 'trans-incoming trans-dissolve-in';
      }
    }
  }

  // ── Erase existing watermark ────────────────────────────────────────────────

  @ViewChild('eraseFrame') eraseFrameRef?: ElementRef<HTMLElement>;

  /**
   * Each layer's picture shape, read from the decoded video rather than the probe: a
   * phone clip's probed size ignores its rotation, the browser's does not.
   */
  private readonly layerAspect = signal<Record<'A' | 'B', number | null>>({ A: null, B: null });

  /** Width / height of the picture on screen, so the erase boxes sit on the footage itself. */
  readonly monitorAspect = computed<number>(() => {
    const fromVideo = this.layerAspect()[this.activeLayer()];
    if (fromVideo && !this.state.activeClipIsImage()) return fromVideo;
    const clip = this.state.currentScheduledClip()?.clip ?? this.state.activeTargetClip();
    return clip?.width && clip?.height ? clip.width / clip.height : 16 / 9;
  });

  onVideoMetadata(layer: 'A' | 'B', event: Event): void {
    const v = event.target as HTMLVideoElement;
    if (v.videoWidth > 0 && v.videoHeight > 0) {
      this.layerAspect.update((m) => ({ ...m, [layer]: v.videoWidth / v.videoHeight }));
    }
  }

  @ViewChild('imageMonitor') imageMonitorRef?: ElementRef<HTMLImageElement>;
  @ViewChildren('patchCanvas') patchCanvases?: QueryList<ElementRef<HTMLCanvasElement>>;
  private patchFrameId: number | null = null;

  /** The inner box's place inside its grown (feathered) box, in percent of the latter. */
  innerBox(m: MonitorEraseRegion): { left: number; top: number; width: number; height: number } {
    const { region: r, outer: o } = m;
    return {
      left: ((r.x - o.x) / o.width) * 100,
      top: ((r.y - o.y) / o.height) * 100,
      width: (r.width / o.width) * 100,
      height: (r.height / o.height) * 100,
    };
  }

  /**
   * Backdrop blur scaled to the box, the way the export's boxblur is: a share of the
   * box's short side, so the same strength looks the same on any box and any monitor.
   * --fw / --fh are one percent of the picture's on-screen width and height.
   */
  eraseBlur(m: MonitorEraseRegion): string {
    const k = ((m.region.strength ?? ERASE_DEFAULT_STRENGTH) / 250) * 0.6;
    return `blur(calc(min(${m.outer.width} * var(--fw), ${m.outer.height} * var(--fh)) * ${k}))`;
  }

  eraseFill(m: MonitorEraseRegion): string {
    return `color-mix(in srgb, ${m.region.fillColor ?? '#000000'} ${m.region.opacity ?? 100}%, transparent)`;
  }

  /** Text mark size: fills the box's height, unless the line would overflow its width. */
  brandFontSize(): string {
    const len = Math.max(1, (this.state.effectiveWatermark().text || 'yoursite.example').length);
    return `min(60cqh, calc(85cqw / ${len * 0.55}))`;
  }

  /**
   * Paints every Patch / Brand box from the footage beside it, each frame while any
   * exist - CSS has no way to show one part of a video somewhere else.
   */
  private schedulePatchPaint(): void {
    if (this.patchFrameId !== null) return;
    const paint = () => {
      this.patchFrameId = null;
      const canvases = this.patchCanvases?.toArray() ?? [];
      if (canvases.length === 0) return;
      this.paintPatches(canvases.map((c) => c.nativeElement));
      this.patchFrameId = requestAnimationFrame(paint);
    };
    this.patchFrameId = requestAnimationFrame(paint);
  }

  private paintPatches(canvases: HTMLCanvasElement[]): void {
    const img = this.state.activeClipIsImage() ? this.imageMonitorRef?.nativeElement : undefined;
    const video = this.activeLayer() === 'A' ? this.videoMonitorARef?.nativeElement : this.videoMonitorBRef?.nativeElement;
    const source: CanvasImageSource | undefined = img ?? video;
    const sw = img ? img.naturalWidth : video?.videoWidth ?? 0;
    const sh = img ? img.naturalHeight : video?.videoHeight ?? 0;
    if (!source || sw === 0 || sh === 0) return;

    const regions = this.state.monitorEraseRegions();
    for (const canvas of canvases) {
      const m = regions.find((x) => x.index === Number(canvas.dataset['erase']));
      if (!m) continue;
      const origin = erasePatchOrigin(m.region);
      const w = (m.outer.width / 100) * sw;
      const h = (m.outer.height / 100) * sh;
      // Capped: a preview patch never needs more pixels than the monitor shows.
      const scale = Math.min(1, 480 / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      const soften = Math.min(cw, ch) * ((m.region.strength ?? ERASE_DEFAULT_STRENGTH) / 2000);
      ctx.filter = soften >= 0.5 ? `blur(${soften.toFixed(1)}px)` : 'none';
      try {
        ctx.drawImage(source, (origin.x / 100) * sw, (origin.y / 100) * sh, w, h, 0, 0, cw, ch);
      } catch {
        // A frame that is not decodable yet; the next tick paints it.
      }
    }
  }

  /** Moves or resizes one erase box by dragging it on the paused monitor. */
  startEraseDrag(event: PointerEvent, index: number, mode: 'move' | 'resize'): void {
    if (event.button !== 0) return;
    this.state.selectEraseRegion(index);
    if (this.state.isPlaying()) return;
    const frame = this.eraseFrameRef?.nativeElement;
    const clip = this.state.currentScheduledClip()?.clip ?? this.state.activeTargetClip();
    const start = clip ? this.state.clipTransformSetting(clip.id).eraseRegions[index] : undefined;
    if (!frame || !start) return;

    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    const rect = frame.getBoundingClientRect();
    const x0 = event.clientX, y0 = event.clientY;

    const onMove = (e: PointerEvent) => {
      const dx = ((e.clientX - x0) / rect.width) * 100;
      const dy = ((e.clientY - y0) / rect.height) * 100;
      this.state.updateEraseRegion(index, mode === 'move'
        ? {
            x: Math.max(0, Math.min(100 - start.width, start.x + dx)),
            y: Math.max(0, Math.min(100 - start.height, start.y + dy)),
          }
        : { width: start.width + dx, height: start.height + dy });
    };
    const onUp = (e: PointerEvent) => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  }

  /**
   * Press on a block of text to select it, drag to place it. Moving only starts past a few
   * pixels, so a plain click selects without turning a named position into a custom one.
   * Near the middle it snaps to centre, the place a caption almost always belongs.
   */
  startTextDrag(event: PointerEvent, block: MonitorTextBlock): void {
    if (event.button !== 0) return;
    if (block.target.kind === 'item') this.state.selectTimelineItem(block.target.id);
    else this.state.setInspectorTab('layout');
    if (this.state.isPlaying()) return;
    const frame = this.monitorContainerRef?.nativeElement;
    if (!frame) return;

    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);

    const rect = frame.getBoundingClientRect();
    const x0 = event.clientX, y0 = event.clientY;
    const startX = block.look.x, startY = block.look.y;
    let moving = false;

    const onMove = (e: PointerEvent) => {
      if (!moving && Math.hypot(e.clientX - x0, e.clientY - y0) < 4) return;
      moving = true;
      // A band is always full width; only its height means anything.
      let x = block.look.box === 'band' ? 50 : startX + ((e.clientX - x0) / rect.width) * 100;
      if (Math.abs(x - 50) < 3) x = 50;
      const y = startY + ((e.clientY - y0) / rect.height) * 100;
      this.state.moveTextBlock(block.target, x, y);
    };
    const onUp = (e: PointerEvent) => {
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }

  /** Centred on its point; the entrance/exit offset is in 360-reference pixels like the export's. */
  textBlockTransform(b: MonitorTextBlock): string {
    const dy = b.offsetY !== 0 ? ` + ${b.offsetY} * 100cqmin / ${TEXT_REFERENCE_SHORT_SIDE}` : '';
    const scale = b.scale !== 1 ? ` scale(${b.scale})` : '';
    return b.look.box === 'band'
      ? `translateY(calc(-50%${dy}))${scale}`
      : `translate(-50%, calc(-50%${dy}))${scale}`;
  }

  textBandBackground(b: MonitorTextBlock): string | null {
    return b.look.box === 'band' && b.look.boxOpacity > 0 ? hexToRgba(b.look.boxColor, b.look.boxOpacity) : null;
  }

  /** One line's plate, stroke and shadow - drawtext's box, borderw and shadow. */
  textLineStyle(b: MonitorTextBlock): Record<string, string> {
    const l = b.look;
    return {
      background: l.box === 'box' && l.boxOpacity > 0 ? hexToRgba(l.boxColor, l.boxOpacity) : 'transparent',
      // The stroke is centred on the outline and painted under the fill, so twice the
      // width shows exactly drawtext's outward border.
      '-webkit-text-stroke': l.outlineWidth > 0
        ? `calc(${l.outlineWidth * 2} * 100cqmin / ${TEXT_REFERENCE_SHORT_SIDE}) ${l.outlineColor}`
        : '0',
      'text-shadow': l.shadow ? '0.0625em 0.0625em 0 rgba(0,0,0,0.7)' : 'none',
    };
  }

  toggleFullscreen(): void {
    const el = this.monitorContainerRef?.nativeElement;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen().catch(() => undefined);
    }
  }

  captureSnapshot(): void {
    const video = this.activeLayer() === 'A'
      ? this.videoMonitorARef?.nativeElement
      : this.videoMonitorBRef?.nativeElement;

    if (!video || video.videoWidth === 0) {
      this.state.status.notify(['Play or load video to capture a snapshot frame.']);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `snapshot_${Date.now()}.png`;
    a.click();
    this.state.snapshotFlash.set(true);
    setTimeout(() => this.state.snapshotFlash.set(false), 300);
  }
}

