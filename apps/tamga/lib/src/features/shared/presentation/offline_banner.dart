import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/connection_status.dart';
import '../../../core/theme/design_tokens.dart';
import '../application/sync_providers.dart';

/// Офлайн төлөвийн дэлхийн мэдэгдэхүй баннер.
///
/// AppShell-ийн overlay хэсэгд байршиж, сүлжээ тасарсан үед
/// хэрэглэгчид мэдэгдэх ба Online болсон үед 5 секундын дараа алга болно.
///
/// Баннер дээр offline icon, "Offline — Локал өгөгдөл харуулж байна",
/// болон сүүлд синк хийсэн цагийг харуулна.
class OfflineBanner extends ConsumerStatefulWidget {
  const OfflineBanner({super.key, this.connectionMonitor});

  /// Тестэд зориулсан dependency injection — сул бол `ConnectionMonitor.instance` ашиглана.
  final ConnectionMonitor? connectionMonitor;

  @override
  ConsumerState<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends ConsumerState<OfflineBanner> {
  ConnectionMonitor get _monitor =>
      widget.connectionMonitor ?? ConnectionMonitor.instance;

  bool _isOffline = false;
  bool _buildScheduled = false;
  StreamSubscription<ConnectionStatus>? _subscription;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    _isOffline = _monitor.current == ConnectionStatus.offline;
    _subscription = _monitor.status.listen(_onStatusChanged);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _hideTimer?.cancel();
    super.dispose();
  }

  void _onStatusChanged(ConnectionStatus status) {
    if (!mounted) return;

    _hideTimer?.cancel();

    if (_buildScheduled) return;
    _buildScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _buildScheduled = false;
      if (!mounted) return;

      if (status == ConnectionStatus.offline) {
        setState(() => _isOffline = true);
      } else {
        // Онлайн болсон — 5 секундийн дараа баннер алга болно
        _hideTimer = Timer(const Duration(seconds: 5), () {
          if (mounted) setState(() => _isOffline = false);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isOffline) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final colors = TamgaColors.of(context);
    final syncState = ref.watch(syncStateProvider);

    return Material(
      elevation: 4,
      color: colors.surface,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: TamgaSpacing.lg,
          vertical: TamgaSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: colors.primary.withValues(alpha: 0.1),
          border: Border(
            bottom: BorderSide(color: colors.primary.withValues(alpha: 0.3)),
          ),
        ),
        child: Row(
          children: [
            Icon(Icons.cloud_off, size: 18, color: colors.primary),
            const SizedBox(width: TamgaSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Offline — Локал өгөгдөл харуулж байна',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (syncState.lastSyncTime != null)
                    Text(
                      _formatLastSyncTime(syncState.lastSyncTime!),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.primary.withValues(alpha: 0.8),
                        fontSize: 11,
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

  /// Сүүлд синк хийсэн цагийг харьцангуйгаар харуулах.
  ///
  /// Жишээ нь: "Сүүлд синк хийсэн: 5 минутын өмнө"
  String _formatLastSyncTime(DateTime lastSyncTime) {
    final now = DateTime.now();
    final diff = now.difference(lastSyncTime);

    if (diff.inMinutes < 1) {
      return 'Сүүлд синк хийсэн: саяхан';
    }
    if (diff.inHours < 1) {
      return 'Сүүлд синк хийсэн: ${diff.inMinutes} минутын өмнө';
    }
    if (diff.inDays < 1) {
      return 'Сүүлд синк хийсэн: ${diff.inHours} цагийн өмнө';
    }
    return 'Сүүлд синк хийсэн: ${diff.inDays} хоногийн өмнө';
  }
}
