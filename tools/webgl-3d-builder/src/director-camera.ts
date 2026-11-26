import * as THREE from 'three';
import { CameraRig } from './camera';
import { CharacterRig } from './characters';
import { RenderJobJson } from './types';

/**
 * Locked-off "director" camera for walkable 3D rooms (SceneBlueprint / Classroom).
 *
 * Studio cartoon comedies keep the camera on a tripod: every dialogue line is a hard cut to a
 * clean, composed shot and nothing wobbles. This rig therefore:
 *  - frames shots from the speaker's real head bounds, so heads are never cropped;
 *  - chooses each shot once per line (on the cut) and searches nearby angles until
 *      a) nothing blocks the line of sight to the speaking face(s),
 *      b) no other character's head sits right next to the lens or fills the foreground,
 *      c) the camera sees faces, not the backs of heads;
 *  - holds that shot with only a very slow push-in, with no handheld drift, roll or jitter;
 *  - keeps the camera inside the room walls.
 * Wide/master shots come from high corners of the room so the whole class reads at once.
 */

export interface DirectorRoom {
  halfWidth: number;
  halfDepth: number;
  height: number;
}

export interface DirectorShotInput {
  shot: string;
  speaker: CharacterRig;
  listener?: CharacterRig;
  /** Every visible character (used for clearance checks). */
  everyone: CharacterRig[];
  scene: THREE.Scene;
  room: DirectorRoom;
  turnLocal: number;
  cut: boolean;
  aspect: number;
}

interface ShotPlan {
  offset: THREE.Vector3;
  lookOffset: THREE.Vector3;
  fixedPos?: THREE.Vector3;
  fixedLook?: THREE.Vector3;
  pushIn: number;
  punch: boolean;
}

export interface DirectorState {
  plan: ShotPlan | null;
}

export function createDirectorState(_rig: CameraRig): DirectorState {
  return { plan: null };
}

interface HeadInfo {
  rig: CharacterRig;
  center: THREE.Vector3;
  radius: number;
}

const raycaster = new THREE.Raycaster();
const tmpBox = new THREE.Box3();
const tmpSize = new THREE.Vector3();
const probeCam = new THREE.PerspectiveCamera();
const frustum = new THREE.Frustum();
const projMat = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

function isDescendant(obj: THREE.Object3D, root: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur === root) return true;
    cur = cur.parent;
  }
  return false;
}

function isVisibleInTree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

/** Head centre (world) and radius from the rendered head geometry including hair and glasses. */
export function measureHead(rig: CharacterRig): HeadInfo {
  rig.headPivot.updateWorldMatrix(true, true);
  tmpBox.makeEmpty();
  rig.headPivot.traverseVisible((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
    const finite = [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z].every(Number.isFinite);
    if (finite) tmpBox.union(bb); // skip degenerate helper geometry so one bad mesh can't poison framing
  });
  if (tmpBox.isEmpty()) {
    return { rig, center: rig.headPivot.getWorldPosition(new THREE.Vector3()), radius: 0.28 };
  }
  const center = tmpBox.getCenter(new THREE.Vector3());
  tmpBox.getSize(tmpSize);
  const radius = Math.max(0.12, Math.min(0.6, Math.max(tmpSize.x, tmpSize.y, tmpSize.z) * 0.5));
  return { rig, center, radius };
}

function facingYaw(rig: CharacterRig): number {
  return rig.root.rotation.y + rig.bodyPivot.rotation.y;
}

function facingDir(rig: CharacterRig): THREE.Vector3 {
  const y = facingYaw(rig);
  return new THREE.Vector3(Math.sin(y), 0, Math.cos(y));
}

function insideRoom(p: THREE.Vector3, room: DirectorRoom): boolean {
  const m = 0.25;
  return Math.abs(p.x) < room.halfWidth - m && Math.abs(p.z) < room.halfDepth - m && p.y > 0.35 && p.y < room.height - 0.15;
}

function lineIsClear(scene: THREE.Scene, from: THREE.Vector3, to: THREE.Vector3, stopShort: number, exclude: THREE.Object3D[]): boolean {
  const dir = to.clone().sub(from);
  const dist = dir.length();
  if (dist < 1e-3) return true;
  dir.divideScalar(dist);
  raycaster.set(from, dir);
  raycaster.near = 0.05;
  raycaster.far = Math.max(0.1, dist - stopShort);
  for (const h of raycaster.intersectObjects(scene.children, true)) {
    const o = h.object;
    if ((o as THREE.Points).isPoints || (o as THREE.Sprite).isSprite) continue;
    if (!isVisibleInTree(o)) continue;
    const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const m0 = Array.isArray(mat) ? mat[0] : mat;
    if (m0 && m0.transparent && (m0.opacity ?? 1) < 0.5) continue;
    if (exclude.some((root) => isDescendant(o, root))) continue;
    return false;
  }
  return true;
}

