import * as THREE from 'three';
import { RenderJobJson, SceneSetting, SceneTimeOfDay, StageLayoutJson } from './types';

export interface EnvironmentRig {
  group: THREE.Group;
  skyMaterial: THREE.ShaderMaterial;
  keyLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  ambientFireLights: { light: THREE.PointLight; baseIntensity: number; phase: number }[];
  animatedProps: {
    object: THREE.Object3D;
    kind: 'bell' | 'sway' | 'ring' | 'spotlight' | 'water' | 'diya' | 'steam' | 'portal' | 'door' | 'hazard';
    baseRotZ?: number;
    baseY?: number;
    phase: number;
    speed: number;
  }[];
  backdropMesh?: THREE.Mesh;
  poleStarGroup?: THREE.Group;
  poleStarMat?: THREE.MeshBasicMaterial;
  backdropTextures: THREE.DataTexture[];
}

function getTimeColors(
  time: SceneTimeOfDay,
  palette: RenderJobJson['palette'],
): { top: number; mid: number; bot: number; sunColor: number; sunIntensity: number; fogDensity: number } {
  const topCol = new THREE.Color(palette.topBackdropHex);
  const midCol = new THREE.Color(palette.midBackdropHex);
  const botCol = new THREE.Color(palette.botBackdropHex);

  if (time === 'Night') {
    topCol.lerp(new THREE.Color(0x060919), 0.72);
    midCol.lerp(new THREE.Color(0x131d42), 0.72);
    botCol.lerp(new THREE.Color(0x0a0d1c), 0.72);
    return { top: topCol.getHex(), mid: midCol.getHex(), bot: botCol.getHex(), sunColor: 0xa5b4fc, sunIntensity: 1.05, fogDensity: 0.055 };
  }
  if (time === 'Sunset') {
    topCol.lerp(new THREE.Color(0x31143d), 0.65);
    midCol.lerp(new THREE.Color(0xc2492d), 0.65);
    botCol.lerp(new THREE.Color(0x281018), 0.65);
    return { top: topCol.getHex(), mid: midCol.getHex(), bot: botCol.getHex(), sunColor: 0xffa65c, sunIntensity: 1.75, fogDensity: 0.042 };
  }
  if (time === 'Day') {
    topCol.lerp(new THREE.Color(0x38bdf8), 0.55);
    midCol.lerp(new THREE.Color(0x93c5fd), 0.55);
    botCol.lerp(new THREE.Color(0x1e3a5f), 0.55);
    return { top: topCol.getHex(), mid: midCol.getHex(), bot: botCol.getHex(), sunColor: 0xfff5e0, sunIntensity: 2.0, fogDensity: 0.025 };
  }
  // Dawn / Auto default: warm golden saffron gradient blended with fixed event palette
  topCol.lerp(new THREE.Color(0x1e1136), 0.48);
  midCol.lerp(new THREE.Color(0xb84624), 0.42);
  botCol.lerp(new THREE.Color(0x1a0f18), 0.48);
  return { top: topCol.getHex(), mid: midCol.getHex(), bot: botCol.getHex(), sunColor: 0xffcf87, sunIntensity: 1.85, fogDensity: 0.036 };
}

function addDiya(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  phase: number,
  env: EnvironmentRig,
  withPointLight: boolean,
): void {
  const brass = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 });
  const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.07, 14), brass);
  bowl.rotation.x = Math.PI;
  bowl.position.set(x, y + 0.035, z);
  parent.add(bowl);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.1, 10),
    new THREE.MeshBasicMaterial({ color: 0xffdf6b }),
  );
  flame.position.set(x, y + 0.11, z);
  parent.add(flame);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xff9f1c, transparent: true, opacity: 0.3, depthWrite: false }),
  );
  halo.position.set(x, y + 0.11, z);
  parent.add(halo);

  env.animatedProps.push({ object: flame, kind: 'diya', baseY: y + 0.11, phase, speed: 7.5 });

  if (withPointLight) {
    const pt = new THREE.PointLight(0xff9f38, 1.4, 5.5, 1.6);
    pt.position.set(x, y + 0.22, z);
    parent.add(pt);
    env.ambientFireLights.push({ light: pt, baseIntensity: 1.4, phase });
  }
}

