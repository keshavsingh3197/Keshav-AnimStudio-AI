# Handoff: transition duration loss + a real Split dialog

Two independent tasks in `D:\GITHUB\Keshav-AnimStudio-AI`. Task 1 is a correctness bug with a
real design decision in it. Task 2 is a new dialog. They do not depend on each other — do
Task 1 first, it is the one losing the user footage.

**Repo layout:** Angular 22 frontend (`frontend/`), ASP.NET Core net10.0 backend (`backend/`),
xUnit tests (`tests/`). Build with `cd frontend && npx ng build --configuration development`
and `dotnet build AnimStudio.slnx`. Test with `dotnet test AnimStudio.slnx`.
**There is no frontend test runner** — `angular.json` defines only `build` and `serve`, so
`ng build` plus booting the app is the check. Read `docs/AUDIO_MODEL.md` first if you touch
anything audio-adjacent; it records conventions this codebase now follows.

---

## TASK 1 — Transitions must stop eating clip duration

### The bug, precisely

`frontend/src/app/features/clips/services/studio-state.service.ts`, in the `clipSchedule`
computed, around **line 910**:

```ts
curStart += Math.max(0, dur - jSecs);
```

Every junction pulls the next clip *backwards* by the transition length, so the finished
video is `sum(durations) - sum(transitions)`. With the user's real project — **89 clips, a
0.5s Dissolve on each of 88 cuts** — that is **44 seconds of footage silently gone**, and
every clip loses the first/last 0.25s of its visible content.

This is not only a preview artefact. The backend does the same arithmetic on purpose:

- `backend/AnimStudio.Infrastructure/Ffmpeg/Graph/FfmpegFilterGraphBuilder.cs` ~line 645
  builds `xfade=transition=…:duration=…:offset=…`, and ffmpeg's `xfade` **always** outputs
  `A + B - duration`. The offsets are computed to match the frontend schedule.
- `backend/AnimStudio.Infrastructure/Ffmpeg/Graph/AudioFilters.cs` (`SceneChain`, see its
  comment around line 21) deliberately drives `acrossfade` from the *same* arithmetic so
  audio and video stay locked. **If you change the video timing and not the audio, the two
  drift apart and the whole edit goes out of sync.** Change both or neither.

### What to build

Each clip must occupy its **full duration** on the timeline. The transition overlap should be
paid for with *extra* media — the frames outside the clip's trim points — not by shortening
what the user chose to keep.

For a junction of length `J` between clip A and clip B:

1. **Preferred — borrow from spare media.** If A has at least `J/2` unused footage after
   `trimEndSeconds`, and B has at least `J/2` before `trimStartSeconds`, extend A's tail and
   B's head by `J/2` each and overlap them there. Both clips keep every frame the user chose;
   the dissolve happens over footage that was being discarded anyway.
2. **Fallback — no spare media.** When either side lacks the room (a clip trimmed to the very
   end of its file, or an image with no media at all), hold the last frame of A / first frame
   of B for the shortfall. In ffmpeg this is `tpad=stop_mode=clone:stop_duration=…` before the
   xfade. Total duration is still preserved.
3. **Timeline maths.** `curStart += dur` — no subtraction. `clipSchedule` entries keep
   `startSeconds`/`endSeconds` exactly `dur` apart. Transition overlap becomes presentation
   detail, not layout.

Add to each `ScheduledClip` (in `frontend/src/app/features/clips/models/clip-studio.models.ts`)
whatever the renderer needs to reproduce this — e.g. `leadInSeconds` / `tailOutSeconds`
actually borrowed, and a flag for which clips fell back to a freeze. The backend needs those
numbers; do not let it recompute them independently, or preview and export will disagree the
way clip ducking used to (see `docs/AUDIO_MODEL.md` §3 for why that mattered).

### Where it must stay consistent

Changing the schedule ripples. All of these read it:

- `components/video-viewport/video-viewport.component.ts` — preview playback and the
  A/B video-layer crossfade.
- `components/timeline-dock/timeline-dock.component.html` — clip rectangles are positioned
  by `secondsToPx(sched.startSeconds)`, and the cut-seam markers sit at
  `clipSchedule()[i + 1].startSeconds`.
- `services/studio-state.service.ts` → `musicDuckWindowsPayload()` and `clipAudioPayload()` —
  both use schedule times to line audio up with clips.
- `backend/.../FfmpegFilterGraphBuilder.cs` and `AudioFilters.cs`.

### Acceptance

- A project of N clips with transitions on every cut renders **exactly `sum(durations)`**
  long, in preview and in the exported file. Verify the export with
  `ffprobe -show_entries format=duration`.
- No clip loses visible content: the first and last frames the user trimmed to are still
  present.
- Audio stays in sync — check a clip's dialogue against its picture near the end of a long
  timeline, where drift accumulates.
