import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/supabase_bootstrap.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/features/feature_gate.dart';
import '../../../payments/application/payment_providers.dart';
import '../../../payments/data/payment_service.dart';
import '../../../payments/domain/payment_request.dart';
import '../../domain/market_listing.dart';

/// ══════════════════════════════════════════════════════════════════
/// BoostPurchaseSheet — Bottom sheet for purchasing boost/VIP tiers
/// ══════════════════════════════════════════════════════════════════
///
/// Shows tier options (Standard/Premium) for both VIP and Promoted boosts.
/// Displays pricing in MNT and Khan Bank payment instructions after selection.
/// Wired to `boostGateProvider` — free tier users get denied with upgrade prompt.
class BoostPurchaseSheet extends ConsumerStatefulWidget {
  const BoostPurchaseSheet({required this.listingId, super.key});

  /// The ID of the listing to boost.
  final String listingId;

  /// Shows the bottom sheet and returns the selected boost tier, or null if cancelled.
  static Future<BoostPurchaseResult?> show(
    BuildContext context, {
    required String listingId,
  }) {
    return showModalBottomSheet<BoostPurchaseResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => BoostPurchaseSheet(listingId: listingId),
    );
  }

  @override
  ConsumerState<BoostPurchaseSheet> createState() => _BoostPurchaseSheetState();
}

class _BoostPurchaseSheetState extends ConsumerState<BoostPurchaseSheet> {
  BoostType? _selectedType;
  _TierOption? _selectedTier;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gateCheck = ref.watch(boostGateProvider);

