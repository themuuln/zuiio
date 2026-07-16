#!/bin/bash
# drain-queue.sh — Process pending Telegram updates from Cloudflare Worker queue.
# Run every 30 seconds via launchd to catch messages during downtime.

CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET not set"
  exit 1
fi

curl -s -X POST "http://localhost:3000/api/cron/drain-queue" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
