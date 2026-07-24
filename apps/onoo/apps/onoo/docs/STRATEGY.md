# Onoo — Monetization & Analytics Strategy

> **For AI agents:** This document captures the strategic analysis of how Onoo turns raw basketball stats into sellable intelligence. It informs prioritization and product decisions. Read alongside `docs/VISION.md` and `docs/ROADMAP.md`.

---

## Executive Thesis

Onoo's near-term competitor is not Synergy Sports or Stats Perform. It is **duplicate data entry, arithmetic mistakes, delayed results, and WhatsApp screenshots**.

The path to revenue is not selling "advanced analytics." It is selling a **closed value loop**:

> **Capture once → trust the record → explain what happened → publish everywhere → prove commercial value.**

Analytics are supporting evidence, not the product. The product is **publication speed + sponsor value + zero re-entry**.

---

## The Data Capability Ladder

Not every data source supports every analytic. Every surface must carry an honest coverage indicator.

| Level | Available analytics | Required data | Current coverage |
|---|---|---|---|
| **Universal** | eFG%, TS%, Game Score, AST/TO, home/away splits, rolling form | Approved box scores | ✅ All games from tracker or FIBA PDF |
| **Team context** | Estimated pace, ORtg/DRtg, Four Factors, PIE, rebound rates | Complete player + team + opponent totals | ✅ From `game_player_stats` + `game_team_stats` |
| **Event context** | Runs, lead changes, clutch scoring, momentum | Complete chronological `stat_events` stream | ⚠️ Tracker only — PDF import produces no event timeline |
| **Spatial** | Shot chart, zone efficiency | Shot x,y coordinates | ❌ Optional in tracker (`payload.x`, `payload.y`), absent from PDF |
| **Lineup** | Five-man units, on/off net rating, rotation analysis | Consistent substitution tracking + event clock | ❌ Not reliably captured |

**Every metric must carry:**
- Source coverage indicator (which data levels support it)
- Exact formula and metric version (semver)
- "Observed" vs "estimated" label
- Minimum games/minutes threshold
- Approved revision ID it was computed from
- Last recalculation time

---

## The Final-Whistle Pack

**The single highest-leverage feature to build.** Within 5 minutes of game end, Onoo automatically produces:

1. Updated game result, standings, leaders, and player profiles
2. Mobile-first recap page (final score, top performers, lead-change flow)
3. Final-score and top-performer share images (sponsor-branded)
4. Career-high/milestone achievement cards
5. A concise Mongolian narrative (deterministic templates — not AI-dependent)
6. League and sponsor branding baked into every surface
7. One-click download/copy/share controls
8. Measurable links and sponsor impression tracking

It must work from either the live tracker or an approved FIBA PDF import, degrading honestly when richer data (event timeline, shot coordinates) is unavailable.

**Start with deterministic Mongolian templates.** Generative AI is not a dependency for publication reliability.

### Why this serves every stakeholder

| Who | What they get |
|---|---|
| **League** | Zero post-game manual publishing. Professional-looking recaps go out instantly. |
| **Player / family** | Something worth sharing on Facebook, Instagram, WhatsApp. |
| **Sponsor** | Visible, measurable inventory embedded in every published asset. |
| **Onoo** | Traffic, usage evidence, renewal data, and a concrete sales demo. |

---

## B2B Data Products

### For Leagues (primary revenue)

| Product | Features | Value proposition |
|---|---|---|
| **Sponsorship Intelligence Dashboard** | Per-game page views, most-viewed players, share counts, engagement trends. Sponsor ROI report: "Your logo appeared on X player pages viewed Y times." | Leagues walk into sponsor meetings with numbers. Closes sponsorship deals. |
| **League Analytics Console** | Season-over-season comparisons, team efficiency rankings, league-wide trends, player development across the league. | Leagues understand their own product — which teams are improving, where the talent is. |
| **Embeddable Widgets** | Standings table, leaderboards, game schedule — embeddable on any website with sponsor slots baked in. | Leagues give their own websites live data without building anything. |
| **Automated Recap Publishing** | After every game: auto-generated Mongolian recap with key stats + image, ready to post to Facebook/Instagram. | League social media managers save hours per week. |
| **Season Report PDF** | Beautiful downloadable season summary per team: stats, streaks, milestones, standings journey. Sponsor logos on report. | Leagues hand this to sponsors at season end as proof of value. |
| **Exportable Media Assets** | Player headshots with stat overlay, game result graphics, leaderboard graphics — instant ready-to-post. | League content never runs dry during the season. |

### For Teams (design-partner beta, not broad release)

| Product | Features | Prerequisites |
|---|---|---|
| **Team Performance Dashboard** | Efficiency trends, Q-by-Q scoring, home/away splits, Four Factors. | Needs consistency metric coverage audit first. |
| **Player Development Reports** | Month-over-month stat progression with visual sparklines, comparison to league averages. | Season arc charts exist (T-2.4); need comparison logic. |
| **Opponent Scout Card** | One-page profile of next opponent: tendencies, top scorers, weaknesses — from public game data only. | Read-only, no extra data collection needed. |

