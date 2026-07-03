# Gym Locker System — Offline-First Plan

## Overview

Two Flutter apps (Client + Reception) that manage gym locker assignments entirely offline. The core flow: member presents a QR code → reception scans it → locker is assigned in < 1 second. No internet connection required for any critical path.

---

## 1. Tech Stack & Rationale

| Layer               | Choice                         | Why                                                                 |
|---------------------|--------------------------------|----------------------------------------------------------------------|
| Framework           | Flutter 3.x (stable channel)   | One codebase for iOS + Android; mature offline packages              |
| Local Database      | Drift (SQLite ORM)             | Type-safe, reactive streams, zero-network dependency, sub-ms reads   |
| QR Scanning         | mobile_scanner                 | CameraX/ML Kit (Android), AVFoundation/Vision (iOS), fully offline   |
| QR Generation       | qr_flutter                     | Pure Dart, no network, renders QR as widget                          |
| State Management    | Riverpod + riverpod_annotation | Compile-safe, testable, auto-disposal                                |
| Code Generation     | freezed (models), drift (DB)   | Immutable data classes, type-safe queries                            |
| UI Utilities        | intl (dates), path_provider    | Formatting and storage paths                                         |
| Optional (Phase 3)  | Supabase Dart                   | Cloud sync for analytics/backup; never blocks the core flow          |

### Version Targets
- **Min iOS:** 14.0 (AVFoundation QR without Vision fallback)
- **Min Android:** API 26 (CameraX baseline)
- **Drift:** ^2.x | **mobile_scanner:** ^6.x | **qr_flutter:** ^4.x | **riverpod:** ^2.x

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                  shared/ (Dart package)              │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Models     │  │ Database  │  │  Repositories   │  │
│  │  (freezed)  │  │ (Drift)  │  │  (query logic)  │  │
│  └────────────┘  └──────────┘  └─────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼───────┐             ┌─────────▼──────────┐
│  client_app    │             │   reception_app     │
│  (member app)  │             │   (staff app)      │
│                │             │                    │
│ • QR display   │             │ • QR scanner       │
│ • Visit history│             │ • Locker grid/map  │
│ • Profile view │             │ • Member mgmt      │
│                │             │ • Check-in/out     │
│                │             │ • Reports          │
└────────────────┘             └────────────────────┘
```

### Key Architectural Decisions

**A) Monorepo with a shared core package** — data models, DB schema, and repository logic live once in `shared/`. Both apps depend on it via `path:` in pubspec.yaml. Avoids code duplication and ensures consistent data logic.

**B) Repository pattern** — all database operations go through repository classes. The UI never touches Drift directly. This makes it trivial to:
- Swap Drift for a remote API later
- Add sync logic behind the same interface
- Unit test with mock repositories

**C) Reception app is the source of truth** — all member creation, locker management, and assignment data lives on the reception device. The client app is a read-only convenience layer.

**D) No network in the critical path** — every user action (scan, lookup, assign, release) hits local SQLite. Zero loading states for the core flow.

---

## 3. Data Model

### 3.1 Entity-Relationship

```
Members ──┐
          │
          ├──< Assignments >──┐
          │                   │
                          Lockers
```

### 3.2 Tables (Drift Schema)

```dart
// --- Members ---
/// A gym member who can check in.
/// Created by staff on the reception app.
@DataClassName('Member')
class Members extends Table {
  TextColumn get id => text()();                // UUID v4, generated locally
  TextColumn get name => text()();              // Full name
  TextColumn get phone => text().nullable()();  // Contact number
  TextColumn get email => text().nullable()();
  TextColumn get membershipPlan => text()();    // 'monthly', 'annual', 'day_pass', 'punch_card'
  TextColumn get photoPath => text().nullable()(); // Local file path for staff verification photo
  TextColumn get notes => text().nullable()();  // Staff notes (e.g. "prefers bottom row")
  DateTimeColumn get createdAt => dateTime()(); // Auto-set on creation
  DateTimeColumn get updatedAt => dateTime()(); // Auto-updated on edit

