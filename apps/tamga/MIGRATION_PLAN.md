# Tamga — Flutter → React Native Expo Migration Plan

> **Date:** 2026-07-08
> **Goal:** Migrate Tamga from Flutter to React Native Expo with full feature parity, offline-first architecture, and web-ready foundation.

---

## 1. Executive Summary

Tamga is a **22-module horse management app** for Mongolia with offline-first sync, MapLibre maps, marketplace, events, AI breeding advisor, and a complex local database (45+ Isar schemas). The migration targets **React Native Expo SDK 56** with Expo Router v3, aiming to stay within the Expo ecosystem for maximum code sharing with the future web version.

**Key architectural decisions:**
- **Expo Router v3** (file-based routing) replaces GoRouter
- **Zustand + TanStack Query** replaces Riverpod
- **WatermelonDB** replaces Isar (offline-first, SQLite-backed, reactive)
- **MMKV + expo-secure-store** replaces SharedPreferences + flutter_secure_storage
- **MapLibre React Native** replaces maplibre_gl
- **NativeWind v5 (Tailwind CSS)** replaces shadcn_flutter / manual design tokens
- **Nativewind + @zuiio/ui** leverages existing monorepo packages where possible

---

## 2. Package Mapping — Flutter → React Native Expo

### 2.1 Core Framework

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| Flutter SDK | Expo SDK 56 + RN 0.85 | Stable New Architecture |
| Dart | TypeScript | Strict mode, same conventions |
| `go_router` ^17 | **expo-router v3** | File-based routing, typed routes, deep linking |
| `flutter_riverpod` / `hooks_riverpod` | **Zustand** (client state) + **TanStack Query v5** (server state) | Clean separation of concerns |
| `freezed` + `json_annotation` | **TypeScript interfaces** + Zod | Built-in immutability, Zod for validation |
| `dio` + `retrofit` | **fetch** (built-in) or ky | Lightweight HTTP |
| `flutter_animate` | **Moti** (on Reanimated 4) | Declarative, Framer Motion–inspired |
| `google_fonts` | **@expo-google-fonts/inter** or expo-font | Same font, web-compatible |
| `gap` | NativeWind spacing / Gap component | Built-in via Tailwind |
| `shadcn_flutter` | **NativeWind v5 + shadcn/ui (web)** | Tailwind on mobile, shadcn for web |
| `equatable` | **immer** (optional, for Zustand) | Zustand does structural equality by default |

### 2.2 Backend & Data

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `supabase_flutter` ^2.15 | **@supabase/supabase-js** + **@supabase/ssr** | Same Supabase project, same migrations |
| `isar` ^3.1 (45 schemas) | **WatermelonDB** | SQLite-backed, reactive, lazy loading, built-in sync protocol |
| `isar_flutter_libs` | WatermelonDB native (auto) | Expo plugin: `watermelondb-expo-plugin` |
| `isar_generator` | **@nozbe/watermelondb/schema** | TypeScript schema definitions |
| `shared_preferences` | **react-native-mmkv** | Synchronous, ~30x faster than AsyncStorage |
| `flutter_secure_storage` | **expo-secure-store** | iOS Keychain / Android Keystore |
| `hive_flutter` | MMKV (merged into above) | No need for separate KV store |
| `http` / `dio` | **ky** or fetch | Built-in or lightweight wrapper |

### 2.3 UI & Styling

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `cached_network_image` | **expo-image** | Disk+memory caching, BlurHash, smooth transitions |
| `flutter_svg` | **react-native-svg** + **react-native-svg-transformer** | SVG as components via Metro plugin |
| `flutter_image_compress` | **expo-image-manipulator** | Resize, crop, rotate on-device |
| `fl_chart` | **victory-native** (Skia) or **react-native-chart-kit** | Victory for performance; Chart Kit for simplicity |
| `font_awesome_flutter` | **@expo/vector-icons** or react-native-vector-icons | Includes FA, Material, Ionicons |
| `cupertino_icons` | **@expo/vector-icons** (built-in) | iOS-style icons included |
| `meta` | TypeScript generics | Built-in |
| Design tokens (TamgaColors, TamgaSpacing, TamgaTypography) | **NativeWind v5 theme** + CSS variables | Tailwind config as single source of truth |

