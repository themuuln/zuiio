import 'dart:io';

import '../../../core/error/result.dart';
import '../domain/document_record.dart';

/// Морины баримтуудыг хадгалж, унших abstract repository interface.
///
/// Implementation-ууд:
/// - [SupabaseDocumentRepository] — Supabase cloud руу илгээх
/// - [LocalDocumentRepository] — Isar-д оффлайн хадгалах
abstract class DocumentRepository {
  /// Баримттай файлыг upload хийх.
  ///
  /// [file] — upload хийх файл
  /// [horseId] — холбогдох морийн ID
  /// [docType] — баримтын төрөл
  /// [title] — баримтын гарчиг
  ///
  /// Амжилттай бол шинээр үүсгэсэн [DocumentRecord]-ыг буцаана.
  Future<Result<DocumentRecord>> uploadDocument({
    required File file,
    required String horseId,
    required DocumentType docType,
    required String title,
  });

  /// Баримтыг устгах.
  ///
  /// Storage-оос файл болон DB-ээс бичлэгийг хоёуланг нь устгана.
  Future<Result<void>> deleteDocument(String documentId);

  /// Нэг морийн бүх баримтуудыг авах.
  ///
  /// Огноогоор буурах эрэмбээр эрэмбэлнэ.
  Future<Result<List<DocumentRecord>>> getDocumentsForHorse(String horseId);

  /// Тодорхой төрөлтэй баримтуудыг авах.
  ///
  /// [docType] — шүүх төрөл
  /// [horseId] — холбогдох морийн ID (заавал биш)
  Future<Result<List<DocumentRecord>>> getDocumentsByType({
    required DocumentType docType,
    String? horseId,
  });
}
