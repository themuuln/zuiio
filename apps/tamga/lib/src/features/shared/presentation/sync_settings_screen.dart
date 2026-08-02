import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../profile/application/cloud_sync_coordinator.dart';
import '../../profile/application/profile_providers.dart';
import '../../profile/domain/profile_settings.dart';
import '../application/sync_extensions.dart';
import '../application/sync_providers.dart';
import 'sync_indicator.dart';

/// Синхрончлолын тохиргооны дэлгэц.
///
/// Profile tab-аас нэвтрэх боломжтой (Sync Queue-ийн хажууд).
///
/// Оролцуулсан:
/// - Auto-sync toggle (тохиргоог ProfileSettings-д хадгална)
/// - Sync Now товч (coordinator.syncAll() дуудана)
/// - Clear sync queue товч (зөвхөн синк дарааллыг цэвэрлэнэ)
class SyncSettingsScreen extends ConsumerWidget {
  const SyncSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final syncState = ref.watch(syncStateProvider);
    final settingsAsync = ref.watch(profileSettingsProvider);
    final connectionMonitor = ref.watch(connectionMonitorProvider);
    final isOffline = connectionMonitor.current == ConnectionStatus.offline;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Синк тохиргоо'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: TamgaSpacing.md),
            child: SyncIndicator(size: 12),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        children: [
          // ── Sync Status Card ──
          _SyncStatusCard(
            syncState: syncState,
            theme: theme,
            isOffline: isOffline,
          ),

          const SizedBox(height: TamgaSpacing.xxl),

          // ── Auto-sync Toggle ──
          settingsAsync.when(
            data: (settings) => TamgaCard(
              padding: EdgeInsets.zero,
              child: SwitchListTile(
                contentPadding: TamgaSpacing.listCellPadding,
                title: const Text('Авто синк'),
                subtitle: Text(
                  settings.autoSyncEnabled
                      ? 'Сүлжээнд холбогдсон үед автоматаар синк хийх'
                      : 'Автомат синк унтарсан',
                ),
                value: settings.autoSyncEnabled,
                onChanged: (newVal) => _toggleAutoSync(ref, settings, newVal),
              ),
            ),
            loading: () => const TamgaCard(
              padding: EdgeInsets.zero,
              child: ListTile(
                contentPadding: TamgaSpacing.listCellPadding,
                leading: LoadingIndicator(size: 24),
                title: Text('Ачаалж байна...'),
              ),
            ),
            error: (err, _) => TamgaCard(
              padding: EdgeInsets.zero,
              child: ListTile(
                contentPadding: TamgaSpacing.listCellPadding,
                leading: const Icon(Icons.error_outline),
                title: Text('Алдаа: $err'),
              ),
            ),
          ),

          const SizedBox(height: TamgaSpacing.lg),

          // ── Sync Now Button ──
          TamgaCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              contentPadding: TamgaSpacing.listCellPadding,
              leading: syncState.isSyncing
                  ? const LoadingIndicator(size: 24)
                  : const Icon(Icons.sync),
              title: const Text('Синк хийх'),
              subtitle: syncState.isSyncing
                  ? const Text('Синхрончлол явагдаж байна...')
                  : Text(
                      isOffline
                          ? 'Офлайн — синк хийх боломжгүй'
                          : 'Бүх өгөгдлийг синк хийх',
                    ),
              trailing: const Icon(Icons.chevron_right),
              enabled: !syncState.isSyncing,
              onTap: syncState.isSyncing
                  ? null
                  : () => _triggerSync(context, ref),
            ),
          ),

          const SizedBox(height: TamgaSpacing.lg),

          // ── Clear Sync Queue ──
          TamgaCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              contentPadding: TamgaSpacing.listCellPadding,
              leading: Icon(
                Icons.delete_sweep_outlined,
                color: theme.colorScheme.error,
              ),
              title: Text(
                'Синк дарааллыг цэвэрлэх',
                style: TamgaTypography.body(
                  weight: FontWeight.w600,
                  color: theme.colorScheme.error,
                ),
              ),
              subtitle: const Text(
                'Хүлээгдэж буй синк дараалал болон dead letter-уудыг устгана',
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _clearLocalData(context, ref),
            ),
          ),
        ],
      ),
    );
  }

  // ── Actions ───────────────────────────────────────────────────────

  Future<void> _toggleAutoSync(
    WidgetRef ref,
    ProfileSettings settings,
    bool newVal,
  ) async {
    HapticFeedback.lightImpact();
    final repo = await ref.read(profileSettingsRepositoryProvider.future);
    await repo.saveSettings(settings.copyWith(autoSyncEnabled: newVal));
    ref.invalidate(profileSettingsProvider);

    if (ref.context.mounted) {
      TamgaToast.show(
        ref.context,
        newVal ? 'Авто синк идэвхжсэн' : 'Авто синк унтарсан',
        icon: newVal ? Icons.sync : Icons.sync_disabled,
      );
    }
  }

  Future<void> _triggerSync(BuildContext context, WidgetRef ref) async {
    final coordinator = ref.read(cloudSyncCoordinatorProvider).valueOrNull;
    if (coordinator == null) {
      TamgaToast.showError(context, 'Синк эхлүүлэх боломжгүй байна');
      return;
    }

    await coordinator.syncAll();
    if (context.mounted) {
      TamgaToast.show(context, 'Синк эхэллээ', icon: Icons.sync);
    }
  }

  Future<void> _clearLocalData(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Синк дарааллыг цэвэрлэх?'),
        content: const Text(
          'Энэ нь хүлээгдэж буй синк дараалал болон '
          'dead letter-уудыг устгах болно. '
          'Өгөгдөл (морьд, эрүүл мэнд, уралдаан гэх мэт) '
          'хэвээр үлдэх болно. Энэ үйлдлийг буцаах боломжгүй.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Цэвэрлэх'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    // Clear local Isar data
    try {
      await ref.read(isarSyncStorageProvider).clearDeadLetter();
      await ref.read(isarSyncStorageProvider).clear();

      // Invalidate providers to reload
      ref.invalidate(profileSettingsProvider);
      ref.invalidate(pendingSyncItemsProvider);
      ref.invalidate(persistentDeadLetterItemsProvider);

      if (context.mounted) {
        TamgaToast.show(
          context,
          'Синк дараалал цэвэрлэгдлээ',
          icon: Icons.delete_sweep,
        );
      }
    } catch (e) {
      if (context.mounted) {
        TamgaToast.showError(context, 'Цэвэрлэхэд алдаа гарлаа: $e');
      }
    }
  }
}

