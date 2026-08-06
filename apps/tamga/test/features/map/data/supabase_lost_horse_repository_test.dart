import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/storage/cloud/media_storage_service.dart';
import 'package:tamga/src/core/storage/cloud/media_upload_result.dart';
import 'package:tamga/src/features/map/data/lost_horse_repository.dart';
import 'package:tamga/src/features/map/data/supabase_lost_horse_repository.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/features/map/domain/sighting_report.dart';

// ── Mocks ────────────────────────────────────────────────────────────────

class _MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Fake Supabase builders ───────────────────────────────────────────────
//
// PostgrestBuilder implements Future<T>, so awaiting a builder resolves
// through its `then`. These fakes let a whole query chain resolve to a
// preset value without touching mocktail's builder state.

class _FakeListFilter extends Fake
    implements PostgrestFilterBuilder<List<Map<String, dynamic>>> {
  _FakeListFilter({
    required List<Map<String, dynamic>> rows,
    Map<String, dynamic>? singleRow,
  }) : _rows = rows,
       _singleRow = singleRow ?? const <String, dynamic>{};

  final List<Map<String, dynamic>> _rows;
  final Map<String, dynamic> _singleRow;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> eq(
    String column,
    Object value,
  ) => this;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> limit(
    int count, {
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> inFilter(
    String column,
    List values,
  ) => this;

  @override
  PostgrestTransformBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) => this;

  @override
  PostgrestTransformBuilder<Map<String, dynamic>> single() =>
      _FakeMapFilter(row: _singleRow);

  @override
  PostgrestTransformBuilder<Map<String, dynamic>?> maybeSingle() =>
      _FakeMapFilter(row: _singleRow);

  @override
  Future<R> then<R>(
    FutureOr<R> Function(List<Map<String, dynamic>> value) onValue, {
    Function? onError,
  }) => Future.value(_rows).then(onValue, onError: onError);

  @override
  Future<List<Map<String, dynamic>>> catchError(
    Function onError, {
    bool Function(Object error)? test,
  }) => Future.value(_rows).catchError(onError, test: test);

  @override
  Future<List<Map<String, dynamic>>> whenComplete(
    FutureOr<void> Function() action,
  ) => Future.value(_rows).whenComplete(action);

  @override
  Stream<List<Map<String, dynamic>>> asStream() => Stream.value(_rows);

  @override
  Future<List<Map<String, dynamic>>> timeout(
    Duration timeLimit, {
    FutureOr<List<Map<String, dynamic>>> Function()? onTimeout,
  }) => Future.value(_rows).timeout(timeLimit, onTimeout: onTimeout);
}

class _FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>> {
  _FakeMapFilter({Map<String, dynamic>? row})
    : _row = row ?? const <String, dynamic>{};

  final Map<String, dynamic> _row;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> eq(
    String column,
    Object value,
  ) => this;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> limit(
    int count, {
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> inFilter(
    String column,
    List values,
  ) => this;

  @override
  PostgrestTransformBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) => _FakeListFilter(rows: const [], singleRow: _row);

  @override
  PostgrestTransformBuilder<Map<String, dynamic>> single() => this;

  @override
  PostgrestTransformBuilder<Map<String, dynamic>?> maybeSingle() => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic> value) onValue, {
    Function? onError,
  }) => Future.value(_row).then(onValue, onError: onError);

  @override
  Future<Map<String, dynamic>> catchError(
    Function onError, {
    bool Function(Object error)? test,
  }) => Future.value(_row).catchError(onError, test: test);

  @override
  Future<Map<String, dynamic>> whenComplete(FutureOr<void> Function() action) =>
      Future.value(_row).whenComplete(action);

  @override
  Stream<Map<String, dynamic>> asStream() => Stream.value(_row);

  @override
  Future<Map<String, dynamic>> timeout(
    Duration timeLimit, {
    FutureOr<Map<String, dynamic>> Function()? onTimeout,
  }) => Future.value(_row).timeout(timeLimit, onTimeout: onTimeout);
}

class _FakeRpcFilter extends Fake implements PostgrestFilterBuilder<dynamic> {
  _FakeRpcFilter(this.result);