function faceIsClear(scene: THREE.Scene, cam: THREE.Vector3, h: HeadInfo, exclude: THREE.Object3D[]): boolean {
  const r = h.radius;
  const probes = [h.center, h.center.clone().addScaledVector(UP, r * 0.55), h.center.clone().addScaledVector(UP, -r * 0.85)];
  return probes.every((p) => lineIsClear(scene, cam, p, r * 0.45, exclude));
}

interface Acceptance {
  /** Characters that may be near / in the foreground (e.g. the listener in an over-the-shoulder). */
  allowNear?: CharacterRig[];
  /** Minimum facing dot (subject forward · direction to camera). */
  minFacing?: number;
  /** Masters: only reject heads that are very close to the lens, not mere foreground. */
  master?: boolean;
  /** Other heads in frame must be at least this multiple of the subject distance away (default 0.8). */
  foreground?: number;
  /** Characters allowed in the foreground (over-the-shoulder edge) but still not right against the lens. */
  relaxed?: CharacterRig[];
  /** Maximum downward look angle onto the subject (radians). */
  maxElevation?: number;
}

/** Returns a score (higher is better) or null when the candidate camera is unusable. */
function evaluate(
  input: DirectorShotInput,
  pos: THREE.Vector3,
  look: THREE.Vector3,
  subjects: HeadInfo[],
  heads: HeadInfo[],
  fov: number,
  opts: Acceptance = {},
): number | null {
  if (!insideRoom(pos, input.room)) return null;
  const allowNear = opts.allowNear ?? [];
  const subjectRigs = subjects.map((s) => s.rig.root);
  const exclude = [...subjectRigs, ...allowNear.map((r) => r.root)];

  probeCam.fov = fov;
  probeCam.aspect = input.aspect;
  probeCam.near = 0.05;
  probeCam.far = 60;
  probeCam.position.copy(pos);
  probeCam.up.copy(UP);
  probeCam.lookAt(look);
  probeCam.updateMatrixWorld(true);
  probeCam.updateProjectionMatrix();
  projMat.multiplyMatrices(probeCam.projectionMatrix, probeCam.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projMat);

  let facingScore = 0;
  let subjectDist = Infinity;
  for (const s of subjects) {
    if (!frustum.containsPoint(s.center)) return null;
    const toCam = pos.clone().sub(s.center);
    const d = toCam.length();
    if (opts.maxElevation !== undefined) {
      const horiz = Math.hypot(toCam.x, toCam.z);
      if (Math.atan2(toCam.y, Math.max(1e-3, horiz)) > opts.maxElevation) return null;
    }
    subjectDist = Math.min(subjectDist, d);
    toCam.y = 0;
    toCam.normalize();
    const facing = facingDir(s.rig).dot(toCam);
    if (facing < (opts.minFacing ?? 0.15)) return null;
    facingScore += facing;
    if (!faceIsClear(input.scene, pos, s, exclude)) return null;
  }

  for (const h of heads) {
    if (subjects.some((s) => s.rig === h.rig) || allowNear.includes(h.rig)) continue;
    const d = pos.distanceTo(h.center);
    if (opts.relaxed?.includes(h.rig)) {
      if (d < h.radius * 2.8) return null;
      continue;
    }
    if (d < h.radius * (opts.master ? 4.5 : 3.6)) return null; // head right next to the lens
    if (!opts.master && frustum.intersectsSphere(new THREE.Sphere(h.center, h.radius))) {
      if (d < subjectDist * 0.8) return null; // big out-of-focus head in the foreground
      if (d < subjectDist * (opts.foreground ?? 0.8)) {
        // A neighbour at about the subject's depth is fine when fully in frame and not covering the face.
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(fov * 0.5));
        const ndc = h.center.clone().project(probeCam);
        const rad = h.radius / d / tanHalf;
        if (Math.abs(ndc.x) + rad / input.aspect > 0.96 || Math.abs(ndc.y) + rad > 0.96) return null;
        for (const s of subjects) {
          const sn = s.center.clone().project(probeCam);
          const sRad = s.radius / pos.distanceTo(s.center) / tanHalf;
          const dx = (ndc.x - sn.x) * input.aspect;
          const dy = ndc.y - sn.y;
          if (Math.hypot(dx, dy) < (rad + sRad) * 0.9) return null;
        }
      }
    }
  }
  return facingScore / Math.max(1, subjects.length);
}

