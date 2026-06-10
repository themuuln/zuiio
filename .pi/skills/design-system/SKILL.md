---
name: design-system
description: Tolom design system — spacing scale, typography, color tokens, animation patterns, and component composition rules. Use when creating new UI components, adjusting layouts, adding animations, modifying themes, or reviewing visual consistency.
---

# Design System

Tolom's visual language. Enforce these rules on every UI change.

---

## Color Tokens

**Only semantic tokens.** Never raw colors.

```tsx
// ✅ CORRECT
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="border-border">

// ❌ FORBIDDEN
<div className="bg-blue-500 text-white">
<div className="bg-gray-100">
<div className="border-gray-300">
```

### Token Reference

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Page background |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Card surfaces |
| `primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Buttons, links |
| `secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Subtle surfaces |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Disabled, placeholders |
| `destructive` | `oklch(0.577 0.245 27)` | `oklch(0.704 0.191 22)` | Errors, delete actions |
| `accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Hover states |
| `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | All borders |
| `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Input borders |
| `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Focus rings |

### Adding New Colors

1. Add CSS variable in `globals.css` under `:root` and `.dark`
2. Expose via `@theme inline` block
3. Use the semantic name everywhere — never the raw value

---

## Spacing Scale

Tailwind's default scale. Use these values — no arbitrary numbers.

| Token | Value | Use |
|-------|-------|-----|
| `p-1` / `gap-1` | `0.25rem` | Tight internal spacing |
| `p-2` / `gap-2` | `0.5rem` | Compact groups |
| `p-3` / `gap-3` | `0.75rem` | Card internals |
| `p-4` / `gap-4` | `1rem` | Standard spacing |
| `p-5` / `gap-5` | `1.25rem` | Card padding (tablet) |
| `p-6` / `gap-6` | `1.5rem` | Section spacing |
| `p-8` / `gap-8` | `2rem` | Page-level spacing |

### Rules

- **`gap-*` with flex, not `space-y-*` or `space-x-*`** — gap is more predictable with wrapping
- **`size-*` when width equals height** — `size-10` instead of `w-10 h-10`
- **No arbitrary spacing** — if the scale doesn't have it, the design is wrong
- **Consistent card padding** — `p-4` mobile, `p-5` tablet (via `.tablet-touch`)

---

## Typography

### Font Stack

```css
--font-sans: var(--font-sf-pro);    /* Body text */
--font-mono: var(--font-mono);      /* Code, IDs */
--font-heading: var(--font-sans);   /* Headings = body font */
```

### Type Scale

| Class | Size | Use |
|-------|------|-----|
| `text-xs` | `0.75rem` | Labels, badges |
| `text-sm` | `0.875rem` | Secondary text, descriptions |
| `text-base` | `1rem` | Body text |
| `text-lg` | `1.125rem` | Card titles |
| `text-xl` | `1.25rem` | Section headings |
| `text-2xl` | `1.5rem` | Page titles |
| `text-3xl` | `1.875rem` | Hero numbers (KPIs) |

### Rules

- **`font-semibold` for headings**, not `font-bold` — lighter weight reads better on screens
- **`text-muted-foreground` for secondary text** — never `text-gray-500`
- **`truncate` for overflow** — shorthand for `overflow-hidden text-ellipsis whitespace-nowrap`
- **No arbitrary font sizes** — use the scale

---

## Component Composition

### shadcn First

Always use shadcn components from `src/components/ui/`. Never build from raw HTML what the library provides.

```tsx
// ✅ CORRECT — use shadcn
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ❌ FORBIDDEN — raw HTML
<button className="rounded-md bg-black px-4 py-2 text-white">
<div className="rounded-lg border bg-white p-6 shadow-lg" role="dialog">
```

### Compound Components

Compose with sub-components, not props soup:

```tsx
// ✅ CORRECT
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
    <CardDescription>Monthly total</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-semibold">$12,345</p>
  </CardContent>
</Card>

// ❌ FORBIDDEN
<Card title="Revenue" description="Monthly total" content={<p>$12,345</p>} />
```

### Extract at 3+

