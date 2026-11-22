import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RenderJobJson, SceneSetting, SceneTimeOfDay, StageLayoutJson } from './types';

export interface StageSpot {
  x: number;
  y: number;
  z: number;
  rotY?: number;
}

export interface StageSpotMap {
  bed?: StageSpot;
  sofa?: StageSpot;
  counter?: StageSpot;
  door?: StageSpot;
}

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
  spots: StageSpotMap;
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

  // Sacred carved 3D Shivling & Yoni Peetham altar centerpiece at center sanctum
  const sanctum = new THREE.Group();
  sanctum.position.set(0, 0, -1.58);
  const basaltMat = new THREE.MeshStandardMaterial({ color: 0x1e202c, metalness: 0.35, roughness: 0.22 });
  const peeth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.50, 0.26, 24), stoneMat);
  peeth.position.y = 0.13;
  peeth.castShadow = true;
  peeth.receiveShadow = true;
  sanctum.add(peeth);
  const yoniRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 10, 24), goldMat);
  yoniRim.rotation.x = Math.PI / 2;
  yoniRim.position.y = 0.27;
  sanctum.add(yoniRim);
  const lingaCol = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 12, 20), basaltMat);
  lingaCol.position.y = 0.50;
  lingaCol.castShadow = true;
  sanctum.add(lingaCol);
  // Gold Tripundra lines & marigold garland dots on the Shivling
  for (const ty of [0.54, 0.58, 0.62]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.02), new THREE.MeshBasicMaterial({ color: 0xfef3c7 }));
    bar.position.set(0, ty, 0.155);
    sanctum.add(bar);
  }
  const marigoldMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55 });
  for (let m = 0; m < 10; m++) {
    const a = (m / 10) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), marigoldMat);
    petal.position.set(Math.cos(a) * 0.28, 0.30, Math.sin(a) * 0.28);
    sanctum.add(petal);
  }
  const sanctumLight = new THREE.PointLight(0xffb74d, 1.9, 4.5, 1.5);
  sanctumLight.position.set(0, 1.05, 0.25);
  sanctum.add(sanctumLight);
  group.add(sanctum);
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
  orbitGroup.position.set(0, 2.05, -3.3);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.032, 10, 64), goldMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.026, 10, 48), accentMat);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.022, 10, 48), goldMat);
  ring2.rotation.x = 0.7;
  ring3.rotation.y = 0.55;
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xfde047 }),
  );
  orbitGroup.add(ring1, ring2, ring3, sunDisc);
  group.add(orbitGroup);

  const cosmosLight = new THREE.PointLight(0xfbbf24, 3.0, 9, 1.4);
  cosmosLight.position.set(0, 2.1, -2.5);
  group.add(cosmosLight);
  env.ambientFireLights.push({ light: cosmosLight, baseIntensity: 3.0, phase: 0.3 });

  env.animatedProps.push({ object: ring1, kind: 'ring', phase: 0.2, speed: 0.35 });
  env.animatedProps.push({ object: ring2, kind: 'ring', phase: 1.5, speed: -0.55 });
  env.animatedProps.push({ object: ring3, kind: 'ring', phase: 0.9, speed: 0.48 });

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

  env.spots.counter = { x: 0.25, y: 0, z: -0.9, rotY: 0.12 };
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