  @override
  Set<Column> get primaryKey => {id};
}

// --- Lockers ---
/// A physical locker in the gym.
@DataClassName('Locker')
class Lockers extends Table {
  TextColumn get id => text()();                // UUID v4
  TextColumn get label => text()();              // Human-readable: "A01", "B12"
  TextColumn get zone => text()();               // 'alpha', 'beta', 'vip', 'day_use'
  TextColumn get size => text()();               // 'small', 'medium', 'large'
  IntColumn get sortOrder => integer()();        // For grid ordering
  TextColumn get status => text()();             // 'free', 'occupied', 'maintenance'
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// --- Assignments ---
/// A locker check-in/out record.
@DataClassName('Assignment')
class Assignments extends Table {
  TextColumn get id => text()();                // UUID v4
  TextColumn get memberId => text().references(Members, #id)();
  TextColumn get lockerId => text().references(Lockers, #id)();
  DateTimeColumn get checkInTime => dateTime()();
  DateTimeColumn get checkOutTime => dateTime().nullable()(); // null = still checked in
  TextColumn get checkedOutBy => text().nullable()();  // Staff member ID who checked out
  IntColumn get durationMinutes => integer().nullable()(); // Max duration (null = no limit)

  @override
  Set<Column> get primaryKey => {id};
}
```

### 3.3 QR Code Encoding

```
Format:  GYMLOCKER:{memberId}:{checksum}

Example: GYMLOCKER:a1b2c3d4-e5f6-7890-abcd-ef1234567890:4X9

checksum = first 2 chars of SHA256(memberId + "gym-locker-salt")
```

- **No personal data** in the QR — just an opaque ID
- Checksum prevents casual tampering (someone generating random QR IDs)
- Staff can still verify identity via name + photo on screen after scan

### 3.4 Locker Labeling Convention

| Zone      | Labels          | Size Options | Typical Use      |
|-----------|-----------------|-------------|-------------------|
| alpha     | A01–A50         | small       | Quick gym visits  |
| beta      | B01–B40         | medium      | Standard use      |
| vip       | V01–V10         | large       | Premium members   |
| day_use   | D01–D20         | small       | Day-pass visitors |

---

## 4. App Screens & Routes

### 4.1 Reception App (reception_app)

| Route              | Screen               | Purpose                                   |
|--------------------|----------------------|-------------------------------------------|
| `/`                | Scanner              | Camera view, scans QR, shows member info  |
| `/lockers`         | Locker Grid          | Full grid of lockers, color-coded, tappable |
| `/lockers/zone`    | Zone Filter          | Filter grid by zone                       |
| `/members`         | Member List          | Searchable list of all members            |
| `/members/add`     | Add Member           | Form to create a new member               |
| `/members/:id`     | Member Detail        | View/edit member, see history             |
| `/assign/:memberId`| Assign Locker        | Shows available lockers, pick one         |
| `/assignment/:id`  | Assignment Detail    | Check-in/out details, release action      |
| `/reports`         | Reports              | Daily stats, usage heatmap                |
| `/settings`        | Settings             | Zone config, locker layout, backup/export |

#### Scanner Screen (`/`) — Core Flow
```
┌─────────────────────────────┐
│  [Camera Preview]           │
│                             │
│     ┌─────────────┐        │
│     │  Scan QR    │        │
│     │  frame      │        │
│     └─────────────┘        │
│                             │
│  [Manual Entry]  [Members]  │
│                             │
│  --- Recent Assignments --- │
│  John D. → A12  2min ago   │
│  Sarah K.→ B08  15min ago  │
└─────────────────────────────┘
```

#### Locker Grid Screen (`/lockers`)
```
┌─────────────────────────────┐
│ [Alpha ▼] [All] [Free] [Occ]│  ← Filters
│                             │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│ │A01│ │A02│ │A03│ │A04│ │A05│  │
│ │FREE│ │OCC│ │OCC│ │FREE│ │MAINT│
│ └──┘ └──┘ └──┘ └──┘ └──┘  │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│ │A06│ │A07│ │A08│ │A09│ │A10│  │
│ │FREE│ │FREE│ │OCC│ │FREE│ │FREE│
│ └──┘ └──┘ └──┘ └──┘ └──┘  │
│                             │
│ Legend: 🟢 Free  🔴 Occ   │
│         🟡 Maintenance     │
└─────────────────────────────┘
```

### 4.2 Client App (client_app)

| Route           | Screen          | Purpose                                     |
|-----------------|-----------------|---------------------------------------------|
| `/`             | QR Display      | Shows member's QR code, large, bright       |
| `/history`      | Visit History   | Past check-ins/outs                         |
| `/profile`      | Profile         | Member name, plan, edit phone               |
| `/setup`        | Setup           | First-run: enter member ID or scan setup QR |

---

## 5. Detailed Flows

### 5.1 Member Check-In (Core Flow)

```
1. Member arrives at reception
2. Member presents QR (phone screen or printed card)
3. Staff taps the camera view on reception app
4. Reception app scans QR → extracts memberId → verifies checksum
5. App queries local SQLite: "SELECT * FROM members WHERE id = ?"
   - If found: show member name, photo, plan type
   - If not found: show warning "Unknown member" + option to search manually
6. Staff visually confirms identity (name + photo on screen)
7. Staff taps "Assign Locker" → shows available lockers (free + not maintenance)
8. Staff taps a locker → system creates assignment record (check_in_time = now)
9. Locker status changes to 'occupied' in DB
10. Screen shows confirmation: "Locker A12 assigned to John D."
11. Optional: staff can tell the member their locker number
12. Total time: < 3 seconds
```

### 5.2 Member Check-Out

```
Option A — Scan QR again:
1. Member returns, presents QR
2. Reception scans → shows active assignment
3. Staff taps "Release Locker"
4. System sets check_out_time = now
5. Locker status → 'free'
6. Confirmation shown

Option B — Tap locker grid:
1. Staff taps occupied locker on grid
2. Shows current assignment (member name, check-in time)
3. Staff taps "Check Out"
4. Same as steps 4-6 above
```

### 5.3 Adding a New Member

```
1. Staff navigates to Members → Add Member
2. Fills form: name*, phone, email, membership plan*
3. Taps "Generate QR Card" → system creates member record
4. System displays large QR code on screen
5. Staff can:
   a) Print the QR (via connected Bluetooth printer or screenshot)
   b) Share the QR image to messaging app
   c) Tell member to install client app and scan setup QR
