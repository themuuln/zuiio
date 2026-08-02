import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/horses/data/horses_repository.dart';
import 'package:tamga/src/features/horses/data/supabase_horses_repository.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleHorseRow({
  String id = 'horse-1',
  String name = 'Тест Морь',
  String coat = 'Хээр',
  int birthYear = 2018,
  int awardCount = 2,
  int offspringCount = 3,
  bool isOwnedByHousehold = true,
  String? gender = 'mare',
}) {
  return {
    'id': id,
    'owner_id': 'owner-1',
    'name': name,
    'coat': coat,
    'birth_year': birthYear,
    'award_count': awardCount,
    'offspring_count': offspringCount,
    'is_owned_by_household': isOwnedByHousehold,
    'notes': '',
    'gender': gender,
    'created_at': '2026-01-01T00:00:00.000',
    'updated_at': '2026-01-01T00:00:00.000',
  };
}

void main() {
  // ── Testability note ─────────────────────────────────────────────────
  //
  // Every method of SupabaseHorsesRepository gates on `currentUserId`
  // (SupabaseRepositoryMixin), which resolves the user from the GLOBAL
  // Supabase bootstrap (`getConfiguredSupabaseClient()` /
  // `ensureSupabaseUserId()` in lib/src/app/supabase_bootstrap.dart) and
  // ignores the injected client. Under plain `flutter test` the global
  // client is unconfigured because the runtime `.env` asset is not bundled
  // with tests, so `currentUserId` is always null and the query chains are
  // unreachable. Every method therefore hits its early-return branch (empty
  // result, or SUPABASE_NOT_CONFIGURED failure). The tests below pin those
  // branches; the injected-client-ignored-for-user-resolution design is
  // reported to the orchestrator as a testability limitation.

  group('SupabaseHorsesRepository implements HorsesRepository', () {
    test('class exists and implements HorsesRepository', () {
      final repo = SupabaseHorsesRepository(client: null);
      expect(repo, isA<HorsesRepository>());
    });
  });

  group('fetchHorses', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseHorsesRepository(client: null);

      final result = await repo.fetchHorses();

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test(
      'returns empty list without querying when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseHorsesRepository(client: mockClient);

        final result = await repo.fetchHorses();

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
        // The query is never issued: currentUserId resolves to null via the
        // global bootstrap (unconfigured in the test environment).
        verifyNever(() => mockClient.from('horses'));
      },
    );
  });

  group('syncHorses', () {
    test(
      'delegates to fetchHorses and returns empty list on null client',
      () async {
        final repo = SupabaseHorsesRepository(client: null);

        final result = await repo.syncHorses();

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      },
    );

    test('returns empty list when no user session is resolvable', () async {
      final mockClient = MockSupabaseClient();
      final repo = SupabaseHorsesRepository(client: mockClient);

      final result = await repo.syncHorses();

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
      verifyNever(() => mockClient.from('horses'));
    });
  });

  group('fetchHorsesPaginated', () {
    test('returns empty page when Supabase client is null', () async {
      final repo = SupabaseHorsesRepository(client: null);

      final result = await repo.fetchHorsesPaginated(page: 1, limit: 20);

      expect(result.isSuccess, isTrue);
      expect(result.value.items, isEmpty);
      expect(result.value.totalCount, 0);
    });

    test(
      'returns empty page without querying when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseHorsesRepository(client: mockClient);

        final result = await repo.fetchHorsesPaginated(page: 1, limit: 20);

        expect(result.isSuccess, isTrue);
        expect(result.value.items, isEmpty);
        expect(result.value.totalCount, 0);
        verifyNever(() => mockClient.from('horses'));
      },
    );
  });

  group('saveHorse', () {
    final horse = Horse.fromSupabaseJson(sampleHorseRow());

    test(
      'returns SUPABASE_NOT_CONFIGURED when Supabase client is null',
      () async {
        final repo = SupabaseHorsesRepository(client: null);

        final result = await repo.saveHorse(horse);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      'returns SUPABASE_NOT_CONFIGURED when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseHorsesRepository(client: mockClient);

        final result = await repo.saveHorse(horse);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
        verifyNever(() => mockClient.from('horses'));
      },
    );
  });

  group('deleteHorse', () {
    test(
      'returns SUPABASE_NOT_CONFIGURED when Supabase client is null',
      () async {
        final repo = SupabaseHorsesRepository(client: null);

        final result = await repo.deleteHorse('horse-1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      'returns SUPABASE_NOT_CONFIGURED when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseHorsesRepository(client: mockClient);

        final result = await repo.deleteHorse('horse-1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
        verifyNever(() => mockClient.from('horses'));
      },
    );
  });

  // ── Data mapping ────────────────────────────────────────────────────
  //
  // The repository maps Supabase rows through HorseRecord.fromSupabaseJson
  // (lib/src/shared/domain/horse.dart). The query path is unreachable under
  // plain `flutter test` (see note above), so the mapping contract the
  // repository relies on is pinned directly here.

  group('HorseRecord.fromSupabaseJson mapping', () {
    test('maps a Supabase row field-by-field', () {
      final horse = HorseRecord.fromSupabaseJson(
        sampleHorseRow(
          id: 'horse-42',
          name: 'Сайн Морь',
          coat: 'Хязаалан',
          birthYear: 2015,
          awardCount: 5,
          offspringCount: 7,
          isOwnedByHousehold: false,
          gender: 'stallion',
        ),
      );

      expect(horse.id, 'horse-42');
      expect(horse.ownerId, 'owner-1');
      expect(horse.name, 'Сайн Морь');
      expect(horse.coat, 'Хязаалан');
      expect(horse.birthYear, 2015);
      expect(horse.awardCount, 5);
      expect(horse.offspringCount, 7);
      expect(horse.isOwnedByHousehold, isFalse);
      expect(horse.gender, HorseGender.stallion);
    });

    test('applies defaults for missing optional fields', () {
      // `name` is required by the model; optional fields default.
      final horse = HorseRecord.fromSupabaseJson({
        'id': 'min-1',
        'name': 'Min',
      });

      expect(horse.id, 'min-1');
      expect(horse.name, 'Min');
      expect(horse.coat, '');
      expect(horse.birthYear, 0);
      expect(horse.awardCount, 0);
      expect(horse.offspringCount, 0);
      expect(horse.gender, HorseGender.gelding);
      expect(horse.isOwnedByHousehold, isTrue);
    });
  });
}
