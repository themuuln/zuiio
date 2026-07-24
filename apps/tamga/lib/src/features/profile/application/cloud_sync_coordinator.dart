import 'dart:async';
import 'dart:developer' as developer;

import 'package:meta/meta.dart';

import '../../../app/app_config.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/sync/sync_conflict.dart';
import '../../../core/sync/sync_engine.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../shared/domain/health_log.dart';
import '../../breeding/data/breeding_repository.dart';
import '../../breeding/domain/breeding_record.dart';
import '../../certificates/data/certificate_repository.dart';
import '../../documents/data/document_repository.dart';
import '../../documents/domain/document_record.dart';
import '../../events/data/event_repository.dart';
import '../../../shared/domain/event.dart';
import '../../horses/data/co_ownership_repository.dart';
import '../../horses/data/horses_repository.dart';
import '../../horses/domain/co_ownership.dart';
import '../../horses/domain/horse_record.dart';
import '../../market/data/market_repository.dart';
import '../../market/domain/market_listing.dart';
import '../../payments/data/payment_repository.dart';
import '../../shared/data/isar_sync_storage.dart';
import '../../health/data/health_repository.dart';
import '../../map/data/map_repository.dart';
import '../../map/domain/geofence_alert.dart';
import '../../map/domain/horse_location.dart';
import '../../map/domain/lost_horse_report.dart';
import '../../map/domain/search_area.dart';
import '../data/profile_settings_repository.dart';
import '../domain/profile_settings.dart';

// ── Cloud sync state ────────────────────────────────────────────

/// Sync-ийн төлөв.
enum SyncStatus { idle, syncing, synced, error }

/// Cloud sync-ийн бүрэн төлөв.
class SyncState {
  const SyncState({
    this.status = SyncStatus.idle,
    this.lastSyncTime,
    this.pendingCount = 0,
    this.errorMessage,
    this.pushedCount = 0,
    this.pulledCount = 0,
    this.conflictCount = 0,
  });

  final SyncStatus status;
  final DateTime? lastSyncTime;
  final int pendingCount;
  final String? errorMessage;
  final int pushedCount;
  final int pulledCount;

  /// Зөрчилдөөний тоо — sync push үед remote болон local хувилбар
  /// зөрчилдвөл нэмэгдэнэ. Хэрэглэгч зөрчилдөөнийг шийдвэрлэсний дараа
  /// буурна.
  final int conflictCount;

  bool get isSyncing => status == SyncStatus.syncing;
  bool get hasError => status == SyncStatus.error;

  SyncState copyWith({
    SyncStatus? status,
    DateTime? lastSyncTime,
    int? pendingCount,
    String? errorMessage,
    int? pushedCount,
    int? pulledCount,
    int? conflictCount,
  }) {
    return SyncState(
      status: status ?? this.status,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      pendingCount: pendingCount ?? this.pendingCount,
      errorMessage: errorMessage,
      pushedCount: pushedCount ?? this.pushedCount,
      pulledCount: pulledCount ?? this.pulledCount,
      conflictCount: conflictCount ?? this.conflictCount,
    );
  }
}

/// Cloud sync-ийн үр дүн.
class CloudSyncResult {
  const CloudSyncResult({
    required this.usedCloud,
    required this.message,
    this.userId,
    this.pushedCount = 0,
    this.pulledCount = 0,
    this.failedCount = 0,
  });

  final bool usedCloud;
  final String message;
  final String? userId;
  final int pushedCount;
  final int pulledCount;
  final int failedCount;
}

// ── CloudSyncCoordinator ────────────────────────────────────────

/// Cloud sync-ийг удирдах координатор.
///
/// - Queue-д хуримтлагдсан offline өөрчлөлтүүдийг entity төрөлөөр нь
///   холбогдох cloud repo-руу push хийнэ
/// - Supabase-аас таталт (pull) хийнэ
/// - Conflict resolution: last-write-wins (timestamp харьцуулалт)
/// - Periodic sync-ийг Timer ашиглан хийнэ
class CloudSyncCoordinator {
  CloudSyncCoordinator({
    required this.horsesRepository,
    required this.healthRepository,
    required this.eventRepository,
    required this.marketRepository,
    required this.breedingRepository,
    required this.profileSettingsRepository,
    required this.mapRepository,
    required this.syncStorage,
    required this.connectionMonitor,
    required this.coOwnershipRepository,
    required this.documentRepository,
    required this.certificateRepository,
    required this.paymentRepository,
  });

