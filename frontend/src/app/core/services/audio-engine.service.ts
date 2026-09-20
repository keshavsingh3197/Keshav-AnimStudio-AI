import { Injectable } from '@angular/core';

export interface AudioTrackSource {
  key: string;
  url: string;
  element: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode;
}

@Injectable({ providedIn: 'root' })
export class AudioEngineService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  private v1Gain: GainNode | null = null;
  private v1Analyser: AnalyserNode | null = null;

  private v2Gain: GainNode | null = null;
  private v2Analyser: AnalyserNode | null = null;

  private a1Gain: GainNode | null = null;
  private a1Analyser: AnalyserNode | null = null;

  private a2Gain: GainNode | null = null;
  private a2Analyser: AnalyserNode | null = null;

  // Cache for connected media elements (HTMLVideoElement / HTMLAudioElement)
  private mediaElementSources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

  // Track sources cache: key -> AudioTrackSource
  private sources = new Map<string, AudioTrackSource>();

  // Volumes & Mute states (0.0 to 2.0)
  private v1Volume = 1.0;
  private v1Muted = false;
  private v2Volume = 1.0;
  private v2Muted = false;
  private a1Volume = 1.0;
  private a1Muted = false;
  private a2Volume = 0.8;
  private a2Muted = false;
  private masterVolume = 1.0;
  private masterMuted = false;

  // Ducking state
  private isA1Active = false;
  private duckLevel = 0.25;
  private duckHoldTimer: any = null;
  private isGlobalDuckingEnabled = true;

  /** Ensures AudioContext is created and running on user gesture. */
  ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 128;
      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.ctx.destination);

      // V1 bus (Primary video)
      this.v1Gain = this.ctx.createGain();
      this.v1Gain.gain.setValueAtTime(this.v1Muted ? 0 : this.v1Volume, this.ctx.currentTime);
      this.v1Analyser = this.ctx.createAnalyser();
      this.v1Analyser.fftSize = 128;
      this.v1Gain.connect(this.v1Analyser);
      this.v1Analyser.connect(this.masterGain);

      // V2 bus (Overlay video)
      this.v2Gain = this.ctx.createGain();
      this.v2Gain.gain.setValueAtTime(this.v2Muted ? 0 : this.v2Volume, this.ctx.currentTime);
      this.v2Analyser = this.ctx.createAnalyser();
      this.v2Analyser.fftSize = 128;
      this.v2Gain.connect(this.v2Analyser);
      this.v2Analyser.connect(this.masterGain);

      // A1 bus (Voiceover)
      this.a1Gain = this.ctx.createGain();
      this.a1Gain.gain.setValueAtTime(this.a1Muted ? 0 : this.a1Volume, this.ctx.currentTime);
      this.a1Analyser = this.ctx.createAnalyser();
      this.a1Analyser.fftSize = 128;
      this.a1Gain.connect(this.a1Analyser);
      this.a1Analyser.connect(this.masterGain);

      // A2 bus (Music & SFX)
      this.a2Gain = this.ctx.createGain();
      this.a2Gain.gain.setValueAtTime(this.a2Muted ? 0 : this.a2Volume, this.ctx.currentTime);
      this.a2Analyser = this.ctx.createAnalyser();
      this.a2Analyser.fftSize = 128;
      this.a2Gain.connect(this.a2Analyser);
      this.a2Analyser.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }

    return this.ctx;
  }

  /** Connects an HTMLMediaElement to the respective track bus without duplicate MediaElementSource errors */
  connectMediaElement(el: HTMLMediaElement, trackId: 'V1' | 'V2' | 'A1' | 'A2'): MediaElementAudioSourceNode | null {
    try {
      const ctx = this.ensureContext();
      let source = this.mediaElementSources.get(el);
      if (!source) {
        source = ctx.createMediaElementSource(el);
        this.mediaElementSources.set(el, source);
      }
      try { source.disconnect(); } catch {}

      const targetGain = trackId === 'V1' ? this.v1Gain! :
                         trackId === 'V2' ? this.v2Gain! :
                         trackId === 'A1' ? this.a1Gain! : this.a2Gain!;
      source.connect(targetGain);
      return source;
    } catch {
      return null;
    }
  }

  /** Gets or creates a connected HTMLAudioElement and MediaElementAudioSourceNode for trackId */
  getOrCreateSource(key: string, url: string, trackId: 'A1' | 'A2'): AudioTrackSource {
    const ctx = this.ensureContext();
    let src = this.sources.get(key);

    if (!src || src.url !== url) {
      if (src) {
        src.element.pause();
        src.element.removeAttribute('src');
        src.element.load();
        try { src.sourceNode.disconnect(); } catch {}
      }

      const el = new Audio();
      el.crossOrigin = 'anonymous';
      el.src = url;
      el.preload = 'auto';

      let sourceNode = this.mediaElementSources.get(el);
      if (!sourceNode) {
        sourceNode = ctx.createMediaElementSource(el);
        this.mediaElementSources.set(el, sourceNode);
      }
      try { sourceNode.disconnect(); } catch {}

      const targetGain = trackId === 'A1' ? this.a1Gain! : this.a2Gain!;
      sourceNode.connect(targetGain);

      src = { key, url, element: el, sourceNode };
      this.sources.set(key, src);
    }

    return src;
  }

  /** Notifies the engine whether A1 (voiceover) is currently active and outputting sound */
  setA1Active(active: boolean): void {
    if (this.isA1Active === active) return;
    this.isA1Active = active;
    this.updateA2Ducking();
  }

  setDuckLevel(level: number): void {
    this.duckLevel = Math.max(0.05, Math.min(1.0, level));
    this.updateA2Ducking();
  }

  setGlobalDuckingEnabled(enabled: boolean): void {
    this.isGlobalDuckingEnabled = enabled;
    this.updateA2Ducking();
  }

  private updateA2Ducking(): void {
    if (!this.ctx || !this.a2Gain) return;
    const now = this.ctx.currentTime;

    if (this.duckHoldTimer) {
      clearTimeout(this.duckHoldTimer);
      this.duckHoldTimer = null;
    }

    // Ducking only triggers when Global Ducking is enabled AND A1 is active, unmuted, with positive volume
    const shouldDuck = this.isGlobalDuckingEnabled && this.isA1Active && !this.a1Muted && this.a1Volume > 0 && !this.a2Muted;

    if (shouldDuck) {
      // Attack: smoothly ramp down to duckLevel * a2Volume over 50ms using exponential curve
      const targetGain = Math.max(0.0001, this.a2Volume * this.duckLevel);
      const currentVal = Math.max(0.0001, this.a2Gain.gain.value);
      this.a2Gain.gain.cancelScheduledValues(now);
      this.a2Gain.gain.setValueAtTime(currentVal, now);
      this.a2Gain.gain.exponentialRampToValueAtTime(targetGain, now + 0.05);
    } else {
      // Hold 250ms after speech ends, then release over 150ms with exponential curve to prevent pumping
      const baseGain = this.a2Muted ? 0 : this.a2Volume;
      this.duckHoldTimer = setTimeout(() => {
        if (!this.ctx || !this.a2Gain) return;
        const releaseTime = this.ctx.currentTime;
        this.a2Gain.gain.cancelScheduledValues(releaseTime);
        if (baseGain <= 0.0001) {
          this.a2Gain.gain.setValueAtTime(Math.max(0.0001, this.a2Gain.gain.value), releaseTime);
          this.a2Gain.gain.linearRampToValueAtTime(0, releaseTime + 0.05);
        } else {
          const currentVal = Math.max(0.0001, this.a2Gain.gain.value);
          this.a2Gain.gain.setValueAtTime(currentVal, releaseTime);
          this.a2Gain.gain.exponentialRampToValueAtTime(baseGain, releaseTime + 0.15);
        }
      }, 250);
    }
  }

  /**
   * Applies an exponential / logarithmic fade to maintain perceived acoustic loudness.
   * Guarded against Web Audio exponential ramp zeros.
   */
  applyExponentialFade(gainNode: GainNode, targetVal: number, durationSeconds: number, isFadeIn: boolean): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = Math.max(0.05, durationSeconds);
    gainNode.gain.cancelScheduledValues(now);

    if (isFadeIn) {
      const safeTarget = Math.max(0.0001, targetVal);
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(safeTarget, now + duration);
    } else {
      const current = Math.max(0.0001, gainNode.gain.value);
      gainNode.gain.setValueAtTime(current, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      gainNode.gain.setValueAtTime(0, now + duration + 0.005);
    }
  }

  setTrackVolume(trackId: 'V1' | 'V2' | 'A1' | 'A2', volume: number): void {
    const ctx = this.ensureContext();
    const clamped = Math.max(0, Math.min(2.0, volume));
    const now = ctx.currentTime;

    if (trackId === 'V1') {
      this.v1Volume = clamped;
      if (!this.v1Muted && this.v1Gain) {
        this.rampGain(this.v1Gain, clamped, now);
      }
    } else if (trackId === 'V2') {
      this.v2Volume = clamped;
      if (!this.v2Muted && this.v2Gain) {
        this.rampGain(this.v2Gain, clamped, now);
      }
    } else if (trackId === 'A1') {
      this.a1Volume = clamped;
      if (!this.a1Muted && this.a1Gain) {
        this.rampGain(this.a1Gain, clamped, now);
      }
    } else {
      this.a2Volume = clamped;
      if (!this.a2Muted && this.a2Gain) {
        const target = (this.isGlobalDuckingEnabled && this.isA1Active) ? clamped * this.duckLevel : clamped;
        this.rampGain(this.a2Gain, target, now);
      }
    }
  }

  setTrackMute(trackId: 'V1' | 'V2' | 'A1' | 'A2', muted: boolean): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (trackId === 'V1') {
      this.v1Muted = muted;
      if (this.v1Gain) {
        this.rampGain(this.v1Gain, muted ? 0 : this.v1Volume, now, 0.02);
      }
    } else if (trackId === 'V2') {
      this.v2Muted = muted;
      if (this.v2Gain) {
        this.rampGain(this.v2Gain, muted ? 0 : this.v2Volume, now, 0.02);
      }
    } else if (trackId === 'A1') {
      this.a1Muted = muted;
      if (this.a1Gain) {
        this.rampGain(this.a1Gain, muted ? 0 : this.a1Volume, now, 0.02);
      }
      this.updateA2Ducking();
    } else {
      this.a2Muted = muted;
      if (this.a2Gain) {
        const target = muted ? 0 : ((this.isGlobalDuckingEnabled && this.isA1Active) ? this.a2Volume * this.duckLevel : this.a2Volume);
        this.rampGain(this.a2Gain, target, now, 0.02);
      }
    }
  }

  setMasterVolume(volume: number, muted: boolean): void {
    const ctx = this.ensureContext();
    this.masterVolume = Math.max(0, Math.min(2.0, volume));
    this.masterMuted = muted;
    if (this.masterGain) {
      const target = muted ? 0 : this.masterVolume;
      const now = ctx.currentTime;
      this.rampGain(this.masterGain, target, now, 0.02);
    }
  }

  getTrackVolume(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master'): number {
    if (trackId === 'V1') return this.v1Volume;
    if (trackId === 'V2') return this.v2Volume;
    if (trackId === 'A1') return this.a1Volume;
    if (trackId === 'A2') return this.a2Volume;
    return this.masterVolume;
  }

  isTrackMuted(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master'): boolean {
    if (trackId === 'V1') return this.v1Muted;
    if (trackId === 'V2') return this.v2Muted;
    if (trackId === 'A1') return this.a1Muted;
    if (trackId === 'A2') return this.a2Muted;
    return this.masterMuted;
  }

  /**
   * Peak Meter Math Safety:
   * Safely calculates RMS volume clamped between 0.0 and 1.0.
   * Avoids NaN, -Infinity, or uninitialized audio errors.
   */
  getTrackPeak(trackId: 'V1' | 'V2' | 'A1' | 'A2' | 'Master'): number {
    let analyser: AnalyserNode | null = null;
    let isMuted = false;
    let trackVol = 1.0;

    if (trackId === 'V1') {
      analyser = this.v1Analyser;
      isMuted = this.v1Muted;
      trackVol = this.v1Volume;
    } else if (trackId === 'V2') {
      analyser = this.v2Analyser;
      isMuted = this.v2Muted;
      trackVol = this.v2Volume;
    } else if (trackId === 'A1') {
      analyser = this.a1Analyser;
      isMuted = this.a1Muted;
      trackVol = this.a1Volume;
    } else if (trackId === 'A2') {
      analyser = this.a2Analyser;
      isMuted = this.a2Muted;
      trackVol = this.a2Volume;
    } else if (trackId === 'Master') {
      analyser = this.masterAnalyser;
      isMuted = this.masterMuted;
      trackVol = this.masterVolume;
    }

    if (isMuted || trackVol <= 0.0001) return 0.0;
    if (!analyser || !this.ctx || this.ctx.state !== 'running') {
      return 0.0;
    }

    try {
      const bufferLength = analyser.frequencyBinCount;
      if (!bufferLength || bufferLength <= 0) return 0.0;

      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const norm = (dataArray[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      if (isNaN(rms) || !isFinite(rms)) {
        return 0.0;
      }

      // Normalized peak representation scaled by track volume
      const peak = rms * 2.8 * Math.min(1.5, trackVol);
      return Math.max(0.0, Math.min(1.0, peak));
    } catch {
      return 0.0;
    }
  }

  private rampGain(node: GainNode, target: number, now: number, duration: number = 0.04): void {
    node.gain.cancelScheduledValues(now);
    const current = Math.max(0.0001, node.gain.value);
    if (target <= 0.0001) {
      node.gain.setValueAtTime(current, now);
      node.gain.linearRampToValueAtTime(0, now + duration);
    } else {
      node.gain.setValueAtTime(current, now);
      node.gain.exponentialRampToValueAtTime(target, now + duration);
    }
  }

  pauseAll(): void {
    if (this.duckHoldTimer) {
      clearTimeout(this.duckHoldTimer);
      this.duckHoldTimer = null;
    }
    for (const src of this.sources.values()) {
      if (!src.element.paused) {
        src.element.pause();
      }
    }
  }

  cleanupUnused(activeKeys: Set<string>): void {
    for (const [key, src] of this.sources.entries()) {
      if (!activeKeys.has(key)) {
        src.element.pause();
        src.element.removeAttribute('src');
        src.element.load();
        try {
          src.sourceNode.disconnect();
        } catch {}
        this.sources.delete(key);
      }
    }
  }

  dispose(): void {
    this.pauseAll();
    for (const src of this.sources.values()) {
      try { src.sourceNode.disconnect(); } catch {}
    }
    this.sources.clear();
    if (this.ctx) {
      this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}
