import * as THREE from 'three';
import { CharacterRig, createCharacterRig, updateCharacterRig } from './characters';
import { createCameraRig, updateCameraRig } from './camera';
import { buildEnvironment, EnvironmentRig, updateEnvironment } from './environments';
import { createVfxRig, updateVfxRig, VfxRig } from './vfx';
import { DialogueTurnJson, EmotionKind, RenderJobJson, SceneRunJson, SceneSetting, SceneTimeOfDay } from './types';

function normalizeEmotion(raw?: string | null): EmotionKind {
  const s = (raw ?? 'calm').trim().toLowerCase();
  if (s === 'laugh' || s === 'laughing' || s === 'excited') return 'laughing';
  if (s === 'surprised' || s === 'shocked' || s === 'gasp') return 'surprised';
  if (s === 'angry' || s === 'shouting' || s === 'determined') return 'angry';
  if (s === 'sad' || s === 'worried' || s === 'scared') return 'sad';
  if (s === 'happy' || s === 'loving' || s === 'hopeful' || s === 'relieved') return 'happy';
  if (s === 'proud' || s === 'dramatic') return 'proud';
  if (s === 'confused' || s === 'shy') return 'confused';
  return 'calm';
}

function defaultSettingForTheme(theme: RenderJobJson['theme']): SceneSetting {
  switch (theme) {
    case 'CosmosSacred3D':
      return 'Cosmos';
    case 'HistoryChronicle3D':
      return 'Archive';
    case 'NeonCyberGrid3D':
      return 'ModernCity';
    case 'SereneNatureGlow':
      return 'ForestAshram';
    case 'ComedyStage3D':
      return 'ComedyStage';
    default:
      return 'Temple';
  }
}

function resolveSceneAtTime(job: RenderJobJson, t: number): {
  setting: SceneSetting;
  timeOfDay: SceneTimeOfDay;
  sceneIndex: number;
  localProgress: number;
} {
  const runs: SceneRunJson[] = job.sceneRuns ?? [];
  if (runs.length === 0) {
    const u = Math.max(0, Math.min(1, t / Math.max(1, job.durationSeconds)));
    let setting = defaultSettingForTheme(job.theme);
    if (job.hasCharacters && job.turns.length >= 5 && job.theme === 'VedicTempleSunrise3D') {
      setting = u < 0.34 ? 'Temple' : u < 0.68 ? 'ForestAshram' : 'Cosmos';
    }
    return { setting, timeOfDay: 'Dawn', sceneIndex: 0, localProgress: u };
  }

  let idx = 0;
  while (idx + 1 < runs.length && t >= runs[idx + 1].startSeconds) idx++;
  const run = runs[idx];
  const end = run.endSeconds > 0 ? run.endSeconds : job.durationSeconds;
  const localProgress = Math.max(0, Math.min(1, (t - run.startSeconds) / Math.max(0.5, end - run.startSeconds)));
  const setting = run.setting === 'Auto' ? defaultSettingForTheme(job.theme) : run.setting;
  return {
    setting,
    timeOfDay: run.timeOfDay === 'Auto' ? 'Dawn' : run.timeOfDay,
    sceneIndex: Math.max(0, run.sceneIndex),
    localProgress,
  };
}

async function loadBackdrops(job: RenderJobJson): Promise<THREE.DataTexture[]> {
  const list: THREE.DataTexture[] = [];
  for (let i = 0; i < job.backdropCount; i++) {
    const resp = await fetch(`/backdrop/${i}.rgba`);
    if (!resp.ok) continue;
    const buf = new Uint8Array(await resp.arrayBuffer());
    if (buf.byteLength !== job.width * job.height * 4) continue;
    const tex = new THREE.DataTexture(buf, job.width, job.height, THREE.RGBAFormat);
    tex.flipY = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    list.push(tex);
  }
  return list;
}

function getSpeechLevel(job: RenderJobJson, frameIndex: number): number {
  const env = job.speechEnvelope;
  if (!env || env.length === 0) return 0.35;
  const idx = Math.max(0, Math.min(env.length - 1, frameIndex));
  return env[idx] ?? 0;
}

function activeTurnAt(job: RenderJobJson, t: number): DialogueTurnJson | undefined {
  return job.turns.find((turn) => !turn.isTitleHook && t >= turn.startSeconds && t <= turn.endSeconds);
}

