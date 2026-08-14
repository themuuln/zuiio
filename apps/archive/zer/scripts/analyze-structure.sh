#!/bin/bash
# analyze-structure.sh — Deep codebase structure analysis
# Scans directory tree, counts files by type, maps key directories.
# Pure bash + minimal find/grep. Outputs structured JSON.

set -e
PROJECT_JSON="${1:-/tmp/doc-project.json}"
OUT="${2:-/tmp/doc-structure.json}"
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$PROJECT_ROOT"

# Load project detection data if available
if [ -f "$PROJECT_JSON" ]; then
  PRIMARY_LANG=$(node -e "try{console.log(require('$PROJECT_JSON').primaryLanguage)}catch(e){}" 2>/dev/null)
  PRIMARY_FRAMEWORK=$(node -e "try{console.log(require('$PROJECT_JSON').primaryFramework)}catch(e){}" 2>/dev/null)
fi

# ── Helper: find with prune (avoids node_modules, .git, etc.) ────────
# Uses prunelist to skip common generated/vendor directories for speed.
prunefind() {
  local depth=""
  # Extract -maxdepth N if present
  case "$1" in -maxdepth) depth="$1 $2"; shift 2;; esac
  find . $depth \( -name node_modules -o -name .git -o -name dist -o -name build -o -name vendor -o -name .next -o -name target -o -name .dart_tool -o -name coverage -o -name .cache -o -name .trunk -o -name out -o -name .output -o -name .vercel -o -name "*.generated.*" \) -prune -o "$@"
}

# ── Helpers ───────────────────────────────────────────────────────────
count_ext() { prunefind -type f -name "*.$1" 2>/dev/null | wc -l | tr -d ' '; }
find_dirs() { prunefind -maxdepth 4 -type d -print 2>/dev/null | head -200; }

# ── 1. File Counts by Extension ───────────────────────────────────────
# macOS bash 3.2 compatible (no associative arrays)
EXT_JSON=""
EXTS=$(prunefind -type f -print 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -30)
while read -r count ext; do
  [ -z "$ext" ] && continue
  [ -n "$EXT_JSON" ] && EXT_JSON+=","
  EXT_JSON+="\"$ext\": $count"
done <<< "$EXTS"

# ── 2. Source Files ───────────────────────────────────────────────────
SRC_FILES=$(prunefind -type f \( -name "*.dart" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.kt" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.cs" -o -name "*.cpp" -o -name "*.c" -o -name "*.zig" \) -print 2>/dev/null | wc -l | tr -d ' ')

