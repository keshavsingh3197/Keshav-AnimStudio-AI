# P14 — Live streaming

Lets the studio send to YouTube Live directly: a render, a Clip Studio export, project media, songs with their
covers, a release kit, or links on supported sites, alone or as a playlist, including 24/7 loops, without OBS.
The server is the encoder and pushes RTMPS the way OBS would.

---

## Design: prepare, preview, send

A stream runs in two stages:

1. **Prepare.** Each playlist item is fetched (links via yt-dlp) and converted into a segment with *identical*
   encoding. The settings follow YouTube's ingest recommendations: x264 high profile at the stream bitrate
   (3 Mbps 720p30, 6 Mbps 1080p30), a keyframe every 2 s with scene-cut keyframes off, AAC 128k at 44.1 kHz
   stereo, one MP4 timescale. Videos are letterboxed, and a silent video gets a silent track. A song becomes its
   cover over a blurred copy of itself (or a plain backdrop) with a live waveform.
2. **Send.** The segments are joined with the concat demuxer (safe mode, generated names only) and *copied* to the
   ingest at playback speed (`-re -c copy`).

Why this way:
- **Previewable.** The prepared segments *are* the broadcast, so the owner can watch each item, or the whole
  program in order, before anything goes out.
- **Cheap to send.** A loop costs a file read, not a real-time encode, so 24/7 streams barely use CPU.
  `MaxConcurrentStreams` is bounded by upload bandwidth; `MaxConcurrentPreparations` bounds the x264 work.
- **Resumable.** If the connection drops after going live, the push restarts from the item that was playing
  (`PlaylistContent` + `Position`) with backoff, up to `ReconnectAttempts`. An ended or stopped stream can be sent
  again without preparing it again.
- **Forgiving.** Items that fail to prepare (a dead link, a broken file) are skipped, so the rest of the playlist
  still goes out.

Lifecycle: `Preparing → Ready → Connecting → Live (⇄ Reconnecting) → Ended / Stopped / Failed`. A stream that has
ended can go to `Connecting` again.

## Stream keys

YouTube stream keys are **reusable**: a key keeps working until someone presses *Reset* in YouTube Studio. Keys
can therefore be saved once per brand channel and destination:

- **Saving.** Admins save keys on *Settings → Channels → 🔑 Stream key*. They are encrypted with the same
  AES-256-GCM `DataProtector` as AI provider keys (`Encryption:DataKey`). The UI only ever shows `••••last4` and a
  fingerprint, and every change is audited. Deleting a channel deletes its keys.
- **Refused keys.** If the ingest refuses a saved key before any media is accepted, the key is marked **Rejected**:
  - Go Live answers `409 stream-key-rejected` up front.
  - The Channels page shows a banner and a *Key refused* filter.
  - Go Live links straight to the channel's key panel.

  A network failure never marks a key rejected. Missing keys give `409 stream-key-missing`, so the user is asked
  to configure one instead of watching a stream fail.
- **Who can use saved keys.** Only admins, unless `LiveStream:AllowSavedKeysForNonAdmins` is set. Everyone else
  pastes a key for the stream; a pasted key is held in memory only until it is sent, and is never stored or logged.

## API — `/api/live-streams`

| Endpoint | |
| --- | --- |
| `GET setup` | Destinations, channels with masked key states, and what the caller may do. |
| `POST` (multipart) | `settings` JSON, `items` JSON (see below), files as `file0…`/`cover0…`, optional `goLive` JSON to send as soon as it's ready. |
| `GET` / `GET {id}` | The caller's streams with per-item state and progress. |
| `GET {id}/items/{n}/preview` | A prepared segment (range requests supported). |
| `POST {id}/go-live` | `{ channelId }` or `{ streamKey }`. Also sends an ended stream again. |
| `POST {id}/stop` | Stops sending or preparing; segments are kept. |
| `DELETE {id}` | Stops the stream and deletes it with its segments. |
| `PUT/DELETE keys/{channelId}/{destinationId}` | Admin: save or remove a channel's key. |

