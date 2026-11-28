import * as THREE from 'three';
import {
  FurnitureItemJson,
  SceneBlueprintJson,
  ScenePropJson,
  SpotPlacementJson,
  WallFixtureJson,
} from './types';

function makeTileTexture(baseHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  // Subtle terrazzo / tile speckles
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect((i * 73) % 256, (i * 137) % 256, 3, 3);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 3;
  for (let g = 0; g <= 256; g += 64) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(256, g);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWoodTexture(baseHex = '#9a6234'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(60,30,10,0.12)' : 'rgba(255,220,175,0.06)';
    ctx.fillRect(0, y, 256, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeClockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(String(n), 128 + Math.cos(a) * 90, 128 + Math.sin(a) * 90);
  }
  // Hour & minute hands (10:12)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(84, 88);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(186, 98);
  ctx.stroke();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(175, 165);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBlackboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#182420';
  ctx.fillRect(0, 0, 512, 256);
  // Subtle chalk smudge
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.arc((i * 67) % 512, (i * 43) % 256, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(241,245,249,0.55)';
  ctx.lineWidth = 3;
  // Triangle & circle diagram
  ctx.beginPath();
  ctx.moveTo(60, 190);
  ctx.lineTo(150, 190);
  ctx.lineTo(60, 95);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(380, 130, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(248,250,252,0.75)';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('EXAM HALL — NO CHEATING', 120, 46);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNoticeBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#4a321f';
  ctx.fillRect(0, 0, 256, 192);
  const notes = [
    [26, 26, 42, 46, '#fde047'],
    [92, 34, 40, 44, '#fef08a'],
    [164, 24, 44, 48, '#bbf7d0'],
    [40, 96, 46, 48, '#fed7aa'],
    [118, 102, 42, 46, '#fde047'],
    [182, 92, 40, 44, '#bfdbfe'],
  ] as const;
  for (const [x, y, w, h, col] of notes) {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addWallFixture(group: THREE.Group, f: WallFixtureJson): void {
  const holder = new THREE.Group();
  holder.position.set(f.x, f.y, f.z);
  holder.rotation.y = f.rotY ?? 0;
  const w = f.width ?? 1.2;
  const h = f.height ?? 1.0;

  if (f.kind === 'blackboard') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.65 }),
    );
    holder.add(frame);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: makeBlackboardTexture(), roughness: 0.92 }),
    );
    board.position.z = 0.045;
    holder.add(board);
    const ledge = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, 0.06, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.65 }),
    );
    ledge.position.set(0, -h / 2 - 0.05, 0.05);
    holder.add(ledge);
  } else if (f.kind === 'clock') {
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(w * 0.52, w * 0.52, 0.06, 28),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.35 }),
    );
    rim.rotation.x = Math.PI / 2;
    holder.add(rim);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(w * 0.48, 28),
      new THREE.MeshBasicMaterial({ map: makeClockTexture() }),
    );
    face.position.z = 0.035;
    holder.add(face);
  } else if (f.kind === 'portraitFrame') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x6b3e1b, roughness: 0.55 }),
    );
    holder.add(frame);
    const canvas = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: f.color ?? '#cbd5e1', roughness: 0.8 }),
    );
    canvas.position.z = 0.03;
    holder.add(canvas);
    const silhouette = new THREE.Mesh(
      new THREE.CircleGeometry(Math.min(w, h) * 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 }),
    );
    silhouette.position.set(0, h * 0.06, 0.035);
    holder.add(silhouette);
  } else if (f.kind === 'noticeBoard') {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x3b2616, roughness: 0.65 }),
    );
    holder.add(frame);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: makeNoticeBoardTexture(), roughness: 0.9 }),
    );
    board.position.z = 0.03;
    holder.add(board);
  } else if (f.kind === 'window') {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.55 });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: 0xfef9c3 }),
    );
    glass.position.z = 0.01;
    holder.add(glass);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.07, 0.08), frameMat);
    topBar.position.y = h / 2;
    const botBar = topBar.clone();
    botBar.position.y = -h / 2;
    const midBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.07), frameMat);
    holder.add(topBar, botBar, midBar);
  } else if (f.kind === 'door') {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.08),
      new THREE.MeshStandardMaterial({ color: f.color ?? '#94a3b8', roughness: 0.5 }),
    );
    holder.add(door);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.12, h + 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }),
    );
    frame.position.z = -0.02;
    holder.add(frame);
  }
  group.add(holder);
}

