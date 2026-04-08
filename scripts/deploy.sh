#!/usr/bin/env bash
# deploy.sh
#
# Unified deploy script for Task Manager.
# Reads config from .env.deploy in the project root.
#
# Usage:
#   ./scripts/deploy.sh all        — build & deploy backend + frontend
#   ./scripts/deploy.sh backend    — build & deploy backend only
#   ./scripts/deploy.sh frontend   — build & deploy frontend only

set -euo pipefail

# ── Resolve paths ─────────────────────────────────────────────────────────────
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$ROOT_DIR/.env.deploy"

# ── Load config ───────────────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗  Missing $ENV_FILE"
  echo "   Copy .env.deploy.example to .env.deploy and fill in your values."
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

: "${EB_ENV:?EB_ENV is not set in .env.deploy}"
: "${S3_BUCKET:?S3_BUCKET is not set in .env.deploy}"
: "${CF_DISTRIBUTION_ID:?CF_DISTRIBUTION_ID is not set in .env.deploy}"

# ── Helpers ───────────────────────────────────────────────────────────────────
deploy_backend() {
  echo ""
  echo "══════════════════════════════════════════"
  echo "  BACKEND"
  echo "══════════════════════════════════════════"
  echo "▶  Building..."
  cd "$BACKEND_DIR"
  npm ci --silent
  npm run build

  echo "▶  Deploying to Elastic Beanstalk ($EB_ENV)..."
  eb deploy "$EB_ENV" --staged

  echo "✓  Backend deploy complete."
}

deploy_frontend() {
  echo ""
  echo "══════════════════════════════════════════"
  echo "  FRONTEND"
  echo "══════════════════════════════════════════"
  echo "▶  Building..."
  cd "$FRONTEND_DIR"
  npm ci --silent
  npm run build

  echo "▶  Syncing to s3://$S3_BUCKET ..."
  aws s3 sync dist/ "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "index.html"

  aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --content-type "text/html"

  echo "▶  Invalidating CloudFront ($CF_DISTRIBUTION_ID)..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CF_DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)

  echo "✓  Invalidation created: $INVALIDATION_ID"
  echo "✓  Frontend deploy complete. Live in ~60 seconds."
}

# ── Main ──────────────────────────────────────────────────────────────────────
TARGET="${1:-}"

case "$TARGET" in
  all)
    deploy_backend
    deploy_frontend
    echo ""
    echo "🚀  Full deploy complete."
    ;;
  backend)
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    ;;
  *)
    echo "Usage: $0 {all|backend|frontend}"
    exit 1
    ;;
esac
