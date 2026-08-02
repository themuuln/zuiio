# Tamga Design System

## Stack
- framework: Flutter
- styling: Material 3 with Tamga theme extensions
- components: Tamga-owned widgets and Flutter Material controls
- animation: short state transitions using TamgaMotion
- icons: Material Symbols / Material Icons

## Direction
Tamga should feel calm, trustworthy, and rooted in Mongolian horse culture. Prefer generous vertical rhythm, warm earth tones, quiet surfaces, and clear single-action onboarding screens.

## Tokens
Use `TamgaColors`, `TamgaSpacing`, `TamgaTypography`, and `TamgaMotion` from `lib/src/core/theme/design_tokens.dart`. Do not add raw widget-level colors or spacing values when a token exists.

## Decisions
- 2026-07-31 — UI polish begins with the province-selection onboarding screen. Keep the existing step-dot shell and improve search, list hierarchy, selection feedback, and empty state without changing the flow contract.
- 2026-08-02 — Priority redesign focuses on three high-value jobs: discover a trustworthy horse in the marketplace, find or report a lost horse, and traverse a lineage tree. Keep the existing warm earth palette and use orange only for primary actions, selected state, prices, and urgent recovery actions.
- 2026-08-02 — Navigation makes lost-horse recovery a first-class destination while keeping daily care, horse registry, lineage, and marketplace available in the global shell. Use grouped lists and progressive disclosure instead of dense icon clusters.

## Information architecture
- **Marketplace:** search → intent filters → trusted lead listing → scan-friendly results → listing detail.
- **Lost horse:** active reports → map evidence → report flow → sighting/recovery action.
- **Lineage:** selected horse → tree/list/timeline view → depth control → node detail.

## Interaction and accessibility
- Mongolian-first copy; English appears only as a supporting clarification where the flow benefits from it.
- Every icon-only action has a tooltip and a 44dp touch target.
- Loading, empty, offline/error, and success states preserve the surrounding page structure.
- Motion is limited to selection feedback, progressive disclosure, and state transitions under 300ms; reduced motion remains usable.

## Components
- Region selection page: search field, grouped province list, selected state, empty state, sticky bottom actions.
- Marketplace command header, trusted listing rows, empty-state primary CTA, and progressive action menu.
- Lost-horse finder tabs, urgency summary, report CTA, and evidence-first report cards.
- Lineage root selector, view tabs, depth selector, tree viewport, and selected-node detail.

## Non-Goals
- No new dependencies.
- No changes to marketplace, lost-horse, or lineage domain semantics.
- No changes to onboarding persistence or region data semantics.
