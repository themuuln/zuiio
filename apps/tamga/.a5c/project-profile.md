# Project Profile: Tamga

Offline-first Flutter + Supabase horse management app for Mongolia. Manages horse records, pedigree/lineage, health, breeding, events, marketplace, and co-ownership for Mongolian horse owners.

> Last updated: 2026-06-10T13:53:00.000Z | Version: 2

## Goals

- **quality** [high]: Build production-quality app with proper sync, auth, offline-first architecture from the start (active)
- **stability** [high]: Complete Phase 1: Local-First Stabilization (active)
- **feature** [high]: Implement multi-provider auth (Phone OTP primary, then Email/Password and OAuth) (active)
- **feature** [medium]: Implement sync queue with conflict resolution for offline-first data consistency (active)
- **launch** [high]: Prepare for beta testing and App Store submission (planned)

## Tech Stack

### Languages

- Dart v^3.10.3 (primary)
- TypeScript (Edge Functions)
- SQL (database migrations)

### Frameworks

- Flutter v^3.10.3 [mobile framework]
- Riverpod v^2.6.1 [state management]
- GoRouter v^16.0.0 [routing]
- Supabase Flutter SDK v^2.12.4 [BaaS client]
- Isar v^3.1.0+1 [local database]
- VitePress v^1.6.4 [documentation]
- MapLibre GL v^0.26.1 [maps]
- Firebase Core v^3.13.1 [push notifications]
- Firebase Messaging v^15.2.1 [push notifications]

### Databases

- PostgreSQL (relational)
- Isar (embedded) v^3.1.0+1
- SharedPreferences (key-value)

### Infrastructure

- Supabase Cloud [BaaS]
- Vercel [Documentation Hosting]
- GitHub [Source Control]

**Build tools:** flutter build, build_runner ^2.4.0, isar_generator ^3.1.0+1, flutter_launcher_icons ^0.14.3

**Package managers:** pub (flutter/dart), npm (docs site only)

## Architecture

**Pattern:** Clean Architecture with feature modules
**Data flow:** UI (Presentation) → Riverpod Provider (Application) → Repository (Data) → Local Isar Store + SyncQueue → Background SyncEngine → Supabase

### Modules

| Module | Path | Description |
|--------|------|-------------|
| horses | `lib/src/features/horses/` | Horse records CRUD, health logs, co-ownership, transfer, stamp tracing |
| lineage | `lib/src/features/lineage/` | Pedigree tree visualization, inbreeding calculator |
| market | `lib/src/features/market/` | Marketplace: buy/sell/lease, digital certificates, boost/VIP/badges |
| map | `lib/src/features/map/` | MapLibre GL, lost horse reports, geofencing, nearby horses |
| onboarding | `lib/src/features/onboarding/` | Multi-step onboarding, role selection, profile setup |
| events | `lib/src/features/events/` | Tournaments, races, competitions, exhibitions |
| breeding | `lib/src/features/breeding/` | Breeding records, gestation calculator |
| payments | `lib/src/features/payments/` | Subscription management, feature gating |
| auth | `lib/src/features/auth/` | Phone OTP, email/password, multi-provider auth |
| profile | `lib/src/features/profile/` | User profile, notification preferences |
| health | `lib/src/features/health/` | Health and farrier logs |
| documents | `lib/src/features/documents/` | Document vault |
| certificates | `lib/src/features/certificates/` | Digital ownership certificates |
| stable | `lib/src/features/stable/` | Stable/yard management |
| shared | `lib/src/features/shared/` | Isar schemas (15), pagination, shared models |
| shell | `lib/src/features/shell/` | Bottom navigation shell |
| search | `lib/src/features/search/` | Search screen |
| session | `lib/src/features/session/` | Session management |

**Entry points:** `lib/main.dart`

## Team

- **Temuulen Undrakhbayar** (Solo Developer / Frontend Developer): Full-stack Flutter development, UI/UX design, Backend (Supabase), Architecture, Testing

## Workflows

### development

Standard Flutter dev workflow
**Triggers:** manual

1. flutter pub get
2. flutter run

### schema-generation

Generate Isar schemas
**Triggers:** manual

1. dart run build_runner build --delete-conflicting-outputs

### testing

Run all unit and widget tests
**Triggers:** manual

1. flutter test

### documentation

VitePress docs dev/build/preview
**Triggers:** manual

1. npm run docs:dev

### tile-download

Download Mongolia PMTiles
**Triggers:** manual

1. ./scripts/download_mongolia_tiles.sh

### babysitter-sprints

Orchestrated phased development via Babysitter
**Triggers:** manual, AI agent invocation

### release-checklist

Pre-launch checklist from DEFERRED.md
**Triggers:** manual

## CI/CD

**Provider:** none

## Pain Points

- **high** [workflow]: No incremental git history — single bulk backup commit
- **medium** [code-quality]: Large files needing decomposition (horses_screen: 1224 lines)
- **medium** [architecture]: Double domain model (HorseRecord vs LineageHorse)
- **high** [workflow]: No branching strategy - all commits land on main with no feature isolation
- **medium** [workflow]: No release process or versioning - no tags, no CHANGELOG
- **medium** [architecture]: Triple repository pattern in market feature - incomplete migration
- **medium** [testing]: Test coverage sparse relative to feature velocity

## Bottlenecks

- No CI/CD pipeline at .github/workflows/ (always)
  Impact: Manual builds and tests
- app_router.dart central coupling point at lib/src/app/router/app_router.dart (6 commits)
  Impact: High - serial bottleneck for all features
- Market feature 4 repository files with tight coupling at lib/src/features/market/data/ (3 commits)
  Impact: High - incomplete migration

## Conventions

### Naming

- **files:** snake_case.dart
- **classes:** PascalCase
- **variables:** camelCase
- **constants:** k prefix
- **providers:** {name}Provider
- **repositories:** {Name}Repository
- **localRepositories:** local_{name}_repository.dart
- **supabaseRepositories:** supabase_{name}_repository.dart
- **sharedWidgets:** tamga_{name}.dart prefix

### Git

- **branchStrategy:** main with worktrees via Worktrunk
- **commitStyle:** conventional-commits
- **branchNaming:** feature/scope description
- **mainBranch:** main

**Import order:** dart: > flutter: > third-party > relative

**Error handling:** Result<T> sealed class (Ok/Fail) wrapping AppException with code, message, details. All repository methods return Future<Result<T>>.

**Testing:** flutter_test + mocktail, mirrors lib/ structure under test/, 52 test files

### Additional Rules

- Domain layer pure Dart only
- Each feature self-contained with domain/data/application/presentation
- Isar schemas in shared/data/isar_schemas/
- Doc comments on public APIs
- No commented-out code
- Test-before-commit: All new features and bug fixes must include tests. Run flutter test before committing.

## CLAUDE.md Instructions

- Follow Clean Architecture layer rules
- Use snake_case/PascalCase/camelCase conventions
- Use Riverpod for state management
- Use Result type for error handling
- Run flutter_test before marking complete
- Document public APIs with /// doc comments
- Test-before-commit: All new features and bug fixes must include tests

## Installed Extensions

- Processes: cradle/project-install
