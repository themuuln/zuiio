#!/bin/bash
# gen-content.sh — Generate documentation content from project analysis
# Uses templates + detected data to produce markdown files.
# Minimizes agent involvement — pure bash for structural docs.

PROJECT_JSON="${1:-/tmp/doc-project.json}"
STRUCTURE_JSON="${2:-/tmp/doc-structure.json}"
DOCS_DIR="${3:-docs}"
SIDEBAR_JSON="${4:-/tmp/doc-sidebar.json}"

[ ! -f "$PROJECT_JSON" ] && echo "gen-content.sh: No project data" && exit 1
[ ! -f "$STRUCTURE_JSON" ] && echo "gen-content.sh: No structure data" && exit 1

# ── Load data ───────────────────────────────────────────────────────────
PROJECT_NAME=$(node -e "try{console.log(require('$PROJECT_JSON').projectName)}catch(e){}" 2>/dev/null)
PROJECT_VERSION=$(node -e "try{console.log(require('$PROJECT_JSON').projectVersion)}catch(e){}" 2>/dev/null)
PROJECT_DESC=$(node -e "try{console.log(require('$PROJECT_JSON').projectDescription)}catch(e){}" 2>/dev/null)
PRIMARY_LANG=$(node -e "try{console.log(require('$PROJECT_JSON').primaryLanguage)}catch(e){}" 2>/dev/null)
PRIMARY_FRAMEWORK=$(node -e "try{console.log(require('$PROJECT_JSON').primaryFramework)}catch(e){}" 2>/dev/null)
PKG_MANAGER=$(node -e "try{console.log(require('$PROJECT_JSON').packageManager)}" 2>/dev/null)
BUILD_CMD=$(node -e "try{console.log(require('$PROJECT_JSON').buildCommand)}catch(e){}" 2>/dev/null)
DEV_CMD=$(node -e "try{console.log(require('$PROJECT_JSON').devCommand)}catch(e){}" 2>/dev/null)
TEST_CMD=$(node -e "try{console.log(require('$PROJECT_JSON').testCommand)}catch(e){}" 2>/dev/null)
STRUCTURE_TYPE=$(node -e "try{console.log(require('$PROJECT_JSON').structureType)}catch(e){}" 2>/dev/null)
HAS_DB=$(node -e "try{console.log(require('$PROJECT_JSON').hasDatabase)}catch(e){}" 2>/dev/null)
HAS_DOCKER=$(node -e "try{console.log(require('$PROJECT_JSON').hasDocker)}catch(e){}" 2>/dev/null)
HAS_TESTS=$(node -e "try{console.log(require('$PROJECT_JSON').hasTests)}catch(e){}" 2>/dev/null)
HAS_API=$(node -e "try{console.log(require('$PROJECT_JSON').hasApiRoutes)}catch(e){}" 2>/dev/null)
LANGUAGES=$(node -e "try{console.log(JSON.stringify(require('$PROJECT_JSON').languages))}catch(e){}" 2>/dev/null)
FEATURES=$(node -e "try{console.log(JSON.stringify(require('$PROJECT_JSON').features))}catch(e){}" 2>/dev/null)
SRC_FILES=$(node -e "try{console.log(require('$STRUCTURE_JSON').totalSourceFiles)}catch(e){}" 2>/dev/null)
TEST_FILES=$(node -e "try{console.log(require('$STRUCTURE_JSON').testFiles)}catch(e){}" 2>/dev/null)
DIRECTORIES=$(node -e "try{console.log(JSON.stringify(require('$STRUCTURE_JSON').directories))}catch(e){}" 2>/dev/null)

[ -z "$PROJECT_NAME" ] && PROJECT_NAME="project"
[ -z "$PRIMARY_LANG" ] && PRIMARY_LANG="Unknown"
[ -z "$PRIMARY_FRAMEWORK" ] && PRIMARY_FRAMEWORK="Unknown"

