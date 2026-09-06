# P4 — Autopilot: one URL in, a finished animated video out

The headline feature. Paste a YouTube link, pick a recipe (or accept the default), and
get a rendered animated video with generated characters, generated backgrounds, voices,
subtitles and music — with no other input required.

---

## The pipeline

```text
 1  ResolveSource      URL validate, rights gate, duplicate check
 2  Transcript         captions  ->  (no captions?)  media fetch + ASR
 3  Script             existing SegmentationEngine
 4  Cast               existing CastingService + narrator
 5  CharacterBuild     AI: names, aliases, appearance, voice hint
 6  Sprites            AI images: closed/open mouth per character, locked seed
 7  Backgrounds        AI images: one per distinct location, reused across scenes
 8  Audio              source slice | TTS per character | silent
 9  SceneAssembly      existing SceneGenerationService
10  Render             existing ProjectRenderOrchestrator
11  Finish             thumbnail, metadata pack, originality report
```

Stages 1–4, 9 and 10 are **wrappers over code that already works**. The new code is the
orchestrator, stages 5–8, and stage 11.

---

## Design decisions

**Resumability.** `PipelineJob` stores every stage with its own status, progress,
attempt count, error code and an output pointer. The orchestrator runs the first stage
that is not `Completed`. A dead worker, a rate-limit refusal or a bad prompt costs one
stage, not the run.

**Idempotency.** Each stage is keyed by `(jobId, stageId, inputHash)`. Re-running a
completed stage with the same input hash is a no-op; changed input marks downstream
stages dirty. Combined with the P3 result cache, retrying is nearly free.

**Degradation, not failure.** Missing AI means the stage records `Skipped` with a reason
and the pipeline continues: no sprites means subtitle-only scenes, no TTS means source
audio or silence, no backgrounds means a solid colour from the style kit. A run with
zero providers configured still produces a watchable subtitled video — which is exactly
what the blueprint demands.

**Fewest possible inputs.** The required input is a URL. Everything else has a default
from the recipe, and the recipe itself defaults from the detected content type.

---

## Actions

### A4.1 — `PipelineJob` domain and repository
- `PipelineJob { Id, ProjectId, UserId, RecipeId, Status, CurrentStageId, Stages[],
  CreatedAt, StartedAt, CompletedAt, LeaseOwner, LeaseExpiresAt, Attempt, ErrorCode }`.
- `PipelineStageState { StageId, Order, Status, Progress, Message, InputHash, OutputRef,
  Attempts, ErrorCode, StartedAt, CompletedAt, SkipReason }`.
- Collection `pipelineJobs`, indexes mirroring `renderJobs` (status + lease, project + created).

### A4.2 — `IPipelineStage` and the orchestrator
```csharp
public interface IPipelineStage
{
    string StageId { get; }
    Task<StageOutcome> ExecuteAsync(PipelineContext context, IProgress<StageProgress> progress,
                                    CancellationToken ct);
}
```
`PipelineContext` carries the job, project, recipe, resolved provider handles and a
scratch workspace. `StageOutcome` is `Completed | Skipped(reason) | Failed(code) | NeedsApproval`.

### A4.3 — `AutopilotWorker`
Copy the proven claim/lease/heartbeat pattern from `RenderJobWorker`: atomic
`FindOneAndUpdate` claim, lease renewal while working, `MaxAttempts` with backoff, and a
poison-job path. Concurrency capped by config, defaulting to 1.

### A4.4 — Stages 1–4 (wrappers)
Thin adapters over `TranscriptIngestService`, `SegmentationEngine`, `CastingService`.
No behaviour change; the value is that they now report progress into one job.

### A4.5 — Character build (AI text)
- Prompt template `character-extraction` returns a strict array of
  `{ name, aliases[], role, age, gender, hair, clothes, distinguishingFeatures,
     voiceHint, subtitleColor }`.
