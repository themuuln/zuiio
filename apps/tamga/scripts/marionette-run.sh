#!/usr/bin/env bash
# Start Tamga in debug mode and register it with Marionette.
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NAME="${NAME:-tamga}"
PORT="${PORT:-8181}"
DEVICE="${DEVICE:-}"
LOG_FILE="${LOG_FILE:-/tmp/tamga-flutter.log}"
PID_FILE="${PID_FILE:-/tmp/tamga-flutter.pid}"
STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-60}"

usage() {
  cat <<'EOF'
Usage: scripts/marionette-run.sh

Environment:
  MARIONETTE       Override the Marionette CLI path.
  NAME             Marionette instance name (default: tamga).
  PORT             Host VM service port (default: 8181).
  DEVICE           Flutter device id or name.
  LOG_FILE         Flutter log path (default: /tmp/tamga-flutter.log).
  PID_FILE         PID file (default: /tmp/tamga-flutter.pid).
  STARTUP_TIMEOUT  VM service wait timeout in seconds (default: 60).
EOF
}

if [ "$#" -gt 0 ]; then
  case "$1" in
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
fi

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

extract_uri() {
  local raw
  raw="$(sed -nE '/VM service|vmservice|listening/s/.*((wss?|https?):\/\/[^ ]+).*/\1/p' "$LOG_FILE" | sed -n '1p')"
  [ -n "$raw" ] || return 1
  raw="${raw%,}"
  raw="${raw%/}"
  case "$raw" in
    https://*) raw="wss://${raw#https://}" ;;
    http://*) raw="ws://${raw#http://}" ;;
  esac
  case "$raw" in
    */ws) printf '%s\n' "$raw" ;;
    *) printf '%s/ws\n' "$raw" ;;
  esac
}

MARIONETTE_BIN="$(resolve_marionette)"
FLUTTER_PID=""
REGISTERED=false

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [ "$REGISTERED" = true ]; then
    "$MARIONETTE_BIN" unregister "$NAME" >/dev/null 2>&1 || true
  fi
  if [ -n "$FLUTTER_PID" ] && kill -0 "$FLUTTER_PID" 2>/dev/null; then
    kill "$FLUTTER_PID" 2>/dev/null || true
    wait "$FLUTTER_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
  exit "$status"
}
trap cleanup EXIT INT TERM

if [ -f "$PID_FILE" ]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
    echo "ERROR: Tamga is already running with PID $old_pid. Use make marionette-stop first." >&2
    exit 1
  fi
  rm -f "$PID_FILE"
fi

: > "$LOG_FILE"
flutter_args=(run --debug --host-vmservice-port "$PORT")
if [ -n "$DEVICE" ]; then
  flutter_args+=(--device-id "$DEVICE")
fi

echo "Starting Tamga debug build (log: $LOG_FILE)"
flutter "${flutter_args[@]}" >"$LOG_FILE" 2>&1 &
FLUTTER_PID=$!
printf '%s\n' "$FLUTTER_PID" > "$PID_FILE"

echo "Waiting up to ${STARTUP_TIMEOUT}s for the Flutter VM service..."
uri=""
for ((second = 0; second < STARTUP_TIMEOUT; second++)); do
  if uri="$(extract_uri 2>/dev/null)"; then
    break
  fi
  if ! kill -0 "$FLUTTER_PID" 2>/dev/null; then
    cat "$LOG_FILE"
    echo "ERROR: Flutter exited before exposing a VM service." >&2
    exit 1
  fi
  sleep 1
done

if [ -z "$uri" ]; then
  cat "$LOG_FILE"
  echo "ERROR: Timed out waiting for the Flutter VM service." >&2
  exit 1
fi

cat "$LOG_FILE"
echo "Registering $NAME at $uri"
"$MARIONETTE_BIN" unregister "$NAME" >/dev/null 2>&1 || true
"$MARIONETTE_BIN" register "$NAME" "$uri"
REGISTERED=true
"$MARIONETTE_BIN" get-interactive-elements -i "$NAME"
echo "Marionette is ready. Press Ctrl-C to stop Tamga."

wait "$FLUTTER_PID"
