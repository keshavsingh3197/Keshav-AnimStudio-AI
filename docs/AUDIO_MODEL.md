# Audio & Voice — what controls what

The rule this document exists to keep: **every audio setting lives in exactly one place, and
when several could apply, the UI says which one won.**

Before this was written the studio had four independent settings that all decided the same
thing — whether a clip's own sound or the music underneath it gets heard. They had no stated
precedence, the preview and the export disagreed about one of them, and the panel that showed
them ignored the scope chooser sitting above it. This is the replacement.

---

## 1. The three things you can actually set

Everything in the Audio & Voice inspector is one of these:

| | What it is | Where it lives |
| --- | --- | --- |
| **Level** | How loud one source is | Mix view (per bus), Selection view (per clip / per music track) |
| **Overlap rule** | What happens where video sound and music collide | Mix view (project default), Selection view (per music track, per clip) |
| **Shaping** | Fades and trim | Selection view only |

There is no fourth category. If a proposed control is not one of these, it does not belong in
this panel.

---

## 2. The overlap rule

One vocabulary, used identically at all three levels:

| Rule | Video sound | Music |
| --- | --- | --- |
| `PlayBoth` | full | full |
| `DuckMusic` | full | × duck depth |
| `DuckVideo` | × duck depth | full |
| `MusicOnly` | silent | full |

A music track or a clip may also say `Inherit`, which defers to the level above.

**The rule only applies where music actually plays under the clip.** With no music there, a
clip set to `MusicOnly` still plays its own sound — the rule has nothing to arbitrate.

### Precedence

```
clip  >  music track  >  project default
```

Resolved in exactly one function, [`StudioStateService.resolveOverlap()`][resolve]. Both the
preview and the export payload call it. Nothing else is allowed to decide this — that split
brain is what made the old behaviour impossible to predict.

`resolveOverlap` returns the rule, **which level set it**, the duck depth in force, and the
two gains. The Selection view prints the source back to the user as a sentence:

> Duck music — inherited from music track "theme.mp3".

### Duck depth

One number, set project-wide in the Mix view, with an optional per-clip override. It is used
by both `DuckMusic` and `DuckVideo` — it is "how far the ducked side drops", not "how far the
music drops".

---

## 3. Preview and export must agree

The preview sets `volume` on the media elements. The export sends a payload the server turns
into an ffmpeg filtergraph. They can only agree if they start from the same resolved rule,
which they now do.

One asymmetry is unavoidable and worth knowing:

- **Ducking the video** folds into the clip's own volume, so it rides along in `clipAudio[].volume`.
- **Ducking the music** cannot — the music is a different input. The client sends
  `musicDuckWindows`, and the server builds a gain envelope over the music from them.

Windows that touch at the same level are merged before sending, so a run of dialogue is one
envelope step instead of one duck per cut.

### The envelope

`AudioFilters.DuckEnvelope` emits a single `volume` filter with a per-frame expression:

```
volume='(1+(L-1)*min(attack,release))*(…next window…)':eval=frame
```

Three things about it are deliberate:

- **One filter, many windows.** The graph stays flat however long the edit is.
- **Ramped, not stepped.** Each window slopes in and out over 180 ms. A hard step clicks, and
  a click is far more audible than the duck.
- **Multiplied, not nested ifs.** Overlapping windows compose instead of the first match winning.

An edit with nothing to duck emits no expression at all, so an unducked render produces
byte-identical filtergraph text to what it always did.

Measured on a 440 Hz tone with one window at level 0.25: −32.0 dB before, −44.1 dB inside,
−32.0 dB after. That is the −12.04 dB that 0.25 should give, recovering fully.

---

## 4. The two views

The panel follows the timeline selection. It does not guess.

**Mix** — the whole project. Three faders (V1 video sound, A1 music, Master), the project
default overlap rule, the duck depth. Nothing that belongs to one clip.

**Selection** — whatever is selected, in a fixed order so nothing has to be hunted for:

| Selected | Card |
| --- | --- |
| nothing | what to click, plus shortcuts |
| a music track | level → rule → fades → trim |
| one clip | level → rule (+ resolved line) → fades |
| several clips | level → rule, applied to whatever **Apply to** names |

