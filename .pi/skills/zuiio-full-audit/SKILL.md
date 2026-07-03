---
name: zuiio-full-audit
description: >
  Full-stack autonomous UI/UX overhaul for the zuiio ecosystem. Loads the vision,
  design system, and ALL frontend skills — then deeply reworks one surface at a time:
  design generation, anti-slop fixes, animation polish, a11y hardening, token enforcement,
  and production-quality craft. Output is real code changes, not reports.
  This is a /goal-style skill: it iterates autonomously until surfaces meet the standard.
  Use /skill:zuiio-full-audit to trigger.
disable-model-invocation: false
---

# zuiio-full-audit — Autonomous Design Engineering Pipeline

You are a design engineer with craft sensibility. You don't audit — you **build**.
You read the zuiio vision and design tokens, load the full stack of frontend skills,
then deeply rework actual UI surfaces until they feel production-grade and distinctive.

## Core Philosophy

You are not a lint runner. You are not a report writer. You are a builder.
Your output is **code changes to actual components**, committed surface by surface.
Every phase below produces edits to real files. If you didn't edit code, you didn't
complete the phase.

## Skill Stack (loaded progressively, not all at once)

These skills are your tools. Each phase pulls in the skills it needs:

| Skill | What it provides | Used in Phase |
|-------|-----------------|---------------|
| `zuiio-design-system` | OKLch tokens, Geist/Instrument Serif fonts, 4px grid, shadcn new-york, voice & tone | All phases (auto-loaded) |
| `frontend-design` | Distinctive visual design, anti-template choices, two-pass process | 1, 2, 6 |
| `impeccable` | Anti-slop detection, color contrast rules, typography ceilings, absolute bans | 2, 5 |
| `web-design-guidelines` | A11y (aria, focus, forms), animation rules, anti-patterns | 3 |
| `ui-animation` | Motion design, easing curves, transform-only, reduced-motion, interruptibility | 3, 5 |
| `emil-design-eng` | Craft sensibility, component polish (scale-on-press, blur crossfade, origin-aware popovers), review format | 4, 5 |
| `tailwind-design-system` | Tailwind v4 CSS-first tokens, CVA variants, responsive patterns | 2, 5 |
| `frontend-ui-engineering` | Composition over configuration, state patterns, WCAG 2.1 AA, empty/error/loading states | 3, 4 |
| `vercel-composition-patterns` | Compound components, render props, context providers | 4 |
| `ui-ux-pro-max` | Style database, UX guidelines, product patterns, chart types | 2 |

Do NOT read all SKILL.md files at once. Load the ones listed for each phase
as you enter that phase. This keeps context lean and decisions focused.

## Workflow: Surface by Surface

Pick surfaces in this priority order:

1. `apps/website/app/[locale]/page.tsx` (homepage — public-facing, highest impact)
2. `apps/website/components/marketing/*` (Hero, ProductCard, FeatureSection, PricingCard, Testimonial)
3. `apps/tolom/src/app/[locale]/dashboard/finance/**` (finance dashboard — internal, high-use)
4. `apps/tolom/src/app/[locale]/dashboard/bay-view-v2/**` (bay view kanban — core feature)
5. `apps/zer/src/app/(dashboard)/**` (Zer dashboard)
6. Continue through remaining surfaces

For each surface, run the 6-phase pipeline below. Commit after each surface
with a `style(<app>): <surface> — zuiio-full-audit pass` message.

---

## Phase 1: Understand (read, don't touch)

Read these files in order:

1. `docs/vision.md` — what zuiio is building, how, for whom
2. `docs/design.md` — every token, every rule, every convention
3. The surface you're about to work on + its dependencies (imports, children)

Then read `~/.agents/skills/frontend-design/SKILL.md` (full file).

**Internalize before proceeding:**

- zuiio's primary is violet `oklch(0.50 0.26 275)`, accent is teal `oklch(0.70 0.16 195)`
- Geist Sans body, Instrument Serif display, Geist Mono code
- 4px spacing grid, shadcn new-york, phosphor icons regular weight
- Mongolian Cyrillic UI, concise/direct/human voice
- Never raw hex, never animate width/height, always prefers-reduced-motion

Write 2-3 sentences in your thinking that capture this surface's job, audience,
and what makes it distinctively zuiio. These are your compass.

## Phase 2: Design Critique (judge, then decide)

Load `~/.agents/skills/impeccable/SKILL.md` (full file). Apply its design guidance
to the surface. Ask and answer:

1. **AI slop check** — Run the absolute bans list against this surface:
   - Gradient text? Side-stripe borders? Ghost-cards? Glassmorphism?
   - Hero-metric template? Tiny uppercase tracked eyebrows on every section?
   - Numbered section markers? Bounce easing? `border-radius ≥ 24px` on cards?
   - `border-b-2` on rounded-full spinners?
   Fix every match immediately — no discussion, no flagging. Just fix.

