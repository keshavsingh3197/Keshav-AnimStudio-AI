# Story prompts: write a story anywhere, import it here, animate it in Google Flow

No paid model is used by the app in this workflow. A free chat (Gemini, ChatGPT, Claude) writes the story as an
AnimStudio story file, the app imports it, and Google Flow makes the pictures and 8-second clips.

1. Copy **Prompt 1**, fill in the five lines under `MY STORY`, paste it into any chat.
2. Save the chat's reply as `my-story.json` (just the JSON — no text before or after it).
3. In the Story Agent, click **⬆ Import a story file** and choose it. The script is checked like any pasted reply;
   read the warnings it shows.
4. In the script editor, click **Copy all picture prompts** and **Copy all video prompts**, and use **Prompt 2** in
   Google Flow to keep the characters looking the same in every scene.
5. Save the results as `01.png`, `02.png` … and `01.mp4`, `02.mp4` … and add them all. Each scene uses its own number.

---

## Prompt 1 — write a funny story as an AnimStudio file

````text
You are a comedy writer for short animated videos. Write ONE story and return it as ONE JSON object in the exact
shape below, so it can be imported into an app. Return only the JSON in a single ```json code block: no other text.

MY STORY
- Idea: <what happens, who is in it — e.g. "Grandpa tries to use a smartphone to order one samosa and orders 500">
- Language: <hi for Hindi in Devanagari, or en for English>
- Length in seconds: <60 for a Short, 120–180 for a normal video>
- Shape: <Vertical for Shorts/Reels, Wide for YouTube>
- Look: <Cartoon for 2D hand-drawn, Cartoon3D for 3D animated movie style>

THE SHAPE (keep every key, keep these exact key names and fixed values)
{
  "kind": "animstudio-story",
  "version": 1,
  "exportedAtUtc": "2026-01-01T00:00:00Z",
  "story": {
    "title": "<the title, max 160 characters>",
    "notes": "<one line: the idea>",
    "language": "<hi or en>",
    "targetSeconds": <length in seconds>,
    "format": "<Vertical or Wide>",
    "writer": "Manual",
    "voicing": "Narrated",
    "genreId": "funny",
    "options": {
      "artStyle": "<Cartoon or Cartoon3D>",
      "narration": "Stock",
      "castVoices": true,
      "visuals": "UploadsOnly",
      "music": true,
      "musicSource": "Search",
      "renderWhenReady": false
    }
  },
  "script": {
    "title": "<title in the story's language>",
    "titleEnglish": "<title in English>",
    "summary": "<two sentences>",
    "musicQuery": "<2–4 words for background music, e.g. funny quirky comedy>",
    "thumbnailPrompt": "<a picture for the thumbnail: the funniest moment, big faces, no text>",
    "reviewNotes": [],
    "cast": [
      { "name": "<short name>", "gender": "<male or female>", "age": "<child, young, adult or elder>" }
    ],
    "scenes": [
      {
        "number": 1,
        "headline": "<3–6 words>",
        "narration": "<everything heard in this scene, in order>",
        "lines": [
          { "speaker": "Narrator", "text": "<narrator's words>", "emotion": "calm" },
          { "speaker": "<a cast name>", "text": "<what they say>", "emotion": "<one emotion from the list>" }
        ],
        "english": "<English translation of the narration; same as narration if language is en>",
        "basis": "reflection",
        "sources": [],
        "imagePrompt": "<the picture for this scene>",
        "videoPrompt": "<what moves in the 8-second clip>",
        "imageKeywords": ["<3–6 single words>"],
        "mood": "<one of: playful, joyful, excited, tense, happy>",
        "moreImagePrompts": []
      }
    ]
  }
}

RULES THE APP CHECKS (break one and that scene loses its character voices)
1. "narration" must be exactly the "text" of its "lines" joined in order — same words, nothing added or left out.
   Words the narrator says go in a line with "speaker": "Narrator".
2. Every "speaker" other than "Narrator" must be a "name" in "cast". At most 8 cast members. Never put "Narrator" in cast.
3. "emotion" is one of: happy, excited, laughing, sad, angry, scared, surprised, confused, shy, proud, sarcastic,
   whispering, shouting, worried, calm.
4. If language is hi: narration and lines in Devanagari only — no English letters, no digits. Write numbers as words
   ("पाँच सौ", not "500"). Put English only in "english", "imagePrompt", "videoPrompt", "imageKeywords".
5. Each scene is about 8 seconds of speech (15–22 words) so it fits one Google Flow clip. Number of scenes =
   length in seconds ÷ 8, rounded (a 60-second story has 7–8 scenes). Between 2 and 60 scenes.
6. Keep each "imagePrompt" and "videoPrompt" under 700 characters, in English.

THE COMEDY
- Clean family comedy anyone can watch with parents or kids. Everyday places: home, school, office, market, wedding.
- Scene 1 hooks in the first sentence: something already going wrong.
- One running gag that comes back three times and pays off in the last scene, which ends on a clear punchline.
- The viewer sees the disaster coming a moment before the character does. Let the characters talk; short snappy lines.
- Funny from the situation and reactions, never from insulting anyone. Props are cartoon props (a water gun, a rolling
  pin, a giant ladle) — nothing real or frightening.

THE PICTURES (so every scene looks like the same film)
- Before writing scenes, decide each character's look in one fixed phrase: age, body, face, hair, clothes with colours,
  one signature item. Example: "Dadaji, a skinny elderly Indian man with a white walrus moustache, round glasses,
  cream kurta, brown shawl, holding a walking stick".
- Every "imagePrompt" starts with the look: for Cartoon "2D hand-drawn cartoon, bold clean outlines, flat bright
  colours"; for Cartoon3D "3D animated feature film style, soft rounded characters, big expressive eyes, warm cinematic
  lighting". Then the place (same words every time the place returns), then each character in the scene using their
  fixed phrase word for word, then what they are doing, then the framing (wide shot / medium shot / close-up).
  End with "no text, no watermark".
- Show the moment just before the action, so the clip can play it out.
- Shape Vertical: characters centred, framed for a tall 9:16 picture. Shape Wide: a 16:9 picture.

THE MOTION ("videoPrompt")
- One continuous 8-second shot that starts from that picture. Say who does what, step by step, with props:
  "Dadaji reaches for the phone, taps it three times, the screen flashes, he jumps back startled; Pinky slaps her
  forehead". Include one camera move (slow push in, gentle pan, quick zoom on a reaction).
- Characters talking to each other face each other; the listener reacts (eye roll, double take, jaw drop).
- No text or captions in the clip.
````

### Changing the defaults

| Want | Change in `story.options` |
|---|---|
| The app's image engine draws scenes you didn't make in Flow (may use credits) | `"visuals": "Auto"` |
| Music composed by Lyria (uses credits) | `"musicSource": "Generate"` |
| No voice at all, subtitles only | `"narration": "None"` |
| Build the video as soon as the voices are ready | `"renderWhenReady": true` |
| Only characters speak, no narrator | `story.voicing`: `"CharactersOnly"`, and no `"Narrator"` lines |
| Another genre | `story.genreId`: `kids-moral`, `bedtime`, `motivational`, `explainer`, `folk` (and drop the comedy section) |

---

## Prompt 2 — Google Flow: the same characters in every clip

Flow keeps a character consistent when it has a reference image of them. Make the references once, then make each
scene's picture from them, then each clip from its picture.

**Step A — one reference per character** (Flow → image). Use the character's fixed phrase from the script:

```text
Character reference sheet of <fixed phrase>. Full body, front view and three-quarter view side by side, neutral
standing pose, friendly expression, plain light grey background. <2D hand-drawn cartoon, bold clean outlines, flat
bright colours | 3D animated feature film style, soft rounded characters, big expressive eyes, soft studio lighting>.
No text, no watermark.
```

**Step B — one picture per scene.** Add the character references as ingredients, then paste that scene's prompt from
**Copy all picture prompts**. Save as `01.png`, `02.png` …. If a place returns, also add its first picture as a
reference so the room stays the same.

**Step C — one clip per scene** (Flow → Frames to video, start frame = the scene's picture). Paste that scene's prompt
from **Copy all video prompts**. The app writes it for you: who speaks and their words (so lips move), the emotion
on their face, how the others react, the camera move, and "keep every character the same". Save as `01.mp4` ….
The clip's own sound is dropped; the app plays the approved voices and music over it.

If you write a Flow prompt by hand, keep this order:

```text
Bring this picture to life as one continuous shot. <who does what, step by step, with the props>.
<Name> (the <elderly man>) speaks <excitedly>, saying: "<their words>". The others react with big, funny cartoon
reactions: <a double take, an eye roll>. <The camera glides gently sideways with the action.> The mood is playful.
<Classic 2D cartoon animation: lively, bouncy, expressive acting with a little squash and stretch, keeping the bold
outlines and flat colours. | 3D animated feature acting: appealing, smooth and expressive, with big readable
expressions and soft cinematic light.> Start exactly from the given picture and keep every character's face, body,
clothes and colours and the setting the same throughout. No text, captions, subtitles, logos or watermarks.
```