### The Apply-to chooser

`targetScope` is **cross-tab state** — framing, colour, text and effects all resolve their
targets through `getTargetClipIds()`. So it lives in the dock header, labelled **Apply to**,
and is rendered for every tab except Transitions (which edits cut seams, not clips).

It was briefly moved inside the audio multi-selection card. That was wrong twice over:

- Picking a single-clip scope collapses the selection, which unmounts the card the chooser
  was inside — so it could be used exactly **once** per page load.
- The other four tabs read the same scope and had no way to set it. Their empty states still
  read *"switch target scope to 'All clips' or 'Current clip'"*, naming a control that had
  been deleted.

The original complaint it was meant to fix — that the chooser did nothing on half the audio
panels — is addressed by making every panel honour it, not by hiding it.

Choosing a scope now also *makes that scope the selection*, so the timeline highlight and the
panel never disagree about what is being edited.

---

## 4a. One scope bar for every tab

`<app-scope-bar what="Colour grading" verb="grade">` replaced four hand-rolled banners that
each branched five ways on `targetScope` and had drifted apart in wording, plus four empty
states that described a control instead of offering one. It renders either:

- **the targets, as buttons**, when the scope resolves to no clips, or
- **one line** — "Visual effects applies to all 89 clips."

A tab's controls stay hidden while the scope resolves to nothing, so nothing looks editable
that would write to zero clips.

Transitions has its own version of the problem and its own answer: it cannot follow a clip
selection because it edits seams, so when a clip *is* selected it offers that clip's two
adjacent cuts by name rather than saying "select a cut seam" with 88 to choose from.

---

## 5. What was removed, and why

| Removed | Was | Now |
| --- | --- | --- |
| `ClipAudioSetting.duckMode` | `Normal`/`Ducked`/`MuteOnAudio`/`LeadVoice` | `overlapRule`. `LeadVoice` and `Ducked` did the same thing. |
| `ClipAudioSetting.musicVolumeOverride` | free per-clip music level | `DuckMusic` + `duckLevelOverride` |
| `MusicTrackRow.clipAudioMode` | `MuteUnderMusic`/`KeepAudio`/`Ducked`/`Default` | `overlapRule` |
| `v1AudioMode` | `Never`/`Always`/`MuteOnAudio` | `projectOverlapRule`. `Always` was never an overlap rule — it is a muted V1 bus. |
| V2 / A2 mixer faders | persisted, drawn, never read by playback | gone |
| VU peak meters | `getTrackPeak` drew a **sine wave** for V1/V2; A1/A2 read zero because nothing was ever connected to the graph | gone |
| `AudioEngineService` | a complete WebAudio graph whose `connectMediaElement` and `getOrCreateSource` were never called, so every gain ramp ran on silence | deleted |
| `DuckMode` on the API contract | accepted, validated, never read by any renderer | gone |

The deprecated fields survive on the **models** so old drafts can be read.
`migrateLegacyOverlapSettings()` maps them once on load and never re-runs against a draft
that already carries an `overlapRule`.

---

## 6. If you add a control here

1. Which of the three categories is it? If none, it does not go in this panel.
2. If it can be set at more than one level, it goes through `resolveOverlap` — do not add a
   second `if/else` chain in the viewport or the payload builder.
3. If the preview honours it, the export must too. If the server cannot express it, say so in
   the UI rather than letting it silently vanish at render time.

---

## 7. Known gaps

- **A2 timeline items play at the A1 level.** Audio items on the A2 track are mixed by the
  preview using `trackA1Volume` and are not muted by `isTrackMuted('A2')`. This predates the
  rework; A2 has no fader now, so nothing contradicts it on screen, but it is not right.
- **No real metering.** Removing the fake meters left the Mix view without any. Wiring real
  ones means routing the media elements through a WebAudio graph, which silences playback
  outright if an asset is served cross-origin without `crossOrigin="anonymous"`.
- **The frontend has no unit tests.** `angular.json` defines only `build` and `serve`, so
  `npm test` cannot run. `ng build` is the check.

[resolve]: ../frontend/src/app/features/clips/services/studio-state.service.ts
