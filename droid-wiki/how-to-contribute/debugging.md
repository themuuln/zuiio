# Debugging

Active contributors: themuuln

## Common issues

### Dev server won't start

Check `.env.local` has valid Supabase credentials. Run `curl -s http://localhost:3000/` to confirm the server responds with a 307 redirect (to login).

### E2E tests fail with auth timeout

The auth setup test attempts to log in via the login form. If it times out:

- Verify the dev server is running on port 3000
- Check `.env.local` has `E2E_EMAIL` and `E2E_PASSWORD` set
- Run the auth test in isolation: `npx playwright test e2e/auth.setup.ts`
- Old auth sessions can expire — delete `.auth/user.json` and re-run

### TypeScript errors in `product-create-drawer.tsx`

There is a known pre-existing type error on `main` branch with `setVariantData` that has been inherited. This is not caused by new changes.

### Database migration fails

Run `npx supabase db push --linked --include-all` to apply pending migrations. The Supabase CLI requires a linked project (`npx supabase link --project-ref <ref>`).

### RLS policy errors

If a query returns no data unexpectedly, check:

1. The user's organization_id matches the data
2. The user has the required permission via `has_permission()`
3. The user has branch access via `user_has_branch_access()`

## Logs

- **Next.js server logs**: stdout from `pnpm dev` or `pnpm build`
- **Supabase local logs**: `npx supabase logs`
- **Playwright traces**: `test-results/` directory with trace.zip files — view with `npx playwright show-trace <file>`
- **Midscene AI traces**: `midscene_run/` directory

## Tools

- **Playwright Trace Viewer**: `npx playwright show-trace test-results/<trace>.zip`
- **React Query DevTools**: Available in dev mode when `NEXT_PUBLIC_RQ_DEVTOOLS` is set
- **Supabase Studio**: `https://supabase.com/dashboard/project/<ref>` for DB inspection, RLS debugging, and query logs
