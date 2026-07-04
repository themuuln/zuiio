import 'package:isar/isar.dart';

import '../../../market/domain/market_listing.dart';

part 'isar_market_listing.g.dart';

@collection
class IsarMarketListing {
  IsarMarketListing();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  @Index()
  late String sellerId;
  late String title;
  late String description;
  late int priceAmount;
  late String currency;
  @enumerated
  late MarketSaleType saleType;
  @enumerated
  @Index()
  late MarketListingStatus status;
  late String locationLabel;
  late List<String> disciplineTags;
  late List<String> documentTags;
  late List<String> mediaUrls;
  late bool isSellerVerified;
  @Index()
  late DateTime createdAt;
  late DateTime updatedAt;
  late int viewsCount;
  @Index()
  late bool isFavorite;
  late bool isFeatured;
  @enumerated
  @Index()
  late BoostLevel boostLevel;
  DateTime? boostExpiresAt;
  @enumerated
  late VipLevel vipLevel;
  DateTime? vipExpiresAt;
  @enumerated
  late SellerBadgeType sellerBadge;
  DateTime? sellerBadgeExpiresAt;

  factory IsarMarketListing.fromDomain(MarketListing listing) {
    return IsarMarketListing()
      ..domainId = listing.id
      ..horseId = listing.horseId
      ..sellerId = listing.sellerId
      ..title = listing.title
      ..description = listing.description
      ..priceAmount = listing.priceAmount
      ..currency = listing.currency
      ..saleType = listing.saleType
      ..status = listing.status
      ..locationLabel = listing.locationLabel
      ..disciplineTags = List<String>.from(listing.disciplineTags)
      ..documentTags = List<String>.from(listing.documentTags)
      ..mediaUrls = List<String>.from(listing.mediaUrls)
      ..isSellerVerified = listing.isSellerVerified
      ..createdAt = listing.createdAt
      ..updatedAt = listing.updatedAt
      ..viewsCount = listing.viewsCount
      ..isFavorite = listing.isFavorite
      ..isFeatured = listing.isFeatured
      ..boostLevel = listing.boostLevel
      ..boostExpiresAt = listing.boostExpiresAt
      ..vipLevel = listing.vipLevel
      ..vipExpiresAt = listing.vipExpiresAt
      ..sellerBadge = listing.sellerBadge
      ..sellerBadgeExpiresAt = listing.sellerBadgeExpiresAt;
  }

  MarketListing toDomain() {
    return MarketListing(
      id: domainId,
      horseId: horseId,
      sellerId: sellerId,
      title: title,
      description: description,
      priceAmount: priceAmount,
      currency: currency,
      saleType: saleType,
      status: status,
      locationLabel: locationLabel,
      disciplineTags: List<String>.from(disciplineTags),
      documentTags: List<String>.from(documentTags),
      mediaUrls: List<String>.from(mediaUrls),
      isSellerVerified: isSellerVerified,
      createdAt: createdAt,
      updatedAt: updatedAt,
      viewsCount: viewsCount,
      isFavorite: isFavorite,
      isFeatured: isFeatured,
      boostLevel: boostLevel,
      boostExpiresAt: boostExpiresAt,
      vipLevel: vipLevel,
      vipExpiresAt: vipExpiresAt,
      sellerBadge: sellerBadge,
      sellerBadgeExpiresAt: sellerBadgeExpiresAt,
    );
  }
}
