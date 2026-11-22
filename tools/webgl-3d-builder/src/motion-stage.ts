import * as THREE from 'three';
import {
  CharacterRig,
  DanceChoreographyStyle,
  ExternalBodyPose,
  applyChoreographedDancePose,
  applyExternalPose,
  createCharacterRig,
  mirrorPoseJoints,
  updateCharacterRig,
} from './characters';
import { buildEnvironment, updateEnvironment, EnvironmentRig } from './environments';
import { CharacterRole, RenderJobJson, SceneSetting, VfxStyle } from './types';
import { VfxRig, createVfxRig, updateVfxRig } from './vfx';

export type CameraAngleMode = 'front' | 'left34' | 'right34' | 'lowHero' | 'autoCut';

export interface MotionStageOptions {
  width: number;
  height: number;
  primaryRole: CharacterRole;
  secondaryRole?: CharacterRole | 'None' | null;
  primaryColor?: string;
  secondaryColor?: string;
  troupeCount?: number;
  troupeRole?: CharacterRole;
  troupeColor?: string;
  choreographyStyle?: 'auto' | DanceChoreographyStyle;
  setting: SceneSetting;
  vfxStyle: VfxStyle;
  cameraAngle?: CameraAngleMode;
  customImageUrl?: string | null;
  solidBgHex?: string | null;
  seed?: number;
  dynamicZoom?: boolean;
}