### 2.4 Navigation & Maps

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `go_router` shell routes (5-tab) | **Expo Router `(tabs)/` layout** | File-system based, typed |
| `maplibre_gl` | **@maplibre/maplibre-react-native** v11 | Same MapLibre native SDKs, Expo compatible |
| `latlong2` | **@turf/turf** + native math | Or simple lat/lng objects |
| `geolocator` | **expo-location** | Foreground + background location, geofencing |
| `mbtiles` / `pmtiles` | MapLibre OfflineManager + **expo-asset** | Bundle PMTiles, use `mbtiles:///` or HTTP byte-range |
| `url_launcher` | **expo-linking** | Deep links, external URLs, app store |
| `share_plus` | **expo-sharing** | Share text, files, URLs cross-platform |

### 2.5 Camera, Files & Media

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `image_picker` | **expo-image-picker** | Gallery + camera, quality/compression options |
| `file_picker` | **expo-document-picker** | Pick any file type |
| `path_provider` | **expo-file-system** | App document/cache directories |
| `path` | `path` (npm) | Same path manipulation |
| `mime` | **mime-types** (npm) | MIME type lookup |

### 2.6 Notifications & Firebase

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `firebase_core` | **firebase-js-sdk** or **@react-native-firebase/app** | Expo: use Expo push service or Firebase directly |
| `firebase_crashlytics` | **@sentry/expo** | Sentry replaces Crashlytics (better Expo integration) |
| `firebase_messaging` | **expo-notifications** | Unified push API, Expo push service |
| `flutter_local_notifications` | **expo-notifications** (local) | Schedule, cancel, channels — all built-in |
| `timezone` | **date-fns-tz** or Intl API | Timezone handling for notifications |

### 2.7 Utilities & Business Logic

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `csv` | **papaparse** or **@zuiio/export** | CSV parsing/generation |
| `pdf` | **@zuiio/export** (pdf-lib) | Already in monorepo |
| `uuid` | **uuid** (npm) | Same UUID v4 generation |
| `connectivity_plus` | **@react-native-community/netinfo** or **expo-netinfo** | Network state detection |
| `flutter_hooks` | **React hooks** (built-in) | No extra dependency needed |

### 2.8 Dev Dependencies

| Flutter | RN Expo Equivalent | Notes |
|---|---|---|
| `flutter_lints` | **eslint** + **typescript-eslint** | Linting |
| `flutter_launcher_icons` | **expo-image** in app.json | Icon configuration |
| `build_runner` | **@nozbe/watermelondb/cli** | Schema migrations |
| `freezed` | TypeScript (built-in) | No codegen needed |
| `mocktail` | **vitest** or **jest** | Testing |
| `integration_test` | **Maestro** or **Playwright** | E2E testing |

---

## 3. Feature Module Mapping

### 3.1 Module Inventory (22 features)

Each Flutter feature maps to an Expo Router directory with the same Clean Architecture layers:

```
app/                          ← Expo Router file-based routes
  (tabs)/
    _layout.tsx               ← Bottom tab navigator (5 tabs)
    index.tsx                 ← /lineage (default tab)
    marketplace.tsx           ← /market
    events.tsx                ← /events
    search.tsx                ← /lost-horse
    profile.tsx               ← /profile
  horses/
    [id].tsx                  ← Horse detail
    add.tsx                   ← Add horse
    import.tsx                ← CSV import
  lineage/
    index.tsx                 ← Lineage home
    [id].tsx                  ← Lineage detail
    inbreeding.tsx            ← Inbreeding calculator
  market/
    create.tsx                ← Create listing
    [id].tsx                  ← Listing detail
    inbox.tsx                 ← Inbox
    conversation/[id].tsx     ← Conversation
  events/
    [id].tsx                  ← Event detail
    create.tsx                ← Create event
    partner-dashboard.tsx     ← Partner dashboard
  ...                         ← All other routes

src/
  features/                   ← Domain + Data + Application (business logic)
    auth/
    horses/
    lineage/
    market/
    events/
    races/
    breeding/
    health/
    teams/
    stable/
    analytics/
    map/
    payments/
    certificates/
    documents/
    social/
    training/
    nutrition/
    ai/
    race-videos/
    lost-horse/
    search/
    onboarding/
    session/
  core/                       ← Shared infrastructure
    storage/                  ← WatermelonDB schema definitions
    sync/                     ← SyncEngine port
    error/                    ← Error handling
    services/                 ← Notification services
    theme/                    ← NativeWind theme tokens
    widgets/                  ← Shared UI components
    features/                 ← Feature flags
    layout/                   ← Responsive layout hooks
  shared/                     ← Shared domain models
    domain/                   ← TypeScript interfaces
```

