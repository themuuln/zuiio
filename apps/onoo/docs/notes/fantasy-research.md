# Fantasy sports research: Yahoo and comparable-product analysis

*Conducted: 2026-07-21. Full artifacts at `~/.omp/research/2026-07-21-yahoo-fantasy-features-and-similar-sports-fantasy/` (55 sources, 8 workers, 1 round, PROCEED).*

---

## Research plan (decomposition)

The query was decomposed into 8 orthogonal sub-questions, each researched by an independent worker:

| # | Sub-question | Worker focus |
|---|-------------|-------------|
| 1 | Yahoo Fantasy Sports core mechanics | League formats, commissioner controls, scoring types, drafts, waivers, trades, scheduling, playoffs, engagement surfaces |
| 2 | Yahoo Fantasy Basketball specifics | Basketball scoring/category options, roster composition, H2H vs roto, matchup cadence, live stat corrections, playoffs, configurable settings |
| 3 | Comparable season-long fantasy products | ESPN, Sleeper, Fantrax, CBS — differentiation from Yahoo, patterns for an emerging platform |
| 4 | Daily fantasy and pick'em products | DraftKings, FanDuel, Underdog — contest structure, monetization, responsible-play controls, non-money patterns |
| 5 | Fantasy activation and retention design | Private-league invites, draft-room UX, lineup decisions, matchup presentation, notifications, mobile/web role split |
| 6 | Data integrity and operational architecture | Official-stat precedence, game locks, live vs final status, stat corrections, scoring recalculation, audit, trade review, anti-cheat |
| 7 | Mongolia regulatory constraints | 2025 paid-prediction/betting ban, consumer law, data protection, payment/AML, civil capacity, age restrictions |
| 8 | Onoo strategic fit | FIBA analogues, CFL/NBA fantasy patterns, staged product options mapped to Onoo's constraints |

**Source-quality bar:** T1 only (official docs, legislation, peer-reviewed research) for decisive claims. T2 only for corroboration. No T3 (forum/SEO) used as evidence.

---

## Decision-grade TL;DR

1. **Do not build "Yahoo Fantasy in Onoo" now.** Season-long fantasy is not a feature: it's accounts, private-league administration, drafts, rosters, locks, waivers, trades, dispute handling, anti-cheat, and correction-aware scoring. Onoo's trusted-record gates are still in progress.

2. **Do not ship paid-entry, betting, paid-prediction, cash-out, prize-pool, wallet, or cash-equivalent modes.** Mongolia state reporting describes a 2025 ban on paid prediction, betting, and online gambling; the primary statute text was not retrieved. Specialist Mongolian legal counsel is required before any prize-led or paid-adjacent design.

3. **Reuse the operating model, not the full game.** The non-negotiable patterns: authoritative stats over live feeds, explicit provisional→final→corrected lifecycle, deterministic locks, replayable scoring with versioned inputs, visible governance, and append-only event records. These reinforce Onoo's existing architecture.

4. **Earn the right to compete for attention first** — complete trusted records and the athlete showcase; then validate demand with a non-money final-score Pick'Em prototype only after legal, reliability, account, and abuse-policy gates.

5. **Near-term engagement is athlete-first:** richer recaps, game capsules, milestones, leaderboards, and shareability. These align with Onoo's vision without gating public viewing or introducing gambling-adjacent risk.

---

## Key findings by sub-question

### 1. Yahoo core mechanics
Yahoo differentiates Yahoo-administered public leagues from commissioner-run private/custom leagues; documented league size is 4–20 managers. Commissioners configure invites, scoring, rosters, schedules, drafts, keepers, team management, transaction limits, waivers, and FAAB. Exact tooling varies by sport. Formats include H2H Categories, H2H Points, One Win, Rotisserie, Season Points, and Death. Private leagues use draft types including live standard, salary cap, autopick, and offline entry. Waivers can be rolling priority or blind FAAB. Yahoo explicitly says it does not resolve commissioner-manager disputes. [Sources: Yahoo Help S1–S6]

### 2. Yahoo Fantasy Basketball
Default is H2H Points; also H2H Categories, Rotisserie, One Win, Season Points, Death. Default public roster: 16 spots (PG, SG, G, SF, PF, F, 2×C, 2×Util, 3×IL, 3×BN). Default points: PTS=1, REB=1.2, AST=1.5, BLK=3, ST=3, TO=-1. Categories: PTS, REB, AST, ST, TO, BLK, 3PTM, FG%, FT% plus advanced options. Live stats are provisional; corrections processed nightly, normally by 8:00 AM PT; H2H corrections after game-week cutoff are not applied. H2H playoffs support 4/6/8-team brackets, 2- or 3-week schedules. The transferable layer is configurable scoring, eligibility rules, matchup/standings engines, draft/transaction state machines, commissioner authority, and live-score presentation. The non-transferable layer is authoritative player identity, schedules, live feeds, correction ingestion, and the cannot-cut list — all data-ecosystem dependent. [Sources: S7–S14]

### 3. Comparable season-long products
ESPN broadly matches Yahoo for conventional basketball and adds embedded editorial/news. Sleeper basketball is the most differentiated: its default Lock-In mode counts one completed game per player per week, avoiding the unequal-game-count and late-week-streaming problem; it supports redraft/keeper/dynasty, up to 32 teams, multiple draft types. Fantrax and CBS segment via paid commissioner depth (Fantrax Premium $129.95, CBS Commissioner $179.99). For a new platform: conventional configurable scoring/rosters/waivers/FAAB/trades are table stakes; the opportunity is a familiar traditional mode plus Sleeper-like low-maintenance design with transparent, auditable commissioner tools. [Sources: S15–S21]

