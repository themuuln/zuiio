import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/events/data/api_key_repository.dart';
import 'package:tamga/src/features/events/data/supabase_api_key_repository.dart';
import 'package:tamga/src/features/events/domain/api_key.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

/// A fake [SupabaseQueryBuilder] that returns typed filter builders for the
/// entry points (select/insert/update/upsert/delete) and completes with
/// [_result] when awaited. The SDK's Postgrest builders `implements Future`,
/// so the VM synthesizes typed forwarders that cast the
/// noSuchMethod result to each method's declared return type — a fake that
/// returns `this` for everything cannot satisfy those casts. These typed
/// fakes override the entry points and give every fake a real `then` so
/// awaiting a chain resolves the configured [_result].
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

/// List-flavored filter chain. eq/gte/order/select/etc. that keep the
/// PostgrestList flavor are satisfied by `this` via noSuchMethod;
/// single/maybeSingle switch to the map flavor.
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
  PostgrestFilterBuilder<Map<String, dynamic>> single() =>
      FakeMapFilter(_result);

  @override
  PostgrestFilterBuilder<Map<String, dynamic>?> maybeSingle() =>
      FakeMapFilter(_result);
}

/// Map-flavored filter for single()/maybeSingle() chains.
class FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>> {
  FakeMapFilter(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic>) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return null as R;
      return onValue(value as Map<String, dynamic>);
    }, onError: onError);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleApiKeyRow({
  String id = 'key-1',
  String userId = 'user-1',
  String name = 'Мобиль апп',
  String keyPrefix = 'tg_ab12cd34',
  String tier = 'stable',
  List<String> permissions = const ['read_events', 'write_events'],
  int rateLimitPerMinute = 60,
  bool isActive = true,
  String? lastUsedAt = '2026-07-01T10:00:00.000Z',
  String createdAt = '2026-01-01T00:00:00.000Z',
  String? expiresAt,
}) {
  return {
    'id': id,
    'user_id': userId,
    'name': name,
    'key_prefix': keyPrefix,
    'tier': tier,
    'permissions': permissions,
    'rate_limit_per_minute': rateLimitPerMinute,
    'is_active': isActive,
    'last_used_at': lastUsedAt,
    'created_at': createdAt,
    'expires_at': expiresAt,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseApiKeyRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseApiKeyRepository(client: mockClient);
  });

  group('SupabaseApiKeyRepository', () {
    test('implements ApiKeyRepository and accepts a null client', () {
      final repo = SupabaseApiKeyRepository(client: null);
      expect(repo, isA<ApiKeyRepository>());
    });

    group('getApiKeys', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseApiKeyRepository(client: null);
        final result = await repo.getApiKeys('user-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('maps rows to ApiKey models on success', () async {
        final rows = [
          sampleApiKeyRow(
            id: 'key-1',
            name: 'Мобиль апп',
            keyPrefix: 'tg_ab12cd34',
            tier: 'stable',
            permissions: ['read_events', 'write_events'],
            rateLimitPerMinute: 60,
            isActive: true,
            lastUsedAt: '2026-07-01T10:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
          ),
          sampleApiKeyRow(
            id: 'key-2',
            name: 'Хуучин түлхүүр',
            keyPrefix: 'tg_ff001122',
            tier: 'breeder',
            permissions: ['read_events'],
            rateLimitPerMinute: 30,
            isActive: false,
            lastUsedAt: null,
            createdAt: '2025-06-01T00:00:00.000Z',
            expiresAt: '2026-02-01T00:00:00.000Z',
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.getApiKeys('user-1');

        expect(result.isSuccess, isTrue);
        final keys = result.value;
        expect(keys, hasLength(2));

        final first = keys.first;
        expect(first.id, 'key-1');
        expect(first.userId, 'user-1');
        expect(first.name, 'Мобиль апп');
        expect(first.keyPrefix, 'tg_ab12cd34');
        expect(first.tier, ApiKeyTier.stable);
        expect(first.permissions, ['read_events', 'write_events']);
        expect(first.rateLimitPerMinute, 60);
        expect(first.isActive, isTrue);
        expect(first.lastUsedAt, DateTime.parse('2026-07-01T10:00:00.000Z'));
        expect(first.createdAt, DateTime.parse('2026-01-01T00:00:00.000Z'));
        expect(first.expiresAt, isNull);

        final second = keys[1];
        expect(second.tier, ApiKeyTier.breeder);
        expect(second.rateLimitPerMinute, 30);
        expect(second.isActive, isFalse);
        expect(second.lastUsedAt, isNull);
        expect(second.expiresAt, DateTime.parse('2026-02-01T00:00:00.000Z'));
      });

      test('queries organizer_api_keys for the user', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        await repository.getApiKeys('user-9');

        verify(() => mockClient.from('organizer_api_keys')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.getApiKeys('user-1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'UNKNOWN_ERROR');
      });
    });

    group('createApiKey', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseApiKeyRepository(client: null);
        final result = await repo.createApiKey(
          'user-1',
          const CreateApiKeyRequest(name: 'Тест'),
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('creates a stable-tier key with full key returned once', () async {
        when(() => mockClient.from(any())).thenAnswer(
          (_) =>
              FakeQueryBuilder(sampleApiKeyRow(id: 'key-new', tier: 'stable')),
        );

        final result = await repository.createApiKey(
          'user-1',
          const CreateApiKeyRequest(
            name: 'Мобиль апп',
            tier: ApiKeyTier.stable,
          ),
        );

        expect(result.isSuccess, isTrue);
        final created = result.value;
        // The raw key is only returned at creation time.
        expect(created.fullKey, startsWith('tg_'));
        expect(created.fullKey, matches(RegExp(r'^tg_[0-9a-f]{40}$')));
        expect(created.key.id, 'key-new');
        expect(created.key.keyPrefix, 'tg_ab12cd34');
        expect(created.key.tier, ApiKeyTier.stable);
        expect(created.key.rateLimitPerMinute, 60);
      });

      test('creates a breeder-tier key with default rate limit', () async {
        when(() => mockClient.from(any())).thenAnswer(
          (_) => FakeQueryBuilder(
            sampleApiKeyRow(
              id: 'key-breeder',
              tier: 'breeder',
              permissions: ['read_events', 'read_registrations'],
              rateLimitPerMinute: 30,
            ),
          ),
        );

        final result = await repository.createApiKey(
          'user-1',
          const CreateApiKeyRequest(name: 'Унших', tier: ApiKeyTier.breeder),
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.key.tier, ApiKeyTier.breeder);
        expect(result.value.key.rateLimitPerMinute, 30);
        expect(result.value.key.permissions, [
          'read_events',
          'read_registrations',
        ]);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Insert failed'));

        final result = await repository.createApiKey(
          'user-1',
          const CreateApiKeyRequest(name: 'Тест'),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('revokeApiKey', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseApiKeyRepository(client: null);
        final result = await repo.revokeApiKey('key-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('deactivates the key on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.revokeApiKey('key-1');

        expect(result.isSuccess, isTrue);
        verify(() => mockClient.from('organizer_api_keys')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.revokeApiKey('key-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('getUsageStats', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseApiKeyRepository(client: null);
        final result = await repo.getUsageStats('key-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('aggregates usage rows into ApiKeyUsageStats', () async {
        // Queries run in order: rate-limit row, total ids, today ids, recent.
        final results = <dynamic>[
          {'rate_limit_per_minute': 60},
          [
            {'id': '1'},
            {'id': '2'},
            {'id': '3'},
          ],
          [
            {'id': '1'},
            {'id': '2'},
          ],
          [
            {
              'endpoint': '/v1/events',
              'response_time_ms': 120,
              'status_code': 200,
            },
            {
              'endpoint': '/v1/events',
              'response_time_ms': 80,
              'status_code': 500,
            },
          ],
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));

        final result = await repository.getUsageStats('key-1');

        expect(result.isSuccess, isTrue);
        final stats = result.value;
        expect(stats.keyId, 'key-1');
        expect(stats.totalRequests, 3);
        expect(stats.requestsToday, 2);
        expect(stats.requestsThisMinute, 2);
        expect(stats.rateLimit, 60);
        expect(stats.avgResponseTimeMs, 100);
        expect(stats.errorRate, 0.5);
        expect(stats.lastEndpoints, {'/v1/events': 2});
      });

      test('returns null aggregates when there is no recent traffic', () async {
        final results = <dynamic>[
          {'rate_limit_per_minute': 30},
          <Map<String, dynamic>>[],
          <Map<String, dynamic>>[],
          <Map<String, dynamic>>[],
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));

        final result = await repository.getUsageStats('key-1');

        expect(result.isSuccess, isTrue);
        final stats = result.value;
        expect(stats.totalRequests, 0);
        expect(stats.requestsThisMinute, 0);
        expect(stats.rateLimit, 30);
        expect(stats.avgResponseTimeMs, isNull);
        expect(stats.errorRate, isNull);
        expect(stats.lastEndpoints, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('Query failed'));

        final result = await repository.getUsageStats('key-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
