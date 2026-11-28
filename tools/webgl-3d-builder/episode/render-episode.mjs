#!/usr/bin/env node
/**
 * AnimStudio episode renderer: script JSON -> finished 3D comedy MP4.
 *
 *   node tools/webgl-3d-builder/episode/render-episode.mjs --episode <episode.json> --out <video.mp4>
 *        [--width 1920 --height 1080 --fps 24] [--preview-frames 0,240,480] [--no-subtitles]
 *
 * Pipeline (all local except the keyless Google Translate TTS the app already uses):
 *  1. Synthesises every line with gTTS, then gives each character their own voice by pitch/tempo shift.
 *  2. Lays the lines on a timeline (with per-line pauses) and computes a per-frame lip-sync envelope.
 *  3. Builds a RenderJobJson for the WebGL 3D engine (named spots, actions, emotions, camera shots).
 *  4. Renders frames headlessly (render-3d-frames.mjs) straight into FFmpeg.
 *  5. Mixes dialogue + optional SFX/BGM and burns Hindi subtitles.
 *
 * Episode JSON shape: see episode/episodes/exam-hall-jugaad.json.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..', '..');
const RENDERER = path.join(REPO, 'backend', 'AnimStudio.Infrastructure', 'Rendering', 'WebGl3D', 'render-3d-frames.mjs');
const SFX_DIR = path.join(REPO, 'backend', 'AnimStudio.Api', 'wwwroot', 'sfx', 'memes');
const SAMPLE_RATE = 44100;

const ALLOWED_SHOTS = new Set(['auto', 'wideEstablishing', 'twoShot', 'closeUpSpeaker', 'reactionZoom', 'crashPunch', 'overShoulder', 'lowDramatic']);
const SFX_NAME = /^[a-z0-9_]{1,40}$/;

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function fail(msg) {
  console.error(`render-episode: ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: opts.stdio ?? ['ignore', 'pipe', 'pipe'], cwd: opts.cwd, windowsHide: true });
    const out = [];
    let err = '';
    p.stdout?.on('data', (d) => out.push(d));
    p.stderr?.on('data', (d) => { if (err.length < 20000) err += d.toString(); });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${cmd} exited ${code}: ${err.slice(-2000)}`))));
  });
}

function findBrowser() {
  const candidates = [
    process.env.ANIMSTUDIO_BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c));
}

// ---------- validation ----------
function validateEpisode(ep) {
  if (!ep || typeof ep !== 'object') fail('episode must be a JSON object');
  if (!Array.isArray(ep.cast) || ep.cast.length < 2 || ep.cast.length > 18) fail('cast must have 2-18 characters');
  if (!Array.isArray(ep.lines) || ep.lines.length === 0 || ep.lines.length > 400) fail('lines must have 1-400 entries');
  const names = new Set();
  for (const c of ep.cast) {
    if (typeof c.name !== 'string' || !c.name.trim() || c.name.length > 40) fail('each cast member needs a name (<=40 chars)');
    if (names.has(c.name)) fail(`duplicate cast name ${c.name}`);
    names.add(c.name);
  }
  for (const [i, l] of ep.lines.entries()) {
    if (!names.has(l.speaker)) fail(`line ${i}: unknown speaker ${l.speaker}`);
    if (l.to && !names.has(l.to)) fail(`line ${i}: unknown listener ${l.to}`);
    if (typeof l.text !== 'string' || !l.text.trim() || l.text.length > 600) fail(`line ${i}: text must be 1-600 chars`);
    if (l.shot && !ALLOWED_SHOTS.has(l.shot)) fail(`line ${i}: unknown shot ${l.shot}`);
    if (l.sfx && !SFX_NAME.test(l.sfx)) fail(`line ${i}: invalid sfx name`);
    for (const k of Object.keys(l.spots ?? {})) if (!names.has(k)) fail(`line ${i}: spots refers to unknown ${k}`);
    for (const k of Object.keys(l.acts ?? {})) if (!names.has(k)) fail(`line ${i}: acts refers to unknown ${k}`);
  }
}

// ---------- TTS ----------
function splitChunks(text, max = 180) {
  const parts = text.split(/(?<=[।!?.,])\s+/);
  const chunks = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).trim().length > max && cur) { chunks.push(cur.trim()); cur = p; }
    else cur = `${cur} ${p}`;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function fetchTts(text, lang, cacheDir) {
  const key = crypto.createHash('sha256').update(`${lang}|${text}`).digest('hex').slice(0, 24);
  const file = path.join(cacheDir, `${key}.mp3`);
  if (fs.existsSync(file) && fs.statSync(file).size > 500) return file;
  const bufs = [];
  for (const chunk of splitChunks(text)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(chunk)}`;
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const b = Buffer.from(await resp.arrayBuffer());
        if (b.length < 300) throw new Error('empty audio');
        bufs.push(b);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    if (lastErr) throw new Error(`TTS failed for "${chunk.slice(0, 30)}…": ${lastErr.message}`);
  }
  fs.writeFileSync(file, Buffer.concat(bufs));
  return file;
}

/** Decode + voice-shape a line to mono float32 PCM. pitch>1 = higher/younger, tempo>1 = faster. */
async function decodeVoice(mp3, voice) {
  const pitch = Math.min(1.6, Math.max(0.6, voice?.pitch ?? 1));
  const tempo = Math.min(1.8, Math.max(0.6, voice?.tempo ?? 1.1));
  const atempo = tempo / pitch;
  const tempoChain = [];
  let rem = atempo;
  while (rem > 2) { tempoChain.push('atempo=2'); rem /= 2; }
  while (rem < 0.5) { tempoChain.push('atempo=0.5'); rem /= 0.5; }
  tempoChain.push(`atempo=${rem.toFixed(4)}`);
  const filters = [
    `aresample=${SAMPLE_RATE}`,
    `asetrate=${Math.round(SAMPLE_RATE * pitch)}`,
    `aresample=${SAMPLE_RATE}`,
    ...tempoChain,
    // trim gTTS leading/trailing silence so timing is tight
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02',
    'areverse',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
    'areverse',
    voice?.warmth ? 'bass=g=4:f=180' : 'anull',
    'loudnorm=I=-17:TP=-2:LRA=7',
    `aresample=${SAMPLE_RATE}`,
  ];
  const raw = await run('ffmpeg', ['-v', 'error', '-i', mp3, '-af', filters.join(','), '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', '-']);
  return new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));
}

