import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/features/races/application/race_providers.dart';
import 'package:tamga/src/features/races/data/race_entry_repository.dart';
import 'package:tamga/src/features/races/data/local_race_entry_repository.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import 'package:tamga/src/features/races/domain/race_entry.dart';
import 'package:tamga/src/features/races/presentation/race_detail_screen.dart';
import 'package:tamga/src/shared/domain/horse.dart';
import '../../../helpers/test_helpers.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Fake Auth State Notifier ────────────────────────────────────────

class FakeAuthStateNotifier extends AuthStateNotifier {
  FakeAuthStateNotifier(this._state);

  final AuthState _state;

  @override
  Stream<AuthState> build() async* {
    yield _state;
  }
}

// ── Mock Race Entry Repository ─────────────────────────────────────

class _MockRaceEntryRepository implements RaceEntryRepository {
  Result<RaceEntry> registerResult = Result.ok(createMockRaceEntry());
  List<RaceEntry> entries = [];

  @override
  Future<Result<List<RaceEntry>>> fetchByRace(String raceId) async =>
      Result.ok(entries);

  @override
  Future<Result<List<RaceEntry>>> fetchByHorse(String horseId) async =>
      Result.ok([]);

  @override
  Future<Result<RaceEntry>> register({
    required String raceId,
    required String horseId,
    required String ownerId,
    required String jockeyName,
  }) async => registerResult;

  @override
  Future<Result<RaceEntry>> cancel(String id) async =>
      Result.ok(createMockRaceEntry());

  @override
  Future<Result<RaceEntry>> updateResult({
    required String id,
    required String result,
    required int placement,
    required int prize,
  }) async => Result.ok(createMockRaceEntry());
}

// ── Test horses ─────────────────────────────────────────────────────

