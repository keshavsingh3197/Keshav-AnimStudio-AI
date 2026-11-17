import * as THREE from 'three';
import { CharacterProfileJson, CharacterRole, EmotionKind, SceneSetting } from './types';

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torsoGroup: THREE.Group;
  headPivot: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  leftBrow: THREE.Mesh;
  rightBrow: THREE.Mesh;
  mouthCavity: THREE.Mesh;
  upperLip: THREE.Mesh;
  lowerLip: THREE.Mesh;
  haloGroup?: THREE.Group;
  haloMaterial?: THREE.MeshBasicMaterial;
  auraRing: THREE.Mesh;
  auraDisc: THREE.Mesh;
  pedestalGlow?: THREE.Mesh;
  role: CharacterRole;
  name: string;
  facingSign: number;
  standing: boolean;
  seedOffset: number;
}

const GODDESS_TOKENS = ['devi', 'mata', 'durga', 'lakshmi', 'laxmi', 'saraswati', 'parvati', 'sita', 'radha', 'देवी', 'माता', 'दुर्गा', 'लक्ष्मी', 'सरस्वती', 'पार्वती', 'सीता', 'राधा'];

function isStandingScene(setting: SceneSetting, role: CharacterRole): boolean {
  if (role === 'Warrior' || role === 'KingCrown') return true;
  return setting === 'ComedyStage'
    || setting === 'ChaiStall'
    || setting === 'Battlefield'
    || setting === 'PalaceCourt'
    || setting === 'ModernCity'
    || setting === 'Village'
    || setting === 'Archive';
}

function getRolePalette(role: CharacterRole, robeHex: string | null | undefined, accentHex: string): {
  robe: number;
  sash: number;
  skin: number;
  isDivine: boolean;
} {
  let robe = 0x2c5c8a;
  let sash = new THREE.Color(accentHex).getHex();
  let skin = 0xe8b288;
  let isDivine = false;

  switch (role) {
    case 'KingCrown':
      robe = 0x99243a;
      sash = 0xf5be38;
      break;
    case 'SageRishi':
      robe = 0xd96818;
      sash = 0xfde082;
      break;
    case 'Divine':
      robe = 0x2d62d9;
      sash = 0xffd840;
      skin = 0x9ec4ff;
      isDivine = true;
      break;
    case 'ChildDevotee':
      robe = 0xea9f1c;
      sash = 0xd94826;
      break;
    case 'NobleWoman':
      robe = 0xc22b56;
      sash = 0xf8c446;
      break;
    case 'Warrior':
      robe = 0x735233;
      sash = 0xc5cbd6;
      break;
    default:
      robe = 0x2f5f94;
      break;
  }

  if (robeHex && /^#?[0-9a-fA-F]{6}$/.test(robeHex.trim())) {
    robe = new THREE.Color(robeHex.startsWith('#') ? robeHex : `#${robeHex}`).getHex();
  }

  return { robe, sash, skin, isDivine };
}

function createLatheTorso(bottomR: number, waistR: number, chestR: number, height: number): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(bottomR * 0.68, -0.05),
    new THREE.Vector2(bottomR, 0.02),
    new THREE.Vector2(bottomR * 0.98, height * 0.22),
    new THREE.Vector2(waistR, height * 0.48),
    new THREE.Vector2(chestR, height * 0.82),
    new THREE.Vector2(chestR * 0.62, height * 0.98),
    new THREE.Vector2(0.01, height),
  ];
  return new THREE.LatheGeometry(pts, 24);
}

function createLotusPedestal(accentColor: THREE.Color): { group: THREE.Group; glowMesh: THREE.Mesh } {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3b2645, roughness: 0.45, metalness: 0.3 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.08, 24), baseMat);
  disc.position.y = 0.04;
  disc.receiveShadow = true;
  disc.castShadow = true;
  group.add(disc);

  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: accentColor,
    emissiveIntensity: 0.22,
    roughness: 0.35,
  });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), petalMat);
    petal.scale.set(1.2, 0.45, 2.0);
    petal.position.set(Math.cos(a) * 0.36, 0.08, Math.sin(a) * 0.36);
    petal.rotation.y = -a + Math.PI * 0.5;
    petal.rotation.x = 0.22;
    group.add(petal);
  }

  const glowMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glowMesh = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.52, 32), glowMat);
  glowMesh.rotation.x = -Math.PI / 2;
  glowMesh.position.y = 0.015;
  group.add(glowMesh);

  return { group, glowMesh };
}

