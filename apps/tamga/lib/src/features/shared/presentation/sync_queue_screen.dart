import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../profile/application/cloud_sync_coordinator.dart';
import '../application/sync_extensions.dart';
import '../application/sync_providers.dart';
import 'sync_indicator.dart';

/// Синк дараалал (Sync Queue) дэлгэц.
///
/// Profile tab-аас нэвтрэх боломжтой. Дараах мэдээллийг харуулна:
/// - Хүлээгдэж буй item-үүдийн тоо
/// - Хүлээгдэж буй item-үүдийн жагсаалт (entity төрөл, үйлдэл, огноо)
/// - Dead letter item-үүд (дахин оролдох товчтой)
/// - Dead letter-г хоослох товч
/// - "Синхрончлох" товч
class SyncQueueScreen extends ConsumerWidget {
  const SyncQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final syncState = ref.watch(syncStateProvider);
    final pendingItemsAsync = ref.watch(pendingSyncItemsProvider);
    final deadLetterItemsAsync = ref.watch(persistentDeadLetterItemsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Синк дараалал'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.xs),
            child: SyncIndicator(size: 12),
          ),
          // ── Sync Now button ──
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: syncState.isSyncing
                ? const Padding(
                    padding: EdgeInsets.all(AppSpacing.md),
                    child: LoadingIndicator(size: 20),
                  )
                : TextButton.icon(
                    onPressed: () => _triggerSync(ref),
                    icon: const Icon(Icons.sync, size: 18),
                    label: const Text('Синхрончлох'),
                  ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _refresh(ref),
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Sync Status Card ──
            _SyncStatusCard(syncState: syncState),

            const SizedBox(height: AppSpacing.lg),

            // ── Pending Items Section ──
            Text(
              'Хүлээгдэж буй синк',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            pendingItemsAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return _EmptySection(
                    icon: Icons.check_circle_outline,
                    message: 'Хүлээгдэж буй синк байхгүй',
                    subtitle: 'Бүх өгөгдөл синк хийгдсэн',
                  );
                }
                return _PendingItemsList(items: items);
              },
              loading: () => const _LoadingState(),
              error: (err, _) => _ErrorState(
                message: 'Ачаалахад алдаа гарлаа: $err',
                onRetry: () => ref.invalidate(pendingSyncItemsProvider),
              ),
            ),

            const SizedBox(height: AppSpacing.xxl),

            // ── Dead Letter Items Section ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Амжилтгүй синк',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _clearDeadLetter(ref),
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text('Бүгдийг устгах'),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.error,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            deadLetterItemsAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return const _EmptySection(
                    icon: Icons.cloud_done_outlined,
                    message: 'Амжилтгүй синк байхгүй',
                    subtitle: 'Dead letter queue хоосон',
                  );
                }
                return _DeadLetterItemsList(items: items);
              },
              loading: () => const _LoadingState(),
              error: (err, _) => _ErrorState(
                message: 'Ачаалахад алдаа гарлаа: $err',
                onRetry: () =>
                    ref.invalidate(persistentDeadLetterItemsProvider),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _triggerSync(WidgetRef ref) async {
    final coordinator = ref.read(cloudSyncCoordinatorProvider).valueOrNull;
    if (coordinator == null) return;
    await coordinator.syncAll();
    ref.invalidate(pendingSyncItemsProvider);
  }

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(pendingSyncItemsProvider);
    ref.invalidate(persistentDeadLetterItemsProvider);
    // Wait for providers to settle
    await Future.delayed(const Duration(milliseconds: 100));
  }

  Future<void> _clearDeadLetter(WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: ref.context,
      builder: (ctx) => AlertDialog(
        title: const Text('Амжилтгүй синк-уудыг устгах?'),
        content: const Text(
          'Бүх амжилтгүй синк дарааллыг устгахдаа итгэлтэй байна уу? '
          'Эдгээр item-үүдийг дахин синк хийх боломжгүй болно.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Устгах'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final storage = ref.read(isarSyncStorageProvider);
    await clearDeadLetterQueue(storage);
    // Also clear coordinator's in-memory dead letter items
    final coordinator = ref.read(cloudSyncCoordinatorProvider).valueOrNull;
    coordinator?.clearDeadLetter();

    ref.invalidate(pendingSyncItemsProvider);
    ref.invalidate(persistentDeadLetterItemsProvider);

    if (ref.context.mounted) {
      TamgaToast.show(
        ref.context,
        'Амжилтгүй синк-уудыг устгалаа',
        icon: Icons.delete_outline,
      );
    }
  }
}

// ── Sync Status Card ─────────────────────────────────────────────

/// Синк-ийн төлөв харуулах кард.
class _SyncStatusCard extends StatelessWidget {
  const _SyncStatusCard({required this.syncState});
  final SyncState syncState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSyncing = syncState.isSyncing;
    final hasError = syncState.hasError;
    final pendingCount = syncState.pendingCount;

    // Төлөвөөс хамаарч өнгө, icon, текст сонгох
    final Color statusColor;
    final IconData statusIcon;
    final String statusText;

    if (isSyncing) {
      statusColor = TamgaColors.of(context).primary;
      statusIcon = Icons.sync;
      statusText = 'Синк хийж байна...';
    } else if (hasError) {
      statusColor = theme.colorScheme.error;
      statusIcon = Icons.error_outline;
      statusText = 'Синк амжилтгүй';
    } else if (pendingCount > 0) {
      statusColor = AppColors.warning;
      statusIcon = Icons.sync_problem;
      statusText = 'Хүлээгдэж буй синк: $pendingCount';
    } else {
      statusColor = AppColors.success;
      statusIcon = Icons.cloud_done;
      statusText = 'Синк хийгдсэн';
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
              ),
              child: isSyncing
                  ? Padding(
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      child: LoadingIndicator(size: 22, color: statusColor),
                    )
                  : Icon(statusIcon, color: statusColor, size: 22),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    statusText,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (syncState.lastSyncTime != null)
                    Text(
                      'Сүүлд синк хийсэн: ${_formatLastSyncTime(syncState.lastSyncTime!)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatLastSyncTime(DateTime lastSyncTime) {
    final now = DateTime.now();
    final diff = now.difference(lastSyncTime);

    if (diff.inMinutes < 1) return 'саяхан';
    if (diff.inHours < 1) return '${diff.inMinutes} минутын өмнө';
    if (diff.inDays < 1) return '${diff.inHours} цагийн өмнө';
    return '${diff.inDays} хоногийн өмнө';
  }
}

// ── Pending Items List ──────────────────────────────────────────

/// Хүлээгдэж буй синк item-үүдийн жагсаалт.
class _PendingItemsList extends StatelessWidget {
  const _PendingItemsList({required this.items});
  final List<SyncQueueItem> items;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        // Section header with count
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: Row(
            children: [
              Text(
                '${items.length} item',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: _SyncItemCard(item: item),
          ),
        ),
      ],
    );
  }
}