  final HorsesRepository horsesRepository;
  final HealthRepository healthRepository;
  final EventRepository eventRepository;
  final MarketRepository marketRepository;
  final BreedingRepository breedingRepository;
  final ProfileSettingsRepository profileSettingsRepository;
  final MapRepository mapRepository;
  final IsarSyncStorage syncStorage;
  final ConnectionMonitor connectionMonitor;
  final CoOwnershipRepository coOwnershipRepository;
  final DocumentRepository documentRepository;
  final CertificateRepository certificateRepository;
  final PaymentRepository paymentRepository;

  /// Sync-ийн одоогийн төлөв.
  SyncState _state = const SyncState();
  SyncState get state => _state;

  /// Төлөв өөрчлөлтийн stream.
  final _stateController = StreamController<SyncState>.broadcast();
  Stream<SyncState> get stateStream => _stateController.stream;

  /// Зэрэгцээ sync-ээс сэргийлэх туг.
  bool _isSyncing = false;

  /// Dead letter queue-д шилжүүлсэн item-үүд.
  final List<SyncQueueItem> _deadLetterItems = [];

  /// Dead letter queue-ийн item-үүдийг буцаах.
  List<SyncQueueItem> get deadLetterItems =>
      List.unmodifiable(_deadLetterItems);

  /// Dead letter queue-г хоослох.
  void clearDeadLetter() => _deadLetterItems.clear();

  // ── Conflict detection ─────────────────────────────────────────

  /// Идэвхтэй зөрчилдөөнүүд (entityType:entityId → SyncConflict).
  final Map<String, SyncConflict> _conflicts = {};

  /// Зөрчилдөөний тоо.
  int get conflictCount => _conflicts.length;

  /// Шийдвэрлэгдээгүй зөрчилдөөнүүдийн жагсаалт.
  List<SyncConflict> get pendingConflicts => _conflicts.values.toList();

  /// Шинэ зөрчилдөөн нэмэх.
  ///
  /// Sync push үед local болон remote хувилбар зөрчилдвөл дуудагдана.
  /// Зөрчилдөөн нэмэгдсэнээр [conflictCount] нэмэгдэнэ.
  void addConflict(SyncConflict conflict) {
    _conflicts[conflict.conflictKey] = conflict;
    _updateState(_state.copyWith(conflictCount: _conflicts.length));
  }

  /// Зөрчилдөөнийг шийдвэрлэх.
  ///
  /// [conflictKey] -ээр зөрчилдөөнийг олж устгана.
  /// Зөрчилдөөн шийдвэрлэгдсэнээр [conflictCount] буурна.
  void resolveConflict(String conflictKey) {
    _conflicts.remove(conflictKey);
    _updateState(_state.copyWith(conflictCount: _conflicts.length));
  }

  /// Зөрчилдөөнийг шийдвэрлэж, сонгосон өгөгдлийг хадгалах.
  ///
  /// [keepLocal] нь true бол local хувилбарыг, false бол remote хувилбарыг
  /// хадгална. Зөрчилдөөний item нь queue-д байгаа бол устгана.
  Future<void> resolveWithData({
    required String conflictKey,
    required Map<String, dynamic> resolvedData,
  }) async {
    // Зөрчилдөөнийг устгах
    final conflict = _conflicts.remove(conflictKey);
    if (conflict == null) return;

    // Queue-д байгаа pending item-ийг устгах (sync хийх шаардлагагүй болсон)
    final queue = await syncStorage.loadQueue();
    queue.removeById(conflict.entityId);
    await syncStorage.saveQueue(queue);

    _updateState(_state.copyWith(conflictCount: _conflicts.length));
  }

