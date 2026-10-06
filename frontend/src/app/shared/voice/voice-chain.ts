import { CharacterVoice, isPlainVoice } from './character-voice';

/**
 * A real-time pitch shifter: two read heads sweep through a short delay line at the new
 * speed, cross-faded with a sine window so the jumps between grains are inaudible.
 */
const PITCH_WORKLET = `
class PitchShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'ratio', defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' }];
  }
  constructor() {
    super();
    this.size = 16384;
    this.buffer = new Float32Array(this.size);
    this.write = 0;
    this.phase = 0;
    this.grain = Math.round(sampleRate * 0.06);
  }
  read(delay) {
    let pos = this.write - delay;
    while (pos < 0) pos += this.size;
    const i = Math.floor(pos);
    const f = pos - i;
    const a = this.buffer[i % this.size];
    const b = this.buffer[(i + 1) % this.size];
    return a + (b - a) * f;
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) return true;
    const ratio = parameters.ratio[0];
    const step = (1 - ratio) / this.grain;
    const source = input[0];
    for (let n = 0; n < source.length; n++) {
      this.buffer[this.write] = source[n];
      const p1 = this.phase;
      const p2 = (this.phase + 0.5) % 1;
      const w1 = Math.sin(Math.PI * p1) ** 2;
      const w2 = Math.sin(Math.PI * p2) ** 2;
      const y = this.read(p1 * this.grain + 1) * w1 + this.read(p2 * this.grain + 1) * w2;
      for (let c = 0; c < output.length; c++) output[c][n] = y;
      this.phase += step;
      if (this.phase >= 1) this.phase -= 1;
      if (this.phase < 0) this.phase += 1;
      this.write = (this.write + 1) % this.size;
    }
    return true;
  }
}
registerProcessor('animstudio-pitch-shifter', PitchShifter);
`;

const worklets = new WeakMap<BaseAudioContext, Promise<boolean>>();

/** Registers the pitch shifter once per audio context; false when the browser can't run it. */
export function loadVoiceWorklet(context: BaseAudioContext): Promise<boolean> {
  let loading = worklets.get(context);
  if (!loading) {
    loading = (async () => {
      const url = URL.createObjectURL(new Blob([PITCH_WORKLET], { type: 'application/javascript' }));
      try {
        await context.audioWorklet.addModule(url);
        return true;
      } catch {
        return false;
      } finally {
        URL.revokeObjectURL(url);
      }
    })();
    worklets.set(context, loading);
  }
  return loading;
}

const ECHO_SECONDS = 0.27;
const ECHO_FEEDBACK = 0.35;
const HALL_SECONDS = 2.8;

/**
 * A character voice as a piece of audio graph: connect a voice to `input`, take the changed
 * voice from `output`. The profile can be swapped at any time - mid-recording included - and
 * only the effect nodes are rebuilt, so whatever is wired to either end stays connected.
 * <p>
 * Shape: input → pitch → bass → treble → radio band → drive → ring → (dry + echo + hall) → output.
 */
export class VoiceChain {
  readonly input: GainNode;
  readonly output: GainNode;
  private nodes: AudioNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private pitchReady = false;
  private hall: AudioBuffer | null = null;
  private applied: string | null = null;
  private wanted: CharacterVoice | null = null;

  /** Set once the pitch shifter is known not to run here; the other effects still do. */
  pitchUnavailable = false;

  constructor(private readonly context: AudioContext) {
    this.input = context.createGain();
    this.output = context.createGain();
    this.input.connect(this.output);
  }

  /** Loads the pitch shifter; until it's ready a profile plays without its pitch change. */
  async init(): Promise<void> {
    this.pitchReady = await loadVoiceWorklet(this.context);
    this.pitchUnavailable = !this.pitchReady;
    // Rebuild what was asked for before the shifter was ready, now with its pitch.
    this.applied = null;
    this.apply(this.wanted);
  }

