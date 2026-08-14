> Ported from the archived standalone repo (`~/archive/tolom-standalone`) on 2026-08-06.
> Status: ALL plan items are now implemented in `apps/tolom`.
> - Ported: product-preview hero, localized trust badges, nav active states + hover prefetch + `/#features`, footer grid/mailto Contact, status lucide-icon chips + `Messaging` key, FAQ search + localized CTA, pricing ROI/period/trial localization + enterprise mailto, comparison `value*` localization, services/integrations/blog/status/faq shared `LandingFooter` + `ctaPricing` + localized table headers.
> - Also fixed: EN services sample data was Mongolian (28 values), home pricing preview stale names/prices (Starter→Core, Pro→Complete, Business ₮1.59M→₮1.79M, annual = 10× monthly to match /pricing), FAQ no-results shown whenever a query was active (now only when everything is filtered), stale `hardcoded-baseline.json` (referenced old pre-monorepo paths), removed dead `serviceSms` keys.

# Public Pages UI/UX Improvement

## Context

Improve the UI & UX of TOLOM's public marketing pages (`/`, `/pricing`, `/services`, `/integrations`, `/faq`, `/status`, `/about`, `/blog`): shared navigation/footer consistency, localized copy (remove hardcoded Mongolian), clearer pricing and status presentation, and an FAQ search interaction — without changing marketing content or adding dependencies.

## Files to Change

| File | Action | What changes |
|------|--------|--------------|
| `src/app/[locale]/_landing-footer.tsx` | Modify | Shared footer: brand column, Product/Company/Support link columns, hover states, LocaleSwitcher, localized copyright |
| `src/components/landing-nav.tsx` | Modify | Sticky blurred header, feature/resources dropdown menus, mobile drawer with all page links + auth CTAs |
| `src/app/[locale]/faq/page.tsx` | Modify | Client-side search filter over categorized Q&A, localized empty/no-results states, localized CTA (ctaTitle/ctaSubtitle/ctaButton/ctaLogin), shared LandingFooter |
| `src/app/[locale]/pricing/page.tsx` | Modify | PLAN_DATA keyed by translation keys, localized ROI amounts/details, perYear/perMonth suffixes from messages, enterprise CTA → mailto, localized pricing-link label, shared LandingFooter |
| `src/app/[locale]/services/page.tsx` | Modify | Localized sample-table headers (service/category/price/interval), localized pricing link, shared LandingFooter |
| `src/app/[locale]/integrations/page.tsx` | Modify | Localized pricing link, shared LandingFooter |
| `src/app/[locale]/status/page.tsx` | Modify | lucide icons in tinted rounded chips (replacing emojis), fixed service key mismatch (Sms→Messaging), localized CTA (ctaTitle/ctaButton), shared LandingFooter |
| `src/messages/en.json` | Modify | Add pricing.roi*, faq.searchPlaceholder/noResults/cta*, status.cta*, services.service/interval |
| `src/messages/mn.json` | Modify | Same keys, Mongolian values |

## Implementation Order

1. Shared shell (nav/footer) — established the pattern.
2. Pages converted to shared `LandingFooter` + localized labels.
3. Pricing data refactor + ROI/period localization.
4. Status icon/card restructure.
5. FAQ search + missing-key repairs.
6. Locale key additions in both files, then parity checks.

## Edge Cases

- FAQ search: empty query returns all categories; a query that filters everything renders the no-results message; matching is case-insensitive over translated Q/A text.
- Pricing annual toggle: Enterprise always renders `customPrice` without a per-month note; per-month note renders only when `annualPerMonth` is present (Business/Pro/Starter).
- Status: subscribe form swaps to a confirmation state on submit; all eight service rows resolve `service<Key>`/`service<Key>Desc` to existing messages.
- Nav/footer: mobile drawer closes on link activation; footer mailto links for Contact.

## Verification

1. `node scripts/i18n/check-messages.mjs` — exit 0; en/mn parity 3993/3993 leaf keys; no duplicates; no new warnings in touched namespaces.
2. Static scan of changed files: no hardcoded Cyrillic literals; no unused lucide imports; every referenced translation key exists in both locales (including dynamic `cat*`, `service*`, `feature*`, `${plan.key}Name/Desc` keys).
3. `git diff --check` — clean.
4. Independent reviewer (fresh context) — verdict on the diff: see reviewer output.
5. Blocked (pre-existing, unrelated): `pnpm validate:types` / `validate:lint` / `next build` cannot run in this checkout — no `node_modules`, no lockfile, and `pnpm install` fails on workspace-package resolution (`@zuiio/hooks@workspace:*` inside registry `@zuiio/offline@0.1.0`). The zuiio workspace lives at `~/.workspace/zuiio`; typecheck must be run from that workspace with tolom linked as an app.