### 3.2 Feature-by-Feature Equivalents

| # | Feature | Flutter Screens | RN Expo Approach | Complexity |
|---|---|---|---|---|
| 1 | **auth** | 4 screens (login, phone, OTP, register) | Expo Router auth flow + Supabase Auth (phone OTP) | Low |
| 2 | **onboarding** | 9 pages (wizard) | Expo Router stack with progress indicator | Medium |
| 3 | **horses** | 15+ screens/tabs | Tab-based detail, forms, import | High |
| 4 | **lineage** | 7 screens (tree, calculator) | Tree visualization with react-native-tree or custom | High |
| 5 | **health** | 2 screens + data layer | Simple CRUD screens | Low |
| 6 | **breeding** | 3 screens + widgets | Forms, gestation tracker | Medium |
| 7 | **events** | 5 screens + widgets | CRUD, map picker, registration | Medium |
| 8 | **races** | 4 screens | List, detail, form, results editor | Medium |
| 9 | **market** | 15+ screens | Largest module — marketplace with chat, filters, verification | High |
| 10 | **payments** | 4 screens | Paywall, tier cards, instructions | Medium |
| 11 | **profile** | 2 screens | Settings, notification prefs | Low |
| 12 | **map** | 7 screens + widgets | MapLibre integration, geofencing, markers | High |
| 13 | **lost_horse** | 1 screen + filters | Location picker, photo upload, classification | Medium |
| 14 | **documents** | 2 screens | Upload, list | Low |
| 15 | **certificates** | 2 screens | Certificate view, public verify | Low |
| 16 | **teams** | 4 screens | Member management, invitations | Medium |
| 17 | **stable** | 1 screen | Boarding, invoicing | Low |
| 18 | **analytics** | 1 dashboard + charts | Victory Native charts, export | Medium |
| 19 | **social** | 2 screens | Breeder profiles, leaderboard | Low |
| 20 | **training** | 3 screens + charts | Training log, performance tracking | Medium |
| 21 | **nutrition** | 2 screens | Feed schedule, feed log | Low |
| 22 | **ai** | 2 screens | AI breeding advisor (Supabase Edge Function → same API) | Low |

---

## 4. Core Infrastructure Migration

### 4.1 Offline-First Sync Engine

The Flutter sync engine (`SyncEngine` + `SyncQueue`) uses Isar for local storage and a custom queue with exponential backoff. In RN Expo:

```
Flutter: Isar (45 schemas) → SyncQueue → Supabase
RN Expo: WatermelonDB (45 models) → SyncQueue (MMKV) → Supabase
```

**WatermelonDB advantages over alternatives:**
- **Reactive queries** — components re-render when data changes (like Riverpod watching Isar)
- **Lazy loading** — only loads data when accessed (critical for 45+ collections)
- **Built-in sync protocol** — can sync with any backend (Supabase via Edge Function)
- **SQLite-backed** — battle-tested, fast, supports complex queries
- **TypeScript schemas** — compile-time safety for all 45 collections

**Sync Queue implementation:**
- Use MMKV for the sync queue (fast synchronous reads/writes)
- Port the exponential backoff logic from `SyncEngine` (pure TypeScript, no Flutter dependency)
- Use `expo-background-task` (SDK 53+) for background sync when app is inactive
- Use `expo-task-manager` for headless task processing

### 4.2 Design Token Migration

Flutter tokens (`TamgaColors`, `TamgaSpacing`, `TamgaTypography`) → NativeWind theme:

