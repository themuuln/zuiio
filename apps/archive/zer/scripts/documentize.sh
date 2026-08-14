#!/bin/bash
# documentize.sh — Documentizer: setup or sync docs for any project
# Usage: ./documentize.sh setup    — Full setup (generate + install deps)
#        ./documentize.sh sync     — Sync docs with git changes (agent-driven)
#        ./documentize.sh sync --check — Silent: 0=up-to-date, 1=changes pending

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
SYNC_DIR=".documentizer"; SYNC_FILE="$SYNC_DIR/sync.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

find_docs_dir() { [ -d "website/docs" ] && echo "website/docs" && return; [ -d "docs" ] && echo "docs" && return; echo ""; }
detect_pm() { [ -f "pnpm-lock.yaml" ] && echo "pnpm" && return; [ -f "yarn.lock" ] && echo "yarn" && return; echo "npm"; }

if ! git rev-parse --git-dir > /dev/null 2>&1; then echo -e "${RED}Not a git repo${NC}"; exit 1; fi
cd "$(git rev-parse --show-toplevel)"

# ── SETUP: Full generation + install ────────────────────────────────────
cmd_setup() {
  local DOCS_DIR="${DOCS_DIR_OVERRIDE:-docs}"
  local SETUP_CMS=false
  # Parse --cms flag from remaining args
  for arg in "$@"; do
    [ "$arg" = "--cms" ] && SETUP_CMS=true
  done
  echo -e "${BLUE}═══ Documentizer Setup ═══${NC}"
  echo ""

  # 1. Copy scripts if not present
  local SCRIPTS_DIR="scripts"
  local TOTAL=5; $SETUP_CMS && TOTAL=6
  if [ ! -f "$SCRIPTS_DIR/documentize.sh" ] && [ -d "$SCRIPT_DIR" ]; then
    echo -e "${BOLD}[1/${TOTAL}] Copying scripts...${NC}"
    mkdir -p "$SCRIPTS_DIR"
    for s in documentize.sh detect-project.sh analyze-structure.sh gen-theme.sh gen-sidebar.sh gen-mermaid.sh gen-content.sh doctor.sh; do
      [ -f "$SCRIPT_DIR/$s" ] && cp "$SCRIPT_DIR/$s" "$SCRIPTS_DIR/" && chmod +x "$SCRIPTS_DIR/$s"
    done
    [ -d "$SCRIPT_DIR/../templates" ] && cp -r "$SCRIPT_DIR/../templates" . 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Scripts ready in ${CYAN}$SCRIPTS_DIR/${NC}"
  fi

  # 2. Initialize sync state
  echo -e "${BOLD}[2/${TOTAL}] Initializing sync state...${NC}"
  mkdir -p "$SYNC_DIR"
  local HEAD=$(git rev-parse HEAD)
  local TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{\n  "lastCodeSyncCommit": "%s",\n  "lastDocsSyncCommit": "%s",\n  "lastSyncTime": "%s",\n  "syncHistory": []\n}\n' "$HEAD" "$HEAD" "$TIME" > "$SYNC_FILE"
  echo -e "  ${GREEN}✓${NC} Sync state at ${HEAD:0:8}"

  # 3. Generate documentation
  echo -e "${BOLD}[3/${TOTAL}] Generating documentation...${NC}"
  if [ -f "$SCRIPTS_DIR/detect-project.sh" ]; then
    bash "$SCRIPTS_DIR/detect-project.sh" /tmp/doc-project.json
    bash "$SCRIPTS_DIR/analyze-structure.sh" /tmp/doc-project.json /tmp/doc-structure.json
    bash "$SCRIPTS_DIR/gen-theme.sh" /tmp/doc-project.json "$DOCS_DIR"
    bash "$SCRIPTS_DIR/gen-sidebar.sh" /tmp/doc-project.json /tmp/doc-structure.json "$DOCS_DIR" /tmp/doc-sidebar.json
    bash "$SCRIPTS_DIR/gen-mermaid.sh" /tmp/doc-project.json /tmp/doc-structure.json "$DOCS_DIR"
    bash "$SCRIPTS_DIR/gen-content.sh" /tmp/doc-project.json /tmp/doc-structure.json "$DOCS_DIR" /tmp/doc-sidebar.json
    # Generate VitePress config
    local SIDEBAR_CONTENT="[]"
    [ -f /tmp/doc-sidebar.json ] && SIDEBAR_CONTENT=$(cat /tmp/doc-sidebar.json)
    mkdir -p "$DOCS_DIR/.vitepress"
    cat > "$DOCS_DIR/.vitepress/config.ts" << CONFIGEOF
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";
const sidebar = $SIDEBAR_CONTENT;
export default withMermaid(
  defineConfig({
    title: "$(node -e "try{console.log(require('/tmp/doc-project.json').projectName)}catch(e){}" 2>/dev/null)",
    description: "$(node -e "try{console.log(require('/tmp/doc-project.json').projectDescription||'Documentation')}catch(e){}" 2>/dev/null)",
    lastUpdated: true,
    mermaid: { theme: "default" },
    themeConfig: {
      nav: [{ text: "Home", link: "/" }, { text: "Getting Started", link: "/getting-started.html" }],
      sidebar: { "/": sidebar },
      socialLinks: [{ icon: "github", link: "$(git remote get-url origin 2>/dev/null || echo '#')" }],
      footer: { message: "Generated with Documentizer", copyright: "\${new Date().getFullYear()} $(node -e "try{console.log(require('/tmp/doc-project.json').projectName)}catch(e){}" 2>/dev/null)" },
    },
  })
);
CONFIGEOF
    local PAGE_COUNT=$(find "$DOCS_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  ${GREEN}✓${NC} ${PAGE_COUNT} pages in ${CYAN}$DOCS_DIR/${NC}"
  else
    echo -e "  ${YELLOW}⚠  Generator scripts not found, skipping${NC}"
  fi

  # 3b. Set up Decap CMS (optional --cms flag)
  if [ "$SETUP_CMS" = "true" ]; then
    cmd_cms_setup "$DOCS_DIR"
  fi

  # 4. Install VitePress
  echo -e "${BOLD}[4/${TOTAL}] Installing VitePress...${NC}"
  local PM=$(detect_pm)
  local HAS_VP=$(node -e "try{const p=require('./package.json');console.log(!!(p.devDependencies||{}).vitepress)}catch(e){}" 2>/dev/null)
  if [ "$HAS_VP" != "true" ]; then
    $PM add -D vitepress@latest vitepress-mermaid-viewer mermaid 2>/dev/null && echo -e "  ${GREEN}✓${NC} VitePress installed" || echo -e "  ${YELLOW}⚠  Install manually: $PM add -D vitepress vitepress-mermaid-viewer mermaid${NC}"
  else
    echo -e "  ${GREEN}✓${NC} Already installed"
  fi

  # 5. Add npm scripts
  echo -e "${BOLD}[5/${TOTAL}] Adding npm scripts...${NC}"
  node -e "
    try {
      const fs=require('fs'),p=JSON.parse(fs.readFileSync('package.json','utf8'));
      p.scripts=p.scripts||{};
      ['docs:dev','docs:build','docs:preview'].forEach(s=>{if(!p.scripts[s])p.scripts[s]='vitepress $([ \"$PM\" = pnpm ] && echo \"run\" || echo \"\") '+s.replace('docs:','')+' $DOCS_DIR';});
      fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
    }catch(e){}
  " 2>/dev/null
  echo -e "  ${GREEN}✓${NC} npm scripts added"

  echo ""; echo -e "${GREEN}═══ Setup Complete ═══${NC}"
  echo ""
  echo -e "  Run ${CYAN}$PM run docs:dev${NC} to preview"
  echo -e "  Run ${CYAN}$PM run docs:build${NC} to build"
  echo -e "  Agent will auto-sync docs after every code change"
  if [ "$SETUP_CMS" = "true" ]; then
    echo ""
    echo -e "  ${BOLD}CMS:${NC} Edit ${CYAN}docs/public/admin/config.yml${NC} to set your GitLab repo and OAuth app ID"
    echo -e "  Then visit ${CYAN}https://your-docs-domain.com/admin/${NC} to log in and edit content"
  fi
  echo ""
}

# ── CMS: Set up Decap CMS for GitLab-backed live editing ──────────────
cmd_cms_setup() {
  local DOCS_DIR="${1:-docs}"
  local ADMIN_DIR="$DOCS_DIR/public/admin"
  mkdir -p "$ADMIN_DIR"

  echo -e "${BOLD}[C/5] Setting up Decap CMS (GitLab)...${NC}"

  # Copy admin files from templates, or generate inline
  local CMS_TEMPLATE="$SCRIPT_DIR/../templates/decap-cms/admin"
  if [ -f "$CMS_TEMPLATE/config.yml" ]; then
    cp "$CMS_TEMPLATE/index.html" "$ADMIN_DIR/" 2>/dev/null || true
    # Use repo URL to pre-fill config if available
    local REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
    local REPO_PATH=""
    if echo "$REMOTE_URL" | grep -qE "gitlab"; then
      REPO_PATH=$(echo "$REMOTE_URL" | sed -E 's|.*[/:]([^/]+/[^/.]+)(\.git)?$|\1|')
    fi
    if [ -n "$REPO_PATH" ]; then
      sed -e "s|GITLAB_GROUP/GITLAB_PROJECT|$REPO_PATH|" \
          "$CMS_TEMPLATE/config.yml" > "$ADMIN_DIR/config.yml"
    else
      cp "$CMS_TEMPLATE/config.yml" "$ADMIN_DIR/"
    fi
    echo -e "  ${GREEN}✓${NC} CMS admin panel at ${CYAN}$ADMIN_DIR/${NC}"
  else
    # Generate inline if template missing
    cat > "$ADMIN_DIR/index.html" << 'HTML'
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
HTML
    local REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
    local REPO_PATH=$(echo "$REMOTE_URL" | sed -E 's|.*[./:]([^/]+/[^/.]+)(\.git)?$|\1|')
    [ -z "$REPO_PATH" ] && REPO_PATH="your-group/your-project"
    cat > "$ADMIN_DIR/config.yml" << YML
backend:
  name: gitlab
  repo: $REPO_PATH
  auth_type: pkce
  app_id: YOUR_GITLAB_OAUTH_APP_ID
  api_root: https://gitlab.com/api/v4
  base_url: https://gitlab.com
  auth_endpoint: oauth/authorize
media_folder: $DOCS_DIR/public/uploads
public_folder: /uploads
locale: en
collections:
  - name: "general"
    label: "General Pages"
    folder: "$DOCS_DIR"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Description", name: "desc", widget: "string", required: false }
      - { label: "Body", name: "body", widget: "markdown" }
  - name: "features"
    label: "Features"
    folder: "$DOCS_DIR/features"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Description", name: "desc", widget: "string", required: false }
      - { label: "Body", name: "body", widget: "markdown" }
YML
    echo -e "  ${GREEN}✓${NC} CMS admin panel generated at ${CYAN}$ADMIN_DIR/${NC}"
  fi

  # Add docs/public to .gitignore
  local GITIGNORE=".gitignore"
  if [ -f "$GITIGNORE" ]; then
    grep -q "docs/public/uploads" "$GITIGNORE" 2>/dev/null || \
      echo -e "\n# Decap CMS uploads\ndocs/public/uploads" >> "$GITIGNORE"
  fi

  echo -e "  ${YELLOW}⚠${NC} Edit ${CYAN}$ADMIN_DIR/config.yml${NC} to set your GitLab OAuth Application ID"
  echo -e "  ${YELLOW}⚠${NC} Create a GitLab OAuth app: Settings > Applications > Add application"
  echo -e "      Redirect URI: https://your-docs-domain.com/admin/"
  echo -e "      Scopes: api | Confidential: NO (unticked)"
  echo ""
}

# ── SYNC: Check git changes and tell agent what to update ──────────────
cmd_sync() {
  local CHECK_ONLY="${1:-false}"
  [ ! -f "$SYNC_FILE" ] && echo -e "${YELLOW}Not set up. Run: $0 setup${NC}" && exit 1

  local LAST_SYNC=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$SYNC_FILE','utf8'));console.log(j.lastCodeSyncCommit)}catch(e){}" 2>/dev/null)
  local HEAD=$(git rev-parse HEAD)

  # Changes since last sync (committed)
  local COMMITTED=""
  [ -n "$LAST_SYNC" ] && [ "$LAST_SYNC" != "$HEAD" ] && COMMITTED=$(git diff --name-only "$LAST_SYNC..HEAD" 2>/dev/null || echo "")

  # Uncommitted changes (working tree + staged)
  local UNCOMMITTED=$(git diff --name-only HEAD 2>/dev/null; git diff --cached --name-only 2>/dev/null)

  # Combine and deduplicate
  local ALL_CHANGES=$( (echo "$COMMITTED"; echo "$UNCOMMITTED") | sort -u | grep -v "^$" || true)

  # Filter to source files only (not docs, not config, not lock files)
  local SRC_CHANGES=$(echo "$ALL_CHANGES" | grep -E "\.(dart|ts|tsx|js|jsx|py|go|rs|swift|kt|java|rb|php|cs|cpp|c|zig)$" 2>/dev/null || true)
  local DOC_CHANGES=$(echo "$ALL_CHANGES" | grep -E "\.md$" 2>/dev/null || true)
  local CONFIG_CHANGES=$(echo "$ALL_CHANGES" | grep -E "package\.json|pubspec\.yaml|Cargo\.toml|go\.mod|pyproject\.toml|composer\.json|Gemfile" 2>/dev/null || true)
  local NEW_FILES=$(echo "$ALL_CHANGES" | grep -v "\.md$" | head -20 || true)

  # Count changes
  local SRC_COUNT=$(echo "$SRC_CHANGES" | wc -l | tr -d ' ')
  local DOCS_DIR=$(find_docs_dir)

  # --check mode: silent exit
  if [ "$CHECK_ONLY" = "true" ]; then
    [ "$SRC_COUNT" -eq 0 ] && exit 0 || exit 1
  fi

  echo -e "${BLUE}═══ Documentizer Sync ═══${NC}"
  echo ""
  echo -e "  Last sync: ${CYAN}$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$SYNC_FILE','utf8'));console.log(j.lastSyncTime.slice(0,10))}catch(e){}" 2>/dev/null)${NC}"
  echo -e "  Last commit: ${CYAN}${HEAD:0:8}${NC}"
  [ -n "$LAST_SYNC" ] && echo -e "  Synced at: ${CYAN}${LAST_SYNC:0:8}${NC}"
  echo ""

  if [ "$SRC_COUNT" -eq 0 ] && [ -z "$CONFIG_CHANGES" ]; then
    echo -e "  ${GREEN}✓ Docs are up to date${NC}"
    exit 0
  fi

  # Group changes into meaningful doc sections
  echo -e "  ${YELLOW}${SRC_COUNT} source file(s) changed${NC}"
  echo ""

  # Map changes to doc sections (machine-readable for the agent)
  echo "{"
  echo "  \"lastSync\": \"$LAST_SYNC\","
  echo "  \"head\": \"$HEAD\","

  # New features/files
  if [ -n "$NEW_FILES" ]; then
    local NEW_APIS=$(echo "$NEW_FILES" | grep -iE "api|route|endpoint|controller" | head -10 || true)
    local NEW_COMPONENTS=$(echo "$NEW_FILES" | grep -iE "component|widget|screen|page" | head -10 || true)
    local NEW_MODELS=$(echo "$NEW_FILES" | grep -iE "model|schema|entity|type" | head -10 || true)
    [ -n "$NEW_APIS" ] && echo "  \"newApis\": $(echo "$NEW_APIS" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"
    [ -n "$NEW_COMPONENTS" ] && echo "  \"newComponents\": $(echo "$NEW_COMPONENTS" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"
    [ -n "$NEW_MODELS" ] && echo "  \"newModels\": $(echo "$NEW_MODELS" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"
  fi

  # Deleted files
  local DELETED=$(git diff --diff-filter=D --name-only "$LAST_SYNC..HEAD" 2>/dev/null | grep -E "\.(dart|ts|tsx|js|jsx|py|go|rs)$" || true)
  [ -n "$DELETED" ] && echo "  \"removed\": $(echo "$DELETED" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"

  # Config changes
  if [ -n "$CONFIG_CHANGES" ]; then
    local DETECTED=$(node -e "
      const fs=require('fs'),c=($(echo "$CONFIG_CHANGES" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null));
      const r={};
      c.forEach(f=>{
        if(f.match(/package\.json/)) r.packageChange=true;
        if(f.match(/pubspec\.yaml/)) r.pubspecChange=true;
        if(f.match(/Cargo\.toml/)) r.cargoChange=true;
      });
      console.log(JSON.stringify(r));
    " 2>/dev/null)
    echo "  \"configChanges\": $DETECTED,"
  fi

  # Framework re-detection if config changed
  echo "  \"reRunDetect\": $(echo "$CONFIG_CHANGES" | wc -l | tr -d ' ' | xargs test 0 -eq && echo false || echo true),"

  # Source files grouped by doc section
  echo "  \"toUpdate\": {"
  local API_FILES=$(echo "$SRC_CHANGES" | grep -iE "api|route|endpoint|controller" || true)
  local COMPONENT_FILES=$(echo "$SRC_CHANGES" | grep -iE "component|widget|screen|page" || true)
  local MODEL_FILES=$(echo "$SRC_CHANGES" | grep -iE "model|schema|entity|type|db" || true)
  [ -n "$API_FILES" ] && echo "    \"api\": $(echo "$API_FILES" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"
  [ -n "$COMPONENT_FILES" ] && echo "    \"components\": $(echo "$COMPONENT_FILES" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"
  [ -n "$MODEL_FILES" ] && echo "    \"models\": $(echo "$MODEL_FILES" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null),"
  echo "    \"other\": $(echo "$SRC_CHANGES" | node -e "const fs=require('fs');const b=fs.readFileSync('/dev/stdin','utf8').trim().split('\n').filter(Boolean);console.log(JSON.stringify(b))" 2>/dev/null)"
  echo "  }"
  echo "}"

  echo ""
  echo -e "  ${BOLD}Agent:${NC} Read git diff, update docs above, then run: ${CYAN}$0 sync --commit${NC}"
}

# ── SYNC --commit: Mark docs as synced ─────────────────────────────────
cmd_sync_commit() {
  [ ! -f "$SYNC_FILE" ] && echo -e "${YELLOW}Not set up${NC}" && exit 1
  local HEAD=$(git rev-parse HEAD)
  node -e "
    const fs=require('fs'),s=JSON.parse(fs.readFileSync('$SYNC_FILE','utf8'));
    s.lastCodeSyncCommit='$HEAD';s.lastDocsSyncCommit='$HEAD';
    s.lastSyncTime=new Date().toISOString();
    s.syncHistory=s.syncHistory||[];
    s.syncHistory.unshift({codeCommit:'$HEAD',docsCommit:'$HEAD',time:new Date().toISOString()});
    if(s.syncHistory.length>50)s.syncHistory=s.syncHistory.slice(0,50);
    fs.writeFileSync('$SYNC_FILE',JSON.stringify(s,null,2));
  " 2>/dev/null
  echo -e "${GREEN}✓${NC} Sync marker updated to ${HEAD:0:8}"
}

# ── Help ──────────────────────────────────────────────────────────────
cmd_help() {
  echo "Documentizer — setup and sync documentation for any project"; echo ""
  echo "Usage:"
  echo "  $0 setup            Full setup: copy scripts, detect project, generate docs, install VitePress"
  echo "  $0 setup --cms      Full setup + Decap CMS (GitLab-backed live editing for BAs)"
  echo "  $0 setup --docs website/docs  Use custom docs directory"
  echo "  $0 cms              Add Decap CMS admin panel to existing docs site"
  echo "  $0 sync             Show what changed since last sync (for agent to update docs)"
  echo "  $0 sync --check     Silent: exit 0=up-to-date, 1=changes pending"
  echo "  $0 sync --commit    Mark current HEAD as synced (run after agent updates docs)"
  echo "  $0 help             Show this"; echo ""
}

case "${1:-}" in
  setup)  shift; cmd_setup "$@" ;;
  cms)    cmd_cms_setup "${2:-docs}" ;;
  sync)
    case "${2:-}" in
      --check) cmd_sync "true" ;;
      --commit) cmd_sync_commit ;;
      "")       cmd_sync ;;
      *)        echo -e "${RED}Unknown: sync $2${NC}"; cmd_help; exit 1 ;;
    esac ;;
  help|--help|-h) cmd_help ;;
  "")   [ -f "$SYNC_FILE" ] && cmd_sync || cmd_help ;;
  *)    echo -e "${RED}Unknown: $1${NC}"; cmd_help; exit 1 ;;
esac
