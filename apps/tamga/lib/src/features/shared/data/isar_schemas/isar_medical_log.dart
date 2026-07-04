import 'package:isar/isar.dart';

import '../../../horses/domain/health_record.dart';

part 'isar_medical_log.g.dart';

@collection
class IsarMedicalLog {
  IsarMedicalLog();

  Id id = Isar.autoIncrement;

  late String domainId;
  late String horseId;
  @enumerated
  late MedicalLogType type;
  late DateTime date;
  late String notes;
  String? medicament;

  factory IsarMedicalLog.fromDomain(MedicalLog log) {
    return IsarMedicalLog()
      ..domainId = log.id
      ..horseId = log.horseId
      ..type = log.type
      ..date = log.date
      ..notes = log.notes
      ..medicament = log.medicament;
  }

  MedicalLog toDomain() {
    return MedicalLog(
      id: domainId,
      horseId: horseId,
      type: type,
      date: date,
      notes: notes,
      medicament: medicament,
    );
  }
}
