import * as THREE from 'three';
import { EmotionKind, SceneSetting, VfxStyle, strikePhase } from './types';

export interface VfxRig {
  group: THREE.Group;
  ambientPoints: THREE.Points;
  ambientPositions: Float32Array;
  ambientSeeds: Float32Array;
  burstPoints: THREE.Points;
  burstPositions: Float32Array;
  burstMat: THREE.PointsMaterial;
  streamDots: THREE.Mesh[];
  godRays: THREE.Mesh[];
  particleMode: 'upward' | 'firefly' | 'snow' | 'star' | 'petal';
  sleepZGroup: THREE.Group;
  shockBurstGroup: THREE.Group;
  dizzyStarsGroup: THREE.Group;
  dustGroup: THREE.Group;
  hairCutGroup: THREE.Group;
  angrySteamGroup: THREE.Group;
  sprayMistGroup: THREE.Group;
  celebrateStarsGroup: THREE.Group;
  brakeSmokeGroup: THREE.Group;
}

export function createVfxRig(
  scene: THREE.Scene,
  setting: SceneSetting,
  vfxStyle: VfxStyle,
  primaryHex: string,
  secondaryHex: string,
  seed: number,
): VfxRig {
  const group = new THREE.Group();
  scene.add(group);

  // Soft circular glow sprite texture generated in 2D canvas
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 64;
  spriteCanvas.height = 64;
  const sctx = spriteCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const particleTex = new THREE.CanvasTexture(spriteCanvas);

  let mode: VfxRig['particleMode'] = 'upward';
  if (vfxStyle === 'ComedyBurst' || setting === 'ComedyStage') mode = 'star';
  else if (setting === 'ForestAshram') mode = 'firefly';
  else if (setting === 'Himalaya') mode = 'snow';
  else if (vfxStyle === 'DivineAura' || setting === 'PalaceCourt') mode = 'petal';

  const count = 110;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  const c1 = new THREE.Color(primaryHex);
  const c2 = new THREE.Color(secondaryHex);
  const white = new THREE.Color(0xfff7d6);

  let rng = (seed ^ 0x9e3779b9) >>> 0;
  const nextRand = () => {
    rng = (Math.imul(1664525, rng) + 1013904223) >>> 0;
    return rng / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const px = (nextRand() - 0.5) * 6.2;
    const py = nextRand() * 4.2;
    const pz = (nextRand() - 0.5) * 4.5 - 0.4;
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;

    seeds[i * 3] = nextRand() * 6.283;
    seeds[i * 3 + 1] = 0.4 + nextRand() * 0.9;
    seeds[i * 3 + 2] = px;

    const pick = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : white;
    colors[i * 3] = pick.r;
    colors[i * 3 + 1] = pick.g;
    colors[i * 3 + 2] = pick.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const ambientMat = new THREE.PointsMaterial({
    size: mode === 'star' ? 0.065 : 0.12,
    map: particleTex,
    vertexColors: true,
    transparent: true,
    opacity: mode === 'star' ? 0.16 : 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ambientPoints = new THREE.Points(geo, ambientMat);
  if (mode === 'star') ambientPoints.visible = false;
  group.add(ambientPoints);

  // Comic / Emotion reaction burst ring
  const burstCount = 36;
  const burstPositions = new Float32Array(burstCount * 3);
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
  const burstMat = new THREE.PointsMaterial({
    size: 0.16,
    map: particleTex,
    color: 0xfde047,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const burstPoints = new THREE.Points(burstGeo, burstMat);
  group.add(burstPoints);

  // Soft volumetric diagonal god-ray light cones with smooth edge & vertical falloff shader
  // Keep MJO-style comedy rooms razor-clean without dusty beam haze over faces.
  const godRays: THREE.Mesh[] = [];
  if (setting !== 'ModernCity' && mode !== 'star') {
    for (let r = 0; r < 4; r++) {
      const rayMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(primaryHex) },
          uOpacity: { value: 0.08 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float rim = pow(abs(dot(normalize(vNormal), normalize(vViewDir))), 2.2);
            float vertFade = smoothstep(0.0, 0.55, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
            gl_FragColor = vec4(uColor, uOpacity * rim * vertFade);
          }
        `,
      });
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.85, 7.2, 20, 1, true), rayMat);
      ray.position.set(-1.6 + r * 1.05, 2.6, -1.9);
      ray.rotation.z = -0.32 + r * 0.1;
      group.add(ray);
      godRays.push(ray);
    }
  }

  // Helical dialogue energy stream motes between active speaker and listener
  const streamDots: THREE.Mesh[] = [];
  for (let d = 0; d < 7; d++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 10, 8),
      new THREE.MeshBasicMaterial({
        color: secondaryHex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(dot);
    streamDots.push(dot);
  }

  // Action-reactive cartoon VFX groups (sleep bubbles/Z, shock spikes, dizzy stars, footstep dust)
  const sleepZGroup = new THREE.Group();
  const sleepMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 });
  for (let z = 0; z < 3; z++) {
    const zBlock = new THREE.Group();
    const s = 0.06 + z * 0.028;
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * 0.35, s * 0.35), sleepMat);
    topBar.position.y = s * 0.7;
    const midBar = new THREE.Mesh(new THREE.BoxGeometry(s * 1.8, s * 0.32, s * 0.35), sleepMat);
    midBar.rotation.z = 0.72;
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * 0.35, s * 0.35), sleepMat);
    botBar.position.y = -s * 0.7;
    zBlock.add(topBar, midBar, botBar);
    sleepZGroup.add(zBlock);
  }
  sleepZGroup.visible = false;
  group.add(sleepZGroup);

  const shockBurstGroup = new THREE.Group();
  const spikeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
  for (let s = 0; s < 6; s++) {
    const ang = (s / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.16, 4), spikeMat);
    spike.position.set(Math.cos(ang) * 0.22, Math.sin(ang) * 0.22, 0);
    spike.rotation.z = ang - Math.PI / 2;
    shockBurstGroup.add(spike);
  }
  shockBurstGroup.visible = false;
  group.add(shockBurstGroup);

  const dizzyStarsGroup = new THREE.Group();
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  for (let s = 0; s < 3; s++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.068, 0), starMat);
    dizzyStarsGroup.add(star);
  }
  dizzyStarsGroup.visible = false;
  group.add(dizzyStarsGroup);

  const dustGroup = new THREE.Group();
  const dustMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.55 });
  for (let d = 0; d < 4; d++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), dustMat);
    dustGroup.add(puff);
  }
  dustGroup.visible = false;
  group.add(dustGroup);

  const hairCutGroup = new THREE.Group();
  const hairMat = new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.94 });
  for (let h = 0; h < 12; h++) {
    const strand = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.022, 0.024), hairMat);
    hairCutGroup.add(strand);
  }
  hairCutGroup.visible = false;
  group.add(hairCutGroup);

  // MJO Cartoon Angry Ear-Steam Puffs + Anger Bolt Pop
  const angrySteamGroup = new THREE.Group();
  const steamPuffMat = new THREE.MeshBasicMaterial({ color: 0xfef2f2, transparent: true, opacity: 0.85 });
  const redAngerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.92 });
  for (let p = 0; p < 6; p++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.065 + (p % 2) * 0.022, 8, 6),
      p % 3 === 2 ? redAngerMat : steamPuffMat,
    );
    angrySteamGroup.add(puff);
  }
  angrySteamGroup.visible = false;
  group.add(angrySteamGroup);

  // Salon Water Spray Mist Droplets
  const sprayMistGroup = new THREE.Group();
  const mistMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.82 });
  for (let m = 0; m < 10; m++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 5), mistMat);
    sprayMistGroup.add(drop);
  }
  sprayMistGroup.visible = false;
  group.add(sprayMistGroup);

  // Golden celebration / achievement sparkle burst ("Ta-Da / Job Done / Coin!")
  const celebrateStarsGroup = new THREE.Group();
  const celebColors = [0xfacc15, 0xfde047, 0x38bdf8, 0xf472b6, 0x4ade80];
  for (let c = 0; c < 10; c++) {
    const spark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.062 + (c % 2) * 0.025, 0),
      new THREE.MeshBasicMaterial({ color: celebColors[c % celebColors.length], transparent: true, opacity: 0.94 }),
    );
    celebrateStarsGroup.add(spark);
  }
  celebrateStarsGroup.visible = false;
  group.add(celebrateStarsGroup);

  // Tire brake-skid smoke billows for vehicle/brake comedy beats
  const brakeSmokeGroup = new THREE.Group();
  const smokeMatDark = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.72 });
  const smokeMatLight = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.78 });
  for (let b = 0; b < 8; b++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.095 + (b % 3) * 0.028, 8, 6),
      b % 2 === 0 ? smokeMatDark : smokeMatLight,
    );
    brakeSmokeGroup.add(puff);
  }
  brakeSmokeGroup.visible = false;
  group.add(brakeSmokeGroup);

  return {
    group,
    ambientPoints,
    ambientPositions: positions,
    ambientSeeds: seeds,
    burstPoints,
    burstPositions,
    burstMat,
    streamDots,
    godRays,
    particleMode: mode,
    sleepZGroup,
    shockBurstGroup,
    dizzyStarsGroup,
    dustGroup,
    hairCutGroup,
    angrySteamGroup,
    sprayMistGroup,
    celebrateStarsGroup,
    brakeSmokeGroup,
  };
}

export function updateVfxRig(
  vfx: VfxRig,
  t: number,
  u: number,
  activeSlot: 'Left' | 'Right' | 'Narrator',
  leftX: number,
  rightX: number,
  emotion: EmotionKind,
  turnLocalProgress: number,
  primaryHex: string,
  secondaryHex: string,
  leftAction = 'none',
  rightAction = 'none',
  leftY = 0,
  rightY = 0,
  memeActive = false,
  leftEmotion: EmotionKind = 'calm',
  rightEmotion: EmotionKind = 'calm',
  centerAngrySnap = false,
  sfxCue: string | null = null,
): void {
  const count = vfx.ambientPositions.length / 3;
  const climbDown = vfx.particleMode === 'snow' || (vfx.particleMode === 'petal' && u > 0.6);

  for (let i = 0; i < count; i++) {
    const phase = vfx.ambientSeeds[i * 3];
    const speed = vfx.ambientSeeds[i * 3 + 1];
    const baseX = vfx.ambientSeeds[i * 3 + 2];

    if (vfx.particleMode === 'firefly') {
      vfx.ambientPositions[i * 3] = baseX + Math.sin(t * 0.9 * speed + phase) * 0.45;
      vfx.ambientPositions[i * 3 + 1] = 0.4 + ((i * 0.17 + Math.sin(t * 0.65 + phase) * 0.6) % 2.8 + 2.8) % 2.8;
    } else {
      const cycle = ((t * 0.14 * speed + phase * 0.15) % 1 + 1) % 1;
      vfx.ambientPositions[i * 3] = baseX + Math.sin(t * 1.1 + phase) * 0.25;
      vfx.ambientPositions[i * 3 + 1] = climbDown ? 3.9 - cycle * 3.8 : 0.15 + cycle * 3.8;
    }
  }
  vfx.ambientPoints.geometry.attributes.position.needsUpdate = true;

  // Volumetric god-rays sway gently
  for (let r = 0; r < vfx.godRays.length; r++) {
    const ray = vfx.godRays[r];
    const mat = ray.material as THREE.ShaderMaterial;
    mat.uniforms.uOpacity.value = 0.075 + 0.04 * Math.sin(t * 0.8 + r * 1.1);
  }

  // Speaker dialogue energy wave motes flowing toward listener (suppressed in Comedy mode for razor-clean faces)
  const isComedySet = vfx.particleMode === 'star';
  const hasActiveSpeaker = activeSlot === 'Left' || activeSlot === 'Right';
  const streamColor = activeSlot === 'Left' ? primaryHex : secondaryHex;
  for (let d = 0; d < vfx.streamDots.length; d++) {
    const dot = vfx.streamDots[d];
    const mat = dot.material as THREE.MeshBasicMaterial;
    if (!hasActiveSpeaker || isComedySet) {
      mat.opacity = 0;
      continue;
    }
    const srcX = activeSlot === 'Left' ? leftX + 0.2 : rightX - 0.2;
    const dstX = activeSlot === 'Left' ? rightX - 0.2 : leftX + 0.2;
    const frac = (t * 1.35 + d / vfx.streamDots.length) % 1;
    dot.position.set(
      srcX + (dstX - srcX) * frac,
      1.38 + Math.sin(frac * Math.PI) * 0.42 + Math.sin(t * 7 + d) * 0.03,
      -0.38 + Math.cos(t * 6 + d) * 0.06,
    );
    mat.color.set(streamColor);
    mat.opacity = Math.sin(frac * Math.PI) * 0.22;
  }

  // Reaction VFX burst near active speaker (kept behind silhouette; in Comedy mode reserved for meme cutaways so acting stays clean)
  const showBurst = hasActiveSpeaker && (isComedySet ? memeActive : ((emotion === 'laughing' || emotion === 'surprised' || emotion === 'proud' || memeActive) && (turnLocalProgress < 0.40 || memeActive)));
  if (showBurst) {
    const k = Math.min(1, turnLocalProgress / 0.40);
    const centerX = activeSlot === 'Left' ? leftX : rightX;
    vfx.burstMat.color.setHex(emotion === 'angry' ? 0xf97316 : 0xfde047);
    const bCount = vfx.burstPositions.length / 3;
    for (let i = 0; i < bCount; i++) {
      const ang = (i / bCount) * Math.PI * 2;
      const rad = 0.68 + k * 0.92;
      vfx.burstPositions[i * 3] = centerX + Math.cos(ang) * rad;
      vfx.burstPositions[i * 3 + 1] = 1.55 + Math.sin(ang) * rad * 0.85 - k * 0.16;
      vfx.burstPositions[i * 3 + 2] = isComedySet ? -1.08 : -0.42;
    }
    vfx.burstPoints.geometry.attributes.position.needsUpdate = true;
    vfx.burstMat.opacity = (1 - k * 0.82) * (isComedySet ? 0.36 : 0.45);
  } else {
    vfx.burstMat.opacity = 0;
  }

  // 1) Floating "Zzz" blocks when either character is sleeping (hover cleanly over pillow, never blocking close-ups)
  const leftAsleep = leftAction === 'sleeping';
  const rightAsleep = rightAction === 'sleeping';
  if (leftAsleep || rightAsleep) {
    vfx.sleepZGroup.visible = true;
    const sx = leftAsleep ? leftX : rightX;
    const sy = (leftAsleep ? leftY : rightY) + 0.62;
    const sz = leftAsleep && leftY > 0.25 ? -0.78 : -0.35;
    vfx.sleepZGroup.children.forEach((child, idx) => {
      const cycle = (t * 0.55 + idx * 0.33) % 1;
      child.position.set(sx + Math.sin(t * 2.2 + idx) * 0.12 + cycle * 0.14, sy + cycle * 0.65, sz);
      child.rotation.z = Math.sin(t * 1.8 + idx) * 0.22;
      const sc = Math.sin(cycle * Math.PI) * 0.85;
      child.scale.setScalar(Math.max(0.01, sc));
    });
  } else {
    vfx.sleepZGroup.visible = false;
  }

  // 2) Comic shock starburst positioned cleanly ABOVE head top ONLY on comedy/cartoon sets
  const speakerX = centerAngrySnap ? 0 : activeSlot === 'Right' ? rightX : leftX;
  const speakerY = centerAngrySnap ? 0.04 : activeSlot === 'Right' ? rightY : leftY;
  const speakerAct = centerAngrySnap ? 'corpseSnapUp' : activeSlot === 'Right' ? rightAction : leftAction;
  const showShock = isComedySet && (centerAngrySnap || memeActive || ((speakerAct === 'shockedFall' || speakerAct === 'wakingUp' || emotion === 'surprised') && turnLocalProgress < 0.42));
  // Comic "POW" flash on the opponent ONLY during comedy fist/kick bouts
  const leftStrike = isComedySet && (leftAction === 'punching' || leftAction === 'kicking');
  const rightStrike = isComedySet && (rightAction === 'punching' || rightAction === 'kicking');
  const strikeKind = (leftStrike ? leftAction : rightAction) as 'punching' | 'kicking';
  const impact = leftStrike || rightStrike ? strikePhase(t, strikeKind).recoil : 0;
  if (impact > 0.08) {
    const victimX = leftStrike ? rightX : leftX;
    const victimY = leftStrike ? rightY : leftY;
    vfx.shockBurstGroup.visible = true;
    vfx.shockBurstGroup.position.set(victimX + (leftStrike ? -0.28 : 0.28), victimY + (strikeKind === 'kicking' ? 0.95 : 1.45), -0.05);
    vfx.shockBurstGroup.rotation.z = t * 3.1;
    vfx.shockBurstGroup.scale.setScalar(0.45 + impact * 0.85);
  } else if (showShock) {
    vfx.shockBurstGroup.visible = true;
    vfx.shockBurstGroup.position.set(speakerX, speakerY + 2.08, -0.18);
    vfx.shockBurstGroup.rotation.z = t * 2.2;
    const pulse = 0.88 + 0.18 * Math.sin(t * 16);
    vfx.shockBurstGroup.scale.setScalar(pulse);
  } else {
    vfx.shockBurstGroup.visible = false;
  }

  // 3) Orbiting dizzy stars when confused or slapping forehead
  const showDizzy = leftAction === 'slapForehead' || rightAction === 'slapForehead' || emotion === 'confused';
  if (showDizzy) {
    vfx.dizzyStarsGroup.visible = true;
    const dx = rightAction === 'slapForehead' ? rightX : leftAction === 'slapForehead' ? leftX : speakerX;
    const dy = (rightAction === 'slapForehead' ? rightY : leftAction === 'slapForehead' ? leftY : speakerY) + 1.82;
    vfx.dizzyStarsGroup.children.forEach((star, idx) => {
      const ang = t * 4.5 + (idx / 3) * Math.PI * 2;
      star.position.set(dx + Math.cos(ang) * 0.28, dy + Math.sin(ang * 2) * 0.04, Math.sin(ang) * 0.24);
      star.rotation.y = t * 5;
    });
  } else {
    vfx.dizzyStarsGroup.visible = false;
  }

  // 4) Footstep dust puffs when walking or running
  const walkerLeft = leftAction === 'walking' || leftAction === 'running';
  const walkerRight = rightAction === 'walking' || rightAction === 'running';
  if (walkerLeft || walkerRight) {
    vfx.dustGroup.visible = true;
    const wx = walkerLeft ? leftX : rightX;
    const wy = (walkerLeft ? leftY : rightY) + 0.06;
    vfx.dustGroup.children.forEach((puff, idx) => {
      const cycle = (t * (leftAction === 'running' || rightAction === 'running' ? 3.2 : 1.8) + idx * 0.25) % 1;
      puff.position.set(wx - cycle * 0.35 + (idx % 2 === 0 ? -0.1 : 0.1), wy + cycle * 0.28, -0.05);
      puff.scale.setScalar(Math.max(0.01, Math.sin(cycle * Math.PI) * 1.25));
    });
  } else {
    vfx.dustGroup.visible = false;
  }

  // 5) Prominent falling dark clipped hair locks dropping off Customer's head onto cape & floor during cutting
  const leftCutting = leftAction === 'cutting';
  const rightCutting = rightAction === 'cutting';
  if (leftCutting || rightCutting) {
    vfx.hairCutGroup.visible = true;
    const custX = leftCutting ? rightX : leftX;
    const custCrownY = (leftCutting ? rightY : leftY) + 1.44;
    const custZ = -0.60;
    vfx.hairCutGroup.children.forEach((strand, idx) => {
      const cycle = (t * 2.25 + idx * 0.13) % 1;
      const side = (idx % 2 === 0 ? 1 : -1) * (0.09 + cycle * 0.28);
      strand.position.set(custX + side + Math.sin(t * 7 + idx) * 0.04, custCrownY - cycle * 1.12, custZ + 0.08);
      strand.rotation.set(t * 6 + idx, idx * 0.9, t * 8);
      strand.scale.setScalar(Math.max(0.08, Math.sin(cycle * Math.PI) * 1.25));
    });
  } else {
    vfx.hairCutGroup.visible = false;
  }

  // 6) MJO Cartoon Angry Ear-Steam Puffs cleanly framing the furious character's own ears without blocking neighbors
  const leftAngry = leftEmotion === 'angry';
  const rightAngry = rightEmotion === 'angry';
  if (leftAngry || rightAngry || centerAngrySnap) {
    vfx.angrySteamGroup.visible = true;
    const ax = centerAngrySnap ? 0 : rightAngry ? rightX : leftX;
    const ay = (centerAngrySnap ? 0.06 : rightAngry ? rightY : leftY) + 1.54;
    const az = centerAngrySnap ? -0.06 : rightAngry ? -0.68 : -0.58;
    vfx.angrySteamGroup.children.forEach((puff, idx) => {
      const side = idx % 2 === 0 ? -1 : 1;
      const cycle = (t * 2.4 + Math.floor(idx / 2) * 0.34) % 1;
      puff.position.set(ax + side * (0.24 + cycle * 0.22), ay + cycle * 0.36, az);
      puff.scale.setScalar(Math.max(0.05, Math.sin(cycle * Math.PI) * 0.68));
    });
  } else {
    vfx.angrySteamGroup.visible = false;
  }

  // 7) Water Spray Mist burst when Barber uses Spray Bottle
  const leftSpraying = leftAction === 'spraying';
  const rightSpraying = rightAction === 'spraying';
  if (leftSpraying || rightSpraying) {
    vfx.sprayMistGroup.visible = true;
    const tx = leftSpraying ? rightX : leftX;
    const ty = (leftSpraying ? rightY : leftY) + 1.48;
    const sx = leftSpraying ? leftX : rightX;
    vfx.sprayMistGroup.children.forEach((drop, idx) => {
      const cycle = (t * 3.6 + idx * 0.10) % 1;
      const spreadY = ((idx % 5) - 2) * 0.055;
      drop.position.set(sx + (tx - sx) * (0.35 + cycle * 0.65), ty + spreadY + Math.sin(cycle * 3) * 0.04, -0.62);
      drop.scale.setScalar(Math.max(0.1, (1 - cycle * 0.4) * 1.15));
    });
  } else {
    vfx.sprayMistGroup.visible = false;
  }

  // 8) Achievement / Ta-Da victory sparkles around proud/celebrating speaker
  const showCelebrate = leftAction === 'celebrate'
    || rightAction === 'celebrate'
    || leftEmotion === 'proud'
    || rightEmotion === 'proud'
    || sfxCue === 'tada'
    || sfxCue === 'coin';
  if (showCelebrate) {
    vfx.celebrateStarsGroup.visible = true;
    const cx = rightAction === 'celebrate' || rightEmotion === 'proud'
      ? rightX
      : leftAction === 'celebrate' || leftEmotion === 'proud'
        ? leftX
        : speakerX;
    const cy = (rightAction === 'celebrate' || rightEmotion === 'proud'
      ? rightY
      : leftAction === 'celebrate' || leftEmotion === 'proud'
        ? leftY
        : speakerY) + 1.55;
    vfx.celebrateStarsGroup.children.forEach((spark, idx) => {
      const cycle = (t * 1.9 + idx * 0.12) % 1;
      const ang = (idx / 10) * Math.PI * 2 + t * 2.2;
      const radius = 0.24 + cycle * 0.46;
      spark.position.set(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * 0.22 + cycle * 0.44, -0.46 + Math.sin(ang) * 0.16);
      spark.rotation.set(t * 4 + idx, t * 5, idx);
      spark.scale.setScalar(Math.max(0.05, Math.sin(cycle * Math.PI) * 1.25));
    });
  } else {
    vfx.celebrateStarsGroup.visible = false;
  }

  // 9) Screeching brake-skid smoke billows at ankle level during sudden vehicle stops
  const showBrakeSmoke = leftAction === 'brakeStop'
    || rightAction === 'brakeStop'
    || leftAction === 'hazardTruck'
    || rightAction === 'hazardTruck'
    || sfxCue === 'brake';
  if (showBrakeSmoke) {
    vfx.brakeSmokeGroup.visible = true;
    const bx = rightAction === 'brakeStop' || rightAction === 'hazardTruck'
      ? rightX
      : leftAction === 'brakeStop' || leftAction === 'hazardTruck'
        ? leftX
        : speakerX;
    const by = (rightAction === 'brakeStop' || rightAction === 'hazardTruck'
      ? rightY
      : leftAction === 'brakeStop' || leftAction === 'hazardTruck'
        ? leftY
        : speakerY) + 0.12;
    vfx.brakeSmokeGroup.children.forEach((puff, idx) => {
      const cycle = (t * 2.8 + idx * 0.14) % 1;
      const side = idx % 2 === 0 ? -1 : 1;
      puff.position.set(bx + side * (0.14 + cycle * 0.62), by + cycle * 0.42, -0.45 + (idx % 3) * 0.08);
      puff.scale.setScalar(Math.max(0.08, Math.sin(cycle * Math.PI) * 1.55));
    });
  } else {
    vfx.brakeSmokeGroup.visible = false;
  }
}