# Maps for install/dev commands
INSTALL_CMD=""; RUN_CMD=""; TEST_RUN_CMD=""
case "$PKG_MANAGER" in
  pnpm) INSTALL_CMD="pnpm install"; RUN_CMD="${DEV_CMD:-pnpm dev}"; TEST_RUN_CMD="${TEST_CMD:-pnpm test}" ;;
  yarn) INSTALL_CMD="yarn install"; RUN_CMD="${DEV_CMD:-yarn dev}"; TEST_RUN_CMD="${TEST_CMD:-yarn test}" ;;
  npm)  INSTALL_CMD="npm install";  RUN_CMD="${DEV_CMD:-npm run dev}"; TEST_RUN_CMD="${TEST_CMD:-npm test}" ;;
  pub)  INSTALL_CMD="dart pub get"; RUN_CMD="${DEV_CMD:-flutter run}"; TEST_RUN_CMD="${TEST_CMD:-flutter test}" ;;
  cargo)INSTALL_CMD="cargo build";  RUN_CMD="${DEV_CMD:-cargo run}";  TEST_RUN_CMD="${TEST_CMD:-cargo test}" ;;
  go)   INSTALL_CMD="go mod download"; RUN_CMD="${DEV_CMD:-go run .}"; TEST_RUN_CMD="${TEST_CMD:-go test ./...}" ;;
  pip)  INSTALL_CMD="pip install -r requirements.txt"; RUN_CMD="${DEV_CMD:-python main.py}"; TEST_RUN_CMD="${TEST_CMD:-pytest}" ;;
  *)    INSTALL_CMD="install dependencies"; RUN_CMD="run the dev server"; TEST_RUN_CMD="run tests" ;;
esac

mkdir -p "$DOCS_DIR/features" "$DOCS_DIR/api" "$DOCS_DIR/architecture" \
         "$DOCS_DIR/database" "$DOCS_DIR/deployment" "$DOCS_DIR/testing" \
         "$DOCS_DIR/data-layer" "$DOCS_DIR/routes" "$DOCS_DIR/components"

# ── Escape for JSON ────────────────────────────────────────────────────
jq_escape() { echo "$1" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo "\"\""; }

# ── 1. index.md ────────────────────────────────────────────────────────
cat > "$DOCS_DIR/index.md" << MD
---
title: ${PROJECT_NAME}
desc: ${PROJECT_DESC:-Technical documentation for ${PROJECT_NAME}}
---

# ${PROJECT_NAME}

> ${PROJECT_DESC:-A ${PRIMARY_FRAMEWORK} project built with ${PRIMARY_LANG}}

## Quick Links

- [Getting Started](/getting-started.html)
- [Architecture Overview](/architecture/index.html)
- [Project Structure](/architecture/structure.html)
MD

[ "$HAS_API" = "true" ] && cat >> "$DOCS_DIR/index.md" << MD
- [API Reference](/api/)
MD

cat >> "$DOCS_DIR/index.md" << MD

## Tech Stack

| Category | Technology |
|----------|-----------|
| Language | ${PRIMARY_LANG} |
| Framework | ${PRIMARY_FRAMEWORK} |
| Package Manager | ${PKG_MANAGER} |
MD

