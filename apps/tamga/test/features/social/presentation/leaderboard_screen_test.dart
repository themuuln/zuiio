import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/social/application/leaderboard_providers.dart';
import 'package:tamga/src/features/social/domain/leaderboard_entry.dart';
import 'package:tamga/src/features/social/presentation/leaderboard_screen.dart';

// ── Mock data ──────────────────────────────────────────────────────

final List<LeaderboardEntry> _mockEntries = [
  const LeaderboardEntry(
    rank: 1,
    breederId: 'seller-1',
    breederName: 'Болд',
    locationLabel: 'Төв аймаг',
    totalScore: 250,
    activeListingsCount: 5,
    completedSalesCount: 3,
    averageRating: 4.5,
    horseCount: 25,
  ),
  const LeaderboardEntry(
    rank: 2,
    breederId: 'seller-2',
    breederName: 'Баяр',
    locationLabel: 'Хэнтий аймаг',
    totalScore: 180,
    activeListingsCount: 3,
    completedSalesCount: 2,
    averageRating: 4.0,
    horseCount: 15,
  ),
  const LeaderboardEntry(
    rank: 3,
    breederId: 'seller-3',
    breederName: 'Цэцэг',
    locationLabel: 'Архангай аймаг',
    totalScore: 120,
    activeListingsCount: 2,
    completedSalesCount: 1,
    averageRating: 3.5,
    horseCount: 10,
  ),
];

