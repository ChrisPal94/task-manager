#!/bin/bash
set -e

APP_DIR="/var/app/current"
DB_DIR="$APP_DIR/data"

# Ensure data directory exists with correct ownership
mkdir -p "$DB_DIR"
chown webapp:webapp "$DB_DIR"

cd "$APP_DIR"

echo "[postdeploy] Running migrations..."
npx typeorm migration:run -d dist/data-source.js

echo "[postdeploy] Running seed..."
node dist/database/seed.js

echo "[postdeploy] Done."
