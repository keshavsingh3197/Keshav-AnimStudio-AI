import * as THREE from 'three';
import { ComedyHazardMode } from './types';

export interface ComedyGagRig {
  funeralGroup: THREE.Group;
  shroudMesh: THREE.Group;
  shroudGarland: THREE.Group;
  bubbleGroup: THREE.Group;
  hazards: Record<Exclude<ComedyHazardMode, 'none'>, THREE.Group>;
  wireSparks: THREE.Object3D[];
  truckGroup?: THREE.Group;
  rickshawGroup?: THREE.Group;
  snakeBody: THREE.Object3D[];
  snakeTongue?: THREE.Object3D;
  phoneGlowMat?: THREE.MeshBasicMaterial;
}

export function createComedyGagProps(parent: THREE.Group): ComedyGagRig {
  // 1. Living-Room Shok Sabha Horizontal Mourning Mat (gadda + left bolster pillow + full-coverage Kafan + marigold + incense)
  const funeralGroup = new THREE.Group();
  funeralGroup.visible = false;

  const whiteSheetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.78 });
  const creamPillowMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.72 });
  const marigoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.55 });
  const darkFlowerMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.58 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.75, roughness: 0.25 });

  // Soft white rectangular mourning Takht / Gadda oriented horizontally left-to-right at z = 0.25
  const matBase = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.12, 0.86), whiteSheetMat);
  matBase.position.set(0.08, 0.06, 0.25);
  matBase.receiveShadow = true;
  funeralGroup.add(matBase);

  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.62), creamPillowMat);
  pillow.position.set(-0.44, 0.18, 0.25);
  pillow.castShadow = true;
  funeralGroup.add(pillow);

  // Brass agarbatti incense stand & ember beside pillow
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.05, 12), brassMat);
  standBase.position.set(-0.68, 0.025, 0.56);
  funeralGroup.add(standBase);
  const incenseStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6),
    new THREE.MeshStandardMaterial({ color: 0x3f2e21 }),
  );
  incenseStick.position.set(-0.68, 0.15, 0.56);
  incenseStick.rotation.z = -0.15;
  funeralGroup.add(incenseStick);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  ember.position.set(-0.66, 0.265, 0.56);
  funeralGroup.add(ember);

  // Wide White Shroud Blanket ("Kafan") arching OVER chest + legs horizontally so legs stay wrapped inside white cloth!
  const shroudMesh = new THREE.Group();
  const bodyCover = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.27, 1.04, 18, 1, false, -Math.PI * 0.5, Math.PI),
    whiteSheetMat,
  );
  bodyCover.rotation.z = -Math.PI / 2;
  bodyCover.scale.set(0.92, 1.0, 1.15);
  bodyCover.position.set(0.24, 0.26, 0.25);
  bodyCover.castShadow = true;
  shroudMesh.add(bodyCover);

  // Clean folded hem skirt draping sides of the Kafan sheet flush to mat
  const hemStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.06, 0.24, 0.64),
    whiteSheetMat,
  );
  hemStrip.position.set(0.24, 0.22, 0.25);
  shroudMesh.add(hemStrip);

  // Fresh orange-yellow marigold garland draped cleanly over the top ridge of the Kafan dome
  const shroudGarland = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const frac = (i - 4) / 4;
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.044, 8, 6),
      i % 2 === 0 ? marigoldMat : darkFlowerMat,
    );
    flower.position.set(0.14 + Math.abs(frac) * 0.14, 0.54 - Math.abs(frac) * 0.10, 0.25 + frac * 0.22);
    shroudGarland.add(flower);
  }
  shroudMesh.add(shroudGarland);
  funeralGroup.add(shroudMesh);
  parent.add(funeralGroup);

  // 2. Luminous Floating 3D Hazard Flashback Vignette Pedestal (hovering cleanly above sofa/characters!)
  const bubbleGroup = new THREE.Group();
  bubbleGroup.position.set(0, 2.22, -1.16);
  bubbleGroup.visible = false;

  const haloDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 32),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.84 }),
  );
  haloDisc.position.z = -0.18;
  bubbleGroup.add(haloDisc);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.04, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  );
  outerRing.position.z = -0.16;
  bubbleGroup.add(outerRing);

  const createHazardGroup = () => {
    const g = new THREE.Group();
    g.visible = false;
    bubbleGroup.add(g);
    return g;
  };

  // --- Hazard 1: Exposed Stripped Live Electric Wire + Sparks ---
  const wireSpark = createHazardGroup();
  const wirePolesMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.5 });
  for (const px of [-0.36, 0.36]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.65, 8), wirePolesMat);
    pole.position.set(px, -0.05, 0);
    wireSpark.add(pole);
  }
  const blackCable = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 8, 20, Math.PI * 0.72),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 }),
  );
  blackCable.position.set(0, 0.25, 0);
  blackCable.rotation.z = Math.PI * 1.14;
  wireSpark.add(blackCable);
  const copperTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 }),
  );
  copperTip.rotation.z = Math.PI / 2;
  copperTip.position.set(0, -0.08, 0.04);
  wireSpark.add(copperTip);
  const wireSparks: THREE.Object3D[] = [];
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const boltMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (let s = 0; s < 6; s++) {
    const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.058, 0), s % 2 === 0 ? boltMat : sparkMat);
    wireSpark.add(sp);
    wireSparks.push(sp);
  }

  // --- Hazard 2: Highway Truck + Classic Green-Yellow Auto Rickshaw ---
  const truckRickshaw = createHazardGroup();
  const truckGroup = new THREE.Group();
  truckGroup.position.set(-0.22, -0.08, 0);
  const truckCab = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.32), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 }));
  truckCab.position.y = 0.08;
  truckGroup.add(truckCab);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.13, 0.34), new THREE.MeshBasicMaterial({ color: 0xbae6fd }));
  windshield.position.set(0, 0.15, 0.01);
  truckGroup.add(windshield);
  for (const hx of [-0.11, 0.11]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), boltMat);
    hl.position.set(hx, -0.02, 0.17);
    truckGroup.add(hl);
  }
  const truckCargo = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.40, 0.32), new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.55 }));
  truckCargo.position.set(-0.18, 0.12, -0.18);
  truckGroup.add(truckCargo);
  truckRickshaw.add(truckGroup);

  const rickshawGroup = new THREE.Group();
  rickshawGroup.position.set(0.28, -0.12, 0.14);
  const autoBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 }));
  rickshawGroup.add(autoBase);
  const autoCanopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.18, 4),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }),
  );
  autoCanopy.rotation.y = Math.PI / 4;
  autoCanopy.position.y = 0.16;
  rickshawGroup.add(autoCanopy);
  truckRickshaw.add(rickshawGroup);

  // --- Hazard 3: Rooftop Sintex Water Tank + Metal Ladder ---
  const waterTank = createHazardGroup();
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const tankCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 18), tankMat);
  tankCylinder.position.set(0.06, 0.04, 0);
  waterTank.add(tankCylinder);
  for (const ry of [-0.08, 0.04, 0.16]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.014, 8, 20), tankMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.set(0.06, ry, 0);
    waterTank.add(rib);
  }
  const tankLid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  tankLid.position.set(0.06, 0.30, 0);
  waterTank.add(tankLid);
  const splashPool = new THREE.Mesh(
    new THREE.CircleGeometry(0.40, 20),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 }),
  );
  splashPool.rotation.x = -Math.PI / 2;
  splashPool.position.set(0, -0.24, 0);
  waterTank.add(splashPool);
  for (const lx of [-0.30, -0.18]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.56, 8), wirePolesMat);
    rail.position.set(lx, -0.02, 0.08);
    rail.rotation.z = -0.24;
    waterTank.add(rail);
  }

  // --- Hazard 4: Huge Open Road Gadda / Pit + Warning Cones ---
  const roadPit = createHazardGroup();
  const roadSlab = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.06, 20),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }),
  );
  roadSlab.position.set(0, -0.22, 0);
  roadPit.add(roadSlab);
  const pitHole = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 20),
    new THREE.MeshBasicMaterial({ color: 0x020617 }),
  );
  pitHole.rotation.x = -Math.PI / 2;
  pitHole.position.set(0, -0.185, 0);
  roadPit.add(pitHole);
  for (const cx of [-0.32, 0.32]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 12), darkFlowerMat);
    cone.position.set(cx, -0.06, 0.12);
    roadPit.add(cone);
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stripe.rotation.x = Math.PI / 2;
    stripe.position.set(cx, -0.06, 0.12);
    roadPit.add(stripe);
  }

  // --- Hazard 5: Coiled Emerald-Gold Cartoon Cobra ("कितना अच्छा जा रहा है!") ---
  const giantSnake = createHazardGroup();
  const snakeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.45 });
  const snakeBody: THREE.Object3D[] = [];
  for (let i = 0; i < 8; i++) {
    const r = 0.075 - i * 0.0055;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.025, r), 10, 8), i % 2 === 0 ? snakeMat : bellyMat);
    giantSnake.add(seg);
    snakeBody.push(seg);
  }
  const snakeHood = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), snakeMat);
  snakeHood.scale.set(1.25, 1.35, 0.65);
  snakeHood.position.set(-0.24, 0.16, 0.08);
  giantSnake.add(snakeHood);
  for (const ex of [-0.048, 0.048]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eye.position.set(ex, 0.04, 0.09);
    snakeHood.add(eye);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), new THREE.MeshBasicMaterial({ color: 0x090d16 }));
    pu.position.set(ex, 0.04, 0.115);
    snakeHood.add(pu);
  }
  const snakeTongue = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, 0.14), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  snakeTongue.position.set(-0.24, 0.12, 0.22);
  giantSnake.add(snakeTongue);
  snakeBody.push(snakeHood);

  // --- Hazard 6: Giant Thali Plate + Laddu + Steel Water Tumbler ---
  const chokeFood = createHazardGroup();
  const thali = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.26, 0.04, 24),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }),
  );
  thali.position.set(-0.08, -0.14, 0.04);
  chokeFood.add(thali);
  const laddoo = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), marigoldMat);
  laddoo.position.set(-0.08, -0.02, 0.06);
  chokeFood.add(laddoo);
  const waterGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.065, 0.28, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.78, roughness: 0.15 }),
  );
  waterGlass.position.set(0.28, -0.02, 0.08);
  chokeFood.add(waterGlass);

  // --- Hazard 7: Midnight 2:30 AM Glowing Phone + Washroom Frame ---
  const nightPhone = createHazardGroup();
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.48, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }),
  );
  phoneBody.rotation.z = -0.12;
  nightPhone.add(phoneBody);
  const phoneGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.42), phoneGlowMat);
  phoneScreen.position.set(0, 0, 0.026);
  phoneScreen.rotation.z = -0.12;
  nightPhone.add(phoneScreen);
  const moonCrescent = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), boltMat);
  moonCrescent.position.set(-0.32, 0.24, -0.05);
  nightPhone.add(moonCrescent);

  parent.add(bubbleGroup);

  return {
    funeralGroup,
    shroudMesh,
    shroudGarland,
    bubbleGroup,
    hazards: {
      wireSpark,
      truckRickshaw,
      waterTank,
      roadPit,
      giantSnake,
      chokeFood,
      nightPhone,
    },
    wireSparks,
    truckGroup,
    rickshawGroup,
    snakeBody,
    snakeTongue,
    phoneGlowMat,
  };
}

