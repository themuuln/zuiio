---
> **English summary:** Onoo commercial roadmap. Phase 1 ✅ — Trusted data foundation (games, box scores, standings). Phase 2 ✅ — Player profiles (hero, charts, stats). Phase 3 ✅ — Discovery (search, game pages, leaders, awards). Phase 4 🟡 — Academy management (student profiles, payments, group management). Phase 5/6 planned: public API, enterprise features, mobile app. Revenue model: league subscription (paid pilot) + per-game fees. Non-goals: streaming, fantasy, consumer analytics.
---

# Оноо — Сагсан бөмбөгийн үйлдлийн системийн замын зураг

## Арилжааны босго (paid pilot)

Одоогийн бизнес загвар дээр суурилсан босго. Шаардлагатай бол өөрчилж болно:

| Gate | Outcome |
| --- | --- |
| Discovery | Contracted pilot, 1,000,000 MNT deposit, нэг улирлын гэрээ |
| Paid proof | 100% final-score accuracy, 0 сэргээшгүй event, whistle-to-recap < 5 минут |
| Full season | Satisfaction ≥8/10 ба улирлын гэрээ 14 хоногийн дотор |
| Expansion | Native mobile, follows/push, claims — full-season renewal-ын дараа л |

## Horizon A — Лиг эхлэсэн paid proof

Phase 1–7 нь Оноо-ийн одоогийн хэрэгжих замын зураг. Эдгээр нь trusted records, public athlete value, league renewal-ийг батална.

**AI хэрэгжүүлэгчдэд:** үе шат бүрийн execution spec нь `docs/plans/` дотор байна. Энэ roadmap нь юу/яагаад, spec-үүд нь яаж гэдгийг харуулна. Эхлээд `docs/plans/00-conventions.md`, дараа нь тухайн phase-ийн spec-ийг унш.

### Phase 1 — Trusted data foundation (ажиллаж буй)

> Execution spec: [plans/phase-1-trusted-foundation.md](plans/phase-1-trusted-foundation.md)

- [x] `stat_events` journal, ruleset vocabulary, projection rebuild command, authorization cutover.
- [x] Submission review UI, journal durability tests, handoff UI.
- [x] Ops console, integration tests, chaos tests.

### Phase 2 — Player profile as showcase

> Execution spec: [plans/phase-2-player-showcase.md](plans/phase-2-player-showcase.md)

- [x] Roster onboarding kit, consent & takedown, hero identity card.
- [x] Season story arc, shooting profile, career highs & milestones.
- [x] Radar chart, recent games strip, plain-language summaries.
- [x] Report-error intake, season selector & career view, box score below fold.

### Phase 3 — Final-Whistle Pack

> Тоглолт дууссанаас 5 минутын дотор бүх publishable asset бэлэн болно.

- [x] Game recap pages — final score, top performers, lead-change flow.
- [x] Shareable stat cards — тоглогчийн game/season line-ийн зураг.
- [x] Sponsor placements — "presented by" slots.
- [x] Awards & MVP races — shareable award graphics.
- [x] Provisional-final publication — "Урьдчилсан" badge бүхий snapshot.
- [x] Auto Mongolian recap text — deterministic narrative.
- [x] One-click share/download — бүх asset дээр.

### Phase 4 — League proof & renewal

- [x] Embeddable widgets — standings, leaders, schedule.
- [x] English profile view/export — scout-facing toggle.

### Phase 5 — Discovery & organic growth
- [x] **Standings redesign** — zebra rows, sticky header, team color accent, playoff line, streak/last-10 dots
- [x] **Awards & MVP races** — `cmd_grant_award` SECURITY DEFINER function, admin awards page with grant Dialog + list, `getMvpRace` / `getPlayerAwards` in data.ts, `MvpRace` card on leaders, `AwardsShelf` on player page
- [x] **Qualification rules**
- [x] **Home: tonight's games** — live/today/yesterday/standings sections with GameCard components and 20s live polling
- [x] Search & browse — player/team/league-ийг хурдан олох.
- [x] SEO basics — sitemap, metadata, indexable public pages.

