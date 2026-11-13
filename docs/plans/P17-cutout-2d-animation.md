# P17 — Cutout 2D animation (no video model)

A story's characters act on screen without Veo or any paid video model: they walk in, face each other, talk with
moving mouths, react, point, run, pick things up and throw them. It is **cutout animation** — each character is a set
of pose pictures made once, laid over a background and moved by the renderer — the motion-comic / puppet-show look,
not a hand-animated film. Every frame is drawn by FFmpeg from pictures the app already has, so a video costs nothing
beyond the one-time pictures, and those can come from a free or local image engine or from Google Flow.

**3D is not in this plan.** Real 3D needs rigged models and Blender on the server: a different engine, heavy to host,
and the free image engines cannot make rigs. A *3D-looking* cutout (pose pictures drawn in the 3D cartoon style) works
with everything below, and that is what `Cartoon3D` gives here.

---

## What already exists (reused, not rebuilt)

| Piece | Where | What it gives |
| --- | --- | --- |
| Character sprites | `Character.Sprites` (closed / open mouth), `CharacterStaging` | A character as pictures, placed by anchor, height, offset, flip, z-order |
| Talking mouths | `SpriteOverlayFilters` (`Speaking`, `Flap`), `RenderPlanFactory.SpeakingWindows` | Mouth flaps while that character's dialogue plays |
| Talking pictures | `StoryFaces`, `StoryFaceLocator`, `TalkingMouthFilters`, Scenes sheet `Mouths` | Characters drawn into a still talk: each speaker's face is found once per picture (Gemini, free tier) and the jaw below their mouth stretches while their lines play; placeable by hand in the Pictures tab |
| Entrances | `SpriteEntrance`, `CharacterPlacement.Entrance` | Slide / fade in |
| Background motion, transitions | `BackgroundMotionFilters`, `StoryLook` | Camera push, pan, crossfade per mood |
| Green-screen keying | `OverlayChromaKey` | Cuts a character out of a green background |
| Transparent pictures | `AiImageRequest.TransparentBackground`, `AiImageValidator.SupportsTransparency` | PNG with alpha where the engine supports it |
| Free image engines | Pollinations, Cloudflare Workers AI, Hugging Face, ComfyUI (local) | Pictures with no paid model |
| Characters in a bundle | `WorkbookImportService` (`ClosedMouthSprite`, `OpenMouthSprite`, scene `Characters`) | The story build can hand over a cast with sprites, and the project opens in the editor |
| Per-line voices | `StoryNarrator` (lines synthesized per voice, joined by `StoryWav.Join`) | The basis for knowing when each line is said |
| Emotions | `StoryEmotions` (face, reaction) | Which pose a speaker and the listeners take |
| Series | `StorySeriesService` | Reusing one cast's pictures across episodes |
| The plan for poses and hit FX | P08 *Action beats* (not built) | `CharacterPoses`, shake, impact flash, speed lines — folded in here |

What is missing: more poses than two mouths, movement over time (a sprite today stands still after its entrance),
props, empty backgrounds, line-level timing in a story, and anything that turns a script into staging.

---

## How it works, end to end

1. **Pick the animation** on the story form: *Pictures* (today), *My Google Flow clips* (today), or **Cutout 2D (new)**.
   The art style (`Cartoon` / `Cartoon3D`) decides how the pose pictures are drawn.
2. **Cast kit** — one pose sheet per character, made once (A17.1).
3. **Sets** — one empty background per place in the story (A17.2).
4. **Staging** — the script says, per line, what each character does, from a fixed list (A17.3); what it leaves out
   is filled in from the emotion and the dialogue.
5. **Props** — small object pictures the characters hold, pick up, give and throw (A17.4).
6. **Compile and render** — the staging becomes ordinary scene render plans with timed poses and movement (A17.5–A17.7).
7. The project opens in the editor like any other, and every placement can be changed by hand.

---

## Actions

### A17.1 — Cast kit: one pose sheet per character

Separately generated poses of the same character never match, so all of a character's poses are made as **one picture**:
a 3×3 grid on a flat green (or transparent) background, then cut into cells.

| Cell | Pose | Used for |
| --- | --- | --- |
| 1 | Standing, mouth closed, facing right | Idle, listening |
| 2 | Standing, mouth open | Talking (alternates with 1 for the mouth flap) |
| 3 | Pointing / explaining, mouth open | Talking with a gesture |
| 4 | Laughing / happy, arms up | `happy`, `excited`, `laughing`, `proud` |
| 5 | Shocked / scared, hands up, leaning back | `scared`, `surprised`, `worried` |
| 6 | Angry, fists, leaning forward | `angry`, `shouting` |
| 7 | Sad, slumped | `sad`, `shy` |
| 8 | Walking / running, mid-stride | `walk`, `run`, entrances and exits |
| 9 | Holding out one hand, palm up | `hold`, `give`, `pick-up`, `throw` (the prop sits in this hand) |

