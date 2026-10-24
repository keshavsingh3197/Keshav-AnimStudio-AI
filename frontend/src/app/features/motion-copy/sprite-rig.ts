import { MotionPoint, POSE } from '../live-camera/motion';

/**
 * 2D skinned-sprite animation: one picture of a character is cut into a mesh, every vertex is
 * tied to the nearby bones, and moving the bones bends the picture. This is how "animated
 * drawings" tools work; it keeps the character's real look, unlike a cartoon puppet.
 *
 * Retargeting copies each bone's *direction* from the driving video and keeps the character's
 * own bone lengths, so a differently proportioned character never stretches.
 *
 * The maths here has no browser APIs; WebGL lives in SpriteRenderer below.
 */

export interface V2 {
  x: number;
  y: number;
}

export type JointName = 'lS' | 'rS' | 'lE' | 'rE' | 'lW' | 'rW' | 'lH' | 'rH' | 'lK' | 'rK' | 'lA' | 'rA' | 'head';
export type Joints = Partial<Record<JointName, V2>>;
export type FullJoints = Record<JointName, V2>;
export type BoneId = 'torso' | 'head' | 'lUA' | 'lFA' | 'rUA' | 'rFA' | 'lTh' | 'lSh' | 'rTh' | 'rSh';

const JOINT_NAMES: readonly JointName[] = ['lS', 'rS', 'lE', 'rE', 'lW', 'rW', 'lH', 'rH', 'lK', 'rK', 'lA', 'rA', 'head'];

const POSE_INDEX: Record<Exclude<JointName, 'head'>, number> = {
  lS: POSE.leftShoulder,
  rS: POSE.rightShoulder,
  lE: POSE.leftElbow,
  rE: POSE.rightElbow,
  lW: POSE.leftWrist,
  rW: POSE.rightWrist,
  lH: POSE.leftHip,
  rH: POSE.rightHip,
  lK: POSE.leftKnee,
  rK: POSE.rightKnee,
  lA: POSE.leftAnkle,
  rA: POSE.rightAnkle,
};

/** Reads the joints a pose model is confident about, in pixels of a w x h picture. */
export function readJoints(points: readonly MotionPoint[], w: number, h: number, minVisible: number): Joints {
  const out: Joints = {};
  for (const name of JOINT_NAMES) {
    if (name === 'head') continue;
    const p = points[POSE_INDEX[name]];
    if (p && p.v >= minVisible) out[name] = { x: p.x * w, y: p.y * h };
  }
  const le = points[POSE.leftEar];
  const re = points[POSE.rightEar];
  const nose = points[POSE.nose];
  if (le && re && le.v >= minVisible && re.v >= minVisible) out.head = { x: ((le.x + re.x) / 2) * w, y: ((le.y + re.y) / 2) * h };
  else if (nose && nose.v >= minVisible) out.head = { x: nose.x * w, y: nose.y * h };
  return out;
}

const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
const mid = (a: V2, b: V2): V2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const len = (a: V2): number => Math.hypot(a.x, a.y);
const angle = (from: V2, to: V2): number => Math.atan2(to.y - from.y, to.x - from.x);
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const turn = (v: V2, cos: number, sin: number): V2 => ({ x: cos * v.x - sin * v.y, y: sin * v.x + cos * v.y });
const beyond = (from: V2, to: V2, f: number): V2 => ({ x: to.x + (to.x - from.x) * f, y: to.y + (to.y - from.y) * f });

function distanceToSegment(p: V2, a: V2, b: V2): number {
  const ab = sub(b, a);
  const l2 = ab.x * ab.x + ab.y * ab.y;
  const t = l2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / l2));
  return Math.hypot(p.x - (a.x + ab.x * t), p.y - (a.y + ab.y * t));
}

/** A bone's move: rotate about its rest start `a0` and put that point at `a1`. */
export interface BoneXform {
  a0: V2;
  a1: V2;
  cos: number;
  sin: number;
}

interface Bone {
  id: BoneId;
  a: V2;
  b: V2;
  /** How far from the bone's line its skin reaches, in picture pixels. */
  r: number;
}

export class SpriteRig {
  readonly bones: readonly Bone[];
  readonly hipMid: V2;
  readonly torsoLength: number;
  private readonly delta: Record<BoneId, number> = {
    torso: 0, head: 0, lUA: 0, lFA: 0, rUA: 0, rFA: 0, lTh: 0, lSh: 0, rTh: 0, rSh: 0,
  };

