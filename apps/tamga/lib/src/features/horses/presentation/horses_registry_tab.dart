import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import 'horse_card.dart';
import 'horse_empty_states.dart';
import 'horse_search_bar.dart';
import 'pagination_error_state.dart';
import 'pagination_footer.dart';

/// Морьдын бүртгэлийн таб.
///
/// Морьдын жагсаалт, хайлт, шүүлт, pagination, офлайн төлөвийг нэгтгэсэн үзэмж.
class HorsesRegistryTab extends ConsumerStatefulWidget {
  const HorsesRegistryTab({super.key});

  @override
  ConsumerState<HorsesRegistryTab> createState() => HorsesRegistryTabState();
}

class HorsesRegistryTabState extends ConsumerState<HorsesRegistryTab> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  final _scrollController = ScrollController();
  String _searchQuery = '';
  bool _isSearchActive = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final state = ref.read(paginatedHorsesProvider);
      if (!state.isLoading && state.hasMore) {
        ref.read(paginatedHorsesProvider.notifier).loadMore();
      }
    }
  }

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final horsesState = ref.watch(paginatedHorsesProvider);
    final filter = ref.watch(horseOwnershipFilterProvider);

    return CustomScrollView(
      key: const PageStorageKey('horses_registry_scroll'),
      controller: _scrollController,
      slivers: [
        // ── Search bar ──
        SliverToBoxAdapter(
          child: HorseSearchBar(
            controller: _searchController,
            focusNode: _searchFocusNode,
            isActive: _isSearchActive,
            query: _searchQuery,
            onChanged: (q) => setState(() => _searchQuery = q),
            onToggle: () {
              setState(() {
                _isSearchActive = !_isSearchActive;
                if (!_isSearchActive) {
                  _searchController.clear();
                  _searchQuery = '';
                } else {
                  _searchFocusNode.requestFocus();
                }
              });
            },
            onClear: () {
              _searchController.clear();
              setState(() => _searchQuery = '');
            },
          ),
        ),

        // ── Filter + count (minimal) ──
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              children: [
                // Filters
                Expanded(
                  child: SizedBox(
                    height: 32,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: HorseOwnershipFilter.values.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(width: AppSpacing.sm),
                      itemBuilder: (ctx, index) {
                        final val = HorseOwnershipFilter.values[index];
                        final isSelected = val == filter;
                        return GestureDetector(
                          onTap: () {
                            ref
                                    .read(horseOwnershipFilterProvider.notifier)
                                    .state =
                                val;
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md,
                              vertical: AppSpacing.sm,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? theme.colorScheme.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected
                                    ? theme.colorScheme.primary
                                    : theme.colorScheme.outlineVariant,
                              ),
                            ),
                            child: Text(
                              val.label,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: isSelected
                                    ? theme.colorScheme.onPrimary
                                    : theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                // Count
                const SizedBox(width: AppSpacing.sm),
                Text(
                  '${_filter(horsesState.items, filter).length}',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── Horse list ──
        if (horsesState.hasError)
          SliverFillRemaining(
            hasScrollBody: false,
            child: PaginationErrorState(
              onRetry: () =>
                  ref.read(paginatedHorsesProvider.notifier).refresh(),
            ),
          )
        else if (horsesState.isLoading && horsesState.items.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(child: CircularProgressIndicator()),
          )
        else if (horsesState.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyHorsesState(),
          )
        else if (_searchQuery.isNotEmpty &&
            _filter(horsesState.items, filter).every(
              (h) => !h.name.toLowerCase().contains(_searchQuery.toLowerCase()),
            ))
          SliverFillRemaining(
            hasScrollBody: false,
            child: NoSearchResults(query: _searchQuery),
          )
        else ...[
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, index) {
                  final allFiltered = _filter(horsesState.items, filter);
                  final searched = _searchQuery.isEmpty
                      ? allFiltered
                      : allFiltered
                            .where(
                              (h) => h.name.toLowerCase().contains(
                                _searchQuery.toLowerCase(),
                              ),
                            )
                            .toList();
                  if (index < searched.length) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: HorseCard(horse: searched[index]),
                    );
                  }
                  return null;
                },
                childCount: (() {
                  final allFiltered = _filter(horsesState.items, filter);
                  final searched = _searchQuery.isEmpty
                      ? allFiltered
                      : allFiltered
                            .where(
                              (h) => h.name.toLowerCase().contains(
                                _searchQuery.toLowerCase(),
                              ),
                            )
                            .toList();
                  return searched.length;
                })(),
              ),
            ),
          ),

          // ── Loading / Error / End indicator ──
          SliverToBoxAdapter(
            child: PaginationFooter(
              state: horsesState,
              onRetry: () =>
                  ref.read(paginatedHorsesProvider.notifier).refresh(),
            ),
          ),
        ],
      ],
    );
  }

  List<HorseRecord> _filter(
    List<HorseRecord> items,
    HorseOwnershipFilter filter,
  ) => switch (filter) {
    HorseOwnershipFilter.all => items,
    HorseOwnershipFilter.household =>
      items.where((item) => item.isOwnedByHousehold).toList(),
    HorseOwnershipFilter.external =>
      items.where((item) => !item.isOwnedByHousehold).toList(),
  };
}
