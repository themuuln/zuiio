# Deployment

Product deployments are owned by their standalone repositories. This repository only validates and releases shared `@zuiio/*` packages.

## Product deployment ownership

| Product | Repository | Deployment owner |
|---|---|---|
| Zer | `~/.workspace/zer` | Zer repository CI / Vercel |
| Tolom | `~/.workspace/tolom` | Tolom repository CI / Vercel |
| Khosuud | `~/.workspace/khosuud` | Khosuud repository CI / EAS / Vercel |
| Agent Gateway | `~/.workspace/agent-gateway` | Agent Gateway repository CI / Vercel or Cloudflare |
| Onoo mobile | `~/.workspace/onoo-app` | Onoo mobile repository CI / EAS |
| Tamga | `~/.workspace/tamga` | Tamga repository CI / Flutter distribution |
| Tolom mobile | `~/.workspace/tolom-mobile` | Tolom mobile repository CI / EAS |
| Zer mobile | `~/.workspace/zer-mobile` or `~/.workspace/zer-app` | Selected Zer mobile repository |
| Zim | `~/.workspace/zim` | Zim repository CI / Vercel |

Each repository must define its own Vercel, EAS, Flutter, or Cloudflare settings. Never deploy an app from this repository.

## Shared package release

1. Update the affected package version.
2. Build the package and verify its `dist` files.
3. Publish the package through the package release workflow.
4. Update consuming app manifests and lockfiles.
5. Run the consumer repository's verification gate.

Shared packages must publish compiled entrypoints. Standalone apps must use released versions, not `workspace:*` references to this repository.

## Supabase ownership

Every product repository owns its Supabase configuration, migrations, generated types, and environment variables. Remote migrations require explicit review and the product repository's documented Supabase profile.

## Verification

From this repository:

```bash
pnpm check
pnpm verify
```

From a product repository, run that repository's documented typecheck, lint, test, build, and deployment checks.
