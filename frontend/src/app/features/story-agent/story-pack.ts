import { StoryExportFile } from '../../core/models/story-agent.models';
import { normalizeEmotion, STORY_EMOTIONS, STORY_FILE_MAX_BYTES } from './story-agent.utils';

/**
 * A story pack: many episodes in one file, sharing one cast and one meme list. It is what the Story Template Studio
 * hands to an outside AI tool and reads back. Each episode is an ordinary `animstudio-story` file, so importing one is
 * the same as importing an exported story; the server checks every script again.
 */
export const STORY_PACK_KIND = 'animstudio-story-pack';
export const STORY_PACK_MAX_EPISODES = 12;

/** The camera moves the renderer makes for free, as the server reads them. */
export const STORY_CAMERA_MOVES = ['static', 'zoomIn', 'zoomOut', 'panLeft', 'panRight', 'panUp', 'panDown'] as const;
export const STORY_CAMERA_SPEEDS = ['slow', 'normal', 'fast'] as const;

/** The cuts into the next scene, as the server reads them. */
export const STORY_TRANSITIONS = [
  'cut', 'fade', 'dissolve', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoomIn', 'wipeLeft', 'wipeRight',
  'circleOpen', 'circleClose', 'circleCrop', 'fadeBlack', 'fadeWhite', 'blur', 'diagonalWipe',
] as const;

/** The built-in genres that tell the storyteller's own story (no scripture citations). */
export const STORY_PACK_GENRES: readonly { id: string; label: string }[] = [
  { id: 'funny', label: 'Comedy' },
  { id: 'kids-moral', label: 'Kids moral story' },
  { id: 'folk-tales', label: 'Folk tale' },
  { id: 'bedtime', label: 'Bedtime story' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'explainer', label: 'Explainer' },
];

export type PackGender = 'male' | 'female';
export type PackAge = 'child' | 'young' | 'adult' | 'elder';

export interface PackCharacter {
  name: string;
  gender?: PackGender | null;
  age?: PackAge | null;
  /** What they look like, in English, for every picture of them. */
  look?: string | null;
  /** Set when picked from a project's character page. */
  fromLibrary?: boolean;
}

export interface PackMeme {
  id: string;
  name: string;
  /** The library's labels; a template's meme name matches one as well as the name. */
  tags?: string[];
}

export type FunnyEndingRule = 'every-scene' | 'episode-end' | 'ai-decides' | 'none';

export interface PackSettings {
  title: string;
  idea: string;
  genreId: string;
  language: 'hi' | 'en';
  style: '2D' | '3D';
  format: 'Vertical' | 'Wide';
  voicing: 'CharactersOnly' | 'Narrated';
  episodes: number;
  scenesPerEpisode: number;
  secondsPerEpisode: number;
  funnyEndings: FunnyEndingRule;
  /** UploadsOnly spends no image credits: the build uses uploaded pictures or a plain placeholder. */
  visuals: 'UploadsOnly' | 'Auto';
}

export interface StoryPack {
  kind: typeof STORY_PACK_KIND;
  version: 1;
  title: string;
  characters: PackCharacter[];
  memes: PackMeme[];
  episodes: StoryExportFile[];
}

// ------------------------------------------------------------------------------------------------ the template

