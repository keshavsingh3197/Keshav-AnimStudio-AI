import { CharacterVoice, voiceFromPreset } from '../../shared/voice/character-voice';
import { VoiceChain } from '../../shared/voice/voice-chain';
import { VoiceSettings } from './studio-settings';

/**
 * The stream's sound: the microphone through an optional voice changer, plus the shared
 * screen's own audio, mixed into one track. There is always a track - silent when muted or
 * when nothing is connected - because YouTube expects audio in every stream.
 */

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
  private readonly chain: VoiceChain;

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
    this.chain = new VoiceChain(this.context);
    this.micIn.connect(this.chain.input);
    this.chain.output.connect(this.effectOut);
  }

  /** The mixed track, for the recorder. */
  get stream(): MediaStream {
    return this.destination.stream;
  }

  async init(): Promise<void> {
    if (this.context.state === 'suspended') await this.context.resume();
    await this.chain.init();
    this.pitchUnavailable = this.chain.pitchUnavailable;
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

  /** `character` is the worn project character's voice, used by the "character" effect. */
  apply(voice: VoiceSettings, character: CharacterVoice | null = null): void {
    const now = this.context.currentTime;
    this.micOut.gain.setTargetAtTime(voice.muted ? 0 : voice.gain, now, 0.02);
    this.screenOut.gain.setTargetAtTime(voice.screenAudio ? voice.screenAudioGain : 0, now, 0.02);
    this.chain.apply(effectVoice(voice, character));
  }

  /** 0-1, for the level meter. */
  level(): number {
    this.analyser.getFloatTimeDomainData(this.levels);
    let sum = 0;
    for (const v of this.levels) sum += v * v;
    return Math.min(1, Math.sqrt(sum / this.levels.length) * 4);
  }

  async close(): Promise<void> {
    this.chain.close();
    this.micSource?.disconnect();
    this.screenSource?.disconnect();
    this.fileSource?.disconnect();
    await this.context.close();
  }
}

/** The studio's quick effects, as character voices, so one engine plays both. */
function effectVoice(voice: VoiceSettings, character: CharacterVoice | null): CharacterVoice | null {
  const shift = Math.max(1, Math.abs(voice.pitch));
  switch (voice.effect) {
    case 'deep': return { ...voiceFromPreset('custom'), pitchSemitones: -shift };
    case 'high': return { ...voiceFromPreset('custom'), pitchSemitones: shift };
    case 'robot': return voiceFromPreset('robot');
    case 'radio': return voiceFromPreset('radio');
    case 'alien': return { ...voiceFromPreset('custom'), pitchSemitones: 5, robot: 0.5, robotHertz: 110 };
    case 'character': return character;
    default: return null;
  }
}
