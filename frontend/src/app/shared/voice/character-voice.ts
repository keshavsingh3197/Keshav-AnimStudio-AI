/**
 * A character's voice: how a performer's own voice is changed to speak as that character.
 * Every field is a plain effect amount, so the same profile sounds the same in the
 * character editor, Collab Studio and Camera Studio, and is what the API stores.
 */
export interface CharacterVoice {
  /** The preset it started from; "custom" once changed by hand. */
  preset?: string | null;
  /** -12 (an octave down) to +12 (an octave up). */
  pitchSemitones: number;
  /**
   * -6 to +6: the size of the body the voice comes from (its formants), apart from pitch.
   * Negative is bigger and older, positive smaller and younger. Only the studio voice can
   * move it; the live preview can't, so it's heard after "Studio voice".
   */
  sizeSemitones?: number;
  /** Low-shelf boost or cut, dB (-12 to 12): weight and chest. */
  bassDecibels: number;
  /** High-shelf boost or cut, dB (-12 to 12): air and edge. */
  trebleDecibels: number;
  /** 0-1: gravel and growl. */
  drive: number;
  /** 0-1: ring modulation, the metallic robot sound. */
  robot: number;
  /** The robot's tone, 20-400 Hz. */
  robotHertz: number;
  /** A narrow walkie-talkie band. */
  radio: boolean;
  /** 0-1: a slapback echo. */
  echo: number;
  /** 0-1: a large hall, for divine or distant voices. */
  reverb: number;
  /**
   * A project recording of a real person's voice: the studio voice turns your performance into
   * theirs with local AI (timing and acting kept). Pitch and size then come from the sample.
   */
  aiSampleAssetId?: string | null;
  /** That person agreed to their voice being used. The API refuses a sample without it. */
  aiSampleConsent?: boolean;
}

export interface VoicePreset {
  id: string;
  label: string;
  icon: string;
  hint: string;
  voice: Omit<CharacterVoice, 'preset'>;
}

const plain: Omit<CharacterVoice, 'preset'> = {
  pitchSemitones: 0, sizeSemitones: 0, bassDecibels: 0, trebleDecibels: 0, drive: 0, robot: 0, robotHertz: 60, radio: false, echo: 0, reverb: 0,
  aiSampleAssetId: null, aiSampleConsent: false,
};

export const VOICE_PRESETS: readonly VoicePreset[] = [
  { id: 'divine', label: 'Divine', icon: '🪷', hint: 'Calm, deep and vast: Vishnu, Shiva, a voice from the heavens.',
    voice: { ...plain, pitchSemitones: -2, sizeSemitones: -1, bassDecibels: 4, trebleDecibels: 2, reverb: 0.5 } },
  { id: 'goddess', label: 'Goddess', icon: '🌺', hint: 'Bright and radiant, with a temple\'s space around it.',
    voice: { ...plain, pitchSemitones: 5, sizeSemitones: 2.5, trebleDecibels: 3, reverb: 0.4 } },
  { id: 'demon', label: 'Demon / Asura', icon: '👹', hint: 'Low, gravelly and menacing.',
    voice: { ...plain, pitchSemitones: -7, sizeSemitones: -3, bassDecibels: 6, drive: 0.55, robot: 0.15, robotHertz: 40, reverb: 0.2 } },
  { id: 'villain', label: 'Villain', icon: '🦹', hint: 'A darker, rougher version of you.',
    voice: { ...plain, pitchSemitones: -4, sizeSemitones: -1.5, bassDecibels: 3, drive: 0.3, echo: 0.1 } },
  { id: 'sage', label: 'Sage / Rishi', icon: '🧘', hint: 'Warm and unhurried, with a soft echo.',
    voice: { ...plain, pitchSemitones: -1, sizeSemitones: -0.5, bassDecibels: 2, trebleDecibels: -2, echo: 0.15, reverb: 0.25 } },
  { id: 'elder', label: 'Elder', icon: '👴', hint: 'Lower, softer and a little worn.',
    voice: { ...plain, pitchSemitones: -2, sizeSemitones: -0.5, trebleDecibels: -4, drive: 0.1 } },
  { id: 'narrator', label: 'Narrator', icon: '🎙️', hint: 'Your voice, fuller: a storyteller\'s broadcast warmth.',
    voice: { ...plain, pitchSemitones: -1, sizeSemitones: -1, bassDecibels: 3, trebleDecibels: 1 } },
  { id: 'man', label: 'Man', icon: '🧔', hint: 'A lower, bigger voice: for a man\'s part, from a higher voice. Best heard with Studio voice.',
    voice: { ...plain, pitchSemitones: -5, sizeSemitones: -2.5, bassDecibels: 2 } },
  { id: 'woman', label: 'Woman', icon: '👩', hint: 'A higher, smaller voice: for a woman\'s part, from a lower voice. Best heard with Studio voice.',
    voice: { ...plain, pitchSemitones: 5, sizeSemitones: 2.5, trebleDecibels: 2 } },
  { id: 'child', label: 'Child', icon: '🧒', hint: 'Higher and lighter.',
    voice: { ...plain, pitchSemitones: 6, sizeSemitones: 4, bassDecibels: -4, trebleDecibels: 2 } },
  { id: 'giant', label: 'Giant', icon: '🗿', hint: 'Enormous and booming.',
    voice: { ...plain, pitchSemitones: -9, sizeSemitones: -5, bassDecibels: 8, reverb: 0.3 } },
  { id: 'spirit', label: 'Spirit', icon: '👻', hint: 'Airy and haunting, echoing away.',
    voice: { ...plain, pitchSemitones: 2, sizeSemitones: 1, trebleDecibels: 4, echo: 0.5, reverb: 0.7 } },
  { id: 'robot', label: 'Robot', icon: '🤖', hint: 'Metallic and machine-like.',
    voice: { ...plain, pitchSemitones: -2, robot: 0.85, robotHertz: 45 } },
  { id: 'radio', label: 'Radio', icon: '📻', hint: 'Over a walkie-talkie.',
    voice: { ...plain, radio: true, drive: 0.22 } },
];

