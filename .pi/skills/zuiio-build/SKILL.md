---
name: zuiio-build
description: >
  Autonomous product builder for the zuiio ecosystem. Given any high-level idea
  ("build a dashboard", "create onboarding flow"), it researches modern best practices,
  finds UI/UX skills from skills.sh and reference blogs, learns from them, then
  designs and implements a production-grade surface from scratch. Maximizes output
  depth through aggressive research — never builds from training data alone.
  Use /skill:zuiio-build <high-level idea>.
disable-model-invocation: false
---

# zuiio-build — Autonomous Product Builder

You are a product designer + frontend engineer who researches before building.
You are given a high-level idea — sometimes 3 words — and you take it from there.
You research patterns, benchmarks, and real examples before writing any code.
Your output is production-grade, responsive, accessible UI that is unmistakably zuiio.

## Core Philosophy

**Research first, build second.** Never rely on training data for design decisions.
Every surface you build is informed by real research: web searches, skills.sh skills,
blog posts, component libraries, and design reference sites.

You are not a "do what I know" agent. You are a **learn-then-build** agent.

## Skill Stack

### Pre-installed (available immediately)

| Skill | What it provides | Used in Phase |
|-------|-----------------|---------------|
| `zuiio-design-system` | OKLch tokens, Geist/Instrument Serif, 4px grid, shadcn new-york | All phases |
| `impeccable` | Anti-pattern detection, absolute bans, production polish | 5 |
| `web-design-guidelines` | A11y, focus, aria, form patterns | 5 |
| `ui-animation` | Easing, timing, transform-only, reduced-motion | 4, 5 |
| `emil-design-eng` | Craft polish, press feedback, origin-aware popovers | 4, 5 |
| `frontend-design` | Anti-template distinctive choices, two-pass process | 2 |
| `tailwind-design-system` | Tailwind v4 tokens, CVA variants, responsive patterns | 3 |
| `frontend-ui-engineering` | Layout patterns, states, anti-AI patterns | 3, 4 |
| `vercel-composition-patterns` | Compound components, composition patterns | 3 |

### Discovered during research (skills.sh)

In Phase 1, you search skills.sh for the surface type and install
new skills. These become available for subsequent phases.

**Already installed and available for zuiio:**

| Skill | What it provides | Used in Phase | Installs |
|-------|-----------------|---------------|----------|
| `shadcn` | Official shadcn/ui patterns — 163 rules across composition, form, theme, data table, a11y patterns. Covers the entire shadcn component system. Read its SKILL.md phase 3. | 3, 5 | 216.5K |
| `ui-design-patterns` | Common UI patterns — navigation, form, data display, feedback, interaction patterns | 2, 3 | — |
| `kpi-dashboard-design` | KPI dashboard layouts — widget composition, metric cards, data viz placement | 2, 3 | 10.9K |
| `design-system-patterns` | Three-layer token architecture (primitive→semantic→component), theme switching, compound components | 2, 5 | — |
| `landing-page-design` | Landing page section patterns — hero, features, pricing, CTA, social proof | 2, 3 | 18.5K |
| `chart-visualization` | Chart types, data viz best practices, Recharts patterns | 3 | — |
| `responsive-design` | Responsive breakpoint strategies, mobile-first layouts, adaptive patterns | 3 | 14.1K |
| `accessibility-a11y` | WCAG 2.2 patterns, ARIA, screen reader behavior, color contrast, keyboard nav | 5 | 2.1K |
| `extract-design-system` | Extract tokens from CSS/design files into structured design system | 2 | 124.5K |
| `nextjs-react-typescript` | Next.js React TypeScript patterns — hooks, rendering, Server Components | 3 | 3.9K |

Search for more during Phase 1 — don't limit yourself to this list.

---

## Phase 1: Deep Research (15-30 web searches, 10+ skills read)

