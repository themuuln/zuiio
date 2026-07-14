---
title: Design — Brand & UI Direction
description: Visual identity, color system, typography, component patterns, and design principles for Tamga.
---

# Design — Brand & UI Direction

> The visual and interaction language of Tamga. Every UI decision traces back here.

---

## Brand Identity

### Name

**Tamga** (Тамга) — Mongolian for "brand mark." Evokes tradition, expertise, and deep connection to horses.

### Tagline

> Морины тань цорын ганц үнэн эх сурвалж
> *(The single source of truth for your horse)*

### Brand Personality

| Trait | What It Means in Practice |
|---|---|
| **Trustworthy** | Clean layouts, no visual noise, consistent patterns |
| **Proud** | Rich earth tones, not clinical — this is about heritage |
| **Practical** | Every screen does something useful, no decorative fluff |
| **Mongolian** | Cyrillic labels, MNT currency, аймаг/сум regions, local terminology |

---

## Visual Language

### Design System: Content-First Minimalism

The app follows Apple's Human Interface Guidelines as the structural foundation, overlaid with a warm, earthy color palette that reflects the Mongolian steppe and equestrian culture.

**Non-negotiable rules:**
1. **Zero shadows.** Depth comes from color contrast, not elevation.
2. **No card containers on content.** Use whitespace, hairline separators, and typography weight to create hierarchy.
3. **Typography does the heavy lifting.** Weight and size, never boxes.
4. **One accent color at a time.** Orange for primary actions. Green for nature/health accents only.
5. **Content-first.** Chrome disappears. Data stands out.
6. **4pt grid alignment.** Every element snaps to the 4dp baseline.

---

## Color System

### Primary — Hermes Orange

Derived from oklch(0.68 0.18 42). A vibrant, warm orange that evokes leather, saddlery, and Mongolian craftsmanship.

| Step | Hex | Role |
|---|---|---|
| 50 | `#FFEDE1` | Tinted backgrounds, badge fills |
| 100 | `#FFDBC8` | Hover states on light surfaces |
| 300 | `#E87A48` | Icons, illustrations |
| **500** | **`#F06A2E`** | **★ Brand hero — primary buttons, active nav, prices, links** |
| 600 | `#CC5824` | Button hover/pressed, links hover |
| 700 | `#A14721` | Text on light backgrounds (WCAG AA ✅) |
| 900 | `#5A2A15` | Dark text on orange backgrounds |

**Rule:** Use 500 for large elements only (buttons, icons). Use 600+ for text on white. Never use 500 for body text — contrast is ~3.5:1, fails WCAG AA.

### Secondary — Steppe Green

A nature-inspired green that grounds the app in the Mongolian landscape. Used sparingly — never as button fills.

| Step | Hex | Role |
|---|---|---|
| 50 | `#E8F5EC` | Green tinted backgrounds, nature badges |
| **500** | **`#2D8A4E`** | **Nature accent — health badges, status dots, eco tags** |
| 700 | `#1A5C30` | Green text on white (WCAG AA ✅) |

**Rule:** Green is for status and accent only. Buttons stay orange. Green + Orange together: green for secondary info, orange for primary CTA.

### Background — Warm White

| Token | Hex | Role |
|---|---|---|
| `background` | `#FDF6F3` | Page background — warm, not clinical |
| `surface` | `#FFFFFF` | Interactive surfaces (list rows, inputs) |
| `muted` | `#F1E6E2` | Grouped list backgrounds, disabled states |
| `border` | `#D4CBC8` | Hairline separators, dividers |
| `input` | `#ADA7A4` | Input borders, focus rings |

**Rule:** Never use pure `#FFFFFF` as page background. The warm `#FDF6F3` is what makes Tamga feel earthy rather than clinical.

### Text

| Token | Hex | Role |
|---|---|---|
| `foreground` | `#2E2D2C` | Primary text — warm near-black |
| `mutedForeground` | `#625F5D` | Secondary text, placeholders, captions |

### Semantic

| State | Hex | Role |
|---|---|---|
| `success` | `#0A6B1C` | Health checkmarks, verified states |
| `warning` | `#B55A0A` | Alerts, pending states |
| `destructive` | `#C41012` | Errors, delete actions, critical alerts |
| `info` | `#0A3BA8` | Informational badges |

### Dark Mode