Item sources:
- `Upload`: an MP4, or a song with an optional cover.
- `Render`: a project render or Clip Studio export.
- `Asset`: a video or audio asset, with an optional image asset as cover.
- `Url`: a link on a supported site, with `audioOnly` to show it radio-style.
- `ReleaseKit`: the master with its cover, or the visualizer.

## Guards

- **Stream key.** Allowlisted shape (`[A-Za-z0-9_-]`, 8–128), so it can't re-point the ingest URL. Masked in
  ffmpeg stderr before logging, and never in a URL or browser storage.
- **Destinations.** Taken from config by id. Only `rtmps://` without userinfo is accepted, so there is no SSRF via
  the ingest URL.
- **Links.** Rebuilt by `MediaSourceValidator` (https only, host allowlist) before reaching yt-dlp. Gated by
  `Ingest:AllowMediaDownload` and capped at `MaxFetchBytes`. yt-dlp verifies TLS certificates
  (`--no-check-certificates` was removed from the downloader).
- **Ownership.** Streams, renders, assets (via their project) and release kits are owner-scoped; anyone else's
  read as not found and are logged. Upload part names are a fixed pattern, and every file on disk gets a generated
  name.
- **Uploads.** Checked by magic bytes before anything is written. MP4 up to 2 GB; songs and covers go through the
  release-kit validators.
- **Capacity.** At most `MaxStreamsPerUser` streams are held, `MaxConcurrentStreams` sending and
  `MaxConcurrentPreparations` converting. Each send ends at `MaxHours`, even "until stopped".
- **Cleanup.** Segments are kept for `KeepIdleMinutes` after a stream stops working. Leftover folders are cleared
  at startup; nothing about a stream survives a restart.
- **Rights.** The caller must confirm they hold the rights to everything in the playlist.

## Actions

### A14.1 — Go Live ✅
Single-source streaming over RTMPS.

### A14.3 — Playlists, previews, saved keys, reconnect ✅
Everything above, plus **🔴 Go live** entry points:
- the render page
- Clip Studio's export banner
- Media Studio downloads imported as assets
- the release kit (song + cover, or visualizer)

### A14.2 — Broadcast control through the YouTube Live API
Create the broadcast, bind a stream, and move it live and complete through `liveBroadcasts` / `liveStreams`, so
the user never copies a key and the title and description are set from the app. Needs Google OAuth with the
`youtube` scope and per-user refresh tokens in Key Vault, the same groundwork as A13.2.

### A14.4 — Hardware encoding for preparation
QSV works on the render host; nvenc and amf are listed but broken, so probe by test-encoding. Preparing is the
only encode now, so QSV would shorten the wait before a long playlist is ready.

### A14.5 — Scheduled streams
Start a prepared stream at a set time, and keep a 24/7 stream's playlist refreshing from a folder or channel.

### A14.6 — Camera Studio ✅
Go live from the browser's camera or a shared screen, at `/live/camera`, without showing who you are.

**Design: the browser draws, the server encodes.** The page composites the program on a canvas (camera, masks,
overlays, scene cards), records it with `MediaRecorder` (WebM, or fragmented MP4 on Safari), and sends one-second
chunks to `POST api/live-streams/camera/{id}/chunks?generation=&sequence=`. The server pipes them into ffmpeg's stdin
(`IFfmpegPipe`), which encodes x264 `veryfast`/`zerolatency` at the stream bitrate with a 2 s keyframe interval and
sends RTMPS. Unlike a playlist this is a real-time encode, so `LiveStream:Camera:MaxConcurrent` is bounded by CPU.

**Privacy by construction.** Face tracking and person segmentation run on-device (MediaPipe Tasks, Apache-2.0,
served by this app: `npm run vision:models` fetches the models pinned by URL and SHA-256). The unmasked camera picture
is never recorded or sent. With face hiding on, the page **fails closed**: the camera is covered until the model runs
and while detections are stale. Strict mode also covers it when a face is lost (beyond a per-face hold) or a person is
seen without a face. Every mask starts with an opaque disc, centred above the face to cover the hairline. Go live is
blocked until face tracking is running.