function createCrownOrHair(
  headPivot: THREE.Group,
  role: CharacterRole,
  name: string,
  setting: SceneSetting,
  headR: number,
): THREE.Group | undefined {
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1924, roughness: 0.72 });
  const silverHairMat = new THREE.MeshStandardMaterial({ color: 0xd9dce6, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5b82e, metalness: 0.85, roughness: 0.22 });
  const lower = name.toLowerCase();
  const isNarada = role === 'SageRishi' && (lower.includes('narad') || lower.includes('नारद'));
  const isGoddess = role === 'NobleWoman' && GODDESS_TOKENS.some((t) => lower.includes(t));

  if (role === 'KingCrown' || role === 'Divine' || (role === 'NobleWoman' && (isGoddess || lower.includes('rani') || lower.includes('रानी')))) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.34;
    headPivot.add(hair);

    const crownGroup = new THREE.Group();
    crownGroup.position.y = headR * 0.88;
    const baseBand = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.82, headR * 0.86, headR * 0.35, 20), goldMat);
    baseBand.castShadow = true;
    crownGroup.add(baseBand);

    const tierCount = role === 'Divine' ? 3 : 2;
    for (let t = 0; t < tierCount; t++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(headR * (0.65 - t * 0.16), headR * (0.55 - t * 0.08), 16),
        goldMat,
      );
      cone.position.y = headR * (0.32 + t * 0.32);
      cone.castShadow = true;
      crownGroup.add(cone);
    }

    const gemMat = new THREE.MeshStandardMaterial({
      color: role === 'Divine' ? 0x22d3ee : 0xf43f5e,
      emissive: role === 'Divine' ? 0x0ea5e9 : 0xe11d48,
      emissiveIntensity: 0.65,
      metalness: 0.2,
      roughness: 0.1,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(headR * 0.15, 0), gemMat);
    gem.position.set(0, headR * 0.08, headR * 0.82);
    crownGroup.add(gem);
    headPivot.add(crownGroup);

    if (role === 'NobleWoman') {
      const braid = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.22, headR * 1.4, 8, 12), hairMat);
      braid.position.set(0, -headR * 0.85, -headR * 0.82);
      braid.rotation.x = 0.24;
      headPivot.add(braid);
    }
    return undefined;
  }

  if (role === 'SageRishi') {
    const mat = isNarada ? new THREE.MeshStandardMaterial({ color: 0x2c2233, roughness: 0.7 }) : silverHairMat;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.47), mat);
    cap.scale.set(1.01, 1.11, 0.99);
    cap.rotation.x = -0.36;
    headPivot.add(cap);

    const topknot = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.42, 14, 12), mat);
    topknot.scale.set(0.9, 1.15, 0.9);
    topknot.position.set(0, headR * 1.24, -headR * 0.16);
    topknot.castShadow = true;
    headPivot.add(topknot);

    if (!isNarada) {
      const beard = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.52, headR * 0.95, 14), mat);
      beard.rotation.x = Math.PI;
      beard.position.set(0, -headR * 0.88, headR * 0.48);
      headPivot.add(beard);
    }
    return undefined;
  }

  if (role === 'ChildDevotee') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.47), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.36;
    headPivot.add(hair);

    // Cute front hairline lock above forehead
    const lock = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.22, 10, 8), hairMat);
    lock.scale.set(1.3, 0.65, 0.85);
    lock.position.set(-headR * 0.12, headR * 0.78, headR * 0.68);
    headPivot.add(lock);

    const band = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.90, headR * 0.065, 10, 24), goldMat);
    band.rotation.x = Math.PI / 2 - 0.34;
    band.position.set(0, headR * 0.55, headR * 0.06);
    headPivot.add(band);

    const emerald = new THREE.Mesh(
      new THREE.OctahedronGeometry(headR * 0.13, 0),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 }),
    );
    emerald.position.set(0, headR * 0.62, headR * 0.92);
    headPivot.add(emerald);
    return undefined;
  }

  if (role === 'NobleWoman') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.34;
    headPivot.add(hair);
    const braid = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.24, headR * 1.45, 8, 12), hairMat);
    braid.position.set(0, -headR * 0.85, -headR * 0.85);
    braid.rotation.x = 0.25;
    headPivot.add(braid);
    const tikka = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.1, 10, 8), goldMat);
    tikka.position.set(0, headR * 0.50, headR * 0.94);
    headPivot.add(tikka);
    return undefined;
  }

  if (role === 'Warrior') {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xa1a8b5, metalness: 0.78, roughness: 0.28 });
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.05, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.47), steelMat);
    helmet.scale.set(1.02, 1.12, 1.0);
    helmet.rotation.x = -0.32;
    headPivot.add(helmet);
    const crest = new THREE.Mesh(
      new THREE.TorusGeometry(headR * 0.7, headR * 0.12, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }),
    );
    crest.rotation.y = Math.PI / 2;
    crest.position.y = headR * 0.86;
    headPivot.add(crest);
    return undefined;
  }

  // Default Scholar / Comedy character hair (+ stylized quiff)
  if (setting === 'ComedyStage' || setting === 'ChaiStall') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.47), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.35;
    headPivot.add(hair);
    const quiff = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.36, 12, 10), hairMat);
    quiff.scale.set(1.25, 0.68, 1.35);
    quiff.position.set(0, headR * 0.95, headR * 0.36);
    headPivot.add(quiff);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.35;
    headPivot.add(hair);
  }
  return undefined;
}