function addPalaceCourt(group: THREE.Group, env: EnvironmentRig): void {
  const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xe6d2b5, roughness: 0.72 });
  const warmMarbleMat = new THREE.MeshStandardMaterial({ color: 0xcab596, roughness: 0.58 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf4c44e, metalness: 0.85, roughness: 0.22 });
  const burgundyMat = new THREE.MeshStandardMaterial({ color: 0x6b1426, roughness: 0.8 });
  const alcoveGlowMat = new THREE.MeshStandardMaterial({
    color: 0x2b130a,
    emissive: 0xd97706,
    emissiveIntensity: 0.42,
    roughness: 0.6,
  });

  // Grand courtyard sandstone floor + raised inner marble dance plinth + Persian carpet runner
  const floor = new THREE.Mesh(new THREE.CircleGeometry(10.5, 48), warmMarbleMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const dais = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.06, 5.2), sandstoneMat);
  dais.position.set(0, -0.02, -0.6);
  dais.receiveShadow = true;
  group.add(dais);

  const rugBorder = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.016, 2.35), goldTrimMat);
  rugBorder.position.set(0, 0.012, 0.15);
  rugBorder.receiveShadow = true;
  group.add(rugBorder);

  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.022, 2.08), burgundyMat);
  rug.position.set(0, 0.015, 0.15);
  rug.receiveShadow = true;
  group.add(rug);

  // Scalloped Rajputana/Mughal sandstone colonnade in the background
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.8, 4.4, 0.28), warmMarbleMat);
  backWall.position.set(0, 2.2, -3.55);
  backWall.receiveShadow = true;
  group.add(backWall);

  const stepLip = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.24, 0.72), sandstoneMat);
  stepLip.position.set(0, 0.12, -2.55);
  stepLip.receiveShadow = true;
  group.add(stepLip);

  const pillarXs = [-3.6, -1.25, 1.25, 3.6];
  for (const px of pillarXs) {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.42), sandstoneMat);
    colBase.position.set(px, 0.26, -2.55);
    colBase.castShadow = true;
    group.add(colBase);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.75, 14), sandstoneMat);
    shaft.position.set(px, 1.78, -2.55);
    shaft.castShadow = true;
    group.add(shaft);

    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.46), goldTrimMat);
    capital.position.set(px, 3.20, -2.55);
    group.add(capital);
  }

  // Three cusped arch bays with velvet curtains, golden jharokha alcoves, and mirror lattice panes
  const bayCenters = [-2.42, 0, 2.42];
  for (let b = 0; b < bayCenters.length; b++) {
    const bx = bayCenters[b];
    const archSpan = b === 1 ? 2.42 : 2.28;
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(archSpan, 0.65, 0.26), sandstoneMat);
    archHeader.position.set(bx, 3.55, -2.55);
    archHeader.castShadow = true;
    group.add(archHeader);

    const archTrim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.065, 8, 20, Math.PI), sandstoneMat);
    archTrim.position.set(bx, 2.52, -2.52);
    group.add(archTrim);

    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.72, 0.08), goldTrimMat);
    mirrorFrame.position.set(bx, 1.56, -3.38);
    group.add(mirrorFrame);

    const alcove = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.56, 0.10), alcoveGlowMat);
    alcove.position.set(bx, 1.56, -3.35);
    group.add(alcove);

    // Velvet arched side drapes framing each gallery window
    for (const ds of [-1, 1]) {
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.95, 10), burgundyMat);
      drape.position.set(bx + ds * 0.54, 1.55, -3.28);
      drape.rotation.z = ds * 0.06;
      group.add(drape);
    }

    // Upper carved jharokha lattice glow
    const jharokha = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.56, 0.12), alcoveGlowMat);
    jharokha.position.set(bx, 3.12, -3.32);
    group.add(jharokha);
  }

  // Tall golden brass floor candelabras ("Samode Palace / Guzarish" warm candlelight framed clearly inside 16:9 & 9:16)
  const candelabraX = [-2.18, 2.18];
  for (let c = 0; c < candelabraX.length; c++) {
    const cx = candelabraX[c];
    const cz = -0.35;
    const stand = new THREE.Group();
    stand.position.set(cx, 0, cz);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.22, 0.16, 14), goldTrimMat);
    foot.position.y = 0.08;
    stand.add(foot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.036, 1.18, 10), goldTrimMat);
    stem.position.y = 0.74;
    stem.castShadow = true;
    stand.add(stem);

    for (const [ox, oz] of [[-0.14, 0], [0.14, 0], [0, 0.12], [0, -0.10]]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.024, 0.05, 8), goldTrimMat);
      cup.position.set(ox, 1.34, oz);
      stand.add(cup);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.022, 0.09, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      );
      flame.position.set(ox, 1.40, oz);
      stand.add(flame);
      env.animatedProps.push({ object: flame, kind: 'diya', phase: c * 1.4 + ox * 3, speed: 12.5 });
    }

    const warmLight = new THREE.PointLight(0xffb454, 1.9, 6.2, 1.6);
    warmLight.position.set(0, 1.48, 0);
    stand.add(warmLight);
    env.ambientFireLights.push({ light: warmLight, baseIntensity: 1.9, phase: c * 1.7 });
    group.add(stand);
  }

  addDiya(group, -1.65, 0.24, -2.2, 0.3, env, false);
  addDiya(group, 1.65, 0.24, -2.2, 1.9, env, true);
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

function addEnclosedRoomWalls(
  group: THREE.Group,
  opts: {
    backColor: number;
    sideColor?: number;
    trimColor?: number;
    backZ?: number;
    height?: number;
    width?: number;
    depth?: number;
  },
): THREE.MeshStandardMaterial {
  const w = opts.width ?? 12.6;
  const h = opts.height ?? 5.4;
  const zBack = opts.backZ ?? -2.9;
  const depth = opts.depth ?? 10.5;
  const wallMat = new THREE.MeshStandardMaterial({ color: opts.backColor, roughness: 0.82 });
  const sideMat = new THREE.MeshStandardMaterial({ color: opts.sideColor ?? opts.backColor, roughness: 0.84 });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), wallMat);
  backWall.position.set(0, h * 0.5, zBack);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Side return walls + ceiling cornice eliminate any blue sky void during angled pans or crash zooms.
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, depth), sideMat);
  leftWall.position.set(-w * 0.5 + 0.09, h * 0.5, zBack + depth * 0.5 - 0.1);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, depth), sideMat);
  rightWall.position.set(w * 0.5 - 0.09, h * 0.5, zBack + depth * 0.5 - 0.1);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  const trimColor = opts.trimColor ?? 0x475569;
  const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.65 });
  const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 0.22), trimMat);
  baseboardBack.position.set(0, 0.08, zBack + 0.04);
  group.add(baseboardBack);

  const ceilingBand = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, depth), trimMat);
  ceilingBand.position.set(0, h + 0.1, zBack + depth * 0.5 - 0.1);
  group.add(ceilingBand);

  // Rear interior closure wall behind camera (z = zBack + depth) so salon/studio mirrors reflect a warm room instead of empty blue sky!
  const frontClosureWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), wallMat);
  frontClosureWall.position.set(0, h * 0.5, zBack + depth - 0.15);
  group.add(frontClosureWall);
  const frontBaseboard = new THREE.Mesh(new THREE.BoxGeometry(w, 0.72, 0.22), trimMat);
  frontBaseboard.position.set(0, 0.36, zBack + depth - 0.16);
  group.add(frontBaseboard);

  return wallMat;
}

