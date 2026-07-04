import 'package:isar/isar.dart';

import '../../../horses/domain/co_ownership.dart';

part 'isar_co_ownership_record.g.dart';

@collection
class IsarCoOwnershipRecord {
  IsarCoOwnershipRecord();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  late String coOwnerName;
  late String phone;
  late String role;
  late List<String> permissions;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarCoOwnershipRecord.fromDomain(CoOwnershipRecord record) {
    return IsarCoOwnershipRecord()
      ..domainId = record.id
      ..horseId = record.horseId
      ..coOwnerName = record.coOwnerName
      ..phone = record.phone
      ..role = record.role
      ..permissions = List<String>.from(record.permissions)
      ..createdAt = record.createdAt
      ..updatedAt = record.updatedAt;
  }

  CoOwnershipRecord toDomain() {
    return CoOwnershipRecord(
      id: domainId,
      horseId: horseId,
      coOwnerName: coOwnerName,
      phone: phone,
      role: role,
      permissions: List<String>.from(permissions),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
