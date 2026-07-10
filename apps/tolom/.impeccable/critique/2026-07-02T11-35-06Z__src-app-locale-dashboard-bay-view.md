---
target: src/app/[locale]/dashboard/bay-view/
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-07-02T11-35-06Z
slug: src-app-locale-dashboard-bay-view
---
# Bay View — Design Critique

Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Live elapsed timers, urgency pulses, realtime subscriptions, celebration completion overlay |
| 2 | Match System / Real World | 4 | Bay/queue/mechanic maps 1:1 to garage floor; status flow mirrors repair lifecycle; Mongolian plate format |
| 3 | User Control and Freedom | 3 | Three view modes, three empty-bay pathways, fullscreen toggle; **missing undo for forward status transitions** |
| 4 | Consistency and Standards | 3 | Single STATUSES record drives all colors; **urgency accent colors bypass constants system** |
| 5 | Error Prevention | 2 | Guarded sensors, pending state, UnsavedWarning, batch confirmation; **no confirmation on remove-from-bay or forward transitions** |
| 6 | Recognition Rather Than Recall | 3 | All toolbar actions have tooltips; **icon-only bay card footer buttons invisible at first scan** |
| 7 | Flexibility and Efficiency | 3 | Keyboard sensor, Cmd+K, view modes; **only one keyboard shortcut, no bay nav shortcuts** |
| 8 | Aesthetic and Minimalist | 4 | Clean card layout, inline KPI cards, subtle dot-grid empty states, hasLoadedOnce polish |
| 9 | Error Recovery | 3 | ErrorBoundary, retry buttons, per-bay error wrappers, UnsavedWarning; **generic error messages** |
| 10 | Help and Documentation | 1 | Only hover tooltips; **zero onboarding, no help icon, no contextual guidance** |
| **Total** | | **30/40** | **Good — address weak areas, solid foundation** |

## Anti-Patterns Verdict

**Start here. Does this look AI-generated?** No. **AI-Slop Verdict: clean.**

The 4px side-stripe on bay cards is functional (status color + urgency pulse), not decorative. All-caps micro-labels on toolbar sections and column headers are standard dashboard micro-label typography, not the 2023-era eyebrow trope. The dot-grid empty state pattern is subtle (8% opacity) and appropriate. The palette strictly adheres to the monochrome-neutral design constraint — no cream backgrounds, no gradient text, no ghost-cards, no over-rounding. This is a professionally designed interface that reads as intentional, not generated.

**Deterministic scan:** The CLI detector returned zero findings across all 87 files in `src/components/bay-view-v2/`. Every rule (gradient-text, side-tab, bounce-easing, layout-transition, ai-color-palette, etc.) was checked and none triggered. The one potential false-negative (`border-l-2` in `_empty-bay-action-drawer.tsx`) is a multi-line className edge case the line-by-line regex can't catch, not a code quality issue.

**Browser visualization:** The dev server loaded the bay-view page successfully. Visible: six bay cards (4 occupied with Mongolian plates, 2 empty), 4 KPI cards (bay utilization 67%, active jobs, completions, revenue), toolbar with search + filters + view mode selector, full sidebar navigation, status filter tabs. The injected detector script returned `{ total: 0, rules: {} }` — zero browser-level anti-patterns.

## Overall Impression

This is a well-built, functional dashboard that understands its domain deeply. The status color system is exemplary — a single `STATUSES` record that every component derives from at module-load time, with a Tailwind safelist for JIT. The `hasLoadedOnce` pattern in the detail drawer (delay content tree insertion 320ms for smooth slide-in animation) is production-grade polish. The real concern isn't slop or poor design — it's the gap between "works well for an experienced user" and "works at all for a first-timer." Zero onboarding, hidden icon-only actions, and no undo path are the weak points.

## What's Working

- **`_constants.tsx:1-90`** — The status color system is a masterclass in maintainable design code. One `STATUSES` record, module-load-time derived maps, and a safelist block for Tailwind JIT. Every component reads from these exports; zero duplicated color logic across 90 files.
- **`_kpi-cards.tsx:208-390`** — Inline, borderless KPI cards with drill-down dialogs showing per-bay occupancy rows. Summary-at-a-glance vs detail-on-demand is textbook progressive disclosure. Clicking a KPI reveals the specific bays contributing to that metric.
- **`work-order-detail-drawer.tsx:115-120`** — The `hasLoadedOnce` pattern delays full content tree insertion by 320ms to let the drawer slide-in animation finish before layout thrash. Combined with staggered fade-slide-in on each section — this is production-grade polish rarely seen outside top-tier products.