function addTree(parent: THREE.Group, x: number, z: number, scale: number, leafColor: number, phase: number, env: EnvironmentRig): void {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1d, roughness: 0.85 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.15 * scale, 1.5 * scale, 10), barkMat);
  trunk.position.y = 0.75 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.72 });
  const crownOffsets: [number, number, number, number][] = [
    [0, 1.65, 0, 0.65],
    [-0.36, 1.42, 0.15, 0.48],
    [0.38, 1.45, -0.1, 0.48],
    [0, 1.95, 0.08, 0.44],
  ];
  for (const [cx, cy, cz, r] of crownOffsets) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r * scale, 1), leafMat);
    puff.position.set(cx * scale, cy * scale, cz * scale);
    puff.castShadow = true;
    puff.receiveShadow = true;
    tree.add(puff);
  }
  parent.add(tree);
  env.animatedProps.push({ object: tree, kind: 'sway', baseRotZ: 0, phase, speed: 1.1 });
}

function addTempleMandap(group: THREE.Group, env: EnvironmentRig): void {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b3a2c, roughness: 0.78 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5b82e, metalness: 0.82, roughness: 0.25 });

  // Stone stage floor with circular golden lotus inlay
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.8, 0.25, 36), stoneMat);
  floor.position.y = -0.125;
  floor.receiveShadow = true;
  group.add(floor);

  const stageRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.55, 48),
    new THREE.MeshBasicMaterial({ color: 0xf5b82e, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  );
  stageRing.rotation.x = -Math.PI / 2;
  stageRing.position.y = 0.01;
  group.add(stageRing);

  // Sculpted sandstone Mandap pillars
  for (const px of [-2.4, -1.65, 1.65, 2.4]) {
    const pz = Math.abs(px) > 2 ? -1.4 : -2.6;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.6, 12), stoneMat);
    pillar.position.set(px, 1.8, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.18, 12), goldMat);
    cap.position.set(px, 3.5, pz);
    group.add(cap);
  }

  // Distant multi-tier carved temple Shikhara dome & Kalash spire
  const shikharaBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.5), stoneMat);
  shikharaBase.position.set(0, 0.45, -4.8);
  group.add(shikharaBase);
  for (let tier = 0; tier < 3; tier++) {
    const w = 1.25 - tier * 0.28;
    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.48, w), stoneMat);
    tMesh.position.set(0, 1.1 + tier * 0.46, -4.8);
    group.add(tMesh);
  }
  const kalash = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), goldMat);
  kalash.position.set(0, 2.38, -4.8);
  group.add(kalash);
  const kalashTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 12), goldMat);
  kalashTip.position.set(0, 2.60, -4.8);
  group.add(kalashTip);

  // Two swinging hanging brass temple bells in upper framing corners
  for (const [bx, ph] of [[-1.35, 0], [1.35, 1.3]] as [number, number][]) {
    const bellPivot = new THREE.Group();
    bellPivot.position.set(bx, 3.35, -0.6);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.65, 8), goldMat);
    chain.position.y = -0.32;
    bellPivot.add(chain);
    const bellBody = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 16, 1, true), goldMat);
    bellBody.position.y = -0.72;
    bellBody.castShadow = true;
    bellPivot.add(bellBody);
    group.add(bellPivot);
    env.animatedProps.push({ object: bellPivot, kind: 'bell', baseRotZ: 0, phase: ph, speed: 1.5 });
  }

  // Rotating 3D Sri Yantra aura rings behind stage
  const yantra = new THREE.Group();
  yantra.position.set(0, 1.85, -3.1);
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.025, 10, 48), goldMat);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.022, 10, 36), goldMat);
  yantra.add(r1, r2);
  group.add(yantra);
  env.animatedProps.push({ object: r1, kind: 'ring', phase: 0, speed: 0.35 });
  env.animatedProps.push({ object: r2, kind: 'ring', phase: 1.4, speed: -0.52 });

  // Warm flickering stone-step Diyas
  addDiya(group, -1.25, 0, -0.5, 0.2, env, true);
  addDiya(group, 1.25, 0, -0.5, 1.9, env, true);
  addDiya(group, -0.45, 0, -1.4, 3.1, env, false);
  addDiya(group, 0.45, 0, -1.4, 4.4, env, false);
}

