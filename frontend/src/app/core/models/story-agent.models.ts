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
  | 'Cancelled';

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
}

export interface StoryScript {
  title: string;
  titleEnglish: string | null;
  language: string;
  summary: string | null;
  musicQuery: string | null;
  scenes: StoryScene[];
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

export interface StoryBuildOptions {
  narration: StoryNarrationMode;
  voiceProfileId: string | null;
  voiceId: string | null;
  speechEngine: string | null;
  speechRate: number;
  closestToMyVoice: boolean;
  visuals: StoryVisualMode;
  imageStyle: string | null;
  music: boolean;
  uploadsAreAiMade: boolean;
  musicQuery: string | null;
  musicVolume: number;
  renderWhenReady: boolean;
  autoApprove: boolean;
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
}

/** A run in the list: enough to draw a card and open it. */
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
