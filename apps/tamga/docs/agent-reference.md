# Tamga — Agent Reference

Reference material for agents. Load only when relevant; not injected by default.

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

---

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

---

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

---

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

---

