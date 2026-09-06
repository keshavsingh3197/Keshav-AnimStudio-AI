# P6 — Media, ASR and synthetic voice

Two gaps close here: videos that have **no captions** (most sports and fight footage), and
audio that must not be lifted from the source.

---

## Actions

### A6.1 — Audio-only media fetch
- Extends `YtDlpCaptionDownloader` with an audio-only fetch (`-f bestaudio`, remuxed to
  WAV 16 kHz mono for ASR, plus an M4A copy when slicing is permitted).
- Stays behind **both** existing gates: `Ingest:AllowMediaDownload` and
  `Ingest:YtDlp:Enabled`, with the policy snapshot already recorded in `RightsAttestation`.
- Audio-only is the default because it is all the pipeline needs — no video frames are
  ever used in the output.

### A6.2 — ASR fallback
- When caption fetch yields nothing and media is permitted, `ITranscriptionProvider`
  transcribes the audio and emits SRT/VTT, which feeds the **existing** `SubtitleParser`.
  Nothing downstream learns that the source changed.
- `TimingSource` records `Real` (ASR timings are real media timings).
- Warnings surface ASR confidence so the user knows to check names.

### A6.3 — Word-level timings
- Providers that emit word timings populate a `WordTimings` list on the cue.
- Two payoffs: mouth flap driven by actual speech rather than a fixed 8 Hz, and
  karaoke-style caption highlighting in the ASS writer.
- Degrades silently to the current behaviour when absent.

### A6.4 — `AudioSourceMode`
`SourceSlice | Synthesized | Silent`, on the project with a per-scene override.
`Synthesized` becomes the default for URL ingest.

### A6.5 — Per-character voice + TTS
- `Character.Voice { ProviderVoiceId, Rate, Pitch, Gender }`, auto-assigned from the AI
  voice hint with a deterministic fallback so two characters never share a voice by luck.
- Each dialogue line renders to its own WAV, cached by `SHA256(text|voice|params)`.
- Lines are placed on the scene timeline at their `RelativeStart`, padded or gently
  time-stretched (`atempo`, capped at ±8% so nobody sounds like a chipmunk) to fit the
  segment. Where synthesis runs long, the scene duration grows — the scene clock is
  authoritative, and `RenderTimeline` already recomputes from scene durations.

### A6.6 — Mix
Loudness normalisation (`loudnorm` to −16 LUFS), background music ducked under dialogue
with `sidechaincompress`, and a small bundled royalty-free music library with per-recipe
selection. All FFmpeg-native; extends `AudioFilters`.

### A6.7 — Tests
Timing drift across a 40-scene synthesized run stays within one frame; mode switching
does not orphan assets; a missing speech provider falls back to `Silent` with a warning
rather than failing the render.