export function createCharacterRig(
  profile: CharacterProfileJson,
  accentHex: string,
  setting: SceneSetting,
  facingSign: number,
  seedOffset: number,
): CharacterRig {
  const role = profile.role;
  const standing = isStandingScene(setting, role);
  const { robe, sash, skin, isDivine } = getRolePalette(role, profile.robeHex, accentHex);
  const accentColor = new THREE.Color(accentHex);

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const childScale = role === 'ChildDevotee' ? 0.86 : 1.0;
  bodyPivot.scale.setScalar(childScale);

  const robeMat = new THREE.MeshStandardMaterial({ color: robe, roughness: 0.58, metalness: 0.08 });
  const robeDarkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robe).multiplyScalar(0.75), roughness: 0.65 });
  const sashMat = new THREE.MeshStandardMaterial({ color: sash, roughness: 0.42, metalness: 0.25 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.48, metalness: 0.02 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf7be38, metalness: 0.85, roughness: 0.22 });

  // Ground halo / active speaker ring
  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.58, 36),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.012;
  root.add(auraRing);

  const auraDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 32),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }),
  );
  auraDisc.rotation.x = -Math.PI / 2;
  auraDisc.position.y = 0.01;
  root.add(auraDisc);

  let pedestalGlow: THREE.Mesh | undefined;
  let hipY = 0.14;

  if (standing) {
    hipY = 0.66;
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.245, 16, 12), robeDarkMat);
    pelvis.scale.set(1.06, 0.65, 0.88);
    pelvis.position.set(0, hipY - 0.01, 0);
    pelvis.castShadow = true;
    bodyPivot.add(pelvis);

    const legGeo = new THREE.CapsuleGeometry(0.108, 0.48, 8, 12);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.55 });
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, robeDarkMat);
      leg.position.set(side * 0.13, 0.39, 0);
      leg.castShadow = true;
      leg.receiveShadow = true;
      bodyPivot.add(leg);

      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), shoeMat);
      shoe.scale.set(0.95, 0.55, 1.55);
      shoe.position.set(side * 0.13, 0.055, 0.05);
      shoe.castShadow = true;
      bodyPivot.add(shoe);
    }
  } else {
    const lotus = createLotusPedestal(accentColor);
    pedestalGlow = lotus.glowMesh;
    bodyPivot.add(lotus.group);
    hipY = 0.15;

    // Crossed lotus-pose dhoti knees
    const dhotiBase = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 12), robeDarkMat);
    dhotiBase.scale.set(1.15, 0.45, 0.92);
    dhotiBase.position.set(0, hipY + 0.06, 0.03);
    dhotiBase.castShadow = true;
    dhotiBase.receiveShadow = true;
    bodyPivot.add(dhotiBase);
  }

  // Torso group
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = hipY;
  bodyPivot.add(torsoGroup);

  const torsoGeo = createLatheTorso(0.28, 0.21, 0.27, 0.62);
  const torsoMesh = new THREE.Mesh(torsoGeo, robeMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  const isModernComedy = (setting === 'ComedyStage' || setting === 'ChaiStall' || setting === 'ModernCity')
    && (role === 'Scholar');

  if (!isModernComedy) {
    // Diagonal silk Uttariya / sash hugging chest contour
    const sashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.53, 0.10),
      new THREE.Vector3(0.0, 0.33, 0.21),
      new THREE.Vector3(0.20, 0.11, 0.12),
      new THREE.Vector3(0.16, 0.14, -0.15),
    ]);
    const sashMesh = new THREE.Mesh(new THREE.TubeGeometry(sashCurve, 18, 0.042, 8, false), sashMat);
    sashMesh.castShadow = true;
    torsoGroup.add(sashMesh);

    // Golden waist belt & kanthi mala necklace
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 8, 22), goldMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.24;
    torsoGroup.add(belt);

    const mala = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.02, 8, 20), goldMat);
    mala.rotation.x = Math.PI / 2 + 0.25;
    mala.position.set(0, 0.57, 0.04);
    torsoGroup.add(mala);
  } else {
    // Clean modern collar + pocket square / jacket accent for comedy & tapri scenes
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.024, 8, 20), sashMat);
    collar.rotation.x = Math.PI / 2 + 0.2;
    collar.position.set(0, 0.58, 0.03);
    torsoGroup.add(collar);
  }

  // Narada's 3D Veena or Warrior Shield/Spear
  const lowerName = profile.name.toLowerCase();
  if (role === 'SageRishi' && (lowerName.includes('narad') || lowerName.includes('नारद'))) {
    const veena = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.42 });
    const dandi = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 10), woodMat);
    dandi.rotation.z = -0.68;
    veena.add(dandi);
    const gourdBottom = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), woodMat);
    gourdBottom.position.set(-0.26, -0.32, 0.04);
    veena.add(gourdBottom);
    const gourdTop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), woodMat);
    gourdTop.position.set(0.24, 0.3, 0.04);
    veena.add(gourdTop);
    veena.position.set(0, 0.34, 0.28);
    torsoGroup.add(veena);
  } else if (role === 'Warrior') {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), goldMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(-0.34, 0.28, 0.08);
    torsoGroup.add(shield);
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.45, 8), new THREE.MeshStandardMaterial({ color: 0x6b4423 }));
    spear.position.set(0.36, 0.55, 0.02);
    torsoGroup.add(spear);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85 }));
    tip.position.set(0.36, 1.32, 0.02);
    torsoGroup.add(tip);
  }

  // Two Articulated Arms (Left & Right shoulders -> elbows -> hands)
  const upperArmGeo = new THREE.CapsuleGeometry(0.068, 0.22, 6, 10);
  const forearmGeo = new THREE.CapsuleGeometry(0.056, 0.20, 6, 10);

  const buildArm = (side: -1 | 1): { shoulder: THREE.Group; elbow: THREE.Group } => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.23, 0.51, 0);
    torsoGroup.add(shoulder);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), robeMat);
    shoulderCap.castShadow = true;
    shoulder.add(shoulderCap);

    const upper = new THREE.Mesh(upperArmGeo, robeMat);
    upper.position.y = -0.14;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);

    const lower = new THREE.Mesh(forearmGeo, robeMat);
    lower.position.y = -0.12;
    lower.castShadow = true;
    elbow.add(lower);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.064, 12, 10), skinMat);
    hand.scale.set(0.95, 1.18, 0.78);
    hand.position.y = -0.25;
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Neck + Sculpted Expressive 3D Head
  const headR = role === 'ChildDevotee' ? 0.265 : 0.245;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.14, 14), skinMat);
  neck.position.y = 0.65;
  torsoGroup.add(neck);

  const headPivot = new THREE.Group();
  headPivot.position.y = 0.68 + headR * 0.92;
  torsoGroup.add(headPivot);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headR, 26, 20), skinMat);
  headMesh.scale.set(0.98, 1.08, 0.95);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headPivot.add(headMesh);

  // Sculpted small nose + warm ear Kundals
  const nose = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.14, 10, 8), skinMat);
  nose.scale.set(0.85, 1.05, 1.2);
  nose.position.set(0, -headR * 0.04, headR * 0.94);
  headPivot.add(nose);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.18, 10, 8), skinMat);
    ear.scale.set(0.5, 1.2, 0.8);
    ear.position.set(s * headR * 0.96, -headR * 0.04, 0);
    headPivot.add(ear);
    const kundal = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.1, headR * 0.025, 8, 14), goldMat);
    kundal.rotation.y = Math.PI / 2;
    kundal.position.set(s * headR * 0.98, -headR * 0.2, 0.01);
    headPivot.add(kundal);
  }

  // Tilak / Bindi (for devotional / cultural roles; omitted on casual modern comedy hosts)
  if (role === 'NobleWoman') {
    const bindi = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
    bindi.scale.z = 0.4;
    bindi.position.set(0, headR * 0.24, headR * 0.96);
    headPivot.add(bindi);
  } else if (role !== 'Warrior' && !isModernComedy) {
    const tilak = new THREE.Mesh(
      new THREE.CapsuleGeometry(headR * 0.036, headR * 0.16, 4, 8),
      new THREE.MeshStandardMaterial({ color: role === 'Divine' ? 0xfbbf24 : 0xea580c, emissive: 0x7c2d12, emissiveIntensity: 0.2 }),
    );
    tilak.position.set(0, headR * 0.28, headR * 0.95);
    headPivot.add(tilak);
  } else if (isModernComedy && facingSign > 0) {
    // Signature round spectacles on the straight-man comedy host
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.25 });
    for (const s of [-1, 1]) {
      const glass = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.19, headR * 0.022, 8, 18), rimMat);
      glass.position.set(s * headR * 0.36, headR * 0.09, headR * 0.96);
      headPivot.add(glass);
    }
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.018, headR * 0.018, headR * 0.34, 6), rimMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, headR * 0.11, headR * 0.96);
    headPivot.add(bridge);
  }

  // Hair / Crown + Divine spinning Halo Chakra
  createCrownOrHair(headPivot, role, profile.name, setting, headR);

  let haloGroup: THREE.Group | undefined;
  let haloMaterial: THREE.MeshBasicMaterial | undefined;
  const isGoddess = role === 'NobleWoman' && GODDESS_TOKENS.some((t) => lowerName.includes(t));
  if (isDivine || role === 'SageRishi' || isGoddess) {
    haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.04, -headR * 0.72);
    haloMaterial = new THREE.MeshBasicMaterial({
      color: isDivine ? 0xffe066 : accentColor,
      transparent: true,
      opacity: isDivine ? 0.65 : 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringOuter = new THREE.Mesh(new THREE.RingGeometry(headR * 1.45, headR * 1.62, 32), haloMaterial);
    haloGroup.add(ringOuter);
    for (let s = 0; s < 8; s++) {
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(headR * 0.08, headR * 0.45), haloMaterial);
      const a = (s / 8) * Math.PI * 2;
      ray.position.set(Math.cos(a) * headR * 1.54, Math.sin(a) * headR * 1.54, 0);
      ray.rotation.z = a + Math.PI / 2;
      haloGroup.add(ray);
    }
    headPivot.add(haloGroup);
  }

  // Layered 3D Eyes + Eyelids + Brows
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x2a1c17, roughness: 0.15 });
  const lidMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.48 });
  const browMat = new THREE.MeshStandardMaterial({ color: role === 'SageRishi' ? 0xd9dce6 : 0x1c1722, roughness: 0.6 });

  const buildEye = (side: -1 | 1) => {
    const eyeX = side * headR * 0.36;
    const eyeY = headR * 0.09;
    const eyeZ = headR * 0.85;

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.17, 14, 12), whiteMat);
    sclera.scale.set(1.0, 1.05, 0.6);
    sclera.position.set(eyeX, eyeY, eyeZ);
    headPivot.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.105, 12, 10), irisMat);
    pupil.scale.set(1, 1, 0.6);
    pupil.position.set(eyeX, eyeY, eyeZ + headR * 0.06);
    headPivot.add(pupil);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.035, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    glint.position.set(eyeX + headR * 0.035, eyeY + headR * 0.035, eyeZ + headR * 0.105);
    headPivot.add(glint);

    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      lidMat,
    );
    eyelid.scale.set(1.02, 1.05, 0.65);
    eyelid.position.set(eyeX, eyeY, eyeZ);
    eyelid.rotation.x = -Math.PI * 0.48;
    headPivot.add(eyelid);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.032, headR * 0.22, 4, 8), browMat);
    brow.rotation.z = Math.PI / 2;
    brow.position.set(eyeX, eyeY + headR * 0.25, eyeZ + headR * 0.08);
    headPivot.add(brow);

    return { eyelid, brow };
  };

  const leftEye = buildEye(-1);
  const rightEye = buildEye(1);

  // Expressive 3D Articulated Mouth (cavity + upper & lower lips)
  const mouthY = -headR * 0.36;
  const mouthZ = headR * 0.86;
  const mouthCavity = new THREE.Mesh(
    new THREE.SphereGeometry(headR * 0.16, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x54111e }),
  );
  mouthCavity.scale.set(1.1, 0.2, 0.45);
  mouthCavity.position.set(0, mouthY, mouthZ - 0.01);
  headPivot.add(mouthCavity);

  const lipMat = new THREE.MeshStandardMaterial({ color: 0xa64444, roughness: 0.42 });
  const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.032, headR * 0.22, 4, 8), lipMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, mouthY + headR * 0.03, mouthZ + 0.03);
  headPivot.add(upperLip);

  const lowerLip = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.034, headR * 0.19, 4, 8), lipMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, mouthY - headR * 0.03, mouthZ + 0.03);
  headPivot.add(lowerLip);

  // Rotate character toward partner at ~24 deg for lively 3/4 film staging
  root.rotation.y = facingSign * 0.42;

  return {
    root,
    bodyPivot,
    torsoGroup,
    headPivot,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftEyelid: leftEye.eyelid,
    rightEyelid: rightEye.eyelid,
    leftBrow: leftEye.brow,
    rightBrow: rightEye.brow,
    mouthCavity,
    upperLip,
    lowerLip,
    haloGroup,
    haloMaterial,
    auraRing,
    auraDisc,
    pedestalGlow,
    role,
    name: profile.name,
    facingSign,
    standing,
    seedOffset,
  };
}