function addFurnitureItem(group: THREE.Group, item: FurnitureItemJson, woodTex: THREE.CanvasTexture): void {
  const holder = new THREE.Group();
  holder.position.set(item.x, item.y ?? 0, item.z);
  holder.rotation.y = item.rotY ?? 0;

  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: item.color ?? '#c88a55',
    roughness: 0.62,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.55, roughness: 0.45 });

  const w = item.width ?? 1.1;
  const h = item.height ?? 0.72;
  const d = item.depth ?? 0.55;

  if (item.kind === 'desk' || item.kind === 'table') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), woodMat);
    top.position.y = h;
    top.castShadow = true;
    top.receiveShadow = true;
    holder.add(top);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.22, 0.04), woodMat);
    apron.position.set(0, h - 0.14, d / 2 - 0.06);
    holder.add(apron);

    const legGeo = new THREE.BoxGeometry(0.05, h, 0.05);
    for (const lx of [-w / 2 + 0.06, w / 2 - 0.06]) {
      for (const lz of [-d / 2 + 0.06, d / 2 - 0.06]) {
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, h / 2, lz);
        leg.castShadow = true;
        holder.add(leg);
      }
    }
  } else if (item.kind === 'bench' || item.kind === 'chair') {
    const seatH = item.seatHeight ?? 0.42;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, d), woodMat);
    seat.position.y = seatH;
    seat.castShadow = true;
    seat.receiveShadow = true;
    holder.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.36, 0.04), woodMat);
    back.position.set(0, seatH + 0.22, -d / 2 + 0.03);
    back.castShadow = true;
    holder.add(back);

    const legGeo = new THREE.BoxGeometry(0.045, seatH, 0.045);
    for (const lx of [-w / 2 + 0.06, w / 2 - 0.06]) {
      for (const lz of [-d / 2 + 0.06, d / 2 - 0.06]) {
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, seatH / 2, lz);
        holder.add(leg);
      }
    }
  } else if (item.kind === 'podium') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    holder.add(body);
  }
  group.add(holder);
}

function addScenePropItem(group: THREE.Group, p: ScenePropJson): void {
  const holder = new THREE.Group();
  holder.position.set(p.x, p.y, p.z);
  holder.rotation.y = p.rotY ?? 0;
  const sc = p.scale ?? 1;
  holder.scale.setScalar(sc);

  if (p.kind === 'examPaper') {
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.006, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }),
    );
    holder.add(sheet);
  } else if (p.kind === 'pen') {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.006, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: p.color ?? '#0284c7', roughness: 0.4 }),
    );
    pen.rotation.z = Math.PI / 2;
    pen.position.y = 0.01;
    holder.add(pen);
  } else if (p.kind === 'book') {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.04, 0.28),
      new THREE.MeshStandardMaterial({ color: p.color ?? '#1d4ed8', roughness: 0.7 }),
    );
    book.position.y = 0.02;
    holder.add(book);
  } else if (p.kind === 'duster') {
    const duster = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
    );
    duster.position.y = 0.02;
    holder.add(duster);
  }
  group.add(holder);
}

