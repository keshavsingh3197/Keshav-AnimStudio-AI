import { BACKGROUND_EFFECTS, TRANSITIONS } from './api.models';

/**
 * The Story Agent's wire contract. Enums are their names (the API serialises them as strings), and every property is
 * camelCase, exactly as the API sends it. No storage key or owner ever appears: a picture is fetched by scene number.
 */

export type StoryRunStatus =
  | 'Researching'
  | 'WritingScript'
  | 'AwaitingScript'
  | 'ScriptReady'
  | 'Building'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  /** The build stopped for the person to check the voice, the music or the video; `review` says which. */
  | 'AwaitingReview';

/** The steps the person hears or watches before the build goes on, by the id of the stage that made them. */
export type StoryReviewStage = 'narration' | 'music' | 'render';

/** How a review step is named in its URL. */
export const REVIEW_STEP: Record<StoryReviewStage, 'voice' | 'music' | 'video'> = { narration: 'voice', music: 'music', render: 'video' };

/** The feel of the motion and the cuts picked for each scene. */
export type StoryLookStyle = 'Auto' | 'Gentle' | 'Cinematic' | 'Lively' | 'MusicVideo';

export const STORY_LOOK_STYLES: readonly { id: StoryLookStyle; label: string; hint: string }[] = [
  { id: 'Auto', label: 'Automatic', hint: 'Picked from each scene\'s mood: slow pushes for calm, quicker moves for drama, a reveal for wonder.' },
  { id: 'Gentle', label: 'Gentle', hint: 'Slow, small moves and soft crossfades. Suits devotional and reflective stories.' },
  { id: 'Cinematic', label: 'Cinematic', hint: 'Deliberate pushes and pulls, longer crossfades, an iris reveal at the turning points.' },
  { id: 'Lively', label: 'Lively', hint: 'Quicker moves and slides, for a Short that has to hold attention.' },
  { id: 'MusicVideo', label: 'Music video', hint: 'Automatically varies zooms, blurred cuts, diagonal wipes and circular reveals. No beat detection or automatic flashes; pinned scenes keep your choices.' },
];

/** The look of the pictures and the animation. Auto keeps the genre's picture style. */
export type StoryArtStyle = 'Auto' | 'Painting' | 'Realistic' | 'Cartoon' | 'Cartoon3D';
/** The pace the voice is brought to. Auto: gentle for children, brisk for a Short, a storyteller's pace otherwise. */
export type StoryPaceStyle = 'Auto' | 'Gentle' | 'Storyteller' | 'Brisk' | 'Fast';

/** The picture's motion; the renderer's own names. */
export const STORY_EFFECTS = BACKGROUND_EFFECTS;
export type StoryEffect = (typeof STORY_EFFECTS)[number];

/** The cut into the next scene; the renderer's own names. */
export const STORY_TRANSITIONS = TRANSITIONS;
export type StoryTransition = (typeof STORY_TRANSITIONS)[number];

export type StoryStageStatus = 'Pending' | 'Running' | 'Completed' | 'Skipped' | 'Failed';
export type StoryWriterMode = 'Auto' | 'Manual' | 'BuiltIn';
/** A narrator with the characters speaking now and then, or the characters alone with no narrator. */
export type StoryVoicing = 'Narrated' | 'CharactersOnly';
export type StoryFormat = 'Wide' | 'Vertical';
export type StoryNarrationMode = 'None' | 'Stock' | 'MyVoice';
export type StoryVisualMode = 'Auto' | 'UploadsOnly';
export type StoryBasis = 'Text' | 'Tradition' | 'Reflection';
export type StorySourceConfidence = 'High' | 'Medium' | 'Low';
export type CitationStatus = 'Verified' | 'Unchecked' | 'Invalid' | 'UnknownText';
export type StoryRenderStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled' | 'CompletedWithWarnings';

/** The ids of the eight steps, in the order they happen. */
export type StoryStageId = 'research' | 'script' | 'visuals' | 'narration' | 'music' | 'assemble' | 'render' | 'kit';

// ------------------------------------------------------------------------------------------------ what the page offers