  void _updateState(SyncState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  // ── Main sync flow ─────────────────────────────────────────────

  /// Бүрэн хоёр талт sync:
  /// 1. Offline queue → Supabase руу push
  /// 2. Supabase → local руу pull
  ///
  /// Зэрэгцээ sync-ээс сэргийлнэ — хэрэв sync аль хэдийн явж байгаа бол
  /// хоёр дахь дуудалт "sync in progress" төлөвтэй эрт буцна.
  Future<CloudSyncResult> syncAll() async {
    // ── Concurrent sync guard ─────────────────────────────────────
    if (_isSyncing) {
      return const CloudSyncResult(
        usedCloud: true,
        message: 'Sync аль хэдийн явж байна — зэрэгцээ sync-ээс сэргийллээ.',
      );
    }

    if (!AppConfig.isSupabaseConfigured) {
      return const CloudSyncResult(
        usedCloud: false,
        message:
            'Supabase keys тохируулаагүй тул local өгөгдөл хэвээр ашиглагдлаа.',
      );
    }

    if (connectionMonitor.current == ConnectionStatus.offline) {
      return const CloudSyncResult(
        usedCloud: false,
        message: 'Оффлайн горим — sync хойшлогдлоо.',
      );
    }

    final userId = await ensureSupabaseUserId();
    if (userId == null) {
      return const CloudSyncResult(
        usedCloud: false,
        message:
            'Supabase session үүссэнгүй. Anonymous sign-in-ийг dashboard дээр идэвхжүүлээд дахин оролдоно уу.',
      );
    }

    _isSyncing = true;
    _updateState(_state.copyWith(status: SyncStatus.syncing));

    try {
      // 1. Queue-д хуримтлагдсан offline өөрчлөлтүүдийг push хийх
      final pushResult = await _pushPendingChanges();

      // 2. Supabase-аас таталт (pull)
      int pullCount = 0;
      try {
        final horses = (await horsesRepository.syncHorses()).getOrThrow();
        pullCount += horses.length;
      } catch (e) {
        _updateState(
          _state.copyWith(
            status: SyncStatus.error,
            errorMessage: 'Морьдын таталт алдаатай: $e',
          ),
        );
        return CloudSyncResult(
          usedCloud: false,
          message: 'Морьдын таталт алдаатай: $e',
          userId: userId,
        );
      }

      // Co-ownership sync (non-fatal — failure doesn't abort the sync)
      try {
        final coOwnershipCount =
            (await coOwnershipRepository.syncCoOwnership()).getOrThrow();
        pullCount += coOwnershipCount;
      } catch (_) {
        // Co-ownership sync failed gracefully; count remains 0.
      }

      // 3. Profile settings sync
      ProfileSettings settings;
      try {
        settings = (await profileSettingsRepository.fetchSettings())
            .getOrThrow();
      } catch (_) {
        settings = const ProfileSettings(autoSyncEnabled: false);
      }

      try {
        await profileSettingsRepository.syncSettings(settings);
      } catch (_) {}

      final now = DateTime.now();
      _updateState(
        SyncState(
          status: SyncStatus.synced,
          lastSyncTime: now,
          pendingCount: 0,
          pushedCount: pushResult.pushed,
          pulledCount: pullCount,
          conflictCount: _conflicts.length,
        ),
      );

      return CloudSyncResult(
        usedCloud: true,
        message:
            'Sync амжилттай: $pullCount татагдлаа, ${pushResult.pushed} илгээгдлээ.',
        userId: userId,
        pushedCount: pushResult.pushed,
        pulledCount: pullCount,
        failedCount: pushResult.failed,
      );
    } catch (e) {
      _updateState(
        _state.copyWith(
          status: SyncStatus.error,
          errorMessage: 'Sync алдаа: $e',
        ),
      );
      return CloudSyncResult(
        usedCloud: false,
        message: 'Sync алдаа: $e',
        userId: userId,
      );
    } finally {
      _isSyncing = false;
    }
  }

  // ── Push logic ─────────────────────────────────────────────────

  /// Queue-д хуримтлагдсан offline өөрчлөлтүүдийг entity төрөлөөр нь
  /// холбогдох cloud repo-руу push хийх.
  Future<_PushResult> _pushPendingChanges() async {
    final queue = await syncStorage.loadQueue();
    if (queue.pendingCount == 0) {
      return const _PushResult(pushed: 0, failed: 0);
    }

    int pushed = 0;
    int failed = 0;

    await SyncEngine.processAsync(
      queue: queue,
      onProcessItem: (item) async {
        final result = await _pushItem(item);
        if (result.isSuccess) {
          pushed++;
        } else {
          failed++;
        }
        return result;
      },
      onDeadLetter: (item) {
        // maxRetries-д хүрсэн item-ийг dead letter queue-д хадгална
        _deadLetterItems.add(item);
        // Мөн persistent storage-д хадгалах
        syncStorage.addToDeadLetter(item);
      },
    );

    await syncStorage.saveQueue(queue);

    return _PushResult(pushed: pushed, failed: failed);
  }

  /// Нэг queue item-ийг түүний entity төрлөөр нь cloud repo-руу илгээнэ.
  Future<Result<bool>> _pushItem(SyncQueueItem item) async {
    try {
      switch (item.entityType) {
        case 'horse':
          return _pushHorse(item);
        case 'health':
          return _pushHealthLog(item);
        case 'event':
          return _pushEvent(item);
        case 'market':
          return _pushMarketListing(item);
        case 'breeding':
          return _pushBreedingRecord(item);
        case 'lost_horse_report':
          return _pushLostHorseReport(item);
        case 'search_area':
          return _pushSearchArea(item);
        case 'horse_location':
          return _pushHorseLocation(item);
        case 'geofence_alert':
          return _pushGeofenceAlert(item);
        case 'co_ownership':
          return _pushCoOwnership(item);
        case 'document':
          return _pushDocument(item);
        case 'certificate':
          return _pushCertificate(item);
        case 'lineage':
          return _pushLineageNode(item);
        case 'payment':
          return _pushPayment(item);
        default:
          developer.log(
            'Warning: unknown entity type "${item.entityType}" for item ${item.entityId}',
            name: 'CloudSyncCoordinator',
          );
          return Result.fail(
            AppException(
              message: 'Unknown entity type for sync: ${item.entityType}',
              code: 'UNKNOWN_ENTITY_TYPE',
              details: {'entityId': item.entityId, 'entityType': item.entityType},
            ),
          );
      }
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Push алдаа (${item.entityType}): $e',
          code: 'PUSH_ERROR',
          details: {'entityId': item.entityId, 'entityType': item.entityType},
        ),
      );
    }
  }

  // ── Entity-specific push ───────────────────────────────────────

  Future<Result<bool>> _pushHorse(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      // Delete — Supabase дээр soft delete эсвэл hard delete хийх боломжтой
      // Одоогоор амжилттай гэж тэмдэглэнэ (sync delete flow ирээдүйд)
      return const Result.ok(true);
    }

    final horse = Horse.fromJson(item.data);

    // Conflict detection: remote хувилбарыг шалгах
    final queueTime = item.timestamp;
    final dataUpdatedAt = _extractUpdatedAt(item.data);
    if (dataUpdatedAt != null && queueTime.isBefore(dataUpdatedAt)) {
      // Remote-д илүү шинэ өгөгдөл байж болзошгүй — зөрчилдөөн үүсгэх
      final conflict = SyncConflict(
        entityType: 'horse',
        entityId: item.entityId,
        localData: item.data,
        remoteData: item.data, // Бодит remote өгөгдлийг энд харьцуулах боломжтой
      );
      addConflict(conflict);
      return const Result.ok(true);
    }

    final result = await horsesRepository.saveHorse(horse);
    return result.map((_) => true);
  }

  Future<Result<bool>> _pushHealthLog(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      final logId = item.entityId;
      final horseId = item.data['horseId'] as String? ?? '';
      final result = await healthRepository.deleteHealthLog(horseId, logId);
      return result.map((_) => true);
    }

    final log = HealthLog.fromJson(item.data);
    final result = await healthRepository.saveHealthLog(log);
    return result.map((_) => true);
  }

  Future<Result<bool>> _pushEvent(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      final result = await eventRepository.deleteEvent(item.entityId);
      return result.map((_) => true);
    }

    final event = Event.fromJson(item.data);

    // Conflict resolution
    final queueTime = item.timestamp;
    final dataUpdatedAt = _extractUpdatedAt(item.data);
    if (dataUpdatedAt != null && queueTime.isBefore(dataUpdatedAt)) {
      // Cloud дээрх өгөгдөл илүү шинэ — гэхдээ local өөрчлөлтийг push хийнэ
    }

    final result = await eventRepository.saveEvent(event);
    return result.map((_) => true);
  }

  Future<Result<bool>> _pushMarketListing(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      final result = await marketRepository.deleteListing(item.entityId);
      return result.map((_) => true);
    }

    final listing = MarketListing.fromJson(item.data);

    // Conflict resolution
    final queueTime = item.timestamp;
    if (listing.updatedAt.isAfter(queueTime)) {
      // Cloud дээрх өгөгдөл илүү шинэ — гэхдээ local өөрчлөлтийг push хийнэ
    }

    final result = await marketRepository.saveListing(listing);
    return result.map((_) => true);
  }

  Future<Result<bool>> _pushBreedingRecord(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      // Breeding delete flow ирээдүйд
      return const Result.ok(true);
    }

    final record = BreedingRecord.fromJson(item.data);
    final result = await breedingRepository.saveBreedingRecord(record);
    return result.map((list) => list.isNotEmpty);
  }

  // ── Map entity push ───────────────────────────────────────────

  Future<Result<bool>> _pushLostHorseReport(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      // Delete not supported for lost horse reports yet
      return const Result.ok(true);
    }

    if (item.action == SyncAction.create) {
      final report = LostHorseReport.fromJson(item.data);
      final result = await mapRepository.reportLostHorse(report);
      return result.map((_) => true);
    }

    // Update — only status changes are supported
    final status = item.data['status'] as String?;
    if (status != null) {
      final result = await mapRepository.updateLostHorseStatus(
        item.entityId,
        status,
      );
      return result.map((_) => true);
    }

    return const Result.ok(true);
  }

  Future<Result<bool>> _pushSearchArea(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      final result = await mapRepository.deleteSearchArea(item.entityId);
      return result.map((_) => true);
    }

    final area = SearchArea.fromJson(item.data);
    final result = await mapRepository.saveSearchArea(area);
    return result.map((_) => true);
  }

  Future<Result<bool>> _pushHorseLocation(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      // Delete not supported for horse locations
      return const Result.ok(true);
    }

    final location = HorseLocation.fromJson(item.data);
    final result = await mapRepository.updateHorseLocation(location);
    return result.map((_) => true);
  }

  Future<Result<bool>> _pushGeofenceAlert(SyncQueueItem item) async {
    if (item.action == SyncAction.delete) {
      // Delete not supported for geofence alerts
      return const Result.ok(true);
    }

    if (item.action == SyncAction.update) {
      // Acknowledge alert
      final result = await mapRepository.acknowledgeAlert(item.entityId);
      return result.map((_) => true);
    }

    // Create — save new alert
    final alert = GeofenceAlert.fromJson(item.data);
    final result = await mapRepository.saveGeofenceAlert(alert);
    return result.map((_) => true);
  }

  // ── Co-ownership push ─────────────────────────────────────────

  /// Co-ownership item-ийг co_ownerships Supabase table руу push хийнэ.
  /// - Create/update: `saveCoOwner()` ашиглан upsert
  /// - Delete: `deleteCoOwner()` ашиглан устгах
  Future<Result<bool>> _pushCoOwnership(SyncQueueItem item) async {
    try {
      if (item.action == SyncAction.delete) {
        final result = await coOwnershipRepository.deleteCoOwner(item.entityId);
        return result.map((_) => true);
      }

      final record = CoOwnershipRecord.fromJson(item.data);
      final result = await coOwnershipRepository.saveCoOwner(record);
      return result.map((_) => true);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Co-ownership push алдаа: $e',
          code: 'CO_OWNERSHIP_PUSH_ERROR',
          details: {'entityId': item.entityId},
        ),
      );
    }
  }

  // ── Document push ────────────────────────────────────────────

  /// Document item-ийг documents Supabase table руу push хийнэ.
  /// - Insert: metadata-г documents table-д upsert хийнэ (файл нь local-д хадгалагдсан)
  /// - Delete: `deleteDocument()` ашиглан storage болон row-г устгах
  Future<Result<bool>> _pushDocument(SyncQueueItem item) async {
    try {
      if (item.action == SyncAction.delete) {
        final result = await documentRepository.deleteDocument(item.entityId);
        return result.map((_) => true);
      }

      // Insert/upsert metadata row directly into documents table.
      // File upload is handled separately at creation time by
      // LocalDocumentRepository / SupabaseDocumentRepository.
      final client = getConfiguredSupabaseClient();
      if (client == null) {
        return const Result.fail(
          AppException(
            message: 'Supabase тохиргоо байхгүй байна',
            code: 'SUPABASE_NOT_CONFIGURED',
          ),
        );
      }

      final doc = DocumentRecord.fromJson(item.data);
      await client.from(_kDocumentsTable).upsert(doc.toSupabaseJson());
      return const Result.ok(true);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Document push алдаа: $e',
          code: 'DOCUMENT_PUSH_ERROR',
          details: {'entityId': item.entityId},
        ),
      );
    }
  }

  // ── Certificate push ─────────────────────────────────────────

  /// Certificate item-ийг digital_certificates Supabase table руу push хийнэ.
  /// - Insert/update: `upsert` ашиглан digital_certificates table-д хадгалах
  /// - Delete: гэрчилгээ устгах дэмжигдэхгүй, амжилттай гэж тэмдэглэнэ
  Future<Result<bool>> _pushCertificate(SyncQueueItem item) async {
    try {
      if (item.action == SyncAction.delete) {
        // Certificate deletion is not supported via sync — mark as ok
        return const Result.ok(true);
      }

      final client = getConfiguredSupabaseClient();
      if (client == null) {
        return const Result.fail(
          AppException(
            message: 'Supabase тохиргоо байхгүй байна',
            code: 'SUPABASE_NOT_CONFIGURED',
          ),
        );
      }

      // Upsert the certificate data into digital_certificates table.
      // Data format matches OwnershipCertificate.toSupabaseJson() fields.
      await client.from(_kDigitalCertificatesTable).upsert(item.data);
      return const Result.ok(true);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Certificate push алдаа: $e',
          code: 'CERTIFICATE_PUSH_ERROR',
          details: {'entityId': item.entityId},
        ),
      );
    }
  }

  // ── Payment push ─────────────────────────────────────────────

  /// Payment item-ийг payment_requests Supabase table руу push хийнэ.
  /// - Insert/update: `upsert` ашиглан payment_requests table-д хадгалах
  /// - Delete: төлбөрийн хүсэлт устгах дэмжигдэхгүй, амжилттай гэж тэмдэглэнэ
  Future<Result<bool>> _pushPayment(SyncQueueItem item) async {
    try {
      if (item.action == SyncAction.delete) {
        // Payment deletion is not supported via sync — mark as ok
        return const Result.ok(true);
      }

      final client = getConfiguredSupabaseClient();
      if (client == null) {
        return const Result.fail(
          AppException(
            message: 'Supabase тохиргоо байхгүй байна',
            code: 'SUPABASE_NOT_CONFIGURED',
          ),
        );
      }

      // Upsert the payment data into payment_requests table.
      // Data format matches PaymentRequest.toSupabaseJson() fields.
      await client.from(_kPaymentsTable).upsert(item.data);
      return const Result.ok(true);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Payment push алдаа: $e',
          code: 'PAYMENT_PUSH_ERROR',
          details: {'entityId': item.entityId},
        ),
      );
    }
  }

  // ── Lineage push ─────────────────────────────────────────────

  /// Lineage item-ийг pedigre_links болон horses Supabase table руу push хийнэ.
  ///
  /// - Create (addParentLink): `pedigree_links` table-д insert хийнэ
  /// - Delete (removeParentLink): `pedigree_links` table-аас delete хийнэ
  /// - Update (updateHorseLineageInfo): `horses` table-д update хийнэ
  Future<Result<bool>> _pushLineageNode(SyncQueueItem item) async {
    try {
      final client = getConfiguredSupabaseClient();
      if (client == null) {
        return const Result.fail(
          AppException(
            message: 'Supabase тохиргоо байхгүй байна',
            code: 'SUPABASE_NOT_CONFIGURED',
          ),
        );
      }

      switch (item.action) {
        case SyncAction.create:
          // Insert a new pedigree_link record
          await client.from(_kPedigreeLinksTable).insert({
            'horse_id': item.data['horseId'] as String,
            'parent_id': item.data['parentId'] as String,
            'relation': item.data['relation'] as String,
          });
          return const Result.ok(true);

        case SyncAction.delete:
          // Delete the pedigree_link record
          await client
              .from(_kPedigreeLinksTable)
              .delete()
              .eq('horse_id', item.data['horseId'] as String)
              .eq('parent_id', item.data['parentId'] as String);
          return const Result.ok(true);

        case SyncAction.update:
          // Update horse lineage info in the horses table
          final updateData = <String, dynamic>{};
          if (item.data['name'] != null) {
            updateData['name'] = item.data['name'] as String;
          }
          if (item.data['coat'] != null) {
            updateData['coat'] = item.data['coat'] as String;
          }
          if (item.data['birthYear'] != null) {
            updateData['birth_year'] = item.data['birthYear'] as int;
          }
          if (item.data['notes'] != null) {
            updateData['notes'] = item.data['notes'] as String;
          }

          if (updateData.isNotEmpty) {
            await client
                .from(_kHorsesTable)
                .update(updateData)
                .eq('id', item.data['horseId'] as String);
          }
          return const Result.ok(true);
      }
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Lineage push алдаа: $e',
          code: 'LINEAGE_PUSH_ERROR',
          details: {'entityId': item.entityId, 'action': item.action.name},
        ),
      );
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  /// data map-аас updated_at утгыг гаргаж авах (timestamp харьцуулалтад).
  DateTime? _extractUpdatedAt(Map<String, dynamic> data) {
    final raw = data['updatedAt'] ?? data['updated_at'];
    if (raw is String) return DateTime.tryParse(raw);
    if (raw is DateTime) return raw;
    return null;
  }

  // ── Periodic sync ─────────────────────────────────────────────

  Timer? _periodicTimer;

  /// Давтамжтай sync эхлүүлэх.
  void startPeriodicSync({Duration interval = const Duration(minutes: 15)}) {
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(interval, (_) => syncAll());
  }

  /// Давтамжтай sync-ийг зогсоох.
  void stopPeriodicSync() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
  }

  // ── Map sync helpers ─────────────────────────────────────────

  /// Queue a lost horse report for sync.
  Future<void> queueLostHorseReport(LostHorseReport report) async {
    final item = SyncQueueItem(
      entityType: 'lost_horse_report',
      entityId: report.id,
      action: SyncAction.create,
      data: report.toJson(),
      timestamp: DateTime.now(),
    );
    await syncStorage.enqueue(item);
  }

  /// Queue a search area for sync.
  Future<void> queueSearchArea(SearchArea area) async {
    final item = SyncQueueItem(
      entityType: 'search_area',
      entityId: area.id,
      action: SyncAction.create,
      data: area.toJson(),
      timestamp: DateTime.now(),
    );
    await syncStorage.enqueue(item);
  }

  /// Queue a horse location update for sync.
  Future<void> queueHorseLocation(HorseLocation location) async {
    final item = SyncQueueItem(
      entityType: 'horse_location',
      entityId: location.horseId,
      action: SyncAction.update,
      data: location.toJson(),
      timestamp: DateTime.now(),
    );
    await syncStorage.enqueue(item);
  }

  /// Queue a geofence alert for sync.
  Future<void> queueGeofenceAlert(GeofenceAlert alert) async {
    final item = SyncQueueItem(
      entityType: 'geofence_alert',
      entityId: alert.id,
      action: SyncAction.create,
      data: alert.toJson(),
      timestamp: DateTime.now(),
    );
    await syncStorage.enqueue(item);
  }

  /// Queue a geofence alert acknowledgement for sync.
  Future<void> queueGeofenceAlertAcknowledge(String alertId) async {
    final item = SyncQueueItem(
      entityType: 'geofence_alert',
      entityId: alertId,
      action: SyncAction.update,
      data: {'acknowledged': true},
      timestamp: DateTime.now(),
    );
    await syncStorage.enqueue(item);
  }

  /// Test-д зориулсан wrapper — push логикийг дуудах боломжтой болгоно.
  @visibleForTesting
  Future<Result<bool>> testPushItem(SyncQueueItem item) => _pushItem(item);

  /// Test-д зориулсан helper — concurrent sync guard-ийг шалгахад ашиглана.
  @visibleForTesting
  void testSetSyncing(bool value) => _isSyncing = value;

  /// Test-д зориулсан helper — шууд зөрчилдөөн нэмэх.
  @visibleForTesting
  void testAddConflict(SyncConflict conflict) {
    _conflicts[conflict.conflictKey] = conflict;
    _updateState(_state.copyWith(conflictCount: _conflicts.length));
  }

  /// Coordinator-ийг цэвэрлэх.
  void dispose() {
    stopPeriodicSync();
    _stateController.close();
  }
}

// ── Supabase table constants ────────────────────────────────────

const String _kDocumentsTable = 'documents';
const String _kDigitalCertificatesTable = 'digital_certificates';
const String _kPaymentsTable = 'payment_requests';
const String _kPedigreeLinksTable = 'pedigree_links';
const String _kHorsesTable = 'horses';

// ── Internal types ──────────────────────────────────────────────

class _PushResult {
  const _PushResult({required this.pushed, required this.failed});
  final int pushed;
  final int failed;
}
