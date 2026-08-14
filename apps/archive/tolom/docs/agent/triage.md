# Tolom Triage Protocol

Before any task, triage it. Always research first (2-5 mins — read relevant files, understand scope and dependencies), then classify. If ambiguous, default to major.

## Heuristics Table

| Minor → Proceed silently | Major → Research → Recommend → Wait |
|--------------------------|--------------------------------------|
| 1-2 files changed | 3+ files changed |
| No schema/data change | Migration, column semantics, or new table |
| No API response shape change | Breaking API shape or new endpoint |
| Pure UI (spacing, loading, copy, tokens) | Affects business logic (revenue, visibility, auth) |
| Same responsibility, no new concepts | Crosses module boundaries or adds new concepts |
| Production bundle unaffected | New dependency or significant bundle growth |
| Self-contained test addition | Integration tests across multiple services |
| Minor/patch dependency bumps | Anything touching `organization_id` scope logic |
| Type improvements, documentation updates | Bug fixes without clear root cause |

## Behavior Rules

**If Minor:**
- Proceed with research → implement → validate
- Commit and mention the change in passing

**If Major:**
1. **Research** — understand the code area, read docs, explore 2-3 approaches
2. **Present** — lay out options with trade-offs (one paragraph each)
3. **Recommend** — suggest the best path and why
4. **Wait** — do nothing until the user confirms

Default to major when in doubt. When a major change touches shared code (layouts, wrappers, utilities), also note which sibling routes or modules could be affected.
