/// Захын зарын карт (жагсаалт болон сүлжээ хэлбэр).
library;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../application/market_providers.dart';
import '../domain/market_listing.dart';
import 'widgets/listing_badge.dart';

/// Зарын карт (жагсаалт хэлбэр).
class ListingCard extends StatelessWidget {
  const ListingCard({
    required this.item,
    required this.onOpen,
    required this.onFavorite,
    super.key,
  });

  /// Зарын мэдээлэл.
  final MarketListingVm item;

  /// Нээх үйлдэл.
  final VoidCallback onOpen;

  /// Хадгалах/хасах үйлдэл.
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tc = TamgaColors.of(context);
    final listing = item.listing;
    final horse = item.horse;
    final hasImage = listing.mediaUrls.isNotEmpty;
    final imageUrl = hasImage ? listing.mediaUrls.first : null;
    final isNetwork = imageUrl != null && imageUrl.startsWith('http');

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        onTap: onOpen,
        child: Padding(
          padding: AppSpacing.cardPadding,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // зураг (Hero shared-element transition)
              if (hasImage)
                Hero(
                  tag: 'listing-image-${listing.id}',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusSmall,
                    ),
                    child: isNetwork
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            width: 72,
                            height: 72,
                            fit: BoxFit.cover,
                            // Decode a 2x-sized bitmap instead of the full
                            // original (often 1000px+) — big memory win in lists.
                            memCacheWidth: 144,
                            placeholder: (_, _) => _ImagePlaceholder(
                              theme: theme,
                              width: 72,
                              height: 72,
                            ),
                            errorWidget: (_, _, _) => _ImageError(
                              theme: theme,
                              width: 72,
                              height: 72,
                            ),
                          )
                        : _LocalImage(theme: theme),
                  ),
                ),
              if (hasImage) const SizedBox(width: AppSpacing.md),
              // агуулга
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ListingBadge(listing: listing, compact: true),
                        const SizedBox(width: AppSpacing.xs),
                        Expanded(
                          child: Text(
                            listing.title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          tooltip: item.isFavorite
                              ? 'Хадгалснаас хасах'
                              : 'Хадгалах',
                          onPressed: onFavorite,
                          icon: Icon(
                            item.isFavorite
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: item.isFavorite ? tc.error : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _formatPrice(listing),
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: tc.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      listing.locationLabel.isEmpty
                          ? listing.saleType.label
                          : '${listing.saleType.label} • ${listing.locationLabel}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      horse == null
                          ? listing.description
                          : '${horse.name} • ${horse.coat} • ${horse.birthYear}',
                      style: theme.textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.xs,
                      runSpacing: AppSpacing.xs,
                      children: [
                        _Badge(label: 'Итгэл ${listing.trustScore}%'),
                        if (listing.viewsCount > 0)
                          _Badge(label: 'Үзсэн ${listing.viewsCount}'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Зарын карт (сүлжээ хэлбэр).
class ListingGridCard extends StatelessWidget {
  const ListingGridCard({
    required this.item,
    required this.onOpen,
    required this.onFavorite,
    super.key,
  });

  /// Зарын мэдээлэл.
  final MarketListingVm item;

  /// Нээх үйлдэл.
  final VoidCallback onOpen;

  /// Хадгалах/хасах үйлдэл.
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final listing = item.listing;
    final horse = item.horse;
    final hasImage = listing.mediaUrls.isNotEmpty;
    final imageUrl = hasImage ? listing.mediaUrls.first : null;
    final isNetwork = imageUrl != null && imageUrl.startsWith('http');

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // зураг (Hero shared-element transition)
            Expanded(
              child: Stack(
                children: [
                  // Арын зураг эсвэл градиент
                  if (hasImage && isNetwork)
                    Hero(
                      tag: 'listing-image-${listing.id}',
                      child: CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        memCacheWidth: 800,
                        height: double.infinity,
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      height: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.primaryContainer,
                            theme.colorScheme.secondaryContainer,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.landscape,
                        size: 40,
                        color: theme.colorScheme.onPrimaryContainer.withValues(
                          alpha: 0.3,
                        ),
                      ),
                    ),
                  // Дээд талын тэмдэглэгээнүүд
                  Positioned(
                    top: AppSpacing.sm,
                    left: AppSpacing.sm,
                    right: AppSpacing.sm,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Badge(label: listing.saleType.label),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (listing.mediaUrls.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.xs,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.onSurface.withValues(
                                    alpha: 0.45,
                                  ),
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.cornerRadiusSmall,
                                  ),
                                ),
                                child: Text(
                                  '${listing.mediaUrls.length}',
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: theme.colorScheme.surface,
                                  ),
                                ),
                              ),
                            if (listing.mediaUrls.isNotEmpty)
                              const SizedBox(width: AppSpacing.xs),
                            Material(
                              color: theme.colorScheme.surface.withValues(
                                alpha: 0.92,
                              ),
                              shape: const CircleBorder(),
                              child: IconButton(
                                tooltip: item.isFavorite
                                    ? 'Хадгалснаас хасах / Remove saved'
                                    : 'Хадгалах / Save',
                                onPressed: onFavorite,
                                icon: Icon(
                                  item.isFavorite
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                ),
                                color: item.isFavorite
                                    ? theme.colorScheme.error
                                    : theme.colorScheme.onSurfaceVariant,
                                iconSize: 18,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints.tightFor(
                                  width: 44,
                                  height: 44,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // мэдээлэл
            Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    horse?.name ?? listing.title,
                    style: theme.textTheme.titleSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    _formatPrice(listing),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    listing.locationLabel,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Туслах дүрсүүд ──────────────────────────────────────────────────

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({
    required this.theme,
    required this.width,
    required this.height,
  });

  final ThemeData theme;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: theme.colorScheme.surfaceContainerHighest,
      child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
    );
  }
}

class _ImageError extends StatelessWidget {
  const _ImageError({
    required this.theme,
    required this.width,
    required this.height,
  });

  final ThemeData theme;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: theme.colorScheme.errorContainer,
      child: Icon(
        Icons.broken_image_outlined,
        color: theme.colorScheme.error,
        size: 20,
      ),
    );
  }
}

class _LocalImage extends StatelessWidget {
  const _LocalImage({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.secondaryContainer,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Icon(
        Icons.landscape,
        size: 28,
        color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.4),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

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

String _formatPrice(MarketListing listing) {
  final value = listing.priceAmount.toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (match) => ',',
  );
  return '$value ${listing.currency}';
}