// ── Dead Letter Items List ──────────────────────────────────────

/// Амжилтгүй синк item-үүдийн жагсаалт (retry товчтой).
class _DeadLetterItemsList extends StatelessWidget {
  const _DeadLetterItemsList({required this.items});
  final List<SyncQueueItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: items
          .map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _DeadLetterItemCard(item: item),
            ),
          )
          .toList(),
    );
  }
}

// ── Sync Item Card ──────────────────────────────────────────────

/// Нэг синк item-ийн мэдээлэл харуулах кард.
class _SyncItemCard extends ConsumerWidget {
  const _SyncItemCard({required this.item});
  final SyncQueueItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final actionLabel = _actionLabel(item.action);
    final entityLabel = _entityTypeLabel(item.entityType);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            // Entity type icon
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadiusSmall,
                ),
              ),
              child: Icon(
                _entityIcon(item.entityType),
                size: 18,
                color: theme.colorScheme.onPrimaryContainer,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entityLabel,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      _ActionChip(label: actionLabel, action: item.action),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _formatTimestamp(item.timestamp),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _actionLabel(SyncAction action) {
    return switch (action) {
      SyncAction.create => 'Үүсгэх',
      SyncAction.update => 'Шинэчлэх',
      SyncAction.delete => 'Устгах',
    };
  }

  String _entityTypeLabel(String type) {
    return switch (type) {
      'horse' => 'Морь',
      'health' => 'Эрүүл мэнд',
      'event' => 'Уралдаан',
      'market' => 'Зар',
      'breeding' => 'Үржүүлэг',
      'co_ownership' => 'Хамтран эзэмших',
      'document' => 'Баримт',
      'certificate' => 'Гэрчилгээ',
      'payment' => 'Төлбөр',
      'lost_horse_report' => 'Морь төөрсөн',
      'search_area' => 'Хайлтын бүс',
      'horse_location' => 'Морьны байршил',
      'geofence_alert' => 'Гео хашаа',
      'lineage' => 'Удам',
      _ => type,
    };
  }

  IconData _entityIcon(String type) {
    return switch (type) {
      'horse' => Icons.pets,
      'health' => Icons.favorite_outline,
      'event' => Icons.emoji_events_outlined,
      'market' => Icons.shopping_cart_outlined,
      'breeding' => Icons.biotech_outlined,
      'co_ownership' => Icons.people_outline,
      'document' => Icons.description_outlined,
      'certificate' => Icons.verified_outlined,
      'payment' => Icons.payments_outlined,
      'lost_horse_report' => Icons.search_off,
      'search_area' => Icons.near_me_outlined,
      'horse_location' => Icons.location_on_outlined,
      'geofence_alert' => Icons.notifications_outlined,
      'lineage' => Icons.account_tree_outlined,
      _ => Icons.sync,
    };
  }

  String _formatTimestamp(DateTime ts) {
    final now = DateTime.now();
    final diff = now.difference(ts);
    if (diff.inMinutes < 1) return 'саяхан';
    if (diff.inHours < 1) return '${diff.inMinutes} мин өмнө';
    if (diff.inDays < 1) return '${diff.inHours} цаг өмнө';
    return '${diff.inDays} өдөр өмнө';
  }
}

