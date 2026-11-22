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
  | 'DoorwaySet'
  | 'Bedroom'
  | 'LivingRoom'
  | 'Kitchen'
  | 'SweetShop';

export type VfxStyle3D = 'Auto' | 'DivineAura' | 'ComedyBurst' | 'CyberNeon' | 'CinematicDrama';
export type CameraAngleMode = 'front' | 'left34' | 'right34' | 'lowHero' | 'autoCut';
export type DanceChoreographyStyle = 'sufiKathak' | 'bhangra' | 'viralBounce';

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
  /**
   * Full 3D joints (metres, hip-centred; +X = the rig's screen-right side, +Y up, +Z toward the
   * camera). When present they drive every bone, legs included, and the 2D angles are ignored.
   */
  joints?: PoseJoints3D | null;
  /** Extra lift for jumps, metres. */
  liftY?: number;
  /** Knee bend (radians) for the groove used when the legs are out of frame. */
  grooveBend?: number;
}

export interface JointPoint3D {
  x: number;
  y: number;
  z: number;
}

/** `l*` drives the rig's screen-left (-X) bones. */
export interface PoseJoints3D {
  lShoulder: JointPoint3D | null;
  rShoulder: JointPoint3D | null;
  lElbow: JointPoint3D | null;
  rElbow: JointPoint3D | null;
  lWrist: JointPoint3D | null;
  rWrist: JointPoint3D | null;
  lHip: JointPoint3D | null;
  rHip: JointPoint3D | null;
  lKnee: JointPoint3D | null;
  rKnee: JointPoint3D | null;
  lAnkle: JointPoint3D | null;
  rAnkle: JointPoint3D | null;
  nose: JointPoint3D | null;
  lEar: JointPoint3D | null;
  rEar: JointPoint3D | null;
}

/** Where the music is: beat number and 0-1 progress to the next beat. */
export interface StageBeat {
  index: number;
  phase: number;
}

export interface MotionStageOptions {
  width: number;
  height: number;
  primaryRole: CharacterRole3D;
  secondaryRole?: CharacterRole3D | 'None' | null;
  primaryColor?: string;
  secondaryColor?: string;
  troupeCount?: number;
  troupeRole?: CharacterRole3D;
  troupeColor?: string;
  choreographyStyle?: 'auto' | DanceChoreographyStyle;
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
    beat?: StageBeat | null,
  ): void;
  dispose(): void;
}

export function createMotion3DStage(
  canvas: HTMLCanvasElement,
  opts: MotionStageOptions,
): Motion3DStageHandle;