function addForestAshram(group: THREE.Group, env: EnvironmentRig): void {
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x264224, roughness: 0.92 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 40), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Warm clay + thatched Ashram hut in midground
  const hut = new THREE.Group();
  hut.position.set(0.1, 0, -3.2);
  const mudWall = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 1.05, 18), new THREE.MeshStandardMaterial({ color: 0x9c6e46, roughness: 0.85 }));
  mudWall.position.y = 0.52;
  mudWall.castShadow = true;
  mudWall.receiveShadow = true;
  hut.add(mudWall);
  const thatch = new THREE.Mesh(new THREE.ConeGeometry(1.38, 0.95, 20), new THREE.MeshStandardMaterial({ color: 0xbfa04e, roughness: 0.9 }));
  thatch.position.y = 1.42;
  thatch.castShadow = true;
  hut.add(thatch);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.65), new THREE.MeshBasicMaterial({ color: 0xffb74d }));
  doorGlow.position.set(0, 0.34, 0.96);
  hut.add(doorGlow);
  group.add(hut);

  // Lush 3D trees framing the grove
  addTree(group, -2.1, -1.8, 1.45, 0x2f6e37, 0.3, env);
  addTree(group, 2.2, -1.9, 1.38, 0x377a3f, 1.6, env);
  addTree(group, -1.65, -3.9, 1.65, 0x235229, 2.8, env);
  addTree(group, 1.75, -4.1, 1.55, 0x295f30, 4.1, env);

  // Warm Havan / Campfire glowing pit near center-back
  addDiya(group, 0, 0, -1.4, 0.5, env, true);
}

function addRiverGhat(group: THREE.Group, env: EnvironmentRig): void {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5c4738, roughness: 0.8 });
  const stage = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 2.6), stoneMat);
  stage.position.set(0, -0.15, 0);
  stage.receiveShadow = true;
  group.add(stage);

  const ghatStep = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 0.8), stoneMat);
  ghatStep.position.set(0, -0.25, -1.6);
  group.add(ghatStep);

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x134e6f,
    metalness: 0.68,
    roughness: 0.22,
  });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(18, 10, 24, 16), waterMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, -0.32, -6.5);
  river.receiveShadow = true;
  group.add(river);
  env.animatedProps.push({ object: river, kind: 'water', phase: 0, speed: 1.8 });

  addDiya(group, -1.1, 0, -0.9, 0.4, env, true);
  addDiya(group, 1.1, 0, -0.9, 2.1, env, true);
  addDiya(group, -0.6, -0.3, -2.5, 3.4, env, false);
  addDiya(group, 0.7, -0.3, -3.3, 4.9, env, false);
}

function addCosmosStage(group: THREE.Group, env: EnvironmentRig, accentHex: string): void {
  const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x10132a, metalness: 0.7, roughness: 0.24 });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.2, 48), obsidianMat);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  group.add(floor);

  const accentMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.75 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });

  const orbitGroup = new THREE.Group();
  orbitGroup.position.set(0, 2.0, -3.4);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.025, 10, 64), goldMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.022, 10, 48), accentMat);
  ring2.rotation.x = 0.7;
  orbitGroup.add(ring1, ring2);
  group.add(orbitGroup);

  env.animatedProps.push({ object: ring1, kind: 'ring', phase: 0.2, speed: 0.35 });
  env.animatedProps.push({ object: ring2, kind: 'ring', phase: 1.5, speed: -0.55 });

  // Emerging Dhruva Tara (Pole Star) + Saptarishi beacon
  const starGroup = new THREE.Group();
  starGroup.position.set(0, 2.75, -2.8);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfff5bd, transparent: true, opacity: 0 });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), starMat);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 3.6, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe484, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  beam.position.y = -1.6;
  starGroup.add(core, beam);
  group.add(starGroup);
  env.poleStarGroup = starGroup;
  env.poleStarMat = beam.material as THREE.MeshBasicMaterial;
}