export function buildSceneFromBlueprint(
  group: THREE.Group,
  blueprint: SceneBlueprintJson,
  spotsOut: Record<string, SpotPlacementJson>,
): void {
  const r = blueprint.room ?? {};
  const rw = r.width ?? 9.6;
  const rd = r.depth ?? 8.4;
  const rh = r.height ?? 3.6;
  const backZ = -rd / 2;
  const frontZ = rd / 2;

  const floorTex = makeTileTexture(r.floorColor ?? '#d6b4a1');
  const woodTex = makeWoodTexture('#a86b3a');

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(rw, rd),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.78 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: r.wallColor ?? '#dcd795', roughness: 0.88 });
  const trimMat = new THREE.MeshStandardMaterial({ color: r.wallTrimColor ?? '#a3a86b', roughness: 0.85 });

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), wallMat);
  backWall.position.set(0, rh / 2, backZ);
  group.add(backWall);

  // Front wall (facing inward for reverse-angle / student-facing shots)
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), wallMat);
  frontWall.position.set(0, rh / 2, frontZ);
  frontWall.rotation.y = Math.PI;
  group.add(frontWall);

  // Left & right walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(rd, rh), wallMat);
  leftWall.position.set(-rw / 2, rh / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(rd, rh), wallMat);
  rightWall.position.set(rw / 2, rh / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  group.add(rightWall);

  // Baseboard trim along back & side walls
  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.25, 0.04), trimMat);
  backTrim.position.set(0, 0.125, backZ + 0.02);
  group.add(backTrim);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(rw, rd),
    new THREE.MeshStandardMaterial({ color: r.ceilingColor ?? '#b4c6b8', roughness: 0.92 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = rh;
  group.add(ceiling);

  // Classroom warm overhead lights
  const ceilingLight = new THREE.PointLight(0xfffbeb, 1.35, 14);
  ceilingLight.position.set(0, rh - 0.35, 0);
  group.add(ceilingLight);

  for (const wf of blueprint.wallFixtures ?? []) {
    addWallFixture(group, wf);
  }
  for (const furn of blueprint.furniture ?? []) {
    addFurnitureItem(group, furn, woodTex);
  }
  for (const prop of blueprint.props ?? []) {
    addScenePropItem(group, prop);
  }
  if (blueprint.spots) {
    Object.assign(spotsOut, blueprint.spots);
  }
}

/** Rich default 360-degree 3D Indian Exam Classroom blueprint (used when Classroom setting has no custom blueprint). */
export function getDefaultClassroomBlueprint(): SceneBlueprintJson {
  const furniture: FurnitureItemJson[] = [
    // Teacher podium at front-right-center in front of blackboard
    { id: 'teacher_podium', kind: 'podium', x: 0.85, z: -2.05, width: 1.05, height: 0.84, depth: 0.62, color: '#8b4513' },
  ];
  const props: ScenePropJson[] = [
    { kind: 'book', x: 0.72, y: 0.85, z: -2.02, rotY: 0.15, color: '#991b1b' },
    { kind: 'duster', x: 1.1, y: 0.85, z: -2.05, rotY: -0.2 },
  ];

  // 3x2 student desk + bench rows facing the teacher (-Z) = 12 student seats
  const deskCols = [-1.55, 1.35];
  const deskRows = [-0.45, 1.05, 2.55];
  const spots: Record<string, SpotPlacementJson> = {
    teacher_podium: { x: 0.15, y: 0, z: -2.55, rotY: 0.05, pose: 'standing' },
    teacher_aisle: { x: -0.1, y: 0, z: -1.35, rotY: 0.0, pose: 'standing' },
    door_exit: { x: 4.1, y: 1.15, z: -4.05, rotY: Math.PI, pose: 'standing' },
  };
  let seatNum = 1;
  deskRows.forEach((rz, rowIdx) => {
    deskCols.forEach((cx, colIdx) => {
      furniture.push({
        id: `desk_r${rowIdx}_c${colIdx}`,
        kind: 'desk',
        x: cx,
        z: rz,
        width: 1.5,
        height: 0.72,
        depth: 0.56,
        color: '#b4743e',
      });
      furniture.push({
        id: `bench_r${rowIdx}_c${colIdx}`,
        kind: 'bench',
        x: cx,
        z: rz + 0.52,
        rotY: Math.PI, // backrest behind student (at +Z), facing -Z toward teacher
        width: 1.5,
        depth: 0.42,
        seatHeight: 0.42,
        color: '#b4743e',
      });
      // Two exam papers + pens + named seat spots per double desk
      for (const offset of [-0.38, 0.38]) {
        props.push({ kind: 'examPaper', x: cx + offset, y: 0.73, z: rz + 0.04, rotY: offset * 0.12 });
        props.push({ kind: 'pen', x: cx + offset + 0.16, y: 0.73, z: rz + 0.02, rotY: 0.4 });
        spots[`student_${seatNum}`] = {
          x: cx + offset,
          y: 0,
          z: rz + 0.38,
          rotY: Math.PI,
          pose: 'sitting',
          seatHeight: 0.42,
        };
        seatNum++;
      }
    });
  });

  // Aisle spots beside each desk row so a teacher/inspector can stand next to any student and face them
  deskRows.forEach((rz, rowIdx) => {
    spots[`aisle_r${rowIdx}_faceLeft`] = { x: -0.32, y: 0, z: rz + 0.42, rotY: -Math.PI / 2, pose: 'standing' };
    spots[`aisle_r${rowIdx}_faceRight`] = { x: 0.12, y: 0, z: rz + 0.42, rotY: Math.PI / 2, pose: 'standing' };
    spots[`aisle_r${rowIdx}_faceFront`] = { x: -0.1, y: 0, z: rz + 0.42, rotY: Math.PI, pose: 'standing' };
  });
  // Just inside the door, turned toward the class
  spots.door_inside = { x: 3.55, y: 0, z: -3.2, rotY: -0.8, pose: 'standing' };
  spots.front_center = { x: -0.1, y: 0, z: -1.75, rotY: 0, pose: 'standing' };

  // Alias convenience names for backwards compatibility
  spots.student_front_left = spots.student_1;
  spots.student_front_right = spots.student_2;
  spots.student_side_left = spots.student_3;
  spots.student_side_right = spots.student_4;
  spots.student_back_left = spots.student_5;
  spots.student_back_right = spots.student_6;

  return {
    room: {
      width: 9.6,
      depth: 8.4,
      height: 3.6,
      floorColor: '#caa594',
      floorPattern: 'tiles',
      wallColor: '#dcd795',
      wallTrimColor: '#a3a86b',
      ceilingColor: '#9fb4a6',
    },
    wallFixtures: [
      { kind: 'blackboard', x: -0.35, y: 1.85, z: -4.16, width: 4.0, height: 1.55 },
      { kind: 'clock', x: -2.05, y: 2.95, z: -4.15, width: 0.62, height: 0.62 },
      { kind: 'portraitFrame', x: -0.75, y: 2.98, z: -4.15, width: 0.48, height: 0.62, color: '#fde68a' },
      { kind: 'portraitFrame', x: 0.05, y: 2.98, z: -4.15, width: 0.48, height: 0.62, color: '#e2e8f0' },
      { kind: 'noticeBoard', x: 2.45, y: 2.05, z: -4.16, width: 1.35, height: 1.05 },
      { kind: 'door', x: 4.1, y: 1.25, z: -4.15, width: 1.15, height: 2.45, color: '#cbd5e1' },
      { kind: 'window', x: -4.76, y: 1.95, z: -1.4, rotY: Math.PI / 2, width: 1.5, height: 1.3 },
      { kind: 'window', x: -4.76, y: 1.95, z: 1.3, rotY: Math.PI / 2, width: 1.5, height: 1.3 },
    ],
    furniture,
    props,
    spots,
  };
}
