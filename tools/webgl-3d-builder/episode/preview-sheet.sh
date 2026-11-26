#!/usr/bin/env bash
# Render one still per dialogue line (plus the title) and tile them into <out>_sheet.jpg for a quick visual check.
# usage: preview-sheet.sh <episode.json> <out.mp4> [width] [height]
set -euo pipefail
EP="$1"; OUT="$2"; W="${3:-960}"; H="${4:-540}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PREV="${OUT%.mp4}_preview"
node "$HERE/render-episode.mjs" --episode "$EP" --out "$OUT" --width "$W" --height "$H" --preview-frames 1s >/dev/null
F=$(node -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(t.map(x=>((x.s+x.e)/2).toFixed(2)+"s").join(","))' "$PREV/timeline.json")
rm -f "$PREV"/*.png
node "$HERE/render-episode.mjs" --episode "$EP" --out "$OUT" --width "$W" --height "$H" --preview-frames "1.5s,$F" >/dev/null
( cd "$PREV" && ls frame_*.png | awk '{printf "file %s\n", $0}' > list.txt && ffmpeg -v error -y -f concat -i list.txt -vf "scale=480:-1,tile=4x6" -frames:v 1 "../$(basename "${OUT%.mp4}")_sheet.jpg" )
echo "${OUT%.mp4}_sheet.jpg"
