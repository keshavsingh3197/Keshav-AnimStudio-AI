/**
 * The voice script: what the voiceover panel's Script box accepts, so a script written by an
 * AI tool can say who speaks each line, when, how fast and in which voice.
 *
 * Three forms, all optional beyond plain text:
 *
 * 1. Plain lines - one line per clip, exactly as before.
 *
 * 2. Text with cues:
 *      @Narrator: voice=my:KESHAV, speed=0.95
 *      @Vishnu: voice=hm_omega, speed=0.9
 *      [0:00.3] Narrator (calm): यह केवल भूखे रहने का नियम नहीं...
 *      [0:10.5] Vishnu (divine, 0.85x): पद्म पुराण प्रमाण देता है...
 *      Narrator: a line with no time follows on after the one before it.
 *
 * 3. JSON: { "version": 1, "characters": [{ "name", "voice", "speed" }],
 *            "lines": [{ "character", "start", "end", "text", "speed", "voice", "emotion" }] }
 *    "end" is optional: the second the line must have finished by (else the next line's start).
 *
 * A voice is a built-in voice id ("hm_omega") or "my:" and the name of one of the user's own
 * voices. The script is untrusted input (it usually comes from an AI tool): every field is
 * checked here, and anything out of range is reported as an error rather than guessed at.
 */

/** Must match VoiceoverController.MaxTextChars. */
export const MAX_LINE_CHARS = 2000;
/** Must match VoiceoverController's speed range. */
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.0;
export const MY_VOICE_PREFIX = 'my:';

const MAX_LINES = 500;
const MAX_CHARACTERS = 50;
const MAX_NAME_CHARS = 40;
const MAX_EMOTION_CHARS = 30;
/** Four hours: longer than any video this studio makes. */
const MAX_START_SECONDS = 4 * 60 * 60;
const MAX_ERRORS = 20;

/** Must match VoiceoverController.VoiceIdPattern. */
const VOICE_ID = /^[A-Za-z0-9_.+-]{1,64}$/;
/** Same limit as a voice's name in MyVoicesController. */
const MY_VOICE_NAME = /^.{1,60}$/u;

