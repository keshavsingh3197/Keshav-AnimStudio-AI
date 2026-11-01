/**
 * Matching a video's words to the channel's playlists and the studio's topics, by plain word
 * overlap - no AI, so it is instant and works the same for a channel with thousands of playlists.
 */

/** Words too common in titles to say anything about which playlist a video belongs in. */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'your', 'you', 'this', 'that', 'video', 'videos', 'short', 'shorts', 'song', 'songs',
  'new', 'full', 'official', 'hd', '4k', 'status', 'part', 'episode', 'ep', 'of', 'in', 'on', 'to', 'a', 'an',
  'की', 'के', 'का', 'से', 'में', 'और', 'है', 'को', 'पर', 'एक', 'यह', 'ये', 'जी',
]);

/** Lower-cased letter/number runs of two characters or more, without stop words or hashtags' "#". */
export function words(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.toLowerCase().match(/[\p{L}\p{M}\p{N}]{2,}/gu) ?? []) {
    if (!STOP_WORDS.has(w)) out.add(w);
  }
  return out;
}

/** Folds case and spacing, for "type to search" filters. */
export function fold(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Items whose name contains every typed word, in their own order. */
export function search<T>(items: readonly T[], query: string, name: (item: T) => string): T[] {
  const tokens = fold(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [...items];
  return items.filter((item) => {
    const n = fold(name(item));
    return tokens.every((t) => n.includes(t));
  });
}

export interface Ranked<T> { item: T; score: number }

/**
 * How well each item's name fits the video: the share of the name's words found in the video's
 * text, with a bonus when the whole name appears in it, and when it is the video's topic.
 * Only items that clear `min` are returned, best first.
 */
export function rank<T>(items: readonly T[], name: (item: T) => string, videoText: string, topicName?: string | null, min = 0.5): Ranked<T>[] {
  const have = words(videoText);
  const whole = fold(videoText);
  const topic = topicName ? fold(topicName) : '';
  const ranked: Ranked<T>[] = [];
  for (const item of items) {
    const label = fold(name(item));
    const own = words(label);
    if (own.size === 0) continue;
    let hits = 0;
    for (const w of own) if (have.has(w)) hits++;
    let score = hits / own.size;
    if (label.length >= 3 && whole.includes(label)) score += 0.5;
    if (topic && (label === topic || label.includes(topic) || topic.includes(label))) score += 1;
    if (score >= min) ranked.push({ item, score });
  }
  return ranked.sort((a, b) => b.score - a.score);
}