- `CharacterPoseSheet { SheetAssetId, Cells[9]: { AssetId, Box, HandPoint } , Seed, Source(ai|upload) }` on
  `Character`, next to `Sprites`. `Sprites.ClosedMouth/OpenMouth` are set from cells 1 and 2 so everything that reads
  sprites today keeps working.
- **Made by** the `pose-sheet` image prompt (built-in, editable like the others): the character's fixed look phrase
  from the script, the art style, the grid layout, "same character in every cell". Sent through the image engine
  chain with `TransparentBackground` when the engine supports it, otherwise a flat `#00FF00` background.
- **Or uploaded**: the person makes the sheet in Google Flow (the *character reference sheet* prompt in
  `docs/STORY_PROMPTS.md` gains a pose-grid version) and uploads it.
- **Cutting**: split the grid; per cell, key out the green (`OverlayChromaKey` values, plus a despill), trim to the
  opaque bounding box, and align feet to a common baseline so poses don't jump when swapped. Done once with FFmpeg
  (`crop`, `colorkey`, `despill`), stored as PNG assets.
- **Hand point**: default to the cell's right edge at 45% height; the person can drag it in the kit page. Cell 9
  can't be found automatically from a generated picture, so the default plus a manual nudge is the honest choice.
- A missing or rejected cell falls back to cell 1, so a half-made kit still renders (as P08 A8.4 said).
- Kits are kept with the cast member and reused by the next episode of a series.

### A17.2 — Sets: empty backgrounds

- Scenes gain an optional `location` (a short name: "kitchen", "school gate"). Scenes with the same location share
  one background. Without it, each scene is its own location.
- The `set` image prompt asks for the place **with no people in it**, wide, room for characters in the lower third,
  in the art style. The person's own picture, or one from Flow, can replace it.
- Vertical stories get a 9:16 background; characters are staged closer together.

### A17.3 — Staging in the script

Each line can say what its speaker does, and each scene where its characters stand. All values come from fixed lists,
normalized by the parser like `StoryEmotions.Normalize`, so no free text reaches a filter graph.

```json
"location": "kitchen",
"stage": { "left": "Dadaji", "right": "Pinky" },
"props": ["phone", "samosa plate"],
"lines": [
  { "speaker": "Dadaji", "text": "...", "emotion": "proud", "action": "point", "prop": null },
  { "speaker": "Pinky",  "text": "...", "emotion": "surprised", "action": "pick-up", "prop": "phone" }
]
```

- `stage` slots: `left`, `center`, `right`, `offscreen-left`, `offscreen-right` (offscreen = enters with a walk).
- `action`: `talk` (default), `point`, `wave`, `walk-in`, `walk-out`, `run-across`, `jump`, `fall`, `shake`,
  `pick-up`, `hold`, `give`, `throw`, `hide`, `turn-away`.
- **Filled in when left out**: the pose comes from the emotion (table in A17.1); the speaker faces the last other
  speaker; listeners take their emotion's *reaction* pose for the line's first second, then idle; a character named in
  `stage` as offscreen walks in before their first line.
- `StoryScriptPrompt`, the creative prompt and `docs/STORY_PROMPTS.md` gain these fields; the export file carries
  them (`StoryExportScene`, `StoryExportLine`; still `version: 1`, the fields are optional).
- The script editor shows each line's action and prop as two dropdowns next to the emotion.

### A17.4 — Props

- A prop is a small picture of one object on transparent/green, made by the `prop` prompt in the art style, or
  uploaded. Kept per story, by name.
- Placement: on the floor at the scene's lower edge, near the character who will pick it up, or in a character's hand
  (their pose cell 9, at its hand point, flipped with them).
- Actions on props (A17.5 turns them into movement):
  - `pick-up`: reach (cell 9) → prop moves from floor to hand over 0.4 s → hold.
  - `give`: prop moves from one character's hand point to the other's.
  - `throw`: prop flies in an arc (parabolic `y`) to a target or off screen, spinning (`rotate`).
  - `hold`: stays in hand while the character talks.
- Family-friendly prop list in the funny/kids genres (a water gun, a rolling pin, a pillow); the `prop` prompt refuses
  nothing on its own, but the genre style guide steers the writer away from real weapons.

### A17.5 — The staging compiler

`StoryStagingCompiler` (Application, pure, no I/O) turns a scene's staging, its lines' timings (A17.6) and the cast
kits into `SceneRenderPlan`s. Deterministic: the same script gives the same video.

