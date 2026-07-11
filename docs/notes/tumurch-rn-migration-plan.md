# Tumurch: Flutter → React Native + Expo Migration Plan

**Date:** 2026-07-08
**Status:** Planning
**Decision:** Migrate from Flutter/Dart to React Native + Expo

---

## Why migrate

1. **Monorepo unity** — Tumurch is the only Dart codebase in a TypeScript/React monorepo. Migration enables sharing `@zuiio/*` packages, types, and team context across all products.
2. **Hevy alignment** — Hevy (the product Tumurch models) is built with React Native. Same stack means shared patterns, community knowledge, and easier feature parity.
3. **Ecosystem trajectory** — Expo is the standard RN toolchain with OTA updates (EAS Update), cloud builds, and file-based routing. Flutter has no OTA equivalent.
4. **Hiring** — RN devs outnumber Flutter devs ~3:1. In Mongolia's market, the gap is wider.
5. **Risk** — Google's 2024 Flutter team layoffs + Dart macros cancellation + Canonical taking over desktop = uncertain long-term stewardship.

**Migration cost is bounded.** Tumurch is at the coach foundation milestone — significant but not enormous. Supabase migrations (the hardest part) transfer unchanged.

---

## Critical finding

**Hevy is built with React Native.** Their job postings confirm "Lead React Native Engineer." They use MobX, React Navigation, and Victory Native. Tumurch migrating to RN/Expo aligns with the exact same tech stack as the product it's modeling.

---

## Library mapping: Flutter → React Native + Expo

### Direct replacements (Flutter deps → RN equivalents)

| Flutter Dependency | Purpose | React Native + Expo Equivalent | Notes |
|---|---|---|---|
| `supabase_flutter: ^2.12.0` | Backend (DB, auth, realtime) | `@supabase/supabase-js` | Already in stack-mobile.md. Same JS client. |
| `qr_flutter: ^4.1.0` | QR code generation | `expo-qrcode` | Expo-first, simple API. |
| `mobile_scanner: ^7.2.0` | Camera barcode/QR scanning | `expo-camera` | Built-in Expo module, supports barcode scanning. |
| `google_fonts: ^8.0.2` | Custom font loading | `expo-font` + `@expo-google-fonts/*` | Or bundle fonts directly via `assets/fonts/`. |
| `flutter_riverpod: ^3.3.1` | State management | `zustand` + `@tanstack/react-query` | Already in stack-mobile.md. Zustand for client state, React Query for server state. |
| `shared_preferences: ^2.5.4` | Key-value persistence | `@react-native-async-storage/async-storage` | For Zustand persist middleware. |
| `url_launcher: ^6.3.2` | Open URLs/external apps | `expo-linking` | Already in stack-mobile.md. |
| `video_player: ^2.10.0` | Video playback | `expo-video` | Modern Expo video with player controls. |
| `cupertino_icons: ^1.0.8` | iOS-style icons | N/A | Use `phosphor-react-native` consistently. |
| `flutter_lints: ^6.0.0` | Lint rules | `eslint` + `eslint-config-expo` | Standard Expo linting. |

### Additional libraries needed (not in Flutter deps, but required for Tumurch features)

| Library | Purpose | Why needed |
|---|---|---|
| `victory-native` (XL) | Charts — line, bar, area, pie | Progress analytics, muscle volume, body measurements, consistency. **Hevy's own charting choice.** Requires `@shopify/react-native-skia`. |
| `@shopify/react-native-skia` | GPU-accelerated 2D rendering | Required by Victory Native XL for performant charts. |
| `react-native-health` | Apple HealthKit integration | Future: sync workouts, calories, steps from Apple Watch. |
| `react-native-health-connect` | Google Health Connect integration | Future: Android equivalent of HealthKit. |
| `expo-notifications` | Push notifications | Already in stack-mobile.md. PR alerts, coach messages, membership reminders. |
| `expo-image-picker` | Photo selection from gallery | Progress photos, profile avatars, workout media. |
| `expo-file-system` | File operations | Download/export data, cache media. |
| `expo-sharing` | Native share sheet | Share workout summaries, progress reports. |
| `expo-haptics` | Tactile feedback | Timer completion, set logging, PR achievements. |
| `expo-blur` | Blur effects | UI polish, glass morphism surfaces. |
| `expo-splash-screen` | Splash screen | App launch experience. |
| `expo-status-bar` | Status bar control | Per-screen status bar styling. |
| `@gorhom/bottom-sheet` | Bottom sheet modals | Workout exercise selection, filter panels, action sheets. |
| `react-native-reanimated` | Animations | Already in stack-mobile.md. |
| `react-native-gesture-handler` | Gestures | Already in stack-mobile.md. |
| `react-native-calendars` | Calendar views | Workout consistency calendar, booking (future). |
| `react-native-svg` | SVG rendering | Chart axes, custom icons, QR styling. |
| `date-fns` | Date utilities | Already in `@zuiio/core`. Workout date logic, streaks. |
| `react-native-safe-area-context` | Safe area insets | Already in stack-mobile.md. |
| `react-native-screens` | Native screen containers | Already in stack-mobile.md. |

