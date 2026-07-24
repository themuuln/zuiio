import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/features/subscription_gate_providers.dart';
import '../domain/payment_request.dart';
import '../domain/subscription_state.dart';

/// Захиалгын удирдлагын хуудас.
///
/// Одоогийн түвшин, хугацаа, түвшин шинэчлэх сонголтуудыг харуулна.
class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(subscriptionStateProvider);
    final userId = currentSupabaseUserId();

    return Scaffold(
      appBar: AppBar(title: const Text('Захиалга')),
      body: userId == null
          ? const _NotAuthenticatedView()
          : CustomScrollView(
              slivers: [
                // ── Current Status Card ────────────────────────
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.lg,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: _CurrentStatusCard(state: state),
                  ),
                ),

                // ── Expiry Warning Banner ──────────────────────
                if (state.isPaidTier && state.showsExpiryWarning)
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                    ),
                    sliver: SliverToBoxAdapter(
                      child: _ExpiryWarningBanner(state: state),
                    ),
                  ),

                // ── Tier Comparison ───────────────────────────
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.xxl,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: Text(
                      'Түвшин сонгох',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    0,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  sliver: SliverList.separated(
                    itemCount: _upgradeableTiers.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: AppSpacing.md),
                    itemBuilder: (context, index) {
                      final tier = _upgradeableTiers[index];
                      final isCurrentOrLower =
                          tier.index <= state.currentTier.index;
                      return _TierOptionCard(
                        tier: tier,
                        isActive: tier == state.currentTier,
                        isCurrentOrLower: isCurrentOrLower,
                      );
                    },
                  ),
                ),

                // ── Feature Comparison Table ──────────────────
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.xxl,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: Text(
                      'Боломжуудын харьцуулалт',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    0,
                    AppSpacing.lg,
                    AppSpacing.xxxl,
                  ),
                  sliver: const SliverToBoxAdapter(
                    child: _FeatureComparisonTable(),
                  ),
                ),
              ],
            ),
    );
  }
}

// ── Upgradeable Tiers ──────────────────────────────────────────────

const _upgradeableTiers = [
  SubscriptionTier.pro,
  SubscriptionTier.breeder,
  SubscriptionTier.stable,
];

// ── Current Status Card ────────────────────────────────────────────

