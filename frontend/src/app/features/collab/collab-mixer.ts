import { CharacterVoice } from '../../shared/voice/character-voice';
import { VoiceChain } from '../../shared/voice/voice-chain';

/**
 * The collab's sound: the original video and your voice, mixed into one track for the
 * recorder. While you talk, the original can dip (ducking) so you're heard over it. Your
 * voice can be changed into a character's on the way in.
 * <p>
 * The original also goes to the speakers (the "monitor") so you can react to it live; your
 * voice only does when you ask to hear your character (headphones), so there's no feedback.
 * During a re-render the monitor is off.
 */

/** Voice louder than this (RMS, 0-1) counts as speaking. */
const SPEAKING_RMS = 0.035;
/** How far the original dips while you speak. */
const DUCK_TO = 0.35;
/** Stay ducked this long after the last word, so it doesn't pump between words. */
const DUCK_HOLD_MS = 450;

export interface MixLevels {
  sourceVolume: number;
  voiceVolume: number;
  duck: boolean;
}

export class CollabMixer {
  readonly context: AudioContext;
  private readonly destination: MediaStreamAudioDestinationNode;
  private readonly sourceGain: GainNode;
  private readonly duckGain: GainNode;
  private readonly voiceGain: GainNode;
  private readonly monitorGain: GainNode;
  private readonly voiceMonitor: GainNode;
  private readonly voiceChain: VoiceChain;
  private readonly monitoring: boolean;
  private readonly analyser: AnalyserNode;
  private readonly samples: Float32Array<ArrayBuffer>;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private voiceNode: AudioNode | null = null;
  private levels: MixLevels = { sourceVolume: 1, voiceVolume: 1, duck: true };
  private voiceOn = true;
  private lastSpokeAt = -Infinity;
  private ducked = false;

  constructor(monitor: boolean) {
    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.destination = this.context.createMediaStreamDestination();
    this.sourceGain = this.context.createGain();
    this.duckGain = this.context.createGain();
    this.voiceGain = this.context.createGain();
    this.monitorGain = this.context.createGain();
    this.voiceMonitor = this.context.createGain();
    this.voiceChain = new VoiceChain(this.context);
    this.monitoring = monitor;
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;
    this.samples = new Float32Array(this.analyser.fftSize);

    this.sourceGain.connect(this.duckGain);
    this.duckGain.connect(this.destination);
    this.duckGain.connect(this.monitorGain);
    this.monitorGain.connect(this.context.destination);
    this.monitorGain.gain.value = monitor ? 1 : 0;
    this.voiceChain.output.connect(this.voiceGain);
    this.voiceGain.connect(this.destination);
    this.voiceChain.output.connect(this.voiceMonitor);
    this.voiceMonitor.connect(this.context.destination);
    this.voiceMonitor.gain.value = 0;
  }

  /** Loads the voice changer's pitch shifter; the character voices work without it, minus pitch. */
  async init(): Promise<boolean> {
    await this.voiceChain.init();
    return !this.voiceChain.pitchUnavailable;
  }

  /** The character you're speaking as, or null for your own voice. Safe to switch mid-take. */
  setCharacterVoice(voice: CharacterVoice | null): void {
    this.voiceChain.apply(voice);
  }

  /** Lets you hear your changed voice. Headphones only, or the speakers feed back into the mic. */
  setVoiceMonitor(on: boolean): void {
    this.voiceMonitor.gain.setTargetAtTime(on && this.monitoring ? 1 : 0, this.context.currentTime, 0.05);
  }

  /** The mixed track, always present (silent until something is connected). */
  get stream(): MediaStream {
    return this.destination.stream;
  }

  /**
   * How late what you hear is, in seconds: your reaction to a frame lands in the camera
   * recording about this much after it. Used as the starting sync correction for a take.
   */
  get outputLatency(): number {
    const c = this.context as AudioContext & { outputLatency?: number };
    return (c.baseLatency || 0) + (c.outputLatency || 0);
  }

  async resume(): Promise<void> {
    if (this.context.state !== 'running') await this.context.resume();
  }

  /** An element can be wired to one audio context for its whole life, so each mixer gets fresh ones. */
  setSource(video: HTMLVideoElement | null): void {
    this.sourceNode?.disconnect();
    this.sourceNode = video ? this.context.createMediaElementSource(video) : null;
    this.sourceNode?.connect(this.sourceGain);
  }

  setVoice(input: MediaStream | HTMLVideoElement | null): void {
    this.voiceNode?.disconnect();
    this.voiceNode = null;
    if (input instanceof MediaStream) {
      if (input.getAudioTracks().length) this.voiceNode = this.context.createMediaStreamSource(input);
    } else if (input) {
      this.voiceNode = this.context.createMediaElementSource(input);
    }
    // Speaking is detected on the raw voice, so an effect's echo or hall doesn't hold the duck.
    this.voiceNode?.connect(this.voiceChain.input);
    this.voiceNode?.connect(this.analyser);
  }

  apply(levels: MixLevels): void {
    this.levels = levels;
    const now = this.context.currentTime;
    this.sourceGain.gain.setTargetAtTime(levels.sourceVolume, now, 0.03);
    this.voiceGain.gain.setTargetAtTime(this.voiceOn ? levels.voiceVolume : 0, now, 0.03);
    if (!levels.duck) this.setDucked(false);
  }

  /** Your voice in the mix or not (a stitch keeps it out while the original plays). */
  setVoiceOn(on: boolean): void {
    if (this.voiceOn === on) return;
    this.voiceOn = on;
    this.apply(this.levels);
  }

  /** Voice level 0-1, and ducking decided from it. Call once a frame. */
  tick(): number {
    this.analyser.getFloatTimeDomainData(this.samples);
    let sum = 0;
    for (let i = 0; i < this.samples.length; i++) sum += this.samples[i] * this.samples[i];
    const rms = Math.sqrt(sum / this.samples.length);

    const now = performance.now();
    if (this.voiceOn && rms > SPEAKING_RMS) this.lastSpokeAt = now;
    this.setDucked(this.levels.duck && this.voiceOn && now - this.lastSpokeAt < DUCK_HOLD_MS);
    return Math.min(1, rms * 5);
  }

  private setDucked(ducked: boolean): void {
    if (this.ducked === ducked) return;
    this.ducked = ducked;
    // Quick to duck, slower to come back, so it sounds like a person turning it down.
    this.duckGain.gain.setTargetAtTime(ducked ? DUCK_TO : 1, this.context.currentTime, ducked ? 0.04 : 0.25);
  }

  async close(): Promise<void> {
    this.sourceNode?.disconnect();
    this.voiceNode?.disconnect();
    this.voiceChain.close();
    await this.context.close();
  }
}
