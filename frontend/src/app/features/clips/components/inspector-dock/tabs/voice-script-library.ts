import { parseVoiceScript } from './voice-script';

/**
 * The voiceover scripts kept for one project, so writing a new one doesn't mean losing the
 * last: each is named, the one in the Script box is `activeId`, and the one last laid on A1
 * says when. Kept in the viewer's browser like the draft it replaces.
 */
export interface ScriptLibrary {
  activeId: string;
  scripts: SavedScript[];
}

export interface SavedScript {
  id: string;
  name: string;
  text: string;
  /** Epoch milliseconds. */
  updatedAt: number;
  /** When its lines were last applied on A1. */
  appliedAt?: number;
  /** Named after its first line, and renamed as that line changes, until the user names it. */
  autoName?: boolean;
}

/** Storage key of a project's library, and of the single draft kept before it (read once to carry it over). */
export const LIBRARY_KEY_PREFIX = 'animstudio_vo_scripts_';
export const LEGACY_SCRIPT_KEY_PREFIX = 'animstudio_vo_script_';

export const MAX_SCRIPTS = 50;
export const MAX_SCRIPT_NAME = 60;
/** Well past any voiceover; a value this long in storage is not one of ours. */
const MAX_STORED_TEXT = 200_000;

/**
 * The stored library, checked field by field: storage is shared with anything else on this
 * origin and may hold an old shape. With nothing stored, the old single draft becomes the
 * first script, so nobody loses what they had written.
 */
export function readLibrary(raw: string | null, legacyDraft: string | null, now: number): ScriptLibrary {
  const scripts: SavedScript[] = [];
  let activeId = '';
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (isRecord(parsed) && Array.isArray(parsed['scripts'])) {
      for (const item of parsed['scripts'].slice(0, MAX_SCRIPTS)) {
        const script = toScript(item);
        if (script && !scripts.some((s) => s.id === script.id)) scripts.push(script);
      }
      if (typeof parsed['activeId'] === 'string') activeId = parsed['activeId'];
    }
  } catch {
    /* unreadable: start over below, rather than fail the panel */
  }

  if (scripts.length === 0) {
    const text = legacyDraft && legacyDraft.length <= MAX_STORED_TEXT ? legacyDraft : '';
    scripts.push({ id: newScriptId(), name: suggestName(text, []), text, updatedAt: now, autoName: true });
  }
  if (!scripts.some((s) => s.id === activeId)) activeId = scripts[0].id;
  return { activeId, scripts };
}

/** The project's library as stored in this browser; null when storage is blocked or holds none. */
export function loadStoredLibrary(projectId: string): ScriptLibrary | null {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY_PREFIX + projectId);
    return raw ? readLibrary(raw, null, Date.now()) : null;
  } catch {
    return null;
  }
}

/** The script applied on A1 most recently, else null. */
export function lastApplied(library: ScriptLibrary): SavedScript | null {
  let latest: SavedScript | null = null;
  for (const s of library.scripts) {
    if (s.appliedAt && (!latest || s.appliedAt > (latest.appliedAt ?? 0))) latest = s;
  }
  return latest;
}

/**
 * Only the words that are spoken, one line each - no times, cues or JSON - for a video
 * description or captions. A speaker's name leads their line when more than one speaks.
 */
export function spokenText(text: string): string {
  const lines = parseVoiceScript(text).lines;
  const speakers = new Set(lines.map((l) => l.character).filter(Boolean));
  return lines
    .map((l) => (speakers.size > 1 && l.character ? `${l.character}: ${l.text}` : l.text))
    .join('\n');
}

export function activeScript(library: ScriptLibrary): SavedScript {
  return library.scripts.find((s) => s.id === library.activeId) ?? library.scripts[0];
}

/** Adds a script at the top of the list and makes it the one being edited. Null when the list is full. */
export function addScript(library: ScriptLibrary, text: string, name: string | null, now: number): ScriptLibrary | null {
  if (library.scripts.length >= MAX_SCRIPTS) return null;
  const names = library.scripts.map((s) => s.name);
  const given = cleanName(name ?? '');
  const script: SavedScript = {
    id: newScriptId(),
    name: uniqueName(given || suggestName(text, names), names),
    text,
    updatedAt: now,
    autoName: !given,
  };
  return { activeId: script.id, scripts: [script, ...library.scripts] };
}

export function setActive(library: ScriptLibrary, id: string): ScriptLibrary {
  return library.scripts.some((s) => s.id === id) ? { ...library, activeId: id } : library;
}

/** The edited text of the script in the box; one the user hasn't named follows its first line. */
export function updateActiveText(library: ScriptLibrary, text: string, now: number): ScriptLibrary {
  return withActive(library, (s) => {
    if (!s.autoName) return { ...s, text, updatedAt: now };
    const others = library.scripts.filter((o) => o.id !== s.id).map((o) => o.name);
    return { ...s, text, name: uniqueName(suggestName(text, others), others), updatedAt: now };
  });
}

export function renameScript(library: ScriptLibrary, id: string, name: string): ScriptLibrary {
  const clean = cleanName(name);
  if (!clean) return library;
  const others = library.scripts.filter((s) => s.id !== id).map((s) => s.name);
  return {
    ...library,
    scripts: library.scripts.map((s) => (s.id === id ? { ...s, name: uniqueName(clean, others), autoName: false } : s)),
  };
}

/** Removes a script; removing the last leaves one empty script, so the box always has one. */
export function deleteScript(library: ScriptLibrary, id: string, now: number): ScriptLibrary {
  const scripts = library.scripts.filter((s) => s.id !== id);
  if (scripts.length === 0) {
    const fresh: SavedScript = { id: newScriptId(), name: 'Script 1', text: '', updatedAt: now, autoName: true };
    return { activeId: fresh.id, scripts: [fresh] };
  }
  const activeId = library.activeId === id ? scripts[0].id : library.activeId;
  return { activeId, scripts };
}

export function markApplied(library: ScriptLibrary, now: number): ScriptLibrary {
  return withActive(library, (s) => ({ ...s, appliedAt: now }));
}

/** The first few words of the script's first spoken line, else "Script N". */
export function suggestName(text: string, taken: string[]): string {
  const first = parseVoiceScript(text).lines[0]?.text ?? '';
  const words = first.split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  if (words) return cleanName(words.length > 40 ? `${words.slice(0, 40)}…` : words);
  let n = taken.length + 1;
  while (taken.includes(`Script ${n}`)) n++;
  return `Script ${n}`;
}

function withActive(library: ScriptLibrary, change: (s: SavedScript) => SavedScript): ScriptLibrary {
  return { ...library, scripts: library.scripts.map((s) => (s.id === library.activeId ? change(s) : s)) };
}

function uniqueName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  let n = 2;
  while (taken.includes(`${name} (${n})`)) n++;
  return `${name} (${n})`;
}

function cleanName(name: string): string {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_SCRIPT_NAME);
}

function newScriptId(): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `s_${Date.now().toString(36)}_${random}`;
}

function toScript(item: unknown): SavedScript | null {
  if (!isRecord(item)) return null;
  const { id, name, text, updatedAt, appliedAt, autoName } = item;
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  if (typeof text !== 'string' || text.length > MAX_STORED_TEXT) return null;
  const clean = typeof name === 'string' ? cleanName(name) : '';
  return {
    id,
    name: clean || 'Script',
    text,
    updatedAt: typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : 0,
    appliedAt: typeof appliedAt === 'number' && Number.isFinite(appliedAt) ? appliedAt : undefined,
    autoName: autoName === true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
