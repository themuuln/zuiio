---
title: Shell Design — Main App Tabs
description: 5-tab information architecture for Tamga main app — daily triage, herd registry, care calendar, lineage, marketplace.
---

# Shell Design — Main App Tabs

> IA approved 2026-06-10. Based on research: competing equestrian apps + Mongolian herder daily workflow analysis.

---

## Information Architecture

```
Tab 1: Нүүр      — Daily Command Center ("What needs attention today?")
Tab 2: Морьд     — Herd Registry ("Show me all my horses")
Tab 3: Арчилгаа  — Care Calendar ("What's due, what's done?")
Tab 4: Угшил     — Lineage & Breeding ("Family tree and breeding plan")
Tab 5: Зах       — Marketplace ("Buy, sell, transfer horses")
```

### Why This Order

1. **Нүүр first** — Herder opens app → sees what needs attention. Not navigation, not horse list. Daily triage drives engagement.
2. **Морьд second** — After checking tasks, owner taps into specific horse details.
3. **Арчилгаа third** — Care calendar is the most-used feature day-to-day.
4. **Угшил fourth** — Breeding is seasonal (summer), but culturally important year-round.
5. **Зах last** — Marketplace is transactional, used less frequently.

### What Got Demoted

| Feature | Reason | Where it lives |
|---|---|---|
| Газрын зураг (Map) | GPS hardware not yet available | Horse detail → location card |
| Уралдаан (Races) | Seasonal (summer only) | Арчилгаа → events calendar |
| Баримтын сан (Documents) | Secondary | Horse detail → documents tab |
| Мэдэгдэл (Notifications) | System-level | Push notifications, not a tab |

---

## Tab 1: Нүүр — Daily Command Center

> Primary question: *"What needs my attention right now?"*

### User Jobs

1. **Morning triage** — What's due today? Any emergencies?
2. **Herd health scan** — Which horses are healthy, which need attention?
3. **Event awareness** — What's coming up this week?

### Screen Sections

| Section | Content | Priority |
|---|---|---|
| Weather strip | Location + temp + risk badge (storm, frost, heat) | High — life-or-death in Mongolia |
| Herd health overview | 5-7 horse avatar circles with green/orange/red rings | High — instant visual scan |
| Attention needed | Tasks: overdue vaccines, upcoming farrier, breeding deadlines | High — actionable |
| Upcoming events | Next 2-3 events (races, vet, deadlines) | Medium |
| Recent activity | Last 2-3 actions taken | Low — informational |

### Primary CTA

Tap attention item → horse detail with specific task

---

## Tab 2: Морьд — Herd Registry

> Primary question: *"Show me all my horses and their status"*

### User Jobs

1. **Find a specific horse** — Search or filter by name/breed/status
2. **Assess herd health** — How many healthy vs. need attention
3. **Add new horse** — Camera + form for registration

### Screen Sections

| Section | Content | Priority |
|---|---|---|
| Stats row | Total horses / healthy / need attention | High |
| Search bar | Filter by name, breed, status | High |
| Filter chips | Бүгд / Эрүүл / Анхаарах / Үржүүлэг / Зарах | Medium |
| Horse list | Photo + name + breed + age + health badge | High |
| Floating action | Add new horse (camera + form) | Medium |

### Primary CTA

Tap horse → horse detail profile

---

## Tab 3: Арчилгаа — Care Calendar & Logs

> Primary question: *"What care is due and what's been done?"*

### User Jobs

1. **Daily tasks** — What do I need to do today for each horse?
2. **Log care actions** — Record vaccinations, farrier visits, treatments
3. **Seasonal planning** — What's coming up this season?

### Screen Sections

| Section | Content | Priority |
|---|---|---|
| Season alert | Current season reminder (spring = foaling, winter = body condition) | High |
| Today's tasks | Due today: vaccination, deworming, farrier | High — actionable |
| Calendar strip | 7-day horizontal scroll with event dots | Medium |
| Upcoming | Next 7 days tasks with horse names | Medium |
| Log history | Filterable past care actions | Low — reference |

### Primary CTA

Log new care action

---

## Tab 4: Угшил — Lineage & Breeding

