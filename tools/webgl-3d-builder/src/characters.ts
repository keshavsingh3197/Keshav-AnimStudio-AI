import * as THREE from 'three';
import { ActionKind, CharacterProfileJson, CharacterRole, EmotionKind, SceneSetting, STRIKE_TIMING, strikePhase } from './types';
import { buildCharacterHandProps, HeldPropRig, updateHandPropAnimation } from './props';
import {
  attachAsuraKingDetails,
  attachNarasimhaLionHead,
  attachSacredPattaAndDhoti,
  attachScallopedMukutCrown,
  detectMythicArchetype,
  getMythicPaletteOverride,
} from './mythic-characters';

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torsoGroup: THREE.Group;
  headPivot: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip?: THREE.Group;
  rightHip?: THREE.Group;
  leftKnee?: THREE.Group;
  rightKnee?: THREE.Group;
  snackProp?: THREE.Group;
  handProps?: HeldPropRig;
  headY: number;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  leftBrow: THREE.Mesh;
  rightBrow: THREE.Mesh;
  leftSclera: THREE.Mesh;
  rightSclera: THREE.Mesh;
  leftPupil: THREE.Mesh;
  rightPupil: THREE.Mesh;
  mouthCavity: THREE.Mesh;
  upperLip: THREE.Mesh;
  lowerLip: THREE.Mesh;
  glassesGroup?: THREE.Group;
  glassesBaseY?: number;
  hairFullGroup?: THREE.Group;
  hairShavedGroup?: THREE.Group;
  leftCheekFlush?: THREE.Mesh;
  rightCheekFlush?: THREE.Mesh;
  leftTearBead?: THREE.Mesh;
  rightTearBead?: THREE.Mesh;
  sweatDropGroup?: THREE.Group;
  angerMarkGroup?: THREE.Group;
  haloGroup?: THREE.Group;
  haloMaterial?: THREE.MeshBasicMaterial;
  auraRing: THREE.Mesh;
  auraDisc: THREE.Mesh;
  pedestalGlow?: THREE.Mesh;
  turretGroup?: THREE.Group;
  cannonBarrel?: THREE.Mesh;
  propPivot?: THREE.Group;
  chakraWheel?: THREE.Group;
  lowerJawPivot?: THREE.Group;
  pattaEnds?: THREE.Object3D[];
  isNarasimha?: boolean;
  isAsuraKing?: boolean;
  isHolika?: boolean;
  mouthBaseY: number;
  baseTorsoY: number;
  restScale: number;
  topY: number;
  role: CharacterRole;
  name: string;
  facingSign: number;
  standing: boolean;
  hasFloorAura?: boolean;
  seedOffset: number;
}

export interface ExternalBodyPose {
  leftShoulderZ: number;
  leftElbowZ: number;
  rightShoulderZ: number;
  rightElbowZ: number;
  torsoTiltX: number;
  torsoTiltZ: number;
  headTiltZ: number;
  headYawY: number;
  hipOffsetX: number;
  hipBounceY: number;
  emotion?: EmotionKind;
  mouthOpen?: number;
  /**
   * Full 3D joints (metres, hip-centred, rig space: +X = the rig's `right*` side of the screen,
   * +Y up, +Z toward the camera). When present they drive every bone, legs included, and the
   * legacy 2D angles above are ignored.
   */
  joints?: PoseJoints3D | null;
  /** Extra lift for jumps, metres above the floor contact. */
  liftY?: number;
  /** Knee bend (radians) used as a groove when the legs are out of frame. */
  grooveBend?: number;
}

export interface JointPoint3D {
  x: number;
  y: number;
  z: number;
}

/** Joint names follow the rig: `l*` drives the bones on the screen-left (-X) side. */
export interface PoseJoints3D {
  lShoulder: JointPoint3D | null;
  rShoulder: JointPoint3D | null;
  lElbow: JointPoint3D | null;
  rElbow: JointPoint3D | null;
  lWrist: JointPoint3D | null;
  rWrist: JointPoint3D | null;
  lHip: JointPoint3D | null;
  rHip: JointPoint3D | null;
  lKnee: JointPoint3D | null;
  rKnee: JointPoint3D | null;
  lAnkle: JointPoint3D | null;
  rAnkle: JointPoint3D | null;
  nose: JointPoint3D | null;
  lEar: JointPoint3D | null;
  rEar: JointPoint3D | null;
}

/** Mirrors joints across the rig's centre line (left ⇄ right, x negated). */
export function mirrorPoseJoints(j: PoseJoints3D): PoseJoints3D {
  const m = (p: JointPoint3D | null): JointPoint3D | null => (p ? { x: -p.x, y: p.y, z: p.z } : null);
  return {
    lShoulder: m(j.rShoulder),
    rShoulder: m(j.lShoulder),
    lElbow: m(j.rElbow),
    rElbow: m(j.lElbow),
    lWrist: m(j.rWrist),
    rWrist: m(j.lWrist),
    lHip: m(j.rHip),
    rHip: m(j.lHip),
    lKnee: m(j.rKnee),
    rKnee: m(j.lKnee),
    lAnkle: m(j.rAnkle),
    rAnkle: m(j.lAnkle),
    nose: m(j.nose),
    lEar: m(j.rEar),
    rEar: m(j.lEar),
  };
}

const GODDESS_TOKENS = ['devi', 'mata', 'durga', 'lakshmi', 'laxmi', 'saraswati', 'parvati', 'sita', 'radha', 'देवी', 'माता', 'दुर्गा', 'लक्ष्मी', 'सरस्वती', 'पार्वती', 'सीता', 'राधा'];

function isStandingScene(setting: SceneSetting, role: CharacterRole): boolean {
  if (role === 'Warrior' || role === 'KingCrown' || role === 'BrainrotLog' || role === 'CupDancer' || role === 'CartoonTank' || role === 'ComicBobble') return true;
  if (role !== 'Narrator' && (setting === 'Temple' || setting === 'ForestAshram' || setting === 'RiverGhat' || setting === 'Himalaya')) return true;
  return setting === 'ComedyStage'
    || setting === 'ChaiStall'
    || setting === 'SkyGauntlet'
    || setting === 'TankArena'
    || setting === 'DoorwaySet'
    || setting === 'Bedroom'
    || setting === 'LivingRoom'
    || setting === 'Kitchen'
    || setting === 'SweetShop'
    || setting === 'BarberShop'
    || setting === 'Courtroom'
    || setting === 'DoctorClinic'
    || setting === 'Classroom'
    || setting === 'QuizStudio'
    || setting === 'NeighborhoodGate'
    || setting === 'Battlefield'
    || setting === 'PalaceCourt'
    || setting === 'ModernCity'
    || setting === 'Village'
    || setting === 'Archive';
}

function isDomesticOrComedySetting(setting: SceneSetting): boolean {
  return setting === 'ComedyStage'
    || setting === 'ChaiStall'
    || setting === 'SkyGauntlet'
    || setting === 'TankArena'
    || setting === 'DoorwaySet'
    || setting === 'Bedroom'
    || setting === 'LivingRoom'
    || setting === 'Kitchen'
    || setting === 'SweetShop'
    || setting === 'BarberShop'
    || setting === 'Courtroom'
    || setting === 'DoctorClinic'
    || setting === 'Classroom'
    || setting === 'QuizStudio'
    || setting === 'NeighborhoodGate'
    || setting === 'ModernCity';
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
      skin = 0x5b8def;
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
    case 'BrainrotLog':
      robe = 0x9a5b28;
      sash = 0xfacc15;
      skin = 0xb8763e;
      break;
    case 'CupDancer':
      robe = 0xf8fafc;
      sash = 0xf472b6;
      skin = 0xffffff;
      break;
    case 'CartoonTank':
      robe = 0x4d7c3f;
      sash = 0xfacc15;
      skin = 0x365314;
      break;
    case 'ComicBobble':
      robe = 0xf97316;
      sash = 0x38bdf8;
      skin = 0xf1c29b;
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
  robeHex?: number,
  attire?: 'auto' | 'turban' | 'anarkali' | null,
): { hairFullGroup?: THREE.Group; hairShavedGroup?: THREE.Group } | undefined {
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1924, roughness: 0.72 });
  const silverHairMat = new THREE.MeshStandardMaterial({ color: 0xd9dce6, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5b82e, metalness: 0.85, roughness: 0.22 });
  const lower = name.toLowerCase();
  const isNarada = role === 'SageRishi' && (lower.includes('narad') || lower.includes('नारद'));
  const isGoddess = role === 'NobleWoman' && GODDESS_TOKENS.some((t) => lower.includes(t));
  const isMythicKingOrAsura = /hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|harishchandra|dashrath|yudhishthir|duryodhan|bali|bhasmasur|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य|हरिश्चंद्र|दशरथ|युधिष्ठिर|दुर्योधन|बलि/i.test(lower);
  const useTurban = role === 'KingCrown' && !isMythicKingOrAsura && (
    attire === 'turban'
    || setting === 'PalaceCourt'
    || /sartaaj|sufi|shayar|prince|dulha|singer/i.test(lower)
  ) && !/maharaj|raja|samrat|emperor/i.test(lower);

  if (useTurban) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.02, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), hairMat);
    hair.rotation.x = -0.32;
    headPivot.add(hair);

    // Royal Punjabi / Rajputana layered Silk Pagdi (Turban) seated high above eyebrows with Zardozi brooch & Kalgi
    const pagdiGroup = new THREE.Group();
    const pagdiColor = setting === 'PalaceCourt' ? 0xf5efe6 : (robeHex ?? 0x99243a);
    const pagdiMat = new THREE.MeshStandardMaterial({ color: pagdiColor, roughness: 0.62 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.08, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), pagdiMat);
    dome.scale.set(1.04, 0.78, 1.06);
    dome.position.set(0, headR * 0.48, -headR * 0.06);
    dome.castShadow = true;
    pagdiGroup.add(dome);

    for (let w = 0; w < 3; w++) {
      const wrap = new THREE.Mesh(
        new THREE.TorusGeometry(headR * (0.94 + (w === 1 ? 0.04 : 0)), headR * 0.105, 10, 24),
        w === 1 ? pagdiMat : new THREE.MeshStandardMaterial({ color: pagdiColor, roughness: 0.55 }),
      );
      wrap.rotation.x = Math.PI / 2 - 0.28 + w * 0.10;
      wrap.rotation.z = (w - 1) * 0.14;
      wrap.position.set(0, headR * (0.60 + w * 0.14), -headR * 0.02);
      wrap.castShadow = true;
      pagdiGroup.add(wrap);
    }

    const kalgiBase = new THREE.Mesh(new THREE.OctahedronGeometry(headR * 0.15, 0), goldMat);
    kalgiBase.position.set(headR * 0.16, headR * 1.02, headR * 0.74);
    pagdiGroup.add(kalgiBase);

    const kalgiPlume = new THREE.Mesh(
      new THREE.ConeGeometry(headR * 0.12, headR * 0.44, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xd97706, emissiveIntensity: 0.25, roughness: 0.45 }),
    );
    kalgiPlume.position.set(headR * 0.19, headR * 1.26, headR * 0.64);
    kalgiPlume.rotation.z = -0.20;
    kalgiPlume.rotation.x = -0.16;
    pagdiGroup.add(kalgiPlume);

    headPivot.add(pagdiGroup);

    // Clean trimmed jawline beard + slim mustache kept strictly below lower lip so mouth & eyes stay crisp
    const chinBeard = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.46, 14, 10), hairMat);
    chinBeard.scale.set(1.22, 0.65, 0.78);
    chinBeard.position.set(0, -headR * 0.72, headR * 0.54);
    headPivot.add(chinBeard);

    const mustache = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.036, headR * 0.28, 4, 8), hairMat);
    mustache.rotation.z = Math.PI / 2;
    mustache.position.set(0, -headR * 0.20, headR * 0.94);
    headPivot.add(mustache);
    return undefined;
  }

  if (role === 'Divine' && /shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(lower)) {
    const jataMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.72 });
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.04, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), jataMat);
    hairCap.scale.set(1.02, 1.12, 1.0);
    hairCap.rotation.x = -0.34;
    headPivot.add(hairCap);

    // Tall matted Shiva Jata topknot + silver Ardha-Chandra (Crescent Moon) + sapphire Ganga jewel
    const jataBun = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.46, 16, 14), jataMat);
    jataBun.scale.set(0.88, 1.32, 0.88);
    jataBun.position.set(0, headR * 1.24, -headR * 0.12);
    jataBun.castShadow = true;
    headPivot.add(jataBun);

    const crescentMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xe0f2fe,
      emissiveIntensity: 0.85,
      metalness: 0.45,
      roughness: 0.15,
    });
    const moonArc = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.25, headR * 0.048, 8, 20, Math.PI * 1.22), crescentMat);
    moonArc.position.set(-headR * 0.36, headR * 1.12, headR * 0.26);
    moonArc.rotation.z = Math.PI * 0.68;
    moonArc.rotation.y = 0.22;
    headPivot.add(moonArc);

    // Pure sapphire-white Ganga stream emerging from top of Shiva's Jata
    const gangaMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.65,
      roughness: 0.18,
    });
    const gangaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, headR * 1.62, -headR * 0.08),
      new THREE.Vector3(headR * 0.22, headR * 1.78, -headR * 0.16),
      new THREE.Vector3(headR * 0.42, headR * 1.48, -headR * 0.34),
      new THREE.Vector3(headR * 0.48, headR * 0.96, -headR * 0.56),
    ]);
    headPivot.add(new THREE.Mesh(new THREE.TubeGeometry(gangaCurve, 16, headR * 0.055, 8, false), gangaMat));

    const rudraBand = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.42, headR * 0.042, 8, 16), goldMat);
    rudraBand.rotation.x = Math.PI / 2;
    rudraBand.position.set(0, headR * 0.96, -headR * 0.12);
    headPivot.add(rudraBand);
    return undefined;
  }

  if (role === 'KingCrown' || role === 'Divine' || (role === 'NobleWoman' && (isGoddess || (setting !== 'PalaceCourt' && (lower.includes('rani') || lower.includes('रानी')))))) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.34;
    headPivot.add(hair);

    const isAsura = /hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/i.test(lower);
    const crownVariant = isAsura
      ? 'asuraKing'
      : /krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/i.test(lower)
        ? 'krishna'
        : /ram|raghav|raghunath|राम|राघव/i.test(lower)
          ? 'ram'
          : role === 'Divine'
            ? 'vishnu'
            : 'sacred';
    attachScallopedMukutCrown(headPivot, headR, goldMat, crownVariant);

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

    if (!isDomesticOrComedySetting(setting)) {
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
    }
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

  // Default Scholar / Comedy character hair + swappable "shaved / katora" patch stage for Salon comedy
  if (role === 'ComicBobble' || isDomesticOrComedySetting(setting)) {
    const hairFullGroup = new THREE.Group();
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.06, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.50), hairMat);
    hair.scale.set(1.04, 1.15, 1.05);
    hair.position.set(0, headR * 0.06, -headR * 0.02);
    hair.rotation.x = -0.15;
    hairFullGroup.add(hair);
    if (role === 'ComicBobble') {
      // MJO-style playful spiky hair tufts on comic lead
      for (const ang of [-0.35, 0, 0.35]) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.15, headR * 0.40, 8), hairMat);
        tuft.position.set(ang * headR * 0.85, headR * 1.14, headR * 0.20);
        tuft.rotation.z = -ang * 0.65;
        tuft.rotation.x = 0.24;
        hairFullGroup.add(tuft);
      }
      const frontBangs = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.38, 12, 10), hairMat);
      frontBangs.scale.set(1.38, 0.56, 0.98);
      frontBangs.position.set(0, headR * 0.92, headR * 0.52);
      hairFullGroup.add(frontBangs);
    } else {
      // Lush front-visible MJO quiff + forehead bangs + side locks so Scholar/Customer hair is 100% visible from the front camera
      const quiff = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.46, 14, 12), hairMat);
      quiff.scale.set(1.48, 0.78, 1.38);
      quiff.position.set(0, headR * 1.10, headR * 0.36);
      hairFullGroup.add(quiff);
      const frontBangs = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.36, 12, 10), hairMat);
      frontBangs.scale.set(1.42, 0.54, 0.96);
      frontBangs.position.set(0, headR * 0.92, headR * 0.56);
      hairFullGroup.add(frontBangs);
      for (const side of [-1, 1]) {
        const sideWave = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.14, headR * 0.34, 8), hairMat);
        sideWave.position.set(side * headR * 0.42, headR * 1.16, headR * 0.26);
        sideWave.rotation.z = -side * 0.48;
        sideWave.rotation.x = 0.28;
        hairFullGroup.add(sideWave);
      }
    }
    headPivot.add(hairFullGroup);

    // Hilarious "Katora / Maidan Saaf" smooth glossy Takla dome with clean curved ear-side fringes (shown ONLY on haircut stage >= 2!)
    const hairShavedGroup = new THREE.Group();
    hairShavedGroup.visible = false;
    const horseshoeFringe = new THREE.Mesh(
      new THREE.TorusGeometry(headR * 0.88, headR * 0.11, 8, 22, Math.PI * 1.15),
      hairMat,
    );
    horseshoeFringe.rotation.x = Math.PI / 2 + 0.18;
    horseshoeFringe.rotation.z = -Math.PI * 0.075;
    horseshoeFringe.position.set(0, headR * 0.16, -headR * 0.10);
    hairShavedGroup.add(horseshoeFringe);
    const comicTuft = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.06, headR * 0.16, 6), hairMat);
    comicTuft.position.set(0, headR * 1.08, -headR * 0.12);
    hairShavedGroup.add(comicTuft);
    // Comical MJO-style glossy bald head shine ("चाँद चमक गई!")
    const scalpShineMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e7,
      emissive: 0xffe4b5,
      emissiveIntensity: 0.48,
      roughness: 0.10,
    });
    const scalpShine = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.25, 12, 10), scalpShineMat);
    scalpShine.scale.set(1.30, 0.32, 0.92);
    scalpShine.position.set(0.08 * headR, headR * 0.92, headR * 0.34);
    scalpShine.rotation.z = -0.18;
    scalpShine.rotation.x = 0.28;
    hairShavedGroup.add(scalpShine);
    headPivot.add(hairShavedGroup);

    return { hairFullGroup, hairShavedGroup };
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.35;
    headPivot.add(hair);
  }
  return undefined;
}

