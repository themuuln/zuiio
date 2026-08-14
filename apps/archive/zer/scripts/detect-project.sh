#!/bin/bash
# detect-project.sh — Universal project detection
# Analyzes ANY project and outputs structured JSON with language, framework, structure.
# Pure bash, no dependencies. Fast (~100ms).

OUT="${1:-/tmp/doc-project.json}"

# ── Helpers ──────────────────────────────────────────────────────────
has_file() { [ -f "$1" ]; }                                    # file exists
has_dir()  { [ -d "$1" ]; }                                     # dir exists
has_ext()  { find . -maxdepth 3 -name "*.$1" 2>/dev/null | head -1 | grep -q .; }
has_dep()  { [ -f package.json ] && grep -q "\"$1\"" package.json 2>/dev/null; }
has_gem()  { [ -f Gemfile ] && grep -q "$1" Gemfile 2>/dev/null; }
has_pub()  { [ -f pubspec.yaml ] && grep -q "$1" pubspec.yaml 2>/dev/null; }
has_cargo(){ [ -f Cargo.toml ] && grep -q "$1" Cargo.toml 2>/dev/null; }
has_py_dep(){ [ -f pyproject.toml ] && grep -q "$1" pyproject.toml 2>/dev/null || [ -f requirements.txt ] && grep -q "$1" requirements.txt 2>/dev/null; }
json_escape() { echo "$1" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null || echo "\"$1\""; }

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$PROJECT_ROOT"

# ── 1. Project Metadata ──────────────────────────────────────────────
PROJECT_NAME=""
PROJECT_VERSION=""
PROJECT_DESC=""

if has_file "package.json"; then
  PROJECT_NAME=$(node -e "try{console.log(require('./package.json').name||'')}catch(e){}" 2>/dev/null)
  PROJECT_VERSION=$(node -e "try{console.log(require('./package.json').version||'')}catch(e){}" 2>/dev/null)
  PROJECT_DESC=$(node -e "try{console.log(require('./package.json').description||'')}catch(e){}" 2>/dev/null)
elif has_file "pubspec.yaml"; then
  PROJECT_NAME=$(grep '^name:' pubspec.yaml 2>/dev/null | awk '{print $2}')
  PROJECT_VERSION=$(grep '^version:' pubspec.yaml 2>/dev/null | awk '{print $2}')
elif has_file "Cargo.toml"; then
  PROJECT_NAME=$(grep '^name' Cargo.toml 2>/dev/null | head -1 | awk -F'"' '{print $2}')
  PROJECT_VERSION=$(grep '^version' Cargo.toml 2>/dev/null | head -1 | awk -F'"' '{print $2}')
elif has_file "pyproject.toml"; then
  PROJECT_NAME=$(grep '^name' pyproject.toml 2>/dev/null | head -1 | awk -F'"' '{print $2}'| awk -F"'" '{print $2}')
elif has_file "go.mod"; then
  PROJECT_NAME=$(head -1 go.mod 2>/dev/null | awk '{print $2}')
fi
[ -z "$PROJECT_NAME" ] && PROJECT_NAME=$(basename "$PROJECT_ROOT")

# ── 2. Language Detection ────────────────────────────────────────────
LANGUAGES=(); PRIMARY_LANG=""
for pair in \
  "Dart:pubspec.yaml|dart" \
  "TypeScript:tsconfig.json|ts|tsx" \
  "JavaScript:package.json|js|jsx" \
  "Python:pyproject.toml,setup.py,requirements.txt|py" \
  "Go:go.mod|go" \
  "Rust:Cargo.toml|rs" \
  "Swift:Package.swift|swift" \
  "Kotlin:build.gradle.kts|kt" \
  "Java:pom.xml,build.gradle|java" \
  "Ruby:Gemfile|rb" \
  "PHP:composer.json|php" \
  "C#:.csproj|cs" \
  "C++:CMakeLists.txt|cpp|cxx" \
  "Zig:build.zig|zig"; do
  lang="${pair%%:*}"
  files="${pair#*:}"; files="${files%%|*}"
  exts="${pair##*|}"
  IFS=',' read -ra check_files <<< "$files"
  for f in "${check_files[@]}"; do
    if has_file "$f"; then LANGUAGES+=("$lang"); break 2; fi
  done
  for ext in $exts; do
    if has_ext "$ext"; then LANGUAGES+=("$lang"); break 2; fi
  done
