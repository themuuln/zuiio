import 'package:isar/isar.dart';

import '../../../market/domain/seller_verification.dart';

part 'isar_seller_verification.g.dart';

/// Isar schema for [SellerPhoneVerification].
@collection
class IsarSellerPhoneVerification {
  IsarSellerPhoneVerification();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String sellerId;
  late String phone;
  late bool isVerified;
  DateTime? verifiedAt;

  factory IsarSellerPhoneVerification.fromDomain(
    SellerPhoneVerification domain,
  ) {
    return IsarSellerPhoneVerification()
      ..domainId = domain.id
      ..sellerId = domain.sellerId
      ..phone = domain.phone
      ..isVerified = domain.isVerified
      ..verifiedAt = domain.verifiedAt;
  }

  SellerPhoneVerification toDomain() {
    return SellerPhoneVerification(
      id: domainId,
      sellerId: sellerId,
      phone: phone,
      isVerified: isVerified,
      verifiedAt: verifiedAt,
    );
  }
}

/// Isar schema for [EMongoliaVerification].
@collection
class IsarEMongoliaVerification {
  IsarEMongoliaVerification();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String sellerId;
  String? eMongoliaId;
  String? fullName;
  late bool isVerified;
  DateTime? verifiedAt;
  DateTime? submittedAt;
  late List<String> documentUrls;
  String? errorMessage;

  factory IsarEMongoliaVerification.fromDomain(EMongoliaVerification domain) {
    return IsarEMongoliaVerification()
      ..domainId = domain.id
      ..sellerId = domain.sellerId
      ..eMongoliaId = domain.eMongoliaId
      ..fullName = domain.fullName
      ..isVerified = domain.isVerified
      ..verifiedAt = domain.verifiedAt
      ..submittedAt = domain.submittedAt
      ..documentUrls = List<String>.from(domain.documentUrls)
      ..errorMessage = domain.errorMessage;
  }

  EMongoliaVerification toDomain() {
    return EMongoliaVerification(
      id: domainId,
      sellerId: sellerId,
      eMongoliaId: eMongoliaId,
      fullName: fullName,
      isVerified: isVerified,
      verifiedAt: verifiedAt,
      submittedAt: submittedAt,
      documentUrls: List<String>.from(documentUrls),
      errorMessage: errorMessage,
    );
  }
}