export interface StoryPack {
  id: string;
  title: string;
  titleEnglish: string;
  description: string;
  language: string;
  targetSeconds: number;
  /** The genre the pack is written for; it is only offered there. */
  genreId: string;
}

/** `Scripture`: researched in the Granths with every source checked. `Creative`: written from the title and the genre's style. */
export type StoryGenreMode = 'Scripture' | 'Creative';

/** A kind of story, and what picking it fills in on the form. Managed under Settings → Story genres. */
export interface StoryGenreOption {
  id: string;
  name: string;
  nameHindi: string | null;
  description: string;
  icon: string;
  mode: StoryGenreMode;
  madeForKids: boolean;
  defaultLanguage: 'hi' | 'en';
  defaultTargetSeconds: number;
  defaultFormat: StoryFormat;
  lookStyle: StoryLookStyle;
  imageStyle: string | null;
  musicQuery: string | null;
  speechStyle: string | null;
  topics: StoryTopic[];
}

export interface StoryTopic {
  id: string;
  name: string;
  hindi: string;
  summary: string;
}

export interface StoryMyVoice {
  id: string;
  name: string;
  baseVoiceId: string;
  durationSeconds: number | null;
  createdAtUtc: string;
  tuned: boolean;
  /** The hosted engine (Gemini TTS) Google copied this voice to with its owner's consent; null when it is on this machine only. */
  googleEngine?: string | null;
  googleConsentAtUtc?: string | null;
}

/** What this server can do, so the page offers only choices that will work. */
export interface StoryAgentOptions {
  enabled: boolean;
  textModel: boolean;
  speechEngine: boolean;
  imageEngine: boolean;
  music: boolean;
  renderer: boolean;
  audioFinishing: boolean;
  maxActiveRuns: number;
  /** Google's Lyria can compose a track for the story (Gemini speech is set up). */
  musicComposer?: boolean;
  packs: StoryPack[];
  topics: StoryTopic[];
  myVoices: StoryMyVoice[];
  /** The genres offered for a new story, in order; the first is the default. */
  genres?: StoryGenreOption[];
  /** The text engines that are on and ready, to pick one to write the script instead of the configured chain. */
  textEngines?: StoryTextEngine[];
}

export interface StoryTextEngine {
  id: string;
  name: string;
  runsLocally: boolean;
}

// ------------------------------------------------------------------------------------------------ a run

export interface StoryStage {
  id: StoryStageId;
  status: StoryStageStatus;
  progress: number;
  message: string | null;
  code: string | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
}

export interface StorySource {
  textId: string;
  textName: string;
  ref: string;
  note: string | null;
  confidence: StorySourceConfidence;
  url: string | null;
  check: CitationStatus;
  grounded: boolean;
  checkMessage: string | null;
}

export interface StoryScene {
  number: number;
  headline: string;
  narration: string;
  english: string | null;
  basis: StoryBasis;
  sources: StorySource[];
  imagePrompt: string | null;
  imageKeywords: string[];
  mood: string | null;
  estimatedSeconds: number;
  hasImage: boolean;
  imageSource: string | null;
  imageName: string | null;
  hasAudio: boolean;
  audioSeconds: number | null;
  /** Who says which words of the narration; empty when the narrator reads it all. */
  lines?: StoryLine[];
  /** The same moment as an 8-second moving shot, for Google Flow. */
  videoPrompt?: string | null;
  /** A moving clip is attached and plays instead of the picture. */
  hasVideo?: boolean;
  videoName?: string | null;
  /** Everything a video tool should make of this scene's picture, ready to paste into Google Flow. */
  animationPrompt?: string | null;
  /** A character (not the narrator) speaks in this scene, so their lips move when it is animated. */
  speaks?: boolean;
  /** How many times the narration was taken again. */
  audioTake?: number;
  /** The motion and the cut into the next scene the last build used; null before a build. */
  effect?: StoryEffect | null;
  transition?: StoryTransition | null;
  transitionSeconds?: number | null;
  /** The person set the effect and transition; a new look leaves them. */
  lookPinned?: boolean;
  /** More pictures of the scene, shown after its own while the narration plays on; the build cuts between them. */
  shots?: StoryShot[];
  /** Staging from a story template: where it happens, who is seen and what they do. */
  background?: string | null;
  onScreen?: string[] | null;
  action?: string | null;
  /** A meme from the owner's library played right after the scene. */
  meme?: { name: string; caption: string | null; seconds: number | null } | null;
  /** The speakers' faces in the scene's picture, whose mouths move while they talk; null until a build has looked. */
  faces?: StoryFace[] | null;
}

