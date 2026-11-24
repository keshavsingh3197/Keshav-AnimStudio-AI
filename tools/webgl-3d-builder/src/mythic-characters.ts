import * as THREE from 'three';
import { CharacterRole, SceneSetting } from './types';

export type MythicArchetype =
  | 'narasimha'
  | 'asuraKing'
  | 'shiv'
  | 'krishna'
  | 'ram'
  | 'hanuman'
  | 'vishnu'
  | 'devi'
  | 'prahladChild'
  | 'rishi'
  | 'genericSacred';

export interface MythicPaletteOverride {
  skin: number;
  robe: number;
  sash: number;
  scale: number;
}

export interface MythicRigAttachments {
  chakraWheel?: THREE.Group;
  lowerJawPivot?: THREE.Group;
  pattaEnds: THREE.Object3D[];
}

export function detectMythicArchetype(
  role: CharacterRole,
  name: string,
  setting: SceneSetting,
  isModernComedy: boolean,
): MythicArchetype | null {
  if (isModernComedy) return null;
  if (role === 'BrainrotLog' || role === 'CupDancer' || role === 'CartoonTank' || role === 'ComicBobble') {
    return null;
  }

  const lower = (name || '').toLowerCase();
  if (/narasimha|narsimha|narsingh|नरसिंह|नृसिंह/.test(lower)) return 'narasimha';
  if (/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/.test(lower)) {
    return 'asuraKing';
  }
  if (/hanuman|maruti|bajrang|pavanputra|हनुमान|मारुति|बजरंग/.test(lower)) return 'hanuman';
  if (/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/.test(lower)) return 'shiv';
  if (/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/.test(lower)) return 'krishna';
  if (/ram|raghav|raghunath|राम|राघव/.test(lower)) return 'ram';
  if (/vishnu|hari|narayan|vasudev|विष्णु|हरि|नारायण|वासुदेव/.test(lower)) return 'vishnu';
  if (role === 'NobleWoman') return 'devi';
  if (role === 'ChildDevotee') return 'prahladChild';
  if (role === 'SageRishi') return 'rishi';
  if (setting === 'Temple' || setting === 'ForestAshram' || setting === 'RiverGhat' || setting === 'Himalaya' || setting === 'PalaceCourt' || setting === 'Cosmos') {
    return role === 'KingCrown' || role === 'Divine' || role === 'Warrior' ? 'genericSacred' : null;
  }
  return null;
}

export function getMythicPaletteOverride(archetype: MythicArchetype | null, base: { robe: number; sash: number; skin: number }): MythicPaletteOverride {
  switch (archetype) {
    case 'narasimha':
      return { skin: 0xd99e5b, robe: 0xd97706, sash: 0xb91c1c, scale: 1.18 };
    case 'asuraKing':
      return { skin: 0x874e34, robe: 0x7f1d1d, sash: 0xf59e0b, scale: 1.07 };
    case 'hanuman':
      return { skin: 0xe07b3c, robe: 0xea580c, sash: 0xfacc15, scale: 1.08 };
    case 'shiv':
      return { skin: 0xcbd5e1, robe: 0x92400e, sash: 0xf97316, scale: 1.10 };
    case 'krishna':
      return { skin: 0x5b8ef2, robe: 0xeab308, sash: 0xdc2626, scale: 1.04 };
    case 'ram':
      return { skin: 0x7da4e8, robe: 0xd97706, sash: 0xb91c1c, scale: 1.05 };
    case 'vishnu':
      return { skin: 0x6794eb, robe: 0xf59e0b, sash: 0xdc2626, scale: 1.12 };
    case 'prahladChild':
      return { skin: 0xe8b288, robe: 0xea580c, sash: 0xfbbf24, scale: 0.78 };
    case 'rishi':
      return { skin: base.skin, robe: 0xc25412, sash: 0xfde082, scale: 0.98 };
    default:
      return { skin: base.skin, robe: base.robe, sash: base.sash, scale: 1.0 };
  }
}

