import { MotionPoint, POSE, VISIBLE, WorldPoint } from '../live-camera/motion';
import type { SampledBody } from './dance-track';
import type {
  CameraAngleMode,
  CharacterRole3D,
  ExternalBodyPose,
  JointPoint3D,
  PoseJoints3D,
  SceneSetting3D,
  VfxStyle3D,
} from './motion-3d-stage';

export interface RoleOption3D {
  readonly id: CharacterRole3D;
  readonly label: string;
}

export interface StageOption3D {
  readonly id: SceneSetting3D;
  readonly label: string;
}

export const ROLES_3D: readonly RoleOption3D[] = [
  { id: 'KingCrown', label: 'Royal Sufi / Maharaj (Sherwani & Pagdi)' },
  { id: 'NobleWoman', label: 'Royal Dancer (Anarkali & Lehenga)' },
  { id: 'BrainrotLog', label: 'Wooden Buddy (Viral Slapstick)' },
  { id: 'CupDancer', label: 'Cuppy Mascot (Bouncy Dancer)' },
  { id: 'CartoonTank', label: 'Cartoon Tank (KV-Mini)' },
  { id: 'ComicBobble', label: 'Bobble Comedian (MJO Style)' },
  { id: 'Warrior', label: 'Warrior Hero' },
  { id: 'SageRishi', label: 'Mystical Sage' },
  { id: 'ChildDevotee', label: 'Young Prodigy Dancer' },
  { id: 'Scholar', label: 'Streetwear Buddy' },
];

export const STAGES_3D: readonly StageOption3D[] = [
  { id: 'PalaceCourt', label: 'Samode Palace & Sheesh Mahal (Royal Courtyard)' },
  { id: 'Temple', label: 'Golden Temple Mandap' },
  { id: 'RiverGhat', label: 'Moonlit River Ghat & Diyas' },
  { id: 'SkyGauntlet', label: 'Sky Gauntlet (Floating Portals)' },
  { id: 'DoorwaySet', label: 'Doorway Hallway (Viral Loop)' },
  { id: 'TankArena', label: 'Tank Canyon Arena' },
  { id: 'ComedyStage', label: 'Spotlight Comedy Stage' },
  { id: 'ChaiStall', label: 'Desi Chai Tapri Corner' },
  { id: 'Bedroom', label: 'Desi Bedroom (Charpai & Lamp)' },
  { id: 'LivingRoom', label: 'Family Living Room (Sofa & Door)' },
  { id: 'Kitchen', label: 'Home Kitchen (Boiling Rabdi Pot)' },
  { id: 'SweetShop', label: 'Halwai Mithai Counter' },
  { id: 'ModernCity', label: 'Cyber Neon Grid' },
  { id: 'Cosmos', label: 'Cosmic Nebula Stars' },
  { id: 'Auto', label: 'Solid Studio Colour' },
];

export const CAMERA_ANGLES_3D: readonly { id: CameraAngleMode; label: string }[] = [
  { id: 'autoCut', label: 'Auto-Cut Dynamic Angles (Best Uniqueness)' },
  { id: 'front', label: 'Hero Front Center' },
  { id: 'left34', label: '3/4 Left Dynamic Angle' },
  { id: 'right34', label: '3/4 Right Dynamic Angle' },
  { id: 'lowHero', label: 'Low Hero Dramatic Angle' },
];

export const VFX_STYLES_3D: readonly { id: VfxStyle3D; label: string }[] = [
  { id: 'ComedyBurst', label: 'Comedy Sparks & Burst' },
  { id: 'CyberNeon', label: 'Cyber Neon Glow' },
  { id: 'DivineAura', label: 'Golden Aura Particles' },
  { id: 'Auto', label: 'Calm Ambient Particles' },
];

