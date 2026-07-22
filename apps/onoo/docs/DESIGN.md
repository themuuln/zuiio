---
> **English summary:** Onoo design language — dark-first, broadcast-energy aesthetic. OKLch color system with brand-orange (`oklch(0.68 0.20 40)`) and brand-purple (`oklch(0.55 0.24 285)`), stepped dark surfaces (`--surface-1` through `--surface-3`), semantic tokens for sports (positive=green, negative=red, live-pulse=#ff4444). Design principles: stats as story (charts > tables), athlete-first, Mongolia-ready (360px width, Cyrillic text spacing), cold-start friendly empty states, no signup gating.
---

# Оноо Design System

> **Харанхуй canvas. Broadcast energy. Stat-ууд бол түүх.**

Onoo бол Монголын сагсан бөмбөгийн статистикийн платформ. Design language нь **хүчтэй, immersive, шударга** байх ёстой — near-black canvas дээр бүх stat highlight reel шиг харагдана.

---

## Дизайн зарчим

1. **Stat бол spreadsheet биш, түүх.** Тоо баримт нь визуал, хөдөлгөөнтэй, хуваалцахад амар highlight reel шиг байх ёстой. Table-ээс илүү chart, footnote-оос илүү badge хэрэглэнэ.

2. **Broadcast energy.** Сайн спортын дэлгэцийн адил one-screen glance дээр ойлгогдох ёстой.

3. **Монгол хэлний уншигдах чадвар.** Кирилл Монгол текст илүү өргөн байдаг тул layout-аа түүнд тааруулна.

4. **Харанхуй canvas.** Background нь бараан, surfaces нь шаталсан, acccent нь тод байна.

5. **Empty state ч гэсэн дизайнтай.** Өгөгдөлгүй үед ч систем бэлэн мэт харагдана.

---

## Өнгөний систем

Onoo бүх өнгөнд **OKLch** ашиглана — perceptual uniformity, dark/light behavior, smooth interpolation.

### Brand palette

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-orange` | `oklch(0.68 0.20 40)` | Гол action color, sports energy |
| `--brand-orange-light` | `oklch(0.78 0.16 40)` | Light highlights |
| `--brand-purple` | `oklch(0.55 0.24 285)` | Premium accent |
| `--brand-purple-light` | `oklch(0.65 0.20 285)` | Lighter purple fills |

### Surface hierarchy

Шаталсан dark surface system ашиглана. Өндөр түвшин бүр илүү тод болж гүн мэдрэмж өгнө.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `oklch(0.09 0.005 60)` | Global background |
| `--surface-1` | `oklch(0.11 0.005 60)` | Cards, panels |
| `--surface-2` | `oklch(0.12 0.005 60)` | Elevated surfaces |
| `--surface-3` | `oklch(0.14 0.005 60)` | Hover / active states |
| `--ink` | `oklch(0.98 0.005 60)` | Primary text |

### Semantic tokens (dark mode — default)

Onoo нь **dark-first**.

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `oklch(0.68 0.20 40)` | Primary CTA, links |
| `--primary-foreground` | `oklch(0.98 0.005 60)` | Text on primary |
| `--secondary` | `oklch(0.55 0.24 285)` | Secondary accent |
| `--secondary-foreground` | `oklch(0.98 0.005 60)` | Text on secondary |
| `--muted` | `oklch(0.14 0.005 60)` | Muted panels |
| `--muted-foreground` | `oklch(0.72 0.01 60)` | Helper text |
| `--accent` | `oklch(0.18 0.01 60)` | Hover states |
| `--accent-foreground` | `oklch(0.98 0.005 60)` | Accent text |
| `--destructive` | `oklch(0.63 0.20 25)` | Errors / dangerous actions |
| `--border` | `oklch(1 0 0 / 8%)` | Soft borders |
| `--input` | `oklch(1 0 0 / 15%)` | Input borders |
| `--ring` | `oklch(0.72 0.22 40)` | Focus ring |

### Chart palette

Stat visualization-д зориулагдсан.

| Token | Value | Usage |
|-------|-------|-------|
| `--chart-1` | `oklch(0.68 0.20 40)` | Primary series |
| `--chart-2` | `oklch(0.55 0.24 285)` | Secondary series |
| `--chart-3` | `oklch(0.78 0.18 55)` | Warm accent |
| `--chart-4` | `oklch(0.65 0.20 285)` | Light purple |
| `--chart-5` | `oklch(0.78 0.18 55)` | Amber |

### Өнгөний утга

- **Orange (40°)** — гол action өнгө. Energy, competition, heat. Basketball court-ийн amber floor ба Монголын спортын broadcast уламжлалаас санаа авсан.
- **Purple (285°)** — premium accent. Depth, quality, authority.
- **Near-black background** — төвлөрөл, immersion. Stat бүр урдаас гарч ирнэ.

### Token usage rules

- `--primary`-г fill-only болгон ашиглана. Background дээр text болгон дангаар нь бүү хэрэглэ.
- `--brand-purple`-ийг chrome болон accent-д ашиглана, interactive element-д биш.
- Interactive purple хэрэгтэй бол `--secondary` ашиглана.

---

## Typography

Onoo гурван typeface ашиглана.

| Role | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Display | **Oswald** | 600–800 | 24–60px | Hero, leaderboard, stat number |
| Body | **Inter** | 400–600 | 12–18px | Бүх UI текст |
| Stat | **JetBrains Mono** | 700 | 14–48px | Tabular numerals, stat display |

### Font сонголтын шалтгаан

**Oswald** — condensed, bold, athletic. Jersey typography ба broadcast score overlay-оос санаа авсан. 360px mobile дээр том stat-ыг зай бага ашиглан харуулахад тохиромжтой.

**Inter** — цэвэр, маш сайн уншигддаг, Кирилл glyph сайн. Бүх UI текстийн үндсэн font.

**JetBrains Mono** — табличлагдсан тоонуудаар stat column-уудыг тэнцүүлнэ.

### Scale

```css
--text-xs:   0.75rem  (12px)  — Labels, metadata, timestamps
--text-sm:   0.875rem (14px)  — Secondary body text
--text-base: 1rem     (16px)  — Default body
--text-lg:   1.125rem (18px)  — Section lead text
--text-xl:   1.25rem  (20px)  — Card titles
--text-2xl:  1.5rem   (24px)  — Subheadings
--text-3xl:  1.875rem (30px)  — Hero stat numbers
--text-4xl:  2.25rem  (36px)  — Large score headers
--text-5xl:  3rem     (48px)  — Display numbers
--text-6xl:  3.75rem  (60px)  — Score numbers
```

### Type classes

```css
.type-display  — Oswald 800, letter-spacing -0.02em, line-height 1.1
.type-body     — Inter 400/500, line-height 1.6
.type-label    — Inter 600, uppercase, letter-spacing 0.08em
.type-score    — JetBrains Mono 700, tabular-nums, letter-spacing -0.03em
```

### Usage rules

- **Oswald display** — impact moments, hero sections, leaderboard rankings. Body text-д бүү хэрэглэ.
- **Inter body** — бүх functional UI-д.
- **JetBrains Mono stats** — scores, shooting percentages, stat lines.
- Монгол кирилл текст нь англиас ~1.5–2x урт байж болно. Орон зай давчуу бол `truncate` болон `flex-shrink-0` хэрэглэ.

---

## Spacing

4px base unit. Бүх spacing нь 4-ийн үржвэр байна.

```css
--space-1: 0.25rem  (4px)
--space-2: 0.5rem   (8px)
--space-3: 0.75rem  (12px)
--space-4: 1rem     (16px)
--space-6: 1.5rem   (24px)
--space-8: 2rem     (32px)
--space-12: 3rem    (48px)
--space-16: 4rem    (64px)
```

---

## Border radius

| Token | Value | Used for |
|-------|-------|----------|
| `--radius-sm` | `0.5rem` | Inputs, pills |
| `--radius-md` | `0.75rem` | Cards, panels |
| `--radius-lg` | `1rem` | Large cards |
| `--radius-xl` | `1.5rem` | Hero surfaces |
| `--radius-full` | `9999px` | Chips, avatars |

---

## Shadows

Near-black canvas дээр ердийн shadow сайн ажиллахгүй. Тиймээс Onoo нь **surface elevation** + маш зөөлөн glow ашиглана.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-1` | `0 1px 2px rgb(0 0 0 / 0.3)` | Tiny separation |
| `--shadow-2` | `0 8px 24px rgb(0 0 0 / 0.45)` | Cards, dialogs |
| `--shadow-3` | `0 16px 48px rgb(0 0 0 / 0.55)` | Modals, drawers |
| `--glow-primary` | `0 0 0 1px rgb(255 148 0 / 0.2), 0 0 32px rgb(255 148 0 / 0.18)` | Primary highlight |
| `--glow-secondary` | `0 0 0 1px rgb(171 92 255 / 0.2), 0 0 32px rgb(171 92 255 / 0.16)` | Secondary highlight |

---

## Motion

### Durations

| Token | Value | Used for |
|-------|-------|----------|
| `--duration-fast` | 150ms | Hover, small transitions |
| `--duration-normal` | 250ms | Standard transitions |
| `--duration-slow` | 400ms | Page transitions, emphasis |

### Easing

| Token | Value | Character |
|-------|-------|-----------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exiting |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful snap |

### Principles

- Motion purpose-тэй байх ёстой: state change, attention, confirmation.
- `prefers-reduced-motion`-ийг үргэлж дагана.
- Drawer, modal зэрэг physical UI-д spring мэдрэмж ашиглана.

---

## Component patterns

### Cards

- Dark card background дээр subtle top border highlight хэрэглэнэ.
- Padding: `24px` standard, `16px` compact.
- Hover дээр elevation болон border intensity бага зэрэг нэмэгдэнэ.

### Buttons

- Primary button = orange fill.
- Secondary button = purple or outline.
- Focus ring тод, accessibility-тэй байна.

### Badges

- Pill shape, жижиг uppercase label, tabular numbers хэрэглэнэ.
- Status badge-ууд color meaning-ээ consistent байлгана.

### Tables

- Sticky header, zebra row, compact density.
- Mobile дээр шаардлагагүй column-уудыг нуух.

### Empty states

- Icon + heading + тайлбар + нэг primary CTA.
- Орчуулга нь Монгол хэл дээр байх ёстой.

---

## Responsive rules

- Mobile-first.
- 360px width дээр бүх surface ажиллах ёстой.
- Table-ийг card, stack, collapse pattern рүү шилжүүлж болно.
- Mongolian text-д line-clamp / truncate хэрэгтэй бол ашиглана.

---

## Accessibility

- Focus state үргэлж харагдана.
- Color alone-оор meaning дамжуулахгүй.
- Contrast өндөр, touch target дор хаяж 44px.
- Icon-only control-д aria-label өгнө.

---

## Non-goals

- Figma sync байхгүй.
- Image generation байхгүй.
- Framer Motion ашиглахгүй.
- Hardcoded hex болон arbitrary Tailwind value ашиглахгүй.

---

## Components

(none yet)

## Decisions

- 2026-07-22 — Dark-first system, orange/purple brand palette, Oswald + Inter + JetBrains Mono stack.

## Implementation notes

- Tokens нь `src/styles/globals.css` дотор байх ёстой.
- Tailwind config нь эдгээр CSS variables-тай таарна.
- New component бүр design tokens дээр тогтоно.
