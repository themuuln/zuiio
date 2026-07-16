# Website Architecture

## Overview

Static marketing site for zuiiotech.com. No backend, no Supabase, no API routes — all content is hardcoded. Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, `next-intl` v4, shadcn/ui (new-york, phosphor icons). Consumes `@zuiio/core` for formatting. Deployed on Vercel.

## Route Structure

All content routes sit under `[locale]/`. Root `app/page.tsx` redirects to the locale-detected path.

```
app/
├── layout.tsx              # Root: fonts (Instrument Serif + Geist), metadata
├── page.tsx                # Redirect → /[locale]
├── globals.css             # Brand tokens, semantic tokens, animations
└── [locale]/
    ├── layout.tsx          # NextIntlClientProvider + Header/Footer shell
    ├── page.tsx            # Homepage
    ├── about/              # Company page
    ├── pricing/            # Pricing overview
    ├── products/           # Product index
    │   ├── zer/            # Zer product page
    │   └── tolom/          # Tolom product page
    ├── blog/
    │   ├── page.tsx        # Blog index
    │   └── [slug]/         # Dynamic posts (static content, no CMS)
    ├── privacy/            # Privacy policy (Meta/Apple review)
    ├── terms/              # Terms of service (Meta/Apple review)
    ├── data-deletion/      # Data deletion policy (Meta/Apple review)
    ├── legal-page.tsx      # Shared layout for legal pages
    └── not-found.tsx       # 404
```

## i18n

Library: `next-intl` v4. Locales: `mn` (Mongolian, default), `en` (English). `localePrefix: "never"` — locale is cookie-based, not URL-based.

**Middleware:** `proxy.ts` (Next.js 16 convention) wraps `next-intl`'s middleware. First visit detects locale from `Accept-Language` header, sets `NEXT_LOCALE` cookie (1-year TTL). Root `/` redirects to `/{locale}/`.

**Translations:** JSON files in `messages/mn.json` and `messages/en.json`. Loaded per-request via `getRequestConfig` in `lib/i18n/request.ts`. Server pages use `getTranslations()`; client components get messages through `NextIntlClientProvider`.

**Navigation:** `lib/i18n/navigation.ts` exports type-safe `Link`, `redirect`, `usePathname`, `useRouter`.

## Components

**Layout** (`components/layout/`): `Header`, `Footer`, `LanguageSwitcher` (mn/en toggle).

**Marketing** (`components/marketing/`): `Hero`, `FeatureSection`, `ProductCard`, `PricingCard`, `Testimonial`.

**Shared:** `legal-page.tsx` — reusable layout for privacy, terms, data-deletion (TOC sidebar + content). `cn()` — `clsx` + `tailwind-merge` utility.

## Design Tokens

Defined in `globals.css` as CSS custom properties:
- **Brand:** oklch violet/teal palette with glow and gradient variants
- **Semantic:** shadcn color system (`--color-primary`, `--color-muted`, etc.) with light/dark modes
- **Typography:** fluid `clamp()` scale (`--text-xs` through `--text-6xl`)
- **Spacing:** 8px grid (`--space-1` through `--space-32`)
- **Motion:** duration tokens + custom easing, `prefers-reduced-motion` respected

## Deployment

Vercel, auto-deploy from `main`. Turbopack enabled for dev and build. No environment variables — fully static with no external service dependencies.
