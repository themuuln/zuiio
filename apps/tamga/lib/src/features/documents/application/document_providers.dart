import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/result.dart';
import '../../../core/providers/create_list_provider.dart';
import '../../shared/data/isar_storage.dart';
import '../data/document_repository.dart';
import '../data/local_document_repository.dart';
import '../data/supabase_document_repository.dart';
import '../domain/document_record.dart';

/// Морины баримтуудын repository provider.
///
/// Supabase тохиргоо байвал cloud, үгүй бол local Isar-ыг ашиглана.
final documentRepositoryProvider = Provider<DocumentRepository>((ref) {
  final supabase = SupabaseDocumentRepository();
  final local = LocalDocumentRepository(storage: IsarStorage.instance);

  // Supabase амжилтгүй бол local руу fallback хийх
  return _DocumentRepositoryWithFallback(cloud: supabase, local: local);
});

/// Нэг морийн бүх баримтуудын provider.
///
/// [horseId] — холбогдох морийн ID
final documentsForHorseProvider =
    createListFamilyProvider<DocumentRecord, DocumentRepository, String>(
  (ref) async => ref.watch(documentRepositoryProvider),
  (repo, horseId) => repo.getDocumentsForHorse(horseId),
);

/// Тодорхой төрөлтэй баримтуудын provider.
final documentsByTypeProvider = createListFamilyProvider<
  DocumentRecord,
  DocumentRepository,
  ({DocumentType docType, String? horseId})
>(
  (ref) async => ref.watch(documentRepositoryProvider),
  (repo, params) => repo.getDocumentsByType(
    docType: params.docType,
    horseId: params.horseId,
  ),
);

/// Баримт upload хийх mutation provider.
final uploadDocumentProvider = Provider<DocumentRepository>(
  (ref) => ref.watch(documentRepositoryProvider),
);

/// Баримт устгах mutation provider.
final deleteDocumentProvider = Provider<DocumentRepository>(
  (ref) => ref.watch(documentRepositoryProvider),
);

// ── Fallback Repository ─────────────────────────────────────────────

/// Cloud repository-ийг эхлээд оролдох, амжилтгүй бол local руу fallback.
class _DocumentRepositoryWithFallback implements DocumentRepository {
  _DocumentRepositoryWithFallback({required this.cloud, required this.local});

  final DocumentRepository cloud;
  final DocumentRepository local;

  @override
  Future<Result<DocumentRecord>> uploadDocument({
    required File file,
    required String horseId,
    required DocumentType docType,
    required String title,
  }) async {
    final result = await cloud.uploadDocument(
      file: file,
      horseId: horseId,
      docType: docType,
      title: title,
    );
    if (result.isSuccess) return result;

    // Fallback to local storage
    return local.uploadDocument(
      file: file,
      horseId: horseId,
      docType: docType,
      title: title,
    );
  }

  @override
  Future<Result<void>> deleteDocument(String documentId) async {
    final result = await cloud.deleteDocument(documentId);
    if (result.isSuccess) return result;
    return local.deleteDocument(documentId);
  }

  @override
  Future<Result<List<DocumentRecord>>> getDocumentsForHorse(
    String horseId,
  ) async {
    final result = await cloud.getDocumentsForHorse(horseId);
    if (result.isSuccess) return result;
    return local.getDocumentsForHorse(horseId);
  }

  @override
  Future<Result<List<DocumentRecord>>> getDocumentsByType({
    required DocumentType docType,
    String? horseId,
  }) async {
    final result = await cloud.getDocumentsByType(
      docType: docType,
      horseId: horseId,
    );
    if (result.isSuccess) return result;
    return local.getDocumentsByType(docType: docType, horseId: horseId);
  }
}