/** Where the music is: beat number and 0-1 progress to the next beat. */
export interface StageBeat {
  index: number;
  phase: number;
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

/** Mirrors a pose left/right: limbs, lean, head turn and travel together. */
function mirrorPose(p: ExternalBodyPose): ExternalBodyPose {
  return {
    ...p,
    leftShoulderZ: -p.rightShoulderZ,
    leftElbowZ: -p.rightElbowZ,
    rightShoulderZ: -p.leftShoulderZ,
    rightElbowZ: -p.leftElbowZ,
    torsoTiltZ: -p.torsoTiltZ,
    headTiltZ: -p.headTiltZ,
    headYawY: -p.headYawY,
    hipOffsetX: -p.hipOffsetX,
    joints: p.joints ? mirrorPoseJoints(p.joints) : p.joints,
  };
}

/** A knee dip on every beat, deepest right on it (used when the legs are out of frame). */
function grooveFor(beat: StageBeat | null | undefined, timeSec: number, energy: number): number {
  const depth = 0.18 + 0.32 * Math.min(1, energy * 1.4);
  if (beat) return depth * Math.pow(1 - beat.phase, 2.2);
  return depth * 0.5 * (1 + Math.cos(timeSec * Math.PI * 4));
}

function buildSyntheticJob(opts: MotionStageOptions): RenderJobJson {
  return {
    width: opts.width,
    height: opts.height,
    fps: 30,
    durationSeconds: 60,
    totalFrames: 1800,
    seed: opts.seed ?? 42,
    theme: 'ComedyStage3D',
    vfxStyle: opts.vfxStyle,
    enableDynamicCamera: opts.dynamicZoom !== false,
    isSeamlessLoop: false,
    isComedyMode: true,
    uniqueVariant: opts.seed ?? 42,
    title: 'Motion Remix',
    palette: {
      primaryHex: opts.primaryColor || '#F97316',
      secondaryHex: opts.secondaryColor || '#38BDF8',
      speakerAHex: opts.primaryColor || '#F97316',
      speakerBHex: opts.secondaryColor || '#38BDF8',
      topBackdropHex: '#12182b',
      midBackdropHex: '#2c1e4a',
      botBackdropHex: '#0b0f1e',
    },
    hasCharacters: true,
    supportingCast: [],
    turns: [],
    sceneRuns: [],
    backdropCount: 0,
  };
}

export function createMotion3DStage(
  canvas: HTMLCanvasElement,
  opts: MotionStageOptions,
): Motion3DStageHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(opts.width, opts.height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const job = buildSyntheticJob(opts);
  const setting: SceneSetting = opts.setting === 'Auto' ? 'ComedyStage' : opts.setting;
  const env: EnvironmentRig = buildEnvironment(scene, job, setting, 'Day', []);

  // Optional custom image or solid cyclorama override
  let customBackdropPlane: THREE.Mesh | null = null;
  let customTexture: THREE.Texture | null = null;
  if (opts.customImageUrl) {
    env.group.clear();
    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.ShadowMaterial({ opacity: 0.42 }),
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.receiveShadow = true;
    env.group.add(shadowFloor);

    const loader = new THREE.TextureLoader();
    customTexture = loader.load(opts.customImageUrl);
    customTexture.colorSpace = THREE.SRGBColorSpace;
    const aspect = opts.width / Math.max(1, opts.height);
    const planeH = 7.4;
    customBackdropPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeH * aspect, planeH),
      new THREE.MeshBasicMaterial({ map: customTexture, depthWrite: false }),
    );
    customBackdropPlane.position.set(0, 1.35, -2.6);
    env.group.add(customBackdropPlane);
  } else if (opts.setting === 'Auto' && opts.solidBgHex) {
    scene.background = new THREE.Color(opts.solidBgHex);
    scene.fog = null;
  }

  const vfx: VfxRig = createVfxRig(
    scene,
    setting,
    opts.vfxStyle,
    job.palette.primaryHex,
    job.palette.secondaryHex,
    job.seed,
  );

  const hasPartner = !!opts.secondaryRole && opts.secondaryRole !== 'None';
  const leftX = hasPartner ? -0.78 : 0;
  const rightX = 0.78;

  const rigA: CharacterRig = createCharacterRig(
    { slot: 'Left', name: 'Lead', role: opts.primaryRole, robeHex: opts.primaryColor || null },
    job.palette.primaryHex,
    setting,
    hasPartner ? 1 : 0,
    0.0,
  );
  rigA.root.position.set(leftX, 0, 0.14);
  if (!hasPartner) rigA.root.rotation.y = 0;
  scene.add(rigA.root);

  const rigB: CharacterRig | null = hasPartner && opts.secondaryRole && opts.secondaryRole !== 'None'
    ? createCharacterRig(
        { slot: 'Right', name: 'Partner', role: opts.secondaryRole, robeHex: opts.secondaryColor || null },
        job.palette.secondaryHex,
        setting,
        -1,
        1.7,
      )
    : null;
  if (rigB) {
    rigB.root.position.set(rightX, 0, 0.02);
    scene.add(rigB.root);
  }

  // Optional synchronized background troupe (symmetrical curved Darbar / courtyard formation)
  const troupeTotal = Math.max(0, Math.min(6, Math.round(opts.troupeCount ?? 0)));
  const troupeRigs: { rig: CharacterRig; side: number; baseRotY: number; phaseOffset: number }[] = [];
  if (troupeTotal > 0) {
    const tRole: CharacterRole = opts.troupeRole ?? (setting === 'PalaceCourt' ? 'NobleWoman' : opts.primaryRole);
    const tColor = opts.troupeColor || opts.secondaryColor || '#7F1D1D';
    for (let i = 0; i < troupeTotal; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const rank = Math.floor(i / 2);
      const tRig = createCharacterRig(
        { slot: side < 0 ? 'Left' : 'Right', name: `Dancer${i + 1}`, role: tRole, robeHex: tColor },
        tColor,
        setting,
        side < 0 ? 1 : -1,
        (i + 1) * 0.45,
      );
      const tx = side * (1.68 + rank * 0.68);
      const tz = -0.78 - rank * 0.44;
      const rotY = side * -0.18;
      tRig.root.position.set(tx, 0, tz);
      tRig.root.rotation.y = rotY;
      tRig.root.scale.setScalar(0.93);
      scene.add(tRig.root);
      troupeRigs.push({ rig: tRig, side, baseRotY: rotY, phaseOffset: rank * 0.12 });
    }
  }

  const resolvedChoreo: DanceChoreographyStyle = opts.choreographyStyle && opts.choreographyStyle !== 'auto'
    ? opts.choreographyStyle
    : setting === 'PalaceCourt' || setting === 'Temple' || setting === 'RiverGhat'
      || opts.primaryRole === 'NobleWoman' || opts.primaryRole === 'KingCrown'
      ? 'sufiKathak'
      : 'viralBounce';

  const maxTopY = Math.max(rigA.topY, rigB?.topY ?? 0);
  const fitLookY = Math.max(0.66, Math.min(1.08, maxTopY * 0.50));
  const fitBaseZ = (opts.height > opts.width ? 5.65 : 4.25)
    + (troupeRigs.length > 0 ? (opts.height > opts.width ? 1.1 : 1.45) : 0);

  const isPortrait = opts.height > opts.width;
  const camera = new THREE.PerspectiveCamera(
    isPortrait ? 40 : 37,
    opts.width / Math.max(1, opts.height),
    0.1,
    100,
  );
  const currentPos = new THREE.Vector3(0, fitLookY + 0.24, fitBaseZ);
  const currentLook = new THREE.Vector3(0, fitLookY, 0);
  camera.position.copy(currentPos);
  camera.lookAt(currentLook);
  let lastCutKey = Number.NaN;

  return {
    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    },

    render(timeSec, poses, kineticEnergy, mirror, beat) {
      updateEnvironment(env, timeSec, (timeSec % 60) / 60, 0, 0.5, null);
      // Particles and expressions pulse with the music as well as with the dancer.
      if (beat) kineticEnergy = Math.max(kineticEnergy, 0.36 * Math.pow(1 - beat.phase, 2));
      const vfxEmotion = kineticEnergy > 0.55 ? 'surprised' : kineticEnergy > 0.25 ? 'laughing' : 'happy';
      updateVfxRig(
        vfx,
        timeSec,
        (timeSec % 60) / 60,
        hasPartner ? 'Left' : 'Narrator',
        leftX,
        rightX,
        vfxEmotion,
        0.5,
        job.palette.primaryHex,
        job.palette.secondaryHex,
      );

      // Keep custom uploaded image subtly breathing so video motion stays dynamic
      if (customBackdropPlane) {
        const s = 1.03 + 0.03 * Math.sin(timeSec * 0.45);
        customBackdropPlane.scale.setScalar(s);
      }

      const groove = grooveFor(beat, timeSec, kineticEnergy);
      const stagePose = (p: ExternalBodyPose, scale: number): ExternalBodyPose => ({
        ...p,
        hipOffsetX: p.hipOffsetX * scale,
        grooveBend: p.grooveBend ?? groove,
      });

      const p0 = poses[0] ? stagePose(mirror ? mirrorPose(poses[0]) : poses[0], 0.45) : null;
      const beatPhase = beat?.phase ?? 0;
      if (p0) {
        applyExternalPose(rigA, p0, timeSec);
        rigA.root.rotation.y = hasPartner ? 0.2 : 0;
      } else {
        // Hybrid Choreography Mode: when driving video lacks full-body tracking (or Audio-only mode),
        // drive fluent beat-synced Sufi/Kathak/Bhangra/Freestyle choreography with grounded footwork!
        applyChoreographedDancePose(rigA, timeSec, resolvedChoreo, beatPhase, false, 0, kineticEnergy);
        rigA.root.rotation.y = hasPartner ? 0.18 : 0;
      }

      if (rigB) {
        const p1 = poses[1] ? stagePose(mirror ? mirrorPose(poses[1]) : poses[1], 0.45) : null;
        if (p1) {
          applyExternalPose(rigB, p1, timeSec);
        } else if (p0) {
          // Solo video, duo cast: the partner dances the lead's moves as a mirror image.
          const twin = mirrorPose(p0);
          applyExternalPose(
            rigB,
            {
              ...twin,
              hipOffsetX: twin.hipOffsetX * 0.55,
              emotion: kineticEnergy > 0.45 ? 'laughing' : 'happy',
              mouthOpen: kineticEnergy > 0.4 ? 0.55 : 0.2,
            },
            timeSec,
          );
        } else {
          applyChoreographedDancePose(rigB, timeSec, resolvedChoreo, beatPhase, true, 0.14, kineticEnergy);
        }
        rigB.root.rotation.y = -0.18;
      }

      for (const member of troupeRigs) {
        if (p0 && poses.length > 0 && resolvedChoreo === 'viralBounce') {
          const synced = member.side > 0 ? mirrorPose(p0) : p0;
          applyExternalPose(
            member.rig,
            { ...synced, hipOffsetX: synced.hipOffsetX * 0.35, liftY: 0 },
            timeSec + member.phaseOffset,
          );
        } else {
          applyChoreographedDancePose(
            member.rig,
            timeSec,
            resolvedChoreo,
            beatPhase,
            member.side > 0,
            member.phaseOffset,
            kineticEnergy,
          );
        }
        member.rig.root.rotation.y = member.baseRotY;
      }

      // Camera: cut to a new angle on every bar (4 beats) when the beat is known, punch in on
      // each beat, and adapt framing height cleanly to the cast height + troupe width.
      const baseZ = fitBaseZ;
      let camX = 0;
      let camY = fitLookY + 0.24;
      let camZ = baseZ;
      let lookY = fitLookY;

      let effectiveAngle = opts.cameraAngle ?? 'autoCut';
      let cutKey = 0;
      if (effectiveAngle === 'autoCut') {
        cutKey = beat ? Math.floor(beat.index / 4) : Math.floor(timeSec / 2.6);
        effectiveAngle = (['front', 'left34', 'right34', 'lowHero'] as const)[((cutKey % 4) + 4) % 4];
      }

      if (effectiveAngle === 'left34') {
        camX = -1.75;
        camY = fitLookY + 0.36;
        camZ = baseZ * 0.92;
      } else if (effectiveAngle === 'right34') {
        camX = 1.75;
        camY = fitLookY + 0.36;
        camZ = baseZ * 0.92;
      } else if (effectiveAngle === 'lowHero') {
        camX = 0.25;
        camY = Math.max(0.55, fitLookY - 0.18);
        camZ = baseZ * 0.88;
        lookY = fitLookY + 0.14;
      }

      const rawFollow = hasPartner ? 0 : rigA.root.position.x + rigA.bodyPivot.position.x * 0.7;
      const followX = troupeRigs.length > 0 ? rawFollow * 0.4 : rawFollow;
      camX += followX;

      if (opts.dynamicZoom !== false) {
        camZ -= Math.min(0.75, kineticEnergy * 0.85);
        if (beat) camZ -= 0.22 * Math.pow(1 - beat.phase, 3);
        camX += Math.sin(timeSec * 1.1) * 0.10;
      }

      const hardCut = cutKey !== lastCutKey;
      lastCutKey = cutKey;
      const alpha = hardCut ? 1 : 0.18;
      currentPos.lerp(new THREE.Vector3(camX, camY, camZ), alpha);
      currentLook.lerp(new THREE.Vector3(followX, lookY, 0), alpha);
      camera.position.copy(currentPos);
      camera.lookAt(currentLook);

      renderer.render(scene, camera);
    },

    dispose() {
      customTexture?.dispose();
      renderer.dispose();
    },
  };
}
