# @zuiio — Shared Platform Packages

Private repository for Zuiio's reusable `@zuiio/*` packages and platform tooling.
Product applications live in independent sibling repositories under `~/.workspace/`.

## Product repositories

| Product or app | Local repository |
|---|---|
| Zer web | `~/.workspace/zer` |
| Tolom web | `~/.workspace/tolom` |
| Khosuud | `~/.workspace/khosuud` |
| Agent Gateway | `~/.workspace/agent-gateway` |
| Onoo mobile | `~/.workspace/onoo-app` |
| Tamga | `~/.workspace/tamga` |
| Tolom mobile | `~/.workspace/tolom-mobile` |
| Zer mobile | `~/.workspace/zer-mobile` or `~/.workspace/zer-app` |
| Zim | `~/.workspace/zim` |
| Tumurch | `~/.workspace/tumurch` |
| Zoa | `~/.workspace/zoa` |
| Zraf | `~/.workspace/zraf` |
| Zunch | `~/.workspace/zunch` |
| Side | `~/.workspace/side` |

## Shared packages

`packages/` contains the reusable `@zuiio/*` ecosystem:

- `core` — formatting, validation, timezone, and domain rules
- `branding` — design tokens and CSS variables
- `capture` — error capture integration
- `hooks`, `query`, `offline`, and `realtime` — client data patterns
- `auth`, `oidc`, and `supabase` — authentication and backend helpers
- `export`, `hr`, `search`, `i18n`, `sdk`, and `ui`
- `ai-agent` — provider abstraction and tool-calling support

Product-only gateway channel modules live in `~/.workspace/agent-gateway/packages/`.

## Root commands

```bash
pnpm install
pnpm check
pnpm verify
```

Use the app repository's own commands for development, tests, database migrations, and deployment.