  final Object? result;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(dynamic value) onValue, {
    Function? onError,
  }) => Future<dynamic>.value(result).then(onValue, onError: onError);

  @override
  Future<dynamic> catchError(
    Function onError, {
    bool Function(Object error)? test,
  }) => Future<dynamic>.value(result).catchError(onError, test: test);

  @override
  Future<dynamic> whenComplete(FutureOr<void> Function() action) =>
      Future<dynamic>.value(result).whenComplete(action);

  @override
  Stream<dynamic> asStream() => Stream<dynamic>.value(result);

  @override
  Future<dynamic> timeout(
    Duration timeLimit, {
    FutureOr<dynamic> Function()? onTimeout,
  }) => Future<dynamic>.value(result).timeout(timeLimit, onTimeout: onTimeout);
}

class _FakeStreamBuilder extends Fake implements SupabaseStreamFilterBuilder {
  _FakeStreamBuilder(this.rows);

  final List<Map<String, dynamic>> rows;

  @override
  SupabaseStreamBuilder eq(String column, Object value) => this;

  @override
  SupabaseStreamBuilder order(String column, {bool ascending = false}) => this;

  @override
  Stream<R> map<R>(R Function(List<Map<String, dynamic>> event) convert) =>
      Stream.value(convert(rows));
}

// ignore: must_be_immutable
class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({
    List<Map<String, dynamic>>? rows,
    Map<String, dynamic>? singleRow,
    this.insertError,
  }) : rows = rows ?? <Map<String, dynamic>>[],
       singleRow = singleRow ?? const <String, dynamic>{};

  final List<Map<String, dynamic>> rows;
  Map<String, dynamic> singleRow;
  final List<Map<String, dynamic>> streamRows = const [];
  Object? insertError;

  /// Payload captured from the last [insert]/[update]/[upsert] call.
  Object? lastInsert;
  Object? lastUpdate;
  Object? lastUpsert;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) => _FakeListFilter(rows: rows, singleRow: singleRow);

  @override
  PostgrestFilterBuilder<dynamic> insert(
    Object values, {
    bool defaultToNull = true,
  }) {
    lastInsert = values;
    if (insertError != null) throw insertError!;
    return _FakeMapFilter(row: singleRow);
  }

  @override
  PostgrestFilterBuilder<dynamic> update(Map values) {
    lastUpdate = values;
    return _FakeMapFilter(row: singleRow);
  }

  @override
  PostgrestFilterBuilder<dynamic> delete() => _FakeMapFilter(row: singleRow);

  @override
  PostgrestFilterBuilder<dynamic> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) {
    lastUpsert = values;
    return _FakeMapFilter(row: singleRow);
  }

  @override
  SupabaseStreamFilterBuilder stream({
    required List<String> primaryKey,
    bool private = false,
  }) => _FakeStreamBuilder(streamRows);
}

class _FakeMediaStorage extends Fake implements MediaStorageService {
  final uploadedPaths = <String>[];
  final signedUrlPaths = <String>[];

  Result<MediaUploadResult> uploadResult = const Result.ok(
    MediaUploadResult(
      url: 'https://cdn/upload',
      path: 'uploaded/path.jpg',
      fileSize: 1,
      mimeType: 'image/jpeg',
    ),
  );

  Result<String> signedUrlResult = const Result.ok('https://signed/url');

  @override
  Future<Result<MediaUploadResult>> upload({
    required File file,
    required String path,
    required MediaCategory category,
  }) async {
    uploadedPaths.add(path);
    return uploadResult;
  }

  @override
  Future<Result<String>> getSignedUrl({
    required String path,
    required MediaCategory category,
    Duration expiry = const Duration(hours: 1),
  }) async {
    signedUrlPaths.add(path);
    return signedUrlResult;
  }
}

// ── Row fixtures ─────────────────────────────────────────────────────────

