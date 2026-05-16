# Wiki Log

## 2026-05-15 — Bay View production hardening

- Fixed empty catch blocks and race conditions in bay-view components
- Fixed stale-cache-after-mutation bug by switching to uncached `getBayViewDataFresh()`
- Added `QueueAssignmentDialog` for click-to-assign with bay + mechanic selection
- Added mechanic name display to waiting queue items
- Added i18n keys for services/parts/timeline sections in work-order-detail-drawer
- Fixed work-order mutation cache invalidation (list cache was never invalidated)
- Added keyboard shortcuts to assignment dialog (1-9 for bay selection)
- Various UI polish: removed-from-bay button, modal sizing, layout refinements
