#!/bin/sh
# Start a workspace dev server with the Node version this project requires.
# Editors and preview panes often launch with the system Node, which is older
# than the v22 the API's type stripping and pnpm 11 both need.
#
#   scripts/dev.sh web   -> Angular on :4300
#   scripts/dev.sh api   -> Fastify on :3000
set -e

target="${1:-web}"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
  nvm use >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || true
fi

case "$target" in
  web) exec pnpm -C "$repo_root" --filter @portfolio/web start ;;
  api) exec pnpm -C "$repo_root" --filter @portfolio/api dev ;;
  *)   echo "unknown target: $target (expected 'web' or 'api')" >&2; exit 1 ;;
esac
