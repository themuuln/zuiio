import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/map/data/local_lost_horse_repository.dart';
import 'package:tamga/src/features/map/data/lost_horse_repository.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/features/map/domain/sighting_report.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

/// Helper to create a minimal LostHorseReport with defaults.
LostHorseReport _createReport({
  String id = 'r1',
  String ownerId = 'o1',
  String? horseId,
  double lat = 47.9,
  double lng = 106.9,
  DateTime? now,
}) {
  final t = now ?? DateTime(2026, 6, 1);
  return LostHorseReport(
    id: id,
    horseId: horseId,
    ownerId: ownerId,
    lastSeenLat: lat,
    lastSeenLng: lng,
    lastSeenAt: t,
    createdAt: t,
    updatedAt: t,
  );
}

SightingReport _createSighting({
  String id = 's1',
  String reportId = 'r1',
  String reporterId = 'u1',
  DateTime? now,
}) {
  final t = now ?? DateTime(2026, 6, 1);
  return SightingReport(
    id: id,
    reportId: reportId,
    reporterId: reporterId,
    lat: 47.9,
    lng: 106.9,
    createdAt: t,
  );
}

/// All queued [SyncQueueItem]s as domain objects, newest Isar row first.
Future<List<SyncQueueItem>> _queuedItems() async {
  final rows = await IsarStorage.instance.syncQueueItems.where().findAll();
  return rows.map((row) => row.toDomain()).toList();
}

