import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/event.dart';
import '../../horses/domain/horse_record.dart';
import '../application/search_providers.dart';

class SearchScreen extends ConsumerWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final query = ref.watch(searchQueryProvider);
    final scope = ref.watch(searchScopeProvider);
    final catalog = ref.watch(searchCatalogProvider);

    return CustomScrollView(
      slivers: [
        SliverAppBar.medium(title: const Text('Хайлт')),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          sliver: SliverList.list(
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Нэгдсэн хайлт',
                        style: theme.textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Lineage, horses, events-ээс local-first өгөгдөл хайна. Thin version нь client-side filter дээр ажиллана.',
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        onChanged: (value) {
                          ref.read(searchQueryProvider.notifier).state = value;
                        },
                        decoration: InputDecoration(
                          hintText: 'Нэр, төрөл, шагнал, root id...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          for (final value in SearchScope.values)
                            ChoiceChip(
                              label: Text(value.label),
                              selected: value == scope,
                              onSelected: (_) {
                                ref.read(searchScopeProvider.notifier).state =
                                    value;
                              },
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              catalog.when(
                data: (data) {
                  final horseMatches = _matchHorses(data.horses, query);
                  final eventMatches = _matchEvents(data.events, query);
                  final showHorses = scope != SearchScope.events;
                  final showEvents = scope != SearchScope.horses;

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        query.trim().isEmpty
                            ? 'Хайлт эхлүүлэхийн тулд query оруулна уу. Доор thin index харагдана.'
                            : 'Query: "$query"',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      if (showHorses) ...[
                        _SectionHeading(
                          title: 'Морьд',
                          count: horseMatches.length,
                        ),
                        const SizedBox(height: 8),
                        if (horseMatches.isEmpty)
                          const InlineEmptyState(
                            icon: Icons.pets,
                            title: 'Таарах морь олдсонгүй',
                          )
                        else
                          for (final horse in horseMatches.take(6)) ...[
                            _HorseResultTile(horse: horse),
                            const SizedBox(height: 8),
                          ],
                        const SizedBox(height: 16),
                      ],
                      if (showEvents) ...[
                        _SectionHeading(
                          title: 'Уралдаан',
                          count: eventMatches.length,
                        ),
                        const SizedBox(height: 8),
                        if (eventMatches.isEmpty)
                          const InlineEmptyState(
                            icon: Icons.emoji_events_outlined,
                            title: 'Таарах үйл явдал олдсонгүй',
                          )
                        else
                          for (final event in eventMatches.take(6)) ...[
                            _EventResultTile(event: event),
                            const SizedBox(height: 8),
                          ],
                      ],
                    ],
                  );
                },
                loading: () => SkeletonLoader(
                  items: 4,
                  itemBuilder: (ctx, i) => const SkeletonListTile(),
                ),
                error: (error, stackTrace) => TamgaErrorWidget(
                  message: 'Хайлт хийхэд алдаа гарлаа',
                  onRetry: () => ref.invalidate(searchCatalogProvider),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<HorseRecord> _matchHorses(List<HorseRecord> horses, String query) {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) {
      return horses;
    }

    return horses.where((horse) {
      final haystack = [
        horse.name,
        horse.relationLabel,
        horse.coat,
        horse.notes,
        horse.lineageRootId ?? '',
      ].join(' ').toLowerCase();
      return haystack.contains(normalized);
    }).toList();
  }

  List<Event> _matchEvents(List<Event> events, String query) {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) {
      return events;
    }

    return events.where((event) {
      final haystack = [
        event.title,
        event.horseName ?? '',
        event.eventType.displayName,
        event.result ?? '',
        event.notes ?? '',
      ].join(' ').toLowerCase();
      return haystack.contains(normalized);
    }).toList();
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        Text('$count үр дүн'),
      ],
    );
  }
}

class _HorseResultTile extends StatelessWidget {
  const _HorseResultTile({required this.horse});

  final HorseRecord horse;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(horse.name),
        subtitle: Text(
          '${horse.relationLabel} • ${horse.coat} • ${horse.birthYear}',
        ),
        trailing: Text(horse.isOwnedByHousehold ? 'Өрхийн' : 'Гаднах'),
      ),
    );
  }
}

class _EventResultTile extends StatelessWidget {
  const _EventResultTile({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(event.title),
        subtitle: Text(
          '${event.horseName ?? ''} • ${event.eventType.displayName} • ${event.date != null ? '${event.date!.year}-${event.date!.month.toString().padLeft(2, '0')}-${event.date!.day.toString().padLeft(2, '0')}' : 'Огноо тодорхойгүй'}',
        ),
        trailing: Text(event.location ?? ''),
      ),
    );
  }
}


