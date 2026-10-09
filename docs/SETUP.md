# AnimStudio AI — Machine Setup

Everything you need installed to build and run this repository, with copy-paste commands
per operating system.

Read it in order: [1 · required](#1-required-on-every-machine) → [2 · install](#2-install-commands-by-os) →
[3 · verify](#3-verify-the-install) → [4 · configure](#4-first-run-configuration) → [5 · run](#5-run-it).
Section 6 is optional local AI tooling — nothing there is needed to render a video.

---

## 1. Required on every machine

| Tool | Minimum | Why this project needs it |
| --- | --- | --- |
| **.NET SDK** | **10.0** | All six projects target `net10.0` (`AnimStudio.Api/Application/Domain/Infrastructure` + 2 test projects). The .NET 8/9 SDK **cannot** build this. |
| **MongoDB** | 6.0+ (7.x recommended) | Every projects/characters/scenes/assets document, the AI usage counters, and the render **job queue** (Mongo lease/claim worker). Database name `AnimStudioDb`. Atlas works instead of a local server. |
| **FFmpeg + ffprobe** | **6.0+** | The renderer. `Ffmpeg:MinimumVersion` is `6.0` and startup probes the build — see the [feature matrix](#ffmpeg-build-requirements) below. |
| **Node.js + npm** | **22 LTS** (24 also fine) | Angular 22.1 / TypeScript 6 frontend. Node 18/20 will not build it. |
| **Git** | any recent | Clone, and `core.hooksPath` for the secret-scanning pre-commit hook. |
| **DejaVu Sans font** | — | `Render:SubtitleFontName` default. Present on most Linux; **not** on Windows — see the [Windows font note](#windows-subtitle-font). |

### FFmpeg build requirements

A bare `ffmpeg` binary is not enough — the startup probe (`FfmpegCapabilityProbe`) reads
`-version`, `-buildconf`, `-filters` and `-encoders`, and each missing piece disables a
feature rather than the whole app:

| Needed | Feature lost if missing |
| --- | --- |
| version ≥ 6.0 | **Rendering refuses to start at all** |
| `--enable-libass` + `subtitles` filter | Burned-in subtitles (both are checked; libass fails silently otherwise) |
| `libx264` encoder | Video output |
| `aac` encoder | Audio output |
| `zoompan` filter | Ken Burns motion |
| `xfade` / `acrossfade` | Video / audio transitions (scene merges **and** clip joins) |
| `drawtext` filter | On-screen text, and the **text watermark** on a clip stitch |
| `gblur` filter | Blurred backdrop behind a letterboxed clip (falls back to black bars) |
| `alimiter` filter | Audio limiting |

**Version 7.0 or newer is strongly recommended.** The filtergraph is always handed over in
a file rather than on the command line (a forty-scene merge approaches the platform
argument limit), and the option that does this was renamed: `-filter_complex_script` on
6.x, `-/filter_complex` from 7.0, with the old spelling **removed in 8.0**. The startup
probe reads the version and picks the right one, so both work — but 6.x is the only branch
where a single spelling exists, and it is the one being retired.

Install a **full** build (Gyan "full" on Windows, RPM Fusion on Fedora, the John Van Sickle
static build on older Linux). A minimal or "essentials-lite" build usually lacks libass.

### Private package access (one of these two)

The backend depends on `KeshavSingh.Core`, `KeshavSingh.Mongo.NoSql`, `KeshavSingh.Storage`
and `KeshavSingh.Security`. The `.csproj` files probe for sibling checkouts **first**:

**Option A — sibling clones (what this machine uses).** Clone next to this repo so the
parent folder looks like this, and restore needs no token at all:

```text
<parent>/
├─ Keshav-AnimStudio-AI/      ← this repo
├─ KeshavSingh-Packages-Core/
├─ KeshavSingh-Packages-Nosql/
├─ KeshavSingh-Packages-Files/
└─ shared-security/
```

**Option B — GitHub Packages.** No siblings? Export a PAT with `read:packages` (never commit it):

```bash
export PACKAGES_READ_TOKEN=ghp_xxx            # Linux / macOS
```
```powershell
setx PACKAGES_READ_TOKEN ghp_xxx              # Windows, then reopen the terminal
```

With siblings present, the sibling **source** wins even when the token is set. To force a
real registry restore: `dotnet restore -p:UseLocalProjectReferences=false`.

---

## 2. Install commands by OS

### Windows 10 / 11 — winget (recommended)

```powershell
winget install --id Microsoft.DotNet.SDK.10 -e   # no match? run: winget search dotnet-sdk
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
winget install --id Gyan.FFmpeg -e             # "full" build: libass + libx264 included
winget install --id MongoDB.Server -e          # installs and starts the MongoDB service
winget install --id MongoDB.Shell -e           # mongosh, optional but handy
winget install --id yt-dlp.yt-dlp -e           # optional: URL/caption ingest
```

Close and reopen the terminal afterwards so `PATH` updates.

### Windows — Chocolatey (alternative)

```powershell
choco install dotnet-sdk --version=10.0.400 -y
choco install nodejs-lts git ffmpeg-full mongodb yt-dlp -y
```

> Use `ffmpeg-full`, **not** `ffmpeg` — the plain package is built without libass.

#### Windows subtitle font

Windows has no DejaVu Sans. Either install it
(<https://dejavu-fonts.github.io/> → unzip → select the `.ttf` files → right-click → *Install*),
or point the renderer at a font you already have:

```powershell
dotnet user-secrets set "Render:SubtitleFontName" "Segoe UI"   # run in backend\AnimStudio.Api
```

#### Watermark font — usually nothing to do

The **text watermark** on the Clips screen is drawn by ffmpeg's `drawtext`, and it is always
given a font FILE rather than a family name. The server finds one for itself at startup and
says which:

```text
info: Watermark font: C:\Windows\Fonts\segoeuib.ttf (auto-detected).
```

Override it only to choose a different face — an absolute path, forward slashes:

```jsonc
// backend/AnimStudio.Api/appsettings.Development.json → "Render"
"WatermarkFontFile": "C:/Windows/Fonts/segoeuib.ttf",
"WatermarkText": "yoursite.example"
```

`WatermarkText` is only a default for the input box, so the site address is typed once here
rather than once per video. On Linux, `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`
is the usual choice; if the log says no font file was found, install one and restart — the
watermark is skipped in the meantime and the video finishes *with warnings*. A **logo
image** watermark needs none of this — overlaying a PNG uses no font at all.

> **Why never a family name.** `drawtext`'s `font=` resolves through fontconfig, and a
> stock Windows ffmpeg is built *with* fontconfig but ships no `fonts.conf`. The lookup
> fails, drawtext dereferences the result, and the process dies with an access violation —
> `Fontconfig error: Cannot load default config file` followed by exit `-1073741819`,
> reported as *"Clip 1 could not be prepared."* `fontfile=` bypasses fontconfig entirely.
> The subtitle font name is unaffected: libass has its own font provider.

#### Windows FFmpeg path

A Windows **service** does not inherit your shell `PATH`, so prefer absolute paths:

```powershell
dotnet user-secrets set "Ffmpeg:FfmpegPath"  "C:\ffmpeg\bin\ffmpeg.exe"
dotnet user-secrets set "Ffmpeg:FfprobePath" "C:\ffmpeg\bin\ffprobe.exe"
```

---

### Ubuntu / Debian (and WSL2)

```bash
sudo apt update
sudo apt install -y git curl ca-certificates gnupg fonts-dejavu-core python3 python3-pip
```

**.NET 10 SDK** — Ubuntu 24.04+ / Debian 13 ship it in the feed:

```bash
sudo apt install -y dotnet-sdk-10.0
```

Older releases (22.04, Debian 12) — use the official installer script, no root needed:

```bash
curl -fsSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
bash dotnet-install.sh --channel 10.0
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Node.js 22** — apt's `nodejs` is far too old; use nvm:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22 && nvm alias default 22
```

**FFmpeg** — check the packaged version first:

```bash
apt-cache policy ffmpeg          # need 6.0 or newer
sudo apt install -y ffmpeg       # fine on Ubuntu 24.04 (6.1) and newer
```

If apt offers 4.x or 5.x (Ubuntu 22.04, Debian 12), install a static build instead — it is
compiled with libass, libx264, libfreetype and fontconfig:

```bash
mkdir -p ~/.local/bin && cd /tmp
curl -fsSLO https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar xf ffmpeg-release-amd64-static.tar.xz
cp ffmpeg-*-static/ffmpeg ffmpeg-*-static/ffprobe ~/.local/bin/
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**MongoDB 7** — not in the Ubuntu/Debian repos; add MongoDB's own:

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
  | sudo gpg -o /usr/share/keyrings/mongodb-7.gpg --dearmor
echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-7.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

> **WSL2:** `systemctl` needs `systemd=true` under `[boot]` in `/etc/wsl.conf` (then
> `wsl --shutdown` from PowerShell). Without it, start it by hand:
> `sudo mkdir -p /data/db && sudo mongod --dbpath /data/db --fork --logpath /var/log/mongod.log`
> — or simply point `Mongo:ConnectionString` at a MongoDB running on Windows, or at Atlas.

---

### Fedora / RHEL

```bash
sudo dnf install -y dotnet-sdk-10.0 nodejs npm git dejavu-sans-fonts python3-pip

# FFmpeg with libass lives in RPM Fusion, not the base repos
sudo dnf install -y \
  https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm
sudo dnf install -y ffmpeg --allowerasing

# MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo >/dev/null <<'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
sudo dnf install -y mongodb-org && sudo systemctl enable --now mongod
```

Fedora's `nodejs` may lag; if `node -v` is below 22, use the nvm block from the Ubuntu section.

---

### Arch Linux

```bash
sudo pacman -S --needed dotnet-sdk nodejs npm git ffmpeg ttf-dejavu python-pip
paru -S mongodb-bin        # MongoDB is in the AUR
sudo systemctl enable --now mongodb
```

Verify `dotnet --list-sdks` shows a 10.x entry; if Arch has moved on, install `dotnet-sdk-10.0`.

---

### macOS (Homebrew)

```bash
brew install --cask dotnet-sdk          # confirm 10.x with: dotnet --list-sdks
brew install node@22 git ffmpeg yt-dlp
brew install --cask font-dejavu
brew tap mongodb/brew && brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

Homebrew's `ffmpeg` is built with libass and libx264 — no extra step.

---

### MongoDB via Docker (any OS — skips the installer entirely)

```bash
docker run -d --name animstudio-mongo -p 27017:27017 \
  -v animstudio-mongo:/data/db mongo:7
```

Connection string stays `mongodb://localhost:27017`.

---

## 3. Verify the install

```bash
dotnet --list-sdks          # a 10.x line must be present
node -v                     # v22.x or newer
npm -v
git --version
ffmpeg -version | head -1    # 6.0 or newer
ffprobe -version | head -1
mongosh --eval 'db.runCommand({ping:1})'    # or: nc -z localhost 27017
```

Confirm the FFmpeg build has what the renderer needs — every line below should print:

```bash
ffmpeg -hide_banner -buildconf | grep -oE '\-\-enable-(libass|libx264|libfreetype|fontconfig)'
ffmpeg -hide_banner -filters  | awk '{print $2}' | grep -xE 'subtitles|drawtext|zoompan|xfade|acrossfade|alimiter|gblur'
ffmpeg -hide_banner -encoders | awk '{print $2}' | grep -xE 'libx264|aac'
fc-list | grep -ci dejavu    # 0 on Windows → see the font note above
```

PowerShell equivalent for the first check:

```powershell
ffmpeg -hide_banner -buildconf | Select-String 'libass|libx264|libfreetype|fontconfig'
```

---

## 4. First-run configuration

Secrets never go in `appsettings.json` — see [`SECURITY.md`](../SECURITY.md).

```bash
# 1. Secret-scanning pre-commit hook (opt-in, from the repo root)
git config core.hooksPath .githooks

# 2. Mongo connection string — the API refuses to start without it
cd backend/AnimStudio.Api
dotnet user-secrets set "Mongo:ConnectionString" "mongodb://localhost:27017"
```

Optional, only if you plan to save AI provider keys through the admin console — a
Base64-encoded 32-byte (AES-256) key:

```bash
# Linux / macOS
dotnet user-secrets set "Encryption:DataKey" "$(openssl rand -base64 32)"
```
```powershell
# Windows
$k=[Convert]::ToBase64String((1..32|%{Get-Random -Max 256})); dotnet user-secrets set "Encryption:DataKey" $k
```

Without it everything still runs — the console just says key storage is unconfigured.

---

## 5. Run it

**Backend** (from the repo root, needs MongoDB up):

```bash
dotnet restore
dotnet build AnimStudio.slnx
cd backend/AnimStudio.Api && dotnet run      # http://localhost:5172
```

**Frontend** (second terminal):

```bash
cd frontend
npm ci
npm start                                     # http://localhost:4200
```

The SPA calls `http://localhost:5172` (`frontend/src/environments/`), and that origin is
already in the backend's `AllowedOrigins`.

**Tests:**

```bash
dotnet test AnimStudio.slnx
```

The integration tests are FFmpeg-gated: they skip themselves rather than fail when no
usable renderer is found.

---

## 6. Optional — local AI tooling

**None of this is required.** Every provider ships `Enabled: false`, and the pipeline
renders a complete video with no AI at all. Install only the piece you want, then enable it
in `appsettings.json` (`Ai:Providers:<id>:Enabled`) and put its key in the admin console.

| Want | Install | Config |
| --- | --- | --- |
| YouTube/URL caption ingest | `pip install -U yt-dlp` (or winget/brew) | `Ingest:YtDlp:Enabled: true`; downloading media needs the separate `Ingest:AllowMediaDownload` gate |
| Local text generation | [Ollama](https://ollama.com) → `ollama pull llama3.2` | `ollama` provider, `http://localhost:11434/v1` |
| Local text (GUI) | [LM Studio](https://lmstudio.ai) → start its server | `lmstudio` provider, `http://localhost:1234/v1` |
| Local image generation | [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (Python 3.10+, GPU strongly recommended) | `comfyui-local`, `http://localhost:8188`, plus a checkpoint file named in `Model` |
| Local text-to-speech | [Piper](https://github.com/rhasspy/piper) + `.onnx` voices | `piper-local`: `ExecutablePath` and `VoicesPath` |
| Local TTS (server) | [Kokoro-FastAPI](https://github.com/keshavsingh3197/Kokoro-FastAPI) (our fork of remsky's, pinned), natively via `scripts/setup-voiceover.ps1` (needs `uv` + eSpeak NG, no Docker); voice tuning is switched on for "My voices" | `kokoro`, `http://localhost:8880/v1` |
| "My voices" in the voiceover panel (your own voice) | English lines: a Kokoro voice tuned from the sample on the first English line (`/dev/tune`), quick. Any language: [Seed-VC](https://github.com/Plachtaa/seed-vc) via `scripts/setup-voice-ai.ps1` — slow on a CPU, each line converts once and is cached; also the fallback when the tuned voice fails | `VoiceConversion:Enabled: true` (on in Development) |
| Local transcription | [whisper.cpp](https://github.com/ggerganov/whisper.cpp) — build `whisper-cli`, download a `ggml-*.bin` | `whispercpp-local`: `ExecutablePath`, `ModelsPath`, `Model` |
| Transcription (server) | [faster-whisper-server](https://github.com/fedirz/faster-whisper-server), Docker | `faster-whisper`, `http://localhost:8000/v1` |

Hosted free tiers (Groq, Gemini, OpenRouter, Cloudflare Workers AI, HuggingFace,
Pollinations) need **no install** — just an account, `Enabled: true`, and the key stored
through the admin API. Outbound calls are restricted to `Ai:HostAllowlist`; loopback and
private addresses are permitted only for providers marked `IsLocal`.

---

## 7. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `NETSDK1045: The current .NET SDK does not support targeting net10.0` | .NET 10 SDK missing. `dotnet --list-sdks` and install per section 2. |
| Restore fails `401 Unauthorized` on `nuget.pkg.github.com` | No sibling checkouts *and* no `PACKAGES_READ_TOKEN`. See [private package access](#private-package-access-one-of-these-two). |
| Startup: *"refuses to start without a connection string"* | `Mongo:ConnectionString` not set — section 4. |
| Render request: *"Video rendering is not configured on this server."* | FFmpeg missing, too old, or not on the service's `PATH`. Set absolute `Ffmpeg:FfmpegPath` / `FfprobePath`. |
| *"The installed renderer is 4.4; 6.0 or newer is required."* | Distro FFmpeg is too old — install a static/full build. |
| Video renders but subtitles never appear | Build lacks libass. Check `-buildconf` for `--enable-libass`. |
| Subtitles render as boxes/blank | DejaVu Sans not installed — install it or change `Render:SubtitleFontName`. |
| `npm ci` fails on `@angular/*` peer versions | Node below 22. `node -v`, then use nvm. |
| WSL: `exec: node: Permission denied` | The Windows npm shim is being used. Install Node **inside** WSL via nvm. |
| `mongod: command not found` in WSL | MongoDB installed on Windows only. Use Docker, install it inside WSL, or point at Atlas. |
| `/api/admin` returns 403 | `Admin:Mode` is `LocalOnly` (default) and the request is not from this machine. `LocalOnly` is refused outright in Production — use `Jwt` there. |