### Future libraries (AI, calorie tracking, advanced features)

| Library | Purpose | When |
|---|---|---|
| `expo-camera` (advanced) | AI-powered form analysis | Phase 5 — AI coaching |
| `react-native-ml-kit` | On-device ML | Exercise classification, form detection |
| `expo-task-manager` + `expo-background-fetch` | Background sync | Calorie tracking, health data sync |
| `react-native-chart-kit` | Simpler charts (alternative) | If Victory Native is too heavy for simple cases |
| `@tanstack/react-form` | Type-safe forms | Already in stack-mobile.md. Onboarding, settings. |
| `zod` | Schema validation | Already in `@zuiio/core`. Form + API validation. |

---

## Architecture decisions

### 1. State management: Zustand + React Query

Flutter uses Riverpod. The RN equivalent pattern:

```
Riverpod Provider          → Zustand store (client state: auth, UI flags, selected user)
Riverpod FutureProvider    → React Query hook (server state: member data, workouts)
Riverpod StreamProvider    → React Query + Supabase realtime subscription
```

**Pattern:**
- `useAuthStore()` — Zustand store for auth state, selected user, runtime config
- `useMemberDashboard(memberId)` — React Query hook wrapping Supabase RPC
- `useWorkoutSession(sessionId)` — React Query with realtime updates

### 2. Navigation: expo-router (file-based)

Flutter uses `MaterialApp` + `HomeScreen`. RN uses file-based routing:

```
app/
├── _layout.tsx              # Root layout (auth gate, providers)
├── (auth)/
│   ├── login.tsx
│   └── onboarding.tsx
├── (member)/
│   ├── _layout.tsx          # Member tab layout
│   ├── index.tsx            # Home/dashboard
│   ├── workouts/
│   │   ├── index.tsx        # Workout list
│   │   ├── [id].tsx         # Active workout session
│   │   └── log.tsx          # Workout logging
│   ├── progress/
│   │   ├── index.tsx        # Progress hub
│   │   ├── measurements.tsx
│   │   └── prs.tsx
│   ├── shop/
│   │   └── index.tsx        # Member shop
│   └── profile/
│       └── index.tsx        # Member ID, settings
├── (reception)/
│   ├── _layout.tsx
│   ├── lookup.tsx           # Member search
│   ├── checkin/[id].tsx     # Check-in validation
│   └── guest.tsx            # Guest pass
├── (coach)/
│   ├── _layout.tsx
│   ├── index.tsx            # Coach dashboard
│   ├── clients/
│   │   ├── index.tsx        # Client roster
│   │   └── [id].tsx         # Client detail
│   ├── programs/
│   │   ├── index.tsx        # Program builder
│   │   └── [id].tsx         # Program detail
│   └── review/
│       └── index.tsx        # Review queue
├── (manager)/
│   ├── _layout.tsx
│   ├── index.tsx            # Manager dashboard
│   ├── members/
│   │   └── index.tsx        # Member management
│   ├── plans/
│   │   └── index.tsx        # Membership plans
│   ├── audit/
│   │   └── index.tsx        # Audit log
│   └── shop/
│       └── index.tsx        # Staff shop workspace
└── +not-found.tsx
```

### 3. Repository pattern: TypeScript interfaces

Flutter's `GymRepository` abstract class → TypeScript interface:

```typescript
// src/data/repository.ts
interface GymRepository {
  // Auth
  fetchUsers(): Promise<AppUser[]>
  authenticate(userId: number): Promise<AppUser>

  // Member
  fetchMemberOverview(memberId: number): Promise<MemberOverview>
  fetchMemberDashboard(memberId: number): Promise<MemberDashboardData>

  // Workouts
  fetchWorkoutTemplates(branchId: number): Promise<WorkoutTemplate[]>
  startWorkoutSession(templateId: number, memberId: number): Promise<WorkoutSessionLog>
  logWorkoutSet(sessionId: number, exerciseId: number, set: WorkoutSetDraft): Promise<void>
  completeWorkoutSession(sessionId: number): Promise<void>

  // Reception
  searchMembers(query: string, branchId: number): Promise<MemberLookupRecord[]>
  validateCheckIn(memberId: number, branchId: number): Promise<CheckInResult>

  // ... etc
}
```

**Key insight:** The Supabase queries in `repository.dart` (2500+ lines) become Supabase JS client calls — same SQL, same RPC functions, same RLS policies. The Dart `Map<String, dynamic>` parsing becomes TypeScript type assertions.

