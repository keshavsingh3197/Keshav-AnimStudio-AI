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
  | 'SweetShop'
  | 'BarberShop'
  | 'Courtroom'
  | 'DoctorClinic'
  | 'Classroom'
  | 'QuizStudio'
  | 'NeighborhoodGate';

export type HeldPropKind =
  | 'none'
  | 'scissors'
  | 'comb'
  | 'cape'
  | 'towel'
  | 'sprayBottle'
  | 'teacup'
  | 'ladle'
  | 'sweetplate'
  | 'key'
  | 'phone'
  | 'gavel'
  | 'stethoscope'
  | 'syringe'
  | 'mic'
  | 'chalk'
  | 'book'
  | 'baton'
  | 'diya'
  | 'flute'
  | 'trishul'
  | 'bow'
  | 'gada'
  | 'money'
  | 'broom'
  | 'umbrella';

export type ActionKind =
  | 'none'
  | 'sleeping'
  | 'deskSleep'
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
  | 'hitReact'
  | 'cutting'
  | 'combing'
  | 'stirring'
  | 'sipping'
  | 'bangingGavel'
  | 'examining'
  | 'placingBook'
  | 'callingPhone'
  | 'holdingMic'
  | 'showingKey'
  | 'removingTowel'
  | 'spraying'
  | 'lookInMirror'
  | 'adjustingGlasses'
  | 'aarti'
  | 'playingFlute'
  | 'writingBoard'
  | 'sweeping'
  | 'adaab'
  | 'sufiSpin'
  | 'lapSubdue'
  | 'lapSubdued'
  | 'pillarBurst'
  | 'clubStrike'
  | 'serpentAttack'
  | 'elephantCharge'
  | 'fireTrial'
  | 'cliffRescue'
  | 'blessing'
  | 'lyingShroud'
  | 'corpseSnapUp'
  | 'celebrate'
  | 'brakeStop'
  | 'hazardWire'
  | 'hazardTruck'
  | 'hazardTank'
  | 'hazardPit'
  | 'hazardSnake'
  | 'hazardFood'
  | 'hazardPhone';

export type ComedyHazardMode =
  | 'none'
  | 'wireSpark'
  | 'truckRickshaw'
  | 'waterTank'
  | 'roadPit'
  | 'giantSnake'
  | 'chokeFood'
  | 'nightPhone';

export function detectComedyHazard(action?: string | null): ComedyHazardMode {
  switch (action) {
    case 'hazardWire': return 'wireSpark';
    case 'hazardTruck': return 'truckRickshaw';
    case 'hazardTank': return 'waterTank';
    case 'hazardPit': return 'roadPit';
    case 'hazardSnake': return 'giantSnake';
    case 'hazardFood': return 'chokeFood';
    case 'hazardPhone': return 'nightPhone';
    default: return 'none';
  }
}

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
  | 'confused'
  | 'smug'
  | 'scared';

export interface CharacterProfileJson {
  slot: 'Narrator' | 'Left' | 'Right';
  name: string;
  role: CharacterRole;
  robeHex?: string | null;
  hasGlasses?: boolean | null;
  attire?: 'auto' | 'turban' | 'anarkali' | null;
  shirtPattern?: 'solid' | 'colorful' | 'striped' | 'checked' | null;
  mustache?: 'none' | 'brush' | 'handlebar' | null;
  hairStyle?: 'spiky' | 'short' | 'parted' | 'bald' | 'curly' | 'ponytail' | null;
  hairHex?: string | null;
  skinHex?: string | null;
  scale?: number | null;
  defaultSpot?: string | null;
}

export interface SpotPlacementJson {
  x: number;
  y: number;
  z: number;
  rotY: number;
  pose?: 'standing' | 'sitting';
  seatHeight?: number;
}

export interface WallFixtureJson {
  kind: 'blackboard' | 'clock' | 'portraitFrame' | 'noticeBoard' | 'window' | 'door' | 'poster';
  x: number;
  y: number;
  z: number;
  rotY?: number;
  width?: number;
  height?: number;
  color?: string;
  title?: string;
}

export interface FurnitureItemJson {
  id?: string;
  kind: 'desk' | 'bench' | 'chair' | 'podium' | 'table' | 'sofa' | 'bed';
  x: number;
  y?: number;
  z: number;
  rotY?: number;
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
  seatHeight?: number;
}

export interface ScenePropJson {
  kind: 'examPaper' | 'pen' | 'book' | 'chalk' | 'duster' | 'globe' | 'bottle';
  x: number;
  y: number;
  z: number;
  rotY?: number;
  scale?: number;
  color?: string;
}

export interface SceneBlueprintJson {
  room?: {
    width?: number;
    depth?: number;
    height?: number;
    floorColor?: string;
    floorPattern?: 'tiles' | 'wood' | 'stone';
    wallColor?: string;
    wallTrimColor?: string;
    ceilingColor?: string;
    ambientIntensity?: number;
    keyLightIntensity?: number;
  };
  wallFixtures?: WallFixtureJson[];
  furniture?: FurnitureItemJson[];
  props?: ScenePropJson[];
  spots?: Record<string, SpotPlacementJson>;
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
  /** Who the line is addressed to (used for two-shots and over-the-shoulder framing). */
  listenerName?: string | null;
  text: string;
  isTitleHook: boolean;
  speakerRole?: CharacterRole | null;
  sceneBackdropCue?: string | null;
  emotion?: string | null;
  action?: ActionKind | string | null;
  listenerAction?: ActionKind | string | null;
  cameraShot?: CameraShotKind | string | null;
  stageTarget?: string | null;
  speakerProp?: HeldPropKind | string | null;
  listenerProp?: HeldPropKind | string | null;
  speakerGlasses?: string | null;
  listenerGlasses?: string | null;
  listenerEmotion?: string | null;
  sfxCue?: string | null;
  speakerSpot?: string | null;
  listenerSpot?: string | null;
  characterSpots?: Record<string, string> | null;
  /** Persistent per-character actions for characters who are not speaking (e.g. a student asleep at the desk). */
  characterActions?: Record<string, string> | null;
  speakerPose?: 'standing' | 'sitting' | null;
  listenerPose?: 'standing' | 'sitting' | null;
}

export interface SceneRunJson {
  startSeconds: number;
  endSeconds: number;
  setting: SceneSetting;
  timeOfDay: SceneTimeOfDay;
  sceneIndex: number;
  activeCharacters?: string[];
  characterEntryAt?: Record<string, number>;
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
  startFrame?: number;
  endFrame?: number;
  seed: number;
  theme: SceneTheme;
  vfxStyle: VfxStyle;
  enableDynamicCamera: boolean;
  isSeamlessLoop: boolean;
  isComedyMode?: boolean;
  uniqueVariant?: number;
  topCategoryLabel?: string | null;
  footerLabel?: string | null;
  showWatermark?: boolean;
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
  sceneBlueprint?: SceneBlueprintJson | null;
}