export function updateCharacterRig(
  rig: CharacterRig,
  t: number,
  isSpeaking: boolean,
  speechLevel: number,
  emotion: EmotionKind,
  isTitleOrGreeting: boolean,
): void {
  const lt = t + rig.seedOffset;

  // Breathing + subtle animated idle/speaking weight shift
  const breath = Math.sin(lt * 2.1) * (isSpeaking ? 0.018 : 0.008);
  rig.torsoGroup.position.y = (rig.standing ? 0.66 : 0.15) + breath;

  const bounce = isSpeaking && rig.standing ? Math.abs(Math.sin(lt * 7.2)) * 0.035 : 0;
  rig.bodyPivot.position.y = bounce;

  // Head nod + gaze toward conversation partner vs viewer
  const talkNod = isSpeaking ? Math.sin(lt * 5.2) * 0.075 : Math.sin(lt * 1.4) * 0.025;
  const sideTilt = emotion === 'confused' ? 0.16 : isSpeaking ? Math.sin(lt * 2.6) * 0.06 : 0;
  rig.headPivot.rotation.x = talkNod;
  rig.headPivot.rotation.z = sideTilt;
  rig.headPivot.rotation.y = rig.facingSign * (isSpeaking ? -0.14 : 0.1);

  // Eyeblinks & emotion eyelids
  const blinkPhase = (lt * 0.28) % 1;
  const blinking = blinkPhase > 0.955;
  let lidClose = -Math.PI * 0.48;
  if (blinking) lidClose = 0.15;
  else if (emotion === 'laughing') lidClose = 0.04;
  else if (emotion === 'sad') lidClose = -Math.PI * 0.28;
  else if (emotion === 'surprised') lidClose = -Math.PI * 0.62;
  rig.leftEyelid.rotation.x = lidClose;
  rig.rightEyelid.rotation.x = lidClose;

  // Expressive eyebrows per emotion
  const baseBrowY = 0.085;
  let lift = isSpeaking ? 0.012 : 0;
  let browTilt = 0;
  if (emotion === 'surprised') {
    lift = 0.032;
    browTilt = 0.16;
  } else if (emotion === 'angry') {
    lift = -0.015;
    browTilt = -0.32;
  } else if (emotion === 'sad') {
    lift = 0.01;
    browTilt = 0.25;
  } else if (emotion === 'laughing' || emotion === 'happy') {
    lift = 0.024;
    browTilt = 0.12;
  }
  rig.leftBrow.position.y = baseBrowY + lift;
  rig.rightBrow.position.y = baseBrowY + lift;
  rig.leftBrow.rotation.z = Math.PI / 2 - browTilt;
  rig.rightBrow.rotation.z = Math.PI / 2 + browTilt;

  // Lip-sync driven strictly by audio envelope + multi-viseme shape modulation
  const openAmt = isSpeaking ? Math.min(1, speechLevel * 1.35) : 0;
  const vowelWave = 0.5 + 0.5 * Math.sin(t * 21.0 + rig.seedOffset);
  const mouthOpen = openAmt > 0.04 ? 0.12 + openAmt * (0.55 + 0.35 * vowelWave) : 0.03;
  const mouthWide = openAmt > 0.04 ? 0.85 + 0.35 * (1 - vowelWave) : (emotion === 'happy' || emotion === 'laughing' ? 1.22 : 0.95);

  rig.mouthCavity.scale.set(1.05 * mouthWide, mouthOpen, 0.5);
  rig.upperLip.position.y = -0.088 + mouthOpen * 0.024;
  rig.lowerLip.position.y = -0.088 - mouthOpen * 0.048;

  // Expressive two-arm skeletal animation
  if (isTitleOrGreeting && !rig.standing) {
    // Serene Namaste folded hands
    rig.leftShoulder.rotation.set(-0.95, 0.25, -0.42);
    rig.leftElbow.rotation.set(-1.35, 0, -0.5);
    rig.rightShoulder.rotation.set(-0.95, -0.25, 0.42);
    rig.rightElbow.rotation.set(-1.35, 0, 0.5);
  } else if (isSpeaking) {
    if (emotion === 'surprised') {
      rig.leftShoulder.rotation.set(-1.3, 0.2, 0.55);
      rig.leftElbow.rotation.set(-0.65, 0, 0);
      rig.rightShoulder.rotation.set(-1.35, -0.2, -0.55);
      rig.rightElbow.rotation.set(-0.65, 0, 0);
    } else if (emotion === 'laughing') {
      const shake = Math.sin(lt * 13) * 0.18;
      rig.leftShoulder.rotation.set(-0.7 + shake, 0.2, 0.25);
      rig.leftElbow.rotation.set(-1.1, 0, 0.2);
      rig.rightShoulder.rotation.set(-0.7 - shake, -0.2, -0.25);
      rig.rightElbow.rotation.set(-1.1, 0, -0.2);
    } else {
      const g1 = Math.sin(lt * 4.8) * 0.32;
      const g2 = Math.cos(lt * 3.9) * 0.24;
      rig.rightShoulder.rotation.set(-0.85 + g1, -0.2, -0.26);
      rig.rightElbow.rotation.set(-0.95 + g2, 0, 0);
      rig.leftShoulder.rotation.set(-0.42 + g2 * 0.4, 0.15, 0.18);
      rig.leftElbow.rotation.set(-0.85, 0, -0.15);
    }
  } else {
    // Calm attentive listening / lotus mudra
    rig.leftShoulder.rotation.set(-0.32, 0.12, 0.18);
    rig.leftElbow.rotation.set(-0.85, 0, -0.25);
    rig.rightShoulder.rotation.set(-0.32, -0.12, -0.18);
    rig.rightElbow.rotation.set(-0.85, 0, 0.25);
  }

  // Aura rings + divine chakra rotation
  const ringMat = rig.auraRing.material as THREE.MeshBasicMaterial;
  const discMat = rig.auraDisc.material as THREE.MeshBasicMaterial;
  ringMat.opacity = isSpeaking ? 0.55 + 0.15 * Math.sin(lt * 5) : 0.18;
  discMat.opacity = isSpeaking ? 0.22 : 0.06;
  const pulseScale = isSpeaking ? 1.08 + 0.06 * Math.sin(lt * 4.5) : 0.92;
  rig.auraRing.scale.setScalar(pulseScale);

  if (rig.haloGroup && rig.haloMaterial) {
    rig.haloGroup.rotation.z = t * 0.45;
    rig.haloMaterial.opacity = rig.role === 'Divine' ? 0.72 : isSpeaking ? 0.42 : 0.18;
  }
  if (rig.pedestalGlow) {
    const pm = rig.pedestalGlow.material as THREE.MeshBasicMaterial;
    pm.opacity = isSpeaking ? 0.48 : 0.22;
  }
}
