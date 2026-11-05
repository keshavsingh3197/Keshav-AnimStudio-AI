# P16 — Animated scenes, language-aware thumbnails, analytics charts

Three improvements to the Story Agent and the YouTube pages, in the order they are built:

1. **Animated scenes** (done) — a story's pictures come to life: characters act, gesture, move their heads and eyes, and
   whoever speaks moves their lips. Realistic, painted or cartoon.
2. **Thumbnails** (next) — a YouTube thumbnail made for every story, from its best picture, with a short hook in the
   story's language.
3. **Analytics charts and pagination** (after) — the channel analysis page shows its numbers as charts, and every long
   list pages instead of rendering all of it.

---

## 1. Animated scenes (`animate` stage)

> **Removed (Nov 2026).** The automatic `animate` stage, `GeminiSpeechProvider.Video.cs`, `FfmpegStoryClipFinisher` and the
> `StoryAgent:Animation` settings are gone: `veo-3.1-fast-generate-preview` was shut down by Google and its replacement
> is billed per second of video (about $0.10/s at 720p), too costly for every build. What stays: the Look choice, the
> per-scene video prompt and full animation prompt to paste into Google Flow, and attaching your own MP4 clips. In its
> place, Build first checks today's paid Google limits (`StoryAgent:Budget`) and this app's daily caps on the free image
> engines (Pollinations, Hugging Face, Cloudflare), and warns at 80%. The rest of this section
> is kept as the record of what was built.

### What the person sees

*Build options → Pictures → Look*: **Genre default · Painting · Realistic · Cartoon · 3D cartoon**. The look shapes both
the generated pictures and the way they move.

*Build options → Animation*: **Bring the pictures to life (Google Veo)**, off by default, with

- **Opening + speaking scenes** (default) or **Every scene**,
- **At most N scenes** (default 6; the server caps it with `StoryAgent:Animation:MaxScenesPerRun`, default 20),
- a cost note (Veo is billed per second of video).

In the script editor each scene's *Moving clip* panel shows **✨ Animated** for a generated clip, **🗣 Speaks** when a
character talks in it, and the **full animation prompt** - exactly what Veo is asked - with a copy button, so the same
prompt can be used in Google Flow by hand.

### Where it runs

A new build stage between `narration` and `music`:

| # | Stage | |
| --- | --- | --- |
| 3 | `visuals` | Pictures, in the chosen look. |
| 4 | `narration` | The voice. *Reviewed.* |
| **5** | **`animate`** | **Chosen scenes' pictures → 4/6/8-second clips with Veo. Never fails a run.** |
| 6 | `music` | … |

It comes after the voice is approved on purpose: it is the step that costs money, and a voice redo would otherwise
pay for the same clips twice. Runs saved before the stage existed get it on first read (`StoryRun.Stage`): pending if
nothing after it has happened, otherwise skipped.

### How a scene is chosen

`StoryAnimation.Pick`: the opening scene (it decides whether anyone keeps watching), then every scene where a cast member
speaks (`lines` with a speaker other than the narrator), then - for *Every scene* - the rest, in story order, up to the
limit. Never a scene with only a plain background, and never one where the person attached their own clip.

### The prompt

Composed in code (`StoryAnimation.Prompt`) rather than kept as an editable prompt template: the template renderer
fences every value as `<<<DATA>>>` for a text model, and a video model would draw the fences. It is built from

- the scene's **`videoPrompt`** - the script writer is now asked (template versions `story-script` v4,
  `story-script-creative` v2) for each character's gesture, gaze, expression, head and body movement and steps, what
  moves around them, and one camera move;
- for a **speaking scene**: who speaks (with age and gender from the cast, "यमराज (the elderly man) speaks, saying: “…”")
  and their actual words, plus clear lip, jaw and cheek movement in time with the words, blinks, nods and gestures, and
  listeners reacting; for a silent scene, natural silent acting so nobody's mouth moves at random;
