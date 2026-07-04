import 'package:isar/isar.dart';

import '../../../market/domain/market_offer.dart';

part 'isar_market_offer.g.dart';

/// Isar collection for persistent storage of [MarketOffer].
@collection
class IsarMarketOffer {
  IsarMarketOffer();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String listingId;

  @Index()
  late String buyerId;

  @Index()
  late String sellerId;

  late int amount;

  late String status;

  int? counterAmount;

  String? message;

  DateTime? createdAt;

  DateTime? respondedAt;

  factory IsarMarketOffer.fromDomain(MarketOffer offer) {
    return IsarMarketOffer()
      ..domainId = offer.id
      ..listingId = offer.listingId
      ..buyerId = offer.buyerId
      ..sellerId = offer.sellerId
      ..amount = offer.amount
      ..status = offer.status.name
      ..counterAmount = offer.counterAmount
      ..message = offer.message
      ..createdAt = offer.createdAt
      ..respondedAt = offer.respondedAt;
  }

  MarketOffer toDomain() {
    return MarketOffer(
      id: domainId,
      listingId: listingId,
      buyerId: buyerId,
      sellerId: sellerId,
      amount: amount,
      status: MarketOfferStatus.fromString(status),
      counterAmount: counterAmount,
      message: message,
      createdAt: createdAt ?? DateTime.now(),
      respondedAt: respondedAt,
    );
  }
}