function addComedyStage(group: THREE.Group, env: EnvironmentRig): void {
  // Polished wooden theatre stage
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x613820, roughness: 0.45, metalness: 0.1 });
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.25, 40), woodMat);
  stage.position.y = -0.125;
  stage.receiveShadow = true;
  group.add(stage);

  // Warm illuminated brick/stage backwall + velvet curtains framing left & right
  const wall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 0.25), new THREE.MeshStandardMaterial({ color: 0x451a24, roughness: 0.85 }));
  wall.position.set(0, 2.1, -3.5);
  wall.receiveShadow = true;
  group.add(wall);

  const velvetMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
  for (const side of [-1, 1]) {
    for (let fold = 0; fold < 3; fold++) {
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.4, 12), velvetMat);
      drape.position.set(side * (2.2 + fold * 0.36), 2.1, -2.8 + fold * 0.12);
      drape.castShadow = true;
      group.add(drape);
    }
  }

  // One central stand-up mic on stage foreground/center (never overlapping legs)
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.15 });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.024, 1.18, 8), chromeMat);
  stand.position.set(0, 0.59, 0.58);
  stand.castShadow = true;
  group.add(stand);
  const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.04, 16), chromeMat);
  micBase.position.set(0, 0.02, 0.58);
  group.add(micBase);
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), chromeMat);
  micHead.position.set(0, 1.21, 0.58);
  group.add(micHead);

  // Neon comedy ring sign on back wall
  const neonRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.028, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0xfb923c }),
  );
  neonRing.position.set(0, 2.25, -3.3);
  group.add(neonRing);

  // Two animated warm comic spotlights
  const spot1 = new THREE.SpotLight(0xfde047, 4.2, 12, 0.42, 0.55, 1.2);
  spot1.position.set(-1.6, 4.2, 2.2);
  group.add(spot1, spot1.target);
  env.animatedProps.push({ object: spot1, kind: 'spotlight', phase: 0, speed: 1.3 });

  const spot2 = new THREE.SpotLight(0xf472b6, 3.6, 12, 0.42, 0.55, 1.2);
  spot2.position.set(1.6, 4.2, 2.2);
  group.add(spot2, spot2.target);
  env.animatedProps.push({ object: spot2, kind: 'spotlight', phase: 1.7, speed: 1.5 });
}

function addChaiStall(group: THREE.Group, env: EnvironmentRig): void {
  const streetMat = new THREE.MeshStandardMaterial({ color: 0x2d2932, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), streetMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.72 });
  const stall = new THREE.Group();
  stall.position.set(0, 0, -2.0);

  // Tapri tea counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 0.7), woodMat);
  counter.position.y = 0.425;
  counter.castShadow = true;
  counter.receiveShadow = true;
  stall.add(counter);

  // Awning canopy + wooden posts
  for (const px of [-0.98, 0.98]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.15, 0.08), woodMat);
    post.position.set(px, 1.075, -0.25);
    stall.add(post);
  }
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.08, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 }),
  );
  awning.position.set(0, 2.15, 0.05);
  awning.rotation.x = 0.2;
  awning.castShadow = true;
  stall.add(awning);

  // Glowing brass kettle + clay kulhads + warm hanging bulb
  const brass = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.75, roughness: 0.25 });
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), brass);
  kettle.position.set(-0.35, 0.98, 0.05);
  stall.add(kettle);

  const clay = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  for (const kx of [0.1, 0.28, 0.46]) {
    const kulhad = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.09, 12), clay);
    kulhad.position.set(kx, 0.9, 0.08);
    stall.add(kulhad);
  }

  // Rising warm tea steam wisps
  for (let s = 0; s < 4; s++) {
    const wisp = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    wisp.position.set(-0.35 + (s % 2) * 0.06, 1.18 + s * 0.14, 0.05);
    stall.add(wisp);
    env.animatedProps.push({ object: wisp, kind: 'steam', baseY: 1.16, phase: s * 1.4, speed: 1.8 });
  }

  const bulb = new THREE.PointLight(0xffb74d, 2.6, 7, 1.5);
  bulb.position.set(0, 1.88, 0.25);
  stall.add(bulb);
  env.ambientFireLights.push({ light: bulb, baseIntensity: 2.6, phase: 0.4 });
  group.add(stall);
}

