import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/app/app_config.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/map/data/local_lost_horse_repository.dart';
import 'package:tamga/src/features/map/data/lost_horse_repository.dart';
import 'package:tamga/src/features/map/data/offline_first_lost_horse_repository.dart';
import 'package:tamga/src/features/map/data/supabase_lost_horse_repository.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/sighting_report.dart';

import '../../../helpers/test_helpers.dart';

class _MockLocal extends Mock implements LocalLostHorseRepository {}

class _MockRemote extends Mock implements SupabaseLostHorseRepository {}

LostHorseReport _createReport({String id = 'r1', String ownerId = 'o1'}) {
  final t = DateTime(2026, 6, 1);
  return LostHorseReport(
    id: id,
    ownerId: ownerId,
    lastSeenLat: 47.9,
    lastSeenLng: 106.9,
    lastSeenAt: t,
    createdAt: t,
    updatedAt: t,
  );
}

SightingReport _createSighting({String id = 's1', String reportId = 'r1'}) {
  return SightingReport(
    id: id,
    reportId: reportId,
    reporterId: 'u1',
    lat: 47.9,
    lng: 106.9,
    createdAt: DateTime(2026, 6, 1),
  );
}

void main() {
  late _MockLocal local;
  late _MockRemote remote;
  late OfflineFirstLostHorseRepository repository;

  setUp(() async {
    await setupTestEnvironment();
    // Force AppConfig.isSupabaseConfigured → true so the remote refresh path
    // is actually exercised (the static getter is empty by default in tests).
    AppConfig.debugSetSupabaseConfig(
      url: 'https://example.supabase.co',
      key: 'sb_publishable_test',
    );
    expect(AppConfig.isSupabaseConfigured, isTrue);

    local = _MockLocal();
    remote = _MockRemote();
    repository = OfflineFirstLostHorseRepository(local: local, remote: remote);
  });

  group('OfflineFirstLostHorseRepository', () {
    test('implements LostHorseRepository', () {
      expect(repository, isA<LostHorseRepository>());
    });

    group('getMyReports', () {
      test('returns cached result when remote THROWS', () async {
        final cached = [_createReport(ownerId: 'o1')];
        when(
          () => local.getMyReports('o1'),
        ).thenAnswer((_) async => Result.ok(cached));
        when(
          () => remote.getMyReports('o1'),
        ).thenThrow(Exception('network down'));

        final result = await repository.getMyReports('o1');

        expect(result.isSuccess, isTrue);
        expect(result.value, cached);
        verify(() => remote.getMyReports('o1')).called(1);
      });

      test('returns cached result when remote returns Result.fail', () async {
        final cached = [_createReport(ownerId: 'o1')];
        when(
          () => local.getMyReports('o1'),
        ).thenAnswer((_) async => Result.ok(cached));
        when(() => remote.getMyReports('o1')).thenAnswer(
          (_) async => Result.fail(
            const AppException(
              code: 'NETWORK_ERROR',
              message: 'Сүлжээний алдаа',
            ),
          ),
        );

        final result = await repository.getMyReports('o1');

        expect(result.isSuccess, isTrue);
        expect(result.value, cached);
      });

      test('returns remote result when remote succeeds', () async {
        when(
          () => local.getMyReports('o1'),
        ).thenAnswer((_) async => Result.ok([_createReport(id: 'cached')]));
        final fresh = [_createReport(id: 'fresh', ownerId: 'o1')];
        when(
          () => remote.getMyReports('o1'),
        ).thenAnswer((_) async => Result.ok(fresh));

        final result = await repository.getMyReports('o1');

        expect(result.isSuccess, isTrue);
        expect(result.value, fresh);
      });
    });

    group('browseActiveReports', () {
      test('returns cached result when remote THROWS', () async {
        final cached = [_createReport()];
        when(
          () => local.browseActiveReports(),
        ).thenAnswer((_) async => Result.ok(cached));
        when(
          () => remote.browseActiveReports(),
        ).thenThrow(Exception('network down'));

        final result = await repository.browseActiveReports();

        expect(result.isSuccess, isTrue);
        expect(result.value, cached);
        verify(() => remote.browseActiveReports()).called(1);
      });

      test('returns cached result when remote returns Result.fail', () async {
        final cached = [_createReport()];
        when(
          () => local.browseActiveReports(),
        ).thenAnswer((_) async => Result.ok(cached));
        when(() => remote.browseActiveReports()).thenAnswer(
          (_) async => Result.fail(
            const AppException(
              code: 'NETWORK_ERROR',
              message: 'Сүлжээний алдаа',
            ),
          ),
        );

        final result = await repository.browseActiveReports();

        expect(result.isSuccess, isTrue);
        expect(result.value, cached);
      });

      test('returns remote result when remote succeeds', () async {
        when(
          () => local.browseActiveReports(),
        ).thenAnswer((_) async => Result.ok([_createReport(id: 'cached')]));
        final fresh = [_createReport(id: 'fresh')];
        when(
          () => remote.browseActiveReports(),
        ).thenAnswer((_) async => Result.ok(fresh));

        final result = await repository.browseActiveReports();

        expect(result.isSuccess, isTrue);
        expect(result.value, fresh);
      });

      test('skips the remote entirely when Supabase is not configured', () async {
        // Unset the configured environment; AppConfig now reports unconfigured.
        AppConfig.debugSetSupabaseConfig(url: '', key: '');
        expect(AppConfig.isSupabaseConfigured, isFalse);

        when(
          () => local.browseActiveReports(),
        ).thenAnswer((_) async => Result.ok([_createReport()]));

        final result = await repository.browseActiveReports();

        expect(result.isSuccess, isTrue);
        verifyNever(() => remote.browseActiveReports());
      });
    });

    group('getSightings', () {
      test('returns cached result when remote THROWS', () async {
        final cached = [_createSighting()];
        when(
          () => local.getSightings('r1'),
        ).thenAnswer((_) async => Result.ok(cached));
        when(
          () => remote.getSightings('r1'),
        ).thenThrow(Exception('network down'));

        final result = await repository.getSightings('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, cached);
        verify(() => remote.getSightings('r1')).called(1);
      });

      test('returns cached result when remote returns Result.fail', () async {
        final cached = [_createSighting()];
        when(
          () => local.getSightings('r1'),
        ).thenAnswer((_) async => Result.ok(cached));
        when(() => remote.getSightings('r1')).thenAnswer(
          (_) async => Result.fail(
            const AppException(
              code: 'NETWORK_ERROR',
              message: 'Сүлжээний алдаа',
            ),
          ),
        );

        final result = await repository.getSightings('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, cached);
      });

      test('returns remote result when remote succeeds', () async {
        when(
          () => local.getSightings('r1'),
        ).thenAnswer((_) async => Result.ok([_createSighting(id: 'cached')]));
        final fresh = [_createSighting(id: 'fresh')];
        when(
          () => remote.getSightings('r1'),
        ).thenAnswer((_) async => Result.ok(fresh));

        final result = await repository.getSightings('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, fresh);
      });
    });

    group('getReport', () {
      test(
        'returns cached result without touching remote when cache hits',
        () async {
          final cached = _createReport();
          when(
            () => local.getReport('r1'),
          ).thenAnswer((_) async => Result.ok(cached));
          when(
            () => remote.getReport('r1'),
          ).thenThrow(Exception('network down'));

          final result = await repository.getReport('r1');

          expect(result.isSuccess, isTrue);
          expect(result.value, cached);
          // Cache hit short-circuits the remote refresh entirely.
          verifyNever(() => remote.getReport('r1'));
        },
      );

      test(
        'returns cached failure when remote THROWS and cache misses',
        () async {
          when(() => local.getReport('missing')).thenAnswer(
            (_) async => Result.fail(
              const AppException(
                code: 'REPORT_NOT_FOUND',
                message: 'Зар олдсонгүй',
              ),
            ),
          );
          when(
            () => remote.getReport('missing'),
          ).thenThrow(Exception('network down'));

          final result = await repository.getReport('missing');

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'REPORT_NOT_FOUND');
          verify(() => remote.getReport('missing')).called(1);
        },
      );

      test('returns remote result when remote succeeds', () async {
        when(() => local.getReport('r1')).thenAnswer(
          (_) async => Result.fail(
            const AppException(
              code: 'REPORT_NOT_FOUND',
              message: 'Зар олдсонгүй',
            ),
          ),
        );
        final fresh = _createReport();
        when(
          () => remote.getReport('r1'),
        ).thenAnswer((_) async => Result.ok(fresh));

        final result = await repository.getReport('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, fresh);
      });

      test(
        'skips the remote when the local cache already has the report',
        () async {
          final cached = _createReport();
          when(
            () => local.getReport('r1'),
          ).thenAnswer((_) async => Result.ok(cached));

          final result = await repository.getReport('r1');

          expect(result.isSuccess, isTrue);
          expect(result.value, cached);
          verifyNever(() => remote.getReport('r1'));
        },
      );
    });
  });
}