interface FaceRigParts {
  leftEye: { sclera: THREE.Mesh; pupil: THREE.Mesh; eyelid: THREE.Mesh; brow: THREE.Mesh };
  rightEye: { sclera: THREE.Mesh; pupil: THREE.Mesh; eyelid: THREE.Mesh; brow: THREE.Mesh };
  mouthCavity: THREE.Mesh;
  upperLip: THREE.Mesh;
  lowerLip: THREE.Mesh;
  mouthBaseY: number;
}

function attachFaceRig(
  headPivot: THREE.Group,
  headR: number,
  skin: number,
  browHex: number,
  surfaceZ: number,
  isGoogly: boolean,
): FaceRigParts {
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.18 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x1e1412, roughness: 0.12 });
  const lidMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.48 });
  const browMat = new THREE.MeshStandardMaterial({ color: browHex, roughness: 0.55 });
  const eyeScale = isGoogly ? 1.38 : 1.0;

  const buildEye = (side: -1 | 1) => {
    const eyeX = side * headR * (isGoogly ? 0.38 : 0.36);
    const eyeY = headR * 0.09;
    const eyeZ = surfaceZ;

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.165 * eyeScale, 14, 12), whiteMat);
    sclera.scale.set(1.06, 0.90, 0.56);
    sclera.position.set(eyeX, eyeY, eyeZ);
    headPivot.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.098 * (isGoogly ? 1.15 : 1.0), 12, 10), irisMat);
    pupil.scale.set(1, 0.95, 0.62);
    pupil.position.set(eyeX, eyeY, eyeZ + headR * 0.068 * eyeScale);
    headPivot.add(pupil);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.036 * eyeScale, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    glint.position.set(eyeX + headR * 0.032, eyeY + headR * 0.035, eyeZ + headR * 0.115 * eyeScale);
    headPivot.add(glint);

    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.18 * eyeScale, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      lidMat,
    );
    eyelid.scale.set(1.02, 1.05, 0.65);
    eyelid.position.set(eyeX, eyeY, eyeZ);
    eyelid.rotation.x = -Math.PI * 0.48;
    headPivot.add(eyelid);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.034 * eyeScale, headR * 0.22 * eyeScale, 4, 8), browMat);
    brow.rotation.z = Math.PI / 2;
    brow.position.set(eyeX, eyeY + headR * 0.25 * eyeScale, eyeZ + headR * 0.08 * eyeScale);
    headPivot.add(brow);

    return { sclera, pupil, eyelid, brow };
  };

  const leftEye = buildEye(-1);
  const rightEye = buildEye(1);

  // Sculpted nose bridge & golden Makara-kundala ear ornaments for balanced facial dimension
  const noseMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.45 });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.085, 10, 8), noseMat);
  nose.scale.set(0.8, 1.15, 0.9);
  nose.position.set(0, -headR * 0.08, surfaceZ + headR * 0.065);
  headPivot.add(nose);

  const earGoldMat = new THREE.MeshStandardMaterial({ color: 0xf6c444, metalness: 0.85, roughness: 0.22 });
  for (const s of [-1, 1]) {
    const kundala = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.085, headR * 0.025, 8, 14), earGoldMat);
    kundala.position.set(s * headR * 0.94, -headR * 0.14, headR * 0.04);
    kundala.rotation.y = s * Math.PI * 0.42;
    headPivot.add(kundala);
  }

  const mouthY = -headR * 0.36;
  const mouthZ = surfaceZ + headR * 0.02;
  const mouthCavity = new THREE.Mesh(
    new THREE.SphereGeometry(headR * (isGoogly ? 0.22 : 0.16), 12, 10),
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

  return { leftEye, rightEye, mouthCavity, upperLip, lowerLip, mouthBaseY: mouthY };
}

