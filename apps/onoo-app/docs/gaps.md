# Onoo — Feature Gaps & Competitive Analysis

> Created: 2026-07-31
> Source: Deep research run — 5 parallel workers, 63 sources (54 T1). Full report at `~/.omp/research/2026-07-31-tolom-zer-onoo-competitor-research/synthesis.md`
> Scope: Sports analytics, basketball stats, fan engagement

---

## Product Context

Onoo (Оноо = score/point in Mongolian) is a React Native/Expo mobile app for Mongolian basketball fans. Current features include live game scoring, player profiles, team profiles, standings, and leaders. Built on FIBA-standard statistics infrastructure.

---

## 🛑 Critical Competitive Landscape

### International Competitors (10 researched)

| Platform | Type | Pricing | Onoo Gap |
|----------|------|---------|----------|
| **GameChanger** | Mass-market scoring + streaming + highlights | Free (coaches) - $24.99/mo (parents) | Video/streaming missing |
| **Hudl** | Pro video analysis + stats | $400-$2,100/yr per team | Video + AI tagging missing |
| **FIBA LiveStats** | Official FIBA stats tool | Free (federations/leagues) | Mobile app (it's Windows-only) |
| **MaxPreps** | HS sports records + stats | Free / $600/season Advantage | League management missing |
| **SportsEngine** | Org management platform | $696-$2,199/yr | Team management missing |
| **SofaScore** | Live scores consumption | Free + in-app purchases | Data creation/team features missing |
| **TeamSnap** | Team comms + management | $0-$25.99/mo | Team management missing |
| **Hooper** | AI video analytics (mobile) | $11.99/mo (10hr video) | AI features missing |
| **Squadline** | Instagram-style team feed | Free | Social/community missing |

### Local Mongolian Competitors

| Platform | Type | Strengths | Onoo Advantage |
|----------|------|-----------|----------------|
| **BasketMN** (Chandmani Tech) | News + stats app (5K+ downloads) | First mover, existing users | Onoo has deeper FIBA-stats infra |
| **STAT.mn** | League stats platform (subdomains) | League websites, iOS app | Onoo has mobile + consumer focus |
| **Msports** | General sports hub | Training, facilities, booking | Onoo is basketball-specific |
| **MBA** (mongolia.basketball) | Official league hub | Authority, ticketing | Onoo is independent platform |

---

## 🔴 P0 — Critical Gaps

### 1. QPay Payment Integration (❌ Missing)

**Why:** ~45% of Mongolian digital payments flow through QPay. Without it, Onoo cannot sell merchandise, tickets, or premium features.

**Effort:** 2-3 weeks (integrate QPay API for in-app purchases, ticket sales)

---

### 2. Video / Live Streaming (❌ Missing)

**What competitors do:** GameChanger streams HD 1080p + auto-highlights from one phone. Hudl provides video-to-stat linking. MaxPreps Advantage offers film breakdown.

**Current state:** Onoo has rich stats data but zero video capability.

**Opportunity:** Mongolia has live streaming infra (Central Stadium 360 on AWS IVS). MBL games already streamed via Spot Sports. Onoo could offer Mongolian-focused streaming + stat overlay.

**Effort:** 6-8 weeks

---

### 3. Auto-Generated Highlight Clips (❌ Missing)

**What competitors do:** GameChanger creates highlight clips for every scoring play automatically. These are shareable, drive engagement.

**Current state:** No video → no highlights.

**Effort:** Bundled with video infrastructure.

---

### 4. Social / Community Features (❌ Missing)

**What competitors do:** GameChanger has basic chat. Squadline has Instagram-style team feeds. Hooper has Friends area. All drive retention through community.

**Opportunity:** Facebook reaches 75%+ of Mongolian internet users. Telegram is dominant for business messaging. Onoo could integrate Mongolian-specific social features — stat card sharing, game predictions, fan leaderboards, Telegram bot for live scores.

**Effort:** 3-4 weeks for basic sharing + Telegram bot

---

### 5. Season / Competition Selector (❌ Missing)

**What competitors do:** 3/4 visual competitors (NBA, Basketball Reference, FIBA) have this.

**Current state:** Onoo likely shows only current season without selector.

**Effort:** 1-2 weeks (frontend only — no DB changes)

---

### 6. Multi-Category Leaderboard Strip (❌ Missing)

**What competitors do:** All 3 visual competitors (NBA, FIBA, MaxPreps) show points, rebounds, assists as a horizontal strip.

**Current state:** Onoo's leaderboard likely shows one category at a time.

**Effort:** 1-2 weeks (frontend only — no DB changes)

---

## 🟡 P1 — Competitive Gaps

### 7. Team Management Features (❌ Missing)

**What you need:** Roster management, schedule, coach messaging, RSVPs. TeamSnap and SportsEngine dominate this category.

**Priority:** Medium — Onoo's initial focus is fan/consumer, not team admin. But future B2B league management requires this.

---

### 8. Merchandise / Ticketing / Commerce (❌ Missing)

**What sports apps do:** NBA app has League Pass + merch + tickets. GameCharger has Team Pass subscriptions. Onoo has no revenue mechanism.

**Opportunity:** Onoo's Zer connection (same monorepo, shared @zuiio packages) makes adding a merch shop relatively easy — product/inventory/order infrastructure exists in Zer.

**Effort:** 4-6 weeks (after QPay integration)

---

### 9. AI Features (❌ Missing)

**What competitors do:** Hudl Assist uses AI for stat tagging. Hooper uses AI computer vision for auto-tracking (92% accuracy). Genius Sports has AI optical tracking for FIBA (12 iPhones).

**Opportunity:** No competitor does Mongolian-language AI. Onoo could differentiate with AI-generated Mongolian play-by-play, stat summaries, or player performance predictions.

**Priority:** Medium — AI is not yet table-stakes in Mongolian sports, but trend is clear.

---

### 10. Native Mobile App Polish (🟡 In Development)

**Current state:** Onoo is React Native/Expo — in development. BasketMN and STAT.mn are in production with real users (5K+ downloads for BasketMN).

**Priority:** Polish and ship mobile app as P0 before adding new features.

---

## 🟢 P2 — Future Differentiation Opportunities

| Feature | Opportunity |
|---------|-------------|
| **Telegram bot for live scores** | Mongolian sports fans use Telegram heavily; bot pushes game updates |
| **Stat card sharing (Facebook/Instagram)** | Virality driver — make stats beautiful and shareable |
| **Fan leaderboards / predictions** | Gamification drives daily active usage |
| **League management B2B SaaS** | Tournament bracket, team registration, referee assignment |
| **Sponsorship platform** | Embed branding in stat cards — potential revenue source |

---

## Updated Comparison Matrix

| Feature | Onoo | BasketMN | STAT.mn | GameChanger | Hudl | FIBA LS |
|---------|------|----------|---------|-------------|------|---------|
| Live Scoring | ✅ | ✅ | ✅ | ✅ (best) | ❌ (video) | ✅ (desktop) |
| FIBA-Standard Stats | ✅ | ❓ Partial | ✅ | ⚠️ Basic | ❌ | ✅ (gold) |
| Player Profiles | ✅ | ✅ | ✅ | ⚠️ Basic | ✅ | ❌ |
| Standings/Leaders | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Video/Highlights | ❌ Missing | ❌ | ❌ | ✅ (core) | ✅ (core) | ❌ |
| Live Streaming | ❌ Missing | ❌ | ❌ | ✅ | ✅ Gold | ❌ |
| Social/Community | ❌ Missing | ⚠️ News | ❌ | ❌ Basic | ⚠️ Basic | ❌ |
| Team Management | ❌ Missing | ❌ | ❌ | ✅ | ✅ Hub | ❌ |
| Mobile App | 🟡 Dev | ✅ Android | ✅ iOS | ✅ Both | ✅ Both | ❌ Win |
| Mongolian Lang | ✅ Native | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI Features | ❌ | ❌ | ❌ | ❌ | ✅ Assist | ⚠️ Genius |
| Commerce | ❌ Missing | ❌ | ❌ | ❌ Paid plans | ❌ | ❌ |
| Pricing | TBD | Free | Unknown | Free-$24.99/mo | $400-$2,100/yr | Free (fed) |

---

## Recommended Build Order (First Ship)

1. **🔴 Season selector + leaderboard strip** (1-2 weeks — quick frontend wins, zero DB changes)
2. **🔴 Polish mobile app** (2-4 weeks — must ship before promoting)
3. **🔴 QPay integration** (2-3 weeks — enables any commerce; blocks revenue)
4. **🟢 Social sharing — stat cards** (1-2 weeks — virality driver on Facebook/Telegram)
5. **🟢 Telegram bot for live scores** (1-2 weeks — meets Mongolian users where they are)
6. **🟡 Basic live streaming + auto highlights** (6-8 weeks — biggest differentiation gap)
7. **🟡 Community features** (fan leaderboards, game chat — 3-4 weeks)
8. **🟡 Merch shop (via Zer connection)** (4-6 weeks — first revenue mechanism)

## Monetization Strategy (Mongolia-Specific)

Mongolian sports fans will NOT pay $400/yr (Hudl pricing). Think:

- **Sponsorship**: League/team sponsors pay for branded stat cards and leaderboards
- **Merch**: Small markup on physical goods via Zer integration
- **Premium features**: Ad-free, advanced stats, downloadable highlights — MNT 10-20K/mo
- **B2B league SaaS**: Tournament management fees for leagues using Onoo
