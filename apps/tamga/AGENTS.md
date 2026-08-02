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

## Commands

```bash
./dev.sh                                                          # Dev server with local .env
flutter build apk                                                  # Build APK
flutter test                                                       # All tests
flutter test test/features/horses/                                 # Feature-specific
dart analyze --fatal-infos                                          # Lint (strict)
dart format --set-exit-if-changed .                                # Format check
dart run build_runner build --delete-conflicting-outputs           # Isar schema gen (required after model changes)
make check                                                         # Full gate: format-check + analyze + test
make integration-test [device=<udid>]                              # On-device integration tests (flutter drive)
make maestro-smoke [device=iPhone-17]                              # Maestro smoke flow
make maestro-onboarding [device=iPhone-17]                         # Maestro onboarding flow
make maestro-check [device=iPhone-17]                              # Full gate + all Maestro flows
make setup-hooks                                                   # Install pre-commit hooks
```

### Local Supabase Configuration

The Flutter app loads Supabase configuration from `.env` at runtime. Do not
use `--dart-define` for normal local development.

Required variables:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are also accepted. Run
`./dev.sh` to temporarily bundle `.env` as a Flutter asset before launching.
The app can launch offline without `.env`, but Supabase-backed features will be
disabled.

Only the publishable/anon key belongs in the app. Never put a Supabase
secret/service-role key in `.env`, Flutter assets, client code, or commits.

Pre-commit hooks run on every commit via `.githooks`: `dart format --check` → `dart analyze --fatal-infos` → `flutter test` on changed files.

Flutter version pinned via `subosito/flutter-action` using `flutter-version-file: pubspec.yaml`.

## Testing — Required for Every New Feature

Every feature MUST ship with automated tests, layered by what the change touches. This is a gate, not a suggestion.

### The 4-layer test contract

| Change touches | Required tests | Where | Pattern to follow |
|---|---|---|---|
| Domain logic (models, enums, calculators) | Unit tests — pure Dart, no widgets | `test/features/<name>/domain/` | `dart-add-unit-test` skill, `test/shared/domain/horse_test.dart` |
| Providers / notifiers / repositories | Provider tests via `ProviderContainer` + mocktail | `test/features/<name>/application/`, `.../data/` | `tamga-riverpod-testing` skill, `test/features/auth/auth_state_notifier_test.dart` |
| Widgets / screens | Widget tests via `ProviderScope` + mocktail | `test/features/<name>/presentation/` | `flutter-add-widget-test` skill, `test/features/auth/presentation/login_screen_test.dart` |
| User-visible end-to-end flow | Maestro flow (black-box) + optional `integration_test/` | `test/maestro/<feature>.yaml`, `integration_test/` | existing flows in `test/maestro/` |

### Rules of engagement

1. **Run `make check` before declaring done** — format + analyze + full randomized test suite must be green (or pre-existing failures only, verified as pre-existing).
2. **Write tests while building**, not after — every new file under `lib/` should land with its matching `_test.dart`.
3. **Follow existing conventions** — `mocktail` (not mockito), `ProviderContainer`/`ProviderScope`, `Result<T>` error paths, AAA structure, behavior-named tests. Read `test/README.md` and `skill://tamga-riverpod-testing` first.
4. **UI-visible features get a Maestro flow** — if a user can navigate to it, add `test/maestro/<feature>.yaml` and register it in the table below.
5. **Use the installed Flutter testing skills** (project-level, `.agents/skills/`): `dart-add-unit-test`, `flutter-add-widget-test`, `flutter-add-integration-test`.
6. **Integration tests** run via `flutter drive` on a device (`make integration-test`) — use for critical paths that need the real app tree; don't overuse (slow, needs a booted simulator).
7. **Isar/model changes** → run `dart run build_runner build --delete-conflicting-outputs` and regenerate test mocks.

### Onboarding completion — resolved (2026-08-01, re-verified 2026-08-02)

