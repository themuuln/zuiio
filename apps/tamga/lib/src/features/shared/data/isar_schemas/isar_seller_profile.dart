import 'package:isar/isar.dart';

import '../../../market/domain/market_safety.dart';

part 'isar_seller_profile.g.dart';

@collection
class IsarSellerProfile {
  IsarSellerProfile();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String displayName;
  late String stableName;
  late String locationLabel;
  @enumerated
  late SellerVerificationStatus verificationStatus;
  late String verificationLabel;
  late String responseNote;
  late String bio;
  late double averageRating;
  late int ratingCount;
  late List<String> reviews;

  factory IsarSellerProfile.fromDomain(SellerProfile profile) {
    return IsarSellerProfile()
      ..domainId = profile.sellerId
      ..displayName = profile.displayName
      ..stableName = profile.stableName
      ..locationLabel = profile.locationLabel
      ..verificationStatus = profile.verificationStatus
      ..verificationLabel = profile.verificationLabel
      ..responseNote = profile.responseNote
      ..bio = profile.bio
      ..averageRating = profile.averageRating
      ..ratingCount = profile.ratingCount
      ..reviews = List<String>.from(profile.reviews);
  }

  SellerProfile toDomain() {
    return SellerProfile(
      sellerId: domainId,
      displayName: displayName,
      stableName: stableName,
      locationLabel: locationLabel,
      verificationStatus: verificationStatus,
      verificationLabel: verificationLabel,
      responseNote: responseNote,
      bio: bio,
      averageRating: averageRating,
      ratingCount: ratingCount,
      reviews: List<String>.from(reviews),
    );
  }
}
