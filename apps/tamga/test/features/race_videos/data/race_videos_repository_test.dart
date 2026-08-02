import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:tamga/src/features/race_videos/data/race_videos_repository.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// Postgrest builders are immutable and execute a real HTTP request when
// awaited, so the chain is replaced with lightweight fakes that record the
// calls the repository makes and deliver canned rows through a real `then`
// implementation (the await machinery relies on `Future.then`).

class FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  FakeQueryBuilder(this.rows, this.calls);

  final List<Map<String, dynamic>> rows;
  final List<String> calls;

  @override
  PostgrestFilterBuilder<PostgrestList> select([String columns = '*']) {
    calls.add('select');
    return FakeFilterBuilder(rows, calls);
  }
}

class FakeFilterBuilder extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  FakeFilterBuilder(this.rows, this.calls);

  final List<Map<String, dynamic>> rows;
  final List<String> calls;

  @override
  PostgrestFilterBuilder<PostgrestList> eq(String column, Object value) {
    calls.add('eq:$column=$value');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) {
    calls.add('order:$column');
    return FakeResultBuilder(rows);
  }
}

class FakeResultBuilder extends Fake
    implements PostgrestTransformBuilder<PostgrestList> {
  FakeResultBuilder(this.rows);

  final List<Map<String, dynamic>> rows;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestList value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(rows));
  }
}

class FakeRpcBuilder extends Fake implements PostgrestFilterBuilder<dynamic> {
  @override
  Future<U> then<U>(
    FutureOr<U> Function(dynamic value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(null));
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

Map<String, dynamic> videoRow({
  String id = 'vid-1',
  String title = 'Наадам 2024',
  String category = 'Монгол',
  int price3day = 1000,
  int viewCount = 42,
}) {
  return {
    'id': id,
    'uploader_id': 'user-1',
    'title': title,
    'video_url': 'https://example.com/video.mp4',
    'race_name': 'Эртний морьд',
    'race_date': '2024-07-11T10:00:00.000',
    'location_aimag': 'Төв',
    'category': category,
    'thumbnail_url': 'https://example.com/thumb.jpg',
    'free_preview_url': 'https://example.com/preview.mp4',
    'price_3day': price3day,
    'price_1year': 5000,
    'price_lifetime': 10000,
    'view_count': viewCount,
    'published': true,
    'duration_seconds': 3600,
    'created_at': '2024-07-11T10:00:00.000',
  };
}

void main() {
  group('RaceVideosRepository', () {
    late MockSupabaseClient mockClient;
    late RaceVideosRepository repository;

    setUp(() {
      mockClient = MockSupabaseClient();
      repository = RaceVideosRepository(client: mockClient);
    });

    group('fetchPublished', () {
      test('returns published videos mapped to domain models', () async {
        final calls = <String>[];
        final rows = [
          videoRow(id: 'v1', title: 'Наадам', price3day: 1500, viewCount: 7),
          videoRow(id: 'v2'),
        ];
        when(
          () => mockClient.from('race_videos'),
        ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

        final result = await repository.fetchPublished();

        expect(result.isSuccess, isTrue);
        final videos = result.value;
        expect(videos, hasLength(2));
        expect(videos[0].id, 'v1');
        expect(videos[0].title, 'Наадам');
        expect(videos[0].raceName, 'Эртний морьд');
        expect(videos[0].price3day, 1500);
        expect(videos[0].viewCount, 7);
        expect(videos[1].id, 'v2');
        // Query contract: published-only, newest first, no category filter.
        expect(calls, ['select', 'eq:published=true', 'order:created_at']);
      });

      test(
        'applies the category filter when a specific category is given',
        () async {
          final calls = <String>[];
          when(
            () => mockClient.from('race_videos'),
          ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

          final result = await repository.fetchPublished(category: 'Монгол');

          expect(result.isSuccess, isTrue);
          expect(calls, [
            'select',
            'eq:published=true',
            'eq:category=Монгол',
            'order:created_at',
          ]);
        },
      );

      test('does not filter by category for Бүгд or null', () async {
        final callsAll = <String>[];
        when(
          () => mockClient.from('race_videos'),
        ).thenAnswer((_) => FakeQueryBuilder(const [], callsAll));
        final resultAll = await repository.fetchPublished(category: 'Бүгд');
        expect(resultAll.isSuccess, isTrue);
        expect(callsAll, ['select', 'eq:published=true', 'order:created_at']);

        final callsNull = <String>[];
        when(
          () => mockClient.from('race_videos'),
        ).thenAnswer((_) => FakeQueryBuilder(const [], callsNull));
        final resultNull = await repository.fetchPublished();
        expect(resultNull.isSuccess, isTrue);
        expect(callsNull, ['select', 'eq:published=true', 'order:created_at']);
      });

      test('returns failure when the query throws', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchPublished();

        expect(result.isFailure, isTrue);
      });
    });

    group('incrementViewCount', () {
      test('calls the increment RPC with the video id and succeeds', () async {
        when(
          () => mockClient.rpc(
            'increment_race_video_view_count',
            params: {'video_id': 'vid-1'},
          ),
        ).thenAnswer((_) => FakeRpcBuilder());

        final result = await repository.incrementViewCount('vid-1');

        expect(result.isSuccess, isTrue);
        verify(
          () => mockClient.rpc(
            'increment_race_video_view_count',
            params: {'video_id': 'vid-1'},
          ),
        ).called(1);
      });

      test('returns failure when the RPC throws', () async {
        when(
          () => mockClient.rpc(any(), params: any(named: 'params')),
        ).thenThrow(Exception('RPC error'));

        final result = await repository.incrementViewCount('vid-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
