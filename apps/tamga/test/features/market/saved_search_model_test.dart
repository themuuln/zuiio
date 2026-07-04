import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/saved_search.dart';

void main() {
  group('SavedSearch', () {
    // ── Helpers ────────────────────────────────────────────────────

    final defaultFilters = <String, dynamic>{
      'saleType': 'sale',
      'minPrice': 1000000,
      'maxPrice': 5000000,
      'location': 'Архангай',
      'breed': 'Хонгор',
    };

    SavedSearch createSavedSearch({
      String id = 'ss-1',
      String userId = 'user-1',
      Map<String, dynamic>? filters,
      String name = 'Хонгор азарга',
      DateTime? createdAt,
      DateTime? lastNotifiedAt,
    }) {
      return SavedSearch(
        id: id,
        userId: userId,
        filters: filters ?? defaultFilters,
        name: name,
        createdAt: createdAt ?? DateTime(2026, 6, 1),
        lastNotifiedAt: lastNotifiedAt,
      );
    }

    // ── Construction ───────────────────────────────────────────────

    group('construction', () {
      test('creates with all required fields', () {
        final search = createSavedSearch();

        expect(search.id, 'ss-1');
        expect(search.userId, 'user-1');
        expect(search.filters, defaultFilters);
        expect(search.name, 'Хонгор азарга');
        expect(search.createdAt, DateTime(2026, 6, 1));
        expect(search.lastNotifiedAt, isNull);
      });

      test('lastNotifiedAt can be set', () {
        final notifiedAt = DateTime(2026, 6, 15);
        final search = createSavedSearch(lastNotifiedAt: notifiedAt);

        expect(search.lastNotifiedAt, notifiedAt);
      });
    });

    // ── copyWith ───────────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final original = createSavedSearch(name: 'Old name');
        final copied = original.copyWith(
          name: 'Шинэ хайлт',
          filters: {'saleType': 'lease'},
        );

        expect(copied.name, 'Шинэ хайлт');
        expect(copied.filters, {'saleType': 'lease'});
        expect(copied.id, original.id);
        expect(copied.userId, original.userId);
        expect(copied.createdAt, original.createdAt);
      });

      test('copies with lastNotifiedAt', () {
        final original = createSavedSearch();
        final notifiedAt = DateTime(2026, 6, 20);
        final copied = original.copyWith(lastNotifiedAt: notifiedAt);

        expect(copied.lastNotifiedAt, notifiedAt);
      });

      test('copyWith does not modify original', () {
        final original = createSavedSearch(name: 'Original');
        original.copyWith(name: 'Modified');

        expect(original.name, 'Original');
      });
    });

    // ── Serialization ──────────────────────────────────────────────

    group('serialization', () {
      test('toJson produces correct map', () {
        final createdAt = DateTime(2026, 6, 1, 12, 0, 0);
        final search = createSavedSearch(createdAt: createdAt);

        final json = search.toJson();

        expect(json['id'], 'ss-1');
        expect(json['userId'], 'user-1');
        expect(json['filters'], defaultFilters);
        expect(json['name'], 'Хонгор азарга');
        expect(json['createdAt'], createdAt.toIso8601String());
        expect(json.containsKey('lastNotifiedAt'), isTrue);
        expect(json['lastNotifiedAt'], isNull);
      });

      test('toJson includes lastNotifiedAt when set', () {
        final notifiedAt = DateTime(2026, 6, 15, 10, 0, 0);
        final search = createSavedSearch(lastNotifiedAt: notifiedAt);

        final json = search.toJson();

        expect(json['lastNotifiedAt'], notifiedAt.toIso8601String());
      });

      test('fromJson round-trips correctly', () {
        final createdAt = DateTime(2026, 6, 1, 10, 30);
        final notifiedAt = DateTime(2026, 6, 15, 8, 0);
        final original = createSavedSearch(
          id: 'ss-2',
          userId: 'user-2',
          filters: {'saleType': 'lease', 'location': 'Улаанбаатар'},
          name: 'Түрээсийн морьд',
          createdAt: createdAt,
          lastNotifiedAt: notifiedAt,
        );

        final json = original.toJson();
        final restored = SavedSearch.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.userId, original.userId);
        expect(restored.filters, original.filters);
        expect(restored.name, original.name);
        expect(restored.createdAt, original.createdAt);
        expect(restored.lastNotifiedAt, original.lastNotifiedAt);
      });

      test('fromJson handles null lastNotifiedAt', () {
        final json = {
          'id': 'ss-3',
          'userId': 'user-3',
          'filters': <String, dynamic>{'saleType': 'sale'},
          'name': 'Test',
          'createdAt': '2026-06-01T00:00:00.000',
          'lastNotifiedAt': null,
        };

        final search = SavedSearch.fromJson(json);

        expect(search.id, 'ss-3');
        expect(search.lastNotifiedAt, isNull);
      });

      test('filters map is correctly serialized with nested values', () {
        final complexFilters = <String, dynamic>{
          'saleType': 'sale',
          'verifiedOnly': true,
          'minPrice': 1000000,
          'maxPrice': 5000000,
          'location': 'Архангай',
          'breed': 'Хонгор',
          'sort': 'newest',
        };

        final search = createSavedSearch(filters: complexFilters);
        final json = search.toJson();
        final restored = SavedSearch.fromJson(json);

        expect(restored.filters['saleType'], 'sale');
        expect(restored.filters['verifiedOnly'], true);
        expect(restored.filters['minPrice'], 1000000);
        expect(restored.filters['maxPrice'], 5000000);
        expect(restored.filters['sort'], 'newest');
      });
    });

    // ── Equality ───────────────────────────────────────────────────

    group('equality', () {
      test('identical searches are equal', () {
        final a = createSavedSearch();
        final b = createSavedSearch();

        expect(a, equals(b));
        expect(a.hashCode, equals(b.hashCode));
      });

      test('different ids are not equal', () {
        final a = createSavedSearch(id: 'ss-1');
        final b = createSavedSearch(id: 'ss-2');

        expect(a, isNot(equals(b)));
      });

      test('different names are not equal', () {
        final a = createSavedSearch(name: 'Name A');
        final b = createSavedSearch(name: 'Name B');

        expect(a, isNot(equals(b)));
      });
    });

    // ── toString ───────────────────────────────────────────────────

    group('toString', () {
      test('includes id and name', () {
        final search = createSavedSearch();
        final str = search.toString();

        expect(str, contains('ss-1'));
        expect(str, contains('Хонгор азарга'));
      });
    });
  });
}
