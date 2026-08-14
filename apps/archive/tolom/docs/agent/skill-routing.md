# Tolom Skill Routing — Full Matrix

Load skills BEFORE coding. Earlier skills set context for later ones.

## Skill Loading Rules

| When Task Is... | Load These Skills |
|-----------------|-------------------|
| **New component/page** | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` → `responsive-design` |
| **New form** | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` → `testing-patterns` |
| **New dialog/sheet/modal** | `tolom-anti-slop` → `design-system` → `ux-laws` → `accessibility` → `code-standards` |
| **New service function** | `supabase-patterns` → `code-standards` → `testing-patterns` |
| **New API route** | `supabase-patterns` → `code-standards` → `error-handling` → `testing-patterns` |
| **New migration** | `supabase-patterns` → `testing-patterns` |
| **New mutation (create/update/delete)** | `optimistic-ui` → `error-handling` → `supabase-patterns` |
| **Writing tests** | `testing-patterns` |
| **Fixing a bug** | `code-standards` (read relevant section) |
| **Optimizing performance** | `performance` |
| **Responsive/layout work** | `tolom-anti-slop` → `ux-laws` → `responsive-design` → `design-system` |
| **Theme/visual changes** | `tolom-anti-slop` → `ux-laws` → `design-system` |
| **Accessibility audit** | `ux-laws` → `accessibility` |
| **Toast/notification work** | `error-handling` |
| **Design cleanup / anti-slop removal** | `tolom-anti-slop` → `ux-laws` → `impeccable` → `redesign-existing-projects` → `design-taste-frontend` |
| **Visual polish / UI refinement** | `tolom-anti-slop` → `ux-laws` → `impeccable` (polish) → `design-system` |
| **Design audit / critique** | `tolom-anti-slop` → `ux-laws` → `impeccable` (critique) → `design-system` |
| **Redesign existing page/feature** | `tolom-anti-slop` → `ux-laws` → `impeccable` → `redesign-existing-projects` → `design-system` |
| **Database queries** | `supabase-patterns` |
| **PR review / audit** | **Manual:** `/skill:codebase-review` |

## Per-Task Examples

- "Add a customer form" → `design-system` + `ux-laws` + `accessibility` + `code-standards` + `testing-patterns`
- "Create invoice refund endpoint" → `supabase-patterns` + `code-standards` + `error-handling` + `testing-patterns`
- "Fix bay view layout on iPad" → `ux-laws` + `responsive-design` + `design-system`
- "Add optimistic update to work order status" → `optimistic-ui` + `error-handling` + `supabase-patterns`
- "Write tests for expense service" → `testing-patterns` + `supabase-patterns`
- "Add dark mode toggle" → `design-system` + `ux-laws` + `accessibility` + `code-standards`