done

[ "${#LANGUAGES[@]}" -eq 0 ] && LANGUAGES=("Unknown")
PRIMARY_LANG="${LANGUAGES[0]}"

# ── 3. Framework Detection (priority ordered) ─────────────────────────
# Higher-priority (more specific) frameworks checked first
FRAMEWORKS=()
detect_framework() {
  local name="$1"; shift
  for check in "$@"; do
    case "$check" in
      file:*)   has_file "${check#file:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
      dep:*)    has_dep "${check#dep:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
      pub:*)    has_pub "${check#pub:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
      gem:*)    has_gem "${check#gem:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
      cargo:*)  has_cargo "${check#cargo:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
      py:*)     has_py_dep "${check#py:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
      ext:*)    has_ext "${check#ext:}" && { FRAMEWORKS+=("$name"); return 0; } ;;
    esac
  done
  return 1
}

# Tier 1: Strongest signals (native/mobile platforms clearly identified)
detect_framework "Flutter"      "pub:flutter" "ext:dart"
detect_framework "React Native" "dep:react-native"
detect_framework "Electron"     "dep:electron"
detect_framework "Tauri"        "dep:@tauri-apps/api" "cargo:tauri"
detect_framework "Godot"        "file:project.godot" "ext:gd"

# Tier 2: Server-side frameworks
detect_framework "Django"       "file:manage.py" "py:django"
detect_framework "FastAPI"      "py:fastapi"
detect_framework "Flask"        "py:flask"
detect_framework "Rails"        "gem:rails"
detect_framework "Laravel"      "file:artisan"
detect_framework "Spring Boot"  "file:pom.xml" "file:build.gradle"
detect_framework "Express"      "dep:express"
detect_framework "Fastify"      "dep:fastify"
detect_framework "NestJS"       "dep:@nestjs/core"
detect_framework "Hono"         "dep:hono"
detect_framework "Elysia"       "dep:elysia"

# Tier 3: Meta-frameworks (Next.js, Nuxt, etc.)
detect_framework "Next.js"      "file:next.config.js" "file:next.config.ts" "file:next.config.mjs" "dep:next"
detect_framework "Nuxt.js"      "file:nuxt.config.js" "file:nuxt.config.ts" "dep:nuxt" "dep:nuxt3"
detect_framework "Astro"        "file:astro.config.mjs" "file:astro.config.ts" "dep:astro"
detect_framework "Remix"        "file:remix.config.js" "file:remix.config.ts" "dep:@remix-run/react"
detect_framework "Gatsby"       "file:gatsby-config.js" "file:gatsby-config.ts" "dep:gatsby"
detect_framework "SvelteKit"    "file:svelte.config.js" "file:svelte.config.ts" "dep:@sveltejs/kit"

# Tier 4: Pure frontend frameworks
detect_framework "Angular"      "file:angular.json" "dep:@angular/core"
detect_framework "Vue.js"       "dep:vue" "dep:vue3"
detect_framework "React"        "dep:react" "dep:react-dom"

# If nothing specific detected, infer from language
[ "${#FRAMEWORKS[@]}" -eq 0 ] && case "$PRIMARY_LANG" in
  Dart)      FRAMEWORKS=("Flutter") ;;
  TypeScript)
    has_dep "react" || has_dep "next" && { FRAMEWORKS=("React"); }
    [ "${#FRAMEWORKS[@]}" -eq 0 ] && FRAMEWORKS=("Node.js") ;;
  JavaScript) FRAMEWORKS=("Node.js") ;;
  Python)    FRAMEWORKS=("Python") ;;
  Go)        FRAMEWORKS=("Go") ;;
  Rust)      FRAMEWORKS=("Rust") ;;
  *)         FRAMEWORKS=("Unknown") ;;
esac

PRIMARY_FRAMEWORK="${FRAMEWORKS[0]}"