// ── Dead Letter Item Card ───────────────────────────────────────

/// Dead letter item-ийн кард (retry товчтой).
class _DeadLetterItemCard extends ConsumerWidget {
  const _DeadLetterItemCard({required this.item});
  final SyncQueueItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Card(
      color: theme.colorScheme.errorContainer.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadiusSmall,
                ),
              ),
              child: Icon(
                Icons.error_outline,
                size: 18,
                color: theme.colorScheme.onErrorContainer,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _entityTypeLabel(item.entityType),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      _ActionChip(
                        label: _actionLabel(item.action),
                        action: item.action,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        _formatTimestamp(item.timestamp),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  if (item.retryCount > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: AppSpacing.xs),
                      child: Text(
                        'Оролдсон: ${item.retryCount} удаа',
                        style: TamgaTypography.caption2(
                          color: theme.colorScheme.onErrorContainer.withValues(
                            alpha: 0.7,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Retry button
            IconButton(
              onPressed: () => _retryItem(ref, item),
              icon: Icon(
                Icons.refresh,
                color: theme.colorScheme.onErrorContainer,
              ),
              tooltip: 'Дахин оролдох',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _retryItem(WidgetRef ref, SyncQueueItem item) async {
    final storage = ref.read(isarSyncStorageProvider);
    await retryDeadLetterItem(storage, item);

    ref.invalidate(pendingSyncItemsProvider);
    ref.invalidate(persistentDeadLetterItemsProvider);

    if (ref.context.mounted) {
      TamgaToast.show(
        ref.context,
        'Дахин синк дараалалд нэмлээ',
        icon: Icons.refresh,
      );
    }
  }

  String _actionLabel(SyncAction action) {
    return switch (action) {
      SyncAction.create => 'Үүсгэх',
      SyncAction.update => 'Шинэчлэх',
      SyncAction.delete => 'Устгах',
    };
  }

  String _entityTypeLabel(String type) {
    return switch (type) {
      'horse' => 'Морь',
      'health' => 'Эрүүл мэнд',
      'event' => 'Уралдаан',
      'market' => 'Зар',
      'breeding' => 'Үржүүлэг',
      'co_ownership' => 'Хамтран эзэмших',
      'document' => 'Баримт',
      'certificate' => 'Гэрчилгээ',
      'payment' => 'Төлбөр',
      'lost_horse_report' => 'Морь төөрсөн',
      'search_area' => 'Хайлтын бүс',
      'horse_location' => 'Морьны байршил',
      'geofence_alert' => 'Гео хашаа',
      'lineage' => 'Удам',
      _ => type,
    };
  }

  String _formatTimestamp(DateTime ts) {
    final now = DateTime.now();
    final diff = now.difference(ts);
    if (diff.inMinutes < 1) return 'саяхан';
    if (diff.inHours < 1) return '${diff.inMinutes} мин өмнө';
    if (diff.inDays < 1) return '${diff.inHours} цаг өмнө';
    return '${diff.inDays} өдөр өмнө';
  }
}

// ── Action Chip ─────────────────────────────────────────────────

/// Үйлдлийн төрлийг харуулах чип.
class _ActionChip extends StatelessWidget {
  const _ActionChip({required this.label, required this.action});
  final String label;
  final SyncAction action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final Color chipColor = switch (action) {
      SyncAction.create => AppColors.success,
      SyncAction.update => TamgaColors.of(context).primary,
      SyncAction.delete => theme.colorScheme.error,
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: chipColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        label,
        style: TamgaTypography.caption2(
          color: chipColor,
          weight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ── Empty Section ───────────────────────────────────────────────

/// Хоосон төлөвийн мэдэгдэл.
class _EmptySection extends StatelessWidget {
  const _EmptySection({
    required this.icon,
    required this.message,
    this.subtitle,
  });

  final IconData icon;
  final String message;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return InlineEmptyState(icon: icon, title: message, description: subtitle);
  }
}

// ── Loading State ───────────────────────────────────────────────

/// Ачаалж буй төлөв.
class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(AppSpacing.xxl),
      child: Center(child: LoadingIndicator(size: 24)),
    );
  }
}

// ── Error State ─────────────────────────────────────────────────

/// Алдааны төлөв (retry товчтой).
class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
      child: Column(
        children: [
          Icon(Icons.error_outline, size: 40, color: colors.error),
          const SizedBox(height: AppSpacing.sm),
          Text(
            message,
            style: TamgaTypography.body(color: colors.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.md),
          FilledButton.tonalIcon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Дахин оролдох'),
          ),
        ],
      ),
    );
  }
}