# Add languages
LANG_LIST=$(echo "$LANGUAGES" | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(j.join(', '))" 2>/dev/null)
[ -n "$LANG_LIST" ] && cat >> "$DOCS_DIR/index.md" << MD
| Languages | ${LANG_LIST} |
MD

[ -n "$PROJECT_VERSION" ] && cat >> "$DOCS_DIR/index.md" << MD
| Version | ${PROJECT_VERSION} |
MD

# Stats
[ -n "$SRC_FILES" ] && [ "$SRC_FILES" -gt 0 ] && cat >> "$DOCS_DIR/index.md" << MD
| Source Files | ${SRC_FILES} |
MD
[ -n "$TEST_FILES" ] && [ "$TEST_FILES" -gt 0 ] && cat >> "$DOCS_DIR/index.md" << MD
| Test Files | ${TEST_FILES} |
MD

# Features
if [ "$FEATURES" != "[]" ] && [ "$FEATURES" != "" ]; then
  cat >> "$DOCS_DIR/index.md" << MD

## Features

This project includes the following capabilities:

$(echo "$FEATURES" | node -e "
  const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  j.forEach(f => console.log('- ' + f.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())));
" 2>/dev/null)
MD
fi

# ── 2. getting-started.md ──────────────────────────────────────────────
cat > "$DOCS_DIR/getting-started.md" << MD
---
title: Getting Started
desc: How to set up and run ${PROJECT_NAME}
---

# Getting Started

## Prerequisites

- ${PRIMARY_LANG} runtime
- ${PKG_MANAGER} package manager

## Installation

\`\`\`bash
# Clone the repository
git clone <repo-url>
cd ${PROJECT_NAME}

# Install dependencies
${INSTALL_CMD}
\`\`\`

## Development

\`\`\`bash
# Start the dev server
${RUN_CMD}
\`\`\`
MD

[ -n "$BUILD_CMD" ] && cat >> "$DOCS_DIR/getting-started.md" << MD

## Build

\`\`\`bash
# Build for production
${BUILD_CMD}
\`\`\`
MD

[ -n "$TEST_RUN_CMD" ] && cat >> "$DOCS_DIR/getting-started.md" << MD

## Testing

\`\`\`bash
# Run tests
${TEST_RUN_CMD}
\`\`\`
MD

# ── 3. project-structure.md (if no framework-specific detected) ─────────
if [ "$PRIMARY_FRAMEWORK" = "Unknown" ] || [ "$PRIMARY_FRAMEWORK" = "Go" ] || [ "$PRIMARY_FRAMEWORK" = "Rust" ] || [ "$PRIMARY_FRAMEWORK" = "Python" ] || [ "$PRIMARY_FRAMEWORK" = "Node.js" ]; then
  cat > "$DOCS_DIR/project-structure.md" << MD
---
title: Project Structure
desc: Codebase organization
---

# Project Structure

The project is organized as follows:

\`\`\`
$(find . -maxdepth 3 -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/vendor/*" -not -path "*/.dart_tool/*" -not -path "*/target/*" -not -path "*/.next/*" -not -path "*/coverage/*" 2>/dev/null | sort | head -40 | sed 's|\./||' | sed 's|[^/]*/|  |g')
\`\`\`
MD
fi

# ── 4. configuration.md ────────────────────────────────────────────────
CONFIG_FILES=$(node -e "
try {
  const j = require('$STRUCTURE_JSON');
  const cfgs = j.topLevelConfigs || [];
  cfgs.forEach(c => console.log('- \`' + c.replace(/\"/g,'') + '\`'));
} catch(e){}" 2>/dev/null)

cat > "$DOCS_DIR/configuration.md" << MD
---
title: Configuration
desc: Project configuration files
---

# Configuration

## Files

${CONFIG_FILES:-No configuration files detected.}

## Environment

Key environment variables and configuration options are documented in the relevant sections.
MD

# ── 5. api/index.md ────────────────────────────────────────────────────
if [ "$HAS_API" = "true" ]; then
  API_ROUTES=$(node -e "
  try {
    const routes = require('$STRUCTURE_JSON').routes || [];
    const apis = routes.filter(r => r.type === 'api');
    apis.forEach(r => console.log('- \`' + r.path + '\`'));
    if (apis.length === 0) {
      // Try to list api directories
      const dirs = require('$STRUCTURE_JSON').directories || {};
      if (dirs.api) console.log('- API endpoints in \`' + dirs.api.path + '/\`');
    }
  } catch(e){}" 2>/dev/null)

  cat > "$DOCS_DIR/api/index.md" << MD
---
title: API Reference
desc: API endpoints and usage
---

# API Reference

## Endpoints

${API_ROUTES:-API routes are defined in the project. See the architecture overview for more details.}

## Authentication

Document authentication requirements for API endpoints here.
MD
fi

# ── 6. database/index.md ───────────────────────────────────────────────
if [ "$HAS_DB" = "true" ]; then
  cat > "$DOCS_DIR/database/index.md" << MD
---
title: Database
desc: Database schema and queries
---

# Database

## Overview

This project uses a database for persistent storage.

## Schema

The database schema is defined in the project's migration files.
MD
fi

# ── 7. testing/index.md ────────────────────────────────────────────────
if [ "$HAS_TESTS" = "true" ]; then
  cat > "$DOCS_DIR/testing/index.md" << MD
---
title: Testing
desc: Testing strategy and how to run tests
---

# Testing

## Running Tests

\`\`\`bash
${TEST_RUN_CMD}
\`\`\`

## Test Structure

Tests are located in the project's test directories.
MD
fi

# ── 8. features/index.md ────────────────────────────────────────────────
FEATURE_LIST=""
if [ "$FEATURES" != "[]" ] && [ "$FEATURES" != "" ]; then
  FEATURE_LIST=$(echo "$FEATURES" | node -e "
    const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    j.forEach(f => {
      const name = f.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log('- [' + name + '](/' + f + '.html)');
    });
  " 2>/dev/null)

  # Generate individual feature pages
  echo "$FEATURES" | node -e "
    const fs = require('fs');
    const j = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const docsDir = '$DOCS_DIR';
    j.forEach(f => {
      const name = f.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
      const content = '---\\ntitle: ' + name + '\\ndesc: ' + name + ' feature\\n---\\n\\n# ' + name + '\\n\\nThis feature handles ' + f.replace(/-/g,' ') + ' functionality.\\n\\n## Overview\\n\\nDescribe what this feature does, why it exists, and how it works.\\n\\n## Implementation\\n\\nKey files and components involved.\\n\\n## Usage\\n\\nHow to use or interact with this feature.\\n';
      fs.writeFileSync(docsDir + '/features/' + f + '.md', content);
    });" 2>/dev/null || true
fi

cat > "$DOCS_DIR/features/index.md" << MD
---
title: Features
desc: Overview of all features
---

# Features

$(if [ -n "$FEATURE_LIST" ]; then echo "$FEATURE_LIST"; else echo "The project's features are documented in their respective sections."; fi)
MD

# ── 9. routes/index.md (for web apps) ──────────────────────────────────
PAGE_ROUTES=$(node -e "
try {
  const routes = require('$STRUCTURE_JSON').routes || [];
  routes.filter(r => r.type === 'page' || r.type === 'layout').forEach(r => {
    console.log('- \`' + r.path + '\`');
  });
} catch(e){}" 2>/dev/null)

if [ -n "$PAGE_ROUTES" ]; then
  cat > "$DOCS_DIR/routes/index.md" << MD
---
title: Routes
desc: Application routing structure
---

# Routes

## Pages

${PAGE_ROUTES}
MD
fi

# ── 10. Docker self-host setup ─────────────────────────────────────────
if [ "$HAS_DOCKER" != "true" ]; then
  mkdir -p "$DOCS_DIR/deployment"
  cat > "$DOCS_DIR/deployment/docker.md" << 'MD'
---
title: Docker Deployment
desc: Self-hosting with Docker
---

# Docker Deployment

## Prerequisites

- Docker
- Docker Compose (optional)

## Quick Start

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run docs:build

FROM nginx:alpine
COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  docs:
    build: .
    ports:
      - "8080:80"
```

```bash
# Build and run
docker build -t docs .
docker run -p 8080:80 docs
# Or with compose:
docker compose up -d
```
MD
fi

echo "gen-content.sh: Documentation generated for ${PROJECT_NAME}"
