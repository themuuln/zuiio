# Zuiio Platform Architecture

This repository owns the shared `@zuiio/*` package ecosystem. Product applications are independent repositories. They install released package versions and own their source, CI, deployment, Supabase configuration, and migrations.

## Repository layout

```text
zuiio/
├── packages/
│   ├── config/       Shared TypeScript configuration
│   ├── branding/     Design tokens
│   ├── core/         Formatting, validation, and domain rules
│   ├── hooks/        Generic React hooks
│   ├── query/        TanStack Query helpers
│   ├── offline/      Offline mutation queue
│   ├── realtime/     Realtime cache invalidation
│   ├── supabase/     Supabase helpers
│   ├── auth/         Supabase federation helpers
│   ├── oidc/         Direct OIDC helpers
│   ├── capture/      Error capture protocol
│   ├── export/       CSV, XLSX, DOCX, and PDF helpers
│   ├── hr/           Mongolian payroll rules
│   ├── i18n/         Internationalisation helpers
│   ├── search/       Search utilities
│   ├── sdk/          Shared SDK surface
│   ├── ui/           Shared utility components
│   └── ai-agent/     Provider abstraction and tool calling
├── docs/             Platform and package documentation
├── scripts/          Platform automation only
└── pnpm-workspace.yaml
```

## Product repositories

Products such as Zer, Tolom, Khosuud, Tumurch, Tamga, Onoo, Zim, Zraf, Zunch, and Agent Gateway live outside this repository. Each product repository has one application boundary and one independent lockfile.

## Package dependency graph

```text
core → hooks → offline → query

ai-agent → gateway-specific modules in Agent Gateway
capture, branding, export, auth, oidc, hr, i18n, search, supabase, ui, sdk
```

Product-only gateway modules are local workspace packages in the Agent Gateway repository. Generic packages are consumed from the package registry.

## Invariants

- Every product owns its deployment and environment configuration.
- Every product owns its Supabase migrations and generated database types.
- Every data query remains scoped by `organization_id` where the product has organizations.
- Service-role credentials never reach client code.
- Shared packages expose compiled `dist` artifacts.
- Standalone applications never use `workspace:*` for packages outside their repository.
- Shared package versions are released independently and recorded in each app lockfile.

## Design and engineering rules

Biome is the formatter and linter. Turbopack is the default Next.js bundler. React and TanStack Query remain peer-safe in shared packages. CSS design tokens remain in `@zuiio/branding`.
