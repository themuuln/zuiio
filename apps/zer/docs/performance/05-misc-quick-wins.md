# Task 5: Misc quick wins

Three small, independent fixes. Read `docs/performance/README.md` ground rules first.

## Fix 1 — Phosphor icons: cover the `/dist/ssr` subpath in optimizePackageImports

56 files import icons from `@phosphor-icons/react/dist/ssr` (verified), but `next.config.ts` line 20 only lists the package root:

```ts
optimizePackageImports: [
  "@phosphor-icons/react",
  "@tanstack/react-query",
  "date-fns",
  "lucide-react",
],
```

`optimizePackageImports` matches the exact import specifier, so the `/dist/ssr` barrel is not optimized. Add the subpath:

```ts
optimizePackageImports: [
  "@phosphor-icons/react",
  "@phosphor-icons/react/dist/ssr",
  "@tanstack/react-query",
  "date-fns",
  "lucide-react",
],
```

Before committing, confirm against the bundled Next.js docs (`node_modules/next/dist/docs/` — search for `optimizePackageImports`) that subpath entries are supported in this Next version. If the docs say the root entry already covers subpaths, skip this fix and note it in your report.

## Fix 2 — Targeted revalidation in onboarding

`src/app/(onboarding)/onboarding/actions.ts` line 232 (verified):

```ts
revalidatePath("/");
```

Replace with the project's centralized helper (see `src/lib/revalidate.ts`):

```ts
import { revalidateEntities } from "@/lib/revalidate";
// ...
revalidateEntities(["settings", "products", "branches"]);
revalidatePath("/");
```

Read the surrounding action first: revalidate the entities that onboarding actually creates/modifies (org settings, initial products, branches — adjust the list to what the action really touches). Keep the single `revalidatePath("/")` for the dashboard home page itself. Remove the now-unused import if nothing else in the file uses `revalidatePath` — check before removing.

## Fix 3 — Middleware: replace `getUser()` network call with local JWT verification

**This is the medium-risk item — follow the verification steps exactly.**

`src/lib/supabase/proxy.ts` line 32 (verified) calls `supabase.auth.getUser()` on **every matched request**, which is a network round-trip to Supabase Auth per navigation/prefetch.

Supabase's current guidance for `@supabase/ssr` middleware is `supabase.auth.getClaims()`, which verifies the JWT locally (with asymmetric keys) and only hits the network to refresh an expired session.

Steps:

1. Read the current docs first: `node_modules/@supabase/supabase-js/AGENTS.md` and https://supabase.com/docs/guides/auth/server-side/nextjs . Confirm `getClaims()` is the recommended middleware pattern for the installed `@supabase/ssr` version (check `package.json`). If the installed version predates `getClaims`, STOP and report instead of upgrading packages.
2. Read all of `proxy.ts` before editing. Note line ~119: the code relies on `getUser()` refreshing/clearing session cookies via `setAll`, and line ~157 forwards the user ID as a header so downstream code can skip a duplicate `getUser()`. Your replacement must preserve both behaviors:
   - `getClaims()` must still trigger cookie refresh through the same client (it uses the session internally; confirm in docs).
   - The forwarded header must carry the same user ID value — with claims, that is the `sub` claim.
3. Make the swap. Typical shape (adapt to the file's actual structure):

```ts
const { data } = await supabase.auth.getClaims();
const claims = data?.claims ?? null;
// user id: claims?.sub
```

4. Handle the null case exactly as the current code handles a null user (redirect to login etc. — do not change redirect logic).

### Required runtime verification (next-dev-loop / browser)

- [ ] Logged-out user hitting `/` (dashboard) is redirected to login
- [ ] Login works and lands on the dashboard
- [ ] Authenticated navigation between 3+ dashboard pages works
- [ ] Logout works; hitting a dashboard URL afterwards redirects to login
- [ ] No redirect loop (the proxy has loop protection — make sure it doesn't trigger; watch for `captureRedirectLoop` in logs)
- [ ] `grep "\[capture\]" .next/dev/logs/next-development.log` shows no new auth errors

If any check fails, revert Fix 3 entirely (keep Fixes 1–2) and report the failure.

## Definition of done

- [ ] All three fixes applied (or individually skipped with a documented reason)
- [ ] Fix 3 runtime checklist fully passed, or Fix 3 reverted + reported
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