function addBedroom(group: THREE.Group, env: EnvironmentRig): void {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.78 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Woven bedside rug
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.02, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.88 }),
  );
  rug.position.set(0, 0.01, -0.4);
  rug.receiveShadow = true;
  group.add(rug);

  // Cozy bedroom walls & arched window with moonlight/golden glow
  addEnclosedRoomWalls(group, { backColor: 0x3b2f52, sideColor: 0x312647, trimColor: 0x5c3d28, backZ: -2.9 });

  const windowMoon = new THREE.PointLight(0xdbeafe, 2.2, 9.5, 1.3);
  windowMoon.position.set(0.75, 2.65, 0.65);
  group.add(windowMoon);
  env.ambientFireLights.push({ light: windowMoon, baseIntensity: 2.2, phase: 0.1 });

  const winFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.55, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.65 }),
  );
  winFrame.position.set(1.15, 2.25, -2.78);
  group.add(winFrame);
  const winGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.28, 1.32),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd }),
  );
  winGlow.position.set(1.15, 2.25, -2.73);
  group.add(winGlow);

  // Wooden Charpai / Cot Bed on the left-center so lying character stays framed cleanly
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.62 });
  const bed = new THREE.Group();
  bed.position.set(-0.88, 0, -0.58);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.14, 2.1), woodMat);
  frame.position.y = 0.24;
  frame.castShadow = true;
  frame.receiveShadow = true;
  bed.add(frame);

  for (const [lx, lz] of [[-0.68, -0.95], [0.68, -0.95], [-0.68, 0.95], [0.68, 0.95]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.26, 8), woodMat);
    leg.position.set(lx, 0.13, lz);
    leg.castShadow = true;
    bed.add(leg);
  }
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.72, 0.10), woodMat);
  headboard.position.set(0, 0.56, -1.0);
  headboard.castShadow = true;
  bed.add(headboard);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.16, 1.94),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 }),
  );
  mattress.position.set(0, 0.38, 0.02);
  mattress.receiveShadow = true;
  bed.add(mattress);

  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(1.44, 0.18, 1.24),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.75 }),
  );
  blanket.position.set(0, 0.39, 0.34);
  blanket.castShadow = true;
  bed.add(blanket);

  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.14, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.68 }),
  );
  pillow.position.set(0, 0.51, -0.72);
  bed.add(pillow);
  group.add(bed);

  // Nightstand + glowing bedside lamp
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.52, 0.52), woodMat);
  stand.position.set(-1.98, 0.26, -0.82);
  stand.castShadow = true;
  group.add(stand);
  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.24, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.55, side: THREE.DoubleSide }),
  );
  lampShade.position.set(-1.98, 0.72, -0.82);
  group.add(lampShade);
  const bulb = new THREE.PointLight(0xffb74d, 2.4, 6.5, 1.5);
  bulb.position.set(-1.98, 0.66, -0.82);
  group.add(bulb);
  env.ambientFireLights.push({ light: bulb, baseIntensity: 2.4, phase: 0.7 });

  env.spots.bed = { x: -0.88, y: 0.47, z: 0.16, rotY: 0.16 };
  env.spots.door = { x: 1.45, y: 0, z: -1.35, rotY: -0.35 };
}

function addLivingRoom(group: THREE.Group, env: EnvironmentRig): void {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x3f334d, roughness: 0.72 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.02, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.86 }),
  );
  rug.position.set(0, 0.01, -0.2);
  rug.receiveShadow = true;
  group.add(rug);

  addEnclosedRoomWalls(group, { backColor: 0x334155, sideColor: 0x263244, trimColor: 0x6b3a1e, backZ: -2.95 });

  // Cushioned 3D Sofa on left-center
  const sofaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.68 });
  const sofa = new THREE.Group();
  sofa.position.set(-0.78, 0, -0.95);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.36, 0.85), sofaMat);
  seat.position.y = 0.22;
  seat.castShadow = true;
  seat.receiveShadow = true;
  sofa.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.68, 0.22), sofaMat);
  back.position.set(0, 0.56, -0.34);
  back.castShadow = true;
  sofa.add(back);
  for (const ax of [-0.92, 0.92]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.86), sofaMat);
    arm.position.set(ax, 0.38, 0);
    sofa.add(arm);
  }
  const throwPillow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.14), cushionMat);
  throwPillow.position.set(-0.55, 0.48, -0.14);
  throwPillow.rotation.z = 0.18;
  sofa.add(throwPillow);
  group.add(sofa);

  // Center Coffee Table + ceramic snack bowl
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1e, roughness: 0.55 });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.65), woodMat);
  tableTop.position.set(0.08, 0.34, 0.12);
  tableTop.castShadow = true;
  group.add(tableTop);
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.09, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
  );
  bowl.position.set(0.08, 0.42, 0.12);
  group.add(bowl);

  // Framed wall painting & doorway leaf
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.78, 0.06), woodMat);
  frame.position.set(-0.7, 2.15, -2.84);
  group.add(frame);
  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 }),
  );
  canvas.position.set(-0.7, 2.15, -2.8);
  group.add(canvas);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(1.25, 0, -2.7);
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.25, 0.08), woodMat);
  doorPanel.position.set(0.475, 1.125, 0);
  doorPanel.castShadow = true;
  doorPivot.add(doorPanel);
  group.add(doorPivot);
  env.animatedProps.push({ object: doorPivot, kind: 'door', phase: 0.4, speed: 0.85 });

  env.spots.sofa = { x: -0.78, y: 0.38, z: -0.74, rotY: 0.25 };
  env.spots.door = { x: 1.45, y: 0, z: -1.4, rotY: -0.4 };
}

