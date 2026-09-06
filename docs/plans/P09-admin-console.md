# P9 — Admin console

One place to control providers, keys, policy, quotas, jobs, storage and audit — so the
studio can be operated without editing JSON or restarting the API.

**This phase introduces the first real authorization boundary in the app.** Until now
`ICurrentUser` is `LocalSingleUserProvider`. An admin surface that can set provider keys,
disable rights attestation and read audit records cannot ship behind a hard-coded
"local-user".

---

## Actions

### A9.1 — Authentication and the admin policy
- Wire the family SSO: HS256 JWT, issuer `keshavsingh-idp`, audience `keshavsingh-apps`,
  the shared signing key from configuration (never a literal), exactly as the sibling apps
  do. `ICurrentUser` reads the token subject.
- `/api/admin/*` requires an authenticated principal in the `Admin` role. **Default deny**:
  the policy is applied at the controller base, not per action, so a new endpoint is
  protected by omission rather than exposed by it.
- Local development keeps a single-user fallback, but only when explicitly enabled by
  configuration **and** the environment is Development — never a silent bypass.
- Every existing per-project ownership check stays; admin does not mean "read anyone's
  project" unless an explicit impersonation action is used and audited.

### A9.2 — Providers and keys
Table of every provider: capability, enabled, configured, health, model, base URL, free
tier note, quota used today. Actions: enable/disable, set model, set base URL (validated
against the SSRF allowlist), **set key** (write-only), rotate, clear, and "test
connection" which makes one minimal call and shows the sanitized result.
Keys display as `••••9f2c` and are never returned in full.

### A9.3 — Model catalog and prompt templates
Catalog rows: provider, model id, capability, context, cost hint, notes. Prompt template
editor with version history, a diff view, a variable checklist, an output-schema field
and a dry-run box that renders the prompt with sample values without calling anything.

### A9.4 — Recipes editor
Create/clone/edit the P4 recipes: canvas, style kit, segmentation overrides, audio mode,
voice preset, music, transitions, subtitle style, auto-approve.

### A9.5 — Policy and feature flags
`AllowUrlIngest`, `AllowMediaDownload`, `RequireRightsAttestation`, `TermsVersion`,
`AllowHttpUrls`, caps, retention, distribution rules, per-capability AI enable.
Changing a policy writes an audit row; the policy snapshot already stored on each
attestation keeps history honest.

### A9.6 — Quotas and usage
Per provider per day: calls, units, estimated cost, cache-hit rate, failures. Per project
totals. Editable ceilings. Cache-hit rate is the number to watch — it is the difference
between a free-tier that lasts and one that runs out at scene 12.

### A9.7 — Job console
Render jobs and pipeline jobs: filter by status, inspect stages, retry a stage, cancel,
requeue a poison job, and read the **sanitized** FFmpeg tail (`LogSanitizer` already
exists and must be used here).

### A9.8 — Storage and janitor
Workspace and object-store sizes, orphan sweep (assets no scene references, workspaces
with no job), retention settings, and a manual "clean temp now".

### A9.9 — Rights and audit
Attestation register (basis, terms version, policy snapshot, who and when — the attester
name is personal data and is shown only in this screen, never in list endpoints or logs),
asset licence review queue for `PendingReview`, and the IP-risk acknowledgement log.

### A9.10 — System health
Probes for ffmpeg, ffprobe, yt-dlp, whisper, piper, Mongo, object store and each AI
provider, with version strings and the last check time. Reuses `FfmpegCapabilityProbe`.

### A9.11 — Admin audit trail
`adminAudit`: actor, action, target, before/after (secrets redacted), timestamp, source
IP. Written for every admin mutation. Read-only in the UI, no delete.

### A9.12 — Angular admin area
Lazy-loaded `/admin` route behind a role guard, hidden from the shell for non-admins.
Client-side hiding is cosmetic — the server check in A9.1 is the control.