function buildComedyMascotRig(
  role: 'BrainrotLog' | 'CupDancer' | 'CartoonTank',
  name: string,
  facingSign: number,
  seedOffset: number,
  robe: number,
  sash: number,
  skin: number,
  accentColor: THREE.Color,
): CharacterRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

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

  const bodyMat = new THREE.MeshStandardMaterial({ color: robe, roughness: 0.48, metalness: role === 'CartoonTank' ? 0.35 : 0.06 });
  const trimMat = new THREE.MeshStandardMaterial({ color: sash, roughness: 0.35, metalness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.72 });

  const torsoGroup = new THREE.Group();
  const baseTorsoY = role === 'CartoonTank' ? 0.26 : 0.44;
  torsoGroup.position.y = baseTorsoY;
  bodyPivot.add(torsoGroup);

  const headPivot = new THREE.Group();
  let turretGroup: THREE.Group | undefined;
  let cannonBarrel: THREE.Mesh | undefined;
  let propPivot: THREE.Group | undefined;

  let leftHip: THREE.Group | undefined;
  let rightHip: THREE.Group | undefined;

  if (role === 'CartoonTank') {
    // Treads & road wheels
    for (const sx of [-0.36, 0.36]) {
      const track = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.92), darkMat);
      track.position.set(sx, -0.10, 0);
      track.castShadow = true;
      torsoGroup.add(track);
      for (const wz of [-0.30, 0, 0.30]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.25, 12), trimMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx, -0.12, wz);
        torsoGroup.add(wheel);
      }
    }
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.30, 0.84), bodyMat);
    hull.position.set(0, 0.14, 0);
    hull.castShadow = true;
    torsoGroup.add(hull);

    turretGroup = new THREE.Group();
    turretGroup.position.set(0, 0.42, -0.02);
    torsoGroup.add(turretGroup);
    const turret = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.56), bodyMat);
    turret.castShadow = true;
    turretGroup.add(turret);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.58), trimMat);
    stripe.position.y = -0.10;
    turretGroup.add(stripe);

    cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.66, 14), darkMat);
    cannonBarrel.rotation.x = Math.PI / 2;
    cannonBarrel.position.set(0, 0.04, 0.50);
    cannonBarrel.castShadow = true;
    turretGroup.add(cannonBarrel);

    headPivot.position.set(0, 0.10, 0);
    turretGroup.add(headPivot);
  } else if (role === 'BrainrotLog') {
    const buildMascotLeg = (side: -1 | 1): THREE.Group => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.14, -0.05, 0);
      torsoGroup.add(hip);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.28, 6, 8), bodyMat);
      leg.position.set(0, -0.17, 0);
      hip.add(leg);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), trimMat);
      shoe.scale.set(0.9, 0.5, 1.5);
      shoe.position.set(0, -0.34, 0.05);
      hip.add(shoe);
      return hip;
    };
    leftHip = buildMascotLeg(-1);
    rightHip = buildMascotLeg(1);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.96, 18), bodyMat);
    trunk.position.y = 0.44;
    trunk.castShadow = true;
    torsoGroup.add(trunk);
    // Grain rings & playful sprout twig
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
    topCap.position.y = 0.93;
    torsoGroup.add(topCap);
    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.18, 8), bodyMat);
    twig.position.set(0.06, 1.0, 0);
    twig.rotation.z = -0.35;
    torsoGroup.add(twig);
    headPivot.position.set(0, 0.72, 0);
    torsoGroup.add(headPivot);
  } else {
    // CupDancer: expressive tapered ceramic mug with golden rim & coffee top
    const buildCupLeg = (side: -1 | 1): THREE.Group => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.13, -0.05, 0);
      torsoGroup.add(hip);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.30, 6, 8), darkMat);
      leg.position.set(0, -0.17, 0);
      hip.add(leg);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), trimMat);
      shoe.scale.set(0.95, 0.5, 1.45);
      shoe.position.set(0, -0.34, 0.05);
      hip.add(shoe);
      return hip;
    };
    leftHip = buildCupLeg(-1);
    rightHip = buildCupLeg(1);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.62, 24), bodyMat);
    cup.position.y = 0.34;
    cup.castShadow = true;
    torsoGroup.add(cup);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.025, 10, 24), trimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.65;
    torsoGroup.add(rim);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.295, 24), new THREE.MeshStandardMaterial({ color: 0x3f2314, roughness: 0.2 }));
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.62;
    torsoGroup.add(coffee);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.034, 8, 16, Math.PI), bodyMat);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(-0.30, 0.36, 0);
    torsoGroup.add(handle);
    headPivot.position.set(0, 0.42, 0);
    torsoGroup.add(headPivot);
  }

  const faceR = role === 'CartoonTank' ? 0.26 : 0.24;
  const surfaceZ = role === 'CartoonTank' ? 0.29 : role === 'CupDancer' ? 0.28 : 0.21;
  const face = attachFaceRig(headPivot, faceR, skin, 0x111827, surfaceZ, true);

  // Articulated cartoon arms (so live pose dance / gesture animation works identically on all mascots!)
  const armMat = role === 'CupDancer' ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }) : bodyMat;
  const upperArmGeo = new THREE.CapsuleGeometry(0.048, 0.20, 6, 8);
  const forearmGeo = new THREE.CapsuleGeometry(0.042, 0.18, 6, 8);
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * (role === 'CartoonTank' ? 0.33 : 0.27), role === 'CartoonTank' ? 0.24 : 0.45, 0);
    torsoGroup.add(shoulder);
    const upper = new THREE.Mesh(upperArmGeo, armMat);
    upper.position.y = -0.11;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.22;
    shoulder.add(elbow);
    const lower = new THREE.Mesh(forearmGeo, armMat);
    lower.position.y = -0.10;
    elbow.add(lower);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), trimMat);
    glove.position.y = -0.22;
    elbow.add(glove);
    return { shoulder, elbow, glove };
  };
  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Removable 3D snack/rabdi bowl prop attached to right hand (visible during 'eating' action!)
  const snackProp = new THREE.Group();
  snackProp.position.set(0, -0.25, 0.06);
  const snackBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.07, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
  );
  snackProp.add(snackBowl);
  const snackSweet = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.45 }),
  );
  snackSweet.scale.set(1.1, 0.55, 1.1);
  snackSweet.position.y = 0.035;
  snackProp.add(snackSweet);
  snackProp.visible = false;
  rightArm.elbow.add(snackProp);

  const handProps = buildCharacterHandProps(rightArm.elbow, leftArm.elbow, torsoGroup);

  if (role === 'BrainrotLog') {
    propPivot = new THREE.Group();
    propPivot.position.set(0, -0.22, 0.04);
    const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.025, 0.65, 10), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 }));
    bat.position.y = -0.28;
    bat.castShadow = true;
    propPivot.add(bat);
    rightArm.elbow.add(propPivot);
  }

  root.rotation.y = facingSign * 0.36;

  return {
    root,
    bodyPivot,
    torsoGroup,
    headPivot,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip,
    rightHip,
    snackProp,
    handProps,
    headY: role === 'CartoonTank' ? 0.78 : role === 'CupDancer' ? 0.86 : 1.16,
    leftEyelid: face.leftEye.eyelid,
    rightEyelid: face.rightEye.eyelid,
    leftBrow: face.leftEye.brow,
    rightBrow: face.rightEye.brow,
    leftSclera: face.leftEye.sclera,
    rightSclera: face.rightEye.sclera,
    leftPupil: face.leftEye.pupil,
    rightPupil: face.rightEye.pupil,
    mouthCavity: face.mouthCavity,
    upperLip: face.upperLip,
    lowerLip: face.lowerLip,
    auraRing,
    auraDisc,
    turretGroup,
    cannonBarrel,
    propPivot,
    mouthBaseY: face.mouthBaseY,
    baseTorsoY,
    restScale: 1,
    topY: role === 'CartoonTank' ? 1.05 : role === 'CupDancer' ? 1.14 : 1.54,
    role,
    name,
    facingSign,
    standing: true,
    seedOffset,
  };
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
  const basePalette = getRolePalette(role, profile.robeHex, accentHex);
  const { isDivine } = basePalette;
  const accentColor = new THREE.Color(accentHex);

  if (role === 'BrainrotLog' || role === 'CupDancer' || role === 'CartoonTank') {
    return buildComedyMascotRig(role, profile.name, facingSign, seedOffset, basePalette.robe, basePalette.sash, basePalette.skin, accentColor);
  }

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const isComedyEnv = isDomesticOrComedySetting(setting);
  const isModernComedy = isComedyEnv;
  const archetype = detectMythicArchetype(role, profile.name, setting, isModernComedy);
  const mythicPalette = getMythicPaletteOverride(archetype, basePalette);
  const robe = mythicPalette.robe;
  const sash = mythicPalette.sash;
  const skin = mythicPalette.skin;
  const modelScale = archetype ? mythicPalette.scale : (role === 'ChildDevotee' ? 0.82 : 1.0);
  bodyPivot.scale.setScalar(modelScale);

  const robeMat = new THREE.MeshStandardMaterial({ color: robe, roughness: 0.58, metalness: 0.08 });
  const robeDarkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robe).multiplyScalar(0.75), roughness: 0.65 });
  const sashMat = new THREE.MeshStandardMaterial({ color: sash, roughness: 0.42, metalness: 0.25 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.48, metalness: 0.02 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf7be38, metalness: 0.85, roughness: 0.22 });

  // Ground halo / active speaker ring (disabled in domestic/comedy sets so bedrooms & kitchens stay grounded)
  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.58, 36),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: isModernComedy ? 0 : 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.012;
  auraRing.visible = !isModernComedy;
  root.add(auraRing);

  const auraDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 32),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: isModernComedy ? 0 : 0.08, side: THREE.DoubleSide, depthWrite: false }),
  );
  auraDisc.rotation.x = -Math.PI / 2;
  auraDisc.position.y = 0.01;
  auraDisc.visible = !isModernComedy;
  root.add(auraDisc);

  let pedestalGlow: THREE.Mesh | undefined;
  let leftHip: THREE.Group | undefined;
  let rightHip: THREE.Group | undefined;
  let leftKnee: THREE.Group | undefined;
  let rightKnee: THREE.Group | undefined;
  let hipY = 0.14;

  const trouserMat = isModernComedy
    ? new THREE.MeshStandardMaterial({ color: facingSign > 0 ? 0x1e293b : 0x312e81, roughness: 0.72 })
    : robeDarkMat;

  if (standing) {
    hipY = 0.66;
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.245, 16, 12), trouserMat);
    pelvis.scale.set(1.06, 0.65, 0.88);
    pelvis.position.set(0, hipY - 0.01, 0);
    pelvis.castShadow = true;
    bodyPivot.add(pelvis);

    const thighGeo = new THREE.CapsuleGeometry(0.104, 0.20, 6, 10);
    const shinGeo = new THREE.CapsuleGeometry(0.092, 0.18, 6, 10);
    const shoeMat = new THREE.MeshStandardMaterial({ color: isModernComedy ? 0xf8fafc : 0x3b2416, roughness: 0.45 });
    const buildLeg = (side: -1 | 1): { hip: THREE.Group; knee: THREE.Group } => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.13, hipY - 0.04, 0);
      bodyPivot.add(hip);

      const thigh = new THREE.Mesh(thighGeo, trouserMat);
      thigh.position.set(0, -0.15, 0);
      thigh.castShadow = true;
      thigh.receiveShadow = true;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.30, 0);
      hip.add(knee);

      const shin = new THREE.Mesh(shinGeo, trouserMat);
      shin.position.set(0, -0.14, 0);
      shin.castShadow = true;
      shin.receiveShadow = true;
      knee.add(shin);

      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), shoeMat);
      shoe.scale.set(0.95, 0.55, 1.55);
      shoe.position.set(0, -0.265, 0.05);
      shoe.castShadow = true;
      knee.add(shoe);

      return { hip, knee };
    };
    const lLeg = buildLeg(-1);
    const rLeg = buildLeg(1);
    leftHip = lLeg.hip;
    leftKnee = lLeg.knee;
    rightHip = rLeg.hip;
    rightKnee = rLeg.knee;
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
  const bareChestedDeity = archetype === 'narasimha' || archetype === 'hanuman' || archetype === 'shiv'
    || archetype === 'vishnu' || archetype === 'krishna' || archetype === 'ram';
  const torsoMesh = new THREE.Mesh(torsoGeo, bareChestedDeity ? skinMat : robeMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  if (!isModernComedy) {
    // Diagonal silk Uttariya / sash hugging chest contour (devotional & classical sets; palace dancers use tailored attire trim)
    if (setting !== 'PalaceCourt') {
      const sashCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, 0.55, 0.10),
        new THREE.Vector3(-0.02, 0.39, 0.21),
        new THREE.Vector3(0.18, 0.22, 0.14),
        new THREE.Vector3(0.14, 0.18, -0.16),
      ]);
      const sashMesh = new THREE.Mesh(new THREE.TubeGeometry(sashCurve, 18, 0.024, 8, false), sashMat);
      sashMesh.castShadow = true;
      torsoGroup.add(sashMesh);
    }

    // Golden waist belt & kanthi mala necklace
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 8, 22), goldMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.24;
    torsoGroup.add(belt);

    const mala = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.018, 8, 20), goldMat);
    mala.rotation.x = Math.PI / 2 + 0.25;
    mala.position.set(0, 0.57, 0.04);
    torsoGroup.add(mala);

    // Flared Anarkali / Lehenga skirt & embroidered Sherwani silhouettes for lush classical/palace dances
    if (standing && role === 'NobleWoman') {
      const skirtPts = [
        new THREE.Vector2(0.18, 0.25),
        new THREE.Vector2(0.24, 0.08),
        new THREE.Vector2(0.36, -0.18),
        new THREE.Vector2(0.45, -0.44),
        new THREE.Vector2(0.42, -0.46),
      ];
      const skirtGeo = new THREE.LatheGeometry(skirtPts, 28);
      const skirtMat = new THREE.MeshStandardMaterial({
        color: robe,
        roughness: 0.45,
        metalness: 0.14,
        side: THREE.DoubleSide,
      });
      const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
      skirtMesh.castShadow = true;
      skirtMesh.receiveShadow = true;
      torsoGroup.add(skirtMesh);

      const zariBorder = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.024, 8, 32), goldMat);
      zariBorder.rotation.x = Math.PI / 2;
      zariBorder.position.y = -0.44;
      torsoGroup.add(zariBorder);
    } else if (standing && role === 'KingCrown' && (!archetype || archetype === 'genericSacred') && (setting === 'PalaceCourt' || profile.attire === 'turban')) {
      // Royal sherwani gold front buttons & flared lower kurta coat
      const coatPts = [
        new THREE.Vector2(0.22, 0.24),
        new THREE.Vector2(0.27, 0.02),
        new THREE.Vector2(0.31, -0.26),
        new THREE.Vector2(0.32, -0.34),
      ];
      const coatMesh = new THREE.Mesh(
        new THREE.LatheGeometry(coatPts, 24),
        new THREE.MeshStandardMaterial({ color: robe, roughness: 0.5, metalness: 0.12, side: THREE.DoubleSide }),
      );
      coatMesh.castShadow = true;
      torsoGroup.add(coatMesh);

      for (let b = 0; b < 4; b++) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), goldMat);
        btn.position.set(0, 0.50 - b * 0.075, b < 2 ? 0.248 : 0.225);
        torsoGroup.add(btn);
      }
    }
  } else {
    // Crisp modern hoodie/tee collar + trouser waistband for comedy & household characters
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.026, 8, 20), sashMat);
    collar.rotation.x = Math.PI / 2 + 0.2;
    collar.position.set(0, 0.58, 0.03);
    torsoGroup.add(collar);

    const waistTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.255, 0.022, 8, 22),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 }),
    );
    waistTrim.rotation.x = Math.PI / 2;
    waistTrim.position.y = 0.04;
    torsoGroup.add(waistTrim);
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

  // Two Articulated Arms (Left & Right shoulders -> elbows -> hands) with seamless joint spheres
  const upperArmGeo = new THREE.CapsuleGeometry(0.072, 0.21, 6, 10);
  const forearmGeo = new THREE.CapsuleGeometry(0.060, 0.19, 6, 10);
  const armMat = bareChestedDeity || archetype === 'asuraKing' ? skinMat : robeMat;

  const buildArm = (side: -1 | 1): { shoulder: THREE.Group; elbow: THREE.Group } => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.245, 0.52, 0);
    torsoGroup.add(shoulder);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), armMat);
    shoulderCap.castShadow = true;
    shoulder.add(shoulderCap);

    const upper = new THREE.Mesh(upperArmGeo, armMat);
    upper.position.y = -0.13;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), armMat);
    elbowCap.castShadow = true;
    elbow.add(elbowCap);

    const lower = new THREE.Mesh(forearmGeo, armMat);
    lower.position.y = -0.115;
    lower.castShadow = true;
    elbow.add(lower);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 10), skinMat);
    hand.scale.set(0.95, 1.15, 0.80);
    hand.position.y = -0.24;
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  const mythicAttachments = attachSacredPattaAndDhoti(
    bodyPivot,
    torsoGroup,
    leftHip,
    rightHip,
    leftArm.elbow,
    rightArm.elbow,
    archetype,
    robe,
    sash,
    goldMat,
    standing,
  );

  // Removable 3D snack/rabdi bowl prop attached to right hand (visible during 'eating' action!)
  const snackProp = new THREE.Group();
  snackProp.position.set(0, -0.25, 0.06);
  const snackBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.07, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
  );
  snackProp.add(snackBowl);
  const snackSweet = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.45 }),
  );
  snackSweet.scale.set(1.1, 0.55, 1.1);
  snackSweet.position.y = 0.035;
  snackProp.add(snackSweet);
  snackProp.visible = false;
  rightArm.elbow.add(snackProp);

  const handProps = buildCharacterHandProps(rightArm.elbow, leftArm.elbow, torsoGroup);

  // Neck + Sculpted Expressive 3D Head (Narasimha lion-avatar vs human/deva/asura face)
  const headR = role === 'ComicBobble' ? 0.345 : role === 'ChildDevotee' ? 0.265 : 0.245;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.14, 14), skinMat);
  neck.position.y = 0.65;
  torsoGroup.add(neck);

  const headPivot = new THREE.Group();
  headPivot.position.y = 0.68 + headR * 0.92;
  torsoGroup.add(headPivot);

  let glassesGroup: THREE.Group | undefined;
  const glassesBaseY = headR * 0.08;
  let leftCheekFlush: THREE.Mesh | undefined;
  let rightCheekFlush: THREE.Mesh | undefined;
  let leftTearBead: THREE.Mesh | undefined;
  let rightTearBead: THREE.Mesh | undefined;
  let sweatDropGroup: THREE.Group | undefined;
  let angerMarkGroup: THREE.Group | undefined;
  let hairParts: { hairFullGroup?: THREE.Group; hairShavedGroup?: THREE.Group } | undefined;
  let lowerJawPivot: THREE.Group | undefined;
  let face: {
    leftEye: { sclera: THREE.Mesh; pupil: THREE.Mesh; eyelid: THREE.Mesh; brow: THREE.Mesh };
    rightEye: { sclera: THREE.Mesh; pupil: THREE.Mesh; eyelid: THREE.Mesh; brow: THREE.Mesh };
    mouthCavity: THREE.Mesh;
    upperLip: THREE.Mesh;
    lowerLip: THREE.Mesh;
    mouthBaseY: number;
  };

  if (archetype === 'narasimha') {
    const nFace = attachNarasimhaLionHead(headPivot, headR, skin);
    face = nFace;
    lowerJawPivot = nFace.lowerJawPivot;
  } else {
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
      if (!isModernComedy) {
        const kundal = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.1, headR * 0.025, 8, 14), goldMat);
        kundal.rotation.y = Math.PI / 2;
        kundal.position.set(s * headR * 0.98, -headR * 0.2, 0.01);
        headPivot.add(kundal);
      }
    }

    // MJO expressive angry / laughing cheek blush plates
    const buildCheekFlush = (side: -1 | 1) => {
      const flush = new THREE.Mesh(
        new THREE.SphereGeometry(headR * 0.19, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0, depthWrite: false }),
      );
      flush.scale.set(1.2, 0.75, 0.35);
      flush.position.set(side * headR * 0.56, -headR * 0.16, headR * 0.84);
      headPivot.add(flush);
      return flush;
    };
    leftCheekFlush = isModernComedy ? buildCheekFlush(-1) : undefined;
    rightCheekFlush = isModernComedy ? buildCheekFlush(1) : undefined;

    if (isModernComedy) {
      const tearMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92, depthWrite: false });
      const buildTearBead = (side: -1 | 1) => {
        const tear = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.056, 8, 8), tearMat);
        tear.scale.set(0.75, 1.38, 0.46);
        tear.position.set(side * headR * 0.34, -headR * 0.02, headR * 0.93);
        tear.visible = false;
        headPivot.add(tear);
        return tear;
      };
      leftTearBead = buildTearBead(-1);
      rightTearBead = buildTearBead(1);

      sweatDropGroup = new THREE.Group();
      const sweatBulb = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.075, 8, 8), tearMat);
      sweatBulb.scale.set(0.85, 1.05, 0.55);
      const sweatTip = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.068, headR * 0.14, 8), tearMat);
      sweatTip.position.y = headR * 0.085;
      sweatDropGroup.add(sweatBulb, sweatTip);
      sweatDropGroup.position.set(headR * 0.58, headR * 0.42, headR * 0.80);
      sweatDropGroup.visible = false;
      headPivot.add(sweatDropGroup);

      angerMarkGroup = new THREE.Group();
      const veinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      for (const [ang, ox, oy] of [
        [0.45, -headR * 0.055, headR * 0.045],
        [-0.45, headR * 0.055, headR * 0.045],
        [-0.45, -headR * 0.055, -headR * 0.045],
        [0.45, headR * 0.055, -headR * 0.045],
      ] as const) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.11, headR * 0.032, headR * 0.03), veinMat);
        bar.rotation.z = ang;
        bar.position.set(ox, oy, 0);
        angerMarkGroup.add(bar);
      }
      angerMarkGroup.position.set(-headR * 0.46, headR * 0.44, headR * 0.86);
      angerMarkGroup.visible = false;
      headPivot.add(angerMarkGroup);
    }

    // Articulated Horn-Rimmed Spectacles (supports normal / sidha, crooked, forehead, and UPSIDE-DOWN "ulta chasma"!)
    if (isModernComedy) {
      glassesGroup = new THREE.Group();
      glassesGroup.position.set(0, glassesBaseY, headR * 0.97);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.45, roughness: 0.25 });
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.24 });
      // Distinct heavy arched TOP brow-bar so flipping upside down ("Ulta Chasma") is instantly unmistakable!
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(headR * 1.18, headR * 0.09, headR * 0.05), rimMat);
      topBar.position.set(0, headR * 0.16, 0.01);
      glassesGroup.add(topBar);
      for (const s of [-1, 1]) {
        const glassRim = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.19, headR * 0.028, 8, 18), rimMat);
        glassRim.position.set(s * headR * 0.36, 0, 0);
        glassesGroup.add(glassRim);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.175, 16), lensMat);
        lens.position.set(s * headR * 0.36, 0, -0.005);
        glassesGroup.add(lens);
        const temple = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.03, headR * 0.035, headR * 0.92), rimMat);
        temple.position.set(s * headR * 0.56, headR * 0.11, -headR * 0.44);
        glassesGroup.add(temple);
      }
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.022, headR * 0.022, headR * 0.36, 6), rimMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, headR * 0.02, 0);
      glassesGroup.add(bridge);
      glassesGroup.visible = profile.hasGlasses !== undefined && profile.hasGlasses !== null
        ? !!profile.hasGlasses
        : facingSign > 0;
      headPivot.add(glassesGroup);
    }

    // Tilak / Bindi (for devotional / cultural roles; omitted on casual modern comedy hosts)
    if (role === 'NobleWoman') {
      const bindi = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
      bindi.scale.z = 0.4;
      bindi.position.set(0, headR * 0.24, headR * 0.96);
      headPivot.add(bindi);
    } else if (role === 'Divine' && /shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(lowerName)) {
      const ashMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xe2e8f0, emissiveIntensity: 0.45, roughness: 0.6 });
      for (const dy of [-0.045, 0, 0.045]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.36, headR * 0.025, headR * 0.04), ashMat);
        bar.position.set(0, headR * (0.28 + dy), headR * 0.95);
        headPivot.add(bar);
      }
      // Vertical radiant Third Eye (Trinetra) + Crimson kumkum bindu
      const trinetra = new THREE.Mesh(
        new THREE.CapsuleGeometry(headR * 0.028, headR * 0.09, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xdc2626, emissiveIntensity: 0.65 }),
      );
      trinetra.position.set(0, headR * 0.42, headR * 0.965);
      headPivot.add(trinetra);
      const kumkum = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.045, 8, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      kumkum.position.set(0, headR * 0.28, headR * 0.975);
      headPivot.add(kumkum);
    } else if (archetype === 'vishnu' || archetype === 'krishna' || archetype === 'ram') {
      // Vaishnava Urdhva-Pundra White U-Tilak with crimson Sri line
      const chandanMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, emissive: 0xfef3c7, emissiveIntensity: 0.25 });
      const sriMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.35 });
      for (const s of [-1, 1]) {
        const prong = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.042, headR * 0.28, headR * 0.04), chandanMat);
        prong.position.set(s * headR * 0.072, headR * 0.36, headR * 0.955);
        prong.rotation.z = -s * 0.09;
        headPivot.add(prong);
      }
      const sriLine = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.022, headR * 0.20, 4, 8), sriMat);
      sriLine.position.set(0, headR * 0.36, headR * 0.97);
      headPivot.add(sriLine);
    } else if (role !== 'Warrior' && !isModernComedy && archetype !== 'asuraKing') {
      const tilak = new THREE.Mesh(
        new THREE.CapsuleGeometry(headR * 0.036, headR * 0.16, 4, 8),
        new THREE.MeshStandardMaterial({ color: role === 'Divine' ? 0xfbbf24 : 0xea580c, emissive: 0x7c2d12, emissiveIntensity: 0.2 }),
      );
      tilak.position.set(0, headR * 0.28, headR * 0.95);
      headPivot.add(tilak);
    }

    // Hair / Crown
    hairParts = createCrownOrHair(headPivot, role, profile.name, setting, headR, robe, profile.attire);
    if (archetype === 'asuraKing') {
      attachAsuraKingDetails(headPivot, torsoGroup, headR, goldMat);
    }

    const browHex = role === 'SageRishi' ? 0xd9dce6 : 0x1c1722;
    const isGoogly = role === 'ComicBobble' || setting === 'DoorwaySet' || setting === 'SkyGauntlet';
    face = attachFaceRig(headPivot, headR, skin, browHex, headR * 0.85, isGoogly);
  }

  let haloGroup: THREE.Group | undefined;
  let haloMaterial: THREE.MeshBasicMaterial | undefined;
  const isGoddess = role === 'NobleWoman' && GODDESS_TOKENS.some((t) => lowerName.includes(t));
  if (isDivine || role === 'SageRishi' || isGoddess || archetype === 'narasimha') {
    haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.04, -headR * (archetype === 'narasimha' ? 0.92 : 0.72));
    haloMaterial = new THREE.MeshBasicMaterial({
      color: isDivine || archetype === 'narasimha' ? 0xffe066 : accentColor,
      transparent: true,
      opacity: isDivine || archetype === 'narasimha' ? 0.65 : 0.28,
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

  // Rotate character toward partner at ~24 deg for lively 3/4 film staging
  root.rotation.y = facingSign * 0.42;

  const rawHeadCenterY = hipY + 0.68 + headR * 0.92;
  const computedHeadY = (standing ? rawHeadCenterY : 1.04) * modelScale;
  const computedTopY = (standing ? rawHeadCenterY + headR * 1.48 : 1.40) * modelScale;

  return {
    root,
    bodyPivot,
    torsoGroup,
    headPivot,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    snackProp,
    handProps,
    headY: computedHeadY,
    leftEyelid: face.leftEye.eyelid,
    rightEyelid: face.rightEye.eyelid,
    leftBrow: face.leftEye.brow,
    rightBrow: face.rightEye.brow,
    leftSclera: face.leftEye.sclera,
    rightSclera: face.rightEye.sclera,
    leftPupil: face.leftEye.pupil,
    rightPupil: face.rightEye.pupil,
    mouthCavity: face.mouthCavity,
    upperLip: face.upperLip,
    lowerLip: face.lowerLip,
    glassesGroup,
    glassesBaseY,
    hairFullGroup: hairParts?.hairFullGroup,
    hairShavedGroup: hairParts?.hairShavedGroup,
    leftCheekFlush,
    rightCheekFlush,
    leftTearBead,
    rightTearBead,
    sweatDropGroup,
    angerMarkGroup,
    haloGroup,
    haloMaterial,
    auraRing,
    auraDisc,
    pedestalGlow,
    chakraWheel: mythicAttachments.chakraWheel,
    lowerJawPivot,
    pattaEnds: mythicAttachments.pattaEnds,
  isNarasimha: archetype === 'narasimha',
  isAsuraKing: archetype === 'asuraKing',
  isHolika: /holika|होलिका/i.test(profile.name),
  mouthBaseY: face.mouthBaseY,
    baseTorsoY: standing ? 0.66 : 0.15,
    restScale: modelScale,
    topY: computedTopY,
    role,
    name: profile.name,
    facingSign,
    standing,
    hasFloorAura: !isModernComedy,
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
  action: ActionKind | string = 'none',
  turnLocal = 0.5,
  snapPose = false,
  heldProp: string | null = null,
  isSeatedInChair = false,
  showCape = false,
  glassesState: string | null = null,
  hairCutStage = 0,
): void {
  const lt = t + rig.seedOffset;
  const act = (action || 'none') as ActionKind;
  const isComedyMascot = rig.role === 'BrainrotLog' || rig.role === 'CupDancer' || rig.role === 'CartoonTank' || rig.role === 'ComicBobble';

  if (rig.snackProp) {
    rig.snackProp.visible = act === 'eating' && (!heldProp || heldProp === 'none');
  }
  updateHandPropAnimation(rig.handProps, heldProp, act, lt, isSpeaking, showCape);

  // Progressive Barber haircut transformation (0 = full hair, 1 = uneven chopped trim during snipping, 2 = shiny shaved "katora / maidan saaf" Takla dome!)
  if (rig.hairFullGroup && rig.hairShavedGroup) {
    rig.hairFullGroup.visible = hairCutStage < 2;
    rig.hairShavedGroup.visible = hairCutStage >= 2;
    if (hairCutStage === 1) {
      // Messy half-chopped look during scissor snipping: keep hair above scalp, tilted crookedly
      rig.hairFullGroup.scale.set(0.96, 0.95, 0.96);
      rig.hairFullGroup.position.set(0.015, 0.01, 0);
      rig.hairFullGroup.rotation.z = 0.22;
    } else {
      rig.hairFullGroup.scale.setScalar(1);
      rig.hairFullGroup.position.set(0, 0, 0);
      rig.hairFullGroup.rotation.z = 0;
    }
  }

  // Articulated Chasma state ('ulta' = upside-down, 'flipping' = flips ulta -> sidha mid-turn, 'crooked', 'forehead', 'none')
  if (rig.glassesGroup) {
    const gMode = (glassesState ?? 'normal').trim().toLowerCase();
    if (gMode === 'none') {
      rig.glassesGroup.visible = false;
    } else {
      rig.glassesGroup.visible = true;
      const baseY = rig.glassesBaseY ?? 0.028;
      let targetRotZ = 0;
      let targetRotX = 0;
      let targetY = baseY;
      if (gMode === 'ulta') {
        targetRotZ = Math.PI;
        targetY = baseY - 0.012;
      } else if (gMode === 'flipping') {
        // Flip smoothly upside-down -> straight right as Barber says "ओह तेरी! चश्मा उल्टा पहना था!"
        const flipK = Math.max(0, Math.min(1, (turnLocal - 0.35) / 0.25));
        const smoothFlip = flipK * flipK * (3 - 2 * flipK);
        targetRotZ = Math.PI * (1 - smoothFlip);
        targetY = baseY - 0.012 * (1 - smoothFlip) + Math.sin(smoothFlip * Math.PI) * 0.04;
      } else if (gMode === 'crooked') {
        targetRotZ = 0.28 + Math.sin(lt * 9) * 0.04;
        targetY = baseY - 0.01;
      } else if (gMode === 'forehead') {
        targetRotX = -0.35;
        targetY = baseY + 0.105;
      }
      rig.glassesGroup.rotation.z = targetRotZ;
      rig.glassesGroup.rotation.x = targetRotX;
      rig.glassesGroup.position.y = targetY;
    }
  }

  // MJO Angry Red Cheek Glow / Joyful Laugh / Panic Shock / Sad Blush / Smug Warm Glow
  if (rig.leftCheekFlush && rig.rightCheekFlush) {
    const isAngryState = emotion === 'angry' || act === 'corpseSnapUp';
    const isPanicState = emotion === 'scared' || act === 'brakeStop' || act === 'lapSubdued';
    const blush = isAngryState
      ? 0.78
      : emotion === 'laughing' || act === 'celebrate'
        ? 0.44
        : (emotion === 'surprised' || act === 'shockedFall' || isPanicState)
          ? 0.30
          : (emotion === 'proud' || emotion === 'happy' || emotion === 'smug')
            ? 0.22
            : 0;
    const blushHex = isAngryState
      ? 0xdc2626
      : emotion === 'laughing' || act === 'celebrate' || emotion === 'proud'
        ? 0xfb7185
        : isPanicState
          ? 0x60a5fa
          : 0xf87171;
    [rig.leftCheekFlush, rig.rightCheekFlush].forEach((c) => {
      const cm = c.material as THREE.MeshBasicMaterial;
      cm.opacity = blush;
      cm.color.setHex(blushHex);
    });
  }

  const headScale = rig.role === 'ComicBobble' ? 0.345 : rig.role === 'ChildDevotee' ? 0.265 : 0.245;
  if (rig.leftTearBead && rig.rightTearBead) {
    const showTears = emotion === 'sad';
    rig.leftTearBead.visible = showTears;
    rig.rightTearBead.visible = showTears;
    if (showTears) {
      const dropL = (lt * 1.65) % 1;
      const dropR = (lt * 1.65 + 0.42) % 1;
      rig.leftTearBead.position.y = -headScale * (0.02 + dropL * 0.24);
      rig.rightTearBead.position.y = -headScale * (0.02 + dropR * 0.24);
      rig.leftTearBead.scale.setScalar(0.65 + Math.sin(dropL * Math.PI) * 0.65);
      rig.rightTearBead.scale.setScalar(0.65 + Math.sin(dropR * Math.PI) * 0.65);
    }
  }
  if (rig.sweatDropGroup) {
    const showSweat = emotion === 'scared' || act === 'brakeStop' || act === 'lapSubdued';
    rig.sweatDropGroup.visible = showSweat;
    if (showSweat) {
      const slide = (lt * 2.15) % 1;
      rig.sweatDropGroup.position.y = headScale * (0.44 - slide * 0.16);
      rig.sweatDropGroup.scale.setScalar(0.82 + Math.sin(slide * Math.PI) * 0.42);
    }
  }
  if (rig.angerMarkGroup) {
    const showVein = emotion === 'angry' || act === 'corpseSnapUp';
    rig.angerMarkGroup.visible = showVein;
    if (showVein) {
      const throb = 0.86 + 0.34 * Math.abs(Math.sin(lt * 11.5));
      rig.angerMarkGroup.scale.setScalar(throb);
    }
  }

  // Smooth baseline reset before applying action posture
  let targetBodyRotX = 0;
  let targetBodyRotZ = 0;
  let targetBodyPosX = 0;
  let targetBodyPosZ = 0;
  let targetBodyY = 0;
  let targetTorsoRotX = 0;
  let targetTorsoRotZ = 0;
  let targetLeftHipX = 0;
  let targetRightHipX = 0;
  let targetLeftHipZ = 0;
  let targetRightHipZ = 0;
  let targetLeftKneeX = 0;
  let targetRightKneeX = 0;

  // Breathing & idle/speech bounce
  const breath = Math.sin(lt * 2.1) * (isSpeaking ? 0.018 : 0.008);
  rig.torsoGroup.position.y = rig.baseTorsoY + breath;

  const showAura = rig.hasFloorAura !== false;

  if (act === 'sleeping' || act === 'lyingShroud') {
    targetBodyRotX = -Math.PI * 0.48;
    targetBodyY = act === 'lyingShroud' ? 0.14 : (rig.standing ? 0.06 : 0.16);
    targetLeftHipX = act === 'lyingShroud' ? 0.04 : 0.14;
    targetRightHipX = act === 'lyingShroud' ? 0.04 : 0.08;
    targetLeftKneeX = act === 'lyingShroud' ? 0.06 : 0.28;
    targetRightKneeX = act === 'lyingShroud' ? 0.06 : 0.16;
    rig.auraRing.visible = false;
    rig.auraDisc.visible = false;
  } else {
    rig.auraRing.visible = showAura;
    rig.auraDisc.visible = showAura;
    if (act === 'corpseSnapUp') {
      const k = Math.max(0, Math.min(1, turnLocal / 0.24));
      const eased = 1 - Math.pow(1 - k, 3);
      targetBodyRotX = -Math.PI * 0.48 * (1 - eased) + 0.08 * Math.sin(k * Math.PI);
      targetBodyY = 0.14 * (1 - eased) + Math.sin(k * Math.PI) * 0.18;
      targetTorsoRotX = 0.10 * eased;
    } else if (act === 'wakingUp') {
      const w = Math.max(0, Math.min(1, (turnLocal - 0.04) / 0.36));
      const eased = 1 - Math.pow(1 - w, 3);
      targetBodyRotX = -Math.PI * 0.48 * (1 - eased) - 0.10 * Math.sin(w * Math.PI);
      targetBodyY = (rig.standing ? 0.06 : 0.16) * (1 - eased) + Math.sin(w * Math.PI) * 0.12;
      targetTorsoRotX = -0.14 * Math.sin(w * Math.PI);
    } else if (act === 'sitting' || isSeatedInChair) {
      targetBodyY = rig.standing ? -0.26 : 0;
      targetLeftHipX = -Math.PI * 0.46;
      targetRightHipX = -Math.PI * 0.46;
      targetLeftKneeX = Math.PI * 0.46;
      targetRightKneeX = Math.PI * 0.46;
      targetTorsoRotX = isSpeaking ? Math.sin(lt * 3.8) * 0.08 : -0.05;
    } else if (act === 'walking' || act === 'running') {
      const freq = act === 'running' ? 14.0 : 7.5;
      const stride = Math.sin(t * freq);
      const amp = act === 'running' ? 0.85 : 0.52;
      const kneeAmp = act === 'running' ? 1.05 : 0.55;
      targetLeftHipX = stride * amp;
      targetRightHipX = -stride * amp;
      targetLeftKneeX = Math.max(0, -stride) * kneeAmp;
      targetRightKneeX = Math.max(0, stride) * kneeAmp;
      targetBodyY = Math.abs(Math.cos(t * freq)) * (act === 'running' ? 0.095 : 0.045);
      targetTorsoRotX = act === 'running' ? 0.24 : 0.10;
      targetTorsoRotZ = stride * 0.06;
    } else if (act === 'praying') {
      targetTorsoRotX = 0.16 + Math.sin(lt * 2.2) * 0.035;
      targetBodyY = 0;
    } else if (act === 'shockedFall') {
      const k = Math.max(0, Math.min(1, turnLocal / 0.35));
      targetBodyRotX = 0.18 * Math.sin(k * Math.PI * 0.7);
      targetBodyRotZ = rig.facingSign * -0.05 * k;
      targetBodyY = k < 0.35 ? Math.sin((k / 0.35) * Math.PI) * 0.12 : -0.04 * k;
      targetLeftHipX = -0.18 * k;
      targetRightHipX = 0.14 * k;
      targetLeftKneeX = 0.24 * k;
    } else if (act === 'jumping' || act === 'dancing' || act === 'adaab' || act === 'sufiSpin') {
      if (act === 'jumping') {
        const hop = Math.abs(Math.sin(lt * 6.2));
        targetBodyY = hop * 0.22;
        targetLeftHipX = -hop * 0.35;
        targetRightHipX = -hop * 0.35;
        targetLeftKneeX = hop * 0.55;
        targetRightKneeX = hop * 0.55;
      } else {
        const style: DanceChoreographyStyle = isComedyMascot ? 'viralBounce' : 'sufiKathak';
        const dance = computeDanceKinematics(lt, style, act, rig.facingSign < 0, 0);
        targetBodyY = dance.liftY;
        targetBodyRotZ = dance.bodyRotZ;
        targetTorsoRotX = dance.torsoRotX;
        targetTorsoRotZ = dance.torsoRotZ;
        targetLeftHipX = dance.leftHipX;
        targetRightHipX = dance.rightHipX;
        targetLeftKneeX = dance.leftKneeX;
        targetRightKneeX = dance.rightKneeX;
        rig.bodyPivot.rotation.y += (dance.bodyRotY - rig.bodyPivot.rotation.y) * (snapPose ? 1 : 0.35);
      }
    } else if (act === 'punching') {
      // Boxer stance: knees soft, torso lunges into each jab
      const { extend } = strikePhase(t, 'punching');
      targetTorsoRotX = 0.10 + extend * 0.20;
      targetBodyRotZ = rig.facingSign * -0.05 * extend;
      targetBodyY = -0.03 + extend * 0.02;
      targetLeftHipX = -0.22;
      targetRightHipX = 0.16;
      targetLeftKneeX = 0.30;
      targetRightKneeX = 0.22;
    } else if (act === 'kicking') {
      // Chamber the knee, snap the lower leg out at impact, recover
      const { extend } = strikePhase(t, 'kicking');
      targetRightHipX = -1.25 * extend;
      targetRightKneeX = 1.1 * (1 - extend) * Math.min(1, extend * 3);
      targetLeftKneeX = 0.18;
      targetTorsoRotX = -0.16 * extend;
      targetBodyY = 0.02 * extend;
    } else if (act === 'hitReact') {
      // Knocked back by each landed punch, wobbling back upright between hits
      const { recoil } = strikePhase(t, 'punching');
      targetBodyRotX = -0.24 * recoil;
      targetTorsoRotX = -0.20 * recoil;
      targetBodyRotZ = rig.facingSign * 0.10 * recoil + Math.sin(lt * 11) * 0.03;
      targetBodyY = -0.02 * recoil;
      targetLeftKneeX = 0.22 * recoil;
      targetRightKneeX = 0.18 * recoil;
    } else if (act === 'lapSubdue') {
      // Wide Alidha / Vajra martial squat forming a powerful horizontal lap (Janga) platform
      targetBodyY = -0.22;
      targetLeftHipX = -1.36;
      targetRightHipX = -1.36;
      targetLeftHipZ = -0.44;
      targetRightHipZ = 0.44;
      targetLeftKneeX = 1.42;
      targetRightKneeX = 1.42;
      targetTorsoRotX = 0.14 + Math.sin(lt * 7.5) * 0.03;
    } else if (act === 'lapSubdued') {
      // Held horizontally supine clear off the ground across Narasimha's thighs (Janga)!
      const writhe = Math.sin(lt * 9.0) * 0.04;
      targetBodyRotZ = Math.PI * 0.48 + writhe * 0.45;
      targetBodyRotX = -0.26;
      targetBodyPosX = 0.92;
      targetBodyPosZ = 0.25;
      targetBodyY = 0.70 + Math.sin(lt * 11.0) * 0.015;
      targetLeftHipX = 0.25 + writhe * 2.2;
      targetRightHipX = -0.15 - writhe * 2.2;
      targetLeftKneeX = 0.85;
      targetRightKneeX = 1.05;
      targetTorsoRotX = -0.10;
    } else if (act === 'pillarBurst') {
      // Heroic roaring emergence from the shattered Sabha pillar
      targetBodyY = 0.02;
      targetLeftHipX = -0.28;
      targetRightHipX = 0.22;
      targetLeftHipZ = -0.18;
      targetRightHipZ = 0.18;
      targetLeftKneeX = 0.36;
      targetRightKneeX = 0.18;
      targetTorsoRotX = -0.06;
    } else if (act === 'clubStrike') {
      const swing = Math.sin(turnLocal * Math.PI);
      targetBodyY = -0.04 * swing;
      targetLeftHipX = -0.24 * swing;
      targetRightHipX = 0.20 * swing;
      targetLeftKneeX = 0.28 * swing;
      targetTorsoRotX = 0.24 * swing;
    } else if (act === 'cliffRescue') {
      if (rig.role === 'ChildDevotee') {
        targetBodyY = 0.32 + Math.sin(lt * 3.4) * 0.08;
        targetTorsoRotX = 0.06;
      } else {
        targetTorsoRotX = 0.14;
      }
    } else if (act === 'fireTrial') {
      if (rig.role === 'ChildDevotee' || rig.isHolika) {
        targetBodyY = rig.standing ? -0.24 : 0;
        targetLeftHipX = -Math.PI * 0.46;
        targetRightHipX = -Math.PI * 0.46;
        targetLeftKneeX = Math.PI * 0.46;
        targetRightKneeX = Math.PI * 0.46;
        targetTorsoRotX = rig.isHolika && emotion !== 'proud' ? -0.18 + Math.sin(lt * 16) * 0.06 : 0.08;
      }
    } else if (act === 'blessing') {
      targetBodyY = isSpeaking ? Math.abs(Math.sin(lt * 4.5)) * 0.02 : 0;
      targetTorsoRotX = 0.04;
    } else if (act === 'brakeStop') {
      const jolt = turnLocal < 0.34
        ? Math.sin((turnLocal / 0.34) * Math.PI)
        : 0;
      targetTorsoRotX = turnLocal < 0.34 ? 0.26 * jolt : -0.14 * Math.exp(-(turnLocal - 0.34) * 3.5);
      targetTorsoRotZ = Math.sin(lt * 26) * 0.045;
      targetBodyPosZ = turnLocal < 0.34 ? 0.12 * jolt : -0.14;
      targetBodyY = -0.05;
      targetLeftKneeX = 0.34;
      targetRightKneeX = 0.24;
    } else if (act === 'celebrate') {
      const hop = Math.abs(Math.sin(lt * 8.4));
      targetBodyY = hop * 0.16;
      targetTorsoRotX = -0.09;
      targetTorsoRotZ = Math.sin(lt * 4.2) * 0.07;
    } else if (act === 'pointing' || act === 'hazardWire' || act === 'hazardTruck' || act === 'hazardTank' || act === 'hazardPit' || act === 'hazardSnake' || act === 'hazardFood' || act === 'hazardPhone') {
      if (act === 'hazardPit') {
        const hop = Math.abs(Math.sin(lt * 5.6));
        targetBodyY = hop * 0.16;
        targetTorsoRotX = 0.12;
      } else if (act === 'hazardWire') {
        targetTorsoRotX = 0.08;
        targetTorsoRotZ = Math.sin(lt * 26) * 0.06;
        targetBodyY = isSpeaking ? Math.abs(Math.sin(lt * 8.5)) * 0.04 : 0;
      } else {
        targetTorsoRotX = 0.10 + Math.sin(lt * 5.8) * 0.04;
        targetBodyY = isSpeaking ? Math.abs(Math.sin(lt * 7.5)) * 0.038 : 0;
      }
    } else if (emotion === 'scared') {
      targetBodyY = rig.standing ? -0.04 : 0;
      targetTorsoRotX = 0.07;
      targetTorsoRotZ = Math.sin(lt * 28) * 0.045;
    } else if (emotion === 'smug') {
      targetTorsoRotX = -0.06;
      targetTorsoRotZ = rig.facingSign * 0.07;
      targetBodyY = isSpeaking ? Math.abs(Math.sin(lt * 6.0)) * 0.03 : 0;
    } else if (emotion === 'proud') {
      targetTorsoRotX = -0.09;
      targetBodyY = isSpeaking ? Math.abs(Math.sin(lt * 7.2)) * 0.045 : 0.02;
    } else {
      targetBodyY = isSpeaking && rig.standing
        ? Math.abs(Math.sin(lt * (isComedyMascot ? 9.2 : 7.2))) * (isComedyMascot ? 0.055 : 0.035)
        : 0;
    }
  }

  // Smooth exponential tracking for lower body & posture so transitions are crisp yet fluid (and snap on scene cuts / frame 0)
  const isStrike = act === 'punching' || act === 'kicking' || act === 'hitReact' || act === 'lapSubdue' || act === 'lapSubdued' || act === 'pillarBurst' || act === 'corpseSnapUp';
  const blend = snapPose ? 1 : isStrike ? 0.68 : act === 'wakingUp' || act === 'shockedFall' || act === 'walking' || act === 'running' ? 0.45 : 0.28;
  rig.bodyPivot.rotation.x += (targetBodyRotX - rig.bodyPivot.rotation.x) * blend;
  rig.bodyPivot.rotation.z += (targetBodyRotZ - rig.bodyPivot.rotation.z) * blend;
  rig.bodyPivot.position.x += (targetBodyPosX - rig.bodyPivot.position.x) * blend;
  rig.bodyPivot.position.z += (targetBodyPosZ - rig.bodyPivot.position.z) * blend;
  rig.bodyPivot.position.y += (targetBodyY - rig.bodyPivot.position.y) * blend;
  rig.torsoGroup.rotation.x += (targetTorsoRotX - rig.torsoGroup.rotation.x) * blend;
  rig.torsoGroup.rotation.z += (targetTorsoRotZ - rig.torsoGroup.rotation.z) * blend;
  if (rig.leftHip) {
    rig.leftHip.rotation.x += (targetLeftHipX - rig.leftHip.rotation.x) * blend;
    rig.leftHip.rotation.z += (targetLeftHipZ - rig.leftHip.rotation.z) * blend;
  }
  if (rig.rightHip) {
    rig.rightHip.rotation.x += (targetRightHipX - rig.rightHip.rotation.x) * blend;
    rig.rightHip.rotation.z += (targetRightHipZ - rig.rightHip.rotation.z) * blend;
  }
  if (rig.leftKnee) rig.leftKnee.rotation.x += (targetLeftKneeX - rig.leftKnee.rotation.x) * blend;
  if (rig.rightKnee) rig.rightKnee.rotation.x += (targetRightKneeX - rig.rightKnee.rotation.x) * blend;

  if (act !== 'dancing' && act !== 'adaab' && act !== 'sufiSpin') {
    rig.bodyPivot.rotation.y += (0 - rig.bodyPivot.rotation.y) * blend;
  }

  if (act === 'sleeping') {
    const breatheScale = 1 + Math.sin(lt * 2.2) * 0.025;
    rig.bodyPivot.scale.set(rig.restScale, rig.restScale * breatheScale, rig.restScale);
  } else if (act === 'fireTrial' && rig.isHolika && emotion !== 'proud') {
    const shrink = Math.max(0.28, 1 - Math.max(0, turnLocal - 0.25) * 0.85);
    rig.bodyPivot.scale.setScalar(rig.restScale * shrink);
  } else if (isComedyMascot && isSpeaking) {
    const sy = 1 + Math.max(0, targetBodyY) * 0.85;
    const sx = 1 - Math.max(0, targetBodyY) * 0.35;
    rig.bodyPivot.scale.set(rig.restScale * sx, rig.restScale * sy, rig.restScale * sx);
  } else {
    rig.bodyPivot.scale.setScalar(rig.restScale);
  }

  // Always lock standing characters flush onto y = 0 (no floating or ankle-sinking during dances/punches/crouches)
  const isSeatedInFire = act === 'fireTrial' && (rig.role === 'ChildDevotee' || rig.isHolika);
  const isSnappingUpMid = act === 'corpseSnapUp' && turnLocal < 0.24;
  if (rig.standing && act !== 'sleeping' && act !== 'lyingShroud' && !isSnappingUpMid && act !== 'wakingUp' && act !== 'sitting' && act !== 'lapSubdued' && !isSeatedInChair && !isSeatedInFire) {
    groundRigFeet(rig, Math.max(0, targetBodyY));
  }

  // Tank turret swivel + cannon recoil punch on angry/proud beats
  if (rig.turretGroup) {
    rig.turretGroup.rotation.y = isSpeaking ? Math.sin(lt * 2.4) * 0.18 : rig.facingSign * -0.15;
    rig.turretGroup.rotation.x = act === 'sleeping' ? 0.28 : 0;
  }
  if (rig.cannonBarrel) {
    const recoil = isSpeaking && (emotion === 'angry' || emotion === 'proud')
      ? Math.max(0, Math.sin(lt * 10.5)) * 0.14
      : 0;
    rig.cannonBarrel.position.z = 0.50 - recoil;
  }
  if (rig.propPivot) {
    rig.propPivot.rotation.x = isSpeaking ? Math.sin(lt * 8.5) * 0.65 : Math.sin(lt * 2.0) * 0.12;
  }

  // Expressive bulging googly eye pop on surprised / scared / brakeStop / angry / confused / waking up / shocked / corpseSnapUp!
  const isWideShock = emotion === 'surprised' || emotion === 'scared' || act === 'brakeStop' || act === 'shockedFall' || act === 'hitReact' || act === 'corpseSnapUp' || (act === 'wakingUp' && turnLocal > 0.25);
  const eyePop = emotion === 'scared' || act === 'brakeStop'
    ? 1.44
    : isWideShock
      ? 1.40
      : emotion === 'angry' || act === 'punching' || act === 'kicking'
        ? 1.24
        : 1.0;
  // Keep sclera Z thin so bulging white sclera NEVER swallows the front black pupil!
  rig.leftSclera.scale.set(eyePop, eyePop * 1.08, 0.50);
  rig.rightSclera.scale.set(eyePop, eyePop * 1.08, 0.50);
  const pupilDartX = (emotion === 'confused' || emotion === 'scared' || act === 'slapForehead')
    ? Math.sin(lt * (emotion === 'scared' ? 16.0 : 9.0)) * 0.020
    : emotion === 'smug'
      ? rig.facingSign * 0.012
      : 0;
  const pupilScale = (emotion === 'scared' || act === 'brakeStop')
    ? 0.58
    : isWideShock
      ? 0.86
      : emotion === 'angry'
        ? 0.88
        : emotion === 'smug'
          ? 0.94
          : 1.0;
  rig.leftPupil.scale.set(pupilScale, pupilScale, 0.92);
  rig.rightPupil.scale.set(pupilScale, pupilScale, 0.92);
  rig.leftPupil.rotation.y = pupilDartX * 8;
  rig.rightPupil.rotation.y = -pupilDartX * 8;

  // Head orientation per action & dialogue speech
  if (act === 'sleeping') {
    rig.headPivot.rotation.set(0.18, rig.facingSign * 0.28, 0.24);
  } else if (act === 'lyingShroud') {
    // Turn head toward +Z camera while lying sideways (root.rotation.y = +PI/2) so expression stays 100% readable!
    const twitch = emotion === 'angry' ? Math.sin(lt * 8.0) * 0.08 : 0;
    rig.headPivot.rotation.set(0.14, 0.52 + twitch, Math.sin(lt * 1.2) * 0.04);
  } else if (act === 'corpseSnapUp') {
    rig.headPivot.rotation.set(0.12 + Math.sin(lt * 20) * 0.04, 0, Math.sin(lt * 24) * 0.05);
  } else if (act === 'brakeStop') {
    rig.headPivot.rotation.set(-0.22 + Math.sin(lt * 24) * 0.05, rig.facingSign * -0.14, Math.sin(lt * 30) * 0.06);
  } else if (act === 'celebrate') {
    rig.headPivot.rotation.set(-0.10 + Math.sin(lt * 8.4) * 0.09, rig.facingSign * -0.06, Math.sin(lt * 4.2) * 0.09);
  } else if (act === 'lookInMirror') {
    // Customer checks shaved back/front head directly inside BOTH wall & angled side mirrors!
    const lookCycle = Math.sin(turnLocal * Math.PI * 1.4);
    rig.headPivot.rotation.set(0.06, -rig.facingSign * (0.68 + lookCycle * 0.28), lookCycle * 0.08);
  } else if (act === 'eating') {
    rig.headPivot.rotation.set(0.14 + Math.sin(lt * 5.4) * 0.12, 0, Math.sin(lt * 2.7) * 0.08);
  } else if (act === 'slapForehead') {
    rig.headPivot.rotation.set(0.18, rig.facingSign * -0.1, -0.22 + Math.sin(lt * 6.5) * 0.06);
  } else if (act === 'lapSubdue' || act === 'pillarBurst') {
    const roar = Math.sin(lt * 10.5) * 0.05;
    rig.headPivot.rotation.set(act === 'lapSubdue' ? 0.24 + roar : -0.10 + roar, 0, Math.sin(lt * 7.2) * 0.04);
  } else if (act === 'lapSubdued') {
    const panic = Math.sin(lt * 13.0) * 0.14;
    rig.headPivot.rotation.set(-0.22 + panic, -0.35 + panic * 0.5, 0.12);
  } else if (act === 'hitReact') {
    const { recoil } = strikePhase(t, 'punching');
    rig.headPivot.rotation.set(-0.30 * recoil, rig.facingSign * 0.35 * recoil, rig.facingSign * 0.18 * recoil);
  } else if (act === 'punching' || act === 'kicking') {
    // Chin tucked, eyes locked on the opponent
    rig.headPivot.rotation.set(0.10, rig.facingSign * -0.12, 0);
  } else if (emotion === 'laughing') {
    // MJO belly-laugh: head thrown joyfully back + rapid comic chuckle nod!
    rig.headPivot.rotation.set(-0.18 + Math.abs(Math.sin(lt * 13.5)) * 0.16, rig.facingSign * -0.06, Math.sin(lt * 6.8) * 0.11);
  } else if (emotion === 'angry') {
    // MJO explosive "Angry Bird" lean-forward glare + high-frequency fury tremble
    rig.headPivot.rotation.set(0.14 + Math.sin(lt * 22) * 0.04, rig.facingSign * -0.14, Math.sin(lt * 28) * 0.05);
  } else if (emotion === 'scared') {
    // Nervous jittery recoil looking anxiously around
    rig.headPivot.rotation.set(-0.08 + Math.sin(lt * 20) * 0.04, rig.facingSign * -0.18 + Math.sin(lt * 14) * 0.06, Math.sin(lt * 26) * 0.05);
  } else if (emotion === 'smug') {
    // Cocky chin-up side-eye smirk tilt
    rig.headPivot.rotation.set(-0.08 + (isSpeaking ? Math.sin(lt * 4.5) * 0.04 : 0), rig.facingSign * -0.08, rig.facingSign * 0.13);
  } else if (emotion === 'proud') {
    rig.headPivot.rotation.set(-0.07 + (isSpeaking ? Math.sin(lt * 5.0) * 0.06 : 0), rig.facingSign * (isSpeaking ? -0.10 : 0.06), 0);
  } else {
    const talkNod = isSpeaking ? Math.sin(lt * 5.2) * 0.085 : Math.sin(lt * 1.4) * 0.025;
    const sideTilt = emotion === 'confused' ? 0.16 : isSpeaking ? Math.sin(lt * 2.6) * 0.065 : 0;
    rig.headPivot.rotation.x = talkNod;
    rig.headPivot.rotation.z = sideTilt;
    rig.headPivot.rotation.y = act === 'walking' || act === 'running'
      ? Math.sin(lt * 3.0) * 0.08
      : rig.facingSign * (isSpeaking ? -0.14 : 0.1);
  }

  // Eyeblinks & asymmetric MJO emotion/sleep eyelids
  const blinkPhase = (lt * 0.28) % 1;
  const blinking = blinkPhase > 0.955;
  let lidClose = -Math.PI * 0.48;
  if (act === 'sleeping' || act === 'praying') lidClose = 0.26;
  else if (act === 'lyingShroud') lidClose = emotion === 'angry' ? -0.18 : 0.28;
  else if (act === 'corpseSnapUp') lidClose = -Math.PI * 0.66;
  else if (act === 'wakingUp' && turnLocal < 0.2) lidClose = 0.24;
  else if (act === 'lapSubdue' || act === 'pillarBurst') lidClose = -Math.PI * 0.64;
  else if (blinking) lidClose = 0.15;
  else if (emotion === 'laughing') lidClose = 0.12;
  else if (emotion === 'sad') lidClose = -Math.PI * 0.28;
  else if (emotion === 'smug') lidClose = -0.10;
  else if (emotion === 'scared' || act === 'brakeStop') lidClose = -Math.PI * 0.68;
  else if (isWideShock || emotion === 'angry') lidClose = -Math.PI * 0.64;
  rig.leftEyelid.rotation.x = emotion === 'smug' ? -0.06 : lidClose;
  rig.rightEyelid.rotation.x = emotion === 'smug' ? -0.16 : lidClose;

  // Expressive eyebrows per emotion (sharper MJO V-brows on angry, high shocked/scared arches, asymmetric Rock eyebrow for smug!)
  const baseBrowY = 0.085;
  let leftLift = isSpeaking ? 0.014 : 0;
  let rightLift = leftLift;
  let leftBrowTilt = 0;
  let rightBrowTilt = 0;
  if (emotion === 'angry' || act === 'corpseSnapUp') {
    leftLift = rightLift = -0.032;
    leftBrowTilt = rightBrowTilt = 0.62;
  } else if (emotion === 'scared' || act === 'brakeStop') {
    leftLift = rightLift = 0.062;
    leftBrowTilt = rightBrowTilt = -0.34;
  } else if (isWideShock) {
    leftLift = rightLift = 0.054;
    leftBrowTilt = rightBrowTilt = -0.10;
  } else if (emotion === 'smug') {
    leftLift = 0.052;
    rightLift = -0.012;
    leftBrowTilt = -0.20;
    rightBrowTilt = 0.26;
  } else if (emotion === 'sad' || act === 'slapForehead') {
    leftLift = rightLift = 0.012;
    leftBrowTilt = rightBrowTilt = -0.34;
  } else if (emotion === 'laughing' || emotion === 'happy' || emotion === 'proud') {
    leftLift = rightLift = 0.042;
    leftBrowTilt = rightBrowTilt = -0.08;
  }
  rig.leftBrow.position.y = baseBrowY + leftLift;
  rig.rightBrow.position.y = baseBrowY + rightLift;
  rig.leftBrow.rotation.z = Math.PI / 2 - leftBrowTilt;
  rig.rightBrow.rotation.z = Math.PI / 2 + rightBrowTilt;

  // Lip-sync driven by real audio envelope + expressive emotional jaw acting (never flat-lip during peak shock/fury/laugh!)
  const activeSpeech = isSpeaking && speechLevel > 0.028;
  const openAmt = activeSpeech ? Math.min(1, speechLevel * 1.50) : 0;
  const vowelWave = 0.5 + 0.5 * Math.sin(t * 24.0 + rig.seedOffset);
  let mouthOpen = activeSpeech ? 0.16 + openAmt * (0.70 + 0.30 * vowelWave) : 0.02;
  if (act === 'sleeping' && !activeSpeech) {
    mouthOpen = 0.04 + 0.14 * Math.max(0, Math.sin(lt * 2.1));
  } else if (act === 'eating' && !activeSpeech) {
    mouthOpen = 0.08 + 0.32 * Math.max(0, Math.sin(lt * 5.2));
  } else if (act === 'corpseSnapUp' || (emotion === 'angry' && isSpeaking)) {
    // Keep furious shouting jaw wide open across words and climax pauses for punchy acting & thumbnails
    mouthOpen = Math.max(mouthOpen, act === 'corpseSnapUp' ? 0.88 : 0.52);
  } else if ((isWideShock && !isSpeaking && turnLocal < 0.78) || (emotion === 'scared' && !isSpeaking) || act === 'brakeStop') {
    mouthOpen = Math.max(mouthOpen, emotion === 'scared' ? 0.42 + 0.08 * Math.sin(lt * 22) : 0.84);
  } else if (emotion === 'laughing' || act === 'celebrate') {
    mouthOpen = Math.max(mouthOpen, 0.44 + 0.18 * Math.abs(Math.sin(lt * 11)));
  } else if (emotion === 'proud' && !isSpeaking) {
    mouthOpen = Math.max(mouthOpen, 0.22);
  } else if (emotion === 'smug' && !isSpeaking) {
    mouthOpen = 0.08;
  } else if (emotion === 'sad' && isSpeaking) {
    mouthOpen = Math.max(mouthOpen, 0.12);
  }
  const mouthWide = activeSpeech
    ? 0.90 + 0.36 * (1 - vowelWave)
    : (emotion === 'happy' || emotion === 'laughing' || emotion === 'proud' || act === 'celebrate'
      ? 1.44
      : (emotion === 'smug'
        ? 1.24
        : (emotion === 'scared' || act === 'brakeStop'
          ? 0.74
          : (emotion === 'angry' || act === 'corpseSnapUp')
            ? 1.22
            : 0.96)));

  rig.mouthCavity.scale.set(1.16 * mouthWide, mouthOpen * 1.22, 0.58);
  rig.mouthCavity.rotation.z = emotion === 'smug' ? rig.facingSign * 0.10 : 0;
  rig.upperLip.position.y = rig.mouthBaseY + mouthOpen * 0.028;
  rig.lowerLip.position.y = rig.mouthBaseY - mouthOpen * 0.056;

  // Expressive two-arm skeletal animation per action
  if (act === 'sleeping') {
    rig.leftShoulder.rotation.set(-0.2, 0, 0.25);
    rig.leftElbow.rotation.set(-0.6, 0, -0.35);
    rig.rightShoulder.rotation.set(-0.2, 0, -0.25);
    rig.rightElbow.rotation.set(-0.6, 0, 0.35);
  } else if (act === 'lyingShroud') {
    rig.leftShoulder.rotation.set(-0.52, 0.24, 0.34);
    rig.leftElbow.rotation.set(-0.88, 0, -0.26);
    rig.rightShoulder.rotation.set(-0.52, -0.24, -0.34);
    rig.rightElbow.rotation.set(-0.88, 0, 0.26);
  } else if (act === 'corpseSnapUp') {
    const wave = Math.sin(lt * 16) * 0.26;
    rig.leftShoulder.rotation.set(-1.45 + wave, 0.22, 0.55);
    rig.leftElbow.rotation.set(-0.62, 0, -0.12);
    rig.rightShoulder.rotation.set(-1.45 - wave, -0.22, -0.55);
    rig.rightElbow.rotation.set(-0.62, 0, 0.12);
  } else if (act === 'wakingUp' || act === 'shockedFall') {
    const flail = Math.sin(lt * 14) * 0.22;
    rig.leftShoulder.rotation.set(-1.38 + flail, 0.25, 0.62);
    rig.leftElbow.rotation.set(-0.55, 0, 0);
    rig.rightShoulder.rotation.set(-1.38 - flail, -0.25, -0.62);
    rig.rightElbow.rotation.set(-0.55, 0, 0);
  } else if (act === 'praying' || (isTitleOrGreeting && !rig.standing)) {
    // Serene Namaste folded hands
    rig.leftShoulder.rotation.set(-0.95, 0.25, -0.42);
    rig.leftElbow.rotation.set(-1.35, 0, -0.5);
    rig.rightShoulder.rotation.set(-0.95, -0.25, 0.42);
    rig.rightElbow.rotation.set(-1.35, 0, 0.5);
  } else if (act === 'slapForehead') {
    // One hand slaps right onto forehead, other hand on waist
    rig.rightShoulder.rotation.set(-1.85, -0.35, 0.32);
    rig.rightElbow.rotation.set(-1.45, 0, 0.45);
    rig.leftShoulder.rotation.set(-0.25, 0.2, 0.42);
    rig.leftElbow.rotation.set(-0.9, 0, -0.55);
  } else if (act === 'eating') {
    const scoop = 0.5 + 0.5 * Math.sin(lt * 5.2);
    rig.rightShoulder.rotation.set(-0.55 - scoop * 0.78, -0.22, 0.22);
    rig.rightElbow.rotation.set(-0.85 - scoop * 0.72, 0, 0.24);
    rig.leftShoulder.rotation.set(-0.32, 0.15, 0.22);
    rig.leftElbow.rotation.set(-0.85, 0, -0.2);
  } else if (act === 'walking' || act === 'running') {
    const freq = act === 'running' ? 14.0 : 7.5;
    const armSwing = Math.sin(t * freq) * (act === 'running' ? 0.95 : 0.55);
    rig.leftShoulder.rotation.set(-armSwing, 0.1, 0.16);
    rig.leftElbow.rotation.set(act === 'running' ? -1.45 : -0.45, 0, 0);
    rig.rightShoulder.rotation.set(armSwing, -0.1, -0.16);
    rig.rightElbow.rotation.set(act === 'running' ? -1.45 : -0.45, 0, 0);
  } else if (act === 'pointing') {
    const jab = Math.sin(lt * 8.5) * 0.14;
    rig.rightShoulder.rotation.set(-1.42 + jab, -0.15 * rig.facingSign, -0.22);
    rig.rightElbow.rotation.set(-0.22, 0, 0);
    rig.leftShoulder.rotation.set(-0.25, 0.18, 0.42);
    rig.leftElbow.rotation.set(-0.95, 0, -0.48);
  } else if (act === 'punching') {
    // Alternating jab / cross: one fist drives forward at impact while the other guards the chin
    const beat = Math.floor(t * STRIKE_TIMING.punching.rate);
    const { extend } = strikePhase(t, 'punching');
    const leadRight = beat % 2 === 0;
    const strikeShoulder = leadRight ? rig.rightShoulder : rig.leftShoulder;
    const strikeElbow = leadRight ? rig.rightElbow : rig.leftElbow;
    const guardShoulder = leadRight ? rig.leftShoulder : rig.rightShoulder;
    const guardElbow = leadRight ? rig.leftElbow : rig.rightElbow;
    const side = leadRight ? -1 : 1;
    strikeShoulder.rotation.set(-0.9 - extend * 0.68, side * 0.18 * (1 - extend), side * -0.12);
    strikeElbow.rotation.set(-1.55 * (1 - extend) - 0.08, 0, 0);
    guardShoulder.rotation.set(-1.05, -side * 0.30, -side * 0.30);
    guardElbow.rotation.set(-1.75, 0, -side * 0.25);
  } else if (act === 'kicking') {
    // Fists up in guard while the leg does the work
    rig.leftShoulder.rotation.set(-1.0, 0.30, 0.38);
    rig.leftElbow.rotation.set(-1.7, 0, 0.25);
    rig.rightShoulder.rotation.set(-0.95, -0.30, -0.38);
    rig.rightElbow.rotation.set(-1.7, 0, -0.25);
  } else if (act === 'hitReact') {
    const { recoil } = strikePhase(t, 'punching');
    const flail = Math.sin(lt * 15) * 0.18 * recoil;
    rig.leftShoulder.rotation.set(-0.55 - recoil * 0.75 + flail, 0.25, 0.55 + recoil * 0.35);
    rig.leftElbow.rotation.set(-0.5, 0, 0);
    rig.rightShoulder.rotation.set(-0.55 - recoil * 0.75 - flail, -0.25, -0.55 - recoil * 0.35);
    rig.rightElbow.rotation.set(-0.5, 0, 0);
  } else if (act === 'cutting' || heldProp === 'scissors') {
    // Extend right arm high & forward so bright chrome blades clip right across Customer's hair crown + comb in left hand!
    const snipSwing = Math.sin(lt * 8.0) * 0.11;
    rig.rightShoulder.rotation.set(-2.06 + snipSwing, 0.10, 0.14);
    rig.rightElbow.rotation.set(-0.24 + Math.cos(lt * 16) * 0.08, 0, -0.06);
    rig.leftShoulder.rotation.set(-1.76, 0.18, 0.18);
    rig.leftElbow.rotation.set(-0.42 + Math.sin(lt * 4.8) * 0.10, 0, -0.10);
  } else if (act === 'combing' || heldProp === 'comb') {
    const combSweep = Math.sin(lt * 6.5) * 0.24;
    rig.rightShoulder.rotation.set(-1.82 + combSweep, 0.12, 0.18);
    rig.rightElbow.rotation.set(-0.48 - combSweep * 0.35, 0, -0.08);
    rig.leftShoulder.rotation.set(-0.4, 0.12, 0.2);
    rig.leftElbow.rotation.set(-0.85, 0, -0.2);
  } else if (act === 'removingTowel') {
    const pull = Math.sin(Math.min(1, turnLocal * 1.35) * Math.PI * 0.82);
    rig.leftShoulder.rotation.set(-0.62 - pull * 0.22, 0.25, 0.55);
    rig.leftElbow.rotation.set(-0.72, 0, -0.22);
    rig.rightShoulder.rotation.set(-0.92 - pull * 0.26, -0.36, -0.68 - pull * 0.34);
    rig.rightElbow.rotation.set(-0.56, 0, 0.24);
  } else if (act === 'adjustingGlasses') {
    const lift = Math.sin(turnLocal * Math.PI);
    rig.rightShoulder.rotation.set(-1.72 - lift * 0.25, 0.18, 0.38);
    rig.rightElbow.rotation.set(-1.42, 0, 0.28);
    rig.leftShoulder.rotation.set(-0.42, 0.14, 0.22);
    rig.leftElbow.rotation.set(-0.90, 0, -0.22);
  } else if (act === 'spraying' || heldProp === 'sprayBottle') {
    const squeeze = Math.sin(lt * 14) * 0.12;
    rig.rightShoulder.rotation.set(-1.58 + squeeze, 0.14, 0.18);
    rig.rightElbow.rotation.set(-0.46, 0, -0.10);
    rig.leftShoulder.rotation.set(-0.85, 0.18, 0.25);
    rig.leftElbow.rotation.set(-0.85, 0, -0.15);
  } else if (act === 'lookInMirror') {
    // Hands raised to feel shaved shiny head in disbelief!
    const touch = Math.sin(lt * 6.0) * 0.12;
    rig.leftShoulder.rotation.set(-1.78 + touch, 0.25, 0.28);
    rig.leftElbow.rotation.set(-1.55, 0, -0.20);
    rig.rightShoulder.rotation.set(-1.78 - touch, -0.25, -0.28);
    rig.rightElbow.rotation.set(-1.55, 0, 0.20);
  } else if (act === 'callingPhone' || heldProp === 'phone') {
    rig.rightShoulder.rotation.set(-1.08, -0.22, 0.25);
    rig.rightElbow.rotation.set(-1.95, 0, 0.25);
    rig.leftShoulder.rotation.set(-0.38, 0.14, 0.2);
    rig.leftElbow.rotation.set(-0.88, 0, -0.22);
  } else if (act === 'showingKey' || heldProp === 'key') {
    const twist = Math.sin(lt * 6.5) * 0.18;
    rig.rightShoulder.rotation.set(-1.28, -0.15, -0.18 + twist);
    rig.rightElbow.rotation.set(-0.42, 0, 0);
    rig.leftShoulder.rotation.set(-0.32, 0.12, 0.2);
    rig.leftElbow.rotation.set(-0.85, 0, -0.22);
  } else if (act === 'bangingGavel' || heldProp === 'gavel') {
    const slam = Math.pow(Math.max(0, Math.sin(lt * 7.2)), 3);
    rig.rightShoulder.rotation.set(-0.65 - slam * 0.85, -0.15, -0.18);
    rig.rightElbow.rotation.set(-0.85 + slam * 0.45, 0, 0);
    rig.leftShoulder.rotation.set(-0.35, 0.14, 0.22);
    rig.leftElbow.rotation.set(-0.85, 0, -0.22);
  } else if (act === 'holdingMic' || heldProp === 'mic') {
    const bob = isSpeaking ? Math.sin(lt * 5.2) * 0.08 : 0;
    rig.rightShoulder.rotation.set(-0.92 + bob, -0.25, 0.28);
    rig.rightElbow.rotation.set(-1.62, 0, 0.22);
    rig.leftShoulder.rotation.set(-0.42, 0.18, 0.22);
    rig.leftElbow.rotation.set(-0.9, 0, -0.22);
  } else if (act === 'examining' || heldProp === 'stethoscope' || heldProp === 'syringe') {
    const probe = Math.sin(lt * 4.5) * 0.16;
    rig.rightShoulder.rotation.set(-1.18 + probe, -0.16, -0.22);
    rig.rightElbow.rotation.set(-0.55 - probe * 0.4, 0, 0);
    rig.leftShoulder.rotation.set(-0.38, 0.15, 0.2);
    rig.leftElbow.rotation.set(-0.88, 0, -0.2);
  } else if (act === 'stirring' || heldProp === 'ladle') {
    const swirl = Math.sin(lt * 7.0) * 0.26;
    const dip = Math.cos(lt * 7.0) * 0.18;
    rig.rightShoulder.rotation.set(-0.95 + dip, -0.18 + swirl, -0.24);
    rig.rightElbow.rotation.set(-0.78 - dip * 0.5, 0, swirl * 0.5);
    rig.leftShoulder.rotation.set(-0.35, 0.15, 0.24);
    rig.leftElbow.rotation.set(-0.88, 0, -0.2);
  } else if (act === 'sipping' || heldProp === 'teacup') {
    const lift = 0.5 + 0.5 * Math.sin(lt * 3.8);
    rig.rightShoulder.rotation.set(-0.68 - lift * 0.52, -0.18, 0.22);
    rig.rightElbow.rotation.set(-1.05 - lift * 0.65, 0, 0.18);
    rig.leftShoulder.rotation.set(-0.34, 0.12, 0.2);
    rig.leftElbow.rotation.set(-0.85, 0, -0.22);
  } else if (act === 'aarti' || heldProp === 'diya') {
    const arcX = Math.cos(lt * 3.6) * 0.26;
    const arcY = Math.sin(lt * 3.6) * 0.28;
    rig.rightShoulder.rotation.set(-1.15 + arcY, -0.15, -0.18 + arcX);
    rig.rightElbow.rotation.set(-0.65, 0, 0);
    rig.leftShoulder.rotation.set(-0.52, 0.2, 0.3);
    rig.leftElbow.rotation.set(-1.1, 0, -0.35);
  } else if (act === 'playingFlute' || heldProp === 'flute') {
    rig.rightShoulder.rotation.set(-1.15, -0.28, 0.35);
    rig.rightElbow.rotation.set(-1.75, 0, 0.28);
    rig.leftShoulder.rotation.set(-1.08, 0.28, -0.15);
    rig.leftElbow.rotation.set(-1.65, 0, 0.22);
  } else if (act === 'sweeping' || heldProp === 'broom') {
    const sweep = Math.sin(lt * 6.0) * 0.38;
    rig.rightShoulder.rotation.set(-0.65, -0.15, -0.22 + sweep);
    rig.rightElbow.rotation.set(-0.8, 0, sweep * 0.4);
    rig.leftShoulder.rotation.set(-0.55, 0.15, 0.22 + sweep * 0.5);
    rig.leftElbow.rotation.set(-0.85, 0, 0);
  } else if (act === 'lapSubdue') {
    // Both clawed primary hands reach forward and pin/tear over Hiranyakashipu across Narasimha's thighs (Janga)
    const grip = Math.sin(lt * 7.5) * 0.08;
    rig.leftShoulder.rotation.set(-1.12 + grip, 0.12, 0.10);
    rig.leftElbow.rotation.set(-0.75, 0, -0.14);
    rig.rightShoulder.rotation.set(-1.12 - grip, -0.12, -0.10);
    rig.rightElbow.rotation.set(-0.75, 0, 0.14);
  } else if (act === 'lapSubdued') {
    // Thrashing arms reaching up in terror while suspended across Narasimha's thighs
    const thrash = Math.sin(lt * 14.5) * 0.28;
    rig.leftShoulder.rotation.set(-1.45 + thrash, 0.25, 0.65);
    rig.leftElbow.rotation.set(-0.65, 0, 0);
    rig.rightShoulder.rotation.set(-1.45 - thrash, -0.25, -0.65);
    rig.rightElbow.rotation.set(-0.65, 0, 0);
  } else if (act === 'pillarBurst') {
    // Arms flung wide apart bursting through stone Sabha pillar
    const surge = Math.sin(lt * 5.5) * 0.10;
    rig.leftShoulder.rotation.set(-0.85, 0.22, 0.92 + surge);
    rig.leftElbow.rotation.set(-0.55, 0, -0.18);
    rig.rightShoulder.rotation.set(-0.85, -0.22, -0.92 - surge);
    rig.rightElbow.rotation.set(-0.55, 0, 0.18);
  } else if (act === 'clubStrike') {
    const strikeCurve = Math.sin(Math.min(1, turnLocal * 1.45) * Math.PI);
    rig.rightShoulder.rotation.set(-2.15 + strikeCurve * 1.55, -0.14, -0.22);
    rig.rightElbow.rotation.set(-0.35, 0, 0);
    rig.leftShoulder.rotation.set(-0.65, 0.20, 0.35);
    rig.leftElbow.rotation.set(-0.85, 0, -0.22);
  } else if (act === 'fireTrial' || act === 'serpentAttack' || act === 'elephantCharge' || act === 'cliffRescue') {
    if (rig.isHolika && emotion !== 'proud') {
      const flail = Math.sin(lt * 15) * 0.26;
      rig.leftShoulder.rotation.set(-1.55 + flail, 0.22, 0.52);
      rig.leftElbow.rotation.set(-0.65, 0, 0);
      rig.rightShoulder.rotation.set(-1.55 - flail, -0.22, -0.52);
      rig.rightElbow.rotation.set(-0.65, 0, 0);
    } else if (rig.role === 'ChildDevotee') {
      rig.leftShoulder.rotation.set(-0.95, 0.25, -0.42);
      rig.leftElbow.rotation.set(-1.35, 0, -0.5);
      rig.rightShoulder.rotation.set(-0.95, -0.25, 0.42);
      rig.rightElbow.rotation.set(-1.35, 0, 0.5);
    } else {
      const jab = Math.sin(lt * 7.5) * 0.14;
      rig.rightShoulder.rotation.set(-1.38 + jab, -0.15 * rig.facingSign, -0.22);
      rig.rightElbow.rotation.set(-0.22, 0, 0);
      rig.leftShoulder.rotation.set(-0.28, 0.18, 0.38);
      rig.leftElbow.rotation.set(-0.90, 0, -0.45);
    }
  } else if (act === 'blessing') {
    // Raised serene Abhaya Mudra blessing right hand
    rig.rightShoulder.rotation.set(-1.35, -0.14, -0.16);
    rig.rightElbow.rotation.set(-1.05, 0, 0.14);
    rig.leftShoulder.rotation.set(-0.32, 0.12, 0.18);
    rig.leftElbow.rotation.set(-0.85, 0, -0.20);
  } else if (act === 'dancing' || act === 'adaab' || act === 'sufiSpin') {
    const style: DanceChoreographyStyle = isComedyMascot ? 'viralBounce' : 'sufiKathak';
    const dance = computeDanceKinematics(lt, style, act, rig.facingSign < 0, 0);
    rig.leftShoulder.rotation.set(dance.leftShoulder[0], dance.leftShoulder[1], dance.leftShoulder[2]);
    rig.leftElbow.rotation.set(dance.leftElbow[0], dance.leftElbow[1], dance.leftElbow[2]);
    rig.rightShoulder.rotation.set(dance.rightShoulder[0], dance.rightShoulder[1], dance.rightShoulder[2]);
    rig.rightElbow.rotation.set(dance.rightElbow[0], dance.rightElbow[1], dance.rightElbow[2]);
    rig.torsoGroup.rotation.y += (dance.torsoRotY - rig.torsoGroup.rotation.y) * 0.35;
    rig.headPivot.rotation.z += (dance.headRotZ - rig.headPivot.rotation.z) * 0.35;
  } else if (act === 'celebrate') {
    // Twin overhead fist-pump victory celebration
    const pump = Math.sin(lt * 9.0) * 0.30;
    rig.leftShoulder.rotation.set(-2.42 + pump, 0.18, 0.30);
    rig.leftElbow.rotation.set(-0.38, 0, -0.10);
    rig.rightShoulder.rotation.set(-2.42 - pump, -0.18, -0.30);
    rig.rightElbow.rotation.set(-0.38, 0, 0.10);
  } else if (act === 'brakeStop') {
    // Both arms thrust forward bracing against screeching sudden stop
    const braceShake = Math.sin(lt * 22) * 0.07;
    rig.leftShoulder.rotation.set(-1.32 + braceShake, 0.18, 0.26);
    rig.leftElbow.rotation.set(-0.26, 0, -0.12);
    rig.rightShoulder.rotation.set(-1.32 - braceShake, -0.18, -0.26);
    rig.rightElbow.rotation.set(-0.26, 0, 0.12);
  } else if (act === 'jumping') {
    const groove = Math.sin(lt * 8.5) * 0.48;
    rig.leftShoulder.rotation.set(-1.4 + groove, 0.2, 0.48);
    rig.leftElbow.rotation.set(-0.6, 0, 0.2);
    rig.rightShoulder.rotation.set(-1.4 - groove, -0.2, -0.48);
    rig.rightElbow.rotation.set(-0.6, 0, -0.2);
  } else if (isSpeaking) {
    if (emotion === 'surprised' || emotion === 'scared') {
      const tremble = emotion === 'scared' ? Math.sin(lt * 19) * 0.12 : 0;
      rig.leftShoulder.rotation.set(-1.3 + tremble, 0.2, 0.55);
      rig.leftElbow.rotation.set(-0.65, 0, 0);
      rig.rightShoulder.rotation.set(-1.35 - tremble, -0.2, -0.55);
      rig.rightElbow.rotation.set(-0.65, 0, 0);
    } else if (emotion === 'angry') {
      // MJO fury shake: both arms clenched & pumping angrily!
      const ragePump = Math.sin(lt * 16) * 0.26;
      rig.leftShoulder.rotation.set(-1.25 + ragePump, 0.25, 0.38);
      rig.leftElbow.rotation.set(-1.28, 0, -0.24);
      rig.rightShoulder.rotation.set(-1.25 - ragePump, -0.25, -0.38);
      rig.rightElbow.rotation.set(-1.28, 0, 0.24);
    } else if (emotion === 'laughing') {
      // MJO belly laugh: right hand slaps knee/torso while left points!
      const guffaw = Math.sin(lt * 14) * 0.24;
      rig.leftShoulder.rotation.set(-1.05 + guffaw * 0.5, 0.22, 0.32);
      rig.leftElbow.rotation.set(-0.52, 0, -0.12);
      rig.rightShoulder.rotation.set(-0.58 + guffaw, -0.22, -0.28);
      rig.rightElbow.rotation.set(-1.25 - guffaw * 0.4, 0, -0.32);
    } else if (emotion === 'smug') {
      // One arm crossed coolly across chest, other hand gesturing knowingly
      rig.leftShoulder.rotation.set(-0.48, 0.22, -0.25);
      rig.leftElbow.rotation.set(-1.28, 0, -0.45);
      rig.rightShoulder.rotation.set(-0.92 + Math.sin(lt * 4.2) * 0.16, -0.18, -0.28);
      rig.rightElbow.rotation.set(-0.85, 0, 0.12);
    } else if (emotion === 'proud') {
      rig.leftShoulder.rotation.set(-0.42, 0.22, 0.36);
      rig.leftElbow.rotation.set(-1.05, 0, -0.45);
      rig.rightShoulder.rotation.set(-1.22 + Math.sin(lt * 5.0) * 0.15, -0.18, -0.30);
      rig.rightElbow.rotation.set(-0.62, 0, 0.18);
    } else {
      const g1 = Math.sin(lt * 4.8) * 0.32;
      const g2 = Math.cos(lt * 3.9) * 0.24;
      rig.rightShoulder.rotation.set(-0.85 + g1, -0.2, -0.26);
      rig.rightElbow.rotation.set(-0.95 + g2, 0, 0);
      rig.leftShoulder.rotation.set(-0.42 + g2 * 0.4, 0.15, 0.18);
      rig.leftElbow.rotation.set(-0.85, 0, -0.15);
    }
  } else {
    // Expressive listening reactions so silent listeners react physically in real time!
    if (emotion === 'scared' || emotion === 'surprised') {
      const jitter = Math.sin(lt * 18) * 0.08;
      rig.leftShoulder.rotation.set(-0.95 + jitter, 0.20, 0.38);
      rig.leftElbow.rotation.set(-1.12, 0, -0.18);
      rig.rightShoulder.rotation.set(-0.95 - jitter, -0.20, -0.38);
      rig.rightElbow.rotation.set(-1.12, 0, 0.18);
    } else if (emotion === 'angry') {
      // Hands on waist / fists clenched fuming
      rig.leftShoulder.rotation.set(-0.42, 0.20, 0.42);
      rig.leftElbow.rotation.set(-1.08, 0, -0.46);
      rig.rightShoulder.rotation.set(-0.42, -0.20, -0.42);
      rig.rightElbow.rotation.set(-1.08, 0, 0.46);
    } else if (emotion === 'smug') {
      rig.leftShoulder.rotation.set(-0.48, 0.24, -0.32);
      rig.leftElbow.rotation.set(-1.35, 0, -0.52);
      rig.rightShoulder.rotation.set(-0.48, -0.24, 0.32);
      rig.rightElbow.rotation.set(-1.35, 0, 0.52);
    } else if (emotion === 'sad') {
      rig.leftShoulder.rotation.set(-0.18, 0.06, 0.14);
      rig.leftElbow.rotation.set(-0.55, 0, -0.15);
      rig.rightShoulder.rotation.set(-0.18, -0.06, -0.14);
      rig.rightElbow.rotation.set(-0.55, 0, 0.15);
    } else {
      rig.leftShoulder.rotation.set(-0.32, 0.12, 0.18);
      rig.leftElbow.rotation.set(-0.85, 0, -0.25);
      rig.rightShoulder.rotation.set(-0.32, -0.12, -0.18);
      rig.rightElbow.rotation.set(-0.85, 0, 0.25);
    }
  }

  // Aura rings + divine chakra rotation (when enabled for devotional/cinematic sets)
  if (showAura) {
    const ringMat = rig.auraRing.material as THREE.MeshBasicMaterial;
    const discMat = rig.auraDisc.material as THREE.MeshBasicMaterial;
    ringMat.opacity = isSpeaking ? 0.55 + 0.15 * Math.sin(lt * 5) : 0.18;
    discMat.opacity = isSpeaking ? 0.22 : 0.06;
    const pulseScale = isSpeaking ? 1.08 + 0.06 * Math.sin(lt * 4.5) : 0.92;
    rig.auraRing.scale.setScalar(pulseScale);
  }

  if (rig.haloGroup && rig.haloMaterial) {
    rig.haloGroup.visible = rig.hasFloorAura !== false;
    rig.haloGroup.rotation.z = t * 0.45;
    rig.haloMaterial.opacity = rig.role === 'Divine' ? 0.72 : isSpeaking ? 0.42 : 0.18;
  }
  if (rig.pedestalGlow) {
    const pm = rig.pedestalGlow.material as THREE.MeshBasicMaterial;
    pm.opacity = isSpeaking ? 0.48 : 0.22;
  }
  if (rig.chakraWheel) {
    rig.chakraWheel.rotation.z = t * (act === 'lapSubdue' || act === 'pillarBurst' ? 6.5 : 2.8);
  }
  if (rig.lowerJawPivot) {
    const roarOpen = act === 'lapSubdue' || act === 'pillarBurst' ? Math.max(0.26, mouthOpen * 0.42) : mouthOpen * 0.36;
    rig.lowerJawPivot.rotation.x = roarOpen;
  }
  if (rig.pattaEnds && rig.pattaEnds.length > 0) {
    rig.pattaEnds.forEach((p, idx) => {
      if (act === 'lapSubdued') {
        p.visible = false;
        return;
      }
      p.visible = true;
      const s = idx === 0 ? -1 : 1;
      const flutter = act === 'pillarBurst' || act === 'lapSubdue' ? 0.14 : 0.05;
      p.rotation.z = s * (0.14 + Math.sin(lt * 3.4 + idx) * flutter);
      p.rotation.x = Math.cos(lt * 2.8 + idx) * flutter * 0.7;
    });
  }
}

export type DanceChoreographyStyle = 'sufiKathak' | 'bhangra' | 'viralBounce';

interface DanceKinematics {
  hipOffsetX: number;
  liftY: number;
  bodyRotY: number;
  bodyRotZ: number;
  torsoRotX: number;
  torsoRotY: number;
  torsoRotZ: number;
  headRotZ: number;
  leftHipX: number;
  rightHipX: number;
  leftKneeX: number;
  rightKneeX: number;
  leftShoulder: [number, number, number];
  leftElbow: [number, number, number];
  rightShoulder: [number, number, number];
  rightElbow: [number, number, number];
}

const lerpAngle = (a: number, b: number, t: number): number => a + (b - a) * t;
const smoothstep = (x: number): number => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

/**
 * Generates expressive, anatomically natural 3D dance kinematics across multi-beat musical phrases
 * (Adaab salutation, Hasta-Mudra arm sweeps, Nazakat hip/knee groove, and Sufi Chakkar spins).
 */
export function computeDanceKinematics(
  t: number,
  style: DanceChoreographyStyle,
  mode: 'dancing' | 'adaab' | 'sufiSpin' = 'dancing',
  mirror = false,
  beatPhase = 0,
): DanceKinematics {
  const s = mirror ? -1 : 1;
  if (style === 'viralBounce') {
    const pulse = Math.abs(Math.sin(t * 7.2));
    const alt = Math.sin(t * 3.6);
    return {
      hipOffsetX: alt * 0.14 * s,
      liftY: Math.pow(pulse, 2.4) * 0.06,
      bodyRotY: Math.sin(t * 1.8) * 0.24 * s,
      bodyRotZ: alt * 0.08 * s,
      torsoRotX: 0.06 + pulse * 0.06,
      torsoRotY: -alt * 0.14 * s,
      torsoRotZ: -alt * 0.07 * s,
      headRotZ: alt * 0.10 * s,
      leftHipX: -pulse * 0.24 + alt * 0.16,
      rightHipX: -pulse * 0.24 - alt * 0.16,
      leftKneeX: pulse * 0.44,
      rightKneeX: pulse * 0.44,
      leftShoulder: [-0.95 + alt * 0.55, 0.22 * s, 0.52 * s],
      leftElbow: [-0.85 + pulse * 0.35, 0, 0.22 * s],
      rightShoulder: [-0.95 - alt * 0.55, -0.22 * s, -0.52 * s],
      rightElbow: [-0.85 + pulse * 0.35, 0, -0.22 * s],
    };
  }

  // Sufi/Kathak & Bhangra phrase sequencer (~1.8s per bar, 4 distinct classical motifs)
  const tempo = style === 'bhangra' ? 1.32 : 0.92;
  const barPos = (t * tempo) % 4;
  const phaseIdx = mode === 'adaab' ? 0 : mode === 'sufiSpin' ? 3 : Math.floor(barPos);
  const local = mode === 'dancing' ? barPos - Math.floor(barPos) : ((t * tempo) % 1);
  const beatDip = beatPhase > 0 ? Math.pow(1 - beatPhase, 2) * 0.16 : Math.abs(Math.sin(t * Math.PI * tempo * 2)) * 0.14;
  const sway = Math.sin(local * Math.PI * 2);

  if (phaseIdx === 0) {
    // Motif 1: Open Royal Adaab & Nazakat Salutation (palm gracefully raised toward forehead, never clipping chest/beard)
    const rise = smoothstep(Math.sin(local * Math.PI));
    const sideHip = -0.09 * s * rise;
    return {
      hipOffsetX: sideHip,
      liftY: 0,
      bodyRotY: 0.16 * s * rise,
      bodyRotZ: 0.04 * s * rise,
      torsoRotX: 0.09 * rise,
      torsoRotY: -0.12 * s * rise,
      torsoRotZ: -0.07 * s * rise,
      headRotZ: 0.10 * s * rise,
      leftHipX: -0.14 - beatDip * 0.25,
      rightHipX: -0.06 - beatDip * 0.15,
      leftKneeX: 0.24 + beatDip * 0.55,
      rightKneeX: 0.12 + beatDip * 0.35,
      leftShoulder: [-0.78 * rise - 0.24, 0.28 * s, (0.42 + 0.18 * rise) * s],
      leftElbow: [-0.48 - 0.28 * rise, 0, -0.18 * s],
      rightShoulder: [lerpAngle(-0.45, -1.42, rise), -0.32 * s, (-0.36 - 0.16 * rise) * s],
      rightElbow: [lerpAngle(-0.55, -1.28, rise), 0, (0.24 * rise) * s],
    };
  }

  if (phaseIdx === 1) {
    // Motif 2: Flowing Hasta-Mudra Crescent Wave & Wrist Flourish
    const arc = Math.sin(local * Math.PI * 2);
    return {
      hipOffsetX: arc * 0.15 * s,
      liftY: 0,
      bodyRotY: arc * 0.22 * s,
      bodyRotZ: arc * 0.05 * s,
      torsoRotX: 0.05,
      torsoRotY: -arc * 0.22 * s,
      torsoRotZ: -arc * 0.09 * s,
      headRotZ: arc * 0.14 * s,
      leftHipX: -0.16 + Math.max(0, arc) * 0.18,
      rightHipX: -0.16 + Math.max(0, -arc) * 0.18,
      leftKneeX: 0.26 + Math.abs(arc) * 0.24 + beatDip,
      rightKneeX: 0.26 + Math.abs(arc) * 0.24 + beatDip,
      leftShoulder: [-1.18 + arc * 0.52, 0.32 * s, (0.58 + arc * 0.32) * s],
      leftElbow: [-0.72 + Math.cos(local * Math.PI * 2) * 0.35, 0, 0.26 * s],
      rightShoulder: [-1.18 - arc * 0.52, -0.32 * s, (-0.58 + arc * 0.32) * s],
      rightElbow: [-0.72 - Math.cos(local * Math.PI * 2) * 0.35, 0, -0.26 * s],
    };
  }

  if (phaseIdx === 2) {
    // Motif 3: Kathak Tatkaar / Bhangra Diagonal Reach & Alternating Footwork
    const step = sway;
    const armBoost = style === 'bhangra' ? 0.35 : 0;
    return {
      hipOffsetX: step * 0.16 * s,
      liftY: style === 'bhangra' ? Math.max(0, Math.abs(step) - 0.6) * 0.12 : 0,
      bodyRotY: step * 0.20 * s,
      bodyRotZ: step * 0.06 * s,
      torsoRotX: 0.08 + beatDip * 0.25,
      torsoRotY: -step * 0.18 * s,
      torsoRotZ: -step * 0.07 * s,
      headRotZ: step * 0.11 * s,
      leftHipX: -0.12 + step * 0.28,
      rightHipX: -0.12 - step * 0.28,
      leftKneeX: 0.20 + Math.max(0, -step) * 0.48 + beatDip,
      rightKneeX: 0.20 + Math.max(0, step) * 0.48 + beatDip,
      leftShoulder: [-1.45 - armBoost + step * 0.38, 0.24 * s, (0.64 + step * 0.24) * s],
      leftElbow: [-0.88 + step * 0.24, 0, 0.18 * s],
      rightShoulder: [-1.05 - armBoost - step * 0.42, -0.24 * s, (-0.52 + step * 0.24) * s],
      rightElbow: [-0.88 - step * 0.24, 0, -0.18 * s],
    };
  }

  // Motif 4: Graceful Sufi Chakkar Spin (smooth full 360 pirouette with sweeping arms)
  const spinEase = smoothstep(local);
  const spread = Math.sin(spinEase * Math.PI);
  return {
    hipOffsetX: Math.sin(spinEase * Math.PI) * 0.08 * s,
    liftY: style === 'bhangra' ? spread * 0.08 : 0,
    bodyRotY: spinEase * Math.PI * 2 * s,
    bodyRotZ: 0.04 * s * spread,
    torsoRotX: -0.05 * spread,
    torsoRotY: 0,
    torsoRotZ: 0,
    headRotZ: -0.08 * s * spread,
    leftHipX: -0.12,
    rightHipX: -0.12,
    leftKneeX: 0.22 + beatDip * 0.4,
    rightKneeX: 0.22 + beatDip * 0.4,
    leftShoulder: [-1.55 - 0.35 * spread, 0.28 * s, (0.68 + 0.32 * spread) * s],
    leftElbow: [-0.42 - 0.22 * spread, 0, 0.24 * s],
    rightShoulder: [-1.55 - 0.35 * spread, -0.28 * s, (-0.68 - 0.32 * spread) * s],
    rightElbow: [-0.42 - 0.22 * spread, 0, -0.24 * s],
  };
}

function groundRigFeet(rig: CharacterRig, liftY = 0): void {
  const markers = getFootMarkers(rig);
  rig.bodyPivot.position.y = 0;
  rig.bodyPivot.updateMatrixWorld(true);
  let lowest = Infinity;
  for (const marker of [markers.left, markers.right]) {
    if (!marker) continue;
    marker.getWorldPosition(_foot);
    rig.root.worldToLocal(_foot);
    lowest = Math.min(lowest, _foot.y);
  }
  const ground = Number.isFinite(lowest) ? Math.max(-0.55, Math.min(0.45, -lowest)) : 0;
  rig.bodyPivot.position.y = ground + Math.max(0, Math.min(0.6, liftY));
}

export function applyChoreographedDancePose(
  rig: CharacterRig,
  timeSec: number,
  style: DanceChoreographyStyle,
  beatPhase = 0,
  mirror = false,
  phaseOffset = 0,
  kineticEnergy = 0.5,
): void {
  const lt = timeSec + phaseOffset;
  const k = computeDanceKinematics(lt, style, 'dancing', mirror, beatPhase);
  rig.bodyPivot.scale.setScalar(rig.restScale);
  rig.bodyPivot.position.x = k.hipOffsetX;
  rig.bodyPivot.rotation.set(0, k.bodyRotY, k.bodyRotZ);
  rig.torsoGroup.position.y = rig.baseTorsoY + Math.sin(lt * 3.0) * 0.01;
  rig.torsoGroup.rotation.set(k.torsoRotX, k.torsoRotY, k.torsoRotZ);
  rig.headPivot.rotation.set(0, Math.sin(lt * 1.4) * 0.08, k.headRotZ);

  rig.leftShoulder.rotation.set(k.leftShoulder[0], k.leftShoulder[1], k.leftShoulder[2]);
  rig.leftElbow.rotation.set(k.leftElbow[0], k.leftElbow[1], k.leftElbow[2]);
  rig.rightShoulder.rotation.set(k.rightShoulder[0], k.rightShoulder[1], k.rightShoulder[2]);
  rig.rightElbow.rotation.set(k.rightElbow[0], k.rightElbow[1], k.rightElbow[2]);

  if (rig.leftHip) rig.leftHip.rotation.set(k.leftHipX, 0, 0);
  if (rig.rightHip) rig.rightHip.rotation.set(k.rightHipX, 0, 0);
  if (rig.leftKnee) rig.leftKnee.rotation.set(k.leftKneeX, 0, 0);
  if (rig.rightKnee) rig.rightKnee.rotation.set(k.rightKneeX, 0, 0);

  groundRigFeet(rig, k.liftY);

  const open = 0.22 + kineticEnergy * 0.35;
  const blink = (lt * 0.31) % 1 > 0.96;
  rig.leftEyelid.rotation.x = blink ? 0.14 : -Math.PI * 0.52;
  rig.rightEyelid.rotation.x = blink ? 0.14 : -Math.PI * 0.52;
  rig.mouthCavity.scale.set(1.15, 0.12 + open * 0.45, 0.5);
  rig.upperLip.position.y = rig.mouthBaseY + open * 0.02;
  rig.lowerLip.position.y = rig.mouthBaseY - open * 0.04;
}

/**
 * Drives any 3D CharacterRig (BrainrotLog, CupDancer, CartoonTank, ComicBobble, or classic)
 * from external live pose data (e.g. MediaPipe body tracking in Motion Copy 3D Remix).
 */
export function applyExternalPose(
  rig: CharacterRig,
  pose: ExternalBodyPose,
  t: number,
): void {
  const lt = t + rig.seedOffset;
  if (pose.joints) {
    applyJoints3D(rig, pose, pose.joints);
  } else {
    rig.bodyPivot.position.x = pose.hipOffsetX;
    rig.bodyPivot.position.y = Math.max(0, pose.hipBounceY);
    rig.torsoGroup.position.y = rig.baseTorsoY + Math.sin(lt * 3.0) * 0.012;
    rig.torsoGroup.rotation.x = pose.torsoTiltX;
    rig.torsoGroup.rotation.z = pose.torsoTiltZ;

    rig.headPivot.rotation.z = pose.headTiltZ;
    rig.headPivot.rotation.y = pose.headYawY;

    rig.leftShoulder.rotation.set(-0.22, 0.1, pose.leftShoulderZ);
    rig.leftElbow.rotation.set(-0.18, 0, pose.leftElbowZ);
    rig.rightShoulder.rotation.set(-0.22, -0.1, pose.rightShoulderZ);
    rig.rightElbow.rotation.set(-0.18, 0, pose.rightElbowZ);

    if (rig.turretGroup) {
      rig.turretGroup.rotation.y = pose.headYawY * 1.3;
    }
  }
  if (rig.propPivot) {
    rig.propPivot.rotation.z = pose.joints ? 0 : pose.rightElbowZ * 0.5;
  }

  const emo = pose.emotion ?? 'happy';
  const eyePop = emo === 'surprised' ? 1.32 : emo === 'angry' ? 1.15 : 1.05;
  rig.leftSclera.scale.set(eyePop, eyePop * 1.05, 0.6 * eyePop);
  rig.rightSclera.scale.set(eyePop, eyePop * 1.05, 0.6 * eyePop);

  const blink = (lt * 0.31) % 1 > 0.96;
  rig.leftEyelid.rotation.x = blink ? 0.14 : -Math.PI * 0.52;
  rig.rightEyelid.rotation.x = blink ? 0.14 : -Math.PI * 0.52;

  const open = pose.mouthOpen ?? 0.25;
  rig.mouthCavity.scale.set(1.15, 0.12 + open * 0.45, 0.5);
  rig.upperLip.position.y = rig.mouthBaseY + open * 0.02;
  rig.lowerLip.position.y = rig.mouthBaseY - open * 0.04;

  const ringMat = rig.auraRing.material as THREE.MeshBasicMaterial;
  const discMat = rig.auraDisc.material as THREE.MeshBasicMaterial;
  ringMat.opacity = 0.52 + 0.14 * Math.sin(lt * 5.2);
  discMat.opacity = 0.18;
}

// ---------------------------------------------------------------------------------------------
// Full 3D joint retargeting (Motion Copy): every bone is aimed at the tracked joint in rig space,
// whatever its parent is doing, then the lowest foot is planted on the floor.
// ---------------------------------------------------------------------------------------------

const REST_DOWN = new THREE.Vector3(0, -1, 0);
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const IDENTITY_Q = new THREE.Quaternion();
/** MediaPipe's nose sits ahead of and below the ears; remove that built-in head pitch. */
const HEAD_PITCH_BIAS = new THREE.Quaternion().setFromAxisAngle(X_AXIS, -0.3);
const ARM_REST_LEFT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0, -0.18));
const ARM_REST_RIGHT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0, 0.18));
const ELBOW_REST = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.25, 0, 0));
const _qRootInv = new THREE.Quaternion();
const _qParentInv = new THREE.Quaternion();
const _qTarget = new THREE.Quaternion();
const _qTmp = new THREE.Quaternion();
const _qPose = new THREE.Quaternion();
const _qYaw = new THREE.Quaternion();
const _axisX = new THREE.Vector3();
const _axisY = new THREE.Vector3();
const _axisZ = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _local = new THREE.Vector3();
const _foot = new THREE.Vector3();
const _basis = new THREE.Matrix4();

