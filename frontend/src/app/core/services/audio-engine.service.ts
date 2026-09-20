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
  private a1Gain: GainNode | null = null;
  private a2Gain: GainNode | null = null;

  // Track sources cache: key -> AudioTrackSource
  private sources = new Map<string, AudioTrackSource>();

  // Volumes & Mute states
  private a1Volume = 1.0;
  private a2Volume = 0.5;
  private a1Muted = false;
  private a2Muted = false;
  private masterVolume = 1.0;
  private masterMuted = false;

  // Ducking state
  private isA1Active = false;
  private duckLevel = 0.25;
  private duckHoldTimer: any = null;

  /** Ensures AudioContext is created and running on user gesture. */
  ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.a1Gain = this.ctx.createGain();
      this.a1Gain.gain.setValueAtTime(this.a1Muted ? 0 : this.a1Volume, this.ctx.currentTime);
      this.a1Gain.connect(this.masterGain);

      this.a2Gain = this.ctx.createGain();
      this.a2Gain.gain.setValueAtTime(this.a2Muted ? 0 : this.a2Volume, this.ctx.currentTime);
      this.a2Gain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }

    return this.ctx;
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

      const sourceNode = ctx.createMediaElementSource(el);
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

  private updateA2Ducking(): void {
    if (!this.ctx || !this.a2Gain) return;
    const now = this.ctx.currentTime;

    if (this.duckHoldTimer) {
      clearTimeout(this.duckHoldTimer);
      this.duckHoldTimer = null;
    }

    // Only duck when A1 is active, unmuted, and has positive volume
    const shouldDuck = this.isA1Active && !this.a1Muted && this.a1Volume > 0 && !this.a2Muted;

    if (shouldDuck) {
      // Attack: smoothly ramp down to duckLevel * a2Volume over 50ms
      const targetGain = this.a2Volume * this.duckLevel;
      this.a2Gain.gain.cancelScheduledValues(now);
      this.a2Gain.gain.setValueAtTime(this.a2Gain.gain.value, now);
      this.a2Gain.gain.linearRampToValueAtTime(targetGain, now + 0.05);
    } else {
      // Hold 250ms after speech ends, then release over 150ms to prevent pumping
      const baseGain = this.a2Muted ? 0 : this.a2Volume;
      this.duckHoldTimer = setTimeout(() => {
        if (!this.ctx || !this.a2Gain) return;
        const releaseTime = this.ctx.currentTime;
        this.a2Gain.gain.cancelScheduledValues(releaseTime);
        this.a2Gain.gain.setValueAtTime(this.a2Gain.gain.value, releaseTime);
        this.a2Gain.gain.linearRampToValueAtTime(baseGain, releaseTime + 0.15);
      }, 250);
    }
  }

  setTrackVolume(trackId: 'A1' | 'A2', volume: number): void {
    const ctx = this.ensureContext();
    const clamped = Math.max(0, Math.min(2.0, volume));
    const now = ctx.currentTime;

    if (trackId === 'A1') {
      this.a1Volume = clamped;
      if (!this.a1Muted && this.a1Gain) {
        this.a1Gain.gain.cancelScheduledValues(now);
        this.a1Gain.gain.setValueAtTime(this.a1Gain.gain.value, now);
        this.a1Gain.gain.linearRampToValueAtTime(clamped, now + 0.05);
      }
    } else {
      this.a2Volume = clamped;
      if (!this.a2Muted && this.a2Gain) {
        const target = this.isA1Active ? clamped * this.duckLevel : clamped;
        this.a2Gain.gain.cancelScheduledValues(now);
        this.a2Gain.gain.setValueAtTime(this.a2Gain.gain.value, now);
        this.a2Gain.gain.linearRampToValueAtTime(target, now + 0.05);
      }
    }
  }

  setTrackMute(trackId: 'A1' | 'A2', muted: boolean): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (trackId === 'A1') {
      this.a1Muted = muted;
      if (this.a1Gain) {
        const target = muted ? 0 : this.a1Volume;
        this.a1Gain.gain.cancelScheduledValues(now);
        this.a1Gain.gain.setValueAtTime(this.a1Gain.gain.value, now);
        this.a1Gain.gain.linearRampToValueAtTime(target, now + 0.02);
      }
      this.updateA2Ducking();
    } else {
      this.a2Muted = muted;
      if (this.a2Gain) {
        const target = muted ? 0 : (this.isA1Active ? this.a2Volume * this.duckLevel : this.a2Volume);
        this.a2Gain.gain.cancelScheduledValues(now);
        this.a2Gain.gain.setValueAtTime(this.a2Gain.gain.value, now);
        this.a2Gain.gain.linearRampToValueAtTime(target, now + 0.02);
      }
    }
  }

  setMasterVolume(volume: number, muted: boolean): void {
    const ctx = this.ensureContext();
    this.masterVolume = Math.max(0, Math.min(1.0, volume));
    this.masterMuted = muted;
    if (this.masterGain) {
      const target = muted ? 0 : this.masterVolume;
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.02);
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
