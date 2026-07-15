# Onoo — Athlete Stats Showcase Roadmap

Onoo is an **athlete-first stats platform** for Mongolian basketball. The core product is the public experience: anyone — fans, family, scouts, teammates — can open a player's page and see their stats presented in a beautiful, creative way. Accurate trusted records are the foundation, not the destination.

## Product thesis

- The **player profile is the heart** of the product. Every game tracked exists to make a player's story richer.
- Stats should feel like a **highlight reel, not a spreadsheet**: visual, animated, shareable.
- Public pages must work great on a phone, load fast, and be shareable as links and images.

## Commercial gates (paid pilot)

Carried over from the V2 pilot plan — adjust if the business model has changed:

| Gate | Outcome |
| --- | --- |
| Discovery | Contracted pilot, 1,000,000 MNT deposit, one-season agreement |
| Paid proof | 100% final-score accuracy, zero unrecoverable events, whistle-to-recap under 5 minutes |
| Full season | Satisfaction ≥8/10 and season contract within 14 days |
| Expansion | Native mobile, follows/push, and claims unlock only after a full-season renewal |

## Delivery phases

**For AI implementers:** each phase has an execution spec in `docs/plans/` with exact file paths, data sources, steps, and done-criteria. This roadmap is the what/why; the specs are the how. Read `docs/plans/00-conventions.md` first, then the spec for your phase. Tick the checkbox here in the same commit that completes a task.

### Phase 1 — Trusted data foundation (carried over, in progress)

> Execution spec: [plans/phase-1-trusted-foundation.md](plans/phase-1-trusted-foundation.md)

Beautiful stats built on wrong numbers destroy trust. Keep the trusted-record core, scoped to what the showcase needs:

**Record integrity**

- [x] Clean V2 schema baseline, RLS, audited commands.
- [x] Pilot reference data replacing mock fixtures.
- [ ] Prove clean reset, generated type diff, and role matrix against local Supabase.
- [ ] Ruleset-bound event vocabulary — the event dictionary validates against the game's ruleset.
- [ ] Evidence-backed submissions with revisioned approval/correction workflow.
- [ ] Projections rebuilt from approved journals only; public pages read curated `v_public_*` views.
- [ ] Authorization cutover — no direct browser/API writes to events, game state, or projections; every mutation goes through scoped commands; legacy derived-stat RPC paths retired.

**Game-day reliability**

- [x] Durable tracker journal (persist-before-send, safe replay after reload).
- [ ] Controlled lead-to-backup scorer handoff.
- [x] Game-day runbook with paper fallback.
- [ ] Ops console with private telemetry (tracker health, journal lag, pending reviews).
- [ ] Database integration tests and tracker chaos tests — kill the network mid-game and prove recovery.

### Phase 2 — Player profile as showcase

> Execution spec: [plans/phase-2-player-showcase.md](plans/phase-2-player-showcase.md)

Turn `players/[id]` from a data page into a portrait of the athlete:

- [ ] **Roster onboarding kit** — bulk roster import, player photo upload, team logos and colors, and a designed placeholder identity for missing photos. Every showcase surface assumes this media exists; treat it as league onboarding, not optional polish.
- [ ] **Consent & takedown** — publication consent captured at roster onboarding (guardians for minors), plus a removal/anonymization process the league can execute.
- [ ] **Hero identity card** — jersey number, position, team colors, season averages as large statement numbers with count-up animation.
- [ ] **Season story arc** — game-by-game performance sparklines/area charts (PTS, REB, AST trends across the season).
- [ ] **Shooting profile** — FG/3P/FT split visualized (radial gauges or stacked shot-mix bars), not just percentages in a table.
- [ ] **Career highs & milestones** — auto-detected bests (career-high points, double-doubles, streaks) surfaced as achievement badges.
- [ ] **Radar/spider chart** — player skill shape (scoring, rebounding, playmaking, defense, efficiency) vs. league average.
- [ ] **Recent games strip** — last-5 game capsules with W/L context and standout stat per game.
- [ ] **Plain-language game summaries** — auto-generated Mongolian one-liners per player ("Career-high 24 points on 60% shooting") so family gets the story without reading a box score.
- [ ] **"Report a stat error" intake** — public button on player/game pages that feeds the Phase 1 correction queue; gives players a voice without accounts or OTP.
- [ ] **Season selector & career view** — profiles aggregate across seasons with clear season-vs-career stats and defined rollover behavior when a new season starts.
- [ ] Full box-score history stays available, one tap below the visual layer.

