import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tamga/src/features/map/data/map_repository.dart';
import 'package:tamga/src/features/map/data/supabase_map_repository.dart';
import 'package:tamga/src/features/map/domain/geofence_alert.dart';
import 'package:tamga/src/features/map/domain/horse_location.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/features/map/domain/pasture_zone.dart';
import 'package:tamga/src/features/map/domain/search_area.dart';

// ── Mocks ────────────────────────────────────────────────────────────────

class _MockSupabaseClient extends Mock implements SupabaseClient {}

class _MockRealtimeChannel extends Mock implements RealtimeChannel {}

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

  /// Filter-chain calls captured in order, so tests can assert scoping.
  final List<({String column, Object? value})> eqCalls = [];
  final List<({String column, List<Object?> values})> inFilterCalls = [];
  final List<String> orderColumns = [];
  final List<int> limitCounts = [];

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> eq(
    String column,
    Object value,
  ) {
    eqCalls.add((column: column, value: value));
    return this;
  }

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) {
    orderColumns.add(column);
    return this;
  }

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> limit(
    int count, {
    String? referencedTable,
  }) {
    limitCounts.add(count);
    return this;
  }

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> inFilter(
    String column,
    List values,
  ) {
    inFilterCalls.add((column: column, values: values));
    return this;
  }

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

