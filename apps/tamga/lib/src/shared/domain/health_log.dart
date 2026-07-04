import 'package:freezed_annotation/freezed_annotation.dart';

part 'health_log.freezed.dart';

/// Эрүүл мэндийн бүртгэлийн төрөл.
enum LogType {
  vaccination,
  deworming,
  treatment,
  vetVisit,
  shoeing,
  trimming;

  String get displayName => switch (this) {
    LogType.vaccination => 'Вакцинжуулалт',
    LogType.deworming => 'Туулгалт',
    LogType.treatment => 'Эмчилгээ',
    LogType.vetVisit => 'Эмчийн үзлэг',
    LogType.shoeing => 'Эмээл',
    LogType.trimming => 'Тайралт',
  };
}

/// Эрүүл мэндийн бүртгэл.
@freezed
abstract class HealthLog with _$HealthLog {
  const HealthLog._();

  const factory HealthLog({
    required String id,
    required String horseId,
    required LogType logType,
    DateTime? date,
    @Default('') String notes,
    String? medicament,
    double? cost,
    String? farrierName,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _HealthLog;

  // ── Local JSON serialization (camelCase) ──

  factory HealthLog.fromJson(Map<String, dynamic> json) {
    return HealthLog(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      logType: LogType.values.byName(json['logType'] as String),
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      notes: json['notes'] as String? ?? '',
      medicament: json['medicament'] as String?,
      cost: (json['cost'] as num?)?.toDouble(),
      farrierName: json['farrierName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'logType': logType.name,
      'date': date?.toIso8601String(),
      'notes': notes,
      'medicament': medicament,
      'cost': cost,
      'farrierName': farrierName,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // ── Supabase serialization (snake_case) ──

  factory HealthLog.fromSupabaseJson(Map<String, dynamic> json) {
    return HealthLog(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      logType: LogType.values.byName(json['log_type'] as String),
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : null,
      notes: json['notes'] as String? ?? '',
      medicament: json['medicament'] as String?,
      cost: (json['cost'] as num?)?.toDouble(),
      farrierName: json['farrier_name'] as String?,
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toSupabaseJson({required String ownerId}) {
    return {
      'owner_id': ownerId,
      'id': id,
      'horse_id': horseId,
      'log_type': logType.name,
      'date': date?.toIso8601String(),
      'notes': notes,
      'medicament': medicament,
      'cost': cost,
      'farrier_name': farrierName,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}
