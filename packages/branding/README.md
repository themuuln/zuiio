# @zuiio/branding — Design Tokens & Theme Engine

OKLch design tokens, pre-built shadcn themes, and a CSS generator for multi-tenant branding.

## CSS Import

The package ships a `globals.css` with the Zuiio brand palette (Violet + Teal), shadcn semantic tokens, dark mode, typography, motion, and shadow scales. Import it in your app's root layout or global CSS:

```css
@import "@zuiio/branding/globals.css";
```

Tailwind v4 is required — the file uses `@theme inline` for token registration and `@custom-variant dark` for class-based dark mode.

## Token Overview

### Brand Colors

| Token | Value | Use |
|---|---|---|
| `--brand-violet` | `oklch(0.50 0.26 275)` | Primary brand |
| `--brand-violet-light` | `oklch(0.65 0.22 275)` | Hover / emphasis |
| `--brand-violet-dim` | `oklch(0.38 0.24 275)` | Dark accents |
| `--brand-teal` | `oklch(0.70 0.16 195)` | Accent / success |
| `--brand-teal-light` | `oklch(0.82 0.12 195)` | Light accent |
### Semantic (shadcn)

`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` — each with a `-foreground` counterpart. All values are OKLch with a subtle violet hue offset.

### Charts

Five chart colors: `--color-chart-1` through `--color-chart-5`.

### Radius

`--radius` base (`8px`) with `sm` (4px), `md` (8px), `lg` (12px), `xl` (16px), `full` (9999px).

### Typography

| Token | Font |
|---|---|
| `--font-sans` | SF Pro Display → Inter → system-ui |
| `--font-mono` | JetBrains Mono → ui-monospace |
| `--font-display` | SF Pro Display → Inter → system-ui |
### Motion

| Token | Value |
|---|---|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `--ease-move` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` |
| `--duration-instant` | `80ms` |
| `--duration-fast` | `120ms` |
| `--duration-base` | `200ms` |
| `--duration-slow` | `280ms` |
| `--duration-slower` | `350ms` |

### Shadows

`--shadow-xs` through `--shadow-xl`, plus `--shadow-brand` and `--shadow-card-hover`.

## Pre-built Themes

Six themes ship in `BRAND_THEMES` — each provides full light + dark mode variable sets:

| Theme | `name` | Label |
|---|---|---|
| Neutral | `neutral` | Стандарт |
| Blue | `blue` | Цэнхэр |
| Green | `green` | Ногоон |
| Purple | `purple` | Ягаан |
| Orange | `orange` | Улбар шар |
| Rose | `rose` | Ягаан өнгө |
| Goku Gym | `goku-gym` | Goku Gym |
| Nature | `nature` | Байгаль |

## TypeScript API

```ts
import {
  type BrandTheme,
  type BrandConfig,
  type FontOption,
  BRAND_THEMES,
  DEFAULT_BRAND_CONFIG,
  FONT_OPTIONS,
  getTheme,
  getFont,
  generateBrandCSS,
  contrastForeground,
  isValidColorValue,
} from "@zuiio/branding";
```

| Export | Description |
|---|---|
| `BRAND_THEMES` | Array of `BrandTheme` objects (light + dark variable maps) |
| `DEFAULT_BRAND_CONFIG` | `{ theme: "neutral", radius: 0.625, logo_url: null }` |
| `FONT_OPTIONS` | 10 Google Fonts (Inter, Onest, Manrope, Nunito, Montserrat, Noto Sans, Open Sans, Roboto, Plus Jakarta Sans, DM Sans) |
| `getTheme(name)` | Look up a theme by `name` |
| `getFont(name)` | Look up a font by `name` |
| `generateBrandCSS(config)` | Generate a full CSS string from a `BrandConfig` — theme colors, radius, custom colors, fonts |
| `contrastForeground(color)` | Returns a high-contrast foreground color for a given OKLch or hex background |
| `isValidColorValue(value)` | Validates a CSS color string (hex, OKLch, HSL, named, etc.) |

### BrandConfig

```ts
type BrandConfig = {
  theme: string;           // theme name (e.g. "neutral")
  radius: number;          // base radius in rem (e.g. 0.625)
  logo_url: string | null;
  custom_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  font_body?: string;      // font name from FONT_OPTIONS
  font_heading?: string;   // font name from FONT_OPTIONS
};
```

### generateBrandCSS

```ts
import { generateBrandCSS } from "@zuiio/branding";

const css = generateBrandCSS({
  theme: "blue",
  radius: 0.5,
  custom_colors: { primary: "#2563eb" },
  font_body: "inter",
  font_heading: "montserrat",
});
// → ":root { --background: ...; --radius: 0.5rem; ... } .dark { ... }"
```
