#!/bin/bash
# ── Tamga dev helper — loads secrets from macOS Keychain via keychain-env ──
# Usage: ./dev.sh [flutter args...]
#
# Generates a dart_defines.json from Keychain secrets and passes it to
# `flutter run` via --dart-define-from-file.
#
# Requires: keychain-env (see ~/.local/bin/)
set -euo pipefail

cd "$(dirname "$0")"

echo "🔑 Loading secrets from macOS Keychain..."
keychain-env dart-define tamga dart_defines.json

echo "🚀 Running Flutter..."
keychain-env run tamga -- flutter run --dart-define-from-file=dart_defines.json "$@"