function planSingle(input: DirectorShotInput, head: HeadInfo, heads: HeadInfo[], framing: number, heightBias: number, fov: number): ShotPlan | null {
  const r = head.radius;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(fov * 0.5));
  const baseDist = (framing * r) / tanHalf;
  const yaw0 = facingYaw(head.rig);
  // Look slightly below the head centre so shoulders read and the crown keeps headroom.
  const lookOffset = new THREE.Vector3(0, -r * 0.35, 0);
  const look = head.center.clone().add(lookOffset);
  const yawOffsets = [0.22, -0.22, 0.45, -0.45, 0, 0.7, -0.7, 0.95, -0.95];
  const distScales = [1, 0.86, 1.15, 0.74, 0.62];
  const lifts = [0, r * 0.5, r * 1.1, r * 1.9, r * 3];
  for (const lift of lifts) {
    for (const ds of distScales) {
      for (const yo of yawOffsets) {
        const yaw = yaw0 + yo;
        const d = baseDist * ds;
        // Use the head's own forward (it may lean or turn) rather than the body yaw alone.
        const pos = new THREE.Vector3(look.x + Math.sin(yaw) * d, look.y + r * heightBias + lift, look.z + Math.cos(yaw) * d);
        // Close singles: nobody else may sit between the lens and the subject's depth.
        const score = evaluate(input, pos, look, [head], heads, fov, {
          minFacing: 0.3,
          foreground: 1.08,
          maxElevation: 0.42,
          relaxed: input.listener ? [input.listener] : [],
        });
        if (score === null) continue;
        return { offset: pos.sub(head.center), lookOffset, pushIn: 0.05, punch: false };
      }
    }
  }
  return null;
}

function planTwoShot(input: DirectorShotInput, a: HeadInfo, b: HeadInfo, heads: HeadInfo[], fov: number): ShotPlan | null {
  const mid = a.center.clone().add(b.center).multiplyScalar(0.5);
  const sep = new THREE.Vector3(b.center.x - a.center.x, 0, b.center.z - a.center.z);
  const sepLen = sep.length();
  const perp = sepLen > 1e-3 ? new THREE.Vector3(-sep.z, 0, sep.x).divideScalar(sepLen) : facingDir(a.rig);
  if (perp.dot(facingDir(a.rig)) + perp.dot(facingDir(b.rig)) < 0) perp.negate();
  const r = Math.max(a.radius, b.radius);
  const tanV = Math.tan(THREE.MathUtils.degToRad(fov * 0.5));
  const tanH = tanV * input.aspect;
  const dist = Math.max((sepLen * 0.5 + r * 2.4) / tanH, (Math.abs(a.center.y - b.center.y) * 0.5 + r * 2.6) / tanV);
  const look = mid.clone().addScaledVector(UP, -r * 0.6);
  let best = null as { pos: THREE.Vector3; score: number } | null;
  for (const swing of [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75]) {
    for (const ds of [1, 1.15, 0.9]) {
      for (const lift of [r * 0.5, r * 1.6, r * 2.8]) {
        const dir = perp.clone().applyAxisAngle(UP, swing);
        const pos = look.clone().addScaledVector(dir, dist * ds);
        pos.y += lift;
        const score = evaluate(input, pos, look, [a, b], heads, fov, { minFacing: -0.05 });
        if (score === null) continue;
        const adjusted = score - Math.abs(swing) * 0.2;
        if (!best || adjusted > best.score) best = { pos, score: adjusted };
      }
    }
    if (best && best.score > 0.5) break;
  }
  if (!best) return null;
  return { offset: best.pos.sub(a.center), lookOffset: look.sub(a.center), pushIn: 0.03, punch: false };
}

function planOverShoulder(input: DirectorShotInput, spk: HeadInfo, lst: HeadInfo, heads: HeadInfo[], fov: number): ShotPlan | null {
  const back = lst.center.clone().sub(spk.center);
  back.y = 0;
  if (back.lengthSq() < 1e-4) return null;
  back.normalize();
  const right = new THREE.Vector3(back.z, 0, -back.x);
  const look = spk.center.clone().addScaledVector(UP, -spk.radius * 0.3);
  for (const side of [1, -1]) {
    for (const k of [2.8, 3.4]) {
      const pos = lst.center.clone().addScaledVector(back, lst.radius * k).addScaledVector(right, side * lst.radius * 1.6);
      pos.y += lst.radius * 0.6;
      if (evaluate(input, pos, look, [spk], heads, fov, { allowNear: [lst.rig], minFacing: 0.2 }) === null) continue;
      return { offset: pos.sub(spk.center), lookOffset: look.sub(spk.center), pushIn: 0.02, punch: false };
    }
  }
  return null;
}

