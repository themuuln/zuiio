import 'package:isar/isar.dart';
import '../../../breeding/domain/breeding_record.dart';

part 'isar_breeding_record.g.dart';

@collection
class IsarBreedingRecord {
  IsarBreedingRecord();

  Id id = Isar.autoIncrement;
  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String sireId;
  late String sireName;
  @Index()
  late String damId;
  late String damName;
  late DateTime breedingDate;
  late DateTime expectedFoalingDate;
  @Index()
  late String status;
  late String herdLabel;
  late String notes;

  // Gestation tracking fields
  DateTime? actualFoalingDate;

  // Foal information fields
  String? foalId;
  String? foalName;
  String? foalGender;
  String? foalColor;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarBreedingRecord.fromDomain(BreedingRecord record) {
    return IsarBreedingRecord()
      ..domainId = record.id
      ..sireId = record.sireId
      ..sireName = record.sireName
      ..damId = record.damId
      ..damName = record.damName
      ..breedingDate = record.breedingDate
      ..expectedFoalingDate = record.expectedFoalingDate
      ..status = record.status
      ..herdLabel = record.herdLabel
      ..notes = record.notes
      ..actualFoalingDate = record.actualFoalingDate
      ..foalId = record.foalId
      ..foalName = record.foalName
      ..foalGender = record.foalGender
      ..foalColor = record.foalColor
      ..createdAt = record.createdAt
      ..updatedAt = record.updatedAt;
  }

  BreedingRecord toDomain() {
    return BreedingRecord(
      id: domainId,
      sireId: sireId,
      sireName: sireName,
      damId: damId,
      damName: damName,
      breedingDate: breedingDate,
      expectedFoalingDate: expectedFoalingDate,
      status: status,
      herdLabel: herdLabel,
      notes: notes,
      actualFoalingDate: actualFoalingDate,
      foalId: foalId,
      foalName: foalName,
      foalGender: foalGender,
      foalColor: foalColor,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
