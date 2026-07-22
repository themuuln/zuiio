# Onoo Features

> Everything Onoo can do today, what's being built, and what's planned.

---

## Shipped — Live Features

These features are built, tested, and running in production.

### Player Profiles

| Feature | Description |
|---------|-------------|
| **Hero identity card** | Jersey number, position, team colors, season averages as large animated stat numbers |
| **Season story arc** | Game-by-game PTS/REB/AST trend charts with area fill and per-game tooltips |
| **Shooting profile** | FG/3P/FT split visualized as radial gauges |
| **Career highs & milestones** | Auto-detected career-high points, double-doubles, streaks as achievement badges |
| **Radar vs league average** | Skill shape chart (scoring, rebounding, playmaking, defense, efficiency) |
| **Recent games strip** | Last-5 game capsules with W/L context and standout stat per game |
| **Plain-language summaries** | Auto-generated Mongolian one-liners ("Career-high 24 points on 60% shooting") |
| **Season selector & career view** | Multi-season aggregation with clear season-vs-career toggle |
| **Full box-score history** | Complete game log, one tap below the visual layer |
| **Report a stat error** | Public intake button → feeds the correction queue |

### Teams

| Feature | Description |
|---------|-------------|
| **Team pages** | Roster grid of mini player cards with team identity (colors, form guide) |
| **Roster onboarding** | Bulk roster import, player photo upload, team logos and colors |
| **Player placeholder** | Designed identity for players without photos |

### Standings & Leaders

| Feature | Description |
|---------|-------------|
| **Leaders visual podiums** | Top-10 stat lists as visual cards with player photos |
| **Standings** | League standings with W/L records |

### Game Tracking

| Feature | Description |
|---------|-------------|
| **Live game tracking** | Mobile-first tracker with offline support (IndexedDB journal) |
| **Event journal** | Append-only play-by-play recording with idempotent replay |
| **Box score derivation** | Automatic per-player and per-team stats from raw events |
| **Tracker durability** | Persist-before-send, safe replay after reload, offline queue |

### Trust & Accuracy

| Feature | Description |
|---------|-------------|
| **Evidence-backed submissions** | Revisioned approval/correction workflow with source tracking |
| **Verified projections** | Stats rebuilt from approved revisions only |
| **Authorization cutover** | Every mutation goes through scoped commands — no direct browser writes |
| **Game-day runbook** | Documented procedures with paper fallback |
| **V2 clean schema** | RLS on every table, audited commands, tenant isolation |

### Design System

| Feature | Description |
|---------|-------------|
| **Dark-first theme** | Near-black canvas, orange primary, purple secondary |
| **Responsive design** | Every surface works at 360px mobile width |
| **Mongolian-first UI** | All public copy in Mongolian |
| **Cold-start empty states** | Intentional design for zero-game / low-data scenarios |

---

## In Progress — Being Built Now

| Feature | Phase | Description |
|---------|-------|-------------|
| **Ruleset-bound vocabulary** | 1 | Event dictionary validates against each game's ruleset |
| **Tracker handoff UI** | 1 | Controlled lead-to-backup scorer transfer with session locking |
| **Ops console** | 1 | Admin telemetry: tracker health, journal lag, pending reviews |
| **Consent & takedown** | 2 | Publication consent for minors, removal/anonymization process |
| **Integration + chaos tests** | 1 | DB integration tests, network-kill tracker recovery tests |

---

## Up Next — Planned Features

These are scoped and specified, ready to build once current work completes.

### Phase 3 — Final-Whistle Pack
_Automatic publishable assets within 5 minutes of game end_

| Feature | Effort |
|---------|--------|
| Game recap pages — final score, top performers, lead-change flow | M |
| Shareable stat cards — downloadable player stat images with sponsor branding | M |
| OG images — auto-generated social cards for player pages and games | M |
| Sponsor measurement contract — placement IDs, impression events | L |
| Sponsor placements — "presented by" slots on every surface | L |
| Awards & MVP races — automated Player of the Week / season MVP | L |
| Provisional publication — closed-snapshot with "Урьдчилсан" badge | M |
| Auto Mongolian recap text — deterministic game narrative | S |
| One-click share/download for every publishable asset | S |

### Phase 4 — League Proof & Renewal
_Give leagues the evidence to renew and sell sponsors_

| Feature | Effort |
|---------|--------|
| League audience dashboard — views, shares, impressions per game | L |
| Sponsor intelligence report — per-sponsor impression summary (PDF) | M |
| Season report PDF — downloadable team season summary | M |
| Monthly league report — automated email summary | M |
| Embeddable widgets — live standings, leaders, schedule for any website | S |
| English profile view/export — scout-facing toggle and printable record | S |

### Phase 5 — Discovery & Organic Growth

| Feature | Effort |
|---------|--------|
| Standings redesign — form guide, movement indicators, team-color rows | M |
| Player comparison — side-by-side visual duel with radar overlay | M |
| Search & browse — find any player/team/league in two taps | M |
| SEO basics — sitemap, metadata, indexable public pages | S |

### Phase 6 — Live Experience

| Feature | Effort |
|---------|--------|
| Public visibility for provisional games (with badge) | M |
| Live game center — real-time score, play-by-play, on-fire indicators | XL |
| Live player stat lines — updating during games via Supabase Realtime | M |

### Phase 7 — Team Insights (design-partner beta)

| Feature | Effort |
|---------|--------|
| Efficiency metrics — ORtg, DRtg, NETRTG, Four Factors | L |
| Team performance dashboard — rating trends, splits, hot/cold players | L |
| Player development timeline — month-over-month stat progression | M |
| Opponent scout card — auto-generated profile from public data | M |

---

## Backlog — Future Horizons

These are researched and strategically important but not yet scheduled.

### Team Operations (Phase 9)

| Feature | Notes |
|---------|-------|
| Team staff and role administration | |
| Operating roster, availability, transfers | |
| Training schedule, attendance, facilities | |
| Team dues and expense workflows | |

### Academy Operations (Phase 10)

| Feature | Notes |
|---------|-------|
| Academy info in admin dashboard | Phase 10a — minimal MVP |
| Student profiles with guardian info | Phase 10b |
| Enrollment management, capacity tracking | Phase 10b |
| Attendance with offline support | Phase 10c |
| Consent & waivers — versioned templates, digital signing | Phase 10c |
| Invoice ledger and payment history | Phase 10c |
| Guardian self-service, multi-child dashboard | Phase 10d |
| QR check-in/out, multi-location scheduling | Phase 10d |

### Shared Organization Foundation (Phase 8)

- Canonical identity for leagues, clubs, teams, academies, guardians
- Cross-organization eligibility, transfers, dispute resolution
- Shared commerce ledger and payment provider
- Least-privilege organization roles and navigation

### Unified Athlete Journey (Phase 12)

- Compose academy development + team participation + competition history
- One consent-filtered athlete timeline
- Age-of-majority transitions and takedown workflows

### League & Federation Network (Phase 13)

- Cross-organization competition registration and eligibility
- Federation governance and audit reporting
- Tournament and camp operations

### Frozen — Retail Shop

_Not actively developed — revisit after Phase 4_

- Public merchandise catalogue and product detail pages
- QPay invoice → QR → verified callback → paid order flow
- Product variants, inventory reservation, private orders

---

## Deferred

These are important but explicitly deferred during Horizon A (league-first paid pilot):

- Native mobile app (Expo / React Native)
- Follows and push notifications
- Athlete claims and phone OTP
- Unsupported historical data imports
- Social features (comments, likes, direct messages)

---

_Last updated: 2026-07-22_
