import 'dart:io';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/document_record.dart';
import 'document_repository.dart';

/// Supabase cloud implementation for the documents table.
///
/// Upload: compress file → upload to Supabase Storage bucket → insert row.
/// List: query `documents` table with horse_id filter.
/// Delete: remove from Storage + delete row.
class SupabaseDocumentRepository
    with SupabaseRepositoryMixin
    implements DocumentRepository {
  SupabaseDocumentRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  static const _bucketName = 'documents';
  static const _table = 'documents';
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
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final userId = currentSupabaseUserId();
      if (userId == null) {
        return const Result.fail(AppException.authRequired);
      }

      // ── Generate unique storage path ──
      final ext = p.extension(file.path).isNotEmpty
          ? p.extension(file.path)
          : '.bin';
      final docId = _uuid.v4();
      final storagePath = '$horseId/$docId$ext';

      // ── Read file bytes ──
      final bytes = await file.readAsBytes();

      // ── Detect MIME type ──
      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';

      // ── Upload to Supabase Storage ──
      await client.storage
          .from(_bucketName)
          .uploadBinary(
            storagePath,
            bytes,
            fileOptions: FileOptions(contentType: mimeType, upsert: false),
          );

      // ── Insert row in documents table ──
      final now = DateTime.now().toIso8601String();
      final rowData = {
        'id': docId,
        'horse_id': horseId,
        'owner_id': userId,
        'doc_type': docType.name,
        'title': title,
        'storage_path': storagePath,
        'file_size': bytes.length,
        'mime_type': mimeType,
        'created_at': now,
        'updated_at': now,
      };

      final response = await client
          .from(_table)
          .insert(rowData)
          .select()
          .single();

      return Result.ok(DocumentRecord.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deleteDocument(String documentId) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      // ── Fetch storage_path before deleting ──
      final row = await client
          .from(_table)
          .select('storage_path')
          .eq('id', documentId)
          .maybeSingle();

      if (row == null) {
        return const Result.fail(
          AppException(message: 'Баримт олдсонгүй', code: 'DOCUMENT_NOT_FOUND'),
        );
      }

      final storagePath = row['storage_path'] as String;

      // ── Remove from Storage ──
      await client.storage.from(_bucketName).remove([storagePath]);

      // ── Delete row ──
      await client.from(_table).delete().eq('id', documentId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<DocumentRecord>>> getDocumentsForHorse(
    String horseId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from(_table)
          .select()
          .eq('horse_id', horseId)
          .order('created_at', ascending: false);

      final documents = (response as List<dynamic>)
          .map(
            (row) =>
                DocumentRecord.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(documents);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<DocumentRecord>>> getDocumentsByType({
    required DocumentType docType,
    String? horseId,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      var query = client.from(_table).select().eq('doc_type', docType.name);

      if (horseId != null) {
        query = query.eq('horse_id', horseId);
      }

      final response = await query.order('created_at', ascending: false);

      final documents = (response as List<dynamic>)
          .map(
            (row) =>
                DocumentRecord.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(documents);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
}
