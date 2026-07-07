# @zuiio/branding

OKLch design tokens and global CSS source of truth for all Zuiio apps.

## Exports

| Export | Description |
|--------|-------------|
| `globals.css` | CSS custom properties: colors (OKLch), typography, spacing, motion |

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
