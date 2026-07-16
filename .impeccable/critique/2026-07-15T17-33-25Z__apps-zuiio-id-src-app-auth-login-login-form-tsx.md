---
target: /login page
total_score: 27
p0_count: 2
p1_count: 2
timestamp: 2026-07-15T17-33-25Z
slug: apps-zuiio-id-src-app-auth-login-login-form-tsx
---
# Critique: /login — Zuiio ID Login Page

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Submit button swaps text but has no animation, skeleton, or visual transition. User can't tell if anything happened during the 200ms after click. |
| 2 | Match System / Real World | 3 | Mongolian copy is correct and natural. "ЭСВЭЛ" divider follows standard login pattern. No issues with mental model. |
| 3 | User Control and Freedom | 3 | Google/Apple cancel handled (popup close). No back/escape path from the login view, but there's nothing to escape from. Adequate. |
| 4 | Consistency and Standards | 3 | Follows standard login layout. OAuth above form, divider, email+password, submit, signup link. The "last used" badge breaks consistency — no other element uses absolute-positioned badges. |
| 5 | Error Prevention | 3 | `required` attributes, field-level validation errors, clear labels. Password field lacks visibility toggle — user can't verify what they typed. |
| 6 | Recognition Rather Than Recall | 3 | Labeled fields, autocomplete attributes, placeholder text. The "Нууц үг мартсан?" link is discoverable. No cognitive gaps. |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts. No "press Enter" hint. Tab order works but there's no way to快速 navigate. The hidden GSI button click is fragile — could silently fail. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, minimal. But the page lacks any branding (no logo), making it feel generic. The "Сүүлд хэрэглэсэн" badge adds visual noise. |
| 9 | Error Recovery | 3 | Inline field errors, form-level error banner, retryable. Good. No error prevention guidance (password requirements, format hints). |
| 10 | Help and Documentation | 2 | No password requirements shown. No indication of what formats are accepted for the identifier field. A first-time user guesses. |
| **Total** | | **27/40** | **Average — functional but undercrafted** |

## Anti-Patterns Verdict

**Does this look AI-generated?**

Partially. The overall structure is a clean shadcn/ui login template — the Geist font, Tailwind classes, cyan primary, centered card on off-white background. Someone familiar with the AI-assisted code generation aesthetic would recognize it. It doesn't hit any of the hard bans (no gradient text, no glassmorphism, no side-stripe borders, no decorative grids), but it doesn't have any distinctive identity either.

The cyan primary (oklch 0.70 0.16 195) is the only brand signal, and it's used for links and the submit button — functional, not expressive. The page has no logo, no wordmark, no visual anchor that says "this is Zuiio." For an SSO identity app, that's a missed trust signal.

**Deterministic scan**: 0 findings from the detector. Clean code, no slop patterns detected.

## Overall Impression

This is a competent, functional login form. It handles Google OAuth, Apple Sign In, email/password, error states, and field validation. The Mongolian copy is natural and complete. But it reads as a template, not a product. The biggest missed opportunity is that this is the **front door** of the entire Zuiio ecosystem — every user passes through this page to access Zer, Tolom, and any future product. It should feel like an arrival, not a form.

The contrast failures on accent links (2.23:1) are a genuine accessibility bug that must ship-block.

## What's Working

1. **Error handling is solid.** Inline field errors, form-level error banners, Google/Apple popup cancellation handled, loading states on buttons. The error UX is thoughtfully implemented.

2. **Mongolian localization is complete and natural.** Every label, placeholder, error message, and CTA is in Mongolian. The "Сүүлд хэрэглэсЕН" (Last Used) concept shows product thinking — surfacing the user's last auth method is a genuine convenience.

3. **OAuth architecture is correct.** ID token verification with JWKS for Apple, nonce-based Google flow, server-side validation. The security posture is production-grade.

## Priority Issues

### [P0] Accent links fail WCAG AA contrast (2.23:1)

**What**: The primary color (oklch 0.70 0.16 195, cyan/teal) used for "Нууц үг мартсан?" and "Бүртгүүлэх" links has only 2.23:1 contrast against the near-white background. WCAG AA requires 4.5:1 for normal text. This is a hard failure.

**Why it matters**: These are essential navigation links — password recovery and account creation. Users who can't read them can't recover their account or sign up. This is not optional polish; it's a legal and ethical baseline.

**Fix**: Darken the primary token for link text. Either:
- Use `text-foreground` for links (same as body text, proven contrast) with the cyan reserved for the submit button only.
- Or introduce a darker accent token (oklch L ≤ 0.50) specifically for interactive text on light backgrounds.

The cyan is fine for large blocks (the submit button at 8.50:1 passes easily), but it fails at text scale.

**Suggested command**: `$impeccable colorize` — fix the accent palette to ensure all interactive text meets AA.

---

### [P0] "Сүүлд хэрэглэсэн" badge fails contrast (2.23:1 at 10px)

**What**: The "Last Used" badge renders primary-colored text at 10px on the near-white background. At 2.23:1 it fails every WCAG threshold — even the 3:1 large-text minimum. At 10px, it doesn't qualify as large text.

