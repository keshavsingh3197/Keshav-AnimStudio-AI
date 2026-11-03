# P15 — Story Agent

Give it a title. It searches the Granths, writes a script in which every source is checked, then makes the pictures,
narration and music, builds an ordinary project, renders the video and prepares the YouTube title, description, tags,
chapters and comments. The person reads the script before anything is made, and **nothing is ever published for them**.

The page is **Story Agent** in the top bar (`/story-agent`), and a card on the Projects dashboard.

---

## What it does, step by step

A run is eight stages, in order. Each is idempotent and resumable (see *Runs survive restarts*).

| # | Stage | What happens |
| --- | --- | --- |
| 1 | `research` | The title is matched to the catalogue's topics (24: festivals, deities, the Ramayana, the Mahabharata…), each with curated pointers into the Granths. The chapters those pointers name are read from Wikisource, plus a few search hits. |
| 2 | `script` | A script is written from what was found, then **checked by the machine** (see *Grounding*). The writer is the text model, a chat the person pastes from, or a built-in story. |
| — | *review* | The run stops at **Script ready**. The person reads and edits the script, checks each source and puts a picture on each scene. Nothing is made until they press **Build** (unless they opted into *skip the review*). |
| 3 | `visuals` | A picture per scene: the person's own, else the AI image engine if one is on, else a plain coloured background (a scene with no background cannot render). |
| 4 | `narration` | The voice, scene by scene (see *Narration*). |
| 5 | `music` | A soft Creative Commons track from Jamendo, credited in the description. Never fails a run. |
| 6 | `assemble` | An ordinary project (scenes, subtitles, sound) through the same path as a bundle import. It opens in the editor like any other. |
| 7 | `render` | The video, through the normal render queue. |
| 8 | `kit` | The YouTube kit: titles to choose from, description, tags, hashtags, chapters, a pinned comment, a question for the comments, and a checklist. |

Lifecycle: `Researching → WritingScript → (AwaitingScript | ScriptReady) → Building → Completed / Failed / Cancelled`.

## The three ways to get a script

| Writer | Needs | How |
| --- | --- | --- |
| **The AI** (`Auto`) | A text provider (Gemini, Groq, OpenRouter, Ollama, `claude-code`, `copilot-cli`) turned on under *Settings → AI providers* | The `story-script` prompt template (a `promptTemplates` row with that key overrides the built-in one) is sent through the provider chain; the reply is parsed, and one retry names what was wrong with it. With no model on, or if the model fails, the run falls back to *Manual* with a warning instead of failing. |
| **Paste from a chat** (`Manual`) | Nothing | The page shows a prompt that already holds what the research found. The person pastes it into any chat (ChatGPT, Gemini, Claude…) and pastes the whole reply back. The parser is tolerant: it finds the JSON inside a chatty reply and inside code fences. |
| **A built-in story** (`BuiltIn`) | Nothing | A script that ships with the app (`StoryAgent/Packs/*.json`, embedded), written and checked by hand. It goes through the same parser and checks as a model's script. Today: Diwali. |

This is why it works the first time with no key: the built-in story and *Manual* need no provider at all.

## Grounding: how it stays honest about the texts

A language model is good at sounding sure and poor at counting. The agent never asks it to be the authority:

- **Evidence first.** The prompt contains the passages that were actually fetched (chapter text from Wikisource) and the
  catalogue's pointers. The writer is told to ground every claim in them, to mark anything else as *tradition* and say
  so in the narration ("it is believed" / "मान्यता है"), and never to invent a chapter, verse or name.
- **Citations are checked** against the *shape* of the text they name (`CitationValidator`, `GranthCatalog`). "Bhagavata
  Purana 10.59" is a real place; "Bhagavata Purana 13.2" is not (the text has 12 skandhas) and is flagged
  *Not in the text*. A reference that cannot be checked (a stotra, a section name) is accepted but marked
  *Not checkable*; an unknown text is marked *Unknown text*.
- **Grounded** means the chapter was among the passages the writer was shown. *Verified · read* is the strongest badge.
- **Whole divisions are shown by name.** "Vaishnava Khanda" rather than "2", so a source never reads as a chapter number.
- **Other checks**, each a warning on the review page: a scene that claims a text but cites none is treated as tradition;
  a tradition scene that states itself as fact is called out; digits and Latin letters the voice would misread;
  a script far from the requested length.

What it **cannot** do: confirm that a verse says what the narration says. It confirms the place exists. The review
exists for that, and `reviewNotes` lists what the writer itself was unsure of. The catalogue's *Medium* and *Low*
pointers are starting points ("check the exact chapter against your own edition"), and the UI says so.

### Where the texts come from

`sa.wikisource.org`, read through the MediaWiki API, **one request at a time, at least 1.5 s apart**, honouring
`Retry-After`, with a User-Agent that says who is asking, and with chapters cached for 24 h. Wikimedia answers a burst
with HTTP 429, so politeness is a requirement, not a nicety. Passages are shown with their licence (CC BY-SA 4.0) and a
link back to the page.

Only page titles that were **verified against the live site** are mapped:

| Text | Mapped |
| --- | --- |
| Bhagavata Purana | Every skandha and chapter (skandha 10 is split into *purvardha* 1-49 and *uttarardha* 50-90). |
| Vishnu Purana | Amshas 1-5 (the sixth is not on the site). |
| Bhagavad Gita | By chapter (a whole chapter is one page; the commentary the page carries is skipped). |
| Mahabharata | Not mapped: only the first chapter of the Adi Parva exists on the site. |

For everything else the catalogue's pointers still reach the writer and the script's citations are still checked; they
are simply not read in full.

## Narration

The policy mirrors the Voiceover panel, so a story sounds like the voice the person already has there.

| Choice | Behaviour |
| --- | --- |
| **A voice** | The speech engine's own voice (Kokoro by default; `hm_omega` for Hindi, `am_michael` for English; a picker lists the rest, grouped by language). |
| **My voice** | The person's own consented sample: the engine's *tuned* voice when it has one (seconds per line), otherwise each line is spoken in a stock voice and converted by Seed-VC (about 6× real time on a CPU). *Closest to my voice* forces the conversion. A recording is **never** sent to a hosted engine. |
| **Subtitles only** | No voice. |

Each line gets about 0.45 s of breath before and 0.55 s after, then is finished with ffmpeg (high-pass, compressor,
loudness to −16 LUFS, 48 kHz mono). Silent stretches are measured and used to line the subtitles up with the voice.
A scene's narration file is named after a fingerprint of its words and voice, so **editing one scene speaks only that
scene again**.

The subtitle writer picks an installed font that covers the script (Nirmala UI, Mangal, Noto Sans Devanagari…) when
the configured one cannot draw it; a face an operator chose with `Render:SubtitleFontName` is never replaced.

## Pictures

- **Your own.** Attach one per scene, drop files onto a scene, or **Add pictures…** to choose a whole set: they go to
  the scenes in file-name order (so `Flow (2).png` comes before `Flow (10).png`). PNG, JPEG or WebP up to 10 MB, judged
  by their bytes and never by their names.
- **For Google Flow.** *Copy picture prompts* copies every scene's prompt, numbered; each scene also has its own copy
  button. Generate in Flow, download, and add the pictures. Flow adds its ✦ mark to the corner of what it makes; keep it
  or crop it, but do not remove it. The *"pictures I attach are AI-made"* switch puts the right credit in the description
  and reminds the person to tick YouTube's *altered or synthetic content* box.
- **AI engine.** If an image provider is on, a scene without a picture is drawn by it (stops after three failures in a row).
- **Plain.** Otherwise a gradient background.

## The YouTube kit

Everything is kept inside YouTube's own limits (the same validators the Video Details checkup uses): titles up to 100
characters, a description under 5,000 bytes, tags under 500 characters, and chapters only when the video can carry them
(at least three, the first at `0:00`, each at least 10 s apart, which merges short scenes). The description names the
sources, credits the music (and the voice, truthfully: "AI voice" for a stock voice), and says which parts are
tradition. Each part has a copy button.

## Runs survive restarts

A run is one document (`StoryRun`) saved after every stage change.

- A **background worker** resumes any run that was building when the server stopped, and one that fails can be
  **retried from the stage that failed**: finished stages are skipped, narration already spoken is kept, the project is
  reused (never duplicated) and a render already queued is followed rather than started again.
- **One writer at a time.** While a worker has a run, only the worker writes it. Stop and Delete first ask the worker to
  let go and wait for it to (`409 still-stopping` if it does not).
- **Stop** keeps everything made; a stopped or failed run can be tried again. **Delete** removes the run and the files it
  made; the project and render it produced are the person's and stay.
- The page follows a running story by asking for it every two seconds, shows a notice if the server cannot be reached,
  and catches up when it is back.

## API — `/api/story-agent`