export interface NarasimhaFaceHandles {
  leftEye: { sclera: THREE.Mesh; pupil: THREE.Mesh; eyelid: THREE.Mesh; brow: THREE.Mesh };
  rightEye: { sclera: THREE.Mesh; pupil: THREE.Mesh; eyelid: THREE.Mesh; brow: THREE.Mesh };
  mouthCavity: THREE.Mesh;
  upperLip: THREE.Mesh;
  lowerLip: THREE.Mesh;
  mouthBaseY: number;
  lowerJawPivot: THREE.Group;
}

/**
 * Builds Bhagwan Narasimha's half-lion half-human head (broad lion snout, hinged roaring jaw
 * with 4 curved fangs, fiery copper-to-gold Keshara mane, glowing amber eyes, Vaishnava Urdhva
 * Pundra tilak, and ornate gold Kiritamukut seated directly within the lion mane).
 */
export function attachNarasimhaLionHead(headPivot: THREE.Group, headR: number, skinHex: number): NarasimhaFaceHandles {
  const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.44, metalness: 0.04 });
  const snoutMat = new THREE.MeshStandardMaterial({ color: 0xe6b57c, roughness: 0.48 });
  const nosePadMat = new THREE.MeshStandardMaterial({ color: 0x5b2121, roughness: 0.35 });
  const maneInnerMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.62 });
  const maneMidMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x78350f, emissiveIntensity: 0.18, roughness: 0.52 });
  const maneTipMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.25, roughness: 0.42 });
  const fangMat = new THREE.MeshStandardMaterial({ color: 0xfffdf5, roughness: 0.18, metalness: 0.05 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf7be38, metalness: 0.88, roughness: 0.20 });

  // Cranial ridge & broad lion cheek bones
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.04, 24, 18), skinMat);
  cranium.scale.set(1.06, 1.04, 1.04);
  cranium.castShadow = true;
  headPivot.add(cranium);

  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.42, 12, 10), snoutMat);
    cheek.scale.set(1.05, 0.82, 0.95);
    cheek.position.set(s * headR * 0.54, -headR * 0.12, headR * 0.68);
    headPivot.add(cheek);

    // Pointed feline lion ears emerging through mane
    const ear = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.24, headR * 0.44, 8), skinMat);
    ear.position.set(s * headR * 0.88, headR * 0.72, -headR * 0.04);
    ear.rotation.z = -s * 0.48;
    ear.rotation.x = 0.12;
    headPivot.add(ear);
  }

  // Broad lion snout bridge & protruding whisker muzzle
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.52, headR * 0.54, headR * 0.62), snoutMat);
  bridge.position.set(0, -headR * 0.04, headR * 0.86);
  bridge.rotation.x = 0.22;
  headPivot.add(bridge);

  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.27, 14, 10), snoutMat);
    pad.scale.set(1.10, 0.78, 1.15);
    pad.position.set(s * headR * 0.24, -headR * 0.25, headR * 1.08);
    headPivot.add(pad);

    // Sculpted feline whiskers (3 per cheek)
    for (let w = 0; w < 3; w++) {
      const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0015, headR * 0.65, 4), fangMat);
      whisker.rotation.z = s * (Math.PI * 0.44 + (w - 1) * 0.16);
      whisker.rotation.y = s * -0.22;
      whisker.position.set(s * headR * 0.58, -headR * (0.20 + w * 0.06), headR * 1.12);
      headPivot.add(whisker);
    }
  }

  // Triangular feline nose pad
  const nosePad = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.22, headR * 0.24, 4), nosePadMat);
  nosePad.rotation.x = Math.PI * 0.52;
  nosePad.rotation.z = Math.PI * 0.25;
  nosePad.position.set(0, -headR * 0.11, headR * 1.26);
  headPivot.add(nosePad);

  // Hinged Roaring Jaw + Crimson Mouth + 4 Curved White Ivory Fangs
  const mouthBaseY = -headR * 0.46;
  const mouthCavity = new THREE.Mesh(
    new THREE.SphereGeometry(headR * 0.34, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0x6b0f1a }),
  );
  mouthCavity.scale.set(1.05, 0.48, 0.85);
  mouthCavity.position.set(0, mouthBaseY + headR * 0.04, headR * 0.96);
  headPivot.add(mouthCavity);

  const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.052, headR * 0.42, 4, 8), snoutMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, mouthBaseY + headR * 0.14, headR * 1.16);
  headPivot.add(upperLip);

  const lowerJawPivot = new THREE.Group();
  lowerJawPivot.position.set(0, mouthBaseY + headR * 0.02, headR * 0.72);
  headPivot.add(lowerJawPivot);

  const chinJaw = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.32, 14, 10), snoutMat);
  chinJaw.scale.set(1.06, 0.65, 1.18);
  chinJaw.position.set(0, -headR * 0.14, headR * 0.34);
  lowerJawPivot.add(chinJaw);

  const lowerLip = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.052, headR * 0.38, 4, 8), snoutMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -headR * 0.04, headR * 0.46);
  lowerJawPivot.add(lowerLip);

  // Upper & lower curved sharp ivory canine fangs
  for (const s of [-1, 1]) {
    const upperFang = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.068, headR * 0.30, 8), fangMat);
    upperFang.rotation.x = Math.PI;
    upperFang.position.set(s * headR * 0.24, mouthBaseY + headR * 0.02, headR * 1.22);
    headPivot.add(upperFang);

    const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.056, headR * 0.24, 8), fangMat);
    lowerFang.position.set(s * headR * 0.20, headR * 0.02, headR * 0.48);
    lowerJawPivot.add(lowerFang);
  }

  // Molten Glowing Amber-Gold Eyes & Fierce Furrowed Brows
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.72, roughness: 0.15 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x1a0502, emissive: 0x7c1d10, emissiveIntensity: 0.25, roughness: 0.10 });
  const lidMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.46 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.55 });

  const buildLionEye = (side: -1 | 1) => {
    const eyeX = side * headR * 0.40;
    const eyeY = headR * 0.14;
    const eyeZ = headR * 0.92;
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.175, 14, 12), whiteMat);
    sclera.scale.set(1.05, 0.92, 0.65);
    sclera.position.set(eyeX, eyeY, eyeZ);
    headPivot.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.095, 12, 10), irisMat);
    pupil.scale.set(0.68, 1.15, 0.7);
    pupil.position.set(eyeX, eyeY, eyeZ + headR * 0.125);
    headPivot.add(pupil);

    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.185, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      lidMat,
    );
    eyelid.scale.set(1.05, 0.95, 0.68);
    eyelid.position.set(eyeX, eyeY, eyeZ);
    eyelid.rotation.x = -Math.PI * 0.56;
    headPivot.add(eyelid);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.060, headR * 0.28, 5, 8), browMat);
    brow.rotation.z = Math.PI / 2 - side * 0.38;
    brow.position.set(eyeX, eyeY + headR * 0.24, eyeZ + headR * 0.10);
    headPivot.add(brow);
    return { sclera, pupil, eyelid, brow };
  };
  const leftEye = buildLionEye(-1);
  const rightEye = buildLionEye(1);

  // Tall Radiant Vaishnava Urdhva Pundra Tilak (white-gold twin prongs + central crimson Shrichurna)
  const tilakMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xfde68a, emissiveIntensity: 0.45 });
  const shrichurnaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.35 });
  for (const s of [-1, 1]) {
    const prong = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.055, headR * 0.44, headR * 0.05), tilakMat);
    prong.position.set(s * headR * 0.095, headR * 0.48, headR * 0.96);
    prong.rotation.z = -s * 0.10;
    headPivot.add(prong);
  }
  const tilakBase = new THREE.Mesh(new THREE.BoxGeometry(headR * 0.22, headR * 0.07, headR * 0.05), tilakMat);
  tilakBase.position.set(0, headR * 0.27, headR * 0.98);
  headPivot.add(tilakBase);
  const shrichurna = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.032, headR * 0.32, 4, 8), shrichurnaMat);
  shrichurna.position.set(0, headR * 0.48, headR * 0.99);
  headPivot.add(shrichurna);

  // Dense Fiery Radial Lion Mane (Keshara) — 2 layered concentric tuft rings + collar cape
  const maneGroup = new THREE.Group();
  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 16 : 14;
    const rad = headR * (ring === 0 ? 1.18 : 1.02);
    const zPos = ring === 0 ? -headR * 0.08 : -headR * 0.34;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      // Leave lower center slightly narrower so roaring jaws stay 100% framed
      if (Math.sin(a) < -0.78 && Math.abs(Math.cos(a)) < 0.38 && ring === 0) continue;
      const mat = (i + ring) % 3 === 0 ? maneTipMat : (i % 2 === 0 ? maneMidMat : maneInnerMat);
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(headR * (ring === 0 ? 0.32 : 0.36), headR * (ring === 0 ? 0.88 : 1.04), 7), mat);
      tuft.position.set(Math.cos(a) * rad, Math.sin(a) * rad * 1.04, zPos);
      tuft.rotation.z = a - Math.PI / 2;
      tuft.rotation.x = ring === 0 ? -0.18 : -0.35;
      tuft.castShadow = true;
      maneGroup.add(tuft);
    }
  }
  const backMane = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.16, 16, 12), maneInnerMat);
  backMane.scale.set(1.22, 1.26, 0.82);
  backMane.position.set(0, -headR * 0.12, -headR * 0.48);
  maneGroup.add(backMane);
  headPivot.add(maneGroup);

  // Ornate Gold Kiritamukut nested INSIDE top of lion mane (never floating!)
  attachScallopedMukutCrown(headPivot, headR * 0.96, goldMat, 'narasimha');

  return {
    leftEye,
    rightEye,
    mouthCavity,
    upperLip,
    lowerLip,
    mouthBaseY,
    lowerJawPivot,
  };
}

