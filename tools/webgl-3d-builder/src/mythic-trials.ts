import * as THREE from 'three';

export type MythicTrialMode =
  | 'none'
  | 'serpentAttack'
  | 'elephantCharge'
  | 'fireTrial'
  | 'cliffRescue';

export interface MythicTrialPropsRig {
  serpentGroup: THREE.Group;
  cobras: { root: THREE.Group; neckPivot: THREE.Group; sideSign: number; phase: number }[];
  elephantGroup: THREE.Group;
  elephantTrunk: THREE.Group;
  elephantHead: THREE.Group;
  elephantEars: THREE.Mesh[];
  elephantLegs: THREE.Mesh[];
  fireTrialGroup: THREE.Group;
  flames: { mesh: THREE.Mesh; baseH: number; phase: number; radius: number; angle: number }[];
  fireLight: THREE.PointLight;
  cliffGroup: THREE.Group;
  cliffClouds: THREE.Mesh[];
  devoteeShieldGroup: THREE.Group;
  shieldDome: THREE.Mesh;
  shieldRing: THREE.Mesh;
}

/**
 * Builds 3D animated trial-and-rescue elements for Pauranik kathas:
 * coiled cobras (Sarpa-Danda), armored royal war elephant (Gajaraj), blazing Agnikunda fire pyre (Holika),
 * cliff mist (Parvat Khai), and radiant golden Vishnu Raksha Kavach protecting the devotee unharmed.
 */
