import 'health_log.dart';

// ── Supabase Serialization Extension ───────────────────────────────

/// Extension adding Supabase-specific (snake_case) serialization to [HealthLog].
extension HealthLogSupabase on HealthLog {
  /// Deserializes a [HealthLog] from a Supabase JSON row (snake_case keys).
  static HealthLog fromSupabaseJson(Map<String, dynamic> json) {
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

  /// Serializes this [HealthLog] to a Supabase-compatible map (snake_case keys).
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
