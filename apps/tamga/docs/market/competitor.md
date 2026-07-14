---
title: Competitor Analysis — Uyach (Уяач)
description: Deep analysis of Uyach, Mongolia's incumbent horse registry app. Features, pricing, weaknesses, moat, and Tamga's counter-strategy.
---

# Competitor Analysis — Uyach (Уяач)

> Last updated: June 2026. Uyach has been essentially dormant since mid-2023. Their last meaningful feature was statistics in September 2023 — only bug fixes since.

---

## About Uyach

| | |
|---|---|
| **Name** | Uyach (Уяач) — means "trainer/handler" |
| **Website** | uyach.app |
| **Founded** | 2017 |
| **Team** | Small team under Mongol iD Group / Jamiyandorj Purevdorj |
| **Platforms** | iOS + Android (67.3MB APK) |
| **Support** | gmail.com email (solo developer signal) |
| **Last feature update** | September 2023 (statistics module) |
| **Positioning** | Mongolia's only horse registry app |

### What Uyach Is

The default horse management app in Mongolia. Eight years of being the only option has given them brand recognition, institutional partnerships, and a database of registered horses. But they've stopped innovating.

### Uyach's Inferred Tech Stack

| Component | Technology |
|---|---|
| Mobile | React Native or Flutter (cross-platform, single codebase) |
| Backend | Custom server |
| CDN | AWS CloudFront (`d26zsamhptf1gv.cloudfront.net` for images) |
| Website | Next.js (marketing site only — no web app) |

---

## Market Context

### Mongolia's Horse Industry

| Metric | Value |
|---|---|
| **Horses in Mongolia** | 3M+ (outnumber humans) |
| **Human population** | ~3.5M |
| **Child jockeys (2024)** | ~11,000 |
| **Annual races** | 4+ major (Naadam, Ikh Hurd, etc.) |
| **Naadam** | National festival — horse racing is a centerpiece |

### Key Insight

Horses outnumber humans. Every family in rural Mongolia has horses. This isn't a niche market — it's a national utility.

---

## Uyach's 9 Core Modules

### 1. 📋 Horse Registry
- Name, photo, age, sex, brand mark (тамга)
- Auto-increment age yearly
- Basic CRUD

### 2. 🌳 Pedigree / Lineage
- Multi-generational tree view
- Foal list per horse
- Connection to national famous horse database

### 3. 🔒 Privacy Controls
- Per-horse read/edit/delete permissions for other users

### 4. 📊 Reports & Statistics
- Herd structure by age/sex
- Stallion coverage stats
- Income/expense tracking

### 5. 📡 Offline Mode
- Full data entry offline
- Syncs to server when connected

### 6. 🏆 Race Results (цуваа)
- National + Ikh Hurd race rankings
- Tumnii Ex entertainment race recordings

### 7. 📢 Horse Marketplace (зар)
- One-tap listing to app marketplace + Facebook from profile

### 8. 🎽 Race Registration
- Organizers register competing horses
- Jockey insurance purchase integration

### 9. 📷 On-Site Registration Service
- Paid service: specialist photographer visits to register your herd
- Per horse: ₮29,900
- Annual subscription: ₮50,000–₮300,000 + travel

---

## What's Notably Absent

| Missing Feature | Why It Matters |
|---|---|
| ❌ Health records | No vet visits, vaccinations, deworming tracking |
| ❌ GPS / location tracking | Can't locate herd in vast pasture |
| ❌ AI pedigree matching | No breeding suggestions or inbreeding warnings |
| ❌ Training logs | No performance tracking over time |
| ❌ Feed & nutrition tracking | No dietary management |
| ❌ Multi-user team collaboration | No stable manager role |
| ❌ Modern UI | Dated 2017-era design |
| ❌ Web dashboard | Mobile only — limits professional use |
| ❌ Bulk import / CSV upload | Can't migrate data easily |
| ❌ Notifications / reminders | No vet, breeding, or insurance reminders |
| ❌ QPay / card payments | No integrated billing |
| ❌ API | No integrations for race organizers or third parties |

---

## Uyach's Pricing (Annual)

| Tier | Horses | Price/Year | Price/Month Equiv |
|---|---|---|---|
| **Free** | Up to 10 | ₮0 | ₮0 |
| **Starter** | 10–100 | ₮50,000 | ~₮4,167 |
| **Standard** | 100–200 | ₮100,000 | ~₮8,333 |
| **Pro** | 200–500 | ₮250,000 | ~₮20,833 |
| **Enterprise** | 500–1000 | ₮500,000 | ~₮41,667 |

### On-Site Registration (Separate Service)

| Item | Cost |
|---|---|
| Per horse registration | ₮29,900 |
| Annual subscription (included) | ₮50,000–₮300,000 |
| Travel expenses | Added separately |
| **Example: 100 horses** | **~₮3M–3.3M** |

---

## Uyach's Moat (Hard to Replicate Fast)

| Moat | Why It's Hard |
|---|---|
| ⚠️ National famous horse database | Years of community-contributed pedigree data |
| ⚠️ MMSUH partnership | Official endorsement from Mongolia's horse breeders union |
| ⚠️ Race result data | Naadam/Ikh Hurd results — requires institutional relationships |
| ⚠️ Insurance integration | Signed agreement with MIG Daatgal |
| ⚠️ Brand trust | 8 years of "default" status |

