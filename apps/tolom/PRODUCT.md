# Product

## Register

product

## Users

Auto repair shop owners and managers (primary) run the business through TOLOM — opening work orders, tracking inventory, managing staff, closing the day. Mechanics use it on tablets on the shop floor for clock-in, work queue, and task completion. Customers interact through a self-service portal for booking and invoice viewing.

Context: Mongolian auto service market, expanding regionally. Most shops currently run on spreadsheets, paper tickets, and WeChat/WhatsApp. TOLOM replaces all of it.

## Product Purpose

A vertical operating system for auto repair businesses. Replace disconnected spreadsheets, paper tickets, and generic CRM tools with a single system of record for work orders, inventory, staff, payments, and customer relationships. Every workflow — intake to invoice to daily close — runs through TOLOM.

Success means a shop owner opens TOLOM in the morning and sees exactly what happened yesterday, what's happening today, and what needs attention — no spreadsheets, no phone calls, no guesswork.

## Brand Personality

**Modern, approachable.** Feels like a premium tool but not intimidating. Welcoming for non-technical shop staff. The interface should inspire confidence ("this is a real system") without feeling corporate or cold.

Zuiio parent brand voice: precise, fluid, confident. TOLOM layers warmth and accessibility on top — the same precision, but in work clothes.

## Anti-references

- **Not a generic CRM.** Don't serve dentists, lawyers, or salons. Every decision optimizes for auto repair.
- **Not enterprise bloat.** No SAP/Oracle-style dense tables, nested dropdowns, or overwhelming data density. Stay clean and scannable.
- **Not toy-like.** No playful, cartoonish, or gamified interfaces. This is real business software for real shops. Functional, direct, gets the job done.

## Design Principles

1. **Disappear into the task.** The interface should be invisible when it works. Mechanics on a tablet with greasy hands shouldn't read — they should recognize. Owners shouldn't hunt for yesterday's numbers.

2. **Consistency earns trust.** Same button shape, same form vocabulary, same status colors across 23 modules. Every screen feels like the same tool. Linear-grade polish: no subtly-off component that makes you pause.

3. **Tablet-native thinking.** Every surface works on a 10" tablet. Touch targets ≥44px. No hover-dependent interactions. The shop floor is a tablet and a wrench, not a laptop.

4. **Zero-friction daily use.** Create a work order, assign a mechanic, track parts, close the day — without training. Optimistic UI so the interface never blocks the user.

5. **Single source of truth.** Postgres is canonical. React Query caches it. Zustand holds UI-only state. Every mutation is ledger-based. Every number reconciles.

## Accessibility & Inclusion

WCAG 2.1 AA compliance. Color contrast ≥4.5:1 for body text, ≥3:1 for large text. All interactive elements keyboard-navigable. Screen reader support for core workflows. Reduced motion respected via `prefers-reduced-motion`. Mongolian + English language parity — every UI string in both locales, no orphan keys.
