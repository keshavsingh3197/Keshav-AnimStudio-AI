# Episode renderer (script → finished 3D comedy)

Turns one JSON script into a finished MP4 with the WebGL 3D engine: per-character voices, lip-sync,
directed camera, sound effects, and burned-in Hindi subtitles.

```powershell
# Build the engine bundle after changing anything in tools/webgl-3d-builder/src
cd tools/webgl-3d-builder; npm run build; cd ../..

# Full render (1080p, 24 fps by default; override with --width/--height/--fps)
node tools/webgl-3d-builder/episode/render-episode.mjs --episode tools/webgl-3d-builder/episode/episodes/exam-hall-jugaad.json --out renders/exam_hall_jugaad_1080p.mp4

# Fast check: one still per line, tiled into renders/preview/exam_sheet.jpg (Git Bash)
bash tools/webgl-3d-builder/episode/preview-sheet.sh tools/webgl-3d-builder/episode/episodes/exam-hall-jugaad.json renders/preview/exam.mp4
```

Needs Node, FFmpeg on PATH, and Edge or Chrome. If Edge is mid-update and exits immediately,
set `ANIMSTUDIO_BROWSER` to Chrome's path:

```powershell
$env:ANIMSTUDIO_BROWSER = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

## Script format

```jsonc
{
  "title": "परीक्षा में पप्पू का जुगाड़",   // shown as a title card over the opening wide shot
  "setting": "Classroom",                  // any SceneSetting; Classroom/SceneBlueprint rooms use the director camera
  "cast": [
    {
      "name": "SharmaSir", "displayName": "शर्मा सर", "subtitleColor": "#fbbf24",
      "spot": "teacher_podium",                       // starting mark ("hidden" = off stage)
      "robeHex": "#1d4ed8", "shirtPattern": "checked", // solid | colorful | striped | checked
      "hairStyle": "bald", "hairHex": "#8b8f98",       // spiky | short | parted | bald | curly | ponytail
      "hasGlasses": true, "mustache": "brush",         // none | brush | handlebar
      "skinHex": "#e2a679", "scale": 1.06,
      "voice": { "pitch": 0.8, "tempo": 1.08, "warmth": true }  // pitch < 1 deeper, > 1 younger
    }
  ],
  "lines": [
    {
      "speaker": "SharmaSir", "to": "Chintu",
      "text": "चिंटू! पेपर के ऊपर सो रहे हो?",
      "emotion": "angry",            // calm happy laughing surprised angry sad proud confused smug scared
      "action": "pointing",          // see ActionKind in src/types.ts (e.g. slapForehead, laughing, deskSleep)
      "shot": "crashPunch",          // wideEstablishing twoShot closeUpSpeaker reactionZoom crashPunch overShoulder lowDramatic
      "spots": { "SharmaSir": "aisle_r0_faceRight" },  // move characters (they land on the cut)
      "acts": { "Chintu": "deskSleep" },               // persistent action while not speaking (null clears)
      "sfx": "desk_thud",            // a file from backend/AnimStudio.Api/wwwroot/sfx/memes (without .wav)
      "pauseAfter": 0.6
    }
  ]
}
```

Classroom marks: `teacher_podium`, `front_center`, `teacher_aisle`, `door_inside`, `student_1` … `student_12`,
and per desk row `aisle_r{0..2}_faceLeft`, `aisle_r{0..2}_faceRight`, `aisle_r{0..2}_faceFront`.

## How the camera works in rooms

`src/director-camera.ts` keeps the camera on a tripod. Each line is a hard cut to a shot that is planned once:
it measures the speaker's real head, then searches angles until the face is unobstructed, no other head sits
against the lens or in the foreground, and the camera sees the face rather than the back of the head.
If no close angle qualifies it falls back to a looser single, then to a high-corner master. There is no handheld
drift or shake. Only `crashPunch` adds a quick push-in.

Voices use the same keyless Google Translate TTS as the backend, so the line text is sent to Google.
