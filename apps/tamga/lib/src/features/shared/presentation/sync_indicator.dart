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
    final syncState = ref.watch(syncStateProvider);

    final Color dotColor;
    final String tooltip;
    final bool hasConflicts = syncState.conflictCount > 0;

    if (hasConflicts) {
      dotColor = Colors.red;
      tooltip = '${syncState.conflictCount} зөрчилдөөн байна';
    } else if (syncState.status == SyncStatus.error) {
      dotColor = Colors.red;
      tooltip = syncState.errorMessage ?? 'Синхрончлолд алдаа гарлаа';
    } else if (syncState.pendingCount > 0) {
      dotColor = Colors.amber;
      tooltip = '${syncState.pendingCount} синк хүлээгдэж байна';
    } else if (syncState.status == SyncStatus.syncing) {
      dotColor = Colors.amber;
      tooltip = 'Синхрончлол явагдаж байна...';
    } else if (syncState.status == SyncStatus.synced) {
      dotColor = Colors.green;
      tooltip = 'Синхрончлогдсон';
    } else {
      dotColor = Colors.grey;
      tooltip = 'Синхрончлол идэвхгүй';
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
