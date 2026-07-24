# Task 2: Context memoization + React Compiler in production

**Goal:** Stop re-rendering every `useOrgSettings()` consumer on every shell render, and let the React Compiler auto-memoize in production builds.

Read `docs/performance/README.md` ground rules first.

## Fix 1 — Memoize `OrgSettingsProvider` value

`src/lib/org-settings-context.tsx` line 60 (verified):

```tsx
<OrgSettingsContext.Provider value={{ ...defaults, ...value }}>
```

A new object is created on every render, so **all** context consumers re-render whenever the provider's parent re-renders. Change to:

```tsx
export function OrgSettingsProvider({
  value,
  children,
}: {
  value: Partial<OrgSettings>;
  children: React.ReactNode;
}) {
  const merged = useMemo(() => ({ ...defaults, ...value }), [value]);
  return (
    <OrgSettingsContext.Provider value={merged}>
      {children}
    </OrgSettingsContext.Provider>
  );
}
```

(Add `useMemo` to the existing `react` import.)

## Fix 2 — Stabilize the `value` prop at the call sites

Fix 1 is useless if callers pass a fresh object literal every render. Find every `<OrgSettingsProvider` usage:

```bash
grep -rn "OrgSettingsProvider" src/ --include="*.tsx"
```

Known hot spot: `src/app/(dashboard)/dashboard-shell.tsx` (a large `"use client"` component; provider usages near lines 385 and 435 on audit date) spreads a new settings object inline. In each client-component call site, hoist the object into `useMemo`:

```tsx
const orgSettingsValue = useMemo(
  () => ({ ...orgSettings, organizationId }),
  [orgSettings, organizationId],
);
// ...
<OrgSettingsProvider value={orgSettingsValue}>
```

If a call site is a **server component** passing a plain object (e.g. `dashboard-fetcher.tsx`), leave it alone — RSC props are stable between renders and `useMemo` is not available there.

## Fix 3 — Enable React Compiler in production

`next.config.ts` line 13 (verified):

```ts
reactCompiler: process.env.NODE_ENV === "development",
```

Change to:

```ts
reactCompiler: true,
```

This lets the compiler auto-memoize components in production builds. Expect `pnpm build` to take noticeably longer — that is normal. If the build **fails** with a React Compiler error naming a specific file, report the file and revert only this line (keep Fixes 1–2); do not attempt to rewrite the offending component.

## Do NOT

- Do not refactor `dashboard-shell.tsx` beyond wrapping provider values in `useMemo`.
- Do not add `useMemo`/`useCallback` anywhere else "while you're at it".
- Do not change the `OrgSettings` interface or defaults.

## Definition of done

- [ ] `org-settings-context.tsx` provider value memoized
- [ ] Every client-side `<OrgSettingsProvider>` call site passes a memoized value
- [ ] `reactCompiler: true` in `next.config.ts` and `pnpm build` passes (or the failure is reported and the flag reverted)
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] Browser check (`next-dev-loop` skill): dashboard, shop POS page, and settings page all render and behave normally
