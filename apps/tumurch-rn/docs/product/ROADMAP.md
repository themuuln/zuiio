# Tumurch — Product Roadmap

Last updated: 2026-07-08

## Status legend

- **Done** — implemented and working
- **In progress** — actively being built
- **Planned** — designed but not started
- **Idea** — considered but not yet planned

---

## Release A — Core gym + Hevy baseline

**Goal:** One branch can run daily operations. Members have a strong workout experience.

### Member experience
| Feature | Status | Notes |
|---|---|---|
| Onboarding (name, phone, goal, experience) | Done (Flutter) | Port to RN |
| Digital member ID (QR code) | Done (Flutter) | Port to RN |
| Membership status screen | Done (Flutter) | Port to RN |
| Workout template list | Done (Flutter) | Port to RN |
| Workout logging (sets, reps, weight) | Done (Flutter) | Port to RN, add Hevy-grade polish |
| PR tracking | Done (Flutter) | Port to RN |
| Body measurement logging | Done (Flutter) | Port to RN |
| Exercise database | Done (Flutter) | Port to RN |
| Rest timer | Planned | P1 — makes logger feel premium |
| Previous values in logger | Planned | P1 — core Hevy feature |
| Set types (warmup, drop, AMRAP) | Planned | P1 |
| Freeze request flow | Done (Flutter) | Port to RN |
| Supplement shop | Done (Flutter) | Port to RN |

### Reception
| Feature | Status | Notes |
|---|---|---|
| Member lookup (phone, name, QR) | Done (Flutter) | Port to RN |
| Check-in validation | Done (Flutter) | Port to RN |
| Guest/day pass | Done (Flutter) | Port to RN |
| Manual override | Done (Flutter) | Port to RN |

### Coach
| Feature | Status | Notes |
|---|---|---|
| Coach role + workspace | In progress (Flutter) | Port to RN |
| Client roster | In progress (Flutter) | Port to RN |
| Program builder | In progress (Flutter) | Port to RN |
| Assignment flows | In progress (Flutter) | Port to RN |
| Review queue | In progress (Flutter) | Port to RN |

### Manager
| Feature | Status | Notes |
|---|---|---|
| Membership plan CRUD | Done (Flutter) | Port to RN |
| Member status review | Done (Flutter) | Port to RN |
| Freeze approval | Done (Flutter) | Port to RN |
| Audit log | Done (Flutter) | Port to RN |
| Dashboard (counts, check-ins) | Done (Flutter) | Port to RN |
| Sales dashboard | Planned | P1 |

### Shop
| Feature | Status | Notes |
|---|---|---|
| Member shop (browse, order) | Done (Flutter) | Port to RN |
| Staff shop workspace | Done (Flutter) | Port to RN |
| Catalog admin | Planned | P1 |
| POS checkout | Planned | P1 |

---

## Release B — Coaching + CRM + operational depth

**Goal:** Coaches can manage clients professionally. Owner has real business tools.

| Feature | Priority | Status |
|---|---|---|
| Coach-client messaging | P1 | Planned |
| Session notes | P1 | Planned |
| Progress reports | P1 | Planned |
| Lead capture / CRM | P1 | Planned |
| Renewal reminders | P1 | Planned |
| Refunds + discount approval | P1 | Planned |
| Incident reporting | P1 | Planned |
| Billing automation | P2 | Planned |
| Receipt generation | P2 | Planned |

---

## Release C — Full gym OS differentiation

**Goal:** Multi-branch, hardware, AI, premium features.

| Feature | Priority | Status |
|---|---|---|
| Multi-branch owner ERP | P2 | Planned |
| Locker / bracelet / access control | P2 | Planned |
| Push notifications | P2 | Planned |
| HealthKit / Health Connect | P2 | Planned |
| Calorie tracking | P2 | Planned |
| AI plan generation | P3 | Planned |
| AI form analysis | P3 | Planned |
| Social features (profiles, sharing) | P3 | Planned |
| Strava sync | P3 | Planned |
| Widgets / live activity | P3 | Planned |

---

## Release order

```
Release A (now)          Release B (next)         Release C (later)
─────────────────        ─────────────────        ─────────────────
Member workout log       Coach messaging          Multi-branch
Reception check-in       Lead CRM                 Health integration
Membership mgmt          Billing automation       Calorie tracking
Shop basics              Receipts                 AI coaching
Coach foundation         Incidents                Social features
                         Refunds                  Hardware access
```

---

_Updated: 2026-07-08_
