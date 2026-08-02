import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/documents/data/local_document_repository.dart';
import 'package:tamga/src/features/documents/domain/document_record.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

/// Creates a temp file for upload tests.
Future<File> _tempFile({
  String name = 'doc.pdf',
  List<int> bytes = const [0, 1, 2, 3],
}) async {
  final file = File('${Directory.systemTemp.path}/$name');
  await file.writeAsBytes(bytes, flush: true);
  return file;
}

/// Uploads a document through the repository and asserts success.
Future<DocumentRecord> _upload(
  LocalDocumentRepository repository, {
  required String horseId,
  DocumentType docType = DocumentType.vetCert,
  String title = 'Вакцин гэрчилгээ',
  String fileName = 'doc.pdf',
}) async {
  final file = await _tempFile(name: fileName);
  final result = await repository.uploadDocument(
    file: file,
    horseId: horseId,
    docType: docType,
    title: title,
  );
  expect(result.isSuccess, isTrue, reason: 'upload should succeed');
  return result.value;
}

void main() {
  late LocalDocumentRepository repository;
  late SyncQueue syncQueue;

  setUp(() async {
    await setupTestEnvironment();
    await IsarDatabase.initialize();
    syncQueue = SyncQueue();
    repository = LocalDocumentRepository(
      storage: IsarStorage.instance,
      syncQueue: syncQueue,
    );
  });

  tearDown(() async {
    await IsarDatabase.close();
  });

  group('LocalDocumentRepository', () {
    // ── Create ────────────────────────────────────────────────────

    test('uploadDocument stores metadata and enqueues a create item', () async {
      final file = await _tempFile(bytes: List<int>.filled(1024, 7));
      final result = await repository.uploadDocument(
        file: file,
        horseId: 'horse-1',
        docType: DocumentType.insurance,
        title: '2026 оны даатгал',
      );

      expect(result.isSuccess, isTrue);
      final doc = result.value;
      expect(doc.id, isNotEmpty);
      expect(doc.horseId, 'horse-1');
      expect(doc.ownerId, isEmpty); // Assigned by the provider layer later.
      expect(doc.docType, DocumentType.insurance);
      expect(doc.fileSize, 1024);
      expect(doc.mimeType, 'application/pdf');
      expect(doc.storagePath, startsWith('horse-1/'));

      // Read back from Isar.
      final readBack = await repository.getDocumentsForHorse('horse-1');
      expect(readBack.isSuccess, isTrue);
      expect(readBack.value.single.title, '2026 оны даатгал');

      // The stored Isar row is marked pendingSync for the cloud sync.
      final row = await IsarStorage.instance.documentRecords
          .where()
          .findFirst();
      expect(row, isNotNull);
      expect(row!.pendingSync, isTrue);

      // Sync queue: one create item for entityType 'document'.
      expect(syncQueue.pendingCount, 1);
      final item = syncQueue.peek()!;
      expect(item.entityType, 'document');
      expect(item.entityId, doc.id);
      expect(item.action, SyncAction.create);
      expect(item.data['title'], '2026 оны даатгал');
      expect(item.data['horseId'], 'horse-1');
      expect(item.data['mimeType'], 'application/pdf');
    });

    test('uploadDocument guesses mime type from the file extension', () async {
      await _upload(repository, horseId: 'h1', fileName: 'photo.png');
      await _upload(repository, horseId: 'h1', fileName: 'scan.jpeg');
      await _upload(repository, horseId: 'h1', fileName: 'notes.bin');

      final docs = await repository.getDocumentsForHorse('h1');
      final mimeTypes = docs.value.map((d) => d.mimeType).toSet();
      expect(mimeTypes, {
        'image/png',
        'image/jpeg',
        'application/octet-stream',
      });
    });

    // ── Delete ────────────────────────────────────────────────────

    test(
      'deleteDocument removes the record and enqueues a delete item',
      () async {
        final doc = await _upload(repository, horseId: 'horse-1');
        syncQueue.clear();

        final result = await repository.deleteDocument(doc.id);

        expect(result.isSuccess, isTrue);
        final remaining = await repository.getDocumentsForHorse('horse-1');
        expect(remaining.value, isEmpty);

        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'document');
        expect(item.entityId, doc.id);
        expect(item.action, SyncAction.delete);
      },
    );

    test('create followed by delete cancels both queue items', () async {
      final doc = await _upload(repository, horseId: 'horse-1');
      expect(syncQueue.pendingCount, 1);

      await repository.deleteDocument(doc.id);

      expect(syncQueue.pendingCount, 0);
    });

    test('deleteDocument returns DOCUMENT_NOT_FOUND for unknown id', () async {
      final result = await repository.deleteDocument('missing');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'DOCUMENT_NOT_FOUND');
      expect(syncQueue.pendingCount, 0);
    });

    // ── Read & scoping ────────────────────────────────────────────

    test('getDocumentsForHorse returns only that horse documents', () async {
      await _upload(repository, horseId: 'horse-1', title: 'Миний морь');
      await _upload(repository, horseId: 'horse-2', title: 'Бусдын морь');

      final mine = await repository.getDocumentsForHorse('horse-1');

      expect(mine.isSuccess, isTrue);
      expect(mine.value.map((d) => d.title), ['Миний морь']);
    });

    test('getDocumentsForHorse sorts newest first', () async {
      final oldDoc = await _upload(repository, horseId: 'horse-1');
      final newDoc = await _upload(repository, horseId: 'horse-1');

      // Force a deterministic createdAt ordering on the Isar rows.
      await IsarStorage.instance.documentRecords.isar.writeTxn(() async {
        final rows = await IsarStorage.instance.documentRecords
            .where()
            .findAll();
        for (final row in rows) {
          row.createdAt = row.domainId == oldDoc.id
              ? DateTime(2026, 1, 1)
              : DateTime(2026, 6, 1);
          await IsarStorage.instance.documentRecords.put(row);
        }
      });

      final docs = await repository.getDocumentsForHorse('horse-1');

      expect(docs.value.map((d) => d.id), [newDoc.id, oldDoc.id]);
    });

    test('getDocumentsByType filters by type and scopes to horse', () async {
      await _upload(
        repository,
        horseId: 'horse-1',
        docType: DocumentType.vetCert,
      );
      await _upload(
        repository,
        horseId: 'horse-1',
        docType: DocumentType.insurance,
      );
      await _upload(
        repository,
        horseId: 'horse-2',
        docType: DocumentType.vetCert,
      );

      final vets = await repository.getDocumentsByType(
        docType: DocumentType.vetCert,
      );
      expect(vets.isSuccess, isTrue);
      expect(vets.value, hasLength(2));
      expect(
        vets.value.every((d) => d.docType == DocumentType.vetCert),
        isTrue,
      );

      final scoped = await repository.getDocumentsByType(
        docType: DocumentType.vetCert,
        horseId: 'horse-1',
      );
      expect(scoped.value, hasLength(1));
      expect(scoped.value.single.horseId, 'horse-1');
    });
  });
}
