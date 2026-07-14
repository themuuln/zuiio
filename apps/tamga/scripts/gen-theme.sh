#!/bin/bash
# gen-theme.sh — Generate adaptive VitePress theme from project data
# Sets colors, icons, and styles based on detected framework/language.
# Pure bash, outputs theme files directly.

PROJECT_JSON="${1:-/tmp/doc-project.json}"
DOCS_DIR="${2:-docs}"

[ ! -f "$PROJECT_JSON" ] && echo "gen-theme.sh: No project data at $PROJECT_JSON" && exit 1

PROJECT_NAME=$(node -e "try{console.log(require('$PROJECT_JSON').projectName)}catch(e){}" 2>/dev/null)
PRIMARY_FRAMEWORK=$(node -e "try{console.log(require('$PROJECT_JSON').primaryFramework)}catch(e){}" 2>/dev/null)
THEME_COLOR=$(node -e "try{console.log(require('$PROJECT_JSON').themeColor)}catch(e){}" 2>/dev/null)
ICON=$(node -e "try{console.log(require('$PROJECT_JSON').icon)}catch(e){}" 2>/dev/null)
PKG_MANAGER=$(node -e "try{console.log(require('$PROJECT_JSON').packageManager)}catch(e){}" 2>/dev/null)

[ -z "$THEME_COLOR" ] && THEME_COLOR="#6C5CE7"
[ -z "$PRIMARY_FRAMEWORK" ] && PRIMARY_FRAMEWORK="Unknown"
[ -z "$ICON" ] && ICON="code"

# Lighten/darken the theme color for variants
# Convert hex to RGB
HEX="${THEME_COLOR#\#}"
R=$((16#${HEX:0:2})); G=$((16#${HEX:2:2})); B=$((16#${HEX:4:2}))

# Create light variant (70% opacity on white)
RL=$((R + (255-R)*30/100))
GL=$((G + (255-G)*30/100))
BL=$((B + (255-B)*30/100))
LIGHT_VAR="#$(printf '%02x%02x%02x' $RL $GL $BL)"

# Create dark variant (darker by 20%)
RD=$((R*80/100)); GD=$((G*80/100)); BD=$((B*80/100))
DARK_VAR="#$(printf '%02x%02x%02x' $RD $GD $BD)"

# Create subtle background (5% alpha on white)
BG_SUBTLE="rgba($R,$G,$B,0.08)"

# Generate devicon link
DEVICON_LINK="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${ICON}/${ICON}-original.svg"
# Fallback: use a colored circle if no devicon
[ "$ICON" = "code" ] && DEVICON_LINK="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='${THEME_COLOR//#/%23}'%3E%3Cpath d='M8 3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H3v2h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2v-2H8v-4a4 4 0 0 0-1.33-3A4 4 0 0 0 8 9V5h2V3m6 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-4a4 4 0 0 1 1.33-3A4 4 0 0 1 16 9V5h-2V3h2z'/%3E%3C/svg%3E"

# ── Write Theme index.ts ──────────────────────────────────────────────
mkdir -p "$DOCS_DIR/.vitepress/theme"
cat > "$DOCS_DIR/.vitepress/theme/index.ts" << TS
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout),
  enhanceApp: ({ app }) => {
    // Provide project theme data to components
    app.provide("doc-theme", {
      color: "$THEME_COLOR",
      framework: "$PRIMARY_FRAMEWORK",
      icon: "$ICON",
    });
  },
} satisfies Theme;
TS

# ── Write custom.css with adaptive colors ─────────────────────────────
cat > "$DOCS_DIR/.vitepress/theme/custom.css" << CSS
/* ── Auto-generated theme for ${PRIMARY_FRAMEWORK} ── */

:root {
  --doc-theme-color: ${THEME_COLOR};
  --doc-theme-color-light: ${LIGHT_VAR};
  --doc-theme-color-dark: ${DARK_VAR};
  --doc-theme-bg-subtle: ${BG_SUBTLE};
  --doc-framework: "${PRIMARY_FRAMEWORK}";
  --vp-c-brand-1: ${THEME_COLOR};
  --vp-c-brand-2: ${DARK_VAR};
  --vp-c-brand-3: ${THEME_COLOR};
  --vp-c-brand-soft: ${BG_SUBTLE};
  --vp-home-hero-name-color: ${THEME_COLOR};
  --vp-button-brand-bg: ${THEME_COLOR};
  --vp-button-brand-hover-bg: ${DARK_VAR};
  --vp-button-brand-active-bg: ${DARK_VAR};
}

/* Framework badge in nav */
.vp-doc h1::before {
  content: "${PRIMARY_FRAMEWORK}";
  font-size: 0.5em;
  font-weight: 500;
  vertical-align: middle;
  margin-left: 0.75rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--doc-theme-bg-subtle);
  color: var(--doc-theme-color);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* Brand accent on link hover */
.vp-doc a {
  color: var(--doc-theme-color);
  transition: opacity 0.2s;
}
.vp-doc a:hover {
  opacity: 0.8;
}

/* Hero section */
.VPHero .name {
  color: var(--doc-theme-color);
}

/* Custom block callouts */
.custom-block.tip {
  border-color: var(--doc-theme-color);
  background-color: var(--doc-theme-bg-subtle);
}

/* Sidebar active item */
.sidebar-link-item.active {
  color: var(--doc-theme-color);
  border-left-color: var(--doc-theme-color);
}

/* Navigation active link */
.vp-navbar a.active {
  color: var(--doc-theme-color);
  border-bottom-color: var(--doc-theme-color);
}

/* Dark mode adjustments */
.dark {
  --vp-c-brand-1: ${LIGHT_VAR};
  --vp-c-brand-2: ${THEME_COLOR};
  --vp-c-brand-3: ${LIGHT_VAR};
  --vp-c-brand-soft: rgba(${R}, ${G}, ${B}, 0.15);
  --doc-theme-bg-subtle: rgba(${R}, ${G}, ${B}, 0.12);
}
CSS

echo "gen-theme.sh: Theme generated for ${PRIMARY_FRAMEWORK} (${THEME_COLOR})"
