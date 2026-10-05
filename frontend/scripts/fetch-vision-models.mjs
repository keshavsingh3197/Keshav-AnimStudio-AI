// Downloads the on-device face-tracking models used by Camera Studio into vision-models/,
// which the build serves at /vision/models. Each file is pinned to a versioned URL and its
// SHA-256, so a changed or tampered download is refused rather than served.
//
// Runs before `npm start` / `npm run build`; it does nothing when the files are already
// present and correct. Without network access it warns and exits cleanly: the camera page
// then keeps faces covered and says how to fetch the models.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'vision-models');

const MODELS = [
  {
    file: 'face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    sha256: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
  },
  {
    file: 'selfie_segmenter.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
    sha256: '191ac9529ae506ee0beefa6b2c945a172dab9d07d1e802a290a4e4038226658b',
  },
];

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

mkdirSync(root, { recursive: true });
let failed = 0;

for (const model of MODELS) {
  const target = join(root, model.file);
  if (existsSync(target) && sha256(readFileSync(target)) === model.sha256) continue;

  try {
    const response = await fetch(model.url, { redirect: 'error' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const actual = sha256(buffer);
    if (actual !== model.sha256) throw new Error(`checksum mismatch (got ${actual})`);

    writeFileSync(`${target}.part`, buffer);
    renameSync(`${target}.part`, target);
    console.log(`vision: fetched ${model.file} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
  } catch (err) {
    failed++;
    console.warn(`vision: could not fetch ${model.file}: ${err instanceof Error ? err.message : err}`);
  }
}

if (failed > 0) {
  console.warn('vision: Camera Studio face hiding will stay off until "npm run vision:models" succeeds.');
}