/**
 * Builds ornate tiered Indian Kiritamukut crown (scalloped filigree collar, ruby/emerald gems,
 * tapered fluted spire, optional peacock feather crest for Krishna, or Asura horns for Hiranyakashipu).
 */
export function attachScallopedMukutCrown(
  headPivot: THREE.Group,
  headR: number,
  goldMat: THREE.MeshStandardMaterial,
  variant: 'narasimha' | 'vishnu' | 'krishna' | 'ram' | 'asuraKing' | 'sacred',
): void {
  const crownGroup = new THREE.Group();
  crownGroup.position.y = variant === 'narasimha' ? headR * 0.84 : headR * 0.86;

  const isAsura = variant === 'asuraKing';
  const bandMat = isAsura
    ? new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.88, roughness: 0.24 })
    : goldMat;

  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.78, headR * 0.86, headR * 0.30, 20), bandMat);
  baseRing.castShadow = true;
  crownGroup.add(baseRing);

  // Scalloped lotus arch crest around forehead
  const crestCount = isAsura ? 7 : 5;
  for (let c = 0; c < crestCount; c++) {
    const ang = ((c - (crestCount - 1) / 2) / crestCount) * Math.PI * 0.85;
    const h = isAsura ? headR * (0.45 + (c % 2) * 0.22) : headR * (0.42 - Math.abs(c - 2) * 0.08);
    const petal = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.13, h, 8), goldMat);
    petal.position.set(Math.sin(ang) * headR * 0.76, headR * 0.22, Math.cos(ang) * headR * 0.76);
    petal.rotation.z = -Math.sin(ang) * (isAsura ? 0.42 : 0.16);
    crownGroup.add(petal);
  }

  if (isAsura) {
    // Flared curved Asura horns on sides of demon crown
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.18 });
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.16, headR * 0.92, 10), hornMat);
      horn.position.set(s * headR * 0.88, headR * 0.48, 0);
      horn.rotation.z = -s * 0.62;
      horn.rotation.x = -0.18;
      crownGroup.add(horn);
    }
  }

  // Carved Kiritamukut tiered spire + Kalash pinnacle
  const midTier = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.46, headR * 0.68, headR * 0.34, 16), bandMat);
  midTier.position.y = headR * 0.30;
  crownGroup.add(midTier);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.42, headR * 0.56, 16), goldMat);
  spire.position.y = headR * 0.70;
  crownGroup.add(spire);

  const kalashTip = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.11, 10, 8), goldMat);
  kalashTip.position.y = headR * 1.00;
  crownGroup.add(kalashTip);

  // Central gemstone inlay (Ruby/Emerald/Cyan-Sapphire)
  const gemColor = isAsura ? 0xdc2626 : variant === 'narasimha' ? 0xf59e0b : variant === 'krishna' ? 0x10b981 : 0x22d3ee;
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(headR * 0.16, 0),
    new THREE.MeshStandardMaterial({ color: gemColor, emissive: gemColor, emissiveIntensity: 0.65, metalness: 0.25, roughness: 0.1 }),
  );
  gem.position.set(0, headR * 0.06, headR * 0.84);
  crownGroup.add(gem);

  if (variant === 'krishna') {
    // Iconic Peacock Feather (Morpankh) tucked at slight angle in crown
    const featherStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, headR * 1.1, 6), goldMat);
    featherStem.position.set(headR * 0.28, headR * 0.85, headR * 0.12);
    featherStem.rotation.z = -0.35;
    crownGroup.add(featherStem);
    const featherEye = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.20, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x0ea5e9, emissiveIntensity: 0.45 }),
    );
    featherEye.scale.set(0.85, 1.3, 0.35);
    featherEye.position.set(headR * 0.46, headR * 1.32, headR * 0.14);
    featherEye.rotation.z = -0.35;
    crownGroup.add(featherEye);
  }

  headPivot.add(crownGroup);
}

