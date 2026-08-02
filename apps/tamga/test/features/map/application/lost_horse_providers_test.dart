import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/map/application/lost_horse_providers.dart';
import 'package:tamga/src/features/map/application/map_providers.dart';
import 'package:tamga/src/features/map/data/lost_horse_repository.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';

class MockLostHorseRepository extends Mock implements LostHorseRepository {}

/// Helper to create a minimal LostHorseReport with defaults.
LostHorseReport _createReport({
  String id = 'r1',
  String ownerId = 'o1',
  DateTime? now,
}) {
  final t = now ?? DateTime(2026, 6, 1);
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

void main() {
  late MockLostHorseRepository mockRepository;

  setUp(() {
    mockRepository = MockLostHorseRepository();
  });

  ProviderContainer containerWith({bool trackBrowseCalls = false}) {
    return ProviderContainer(
      overrides: [
        lostHorseRepositoryProvider.overrideWithValue(mockRepository),
      ],
    );
  }

  group('activeLostHorsesProvider', () {
    test('returns active reports from the repository', () async {
      final reports = [_createReport(id: 'r1'), _createReport(id: 'r2')];
      when(
        () => mockRepository.browseActiveReports(),
      ).thenAnswer((_) async => Result.ok(reports));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(activeLostHorsesProvider.future);

      expect(result, hasLength(2));
      expect(result.map((r) => r.id), ['r1', 'r2']);
    });

    test('rethrows repository failure via getOrThrow', () async {
      when(() => mockRepository.browseActiveReports()).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_FAILED', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(activeLostHorsesProvider.future),
        throwsA(isA<AppException>()),
      );
    });
  });

  group('activeLostHorsesStreamProvider', () {
    test('emits the repository results as a stream', () async {
      final reports = [_createReport(id: 'r1')];
      when(
        () => mockRepository.browseActiveReports(),
      ).thenAnswer((_) async => Result.ok(reports));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        activeLostHorsesStreamProvider.future,
      );

      expect(result, hasLength(1));
      expect(result.single.id, 'r1');
    });
  });

  group('myLostReportsProvider', () {
    test('returns empty list when no user session exists', () async {
      final container = containerWith();
      addTearDown(container.dispose);

      // currentSupabaseUserId() is null in tests (Supabase not configured),
      // so the provider must not touch the repository at all.
      final result = await container.read(myLostReportsProvider.future);

      expect(result, isEmpty);
      verifyNever(() => mockRepository.getMyReports(any()));
    });
  });

  group('reportLostHorseProvider', () {
    test('creates the report and invalidates the active feed', () async {
      final report = _createReport(id: 'new-report');
      when(
        () => mockRepository.browseActiveReports(),
      ).thenAnswer((_) async => Result.ok(<LostHorseReport>[]));
      when(
        () => mockRepository.createReport(report),
      ).thenAnswer((_) async => Result.ok(report));

      final container = containerWith();
      addTearDown(container.dispose);

      // Prime the active feed cache.
      await container.read(activeLostHorsesProvider.future);

      final saved = await container.read(
        reportLostHorseProvider(report).future,
      );

      expect(saved.id, 'new-report');
      verify(() => mockRepository.createReport(report)).called(1);

      // Invalidation must force the feed to re-read the repository.
      await container.read(activeLostHorsesProvider.future);
      verify(() => mockRepository.browseActiveReports()).called(2);
    });

    test('propagates repository failure', () async {
      final report = _createReport();
      when(() => mockRepository.createReport(report)).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'REPORT_FAILED', message: 'Хадгалсангүй'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(reportLostHorseProvider(report).future),
        throwsA(isA<AppException>()),
      );
    });
  });

  group('updateLostHorseStatusProvider', () {
    test('maps found status to reunited resolution', () async {
      when(
        () => mockRepository.resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.reunited,
        ),
      ).thenAnswer((_) async => Result.ok(_createReport()));

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(
        updateLostHorseStatusProvider({
          'id': 'r1',
          'status': LostHorseStatus.found.name,
        }).future,
      );

      verify(
        () => mockRepository.resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.reunited,
        ),
      ).called(1);
    });

    test('maps any non-found status to withdrawn resolution', () async {
      when(
        () => mockRepository.resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.withdrawn,
        ),
      ).thenAnswer((_) async => Result.ok(_createReport()));

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(
        updateLostHorseStatusProvider({
          'id': 'r1',
          'status': LostHorseStatus.cancelled.name,
        }).future,
      );

      verify(
        () => mockRepository.resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.withdrawn,
        ),
      ).called(1);
    });

    test('propagates repository failure', () async {
      when(
        () => mockRepository.resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.withdrawn,
        ),
      ).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'RESOLVE_FAILED', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(
          updateLostHorseStatusProvider({
            'id': 'r1',
            'status': LostHorseStatus.cancelled.name,
          }).future,
        ),
        throwsA(isA<AppException>()),
      );
    });
  });
}
