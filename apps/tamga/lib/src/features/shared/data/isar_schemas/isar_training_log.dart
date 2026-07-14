import 'package:isar/isar.dart';

import '../../../training/domain/training_log.dart';

part 'isar_training_log.g.dart';

/// Isar collection for [TrainingLog].
@collection
class IsarTrainingLog {
  IsarTrainingLog();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  @enumerated
  late TrainingLogType type;
  late DateTime date;
  late int durationMinutes;
  double? distanceKm;
  late String notes;
  String? handlerName;
  String? weather;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarTrainingLog.fromDomain(TrainingLog log) {
    return IsarTrainingLog()
      ..domainId = log.id
      ..horseId = log.horseId
      ..type = log.type
      ..date = log.date
      ..durationMinutes = log.durationMinutes
      ..distanceKm = log.distanceKm
      ..notes = log.notes
      ..handlerName = log.handlerName
      ..weather = log.weather
      ..createdAt = log.createdAt
      ..updatedAt = log.updatedAt;
  }

  TrainingLog toDomain() {
    return TrainingLog(
      id: domainId,
      horseId: horseId,
      type: type,
      date: date,
      durationMinutes: durationMinutes,
      distanceKm: distanceKm,
      notes: notes,
      handlerName: handlerName,
      weather: weather,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
