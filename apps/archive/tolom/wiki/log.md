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
## 2026-05-26 — Built all public pages

- Created public pages: FAQ, About, Status, Integrations, Blog, Services
- All pages now use shared `<LandingNav />` for consistent navigation
- Updated `src/lib/supabase/middleware.ts` to whitelist all public routes
- Updated nav/footer links to point to real pages (guide, faq, blog, about, status, integrations)
- Fixed middleware auth protection — new public pages were blocked before whitelist
- Pages created per docs analysis: FAQ (28 Q&As), About (story, mission, vision, values), Status (8 services, uptime), Integrations (8 items: live/ready/planned), Blog (6 articles, category filter), Services (catalog features, sample table, intervals)
