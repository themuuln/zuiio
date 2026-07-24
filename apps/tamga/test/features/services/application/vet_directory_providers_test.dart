import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/services/application/vet_directory_providers.dart';
import 'package:tamga/src/features/services/application/services_providers.dart';
import 'package:tamga/src/features/services/data/services_repository.dart';
import 'package:tamga/src/features/services/domain/vet_profile.dart';

// ── Mock Repository ─────────────────────────────────────────────────

class MockVetProfileRepository extends Mock implements VetProfileRepository {}

void main() {
  late MockVetProfileRepository mockRepository;

  setUp(() {
    mockRepository = MockVetProfileRepository();
  });

  group('vet_directory_providers', () {
    VetProfile createTestVetProfile({
      String id = 'vet-1',
      String providerId = 'provider-1',
      List<String> specialization = const ['general'],
      String? licenseNumber = 'LIC-001',
      int? experienceYears = 5,
      int? consultationFee = 30000,
    }) {
      return VetProfile(
        id: id,
        providerId: providerId,
        specialization: specialization,
        licenseNumber: licenseNumber,
        education: 'Vet School',
        experienceYears: experienceYears,
        consultationFee: consultationFee,
        travelSurcharge: 10000,
        availableDays: ['mon', 'tue', 'wed'],
      );
    }

    // ════════════════════════════════════════════════════════════
    // VAL-SRV-VET-002: Vet directory filters by aymag
    // ════════════════════════════════════════════════════════════
    test('allVetProfilesProvider returns all profiles', () async {
      final profiles = [
        createTestVetProfile(id: 'v1'),
        createTestVetProfile(id: 'v2'),
      ];

      when(() => mockRepository.fetchAll()).thenAnswer(
        (_) async => Result.ok(profiles),
      );

      final container = ProviderContainer(
        overrides: [
          vetProfileRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final result = await container.read(allVetProfilesProvider.future);

      expect(result.length, 2);
      expect(result[0].id, 'v1');
      expect(result[1].id, 'v2');

      container.dispose();
    });

    test('vetProfilesByAimagProvider filters by aimag', () async {
      when(
        () => mockRepository.fetchByAimag('Архангай'),
      ).thenAnswer(
        (_) async => Result.ok([createTestVetProfile(id: 'v1')]),
      );

      when(() => mockRepository.fetchByAimag('Булган')).thenAnswer(
        (_) async => Result.ok([createTestVetProfile(id: 'v2')]),
      );

      final container = ProviderContainer(
        overrides: [
          vetProfileRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final arkhangai = await container.read(
        vetProfilesByAimagProvider('Архангай').future,
      );
      final bulgan = await container.read(
        vetProfilesByAimagProvider('Булган').future,
      );

      expect(arkhangai.length, 1);
      expect(arkhangai.first.id, 'v1');
      expect(bulgan.length, 1);
      expect(bulgan.first.id, 'v2');

      container.dispose();
    });

    // ════════════════════════════════════════════════════════════
    // Filter by specialization
    // ════════════════════════════════════════════════════════════
    test('filteredVetProfilesProvider filters by specialization', () async {
      final all = [
        createTestVetProfile(
          id: 'v1',
          specialization: ['general', 'dentistry'],
        ),
        createTestVetProfile(
          id: 'v2',
          specialization: ['reproduction'],
        ),
        createTestVetProfile(
          id: 'v3',
          specialization: ['general'],
        ),
      ];

      when(() => mockRepository.fetchAll()).thenAnswer(
        (_) async => Result.ok(all),
      );

      final container = ProviderContainer(
        overrides: [
          vetProfileRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final result = await container.read(
        filteredVetProfilesProvider(const VetFilter(specialization: 'general'))
            .future,
      );

      expect(result.length, 2);
      expect(result[0].id, 'v1');
      expect(result[1].id, 'v3');

      container.dispose();
    });

    test('vetProfileByIdProvider returns a single profile', () async {
      when(() => mockRepository.fetchById('vet-1')).thenAnswer(
        (_) async => Result.ok(createTestVetProfile(id: 'vet-1')),
      );

      final container = ProviderContainer(
        overrides: [
          vetProfileRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final result = await container.read(
        vetProfileByIdProvider('vet-1').future,
      );

      expect(result, isNotNull);
      expect(result!.id, 'vet-1');

      container.dispose();
    });
  });

  group('VetFilter', () {
    test('VetFilter equality works correctly', () {
      const filter1 = VetFilter(aimag: 'Архангай', specialization: 'general');
      const filter2 = VetFilter(aimag: 'Архангай', specialization: 'general');
      const filter3 = VetFilter(aimag: 'Булган');

      expect(filter1, equals(filter2));
      expect(filter1, isNot(equals(filter3)));
    });

    test('VetFilter hashCode is consistent', () {
      const filter = VetFilter(aimag: 'Архангай', specialization: 'general');

      expect(filter.hashCode, equals(filter.hashCode));
    });
  });
}