function episodeTemplate(settings: PackSettings, characters: PackCharacter[], memes: PackMeme[], number: number): StoryExportFile {
  const [first, second] = characters.length > 0 ? characters : [{ name: 'CHARACTER_1' }, { name: 'CHARACTER_2' }];
  const other = second ?? first;
  const meme = memes[0]?.name ?? 'SHORT_REACTION_NAME';
  const ending = (last: boolean) => settings.funnyEndings === 'none' || (settings.funnyEndings === 'episode-end' && !last)
    ? null
    : { meme, caption: 'SHORT FUNNY CAPTION OR null', seconds: 2 };
  const scene = (n: number, last: boolean) => ({
    number: n,
    headline: `SCENE ${n} HEADLINE (2-5 words)`,
    narration: 'ALL SPOKEN WORDS OF THIS SCENE, EXACTLY THE LINES BELOW JOINED IN ORDER',
    lines: [
      { speaker: first.name, text: 'FIRST LINE', emotion: 'confused' },
      { speaker: other.name, text: 'SECOND LINE', emotion: 'laughing' },
    ],
    english: settings.language === 'hi' ? 'ENGLISH MEANING OF THE NARRATION' : null,
    background: 'WHERE IT HAPPENS, IN ENGLISH (place, time of day, props)',
    characters: [first.name, other.name],
    action: 'WHAT THE CHARACTERS DO, IN ENGLISH (the acting)',
    camera: n === 1 ? 'zoomIn' : 'panRight',
    cameraSpeed: 'normal',
    transition: last ? 'fade' : 'slideLeft',
    imagePrompt: null,
    videoPrompt: 'ABOUT 8 SECONDS OF MOVEMENT FOR A VIDEO TOOL, IN ENGLISH',
    mood: 'playful',
    imageKeywords: ['KEYWORD'],
    basis: 'reflection',
    sources: [],
    funnyEnding: ending(last),
  });

  return {
    kind: 'animstudio-story',
    version: 1,
    exportedAtUtc: new Date().toISOString(),
    story: {
      title: `EPISODE ${number} TITLE`,
      notes: `Episode ${number} of ${settings.episodes}.`,
      language: settings.language,
      targetSeconds: settings.secondsPerEpisode,
      format: settings.format,
      writer: 'Manual',
      voicing: settings.voicing,
      genreId: settings.genreId,
      options: {
        artStyle: settings.style === '2D' ? 'Cartoon' : 'Cartoon3D',
        narration: 'Stock',
        matchClipDuration: true,
        keepClipAudio: false,
        castVoices: true,
        visuals: settings.visuals,
        music: false,
        renderWhenReady: false,
        autoApprove: false,
      },
    },
    script: {
      title: `EPISODE ${number} TITLE`,
      titleEnglish: settings.language === 'hi' ? `EPISODE ${number} TITLE IN ENGLISH` : null,
      summary: 'ONE-SENTENCE SUMMARY OF THIS EPISODE',
      musicQuery: 'playful comedy',
      reviewNotes: [],
      cast: characters.map(c => ({ name: c.name, gender: c.gender ?? null, age: c.age ?? null, look: c.look ?? null })),
      scenes: [scene(1, false), scene(2, true)],
    },
  };
}

/** The pack skeleton the outside tool fills in: the cast and memes chosen here, and one episode per requested episode. */
export function buildPackTemplate(settings: PackSettings, characters: PackCharacter[], memes: PackMeme[]): StoryPack {
  const count = Math.min(Math.max(1, settings.episodes), STORY_PACK_MAX_EPISODES);
  return {
    kind: STORY_PACK_KIND,
    version: 1,
    title: settings.title.trim() || 'SERIES TITLE',
    characters: characters.map(c => ({ name: c.name, gender: c.gender ?? null, age: c.age ?? null, look: c.look ?? null })),
    memes: memes.map(m => ({ id: m.id, name: m.name })),
    episodes: Array.from({ length: count }, (_, i) => episodeTemplate(settings, characters, memes, i + 1)),
  };
}

function endingRule(rule: FunnyEndingRule): string {
  switch (rule) {
    case 'every-scene': return 'Give EVERY scene a "funnyEnding" (the punchline right after it).';
    case 'episode-end': return 'Give only the LAST scene of each episode a "funnyEnding"; set it to null elsewhere.';
    case 'ai-decides': return 'Add a "funnyEnding" after scenes where a joke lands (at least one per episode); null elsewhere.';
    default: return 'Set every "funnyEnding" to null.';
  }
}