function addHimalayaStage(group: THREE.Group, env: EnvironmentRig): void {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const peakMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.82 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.55 });
  const peaks: [number, number, number, number][] = [
    [-2.4, -4.5, 2.6, 1.8],
    [0, -5.6, 3.8, 2.3],
    [2.5, -4.4, 2.4, 1.7],
  ];
  for (const [px, pz, h, r] of peaks) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), peakMat);
    mountain.position.set(px, h * 0.5 - 0.1, pz);
    group.add(mountain);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.45, h * 0.42, 7), snowMat);
    cap.position.set(px, h * 0.78 - 0.1, pz);
    group.add(cap);
  }
  addDiya(group, 0, 0, -1.1, 0.8, env, true);
}

function addGenericRichSet(group: THREE.Group, setting: SceneSetting, env: EnvironmentRig, accentHex: string): void {
  if (setting === 'ModernCity') {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ color: 0x090d1f, roughness: 0.35, metalness: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const grid = new THREE.GridHelper(20, 28, new THREE.Color(accentHex), 0x1e293b);
    grid.position.y = 0.01;
    group.add(grid);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({ color: accentHex, wireframe: true, emissive: accentHex, emissiveIntensity: 0.6 }),
    );
    crystal.position.set(0, 1.9, -2.5);
    group.add(crystal);
    env.animatedProps.push({ object: crystal, kind: 'ring', phase: 0, speed: 0.6 });
    return;
  }

  // PalaceCourt / Battlefield / Archive / Village: warm stone/wooden architectural floor & pillars
  const floorColor = setting === 'PalaceCourt' ? 0x5c2233 : setting === 'Battlefield' ? 0x3f2d22 : 0x453528;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8.5, 36), new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.78 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const pillarColor = setting === 'PalaceCourt' ? 0xd9a76a : setting === 'Archive' ? 0x694226 : 0x6b5340;
  const pillarMat = new THREE.MeshStandardMaterial({ color: pillarColor, roughness: 0.72 });
  for (const px of [-2.1, 2.1]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 0.35), pillarMat);
    col.position.set(px, 1.7, -2.4);
    col.castShadow = true;
    group.add(col);
  }
  addDiya(group, -1.5, 0, -1.2, 0.4, env, true);
  addDiya(group, 1.5, 0, -1.2, 2.0, env, true);
}