/** Where a speaker's face is in a picture: the middle of the mouth and the face's width, as fractions of the picture. */
export interface StoryFace {
  name: string;
  x: number;
  y: number;
  width: number;
  /** The person placed it themselves. */
  manual: boolean;
}

/** One of a scene's further pictures. */
export interface StoryShot {
  /** Counts the scene's own picture as 1, so the first further picture is 2. Names the picture to the server. */
  picture: number;
  imagePrompt: string | null;
  hasImage: boolean;
  /** "upload", or the image engine that drew it. */
  imageSource: string | null;
  imageName: string | null;
  faces?: StoryFace[] | null;
}

export interface StoryLine {
  /** "narrator" or a cast member's name. */
  speaker: string;
  text: string;
  /** How it is said and the face that goes with it (see STORY_EMOTIONS); null for a plain line. */
  emotion?: string | null;
}

export interface StoryCastMember {
  name: string;
  gender: string | null;
  age: string | null;
  /** The voice they were given when the narration was made; null until then, or when the narrator reads their lines. */
  voiceId: string | null;
}

export interface StoryScript {
  title: string;
  titleEnglish: string | null;
  language: string;
  summary: string | null;
  musicQuery: string | null;
  scenes: StoryScene[];
  /** The characters who speak in the story, besides the narrator. */
  cast?: StoryCastMember[];
  reviewNotes: string[];
  writtenBy: string | null;
  estimatedSeconds: number;
  /** What the YouTube thumbnail shows, for an image tool. */
  thumbnailPrompt?: string | null;
  hasThumbnail?: boolean;
  /** "upload", or the image engine that drew it. */
  thumbnailSource?: string | null;
  thumbnailName?: string | null;
}

export interface StoryTopicMatch {
  topicId: string;
  name: string;
  summary: string | null;
  sources: StorySource[];
}

export interface StoryPassage {
  textId: string;
  textName: string;
  ref: string;
  title: string;
  language: string;
  url: string;
  excerpt: string;
  direct: boolean;
  license: string;
}

export interface StoryResearch {
  topics: StoryTopicMatch[];
  passages: StoryPassage[];
  queries: string[];
  warnings: string[];
  retrievedAtUtc: string;
}

export interface StoryMusic {
  title: string;
  artist: string;
  pageUrl: string | null;
  licenseCode: string;
  licenseUrl: string | null;
  attribution: string;
  /** Composed with Google Lyria, the person's own file, or a catalogue track. */
  source?: 'composed' | 'upload' | 'catalogue';
  /** For a composed track: the brief it was composed from, and the length asked for. */
  prompt?: string | null;
  seconds?: number | null;
}

/** What the composer would be asked for now, and how long the track should be. */
export interface StoryMusicBrief {
  prompt: string;
  seconds: number;
}

export interface StoryRender {
  jobId: string;
  status: StoryRenderStatus;
  progress: number;
  message: string | null;
  downloadable: boolean;
  /** The speed the video plays at (1 = as built); its subtitles and chapters are timed to it. */
  speed?: number;
  /** How long the video runs at that speed. */
  seconds?: number;
}

export interface StoryChapter {
  startSeconds: number;
  stamp: string;
  title: string;
}

/** Everything needed to upload the finished video, already checked against YouTube's limits. */
export interface StoryKit {
  titleOptions: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  chapters: StoryChapter[];
  pinnedComment: string;
  engagementComment: string;
  checklist: string[];
  descriptionBytes: number;
  tagsLength: number;
}