export interface PoseTrackerState {
  anchorHipX?: number;
  anchorHipY?: number;
  anchorTorso?: number;
  lastWristY?: number;
  lastSfxAtMs?: number;
  /** Picture y of the floor under the dancer (running estimate from the lowest ankle). */
  floorY?: number;
  lastT?: number;
  lastExtremities?: WorldPoint[];
  energy?: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function visiblePoint(points: readonly MotionPoint[], index: number): MotionPoint | null {
  const p = points[index];
  return p && p.v >= VISIBLE ? p : null;
}

function limbAngleZ(from: MotionPoint, to: MotionPoint): number {
  // Rig upper arm hangs along -Y (angle = 0). Vector (dx, dy) in normalized screen coords (Y down):
  // rotate around Z so arm points toward (to.x - from.x, -(to.y - from.y)).
  const dx = to.x - from.x;
  const dyUp = -(to.y - from.y);
  return Math.atan2(dx, -dyUp);
}

/**
 * Converts 33 MediaPipe body landmarks into clean 3D joint angles and centered stage offsets
 * so poorly framed videos automatically snap into crisp, expressive 3D character animation.
 */
export function posePointsToExternal3D(
  points: readonly MotionPoint[],
  state: PoseTrackerState,
  travelScale: number,
): { pose: ExternalBodyPose; kineticEnergy: number } {
  const lS = visiblePoint(points, POSE.leftShoulder);
  const rS = visiblePoint(points, POSE.rightShoulder);
  const lE = visiblePoint(points, POSE.leftElbow);
  const rE = visiblePoint(points, POSE.rightElbow);
  const lW = visiblePoint(points, POSE.leftWrist);
  const rW = visiblePoint(points, POSE.rightWrist);
  const lH = visiblePoint(points, POSE.leftHip);
  const rH = visiblePoint(points, POSE.rightHip);
  const nose = visiblePoint(points, POSE.nose);
  const lEar = visiblePoint(points, POSE.leftEar);
  const rEar = visiblePoint(points, POSE.rightEar);

  const shMid = lS && rS ? { x: (lS.x + rS.x) / 2, y: (lS.y + rS.y) / 2 } : lS ?? rS;
  const hipMid = lH && rH ? { x: (lH.x + rH.x) / 2, y: (lH.y + rH.y) / 2 } : lH ?? rH;

  let hipOffsetX = 0;
  let hipBounceY = 0;
  let torsoTiltZ = 0;
  let torsoTiltX = 0.04;

  if (shMid && hipMid) {
    const torsoH = Math.max(0.06, Math.hypot(shMid.x - hipMid.x, shMid.y - hipMid.y));
    state.anchorHipX ??= hipMid.x;
    state.anchorHipY ??= hipMid.y;
    state.anchorTorso ??= torsoH;

    hipOffsetX = clamp((hipMid.x - state.anchorHipX) * 2.2 * travelScale, -0.75, 0.75);
    hipBounceY = clamp((state.anchorHipY - hipMid.y) * 1.4 * travelScale, 0, 0.38);
    torsoTiltZ = clamp((shMid.x - hipMid.x) / torsoH * 0.65, -0.45, 0.45);
    torsoTiltX = clamp((torsoH - state.anchorTorso) * -0.8, -0.22, 0.28);
  }

  const leftShoulderZ = lS && lE ? clamp(-limbAngleZ(lS, lE), -2.4, 2.4) : 0.25;
  const rightShoulderZ = rS && rE ? clamp(-limbAngleZ(rS, rE), -2.4, 2.4) : -0.25;

  const leftElbowZ = lE && lW ? clamp(-limbAngleZ(lE, lW) - leftShoulderZ, -2.0, 2.0) : -0.4;
  const rightElbowZ = rE && rW ? clamp(-limbAngleZ(rE, rW) - rightShoulderZ, -2.0, 2.0) : 0.4;

  let headTiltZ = 0;
  if (lEar && rEar) {
    headTiltZ = clamp(Math.atan2(rEar.y - lEar.y, Math.max(0.02, Math.abs(rEar.x - lEar.x))) * 0.65, -0.4, 0.4);
  }
  let headYawY = 0;
  if (nose && shMid) {
    headYawY = clamp((nose.x - shMid.x) * 2.6, -0.55, 0.55);
  }

  const avgWristY = ((lW?.y ?? 0.5) + (rW?.y ?? 0.5)) * 0.5;
  const wristSpeed = state.lastWristY !== undefined ? Math.abs(avgWristY - state.lastWristY) * 18 : 0;
  state.lastWristY = avgWristY;
  const handsHigh = shMid ? Math.max(0, shMid.y - avgWristY) * 2.4 : 0;
  const kineticEnergy = clamp(wristSpeed * 0.65 + handsHigh * 0.45 + hipBounceY * 1.2, 0, 1);

  return {
    pose: {
      leftShoulderZ,
      leftElbowZ,
      rightShoulderZ,
      rightElbowZ,
      torsoTiltX,
      torsoTiltZ,
      headTiltZ,
      headYawY,
      hipOffsetX,
      hipBounceY,
      emotion: kineticEnergy > 0.58 ? 'surprised' : kineticEnergy > 0.28 ? 'laughing' : 'happy',
      mouthOpen: kineticEnergy > 0.5 ? 0.85 : 0.28,
    },
    kineticEnergy,
  };
}

/** Arms and torso are usable a little below "visible"; MediaPipe's estimates there are still good. */
const UPPER_VISIBLE = 0.4;
/** Legs need a clear view and must be inside the picture, or they come from the beat groove. */
const LEG_VISIBLE = 0.55;
/** Approximate rig torso length (hips to shoulders), metres, for scaling jumps. */
const RIG_TORSO = 0.5;

/**
 * Converts one smoothed, tracked body (2D + 3D world landmarks) into rig-space 3D joints for the
 * full-body retarget. The copy is screen-faithful: the dancer's own left (on the right of the
 * picture) drives the rig's screen-right bones. Mirroring is done later by the stage.
 */
export function sampleToPose3D(
  body: SampledBody,
  state: PoseTrackerState,
  travelScale: number,
  timeSec: number,
): { pose: ExternalBodyPose; kineticEnergy: number } {
  const { points, world } = body;
  const legacy = posePointsToExternal3D(points, state, travelScale);

  const joint = (index: number, minVis: number, mustBeInFrame = false): JointPoint3D | null => {
    const p = points[index];
    const w = world[index];
    if (!p || !w || p.v < minVis) return null;
    if (mustBeInFrame && (p.y > 0.995 || p.y < 0 || p.x < 0 || p.x > 1)) return null;
    return { x: w.x, y: -w.y, z: -w.z };
  };

  const joints: PoseJoints3D = {
    rShoulder: joint(POSE.leftShoulder, UPPER_VISIBLE),
    lShoulder: joint(POSE.rightShoulder, UPPER_VISIBLE),
    rElbow: joint(POSE.leftElbow, UPPER_VISIBLE),
    lElbow: joint(POSE.rightElbow, UPPER_VISIBLE),
    rWrist: joint(POSE.leftWrist, UPPER_VISIBLE),
    lWrist: joint(POSE.rightWrist, UPPER_VISIBLE),
    rHip: joint(POSE.leftHip, UPPER_VISIBLE),
    lHip: joint(POSE.rightHip, UPPER_VISIBLE),
    rKnee: joint(POSE.leftKnee, LEG_VISIBLE, true),
    lKnee: joint(POSE.rightKnee, LEG_VISIBLE, true),
    rAnkle: joint(POSE.leftAnkle, LEG_VISIBLE, true),
    lAnkle: joint(POSE.rightAnkle, LEG_VISIBLE, true),
    nose: joint(POSE.nose, UPPER_VISIBLE),
    rEar: joint(POSE.leftEar, UPPER_VISIBLE),
    lEar: joint(POSE.rightEar, UPPER_VISIBLE),
  };

  // Jumps: require BOTH visible ankles and a deliberate >18% torso rise above floor so
  // camera pans/zooms and minor landmark jitter never make standing dancers levitate ("high issue").
  let liftY = 0;
  const la = points[POSE.leftAnkle];
  const ra = points[POSE.rightAnkle];
  const visibleAnkles = [la, ra].filter((p): p is MotionPoint => !!p && p.v >= LEG_VISIBLE && p.y <= 0.995);
  const lowAnkle = visibleAnkles.reduce((m, p) => Math.max(m, p.y), -1);
  const ls = points[POSE.leftShoulder];
  const rs = points[POSE.rightShoulder];
  const lh = points[POSE.leftHip];
  const rh = points[POSE.rightHip];
  if (visibleAnkles.length === 2 && lowAnkle > 0 && ls && rs && lh && rh) {
    const torso = Math.max(0.05, (lh.y + rh.y) / 2 - (ls.y + rs.y) / 2);
    if (state.floorY === undefined || lowAnkle > state.floorY) {
      state.floorY = lowAnkle;
    } else {
      const gap = Math.abs(lowAnkle - state.floorY);
      state.floorY += (lowAnkle - state.floorY) * (gap < 0.05 ? 0.14 : 0.03);
    }
    const rise = (state.floorY - lowAnkle) / torso;
    liftY = rise > 0.18 ? clamp((rise - 0.18) * RIG_TORSO, 0, 0.45) : 0;
  }

  // Energy: how fast hands and feet move in 3D (m/s), eased so it reads as "intensity".
  const extremities = [POSE.leftWrist, POSE.rightWrist, POSE.leftAnkle, POSE.rightAnkle].map((i) => world[i]);
  let speed = 0;
  if (state.lastExtremities && state.lastT !== undefined && timeSec > state.lastT) {
    const dt = Math.min(0.25, timeSec - state.lastT);
    for (let i = 0; i < extremities.length; i++) {
      const a = extremities[i];
      const b = state.lastExtremities[i];
      if (a && b) speed += Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) / dt;
    }
    speed /= extremities.length;
  }
  state.lastExtremities = extremities;
  state.lastT = timeSec;
  const target = clamp(speed / 2.2, 0, 1);
  state.energy = (state.energy ?? 0) + (target - (state.energy ?? 0)) * (target > (state.energy ?? 0) ? 0.5 : 0.12);
  const kineticEnergy = clamp(Math.max(state.energy, liftY * 1.6), 0, 1);

  return {
    pose: {
      ...legacy.pose,
      joints,
      liftY,
      emotion: kineticEnergy > 0.62 ? 'surprised' : kineticEnergy > 0.3 ? 'laughing' : 'happy',
      mouthOpen: kineticEnergy > 0.5 ? 0.8 : 0.28,
    },
    kineticEnergy,
  };
}

/** Synthesizes a clean cartoon Boing/Pop hit straight into Web Audio destination (zero copyright risk). */
export function playComedyStinger(audio: AudioContext, dest: AudioNode, isHigh: boolean): void {
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = isHigh ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(isHigh ? 240 : 140, now);
  osc.frequency.exponentialRampToValueAtTime(isHigh ? 680 : 48, now + (isHigh ? 0.14 : 0.18));

  gain.gain.setValueAtTime(0.24, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.24);
}