```typescript
// tailwind.config.js (NativeWind v5)
export default {
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.55 0.15 250)',      // TamgaColors.primary
        'primary-foreground': 'oklch(0.98 0 0)',
        secondary: 'oklch(0.70 0.12 180)',
        // ... full token set from design_tokens.dart
      },
      spacing: {
        xs: '4px',    // TamgaSpacing.xs
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        // ...
      },
      borderRadius: {
        DEFAULT: '12px',    // TamgaSpacing.cornerRadius
        sm: '8px',          // TamgaSpacing.cornerRadiusSmall
        pill: '9999px',     // TamgaSpacing.cornerRadiusPill
      },
    },
  },
}
```

### 4.3 Feature Flags

Flutter `FeatureFlagService` (SharedPreferences) → MMKV-backed Zustand store:

```typescript
// src/core/features/feature-flags.ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const featureFlags = {
  hasAiBreeding: () => storage.getBoolean('flag_ai_breeding') ?? false,
  hasAnalytics: () => storage.getBoolean('flag_analytics') ?? false,
  // ... same flags as Flutter FeatureFlag enum
};
```

### 4.4 Error Handling

Flutter `Result<T>` type + `CrashReporter` → TypeScript Result pattern + Sentry:

```typescript
// src/core/error/result.ts
type Result<T> = { ok: true; value: T } | { ok: false; error: AppException };

// Sentry replaces Firebase Crashlytics
import * as Sentry from '@sentry/expo';
Sentry.init({ dsn: '...' });
```

### 4.5 Responsive Layout

Flutter `Breakpoints` + `ResponsiveLayout` → React Native Dimensions + useWindowDimensions:

```typescript
// src/core/layout/use-responsive.ts
import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}
```

---

## 5. Web Readiness Strategy

Since web is planned soon, the migration must produce a **universal codebase**:

### 5.1 Expo Web Architecture

```
apps/tamga/
  app/              ← Expo Router (universal: iOS, Android, Web)
  src/
    features/       ← Pure business logic (works on all platforms)
    core/           ← Platform-agnostic infrastructure
    web/            ← Web-only components (React DOM)  [NEW]
  public/           ← Static assets
```

### 5.2 Platform-Specific Code

Use Expo Router platform extensions:
- `component.tsx` — universal (default)
- `component.web.tsx` — web-only override
- `component.native.tsx` — native-only override

### 5.3 Web-Specific Considerations

| Concern | Mobile | Web | Strategy |
|---|---|---|---|
| Maps | MapLibre GL Native | MapLibre GL JS | Platform-specific component |
| Offline storage | WatermelonDB (SQLite) | IndexedDB / localStorage | Abstract storage interface |
| Push notifications | expo-notifications | Web Push API | Separate notification layer |
| Background sync | expo-background-task | Service Worker | Separate sync strategy |
| File system | expo-file-system | Browser File API | Abstract file interface |
| Geolocation | expo-location | Browser Geolocation API | Same API, different impl |

### 5.4 Shared with Zuiio Monorepo

Tamga can consume existing `@zuiio/*` packages:
- `@zuiio/core` — formatting, validation, Mongolian business rules
- `@zuiio/export` — CSV, XLSX, DOCX, PDF generation
- `@zuiio/hooks` — useDebounce, useDisclosure, useFuzzySearch
- `@zuiio/ui` — form utilities, Mongolian phone/plate formatting
- `@zuiio/capture` — Sentry error capture wrapper

**Note:** React-specific packages (`@zuiio/hooks`, `@zuiio/ui`) work directly. Framework-agnostic packages (`@zuiio/core`, `@zuiio/export`, `@zuiio/capture`) work on both mobile and web.

---

## 6. Migration Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize Expo project in `apps/tamga/` with TypeScript
- [ ] Set up Expo Router v3 with file-based routing
- [ ] Configure NativeWind v5 with Tamga design tokens
- [ ] Set up WatermelonDB with first 5 schemas (Horse, HealthLog, User, Profile, SyncQueueItem)
- [ ] Set up Supabase client (`@supabase/supabase-js`)
- [ ] Set up MMKV for feature flags and preferences
- [ ] Set up expo-secure-store for auth tokens
- [ ] Configure Sentry (`@sentry/expo`)
- [ ] Set up monorepo integration with `@zuiio/*` packages