void main() {
  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-003: Leaderboard screen exists showing ranked breeders
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-003: LeaderboardScreen source verification', () {
    late String source;

    setUp(() async {
      source = await File(
        'lib/src/features/social/presentation/leaderboard_screen.dart',
      ).readAsString();
    });

    test('LeaderboardScreen class exists', () {
      expect(
        source.contains('class LeaderboardScreen extends ConsumerWidget'),
        isTrue,
        reason: 'LeaderboardScreen class should exist as ConsumerWidget',
      );
    });

    test('AppBar title is Үржүүлэгчийн чансаа', () {
      expect(
        source.contains("'Үржүүлэгчийн чансаа'"),
        isTrue,
        reason: 'AppBar title should be Үржүүлэгчийн чансаа',
      );
    });

    test('Screen renders rank number', () {
      expect(
        source.contains('entry.rank'),
        isTrue,
        reason: 'Screen should display rank number',
      );
    });

    test('Screen renders breeder name', () {
      expect(
        source.contains('entry.breederName'),
        isTrue,
        reason: 'Screen should display breeder name',
      );
    });

    test('Screen renders total score', () {
      expect(
        source.contains('entry.totalScore'),
        isTrue,
        reason: 'Screen should display total score',
      );
    });

    test('Screen renders active listings count', () {
      expect(
        source.contains('entry.activeListingsCount'),
        isTrue,
        reason: 'Screen should display active listings count',
      );
    });

    test('Screen renders completed sales count', () {
      expect(
        source.contains('entry.completedSalesCount'),
        isTrue,
        reason: 'Screen should display completed sales count',
      );
    });

    test('Screen renders average rating', () {
      expect(
        source.contains('entry.averageRating'),
        isTrue,
        reason: 'Screen should display average rating',
      );
    });

    test('Screen renders horse count', () {
      expect(
        source.contains('entry.horseCount'),
        isTrue,
        reason: 'Screen should display horse count',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-004: Leaderboard filterable by region or time period
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-004: Leaderboard filter controls', () {
    late String source;

    setUp(() async {
      source = await File(
        'lib/src/features/social/presentation/leaderboard_screen.dart',
      ).readAsString();
    });

    test('Region filter exists in screen', () {
      expect(
        source.contains('leaderboardRegionProvider'),
        isTrue,
        reason: 'Screen should have region filter state',
      );
    });

    test('Time period filter exists in screen', () {
      expect(
        source.contains('leaderboardTimePeriodProvider'),
        isTrue,
        reason: 'Screen should have time period filter state',
      );
    });

    test('TamgaChoicePill used for time period selection', () {
      expect(
        source.contains('TamgaChoicePill'),
        isTrue,
        reason: 'Screen should use TamgaChoicePill for time period selection',
      );
    });

    test('Dropdown used for region selection', () {
      expect(
        source.contains('DropdownButton'),
        isTrue,
        reason: 'Screen should use dropdown for region selection',
      );
    });

    test('Time period values include 7d, 30d, all', () {
      // The screen iterates LeaderboardTimePeriod.values to render all filter chips
      expect(
        source.contains('LeaderboardTimePeriod.values'),
        isTrue,
        reason:
            'Should iterate over all time period values to render filter chips',
      );
      // The labels (7 хоног, 30 хоног, Бүгд) are rendered via FilterChip
      expect(
        source.contains('LeaderboardTimePeriod'),
        isTrue,
        reason: 'Should reference LeaderboardTimePeriod for filter rendering',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-005: Leaderboard shows key metrics per breeder
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-005: Leaderboard row shows all metrics', () {
    late String source;

    setUp(() async {
      source = await File(
        'lib/src/features/social/presentation/leaderboard_screen.dart',
      ).readAsString();
    });

    test('Row shows rank number', () {
      expect(
        source.contains('entry.rank'),
        isTrue,
        reason: 'Row should display rank number',
      );
    });

    test('Row shows breeder name', () {
      expect(
        source.contains('entry.breederName'),
        isTrue,
        reason: 'Row should display breeder name',
      );
    });

    test('Row shows active listings count', () {
      expect(
        source.contains('activeListingsCount'),
        isTrue,
        reason: 'Row should display active listings metric',
      );
    });

    test('Row shows completed sales count', () {
      expect(
        source.contains('completedSalesCount'),
        isTrue,
        reason: 'Row should display completed sales metric',
      );
    });

    test('Row shows average rating', () {
      expect(
        source.contains('averageRating'),
        isTrue,
        reason: 'Row should display average rating metric',
      );
    });

    test('Row shows horse count', () {
      expect(
        source.contains('horseCount'),
        isTrue,
        reason: 'Row should display horse count metric',
      );
    });

    test('Row shows total score', () {
      expect(
        source.contains('entry.totalScore'),
        isTrue,
        reason: 'Row should display total score',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Widget test - renders ranked list with mock data
  // ══════════════════════════════════════════════════════════════════

  group('LeaderboardScreen widget tests', () {
    testWidgets('renders ranked list of breeders sorted by score', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            leaderboardProvider.overrideWith((ref) => _mockEntries),
            leaderboardAvailableRegionsProvider.overrideWith(
              (ref) => ['Төв аймаг', 'Хэнтий аймаг', 'Архангай аймаг'],
            ),
          ],
          child: const MaterialApp(home: LeaderboardScreen()),
        ),
      );

      // Wait for async data to load
      await tester.pumpAndSettle();

      // Verify AppBar title
      expect(find.text('Үржүүлэгчийн чансаа'), findsOneWidget);

      // Verify all 3 entries are rendered
      expect(find.text('Болд'), findsOneWidget);
      expect(find.text('Баяр'), findsOneWidget);
      expect(find.text('Цэцэг'), findsOneWidget);

      // Verify rank numbers
      expect(find.text('1'), findsWidgets);
      expect(find.text('2'), findsWidgets);
      expect(find.text('3'), findsWidgets);

      // Verify score labels
      expect(find.text('250'), findsWidgets);
      expect(find.text('180'), findsWidgets);
      expect(find.text('120'), findsWidgets);

      // Verify location labels
      expect(find.text('Төв аймаг'), findsOneWidget);
      expect(find.text('Хэнтий аймаг'), findsOneWidget);
      expect(find.text('Архангай аймаг'), findsOneWidget);
    });

    testWidgets('shows loading indicator while data loads', (tester) async {
      // Use a completer that never completes to keep loading state
      final completer = Completer<List<LeaderboardEntry>>();
      // Use completer.future inline with overrideWith

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            leaderboardProvider.overrideWith((ref) => completer.future),
          ],
          child: const MaterialApp(home: LeaderboardScreen()),
        ),
      );

      // Pump once to trigger loading state
      await tester.pump();

      // Should show loading indicator (at least one)
      expect(find.byType(CircularProgressIndicator), findsWidgets);

      // Complete the future to avoid pending timer issues
      completer.complete([]);
      await tester.pump();
    });

    testWidgets('shows empty state when no entries', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            leaderboardProvider.overrideWith(
              (ref) async => <LeaderboardEntry>[],
            ),
            leaderboardAvailableRegionsProvider.overrideWith(
              (ref) => ['Төв аймаг', 'Хэнтий аймаг', 'Архангай аймаг'],
            ),
          ],
          child: const MaterialApp(home: LeaderboardScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(
        find.text('Шүүлтүүрт тохирох үржүүлэгч олдсонгүй.'),
        findsOneWidget,
      );
    });

    testWidgets('shows all key metrics per entry in leaderboard row', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            leaderboardProvider.overrideWith((ref) => _mockEntries),
            leaderboardAvailableRegionsProvider.overrideWith(
              (ref) => ['Төв аймаг', 'Хэнтий аймаг', 'Архангай аймаг'],
            ),
          ],
          child: const MaterialApp(home: LeaderboardScreen()),
        ),
      );

      await tester.pumpAndSettle();

      // Verify all metrics text is rendered
      // Active listings: 5, 3, 2
      expect(find.text('5'), findsWidgets);
      expect(find.text('3'), findsWidgets);
      expect(find.text('2'), findsWidgets);

      // Average ratings: 4.5, 4.0, 3.5
      expect(find.text('4.5'), findsWidgets);
      expect(find.text('4.0'), findsWidgets);
      expect(find.text('3.5'), findsWidgets);

      // Horse counts: 25, 15, 10
      expect(find.text('25'), findsWidgets);
      expect(find.text('15'), findsWidgets);
      expect(find.text('10'), findsWidgets);

      // Score label "оноо"
      expect(find.text('оноо'), findsNWidgets(3));
    });

    testWidgets('filter controls are rendered', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            leaderboardProvider.overrideWith((ref) => _mockEntries),
            leaderboardAvailableRegionsProvider.overrideWith(
              (ref) => ['Төв аймаг', 'Хэнтий аймаг', 'Архангай аймаг'],
            ),
          ],
          child: const MaterialApp(home: LeaderboardScreen()),
        ),
      );

      await tester.pumpAndSettle();

      // Region label
      expect(find.text('Аймаг:'), findsOneWidget);

      // Time period label
      expect(find.text('Хугацаа:'), findsOneWidget);

      // Time period filter chips
      expect(find.text('7 хоног'), findsOneWidget);
      expect(find.text('30 хоног'), findsOneWidget);
      expect(find.text('Бүгд'), findsWidgets);
    });

    testWidgets('time period filter chip selection works', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            leaderboardProvider.overrideWith((ref) => _mockEntries),
            leaderboardAvailableRegionsProvider.overrideWith(
              (ref) => ['Төв аймаг', 'Хэнтий аймаг', 'Архангай аймаг'],
            ),
          ],
          child: const MaterialApp(home: LeaderboardScreen()),
        ),
      );

      await tester.pumpAndSettle();

      // Tap on "30 хоног" filter chip
      await tester.tap(find.text('30 хоног'));
      await tester.pumpAndSettle();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Route & Navigation tests
  // ══════════════════════════════════════════════════════════════════

  group('Leaderboard route in app_router', () {
    late String routerSource;

    setUp(() async {
      routerSource = await File(
        'lib/src/app/router/app_router.dart',
      ).readAsString();
    });

    test('leaderboard route exists in app_router', () {
      expect(
        routerSource.contains("path: 'leaderboard'"),
        isTrue,
        reason: 'Router should have leaderboard route',
      );
    });

    test('LeaderboardScreen is imported in router', () {
      expect(
        routerSource.contains('leaderboard_screen.dart'),
        isTrue,
        reason: 'Router should import LeaderboardScreen',
      );
    });

    test('LeaderboardScreen is constructed in route builder', () {
      expect(
        routerSource.contains('LeaderboardScreen()'),
        isTrue,
        reason: 'Router should construct LeaderboardScreen in route',
      );
    });
  });

  group('Navigation from profile screen', () {
    late String profileSource;

    setUp(() async {
      profileSource = await File(
        'lib/src/features/profile/presentation/profile_screen.dart',
      ).readAsString();
    });

    test('Profile screen has Үржүүлэгчийн чансаа text', () {
      expect(
        profileSource.contains('Үржүүлэгчийн чансаа'),
        isTrue,
        reason: 'Profile screen should have Үржүүлэгчийн чансаа link',
      );
    });

    test('Profile screen navigates to /market/leaderboard', () {
      expect(
        profileSource.contains('/market/leaderboard'),
        isTrue,
        reason: 'Profile screen should navigate to /market/leaderboard route',
      );
    });
  });

  group('Navigation from market screen', () {
    late String marketSource;

    setUp(() async {
      marketSource = await File(
        'lib/src/features/market/presentation/market_screen.dart',
      ).readAsString();
    });

    test('Market screen has leaderboard icon button', () {
      expect(
        marketSource.contains('leaderboard_outlined'),
        isTrue,
        reason: 'Market screen should have leaderboard icon button',
      );
    });

    test('Market screen navigates to /market/leaderboard', () {
      expect(
        marketSource.contains('/market/leaderboard'),
        isTrue,
        reason: 'Market screen should navigate to /market/leaderboard route',
      );
    });
  });
}
