import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../payments/application/payment_providers.dart';
import '../../payments/domain/payment_request.dart';
import '../application/market_providers.dart';
import '../domain/market_listing.dart';
import 'trial_slots_screen.dart';
import 'widgets/boost_purchase_sheet.dart';

// ══════════════════════════════════════════════════════════════════
// MyListingsScreen — Manage user's own listings
// ══════════════════════════════════════════════════════════════════

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final myListingsAsync = ref.watch(myListingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Миний зарууд'),
        bottom: TabBar(
          controller: _tabController,
          onTap: (_) => HapticFeedback.selectionClick(),
          tabs: const [
            Tab(text: 'Идэвхтэй'),
            Tab(text: 'Хүлээж буй'),
            Tab(text: 'Борлуулсан'),
            Tab(text: 'Хугацаа дууссан'),
          ],
        ),
      ),
      body: myListingsAsync.when(
        data: (summary) {
          final tabs = [
            summary.active,
            summary.pending,
            summary.sold,
            summary.expired,
          ];

          return TabBarView(
            controller: _tabController,
            children: tabs.map((listings) {
              if (listings.isEmpty) {
                return EmptyState(
                  icon: Icons.storefront_outlined,
                  title: _emptyLabel(_tabController.index),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: listings.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: AppSpacing.md),
                itemBuilder: (context, index) {
                  final item = listings[index];
                  return _MyListingCard(
                    item: item,
                    onOpen: () => context.go('/market/${item.listing.id}'),
                    onEdit: () => _editListing(context, item.listing),
                    onDelete: () => _deleteListing(context, item.listing),
                    onMarkSold: () => _markAsSold(item.listing),
                    onRenew: () => _renewListing(item.listing),
                    onBoost: () => _showBoostSheet(context, item.listing.id),
                    onTrialSlots: () => _openTrialSlots(context, item.listing),
                  );
                },
              );
            }).toList(),
          );
        },
        loading: () => SkeletonLoader(
          items: 4,
          itemBuilder: (ctx, i) => const SkeletonCardTile(),
        ),
        error: (e, _) => TamgaErrorWidget(
          message: 'Миний заруудыг ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(myListingsProvider),
        ),
      ),
    );
  }

  String _emptyLabel(int index) {
    return switch (index) {
      0 => 'Идэвхтэй зар байхгүй байна.',
      1 => 'Баталгаажуулалт хүлээж буй зар байхгүй.',
      2 => 'Борлуулсан зар байхгүй.',
      3 => 'Хугацаа дууссан зар байхгүй.',
      _ => '',
    };
  }

  // ── Actions ───────────────────────────────────────────────────

  void _editListing(BuildContext context, MarketListing listing) {
    context.go('/market/edit/${listing.id}', extra: listing);
  }

  Future<void> _deleteListing(
    BuildContext context,
    MarketListing listing,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Зар устгах'),
        content: Text('"${listing.title}" зарыг устгах уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Устгах'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final repository = await ref.read(marketRepositoryProvider.future);
    await repository.deleteListing(listing.id);
    ref.invalidate(marketListingsProvider);
    ref.invalidate(marketCatalogProvider);
    ref.invalidate(myListingsProvider);

    if (context.mounted) {
      TamgaToast.showSuccess(context, 'Зар устгагдлаа.');
    }
  }

  Future<void> _markAsSold(MarketListing listing) async {
    final repository = await ref.read(marketRepositoryProvider.future);
    await repository.markAsSold(listing.id);
    ref.invalidate(marketListingsProvider);
    ref.invalidate(marketCatalogProvider);
    ref.invalidate(myListingsProvider);

    if (mounted) {
      TamgaToast.showSuccess(context, 'Зар "Борлуулсан" болголоо.');
    }
  }

  Future<void> _renewListing(MarketListing listing) async {
    final repository = await ref.read(marketRepositoryProvider.future);
    await repository.renewListing(listing.id);
    ref.invalidate(marketListingsProvider);
    ref.invalidate(marketCatalogProvider);
    ref.invalidate(myListingsProvider);

    if (mounted) {
      TamgaToast.showSuccess(context, 'Зар сэргээгдлээ.');
    }
  }

  Future<void> _showBoostSheet(BuildContext context, String listingId) async {
    final result = await BoostPurchaseSheet.show(context, listingId: listingId);

    if (result == null || !mounted) return;

    if (result.hasPayment) {
      // Payment request created successfully — show confirmation and start
      // polling for payment verification
      final ctx = this.context;
      if (!ctx.mounted) return;

      TamgaToast.showSuccess(
        ctx,
        'Төлбөрийн хүсэлт үүсгэгдлээ. Код: ${result.paymentCode}',
      );

      // Start polling for payment verification
      _pollPaymentStatus(result, listingId);
    } else {
      final ctx = this.context;
      if (!ctx.mounted) return;
      TamgaToast.show(
        ctx,
        '${result.type == BoostType.vip ? "VIP" : "Сурталчилгаа"} ${result.priceMnt} MNT төлбөр илгээгдлээ.',
      );
    }
  }

  Future<void> _openTrialSlots(
    BuildContext context,
    MarketListing listing,
  ) async {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            TrialSlotsScreen(listingId: listing.id, sellerId: listing.sellerId),
      ),
    );
  }

  /// Төлбөрийн төлөвийг үе үе шалгаж, баталгаажсан тохиолдолд boost идэвхжүүлэх.
  void _pollPaymentStatus(BoostPurchaseResult result, String listingId) {
    const maxAttempts = 30; // Poll for ~5 minutes (30 attempts × 10s)
    var attempts = 0;

    Timer.periodic(const Duration(seconds: 10), (timer) async {
      attempts++;

      if (!mounted || attempts >= maxAttempts) {
        timer.cancel();
        return;
      }

      try {
        final paymentRepo = ref.read(paymentRepositoryProvider);
        final statusResult = await paymentRepo.getPaymentStatus(
          result.paymentRequestId!,
        );

        if (!mounted) {
          timer.cancel();
          return;
        }

        if (statusResult.isSuccess) {
          final payment = statusResult.value;
          if (payment.status == PaymentStatus.verified) {
            timer.cancel();

            // Payment verified — activate boost or VIP on the listing
            final marketRepo = await ref.read(marketRepositoryProvider.future);
            final now = DateTime.now();
            final expiresAt = now.add(result.duration);

            if (result.type == BoostType.promoted) {
              await marketRepo.boostListing(
                listingId: listingId,
                level: result.tier as BoostLevel,
                expiresAt: expiresAt,
              );
            } else {
              await marketRepo.setVipLevel(
                listingId: listingId,
                level: result.tier as VipLevel,
                expiresAt: expiresAt,
              );
            }

            ref.invalidate(marketListingsProvider);
            ref.invalidate(marketCatalogProvider);
            ref.invalidate(myListingsProvider);

            if (!mounted) return;
            TamgaToast.showSuccess(
              context,
              '${result.type == BoostType.vip ? "VIP" : "Boost"} амжилттай идэвхжлээ!',
            );
          } else if (payment.status == PaymentStatus.rejected ||
              payment.status == PaymentStatus.expired) {
            timer.cancel();
            if (!mounted) return;
            TamgaToast.show(
              context,
              'Төлбөр ${payment.status.displayName}. Дахь оролдоно уу.',
            );
          }
        }
      } catch (_) {
        // Silently retry on error
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════════
// My Listing Card
// ══════════════════════════════════════════════════════════════════

class _MyListingCard extends StatelessWidget {
  const _MyListingCard({
    required this.item,
    required this.onOpen,
    required this.onEdit,
    required this.onDelete,
    required this.onMarkSold,
    required this.onRenew,
    required this.onBoost,
    required this.onTrialSlots,
  });

  final MarketListingVm item;
  final VoidCallback onOpen;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onMarkSold;
  final VoidCallback onRenew;
  final VoidCallback onBoost;
  final VoidCallback onTrialSlots;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final listing = item.listing;
    final horse = item.horse;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        onTap: onOpen,
        child: Padding(
          padding: AppSpacing.cardPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header row ─────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          listing.title,
                          style: theme.textTheme.titleMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          horse?.name ?? 'Морь тодорхойгүй',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _StatusChip(status: listing.status),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),

              // ── Details ────────────────────────────────────
              Text(
                '${_formatPrice(listing.priceAmount)} • ${listing.locationLabel}',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.xs),
              Row(
                children: [
                  Icon(
                    Icons.visibility_outlined,
                    size: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    '${listing.viewsCount} үзсэн',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Icon(
                    Icons.calendar_today,
                    size: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    _formatDate(listing.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),

              // ── Boost Status ───────────────────────────────
              if (listing.isVip || listing.isBoosted || listing.hasSellerBadge)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Wrap(
                    spacing: AppSpacing.xs,
                    runSpacing: AppSpacing.xs,
                    children: [
                      if (listing.isVip)
                        _BoostStatusChip(
                          label:
                              '${listing.vipLevel.label} • ${_formatExpiry(listing.vipExpiresAt)}',
                          color: theme.colorScheme.primary,
                          icon: Icons.workspace_premium,
                        ),
                      if (listing.isBoosted)
                        _BoostStatusChip(
                          label:
                              '${listing.boostLevel.label} • ${_formatExpiry(listing.boostExpiresAt)}',
                          color: theme.colorScheme.tertiary,
                          icon: Icons.rocket_launch,
                        ),
                      if (listing.hasSellerBadge)
                        _BoostStatusChip(
                          label:
                              '${listing.sellerBadge.label} • ${_formatExpiry(listing.sellerBadgeExpiresAt)}',
                          color: theme.colorScheme.secondary,
                          icon: Icons.store,
                        ),
                    ],
                  ),
                ),

              // ── Action buttons ─────────────────────────────
              Wrap(
                spacing: AppSpacing.xs,
                runSpacing: AppSpacing.xs,
                children: [
                  if (listing.isActive) ...[
                    FilledButton.icon(
                      onPressed: onBoost,
                      icon: const Icon(Icons.rocket_launch, size: 16),
                      label: const Text('Сурталчилгаа'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: onEdit,
                      icon: const Icon(Icons.edit_outlined, size: 16),
                      label: const Text('Засах'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: onMarkSold,
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Борлуулсан'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: onTrialSlots,
                      icon: const Icon(
                        Icons.event_available_outlined,
                        size: 16,
                      ),
                      label: const Text('Туршилт'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                      ),
                    ),
                  ],
                  if (listing.isExpired)
                    FilledButton.icon(
                      onPressed: onRenew,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Сэргээх'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                      ),
                    ),
                  OutlinedButton.icon(
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: const Text('Устгах'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: theme.colorScheme.error,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Status chip
// ══════════════════════════════════════════════════════════════════

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final MarketListingStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final (bgColor, textColor, label) = switch (status) {
      MarketListingStatus.active => (
        theme.colorScheme.tertiaryContainer,
        theme.colorScheme.onTertiaryContainer,
        'Идэвхтэй',
      ),
      MarketListingStatus.pendingVerification => (
        theme.colorScheme.primaryContainer,
        theme.colorScheme.onPrimaryContainer,
        'Хүлээж буй',
      ),
      MarketListingStatus.sold => (
        theme.colorScheme.secondaryContainer,
        theme.colorScheme.onSecondaryContainer,
        'Борлуулсан',
      ),
      MarketListingStatus.expired => (
        theme.colorScheme.surfaceContainerHighest,
        theme.colorScheme.onSurfaceVariant,
        'Хугацаа дууссан',
      ),
      MarketListingStatus.rejected => (
        theme.colorScheme.errorContainer,
        theme.colorScheme.onErrorContainer,
        'Татгалзсан',
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════

String _formatPrice(int value) {
  return '${value.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',')} MNT';
}

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

String _formatExpiry(DateTime? expiresAt) {
  if (expiresAt == null) return '';
  final remaining = expiresAt.difference(DateTime.now());
  if (remaining.isNegative) return 'Хугацаа дууссан';
  if (remaining.inDays > 0) return '${remaining.inDays} хоног';
  if (remaining.inHours > 0) return '${remaining.inHours} цаг';
  return '${remaining.inMinutes} минут';
}

class _BoostStatusChip extends StatelessWidget {
  const _BoostStatusChip({
    required this.label,
    required this.color,
    required this.icon,
  });

  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