interface FootMarkers {
  left: THREE.Object3D | null;
  right: THREE.Object3D | null;
}
const footMarkers = new WeakMap<CharacterRig, FootMarkers>();

/** Invisible points at the sole of each shoe (at rest they sit on y = 0 in rig space). */
function getFootMarkers(rig: CharacterRig): FootMarkers {
  let markers = footMarkers.get(rig);
  if (!markers) {
    const make = (hip?: THREE.Group, knee?: THREE.Group): THREE.Object3D | null => {
      const parent = knee ?? hip;
      if (!parent) return null;
      const marker = new THREE.Object3D();
      marker.position.set(0, knee ? -0.323 : -0.39, 0.04);
      parent.add(marker);
      return marker;
    };
    markers = { left: make(rig.leftHip, rig.leftKnee), right: make(rig.rightHip, rig.rightKnee) };
    footMarkers.set(rig, markers);
  }
  return markers;
}

/** The object's orientation relative to the rig root (not the scene). */
function rigSpaceQuaternion(rig: CharacterRig, obj: THREE.Object3D, out: THREE.Quaternion): THREE.Quaternion {
  obj.getWorldQuaternion(out);
  rig.root.getWorldQuaternion(_qRootInv).invert();
  return out.premultiply(_qRootInv);
}