/** The whole prompt to paste into ChatGPT or any other tool: the rules, the allowed values and the skeleton to fill. */
export function buildPackPrompt(settings: PackSettings, characters: PackCharacter[], memes: PackMeme[]): string {
  const template = buildPackTemplate(settings, characters, memes);
  const language = settings.language === 'hi' ? 'Hindi (Devanagari script, numbers written as words)' : 'English';
  const cast = characters.length
    ? characters.map(c => `- ${c.name}${c.gender ? `, ${c.gender}` : ''}${c.age ? `, ${c.age}` : ''}${c.look ? `: ${c.look}` : ''}`).join('\n')
    : '- None chosen: invent the characters you need (at most 8), each with a "look".';
  const memeList = memes.length
    ? memes.map(m => `- "${m.name}"`).join('\n')
    : '- None chosen: name the reaction in a few words (e.g. "shocked_face") and give a "caption"; the app holds the scene\'s last picture as a freeze-frame under it.';

  return [
    `You are a ${settings.style} cartoon story writer for short animated videos. Fill in the JSON template below.`,
    '',
    `STORY / IDEA:\n${settings.idea.trim() || '(write an original story that fits the title and the characters)'}`,
    `SERIES TITLE: ${settings.title.trim() || '(choose one)'}`,
    '',
    'RULES',
    `1. Write exactly ${template.episodes.length} episode(s), each with about ${settings.scenesPerEpisode} scenes (at least 2) and about ${settings.secondsPerEpisode} seconds of speech.`,
    '   Each episode is its own story with a beginning, a twist and a payoff; episodes may continue one plot.',
    `2. Spoken words ("narration", "lines[].text", "headline", titles) are in ${language}. "background", "action", "videoPrompt", "imagePrompt", "look" and "english" are in English.`,
    '3. "narration" must contain exactly the words of that scene\'s "lines", joined in order. Every speaker must be in that episode\'s "cast".',
    settings.voicing === 'CharactersOnly'
      ? '4. Characters speak every word; do not use a narrator.'
      : '4. A narrator may tell parts of the story (speaker "narrator"); characters speak their own lines.',
    `5. "emotion" is one of: ${STORY_EMOTIONS.map(e => e.id).join(', ')}.`,
    `6. "camera" is one of: ${STORY_CAMERA_MOVES.join(', ')}. "cameraSpeed" is one of: ${STORY_CAMERA_SPEEDS.join(', ')}.`,
    `7. "transition" (the cut into the next scene) is one of: ${STORY_TRANSITIONS.join(', ')}.`,
    '8. "characters" lists everyone visible in the scene, speaking or not. Use the exact names below.',
    `9. ${endingRule(settings.funnyEndings)} ${memes.length ? '"funnyEnding.meme" must be one of the meme names below, exactly' : '"funnyEnding.caption" is the punchline shown on screen'}; "seconds" is 1 to 4.`,
    '10. Leave "imagePrompt" null unless you want to override the picture; the app builds it from background, characters and action.',
    '11. Keep every key. Do not change "kind", "version", "story.options", "writer" or "genreId". Reply with the ONE JSON object only, no commentary.',
    '',
    'CHARACTERS (reuse these names and looks; add new ones only if the story needs them, each with a "look"):',
    cast,
    '',
    'MEMES YOU MAY USE FOR "funnyEnding":',
    memeList,
    '',
    'TEMPLATE (the two scenes per episode are placeholders: replace them and add more scenes):',
    JSON.stringify(template, null, 2),
  ].join('\n');
}

// ------------------------------------------------------------------------------------------------ reading it back

