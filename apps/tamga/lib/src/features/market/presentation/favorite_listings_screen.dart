import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/market_providers.dart';
import '../domain/market_listing.dart';

class FavoriteListingsScreen extends ConsumerWidget {
  const FavoriteListingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(marketCatalogProvider);
    final favoritesAsync = ref.watch(favoriteListingIdsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Хадгалсан зарууд')),
      body: catalog.when(
        data: (data) {
          return favoritesAsync.when(
            data: (favorites) {
              final favItems = data.listings
                  .where((item) => favorites.contains(item.listing.id))
                  .toList();

              if (favItems.isEmpty) {
                return const EmptyState(
                  icon: Icons.favorite_border,
                  title: 'Хадгалсан зар алга',
                  description:
                      'Зах дээрх заруудаас дуртай заруудаа хадгална уу.',
                );
              }

              return ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: favItems.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: AppSpacing.md),
                itemBuilder: (context, index) {
                  final item = favItems[index];
                  final listing = item.listing;
                  final horse = item.horse;

                  return Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                      onTap: () => context.go('/market/${listing.id}'),
                      child: Padding(
                        padding: AppSpacing.cardPadding,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    listing.title,
                                    style: theme.textTheme.titleLarge,
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Хадгалснаас хасах',
                                  onPressed: () async {
                                    final repository = await ref.read(
                                      marketRepositoryProvider.future,
                                    );
                                    await repository.toggleFavorite(listing.id);
                                    HapticFeedback.lightImpact();
                                    ref.invalidate(favoriteListingIdsProvider);
                                    ref.invalidate(marketCatalogProvider);
                                  },
                                  icon: Icon(
                                    Icons.favorite,
                                    color: theme.colorScheme.error,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              '${_formatPrice(listing)} • ${listing.locationLabel}',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              horse == null
                                  ? listing.description
                                  : '${horse.name} • ${horse.coat}',
                              style: theme.textTheme.bodyLarge,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Row(
                              children: [
                                _StatusChip(label: listing.saleType.label),
                                const SizedBox(width: AppSpacing.xs),
                                _StatusChip(
                                  label: 'Итгэл ${listing.trustScore}%',
                                ),
                                if (listing.isSellerVerified) ...[
                                  const SizedBox(width: AppSpacing.xs),
                                  const _StatusChip(label: 'Баталгаатай'),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
            loading: () => SkeletonLoader(
              items: 3,
              itemBuilder: (ctx, i) => const SkeletonCardTile(),
            ),
            error: (error, _) => TamgaErrorWidget(
              message: 'Хадгалсан заруудыг ачаалахад алдаа гарлаа',
              onRetry: () => ref.invalidate(favoriteListingIdsProvider),
            ),
          );
        },
        loading: () => SkeletonLoader(
          items: 3,
          itemBuilder: (ctx, i) => const SkeletonCardTile(),
        ),
        error: (error, _) => TamgaErrorWidget(
          message: 'Захын мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(marketCatalogProvider),
        ),
      ),
    );
  }

  String _formatPrice(MarketListing listing) {
    final value = listing.priceAmount.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '$value ${listing.currency}';
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm + 2,
          vertical: AppSpacing.xs + 3,
        ),
        child: Text(label, style: theme.textTheme.labelLarge),
      ),
    );
  }
}
