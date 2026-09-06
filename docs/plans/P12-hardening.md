# P12 — Hardening

---

## Actions

### A12.1 — Rate limiting and size caps
ASP.NET Core rate limiting on ingest, AI, upload and autopilot endpoints, keyed by user.
Request body caps per endpoint rather than one global maximum. Concurrency caps on the
workers so a batch cannot starve interactive renders.

### A12.2 — Logging discipline
Structured logs with a scrubbing enricher: no attester names, no transcript bodies, no
prompts containing user text, no keys, no full storage paths. `LogSanitizer` already does
this for FFmpeg output — extend the same idea to the AI and ingest paths.

### A12.3 — Integration tests for autopilot
Full pipeline against fake providers plus the real FFmpeg (gated by the existing
`FfmpegFactAttribute`): asserts a finished MP4, correct scene count, subtitle presence,
and that a mid-run failure resumes.

### A12.4 — Documentation
Update the blueprint's section 47 (it still says "Current Phase: PHASE 1"), add a README
with the real setup path (Mongo, FFmpeg, optional yt-dlp/piper/whisper/ComfyUI), and keep
`docs/ROADMAP.md` ticked as work lands.

### A12.5 — SignalR (optional)
Only once the polling contract has stopped changing. The job responses are already shaped
for it, as the blueprint intended.
