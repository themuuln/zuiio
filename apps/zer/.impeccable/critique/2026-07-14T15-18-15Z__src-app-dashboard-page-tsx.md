---
target: dashboard page
total_score: 27
p0_count: 0
p1_count: 2
p2_count: 3
p3_count: 1
timestamp: 2026-07-14T15-18-15Z
slug: src-app-dashboard-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | KPIs return ₮0 with no signal distinguishing "no activity" from "data failed to load" |
| 2 | Match Between System and Real World | 3 | Mongolian text is correct; minor loanword "Статус" where "Төлөв" would be purer |
| 3 | User Control and Freedom | 2 | Hero cards are one-way links; no undo, no dashboard customization, no date range on KPIs |
| 4 | Consistency and Standards | 3 | PulseCards vs ShortcutCards use different color languages; ★ icon for Suppliers breaks metaphor |
| 5 | Error Prevention | 3 | LowStockToast is excellent; no data freshness indicator, no nav-away confirmation |
| 6 | Recognition Rather Than Recall | 3 | Icons + labels on shortcuts — good; but two different "sales" paths (create vs list) are confusing |
| 7 | Flexibility and Efficiency of Use | 2 | No keyboard shortcuts, no command palette, no customizable shortcuts, KPIs locked to "today" |
| 8 | Aesthetic and Minimalist Design | 3 | Clean layout; empty-state wastes ~40% vertical space on nothing-happened-today |
| 9 | Error Recovery | 3 | Empty-state messages exist; chart empty state only appears after client hydration |
| 10 | Help and Documentation | 2 | Onboarding covers only 3 items for a 30+ nav ERP; no tooltips or contextual help on KPIs |
| **Total** | | **27/40** | **Needs Work** |

## Anti-Patterns Verdict

**Does this look AI-generated?**

**LLM assessment:** Not immediately AI-generated, but reveals its seams. The restrained teal-on-dark palette, purposeful icon color-coding, and Mongolian-first copy avoid the worst clichés. However, the layout follows a predictable "hero cards → KPI row → shortcut grid → table → chart" template that reads as a standard dashboard scaffold. The PulseCard color blocks (emerald/red/blue/amber tinted backgrounds) are the most recognizable "AI dashboard" pattern. Overall: 6/10 originality — passes casual inspection but won't survive a design-literate eye.

**Deterministic scan:** CLI scan found 0 issues across `src/app` and `src/components`. Browser overlay detected 2 findings:
- `hero-eyebrow-chip`: tracked-caps "Zer" above the marketing h1 on the landing page — **likely false positive** (intentional marketing pattern, not dashboard slop)
- `layout-transition`: transition on `<body>` element — minor, non-decorative

No visual overlay issues on the dashboard surface itself.

## Overall Impression

The dashboard is a competent, dense ERP landing that does the basics right — Mongolian-first, restrained color, appropriate information density for daily use. The color-coded KPI cards are the strongest design decision: they provide instant emotional signal without reading text. The low-stock proactive toast is an excellent touch that matches the "calm but alert" personality.

But the dashboard plays it safe. It follows the standard dashboard template without enough differentiation to feel like it was designed *for this specific user*. The empty state is the clearest example: a new shop owner logging in for the first time sees ₮0 everywhere and a blank chart. That's not calm — that's deflating. The single biggest opportunity is making the dashboard *responsive to what's happening* — showing different content when it's busy vs. quiet, when it's a new user vs. a power user.

## What's Working

1. **Color-coded KPI cards** — Green/red/blue/amber tinted backgrounds on sales/expenses/profit/pending provide instant emotional signal. A manager can glance at the dashboard and feel the day's health before reading a number. This is the strongest design decision on the page.

2. **Proactive low-stock toast** — Turning a passive dashboard into an active monitoring system is exactly the "calm but alert" personality from PRODUCT.md. Most dashboards wait for the user to notice problems; this one speaks up.

3. **Consistent card vocabulary** — All dashboard cards use the same `rounded-xl border shadow-xs` pattern with consistent padding. The visual rhythm is predictable and scannable, which matters for a surface seen 6-8 hours daily.

## Priority Issues

### [P1] PulseCard labels truncate on tablet — "Өнөөдрийн борлуулт..." hides the most important word
- **Why it matters:** The label is the only way to distinguish what the number means. A truncated label on a KPI card defeats its purpose. Users scanning quickly see colored boxes with ₮0 but don't know which metric is which.
- **Fix:** Use shorter labels ("Борлуулалт", "Зарлага", "Ашиг", "Хүлээгдэл") or switch to a stacked layout (icon + value on top, label below) that accommodates longer Mongolian text.
- **Suggested command:** `$impeccable layout`

