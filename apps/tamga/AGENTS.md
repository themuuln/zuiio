# Tamga — Agent Instructions

> **Flutter + Supabase offline-first horse management app for Mongolia**

Load shared context from [root AGENTS.md](../../AGENTS.md) — especially Shared Context tables and Permission Boundaries.

## Core Rules

### Stack

- **Framework**: Flutter ^3.10.3, Dart ^3.10.3 (pinned in `pubspec.yaml`)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Riverpod ^2.6.1
- **Routing**: GoRouter ^16.0.0
- **Local DB**: Isar ^3.1.0+1 (15 schemas, fully integrated)
- **Docs**: VitePress (in `docs/`)

### Architecture — Clean Architecture (4 layers)

Each feature lives in `lib/src/features/{name}/` with `domain/`, `data/`, `application/`, `presentation/` subdirs.

**Layer imports** (non-inferable — strictly enforced):
- **Domain**: imports NOTHING from other layers (pure Dart — no Flutter, Supabase, or Riverpod)
- **Data**: imports Domain only
- **Application**: imports Domain + Data
- **Presentation**: imports Application + Domain (never Data directly)

### UI Component System — Shadcn Flutter Kit + Wind

Copy-paste shadcn workflow via `flutter_shadcn_cli`. 131 components under `lib/ui/shadcn/components/` as **owned source** (fully editable, not a library dependency).

| Package | Purpose |
|---------|---------|
| `shadcn_flutter` | Base shadcn theming for MaterialApp interop |
| `flutter_shadcn_cli` | CLI: `flutter_shadcn add <component>` |
| `fluttersdk_wind` | Tailwind-like utilities: `className="flex p-4 bg-primary-500"` |

**Design system bridge**:
- `lib/src/core/theme/tamga_design_system.dart` — unifies AppColors/AppTypography/AppSpacing with both shadcn and Wind themes
- `lib/src/core/theme/design_tokens.dart` — `TamgaColors` ThemeExtension for context access
- `lib/src/core/widgets/app_navigation_buttons.dart` — reusable button wrappers (`AppPrimaryButton`, `AppOutlineButton`, etc.)

**Import conventions**:
```dart
import 'package:tamga/ui/shadcn/shadcn.dart';                                        // barrel
import 'package:tamga/ui/shadcn/components/control/button/button.dart';               // single component
import 'package:fluttersdk_wind/fluttersdk_wind.dart';                                // Wind utilities
```

Adding components: `flutter_shadcn add button badge dialog` (copies source into `lib/ui/shadcn/`).
Known failure: `markdown` — broken registry dependency, skipped.

### Error Handling

Use `Result` type from `lib/src/core/error/result.dart` with `AppException`. No raw throws in data layer.

### Code Style

- Doc comments (`///`) on all public classes and methods
- `// ── Section ──` dividers for visual grouping
- No commented-out code (git remembers)
- **Bilingual UI text** (Mongolian + English) — domain requirement, not optional



## Commands, Testing & Tooling

- **Every new feature MUST ship automated tests** — see the 4-layer test contract in `docs/agent-reference.md` (this is a gate, not a suggestion).
- Commands, local Supabase setup, Marionette (AI UI testing), and Maestro (black-box regression) references live in `docs/agent-reference.md` — load when relevant.

## Permission Boundaries

### ✅ Always
- Read nearest `AGENTS.md` and source/tests being changed
- Use `flutter test` (not `dart test`) for widget/integration tests
- Preserve Isar schema migrations and cloud sync invariants
- Run `dart analyze --fatal-infos` before committing
- Regenerate Isar schemas after model changes (`build_runner build`)
- Keep bilingual UI strings (Mongolian primary, English fallback)

### ⚠️ Ask First
- Add, remove, or upgrade dependencies (`pubspec.yaml` changes)
- Apply Supabase migrations or modify production data
- Change authentication, authorization, RLS, or tenant-scoping
- Modify Isar schemas (affects all local data and sync)
- Change financial, marketplace, or horse ownership semantics
- Introduce breaking API changes to shared models

### 🚫 Never
- Commit secrets, credentials, `.env` files, or service-role keys
- Bypass RLS or omit organization scoping in queries
- Expose Supabase service-role credentials to client code
- Manually edit generated Isar schema files
- Disable tests/lint rules or add broad suppressions
- Run destructive SQL or production data repairs without approval
- Force-push the default branch

## On-Demand Documentation

Deeper docs in `docs/` — load only when relevant:
- `docs/architecture.md` — detailed technical architecture
- `docs/database.md` — Supabase schema reference
- `docs/features/` — per-feature deep dives (business rules, user flows)
- `docs/design.md` — brand and visual direction
- `docs/product.md` — product vision and roadmap
- `test/README.md` — test guide: conventions, mocks, Isar setup, integration tests, Maestro flows

**Testing skills** (load before writing tests):
- `skill://tamga-riverpod-testing` — Tamga Riverpod test conventions (ProviderContainer / ProviderScope / mocktail)
- `skill://dart-add-unit-test`, `skill://flutter-add-widget-test`, `skill://flutter-add-integration-test` — official Flutter testing skills (project-level in `.agents/skills/`)

**Package APIs change across versions. Always use current docs, never training data.**


### Flutter Semantics Note

Flutter concatenates all visible text on a screen into a few **combined accessibility nodes** (e.g. a title + subtitle become one node `"Таны үүрэг\nТа ямар хүн бэ?"`). This means Maestro's `text:` matcher — which is a **full-string regex** — cannot match a substring directly.

Use `.*<pattern>.*` regex patterns for text inside combined nodes:
```yaml
- assertVisible:
    text: ".*Таны үүрэг.*"
```

Individually targetable nodes (separate from the combined text block):
- Buttons (`"Эхлэх"`, `"Үргэлжлүүлэх"`)
- The root app label (`"Tamga"`)

### Authoring Flows

For Flutter, Maestro uses the **semantics tree**. `Text` widgets are automatically discoverable. For custom-painted or icon-only elements, add `Semantics()` wrappers:

```dart
Semantics(
  label: 'add_horse',
  child: MyCustomIconButton(onPressed: ...),
)
```

Then target them in flows:
```yaml
- tapOn:
    id: "add_horse"
```

### Maestro + Marionette — How They Fit Together

| Tool | Role | When |
|------|------|------|
| **Unit/Widget tests** (`flutter test`) | Logic + component regression | Every feature, every PR — `make check` |
| **Integration tests** (`integration_test/`) | Real app tree on device | Critical flows, `make integration-test` |
| **Marionette** | AI-agent exploration & debug | During dev, ad-hoc smoke tests, discovering semantics for flows |
| **Maestro** | Deterministic black-box UI gate | CI/CD, every PR, release verification |

Use Marionette to explore and debug. Use Maestro to guarantee nothing regresses. Use `flutter test` for everything below the UI layer.
