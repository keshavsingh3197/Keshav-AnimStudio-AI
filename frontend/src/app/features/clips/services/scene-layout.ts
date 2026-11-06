import { ImageCameraMotion, OverlayMotion, SceneTimeline, TimelineItem } from '../../../core/models/api.models';
import { MusicTrackRow } from '../models/clip-studio.models';
import { bedPieces } from './audio-enhance';
import { DEFAULT_TEXT_STYLE } from './text-overlay-layout';

/**
 * A scene-based project - a Story Agent story, an imported bundle - put on the Video editor's lanes: each scene's
 * picture on IMG1 (or its moving clip on V2), its narration on A1, its subtitles on TXT1 over the picture, and the
 * project's music under all of it on A2. Every piece lands where the render puts it, so the timeline plays the same
 * video and each piece can be moved, trimmed, restyled or swapped on its own lane. Pure, so it can be checked without a
 * studio.
 */

/** A file in the project's library, as the timeline refers to it. */
export interface SceneLayoutMedia {
  /** The library entry's id: what an item's `src` holds. */
  id: string;
  name: string;
  kind: 'image' | 'video';
}

export interface SceneLayoutLookup {
  /** The library entry for a scene's background, or null when it is not in the library. */
  media(assetId: string): SceneLayoutMedia | null;
  /** How long an audio file runs, when known, so the music can be repeated to cover the video. */
  audioSeconds(assetId: string): number | undefined;
}

export interface SceneLayout {
  items: TimelineItem[];
  musicTracks: MusicTrackRow[];
  /** The lanes the layout puts something on, to be shown. */
  lanes: string[];
  pictures: number;
  narration: number;
  captions: number;
  music: number;
  /** Scenes whose background is not in the library; they are left out and the rest close up. */
  missing: number;
}

/** Key prefixes of what the layout lays, so laying it out again replaces exactly these. */
export const SCENE_ITEM_PREFIX = 'scene_';
export const SCENE_VOICE_PREFIX = 'vo_scene_';
export const SCENE_MUSIC_PREFIX = 'music_scene_';

/** The render's camera moves, as the editor's. */
const MOTIONS: Record<string, ImageCameraMotion> = {
  ZoomIn: 'zoom-in',
  ZoomOut: 'zoom-out',
  PanLeft: 'pan-left',
  PanRight: 'pan-right',
  PanUp: 'pan-up',
  PanDown: 'pan-down',
};

/** The longest fade a picture gets at a scene change; the render's crossfade is shared between the two pictures. */
const MAX_PICTURE_FADE = 0.4;
const CAPTION_FADE = 0.12;

const round = (seconds: number) => Math.round(seconds * 1000) / 1000;

export function layOutScenes(timeline: SceneTimeline, lookup: SceneLayoutLookup): SceneLayout {
  const items: TimelineItem[] = [];
  const musicTracks: MusicTrackRow[] = [];
  const lanes = new Set<string>();
  let pictures = 0;
  let narration = 0;
  let captions = 0;
  let missing = 0;
  // Pictures play one after another, so a missing one would leave the rest late: they close up, and the sound and
  // subtitles of each scene follow its picture.
  let shift = 0;

  timeline.scenes.forEach((scene, i) => {
    const media = scene.backgroundAssetId ? lookup.media(scene.backgroundAssetId) : null;
    if (!media) {
      missing++;
      shift += scene.seconds;
      return;
    }

    const start = round(scene.startSeconds - shift);
    const previous = timeline.scenes[i - 1];
    const fadeIn = previous && previous.transition !== 'None' ? Math.min(MAX_PICTURE_FADE, previous.transitionSeconds / 2) : 0;
    const fadeOut = scene.transition !== 'None' ? Math.min(MAX_PICTURE_FADE, scene.transitionSeconds / 2) : 0;
    const motion = media.kind === 'image' ? MOTIONS[scene.effect] : undefined;
    const lane = media.kind === 'image' ? 'IMG1' : 'V2';
    lanes.add(lane);
    pictures++;
    items.push({
      id: `${SCENE_ITEM_PREFIX}pic_${scene.number}_${i}`,
      type: media.kind,
      trackId: lane,
      // No V1 clips play, so every picture is in the one slot before them, in start order.
      slotIndex: 0,
      startTime: start,
      duration: round(scene.seconds),
      src: media.id,
      name: scene.title?.trim() || media.name,
      transform: {
        scale: 1,
        x: 0,
        y: 0,
        opacity: 1,
        transitionIn: (fadeIn > 0 ? 'fade' : 'none') as OverlayMotion,
        transitionInDuration: round(fadeIn),
        transitionOut: (fadeOut > 0 ? 'fade' : 'none') as OverlayMotion,
        transitionOutDuration: round(fadeOut),
        ...(motion ? { motion, motionIntensity: Math.min(0.5, Math.max(0.02, scene.effectIntensity)) } : {}),
      },
    });

    if (scene.audio) {
      lanes.add('A1');
      narration++;
      musicTracks.push({
        key: `${SCENE_VOICE_PREFIX}${scene.number}_${i}`,
        assetId: scene.audio.assetId,
        startSeconds: round(scene.audio.startSeconds - shift),
        volume: 1,
        trimStartSeconds: round(scene.audio.trimStartSeconds),
        trimEndSeconds: round(scene.audio.trimStartSeconds + scene.audio.seconds),
        // Only enough to keep a cut between two stretches of one voice from clicking.
        fadeInSeconds: 0.02,
        fadeOutSeconds: 0.04,
      });
    }

    scene.captions.forEach((caption, c) => {
      lanes.add('TXT1');
      captions++;
      items.push({
        id: `${SCENE_ITEM_PREFIX}txt_${scene.number}_${i}_${c}`,
        type: 'text',
        trackId: 'TXT1',
        // Over the picture: a subtitle takes no slot of its own.
        overlay: true,
        startTime: round(caption.startSeconds - shift),
        duration: round(caption.endSeconds - caption.startSeconds),
        src: caption.text,
        name: caption.speaker ? `${caption.speaker}: subtitle` : `Subtitle ${scene.number}.${c + 1}`,
        textStyle: {
          ...DEFAULT_TEXT_STYLE,
          transitionInDuration: CAPTION_FADE,
          transitionOutDuration: CAPTION_FADE,
        },
      });
    });
  });

  const total = Math.max(0, timeline.totalSeconds - shift);
  if (timeline.musicAssetId && pictures > 0) {
    // As the render plays it: repeated to cover the video, faded in at the start and out at the end.
    const pieces = bedPieces(lookup.audioSeconds(timeline.musicAssetId) ?? total, total);
    pieces.forEach((piece, p) => musicTracks.push({
      key: `${SCENE_MUSIC_PREFIX}${p}`,
      assetId: timeline.musicAssetId!,
      startSeconds: piece.startSeconds,
      volume: Math.max(0, Math.min(1, timeline.musicVolume)),
      trimStartSeconds: 0,
      trimEndSeconds: piece.lengthSeconds,
      fadeInSeconds: piece.fadeInSeconds,
      fadeOutSeconds: piece.fadeOutSeconds,
    }));
    if (pieces.length > 0) lanes.add('A2');
  }

  return {
    items,
    musicTracks,
    lanes: [...lanes],
    pictures,
    narration,
    captions,
    music: musicTracks.filter((t) => t.key.startsWith(SCENE_MUSIC_PREFIX)).length,
    missing,
  };
}