| Copies | Action |
|--------|--------|
| 1-2 | Inline className |
| 3+ | Extract component |

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | `kebab-case.tsx` | `work-order-form.tsx` |
| Private sub-component | `_`-prefixed | `_bay-action-handlers.ts` |
| Hook | `use-` prefixed | `use-customer-data.ts` |
| Type file | `_types.tsx` or `_types.ts` | `_types.tsx` |
| Constants | `_constants.tsx` | `_constants.tsx` |
| Schema | `_schema.ts` | `_schema.ts` |

---

## Animations

### Preset Keyframes

Use these defined in `globals.css` — don't add new keyframes unless absolutely necessary:

| Name | Effect | Use |
|------|--------|-----|
| `fade-slide-in` | Slide + fade from left | Sidebar items, list entries |
| `fade-slide-out` | Slide + fade to left | Removing items |
| `scale-in` | Scale up from 0.95 | Dialogs, popovers |
| `slide-up` | Slide up from 8px | Tooltips, dropdowns |
| `pulse-soft` | Gentle opacity pulse | Loading indicators |
| `wave` | Border color wave | Active status |
| `glow` | Border + shadow glow | In-progress items |
| `breathe` | Scale + opacity | Subtle idle animation |
| `shine` | Horizontal shine sweep | Loading skeleton |
| `icon-bounce` | Vertical bounce | Notification icons |
| `urgent-flash` | Background flash | Urgent attention |
| `progress-stripe` | Moving stripe pattern | Progress bars |
| `pulse-ring` | Expanding ring | Active indicators |

### Easing Functions

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);   /* Snappy deceleration */
--ease-in-expo: cubic-bezier(0.7, 0, 0.84, 0);    /* Smooth acceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* Gentle deceleration */
```

### Rules

- **Use `animation-duration` under 300ms** for UI feedback
- **Use `animation-fill-mode: backwards`** for entrance animations
- **Respect `prefers-reduced-motion`** — wrap non-essential animations:

```tsx
// ✅ CORRECT
className="animate-fade-slide-in dark:hidden
  [:parent>&]:motion-reduce:animate-none"
```

---

## Tablet Touch Patterns

For tablet-optimized sections, use the `.tablet-touch` wrapper:

```tsx
<div className="tablet-touch">
  {/* Cards get p-5 on tablet */}
  {/* Interactive elements get min-h-44px */}
  {/* Tap highlight disabled */}
</div>
```

### Rules

- **`min-h-[44px]` for all touch targets** — Apple HIG minimum
- **`-webkit-tap-highlight-color: transparent`** — no blue flash
- **`touch-action: manipulation`** — disable double-tap zoom
- **Container queries** for responsive padding: `@container (min-width: 768px)`

---

## Z-Index Layers

Use the custom `z-*` utilities for overlay stacking:

| Layer | Value | Use |
|-------|-------|-----|
| `z-50` | 50 | Default dialogs, sheets |
| `z-51` to `z-60` | 51-60 | Stacked overlays (Sheet → Sheet) |

Never use arbitrary z-index values like `z-[9999]`.

---

## Dark Mode

### Class Strategy

Toggle via `.dark` class on `<html>`:

```tsx
<html className={darkMode ? 'dark' : ''}>
```

### Rules

- **Use semantic tokens** — they auto-switch between light/dark
- **Never hardcode both modes** in className: `bg-white dark:bg-gray-900` is wrong if `bg-card` works
- **Exception:** `dark:hidden` / `hidden dark:block` for mode-specific content

---

## Validation Checklist

Before merging any UI change:

- [ ] Only semantic color tokens used (`bg-primary`, `text-muted-foreground`, etc.)
- [ ] No arbitrary spacing values (`mt-[37px]`)
- [ ] `gap-*` with flex, not `space-y-*`
- [ ] `size-*` when width equals height
- [ ] shadcn components used (not raw HTML equivalents)
- [ ] Component extracted if same pattern appears 3+ times
- [ ] File named with kebab-case, `_`-prefix for private
- [ ] Animations use preset keyframes, under 300ms
- [ ] Touch targets ≥ 44px in tablet sections
- [ ] `truncate` for text overflow, not manual utilities
- [ ] No `text-gray-*` — use `text-muted-foreground` or `text-foreground`
