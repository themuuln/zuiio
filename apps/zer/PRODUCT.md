# Zer — Product Context

## Register

**product** — app UI, admin, dashboard, data tables, forms. Design serves daily operational tasks. No marketing register.

## Users & Purpose

**Who:** Mongolian small business teams — shop owners, managers, cashiers, accountants. Teams of 1–20 people running retail, wholesale, or service businesses.

**Context:** At a desk or shop counter, desktop-primary (tablet/phone secondary). Using Zer 6–8 hours daily for sales, inventory, accounting, and reporting. Tasks are repetitive and time-sensitive; speed and reliability matter more than novelty.

**Job to be done:** Run the business operations side — record sales, manage stock, track expenses, handle purchases and returns, issue invoices and quotations, view reports, run payroll. Every screen is a task screen; there are no passive browsing surfaces.

**Language:** Mongolian (mn_MN) throughout. All UI text, error messages, form labels, and toasts are in Mongolian. English appears only in technical identifiers (SKU, barcode, status codes).

## Product Purpose

Zer is a Mongolia-first mini ERP for small businesses. It replaces spreadsheet chaos and disconnected tools with a single system that handles the full operational loop: sell → track inventory → manage money → see the numbers. It exists because existing ERPs are either too complex (SAP, 1C) or too generic (QuickBooks, Odoo) for Mongolian business context — multi-currency, Mongolian phone/plate validation, local payroll tax rules, and a UI that speaks the language of the user, not the vendor.

Success looks like: a shop owner opens Zer every morning, records the day's sales before lunch, checks stock levels after, and trusts the numbers at month-end. The tool disappears into the routine.

## Brand Personality

**Calm · Practical · Reliable**

- **Calm:** Quiet surfaces, restrained color, no visual noise. The interface should feel like a well-organized desk, not a dashboard trying to impress.
- **Practical:** Dense information when needed, fast interactions, zero decoration that doesn't serve a task. Every pixel earns its place.
- **Reliable:** Consistent patterns across all screens. Same button shape, same form vocabulary, same table structure. Users build muscle memory; we never break it.

**Voice:** Concise, direct, human, confident. Error messages explain what went wrong and what to do. Labels say exactly what they mean. No jargon, no pleasantries, no hedging.

## Anti-References

What Zer should explicitly NOT look like:

1. **Generic SaaS (Notion/Figma/Cream-colored dashboards):** No cream/sand/beige body backgrounds. No gradient text. No glassmorphism. No emoji in headings. No oversized hero metrics with gradient accents. No "eyebrow kicker" small-caps labels above every section. The warm-neutral monoculture is banned.

2. **Legacy ERP (SAP/QuickBooks/1C-era interfaces):** No gray-on-gray surfaces with no hierarchy. No tiny text crammed into dense grids with no breathing room. No dated controls, no skeuomorphic elements, no "Windows 95 in a browser" energy. No visual flatness masquerading as "professional."

3. **The middle ground to avoid:** Not flashy, not dull. Not "AI-made this" (gradient text, card grids, decorative patterns), not "enterprise software from 2008" (no visual hierarchy, uniform gray). The target is earned familiarity — a tool a power user would trust on first sit-down.

## Design Principles

1. **Task-first, every screen.** Every page exists to accomplish a specific operational task. Remove anything that doesn't directly serve the work. If it doesn't help sell, track, count, or report, it doesn't belong.

2. **Consistent vocabulary, zero reinvention.** Same button shapes, same form controls, same table patterns, same drawer behavior, across every module. Users who learn one screen know them all. Never invent a new affordance for a standard task.

3. **Density with breathing room.** ERP users need information density — tables with many rows, forms with many fields, dashboards with multiple metrics. But density ≠ clutter. Use section cards, tonal separation, and consistent spacing to keep dense screens scannable.

4. **Reliable, not flashy.** Motion conveys state change (drawer open, item saved, error appeared), never decoration. No orchestrated page-load sequences. No bounce, no elastic, no spring. A 200ms ease-out is the standard; 450ms for drawer transitions.

5. **Mongolian-first, always.** All user-facing text is Mongolian. Error messages explain and suggest. Form labels are unambiguous. Date/currency formatting follows Mongolian conventions. The interface should feel like it was built in Ulaanbaatar, not translated from English.

## Accessibility & Inclusion

- **WCAG AA** as the baseline — contrast ratios, keyboard navigation, ARIA labels on all interactive elements.
- **Reduced motion focus:** Every animation respects `prefers-reduced-motion: reduce`. Reduced-motion users get instant state changes or crossfades, never decorative motion they can't control.
- **Touch targets:** Minimum 44px on mobile for all interactive elements. Form inputs, buttons, and combobox triggers all meet this floor.
- **Color independence:** Status indicators (paid/pending/error) never rely on color alone — always paired with text labels or icons.
- **Screen readers:** Semantic HTML, proper heading hierarchy, form labels, table captions. Live regions for dynamic content (toast notifications, real-time stock updates).

## Context for Design Work

When building or modifying Zer UI, the guiding question is: **"Would a Mongolian shop owner trust this tool with their business numbers?"** The answer should be an immediate yes — not because it's impressive, but because it looks like it knows what it's doing.
