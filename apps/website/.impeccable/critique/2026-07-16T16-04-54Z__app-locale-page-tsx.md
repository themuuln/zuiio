---
target: homepage
total_score: 26
p0_count: 0
p1_count: 2
p2_count: 2
p3_count: 1
timestamp: 2026-07-16T16-04-54Z
slug: app-locale-page-tsx
---
# Critique: Homepage (app/[locale]/page.tsx)

## Design Health Score: 26/40

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Header scroll state and mobile menu work |
| 2 | Match System / Real World | 3 | Mongolian-first copy; "Mini ERP" jargon could be more concrete |
| 3 | User Control and Freedom | 3 | Mobile menu closes on nav; locale switcher works |
| 4 | Consistency and Standards | 3 | Consistent token usage; bento grid is deliberate |
| 5 | Error Prevention | 3 | Static site, few error states needed |
| 6 | Recognition Rather Than Recall | 2 | No visual product previews — must click through to understand |
| 7 | Flexibility and Efficiency | 2 | No shortcuts for repeat visitors; no product comparison |
| 8 | Aesthetic and Minimalist Design | 2 | Standard SaaS template structure; palette is safe, not distinctive |
| 9 | Error Recovery | 3 | 404 page exists; legal pages have sidebar nav |
| 10 | Help and Documentation | 2 | No FAQ, no chat, no "how it works" section |

## Anti-Patterns Verdict

**LLM**: Partially AI-generated feel. Distinctive font pairing and committed palette save it from full template territory, but the page structure is the most common SaaS flow. Spring easing is a dated tell.

**Detector**: 2 findings — bounce-easing on `--ease-spring` (globals.css:59) and `scale-in-spring` keyframe (globals.css:288).

## Priority Issues

### P1: No product screenshots or visual proof
Homepage tells about Zer/Tolom but never shows them. Product cards are text-only with SVG icons.

### P1: Brand personality is invisible
Professional but culturally flat. No Mongolian imagery, local texture, founder story, or community feel.

### P2: Testimonials lack credibility
Text-only quotes, no photos, no company logos, no metrics. Feel like placeholder content.

### P2: Spring easing on buttons is dated
`--ease-spring` creates elastic bounce — feels playful-corporate, not practical/proud/warm.

### P3: No product comparison path
Users must click through to individual pages to understand Zer vs Tolom differences.
