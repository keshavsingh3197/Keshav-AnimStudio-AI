export type CharacterRole3D =
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

export type SceneSetting3D =
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

export type VfxStyle3D = 'Auto' | 'DivineAura' | 'ComedyBurst' | 'CyberNeon' | 'CinematicDrama';
export type CameraAngleMode = 'front' | 'left34' | 'right34' | 'lowHero' | 'autoCut';

export interface ExternalBodyPose {
  leftShoulderZ: number;
  leftElbowZ: number;
  rightShoulderZ: number;
  rightElbowZ: number;
  torsoTiltX: number;
  torsoTiltZ: number;
  headTiltZ: number;
  headYawY: number;
  hipOffsetX: number;
  hipBounceY: number;
  emotion?: string;
  mouthOpen?: number;
}

export interface MotionStageOptions {
  width: number;
  height: number;
  primaryRole: CharacterRole3D;
  secondaryRole?: CharacterRole3D | 'None' | null;
  primaryColor?: string;
  secondaryColor?: string;
  setting: SceneSetting3D;
  vfxStyle: VfxStyle3D;
  cameraAngle?: CameraAngleMode;
  customImageUrl?: string | null;
  solidBgHex?: string | null;
  seed?: number;
  dynamicZoom?: boolean;
}

export interface Motion3DStageHandle {
  resize(width: number, height: number): void;
  render(
    timeSec: number,
    poses: readonly ExternalBodyPose[],
    kineticEnergy: number,
    mirror: boolean,
  ): void;
  dispose(): void;
}

export function createMotion3DStage(
  canvas: HTMLCanvasElement,
  opts: MotionStageOptions,
): Motion3DStageHandle;