**Characters, motion and gestures.** Body (`pose_landmarker_lite`) and hand (`gesture_recognizer`) models load
only when the body puppet, gestures or a copying mascot is on, and are pinned like the face models. Landmarks are
smoothed with a One Euro filter (`motion.ts`). `puppet.ts` turns a pose and its hands into a cartoon body, filling in
joints the model can't see; in *replace* mode no camera pixel is drawn, only a stage and the characters.
`gestures.ts` is a pure state machine: a sign must be held (`holdMs`), fires once per hold, then waits out a cooldown;
waves, nods and head shakes come from swings over the last 1.2 s. Gesture actions can only add decoration or make the
stream safer (privacy card and mute turn on, never off). Taught signs (`sign-learner.ts`) are k-NN over hand shapes
normalised for position, scale, rotation and handedness; only the 42 numbers per example are stored, in the browser.
`character-designer.ts` draws designed characters; `qr-code.ts` is an in-house QR encoder (byte mode, versions
1-40), so no package is added; `brand-overlays.ts` draws the QR card and the seal.

**Transport.** HTTP chunks rather than a WebSocket, so the normal bearer-token auth applies unchanged (a browser
WebSocket can't send the header). Chunks are written strictly in order. A repeated chunk is acknowledged without being
written twice, so the page can retry. The first chunk of each recording must start with the declared container's magic
bytes. If the ingest connection drops after going live, the encoder restarts under a new *generation* and the page
starts a fresh recording, because a recording's header is only in its first chunk. A page that stops sending for
`IdleTimeoutSeconds` ends the stream.

**Audience numbers.** `GET api/live-streams/audience?channel=&video=` reads public subscriber and live-viewer counts
from the YouTube Data API. The key (`YouTube:ApiKey`, a secret) goes in the `X-Goog-Api-Key` header, never in a URL;
the host is fixed; ids are checked against YouTube's shapes; answers are cached (`YouTube:CacheSeconds`).

| Endpoint | |
| --- | --- |
| `POST camera` | `{ settings, goLive }`: starts the encoder. One active camera stream per user. |
| `GET camera` / `GET camera/{id}` | Status: state, generation, next chunk, bytes, speed, reconnects. |
| `POST camera/{id}/chunks` | Raw bytes. `409 restart-recording` / `chunk-out-of-order` / `camera-ended` carry the status. |
| `POST camera/{id}/stop` | Closes stdin so what was sent goes out, then ends. |
| `GET audience` | Subscribers (UC… id or @handle) and live viewers (video id). |

### A14.7 — Collab Studio ✅
Record yourself with an existing video at `/collab`: **Duet** (side by side), **Stacked**, **React** (a draggable
bubble), **Green screen** (you cut out by the on-device person segmenter, `VisionEngine.segment`, with no face
tracking) and **Stitch** (a chosen part of the original, then your turn).

**Design: record the mix and the raw take.** As in Camera Studio the browser draws the frame (`collab-layout.ts`)
and records it, so a take is ready the moment it ends. A second `MediaRecorder` keeps the raw camera and microphone.
Changing the layout, crop, mirror, volumes or sync afterwards *rebuilds* the take: the original and the raw take
play together, the frame is drawn again and recorded. That runs in real time, and nothing is filmed again.

**Sync.** The raw take starts first. `lead` is the time from its start to the original starting to play, and
`latency` is the audio output latency at record time (`baseLatency + outputLatency`): you react to what you hear,
which is that late. A rebuild plays the raw take from 0 and starts the original when the take reaches
`lead + latency + syncMs`, where `syncMs` is a hand nudge of ±500 ms. Browser recordings often can't seek, so drift
is corrected by nudging the take's `playbackRate` (0.9-1.1) instead of seeking it.

**Sound.** `CollabMixer` mixes the original and your voice for the recorder. Only the original reaches the
speakers, so there is no feedback. The original dips while you speak (an RMS gate with a hold time), and the browser's
echo cancellation is requested on the microphone. Headphones are still advised.

**Saving.** MP4 is preferred because project uploads accept only MP4 (`UploadValidator`). Takes save through the
normal asset upload, so they're checked like any upload and show up in the video editor. A browser that can only
record WebM can still download. Takes stay in memory as object URLs (at most six) and are released when deleted or
when the page closes.
