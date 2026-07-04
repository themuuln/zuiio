---
title: Tech Stack — Technology Decisions
description: Every technology choice in Tamga, why it was chosen, and the conventions for using it. Canonical reference for developers.
---

# Tech Stack — Technology Decisions

> Every technology choice has a reason. This document records what we use, why, and the rules for using it.

---

## Core Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| **Framework** | Flutter | SDK ^3.10.3 | Single codebase for iOS + Android; Dart's type system; strong offline-first story |
| **Language** | Dart | ^3.10.3 | Null-safe, strong typing, async/await native, hot reload |
| **Backend** | Supabase | ^2.12.4 (Flutter SDK) | Open-source Firebase alternative; Postgres native; built-in auth, storage, realtime |
| **Database** | PostgreSQL (via Supabase) | — | RLS policies, full SQL, JSON support, mature ecosystem |
| **State Management** | Riverpod | ^2.6.1 | Compile-safe providers, testable, no BuildContext required |
| **Routing** | GoRouter | ^16.0.0 | Declarative routes, shell routes for bottom nav, deep link support |
| **Local Storage** | SharedPreferences → **Hive** (migration planned) | — | Phase 1 migration from SharedPreferences (6MB limit) to Hive (unlimited, binary, fast) |

---

## Why Flutter Over Expo (React Native)

This was an explicit decision. Summary:

| Factor | Flutter | Expo (React Native) |
|---|---|---|
| **Offline-first** | Hive/Isar = native binary local DB | AsyncStorage = limited for complex data |
| **Performance** | Compiled to ARM, no JS bridge | JS bridge overhead |
| **Pedigree tree** | Dart isolates for complex layout | JS thread limitations |
| **Supabase SDK** | Mature `supabase_flutter` | `supabase-js` works but less integrated |
| **Existing codebase** | Deep investment (architecture, Riverpod, clean layer separation) | Rewrite from scratch |

**Decision: Flutter.** See [product.md](./product.md) for the full reasoning.

---

## Dependency Map

### Production Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8          # iOS-style icons
  flutter_dotenv: ^5.2.1            # Environment variables (.env)
  flutter_riverpod: ^2.6.1          # State management
  go_router: ^16.0.0                # Declarative routing
  shared_preferences: ^2.5.3        # Key-value storage (settings, being replaced)
  supabase_flutter: ^2.12.4         # Supabase backend
  font_awesome_flutter: ^11.0.0     # Extended icon set
```

### Dev Dependencies

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0             # Lint rules
```

### Planned Additions (Phase 1–2)

| Package | Purpose | Phase |
|---|---|---|
| `hive` + `hive_flutter` | Structured local storage | Phase 1 |
| `isar` (alternative to Hive) | High-performance local DB | Phase 1 (evaluate both) |
| `flutter_secure_storage` | Encrypted token storage | Phase 1 |
| `connectivity_plus` | Network state monitoring | Phase 2 |
| `flutter_local_notifications` | Local reminder scheduling | Phase 2 |
| `firebase_messaging` | Push notifications (FCM) | Phase 2 |
| `revenue_cat_flutter` | In-app purchases, subscriptions | Phase 3 |
| `supabase_storage` | Document vault | Phase 3 |

---

## Architecture — Clean Architecture Layers

```
lib/src/
├── app/                    # App shell, config, theme, router
├── core/                   # Cross-cutting: errors, sync, storage, network
├── features/               # Feature modules (each self-contained)
│   ├── horses/
│   │   ├── domain/         # Entities, value objects, business rules
│   │   ├── data/           # Repositories (interface + local + remote)
│   │   ├── application/    # Riverpod providers, use-cases
│   │   └── presentation/   # Screens, widgets
│   ├── lineage/
│   ├── health/
│   ├── breeding/
│   ├── events/
│   ├── market/
│   ├── profile/
│   ├── search/
│   └── shell/              # App shell with bottom nav
└── shared/                 # Shared domain models, utilities
```

### Layer Rules

| Layer | Can Import | Cannot Import |
|---|---|---|
| **Domain** | Nothing (pure Dart) | Flutter, Supabase, Riverpod |
| **Data** | Domain | Presentation, Application |
| **Application** | Domain, Data | Presentation |
| **Presentation** | Application, Domain | Data (directly — only via providers) |

### Adding a New Feature

1. `lib/src/features/{name}/domain/` — Entity class
2. `lib/src/features/{name}/data/` — Repository interface + local implementation
3. `lib/src/features/{name}/application/` — Riverpod providers
4. `lib/src/features/{name}/presentation/` — Screens, widgets
5. Register route in `app/router/app_router.dart`

---

## Design System

### Visual Language

**iOS-inspired minimal design with Mongolian earth tones.**

- Clean neutrals for backgrounds (system grouped background style)
- Warm earth accent (saddle brown `#8C6E4A`) as primary identity
- iOS system colors for interactive/semantic states
- Flat surfaces with hairline separators (no elevation/shadows)

### Typography

iOS Dynamic Type scale using system fonts:
- **SF Pro** on iOS, **Roboto** on Android
- Weights: Regular (400), Medium (500), Semibold (600)
- Sizes: 34 (Large Title) → 11 (Caption 2)

### Spacing

4pt base grid, 8dp standard unit:
- `xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32`
- Screen padding: 16dp horizontal
- Corner radius: 13pt (iOS standard), 8pt (compact), pill (999)