function blendInto(bone: THREE.Object3D, target: THREE.Quaternion, weight: number): void {
  if (weight >= 1) bone.quaternion.copy(target);
  else bone.quaternion.slerp(target, weight);
}

/** Points a limb bone (which hangs along -Y at rest) along the rig-space direction `dirRig`. */
function aimBone(rig: CharacterRig, bone: THREE.Object3D, dirRig: THREE.Vector3, side: number, weight: number): void {
  rigSpaceQuaternion(rig, bone.parent!, _qParentInv).invert();
  _local.copy(dirRig).applyQuaternion(_qParentInv);
  // Straight up is the one direction where the shortest turn from "down" is ambiguous; lean it
  // outward a touch so a raised arm always swings up through the side instead of flipping.
  if (_local.y > 0.985) {
    _local.x += 0.07 * side;
    _local.normalize();
  }
  _qTarget.setFromUnitVectors(REST_DOWN, _local);
  blendInto(bone, _qTarget, weight);
}

function directionBetween(a: JointPoint3D | null, b: JointPoint3D | null, out: THREE.Vector3): boolean {
  if (!a || !b) return false;
  out.set(b.x - a.x, b.y - a.y, b.z - a.z);
  const len = out.length();
  if (len < 1e-4) return false;
  out.divideScalar(len);
  return true;
}

