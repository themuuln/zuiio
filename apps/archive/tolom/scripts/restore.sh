#!/usr/bin/env bash
# ============================================================
# TOLOM — Database Restore Script
#
# Restores a PostgreSQL dump created by backup.sh.
# Supports both local Supabase and remote databases.
#
# Usage:
#   ./scripts/restore.sh ./.backups/tolom-backup-20260513-full.sql.gz
#   ./scripts/restore.sh ./.backups/tolom-backup-20260513-schema.sql --local
#   ./scripts/restore.sh ./.backups/tolom-backup-20260513-data.sql --remote
#
# ⚠️  WARNING: This will OVERWRITE the target database.
#   For local: resets the local Supabase DB and applies the dump.
#   For remote: writes directly to the DATABASE_URL database.
# ============================================================

set -euo pipefail

RESTORE_FILE="${1:-}"
MODE="${2:-local}"

if [[ -z "$RESTORE_FILE" || "$RESTORE_FILE" == "--help" ]]; then
  echo "TOLOM Database Restore"
  echo ""
  echo "Usage:"
  echo "  ./scripts/restore.sh <file> [--local|--remote]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/restore.sh ./.backups/tolom-backup-20260513-full.sql.gz"
  echo "  ./scripts/restore.sh backup.sql --remote"
  echo ""
  echo "Environment:"
  echo "  DATABASE_URL     Required for --remote restore"
  exit 0
fi

if [[ ! -f "$RESTORE_FILE" ]]; then
  echo "ERROR: File not found: $RESTORE_FILE"
  exit 1
fi

# ── Confirm ────────────────────────────────────────────────────

echo "⚠️  WARNING: This will OVERWRITE the database."
echo "  Source: $RESTORE_FILE"
echo "  Target: $MODE"
echo ""
read -r -p "Are you sure? Type 'yes' to continue: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Restore cancelled."
  exit 0
fi

# ── Decompress if gzipped ──────────────────────────────────────

INPUT="$RESTORE_FILE"
CLEANUP=""
if [[ "$RESTORE_FILE" == *.gz ]]; then
  CLEANUP="$(mktemp)"
  gunzip -c "$RESTORE_FILE" > "$CLEANUP"
  INPUT="$CLEANUP"
fi

# ── Local restore ──────────────────────────────────────────────

if [[ "$MODE" == "--local" || "$MODE" == "local" ]]; then
  if ! command -v supabase &>/dev/null; then
    echo "ERROR: supabase CLI not found."
    exit 1
  fi

  echo "→ Resetting local database..."
  supabase db reset --local 2>/dev/null

  echo "→ Applying backup..."
  supabase db query -f "$INPUT" 2>/dev/null

  echo "→ Local restore complete."
  rm -f "$CLEANUP"
  exit 0
fi

# ── Remote restore ─────────────────────────────────────────────

if [[ "$MODE" == "--remote" || "$MODE" == "remote" ]]; then
  if ! command -v psql &>/dev/null; then
    echo "ERROR: psql not found."
    exit 1
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL is not set."
    exit 1
  fi

  echo "→ Applying backup to remote database..."
  psql "$DATABASE_URL" -f "$INPUT"

  echo "→ Remote restore complete."
  rm -f "$CLEANUP"
  exit 0
fi

echo "Usage: ./scripts/restore.sh <file> [--local|--remote]"
rm -f "$CLEANUP"
exit 1