### Phase 3 — Discovery & league surfaces

> Execution spec: [plans/phase-3-discovery-league.md](plans/phase-3-discovery-league.md)

Let people find tonight's game, follow the league, and argue about players:

- [ ] **Home: tonight's games** — the homepage answers "who plays tonight, what's the score, who won" at a glance; schedule, live scores, and results one tap from everywhere. The most-visited fan surface.
- [ ] **Standings redesign** — form guide (last 5), movement indicators, team-color rows; the most-screenshotted league surface.
- [ ] **Leaders redesign** — top-10 leaderboards as visual podiums/cards with player photos, not table rows.
- [ ] **Qualification rules** — minimum games/minutes thresholds for leaderboards and league-average comparisons, so one hot game can't top the PPG board; show "N games to qualify" states.
- [ ] **Awards & MVP races** — automated Player of the Week / season MVP race derived from leaders data, presented as shareable award graphics. Leagues hand them out, players share them, sponsors can sponsor them.
- [ ] **Player comparison** — side-by-side visual duel view (existing `players/compare` + `api/stats/compare-players`), with mirrored bar charts and radar overlay.
- [ ] **Team pages** — roster grid of mini player cards; team identity (colors, form guide) applied throughout.
- [ ] **Search & browse** — find any player by name/team/league in two taps from anywhere.

### Phase 4 — Shareability & reach

> Execution spec: [plans/phase-4-shareability-reach.md](plans/phase-4-shareability-reach.md)

Stats people can show off:

- [ ] **OG images** — auto-generated social cards for player pages and game results (player photo + key stat lines), so links look great in chats/social.
- [ ] **Shareable stat cards** — downloadable/exportable image of a player's game or season line (uses existing `api/export/pdf` groundwork).
- [ ] **Game recap pages** — final score, top performers, and lead-change flow presented visually.
- [ ] **Embeds** — lightweight embeddable player/game widgets for league and team websites.
- [ ] **Sponsor placements** — "presented by" slots on standings/leaders/game pages and sponsor logos baked into shared stat cards, recaps, and award graphics. Turns public surfaces into sellable league inventory — the strongest renewal argument.
- [ ] **League audience dashboard** — views per game, most-viewed players, share counts. Proof-of-audience numbers league owners can put in front of sponsors (distinct from the private ops telemetry console).
- [ ] **English profile view/export** — scout-facing English toggle and exportable stat record for players pursuing opportunities abroad; no local incumbent offers this.
- [ ] **SEO basics** — sitemap, per-page metadata, and indexable player/team/game pages so profiles surface in Google and Facebook search, not just via shared links.

### Phase 5 — Live experience

> Execution spec: [plans/phase-5-live-experience.md](plans/phase-5-live-experience.md)

- [ ] Public visibility for provisional games — `v_public_live_games` view with an explicit "Урьдчилсан" badge everywhere it surfaces (prerequisite for live scores and the <5-minute recap).
- [ ] Live game center with real-time score, on-fire player indicators, and play-by-play feed driven by the tracker journal.
- [ ] Live-updating player stat lines during games (Supabase Realtime on curated views).

## Design principles for public surfaces

- Mongolian-first copy (`@onoo/core` i18n), numbers formatted via `formatNumber`/`formatPercent`.
- Mobile-first layouts; charts must be legible at 360px width.
- Motion with purpose: count-ups, chart draw-ins, transitions — never blocking content.
- Dark-friendly, team-color-aware theming on player and team pages.
- Server Components + curated `v_public_*` views; no mock fallbacks on public pages.
- Viewing is never gated: no signup, login, or app-install prompts on any public surface.
- Performance budget: fast p75 loads on mid-range Android over mobile data — small images, light JS, no autoplaying media.
- Cold-start friendly: every surface must look intentional with zero or few games — design empty and small-sample states, not just full-season layouts.

## Explicitly deferred

- Expo/mobile native app (web-first, PWA covers mobile for now)
- follows and push notifications
- athlete claims and phone OTP
- unsupported historical imports

## Success measures

- A non-technical fan can find a player and understand their season in **under 30 seconds**.
- Player pages are **shared organically** (links/screenshots) by players and family.
- **100%** final-score accuracy and **0** unrecoverable tracker events remain non-negotiable.
- Final whistle → shareable recap live in **under 5 minutes** (published as provisional final; league verification updates in place without breaking links).
- Scorer/admin satisfaction **≥8/10** on the tracker experience.
