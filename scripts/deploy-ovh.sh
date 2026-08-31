#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR=/opt/landing/landing-softdev
readonly PM2_HOME=/var/lib/softdev/.pm2
readonly BACKEND_HEALTH_URL=http://127.0.0.1:3000/api/health
readonly PUBLIC_URL=https://softwareeasydev.com/

if [[ "$(id -un)" != "softdev" ]]; then
  echo "This script must run as the softdev user."
  exit 1
fi

cd "$APP_DIR/backend"
npm ci
npm test -- --runInBand
npm run build

cd "$APP_DIR/frontend"
npm ci
npm run build

export PM2_HOME
/usr/local/bin/pm2 reload landing-backend --update-env
/usr/local/bin/pm2 save --force

for attempt in {1..15}; do
  if curl --fail --silent --show-error "$BACKEND_HEALTH_URL" > /dev/null; then
    break
  fi

  if [[ "$attempt" -eq 15 ]]; then
    echo "Backend health check failed after deployment."
    exit 1
  fi

  sleep 2
done

curl --fail --silent --show-error "$PUBLIC_URL" > /dev/null

echo "Deployment complete: $(git -C "$APP_DIR" rev-parse --short HEAD)"
