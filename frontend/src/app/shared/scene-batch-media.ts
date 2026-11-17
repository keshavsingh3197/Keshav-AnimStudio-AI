/**
 * Shared pure helpers for copying batch scene image prompts and matching uploaded
 * pictures back to scenes by filename convention (number or setting name) or order.
 *
 * Kept dependency-free so Angular components and Node CLI test scripts can both load it.
 */

export interface BatchSceneDescriptor {
  number: number;
  setting?: string | null;
  timeOfDay?: string | null;
  mood?: string | null;
  headline?: string | null;
  prompt?: string | null;
}

export interface BatchPromptPlan {
  width: number;
  height: number;
  aspectRatio: string;
  scenes: readonly BatchSceneDescriptor[];
  batchPrompt?: string | null;
  negativePrompt?: string | null;
}

export type ScenePictureMatchReason = 'number' | 'setting' | 'order';

export interface ScenePictureAssignment<TFile extends { name: string }> {
  file: TFile;
  fileIndex: number;
  /** 0-based index into the scene list. */
  sceneIndex: number;
  /** 1-based scene number (`scenes[sceneIndex].number`). */
  sceneNumber: number;
  reason: ScenePictureMatchReason;
}

export interface ScenePictureUploadPlan<TFile extends { name: string }> {
  assignments: ScenePictureAssignment<TFile>[];
  skipped: { file: TFile; fileIndex: number; reason: string }[];
}

const GENERIC_FILE_WORDS = new Set([
  'scene', 'scenes', 'shot', 'shots', 'slide', 'slides', 'pic', 'pics', 'picture', 'pictures',
  'img', 'image', 'images', 'photo', 'photos', 'background', 'backgrounds', 'bg', 'frame', 'frames',
  'part', 'final', 'copy', 'edit', 'draft', 'gemini', 'chatgpt', 'openai', 'claude', 'flow',
  'midjourney', 'ai', 'generated', 'download', 'untitled', 'auto', 'screen', 'screenshot', 'png',
  'jpg', 'jpeg', 'webp', 'v1', 'v2', 'v3',
]);

