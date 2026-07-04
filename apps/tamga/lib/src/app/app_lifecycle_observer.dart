import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/shared/application/sync_providers.dart';

/// Аппын lifecycle-ийг хянаж, foreground төлөвт sync-ийг ажиллуулдаг observer.
///
/// [WidgetsBindingObserver] ашиглан аппын [AppLifecycleState]-ийг хянаж,
/// [AppLifecycleState.resumed] төлөвт шилжих үед [SyncStateNotifier.triggerSync()]-г
/// дуудаж, sync-ийг автоматаар ажиллуулна.
/// [AppLifecycleState.paused] болон [AppLifecycleState.inactive] төлөвт
/// sync ажиллахгүй.
///
/// Хэрэглээ:
/// ```dart
/// AppLifecycleObserver(
///   child: MaterialApp(...),
/// )
/// ```
class AppLifecycleObserver extends ConsumerStatefulWidget {
  const AppLifecycleObserver({required this.child, super.key});

  /// Дэд widget — observer энэ widget-ийг өөрчлөлтгүйгээр дамжуулна.
  final Widget child;

  @override
  ConsumerState<AppLifecycleObserver> createState() =>
      _AppLifecycleObserverState();
}

class _AppLifecycleObserverState extends ConsumerState<AppLifecycleObserver>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Pre-warm the cloud sync coordinator provider so it's ready when
    // didChangeAppLifecycleState fires shortly after startup.
    ref.read(cloudSyncCoordinatorProvider);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(syncStateProvider.notifier).triggerSync();
    }
    // AppLifecycleState.paused болон inactive төлөвт sync ажиллахгүй.
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
