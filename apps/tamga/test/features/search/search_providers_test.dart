import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/features/search/application/search_providers.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';

void main() {
  group('SearchScope', () {
    test('all label returns Бүгд', () {
      expect(SearchScope.all.label, 'Бүгд');
    });

    test('horses label returns Морьд', () {
      expect(SearchScope.horses.label, 'Морьд');
    });

    test('events label returns Уралдаан', () {
      expect(SearchScope.events.label, 'Уралдаан');
    });

    test('all enum values are covered', () {
      expect(SearchScope.values.length, 3);
      expect(
        SearchScope.values,
        containsAll([SearchScope.all, SearchScope.horses, SearchScope.events]),
      );
    });
  });

  group('SearchCatalog', () {
    test('stores horses and events lists', () {
      final horses = <HorseRecord>[];
      final events = <Event>[];
      final catalog = SearchCatalog(horses: horses, events: events);

      expect(catalog.horses, same(horses));
      expect(catalog.events, same(events));
    });

    test('is const constructable with empty lists', () {
      const catalog = SearchCatalog(horses: <HorseRecord>[], events: <Event>[]);
      expect(catalog.horses, isEmpty);
      expect(catalog.events, isEmpty);
    });
  });

  group('searchQueryProvider', () {
    test('initial value is empty string', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(searchQueryProvider), '');
    });

    test('can update value', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(searchQueryProvider.notifier).state = 'test horse';
      expect(container.read(searchQueryProvider), 'test horse');
    });

    test('can clear value', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(searchQueryProvider.notifier).state = 'something';
      container.read(searchQueryProvider.notifier).state = '';
      expect(container.read(searchQueryProvider), '');
    });
  });

  group('searchScopeProvider', () {
    test('initial value is SearchScope.all', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(searchScopeProvider), SearchScope.all);
    });

    test('can change scope', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(searchScopeProvider.notifier).state = SearchScope.horses;
      expect(container.read(searchScopeProvider), SearchScope.horses);

      container.read(searchScopeProvider.notifier).state = SearchScope.events;
      expect(container.read(searchScopeProvider), SearchScope.events);
    });
  });
}