**Why it matters**: The badge's entire purpose is to communicate which provider was last used. If users can't read it, it's pure visual noise — worse than having no badge at all.

**Fix**: Either:
- Remove the badge (it's non-essential information; the button order or a subtle dot indicator would suffice).
- Or restyle with foreground-on-muted background and increase font size to ≥12px.

**Suggested command**: `$impeccable polish` — fix badge contrast or replace with a subtler indicator.

---

### [P1] No logo or brand identity on the SSO front door

**What**: The login page shows only the text "Нэвтрэх" (Sign In) and "Zuiio бүтээгдэхүнд нэвтрэхийн тулд нэвтэрнэ үү" (Sign in to Zuiio products). No logo, no wordmark, no visual identity.

**Why it matters**: This is the single authentication gateway for every Zuiio product. It's the front door. A user arriving from a Zer deep link or Tolom share link sees a generic form with no confirmation they're in the right place. Trust is earned through identity, and the page has none.

**Fix**: Add the Zuiio logo/wordmark above the "Нэвтрэх" heading. Even a small wordmark (40–60px wide) centered above the title would transform the page from template to product.

**Suggested command**: `$impeccable shape` — design the auth shell with proper branding, or `$impeccable polish` if the logo asset already exists.

---

### [P1] Badge positioning floats awkwardly over the button

**What**: The "Сүүлд хэрэглэсэн" badge uses `absolute -top-2.5 right-0.5`, positioning it above the Google button's top-right corner. It partially overlaps the button border and extends into the card's padding zone.

**Why it matters**: It looks like a tooltip that stuck, not an intentional design element. The absolute positioning creates visual tension — the badge isn't anchored to anything.

**Fix**: If keeping the badge, position it as a leading indicator inside the button (left-aligned, before the icon), or below the button as a helper text. Alternatively, replace with a subtle visual cue: a small filled dot next to the provider name, or a slightly different border color on the last-used button (which the code already does via `isLastUsed` styling — the badge is redundant).

**Suggested command**: `$impeccable polish`

---

### [P2] Submit button has no loading transition

**What**: When the user clicks "Нэвтрэх", the text swaps to "Нэвтэрч байна…" with no animation, spinner, or visual state change beyond the text swap and `disabled` opacity.

**Why it matters**: On slow connections, the button goes from bright cyan to half-opacity with no motion cue. The user doesn't know if the click registered. Product UI needs to convey state changes through motion, not just text.

**Fix**: Add a subtle transition: a spinner icon alongside the loading text, or a brief scale pulse on click. The button already has `transition-colors` — extend it to include a loading spinner or a brief opacity fade.

**Suggested command**: `$impeccable animate`

---

### [P2] Google OAuth relies on clicking a hidden element

**What**: The Google Sign-In flow renders a full GSI button into a `sr-only` div, then programmatically queries for `div[role="button"]` or `iframe` inside it to simulate a click. If Google changes the DOM structure of their button (which they have done), this breaks silently.

**Why it matters**: A broken Google sign-in on the SSO page blocks the most common auth path. The fallback (`googleId.prompt()`) is triggered but doesn't always work reliably across browsers.

**Fix**: Instead of rendering and clicking a hidden GSI button, call `googleId.prompt()` directly in the click handler (which the code already does as a fallback). Remove the hidden button entirely. The prompt method is the supported API for programmatic sign-in.

**Suggested command**: `$impeccable harden`

---

## Minor Observations

- **"ЭСВЭЛ" divider**: Uppercase with `text-xs uppercase` is standard, but the muted-foreground on card background is borderline at 4.58:1. Fine for a decorative divider, but worth noting.
- **Muted text contrast**: `oklch(0.55 0.008 80)` on the background is 4.58:1 — barely passes AA body text (4.5 threshold). One or two steps darker would provide comfortable margin.
- **Password visibility toggle**: Missing. Users can't verify what they typed. Standard on modern login forms.
- **No "remember me" checkbox**: May be intentional for an SSO page (session management handled by Supabase), but worth confirming.
- **Input focus rings**: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` — the primary color is the problematic cyan. The focus ring has the same 2.23:1 contrast issue as the links.

## Persona Red Flags

**Alex (Power User — daily Zer/Tolom user)**: No keyboard shortcut to jump to the email field. Tab order works but there's no way to快速 authenticate. The hidden Google button click fragility means their primary auth method could silently fail.

**Sam (First-Timer — new user from a shared link)**: No logo or branding to confirm they're in the right place. No password requirements shown. No hint about what "identifier" accepts (email only? username? both?). The placeholder "name@example.com" suggests email only, but the label says "Имэйл эсвэл нэр" (Email or name) — slight confusion about whether username is supported.

## Questions to Consider

1. Should the SSO page carry the Zuiio brand identity, or stay intentionally neutral (like Google's own sign-in page)?
2. Is the "last used provider" badge the right way to surface that information, or would reordering the buttons (last-used first) be cleaner?
3. Should the primary cyan be reserved exclusively for the submit button, with links using a higher-contrast alternative?

---

> **Trend for `apps-zuiio-id-src-app-auth-login-login-form-tsx`: First run, no trend yet.**
