# P8 — Action beats ("fight mode")

A wrestling or boxing match is not a conversation: the interesting content is in what the
bodies do, and the transcript is only commentary about it. This phase turns that
commentary into choreography.

Note on the copyright framing that motivated it: nothing from the source video is used in
the output. Only **timings** and a **paraphrasable transcript** cross over; every pixel
and every sample is generated. That is what the P10 originality report exists to
evidence — it is a product safeguard, not legal advice, and a genuinely licence-sensitive
upload still needs a human decision.

---

## Actions

### A8.1 — `ActionBeat` domain
`ActionBeat { Id, SceneId, Type, Intensity(0–1), StartFrame, EndFrame, ActorCharacterId,
TargetCharacterId, Source(Keyword|Llm|Audio|Manual), Confidence }`.
`BeatType { Idle, Entrance, Taunt, Strike, Kick, Slam, Throw, Pin, Reversal, Fall,
Recover, CrowdReaction, Countdown, Finish }`.

### A8.2 — Beat extraction from commentary
- Keyword pass first: a curated lexicon per beat type, matched against dialogue text with
  the line's own timing. Deterministic, free, and works with no AI configured.
- LLM pass second (optional): the `action-beats` prompt template returns a strict beat
  array for a scene, merged with the keyword beats, higher confidence winning.

### A8.3 — Beat extraction from source audio (optional)
When audio was fetched: loudness peaks and crowd-noise spikes mark impacts; FFmpeg's
`select='gt(scene,0.4)'` marks shot cuts. **Timings only** — no frames, no samples reach
the output.

### A8.4 — Pose sprites
`CharacterPoses { Idle, Attack, Hit, Down, Taunt }` alongside the existing
`CharacterSprites`. Generated with the character's locked seed (P7). Missing poses fall
back to the closed-mouth sprite, so a half-configured character still renders.

### A8.5 — FX filters
Extends `SpriteOverlayFilters` and `BackgroundMotionFilters`:
impact flash (a 2–3 frame white `blend`), screen shake (`crop` with an oscillating
offset), speed lines (a generated overlay PNG scaled and rotated), punch-in (a short
`zoompan` burst), and a hit-stop (a 1–2 frame freeze). Every one is a pure filter-graph
addition — no new render engine, per the blueprint.

### A8.6 — Beat compiler
Maps beats onto the scene plan: which pose is on screen for which frame window, which FX
fire when, which SFX slot plays, and how the camera moves. Output is the existing
`SceneRenderPlan`, so the renderer is untouched.

### A8.7 — Tests
Beats are clamped to scene bounds; overlapping beats resolve by intensity; the filter
graph builds for every beat type at every canvas size; a scene with no poses still
renders.
