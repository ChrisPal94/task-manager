#!/usr/bin/env bash
# deploy-frontend.sh
#
# Builds the React SPA and deploys it to S3, then invalidates the CloudFront
# distribution so users get the latest version immediately.
#
# Prerequisites:
#   - AWS CLI v2 configured (aws configure)
#   - Environment variables set (see below)
#
# Usage:
#   S3_BUCKET=my-bucket CF_DISTRIBUTION_ID=EXXXXX ./scripts/deploy-frontend.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
S3_BUCKET="${S3_BUCKET:?Error: S3_BUCKET is not set}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:?Error: CF_DISTRIBUTION_ID is not set}"
FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"

echo "▶  Building frontend..."
cd "$FRONTEND_DIR"
npm ci --silent
npm run build

echo "▶  Syncing to s3://$S3_BUCKET ..."
aws s3 sync dist/ "s3://$S3_BUCKET" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# index.html must NOT be cached — browsers need the latest entry point
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo "▶  Invalidating CloudFront distribution $CF_DISTRIBUTION_ID ..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo "✓  Invalidation created: $INVALIDATION_ID"
echo "✓  Deploy complete. Changes will be live within ~60 seconds."
