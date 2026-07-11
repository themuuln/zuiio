# Hevy — Deep Analysis

Last updated: 2026-07-08

## What is Hevy

Hevy is a workout logging app that has become the de facto standard for serious lifters. It's what our members will compare Tumurch against.

## Tech stack (confirmed)

| Layer | Technology |
|---|---|
| Mobile | React Native |
| State management | MobX |
| Navigation | React Navigation |
| Charts | Victory Native |
| Backend | Likely Node.js + PostgreSQL |
| Auth | Likely Firebase or custom |

**Key insight:** Hevy uses React Native. We're building Tumurch with React Native + Expo. Same stack. This means:
- Community patterns transfer directly
- Library choices are proven at scale
- Performance characteristics are comparable
- We can reference their architecture decisions

## Feature inventory

### Workout logging (core)

| Feature | Hevy | Tumurch target |
|---|---|---|
| Quick set entry (weight × reps) | ★★★★★ | ★★★★★ |
| Previous values shown inline | ★★★★★ | ★★★★★ |
| Rest timer (auto-start) | ★★★★★ | ★★★★★ |
| Set types (normal, warmup, drop, failure, AMRAP, superset) | ★★★★★ | ★★★★★ |
| RPE tracking | ★★★★ | ★★★★ |
| Notes per set | ★★★★ | ★★★★ |
| Exercise search/filter | ★★★★★ | ★★★★★ |
| Workout duration tracking | ★★★★ | ★★★★ |
| Undo last set | ★★★★ | ★★★★ |
| Plate calculator | ★★★★ | ★★★ |
| Warm-up calculator | ★★★★ | ★★★ |

### Routines & programs

| Feature | Hevy | Tumurch target |
|---|---|---|
| Create custom routines | ★★★★★ | ★★★★★ |
| Routine folders | ★★★★ | ★★★★ |
| Copy/paste routines | ★★★★ | ★★★★ |
| Share routines | ★★★★ | ★★★ (B2B, not social) |
| Coach-assigned programs | ★★★ | ★★★★★ |
| Program scheduling (Mon/Wed/Fri) | ★★★★ | ★★★★ |
| Auto-progression rules | ★★★ | ★★★★ |

### Progress & analytics

| Feature | Hevy | Tumurch target |
|---|---|---|
| Body weight chart | ★★★★ | ★★★★ |
| Body measurements (chest, waist, arms, etc.) | ★★★★ | ★★★★ |
| PR history per exercise | ★★★★★ | ★★★★★ |
| Volume trends (weekly/monthly) | ★★★★ | ★★★★ |
| Muscle group split chart | ★★★★ | ★★★★ |
| Consistency calendar | ★★★★ | ★★★★ |
| Monthly/yearly reports | ★★★ | ★★★★ |
| Progress photos | ★★★ | ★★★★ |

### Exercise database

| Feature | Hevy | Tumurch target |
|---|---|---|
| Exercise count | ~500+ | ~500+ |
| Muscle group tags | ★★★★★ | ★★★★★ |
| Equipment tags | ★★★★★ | ★★★★★ |
| Video demonstrations | ★★★★ | ★★★★ (via YMove/free videos) |
| Instructions text | ★★★★ | ★★★★ |
| Custom exercises | ★★★★ | ★★★★ |

### Coach features

| Feature | Hevy | Tumurch target |
|---|---|---|
| Client roster | ★★★ | ★★★★★ |
| Assign programs to clients | ★★★ | ★★★★★ |
| View client workout completion | ★★★ | ★★★★★ |
| Client progress view | ★★★ | ★★★★★ |
| Coach-client messaging | ✗ | ★★★★ |
| Session notes | ✗ | ★★★★ |
| Nutrition plan assignment | ✗ | ★★★ |
| Progress reports | ✗ | ★★★★ |

### Social (lower priority for us)

| Feature | Hevy | Tumurch target |
|---|---|---|
| User profiles | ★★★★★ | ★★★ (limited) |
| Workout feed | ★★★★ | ★★ (not core) |
| Leaderboards | ★★★★ | ✗ (not relevant) |
| Routine sharing | ★★★★ | ★★★ (internal) |
| Strava sync | ★★★★ | ★★★ (future) |

## UX patterns to study

### Workout logger (most important screen)

Hevy's logger is the gold standard. Key UX decisions:

1. **Previous values always visible** — when you start a set, you see what you did last time. This is the #1 retention feature.
2. **One-tap set completion** — tap the checkmark, set is logged. No confirmation dialog.
3. **Rest timer auto-starts** — after completing a set, the timer begins. You can dismiss or adjust.
4. **Exercise switching is fast** — swipe or tap to move between exercises in a workout.
5. **Weight picker is optimized** — quick increment/decrement buttons, not a text input.
6. **Superset grouping** — exercises can be visually grouped as supersets.

### Progress screens

1. **Charts are simple** — line charts for weight/measurements, bar charts for volume.
2. **Time range selector** — 1 month, 3 months, 6 months, 1 year, all time.
3. **PR celebrations** — when you hit a new PR, there's a visual celebration.
4. **Consistency calendar** — GitHub-style heatmap showing workout frequency.

### Exercise database

1. **Search is fast** — instant results as you type.
2. **Filter by muscle/equipment** — tap to filter, multi-select supported.
3. **Exercise detail** — shows instructions, muscles worked, common mistakes, video.

## What Hevy does NOT do (our opportunities)

1. **No gym operations** — no reception, no check-in, no memberships
2. **No billing** — no payment processing, no invoices
3. **No shop/POS** — no supplement sales, no inventory
4. **No access control** — no QR gates, no locker management
5. **No multi-branch** — single-user focused, not gym-management focused
6. **No Mongolian localization** — English only, no local currency
7. **No coach messaging** — coaches can assign plans but can't chat
8. **No nutrition tracking** — no calorie counting, no macro tracking
9. **No health integration** — no Apple HealthKit, no Google Health Connect (yet)

## Pricing comparison

| App | Free tier | Paid tier |
|---|---|---|
| Hevy | Full logger, limited social | Pro: $8.99/mo (social, advanced stats) |
| Strong | 3 routines | Pro: $4.99/mo (unlimited, cloud sync) |
| Mindbody | N/A | From $139/mo (gym management) |
| Glofox | N/A | Custom pricing (gym management) |
| **Tumurch** | TBD | B2B SaaS pricing (per branch) |

## Key takeaways

1. **Hevy is the UX benchmark** — we must match their workout logger quality
2. **Same tech stack** — React Native means we can reference their patterns
3. **Our differentiation is operations** — Hevy doesn't do gym management
4. **Coach features are weak everywhere** — this is a gap we can own
5. **Health integration is coming** — Hevy is adding it, we should too
6. **Mongolian market is untapped** — no competitor serves this market

---

_Sources: Hevy app (iOS/Android), Hevy website, job postings (React Native Engineer), community forums._