- Merged with the speakers `CastingService` already found; a speaker with no AI match
  stays a narrator. Existing characters are never overwritten — a user edit wins.
- Output passes `AiOutputSanitizer` before it touches the DB.

### A4.6 — Sprite generation
- Per character, one **locked seed** derived from `SHA256(projectId|characterName)`, so
  the closed-mouth and open-mouth renders — and any later re-generation — stay the same
  person.
- Prompt = style kit fragments + character description + pose instruction +
  "transparent background, full body, centred".
- Post-process (P7): background removal, alpha trim, height normalisation.
- Stored as assets with `AiProvenance` and the provider's licence class.

### A4.7 — Background generation
- Locations are derived from scene text (LLM: "name the setting in 3 words"), normalised
  to a key, and **deduped**: one arena image serves every arena scene. A 40-scene fight
  needs perhaps 4 images, not 40 — the single biggest free-tier saving in the product.
- Falls back to the style kit's flat colour when image generation is unavailable.

### A4.8 — Audio
Honours `AudioSourceMode` from P6. Default for a URL ingest is `Synthesized`, because
generated voices remove the source-audio reuse question entirely; `SourceSlice` remains
available and gated behind the media-download policy.

### A4.9 — Finish stage
Thumbnail (highest-contrast frame + title overlay), metadata pack (title, description,
tags, chapters from segment boundaries), and the P10 originality report.

### A4.10 — Recipes
`Recipe { Id, Name, Description, Canvas, StyleKitId, SegmentationOverrides,
CastingPolicy, AudioMode, VoicePreset, MusicPreset, TransitionPreset, SubtitleStyle,
PublishPreset, AutoApprove }`.

Seeded recipes:
| Recipe | Canvas | Style | Audio | Notes |
| --- | --- | --- | --- | --- |
| `fight-anime-vertical` | 1080×1920 | anime action | synthesized commentary | action beats on (P8) |
| `fight-comic-wide` | 1920×1080 | comic halftone | synthesized | impact panels |
| `podcast-talking-heads` | 1920×1080 | flat vector | synthesized per speaker | two-shot staging |
| `news-explainer` | 1920×1080 | clean infographic | synthesized narrator | b-roll backgrounds |
| `story-storybook` | 1920×1080 | watercolour | synthesized narrator | slow Ken Burns |

### A4.11 — `POST /api/autopilot`
```json
{ "url": "https://www.youtube.com/watch?v=...",
  "recipeId": "fight-anime-vertical",
  "projectName": "optional - derived from the video title when omitted",
  "rightsAttestation": { "isOwnerOrLicensed": true, "basisCode": "OtherLawfulBasis" } }
```
Creates the project when `projectId` is absent, creates the pipeline job, returns
`{ projectId, pipelineJobId }`. Also `POST /api/projects/{id}/autopilot` for an existing
project. Idempotency key honoured exactly as ingest already does.

### A4.12 — Polling and control
`GET /api/pipeline-jobs/{id}` returns overall status plus the stage array — enough for a
live timeline. `POST .../cancel`, `POST .../retry` (whole job or a single stage id),
`POST .../stages/{stageId}/regenerate` for "I don't like this background".

### A4.13 — Approval gates
When `AutoApprove` is false the run pauses at `NeedsApproval` after script, casting and
storyboard. `POST .../approve` resumes. Default recipes ship with `AutoApprove: true`
because the point of this feature is not being asked.

### A4.14 — Angular
- Dashboard gains a single input: **"Paste a YouTube link"** + a recipe chip row +
  a Start button. That is the whole form.
- A run page with a vertical stage timeline, per-stage thumbnails as they appear, and
  per-stage "regenerate" buttons. Polls the existing 2–3s cadence.

### A4.15 — Tests
Stage idempotency (same input hash ⇒ no work), resume from a mid-pipeline failure,
approval gate blocks and resumes, and a full run with every provider `Null` still
reaching `Completed` with a rendered file.
