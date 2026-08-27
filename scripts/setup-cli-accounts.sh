#!/bin/bash
# One-time CLI account setup — Supabase profiles
set -euo pipefail

echo "=== Supabase — login once per account ==="
echo "Each command opens a browser. Complete auth, then move to the next."
echo ""

declare -a SB_PROFILES=(
  "themuuln6@gmail.com"
  "zerone"
  "yesprice"
  "themuln"
  "themuuln4@gmail.com"
)

for profile in "${SB_PROFILES[@]}"; do
  # Check if already configured
  if supabase --profile "$profile" --help >/dev/null 2>&1; then
    echo "  ✓ $profile — already configured"
  else
    echo ""
    echo "  ─────────────────────────────────"
    echo "  Opening browser for: $profile"
    echo "  ─────────────────────────────────"
    echo "  → supabase login --name \"$profile\""
    supabase login --name "$profile"
  fi
done

echo ""
echo "=== Verification ==="
for profile in "${SB_PROFILES[@]}"; do
  echo -n "  $profile ... "
  if supabase --profile "$profile" --help >/dev/null 2>&1; then
    echo "ok"
  else
    echo "MISSING"
  fi
done

echo ""
echo "=== Next steps ==="
echo "1. Source .zshrc:  source ~/.zshrc"
echo "2. Try it:"
echo "   cd ~/.workspace/tolom"
echo "   as-zerone        # switch both CLIs to zerone"
echo "   v whoami         # Vercel whoami"
echo "   v-tolom whoami   # Vercel as tolom account (one-off)"
echo "   s db push        # Supabase db push (current profile)"
echo ""
echo "Note: Vercel tokens are loaded from pass at shell start."
echo "      No manual Vercel login needed."
