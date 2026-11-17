import * as THREE from 'three';
import { EmotionKind, SceneSetting, VfxStyle } from './types';

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
  else if (vfxStyle === 'DivineAura') mode = 'petal';

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
    size: mode === 'star' ? 0.14 : 0.12,
    map: particleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ambientPoints = new THREE.Points(geo, ambientMat);
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
  const godRays: THREE.Mesh[] = [];
  if (setting !== 'ModernCity') {
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

  // Speaker dialogue energy wave motes flowing toward listener
  const hasActiveSpeaker = activeSlot === 'Left' || activeSlot === 'Right';
  const streamColor = activeSlot === 'Left' ? primaryHex : secondaryHex;
  for (let d = 0; d < vfx.streamDots.length; d++) {
    const dot = vfx.streamDots[d];
    const mat = dot.material as THREE.MeshBasicMaterial;
    if (!hasActiveSpeaker) {
      mat.opacity = 0;
      continue;
    }
    const srcX = activeSlot === 'Left' ? leftX + 0.2 : rightX - 0.2;
    const dstX = activeSlot === 'Left' ? rightX - 0.2 : leftX + 0.2;
    const frac = (t * 1.35 + d / vfx.streamDots.length) % 1;
    dot.position.set(
      srcX + (dstX - srcX) * frac,
      1.32 + Math.sin(frac * Math.PI) * 0.34 + Math.sin(t * 7 + d) * 0.03,
      0.18 + Math.cos(t * 6 + d) * 0.08,
    );
    mat.color.set(streamColor);
    mat.opacity = Math.sin(frac * Math.PI) * 0.65;
  }

  // Reaction VFX burst near active speaker on Laughing / Surprised / Proud / Angry lines
  const showBurst = hasActiveSpeaker && (emotion === 'laughing' || emotion === 'surprised' || emotion === 'proud') && turnLocalProgress < 0.45;
  if (showBurst) {
    const k = turnLocalProgress / 0.45;
    const centerX = activeSlot === 'Left' ? leftX : rightX;
    const bCount = vfx.burstPositions.length / 3;
    for (let i = 0; i < bCount; i++) {
      const ang = (i / bCount) * Math.PI * 2;
      const rad = 0.25 + k * 1.15;
      vfx.burstPositions[i * 3] = centerX + Math.cos(ang) * rad;
      vfx.burstPositions[i * 3 + 1] = 1.45 + Math.sin(ang) * rad * 0.85 - k * 0.22;
      vfx.burstPositions[i * 3 + 2] = 0.35;
    }
    vfx.burstPoints.geometry.attributes.position.needsUpdate = true;
    vfx.burstMat.opacity = (1 - k) * 0.85;
  } else {
    vfx.burstMat.opacity = 0;
  }
}
