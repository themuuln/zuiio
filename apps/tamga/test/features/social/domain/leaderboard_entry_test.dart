import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/social/domain/leaderboard_entry.dart';

void main() {
  // ══════════════════════════════════════════════════════════════════
  // LeaderboardEntry model
  // ══════════════════════════════════════════════════════════════════

  group('LeaderboardEntry model', () {
    const testEntry = LeaderboardEntry(
      rank: 1,
      breederId: 'seller-1',
      breederName: 'Болд',
      locationLabel: 'Төв аймаг',
      totalScore: 250,
      activeListingsCount: 5,
      completedSalesCount: 3,
      averageRating: 4.5,
      horseCount: 25,
    );

    test('has all required fields', () {
      expect(testEntry.rank, 1);
      expect(testEntry.breederId, 'seller-1');
      expect(testEntry.breederName, 'Болд');
      expect(testEntry.locationLabel, 'Төв аймаг');
      expect(testEntry.totalScore, 250);
      expect(testEntry.activeListingsCount, 5);
      expect(testEntry.completedSalesCount, 3);
      expect(testEntry.averageRating, 4.5);
      expect(testEntry.horseCount, 25);
    });

    test('default values are zero', () {
      const defaultEntry = LeaderboardEntry(
        rank: 10,
        breederId: 'seller-2',
        breederName: 'Test',
        totalScore: 0,
      );
      expect(defaultEntry.locationLabel, '');
      expect(defaultEntry.activeListingsCount, 0);
      expect(defaultEntry.completedSalesCount, 0);
      expect(defaultEntry.averageRating, 0.0);
      expect(defaultEntry.horseCount, 0);
    });

    test('copyWith preserves unchanged fields', () {
      final copy = testEntry.copyWith(rank: 2);
      expect(copy.rank, 2);
      expect(copy.breederId, 'seller-1');
      expect(copy.breederName, 'Болд');
      expect(copy.totalScore, 250);
    });

    test('copyWith updates specified fields only', () {
      final copy = testEntry.copyWith(
        breederName: 'Баяр',
        totalScore: 300,
      );
      expect(copy.breederName, 'Баяр');
      expect(copy.totalScore, 300);
      expect(copy.rank, 1);
      expect(copy.breederId, 'seller-1');
    });

    test('equality is based on rank, breederId, totalScore', () {
      const same = LeaderboardEntry(
        rank: 1,
        breederId: 'seller-1',
        breederName: 'Болд',
        totalScore: 250,
      );
      expect(testEntry, same);
    });

    test('different ranks are not equal', () {
      const different = LeaderboardEntry(
        rank: 2,
        breederId: 'seller-1',
        breederName: 'Болд',
        totalScore: 250,
      );
      expect(testEntry, isNot(different));
    });

    test('different breederIds are not equal', () {
      const different = LeaderboardEntry(
        rank: 1,
        breederId: 'seller-2',
        breederName: 'Болд',
        totalScore: 250,
      );
      expect(testEntry, isNot(different));
    });

    test('toJson / fromJson round-trips correctly', () {
      final json = testEntry.toJson();
      final restored = LeaderboardEntry.fromJson(json);
      expect(restored.rank, testEntry.rank);
      expect(restored.breederId, testEntry.breederId);
      expect(restored.breederName, testEntry.breederName);
      expect(restored.locationLabel, testEntry.locationLabel);
      expect(restored.totalScore, testEntry.totalScore);
      expect(restored.activeListingsCount, testEntry.activeListingsCount);
      expect(restored.completedSalesCount, testEntry.completedSalesCount);
      expect(restored.averageRating, testEntry.averageRating);
      expect(restored.horseCount, testEntry.horseCount);
    });

    test('toJson contains all keys', () {
      final json = testEntry.toJson();
      expect(json, containsPair('rank', 1));
      expect(json, containsPair('breederId', 'seller-1'));
      expect(json, containsPair('breederName', 'Болд'));
      expect(json, containsPair('totalScore', 250));
      expect(json, containsPair('activeListingsCount', 5));
      expect(json, containsPair('completedSalesCount', 3));
      expect(json, containsPair('averageRating', 4.5));
      expect(json, containsPair('horseCount', 25));
    });

    test('toString includes key info', () {
      expect(
        testEntry.toString(),
        contains('LeaderboardEntry(rank: 1, breederId: seller-1'),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // LeaderboardTimePeriod enum
  // ══════════════════════════════════════════════════════════════════

  group('LeaderboardTimePeriod enum', () {
    test('has all three values', () {
      expect(LeaderboardTimePeriod.values.length, 3);
      expect(LeaderboardTimePeriod.values, contains(LeaderboardTimePeriod.last7d));
      expect(LeaderboardTimePeriod.values, contains(LeaderboardTimePeriod.last30d));
      expect(LeaderboardTimePeriod.values, contains(LeaderboardTimePeriod.all));
    });

    test('last7d has correct label', () {
      expect(LeaderboardTimePeriod.last7d.label, '7 хоног');
    });

    test('last30d has correct label', () {
      expect(LeaderboardTimePeriod.last30d.label, '30 хоног');
    });

    test('all has correct label', () {
      expect(LeaderboardTimePeriod.all.label, 'Бүгд');
    });
  });
}
