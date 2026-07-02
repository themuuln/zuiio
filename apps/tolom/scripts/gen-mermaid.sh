#!/bin/bash
# gen-mermaid.sh — Generate Mermaid diagrams from project structure
# Creates: architecture overview, directory tree, data flow, route map.
# Pure bash. Outputs .md files with mermaid code blocks.

PROJECT_JSON="${1:-/tmp/doc-project.json}"
STRUCTURE_JSON="${2:-/tmp/doc-structure.json}"
DOCS_DIR="${3:-docs}"

[ ! -f "$PROJECT_JSON" ] && echo "gen-mermaid.sh: No project data" && exit 1
[ ! -f "$STRUCTURE_JSON" ] && echo "gen-mermaid.sh: No structure data" && exit 1

PRIMARY_FRAMEWORK=$(node -e "try{console.log(require('$PROJECT_JSON').primaryFramework)}catch(e){}" 2>/dev/null)
STRUCTURE_TYPE=$(node -e "try{console.log(require('$PROJECT_JSON').structureType)}catch(e){}" 2>/dev/null)
PROJECT_NAME=$(node -e "try{console.log(require('$PROJECT_JSON').projectName)}catch(e){}" 2>/dev/null)

mkdir -p "$DOCS_DIR/architecture" "$DOCS_DIR/features" "$DOCS_DIR/deployment"

# ── 1. Architecture Overview ───────────────────────────────────────────
cat > "$DOCS_DIR/architecture/index.md" << MD
---
title: Architecture Overview
desc: High-level architecture of ${PROJECT_NAME}
---

# Architecture Overview

\`\`\`mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        UI["UI / Components"]
        State["State Management"]
        Router["Routing / Navigation"]
    end

    subgraph API["API Layer"]
        Routes["Route Handlers"]
        Middleware["Middleware"]
        Validation["Input Validation"]
    end

    subgraph Data["Data Layer"]
        Models["Data Models"]
        Repos["Repositories"]
        Cache["Caching"]
    end

    subgraph External["External"]
        DB[("Database")]
        Services["Third-party Services"]
        Storage["File Storage"]
    end

    UI --> State
    UI --> Router
    Router --> Routes
    Routes --> Middleware
    Middleware --> Validation
    Validation --> Repos
    Repos --> Models
    Repos --> Cache
    Repos --> DB
    Repos --> Services
    Repos --> Storage

    style Frontend fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
    style API fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
    style Data fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
    style External fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
\`\`\`

MD

# ── 2. Directory Structure Tree ───────────────────────────────────────
DIR_TREE=$(node -e "
const data = require('$STRUCTURE_JSON');
const tree = data.tree || [];
const lines = [];
lines.push('flowchart LR');
// Group by level
const byLevel = {};
tree.forEach(n => {
  if (!byLevel[n.level]) byLevel[n.level] = [];
  byLevel[n.level].push(n);
});
// Create nodes with styling
tree.forEach((n, i) => {
  const id = 'dir' + i;
  const label = n.path.split('/').pop() || n.path;
  const isTop = n.level <= 1;
  const style = isTop ? 'fill:#e8e8e8,stroke:#333,stroke-width:2px' : 'fill:#f8f8f8,stroke:#999';
  lines.push('    ' + id + '[\"' + label + '\"]');
  lines.push('    style ' + id + ' ' + style);
});
// Create edges
tree.forEach((n, i) => {
  if (n.level <= 1) return;
  const parts = n.path.split('/');
  const parent = parts.slice(0, -1).join('/');
  const pIdx = tree.findIndex(t => t.path === parent);
  if (pIdx >= 0) {
    lines.push('    dir' + pIdx + ' --> dir' + i);
  } else if (parts.length > 1) {
    // Try to find closest parent
    for (let l = parts.length - 1; l > 0; l--) {
      const p = parts.slice(0, l).join('/');
      const idx = tree.findIndex(t => t.path === p);
      if (idx >= 0) { lines.push('    dir' + idx + ' --> dir' + i); break; }
    }
  }
});
console.log(lines.join('\n'));
" 2>/dev/null || echo "flowchart LR")

# Only write if we got meaningful data
if [ -n "$DIR_TREE" ] && [ "$(echo "$DIR_TREE" | wc -l)" -gt 3 ]; then
  cat > "$DOCS_DIR/architecture/structure.md" << MD
---
title: Project Structure
desc: Directory tree architecture
---

# Project Structure

\`\`\`mermaid
$DIR_TREE
\`\`\`
MD
fi

# ── 3. Framework-Specific Diagrams ─────────────────────────────────────
case "$PRIMARY_FRAMEWORK" in
  "Next.js")
    cat > "$DOCS_DIR/architecture/data-flow.md" << 'MD'
---
title: Data Flow
desc: How data moves through the application
---

# Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React Component
    participant Server as Next.js Server
    participant DB as Database

    User->>UI: Interact
    UI->>Server: Server Action / API Call
    Server->>Server: Validate & Process
    Server->>DB: Query
    DB-->>Server: Result
    Server-->>UI: Response (RSC)
    UI-->>User: Update UI

    Note over UI,Server: React Query handles caching<br/>and optimistic updates
```
MD
    ;;

  "Flutter")
    cat > "$DOCS_DIR/architecture/data-flow.md" << 'MD'
---
title: Data Flow
desc: How data moves through the application
---

# Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Widget
    participant BLoC as BLoC / Cubit
    participant Repo as Repository
    participant API as Data Source

    User->>UI: Tap / Input
    UI->>BLoC: Event
    BLoC->>Repo: Fetch Data
    Repo->>API: HTTP / DB Call
    API-->>Repo: Response
    Repo-->>BLoC: Result
    BLoC-->>UI: New State
    UI-->>User: Rebuild
```
MD
    ;;

  "Django"|"FastAPI"|"Flask")
    cat > "$DOCS_DIR/architecture/data-flow.md" << 'MD'
---
title: Data Flow
desc: Request/response lifecycle
---

# Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant WSGI as WSGI/ASGI Server
    participant Middleware
    participant Views
    participant ORM
    participant DB

    Client->>WSGI: HTTP Request
    WSGI->>Middleware: Process
    Middleware->>Views: Route
    Views->>ORM: Query
    ORM->>DB: SQL
    DB-->>ORM: Result
    ORM-->>Views: Model
    Views-->>Middleware: Response
    Middleware-->>WSGI: Process
    WSGI-->>Client: HTTP Response
```
MD
    ;;
esac

# ── 4. Deployment Flow (generic) ───────────────────────────────────────
cat > "$DOCS_DIR/deployment/index.md" << 'MD'
---
title: Deployment
desc: How the application is built and deployed
---

# Deployment

```mermaid
flowchart LR
    Dev["Developer"] --> Git["Git Push"]
    Git --> CI["CI Pipeline"]
    CI --> Build["Build"]
    Build --> Test["Tests"]
    Test -->|Pass| Artifact["Artifact"]
    Artifact --> Deploy["Deploy"]
    Deploy --> Prod[("Production")]

    style Dev fill:#e8e8e8,stroke:#333
    style Prod fill:#d4edda,stroke:#155724
```
MD

echo "gen-mermaid.sh: Diagrams generated"
