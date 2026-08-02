#!/usr/bin/env bash
# Attach Marionette to an already-running Tamga Flutter app.
set -euo pipefail

NAME="${NAME:-tamga}"
URI="${URI:-}"
URI_FILE="${URI_FILE:-/tmp/tamga-marionette-${NAME}.uri}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-30}"

usage() {
  cat <<'EOF'
Usage: scripts/marionette-attach.sh [--uri URI]

Environment:
  MARIONETTE    Override the Marionette CLI path.
  NAME          Marionette instance name (default: tamga).
  URI           Flutter VM service URL; may be http(s):// or ws(s)://.
  URI_FILE      File to read when URI is omitted.
  WAIT_TIMEOUT  Seconds to wait for the Marionette binding (default: 30).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    -u|--uri)
      [ "$#" -ge 2 ] || { echo "ERROR: --uri requires a value." >&2; exit 2; }
      URI="$2"
      shift 2
      ;;
    -n|--name)
      [ "$#" -ge 2 ] || { echo "ERROR: --name requires a value." >&2; exit 2; }
      NAME="$2"
      URI_FILE="/tmp/tamga-marionette-${NAME}.uri"
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

normalize_uri() {
  local raw="$1"
  raw="${raw%,}"
  raw="${raw%/}"
  case "$raw" in
    */devtools|*/devtools/)
      echo "ERROR: Pass the Flutter VM service URL, not the DevTools URL." >&2
      return 1
      ;;
    https://*) raw="wss://${raw#https://}" ;;
    http://*) raw="ws://${raw#http://}" ;;
  esac
  case "$raw" in
    ws://*|wss://*) ;;
    *)
      echo "ERROR: URI must start with http(s):// or ws(s)://." >&2
      return 1
      ;;
  esac
  case "$raw" in
    */ws) printf '%s\n' "$raw" ;;
    *) printf '%s/ws\n' "$raw" ;;
  esac
}

MARIONETTE_BIN="$(resolve_marionette)"
if [ -z "$URI" ] && [ -f "$URI_FILE" ]; then
  URI="$(cat "$URI_FILE")"
fi
if [ -z "$URI" ]; then
  echo "ERROR: No VM service URI supplied and $URI_FILE does not exist." >&2
  echo "Start with 'tmario' or pass 'tmattach http://.../' from flutter run." >&2
  exit 2
fi
URI="$(normalize_uri "$URI")"

registered=false
cleanup() {
  if [ "$registered" = true ]; then
    "$MARIONETTE_BIN" unregister "$NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

"$MARIONETTE_BIN" unregister "$NAME" >/dev/null 2>&1 || true
if ! register_output="$("$MARIONETTE_BIN" register "$NAME" "$URI" 2>&1)"; then
  printf '%s\n' "$register_output" >&2
  case "$register_output" in
    *403*|*authentication*)
      echo "ERROR: This looks like a Flutter DDS/DevTools URL. Restart Tamga with 'tmario' so --no-dds is used." >&2
      ;;
  esac
  exit 1
fi
registered=true

elements=""
attempts=$((WAIT_TIMEOUT * 2))
for ((attempt = 0; attempt < attempts; attempt++)); do
  if elements="$("$MARIONETTE_BIN" get-interactive-elements -i "$NAME" 2>/dev/null)" && [ -n "$elements" ]; then
    break
  fi
  sleep 0.5
done

if [ -z "$elements" ]; then
  echo "ERROR: Marionette registered but did not expose UI elements within ${WAIT_TIMEOUT}s." >&2
  exit 1
fi

element_count="$(printf '%s\n' "$elements" | awk 'NF { count++ } END { print count + 0 }')"
printf '%s\n' "$URI" >| "$URI_FILE"
printf 'Marionette attached: name=%s uri=%s interactive_lines=%s\n' "$NAME" "$URI" "$element_count"
registered=false
