import 'package:flutter/material.dart';

/// Морины баримтын төрөл.
///
/// Тус бүрдээ Монгол нэр, icon-той.
enum DocumentType {
  /// Эмчийн гэрчилгээ.
  vetCert(
    labelMn: 'Эмчийн гэрчилгээ',
    labelEn: 'Vet Certificate',
    icon: Icons.medical_services_outlined,
  ),

  /// Даатгал.
  insurance(
    labelMn: 'Даатгал',
    labelEn: 'Insurance',
    icon: Icons.shield_outlined,
  ),

  /// Бүртгэлийн баримт.
  registration(
    labelMn: 'Бүртгэлийн баримт',
    labelEn: 'Registration',
    icon: Icons.approval_outlined,
  ),

  /// Микрочип.
  microchip(
    labelMn: 'Микрочип',
    labelEn: 'Microchip',
    icon: Icons.sd_card_outlined,
  ),

  /// Бусад.
  other(labelMn: 'Бусад', labelEn: 'Other', icon: Icons.description_outlined);

  const DocumentType({
    required this.labelMn,
    required this.labelEn,
    required this.icon,
  });

  /// Монгол нэр.
  final String labelMn;

  /// Англи нэр.
  final String labelEn;

  /// SwiftUI icon.
  final IconData icon;

  /// Supabase `doc_type` текстээс үүсгэх.
  ///
  /// Dart enum нэр (camelCase) болон Supabase утга (snake_case) хоёуланг нь дэмжинэ.
  static DocumentType fromString(String value) {
    // camelCase нэрээр шалгах (Dart enum)
    for (final type in values) {
      if (type.name == value) return type;
    }
    // snake_case → camelCase хувиргах (Supabase)
    final parts = value.split('_');
    if (parts.isEmpty || parts.first.isEmpty) return DocumentType.other;
    final camelCase =
        parts.first.toLowerCase() +
        parts.skip(1).map((part) {
          if (part.isEmpty) return part;
          return part[0].toUpperCase() + part.substring(1).toLowerCase();
        }).join();
    for (final type in values) {
      if (type.name == camelCase) return type;
    }
    return DocumentType.other;
  }
}

/// Морины баримтын domain model.
///
/// Морь бүрт холбогдох баримтуудыг хадгална:
/// эмчийн гэрчилгээ, даатгал, бүртгэл, микрочип гэх мэт.
class DocumentRecord {
  const DocumentRecord({
    required this.id,
    required this.horseId,
    required this.ownerId,
    required this.docType,
    required this.title,
    required this.storagePath,
    this.fileSize,
    this.mimeType,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Баримтын давхаргагүй ID.
  final String id;

  /// Холбогдох морийн ID.
  final String horseId;

  /// Өмчлөгчийн профайлын ID.
  final String ownerId;

  /// Баримтын төрөл.
  final DocumentType docType;

  /// Баримтын гарчиг.
  final String title;

  /// Storage-ийн зам (bucket path).
  final String storagePath;

  /// Файлын хэмжээ (байт).
  final int? fileSize;

  /// MIME төрөл (жишээ: `application/pdf`).
  final String? mimeType;

  /// Үүсгэсэн огноо.
  final DateTime createdAt;

  /// Шинэчилсэн огноо.
  final DateTime updatedAt;

  // ── copyWith ──────────────────────────────────────────────────────

  DocumentRecord copyWith({
    String? id,
    String? horseId,
    String? ownerId,
    DocumentType? docType,
    String? title,
    String? storagePath,
    int? fileSize,
    String? mimeType,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return DocumentRecord(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      ownerId: ownerId ?? this.ownerId,
      docType: docType ?? this.docType,
      title: title ?? this.title,
      storagePath: storagePath ?? this.storagePath,
      fileSize: fileSize ?? this.fileSize,
      mimeType: mimeType ?? this.mimeType,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── Serialization — Local JSON (camelCase) ──────────────────────

  factory DocumentRecord.fromJson(Map<String, dynamic> json) {
    return DocumentRecord(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      ownerId: json['ownerId'] as String,
      docType: DocumentType.fromString(json['docType'] as String),
      title: json['title'] as String,
      storagePath: json['storagePath'] as String,
      fileSize: json['fileSize'] as int?,
      mimeType: json['mimeType'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'ownerId': ownerId,
      'docType': docType.name,
      'title': title,
      'storagePath': storagePath,
      'fileSize': fileSize,
      'mimeType': mimeType,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // ── Serialization — Supabase (snake_case) ──────────────────────

  factory DocumentRecord.fromSupabaseJson(Map<String, dynamic> json) {
    return DocumentRecord(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      ownerId: json['owner_id'] as String,
      docType: DocumentType.fromString(json['doc_type'] as String),
      title: json['title'] as String,
      storagePath: json['storage_path'] as String,
      fileSize: json['file_size'] as int?,
      mimeType: json['mime_type'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'horse_id': horseId,
      'owner_id': ownerId,
      'doc_type': docType.name,
      'title': title,
      'storage_path': storagePath,
      'file_size': fileSize,
      'mime_type': mimeType,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // ── Equality ────────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DocumentRecord &&
          id == other.id &&
          horseId == other.horseId &&
          ownerId == other.ownerId &&
          docType == other.docType &&
          title == other.title &&
          storagePath == other.storagePath &&
          fileSize == other.fileSize &&
          mimeType == other.mimeType;

  @override
  int get hashCode => Object.hash(id, horseId, docType, title);

  @override
  String toString() =>
      'DocumentRecord(id: $id, title: $title, type: ${docType.name})';
}