> Primary question: *"What's the family tree and breeding plan?"*

### User Jobs

1. **View pedigree** — Visual family tree (5 generations)
2. **Track breeding status** — Mares in foal, expected dates, heat cycles
3. **Check inbreeding** — Coefficient calculator for planned pairings

### Screen Sections

| Section | Content | Priority |
|---|---|---|
| Family tree | Visual pedigree tree (3-5 generations) | High — visual hero |
| Breeding status | Mares in foal, expected dates, heat cycle tracker | High |
| Inbreeding alert | Coefficient gauge with safe/warning status | Medium |
| Breeding decisions | Suggested pairings, genetic diversity scores | Low — pro feature |

### Primary CTA

Start new breeding record

---

## Tab 5: Зах — Marketplace & Ownership

> Primary question: *"Buy, sell, or transfer horses"*

### User Jobs

1. **Browse horses** — Search listings for sale/stud
2. **List a horse** — Create listing with photos and price
3. **Manage transfers** — Digital ownership certificates

### Screen Sections

| Section | Content | Priority |
|---|---|---|
| Featured listing | Large photo card with price and badge | High — visual hero |
| Listing grid | 2-column cards with photo, name, price | High |
| Filter pills | Бүгд / Зарах / Үржүүлэх / Гэрчилгээ | Medium |
| My listings | Active/sold items with status | Medium |

### Primary CTA

List a horse for sale

---

## Navigation Pattern

### Bottom Tab Bar

```
┌─────────────────────────────────────────┐
│  Нүүр    Морьд    Арчилгаа   Угшил    Зах  │
│  🏠      🐎       📅         🌳      🛍️   │
│  (orange) (gray)   (gray)     (gray)  (gray)│
└─────────────────────────────────────────┘
```

- 5 tabs maximum (research-backed ceiling)
- Active tab: filled icon + orange color
- Inactive tabs: outline icon + gray
- Tab bar: white background, hairline top border #D4CBC8

### Tab Behavior

| Tab | Badge | Badge Color |
|---|---|---|
| Нүүр | Attention count | Orange |
| Морьд | Horses needing care | Red |
| Арчилгаа | Today's task count | Orange |
| Угшил | — | — |
| Зах | New listings | — |

---

## Design System (Shared Across Tabs)

### Colors

| Token | Hex | Use |
|---|---|---|
| Background | #FDF6F3 | All screens |
| Foreground | #2E2D2C | Primary text |
| Primary | #F06A2E | CTA, active tab, selected chips |
| Success | #2D8A4E | Green health badges, completed tasks |
| Muted | #777171 | Secondary text |
| Border | #D4CBC8 | Dividers, card borders |
| Surface | #F1E6E2 | Stat pills, search bar bg |

### Typography

| Style | Size | Weight | Use |
|---|---|---|---|
| Screen title | 28pt | Bold | Tab headers |
| Section title | 20pt | Semibold | Section headers |
| Body | 15-17pt | Regular | Primary text |
| Caption | 12-13pt | Regular | Timestamps, metadata |
| Badge | 11pt | Regular | Horse names under avatars |

### Components

| Component | Style |
|---|---|
| Status dot | 8dp circle, colored border ring |
| Filter chip | Pill shape, outline when unselected, filled when selected |
| Task item | Horse circle + text + checkbox/arrow, hairline divider |
| Card | White bg, 12-16dp radius, thin border, no shadow |
| Tab bar | White bg, 5 tabs, hairline top border |

---

## Research Sources

| Source | Insight |
|---|---|
| Equilab | Ride-centric, health secondary |
| Stablemaster | Task-board home drives daily engagement |
| BarnManager | Horse roster with status badges |
| Horse Manager | Health summary cards dominate home |
| Mongolian herder workflow | Daily health scan, seasonal patterns, weather critical |
| Competing apps analysis | 5-tab ceiling, task-board > horse list for home |

---

## Related

- [Onboarding](./onboarding.md) — 6-screen entry flow
- [Design System](./index.md) — Brand & visual direction
- [Features](../features/index.md) — Feature status table
- [Roadmap](../product/roadmap.md) — Product phases
