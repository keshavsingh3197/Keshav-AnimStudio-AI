import * as THREE from 'three';

export interface HeldPropRig {
  rightGroup: THREE.Group;
  leftGroup: THREE.Group;
  capeGroup: THREE.Group;
  towelNeckGroup: THREE.Group;
  rightMeshes: Record<string, THREE.Object3D>;
  leftComb: THREE.Object3D;
  scissorUpper?: THREE.Object3D;
  scissorLower?: THREE.Object3D;
  phoneScreen?: THREE.MeshBasicMaterial;
  diyaFlame?: THREE.Object3D;
}

export function buildCharacterHandProps(
  rightElbow: THREE.Group,
  leftElbow: THREE.Group,
  torsoGroup: THREE.Group,
): HeldPropRig {
  const rightGroup = new THREE.Group();
  rightGroup.position.set(0, -0.24, 0.05);
  rightElbow.add(rightGroup);

  const leftGroup = new THREE.Group();
  leftGroup.position.set(0, -0.24, 0.05);
  leftElbow.add(leftGroup);

  // Draped white/striped salon cutting cape attached to customer's shoulders/torso
  const capeGroup = new THREE.Group();
  capeGroup.visible = false;
  const capeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65, side: THREE.DoubleSide });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 });
  const capeCloth = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 0.44, 18, 1, false, -Math.PI * 0.65, Math.PI * 1.3), capeMat);
  capeCloth.position.set(0, 0.36, 0.03);
  capeCloth.castShadow = true;
  capeGroup.add(capeCloth);
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.025, 8, 20), stripeMat);
  collarRing.rotation.x = Math.PI / 2 + 0.14;
  collarRing.position.set(0, 0.57, 0.02);
  capeGroup.add(collarRing);
  torsoGroup.add(capeGroup);

  // Soft draped Indian barber shoulder collar/cape (sits snugly BELOW collar/shoulders so chin & face stay 100% clear)
  const towelNeckGroup = new THREE.Group();
  towelNeckGroup.visible = false;
  const towelClothMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.88 });
  const towelStripeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.72 });
  const neckWrap = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.022, 8, 20), towelClothMat);
  neckWrap.rotation.x = Math.PI / 2 + 0.22;
  neckWrap.position.set(0, 0.505, -0.01);
  towelNeckGroup.add(neckWrap);
  const shoulderCape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.255, 0.34, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.90),
    towelClothMat,
  );
  shoulderCape.position.set(0, 0.35, 0.03);
  shoulderCape.rotation.y = Math.PI * 0.02;
  towelNeckGroup.add(shoulderCape);
  for (const sx of [-0.095, 0.095]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.19, 0.014), towelClothMat);
    flap.position.set(sx, 0.34, 0.145);
    flap.rotation.x = -0.16;
    flap.rotation.z = sx < 0 ? 0.18 : -0.18;
    towelNeckGroup.add(flap);
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.024, 0.016), towelStripeMat);
    border.position.set(sx * 1.06, 0.245, 0.160);
    border.rotation.x = -0.16;
    border.rotation.z = sx < 0 ? 0.18 : -0.18;
    towelNeckGroup.add(border);
  }
  torsoGroup.add(towelNeckGroup);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.14 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.52 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.22 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38 });
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 });

  const rightMeshes: Record<string, THREE.Object3D> = {};

  // 1. Articulated 3D Chrome Scissors (twin pivoting blades + crimson finger loops!)
  const brightSilverMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.72,
    roughness: 0.16,
    emissive: 0x334155,
    emissiveIntensity: 0.35,
  });
  const scissors = new THREE.Group();
  const scissorUpper = new THREE.Group();
  const upperBlade = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.32, 0.016), brightSilverMat);
  upperBlade.position.set(0, 0.16, 0);
  scissorUpper.add(upperBlade);
  const upperLoop = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.014, 8, 16), redMat);
  upperLoop.position.set(-0.028, -0.06, 0);
  scissorUpper.add(upperLoop);
  scissors.add(scissorUpper);

  const scissorLower = new THREE.Group();
  const lowerBlade = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.32, 0.016), brightSilverMat);
  lowerBlade.position.set(0, 0.16, 0.008);
  scissorLower.add(lowerBlade);
  const lowerLoop = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.014, 8, 16), redMat);
  lowerLoop.position.set(0.028, -0.06, 0.008);
  scissorLower.add(lowerLoop);
  scissors.add(scissorLower);

  const pivotPin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.032, 10), brassMat);
  pivotPin.rotation.x = Math.PI / 2;
  pivotPin.position.set(0, 0.02, 0.004);
  scissors.add(pivotPin);
  // +1.16 * PI (-151 deg) + arm pitch (-131 deg) -> +78 deg net angle = forward across Customer's black hair crown!
  scissors.rotation.x = Math.PI * 1.16;
  scissors.visible = false;
  rightGroup.add(scissors);
  rightMeshes['scissors'] = scissors;

  // Comb (shared right-hand + dedicated left-hand comb)
  const buildCombMesh = (): THREE.Group => {
    const cg = new THREE.Group();
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.22, 0.016), tealMat);
    spine.position.set(0, 0.1, 0);
    cg.add(spine);
    for (let t = -3; t <= 3; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.012, 0.012), tealMat);
      tooth.position.set(0.024, 0.1 + t * 0.026, 0);
      cg.add(tooth);
    }
    return cg;
  };
  const rightComb = buildCombMesh();
  rightComb.rotation.x = Math.PI * 1.12;
  rightComb.visible = false;
  rightGroup.add(rightComb);
  rightMeshes['comb'] = rightComb;

  const leftComb = buildCombMesh();
  leftComb.rotation.x = Math.PI * 1.12;
  leftComb.visible = false;
  leftGroup.add(leftComb);

  // 2. Gleaming Brass Key
  const key = new THREE.Group();
  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 16), brassMat);
  keyRing.position.y = 0.03;
  key.add(keyRing);
  const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 8), brassMat);
  keyShaft.position.y = 0.16;
  key.add(keyShaft);
  const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.016), brassMat);
  keyBit.position.set(0.032, 0.24, 0);
  key.add(keyBit);
  key.rotation.x = Math.PI * 0.35;
  key.visible = false;
  rightGroup.add(key);
  rightMeshes['key'] = key;

  // 3. Smartphone (glowing blue screen)
  const phone = new THREE.Group();
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.20, 0.018), darkMat);
  phoneBody.position.set(0, 0.08, 0.02);
  phone.add(phoneBody);
  const phoneScreen = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.16), phoneScreen);
  screen.position.set(0, 0.08, 0.03);
  phone.add(screen);
  phone.visible = false;
  rightGroup.add(phone);
  rightMeshes['phone'] = phone;

  // 4. Judge Gavel
  const gavel = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.28, 10), woodMat);
  handle.position.y = 0.14;
  gavel.add(handle);
  const mallet = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.16, 12), woodMat);
  mallet.rotation.z = Math.PI / 2;
  mallet.position.y = 0.26;
  gavel.add(mallet);
  const malletBand = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 12), brassMat);
  malletBand.rotation.z = Math.PI / 2;
  malletBand.position.y = 0.26;
  gavel.add(malletBand);
  gavel.rotation.x = Math.PI * 0.42;
  gavel.visible = false;
  rightGroup.add(gavel);
  rightMeshes['gavel'] = gavel;

  // 5. Handheld Quiz/Comedy Microphone
  const mic = new THREE.Group();
  const micStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.22, 10), darkMat);
  micStem.position.y = 0.11;
  mic.add(micStem);
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), chromeMat);
  micHead.position.y = 0.23;
  mic.add(micHead);
  mic.rotation.x = Math.PI * 0.25;
  mic.visible = false;
  rightGroup.add(mic);
  rightMeshes['mic'] = mic;

  // 6. Teacup / Kulhad
  const teacup = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.048, 0.11, 14), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.72 }));
  cup.position.y = 0.06;
  teacup.add(cup);
  const teaTop = new THREE.Mesh(new THREE.CircleGeometry(0.058, 12), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.25 }));
  teaTop.rotation.x = -Math.PI / 2;
  teaTop.position.y = 0.112;
  teacup.add(teaTop);
  teacup.visible = false;
  rightGroup.add(teacup);
  rightMeshes['teacup'] = teacup;

  // 7. Cooking Ladle (Karchhi)
  const ladle = new THREE.Group();
  const lHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8), chromeMat);
  lHandle.position.y = 0.18;
  ladle.add(lHandle);
  const lBowl = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), chromeMat);
  lBowl.rotation.x = Math.PI;
  lBowl.position.set(0, 0.36, 0.03);
  ladle.add(lBowl);
  ladle.rotation.x = Math.PI * 0.35;
  ladle.visible = false;
  rightGroup.add(ladle);
  rightMeshes['ladle'] = ladle;

  // 8. Stethoscope & Cartoon Syringe
  const steth = new THREE.Group();
  const stethRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 16, Math.PI * 1.4), darkMat);
  stethRing.position.y = 0.12;
  steth.add(stethRing);
  const chestPiece = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 12), chromeMat);
  chestPiece.rotation.x = Math.PI / 2;
  chestPiece.position.set(0, 0.22, 0.03);
  steth.add(chestPiece);
  steth.visible = false;
  rightGroup.add(steth);
  rightMeshes['stethoscope'] = steth;

  const syringe = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.22, 12), tealMat);
  barrel.position.y = 0.14;
  syringe.add(barrel);
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.12, 8), chromeMat);
  needle.position.y = 0.31;
  syringe.add(needle);
  syringe.rotation.x = Math.PI * 0.45;
  syringe.visible = false;
  rightGroup.add(syringe);
  rightMeshes['syringe'] = syringe;

  // 9. Sacred Diya Lamp, Flute, Trishul, Bow, Baton, Chalk, Book, Money, Broom, Umbrella
  const diya = new THREE.Group();
  const dBowl = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.055, 14), brassMat);
  dBowl.rotation.x = Math.PI;
  dBowl.position.y = 0.04;
  diya.add(dBowl);
  const dFlame = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 10), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  dFlame.position.y = 0.10;
  diya.add(dFlame);
  diya.visible = false;
  rightGroup.add(diya);
  rightMeshes['diya'] = diya;

  const flute = new THREE.Group();
  const fTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 10), brassMat);
  fTube.rotation.z = Math.PI / 2;
  fTube.position.set(0.14, 0.04, 0.04);
  flute.add(fTube);
  flute.visible = false;
  rightGroup.add(flute);
  rightMeshes['flute'] = flute;

  const book = new THREE.Group();
  const bCover = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.045), redMat);
  bCover.position.set(0, 0.10, 0.04);
  book.add(bCover);
  const bPages = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.036), new THREE.MeshStandardMaterial({ color: 0xfefce8 }));
  bPages.position.set(0.01, 0.10, 0.04);
  book.add(bPages);
  book.visible = false;
  rightGroup.add(book);
  rightMeshes['book'] = book;

  const baton = new THREE.Group();
  const bRod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.56, 10), woodMat);
  bRod.position.y = 0.28;
  baton.add(bRod);
  baton.rotation.x = Math.PI * 0.25;
  baton.visible = false;
  rightGroup.add(baton);
  rightMeshes['baton'] = baton;

  const chalk = new THREE.Group();
  const cStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.11, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  cStick.position.y = 0.06;
  chalk.add(cStick);
  chalk.rotation.x = Math.PI * 0.35;
  chalk.visible = false;
  rightGroup.add(chalk);
  rightMeshes['chalk'] = chalk;

  const trishul = new THREE.Group();
  const tShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.92, 10), brassMat);
  tShaft.position.y = 0.36;
  trishul.add(tShaft);
  const tMid = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 8), brassMat);
  tMid.position.y = 0.88;
  trishul.add(tMid);
  for (const s of [-1, 1]) {
    const prong = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.14, 8), brassMat);
    prong.position.set(s * 0.065, 0.82, 0);
    prong.rotation.z = -s * 0.25;
    trishul.add(prong);
  }
  trishul.visible = false;
  rightGroup.add(trishul);
  rightMeshes['trishul'] = trishul;

  const bow = new THREE.Group();
  const bArc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 22, Math.PI), brassMat);
  bArc.rotation.z = -Math.PI / 2;
  bArc.position.set(0, 0.18, 0.05);
  bow.add(bArc);
  bow.visible = false;
  rightGroup.add(bow);
  rightMeshes['bow'] = bow;

  // Heavy Golden Mythological Gada (Mace for Hiranyakashipu & Hanuman)
  const gada = new THREE.Group();
  const gShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.028, 0.56, 10), brassMat);
  gShaft.position.y = 0.24;
  gada.add(gShaft);
  const gGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), brassMat);
  gGlobe.scale.set(1.0, 1.18, 1.0);
  gGlobe.position.y = 0.56;
  gada.add(gGlobe);
  const gSpikeRing = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.016, 6, 14), brassMat);
  gSpikeRing.rotation.x = Math.PI / 2;
  gSpikeRing.position.y = 0.56;
  gada.add(gSpikeRing);
  gada.rotation.x = Math.PI * 0.28;
  gada.visible = false;
  rightGroup.add(gada);
  rightMeshes['gada'] = gada;

  const money = new THREE.Group();
  const cash = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.025), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45 }));
  cash.position.set(0, 0.05, 0.04);
  money.add(cash);
  money.visible = false;
  rightGroup.add(money);
  rightMeshes['money'] = money;

  const broom = new THREE.Group();
  const brStick = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.65, 8), woodMat);
  brStick.position.y = 0.22;
  broom.add(brStick);
  const brBristles = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 }));
  brBristles.position.y = -0.14;
  broom.add(brBristles);
  broom.visible = false;
  rightGroup.add(broom);
  rightMeshes['broom'] = broom;

  const umbrella = new THREE.Group();
  const uShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 8), darkMat);
  uShaft.position.y = 0.26;
  umbrella.add(uShaft);
  const uDome = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.14, 14), redMat);
  uDome.position.y = 0.52;
  umbrella.add(uDome);
  umbrella.visible = false;
  rightGroup.add(umbrella);
  rightMeshes['umbrella'] = umbrella;

  const sweetplate = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.022, 14), chromeMat);
  plate.position.y = 0.02;
  sweetplate.add(plate);
  for (const lx of [-0.04, 0.04, 0]) {
    const lad = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 }));
    lad.position.set(lx, 0.055, lx === 0 ? 0.035 : -0.02);
    sweetplate.add(lad);
  }
  sweetplate.visible = false;
  rightGroup.add(sweetplate);
  rightMeshes['sweetplate'] = sweetplate;

  // Held Barber Tolia (slim folded cotton cloth dangling BELOW the hand during 'removingTowel' so chin stays uncovered)
  const handTowel = new THREE.Group();
  const hTowelBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.020), towelClothMat);
  hTowelBody.position.set(0.01, -0.15, 0.015);
  hTowelBody.rotation.x = 0.04;
  handTowel.add(hTowelBody);
  const hTowelBand = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.035, 0.023), towelStripeMat);
  hTowelBand.position.set(0.01, -0.23, 0.018);
  hTowelBand.rotation.x = 0.04;
  handTowel.add(hTowelBand);
  handTowel.visible = false;
  rightGroup.add(handTowel);
  rightMeshes['towel'] = handTowel;

  // Salon Water Spray Bottle
  const sprayBottle = new THREE.Group();
  const spBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.18, 12), tealMat);
  spBody.position.y = 0.09;
  sprayBottle.add(spBody);
  const spNozzle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.035), brightSilverMat);
  spNozzle.position.set(0.025, 0.20, 0);
  sprayBottle.add(spNozzle);
  sprayBottle.rotation.x = Math.PI * 0.42;
  sprayBottle.visible = false;
  rightGroup.add(sprayBottle);
  rightMeshes['sprayBottle'] = sprayBottle;

  // Glowing Golden-Pink Sacred Lotus Bloom (Vaikuntha Chaturdashi Sahasra Kamala / Harihar Milan)
  const lotus = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 }));
  stem.position.y = 0.08;
  lotus.add(stem);
  const lotusGoldMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.42, roughness: 0.28 });
  const lotusPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.25, roughness: 0.34 });
  for (let p = 0; p < 8; p++) {
    const a = (p / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.13, 6), p % 2 === 0 ? lotusPinkMat : lotusGoldMat);
    petal.position.set(Math.cos(a) * 0.068, 0.22, Math.sin(a) * 0.068);
    petal.rotation.z = -Math.cos(a) * 0.62;
    petal.rotation.x = Math.sin(a) * 0.62;
    lotus.add(petal);
  }
  const lotusCore = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), lotusGoldMat);
  lotusCore.position.y = 0.22;
  lotus.add(lotusCore);
  lotus.rotation.x = Math.PI * 0.18;
  lotus.visible = false;
  rightGroup.add(lotus);
  rightMeshes['lotus'] = lotus;

  // Handheld Radiant Sudarshana Chakra Discus (gifted by Lord Shiva to Lord Vishnu)
  const chakra = new THREE.Group();
  const chakraMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.78, metalness: 0.85, roughness: 0.14 });
  const chakraRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 22), chakraMat);
  chakraRing.position.y = 0.20;
  chakra.add(chakraRing);
  const chakraHub = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), chakraMat);
  chakraHub.position.y = 0.20;
  chakra.add(chakraHub);
  for (let c = 0; c < 10; c++) {
    const ca = (c / 10) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.065, 4), chakraMat);
    spoke.position.set(Math.cos(ca) * 0.165, 0.20 + Math.sin(ca) * 0.165, 0);
    spoke.rotation.z = ca - Math.PI / 2;
    chakra.add(spoke);
  }
  chakra.visible = false;
  rightGroup.add(chakra);
  rightMeshes['chakra'] = chakra;

  return {
    rightGroup,
    leftGroup,
    capeGroup,
    towelNeckGroup,
    rightMeshes,
    leftComb,
    scissorUpper,
    scissorLower,
    phoneScreen,
    diyaFlame: dFlame,
  };
}

