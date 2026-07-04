#!/bin/bash
# Documentizer — Setup Doctor
# Usage: ./doctor.sh [--fix] [--quick]

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
PASS=0; WARN=0; FAIL=0; FIXED=0

detect_pm() {
  [ -f "pnpm-lock.yaml" ] && echo "pnpm" && return
  [ -f "yarn.lock" ] && echo "yarn" && return
  echo "npm"
}

check() {
  local name="$1" result="$2" detail="$3"
  case "$result" in
    pass) echo -e "  ${GREEN}✓${NC} $name"; [ -n "$detail" ] && echo -e "    ${CYAN}$detail${NC}"; PASS=$((PASS + 1)) ;;
    warn) echo -e "  ${YELLOW}⚠${NC} $name"; [ -n "$detail" ] && echo -e "    ${YELLOW}$detail${NC}"; WARN=$((WARN + 1)) ;;
    fail) echo -e "  ${RED}✗${NC} $name"; [ -n "$detail" ] && echo -e "    ${RED}$detail${NC}"; FAIL=$((FAIL + 1)) ;;
  esac
}

fix() {
  local name="$1" result="$2" detail="$3"
  case "$result" in
    fixed) echo -e "  ${GREEN}🔧${NC} $name"; [ -n "$detail" ] && echo -e "    ${CYAN}$detail${NC}"; FIXED=$((FIXED + 1)) ;;
    skip)  echo -e "  ${YELLOW}⏭${NC} $name"; [ -n "$detail" ] && echo -e "    ${YELLOW}$detail${NC}" ;;
  esac
}

FIX_MODE=false; QUICK_MODE=false
for arg in "$@"; do
  case "$arg" in --fix) FIX_MODE=true ;; --quick) QUICK_MODE=true ;; esac
done

echo ""; echo -e "${BLUE}  Documentizer Doctor${NC}"; echo ""

# 1. Git
if git rev-parse --git-dir > /dev/null 2>&1; then
  PROJECT_ROOT=$(git rev-parse --show-toplevel)
  check "Git repository" "pass" "Root: $PROJECT_ROOT"
else
  check "Git repository" "fail" "Not a git repo"; echo -e "${RED}Cannot continue.${NC}"; exit 1
fi
cd "$PROJECT_ROOT"

# 2. .documentizer
[ -d ".documentizer" ] && check ".documentizer directory" "pass" || {
  check ".documentizer directory" "fail" "Missing"
  $FIX_MODE && mkdir -p .documentizer && fix "Created .documentizer/" "fixed"
}

# 3. sync.json
if [ -f ".documentizer/sync.json" ]; then
  LAST_SYNC=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.documentizer/sync.json')).lastCodeSyncCommit)" 2>/dev/null)
  check "sync.json" "pass" "Last sync: ${LAST_SYNC:0:8}"
else
  check "sync.json" "fail" "Missing"
  if $FIX_MODE; then
    HEAD=$(git rev-parse HEAD); TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{\n  "lastCodeSyncCommit": "%s",\n  "lastDocsSyncCommit": "%s",\n  "lastSyncTime": "%s",\n  "syncHistory": []\n}\n' "$HEAD" "$HEAD" "$TIME" > .documentizer/sync.json
    fix "Created sync.json" "fixed"
  fi
fi

# 4. config.json
[ -f ".documentizer/config.json" ] && check "config.json" "pass" || {
  check "config.json" "warn" "Using defaults"
  if $FIX_MODE; then
    printf '{\n  "ignore": ["node_modules", "*.test.*", "dist", ".git", "*.lock"],\n  "fileMapping": {"lib/**": "website/docs/features/", "src/**": "docs/features/"},\n  "autoCreateDocFor": ["lib/**", "src/**"],\n  "skipDocUpdateFor": ["*.lock", "*.env"]\n}\n' > .documentizer/config.json
    fix "Created config.json" "fixed"
  fi
}

# 5. Docs dir
DOCS_DIR=""
if [ -d "website/docs" ]; then DOCS_DIR="website/docs"; check "Docs directory" "pass" "website/docs/"
elif [ -d "docs" ]; then DOCS_DIR="docs"; check "Docs directory" "pass" "docs/"
else
  check "Docs directory" "fail" "No docs/"
  $FIX_MODE && mkdir -p website/docs && DOCS_DIR="website/docs" && fix "Created website/docs/" "fixed"
fi

# 6. VitePress config
[ -n "$DOCS_DIR" ] && [ -f "$DOCS_DIR/.vitepress/config.ts" ] && check "VitePress config" "pass" || check "VitePress config" "warn" "Not found"

# 7. VitePress theme
[ -n "$DOCS_DIR" ] && [ -f "$DOCS_DIR/.vitepress/theme/index.ts" ] && check "VitePress theme" "pass" || check "VitePress theme" "warn" "Not found"