### 4. Design system: NativeWind + @zuiio/branding

Flutter uses a custom `theme.dart` with OKLch colors. The RN equivalent:

- `@zuiio/branding` exports OKLch color tokens (shared with web)
- `nativewind` applies Tailwind CSS classes using those tokens
- `@zuiio/ui-native` provides RN-specific components (Button, Card, Input, etc.)

### 5. Data models: TypeScript types

Flutter's `models.dart` (1970 lines, 40+ classes) → TypeScript interfaces:

```typescript
// Instead of Dart classes with manual fromJson:
interface MemberOverview {
  id: number
  name: string
  phone: string
  status: 'active' | 'frozen' | 'overdue' | 'expired' | 'canceled'
  branchId: number
  membershipPlanName: string | null
  membershipEndDate: string | null
  // ...
}

// Parsing becomes:
function parseMemberOverview(row: Record<string, unknown>): MemberOverview {
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: String(row.phone),
    status: row.status as MemberOverview['status'],
    // ...
  }
}
```

**Benefit:** TypeScript's structural typing eliminates much of the boilerplate Dart requires for JSON parsing. Many Dart helper functions (`_readInt`, `_readNullableInt`, `_readDate`) disappear entirely.

### 6. Runtime modes: Keep the same pattern

Flutter has `preview`, `local`, `cloud` modes. Keep the same:

```typescript
// src/config/runtime.ts
type RuntimeMode = 'preview' | 'local' | 'cloud'

interface RuntimeConfig {
  mode: RuntimeMode
  supabase?: { url: string; anonKey: string }
}
```

