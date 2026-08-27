# Vercel Deployment Guide

Product repositories deploy independently. This repository does not contain product applications or product Vercel projects.

## Repository ownership

| Product | Repository | Deployment |
|---|---|---|
| Zer | `themuuln/zer` | Vercel from repository root |
| Tolom | `themuuln/tolom` | Vercel from repository root |
| Onoo web | `themuuln/onoo-web` | Vercel from repository root |
| Zim | `~/.workspace/zim` | Configure its own Vercel project |
| Agent Gateway | `~/.workspace/agent-gateway` | Vercel or Cloudflare from repository root |
| Website | `themuuln/website` | Vercel from repository root |
| Zuiio ID | `themuuln/zuiio-id` | Vercel from repository root |

Set each Vercel project's Root Directory to `.`. Do not use `apps/<name>` paths.

## Shared package release

The `zuiio` repository owns the `@zuiio/*` package versions. Product repositories consume released package versions and keep their own lockfiles.

```bash
pnpm install
pnpm check
pnpm verify
```

Run product development, tests, builds, and deploys from the product repository, not from this repository.
