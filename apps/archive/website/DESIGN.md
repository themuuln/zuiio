---
name: Zuiio Website
description: Marketing site for Mongolian business software — practical, proud, warm.
colors:
  brand-violet: "oklch(0.5 0.26 275)"
  brand-violet-light: "oklch(0.65 0.22 275)"
  brand-violet-dim: "oklch(0.38 0.24 275)"
  brand-teal: "oklch(0.7 0.16 195)"
  brand-teal-light: "oklch(0.82 0.12 195)"
  background: "oklch(0.99 0.003 275)"
  foreground: "oklch(0.12 0.018 275)"
  card: "oklch(0.97 0.004 275)"
  muted: "oklch(0.94 0.008 275)"
  muted-foreground: "oklch(0.45 0.025 275)"
  border: "oklch(0.9 0.01 275)"
  primary: "oklch(0.5 0.26 275)"
  primary-foreground: "oklch(0.99 0.003 275)"
  accent: "oklch(0.92 0.06 195)"
  destructive: "oklch(0.55 0.22 20)"
  tumurch-ochre: "oklch(0.7 0.16 75)"
  tamga-rose: "oklch(0.6 0.18 15)"
  zuiio-id-slate: "oklch(0.55 0.02 260)"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.5rem + 4.5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(0.9375rem, 0.875rem + 0.35vw, 1rem)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "24px"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
  "20": "5rem"
  "24": "6rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, var(--color-primary) 90%, transparent)"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1.5rem"
---

# Design System: Zuiio Website

## 1. Overview

**Creative North Star: "The Practical Workshop"**

This is a design system for Mongolian business software that respects its audience's intelligence and time. No decorative flourishes, no corporate theater, no adapted-from-English templates. Every element earns its space with real information. The system explicitly rejects generic SaaS cream pages, corporate enterprise aesthetics, and tech-startup-with-no-product landing pages.

The aesthetic is clean and confident: Instrument Serif headings carry editorial weight without pretension, Geist body text communicates with clarity, and a committed violet/teal palette gives the brand a distinctive two-tone identity. Spacing varies for rhythm — generous around hero moments, tight around related content — creating a page that breathes without being sparse.

**Key Characteristics:**
- Serif + sans font pairing with genuine contrast
- Committed violet/teal palette (not timid, not drenched)
- Fluid type scale via clamp() for marketing headings
- Content-first: no section exists without purpose
- Mongolian-first: works in Cyrillic before English

## 2. Colors

A committed two-accent palette: violet carries the brand identity, teal provides contrast and secondary emphasis. Neutrals are tinted toward the violet hue (chroma 0.003–0.025 at hue 275), not toward warmth-by-default.

### Primary
- **Brand Violet** (oklch(0.5 0.26 275)): Primary brand color. Used for CTAs, active states, focus rings, links, and the hero glow. Carries ~30% of the surface on accent surfaces.
- **Violet Light** (oklch(0.65 0.22 275)): Dark mode primary. Lighter for contrast on dark backgrounds.
- **Violet Dim** (oklch(0.38 0.24 275)): Deep variant for hover states and emphasis.

### Secondary
- **Brand Teal** (oklch(0.7 0.16 195)): Secondary accent. Used for the Tolom product variant, secondary highlights, and the teal glow in gradients. Provides warm-cool contrast against the violet.
- **Teal Light** (oklch(0.82 0.12 195)): Light variant for backgrounds and subtle accents.

### Neutral
- **Background** (oklch(0.99 0.003 275)): Near-white body background with minimal violet tint.
- **Foreground** (oklch(0.12 0.018 275)): Primary text color. Dark violet-tinted near-black.
- **Card** (oklch(0.97 0.004 275)): Card/surface background, slightly warmer than body.
- **Muted** (oklch(0.94 0.008 275)): Subtle background for pricing sections and secondary surfaces.
- **Muted Foreground** (oklch(0.45 0.025 275)): Secondary text, descriptions, captions. Darkened for WCAG AA contrast.
- **Border** (oklch(0.9 0.01 275)): Dividers and card borders.

### Named Rules
**The Two-Accent Rule.** Violet and teal are the only accent colors. No third accent should appear without replacing one of the two. Product variants (Tumurch ochre, Tamga rose) are limited to their product card context and never leak into global UI.

## 3. Typography

**Display Font:** Instrument Serif (with Georgia, serif fallback)
**Body Font:** Geist (with system sans-serif fallback)

**Character:** The pairing creates editorial contrast — a warm, confident serif for headlines against a clean, modern sans for body text. Instrument Serif at weight 400 provides enough presence without needing bold; Geist carries the body with neutral clarity.

### Hierarchy
- **Display** (400, clamp(2.5rem, 1.5rem + 4.5vw, 4.5rem), 1.1): Hero headlines only. Instrument Serif. Maximum impact.
- **Headline** (600, clamp(1.625rem, 1.2rem + 1.8vw, 2.25rem), 1.2): Section headings. Instrument Serif via `--font-display`.
- **Title** (600, clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem), 1.3): Sub-section headings. Geist semibold.
- **Body** (400, clamp(0.9375rem, 0.875rem + 0.35vw, 1rem), 1.5): Paragraphs, descriptions. Geist regular. Max width 65ch.
- **Label** (500, clamp(0.8125rem, 0.75rem + 0.3vw, 0.875rem), 0.02em): Navigation, buttons, metadata. Geist medium.

