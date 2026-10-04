# P13 — Music release

Gets a finished song from the studio to listeners without the app pretending to be a
distributor.

Stores such as Spotify, Apple Music, Amazon, YouTube Music and JioSaavn only ingest from
distributors and labels they have contracts with, usually as DDEX deliveries. Becoming one
takes store agreements, paid UPC allocation, royalty accounting and payouts, and
takedown/Content ID liability, so none of it is a code problem. The app therefore does the
two things it can do freely: prepare a release so the distributor upload is quick and
isn't rejected, and publish directly where an open upload API exists.

---

## Actions

### A13.1 — Release kit ✅
`POST /api/releases/kits` (multipart: `audio`, `cover`, `metadata` JSON, `options` JSON),
UI at `/release`. Produces:

- **Master** — WAV, 16-bit (triangular dither) or 24-bit, 44.1/48/96 kHz stereo. Two-pass
  `loudnorm` in linear mode to the target (default -14 LUFS, -1 dBTP), then re-measured so
  the reported loudness belongs to the file actually delivered. Source tags are stripped.
- **Cover** — exactly 3000×3000 JPEG, centre-cropped; upscale and crop are reported.
- **Visualizer** — 1920×1080 MP4 of the full song: blurred cover behind the sharp one,
  plus a waveform. The still part is drawn once, so per-frame cost is the waveform only.
- **Promo loop** — 8 s, 1080×1920, silent push-in on the cover (Spotify Canvas rejects
  audio; Reels and Shorts add the song in-app).
- `metadata.json`, `release_sheet.txt` (fields in the order distributor forms ask for
  them), `lyrics.txt`, and a ZIP of everything.

Guards: the uploader must confirm they hold the rights; uploads are sniffed by magic bytes
(WAV/FLAC/AIFF/MP3/M4A, PNG/JPG/WEBP); ISRC shape and UPC/EAN check digit are validated;
kits are owner-scoped and the download allowlist is the kit's own file list; at most two
builds run at once; kits expire after 24 hours; the uploads are deleted after the build.

### A13.2 — YouTube upload
Upload the visualizer through the YouTube Data API (`videos.insert`, resumable), with
title, description (built from the release sheet), tags and category Music. Needs a Google
OAuth client and per-user refresh tokens: store those in Key Vault, never in Mongo/SQL
plaintext, and request only the `youtube.upload` scope. Mind the API's default daily
quota; an upload is expensive in quota units.

### A13.3 — Audius upload
Audius is an open platform with a public SDK that artists upload to directly. Investigate
whether the upload flow can run server-side without holding the user's wallet key; if it
can't, do the upload from the browser and keep the server out of the signing path.

### A13.4 — Release kit from the timeline
Build a kit straight from a rendered project's audio mix instead of an upload, and make the
lyric video from the project's existing caption pipeline (ASS burn-in) using synced `.lrc`
lyrics.

### A13.5 — DDEX ERN export (exploratory)
Emit the kit's metadata as a DDEX ERN message so a distributor or label that accepts DDEX
can ingest it without retyping. Only worth doing if a partner asks for it.
