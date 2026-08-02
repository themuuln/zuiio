#!/bin/bash
# ── Tamga dev helper — loads local `.env` without Dart defines ──
# Usage: ./dev.sh [flutter args...]
#
# The generated asset is removed when Flutter exits. It must contain only
# public client configuration; never put a service-role/secret key in `.env`.
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and fill in Supabase values."
  exit 1
fi

generated_env="assets/config/generated.env"
cp .env "$generated_env"

cleanup() {
  rm -f "$generated_env"
}

trap cleanup EXIT
trap 'cleanup; exit 143' INT TERM

echo "🚀 Running Flutter with .env..."
flutter run "$@"