/** Adds Asura Emperor (Hiranyakashipu / Ravan) tusks, curled handlebar moustache, red tilak, and gold shoulder pauldrons. */
export function attachAsuraKingDetails(
  headPivot: THREE.Group,
  torsoGroup: THREE.Group,
  headR: number,
  goldMat: THREE.MeshStandardMaterial,
): void {
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x14111a, roughness: 0.68 });
  const tuskMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.22 });
  const armorMat = new THREE.MeshStandardMaterial({ color: 0x451a1d, metalness: 0.65, roughness: 0.32 });

  // Pointed demonic ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.14, headR * 0.36, 8), armorMat);
    ear.position.set(s * headR * 1.02, headR * 0.04, 0);
    ear.rotation.z = -s * 0.95;
    headPivot.add(ear);
  }

  // Thick upturned black handlebar moustache & side-tusks
  for (const s of [-1, 1]) {
    const stache = new THREE.Mesh(new THREE.CapsuleGeometry(headR * 0.055, headR * 0.26, 4, 8), hairMat);
    stache.rotation.z = Math.PI * 0.5 + s * 0.38;
    stache.position.set(s * headR * 0.19, -headR * 0.20, headR * 0.94);
    headPivot.add(stache);

    const tusk = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.045, headR * 0.19, 8), tuskMat);
    tusk.position.set(s * headR * 0.24, -headR * 0.29, headR * 0.92);
    tusk.rotation.z = -s * 0.22;
    headPivot.add(tusk);
  }

  const chinBeard = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.28, headR * 0.54, 10), hairMat);
  chinBeard.rotation.x = Math.PI;
  chinBeard.position.set(0, -headR * 0.72, headR * 0.58);
  headPivot.add(chinBeard);

  const tilak = new THREE.Mesh(
    new THREE.BoxGeometry(headR * 0.42, headR * 0.075, headR * 0.04),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.4 }),
  );
  tilak.position.set(0, headR * 0.26, headR * 0.95);
  headPivot.add(tilak);

  // Heavy embossed shoulder pauldrons (Skandha-Kavacha) & golden chest armor plate
  for (const s of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), goldMat);
    pauldron.scale.set(1.15, 0.82, 1.05);
    pauldron.position.set(s * 0.26, 0.57, 0.02);
    pauldron.rotation.z = -s * 0.32;
    torsoGroup.add(pauldron);
  }
  const chestPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.225, 0.34, 16), armorMat);
  chestPlate.position.set(0, 0.40, 0.015);
  torsoGroup.add(chestPlate);
}

