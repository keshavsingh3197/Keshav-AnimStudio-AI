# AnimStudio AI — Roadmap and Action Board

This is the master plan. `AGENTS.md — AnimStudio AI Project Blueprint.md` stays the
architecture rulebook; this file tracks **what is left to build, in order**.

Every phase has a detail file under `docs/plans/`. Each detail file lists numbered
actions (`A7.3`), the files they touch, and acceptance criteria. Work one action at a
time, tick it here and in the detail file, run the tests, commit.

---

## 1. Where the project actually is

Phases 1–8 of the blueprint are **done or substantially done** (the blueprint's
section 47 "Current Phase: PHASE 1" is stale):

| Capability | State |
| --- | --- |
| Projects / characters / scenes / assets CRUD | Done (API + Angular) |
| Transcript ingest: paste, subtitle upload, YouTube captions (yt-dlp) | Done |
| Subtitle parsing, dedup, speaker detection, segmentation into a `Script` | Done |
| Casting (speaker → character) with narrator fallback | Done |
| Script → scenes generation with edit-preserving re-ingest | Done |
| FFmpeg render: Ken Burns, sprites, mouth flap, ASS subtitles, transitions, merge | Done |
| Render jobs: Mongo lease/claim worker, progress polling, cancel, download | Done |
| Rights attestation, licence class, IP-risk advisory on assets | Done |
| 190 unit tests + FFmpeg-gated integration tests | Passing |

**What is missing is everything the user asked for:** a one-click
URL → finished animated video autopilot, an AI provider layer that can drive free
tools, spreadsheet-driven bulk input, art direction, fight/action choreography, an
admin console, and publishing.

---

## 2. Design principles for everything below

Carried over from the blueprint, plus what this roadmap adds:

1. **AI stays optional.** Every new stage must degrade to a working non-AI path
   (`Provider: None` must still render a video). No feature may hard-require a key.
2. **Take less input, do more.** Every screen gets a "just do it" path with smart
   defaults; the detailed controls stay, but behind the default.
3. **Free-tier friendly.** Content-addressed caching, quotas, provider fallback
   chains, and local providers (Ollama / ComfyUI / Piper / whisper.cpp) as
   first-class, so a whole video can be made with zero paid API calls.
4. **All model output is untrusted.** LLM/image/tool output is schema-validated and
   sanitized before it reaches a filename, a path, an FFmpeg argument, a DB field or
   the DOM.
5. **Never a secret in source or in a response.** Provider keys are encrypted at
   rest and only ever returned masked.
6. **Idempotent, resumable stages.** A pipeline that dies at stage 7 of 11 resumes at
   7, and re-running a completed stage is free (cache hit).
7. **Provenance is not optional.** Everything generated records provider, model,
   prompt hash, seed, licence and cost.

---

## 3. Action board

Order is dependency-driven. `P3` unlocks most of the rest.

### P0 — Security remediation (do first, blocks nothing else) — [detail](plans/P00-security-remediation.md)
- [x] **A0.1** Remove the live MongoDB Atlas credential committed in `backend/AnimStudio.Api/appsettings.json`
- [x] **A0.2** Move it to user-secrets / `Mongo__ConnectionString`, fail fast with a clear message when absent
- [ ] **A0.3** Rotate the exposed Atlas password — **your action, still outstanding** (see `SECURITY.md`)
- [x] **A0.4** Add a pre-commit secret scan (`gitleaks`-style regex) and a `SECURITY.md` note