void main() {
  late LocalLostHorseRepository repository;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    repository = LocalLostHorseRepository(storage: IsarStorage.instance);
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('LocalLostHorseRepository', () {
    test('implements LostHorseRepository', () {
      expect(repository, isA<LostHorseRepository>());
    });

    // ── Create & read ────────────────────────────────────────────

    test('createReport stores the report and enqueues a create item', () async {
      final report = _createReport();

      final result = await repository.createReport(report);

      expect(result.isSuccess, isTrue);
      expect(result.value.id, 'r1');

      final readBack = await repository.getReport('r1');
      expect(readBack.isSuccess, isTrue);
      expect(readBack.value.ownerId, 'o1');
      expect(readBack.value.lastSeenLat, 47.9);

      final queue = await _queuedItems();
      expect(queue, hasLength(1));
      expect(queue.single.entityType, 'lost_horse_report');
      expect(queue.single.entityId, 'r1');
      expect(queue.single.action, SyncAction.create);
      expect(queue.single.accountId, 'o1');
      expect(queue.single.queueId, 'lost_horse_report:r1');
    });

    test(
      'createReport with media paths stages media drafts with ids',
      () async {
        final report = _createReport();
        final paths = ['/tmp/photo1.jpg', '/tmp/photo2.png'];

        final result = await repository.createReport(
          report,
          localMediaPaths: paths,
        );

        expect(result.isSuccess, isTrue);

        final drafts = await IsarStorage.instance.lostHorseMediaDrafts
            .where()
            .findAll();
        expect(drafts, hasLength(2));
        expect(drafts.map((d) => d.localPath).toSet(), paths.toSet());
        expect(drafts.every((d) => d.reportId == 'r1'), isTrue);
        expect(drafts.every((d) => d.accountId == 'o1'), isTrue);
        expect(drafts.map((d) => d.mediaId).toSet().length, 2);

        // The queued create item must reference the staged media ids so the
        // remote publish can associate uploaded files with the report.
        final queue = await _queuedItems();
        final mediaIds = (queue.single.data['media_ids'] as List<dynamic>)
            .cast<String>();
        expect(mediaIds.toSet(), drafts.map((d) => d.mediaId).toSet());
      },
    );

    test('getReport returns REPORT_NOT_FOUND for missing report', () async {
      final result = await repository.getReport('missing');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'REPORT_NOT_FOUND');
    });

    test('getMyReports returns only the owner reports', () async {
      await repository.createReport(_createReport(id: 'mine', ownerId: 'o1'));
      await repository.createReport(_createReport(id: 'theirs', ownerId: 'o2'));

      final result = await repository.getMyReports('o1');

      expect(result.isSuccess, isTrue);
      expect(result.value.map((r) => r.id), ['mine']);
    });

    test(
      'browseActiveReports returns only active reports newest first',
      () async {
        await repository.createReport(
          _createReport(id: 'old', now: DateTime(2026, 1, 1)),
        );
        await repository.createReport(
          _createReport(id: 'new', now: DateTime(2026, 6, 1)),
        );
        await repository.createReport(
          _createReport(id: 'found', now: DateTime(2026, 3, 1)),
        );
        await repository.resolveReport(
          reportId: 'found',
          resolutionType: LostHorseResolutionType.reunited,
        );

        final result = await repository.browseActiveReports();

        expect(result.isSuccess, isTrue);
        expect(result.value.map((r) => r.id), ['new', 'old']);
        expect(
          result.value.every((r) => r.status == LostHorseStatus.active),
          isTrue,
        );
      },
    );

    // ── Publish & resolution ─────────────────────────────────────

    test(
      'publishReport enqueues lost_horse_publish with draft media ids',
      () async {
        await repository.createReport(
          _createReport(),
          localMediaPaths: ['/tmp/a.jpg', '/tmp/b.jpg'],
        );
        final drafts = await IsarStorage.instance.lostHorseMediaDrafts
            .where()
            .findAll();
        final draftIds = drafts.map((d) => d.mediaId).toList();

        final result = await repository.publishReport('r1');

        expect(result.isSuccess, isTrue);
        final queue = await _queuedItems();
        final publish = queue.singleWhere(
          (item) => item.entityType == 'lost_horse_publish',
        );
        expect(publish.entityId, 'r1');
        expect(publish.action, SyncAction.update);
        expect(
          (publish.data['expected_media_ids'] as List<dynamic>).cast<String>(),
          draftIds,
        );
      },
    );

    test('publishReport honors explicit expectedMediaIds', () async {
      await repository.createReport(_createReport());

      final result = await repository.publishReport(
        'r1',
        expectedMediaIds: ['manual-id-1'],
      );

      expect(result.isSuccess, isTrue);
      final queue = await _queuedItems();
      final publish = queue.singleWhere(
        (item) => item.entityType == 'lost_horse_publish',
      );
      expect(
        (publish.data['expected_media_ids'] as List<dynamic>).cast<String>(),
        ['manual-id-1'],
      );
    });

    test(
      'resolveReport reunited marks report found and disables public access',
      () async {
        await repository.createReport(_createReport());

        final result = await repository.resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.reunited,
          note: 'Эзэндээ буцаж ирсэн',
          verifiedSightingId: 's9',
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.status, LostHorseStatus.found);
        expect(result.value.resolutionType, LostHorseResolutionType.reunited);
        expect(result.value.resolutionNote, 'Эзэндээ буцаж ирсэн');
        expect(result.value.verifiedSightingId, 's9');
        expect(result.value.resolvedAt, isNotNull);
        expect(result.value.publicAccessEnabled, isFalse);

        final queue = await _queuedItems();
        final resolution = queue.singleWhere(
          (item) => item.entityType == 'lost_horse_resolution',
        );
        expect(resolution.action, SyncAction.update);
        expect(resolution.data['resolution_type'], 'reunited');
        expect(resolution.data['resolution_note'], 'Эзэндээ буцаж ирсэн');
      },
    );

    test('resolveReport withdrawn marks report cancelled', () async {
      await repository.createReport(_createReport());

      final result = await repository.resolveReport(
        reportId: 'r1',
        resolutionType: LostHorseResolutionType.withdrawn,
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.status, LostHorseStatus.cancelled);
      expect(result.value.resolutionType, LostHorseResolutionType.withdrawn);

      final queue = await _queuedItems();
      expect(
        queue.any((item) => item.entityType == 'lost_horse_resolution'),
        isTrue,
      );
    });

    test(
      'resolveReport on missing report fails without corrupting state',
      () async {
        final result = await repository.resolveReport(
          reportId: 'missing',
          resolutionType: LostHorseResolutionType.withdrawn,
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_NOT_FOUND');
        expect(await _queuedItems(), isEmpty);
      },
    );

    // ── Sightings ────────────────────────────────────────────────

    test('createSighting stores and enqueues a create item', () async {
      final sighting = _createSighting();

      final result = await repository.createSighting(sighting);

      expect(result.isSuccess, isTrue);

      final sightings = await repository.getSightings('r1');
      expect(sightings.isSuccess, isTrue);
      expect(sightings.value.single.id, 's1');

      final queue = await _queuedItems();
      expect(queue, hasLength(1));
      expect(queue.single.entityType, 'lost_horse_sighting');
      expect(queue.single.entityId, 's1');
      expect(queue.single.action, SyncAction.create);
      expect(queue.single.queueId, 'lost_horse_sighting:s1');
    });

    test('getSightings returns newest first for a report', () async {
      await repository.createSighting(
        _createSighting(id: 'old', now: DateTime(2026, 1, 1)),
      );
      await repository.createSighting(
        _createSighting(id: 'new', now: DateTime(2026, 6, 1)),
      );

      final result = await repository.getSightings('r1');

      expect(result.isSuccess, isTrue);
      expect(result.value.map((s) => s.id), ['new', 'old']);
    });

    test('getSightings returns empty for unknown report', () async {
      final result = await repository.getSightings('missing');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test(
      'reviewSighting confirms status and enqueues an update item',
      () async {
        await repository.createSighting(_createSighting());

        final result = await repository.reviewSighting(
          sightingId: 's1',
          status: SightingStatus.confirmed,
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.status, SightingStatus.confirmed);
        expect(result.value.reviewedAt, isNotNull);

        final queue = await _queuedItems();
        final review = queue.singleWhere(
          (item) =>
              item.entityType == 'lost_horse_sighting' &&
              item.action == SyncAction.update,
        );
        expect(review.entityId, 's1');
        expect(review.data['status'], 'confirmed');
        expect(review.queueId, 'lost_horse_sighting_review:s1');
      },
    );

    test(
      'reviewSighting returns SIGHTING_NOT_FOUND for missing sighting',
      () async {
        final result = await repository.reviewSighting(
          sightingId: 'missing',
          status: SightingStatus.dismissed,
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SIGHTING_NOT_FOUND');
      },
    );
  });
}