/**
 * Adds authentic silk Dhoti wrap + central front pleated Patka + flowing Angavastram Patta scarf +
 * Haram/Vanamala garlands + Bajuband & wrist Kankana (and Narasimha's 4-arm Chakra/Shankha + claws).
 */
export function attachSacredPattaAndDhoti(
  bodyPivot: THREE.Group,
  torsoGroup: THREE.Group,
  leftHip: THREE.Group | undefined,
  rightHip: THREE.Group | undefined,
  leftElbow: THREE.Group,
  rightElbow: THREE.Group,
  archetype: MythicArchetype | null,
  robeHex: number,
  sashHex: number,
  goldMat: THREE.MeshStandardMaterial,
  standing: boolean,
): MythicRigAttachments {
  const attachments: MythicRigAttachments = { pattaEnds: [] };
  if (!archetype) return attachments;

  const pattaColor = archetype === 'narasimha' ? 0xb91c1c : archetype === 'prahladChild' ? 0xfbbf24 : sashHex;
  const dhotiColor = archetype === 'narasimha' || archetype === 'vishnu' || archetype === 'krishna' ? 0xf59e0b : robeHex;
  const pattaMat = new THREE.MeshStandardMaterial({ color: pattaColor, roughness: 0.46, metalness: 0.14, side: THREE.DoubleSide });
  const dhotiMat = new THREE.MeshStandardMaterial({ color: dhotiColor, roughness: 0.50, metalness: 0.12 });

  // Flowing pleated Dhoti thigh wraps + central front Zari Patka panel (grounded mythological attire!)
  if (standing && leftHip && rightHip) {
    for (const hip of [leftHip, rightHip]) {
      const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.114, 0.28, 14), dhotiMat);
      wrap.position.y = -0.14;
      wrap.castShadow = true;
      hip.add(wrap);
      const zariHem = new THREE.Mesh(new THREE.TorusGeometry(0.114, 0.015, 6, 16), goldMat);
      zariHem.rotation.x = Math.PI / 2;
      zariHem.position.y = -0.27;
      hip.add(zariHem);
    }

    const patkaFan = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.135, 0.42, 12, 1, false, -Math.PI * 0.35, Math.PI * 0.70), dhotiMat);
    patkaFan.position.set(0, 0.02, 0.16);
    torsoGroup.add(patkaFan);

    const patkaBorder = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.42, 0.02), goldMat);
    patkaBorder.position.set(0, 0.02, 0.21);
    torsoGroup.add(patkaBorder);
  }

  // Flowing Angavastram Patta scarf arching around shoulders and billowing down both flanks
  const pattaArc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 0.05, 0.18),
    new THREE.Vector3(-0.25, 0.48, 0.08),
    new THREE.Vector3(0, 0.62, -0.18),
    new THREE.Vector3(0.25, 0.48, 0.08),
    new THREE.Vector3(0.28, 0.05, 0.18),
  ]);
  const pattaMesh = new THREE.Mesh(new THREE.TubeGeometry(pattaArc, 24, 0.036, 8, false), pattaMat);
  pattaMesh.castShadow = true;
  torsoGroup.add(pattaMesh);

  for (const s of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.015), pattaMat);
    tail.position.set(s * 0.26, 0.16, 0.15);
    tail.rotation.z = s * 0.12;
    const goldEnd = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.045, 0.018), goldMat);
    goldEnd.position.y = -0.16;
    tail.add(goldEnd);
    torsoGroup.add(tail);
    attachments.pattaEnds.push(tail);
  }

  // Central ruby Kamarbandh clasp + Haram Kaustubha necklace + Bajuband armlets
  const beltClasp = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.45 }),
  );
  beltClasp.scale.set(1.2, 1.0, 0.55);
  beltClasp.position.set(0, 0.24, 0.235);
  torsoGroup.add(beltClasp);

  const chestHaram = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.019, 8, 22), goldMat);
  chestHaram.rotation.x = Math.PI / 2 + 0.38;
  chestHaram.position.set(0, 0.46, 0.08);
  torsoGroup.add(chestHaram);

  for (const elbow of [leftElbow, rightElbow]) {
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 8, 16), goldMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.18;
    elbow.add(cuff);
  }

  // Kaustubha Mani jewel on Lord Vishnu's chest
  if (archetype === 'vishnu' || archetype === 'narasimha') {
    const kaustubha = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.056, 0),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x9f1239, emissiveIntensity: 0.65, metalness: 0.35, roughness: 0.14 }),
    );
    kaustubha.scale.set(1.0, 1.25, 0.55);
    kaustubha.position.set(0, 0.44, 0.255);
    torsoGroup.add(kaustubha);
  }

  // Shiva's sacred iconography: Neelkanth blue throat glow, Vasuki Naga serpent collar, Rudraksha mala & Vyaghra-Charma spots
  if (archetype === 'shiv') {
    const neelkanthGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.098, 0.022, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.72, roughness: 0.28 }),
    );
    neelkanthGlow.rotation.x = Math.PI / 2 + 0.15;
    neelkanthGlow.position.set(0, 0.64, 0.02);
    torsoGroup.add(neelkanthGlow);

    const snakeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.35, roughness: 0.32 });
    const vasukiBody = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.026, 8, 22, Math.PI * 1.48), snakeMat);
    vasukiBody.rotation.x = Math.PI / 2 + 0.22;
    vasukiBody.rotation.z = -0.35;
    vasukiBody.position.set(0, 0.59, 0.02);
    torsoGroup.add(vasukiBody);

    const nagaHood = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), snakeMat);
    nagaHood.scale.set(0.95, 1.35, 0.55);
    nagaHood.position.set(0.165, 0.68, 0.08);
    torsoGroup.add(nagaHood);
    for (const sx of [-0.016, 0.016]) {
      const eyeDot = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), goldMat);
      eyeDot.position.set(0.165 + sx, 0.695, 0.11);
      torsoGroup.add(eyeDot);
    }

    const rudrakshaMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.62 });
    for (let r = 0; r < 14; r++) {
      const a = (r / 14) * Math.PI * 2;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), rudrakshaMat);
      bead.position.set(Math.sin(a) * 0.155, 0.50 - Math.cos(a) * 0.06, Math.cos(a) * 0.18);
      torsoGroup.add(bead);
    }
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x291d14, roughness: 0.78 });
    for (const [px, py, pz] of [[-0.14, 0.14, 0.22], [0.12, 0.10, 0.23], [-0.04, 0.02, 0.24], [0.16, -0.02, 0.18]] as const) {
      const patch = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), patchMat);
      patch.scale.set(1.2, 0.7, 0.35);
      patch.position.set(px, py, pz);
      torsoGroup.add(patch);
    }
  }

  // Long Flower Vanamala Garland for Vishnu avatars (Narasimha, Krishna, Ram, Vishnu, Hanuman)
  if (archetype === 'narasimha' || archetype === 'vishnu' || archetype === 'krishna' || archetype === 'ram' || archetype === 'hanuman') {
    const malaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.58, 0.11),
      new THREE.Vector3(-0.22, 0.22, 0.24),
      new THREE.Vector3(0, -0.02, 0.27),
      new THREE.Vector3(0.22, 0.22, 0.24),
      new THREE.Vector3(0.18, 0.58, 0.11),
    ]);
    const pts = malaCurve.getPoints(18);
    const jasmineMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.55 });
    const hibiscusMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.45 });
    pts.forEach((pt, idx) => {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(idx % 3 === 0 ? 0.038 : 0.026, 8, 6), idx % 3 === 0 ? hibiscusMat : jasmineMat);
      bead.position.copy(pt);
      torsoGroup.add(bead);
    });
  }

  // 4-Arm Chaturbhuja (Sudarshana Chakra + Panchajanya Shankha) for Lord Vishnu & Narasimha Avatar
  if (archetype === 'narasimha' || archetype === 'vishnu') {
    const skinArmColor = archetype === 'vishnu' ? 0x6794eb : 0xd99e5b;
    const skinArmMat = new THREE.MeshStandardMaterial({ color: skinArmColor, roughness: 0.44 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0xfffdf5, emissive: 0xfef3c7, emissiveIntensity: 0.2, metalness: 0.25, roughness: 0.2 });

    // Sharp lion claws protruding from Narasimha primary hands
    if (archetype === 'narasimha') {
      for (const elbow of [leftElbow, rightElbow]) {
        for (let c = -2; c <= 2; c++) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.095, 6), clawMat);
          claw.position.set(c * 0.022, -0.31, 0.035);
          claw.rotation.x = Math.PI + 0.35;
          elbow.add(claw);
        }
      }
    }

    // Upper left & right divine arms carrying Shankha and spinning Sudarshana Chakra
    for (const s of [-1, 1]) {
      const armPivot = new THREE.Group();
      armPivot.position.set(s * 0.27, 0.54, -0.10);
      armPivot.rotation.set(-0.22, 0, -s * 0.48);
      torsoGroup.add(armPivot);

      const armSeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.28, 6, 8), skinArmMat);
      armSeg.position.y = 0.22;
      armPivot.add(armSeg);

      const handMount = new THREE.Group();
      handMount.position.set(0, 0.44, 0.02);
      armPivot.add(handMount);

      if (s === 1) {
        // Spinning glowing Sudarshana Chakra (right upper hand)
        const chakraGroup = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.72,
          metalness: 0.85,
          roughness: 0.15,
        }));
        chakraGroup.add(ring);
        for (let t = 0; t < 12; t++) {
          const a = (t / 12) * Math.PI * 2;
          const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.07, 4), goldMat);
          tooth.position.set(Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0);
          tooth.rotation.z = a - Math.PI / 2;
          chakraGroup.add(tooth);
        }
        handMount.add(chakraGroup);
        attachments.chakraWheel = chakraGroup;
      } else {
        // Sacred Panchajanya Shankha conch shell (left upper hand)
        const shankha = new THREE.Group();
        const conchMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, emissive: 0xfef3c7, emissiveIntensity: 0.18, roughness: 0.28 });
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.26, 14), conchMat);
        body.rotation.x = 0.35;
        shankha.add(body);
        const lipRing = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.015, 6, 14), goldMat);
        lipRing.rotation.x = Math.PI / 2;
        shankha.add(lipRing);
        handMount.add(shankha);
      }
    }
  }

  // Optional unused bodyPivot ref guard so signatures match nicely
  void bodyPivot;
  return attachments;
}
