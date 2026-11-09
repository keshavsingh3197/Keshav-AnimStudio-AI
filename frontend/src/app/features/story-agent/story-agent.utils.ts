import {
  CitationStatus,
  StoryBasis,
  StoryExportFile,
  StoryPublication,
  StoryReviewStage,
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
  narration: { label: 'Narration', hint: 'The voice, line by line; you listen and approve it' },
  music: { label: 'Music', hint: 'Composed for the story, or a credited track; you listen and approve it' },
  assemble: { label: 'Build the project', hint: 'Scenes, effects, transitions, subtitles and sound in one project' },
  render: { label: 'Render the video', hint: 'The finished MP4; you watch and approve it' },
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
  AwaitingReview: 'Waiting for your review',
};

/** What a review step is waiting for, in the person's words. */
export const REVIEW_LABEL: Record<StoryReviewStage, string> = {
  narration: 'Listen to the voice',
  music: 'Listen to the music',
  render: 'Watch the video',
};

export function statusTone(status: StoryRunStatus): Tone {
  switch (status) {
    case 'Completed': return 'ok';
    case 'Failed': return 'err';
    case 'Cancelled': return 'warn';
    case 'ScriptReady':
    case 'AwaitingReview':
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

/** The file name a scene's picture should be saved as, so a whole set can be added in one go: 01, 02 … 12. */
export function pictureFileName(index: number, count: number): string {
  return String(index + 1).padStart(Math.max(2, String(count).length), '0');
}

/**
 * The file name of a scene's further picture: the scene's own number, then which of its pictures it is, the scene's own
 * being 1 - so 03-2 is the second picture of scene 3.
 */
export function shotFileName(index: number, count: number, picture: number): string {
  return `${pictureFileName(index, count)}-${picture}`;
}

/** The file name the thumbnail picture is saved under, so it is told apart from the scenes' pictures in a set. */
export const THUMBNAIL_FILE = 'thumbnail';

/** How a character's line can be said: shapes the voice (Gemini) and the acting in the animation prompt. The server keeps only these ids. */
export const STORY_EMOTIONS: readonly { id: string; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😄' },
  { id: 'excited', label: 'Excited', emoji: '🤩' },
  { id: 'laughing', label: 'Laughing', emoji: '😂' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'angry', label: 'Angry', emoji: '😠' },
  { id: 'scared', label: 'Scared', emoji: '😱' },
  { id: 'surprised', label: 'Surprised', emoji: '😲' },
  { id: 'confused', label: 'Confused', emoji: '🤔' },
  { id: 'shy', label: 'Shy', emoji: '😳' },
  { id: 'proud', label: 'Proud', emoji: '😎' },
  { id: 'sarcastic', label: 'Sarcastic', emoji: '😏' },
  { id: 'whispering', label: 'Whispering', emoji: '🤫' },
  { id: 'shouting', label: 'Shouting', emoji: '📢' },
  { id: 'worried', label: 'Worried', emoji: '😟' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
];

/** The most pictures a scene has after its own, as the server allows. */
export const MAX_SHOTS = 5;

/** True for a file named as the thumbnail ("thumbnail.png", "Thumb final.jpg"). */
export function isThumbnailFile(fileName: string): boolean {
  return /thumb/i.test(fileName.replace(/\.[^.]*$/, ''));
}

/** The scene and picture a further picture's file name gives - "03-2.png", "scene 3_4.jpg" - or null for any other name. */
export function shotOf(fileName: string): { scene: number; picture: number } | null {
  const match = /(\d+)\s*[-_]\s*(\d+)/.exec(fileName.replace(/\.[^.]*$/, ''));
  if (!match) return null;
  const scene = Number.parseInt(match[1], 10);
  const picture = Number.parseInt(match[2], 10);
  return Number.isSafeInteger(scene) && picture >= 2 && picture <= MAX_SHOTS + 1 ? { scene, picture } : null;
}

/** The longest bit of story put next to each picture prompt; enough to say what happens, short enough to paste. */
const CONTEXT_CHARS = 240;

/** What a picture prompt is sent with, scene by scene. */
export interface PromptScene {
  headline: string;
  imagePrompt: string | null;
  /** The English meaning (or, for an English story, the narration): what happens in the scene. */
  context: string | null;
  /** The prompts of the scene's further pictures, in order. */
  shots?: readonly (string | null)[];
}

/**
 * The picture prompts for pasting into an image tool (Google Flow, for one). Each comes with its file number and what
 * happens in the scene, and the set opens with the story itself, so the tool draws one story rather than twelve
 * unrelated pictures - and so the saved files can be put back on their scenes by number.
 */
export function picturePrompts(
  title: string,
  summary: string | null,
  scenes: readonly PromptScene[],
  style: string | null,
  vertical: boolean,
  thumbnail: string | null = null,
): string {
  const drawn = scenes.reduce((sum, scene) =>
    sum + (scene.imagePrompt?.trim() ? 1 : 0) + (scene.shots ?? []).filter((shot) => shot?.trim()).length, thumbnail?.trim() ? 1 : 0);
  const lines = [`Picture prompts for "${title}" - ${drawn} pictures, ${vertical ? '9:16 vertical (portrait)' : '16:9 wide (landscape)'}`];
  if (summary?.trim()) lines.push(`The story: ${summary.trim()}`);
  if (style?.trim()) lines.push(`Style for every picture: ${style.trim()}`);
  lines.push(
    'Keep each character looking the same in every picture. No words, letters or watermarks in the pictures.',
    'Save each picture with its number as the file name (01.png, 02.png …) so they go onto the right scenes by themselves.',
    'A scene with more than one picture numbers the rest after a dash (01-2.png, 01-3.png …): they are shown one after another while its words are spoken.',
    '',
  );
  scenes.forEach((scene, index) => {
    const file = pictureFileName(index, scenes.length);
    const context = scene.context?.replace(/\s+/g, ' ').trim();
    const happens = context ? `What happens: ${context.length > CONTEXT_CHARS ? `${context.slice(0, CONTEXT_CHARS - 1).trimEnd()}…` : context}` : '';
    const prompt = scene.imagePrompt?.trim();
    if (prompt) {
      lines.push(`${file} - file name: ${file}.png${scene.headline ? ` - ${scene.headline}` : ''}`);
      if (happens) lines.push(happens);
      lines.push(`Picture: ${prompt}`, '');
    }
    (scene.shots ?? []).forEach((shot, at) => {
      if (!shot?.trim()) return;
      const name = shotFileName(index, scenes.length, at + 2);
      lines.push(`${name} - file name: ${name}.png - ${scene.headline ? `${scene.headline}, ` : ''}picture ${at + 2}`);
      if (happens && !prompt) lines.push(happens);
      lines.push(`Picture: ${shot.trim()}`, '');
    });
  });
  if (thumbnail?.trim()) {
    lines.push(
      `${THUMBNAIL_FILE} - file name: ${THUMBNAIL_FILE}.png - the YouTube thumbnail, 16:9 wide (landscape) whatever the video's shape`,
      `Picture: ${thumbnail.trim()}`,
      '',
    );
  }
  return lines.join('\n').trimEnd();
}

/** The scene number a picture's file name gives - "01.png", "scene-7.jpg", "Flow 03 final.png" - or null when it has none. */
export function sceneNumberOf(fileName: string): number | null {
  const stem = fileName.replace(/\.[^.]*$/, '');
  const match = /\d+/.exec(stem);
  if (!match) return null;
  const number = Number.parseInt(match[0], 10);
  return Number.isSafeInteger(number) ? number : null;
}

/**
 * Which scene each picture goes to: by the number in its file name when every file has a different one that fits the
 * story (so 03.png lands on scene 3 whatever order the files were picked in), otherwise in file-name order.
 * Returns scene positions (0-based), one per file, or -1 for a file there is no scene left for.
 */
export function matchPictures(names: readonly string[], sceneCount: number): { byNumber: boolean; slots: number[] } {
  const numbers = names.map(sceneNumberOf);
  const fits = numbers.every((n) => n !== null && n >= 1 && n <= sceneCount) && new Set(numbers).size === numbers.length;
  if (fits) return { byNumber: true, slots: numbers.map((n) => n! - 1) };

  const order = names.map((name, at) => ({ name, at })).sort((a, b) => naturalCompare(a.name, b.name));
  const slots = new Array<number>(names.length).fill(-1);
  order.forEach((item, position) => (slots[item.at] = position < sceneCount ? position : -1));
  return { byNumber: false, slots };
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

/** What the clip upload accepts: MP4, which Google Flow and phones save (`StoryRunService.MaxVideoBytes`). */
export const CLIP_ACCEPT = 'video/mp4,.mp4';
export const CLIP_MAX_BYTES = 100 * 1024 * 1024;
/** How long one generated clip is (Google Flow makes 8 seconds); a longer scene loops it. */
export const CLIP_SECONDS = 8;

/** Why a file cannot be used as a scene's moving clip, or null when it can. */
export function clipProblem(file: File): string | null {
  if (file.type !== 'video/mp4' && !/\.mp4$/i.test(file.name)) return `"${file.name}" is not an MP4 video.`;
  if (file.size > CLIP_MAX_BYTES) return `"${file.name}" is over ${CLIP_MAX_BYTES / 1024 / 1024} MB. Export it smaller.`;
  return null;
}

/** What a video prompt is sent with, scene by scene. */
export interface ClipPromptScene {
  headline: string;
  videoPrompt: string | null;
  /** The picture prompt, which says what is in the shot when the video prompt only says how it moves. */
  imagePrompt: string | null;
  context: string | null;
  seconds: number;
}

/**
 * The clip prompts for pasting into a video tool (Google Flow), numbered like the pictures. Each clip is
 * {@link CLIP_SECONDS} seconds; a scene longer than that loops its clip, so the prompt asks for a shot that loops
 * gently, and says when a scene is long enough to be worth a second clip instead.
 */
export function clipPrompts(
  title: string,
  summary: string | null,
  scenes: readonly ClipPromptScene[],
  style: string | null,
  vertical: boolean,
  acted = false,
): string {
  const shot = scenes.filter((scene) => scene.videoPrompt?.trim() || scene.imagePrompt?.trim());
  const lines = [`Video clip prompts for "${title}" - ${shot.length} clips of ${CLIP_SECONDS} seconds, ${vertical ? '9:16 vertical (portrait)' : '16:9 wide (landscape)'}`];
  if (summary?.trim()) lines.push(`The story: ${summary.trim()}`);
  if (style?.trim()) lines.push(`Look of every clip: ${style.trim()}`);
  lines.push(
    acted
      ? 'Keep each character looking the same in every clip. Show expressive character actions and reactions; no speech, no music, no words, letters or watermarks.'
      : 'Keep each character looking the same in every clip. Slow, calm motion; no speech, no music, no words, letters or watermarks.',
    'Tip: in Google Flow, start each clip from that scene\'s picture (Frames to Video) so the clips match the pictures.',
    'Save each clip with its number as the file name (01.mp4, 02.mp4 …) so they go onto the right scenes by themselves.',
    '',
  );
  scenes.forEach((scene, index) => {
    const motion = scene.videoPrompt?.trim();
    const picture = scene.imagePrompt?.trim();
    if (!motion && !picture) return;
    const file = pictureFileName(index, scenes.length);
    const loops = scene.seconds > CLIP_SECONDS + 1 ? ` - the scene runs ${Math.round(scene.seconds)}s, so the clip loops${acted ? '; check the repeated action' : '; make it calm'}` : '';
    lines.push(`${file} - file name: ${file}.mp4${scene.headline ? ` - ${scene.headline}` : ''}${loops}`);
    const context = scene.context?.replace(/\s+/g, ' ').trim();
    if (context) lines.push(`What happens: ${context.length > CONTEXT_CHARS ? `${context.slice(0, CONTEXT_CHARS - 1).trimEnd()}…` : context}`);
    if (picture) lines.push(`Shot: ${picture}`);
    lines.push(`Motion: ${motion || (acted ? 'characters act and react expressively' : 'a gentle, slow push in; light and cloth move softly')}`, '');
  });
  return lines.join('\n').trimEnd();
}

/** The longest reply the server reads (`StoryRunService.MaxScriptReplyChars`). */
export const REPLY_MAX_CHARS = 120_000;

/** Why a pasted reply cannot be sent, or null when it can. */
export function replyProblem(reply: string): string | null {
  if (reply.length <= REPLY_MAX_CHARS) return null;
  return `That is ${reply.length.toLocaleString('en-US')} characters, far more than any script (${REPLY_MAX_CHARS.toLocaleString('en-US')} at most). Paste only the JSON object the chat wrote.`;
}

// ------------------------------------------------------------------------------------------------ YouTube

export type PublicationState = 'scheduled' | 'public' | 'unlisted' | 'private' | 'processing' | 'issue' | 'removed';

/** Where a story's YouTube video stands, in a word and a colour. A scheduled video counts as public once its time has passed. */
export function publicationState(video: StoryPublication, now: number = Date.now()): { state: PublicationState; label: string; tone: Tone } {
  if (video.health === 'Removed') return { state: 'removed', label: 'Removed from YouTube', tone: 'err' };
  if (video.health === 'Issue') return { state: 'issue', label: 'Needs attention', tone: 'err' };

  const at = video.publishAtUtc ? Date.parse(video.publishAtUtc) : Number.NaN;
  const privacy = (video.privacyStatus ?? video.privacy).toLowerCase();
  if (privacy === 'private' && at > now) return { state: 'scheduled', label: `Scheduled · ${whenLabel(video.publishAtUtc!)}`, tone: 'brand' };
  if (privacy === 'public' || (privacy === 'private' && at <= now)) {
    return video.health === 'Processing' ? { state: 'processing', label: 'Public · processing', tone: 'warn' } : { state: 'public', label: 'Public', tone: 'ok' };
  }
  if (privacy === 'unlisted') return { state: 'unlisted', label: 'Unlisted', tone: 'warn' };
  return { state: 'private', label: 'Private', tone: 'warn' };
}

/** "Tue 4 Nov, 18:00" in the viewer's own time zone. */
export function whenLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Saves a blob as a file in the browser's downloads. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** A title as a file name: no characters Windows refuses, and not so long that it is cut off by the folder. */
export function fileNameOf(title: string, fallback = 'story'): string {
  return title.replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').trim().slice(0, 60) || fallback;
}

/** What the import's file picker offers. */
export const STORY_FILE_ACCEPT = 'application/json,.json';

/** Far more than any story's file, and under what the server takes for an import. */
export const STORY_FILE_MAX_BYTES = 700 * 1024;

export function saveStoryFile(file: StoryExportFile, title: string): void {
  saveBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `${fileNameOf(title)}.story.json`);
}

/**
 * Reads a story file the person picked, or throws an Error whose message says why it is not one. Only its shape is
 * checked here: the server reads the script with the same parser and checks as a pasted reply.
 */
export async function readStoryFile(file: File): Promise<StoryExportFile> {
  if (file.size > STORY_FILE_MAX_BYTES) throw new Error(`"${file.name}" is too big to be a story file.`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error(`"${file.name}" isn't a story file: it isn't JSON.`);
  }
  const story = parsed as Partial<StoryExportFile> | null;
  if (!story || typeof story !== 'object' || story.kind !== 'animstudio-story' || typeof story.version !== 'number'
      || !story.story || typeof story.story !== 'object') {
    throw new Error(`"${file.name}" isn't a story file exported from AnimStudio.`);
  }
  if (!story.script || typeof story.script !== 'object' || !Array.isArray(story.script.scenes) || story.script.scenes.length === 0) {
    throw new Error(`"${file.name}" has no script in it. Export the story again once it has one.`);
  }
  return story as StoryExportFile;
}