export interface StoryBrief {
  title: string;
  notes: string | null;
  language: string;
  targetSeconds: number;
  format: StoryFormat;
  writer: StoryWriterMode;
  voicing?: StoryVoicing;
  packId: string | null;
  genreId?: string;
  genreName?: string | null;
  mode?: StoryGenreMode;
  /** The engine picked to write the script; null walks the configured chain. */
  textEngine?: string | null;
  /** The brand channel the story is made for; 'default' for the default one. */
  brandChannelId?: string | null;
}

export type StoryMusicSource = 'Auto' | 'Generate' | 'Search';

export interface StoryBuildOptions {
  narration: StoryNarrationMode;
  matchClipDuration?: boolean;
  keepClipAudio?: boolean;
  /** Make the characters drawn into the pictures talk (their faces are found with the Gemini key). On when left out. */
  talkingFaces?: boolean;
  voiceProfileId: string | null;
  voiceId: string | null;
  speechEngine: string | null;
  /** One of the engine's offered models; null for its configured one. */
  speechModel?: string | null;
  /** How the lines are delivered, for an engine that supportsStyle (Gemini). */
  speechStyle?: string | null;
  /** Each character speaks in a voice of their own, from the engine's voices in the story's language. */
  castVoices?: boolean;
  speechRate: number;
  closestToMyVoice: boolean;
  visuals: StoryVisualMode;
  imageStyle: string | null;
  music: boolean;
  /** Composed with Google Lyria, a searched royalty-free track, or Auto (composed when Google is set up). */
  musicSource?: StoryMusicSource;
  uploadsAreAiMade: boolean;
  musicQuery: string | null;
  musicVolume: number;
  /** The whole brief for the composer, as the person wrote it; null builds one from the script. */
  musicPrompt?: string | null;
  lookStyle?: StoryLookStyle;
  renderWhenReady: boolean;
  /** Skips every review: the script, the voice, the music and the video. */
  autoApprove: boolean;
  /** How fast the finished video plays (1 = as built). The download, YouTube and the subtitles all use it. */
  videoSpeed?: number;
  /** Let the app pick videoSpeed from how fast the narration came out. Choosing a speed by hand turns it off. */
  autoPace?: boolean;
  /** The pace autoPace aims for. */
  pace?: StoryPaceStyle;
  /** The look of the pictures and the animation. */
  artStyle?: StoryArtStyle;
  /** Also make the dub in the story's other language (Hindi ⇄ English) for YouTube's multi-language audio. */
  dub?: boolean;
}

/**
 * The story told again in its other language over the same pictures, for YouTube's multi-language audio: one video,
 * Hindi for viewers in India and English for the rest of the world.
 */
export interface StoryDub {
  /** 'en' for a Hindi story, 'hi' for an English one. */
  language: 'hi' | 'en';
  label: string;
  scenesSpoken: number;
  scenesTotal: number;
  /** The dub's own project, once built. */
  projectId: string | null;
  /** The dub track (a WAV the length of the video) can be downloaded. */
  trackReady: boolean;
}

/** A subtitle track the story offers as an SRT file: the narration, or (for a Hindi story) its English meaning. */
export interface StorySubtitle {
  language: string;
  label: string;
  source: 'narration' | 'translation';
  cues: number;
}

/** A YouTube video made from the story's project. */
export interface StoryPublication {
  videoId: string;
  channelTitle: string;
  title: string;
  /** What it was uploaded as: public, unlisted or private (a scheduled upload is private until its time). */
  privacy: string;
  /** What YouTube last said it is. */
  privacyStatus: string | null;
  publishedAtUtc: string;
  /** When a scheduled upload goes public. */
  publishAtUtc: string | null;
  health: 'Unknown' | 'Processing' | 'Ok' | 'Issue' | 'Removed' | string;
  issueMessage: string | null;
  videoUrl: string;
  studioUrl: string;
  thumbnailUrl: string | null;
  /** The channel's connection allows adding subtitle tracks. */
  canCaption: boolean;
  /** It is the story's latest render, not an earlier build. */
  currentRender: boolean;
  /** Subtitle languages added to it from here. */
  captions: string[];
}

export interface StoryCaptionResult {
  language: string;
  label: string;
  outcome: 'added' | 'already' | 'failed';
  message: string | null;
}

