import * as THREE from 'three';
import {
  CharacterRig,
  ExternalBodyPose,
  applyExternalPose,
  createCharacterRig,
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
  setting: SceneSetting;
  vfxStyle: VfxStyle;
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
  const leftX = hasPartner ? -0.82 : 0;
  const rightX = 0.82;

  const rigA: CharacterRig = createCharacterRig(
    { slot: 'Left', name: 'Lead', role: opts.primaryRole, robeHex: opts.primaryColor || null },
    job.palette.primaryHex,
    setting,
    hasPartner ? 1 : 0,
    0.0,
  );
  rigA.root.position.set(leftX, 0, 0);
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
    rigB.root.position.set(rightX, 0, -0.15);
    scene.add(rigB.root);
  }

  const isPortrait = opts.height > opts.width;
  const camera = new THREE.PerspectiveCamera(
    isPortrait ? 40 : 37,
    opts.width / Math.max(1, opts.height),
    0.1,
    100,
  );
  const currentPos = new THREE.Vector3(0, 1.18, isPortrait ? 5.6 : 4.2);
  const currentLook = new THREE.Vector3(0, isPortrait ? 0.88 : 0.96, 0);
  camera.position.copy(currentPos);
  camera.lookAt(currentLook);

  return {
    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    },

    render(timeSec, poses, kineticEnergy, mirror) {
      updateEnvironment(env, timeSec, (timeSec % 60) / 60, 0, 0.5, null);
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

      const flip = mirror ? -1 : 1;
      const p0 = poses[0];
      if (p0) {
        const mirroredPose: ExternalBodyPose = mirror
          ? {
              ...p0,
              leftShoulderZ: -p0.rightShoulderZ,
              leftElbowZ: -p0.rightElbowZ,
              rightShoulderZ: -p0.leftShoulderZ,
              rightElbowZ: -p0.leftElbowZ,
              torsoTiltZ: -p0.torsoTiltZ,
              headTiltZ: -p0.headTiltZ,
              headYawY: -p0.headYawY,
              hipOffsetX: p0.hipOffsetX * flip * 0.45,
            }
          : { ...p0, hipOffsetX: p0.hipOffsetX * 0.45 };
        applyExternalPose(rigA, mirroredPose, timeSec);
        rigA.root.rotation.y = hasPartner ? 0.35 : 0;
      } else {
        updateCharacterRig(rigA, timeSec, false, 0, 'happy', false);
      }

      if (rigB) {
        const p1 = poses[1];
        if (p1) {
          applyExternalPose(rigB, { ...p1, hipOffsetX: p1.hipOffsetX * 0.45 }, timeSec);
        } else if (p0) {
          // Partner mirrors primary dancer's rhythm playfully for automatic solo->duo upgrade!
          applyExternalPose(
            rigB,
            {
              leftShoulderZ: -p0.rightShoulderZ * 0.9,
              leftElbowZ: -p0.rightElbowZ * 0.9,
              rightShoulderZ: -p0.leftShoulderZ * 0.9,
              rightElbowZ: -p0.leftElbowZ * 0.9,
              torsoTiltX: p0.torsoTiltX,
              torsoTiltZ: -p0.torsoTiltZ,
              headTiltZ: -p0.headTiltZ,
              headYawY: -0.25,
              hipOffsetX: -p0.hipOffsetX * 0.25,
              hipBounceY: p0.hipBounceY,
              emotion: kineticEnergy > 0.45 ? 'laughing' : 'happy',
              mouthOpen: kineticEnergy > 0.4 ? 0.55 : 0.2,
            },
            timeSec,
          );
        } else {
          updateCharacterRig(rigB, timeSec, false, 0, 'laughing', false);
        }
      }

      // Dynamic camera angle + kinetic smash-zoom for unmistakable remix uniqueness
      const baseZ = isPortrait ? 5.65 : 4.25;
      let camX = 0;
      let camY = 1.18;
      let camZ = baseZ;
      let lookY = isPortrait ? 0.88 : 0.96;

      let effectiveAngle = opts.cameraAngle ?? 'autoCut';
      if (effectiveAngle === 'autoCut') {
        const cutIndex = Math.floor(timeSec / 2.6) % 4;
        effectiveAngle = (['front', 'left34', 'right34', 'lowHero'] as const)[cutIndex];
      }

      if (effectiveAngle === 'left34') {
        camX = -1.75;
        camY = 1.32;
        camZ = baseZ * 0.92;
      } else if (effectiveAngle === 'right34') {
        camX = 1.75;
        camY = 1.32;
        camZ = baseZ * 0.92;
      } else if (effectiveAngle === 'lowHero') {
        camX = 0.25;
        camY = 0.72;
        camZ = baseZ * 0.86;
        lookY = 1.06;
      }

      if (opts.dynamicZoom !== false) {
        camZ -= Math.min(0.95, kineticEnergy * 1.1);
        camX += Math.sin(timeSec * 1.3) * 0.14;
      }

      const alpha = 0.16;
      currentPos.lerp(new THREE.Vector3(camX, camY, camZ), alpha);
      currentLook.lerp(new THREE.Vector3(0, lookY, 0), alpha);
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
