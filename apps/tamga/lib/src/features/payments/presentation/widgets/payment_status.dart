import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';
import '../../application/payment_providers.dart';
import '../../domain/payment_request.dart';

/// Одоогийн subscription төлөвийг харуулах виджет.
class PaymentStatusWidget extends ConsumerWidget {
  const PaymentStatusWidget({super.key});

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final theme = Theme.of(ctx);
    final tierAsync = ref.watch(subscriptionTierProvider);
    final activePaymentAsync = ref.watch(activePaymentProvider);

    return Card(
      child: Padding(
        padding: AppSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Захиалга',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            tierAsync.when(
              data: (tier) => _TierBadge(tier: tier),
              loading: () => const SizedBox(
                height: 24,
                width: 80,
                child: LinearProgressIndicator(),
              ),
              error: (_, _) => const SizedBox.shrink(),
            ),
            const SizedBox(height: AppSpacing.md),
            activePaymentAsync.when(
              data: (payment) {
                if (payment == null) return const SizedBox.shrink();
                return _PendingPaymentBanner(payment: payment);
              },
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

/// Subscription түвшний badge.
class _TierBadge extends StatelessWidget {
  const _TierBadge({required this.tier});

  final SubscriptionTier tier;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);

    final Color badgeColor;
    final Color textColor;

    switch (tier) {
      case SubscriptionTier.free:
        badgeColor = tc.surfaceContainerHigh;
        textColor = tc.onSurfaceVariant;
      case SubscriptionTier.pro:
        badgeColor = tc.primary.withValues(alpha: 0.12);
        textColor = tc.primary;
      case SubscriptionTier.breeder:
        badgeColor = tc.primaryContainer;
        textColor = tc.onPrimaryContainer;
      case SubscriptionTier.stable:
        badgeColor = tc.tertiary.withValues(alpha: 0.12);
        textColor = tc.tertiary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        tier.displayName,
        style: theme.textTheme.labelLarge?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Хүлээгдэж буй төлбөрийн мэдээлэл.
class _PendingPaymentBanner extends StatelessWidget {
  const _PendingPaymentBanner({required this.payment});

  final PaymentRequest payment;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);

    // Хугацаа дууссан бол харуулахгүй
    if (payment.isExpired) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: tc.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        border: Border.all(color: tc.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(Icons.hourglass_top, size: 20, color: tc.primary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Төлбөр хүлээгдэж байна',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Код: ${payment.code}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: tc.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Text(
            payment.remainingTimeLabel,
            style: theme.textTheme.labelMedium?.copyWith(
              color: tc.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