| Token | Hex | Role |
|---|---|---|
| `dark:background` | `#0D0B0A` | Near-black with warm undertone |
| `dark:primary` | `#E87045` | Shifted warmer (H=40) for dark |
| `dark:surface` | `#151211` | Card/row surface |
| `dark:border` | `rgba(255,255,255,0.10)` | Subtle dividers |
| `dark:text` | `#F7EEEB` | Warm white text |

---

## Typography

### Type Scale (iOS HIG)

| Name | Size | Weight | Use |
|---|---|---|---|
| Large Title | 34pt | Semibold (600) | Main dashboard titles only |
| Title 1 | 28pt | Semibold (600) | Primary screen titles |
| Title 2 | 22pt | Semibold (600) | Section headers |
| Title 3 | 20pt | Semibold (600) | Subsection headers |
| Headline | 17pt | Semibold (600) | Primary list items, emphasized text |
| Body | 17pt | Regular (400) | Reading text, descriptions |
| Callout | 16pt | Regular (400) | Secondary reading text |
| Subheadline | 15pt | Regular (400) | Tertiary text |
| Footnote | 13pt | Regular (400) | Captions, supplementary info |
| Caption 1 | 12pt | Regular (400) | Small labels, timestamps |

### Font Rules

- **iOS:** SF Pro (system font — automatic)
- **Android:** Roboto (system font — automatic)
- **Never hardcode font families** — use `AppTypography` methods
- **Cyrillic line-height:** Provide extra breathing room for Mongolian descenders
- **Currency:** `₮9,900` — price uses same weight as adjacent text, comma-separated, no decimals

---

## Spacing System

### 8dp Base Grid

| Token | Value | Use |
|---|---|---|
| `xs` | 4dp | Icon-to-label gaps |
| `sm` | 8dp | Inline spacing |
| `md` | 12dp | Compact padding |
| `lg` | 16dp | Standard padding, screen margins |
| `xl` | 20dp | Grouped list horizontal |
| `xxl` | 24dp | Section gaps |
| `xxxl` | 32dp | Large section breaks |

### Standard Insets

| Name | Value | Use |
|---|---|---|
| `horizontalInset` | 16dp | Screen horizontal padding |
| `listCellPadding` | 16dp horizontal, 12dp vertical | List row padding |
| `sheetPadding` | 16dp sides, 8dp top, 24dp bottom | Bottom sheet content |

### Corner Radius

| Name | Value | Use |
|---|---|---|
| `standard` | 13pt | Buttons, primary containers |
| `compact` | 8pt | Chips, tags, small controls |
| `pill` | 999pt | Badges, status pills, filter chips |

---

## Component Patterns

### The Golden Rule: No Card Backgrounds on Content

Content lives on the plain `#FDF6F3` background. Separation comes from:
- Hairline separators (0.5dp, `#D4CBC8`)
- Typography weight differences
- Vertical spacing (24dp between sections)

**Cards exist only for:**
- Tappable list rows (white background on gray grouped section)
- Photo thumbnails
- Interactive elements that need a touchable surface

**Never put cards around:**
- Stats/numbers
- Descriptions
- Status information
- Empty states

### Buttons

| Variant | Style | Use |
|---|---|---|
| **Primary** | `#F06A2E` fill, white text, 13pt corners | Main CTAs, form submits |
| **Secondary** | Text-only, no background, orange text | Secondary actions |
| **Destructive** | Red text (`#C41012`), no fill | Delete, remove, cancel |
| **Disabled** | `#F1E6E2` fill, `#625F5D` text |不可用状态 |

### iOS Grouped Lists

The backbone of settings, forms, and data display:
- Warm gray (`#F1E6E2`) section background
- White rows with hairline separators
- Leading icon (20dp, orange or muted) + text + trailing chevron
- Section headers: Footnote size, `#625F5D`, uppercase

### Bottom Navigation

