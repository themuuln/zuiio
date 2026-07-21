# Task Template

Copy this file and fill in the fields. File name: `T-<id>-<kebab-name>.md`.

---

**ID:** `T-<N.M>`
**Name:** Task name
**Status:** `⬜ not started` | `🟡 in progress` | `✅ done` | `🔴 blocked`
**Priority:** `P0` (blocker) | `P1` (core) | `P2` (valuable) | `P3` (someday)
**Phase:** Phase N — Phase name
**Effort:** `XS` (< 1h) | `S` (2-4h) | `M` (1-2d) | `L` (3-5d) | `XL` (1-2w)
**Tags:** `backend`, `frontend`, `data`, `core`, `devops`, `design`, `docs`, `testing`

---

## Goal

_One-line description of what this task achieves._

## Why

_Why this task matters — the user or system benefit. 1-2 sentences._

## Files to Touch

```
- path/to/file.ts              — what changes here
- path/to/new-file.ts          — NEW: what it does
```

## Data Dependencies

_Tables, views, APIs, RPCs this task reads or writes._

| Entity | Access | Purpose |
|--------|--------|---------|
| `table_name` | Read only | Reason |
| `public.function()` | Execute | Reason |

## Implementation Steps

1. _Step description_
2. _Step description_
3. ...

## Done When

_Verifiable conditions. Each must be testable._

- [ ] _Condition 1 (e.g., `pnpm exec tsc --noEmit` passes)_
- [ ] _Condition 2 (e.g., page renders at 360px without horizontal scroll)_
- [ ] _Condition 3 (e.g., ROADMAP.md checkbox ticked in same commit)_

## Dependencies

**Blocked by:** `T-<N.M>` — _reason_
**Blocks:** `T-<N.M>` — _what becomes available after this_

## Design Decisions

- _Decision rule 1 (e.g., "use Recharts AreaChart not BarChart — we need area fill for visual impact")_
- _Decision rule 2_

## Risks & Gotchas

- _Risk 1: mitigation_
- _Risk 2: mitigation_

## Verification

```bash
# Commands to verify this task
pnpm exec tsc --noEmit          # Type check
pnpm build                      # Build
pnpm -F @onoo/core test         # Core package tests (if core touched)
```

## Notes

_Any additional context, environment constraints, or implementation hints._

---

_Last updated: YYYY-MM-DD | Status: ⬜_
