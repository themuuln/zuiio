import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
    // Select only the fields this widget renders — avoids rebuilding on
    // lastSyncTime/pushedCount/pulledCount changes after every sync.
    final syncState = ref.watch(
      syncStateProvider.select(
        (s) => (s.status, s.conflictCount, s.pendingCount, s.errorMessage),
      ),
    );

    final Color dotColor;
    final String tooltip;
    final hasConflicts = syncState.$2 > 0;

    if (hasConflicts) {
      dotColor = Colors.red;
      tooltip = '${syncState.$2} зөрчилдөөн байна';
    } else if (syncState.$1 == SyncStatus.error) {
      dotColor = Colors.red;
      tooltip = syncState.$4 ?? 'Синхрончлолд алдаа гарлаа';
    } else if (syncState.$3 > 0) {
      dotColor = Colors.amber;
      tooltip = '${syncState.$3} синк хүлээгдэж байна';
    } else if (syncState.$1 == SyncStatus.syncing) {
      dotColor = Colors.amber;
      tooltip = 'Синхрончлол явагдаж байна...';
    } else if (syncState.$1 == SyncStatus.synced) {
      dotColor = Colors.green;
      tooltip = 'Синхрончлогдсон';
    } else {
      dotColor = Colors.grey;
      tooltip = 'Синхрончлол идэвхгүй';
    }

    return GestureDetector(
      onTap:
          onTap ?? (hasConflicts ? () => _navigateToConflicts(context) : null),
      child: Semantics(
        label: tooltip,
        button: hasConflicts || onTap != null,
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
      ),
    );
  }

  void _navigateToConflicts(BuildContext context) {
    context.push('/profile/sync-conflicts');
  }
}
