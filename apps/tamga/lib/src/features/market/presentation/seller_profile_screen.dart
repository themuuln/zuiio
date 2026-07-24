import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/market_providers.dart';
import '../application/rating_providers.dart';
import '../domain/seller_rating.dart';

/// Худалдагчийн дэлгэрэнгүй профайл хуудас.
///
/// Үнэлгээний тархалт, сэтгэгдлүүд, хариу бичих боломжтой.
class SellerProfileScreen extends ConsumerWidget {
  const SellerProfileScreen({
    required this.sellerId,
    required this.listingId,
    super.key,
  });

  final String sellerId;
  final String listingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final safetyAsync = ref.watch(marketSafetySummaryProvider(listingId));
    final ratingSummaryAsync = ref.watch(sellerRatingSummaryProvider(sellerId));
    final ratingsAsync = ref.watch(sellerRatingsProvider(sellerId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Худалдагчийн профайл'),
      ),
      body: safetyAsync.when(
        data: (safety) {
          final profile = safety.sellerProfile;
          if (profile == null) {
            return const Center(child: Text('Худалдагчийн мэдээлэл олдсонгүй.'));
          }

          return CustomScrollView(
            slivers: [
              // ── Seller Info Header ──
              SliverToBoxAdapter(
                child: Card(
                  margin: const EdgeInsets.all(AppSpacing.lg),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 30,
                              backgroundColor:
                                  theme.colorScheme.primaryContainer,
                              child: Icon(
                                Icons.storefront_outlined,
                                color: theme.colorScheme.onPrimaryContainer,
                                size: 30,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    profile.displayName,
                                    style: theme.textTheme.titleLarge,
                                  ),
                                  const SizedBox(height: AppSpacing.xs),
                                  Text(
                                    '${profile.stableName} • ${profile.locationLabel}',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          profile.verificationLabel,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          profile.responseNote,
                          style: theme.textTheme.bodySmall,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(profile.bio),
                        const SizedBox(height: AppSpacing.md),
                        OutlinedButton.icon(
                          onPressed: () {
                            context.push(
                              '/market/breeder-profile',
                              extra: {'sellerId': profile.sellerId},
                            );
                          },
                          icon: const Icon(Icons.person_search_outlined),
                          label: const Text('Үржүүлэгчийн профайл харах'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Rating Summary ──
              SliverToBoxAdapter(
                child: _RatingSummaryCard(
                  ratingSummaryAsync: ratingSummaryAsync,
                  ratingsAsync: ratingsAsync,
                  sellerId: sellerId,
                ),
              ),

              // ── Rating Distribution ──
              SliverToBoxAdapter(
                child: _RatingDistributionSection(
                  ratingSummaryAsync: ratingSummaryAsync,
                ),
              ),

              // ── Reviews List ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.lg,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  child: Text(
                    'Сэтгэгдлүүд',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              ratingsAsync.when(
                data: (ratings) {
                  if (ratings.isEmpty) {
                    return const SliverFillRemaining(
                      child: Center(child: Text('Одоогоор сэтгэгдэл байхгүй.')),
                    );
                  }
                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final rating = ratings[index];
                        return _ReviewCard(
                          rating: rating,
                          isOwner: profile.sellerId == sellerId,
                          onRespond: (ratingId, response) async {
                            final repository = await ref.read(
                              marketRepositoryProvider.future,
                            );
                            await repository.respondToReview(
                              ratingId: ratingId,
                              response: response,
                            );
                            ref.invalidate(sellerRatingsProvider(sellerId));
                            ref.invalidate(
                              sellerRatingSummaryProvider(sellerId),
                            );
                          },
                        );
                      },
                      childCount: ratings.length,
                    ),
                  );
                },
                loading: () => SliverToBoxAdapter(
                  child: SkeletonLoader(
                    items: 2,
                    itemBuilder: (ctx, i) => const SkeletonCardTile(),
                  ),
                ),
                error: (err, _) => SliverToBoxAdapter(
                  child: TamgaErrorWidget(
                    message: 'Сэтгэгдлүүд ачаалахад алдаа гарлаа',
                    onRetry: () => ref.invalidate(
                      sellerRatingsProvider(sellerId),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => Center(
          child: const CircularProgressIndicator(),
        ),
        error: (err, _) => TamgaErrorWidget(
          message: 'Худалдагчийн мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(
            marketSafetySummaryProvider(listingId),
          ),
        ),
      ),
    );
  }
}

/// Үнэлгээний хураангуй карт.
class _RatingSummaryCard extends ConsumerWidget {
  const _RatingSummaryCard({
    required this.ratingSummaryAsync,
    required this.ratingsAsync,
    required this.sellerId,
  });

  final AsyncValue<SellerRatingSummary> ratingSummaryAsync;
  final AsyncValue<List<SellerRating>> ratingsAsync;
  final String sellerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: ratingSummaryAsync.when(
          data: (summary) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  // Дундаж үнэлгээ
                  Column(
                    children: [
                      Text(
                        summary.hasRatings
                            ? summary.averageRating.toStringAsFixed(1)
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
                          final filled = summary.hasRatings &&
                              star <= summary.averageRating.round();
                          return Icon(
                            filled ? Icons.star : Icons.star_border,
                            size: 18,
                            color: theme.colorScheme.primary,
                          );
                        }),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        summary.hasRatings
                            ? '${summary.totalCount} үнэлгээ'
                            : 'Үнэлгээгүй',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
          loading: () => SkeletonLoader(
            items: 1,
            itemBuilder: (ctx, i) => const SkeletonCardTile(),
          ),
          error: (err, _) => TamgaErrorWidget(
            message: 'Үнэлгээ ачаалахад алдаа гарлаа',
            onRetry: () =>
                ref.invalidate(sellerRatingSummaryProvider(sellerId)),
          ),
        ),
      ),
    );
  }
}

/// Үнэлгээний тархалтын хэсэг.
class _RatingDistributionSection extends ConsumerWidget {
  const _RatingDistributionSection({required this.ratingSummaryAsync});

  final AsyncValue<SellerRatingSummary> ratingSummaryAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
              'Үнэлгээний тархалт',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            ratingSummaryAsync.when(
              data: (summary) {
                if (!summary.hasRatings) {
                  return Text(
                    'Одоогоор үнэлгээ байхгүй.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  );
                }

                return Column(
                  children: List.generate(5, (index) {
                    final star = 5 - index; // 5, 4, 3, 2, 1
                    final count = summary.distribution[star] ?? 0;
                    final pct = summary.percentageFor(star);

                    return Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.xs,
                      ),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 40,
                            child: Text(
                              '$star★',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: pct,
                                minHeight: 10,
                                backgroundColor:
                                    theme.colorScheme.surfaceContainerHighest,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  _ratingColor(star, theme),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          SizedBox(
                            width: 32,
                            child: Text(
                              '$count',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.right,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                );
              },
              loading: () => SkeletonLoader(
                items: 5,
                itemBuilder: (ctx, i) => const SkeletonListTile(),
              ),
              error: (err, _) => Text(
                'Тархалт ачаалахад алдаа гарлаа.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _ratingColor(int rating, ThemeData theme) {
    return switch (rating) {
      5 => const Color(0xFF4CAF50),
      4 => const Color(0xFF8BC34A),
      3 => const Color(0xFFFFC107),
      2 => const Color(0xFFFF9800),
      1 => const Color(0xFFF44336),
      _ => theme.colorScheme.primary,
    };
  }
}

/// Сэтгэгдлийн карт.
class _ReviewCard extends StatefulWidget {
  const _ReviewCard({
    required this.rating,
    required this.isOwner,
    required this.onRespond,
  });

  final SellerRating rating;
  final bool isOwner;
  final Future<void> Function(String ratingId, String response) onRespond;

  @override
  State<_ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends State<_ReviewCard> {
  bool _isResponding = false;
  final _responseController = TextEditingController();

  @override
  void dispose() {
    _responseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final r = widget.rating;

    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Үнэлгээний одод
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (index) {
                return Icon(
                  index < r.rating ? Icons.star : Icons.star_border,
                  size: 18,
                  color: theme.colorScheme.primary,
                );
              }),
            ),
            const SizedBox(height: AppSpacing.sm),

            // Сэтгэгдэл текст
            Text(
              r.review,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              _formatDate(r.createdAt),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),

            // Худалдагчийн хариу (байвал)
            if (r.hasResponse) ...[
              const SizedBox(height: AppSpacing.md),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(
                    AppSpacing.cornerRadiusSmall,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.reply,
                          size: 16,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          'Худалдагчийн хариу:',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(r.sellerResponse!),
                    if (r.responseAt != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        _formatDate(r.responseAt!),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],

            // Хариу бичих товч (эзэмшигчид)
            if (widget.isOwner && !r.hasResponse && !_isResponding)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: TextButton.icon(
                  onPressed: () => setState(() => _isResponding = true),
                  icon: const Icon(Icons.reply, size: 16),
                  label: const Text('Хариу бичих'),
                ),
              ),

            // Хариу бичих форм
            if (_isResponding) ...[
              const SizedBox(height: AppSpacing.sm),
              TextField(
                controller: _responseController,
                decoration: const InputDecoration(
                  hintText: 'Хариу бичих...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isResponding = false;
                        _responseController.clear();
                      });
                    },
                    child: const Text('Цуцлах'),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  FilledButton(
                    onPressed: () async {
                      final response = _responseController.text.trim();
                      if (response.isEmpty) return;
                      await widget.onRespond(r.id, response);
                      setState(() {
                        _isResponding = false;
                        _responseController.clear();
                      });
                    },
                    child: const Text('Илгээх'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
