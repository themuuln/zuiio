# Testing

> **Comprehensive guide to testing the Tamga Flutter app.**
> Covers unit, widget, and integration testing, coverage collection, mocking, and the AI-agent testing tools available.

---

## Quick Start

```bash
# Run all tests
flutter test

# Run a specific test file
flutter test test/features/horses/horse_test.dart

# Run all tests in a feature directory
flutter test test/features/horses/

# Run with coverage
flutter pub add dev:coverage
dart run coverage:test_with_coverage

# Full pre-commit gate
make check
```

---

## Test Pyramid

Tamga follows the standard Flutter test pyramid:

```
        ╱╲
       ╱  ╲          Integration Tests (few)
      ╱    ╲         End-to-end user flows
     ╱──────╲
    ╱        ╲       Widget Tests (some)
   ╱          ╲      UI component rendering & interaction
  ╱────────────╲
 ╱              ╲    Unit Tests (many)
╱                ╲   Isolated logic, domain, data layer
```

### Unit Tests

Verify a single function, method, or class in isolation.

- **Location:** `test/features/{name}/domain/`, `test/features/{name}/data/`, `test/shared/domain/`
- **Framework:** `package:test` or `flutter_test`
- **Mocks:** `mocktail` (preferred) or `mockito`
- **Rules:**
  - Mock all external dependencies (Supabase, Isar, HTTP clients)
  - No disk I/O, no screen rendering
  - Mirror the `lib/` directory structure under `test/`

### Widget Tests

Verify UI rendering and user interactions.

- **Location:** `test/features/{name}/presentation/`
- **Framework:** `flutter_test` with `WidgetTester`
- **Pattern:**
  1. `tester.pumpWidget(MyWidget())`
  2. Find elements with `find.text()`, `find.byType()`, `find.byKey()`
  3. Simulate interactions: `tester.tap()`, `tester.enterText()`
  4. Rebuild: `tester.pump()` or `tester.pumpAndSettle()`
  5. Assert with `expect(finder, findsOneWidget)`

### Integration Tests

Verify full app flows on real devices or emulators.

- **Location:** `integration_test/`
- **Framework:** `integration_test` package + Flutter Driver
- **Setup:** Already configured in `pubspec.yaml` under `dev_dependencies`

---

## Test Structure

All tests live under `test/`, mirroring `lib/src/`:

```
test/
  core/                          # Core module tests
    error/                       # Error handling, Result type
    storage/cloud/               # Media storage
    sync/                        # Sync queue, entity types
    widgets/                     # Shared widgets (toast, error widget)
    startup/                     # Initialization, dead code checks
    notification/                # Notification triggers, preferences
  features/                      # Feature tests
    auth/                        # Auth state, login, register, OTP
      domain/                    # Domain model tests
      data/                      # Repository tests
      presentation/              # Screen tests
    horses/                      # Horse profile, co-ownership
    breeding/                    # Breeding records, gestation calculator
    lineage/                     # Lineage CRUD, pedigree, inbreeding
    events/                      # Events, registration, partner dashboard
    health/                      # Health repository
    market/                      # Listings, conversations, offers, pricing
    stable/                      # Boarding, invoices, members
    training/                    # Training logs, performance records
    teams/                       # Teams, invitations, stable profiles
    services/                    # Vet connect, booking, provider dashboard
    payments/                    # Feature gates, payments
    onboarding/                  # Onboarding flow, role selection
    map/                         # Map, location, geofence, tiles
    nutrition/                   # Feed logs, schedules
    race_videos/                 # Race video
    search/                      # Search providers
    social/                      # Breeder profiles, leaderboard
    certificates/                # Ownership certificates
    documents/                   # Document records
    analytics/                   # Herd analytics, charts, stat cards
    ai/                          # AI providers, breeding advice
    shell/                       # Feature tour
    session/                     # Session mode
    updater/                     # App version, upgrade provider
    shared/                      # Cloud sync, conflict resolution, pagination
  shared/
    domain/                      # Shared domain models (horse, event, health)
```

---

## Running Tests

### All Tests

```bash
flutter test
```

### Specific Feature

```bash
flutter test test/features/horses/
flutter test test/features/auth/
flutter test test/features/lineage/
```

### Single File

```bash
flutter test test/features/market/market_listing_test.dart
```

### With Name Filter

```bash
flutter test --name "should create a horse"
flutter test --plain-name "Calculator"
```

### Integration Tests

```bash
flutter test integration_test
```

---

## Coverage

### Prerequisites

```bash
flutter pub add dev:coverage
```

### Collect Coverage

```bash
# Simple — runs all tests and generates LCOV
dart run coverage:test_with_coverage

# Output
#   coverage/coverage.json  — raw VM coverage data
#   coverage/lcov.info      — formatted LCOV report
```

### View Coverage

```bash
# Generate HTML report (requires lcov tool)
brew install lcov
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html

# Or use the VS Code Coverage Gutters extension
# Install then: Cmd+Shift+P → "Coverage Gutters: Display Coverage"
```

### Coverage Directives

```dart
// coverage:ignore-file        — Skip entire file
// coverage:ignore-start       — Start ignoring block
// coverage:ignore-end         — End ignoring block
// coverage:ignore-line        — Ignore one line
```