- background motion, a mood-matched camera move when the scene gives none, the motion style of the look (living
  painting / film-like / 2D cartoon squash-and-stretch / 3D feature), reverence for a scripture story, gentleness for a
  children's genre;
- "start exactly from the picture, keep faces, clothes and setting", and no text, captions or logos; plus a negative
  prompt for text, deformed hands, morphing and flicker.

Veo speaks the quoted words itself, which is what makes the lips match them; that sound is discarded and the approved
narration is what is heard.

### The clip

- **Engine**: `GeminiSpeechProvider` implements `IVideoGeneratingProvider` (`GeminiSpeechProvider.Video.cs`), on the same
  key as Gemini speech and Lyria. `POST models/{model}:predictLongRunning` with the picture, then the operation is polled
  until done. Model: `StoryAgent:Animation:Model` (default `veo-3.1-fast-generate-preview`), 720p, 16:9 or 9:16.
- **Download**: the guarded HTTP client never follows redirects, so the file URI (the API's own host, with the key) and
  its one redirect (Google storage, *without* the key) are each checked against hosts written in code.
- **Finishing** (`FfmpegStoryClipFinisher`): Veo's sound is stripped, and when the scene runs longer than the clip its
  last 0.6 s is crossfaded into its start, so the renderer's loop has no visible jump.
- **Kept, not paid twice**: each clip carries a fingerprint of the picture, the prompt, the length and the model; a
  rebuild re-asks only for scenes where one of those changed. A scene that stops being chosen loses its generated clip.
  Turning animation off goes back to the pictures without deleting the clips.
- **Failure**: no engine, a refused key or an exhausted allowance skip the stage with a warning; two failures in a row
  stop asking; a clip that takes over `ClipTimeoutMinutes` (10) is given up. The video is always made.

### Not done here (worth doing later)

- **Exact lip sync to the narration** - a local talking-head engine (LivePortrait / SadTalker / Wav2Lip style, run as a
  `LocalProcessAiProvider`) given the picture and the scene's own WAV would match our voice frame-for-frame. Veo's lips
  follow the words but not our voice's timing.
- **Longer shots** - Veo can extend a clip; today a long scene loops its 8 s clip (seamlessly).
- **Per-scene "animate this one / not this one"** and a *re-animate* button; today it is by rule, and removing a generated
  clip then building again makes it afresh.
- Changing the look does not redraw pictures already made (same as changing the picture style); remove a picture to
  redraw it.

---

## 2. Thumbnails (next)

There is no thumbnail for a story today; YouTube picks a frame.

- **Script**: the writer adds `thumbnail: { scene, text, prompt }` - the scene with the strongest single image, a hook of
  two to four words **in the story's language** (Devanagari for Hindi), and an English prompt for a thumbnail-only picture
  (one face or object large, high contrast, room on one side for the words).
- **`thumbnail` stage** (after `kit`): the picture is the generated thumbnail picture when an image engine is on, else the
  chosen scene's picture, else the first non-placeholder one. The hook is drawn with ffmpeg in the script font
  (`ScriptFonts` already shapes Devanagari) with a thick outline and shadow; 1280×720 (or 1080×1920 for a Short), JPEG
  under YouTube's 2 MB limit.
- **Review**: two or three candidates (different scenes / hook wordings) shown next to the video; the person picks one or
  uploads their own.
- **Publish**: the chosen one is set with `thumbnails.set` when the video is uploaded, and kept in the publish kit.

## 3. Analytics charts and pagination (after)

- **Charts** on the channel analysis page (inline SVG, no new chart library): views per video over time, views-per-day
  bars for the latest videos, Shorts vs long-form comparison, likes and comments per thousand views. Light and dark
  themes, keyboard- and screen-reader-readable (each chart has its table).
- **Pagination**: the video table, the story list/storyboard and the publish history page on the server
  (`page`, `pageSize`, `total` - capped page size, indexed sort), with page controls and a search box, instead of
  rendering every row. The repositories gain `skip/limit` queries on both Mongo and SQL Server.