### Named Rules
**The Balance Rule.** All h1–h3 use `text-wrap: balance` for even line lengths. All paragraphs use `text-wrap: pretty` to reduce orphans. No exceptions.

## 4. Elevation

This system uses a hybrid approach: subtle shadows for depth at rest, enhanced shadows on hover/focus. Shadows are ambient (diffuse, not directional) and never exceed 8px blur on cards.

### Shadow Vocabulary
- **xs** (`0 1px 2px oklch(0 0 0 / 0.05)`): Button resting state, subtle lift.
- **sm** (`0 1px 3px oklch(0 0 0 / 0.1), 0 1px 2px -1px oklch(0 0 0 / 0.1)`): Button hover, small element lift.
- **md** (`0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)`): Card resting state.
- **lg** (`0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)`): Dropdown, elevated panels.
- **brand** (`0 0 0 1px oklch(0.50 0.26 275 / 0.15), 0 4px 12px oklch(0.50 0.26 275 / 0.12)`): Primary button focus/active with violet glow.
- **card-hover** (`0 4px 12px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.06)`): Card hover state.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest (border only). Shadows appear as a response to state (hover, elevation, focus). Cards never pair `border: 1px solid` with `box-shadow` blur ≥ 16px — pick one, not both.

## 5. Components

### Buttons
- **Shape:** 12px radius (`--radius-lg`)
- **Primary:** Violet background, white text, `0.75rem 1.5rem` padding, `shadow-xs` at rest
- **Hover:** 90% opacity violet, translateY(-1px), `shadow-sm`. Ease-out 120ms.
- **Active:** scale(0.97), translateY(0). No bounce.
- **Secondary:** White background, 1px border, dark text. Same hover/active pattern.

### Cards / Containers
- **Corner Style:** 16px radius (`--radius-xl`) for bento cells, 16px for product cards
- **Background:** `{colors.card}` at rest
- **Shadow Strategy:** Border at rest, `shadow-card-hover` on hover. Never both border + wide shadow.
- **Border:** 1px solid `{colors.border}`
- **Internal Padding:** `--space-6` (24px) standard, `--space-8` (32px) for featured cards

### Navigation
- **Style:** Sticky header, `bg-background/80` with `backdrop-blur-lg`
- **Typography:** Geist medium, `--text-sm`
- **Active state:** Violet underline indicator (2px, 24px wide, centered)
- **Mobile:** Full-screen overlay dialog with larger touch targets

### Product Cards
- **Abstract UI Panel:** CSS-only app mockup with header bar, optional sidebar, content placeholders. Each variant uses its accent color at low opacity.
- **Hover:** Sidebar fades in (opacity transition), content shifts up 2px.
- **Entrance:** Staggered fade-up animation (80ms delay per card, 5 max).

### Bento Grid (Features)
- **Layout:** 3×3 grid with hero cell spanning 2 columns + 2 rows
- **Cell styling:** Same as cards — border, card bg, hover lift
- **Gap:** 24px (`--space-6`)

### Testimonials
- **Layout:** 2-column grid, flex-col with `border-t` separator before attribution
- **Quote:** Geist regular, `--text-base`, `leading-relaxed`
- **Attribution:** Avatar (initials), name, role, company badge (styled pill)

## 6. Do's and Don'ts

### Do:
- **Do** use Instrument Serif for headings and Geist for body — the serif/sans contrast is the brand's typographic signature.
- **Do** use `text-wrap: balance` on all h1–h3 elements for even line lengths.
- **Do** vary section spacing for rhythm: generous for hero/CTA, tight for related content.
- **Do** use the violet/teal palette consistently — no third accent without replacing one.
- **Do** show real product evidence (screenshots, UI mockups) — never ship text-only product descriptions.
- **Do** include "Монголд бүтээсэн · Ulaanbaatar" origin badge in the hero.
- **Do** use `prefers-reduced-motion` — all animations must have a reduced-motion alternative.

### Don't:
- **Don't** use border-left or border-right greater than 1px as a colored accent on cards or list items.
- **Don't** use gradient text (`background-clip: text`).
- **Don't** use bounce or elastic easing — all transitions use exponential ease-out.
- **Don't** pair `border: 1px solid X` with `box-shadow` blur ≥ 16px on the same element.
- **Don't** use `border-radius` ≥ 24px on cards or sections.
- **Don't** put tiny uppercase tracked eyebrows above every section — one kicker is voice, repetition is AI grammar.
- **Don't** use numbered section markers (01/02/03) as default scaffolding.
- **Don't** ship identical card grids with icon + heading + text repeated everywhere.
- **Don't** use generic SaaS cream/beige as the body background.
- **Don't** adapt-from-English templates with Mongolian text pasted in — the site must feel built for Mongolia.
