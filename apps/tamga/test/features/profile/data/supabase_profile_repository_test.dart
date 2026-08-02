import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/profile/data/supabase_profile_repository.dart';
import 'package:tamga/src/features/profile/domain/profile_settings.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

void main() {
  group('get', () {
    test('returns default settings when Supabase client is null', () async {
      final repo = SupabaseProfileRepository(client: null);
      final result = await repo.get();

      expect(result.isSuccess, isTrue);
      expect(result.value.autoSyncEnabled, isFalse);
      expect(result.value.role, 'casual');
      expect(result.value.rank, 'no_rank');
      expect(result.value.lastSyncCheckAt, isNull);
    });

    test('returns default settings when no user session exists', () async {
      // In the unit-test environment AppConfig.isSupabaseConfigured is false,
      // so ensureSupabaseUserId() returns null and the repository never
      // reaches the query — it falls back to default settings.
      final mockClient = MockSupabaseClient();
      final repo = SupabaseProfileRepository(client: mockClient);
      final result = await repo.get();

      expect(result.isSuccess, isTrue);
      expect(result.value.autoSyncEnabled, isFalse);
    });
  });

  group('update', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseProfileRepository(client: null);
      final result = await repo.update(
        const ProfileSettings(autoSyncEnabled: true),
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test(
      'returns SUPABASE_NOT_CONFIGURED when no user session exists',
      () async {
        // Same test-environment constraint as get(): without a Supabase session
        // currentUserId is null, so the repository refuses to write.
        final mockClient = MockSupabaseClient();
        final repo = SupabaseProfileRepository(client: mockClient);
        final result = await repo.update(
          const ProfileSettings(autoSyncEnabled: true),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );
  });

  // ── Data mapping ─────────────────────────────────────────────────────
  //
  // The row → domain model transformation used by the repository's success
  // path is verified directly because that path is unreachable in the unit
  // test environment (it requires an authenticated Supabase session).

  group('ProfileSettings serialization', () {
    test('fromSupabaseJson maps snake_case rows field by field', () {
      final settings = ProfileSettings.fromSupabaseJson({
        'owner_id': 'user-1',
        'auto_sync_enabled': true,
        'last_sync_check_at': '2026-01-01T08:00:00.000',
        'role': 'breeder',
        'rank': 'gold',
      });

      expect(settings.autoSyncEnabled, isTrue);
      expect(
        settings.lastSyncCheckAt,
        DateTime.parse('2026-01-01T08:00:00.000'),
      );
      expect(settings.role, 'breeder');
      expect(settings.rank, 'gold');
    });

    test('fromSupabaseJson falls back to defaults for missing fields', () {
      final settings = ProfileSettings.fromSupabaseJson({
        'auto_sync_enabled': false,
      });

      expect(settings.autoSyncEnabled, isFalse);
      expect(settings.lastSyncCheckAt, isNull);
      expect(settings.role, 'casual');
      expect(settings.rank, 'no_rank');
    });

    test('toSupabaseJson includes owner id and snake_case keys', () {
      final json = const ProfileSettings(
        autoSyncEnabled: true,
        role: 'pro',
        rank: 'silver',
      ).toSupabaseJson(ownerId: 'user-1');

      expect(json['owner_id'], 'user-1');
      expect(json['auto_sync_enabled'], isTrue);
      expect(json['role'], 'pro');
      expect(json['rank'], 'silver');
      expect(json['updated_at'], isA<String>());
    });
  });
}
