# Onoo — Product Vision

> **For AI agents:** This document is the outermost layer of the product planning chain. Read it before significant tasks to understand what we're building, why, and what we won't do. Then proceed to `docs/ROADMAP.md` → `docs/tasks/INDEX.md` → the relevant task file.
>
> Decision hierarchy: Vision (this doc) → ROADMAP (what) → task files (how) → conventions (rules) → AGENTS.md (permission boundaries). If unsure, move up a layer.

---

## What We're Building

Onoo is the **complete basketball operating system** for Mongolian leagues, clubs, teams, academies, athletes, and families.

It connects the full basketball lifecycle: organizations and membership, competitions and schedules, team and academy operations, trusted game records, player development, payments, and public discovery. Onoo remains basketball-specific rather than becoming a generic ERP or multi-sport platform.

The core public experience is the **athlete profile**. It composes approved competition and development records into one trusted basketball identity that players, families, fans, scouts, and sponsors can understand and share.

Accurate trusted records are the foundation. Useful daily operations create the data. The athlete’s complete basketball story is the destination.

## Why It Exists

Mongolian basketball is fragmented across paper scoresheets, spreadsheets, chat groups, bank-transfer screenshots, and disconnected league tools. Players lose their history between academies, teams, and competitions. Team staff repeat roster and payment work. Leagues cannot produce trusted records or audience proof.

Onoo exists to give every basketball organization one operational system, every game a trusted record, and every athlete a continuous story from development to competition.

## Who It's For

| Audience | Need | Surface |
| --- | --- | --- |
| **Players** | Keep one identity across development and competition | Athlete profile, timeline, shareable cards |
| **Families and fans** | Register, pay, follow, and understand progress | Guardian operations, athlete profile, game recaps |
| **Teams and clubs** | Manage rosters, staff, training, logistics, and performance | Team operations |
| **Academies and coaches** | Manage programs, enrollment, consent, attendance, and development | Academy operations |
| **Leagues and federations** | Run competitions, govern eligibility, and prove audience | League operations, audience dashboard |
| **Scorekeepers and officials** | Record and verify games accurately | Tracker, review queue, runbook |
| **Scouts** | Discover talent through trusted history | English export, athlete comparison |
| **Sponsors** | Reach measurable basketball audiences | Sponsor placements, audience data |

## Design Principles

1. **Athlete-first, end to end.** League, team, and academy workflows exist to improve basketball operations and build one trustworthy athlete story.

2. **Stats as story, not spreadsheet.** Numbers should feel like a highlight reel — visual, animated, shareable. Charts over tables. Badges over footnotes.

3. **Mobile-first, Mongolia-ready.** Every surface works at 360px width. Loads fast on mid-range Android over mobile data. Small images, light JS, no autoplay.

4. **Mongolian-first.** UI copy in Mongolian. Stat labels in Mongolian. Summaries in Mongolian. English is an export view for scouts, not the primary experience.

5. **Cold-start friendly.** Every surface looks intentional with zero games or few games. Empty states are designed, not broken. Small-sample states are honest.

6. **Never gate viewing.** No signup, no login, no app-install prompt on any public surface. Viewing is always free.

7. **Trusted records are non-negotiable.** 100% final-score accuracy. Zero unrecoverable tracker events. Derived tables are rebuildable projections from a journal. The journal is append-only.

## Success Measures

### Platform outcomes

- One athlete keeps a continuous, consented identity across academy, team, and league participation.
- League, team, and academy operators complete their core basketball workflows without parallel spreadsheets.
- Every confirmed payment, roster decision, game result, and consent action has an accountable source record.
- Private organization, guardian, medical, and payment data never leaks into public composition.
- Each paid module renews because it removes measurable operational work or revenue leakage.

### Current league paid proof

- A non-technical fan finds an athlete and understands their season in **under 30 seconds**.
- Athlete pages are **shared organically** through links and screenshots.
- **100% final-score accuracy** and **0 unrecoverable tracker events**.
- Final whistle to shareable recap takes **under 5 minutes**.
- Scorer and administrator satisfaction is **at least 8 out of 10**.

## Current sequencing boundaries

The complete-product direction does not authorize every module at once.

- **Trusted records first.** Finish the current league paid-pilot foundation before academy or team operations consume committed engineering capacity.
- **Web first.** Native mobile waits until measured browser limitations justify it.
- **No unsupported imports.** Historical data enters through reviewed tracker, command, or structured-import workflows.
- **No unmoderated social network.** Comments, likes, and direct messages require a separate safety and moderation decision.
- **Basketball only.** Other sports remain separate products.
- **No generic ERP scope.** Build basketball-specific team, league, academy, athlete, payment, and communication workflows only.
- **Measured expansion.** Push, follows, claims, messaging, and public development metrics enter through explicit commercial, privacy, and safety gates.

## Architecture Principles

### Product domains

```text
Shared identity and organizations
  ├─ League and competition operations
  ├─ Team and academy operations
  ├─ Trusted game records and statistics
  ├─ Payments and provider workflows
  └─ Athlete and public experiences
```

Each domain owns its source records. Cross-domain surfaces compose versioned, authorized projections rather than rewriting another domain’s data.

| Record or decision | Authoritative domain |
| --- | --- |
| Users, organizations, teams, memberships, and canonical athlete identity | Identity and organizations |
| Competition entries, eligibility, official roster snapshots, and schedules | League operations |
| Team staff, roster intent, availability, training, and logistics | Team operations |
| Programs, enrollment, guardians, consent, and training attendance | Academy operations |
| Invoices, payment events, refunds, settlement, and provider reconciliation | Commerce |
| Official game events, revisions, statistics, and standings | Trusted game records |
| Combined athlete timelines and public pages | Read-only composed projections |

### Trusted-record data flow

```text
Tracker (journal) → Events (stat_events) → Commands (cmd_*) → Derived tables (rebuildable)
                                                                      ↓
                                                            Public views (v_public_*)
                                                                      ↓
                                                            Public pages (read-only)
```

### Key rules

- **Canonical identity**: Organizations, teams, users, and athletes use shared identifiers with explicit scoped memberships.
- **Bounded authority**: League, team, academy, payment, and public domains declare their source of truth and mutation owner.
- **Append-only journal**: `stat_events` never deletes or rewrites. Corrections use void plus replacement with provenance.
- **Curated views for public**: Public pages read `v_public_*` views only. No direct table access.
- **Commands for mutations**: Every write goes through a reviewed command. No direct client insert, update, or delete against protected records.
- **Derived tables are projections**: Game, season, standing, reporting, and combined athlete views remain rebuildable.
- **Private by default**: Guardian, minor, medical, payment, and internal team data never become public through domain composition.

## Commercial Context

Onoo is currently in a **league-first, web-first paid-pilot phase**. That is the entry wedge, not the final product boundary.

Long-term revenue comes from modular league, club, team, and academy subscriptions, plus approved payment services and sponsorship placements. Consumer viewing remains free; consumer monetization is deferred.

The current league pilot gate model:

| Gate | Criteria |
|------|----------|
| Discovery | Contracted pilot, deposit, one-season agreement |
| Paid proof | 100% accuracy, zero unrecoverable events, <5 min recap |
| Full season | Satisfaction ≥8/10, season contract within 14 days |
| Expansion | Mobile, follows, push, claims — only after renewal |

---

_Last updated: 2026-07-22_
