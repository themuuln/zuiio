/// Төлбөрийн түвшин сонгох карт.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../domain/payment_request.dart';

/// Төлбөрийн түвшин сонгох карт.
class PaymentTierCard extends StatelessWidget {
  const PaymentTierCard({
    required this.tier,
    required this.isSelected,
    required this.isFree,
    required this.onTap,
    super.key,
  });

  /// Түвшин.
  final SubscriptionTier tier;

  /// Сонгосон эсэх.
  final bool isSelected;

  /// Үнэгүй эсэх.
  final bool isFree;

  /// Дарсан үед.
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tc = TamgaColors.of(context);
    final features = _tierFeatures(tier);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(
          color: isSelected ? theme.colorScheme.primary : tc.outline,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        onTap: isFree ? null : onTap,
        child: Padding(
          padding: AppSpacing.cardPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tier.displayName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (!isFree) ...[
                          const SizedBox(height: 2),
                          Text(
                            tier.formattedPrice,
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle, color: theme.colorScheme.primary)
                  else if (isFree)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: tc.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.cornerRadiusPill,
                        ),
                      ),
                      child: Text(
                        'Одоогийн',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: tc.onSurfaceVariant,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              ...features.map(
                (feature) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 16,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(feature, style: theme.textTheme.bodyMedium),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

List<String> _tierFeatures(SubscriptionTier tier) {
  return switch (tier) {
    SubscriptionTier.free => ['3 морь нэмэх', 'Үндсэн мэдээлэл'],
    SubscriptionTier.pro => [
      '10 морь нэмэх',
      'Үржүүлэгийн хэрэгсэл',
      'Захын зар',
    ],
    SubscriptionTier.breeder => [
      'Хязгааргүй морь',
      'Бүх хэрэгсэл',
      'Үржүүлэгийн хэрэгсэл',
      'Захын зар',
      'Нэмэлт функцүүд',
    ],
    SubscriptionTier.stable => [
      'Бүх функцүүд',
      'Онцлог функцүүд',
      'Хязгааргүй морь',
      'Бүх хэрэгсэл',
    ],
  };
}