# ── 4. Package Manager ───────────────────────────────────────────────
PKG_MANAGER=""
has_file "pnpm-lock.yaml"          && PKG_MANAGER="pnpm"
has_file "yarn.lock"               && PKG_MANAGER="yarn"
has_file "package-lock.json"       && PKG_MANAGER="npm"
has_file "pubspec.lock"            && PKG_MANAGER="pub"
has_file "Cargo.lock"              && PKG_MANAGER="cargo"
has_file "go.sum"                  && PKG_MANAGER="go"
has_file "Gemfile.lock"            && PKG_MANAGER="bundler"
has_file "poetry.lock"             && PKG_MANAGER="poetry"
has_file "Pipfile"                 && PKG_MANAGER="pipenv"
has_file "requirements.txt"        && PKG_MANAGER="pip"
has_file "composer.lock"           && PKG_MANAGER="composer"
has_file "gradlew"                 && PKG_MANAGER="gradle"
has_file "mvnw"                    && PKG_MANAGER="maven"
[ -z "$PKG_MANAGER" ] && PKG_MANAGER="unknown"

# ── 5. Build & Dev Commands ──────────────────────────────────────────
BUILD_CMD=""; DEV_CMD=""; TEST_CMD=""
case "$PRIMARY_FRAMEWORK" in
  "Next.js")     BUILD_CMD="next build";    DEV_CMD="next dev";         TEST_CMD="" ;;
  "Flutter")     BUILD_CMD="flutter build"; DEV_CMD="flutter run";      TEST_CMD="flutter test" ;;
  "Vue.js"|"React"|"Astro"|"SvelteKit"|"Nuxt.js")
    [ -f "vite.config.ts" ] || [ -f "vite.config.js" ] && { BUILD_CMD="vite build"; DEV_CMD="vite"; }
    has_file "astro.config.mjs" && { BUILD_CMD="astro build"; DEV_CMD="astro dev"; } ;;
  "Django")      BUILD_CMD="";              DEV_CMD="python manage.py runserver"; TEST_CMD="python manage.py test" ;;
  "FastAPI")     BUILD_CMD="";              DEV_CMD="uvicorn main:app --reload";   TEST_CMD="pytest" ;;
  "Rails")       BUILD_CMD="rails assets:precompile"; DEV_CMD="rails server";      TEST_CMD="rails test" ;;
  "Laravel")     BUILD_CMD="npm run build"; DEV_CMD="php artisan serve";           TEST_CMD="php artisan test" ;;
  *)             BUILD_CMD="";              DEV_CMD="";                             TEST_CMD="" ;;
esac