Map<String, dynamic> reportRow({
  String id = 'r1',
  String ownerId = 'o1',
  String? horseName = 'Test Horse',
  String status = 'active',
}) {
  return {
    'id': id,
    'horse_id': null,
    'owner_id': ownerId,
    'horse_name': horseName,
    'description': 'Lost near the river',
    'last_seen_lat': 47.9,
    'last_seen_lng': 106.9,
    'last_seen_at': '2026-06-01T10:00:00.000',
    'search_radius_km': 5.0,
    'status': status,
    'photo_url': null,
    'created_at': '2026-06-01T10:00:00.000',
    'updated_at': '2026-06-01T10:00:00.000',
    'location_aimag': 'Төв',
    'location_sum': 'Баянгол',
    'location_bag': null,
    'location_name': null,
    'animal_type': 'horse',
    'animal_ages': <dynamic>['unaga'],
    'gender': 'gelding',
    'breed': 'mongol',
    'sighting_count': 2,
    'coat_color': 'Хээр',
    'lost_count': 1,
    'photo_urls': <dynamic>[],
    'video_urls': <dynamic>[],
    'tamga_image_url': null,
    'ear_mark_description': null,
    'contact_phone': null,
    'pricing_tier': 'free',
    'expires_at': null,
    'renewal_requested': false,
    'public_token_hash': null,
    'public_access_enabled': false,
    'public_location_precision': 'sum',
    'public_contact_mode': 'none',
    'resolution_type': null,
    'resolution_note': null,
    'resolved_at': null,
    'resolved_by': null,
    'verified_sighting_id': null,
    'reviewed_at': null,
    'reviewed_by': null,
  };
}

Map<String, dynamic> sightingRow({
  String id = 's1',
  String reportId = 'r1',
  String reporterId = 'u1',
  String? photoUrl,
  String status = 'pending',
}) {
  return {
    'id': id,
    'report_id': reportId,
    'reporter_id': reporterId,
    'lat': 47.85,
    'lng': 106.92,
    'location_name': 'Bridge area',
    'description': 'Saw a bay horse',
    'photo_url': photoUrl,
    'client_id': null,
    'reviewed_at': null,
    'reviewed_by': null,
    'is_anonymous': false,
    'status': status,
    'created_at': '2026-06-02T08:00:00.000',
  };
}

LostHorseReport reportFromRow(Map<String, dynamic> row) =>
    LostHorseReport.fromJson(row);

// ── Tests ────────────────────────────────────────────────────────────────