export function voiceFromPreset(id: string): CharacterVoice {
  const preset = VOICE_PRESETS.find((p) => p.id === id);
  return { preset: preset ? id : 'custom', ...(preset?.voice ?? plain) };
}

const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

/** Anything read from the API, storage or a form is kept to the ranges the API accepts. */
export function sanitizeVoice(raw: unknown): CharacterVoice | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Partial<CharacterVoice>;
  return {
    preset: typeof v.preset === 'string' && /^[a-z0-9-]{1,40}$/.test(v.preset) ? v.preset : 'custom',
    pitchSemitones: num(v.pitchSemitones, -12, 12, 0),
    sizeSemitones: num(v.sizeSemitones, -6, 6, 0),
    bassDecibels: num(v.bassDecibels, -12, 12, 0),
    trebleDecibels: num(v.trebleDecibels, -12, 12, 0),
    drive: num(v.drive, 0, 1, 0),
    robot: num(v.robot, 0, 1, 0),
    robotHertz: num(v.robotHertz, 20, 400, 60),
    radio: typeof v.radio === 'boolean' ? v.radio : false,
    echo: num(v.echo, 0, 1, 0),
    reverb: num(v.reverb, 0, 1, 0),
    aiSampleAssetId: typeof v.aiSampleAssetId === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v.aiSampleAssetId) ? v.aiSampleAssetId : null,
    aiSampleConsent: v.aiSampleConsent === true,
  };
}

/** True when the profile changes nothing, so the chain can be a straight wire. */
export function isPlainVoice(v: CharacterVoice | null): boolean {
  return !v || (!v.aiSampleAssetId && v.pitchSemitones === 0 && !v.sizeSemitones && v.bassDecibels === 0 && v.trebleDecibels === 0 && v.drive === 0
    && v.robot === 0 && !v.radio && v.echo === 0 && v.reverb === 0);
}

/** A short line for a card: "Divine · −2 st · hall". */
export function describeVoice(v: CharacterVoice | null | undefined): string {
  if (!v) return 'Own voice';
  const preset = VOICE_PRESETS.find((p) => p.id === v.preset);
  const parts: string[] = [v.aiSampleAssetId ? 'AI voice' : preset ? preset.label : 'Custom'];
  if (v.pitchSemitones) parts.push(`${v.pitchSemitones > 0 ? '+' : '−'}${Math.abs(v.pitchSemitones)} st`);
  if (v.sizeSemitones && Math.abs(v.sizeSemitones) >= 1) parts.push(v.sizeSemitones < 0 ? 'bigger' : 'smaller');
  if (v.robot >= 0.3) parts.push('robot');
  if (v.drive >= 0.3) parts.push('growl');
  if (v.radio) parts.push('radio');
  if (v.reverb >= 0.3) parts.push('hall');
  else if (v.echo >= 0.3) parts.push('echo');
  return parts.join(' · ');
}
