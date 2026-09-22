import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../services/studio-state.service';
import { TimelineItemTransform } from '../../../../core/models/api.models';

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
  @ViewChild('monitorContainer') monitorContainerRef?: ElementRef<HTMLElement>;

  // Dual-layer ping-pong state
  readonly activeLayer = signal<'A' | 'B'>('A');
  readonly liveTransitionActive = signal<boolean>(false);
  readonly liveTransitionClass = signal<string>('');
  readonly liveTransitionDuration = signal<number>(0.5);

  private loadedClipIdA: string | null = null;
  private loadedClipIdB: string | null = null;
  private loadedMusicAssetId: string | null = null;
  private loadedClipSoundAssetId: string | null = null;
  private animFrameId: number | null = null;
  private lastTickMs = 0;
  private lastPlayedClipIndex: number | null = null;
  private bufferWaitStartMs: number | null = null;

  constructor() {
    // React to Seek Requests
    effect(() => {
      const req = this.state.seekRequest();
      if (req) {
        this.syncSeek(req.time);
      }
    });

    // React to Play/Pause
    effect(() => {
      const playing = this.state.isPlaying();
      if (playing) {
        this.startPlaybackLoop();
      } else {
        this.pausePlayback();
      }
    });

    // React to Playback Speed
    effect(() => {
      const speed = this.state.playbackSpeed();
      this.updatePlaybackSpeed(speed);
    });

    // React to Volume & Mute Changes
    effect(() => {
      const vol = this.state.monitorVolume();
      const muted = this.state.isMonitorMuted();
      this.updateVolumes(vol, muted);
    });
  }

  ngOnInit(): void {
    // Initial sync
    setTimeout(() => {
      this.syncMediaElements(false);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
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
      const isBuffering = Boolean(
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

      const total = Math.max(this.state.totalSeconds(), this.state.contentDurationSeconds());
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
      this.scheduleNextTick();
    });
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
    this.bgMusicAudioRef?.nativeElement.pause();
    this.clipSoundAudioRef?.nativeElement.pause();
  }

  private syncSeek(time: number): void {
    const activeEl = this.activeLayer() === 'A'
      ? this.videoMonitorARef?.nativeElement
      : this.videoMonitorBRef?.nativeElement;

    const sched = this.state.clipSchedule();
    const curr = sched.find((s) => time >= s.startSeconds && time < s.endSeconds) ?? sched[sched.length - 1];

    if (curr && activeEl) {
      const localTime = Math.max(0, time - curr.startSeconds);
      activeEl.currentTime = localTime;
    }

    // Immediately sync background music seek
    const bg = this.bgMusicAudioRef?.nativeElement;
    if (bg) {
      const activeMusic = this.state.musicTracks().find((t) => {
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
  }

  private updateVolumes(masterVol: number, isMuted: boolean): void {
    const videoA = this.videoMonitorARef?.nativeElement;
    const videoB = this.videoMonitorBRef?.nativeElement;
    if (videoA) {
      videoA.muted = isMuted;
      videoA.volume = isMuted ? 0 : Math.min(1, masterVol);
    }
    if (videoB) {
      videoB.muted = isMuted;
      videoB.volume = isMuted ? 0 : Math.min(1, masterVol);
    }
    const bg = this.bgMusicAudioRef?.nativeElement;
    if (bg) {
      const bgMuted = isMuted || this.state.isTrackMuted('A1');
      bg.muted = bgMuted;
      bg.volume = bgMuted ? 0 : Math.min(1, masterVol * this.state.trackA1Volume() * this.state.musicVolume());
    }
    const cs = this.clipSoundAudioRef?.nativeElement;
    if (cs) {
      const csMuted = isMuted || this.state.isTrackMuted('V1');
      cs.muted = csMuted;
      cs.volume = csMuted ? 0 : Math.min(1, masterVol * this.state.trackV1Volume());
    }
  }

  togglePlayback(): void {
    this.state.audioEngine.ensureContext();
    // Synchronously initiate playback on media elements within user gesture to unlock audio
    if (!this.state.isPlaying()) {
      const activeEl = this.activeLayer() === 'A'
        ? this.videoMonitorARef?.nativeElement
        : this.videoMonitorBRef?.nativeElement;
      if (activeEl && activeEl.paused) {
        activeEl.play().catch(() => undefined);
      }
      const bg = this.bgMusicAudioRef?.nativeElement;
      if (bg && bg.src && bg.paused) {
        bg.play().catch(() => undefined);
      }
    }
    this.state.togglePlayback();
  }

  // Core Sync of Dual-Layer Ping-Pong Video and Overlays
  private syncMediaElements(playing: boolean): void {
    const schedule = this.state.clipSchedule();
    if (schedule.length === 0) return;

    const time = this.state.getCurrentTimeExact();
    const curr = schedule.find((s) => time >= s.startSeconds && time < s.endSeconds)
      ?? schedule[schedule.length - 1];

    if (!curr) return;

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

    const currentActiveIsA = this.activeLayer() === 'A';
    const currentActiveVideo = currentActiveIsA ? videoA : videoB;
    const currentStandbyVideo = currentActiveIsA ? videoB : videoA;

    const transSec = curr.junctionSeconds;
    const hasTrans = curr.junctionTransition !== 'None' && transSec > 0;
    const transStart = curr.endSeconds - transSec;
    const inTransition = hasTrans && time >= transStart && curr.index < schedule.length - 1;

    const sound = this.state.clipSound(curr.clip.id);
    const mode = this.state.muteClipAudio();

    // Check active audio sources on timeline at playhead time
    const a1Items = this.state.timelineItems().filter((i) => (i.trackId === 'A1' || i.trackId === 'A2') && i.type === 'audio');
    const currentTracks = this.state.musicTracks();

    const activeA1Item = a1Items.find((i) => time >= i.startTime && time < (i.startTime + i.duration));
    const activeMusicTrack = currentTracks.find((t) => {
      const dur = this.state.musicTrackDurationSeconds(t);
      return time >= t.startSeconds && time < (t.startSeconds + dur);
    });
    const hasGlobalMusic = this.state.musicAssetId() !== '' && this.state.musicVolume() > 0;

    // Is any music or soundtrack cue active at THIS playhead time?
    const hasActiveMusicAtTime = Boolean(activeMusicTrack) || Boolean(activeA1Item) || hasGlobalMusic;

    // Determine effective gain for the current V1 video clip based on muteClipAudio mode:
    // - 'Always': Mute ALL clip sound (Music Only)
    // - 'MuteOnAudio': Mute clip sound whenever music/audio is playing; keep sound if no music
    // - 'Never': Keep all audio (Never mute clip camera sound)
    let effectiveClipGain = sound.volume;
    if (mode === 'Always') {
      effectiveClipGain = 0;
    } else if (mode === 'MuteOnAudio') {
      effectiveClipGain = hasActiveMusicAtTime ? 0 : sound.volume;
    } else {
      // 'Never' (or any custom ducking if configured)
      if (sound.duckMode === 'MuteOnAudio' && hasActiveMusicAtTime) {
        effectiveClipGain = 0;
      } else if (sound.duckMode === 'Ducked' && hasActiveMusicAtTime) {
        effectiveClipGain = sound.volume * this.state.videoDuckLevel();
      } else {
        effectiveClipGain = sound.volume;
      }
    }

    // If replacement voiceover is active and user unchecked keepOriginalAudio
    if (sound.audioAssetId && !sound.keepOriginalAudio) {
      effectiveClipGain = 0;
    }

    if (this.state.isTrackMuted('V1')) {
      effectiveClipGain = 0;
    } else {
      effectiveClipGain *= this.state.trackV1Volume();
    }

    const isVideoMuted = this.state.isMonitorMuted() || effectiveClipGain === 0;
    const clipVol = isVideoMuted ? 0 : Math.min(1, effectiveClipGain);
    const speed = this.state.playbackSpeed();

    // 1. Sync active video
    const isCurrImage = this.state.getClipType(curr.clip) === 'image';
    this.state.audioEngine.setTrackActive('V1', playing && !isCurrImage && !isVideoMuted && clipVol > 0);

    if (isCurrImage) {
      if (currentActiveVideo && !currentActiveVideo.paused) {
        currentActiveVideo.pause();
      }
    } else if (currentActiveVideo) {
      const activeLoadedId = currentActiveIsA ? this.loadedClipIdA : this.loadedClipIdB;
      if (activeLoadedId !== curr.clip.id) {
        if (currentActiveIsA) this.loadedClipIdA = curr.clip.id;
        else this.loadedClipIdB = curr.clip.id;
        currentActiveVideo.src = this.state.assetUrl(curr.clip.id);
        const targetTime = Math.max(0.001, localTime);
        if (currentActiveVideo.readyState >= 1) {
          currentActiveVideo.currentTime = targetTime;
        } else {
          currentActiveVideo.onloadedmetadata = () => {
            currentActiveVideo.currentTime = targetTime;
            currentActiveVideo.onloadedmetadata = null;
          };
        }
      } else if (!playing || (Math.abs(currentActiveVideo.currentTime - localTime) > 0.4 && !currentActiveVideo.seeking)) {
        currentActiveVideo.currentTime = Math.max(0.001, localTime);
      }
      currentActiveVideo.volume = this.state.isMonitorMuted() ? 0 : Math.min(1, this.state.monitorVolume() * clipVol);
      currentActiveVideo.muted = isVideoMuted;
      currentActiveVideo.playbackRate = speed;
      if (playing) {
        if (currentActiveVideo.paused) currentActiveVideo.play().catch(() => undefined);
      } else {
        if (!currentActiveVideo.paused) currentActiveVideo.pause();
      }
    }

    // 2. Sync standby video (transitions / preloading)
    const nextSched = curr.index < schedule.length - 1 ? schedule[curr.index + 1] : null;
    const isNextImage = nextSched ? this.state.getClipType(nextSched.clip) === 'image' : false;

    if (inTransition && nextSched && currentStandbyVideo) {
      if (isNextImage) {
        if (!currentStandbyVideo.paused) currentStandbyVideo.pause();
      } else {
        const nextLocalTime = Math.max(0, time - transStart);
        const standbyLoadedId = currentActiveIsA ? this.loadedClipIdB : this.loadedClipIdA;
        if (standbyLoadedId !== nextSched.clip.id) {
          if (currentActiveIsA) this.loadedClipIdB = nextSched.clip.id;
          else this.loadedClipIdA = nextSched.clip.id;
          currentStandbyVideo.src = this.state.assetUrl(nextSched.clip.id);
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
      }

      this.liveTransitionActive.set(true);
      this.liveTransitionClass.set(this.pvClassForTransition(curr.junctionTransition));
      this.liveTransitionDuration.set(transSec);
    } else {
      this.liveTransitionActive.set(false);
      // Preload next incoming clip
      if (nextSched && !isNextImage && currentStandbyVideo) {
        const standbyLoadedId = currentActiveIsA ? this.loadedClipIdB : this.loadedClipIdA;
        if (standbyLoadedId !== nextSched.clip.id) {
          if (currentActiveIsA) this.loadedClipIdB = nextSched.clip.id;
          else this.loadedClipIdA = nextSched.clip.id;
          currentStandbyVideo.src = this.state.assetUrl(nextSched.clip.id);
          currentStandbyVideo.currentTime = 0;
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
    let isMusicTrackMuted = this.state.isMonitorMuted() || this.state.isTrackMuted('A1');

    if (activeMusicTrack) {
      targetMusicAssetId = activeMusicTrack.assetId;
      targetMusicTime = (time - activeMusicTrack.startSeconds) + (activeMusicTrack.trimStartSeconds ?? 0);
      targetMusicVolume = (activeMusicTrack.volume ?? 1.0) * this.state.trackA1Volume();
    } else if (activeA1Item) {
      targetMusicAssetId = activeA1Item.src;
      targetMusicTime = (time - activeA1Item.startTime) + (activeA1Item.trimStartSeconds ?? 0);
      targetMusicVolume = (activeA1Item.volume ?? 1.0) * this.state.trackA1Volume();
      if (activeA1Item.muted) isMusicTrackMuted = true;
    } else if (hasGlobalMusic) {
      targetMusicAssetId = this.state.musicAssetId();
      targetMusicTime = time;
      targetMusicVolume = this.state.musicVolume() * this.state.trackA1Volume();
    }

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

    // 5. Sync Replacement Clip Sound (Voiceover)
    const clipSoundAudio = this.clipSoundAudioRef?.nativeElement;
    if (clipSoundAudio && sound.audioAssetId && sound.audioVolume > 0) {
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