### Phase 2: Auth + Onboarding (Week 2-3)
- [ ] Port auth screens (login, phone, OTP, register) using Supabase Auth
- [ ] Port onboarding wizard (9 steps)
- [ ] Set up auth guard in Expo Router layout
- [ ] Port session management and re-auth flow

### Phase 3: Core Horse Module (Week 3-5)
- [ ] Port Horse domain model + WatermelonDB schema
- [ ] Port horse CRUD (add, edit, detail, registry)
- [ ] Port horse detail tabs (info, health, training, nutrition)
- [ ] Port CSV import functionality
- [ ] Port co-ownership and transfer features
- [ ] Port public horse profile

### Phase 4: Lineage + Health + Breeding (Week 5-7)
- [ ] Port lineage tree visualization (pedigree tree)
- [ ] Port inbreeding calculator
- [ ] Port health logs and reminders
- [ ] Port breeding records and gestation tracker
- [ ] Port foal registration

### Phase 5: Marketplace (Week 7-10)
- [ ] Port marketplace listings (CRUD, filters, search)
- [ ] Port listing detail with media gallery
- [ ] Port conversations and inbox (chat)
- [ ] Port seller profiles and verification
- [ ] Port saved searches and favorites
- [ ] Port price history and performance tracking
- [ ] Port moderation queue
- [ ] Port contracts and trial slots

### Phase 6: Maps + Lost Horse (Week 10-12)
- [ ] Port MapLibre integration with offline tiles (PMTiles)
- [ ] Port geofencing and alerts
- [ ] Port lost horse reporting with Mongolian admin locations
- [ ] Port nearby horses discovery
- [ ] Port location picker for events

### Phase 7: Events + Races + Social (Week 12-14)
- [ ] Port events (4 types, CRUD, registration, reminders)
- [ ] Port races (list, detail, registration, results)
- [ ] Port social features (breeder profiles, leaderboard)
- [ ] Port partner dashboard

### Phase 8: Analytics + AI + Payments (Week 14-16)
- [ ] Port analytics dashboard with Victory Native charts
- [ ] Port CSV/PDF export (using `@zuiio/export`)
- [ ] Port AI breeding advisor (same Supabase Edge Function)
- [ ] Port payment tiers and paywall
- [ ] Port feature flag gating

### Phase 9: Sync Engine + Background (Week 16-18)
- [ ] Port SyncEngine with exponential backoff
- [ ] Port SyncQueue with MMKV
- [ ] Set up background sync with expo-background-task
- [ ] Port conflict resolution screen
- [ ] Port sync settings and queue screen

### Phase 10: Polish + Web + Release (Week 18-20)
- [ ] Port all remaining screens and features
- [ ] Animation polish with Moti/Reanimated
- [ ] Performance optimization (lazy loading, memoization)
- [ ] Set up Expo Web export
- [ ] Platform-specific components for web (maps, storage, notifications)
- [ ] EAS Build configuration for iOS/Android
- [ ] App Store submission preparation

---

## 7. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| WatermelonDB schema migration (45 schemas) | High | Start with 5 core schemas, migrate incrementally |
| MapLibre PMTiles offline on RN | High | Prototype early, fallback to bundled MBTiles |
| Monorepo pnpm + Expo Metro config | Medium | Use established patterns from Expo docs |
| Web platform gaps (maps, background sync) | Medium | Abstract interfaces, platform-specific implementations |
| Performance regression vs Flutter | Low | New Architecture (JSI, Fabric) narrows the gap significantly |
| Supabase Realtime on web | Low | Same JS SDK works on both platforms |

---

## 8. Success Criteria

- [ ] All 22 feature modules functional on iOS and Android
- [ ] Offline-first: all CRUD operations work without network
- [ ] Sync engine with exponential backoff and conflict resolution
- [ ] MapLibre with offline tiles (PMTiles bundled)
- [ ] Push notifications working on both platforms
- [ ] App Store submission ready (iOS) + Play Store ready (Android)
- [ ] Web export functional (even if not feature-complete)
- [ ] All `@zuiio/*` packages consumed correctly
- [ ] TypeScript strict mode, zero `any` types
- [ ] Same Supabase backend, zero database migrations needed