Onboarding completes end-to-end: `NotificationPage` advances to the sync page, and `SyncSetupPage.onStart/onLater` call `_finishOnboarding()` → `complete()` → the `onCompleted` seam (`app_router.dart` wires `OnboardingScreen(onCompleted: () => ctx.go('/home'))`). Full Maestro flows MAY tap past the notification page — `13-lost-livestock-recovery.yaml` does exactly that (notification skip → sync later → home).

**Consequence for tests:** if `onboarding.yaml` or `13-lost-livestock-recovery.yaml` starts failing at the notification/sync steps again, treat it as a regression of the completion seam — do not stop authoring flows at the notification page.

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

## AI-Assisted UI Testing — Marionette

The app has [Marionette](https://pub.dev/packages/marionette_flutter) wired in for AI-driven UI testing. `MarionetteBinding` is initialized in debug mode (skipped under `flutter test`) with:
- `isInteractiveWidget` recognizing shadcn `Button` as interactive
- `PrintLogCollector` capturing app logs via a `debugPrint` tee

### OMP Setup — MCP Server

The marionette MCP server is registered in `apps/tamga/.omp/mcp.json` (project-level config):
```json
"marionette": {
  "type": "stdio",
  "command": "marionette_mcp",
  "args": [],
  "env": {}
}
```

This gives the AI agent tools to inspect and interact with the running Flutter app — tap, scroll, type, screenshot, get-logs.

The Marionette CLI and MCP binary must be available on `$PATH`. The global
`tmario`/`tmattach` commands prepend `$HOME/.pub-cache/bin` in `.zshrc`; a
new shell or `source ~/.zshrc` is required after setup.

### CLI Usage (for scripts and manual testing)

```bash
marionette register <name> <ws_uri>          # Register an app instance
marionette get-interactive-elements -i <name>  # List UI elements
marionette tap -i <name> --text "Текст"        # Tap by visible text
marionette tap -i <name> --type Button         # Tap by widget type
marionette enter-text -i <name> --text "ввод" --focused-element  # Type into focused field
marionette scroll-to -i <name> --text "Текст"  # Scroll until text visible
marionette take-screenshots -i <name> --output /tmp/shot.png
marionette get-logs -i <name>                  # Retrieve app logs
marionette press-back-button -i <name>         # Navigate back
marionette hot-reload -i <name>                # Hot reload
```

### Automatic local commands

```bash
flutter run [flutter options]                 # In apps/tamga: auto-registers Marionette
tmario [device] [flutter run options]         # Explicit equivalent
tmattach [http://.../ | ws://.../ws]          # Attach without stopping an existing app
make marionette-attach                        # Use the published URI file
```

Inside `apps/tamga`, the global `flutter run` alias delegates to the Marionette
runner. It loads `.env`, uses `--no-dds`, forwards Flutter run arguments, waits
for the binding, and writes `/tmp/tamga-marionette-tamga.uri`. Outside Tamga,
the existing DTD-enabled Flutter alias is preserved.

### Automated Smoke Test

Run the smoke test against a running debug build:

```bash
make marionette-smoke uri=ws://127.0.0.1:XXXXX/XX/ws
```

Or use the script directly:
```bash
scripts/marionette-smoke.sh -u ws://127.0.0.1:XXXXX/XX/ws
```

The smoke test:
1. Registers the app instance and accepts either an onboarding screen or an already-onboarded Home screen.
2. Calls `get-interactive-elements` — fails if fewer than 3 lines are returned.
3. On onboarding, taps "Эхлэх" and verifies "Үргэлжлүүлэх".
4. On Home, verifies the greeting plus "Хайх" and "Профайл" header controls.
5. Captures a screenshot and log snapshot.
6. Unregisters the temporary instance.

### Workflow — Zero-touch (Agent manages everything)

**Best for agent-driven testing.** Just tell the agent what to test:

> "Run the app and test the onboarding flow"

The agent internally:
1. Starts `flutter run` (or detects an already-running Tamga process).
2. Reads `/tmp/tamga-marionette-tamga.uri` or runs `make marionette-uri`.
3. Immediately calls Marionette MCP `connect` with that URI — never asks the user to paste it.
4. Verifies interactive elements, takes a screenshot, and reads logs.
5. Performs the requested interaction.

No URI copying or `tmattach` step is required for the normal Tamga workflow.

### Workflow — One-command (User runs, agent discovers)

```bash
cd ~/coding/zuiio/apps/tamga
flutter run
```

The agent automatically reads the published URI and connects Marionette on the
next testing/tool turn. Use `tmario` only when you want an explicit Tamga
launcher outside the normal `flutter run` flow.

### Workflow — Manual attach

```bash
tmattach http://127.0.0.1:XXXXX/TOKEN/
```

Use `tmattach` only for a Flutter process that was started outside the Tamga
wrapper or when reconnecting after the URI file was removed.

### Creating Regression Tests

**Every new user-visible feature gets a Maestro flow** (deterministic, black-box, runs in CI). Add `test/maestro/<feature>.yaml`:

1. Model it on `test/maestro/smoke.yaml` / `onboarding.yaml` (same `appId: com.tamga`, `launchApp` + `clearState`).
2. Follow the [Flutter Semantics Note](#flutter-semantics-note) — use `.*regex.*` for combined text nodes, plain text for buttons.
3. For custom-painted/icon-only widgets, add `Semantics(label: 'my_widget', child: ...)` wrappers so flows can target them by `id`.
4. Add the flow to the table above and (optionally) to `make maestro-check`.
5. For critical multi-step flows needing the real app tree, add a Dart test under `integration_test/` instead (see `onboarding_flow_test.dart` + `test_driver/integration_test.dart`, run via `make integration-test`).

Marionette remains the ad-hoc exploration tool — use it during development to discover semantics/texts and validate flows before committing them as Maestro.

## Maestro — Black-Box UI Regression Testing

[Maestro](https://maestro.dev) provides system-level, cross-platform UI testing that works against the compiled app (no code changes needed). It interacts via the **OS accessibility/semantics layer**, so it tests what the user actually sees and touches.

### Key Features

- **Zero app deps** — no pubspec changes, tests the compiled APK/IPA
- **Cross-platform** — same YAML flows run on iOS, Android, Web
- **Semantics-based** — finds elements by visible text, accessibility IDs, position
- **Auto-waits** — built-in retries and animation waits reduce flakiness
- **Maestro Cloud** — run tests in parallel on real device farms
- **Studio** — visually author and debug flows

### Test Flows

Flows live in `test/maestro/`:

| Flow | File | What it tests |
|------|------|------|
| Smoke | `smoke.yaml` | App launches, title/cards/social proof visible |
| Onboarding | `onboarding.yaml` | Landing → role selection → option visibility → advances to region |
| Lost livestock recovery | `13-lost-livestock-recovery.yaml` | Recovery wizard end-to-end (offline-first) |

> The recovery flow taps through onboarding completion (notification skip → sync later → home); if it fails at those steps, see [Onboarding completion — resolved](#onboarding-completion--resolved-2026-08-01-re-verified-2026-08-02).

### Usage

```bash
# Run smoke test on the default available device
make maestro-smoke

# Run on a specific simulator device
make maestro-smoke device="iPhone-17"

# Run the onboarding flow test
make maestro-onboarding device="iPhone-17"

# Full gate: format + analyze + test + Maestro smoke + onboarding
make maestro-check device="iPhone-17"

# On-device integration tests (flutter drive)
make integration-test device=<udid>
```

### CI

Maestro flows run in `.github/workflows/maestro.yml` (macOS runner, iOS simulator) — triggered manually (`workflow_dispatch`) or on PRs touching `lib/**` / `test/maestro/**`. Note: `android/` is Expo/React Native during the Flutter→Expo migration, so the Flutter app only builds for iOS here.

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
