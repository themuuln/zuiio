# Zuiio ID

Centralized identity and SSO system for the Zuiio ecosystem. One account, one login, every product.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build (NODE_OPTIONS='--max-old-space-size=12288')
pnpm lint         # Biome check
pnpm typecheck    # tsc --noEmit
```

## Stack

- Next.js 16 (App Router, Turbopack, Cache Components)
- Supabase Auth (GoTrue OAuth: Google, Apple; email/password)
- React 19, React Hook Form + Zod validation
- `@zuiio/auth` (SSO federation: `startZuiioSso()`, `exchangeZuiioSsoCode()`)
- `@zuiio/branding` (OKLch design tokens, globals.css)
- `@zuiio/core` (formatting, validation)
- Tailwind CSS v4, Geist typeface

## Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (ThemeProvider, Sonner)
│   ├── page.tsx             # Landing → redirects to /login
│   ├── (auth)/              # Auth route group
│   │   ├── layout.tsx       # Auth layout (centered card)
│   │   ├── login/           # Email/password + OAuth (Google, Apple)
│   │   ├── signup/          # Registration
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset confirmation
│   │   ├── account/         # Account management
│   │   ├── logout/          # Logout handler
│   │   └── theme-toggle.tsx # Light/dark toggle
│   └── auth/
│       └── callback/        # OAuth callback handler
├── lib/
│   ├── supabase/            # Supabase client + server helpers
│   ├── auth/                # SSO federation (OIDC code exchange)
│   └── errors.ts            # Error mapping
└── types/
    └── oauth-globals.d.ts   # OAuth type definitions
```

## Conventions

- **Mongolian-first**: All user-facing copy in Mongolian (Cyrillic). Technical terms transliterated naturally.
- **Design language**: "The Secure Threshold" — restrained confidence, flat depth, single teal accent. See `docs/DESIGN.md`.
- **SSO federation**: zuiio-id is the OIDC provider for Zer, Tolom, and all future products. `@zuiio/auth` package provides the client-side adapter.
- **OAuth providers**: Google and Apple configured via Supabase dashboard. Facebook planned for future.
- **Flat depth**: No box-shadows anywhere. Cards share background color. Borders and tints carry structure.
- **Accent scarcity**: Teal primary appears on ≤15% of screen (submit buttons, logo only). Links use `text-foreground`, never `text-primary`.

## Key Files

- `src/proxy.ts` — OIDC provider endpoints (authorize, token, JWKS, userinfo)
- `docs/DESIGN.md` — Full design system specification
- `PRODUCT.md` — Product requirements and design principles