async function decodeFile(file) {
  const raw = await run('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', '-']);
  return new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));
}

// ---------- subtitles ----------
function assTime(s) {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const sec = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}
function assEscape(t) {
  return t.replace(/\\/g, '\\\\').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\r?\n/g, '\\N');
}
function assColor(hex) {
  const h = (hex || '#ffd400').replace('#', '');
  return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}&`;
}
function buildAss(ep, timeline, width, height, titleEnd) {
  const fs1 = Math.round(height * 0.052);
  const lines = [
    '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${width}`, `PlayResY: ${height}`, 'WrapStyle: 0', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Sub,Nirmala UI,${fs1},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(fs1 * 0.09))},1,2,60,60,${Math.round(height * 0.05)},1`,
    `Style: Title,Nirmala UI,${Math.round(height * 0.095)},&H0000D7FF,&H00FFFFFF,&H00101010,&H96000000,1,0,0,0,100,100,0,0,1,${Math.round(height * 0.009)},3,5,60,60,0,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  if (ep.title) lines.push(`Dialogue: 1,${assTime(0.1)},${assTime(titleEnd)},Title,,0,0,0,,{\\fad(250,300)}${assEscape(ep.title)}`);
  const castColor = Object.fromEntries(ep.cast.map((c) => [c.name, c.subtitleColor]));
  for (const t of timeline) {
    const who = ep.cast.find((c) => c.name === t.speaker);
    const label = `{\\c${assColor(castColor[t.speaker])}}${assEscape(who?.displayName ?? t.speaker)}:{\\c&H00FFFFFF&} `;
    lines.push(`Dialogue: 0,${assTime(t.start)},${assTime(t.end + 0.15)},Sub,,0,0,0,,${label}${assEscape(t.subtitle ?? t.text)}`);
  }
  return lines.join('\n') + '\n';
}