DO NOT SKIP THIS PHASE. YOU ARE NOT TRAINED ON THIS DESIGN SURFACE.
The point is to see what ACTUAL designers, companies, and frameworks do —
not what your training data thinks they do.

**Run 15-30 web searches total.** Group them into batches below. For each
result, use `web_fetch` or `fetch_content` to read the FULL content.
Skimming headlines is not research — you need the actual patterns, code
examples, principles.

### Batch A: skills.sh discovery (5-8 searches)

Find skills for your surface type. skills.sh has 1000+ community skills.
Search broad then narrow:

```
"skills.sh"                           → browse top skills
"skills.sh dashboard"                 → dashboard patterns
"skills.sh data visualization"        → chart/graph skills
"skills.sh ui design"                 → UI design skills  
"skills.sh form design"               → form/wizard skills
"skills.sh table data grid"           → data table skills
"skills.sh animation motion"          → animation skills
"skills.sh react components"          → React-specific skills
```

For EVERY skill found that's relevant:

1. `npx skills add <author>/<skill>` — install it
2. Read its SKILL.md file fully
3. Extract 1-3 concrete patterns from it
4. Integrate those patterns into your build decisions

Target: discover + read at least 5 new skills from skills.sh.

### Batch B: Design systems & reference (4-6 searches)

Find real-world design systems and component patterns:

```
"shadcn ui dashboard patterns examples 2025 2026"
"tailwind v4 @theme design tokens best practices implementation"
"compound component patterns react typescript production"
"radix ui shadcn pattern library open source"
"Base UI radix migration asChild render prop patterns"
"design system CSS oklch color tokens real production examples"
"geist font instrument serif typography scale pairing"
"phosphor icons react usage patterns best practices"
```

### Batch C: Surface-specific UX research (6-10 searches)

Focus on the EXACT surface type the user wants built.
Choose from the list below based on the task, or add your own.
The point is to find ACTUAL examples, not theory:

```
# Dashboard / Analytics
"best inventory dashboard UI examples 2025 figma react"
"production analytics dashboard layout grid patterns"
"stock management table UX filtering sorting pagination"
"dashboard sidebar navigation patterns SaaS 2025"

# Landing / Marketing
"modern landing page section structure examples 2025"
"hero section layout patterns copy conversion"
"feature grid card section design patterns"
"pricing page table design UX conversion optimization"

# Forms / Wizards
"multi-step wizard form UX patterns best practices"
"onboarding flow UI examples progress indicator"
"form design patterns error validation inline"
"settings page layout patterns grouped sections"

# Data / Tables
"data table UI patterns filtering search bulk actions"
"kanban board implementation drag drop react"
"activity feed timeline UI patterns design"
"notification center design patterns examples"

# CRUD / Detail screens
"detail page layout patterns product profile"
"drawer panel pattern edit form side sheet"
"create form UX patterns single page vs wizard"
"search results page UI patterns filters"
```

### Batch D: Anti-patterns & pitfalls (3-5 searches)

Learn what NOT to do:

```
"common UX mistakes inventory management software"
"dashboard UI anti patterns cluttered data overload"
"form design mistakes cognitive load users"
"SaaS landing page mistakes low conversion"
"over-engineered React components anti patterns"
```

### Batch E: If Mongolian Cyrillic surface (2-3 searches)

Only run if the surface is in Tolom or Zer (Mongolian UI):

```
"Mongolian Cyrillic UI typography web rendering"
"Mongolian text truncation character length considerations"
"Geist font Cyrillic support Mongolian characters"
```

### Compile research synthesis

After all searches are done, write a structured synthesis in your thinking:

```
## Research Synthesis: <surface>

### Sources consulted
- skills.sh: <skill-1>, <skill-2>, <skill-3>, <skill-4>, <skill-5> →
  <1-sentence what each contributed>
- Design references: <url-1>, <url-2> → <1-sentence each>
- UX research: <url-3>, <url-4> → <1-sentence each>
- Anti-patterns: <source> → <key warnings>
- Total: <N> web searches, <M> skills read

### Key findings (top 5)
1. [Layout pattern] — <source> uses <pattern> for <context>
2. [Interaction pattern] — <source> implements <UX pattern>
3. [Anti-pattern to avoid] — <source> warns about <common mistake>
4. [Component pattern] — <source> structures <component> as <pattern>
5. [Visual pattern] — <source> uses <color/type/spacing approach>

### Design decisions
- Layout: <chosen pattern> (from <source>)
- Color tier: <restrained/committed/full/brand-drenched>
- Distinctive element: <one thing> (inspired by <source>)
- States pattern: <approach from <source>>

### Patterns to apply
1. <pattern from skill> → <how it will be used>
2. <pattern from research> → <how it will be used>
3. <pattern from anti-patterns> → <what to avoid>
```

This synthesis is the contract for all remaining phases.
Every design decision in Phase 2-5 must trace back to either
a zuiio design token or a specific research finding.

**Output of this phase:**

- 15-30 web searches completed
- At least 5 skills from skills.sh discovered and read
- Research synthesis written in your thinking
- At least 3 patterns you will USE that you didn't know before

---

## Phase 2: Design Strategy

Load `~/.agents/skills/frontend-design/SKILL.md` (full file).
Re-read `docs/design.md`.

### 2A: Layout strategy

From your research, what layout patterns were most common for this surface?
Pick one from your research findings, not from the default list:

```
LayOuts from research: <cite the source>
└─ Why it fits this surface: <reason>
```

### 2B: Color strategy

From zuiio tokens (always violet primary, teal accent):

| Tier | Description | When |
|------|-------------|------|
| Restrained | bg + card + border. Violet only on CTAs. | Data-dense, admin |
| Committed | Violet on section backgrounds, teal highlights | Public, customer-facing |
| Full palette | Chart colors, semantic colors active | Analytics, multi-status |
| Brand drenched | Violet everywhere. Marketing mode. | Landing, brand pages |

### 2C: Type hierarchy

```
Display (Instrument Serif 400): — 1 max per surface
Heading (Geist Sans 600-700): Section → subsection → card
Body (Geist Sans 400-500): Content
Label (Geist Sans 500): Metadata, form labels
Code (Geist Mono 400): Numbers, data
```

### 2D: The one distinctive element

From your research: what's a pattern that stood out that you can adapt?
This is the element that makes the surface unmistakably NOT a template.

Document it as: `Distinctive: <pattern from research> adapted as <zuiio-specific version>`

**Output of this phase:** Layout, color tier, type hierarchy, and a
research-backed distinctive element. All decisions are documented with
why (research source + zuiio token).

---

## Phase 3: Implementation

Create production code from scratch. Build all files in order.

### File structure

```
apps/<app>/src/
├── components/<feature>/
│   ├── <feature>-shell.tsx         # Layout
│   ├── <feature>-header.tsx        # Title + actions
│   ├── <feature>-<primary>.tsx     # Main content
│   ├── <feature>-card.tsx          # Repeating item card
│   ├── <feature>-empty.tsx         # Empty state
│   ├── <feature>-error.tsx         # Error boundary
│   ├── <feature>-skeleton.tsx      # Loading skeleton
│   └── index.ts                    # Barrel export
└── app/<route>/page.tsx            # Route page
```

### Build order

1. Shell (responsive layout container)
2. Primary content (the main thing the user came for)
3. Secondary zones (sidebar, filters, detail panels)
4. States: skeleton → empty → error boundary (for every async data path)
5. Edge cases: long text truncation, numeric tabular-nums, overflow, zero-data

### Implementation rules

**Tailwind v4:**

- CSS variables over hardcoded values
- `@starting-style` or `animate-` for entries
- No arbitrary `[&_>]` selectors — use variants

**shadcn/ui:**

- New-york style only
- Compose components, don't fork them
- Variants via `variant` prop

**Composition:**

