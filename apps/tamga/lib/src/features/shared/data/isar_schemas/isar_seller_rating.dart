import 'package:isar/isar.dart';

import '../../../market/domain/seller_rating.dart';

part 'isar_seller_rating.g.dart';

@collection
class IsarSellerRating {
  IsarSellerRating();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String listingId;
  @Index()
  late String sellerId;
  late String buyerId;
  late int rating;
  late String review;
  @Index()
  late DateTime createdAt;
  String? sellerResponse;
  DateTime? responseAt;

  factory IsarSellerRating.fromDomain(SellerRating rating) {
    return IsarSellerRating()
      ..domainId = rating.id
      ..listingId = rating.listingId
      ..sellerId = rating.sellerId
      ..buyerId = rating.buyerId
      ..rating = rating.rating
      ..review = rating.review
      ..createdAt = rating.createdAt
      ..sellerResponse = rating.sellerResponse
      ..responseAt = rating.responseAt;
  }

  SellerRating toDomain() {
    return SellerRating(
      id: domainId,
      listingId: listingId,
      sellerId: sellerId,
      buyerId: buyerId,
      rating: rating,
      review: review,
      createdAt: createdAt,
      sellerResponse: sellerResponse,
      responseAt: responseAt,
    );
  }
}
