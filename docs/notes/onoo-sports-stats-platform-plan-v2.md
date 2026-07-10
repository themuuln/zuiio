# Onoo — Product, Market & Commercial Plan (V2)

> **Version:** 2.0 · **Updated:** 2026-07-10 · **Owner:** Temuulen
> **Status:** Decision-ready strategy. The existing Onoo code is a prototype inventory, not proof of pilot or production readiness.
> **Relationship to V1:** This is the forward-looking strategy for work not yet proven in production. It does not undo the original implementation plan; use it to prioritize, harden, validate, and commercialize the work already started.
> **Baseline:** [V1 product plan](./onoo-sports-stats-platform-plan.md) remains the original implementation context.
> **Companion documents:** [implementation specification](./onoo-implementation-spec.md) (v1 prototype blueprint; requires reconciliation before further implementation), [implementation inventory](../../apps/onoo/docs/ROADMAP.md), and [architecture](../../apps/onoo/docs/ARCHITECTURE.md).

## 1. Executive decision

Onoo should **not** launch as another generic public basketball statistics website or assume it is entering an empty market. Mongolia already has public basketball-stat products, and FIBA provides a free LiveStats product to federations and leagues. A public game center, standings, player profile, and box score are therefore table stakes, not a defensible business by themselves.

The business to prove is:

> **Onoo is a system-neutral official-data operations partner: it turns each game into a reliable, reviewable, publishable record—from courtside capture or authorized ingestion, through reconciliation and approval, to a Mongolian-first media, sponsor, and league-data feed.**

This means Onoo may use or integrate an authorized FIBA, Stat.mn, Leagues.mn, or league-operated data source when that is best for the customer. We only ask a league to replace its existing tracker when a paid, measurable workflow gap proves that replacement is worthwhile.

### The next 90-day outcome

Do not fund new fan-app, second-sport, or broad public-site work until all of these are true:

1. A named league has signed a data/right-to-publish agreement and paid a pilot deposit.
2. Four real games have met the quality bar: zero unrecoverable events, 100% correct final score, verified result within 24 hours, and scorer/admin satisfaction of at least 8/10.
3. The pilot proves either an independent Onoo tracker or a partner/integration workflow solves a paid problem that incumbents do not.
4. One season contract or sponsor-backed purchase order follows the pilot.

The existing implementation can accelerate this, but it must first pass the technical-readiness gate in section 9. “Feature exists in source” is not the same as “safe to sell as official.”

## 2. Reality check: the category is active

The previous assertion that there are almost no competitors is not supported by current evidence. Treat the following as incumbents, adjacent partners, and discovery targets—not as products to copy blindly.

