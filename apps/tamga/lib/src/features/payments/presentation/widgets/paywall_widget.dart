import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';
import '../../domain/payment_request.dart';
import '../../../../core/features/feature_gate.dart';

/// Түвшин хязгаар хүрсэн үед харуулах paywall цонх.
///
/// Давхардал болгоомжлол (loss-aversion) аргаар хэрэглэгчийг
/// алдах боломжоо мэдрүүлж, шинэчлэхэд хүргэнэ.
class PaywallWidget extends ConsumerWidget {
  const PaywallWidget({
    super.key,
    required this.denied,
    required this.onDismiss,
  });

  /// Хязгаарлалтын мэдээлэл.
  final GateDenied denied;

  /// Цонхыг хаах callback.
  final VoidCallback onDismiss;

  /// Paywall цонхыг bottom sheet болгон харуулах.
  static Future<void> show(BuildContext context, {required GateDenied denied}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PaywallWidget(
        denied: denied,
        onDismiss: () => Navigator.of(context).pop(),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final tc = TamgaColors.of(context);
    final requiredTier = denied.requiredTier;
    final nextLimits = kTierLimits[requiredTier]!;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.xxl),
        ),
      ),
      child: Padding(
        padding: AppSpacing.sheetPadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Drag handle ──
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: tc.onSurfaceVariant.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── Icon ──
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.lock_outline_rounded,
                size: 28,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Title — loss-aversion framing ──
            Text(
              'Боломжоо алдахгүй байгаарай!',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),

            // ── Description ──
            Text(
              denied.reason,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: tc.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── What you'll get ──
            _BenefitsList(tier: requiredTier, limits: nextLimits),
            const SizedBox(height: AppSpacing.xxl),

            // ── Upgrade button ──
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/payments');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                ),
                child: Text(
                  'Шинэчлэх — ${requiredTier.formattedPrice}/сар',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Dismiss button ──
            SizedBox(
              width: double.infinity,
              height: 48,
              child: TextButton(
                onPressed: onDismiss,
                child: Text(
                  'Дараа',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: tc.onSurfaceVariant,
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}

/// Түвшингийн давуу жагсаалт.
class _BenefitsList extends StatelessWidget {
  const _BenefitsList({required this.tier, required this.limits});

  final SubscriptionTier tier;
  final TierLimits limits;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final benefits = _buildBenefits();

    return Column(
      children: [
        for (final benefit in benefits) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle_outline,
                  size: 20,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(benefit, style: theme.textTheme.bodyMedium),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  List<String> _buildBenefits() {
    final benefits = <String>[];

    if (limits.maxHorses != null) {
      benefits.add('Хязгааргүй морь нэмэх');
    } else {
      benefits.add('Хязгааргүий морь бүртгэх');
    }

    benefits.add('${limits.storageLabel} хадгалах зай');

    if (limits.maxPedigreeGenerations != null) {
      benefits.add('${limits.maxPedigreeGenerations}+ үеийн удам мод');
    } else {
      benefits.add('Бүх үеийн удам мод');
    }

    if (limits.hasInbreedingCalc) {
      benefits.add('Цус ойртолтын тооцоолуур');
    }
    if (limits.hasBreedingTools) {
      benefits.add('Үржүүлэлтийн хэрэгслүүд');
    }
    if (limits.maxMultiUsers != null && limits.maxMultiUsers! > 1) {
      benefits.add('${limits.maxMultiUsers} хүртэл хамтын хэрэглэгч');
    }
    if (limits.hasClientPortal) {
      benefits.add('Захын portal');
    }

    return benefits;
  }
}