// ignore: must_be_immutable
class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({this.rows = const [], Map<String, dynamic>? singleRow})
    : singleRow = singleRow ?? const <String, dynamic>{};

  final List<Map<String, dynamic>> rows;
  Map<String, dynamic> singleRow;
  final List<Map<String, dynamic>> streamRows = const [];

  /// Payload captured from the last [insert]/[update]/[upsert] call.
  Object? lastInsert;
  Object? lastUpdate;
  Object? lastUpsert;

  /// The filter chain produced by the last [select] call, so tests can
  /// assert which filters (eq/inFilter/order/limit) the query applied.
  _FakeListFilter? lastListFilter;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) {
    final filter = _FakeListFilter(rows: rows, singleRow: singleRow);
    lastListFilter = filter;
    return filter;
  }

  @override
  PostgrestFilterBuilder<dynamic> insert(
    Object values, {
    bool defaultToNull = true,
  }) {
    lastInsert = values;
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

// ── Row fixtures ─────────────────────────────────────────────────────────

Map<String, dynamic> reportRow({
  String id = 'r1',
  String ownerId = 'o1',
  String? horseName = 'Test Horse',
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
    'status': 'active',
    'photo_url': null,
    'created_at': '2026-06-01T10:00:00.000',
    'updated_at': '2026-06-01T10:00:00.000',
    'location_aimag': 'Төв',
    'location_sum': 'Баянгол',
    'location_bag': null,
    'location_name': null,
    'animal_type': 'horse',
    'animal_ages': <dynamic>[],
    'gender': null,
    'breed': null,
    'sighting_count': 0,
    'coat_color': null,
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

Map<String, dynamic> searchAreaRow() {
  return {
    'id': 'sa1',
    'name': 'Search area',
    'center_lat': 47.9,
    'center_lng': 106.9,
    'radius_km': 5.0,
    'color': 0xFFF06A2E,
    'is_active': true,
    'created_by': 'u1',
    'created_at': '2026-06-01T10:00:00.000',
  };
}

Map<String, dynamic> horseLocationRow({
  String horseId = 'h1',
  double lat = 47.9,
  double lng = 106.9,
  bool isVisible = true,
}) {
  return {
    'horse_id': horseId,
    'horse_name': 'Horse $horseId',
    'owner_id': 'o1',
    'owner_name': 'Owner',
    'lat': lat,
    'lng': lng,
    'last_updated': '2026-06-01T10:00:00.000',
    'is_visible': isVisible,
    'coat_color': 'Хээр',
  };
}

Map<String, dynamic> geofenceAlertRow() {
  return {
    'id': 'a1',
    'horse_id': 'h1',
    'horse_name': 'Horse',
    'geofence_id': 'z1',
    'geofence_name': 'Zone',
    'alert_type': 'entered',
    'triggered_at': '2026-06-01T10:00:00.000',
    'horse_lat': 47.9,
    'horse_lng': 106.9,
    'acknowledged': false,
  };
}

Map<String, dynamic> pastureZoneRow({
  String id = 'z1',
  List<Map<String, dynamic>>? assignments = const [
    {'horse_id': 'h1'},
    {'horse_id': 'h2'},
  ],
}) {
  return {
    'id': id,
    'name': 'Zone $id',
    'owner_id': 'u1',
    'center_lat': 47.9,
    'center_lng': 106.9,
    'radius_km': 5.0,
    'last_rotation_date': null,
    'max_occupancy_days': 14,
    'is_active': true,
    'created_at': null,
    'updated_at': null,
    // isar_generator's bundled analyzer predates null-aware elements, so the
    // conditional entry form is intentional.
    // ignore: use_null_aware_elements
    if (assignments != null) 'pasture_assignments': assignments,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

void main() {
  late _MockSupabaseClient client;

  setUpAll(() {
    // Fallback needed for `any(named: 'callback')` in stubChannel: the
    // callback parameter is a function type, so mocktail can't synthesize it.
    registerFallbackValue((PostgresChangePayload _) {});
  });

  setUp(() {
    client = _MockSupabaseClient();
  });

  SupabaseMapRepository repo() => SupabaseMapRepository(client: client);

  _FakeQueryBuilder stubTable(
    String table, {
    List<Map<String, dynamic>> rows = const [],
    Map<String, dynamic>? singleRow,
  }) {
    final builder = _FakeQueryBuilder(rows: rows, singleRow: singleRow);
    when(() => client.from(table)).thenAnswer((_) => builder);
    return builder;
  }

  void stubChannel() {
    final channel = _MockRealtimeChannel();
    when(() => client.channel(any())).thenAnswer((_) => channel);
    when(
      () => channel.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: any(named: 'schema'),
        table: any(named: 'table'),
        callback: any(named: 'callback'),
      ),
    ).thenAnswer((_) => channel);
    when(() => channel.subscribe()).thenAnswer((_) => channel);
    when(
      () => channel.unsubscribe(),
    ).thenAnswer((_) => Future.value('unsubscribed'));
  }

  group('SupabaseMapRepository', () {
    test('implements MapRepository', () {
      expect(repo(), isA<MapRepository>());
    });

    // ── Lost horse reports ────────────────────────────────────────

    group('reportLostHorse', () {
      test(
        'inserts the report without an id and returns the saved row',
        () async {
          final row = reportRow();
          final table = stubTable('lost_horse_reports', singleRow: row);

          final result = await repo().reportLostHorse(
            LostHorseReport.fromJson(row),
          );

          expect(result.isSuccess, isTrue);
          expect(result.value.id, 'r1');
          expect(result.value.ownerId, 'o1');
          expect(result.value.horseName, 'Test Horse');
          expect(result.value.lastSeenLat, 47.9);
          expect(result.value.status, LostHorseStatus.active);

          final payload = table.lastInsert! as Map<String, dynamic>;
          expect(payload.containsKey('id'), isFalse);
          expect(payload['owner_id'], 'o1');
          expect(payload['horse_name'], 'Test Horse');
        },
      );

      test('returns REPORT_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().reportLostHorse(
          LostHorseReport.fromJson(reportRow()),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'REPORT_FAILED');
      });
    });

    group('updateLostHorseStatus', () {
      test('updates status and updated_at', () async {
        final table = stubTable('lost_horse_reports');

        final result = await repo().updateLostHorseStatus('r1', 'found');

        expect(result.isSuccess, isTrue);
        final payload = Map<String, dynamic>.from(table.lastUpdate! as Map);
        expect(payload['status'], 'found');
        expect(payload['updated_at'], isA<String>());
      });

      test('returns STATUS_UPDATE_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().updateLostHorseStatus('r1', 'found');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'STATUS_UPDATE_FAILED');
      });
    });

    group('updateLostHorseFields', () {
      test('merges the fields with an updated_at timestamp', () async {
        final table = stubTable('lost_horse_reports');

        final result = await repo().updateLostHorseFields('r1', {
          'expires_at': '2026-07-01T00:00:00.000',
        });

        expect(result.isSuccess, isTrue);
        final payload = table.lastUpdate! as Map<String, dynamic>;
        expect(payload['expires_at'], '2026-07-01T00:00:00.000');
        expect(payload['updated_at'], isA<String>());
      });

      test('returns FIELD_UPDATE_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().updateLostHorseFields('r1', {
          'expires_at': '2026-07-01T00:00:00.000',
        });

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FIELD_UPDATE_FAILED');
      });
    });

    group('getActiveLostHorses', () {
      test('maps rows and enriches with media', () async {
        stubTable(
          'lost_horse_reports',
          rows: [
            reportRow(id: 'r1'),
            reportRow(id: 'r2'),
          ],
        );
        stubTable(
          'lost_horse_media',
          rows: [
            {
              'report_id': 'r1',
              'url': 'https://cdn/p1.jpg',
              'media_type': 'photo',
            },
            {
              'report_id': 'r1',
              'url': 'https://cdn/v1.mp4',
              'media_type': 'video',
            },
            {
              'report_id': 'r2',
              'url': 'https://cdn/p2.jpg',
              'media_type': 'photo',
            },
          ],
        );

        final result = await repo().getActiveLostHorses();

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value[0].id, 'r1');
        expect(result.value[0].photoUrls, ['https://cdn/p1.jpg']);
        expect(result.value[0].videoUrls, ['https://cdn/v1.mp4']);
        expect(result.value[1].id, 'r2');
        expect(result.value[1].photoUrls, ['https://cdn/p2.jpg']);
        expect(result.value[1].videoUrls, isEmpty);
      });

      test('returns an empty list when there are no reports', () async {
        stubTable('lost_horse_reports');
        stubTable('lost_horse_media');

        final result = await repo().getActiveLostHorses();

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns FETCH_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getActiveLostHorses();

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_FAILED');
      });
    });

    group('getMyLostReports', () {
      test('maps rows to reports', () async {
        stubTable('lost_horse_reports', rows: [reportRow(id: 'r1')]);
        stubTable('lost_horse_media');

        final result = await repo().getMyLostReports('o1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.id, 'r1');
        expect(result.value.single.ownerId, 'o1');
      });

      test('returns FETCH_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getMyLostReports('o1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_FAILED');
      });
    });

    // ── Search areas ──────────────────────────────────────────────

    group('saveSearchArea', () {
      test(
        'inserts the area without an id and returns the saved row',
        () async {
          final row = searchAreaRow();
          final table = stubTable('search_areas', singleRow: row);

          final result = await repo().saveSearchArea(SearchArea.fromJson(row));

          expect(result.isSuccess, isTrue);
          expect(result.value.id, 'sa1');
          expect(result.value.name, 'Search area');
          expect(result.value.centerLat, 47.9);
          expect(result.value.centerLng, 106.9);
          expect(result.value.radiusKm, 5.0);
          expect(result.value.createdBy, 'u1');

          final payload = table.lastInsert! as Map<String, dynamic>;
          expect(payload.containsKey('id'), isFalse);
          expect(payload['name'], 'Search area');
        },
      );

      test('returns SAVE_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().saveSearchArea(
          SearchArea.fromJson(searchAreaRow()),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SAVE_FAILED');
      });
    });

    group('getSearchAreas', () {
      test('maps rows to areas', () async {
        stubTable('search_areas', rows: [searchAreaRow()]);

        final result = await repo().getSearchAreas('u1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.id, 'sa1');
        expect(result.value.single.isActive, isTrue);
      });

      test('returns FETCH_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getSearchAreas('u1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_FAILED');
      });
    });

    group('deleteSearchArea', () {
      test('deletes the row and resolves void', () async {
        stubTable('search_areas');

        final result = await repo().deleteSearchArea('sa1');

        expect(result.isSuccess, isTrue);
      });

      test('returns DELETE_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().deleteSearchArea('sa1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'DELETE_FAILED');
      });
    });

    // ── Horse locations ───────────────────────────────────────────

    group('updateHorseLocation', () {
      test('upserts the location payload', () async {
        final table = stubTable('horse_locations');
        final location = HorseLocation.fromJson(horseLocationRow());

        final result = await repo().updateHorseLocation(location);

        expect(result.isSuccess, isTrue);
        expect(table.lastUpsert, location.toJson());
      });

      test('returns LOCATION_UPDATE_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().updateHorseLocation(
          HorseLocation.fromJson(horseLocationRow()),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'LOCATION_UPDATE_FAILED');
      });
    });

    group('getNearbyHorses', () {
      test('filters by radius and sorts by distance ascending', () async {
        stubTable(
          'horse_locations',
          rows: [
            horseLocationRow(horseId: 'h2', lat: 47.95),
            horseLocationRow(horseId: 'h1'),
            horseLocationRow(horseId: 'h3', lat: 48.9),
          ],
        );

        final result = await repo().getNearbyHorses(47.9, 106.9, 10);

        expect(result.isSuccess, isTrue);
        expect(result.value.map((h) => h.horseId).toList(), ['h1', 'h2']);
      });

      test('returns an empty list when no horses are in range', () async {
        stubTable(
          'horse_locations',
          rows: [horseLocationRow(horseId: 'h3', lat: 48.9)],
        );

        final result = await repo().getNearbyHorses(47.9, 106.9, 10);

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns FETCH_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getNearbyHorses(47.9, 106.9, 10);

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_FAILED');
      });
    });

    // ── Geofence alerts ───────────────────────────────────────────

    group('saveGeofenceAlert', () {
      test('inserts the alert without an id', () async {
        final row = geofenceAlertRow();
        final table = stubTable('geofence_alerts');

        final result = await repo().saveGeofenceAlert(
          GeofenceAlert.fromJson(row),
        );

        expect(result.isSuccess, isTrue);
        final payload = table.lastInsert! as Map<String, dynamic>;
        expect(payload.containsKey('id'), isFalse);
        expect(payload['horse_id'], 'h1');
      });

      test('returns SAVE_ALERT_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().saveGeofenceAlert(
          GeofenceAlert.fromJson(geofenceAlertRow()),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SAVE_ALERT_FAILED');
      });
    });

    group('getGeofenceAlerts', () {
      test('maps rows to alerts', () async {
        stubTable('search_areas', rows: [searchAreaRow()]);
        stubTable('geofence_alerts', rows: [geofenceAlertRow()]);

        final result = await repo().getGeofenceAlerts('u1');

        expect(result.isSuccess, isTrue);
        final alert = result.value.single;
        expect(alert.id, 'a1');
        expect(alert.horseName, 'Horse');
        expect(alert.alertType, GeofenceAlertType.entered);
        expect(alert.horseLat, 47.9);
        expect(alert.acknowledged, isFalse);
      });

      test("scopes alerts to the user's own geofences", () async {
        final areas = stubTable('search_areas', rows: [searchAreaRow()]);
        final alerts = stubTable('geofence_alerts', rows: [geofenceAlertRow()]);

        final result = await repo().getGeofenceAlerts('u1');

        expect(result.isSuccess, isTrue);
        // The area lookup is filtered by the requesting user.
        expect(areas.lastListFilter!.eqCalls, [
          (column: 'created_by', value: 'u1'),
        ]);
        // Alerts are fetched only for that user's geofence ids — the
        // repository never reads alerts globally.
        expect(alerts.lastListFilter!.inFilterCalls, hasLength(1));
        final geofenceFilter = alerts.lastListFilter!.inFilterCalls.single;
        expect(geofenceFilter.column, 'geofence_id');
        expect(geofenceFilter.values, ['sa1']);
        expect(alerts.lastListFilter!.orderColumns, ['triggered_at']);
        expect(alerts.lastListFilter!.limitCounts, [100]);
      });

      test('returns an empty list when the user has no search areas', () async {
        stubTable('search_areas', rows: []);
        // geofence_alerts is intentionally unstubbed: any query against it
        // throws via mocktail, proving the repository short-circuits.

        final result = await repo().getGeofenceAlerts('u1');

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns FETCH_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getGeofenceAlerts('u1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_FAILED');
      });
    });

    group('acknowledgeAlert', () {
      test('updates acknowledged to true', () async {
        final table = stubTable('geofence_alerts');

        final result = await repo().acknowledgeAlert('a1');

        expect(result.isSuccess, isTrue);
        expect(table.lastUpdate, {'acknowledged': true});
      });

      test('returns ACK_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().acknowledgeAlert('a1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'ACK_FAILED');
      });
    });

    // ── Pasture zones ─────────────────────────────────────────────

    group('getPastureZones', () {
      test('maps joined pasture assignments to horse ids', () async {
        stubTable(
          'pasture_zones',
          rows: [
            pastureZoneRow(),
            pastureZoneRow(id: 'z2', assignments: null),
          ],
        );

        final result = await repo().getPastureZones('u1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value[0].id, 'z1');
        expect(result.value[0].name, 'Zone z1');
        expect(result.value[0].assignedHorseIds, ['h1', 'h2']);
        expect(result.value[0].centerLat, 47.9);
        expect(result.value[1].id, 'z2');
        expect(result.value[1].assignedHorseIds, isEmpty);
      });

      test('returns a failure when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getPastureZones('u1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'UNKNOWN_ERROR');
      });
    });

    group('savePastureZone', () {
      test('upserts the zone without assigned_horse_ids', () async {
        final row = pastureZoneRow(assignments: null);
        final table = stubTable('pasture_zones', singleRow: row);

        final result = await repo().savePastureZone(PastureZone.fromJson(row));

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'z1');
        expect(result.value.name, 'Zone z1');
        expect(result.value.radiusKm, 5.0);

        final payload = table.lastUpsert! as Map<String, dynamic>;
        expect(payload.containsKey('assigned_horse_ids'), isFalse);
        expect(payload['name'], 'Zone z1');
      });

      test('returns a failure when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().savePastureZone(
          PastureZone.fromJson(pastureZoneRow(assignments: null)),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('deletePastureZone', () {
      test('deletes the zone row', () async {
        stubTable('pasture_zones');

        final result = await repo().deletePastureZone('z1');

        expect(result.isSuccess, isTrue);
      });

      test('returns a failure when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().deletePastureZone('z1');

        expect(result.isFailure, isTrue);
      });
    });

    group('assignHorseToZone', () {
      test('upserts the assignment pair', () async {
        final table = stubTable('pasture_assignments');

        final result = await repo().assignHorseToZone('z1', 'h1');

        expect(result.isSuccess, isTrue);
        expect(table.lastUpsert, {'zone_id': 'z1', 'horse_id': 'h1'});
      });

      test('returns a failure when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().assignHorseToZone('z1', 'h1');

        expect(result.isFailure, isTrue);
      });
    });

    group('unassignHorseFromZone', () {
      test('deletes the assignment pair', () async {
        stubTable('pasture_assignments');

        final result = await repo().unassignHorseFromZone('z1', 'h1');

        expect(result.isSuccess, isTrue);
      });

      test('returns a failure when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().unassignHorseFromZone('z1', 'h1');

        expect(result.isFailure, isTrue);
      });
    });

    // ── Real-time streams ─────────────────────────────────────────

    group('watchActiveLostHorses', () {
      test('emits the active reports after subscribing', () async {
        stubChannel();
        stubTable('lost_horse_reports', rows: [reportRow()]);
        stubTable('lost_horse_media');

        final stream = repo().watchActiveLostHorses();

        final first = await stream.first.timeout(const Duration(seconds: 3));
        expect(first, hasLength(1));
        expect(first.single.id, 'r1');
        expect(first.single.horseName, 'Test Horse');
      });
    });

    group('watchNearbyHorses', () {
      test('emits in-range horses after subscribing', () async {
        stubChannel();
        stubTable(
          'horse_locations',
          rows: [
            horseLocationRow(horseId: 'h1'),
            horseLocationRow(horseId: 'h3', lat: 48.9),
          ],
        );

        final stream = repo().watchNearbyHorses(47.9, 106.9, 10);

        final first = await stream.first.timeout(const Duration(seconds: 3));
        expect(first.map((h) => h.horseId).toList(), ['h1']);
      });
    });

    group('dispose', () {
      test('closes realtime subscriptions without throwing', () async {
        final repoInstance = repo();
        expect(() => repoInstance.dispose(), returnsNormally);
      });
    });
  });
}
