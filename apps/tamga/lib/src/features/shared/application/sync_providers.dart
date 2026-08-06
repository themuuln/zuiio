import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:meta/meta.dart';

import '../../../core/sync/connection_status.dart';
import '../../../core/sync/sync_queue.dart';
import '../../breeding/application/breeding_providers.dart';
import '../../certificates/application/certificate_providers.dart';
import '../../documents/application/document_providers.dart';
import '../../events/application/events_providers.dart';
import '../../health/application/health_providers.dart';
import '../../horses/application/co_ownership_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../map/application/map_providers.dart';
import '../../map/data/supabase_lost_horse_repository.dart';
import '../../market/application/market_providers.dart';
import '../../payments/application/payment_providers.dart';
import '../../profile/application/cloud_sync_coordinator.dart';
import '../../profile/application/profile_providers.dart';
import '../data/isar_storage.dart';
import '../data/isar_sync_storage.dart';

/// ConnectionMonitor singleton — app дээр нэг л мөр ажиллана.
final connectionMonitorProvider = Provider<ConnectionMonitor>((ref) {
  final monitor = ConnectionMonitor.instance;
  ref.onDispose(() => monitor.stop());
  return monitor;
});

/// SyncQueue-ийг Isar-д persistent хадгалах давхарга.
final isarSyncStorageProvider = Provider<IsarSyncStorage>((ref) {
  return IsarSyncStorage(IsarStorage.instance);
});

/// Cloud sync coordinator — бүх нийлүүлэгчдийг холбож өгнө.
final cloudSyncCoordinatorProvider = FutureProvider<CloudSyncCoordinator>((
  ref,
) async {
  final coordinator = CloudSyncCoordinator(
    horsesRepository: await ref.watch(horsesRepositoryProvider.future),
    healthRepository: await ref.watch(healthRepositoryProvider.future),
    eventRepository: ref.watch(localEventRepositoryProvider),
    marketRepository: await ref.watch(marketRepositoryProvider.future),
    breedingRepository: await ref.watch(breedingRepositoryProvider.future),
    profileSettingsRepository: await ref.watch(
      profileSettingsRepositoryProvider.future,
    ),
    mapRepository: ref.watch(mapRepositoryProvider),
    lostHorseRepository: SupabaseLostHorseRepository(),
    coOwnershipRepository: ref.watch(coOwnershipRepositoryProvider),
    documentRepository: ref.watch(documentRepositoryProvider),
    certificateRepository: ref.watch(certificateRepositoryProvider),
    paymentRepository: ref.watch(paymentRepositoryProvider),
    syncStorage: ref.watch(isarSyncStorageProvider),
    connectionMonitor: ref.watch(connectionMonitorProvider),
  );

  // Periodic sync — only when the user enabled auto-sync. The timer fires a
  // guarded syncAll() (offline/unauth early-exit), so it is cheap to keep.
  try {
    final settings = await coordinator.profileSettingsRepository
        .fetchSettings();
    if (settings.getOrThrow().autoSyncEnabled) {
      coordinator.startPeriodicSync();
    }
  } catch (_) {
    // Settings unreadable — stay on manual/resume-only sync.
  }

  // Prevent timer + stream leaks at provider teardown (tests, hot restart).
  ref.onDispose(coordinator.dispose);

  return coordinator;
});

/// Dead letter queue-д байгаа item-үүдийг шалгах provider.
///
/// Coordinator-оос dead letter item-үүдийг унших боломжтой.
final deadLetterQueueProvider = Provider<List<SyncQueueItem>>((ref) {
  final coordinator = ref.watch(cloudSyncCoordinatorProvider).valueOrNull;
  if (coordinator == null) return const [];
  return coordinator.deadLetterItems;
});

/// Sync-ийн одоогийн төлөв — бүх app дээр нэг л syncState ажиллана.
final syncStateProvider = StateNotifierProvider<SyncStateNotifier, SyncState>(
  (ref) => SyncStateNotifier(ref),
);

/// SyncState-ийг удирдах StateNotifier.
class SyncStateNotifier extends StateNotifier<SyncState> {
  SyncStateNotifier(this._ref) : super(const SyncState()) {
    // Coordinator-ийн stateStream-ийг сонсож байна
    _listenToCoordinator();
    // Сүлжээ offline → online шилжихэд автоматаар sync хийх
    _listenToConnection();
  }

  final Ref _ref;
  StreamSubscription<SyncState>? _subscription;
  StreamSubscription<ConnectionStatus>? _connectionSubscription;
  ConnectionStatus? _lastConnectionStatus;

  void _listenToCoordinator() {
    // Coordinator нь FutureProvider тул эхлэхэд нь сонсно
    _ref.listen(cloudSyncCoordinatorProvider, (prev, next) async {
      final coordinator = next.valueOrNull;
      if (coordinator == null) return;

      _subscription?.cancel();
      _subscription = coordinator.stateStream.listen((coordinatorState) {
        state = coordinatorState;
      });
    });
  }

  /// Сүлжээний төлөвийн өөрчлөлтийг сонсох.
  ///
  /// Offline байсан болон онлайн болмогц sync эхлүүлнэ —
  /// хэрэглэгч сүлжээнд буцаж холбогдоход гараар дарахгүйгээр sync хийнэ.
  void _listenToConnection() {
    _connectionSubscription = _ref
        .read(connectionMonitorProvider)
        .status
        .listen((status) {
          final wasOffline = _lastConnectionStatus == ConnectionStatus.offline;
          _lastConnectionStatus = status;
          if (status == ConnectionStatus.online && wasOffline) {
            triggerSync();
          }
        });
  }

  /// Гар ажиллагаатай sync эхлүүлэх.
  Future<void> triggerSync() async {
    final coordinator = _ref.read(cloudSyncCoordinatorProvider).valueOrNull;
    if (coordinator == null || state.isSyncing) return;

    await coordinator.syncAll();
  }

  /// Тестэд зориулсан state-ийн утгыг өөрчлөх туслах.
  ///
  /// SyncState-ийн төлвийг хянах боломжтой болгоно.
  @visibleForTesting
  void setSyncStateForTesting(SyncState newState) {
    state = newState;
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _connectionSubscription?.cancel();
    super.dispose();
  }
}
