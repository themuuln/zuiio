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
flutter run                                                        # Dev server
flutter build apk                                                  # Build APK
flutter test                                                       # All tests
flutter test test/features/horses/                                 # Feature-specific
dart analyze --fatal-infos                                          # Lint (strict)
dart format --set-exit-if-changed .                                # Format check
dart run build_runner build --delete-conflicting-outputs           # Isar schema gen (required after model changes)
make check                                                         # Full gate: format-check + analyze + test
make setup-hooks                                                   # Install pre-commit hooks
```

Pre-commit hooks run on every commit via `.githooks`: `dart format --check` → `dart analyze --fatal-infos` → `flutter test` on changed files.

Flutter version pinned via `subosito/flutter-action` using `flutter-version-file: pubspec.yaml`.

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
  "command": "/Users/themuuln/.pub-cache/bin/marionette_mcp",
  "args": [],
  "env": {}
}
```

This gives the AI agent tools to inspect and interact with the running Flutter app — tap, scroll, type, screenshot, get-logs.

> `~/.pub-cache/bin` MUST be on `$PATH` for the `marionette` and `marionette_mcp` binaries.
> This is already set in `~/.zshrc` (line 308), but may need adding in other shells.

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
1. Registers the app instance
2. Calls `get-interactive-elements` — fails if < 3 elements
3. Taps the onboarding "Үргэлжлүүлэх" FilledButton — fails if no tap target
4. Verifies navigation to the role selection screen (checks for "Таны үргэлжлүүлэх" title)
5. Captures a log snapshot
6. Unregisters the instance

### Workflow — Zero-touch (Agent manages everything)

**Best for agent-driven testing.** Just tell the agent what to test:

> "Run the app and test the onboarding flow"

The agent internally:
1. Starts `flutter run` via `hub start` with `ready.log: "ws://"`
2. Waits for the VM service URI to appear in the output
3. Extracts the `ws://.../ws` URI
4. Registers with marionette: `marionette register tamga <uri>`
5. Lists elements, taps, scrolls, screenshots — whatever you asked
6. Stops `flutter run` when done

No terminal windows, no commands, no URI copying. One sentence.

### Workflow — One-command (User runs, agent discovers)

If you prefer running the app yourself, `make marionette-run` wraps
`flutter run` and auto-registers for agent discovery:

```bash
make marionette-run    # Foreground, interactive (hot reload works)
```

Then tell the agent:
> "Test the app — list elements, tap Удам угшил, check the lineage screen"

### Workflow — Manual (just flutter run)

```bash
flutter run    # Copy the URI from output
```

Tell the agent:
> "Connect to marionette at ws://127.0.0.1:56207/TjyRME2F608=/ws, list elements..."

### Creating Regression Tests

For permanent smoke tests, add Maestro `.yaml` flows under `test/maestro/` (if the Flutter app is being tested on device) or extend `scripts/marionette-smoke.sh` with app-specific navigation flows.

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
| Onboarding | `onboarding.yaml` | Full flow: landing → role selection → option visibility |

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
```

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
| **Marionette** | AI-agent exploration & debug | During dev, ad-hoc smoke tests |
| **Maestro** | Deterministic regression gate | CI/CD, every PR, release verification |

Use Marionette to explore and debug. Use Maestro to guarantee nothing regresses.