function addSkyGauntlet(group: THREE.Group, env: EnvironmentRig, variantSeed: number): void {
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.55 });
  const railMat = new THREE.MeshStandardMaterial({ color: variantSeed % 2 === 0 ? 0x22d3ee : 0xa855f7, emissive: 0x0ea5e9, emissiveIntensity: 0.55 });
  const catwalk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 9.5), deckMat);
  catwalk.position.set(0, -0.11, -1.5);
  catwalk.receiveShadow = true;
  group.add(catwalk);

  for (const sx of [-1.85, 1.85]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 9.5), railMat);
    strip.position.set(sx, -0.09, -1.5);
    group.add(strip);
  }

  const portalDefs: [number, number][] = [[-1.08, 0x22d3ee], [1.08, 0xf43f5e]];
  for (let i = 0; i < portalDefs.length; i++) {
    const [px, col] = portalDefs[i];
    const portal = new THREE.Group();
    portal.position.set(px, 1.15, -2.5);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.08, 12, 32),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.85, roughness: 0.2 }),
    );
    portal.add(ring);
    const veil = new THREE.Mesh(
      new THREE.CircleGeometry(0.70, 24),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.24, side: THREE.DoubleSide }),
    );
    portal.add(veil);
    group.add(portal);
    env.animatedProps.push({ object: ring, kind: 'portal', phase: i * 1.4, speed: 1.6 });
  }

  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
  for (let c = 0; c < 6; c++) {
    const cx = (c - 2.5) * 2.1;
    const cy = -1.2 + (c % 2) * 0.45;
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.95 + (c % 3) * 0.25, 12, 10), cloudMat);
    cloud.scale.set(1.8, 0.55, 1.1);
    cloud.position.set(cx, cy, -5.2 - (c % 2) * 1.2);
    group.add(cloud);
  }

  const hazard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 1.6, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }),
  );
  hazard.rotation.z = Math.PI / 2;
  hazard.position.set(0, 0.35, -1.0);
  group.add(hazard);
  env.animatedProps.push({ object: hazard, kind: 'hazard', phase: 0, speed: 1.9 });
}

function addTankArena(group: THREE.Group, env: EnvironmentRig): void {
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xa16236, roughness: 0.92 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(11, 36), sandMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7c3f23, roughness: 0.88 });
  for (const [rx, rz, h, r] of [[-3.4, -4.6, 2.2, 1.4], [0.4, -5.8, 2.8, 1.9], [3.5, -4.3, 2.0, 1.3]] as const) {
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, h, 8), rockMat);
    mesa.position.set(rx, h * 0.5 - 0.1, rz);
    mesa.castShadow = true;
    group.add(mesa);
  }

  const bagMat = new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.85 });
  for (let b = -2; b <= 2; b++) {
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.34, 6, 8), bagMat);
    bag.rotation.z = Math.PI / 2;
    bag.position.set(b * 0.56, 0.18, -2.3);
    bag.castShadow = true;
    group.add(bag);
  }
  const warnMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  for (const px of [-2.2, 2.2]) {
    const pylon = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.58, 12), warnMat);
    pylon.position.set(px, 0.29, -1.6);
    pylon.castShadow = true;
    group.add(pylon);
  }

  const fire = new THREE.PointLight(0xf97316, 2.4, 8, 1.5);
  fire.position.set(0, 1.4, -2.6);
  group.add(fire);
  env.ambientFireLights.push({ light: fire, baseIntensity: 2.4, phase: 0.6 });
}

function addDoorwaySet(group: THREE.Group, env: EnvironmentRig, variantSeed: number): void {
  const tileA = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.55 });
  const tileB = new THREE.MeshStandardMaterial({ color: variantSeed % 2 === 0 ? 0x334155 : 0x4c1d95, roughness: 0.55 });
  for (let x = -4; x <= 4; x++) {
    for (let z = -3; z <= 3; z++) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.98), (x + z) % 2 === 0 ? tileA : tileB);
      tile.position.set(x, -0.03, z);
      tile.receiveShadow = true;
      group.add(tile);
    }
  }

  const wallMat = new THREE.MeshStandardMaterial({
    color: variantSeed % 3 === 0 ? 0x4f46e5 : variantSeed % 3 === 1 ? 0x0f766e : 0xb45309,
    roughness: 0.78,
  });
  for (const sx of [-2.45, 2.45]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.2, 0.25), wallMat);
    wall.position.set(sx, 2.1, -2.8);
    wall.receiveShadow = true;
    group.add(wall);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 0.25), wallMat);
  lintel.position.set(0, 3.5, -2.8);
  group.add(lintel);

  const woodFrameMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.6 });
  for (const fx of [-0.78, 0.78]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.85, 0.34), woodFrameMat);
    post.position.set(fx, 1.425, -2.8);
    group.add(post);
  }
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.16, 0.36), woodFrameMat);
  topTrim.position.set(0, 2.86, -2.8);
  group.add(topTrim);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.7, 0, -2.76);
  const doorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 2.75, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }),
  );
  doorLeaf.position.set(0.69, 1.375, 0);
  doorLeaf.castShadow = true;
  doorPivot.add(doorLeaf);
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 }),
  );
  knob.position.set(1.22, 1.25, 0.07);
  doorPivot.add(knob);
  group.add(doorPivot);
  env.animatedProps.push({ object: doorPivot, kind: 'door', phase: 0.3, speed: 2.2 });
}

