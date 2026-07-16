# Zuiio Website

Company marketing site built with Next.js 16 and Tailwind v4.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # Biome check
```

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- React 19
- `@zuiio/core` (formatting, validation)

## Structure

```
src/
├── app/
│   ├── [locale]/     # i18n routes (mn, en)
│   │   ├── page.tsx  # Homepage
│   │   ├── about/
│   │   ├── contact/
│   │   ├── privacy/
│   │   ├── terms/
│   │   └── data-deletion/
│   └── api/          # API routes
├── components/       # React components
└── lib/              # Utilities
```

## Conventions

- **i18n**: Routes are under `[locale]/` (mn = Mongolian, en = English)
- **Legal pages**: privacy, terms, data-deletion required for Meta/Apple developer review
- **No Supabase**: This is a static marketing site, no database
- **Deploy**: Vercel (auto-deploy from main branch)