/** Reads a pasted reply: a pack, or a single story file (one episode). Throws an Error whose message says what is wrong. */
export function parseStoryPack(text: string): StoryPack {
  let json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!json) throw new Error('Paste the filled template first.');
  if (json.length > STORY_FILE_MAX_BYTES * STORY_PACK_MAX_EPISODES) throw new Error('That is too long to be a story pack.');
  if (!json.startsWith('{')) {
    const first = json.indexOf('{');
    const last = json.lastIndexOf('}');
    if (first < 0 || last <= first) throw new Error('No JSON object was found in the text.');
    json = json.slice(first, last + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (failure: unknown) {
    const detail = failure instanceof Error ? ` (${failure.message})` : '';
    throw new Error(`That is not valid JSON${detail}. Ask the tool to reply with the JSON object only.`);
  }
  if (!isObject(parsed)) throw new Error('The reply must be one JSON object.');

  if (parsed['kind'] === 'animstudio-story') {
    const episode = asEpisode(parsed, 1);
    return { kind: STORY_PACK_KIND, version: 1, title: String(episode.story.title ?? 'Story'), characters: [], memes: [], episodes: [episode] };
  }
  if (parsed['kind'] !== STORY_PACK_KIND) throw new Error(`The reply's "kind" must be "${STORY_PACK_KIND}" (or "animstudio-story" for one episode).`);
  if (!Array.isArray(parsed['episodes']) || parsed['episodes'].length === 0) throw new Error('The pack has no "episodes".');
  if (parsed['episodes'].length > STORY_PACK_MAX_EPISODES) throw new Error(`A pack holds at most ${STORY_PACK_MAX_EPISODES} episodes.`);

  return {
    kind: STORY_PACK_KIND,
    version: 1,
    title: typeof parsed['title'] === 'string' ? parsed['title'] : 'Story pack',
    characters: (Array.isArray(parsed['characters']) ? parsed['characters'] : []).filter(isObject).map(readCharacter).filter(c => c.name),
    memes: (Array.isArray(parsed['memes']) ? parsed['memes'] : []).filter(isObject)
      .map(m => ({ id: String(m['id'] ?? ''), name: String(m['name'] ?? '') })).filter(m => m.name),
    episodes: parsed['episodes'].map((e, i) => asEpisode(e, i + 1)),
  };
}

function asEpisode(value: unknown, number: number): StoryExportFile {
  if (!isObject(value) || !isObject(value['story'])) throw new Error(`Episode ${number} has no "story" object.`);
  const script = value['script'];
  if (!isObject(script) || !Array.isArray(script['scenes']) || script['scenes'].length === 0)
    throw new Error(`Episode ${number} has no "script.scenes".`);
  return {
    kind: 'animstudio-story',
    version: typeof value['version'] === 'number' ? value['version'] : 1,
    exportedAtUtc: typeof value['exportedAtUtc'] === 'string' ? value['exportedAtUtc'] : new Date().toISOString(),
    story: value['story'] as StoryExportFile['story'],
    script: script as StoryExportFile['script'],
  };
}

function readCharacter(value: Record<string, unknown>): PackCharacter {
  return {
    name: typeof value['name'] === 'string' ? value['name'].trim() : '',
    gender: value['gender'] === 'male' || value['gender'] === 'female' ? value['gender'] : null,
    age: ['child', 'young', 'adult', 'elder'].includes(String(value['age'])) ? value['age'] as PackAge : null,
    look: typeof value['look'] === 'string' ? value['look'] : null,
  };
}

// ------------------------------------------------------------------------------------------------ the review

export interface ReviewLine { speaker: string; text: string; emotion: string | null; known: boolean; emoji: string }
export interface ReviewMeme { name: string; caption: string | null; seconds: number | null; found: boolean }
export interface ReviewScene {
  number: number;
  headline: string;
  background: string | null;
  onScreen: string[];
  action: string | null;
  camera: string | null;
  cameraSpeed: string | null;
  transition: string | null;
  lines: ReviewLine[];
  narration: string;
  meme: ReviewMeme | null;
  seconds: number;
}
export interface ReviewCast { name: string; look: string | null; gender: string | null; age: string | null; fromLibrary: boolean }
export interface ReviewEpisode {
  number: number;
  title: string;
  summary: string | null;
  cast: ReviewCast[];
  scenes: ReviewScene[];
  seconds: number;
  memeCount: number;
  warnings: string[];
}
export interface PackReview { title: string; episodes: ReviewEpisode[]; warningCount: number }

/** What a library offers to check a pack against: character and meme names, compared without regard to case. */
export interface PackLibrary { characters: string[]; memes: PackMeme[] }

/** A readable view of every episode, scene, line and funny ending, with what is worth fixing before importing. */
export function reviewStoryPack(pack: StoryPack, library: PackLibrary): PackReview {
  const libraryCharacters = new Set(library.characters.map(key));
  // Only the owner's real library counts: the pack's own list came back from the outside tool.
  const memeNames = new Set(library.memes.flatMap(m => [m.name, ...(m.tags ?? [])]).map(key));
  const episodes = pack.episodes.map((episode, index) => reviewEpisode(episode, index + 1, pack, libraryCharacters, memeNames));
  return { title: pack.title, episodes, warningCount: episodes.reduce((sum, e) => sum + e.warnings.length, 0) };
}

function reviewEpisode(
  episode: StoryExportFile, number: number, pack: StoryPack, libraryCharacters: Set<string>, memeNames: Set<string>,
): ReviewEpisode {
  const script = episode.script ?? { title: '', scenes: [] };
  const warnings: string[] = [];
  const cast = mergedCast(script['cast'], pack.characters).map(c => ({
    name: c.name, look: c.look ?? null, gender: c.gender ?? null, age: c.age ?? null, fromLibrary: libraryCharacters.has(key(c.name)),
  }));
  const castNames = new Set(cast.map(c => key(c.name)));
  const cameras = new Set<string>(STORY_CAMERA_MOVES.map(key));
  const transitions = new Set<string>(STORY_TRANSITIONS.map(key));

  if (script.scenes.length < 2) warnings.push('An episode needs at least 2 scenes.');
  if (cast.length > 8) warnings.push(`${cast.length} characters: only 8 get their own voice; the rest are read by the narrator.`);
  if (typeof episode.story.genreId !== 'string' || !STORY_PACK_GENRES.some(g => g.id === episode.story.genreId))
    warnings.push('"story.genreId" is not one of the creative genres, so the story may be checked for scripture citations.');

  const scenes = script.scenes.map((raw, i): ReviewScene => {
    const scene = isObject(raw) ? raw : {};
    const n = i + 1;
    const lines = (Array.isArray(scene['lines']) ? scene['lines'] : []).filter(isObject).map((l): ReviewLine => {
      const written = typeof l['emotion'] === 'string' ? l['emotion'].trim().toLowerCase() || null : null;
      // A writer's own word for one of the app's emotions ("furious") is read as that emotion, as the server does.
      const emotion = normalizeEmotion(written);
      return {
        speaker: text(l['speaker']) ?? 'narrator',
        text: text(l['text']) ?? '',
        emotion: emotion ?? written,
        known: !written || !!emotion,
        emoji: STORY_EMOTIONS.find(e => e.id === emotion)?.emoji ?? '',
      };
    });
    const narration = text(scene['narration']) ?? '';
    const onScreen = (Array.isArray(scene['characters']) ? scene['characters'] : []).map(text).filter((v): v is string => !!v);
    const camera = text(scene['camera']);
    const transition = text(scene['transition']);
    const meme = readMeme(scene['funnyEnding'] ?? scene['meme'], memeNames);

    if (!narration) warnings.push(`Scene ${n} has no "narration", so it will be left out.`);
    else if (lines.length && spoken(lines.map(l => l.text).join(' ')) !== spoken(narration))
      warnings.push(`Scene ${n}: the lines do not match "narration", so the narrator would read it all. Use "Auto-fix".`);
    for (const line of lines) {
      if (line.speaker.toLowerCase() !== 'narrator' && !castNames.has(key(line.speaker)))
        warnings.push(`Scene ${n}: "${line.speaker}" speaks but is not in the cast.`);
      if (!line.known) warnings.push(`Scene ${n}: emotion "${line.emotion}" is not one the app knows, so the line is said plainly.`);
    }
    for (const name of onScreen) {
      if (!castNames.has(key(name))) warnings.push(`Scene ${n}: "${name}" is on screen but has no cast entry or look.`);
    }
    if (camera && !cameras.has(key(camera))) warnings.push(`Scene ${n}: camera "${camera}" is not a known move, so it is chosen automatically.`);
    if (transition && !transitions.has(key(transition)) && key(transition) !== 'none')
      warnings.push(`Scene ${n}: transition "${transition}" is not a known cut.`);
    if (meme && !meme.found)
      warnings.push(`Scene ${n}: meme "${meme.name}" is not in your meme library, so the scene's last picture is held as a freeze-frame`
        + ` under "${meme.caption ?? memeCaption(meme.name) ?? 'its caption'}". Upload a clip named "${meme.name}" to use a real one.`);
    if (!text(scene['background']) && !text(scene['imagePrompt'])) warnings.push(`Scene ${n} has no "background" or "imagePrompt".`);

    return {
      number: n,
      headline: text(scene['headline']) ?? `Scene ${n}`,
      background: text(scene['background']),
      onScreen,
      action: text(scene['action']),
      camera,
      cameraSpeed: text(scene['cameraSpeed']),
      transition,
      lines,
      narration,
      meme,
      seconds: estimateSeconds(narration) + (meme ? meme.seconds ?? 2 : 0),
    };
  });

  return {
    number,
    title: text(script.title) ?? text(episode.story.title) ?? `Episode ${number}`,
    summary: text(script['summary']),
    cast,
    scenes,
    seconds: Math.round(scenes.reduce((sum, s) => sum + s.seconds, 0)),
    memeCount: scenes.filter(s => s.meme).length,
    warnings,
  };
}

function readMeme(value: unknown, memeNames: Set<string>): ReviewMeme | null {
  if (typeof value === 'string' && value.trim()) return { name: value.trim(), caption: null, seconds: null, found: memeNames.has(key(value)) };
  if (!isObject(value)) return null;
  const name = text(value['meme']) ?? text(value['name']);
  if (!name) return null;
  return {
    name,
    caption: text(value['caption']),
    seconds: typeof value['seconds'] === 'number' ? Math.min(Math.max(value['seconds'], 0.5), 4) : null,
    found: memeNames.has(key(name)),
  };
}

// ------------------------------------------------------------------------------------------------ fixing and importing

/**
 * Free fixes for what outside tools most often get wrong: narration that does not match the lines, speakers missing
 * from the cast, and shared characters' looks. Returns a new pack and how many things were changed.
 */
export function autoFixStoryPack(pack: StoryPack): { pack: StoryPack; fixes: number } {
  let fixes = 0;
  const episodes = pack.episodes.map(episode => {
    const copy = structuredClone(episode);
    const script = copy.script;
    if (!script) return copy;
    for (const raw of script.scenes) {
      if (!isObject(raw) || !Array.isArray(raw['lines'])) continue;
      const lines = raw['lines'].filter(isObject);
      const joined = lines.map(l => text(l['text']) ?? '').filter(Boolean).join(' ');
      if (joined && spoken(joined) !== spoken(text(raw['narration']) ?? '')) {
        raw['narration'] = joined;
        fixes++;
      }
    }
    const before = Array.isArray(script['cast']) ? script['cast'].length : 0;
    script['cast'] = mergedCast(script['cast'], pack.characters, speakersOf(script.scenes));
    fixes += Math.max(0, (script['cast'] as unknown[]).length - before);
    return copy;
  });
  return { pack: { ...pack, episodes }, fixes };
}

/**
 * Each episode as the story file the import endpoint takes: the shared cast's looks folded into its cast, and each
 * funny ending given its library id when the name is one of the owner's memes.
 */
export function episodeFiles(pack: StoryPack, library: PackLibrary): StoryExportFile[] {
  const memes = new Map(library.memes.filter(m => m.id).map(m => [key(m.name), m.id] as const));
  return pack.episodes.map(episode => {
    const copy = structuredClone(episode);
    copy.kind = 'animstudio-story';
    copy.version = 1;
    const script = copy.script;
    if (!script) return copy;
    script['cast'] = mergedCast(script['cast'], pack.characters, speakersOf(script.scenes));
    for (const raw of script.scenes) {
      if (!isObject(raw)) continue;
      const ending = raw['funnyEnding'];
      if (typeof ending === 'string' && memes.has(key(ending))) raw['funnyEnding'] = { meme: ending, memeId: memes.get(key(ending)) };
      else if (isObject(ending)) {
        const name = text(ending['meme']) ?? text(ending['name']);
        if (name && memes.has(key(name))) ending['memeId'] = memes.get(key(name));
      }
    }
    return copy;
  });
}

/** Character-sheet prompts for an outside image tool, one paragraph per character. */
export function characterPrompts(pack: StoryPack, style: '2D' | '3D'): string {
  const all = new Map<string, PackCharacter>();
  for (const c of pack.characters) all.set(key(c.name), c);
  for (const episode of pack.episodes) for (const c of mergedCast(episode.script?.['cast'], [])) if (!all.has(key(c.name))) all.set(key(c.name), c);
  const look = style === '2D' ? 'flat 2D cartoon' : '3D animated cartoon';
  return [...all.values()].map(c =>
    `${c.name}: ${look} character sheet of ${c.look || c.name}${c.age ? `, ${c.age}` : ''}${c.gender ? ` ${c.gender}` : ''}; ` +
    'front, side and back views, full body, neutral pose, plain white background, consistent design, no text.').join('\n\n');
}

/** Background prompts for an outside image tool, one per scene, with no characters so a character can be placed on it. */
export function backgroundPrompts(pack: StoryPack, style: '2D' | '3D', format: 'Vertical' | 'Wide'): string {
  const look = style === '2D' ? 'flat 2D cartoon background' : '3D animated cartoon background';
  const frame = format === 'Vertical' ? 'vertical 9:16' : 'wide 16:9';
  const out: string[] = [];
  pack.episodes.forEach((episode, e) => (episode.script?.scenes ?? []).forEach((raw, s) => {
    const background = isObject(raw) ? text(raw['background']) ?? text(raw['imagePrompt']) : null;
    if (background) out.push(`E${e + 1} S${s + 1}: ${look}, ${background}, ${frame}, empty scene with no people, no text.`);
  }));
  return out.join('\n\n');
}

// ------------------------------------------------------------------------------------------------ helpers

function mergedCast(value: unknown, shared: PackCharacter[], needed: string[] = []): PackCharacter[] {
  const cast = (Array.isArray(value) ? value : []).filter(isObject).map(readCharacter).filter(c => c.name);
  const byKey = new Map(shared.map(c => [key(c.name), c] as const));
  for (const member of cast) {
    const from = byKey.get(key(member.name));
    if (!from) continue;
    member.look ??= from.look ?? null;
    member.gender ??= from.gender ?? null;
    member.age ??= from.age ?? null;
  }
  for (const name of needed) {
    if (cast.some(c => key(c.name) === key(name))) continue;
    const from = byKey.get(key(name));
    if (from) cast.push({ name: from.name, gender: from.gender ?? null, age: from.age ?? null, look: from.look ?? null });
  }
  return cast;
}

function speakersOf(scenes: unknown[]): string[] {
  const names = new Set<string>();
  for (const raw of scenes) {
    if (!isObject(raw)) continue;
    for (const l of Array.isArray(raw['lines']) ? raw['lines'] : []) {
      const name = isObject(l) ? text(l['speaker']) : null;
      if (name && name.toLowerCase() !== 'narrator') names.add(name);
    }
    for (const n of Array.isArray(raw['characters']) ? raw['characters'] : []) {
      const name = text(n);
      if (name) names.add(name);
    }
  }
  return [...names];
}

/** Only what is pronounced, as the server compares lines with narration: letters, digits and vowel marks. */
function spoken(value: string): string {
  return (value.match(/[\p{L}\p{N}\p{M}]/gu) ?? []).join('').toLowerCase();
}

/** A rough guess at speaking time: about 2.5 words a second, with a breath. */
function estimateSeconds(narration: string): number {
  const words = narration.split(/\s+/).filter(Boolean).length;
  return words === 0 ? 0 : Math.max(2, words / 2.5 + 0.8);
}

/** A meme's name as its freeze-frame caption, as the server reads it: "emotional_damage" says "Emotional damage!". */
export function memeCaption(name: string): string | null {
  const words = name.split(/[\s_-]+/).filter(Boolean).join(' ');
  if (!/[\p{L}\p{N}]/u.test(words)) return null;
  const caption = words[0].toUpperCase() + words.slice(1);
  return /\p{P}$/u.test(caption) ? caption : `${caption}!`;
}

function key(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
