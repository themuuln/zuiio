# Zer UI Workflow — Corridor Narrowing

Before coding any new UI, run through the 6-Round Lock. This prevents "AI slop" where everything looks generic.

## The 6-Round Lock

| Round | Decision | What to Lock |
|-------|----------|-------------|
| R1 | **Genre** | Overall visual direction |
| R2 | **Palette + Type** | Token selection from design.md |
| R3 | **Layout Grid** | Structural approach |
| R4 | **Components** | Which shadcn components, any custom |
| R5 | **Imagery** | Photos, icons, illustrations direction |
| R6 | **Slop Check** | Final guard against generic output |

## How to Apply

1. Read `../../docs/anti-slop.md` before any UI task
2. Read `../../docs/taste.md` for project-specific taste rules
3. Check `docs/references/` for relevant competitor/inspiration designs
4. Lock R1-R5 before coding
5. Run R6 after coding — check against banned patterns
6. Run `pnpm design:check` to catch automated issues

## Quick Reference

- Colors: ONLY from `globals.css` tokens (oklch format)
- Typography: Geist Sans (UI) + Instrument Serif (display)
- Icons: Phosphor (regular weight, fill for active)
- Layout: Asymmetric, not everything centered
- Loading: Skeleton, not spinner
- Spacing: 4px grid multiples
- Dark mode: Violet-tinted, not pure black

## Screenshot Feedback Loop

After building UI, verify visually — not just that it compiles, but that it looks right:

1. Take a screenshot of the new/changed page (use browser tools or `impeccable` skill)
2. Evaluate against taste.md — does it match encouraged patterns?
3. Run anti-slop checklist — check against banned patterns
4. Check hierarchy — squint test: is there one clear focal point?
5. Check dark mode — violet-tinted backgrounds, not pure black
6. Fix issues — if any banned pattern found, rewrite before shipping

Use `impeccable critique <page>` for structured design review, or manually screenshot + evaluate.