function addKitchen(group: THREE.Group, env: EnvironmentRig): void {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const grid = new THREE.GridHelper(12, 16, 0x94a3b8, 0x475569);
  grid.position.y = 0.01;
  group.add(grid);

  addEnclosedRoomWalls(group, { backColor: 0x9a3412, sideColor: 0x7c2d12, trimColor: 0xfde68a, backZ: -2.85 });

  const backsplash = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 0.92, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55 }),
  );
  backsplash.position.set(0, 1.32, -2.74);
  group.add(backsplash);

  // Kitchen stove counter + marble slab
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55 });
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.88, 0.9), counterMat);
  counter.position.set(0, 0.44, -1.45);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.07, 0.96), slabMat);
  slab.position.set(0, 0.91, -1.45);
  group.add(slab);

  // Glowing stove ring + Copper Rabdi Kadhai Pot + Creamy Rabdi + Steam!
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const flameRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 20), flameMat);
  flameRing.rotation.x = Math.PI / 2;
  flameRing.position.set(-0.22, 0.96, -1.4);
  group.add(flameRing);
  env.animatedProps.push({ object: flameRing, kind: 'diya', phase: 0, speed: 9 });

  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.72, roughness: 0.25 });
  const kadhai = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.26, 20), copperMat);
  kadhai.position.set(-0.22, 1.1, -1.4);
  kadhai.castShadow = true;
  group.add(kadhai);

  const rabdi = new THREE.Mesh(
    new THREE.CircleGeometry(0.30, 20),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.28 }),
  );
  rabdi.rotation.x = -Math.PI / 2;
  rabdi.position.set(-0.22, 1.22, -1.4);
  group.add(rabdi);

  for (let s = 0; s < 5; s++) {
    const wisp = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }),
    );
    wisp.position.set(-0.22 + ((s % 3) - 1) * 0.08, 1.32 + s * 0.14, -1.4);
    group.add(wisp);
    env.animatedProps.push({ object: wisp, kind: 'steam', baseY: 1.28, phase: s * 1.1, speed: 1.7 });
  }

  // Masala spice shelf & jars on back wall
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.08, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 }),
  );
  shelf.position.set(0, 1.85, -2.6);
  group.add(shelf);
  for (let j = -2; j <= 2; j++) {
    const jarCol = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xeab308][j + 2];
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: jarCol, roughness: 0.35 }),
    );
    jar.position.set(j * 0.42, 2.0, -2.58);
    group.add(jar);
  }

  const warmBulb = new THREE.PointLight(0xfff7ed, 3.3, 9.5, 1.25);
  warmBulb.position.set(0, 2.75, 0.45);
  group.add(warmBulb);
  env.ambientFireLights.push({ light: warmBulb, baseIntensity: 3.3, phase: 0.2 });

  env.spots.counter = { x: -0.42, y: 0, z: -0.68, rotY: 0.30 };
  env.spots.door = { x: 1.35, y: 0, z: -1.15, rotY: -0.45 };
}

function addStudioPlaque(
  group: THREE.Group,
  label: string,
  subtitle: string,
  x: number,
  y: number,
  z: number,
  bgHex = '#0f172a',
  borderHex = '#f59e0b',
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 172);
  ctx.fillStyle = borderHex;
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 256, 86);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 24px sans-serif';
  ctx.fillText(subtitle, 256, 138);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.56, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.4 }),
  );
  frame.position.set(x, y, z - 0.02);
  group.add(frame);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.38, 0.48),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  sign.position.set(x, y, z + 0.01);
  group.add(sign);
}

function addSweetShop(group: THREE.Group, env: EnvironmentRig): void {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x4a2c2a, roughness: 0.75 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  addEnclosedRoomWalls(group, { backColor: 0x7c2d12, sideColor: 0x5c200e, trimColor: 0xf59e0b, backZ: -2.9 });
  addStudioPlaque(group, 'MITHAI & KESHAV', 'FRESH SHAHI HALWAI', 0, 2.75, -2.76, '#431407', '#fbbf24');

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.58 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.92, 0.85), woodMat);
  counter.position.set(0, 0.46, -1.45);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const trayMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
  const laddooMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
  const barfiMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.38 });

  for (const tx of [-0.65, 0, 0.65]) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.48), trayMat);
    tray.position.set(tx, 0.94, -1.42);
    group.add(tray);
    for (let lx = -0.14; lx <= 0.15; lx += 0.14) {
      for (let lz = -0.1; lz <= 0.12; lz += 0.14) {
        const sweet = tx === 0
          ? new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.11), barfiMat)
          : new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), laddooMat);
        sweet.position.set(tx + lx, 1.0, -1.42 + lz);
        group.add(sweet);
      }
    }
  }

  // Festive halwai canopy & marigold garland balls
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.65 }),
  );
  canopy.position.set(0, 2.35, -1.35);
  canopy.rotation.x = 0.18;
  group.add(canopy);

  for (let m = -5; m <= 5; m++) {
    const marigold = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 10, 8),
      new THREE.MeshStandardMaterial({ color: m % 2 === 0 ? 0xf59e0b : 0xfacc15, roughness: 0.6 }),
    );
    marigold.position.set(m * 0.28, 2.15 - Math.cos(m * 0.35) * 0.14, -0.82);
    group.add(marigold);
  }

  const lantern = new THREE.PointLight(0xffb74d, 3.0, 8, 1.4);
  lantern.position.set(0, 2.15, -1.0);
  group.add(lantern);
  env.ambientFireLights.push({ light: lantern, baseIntensity: 3.0, phase: 0.5 });

  env.spots.counter = { x: 0.38, y: 0, z: -0.62, rotY: 0.22 };
}

function addLiveMirror(
  group: THREE.Group,
  width: number,
  height: number,
  x: number,
  y: number,
  z: number,
  rotY: number,
  chromeMat: THREE.Material,
  texW = 512,
  texH = 256,
): void {
  const mirrorGroup = new THREE.Group();
  mirrorGroup.position.set(x, y, z);
  mirrorGroup.rotation.y = rotY;

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.20, height + 0.20, 0.08),
    chromeMat,
  );
  backing.position.z = -0.045;
  mirrorGroup.add(backing);

  // Real planar Three.js Reflector (multisample: 0 avoids SwiftShader FBO issues and renders crisp 3D reflection!)
  const reflector = new Reflector(new THREE.PlaneGeometry(width, height), {
    clipBias: 0.003,
    textureWidth: texW,
    textureHeight: texH,
    color: 0xdbeafe,
    multisample: 0,
  });
  reflector.position.z = 0.002;
  mirrorGroup.add(reflector);

  // Subtle corner glass sheen so mirror frame pops clearly in highlights
  const sheen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.07, height * 0.92),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 }),
  );
  sheen.position.set(-width * 0.34, 0, 0.006);
  sheen.rotation.z = -0.35;
  mirrorGroup.add(sheen);

  group.add(mirrorGroup);
}