### [P1] Empty KPI state provides no signal — all ₮0 looks like a broken system
- **Why it matters:** A new user logging in for the first time sees ₮0 everywhere. There's no "No transactions today — start by creating a sale" message. The emotional impact is "this system has no data" not "today is quiet."
- **Fix:** When all KPIs are zero, show a contextual empty state: an inline message suggesting the user's first action, linked to the relevant hero card.
- **Suggested command:** `$impeccable onboard`

### [P2] Monthly trend chart is a visual dead zone in empty state
- **Why it matters:** The chart occupies ~300px of vertical space. When there's no sales data, it renders a dark area with a faint loading skeleton that resolves to a text-only empty message. This wastes prime scroll real estate.
- **Fix:** Collapse the chart section entirely when there's no data, or replace it with a compact empty-state CTA ("Record your first sale to see the 30-day trend").
- **Suggested command:** `$impeccable distill`

### [P2] Two different "sales" entry points with no visual distinction
- **Why it matters:** HeroActionCard links to `/sales?create=true` (new sale) while ShortcutCard links to `/sales` (sales list). Both use shopping-cart-adjacent iconography. A user looking for "sales" must decide which to click with no guidance on the difference.
- **Fix:** Use distinct icons (e.g., cart+plus for create vs. list icon for view), or consolidate into one entry point with a create button inside the list view.
- **Suggested command:** `$impeccable clarify`

### [P2] Onboarding checklist uses inconsistent visual language
- **Why it matters:** The sidebar checklist renders as a light-bordered card that visually disconnects from the dark dashboard surface. The progress bar uses primary color (teal) which clashes with the muted palette of the main content.
- **Fix:** Either use the same card treatment that the dashboard uses consistently, or make the sidebar visually distinct as a separate "guide" surface with its own tone.
- **Suggested command:** `$impeccable polish`

### [P3] Star icon for Suppliers breaks metaphor
- **Why it matters:** Star universally means "favorite" or "featured" in UI. Using it for suppliers forces users to re-learn the icon language.
- **Fix:** Use a supplier-appropriate icon: Truck, Factory, or BuildingOffice from Phosphor.
- **Suggested command:** `$impeccable clarify`

## Persona Red Flags

**Alex (Power User — daily 6-8hr user):**
- No keyboard shortcuts from dashboard — must mouse-click every hero card and shortcut
- Cannot customize dashboard layout — forced into template arrangement regardless of workflow
- KPIs limited to "today only" — no way to see yesterday, this week, or this month without navigating to reports
- Recent sales table shows only 5 rows with no pagination or "view all" link
- Quick shortcuts are static — not personalized to Alex's actual usage patterns

**Jordan (First-Timer — new employee):**
- Onboarding checklist has only 3 items for a system with 30+ navigation items — feels like being dropped into the deep end
- No tooltips or help icons explaining what each KPI card means or why a number matters
- Two different "sales" paths (create vs. list) with no guidance on which to use when
- Dark mode with muted text may be harder to read for someone still learning the interface

**Sam (Manager — checks dashboards, reviews reports):**
- All KPIs showing ₮0 provides zero confidence in data accuracy — is the system working?
- No date range selector on any dashboard metric — cannot compare today vs. yesterday
- Monthly trend chart shows nothing — the manager's primary analytical tool is empty
- No summary statistics or trends (e.g., "Sales are up 12% from last week")

## Minor Observations

- PulseCard uses hardcoded color classes (bg-emerald-50, bg-red-50) that bypass the oklch token system defined in globals.css — may break in custom themes
- The RecentSales table uses raw HTML `<table>` with manual border styling instead of shadcn Table component — inconsistent component usage
- The "Бүтээгдэхүүн нэмэх" (Add Product) hero card links to /products (the list), not /products/new (the create form) — inconsistent with the other two hero cards
- The sidebar shows "Temuulen" as a nav item, which appears to be the user's name appearing in the navigation instead of a proper user menu area

## Questions to Consider

- If a Mongolian shop owner opens this dashboard every morning at 8am, what is the ONE thing they need to see first — and does this dashboard prioritize it?
- The "calm, practical, reliable" personality is achieved through restraint. But is "calm" the same as "quiet"? Could the dashboard be calm AND more emotionally engaging when showing good news (a profitable day)?
- The onboarding checklist disappears entirely once completed. What replaces it? Does the dashboard feel emptier after the user graduates from onboarding?
- The monthly trend chart is the most expensive component (Recharts, dynamic import, 30-day query) but delivers the least value in empty state. Is a chart the right default, or would a sparkline/trend arrow be more efficient?
