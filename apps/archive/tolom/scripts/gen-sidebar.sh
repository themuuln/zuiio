#!/bin/bash
# gen-sidebar.sh — Generate adaptive VitePress sidebar from project structure
# Pure bash. Reads project+structure JSON, outputs sidebar config.

PROJECT_JSON="${1:-/tmp/doc-project.json}"
STRUCTURE_JSON="${2:-/tmp/doc-structure.json}"
DOCS_DIR="${3:-docs}"
OUT="${4:-/tmp/doc-sidebar.json}"

[ ! -f "$PROJECT_JSON" ] && echo "gen-sidebar.sh: No project data" && exit 1
[ ! -f "$STRUCTURE_JSON" ] && echo "gen-sidebar.sh: No structure data" && exit 1

PRIMARY_FRAMEWORK=$(node -e "try{console.log(require('$PROJECT_JSON').primaryFramework)}catch(e){}" 2>/dev/null)
STRUCTURE_TYPE=$(node -e "try{console.log(require('$PROJECT_JSON').structureType)}catch(e){}" 2>/dev/null)
HAS_API=$(node -e "try{console.log(require('$PROJECT_JSON').hasApiRoutes)}catch(e){}" 2>/dev/null)
HAS_DB=$(node -e "try{console.log(require('$PROJECT_JSON').hasDatabase)}catch(e){}" 2>/dev/null)
HAS_COMPONENTS=$(node -e "try{console.log(require('$PROJECT_JSON').hasComponents)}catch(e){}" 2>/dev/null)
HAS_TESTS=$(node -e "try{console.log(require('$PROJECT_JSON').hasTests)}catch(e){}" 2>/dev/null)
FEATURES=$(node -e "try{console.log(JSON.stringify(require('$PROJECT_JSON').features))}catch(e){}" 2>/dev/null)

# ── Detect existing doc pages ──────────────────────────────────────────
detect_pages() {
  local dir="$1"
  find "$DOCS_DIR" -maxdepth 3 -name "*.md" -not -path "*/node_modules/*" 2>/dev/null | sort
}
PAGES=$(detect_pages)

has_page() { echo "$PAGES" | grep -q "$1"; }
page_link() {
  local p="$1"
  # Convert docs/path/file.md -> /path/file.html
  echo "$p" | sed "s|^$DOCS_DIR||" | sed 's/\.md$/.html/'
}

# ── Build sidebar sections based on framework ──────────────────────────
SIDEBAR=""

add_section() {
  local title="$1" link="$2" items="$3"
  [ -n "$SIDEBAR" ] && SIDEBAR+=","
  if [ -n "$items" ]; then
    SIDEBAR+="{\"text\":$(printf '%s' "$title" | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null),\"items\":[$items]}"
  elif [ -n "$link" ]; then
    SIDEBAR+="{\"text\":$(printf '%s' "$title" | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null),\"link\":$(printf '%s' "$link" | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null)}"
  fi
}

add_item() {
  local text="$1" link="$2"
  [ -n "$ITEMS" ] && ITEMS+=","
  ITEMS+="{\"text\":$(printf '%s' "$text" | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null),\"link\":$(printf '%s' "$link" | python3 -c "import sys,json;print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null)}"
}

# ── Framework-specific sidebar structure ──────────────────────────────

