# Tamga UX Audit — 2026-08-01

## Scope

Reviewed the Flutter app shell, router, current runtime semantics on iPhone 17 (402×874), primary horse/lineage screens, product source-of-truth documents, and existing feature inventory.

## Score: 4.7 / 10

| Category | Score | Evidence |
|---|---:|---|
| Information hierarchy | 3/10 | `/lineage` is the initial route, so daily care and horse status are not visible at launch. |
| Navigation | 3/10 | Bottom tabs expose Угшил, Зах зээл, Арга хэмжээ, Эрэл, Профайл; Морьд and Арчилгаа are absent. |
| Action placement | 4/10 | Quick actions, a five-item FAB menu, guest prompt, sync banner, and bottom navigation compete for the same viewport. |
| Interaction consistency | 4/10 | Quick action labels do not consistently lead to the matching operation (`Морь нэмэх` routes to `/profile`; `Уралдаан нэмэх` routes to `/events`). |
| Scanability | 5/10 | Lineage is rich for breeders but not a daily command center; current content asks users to interpret a tree before acting. |
| Offline confidence | 5/10 | Offline/sync status exists, but it is an overlay stack rather than one stable, low-noise status surface. |
| Accessibility and resilience | 5/10 | Labels are Mongolian-first and touch targets are generally available; shell overlays can occlude content and the feature tour copy is stale relative to the product IA. |

## Highest-impact gaps

1. **Make daily triage the home screen.** Show horse count/health state, overdue or upcoming care, breeding deadlines, and the next event before secondary content.
2. **Promote the horse registry and care calendar.** These are the repeated jobs: find a horse, scan status, record health, and respond to reminders. They need permanent tabs, not hidden routes.
3. **Remove competing global action layers.** Replace the persistent quick-action banner + global FAB with one contextual primary action per surface: add horse in Морьд, log care in Арчилгаа, list horse in Зах.
4. **Demote seasonal/system features.** Keep events, lost-horse workflows, documents, certificates, teams, notifications, search, and profile accessible from the relevant context or a profile sheet; do not spend permanent tabs on them.
5. **Preserve trust signals without blocking content.** Keep sync/offline visible as a compact status row, never as a stack that pushes or covers the primary content.

## Proposed shell

`Нүүр` → daily command center; `Морьд` → registry; `Арчилгаа` → care calendar and logs; `Угшил` → lineage/breeding; `Зах` → marketplace and ownership.

No product analytics events currently provide observed feature-frequency data. The priority order above is grounded in `docs/product/index.md` and `docs/design/shell.md`; usage instrumentation should validate it after release.

## Implemented rewrite

- `/home` is now the completed-user entry route and daily command center.
- Permanent tabs are now `Нүүр`, `Морьд`, `Арчилгаа`, `Угшил`, and `Зах`.
- Home prioritizes today's attention state, horse status, care tasks, upcoming events, and the lost-animal report action.
- Care aggregates existing health, breeding, and event records without inventing work for records that have no usable date.
- Events, lost-animal workflows, and profile tools remain reachable as contextual routes rather than permanent tabs.

## Runtime evidence

On iPhone 17 at 402×874, the fresh debug build rendered the new home screen, switched successfully through the five tabs, opened the care empty state and horse registry, and reached the lost-animal report wizard from the home action. Lineage displayed its existing local-data error state with a retry action; this is a backend/data condition, not a shell navigation failure.