```

### 5.4 Client App First-Run Setup

```
1. Member installs client app
2. App shows setup screen:
   a) "Scan QR from reception" (opens camera to scan their printed QR)
   b) "Enter Member ID" (manual fallback)
3. App stores memberId locally (shared_preferences or Drift)
4. App generates QR display from stored memberId
5. Future launches → straight to QR display
```

### 5.5 Locker Maintenance

```
1. Staff navigates to Locker Grid
2. Long-press a locker → context menu: "Set Maintenance / Release / Edit Label"
3. Status changes to 'maintenance' → locker hidden from available list
4. When repaired: long-press → "Mark as Free"
```

---

## 6. Edge Cases & Error Handling

| Scenario                          | Handling                                                              |
|-----------------------------------|-----------------------------------------------------------------------|
| QR scan fails (blurry, damaged)   | Show manual lookup option: search by name or phone                    |
| QR scans but member not in DB     | "Unknown member" message + option to add them on the spot             |
| QR checksum invalid               | "Invalid QR code" — likely corrupted or tampered                      |
| All lockers occupied              | Show count of occupied lockers, estimated wait, suggest other zones   |
| App crashes mid-assignment        | On restart, check for assignments with checkInTime set but no checkout \
|                                   | If found, show dangling assignment and offer to resolve               |
| Two staff try same locker         | Single-device by default; race impossible. Multi-device v2: Drift \
|                                   | with WAL mode + retry on conflict                                     |
| Member has active assignment      | Show warning before assigning second locker. Limit to one active.     |
| Member checks out wrong locker    | Staff can view assignment, tap "Reassign" or release correct one      |
| Locker door jammed                | Staff sets locker to 'maintenance', assigns different locker          |
| Photo not available               | Show "No photo" placeholder, rely on name + verbal confirmation       |
| Database corrupt                  | Auto-backup on app start. Settings page has "Restore from backup"     |
| Member lost their phone           | Printed QR card still works. Staff can also look up by name/phone.    |
| Phone dies during QR display      | Printed QR card is the universal fallback                             |

---

## 7. Security Considerations

| Concern                         | Mitigation                                                       |
|---------------------------------|------------------------------------------------------------------|
| QR code theft / reuse           | QR encodes only an opaque ID; checksum prevents forgeries. \
|                                 | Staff verifies identity via name + photo on screen.              |
| Lost device (reception)         | App uses no cloud — data never leaves device. \
|                                 | Add optional PIN lock to reception app.                          |
| Lost device (client)            | Client app stores only the memberId — no sensitive data.         |
| Data interception               | No network in core flow, so no MITM risk on critical path.       |
| Malicious QR injection          | QR is parsed strictly: regex `/^GYMLOCKER:[\w-]+:\w{3}$/`. \
|                                 | Member ID validated as UUID format before querying.              |
| Unauthorized staff access       | (Phase 2) Simple staff PIN or biometric lock on reception app.   |

---

## 8. Project Structure

```
gym-locker/
├── shared/                          # Shared Dart package
│   ├── pubspec.yaml
│   └── lib/
│       └── src/
│           ├── gym_core.dart        # Barrel export
│           ├── models/
│           │   ├── member.dart      # freezed Member class
│           │   ├── locker.dart      # freezed Locker class
│           │   └── assignment.dart  # freezed Assignment class
│           ├── database/
│           │   ├── database.dart    # Drift Database class
│           │   └── tables.dart      # Table definitions
│           ├── repositories/
│           │   ├── member_repository.dart
│           │   ├── locker_repository.dart
│           │   └── assignment_repository.dart
│           └── qr/
│               └── qr_codec.dart    # Encode/decode QR content, checksum
│
├── client_app/                      # Member-facing Flutter app
│   ├── pubspec.yaml
│   └── lib/
│       └── src/
│           ├── app.dart
│           ├── main.dart
│           ├── routing/
│           │   └── router.dart
│           ├── features/
│           │   ├── qr_display/
│           │   │   ├── qr_display_screen.dart
│           │   │   └── qr_display_controller.dart
│           │   ├── history/
│           │   │   ├── history_screen.dart
│           │   │   └── history_controller.dart
│           │   └── setup/
│           │       ├── setup_screen.dart
│           │       └── setup_controller.dart
│           └── widgets/
│               └── gym_qr_card.dart
│
├── reception_app/                   # Staff-facing Flutter app
│   ├── pubspec.yaml
│   └── lib/
│       └── src/
│           ├── app.dart
│           ├── main.dart
│           ├── routing/
│           │   └── router.dart
│           ├── features/
│           │   ├── scanner/
│           │   │   ├── scanner_screen.dart
│           │   │   ├── scanner_controller.dart
│           │   │   └── scan_result_card.dart
│           │   ├── locker_grid/
│           │   │   ├── locker_grid_screen.dart
│           │   │   ├── locker_grid_controller.dart
│           │   │   ├── locker_tile.dart
│           │   │   └── zone_filter_bar.dart
│           │   ├── assign_locker/
│           │   │   ├── assign_locker_screen.dart
│           │   │   └── assign_locker_controller.dart
│           │   ├── member_management/
│           │   │   ├── member_list_screen.dart
│           │   │   ├── member_detail_screen.dart
│           │   │   ├── add_member_screen.dart
│           │   │   └── member_controller.dart
│           │   ├── check_out/
│           │   │   ├── check_out_screen.dart
│           │   │   └── check_out_controller.dart
│           │   ├── reports/
│           │   │   ├── reports_screen.dart
│           │   │   └── reports_controller.dart
│           │   └── settings/
│           │       ├── settings_screen.dart
│           │       └── settings_controller.dart
│           └── widgets/
│               ├── member_search_delegate.dart
│               ├── status_badge.dart
│               └── locker_legend.dart
│
├── docs/
│   └── PLAN.md                     # This file
│
└── README.md                       # Quickstart + build instructions
```

---

## 9. Testing Strategy

| Layer              | Tool                     | What to Test                                                       |
|--------------------|--------------------------|--------------------------------------------------------------------|
| Models             | `freezed` generated      | Generated code is trusted. Spot-check serialization.               |
| Database           | Drift in-memory + `test` | Migrations, CRUD, unique constraints, foreign keys                 |
| Repositories       | `mocktail` + `test`      | Query logic, error handling, edge cases (member not found, etc.)   |
| Controllers        | `riverpod` + `test`      | State transitions, loading/error states, dispose cleanup           |
| QR Codec           | `test`                   | Encode → decode roundtrip, checksum verification, invalid input    |
| Widgets            | `flutter_test`           | Smoke tests for each screen, golden tests for locker tiles         |
| Integration        | `integration_test`       | Scan → assign → release end-to-end (using mock camera or test QR)  |

### Key Test Scenarios

1. **Check-In Flow:** scan QR → member found → assign locker → locker status changes
2. **Check-Out Flow:** scan QR → active assignment found → release → locker freed
3. **Member Not Found:** scan unknown QR → show error → manual search → assign
4. **All Lockers Full:** try assign → show "no available" → suggest freeing one first
5. **Duplicate Assignment:** member with active assignment tries to check in → warning
6. **Locker Maintenance:** set locker to maintenance → verify it's not in available list → restore
7. **QR Checksum Mismatch:** scan malformed QR → reject with error
8. **Persistence:** assign locker → kill app → reopen → verify assignment persists

---

## 10. Deployment

### Reception App
- **Primary:** Tablet mounted at reception desk (iPad or Android tablet)
- **Distribution:** 
  - iOS: TestFlight (internal) or Apple Business Manager
  - Android: Managed Google Play (internal track) or direct APK sideload
- **Device features needed:** Camera (QR scan), optional Bluetooth printer

### Client App
- **Optional** — the system works with just printed QR cards
- **Distribution:** Public App Store + Play Store listing, or invite-only TestFlight
- **Device features needed:** Camera (for setup QR scan only)

### No Server Deployment
The system has zero server infrastructure. Only requirement is a device running the reception app. No WiFi, no internet, no cloud subscription.

---

## 11. Phased Roadmap

### Phase 1 — Core (Reception App Only)
*Estimated effort: 2-3 weeks*

- [ ] Scaffold monorepo: `shared/` + `reception_app/` with path dependency
- [ ] Define Drift schema (Members, Lockers, Assignments)
- [ ] Freezed models and repository layer
- [ ] QR codec (encode/decode/checksum)
- [ ] QR scanner screen (`mobile_scanner`)
- [ ] Member lookup & display (scanner → member card)
- [ ] Locker grid screen (grid + color-coded tiles)
- [ ] Assign locker flow (pick a free locker → create assignment)
- [ ] Check-out flow (scan QR again or tap grid → release)
- [ ] Add member screen (basic form + QR generation)
- [ ] Member list + search screen
- [ ] Locker maintenance toggle (long-press → context menu)
- [ ] Seed data: 80 lockers across 4 zones
- [ ] Widget tests for all screens
- [ ] Integration test for scan → assign → release

**Deliverable:** A fully functional reception-only system. Staff can add members, print QR cards, and run the gym.

### Phase 2 — Client App
*Estimated effort: 1 week*

- [ ] Scaffold `client_app/` with shared dependency
- [ ] Setup screen (scan setup QR or enter member ID)
- [ ] QR display screen (full-screen, high brightness)
- [ ] Visit history screen (past assignments)
- [ ] Profile screen (name, plan, edit phone)
- [ ] Batch import members from reception via QR export or file share

**Deliverable:** Members can use their phone as a QR card and view their history.

### Phase 3 — Polish & Sync (Optional)
*Estimated effort: 1-2 weeks*

- [ ] Staff PIN/biometric lock on reception app
- [ ] Data export/import (SQLite backup via file share)
- [ ] Supabase sync: reception app pushes assignments to cloud
- [ ] Supabase sync: day-pass member list from cloud (optional)
- [ ] Daily usage reports (charts, peak hours, locker turnover)
- [ ] Locker zone editing in-app (add/remove/reorder lockers)
- [ ] PDF export of daily report
- [ ] Sound feedback on successful scan

### Phase 4 — Smart Lockers (Future)
*Not scoped — requires hardware*

- [ ] Bluetooth/WiFi-connected locker latches
- [ ] Digital PIN code generation per assignment
- [ ] Open locker from member's phone
- [ ] Automatic check-out on locker close

---

## 12. Key Dependencies (pubspec.yaml)

### shared/pubspec.yaml
```yaml
dependencies:
  drift: ^2.x
  sqlite3_flutter_libs: ^0.5.x
  freezed_annotation: ^2.x
  uuid: ^4.x
  crypto: ^3.x