function addBarberShop(group: THREE.Group, rig: EnvironmentRig): void {
  // Polished checkerboard salon tiles
  const darkTile = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.12 });
  const lightTile = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.08 });
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), darkTile);
  baseFloor.rotation.x = -Math.PI / 2;
  baseFloor.receiveShadow = true;
  group.add(baseFloor);
  for (let tx = -4; tx <= 4; tx++) {
    for (let tz = -4; tz <= 3; tz++) {
      if ((tx + tz) % 2 !== 0) continue;
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), lightTile);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(tx * 1.0, 0.004, tz * 1.0);
      tile.receiveShadow = true;
      group.add(tile);
    }
  }

  // Cream upper wall + enclosed side walls + teal ceramic lower dado + cleanly spaced studio signs (zero clipping!)
  addEnclosedRoomWalls(group, { backColor: 0xf4ece1, sideColor: 0xe6dac8, trimColor: 0x0f766e, backZ: -2.9 });
  const dadoWall = new THREE.Mesh(
    new THREE.BoxGeometry(12.6, 1.02, 0.21),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 }),
  );
  dadoWall.position.set(0, 0.51, -2.86);
  group.add(dadoWall);
  addStudioPlaque(group, 'SHAHI SALON', 'KESHAV STUDIO • VIP CUTS', 2.34, 2.26, -2.75, '#0f172a', '#f59e0b');
  addStudioPlaque(group, 'STYLE CHART', '1. BAHUBALI  2. FADE  3. KATORA', 2.34, 1.64, -2.75, '#1e293b', '#38bdf8');

  // DUAL LIVE SALON MIRRORS:
  // 1) Main Back Wall Mirror (reflects back-of-head haircut + barber snipping!)
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.88, roughness: 0.16 });
  addLiveMirror(group, 3.25, 1.38, -0.25, 1.92, -2.70, 0, chrome, 512, 256);

  // 2) Angled Side/Front Swivel Salon Mirror on left wall arm (lets Customer & Viewer see front reflection live!)
  const swivelArm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.65, 10), chrome);
  swivelArm.rotation.z = Math.PI / 2;
  swivelArm.position.set(-2.50, 1.62, -0.88);
  group.add(swivelArm);
  addLiveMirror(group, 1.42, 1.18, -2.14, 1.62, -0.78, 1.04, chrome, 384, 320);

  // Glowing overhead vanity fixture
  const vanityLamp = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.14), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
  vanityLamp.position.set(-0.25, 2.78, -2.70);
  group.add(vanityLamp);
  const warmLight = new THREE.PointLight(0xfffbeb, 3.2, 9.5, 1.3);
  warmLight.position.set(-0.25, 2.65, -1.25);
  group.add(warmLight);

  // Overhead salon ceiling light strip + front-wall decor reflected cleanly in back mirror
  const salonCeilingLamp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: 0xfef3c7 }));
  salonCeilingLamp.position.set(0, 3.85, 1.2);
  group.add(salonCeilingLamp);
  const frontDecorMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.48 });
  const oppositeShelf = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 0.12), frontDecorMat);
  oppositeShelf.position.set(0, 1.85, 7.25);
  group.add(oppositeShelf);
  const salonRug = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.015, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.9 }),
  );
  salonRug.position.set(-0.55, 0.008, -0.78);
  salonRug.receiveShadow = true;
  group.add(salonRug);

  // Rotating Red-White-Blue Barber Pole placed cleanly right of STYLE CHART (zero occlusion!)
  const poleGroup = new THREE.Group();
  poleGroup.position.set(3.48, 1.68, -2.55);
  const poleCore = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.92, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }));
  poleGroup.add(poleCore);
  [0xdc2626, 0x2563eb, 0xdc2626].forEach((col, i) => {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.028, 8, 18), new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 }));
    stripe.rotation.x = Math.PI / 2 + 0.42;
    stripe.position.y = -0.26 + i * 0.26;
    poleGroup.add(stripe);
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });
  for (const cy of [-0.50, 0.50]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10), capMat);
    cap.position.y = cy;
    poleGroup.add(cap);
  }
  group.add(poleGroup);
  rig.animatedProps.push({ object: poleGroup, kind: 'hazard', phase: 0, speed: 3.2 });

  // Shampoo Wash Basin + Hanging Checkered Towels (left wall station below SHAHI SALON sign)
  const sinkPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.72, 0.56),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32 }),
  );
  sinkPedestal.position.set(-2.98, 0.36, -2.42);
  group.add(sinkPedestal);
  const basinBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.20, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22 }),
  );
  basinBowl.position.set(-2.98, 0.78, -2.38);
  group.add(basinBowl);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), chrome);
  faucet.position.set(-2.98, 0.92, -2.58);
  group.add(faucet);

  // Wall Shampoo Shelf + Powder Shaker + Spray Bottle + Hanging Salon Towel Rack
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 0.36), new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.6 }));
  shelf.position.set(-0.25, 1.02, -2.6);
  group.add(shelf);
  [0xe11d48, 0x0ea5e9, 0xf59e0b, 0x10b981, 0x8b5cf6].forEach((c, idx) => {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 10), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }));
    bottle.position.set(-1.2 + idx * 0.48, 1.17, -2.55);
    group.add(bottle);
  });

  // Rolling Chrome Salon Tool Trolley shifted cleanly right of Barber so characters never overlap trolley or each other
  const trolley = new THREE.Group();
  trolley.position.set(0.96, 0, -1.26);
  const tFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.80, 0.36), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
  tFrame.position.y = 0.42;
  trolley.add(tFrame);
  const tTop = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.05, 0.40), chrome);
  tTop.position.y = 0.84;
  trolley.add(tTop);
  const cartSpray = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.052, 0.16, 10), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 }));
  cartSpray.position.set(-0.14, 0.94, 0.04);
  trolley.add(cartSpray);
  const cartClipper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.14), chrome);
  cartClipper.position.set(0, 0.89, 0.06);
  trolley.add(cartClipper);
  // Stack of folded Tolia (striped cotton towels) on trolley
  [0xfef3c7, 0xe0f2fe].forEach((tc, ti) => {
    const tStack = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.055, 0.22), new THREE.MeshStandardMaterial({ color: tc, roughness: 0.85 }));
    tStack.position.set(0.11, 0.895 + ti * 0.056, -0.02);
    trolley.add(tStack);
  });
  group.add(trolley);

  // Ornate Hydraulic Barber Swivel Chair (centered closer to stage midline so both 9:16 & 16:9 keep Customer + Barber in frame)
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-0.44, 0, -0.78);
  chairGroup.rotation.y = 0.20;
  const chairMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.42 });
  const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.40, 0.08, 18), chrome);
  cBase.position.y = 0.04;
  chairGroup.add(cBase);
  const cStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 12), chrome);
  cStem.position.y = 0.25;
  chairGroup.add(cStem);
  const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.72), chairMat);
  cSeat.position.y = 0.46;
  cSeat.castShadow = true;
  chairGroup.add(cSeat);
  const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.76, 0.14), chairMat);
  cBack.position.set(0, 0.84, -0.32);
  cBack.rotation.x = -0.14;
  cBack.castShadow = true;
  chairGroup.add(cBack);
  for (const ax of [-0.41, 0.41]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.62), chrome);
    arm.position.set(ax, 0.68, 0);
    chairGroup.add(arm);
  }
  const footRest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.22), chrome);
  footRest.position.set(0, 0.22, 0.48);
  chairGroup.add(footRest);
  group.add(chairGroup);

  // Customer waiting sofa bench (cleanly shifted right of instrument trolley)
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.68), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 }));
  bench.position.set(1.76, 0.21, -1.68);
  bench.castShadow = true;
  group.add(bench);

  // sofa = barber swivel chair customer seat; counter = barber standing behind-right of chair with open 3/4 view & zero nose clipping
  rig.spots.sofa = { x: -0.44, y: 0.28, z: -0.66, rotY: 0.18 };
  rig.spots.counter = { x: 0.34, y: 0, z: -0.96, rotY: -0.36 };
  rig.spots.door = { x: 1.76, y: 0, z: -1.45, rotY: -0.35 };
}