// ---------- main ----------
async function main() {
  const args = parseArgs(process.argv);
  if (!args.episode || !args.out) fail('usage: --episode <file.json> --out <file.mp4>');
  const episodePath = path.resolve(String(args.episode));
  const outPath = path.resolve(String(args.out));
  if (!/\.mp4$/i.test(outPath)) fail('--out must end with .mp4');
  const ep = JSON.parse(fs.readFileSync(episodePath, 'utf8'));
  validateEpisode(ep);

  const width = Number(args.width ?? ep.width ?? 1920) | 0;
  const height = Number(args.height ?? ep.height ?? 1080) | 0;
  const fps = Number(args.fps ?? ep.fps ?? 24) | 0;
  if (width < 320 || width > 3840 || height < 320 || height > 3840 || fps < 12 || fps > 60) fail('size/fps out of range');
  const browser = findBrowser();
  if (!browser) fail('no Edge/Chrome found (set ANIMSTUDIO_BROWSER)');

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'animstudio-episode-'));
  const cacheDir = path.join(os.tmpdir(), 'animstudio-tts-cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`[episode] work dir ${work}`);

  // 1) voices
  const castByName = Object.fromEntries(ep.cast.map((c) => [c.name, c]));
  const clips = [];
  for (const [i, line] of ep.lines.entries()) {
    const mp3 = await fetchTts(line.say ?? line.text, ep.language ?? 'hi', cacheDir);
    const pcm = await decodeVoice(mp3, castByName[line.speaker].voice);
    clips.push(pcm);
    process.stdout.write(`\r[episode] voiced ${i + 1}/${ep.lines.length}`);
  }
  process.stdout.write('\n');

  // 2) timeline
  const titleEnd = ep.title ? Number(ep.titleSeconds ?? 2.6) : 0.6;
  let cursor = titleEnd + 0.25;
  const timeline = ep.lines.map((line, i) => {
    const dur = clips[i].length / SAMPLE_RATE;
    const start = cursor + Math.max(0, Number(line.delayBefore ?? 0));
    const end = start + dur;
    cursor = end + Math.max(0.12, Number(line.pauseAfter ?? ep.defaultPause ?? 0.38));
    return { ...line, index: i + 1, start, end };
  });
  const duration = cursor + Number(ep.tailSeconds ?? 1.6);
  const totalFrames = Math.ceil(duration * fps);
  const totalSamples = Math.ceil(duration * SAMPLE_RATE);

  const dialogue = new Float32Array(totalSamples);
  timeline.forEach((t, i) => {
    const off = Math.round(t.start * SAMPLE_RATE);
    dialogue.set(clips[i].subarray(0, Math.max(0, Math.min(clips[i].length, totalSamples - off))), off);
  });

  // lip-sync envelope per frame (RMS of dialogue, normalised, gently smoothed)
  const spf = SAMPLE_RATE / fps;
  const env = new Array(totalFrames).fill(0);
  let peak = 1e-6;
  for (let f = 0; f < totalFrames; f++) {
    const a = Math.floor(f * spf);
    const b = Math.min(totalSamples, Math.floor((f + 1) * spf));
    let s = 0;
    for (let k = a; k < b; k++) s += dialogue[k] * dialogue[k];
    env[f] = Math.sqrt(s / Math.max(1, b - a));
    peak = Math.max(peak, env[f]);
  }
  for (let f = 0; f < totalFrames; f++) env[f] = Math.min(1, (env[f] / peak) * 1.6);
  for (let f = 1; f < totalFrames; f++) env[f] = env[f] * 0.65 + env[f - 1] * 0.35;

  // SFX + optional BGM bed
  const mix = Float32Array.from(dialogue);
  for (const t of timeline) {
    if (!t.sfx) continue;
    const file = path.join(SFX_DIR, `${t.sfx}.wav`);
    if (!fs.existsSync(file)) { console.warn(`[episode] sfx ${t.sfx} not found, skipped`); continue; }
    const pcm = await decodeFile(file);
    const off = Math.round(Math.max(0, t.start - Number(t.sfxLead ?? 0.15)) * SAMPLE_RATE);
    const gain = Number(t.sfxGain ?? 0.55);
    for (let k = 0; k < pcm.length && off + k < totalSamples; k++) mix[off + k] += pcm[k] * gain;
  }
  if (ep.bgm) {
    const bgmPath = path.resolve(path.dirname(episodePath), String(ep.bgm));
    if (fs.existsSync(bgmPath)) {
      const pcm = await decodeFile(bgmPath);
      const gain = Number(ep.bgmGain ?? 0.1);
      for (let k = 0; k < totalSamples; k++) {
        const speaking = env[Math.min(totalFrames - 1, Math.floor(k / spf))] > 0.05;
        mix[k] += pcm[k % pcm.length] * gain * (speaking ? 0.55 : 1); // duck under dialogue
      }
    }
  }
  for (let k = 0; k < totalSamples; k++) mix[k] = Math.max(-0.98, Math.min(0.98, mix[k]));
  const audioRaw = path.join(work, 'mix.f32');
  fs.writeFileSync(audioRaw, Buffer.from(mix.buffer));

  // 3) 3D render job
  const lead = ep.cast;
  const profile = (c) => ({
    slot: c === lead[0] ? 'Left' : c === lead[1] ? 'Right' : 'Narrator',
    name: c.name,
    role: c.role ?? 'ComicBobble',
    robeHex: c.robeHex ?? null,
    hasGlasses: c.hasGlasses ?? false,
    shirtPattern: c.shirtPattern ?? 'solid',
    mustache: c.mustache ?? 'none',
    hairStyle: c.hairStyle ?? null,
    hairHex: c.hairHex ?? null,
    skinHex: c.skinHex ?? null,
    scale: c.scale ?? null,
    defaultSpot: c.spot ?? null,
  });
  const spotState = Object.fromEntries(ep.cast.map((c) => [c.name, c.spot ?? 'hidden']));
  const actState = {};
  const turns = [];
  if (ep.title) {
    turns.push({ index: 0, startSeconds: 0, endSeconds: titleEnd, slot: 'Narrator', speakerName: lead[0].name, text: ep.title, isTitleHook: true, cameraShot: 'wideEstablishing', characterSpots: { ...spotState } });
  }
  for (const t of timeline) {
    Object.assign(spotState, t.spots ?? {});
    for (const [k, v] of Object.entries(t.acts ?? {})) {
      if (v) actState[k] = v; else delete actState[k];
    }
    const slot = t.speaker === lead[0].name ? 'Left' : t.speaker === lead[1].name ? 'Right' : 'Narrator';
    turns.push({
      index: t.index,
      startSeconds: +t.start.toFixed(3),
      endSeconds: +t.end.toFixed(3),
      slot,
      speakerName: t.speaker,
      listenerName: t.to ?? null,
      text: t.text,
      isTitleHook: false,
      emotion: t.emotion ?? 'calm',
      listenerEmotion: t.listenerEmotion ?? null,
      action: t.action ?? null,
      listenerAction: t.listenerAction ?? null,
      cameraShot: t.shot ?? 'closeUpSpeaker',
      speakerProp: t.prop ?? null,
      listenerProp: t.listenerProp ?? null,
      sfxCue: null,
      characterSpots: { ...spotState },
      characterActions: { ...actState },
    });
  }
  const job = {
    width, height, fps,
    durationSeconds: +duration.toFixed(3),
    totalFrames,
    seed: Number(ep.seed ?? 7),
    theme: 'ComedyStage3D',
    vfxStyle: 'Auto',
    enableDynamicCamera: true,
    isSeamlessLoop: false,
    isComedyMode: true,
    title: ep.title ?? '',
    footerLabel: ep.channelLabel ?? null,
    showWatermark: ep.watermark !== false,
    palette: {
      primaryHex: '#f59e0b', secondaryHex: '#38bdf8', speakerAHex: '#2563eb', speakerBHex: '#dc2626',
      topBackdropHex: '#0f172a', midBackdropHex: '#1e293b', botBackdropHex: '#0f172a',
    },
    hasCharacters: true,
    leftCharacter: profile(lead[0]),
    rightCharacter: profile(lead[1]),
    supportingCast: lead.slice(2).map(profile),
    turns,
    memeCues: [],
    sceneRuns: [{ startSeconds: 0, endSeconds: +duration.toFixed(3), setting: ep.setting ?? 'Classroom', timeOfDay: 'Day', sceneIndex: 0 }],
    speechEnvelope: env.map((v) => +v.toFixed(3)),
    backdropCount: 0,
    stageLayout: null,
    sceneBlueprint: ep.sceneBlueprint ?? null,
  };

  // Preview stills: render selected frames only and save PNGs (fast iteration on framing/looks)
  if (args['preview-frames']) {
    const frames = String(args['preview-frames']).split(',').map((s) => s.trim()).filter(Boolean).map((s) => (s.endsWith('s') ? Math.round(parseFloat(s) * fps) : parseInt(s, 10)));
    const outDir = outPath.replace(/\.mp4$/i, '_preview');
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of frames) {
      const warm = Math.max(0, f - Math.round(fps * 0.6));
      const pj = { ...job, startFrame: warm, endFrame: f + 1 };
      const jp = path.join(work, `job_${f}.json`);
      fs.writeFileSync(jp, JSON.stringify(pj));
      const raw = await run('node', [RENDERER, '--job', jp, '--browser', browser]);
      const fb = width * height * 4;
      const last = raw.subarray(raw.length - fb);
      const rawFile = path.join(work, `f${f}.rgba`);
      fs.writeFileSync(rawFile, last);
      await run('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-i', rawFile, '-frames:v', '1', path.join(outDir, `frame_${String(f).padStart(5, '0')}.png`)]);
      console.log(`[episode] preview frame ${f} (${(f / fps).toFixed(1)}s)`);
    }
    fs.writeFileSync(path.join(outDir, 'job.json'), JSON.stringify(job));
    fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify(timeline.map((t) => ({ i: t.index, s: +t.start.toFixed(2), e: +t.end.toFixed(2), who: t.speaker, shot: t.shot })), null, 1));
    return;
  }

  const jobPath = path.join(work, 'job.json');
  fs.writeFileSync(jobPath, JSON.stringify(job));
  const assPath = path.join(work, 'subs.ass');
  fs.writeFileSync(assPath, buildAss(ep, timeline, width, height, titleEnd), 'utf8');

  // 4) render frames -> ffmpeg (video + audio + burned subtitles)
  console.log(`[episode] rendering ${totalFrames} frames (${duration.toFixed(1)}s) at ${width}x${height}@${fps}`);
  const vf = args['no-subtitles'] ? 'format=yuv420p' : 'ass=subs.ass,format=yuv420p';
  const ff = spawn('ffmpeg', [
    '-v', 'error', '-y',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', '-',
    '-f', 'f32le', '-ar', String(SAMPLE_RATE), '-ac', '1', '-i', 'mix.f32',
    '-vf', vf,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-ac', '2',
    '-shortest', '-movflags', '+faststart', outPath,
  ], { cwd: work, stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
  const rend = spawn('node', [RENDERER, '--job', jobPath, '--browser', browser], { stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
  let bytes = 0;
  const frameBytes = width * height * 4;
  const t0 = Date.now();
  rend.stdout.on('data', (d) => {
    bytes += d.length;
    const f = Math.floor(bytes / frameBytes);
    if (f % 48 === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r[episode] frame ${f}/${totalFrames}  ${(f / Math.max(1, el)).toFixed(1)} fps  `);
    }
  });
  rend.stdout.pipe(ff.stdin);
  const rendCode = await new Promise((r) => rend.on('close', r));
  const ffCode = await new Promise((r) => ff.on('close', r));
  process.stdout.write('\n');
  if (rendCode !== 0) fail(`3D renderer failed (code ${rendCode})`);
  if (ffCode !== 0) fail(`ffmpeg failed (code ${ffCode})`);
  fs.writeFileSync(outPath.replace(/\.mp4$/i, '.timeline.json'), JSON.stringify(timeline.map((t) => ({ i: t.index, start: +t.start.toFixed(2), end: +t.end.toFixed(2), speaker: t.speaker, shot: t.shot, text: t.text })), null, 1));
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`[episode] done -> ${outPath}`);
}

main().catch((e) => fail(e?.stack ?? String(e)));
