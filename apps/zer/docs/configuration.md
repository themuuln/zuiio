---
title: Configuration
desc: Project configuration files
---

# Configuration

## Key Configuration Files

| File                 | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `next.config.ts`     | Next.js configuration (images, experimental features) |
| `tsconfig.json`      | TypeScript compiler options                           |
| `biome.json`         | Linting and formatting rules                          |
| `tailwind.config.ts` | Tailwind CSS theme customization                      |
| `components.json`    | shadcn/ui component registry                          |
| `.env.local`         | Local environment variables                           |

## Environment Variables

See [Getting Started](/getting-started.html) for the full list of environment variables.

## Theme

Organization theme is configured via `brand_config` JSON in the Supabase `organizations` table. Supports:

- Logo URL
- Primary color scheme
- Font family
- Custom CSS injection via `<style id="brand-theme">`

## Role-Based Access

Permissions are defined in the `roles` and `permissions` database tables. Each user can have one role. The `<PermissionGate>` component conditionally renders UI based on the current user's permissions.
