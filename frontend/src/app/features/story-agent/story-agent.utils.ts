import {
  CitationStatus,
  StoryBasis,
  StoryRunStatus,
  StoryScene,
  StorySource,
  StoryStageId,
  StoryStageStatus,
} from '../../core/models/story-agent.models';

/** How a status reads as a colour: the same classes every pill in the studio uses. */
export type Tone = 'ok' | 'warn' | 'err' | 'brand' | '';

export const STAGE_INFO: Record<StoryStageId, { label: string; hint: string }> = {
  research: { label: 'Search the Granths', hint: 'Finds the chapters the story comes from' },
  script: { label: 'Write the script', hint: 'Grounded in what was found, every source checked' },
  visuals: { label: 'Pictures', hint: 'Yours, AI-made, or a plain background' },
  narration: { label: 'Narration', hint: 'The voice, line by line' },
  music: { label: 'Music', hint: 'A soft Creative Commons track, credited' },
  assemble: { label: 'Build the project', hint: 'Scenes, subtitles and sound in one project' },
  render: { label: 'Render the video', hint: 'The finished MP4' },
  kit: { label: 'YouTube details', hint: 'Title, description, tags, chapters' },
};

export const STATUS_LABEL: Record<StoryRunStatus, string> = {
  Researching: 'Searching the Granths',
  WritingScript: 'Writing the script',
  AwaitingScript: 'Waiting for the script',
  ScriptReady: 'Script ready to read',
  Building: 'Making the video',
  Completed: 'Done',
  Failed: 'Stopped with a problem',
  Cancelled: 'Stopped',
};

export function statusTone(status: StoryRunStatus): Tone {
  switch (status) {
    case 'Completed': return 'ok';
    case 'Failed': return 'err';
    case 'Cancelled': return 'warn';
    case 'ScriptReady':
    case 'AwaitingScript': return 'warn';
    default: return 'brand';
  }
}

export function isTerminal(status: StoryRunStatus): boolean {
  return status === 'Completed' || status === 'Failed' || status === 'Cancelled';
}

/** A character for the timeline: what the step is doing at a glance. */
export function stageMark(status: StoryStageStatus): string {
  switch (status) {
    case 'Completed': return '✓';
    case 'Running': return '●';
    case 'Skipped': return '↷';
    case 'Failed': return '✕';
    default: return '○';
  }
}

/** "3:25" for a length of video; hours only when there are some. */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** The narrator speaks about this many characters a second (the server uses the same figure to plan scene lengths). */
const SPEECH_CHARS_PER_SECOND = 11.5;
const BREATH_SECONDS = 1.0;
const MIN_SCENE_SECONDS = 3.5;

/** About how long a line takes to say, with the breath either side of it. Used until real narration exists. */
export function estimateSeconds(narration: string): number {
  const length = narration.replace(/\s+/g, ' ').trim().length;
  return length === 0 ? 0 : Math.max(MIN_SCENE_SECONDS, length / SPEECH_CHARS_PER_SECOND + BREATH_SECONDS);
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1 min ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} d ago`;
  return new Date(then).toLocaleDateString();
}

export function basisLabel(basis: StoryBasis): { text: string; title: string } {
  switch (basis) {
    case 'Text': return { text: 'From the text', title: 'The Granth says this, and the scene names where.' };
    case 'Tradition': return { text: 'Tradition', title: 'Handed down by tradition. The narration says so ("it is believed…").' };
    default: return { text: 'Reflection', title: 'The storyteller\'s own greeting or thought. Not a claim about a text.' };
  }
}

/** What a scene's citation looks like once it has been checked against the shape of the text it names. */
export function checkBadge(source: StorySource): { text: string; tone: Tone; title: string } {
  const where = `${source.textName || source.textId} ${source.ref}`.trim();
  switch (source.check) {
    case 'Verified':
      return source.grounded
        ? { text: 'Verified · read', tone: 'ok', title: `${where} exists, and its text was among the passages the writer was shown.` }
        : { text: 'Verified', tone: 'ok', title: `${where} exists. It was not among the passages the writer was shown, so check it says what the scene says.` };
    case 'Invalid':
      return { text: 'Not in the text', tone: 'err', title: source.checkMessage || `${where} is outside that text. Fix the reference or remove it.` };
    case 'UnknownText':
      return { text: 'Unknown text', tone: 'warn', title: source.checkMessage || `${source.textName || source.textId} is not a text this app knows, so it could not be checked.` };
    default:
      return { text: 'Not checkable', tone: 'warn', title: source.checkMessage || `${where} cannot be checked against a numbered structure. Look it up yourself.` };
  }
}

/** The picture prompts, numbered, for pasting into an image tool (Google Flow, for one). */
export function picturePrompts(
  title: string,
  scenes: readonly Pick<StoryScene, 'headline' | 'imagePrompt'>[],
  style: string | null,
  vertical: boolean,
): string {
  const lines = [`Picture prompts for "${title}" - ${vertical ? '9:16 vertical' : '16:9 wide'}`];
  if (style?.trim()) lines.push(`Style for every picture: ${style.trim()}`);
  lines.push('');
  scenes.forEach((scene, index) => {
    const prompt = scene.imagePrompt?.trim();
    if (prompt) lines.push(`${index + 1}. ${scene.headline ? `[${scene.headline}] ` : ''}${prompt}`);
  });
  return lines.join('\n');
}

/** Sorts "Flow (2).png" before "Flow (10).png", as a person would. */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/** Puts text on the clipboard; false when the browser would not allow it (no permission, or an insecure page). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** What the picture upload accepts: the three kinds the server reads. */
export const PICTURE_ACCEPT = 'image/png,image/jpeg,image/webp';
export const PICTURE_MAX_BYTES = 10 * 1024 * 1024;

/** Why a file cannot be used as a scene's picture, or null when it can. */
export function pictureProblem(file: File): string | null {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
    return `"${file.name}" is not a PNG, JPEG or WebP picture.`;
  }
  if (file.size > PICTURE_MAX_BYTES) {
    return `"${file.name}" is over ${PICTURE_MAX_BYTES / 1024 / 1024} MB. Export it smaller.`;
  }
  return null;
}

/** The longest reply the server reads (`StoryRunService.MaxScriptReplyChars`). */
export const REPLY_MAX_CHARS = 120_000;

/** Why a pasted reply cannot be sent, or null when it can. */
export function replyProblem(reply: string): string | null {
  if (reply.length <= REPLY_MAX_CHARS) return null;
  return `That is ${reply.length.toLocaleString('en-US')} characters, far more than any script (${REPLY_MAX_CHARS.toLocaleString('en-US')} at most). Paste only the JSON object the chat wrote.`;
}
