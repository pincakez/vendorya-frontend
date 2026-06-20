#!/usr/bin/env bash
# Generate 10 pleasant placeholder notification tones (s01..s10) as WAV masters
# into repo-root ./sounds/. These are starter sounds — drop real .wav/.mp3 masters
# with the same names to replace them, then run convert-sounds.sh.
# Synth only (sine + soft envelope + lowpass), no external assets.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/sounds"
mkdir -p "$OUT"

# tone <name> <total_dur> <fade_out_start> "<freq:dur[ freq:dur ...]>"
tone() {
  local name="$1" total="$2" fst="$3"; shift 3
  local segs=("$@") inputs=() labels="" n=0
  for s in "${segs[@]}"; do
    local f="${s%%:*}" d="${s##*:}"
    inputs+=(-f lavfi -i "sine=frequency=$f:duration=$d")
    labels+="[$n]"; n=$((n+1))
  done
  local fdur; fdur="$(awk "BEGIN{printf \"%.3f\", $total-$fst}")"
  ffmpeg -y -loglevel error "${inputs[@]}" \
    -filter_complex "${labels}concat=n=$n:v=0:a=1,volume=0.5,lowpass=f=6000,afade=t=in:d=0.006,afade=t=out:st=$fst:d=$fdur:curve=exp" \
    -ar 48000 "$OUT/$name.wav"
  printf '  ♪ %s\n' "$name"
}

tone s01 0.34 0.12 "880:0.34"                 # info — soft single ping
tone s02 0.40 0.20 "659:0.20" "988:0.20"      # ascending two-tone (success-ish)
tone s03 0.40 0.24 "587:0.20" "440:0.20"      # descending two-tone (warning)
tone s04 0.46 0.34 "988:0.14" "988:0.14" "988:0.14"  # triple pulse (alert)
tone s05 0.40 0.14 "523:0.40"                 # gentle C5
tone s06 0.30 0.10 "1318:0.30"                # high ping
tone s07 0.34 0.24 "784:0.14" "784:0.14"      # double tap
tone s08 0.36 0.14 "1047:0.36"                # bright chime C6
tone s09 0.36 0.16 "392:0.36"                 # low boop
tone s10 0.30 0.10 "1568:0.30"               # sparkle G6

echo "Generated 10 placeholder masters in $OUT"
