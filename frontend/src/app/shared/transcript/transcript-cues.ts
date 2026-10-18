import { MediaTranscriptLine } from '../../core/models/api.models';

/** "00:01:02,500" / "01:02.5" / "62.5" → seconds; NaN when it is not a timestamp. */
export function parseTimestamp(value: string): number {
  const parts = value.trim().replace(',', '.').split(':');
  if (parts.length > 3 || parts.some((p) => p === '' || Number.isNaN(Number(p)))) return NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

const CUE_TIMING = /^\s*([\d:.,]+)\s*-->\s*([\d:.,]+)/;

/**
 * The cues of an .srt or .vtt file, in order. Numbering, WebVTT headers, NOTE/STYLE blocks
 * and cue settings are dropped; inline tags such as <i> are stripped to plain text. Empty
 * when the text holds no timed cue at all - a plain .txt is shown as it is instead.
 */
export function parseSubtitleCues(text: string): MediaTranscriptLine[] {
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  const cues: MediaTranscriptLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const timing = CUE_TIMING.exec(lines[i]);
    if (!timing) continue;
    const start = parseTimestamp(timing[1]);
    const end = parseTimestamp(timing[2]);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;

    const body: string[] = [];
    while (i + 1 < lines.length && lines[i + 1].trim() !== '') {
      body.push(lines[++i].trim());
    }
    const spoken = body.join(' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (spoken) cues.push({ startSeconds: start, endSeconds: Math.max(start, end), text: spoken });
  }
  return cues;
}

/** 62.5 → "1:02"; with hours past the hour → "1:01:02". */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = (total % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** 62.5 → "00:01:02,500", the SubRip form. */
function srtTimestamp(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

/** The words only, one line per cue. */
export function cuesAsText(cues: readonly MediaTranscriptLine[]): string {
  return cues.map((c) => c.text).join('\n');
}

/** "[0:04] words" per cue, with every time moved by `offset` seconds (e.g. onto the timeline). */
export function cuesAsTimedText(cues: readonly MediaTranscriptLine[], offset = 0): string {
  return cues.map((c) => `[${formatClock(c.startSeconds + offset)}] ${c.text}`).join('\n');
}

/** A SubRip file of the cues, with every time moved by `offset` seconds. */
export function cuesAsSrt(cues: readonly MediaTranscriptLine[], offset = 0): string {
  return cues
    .map((c, i) => `${i + 1}\n${srtTimestamp(c.startSeconds + offset)} --> ${srtTimestamp(c.endSeconds + offset)}\n${c.text}\n`)
    .join('\n');
}

/** Index of the cue being spoken at `seconds`, or of the last one started; -1 before the first. */
export function cueIndexAt(cues: readonly MediaTranscriptLine[], seconds: number): number {
  let found = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].startSeconds > seconds) break;
    found = i;
  }
  return found;
}