// ── Sync Status Card ─────────────────────────────────────────────

/// Синк төлвийн мэдээлэл харуулах кард.
class _SyncStatusCard extends StatelessWidget {
  const _SyncStatusCard({
    required this.syncState,
    required this.theme,
    required this.isOffline,
  });

  final SyncState syncState;
  final ThemeData theme;
  final bool isOffline;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final Color statusColor;
    final IconData statusIcon;
    final String statusText;
    final String? statusSubtitle;

    if (isOffline) {
      statusColor = colors.error;
      statusIcon = Icons.cloud_off;
      statusText = 'Офлайн';
      statusSubtitle = 'Сүлжээнд холбогдсон үед синк хийгдэнэ';
    } else if (syncState.isSyncing) {
      statusColor = AppColors.warning;
      statusIcon = Icons.sync;
      statusText = 'Синк хийж байна...';
      statusSubtitle = null;
    } else if (syncState.hasError) {
      statusColor = colors.error;
      statusIcon = Icons.error_outline;
      statusText = 'Синк амжилтгүй';
      statusSubtitle = syncState.errorMessage;
    } else if (syncState.pendingCount > 0) {
      statusColor = AppColors.warning;
      statusIcon = Icons.sync_problem;
      statusText = 'Хүлээгдэж буй синк';
      statusSubtitle = '${syncState.pendingCount} item синк хүлээгдэж байна';
    } else {
      statusColor = AppColors.success;
      statusIcon = Icons.cloud_done;
      statusText = 'Синхрончлогдсон';
      statusSubtitle = null;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
              ),
              child: syncState.isSyncing
                  ? const Padding(
                      padding: EdgeInsets.all(TamgaSpacing.sm),
                      child: LoadingIndicator(size: 22),
                    )
                  : Icon(statusIcon, color: statusColor, size: 22),
            ),
            const SizedBox(width: TamgaSpacing.md),
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
                  if (statusSubtitle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        statusSubtitle,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  if (syncState.lastSyncTime != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        'Сүүлд синк хийсэн: ${_formatLastSyncTime(syncState.lastSyncTime!)}',
                        style: TamgaTypography.caption2(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
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
