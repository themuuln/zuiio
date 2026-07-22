---
> **English summary:** Onoo feature catalog — shipped (Phase 1-3): trusted data foundation (box scores, standings, leaders), player profiles (hero cards, charts, season arc, shot charts, game log), discovery (search, game detail pages, scorebar ticker), e-commerce (shop, QPay payments, PDF export), admin (game management, box entry, official stats import from FIBA PDF, team/player CRUD). In progress (Phase 4): academy management. Planned: mobile app, push notifications, fantasy.
---

# Оноо-ийн фичерүүд

> Одоогоор ажиллаж буй, хийсэн, болон төлөвлөсөн бүх фичер.

---

## Шиплэгдсэн — одоогийн live фичерүүд

Эдгээр нь бүтээгдсэн, туршигдсан, production дээр ажиллаж байна.

### Player Profiles

| Фичер | Тайлбар |
|---|---|
| **Hero identity card** | Том профайл карт: зураг, нэр, баг, jersey, position |
| **Season averages** | PPG, RPG, APG, SPG, BPG зэрэг улирлын дундаж |
| **Career highs & milestones** | Career-high, double-double, streak-үүдийг badge хэлбэрээр |
| **Radar vs league average** | Скиллийн shape chart (оноо, самбар, дамжуулалт, хамгаалалт, efficiency) |
| **Recent games strip** | Сүүлийн 5 тоглолтын capsule-ууд, W/L контексттэй |
| **Plain-language summaries** | Монгол хэл дээрх нэг мөрийн game summary |
| **Season selector & career view** | Улирлууд хооронд шилжих болон career view |
| **Full box-score history** | Visual layer-ийн доор бүрэн game log |
| **Report a stat error** | Нийтийн алдааны мэдээ өгөх товч |

### Teams

| Фичер | Тайлбар |
|---|---|
| **Team profile pages** | Багийн нэр, лого, өнгө, рекорд, roster |
| **Roster onboarding** | Bulk roster import, player photo upload, team logo/өнгө |
| **Player placeholder** | Зураггүй тоглогчийн зориулалттай identity төлөв |

### Standings & Leaders

| Фичер | Тайлбар |
|---|---|
| **Leaders visual podiums** | Top-10 stat list-уудыг фото бүхий visual card хэлбэрээр |
| **Standings** | W/L рекордтой league standings |

### Game Tracking

| Фичер | Тайлбар |
|---|---|
| **Tracker events** | Оновчтой play-by-play event capture |
| **Projection rebuilds** | Statistics-ийг raw event-ээс автоматаар гаргана |
| **Tracker durability** | Persist-before-send, reload дараах safe replay, offline queue |

### Trust & Accuracy

| Фичер | Тайлбар |
|---|---|
| **Review workflow** | Event approve/reject/remove workflow |
| **Game-day runbook** | Цаасан fallback-тай үйл ажиллагааны заавар |
| **V2 clean schema** | Бүх table дээр RLS, audit command, tenant isolation |

### Design System

| Фичер | Тайлбар |
|---|---|
| **Dark-first theme** | Near-black canvas, orange primary, purple secondary |
| **Responsive design** | 360px mobile дээр бүрэн ажиллана |
| **Монгол хэлний UI** | Public copy бүхэлдээ Монгол хэл дээр |
| **Cold-start empty states** | Өгөгдөл цөөн үед ч санаатай харагдах төлөв |

---

## In Progress — одоо бүтээгдэж буй зүйлс

| Фичер | Үе шат | Тайлбар |
|---|---|---|
| **Public visibility for provisional games** | Phase 5 | `Урьдчилсан` badge-тэйгээр provisional тоглолт public дээр харагдана |
| **Realtime live game center** | Phase 5 | Live score ба play-by-play realtime шинэчлэгдэнэ |
| **Live player stat lines** | Phase 5 | Тоглолтын явцад тоглогчийн stat line шинэчлэгдэнэ |

---

## Up Next — төлөвлөгдсөн фичерүүд

### Phase 3 — Final-Whistle Pack
_Тоглолт дууссанаас хойш 5 минутын дотор shareable asset-ууд автоматаар бэлэн болно_

| Фичер | Хэмжээ |
|---|---|
| Game recap pages — final score, top performer, lead-change flow | L |
| Shareable stat cards — тоглогчийн тоглолт/улирлын line-ийн export image | M |
| Sponsor placements — “presented by” slots | L |
| Awards & MVP races — shareable award graphics | L |
| Provisional-final publication — "Урьдчилсан" badge бүхий closed snapshot | M |
| Auto Mongolian recap text — deterministic game narrative | S |
| One-click share/download — бүх publishable asset дээр | S |

### Phase 4 — League Proof & Renewal

| Фичер | Хэмжээ |
|---|---|
| Embeddable widgets — standings, leaders, schedule | S |
| English profile view/export — scout-facing toggle, printable record | S |

### Phase 5 — Discovery & Organic Growth

| Фичер | Хэмжээ |
|---|---|
| Search & browse — player/team/league-ийг 2 tap-д олох | M |
| SEO basics — sitemap, metadata, indexable public pages | S |

### Phase 6 — Live Experience

| Фичер | Хэмжээ |
|---|---|
| Live game center — realtime score, play-by-play, on-fire indicators | XL |
| Live player stat lines — Supabase Realtime ашиглан шинэчлэгдэнэ | M |

### Phase 7 — Team Insights (design-partner beta)

| Фичер | Хэмжээ |
|---|---|
| Efficiency metrics — ORtg, DRtg, NETRTG, PIE, Four Factors, pace | M |
| Team performance dashboard — offense/defense trend, Q-by-Q scoring | L |
| Player development timeline — month-over-month stat progression | M |
| Opponent scout card — дараагийн өрсөлдөгчийн profile | S |

---

## Backlog — ирээдүйн чиглэлүүд

### Team Operations (Phase 9)

- Team staff ба role administration
- Operating roster intent, availability, transfer requests
- Training schedule, attendance, facilities
- Team dues ба expense workflow
- Basketball-specific performance ба opponent preparation

### Academy Operations (Phase 10)

- Академийн program, enrollment, attendance, consent
- Guardian portal, multi-child access
- Offline-safe attendance
- Payment history, receipts, waitlist
- Advanced reporting

### Shared Organization Foundation (Phase 8)

- Canonical identity for leagues, clubs, teams, academies, guardians
- Eligibility, transfers, dispute resolution
- Shared commerce ledger
- Least-privilege organization roles

### Unified Athlete Journey (Phase 12)

- Academy + team + competition history-г нэг timeline дээр нэгтгэх
- Consent-filtered athlete timeline
- Combined public athlete story
