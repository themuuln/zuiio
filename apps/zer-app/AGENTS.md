# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Sibling projects

This repo lives alongside other projects in `../`. All are part of a personal ecosystem — mostly Mongolian-first SaaS and mobile apps sharing similar patterns (Supabase, shadcn/ui, Flutter).

### LLM Proxy Infrastructure

| Project | Stack | Description |
|---------|-------|-------------|
| [`gproxy`](../gproxy) | Rust (Axum), React | High-performance multi-provider LLM proxy server (OpenAI/Claude/Gemini/DeepSeek/etc.) |
| [`commandcode-proxy-menubar`](../commandcode-proxy-menubar) | Tauri, Next.js | Multi-account CC proxy station with usage tracking, quotas, rate limiting, dashboard |
| [`CLIProxyAPI`](../CLIProxyAPI) | Node.js | Lightweight proxy for CLI tool API compatibility across LLM providers |

### Zer Ecosystem

| Project | Stack | Description |
|---------|-------|-------------|
| [`zer`](../zer) | Next.js 16, Supabase, shadcn | Zer ERP web app — inventory, sales, expenses, POS |
| [`zer-commission`](../zer-commission) | Next.js 16, Supabase, shadcn | Mini ERP for Mongolian small businesses |
| [`zerbu`](../zerbu) | Next.js 16, Supabase | Another Zer-ecosystem web app |
| [`zer-packages`](../zer-packages) | TypeScript monorepo | Shared packages across Zer ecosystem |

### Flutter Apps

| Project | Stack | Description |
|---------|-------|-------------|
| [`tamga`](../tamga) | Flutter, Supabase, Isar | Offline-first horse management app for Mongolia |
| [`tumurch`](../tumurch) | Flutter, Supabase | Gym management app — member training, coach workflows |
| [`zunch`](../zunch) | Flutter | Premium tarot app with journaling, Gemini AI readings |
| [`zraf`](../zraf) | Flutter | Mongolian Driving Theory Exam Prep (mobile) |

### Next.js Web Apps

| Project | Stack | Description |
|---------|-------|-------------|
| [`zatly`](../zatly) | Next.js 16, Supabase, React Flow | Messenger bot builder — visual automation, analytics |
| [`zraf-web`](../zraf-web) | Next.js 16 | Mongolian Driving Theory Exam Prep (web companion) |
| [`tamga-web`](../tamga-web) | Next.js 16 | Tamga web companion |
| [`zill`](../zill) | Next.js 16 | (generic Next.js app) |
| [`card`](../card) | Next.js 15, Supabase | Card-based app with e2e testing (Playwright) |

### Other

| Project | Stack | Description |
|---------|-------|-------------|
| [`zoa` (Gal)](../zoa) | Expo + Next.js + Supabase + Hono | Fitness app — React Native mobile + Next.js admin |
| [`khosuud`](../khosuud) | Expo + NativeWind, Next.js 16, Supabase | Mongolia-first couple app |
| [`tolom`](../../tolom) | Next.js | Next.js app in Zer ecosystem |
| [`mongolian-dict-builder`](../../mongolian-dict-builder) | Python | macOS Dictionary.app bundle builder for Mongolian |
| [`sas`](../../sas) | — | (empty, staged directory) |
