import { StoryFormat, StoryGenreMode, StoryLookStyle, StorySourceConfidence } from './story-agent.models';

/**
 * A Story Agent genre as the admin console reads and writes it: what kind of story it is and everything bundled with it.
 * The server checks every field again (StoryGenreRules); the limits here are only early feedback.
 */
export interface StoryGenre {
  id: string;
  name: string;
  nameHindi: string | null;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
  /** Ships with the app: deleting it puts the shipped version back. */
  builtIn: boolean;
  mode: StoryGenreMode;
  styleGuide: string;
  moods: string[];
  defaultLanguage: 'hi' | 'en';
  defaultTargetSeconds: number;
  defaultFormat: StoryFormat;
  lookStyle: StoryLookStyle;
  imageStyle: string | null;
  musicQuery: string | null;
  speechStyle: string | null;
  tags: string[];
  hashtags: string[];
  links: StoryGenreLink[];
  titleSuffix: string | null;
  pinnedLine: string | null;
  category: string;
  madeForKids: boolean;
  topics: StoryGenreTopic[];
  updatedAtUtc?: string;
  updatedBy?: string | null;
}

export interface StoryGenreLink {
  label: string;
  url: string;
}

export interface StoryGenreTopic {
  id: string;
  name: string;
  hindi: string | null;
  keywords: string[];
  summary: string;
  musicQuery: string | null;
  sources: StoryGenreSource[];
}

/** A place in a text of the catalogue (scripture genres only). */
export interface StoryGenreSource {
  textId: string;
  ref: string;
  note: string | null;
  confidence: StorySourceConfidence;
}

/** A text a scripture topic may point at. */
export interface GranthText {
  id: string;
  english: string;
  hindi: string;
  kind: string;
  divisionLabel: string;
  unitLabel: string;
}

export interface StoryGenresPage {
  genres: StoryGenre[];
  texts: GranthText[];
  /** YouTube's categories, for the checklist the kit writes. */
  categories: string[];
  /** Where a scripture genre reads its passages from. */
  scriptureSource: string;
}

export const STORY_GENRE_LIMITS = {
  name: 60,
  description: 400,
  styleGuide: 4000,
  moods: 8,
  tags: 30,
  hashtags: 10,
  links: 8,
  topics: 80,
  keywords: 40,
  sourcesPerTopic: 12,
} as const;

/** The same slug rule the server applies to genre and topic ids. */
export const STORY_GENRE_ID = /^[a-z0-9][a-z0-9-]{1,39}$/;
