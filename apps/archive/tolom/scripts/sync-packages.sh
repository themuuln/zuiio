#!/usr/bin/env bash
set -euo pipefail

# Sync tolom's cloned packages back to their original repos.
# Run from tolom/ root.
#
# Usage:
#   ./scripts/sync-packages.sh              # dry-run
#   ./scripts/sync-packages.sh --apply       # sync for real
#   ./scripts/sync-packages.sh <pkg> ...     # specific packages

DRY_RUN=true
if [[ "${1:-}" == "--apply" ]]; then
	DRY_RUN=false
	shift
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

sync_dir() {
	local src="$1" dst="$2"
	if $DRY_RUN; then
		echo "[dry-run] rsync -a --delete '$src' '$dst'"
	else
		echo "Syncing: $src → $dst"
		rsync -a --delete "$src" "$dst"
	fi
}

# Sync workspace packages back to original repos
# Only sync the packages/ subdirectory, not repo-level configs.
sync_dir "$REPO_ROOT/packages/zuiio/packages/" "$REPO_ROOT/../zuiio/packages/"
sync_dir "$REPO_ROOT/packages/zer/packages/" "$REPO_ROOT/../zer/packages/"

if $DRY_RUN; then
	echo ""
	echo "── Dry run — run with --apply to actually sync ──"
fi
