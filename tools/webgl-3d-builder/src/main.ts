import * as THREE from 'three';
import { CharacterRig, createCharacterRig, updateCharacterRig } from './characters';
import { createCameraRig, updateCameraRig } from './camera';
import { createDirectorState, updateDirectorCamera } from './director-camera';
import { buildEnvironment, EnvironmentRig, updateEnvironment } from './environments';
import { MythicTrialMode } from './mythic-trials';
import { createVfxRig, updateVfxRig, VfxRig } from './vfx';
import { DialogueTurnJson, EmotionKind, RenderJobJson, SceneRunJson, SceneSetting, SceneTimeOfDay, detectComedyHazard } from './types';

function normalizeEmotion(raw?: string | null): EmotionKind {
  const s = (raw ?? 'calm').trim().toLowerCase();
  if (s === 'laugh' || s === 'laughing' || s === 'excited') return 'laughing';
  if (s === 'smug' || s === 'sarcastic' || s === 'mischievous' || s === 'deadpan' || s === 'playful') return 'smug';
  if (s === 'scared' || s === 'panicked' || s === 'panic' || s === 'nervous' || s === 'terrified') return 'scared';
  if (s === 'surprised' || s === 'shocked' || s === 'gasp') return 'surprised';
  if (s === 'angry' || s === 'shouting' || s === 'determined') return 'angry';
  if (s === 'sad' || s === 'worried') return 'sad';
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
  startSeconds: number;
  localProgress: number;
  activeCharacters?: string[];
  characterEntryAt?: Record<string, number>;
} {
  const runs: SceneRunJson[] = job.sceneRuns ?? [];
  if (runs.length === 0) {
    const u = Math.max(0, Math.min(1, t / Math.max(1, job.durationSeconds)));
    let setting = defaultSettingForTheme(job.theme);
    if (job.hasCharacters && job.turns.length >= 5 && job.theme === 'VedicTempleSunrise3D') {
      setting = u < 0.34 ? 'Temple' : u < 0.68 ? 'ForestAshram' : 'Cosmos';
    }
    return { setting, timeOfDay: 'Dawn', sceneIndex: 0, startSeconds: 0, localProgress: u };
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
    startSeconds: run.startSeconds,
    localProgress,
    activeCharacters: run.activeCharacters,
    characterEntryAt: run.characterEntryAt,
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
  return job.turns.find((turn) => !turn.isTitleHook && t >= turn.startSeconds - 0.005 && t <= turn.endSeconds + 0.005);
}

function resolvePoseTurn(job: RenderJobJson, t: number, activeTurn: DialogueTurnJson | undefined, sceneSetting: SceneSetting): DialogueTurnJson | undefined {
  if (activeTurn) return activeTurn;
  const spoken = job.turns.filter((turn) => !turn.isTitleHook);
  if (spoken.length === 0) return undefined;

  if (t < spoken[0].startSeconds) {
    // Stage opening bed/sofa poses immediately on frame 0 so characters do not teleport into bed after lead-in.
    return spoken[0].action === 'sleeping' || spoken[0].action === 'sitting' ? spoken[0] : undefined;
  }

  for (let idx = spoken.length - 1; idx >= 0; idx--) {
    if (spoken[idx].endSeconds <= t) {
      const candidate = spoken[idx];
      const next = idx + 1 < spoken.length ? spoken[idx + 1] : undefined;
      if (next && next.sceneBackdropCue !== candidate.sceneBackdropCue && t >= next.startSeconds - 0.1) {
        return next;
      }
      if (!candidate.sceneBackdropCue || candidate.sceneBackdropCue.startsWith(sceneSetting)) {
        return candidate;
      }
      return undefined;
    }
  }
  return undefined;
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

function disposeThreeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const refl = child as unknown as { isReflector?: boolean; dispose?: () => void };
    if (refl.isReflector && refl.dispose) {
      refl.dispose();
    }
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m?.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
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

    // Optional TV-style Studio/Channel corner logo badge when watermark is enabled (never blocks faces or captions)
    let hudScene: THREE.Scene | null = null;
    let hudCamera: THREE.OrthographicCamera | null = null;
    if (job.showWatermark !== false && (job.footerLabel || job.isComedyMode)) {
      const badgeW = Math.round(Math.max(158, Math.min(212, job.width * 0.17)));
      const badgeH = Math.round(badgeW * 0.26);
      const canvas2d = document.createElement('canvas');
      canvas2d.width = 512;
      canvas2d.height = 132;
      const bctx = canvas2d.getContext('2d')!;
      bctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      bctx.beginPath();
      bctx.roundRect(6, 6, 500, 120, 26);
      bctx.fill();
      bctx.strokeStyle = '#f59e0b';
      bctx.lineWidth = 4;
      bctx.stroke();
      // Amber circular studio crest
      bctx.fillStyle = '#f59e0b';
      bctx.beginPath();
      bctx.arc(64, 66, 36, 0, Math.PI * 2);
      bctx.fill();
      bctx.fillStyle = '#0f172a';
      bctx.font = 'bold 34px sans-serif';
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillText('KS', 64, 68);
      // Channel / Studio Name
      const brandText = (job.footerLabel && job.footerLabel.trim().length > 0 ? job.footerLabel.trim() : 'KESHAV STUDIO').toUpperCase().slice(0, 18);
      bctx.fillStyle = '#f8fafc';
      bctx.font = 'bold 28px sans-serif';
      bctx.textAlign = 'left';
      bctx.fillText(brandText, 118, 54);
      bctx.fillStyle = '#fbbf24';
      bctx.font = '600 18px sans-serif';
      bctx.fillText('ANIMSTUDIO 3D', 118, 90);

      const hudTex = new THREE.CanvasTexture(canvas2d);
      hudTex.colorSpace = THREE.SRGBColorSpace;
      const hudMat = new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthTest: false, depthWrite: false });
      const hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(badgeW, badgeH), hudMat);
      const marginX = isPortrait ? 18 : 22;
      const marginY = isPortrait ? 62 : 16;
      hudMesh.position.set(job.width - badgeW * 0.5 - marginX, job.height - badgeH * 0.5 - marginY, 0);
      hudScene = new THREE.Scene();
      hudScene.add(hudMesh);
      hudCamera = new THREE.OrthographicCamera(0, job.width, job.height, 0, -10, 10);
      renderer.autoClear = false;
    }

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
      if (scene) {
        disposeThreeObject(scene);
      }
      const nextScene = new THREE.Scene();
      const nextEnv = buildEnvironment(nextScene, job, setting, timeOfDay, backdrops);
      const nextVfx = createVfxRig(nextScene, setting, job.vfxStyle, job.palette.primaryHex, job.palette.secondaryHex, job.seed);

      let nextLeft: CharacterRig | null = null;
      let nextRight: CharacterRig | null = null;
      let nextSupporting: CharacterRig[] = [];

      if (job.hasCharacters && job.leftCharacter && job.rightCharacter) {
        const lSpot = job.stageLayout?.left;
        const rSpot = job.stageLayout?.right;
        let lp = lSpot ? stagePositionFromNormalized(lSpot, isPortrait) : { x: defaultLeftX, y: stageY, scale: 1 };
        let rp = rSpot ? stagePositionFromNormalized(rSpot, isPortrait) : { x: defaultRightX, y: stageY, scale: 1 };
        let initLz = 0.12;
        let initRz = 0.12;
        let initLRot = 0.42;
        let initRRot = -0.42;

        if (setting === 'BarberShop' && !job.stageLayout?.templateBackdrop && nextEnv.spots.sofa && nextEnv.spots.counter) {
          const leftIsBarber0 = /नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(job.leftCharacter.name ?? '');
          const rightIsBarber0 = /नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(job.rightCharacter.name ?? '');
          const barberIsLeft0 = leftIsBarber0 && !rightIsBarber0;
          const bSpot = nextEnv.spots.counter;
          const cSpot = nextEnv.spots.sofa;
          lp = barberIsLeft0 ? { x: bSpot.x, y: bSpot.y, scale: 1 } : { x: cSpot.x, y: cSpot.y, scale: 1 };
          rp = barberIsLeft0 ? { x: cSpot.x, y: cSpot.y, scale: 1 } : { x: bSpot.x, y: bSpot.y, scale: 1 };
          initLz = barberIsLeft0 ? bSpot.z : cSpot.z;
          initRz = barberIsLeft0 ? cSpot.z : bSpot.z;
          initLRot = barberIsLeft0 ? (bSpot.rotY ?? -0.92) : (cSpot.rotY ?? 0.22);
          initRRot = barberIsLeft0 ? (cSpot.rotY ?? 0.22) : (bSpot.rotY ?? -0.92);
        }

        const leftFacesRight = lp.x <= rp.x ? 1 : -1;
        nextLeft = createCharacterRig(job.leftCharacter, job.palette.speakerAHex, setting, leftFacesRight, 0.0);
        nextLeft.root.position.set(lp.x, lp.y, initLz);
        nextLeft.root.rotation.y = initLRot;
        nextLeft.root.scale.setScalar(lp.scale);
        nextScene.add(nextLeft.root);

        nextRight = createCharacterRig(job.rightCharacter, job.palette.speakerBHex, setting, -leftFacesRight, 1.7);
        nextRight.root.position.set(rp.x, rp.y, initRz);
        nextRight.root.rotation.y = initRRot;
        nextRight.root.scale.setScalar(rp.scale);
        nextScene.add(nextRight.root);

        const supSlots = setting === 'BarberShop'
          ? (isPortrait
            ? (job.supportingCast.length === 1 ? [0.78]
              : job.supportingCast.length === 2 ? [0.68, -1.22]
              : [0.68, -1.22, 1.08, -1.48, 0.34])
            : (job.supportingCast.length === 1 ? [1.76]
              : job.supportingCast.length === 2 ? [1.38, 2.12]
              : job.supportingCast.length === 3 ? [1.14, 1.72, 2.30]
              : [0.92, 1.40, 1.88, 2.36, 0.48]))
          : (job.supportingCast.length === 1 ? [0]
            : job.supportingCast.length === 2 ? [-0.48, 0.48]
            : job.supportingCast.length === 3 ? [0, -0.68, 0.68]
            : [-0.36, 0.36, -0.96, 0.96, 0]);
        const supZ = setting === 'BarberShop' ? (isPortrait ? -1.62 : -1.48) : -0.86;
        nextSupporting = job.supportingCast.slice(0, 16).map((sup, i) => {
          // Slot table covers the first few extras; spread any further cast alternately left/right
          // (an undefined slot used to leave x = NaN forever, hiding the character and breaking the camera).
          const slotX = supSlots[i] ?? ((i % 2 === 0 ? -1 : 1) * (0.6 + 0.42 * Math.floor(i / 2)));
          const rig = createCharacterRig(sup, job.palette.secondaryHex, setting, slotX <= 0 ? 1 : -1, 3.1 + i * 1.4);
          const rowBack = i >= 3 ? -0.34 : 0;
          rig.root.position.set(slotX, stageY + (setting === 'BarberShop' ? 0.36 : 0.05), supZ + rowBack);
          rig.root.scale.setScalar(i >= 3 ? 0.72 : 0.76);
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

    // Precompute story continuity milestones across the episode (first cutting turn, towel removal, and Takla mirror reveal)
    const firstActiveCutTurn = job.turns.find((tr) => !tr.isTitleHook && tr.action === 'cutting')
      ?? job.turns.find((tr) => !tr.isTitleHook && tr.listenerAction === 'cutting');
    const towelRemoveTurn = job.turns.find((tr) => !tr.isTitleHook && (tr.action === 'removingTowel' || /तौलिया तो हटा|तौलिया हटा|remove towel/i.test(tr.text ?? '')));
    const mirrorRevealTurn = job.turns.find((tr) => !tr.isTitleHook && (
      tr.action === 'lookInMirror'
      || tr.action === 'removingTowel'
      || /टकला|कटोरा|मैदान साफ़|चाँद|चांद|शीशे में|mirror/i.test(tr.text ?? '')
    ));
    const firstHairCutEnd = firstActiveCutTurn ? firstActiveCutTurn.endSeconds : 9999;
    const towelRemoveTime = towelRemoveTurn ? towelRemoveTurn.startSeconds : 9999;
    const taklaRevealStart = mirrorRevealTurn
      ? mirrorRevealTurn.startSeconds + 0.08
      : Math.max(firstHairCutEnd + 2.5, job.durationSeconds * 0.56);

    const firstMythicBurstTurn = job.turns.find(
      (tr) => !tr.isTitleHook && (
        tr.action === 'pillarBurst' || tr.action === 'lapSubdue' || tr.action === 'lapSubdued'
        || tr.listenerAction === 'lapSubdue' || tr.listenerAction === 'lapSubdued'
      ),
    );
    const pillarShatteredAt = firstMythicBurstTurn ? firstMythicBurstTurn.startSeconds : Number.POSITIVE_INFINITY;
    const lapSubdueTurns = job.turns.filter(
      (tr) => !tr.isTitleHook && (
        tr.action === 'lapSubdue' || tr.action === 'lapSubdued'
        || tr.listenerAction === 'lapSubdue' || tr.listenerAction === 'lapSubdued'
      ),
    );
    const lapSubdueFirstAt = lapSubdueTurns.length > 0 ? lapSubdueTurns[0].startSeconds : Number.POSITIVE_INFINITY;
    const lapSubdueLastEnd = lapSubdueTurns.length > 0 ? lapSubdueTurns[lapSubdueTurns.length - 1].endSeconds : -1;

    const hasFuneralShroud = job.turns.some((tr) =>
      tr.action === 'lyingShroud' || tr.listenerAction === 'lyingShroud'
      || tr.action === 'corpseSnapUp' || tr.listenerAction === 'corpseSnapUp');
    const corpseSnapTurn = job.turns.find((tr) =>
      tr.action === 'corpseSnapUp' || tr.listenerAction === 'corpseSnapUp');
    const corpseSnapAt = corpseSnapTurn ? corpseSnapTurn.startSeconds : Number.POSITIVE_INFINITY;

    let prevTurnIdx = -1;
    let prevRefTurnIdx = -2;
    const directorState = createDirectorState(camRig);
    const totalFrames = Math.max(1, job.totalFrames);
    const startFrame = Math.max(0, Math.min(totalFrames, job.startFrame ?? 0));
    const endFrame = Math.max(startFrame, Math.min(totalFrames, job.endFrame ?? totalFrames));
    for (let i = startFrame; i < endFrame; i++) {
      const t = i / job.fps;
      const u = Math.max(0, Math.min(1, t / Math.max(1, job.durationSeconds)));
      const sceneMoment = resolveSceneAtTime(job, t);

      const sceneChanged = sceneMoment.setting !== currentSetting || sceneMoment.timeOfDay !== currentTimeOfDay;
      if (sceneChanged) {
        rebuildStage(sceneMoment.setting, sceneMoment.timeOfDay);
      }

      const activeTurn = activeTurnAt(job, t);
      const poseTurn = resolvePoseTurn(job, t, activeTurn, sceneMoment.setting);
      const isTitleHook = !activeTurn && job.turns.some((turn) => turn.isTitleHook && t >= turn.startSeconds && t <= turn.endSeconds) && t < (job.turns.find((x) => !x.isTitleHook)?.startSeconds ?? 99);
      const activeTurnIdx = activeTurn ? activeTurn.index : -1;
      const turnChanged = activeTurnIdx !== prevTurnIdx;
      // In walkable rooms the director camera cuts on every line, so characters jump to their new marks
      // on the cut (like an edited cartoon) instead of sliding across the room mid-shot.
      const inDirectedRoom = Object.keys((env as EnvironmentRig | null)?.dynamicSpots ?? {}).length > 0;
      const cutTurnIdx = (activeTurn ?? resolvePoseTurn(job, t, activeTurn, sceneMoment.setting))?.index ?? -1;
      const cutSnap = inDirectedRoom && cutTurnIdx !== prevRefTurnIdx;
      prevTurnIdx = activeTurnIdx;

      const speechLevel = getSpeechLevel(job, i);
      const emotion = normalizeEmotion((activeTurn ?? poseTurn)?.emotion);
      const speakerAction = ((activeTurn ?? poseTurn)?.action || 'none') as string;
      const listenerAction = ((activeTurn ?? poseTurn)?.listenerAction || 'none') as string;
      const speakerProp = (activeTurn ?? poseTurn)?.speakerProp ?? null;
      const listenerProp = (activeTurn ?? poseTurn)?.listenerProp ?? null;
      const cameraShot = ((activeTurn ?? poseTurn)?.cameraShot || 'auto') as string;
      const stageTarget = ((activeTurn ?? poseTurn)?.stageTarget || 'default') as string;
      const refTurn = activeTurn ?? poseTurn;
      const turnDur = refTurn ? Math.max(0.2, refTurn.endSeconds - refTurn.startSeconds) : 1;
      const turnLocal = refTurn ? Math.max(0, Math.min(1, (t - refTurn.startSeconds) / turnDur)) : 0;

      const supIdx = refTurn
        ? supportingRigs.findIndex((r) => r.name.toLowerCase() === refTurn.speakerName.toLowerCase())
        : -1;
      const leftSpeaking = supIdx < 0 && !!activeTurn && activeTurn.slot === 'Left';
      const rightSpeaking = supIdx < 0 && !!activeTurn && activeTurn.slot === 'Right';
      const activeSlot: 'Left' | 'Right' | 'Narrator' = supIdx < 0 && refTurn?.slot === 'Left'
        ? 'Left'
        : supIdx < 0 && refTurn?.slot === 'Right'
          ? 'Right'
          : 'Narrator';
      const poseSlot = refTurn?.slot;

      const currentLeft = leftRig as CharacterRig | null;
      const currentRight = rightRig as CharacterRig | null;

      let leftAction = poseSlot === 'Left' ? speakerAction : poseSlot === 'Right' ? listenerAction : 'none';
      let rightAction = poseSlot === 'Right' ? speakerAction : poseSlot === 'Left' ? listenerAction : 'none';
      if (sceneMoment.setting === 'PalaceCourt') {
        const hasDanceCue = leftAction === 'dancing' || rightAction === 'dancing'
          || leftAction === 'sufiSpin' || rightAction === 'sufiSpin'
          || leftAction === 'adaab' || rightAction === 'adaab';
        if (hasDanceCue) {
          const danceLead = leftAction === 'dancing' || leftAction === 'adaab' || leftAction === 'sufiSpin'
            ? leftAction
            : rightAction;
          if (leftAction === 'none') leftAction = danceLead;
          if (rightAction === 'none') rightAction = danceLead;
        }
      }
      const pillarShattered = t >= pillarShatteredAt - 0.04;
      const isPillarBurstTurn = speakerAction === 'pillarBurst' || listenerAction === 'pillarBurst';
      const isLapSubdueTurn = speakerAction === 'lapSubdue'
        || speakerAction === 'lapSubdued'
        || listenerAction === 'lapSubdue'
        || listenerAction === 'lapSubdued'
        || (!isPillarBurstTurn && speakerAction !== 'blessing' && t >= lapSubdueFirstAt - 0.04 && t <= lapSubdueLastEnd + 0.04);
      const trialMode: MythicTrialMode = (speakerAction === 'serpentAttack' || listenerAction === 'serpentAttack')
        ? 'serpentAttack'
        : (speakerAction === 'elephantCharge' || listenerAction === 'elephantCharge')
          ? 'elephantCharge'
          : (speakerAction === 'fireTrial' || listenerAction === 'fireTrial')
            ? 'fireTrial'
            : (speakerAction === 'cliffRescue' || listenerAction === 'cliffRescue')
              ? 'cliffRescue'
              : 'none';
      const corpseAwake = t >= corpseSnapAt - 0.04;
      const primaryHazard = detectComedyHazard(speakerAction);
      const comedyHazardMode = primaryHazard !== 'none' ? primaryHazard : detectComedyHazard(listenerAction);
      const resolveMythicAction = (rig: CharacterRig | null, fallbackAct: string): string => {
        if (!rig) return fallbackAct;
        if (isLapSubdueTurn) {
          if (rig.isNarasimha) return 'lapSubdue';
          if (rig.isAsuraKing) return 'lapSubdued';
          if (rig.role === 'ChildDevotee') return 'praying';
        } else if (isPillarBurstTurn) {
          if (rig.isNarasimha) return 'pillarBurst';
          if (rig.isAsuraKing) return 'shockedFall';
          if (rig.role === 'ChildDevotee') return 'praying';
        } else if (pillarShattered && !isLapSubdueTurn && !isPillarBurstTurn) {
          if (rig.isNarasimha) return 'blessing';
          if (rig.role === 'ChildDevotee' && (fallbackAct === 'none' || fallbackAct === 'praying')) return 'praying';
        } else if (trialMode === 'fireTrial' && rig.role === 'ChildDevotee') {
          return 'fireTrial';
        } else if (trialMode === 'cliffRescue' && rig.role === 'ChildDevotee') {
          return 'cliffRescue';
        }
        return fallbackAct;
      };
      leftAction = resolveMythicAction(currentLeft, leftAction);
      rightAction = resolveMythicAction(currentRight, rightAction);
      // Persistent per-character actions (e.g. asleep at the desk) apply while that character is not the speaker.
      const persistentActs = refTurn?.characterActions ?? {};
      if (currentLeft && poseSlot !== 'Left' && persistentActs[currentLeft.name]) leftAction = persistentActs[currentLeft.name];
      if (currentRight && poseSlot !== 'Right' && persistentActs[currentRight.name]) rightAction = persistentActs[currentRight.name];
      let leftProp = poseSlot === 'Left' ? speakerProp : poseSlot === 'Right' ? listenerProp : null;
      let rightProp = poseSlot === 'Right' ? speakerProp : poseSlot === 'Left' ? listenerProp : null;

      const isLeftBarber = /नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(currentLeft?.name ?? '');
      const isRightBarber = /नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(currentRight?.name ?? '');
      // Guarantee ONE exclusive Barber slot per scene so Customer & Barber NEVER occupy the same stand/chair coordinate!
      const barberSlot: 'Left' | 'Right' = isLeftBarber && !isRightBarber
        ? 'Left'
        : isRightBarber
          ? 'Right'
          : (stageTarget === 'barberStand' && poseSlot === 'Left' ? 'Left' : 'Right');
      if (sceneMoment.setting === 'BarberShop') {
        if (barberSlot === 'Left') {
          if (!leftProp) leftProp = 'scissors';
          if (rightProp === 'scissors' || rightProp === 'comb') rightProp = 'cape';
          if (leftAction === 'lookInMirror' || rightAction === 'lookInMirror') {
            rightAction = 'lookInMirror';
            if (leftAction === 'lookInMirror') leftAction = 'pointing';
          }
        } else {
          if (!rightProp) rightProp = 'scissors';
          if (leftProp === 'scissors' || leftProp === 'comb') leftProp = 'cape';
          if (leftAction === 'lookInMirror' || rightAction === 'lookInMirror') {
            leftAction = 'lookInMirror';
            if (rightAction === 'lookInMirror') rightAction = 'pointing';
          }
        }
      }

      // Dynamic internal 3D stage blocking: characters sit in barber chair, lie on bed, sit on sofa, approach counter, or walk in separated lanes.
      const resolveSlotPose = (
        slot: 'Left' | 'Right',
        act: string,
        isPoseSpeaker: boolean,
        baseX: number,
        baseRotY: number,
      ): { x: number; y: number; z: number; rotY: number; seated: boolean; showCape: boolean } => {
        const dynSpots = env?.dynamicSpots ?? {};
        const charProfile = slot === 'Left' ? job.leftCharacter : job.rightCharacter;
        const charName = charProfile?.name ?? '';
        const namedSpotKey = (charName && refTurn?.characterSpots?.[charName])
          || (isPoseSpeaker ? refTurn?.speakerSpot : refTurn?.listenerSpot)
          || charProfile?.defaultSpot
          || '';
        if (namedSpotKey === 'hidden' || namedSpotKey === 'outside') {
          return { x: 99, y: -99, z: 99, rotY: 0, seated: false, showCape: false };
        }
        if (namedSpotKey && dynSpots[namedSpotKey]) {
          const ds = dynSpots[namedSpotKey];
          return {
            x: ds.x,
            y: ds.y ?? 0,
            z: ds.z,
            rotY: ds.rotY ?? baseRotY,
            seated: ds.pose === 'sitting' || act === 'sitting' || act === 'placingBook',
            showCape: false,
          };
        }

        const baseY = stageY;
        if (job.stageLayout?.templateBackdrop) {
          return { x: baseX, y: baseY, z: 0.12, rotY: baseRotY, seated: false, showCape: false };
        }
        const spots = env?.spots ?? {};
        const tgt = isPoseSpeaker ? stageTarget : 'default';

        if (sceneMoment.setting === 'BarberShop') {
          const isBarberSlot = slot === barberSlot;
          if (isBarberSlot) {
            return {
              x: spots.counter?.x ?? -0.22,
              y: baseY,
              z: spots.counter?.z ?? -0.92,
              rotY: spots.counter?.rotY ?? -0.92,
              seated: false,
              showCape: false,
            };
          }
          if (spots.sofa) {
            const keepCape = act !== 'removingTowel' && t < towelRemoveTime - 0.1;
            const mirrorTurn = act === 'lookInMirror' || speakerAction === 'lookInMirror' || listenerAction === 'lookInMirror';
            const mirrorLookRot = turnLocal < 0.45
              ? -0.64 + Math.sin(turnLocal * Math.PI * 2.2) * 0.22
              : 0.28;
            return {
              x: spots.sofa.x,
              y: spots.sofa.y,
              z: spots.sofa.z,
              rotY: mirrorTurn ? mirrorLookRot : (spots.sofa.rotY ?? 0.22),
              seated: true,
              showCape: keepCape,
            };
          }
        }

        if (sceneMoment.setting === 'Courtroom') {
          if (tgt === 'judgeBench' && spots.sofa) {
            return { x: spots.sofa.x, y: spots.sofa.y, z: spots.sofa.z, rotY: spots.sofa.rotY ?? 0.08, seated: true, showCape: false };
          }
          if (tgt === 'witnessStand' && spots.counter) {
            return { x: spots.counter.x, y: spots.counter.y, z: spots.counter.z, rotY: spots.counter.rotY ?? 0.38, seated: false, showCape: false };
          }
        }

        if (sceneMoment.setting === 'DoctorClinic') {
          if (tgt === 'doctorDesk' && spots.sofa) {
            return { x: spots.sofa.x, y: spots.sofa.y, z: spots.sofa.z, rotY: spots.sofa.rotY ?? -0.35, seated: false, showCape: false };
          }
          if (tgt === 'patientBed' && spots.bed) {
            return { x: spots.bed.x + 0.15, y: 0.32, z: -0.32, rotY: 0.32, seated: true, showCape: false };
          }
        }

        if (act === 'sleeping' && spots.bed) {
          return { x: spots.bed.x, y: spots.bed.y, z: spots.bed.z, rotY: spots.bed.rotY ?? baseRotY, seated: false, showCape: false };
        }
        if (tgt === 'bed' && (act === 'wakingUp' || act === 'sitting') && spots.bed) {
          return { x: spots.bed.x + 0.28, y: 0.34, z: -0.05, rotY: 0.35, seated: true, showCape: false };
        }
        if ((act === 'sitting' || tgt === 'sofa') && spots.sofa) {
          return { x: spots.sofa.x, y: spots.sofa.y, z: spots.sofa.z, rotY: spots.sofa.rotY ?? baseRotY, seated: true, showCape: false };
        }
        if ((tgt === 'counter' || act === 'eating' || act === 'stirring') && spots.counter) {
          if (slot === 'Left') {
            return { x: spots.counter.x, y: spots.counter.y, z: spots.counter.z, rotY: spots.counter.rotY ?? 0.30, seated: false, showCape: false };
          }
          return { x: Math.max(0.55, spots.counter.x + 0.96), y: spots.counter.y, z: -0.22, rotY: -0.48, seated: false, showCape: false };
        }
        if (sceneMoment.setting === 'Kitchen' || sceneMoment.setting === 'SweetShop') {
          return slot === 'Left'
            ? { x: spots.counter?.x ?? -0.45, y: baseY, z: -0.52, rotY: 0.34, seated: false, showCape: false }
            : { x: 0.60, y: baseY, z: -0.18, rotY: -0.46, seated: false, showCape: false };
        }
        if (act === 'walking' || act === 'running') {
          const walkProgress = turnLocal < 0.85 ? Math.min(1, turnLocal / 0.85) : 1;
          const eased = walkProgress * walkProgress * (3 - 2 * walkProgress);
          const startX = tgt === 'door' && spots.door ? spots.door.x : baseX * 1.45;
          const startZ = tgt === 'door' && spots.door ? spots.door.z : -0.35;
          const endX = tgt === 'center' ? baseX * 0.45 : baseX;
          const endZ = 0.22;
          const x = startX + (endX - startX) * eased;
          const z = startZ + (endZ - startZ) * eased;
          const dx = endX - startX;
          const moveYaw = Math.abs(dx) > 0.05 ? Math.atan2(dx, endZ - startZ) * 0.65 : baseRotY;
          return { x, y: baseY, z, rotY: moveYaw, seated: false, showCape: false };
        }
        if (act === 'lapSubdue') {
          return { x: -0.04, y: 0.04, z: 0.08, rotY: 0.06, seated: false, showCape: false };
        }
        if (act === 'lapSubdued') {
          return { x: -0.04, y: 0.04, z: 0.08, rotY: 0.0, seated: false, showCape: false };
        }
        if (act === 'pillarBurst') {
          return { x: 0, y: 0.04, z: -0.04, rotY: 0.04, seated: false, showCape: false };
        }
        if (isLapSubdueTurn) {
          return { x: isPortrait ? 0.72 : 1.18, y: baseY, z: 0.16, rotY: -0.58, seated: false, showCape: false };
        }
        if (sceneMoment.setting === 'LivingRoom' && hasFuneralShroud) {
          const sideX = slot === 'Left' ? (isPortrait ? -0.78 : -1.16) : (isPortrait ? 0.78 : 1.16);
          return { x: sideX, y: baseY, z: -0.36, rotY: slot === 'Left' ? 0.44 : -0.44, seated: false, showCape: false };
        }
        if (tgt === 'center' || (isPoseSpeaker && act === 'pointing')) {
          return { x: baseX * 0.84, y: baseY, z: 0.18, rotY: baseRotY * 0.78, seated: false, showCape: false };
        }
        return { x: baseX, y: baseY, z: 0.12, rotY: baseRotY, seated: false, showCape: false };
      };

      const posBlend = 1 - Math.exp(-(job.isComedyMode ? 13.5 : 8.5) / Math.max(1, job.fps));
      let leftSeated = false;
      let leftShowCape = false;
      if (currentLeft && !job.stageLayout?.templateBackdrop) {
        const target = resolveSlotPose('Left', leftAction, poseSlot === 'Left', defaultLeftX, 0.42);
        leftSeated = target.seated;
        leftShowCape = target.showCape;
        const snapL = sceneChanged || cutSnap || (turnChanged && (leftAction === 'sleeping' || leftAction === 'sitting' || target.seated)) ? 1 : posBlend;
        currentLeft.root.position.x += (target.x - currentLeft.root.position.x) * snapL;
        currentLeft.root.position.y += (target.y - currentLeft.root.position.y) * snapL;
        currentLeft.root.position.z += (target.z - currentLeft.root.position.z) * snapL;
        currentLeft.root.rotation.y += (target.rotY - currentLeft.root.rotation.y) * snapL;
      }
      let rightSeated = false;
      let rightShowCape = false;
      if (currentRight && !job.stageLayout?.templateBackdrop) {
        const target = resolveSlotPose('Right', rightAction, poseSlot === 'Right', defaultRightX, -0.42);
        rightSeated = target.seated;
        rightShowCape = target.showCape;
        const snapR = sceneChanged || cutSnap || (turnChanged && (rightAction === 'sleeping' || rightAction === 'sitting' || target.seated)) ? 1 : posBlend;
        currentRight.root.position.x += (target.x - currentRight.root.position.x) * snapR;
        currentRight.root.position.y += (target.y - currentRight.root.position.y) * snapR;
        currentRight.root.position.z += (target.z - currentRight.root.position.z) * snapR;
        currentRight.root.rotation.y += (target.rotY - currentRight.root.rotation.y) * snapR;
      }

      const lx = currentLeft ? currentLeft.root.position.x : defaultLeftX;
      const rx = currentRight ? currentRight.root.position.x : defaultRightX;
      const ly = currentLeft ? currentLeft.root.position.y : stageY;
      const ry = currentRight ? currentRight.root.position.y : stageY;

      const listenerFallbackEmo: EmotionKind = refTurn?.listenerEmotion
        ? normalizeEmotion(refTurn.listenerEmotion)
        : 'calm';
      const resolveCharacterEmotion = (action: string, isCharSpeaking: boolean, otherSpeaking: boolean): EmotionKind => {
        if (action === 'lapSubdue' || action === 'pillarBurst') return 'angry';
        if (action === 'lapSubdued') return 'surprised';
        if (isCharSpeaking) return emotion;
        if (action === 'brakeStop') return 'scared';
        if (action === 'celebrate') return 'proud';
        if (action === 'lookInMirror' || action === 'shockedFall') return 'surprised';
        return otherSpeaking && listenerFallbackEmo !== 'calm' ? listenerFallbackEmo : 'calm';
      };
      const leftEmotion: EmotionKind = resolveCharacterEmotion(leftAction, leftSpeaking, rightSpeaking);
      const rightEmotion: EmotionKind = resolveCharacterEmotion(rightAction, rightSpeaking, leftSpeaking);
      const glassesFallback = job.turns.find((tr) => !tr.isTitleHook);
      const glassesTurn = refTurn && !refTurn.isTitleHook ? refTurn : glassesFallback;
      const gSlot = glassesTurn?.slot;
      const leftGlasses = gSlot === 'Left' ? (glassesTurn?.speakerGlasses ?? null) : gSlot === 'Right' ? (glassesTurn?.listenerGlasses ?? null) : null;
      const rightGlasses = gSlot === 'Right' ? (glassesTurn?.speakerGlasses ?? null) : gSlot === 'Left' ? (glassesTurn?.listenerGlasses ?? null) : null;

      // Customer progressive haircut stage in BarberShop:
      // 0 (full spiky hair before first cut) -> 1 (half-chopped during snipping) -> 2 (shiny Takla dome strictly on mirror/towel climax reveal!)
      const customerHairCutStage = sceneMoment.setting !== 'BarberShop'
        ? 0
        : t >= taklaRevealStart || leftAction === 'lookInMirror' || rightAction === 'lookInMirror'
          ? 2
          : (firstActiveCutTurn ? t >= firstActiveCutTurn.startSeconds : false)
            ? 1
            : 0;
      const leftHairCut = barberSlot === 'Left' ? 0 : customerHairCutStage;
      const rightHairCut = barberSlot === 'Right' ? 0 : customerHairCutStage;

      // Multi-scene story choreography for non-comedy narratives (DailyKatha, Festival, Panchang, History):
      // show ONLY the characters participating in the current scene at their right moment of entrance,
      // restage them into balanced foreground positions, and aim dynamic camera framing at whoever speaks.
      const useSceneCasting = !job.isComedyMode
        && !job.stageLayout?.templateBackdrop
        && (job.sceneRuns?.length ?? 0) > 1;

      if (currentLeft) {
        const leftSpotKey = (currentLeft.name && refTurn?.characterSpots?.[currentLeft.name])
          || (poseSlot === 'Left' ? refTurn?.speakerSpot : refTurn?.listenerSpot)
          || job.leftCharacter?.defaultSpot || '';
        currentLeft.root.visible = leftSpotKey !== 'hidden' && leftSpotKey !== 'outside';
        currentLeft.root.rotation.z = leftSpotKey === 'door_exit' ? Math.min(1, turnLocal * 1.4) * Math.PI : 0;
        updateCharacterRig(currentLeft, t, leftSpeaking, speechLevel, leftEmotion, isTitleHook, leftAction, turnLocal, sceneChanged, leftProp, leftSeated, leftShowCape, leftGlasses, leftHairCut);
      }
      if (currentRight) {
        const rightSpotKey = (currentRight.name && refTurn?.characterSpots?.[currentRight.name])
          || (poseSlot === 'Right' ? refTurn?.speakerSpot : refTurn?.listenerSpot)
          || job.rightCharacter?.defaultSpot || '';
        currentRight.root.visible = rightSpotKey !== 'hidden' && rightSpotKey !== 'outside';
        currentRight.root.rotation.z = rightSpotKey === 'door_exit' ? Math.min(1, turnLocal * 1.4) * Math.PI : 0;
        updateCharacterRig(currentRight, t, rightSpeaking, speechLevel, rightEmotion, isTitleHook, rightAction, turnLocal, sceneChanged, rightProp, rightSeated, rightShowCape, rightGlasses, rightHairCut);
      }
      supportingRigs.forEach((rig, sIdx) => {
        const spk = sIdx === supIdx;
        const isShroudCorpse = !useSceneCasting && sceneMoment.setting === 'LivingRoom' && hasFuneralShroud && sIdx === 0;
        const isSofaMourner = !useSceneCasting && sceneMoment.setting === 'LivingRoom' && hasFuneralShroud && sIdx === 1;
        const dynSpots = env?.dynamicSpots ?? {};
        const supProfile = job.supportingCast[sIdx];
        const supSpotKey = (rig.name && refTurn?.characterSpots?.[rig.name]) || supProfile?.defaultSpot || '';
        const supDynSpot = supSpotKey ? dynSpots[supSpotKey] : undefined;
        let supSeated = false;

        if (supSpotKey === 'hidden' || supSpotKey === 'outside') {
          rig.root.visible = false;
        } else if (supDynSpot) {
          rig.root.visible = true;
          const snapHere = sceneChanged || cutSnap ? 1 : posBlend;
          rig.root.position.x += (supDynSpot.x - rig.root.position.x) * snapHere;
          rig.root.position.y += ((supDynSpot.y ?? 0) - rig.root.position.y) * snapHere;
          rig.root.position.z += (supDynSpot.z - rig.root.position.z) * snapHere;
          rig.root.rotation.y += ((supDynSpot.rotY ?? Math.PI) - rig.root.rotation.y) * snapHere;
          rig.root.rotation.z = supSpotKey === 'door_exit' ? Math.min(1, turnLocal * 1.4) * Math.PI : 0;
          rig.root.scale.setScalar(1.0);
          supSeated = supDynSpot.pose === 'sitting';
        } else if (isShroudCorpse) {
          if (corpseAwake) {
            rig.root.position.x += (0 - rig.root.position.x) * Math.max(posBlend, 0.55);
            rig.root.position.y += (0.02 - rig.root.position.y) * Math.max(posBlend, 0.55);
            rig.root.position.z = 0.25;
            rig.root.rotation.y += (0 - rig.root.rotation.y) * Math.max(posBlend, 0.55);
          } else {
            rig.root.position.set(0.68, 0.14, 0.25);
            rig.root.rotation.y = Math.PI * 0.5;
          }
          rig.root.scale.setScalar(0.92);
        } else if (isSofaMourner) {
          rig.root.position.set(0.02, 0.38, -1.24);
          rig.root.rotation.y = 0.05;
          rig.root.scale.setScalar(0.84);
        } else if (isLapSubdueTurn && rig.isNarasimha) {
          rig.root.position.set(-0.04, 0.04, 0.08);
          rig.root.rotation.y = 0.06;
          rig.root.scale.setScalar(1.0);
        } else if (isLapSubdueTurn && rig.isAsuraKing) {
          rig.root.position.set(-0.04, 0.04, 0.08);
          rig.root.rotation.y = 0.0;
          rig.root.scale.setScalar(1.0);
        } else if (isPillarBurstTurn && rig.isNarasimha) {
          rig.root.position.set(0, 0.04, -0.04);
          rig.root.rotation.y = 0.04;
          rig.root.scale.setScalar(1.0);
        } else if (!useSceneCasting) {
          if (sceneMoment.setting === 'BarberShop') {
            rig.root.position.z = -1.52;
            rig.root.position.y = spk ? 0.34 : 0.30;
            rig.root.scale.setScalar(spk ? 0.80 : 0.76);
          } else if (sceneMoment.setting === 'PalaceCourt') {
            const side = sIdx % 2 === 0 ? -1 : 1;
            const rank = Math.floor(sIdx / 2);
            rig.root.position.x = side * (1.82 + rank * 0.72);
            rig.root.position.z = -0.68 - rank * 0.44;
            rig.root.position.y = 0;
            rig.root.scale.setScalar(0.94);
          } else {
            rig.root.position.z = spk ? -0.35 : -0.82;
            rig.root.scale.setScalar(spk ? 0.94 : 0.88);
          }
        }
        const mainDancing = leftAction === 'dancing' || rightAction === 'dancing' || leftAction === 'adaab' || leftAction === 'sufiSpin';
        const persistentSupAct = !spk ? refTurn?.characterActions?.[rig.name] : undefined;
        const baseSupAct = persistentSupAct ? persistentSupAct : isShroudCorpse
          ? (corpseAwake ? 'corpseSnapUp' : 'lyingShroud')
          : isSofaMourner
            ? (corpseAwake ? 'shockedFall' : 'sitting')
            : spk
              ? speakerAction
              : mainDancing && sceneMoment.setting === 'PalaceCourt'
                ? (leftAction === 'dancing' || leftAction === 'adaab' || leftAction === 'sufiSpin' ? leftAction : rightAction)
                : (speakerAction === 'punching' || speakerAction === 'kicking') ? 'shockedFall' : (supSeated ? 'sitting' : 'none');
        const reactAct = resolveMythicAction(rig, baseSupAct);
        const reactEmo = isShroudCorpse
          ? (corpseAwake ? 'angry' : (u > 0.54 ? 'angry' : 'happy'))
          : isSofaMourner
            ? (corpseAwake ? 'surprised' : (spk ? emotion : 'sad'))
            : reactAct === 'lapSubdue' || reactAct === 'pillarBurst'
              ? 'angry'
              : reactAct === 'lapSubdued'
                ? 'surprised'
                : reactAct === 'blessing'
                  ? 'proud'
                  : spk
                    ? emotion
                    : (emotion === 'angry' || emotion === 'surprised') ? 'surprised' : (emotion === 'laughing' ? 'laughing' : 'calm');
        const supProp = spk && sceneMoment.setting !== 'BarberShop' ? speakerProp : null;
        supSeated = supSeated || sceneMoment.setting === 'BarberShop' || (isSofaMourner && !corpseAwake);
        updateCharacterRig(rig, t, spk, speechLevel, reactEmo, false, reactAct, turnLocal, sceneChanged, supProp, supSeated, false, null, 0);
      });

      let camLeftX = lx;
      let camRightX = rx;
      let camSlot = activeSlot;
      let camHeadY = activeSlot === 'Left'
        ? (ly + (currentLeft?.headY ?? 1.4))
        : activeSlot === 'Right'
          ? (ry + (currentRight?.headY ?? 1.4))
          : 1.38;

      if (useSceneCasting) {
        const fallbackLeadNames = (job.sceneRuns?.[1]?.activeCharacters?.slice(0, 2))
          ?? [currentLeft?.name, currentRight?.name].filter((n): n is string => !!n);
        const activeNames = (sceneMoment.activeCharacters?.length ?? 0) > 0
          ? sceneMoment.activeCharacters!
          : fallbackLeadNames;
        const entryMap = sceneMoment.characterEntryAt ?? {};
        const entryTimeFor = (rig: CharacterRig): number | null => {
          const name = rig.name;
          if ((isPillarBurstTurn || isLapSubdueTurn) && (rig.isNarasimha || rig.isAsuraKing)) {
            return pillarShatteredAt;
          }
          if (trialMode !== 'none' && (rig.role === 'ChildDevotee' || (trialMode === 'fireTrial' && rig.isHolika))) {
            return sceneMoment.startSeconds;
          }
          if (pillarShattered && !isLapSubdueTurn && !isPillarBurstTurn && (rig.isNarasimha || rig.role === 'ChildDevotee')
            && activeNames.some((a) => /प्रह्लाद|prahlad|नरसिंह|नृसिंह|narasimha|narsimha/i.test(a))) {
            return sceneMoment.startSeconds;
          }
          const match = activeNames.find((a) => a.toLowerCase() === name.toLowerCase());
          const isSpeakingNow = !!activeTurn && activeTurn.speakerName.toLowerCase() === name.toLowerCase();
          if (!match && !isSpeakingNow) return null;
          const exactEntry = Object.entries(entryMap).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
          return exactEntry ?? sceneMoment.startSeconds;
        };

        const allRigs: CharacterRig[] = [
          ...(currentLeft ? [currentLeft] : []),
          ...(currentRight ? [currentRight] : []),
          ...supportingRigs,
        ];
        const visibleInMoment: { rig: CharacterRig; entryAt: number }[] = [];
        for (const rig of allRigs) {
          const entryAt = entryTimeFor(rig);
          const vis = entryAt !== null && t >= entryAt - 0.04;
          rig.root.visible = vis;
          if (vis && entryAt !== null) {
            visibleInMoment.push({ rig, entryAt });
          }
        }

        const nVis = visibleInMoment.length;
        const spreadX = isPortrait ? 0.56 : 0.88;
        visibleInMoment.forEach(({ rig, entryAt }, vIdx) => {
          let tx = 0;
          let ty = 0;
          let tz = 0.14;
          let troty = 0;
          if (isLapSubdueTurn) {
            if (rig.isNarasimha) {
              tx = -0.04;
              ty = 0.04;
              tz = 0.08;
              troty = 0.06;
            } else if (rig.isAsuraKing) {
              tx = -0.04;
              ty = 0.04;
              tz = 0.08;
              troty = 0.0;
            } else {
              tx = isPortrait ? 0.72 : 1.18;
              ty = 0;
              tz = 0.16;
              troty = -0.58;
            }
          } else if (isPillarBurstTurn && rig.isNarasimha) {
            tx = 0;
            ty = 0.04;
            tz = -0.04;
            troty = 0.04;
          } else if (trialMode === 'elephantCharge') {
            if (rig.role === 'ChildDevotee') {
              tx = isPortrait ? 0.62 : 0.96;
              tz = 0.16;
              troty = -0.35;
            } else {
              tx = isPortrait ? -0.78 : -1.52;
              tz = -0.24;
              troty = 0.45;
            }
          } else if (trialMode === 'fireTrial') {
            if (rig.role === 'ChildDevotee') {
              tx = 0.42;
              tz = 0.24;
              troty = -0.25;
            } else if (rig.isHolika) {
              tx = -0.42;
              tz = 0.20;
              troty = 0.25;
            } else {
              tx = -1.38;
              tz = 0.05;
              troty = 0.48;
            }
          } else if (nVis === 1) {
            tx = 0;
            tz = 0.16;
            troty = 0.12;
          } else if (nVis === 2) {
            tx = vIdx === 0 ? -spreadX : spreadX;
            tz = 0.16;
            troty = vIdx === 0 ? 0.42 : -0.42;
          } else {
            const slots3 = [-spreadX * 1.15, 0.04, spreadX * 1.15];
            tx = slots3[vIdx] ?? ((vIdx - 1) * 0.65);
            tz = vIdx === 1 ? -0.18 : 0.16;
            troty = tx < -0.1 ? 0.44 : tx > 0.1 ? -0.44 : 0.08;
          }

          const appearAge = Math.max(0, t - entryAt);
          const appearEase = appearAge < 0.72
            ? Math.sin((appearAge / 0.72) * Math.PI * 0.5)
            : 1;
          const isDivineDescend = !isLapSubdueTurn && !isPillarBurstTurn && rig.role === 'Divine' && entryAt > sceneMoment.startSeconds + 0.25 && appearAge < 0.9;
          const descLift = isDivineDescend ? (1 - appearEase) * 0.85 : 0;
          const snapHere = sceneChanged || appearAge < 0.06 ? 1 : (isLapSubdueTurn ? Math.max(posBlend, 0.55) : posBlend);

          rig.root.position.x += (tx - rig.root.position.x) * snapHere;
          rig.root.position.y += ((ty + descLift) - rig.root.position.y) * snapHere;
          rig.root.position.z += (tz - rig.root.position.z) * snapHere;
          rig.root.rotation.y += (troty - rig.root.rotation.y) * snapHere;
          const baseScale = appearAge < 0.55 ? 0.78 + 0.22 * appearEase : 1.0;
          rig.root.scale.setScalar(baseScale);
        });

        if (isLapSubdueTurn || isPillarBurstTurn) {
          camLeftX = -0.55;
          camRightX = 0.55;
          camSlot = 'Narrator';
          camHeadY = 1.48;
        } else if (visibleInMoment.length > 0) {
          camLeftX = Math.min(...visibleInMoment.map((v) => v.rig.root.position.x));
          camRightX = Math.max(...visibleInMoment.map((v) => v.rig.root.position.x));
          const spkRig = refTurn
            ? visibleInMoment.find((v) => v.rig.name.toLowerCase() === refTurn.speakerName.toLowerCase())?.rig
            : undefined;
          if (spkRig) {
            camSlot = spkRig.root.position.x <= 0.05 ? 'Left' : 'Right';
            camHeadY = spkRig.root.position.y + spkRig.headY;
          } else {
            camSlot = 'Narrator';
            camHeadY = visibleInMoment[0].rig.root.position.y + visibleInMoment[0].rig.headY;
          }
        }
      }

      const centerAngrySnap = hasFuneralShroud && (speakerAction === 'corpseSnapUp' || (corpseAwake && supIdx === 0));
      if (centerAngrySnap && supportingRigs[0]) {
        camHeadY = supportingRigs[0].root.position.y + supportingRigs[0].headY;
      }

      if (env) {
        const devoteeRig = [currentLeft, currentRight, ...supportingRigs].find((r): r is CharacterRig => !!r && r.role === 'ChildDevotee');
        const devoteeX = devoteeRig ? devoteeRig.root.position.x : 0;
        updateEnvironment(
          env, t, u, sceneMoment.sceneIndex, sceneMoment.localProgress, job.stageLayout,
          pillarShattered, trialMode, devoteeX, turnLocal,
          { hasFuneralShroud, shroudOpen: corpseAwake, hazardMode: comedyHazardMode });
      }

      const activeMeme = !!job.memeCues?.some((m) => t >= m.startSeconds - 0.05 && t <= m.startSeconds + Math.min(0.75, m.seconds));

      if (vfx) {
        updateVfxRig(
          vfx, t, u, camSlot, camLeftX, camRightX, emotion, turnLocal, job.palette.primaryHex, job.palette.secondaryHex,
          leftAction, rightAction, ly, ry, activeMeme, leftEmotion, rightEmotion, centerAngrySnap, refTurn?.sfxCue ?? null);
      }

      const effectiveCamAction = isLapSubdueTurn
        ? 'lapSubdue'
        : isPillarBurstTurn
          ? 'pillarBurst'
          : centerAngrySnap
            ? 'corpseSnapUp'
            : trialMode !== 'none'
              ? trialMode
              : speakerAction;
      // Walkable 3D rooms (SceneBlueprint / Classroom) use the locked-off director camera:
      // hard cut per line, head-accurate framing, occlusion-free angles, no handheld shake.
      const curEnv = env as EnvironmentRig | null;
      const curVfx = vfx as VfxRig | null;
      const isDirectedRoom = !!curEnv && Object.keys(curEnv.dynamicSpots).length > 0;
      const refTurnIdx = refTurn ? refTurn.index : -1;
      const refTurnChanged = refTurnIdx !== prevRefTurnIdx;
      prevRefTurnIdx = refTurnIdx;
      let directed = false;
      if (isDirectedRoom) {
        if (curVfx) curVfx.group.visible = false;
        const allChars = [
          ...(currentLeft ? [currentLeft] : []),
          ...(currentRight ? [currentRight] : []),
          ...supportingRigs,
        ].filter((r) => r.root.visible);
        const byName = (name?: string | null) => (name
          ? allChars.find((r) => r.name.toLowerCase() === name.trim().toLowerCase())
          : undefined);
        const spk = byName(refTurn?.speakerName)
          ?? (camSlot === 'Left' ? currentLeft : camSlot === 'Right' ? currentRight : null)
          ?? allChars[0];
        if (spk) {
          const lst = byName(refTurn?.listenerName) ?? allChars.find((r) => r !== spk);
          const roomDims = job.sceneBlueprint?.room;
          updateDirectorCamera(camRig, directorState, job, {
            shot: isTitleHook ? 'wideEstablishing' : (activeMeme ? 'crashPunch' : cameraShot),
            speaker: spk,
            listener: lst,
            everyone: allChars,
            aspect: job.width / job.height,
            scene,
            room: {
              halfWidth: (roomDims?.width ?? 9.6) / 2,
              halfDepth: (roomDims?.depth ?? 8.4) / 2,
              height: roomDims?.height ?? 3.6,
            },
            turnLocal,
            cut: refTurnChanged || sceneChanged,
          });
          directed = true;
        }
      }

      if (!directed) {
        updateCameraRig(
          camRig, job, t, u, camSlot, camLeftX, camRightX, emotion, isTitleHook,
          activeMeme ? 'crashPunch' : cameraShot, effectiveCamAction, turnChanged || sceneChanged, turnLocal, camHeadY, sceneMoment.setting);
      }

      if (hudScene && hudCamera) {
        renderer.clear();
        renderer.render(scene, camRig.camera);
        renderer.clearDepth();
        renderer.render(hudScene, hudCamera);
      } else {
        renderer.render(scene, camRig.camera);
      }
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