export interface StoryCaptionsSent {
  run: StoryRun;
  results: StoryCaptionResult[];
}

export interface StoryRun {
  id: string;
  title: string;
  brief: StoryBrief;
  options: StoryBuildOptions;
  status: StoryRunStatus;
  working: boolean;
  stages: StoryStage[];
  research: StoryResearch | null;
  script: StoryScript | null;
  warnings: string[];
  scriptWarnings: string[];
  projectId: string | null;
  render: StoryRender | null;
  kit: StoryKit | null;
  music: StoryMusic | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  /** When the person said "go with this script"; cleared whenever the words change. */
  scriptApprovedAtUtc: string | null;
  /** Empty until the project has been built. */
  subtitles: StorySubtitle[];
  /** Newest first. */
  publications: StoryPublication[];
  /** While the status is AwaitingReview: the step waiting to be approved. */
  review?: StoryReviewStage | null;
  voiceApprovedAtUtc?: string | null;
  musicApprovedAtUtc?: string | null;
  videoApprovedAtUtc?: string | null;
  /** The composer's brief and length, to read, edit, or paste into Google's own music tool. */
  musicBrief?: StoryMusicBrief | null;
  /** The series this story is a part of; null for a story nobody has continued. */
  series?: StorySeriesLink | null;
  /** Ideas for the part after this one, kept once suggested. */
  nextParts?: StoryNextPartIdea[];
  /** The text engine that suggested them, or 'built-in'. */
  nextPartsBy?: string | null;
  /** The part started from this one. */
  nextRunId?: string | null;
  /** How fast the narration came out, once it exists. */
  pace?: StoryPace | null;
  /** The dub, when one was asked for. */
  dub?: StoryDub | null;
}

/** Where a story sits in a series told over several videos. */
export interface StorySeriesLink {
  id: string;
  name: string;
  part: number;
  previousRunId: string | null;
  /** The series goes on making parts by itself up to this one. */
  autoContinueTo: number | null;
  hasStorySoFar: boolean;
}

export interface StoryNextPartIdea {
  title: string;
  notes: string;
  hook: string | null;
}

/** How fast the voice came out, and the speed that would bring it to a comfortable pace. */
export interface StoryPace {
  wordsPerMinute: number;
  targetWordsPerMinute: number;
  suggestedSpeed: number;
  verdict: 'slow' | 'good' | 'fast';
  /** The suggestion was made the video's speed, because the app was choosing the pace. */
  applied: boolean;
}

/** A series and its parts in order, each as it appears on the storyboard. */
export interface StorySeries {
  id: string;
  name: string;
  parts: StoryRunSummary[];
  latestRunId: string;
  autoContinueTo: number | null;
  /** Ideas for the part after the latest one, if any were asked for. */
  nextParts: StoryNextPartIdea[];
  nextPartsBy: string | null;
  updatedAtUtc: string;
}

/** Starts the next part. Everything is optional: left out, it comes from the part it continues. */
export interface ContinueStoryBody {
  title?: string;
  notes?: string;
  /** One of the suggested ideas, by its place in the list. */
  ideaIndex?: number;
  /** Keep making parts by themselves until this part number. */
  autoContinueTo?: number;
  /** Make another take of the next part even though one exists. */
  again?: boolean;
}

/** Take scenes again, or speak them all again in a changed voice. */
export interface RedoNarrationBody {
  scenes?: number[];
  voiceId?: string | null;
  speechStyle?: string | null;
  speechRate?: number;
  castVoices?: boolean;
}

export interface RedoMusicBody {
  prompt?: string | null;
  style?: string | null;
  source?: StoryMusicSource;
  volume?: number;
  off?: boolean;
}

export interface EditSceneLookBody {
  number: number;
  effect?: StoryEffect;
  transition?: StoryTransition;
  transitionSeconds?: number;
  /** Hand the scene back to the automatic choice. */
  auto?: boolean;
}

export interface RedoLookBody {
  newLook: boolean;
  style?: StoryLookStyle;
  musicVolume?: number;
  scenes?: EditSceneLookBody[];
}