| Existing option | Evidence as of 2026-07-10 | Implication for Onoo |
|---|---|---|
| [Stat.mn](https://www.stat.mn/) | Markets league, team, player, season, all-time, and game-stat surfaces; displays 8+ leagues, 70+ seasons, 1,000+ teams, and an advertised hosted league plan at 100,000 MNT/month. | A basic hosted stats site has a visible low-price benchmark. Do not price managed operations like commodity hosting. |
| [Leagues.mn](https://leagues.mn/) | Publishes current schedules, standings, results, box scores, player game logs, sharing, and linked video for Mongolian leagues. | Public athlete pages and live scores are not a unique acquisition wedge. Test whether it can become a portal/distribution partner. |
| [MSports](https://msports.mn/competitions) | Operates consumer web/app distribution across sports and lists the National Basketball Superleague alongside other competitions. | Likely a stronger broadcast, sponsor, and distribution channel than a first direct competitor. Verify its data-entry and commercial model in person. |
| [FIBA LiveStats](https://about.fiba.basketball/en/services/data-and-video-solutions/fiba-live-stats) | FIBA says it is free for federations/leagues and includes real-time collection, game center, API/XML export, and scoreboard/TV integrations. | Never sell “official basketball statistics software” as if no alternative exists. Confirm FIBA compatibility, approval, data rights, and local workflow gaps with the MBA before positioning against it. |

### Required competitor and partner discovery

Within 30 days, meet the MBA/FIBA contact, Stat.mn, Leagues.mn, MSports, two league operators, four scorekeepers, three club general managers, and three potential sponsors. For each live game observed, document:

- Who creates, corrects, verifies, owns, and exports the data.
- Offline behavior, device recovery, handoff, and the final-score reconciliation process.
- Whether a public result has an audit trail and an official approver.
- Current commercial terms, league data rights, sponsor/broadcast requirements, and interoperability.
- The one workflow a buyer would pay to improve now.

Decision tree:

```text
Authorized source already works → offer Onoo ingestion, verification, operations, and distribution.
Authorized source has a paid reliability/workflow gap → pilot Onoo's tracker for that gap.
No buyer will pay for either → partner, narrow the segment, or stop before expanding scope.
```

## 3. Market position and ideal first customer

### Positioning

Use this external promise only after the relevant evidence exists:

> **Every result has a source, a review trail, and a named status—not just a score on a page.**

Do not promise to be “the single source of truth for every Mongolian athlete” at launch. Earn that reputation one verified competition at a time.

### Customer selection criteria

The first customer is not necessarily the most prestigious league. Select the league that scores highest on all of the following:

| Criterion | Minimum evidence |
|---|---|
| Paid operational pain | A buyer states a current data, verification, sponsor, media, or scorer-cost problem and accepts a paid pilot proposal. |
| Decision access | A named operations owner can sign data rights and approve results. |
| Manageable season | A predictable 20–100 game competition with a clear calendar and venue access. |
| Data rights | Written permission for schedules, rosters, results, logos, player media, historical import, and public publication. |
| Operating partner | A lead scorekeeper, backup scorer, and approving official are named before the first game. |
| Commercial path | A pre-agreed conversion price, payment timetable, and renewal conversation exist before pilot kickoff. |

Deprioritize a national top league if it requires replacing an incumbent without a paid gap or if its rights and decision process are unclear. A university, women’s, regional, youth, 3x3, or emerging league can be a better beachhead when it gives Onoo full-season coverage, data rights, and a referenceable result.

### Priority warm route — Space League

Space League is now the first outreach path: its founder has already expressed interest in the app and may be able to unlock league, scorer, media, sponsor, or federation introductions. Public traces establish only that it is an Ulaanbaatar basketball league/community; V2 does not assume its current division, season size, ownership, federation status, or commercial model. Treat the founder's interest as a strong validation signal and an executive-sponsor opportunity—not as a substitute for a signed buyer, data rights, or a tested workflow.

The first founder working session should establish:

1. Whether the founder can approve a pilot, sponsor it, or introduce the person who can.
2. Space League’s calendar, game volume, current data supplier, scorekeeper workflow, and the exact failure/pain it wants fixed.
3. Rights to publish games, rosters, logos, athlete media, historical data, and the conditions for calling a result official.
4. Which introductions would materially help: an approving official, lead scorekeeper, broadcast/media partner, sponsor, and MBA/FIBA contact.
5. A paid or sponsor-backed four-game pilot, conversion price, and a single accountable operations lead.

The best first proposal is the system-neutral pilot in section 8: Onoo may improve the existing authorized source rather than demand immediate replacement, but it must deliver a measurable verified-data outcome.

### Jobs to be done

| Buyer / user | Job they hire Onoo to do | Proof of value |
|---|---|---|
| League operations lead | Run a game-day and post-game data workflow that produces a trusted result on time. | Fewer manual reconciliations, verified box score within SLA, fewer disputes. |
| Scorekeeper | Capture events quickly, recover from connectivity/device failure, and fix an honest mistake safely. | No lost events, low correction effort, trained confidence. |
| Commissioner / approving official | Decide whether a result is provisional, verified, corrected, or official. | Visible review queue, signed revision history, no silent edit. |
| Club GM / coach | Receive reliable opponent and player information without building spreadsheets. | Timely export/report, known provenance, useful scouting decisions. |
| Media / broadcaster / sponsor | Publish accurate live and final information in a reusable format. | Embedded game feed, verified recaps, measured branded deliverables. |
| Athlete / fan | Find an understandable record of a game or career. | Free public profile and game pages after the data is trusted. |

## 4. What makes Onoo defensible

The moat is not raw box-score math. It is the combination of data rights, operational reliability, trusted governance, local workflow, and distribution.

1. **Contracted data rights and season coverage.** A signed league agreement, a complete season, and legitimate historical imports compound in value. Never scrape or republish competitor data without permission.
2. **Provenance and correction governance.** Every public result displays a status badge: “Live provisional,” “League verified,” “Official,” or “Historical import.” A correction creates a visible new revision, never a silent overwrite.
3. **Game-day operating system.** Trained scorer workflow, backup device/paper protocol, sync health, recovery, quality assurance, and a verification SLA are difficult to reproduce with a generic website.
4. **System-neutral interoperability.** Import or normalize authorized FIBA/incumbent feeds, export to media/graphics, and avoid trapping a league. This makes Onoo useful even when it is not the scorer of record.
5. **Mongolian-first distribution.** Local language, name/alias handling, league workflow, sponsor reporting, and payment/registration integrations become differentiated only after the trusted-record layer works.

## 5. Product scope: the pilot product

### Ship and operate for the paid pilot

The smallest sellable vertical slice is one basketball format, one competition, and one complete flow:

1. League/competition, roster, game, venue, scorer, and approving-official setup.
2. Authorized source intake: live event capture **or** source-backed historical/manual box-score import.
3. Durable game journal with visible sync health, one authoritative scorer device, backup/recovery procedure, and a post-game reconciliation checklist.
4. Finalize → review → verify → publish-correction workflow with immutable revision history.
5. A real public game page, simple standings, team/roster page, export, and embeddable final-data feed.
6. A game-operations console for queue health, unverified games, corrections, incidents, and SLA reporting.
7. A minimal data-import tool with source scan/URL, importer, confidence, reviewer, and historical-import label.

### Explicitly defer from the commercial launch

- Dedicated Expo fan app and push notifications.
- Athlete claims, paid athlete profiles, or public DOB by default.
- Advanced analytics, shot charts, lineup analysis, player comparison, and open API.
- Multi-sport engine, registrations, payments, ticketing, fantasy, or betting.
- Ads, speculative sponsorship banners, video hosting, and a broad consumer-growth campaign.

Existing code for these surfaces can remain behind a feature flag or internal demo. It does not set the launch order.

### Product improvements that create a better-than-table-stakes experience

| Capability | Why it matters | Pilot definition |
|---|---|---|
| Provenance badge and revision timeline | Makes trust visible to fans, media, and league leadership. | Every result shows source, status, reviewer, and published revision number. |
| Scorekeeper command center | Protects the most failure-prone moment: a live game. | Sync count, last server receipt, battery/network checklist, backup device, and “need help” incident action. |
| Approved data import | Lets Onoo backfill without violating event-source principles. | A versioned source record feeds derived stats; imported games are never presented as live event capture. |
| Media/sponsor feed | Gives the buyer a business outcome beyond a stats page. | Simple embed/export with named data status and post-game recap inputs. |
| Identity resolution | Prevents duplicate careers from permanently harming the record. | Aliases, reversible merges, redirect URLs, and a reviewed claim/dispute path. |
| League health dashboard | Converts data quality into a renewal conversation. | Coverage, verification time, corrections, incidents, and sponsor/media delivery per season. |

## 6. Data, trust, and operating model

### Non-negotiable record model

The current plan’s event-sourcing intent is right, but manual historical entry must not write derived tables directly. Use a single source model:

| Source type | Stored input | Public label | Correction path |
|---|---|---|---|
| Live play-by-play | Append-only event journal from a named tracker session/device. | Live provisional → verified/official. | Void/replacement event inside a new game revision. |
| Authorized source import | Original source reference/file plus normalized imported event or box-score submission. | Historical import or authorized feed. | New reviewed import version; retain original. |
| Manual backfill | Operator-entered box-score submission with attached source evidence. | Historical import. | New submission/reviewer decision; never silent derived-table edit. |

Derived tables, standings, leaders, and public pages are projections of the approved source/revision. They are rebuildable, not independently editable.

### Required record states

```text
scheduled → live provisional → final pending review → league verified → official
                                      │
                                      └─ correction requested → correction review → next verified/official revision
```

- Only verified/official results contribute to an official career record and official standings. If provisional results appear in standings, label the entire view provisional.
- “Official” is a contractual/league approval status, not a claim of FIBA approval unless that approval is expressly obtained.
- The approving official, reason, before/after revision, and publication timestamp are retained.

### Data and privacy policy before public launch

- Treat DOB, player photo, phone/email, claim evidence, device IDs, and operator/audit data as private by default. Fan pages should read curated public views, not raw event/audit rows.
- Obtain explicit league and player/guardian permission for photos and youth data. Minors require conservative visibility defaults and a guardian-consent path.
- Maintain player aliases, merge history, correction/claim review, appeal, takedown, retention, and data-export processes.
- Write upload ownership, MIME/size limits, moderation, and storage quotas before enabling public media uploads.
- The contract must define league ownership of its operational record, Onoo’s platform IP, and Onoo’s non-exclusive right to host and aggregate data only where permission is given.

### Game-day staffing

Start with one authoritative scorer device. Dual scorekeeper reconciliation is a later feature, not a reason to merge two uncontrolled offline streams in the pilot.

| Role | Before game | During game | After game |
|---|---|---|---|
| League operations lead | Confirms roster, rights, venue, official, and schedule. | Resolves eligibility or schedule issues. | Approves/requests correction and owns season reporting. |
| Lead scorer | Completes device, clock, and roster checklist. | Captures data, monitors sync, follows paper backup procedure. | Finalizes and reconciles with official score sheet. |
| Backup scorer / runner | Holds charged backup device and paper score sheet. | Takes over only under documented handoff procedure. | Signs incident notes if used. |
| Onoo QA | Checks readiness and watches health dashboard. | Responds to incident and verifies data consistency. | Produces quality report and routes review. |
| Approving official | Named before tip-off. | Available for material rule/dispute decisions. | Verifies/officializes within agreed SLA. |

Minimum runbook: device/battery/network check, local journal receipt check, paper fallback, takeover steps, failed-sync escalation, end-of-game reconciliation, correction deadline, and postmortem template.

## 7. Go-to-market: partner first, competitor second

### Phase -1 — discovery and partnership (weeks 1–2)

1. Run the required interviews and observe two to four live games.
2. Complete a feature/workflow teardown of FIBA LiveStats, Stat.mn, Leagues.mn, and MSports—especially data entry, auditability, offline use, rights, exports, and who pays.
3. Ask each relevant incumbent about white-label, ingest, API, revenue-share, or portal-distribution partnerships.
4. Start with the Space League founder as the warm sponsor route; use relevant introductions to observe the real workflow and select the design partner only after it gives a paid problem, named approver, game calendar, and data-rights path.

**Gate:** two prospective buyers name the same paid gap; one signs a letter of intent or pilot agreement. If this does not happen, do not build a clone. Choose a partnership, a different segment, or stop.

### Phase 0 — technical recovery and rehearsals (weeks 3–5)

1. Complete every P0 release blocker in section 9.
2. Import ten licensed historical scoresheets with source evidence and independent review.
3. Run three to five scrimmages, including offline, reload, stale authentication, duplicate submission, device handoff, and correction scenarios.
4. Train the lead scorer, backup scorer, operations lead, and approving official using the runbook.

**Gate:** clean deployment is reproducible; every rehearsal survives the agreed failure modes; every final score matches the official sheet; no data is silently lost or altered.

### Phase 1 — paid four-game proof (weeks 6–8)

Offer a system-neutral “Onoo Official Data Operations Pilot.” If FIBA or an incumbent is the authorized source, Onoo operates reconciliation, verification, publishing, and distribution around that source. If the agreed pain requires it, Onoo runs its own tracker.

Deliverables:

- Roster/game setup and trained operators.
- Four games covered with a source/revision trail.
- Live provisional feed where permitted, final audited box score within 24 hours, export/embed, and pilot quality report.
- Explicit approval before calling any output official.

**Gate:** paid deposit received, zero unrecoverable events, correct final scores, verification SLA met, COGS within target, and a season conversion meeting scheduled before the fourth game.

### Phase 2 — paid full-season reference (one season)

Cover one complete competition—not selected showcase games. Publish a weekly operations report, deliver sponsor/media commitments, run corrections visibly, and capture renewal evidence.

**Gate:** first renewal or sponsor-backed order, 80%+ eligible-game coverage, agreed quality/SLA goals, and positive contribution margin. Only then pursue a second league.

### Phase 3 — repeatable expansion

Add a second and third league using trained league staff in Certified mode. Prioritize a partner channel that reduces sales cost or makes data distribution more valuable. Add league operations, team analytics, and commercial data feeds only when a specific buyer commits.

## 8. Revenue model and price tests

### Revenue sequence

1. **Paid official-data operations** — setup, training, coverage, reconciliation, and verification.
2. **League operations SaaS** — schedules, registrations, rosters, approvals, and support once the trusted record is used daily.
3. **Sponsor-funded official-data package** — branded recaps, verified leaderboards, live-feed placement, and a measured report; not speculative banner inventory.
4. **Club scouting/analytics** — authorized exports, opponent reports, and advanced analysis after data completeness is proven.
5. **Commercial media/broadcast API** — annual-minimum, rate-limited data rights with contracts and attribution.
6. **Payments/ticketing take rate** — only after provider terms, payout responsibilities, and transaction economics are known.

Keep basic athlete and fan records free. Do not charge an athlete for visibility or ranking. A later optional bilingual recruiting dossier or verified media profile can be paid because it creates a distinct, high-stakes outcome.

### Working rate card — validate, do not publish as fixed pricing yet

Stat.mn’s advertised 100,000 MNT/month plan is a hosting benchmark, not a price for courtside labor, verification, or commercial data rights. The following are pilot hypotheses for professional or well-funded leagues; smaller amateur leagues should be partner/referral or self-serve, not subsidized managed coverage.

| Offer | Price hypothesis | Included value | Payment terms |
|---|---:|---|---|
| League-staff pilot | 800,000 MNT | 400,000 MNT training/setup plus four games of QA/platform support at 100,000 MNT each. | 50% prepaid; credited against a season deal signed within 14 days. |
| Managed official-data pilot | 2,000,000 MNT | 600,000 MNT setup/training plus four managed games at 350,000 MNT each. | 50% prepaid; credited against a season deal signed within 14 days. |
| Onoo Certified | 3,000,000 MNT seasonal setup plus 150,000 MNT per official game; 25-game minimum. | League staff capture; Onoo training, QA, verification workflow, public/data feed. | One season minimum; 50% pre-season, 40% at opening, 10% after final reconciliation. |
| Onoo Official | 5,000,000 MNT seasonal setup plus 350,000 MNT per managed game. | Onoo lead scorer, remote QA, recovery/reconciliation, verification SLA. | Same seasonal terms; travel and rented equipment billed at cost. |
| Club scouting, later | 2,000,000–8,000,000 MNT per club/season. | Authorized reports, exports, and opponent analytics. | Annual/seasonal contract. |
| Sponsor/media/API, later | Custom annual minimum. | Rights-controlled verified feed, branded deliverables, or media/graphics integration. | Separate data/sponsor contract. |

The pilot is deliberately **not free**. A discount can be exchanged for a reference, a case study, or a defined non-exclusive licence—never for unbounded scorer labor or ambiguous “we will pay later.”

### Unit economics

Track every game and season with this model:

```text
Revenue = seasonal setup
        + (Certified games × 150,000 MNT)
        + (managed games × 350,000 MNT)
        + sponsor/data licences

COGS = scorer loaded labor + remote QA + travel + device/data depreciation
     + reconciliation/support + payment fees + partner revenue share
```

Commercial guardrails:

- Certified mode target gross margin: at least 70%.
- Managed mode target gross margin: at least 50%.
- Measure actual COGS at or below 50,000 MNT per Certified game and 175,000 MNT per managed game before scaling.
- Collect at least 50% of contractual cash before season opening.
- If dual-entry or external travel is required, reprice; never hide those costs inside a flat hosted-site subscription.

Illustrative formula only: a 239-game season would generate 38.85 million MNT in Certified revenue or 88.65 million MNT in managed revenue under this rate card. These are planning assumptions, not forecasts; scorer labor and league-office willingness to pay must be proven in the paid pilot.

### Deal terms that must exist before the first game

- One-season minimum and payment schedule.
- Permission to use the league, team, player, logo, schedule, historical, media, and result data for the agreed surfaces.
- A clear owner of raw operational data, Onoo platform IP, export rights, and termination/takedown process.
- Definition of “live,” “verified,” and “official”; correction window; escalation contacts; and publication SLA.
- Service scope: who supplies scorer, tablet, connectivity, venue access, backup, travel, and approval.
- Sponsor revenue share only in a separate agreement with measurable deliverables.

## 9. Production-readiness gate for the existing prototype

The current repository contains substantial Onoo source code, but the implementation inventory is not evidence of a deployable product. The following issues were verified during this plan review and are P0 blockers.

| Blocker | Verified condition | Required resolution |
|---|---|---|
| Reproducible database | Tracked migrations include 001–004, 008, and 009, while the functions depend on missing RLS, rollup, and RPC migrations. Migration 009 also references a membership column absent from the tracked base schema. | First compare the hosted migration history with Git. Recover or rebuild one clean migration chain, run a clean reset/seed, regenerate types, and make it CI-required. Do not blindly patch an unknown production schema. |
| Authorization and data isolation | The intended RLS/helper functions are absent from the tracked chain; service-role authorization and polymorphic membership handling are unsafe/incomplete. | Put all record-changing paths behind narrowly scoped authenticated RPCs/Edge endpoints. Enforce role, league, roster, status, sport, period, and idempotency server-side. Add a role-matrix integration test. |
| Official lock and corrections | Direct updates, missing correction records, and contradictory manual box entry can silently change a result. | Add tracker session, immutable event/revision identifiers, correction request/review tables, DB-enforced state transitions, and public revision numbers. |
| Offline promise | The tracker currently behaves as an in-memory queue rather than a durable, reconciled per-game journal. | Persist operations in IndexedDB before network activity; keep acknowledgement state, retry/backoff, recovery after reload, visible sync health, and a single-writer handoff protocol. Test real device failure modes. |
| Real data surfaces | Mock/fallback data and mocked manual-entry flows remain in public/admin paths. | Remove or unmistakably label demo data. A pilot can only use a real schedule → roster → live/final → verified → public box score/standings path. |
| Mobile claims | The app does not type-check cleanly; phone auth/push/PWA claims are not deployable from the tracked configuration. | Defer mobile, athlete claims, push, and PWA marketing. Make web pilot reliable first; reintroduce each surface only after build/type/runtime and operational gates pass. |
| Domain consistency | Current event source, derived tables, types, rules, player identity, and tiebreakers drift from the intended model. | Create a versioned basketball ruleset, source/provenance layer, player aliases/merges, roster/game invariants, and tests based on official scoresheets. |

### Required engineering sequence

1. Freeze product-scope expansion and inventory remote/database state.
2. Restore a clean schema baseline; run reset, seed, generated-type diff, function checks, and RLS tests in CI.
3. Build one secure vertical slice: schedule → roster → assigned scorer → durable live journal → final → verified → real public result.
4. Model undo/edit as explicit void/replacement operations. Preserve client-generated stable IDs and per-session ordering.
5. Run automated unit/property tests plus real-device chaos tests: airplane mode, reload, duplicate event, expired auth, browser sleep, queue recovery, device handoff, finalization, and correction.
6. Add observability for queue depth, sync failures, rejected events, function errors, verification time, realtime latency, and restore drills. Maintain backup/PITR and event-log export procedures.
7. Use three to five supervised scrimmages before any contract game.

No public “official” claim is permitted until this sequence and the pilot quality gate are complete.

## 10. Metrics and decision gates

### Trust and operating metrics

| Metric | Pilot target | Owner/action when missed |
|---|---:|---|
| Unrecoverable event loss | 0 | Stop coverage expansion; incident review before next game. |
| Final score accuracy against official sheet | 100% | Do not publish official result; correct source and root cause. |
| Verified result time | At most 24 hours | Escalate to named approver and publish provisional label. |
| Live update latency | Under 2 seconds where network exists | Measure separately from local capture; improve feed, not data integrity shortcuts. |
| Games started with complete roster/device checklist | At least 95% | Retrain owner/scorer; revise setup workflow. |
| Material correction rate | Declines over pilot and is explained | Review training, UX, source quality, and rule definitions. |
| Admin/scorer satisfaction | At least 8/10 | Interview immediately; do not assume feature requests equal retention. |

### Commercial metrics

| Metric | Gate |
|---|---|
| Paid discovery | Two buyers name the same unmet paid need. |
| Pilot commitment | At least 1,000,000 MNT deposit plus data/right-to-publish terms before field work. |
| Game contribution | COGS stays within the limits in section 8. |
| Conversion | At least one season contract or sponsor-backed purchase order within 14 days of pilot close. |
| Repeatability | First renewal and target margin before adding a second sport or funding a fan-app launch. |
| Distribution | Sponsor/media commitments are measured by delivered verified assets, not speculative views or CPM. |

### Kill, pivot, and partner rules

- **Partner:** An incumbent owns the authorized source but accepts Onoo’s verification, operations, or distribution layer at a profitable revenue share.
- **Narrow:** A segment such as regional, youth, women’s, university, or 3x3 has rights and a paid workflow gap while top leagues do not.
- **Pivot:** Data import/verification, media feed, or league operations proves value while original live capture does not.
- **Stop:** No paid pilot, no contractual data rights, or no buyer names a gap after discovery. Do not compensate with more consumer features.

## 11. Open decisions and owners

| Decision | Evidence needed | Deadline before pilot |
|---|---|---|
| Space League founder route | Founder role, approving buyer, current supplier/workflow, rights path, relevant introductions, and paid/sponsor-backed pilot commitment. | First founder working session; before Phase 0 funding. |
| First design-partner league | Signed buyer, calendar, rights, operations owner, and budget. | Before technical recovery is funded. |
| Build vs integrate | Observed FIBA/incumbent workflow, rights, and paid gap. | End of Phase -1. |
| Scorekeeper model | Four-game cost/time/quality comparison of league-staff vs managed coverage. | Pilot close. |
| Data ownership/licence | Signed contract reviewed for raw data, media, public pages, exports, and termination. | Before importing/publishing data. |
| Brand/name/domain/trademark | Availability and customer reaction; legal check as appropriate. | Before public launch. |
| Youth/athlete identity policy | Consent, guardian, claim/dispute, deletion, and visibility policy. | Before any public youth profile. |
| Payments/ticketing | Provider contract, fees, payout/tax responsibility, and a buyer commitment. | Only after first season renewal. |

## 12. Source and document-control notes

This plan is based on the local implementation review and the public market evidence linked in section 2. Competitor pages and FIBA tooling change; re-run the competitor/partner discovery before pricing is published or a replacement decision is made.

The v1 implementation specification remains useful as a prototype reference, but it contains known mismatches with this strategy and with the current source. It is deliberately not the execution authority until its source model, database, RLS, correction workflow, and acceptance tests are reconciled with sections 5, 6, and 9 of this plan.
