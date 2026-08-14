# TOLOM Design System — Machine-Readable Reference

> This file is the AI agent's primary design context. Read this before any UI work.
> Full design rationale lives in `DESIGN.md`. Product context in `PRODUCT.md`.

---

## Token Map

### Colors (OKLCH — semantic names)

| Token | Value | Usage |
|---|---|---|
| `--primary` | `oklch(0.205 0 0)` | Primary buttons, active states, selections |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on primary |
| `--background` | `oklch(1 0 0)` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | Body text, headings |
| `--card` | `oklch(1 0 0)` | Card surfaces |
| `--card-foreground` | `oklch(0.145 0 0)` | Text on cards |
| `--muted` | `oklch(0.97 0 0)` | Secondary surfaces, hover |
| `--muted-foreground` | `oklch(0.556 0 0)` | Placeholder, secondary labels |
| `--border` | `oklch(0.922 0 0)` | Borders, dividers, input strokes |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Destructive actions, errors ONLY |
| `--ring` | `oklch(0.708 0 0)` | Focus rings |

**Tailwind classes:** `bg-primary`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-destructive`, `ring-ring`

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Inline gaps, icon padding |
| `sm` | 8px | Compact spacing, badge padding |
| `md` | 12px | Default gap between related items |
| `lg` | 16px | Card padding, section gaps |
| `xl` | 24px | Section separation |
| `2xl` | 32px | Page-level spacing |
| `3xl` | 48px | Major section breaks |

**Always use `gap-*` with flex. NEVER use `space-y-*` or `space-x-*`.**

### Border Radius Hierarchy

| Token | Value | Use On | NEVER Use On |
|---|---|---|---|
| `rounded-md` | 8px | Segmented controls, inline chips | Buttons, cards |
| `rounded-lg` | 10px | **Buttons, Inputs, Segmented controls, Dropdowns** | Card containers |
| `rounded-xl` | 14px | **Card-level containers** (BayCard, SectionCard, queue items) | Buttons, inputs |
| `rounded-4xl` | ~26px | Badges, status pills, dots | Buttons, cards |
| `rounded-full` | 9999px | Avatars, icon containers | Buttons, cards, inputs |

### Typography

| Role | Weight | Size | Line-Height | Letter-Spacing |
|---|---|---|---|---|
| Headline | 600 | 1.5rem (24px) | 1.3 | -0.02em |
| Title | 600 | 1rem (16px) | 1.4 | — |
| Body | 400 | 0.875rem (14px) | 1.5 | — |
| Label | 500 | 0.75rem (12px) | 1.4 | 0.01em |

**Font:** SF Pro Display → Inter → system-ui. **ONE family only.** No serif, no decorative.

### Motion

| Property | Value |
|---|---|
| Duration | 150–250ms (micro), ≤400ms (complex) |
| Easing | `ease-out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`) for entry |
| Easing | `ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`) for emphasis |
| Properties | `transform` and `opacity` ONLY |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` → crossfade or instant |

### Elevation

| Level | Usage | CSS |
|---|---|---|
| Surface ring | Cards, panels | `ring-1 ring-foreground/10` |
| Floating | Dropdowns, tooltips | `shadow-lg` |
| Modal | Dialogs, sheets | `shadow-xl` |

**Flat by default.** Shadows only on floating/modal elements.

---

## Components (Available)

| Component | Source | Variants |
|---|---|---|
| Button | shadcn/ui | primary, outline, secondary, ghost, destructive; xs/sm/default/lg/icon-* |
| Card | shadcn/ui | default, with footer |
| Badge | shadcn/ui | default (primary), secondary, destructive, outline |
| Input | shadcn/ui | default, error, disabled |
| Select | shadcn/ui | default |
| DetailDrawer | @/components/ui/detail-drawer | Header/Body/Footer compound; sizes md/lg/2xl |
| DataTable | @/components/ui/data-table-page | With pagination, search, filters |
| Sidebar | @/components/ui/sidebar | expanded/collapsed/hover-expanded |

**Never build from scratch what shadcn/ui provides.**

---

## Violation Patterns

Every entry: ❌ BAD → ✅ CORRECT

### Colors

| ❌ Bad | ✅ Correct |
|---|---|
| `bg-blue-500`, `text-red-600` | `bg-primary`, `text-destructive` |
| `#3b82f6`, `rgb(59,130,246)` | `oklch(0.205 0 0)` or semantic token |
| `bg-[#F4F1EA]` (warm cream) | `bg-background` or `bg-card` |
| `bg-red-500` for emphasis | `bg-destructive` ONLY for danger |
| `border-l-4 border-blue-500` (side stripe) | `ring-1 ring-foreground/10` or nothing |

### Spacing

