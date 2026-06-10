---
name: codebase-review
description: Comprehensive codebase review for tolom — UI/UX, accessibility, code standards, performance, testing, and architecture. Use when reviewing PRs, auditing modules, doing pre-merge checks, or requesting a full code review. Loads all sub-skill standards into a single review pass.
disable-model-invocation: true
---

# Codebase Review

Full review pass. Run every section. Report findings per section with severity: 🔴 blocker, 🟡 warning, 🔵 nit.

---

## Review Process

1. **Read the diff** — understand what changed and why
2. **Run each section below** — check every applicable rule
3. **Group findings** — block together, warn together, nits together
4. **Suggest fixes** — don't just flag, show the fix
5. **Score the review** — summary with pass/fail per section

---

## 1. UI/UX Review

Load `.pi/skills/design-system/SKILL.md` for full token reference.

### Visual Consistency

| Check | Severity | Rule |
|-------|----------|------|
| Semantic color tokens only | 🔴 | No `bg-blue-500`, `text-gray-500`, `border-red-*` |
| No arbitrary spacing | 🔴 | No `mt-[37px]`, `p-[12px]` — use the scale |
| `gap-*` with flex | 🟡 | Not `space-y-*` or `space-x-*` |
| `size-*` for equal w/h | 🔵 | `size-10` not `w-10 h-10` |
| `truncate` shorthand | 🔵 | Not `overflow-hidden text-ellipsis whitespace-nowrap` |
| shadcn components used | 🔴 | No raw HTML for buttons, dialogs, cards, inputs |
| Compound component pattern | 🟡 | Props soup → sub-components |
| Component extracted at 3+ copies | 🟡 | Same className pattern repeated 3+ times |

### Component Structure

| Check | Severity | Rule |
|-------|----------|------|
| File < 400 lines | 🟡 | Must split at 500+ |
| Private files `_`-prefixed | 🔴 | Only imported by siblings |
| Correct naming | 🔴 | kebab-case files, PascalCase components |
| `_types.tsx` for type definitions | 🔵 | Types co-located or in `_types` |

### Animations

| Check | Severity | Rule |
|-------|----------|------|
| Uses preset keyframes | 🟡 | `fade-slide-in`, `scale-in`, etc. |
| Duration < 300ms | 🟡 | For UI feedback |
| `prefers-reduced-motion` respected | 🟡 | Non-essential animations wrapped |
| Uses project easing vars | 🔵 | `--ease-out-expo`, `--ease-out-quart` |

### Tablet Touch

| Check | Severity | Rule |
|-------|----------|------|
| Touch targets ≥ 44px | 🔴 | In `.tablet-touch` sections |
| `-webkit-tap-highlight-color: transparent` | 🟡 | On interactive elements |
| `touch-action: manipulation` | 🔵 | Disable double-tap zoom |

---

## 2. Accessibility Review

Load `.pi/skills/accessibility/SKILL.md` for full patterns.

### Focus Management

| Check | Severity | Rule |
|-------|----------|------|
| Focus ring visible | 🔴 | `ring-2 ring-ring/50` on all interactive elements |
| No `outline: none` without replacement | 🔴 | Must have visible alternative |
| Focus trap in dialogs | 🔴 | Radix default — don't override `onOpenAutoFocus` |
| Focus restoration on close | 🟡 | Radix handles — don't suppress |
| Skip link on sidebar pages | 🟡 | `sr-only focus:not-sr-only` link to `#main-content` |

### Keyboard Navigation

| Check | Severity | Rule |
|-------|----------|------|
| All buttons/links keyboard accessible | 🔴 | Native elements or `role` + `tabIndex` + `onKeyDown` |
| No `onClick` on `<div>` without keyboard | 🔴 | Add `role="button"` + `tabIndex={0}` + `onKeyDown` |
| Escape closes overlays | 🔴 | Dialogs, sheets, popovers |
| Arrow keys in custom widgets | 🟡 | Tabs, menus, listboxes |

### ARIA

