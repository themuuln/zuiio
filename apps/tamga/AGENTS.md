# AGENTS.md — Tamga Project Configuration

> Project: Tamga — Flutter + Supabase offline-first horse management app for Mongolia

---

## Project Overview

- **Framework**: Flutter ^3.10.3, Dart ^3.10.3
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Riverpod ^2.6.1
- **Routing**: GoRouter ^16.0.0
- **Local DB**: Isar ^3.1.0+1 (15 schemas, fully integrated)
- **Docs**: VitePress (in `docs/`)

---

## UI Component System — Shadcn Flutter Kit + Wind

The app uses a **copy-paste shadcn workflow** via `flutter_shadcn_cli`.
131 shadcn-style components are installed under `lib/ui/shadcn/components/` as **owned source** (fully editable, not a library dependency).

### Key packages
| Package | Purpose |
|---------|---------|
| `shadcn_flutter` (pub package) | Base shadcn theming layer for MaterialApp interop |
| `flutter_shadcn_cli` | CLI: `flutter_shadcn add <component>` — copy-paste components into `lib/ui/shadcn/` |
| `fluttersdk_wind` | Tailwind-like utility classes: `className="flex p-4 bg-primary-500"` |

### Design system bridge
- `lib/src/core/theme/tamga_design_system.dart` — unifies Tamga's `AppColors`/`AppTypography`/`AppSpacing` with both shadcn theme (`TamgaDesignSystem.buildThemeData()`) and Wind (`TamgaDesignSystem.buildWindThemeData()`)
- `lib/src/core/theme/design_tokens.dart` — `TamgaColors` ThemeExtension for accessing design tokens via context
- `lib/src/core/widgets/app_navigation_buttons.dart` — reusable wrappers (`AppPrimaryButton`, `AppOutlineButton`, etc.)

### Import conventions
```dart
// Barrel import for all components
import 'package:tamga/ui/shadcn/shadcn.dart';

// Single component (lighter)
import 'package:tamga/ui/shadcn/components/control/button/button.dart';

// Wind utility classes
import 'package:fluttersdk_wind/fluttersdk_wind.dart';
```

### Adding new components
```bash
flutter_shadcn add button badge dialog  # copies source into lib/ui/shadcn/
```

### Failed components (registry issues)
- `markdown` — broken registry dependency, skipped

---
---

## Architecture

Clean Architecture with 4 layers per feature module:
1. **Domain** — Pure Dart models (NO Flutter/Supabase/Riverpod imports)
2. **Data** — Repository interfaces + local/remote implementations
3. **Application** — Riverpod providers and use-cases
4. **Presentation** — Screens, widgets

### Layer Rules
- Domain imports nothing from other layers
- Data imports Domain only
- Application imports Domain + Data
- Presentation imports Application + Domain (NOT Data directly)

### Features
Each feature lives in `lib/src/features/{name}/` with `domain/`, `data/`, `application/`, `presentation/` subdirs.

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `snake_case.dart` | `horses_providers.dart` |
| Classes | `PascalCase` | `HorseRecord`, `HealthLog` |
| Variables/functions | `camelCase` | `lineageRootId` |
| Constants | `camelCase` with `k` prefix | `kMaxHorses` |
| Providers | `{name}Provider` | `horsesProvider` |
| Repositories | `{name}Repository` | `HorsesRepository` |

---

## Import Order

1. `dart:` imports
2. `flutter:` imports
3. Third-party packages
4. Relative imports

---

## Error Handling

Use the `Result` type pattern from `lib/src/core/error/result.dart` with `AppException`. No raw throws in data layer.

---

## Code Style

- Doc comments (`///`) on all public classes and methods
- `// ── Section ──` dividers for visual grouping
- No commented-out code (git remembers)
- Bilingual UI text (Mongolian + English)

---

## Testing

```bash
flutter test                           # All tests
flutter test test/features/horses/     # Feature-specific
dart run build_runner build --delete-conflicting-outputs  # Isar schema gen
```

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:

| Workflow | File | Trigger | What it does |
|----------|------|---------|--------------|
| **CI** | `ci.yml` | PR to `main` | Flutter version pinned via `flutter-version-file` → `dart format --check` → `dart analyze --fatal-infos` → `flutter test --test-randomize-ordering-seed=random` |
| **Android** | `android.yml` | Push to `main` | Quality gate (format + analyze + test) → build APK (split-per-abi) → upload as artifact (30-day retention) |
| **Release** | `release.yml` | Tag `v*` | Quality gate → build APK (universal + split) + AAB → create GitHub Release with all artifacts |

Caching strategy: `~/.pub-cache` + `.dart_tool` keyed by OS + `pubspec.lock` hash, with `pub-${{ runner.os }}-` and `pub-` fallback chains.

### Pre-commit hooks

Enabled via `git config core.hooksPath .githooks`. Runs before every commit:

1. `dart format --output=none --set-exit-if-changed .`
2. `dart analyze --fatal-infos`
3. `flutter test` on changed files (fast path)

Install on clone:
```bash
make setup-hooks
```

### Manual CI check
```bash
make check          # format-check + analyze-strict + test-random
```

