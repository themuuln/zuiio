#!/usr/bin/env bash
# Run the Tamga onboarding smoke flow against a running debug build.
set -euo pipefail

NAME="${NAME:-tamga}"
URI=""
SCREENSHOT="${SCREENSHOT:-/tmp/tamga-marionette-smoke.png}"

usage() {
  cat <<'EOF'
Usage: scripts/marionette-smoke.sh --uri <ws://.../ws> [--name <instance>]

Environment:
  MARIONETTE   Override the Marionette CLI path.
  SCREENSHOT   Screenshot output path (default: /tmp/tamga-marionette-smoke.png).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    -u|--uri)
      [ "$#" -ge 2 ] || { echo "ERROR: --uri requires a value" >&2; exit 2; }
      URI="$2"
      shift 2
      ;;
    -n|--name)
      [ "$#" -ge 2 ] || { echo "ERROR: --name requires a value" >&2; exit 2; }
      NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$URI" ]; then
  echo "ERROR: Missing --uri ws://.../ws" >&2
  usage >&2
  exit 2
fi

case "$URI" in
  ws://*|wss://*) ;;
  *)
    echo "ERROR: Marionette URI must start with ws:// or wss://" >&2
    exit 2
    ;;
esac

resolve_marionette() {
  if [ -n "${MARIONETTE:-}" ]; then
    printf '%s\n' "$MARIONETTE"
    return
  fi
  if command -v marionette >/dev/null 2>&1; then
    command -v marionette
    return
  fi
  if [ -x "$HOME/.pub-cache/bin/marionette" ]; then
    printf '%s\n' "$HOME/.pub-cache/bin/marionette"
    return
  fi
  echo "ERROR: Marionette CLI not found. Install marionette_cli or set MARIONETTE." >&2
  exit 1
}

MARIONETTE_BIN="$(resolve_marionette)"
REGISTERED=false

cleanup() {
  if [ "$REGISTERED" = true ]; then
    "$MARIONETTE_BIN" unregister "$NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

"$MARIONETTE_BIN" unregister "$NAME" >/dev/null 2>&1 || true
"$MARIONETTE_BIN" register "$NAME" "$URI"
REGISTERED=true

elements="$($MARIONETTE_BIN get-interactive-elements -i "$NAME")"
if [ -z "$elements" ]; then
  echo "ERROR: Marionette returned no interactive elements." >&2
  exit 1
fi

printf '%s\n' "$elements"
element_count="$(printf '%s\n' "$elements" | awk 'NF { count++ } END { print count + 0 }')"
if [ "$element_count" -lt 3 ]; then
  echo "ERROR: Expected at least 3 interactive elements; found $element_count." >&2
  exit 1
fi

case "$elements" in
  *Эхлэх*) ;;
  *)
    echo "ERROR: Onboarding start button (Эхлэх) was not found." >&2
    exit 1
    ;;
esac

"$MARIONETTE_BIN" tap -i "$NAME" --text "Эхлэх"
sleep 1

role_elements="$($MARIONETTE_BIN get-interactive-elements -i "$NAME")"
printf '%s\n' "$role_elements"
case "$role_elements" in
  *Үргэлжлүүлэх*) ;;
  *)
    echo "ERROR: Role-selection screen did not expose Үргэлжлүүлэх." >&2
    exit 1
    ;;
esac

mkdir -p "$(dirname "$SCREENSHOT")"
"$MARIONETTE_BIN" take-screenshots -i "$NAME" --output "$SCREENSHOT" --no-open
"$MARIONETTE_BIN" get-logs -i "$NAME" || true
printf 'Marionette smoke test passed. Screenshot: %s\n' "$SCREENSHOT"