export function createMythicTrialStageProps(parent: THREE.Group): MythicTrialPropsRig {
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf7be38, metalness: 0.85, roughness: 0.20 });

  // 1. Coiled Venomous Cobras (Naga / Sarpa)
  const serpentGroup = new THREE.Group();
  serpentGroup.visible = false;
  const cobraSkinMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.25 });
  const hoodStripeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x78350f, emissiveIntensity: 0.35 });
  const venomEyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const cobras: MythicTrialPropsRig['cobras'] = [];
  const cobraDefs = [
    { side: -1, z: 0.36, scale: 1.05, phase: 0.0 },
    { side: 1, z: 0.28, scale: 0.96, phase: 1.9 },
    { side: -1, z: -0.18, scale: 1.15, phase: 3.4 },
  ];
  for (const def of cobraDefs) {
    const root = new THREE.Group();
    root.position.set(def.side * 1.15, 0, def.z);
    root.scale.setScalar(def.scale);

    // Coiled tail base on ground
    const coilCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-def.side * 0.26, 0.05, -0.10),
      new THREE.Vector3(0, 0.07, 0.16),
      new THREE.Vector3(def.side * 0.22, 0.08, -0.08),
      new THREE.Vector3(0, 0.16, -0.12),
      new THREE.Vector3(0, 0.42, 0.02),
    ]);
    const coilMesh = new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 22, 0.052, 10, false), cobraSkinMat);
    coilMesh.castShadow = true;
    root.add(coilMesh);

    // Upright neck + flared cobra hood + eyes + fangs
    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, 0.42, 0.02);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.062, 0.44, 10), cobraSkinMat);
    neck.position.y = 0.20;
    neckPivot.add(neck);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), cobraSkinMat);
    hood.scale.set(1.28, 1.48, 0.38);
    hood.position.set(0, 0.44, 0.02);
    hood.castShadow = true;
    neckPivot.add(hood);

    const spectacle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 14), hoodStripeMat);
    spectacle.position.set(0, 0.44, -0.04);
    neckPivot.add(spectacle);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), cobraSkinMat);
    head.scale.set(1.05, 0.72, 1.45);
    head.position.set(0, 0.56, 0.11);
    neckPivot.add(head);

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), venomEyeMat);
      eye.position.set(s * 0.048, 0.58, 0.19);
      neckPivot.add(eye);
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.010, 0.045, 5), fangMat);
      fang.rotation.x = Math.PI;
      fang.position.set(s * 0.028, 0.50, 0.21);
      neckPivot.add(fang);
    }
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.12), tongueMat);
    tongue.position.set(0, 0.52, 0.27);
    neckPivot.add(tongue);

    root.add(neckPivot);
    root.rotation.y = -def.side * 0.95;
    serpentGroup.add(root);
    cobras.push({ root, neckPivot, sideSign: def.side, phase: def.phase });
  }
  parent.add(serpentGroup);

  // 2. Sculpted 3D Royal War Elephant (Gajaraj / Hathi)
  const elephantGroup = new THREE.Group();
  elephantGroup.visible = false;
  const hideMat = new THREE.MeshStandardMaterial({ color: 0x525866, roughness: 0.78 });
  const darkHideMat = new THREE.MeshStandardMaterial({ color: 0x3b404d, roughness: 0.84 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.52 });
  const ivoryMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.22 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 16), hideMat);
  body.scale.set(1.38, 1.05, 0.96);
  body.position.set(0, 0.96, 0);
  body.castShadow = true;
  elephantGroup.add(body);

  // Royal velvet & gold Jhula caparison saddle cloth
  const saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.65, 16, 1, false, -Math.PI * 0.45, Math.PI * 0.9), clothMat);
  saddle.rotation.z = Math.PI / 2;
  saddle.position.set(0, 1.02, 0);
  elephantGroup.add(saddle);
  const saddleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 1.12), goldMat);
  saddleTrim.position.set(0, 0.74, 0);
  elephantGroup.add(saddleTrim);

  // 4 sturdy pillar legs with golden anklets
  const elephantLegs: THREE.Mesh[] = [];
  for (const [lx, lz] of [[-0.44, -0.28], [-0.44, 0.28], [0.42, -0.28], [0.42, 0.28]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.165, 0.74, 12), darkHideMat);
    leg.position.set(lx, 0.37, lz);
    leg.castShadow = true;
    const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.022, 6, 14), goldMat);
    anklet.rotation.x = Math.PI / 2;
    anklet.position.y = -0.28;
    leg.add(anklet);
    elephantGroup.add(leg);
    elephantLegs.push(leg);
  }

  // Head + Gold Kumbha Mukut + Flapping Ears + Curved Ivory Tusks + Articulated Trunk
  const elephantHead = new THREE.Group();
  elephantHead.position.set(0.78, 1.18, 0);
  elephantGroup.add(elephantHead);

  const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), hideMat);
  headDome.scale.set(1.06, 1.15, 0.96);
  headDome.castShadow = true;
  elephantHead.add(headDome);

  const headCloth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.42), goldMat);
  headCloth.position.set(0.24, 0.06, 0);
  headCloth.rotation.z = -0.22;
  elephantHead.add(headCloth);

  const crownOrb = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), goldMat);
  crownOrb.position.set(0.06, 0.46, 0);
  elephantHead.add(crownOrb);

  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), venomEyeMat);
    eye.position.set(0.28, 0.08, sz * 0.24);
    elephantHead.add(eye);
  }

  const elephantEars: THREE.Mesh[] = [];
  for (const sz of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), darkHideMat);
    ear.scale.set(0.18, 1.12, 0.92);
    ear.position.set(-0.08, 0.02, sz * 0.42);
    ear.rotation.y = sz * 0.35;
    elephantHead.add(ear);
    elephantEars.push(ear);

    // Sweeping white ivory tusks
    const tuskCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.24, -0.18, sz * 0.16),
      new THREE.Vector3(0.56, -0.26, sz * 0.20),
      new THREE.Vector3(0.76, -0.05, sz * 0.18),
    ]);
    const tusk = new THREE.Mesh(new THREE.TubeGeometry(tuskCurve, 14, 0.036, 8, false), ivoryMat);
    tusk.castShadow = true;
    elephantHead.add(tusk);
  }

  const elephantTrunk = new THREE.Group();
  elephantTrunk.position.set(0.34, -0.10, 0);
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.24, -0.28, 0),
    new THREE.Vector3(0.36, -0.62, 0),
    new THREE.Vector3(0.52, -0.58, 0),
  ]);
  const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 18, 0.085, 10, false), hideMat);
  trunkMesh.castShadow = true;
  elephantTrunk.add(trunkMesh);
  elephantHead.add(elephantTrunk);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.015, 0.55, 6), darkHideMat);
  tail.position.set(-0.76, 0.72, 0);
  tail.rotation.z = -0.35;
  elephantGroup.add(tail);

  elephantGroup.position.set(-1.35, 0, 0.12);
  parent.add(elephantGroup);

  // 3. Roaring Agnikunda Fire Altar + Flames (Holika Fire Trial)
  const fireTrialGroup = new THREE.Group();
  fireTrialGroup.visible = false;
  fireTrialGroup.position.set(0, 0, 0.16);
  const stoneRimMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 });
  const emberBedMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xdc2626,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.12, 8, 28), stoneRimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.08;
  rim.castShadow = true;
  fireTrialGroup.add(rim);

  const coalBed = new THREE.Mesh(new THREE.CylinderGeometry(0.90, 0.94, 0.10, 24), emberBedMat);
  coalBed.position.y = 0.05;
  fireTrialGroup.add(coalBed);

  const flames: MythicTrialPropsRig['flames'] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const isFront = Math.sin(angle) > 0.20;
    const radius = isFront ? 1.02 : (i % 2 === 0 ? 0.88 : 1.08);
    // Keep front perimeter flames lower so seated Holika & Prahlad remain 100% unoccluded, with roaring tall flames behind!
    const baseH = isFront ? (0.28 + (i % 3) * 0.08) : (0.95 + (i % 4) * 0.25);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xfef08a : i % 2 === 0 ? 0xf97316 : 0xef4444,
      transparent: true,
      opacity: isFront ? 0.65 : 0.84,
      depthWrite: false,
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(isFront ? 0.14 : (0.20 + (i % 3) * 0.05), baseH, 7), mat);
    flame.position.set(Math.cos(angle) * radius, baseH * 0.5 + 0.06, Math.sin(angle) * radius);
    fireTrialGroup.add(flame);
    flames.push({ mesh: flame, baseH, phase: i * 0.85, radius, angle });
  }
  const fireLight = new THREE.PointLight(0xff7b1c, 0, 8.5, 1.5);
  fireLight.position.set(0, 1.45, 0.45);
  fireTrialGroup.add(fireLight);
  parent.add(fireTrialGroup);

  // 4. Mountain Cliff Abyss Mist & Jagged Rim
  const cliffGroup = new THREE.Group();
  cliffGroup.visible = false;
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92 });
  for (const [rx, ry, rz, s] of [[-1.3, 0.22, -0.35, 1.1], [1.25, 0.16, -0.25, 0.95], [0, 0.10, -0.65, 1.35]]) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 * s, 0), rockMat);
    rock.position.set(rx, ry, rz);
    rock.scale.set(1.4, 0.75, 1.1);
    cliffGroup.add(rock);
  }
  const cliffClouds: THREE.Mesh[] = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.32, depthWrite: false });
  for (let c = 0; c < 6; c++) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), cloudMat);
    cloud.scale.set(1.9, 0.42, 1.3);
    cloud.position.set((c - 2.5) * 0.85, 0.14 + (c % 2) * 0.12, 0.25 - (c % 3) * 0.35);
    cliffGroup.add(cloud);
    cliffClouds.push(cloud);
  }
  parent.add(cliffGroup);

  // 5. Golden Vishnu Raksha Kavach Shield + Blooming Lotus Base protecting Bhakt Prahlad
  const devoteeShieldGroup = new THREE.Group();
  devoteeShieldGroup.visible = false;
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.20,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shieldDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 18), shieldMat);
  shieldDome.scale.set(1.0, 1.35, 1.0);
  shieldDome.position.y = 0.78;
  devoteeShieldGroup.add(shieldDome);

  const shieldRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shieldRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.024, 8, 36), shieldRingMat);
  shieldRing.rotation.x = Math.PI / 2;
  shieldRing.position.y = 0.10;
  devoteeShieldGroup.add(shieldRing);

  for (let p = 0; p < 8; p++) {
    const pa = (p / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xfbbf24, emissiveIntensity: 0.4 }),
    );
    petal.scale.set(1.1, 0.38, 1.8);
    petal.position.set(Math.cos(pa) * 0.42, 0.08, Math.sin(pa) * 0.42);
    petal.rotation.y = -pa + Math.PI / 2;
    devoteeShieldGroup.add(petal);
  }
  parent.add(devoteeShieldGroup);

  return {
    serpentGroup,
    cobras,
    elephantGroup,
    elephantTrunk,
    elephantHead,
    elephantEars,
    elephantLegs,
    fireTrialGroup,
    flames,
    fireLight,
    cliffGroup,
    cliffClouds,
    devoteeShieldGroup,
    shieldDome,
    shieldRing,
  };
}