### Partners (Institutional Credibility)

Capital Insurance · MAKS · TVMNii (TV) · SVV · MIG Daatgal · MMSUH (Horse breeders union) · Golden Stud · Cavalor · ARD · Moriton

---

## Critical Weaknesses to Exploit

### 1. Stagnant Development
No features since mid-2023. Only bug fixes. For an app serving 3M+ horses in a rapidly digitizing country, this is a massive gap.

### 2. Outdated UI/UX
2017 design language. Feels old compared to modern apps. Users who use Telegram, super apps, or any modern Mongolian app will notice the difference.

### 3. No Health Records
The most critical gap. Every serious breeder needs vaccination tracking, deworming schedules, vet visit logs. Uyach has zero of this.

### 4. No Web Version
Mobile only. Professional breeders, stables, and race organizers need desktop access for reports, bulk operations, and management.

### 5. Solo Developer Risk
gmail.com support email. Small team. Single point of failure for a national utility.

### 6. No Payment Integration
Unclear subscription management. No QPay/SocialPay. Friction for users trying to pay.

### 7. No AI Features
Zero ML/AI capabilities. No breeding suggestions, no inbreeding warnings, no smart recommendations.

---

## Tamga's Counter-Strategy

### GTM Principles

1. **Don't out-data them on pedigrees day one.** Their famous horse database and 8 years of community data is the real moat. Don't attack it directly.
2. **Enter via health & vet tracking.** Zero competition here. Every breeder needs it. Once users log vet visits in Tamga, herd data migration follows naturally.
3. **Target progressive breeders and race organizers first.** They talk, they influence, they're on social media. They'll become evangelists.
4. **Launch before Naadam (July).** Peak horse activity, peak demand, peak organic discovery.

### Early Wins

| Action | Why |
|---|---|
| ✅ Partner with 1–2 aymag horse breeder associations | Don't go after MMSUH (they're with Uyach) — go grassroots |
| ✅ Free Uyach data migration tool | Lower switching cost dramatically |
| ✅ Target Facebook equestrian groups | Huge in Mongolia — organic growth engine |
| ✅ Launch before Naadam (July) | Peak visibility |
| ✅ Free health records module | Uyach has nothing here — easy win |

### Feature Comparison Matrix

| Feature | Uyach | Tamga (Planned) |
|---|---|---|
| Horse registry | ✅ | ✅ |
| Pedigree tree | ✅ | ✅ (better UI) |
| Health records | ❌ | ✅ ← **Entry point** |
| Offline mode | ✅ | ✅ |
| Modern UI | ❌ | ✅ |
| Web dashboard | ❌ | 🔜 (Phase 3) |
| AI breeding advisor | ❌ | ✅ |
| GPS herd tracking | ❌ | ✅ |
| Smart reminders | ❌ | ✅ |
| QPay/SocialPay | ❌ | ✅ |
| Bulk import | ❌ | ✅ |
| Race registration | ✅ | ✅ (Phase 3) |
| Marketplace | ✅ | ✅ |
| Multi-user/collab | ❌ | ✅ |
| API | ❌ | ✅ (Phase 5) |
| On-site registration | ✅ (paid) | ✅ (Phase 2) |
| Insurance integration | ✅ (MIG) | 🔜 |

### Pricing Comparison

| Feature | Uyach | Tamga Free | Tamga Pro (₮9,900/mo) | Tamga Breeder (₮24,900/mo) |
|---|---|---|---|---|
| Horse records | ✓ (up to 10) | 1 horse | Unlimited | Unlimited |
| Health records | ✗ | Basic | Full + analytics | Full + AI alerts |
| Breeding tools | ✗ | ✗ | ✗ | Inbreeding calc + gestation |
| Digital certificates | ✗ | ✗ | ✗ | ✓ |
| Offline mode | ✗ | Read-only | Full | Full |
| Smart reminders | ✗ | ✗ | ✓ | ✓ |
| Marketplace | ✓ | Browse only | Featured listing | Verified + featured |
| Price/yr | ₮50,000–500,000 | ₮0 | ₮99,000 | ₮249,000 |

**Strategy:** Tamga wins on features Uyach doesn't have (health, breeding, offline, certificates). Uyach's advantage is their horse database and institutional partnerships — don't attack that directly.

---

## Sources

- [Uyach App Store](https://apps.apple.com)
- [Uyach Google Play](https://play.google.com)
- [Uyach APK](https://apkpure.com)
- [Mongolian Horse Racing - View Mongolia](https://www.viewmongolia.com)
- [Global Voices - Mongolia Horse Racing](https://globalvoices.org)
- [Mongol Derby](https://en.wikipedia.org/wiki/Mongol_Derby)
- [Discover Mongolia](https://www.discovermongolia.mn)

---

## Related

- [Product](./product.md) — Tamga's feature inventory and positioning
- [Marketing](./marketing.md) — GTM strategy and launch plan
- [Finance](./finance.md) — Revenue model and pricing strategy
- [Pricing](./pricing.md) — Detailed pricing psychology