### 4. Daily fantasy and pick'em
DFS compresses play into a single-sport, single-slate selection with prompt settlement. Underdog pick'em: up to 8 player stat predictions, minimum $1 entry, Flex risk/reward variants, Cash Out. DraftKings Pick6: automatic contest distribution, published prize structures, $1 entry increments, max 150 entries or 3%. FanDuel: 3–6 athlete lineups, perfect-entry multiplier guarantee. Responsibility controls: age/identity/geo confirmation, deposit/entry/wager limits, self-exclusion periods (3mo–10yr), spend/win visibility. Non-money patterns: transparent selection and scoring, live tracking, social competition, streak/badge progression. [Sources: S22–S27]

### 5. Activation and retention
Make joining one-tap (Sleeper shareable league links) with capacity/override controls. The draft is an activation cliff: mock drafts, pre-rank protection, 30-min early room access, commissioner pause/undo/reset. Mobile is for immediate lineup edits and opt-in event alerts; complex commissioner and draft controls are desktop-only. Social competition correlates with higher loyalty and word of mouth, but a three-study mobile experiment found progression cues outperformed social or combined notifications. [Sources: S28–S36]

### 6. Integrity architecture
Official statistics must override live feeds; live scoring is always provisional. ESPN applies correction changes up to 7 days post-game; Yahoo has a known nightly cadence and H2H cutoff. ESPN distinguishes lineup lock (individual game time) from roster lock (first game of period). Trade review: Yahoo requires one-third veto or commissioner review; prize-league decisions are final and unexplained (not a transparency example to follow). Anti-cheat: collusion/malicious-dumping prohibitions, linked-account graph detection with human validation. Event-sourcing architecture (append-only journal, compensating corrections, replayable projections, idempotent consumers) directly matches Onoo's existing design. [Sources: S37–S43]

### 7. Mongolia regulatory
State news reports that 2025 amendments ban "all paid prediction, betting, and online gambling" with criminal liability for organization and administrative liability for promotion. Primary statutory definitions, effective date, fantasy-sports classification, free-prize treatment, and any sports-betting exception were not retrieved — this is a **legal stop sign** not a clearance gap. Consumer law applies to free services. Data law requires lawful purpose-specific consent, security, and constrained foreign transfers. Payment laws reserve instrument/wallet/e-money provision to authorized entities. Civil Code gives 14–18-year-olds partial capacity. A genuinely free, no-cash/no-prize experience is the lowest-risk concept — but even that requires counsel before launch. [Sources: S44–S50]

### 8. Onoo strategic fit
FIBA's analogue is closest: LiveStats records and publishes in real-time with responsive 25+ language Game Center, coach/media reports, and API feeds — but serves as an official-stat provider, not a fantasy operator. FIBA's game-finalization workflow (finish match → post-match edits → finalize) directly validates Onoo's provisional→final lifecycle. CFL and NBA official fantasy demonstrate the full complexity: accounts, leagues, rosters, weekly lineups, sponsors, betting integration. [Sources: S51–S55]

---

## Staged recommendation

### Stage 0 — paid pilot (now)
**Trusted records and public showcase.** No fantasy features. Complete: approved-journal rebuilds, authorization cutover, curated `v_public_*` views, finalization evidence, tracker recovery/chaos tests. Non-goals: play-by-play perfection, native apps, push/follow, claims, social DMs, fantasy accounts, public mock data.

### Stage 1 — after trusted-record gates
**Athlete-first engagement frontend.** Richer recaps, game capsules, milestone badges, shareable stat cards, leaderboards, live provisional scoring, English export. Non-goals: projections, expert content, personalized feeds, user-editable records, prediction games.

### Stage 2 — conditional experiment (only if all gates pass)
**Free final-score/"who won" Pick'Em.** One lock at tip-off, settled from verified final record only, transparent tie/correction policy, minimal account data, published abuse policy. Gates: legal review confirms lawful classification; consistent finalization latency; accounts/abuse/support policy exists. Non-goals: paid entry, cash prizes, odds, salary/cap, daily fantasy, real-money betting, operator-held balances, wallets.

### Season-long fantasy — deferred indefinitely
Private leagues, drafts, weekly lineups, waivers, trades, dynasty/keeper, commissioner governance, and all the above require a separate product decision, security/abuse model, dedicated support plan, and legal review. Do not let the Stage 2 experiment silently expand into full league management.

---

## Open questions for Onoo

1. **Legal:** What is the enacted Mongolian definition of paid prediction/gambling/lottery? Does free-entry sponsor prize or virtual reward fall within scope?
2. **Demand:** Do Mongolian basketball fans want fantasy participation? Would accounts reduce intended public reach?
3. **Readiness:** Can Onoo demonstrate final-score and correction latency/reliability at pilot scale before any settlement feature?
4. **Operations:** Who owns disputes, abuse investigation, account recovery, and commissioner overrides?
5. **Privacy:** What minimal data collection, consent, minor policy, and hosting/processor architecture satisfies Mongolian law?

---

## Sources

Full tiered index: `~/.omp/research/2026-07-21-yahoo-fantasy-features-and-similar-sports-fantasy/sources.md` (55 sources, T1 primary for all decisive claims).