export function updateMythicTrialProps(
  props: MythicTrialPropsRig,
  t: number,
  mode: MythicTrialMode,
  devoteeX: number,
  turnLocal: number,
): void {
  const showAnyTrial = mode !== 'none';
  props.devoteeShieldGroup.visible = showAnyTrial;
  if (showAnyTrial) {
    props.devoteeShieldGroup.position.set(devoteeX, 0, 0.16);
    props.shieldRing.rotation.z = t * 1.4;
    const pulse = 0.96 + Math.sin(t * 5.0) * 0.05;
    props.shieldDome.scale.setScalar(pulse);
  }

  // Snakes slither toward Prahlad and recoil away from his golden Raksha Kavach
  props.serpentGroup.visible = mode === 'serpentAttack';
  if (mode === 'serpentAttack') {
    props.cobras.forEach((c) => {
      const strike = Math.max(0, Math.sin(t * 4.2 + c.phase));
      const recoil = Math.exp(-Math.pow(strike - 0.85, 2) * 8) * 0.24;
      c.root.position.x = devoteeX + c.sideSign * (0.98 - strike * 0.16 + recoil);
      c.neckPivot.rotation.x = 0.38 * strike - 0.18;
      c.neckPivot.rotation.z = Math.sin(t * 7.5 + c.phase) * 0.14;
    });
  }

  // Royal Armored War Elephant charges toward Prahlad then stops/bows trunk before golden shield
  props.elephantGroup.visible = mode === 'elephantCharge';
  if (mode === 'elephantCharge') {
    const dirToDevotee = devoteeX >= 0 ? 1 : -1;
    const chargeX = devoteeX - dirToDevotee * (1.75 - Math.min(1, turnLocal * 1.6) * 0.65);
    props.elephantGroup.position.x = chargeX;
    props.elephantGroup.rotation.y = dirToDevotee >= 0 ? 0 : Math.PI;
    const stride = Math.sin(t * 8.5) * (turnLocal < 0.65 ? 0.25 : 0.05);
    props.elephantLegs.forEach((leg, i) => {
      leg.rotation.z = (i % 2 === 0 ? 1 : -1) * stride;
    });
    props.elephantEars.forEach((ear, i) => {
      ear.rotation.y = (i === 0 ? -1 : 1) * (0.35 + Math.sin(t * 6.0) * 0.25);
    });
    // Raises trunk in awe when nearing golden Raksha Kavach
    const bowUp = turnLocal > 0.45 ? Math.min(1, (turnLocal - 0.45) * 2.4) * 0.65 : Math.sin(t * 4.5) * 0.18;
    props.elephantTrunk.rotation.z = bowUp;
    props.elephantHead.rotation.z = Math.sin(t * 3.5) * 0.08;
  }

  // Roaring Agnikunda fire altar around/beside Prahlad & Holika (high back/flank flames kept cleanly around z=-0.2..0.2)
  props.fireTrialGroup.visible = mode === 'fireTrial';
  props.fireLight.intensity = mode === 'fireTrial' ? 3.2 + Math.sin(t * 14.0) * 0.7 : 0;
  if (mode === 'fireTrial') {
    props.fireTrialGroup.position.x = 0;
    props.flames.forEach((f) => {
      const flicker = 0.80 + 0.32 * Math.sin(t * 13.5 + f.phase);
      f.mesh.scale.set(0.92 + 0.12 * Math.cos(t * 9.0 + f.phase), flicker, 1.0);
      f.mesh.position.y = f.baseH * flicker * 0.5 + 0.05;
      f.mesh.position.x = Math.cos(f.angle) * f.radius;
      f.mesh.position.z = Math.sin(f.angle) * f.radius;
    });
  }

  // Mountain abyss clouds drifting below floating saved Prahlad
  props.cliffGroup.visible = mode === 'cliffRescue';
  if (mode === 'cliffRescue') {
    props.cliffClouds.forEach((cl, i) => {
      cl.position.x = ((i - 2.5) * 0.85) + Math.sin(t * 1.4 + i) * 0.22;
    });
  }
}
