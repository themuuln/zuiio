import 'package:isar/isar.dart';

import '../../../market/domain/market_safety.dart';

part 'isar_market_inquiry.g.dart';

@collection
class IsarMarketInquiry {
  IsarMarketInquiry();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String listingId;
  late String buyerId;
  late String sellerId;
  @enumerated
  late MarketInquiryStatus status;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarMarketInquiry.fromDomain(MarketInquiry inquiry) {
    return IsarMarketInquiry()
      ..domainId = inquiry.id
      ..listingId = inquiry.listingId
      ..buyerId = inquiry.buyerId
      ..sellerId = inquiry.sellerId
      ..status = inquiry.status
      ..createdAt = inquiry.createdAt
      ..updatedAt = inquiry.updatedAt;
  }

  MarketInquiry toDomain() {
    return MarketInquiry(
      id: domainId,
      listingId: listingId,
      buyerId: buyerId,
      sellerId: sellerId,
      status: status,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
