# P10 — Originality and rights reporting

Makes the "no copyright problem" claim inspectable instead of assumed. It records what
crossed over from the source, what was generated, and under what licence — so a human can
make an informed call before publishing.

**Not legal advice.** The report is evidence for a decision, not a clearance.

---

## Actions

### A10.1 — Paraphrase stage
Optional pipeline stage with strength `Off | Light | Moderate | Heavy`. Rewrites dialogue
while preserving meaning, speaker attribution and timing budget (the rewrite must fit the
line's frame window, or the line splits). Runs on `ITextAiProvider`; `Off` is the
no-AI default.

### A10.2 — Verbatim overlap check
- Shingle the output script and the source transcript into 5-grams, compare with Jaccard
  similarity plus a longest-common-run measure.
- Report per scene: overlap %, longest verbatim run, and the offending lines.
- Configurable thresholds surface a warning on the render page. Never a silent block.

### A10.3 — Originality report
Per render, a document listing: source URL and attestation; what was taken from the
source (timings, transcript, and nothing else); ASR vs caption provenance; audio mode
(synthesized vs sliced); every generated asset with provider, model, prompt hash, seed and
licence class; every uploaded asset with its provenance; overlap statistics; style kit;
and the distribution intent.

### A10.4 — Distribution gate
A `Monetized` project refuses to render while any referenced asset has a licence class of
`NonCommercial`, `NoDerivatives`, or `ShareAlike` without the existing
`AcceptShareAlikeObligation` opt-in, or `Unknown` where policy requires known. The
existing `DistributionIntent` and `LicenseClass` fields already model this; this action
enforces it.

### A10.5 — Delivery
`GET /api/render-jobs/{id}/originality-report` as JSON, plus a printable HTML view, both
attached to the render job and shown on the render page.
