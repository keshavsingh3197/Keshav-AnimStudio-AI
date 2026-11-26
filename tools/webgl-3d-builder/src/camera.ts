import * as THREE from 'three';
import { EmotionKind, RenderJobJson } from './types';

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  currentPos: THREE.Vector3;
  currentLook: THREE.Vector3;
  baseFov: number;
}

export function createCameraRig(job: RenderJobJson): CameraRig {
  const aspect = job.width / job.height;
  const isPortrait = job.height > job.width;
  const baseFov = isPortrait ? 37 : 36;
  const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);

  const z = isPortrait ? 4.65 : 4.8;
  const y = isPortrait ? 1.24 : 1.05;
  const lookY = isPortrait ? 1.04 : 0.92;

  camera.position.set(0, y, z);
  camera.lookAt(0, lookY, 0);

  return {
    camera,
    currentPos: new THREE.Vector3(0, y, z),
    currentLook: new THREE.Vector3(0, lookY, 0),
    baseFov,
  };
}

export function updateCameraRig(
  rig: CameraRig,
  job: RenderJobJson,
  t: number,
  u: number,
  activeSlot: 'Left' | 'Right' | 'Narrator',
  leftX: number,
  rightX: number,
  emotion: EmotionKind,
  isTitleHook: boolean,
  cameraShot = 'auto',
  action = 'none',
  turnChanged = false,
  turnLocal = 0.5,
  speakerHeadY = 1.38,
  setting = 'Auto',
  speakerPos?: { x: number; y: number; z: number; rotY: number },
  listenerPos?: { x: number; y: number; z: number; rotY: number },
): void {
  const isPortrait = job.height > job.width;
  const isPalaceDance = setting === 'PalaceCourt';
  const defaultZ = isPalaceDance ? (isPortrait ? 5.95 : 5.45) : (isPortrait ? 4.65 : 4.8);
  const defaultY = isPalaceDance ? (isPortrait ? 1.32 : 1.18) : (isPortrait ? 1.24 : 1.05);
  const defaultLookY = isPalaceDance ? (isPortrait ? 1.04 : 0.96) : (isPortrait ? 1.04 : 0.92);

  // Only freeze camera when a locked 2D template backdrop is used WITHOUT a 3D sceneBlueprint
  if (job.stageLayout?.templateBackdrop && !job.sceneBlueprint && setting !== 'Classroom') {
    rig.camera.position.set(0, defaultY, defaultZ);
    rig.camera.lookAt(0, defaultLookY, 0);
    return;
  }

  let targetX = (leftX + rightX) * 0.45;
  let targetY = defaultY;
  let targetZ = defaultZ;
  let lookX = (leftX + rightX) * 0.48;
  let lookY = defaultLookY;
  let lookZ = 0;
  const midX = (leftX + rightX) * 0.5;

  if (!job.enableDynamicCamera || isTitleHook) {
    // Slow cinematic dolly crane-in during Title hook
    const hookZoom = isTitleHook ? Math.min(1, t / 2.6) * 0.45 : 0;
    targetZ = defaultZ - hookZoom;
    targetY = defaultY + (isTitleHook ? (1 - Math.min(1, t / 2.6)) * 0.25 : 0);
  } else if (u > 0.88) {
    // Final moral / climax graceful pull-back wide shot
    targetZ = defaultZ + 0.35;
    targetY = defaultY + 0.12;
  } else if (activeSlot === 'Left') {
    // Gentle 3D framing shift toward Left speaker while keeping partner clearly in frame
    targetX = midX * 0.72 + leftX * 0.28;
    targetZ = defaultZ * 0.92;
    targetY = defaultY + 0.03;
    lookX = midX * 0.65 + leftX * 0.35;
    lookY = defaultLookY + 0.05;
  } else if (activeSlot === 'Right') {
    // Smooth reverse shift toward Right speaker
    targetX = midX * 0.72 + rightX * 0.28;
    targetZ = defaultZ * 0.92;
    targetY = defaultY + 0.03;
    lookX = midX * 0.65 + rightX * 0.35;
    lookY = defaultLookY + 0.05;
  }

  // Tripod-steady framing: only a barely perceptible slow drift (no handheld wobble).
  // Impact shake is reserved for crash-punch / snap moments below and decays within ~0.3 s.
  const comedy = !!job.isComedyMode;
  let shakeX = Math.sin(t * 0.35) * 0.006;
  let shakeY = Math.cos(t * 0.28) * 0.004;
  let rollZ = 0;

  if (emotion === 'surprised' || emotion === 'angry') {
    const canCloseUp = comedy && cameraShot === 'auto' && !isTitleHook && activeSlot !== 'Narrator' && action !== 'cutting' && action !== 'lookInMirror';
    targetZ *= comedy ? (emotion === 'angry' && canCloseUp ? 0.66 : 0.72) : 0.93;
    if (comedy) {
      const focusX = activeSlot === 'Left' ? leftX : activeSlot === 'Right' ? rightX : midX;
      if (canCloseUp && emotion === 'angry') {
        targetX = midX * 0.40 + focusX * 0.60;
        lookX = midX * 0.25 + focusX * 0.75;
        lookY = Math.max(isPortrait ? 1.08 : 1.18, speakerHeadY * 0.94);
      } else {
        targetX = midX * 0.65 + focusX * 0.35;
        lookX = midX * 0.55 + focusX * 0.45;
        lookY = isPortrait ? 1.08 : 1.18;
      }
      targetY = isPortrait ? 1.24 : 1.25;
    }
  } else if (comedy && emotion === 'laughing') {
    targetZ *= 0.82;
  }

  const isMythicClimax = action === 'lapSubdue' || action === 'lapSubdued' || action === 'pillarBurst';
  const isTrialWide = action === 'serpentAttack' || action === 'elephantCharge' || action === 'fireTrial' || action === 'cliffRescue';
  // Final framing guard for Royal Palace Dance so tall Pagdis, Kalgi plumes, and full troupe never clip.
  if ((isPalaceDance || isTrialWide) && !isMythicClimax) {
    targetZ = Math.max(targetZ, isPortrait ? 5.65 : 5.05);
    targetY = Math.max(targetY, defaultY);
    lookY = Math.min(lookY, 1.04);
    if (isTrialWide) {
      targetX = 0;
      lookX = 0;
    }
  }

  // Situational MJO-style cinematography overrides driven by script/action cues
  const hasTemplateLock = !!job.stageLayout?.templateBackdrop;
  if (!hasTemplateLock && !isTitleHook && (!isPalaceDance && !isTrialWide || isMythicClimax)) {
    const activeX = activeSlot === 'Left' ? leftX : activeSlot === 'Right' ? rightX : (leftX + rightX) * 0.5;
    if (action === 'corpseSnapUp') {
      const punch = Math.max(0, 1 - Math.min(1, turnLocal / 0.28));
      targetX = 0;
      targetY = Math.max(isPortrait ? 1.18 : 1.06, speakerHeadY * 0.96);
      targetZ = (isPortrait ? 2.48 : 2.32) - punch * 0.24;
      lookX = 0;
      lookY = Math.max(0.88, speakerHeadY * 0.88);
      rollZ += Math.sin(t * 28) * 0.024 * punch;
      shakeX += Math.cos(t * 42) * 0.026 * punch;
      shakeY += Math.sin(t * 36) * 0.020 * punch;
    } else if (comedy && setting === 'LivingRoom' && action.startsWith('hazard')) {
      targetX = midX * 0.12;
      targetY = isPortrait ? 1.80 : 1.62;
      targetZ = isPortrait ? 5.35 : 4.25;
      lookX = midX * 0.12;
      lookY = isPortrait ? 1.18 : 1.04;
    } else if (comedy && setting === 'LivingRoom' && isPortrait && (cameraShot === 'twoShot' || cameraShot === 'wideEstablishing')) {
      targetX = midX * 0.12;
      targetY = 1.66;
      targetZ = 5.10;
      lookX = midX * 0.12;
      lookY = 1.06;
    } else if (isMythicClimax) {
      targetX = 0;
      targetY = isPortrait ? 1.16 : 1.04;
      targetZ = isPortrait ? 5.20 : 4.45;
      lookX = 0;
      lookY = isPortrait ? 1.06 : 1.06;
    } else if (cameraShot === 'closeUpSpeaker' && activeSlot !== 'Narrator') {
      const isSacredStage = setting === 'Temple' || setting === 'RiverGhat' || setting === 'PalaceCourt';
      targetX = isSacredStage ? activeX * 0.65 : activeX;
      targetY = isSacredStage ? 1.16 : Math.max(isPortrait ? 1.08 : 0.92, speakerHeadY * 0.98);
      targetZ = isSacredStage ? (isPortrait ? 3.25 : 3.15) : (isPortrait ? 2.68 : 2.55);
      lookX = isSacredStage ? activeX * 0.55 : activeX;
      lookY = isSacredStage ? 0.92 : Math.max(0.76, speakerHeadY * 0.88);
    } else if (cameraShot === 'crashPunch' && activeSlot !== 'Narrator') {
      const punch = Math.max(0, 1 - Math.min(1, turnLocal / 0.28));
      targetX = activeX;
      targetY = Math.max(isPortrait ? 1.08 : 0.92, speakerHeadY * 0.98);
      targetZ = (isPortrait ? 2.48 : 2.35) - punch * 0.28;
      lookX = activeX;
      lookY = Math.max(0.78, speakerHeadY * 0.88);
      rollZ += Math.sin(t * 28) * 0.025 * punch;
      shakeX += Math.cos(t * 42) * 0.028 * punch;
      shakeY += Math.sin(t * 36) * 0.022 * punch;
    } else if (cameraShot === 'twoShot') {
      targetX = midX;
      targetY = isPortrait ? 1.20 : 1.18;
      targetZ = isPortrait ? 3.35 : 3.05;
      lookX = midX;
      lookY = isPortrait ? 1.05 : 1.00;
    } else if (cameraShot === 'reactionZoom') {
      const focusX = activeX * 0.65 + midX * 0.35;
      targetX = focusX * 0.90;
      targetY = isPortrait ? 1.22 : 1.26;
      targetZ = isPortrait ? 2.85 : 2.45;
      lookX = focusX;
      lookY = Math.max(isPortrait ? 1.06 : 1.14, speakerHeadY * 0.94);
    } else if (cameraShot === 'wideEstablishing') {
      targetX = (leftX + rightX) * 0.25;
      targetY = isPortrait ? 1.32 : 1.44;
      targetZ = isPortrait ? 4.85 : 4.45;
      lookX = (leftX + rightX) * 0.35;
      lookY = isPortrait ? 1.02 : 0.92;
    } else if (cameraShot === 'lowDramatic') {
      targetX = activeX * 0.45;
      targetY = isPortrait ? 0.92 : 0.68;
      targetZ = isPortrait ? 2.85 : 2.95;
      lookX = activeX * 0.8;
      lookY = Math.max(1.12, speakerHeadY * 0.9);
    } else if (cameraShot === 'overShoulder' && activeSlot !== 'Narrator') {
      const oppX = activeSlot === 'Left' ? rightX : leftX;
      targetX = isPortrait ? (leftX + rightX) * 0.45 : oppX * 0.9;
      targetY = isPortrait ? 1.24 : 1.38;
      targetZ = isPortrait ? 3.25 : 2.75;
      lookX = isPortrait ? (activeX * 0.68 + oppX * 0.32) : activeX;
      lookY = Math.max(isPortrait ? 1.04 : 0.9, speakerHeadY * 0.92);
    }

    if (action === 'walking' || action === 'running') {
      targetX = activeX * 0.65;
      lookX = activeX * 0.85;
    }
  }

  if (isTitleHook && comedy && setting === 'LivingRoom' && isPortrait) {
    targetX = 0;
    targetY = 1.62;
    targetZ = 5.15;
    lookX = 0;
    lookY = 1.04;
  }

  // True 3D spatial camera framing when speakerPos is supplied (e.g. dynamic 360-degree SceneBlueprint)
  if (speakerPos) {
    const sp = speakerPos;
    const lp = listenerPos ?? { x: sp.x, y: sp.y, z: sp.z + 2.2, rotY: sp.rotY + Math.PI };
    const fwdX = Math.sin(sp.rotY);
    const fwdZ = Math.cos(sp.rotY);
    const headY = Math.max(0.85, sp.y + speakerHeadY - 0.08);

    if (cameraShot === 'closeUpSpeaker' || cameraShot === 'crashPunch' || cameraShot === 'reactionZoom') {
      const dist = cameraShot === 'crashPunch' ? 1.35 : 1.62;
      targetX = sp.x + fwdX * dist;
      targetY = headY + 0.02;
      targetZ = sp.z + fwdZ * dist;
      lookX = sp.x;
      lookY = headY - 0.04;
      lookZ = sp.z;
    } else if (cameraShot === 'lowDramatic') {
      targetX = sp.x + fwdX * 1.78 + 0.22;
      targetY = Math.max(0.62, headY - 0.62);
      targetZ = sp.z + fwdZ * 1.78;
      lookX = sp.x;
      lookY = headY + 0.04;
      lookZ = sp.z;
    } else if (cameraShot === 'overShoulder') {
      const lFwdX = Math.sin(lp.rotY);
      const lFwdZ = Math.cos(lp.rotY);
      const lRightX = Math.cos(lp.rotY);
      const lRightZ = -Math.sin(lp.rotY);
      targetX = lp.x - lFwdX * 0.92 + lRightX * 0.85;
      targetY = Math.max(1.42, lp.y + 1.46);
      targetZ = lp.z - lFwdZ * 0.92 + lRightZ * 0.85;
      lookX = sp.x * 0.85 + lp.x * 0.15;
      lookY = headY * 0.88;
      lookZ = sp.z * 0.88 + lp.z * 0.12;
    } else if (cameraShot === 'twoShot') {
      const mx = (sp.x + lp.x) * 0.5;
      const mz = (sp.z + lp.z) * 0.5;
      targetX = mx + 2.25;
      targetY = 1.48;
      targetZ = mz + 2.35;
      lookX = mx;
      lookY = 0.98;
      lookZ = mz;
    } else {
      // wideEstablishing / auto: full classroom view showing teacher + seated students
      targetX = 0.35;
      targetY = 1.85;
      targetZ = 3.55;
      lookX = -0.15;
      lookY = 1.05;
      lookZ = -1.15;
    }
  }

  let targetPos = new THREE.Vector3(targetX + shakeX, targetY + shakeY, targetZ);
  let targetLook = new THREE.Vector3(lookX, lookY, lookZ);

  // Seamless Shorts loop reset: smoothly converge to exact neutral opening framing at end of clip
  if (job.isSeamlessLoop) {
    const restPos = new THREE.Vector3(0, defaultY, defaultZ);
    const restLook = new THREE.Vector3(0, defaultLookY, 0);
    if (u > 0.86) {
      const k = Math.min(1, (u - 0.86) / 0.14);
      targetPos.lerp(restPos, k);
      targetLook.lerp(restLook, k);
      rollZ *= 1 - k;
    } else if (u < 0.06) {
      const k = 1 - u / 0.06;
      targetPos.lerp(restPos, k);
      targetLook.lerp(restLook, k);
      rollZ *= 1 - k;
    }
  }

  // Comedy smash-cut snaps cleanly on turn/scene change instead of sluggish gliding
  if (turnChanged && !hasTemplateLock && (comedy || cameraShot === 'crashPunch' || cameraShot === 'closeUpSpeaker')) {
    rig.currentPos.lerp(targetPos, 0.94);
    rig.currentLook.lerp(targetLook, 0.94);
  } else {
    const speed = comedy ? 13.0 : (cameraShot === 'wideEstablishing' ? 4.2 : 6.4);
    const alpha = 1 - Math.exp(-speed / Math.max(1, job.fps));
    rig.currentPos.lerp(targetPos, alpha);
    rig.currentLook.lerp(targetLook, alpha);
  }

  rig.camera.position.copy(rig.currentPos);
  rig.camera.lookAt(rig.currentLook);
  rig.camera.rotation.z += rollZ;
}
