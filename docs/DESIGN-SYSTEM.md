# DESIGN-SYSTEM.md — Developer Quick Reference

All tokens live in `@zuiio/branding`. CSS is the source of truth; this doc is the map.

## 1. Color Tokens (OKLch)

All colors use OKLch for perceptual uniformity. Format: `oklch(L C H)`.

**Brand Primitives:**
`--brand-violet` `oklch(0.50 0.26 275)` primary · `--brand-violet-light` `oklch(0.65 0.22 275)` hover · `--brand-teal` `oklch(0.70 0.16 195)` accent · `--brand-teal-light` `oklch(0.82 0.12 195)` light accent

**Key Semantic Tokens (light → dark):**

| Token | Light | Dark |
|-------|-------|------|
| `--color-background` | `oklch(0.99 0.003 275)` | `oklch(0.10 0.018 275)` |
| `--color-foreground` | `oklch(0.12 0.018 275)` | `oklch(0.96 0.005 275)` |
| `--color-primary` | `oklch(0.50 0.26 275)` | `oklch(0.65 0.22 275)` |
| `--color-destructive` | `oklch(0.55 0.22 20)` | `oklch(0.60 0.20 20)` |
| `--color-border` | `oklch(0.90 0.010 275)` | `oklch(0.22 0.022 275)` |

Full set: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` + `-foreground` pairs + sidebar tokens. **Rule:** Never use raw hex/rgb. Always reference CSS variables or OKLch.

## 2. Typography

**Fonts:** Body `Geist Sans` (`--font-sans`) · Display `Instrument Serif` (`--font-display`) · Mono `Geist Mono` (`--font-mono`). Multi-tenant apps use `FONT_OPTIONS` via `BrandConfig`.

**Fluid scale (CSS clamp):**
```
--text-xs:  clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem)
--text-sm:  clamp(0.8125rem, 0.75rem + 0.3vw, 0.875rem)
--text-base:clamp(0.9375rem, 0.875rem + 0.35vw, 1rem)
--text-lg:  clamp(1.0625rem, 0.95rem + 0.5vw, 1.125rem)
--text-xl:  clamp(1.1875rem, 1rem + 0.8vw, 1.375rem)
--text-2xl: clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem)
--text-3xl: clamp(1.625rem, 1.2rem + 1.8vw, 2.25rem)
--text-4xl: clamp(1.875rem, 1.3rem + 2.5vw, 2.75rem)
--text-5xl: clamp(2.25rem, 1.4rem + 3.5vw, 3.5rem)
--text-6xl: clamp(2.5rem, 1.5rem + 4.5vw, 4.5rem)
```
**Weights:** UI `400–500` · Headings `600–700` · Display `400`. **Line heights:** UI `1.4–1.5` · Body `1.6` · Display `1.1–1.2`.

## 3. Spacing

4px base unit. All spacing is multiples of 4.

```
--space-1: 4px   --space-4: 16px  --space-8: 32px   --space-16: 64px
--space-2: 8px   --space-5: 20px  --space-10: 40px  --space-20: 80px
--space-3: 12px  --space-6: 24px  --space-12: 48px  --space-24: 96px
```
Use `gap-*` with flex, `size-*` when width equals height, `space-*` for layout rhythm.

## 4. Component Conventions

**Style:** shadcn `new-york` · **Radius:** `--radius: 8px` · **Icons:** `@phosphor-icons/react` (`regular`, `fill` for active)

**Shadows** (never pair shadow + border on same element):
`--shadow-xs` inputs/tags · `--shadow-sm` cards at rest · `--shadow-md` cards raised · `--shadow-lg` modals/drawers · `--shadow-brand` CTAs · `--shadow-card-hover` hover lift

**Overlay selection:** Form → Sheet (right) · Destructive → Dialog (center) · Mobile → Drawer (bottom) · Quick info → Popover

**Forms:** Vertical stack: Label → Input → Helper/Error. Required = asterisk in `--destructive`, never "(required)".

## 5. Mongolian-Specific Patterns

**i18n:** All apps use `next-intl`, `mn` as default locale. Keys in `messages/mn.json`. Every user-facing string goes through `t("key")`.

**Text layout:**
- Set `lang="mn"` on `<html>` — drives font shaping and line-break behavior
- Mongolian text is ~1.5–2x wider than English — use `min-w` or `flex-shrink-0` on labels
- Use `-webkit-font-smoothing: antialiased` for Cyrillic crispness
- Always apply `truncate` on labels — Mongolian words frequently overflow

**Date/Number formatting:**
```ts
new Intl.DateTimeFormat("mn", { dateStyle: "medium" }).format(date); // 2025 оны 7-р сарын 7
new Intl.NumberFormat("mn").format(1234567); // 1,234,567
```

**Font choice:** Prefer `Noto Sans` or `Inter` — both have strong Cyrillic coverage. Verify glyphs before choosing from `FONT_OPTIONS`. Mongolian uses horizontal Cyrillic layout (no vertical CJK).