| Check | Severity | Rule |
|-------|----------|------|
| Interactive elements labeled | 🔴 | `<Label>`, `aria-label`, or visible text |
| Placeholder ≠ label | 🔴 | Must have `<Label>` or `aria-label` |
| `aria-live` for dynamic content | 🟡 | Result counts, status changes |
| Semantic landmarks | 🟡 | `<header>`, `<nav>`, `<main>`, `<aside>` |
| Tables use `<TableHead scope="col">` | 🟡 | For data tables |
| Images have `alt` | 🔴 | Decorative: `alt=""` |
| Icon-only buttons have `aria-label` | 🔴 | `<X>` close buttons, etc. |

### Color & Contrast

| Check | Severity | Rule |
|-------|----------|------|
| Text contrast ≥ 4.5:1 | 🔴 | Normal text |
| UI components ≥ 3:1 | 🔴 | Borders, icons |
| No color-only indicators | 🟡 | Add icon or text alongside color |

### Forms

| Check | Severity | Rule |
|-------|----------|------|
| Every input has `<Label>` | 🔴 | Or `aria-label` |
| Error messages associated | 🔴 | `aria-describedby` or `aria-invalid` |
| Required fields marked | 🟡 | `required` attribute or `aria-required` |
| Fieldset + legend for groups | 🔵 | Radio groups, checkbox groups |

---

## 3. Code Standards Review

Load `.pi/skills/code-standards/SKILL.md` for full patterns.

### TypeScript

| Check | Severity | Rule |
|-------|----------|------|
| No `any` without comment | 🔴 | `// biome-ignore` with reason |
| Types from `@/lib/types` | 🔴 | Never `@/lib/database.types` |
| Strict mode compliance | 🔴 | No `@ts-ignore` or `@ts-expect-error` without reason |
| Interface over type (for objects) | 🔵 | `interface` for props, `type` for unions |

### Imports

| Check | Severity | Rule |
|-------|----------|------|
| Import order correct | 🟡 | Node → External → Internal → Relative |
| No unused imports | 🔴 | Biome enforces |
| Specific imports | 🟡 | `import { format } from "date-fns"` not `import *` |
| No barrel re-exports (unless needed) | 🔵 | Direct imports preferred |

### Data Flow

| Check | Severity | Rule |
|-------|----------|------|
| No `fetch()` + `useState` in pages | 🔴 | Use React Query |
| API routes use `api-handler.ts` | 🔴 | Not raw `NextResponse.json()` |
| Services for business logic | 🔴 | Not in API routes or components |
| No Supabase calls in components | 🔴 | Via services → API routes |

### State Management

| Check | Severity | Rule |
|-------|----------|------|
| Server data → React Query | 🔴 | Not `useState` + `useEffect` |
| URL state → nuqs | 🟡 | Pagination, search, filters |
| Form state → react-hook-form | 🟡 | Not manual state |
| Zustand has `devtools + persist + immer` | 🟡 | All three middleware |
| Zustand exports selector hooks | 🔴 | Not destructuring full store |

### Error Handling

| Check | Severity | Rule |
|-------|----------|------|
| Typed error classes | 🟡 | Not generic `Error` |
| API errors use `api-handler` | 🔴 | Automatic error formatting |
| Mutation errors → toast | 🟡 | User-facing feedback |
| Query errors → ErrorState | 🟡 | Not silent failures |

---

## 4. Performance Review

Load `.pi/skills/performance/SKILL.md` for full patterns.

### Server vs Client

| Check | Severity | Rule |
|-------|----------|------|
| Server Component by default | 🔴 | `"use client"` only with reason |
| No `"use client"` for static content | 🔴 | Server Components ship zero JS |
| Heavy components dynamic imported | 🟡 | Charts, editors, complex modals |

### Images

| Check | Severity | Rule |
|-------|----------|------|
| `next/image` used | 🔴 | Not raw `<img>` |
| `width` + `height` specified | 🔴 | Prevents CLS |
| `priority` on LCP image | 🟡 | Above-fold hero images |
| `sizes` for responsive | 🔵 | Browser picks optimal |

### Loading States

| Check | Severity | Rule |
|-------|----------|------|
| Skeleton, not spinner | 🟡 | For data loading |
| Page chrome preserved on refetch | 🟡 | `hasLoadedOnce` pattern |
| No layout shift from loading | 🟡 | Skeleton matches final layout |

### React Query

| Check | Severity | Rule |
|-------|----------|------|
| Structured query keys | 🟡 | Hierarchical, enable targeted invalidation |
| Appropriate `staleTime` | 🟡 | Not default (0) for everything |
| Optimistic updates on mutations | 🟡 | With rollback |
| Prefetch on hover | 🔵 | For navigation links |

