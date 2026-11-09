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

const { comedyStoryTemplate } = load('src/app/features/story-agent/comedy-story-template.ts');
const { parseComedyStory, readComedyStoryUpload } = load('src/app/features/story-agent/comedy-story-file.ts');
const { reviewComedyStory } = load('src/app/features/story-agent/comedy-review.ts');
const { STORY_FILE_MAX_BYTES, clipPrompts } = load('src/app/features/story-agent/story-agent.utils.ts');

async function main() {
  for (const language of ['hi', 'en']) {
    for (const style of ['2D', '3D']) {
      const template = comedyStoryTemplate(language, style, 30, 'CharactersOnly');
      assert.equal(template.kind, 'animstudio-story');
      assert.equal(template.version, 1);
      assert.equal(template.story.language, language);
      assert.equal(template.story.targetSeconds, 30);
      assert.equal(template.story.voicing, 'CharactersOnly');
      assert.equal(template.story.options.artStyle, style === '2D' ? 'Cartoon' : 'Cartoon3D');
      assert.equal(template.story.options.autoApprove, false);
      assert.equal(template.story.options.renderWhenReady, false);
      assert.equal(template.script.scenes.length, 2);
      for (const scene of template.script.scenes) {
        assert.ok(scene.narration.trim());
        assert.equal(scene.lines.map((line) => line.text).join(' '), scene.narration);
        assert.ok(template.script.cast.some((person) => person.name === scene.lines[0].speaker));
        assert.equal(scene.basis, 'reflection');
        assert.deepEqual(scene.sources, []);
        assert.ok(scene.imagePrompt.length <= 800 && scene.videoPrompt.length <= 800);
      }
      template.story.options.customSetting = { preserve: true };
      template.script.extra = 'अपनी कहानी';
      const text = JSON.stringify(template);
      assert.deepEqual(await parseComedyStory(`\`\`\`json\n${text}\n\`\`\``), template);
      const uploaded = await readComedyStoryUpload(new File([text], 'my-story.json'));
      assert.deepEqual(uploaded.story, template);
      assert.equal(uploaded.text, text);
      const review = reviewComedyStory(uploaded.story);
      assert.deepEqual(review.warnings, []);
      assert.match(review.prompt, /approximately 30 seconds/);
      assert.match(review.prompt, /No narrator/);
      assert.ok(review.prompt.includes(template.script.scenes[0].lines[0].text));
      assert.ok(review.prompt.includes(template.script.scenes[0].videoPrompt));
      template.script.scenes[0].lines[0].text = 'Mismatch';
      assert.match(reviewComedyStory(template).warnings.join(' '), /must match narration/);
      template.script.scenes[0].lines[0].speaker = 'Unknown';
      assert.match(reviewComedyStory(template).warnings.join(' '), /named cast member/);
    }
  }
  await assert.rejects(parseComedyStory(''), /Paste the complete JSON/);
  await assert.rejects(parseComedyStory('{bad json'), /isn't JSON/);
  await assert.rejects(parseComedyStory('{"kind":"animstudio-story","version":1,"story":{},"script":{"scenes":[]}}'), /no script/);
  await assert.rejects(parseComedyStory('x'.repeat(STORY_FILE_MAX_BYTES + 1)), /too big/);
  await assert.rejects(readComedyStoryUpload(new File(['x'.repeat(STORY_FILE_MAX_BYTES + 1)], 'big.json')), /too big/);
  const scene = [{ headline: 'Joke', videoPrompt: 'A character reacts', imagePrompt: 'A stall', context: null, seconds: 12 }];
  assert.match(clipPrompts('Story', null, scene, null, true, true), /expressive character actions/);
  assert.doesNotMatch(clipPrompts('Story', null, scene, null, true, true), /Slow, calm motion/);
  assert.match(clipPrompts('Story', null, scene, null, true), /Slow, calm motion/);
  console.log('Passed: comedy templates, fenced JSON, upload, Unicode, preservation and invalid/oversized input.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
