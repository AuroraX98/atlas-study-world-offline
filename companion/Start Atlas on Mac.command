#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js 22 or newer from https://nodejs.org/ to use the optional companion."
  echo "You can still open atlas-study-world.html directly for offline tracking."
  read -r atlas_finish
  exit 1
fi
node companion.mjs
