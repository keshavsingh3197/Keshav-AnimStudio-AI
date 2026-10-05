import { VoiceSettings } from './studio-settings';

/**
 * The stream's sound: the microphone through an optional voice changer, plus the shared
 * screen's own audio, mixed into one track. There is always a track - silent when muted or
 * when nothing is connected - because YouTube expects audio in every stream.
 */

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

export class AudioMixer {
  readonly context: AudioContext;
  private readonly destination: MediaStreamAudioDestinationNode;
  private readonly micIn: GainNode;
  private readonly effectOut: GainNode;
  private readonly micOut: GainNode;
  private readonly screenOut: GainNode;
  private readonly monitorOut: GainNode;
  private readonly analyser: AnalyserNode;
  private readonly levels: Float32Array<ArrayBuffer>;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private screenSource: MediaStreamAudioSourceNode | null = null;
  private fileSource: MediaElementAudioSourceNode | null = null;
  private chain: AudioNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private workletReady = false;
  private applied = '';

  /** Set when the pitch effects can't run in this browser. */
  pitchUnavailable = false;

  constructor() {
    this.context = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
    this.destination = this.context.createMediaStreamDestination();
    this.micIn = this.context.createGain();
    this.effectOut = this.context.createGain();
    this.micOut = this.context.createGain();
    this.screenOut = this.context.createGain();
    this.monitorOut = this.context.createGain();
    this.monitorOut.gain.value = 0;
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;
    this.levels = new Float32Array(this.analyser.fftSize);

    this.effectOut.connect(this.micOut);
    this.micOut.connect(this.destination);
    this.micOut.connect(this.analyser);
    this.micOut.connect(this.monitorOut);
    this.monitorOut.connect(this.context.destination);
    this.screenOut.connect(this.destination);
    this.micIn.connect(this.effectOut);
  }

  /** The mixed track, for the recorder. */
  get stream(): MediaStream {
    return this.destination.stream;
  }

  async init(): Promise<void> {
    if (this.context.state === 'suspended') await this.context.resume();
    try {
      const url = URL.createObjectURL(new Blob([PITCH_WORKLET], { type: 'application/javascript' }));
      try {
        await this.context.audioWorklet.addModule(url);
        this.workletReady = true;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      this.pitchUnavailable = true;
    }
  }

  setMicrophone(stream: MediaStream | null): void {
    this.micSource?.disconnect();
    this.micSource = stream && stream.getAudioTracks().length ? this.context.createMediaStreamSource(stream) : null;
    this.micSource?.connect(this.micIn);
  }

  setScreenAudio(stream: MediaStream | null): void {
    this.screenSource?.disconnect();
    this.screenSource = stream && stream.getAudioTracks().length ? this.context.createMediaStreamSource(stream) : null;
    this.screenSource?.connect(this.screenOut);
  }

  /**
   * A video file's own soundtrack, when the studio's source is a video: into the program
   * and to the speakers, so it can be heard while it is processed. An element can only be
   * attached to one audio context, so a restarted studio needs a fresh element.
   */
  setMediaElement(video: HTMLVideoElement | null): void {
    this.fileSource?.disconnect();
    this.fileSource = video ? this.context.createMediaElementSource(video) : null;
    this.fileSource?.connect(this.destination);
    this.fileSource?.connect(this.context.destination);
  }

  get hasScreenAudio(): boolean {
    return this.screenSource !== null;
  }

  /** Lets the presenter hear the voice changer. Headphones only, or the speakers feed back into the mic. */
  setMonitor(on: boolean): void {
    this.monitorOut.gain.setTargetAtTime(on ? 1 : 0, this.context.currentTime, 0.05);
  }

  apply(voice: VoiceSettings): void {
    const now = this.context.currentTime;
    this.micOut.gain.setTargetAtTime(voice.muted ? 0 : voice.gain, now, 0.02);
    this.screenOut.gain.setTargetAtTime(voice.screenAudio ? voice.screenAudioGain : 0, now, 0.02);

    // The effect chain is only rebuilt when the effect itself changes, not on every gain tweak.
    const key = `${voice.effect}|${voice.pitch}`;
    if (key === this.applied) return;
    this.applied = key;
    this.rebuild(voice);
  }

  /** 0-1, for the level meter. */
  level(): number {
    this.analyser.getFloatTimeDomainData(this.levels);
    let sum = 0;
    for (const v of this.levels) sum += v * v;
    return Math.min(1, Math.sqrt(sum / this.levels.length) * 4);
  }

  async close(): Promise<void> {
    this.teardown();
    this.micSource?.disconnect();
    this.screenSource?.disconnect();
    this.fileSource?.disconnect();
    await this.context.close();
  }

  private rebuild(voice: VoiceSettings): void {
    this.teardown();
    const ctx = this.context;
    const nodes: AudioNode[] = [];

    const pitch = (semitones: number) => {
      if (!this.workletReady) return;
      const node = new AudioWorkletNode(ctx, 'animstudio-pitch-shifter', { outputChannelCount: [1] });
      node.parameters.get('ratio')!.value = Math.pow(2, semitones / 12);
      nodes.push(node);
    };
    const ring = (frequency: number, depth: number) => {
      // Multiplying the voice by a low tone gives the metallic "robot" sound.
      const carrier = ctx.createGain();
      carrier.gain.value = 1 - depth;
      const osc = ctx.createOscillator();
      osc.frequency.value = frequency;
      const amount = ctx.createGain();
      amount.gain.value = depth;
      osc.connect(amount).connect(carrier.gain);
      osc.start();
      this.oscillators.push(osc);
      nodes.push(carrier);
    };
    const filter = (type: BiquadFilterType, frequency: number, q = 0.7) => {
      const node = ctx.createBiquadFilter();
      node.type = type;
      node.frequency.value = frequency;
      node.Q.value = q;
      nodes.push(node);
    };
    const drive = (amount: number) => {
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * amount);
      }
      shaper.curve = curve;
      nodes.push(shaper);
    };

    switch (voice.effect) {
      case 'deep':
        pitch(-Math.max(1, Math.abs(voice.pitch)));
        filter('lowshelf', 200, 0.7);
        break;
      case 'high':
        pitch(Math.max(1, Math.abs(voice.pitch)));
        break;
      case 'robot':
        pitch(-2);
        ring(45, 0.85);
        filter('peaking', 1400, 2);
        break;
      case 'radio':
        filter('highpass', 450, 0.9);
        filter('lowpass', 3000, 0.9);
        drive(3);
        break;
      case 'alien':
        pitch(5);
        ring(110, 0.5);
        break;
    }

    // Rewire: micIn → chain → effectOut. A missing pitch worklet leaves the other parts of the effect.
    this.micIn.disconnect();
    let previous: AudioNode = this.micIn;
    for (const node of nodes) {
      previous.connect(node);
      previous = node;
    }
    previous.connect(this.effectOut);
    this.chain = nodes;
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
    for (const node of this.chain) node.disconnect();
    this.chain = [];
  }
}
