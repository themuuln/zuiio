# Onoo V2 — Paid-Pilot Roadmap

Onoo V2 is a **web-first trusted-record pilot**, not a broad consumer or mobile launch. The product proves that an authorized operator can produce accurate, reviewable basketball records before wider scope resumes.

## Delivery gates

| Gate | Outcome | Status |
| --- | --- | --- |
| Discovery | Contracted pilot, 1,000,000 MNT deposit, one-season agreement | External gate |
| Schema recovery | Clean baseline, RLS, commands, types, pilot seed | In progress |
| Secure vertical slice | Source → approval → projection → curated public result | Planned |
| Rehearsal | Role matrix, offline recovery, handoff, correction drills | Planned |
| Paid proof | 100% final-score accuracy, zero unrecoverable events | Planned |
| Full season | Satisfaction ≥8/10 and season contract within 14 days | Blocked by proof |
| Expansion | Consumer/mobile, follows/push, claims, analytics | Frozen |

## V2 implementation phases

### Phase 0A — Schema recovery

- [x] Record prototype divergence and hosted security risks.
- [x] Create the clean V2 baseline and archive V1 prototype migrations.
- [x] Define RLS, audited commands, and curated invoker views.
- [x] Replace mock fixtures with pilot reference data.
- [ ] Prove clean reset, generated type diff, and role matrix against a local Supabase stack.

### Phase 0B — Trusted record model

- [ ] Ruleset-bound event vocabulary.
- [ ] Evidence-backed source submissions.
- [ ] Revisioned approval and correction workflow.
- [ ] Projection rebuild from approved journals only.

### Phase 0C — Authorization cutover

- [ ] Remove direct browser and API writes to events, game state, and projections.
- [ ] Route all mutations through scoped commands.
- [ ] Retire legacy derived-stat RPC paths.

### Phase 0D — Durable tracker journal

- [ ] Persist each operation before network send.
- [ ] Restore/replay safely after reload or network loss.
- [ ] Support controlled lead-to-backup handoff.

### Phase 0E — Reviewed publication

- [ ] Remove public mock fallbacks.
- [ ] Publish only approved revision data with source/reviewer provenance.
- [ ] Add review, embed, and export surfaces.

### Phase 0F — Operations

- [ ] Operations console and private telemetry.
- [ ] Game-day runbook and paper fallback.
- [ ] Database integration and tracker chaos tests.

## Explicitly deferred

The following V1/consumer scope is frozen until the paid proof gate passes:

- Expo/mobile rollout
- follows and push notifications
- athlete claims and phone OTP
- public analytics and consumer growth surfaces
- unsupported historical imports

## Non-negotiable pilot measures

- **0** unrecoverable tracker events
- **100%** final-score accuracy
- scorer/admin satisfaction **≥8/10**
- season contract signed within **14 days** of successful pilot conclusion
