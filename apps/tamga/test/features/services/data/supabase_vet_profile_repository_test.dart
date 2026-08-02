import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/services/data/services_repository.dart';
import 'package:tamga/src/features/services/data/supabase_vet_profile_repository.dart';
import 'package:tamga/src/features/services/domain/vet_profile.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

/// A fake [SupabaseQueryBuilder] whose chain entry points return filter-builder
/// fakes with matching runtime types (the plain `noSuchMethod => this` pattern
/// breaks on the SDK's typed forwarder casts). Completes with [_result] when
/// awaited.
class FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  FakeQueryBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(dynamic) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then(onValue, onError: onError);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> select([String columns = '*']) =>
      FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> insert(
    Object values, {
    bool defaultToNull = true,
  }) => FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> update(Map values) =>
      FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) => FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> delete() => FakeFilterBuilder(_result);
}

/// List-flavored chain fake: chained filter calls are satisfied by `this` via
/// noSuchMethod casts; [maybeSingle] switches to the nullable map flavor.
class FakeFilterBuilder extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  FakeFilterBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return null as R;
      return onValue(value as PostgrestList);
    }, onError: onError);
  }

  @override
  PostgrestFilterBuilder<Map<String, dynamic>?> maybeSingle() =>
      FakeMapFilter(_result);
}

/// Nullable map-flavored chain fake for [maybeSingle] chains. Must implement
/// the NULLABLE map flavor: the VM instantiates the await continuation with
/// the future's type argument and rejects null for a non-nullable one, which
/// would leave the awaited future hanging.
class FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>?> {
  FakeMapFilter(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic>?) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return onValue(null);
      return onValue(value as Map<String, dynamic>);
    }, onError: onError);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleVetProfileRow({
  String id = 'vet-1',
  String providerId = 'prov-1',
  List<String> specialization = const ['Халдварт өвчин', 'Дотоод өвчин'],
  String? licenseNumber = 'L-2020-001',
  String? education = 'МХУИС',
  int? experienceYears = 10,
  int? consultationFee = 50000,
  int? travelSurcharge = 20000,
  List<String> availableDays = const ['Даваа', 'Мягмар'],
}) {
  return {
    'id': id,
    'provider_id': providerId,
    'specialization': specialization,
    'license_number': licenseNumber,
    'education': education,
    'experience_years': experienceYears,
    'consultation_fee': consultationFee,
    'travel_surcharge': travelSurcharge,
    'available_days': availableDays,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseVetProfileRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseVetProfileRepository(client: mockClient);
  });

  group('SupabaseVetProfileRepository', () {
    test('implements VetProfileRepository', () {
      final repo = SupabaseVetProfileRepository(client: null);
      expect(repo, isA<VetProfileRepository>());
    });

    group('fetchAll', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseVetProfileRepository(client: null);
        final result = await repo.fetchAll();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to VetProfile models on success', () async {
        final rows = [
          sampleVetProfileRow(
            id: 'vet-1',
            providerId: 'prov-1',
            specialization: const ['Халдварт өвчин'],
            licenseNumber: 'L-2020-001',
            education: 'МХУИС',
            experienceYears: 10,
            consultationFee: 50000,
            travelSurcharge: 20000,
            availableDays: const ['Даваа'],
          ),
          sampleVetProfileRow(
            id: 'vet-2',
            providerId: 'prov-2',
            specialization: const [],
            licenseNumber: null,
            education: null,
            experienceYears: null,
            consultationFee: null,
            travelSurcharge: null,
            availableDays: const [],
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchAll();

        expect(result.isSuccess, isTrue);
        final List<VetProfile> profiles = result.value;
        expect(profiles, hasLength(2));

        final first = profiles.first;
        expect(first.id, 'vet-1');
        expect(first.providerId, 'prov-1');
        expect(first.specialization, ['Халдварт өвчин']);
        expect(first.licenseNumber, 'L-2020-001');
        expect(first.education, 'МХУИС');
        expect(first.experienceYears, 10);
        expect(first.consultationFee, 50000);
        expect(first.travelSurcharge, 20000);
        expect(first.availableDays, ['Даваа']);

        final second = profiles[1];
        expect(second.specialization, isEmpty);
        expect(second.licenseNumber, isNull);
        expect(second.experienceYears, isNull);
        expect(second.consultationFee, isNull);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchAll();

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchByAimag', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseVetProfileRepository(client: null);
        final result = await repo.fetchByAimag('Төв');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('filters by aimag and maps rows on success', () async {
        final rows = [
          sampleVetProfileRow(id: 'vet-1'),
          sampleVetProfileRow(id: 'vet-2'),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchByAimag('Төв');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.every((p) => p.providerId.isNotEmpty), isTrue);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchByAimag('Төв');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchById', () {
      test('returns null result when Supabase client is null', () async {
        final repo = SupabaseVetProfileRepository(client: null);
        final result = await repo.fetchById('vet-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('maps the single row on success', () async {
        when(() => mockClient.from(any())).thenAnswer(
          (_) => FakeQueryBuilder(
            sampleVetProfileRow(id: 'vet-1', providerId: 'prov-1'),
          ),
        );

        final result = await repository.fetchById('vet-1');

        expect(result.isSuccess, isTrue);
        expect(result.value!.id, 'vet-1');
        expect(result.value!.providerId, 'prov-1');
        verify(() => mockClient.from('vet_profiles')).called(1);
      });

      test('returns null when no row is found', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(null));

        final result = await repository.fetchById('missing');

        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchById('vet-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
