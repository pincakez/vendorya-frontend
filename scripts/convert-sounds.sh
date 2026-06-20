#!/usr/bin/env bash
# Batch-convert raw sound masters → the two formats the app plays.
# Source:  repo-root  ./sounds/*.{mp3,wav,flac,m4a,ogg}
# Output:  vendorya-frontend/public/sounds/ogg/<name>.ogg   (Vorbis, high quality)
#          vendorya-frontend/public/sounds/mp3/<name>.mp3   (Safari/iOS fallback)
# The output filename (minus extension) is the sound's id used by playSound(name).
#
# Quality knob: QUALITY=lossless ./convert-sounds.sh  → FLAC-in-OGG (bigger, true lossless)
# Default is Vorbis q6 — tiny, plays in every browser, inaudible difference for UI sounds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/sounds"
OUT_OGG="$ROOT/vendorya-frontend/public/sounds/ogg"
OUT_MP3="$ROOT/vendorya-frontend/public/sounds/mp3"
QUALITY="${QUALITY:-vorbis}"   # vorbis | lossless
mkdir -p "$OUT_OGG" "$OUT_MP3"

shopt -s nullglob nocaseglob
files=("$SRC"/*.{mp3,wav,flac,m4a,ogg,aac})
if [ ${#files[@]} -eq 0 ]; then
  echo "No source files in $SRC — drop .mp3/.wav masters there first."; exit 0
fi

for f in "${files[@]}"; do
  name="$(basename "${f%.*}")"
  if [ "$QUALITY" = "lossless" ]; then
    ffmpeg -y -loglevel error -i "$f" -c:a flac "$OUT_OGG/$name.ogg"
  else
    # q:a 8 ≈ ~256kbps Vorbis — excellent quality, still tiny for short clips
    ffmpeg -y -loglevel error -i "$f" -ar 48000 -c:a libvorbis -q:a 8 "$OUT_OGG/$name.ogg"
  fi
  # mp3 fallback at V2 (~190kbps VBR) for Safari/iOS
  ffmpeg -y -loglevel error -i "$f" -ar 48000 -c:a libmp3lame -q:a 2 "$OUT_MP3/$name.mp3"
  printf '  ✓ %-20s → ogg + mp3\n' "$name"
done
echo "Done. ${#files[@]} sound(s) → public/sounds/{ogg,mp3}  (QUALITY=$QUALITY)"
