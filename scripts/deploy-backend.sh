#!/usr/bin/env bash
# deploy-backend.sh
#
# Builds the NestJS app and deploys it to Elastic Beanstalk.
#
# Prerequisites:
#   - AWS CLI v2 configured (aws configure)
#   - EB CLI installed (pip install awsebcli)
#   - Environment variables set (see below)
#
# Usage:
#   EB_ENV=task-manager-prod ./scripts/deploy-backend.sh

set -euo pipefail

EB_ENV="${EB_ENV:?Error: EB_ENV is not set}"
BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"

echo "▶  Building backend..."
cd "$BACKEND_DIR"
npm ci --silent
npm run build

echo "▶  Deploying to Elastic Beanstalk environment: $EB_ENV ..."
eb deploy "$EB_ENV" --staged

echo "✓  Backend deploy complete."