function addCourtroom(group: THREE.Group, rig: EnvironmentRig): void {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x4b2e1b, roughness: 0.68 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const oak = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.62 });
  addEnclosedRoomWalls(group, { backColor: 0x6b4423, sideColor: 0x57361a, trimColor: 0x92400e, backZ: -2.9 });
  addStudioPlaque(group, 'SATYAMEVA JAYATE', 'KESHAV DISTRICT COURT', 0, 3.05, -2.76, '#451a03', '#f59e0b');

  // Raised Judge bench + gavel pad
  const judgeBench = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.25, 1.0), oak);
  judgeBench.position.set(0, 0.62, -1.9);
  judgeBench.castShadow = true;
  group.add(judgeBench);

  const scalesGold = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 10, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 }));
  scalesGold.position.set(0, 2.4, -2.76);
  group.add(scalesGold);

  // Witness box
  const witnessBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.92, 0.9), oak);
  witnessBox.position.set(-0.95, 0.46, -0.55);
  witnessBox.castShadow = true;
  group.add(witnessBox);

  rig.spots.sofa = { x: 0, y: 0.42, z: -1.45, rotY: 0.08 };
  rig.spots.counter = { x: -0.95, y: 0.1, z: -0.35, rotY: 0.38 };
}

function addDoctorClinic(group: THREE.Group, rig: EnvironmentRig): void {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.52 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  addEnclosedRoomWalls(group, { backColor: 0xf8fafc, sideColor: 0xe2e8f0, trimColor: 0x0284c7, backZ: -2.9 });
  addStudioPlaque(group, 'CITY CLINIC', 'DR. DIAGNOSTICS • OPD 1', 2.25, 2.35, -2.75, '#0c4a6e', '#38bdf8');

  // Medical red cross emblem
  const redCrossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.05), redCrossMat);
  crossV.position.set(0, 2.35, -2.78);
  group.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.05), redCrossMat);
  crossH.position.set(0, 2.35, -2.78);
  group.add(crossH);

  // Patient bed & doctor desk
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.52, 0.88), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6 }));
  bed.position.set(-0.95, 0.26, -0.88);
  bed.castShadow = true;
  group.add(bed);

  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.72), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 }));
  desk.position.set(0.85, 0.38, -0.85);
  desk.castShadow = true;
  group.add(desk);

  rig.spots.bed = { x: -0.95, y: 0.52, z: -0.82, rotY: 0.32 };
  rig.spots.sofa = { x: 0.85, y: 0, z: -0.45, rotY: -0.35 };
}

