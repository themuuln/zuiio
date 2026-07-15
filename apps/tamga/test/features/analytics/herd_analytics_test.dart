import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/shared/domain/horse.dart' show Horse, HorseGender;
import 'package:tamga/src/features/analytics/domain/herd_analytics.dart';

void main() {
  group('HerdAnalytics', () {
    final horses = [
      Horse(
        id: '1',
        name: 'Test Horse 1',
        relationLabel: 'Орос',
        coat: 'Халиун',
        birthYear: 2018,
        awardCount: 2,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        gender: HorseGender.stallion,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      Horse(
        id: '2',
        name: 'Test Horse 2',
        relationLabel: 'Орос',
        coat: 'Халиун',
        birthYear: 2020,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        gender: HorseGender.mare,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      Horse(
        id: '3',
        name: 'Test Horse 3',
        relationLabel: 'Монгол',
        coat: 'Хар',
        birthYear: 2022,
        awardCount: 1,
        offspringCount: 0,
        isOwnedByHousehold: true,
        notes: '',
        gender: HorseGender.mare,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      Horse(
        id: '4',
        name: 'Test Horse 4',
        relationLabel: 'Монгол',
        coat: 'Хөх',
        birthYear: 2015,
        awardCount: 0,
        offspringCount: 2,
        isOwnedByHousehold: true,
        notes: '',
        gender: HorseGender.stallion,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      Horse(
        id: '5',
        name: 'Test Horse 5',
        relationLabel: 'Монгол',
        coat: '',
        birthYear: 2008,
        awardCount: 0,
        offspringCount: 0,
        isOwnedByHousehold: false,
        notes: '',
        gender: HorseGender.gelding,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    test('totalHorses returns correct count', () {
      final analytics = HerdAnalytics(horses: horses);
      expect(analytics.totalHorses, 5);
    });

    test('empty horses list returns totalHorses of 0', () {
      final analytics = HerdAnalytics(horses: []);
      expect(analytics.totalHorses, 0);
    });

    test('ageDistribution groups horses into correct age buckets', () {
      // birthYears: 2018 (age ~8), 2020 (age ~6), 2022 (age ~4),
      // 2015 (age ~11), 2008 (age ~18)
      // Current year is 2026, so:
      // 2018 -> 8 -> "6-8"
      // 2020 -> 6 -> "6-8"
      // 2022 -> 4 -> "4-5"
      // 2015 -> 11 -> "9-12"
      // 2008 -> 18 -> "13+"
      final analytics = HerdAnalytics(horses: horses);
      expect(analytics.ageDistribution.isNotEmpty, true);

      final buckets = analytics.ageDistribution;
      final total = buckets.fold<int>(0, (sum, b) => sum + b.count);
      expect(total, 5);

      // Find specific buckets
      final bucket4to5 = buckets.where((b) => b.label == '4-5');
      expect(bucket4to5.length, 1);
      expect(bucket4to5.first.count, 1);

      final bucket6to8 = buckets.where((b) => b.label == '6-8');
      expect(bucket6to8.length, 1);
      expect(bucket6to8.first.count, 2);

      final bucket9to12 = buckets.where((b) => b.label == '9-12');
      expect(bucket9to12.length, 1);
      expect(bucket9to12.first.count, 1);

      final bucket13plus = buckets.where((b) => b.label == '13+');
      expect(bucket13plus.length, 1);
      expect(bucket13plus.first.count, 1);
    });

    test('genderSplit returns correct counts per gender', () {
      final analytics = HerdAnalytics(horses: horses);
      expect(analytics.genderSplit[HorseGender.stallion], 2);
      expect(analytics.genderSplit[HorseGender.mare], 2);
      expect(analytics.genderSplit[HorseGender.gelding], 1);
      expect(analytics.genderSplit[HorseGender.foal], 0);
    });

    test('breedBreakdown groups by coat with default for empty coats', () {
      final analytics = HerdAnalytics(horses: horses);
      expect(analytics.breedBreakdown['Халиун'], 2);
      expect(analytics.breedBreakdown['Хар'], 1);
      expect(analytics.breedBreakdown['Хөх'], 1);
      expect(analytics.breedBreakdown['Тодорхойгүй'], 1);
    });

    test('empty returns correct static empty instance', () {
      final analytics = HerdAnalytics.empty;
      expect(analytics.totalHorses, 0);
      expect(analytics.ageDistribution, []);
      expect(analytics.genderSplit, {
        HorseGender.stallion: 0,
        HorseGender.mare: 0,
        HorseGender.gelding: 0,
        HorseGender.foal: 0,
      });
      expect(analytics.breedBreakdown, {});
    });
  });
}