export function updateComedyGagProps(
  rig: ComedyGagRig,
  t: number,
  hasFuneralShroud: boolean,
  shroudOpen: boolean,
  hazardMode: ComedyHazardMode,
  turnLocal: number,
): void {
  rig.funeralGroup.visible = hasFuneralShroud;
  rig.shroudMesh.visible = hasFuneralShroud && !shroudOpen;

  if (hazardMode === 'none') {
    rig.bubbleGroup.visible = false;
    return;
  }

  rig.bubbleGroup.visible = true;
  rig.bubbleGroup.position.y = 2.22 + Math.sin(t * 3.2) * 0.045;
  const pop = turnLocal < 0.16 ? 0.65 + (turnLocal / 0.16) * 0.38 : 1.0 + Math.sin(t * 5.0) * 0.025;
  rig.bubbleGroup.scale.setScalar(pop);

  for (const [key, grp] of Object.entries(rig.hazards)) {
    grp.visible = key === hazardMode;
  }

  if (hazardMode === 'wireSpark') {
    rig.wireSparks.forEach((sp, i) => {
      const ang = t * 9.0 + (i / rig.wireSparks.length) * Math.PI * 2;
      const rad = 0.08 + ((t * 3.2 + i * 0.2) % 0.22);
      sp.position.set(Math.cos(ang) * rad, -0.08 + Math.sin(ang) * rad, 0.06);
      sp.scale.setScalar(0.65 + 0.55 * Math.abs(Math.sin(t * 22 + i)));
    });
  } else if (hazardMode === 'truckRickshaw' && rig.truckGroup && rig.rickshawGroup) {
    rig.truckGroup.position.y = -0.08 + Math.abs(Math.sin(t * 14)) * 0.022;
    rig.rickshawGroup.position.y = -0.12 + Math.abs(Math.sin(t * 16 + 0.8)) * 0.028;
    rig.truckGroup.rotation.y = Math.sin(t * 2.5) * 0.15;
    rig.rickshawGroup.rotation.y = Math.sin(t * 2.5) * 0.15;
  } else if (hazardMode === 'giantSnake') {
    rig.snakeBody.forEach((seg, idx) => {
      if (idx === rig.snakeBody.length - 1) {
        seg.position.set(-0.22, 0.14 + Math.sin(t * 5.2) * 0.04, 0.08);
        seg.rotation.z = Math.sin(t * 4.2) * 0.14;
      } else {
        const px = -0.14 + idx * 0.068;
        const py = -0.12 + Math.sin(t * 6.0 - idx * 0.7) * 0.075;
        const pz = Math.cos(t * 6.0 - idx * 0.7) * 0.10;
        seg.position.set(px, py, pz);
      }
    });
    if (rig.snakeTongue) {
      rig.snakeTongue.visible = Math.sin(t * 14) > 0;
      rig.snakeTongue.position.y = 0.10 + Math.sin(t * 5.2) * 0.04;
    }
  } else if (hazardMode === 'nightPhone' && rig.phoneGlowMat) {
    rig.phoneGlowMat.color.setHex(Math.sin(t * 8) > 0 ? 0x38bdf8 : 0x7dd3fc);
  }
}
