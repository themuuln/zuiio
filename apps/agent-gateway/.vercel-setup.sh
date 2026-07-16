#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

while IFS='=' read -r key value; do
  [[ "$key" =~ ^# ]] && continue
  [[ -z "$key" ]] && continue
  echo "Setting $key..."
  echo "$value" | vercel env add "$key" production --yes --force 2>&1 | tail -1
done < <(grep -v '^#' .env.local | grep -v '^$' | grep -v '^$')
