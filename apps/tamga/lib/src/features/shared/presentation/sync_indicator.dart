import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import '../../profile/application/cloud_sync_coordinator.dart';
import '../application/sync_providers.dart';

/// Синк төлөвийн жижиг өнгөт цэг (SyncIndicator).
///
/// AppBar эсвэл header хэсэгд байршиж, sync-ийн төлвийг
/// нүдээр харгалзах боломж олгоно:
/// - **Улаан** (`conflictCount > 0`): Зөрчилдөөн байна — товших нь ConflictResolutionScreen-рүү шилжинэ
/// - **Ногоон** (`synced` + pendingCount == 0): Бүх өгөгдөл синк хийгдсэн
/// - **Шар** (`pendingCount > 0`): Синк хүлээгдэж буй item-үүд байна
/// - **Шар** (`syncing`): Синхрончлол явагдаж байна
/// - **Улаан** (`error`): Синк амжилтгүй болсон
/// - **Саарал** (`idle`): Sync идэвхгүй байна
class SyncIndicator extends ConsumerWidget {
  const SyncIndicator({super.key, this.size = 10, this.onTap});

  /// Цэгийн хэмжээ (10px default).
  final double size;

  /// Нэмэлт товшилтын callback. [null] бол default — зөрчилдөөнтэй үед
  /// ConflictResolutionScreen-рүү шилжинэ.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncStateProvider);
    final l10n = _SafeLocalizations(context);

    final Color dotColor;
    final String tooltip;
    final bool hasConflicts = syncState.conflictCount > 0;

    if (hasConflicts) {
      dotColor = Colors.red;
      tooltip = l10n.syncConflictCount(syncState.conflictCount);
    } else if (syncState.status == SyncStatus.error) {
      dotColor = Colors.red;
      tooltip = l10n.syncError(syncState.errorMessage);
    } else if (syncState.pendingCount > 0) {
      dotColor = Colors.amber;
      tooltip = l10n.syncPendingCount(syncState.pendingCount);
    } else if (syncState.status == SyncStatus.syncing) {
      dotColor = Colors.amber;
      tooltip = l10n.syncInProgress();
    } else if (syncState.status == SyncStatus.synced) {
      dotColor = Colors.green;
      tooltip = l10n.syncSynced();
    } else {
      dotColor = Colors.grey;
      tooltip = l10n.syncInactive();
    }

    return GestureDetector(
      onTap:
          onTap ?? (hasConflicts ? () => _navigateToConflicts(context) : null),
      child: Tooltip(
        message: tooltip,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: dotColor,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: dotColor.withValues(alpha: 0.4),
                blurRadius: 3,
                spreadRadius: 1,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToConflicts(BuildContext context) {
    context.push('/profile/sync-conflicts');
  }
}

/// Null-safe wrapper for AppLocalizations that falls back to English strings
/// when [AppLocalizations.of(context)] is null (e.g. in tests).
class _SafeLocalizations {
  _SafeLocalizations(this._context);

  final BuildContext _context;

  String syncConflictCount(int count) {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.syncConflictCount(count);
    return '$count conflict(s)';
  }

  String syncError(String? message) {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.syncError;
    return message ?? 'Sync error';
  }

  String syncPendingCount(int count) {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.syncPendingCount(count);
    return '$count pending';
  }

  String syncInProgress() {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.syncInProgress;
    return 'Syncing...';
  }

  String syncSynced() {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.syncSynced;
    return 'Synced';
  }

  String syncInactive() {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.syncInactive;
    return 'Sync inactive';
  }
}