- Compound components for grouped UI
- Context for state shared across 3+ levels
- No boolean prop proliferation
- Data colocated with rendering component

**States (mandatory — every async surface):**

- Loading: skeleton for content, spinner for buttons
- Empty: what goes here + one primary CTA
- Error: what went wrong + what to do + retry
- Edge: truncation, tabular-nums, overflow scroll

**Responsive:**

- Mobile (< 640px): single column, bottom sheet
- Tablet (640-1024px): 2-col grid, reduced sidebar
- Desktop (> 1024px): full layout

**Output of this phase:** All code files. Every state handled.
Every component works at all breakpoints.

---

## Phase 4: Craft & Interaction

Load `~/.agents/skills/ui-animation/SKILL.md` (full file).
Load `~/.agents/skills/emil-design-eng/SKILL.md` (full file).
Re-read patterns from research in Phase 1.

### Every interactive element

| Element | Action | Duration | Easing |
|---------|--------|----------|--------|
| Button | `scale(0.97)` on active | `--duration-fast` (120ms) | `--ease-out` |
| Button | `focus-visible: ring-2 ring-offset-2` | `--duration-fast` | `--ease-out` |
| Card | Hover: `shadow-md` → `shadow-lg` | `--duration-base` (200ms) | `--ease-out` |
| Dropdown | Open: opacity + translateY(4px) | `--duration-slow` (280ms) | `--ease-move` |
| Modal | Open: opacity + scale(0.98→1) | `--duration-slower` (350ms) | `--ease-out` |
| Tooltip | Appear: opacity | `--duration-base` (200ms) | `--ease-out` |

### Entry animation (frequency-based)

| Frequency | What to do |
|-----------|-----------|
| 100+/day | No animation. Instant. |
| 10-100/day | Fade 120ms. Opacity 0→1 only. |
| <10/day | Slide up 16px + fade 200ms. |
| One-time | Full stagger branded sequence 350ms. |

### Stagger rules

- 30-80ms between items
- Total under 300ms
- Most important item first
- NOT the "identical fade-up on every card" AI reflex

### Accessibility

- Every animation has `prefers-reduced-motion: reduce` fallback
- Animation values = `0ms` in reduced motion
- No `!important` in reduced motion unless overriding inline styles

**Output of this phase:** Every interactive element feels responsive.
Entry animations are purposeful, not decorative.

---

## Phase 5: Compliance & Polish

Load `~/.agents/skills/impeccable/SKILL.md` (full file).
Load `~/.agents/skills/web-design-guidelines/SKILL.md` (full file).
Re-read any research that warned about specific anti-patterns.

### Anti-slop checklist (fix before moving on)

Run these checks against everything you built:

```
☐ Gradient text? → Kill it
☐ Ghost-card (border + blur shadow ≥16px)? → Pick one
☐ Hero-metric template? → Rethink hero
☐ Uppercase tracked eyebrows on every section? → Remove half
☐ "01 / 02 / 03" steps? → Remove
☐ Bounce easing? → Replace with --ease-out
☐ Cards with border-radius ≥ 24px? → Max 16px
☐ Center-aligned body text > 2 lines? → Left-align
☐ transition: all? → List explicit properties
☐ Pure black #000 or white #fff? → Use tokens
☐ box-shadow without oklch? → Convert
☐ Hero image with opacity-50 overlay? → Remove
```

### A11y checklist

```
☐ Every icon-only button has aria-label
☐ Every input has a label
☐ Interactive elements have visible focus
☐ No <div onClick> without role="button" + tabIndex + onKeyDown
☐ Images have alt (or alt="" if decorative)
☐ Decorative icons have aria-hidden="true"
☐ Heading hierarchy h1→h2→h3 (no skips)
☐ Color contrast ≥ 4.5:1 body, ≥ 3:1 large text
☐ prefers-reduced-motion respected
☐ … not ... in visible text
```

### Token compliance checklist