case "$PRIMARY_FRAMEWORK" in
  "Next.js")
    # Getting Started
    ITEMS=""; add_item "Installation" "/installation.html"; add_item "Quick Start" "/getting-started.html"
    add_section "Getting Started" "" "$ITEMS"
    # Architecture
    ITEMS=""; add_item "Overview" "/architecture.html"
    has_page "architecture/app-router" && add_item "App Router" "/architecture/app-router.html"
    has_page "architecture/data-flow" && add_item "Data Flow" "/architecture/data-flow.html"
    add_section "Architecture" "" "$ITEMS"
    # Routes
    ITEMS=""; add_item "Overview" "/routes/"
    has_page "routes/pages" && add_item "Pages" "/routes/pages.html"
    has_page "routes/api" && add_item "API Routes" "/routes/api.html"
    has_page "routes/middleware" && add_item "Middleware" "/routes/middleware.html"
    add_section "Routes" "" "$ITEMS"
    [ "$HAS_COMPONENTS" = "true" ] && {
      ITEMS=""; add_item "Overview" "/components/"
      add_section "Components" "" "$ITEMS"
    }
    $HAS_API && {
      ITEMS=""; add_item "Overview" "/api/"; add_section "API Reference" "" "$ITEMS"
    }
    $HAS_DB && {
      ITEMS=""; add_item "Schema" "/database/schema.html"; add_item "Queries" "/database/queries.html"
      add_section "Database" "" "$ITEMS"
    }
    ITEMS=""; add_item "Environment" "/deployment/environment.html"
    has_page "deployment/docker" && add_item "Docker" "/deployment/docker.html"
    add_section "Deployment" "" "$ITEMS"
    ;;

  "Flutter")
    ITEMS=""; add_item "Installation" "/installation.html"; add_item "Quick Start" "/getting-started.html"
    add_section "Getting Started" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/architecture.html"
    add_item "Project Structure" "/architecture/structure.html"
    add_item "State Management" "/architecture/state-management.html"
    add_item "Navigation" "/architecture/navigation.html"
    add_section "Architecture" "" "$ITEMS"
    [ "$HAS_COMPONENTS" = "true" ] && {
      ITEMS=""; add_item "Overview" "/features/"
      add_section "Features" "" "$ITEMS"
    }
    ITEMS=""; add_item "Models" "/data-layer/models.html"
    add_item "Repositories" "/data-layer/repositories.html"
    add_item "Data Sources" "/data-layer/data-sources.html"
    add_section "Data Layer" "" "$ITEMS"
    ITEMS=""; add_item "Testing" "/testing/"; add_section "Testing" "" "$ITEMS"
    ITEMS=""; add_item "Build & Release" "/deployment/build.html"
    add_section "Deployment" "" "$ITEMS"
    ;;

  "Django"|"FastAPI"|"Flask")
    ITEMS=""; add_item "Installation" "/installation.html"; add_item "Quick Start" "/getting-started.html"
    add_section "Getting Started" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/architecture.html"
    add_section "Architecture" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/api/"; add_section "API Reference" "" "$ITEMS"
    ITEMS=""; add_item "Models" "/data-layer/models.html"; add_section "Data Layer" "" "$ITEMS"
    ITEMS=""; add_item "Testing" "/testing/"; add_section "Testing" "" "$ITEMS"
    ITEMS=""; add_item "Deployment" "/deployment/"; add_section "Deployment" "" "$ITEMS"
    ;;

  "Rails"|"Laravel"|"Spring Boot")
    ITEMS=""; add_item "Installation" "/installation.html"; add_item "Quick Start" "/getting-started.html"
    add_section "Getting Started" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/architecture.html"
    add_section "Architecture" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/api/"; add_section "API Reference" "" "$ITEMS"
    ITEMS=""; add_item "Models" "/data-layer/models.html"; add_item "Migrations" "/data-layer/migrations.html"
    add_section "Data Layer" "" "$ITEMS"
    ITEMS=""; add_item "Testing" "/testing/"; add_section "Testing" "" "$ITEMS"
    ITEMS=""; add_item "Deployment" "/deployment/"; add_section "Deployment" "" "$ITEMS"
    ;;

  "Go"|"Rust"|"Python"|"Node.js")
    ITEMS=""; add_item "Installation" "/installation.html"; add_item "Quick Start" "/getting-started.html"
    add_section "Getting Started" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/architecture.html"; add_section "Architecture" "" "$ITEMS"
    ITEMS=""; add_item "Overview" "/api/"; add_section "API Reference" "" "$ITEMS"
    $HAS_DB && { ITEMS=""; add_item "Schema" "/database/schema.html"; add_section "Database" "" "$ITEMS"; }
    $HAS_TESTS && { ITEMS=""; add_item "Testing" "/testing/"; add_section "Testing" "" "$ITEMS"; }
    ITEMS=""; add_item "Deployment" "/deployment/"; add_section "Deployment" "" "$ITEMS"
    ;;

  *)
    # Generic sidebar for unknown/unrecognized projects
    ITEMS=""; add_item "Introduction" "/"; add_item "Getting Started" "/getting-started.html"
    add_section "Getting Started" "" "$ITEMS"
    has_page "architecture" && { ITEMS=""; add_item "Overview" "/architecture.html"; add_section "Architecture" "" "$ITEMS"; }
    ITEMS=""; add_item "Project Structure" "/project-structure.html"
    add_section "Codebase" "" "$ITEMS"
    $HAS_TESTS && { ITEMS=""; add_item "Overview" "/testing/"; add_section "Testing" "" "$ITEMS"; }
    ITEMS=""; add_item "Configuration" "/configuration.html"; add_item "Deployment" "/deployment/"
    add_section "Operations" "" "$ITEMS"
    ;;
esac

# Add features section if any were detected
if [ "$FEATURES" != "[]" ] && [ "$FEATURES" != "" ]; then
  ITEMS=""
  IFS=',' read -ra F <<< "$(echo "$FEATURES" | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));j.forEach(f=>console.log(f))" 2>/dev/null || true)"
  for feature in "${F[@]}"; do
    [ -n "$feature" ] && add_item "$(echo "$feature" | sed 's/^"//;s/"$//' | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')" "/features/$(echo "$feature" | tr -d '"').html"
  done
  add_section "Features" "" "$ITEMS"
fi

SIDEBAR="[$SIDEBAR]"
[ "$SIDEBAR" = "[]" ] && SIDEBAR='[{"text":"Pages","items":[{"text":"Home","link":"/"}]}]'

echo "$SIDEBAR" > "$OUT"
echo "gen-sidebar.sh: -> $OUT ($PRIMARY_FRAMEWORK)"
