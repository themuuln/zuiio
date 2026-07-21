# Onoo — Product Vision

> **For AI agents:** This document is the outermost layer of the product planning chain. Read it before significant tasks to understand what we're building, why, and what we won't do. Then proceed to `docs/ROADMAP.md` → `docs/tasks/INDEX.md` → the relevant task file.
>
> Decision hierarchy: Vision (this doc) → ROADMAP (what) → task files (how) → conventions (rules) → AGENTS.md (permission boundaries). If unsure, move up a layer.

---

## What We're Building

Onoo is an **athlete-first sports statistics platform** for Mongolian basketball leagues.

The core product is the **public player profile** — anyone (fan, family, scout, teammate) opens a player's page and sees their stats presented beautifully, visually, and creatively. The sidebar includes game results, standings, and league leaders, but the player is always the hero.

Accurate trusted records are the **foundation**, not the destination. The public showcase is the destination.

## Why It Exists

Mongolia has thousands of basketball players — school, university, amateur, semi-pro — but zero stats infrastructure. When a parent wants to see their child's season, they get a WhatsApp message with a photo of a hand-written scoresheet. When a scout looks for Mongolian talent, there's no data. When a league needs sponsors, there's no audience proof.

Onoo exists to make every player's season visible, every game countable, and every league marketable.

## Who It's For

| Audience | Need | Surface |
|----------|------|---------|
| **Players** | See their own stats, share them | Player profile, shareable cards |
| **Families & fans** | Follow the season, understand performance | Player profile, game recaps |
| **Leagues & organizers** | Run the competition, prove audience | Ops console, audience dashboard |
| **Scouts** | Discover talent | English export, player comparison |
| **Sponsors** | Reach engaged audiences | Sponsor placements, audience data |
| **Scorekeepers** | Record games accurately | Tracker, handoff, runbook |

## Design Principles

1. **Athlete-first, always.** The player profile is the heart of the product. Every game tracked exists to make a player's story richer.

2. **Stats as story, not spreadsheet.** Numbers should feel like a highlight reel — visual, animated, shareable. Charts over tables. Badges over footnotes.

3. **Mobile-first, Mongolia-ready.** Every surface works at 360px width. Loads fast on mid-range Android over mobile data. Small images, light JS, no autoplay.

4. **Mongolian-first.** UI copy in Mongolian. Stat labels in Mongolian. Summaries in Mongolian. English is an export view for scouts, not the primary experience.

5. **Cold-start friendly.** Every surface looks intentional with zero games or few games. Empty states are designed, not broken. Small-sample states are honest.

6. **Never gate viewing.** No signup, no login, no app-install prompt on any public surface. Viewing is always free.

7. **Trusted records are non-negotiable.** 100% final-score accuracy. Zero unrecoverable tracker events. Derived tables are rebuildable projections from a journal. The journal is append-only.

## Success Measures

- A non-technical fan can find a player and understand their season in **under 30 seconds**.
- Player pages are **shared organically** (links, screenshots) by players and family.
- **100% final-score accuracy** and **0 unrecoverable tracker events**.
- Final whistle → shareable recap in **under 5 minutes**.
- Scorer/admin satisfaction **≥8/10**.

## What We Won't Do (Frozen Scope)

- **Native mobile app** until the web product is proven (PWA covers mobile for now).
- **Push notifications, follows, or athlete claims** (Phase 3 consumer features, deferred).
- **Unsupported historical imports** (data must go through the tracker or structured CSV import with review).
- **Social features** (comments, likes, direct messages).
- **Non-basketball sports** (Onoo is basketball-only. Other sports are separate products).
- **General-purpose coach/scout tools** beyond stat display. We show the numbers; coaches use their own tools.

## Architecture Principles

### Data flow
```
Tracker (journal) → Events (stat_events) → Commands (cmd_*) → Derived tables (rebuildable)
                                                                      ↓
                                                            Public views (v_public_*)
                                                                      ↓
                                                            Public pages (read-only)
```

### Key rules
- **Append-only journal**: `stat_events` never deletes or rewrites. Corrections use void + replacement with provenance.
- **Curated views for public**: Public pages read `v_public_*` views only. No direct table access.
- **Commands for mutations**: Every write goes through a `cmd_*` Postgres RPC. No direct `.insert()`, `.update()`, or `.delete()` from app code.
- **Derived tables are projections**: `game_player_stats`, `game_team_stats`, `season_player_stats`, `standings` — all rebuildable from the journal.

## Commercial Context

Onoo is currently in a **web-first paid-pilot phase**. Revenue comes from league subscriptions for the tracker + showcase. Sponsorship placements are a planned revenue stream. Consumer monetization is deferred.

The pilot gate model:
| Gate | Criteria |
|------|----------|
| Discovery | Contracted pilot, deposit, one-season agreement |
| Paid proof | 100% accuracy, zero unrecoverable events, <5 min recap |
| Full season | Satisfaction ≥8/10, season contract within 14 days |
| Expansion | Mobile, follows, push, claims — only after renewal |

---

_Last updated: 2026-07-21_