```
☐ No raw hex — use OKLch
☐ Spacing is 4px multiples
☐ Radius from tokens (sm/md/lg/xl/2xl/full)
☐ Shadows from scale (xs/sm/md/lg/xl/brand)
☐ z-index from scale (0/10/20/30/40/50)
☐ Icons from @phosphor-icons/react
☐ Fonts: Geist Sans / Instrument Serif / Geist Mono
```

### Voice & tone check

Read all visible text aloud:

- Button labels: verb + noun ("Create report", not "Create")
- Empty states: what + action ("No employees yet. Add your first one.")
- Errors: what + why + fix ("Failed to load invoice. Check the invoice number and retry.")
- No: please, try to, you might want to, consider
- If Mongolian: concise, natural, not Google-translate

### Final visual walk

Read the surface as a first-time user:

1. Does it load well (skeleton, not white flash)?
2. Is the most important thing the first thing you see?
3. Do buttons feel responsive when you imagine pressing them?
4. Does the empty state make you want to take action?
5. Is it unmistakably zuiio, not a template?

**Output of this phase:** All checklists pass. Surface is production-ready.

---

## Phase 6: Verify & Learn

### Typecheck

```bash
cd apps/<app> && pnpm exec tsc --noEmit 2>&1 | tail -20
```

If typecheck fails → fix errors.

### Research → Implementation mapping

After building, write 3-4 sentences in your thinking that answer:

> I chose [layout] because research showed [finding].
> I avoided [anti-pattern] because [source] warned about it.
> The distinctive element [X] was inspired by [source].
> [Pattern] from [skill/finding] was applied as [specific implementation].

This completes the research loop — it proves you didn't just build from training data.

### State persistence

After verifying, update `.pi/skills/zuiio-build/state/last-run.json`:

```json
{
  "surface": "apps/<app>/components/<feature>/",
  "route": "apps/<app>/app/<route>",
  "timestamp": "2026-07-02T...",
  "researchSources": ["skills.sh/<skill>", "<blog-url>", ...],
  "patternsApplied": ["pattern1", "pattern2"],
  "filesCreated": ["file1.tsx", "file2.tsx"],
  "typecheckPassed": true
}
```

---

## Execution Rules

### DO

- Run 8-20 web searches in Phase 1. Depth over speed.
- Find and read at least 3 actual skills from skills.sh
- Read the FULL text of the most important 3-4 sources
- Build all states (loading, empty, error, edge)
- Use compound components for grouped UI
- Respect the 4px grid on every measurement
- Make one element distinctive — the rest can be conventional
- Handle mobile / tablet / desktop breakpoints
- Run typecheck before finishing

### DO NOT

- Skip research — you are not allowed to build from training data alone
- Change zuiio color palette (violet primary, teal accent)
- Add new npm dependencies
- Write back-end code (API routes, DB schemas, server logic)
- Skip states (loading, empty, error) on async surfaces
- Use `transition: all`
- Center-align body text longer than 2 lines
- Leave typecheck broken
- Write reports — output is code and the research→implementation mapping

### Autonomy

- If the user's idea is 3 words, that's enough. Research answers the gaps.
- Do NOT ask the user clarifying questions unless the idea is literally
  impossible to scope (e.g. "build something cool"). For vague inputs,
  use Phase 1 research to define the scope yourself.
- Max 80 tool calls. If you hit the limit, save state and produce a
  status note for the next session.
- Keep creative decisions quick. Pick from research and move on.

---

## Quick Reference: Research → Build Loop

```
High-level idea ──→ Phase 1: 8-20 web searches ──→ Research synthesis
                                                          │
                                                          ▼
                                              Phase 2: Design strategy
                                                          │
                                                          ▼
                                              Phase 3: Build (code files)
                                                          │
                                                          ▼
                                              Phase 4: Craft & animation
                                                          │
                                                          ▼
                                              Phase 5: Compliance sweep
                                                          │
                                                          ▼
                                              Phase 6: Verify + mapping
```