final _testHorse1 = Horse(
  id: 'horse-1',
  ownerId: 'user-1',
  name: 'Хан хүлэг',
  relationLabel: '',
  coat: 'Халиун',
  birthYear: 2020,
  awardCount: 0,
  offspringCount: 0,
  isOwnedByHousehold: true,
  notes: '',
  gender: HorseGender.gelding,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

// ── Helper to create a ProviderScope wrapper ────────────────────────

Widget createRaceDetailScreen({
  String raceId = 'test-race-1',
  Race? race,
  List<RaceEntry> entries = const [],
  bool simulateError = false,
  List<Horse> horses = const [],
  String userId = 'user-1',
}) {
  final raceValue = race ?? createMockRace();

  if (simulateError) {
    return ProviderScope(
      overrides: [
        raceDetailProvider(raceId).overrideWith((ref) async {
          throw Exception('Test error');
        }),
        authStateProvider.overrideWith(
          () => FakeAuthStateNotifier(AuthState.authenticated(userId: userId)),
        ),
        horsesProvider.overrideWith((ref) async => horses),
      ],
      child: MaterialApp(
        theme: TamgaDesignSystem.buildThemeData(Brightness.light),
        home: RaceDetailScreen(raceId: raceId),
      ),
    );
  }

  return ProviderScope(
    overrides: [
      raceDetailProvider(raceId).overrideWith((ref) async {
        return raceValue;
      }),
      raceEntriesProvider(raceId).overrideWith((ref) async {
        return entries;
      }),
      authStateProvider.overrideWith(
        () => FakeAuthStateNotifier(AuthState.authenticated(userId: userId)),
      ),
      horsesProvider.overrideWith((ref) async => horses),
    ],
    child: MaterialApp(
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: RaceDetailScreen(raceId: raceId),
    ),
  );
}

void main() {
  group('RaceDetailScreen', () {
    // ════════════════════════════════════════════════════════════
    // VAL-RACE-034: Race detail has loading state
    // ════════════════════════════════════════════════════════════
    testWidgets('shows centered CircularProgressIndicator while loading', (
      tester,
    ) async {
      final raceDetailCompleter = Completer<Race>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            raceDetailProvider(
              'test-race-1',
            ).overrideWith((ref) => raceDetailCompleter.future),
          ],
          child: MaterialApp(
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const RaceDetailScreen(raceId: 'test-race-1'),
          ),
        ),
      );
      await tester.pump();

      // Should show loading indicator
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      raceDetailCompleter.complete(createMockRace());
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-035: Race detail has error state
    // ════════════════════════════════════════════════════════════
    testWidgets('shows TamgaErrorWidget with retry on error', (tester) async {
      await tester.pumpWidget(createRaceDetailScreen(simulateError: true));
      await tester.pumpAndSettle();

      // Verify error widget is shown
      expect(find.byType(TamgaErrorWidget), findsOneWidget);

      // Verify the error message
      expect(find.text('Уралдаан ачаалахад алдаа гарлаа'), findsOneWidget);

      // Verify retry button
      expect(find.text('Дахин оролдох / Retry'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-022: Race detail screen shows race info
    // ════════════════════════════════════════════════════════════
    testWidgets('shows race name, date, location, type, status, fee, prize', (
      tester,
    ) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Төв аймгийн наадам',
        location: 'Төв аймаг',
        date: DateTime(2026, 7, 11),
        type: RaceType.naadam,
        status: RaceStatus.upcoming,
        entryFee: 10000,
        prizeDistribution: '1-р байр: 500,000₮\n2-р байр: 300,000₮',
        description: 'Уламжлалт наадам',
      );

      await tester.pumpWidget(createRaceDetailScreen(race: race));
      await tester.pumpAndSettle();

      // Verify race name in app bar
      expect(find.text('Төв аймгийн наадам'), findsOneWidget);

      // Verify type display name
      expect(find.text('Наадам'), findsOneWidget);

      // Verify status display name (appears in info card text + status chip)
      expect(find.text('Удахгүй'), findsNWidgets(2));

      // Verify date is shown
      expect(find.textContaining('2026-07-11'), findsOneWidget);

      // Verify location is shown
      expect(find.textContaining('Төв аймаг'), findsOneWidget);

      // Verify entry fee is shown
      expect(find.textContaining('10000₮'), findsOneWidget);

      // Verify prize distribution section
      expect(find.text('Шагналын хуваарилалт'), findsOneWidget);

      // Verify description
      expect(find.text('Уламжлалт наадам'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-023: Race detail screen shows registered horses list
    // ════════════════════════════════════════════════════════════
    testWidgets('shows registered horses list when entries exist', (
      tester,
    ) async {
      final race = createMockRace(id: 'race-1', name: 'Test Race');
      final entries = <RaceEntry>[
        createMockRaceEntry(
          id: 'entry-1',
          raceId: 'race-1',
          horseId: 'horse-1',
          jockeyName: 'Бат',
          status: RaceEntryStatus.registered,
        ),
        createMockRaceEntry(
          id: 'entry-2',
          raceId: 'race-1',
          horseId: 'horse-2',
          jockeyName: 'Дорж',
          status: RaceEntryStatus.confirmed,
        ),
      ];

      await tester.pumpWidget(
        createRaceDetailScreen(race: race, entries: entries),
      );
      await tester.pumpAndSettle();

      // Verify the registered horses section title
      expect(find.text('Бүртгэгдсэн морьд'), findsOneWidget);

      // Verify horse IDs are shown
      expect(find.textContaining('Морь: horse-1'), findsOneWidget);
      expect(find.textContaining('Морь: horse-2'), findsOneWidget);

      // Verify jockey names
      expect(find.textContaining('Морьтон: Бат'), findsOneWidget);
      expect(find.textContaining('Морьтон: Дорж'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-025: Completed race shows results
    // ════════════════════════════════════════════════════════════
    testWidgets('completed race shows entries with placement and prize', (
      tester,
    ) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Completed Race',
        status: RaceStatus.completed,
      );

      final entries = <RaceEntry>[
        createMockRaceEntry(
          id: 'entry-1',
          raceId: 'race-1',
          horseId: 'horse-1',
          jockeyName: 'Бат',
          status: RaceEntryStatus.competed,
          result: '2:30.5',
          placement: 1,
          prize: 500000,
        ),
        createMockRaceEntry(
          id: 'entry-2',
          raceId: 'race-1',
          horseId: 'horse-2',
          jockeyName: 'Дорж',
          status: RaceEntryStatus.competed,
          result: '2:35.0',
          placement: 2,
          prize: 300000,
        ),
      ];

      await tester.pumpWidget(
        createRaceDetailScreen(race: race, entries: entries),
      );
      await tester.pumpAndSettle();

      // Verify registered horses section is shown
      expect(find.text('Бүртгэгдсэн морьд'), findsOneWidget);

      // Verify horse entries are rendered
      expect(find.textContaining('Морь: horse-1'), findsOneWidget);
      expect(find.textContaining('Морь: horse-2'), findsOneWidget);

      // Verify jockey names
      expect(find.textContaining('Морьтон: Бат'), findsOneWidget);
      expect(find.textContaining('Морьтон: Дорж'), findsOneWidget);

      // Verify prize amounts are shown
      expect(find.textContaining('500000₮'), findsOneWidget);
      expect(find.textContaining('300000₮'), findsOneWidget);
    });

    testWidgets('race with no entries shows Бүртгэл байхгүй байна', (
      tester,
    ) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Empty Race',
        status: RaceStatus.upcoming,
      );

      await tester.pumpWidget(createRaceDetailScreen(race: race, entries: []));
      await tester.pumpAndSettle();

      // Verify the empty state for entries
      expect(find.text('Бүртгэл байхгүй байна'), findsOneWidget);
    });

    testWidgets('cancelled race renders without error', (tester) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Cancelled Race',
        status: RaceStatus.cancelled,
      );

      await tester.pumpWidget(createRaceDetailScreen(race: race));
      await tester.pumpAndSettle();

      // Verify the screen renders
      expect(find.text('Cancelled Race'), findsOneWidget);
      expect(find.byType(RaceDetailScreen), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-024: Registration button visibility
    // ════════════════════════════════════════════════════════════
    testWidgets('upcoming race shows Морь бүртгүүлэх button', (tester) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Upcoming Race',
        status: RaceStatus.upcoming,
        maxEntries: 10,
      );

      await tester.pumpWidget(
        createRaceDetailScreen(race: race, entries: [], horses: [_testHorse1]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Морь бүртгүүлэх'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-029: Entry limit enforced in UI
    // ════════════════════════════════════════════════════════════
    testWidgets('full race shows disabled Бүртгэл дууссан button', (
      tester,
    ) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Full Race',
        status: RaceStatus.upcoming,
        maxEntries: 1,
      );

      final entries = [
        createMockRaceEntry(
          id: 'entry-1',
          raceId: 'race-1',
          horseId: 'horse-1',
          status: RaceEntryStatus.registered,
        ),
      ];

      await tester.pumpWidget(
        createRaceDetailScreen(
          race: race,
          entries: entries,
          horses: [_testHorse1],
        ),
      );
      await tester.pumpAndSettle();

      // Should show disabled "Бүртгэл дууссан" button
      expect(find.text('Бүртгэл дууссан'), findsOneWidget);

      // The button parent should be disabled (FilledButton with onPressed: null)
      final filledButton = find.ancestor(
        of: find.text('Бүртгэл дууссан'),
        matching: find.byType(FilledButton),
      );
      expect(filledButton, findsOneWidget);
      final buttonWidget = tester.widget<FilledButton>(filledButton);
      expect(buttonWidget.onPressed, isNull);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-024: Registration button hidden for completed/cancelled
    // ════════════════════════════════════════════════════════════
    testWidgets('completed race does not show registration button', (
      tester,
    ) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Completed Race',
        status: RaceStatus.completed,
      );

      await tester.pumpWidget(
        createRaceDetailScreen(race: race, horses: [_testHorse1]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Морь бүртгүүлэх'), findsNothing);
      expect(find.text('Бүртгэл дууссан'), findsNothing);
    });

    testWidgets('cancelled race does not show registration button', (
      tester,
    ) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Cancelled Race',
        status: RaceStatus.cancelled,
      );

      await tester.pumpWidget(
        createRaceDetailScreen(race: race, horses: [_testHorse1]),
      );
      await tester.pumpAndSettle();

      expect(find.text('Морь бүртгүүлэх'), findsNothing);
      expect(find.text('Бүртгэл дууссан'), findsNothing);
    });

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-026: Registration flow selects horse and enters
    //               jockey name
    // VAL-RACE-027: Registration confirmation shows success
    //               feedback
    // ════════════════════════════════════════════════════════════
    testWidgets(
      'full registration flow: select horse, enter jockey name, success snackbar',
      (tester) async {
        final race = createMockRace(
          id: 'race-1',
          name: 'Upcoming Race',
          status: RaceStatus.upcoming,
          maxEntries: 10,
        );

        final mockEntryRepo = _MockRaceEntryRepository();
        mockEntryRepo.registerResult = Result.ok(
          createMockRaceEntry(
            id: 'new-entry-1',
            raceId: 'race-1',
            horseId: 'horse-1',
            jockeyName: 'Бат',
          ),
        );

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              raceDetailProvider('race-1').overrideWith((ref) async => race),
              raceEntriesProvider(
                'race-1',
              ).overrideWith((ref) async => <RaceEntry>[]),
              authStateProvider.overrideWith(
                () => FakeAuthStateNotifier(
                  AuthState.authenticated(userId: 'user-1'),
                ),
              ),
              horsesProvider.overrideWith((ref) async => [_testHorse1]),
              localRaceEntryRepositoryProvider.overrideWith(
                (ref) => mockEntryRepo,
              ),
            ],
            child: MaterialApp(
              theme: TamgaDesignSystem.buildThemeData(Brightness.light),
              home: const RaceDetailScreen(raceId: 'race-1'),
            ),
          ),
        );
        await tester.pumpAndSettle();

        // Step 1: Tap registration button
        await tester.tap(find.text('Морь бүртгүүлэх'));
        await tester.pumpAndSettle();

        // Step 2: Bottom sheet with horse selection should appear
        expect(find.text('Морь сонгох'), findsOneWidget);
        expect(find.text('Хан хүлэг'), findsOneWidget);

        // Select the horse
        await tester.tap(find.text('Хан хүлэг'));
        await tester.pumpAndSettle();

        // Step 3: Jockey name dialog should appear
        expect(find.text('Морьтон нэр'), findsOneWidget);
        expect(find.text('Морьтон нэр *'), findsOneWidget);

        // Enter jockey name
        await tester.enterText(
          find.widgetWithText(TextFormField, 'Морьтон нэр *'),
          'Бат',
        );
        await tester.pumpAndSettle();

        // Step 4: Confirm registration
        await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));

        // Allow async ops to complete
        await tester.pump();
        await tester.pump();

        // ── VAL-RACE-027: success snackbar ──
        await tester.pump(const Duration(milliseconds: 200));
        expect(find.text('Амжилттай бүртгэгдлээ'), findsOneWidget);
      },
    );

    // ════════════════════════════════════════════════════════════
    // VAL-RACE-028: Duplicate prevented in UI
    // ════════════════════════════════════════════════════════════
    testWidgets('duplicate registration shows error message', (tester) async {
      final race = createMockRace(
        id: 'race-1',
        name: 'Upcoming Race',
        status: RaceStatus.upcoming,
        maxEntries: 10,
      );

      final mockEntryRepo = _MockRaceEntryRepository();
      mockEntryRepo.registerResult = Result.fail(
        DuplicateRegistrationException('race-1', 'horse-1'),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            raceDetailProvider('race-1').overrideWith((ref) async => race),
            raceEntriesProvider(
              'race-1',
            ).overrideWith((ref) async => <RaceEntry>[]),
            authStateProvider.overrideWith(
              () => FakeAuthStateNotifier(
                AuthState.authenticated(userId: 'user-1'),
              ),
            ),
            horsesProvider.overrideWith((ref) async => [_testHorse1]),
            localRaceEntryRepositoryProvider.overrideWith(
              (ref) => mockEntryRepo,
            ),
          ],
          child: MaterialApp(
            theme: TamgaDesignSystem.buildThemeData(Brightness.light),
            home: const RaceDetailScreen(raceId: 'race-1'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap registration button
      await tester.tap(find.text('Морь бүртгүүлэх'));
      await tester.pumpAndSettle();

      // Select the horse
      await tester.tap(find.text('Хан хүлэг'));
      await tester.pumpAndSettle();

      // Enter jockey name
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Морьтон нэр *'),
        'Бат',
      );
      await tester.pumpAndSettle();

      // Confirm registration - this should trigger duplicate error
      await tester.tap(find.widgetWithText(FilledButton, 'Бүртгүүлэх'));

      // Allow async ops to complete
      await tester.pump();
      await tester.pump();

      // Verify duplicate error message
      await tester.pump(const Duration(milliseconds: 200));
      expect(
        find.text('Энэ морь аль хэдийн бүртгэгдсэн байна'),
        findsOneWidget,
      );
    });
  });
}
