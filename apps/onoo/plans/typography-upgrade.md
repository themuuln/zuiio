# Typography Upgrade — Sports-Forward

**Date:** 2026-07-18
**App:** Onoo (basketball stats platform)

## Goal
Replace editorial typography (Instrument Serif + Geist) with sports-forward system (Barlow Condensed + Inter + JetBrains Mono) with full Cyrillic support.

## Changes

### 1. `src/app/layout.tsx` — ✅ DONE
- Replaced `Geist` → `Inter` (body, Cyrillic)
- Replaced `Geist_Mono` → `JetBrains_Mono` (stats, Cyrillic)
- Replaced `Instrument_Serif` → `Barlow_Condensed` (headlines, Cyrillic)
- All fonts: `subsets: ["latin", "cyrillic"]`, `display: "swap"`
- CSS vars: `--font-barlow`, `--font-inter`, `--font-jetbrains`

### 2. `src/app/globals.css` — IN PROGRESS
- Update `--font-display` token to Barlow Condensed
- Add `--font-body` (Inter) and `--font-stat` (JetBrains Mono) tokens
- Add typography scale CSS custom properties
- Update `.stat-number` class for JetBrains Mono
- Add heading hierarchy utilities

### 3. OG Images — PENDING
- Update `opengraph-image.tsx` files to use new fonts

### 4. Verification — PENDING
- `pnpm exec tsc --noEmit`

## Font Pairing

| Role | Font | Weights | Cyrillic |
|---|---|---|---|
| Display | Barlow Condensed | 600–900 | ✅ |
| Body | Inter | 400–700 | ✅ |
| Stats/Mono | JetBrains Mono | 700 | ✅ |

## Why These Fonts
- **Barlow Condensed**: Condensed proportions = athletic energy. 9 weights for flexibility. Variable font = one download.
- **Inter**: Industry-standard UI font. Designed for screens. Full Cyrillic. Variable.
- **JetBrains Mono**: Superior tabular numeral rendering. Designed for data display.
