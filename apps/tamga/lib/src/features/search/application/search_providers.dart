import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/domain/event.dart';
import '../../events/application/events_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';

enum SearchScope { all, horses, events }

extension SearchScopeLabel on SearchScope {
  String get label => switch (this) {
    SearchScope.all => 'Бүгд',
    SearchScope.horses => 'Морьд',
    SearchScope.events => 'Уралдаан',
  };
}

class SearchCatalog {
  const SearchCatalog({required this.horses, required this.events});

  final List<HorseRecord> horses;
  final List<Event> events;
}

final searchQueryProvider = StateProvider<String>((ref) {
  return '';
});

final searchScopeProvider = StateProvider<SearchScope>((ref) {
  return SearchScope.all;
});

final searchCatalogProvider = FutureProvider<SearchCatalog>((ref) async {
  final horses = await ref.watch(horsesProvider.future);
  final events = await ref.watch(eventsProvider.future);
  return SearchCatalog(horses: horses, events: events);
});
