#!/usr/bin/env bash
# ============================================================
# TOLOM — Database Backup Script
#
# Creates timestamped PostgreSQL dumps for both:
#   - Local Supabase (via supabase CLI)
#   - Remote Supabase / any Postgres URL (via pg_dump)
#
# Usage:
#   ./scripts/backup.sh                  # Back up local Supabase DB
#   ./scripts/backup.sh --remote         # Back up remote DB (reads DATABASE_URL)
#   ./scripts/backup.sh --schema-only    # Schema only (no data)
#   ./scripts/backup.sh --data-only      # Data only (no schema)
#   ./scripts/backup.sh --prune          # Remove backups older than 30 days
#
# Requirements:
#   - supabase CLI (for local backups)
#   - pg_dump (for remote backups, ships with Postgres)
#   - DATABASE_URL env var (for remote backups)
# ============================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./.backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
MODE="${1:-local}"

mkdir -p "$BACKUP_DIR"

# ── Help ───────────────────────────────────────────────────────

if [[ "$MODE" == "--help" || "$MODE" == "-h" ]]; then
  echo "TOLOM Database Backup"
  echo ""
  echo "Usage:"
  echo "  ./scripts/backup.sh              Local Supabase backup (default)"
  echo "  ./scripts/backup.sh --remote     Remote database backup"
  echo "  ./scripts/backup.sh --schema-only"
  echo "  ./scripts/backup.sh --data-only"
  echo "  ./scripts/backup.sh --prune      Clean old backups"
  echo ""
  echo "Environment:"
  echo "  BACKUP_DIR       Backup output directory (default: ./.backups)"
  echo "  RETENTION_DAYS   Days to keep backups (default: 30)"
  echo "  DATABASE_URL     Required for --remote backups"
  exit 0
fi

# ── Prune old backups ──────────────────────────────────────────

if [[ "$MODE" == "--prune" ]]; then
  echo "→ Pruning backups older than ${RETENTION_DAYS} days in ${BACKUP_DIR}..."
  find "$BACKUP_DIR" -name "tolom-backup-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete
  find "$BACKUP_DIR" -name "tolom-backup-*.sql" -type f -mtime "+${RETENTION_DAYS}" -delete
  echo "  Done."
  exit 0
fi

# ── Flags ──────────────────────────────────────────────────────

SCHEMA_ONLY=false
DATA_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --schema-only) SCHEMA_ONLY=true ;;
    --data-only) DATA_ONLY=true ;;
    --remote) MODE="remote" ;;
  esac
done

# ── Local backup (supabase CLI) ────────────────────────────────

if [[ "$MODE" == "local" ]]; then
  echo "→ Backing up LOCAL Supabase database..."

  if ! command -v supabase &>/dev/null; then
    echo "ERROR: supabase CLI not found — install it first."
    exit 1
  fi

  if [[ "$DATA_ONLY" == "true" ]]; then
    OUTFILE="${BACKUP_DIR}/tolom-backup-${TIMESTAMP}-data.sql"
    supabase db dump --data-only -f "$OUTFILE" 2>/dev/null
    echo "  Data backup:     $OUTFILE ($(wc -c < "$OUTFILE") bytes)"
  elif [[ "$SCHEMA_ONLY" == "true" ]]; then
    OUTFILE="${BACKUP_DIR}/tolom-backup-${TIMESTAMP}-schema.sql"
    supabase db dump --schema-only -f "$OUTFILE" 2>/dev/null
    echo "  Schema backup:   $OUTFILE ($(wc -c < "$OUTFILE") bytes)"
  else
    # Full backup: schema + data, compressed
    OUTFILE="${BACKUP_DIR}/tolom-backup-${TIMESTAMP}-full.sql.gz"
    tempfile="$(mktemp)"
    supabase db dump -f "$tempfile" 2>/dev/null
    gzip -c "$tempfile" > "$OUTFILE"
    rm -f "$tempfile"
    echo "  Full backup:     $OUTFILE ($(wc -c < "$OUTFILE") bytes)"
  fi

  echo "  → Local backup complete."
  exit 0
fi

# ── Remote backup (pg_dump) ────────────────────────────────────

if [[ "$MODE" == "remote" ]]; then
  echo "→ Backing up REMOTE database..."

  if ! command -v pg_dump &>/dev/null; then
    echo "ERROR: pg_dump not found — install PostgreSQL client tools."
    exit 1
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL is not set."
    echo "  Set it:  export DATABASE_URL='postgresql://...'"
    exit 1
  fi

  if [[ "$DATA_ONLY" == "true" ]]; then
    OUTFILE="${BACKUP_DIR}/tolom-backup-${TIMESTAMP}-data.sql"
    pg_dump --no-owner --no-acl --data-only --dbname="$DATABASE_URL" -f "$OUTFILE"
    echo "  Data backup:     $OUTFILE ($(wc -c < "$OUTFILE") bytes)"
  elif [[ "$SCHEMA_ONLY" == "true" ]]; then
    OUTFILE="${BACKUP_DIR}/tolom-backup-${TIMESTAMP}-schema.sql"
    pg_dump --no-owner --no-acl --schema-only --dbname="$DATABASE_URL" -f "$OUTFILE"
    echo "  Schema backup:   $OUTFILE ($(wc -c < "$OUTFILE") bytes)"
  else
    OUTFILE="${BACKUP_DIR}/tolom-backup-${TIMESTAMP}-full.sql.gz"
    pg_dump --no-owner --no-acl --dbname="$DATABASE_URL" | gzip > "$OUTFILE"
    echo "  Full backup:     $OUTFILE ($(wc -c < "$OUTFILE") bytes)"
  fi

  echo "  → Remote backup complete."
  exit 0
fi

# ── Unknown mode ───────────────────────────────────────────────

echo "Usage: ./scripts/backup.sh [--remote] [--schema-only] [--data-only] [--prune]"
exit 1
