# Tamga — Stitch Design Context

## App Identity

**Tamga** (Тамга) — Mongolian horse management app. Offline-first, mobile-first.
Tagline: "Морины тань цорын ганц үнэн эх сурвалж" (The single source of truth for your horse)

## Design System

**Aesthetic:** Ultra-minimal, flat surfaces. Almost no card backgrounds — let whitespace and typography do the work. iOS Notes / Apple Health level minimalism.
**Platform:** Mobile (iPhone SE 375dp → iPhone 15 Pro Max 430dp)

### Core Principle: Less is More
- **No card backgrounds on content** — use whitespace, hairline separators, and typography hierarchy instead
- **Cards only for:** interactive elements (list items, tappable rows), not for display content
- **Grouped sections** use warm gray background, white rows — NOT individual cards per item
- **Flat by default** — no shadows, no elevation, no container borders unless tappable
- **Typography carries hierarchy** — weight and size, not boxes

### Color Palette

| Token | Hex | Role |
|-------|-----|------|
| Primary | `#F06A2E` | Buttons, active states, links (Hermes orange) |
| Primary Dark | `#CC5824` | Hover/pressed states |
| Primary Light | `#FFEDE1` | Tinted backgrounds, badges |
| **Accent** | **`#2D8A4E`** | **Nature accent — secondary highlights, nature tags, steppe green** |
| Accent Light | `#E8F5EC` | Green tinted backgrounds, nature badges |
| Background | `#FDF6F3` | Page background (warm white) |
| Card | `#FFFFFF` | Card surfaces |
| Foreground | `#2E2D2C` | Primary text |
| Muted | `#F1E6E2` | Grouped list backgrounds |
| Muted FG | `#625F5D` | Secondary text, placeholders |
| Border | `#D4CBC8` | Dividers, borders |
| Success | `#0A6B1C` | Success states (darker green) |
| Warning | `#B55A0A` | Warning states |
| Destructive | `#C41012` | Errors, delete actions |

### Color Usage Rules
- **Orange** = primary actions, CTAs, active nav, prices, headlines
- **Green** = nature-related content, health badges, status indicators, secondary accents, nature tags, eco/sustainability elements
- **Green + Orange together** = use sparingly — green for secondary info, orange for primary CTA
- Green works best as: badge backgrounds, inline icons, status dots, small accent elements — NOT as button fills (keep buttons orange)

### Typography

- System font (SF Pro on iOS, Roboto on Android)
- Large Title: 34pt Semibold — screen titles (rare)
- Title 1: 28pt Semibold — primary screen titles
- Title 2: 22pt Semibold — section headers
- Headline: 17pt Semibold — emphasized text
- Body: 17pt Regular — reading text
- Caption: 12pt Regular — labels, timestamps

### Spacing

- Base grid: 4pt / 8dp
- Screen horizontal padding: 16dp
- Card padding: 16dp
- Section gaps: 24dp
- Corner radius: 13pt (standard), 8pt (compact), 999pt (pill)

### Component Patterns

- **Lists:** iOS grouped style — white rows on warm gray (#F1E6E2), hairline separators, NO card wrappers
- **Buttons:** 13pt corners, primary uses `#F06A2E`, secondary is text-only
- **Bottom sheets:** 13pt top corners, grab handle centered
- **Navigation:** 6-tab bottom nav (Lineage, Horses, Events, Map, Market, Profile)
- **Headers:** Large title style (bold, left-aligned), no background — content bleeds to top
- **Stats/numbers:** Large orange numbers on plain background — no card containers
- **Badges/pills:** Small rounded chips inline with text, not standalone cards

### Cultural Details

- Mongolian Cyrillic text throughout
- Currency: ₮ (MNT / Tugrik)
- Regions: аймаг (aimag/province), сум (sum/district)
- Horse terminology in Mongolian

## Style Cues for Stitch

Ultra-minimal flat design, almost no card backgrounds — whitespace and typography for hierarchy. Warm earthy palette with two accent colors: Hermes orange (#F06A2E) for primary actions and steppe green (#2D8A4E) for nature-related accents. iOS Notes-level minimalism, generous whitespace, no shadows or elevation, hairline separators only, system font, Mongolian cultural identity. Green appears as small accent elements — badges, status dots, nature tags — not as main button fills.
