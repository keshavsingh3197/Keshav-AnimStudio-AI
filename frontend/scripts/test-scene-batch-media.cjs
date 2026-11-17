const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const cache = new Map();
function load(filename) {
  filename = path.resolve(__dirname, '..', filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const localRequire = (name) => {
    assert.ok(name.startsWith('.'), `Unexpected dependency: ${name}`);
    return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${name}.ts`)));
  };
  new Function('module', 'exports', 'require', compiled.outputText)(module, module.exports, localRequire);
  return module.exports;
}

const {
  comparePictureFileNames,
  detectBrowserDuplicateSet,
  parseSceneNumberFromFileName,
  suggestedSceneFileName,
  formatSceneBatchPrompt,
  planScenePictureUploads,
  summarizeSceneUploadPlan,
} = load('src/app/shared/scene-batch-media.ts');
const {
  sceneNumberOf,
  naturalCompare,
  matchPictures,
} = load('src/app/features/story-agent/story-agent.utils.ts');

const SCENES = [
  { number: 1, setting: 'Temple', timeOfDay: 'Dawn', mood: 'serene', prompt: 'carved sandstone temple courtyard at dawn' },
  { number: 2, setting: 'Archive', timeOfDay: 'Day', mood: 'solemn', prompt: 'Vedic astrology chamber with palm manuscripts' },
  { number: 3, setting: 'RiverGhat', timeOfDay: 'Sunset', mood: 'divine', prompt: 'sandstone river ghat at sunset with lamps' },
];

// 1. Natural & Chrome download duplicate sort
assert.deepEqual(
  ['10.png', '2.png', '1.png'].sort(comparePictureFileNames),
  ['1.png', '2.png', '10.png'],
);
assert.deepEqual(
  ['Gemini (2).png', 'Gemini.png', 'Gemini (10).png', 'Gemini (1).png'].sort(naturalCompare),
  ['Gemini.png', 'Gemini (1).png', 'Gemini (2).png', 'Gemini (10).png'],
);

// 2. Scene number extraction (resilient to dates, years & dimensions)
assert.equal(parseSceneNumberFromFileName('01.png'), 1);
assert.equal(parseSceneNumberFromFileName('02_archive.png'), 2);
assert.equal(parseSceneNumberFromFileName('scene-3.jpg'), 3);
assert.equal(parseSceneNumberFromFileName('Scene_04_final.webp'), 4);
assert.equal(parseSceneNumberFromFileName('Flow 03 final.png'), 3);
assert.equal(parseSceneNumberFromFileName('2026-11-17-scene-2.png'), 2);
assert.equal(parseSceneNumberFromFileName('IMG_20261117_03.jpg'), 3);
assert.equal(parseSceneNumberFromFileName('render_1080x1920_02.png'), 2);
assert.equal(parseSceneNumberFromFileName('temple_sunrise.png'), null);
assert.equal(sceneNumberOf('#3-river.png'), 3);

const dupSet = detectBrowserDuplicateSet(['download.png', 'download (1).png', 'download (2).png']);
assert.equal(parseSceneNumberFromFileName('download (1).png', { browserDuplicates: dupSet }), null);

// 3. Batch prompt formatting with naming convention & negative prompt
const batchText = formatSceneBatchPrompt({
  width: 1080,
  height: 1920,
  aspectRatio: '9:16',
  scenes: SCENES,
  negativePrompt: 'people, faces, text, watermark',
});
assert.match(batchText, /Create 3 separate images/);
assert.match(batchText, /9:16 frame \(1080x1920\)/);
assert.match(batchText, /01_temple\.png, 02_archive\.png, 03_river_ghat\.png/);
assert.match(batchText, /Avoid \(negative prompt\): people, faces, text, watermark\./);
assert.match(batchText, /2\. Vedic astrology chamber/);
assert.equal(suggestedSceneFileName(3, 12, 'RiverGhat'), '03_river_ghat.png');

const withoutNeg = formatSceneBatchPrompt({
  width: 1920,
  height: 1080,
  aspectRatio: '16:9',
  scenes: SCENES,
  negativePrompt: 'people, text',
}, false);
assert.doesNotMatch(withoutNeg, /Avoid \(negative prompt\)/);

// 4a. Sparse & out-of-order numbered uploads map to exact scene indices
const sparse = planScenePictureUploads(
  [{ name: 'scene-3.png' }, { name: '01_temple.png' }],
  SCENES,
  ['existing-1', null, null],
);
assert.equal(sparse.skipped.length, 0);
assert.deepEqual(
  sparse.assignments.map((a) => [a.file.name, a.sceneIndex, a.reason]),
  [
    ['01_temple.png', 0, 'number'],
    ['scene-3.png', 2, 'number'],
  ],
);

// 4b. Setting-name uploads match scenes regardless of file name alphabetical order
const bySetting = planScenePictureUploads(
  [{ name: 'river_ghat.png' }, { name: 'archive.png' }, { name: 'temple.png' }],
  SCENES,
  [null, null, null],
);
assert.deepEqual(
  bySetting.assignments.map((a) => [a.file.name, a.sceneIndex, a.reason]),
  [
    ['temple.png', 0, 'setting'],
    ['archive.png', 1, 'setting'],
    ['river_ghat.png', 2, 'setting'],
  ],
);

// 4c. Chrome download batch (`foo.png`, `foo (1).png`, `foo (2).png`) maps 0 -> 1 -> 2 in creation order
const chromeBatch = planScenePictureUploads(
  [{ name: 'download (2).png' }, { name: 'download.png' }, { name: 'download (1).png' }],
  SCENES,
  [null, null, null],
);
assert.deepEqual(
  chromeBatch.assignments.map((a) => [a.file.name, a.sceneIndex, a.reason]),
  [
    ['download.png', 0, 'order'],
    ['download (1).png', 1, 'order'],
    ['download (2).png', 2, 'order'],
  ],
);

// 4d. Sequential high camera/generator counters outside 1..N fall back to order rather than skipping
const cameraBatch = planScenePictureUploads(
  [{ name: 'IMG_103.jpg' }, { name: 'IMG_101.jpg' }, { name: 'IMG_102.jpg' }],
  SCENES,
  [null, null, null],
);
assert.deepEqual(
  cameraBatch.assignments.map((a) => [a.file.name, a.sceneIndex, a.reason]),
  [
    ['IMG_101.jpg', 0, 'order'],
    ['IMG_102.jpg', 1, 'order'],
    ['IMG_103.jpg', 2, 'order'],
  ],
);

// 4e. Mixed named setting + remaining unnamed ordered files
const mixed = planScenePictureUploads(
  [{ name: 'b.png' }, { name: 'archive.png' }, { name: 'a.png' }],
  SCENES,
  [null, null, null],
);
assert.deepEqual(
  mixed.assignments.map((a) => [a.file.name, a.sceneIndex, a.reason]),
  [
    ['a.png', 0, 'order'],
    ['archive.png', 1, 'setting'],
    ['b.png', 2, 'order'],
  ],
);

// 4f. Duplicate scene numbers, out-of-range explicit scenes & extras report skipped cleanly
const collisions = planScenePictureUploads(
  [{ name: '01_a.png' }, { name: '01_b.png' }, { name: 'scene-9.png' }, { name: 'extra.png' }, { name: 'extra2.png' }, { name: 'extra3.png' }],
  SCENES,
  [null, null, null],
);
assert.deepEqual(
  collisions.assignments.map((a) => [a.file.name, a.sceneIndex]),
  [
    ['01_a.png', 0],
    ['extra.png', 1],
    ['extra2.png', 2],
  ],
);
assert.equal(collisions.skipped.length, 3);
assert.match(summarizeSceneUploadPlan(collisions.assignments, collisions.skipped.length), /3 pictures.*3 skipped/);

// 5. Story Agent matchPictures shares browser-duplicate-safe order & sparse scene numbering
assert.deepEqual(
  matchPictures(['download (2).png', 'download.png', 'download (1).png'], 3),
  { byNumber: false, slots: [2, 0, 1] },
);
assert.deepEqual(
  matchPictures(['scene-3.png', '01.png'], 3),
  { byNumber: true, slots: [2, 0] },
);

console.log('Passed: scene batch prompt formatting, filename/setting matching, Chrome download ordering and Story Agent compatibility.');