/** "[0:10.5]", "[1:02:03]", "[10.5s]", "[10s]", "[10.5]" - never "[3]", which numbers a line. */
const TIMESTAMP = /^\[\s*((?:\d{1,2}:)?\d{1,2}:\d{1,2}(?:\.\d+)?|\d+(?:\.\d+)?\s*s|\d+\.\d+)\s*\]\s*/i;
/** "1." / "1)" / "[3]" numbers the line for the writer, not the listener. */
const NUMBERING = /^\s*(\[\d+\]|\d+[.)])\s*/;
/** "Name (options): text". A name has no sentence punctuation, so prose with a colon stays prose. */
const SPEAKER = /^([\p{L}\p{M}\p{N}_' -]{1,40}?)\s*(?:\(([^()]{0,120})\))?\s*:\s*(\S.*)$/u;
/** "@Name: voice=..., speed=..." declares a character. */
const DECLARATION = /^@\s*([\p{L}\p{M}\p{N}_' -]{1,40}?)\s*:\s*(.*)$/u;

export interface VoiceScriptCharacter {
  name: string;
  voice?: string;
  speed?: number;
}

export interface VoiceScriptLine {
  index: number;
  text: string;
  tooLong: boolean;
  character?: string;
  /** Seconds from the start of the video. */
  start?: number;
  /** Seconds from the start of the video by which the line must have finished; the voice speeds up to make it. */
  end?: number;
  speed?: number;
  voice?: string;
  /** Kept and shown, but not yet spoken differently: no speech engine here takes an emotion. */
  emotion?: string;
}

export interface VoiceScript {
  lines: VoiceScriptLine[];
  characters: VoiceScriptCharacter[];
  errors: string[];
  /** Written as JSON or with cues, rather than plain lines. */
  structured: boolean;
  hasTimings: boolean;
}

export function parseVoiceScript(source: string): VoiceScript {
  const trimmed = source.trim();
  const script = trimmed.startsWith('{') ? parseJson(trimmed) : parseText(source);
  if (script.lines.length > MAX_LINES) {
    script.errors.push(`A script can have at most ${MAX_LINES} lines; this one has ${script.lines.length}.`);
  }
  script.errors = script.errors.slice(0, MAX_ERRORS);
  script.hasTimings = script.lines.some((l) => l.start !== undefined);
  return script;
}

/** The character a line belongs to, matched without regard to case. */
export function findCharacter(script: VoiceScript, name: string | undefined): VoiceScriptCharacter | undefined {
  if (!name) return undefined;
  const key = name.toLowerCase();
  return script.characters.find((c) => c.name.toLowerCase() === key);
}

/** Seconds from "10.5", "10.5s", "0:10.5" or "1:02:03.5"; null when it is none of those. */
export function parseTime(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/\s*s$/, '');
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  const parts = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/.exec(text);
  if (!parts) return null;
  const [, hours, minutes, seconds] = parts;
  if (Number(seconds) >= 60 || (hours !== undefined && Number(minutes) >= 60)) return null;
  return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds);
}

// --- text with cues

function parseText(source: string): VoiceScript {
  const errors: string[] = [];
  const characters: VoiceScriptCharacter[] = [];
  const raw: Omit<VoiceScriptLine, 'index' | 'tooLong'>[] = [];
  let structured = false;

  const rows = source.split(/\r?\n/);
  rows.forEach((row, i) => {
    const where = `Row ${i + 1}`;
    let text = row.trim();
    if (!text) return;

    const declaration = DECLARATION.exec(text);
    if (declaration) {
      structured = true;
      const character = checkCharacter(where, declaration[1], parseOptions(declaration[2]), characters, errors);
      if (character) characters.push(character);
      return;
    }

    text = text.replace(NUMBERING, '');
    let start: number | undefined;
    const stamp = TIMESTAMP.exec(text);
    if (stamp) {
      structured = true;
      const seconds = parseTime(stamp[1]);
      if (seconds === null || seconds > MAX_START_SECONDS) errors.push(`${where}: "${stamp[1]}" isn't a time like [0:10.5] or [10.5s].`);
      else start = seconds;
      text = text.slice(stamp[0].length);
    }

    const line: Omit<VoiceScriptLine, 'index' | 'tooLong'> = { text, start };
    const speaker = SPEAKER.exec(text);
    const name = speaker?.[1].trim();
    // "Name:" alone is too common in prose to be a cue; it needs a time, options, or a declaration.
    const isCue = !!speaker && !!name && !/^\d+$/.test(name) && name.split(/\s+/).length <= 4
      && (start !== undefined || speaker[2] !== undefined || characters.some((c) => c.name.toLowerCase() === name.toLowerCase()));
    if (isCue) {
      structured = true;
      line.character = name;
      line.text = speaker![3].trim();
      const options = parseOptions(speaker![2] ?? '');
      applyLineOptions(where, line, options, errors);
    }

    if (line.text) raw.push(line);
  });

  return finish(raw, characters, errors, structured);
}

interface Options {
  voice?: string;
  speed?: string;
  emotion?: string;
  unknown: string[];
}

/** "voice=hm_omega, speed=0.9" or "divine, 0.85x". */
function parseOptions(text: string): Options {
  const options: Options = { unknown: [] };
  for (const token of text.split(',').map((t) => t.trim()).filter(Boolean)) {
    const pair = /^(\w+)\s*[=:]\s*(.+)$/.exec(token);
    if (pair) {
      const key = pair[1].toLowerCase();
      if (key === 'voice') options.voice = pair[2].trim();
      else if (key === 'speed' || key === 'rate') options.speed = pair[2].trim();
      else if (key === 'emotion' || key === 'tone') options.emotion = pair[2].trim();
      else options.unknown.push(token);
    } else if (/^\d+(\.\d+)?\s*x$/i.test(token)) {
      options.speed = token;
    } else if (!options.emotion) {
      options.emotion = token;
    } else {
      options.unknown.push(token);
    }
  }
  return options;
}

function applyLineOptions(where: string, line: Omit<VoiceScriptLine, 'index' | 'tooLong'>, options: Options, errors: string[]): void {
  if (options.voice !== undefined) {
    const voice = checkVoice(where, options.voice, errors);
    if (voice) line.voice = voice;
  }
  if (options.speed !== undefined) {
    const speed = checkSpeed(where, options.speed, errors);
    if (speed !== undefined) line.speed = speed;
  }
  if (options.emotion !== undefined) {
    const emotion = checkEmotion(where, options.emotion, errors);
    if (emotion) line.emotion = emotion;
  }
  if (options.unknown.length > 0) errors.push(`${where}: didn't understand "${options.unknown[0]}".`);
}

// --- JSON

function parseJson(source: string): VoiceScript {
  const errors: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return { lines: [], characters: [], errors: ['The script starts with "{" but isn\'t valid JSON.'], structured: true, hasTimings: false };
  }
  if (!isObject(data)) {
    return { lines: [], characters: [], errors: ['The JSON script must be an object with a "lines" list.'], structured: true, hasTimings: false };
  }
  if (data['version'] !== undefined && data['version'] !== 1) errors.push('Only "version": 1 is understood.');

  const characters: VoiceScriptCharacter[] = [];
  const declared = data['characters'];
  if (declared !== undefined && !Array.isArray(declared)) errors.push('"characters" must be a list.');
  if (Array.isArray(declared)) {
    if (declared.length > MAX_CHARACTERS) errors.push(`At most ${MAX_CHARACTERS} characters.`);
    declared.slice(0, MAX_CHARACTERS).forEach((c, i) => {
      const where = `Character ${i + 1}`;
      if (!isObject(c) || typeof c['name'] !== 'string') {
        errors.push(`${where}: needs a "name".`);
        return;
      }
      const options: Options = {
        voice: optionalString(where, c, 'voice', errors),
        speed: optionalNumberText(where, c, 'speed', errors),
        unknown: [],
      };
      const character = checkCharacter(where, c['name'], options, characters, errors);
      if (character) characters.push(character);
    });
  }

  const raw: Omit<VoiceScriptLine, 'index' | 'tooLong'>[] = [];
  const lines = data['lines'];
  if (!Array.isArray(lines)) {
    errors.push('The JSON script needs a "lines" list.');
  } else {
    lines.slice(0, MAX_LINES + 1).forEach((l, i) => {
      const where = `Line ${i + 1}`;
      if (!isObject(l) || typeof l['text'] !== 'string' || !l['text'].trim()) {
        errors.push(`${where}: needs a "text".`);
        return;
      }
      const line: Omit<VoiceScriptLine, 'index' | 'tooLong'> = { text: l['text'].trim() };

      const character = optionalString(where, l, 'character', errors);
      if (character !== undefined) {
        const name = character.trim();
        if (!name || name.length > MAX_NAME_CHARS) errors.push(`${where}: a character name is 1-${MAX_NAME_CHARS} characters.`);
        else line.character = name;
      }

      const start = l['start'];
      if (start !== undefined && start !== null) {
        const seconds = typeof start === 'number' ? start : typeof start === 'string' ? parseTime(start) : null;
        if (seconds === null || !Number.isFinite(seconds) || seconds < 0 || seconds > MAX_START_SECONDS) {
          errors.push(`${where}: "start" must be seconds (10.5) or a time ("0:10.5").`);
        } else {
          line.start = seconds;
        }
      }

      const end = l['end'];
      if (end !== undefined && end !== null) {
        const seconds = typeof end === 'number' ? end : typeof end === 'string' ? parseTime(end) : null;
        if (seconds === null || !Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_START_SECONDS) {
          errors.push(`${where}: "end" must be seconds (16) or a time ("0:16").`);
        } else if (line.start !== undefined && seconds <= line.start) {
          errors.push(`${where}: "end" must come after "start".`);
        } else {
          line.end = seconds;
        }
      }

      applyLineOptions(where, line, {
        voice: optionalString(where, l, 'voice', errors),
        speed: optionalNumberText(where, l, 'speed', errors),
        emotion: optionalString(where, l, 'emotion', errors),
        unknown: [],
      }, errors);
      raw.push(line);
    });
  }

  return finish(raw, characters, errors, true);
}

// --- checks shared by both forms

function checkCharacter(
  where: string, rawName: string, options: Options, known: VoiceScriptCharacter[], errors: string[],
): VoiceScriptCharacter | null {
  const name = rawName.trim();
  if (!name || name.length > MAX_NAME_CHARS) {
    errors.push(`${where}: a character name is 1-${MAX_NAME_CHARS} characters.`);
    return null;
  }
  if (known.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    errors.push(`${where}: "${name}" is described twice.`);
    return null;
  }
  const character: VoiceScriptCharacter = { name };
  if (options.voice !== undefined) {
    const voice = checkVoice(where, options.voice, errors);
    if (voice) character.voice = voice;
  }
  if (options.speed !== undefined) {
    const speed = checkSpeed(where, options.speed, errors);
    if (speed !== undefined) character.speed = speed;
  }
  if (options.unknown.length > 0) errors.push(`${where}: didn't understand "${options.unknown[0]}".`);
  return character;
}

function checkVoice(where: string, value: string, errors: string[]): string | undefined {
  const voice = value.trim();
  if (voice.toLowerCase().startsWith(MY_VOICE_PREFIX)) {
    const name = voice.slice(MY_VOICE_PREFIX.length).trim();
    if (MY_VOICE_NAME.test(name)) return MY_VOICE_PREFIX + name;
  } else if (VOICE_ID.test(voice)) {
    return voice;
  }
  errors.push(`${where}: "${voice.slice(0, 70)}" isn't a voice id (like hm_omega) or my:<your voice's name>.`);
  return undefined;
}

function checkSpeed(where: string, value: string, errors: string[]): number | undefined {
  const speed = Number(value.trim().replace(/\s*x$/i, ''));
  if (Number.isFinite(speed) && speed >= MIN_SPEED && speed <= MAX_SPEED) return speed;
  errors.push(`${where}: speed must be between ${MIN_SPEED} and ${MAX_SPEED}.`);
  return undefined;
}

function checkEmotion(where: string, value: string, errors: string[]): string | undefined {
  const emotion = value.trim().toLowerCase();
  if (!emotion) return undefined;
  if (emotion.length <= MAX_EMOTION_CHARS && /^[\p{L}\p{M} -]+$/u.test(emotion)) return emotion;
  errors.push(`${where}: an emotion is a word or two, like "calm" or "excited".`);
  return undefined;
}

function finish(
  raw: Omit<VoiceScriptLine, 'index' | 'tooLong'>[], characters: VoiceScriptCharacter[], errors: string[], structured: boolean,
): VoiceScript {
  const lines = raw.map((l, index) => ({ ...l, index, tooLong: l.text.length > MAX_LINE_CHARS }));
  return { lines, characters, errors, structured, hasTimings: false };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(where: string, obj: Record<string, unknown>, key: string, errors: string[]): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  errors.push(`${where}: "${key}" must be text.`);
  return undefined;
}

function optionalNumberText(where: string, obj: Record<string, unknown>, key: string, errors: string[]): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  errors.push(`${where}: "${key}" must be a number.`);
  return undefined;
}