/** High-corner master shot chosen so the speaker's face reads and the whole class is in frame. */
function planMaster(input: DirectorShotInput, spk: HeadInfo, heads: HeadInfo[], fov: number): ShotPlan {
  const { room } = input;
  const y = room.height - 0.45;
  const ix = room.halfWidth - 0.5;
  const iz = room.halfDepth - 0.5;
  const candidates = [
    new THREE.Vector3(ix, y, iz), new THREE.Vector3(-ix, y, iz), new THREE.Vector3(0.6, y, iz),
    new THREE.Vector3(ix, y, -iz), new THREE.Vector3(-ix, y, -iz), new THREE.Vector3(-0.6, y, -iz + 0.2),
    new THREE.Vector3(ix, y - 0.4, 0), new THREE.Vector3(-ix, y - 0.4, 0),
  ];
  // Aim between the speaker and the middle of the cast so the room composition stays balanced.
  const centroid = heads.reduce((acc, h) => acc.add(h.center), new THREE.Vector3()).divideScalar(Math.max(1, heads.length));
  let best = null as { pos: THREE.Vector3; look: THREE.Vector3; score: number } | null;
  for (const pos of candidates) {
    const look = spk.center.clone().multiplyScalar(0.6).add(centroid.clone().multiplyScalar(0.4));
    look.y = Math.min(spk.center.y, 1.05);
    const score = evaluate(input, pos, look, [spk], heads, fov, { minFacing: 0.2, master: true });
    if (score === null) continue;
    // Prefer seeing the speaker's face square-on.
    if (!best || score > best.score) best = { pos, look, score };
  }
  if (!best) {
    const pos = candidates[0];
    const look = spk.center.clone();
    look.y = 1.0;
    best = { pos, look, score: 0 };
  }
  return { offset: new THREE.Vector3(), lookOffset: new THREE.Vector3(), fixedPos: best.pos, fixedLook: best.look, pushIn: 0.025, punch: false };
}

export function updateDirectorCamera(rig: CameraRig, state: DirectorState, job: RenderJobJson, input: DirectorShotInput): void {
  const fov = rig.baseFov;
  input.scene.updateMatrixWorld(true);
  const spkHead = measureHead(input.speaker);
  const shot = input.shot || 'auto';

  if (input.cut || !state.plan) {
    const heads = input.everyone.filter((r) => r.root.visible).map(measureHead);
    const lstHead = input.listener ? measureHead(input.listener) : undefined;
    let plan: ShotPlan | null = null;
    if (shot === 'closeUpSpeaker') {
      plan = planSingle(input, spkHead, heads, 1.6, 0.1, fov);
    } else if (shot === 'reactionZoom') {
      plan = planSingle(input, spkHead, heads, 1.3, 0.05, fov);
    } else if (shot === 'crashPunch') {
      plan = planSingle(input, spkHead, heads, 1.4, 0.05, fov);
      if (plan) plan.punch = true;
    } else if (shot === 'lowDramatic') {
      plan = planSingle(input, spkHead, heads, 1.9, -1.2, fov);
    } else if (shot === 'twoShot' && lstHead) {
      plan = planTwoShot(input, spkHead, lstHead, heads, fov);
    } else if (shot === 'overShoulder' && lstHead) {
      plan = planOverShoulder(input, spkHead, lstHead, heads, fov);
    }
    // Graceful fallbacks: a looser single, then the high master; never a blocked or back-of-head shot.
    if (!plan && shot !== 'wideEstablishing' && shot !== 'auto') {
      plan = planSingle(input, spkHead, heads, 2.2, 0.3, fov);
    }
    state.plan = plan ?? planMaster(input, spkHead, heads, fov);
  }

  const plan = state.plan;
  let pos: THREE.Vector3;
  let look: THREE.Vector3;
  if (plan.fixedPos && plan.fixedLook) {
    pos = plan.fixedPos.clone();
    look = plan.fixedLook.clone();
  } else {
    pos = spkHead.center.clone().add(plan.offset);
    look = spkHead.center.clone().add(plan.lookOffset);
  }

  // Slow, steady push-in across the line; crash-punch snaps in during the first fifth of the line.
  const ease = (x: number) => x * x * (3 - 2 * x);
  let push = plan.pushIn * ease(Math.max(0, Math.min(1, input.turnLocal)));
  if (plan.punch) {
    const k = Math.min(1, input.turnLocal / 0.2);
    push = -0.25 + 0.31 * (1 - Math.pow(1 - k, 3));
  }
  pos.lerp(look, push);

  if (input.cut) {
    rig.currentPos.copy(pos);
    rig.currentLook.copy(look);
  } else {
    // Heavy damping absorbs head bob so the frame never shakes with the character.
    const alpha = 1 - Math.exp(-2.2 / Math.max(1, job.fps));
    rig.currentPos.lerp(pos, alpha);
    rig.currentLook.lerp(look, alpha);
  }
  rig.camera.fov = fov;
  rig.camera.updateProjectionMatrix();
  rig.camera.position.copy(rig.currentPos);
  rig.camera.up.copy(UP);
  rig.camera.lookAt(rig.currentLook);
}