function addClassroom(group: THREE.Group, rig: EnvironmentRig): void {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x785a3c, roughness: 0.72 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  addEnclosedRoomWalls(group, { backColor: 0xfef3c7, sideColor: 0xfde68a, trimColor: 0x78350f, backZ: -2.9 });

  // Green chalkboard + wood frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.55, 0.08), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }));
  frame.position.set(0, 1.95, -2.78);
  group.add(frame);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.95, 1.32), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 }));
  board.position.set(0, 1.95, -2.73);
  group.add(board);

  // School bunting streamer flags (15 August / school event vibe)
  const flagColors = [0xff9933, 0xffffff, 0x138808];
  for (let i = -5; i <= 5; i++) {
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 4), new THREE.MeshStandardMaterial({ color: flagColors[((i + 5) % 3)], roughness: 0.5 }));
    flag.rotation.x = Math.PI;
    flag.position.set(i * 0.42, 3.05 - Math.cos(i * 0.28) * 0.16, -1.6);
    group.add(flag);
    rig.animatedProps.push({ object: flag, kind: 'sway', phase: i * 0.4, speed: 2.1 });
  }

  const podium = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.65), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }));
  podium.position.set(-0.85, 0.42, -0.75);
  group.add(podium);

  rig.spots.sofa = { x: 0.8, y: 0, z: -0.45, rotY: -0.4 };
  rig.spots.counter = { x: -0.85, y: 0, z: -0.45, rotY: 0.35 };
}

function addQuizStudio(group: THREE.Group, rig: EnvironmentRig): void {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x090d24, roughness: 0.35, metalness: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const stageRing = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.06, 12, 48), ringMat);
  stageRing.rotation.x = Math.PI / 2;
  stageRing.position.set(0, 0.04, 0);
  group.add(stageRing);
  rig.animatedProps.push({ object: stageRing, kind: 'ring', phase: 0, speed: 0.4 });

  const archRing = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.08, 12, 48), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
  archRing.position.set(0, 1.9, -2.5);
  group.add(archRing);
  rig.animatedProps.push({ object: archRing, kind: 'portal', phase: 0.4, speed: 0.8 });

  // Host & Contestant hot-seat desks
  const podMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.55, roughness: 0.3 });
  [-0.95, 0.95].forEach((px) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.82, 16), podMat);
    pod.position.set(px, 0.41, -0.35);
    pod.castShadow = true;
    group.add(pod);
  });

  const spot = new THREE.SpotLight(0x38bdf8, 8.5, 16, Math.PI / 5, 0.4);
  spot.position.set(0, 4.6, 1.5);
  group.add(spot);
  group.add(spot.target);
  rig.animatedProps.push({ object: spot, kind: 'spotlight', phase: 0, speed: 1.5 });
}

function addNeighborhoodGate(group: THREE.Group, rig: EnvironmentRig): void {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Brick boundary walls + glowing gate carriage lamps + iron picket compound gate (open-bar design)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.82 });
  const pillarCapMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55 });
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  [-2.6, 2.6].forEach((wx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 0.28), wallMat);
    wall.position.set(wx, 1.1, -2.4);
    wall.castShadow = true;
    group.add(wall);
  });

  [-1.08, 1.08].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.55, 0.38), wallMat);
    pillar.position.set(px, 1.28, -2.35);
    pillar.castShadow = true;
    group.add(pillar);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.46), pillarCapMat);
    cap.position.set(px, 2.58, -2.35);
    group.add(cap);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), lampGlowMat);
    lantern.position.set(px, 2.74, -2.35);
    group.add(lantern);
  });

  const gatePivot = new THREE.Group();
  gatePivot.position.set(-0.92, 0, -2.35);
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.35 });
  for (const ry of [0.35, 1.85]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.08, 0.08), ironMat);
    rail.position.set(0.92, ry, 0);
    gatePivot.add(rail);
  }
  for (let i = 0; i <= 7; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.05, 8), ironMat);
    bar.position.set(0.08 + i * 0.24, 1.05, 0);
    bar.castShadow = true;
    gatePivot.add(bar);
  }
  // Golden padlock at center gate
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.08), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 }));
  lockBody.position.set(1.72, 1.12, 0.08);
  gatePivot.add(lockBody);
  group.add(gatePivot);
  rig.animatedProps.push({ object: gatePivot, kind: 'door', phase: 0.1, speed: 0.7 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.8, 12), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.5 }));
  pole.position.set(2.15, 1.9, -1.6);
  group.add(pole);

  addTree(group, -2.75, -1.25, 1.05, 0x15803d, 0.3, rig);
  rig.spots.door = { x: 0.0, y: 0, z: -1.35, rotY: 0.1 };
}

function addArchiveLibrary(group: THREE.Group, env: EnvironmentRig): void {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x3b2316, roughness: 0.72 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.65 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf4c44e, metalness: 0.85, roughness: 0.25 });
  const globeOceanMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.2 });
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.82 });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 44), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 2.2), carpetMat);
  rug.position.set(0, 0.015, 0.1);
  rug.receiveShadow = true;
  group.add(rug);

  // Archival mahogany bookshelves flanking back gallery wall
  for (const bx of [-2.4, 2.4]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.1, 0.45), woodMat);
    shelf.position.set(bx, 1.55, -2.9);
    shelf.castShadow = true;
    group.add(shelf);
    for (const sy of [0.85, 1.65, 2.45]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 0.48), brassMat);
      strip.position.set(bx, sy, -2.9);
      group.add(strip);
    }
  }

  // Illuminating rotating brass meridian globe on pedestal center-back
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 1.05, 20), woodMat);
  ped.position.set(0, 0.525, -2.35);
  ped.castShadow = true;
  group.add(ped);

  const globeGroup = new THREE.Group();
  globeGroup.position.set(0, 1.55, -2.35);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 18), globeOceanMat);
  globeGroup.add(sphere);
  const meridianRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.032, 10, 42), brassMat);
  globeGroup.add(meridianRing);
  const equatorRing = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.024, 10, 42), brassMat);
  equatorRing.rotation.x = Math.PI / 2;
  globeGroup.add(equatorRing);
  group.add(globeGroup);
  env.animatedProps.push({ object: globeGroup, kind: 'ring', phase: 0, speed: 0.45 });

  const lamp = new THREE.PointLight(0xfde68a, 3.2, 8, 1.4);
  lamp.position.set(0, 2.65, -1.65);
  group.add(lamp);
  env.ambientFireLights.push({ light: lamp, baseIntensity: 3.2, phase: 0.4 });
}