### P3 — AI provider layer — [detail](plans/P03-ai-provider-layer.md)
- [x] **A3.1** `AnimStudio.Domain/Ai`: `AiCapability`, `AiProviderId`, `AiUsageRecord`, `AiCredential`, `PromptTemplate`
- [x] **A3.2** Application ports: `ITextAiProvider`, `IImageAiProvider`, `ISpeechAiProvider`, `ITranscriptionProvider`
- [x] **A3.3** `AiProviderRegistry` — capability → enabled provider, ordered fallback chain, circuit breaker
- [x] **A3.4** `AiResultCache` — content-addressed by SHA-256(provider|model|prompt|params|seed) into the object store
- [x] **A3.5** `AiQuotaGuard` + `aiUsage` collection — per-provider daily/monthly ceilings, refuse before spending
- [x] **A3.6** `AiCredentialStore` — AES-256 at rest via `KeshavSingh.Security`, masked reads, never logged
- [x] **A3.7** `PromptLibrary` — versioned templates in Mongo, strict variable allowlist, no raw user text splicing
- [x] **A3.8** `AiOutputSanitizer` + JSON-schema validation for every structured LLM response
- [x] **A3.9** HTTP wiring: per-provider client, timeout, retry+jitter, **base-URL allowlist (SSRF guard)**
- [x] **A3.10** Text providers: `OpenAiCompatible` (Groq / OpenRouter / Together / Ollama / LM Studio), `Gemini`, plus `KnownAiProviders` (the catalogue), `IAiSecretResolver` and `AiJsonResponse`
- [x] **A3.11** Image providers: `Pollinations` (keyless), `CloudflareWorkersAi`, `HuggingFaceInference`, `ComfyUiLocal`, plus `AiImageValidator` (magic-byte sniffing)
- [x] **A3.12** Speech providers: `PiperLocal` (process), `OpenAiCompatibleTts` (covers Kokoro + hosted), plus `LocalProcessAiProvider` and `AiAudioValidator`
- [x] **A3.13** Transcription providers: `WhisperCppLocal` (process), `OpenAiCompatibleAsr` (covers faster-whisper, Groq Whisper + hosted), plus `AiTranscriptValidator`
- [x] **A3.14** `GET /api/ai/capabilities` — availability, reason code and remaining daily quota
- [x] **A3.15** Unit tests: 368 across the registry, provider id, cache, quota, executor, SSRF guard, credential store, prompt library, schema validator, sanitizer, the two text providers, the four image providers, the two speech providers, the two transcription providers, the image, audio and transcript validators, the local process runner and the HTTP client factory

### P4 — Autopilot: one URL → finished video — [detail](plans/P04-autopilot.md)
- [ ] **A4.1** `PipelineJob` domain + `pipelineJobs` collection: ordered stages, per-stage status/progress/error
- [ ] **A4.2** `IPipelineStage` contract + `AutopilotOrchestrator` (idempotent, resumable, cache-aware)
- [ ] **A4.3** `AutopilotWorker` BackgroundService reusing the render worker's Mongo lease/claim pattern
- [ ] **A4.4** Stages 1–4: resolve source → transcript → script → cast (all wrap existing services)
- [ ] **A4.5** Stage 5: AI character extraction (names, aliases, appearance, voice hint) from the transcript
- [ ] **A4.6** Stage 6: sprite generation per character (closed/open mouth, locked seed) via `IImageAiProvider`
- [ ] **A4.7** Stage 7: background generation per scene, deduped by location so one arena is one image
- [ ] **A4.8** Stage 8: audio — source slice, or TTS per character voice, or silent
- [ ] **A4.9** Stages 9–11: scene assembly → render (existing) → thumbnail + metadata + originality report
- [ ] **A4.10** `Recipe` domain + seeded presets ("WWE fight → anime 9:16", "Podcast → talking heads", "News → explainer")
- [ ] **A4.11** `POST /api/autopilot` — `{ url, recipeId, rightsAttestation }`, creates the project too
- [ ] **A4.12** `GET /api/pipeline-jobs/{id}` polling contract + `POST .../retry`, `POST .../cancel`
- [ ] **A4.13** Optional approval gates (`AutoApprove=false` pauses after script / casting / storyboard)
- [ ] **A4.14** Angular: one-field "Paste a link, get a video" home card + live stage timeline
- [ ] **A4.15** Tests: stage idempotency, resume-from-failure, gate behaviour, no-AI degradation