class _CurrentStatusCard extends StatelessWidget {
  const _CurrentStatusCard({required this.state});

  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _tierIcon(state.currentTier),
                  color: _tierColor(state.currentTier),
                  size: 28,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        state.currentTier.displayName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        state.statusMessage,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (state.isPaidTier && state.expiresAt != null) ...[
              const SizedBox(height: AppSpacing.md),
              const Divider(),
              const SizedBox(height: AppSpacing.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Дуусах хугацаа',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  Text(
                    _formatDate(state.expiresAt!),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              if (state.daysRemaining > 0) ...[
                const SizedBox(height: AppSpacing.sm),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Үлдсэн хоног',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: state.daysRemaining <= 7
                            ? colorScheme.errorContainer
                            : colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.cornerRadiusPill,
                        ),
                      ),
                      child: Text(
                        '${state.daysRemaining} хоног',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: state.daysRemaining <= 7
                              ? colorScheme.onErrorContainer
                              : colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

// ── Expiry Warning Banner ──────────────────────────────────────────

class _ExpiryWarningBanner extends StatelessWidget {
  const _ExpiryWarningBanner({required this.state});

  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final isGracePeriod = state.isGracePeriod;
    final bgColor = isGracePeriod
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final textColor = isGracePeriod
        ? colorScheme.onErrorContainer
        : colorScheme.onTertiaryContainer;
    final icon = isGracePeriod ? Icons.warning : Icons.schedule;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Row(
        children: [
          Icon(icon, color: textColor, size: 20),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isGracePeriod
                      ? 'Grace period'
                      : 'Захиалга дуусахад ойрхон байна',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  state.statusMessage,
                  style: theme.textTheme.bodySmall?.copyWith(color: textColor),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tier Option Card ───────────────────────────────────────────────

class _TierOptionCard extends StatelessWidget {
  const _TierOptionCard({
    required this.tier,
    required this.isActive,
    required this.isCurrentOrLower,
  });

  final SubscriptionTier tier;
  final bool isActive;
  final bool isCurrentOrLower;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final limits = kTierLimits[tier]!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_tierIcon(tier), color: _tierColor(tier), size: 24),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    tier.displayName,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadiusPill,
                      ),
                    ),
                    child: Text(
                      'Одоогийн',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                else
                  Text(
                    tier.formattedPrice,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: colorScheme.primary,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            // Key features as chips
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                _FeatureChip(
                  label: limits.maxHorses == null
                      ? 'Хязгааргүй морь'
                      : '${limits.maxHorses} морь',
                  available: true,
                ),
                _FeatureChip(
                  available: true,
                  label: '${limits.storageLabel} хадгалах зай',
                ),
                if (limits.hasInbreedingCalc)
                  const _FeatureChip(
                    label: 'Цус ойртолтын тооцоолуур',
                    available: true,
                  ),
                if (limits.hasBreedingTools)
                  const _FeatureChip(
                    label: 'Үржүүлэлтийн хэрэгсэл',
                    available: true,
                  ),
                if (limits.maxMultiUsers != null && limits.maxMultiUsers! > 1)
                  _FeatureChip(
                    label: '${limits.maxMultiUsers} хэрэглэгч',
                    available: true,
                  ),
                if (limits.hasClientPortal)
                  const _FeatureChip(label: 'Захын portal', available: true),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            if (!isCurrentOrLower && !isActive)
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => _navigateToPayment(context, tier),
                  child: Text('${tier.formattedPrice}-аар захиалах'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _navigateToPayment(BuildContext context, SubscriptionTier tier) {
    Navigator.of(context).pop(tier);
  }
}

// ── Feature Comparison Table ────────────────────────────────────────

class _FeatureComparisonTable extends StatelessWidget {
  const _FeatureComparisonTable();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: AppSpacing.lg,
          headingRowHeight: 40,
          dataRowMinHeight: 44,
          dataRowMaxHeight: 44,
          columns: const [
            DataColumn(label: Text('Боломж')),
            DataColumn(label: Text('Free')),
            DataColumn(label: Text('Pro')),
            DataColumn(label: Text('Breeder')),
            DataColumn(label: Text('Stable')),
          ],
          rows: [
            _featureRow('Морь', '1', '∞', '∞', '∞'),
            _featureRow('Хадгалах зай', '50 MB', '5 GB', '20 GB', '50 GB'),
            _featureRow('Удам мод', '3 үе', '5 үе', 'Бүгд', 'Бүгд'),
            _featureRow('Цус ойртолт', '—', '✓', '✓', '✓'),
            _featureRow('Үржүүлэлт', '—', '—', '✓', '✓'),
            _featureRow('Хэрэглэгч', '1', '1', '1', '10'),
            _featureRow('Захын portal', '—', '—', '—', '✓'),
            _featureRow('Сурталчилгаа', '—', '✓', '✓', '✓'),
          ],
        ),
      ),
    );
  }

  DataRow _featureRow(
    String feature,
    String free,
    String pro,
    String breeder,
    String stable,
  ) {
    return DataRow(
      cells: [
        DataCell(Text(feature, style: const TextStyle(fontSize: 13))),
        DataCell(_cellValue(free)),
        DataCell(_cellValue(pro)),
        DataCell(_cellValue(breeder)),
        DataCell(_cellValue(stable)),
      ],
    );
  }

  Widget _cellValue(String value) {
    if (value == '✓') {
      return const Icon(Icons.check_circle, size: 16, color: Colors.green);
    }
    if (value == '—') {
      return Icon(Icons.remove, size: 16, color: Colors.grey.shade400);
    }
    return Text(value, style: const TextStyle(fontSize: 13));
  }
}

// ── Not Authenticated View ─────────────────────────────────────────

class _NotAuthenticatedView extends StatelessWidget {
  const _NotAuthenticatedView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.person_outline,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Нэвтэрч орно уу',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Захиалгын мэдээллийг харахын тулд нэвтэрч орно уу.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────

IconData _tierIcon(SubscriptionTier tier) => switch (tier) {
  SubscriptionTier.free => Icons.person_outline,
  SubscriptionTier.pro => Icons.star_outline,
  SubscriptionTier.breeder => Icons.pets,
  SubscriptionTier.stable => Icons.foundation,
};

Color _tierColor(SubscriptionTier tier) => switch (tier) {
  SubscriptionTier.free => Colors.grey,
  SubscriptionTier.pro => const Color(0xFF2196F3),
  SubscriptionTier.breeder => const Color(0xFF4CAF50),
  SubscriptionTier.stable => const Color(0xFFFF9800),
};

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';
}

// ── Feature Chip ───────────────────────────────────────────────────

class _FeatureChip extends StatelessWidget {
  const _FeatureChip({required this.label, required this.available});

  final String label;
  final bool available;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: available
            ? colorScheme.surfaceContainerHighest
            : colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: available
              ? colorScheme.onSurface
              : colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
