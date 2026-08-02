import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/moderation_providers.dart';
import '../domain/market_listing.dart';

/// Зарын модерацийн самбар — админууд мэдээлэгдсэн заруудыг
/// харж, батлах эсвэл татгалзах боломжтой.
///
/// Зөвхөн [FeatureFlag.moderationQueue] идэвхтэй үед хандах боломжтой.
class ModerationQueueScreen extends ConsumerStatefulWidget {
  const ModerationQueueScreen({super.key});

  @override
  ConsumerState<ModerationQueueScreen> createState() =>
      _ModerationQueueScreenState();
}

class _ModerationQueueScreenState extends ConsumerState<ModerationQueueScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final queueAsync = ref.watch(moderationQueueProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Зарын модераци'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(moderationQueueProvider),
          ),
        ],
      ),
      body: queueAsync.when(
        data: (reports) {
          if (reports.isEmpty) {
            return const EmptyState(
              icon: Icons.shield_outlined,
              title: 'Мэдээлэгдсэн зар байхгүй',
              description: 'Мэдээлэгдсэн зарууд энд харагдана',
            );
          }

          final pendingReports = reports.where((r) => !r.isResolved).toList();
          final resolvedReports = reports.where((r) => r.isResolved).toList();

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              if (pendingReports.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Text(
                    'Шийдвэрлэгдээгүй (${pendingReports.length})',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                ...pendingReports.map(
                  (report) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _ReportCard(
                      vm: report,
                      onApprove: () => _handleApprove(report),
                      onReject: () => _handleReject(report),
                    ),
                  ),
                ),
              ],
              if (resolvedReports.isNotEmpty) ...[
                Padding(
                  padding: EdgeInsets.only(
                    top: pendingReports.isNotEmpty ? AppSpacing.lg : 0,
                    bottom: AppSpacing.sm,
                  ),
                  child: Text(
                    'Шийдвэрлэгдсэн (${resolvedReports.length})',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                ...resolvedReports.map(
                  (report) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _ReportCard(
                      vm: report,
                      onApprove: null,
                      onReject: null,
                    ),
                  ),
                ),
              ],
            ],
          );
        },
        loading: () => SkeletonLoader(
          items: 4,
          itemBuilder: (ctx, i) => const _ReportCardSkeleton(),
        ),
        error: (err, _) => TamgaErrorWidget(
          message: 'Мэдээллийг ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(moderationQueueProvider),
        ),
      ),
    );
  }

  Future<void> _handleApprove(ModerationReportVm vm) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Зар батлах'),
        content: Text('"${vm.listing.title}" зарыг батлах уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Батлах'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    await approveReport(ref, vm.report.id, vm.listing.id);

    if (mounted) {
      TamgaToast.showSuccess(context, 'Зар батлагдлаа');
    }
  }

  Future<void> _handleReject(ModerationReportVm vm) async {
    final reasonController = TextEditingController();
    final theme = Theme.of(context);
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Зар татгалзах'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '"${vm.listing.title}" зарыг татгалзах шалтгаанаа оруулна уу.',
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Татгалзах шалтгаан',
                hintText: 'Шалтгаанаа бичнэ үү...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(null),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () {
              final text = reasonController.text.trim();
              if (text.isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Шалтгаан оруулна уу')),
                );
                return;
              }
              Navigator.of(ctx).pop(text);
            },
            style: FilledButton.styleFrom(
              backgroundColor: theme.colorScheme.error,
            ),
            child: const Text('Татгалзах'),
          ),
        ],
      ),
    );

    if (reason == null || !mounted) return;

    await rejectReport(ref, vm.report.id, vm.listing.id, reason);

    // Notify seller via notification
    if (mounted) {
      TamgaToast.show(
        context,
        'Зар татгалзлаа. Борлуулагчид мэдэгдэл илгээлээ.',
        icon: Icons.check_circle_outline,
      );
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Report Card
// ══════════════════════════════════════════════════════════════════

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.vm, this.onApprove, this.onReject});

  final ModerationReportVm vm;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final report = vm.report;
    final listing = vm.listing;

    return Card(
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Listing Preview ────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLow,
              border: Border(
                bottom: BorderSide(color: theme.dividerColor, width: 0.5),
              ),
            ),
            child: Row(
              children: [
                // Thumbnail placeholder
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusSmall,
                    ),
                  ),
                  child: Icon(
                    Icons.pets,
                    size: 24,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        listing.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_formatPrice(listing.priceAmount)} • ${listing.locationLabel}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                _StatusBadge(status: listing.status),
              ],
            ),
          ),

          // ── Report Details ─────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Report reason
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.flag_outlined,
                      size: 16,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        report.reason,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),

                // Reporter info
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Мэдээлэгч: ${_truncateId(report.reporterId)}',
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
                      _formatDate(report.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),

                // Resolved badge
                if (vm.isResolved) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.tertiaryContainer,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadiusPill,
                      ),
                    ),
                    child: Text(
                      'Шийдвэрлэгдсэн',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onTertiaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],

                // ── Action buttons ──────────────────────────
                if (!vm.isResolved &&
                    onApprove != null &&
                    onReject != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onApprove,
                          icon: const Icon(
                            Icons.check_circle_outline,
                            size: 18,
                          ),
                          label: const Text('Батлах'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: theme.colorScheme.tertiary,
                            side: BorderSide(color: theme.colorScheme.tertiary),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: onReject,
                          icon: const Icon(Icons.cancel_outlined, size: 18),
                          label: const Text('Татгалзах'),
                          style: FilledButton.styleFrom(
                            backgroundColor: theme.colorScheme.error,
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
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Skeleton for loading state
// ══════════════════════════════════════════════════════════════════

class _ReportCardSkeleton extends StatelessWidget {
  const _ReportCardSkeleton();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusSmall,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 150,
                        height: 14,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Container(
                        width: 100,
                        height: 12,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              height: 12,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 36,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Container(
                    height: 36,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
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

// ══════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

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
      padding: EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 10,
        ),
      ),
    );
  }
}

String _formatPrice(int value) {
  return '${value.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',')} MNT';
}

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

String _truncateId(String id) {
  if (id.length <= 12) return id;
  return '${id.substring(0, 8)}...';
}
