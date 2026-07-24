# 1. Scaffold

Model on `apps/zill` structure (minimal Next.js + Supabase SSR + Tailwind v4) upgraded to monorepo conventions: Biome + catalog versions like `apps/zer`. UI primitives installed via shadcn CLI.

## Directory layout

```
apps/zim/
├── package.json          # catalog: versions; qpay-js, qrcode, qrcode.react, nodemailer,
│                         # next-intl, zod, react-hook-form, @zuiio/{core,capture,supabase,branding}
├── tsconfig.json, next.config.ts, biome.json, .env.example, AGENTS.md
├── components.json           # shadcn/ui config (npx shadcn@latest init, Tailwind v4)
├── messages/{mn.json,en.json}
├── supabase/migrations/
└── src/
    ├── i18n/, middleware.ts                  # next-intl + Supabase session refresh
    ├── app/[locale]/                         # storefront
    ├── app/[locale]/admin/                   # admin
    ├── app/api/payments/{create,callback,status,mock-pay}/route.ts
    ├── app/api/provider/webhook/route.ts
    ├── app/api/cron/{expire-orders,retry-provisioning}/route.ts
    ├── lib/supabase/{client,server,admin,middleware,types}.ts   # zill pattern
    ├── lib/provider/{types,index,mock,webhook}.ts
    ├── lib/pricing/{engine,rounding,resolve,quote,types}.ts
    ├── lib/{qpay,orders,provisioning,email,telegram,qr}.ts
    └── components/, components/ui/   # ui/ = shadcn components installed via CLI
```

## Key dependencies

- `next` 16.x + `react` 19.x (match catalog / newest sibling apps)
- `@supabase/ssr`, `@supabase/supabase-js`
- `@tanstack/react-query` (payment polling), `@tanstack/react-table` (admin tables)
- `@zuiio/core`, `@zuiio/capture`, `@zuiio/supabase`, `@zuiio/branding`, `@zuiio/config` — all `workspace:*`
- `next-intl`, `zod`, `react-hook-form`, `@hookform/resolvers`
- `qpay-js` (match zerbu's version), `qrcode` + `qrcode.react`, `nodemailer`
- Dev: `typescript`, `@biomejs/biome`, `vitest`, `tailwindcss` v4

## Environment variables (.env.example)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
ESIM_PROVIDER=mock            # mock | airalo | esimaccess | ...
MOCK_PROVIDER_FAILURE_RATE=0  # 0..1, deterministic-by-order failure simulation
MOCK_PROVIDER_ASYNC=false     # true = deliver via webhook path
QPAY_BASE_URL / QPAY_CLIENT_ID / QPAY_CLIENT_SECRET / QPAY_INVOICE_CODE / QPAY_CALLBACK_URL
QPAY_MOCK=true                # dev/E2E: fake QPay client
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID   # optional
CRON_SECRET                   # bearer for /api/cron/*
ORDER_ACCESS_SECRET           # HMAC for delivery-page access tokens
PROVIDER_WEBHOOK_SECRET
```

## Monorepo integration

- `tsconfig.json` extends `@zuiio/config/tsconfig`, paths `@/*` → `./src/*`
- Add new env vars to `build.env` in root `turbo.json`
- `apps/zim/AGENTS.md` rules: never compute price client-side; all money integer MNT / numeric USD; order/esim state machine transitions only via lib functions; RLS notes
- Add zim row to root `AGENTS.md` apps table