- Add xUnit coverage in `tests/AnimStudio.Application.Tests/Rendering/`. Follow the style of
  `MusicDuckGraphTests.cs` there: build a `MergePlan`, call
  `FfmpegFilterGraphBuilder.BuildMerge(plan)`, assert on `built.FilterComplex` as a string.
  No ffmpeg needed. Cover: duration preserved with spare media; duration preserved on the
  freeze-frame fallback; a zero-length transition produces byte-identical filtergraph text to
  a hard cut.

### Watch out for

- `xfade` needs `setpts=PTS-STARTPTS` before it and rejects a chain with `fps`/`settb`
  ahead of it — there are comments at `FfmpegFilterGraphBuilder.cs` ~line 625 explaining
  exactly why. Do not reorder that chain.
- The hard-cut path is a **stream copy** (`BuildConcatMerge`). It must stay a stream copy;
  re-encoding there throws away the whole point of the conform pass.
- `FilterExpr.Quote()` escapes `,` and `:` inside filter expressions. Use it for anything
  with an expression, or the filter chain splits and the graph silently misbehaves.

---

## TASK 2 — A real Split dialog

### Where it is now

`splitClipAtPlayhead()` in `services/studio-state.service.ts` **line 3666**. It splits
instantly at the playhead with no confirmation, no preview, and no way to adjust — bound to
the `S` key and the Split toolbar button in
`components/timeline-dock/timeline-dock.component.html`.

The logic itself is sound and should be **reused, not rewritten**: it finds the clip under
the playhead, then builds `clipA`/`clipB` sharing the same `assetId` with adjusted
`trimStartSeconds`/`trimEndSeconds` and ids `${realAssetId}_part_${ts}_1|2`.

### What to build

A dialog that opens instead of splitting immediately. It must let the user:

- **See the split point and change it.** A time field (`mm:ss.mmm`), a scrubber across the
  clip, and nudge buttons (±1 frame, ±1 second). Default to the current playhead.
- **See both halves.** Two side-by-side preview panes — Part 1 and Part 2 — each with a
  thumbnail at its boundary frame, its resulting duration, and a small **Play** button that
  previews just that half. Both update live as the split point moves.
- **Confirm or cancel.** Nothing changes until Confirm. Cancel leaves the clip untouched.
- **Refuse impossible splits** — within ~0.05s of either end. Disable Confirm and say why
  rather than failing after the click.

### UI pattern to follow

Copy the structure of the insert-position dialog added recently, so the app keeps one dialog
language:

- Markup: `frontend/src/app/features/clips/clip-studio.component.html`, the block guarded by
  `@if (state.insertPrompt(); as prompt)`.
- Styles: `frontend/src/app/features/clips/clip-studio.component.css`, the `.insert-dialog*`
  rules at the end of the file.

Match it: `.modal-backdrop` wrapper, click-outside to cancel, `$event.stopPropagation()` on
the panel, a header with an `×`, quick-choice buttons, a live preview strip, then a
right-aligned Cancel / primary-action pair. Reuse the CSS custom properties
(`--surface`, `--surface-2`, `--border`, `--text`, `--muted`, `--brand`, `--ok`) rather
than hard-coding colours, and keep the panel at `width: min(…px, calc(100vw - 32px))` so it
survives a narrow window.

State goes on `StudioStateService` as signals, matching the existing naming:
`splitPrompt`, `splitPromptSeconds`, plus computeds for the two resulting durations.
Wire `Escape` to cancel and `Enter` to confirm — the global key handler is
`handleGlobalKeydown` in `frontend/src/app/features/clips/clip-studio.component.ts`, which
already early-returns when focus is in an `INPUT`/`TEXTAREA`.

### Acceptance

- `S` and the Split button both open the dialog; neither splits anything on its own.
- Moving the split point updates both durations and both thumbnails live.
- Confirm produces exactly what today's `splitClipAtPlayhead()` produces for the same time.
- Cancel and `Escape` leave the project byte-identical.
- Dialog is usable at 1280px wide.

---

## Ground rules for this codebase

- **Preview and export must agree.** Any value that affects both is computed once and shared.
  `docs/AUDIO_MODEL.md` §3 documents the last time they diverged and what it cost.
- **Do not add a control that does nothing.** This project had a WebAudio graph nothing was
  connected to, VU meters drawing a sine wave, and mixer faders playback never read; all were
  deleted. A control that lies is worse than no control.
- **Comments explain the non-obvious *why*,** not what the line does. Match the density
  already in `AudioFilters.cs` and `studio-state.service.ts`.
- **`studio-state.service.ts` is ~5,700 lines.** Edit it with exact-match string replacement
  on a unique anchor. Do not use loose substring searches like `s.index('  }')` — a two-space
  pattern matches inside a four-space indent and will silently truncate the class, detaching
  every method after it. (This happened; the build caught it, but only because TypeScript
  checks templates.)
- **Run `npx ng build` after every edit to that file.** It is the only thing that catches a
  structural mistake.
- The user runs the backend locally; it holds the built DLLs, so `dotnet test` may fail with
  `MSB3021 file is locked by AnimStudio.Api`. That is not a code failure — ask them to stop
  the API, or test the frontend independently.
- Do not commit without being asked.