**⚠️ Do not become a Hudl/Synergy competitor.** Broad coaching/scouting tools are explicitly out of scope per `VISION.md:65`. Offer Team Insights only as a read-only beta for paid design partners.

### For Sponsors (enabled by league subscription)

| Product | Features |
|---|---|
| **Audience Report** | Verified page views, placement impressions, link clicks per sponsor slot. |
| **Brand Visibility Report** | Where sponsor logos appeared across the season, how many eyeballs. |

---

## Revenue Model

**Per-season license with game-volume bands.** Not per-game (discourages coverage), not performance bonus (attribution disputes).

### Suggested structure

> All pricing below is hypothesis — validate through deposits, not surveys.

| Package | Indicative | What's included |
|---|---|---|
| **Paid pilot** | 1,000,000 MNT deposit, limited games, fully credited toward conversion | Tracker + public showcase |
| **Core** | ~2–3M MNT/season, up to ~60 games | Tracker + showcase + basic standings/leaders |
| **Showcase** | ~4–6M MNT/season, higher game band, multiple competitions | Core + sponsor placements + audience reporting + season report PDF |
| **Large league** | Custom for 150+ games or multiple competitions | All features |
| **Managed scoring** | Separate per-game service fee | Onoo provides scorer+equipment for game day |
| **Sponsor sales** | Commission (only if Onoo sources/closes the sponsor) | Not for displaying league-sold sponsors |

Use **staged payments**: deposit → mid-season → completion (fits modest league budgets).

### The pricing ceiling

Leagues will pay up to:

> **Manual admin time saved + dispute risk reduced + sponsorship value created**

Not the cost of the software. Price against the value of what you eliminate, not what you add.

---

## Reshuffled Roadmap

The original roadmap (Phases 3–6) was organized by fan experience. This reshuffle prioritizes revenue and league retention:

| Phase | Focus | Key deliverables | Original equivalent |
|---|---|---|---|
| **1** | **Trusted data foundation** (in progress) | Record integrity, game-day reliability, authorization | Same |
| **2** | **Player showcase** (mostly done) | Hero cards, charts, milestones, summaries, career view | Same |
| **→ 3** | **Final-Whistle Pack** | Recap pages, share images, OG images, sponsor branding, auto-publish | Pulled from old 4+5 |
| **→ 4** | **League proof & renewal** | Audience dashboard, season report PDF, sponsor intelligence, embeds | Pulled from old 4 |
| **→ 5** | **Discovery & organic growth** | Standings redesign, awards/MVP, comparison, search, SEO | Old Phase 3 |
| **→ 6** | **Live experience** | Provisional visibility, live game center, real-time stats | Old Phase 5 |
| **→ 7** | **Team Insights beta** | Read-only performance dashboards for paid design partners | New |
| **⎯** | **Shop** | **Frozen** — commerce adds inventory, payment, fulfillment, and support work without strengthening the league subscription loop | Old Phase 6 |

---

## Validation Plan (Before Building Broad Analytics)

1. **Manually create the Final-Whistle Pack for 5–10 real games.** Time it. Polish the output until it looks professional.
2. **Measure current workflow:** time from final whistle to WhatsApp broadcast, to standings update, to social media post.
3. **Get a deposit** after showing the full workflow to a league — not a survey answer, actual money.
4. **Put real sponsor branding on sample cards** and request a letter of intent or insertion order from a potential sponsor.
5. **Audit 30–50 games** for metric coverage by source type (what % of games have event-level data? shot coordinates?).
6. **Give three coaches a concierge Team Insights report** and ask if they'd pay separately.

**Decision gate:** If leagues will pay for publication speed and sponsor value but not analytics, embed analytics in the package rather than selling it separately.

---

## Advanced Metrics Standard

When adding computed metrics, follow this convention:

```
## {Metric Name}
- **Formula:** {exact formula}
- **Version:** {semver}
- **Label:** observed | estimated
- **Minimum games:** {N}
- **Data level required:** universal | team_context | event_context | spatial | lineup
- **Source coverage:** {percentage of tracked games that can compute this}
```

This prevents exposing "advanced stats" that are actually simplified approximations under authoritative-sounding names.

### Currently in the codebase

The file `packages/core/src/stats/advanced.ts` contains functions like `ASTPct`, `TRBPct`, `USGPct`. **These are per-minute approximations, not the standard basketball formulas.** They are also not exported through `@onoo/core`'s `index.ts`. Do not expose them under authoritative metric names until formulas, inputs, and tests are standardized.

---

## Key Principles

1. **Analytics without a decision is decoration.** Every metric should answer a specific question for a specific audience.

2. **Coverage honesty over false precision.** Show what data level supports each metric. Never fill gaps with estimates without labeling them.

3. **Precompute after approval.** Don't compute analytics from raw events on every page load. Compute once when a revision is approved, cache the results.

4. **Publication speed is the killer app.** The difference between "game ended" and "everything is live and shareable" is the only metric that matters for league adoption.

5. **Paper and WhatsApp win on capture.** Onoo wins *after* capture — no re-entry, no arithmetic errors, no chat-scrolling for old results.

6. **Don't sell data. Sell the elimination of work.** Leagues pay to not do things, not to get more things.

---

_Last updated: 2026-07-22_