export function updateHandPropAnimation(
  props: HeldPropRig | undefined,
  heldProp: string | null | undefined,
  action: string,
  t: number,
  isSpeaking: boolean,
  showCape: boolean,
): void {
  if (!props) return;

  const effectiveProp = action === 'removingTowel' ? 'towel' : (heldProp && heldProp !== 'none' ? heldProp : null);
  for (const key of Object.keys(props.rightMeshes)) {
    props.rightMeshes[key].visible = key === effectiveProp;
  }

  // When cutting with scissors, left hand brings up the salon comb simultaneously!
  props.leftComb.visible = effectiveProp === 'scissors' || effectiveProp === 'comb';
  props.capeGroup.visible = showCape && effectiveProp !== 'scissors';
  props.towelNeckGroup.visible = showCape && effectiveProp !== 'scissors' && action !== 'removingTowel';

  if (effectiveProp === 'scissors' && props.scissorUpper && props.scissorLower) {
    // Brisk open-and-snap metallic scissor blades ("snick-snick")
    const freq = action === 'cutting' || isSpeaking ? 18.0 : 8.5;
    const snip = 0.05 + Math.pow(0.5 + 0.5 * Math.sin(t * freq), 2) * 0.42;
    props.scissorUpper.rotation.z = snip;
    props.scissorLower.rotation.z = -snip;
  }

  if (effectiveProp === 'phone' && props.phoneScreen) {
    props.phoneScreen.color.setHex(Math.sin(t * 9) > 0 ? 0x38bdf8 : 0x7dd3fc);
  }

  if (effectiveProp === 'diya' && props.diyaFlame) {
    const f = 0.85 + 0.25 * Math.sin(t * 14.0);
    props.diyaFlame.scale.set(f, 0.9 + 0.3 * Math.cos(t * 11.0), f);
  }

  if (effectiveProp === 'chakra' && props.rightMeshes['chakra']) {
    props.rightMeshes['chakra'].rotation.z = t * 5.2;
  }
}
