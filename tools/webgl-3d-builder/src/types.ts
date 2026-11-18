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
  | 'DoorwaySet';

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
  sceneRuns: SceneRunJson[];
  speechEnvelope?: number[] | null;
  backdropCount: number;
  stageLayout?: StageLayoutJson | null;
}
