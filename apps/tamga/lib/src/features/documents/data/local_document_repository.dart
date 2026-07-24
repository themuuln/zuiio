import 'dart:io';

import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_document_record.dart';
import '../domain/document_record.dart';
import 'document_repository.dart';

/// Isar-backed offline storage for documents.
///
/// Stores document metadata locally for offline access.
/// Actual file bytes are NOT stored locally — only the metadata.
/// Uploads queue to SyncQueue when offline.
class LocalDocumentRepository
    extends LocalRepository<DocumentRecord, IsarDocumentRecord>
    implements DocumentRepository {
  LocalDocumentRepository({IsarStorage? storage, SyncQueue? syncQueue})
    : super(
        storage: storage ?? IsarStorage.instance,
        syncQueue: syncQueue ?? SyncQueue(),
      );

  @override
  IsarCollection<IsarDocumentRecord> get collection => storage.documentRecords;

  @override
  String get entityType => 'document';

  @override
  DocumentRecord toDomain(IsarDocumentRecord entity) => entity.toDomain();

  @override
  IsarDocumentRecord fromDomain(DocumentRecord entity) =>
      IsarDocumentRecord.fromDomain(entity);

  @override
  String domainIdOf(DocumentRecord entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(DocumentRecord entity) => entity.toJson();

  static const _uuid = Uuid();

  // ── CRUD ─────────────────────────────────────────────────────────

  @override
  Future<Result<DocumentRecord>> uploadDocument({
    required File file,
    required String horseId,
    required DocumentType docType,
    required String title,
  }) async {
    try {
      // Read file bytes for metadata
      final bytes = await file.readAsBytes();
      final mimeType = _guessMimeType(file.path);

      final docId = _uuid.v4();
      final now = DateTime.now();
      final storagePath = '$horseId/$docId${_extension(file.path)}';

      final doc = DocumentRecord(
        id: docId,
        horseId: horseId,
        ownerId: '', // Will be set by provider layer
        docType: docType,
        title: title,
        storagePath: storagePath,
        fileSize: bytes.length,
        mimeType: mimeType,
        createdAt: now,
        updatedAt: now,
      );

      final isarDoc = IsarDocumentRecord.fromDomain(doc)..pendingSync = true;

      await collection.isar.writeTxn(() async {
        await collection.put(isarDoc);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'document',
          entityId: docId,
          action: SyncAction.create,
          data: doc.toJson(),
          timestamp: now,
        ),
      );

      return Result.ok(doc);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Оффлайн хадгалахад алдаа гарлаа: $e',
          code: 'LOCAL_STORAGE_ERROR',
        ),
      );
    }
  }

  @override
  Future<Result<void>> deleteDocument(String documentId) async {
    try {
      final existing = await collection
          .where()
          .domainIdEqualTo(documentId)
          .findFirst();

      if (existing == null) {
        return const Result.fail(
          AppException(message: 'Баримт олдсонгүй', code: 'DOCUMENT_NOT_FOUND'),
        );
      }

      await collection.isar.writeTxn(() async {
        await collection.delete(existing.id);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'document',
          entityId: documentId,
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Оффлайн устгахад алдаа гарлаа: $e',
          code: 'LOCAL_DELETE_ERROR',
        ),
      );
    }
  }

  @override
  Future<Result<List<DocumentRecord>>> getDocumentsForHorse(
    String horseId,
  ) async {
    try {
      final docs = await collection
          .where()
          .horseIdEqualTo(horseId)
          .sortByCreatedAtDesc()
          .findAll();

      return Result.ok(docs.map(toDomain).toList());
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Оффлайн уншихад алдаа гарлаа: $e',
          code: 'LOCAL_READ_ERROR',
        ),
      );
    }
  }

  @override
  Future<Result<List<DocumentRecord>>> getDocumentsByType({
    required DocumentType docType,
    String? horseId,
  }) async {
    try {
      List<IsarDocumentRecord> docs;

      if (horseId != null) {
        docs = await collection
            .where()
            .filter()
            .docTypeEqualTo(docType)
            .horseIdEqualTo(horseId)
            .sortByCreatedAtDesc()
            .findAll();
      } else {
        docs = await collection
            .where()
            .filter()
            .docTypeEqualTo(docType)
            .sortByCreatedAtDesc()
            .findAll();
      }

      return Result.ok(docs.map(toDomain).toList());
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Оффлайн уншихад алдаа гарлаа: $e',
          code: 'LOCAL_READ_ERROR',
        ),
      );
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  String _extension(String path) {
    final lastDot = path.lastIndexOf('.');
    if (lastDot == -1) return '.bin';
    return path.substring(lastDot);
  }

  String _guessMimeType(String path) {
    final ext = _extension(path).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.doc':
        return 'application/msword';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }
}
