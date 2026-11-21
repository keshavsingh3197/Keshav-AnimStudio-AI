export type CharacterRole =
  | 'Narrator'
  | 'KingCrown'
  | 'SageRishi'
  | 'Divine'
  | 'Scholar'
  | 'ChildDevotee'
  | 'NobleWoman'
  | 'Warrior'
  | 'BrainrotLog'
  | 'CupDancer'
  | 'CartoonTank'
  | 'ComicBobble';

export type SceneSetting =
  | 'Auto'
  | 'Temple'
  | 'ForestAshram'
  | 'RiverGhat'
  | 'Himalaya'
  | 'PalaceCourt'
  | 'Cosmos'
  | 'Village'
  | 'Battlefield'
  | 'Archive'
  | 'ModernCity'
  | 'ChaiStall'
  | 'ComedyStage'
  | 'SkyGauntlet'
  | 'TankArena'
  | 'DoorwaySet'
  | 'Bedroom'
  | 'LivingRoom'
  | 'Kitchen'
  | 'SweetShop';

export type ActionKind =
  | 'none'
  | 'sleeping'
  | 'wakingUp'
  | 'walking'
  | 'running'
  | 'sitting'
  | 'praying'
  | 'pointing'
  | 'shockedFall'
  | 'slapForehead'
  | 'eating'
  | 'dancing'
  | 'jumping'
  | 'waving'
  | 'laughing'
  | 'punching'
  | 'kicking'
  | 'hitReact';

/**
 * Strike rhythm for fight actions, on the video clock (seconds since frame 0), so every render and the
 * server's SFX track agree on when a hit lands. Mirrored in C# by ProceduralStrikeTiming — keep both in sync.
 * A strike lands at the start of each beat + impact × (1 / rate).
 */
export const STRIKE_TIMING = {
  punching: { rate: 2.2, impact: 0.35 },
  kicking: { rate: 1.6, impact: 0.4 },
} as const;

/** 0→1 extension of a strike (peaks at the impact moment) and the 1→0 recoil after it, for the victim. */
export function strikePhase(t: number, kind: 'punching' | 'kicking'): { extend: number; recoil: number } {
  const { rate, impact } = STRIKE_TIMING[kind];
  const phase = ((t * rate) % 1 + 1) % 1;
  const extend = phase < impact
    ? 1 - Math.pow(1 - phase / impact, 3)
    : Math.max(0, 1 - (phase - impact) / (1 - impact)) ** 2;
  const recoil = phase >= impact ? Math.exp(-(phase - impact) * 9) : 0;
  return { extend, recoil };
}

export type CameraShotKind =
  | 'auto'
  | 'wideEstablishing'
  | 'twoShot'
  | 'closeUpSpeaker'
  | 'reactionZoom'
  | 'crashPunch'
  | 'overShoulder'
  | 'lowDramatic';

export type SceneTimeOfDay = 'Auto' | 'Dawn' | 'Day' | 'Sunset' | 'Night';

export type SceneTheme =
  | 'Auto'
  | 'VedicTempleSunrise3D'
  | 'CosmosSacred3D'
  | 'HistoryChronicle3D'
  | 'NeonCyberGrid3D'
  | 'SereneNatureGlow'
  | 'ComedyStage3D';

export type VfxStyle =
  | 'Auto'
  | 'DivineAura'
  | 'ComedyBurst'
  | 'CinematicDrama'
  | 'CyberNeon';

export type EmotionKind =
  | 'calm'
  | 'happy'
  | 'laughing'
  | 'surprised'
  | 'angry'
  | 'sad'
  | 'proud'
  | 'confused';

export interface CharacterProfileJson {
  slot: 'Narrator' | 'Left' | 'Right';
  name: string;
  role: CharacterRole;
  robeHex?: string | null;
}

export interface MemeCueJson {
  afterTurnIndex: number;
  name: string;
  caption?: string | null;
  seconds: number;
  startSeconds: number;
}

export interface DialogueTurnJson {
  index: number;
  startSeconds: number;
  endSeconds: number;
  slot: 'Narrator' | 'Left' | 'Right';
  speakerName: string;
  text: string;
  isTitleHook: boolean;
  speakerRole?: CharacterRole | null;
  sceneBackdropCue?: string | null;
  emotion?: string | null;
  action?: ActionKind | string | null;
  listenerAction?: ActionKind | string | null;
  cameraShot?: CameraShotKind | string | null;
  stageTarget?: string | null;
}

export interface SceneRunJson {
  startSeconds: number;
  endSeconds: number;
  setting: SceneSetting;
  timeOfDay: SceneTimeOfDay;
  sceneIndex: number;
}

export interface CharacterSpotJson {
  x: number;
  y: number;
  scale: number;
}

export interface StageLayoutJson {
  left?: CharacterSpotJson | null;
  right?: CharacterSpotJson | null;
  templateBackdrop: boolean;
  templateMotion: string;
}

export interface RenderPaletteJson {
  primaryHex: string;
  secondaryHex: string;
  speakerAHex: string;
  speakerBHex: string;
  topBackdropHex: string;
  midBackdropHex: string;
  botBackdropHex: string;
  headerBadgeText?: string | null;
}

export interface RenderJobJson {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  totalFrames: number;
  seed: number;
  theme: SceneTheme;
  vfxStyle: VfxStyle;
  enableDynamicCamera: boolean;
  isSeamlessLoop: boolean;
  isComedyMode?: boolean;
  uniqueVariant?: number;
  topCategoryLabel?: string | null;
  footerLabel?: string | null;
  title: string;
  palette: RenderPaletteJson;
  hasCharacters: boolean;
  leftCharacter?: CharacterProfileJson | null;
  rightCharacter?: CharacterProfileJson | null;
  supportingCast: CharacterProfileJson[];
  turns: DialogueTurnJson[];
  memeCues?: MemeCueJson[] | null;
  sceneRuns: SceneRunJson[];
  speechEnvelope?: number[] | null;
  backdropCount: number;
  stageLayout?: StageLayoutJson | null;
}
