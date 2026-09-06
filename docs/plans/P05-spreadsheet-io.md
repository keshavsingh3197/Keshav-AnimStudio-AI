# P5 — Spreadsheet in / out

Bulk-edit a whole production in Excel: characters, scenes, dialogue, style. Generate the
sheet with any AI chat tool, upload it, review the diff, apply. Export the live project
back out to keep iterating.

---

## Why this matters

**This is the path that needs no AI at all.** Principle 1 says every feature must degrade to
a working non-AI path; this phase is where that stops being a promise. A filled workbook — or
a bundle that carries its own images and audio — defines a complete production with no key,
no quota and no provider configured. Nothing in P3 has to be switched on for it to work.

It is also the highest-leverage "less input, more output" feature in the roadmap: one upload
can define 60 scenes and 8 characters that would take an hour of clicking. And it gives free
AI tools a job they are good at — filling a table — without needing an API key: paste the
prompt pack into any chat, get a table, save as `.xlsx`, upload. The AI, if it is used at
all, is used *outside* this application.

---

## Workbook schema v1

| Sheet | Purpose | Key column |
| --- | --- | --- |
| `README` | Instructions, schema version, do-not-rename warning | — |
| `Project` | Name, description, canvas, fps, distribution intent, music, style kit | single row |
| `Characters` | Name, aliases, age, gender, hair, clothes, details, narrator?, colour, voice, anchor, height fraction | `Name` |
| `Scenes` | SceneNumber, Title, Description, DurationSeconds, Location, Background asset/prompt, Animation, Intensity, Transition, TransitionSeconds | `SceneNumber` |
| `Dialogue` | SceneNumber, Order, Speaker, Text, StartSeconds, EndSeconds | `SceneNumber`+`Order` |
| `Assets` | Name, Kind, SourceUrl, LicenseCode, Attribution | `Name` |
| `StyleKit` | Style name, prompt fragments, negative prompt, palette, seed policy | single row |
| `Enums` | Hidden lookup sheet driving the dropdowns | — |

Identity is by key column, not row position, so reordering rows in Excel is harmless.
`SchemaVersion` lives in `README!B1` and is checked on import.

---

## Actions

### A5.1 — Schema definition in code
One `WorkbookSchema` class describing sheets, columns, types, required-ness and enum
sources. The template writer, the reader and the validator all read from it, so a column
cannot drift between them.

### A5.2 — Dependency: ClosedXML
**Justification** (the org rule is "no dependencies without justification"):
writing `.xlsx` by hand means implementing OOXML, shared strings, styles and data
validation — hundreds of lines of format plumbing with no product value. ClosedXML is
MIT, widely used, pure-managed, no native/Excel dependency. Pinned exact version.
The CSV import/export path uses no dependency at all, so a `.csv`-only deployment can
drop the package.

### A5.3 — `GET /api/templates/workbook`
Query `recipeId` and optional `projectId`. Produces a template with: instructions sheet,
three example rows per sheet, dropdown data validation on every enum column, locked
header row, and a hidden `Enums` sheet. `Content-Disposition` filename is
server-composed — never client input.

### A5.4 — `GET /api/templates/ai-prompt-pack`
A markdown/text file of ready prompts: "Given this transcript, produce a Characters table
with these exact columns…", one per sheet, with the enum values inlined. This is the
bridge to any free AI tool without an API key.

### A5.5 — `WorkbookReader`
- Strict typed parsing: every cell is coerced to its declared type or produces a
  `CellError { sheet, row, column, code, message }`. Nothing is silently defaulted.
- Caps: 10 000 rows per sheet, 5 MB upload, 8 sheets, 200 chars per short text field.
- **Formula-injection defence.** On import, any cell whose text begins with `= + - @`,
  tab or CR is treated as literal text, never evaluated, and flagged. On export, such
  values are prefixed with `'` so a downstream Excel does not execute them. This is the
  CSV-injection class of bug and it is the export side that is dangerous.
- Rejects external links, macros (`.xlsm`) and defined names pointing outside the file.