function addModernCityStage(group: THREE.Group, env: EnvironmentRig, accentHex: string): void {
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.25 });
  const bldgMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.35 });
  const glowMat = new THREE.MeshBasicMaterial({ color: accentHex || '#38bdf8' });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 44), plinthMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.04, 10, 48), glowMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  const towers: [number, number, number, number][] = [
    [-3.6, -4.2, 1.1, 4.2],
    [-2.1, -4.6, 1.0, 5.1],
    [-0.4, -5.0, 1.25, 5.8],
    [1.4, -4.6, 1.0, 4.8],
    [3.1, -4.2, 1.15, 4.0],
  ];
  for (const [tx, tz, w, h] of towers) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), bldgMat);
    tower.position.set(tx, h * 0.5, tz);
    group.add(tower);
    for (let wy = 1.0; wy < h - 0.5; wy += 0.95) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.14, 0.94), glowMat);
      win.position.set(tx, wy, tz);
      group.add(win);
    }
  }

  const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.035, 10, 48), glowMat);
  pulseRing.position.set(0, 2.6, -3.1);
  group.add(pulseRing);
  env.animatedProps.push({ object: pulseRing, kind: 'ring', phase: 0.4, speed: 0.35 });

  const cityLight = new THREE.PointLight(accentHex || '#38bdf8', 2.8, 9, 1.4);
  cityLight.position.set(0, 2.8, -1.8);
  group.add(cityLight);
  env.ambientFireLights.push({ light: cityLight, baseIntensity: 2.8, phase: 0.6 });
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
    spots: {},
  };

  if (backdropTextures.length > 0 && job.stageLayout?.templateBackdrop) {
    // Explicit user static photo template mode: clean floor shadow catcher + locked cinema backdrop plane
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

  if (backdropTextures.length > 0) {
    // AI / multi-scene sky plate mode: mount painted vista far at the back horizon so 3D temples,
    // ashram trees, ghats, Shivling & swinging bells still build richly in foreground 3D space!
    const aspect = job.width / job.height;
    const planeHeight = 11.2;
    const planeWidth = planeHeight * aspect;
    const backdropMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      new THREE.MeshBasicMaterial({ map: backdropTextures[0], depthWrite: false, fog: false }),
    );
    backdropMesh.position.set(0, 2.75, -6.5);
    group.add(backdropMesh);
    rig.backdropMesh = backdropMesh;
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
    case 'PalaceCourt':
      addPalaceCourt(group, rig);
      break;
    case 'Bedroom':
      addBedroom(group, rig);
      break;
    case 'LivingRoom':
      addLivingRoom(group, rig);
      break;
    case 'Kitchen':
      addKitchen(group, rig);
      break;
    case 'SweetShop':
      addSweetShop(group, rig);
      break;
    case 'BarberShop':
      addBarberShop(group, rig);
      break;
    case 'Courtroom':
      addCourtroom(group, rig);
      break;
    case 'DoctorClinic':
      addDoctorClinic(group, rig);
      break;
    case 'Classroom':
      addClassroom(group, rig);
      break;
    case 'QuizStudio':
      addQuizStudio(group, rig);
      break;
    case 'Archive':
      addArchiveLibrary(group, rig);
      break;
    case 'ModernCity':
      addModernCityStage(group, rig, job.palette.primaryHex);
      break;
    case 'NeighborhoodGate':
      addNeighborhoodGate(group, rig);
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
      const m = layout.templateMotion === 'AutoSmooth'
        ? (['GentleZoom', 'OrbitRound', 'ZoomOut', 'SlowPan', 'GentleRotate'] as const)[Math.max(0, sceneIndex >= 0 ? sceneIndex : Math.floor(t / 5.5)) % 5]
        : layout.templateMotion;
      env.backdropMesh.rotation.z = 0;
      env.backdropMesh.position.y = 1.32;
      if (m === 'GentleZoom') {
        const s = 1 + 0.06 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 20));
        env.backdropMesh.scale.setScalar(s);
        env.backdropMesh.position.x = 0;
      } else if (m === 'ZoomOut') {
        const s = 1.10 - 0.09 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 20));
        env.backdropMesh.scale.setScalar(s);
        env.backdropMesh.position.x = 0;
      } else if (m === 'SlowPan') {
        env.backdropMesh.scale.setScalar(1.08);
        env.backdropMesh.position.x = Math.sin((t * Math.PI * 2) / 32) * 0.16;
      } else if (m === 'OrbitRound') {
        const phase = (t * Math.PI * 2) / 22;
        env.backdropMesh.scale.setScalar(1.10);
        env.backdropMesh.position.x = Math.sin(phase) * 0.13;
        env.backdropMesh.position.y = 1.32 + (Math.sin(phase + 1.25) - Math.sin(1.25)) * 0.055;
      } else if (m === 'GentleRotate') {
        const s = 1.08 + 0.03 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 20));
        env.backdropMesh.scale.setScalar(s);
        env.backdropMesh.position.x = 0;
        env.backdropMesh.rotation.z = 0.032 * Math.sin((t * Math.PI * 2) / 18);
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