/** A run in the list and on the storyboard: enough to draw a card, place it in its column and open it. */
export interface StoryRunSummary {
  id: string;
  title: string;
  status: StoryRunStatus;
  working: boolean;
  progress: number;
  message: string | null;
  hasProject: boolean;
  hasKit: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  language: string;
  format: StoryFormat;
  sceneCount: number;
  durationSeconds: number;
  scriptApprovedAtUtc: string | null;
  hasRender: boolean;
  /** The first scene with a picture of its own, for the card. */
  coverScene: number | null;
  publicationCount: number;
  /** The newest YouTube video made from it. */
  publication: StoryPublication | null;
  seriesId?: string | null;
  seriesName?: string | null;
  part?: number | null;
}

// ------------------------------------------------------------------------------------------------ what the page sends

/** Every field is optional; the server fills in the rest. */
export type StoryBuildOptionsBody = Partial<StoryBuildOptions>;

export interface CreateStoryRunBody {
  /** Optional only for a built-in story, which brings its own title. */
  title?: string;
  notes?: string;
  language?: string;
  targetSeconds?: number;
  format?: StoryFormat;
  writer?: StoryWriterMode;
  voicing?: StoryVoicing;
  packId?: string;
  /** The genre the story is made in; empty for the devotional one. */
  genreId?: string;
  /** One of the options' text engines; left out, the configured chain writes it. */
  textEngine?: string;
  /** The brand channel the story is made for; its project publishes under it. Left out is the default channel. */
  brandChannelId?: string;
  options?: StoryBuildOptionsBody;
}

/**
 * A story as a file, as the server exports it. The script is in the shape a chat's reply has, so importing it goes
 * through the same parser and citation checks; the page only checks it is this kind of file before sending it.
 */
export interface StoryExportFile {
  kind: 'animstudio-story';
  version: number;
  exportedAtUtc: string;
  story: CreateStoryRunBody;
  script: { title: string; scenes: unknown[] } & Record<string, unknown> | null;
}

export interface EditStorySourceBody {
  text: string;
  ref: string;
  note: string | null;
}

export interface EditStorySceneBody {
  /** The number the scene had, so its picture stays with it; 0 for a scene added by hand. */
  number: number;
  headline: string;
  narration: string;
  english: string | null;
  basis: string;
  sources: EditStorySourceBody[];
  imagePrompt: string | null;
  videoPrompt?: string | null;
  imageKeywords: string[];
  mood: string | null;
  /** The scene's further pictures in their new order; left out, they are kept as they are. */
  shots?: EditStoryShotBody[];
  /** An emotion for each of the scene's lines, in order (null: plain); left out, they are kept as they are. */
  lineEmotions?: (string | null)[] | null;
}

export interface EditStoryShotBody {
  /** The picture number it had, so its picture stays with it; 0 for a new one. */
  picture: number;
  imagePrompt: string | null;
}

export interface EditStoryScriptBody {
  title: string;
  titleEnglish: string | null;
  summary: string | null;
  musicQuery: string | null;
  /** Left out keeps it; empty clears it. */
  thumbnailPrompt?: string | null;
  scenes: EditStorySceneBody[];
}

/** One daily limit a build would use: on Google's side for a model, or this app's own cap on a provider. */
export interface StoryBudgetLine {
  kind: 'google' | 'app';
  /** What the limit is for, so "proceed with the alternatives" switches the right part. */
  area: 'speech' | 'music' | 'image';
  name: string;
  label: string;
  /** Requests already sent today, as this app counted them. */
  used: number;
  /** Requests the build would send at most. */
  needed: number;
  limit: number;
  percentAfter: number;
  status: StoryBudgetStatus;
  /** What to switch to that does not use this limit. */
  fallback: string;
}

export type StoryBudgetStatus = 'ok' | 'warn' | 'over';

/** What a build would use of today's paid Google limits and the free image engines' daily caps, checked before Build. */
export interface StoryBudgetReport {
  status: StoryBudgetStatus;
  warnAtPercent: number;
  lines: StoryBudgetLine[];
  resetsAtUtc: string;
  notes: string[];
}