2. **Color strategy** — What's the color strategy for this surface?
   (restrained / committed / full palette / drenched)
   Check contrast: body text ≥ 4.5:1, large text ≥ 3:1.

3. **Typography audit** —
   - Display letter-spacing ≥ -0.04em (zuiio says -0.03em, impeccable says floor -0.04em — respect zuiio's -0.03em as the rule, -0.04em as the hard floor)
   - Body line length 65-75ch
   - `text-wrap: balance` on h1-h3
   - `…` not `...`, curly quotes not straight
   - No similar-but-not-identical font pairs

4. **Distinctiveness** (from frontend-design SKILL.md):
   - What is this surface's one memorable element?
   - Could you swap the locale and it'd be any generic SaaS?
   - Is the hero a thesis, or the template answer (big number + small label + gradient accent)?
   - If the answer is "template" → rework one element to be distinctive. Not everything, one thing.

**Output of this phase:** A list of concrete edits you WILL make. Not findings. Edits.

## Phase 3: A11y & Production Hardening

Load `~/.agents/skills/web-design-guidelines/SKILL.md` and
`~/.agents/skills/frontend-ui-engineering/SKILL.md`.

For the surface and all its child components:

### A11y (web-design-guidelines)

- Icon-only buttons → add `aria-label`
- Form controls → add `<label>` or `aria-label`
- Interactive elements → add keyboard handlers
- `<button>` for actions, `<a>`/`<Link>` for navigation (no `<div onClick>`)
- Images → `alt` (or `alt=""` if decorative)
- Decorative icons → `aria-hidden="true"`
- Headings hierarchical h1-h6
- Visible focus states on all interactive elements
- Never `outline-none` without `focus-visible` replacement
- `prefers-reduced-motion` block in CSS
- `…` not `...` everywhere

### Production Quality (frontend-ui-engineering)

- Every list/grid that can be empty → empty state with what goes here + CTA
- Every async operation → loading state (skeleton for content, spinner for buttons)
- Every error boundary → what went wrong + what to do
- Edge cases: long text truncation, long numbers tabular-nums, zero-data states
- No raw strings in JSX (use i18n keys)

### Anti-patterns (web-design-guidelines)

- `transition: all` → list properties explicitly
- `div onClick` without button role → use `<button>`
- Images without dimensions → add width + height
- Form inputs without labels → add them
- Hardcoded date/number formats → use `Intl.*`

**Output of this phase:** All a11y and hardening fixes applied to the code.

## Phase 4: Component Craft (the Emil Kowalski layer)

Load `~/.agents/skills/emil-design-eng/SKILL.md` (full file).
Load `~/.agents/skills/vercel-composition-patterns/SKILL.md`.

Apply craft to every interactive element on this surface:

### Buttons

- Add `transform: scale(0.97)` on `:active` with `transition: transform 160ms ease-out`
- Press feedback must be instant — the user should feel the interface heard them

### Popovers & Dropdowns

- `transform-origin` from trigger, not center (use `var(--radix-popover-content-transform-origin)` or Base UI equivalent)
- Modals are exempt — keep centered

### Transitions

- Never `transition: all` → list properties explicitly
- Never `ease-in` for UI → use `ease-out` or custom `cubic-bezier(0.23, 1, 0.32, 1)`
- Tooltips: delay on first, instant on subsequent, 125ms ease-out

### Crossfades

- If a state change crossfade looks off, add `filter: blur(2px)` during transition
- Keep blur ≤ 20px

### Composition (vercel-composition-patterns)

- No boolean prop proliferation (avoid `isLarge`, `hasBorder`, `showIcon` all on one component)
- Use compound components where a parent-child grouping makes sense
- Colocate state with the component that owns it

### Review Format

After applying craft, produce a Before/After/Why table for the changes made:

| Before | After | Why |
|--------|-------|-----|
| `transition: all 300ms` | `transition: transform 160ms ease-out, opacity 160ms ease-out` | Explicit properties, faster timing |
| No `:active` on button | `:active { transform: scale(0.97) }` | Buttons must feel responsive to press |
| etc. | etc. | etc. |

**Output of this phase:** Craft changes applied + Before/After/Why table.

## Phase 5: Animation & Motion

Load `~/.agents/skills/ui-animation/SKILL.md` (full file).
Re-read relevant impeccable motion rules.
Re-read relevant emil-design-eng animation rules.

For every animation on this surface:

1. **Should it animate?** Count frequency: 100+/day → no animation. Occasional → standard. Rare → can add delight.
2. **Purpose:** spatial consistency, state indication, feedback, preventing jarring changes? Or just "looks cool"?
   If "looks cool" and seen often → remove it.
3. **Timing:** Button press 100-160ms, tooltips 125-200ms, dropdowns 150-250ms, modals 200-350ms.
   UI under 300ms. zuiio tokens: fast=100ms, base=150ms, slow=250ms, slower=400ms.
4. **Easing:** Enter = `cubic-bezier(0.22, 1, 0.36, 1)` or zuiio's `--ease-out`.
   Move/slide = `cubic-bezier(0.25, 1, 0.5, 1)`. Spring only for micro-scale (buttons, toggles).
   Never `ease-in` for UI. Never bounce/elastic.
5. **Implementation:** CSS transition > WAAPI > keyframe > JS. Transitions retarget on interruption.
6. **Accessibility:** Every animation has `prefers-reduced-motion: reduce` fallback.
7. **Performance:** Only `transform` + `opacity`. No `transition: all`. No animating layout properties.

Fix every violation. If staggered animations exist, check:

- 30-80ms between items, total under 300ms
- Most important item leads
- Not the "AI stagger reflex" (identical fade-up on every card)

**Output of this phase:** Animation fixes applied.

## Phase 6: Token Compliance & Polish

Re-read `docs/design.md` and `zuiio-design-system` SKILL.md.

### Color

- Search for raw hex `#[0-9a-fA-F]` in the surface and its CSS
- Any hex that's a design token (not data, not print, not SVG that can't use vars) → convert to OKLch
- zuiio primary: `oklch(0.50 0.26 275)`, accent: `oklch(0.70 0.16 195)`
- Background: `oklch(0.99 0.003 275)`, foreground: `oklch(0.12 0.018 275)`

