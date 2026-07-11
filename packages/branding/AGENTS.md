# @zuiio/branding

OKLch design tokens and global CSS source of truth for all Zuiio apps.

| Export | Description |
|--------|-------------|
| `globals.css` | CSS custom properties: violet/teal brand primitives, OKLch semantic tokens, typography, spacing, motion, shadows |
| `BRAND_THEMES` | Array of `BrandTheme` presets (zuiio, neutral, blue, green, purple, orange, rose, goku-gym) |
| `BrandConfig` | Type: `{ theme, radius, logo_url, custom_colors?, font_body?, font_heading? }` |
| `DEFAULT_BRAND_CONFIG` | `{ theme: "zuiio", radius: 0.5, logo_url: null }` |
| `resolveBrandConfig(input)` | Merge partial/nullable config with defaults; null → zuiio preset |
| `generateBrandCSS(config)` | Generate `:root`/`.dark` CSS string from a `BrandConfig` (accepts null) |
| `getTheme(name)` | Look up a `BrandTheme` by name |
| `getFont(name)` | Look up a `FontOption` by name |
| `isValidColorValue(v)` | Validate CSS color string (hex, oklch, hsl, etc.) |
| `contrastForeground(color)` | Derive accessible foreground for a background color |

## Usage

This package is imported via CSS, not JavaScript:

```css
@import "@zuiio/branding/globals.css";
```

## Design Tokens

All colors use OKLch color space for perceptual uniformity:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... full palette in globals.css */
}
```

## Conventions

- **Source of truth**: This package defines the canonical design tokens
- **No JavaScript exports**: Pure CSS custom properties
- **Framework-agnostic**: Works with Tailwind v4, plain CSS, or any framework
- **Apps extend**: Each app can override tokens in its own CSS, but should reference these as defaults

## Tasks (Agent Router)

Use this section to find the right context for your task.

### Common tasks

- See README.md for usage examples and API reference