### Colors

| Token | Hex | Usage |
|---|---|---|
| `earthBrown` | `#8C6E4A` | Primary brand — buttons, active states |
| `earthTan` | `#D4B896` | Containers, fills |
| `earthPale` | `#F5EDE4` | Subtle highlights, primary container |
| `earthDark` | `#3D2E1F` | Text on light backgrounds |
| `sageGreen` | `#6B8F6B` | Secondary accent (steppe grass) |
| `systemBlue` | `#007AFF` | Links, interactive |
| `systemGreen` | `#34C759` | Success states |
| `systemRed` | `#FF3B30` | Errors, destructive actions |
| `systemOrange` | `#FF9500` | Warnings |

Full theme: `lib/src/app/theme/`

---

## Backend Architecture (Supabase)

### Services Used

| Service | Purpose |
|---|---|
| **PostgreSQL** | All structured data (horses, health, lineage, marketplace) |
| **Auth** | Anonymous → Phone OTP → Email/Password → OAuth |
| **Storage** | Horse photos, documents, marketplace media |
| **Realtime** | Live sync across devices, notification triggers |
| **Edge Functions** | Server-side subscription enforcement, FCM push |

### RLS (Row-Level Security)

Every table has RLS policies. Core rule:
- Users see their own data
- Co-owners see shared horses
- Marketplace listings are publicly readable (published status only)

### Sync Strategy

```
WRITE: UI → Repository → Local Store → Sync Queue → Background Sync → Supabase
READ:  Repository → Local Store (instant) → Background refresh if stale
```

Conflict resolution: Last-write-wins (default), timestamp merge (horse records), manual (co-ownership).

---

## Coding Conventions

### Naming

| Element | Convention | Example |
|---|---|---|
| Files | `snake_case.dart` | `horses_providers.dart` |
| Classes | `PascalCase` | `HorseRecord`, `LineageRoot` |
| Variables/functions | `camelCase` | `lineageRootId`, `fetchHorses()` |
| Constants | `camelCase` (Dart) | `kMaxHorses` |
| Private members | `_prefix` | `_buildTree()` |
| Providers | `{name}Provider` | `horsesProvider`, `lineageRootsProvider` |
| Repositories | `{name}Repository` | `HorsesRepository`, `LocalHorsesRepository` |
| Domain models | Nouns | `Horse`, `HealthRecord`, `BreedingRecord` |

### File Organization Per Feature

```
features/{name}/
├── domain/
│   └── {entity}.dart           # Pure Dart model
├── data/
│   ├── {name}_repository.dart  # Abstract interface
│   └── local_{name}_repository.dart  # Local implementation
├── application/
│   └── {name}_providers.dart   # Riverpod providers
└── presentation/
    ├── {name}_screen.dart      # Full screen
    └── {name}_widget.dart      # Reusable widget
```

### Import Order

1. `dart:` imports
2. `package:flutter/` imports
3. Third-party packages
4. Relative imports (within feature)

### Comments

- Doc comments (`///`) on all public classes and methods
- `// ── Section ──` dividers for visual grouping within files
- No commented-out code — delete it (git remembers)

---

## Environment Setup

### Prerequisites

```bash
# Flutter SDK
flutter --version   # ^3.10.3

# Dart SDK (bundled with Flutter)
dart --version

# Supabase CLI (for migrations)
supabase --version
```

### Getting Started

```bash
# Clone
git clone <repo-url>
cd tamga

# Install dependencies
flutter pub get

# Environment variables
cp .env.example .env
# Edit .env with Supabase URL + anon key

# Run
flutter run
```

### Environment Variables

| Variable | Source | Description |
|---|---|---|
| `SUPABASE_URL` | Supabase dashboard | Project URL |
| `SUPABASE_ANON_KEY` | Supabase dashboard | Public API key |
| `APP_ENV` | Manual | `development`, `staging`, `production` |

---

## Testing

### Test Pyramid

| Level | Scope | Tool | Location |
|---|---|---|---|
| **Unit** | Domain models, calculators, validators | `flutter_test` | `test/features/{name}/` |
| **Repository** | Local + remote with mocked Supabase | `mocktail` | `test/features/{name}/` |
| **Widget** | Screens with overridden providers | `flutter_test` | `test/features/{name}/` |
| **Integration** | Full flow with Supabase emulator | `integration_test` | `integration_test/` |
| **E2E** | User journeys on real device | `patrol` / `codemagic` | `integration_test/` |

### Running Tests

```bash
# All tests
flutter test

# Specific feature
flutter test test/features/horses/

# Integration tests
flutter test integration_test/
```

---

## Build & Deploy

| Target | Command | Notes |
|---|---|---|
| iOS dev | `flutter run` | Requires macOS + Xcode |
| Android dev | `flutter run` | Requires Android Studio |
| iOS release | `flutter build ipo` | For App Store submission |
| Android release | `flutter build appbundle` | For Play Store submission |
| Web (future) | `flutter build web` | If web support needed |

### CI/CD

- **Codemagic** (planned) — automated iOS/Android builds
- **Supabase CLI** — database migrations via `supabase db push`

---

## Related

- [Product](./product.md) — what we're building and why
- [Database](./database.md) — schema reference
- [Design](./design.md) — brand and visual direction
- [Development](./development.md) — contributing guide
- [Architecture](./architecture.md) — detailed technical architecture
