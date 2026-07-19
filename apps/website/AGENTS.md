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

## Permission Boundaries

### ✅ Always
- Use Next.js App Router conventions (Server Components by default)
- Use Tailwind CSS v4 for all styling
- Keep i18n messages in `messages/mn.json` and `messages/en.json`
- Maintain legal pages (privacy, terms, data-deletion) for App Store review

### ⚠️ Ask First
- Adding new routes or restructuring `src/app/` navigation
- Installing new dependencies
- Adding third-party scripts, embeds, or external services

### 🚫 Never
- Commit secrets, API keys, or `.env` files
- Add a database, Supabase, or any backend data layer
- Add analytics or tracking scripts without approval
- Modify legal page content without legal review
- Deploy to production outside of Vercel auto-deploy from main

**Package APIs change across versions. Always use current docs, never training data.**