### Release flow
```bash
git tag v1.2.3
git push origin v1.2.3    # triggers release workflow
```

Artifacts from the release workflow include universal APK, per-ABI APKs, and AAB — suitable for sideload distribution.

### Flutter version pinning

The exact Flutter SDK version is declared in `pubspec.yaml`:
```yaml
environment:
  sdk: ^3.10.3
  flutter: 3.44.2
```
Workflows use `subosito/flutter-action` with `flutter-version-file: pubspec.yaml` to read it automatically.

---

## Babysitter

This project uses [babysitter](https://github.com/a5c-ai/babysitter) for project orchestration.

### Installed Processes

| Process | Purpose |
|---------|---------|
| `cradle/project-install` | Project onboarding and setup |

### Recommended Methodology

- **gsd** (Get Stuff Done) — Use for all phased development work
- **iterative convergence** — Use for complex refactoring (Isar migration, domain model consolidation)

### Recommended Skills

- `diagnose` — Debugging offline sync and Isar migration issues
- `karpathy-guidelines` — Prevent overcomplication, keep changes surgical
- `ui-ux-pro-max` — Maintain the iOS-inspired Mongolian earth tone design

### Key Commands

```bash
# List active process library
babysitter process-library:active --json

# Read project profile
babysitter profile:read --project --json

# Write project profile
babysitter profile:write --project --input .a5c/project-profile.json --json
```

### Project Pain Points (Address)

1. ~~Phone auth UI~~ ✅ **Fixed**: Phone input screen is fully built (`phone_login_screen.dart`), OTP flow complete.
2. ~~horses_screen~~ ✅ **Fixed**: Screen has been decomposed to 117 lines, delegates to `horses_registry_tab.dart`.
3. ~~Co-ownership sync~~ ✅ **Fixed**: Cloud sync is implemented (`SupabaseCoOwnershipRepository`, `syncCoOwnership()` in coordinator).
4. **Protomaps tiles**: Download instructions documented, actual MBTiles not yet bundled
5. **Lineage data**: `LocalLineageRepository` is seed data; needs `SupabaseLineageRepository` for real horses

---

### Feature Status

| Feature | Status |
|---|---|
| Horse records, lineage, inbreeding | ✅ Built | Photo avatars, stat chips, panel animation added |
| Health & farrier logs | ✅ Built |
| Events/tournaments | ✅ Built |
| Local storage (Isar 15 schemas) | ✅ Built |
| Sync queue + cloud sync | ✅ Built |
| Marketplace (buy/sell/lease) | ✅ Built |
| Marketplace revenue (boost/VIP/badges) | ✅ Built |
| Digital certificates | ✅ Built |
| Breeding tools (gestation tracker) | ✅ Built |
| Co-ownership | ✅ Built | Fully synced with Supabase |
| Map & lost horse finder | ✅ Built |
| Document vault | ✅ Built |
| Push notification triggers | ✅ Built |
| Pagination (infinite scroll) | ✅ Built |
| Phone auth (OTP) | ✅ Built | Backend + UI complete |
| Multi-provider auth | ✅ Built | Google/Apple sign-in (code ready, needs Firebase config) |
| Horse transfer | ✅ Built | Ownership registration with verification |
| Public tournament profiles | ✅ Built | Tournament results for marketplace trust |

---

## Documentation as Source of Truth (Second Brain)

**The VitePress docs (`docs/`) are the canonical second brain for Tamga.**
All project knowledge — product decisions, business rules, marketing strategy, technical architecture, financials — lives here.

### Rules

1. **After every feature implementation or update**, update the relevant doc(s) in `docs/`. No exceptions.
2. **Before starting work**, check if a doc already covers the area. Build on existing docs, don't duplicate.
3. **When making a decision**, record it in the appropriate doc (not just in code comments or chat).
4. **Run `npm run docs:build`** after doc changes to verify no broken links.

### What to update and when

| Change type | Doc to update |
|---|---|
| New feature built | `features/` subfolder or relevant doc (product, roadmap) |
| Feature modified | Same doc + update feature status table |
| Pricing change | `pricing.md`, `finance.md` |
| Design/token change | `design.md`, `design-system-palette.md` |
| Schema change | `database.md` |
| Architecture change | `architecture.md`, `tech-stack.md` |
| Marketing/launch | `marketing.md`, `store-listing.md`, `store-metadata.md` |
| Legal/privacy | `legal.md`, `privacy-policy.md` |
| Sprint progress | `sprint-plan.md` |
| Onboarding flow | `onboarding-design.md` |

### Doc structure

- `docs/.vitepress/config.mts` — Site config, sidebar, nav
- `docs/.vitepress/theme/` — Hermes color theme
- `docs/index.md` — Landing page (hero + feature cards)
- `docs/features/` — Per-feature deep dives (business rules, user flows, status)

---

## Related Documentation

- [Tech Stack](docs/tech-stack.md) — Technology decisions and conventions
- [Architecture](docs/architecture.md) — Detailed technical architecture
- [Product](docs/product.md) — Product vision and roadmap
- [Design](docs/design.md) — Brand and visual direction
- [Database](docs/database.md) — Supabase schema reference