  constructor(readonly rest: FullJoints) {
    const sw = Math.max(8, len(sub(rest.lS, rest.rS)));
    const shMid = mid(rest.lS, rest.rS);
    this.hipMid = mid(rest.lH, rest.rH);
    this.torsoLength = Math.max(8, len(sub(shMid, this.hipMid)));

    this.bones = [
      { id: 'torso', a: beyond(shMid, this.hipMid, 0.1), b: shMid, r: sw * 0.7 },
      { id: 'head', a: shMid, b: beyond(shMid, rest.head, 0.8), r: sw * 0.55 },
      { id: 'lUA', a: rest.lS, b: rest.lE, r: sw * 0.3 },
      { id: 'lFA', a: rest.lE, b: beyond(rest.lE, rest.lW, 0.3), r: sw * 0.26 },
      { id: 'rUA', a: rest.rS, b: rest.rE, r: sw * 0.3 },
      { id: 'rFA', a: rest.rE, b: beyond(rest.rE, rest.rW, 0.3), r: sw * 0.26 },
      { id: 'lTh', a: rest.lH, b: rest.lK, r: sw * 0.4 },
      { id: 'lSh', a: rest.lK, b: beyond(rest.lK, rest.lA, 0.35), r: sw * 0.32 },
      { id: 'rTh', a: rest.rH, b: rest.rK, r: sw * 0.4 },
      { id: 'rSh', a: rest.rK, b: beyond(rest.rK, rest.rA, 0.35), r: sw * 0.32 },
    ];
  }

  /** Every joint of the body is needed to rig a character; null says one is missing. */
  static complete(joints: Joints): FullJoints | null {
    for (const name of JOINT_NAMES) if (!joints[name]) return null;
    return joints as FullJoints;
  }

  /** How strongly each bone pulls on a point of the picture; the weights add up to 1. */
  weights(x: number, y: number, into: Float32Array, offset: number): void {
    const p = { x, y };
    let total = 0;
    let nearest = 0;
    let nearestD = Infinity;
    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i];
      const d = distanceToSegment(p, bone.a, bone.b) / bone.r;
      if (d < nearestD) {
        nearestD = d;
        nearest = i;
      }
      const w = Math.exp(-2.2 * d * d);
      into[offset + i] = w;
      total += w;
    }
    if (total < 1e-4) {
      for (let i = 0; i < this.bones.length; i++) into[offset + i] = i === nearest ? 1 : 0;
      return;
    }
    for (let i = 0; i < this.bones.length; i++) into[offset + i] /= total;
  }

  /**
   * The bone moves that put the character in the driver's pose. `offset` moves the whole body
   * (in the character's own pixels). A joint the video can't see keeps its last direction.
   */
  pose(driver: Joints, offset: V2): BoneXform[] {
    const r = this.rest;
    const out = new Map<BoneId, BoneXform>();

    if (driver.lS && driver.rS && driver.lH && driver.rH) {
      this.delta.torso = wrap(angle(mid(driver.lH, driver.rH), mid(driver.lS, driver.rS)) - angle(this.hipMid, mid(r.lS, r.rS)));
    }
    const hipT = add(this.hipMid, offset);
    const tc = Math.cos(this.delta.torso);
    const ts = Math.sin(this.delta.torso);
    out.set('torso', { a0: this.hipMid, a1: hipT, cos: tc, sin: ts });
    const onTorso = (p: V2): V2 => add(hipT, turn(sub(p, this.hipMid), tc, ts));

    // One limb bone: pivots on its rest start, placed at `start`; returns where its end lands.
    const limb = (id: BoneId, from: JointName, to: JointName, start: V2): V2 => {
      const a = driver[from];
      const b = driver[to];
      if (a && b) this.delta[id] = wrap(angle(a, b) - angle(r[from], r[to]));
      const cos = Math.cos(this.delta[id]);
      const sin = Math.sin(this.delta[id]);
      out.set(id, { a0: r[from], a1: start, cos, sin });
      return add(start, turn(sub(r[to], r[from]), cos, sin));
    };

    const lShoulder = onTorso(r.lS);
    const rShoulder = onTorso(r.rS);
    limb('lFA', 'lE', 'lW', limb('lUA', 'lS', 'lE', lShoulder));
    limb('rFA', 'rE', 'rW', limb('rUA', 'rS', 'rE', rShoulder));
    limb('lSh', 'lK', 'lA', limb('lTh', 'lH', 'lK', onTorso(r.lH)));
    limb('rSh', 'rK', 'rA', limb('rTh', 'rH', 'rK', onTorso(r.rH)));

    const shMid0 = mid(r.lS, r.rS);
    if (driver.lS && driver.rS && driver.head) {
      this.delta.head = wrap(angle(mid(driver.lS, driver.rS), driver.head) - angle(shMid0, r.head));
    }
    out.set('head', { a0: shMid0, a1: mid(lShoulder, rShoulder), cos: Math.cos(this.delta.head), sin: Math.sin(this.delta.head) });

    return this.bones.map((b) => out.get(b.id)!);
  }
}

/** A grid over the picture, keeping only the cells that hold some of the character. */
export interface Mesh {
  /** Rest positions, x then y per vertex, in picture pixels. */
  rest: Float32Array;
  uv: Float32Array;
  indices: Uint16Array;
  /** Bone weights, one row per vertex. */
  weights: Float32Array;
  /** Where the character is in the picture. */
  bounds: { x: number; y: number; w: number; h: number };
}

