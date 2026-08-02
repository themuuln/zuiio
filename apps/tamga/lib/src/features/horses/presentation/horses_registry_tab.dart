import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
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
  const HorsesRegistryTab({super.key, this.onAddHorse});

  final VoidCallback? onAddHorse;

  @override
  ConsumerState<HorsesRegistryTab> createState() => HorsesRegistryTabState();
}

class HorsesRegistryTabState extends ConsumerState<HorsesRegistryTab> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  final _scrollController = ScrollController();
  String _searchQuery = '';

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
    final horsesState = ref.watch(paginatedHorsesProvider);
    final allHorsesAsync = ref.watch(horsesProvider);
    final filter = ref.watch(horseOwnershipFilterProvider);
    final summaryHorses = allHorsesAsync.valueOrNull ?? horsesState.items;
    final visibleHorses = _visibleHorses(horsesState.items, filter);

    return CustomScrollView(
      key: const PageStorageKey('horses_registry_scroll'),
      controller: _scrollController,
      slivers: [
        // ── Herd summary ──
        SliverToBoxAdapter(
          child: _HerdSummary(
            total: summaryHorses.length,
            household: summaryHorses
                .where((horse) => horse.isOwnedByHousehold)
                .length,
            external: summaryHorses
                .where((horse) => !horse.isOwnedByHousehold)
                .length,
            isLoading: allHorsesAsync.isLoading && summaryHorses.isEmpty,
          ),
        ),

        // ── Search ──
        SliverToBoxAdapter(
          child: HorseSearchBar(
            controller: _searchController,
            focusNode: _searchFocusNode,
            query: _searchQuery,
            onChanged: (query) => setState(() => _searchQuery = query),
            onClear: () {
              _searchController.clear();
              setState(() => _searchQuery = '');
            },
          ),
        ),

        // ── Filters ──
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(
              left: AppSpacing.lg,
              right: AppSpacing.lg,
              top: AppSpacing.sm,
            ),
            child: Text(
              'Шүүлтүүр',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: TamgaColors.of(ctx).mutedForeground,
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 52,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.xs,
              ),
              scrollDirection: Axis.horizontal,
              itemCount: HorseOwnershipFilter.values.length,
              separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (ctx, index) {
                final value = HorseOwnershipFilter.values[index];
                return _OwnershipFilterChip(
                  key: ValueKey('horse_filter_${value.name}'),
                  label: value.label,
                  selected: value == filter,
                  onTap: () =>
                      ref.read(horseOwnershipFilterProvider.notifier).state =
                          value,
                );
              },
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.xs,
              AppSpacing.lg,
              AppSpacing.sm,
            ),
            child: Text(
              '${visibleHorses.length} морь',
              style: TamgaTypography.footnote(
                color: TamgaColors.of(ctx).mutedForeground,
              ),
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
          SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyHorsesState(onAddHorse: widget.onAddHorse),
          )
        else if (visibleHorses.isEmpty)
          SliverFillRemaining(
            hasScrollBody: false,
            child: NoSearchResults(
              query: _searchQuery.trim().isEmpty ? null : _searchQuery.trim(),
            ),
          )
        else ...[
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, index) => HorseCard(horse: visibleHorses[index]),
              childCount: visibleHorses.length,
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

  List<HorseRecord> _visibleHorses(
    List<HorseRecord> items,
    HorseOwnershipFilter filter,
  ) {
    final filtered = _filter(items, filter);
    final query = _searchQuery.trim().toLowerCase();
    if (query.isEmpty) return filtered;

    return filtered.where((horse) {
      final searchableText = [
        horse.name,
        horse.gender.displayName,
        horse.coat,
        horse.relationLabel,
        horse.breedLineage?.displayName ?? '',
        horse.region ?? '',
        horse.sum ?? '',
        horse.registrationNo ?? '',
      ].join(' ').toLowerCase();
      return searchableText.contains(query);
    }).toList();
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

class _HerdSummary extends StatelessWidget {
  const _HerdSummary({
    required this.total,
    required this.household,
    required this.external,
    required this.isLoading,
  });

  final int total;
  final int household;
  final int external;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Таны сүрэг',
            style: TamgaTypography.title2(color: colors.foreground),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _SummaryMetric(
                  label: 'Нийт',
                  value: isLoading ? '—' : '$total',
                  valueColor: colors.primary,
                ),
              ),
              _SummaryDivider(color: colors.border),
              Expanded(
                child: _SummaryMetric(
                  label: 'Өрхийн',
                  value: isLoading ? '—' : '$household',
                  valueColor: colors.foreground,
                ),
              ),
              _SummaryDivider(color: colors.border),
              Expanded(
                child: _SummaryMetric(
                  label: 'Гаднах',
                  value: isLoading ? '—' : '$external',
                  valueColor: colors.foreground,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OwnershipFilterChip extends StatelessWidget {
  const _OwnershipFilterChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final borderColor = selected ? colors.primary : colors.outlineVariant;
    final backgroundColor = selected
        ? colors.primaryContainer
        : colors.surfaceContainerHigh;
    final foregroundColor = selected
        ? colors.onPrimaryContainer
        : colors.onSurfaceVariant;
    final borderRadius = BorderRadius.circular(AppSpacing.cornerRadiusPill);

    return Semantics(
      button: true,
      label: '$label шүүлтүүр',
      selected: selected,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius,
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            decoration: BoxDecoration(
              color: backgroundColor,
              border: Border.all(color: borderColor),
              borderRadius: borderRadius,
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: TamgaTypography.footnote(
                color: foregroundColor,
                weight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TamgaTypography.title2(
            weight: FontWeight.w700,
            color: valueColor,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          label,
          style: TamgaTypography.footnote(color: colors.mutedForeground),
        ),
      ],
    );
  }
}

class _SummaryDivider extends StatelessWidget {
  const _SummaryDivider({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(width: AppSpacing.hairline, height: 36, color: color);
  }
}