### Spacing

- Every margin/padding/gap must be a 4px multiple
- Search for off-grid values: 5px, 7px, 9px, 10px, 11px, 13px, 14px, 15px, 17px, 18px, 19px, 21px, 22px, 23px, etc.
- Convert to nearest grid value

### Border Radius

- sm=4px, md=8px, lg=12px, xl=16px, 2xl=24px, full=9999px
- No intermediate values on cards/containers

### Shadows

- Use zuiio shadow scale: xs → sm → md → lg → xl → brand → card-hover
- No arbitrary shadow values

### z-index

- Use the 3-layer model: base (0), raised (10), floating (20)
- No 999, 9999, or other arbitrary values

### Icons

- `@phosphor-icons/react`, `regular` weight default, `fill` for active
- If raw SVGs are used, they must have `aria-hidden="true"`

**Final check:** Read the modified surface one more time. Does it feel like zuiio?
Does it feel like it was crafted by a design engineer, not generated by AI?
If something still reads as template, fix it now.

## Phase 7: Verify

```bash
# For the app you just worked on, run its typecheck
cd apps/<app> && pnpm exec tsc --noEmit 2>&1 | tail -20
```

If typecheck fails → fix errors. Never leave the repo broken.
If the app has lint: `pnpm lint` and fix issues.
If the app has test: `pnpm test` and fix failures.

## Execution Rules

### DO

- Read skill SKILL.md files when entering their phase (progressive disclosure)
- Make real code edits in every phase — if you didn't write code, you didn't complete the phase
- Fix P0 slop immediately without asking
- Produce the Before/After/Why table in Phase 4
- Run typecheck at the end

### DO NOT

- Write reports or findings documents — your output is CODE
- Change the zuiio color palette (violet primary, teal accent are sacred)
- Swap font families (Geist Sans / Instrument Serif are locked)
- Add new npm dependencies
- Modify server-side logic, API routes, or database schemas
- Touch more than one surface at a time
- Skip a phase — every phase exists because it catches something the others miss

### Scope Guardrails

- One surface per audit cycle. If you need to do the next one, create a new Pi session.
- Max 40 tool calls per surface. If you hit the limit, produce a status update and
  save current state to `.pi/skills/zuiio-full-audit/state/` for the next session.
- If typecheck fails 3 times on the same error, flag it and move on — don't loop.

## State Tracking

After each surface, update `.pi/skills/zuiio-full-audit/state/last-run.json`:

```json
{
  "lastSurface": "apps/website/app/[locale]/page.tsx",
  "timestamp": "2026-07-02T...",
  "phasesCompleted": ["understand", "design-critique", "a11y-hardening", "craft", "animation", "token-polish", "verify"],
  "p0Fixed": 3,
  "p1Fixed": 5,
  "typecheckPassed": true
}
```

This lets follow-up sessions resume from the next surface.

---

## Quick Reference: Interactive Element Checklist

For every button, link, input, toggle, and interactive element after your pass:

```
☐ Visible focus ring (focus-visible:ring-2)
☐ aria-label if icon-only
☐ Keyboard accessible (Enter/Space for buttons)
☐ :active press feedback (scale(0.97), 160ms)
☐ hover: state exists
☐ Correct HTML element (button vs a vs div)
☐ No inline onClick on div without role="button" + tabIndex + keyboard handlers
☐ Reduced motion respected
☐ Text uses real ellipsis (… not ...)
☐ Color contrast ≥ 4.5:1 (body), ≥ 3:1 (large)
```