**When to use:**
- Generated code (`.g.dart`, `.freezed.dart`, `.mocks.dart`)
- Dead-end error handlers that are unreachable in tests
- Platform-specific code that can't run in test environment

---

## Mocking

### With Mocktail (preferred — already in project)

The project uses `mocktail` (declared in `pubspec.yaml`). Mocktail is a pure-Dart mocking library that doesn't require code generation.

```dart
import 'package:mocktail/mocktail.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}
class MockIsar extends Mock implements Isar {}

void main() {
  late MockSupabaseClient mockSupabase;
  late MyRepository repository;

  setUp(() {
    mockSupabase = MockSupabaseClient();
    repository = MyRepository(mockSupabase);
  });

  test('returns data on success', () async {
    // Stub
    when(() => mockSupabase.from('table').select()).thenAnswer(
      (_) async => [{'id': 1, 'name': 'Test'}],
    );

    // Execute
    final result = await repository.fetchAll();

    // Verify
    expect(result, isA<List<MyModel>>());
    verify(() => mockSupabase.from('table').select()).called(1);
  });
}
```

### With Mockito (if needed for advanced features)

```dart
@GenerateNiceMocks([MockSpec<http.Client>()])
import 'my_test.mocks.dart';

void main() {
  late MockClient mockClient;

  setUp(() {
    mockClient = MockClient();
  });
}
```

---

## AI-Agent Testing Tools

The project has two AI-powered testing tools integrated:

| Tool | Role | When |
|------|------|------|
| **Marionette** | AI-agent exploration & debug | During dev, ad-hoc smoke tests |
| **Maestro** | Deterministic regression gate | CI/CD, every PR, release verification |

### Marionette (AI-Driven UI Testing)

`marionette_flutter` is wired in for AI-agent-driven UI exploration:

```bash
# Start the app
make marionette-run

# Then have the agent connect and test:
# "Connect to marionette at ws://..., list elements, tap Үргэлжлүүлэх"
```

See full docs in [Marionette section of AGENTS.md](../AGENTS.md).

### Maestro (Black-Box UI Regression)

Maestro flows live in `test/maestro/`:

```bash
make maestro-smoke          # Smoke test
make maestro-onboarding     # Onboarding flow
make maestro-check          # Full gate
```

---

## Conventional Test Patterns

### Domain Model Tests (`test/.../domain/`)

```dart
void main() {
  group('Horse', () {
    test('correctly calculates age', () {
      final horse = Horse(
        dateOfBirth: DateTime(2020, 6, 15),
      );
      expect(horse.ageInYears(DateTime(2024, 6, 15)), equals(4));
    });

    test('validates required fields', () {
      expect(() => Horse(name: ''), throwsA(isA<ValidationException>()));
    });
  });
}
```

### Repository Tests (`test/.../data/`)

```dart
void main() {
  group('HorseRepository', () {
    late MockSupabaseClient mockSupabase;
    late MockIsar mockIsar;
    late HorseRepository repository;

    setUp(() {
      mockSupabase = MockSupabaseClient();
      mockIsar = MockIsar();
      repository = HorseRepository(mockSupabase, mockIsar);
    });

    test('fetches horses from Supabase', () async {
      when(() => mockSupabase.from('horses').select()).thenAnswer(
        (_) async => [horseJson],
      );

      final result = await repository.fetchAll(orgId: 'org-1');

      expect(result.length, equals(1));
      verify(() => mockSupabase.from('horses').select()).called(1);
    });
  });
}
```

### Provider Tests (`test/.../application/`)

```dart
void main() {
  group('HorseListProvider', () {
    test('emits list of horses on success', () async {
      final container = ProviderContainer(
        overrides: [
          horseRepositoryProvider.overrideWithValue(mockRepository),
        ],
      );

      final horses = await container.read(horseListProvider.future);
      expect(horses.length, greaterThan(0));
    });
  });
}
```

### Widget/Screen Tests (`test/.../presentation/`)

```dart
void main() {
  testWidgets('login screen shows validation error', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authProvider.overrideWithValue(mockAuth)],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    // Tap submit without entering data
    await tester.tap(find.text('Нэвтрэх'));
    await tester.pump();

    // Verify error message appears
    expect(find.text('Имэйл хаяг оруулна уу'), findsOneWidget);
  });
}
```

---

## Skills (Agent Knowledge)

The following testing skills are installed in `.agents/skills/` for use by AI coding agents:

| Skill | Location | Use When |
|-------|----------|----------|
| **`flutter-add-widget-test`** | `.agents/skills/flutter-add-widget-test/` | Creating widget-level tests with `WidgetTester` |
| **`dart-add-unit-test`** | `.agents/skills/dart-add-unit-test/` | Writing unit tests for functions, methods, classes |
| **`dart-collect-coverage`** | `.agents/skills/dart-collect-coverage/` | Setting up and collecting test coverage reports |
| **`dart-generate-test-mocks`** | `.agents/skills/dart-generate-test-mocks/` | Generating mock objects with Mockito/build_runner |

Loaded automatically by the agent when the matching task is detected. You can also invoke them explicitly with `skill://<name>`.

---

## Pre-commit Gate

```bash
make check
```

Runs:
1. `dart format --set-exit-if-changed .` — code formatting
2. `dart analyze --fatal-infos` — static analysis
3. `flutter test` — all tests
