import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/breeder_profile_providers.dart';
import '../domain/breeder_profile.dart';

/// Үржүүлэгчийн нийтийн профайл хуудас.
///
/// [sellerId] — харах худалдагчийн ID.
class BreederProfileScreen extends ConsumerWidget {
  const BreederProfileScreen({required this.sellerId, super.key});

  final String sellerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(breederProfileProvider(sellerId));

    return Scaffold(
      appBar: AppBar(title: const Text('Үржүүлэгчийн профайл')),
      body: profileAsync.when(
        data: (profile) {
          return CustomScrollView(
            slivers: [
              // ── Үндсэн мэдээлэл ──
              SliverToBoxAdapter(child: _BreederInfoHeader(profile: profile)),

              // ── Үнэлгээний хураангуй ──
              SliverToBoxAdapter(child: _RatingSection(profile: profile)),

              // ── Амжилт / тэмдэг ──
              if (profile.achievements.isNotEmpty)
                SliverToBoxAdapter(
                  child: _AchievementsSection(
                    achievements: profile.achievements,
                  ),
                ),

              // ── Сүүлийн зарууд ──
              if (profile.recentListings.isNotEmpty)
                SliverToBoxAdapter(
                  child: _RecentListingsSection(
                    listings: profile.recentListings,
                  ),
                ),

              // ── Хоосон зай ──
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Үржүүлэгчийн мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(breederProfileProvider(sellerId)),
        ),
      ),
    );
  }
}

/// ── Үндсэн мэдээллийн хэсэг ──────────────────────────────────────

class _BreederInfoHeader extends StatelessWidget {
  const _BreederInfoHeader({required this.profile});

  final BreederProfile profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.all(AppSpacing.lg),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Нэр + avatar
            Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Icon(
                    Icons.person_outline,
                    color: theme.colorScheme.onPrimaryContainer,
                    size: 32,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.displayName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (profile.locationLabel.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on_outlined,
                              size: 16,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            Flexible(
                              child: Text(
                                profile.locationLabel,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // Гишүүнээр элссэн
            Row(
              children: [
                Icon(
                  Icons.calendar_today_outlined,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'Гишүүнээр элссэн: ${profile.memberSinceLabel}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),

            // Нийт морины тоо
            Row(
              children: [
                Icon(
                  Icons.pets_outlined,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'Нийт морь: ${profile.totalHorses}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// ── Үнэлгээний хэсэг ─────────────────────────────────────────────

class _RatingSection extends StatelessWidget {
  const _RatingSection({required this.profile});

  final BreederProfile profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Худалдагчийн үнэлгээ',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                // Дундаж үнэлгээ
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.totalRatings > 0
                          ? profile.averageRating.toStringAsFixed(1)
                          : '—',
                      style: theme.textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(5, (index) {
                        final star = index + 1;
                        final filled =
                            profile.totalRatings > 0 &&
                            star <= profile.averageRating.round();
                        return Icon(
                          filled ? Icons.star : Icons.star_border,
                          size: 18,
                          color: theme.colorScheme.primary,
                        );
                      }),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      profile.totalRatings > 0
                          ? '${profile.totalRatings} үнэлгээ'
                          : 'Үнэлгээгүй',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// ── Амжилт / тэмдэг хэсэг ────────────────────────────────────────

class _AchievementsSection extends StatelessWidget {
  const _AchievementsSection({required this.achievements});

  final List<String> achievements;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Амжилт / Тэмдэг',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: achievements.map((achievement) {
                return Chip(
                  avatar: Icon(
                    Icons.emoji_events,
                    size: 18,
                    color: theme.colorScheme.primary,
                  ),
                  label: Text(achievement, style: theme.textTheme.labelMedium),
                  backgroundColor: theme.colorScheme.primaryContainer,
                  side: BorderSide.none,
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

/// ── Сүүлийн заруудын хэсэг ───────────────────────────────────────

class _RecentListingsSection extends StatelessWidget {
  const _RecentListingsSection({required this.listings});

  final List<BreederListingPreview> listings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Сүүлийн зарууд',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${listings.length}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            ...listings.map(
              (listing) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Зургийн placeholder
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.cornerRadiusSmall,
                        ),
                      ),
                      child: listing.thumbnailUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(
                                AppSpacing.cornerRadiusSmall,
                              ),
                              child: CachedNetworkImage(
                                imageUrl: listing.thumbnailUrl!,
                                fit: BoxFit.cover,
                                errorWidget: (ctx, url, err) =>
                                    _listingPlaceholderIcon(theme),
                              ),
                            )
                          : _listingPlaceholderIcon(theme),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            listing.title,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            listing.formattedPrice,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _listingPlaceholderIcon(ThemeData theme) {
    return Icon(
      Icons.image_outlined,
      color: theme.colorScheme.onSurfaceVariant,
    );
  }
}
