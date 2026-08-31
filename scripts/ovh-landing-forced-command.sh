#!/usr/bin/env bash
set -Eeuo pipefail

exec sudo -n -u softdev env \
  HOME=/var/lib/softdev \
  PM2_HOME=/var/lib/softdev/.pm2 \
  bash -se <<'REMOTE'
set -Eeuo pipefail

readonly APP_DIR=/opt/landing/landing-softdev
cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Deployment stopped: tracked changes exist in $APP_DIR"
  git status --short
  exit 1
fi

git fetch --prune origin main
git merge --ff-only origin/main
bash scripts/deploy-ovh.sh
REMOTE
