import { Clip, TimelineItem } from '../../../core/models/api.models';
import { ClipAudioSetting, ClipRow, MusicTrackRow, isVoiceoverTrack } from '../models/clip-studio.models';
import { baseAssetId } from './timeline-transfer';

/**
 * Which library files a saved timeline actually uses, and where. Pure functions over the
 * draft shape (see StudioStateService.buildDraftData), so the open cut and every other cut
 * of the project are read by the same rules.
 *
 * A draft lists EVERY library clip in `rows`, placed or not, so only `included` rows count;
 * searching the document for an id would call everything used.
 */

/** Where in a timeline a file is placed. */
export type UsageRole = 'video' | 'overlay' | 'image' | 'voice' | 'music' | 'clipSound';

export const USAGE_ROLE_LABELS: Record<UsageRole, string> = {
  video: 'Main track (V1)',
  overlay: 'Video overlay',
  image: 'Image',
  voice: 'Voice-over (A1)',
  music: 'Music & sound (A2)',
  clipSound: 'Clip audio',
};

/** Per file, how many times it appears in each role. */
export type DraftUsage = Map<string, Partial<Record<UsageRole, number>>>;

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asRecord<T>(v: unknown): Record<string, T> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {};
}

function itemRole(item: TimelineItem): UsageRole | null {
  if (item.type === 'text') return null;
  switch (item.trackId) {
    case 'V1': case 'video': return null; // V1 lives in the rows
    case 'V2': case 'V3': return 'overlay';
    case 'IMG1': case 'IMG': return 'image';
    case 'A1': return 'voice';
    case 'A2': return 'music';
  }
  if (item.type === 'image') return 'image';
  if (item.type === 'audio') return 'music';
  if (item.type === 'video') return 'overlay';
  return null;
}

/** Every file the draft places on its timeline, with a count per role. */
export function draftAssetUsage(draft: unknown): DraftUsage {
  const d = asRecord<unknown>(draft);
  const usage: DraftUsage = new Map();
  const add = (assetId: string | null | undefined, role: UsageRole) => {
    if (!assetId) return;
    const roles = usage.get(assetId) ?? {};
    roles[role] = (roles[role] ?? 0) + 1;
    usage.set(assetId, roles);
  };

  // Clip sounds only count for clips that are actually in the cut.
  const placedClipIds = new Set<string>();

  for (const r of asArray<ClipRow>(d['rows'])) {
    if (!r?.included || typeof r.clip?.id !== 'string') continue;
    placedClipIds.add(r.clip.id);
    add(baseAssetId(r.clip), 'video');
  }

  for (const it of asArray<TimelineItem>(d['timelineItems'])) {
    if (!it || typeof it.id !== 'string') continue;
    placedClipIds.add(it.id);
    const role = itemRole(it);
    if (role && typeof it.src === 'string') add(baseAssetId({ id: it.src } as Pick<Clip, 'id'>), role);
  }

  for (const t of asArray<MusicTrackRow>(d['musicTracks'])) {
    if (t && typeof t.assetId === 'string') add(t.assetId, isVoiceoverTrack(t) ? 'voice' : 'music');
  }

  // The older single music bed, kept by drafts saved before music tracks existed.
  const bed = d['musicAssetId'];
  if (typeof bed === 'string' && !asArray<MusicTrackRow>(d['musicTracks']).some((t) => t?.assetId === bed)) {
    add(bed, 'music');
  }

  for (const [clipId, sound] of Object.entries(asRecord<ClipAudioSetting>(d['clipSounds']))) {
    if (placedClipIds.has(clipId) && typeof sound?.audioAssetId === 'string') add(sound.audioAssetId, 'clipSound');
  }

  return usage;
}

/** Total placements across all roles. */
export function usageTotal(roles: Partial<Record<UsageRole, number>> | undefined): number {
  if (!roles) return 0;
  return Object.values(roles).reduce((sum, n) => sum + (n ?? 0), 0);
}