| ❌ Bad | ✅ Correct |
|---|---|
| `space-y-4`, `space-x-2` | `gap-4`, `gap-2` with flex |
| Random pixel values (5px, 13px, 27px) | Use spacing scale: 4/8/12/16/24/32/48px |
| Uniform gaps everywhere (all gap-4) | Vary by hierarchy: tighter for related, wider for sections |

### Border Radius

| ❌ Bad | ✅ Correct |
|---|---|
| `rounded-2xl`, `rounded-3xl` on cards | `rounded-xl` (14px) for card containers |
| `rounded-[32px]` on cards/inputs | `rounded-lg` (10px) for buttons/inputs |
| `rounded-full` on cards | `rounded-xl` for cards; `rounded-full` for avatars/badges only |

### Typography

| ❌ Bad | ✅ Correct |
|---|---|
| Two similar sans-serif fonts | ONE family (SF Pro Display) in multiple weights |
| Serif display font (Playfair, Lora) | SF Pro Display at 600 weight |
| Body text > 75ch line length | Cap at 65–75ch |
| `text-xs` (12px) for body text | `text-sm` (14px) minimum for body |
| All-caps on every section eyebrow | ALL-CAPS only on DetailDrawer.Section eyebrow |

### Elevation & Shadows

| ❌ Bad | ✅ Correct |
|---|---|
| `border: 1px solid X` + `box-shadow: 0 4px 24px ...` | Pick ONE: ring-1 OR shadow, never both |
| `shadow-sm` on cards | `ring-1 ring-foreground/10` for cards |
| Deep shadows on non-floating elements | Shadows only on dropdowns/modals/tooltips |

### Animation

| ❌ Bad | ✅ Correct |
|---|---|
| `transition: all 300ms` | `transition: transform 160ms ease-out-quart, opacity 200ms ease-out` |
| `scale(0)` entry animation | `scale(0.95)` + `opacity: 0` |
| `transition: width 300ms` | `transition: transform 300ms ease-out-quart` |
| `ease-in` on any UI element | `ease-out-quart` for entry, `ease-in-expo` for exit |
| No `prefers-reduced-motion` check | Always provide crossfade/instant alternative |
| All elements appear at once | Stagger list items (30–80ms apart) |

### Patterns

| ❌ Bad | ✅ Correct |
|---|---|
| Gradient text (`background-clip: text`) | Solid color; emphasis via weight or size |
| Emoji as icons (⚙️ 🎨 🚀) | SVG icons (Lucide, Heroicons) |
| Numbered markers on every section (01/02/03) | Numbers only for actual sequences |
| Glassmorphism cards (blur + transparency) | Solid surfaces with ring-1 |
| Side-stripe borders (border-left > 1px) | Full borders, background tints, or nothing |
| Dialog as first choice for detail/edit | DetailDrawer (sheet) first; dialog only for confirmation |
| `bg-background` on surfaces that sit on background | `bg-card` for elevated surfaces |

---

## Anti-AI-Slop Quality Gates

Before shipping ANY UI code, verify:

1. **Token compliance** — No raw hex/rgb/oklch values in TSX class strings. All colors via semantic tokens.
2. **Spacing rhythm** — Gaps vary by hierarchy level. Not all `gap-4`.
3. **Radius hierarchy** — Cards = `rounded-xl`. Buttons/inputs = `rounded-lg`. No `rounded-2xl`+.
4. **Typography** — ONE font family. Body ≥ 14px. Headlines ≤ 24px.
5. **Elevation** — Cards use `ring-1`, not `shadow-*`. Shadows only on floating elements.
6. **Motion** — Transform/opacity only. Duration 150–250ms. Eased with quart/expo curves.
7. **The Slop Test** — Could someone say "AI made that"? If yes, find what's generic and fix it.

---

## DO NOT — Pattern Refusal List

These patterns are automatic rewrites. If you're about to write any of these, stop and use the alternative:

| Pattern | Why It's Wrong | Fix |
|---|---|---|
| Warm cream body background | AI default of 2026 | Use `bg-background` (pure white) |
| Gradient text | Decorative, never meaningful | Solid color + font-weight |
| Side-stripe borders | Visual noise, not information | `ring-1` or background tint |
| Glassmorphism cards | Decorative blur | Solid `bg-card` + `ring-1` |
| Hero-metric template | SaaS cliché | Context-specific layout |
| Identical card grids | Lazy repetition | Vary sizes/content intentionally |
| Eyebrow on every section | AI grammar, not voice | Use sparingly; DetailDrawer.Section only |
| Numbered sections (01/02/03) | Scaffolding by reflex | Only for actual sequences |
| Deep border-radius on cards | Oversized rounding | max 14px (`rounded-xl`) |
| `border` + `box-shadow` together | Ghost-card pattern | Pick one |
