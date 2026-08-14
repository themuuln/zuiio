#!/usr/bin/env bash
# ── Telegram Webhook Setup ──────────────────────────────────────
# Run this AFTER deploying the telegram-webhook edge function.
#
# Usage:
#   ./scripts/setup-telegram-webhook.sh <function_url>
#
# Example:
#   ./scripts/setup-telegram-webhook.sh https://your-project.supabase.co/functions/v1/telegram-webhook
#
# Required env vars:
#   TELEGRAM_BOT_TOKEN — from BotFather
#   TELEGRAM_WEBHOOK_SECRET — your chosen secret (optional but recommended)
#
# To clear the webhook:
#   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
# ────────────────────────────────────────────────────────────────

set -euo pipefail

if [ $# -lt 1 ]; then
	echo "Usage: $0 <function_url>"
	echo ""
	echo "  ./scripts/setup-telegram-webhook.sh https://your-project.supabase.co/functions/v1/telegram-webhook"
	exit 1
fi

FUNCTION_URL="$1"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
	echo "❌ TELEGRAM_BOT_TOKEN is not set"
	exit 1
fi

SECRET=""
if [ -n "${TELEGRAM_WEBHOOK_SECRET:-}" ]; then
	SECRET="&secret_token=${TELEGRAM_WEBHOOK_SECRET}"
fi

echo "🌐 Setting Telegram webhook to: ${FUNCTION_URL}"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
	-H "Content-Type: application/json" \
	-d "{\"url\": \"${FUNCTION_URL}\", \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET:-}\", \"allowed_updates\": [\"message\"]}")

echo "📬 Response: ${RESPONSE}"

# Verify
echo ""
echo "🔍 Verifying webhook..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool || echo "${RESPONSE}"
