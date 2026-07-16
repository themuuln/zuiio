---
name: Zuiio ID
description: Centralized identity and SSO system for the Zuiio ecosystem
colors:
  primary: "#1a9eaf"
  primary-foreground: "#1f1e1c"
  ring: "#0d6e7a"
  background: "#faf9f7"
  foreground: "#1f1e1c"
  card: "#faf9f7"
  muted: "#f4f3f0"
  muted-foreground: "#7a7976"
  border: "#ebeae7"
  input: "#e0dfdc"
  destructive: "#c44424"
  destructive-foreground: "#faf9f7"
  accent: "#3d3dba"
typography:
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  small:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "11px 16px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "40px"
  oauth-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    height: "48px"
---

# Design System: Zuiio ID

## 1. Overview

**Creative North Star: "The Secure Threshold"**

Zuiio ID is the front door to every Zuiio product — Zer, Tolom, and everything that follows. Its design language is **restrained confidence**: a near-black-on-near-white palette with a single teal accent that says "this is a place where your identity is handled carefully." The system explicitly rejects decorative warmth (no cream backgrounds, no rounded-everything), visual noise (no badges, no gradient text), and template familiarity (no glassmorphism, no side-stripe borders).

**Key Characteristics:**
- Flat depth model: card equals background, borders and tints carry all structure
- Single accent (teal) reserved for primary actions only
- Geist typeface family: geometric sans with sharp clarity
- Mongolian-first: all user-facing copy in Mongolian
- Trust through simplicity: every element earns its place

## 2. Colors

The palette is deliberately minimal: one accent on a near-white ground, with warm-tinted neutrals for structure.

### Primary

- **Teal** (oklch(0.70 0.16 195) / #1a9eaf): Submit buttons, brand identity. Used at full saturation only on large colored surfaces (buttons, logo). Never used for text on light backgrounds — that role belongs to foreground.

### Neutral

- **Near-Black** (oklch(0.13 0.003 80) / #1f1e1c): Body text, headings, interactive text. The primary reading color.
- **Warm Paper** (oklch(0.98 0.005 80) / #faf9f7): Page background and card surfaces. Flat — no shadows, no layering.
- **Muted Gray** (oklch(0.96 0.008 80) / #f4f3f0): Subtle background tints, hover states.
- **Subtitle Gray** (oklch(0.55 0.008 80) / #7a7976): Subtitles, secondary text, placeholders. Actual contrast ~4.14:1 — fails WCAG AA (4.5:1 threshold). Use only for non-essential secondary text, never for essential information.
- **Border** (oklch(0.92 0.004 80) / #ebeae7): Dividers, input borders, card edges.
- **Input Border** (oklch(0.88 0.006 80) / #e0dfdc): Input field borders — slightly more prominent than decorative borders.

### Semantic

- **Destructive** (oklch(0.58 0.22 29) / #c44424): Error states, validation messages. Always on a tinted background (bg-destructive/10).
- **Ring** (oklch(0.45 0.16 195) / #0d6e7a): Focus indicators. Darker than primary to ensure 5.96:1 contrast on the background.

### Named Rules

**The Accent Scarcity Rule.** The teal primary appears on ≤15% of any given screen — submit buttons, the logo, and nothing else. Links and interactive text use foreground (near-black), never primary.

**The Flat Depth Rule.** Cards and backgrounds share the same color. Depth is conveyed through borders and subtle tints, never through box-shadows or elevation.

## 3. Typography

**Body Font:** Geist (with system-ui, sans-serif fallback)
**Mono Font:** Geist Mono (for code/technical content)

**Character:** Geist is a geometric sans with humanist warmth — sharp enough for UI labels, warm enough for body text. Single-family across all weights eliminates pairing decisions.

### Hierarchy

- **Heading** (semibold, 1.5rem, -0.02em tracking): Page titles ("Нэвтрэх", "Бүртгүүлэх"). One per page, centered.
- **Body** (regular, 0.875rem): Form labels, descriptions, helper text. Max 65ch.
- **Label** (medium, 0.875rem): Form field labels. Paired with inputs.
- **Small** (regular, 0.75rem): Error messages, footnotes, link text.

### Named Rules

**The Single Weight Rule.** Geist carries headings, body, labels, and buttons. No display font, no serif pairing. Weight variation (400/500/600) creates hierarchy.

## 4. Elevation

This system is flat by design. Cards and backgrounds share `oklch(0.98 0.005 80)`. Depth is conveyed through:

- **Borders**: 1px `border-color` on inputs, buttons, and dividers
- **Tinted backgrounds**: `bg-primary/5` for last-used state, `bg-destructive/10` for errors
- **Ring indicators**: `ring-1 ring-primary/30` for selected states

No box-shadows are used anywhere in the auth system.

### Shadow Vocabulary

None. The flat model is deliberate.

### Named Rules

**The No-Shadow Rule.** Surfaces are flat at rest. If a shadow ever appears, it must signal an active state (drag, popover), not decoration.

## 5. Components

### Buttons

- **Shape:** rounded-lg (12px)
- **Primary:** bg-primary, text-primary-foreground, h-11 (44px). Loading state: spinner + text swap. Focus: outline-ring.
- **OAuth / Sign-In Method:** bg-card, border-border, h-12 (48px). Last-used variant: border-primary/40, bg-primary/5, ring-1 ring-primary/30. Focus: outline-ring.
- **Ghost / Link:** text-foreground, no background. Hover: text-primary transition.

### Inputs

- **Shape:** rounded-lg (12px), h-10 (40px)
- **Style:** border border-input, bg-card, px-3, text-sm
- **Focus:** outline-2 outline-offset-2 outline-ring
- **Password fields:** Include visibility toggle (EyeIcon/EyeSlashIcon from @phosphor-icons/react) positioned at right-2, vertically centered. Toggle has tabIndex={-1} to skip keyboard focus (the input itself receives focus).

### Dividers

- Border-t border-border with centered uppercase label ("ЭСВЭЛ")
- Label: text-xs uppercase, bg-card px-2, text-muted-foreground

### Error Alerts

- rounded-lg, bg-destructive/10, px-3 py-2, text-sm text-destructive
- Used for both form-level and OAuth error messages

### Auth Layout

- Centered card: max-w-sm, flex items-center justify-center
- Zuiio logo wordmark above page heading (32px SVG icon + "Zuiio" text)
- Logo links to home (/), has hover opacity transition

## 6. Do's and Don'ts

### Do:

- **Do** use `text-foreground` for all interactive text (links, labels) — it has 18.99:1 contrast.
- **Do** use `outline-ring` for all focus indicators — it has 5.96:1 contrast.
- **Do** include password visibility toggles on all password fields.
- **Do** show loading spinners on submit buttons during async operations.
- **Do** keep the teal primary for submit buttons only — never for text links.
- **Do** use Mongolian for all user-facing copy.

### Don't:

- **Don't** use `text-primary` for links or interactive text — it fails WCAG AA (2.23:1).
- **Don't** add floating badges over buttons — use ring/tint states instead.
- **Don't** use box-shadows on cards or inputs — the system is flat.
- **Don't** render hidden elements for OAuth flows — use `prompt()` directly.
- **Don't** use `text-muted-foreground` for essential information — actual contrast is ~4.14:1, which fails WCAG AA.
- **Don't** pair Geist with another sans-serif — single family carries all weights.
