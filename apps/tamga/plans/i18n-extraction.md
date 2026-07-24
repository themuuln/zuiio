# Tamga i18n — Centralized String Extraction

## Context
Tamga has ~250 Dart files with hundreds of hardcoded Mongolian strings scattered across presentation layers. Changing any text requires grepping every file. The user wants a proper i18n system so all strings live in one place (`app_mn.arb` / `app_en.arb`), following Flutter's standard `flutter_localizations` + `intl` pattern.

The AGENTS.md mandates **bilingual UI (Mongolian + English)**, so the system must support multiple locales from the start.

## Approach

Use **Flutter's built-in ARB-based localization** (`flutter gen-l10n`) — zero extra dependencies (both `intl` and `flutter_localizations` are already in `pubspec.yaml`).

### Files to Create
| File | Action | Content |
|------|--------|---------|
| `l10n.yaml` | Create | Config for flutter gen-l10n (template: mn, output-dir, synthetic-package) |
| `lib/l10n/app_mn.arb` | Create | Mongolian source strings (all current hardcoded text) |
| `lib/l10n/app_en.arb` | Create | English translations (same keys, English values) |

### Files to Modify
| File | Change |
|------|--------|
| `lib/main.dart` | Add `LocalizationSetup` before `runApp`, add localization delegates |
| `lib/src/app/app.dart` | Add `supportedLocales`, `localizationsDelegates` to MaterialApp.router |
| All 60+ presentation files | Replace `const Text('...')` / `Text('...')` with `AppLocalizations.of(context)!.stringKey` |

### Generated (by `flutter gen-l10n`)
| Path | Source |
|------|--------|
| `.dart_tool/flutter_gen/gen_l10n/app_localizations.dart` | Generated |
| `.dart_tool/flutter_gen/gen_l10n/app_localizations_mn.dart` | Generated |
| `.dart_tool/flutter_gen/gen_l10n/app_localizations_en.dart` | Generated |

## Implementation Order (Dependency Chain)

### Phase 1: Infrastructure (no code changes to features)
1. Create `l10n.yaml`
2. Create initial `app_mn.arb` with all current app strings (surveyed below)
3. Create initial `app_en.arb` with English translations
4. Run `flutter gen-l10n` — verify generation succeeds
5. Update `lib/main.dart`: import `flutter_gen/gen_l10n/app_localizations.dart`, add delegates
6. Update `lib/src/app/app.dart`: add `supportedLocales: [Locale('mn'), Locale('en')]` and `localizationsDelegates`
7. Run `dart analyze` — ensure no new errors

### Phase 2: String Discovery (parallel — feature areas are independent)
8. Use parallel subagents to extract all hardcoded strings from each feature area:
   - `scout` agents read all presentation files, report every hardcoded string + file:line
   - Areas: shell, auth, onboarding, horses, lineage, market, events, map, profile, training, health, teams, services, breeding, nutrition, documents, certificates, social, stable, analytics, ai, search, payments, updater, shared, dev

### Phase 3: Consolidation & Replacement
9. Compile all discovered strings into `app_mn.arb` with unique keys
10. Update `app_en.arb` with translations
11. Dispatch parallel `task` agents to replace strings in each feature area:
    - Each agent: for each file in its area, replace `Text('...')` with `Text(AppLocalizations.of(context)!.keyName)`
12. Run `dart analyze` — fix any issues
13. Run `flutter test` — verify nothing broken

## Key Design Decisions

### String Key Naming Convention
- Grouped by feature area with underscore prefix: `shell_lineage`, `shell_market`, `shell_events`, `shell_search`, `shell_profile`
- Descriptive: `login_emailLabel`, `login_passwordLabel`, `login_signInButton`
- Validation messages: `login_emailRequired`, `login_emailInvalid`
- General/Shared: `app_title`, `general_continue`, `general_cancel`, `general_save`

### Bilingual Handling
- `app_mn.arb` = primary locale (Mongolian — all current text is Mongolian)
- `app_en.arb` = English translations
- Flutter picks locale based on device locale; falls back to `mn` if `en` unavailable

### Const Text / const Issues
- Currently many `const Text('...')` widgets — switching to `AppLocalizations.of(context)!` makes them non-const (since it requires BuildContext). This is expected and unavoidable with Flutter i18n.
- Wrapper helper can be considered but adds abstraction — prefer direct `AppLocalizations.of(context)` usage for clarity.

### Empty/String States
- `empty_state.dart`, `auth_error_messages.dart` — also need extraction
- Shared widgets like `TamgaErrorWidget`, `TamgaToast` need string keys

### Role Labels
- Roles (`UserRole`) have `displayName` and `description` properties — these need migration. Should the enum hold `String` keys that get looked up via `AppLocalizations`, or should the enum be refactored to return localized strings?

**Decision**: Keep `UserRole.displayName` and `UserRole.description` as string key names (not the actual text), and let the presentation layer resolve them via `AppLocalizations`. Or simpler: keep them as-is for now but extract them as constants in the ARB.

### Domain Model Strings
- Some domain models have hardcoded display strings (e.g., `HorseCoatColor`, `RaceCategory` constants) — these are different from UI strings. **Decision**: Domain/constant files with data-driven strings stay as-is. Only UI presentation strings are extracted.

## Edge Cases

### 1. Strings with Interpolation
- Some `Text('$count хоног')` type strings need `Intl.plural` or `String` parameter support in ARB
- ARB supports `{count}` placeholders: `'{count} хоног'`
- These need special handling — keys with `{count}` parameter

### 2. Strings with Formatting
- Wrapped in `TextStyle`, `RichText`, `Text.rich` — keep structure, replace only string value
- Format strings inside `style:` blocks: same approach

### 3. Strings in Server-Defined Content
- Error messages from Supabase: kept separate (dynamic content, not hardcoded)
- Only hardcoded UI strings are extracted

### 4. Guest/Anonymous User Display
- `authState?.displayName ?? 'Хэрэглэгч'` — the fallback string needs extraction

### 5. Pluralization
- Check for plural strings (1 horse, 2 horses) — use ARB `@plural` annotation

## Verification

### Phase 1 Verification
```bash
flutter gen-l10n                # Must generate .dart files without errors
dart analyze --fatal-infos       # Zero new errors (infrastructure only)
```

### Phase 3 Verification
```bash
dart analyze --fatal-infos       # Zero new errors after full replacement
flutter test                     # All tests pass
flutter run                      # App launches and shows strings correctly
```

### Manual Checks
- Launch app, check: shell nav labels, onboarding flow, login screen, horse registry
- Toggle device locale to English — verify English strings appear
- Check error states render correctly

## Risk / Mitigation

| Risk | Mitigation |
|------|------------|
| Massive diff (hundreds of files) | Use parallel agents, batch by feature area |
| Non-const `Text` increases widget rebuilds | Minimal impact — `AppLocalizations.of(context)` is O(1) lookup |
| Forgetting to update `const Text` | Systematic replacement; `dart analyze` catches remaining |
| String key naming inconsistency | Established naming convention upfront |
| Generated l10n files need regeneration | Add `flutter gen-l10n` before build in CI/commands |
