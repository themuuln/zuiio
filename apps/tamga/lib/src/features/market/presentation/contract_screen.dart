import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/contract_providers.dart';
import '../domain/market_contract.dart';

// ══════════════════════════════════════════════════════════════════
// Гэрээний дэлгэц / Contract Screen
// ══════════════════════════════════════════════════════════════════

/// Худалдааны гэрээг харуулах дэлгэц.
class ContractScreen extends ConsumerWidget {
  const ContractScreen({required this.contract, super.key});

  final MarketContract contract;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Худалдааны гэрээ / Bill of Sale'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Хуваалцах',
            onPressed: () => _shareContract(context, ref),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: colors.primaryContainer,
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadius,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.description,
                    size: 48,
                    color: colors.onPrimaryContainer,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'ХУДАЛДААНЫ ГЭРЭЭ',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: colors.onPrimaryContainer,
                    ),
                  ),
                  Text(
                    'BILL OF SALE',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.onPrimaryContainer.withValues(alpha: 0.7),
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Contract Info ───────────────────────────────
            _InfoRow(
              label: 'Гэрээний дугаар',
              value: contract.id.substring(0, 8).toUpperCase(),
            ),
            _InfoRow(
              label: 'Огноо / Date',
              value: contract.formattedDate,
            ),

            const Divider(height: AppSpacing.xxl),

            // ── Section: Мэдээлэл ─────────────────────────
            _SectionHeader(title: 'Мэдээлэл / Details'),
            const SizedBox(height: AppSpacing.md),
            _InfoRow(label: 'Морь / Horse', value: contract.horseName),
            if (contract.horseDescription != null &&
                contract.horseDescription!.isNotEmpty)
              Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.sm),
                child: Text(
                  contract.horseDescription!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ),

            const Divider(height: AppSpacing.xxl),

            // ── Section: Талууд ────────────────────────────
            _SectionHeader(title: 'Талууд / Parties'),
            const SizedBox(height: AppSpacing.md),
            _InfoRow(
              label: 'Худалдагч / Seller',
              value: contract.sellerName,
              icon: Icons.storefront_outlined,
            ),
            _InfoRow(
              label: 'Худалдан авагч / Buyer',
              value: contract.buyerName,
              icon: Icons.person_outline,
            ),

            const Divider(height: AppSpacing.xxl),

            // ── Section: Үнэ ───────────────────────────────
            _SectionHeader(title: 'Үнэ / Price'),
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: colors.tertiaryContainer,
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadiusSmall,
                ),
              ),
              child: Text(
                contract.formattedPrice,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colors.onTertiaryContainer,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            const Divider(height: AppSpacing.xxl),

            // ── Section: Нөхцөлүүд ─────────────────────────
            _SectionHeader(title: 'Нөхцөлүүд / Terms & Conditions'),
            const SizedBox(height: AppSpacing.md),
            ...contract.terms.asMap().entries.map(
              (entry) => Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${entry.key + 1}.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        entry.value,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.xxl),

            // ── Footer ─────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: colors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadius,
                ),
              ),
              child: Column(
                children: [
                  Icon(Icons.verified, color: colors.primary, size: 32),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'ТАМГА ХХК-ийн үүсгэсэн',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  Text(
                    'Generated by Tamga LLC',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Гэрээний дугаар: ${contract.id.substring(0, 8).toUpperCase()}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colors.onSurfaceVariant,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // ── Share Button ───────────────────────────────
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () => _shareContract(context, ref),
                icon: const Icon(Icons.share),
                label: const Text('Хуваалцах / Share'),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Future<void> _shareContract(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final actions = ref.read(contractActionsProvider);
    await actions.shareContract(contract);

    if (context.mounted) {
      TamgaToast.show(context, 'Гэрээ хуваалцлаа.', icon: Icons.share);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Туслах Widget-ууд
// ══════════════════════════════════════════════════════════════════

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Text(
      title,
      style: theme.textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.bold,
        color: theme.colorScheme.primary,
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.icon,
  });

  final String label;
  final String value;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 20, color: theme.colorScheme.primary),
            const SizedBox(width: AppSpacing.sm),
          ],
          SizedBox(
            width: icon != null ? null : 140,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