export function buildMesh(alpha: Uint8ClampedArray, width: number, height: number, rig: SpriteRig, columns = 44): Mesh {
  const cell = width / columns;
  const rows = Math.ceil(height / cell);
  const vw = columns + 1;
  const vh = rows + 1;

  const rest = new Float32Array(vw * vh * 2);
  const uv = new Float32Array(vw * vh * 2);
  for (let j = 0; j < vh; j++) {
    for (let i = 0; i < vw; i++) {
      const x = Math.min(width, i * cell);
      const y = Math.min(height, j * cell);
      const k = (j * vw + i) * 2;
      rest[k] = x;
      rest[k + 1] = y;
      uv[k] = x / width;
      uv[k + 1] = y / height;
    }
  }

  const used: number[] = [];
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const x0 = Math.floor(i * cell);
      const x1 = Math.min(width, Math.ceil((i + 1) * cell));
      const y0 = Math.floor(j * cell);
      const y1 = Math.min(height, Math.ceil((j + 1) * cell));
      let seen = false;
      for (let y = y0; y < y1 && !seen; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          if (alpha[(y * width + x) * 4 + 3] > 8) {
            seen = true;
            break;
          }
        }
      }
      if (!seen) continue;
      const a = j * vw + i;
      used.push(a, a + 1, a + vw, a + 1, a + vw + 1, a + vw);
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x1);
      maxY = Math.max(maxY, y1);
    }
  }

  const bones = rig.bones.length;
  const weights = new Float32Array(vw * vh * bones);
  for (let v = 0; v < vw * vh; v++) rig.weights(rest[v * 2], rest[v * 2 + 1], weights, v * bones);

  return {
    rest,
    uv,
    indices: new Uint16Array(used),
    weights,
    bounds: { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) },
  };
}

/** Places the picture on the canvas: scale `k` about the rest hips, which land on `screen`. */
export interface View {
  k: number;
  hip: V2;
  screen: V2;
}

/** Moves every vertex by its bones' weighted transforms, then onto the canvas. */
export function skin(mesh: Mesh, xf: readonly BoneXform[], view: View, out: Float32Array): void {
  const n = xf.length;
  const count = mesh.rest.length / 2;
  for (let v = 0; v < count; v++) {
    const x = mesh.rest[v * 2];
    const y = mesh.rest[v * 2 + 1];
    let sx = 0;
    let sy = 0;
    for (let b = 0; b < n; b++) {
      const w = mesh.weights[v * n + b];
      if (w < 0.002) continue;
      const t = xf[b];
      const dx = x - t.a0.x;
      const dy = y - t.a0.y;
      sx += w * (t.cos * dx - t.sin * dy + t.a1.x);
      sy += w * (t.sin * dx + t.cos * dy + t.a1.y);
    }
    out[v * 2] = view.screen.x + view.k * (sx - view.hip.x);
    out[v * 2 + 1] = view.screen.y + view.k * (sy - view.hip.y);
  }
}

/** Draws the skinned mesh with WebGL, over a flat background colour. */
export class SpriteRenderer {
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly positions: WebGLBuffer;
  private readonly texture: WebGLTexture;
  private readonly uvBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly resolution: WebGLUniformLocation;
  private readonly indexCount: number;

  constructor(private readonly canvas: HTMLCanvasElement, picture: HTMLCanvasElement, mesh: Mesh) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true });
    if (!gl) throw new Error('WebGL is not available in this browser. Turn on hardware acceleration, or use Chrome or Edge.');
    this.gl = gl;

    const shader = (type: number, source: string): WebGLShader => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'Shader failed');
      return s;
    };
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, shader(gl.VERTEX_SHADER, `
      attribute vec2 a_pos; attribute vec2 a_uv; uniform vec2 u_res; varying vec2 v_uv;
      void main() { vec2 c = a_pos / u_res * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); v_uv = a_uv; }`));
    gl.attachShader(this.program, shader(gl.FRAGMENT_SHADER, `
      precision mediump float; uniform sampler2D u_tex; varying vec2 v_uv;
      void main() { gl_FragColor = texture2D(u_tex, v_uv); }`));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('Could not start the renderer.');
    gl.useProgram(this.program);
    this.resolution = gl.getUniformLocation(this.program, 'u_res')!;

    this.positions = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.rest.byteLength, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(this.program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.uvBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uv, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(this.program, 'a_uv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    this.indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    this.indexCount = mesh.indices.length;

    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  draw(positions: Float32Array, background: string): void {
    const gl = this.gl;
    const n = parseInt(background.slice(1), 16);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.resolution, this.canvas.width, this.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.positions);
    gl.deleteBuffer(this.uvBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteTexture(this.texture);
    gl.deleteProgram(this.program);
  }
}

