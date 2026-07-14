import 'package:isar/isar.dart';

import '../../../training/domain/performance_record.dart';

part 'isar_performance_record.g.dart';

/// Isar collection for [PerformanceRecord].
@collection
class IsarPerformanceRecord {
  IsarPerformanceRecord();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  @enumerated
  late MetricType metric;
  late double value;
  DateTime? date;
  String? unit;
  late String notes;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarPerformanceRecord.fromDomain(PerformanceRecord record) {
    return IsarPerformanceRecord()
      ..domainId = record.id
      ..horseId = record.horseId
      ..metric = record.metric
      ..value = record.value
      ..date = record.date
      ..unit = record.unit
      ..notes = record.notes
      ..createdAt = record.createdAt
      ..updatedAt = record.updatedAt;
  }

  PerformanceRecord toDomain() {
    return PerformanceRecord(
      id: domainId,
      horseId: horseId,
      metric: metric,
      value: value,
      date: date,
      unit: unit,
      notes: notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