Preview mode uses seeded in-memory data (same as Flutter's `DebugPreviewGymRepository`). Local and cloud modes connect to Supabase.

---

## Phased migration plan

### Phase 0: Foundation (Week 1-2)

**Goal:** Scaffold the RN/Expo project with routing, theming, and Supabase connectivity.

- [ ] Initialize Expo project with `npx create-expo-app@latest tumurch --template tabs`
- [ ] Install core dependencies (see library mapping above)
- [ ] Set up `expo-router` with role-based route groups
- [ ] Port `@zuiio/branding` OKLch tokens to NativeWind config
- [ ] Port `TumurchRuntimeConfig` to TypeScript
- [ ] Set up Supabase client with same project credentials
- [ ] Create `GymRepository` TypeScript interface
- [ ] Implement `PreviewGymRepository` with seeded data (port from `debug_preview_repository.dart`)
- [ ] Build root layout with auth gate and role switching
- [ ] Verify: app opens, role switching works, preview data displays

**Exit criteria:** App runs in preview mode with role-based navigation.

### Phase 1: Member identity (Week 3-4)

**Goal:** Member onboarding, digital ID, membership status.

- [ ] Port data models (all 40+ classes → TypeScript interfaces)
- [ ] Build onboarding screen (name, phone, goal, experience)
- [ ] Build digital member ID screen (QR code generation with `expo-qrcode`)
- [ ] Build membership status screen (plan, status, dates, branch access)
- [ ] Build freeze request flow
- [ ] Implement Supabase queries for member data

**Exit criteria:** Member can onboard, see QR ID, view membership status, request freeze.

### Phase 2: Reception operations (Week 5-6)

**Goal:** Front desk lookup, check-in validation, guest passes.

- [ ] Build member lookup screen (phone, name search)
- [ ] Build QR scanner with `expo-camera`
- [ ] Build check-in validation result screen
- [ ] Build guest/day pass form
- [ ] Build manual override flow
- [ ] Implement audit logging for check-in actions

**Exit criteria:** Reception can complete check-in decisions using app data only.

### Phase 3: Workout logging (Week 7-10)

**Goal:** Hevy-grade workout logging, exercise database, PR tracking.

- [ ] Build exercise database screen
- [ ] Build workout list screen
- [ ] Build active workout session screen (set entry, rest timer, notes)
- [ ] Build workout logging with previous values, set types, RPE
- [ ] Build PR tracking screen
- [ ] Build body measurement logging screen
- [ ] Add `expo-haptics` for set completion feedback
- [ ] Implement rest timer with `expo-notifications` local notification

**Exit criteria:** Member can log workouts with Hevy-level polish, track PRs, log measurements.

### Phase 4: Coach workflows (Week 11-14)

**Goal:** Coach workspace, client roster, program builder, review loop.

- [ ] Build coach role shell and navigation
- [ ] Build client roster screen
- [ ] Build client detail screen (assigned plan, workout recap, progress)
- [ ] Build program builder (routine creation, exercise assignment)
- [ ] Build assignment/reassignment flows
- [ ] Build review queue (completed workouts, PRs, missed sessions)
- [ ] Implement coach-client messaging (Supabase realtime)

**Exit criteria:** Coach can manage clients, build programs, review progress.

### Phase 5: Shop and operations (Week 15-18)

**Goal:** Member shop, staff shop, manager dashboard.

- [ ] Build member shop tab (product browsing, ordering)
- [ ] Build staff shop workspace (order lifecycle, pickup handling)
- [ ] Build manager dashboard (member counts, daily check-ins)
- [ ] Build membership plan management (CRUD)
- [ ] Build freeze approval flow
- [ ] Build audit history screen

**Exit criteria:** One branch can run daily operations through the app.

### Phase 6: Polish and analytics (Week 19-22)

**Goal:** Charts, progress analytics, UI polish.

- [ ] Integrate Victory Native XL for progress charts
- [ ] Build body measurement graphs (weight, waist, chest, hips over time)
- [ ] Build workout volume trends and muscle split charts
- [ ] Build consistency calendar with `react-native-calendars`
- [ ] Add `expo-blur` for glass morphism surfaces
- [ ] Add `expo-haptics` throughout for tactile feedback
- [ ] Performance profiling and optimization

**Exit criteria:** App feels polished, charts render smoothly, animations are fluid.

### Phase 7: Future features (Week 23+)

**Goal:** Health integration, AI, calorie tracking.

- [ ] Apple HealthKit integration (`react-native-health`)
- [ ] Google Health Connect integration (`react-native-health-connect`)
- [ ] Calorie tracking (food logging, macro calculation)
- [ ] AI-powered plan generation
- [ ] AI form analysis (camera-based)
- [ ] Push notifications (`expo-notifications`)
- [ ] Social features (profiles, sharing, leaderboards)
- [ ] Strava sync
- [ ] Widgets (`expo-widgets` or native)

---

## Supabase migration strategy

**The 27 existing Supabase migrations transfer unchanged.** SQL is SQL. The RLS policies, RPC functions, and table schemas are backend-agnostic.

Steps:
1. Copy `supabase/` directory as-is (migrations, config.toml, seed.sql)
2. Use same Supabase project credentials (`oxnvbgdlhrgzzuyrnebf`)
3. Port RPC function calls from Dart `supabase_flutter` to JS `@supabase/supabase-js`
4. Verify RLS policies work with new client

**No backend changes required.** The Flutter app's Supabase usage is client-side only.

---

## Testing strategy

| Test type | Flutter equivalent | RN/Expo tool |
|---|---|---|
| Unit tests | `flutter test` | `vitest` (already in monorepo) |
| Widget tests | `flutter_test` | `@testing-library/react-native` |
| Integration tests | `integration_test/` | `jest` + `detox` or `maestro` |
| Backend contract tests | `test/*_contract_test.dart` | `vitest` with Supabase client |
| E2E smoke tests | `integration_test/*_smoke_test.dart` | `maestro` (YAML-based, Expo-friendly) |

---

## Risk mitigation

| Risk | Mitigation |
|---|---|
| Loss of existing Flutter code | Keep Flutter repo as reference. Repository patterns are well-documented. |
| Supabase migration incompatibility | None expected — same SQL, same RLS, same RPC. Verify with contract tests. |
| Performance regression | Profile early with Victory Native XL charts. Use React Native DevTools. |
| Library maturity (Victory Native XL) | It's what Hevy uses in production. Proven at scale. |
| Team learning curve | TypeScript/React is already the team's primary stack. Minimal friction. |
| Scope creep during migration | Follow phased plan strictly. Don't build new features during migration. |

---

## Success criteria

After migration, Tumurch should:

1. **Compile and run** on iOS and Android in preview, local, and cloud modes
2. **Share `@zuiio/*` packages** with Zer, Tolom, and other apps
3. **Match Flutter feature parity** for all completed features (member, reception, coach foundation, shop)
4. **Feel native** — proper iOS/Android UI conventions, haptics, gestures
5. **Support OTA updates** via EAS Update (Flutter had no equivalent)
6. **Be maintainable** by any TypeScript developer on the team

---

## Appendix: File count comparison

| Area | Flutter files | Estimated RN files |
|---|---|---|
| Data models | 1 (`models.dart`, 1970 lines) | 5-8 (split by domain) |
| Repository | 2 (`repository.dart`, `debug_preview_repository.dart`) | 3-4 (interface + implementations) |
| App shell | 4 (`app.dart`, `theme.dart`, `providers.dart`, `runtime_config.dart`) | 6-8 (layouts, providers, config) |
| Features | 8 screens | 25-35 screens (expo-router file-based) |
| **Total** | ~18 source files | ~45-55 source files |

More files, but each is smaller, focused, and follows a consistent pattern. This is the expo-router way.

---

_This plan should be updated as migration progresses — not rewritten, but refined._