6-tab system (unusual but necessary for Tamga's feature breadth):
- Active: `#F06A2E` icon + label
- Inactive: `#625F5D` icon + label
- Labels always visible (no icon-only mode)
- Tabs: Удам · Морьд · Арга хэмжээ · Газрын зураг · Зах зээл · Профайл

### Bottom Sheets

- 13pt top corners
- Grab handle centered (5dp × 40dp, `#D4CBC8`)
- Content padding: 16dp sides, 24dp bottom
- Dimming backdrop overlay
- Detented: half-sheet for actions, full for forms

### Status Badges

Inline pills, never standalone cards:
- **Healthy:** Green bg (`#E8F5EC`), green text (`#2D8A4E`)
- **Monitoring:** Orange bg (`#FFEDE1`), orange text (`#F06A2E`)
- **Critical:** Red bg (`#FFCEC7`), red text (`#C41012`)
- **Pending:** Yellow bg (`#FFDCA9`), amber text (`#B55A0A`)

### Input Fields

- Bottom-border only (no box outline)
- 1pt `#D4CBC8` border
- Orange focus line (`#F06A2E`)
- Label in Footnote style above field, `#625F5D`
- Placeholder text: `#ADA7A4`

### Empty States

- Simple icon or illustration (centered, muted colors)
- Title: Title 3, `#2E2D2C`
- Body: Body, `#625F5D`
- Action link below (orange text, not a button)

---

## Iconography

### Primary Set

- **CupertinoIcons** — iOS-native feel for system actions (back, settings, search)
- **Font Awesome** — extended set for horse-specific icons

### Horse-Specific Icons

| Concept | Icon | Style |
|---|---|---|
| Horse | `faHorse` | Thin stroke, rounded |
| Pedigree | `faSitemap` | Tree structure |
| Health | `faHeartbeat` | Vital signs |
| Farrier | `faShoePrints` | Horseshoe |
| Document | `faFileMedical` | Medical records |
| Marketplace | `faStore` | Shop front |
| Certificate | `faCertificate` | Official seal |
| Breeding | `faDna` | Genetics |
| Map/Location | `faMapMarker` | Pin |
| Event | `faCalendar` | Calendar |

**Icon rules:**
- Thin stroke (1.5–2pt weight) with rounded terminals
- Circular backgrounds for feature icons (40dp, green-tinted)
- Never square icon containers
- Monochrome by default, colored only for status

---

## Layout Principles

### Mobile-First

- Target: iPhone SE (375dp) through iPhone 15 Pro Max (430dp)
- No tablet layouts in MVP
- Safe area insets on all screens

### Content Density

- Show data first, chrome second
- Max 3 levels of nesting (screen → section → detail)
- Every screen answers: "What does the user need to do here?"

### Navigation Structure

```
Shell (6-Tab Bottom Nav)
├── 🏠 Удам (Lineage)        — pedigree tree, default tab
├── 🐴 Морьд (Horses)         — horse registry & details
├── 📅 Арга хэмжээ (Events)   — tournaments & races
├── 🗺️ Газрын зураг (Map)     — lost horses, geofences
├── 🛒 Зах зээл (Market)      — buy/sell/lease
└── 👤 Профайл (Profile)      — settings, account
```

### Data Display Patterns

| Pattern | When to Use | Example |
|---|---|---|
| **Grouped list** | Settings, forms, reference data | Profile settings, health logs |
| **Photo-forward list** | Horse registry, marketplace | Horse cards, listings |
| **Timeline** | Historical data | Health history, event history |
| **Tree view** | Ancestry data | Lineage/pedigree |
| **Large number** | Key metrics | Horse count, COI percentage |
| **Map overlay** | Geographic data | Lost horses, geofences |

---

## Localization

### Language

- **Primary:** Mongolian (Cyrillic) — all user-facing strings
- **Code/docs:** English only

### Date & Time

- Format: `YYYY оны MM сарын DD` (e.g., "2026 оны 06 сарын 04")
- Time: 24-hour format

### Currency

- Mongolian Tugrik: `₮9,900` (comma-separated, no decimals)
- Always show ₮ symbol

### Numbers

- Thousands separator: comma (`,`)
- No decimals for horse counts, years, costs
- Percentage: `5%` (no space)

### Region Names

- Provinces: аймаг (aimag)
- Districts: сум (sum)
- Examples: Төв аймаг, Баянзүрх сум

---

## Accessibility

- Touch targets: 44×44dp minimum
- Text contrast: WCAG AA (4.5:1 normal, 3:1 large)
- Never convey info by color alone — always pair with icons/labels
- Screen reader labels on all interactive elements
- Tree views need logical traversal order

---

## Related

- [Product](./product.md) — feature inventory and user goals
- [Tech Stack](./tech-stack.md) — implementation conventions
- Theme source code: `lib/src/app/theme/`