export function buildEnvironment(
  scene: THREE.Scene,
  job: RenderJobJson,
  setting: SceneSetting,
  timeOfDay: SceneTimeOfDay,
  backdropTextures: THREE.DataTexture[],
): EnvironmentRig {
  const { top, mid, bot, sunColor, sunIntensity, fogDensity } = getTimeColors(timeOfDay, job.palette);
  scene.fog = new THREE.FogExp2(mid, fogDensity);

  // Custom smooth sky gradient dome shader
  const skyGeo = new THREE.SphereGeometry(28, 32, 20);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(top) },
      uMid: { value: new THREE.Color(mid) },
      uBot: { value: new THREE.Color(bot) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uBot;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y * 1.4 + 0.35, 0.0, 1.0);
        vec3 col = h < 0.5 ? mix(uBot, uMid, h * 2.0) : mix(uMid, uTop, (h - 0.5) * 2.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMaterial);
  scene.add(skyDome);

  const hemiLight = new THREE.HemisphereLight(sunColor, bot, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(sunColor, sunIntensity);
  keyLight.position.set(2.8, 5.2, 3.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 16;
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;
  keyLight.shadow.bias = -0.0008;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(job.palette.secondaryHex, 0.65);
  rimLight.position.set(-3.0, 3.4, -3.5);
  scene.add(rimLight);

  const group = new THREE.Group();
  scene.add(group);

  const rig: EnvironmentRig = {
    group,
    skyMaterial,
    keyLight,
    hemiLight,
    ambientFireLights: [],
    animatedProps: [],
    backdropTextures,
  };

  if (backdropTextures.length > 0) {
    // User/AI photo backdrop mode: clean floor shadow catcher + textured background cinema plane
    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.ShadowMaterial({ opacity: 0.42 }),
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.receiveShadow = true;
    group.add(shadowCatcher);

    const aspect = job.width / job.height;
    const planeHeight = 6.2;
    const planeWidth = planeHeight * aspect;
    const backdropMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      new THREE.MeshBasicMaterial({ map: backdropTextures[0], depthWrite: false }),
    );
    backdropMesh.position.set(0, 1.32, -2.1);
    group.add(backdropMesh);
    rig.backdropMesh = backdropMesh;
    return rig;
  }

  switch (setting) {
    case 'Temple':
      addTempleMandap(group, rig);
      break;
    case 'ForestAshram':
      addForestAshram(group, rig);
      break;
    case 'RiverGhat':
      addRiverGhat(group, rig);
      break;
    case 'Cosmos':
      addCosmosStage(group, rig, job.palette.primaryHex);
      break;
    case 'ComedyStage':
      addComedyStage(group, rig);
      break;
    case 'ChaiStall':
      addChaiStall(group, rig);
      break;
    case 'SkyGauntlet':
      addSkyGauntlet(group, rig, job.uniqueVariant ?? job.seed ?? 0);
      break;
    case 'TankArena':
      addTankArena(group, rig);
      break;
    case 'DoorwaySet':
      addDoorwaySet(group, rig, job.uniqueVariant ?? job.seed ?? 0);
      break;
    case 'Himalaya':
      addHimalayaStage(group, rig);
      break;
    default:
      addGenericRichSet(group, setting, rig, job.palette.primaryHex);
      break;
  }

  return rig;
}

