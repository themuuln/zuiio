#!/usr/bin/env bash
# loc-badge.sh — generate shields.io endpoint badge + per-project LOC stats.
#
# Outputs (committed to the website so Vercel serves them publicly):
#   apps/website/public/loc.json          — shields.io endpoint badge payload
#   apps/website/public/loc-projects.json — per-project breakdown (for future pages)
#
# Requires: tokei (brew install tokei; CI installs via cargo-quickinstall).
# Counts code lines only, excluding JSON data files (consistent with repo convention).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/apps/website/public"
mkdir -p "$OUT_DIR"

if ! command -v tokei >/dev/null 2>&1; then
  echo "ERROR: tokei not found. Install with: brew install tokei" >&2
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# One full scan, JSON excluded. "Total" key in tokei output double-counts — drop it.
# Run with `.` so report names are repo-relative (passing an absolute path prefixes them).
# NOTE: tokei nests embedded languages (CSS/JS inside HTML) as `children` — a plain
# top-level sum misses ~118k lines, so recurse into children.
cd "$ROOT"
tokei --exclude '*.json' --output json . > "$TMP"

# Recursive code/comment/blank sums over languages AND their embedded children.
TOTAL_CODE="$(jq -r '
  def code_sum: .code + ([.children // {} | to_entries[] | .value[]?.stats.code] | add);
  del(.Total) | [.[] | code_sum] | add
' "$TMP")"
TOTAL_FILES="$(jq -r '
  def file_count: (.reports | length) + ([.children // {} | to_entries[] | .value | length] | add);
  del(.Total) | [.[] | file_count] | add
' "$TMP")"
TOTAL_LINES="$(jq -r '
  def line_sum: (.code + .comments + .blanks) + ([.children // {} | to_entries[] | .value[]?.stats | (.code + .comments + .blanks)] | add);
  del(.Total) | [.[] | line_sum] | add
' "$TMP")"
GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Compact badge message: 1.08M / 364k / 12
fmt() {
  local n="$1"
  if [ "$n" -ge 1000000 ]; then
    awk -v n="$n" 'BEGIN { printf "%.2fM", n / 1000000 }'
  elif [ "$n" -ge 1000 ]; then
    awk -v n="$n" 'BEGIN { printf "%.1fk", n / 1000 }'
  else
    printf '%s' "$n"
  fi
}
MESSAGE="$(fmt "$TOTAL_CODE")"

# --- shields.io endpoint badge (https://img.shields.io/endpoint?url=...) ---
jq -n \
  --arg label "code lines" \
  --arg message "$MESSAGE" \
  '{schemaVersion: 1, label: $label, message: $message, color: "blue", isError: false}' \
  > "$OUT_DIR/loc.json"

# --- per-project breakdown ---
jq -n \
  --argjson totalCode "$TOTAL_CODE" \
  --argjson totalFiles "$TOTAL_FILES" \
  --argjson totalLines "$TOTAL_LINES" \
  --arg generatedAt "$GENERATED_AT" \
  --slurpfile scan "$TMP" '
    def project:
      (.name | sub("^\\./"; "")) as $p
      | ($p | split("/")) as $parts
      | if ($parts | length) >= 2 then $parts[0] + "/" + $parts[1]
        elif ($parts | length) == 1 then $parts[0]
        else "root" end;
    $scan[0]
    | del(.Total)
    # Flatten top-level reports AND embedded-child reports (CSS/JS in HTML) into one list.
    | [.[] | .reports[]?] + [.[] | .children // {} | to_entries[] | .value[]?]
    | map({name: (.name | sub("^\\./"; "")), code: .stats.code})
    | group_by(project)
    | map({
        project: (.[0].name | sub("^\\./"; "") | split("/") as $p | if ($p | length) >= 2 then $p[0] + "/" + $p[1] else $p[0] end),
        files: length,
        code: (map(.code) | add)
      })
    | sort_by(-.code)
    | {generatedAt: $generatedAt, total: {files: $totalFiles, lines: $totalLines, code: $totalCode}, projects: .}
  ' > "$OUT_DIR/loc-projects.json"

echo "loc.json:        $MESSAGE code lines ($TOTAL_FILES files)"
echo "loc-projects.json: $(jq -r '.projects | length' "$OUT_DIR/loc-projects.json") projects"