dev_dependencies:
  drift_dev: ^2.x
  freezed: ^2.x
  build_runner: ^2.x
```

### reception_app/pubspec.yaml
```yaml
dependencies:
  gym_core:
    path: ../shared
  mobile_scanner: ^6.x
  flutter_riverpod: ^2.x
  riverpod_annotation: ^2.x
  path_provider: ^2.x
  intl: ^0.19.x

dev_dependencies:
  riverpod_generator: ^2.x
  build_runner: ^2.x
  integration_test:
    sdk: flutter
```

### client_app/pubspec.yaml
```yaml
dependencies:
  gym_core:
    path: ../shared
  qr_flutter: ^4.x
  flutter_riverpod: ^2.x
  riverpod_annotation: ^2.x
  shared_preferences: ^2.x

dev_dependencies:
  riverpod_generator: ^2.x
  build_runner: ^2.x
```

---

## 13. Performance Targets

| Operation            | Target Time | Notes                           |
|----------------------|-------------|---------------------------------|
| QR scan → member     | < 500ms     | mobile_scanner parses frame + SQLite lookup |
| Locker assign        | < 100ms     | Single INSERT, 1 UPDATE         |
| Locker grid render   | < 200ms     | 80 lockers, 4 zones, reactive   |
| Member search        | < 50ms      | SQLite LIKE on name/phone (indexed) |
| QR generation        | < 10ms      | Pure Dart, no I/O               |
| App cold start       | < 2s        | Minimal dependencies, local DB  |
| App crash recovery   | < 500ms     | Check dangling assignments on init |

---

## 14. Gap Analysis Summary

| # | Gap Identified | Resolution |
|---|---------------|------------|
| 1 | Members need a creation flow | Reception app includes Add Member screen with form → QR generation |
| 2 | Client app needs member data without sync | Setup flow: scan setup QR at reception that provisions memberId locally |
| 3 | Reception app has no member verification | Show name + optional photo on screen after scan before assigning |
| 4 | No backup strategy | SQLite auto-backup on start + manual export/import in settings |
| 5 | Locker layout not flexible | Zone filter + sortOrder field allows any grid arrangement |
| 6 | QR could be tampered | Checksum in QR content prevents forged codes |
| 7 | Unknown QR scanned | Show "Unknown member" + one-tap "Add this member" flow |
| 8 | All lockers occupied edge case | Show count + suggestions; staff can force-release long-abandoned lockers |
| 9 | App crash during assignment | Recovery scan: check for dangling (checked-in but no checkout) assignments on DB init |
| 10 | Multi-device not supported | Phase 1 is single-device. Multi-device requires sync (Phase 3) |
| 11 | Locker sizes/types not captured | Added `size` column to lockers table (small/medium/large) |
| 12 | No usage data for operations | Reports screen with daily stats, peak hours, turnover rate |
| 13 | Staff needs to override assignments | Long-press on occupied locker → "Force Release" with confirmation |
| 14 | No membership differentiation | `membershipPlan` column supports different plan types for different locker access |