/** Limits a rotation to `maxAngle` radians, keeping its axis. */
function clampRotation(q: THREE.Quaternion, maxAngle: number): void {
  const angle = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
  if (angle <= maxAngle) return;
  _qTmp.copy(q);
  q.copy(IDENTITY_Q).slerp(_qTmp, maxAngle / angle);
}

function relaxBone(bone: THREE.Object3D | undefined, rest: THREE.Quaternion, weight: number): void {
  if (bone) bone.quaternion.slerp(rest, weight);
}

function applyJoints3D(rig: CharacterRig, pose: ExternalBodyPose, j: PoseJoints3D): void {
  const isTank = rig.role === 'CartoonTank';

  // 1. Pelvis: travel across the stage and turn (yaw only, so the feet stay under the body).
  let yaw = 0;
  if (j.lHip && j.rHip) yaw = Math.atan2(-(j.rHip.z - j.lHip.z), j.rHip.x - j.lHip.x);
  else if (j.lShoulder && j.rShoulder) yaw = Math.atan2(-(j.rShoulder.z - j.lShoulder.z), j.rShoulder.x - j.lShoulder.x);
  yaw = Math.max(-1.3, Math.min(1.3, yaw)) * (isTank ? 0.6 : 1);
  rig.bodyPivot.position.set(pose.hipOffsetX, 0, 0);
  _qYaw.setFromAxisAngle(UP_AXIS, yaw);
  rig.bodyPivot.quaternion.slerp(_qYaw, 0.8);
  rig.torsoGroup.position.y = rig.baseTorsoY;

  // 2. Torso: the shoulder line gives the right axis, hips-to-shoulders gives up.
  let torsoSet = false;
  if (j.lShoulder && j.rShoulder) {
    _axisX.set(j.rShoulder.x - j.lShoulder.x, j.rShoulder.y - j.lShoulder.y, j.rShoulder.z - j.lShoulder.z);
    if (j.lHip && j.rHip) {
      _axisY.set(
        (j.lShoulder.x + j.rShoulder.x - j.lHip.x - j.rHip.x) / 2,
        (j.lShoulder.y + j.rShoulder.y - j.lHip.y - j.rHip.y) / 2,
        (j.lShoulder.z + j.rShoulder.z - j.lHip.z - j.rHip.z) / 2,
      );
    } else {
      _axisY.set(0, 1, 0);
    }
    if (_axisX.lengthSq() > 1e-6) {
      _axisX.normalize();
      _axisY.addScaledVector(_axisX, -_axisY.dot(_axisX));
      if (_axisY.lengthSq() > 1e-6) {
        _axisY.normalize();
        _axisZ.crossVectors(_axisX, _axisY);
        _basis.makeBasis(_axisX, _axisY, _axisZ);
        _qPose.setFromRotationMatrix(_basis);
        // Relative to the (yawed) pelvis, limited so a mis-tracked frame can't fold the body.
        _qTarget.copy(rig.bodyPivot.quaternion).invert().multiply(_qPose);
        clampRotation(_qTarget, isTank ? 0.25 : 0.8);
        blendInto(rig.torsoGroup, _qTarget, 0.85);
        torsoSet = true;
      }
    }
  }
  if (!torsoSet) relaxBone(rig.torsoGroup, IDENTITY_Q, 0.1);

  // 3. Head from the ears and nose.
  let headSet = false;
  if (j.lEar && j.rEar && j.nose) {
    _axisX.set(j.rEar.x - j.lEar.x, j.rEar.y - j.lEar.y, j.rEar.z - j.lEar.z);
    _axisZ.set(
      j.nose.x - (j.lEar.x + j.rEar.x) / 2,
      j.nose.y - (j.lEar.y + j.rEar.y) / 2,
      j.nose.z - (j.lEar.z + j.rEar.z) / 2,
    );
    if (_axisX.lengthSq() > 1e-6) {
      _axisX.normalize();
      _axisZ.addScaledVector(_axisX, -_axisZ.dot(_axisX));
      if (_axisZ.lengthSq() > 1e-6) {
        _axisZ.normalize();
        _axisY.crossVectors(_axisZ, _axisX);
        _basis.makeBasis(_axisX, _axisY, _axisZ);
        _qPose.setFromRotationMatrix(_basis).multiply(HEAD_PITCH_BIAS);
        rigSpaceQuaternion(rig, rig.headPivot.parent!, _qParentInv).invert();
        _qTarget.copy(_qParentInv).multiply(_qPose);
        clampRotation(_qTarget, 0.75);
        blendInto(rig.headPivot, _qTarget, 0.75);
        headSet = true;
      }
    }
  }
  if (!headSet) relaxBone(rig.headPivot, IDENTITY_Q, 0.1);

  // 4. Arms: upper arm toward the elbow, forearm toward the wrist.
  const arm = (shoulder: THREE.Group, elbow: THREE.Group, s: JointPoint3D | null, e: JointPoint3D | null,
               w: JointPoint3D | null, side: number, rest: THREE.Quaternion) => {
    if (directionBetween(s, e, _dir)) {
      aimBone(rig, shoulder, _dir, side, 1);
      if (directionBetween(e, w, _dir)) aimBone(rig, elbow, _dir, side, 1);
      else relaxBone(elbow, IDENTITY_Q, 0.15);
    } else {
      relaxBone(shoulder, rest, 0.12);
      relaxBone(elbow, ELBOW_REST, 0.12);
    }
  };
  arm(rig.leftShoulder, rig.leftElbow, j.lShoulder, j.lElbow, j.lWrist, -1, ARM_REST_LEFT);
  arm(rig.rightShoulder, rig.rightElbow, j.rShoulder, j.rElbow, j.rWrist, 1, ARM_REST_RIGHT);

  // 5. Legs: thigh toward the knee, shin toward the ankle (mascots have one-piece legs). When
  //    the legs are out of frame they keep a beat groove instead of freezing.
  const groove = Math.max(0, Math.min(0.9, pose.grooveBend ?? 0));
  const leg = (hip: THREE.Group | undefined, knee: THREE.Group | undefined, h: JointPoint3D | null,
               k: JointPoint3D | null, a: JointPoint3D | null, side: number) => {
    if (!hip) return;
    if (knee && directionBetween(h, k, _dir)) {
      aimBone(rig, hip, _dir, side, 1);
      if (directionBetween(k, a, _dir)) aimBone(rig, knee, _dir, side, 1);
      else relaxBone(knee, IDENTITY_Q, 0.2);
      return;
    }
    if (!knee && (directionBetween(h, a, _dir) || directionBetween(h, k, _dir))) {
      aimBone(rig, hip, _dir, side, 1);
      return;
    }
    // Groove: thigh forward by half the bend, shin back by the full bend, foot stays under the hip.
    _dir.set(side * 0.06, -Math.cos(groove * 0.5), Math.sin(groove * 0.5)).normalize();
    aimBone(rig, hip, _dir, side, 0.35);
    if (knee) {
      _qTarget.setFromAxisAngle(X_AXIS, groove);
      blendInto(knee, _qTarget, 0.35);
    }
  };
  leg(rig.leftHip, rig.leftKnee, j.lHip, j.lKnee, j.lAnkle, -1);
  leg(rig.rightHip, rig.rightKnee, j.rHip, j.rKnee, j.rAnkle, 1);

  // 6. Plant the lowest foot on the floor (so squats sink and kicks don't float), plus jump lift.
  rig.bodyPivot.scale.setScalar(rig.restScale);
  groundRigFeet(rig, pose.liftY ?? 0);
}
