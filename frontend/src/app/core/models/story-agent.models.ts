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
export type StoryLookStyle = 'Auto' | 'Gentle' | 'Cinematic' | 'Lively';

/** The picture's motion; the renderer's own names. */
export const STORY_EFFECTS = ['None', 'ZoomIn', 'ZoomOut', 'PanLeft', 'PanRight', 'PanUp', 'PanDown'] as const;
export type StoryEffect = (typeof STORY_EFFECTS)[number];

/** The cut into the next scene; the renderer's own names. */
export const STORY_TRANSITIONS = [
  'None', 'Fade', 'Dissolve', 'WipeLeft', 'WipeRight', 'SlideLeft', 'SlideRight', 'SlideUp', 'SlideDown', 'CircleOpen', 'CircleClose', 'ZoomIn',
] as const;
export type StoryTransition = (typeof STORY_TRANSITIONS)[number];

export type StoryStageStatus = 'Pending' | 'Running' | 'Completed' | 'Skipped' | 'Failed';
export type StoryWriterMode = 'Auto' | 'Manual' | 'BuiltIn';
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
  /** The same moment as an 8-second moving shot, for Google Flow or Veo. */
  videoPrompt?: string | null;
  /** A moving clip is attached and plays instead of the picture. */
  hasVideo?: boolean;
  videoName?: string | null;
  /** How many times the narration was taken again. */
  audioTake?: number;
  /** The motion and the cut into the next scene the last build used; null before a build. */
  effect?: StoryEffect | null;
  transition?: StoryTransition | null;
  transitionSeconds?: number | null;
  /** The person set the effect and transition; a new look leaves them. */
  lookPinned?: boolean;
}

export interface StoryLine {
  /** "narrator" or a cast member's name. */
  speaker: string;
  text: string;
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
  packId: string | null;
}

export type StoryMusicSource = 'Auto' | 'Generate' | 'Search';

export interface StoryBuildOptions {
  narration: StoryNarrationMode;
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
  packId?: string;
  options?: StoryBuildOptionsBody;
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
}

export interface EditStoryScriptBody {
  title: string;
  titleEnglish: string | null;
  summary: string | null;
  musicQuery: string | null;
  scenes: EditStorySceneBody[];
}