    // If gate denies, show upgrade prompt
    if (gateCheck is GateDenied) {
      return _UpgradePromptSheet(reason: gateCheck.reason);
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppSpacing.cornerRadius),
            ),
          ),
          child: Column(
            children: [
              // ── Drag Handle ────────────────────────────────
              Container(
                width: 36,
                height: 5,
                margin: const EdgeInsets.only(top: AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(
                    AppSpacing.cornerRadiusPill,
                  ),
                ),
              ),

              // ── Header ─────────────────────────────────────
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Зар сурталчилгаа',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Зарыг илүү их хүнд хүртэл сурталчлах',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // ── Content ────────────────────────────────────
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  children: [
                    // ── Boost Type Tabs ──────────────────────
                    _BoostTypeSelector(
                      selected: _selectedType,
                      onSelected: (type) {
                        setState(() {
                          _selectedType = type;
                          _selectedTier = null;
                        });
                      },
                    ),
                    const SizedBox(height: AppSpacing.xxl),

                    // ── Tier Options ─────────────────────────
                    if (_selectedType != null) ...[
                      Text(
                        _selectedType == BoostType.promoted
                            ? 'Сурталчилгаа сонгох'
                            : 'VIP зэрэглэл сонгох',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      ...(_selectedType == BoostType.promoted
                              ? _promotedTiers
                              : _vipTiers)
                          .map(
                            (tier) => _TierOptionCard(
                              tier: tier,
                              isSelected: _selectedTier == tier,
                              onTap: () => setState(() => _selectedTier = tier),
                            ),
                          ),
                      const SizedBox(height: AppSpacing.xxl),
                    ],

                    // ── Payment Instructions ─────────────────
                    if (_selectedTier != null) ...[
                      _PaymentInstructions(tier: _selectedTier!),
                      const SizedBox(height: AppSpacing.xxl),
                    ],
                  ],
                ),
              ),

              // ── Action Button ──────────────────────────────
              if (_selectedTier != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    0,
                    AppSpacing.lg,
                    AppSpacing.xxl,
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => _onPurchase(),
                      child: Text(
                        '${_formatPrice(_selectedTier!.priceMnt)} төлөх',
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _onPurchase() async {
    if (_selectedTier == null || _selectedType == null) return;

    HapticFeedback.lightImpact();

    // Create a PaymentRequest for the boost purchase
    final userId = currentSupabaseUserId() ?? 'local-boost';
    final code = PaymentService.generatePaymentCode();
    final now = DateTime.now().toUtc();
    final expiresAt = now.add(const Duration(hours: 72));

    final paymentRequest = PaymentRequest(
      id: '',
      userId: userId,
      tier: SubscriptionTier.free,
      paymentType: PaymentType.listingBoost,
      code: code,
      amountMnt: _selectedTier!.priceMnt,
      status: PaymentStatus.pending,
      createdAt: now,
      expiresAt: expiresAt,
    );

    try {
      final paymentRepo = ref.read(paymentRepositoryProvider);
      final result = await paymentRepo.createPaymentRequest(paymentRequest);

      if (result.isSuccess) {
        final payment = result.value;

        // Pop with the result including payment info
        if (!context.mounted) return; // ignore: use_build_context_synchronously
        // ignore: use_build_context_synchronously
        Navigator.of(context).pop(BoostPurchaseResult(
          listingId: widget.listingId,
          type: _selectedType!,
          tier: _selectedTier!.level,
          priceMnt: _selectedTier!.priceMnt,
          duration: _selectedTier!.duration,
          paymentCode: payment.code,
          paymentRequestId: payment.id,
        ));
      } else {
        if (!context.mounted) return; // ignore: use_build_context_synchronously
        // ignore: use_build_context_synchronously
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Төлбөрийн хүсэлт үүсгэхэд алдаа гарлаа: ${result.error.message}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!context.mounted) return; // ignore: use_build_context_synchronously
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Төлбөрийн хүсэлт үүсгэхэд алдаа гарлаа: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // ── Tier Definitions ──────────────────────────────────────────

  // Colors are resolved from theme at render time; these defaults
  // serve as placeholders until _TierOptionCard overrides them.
  static final _promotedTiers = [
    _TierOption(
      level: BoostLevel.standard,
      label: 'Сурталчилгаа',
      description: '24 цаг идэвхтэй',
      priceMnt: 2000,
      duration: Duration(hours: 24),
      icon: Icons.rocket_launch,
      color: null,
    ),
    _TierOption(
      level: BoostLevel.premium,
      label: 'Дээд зэрэглэл',
      description: '72 цаг идэвхтэй',
      priceMnt: 5000,
      duration: Duration(hours: 72),
      icon: Icons.rocket,
      color: null,
    ),
  ];

  static final _vipTiers = [
    _TierOption(
      level: VipLevel.standard,
      label: 'VIP',
      description: '7 хоног идэвхтэй',
      priceMnt: 5000,
      duration: Duration(days: 7),
      icon: Icons.workspace_premium,
      color: null,
    ),
    _TierOption(
      level: VipLevel.premium,
      label: 'VIP Premium',
      description: '30 хоног идэвхтэй',
      priceMnt: 15000,
      duration: Duration(days: 30),
      icon: Icons.workspace_premium,
      color: null,
    ),
  ];
}

// ══════════════════════════════════════════════════════════════════
// Data Classes
// ══════════════════════════════════════════════════════════════════

/// Boost type selector.
enum BoostType { promoted, vip }

/// Tier option model.
class _TierOption {
  const _TierOption({
    required this.level,
    required this.label,
    required this.description,
    required this.priceMnt,
    required this.duration,
    required this.icon,
    this.color,
  });

  /// Either BoostLevel or VipLevel.
  final dynamic level;
  final String label;
  final String description;
  final int priceMnt;
  final Duration duration;
  final IconData icon;

  /// Theme-aware color override; resolved from theme if null.
  final Color? color;
}

/// Result returned when user selects a tier.
class BoostPurchaseResult {
  const BoostPurchaseResult({
    required this.listingId,
    required this.type,
    required this.tier,
    required this.priceMnt,
    required this.duration,
    this.paymentCode,
    this.paymentRequestId,
  });

  final String listingId;
  final BoostType type;
  final dynamic tier;
  final int priceMnt;
  final Duration duration;

  /// Төлбөрийн код (PaymentRequest.code), хэрэв амжилттай үүсгэгдсэн бол.
  final String? paymentCode;

  /// Төлбөрийн хүсэлтийн ID (PaymentRequest.id), хэрэв амжилттай үүсгэгдсэн бол.
  final String? paymentRequestId;

  /// Төлбөр амжилттай үүсгэгдсэн эсэх.
  bool get hasPayment => paymentCode != null && paymentRequestId != null;
}

// ══════════════════════════════════════════════════════════════════
// Sub-widgets
// ══════════════════════════════════════════════════════════════════

/// Boost type selector (VIP / Promoted tabs).
class _BoostTypeSelector extends StatelessWidget {
  const _BoostTypeSelector({required this.selected, required this.onSelected});

  final BoostType? selected;
  final ValueChanged<BoostType> onSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _TypeButton(
            label: 'Сурталчилгаа',
            icon: Icons.rocket_launch,
            isSelected: selected == BoostType.promoted,
            onTap: () => onSelected(BoostType.promoted),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _TypeButton(
            label: 'VIP',
            icon: Icons.workspace_premium,
            isSelected: selected == BoostType.vip,
            onTap: () => onSelected(BoostType.vip),
          ),
        ),
      ],
    );
  }
}

class _TypeButton extends StatelessWidget {
  const _TypeButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isSelected
        ? theme.colorScheme.primary
        : theme.colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primary.withValues(alpha: 0.1)
              : theme.colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          border: Border.all(
            color: isSelected
                ? theme.colorScheme.primary
                : theme.colorScheme.outline,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: AppSpacing.sm),
            Text(
              label,
              style: theme.textTheme.titleMedium?.copyWith(
                color: color,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tier option card.
class _TierOptionCard extends StatelessWidget {
  const _TierOptionCard({
    required this.tier,
    required this.isSelected,
    required this.onTap,
  });

  final _TierOption tier;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveColor = tier.color ?? theme.colorScheme.primary;
    final color = isSelected
        ? effectiveColor
        : theme.colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: isSelected
              ? effectiveColor.withValues(alpha: 0.1)
              : theme.colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          border: Border.all(
            color: isSelected ? effectiveColor : theme.colorScheme.outline,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(tier.icon, size: 28, color: color),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tier.label,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    tier.description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              _formatPrice(tier.priceMnt),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Payment instructions card.
class _PaymentInstructions extends StatelessWidget {
  const _PaymentInstructions({required this.tier});

  final _TierOption tier;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                size: 20,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Төлбөрийн заавар',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _InstructionStep(
            step: '1',
            text: 'Хаан банкны дансанд мөнгө шилжүүлнэ',
          ),
          const SizedBox(height: AppSpacing.sm),
          _InstructionStep(
            step: '2',
            text:
                'Гүйлгээний утга: TG-${tier.label.toUpperCase().substring(0, 3)}',
          ),
          const SizedBox(height: AppSpacing.sm),
          _InstructionStep(step: '3', text: 'Дүрсэн файлыг хавсаргана'),
          const SizedBox(height: AppSpacing.md),
          const Divider(),
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Данс:',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Text(
                '5109 1234 5678 9012',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Нэр:',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Text(
                'Тамга ХХК',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Дүн:',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Text(
                _formatPrice(tier.priceMnt),
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InstructionStep extends StatelessWidget {
  const _InstructionStep({required this.step, required this.text});

  final String step;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: theme.colorScheme.primary,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              step,
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: Text(text, style: theme.textTheme.bodyMedium)),
      ],
    );
  }
}

/// Upgrade prompt shown when boost gate denies access.
class _UpgradePromptSheet extends StatelessWidget {
  const _UpgradePromptSheet({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: AppSpacing.sheetPadding,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.cornerRadius),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Drag Handle ────────────────────────────────
          Container(
            width: 36,
            height: 5,
            margin: const EdgeInsets.only(bottom: AppSpacing.lg),
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
            ),
          ),

          Icon(Icons.lock_outline, size: 48, color: theme.colorScheme.primary),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Зар сурталчилгаа нэмэх',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            reason,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                // TODO: Navigate to subscription upgrade screen
                Navigator.of(context).pop();
              },
              child: const Text('Pro захиалгаар нэмэх'),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Цуцлах'),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
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