const EXPLICIT_SCENE_KEYWORD_RE =
  /(?:^|[^a-z0-9])(?:scene|shot|slide|pic(?:ture)?|frame|part|sc)[-_ #\.]*0*(\d{1,3})(?=$|[^0-9])/i;
const GENERIC_MEDIA_NUMBER_RE =
  /(?:^|[^a-z0-9])(?:img|image|s)[-_ #\.]*0*(\d{1,3})(?=$|[^0-9])/i;
const HASH_NUMBER_RE = /(?:^|\s)#0*(\d{1,3})(?=$|\s|[-_.,)])/;
const LEADING_NUMBER_RE = /^\s*0*(\d{1,3})(?=$|\s|[-_.,)])/;
const TRAILING_NUMBER_RE = /(?:^|[\s_-])0*(\d{1,2})(?:\s*(?:final|copy|edit|v\d+))?$/i;
const BROWSER_DUP_SUFFIX_RE = /^(.*?)\s+\((\d+)\)$/;

/** Splits "02_temple.png" into `{ stem: "02_temple", ext: ".png" }`. */
export function splitFileStem(fileName: string): { stem: string; ext: string } {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return { stem: fileName, ext: '' };
  return { stem: fileName.slice(0, dot), ext: fileName.slice(dot) };
}

/**
 * Strips a trailing browser duplicate counter (`"Gemini_Image (1).png"` -> `{ base: "Gemini_Image", dup: 1 }`)
 * so sorting puts the unnumbered first download (`dup: 0`) BEFORE `(1)`, `(2)`, ..., `(10)`.
 */
function splitBrowserDuplicateSuffix(stem: string): { base: string; dup: number } {
  const match = BROWSER_DUP_SUFFIX_RE.exec(stem.trim());
  if (!match) return { base: stem, dup: 0 };
  const n = Number.parseInt(match[2], 10);
  if (!Number.isSafeInteger(n) || n <= 0) return { base: stem, dup: 0 };
  return { base: match[1].trimEnd(), dup: n };
}

/**
 * Natural numeric sort that also keeps browser download sequences (`image.png`, `image (1).png`,
 * `image (2).png`, `image (10).png`) in creation order instead of letting space sort before `.`.
 */
export function comparePictureFileNames(a: string, b: string): number {
  const stemA = splitFileStem(a).stem;
  const stemB = splitFileStem(b).stem;
  const dupA = splitBrowserDuplicateSuffix(stemA);
  const dupB = splitBrowserDuplicateSuffix(stemB);

  const byBase = dupA.base.localeCompare(dupB.base, undefined, { numeric: true, sensitivity: 'base' });
  if (byBase !== 0) return byBase;
  if (dupA.dup !== dupB.dup) return dupA.dup - dupB.dup;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Returns lowercase file names belonging to a browser duplicate download sequence where an unnumbered
 * file (`foo.png`) sits alongside numbered copies (`foo (1).png`, `foo (2).png`). In those sets
 * `(1)` means the 2nd download rather than Scene 1.
 */
export function detectBrowserDuplicateSet(fileNames: readonly string[]): Set<string> {
  const groups = new Map<string, { ext: string; dups: Set<number>; names: string[] }>();
  for (const name of fileNames) {
    const { stem, ext } = splitFileStem(name);
    const { base, dup } = splitBrowserDuplicateSuffix(stem);
    const key = `${base.toLowerCase()}|${ext.toLowerCase()}`;
    let group = groups.get(key);
    if (!group) {
      group = { ext: ext.toLowerCase(), dups: new Set(), names: [] };
      groups.set(key, group);
    }
    group.dups.add(dup);
    group.names.push(name);
  }

  const flagged = new Set<string>();
  for (const group of groups.values()) {
    if (group.dups.has(0) && Array.from(group.dups).some((d) => d > 0)) {
      for (const n of group.names) flagged.add(n.toLowerCase());
    }
  }
  return flagged;
}

interface ParsedSceneNumber {
  number: number;
  explicit: boolean;
}

/** Removes timestamps, years and frame dimensions so "2026-11-17_1080x1920_02.png" keeps only `2`. */
function stripNoiseNumbers(stem: string): string {
  return stem
    .replace(/\b\d{4}[-_]\d{2}[-_]\d{2}\b/g, ' ')
    .replace(/\b\d{8}(?:[-_]\d{4,6})?\b/g, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/\b\d{2,5}\s*[xX×]\s*\d{2,5}\b/g, ' ')
    .replace(/\b(?:360|480|720|1080|1440|2160|4k|8k)p?\b/gi, ' ');
}

function parseSceneNumberInternal(
  fileName: string,
  browserDupSet?: ReadonlySet<string>,
): ParsedSceneNumber | null {
  if (browserDupSet?.has(fileName.toLowerCase())) return null;
  const { stem } = splitFileStem(fileName);
  if (!stem.trim()) return null;

  const cleaned = stripNoiseNumbers(stem).trim();
  if (!cleaned) return null;

  const keyword = EXPLICIT_SCENE_KEYWORD_RE.exec(cleaned);
  if (keyword) {
    const num = Number.parseInt(keyword[1], 10);
    if (Number.isSafeInteger(num) && num >= 1) return { number: num, explicit: true };
  }

  const hash = HASH_NUMBER_RE.exec(cleaned);
  if (hash) {
    const num = Number.parseInt(hash[1], 10);
    if (Number.isSafeInteger(num) && num >= 1) return { number: num, explicit: true };
  }

  const leading = LEADING_NUMBER_RE.exec(cleaned);
  if (leading) {
    const num = Number.parseInt(leading[1], 10);
    if (Number.isSafeInteger(num) && num >= 1) return { number: num, explicit: false };
  }

  const mediaNum = GENERIC_MEDIA_NUMBER_RE.exec(cleaned);
  if (mediaNum) {
    const num = Number.parseInt(mediaNum[1], 10);
    if (Number.isSafeInteger(num) && num >= 1) return { number: num, explicit: false };
  }

  const trailing = TRAILING_NUMBER_RE.exec(cleaned);
  if (trailing) {
    const num = Number.parseInt(trailing[1], 10);
    if (Number.isSafeInteger(num) && num >= 1) return { number: num, explicit: false };
  }

  return null;
}

/**
 * Extracts a 1-based scene number from a filename ("01.png", "02_temple.png", "scene-3.jpg",
 * "Flow 03 final.png", "2026-11-17_scene_2.png") while ignoring years, dates and resolutions.
 */
export function parseSceneNumberFromFileName(
  fileName: string,
  options?: { browserDuplicates?: ReadonlySet<string> },
): number | null {
  return parseSceneNumberInternal(fileName, options?.browserDuplicates)?.number ?? null;
}

function camelWords(text: string | null | undefined): string[] {
  if (!text) return [];
  const spaced = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return spaced ? spaced.split(/\s+/).filter((w) => w.length >= 2) : [];
}

/** Builds a safe, padded filename stem such as `01_temple` or `03_river_ghat`. */
export function suggestedSceneFileStem(
  sceneNumber: number,
  sceneCount: number,
  setting?: string | null,
): string {
  const pad = Math.max(2, String(Math.max(1, sceneCount)).length);
  const prefix = String(sceneNumber).padStart(pad, '0');
  const words = camelWords(setting);
  if (words.length === 0 || (words.length === 1 && words[0] === 'auto')) return prefix;
  return `${prefix}_${words.join('_')}`;
}

export function suggestedSceneFileName(
  sceneNumber: number,
  sceneCount: number,
  setting?: string | null,
  ext = '.png',
): string {
  return `${suggestedSceneFileStem(sceneNumber, sceneCount, setting)}${ext}`;
}

/**
 * Formats one paste-ready prompt containing every scene prompt in order, frame aspect ratio,
 * style/empty-plate rules, suggested upload filenames, and the negative prompt avoid list.
 */
export function formatSceneBatchPrompt(plan: BatchPromptPlan, includeNegative = true): string {
  const scenes = plan.scenes;
  if (scenes.length === 0) return '';

  const orientation = plan.aspectRatio === '16:9'
    ? 'wide landscape'
    : plan.aspectRatio === '1:1'
      ? 'square'
      : 'tall vertical';

  const fileExamples = scenes
    .map((s, idx) => suggestedSceneFileName(s.number || idx + 1, scenes.length, s.setting))
    .join(', ');

  const lines = [
    `Create ${scenes.length} separate images, one for each numbered prompt below, in exact order (1 to ${scenes.length}).`,
    `Every image: ${orientation} ${plan.aspectRatio} frame (${plan.width}x${plan.height}), photorealistic cinematic background plate, consistent art style, colour grade and lighting quality across the whole set.`,
    'Empty scenes only: no people, no faces, no hands, no text, no letters, no watermark. Animated characters are added on top later, so keep open ground in the lower middle of the frame.',
    'Make one image per prompt; do not merge prompts into one picture.',
    `Save each file with its scene number (for example: ${fileExamples} — or simply 01.png, 02.png ... or scene-1.png) so AnimStudio matches them automatically when uploaded together.`,
  ];

  const negative = plan.negativePrompt?.trim();
  if (includeNegative && negative) {
    lines.push(`Avoid (negative prompt): ${negative}.`);
  }

  lines.push('');
  scenes.forEach((scene, idx) => {
    const num = scene.number || idx + 1;
    const prompt = (scene.prompt ?? '').trim();
    lines.push(`${num}. ${prompt}`);
  });

  return lines.join('\n').trimEnd();
}

function meaningfulFileWords(fileName: string): string[] {
  const stem = stripNoiseNumbers(splitFileStem(fileName).stem);
  return camelWords(stem).filter((w) => !GENERIC_FILE_WORDS.has(w) && !/^\d+$/.test(w));
}

function scoreSceneKeywordMatch(fileWords: readonly string[], scene: BatchSceneDescriptor): number {
  if (fileWords.length === 0) return 0;
  const settingWords = camelWords(scene.setting).filter((w) => w !== 'auto');
  const headlineWords = camelWords(scene.headline).filter((w) => !GENERIC_FILE_WORDS.has(w));
  const detailWords = new Set([
    ...camelWords(scene.timeOfDay).filter((w) => w !== 'auto'),
    ...camelWords(scene.mood),
  ]);

  let primaryHits = 0;
  let score = 0;
  const fileSet = new Set(fileWords);
  const fileJoined = fileWords.join(' ');
  const settingJoined = settingWords.join(' ');

  if (settingJoined.length > 0 && fileJoined.includes(settingJoined)) {
    score += 20;
    primaryHits += settingWords.length;
  }
  for (const w of settingWords) {
    if (fileSet.has(w)) {
      score += 10;
      primaryHits++;
    }
  }
  for (const w of headlineWords) {
    if (fileSet.has(w)) {
      score += 6;
      primaryHits++;
    }
  }
  if (primaryHits === 0) return 0;

  for (const w of detailWords) {
    if (fileSet.has(w)) score += 3;
  }
  return score;
}

/**
 * Resolves a batch of dropped/selected picture files onto scene slots:
 * 1. Explicit scene numbers in filenames (`01.png`, `03_river.jpg`, `scene-2.webp`, `Flow 03.png`)
 * 2. Unambiguous setting/headline keywords (`temple.png`, `archive.png`, `river_ghat.png`)
 * 3. Browser-safe natural sort order (`download.png` -> `download (1).png` -> `download (2).png`, `1..10`)
 */
export function planScenePictureUploads<TFile extends { name: string }>(
  files: readonly TFile[],
  scenes: readonly BatchSceneDescriptor[],
  currentSlots: readonly (string | null)[],
): ScenePictureUploadPlan<TFile> {
  if (files.length === 0 || scenes.length === 0) {
    return {
      assignments: [],
      skipped: files.map((file, fileIndex) => ({ file, fileIndex, reason: 'No scenes available to match.' })),
    };
  }

  const entries = files
    .map((file, fileIndex) => ({ file, fileIndex }))
    .sort((a, b) => comparePictureFileNames(a.file.name, b.file.name));

  const browserDupSet = detectBrowserDuplicateSet(files.map((f) => f.name));
  const claimedSceneIndices = new Set<number>();
  const claimedFileIndices = new Set<number>();
  const assignments: ScenePictureAssignment<TFile>[] = [];
  const skipped: { file: TFile; fileIndex: number; reason: string }[] = [];

  // Pass 1: Explicit scene numbers in filename.
  const parsed = entries.map((e) => ({
    ...e,
    parsed: parseSceneNumberInternal(e.file.name, browserDupSet),
  }));

  // If NO number is in 1..scenes.length AND none used an explicit `scene-` keyword,
  // assume camera/generator sequence numbers (e.g. IMG_101.jpg, IMG_102.jpg) meant for Pass 3 order.
  const hasRelevantNumber = parsed.some(
    (p) => p.parsed && ((p.parsed.number >= 1 && p.parsed.number <= scenes.length) || p.parsed.explicit),
  );

  if (hasRelevantNumber) {
    const ownerByScene = new Map<number, string>();
    for (const item of parsed) {
      if (!item.parsed) continue;
      const targetIndex = item.parsed.number - 1;
      if (targetIndex < 0 || targetIndex >= scenes.length) {
        if (item.parsed.explicit) {
          claimedFileIndices.add(item.fileIndex);
          skipped.push({
            file: item.file,
            fileIndex: item.fileIndex,
            reason: `Scene ${item.parsed.number} is outside 1–${scenes.length}.`,
          });
        }
        continue;
      }
      if (claimedSceneIndices.has(targetIndex)) {
        claimedFileIndices.add(item.fileIndex);
        skipped.push({
          file: item.file,
          fileIndex: item.fileIndex,
          reason: `Scene ${item.parsed.number} already matched by "${ownerByScene.get(targetIndex)}".`,
        });
        continue;
      }
      claimedSceneIndices.add(targetIndex);
      claimedFileIndices.add(item.fileIndex);
      ownerByScene.set(targetIndex, item.file.name);
      assignments.push({
        file: item.file,
        fileIndex: item.fileIndex,
        sceneIndex: targetIndex,
        sceneNumber: scenes[targetIndex].number || targetIndex + 1,
        reason: 'number',
      });
    }
  }

  // Pass 2: Setting / headline keyword match on remaining files and remaining scenes.
  const openSceneIndices = scenes.map((_, i) => i).filter((i) => !claimedSceneIndices.has(i));
  const remainingAfterPass1 = entries.filter((e) => !claimedFileIndices.has(e.fileIndex));
  const candidateMatches: { entry: typeof entries[number]; sceneIndex: number; score: number }[] = [];

  for (const entry of remainingAfterPass1) {
    const words = meaningfulFileWords(entry.file.name);
    if (words.length === 0) continue;
    let bestScene = -1;
    let bestScore = 0;
    let secondScore = 0;
    for (const sIdx of openSceneIndices) {
      const score = scoreSceneKeywordMatch(words, scenes[sIdx]);
      if (score > bestScore) {
        secondScore = bestScore;
        bestScore = score;
        bestScene = sIdx;
      } else if (score > secondScore) {
        secondScore = score;
      }
    }
    if (bestScene >= 0 && bestScore > secondScore) {
      candidateMatches.push({ entry, sceneIndex: bestScene, score: bestScore });
    }
  }

  // Only assign a keyword match when it also uniquely wins that scene among the files.
  const matchesByScene = new Map<number, typeof candidateMatches>();
  for (const m of candidateMatches) {
    const list = matchesByScene.get(m.sceneIndex) ?? [];
    list.push(m);
    matchesByScene.set(m.sceneIndex, list);
  }
  for (const [sceneIndex, list] of matchesByScene) {
    list.sort((a, b) => b.score - a.score);
    if (list.length === 1 || list[0].score > list[1].score) {
      const winner = list[0];
      claimedSceneIndices.add(sceneIndex);
      claimedFileIndices.add(winner.entry.fileIndex);
      assignments.push({
        file: winner.entry.file,
        fileIndex: winner.entry.fileIndex,
        sceneIndex,
        sceneNumber: scenes[sceneIndex].number || sceneIndex + 1,
        reason: 'setting',
      });
    }
  }

  // Pass 3: Natural + browser-duplicate-safe order fallback into remaining target slots.
  const remainingFiles = entries.filter((e) => !claimedFileIndices.has(e.fileIndex));
  if (remainingFiles.length > 0) {
    let targetSlots = scenes
      .map((_, i) => i)
      .filter((i) => !claimedSceneIndices.has(i) && !currentSlots[i]);
    if (targetSlots.length === 0) {
      targetSlots = scenes.map((_, i) => i).filter((i) => !claimedSceneIndices.has(i));
    }

    const fit = Math.min(remainingFiles.length, targetSlots.length);
    for (let k = 0; k < fit; k++) {
      const item = remainingFiles[k];
      const sceneIndex = targetSlots[k];
      claimedSceneIndices.add(sceneIndex);
      assignments.push({
        file: item.file,
        fileIndex: item.fileIndex,
        sceneIndex,
        sceneNumber: scenes[sceneIndex].number || sceneIndex + 1,
        reason: 'order',
      });
    }
    for (let k = fit; k < remainingFiles.length; k++) {
      skipped.push({
        file: remainingFiles[k].file,
        fileIndex: remainingFiles[k].fileIndex,
        reason: 'No empty scene slot left for this extra file.',
      });
    }
  }

  assignments.sort((a, b) => a.sceneIndex - b.sceneIndex);
  return { assignments, skipped };
}

/** Concise toast summary after a batch scene upload finishes. */
export function summarizeSceneUploadPlan<TFile extends { name: string }>(
  uploaded: readonly ScenePictureAssignment<TFile>[],
  skippedCount: number,
): string {
  const count = uploaded.length;
  if (count === 0) {
    return skippedCount > 0
      ? `No pictures matched a valid scene slot (${skippedCount} skipped). Name files 01.png, 02.png… or match scene count.`
      : 'No pictures uploaded.';
  }

  const reasons = new Set(uploaded.map((u) => u.reason));
  let how: string;
  if (reasons.size === 1) {
    const only = uploaded[0].reason;
    how = only === 'number'
      ? 'by scene number in filename'
      : only === 'setting'
        ? 'by setting name in filename'
        : 'in file-name order';
  } else {
    how = 'by filename & order';
  }

  const head = `Uploaded ${count} picture${count === 1 ? '' : 's'} (${how}).`;
  const extra = skippedCount > 0 ? ` ${skippedCount} skipped.` : '';
  return `${head}${extra} Check each scene below.`;
}