export function updateEnvironment(
  env: EnvironmentRig,
  t: number,
  u: number,
  sceneIndex: number,
  localProgress: number,
  layout?: StageLayoutJson | null,
): void {
  for (const fire of env.ambientFireLights) {
    fire.light.intensity = fire.baseIntensity * (0.86 + 0.14 * Math.sin(t * 9.5 + fire.phase));
  }

  for (const prop of env.animatedProps) {
    if (prop.kind === 'bell') {
      prop.object.rotation.z = Math.sin(t * prop.speed + prop.phase) * 0.16;
    } else if (prop.kind === 'sway') {
      prop.object.rotation.z = Math.sin(t * prop.speed + prop.phase) * 0.035;
    } else if (prop.kind === 'ring') {
      prop.object.rotation.z = t * prop.speed + prop.phase;
      prop.object.rotation.y = Math.sin(t * 0.4 + prop.phase) * 0.25;
    } else if (prop.kind === 'diya') {
      prop.object.scale.y = 0.85 + 0.22 * Math.sin(t * prop.speed + prop.phase);
      prop.object.scale.x = 0.92 + 0.12 * Math.cos(t * prop.speed * 1.1 + prop.phase);
    } else if (prop.kind === 'steam') {
      const cycle = ((t * 0.55 + prop.phase) % 1);
      prop.object.position.y = (prop.baseY ?? 1.16) + cycle * 0.65;
      prop.object.scale.setScalar(0.75 + cycle * 1.15);
      const mat = (prop.object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(cycle * Math.PI) * 0.28;
    } else if (prop.kind === 'spotlight') {
      const spot = prop.object as THREE.SpotLight;
      spot.target.position.set(Math.sin(t * prop.speed + prop.phase) * 1.1, 0.8, 0);
      spot.target.updateMatrixWorld();
    } else if (prop.kind === 'portal') {
      prop.object.rotation.z = t * prop.speed + prop.phase;
      const s = 0.94 + 0.08 * Math.sin(t * 3.8 + prop.phase);
      prop.object.scale.setScalar(s);
    } else if (prop.kind === 'door') {
      prop.object.rotation.y = 0.35 + Math.sin(t * prop.speed + prop.phase) * 0.48;
    } else if (prop.kind === 'hazard') {
      prop.object.rotation.y = t * prop.speed + prop.phase;
    }
  }

  // Reveal Dhruva Tara / Pole Star beam in Cosmos climax
  if (env.poleStarGroup && env.poleStarMat) {
    const boost = Math.max(0, Math.min(1, (u - 0.55) / 0.35));
    env.poleStarGroup.visible = boost > 0.02;
    env.poleStarGroup.rotation.y = t * 0.8;
    env.poleStarMat.opacity = boost * 0.28;
  }

  // Update AI/User photo backdrop plane (per-scene swap + gentle Ken Burns or locked template)
  if (env.backdropMesh && env.backdropTextures.length > 0) {
    const idx = Math.max(0, sceneIndex) % env.backdropTextures.length;
    const mat = env.backdropMesh.material as THREE.MeshBasicMaterial;
    if (mat.map !== env.backdropTextures[idx]) {
      mat.map = env.backdropTextures[idx];
      mat.needsUpdate = true;
    }
    if (layout?.templateBackdrop) {
      if (layout.templateMotion === 'GentleZoom') {
        const s = 1 + 0.06 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 20));
        env.backdropMesh.scale.setScalar(s);
        env.backdropMesh.position.x = 0;
      } else if (layout.templateMotion === 'SlowPan') {
        env.backdropMesh.scale.setScalar(1.08);
        env.backdropMesh.position.x = Math.sin((t * Math.PI * 2) / 32) * 0.16;
      } else {
        env.backdropMesh.scale.setScalar(1);
        env.backdropMesh.position.x = 0;
      }
    } else {
      const eased = localProgress * localProgress * (3 - 2 * localProgress);
      env.backdropMesh.scale.setScalar(1.04 + 0.09 * eased);
      env.backdropMesh.position.x = (idx % 2 === 0 ? 1 : -1) * 0.14 * (eased - 0.5);
    }
  }
}