# 8. VitePress dep
PM=$(detect_pm)
if grep -q '"vitepress"' package.json 2>/dev/null || grep -q '"vitepress"' website/package.json 2>/dev/null; then
  check "VitePress dependency" "pass"
else
  check "VitePress dependency" "fail" "Not in package.json"
  $FIX_MODE && $PM add -D vitepress@^1.6.4 vitepress-mermaid-viewer mermaid 2>/dev/null && fix "Installed vitepress" "fixed" || fix "Install failed" "skip"
fi

# 9. npm scripts
PKG="package.json"; [ -f "website/package.json" ] && PKG="website/package.json"
HAS_ALL=true
grep -q '"docs:dev"' "$PKG" 2>/dev/null || HAS_ALL=false
grep -q '"docs:build"' "$PKG" 2>/dev/null || HAS_ALL=false
grep -q '"docs:preview"' "$PKG" 2>/dev/null || HAS_ALL=false

if $HAS_ALL; then check "npm scripts" "pass"
else
  check "npm scripts" "warn" "Missing docs:dev/build/preview"
  if $FIX_MODE; then
    node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('$PKG','utf8'));p.scripts=p.scripts||{};if(!p.scripts['docs:dev'])p.scripts['docs:dev']='vitepress dev';if(!p.scripts['docs:build'])p.scripts['docs:build']='vitepress build';if(!p.scripts['docs:preview'])p.scripts['docs:preview']='vitepress preview';fs.writeFileSync('$PKG',JSON.stringify(p,null,2)+'\n');" 2>/dev/null && fix "Added npm scripts" "fixed" || fix "Failed" "skip"
  fi
fi

# 10. Post-commit hook
HOOK_PATH=".git/hooks/post-commit"
if [ -f "$HOOK_PATH" ] && grep -q "quick-check\|documentize" "$HOOK_PATH" 2>/dev/null; then
  check "Post-commit hook" "pass"
else
  check "Post-commit hook" "warn" "Not installed"
fi

# 11. Sync health
if [ -f ".documentizer/sync.json" ]; then
  SRC_BEHIND=$(./scripts/quick-check.sh 2>/dev/null || echo "0")
  [ "$SRC_BEHIND" = "0" ] && check "Sync health" "pass" "Up to date" || check "Sync health" "warn" "$SRC_BEHIND commit(s) behind"
fi

# 12. .gitignore
if [ -f ".gitignore" ]; then
  grep -q "vitepress/cache" .gitignore 2>/dev/null && check ".gitignore" "pass" || check ".gitignore" "warn" "Missing vitepress entries"
else
  check ".gitignore" "warn" "No .gitignore"
  $FIX_MODE && echo -e "\n# VitePress\nwebsite/docs/.vitepress/cache\nwebsite/docs/.vitepress/dist" >> .gitignore && fix "Added gitignore" "fixed"
fi

# 13. Decap CMS
DOCS_DIR=""
[ -d "website/docs" ] && DOCS_DIR="website/docs"
[ -z "$DOCS_DIR" ] && [ -d "docs" ] && DOCS_DIR="docs"
if [ -n "$DOCS_DIR" ]; then
  if [ -f "$DOCS_DIR/public/admin/config.yml" ]; then
    HAS_GITLAB=$(grep -c "gitlab" "$DOCS_DIR/public/admin/config.yml" 2>/dev/null || echo "0")
    if [ "$HAS_GITLAB" -gt 0 ]; then
      APP_ID=$(grep "app_id:" "$DOCS_DIR/public/admin/config.yml" | grep -v "YOUR_GITLAB" | wc -l | tr -d ' ')
      if [ "$APP_ID" -gt 0 ]; then
        check "Decap CMS (GitLab)" "pass" "Configured — admin panel ready"
      else
        check "Decap CMS (GitLab)" "warn" "Config needs OAuth app_id — edit $DOCS_DIR/public/admin/config.yml"
      fi
    else
      check "Decap CMS" "pass" "Admin panel present"
    fi
  else
    check "Decap CMS" "warn" "Not installed — run: ./scripts/documentize.sh cms"
  fi
fi

# Summary
echo ""; echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo ""
$QUICK_MODE && [ "$FAIL" -eq 0 ] && exit 0
$QUICK_MODE && exit 1

echo -e "  ${GREEN}✓ $PASS passed${NC}  ${YELLOW}⚠ $WARN warnings${NC}  ${RED}✗ $FAIL failed${NC}"
$FIX_MODE && [ "$FIXED" -gt 0 ] && echo -e "  ${GREEN}🔧 $FIXED fixed${NC}"
echo ""

[ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ] && echo -e "${GREEN}  All checks passed.${NC}" && exit 0
[ "$FAIL" -eq 0 ] && echo -e "${YELLOW}  Functional with $WARN warning(s).${NC}" && exit 0
echo -e "${RED}  $FAIL critical issue(s).${NC}"
$FIX_MODE || echo -e "  Run ${CYAN}./scripts/doctor.sh --fix${NC}"
exit 1