### Phase 6 — Live experience

- [x] **Public visibility for provisional games** — `getGamesByDate`/`getGameById` now read from `v_public_live_games` UNION with `v_public_games`. Provisional games show with amber "Урьдчилсан" badge. Live games show scores.
- [x] Live game center — realtime score, on-fire indicator, play-by-play.
- [x] Live-updating player stat lines — Supabase Realtime.

### Phase 7 — Team insights (design-partner beta)

- [x] Efficiency metrics — ORtg, DRtg, NETRTG, PIE, Four Factors, pace.
- [x] Team performance dashboard — offense/defense trends, Four Factors, efficiency chart, per-game advanced stats.
- [x] Player development timeline — month-over-month stat progression (MonthlyProgression on player page).
- [x] Opponent scout card — дараагийн өрсөлдөгчийн нэг хуудас profile (teams/[slug]/scout).

## Horizon B — Баг ба академийн ажиллагаа

> Эдгээр нь стратегийн дараагийн үе шат. Лигийн paid-proof gate ба домайн бүрийн paid discovery pass-ыг давсны дараа л эхэлнэ.

### Phase 8 — Shared basketball organization foundation

- [x] Canonical identity for leagues, clubs, teams, academies, guardians.
- [x] Official roster snapshots, eligibility, transfers, identity disputes.
- [x] One account + least-privilege org roles.
- [x] Private storage, audit, retention, consent, break-glass support.

### Phase 9 — Team operations

- [x] Team staff and role administration.
- [x] Roster intent, availability, transfer requests.
- [x] Training schedule, attendance, facilities.
- [x] Team dues and expense workflows.
- [x] Basketball-specific performance and opponent prep.

### Phase 10 — Academy operations

> Product architecture and delivery plan: [features/academy-management.md](features/academy-management.md)

> Phase 10a нь deliberately minimal: admin dashboard дахь academy info, existing-auth access, basic payments, read-only program/trainer/location display. Enrollment, attendance, consent, offline workflow-ууд дараа орно.
- [x] Academy info in admin dashboard: name, logo, contact, timezone, settings.
- [x] People auth: existing accounts-аар нэвтрээд nav-д "Academy" харагдана.
- [x] Basic payments through shop QPay.
- [x] Read-only program, trainer, location display.
- [x] No enrollment, no attendance, no consent, no offline.

#### Phase 10b — Student & enrollment

- [x] Student profiles with guardian info, medical essentials, photo upload.
- [x] Enrollment management: registration, program assignment, dates.
- [x] Attendance, consent, waivers.
- [x] Multiple children per guardian.
- [x] CSV import/export.

#### Phase 10c — Full operations

- [ ] Offline-safe attendance with IndexedDB queue.
- [ ] Attendance reports by student, offering, coach, date range.
- [x] Payment history and receipts per student.
- [x] Ordered waitlist with promotion rules.

#### Phase 10d — Advanced

- [ ] Guardian OTP, multi-child dashboard.
- [ ] Verified QPay callbacks.
- [ ] Private message threading.
- [ ] Extended reporting: attendance analytics, financial summaries.
- [ ] Private identity-link record.

### Phase 11 — Guardian self-service and commerce experience

- [ ] Guardian self-service, multi-child access, consent history.
- [ ] Registration, invoice/payment history, receipts, refunds, reconciliation.
- [x] Basketball-specific announcements and reminders.
- [ ] Subscription and entitlement model.

## Horizon C — Unified basketball network

> Баг эсвэл академийн модулиуд renew хийж, cross-domain identity/privacy/support metrics батлагдсаны дараа л эхэлнэ.

- [ ] Unified identity across academy, team, league.
- [ ] One consent-filtered athlete timeline.
- [ ] Public athlete story composed from approved records.