function stagePositionFromNormalized(
  spot: { x: number; y: number; scale: number },
  isPortrait: boolean,
): { x: number; y: number; scale: number } {
  const xSpan = isPortrait ? 1.55 : 2.55;
  const x = (spot.x - 0.5) * 2 * xSpan;
  const y = Math.max(0, (0.72 - spot.y) * 2.2);
  return { x, y, scale: Math.max(0.5, Math.min(1.8, spot.scale || 1)) };
}

async function run(): Promise<void> {
  try {
    const resp = await fetch('/job.json');
    if (!resp.ok) throw new Error(`Failed to load /job.json: ${resp.status}`);
    const job = (await resp.json()) as RenderJobJson;

    const canvas = document.getElementById('stage') as HTMLCanvasElement;
    canvas.width = job.width;
    canvas.height = job.height;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(job.width, job.height, false);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const backdrops = await loadBackdrops(job);
    const gl = renderer.getContext();
    const frameBytes = job.width * job.height * 4;
    const pixelBuf = new Uint8Array(frameBytes);

    const isPortrait = job.height > job.width;
    const camRig = createCameraRig(job);

    let currentSetting: SceneSetting | null = null;
    let currentTimeOfDay: SceneTimeOfDay | null = null;
    let scene = new THREE.Scene();
    let env: EnvironmentRig | null = null;
    let vfx: VfxRig | null = null;
    let leftRig: CharacterRig | null = null;
    let rightRig: CharacterRig | null = null;
    let supportingRigs: CharacterRig[] = [];

    const defaultLeftX = isPortrait ? -0.60 : -1.05;
    const defaultRightX = isPortrait ? 0.60 : 1.05;
    const stageY = 0;

    const rebuildStage = (setting: SceneSetting, timeOfDay: SceneTimeOfDay) => {
      const nextScene = new THREE.Scene();
      const nextEnv = buildEnvironment(nextScene, job, setting, timeOfDay, backdrops);
      const nextVfx = createVfxRig(nextScene, setting, job.vfxStyle, job.palette.primaryHex, job.palette.secondaryHex, job.seed);

      let nextLeft: CharacterRig | null = null;
      let nextRight: CharacterRig | null = null;
      let nextSupporting: CharacterRig[] = [];

      if (job.hasCharacters && job.leftCharacter && job.rightCharacter) {
        const lSpot = job.stageLayout?.left;
        const rSpot = job.stageLayout?.right;
        const lp = lSpot ? stagePositionFromNormalized(lSpot, isPortrait) : { x: defaultLeftX, y: stageY, scale: 1 };
        const rp = rSpot ? stagePositionFromNormalized(rSpot, isPortrait) : { x: defaultRightX, y: stageY, scale: 1 };

        const leftFacesRight = lp.x <= rp.x ? 1 : -1;
        nextLeft = createCharacterRig(job.leftCharacter, job.palette.speakerAHex, setting, leftFacesRight, 0.0);
        nextLeft.root.position.set(lp.x, lp.y, 0.12);
        nextLeft.root.scale.setScalar(lp.scale);
        nextScene.add(nextLeft.root);

        nextRight = createCharacterRig(job.rightCharacter, job.palette.speakerBHex, setting, -leftFacesRight, 1.7);
        nextRight.root.position.set(rp.x, rp.y, 0.12);
        nextRight.root.scale.setScalar(rp.scale);
        nextScene.add(nextRight.root);

        const supSlots = job.supportingCast.length === 1 ? [0] : job.supportingCast.length === 2 ? [-0.48, 0.48] : [0, -0.65, 0.65];
        nextSupporting = job.supportingCast.slice(0, 3).map((sup, i) => {
          const rig = createCharacterRig(sup, job.palette.secondaryHex, setting, supSlots[i] <= 0 ? 1 : -1, 3.1 + i * 1.4);
          rig.root.position.set(supSlots[i], stageY + 0.05, -0.82);
          rig.root.scale.setScalar(0.72);
          nextScene.add(rig.root);
          return rig;
        });
      }

      scene = nextScene;
      env = nextEnv;
      vfx = nextVfx;
      leftRig = nextLeft;
      rightRig = nextRight;
      supportingRigs = nextSupporting;
      currentSetting = setting;
      currentTimeOfDay = timeOfDay;
    };

    let prevTurnIdx = -1;
    const totalFrames = Math.max(1, job.totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      const t = i / job.fps;
      const u = Math.max(0, Math.min(1, t / Math.max(1, job.durationSeconds)));
      const sceneMoment = resolveSceneAtTime(job, t);

      if (sceneMoment.setting !== currentSetting || sceneMoment.timeOfDay !== currentTimeOfDay) {
        rebuildStage(sceneMoment.setting, sceneMoment.timeOfDay);
      }

      const activeTurn = activeTurnAt(job, t);
      const isTitleHook = !activeTurn && job.turns.some((turn) => turn.isTitleHook && t >= turn.startSeconds && t <= turn.endSeconds);
      const activeTurnIdx = activeTurn ? activeTurn.index : -1;
      const turnChanged = activeTurnIdx !== prevTurnIdx;
      prevTurnIdx = activeTurnIdx;

      const speechLevel = getSpeechLevel(job, i);
      const emotion = normalizeEmotion(activeTurn?.emotion);
      const speakerAction = (activeTurn?.action || 'none') as string;
      const listenerAction = (activeTurn?.listenerAction || 'none') as string;
      const cameraShot = (activeTurn?.cameraShot || 'auto') as string;
      const stageTarget = (activeTurn?.stageTarget || 'default') as string;
      const turnDur = activeTurn ? Math.max(0.2, activeTurn.endSeconds - activeTurn.startSeconds) : 1;
      const turnLocal = activeTurn ? Math.max(0, Math.min(1, (t - activeTurn.startSeconds) / turnDur)) : 0;

      const supIdx = activeTurn
        ? supportingRigs.findIndex((r) => r.name.toLowerCase() === activeTurn.speakerName.toLowerCase())
        : -1;
      const leftSpeaking = supIdx < 0 && activeTurn?.slot === 'Left';
      const rightSpeaking = supIdx < 0 && activeTurn?.slot === 'Right';
      const activeSlot: 'Left' | 'Right' | 'Narrator' = leftSpeaking ? 'Left' : rightSpeaking ? 'Right' : 'Narrator';

      const currentLeft = leftRig as CharacterRig | null;
      const currentRight = rightRig as CharacterRig | null;

      const leftAction = leftSpeaking ? speakerAction : rightSpeaking ? listenerAction : 'none';
      const rightAction = rightSpeaking ? speakerAction : leftSpeaking ? listenerAction : 'none';

      // Dynamic internal 3D stage blocking: characters lie on bed, sit on sofa, approach counter, or walk in from door!
      const resolveSlotPose = (
        slot: 'Left' | 'Right',
        act: string,
        isSpeaker: boolean,
        baseX: number,
        baseRotY: number,
      ): { x: number; y: number; z: number; rotY: number } => {
        const baseY = stageY;
        if (job.stageLayout?.templateBackdrop) {
          return { x: baseX, y: baseY, z: 0.12, rotY: baseRotY };
        }
        const spots = env?.spots ?? {};
        const tgt = isSpeaker ? stageTarget : 'default';

        if ((act === 'sleeping' || (tgt === 'bed' && (act === 'wakingUp' || act === 'sitting'))) && spots.bed) {
          return { x: spots.bed.x, y: spots.bed.y, z: spots.bed.z, rotY: spots.bed.rotY ?? baseRotY };
        }
        if ((act === 'sitting' || tgt === 'sofa') && spots.sofa) {
          return { x: spots.sofa.x, y: spots.sofa.y, z: spots.sofa.z, rotY: spots.sofa.rotY ?? baseRotY };
        }
        if ((tgt === 'counter' || act === 'eating') && spots.counter) {
          const offset = isSpeaker ? 0 : (slot === 'Left' ? -0.58 : 0.58);
          return { x: spots.counter.x + offset, y: spots.counter.y, z: spots.counter.z, rotY: spots.counter.rotY ?? baseRotY };
        }
        if (act === 'walking' || act === 'running') {
          const walkProgress = turnLocal < 0.85 ? Math.min(1, turnLocal / 0.85) : 1;
          const eased = walkProgress * walkProgress * (3 - 2 * walkProgress);
          const startX = tgt === 'door' && spots.door ? spots.door.x : baseX * 1.45;
          const startZ = tgt === 'door' && spots.door ? spots.door.z : -0.35;
          const endX = tgt === 'center' ? baseX * 0.42 : baseX;
          const endZ = 0.28;
          const x = startX + (endX - startX) * eased;
          const z = startZ + (endZ - startZ) * eased;
          const dx = endX - startX;
          const moveYaw = Math.abs(dx) > 0.05 ? Math.atan2(dx, endZ - startZ) * 0.65 : baseRotY;
          return { x, y: baseY, z, rotY: moveYaw };
        }
        if (tgt === 'center' || (isSpeaker && (act === 'pointing' || cameraShot === 'crashPunch'))) {
          return { x: baseX * 0.72, y: baseY, z: 0.24, rotY: baseRotY * 0.7 };
        }
        return { x: baseX, y: baseY, z: 0.12, rotY: baseRotY };
      };

      const posBlend = 1 - Math.exp(-8.5 / Math.max(1, job.fps));
      if (currentLeft && !job.stageLayout?.templateBackdrop) {
        const target = resolveSlotPose('Left', leftAction, leftSpeaking, defaultLeftX, 0.42);
        const snapL = turnChanged && (leftAction === 'sleeping' || leftAction === 'sitting') ? 1 : posBlend;
        currentLeft.root.position.x += (target.x - currentLeft.root.position.x) * snapL;
        currentLeft.root.position.y += (target.y - currentLeft.root.position.y) * snapL;
        currentLeft.root.position.z += (target.z - currentLeft.root.position.z) * snapL;
        currentLeft.root.rotation.y += (target.rotY - currentLeft.root.rotation.y) * snapL;
      }
      if (currentRight && !job.stageLayout?.templateBackdrop) {
        const target = resolveSlotPose('Right', rightAction, rightSpeaking, defaultRightX, -0.42);
        const snapR = turnChanged && (rightAction === 'sleeping' || rightAction === 'sitting') ? 1 : posBlend;
        currentRight.root.position.x += (target.x - currentRight.root.position.x) * snapR;
        currentRight.root.position.y += (target.y - currentRight.root.position.y) * snapR;
        currentRight.root.position.z += (target.z - currentRight.root.position.z) * snapR;
        currentRight.root.rotation.y += (target.rotY - currentRight.root.rotation.y) * snapR;
      }

      const lx = currentLeft ? currentLeft.root.position.x : defaultLeftX;
      const rx = currentRight ? currentRight.root.position.x : defaultRightX;
      const ly = currentLeft ? currentLeft.root.position.y : stageY;
      const ry = currentRight ? currentRight.root.position.y : stageY;

      if (env) {
        updateEnvironment(env, t, u, sceneMoment.sceneIndex, sceneMoment.localProgress, job.stageLayout);
      }
      if (currentLeft) {
        updateCharacterRig(currentLeft, t, leftSpeaking, speechLevel, leftSpeaking ? emotion : 'calm', isTitleHook, leftAction, turnLocal);
      }
      if (currentRight) {
        updateCharacterRig(currentRight, t, rightSpeaking, speechLevel, rightSpeaking ? emotion : 'calm', isTitleHook, rightAction, turnLocal);
      }
      supportingRigs.forEach((rig, sIdx) => {
        const spk = sIdx === supIdx;
        rig.root.position.z = spk ? -0.35 : -0.82;
        rig.root.scale.setScalar(spk ? 0.84 : 0.72);
        updateCharacterRig(rig, t, spk, speechLevel, spk ? emotion : 'calm', false, spk ? speakerAction : 'none', turnLocal);
      });

      const activeMeme = !!job.memeCues?.some((m) => t >= m.startSeconds - 0.05 && t <= m.startSeconds + Math.min(0.75, m.seconds));
      const speakerHeadY = leftSpeaking
        ? (ly + (currentLeft?.headY ?? 1.4))
        : rightSpeaking
          ? (ry + (currentRight?.headY ?? 1.4))
          : 1.38;

      if (vfx) {
        updateVfxRig(
          vfx, t, u, activeSlot, lx, rx, emotion, turnLocal, job.palette.primaryHex, job.palette.secondaryHex,
          leftAction, rightAction, ly, ry, activeMeme);
      }

      updateCameraRig(
        camRig, job, t, u, activeSlot, lx, rx, emotion, isTitleHook,
        activeMeme ? 'crashPunch' : cameraShot, speakerAction, turnChanged, turnLocal, speakerHeadY);

      renderer.render(scene, camRig.camera);
      gl.readPixels(0, 0, job.width, job.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuf);

      const postResp = await fetch(`/frame/${i}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: pixelBuf,
      });
      if (!postResp.ok) {
        throw new Error(`Frame ${i} upload failed: ${postResp.status}`);
      }
    }

    await fetch('/done', { method: 'POST' });
    document.title = 'DONE';
  } catch (err) {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    await fetch('/error', { method: 'POST', body: message }).catch(() => {});
    document.title = 'ERROR';
  }
}

void run();
