import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/event.dart';
import '../../horses/domain/horse_record.dart';
import '../application/search_providers.dart';

class SearchScreen extends ConsumerWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(searchQueryProvider);
    final scope = ref.watch(searchScopeProvider);
    final catalog = ref.watch(searchCatalogProvider);

    return CustomScrollView(
      slivers: [
        SliverAppBar.medium(title: const Text('Хайлт')),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            TamgaSpacing.lg,
            0,
            TamgaSpacing.lg,
            TamgaSpacing.xxl,
          ),
          sliver: SliverList.list(
            children: [
              TamgaCard(
                padding: const EdgeInsets.all(TamgaSpacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Нэгдсэн хайлт',
                      style: TamgaTypography.title1(weight: FontWeight.w600),
                    ),
                    const SizedBox(height: TamgaSpacing.sm),
                    Text(
                      'Морь, удмын мод, арга хэмжээг нэг дороос хайна.',
                      style: TamgaTypography.body(),
                    ),
                    const SizedBox(height: TamgaSpacing.lg),
                    TextField(
                      onChanged: (value) {
                        ref.read(searchQueryProvider.notifier).state = value;
                      },
                      decoration: InputDecoration(
                        hintText: 'Нэр, төрөл, шагнал, root id...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            TamgaSpacing.cornerRadius,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: TamgaSpacing.md),
                    Wrap(
                      spacing: TamgaSpacing.md,
                      runSpacing: TamgaSpacing.md,
                      children: [
                        for (final value in SearchScope.values)
                          TamgaChoicePill(
                            label: value.label,
                            selected: value == scope,
                            onTap: () {
                              ref.read(searchScopeProvider.notifier).state =
                                  value;
                            },
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: TamgaSpacing.lg),
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
                        style: TamgaTypography.title2(weight: FontWeight.w600),
                      ),
                      const SizedBox(height: TamgaSpacing.md),
                      if (showHorses) ...[
                        _SectionHeading(
                          title: 'Морьд',
                          count: horseMatches.length,
                        ),
                        const SizedBox(height: TamgaSpacing.sm),
                        if (horseMatches.isEmpty)
                          const InlineEmptyState(
                            icon: Icons.pets,
                            title: 'Таарах морь олдсонгүй',
                          )
                        else
                          for (final horse in horseMatches.take(6)) ...[
                            _HorseResultTile(horse: horse),
                            const SizedBox(height: TamgaSpacing.sm),
                          ],
                        const SizedBox(height: TamgaSpacing.lg),
                      ],
                      if (showEvents) ...[
                        _SectionHeading(
                          title: 'Уралдаан',
                          count: eventMatches.length,
                        ),
                        const SizedBox(height: TamgaSpacing.sm),
                        if (eventMatches.isEmpty)
                          const InlineEmptyState(
                            icon: Icons.emoji_events_outlined,
                            title: 'Таарах үйл явдал олдсонгүй',
                          )
                        else
                          for (final event in eventMatches.take(6)) ...[
                            _EventResultTile(event: event),
                            const SizedBox(height: TamgaSpacing.sm),
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
    final colors = TamgaColors.of(context);
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: TamgaTypography.title3(weight: FontWeight.w600),
          ),
        ),
        Text(
          '$count үр дүн',
          style: TamgaTypography.subheadline(color: colors.onSurfaceVariant),
        ),
      ],
    );
  }
}

class _HorseResultTile extends StatelessWidget {
  const _HorseResultTile({required this.horse});

  final HorseRecord horse;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return TamgaCard(
      padding: EdgeInsets.zero,
      child: ListTile(
        contentPadding: TamgaSpacing.listCellPadding,
        title: Text(horse.name, style: TamgaTypography.body()),
        subtitle: Text(
          '${horse.relationLabel} • ${horse.coat} • ${horse.birthYear}',
          style: TamgaTypography.subheadline(color: colors.onSurfaceVariant),
        ),
        trailing: Text(
          horse.isOwnedByHousehold ? 'Өрхийн' : 'Гаднах',
          style: TamgaTypography.caption1(
            weight: FontWeight.w600,
            color: colors.primary,
          ),
        ),
      ),
    );
  }
}

class _EventResultTile extends StatelessWidget {
  const _EventResultTile({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return TamgaCard(
      padding: EdgeInsets.zero,
      child: ListTile(
        contentPadding: TamgaSpacing.listCellPadding,
        title: Text(event.title, style: TamgaTypography.body()),
        subtitle: Text(
          '${event.horseName ?? ''} • ${event.eventType.displayName} • ${event.date != null ? '${event.date!.year}-${event.date!.month.toString().padLeft(2, '0')}-${event.date!.day.toString().padLeft(2, '0')}' : 'Огноо тодорхойгүй'}',
          style: TamgaTypography.subheadline(color: colors.onSurfaceVariant),
        ),
        trailing: Text(
          event.location ?? '',
          style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
        ),
      ),
    );
  }
}
