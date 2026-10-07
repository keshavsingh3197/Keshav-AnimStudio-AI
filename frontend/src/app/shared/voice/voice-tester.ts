import { CharacterVoice } from './character-voice';
import { VoiceChain } from './voice-chain';

/** A test line is at most this long, so a forgotten recording stops by itself. */
export const TEST_LINE_SECONDS = 10;

/**
 * Try a voice: record a line in your own voice, then hear it back as the character. The
 * line plays through the voice chain on a loop, so moving a slider is heard straight away -
 * and since it's a recording rather than the live mic, there's no feedback on speakers.
 * Nothing is uploaded; the line lives only in this page.
 */
export class VoiceTester {
  private context: AudioContext | null = null;
  private chain: VoiceChain | null = null;
  private player: HTMLAudioElement | null = null;
  private lineUrl: string | null = null;
  private lineBlob: Blob | null = null;
  /** The line re-voiced by the server, while it's the one playing. */
  private studioUrl: string | null = null;
  private recorder: MediaRecorder | null = null;
  private mic: MediaStream | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private voice: CharacterVoice | null = null;

  constructor(private readonly onChange: (state: 'idle' | 'recording' | 'ready' | 'playing') => void) {}

  get hasLine(): boolean {
    return this.lineUrl !== null;
  }

  /** The recorded line, to send for a studio voice. */
  get line(): Blob | null {
    return this.lineBlob;
  }

  /** The studio version is what's playing (not the live chain). */
  get playingStudio(): boolean {
    return this.studioUrl !== null && this.player !== null;
  }

  async record(): Promise<void> {
    this.stopPlaying();
    this.mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(this.mic);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      this.releaseMic();
      if (this.lineUrl) URL.revokeObjectURL(this.lineUrl);
      this.lineBlob = chunks.length ? new Blob(chunks, { type: recorder.mimeType }) : null;
      this.lineUrl = this.lineBlob ? URL.createObjectURL(this.lineBlob) : null;
      this.onChange(this.lineUrl ? 'ready' : 'idle');
      if (this.lineUrl) void this.play();
    };
    this.recorder = recorder;
    recorder.start();
    this.stopTimer = setTimeout(() => this.stopRecording(), TEST_LINE_SECONDS * 1000);
    this.onChange('recording');
  }

  stopRecording(): void {
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.recorder = null;
  }

  /**
   * Plays the line on a loop: through the live chain, or - given the studio version - that
   * file as it is, since the voice is already in it.
   */
  async play(studio?: Blob): Promise<void> {
    if (!this.lineUrl) return;
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' });
      this.chain = new VoiceChain(this.context);
      this.chain.output.connect(this.context.destination);
      await this.chain.init();
    }
    if (this.context.state !== 'running') await this.context.resume();
    this.stopPlaying();
    if (studio) this.studioUrl = URL.createObjectURL(studio);
    // A fresh element each time: an element can be wired into an audio graph only once.
    const player = new Audio(this.studioUrl ?? this.lineUrl);
    player.loop = true;
    this.context.createMediaElementSource(player).connect(this.chain!.input);
    this.chain!.apply(this.studioUrl ? null : this.voice);
    this.player = player;
    await player.play();
    this.onChange('playing');
  }

  stopPlaying(): void {
    if (this.studioUrl) URL.revokeObjectURL(this.studioUrl);
    this.studioUrl = null;
    if (!this.player) return;
    this.player.pause();
    this.player.removeAttribute('src');
    this.player.load();
    this.player = null;
    this.onChange(this.lineUrl ? 'ready' : 'idle');
  }

  /** The voice the line plays as; changes are heard on the next audio block. */
  setVoice(voice: CharacterVoice | null): void {
    this.voice = voice;
    // The studio version was made with the old voice: go back to the live loop with the new one.
    if (this.playingStudio) void this.play();
    else this.chain?.apply(voice);
  }

  get pitchUnavailable(): boolean {
    return this.chain?.pitchUnavailable ?? false;
  }

  close(): void {
    this.stopRecording();
    this.stopPlaying();
    this.releaseMic();
    if (this.lineUrl) URL.revokeObjectURL(this.lineUrl);
    this.lineUrl = null;
    this.lineBlob = null;
    this.chain?.close();
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.chain = null;
  }

  private releaseMic(): void {
    this.mic?.getTracks().forEach((t) => t.stop());
    this.mic = null;
  }
}
