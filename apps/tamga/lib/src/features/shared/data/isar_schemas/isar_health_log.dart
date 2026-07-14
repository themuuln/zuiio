import 'package:isar/isar.dart';

import '../../../../shared/domain/health_log.dart';

part 'isar_health_log.g.dart';

@collection
class IsarHealthLog {
  IsarHealthLog();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  @enumerated
  @Index()
  late LogType logType;
  DateTime? date;
  late String notes;
  String? medicament;
  double? cost;
  String? farrierName;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarHealthLog.fromDomain(HealthLog log) {
    return IsarHealthLog()
      ..domainId = log.id
      ..horseId = log.horseId
      ..logType = log.logType
      ..date = log.date
      ..notes = log.notes
      ..medicament = log.medicament
      ..cost = log.cost
      ..farrierName = log.farrierName
      ..createdAt = log.createdAt
      ..updatedAt = log.updatedAt;
  }

  HealthLog toDomain() {
    return HealthLog(
      id: domainId,
      horseId: horseId,
      logType: logType,
      date: date,
      notes: notes,
      medicament: medicament,
      cost: cost,
      farrierName: farrierName,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