## Priority Issues

**P0: No undo for forward status transitions** — Status changes from New→Diagnosing and Diagnosing→In Progress fire immediately via `updateStatusMutation.mutate()` without confirmation or undo path. A misclick on "Start" or "Diagnose" wastes mechanic time with no recovery. Ideally: toast with "Undo" button within 3 seconds, or optimistic rollback. File: `bay-view-v2-client.tsx` handleStatusClick, lines 168-196.

**P1: Icon-only bay card footer buttons with no visible labels** — The footer has 5+ icon buttons (pause, add note, add service, add part, remove, more) that only label via tooltips on hover. First-time users cannot scan available actions. Tablet users (mechanics with greasy hands) can't hover. Fix: add visible text labels alongside icons, or at minimum a "show labels" preference toggle. File: `_bay-card-footer.tsx:55-130`.

**P1: No onboarding or help system** — Zero discoverability for new shop managers. No walkthrough, no "?" help icon, no contextual guidance, no documentation link. The empty bay card says "Click to add vehicle" but there's no broader orientation. A shop manager switching from spreadsheets has no guide. Fix: first-run tooltip walkthrough highlighting toolbar, bay cards, and drawer; persistent help button with docs link. File: missing entirely.

**P2: Urgency accent colors bypass the STATUSES constants** — `_bay-card-accent.tsx:22-25` hardcodes `bg-rose-500` and `bg-amber-500` for urgency pulse states instead of deriving from the STATUSES hue/weight system. If status colors are adjusted, urgency indicators won't follow. Fix: compute from the relevant STATUSES entry. File: `_bay-card-accent.tsx`.

**P3: Only one keyboard shortcut (Cmd+K for queue search)** — Power users get no bay-to-bay arrow navigation, no shortcut to open selected work order, no keyboard status transitions. The keyboard sensor exists for drag-and-drop but not for navigation. Fix: add J/K for bay navigation, Enter to open detail, S/D/I command keys for status transitions. File: `queue-panel.tsx:196-202`, `bay-view-v2-client.tsx`.

## Persona Red Flags

**Alex (Power User):** No keyboard navigation between bays; no batch-select/multi-bay operations beyond batch complete; hover-to-reveal quick-assign actions on queue items add friction for rapid workflows; no saved view preference (always starts in grid).

**Jordan (First-Timer):** Zero onboarding or first-use guidance; icon-only footer buttons require hover-to-discover — can't scan available actions; "My Jobs Only" toggle lacks context for what it filters; empty bay drawer's three options may cause decision paralysis without a recommended path highlighted.

**Casey (Distracted Tablet User):** Status filter pills at `h-6` (24px) fall well below 44px touch target — easy to mis-tap; toolbar packs 4+ control groups into a single row that overflows on tablet; kanban horizontal scroll requires pinch/pan awareness not obvious without scrollbar hints; state preserved on drawer close (woId in URL is clever), but no indication when returning that a drawer was previously open.

## Minor Observations

- KPI card "Rev / Labor Hr" label is hardcoded English, not translated via `t()` — breaks i18n. `_kpi-cards.tsx:254`.
- `DrawerHeader` vehicle icon uses `bg-gradient-to-br from-primary/20 to-primary/5` — a decorative gradient. DESIGN.md calls for monochrome-neutral palette with no decorative color. `_drawer-header.tsx:85`.
- Queue has Cmd+K focus shortcut but the toolbar search (separate input) has no shortcut — two search fields, one keyboard access, confusing for power users.
- Empty bay skeleton uses dot-grid `bg-[linear-gradient(...)]` pattern — consistent with real cards but the pattern itself reads as AI-templated.
- `showBack` prop on DrawerHeader hides status pill + fullscreen/close buttons for a single back arrow — status visibility is lost in the nested Ready/Complete flow.

## Questions to Consider

- Would a "My Bay" focused view (one mechanic, their assigned jobs only, prominent timer, single-status-at-a-time transitions) serve mechanic users better than the full multi-bay grid optimized for the shop manager?
- Should the 4px left accent stripe on bay cards be reconsidered against DESIGN.md's "cards use ring-1 borders not shadows" constraint — the stripe is a decorative border with color semantics that contradicts the flat, ring-based card language?
- The toolbar packs search, branch pills, view selector, status filter, my-jobs toggle, refresh, vehicle reg, shift report, bay counter, and batch complete into one or two rows. On a 10" tablet (VISION.md requirement), does this collapse appropriately or overflow?
