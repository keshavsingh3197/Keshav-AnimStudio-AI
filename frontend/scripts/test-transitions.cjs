const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
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

const { TRANSITIONS } = load('src/app/core/models/api.models.ts');
const { STORY_TRANSITIONS, STORY_LOOK_STYLES } = load('src/app/core/models/story-agent.models.ts');
const { transitionPreviewFrame } = load('src/app/features/clips/services/transition-preview.ts');
const { effectCutTime, planEffectPlacement, DEFAULT_CHROMA_KEY } = load('src/app/features/effects/effect-placement.ts');
const { COMEDY_TEMPLATES, comedyNotes } = load('src/app/features/story-agent/comedy-templates.ts');

assert.deepEqual(STORY_TRANSITIONS, TRANSITIONS);
assert.ok(STORY_LOOK_STYLES.some((style) => style.id === 'MusicVideo'));
for (const kind of TRANSITIONS) {
  for (const p of [-1, 0, 0.25, 0.5, 0.75, 1, 2]) {
    for (const incoming of [false, true]) {
      const frame = transitionPreviewFrame(kind, p, incoming);
      assert.ok(frame.opacity >= 0 && frame.opacity <= 1, `${kind}: opacity`);
      assert.ok([1, 2].includes(frame.zIndex));
      for (const value of [frame.transform, frame.clipPath, frame.filter]) {
        assert.ok(!/NaN|Infinity|undefined/.test(value), `${kind}: ${value}`);
      }
    }
  }
  assert.equal(transitionPreviewFrame(kind, 1, true).opacity, 1, `${kind}: incoming finishes visible`);
  assert.deepEqual(transitionPreviewFrame(kind, -1, true), transitionPreviewFrame(kind, 0, true));
  assert.deepEqual(transitionPreviewFrame(kind, 2, false), transitionPreviewFrame(kind, 1, false));
}
assert.throws(() => transitionPreviewFrame('invalid', 0.5, true), /Unknown transition/);
assert.equal(transitionPreviewFrame('Fade', 0.5, true).opacity, 0.5);
assert.equal(transitionPreviewFrame('Fade', 0.5, false).opacity, 1);
assert.equal(transitionPreviewFrame('FadeBlack', 0.5, true).filter, 'brightness(0)');
assert.equal(transitionPreviewFrame('FadeWhite', 0.5, true).filter, 'contrast(0) brightness(2)');
assert.match(transitionPreviewFrame('Blur', 0.5, true).filter, /blur\(18/);
assert.equal(transitionPreviewFrame('CircleCrop', 0.5, true).clipPath, 'circle(0% at 50% 50%)');
assert.equal(transitionPreviewFrame('CircleClose', 0.5, false).zIndex, 2);
assert.match(transitionPreviewFrame('DiagonalWipe', 0.25, true).clipPath, /polygon/);
assert.match(transitionPreviewFrame('SlideUp', 0.5, true).transform, /translateY\(50%\)/);
assert.match(transitionPreviewFrame('ZoomIn', 0.5, true).transform, /scale/);

const cuts = [{ key: 'a', seconds: 3 }, { key: 'b', seconds: 8 }];
assert.equal(effectCutTime(cuts, 'a', 8), 3);
assert.equal(effectCutTime(cuts, null, 7), 8);
assert.equal(effectCutTime(cuts, 'deleted', 2), 3);
assert.equal(effectCutTime([], null, 5), null);
const stinger = { kind: 'Video', category: 'Transition', durationSeconds: 2, isGreenScreen: false, hasAlpha: true };
const place = (effect, mode, cut, end = 20) => planEffectPlacement(effect, mode, 5, end, 3, cut);
const placed = place(stinger, 'cut', 8);
assert.equal(placed.start, 7);
assert.equal(placed.trackId, 'V2');
assert.equal(placed.transform.widthPercent, 100);
assert.equal(placed.transform.transitionIn, 'none');
assert.equal(placed.transform.transitionOut, 'none');
assert.equal(place(stinger, 'cut', 0.5).start, 0);
assert.equal(place(stinger, 'cut', 19.8).start, 18);
assert.equal(place(stinger, 'cut', 0.5, 1).start, 0);
assert.equal(place(stinger, 'playhead').start, 5);
assert.equal(place(stinger, 'end').start, 18);
assert.deepEqual(place({ ...stinger, isGreenScreen: true }, 'cut', 8).transform.chromaKey, DEFAULT_CHROMA_KEY);
assert.deepEqual(place({ ...stinger, kind: 'Audio' }, 'cut', 8), { trackId: 'A1', start: 7 });
assert.equal(place({ ...stinger, kind: 'Image' }, 'cut', 8).start, 6.5);
assert.equal(place({ ...stinger, category: 'Reaction' }, 'cut', 8).start, 7);
assert.equal(place({ ...stinger, category: 'Reaction', kind: 'Audio' }, 'cut', 8).trackId, 'A1');
assert.equal(comedyNotes('none', 3, '  My idea  '), 'My idea');
assert.match(comedyNotes('levels', 4, 'My idea'), /4 distinct numbered situations/);
assert.match(comedyNotes('levels', 4, 'My idea'), /My idea$/);
assert.ok(COMEDY_TEMPLATES.some((template) => template.id === 'challenge'));
assert.ok(COMEDY_TEMPLATES.some((template) => template.id === 'misunderstanding'));
assert.throws(() => place(stinger, 'cut'), /Select a cut/);
assert.throws(() => place(stinger, 'cut', NaN), /Select a cut/);
console.log(`Passed: ${TRANSITIONS.length} transition previews, shared catalog, music-video option and custom cut placement.`);
