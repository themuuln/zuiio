# Tamga Test Guide

This document describes test conventions, how to run tests, how to use the test helpers and mock factories, and how to set up Isar-based tests.

---

## Table of Contents

- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Test Conventions](#test-conventions)
- [Mock and Helper Usage](#mock-and-helper-usage)
- [Isar Test Setup](#isar-test-setup)
- [Coverage](#coverage)
- [Static Analysis](#static-analysis)

---

## Running Tests

### Full Test Suite

```bash
flutter test
```

Runs all unit and widget tests. This is the full regression suite and must pass before any commit.

### Scoped Test Runs

Run tests for a specific feature area:

```bash
flutter test test/features/horses/       # Horse feature tests
flutter test test/features/events/       # Event feature tests
flutter test test/features/market/       # Market feature tests
flutter test test/features/breeding/     # Breeding feature tests
flutter test test/features/health/       # Health feature tests
flutter test test/features/shared/       # Shared feature tests
flutter test test/features/profile/      # Profile feature tests
flutter test test/features/map/          # Map feature tests
flutter test test/features/auth/         # Auth feature tests
```

Run a single test file:

```bash
flutter test test/shared/domain/horse_test.dart
```

Run tests by name pattern:

```bash
flutter test --name "HorseGender"
```

### Coverage

```bash
# Using the Makefile target (recommended):
make coverage

# Or directly:
flutter test --coverage
```

Coverage output is written to `coverage/lcov.info`. You can generate an HTML report with `genhtml` (from `lcov` package):

```bash
genhtml coverage/lcov.info -o coverage/html
```

See [Coverage](#coverage) section for more details.

---

## Project Structure

```
test/
├── README.md                           # This file
├── helpers/
│   └── test_helpers.dart               # setupTestEnvironment() + mock factory functions
├── core/                               # Core infrastructure tests (sync, error handling)
├── features/
│   ├── auth/                           # Auth feature tests
│   ├── breeding/                       # Breeding feature tests
│   ├── certificates/                   # Certificates feature tests
│   ├── events/                         # Event feature tests
│   ├── health/                         # Health log tests
│   ├── horses/                         # Horse feature tests
│   ├── lineage/                        # Lineage feature tests
│   ├── map/                            # Map feature tests
│   ├── market/                         # Market feature tests
│   ├── onboarding/                     # Onboarding tests
│   ├── payments/                       # Payments tests
│   ├── profile/                        # Profile tests
│   ├── search/                         # Search tests
│   ├── session/                        # Session tests
│   ├── shared/                         # Shared feature tests
│   ├── shell/                          # Shell/layout tests
│   └── stable/                         # Stable feature tests
└── shared/
    └── domain/                         # Domain model unit tests
        ├── horse_test.dart
        └── event_test.dart
```

---

## Test Conventions

1. **Test framework**: All tests use `flutter_test` (SDK). No third-party test runners.

2. **Mocking**: Use `mocktail` for creating mock objects. Import as:

   ```dart
   import 'package:mocktail/mocktail.dart';
   ```

3. **Grouping**: Use `group()` blocks to organize related tests. Use `test()` for individual test cases.

4. **Naming**: Test names should describe the behavior being verified:

   ```dart
   test('constructor assigns all fields', () { ... });
   test('copyWith updates specified fields', () { ... });
   test('toJson / fromJson round-trip', () { ... });
   test('equality — two identical horses are equal', () { ... });
   ```

5. **Arrange-Act-Assert**: Structure each test with clear AAA sections separated by blank lines where helpful.

6. **No side effects**: Tests should not depend on execution order. Use `setUp()` / `tearDown()` for shared state.

7. **Constants**: Use `const` for test fixture data when possible.

---

## Mock and Helper Usage

### `setupTestEnvironment()`

Call `setupTestEnvironment()` at the top of any test file that uses Isar storage. It:

1. Initializes the `TestWidgetsFlutterBinding`
2. Creates a temporary directory for path provider mocks
3. Mocks the `path_provider` method channel so Isar can find its storage directory

```dart
import '../helpers/test_helpers.dart';

void main() {
  setUp(() async {
    await setupTestEnvironment();
    // ... initialize Isar, repositories, etc.
  });
}
```

### Mock Factory Functions

The helpers file provides reusable factory functions for creating domain model instances with sensible defaults. These are ideal for test fixtures:

#### `createMockHorse()`

```dart
final horse = createMockHorse();
final horseWithId = createMockHorse(id: 'custom-id');
```

#### `createMockEvent()`

```dart
final event = createMockEvent();
final upcomingEvent = createMockEvent(
  eventType: EventType.race,
  title: 'Уралдаан',
);
```

#### `createMockEventRegistration()`

```dart
final reg = createMockEventRegistration();
final confirmedReg = createMockEventRegistration(
  status: RegistrationStatus.confirmed,
);
```

#### `createMockMarketListing()`

```dart
final listing = createMockMarketListing();
final boostedListing = createMockMarketListing(
  boostLevel: BoostLevel.premium,
);
```

#### `createMockBreedingRecord()`

```dart
final record = createMockBreedingRecord();
final foaledRecord = createMockBreedingRecord(
  status: 'Төллөсөн',
  foalName: 'Унага',
);
```

#### `createMockHealthLog()`

```dart
final log = createMockHealthLog();
final vetLog = createMockHealthLog(
  logType: LogType.vetVisit,
);
```

Each factory accepts optional named parameters to override specific fields. All unspecified fields use sensible defaults suitable for most tests.

### Creating a Mock Class with Mocktail

```dart
class MockHorsesRepository extends Mock implements HorsesRepository {}
class MockSyncEngine extends Mock implements SyncEngine {}

// In test:
final mockRepo = MockHorsesRepository();
when(() => mockRepo.fetchAll()).thenAnswer((_) async => ...);
```

---

## Isar Test Setup

Many data-layer tests depend on Isar for local storage. Follow this pattern:

```dart
import 'package:flutter_test/flutter_test.dart';
import '../../helpers/test_helpers.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

void main() {
  late IsarStorage storage;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    storage = IsarStorage.instance;
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('MyRepository', () {
    test('stores and retrieves entities', () async {
      // ... use storage directly
    });
  });
}
```

Key points:

- `setupTestEnvironment()` must be called **before** `IsarDatabase.initialize()`.
- Each test gets a fresh Isar instance (temp directory is created per `setupTestEnvironment()` call).
- Always call `IsarDatabase.close()` in `tearDown` to release resources.
- Use `IsarStorage.instance` for the storage layer, or inject a fresh instance per test.

---

## Coverage

### Generating Coverage

```bash
# Recommended: via Makefile
make coverage

# Directly
flutter test --coverage
```

Output: `coverage/lcov.info`

### Viewing Coverage

Install `lcov` and generate HTML:

```bash
brew install lcov                    # macOS
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html        # macOS
```

### Coverage Thresholds

No minimum coverage thresholds are currently enforced. The project aims to maintain or improve overall coverage with each change.

---

## Static Analysis

Run `dart analyze` before committing to catch any issues:

```bash
dart analyze
```

The project uses `flutter_lints` for lint rules defined in `analysis_options.yaml`. All new code must pass without errors (pre-existing warnings are acceptable).
