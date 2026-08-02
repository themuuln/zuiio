import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_widgets.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../../events/application/events_providers.dart';
import '../../shared/presentation/sync_indicator.dart';
import '../application/market_providers.dart';
import 'market_filters_panel.dart';
import 'market_listing_card.dart';

/// Захын дэлгэц — заруудыг шүүлтүүртэйгээр харуулах.
class MarketScreen extends ConsumerStatefulWidget {
  const MarketScreen({super.key});

  @override
  ConsumerState<MarketScreen> createState() => _MarketScreenState();
}

class _MarketScreenState extends ConsumerState<MarketScreen> {
  bool _isGrid = false;
  bool _showFilters = false;
  final _scrollController = ScrollController();
  Timer? _searchDebounceTimer;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchDebounceTimer?.cancel();
    super.dispose();
  }

  /// Scroll-ийн бүсийг шалгаж, дараагийн хуудсыг ачаалах.
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final catalogState = ref.read(paginatedMarketCatalogProvider);
      if (!catalogState.isLoading && catalogState.hasMore) {
        final filters = ref.read(marketFiltersProvider);
        ref
            .read(paginatedMarketCatalogProvider.notifier)
            .loadMore(filters: filters);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final catalogState = ref.watch(paginatedMarketCatalogProvider);
    final filters = ref.watch(marketFiltersProvider);

    // Хүлээлтийн мэдээлэл шинэчлэх
    ref.listen(horsesProvider, (prev, next) {
      next.whenData((horses) {
        final events = ref.read(eventsProvider).valueOrNull ?? [];
        final favorites =
            ref.read(favoriteListingIdsProvider).valueOrNull ?? [];
        ref
            .read(paginatedMarketCatalogProvider.notifier)
            .updateContext(
              favoriteIds: favorites,
              horses: horses,
              events: events,
            );
      });
    });

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          final horses = await ref.read(horsesProvider.future);
          final events = await ref.read(eventsProvider.future);
          final favorites = await ref.read(favoriteListingIdsProvider.future);
          ref
              .read(paginatedMarketCatalogProvider.notifier)
              .updateContext(
                favoriteIds: favorites,
                horses: horses,
                events: events,
              );
          await ref
              .read(paginatedMarketCatalogProvider.notifier)
              .refresh(filters: filters);
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // App bar
            TamgaSliverHeader(
              title: 'Зах',
              subtitle: 'Морь, малын зарууд',
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.xs),
                  child: SyncIndicator(size: 12),
                ),
                IconButton(
                  tooltip: 'Хадгалсан зарууд',
                  onPressed: () => context.go('/market/favorites'),
                  icon: const Icon(Icons.favorite_border),
                ),
                IconButton(
                  tooltip: 'Зар нэмэх',
                  onPressed: () => context.push('/market/create'),
                  icon: const Icon(Icons.add_business_outlined),
                ),
                PopupMenuButton<String>(
                  tooltip: 'Нэмэлт үйлдэл',
                  onSelected: _handleMenuAction,
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'filters',
                      child: Text(
                        _showFilters ? 'Шүүлтүүр нуух' : 'Шүүлтүүр харуулах',
                      ),
                    ),
                    PopupMenuItem(
                      value: 'view',
                      child: Text(_isGrid ? 'Жагсаалт харах' : 'Сүлжээ харах'),
                    ),
                    PopupMenuItem(
                      value: 'leaderboard',
                      child: Row(
                        children: [
                          const Icon(Icons.leaderboard_outlined),
                          const SizedBox(width: AppSpacing.sm),
                          const Text('Үржүүлэгчийн чансаа'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'price-history',
                      child: Row(
                        children: [
                          const Icon(Icons.history),
                          const SizedBox(width: AppSpacing.sm),
                          const Text('Үнийн түүх'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Discovery lead
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              sliver: SliverToBoxAdapter(
                child: Text(
                  'Танд тохирох морийг олоорой',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),

            // Search field
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                0,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              sliver: SliverToBoxAdapter(
                child: TextField(
                  onChanged: (value) {
                    ref.read(marketFiltersProvider.notifier).state = filters
                        .copyWith(query: value);
                    // Debounce хайлт — 300мс хүлээгээд дахин ачаална
                    _searchDebounceTimer?.cancel();
                    _searchDebounceTimer = Timer(
                      const Duration(milliseconds: 300),
                      () {
                        ref
                            .read(paginatedMarketCatalogProvider.notifier)
                            .refresh(filters: ref.read(marketFiltersProvider));
                      },
                    );
                  },
                  decoration: InputDecoration(
                    hintText: 'Нэр, зүс, байршлаар хайх',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      tooltip: _showFilters
                          ? 'Шүүлтүүр нуух'
                          : 'Шүүлтүүр харуулах',
                      onPressed: () =>
                          setState(() => _showFilters = !_showFilters),
                      icon: Icon(
                        _showFilters ? Icons.tune : Icons.tune_outlined,
                      ),
                    ),
                    filled: true,
                    fillColor: Theme.of(
                      context,
                    ).colorScheme.surfaceContainerLow,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.md,
                    ),
                  ),
                ),
              ),
            ),

            // шүүлтүүрийн самбар
            if (_showFilters)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  0,
                  AppSpacing.lg,
                  AppSpacing.md,
                ),
                sliver: SliverToBoxAdapter(
                  child: MarketFiltersPanel(filters: filters),
                ),
              ),

            // Result summary
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              sliver: SliverToBoxAdapter(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Шинэ зарууд',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    AppStatChip(
                      label: 'Идэвхтэй',
                      value: '${catalogState.totalCount}',
                    ),
                  ],
                ),
              ),
            ),

            // зарууд
            if (catalogState.isLoading && catalogState.items.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (catalogState.isEmpty)
              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.xxl),
                sliver: SliverToBoxAdapter(
                  child: EmptyState(
                    icon: Icons.storefront_outlined,
                    title: 'Эхний зарыг оруулна уу',
                    description: 'Захын зар жагсаалт хоосон байна.',
                    actionLabel: 'Зар нэмэх',
                    onAction: () => context.push('/market/create'),
                  ),
                ),
              )
            else if (_isGrid)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  0,
                  AppSpacing.lg,
                  AppSpacing.xxl,
                ),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: AppSpacing.md,
                    crossAxisSpacing: AppSpacing.md,
                    childAspectRatio: 0.75,
                  ),
                  delegate: SliverChildBuilderDelegate((context, index) {
                    if (index >= catalogState.items.length) return null;
                    return ListingGridCard(
                      item: catalogState.items[index],
                      onOpen: () => context.go(
                        '/market/${catalogState.items[index].listing.id}',
                      ),
                      onFavorite: () => _toggleFavorite(
                        ref,
                        catalogState.items[index].listing.id,
                      ),
                    );
                  }, childCount: catalogState.items.length),
                ),
              )
            else ...[
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  0,
                  AppSpacing.lg,
                  0,
                ),
                sliver: SliverList.separated(
                  itemCount: catalogState.items.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: AppSpacing.md),
                  itemBuilder: (context, index) {
                    final item = catalogState.items[index];
                    return ListingCard(
                      item: item,
                      onOpen: () => context.go('/market/${item.listing.id}'),
                      onFavorite: () => _toggleFavorite(ref, item.listing.id),
                    );
                  },
                ),
              ),

              // ачаалаллалт / төгсгөл
              SliverToBoxAdapter(child: _PaginationFooter(state: catalogState)),
            ],

            // алдаа
            if (catalogState.hasError)
              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.xxl),
                sliver: SliverToBoxAdapter(
                  child: TamgaErrorWidget(
                    message: 'Захын мэдээлэл ачаалахад алдаа гарлаа',
                    onRetry: () => ref
                        .read(paginatedMarketCatalogProvider.notifier)
                        .refresh(filters: ref.read(marketFiltersProvider)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _handleMenuAction(String value) {
    switch (value) {
      case 'filters':
        setState(() => _showFilters = !_showFilters);
      case 'view':
        setState(() => _isGrid = !_isGrid);
      case 'leaderboard':
        context.push('/market/leaderboard');
      case 'price-history':
        context.go('/market/price-history');
    }
  }

  Future<void> _toggleFavorite(WidgetRef ref, String listingId) async {
    final repository = await ref.read(marketRepositoryProvider.future);
    await repository.toggleFavorite(listingId);
    HapticFeedback.lightImpact();
    ref.invalidate(favoriteListingIdsProvider);
    // Дахин ачаалах
    final filters = ref.read(marketFiltersProvider);
    final horses = ref.read(horsesProvider).valueOrNull ?? [];
    final events = ref.read(eventsProvider).valueOrNull ?? [];
    final favorites = await ref.read(favoriteListingIdsProvider.future);
    ref
        .read(paginatedMarketCatalogProvider.notifier)
        .updateContext(favoriteIds: favorites, horses: horses, events: events);
    await ref
        .read(paginatedMarketCatalogProvider.notifier)
        .refresh(filters: filters);
  }
}

// ── Туслах дүрсүүд ──────────────────────────────────────────────────

class _PaginationFooter extends StatelessWidget {
  const _PaginationFooter({required this.state});

  final MarketCatalogPaginationState state;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (state.isLoading) {
      return const Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Center(child: LoadingIndicator(size: 20)),
      );
    }

    if (!state.hasMore && state.items.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
        child: Center(
          child: Text(
            'Бүх зарууд ачаалагдлаа',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
