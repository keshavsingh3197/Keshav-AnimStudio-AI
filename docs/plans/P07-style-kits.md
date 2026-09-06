# P7 — Style kits and art direction

Consistency is what separates "AI slop" from a watchable animated video: the same
character must look the same in scene 1 and scene 40, and every frame must look like it
came from one production.

---

## Actions

### A7.1 — `StyleKit` domain
`StyleKit { Id, Name, Description, PositivePrompt, NegativePrompt, Palette[],
PreferredAspect, SeedPolicy, ModelHint, ReferenceAssetIds[], BackgroundFallbackColor }`.
Seeded kits: anime action, comic halftone, flat vector, watercolour storybook, clean
infographic, pixel art. A project references one; a character or scene may override.

### A7.2 — Seeded character sheets
- One seed per character (`SHA256(projectId|characterName)`), reused for every pose and
  every regeneration, so the face survives.
- Generate a small sheet in one pass where the provider supports it: closed mouth, open
  mouth, and the P8 poses — cheaper and far more consistent than independent calls.

### A7.3 — Background library and dedupe
- `BackgroundLibrary` keyed by normalised location name per project. Scene 12 asking for
  "wrestling ring" gets scene 3's image.
- Variants on demand (angle/time-of-day) when a user wants visual variety.

### A7.4 — Sprite post-processing
Background removal (local provider, with an FFmpeg `colorkey` fallback for flat
backgrounds), alpha bounding-box trim, and normalisation so `HeightFraction` means the
same thing for every character. Runs once at generation, not at render time.

### A7.5 — Proof render and storyboard
- **Storyboard contact sheet**: one PNG grid of every scene's background + staged sprites
  + first line of dialogue. Generated in seconds; catches casting and staging mistakes
  before a 20-minute render.
- **Proof render**: 480p, CRF 32, `ultrafast`, no subtitles — a 40-scene proof in well
  under a minute. Reuses the existing plan factory with an override profile.

### A7.6 — Angular
Style kit picker with live thumbnails, per-character override, and a "regenerate with a
different seed" control that keeps everything else fixed.