Per character, per frame window, it decides:
- **Which pose cell is shown.** Talking alternates cells 1/2 (or the emotion's pose with 2) at `MouthFlapHz`.
- **Where it is.** Slots map to x fractions; `walk-in`/`walk-out`/`run-across` are tweens with the walk cell and a
  small step bounce (`abs(sin)` on `y`); `jump` is an arc; `fall` is a drop with a squash; `shake` is a short
  oscillation.
- **Which way it faces.** Flip toward who they are talking to.
- **Life when idle.** A slow breathe (1–2% scale) and an occasional blink-free head bob, so nobody is frozen.
- **Props** per A17.4, and **FX** from P08 A8.5 on `fall`, `throw` hits and `shouting`: screen shake, a 2-frame
  impact flash, speed lines, a punch-in on the reacting face.
- **Camera**: the existing `StoryLook` move on the whole composite, plus a cut-in to the speaker on a long line in
  a Wide video.

### A17.6 — When each line is said

- `StoryLine` gains `StartSeconds` / `EndSeconds` in the scene's audio, written by the narration stage. Where a line was
  its own synthesis, the times are exact from the part durations `StoryWav.Join` already has (plus `LineGapSeconds`).
- A chunk with two speakers in one call (Gemini multi-speaker) is split with FFmpeg `silencedetect`, falling back to
  splitting by the share of characters each line has.
- No narration (subtitles only): times come from `StoryPacing.EstimateSeconds` per line.

### A17.7 — Rendering

`SpritePlan` grows from "two mouth pictures at a fixed spot" to a timeline, keeping today's shape as the simple case:
- `Poses: [{ AssetPath, FrameRange }]` — one overlay input per pose actually used, each with an `enable` window
  (the same trick `Speaking`/`Flap` use today).
- `XExpression` / `YExpression` / `Scale` / `Rotate` built from keyframes as piecewise expressions
  (`if(between(t,a,b), lerp…)`), with the text overlays' easing.
- `PropPlan` — a prop overlay with its own keyframes.
- An FX list applied after the sprites.

Overlays per scene stay bounded: at most 4 characters × the poses they use + props. A scene that would exceed a limit
(say 24 overlays) merges its quiet characters into one pre-rendered still for that scene. The `StoryBundleBuilder` writes
the cast with sprites into the bundle's Characters sheet and each scene's characters and dialogue, so the project opens
with the cast in the editor; the extra pose and keyframe data goes on the scene as `Staging` (new, optional).

### A17.8 — UI

- Story form: *Animation* — Pictures / My Google Flow clips / **Cutout 2D**.
- **Cast kit** page in the story: each character's sheet, its nine cells, *Make again*, *Upload my own sheet*, drag the
  hand point. Sets and props listed the same way.
- Script editor: per line, action and prop next to emotion; per scene, location and who stands where.
- Scene preview: a low-resolution 3-second render of one scene, to check staging before the whole build.

### A17.9 — Tests

- Pose sheet cutting: grid split, keying, baseline alignment, a missing cell falls back to cell 1.
- Parser: unknown actions, slots, props and locations are dropped or defaulted, never passed through.
- Compiler: tweens stay on screen and inside the scene; facing follows the conversation; listeners react; a pick-up
  puts the prop in the hand; the same input gives the same plan.
- Line timings: exact for single-voice parts; silence split and proportional fallback for two-voice chunks.
- Filter graph builds for every action at Wide and Vertical; a story with no staging renders exactly as today.

---

## Phases

| Phase | Ships | Rough size |
| --- | --- | --- |
| 1 | Pose sheets (make, upload, cut), sets, line timings, compiler for talk / face / react / walk-in / walk-out / idle life, rendering with timed poses and tweens, *Cutout 2D* option | The bulk; usable on its own |
| 2 | Actions (`point`, `jump`, `fall`, `run-across`, `hide`…), props and `pick-up` / `give` / `throw`, script and prompt fields, editor dropdowns | Medium |
| 3 | P08 FX, camera cut-ins, cast kit page polish, scene preview | Medium |

---

## Cost

Per character: one pose-sheet picture. Per place: one background. Per prop: one small picture. With a free engine or
ComfyUI on this PC that is nothing; the rest is FFmpeg on this machine. A series reuses its cast and sets.

## Risks and honest limits

- **Pose sheets may not match cell to cell.** Free engines sometimes draw a different face in a cell. Remedies: make
  the sheet again, upload one from Google Flow, or ComfyUI with a reference image (IP-Adapter) on this PC. The kit page
  makes a bad cell obvious before the build.
- **Green edges** around cutouts. Prefer engines that return transparency; despill otherwise.
- **It looks like cutout animation.** Limbs don't bend between poses; the motion is poses swapping and sliding. Done
  with comic timing it reads well for comedy and kids, and that is the target.
- **Render time** grows with overlays; the per-scene limit in A17.7 keeps it in check.

## Open questions

1. Which image engine will make the sheets: ComfyUI on this PC, a free cloud one, or uploads from Flow?
2. Should *Cutout 2D* become the default for the funny and kids genres once it works?
