#!/usr/bin/env bash
# Regenerate all Chrome Web Store promo PNGs from the HTML sources.
# Usage: bash store-assets/src/render.sh
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC="$(cd "$(dirname "$0")" && pwd)"
OUT="$(cd "$SRC/.." && pwd)"

shoot() {
  local name="$1" w="$2" h="$3"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --allow-file-access-from-files \
    --default-background-color=00000000 \
    --window-size="${w},${h}" \
    --screenshot="$OUT/${name}.png" \
    "file://$SRC/${name}.html" >/dev/null 2>&1
  echo "rendered ${name}.png (${w}x${h})"
}

shoot screenshot-1 1280 800
shoot screenshot-2 1280 800
shoot marquee-1400x560 1400 560
shoot promo-tile-440x280 440 280
