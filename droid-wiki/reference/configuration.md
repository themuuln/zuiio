# Configuration

Active contributors: themuuln

## Environment variables (`.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret — never expose to client) | Yes |
| `CRON_SECRET` | Secret for cron job endpoints (e.g., daily report cron) | For scheduled tasks |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (default: `http://localhost:3000`) | For email links |
| `SUPERADMIN_EMAIL` | Superadmin email for elevated access | For superadmin features |
| `E2E_EMAIL` | E2E test user email (default: `themuuln1@gmail.com`) | For testing |
| `E2E_PASSWORD` | E2E test user password (default: `Tolom!11`) | For testing |
| `PLAYWRIGHT_BASE_URL` | Base URL for Playwright tests (default: `http://localhost:3000`) | For E2E tests |
| `SHOW_BROWSER` | Set to show browser UI during Playwright tests | For debugging |
| `MIDSCENE_MODEL_BASE_URL` | Midscene AI model base URL | For AI-assisted tests |
| `MIDSCENE_MODEL_API_KEY` | Midscene AI model API key | For AI-assisted tests |
| `MIDSCENE_MODEL_NAME` | Midscene AI model name | For AI-assisted tests |
| `MIDSCENE_MODEL_FAMILY` | Midscene AI model family | For AI-assisted tests |

## Supabase configuration (`supabase/config.toml`)

The Supabase CLI configuration for local development:

- **API**: Enabled on port 54321, schemas include `public`, `storage`, `graphql_public`.
- **Database**: Default port 54322.
- **Auth**: Enabled with email confirmations required.
- **Storage**: Enabled with 50MB file size limit.
  - Custom bucket: `brand_assets` — public, 2MB limit, allowed MIME types: image/png, image/jpeg, image/webp, image/svg+xml.

## Database migrations

Migrations are in `supabase/migrations/` following the naming convention `YYYYMMDDHHMMSS_description.sql`. There are 32 migration files covering:

- Schema creation (tables, indexes, RLS policies)
- Data migrations (seed data, default roles)
- Function definitions (stored procedures, triggers)
- Enum types (`app_permission`)

## TypeScript configuration

Key settings from `tsconfig.json` (strict mode):

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- Path alias: `@/*` → `src/*`
- Target: ES2017
- Module: ESNext
- Module resolution: bundler
- JSX: preserve