| Endpoint | |
| --- | --- |
| `GET options` | What this server can do (text model, speech, images, music, renderer), the built-in stories, the catalogue's topics, and the caller's voices. |
| `GET runs` · `POST runs` | The caller's stories (newest first) · start one: a title is enough (`writer`, `language`, `targetSeconds`, `format`, `notes`, `packId`, `options`). |
| `GET runs/{id}` | One story in full; what the page polls. |
| `GET runs/{id}/prompt` | The prompt to paste into a chat. |
| `POST runs/{id}/script/paste` | Give the story its script from a chat's reply. |
| `PUT runs/{id}/script` | Save the person's edits (scenes are matched by number; files are never named by the client). |
| `POST runs/{id}/script/rewrite` | Throw the script away and write it again (`writer`: `Auto` or `Manual`). |
| `PUT` / `DELETE` / `GET runs/{id}/scenes/{n}/image` | Attach (multipart `file`), remove or fetch a scene's picture. |
| `POST runs/{id}/build` · `retry` · `cancel` | Approve and build (options in the body replace the story's) · resume from the failed stage · stop. |
| `DELETE runs/{id}` | Delete the story and its files. |

Errors use the standard envelope with a stable `code` and, when it is about one input, its `field`.
`400` invalid · `404` not found (including *someone else's*) · `409` not allowed now · `413` `payload-too-large` ·
`429` `too-many-runs` · `503` something this server lacks (`no-speech-engine`, `ffmpeg-missing`, `renderer-unavailable`).

## Guards

- **Ownership.** A story that is someone else's answers exactly as one that does not exist (`404 story-not-found`).
  A scene's picture is read *through the run*, never by a key the caller names, and only if the key lies under that
  run's own folder.
- **No storage keys or owner ids reach the browser.** Pictures are fetched by scene number.
- **Keys are made by the server** (`story-runs/{runId}/…`) from the run's id; deletes only touch keys under that folder.
- **Everything typed is sanitised** (`AiOutputSanitizer`) and bounded: title 160 characters, notes 2,000, 60 scenes,
  1,600 characters of narration per scene, a pasted reply up to 120,000 characters, a picture 10 MB.
- **A body is refused by size before it is read.** Every endpoint that takes one carries `[RequestSizeLimit]` (a brief
  64 KB, a pasted reply about 720 KB, a script 4 MB, a picture 10 MB plus 64 KB), sized so that anything the service
  would accept still gets through. Past it the answer is `413 payload-too-large` (`GlobalExceptionHandler` maps
  Kestrel's refusal; it is not a server fault), and the page stops an over-long reply before sending it.
- **Capacity.** `MaxActiveRunsPerUser` (default 2) stories building at once (`429`), and the oldest finished ones past
  `MaxSavedRunsPerUser` (default 40) are pruned.
- **Guests** are held to the same project limits as when they make a project by hand (`AnonymousPolicy`), counting
  stories still being made. A guest's browser cannot stream a render with a bare `<video>` (it cannot send the guest
  header), so the page loads the file through the API client for them.
- **It never publishes.** The run ends with a project, a render and a kit.

## Configuration

Nothing is required. Defaults are in `appsettings.json` under `StoryAgent`:

| Key | Default | |
| --- | --- | --- |
| `StoryAgent:Enabled` | `true` | `false` answers 404 and starts no worker. |
| `StoryAgent:MaxActiveRunsPerUser` | `2` | Stories one person can have building at once. |
| `StoryAgent:MaxSavedRunsPerUser` | `40` | Older finished stories are deleted past this. |
| `StoryAgent:Wikisource:Enabled` | `true` | `false` keeps the search offline (the catalogue's pointers only). |
| `StoryAgent:Wikisource:MinIntervalMs` | `1500` | Least gap between two requests. |
| `StoryAgent:Wikisource:CacheHours` | `24` | How long a chapter is kept. |
| `StoryAgent:Wikisource:MaxExcerptChars` | `12000` | Most of a chapter kept (the writer is shown less). |
| `StoryAgent:Wikisource:MaxResponseKilobytes` | `4096` | Largest reply read. |
| `StoryAgent:Wikisource:Contact` | *(empty)* | Added to the User-Agent so Wikimedia can reach whoever runs this. |

What it uses from elsewhere:

- **A text model** (optional): turn one on under *Settings → AI providers*. The zero-key options are `ollama` (local)
  and the signed-in CLIs `claude-code` and `copilot-cli`.
- **A speech engine** (for narration): `scripts\setup-voiceover.ps1` starts Kokoro. For *My voice*, add a voice on the
  Voiceover tab; `scripts\setup-voice-ai.ps1` installs the converter.
- **An image engine** (optional): `comfyui-local`, `cloudflare-ai`, `huggingface` or `pollinations`; otherwise attach your own.
- **Music**: `Music:JamendoClientId` (see the Music library). Without it the video has no background music.
- **ffmpeg** for finishing narration and for rendering.

## Testing

- Unit tests: `tests/AnimStudio.Application.Tests/StoryAgent/` (hand-written fakes, no network): the catalogue and
  citation checks, the script parser, pacing, the research layer over a fake source, every stage and the executor, the
  service, the worker, the packs, the kit, the API mapping and the controller.
- The only test that touches the network is opt-in: `ANIMSTUDIO_LIVE_WIKISOURCE=1` runs
  `WikisourceLiveTests` against the real site (four paced requests).

## Adding to it

- **A built-in story:** add `StoryAgent/Packs/<id>.json` (the shape the script parser reads, plus nothing else) and one
  line in `StoryPacks.All`. A test reads every pack through the parser.
- **A topic:** add a `GranthTopic` to `GranthTopics.All`; a test checks that every pointer is acceptable to the citation
  validator.
- **A text on Wikisource:** add its verified title pattern to `WikisourceTitleMap`; a test pins each mapped pattern.

## Not done, on purpose or yet

- [ ] Uploading to YouTube from the page (the kit is for the person to use; publishing stays their decision).
- [ ] Driving Google Flow automatically (pictures are generated in Flow and added by hand).
- [ ] More of the Granths mapped to Wikisource, and the sixth amsha of the Vishnu Purana.
- [ ] Translation and dubbing into further languages (Hindi and English today).
- [ ] The MongoDB repository is written and registered but has not been run against a live MongoDB here; SQL Server is
      the tested path.