### A5.6 — Dry-run import
`POST /api/projects/{id}/workbook/import` returns a diff, not a mutation:
```json
{ "previewToken": "…", "expiresAt": "…",
  "characters": { "create": 6, "update": 2, "skip": 1, "rows": [ … ] },
  "scenes":     { "create": 42, "update": 0, "skip": 0, "rows": [ … ] },
  "errors":     [ { "sheet": "Dialogue", "row": 87, "column": "SceneNumber",
                    "code": "unknown-scene", "message": "No scene numbered 99." } ] }
```
Rows that a user has hand-edited are shown as conflicts and default to **skip**, matching
the existing `UserEditedFields` / `LockedFields` behaviour in `Scene`.

### A5.7 — Apply
`POST /api/projects/{id}/workbook/import/apply` with the preview token. Re-validates,
then applies within one logical unit: characters first (scenes reference them), then
scenes, then dialogue. Records a `workbookImports` audit row with counts and the file
hash. A token is single-use and short-lived.

### A5.8 — Export
`GET /api/projects/{id}/workbook/export` writes the live project into the same schema,
so export → edit in Excel or with AI → import is a true round trip.

### A5.9 — Autopilot integration
- `POST /api/autopilot` accepts an optional workbook asset id that seeds characters and
  style before generation, so the AI fills only what the sheet left blank.
- The autopilot finish stage can emit a workbook for bulk review of what it produced.

### A5.10 — Angular
Import screen: drop file → preview table with per-sheet tabs and error rows highlighted →
Apply. Template and prompt-pack download buttons sit next to it.

### A5.11 — Tests
Round-trip fidelity (export → import ⇒ zero changes), unknown column, wrong type,
duplicate key, 10 001 rows, `=cmd|' /C calc'!A0` payload staying inert on both directions,
and a conflict row defaulting to skip.

---

## The bundle: one file with everything in it

A workbook alone still leaves the pictures somewhere else. `Assets!SourceUrl` means either
downloading from the internet — which needs `AllowMediaDownload`, a rights attestation and a
network — or uploading forty files by hand afterwards. Neither is "provide everything in one
go".

So the workbook is not the only input. A **project bundle** is a `.zip`:

```text
bundle.zip
  project.xlsx           (or project/*.csv — either is accepted)
  media/
    rahul-closed.png
    rahul-open.png
    arena.jpg
    scene-01.wav
  transcript.srt         (optional; equivalent to the Dialogue sheet)
```

A cell that names a file under `media/` binds to it directly, so
`Characters!ClosedMouthSprite = media/rahul-closed.png` needs no upload step and no URL.
Everything the render needs arrives in one file, and the whole path is offline.

### A5.12 — Bundle reader
- `.zip` only, `System.IO.Compression` — **no new dependency**, so the bundle path works
  even in a deployment that drops ClosedXML and ships CSVs.
- **Zip-slip defence.** Every entry name is resolved and required to sit under the extraction
  root; an entry with `..`, an absolute path or a rooted drive letter is refused, not
  sanitized. Symlink entries are refused outright.
- **Zip-bomb defence.** Caps on entry count, per-entry uncompressed size, *total* uncompressed
  size and compression ratio, all enforced while streaming rather than after extracting —
  the declared size in the central directory is not trusted.
- Media is sniffed by magic bytes and matched against the asset kind the sheet claims, reusing
  `AiImageValidator` / `AiAudioValidator`. A cell that says `png` and a file that is a zip is
  a refusal, not a repair.
- Each media entry becomes a real `Asset` through the existing store, with licence and
  attribution taken from the `Assets` sheet, so bundle-imported art carries the same
  provenance as anything else.

### A5.13 — Bundle export
The mirror: `GET /api/projects/{id}/bundle` writes the workbook plus every referenced asset
into one `.zip`. That makes the round trip **portable** — a project can leave one machine and
arrive on another with its art intact, which is also the honest backup story.

### A5.14 — The no-AI acceptance test
One end-to-end test that starts from a bundle, with **every AI provider disabled**, and
finishes at a rendered video. If this test needs a key, the phase has failed its own premise.