# Try to read scripts from package.json if available
if has_file "package.json"; then
  node -e "
    const p = require('./package.json');
    const s = p.scripts || {};
    const out = {};
    if (s.build) out.build = s.build;
    if (s.dev) out.dev = s.dev;
    if (s.test) out.test = s.test;
    if (s.start) out.start = s.start;
    console.log(JSON.stringify(out));
  " 2>/dev/null > /tmp/doc-pkg-scripts.json && {
    SCRIPTS=$(cat /tmp/doc-pkg-scripts.json)
    [ -z "$BUILD_CMD" ] && BUILD_CMD=$(echo "$SCRIPTS" | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(j.build||j.build||'')" 2>/dev/null)
    [ -z "$DEV_CMD" ] && DEV_CMD=$(echo "$SCRIPTS" | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(j.dev||j.start||'')" 2>/dev/null)
    [ -z "$TEST_CMD" ] && TEST_CMD=$(echo "$SCRIPTS" | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(j.test||'')" 2>/dev/null)
  }
fi

# ── 6. Structure Detection ───────────────────────────────────────────
HAS_SRC=false; HAS_LIB=false; HAS_APP=false; HAS_PAGES=false
HAS_API=false; HAS_COMPONENTS=false; HAS_TESTS=false
SRC_DIR=""; APP_DIR=""; COMPONENTS_DIR=""
has_dir "src"       && HAS_SRC=true && SRC_DIR="src"
has_dir "lib"       && HAS_LIB=true
has_dir "app"       && HAS_APP=true && APP_DIR="app"
has_dir "src/app"   && HAS_APP=true && APP_DIR="src/app"
has_dir "src/pages" && HAS_PAGES=true
has_dir "pages"     && HAS_PAGES=true
has_dir "src/api" || has_dir "app/api" || has_dir "src/app/api" && HAS_API=true

# Component directories
for d in src/components components src/app/components lib/components; do
  has_dir "$d" && COMPONENTS_DIR="$d" && HAS_COMPONENTS=true && break
done

# Test directories
for d in tests __tests__ src/__tests__ spec src/spec test; do
  has_dir "$d" && HAS_TESTS=true && break
done

# Structure type classification
STRUCTURE_TYPE="flat"
$HAS_APP && $HAS_SRC && STRUCTURE_TYPE="app-router"
$HAS_PAGES && STRUCTURE_TYPE="pages-router"
$HAS_SRC && ! $HAS_APP && ! $HAS_PAGES && STRUCTURE_TYPE="src-layout"
$HAS_LIB && STRUCTURE_TYPE="lib-layout"
has_dir "lib/features" || has_dir "src/features" || has_dir "lib/data" && STRUCTURE_TYPE="feature-first"
has_dir "lib/data" && has_dir "lib/domain" && has_dir "lib/presentation" && STRUCTURE_TYPE="clean-architecture"
[ -f "lerna.json" ] || [ -f "nx.json" ] || has_dir "packages" && STRUCTURE_TYPE="monorepo"

# ── 7. Database Detection ────────────────────────────────────────────
HAS_DB=false
has_dep "prisma" || has_dep "drizzle-orm" || has_dep "typeorm" || \
has_dep "mongoose" || has_dep "sequelize" || has_dep "knex" || \
has_pub "drift" || has_pub "floor" || has_pub "sqflite" || \
has_file "schema.prisma" || has_file "drizzle.config.ts" && HAS_DB=true

# ── 8. Docker / CI Detection ─────────────────────────────────────────
HAS_DOCKER=false; HAS_CI=false
has_file "Dockerfile"         && HAS_DOCKER=true
has_dir ".github/workflows"   && HAS_CI=true
has_file ".gitlab-ci.yml"     && HAS_CI=true

# ── 9. Theme Colors ─────────────────────────────────────────────────────
theme_color_for() {
  case "$1" in
    "Next.js")          echo "#000000";; "Flutter") echo "#02569B";;
    "React")            echo "#087EA4";; "Vue.js")  echo "#42B883";;
    "Angular")          echo "#DD0031";; "SvelteKit"|"Svelte") echo "#FF3E00";;
    "Nuxt.js")          echo "#00DC82";; "Astro")   echo "#BC52EE";;
    "Gatsby")           echo "#663399";; "Remix")   echo "#121212";;
    "Django")           echo "#092E20";; "FastAPI") echo "#009688";;
    "Flask")            echo "#000000";; "Rails")   echo "#CC0000";;
    "Laravel")          echo "#FF2D20";; "Spring Boot") echo "#6DB33F";;
    "Express")          echo "#000000";; "Go")      echo "#00ADD8";;
    "Rust")             echo "#CE422B";; "Python")  echo "#3776AB";;
    "Node.js")          echo "#339933";; "Electron") echo "#47848F";;
    "React Native")     echo "#61DAFB";; "Tauri")   echo "#FFC131";;
    "Godot")            echo "#478CBF";; "Unity")   echo "#000000";;
    *)                  echo "#6C5CE7";;
  esac
}
THEME_COLOR=$(theme_color_for "$PRIMARY_FRAMEWORK")

# ── 10. Devicon / Icon ────────────────────────────────────────────────
icon_for() {
  case "$1" in
    "Next.js")     echo "nextjs";;  "Flutter") echo "flutter";;
    "React")       echo "react";;   "Vue.js")  echo "vuejs";;
    "Angular")     echo "angularjs";;"Svelte"*) echo "svelte";;
    "Nuxt.js")     echo "nuxtjs";;  "Astro")   echo "astro";;
    "Django")      echo "django";;  "FastAPI") echo "fastapi";;
    "Rails")       echo "rails";;   "Laravel") echo "laravel";;
    "Go")          echo "go";;      "Rust")    echo "rust";;
    "Python")      echo "python";;  "Node.js") echo "nodejs";;
    "Electron")    echo "electron";;"React Native") echo "react";;
    "Godot")       echo "godot";;   *)         echo "code";;
  esac
}
ICON=$(icon_for "$PRIMARY_FRAMEWORK")

