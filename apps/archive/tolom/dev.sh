#!/bin/bash
# ── Tolom dev helper — loads secrets from macOS Keychain via keychain-env ──
# Usage: ./dev.sh [next dev args...]
set -euo pipefail

cd "$(dirname "$0")"

echo "🔑 Loading secrets from macOS Keychain..."
keychain-env pull tolom 2>/dev/null || {
  echo "No secrets found for 'tolom' in Keychain."
  echo "Import your .env file with: keychain-env push tolom .env.local"
  exit 1
}

echo "🚀 Starting Next.js dev server..."
next dev "$@"
