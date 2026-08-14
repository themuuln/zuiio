# Product

## Register

product

## Users

Two audiences share this single sign-on:

1. **Business users** — Mongolian business owners and employees who use Zer (SMB ERP) and Tolom (auto repair management) daily. They authenticate multiple times a day across products. Speed and reliability matter more than delight. They expect the login to be fast and invisible.

2. **End customers** — People who interact with Zer-based or Tolom-based services (clients, repair shop customers). They authenticate infrequently, often from shared or mobile devices. They need the simplest possible path to "I'm in." Trust signals matter here — they're entering credentials into a system they may not know well.

## Product Purpose

Zuiio ID is the centralized identity layer for the entire Zuiio ecosystem. One account, one login, every product. It exists so that:

- Users never create separate accounts for Zer, Tolom, or future products
- Authentication security is handled once, properly, instead of duplicated across apps
- Adding a new product to the ecosystem requires zero auth work
- The SSO page is the front door — it must feel like an arrival, not a form

Success: a user clicks a link from Zer or Tolom, lands on Zuiio ID, authenticates in under 5 seconds, and never thinks about the system that made it possible.

## Brand Personality

**Restrained, professional, secure.**

The voice is calm and direct. No enthusiasm, no decoration, no personality that competes with the task. The SSO page should feel like a bank vault door —坚固, reliable, invisible. When in doubt, say less.

Three words: **Quiet competence.**

## Anti-references

- **No AI-generated aesthetic**: cream/sand/beige backgrounds, rounded-everything cards, gradient text, glassmorphism, decorative grids
- **No SaaS marketing feel**: hero metrics, numbered section markers, tiny uppercase eyebrows above every section
- **No playful/authentic tone**: no emojis, no casual copy, no "Hey there!" greetings
- **No visual noise**: no floating badges, no side-stripe borders, no decorative illustrations
- **No template familiarity**: this should not look like a shadcn/ui starter or a Next.js boilerplate auth page

## Design Principles

1. **Trust through simplicity.** Every visual choice should reduce anxiety, not add decoration. The user is entering credentials — make them feel safe, not delighted.

2. **Invisible security.** Security mechanisms (nonce verification, JWKS, rate limiting) should be invisible to the user. If they notice the security, it's too visible.

3. **Mongolian-first.** Every user-facing string is in Mongolian. Technical terms (email, password) are transliterated naturally, not forced into English.

4. **One door, many rooms.** The SSO page is the single entry point. It must feel like it belongs to Zuiio, not to any individual product. Branding is present but restrained — a wordmark, not a billboard.

5. **Speed is a feature.** The page loads fast, the form submits fast, the redirect happens fast. Every millisecond of delay erodes trust.

## Accessibility & Inclusion

- **WCAG AA** minimum for all text contrast (4.5:1 body, 3:1 large)
- **Keyboard navigation** — all interactive elements reachable via Tab, focus indicators visible
- **Reduced motion** — animations respect `prefers-reduced-motion: reduce`
- **Screen reader support** — ARIA labels on all interactive elements, proper heading hierarchy
- **Mobile-first** — touch targets ≥44px, readable at 375px viewport width
- **Mongolian Cyrillic** — all copy renders correctly in Cyrillic, including edge cases (long words, mixed scripts)
