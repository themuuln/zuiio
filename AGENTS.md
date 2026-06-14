<!-- BEGIN:test-credentials -->
# Test Account

- Email: `themuuln1@gmail.com`
- Password: `Tolom!11`
- Superadmin: `themuuln1@gmail.com` (set via `SUPERADMIN_EMAIL` in `.env.local`)
- SMTP email: `zerone.offical@gmail.com` (set via `smtp_configs` table)
<!-- END:test-credentials -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Key Next.js 16 Deprecations

- **`middleware.ts` → `proxy.ts`** — file convention renamed. Export a `proxy` function, not `middleware`.
- **`skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`** — config flag renamed.
- **`unstable_doesMiddlewareMatch` → `unstable_doesProxyMatch`** — testing utility renamed.
- Middleware defaults to Node.js runtime (not Edge) in v16.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:testing-protocol -->
# Testing & Validation Protocol

After implementing features or making changes, run the testing workflow IN ORDER:

## 1. Build Verification

```bash
npm run build
```

Fix any build errors before proceeding.

## 2. Start Dev Server

```bash
npm run dev
```

Wait for the server to be ready (check for "localhost:3000" in output).

## 3. Browser Validation with agent-browser

Use agent-browser CLI to navigate and validate pages:

```bash
# Navigate to each page
agent-browser open http://localhost:3000/login
agent-browser snapshot -i         # Discover interactive elements & verify page renders

# Check for runtime errors
agent-browser console_messages --level error

# Navigate through key pages
agent-browser open http://localhost:3000/register
agent-browser snapshot -i

agent-browser open http://localhost:3000/
agent-browser snapshot -i

# Log errors after each navigation
agent-browser console_messages --level error

# Take screenshots for visual verification (layout, styling)
agent-browser screenshot --annotate

# Close browser when done
agent-browser close
```

Key rules:
- Always re-snapshot after navigation (DOM refs invalidate)
- Check `console_messages --level error` after each page load
- Use `--annotate` screenshots for visual regression — text snapshots miss layout issues
- Run on ALL routes: `/login`, `/register`, `/`, `/products`, `/inventory`, `/sales`, `/expenses`, `/customers`, `/suppliers`, `/settings`, `/organization/new`

## 4. Runtime Error Detection (Next.js MCP)

Use Next.js DevTools MCP for server-side diagnostics:

```typescript
// Index the dev server to discover available tools
next-devtools_nextjs_index({ port: "3000" })

// Check for compilation errors
next-devtools_nextjs_call({ port: "3000", toolName: "get_errors" })
// Check route information
next-devtools_nextjs_call({ port: "3000", toolName: "get_routes" })
```

## 5. Supabase Validation

Validate data operations are working:

```typescript
// Check tables exist and have expected structure
supabase-zer_list_tables({ schemas: ["public"], verbose: true })

// Check security advisories
supabase-zer_get_advisors({ type: "security" })
supabase-zer_get_advisors({ type: "performance" })

// After performing mutations (signup, create sale, etc.):
supabase-zer_get_logs({ service: "api" })
supabase-zer_get_logs({ service: "auth" })
supabase-zer_get_logs({ service: "postgres" })
```

## 6. Full Validation Checklist

After any implementation, verify ALL of these:

- [ ] `npm run build` — 0 errors
- [ ] `lsp_diagnostics` — 0 errors on changed files
- [ ] Dev server starts without console errors
- [ ] Auth pages render (login, register)
- [ ] Dashboard pages render with correct layout
- [ ] Data pages render (products, inventory, sales, expenses, customers, suppliers)
- [ ] All navigation links work
- [ ] Forms submit without errors
- [ ] No 404s or 500s on any route
- [ ] Session management works (login → redirect, logout → redirect)
- [ ] Supabase RLS policies not blocking legitimate operations

## Required MCPs for Testing

| MCP | Purpose | When to Use |
|-----|---------|-------------|
| `agent-browser` CLI | Browser navigation, snapshots, form interaction, screenshot, console log capture | Every implementation |
| `next-devtools_nextjs_index` | Discover available Next.js MCP tools | Before using Next.js MCP |
| `next-devtools_nextjs_call` | Get compilation errors, route info, runtime diagnostics | After dev server starts |
| `supabase-zer_*` tools | All database operations — migrations, queries, advisories, logs | **Always.** Do NOT use `supabase` CLI. Use Supabase MCP tools exclusively. |

**Supabase CLI is NOT available.** All DB operations use the `supabase-zer_*` MCP tools:

| Operation | Tool |
|-----------|------|
| DDL / schema changes | `supabase-zer_apply_migration` |
| Read queries | `supabase-zer_execute_sql` |
| List tables | `supabase-zer_list_tables` |
| Security audit | `supabase-zer_get_advisors` |
| Auth / API / DB logs | `supabase-zer_get_logs` |

Any attempt to use the `supabase` CLI (link, db push, migration commands) will fail — it is not configured for this project.
<!-- END:testing-protocol -->

<!-- BEGIN:server-action-pattern -->
# Server Actions & `useActionState` Convention

All server actions used with `useActionState` MUST follow this signature:

```typescript
export async function myAction(prevState: { error?: string } | undefined, formData: FormData) {
```

`useActionState` calls the action as `action(prevState, formData)`. The `prevState` parameter is **required** — omitting it causes `formData` to be `undefined`, resulting in `TypeError: Cannot read properties of undefined (reading 'get')`.

**Do NOT write:**
```typescript
export async function myAction(formData: FormData) {  // ❌ TypeError
```

**Always write:**
```typescript
export async function myAction(prevState: { error?: string } | undefined, formData: FormData) {  // ✅
```

Return type: `Promise<{ error?: string } | undefined>` — return `{ error: message }` on failure, `undefined` (via `redirect`) on success.
<!-- END:server-action-pattern -->

<!-- BEGIN:drawer-sheet-conventions -->
# Drawer & Sheet Conventions

This project uses three panel/overlay systems, each suited for different scenarios.

## Quick Reference

| Component | Library | Use Case |
|-----------|---------|----------|
| `@base-ui/react/drawer` (direct) | Base UI | **Slide-in drawers (detail/edit/add)** — right-side panels that replace page navigation for CRUD. Supports nesting via `Drawer.Provider`. |
| `@/components/ui/sheet.tsx` | Base UI Dialog | **Mobile sidebar** — used by `ui/sidebar.tsx` for the responsive sidebar on small screens. |
| `@/components/ui/drawer.tsx` | Vaul | **Mobile bottom sheets** — touch-friendly from-bottom panels. Available but not yet used in app code. |

## Nested Base UI Drawer Pattern

`Drawer.Provider` wraps the entire app in `dashboard-shell.tsx`, so any `Drawer.Root` rendered inside can open nested drawers on top of each other. This is the primary pattern for all detail/edit/add panels.

### Structure

```
<Drawer.Provider>                    // ← in dashboard-shell.tsx (wraps entire app)
  <Drawer.IndentBackground />
  <Drawer.Indent>
    ...sidebar + content...
    <Drawer.Root>                    // ← any child component (e.g. ProductCreateDrawer)
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Viewport>
          <Drawer.Popup>
            <Drawer.Content>
              <Drawer.Title />
              <Drawer.Description />
              <Drawer.Close />
              ...form/children...
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  </Drawer.Indent>
</Drawer.Provider>
```

### Key Rules

- **Always use `@base-ui/react/drawer` directly** for new slide-in drawers. Do NOT use the `ui/drawer.tsx` (Vaul) wrapper — it's a generic utility for bottom-sheet use cases.
- **Wrap the entire drawer** inside `Drawer.Portal > Drawer.Viewport > Drawer.Popup` — this is the Base UI pattern for slide-in panels.
- **Use `Drawer.Root` with `swipeDirection="right"`** for slide-in from the right (the most common pattern).
- **Use `useActionState` + `router.refresh()`** to close the drawer on successful form submission (see `ProductCreateDrawer` for reference).
- **Manage open state** with `useState(false)` — pass `open` and `onOpenChange` to `Drawer.Root`.

### Reference: ProductCreateDrawer

The canonical example is at `src/components/products/product-create-drawer.tsx`. Key patterns:

1. Client component with `"use client"`
2. `const [open, setOpen] = useState(false)` — local state
3. `useActionState` + `useEffect` to close on success: `if (state && "success" in state) { setOpen(false); router.refresh(); }`
4. Renders a `Drawer.Trigger` (the button), and the drawer panel via `Drawer.Portal`
5. Form submission calls `formAction`, drawer auto-closes on redirect

### When to use a Drawer vs. a Page

| Scenario | Approach |
|----------|----------|
| Creating a new record on a list page | **Drawer** (slide-in from right, closes on success) |
| Editing a record from a list/detail page | **Drawer** (nested if already in a drawer) |
| Complex multi-step form with many fields | **Page** (dedicated `/new` route) |
| Detail view of a record | **Drawer** or **Page** depending on complexity |
| Mobile sidebar navigation | **Sheet** (`ui/sheet.tsx`) |
<!-- END:drawer-sheet-conventions -->

<!-- BEGIN:post-task-validation -->
# Post-Task Validation & UAT/QA Checklist

After EVERY task completion, the agent MUST:

1. **Run the validation protocol** (see Testing & Validation Protocol above) — build, dev server, browser checks, MCP diagnostics
2. **Create a UAT/QA test case table** covering the change scope
3. **Mark each test case as ✅ Pass / ❌ Fail / ⏭️ Skipped**
4. **Document pre-existing issues** separately (not caused by current changes)

## UAT/QA Test Case Format

```
## UAT / QA Test Case List — [Feature Name]

| # | Test Case | Status |
|---|-----------|--------|
| 1 | Build passes without type errors | ✅ Pass |
| 2 | [Specific page] renders correctly | ✅ Pass |
| 3 | [Specific form] submits without errors | ✅ Pass |
| ... | ... | ... |

### What was fixed

[Summary of changes and root cause]

### Pre-existing issues (not caused by this fix)

- [Issue 1]
- [Issue 2]
```
<!-- END:post-task-validation -->