void main() {
  late _MockSupabaseClient client;
  late _FakeMediaStorage mediaStorage;

  setUp(() {
    client = _MockSupabaseClient();
    mediaStorage = _FakeMediaStorage();
  });

  SupabaseLostHorseRepository repo() =>
      SupabaseLostHorseRepository(client: client, mediaStorage: mediaStorage);

  void stubReportsTable(_FakeQueryBuilder table) {
    when(() => client.from('lost_horse_reports')).thenAnswer((_) => table);
  }

  void stubMediaTable(_FakeQueryBuilder table) {
    when(() => client.from('lost_horse_media')).thenAnswer((_) => table);
  }

  group('SupabaseLostHorseRepository', () {
    test('implements LostHorseRepository', () {
      expect(repo(), isA<LostHorseRepository>());
    });

    // ── createReport ──────────────────────────────────────────────

    group('createReport', () {
      test('inserts the report and returns the saved row', () async {
        final row = reportRow();
        final table = _FakeQueryBuilder(rows: [row], singleRow: row);
        stubReportsTable(table);
        stubMediaTable(_FakeQueryBuilder());

        final result = await repo().createReport(
          reportFromRow(row).copyWith(publicTokenHash: 'sha256-hash'),
        );

        expect(result.isSuccess, isTrue);
        final saved = result.value;
        expect(saved.id, 'r1');
        expect(saved.ownerId, 'o1');
        expect(saved.horseName, 'Test Horse');
        expect(saved.description, 'Lost near the river');
        expect(saved.lastSeenLat, 47.9);
        expect(saved.lastSeenLng, 106.9);
        expect(saved.lastSeenAt, DateTime.parse('2026-06-01T10:00:00.000'));
        expect(saved.animalType, AnimalType.horse);
        expect(saved.ages, [AnimalAge.unaga]);
        expect(saved.lostCount, 1);
        expect(saved.sightingCount, 2);
        expect(saved.locationAimag, 'Төв');
        expect(saved.locationSum, 'Баянгол');
        expect(saved.status, LostHorseStatus.active);
        expect(saved.createdAt, DateTime.parse('2026-06-01T10:00:00.000'));

        final payload = table.lastInsert! as Map<String, dynamic>;
        expect(payload['owner_id'], 'o1');
        expect(payload.containsKey('photo_urls'), isFalse);
        expect(payload.containsKey('video_urls'), isFalse);
        // The share-token digest is created client-side and must reach the DB
        // so the owner can later generate a public share link.
        expect(payload.containsKey('public_token_hash'), isTrue);
        expect(payload['public_token_hash'], 'sha256-hash');
      });

      test('returns REPORT_CREATE_FAILED when insert throws', () async {
        final table = _FakeQueryBuilder(
          rows: const [],
          insertError: Exception('db down'),
        );
        stubReportsTable(table);

        final result = await repo().createReport(reportFromRow(reportRow()));

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_CREATE_FAILED');
      });

      test('falls back to select-by-id on 23505 duplicate', () async {
        final row = reportRow();
        final table = _FakeQueryBuilder(
          rows: [row],
          singleRow: row,
          insertError: const PostgrestException(message: 'dup', code: '23505'),
        );
        stubReportsTable(table);
        stubMediaTable(_FakeQueryBuilder());

        final result = await repo().createReport(reportFromRow(row));

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'r1');
      });

      test('uploads local media files and upserts media rows', () async {
        final row = reportRow();
        stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
        final mediaTable = _FakeQueryBuilder();
        stubMediaTable(mediaTable);

        final dir = await Directory.systemTemp.createTemp('tamga_media_test');
        addTearDown(() => dir.delete(recursive: true));
        final file = File('${dir.path}/photo.jpg');
        await file.writeAsBytes([1, 2, 3]);

        final result = await repo().createReport(
          reportFromRow(row),
          localMediaPaths: [file.path],
        );

        expect(result.isSuccess, isTrue);
        expect(mediaStorage.uploadedPaths, hasLength(1));
        expect(mediaStorage.uploadedPaths.single, startsWith('o1/r1/'));
        final payload = mediaTable.lastUpsert! as Map<String, dynamic>;
        expect(payload['report_id'], 'r1');
        expect(payload['url'], 'uploaded/path.jpg');
        expect(payload['storage_path'], 'uploaded/path.jpg');
        expect(payload['media_type'], 'photo');
        expect(payload['sort_order'], 0);
        expect(payload.containsKey('id'), isFalse);
      });

      test(
        'skips upload when media already exists remotely for a missing file',
        () async {
          final row = reportRow();
          stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
          final mediaTable = _FakeQueryBuilder(
            singleRow: {'storage_path': 'already/up.jpg'},
          );
          stubMediaTable(mediaTable);

          final result = await repo().createReport(
            reportFromRow(row),
            localMediaPaths: ['/definitely/missing.jpg'],
            mediaIds: ['m1'],
          );

          expect(result.isSuccess, isTrue);
          expect(mediaStorage.uploadedPaths, isEmpty);
          expect(mediaTable.lastUpsert, isNull);
        },
      );

      test(
        'returns REPORT_CREATE_FAILED when local media file is missing',
        () async {
          final row = reportRow();
          stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
          stubMediaTable(_FakeQueryBuilder());

          final result = await repo().createReport(
            reportFromRow(row),
            localMediaPaths: ['/definitely/missing.jpg'],
          );

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'REPORT_CREATE_FAILED');
          expect(mediaStorage.uploadedPaths, isEmpty);
        },
      );
    });

    // ── getReport ─────────────────────────────────────────────────

    group('getReport', () {
      test('returns the report when no media rows exist', () async {
        final row = reportRow();
        stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
        stubMediaTable(_FakeQueryBuilder());

        final result = await repo().getReport('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'r1');
        expect(result.value.ownerId, 'o1');
        expect(result.value.horseName, 'Test Horse');
        expect(result.value.photoUrls, isEmpty);
        expect(mediaStorage.signedUrlPaths, isEmpty);
      });

      test('attaches signed photo urls from private media rows', () async {
        final row = reportRow();
        stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
        stubMediaTable(
          _FakeQueryBuilder(
            rows: [
              {
                'url': 'p1',
                'storage_path': 'o1/r1/0.jpg',
                'media_type': 'photo',
              },
              {
                'url': 'v1',
                'storage_path': 'o1/r1/1.mp4',
                'media_type': 'video',
              },
            ],
          ),
        );

        final result = await repo().getReport('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value.photoUrls, ['https://signed/url']);
        expect(mediaStorage.signedUrlPaths, ['o1/r1/0.jpg']);
      });

      test('keeps report unchanged when signing fails', () async {
        mediaStorage.signedUrlResult = Result.fail(
          AppException.withDetail('SIGN_FAILED', 'no url'),
        );
        final row = reportRow();
        stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
        stubMediaTable(
          _FakeQueryBuilder(
            rows: [
              {
                'url': 'p1',
                'storage_path': 'o1/r1/0.jpg',
                'media_type': 'photo',
              },
            ],
          ),
        );

        final result = await repo().getReport('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value.photoUrls, isEmpty);
      });

      test('returns REPORT_READ_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getReport('r1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_READ_FAILED');
      });
    });

    // ── getMyReports ──────────────────────────────────────────────

    group('getMyReports', () {
      test('maps every row to a report', () async {
        final r1 = reportRow(id: 'r1');
        final r2 = reportRow(id: 'r2', horseName: 'Second Horse');
        stubReportsTable(_FakeQueryBuilder(rows: [r1, r2], singleRow: r1));
        stubMediaTable(_FakeQueryBuilder());

        final result = await repo().getMyReports('o1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value[0].id, 'r1');
        expect(result.value[0].ownerId, 'o1');
        expect(result.value[1].id, 'r2');
        expect(result.value[1].horseName, 'Second Horse');
        expect(result.value[1].lastSeenLat, 47.9);
      });

      test('returns an empty list when there are no rows', () async {
        stubReportsTable(_FakeQueryBuilder());
        stubMediaTable(_FakeQueryBuilder());

        final result = await repo().getMyReports('o1');

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns REPORT_LIST_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getMyReports('o1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_LIST_FAILED');
      });
    });

    // ── browseActiveReports ───────────────────────────────────────

    group('browseActiveReports', () {
      test('maps redacted rpc rows to public reports', () async {
        final row = {
          'id': 'r1',
          'horse_name': 'Bay Horse',
          'description': 'Public description',
          'animal_type': 'cattle',
          'lost_count': 3,
          'location_aimag': 'Сэлэнгэ',
          'location_sum': 'Мандал',
          'location_bag': 'Bag 1',
          'location_name': 'Valley',
          'last_seen_at': '2026-06-01T10:00:00.000',
          'sighting_count': 5,
          'created_at': '2026-06-01T10:00:00.000',
          'public_location_precision': 'bag',
          'public_contact_mode': 'phone',
        };
        when(
          () => client.rpc('browse_active_lost_horse_reports'),
        ).thenAnswer((_) => _FakeRpcFilter([row]));

        final result = await repo().browseActiveReports();

        expect(result.isSuccess, isTrue);
        final report = result.value.single;
        expect(report.id, 'r1');
        expect(report.ownerId, isEmpty);
        expect(report.horseName, 'Bay Horse');
        expect(report.animalType, AnimalType.cattle);
        expect(report.lostCount, 3);
        expect(report.locationAimag, 'Сэлэнгэ');
        expect(report.locationSum, 'Мандал');
        expect(report.locationBag, 'Bag 1');
        expect(report.locationName, 'Valley');
        expect(report.lastSeenLat, 0);
        expect(report.lastSeenLng, 0);
        expect(report.sightingCount, 5);
        expect(report.publicAccessEnabled, isTrue);
        expect(report.publicLocationPrecision, 'bag');
        expect(report.publicContactMode, 'phone');
      });

      test('returns an empty list for an empty rpc result', () async {
        when(
          () => client.rpc('browse_active_lost_horse_reports'),
        ).thenAnswer((_) => _FakeRpcFilter([]));

        final result = await repo().browseActiveReports();

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns REPORT_BROWSE_FAILED when rpc throws', () async {
        when(
          () => client.rpc('browse_active_lost_horse_reports'),
        ).thenThrow(Exception('boom'));

        final result = await repo().browseActiveReports();

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_BROWSE_FAILED');
      });
    });

    // ── publishReport ─────────────────────────────────────────────

    group('publishReport', () {
      test('calls the publish rpc then reloads the report', () async {
        final row = reportRow();
        stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
        stubMediaTable(_FakeQueryBuilder());
        when(
          () => client.rpc(
            'publish_lost_horse_submission',
            params: any(named: 'params'),
          ),
        ).thenAnswer((_) => _FakeRpcFilter(null));

        final result = await repo().publishReport(
          'r1',
          expectedMediaIds: ['m1', 'm2'],
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'r1');
        final captured = verify(
          () => client.rpc(
            'publish_lost_horse_submission',
            params: captureAny(named: 'params'),
          ),
        ).captured;
        expect(captured.single, {
          'p_report_id': 'r1',
          'p_expected_media_ids': ['m1', 'm2'],
        });
      });

      test('returns REPORT_PUBLISH_FAILED when rpc throws', () async {
        when(
          () => client.rpc(
            'publish_lost_horse_submission',
            params: any(named: 'params'),
          ),
        ).thenThrow(Exception('boom'));

        final result = await repo().publishReport('r1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_PUBLISH_FAILED');
      });
    });

    // ── resolveReport ─────────────────────────────────────────────

    group('resolveReport', () {
      test('calls the resolve rpc with resolution fields', () async {
        final row = reportRow();
        stubReportsTable(_FakeQueryBuilder(rows: [row], singleRow: row));
        stubMediaTable(_FakeQueryBuilder());
        when(
          () => client.rpc(
            'resolve_lost_horse_report',
            params: any(named: 'params'),
          ),
        ).thenAnswer((_) => _FakeRpcFilter(null));

        final result = await repo().resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.reunited,
          note: 'Found by neighbor',
          verifiedSightingId: 's1',
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'r1');
        final captured = verify(
          () => client.rpc(
            'resolve_lost_horse_report',
            params: captureAny(named: 'params'),
          ),
        ).captured;
        expect(captured.single, {
          'p_report_id': 'r1',
          'p_resolution_type': 'reunited',
          'p_resolution_note': 'Found by neighbor',
          'p_verified_sighting_id': 's1',
        });
      });

      test('returns REPORT_RESOLVE_FAILED when rpc throws', () async {
        when(
          () => client.rpc(
            'resolve_lost_horse_report',
            params: any(named: 'params'),
          ),
        ).thenThrow(Exception('boom'));

        final result = await repo().resolveReport(
          reportId: 'r1',
          resolutionType: LostHorseResolutionType.withdrawn,
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_RESOLVE_FAILED');
      });
    });

    // ── createSighting ────────────────────────────────────────────

    group('createSighting', () {
      late _FakeQueryBuilder sightingsTable;

      setUp(() {
        sightingsTable = _FakeQueryBuilder();
        when(
          () => client.from('lost_horse_sightings'),
        ).thenAnswer((_) => sightingsTable);
      });

      test('inserts the sighting and returns the saved row', () async {
        final row = sightingRow();
        sightingsTable
          ..rows.add(row)
          ..singleRow = row;

        final result = await repo().createSighting(
          SightingReport.fromJson(row),
        );

        expect(result.isSuccess, isTrue);
        final saved = result.value;
        expect(saved.id, 's1');
        expect(saved.reportId, 'r1');
        expect(saved.reporterId, 'u1');
        expect(saved.lat, 47.85);
        expect(saved.lng, 106.92);
        expect(saved.locationName, 'Bridge area');
        expect(saved.description, 'Saw a bay horse');
        expect(saved.status, SightingStatus.pending);
        expect(saved.createdAt, DateTime.parse('2026-06-02T08:00:00.000'));

        final payload = sightingsTable.lastInsert! as Map<String, dynamic>;
        expect(payload['report_id'], 'r1');
        expect(payload['id'], 's1');
      });

      test('falls back to client_id lookup on 23505 duplicate', () async {
        final row = sightingRow();
        sightingsTable
          ..rows.add(row)
          ..singleRow = row;
        final throwing = _FakeQueryBuilder(
          rows: [row],
          singleRow: row,
          insertError: const PostgrestException(message: 'dup', code: '23505'),
        );
        when(
          () => client.from('lost_horse_sightings'),
        ).thenAnswer((_) => throwing);

        final result = await repo().createSighting(
          SightingReport.fromJson(row).copyWith(clientId: 'client-1'),
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 's1');
        final payload = throwing.lastInsert! as Map<String, dynamic>;
        expect(payload['client_id'], 'client-1');
      });

      test('returns SIGHTING_CREATE_FAILED when insert throws', () async {
        final row = sightingRow();
        sightingsTable.insertError = Exception('boom');

        final result = await repo().createSighting(
          SightingReport.fromJson(row),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SIGHTING_CREATE_FAILED');
      });

      test('uploads a local photo and stores its path', () async {
        final row = sightingRow();
        sightingsTable
          ..rows.add(row)
          ..singleRow = row;

        final dir = await Directory.systemTemp.createTemp('tamga_sighting');
        addTearDown(() => dir.delete(recursive: true));
        final file = File('${dir.path}/photo.png');
        await file.writeAsBytes([1, 2, 3]);

        final result = await repo().createSighting(
          SightingReport.fromJson(row).copyWith(photoUrl: file.path),
        );

        expect(result.isSuccess, isTrue);
        expect(mediaStorage.uploadedPaths, hasLength(1));
        final payload = sightingsTable.lastInsert! as Map<String, dynamic>;
        expect(payload['photo_url'], 'uploaded/path.jpg');
        expect(payload['storage_path'], 'uploaded/path.jpg');
      });
    });

    // ── getSightings ──────────────────────────────────────────────

    group('getSightings', () {
      test('maps rows to sightings', () async {
        final s1 = sightingRow(id: 's1');
        final s2 = sightingRow(id: 's2', reporterId: 'u2');
        when(
          () => client.from('lost_horse_sightings'),
        ).thenAnswer((_) => _FakeQueryBuilder(rows: [s1, s2], singleRow: s1));

        final result = await repo().getSightings('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value[0].id, 's1');
        expect(result.value[0].reportId, 'r1');
        expect(result.value[0].lat, 47.85);
        expect(result.value[1].id, 's2');
        expect(result.value[1].reporterId, 'u2');
        expect(mediaStorage.signedUrlPaths, isEmpty);
      });

      test('attaches signed photo urls when photoUrl is set', () async {
        final row = sightingRow(photoUrl: 'sightings/u1/r1/x.jpg');
        when(
          () => client.from('lost_horse_sightings'),
        ).thenAnswer((_) => _FakeQueryBuilder(rows: [row], singleRow: row));

        final result = await repo().getSightings('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.photoUrl, 'https://signed/url');
        expect(mediaStorage.signedUrlPaths, ['sightings/u1/r1/x.jpg']);
      });

      test('returns an empty list when there are no rows', () async {
        when(
          () => client.from('lost_horse_sightings'),
        ).thenAnswer((_) => _FakeQueryBuilder());

        final result = await repo().getSightings('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns SIGHTING_LIST_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getSightings('r1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SIGHTING_LIST_FAILED');
      });
    });

    // ── reviewSighting ────────────────────────────────────────────

    group('reviewSighting', () {
      test('updates the status and returns the reviewed sighting', () async {
        final row = sightingRow(status: 'confirmed');
        when(
          () => client.from('lost_horse_sightings'),
        ).thenAnswer((_) => _FakeQueryBuilder(rows: [row], singleRow: row));

        final result = await repo().reviewSighting(
          sightingId: 's1',
          status: SightingStatus.confirmed,
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 's1');
        expect(result.value.status, SightingStatus.confirmed);
      });

      test('returns SIGHTING_REVIEW_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().reviewSighting(
          sightingId: 's1',
          status: SightingStatus.dismissed,
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SIGHTING_REVIEW_FAILED');
      });
    });
  });
}