# ── 11. Detect Features (high-level) ──────────────────────────────────
FEATURES=()
has_dir "src/app/api" || has_dir "app/api" || has_dir "src/pages/api" && FEATURES+=("api")
has_dir "src/auth" || has_dir "app/auth" || has_dir "lib/auth" && FEATURES+=("authentication")
has_dir "src/i18n" || has_dir "lib/i18n" || has_dir "src/locales" && FEATURES+=("i18n")
has_dir "src/db" || has_dir "lib/db" || has_dir "prisma" && FEATURES+=("database")
has_dir "src/websocket" || has_dir "lib/websocket" && FEATURES+=("websocket")
has_dir "src/worker" || has_dir "lib/worker" && FEATURES+=("background-jobs")
has_dir "src/cache" || has_dir "lib/cache" && FEATURES+=("caching")
has_dir "src/search" || has_dir "lib/search" && FEATURES+=("search")
has_dir "src/queue" || has_dir "lib/queue" && FEATURES+=("queue")
has_dir "src/email" || has_dir "lib/email" && FEATURES+=("email")
has_dir "src/analytics" || has_dir "lib/analytics" && FEATURES+=("analytics")
has_dir "src/payments" || has_dir "lib/payments" && FEATURES+=("payments")
has_dir "src/admin" || has_dir "lib/admin" && FEATURES+=("admin")

# ── 12. Output JSON using node for reliability ────────────────────────
node -e "
const o = {
  projectName: $(json_escape "$PROJECT_NAME"),
  projectVersion: $(json_escape "$PROJECT_VERSION"),
  projectDescription: $(json_escape "$PROJECT_DESC"),
  languages: [$(printf '"%s",' "${LANGUAGES[@]}" | sed 's/,$//')].filter(Boolean),
  primaryLanguage: $(json_escape "$PRIMARY_LANG"),
  frameworks: [$(printf '"%s",' "${FRAMEWORKS[@]}" | sed 's/,$//')].filter(Boolean),
  primaryFramework: $(json_escape "$PRIMARY_FRAMEWORK"),
  packageManager: $(json_escape "$PKG_MANAGER"),
  buildCommand: $(json_escape "$BUILD_CMD"),
  devCommand: $(json_escape "$DEV_CMD"),
  testCommand: $(json_escape "$TEST_CMD"),
  structureType: $(json_escape "$STRUCTURE_TYPE"),
  hasSrcDir: $([ "$HAS_SRC" = true ] && echo true || echo false),
  hasLibDir: $([ "$HAS_LIB" = true ] && echo true || echo false),
  hasAppDir: $([ "$HAS_APP" = true ] && echo true || echo false),
  hasPagesDir: $([ "$HAS_PAGES" = true ] && echo true || echo false),
  hasApiRoutes: $([ "$HAS_API" = true ] && echo true || echo false),
  hasComponents: $([ "$HAS_COMPONENTS" = true ] && echo true || echo false),
  hasDatabase: $([ "$HAS_DB" = true ] && echo true || echo false),
  hasTests: $([ "$HAS_TESTS" = true ] && echo true || echo false),
  hasDocker: $([ "$HAS_DOCKER" = true ] && echo true || echo false),
  hasCI: $([ "$HAS_CI" = true ] && echo true || echo false),
  srcDir: $(json_escape "$SRC_DIR"),
  appDir: $(json_escape "$APP_DIR"),
  componentsDir: $(json_escape "$COMPONENTS_DIR"),
  themeColor: $(json_escape "$THEME_COLOR"),
  icon: $(json_escape "$ICON"),
  features: [$(printf '"%s",' "${FEATURES[@]}" | sed 's/,$//')].filter(Boolean)
};
require('fs').writeFileSync('$OUT', JSON.stringify(o, null, 2));
" 2>/dev/null
echo "detect-project.sh: -> $OUT"
