import 'package:isar/isar.dart';

import '../../../../features/certificates/domain/ownership_certificate.dart';

part 'isar_digital_certificate.g.dart';

@collection
class IsarDigitalCertificate {
  IsarDigitalCertificate();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  late String ownerId;
  late String ownerName;
  DateTime? issueDate;
  DateTime? expiryDate;
  late String status; // CertificateStatus.name
  late String qrCode;
  String? horseName;
  String? previousOwnerId;
  late String trustLevel; // TrustLevel.name
  DateTime? registrationDate;
  int? dataAgeDays;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarDigitalCertificate.fromDomain(OwnershipCertificate cert) {
    return IsarDigitalCertificate()
      ..domainId = cert.id
      ..horseId = cert.horseId
      ..ownerId = cert.ownerId
      ..ownerName = cert.ownerName
      ..issueDate = cert.issueDate
      ..expiryDate = cert.expiryDate
      ..status = cert.status.name
      ..qrCode = cert.qrCode
      ..horseName = cert.horseName
      ..previousOwnerId = cert.previousOwnerId
      ..trustLevel = cert.trustLevel.name
      ..registrationDate = cert.registrationDate
      ..dataAgeDays = cert.dataAgeDays
      ..createdAt = cert.createdAt
      ..updatedAt = cert.updatedAt;
  }

  OwnershipCertificate toDomain() {
    return OwnershipCertificate(
      id: domainId,
      horseId: horseId,
      ownerId: ownerId,
      ownerName: ownerName,
      issueDate: issueDate ?? DateTime.now(),
      expiryDate: expiryDate,
      status: CertificateStatus.fromString(status),
      qrCode: qrCode,
      horseName: horseName,
      previousOwnerId: previousOwnerId,
      trustLevel: TrustLevel.values.firstWhere(
        (t) => t.name == trustLevel,
        orElse: () => TrustLevel.selfDeclared,
      ),
      registrationDate: registrationDate,
      dataAgeDays: dataAgeDays,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
