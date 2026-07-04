import 'package:isar/isar.dart';

import '../../../documents/domain/document_record.dart';

part 'isar_document_record.g.dart';

/// Isar schema for [DocumentRecord].
///
/// Stores document metadata locally for offline access.
/// The actual file is stored in Supabase Storage.
@collection
class IsarDocumentRecord {
  IsarDocumentRecord();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID (UUID).
  @Index(unique: true, replace: true)
  late String domainId;

  /// Холбогдох морийн ID.
  @Index()
  late String horseId;

  /// Өмчлөгчийн профайлын ID.
  late String ownerId;

  /// Баримтын төрөл.
  @enumerated
  late DocumentType docType;

  /// Баримтын гарчиг.
  late String title;

  /// Storage-ийн зам (bucket path).
  late String storagePath;

  /// Файлын хэмжээ (байт).
  int? fileSize;

  /// MIME төрөл.
  String? mimeType;

  /// Үүсгэсэн огноо.
  late DateTime createdAt;

  /// Шинэчилсэн огноо.
  late DateTime updatedAt;

  /// Needs sync to cloud.
  late bool pendingSync;

  factory IsarDocumentRecord.fromDomain(DocumentRecord doc) {
    return IsarDocumentRecord()
      ..domainId = doc.id
      ..horseId = doc.horseId
      ..ownerId = doc.ownerId
      ..docType = doc.docType
      ..title = doc.title
      ..storagePath = doc.storagePath
      ..fileSize = doc.fileSize
      ..mimeType = doc.mimeType
      ..createdAt = doc.createdAt
      ..updatedAt = doc.updatedAt
      ..pendingSync = false;
  }

  DocumentRecord toDomain() {
    return DocumentRecord(
      id: domainId,
      horseId: horseId,
      ownerId: ownerId,
      docType: docType,
      title: title,
      storagePath: storagePath,
      fileSize: fileSize,
      mimeType: mimeType,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