### Bundle

| Check | Severity | Rule |
|-------|----------|------|
| No entire-library imports | 🟡 | `import { format }` not `import * as` |
| Heavy libs avoided | 🔵 | `date-fns` over `moment`, `lucide` over `heroicons` |

---

## 5. Testing Review

### Unit & Integration

| Check | Severity | Rule |
|-------|----------|------|
| Service functions have tests | 🔴 | Every function in `src/lib/services/` |
| API routes have tests | 🔴 | Integration tests |
| RLS policies tested | 🔴 | Org A ≠ Org B data |
| Test naming convention | 🟡 | `describe('Service')` / `it('does thing')` |
| Test files co-located | 🔵 | `__tests__/` or alongside source |

### E2E

| Check | Severity | Rule |
|-------|----------|------|
| Auth session reused | 🟡 | `global-setup.ts` → `.auth/user.json` |
| shadcn selectors (ARIA roles) | 🔴 | Not CSS classes |
| Route mocking for edge cases | 🟡 | `playwright_browser_route` |

### Test Quality

| Check | Severity | Rule |
|-------|----------|------|
| Tests real behavior, not implementation | 🟡 | No testing internal state |
| Full lifecycle tested | 🟡 | Create → Update → Delete → Verify |
| Edge cases covered | 🟡 | Empty states, errors, loading |

---

## 6. Architecture Review

### Module Boundaries

| Check | Severity | Rule |
|-------|----------|------|
| Feature modules isolated | 🟡 | Don't import from unrelated modules |
| Shared components in `src/components/` | 🔴 | Not duplicated across modules |
| Services are stateless | 🟡 | No module-level mutable state |
| API routes are thin | 🟡 | Logic in services, not routes |

### Dependencies

| Check | Severity | Rule |
|-------|----------|------|
| No new deps without justification | 🟡 | Check bundle impact |
| No deprecated APIs | 🟡 | Check Next.js, React version |
| Supabase queries use typed client | 🔴 | Not raw SQL strings |

### Multi-Tenancy

| Check | Severity | Rule |
|-------|----------|------|
| `organization_id` on every query | 🔴 | No cross-org data leaks |
| RLS policies exist | 🔴 | Every new table |
| Service functions inherit RLS | 🔴 | Don't bypass with service role |

---

## 7. Documentation Review

| Check | Severity | Rule |
|-------|----------|------|
| VISION.md updated for new features | 🟡 | Architecture changes |
| Module AGENTS.md updated | 🔵 | Module-specific patterns |
| `docs/*.md` updated for user-facing changes | 🟡 | VitePress docs |
| Inline comments for complex logic | 🔵 | Why, not what |

---

## Review Output Format

```markdown
## Review: [PR/Module Name]

### Summary
[1-2 sentence overview of what changed and overall quality]

### 🔴 Blockers (must fix)
1. **[file:line]** — [issue]
   Fix: `[code fix]`

### 🟡 Warnings (should fix)
1. **[file:line]** — [issue]
   Fix: `[code fix]`

### 🔵 Nits (nice to fix)
1. **[file:line]** — [issue]

### Section Scores
| Section | Score |
|---------|-------|
| UI/UX | ✅ Pass / ❌ Fail |
| Accessibility | ✅ Pass / ❌ Fail |
| Code Standards | ✅ Pass / ❌ Fail |
| Performance | ✅ Pass / ❌ Fail |
| Testing | ✅ Pass / ❌ Fail |
| Architecture | ✅ Pass / ❌ Fail |
| Documentation | ✅ Pass / ❌ Fail |

### Verdict
**APPROVE** / **APPROVE WITH CHANGES** / **REQUEST CHANGES**
```

---

## Auto-Review Checklist

Before any PR merge or task completion, run through every section. Don't skip sections that "don't apply" — check if they do.

| Section | Always Check? |
|---------|--------------|
| UI/UX | If any UI files changed |
| Accessibility | If any interactive component changed |
| Code Standards | Every change |
| Performance | If pages, components, or data fetching changed |
| Testing | If services, API routes, or RLS changed |
| Architecture | If new files or cross-module changes |
| Documentation | If user-facing features changed |
