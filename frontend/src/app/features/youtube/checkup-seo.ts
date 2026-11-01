import { HASHTAGS, splitTags } from './checkup-draft';

export type SeoStatus = 'ok' | 'warn' | 'bad';

export interface SeoCheck {
  id: string;
  label: string;
  status: SeoStatus;
  /** What to do, shown when the check isn't fully passed. */
  tip: string;
  weight: number;
}

export interface SeoInput {
  title: string;
  description: string;
  tagsText: string;
  pinnedComment?: string;
  isShort: boolean;
  durationSeconds: number | null;
}

/** Words of three letters or more, lower-cased - what a title and a tag are compared by. */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{M}\p{N}]{3,}/gu) ?? []);
}

/**
 * Checks a draft against what is widely published as YouTube search practice: a title that
 * shows in full and leads with the search phrase, a description whose first 125 characters
 * carry the subject, three to five hashtags, a sensible tag list, chapters on longer videos.
 * It is guidance, not a ranking guarantee - nothing here is something YouTube refuses.
 */
export function seoChecks(input: SeoInput): SeoCheck[] {
  const title = input.title.trim();
  const description = input.description.trim();
  const tags = splitTags(input.tagsText);
  const tagChars = tags.join(',').length;
  const hashtags = new Set((description.match(HASHTAGS) ?? []).map((h) => h.toLowerCase()));
  const titleWords = words(title);
  const opening = description.slice(0, 125).toLowerCase();
  const checks: SeoCheck[] = [];

  const full = input.isShort ? 50 : 60;
  checks.push({
    id: 'title-length', label: `Title fits (about ${full} characters show in full)`, weight: 15,
    status: title.length === 0 ? 'bad' : title.length <= full ? 'ok' : title.length <= 75 ? 'warn' : 'bad',
    tip: `Your title is ${title.length} characters. Longer titles are cut off${input.isShort ? ' on a phone' : ' in search'} - move the main words to the front or trim the end.`,
  });

  const shouting = title.split(/\s+/).filter((w) => w.length > 3 && w === w.toUpperCase() && /\p{Lu}/u.test(w)).length;
  checks.push({
    id: 'title-caps', label: 'No ALL-CAPS words in the title', weight: 5,
    status: shouting === 0 ? 'ok' : shouting <= 1 ? 'warn' : 'bad',
    tip: 'ALL-CAPS words read as shouting and can lower clicks. Keep capitals for names.',
  });

  const lead = title.toLowerCase().slice(0, 45);
  const firstTag = tags[0] ? words(tags[0]) : [];
  checks.push({
    id: 'title-keyword', label: 'Title starts with the main search phrase', weight: 15,
    status: firstTag.length === 0 ? 'warn' : firstTag.some((w) => lead.includes(w)) ? 'ok' : 'bad',
    tip: firstTag.length === 0
      ? 'Add tags first - the first tag should be the phrase people type to find this video.'
      : `Put “${tags[0]}” (your first tag) or its main words in the first few words of the title.`,
  });

  checks.push({
    id: 'description-opening', label: 'First 125 characters carry the subject', weight: 15,
    status: description.length < 40 ? 'bad' : titleWords.some((w) => w.length >= 4 && opening.includes(w)) ? 'ok' : 'warn',
    tip: 'Search shows only the first ~125 characters of the description. Start with what the video is and the main search phrase, not a greeting.',
  });

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const wantWords = input.isShort ? 15 : 80;
  checks.push({
    id: 'description-length', label: input.isShort ? 'Description gives some context' : 'Description is detailed (80+ words)', weight: 10,
    status: wordCount >= wantWords ? 'ok' : wordCount >= wantWords / 2 ? 'warn' : 'bad',
    tip: input.isShort
      ? 'Add a line or two about the subject so YouTube understands the video.'
      : 'Longer descriptions give YouTube more to understand. Explain the subject in a few short paragraphs.',
  });

  const tagNote = hashtags.size > 15 ? 'More than 15 hashtags makes YouTube ignore all of them.' : 'Use three to five relevant hashtags at the end of the description; the first three show above the title.';
  checks.push({
    id: 'hashtags', label: 'Three to five hashtags', weight: 10,
    status: hashtags.size > 15 ? 'bad' : hashtags.size >= 3 && hashtags.size <= 5 ? 'ok' : hashtags.size >= 1 ? 'warn' : 'bad',
    tip: tagNote,
  });

  if (input.isShort) {
    const hasShorts = hashtags.has('#shorts') || /#shorts/i.test(title);
    checks.push({
      id: 'shorts-tag', label: '#Shorts is included', weight: 5,
      status: hasShorts ? 'ok' : 'warn',
      tip: 'Add #Shorts to the title or description so the video is clearly a Short.',
    });
  }

  checks.push({
    id: 'tags', label: 'A useful tag list (8–25 tags, under 450 characters)', weight: 10,
    status: tags.length === 0 ? 'bad' : tags.length >= 8 && tags.length <= 25 && tagChars <= 450 ? 'ok' : tagChars > 500 ? 'bad' : 'warn',
    tip: `You have ${tags.length} tag${tags.length === 1 ? '' : 's'} (${tagChars} characters). Start with the exact search phrase, then variants, spellings and the broader topic.`,
  });

  if (!input.isShort && (input.durationSeconds ?? 0) >= 300) {
    checks.push({
      id: 'chapters', label: 'Chapters (timestamps) for a longer video', weight: 10,
      status: /(^|\n)\s*0?0:00\b/.test(description) ? 'ok' : 'warn',
      tip: 'Videos over five minutes do better with chapters. Start with 0:00 and list at least three.',
    });
  }

  checks.push({
    id: 'pinned', label: 'A pinned comment ready', weight: 5,
    status: (input.pinnedComment ?? '').trim().length > 0 ? 'ok' : 'warn',
    tip: 'A pinned question or invitation sparks the first comments, which helps early engagement.',
  });

  return checks;
}

/** 0-100, weighting each check and counting a warning as half. */
export function seoScore(checks: readonly SeoCheck[]): number {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0) return 0;
  const earned = checks.reduce((sum, c) => sum + c.weight * (c.status === 'ok' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  return Math.round((earned / total) * 100);
}