### P5 — Spreadsheet in / out (Excel + CSV) — [detail](plans/P05-spreadsheet-io.md)
- [x] **A5.1** Workbook schema v1: `README`, `Project`, `Characters`, `Scenes`, `Dialogue`, `Assets`, `StyleKit`, `Enums`
- [ ] **A5.2** Add ClosedXML (MIT) — justified in the detail file; CSV path stays dependency-free
- [x] **A5.3** `GET /api/templates/bundle` — starter bundle: a CSV per sheet, a README, an empty `media/` folder *(dropdowns need A5.2)*
- [x] **A5.4** `GET /api/templates/ai-prompts` — prompts to paste into any free AI chat to fill the sheet
- [x] **A5.5** `WorkbookReader` — strict typed parse, row/size caps, formula-injection defence, per-cell errors
- [x] **A5.6** `POST /api/projects/{id}/bundle/preview` — dry-run diff (create/update/conflict per row) + staged token
- [x] **A5.7** `POST /api/projects/{id}/bundle/apply` — applies a previewed diff, single-use token
- [ ] **A5.8** `GET /api/projects/{id}/workbook/export` — round-trip export of the live project
- [ ] **A5.9** Autopilot integration: a workbook can seed a run, or a run can emit one for review
- [x] **A5.10** Angular **Bundle** tab: template + prompt-pack download, upload → preview diff → apply
- [x] **A5.11** Tests: 46 across CSV, cell-injection both directions, typed reading, zip-slip, zip-bomb, and the shipped template importing cleanly
- [x] **A5.12** **Project bundle (`.zip`)**: workbook + `media/` images and audio in one file — zip-slip and zip-bomb defended, magic-byte checked, no new dependency
- [ ] **A5.13** `GET /api/projects/{id}/bundle` — bundle export, so a whole project moves between machines with its art
- [ ] **A5.14** No-AI acceptance test: bundle in → rendered video out with **every provider disabled**

### P6 — Media, ASR and synthetic voice — [detail](plans/P06-media-asr-tts.md)
- [ ] **A6.1** Audio-only media fetch through the existing yt-dlp gates → asset with provenance
- [ ] **A6.2** ASR fallback when a video has no captions → cues → the existing script pipeline
- [ ] **A6.3** Word-level timings → tighter mouth flap and karaoke-style captions
- [ ] **A6.4** `AudioSourceMode` (`SourceSlice` | `Synthesized` | `Silent`) on project and scene
- [ ] **A6.5** Per-character voice assignment + TTS line rendering, concatenated to scene timing
- [ ] **A6.6** Loudness normalisation, music ducking (`sidechaincompress`), local royalty-free BGM library
- [ ] **A6.7** Tests: timing drift under synthesis, mode switching, missing-provider degradation

### P7 — Style kits and art direction — [detail](plans/P07-style-kits.md)
- [ ] **A7.1** `StyleKit` domain: prompt fragments, negative prompt, palette, aspect, seed policy, references
- [ ] **A7.2** Seeded character sheets — one seed per character across poses so the face stays the same
- [ ] **A7.3** Background library with location dedupe and reuse across scenes
- [ ] **A7.4** Sprite post-processing: background removal, alpha trim, height normalisation
- [ ] **A7.5** Storyboard contact sheet + fast low-res proof render before the real one
- [ ] **A7.6** Angular: style kit picker with live thumbnails; per-character override

### P8 — Action beats ("fight mode") — [detail](plans/P08-action-beats.md)
- [ ] **A8.1** `ActionBeat` domain: type, intensity, frame window, actors, source confidence
- [ ] **A8.2** Beat extraction from commentary text (keyword pass + LLM pass)
- [ ] **A8.3** Optional beat extraction from source audio energy and shot-cut timings (timings only, no frames)
- [ ] **A8.4** `CharacterPoses` sprite set: idle / attack / hit / down / taunt
- [ ] **A8.5** FFmpeg FX filters: impact flash, shake, speed lines, punch-in — extends `SpriteOverlayFilters`
- [ ] **A8.6** Beat → scene compiler: pose swaps, camera moves, SFX slots
- [ ] **A8.7** Tests: beat timing never exceeds scene bounds; graph builds for every beat type

### P9a — Admin console, first slice (pulled ahead of P4) — [detail](plans/P09-admin-console.md)
- [ ] **A9.1** Real authentication: JWT from the family IdP, `Admin` policy, **default deny** on `/api/admin/*`
- [~] **A9.2** Providers screen — read-only status shipped; **key entry deliberately withheld until A9.1**, since it would be an unauthenticated credential write
- [~] **A9.6** Remaining daily quota per capability shipped; full per-project usage still to do
- [ ] **A9.10** System health: ffmpeg / ffprobe / yt-dlp / whisper / piper / Mongo probes
- [x] **A9.12a** Angular `/admin` area, lazy-loaded — provider/capability/quota status *(role guard needs A9.1)*