# ── 3. Key Directory Contents ──────────────────────────────────────────
map_dir() {
  local dir="$1" label="$2"
  [ ! -d "$dir" ] && return
  local files=$(find "$dir" -type f -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
  [ "$files" -gt 0 ] && echo "\"$label\": {\"path\":\"$dir\",\"files\":$files,\"subdirs\":$(find "$dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')}"
}
DIRS_JSON=""
for pair in \
  "src:src" "lib:lib" "app:app" "components:components" "src/components:src/components" \
  "lib/components:lib/components" "api:api" "src/api:src/api" "app/api:app/api" \
  "src/app/api:src/app/api" "pages:pages" "src/pages:src/pages" \
  "tests:test" "src/__tests__:src/__tests__" "spec:spec" \
  "prisma:prisma" "db:db" "src/db:src/db" "lib/db:lib/db" \
  "models:models" "src/models:src/models" "lib/models:lib/models" \
  "types:types" "src/types:src/types" "lib/types:lib/types" \
  "utils:utils" "src/utils:src/utils" "lib/utils:lib/utils" \
  "hooks:hooks" "src/hooks:src/hooks" "lib/hooks:lib/hooks" \
  "config:config" "src/config:src/config" "lib/config:lib/config" \
  "middleware:middleware" "src/middleware:src/middleware" \
  "routes:routes" "src/routes:src/routes" \
  "assets:assets" "public:public" "static:static" \
  "styles:styles" "src/styles:src/styles" \
  "features:lib/features" "src/features:src/features" \
  "data:lib/data" "domain:lib/domain" "presentation:lib/presentation"; do
  label="${pair%%:*}"
  path="${pair#*:}"
  result=$(map_dir "$path" "$label")
  [ -n "$result" ] && DIRS_JSON+="$result," && continue 2
done
DIRS_JSON="${DIRS_JSON%,}"
[ -z "$DIRS_JSON" ] && DIRS_JSON="\"root\": {\"path\":\".\",\"files\":$SRC_FILES}"

# ── 4. Top-level File Listing ──────────────────────────────────────────
TOP_FILES=$(ls -1 *.json *.yaml *.yml *.toml *.cfg *.md Dockerfile docker-compose* Makefile 2>/dev/null | head -30 | paste -sd, -)
[ -n "$TOP_FILES" ] && TOP_FILES="\"$TOP_FILES\""

# ── 5. Framework-Specific Analysis ────────────────────────────────────
ROUTES="[]"
COMPONENTS="[]"
MODELS="[]"
API_ENDPOINTS="[]"

case "$PRIMARY_FRAMEWORK" in
  "Next.js"|"Nuxt.js"|"Astro"|"SvelteKit")
    ROUTES=$(prunefind -maxdepth 5 -type f \( -name "page.tsx" -o -name "page.jsx" -o -name "page.js" -o -name "route.ts" -o -name "route.js" -o -name "layout.tsx" -o -name "layout.jsx" \) -print 2>/dev/null | head -30 | node -e "
      const fs=require('fs'),r=[];let b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);
      b.forEach(p=>{const m=p.match(/page\.(tsx|jsx|js)$/)?'page':p.match(/route\.(ts|js)$/)?'api':p.match(/layout\.(tsx|jsx)$/)?'layout':'other';r.push({path:p,type:m})});
      console.log(JSON.stringify(r));
    " 2>/dev/null || echo "[]")
    ;;
  "Flutter")
    MODELS=$(find lib -name "*.dart" -not -path "*/generated/*" 2>/dev/null | head -30 | node -e "
      const fs=require('fs'),r=[];let b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);
      b.forEach(p=>{r.push({path:p})});console.log(JSON.stringify(r));
    " 2>/dev/null || echo "[]")
    COMPONENTS=$(find lib -name "*widget*.dart" -o -name "*screen*.dart" -o -name "*page*.dart" 2>/dev/null | head -30 | node -e "
      const fs=require('fs'),r=[];let b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);
      b.forEach(p=>{r.push({path:p})});console.log(JSON.stringify(r));
    " 2>/dev/null || echo "[]")
    ;;
  "Django")
    MODELS=$(prunefind -maxdepth 4 -name "models.py" -print 2>/dev/null | head -20 | node -e "
      const fs=require('fs'),r=[];let b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);
      b.forEach(p=>{r.push({path:p})});console.log(JSON.stringify(r));
    " 2>/dev/null || echo "[]")
    API_ENDPOINTS=$(prunefind -maxdepth 4 \( -name "urls.py" -o -name "views.py" -o -name "serializers.py" \) -print 2>/dev/null | head -20 | node -e "
      const fs=require('fs'),r=[];let b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);
      b.forEach(p=>{r.push({path:p})});console.log(JSON.stringify(r));
    " 2>/dev/null || echo "[]")
    ;;
esac

# ── 6. Directory Tree (compact) ────────────────────────────────────────
TREE=$(prunefind -maxdepth 3 -type d -print 2>/dev/null | sort | head -80 | node -e "
  const fs=require('fs'),r=[];let b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);
  b.forEach(p=>{const d=p.replace('./','');const lvl=d.split('/').length;r.push({path:d,level:lvl})});
  console.log(JSON.stringify(r));
" 2>/dev/null || echo "[]")

# ── 7. Count test files ──────────────────────────────────────────────
TEST_COUNT=$(prunefind -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.dart" -o -name "test_*.py" \) -print 2>/dev/null | wc -l | tr -d ' ')

# ── 8. Output JSON ──────────────────────────────────────────────────────
cat > "$OUT" << JSONEOF
{
  "totalSourceFiles": $SRC_FILES,
  "testFiles": $TEST_COUNT,
  "fileCounts": {${EXT_JSON}},
  "directories": {$DIRS_JSON},
  "tree": $TREE,
  "routes": $ROUTES,
  "components": $COMPONENTS,
  "models": $MODELS,
  "apiEndpoints": $API_ENDPOINTS,
  "topLevelConfigs": [$TOP_FILES]
}
JSONEOF
echo "analyze-structure.sh: -> $OUT"
