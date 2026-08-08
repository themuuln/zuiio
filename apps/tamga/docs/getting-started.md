---
title: Getting Started
desc: How to set up and develop the Tamga Flutter app
---

# Getting Started

## Prerequisites

- **Flutter** ^3.44.1 (or compatible with Dart SDK ^3.10.3)
- **Dart** ^3.10.3
- **Xcode** (macOS/iOS development)
- **Android Studio** or **Android SDK** (Android development)
- **CocoaPods** (iOS/macOS dependencies)
- **Node.js** (for VitePress docs and web scaffold)
- **pnpm** (preferred package manager for web workspace)
- **keychain-env** (macOS only — loads secrets from Keychain into dart_defines.json)

## Project Overview

Tamga is a Flutter + Supabase offline-first horse management app for Mongolia.

| Category         | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | Flutter ^3.10.3, Dart ^3.10.3                  |
| Backend          | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| State Management | Riverpod ^2.6.1                                |
| Routing          | GoRouter ^16.0.0                               |
| Local Database   | Isar ^3.1.0+1 (42 schemas)                     |
| Documentation    | VitePress (in `docs/`)                         |

---

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repo-url>
cd tamga
```

### 2. Install Flutter Dependencies

```bash
flutter pub get
```

### 3. Configure Supabase

Environment variables are passed to Flutter at compile time via `--dart-define-from-file`.

#### Option A: Using keychain-env (macOS, recommended)

The project ships a helper script that reads secrets from the macOS Keychain:

```bash
./dev.sh
```

This generates a `dart_defines.json` file from Keychain entries and launches Flutter.

To store your Supabase credentials in the Keychain:

```bash
keychain-env dart-define tamga -- SUPABASE_URL=https://your-project.supabase.co SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

#### Option B: Manual dart_defines.json

Create a `dart_defines.json` in the project root:

```json
{
  "SUPABASE_URL": "https://your-project.supabase.co",
  "SUPABASE_PUBLISHABLE_KEY": "your-anon-key"
}
```

#### Option C: Individual --dart-define flags

```bash
flutter run --dart-define=SUPABASE_URL=https://your-project.supabase.co --dart-define=SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

> **Security note**: `dart_defines.json` is gitignored. Never commit secrets to the repository.

#### Required Environment Variables

| Variable                   | Description                   | Required |
| -------------------------- | ----------------------------- | -------- |
| `SUPABASE_URL`             | Supabase project URL          | Yes      |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | Yes      |

### 4. (Optional) Firebase Configuration

Firebase is used for push notifications and crash reporting. If you don't configure it, the app initializes gracefully without Firebase features.

1. Create a Firebase project and download the platform config files:
   - iOS: `ios/Runner/GoogleService-Info.plist`
   - Android: `android/app/google-services.json`
   - macOS: `macos/Runner/GoogleService-Info.plist`
2. Enable authentication methods (Phone, Google, Apple) in Firebase Console.
3. Enable Cloud Messaging for push notifications.

### 5. Generate Isar Schemas

After modifying any Isar `@collection` annotated classes, regenerate the `.g.dart` files:

```bash
dart run build_runner build --delete-conflicting-outputs
```

This generates Isar schema code for all 42 schemas located in:

- `lib/src/features/shared/data/isar_schemas/`
- `lib/src/features/races/data/isar_schemas/`

Isar schemas are already generated in the repository. Run this command whenever you add, remove, or modify Isar collections.

### 6. Run the App

```bash
# Using the helper script (loads secrets from Keychain):
./dev.sh

# Or with manual env vars:
flutter run --dart-define-from-file=dart_defines.json

# Run on a specific device:
flutter run -d <device-id>

# Release build:
flutter run --release
```

---

## Development Workflow

### Running Tests

```bash
# Full test suite
flutter test

# Feature-specific tests
flutter test test/features/horses/
flutter test test/features/events/
flutter test test/features/market/
flutter test test/features/breeding/
flutter test test/features/health/
flutter test test/features/map/
flutter test test/features/auth/
flutter test test/features/profile/

# Single test file
flutter test test/shared/domain/horse_test.dart

# Tests matching a name pattern
flutter test --name "HorseGender"
```

### Static Analysis

```bash
# Run the Dart analyzer
dart analyze

# The project uses flutter_lints with rules defined in analysis_options.yaml.
# Generated Isar schema files (*.g.dart) are excluded from analysis.
```

### Isar Schema Generation

```bash
# Regenerate all Isar schema files after modifying @collection classes:
dart run build_runner build --delete-conflicting-outputs
```

### Code Coverage

```bash
# Using the Makefile target (recommended):
make coverage

# Or directly:
flutter test --coverage

# Generate an HTML report (requires lcov):
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Building for Release

```bash
# Android APK (with ProGuard/R8 minification)
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS (requires Apple Developer account)
flutter build ios --release

# Web
cd apps/web && pnpm build
```

---

## Common Commands Reference

| Command                                                    | Purpose                             |
| ---------------------------------------------------------- | ----------------------------------- |
| `flutter pub get`                                          | Install/update Flutter dependencies |
| `flutter run`                                              | Run the app in debug mode           |
| `flutter test`                                             | Run all tests                       |
| `dart analyze`                                             | Run static analysis                 |
| `dart run build_runner build --delete-conflicting-outputs` | Regenerate Isar schemas             |
| `flutter build apk --release`                              | Build Android release APK           |
| `flutter build ios --release`                              | Build iOS release                   |
| `make coverage`                                            | Generate test coverage report       |
| `./dev.sh`                                                 | Run with Keychain secrets (macOS)   |

---

## Project Architecture

```
lib/
├── main.dart                           # App entry point
├── src/
│   ├── app/                            # App shell, routing, theme
│   ├── core/                           # Shared infrastructure
│   │   ├── error/                      # Result type, AppException, error boundary
│   │   ├── storage/                    # Isar database singleton
│   │   ├── sync/                       # Sync queue, conflict resolution
│   │   ├── services/                   # Notifications, etc.
│   │   └── features/                   # Feature flags
│   └── features/                       # Feature modules
│       ├── horses/                     # Horse records, lineage
│       ├── events/                     # Events and tournaments
│       ├── market/                     # Buy/sell/lease marketplace
│       ├── health/                     # Health and farrier logs
│       ├── breeding/                   # Breeding tools
│       ├── training/                   # Training logs and performance
│       ├── nutrition/                  # Feed schedules and logs
│       ├── teams/                      # Team management
│       ├── map/                        # Map and lost horse finder
│       ├── auth/                       # Authentication
│       └── ...                         # Other feature modules
test/
├── helpers/                            # Test helpers and mock factories
├── core/                               # Core infrastructure tests
├── features/                           # Per-feature tests
└── shared/                             # Shared domain model tests
```

Each feature module follows Clean Architecture with four layers:

1. **domain/** — Pure Dart models (no Flutter/Supabase/Riverpod imports)
2. **data/** — Repository interfaces + local (Isar) and remote (Supabase) implementations
3. **application/** — Riverpod providers and use-cases
4. **presentation/** — Screens and widgets

---

## Documentation

The project uses VitePress for documentation. The docs live in `docs/` and are the canonical second brain for all project knowledge.

```bash
# Install docs dependencies
npm install

# Start the VitePress dev server
npm run docs:dev

# Build for production
npm run docs:build
```

> **Important**: After every feature change, update the relevant doc(s) in `docs/`. See `AGENTS.md` for the full list of docs and when to update each.
