import * as THREE from 'three';
import { ActionKind, CharacterProfileJson, CharacterRole, EmotionKind, SceneSetting } from './types';

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
  haloGroup?: THREE.Group;
  haloMaterial?: THREE.MeshBasicMaterial;
  auraRing: THREE.Mesh;
  auraDisc: THREE.Mesh;
  pedestalGlow?: THREE.Mesh;
  turretGroup?: THREE.Group;
  cannonBarrel?: THREE.Mesh;
  propPivot?: THREE.Group;
  mouthBaseY: number;
  baseTorsoY: number;
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
}

const GODDESS_TOKENS = ['devi', 'mata', 'durga', 'lakshmi', 'laxmi', 'saraswati', 'parvati', 'sita', 'radha', 'देवी', 'माता', 'दुर्गा', 'लक्ष्मी', 'सरस्वती', 'पार्वती', 'सीता', 'राधा'];

function isStandingScene(setting: SceneSetting, role: CharacterRole): boolean {
  if (role === 'Warrior' || role === 'KingCrown' || role === 'BrainrotLog' || role === 'CupDancer' || role === 'CartoonTank' || role === 'ComicBobble') return true;
  return setting === 'ComedyStage'
    || setting === 'ChaiStall'
    || setting === 'SkyGauntlet'
    || setting === 'TankArena'
    || setting === 'DoorwaySet'
    || setting === 'Bedroom'
    || setting === 'LivingRoom'
    || setting === 'Kitchen'
    || setting === 'SweetShop'
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

  // Default Scholar / Comedy character hair (+ contrasting silhouette for ComicBobble vs partner)
  if (role === 'ComicBobble' || isDomesticOrComedySetting(setting)) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.03, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.47), hairMat);
    hair.scale.set(1.01, 1.11, 0.99);
    hair.rotation.x = -0.35;
    headPivot.add(hair);
    if (role === 'ComicBobble') {
      // MJO-style playful spiky hair tufts on comic lead
      for (const ang of [-0.35, 0, 0.35]) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.14, headR * 0.38, 8), hairMat);
        tuft.position.set(ang * headR * 0.85, headR * 1.05, headR * 0.18);
        tuft.rotation.z = -ang * 0.65;
        tuft.rotation.x = 0.22;
        headPivot.add(tuft);
      }
    } else {
      const quiff = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.34, 12, 10), hairMat);
      quiff.scale.set(1.2, 0.64, 1.3);
      quiff.position.set(0, headR * 0.94, headR * 0.34);
      headPivot.add(quiff);
    }
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

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.17 * eyeScale, 14, 12), whiteMat);
    sclera.scale.set(1.0, 1.05, 0.6);
    sclera.position.set(eyeX, eyeY, eyeZ);
    headPivot.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.105 * (isGoogly ? 1.15 : 1.0), 12, 10), irisMat);
    pupil.scale.set(1, 1, 0.65);
    pupil.position.set(eyeX, eyeY, eyeZ + headR * 0.07 * eyeScale);
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
    headY: role === 'CartoonTank' ? 1.05 : 1.35,
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
  const { robe, sash, skin, isDivine } = getRolePalette(role, profile.robeHex, accentHex);
  const accentColor = new THREE.Color(accentHex);

  if (role === 'BrainrotLog' || role === 'CupDancer' || role === 'CartoonTank') {
    return buildComedyMascotRig(role, profile.name, facingSign, seedOffset, robe, sash, skin, accentColor);
  }

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const isComedyEnv = isDomesticOrComedySetting(setting);
  const isModernComedy = isComedyEnv && (role === 'Scholar' || role === 'ComicBobble' || role === 'ChildDevotee');
  const childScale = role === 'ChildDevotee' && !isModernComedy ? 0.86 : 1.0;
  bodyPivot.scale.setScalar(childScale);

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
  const torsoMesh = new THREE.Mesh(torsoGeo, robeMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  if (!isModernComedy) {
    // Diagonal silk Uttariya / sash hugging chest contour (devotional & classical sets only)
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

  const buildArm = (side: -1 | 1): { shoulder: THREE.Group; elbow: THREE.Group } => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.245, 0.52, 0);
    torsoGroup.add(shoulder);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), robeMat);
    shoulderCap.castShadow = true;
    shoulder.add(shoulderCap);

    const upper = new THREE.Mesh(upperArmGeo, robeMat);
    upper.position.y = -0.13;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), robeMat);
    elbowCap.castShadow = true;
    elbow.add(elbowCap);

    const lower = new THREE.Mesh(forearmGeo, robeMat);
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

  // Neck + Sculpted Expressive 3D Head
  const headR = role === 'ComicBobble' ? 0.345 : role === 'ChildDevotee' ? 0.265 : 0.245;
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
    if (!isModernComedy) {
      const kundal = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.1, headR * 0.025, 8, 14), goldMat);
      kundal.rotation.y = Math.PI / 2;
      kundal.position.set(s * headR * 0.98, -headR * 0.2, 0.01);
      headPivot.add(kundal);
    }
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

  const browHex = role === 'SageRishi' ? 0xd9dce6 : 0x1c1722;
  const isGoogly = role === 'ComicBobble' || setting === 'DoorwaySet' || setting === 'SkyGauntlet';
  const face = attachFaceRig(headPivot, headR, skin, browHex, headR * 0.85, isGoogly);

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
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    snackProp,
    headY: standing ? 1.54 : 1.04,
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
    haloGroup,
    haloMaterial,
    auraRing,
    auraDisc,
    pedestalGlow,
    mouthBaseY: face.mouthBaseY,
    baseTorsoY: standing ? 0.66 : 0.15,
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
): void {
  const lt = t + rig.seedOffset;
  const act = (action || 'none') as ActionKind;
  const isComedyMascot = rig.role === 'BrainrotLog' || rig.role === 'CupDancer' || rig.role === 'CartoonTank' || rig.role === 'ComicBobble';

  if (rig.snackProp) {
    rig.snackProp.visible = act === 'eating';
  }

  // Smooth baseline reset before applying action posture
  let targetBodyRotX = 0;
  let targetBodyRotZ = 0;
  let targetBodyY = 0;
  let targetTorsoRotX = 0;
  let targetTorsoRotZ = 0;
  let targetLeftHipX = 0;
  let targetRightHipX = 0;
  let targetLeftKneeX = 0;
  let targetRightKneeX = 0;

  // Breathing & idle/speech bounce
  const breath = Math.sin(lt * 2.1) * (isSpeaking ? 0.018 : 0.008);
  rig.torsoGroup.position.y = rig.baseTorsoY + breath;

  const showAura = rig.hasFloorAura !== false;

  if (act === 'sleeping') {
    targetBodyRotX = -Math.PI * 0.48;
    targetBodyY = rig.standing ? 0.06 : 0.16;
    targetLeftHipX = 0.14;
    targetRightHipX = 0.08;
    targetLeftKneeX = 0.28;
    targetRightKneeX = 0.16;
    rig.auraRing.visible = false;
    rig.auraDisc.visible = false;
  } else {
    rig.auraRing.visible = showAura;
    rig.auraDisc.visible = showAura;
    if (act === 'wakingUp') {
      const w = Math.max(0, Math.min(1, (turnLocal - 0.04) / 0.36));
      const eased = 1 - Math.pow(1 - w, 3);
      targetBodyRotX = -Math.PI * 0.48 * (1 - eased) - 0.10 * Math.sin(w * Math.PI);
      targetBodyY = (rig.standing ? 0.06 : 0.16) * (1 - eased) + Math.sin(w * Math.PI) * 0.12;
      targetTorsoRotX = -0.14 * Math.sin(w * Math.PI);
    } else if (act === 'sitting') {
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
    } else if (act === 'jumping' || act === 'dancing') {
      const hop = Math.abs(Math.sin(lt * (act === 'dancing' ? 8.5 : 6.2)));
      targetBodyY = hop * (act === 'jumping' ? 0.22 : 0.10);
      targetBodyRotZ = act === 'dancing' ? Math.sin(lt * 4.25) * 0.12 : 0;
      targetLeftHipX = act === 'dancing' ? Math.sin(lt * 8.5) * 0.25 : -hop * 0.35;
      targetRightHipX = act === 'dancing' ? -Math.sin(lt * 8.5) * 0.25 : -hop * 0.35;
      targetLeftKneeX = hop * 0.55;
      targetRightKneeX = hop * 0.55;
    } else if (act === 'pointing') {
      targetTorsoRotX = 0.14 + Math.sin(lt * 6.5) * 0.04;
      targetBodyY = isSpeaking ? Math.abs(Math.sin(lt * 7.5)) * 0.035 : 0;
    } else {
      targetBodyY = isSpeaking && rig.standing
        ? Math.abs(Math.sin(lt * (isComedyMascot ? 9.2 : 7.2))) * (isComedyMascot ? 0.055 : 0.035)
        : 0;
    }
  }

  // Smooth exponential tracking for lower body & posture so transitions are crisp yet fluid (and snap on scene cuts / frame 0)
  const blend = snapPose ? 1 : act === 'wakingUp' || act === 'shockedFall' || act === 'walking' || act === 'running' ? 0.45 : 0.28;
  rig.bodyPivot.rotation.x += (targetBodyRotX - rig.bodyPivot.rotation.x) * blend;
  rig.bodyPivot.rotation.z += (targetBodyRotZ - rig.bodyPivot.rotation.z) * blend;
  rig.bodyPivot.position.y += (targetBodyY - rig.bodyPivot.position.y) * blend;
  rig.torsoGroup.rotation.x += (targetTorsoRotX - rig.torsoGroup.rotation.x) * blend;
  rig.torsoGroup.rotation.z += (targetTorsoRotZ - rig.torsoGroup.rotation.z) * blend;
  if (rig.leftHip) rig.leftHip.rotation.x += (targetLeftHipX - rig.leftHip.rotation.x) * blend;
  if (rig.rightHip) rig.rightHip.rotation.x += (targetRightHipX - rig.rightHip.rotation.x) * blend;
  if (rig.leftKnee) rig.leftKnee.rotation.x += (targetLeftKneeX - rig.leftKnee.rotation.x) * blend;
  if (rig.rightKnee) rig.rightKnee.rotation.x += (targetRightKneeX - rig.rightKnee.rotation.x) * blend;

  if (act === 'sleeping') {
    const breatheScale = 1 + Math.sin(lt * 2.2) * 0.025;
    rig.bodyPivot.scale.set(1, breatheScale, 1);
  } else if (isComedyMascot && isSpeaking) {
    const sy = 1 + Math.max(0, rig.bodyPivot.position.y) * 0.85;
    const sx = 1 - Math.max(0, rig.bodyPivot.position.y) * 0.35;
    rig.bodyPivot.scale.set(sx, sy, sx);
  } else if (rig.role === 'ChildDevotee' && rig.hasFloorAura !== false) {
    rig.bodyPivot.scale.setScalar(0.86);
  } else {
    rig.bodyPivot.scale.setScalar(1);
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

  // Expressive bulging googly eye pop on surprised / angry / confused / waking up / shocked!
  const isWideShock = emotion === 'surprised' || act === 'shockedFall' || (act === 'wakingUp' && turnLocal > 0.25);
  const eyePop = isWideShock ? 1.38 : emotion === 'angry' ? 1.18 : 1.0;
  rig.leftSclera.scale.set(eyePop, eyePop * 1.05, 0.6 * eyePop);
  rig.rightSclera.scale.set(eyePop, eyePop * 1.05, 0.6 * eyePop);
  const pupilDartX = (emotion === 'confused' || act === 'slapForehead') ? Math.sin(lt * 9.0) * 0.016 : 0;
  const pupilScale = isWideShock ? 0.65 : 1.0;
  rig.leftPupil.scale.set(pupilScale, pupilScale, 0.65);
  rig.rightPupil.scale.set(pupilScale, pupilScale, 0.65);
  rig.leftPupil.rotation.y = pupilDartX * 8;
  rig.rightPupil.rotation.y = -pupilDartX * 8;

  // Head orientation per action & dialogue speech
  if (act === 'sleeping') {
    rig.headPivot.rotation.set(0.18, rig.facingSign * 0.28, 0.24);
  } else if (act === 'eating') {
    rig.headPivot.rotation.set(0.14 + Math.sin(lt * 5.4) * 0.12, 0, Math.sin(lt * 2.7) * 0.08);
  } else if (act === 'slapForehead') {
    rig.headPivot.rotation.set(0.18, rig.facingSign * -0.1, -0.22 + Math.sin(lt * 6.5) * 0.06);
  } else {
    const talkNod = isSpeaking ? Math.sin(lt * 5.2) * 0.085 : Math.sin(lt * 1.4) * 0.025;
    const sideTilt = emotion === 'confused' ? 0.16 : isSpeaking ? Math.sin(lt * 2.6) * 0.065 : 0;
    rig.headPivot.rotation.x = talkNod;
    rig.headPivot.rotation.z = sideTilt;
    rig.headPivot.rotation.y = act === 'walking' || act === 'running'
      ? Math.sin(lt * 3.0) * 0.08
      : rig.facingSign * (isSpeaking ? -0.14 : 0.1);
  }

  // Eyeblinks & emotion/sleep eyelids
  const blinkPhase = (lt * 0.28) % 1;
  const blinking = blinkPhase > 0.955;
  let lidClose = -Math.PI * 0.48;
  if (act === 'sleeping' || act === 'praying') lidClose = 0.26;
  else if (act === 'wakingUp' && turnLocal < 0.2) lidClose = 0.24;
  else if (blinking) lidClose = 0.15;
  else if (emotion === 'laughing') lidClose = 0.04;
  else if (emotion === 'sad') lidClose = -Math.PI * 0.28;
  else if (isWideShock) lidClose = -Math.PI * 0.64;
  rig.leftEyelid.rotation.x = lidClose;
  rig.rightEyelid.rotation.x = lidClose;

  // Expressive eyebrows per emotion
  const baseBrowY = 0.085;
  let lift = isSpeaking ? 0.012 : 0;
  let browTilt = 0;
  if (isWideShock) {
    lift = 0.042;
    browTilt = -0.06;
  } else if (emotion === 'angry') {
    lift = -0.016;
    browTilt = 0.34;
  } else if (emotion === 'sad' || act === 'slapForehead') {
    lift = 0.012;
    browTilt = -0.26;
  } else if (emotion === 'laughing' || emotion === 'happy') {
    lift = 0.028;
    browTilt = 0;
  }
  rig.leftBrow.position.y = baseBrowY + lift;
  rig.rightBrow.position.y = baseBrowY + lift;
  rig.leftBrow.rotation.z = Math.PI / 2 - browTilt;
  rig.rightBrow.rotation.z = Math.PI / 2 + browTilt;

  // Lip-sync driven strictly by real audio envelope so mouth only articulates when voice audio is active
  const activeSpeech = isSpeaking && speechLevel > 0.028;
  const openAmt = activeSpeech ? Math.min(1, speechLevel * 1.45) : 0;
  const vowelWave = 0.5 + 0.5 * Math.sin(t * 24.0 + rig.seedOffset);
  let mouthOpen = activeSpeech ? 0.12 + openAmt * (0.68 + 0.32 * vowelWave) : 0.02;
  if (act === 'sleeping' && !activeSpeech) {
    mouthOpen = 0.04 + 0.14 * Math.max(0, Math.sin(lt * 2.1));
  } else if (act === 'eating' && !activeSpeech) {
    mouthOpen = 0.08 + 0.32 * Math.max(0, Math.sin(lt * 5.2));
  } else if (isWideShock && !isSpeaking && turnLocal < 0.42) {
    mouthOpen = 0.58;
  }
  const mouthWide = activeSpeech ? 0.88 + 0.34 * (1 - vowelWave) : (emotion === 'happy' || emotion === 'laughing' ? 1.24 : 0.96);

  rig.mouthCavity.scale.set(1.12 * mouthWide, mouthOpen, 0.55);
  rig.upperLip.position.y = rig.mouthBaseY + mouthOpen * 0.024;
  rig.lowerLip.position.y = rig.mouthBaseY - mouthOpen * 0.048;

  // Expressive two-arm skeletal animation per action
  if (act === 'sleeping') {
    rig.leftShoulder.rotation.set(-0.2, 0, 0.25);
    rig.leftElbow.rotation.set(-0.6, 0, -0.35);
    rig.rightShoulder.rotation.set(-0.2, 0, -0.25);
    rig.rightElbow.rotation.set(-0.6, 0, 0.35);
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
  } else if (act === 'dancing' || act === 'jumping') {
    const groove = Math.sin(lt * 8.5) * 0.48;
    rig.leftShoulder.rotation.set(-1.4 + groove, 0.2, 0.48);
    rig.leftElbow.rotation.set(-0.6, 0, 0.2);
    rig.rightShoulder.rotation.set(-1.4 - groove, -0.2, -0.48);
    rig.rightElbow.rotation.set(-0.6, 0, -0.2);
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
    rig.haloGroup.rotation.z = t * 0.45;
    rig.haloMaterial.opacity = rig.role === 'Divine' ? 0.72 : isSpeaking ? 0.42 : 0.18;
  }
  if (rig.pedestalGlow) {
    const pm = rig.pedestalGlow.material as THREE.MeshBasicMaterial;
    pm.opacity = isSpeaking ? 0.48 : 0.22;
  }
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
  if (rig.propPivot) {
    rig.propPivot.rotation.z = pose.rightElbowZ * 0.5;
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
