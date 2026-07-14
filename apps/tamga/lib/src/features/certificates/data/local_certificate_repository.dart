import 'package:isar/isar.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_digital_certificate.dart';
import '../domain/ownership_certificate.dart';
import 'certificate_repository.dart';

/// Local-first CertificateRepository implementation backed by Isar.
///
/// All mutations write to Isar immediately (offline-first), then enqueue a
/// [SyncQueueItem] with `entityType: 'certificate'` so [CloudSyncCoordinator]
/// can push the change to Supabase when connectivity is available.
class LocalCertificateRepository implements CertificateRepository {
  LocalCertificateRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _storage = storage,
       _syncQueue = syncQueue;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;

  // ── Helpers ──────────────────────────────────────────────

  AppException _wrap(Object e) {
    return AppException(
      message: 'Гэрчилгээний сангийн алдаа: ${e.toString()}',
      code: 'LOCAL_CERTIFICATE_ERROR',
    );
  }

  // ── CRUD ─────────────────────────────────────────────────

  @override
  Future<Result<OwnershipCertificate>> createCertificate({
    required String horseId,
    required String ownerId,
    required String ownerName,
    String? horseName,
  }) async {
    try {
      // Revoke any existing active certificate for this horse
      final existing = await _storage.digitalCertificates
          .filter()
          .horseIdEqualTo(horseId)
          .statusEqualTo('active')
          .findFirst();

      if (existing != null) {
        await _storage.digitalCertificates.isar.writeTxn(() async {
          existing.status = 'revoked';
          await _storage.digitalCertificates.put(existing);
        });
      }

      // Create new certificate
      final id = _generateId();
      final prefix = horseId.length >= 8
          ? horseId.substring(0, 8).toUpperCase()
          : horseId.toUpperCase().padRight(8, 'X');
      final qrCode =
          'TAMGA-$prefix-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';

      final cert = OwnershipCertificate(
        id: id,
        horseId: horseId,
        ownerId: ownerId,
        ownerName: ownerName,
        issueDate: DateTime.now(),
        expiryDate: DateTime.now().add(const Duration(days: 365)),
        status: CertificateStatus.active,
        qrCode: qrCode,
        horseName: horseName,
        trustLevel: TrustLevel.selfDeclared,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final isarCert = IsarDigitalCertificate.fromDomain(cert);
      await _storage.digitalCertificates.isar.writeTxn(() async {
        await _storage.digitalCertificates.put(isarCert);
      });

      // Enqueue sync item
      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'certificate',
          entityId: id,
          action: SyncAction.create,
          data: _syncData(cert),
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(cert);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<CertificateVerification>> verifyCertificate(
    String certificateId,
  ) async {
    try {
      // Search by ID first, then by QR code if not found
      IsarDigitalCertificate? cert = await _storage.digitalCertificates
          .filter()
          .domainIdEqualTo(certificateId)
          .findFirst();

      cert ??= await _storage.digitalCertificates
          .filter()
          .qrCodeEqualTo(certificateId)
          .findFirst();

      if (cert == null) {
        return Result.fail(
          const AppException(
            message: 'Гэрчилгээ олдсонгүй',
            code: 'CERTIFICATE_NOT_FOUND',
          ),
        );
      }

      final domain = cert.toDomain();
      String message;
      bool isValid;

      if (domain.isExpired) {
        message = 'Гэрчилгээний хугацаа дууссан';
        isValid = false;
      } else if (domain.status == CertificateStatus.revoked) {
        message = 'Гэрчилгээ цуцалсан';
        isValid = false;
      } else if (domain.status == CertificateStatus.transferred) {
        message = 'Гэрчилгээ шилжүүлсэн — шинэ гэрчилгээ шалгана уу';
        isValid = false;
      } else {
        message = 'Гэрчилгээ идэвхтэй — ${domain.ownerName}';
        isValid = true;
      }

      return Result.ok(
        CertificateVerification(
          isValid: isValid,
          certificate: domain,
          message: message,
        ),
      );
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<OwnershipCertificate>> transferCertificate({
    required String certificateId,
    required String newOwnerId,
    required String newOwnerName,
  }) async {
    try {
      // Find current active certificate
      final current = await _storage.digitalCertificates
          .filter()
          .domainIdEqualTo(certificateId)
          .statusEqualTo('active')
          .findFirst();

      if (current == null) {
        return Result.fail(
          const AppException(
            message: 'Идэвхтэй гэрчилгээ олдсонгүй',
            code: 'ACTIVE_CERTIFICATE_NOT_FOUND',
          ),
        );
      }

      final currentDomain = current.toDomain();

      // Mark current as transferred
      await _storage.digitalCertificates.isar.writeTxn(() async {
        current.status = 'transferred';
        await _storage.digitalCertificates.put(current);
      });

      // Enqueue update for current certificate
      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'certificate',
          entityId: certificateId,
          action: SyncAction.update,
          data: {'status': 'transferred'},
          timestamp: DateTime.now(),
        ),
      );

      // Create new certificate for new owner
      final newId = _generateId();
      final prefix = currentDomain.horseId.length >= 8
          ? currentDomain.horseId.substring(0, 8).toUpperCase()
          : currentDomain.horseId.toUpperCase().padRight(8, 'X');
      final qrCode =
          'TAMGA-$prefix-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';

      final newCert = OwnershipCertificate(
        id: newId,
        horseId: currentDomain.horseId,
        ownerId: newOwnerId,
        ownerName: newOwnerName,
        issueDate: DateTime.now(),
        expiryDate: DateTime.now().add(const Duration(days: 365)),
        status: CertificateStatus.active,
        qrCode: qrCode,
        horseName: currentDomain.horseName,
        previousOwnerId: currentDomain.ownerId,
        trustLevel: TrustLevel.selfDeclared,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final isarNewCert = IsarDigitalCertificate.fromDomain(newCert);
      await _storage.digitalCertificates.isar.writeTxn(() async {
        await _storage.digitalCertificates.put(isarNewCert);
      });

      // Enqueue sync for new certificate
      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'certificate',
          entityId: newId,
          action: SyncAction.create,
          data: _syncData(newCert),
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(newCert);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<OwnershipCertificate?>> getCertificateByHorse(
    String horseId,
  ) async {
    try {
      final certs = await _storage.digitalCertificates
          .filter()
          .horseIdEqualTo(horseId)
          .statusEqualTo('active')
          .findAll();

      // Return the most recently issued certificate
      certs.sort(
        (a, b) => (b.issueDate ?? DateTime(2000)).compareTo(
          a.issueDate ?? DateTime(2000),
        ),
      );

      return Result.ok(certs.isNotEmpty ? certs.first.toDomain() : null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<List<OwnershipCertificate>>> getCertificatesByOwner(
    String ownerId,
  ) async {
    try {
      final certs = await _storage.digitalCertificates
          .filter()
          .ownerIdEqualTo(ownerId)
          .findAll();

      certs.sort(
        (a, b) => (b.issueDate ?? DateTime(2000)).compareTo(
          a.issueDate ?? DateTime(2000),
        ),
      );

      return Result.ok(certs.map((e) => e.toDomain()).toList());
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  // ── Private helpers ────────────────────────────────────────

  String _generateId() {
    return 'cert-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}-${_randomSuffix()}';
  }

  String _randomSuffix() {
    return DateTime.now().microsecondsSinceEpoch
        .toRadixString(36)
        .padRight(6, '0')
        .substring(0, 6);
  }

  /// Prepare data for sync queue in Supabase-compatible format.
  Map<String, dynamic> _syncData(OwnershipCertificate cert) {
    return cert.toSupabaseJson(userId: cert.ownerId)..['id'] = cert.id;
  }
}