### P9b — Admin console, the rest — [detail](plans/P09-admin-console.md)
- [x] **A9.1** *(in P9a)* Real authentication: JWT from the family IdP, `Admin` policy, **default deny** on `/api/admin/*`
- [ ] **A9.2** Providers & keys screen (masked), connection test button, per-provider enable/disable
- [ ] **A9.3** Model catalog + prompt template editor with versioning and diff
- [ ] **A9.4** Recipes/presets editor
- [ ] **A9.5** Policy & feature flags: ingest gates, media download, terms version, distribution rules
- [ ] **A9.6** Quotas and usage dashboard (per provider, per day, per project)
- [ ] **A9.7** Job console: running / failed / retry / cancel / requeue, with sanitized FFmpeg logs
- [ ] **A9.8** Storage & janitor: workspace sizes, orphan sweep, retention controls
- [ ] **A9.9** Rights & audit: attestation register, asset licence review queue, IP-risk acknowledgements
- [ ] **A9.10** System health: ffmpeg / ffprobe / yt-dlp / whisper / piper / Mongo probes
- [ ] **A9.11** `adminAudit` collection — actor, action, before/after, on every admin write
- [ ] **A9.12** Angular admin area, lazy-loaded, role-guarded, hidden entirely from non-admins

### P10 — Originality and rights reporting — [detail](plans/P10-originality.md)
- [ ] **A10.1** Optional paraphrase stage with configurable strength
- [ ] **A10.2** Verbatim-overlap check (n-gram shingling) between output script and source transcript
- [ ] **A10.3** Originality report per render: what came from the source, what was generated, licences, prompts
- [ ] **A10.4** Distribution gate: block a `Monetized` render when any referenced asset's licence is incompatible
- [ ] **A10.5** Downloadable report (JSON + printable HTML) attached to the render job

### P11 — Publishing and batch — [detail](plans/P11-publishing-batch.md)
- [ ] **A11.1** Export presets: 16:9, 9:16 Shorts/Reels, 1:1, with subject-safe auto-reframe
- [ ] **A11.2** Thumbnail generator + title/description/tags/chapters metadata pack
- [ ] **A11.3** SRT/VTT sidecar export alongside burned-in subtitles
- [ ] **A11.4** Batch: playlist, multiple URLs, or a spreadsheet of URLs → queued runs with a concurrency cap
- [ ] **A11.5** Multi-language dub: translated script + per-language TTS + per-language subtitle track

### P12 — Hardening — [detail](plans/P12-hardening.md)
- [ ] **A12.1** Rate limiting and request size caps on every ingest/AI endpoint
- [ ] **A12.2** Structured logging with personal-data scrubbing on the AI and ingest paths
- [ ] **A12.3** Integration tests for the whole autopilot against fakes
- [ ] **A12.4** Update the blueprint's section 47 and README to match reality
- [ ] **A12.5** SignalR (optional) to replace polling, once the polling contract is stable

---

## 4. Suggested execution order

```text
P0  →  P3  →  P5  →  P9a  →  P4  →  P6  →  P7  →  P8  →  P9b  →  P10  →  P11  →  P12
```

`P5` sits before `P4` because the spreadsheet path is **independent of the AI layer**. A
filled workbook — or a bundle carrying its own images and audio — is a complete production
with no key, no quota and no provider configured at all. That makes it the honest test of
principle 1, and it is immediately useful on its own.

`P9a` is the **admin console's first slice** (providers, keys, quota, health), pulled ahead
of the rest of P9. P3 built a provider layer that can only be configured by hand-editing
`appsettings.json`; until there is a screen for it, that layer is not usable by the person
it was built for. The remaining admin work (`P9b` — recipes, policy, job console, audit)
stays after the phases that create the things it administers.

**Standing correction, recorded because it was earned:** P3 delivered a large, well-tested
layer with no screen attached to any of it, which is the wrong order for a project whose
first principle is that AI is optional. From here, **no phase is complete until the thing it
built can be reached from the UI.**