  /** Null (or a profile that changes nothing) is the performer's own voice. */
  apply(voice: CharacterVoice | null): void {
    this.wanted = voice;
    const key = isPlainVoice(voice) ? '' : JSON.stringify({ ...voice, preset: null });
    if (key === this.applied) return;
    this.applied = key;
    this.rebuild(isPlainVoice(voice) ? null : voice);
  }

  close(): void {
    this.teardown();
    this.input.disconnect();
    this.output.disconnect();
  }

  private rebuild(voice: CharacterVoice | null): void {
    this.teardown();
    this.input.disconnect();
    if (!voice) {
      this.input.connect(this.output);
      return;
    }

    const ctx = this.context;
    const serial: AudioNode[] = [];

    if (voice.pitchSemitones && this.pitchReady) {
      const node = new AudioWorkletNode(ctx, 'animstudio-pitch-shifter', { outputChannelCount: [1] });
      node.parameters.get('ratio')!.value = Math.pow(2, voice.pitchSemitones / 12);
      serial.push(node);
    }
    if (voice.bassDecibels) serial.push(this.biquad('lowshelf', 200, 0.7, voice.bassDecibels));
    if (voice.trebleDecibels) serial.push(this.biquad('highshelf', 3000, 0.7, voice.trebleDecibels));
    if (voice.radio) {
      serial.push(this.biquad('highpass', 450, 0.9));
      serial.push(this.biquad('lowpass', 3000, 0.9));
    }
    if (voice.drive > 0) {
      const amount = 1 + voice.drive * 9;
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * amount);
      shaper.curve = curve;
      shaper.oversample = '2x';
      serial.push(shaper);
    }
    if (voice.robot > 0) {
      // Multiplying the voice by a low tone gives the metallic sound.
      const carrier = ctx.createGain();
      carrier.gain.value = 1 - voice.robot;
      const osc = ctx.createOscillator();
      osc.frequency.value = voice.robotHertz;
      const depth = ctx.createGain();
      depth.gain.value = voice.robot;
      osc.connect(depth).connect(carrier.gain);
      osc.start();
      this.oscillators.push(osc);
      this.nodes.push(depth);
      serial.push(carrier);
    }

    let last: AudioNode = this.input;
    for (const node of serial) {
      last.connect(node);
      last = node;
    }
    this.nodes.push(...serial);

    // The dry voice dips a little as the space grows, so a big hall doesn't just get louder.
    const dry = ctx.createGain();
    dry.gain.value = 1 - voice.reverb * 0.35 - voice.echo * 0.15;
    last.connect(dry).connect(this.output);
    this.nodes.push(dry);

    if (voice.echo > 0) {
      const delay = ctx.createDelay(1);
      delay.delayTime.value = ECHO_SECONDS;
      const feedback = ctx.createGain();
      feedback.gain.value = ECHO_FEEDBACK;
      const wet = ctx.createGain();
      wet.gain.value = voice.echo * 0.6;
      last.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(wet).connect(this.output);
      this.nodes.push(delay, feedback, wet);
    }
    if (voice.reverb > 0) {
      const convolver = ctx.createConvolver();
      convolver.buffer = this.hallImpulse();
      const wet = ctx.createGain();
      wet.gain.value = voice.reverb * 0.9;
      last.connect(convolver).connect(wet).connect(this.output);
      this.nodes.push(convolver, wet);
    }
  }

  private biquad(type: BiquadFilterType, frequency: number, q: number, gain = 0): BiquadFilterNode {
    const node = this.context.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    node.gain.value = gain;
    return node;
  }

  /** A hall made of decaying noise: no impulse files to download, and good enough for a voice. */
  private hallImpulse(): AudioBuffer {
    if (this.hall) return this.hall;
    const rate = this.context.sampleRate;
    const length = Math.round(rate * HALL_SECONDS);
    const buffer = this.context.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    this.hall = buffer;
    return buffer;
  }

  private teardown(): void {
    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch {
        // Already stopped.
      }
      osc.disconnect();
    }
    this.oscillators = [];
    for (const node of this.nodes) node.disconnect();
    this.nodes = [];
  }
}
