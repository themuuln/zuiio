import 'package:isar/isar.dart';

import '../../../market/domain/market_conversation.dart';

part 'isar_market_conversation.g.dart';

@collection
class IsarMarketConversation {
  IsarMarketConversation();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  String? listingId;
  @Index()
  String? reportId;
  @Index()
  late String buyerId;
  @Index()
  late String sellerId;
  late String lastMessage;
  DateTime? lastMessageAt;
  late int unreadCount;

  factory IsarMarketConversation.fromDomain(MarketConversation conversation) {
    return IsarMarketConversation()
      ..domainId = conversation.id
      ..listingId = conversation.listingId
      ..reportId = conversation.reportId
      ..buyerId = conversation.buyerId
      ..sellerId = conversation.sellerId
      ..lastMessage = conversation.lastMessage
      ..lastMessageAt = conversation.lastMessageAt
      ..unreadCount = conversation.unreadCount;
  }

  MarketConversation toDomain() {
    return MarketConversation(
      id: domainId,
      listingId: listingId,
      reportId: reportId,
      buyerId: buyerId,
      sellerId: sellerId,
      lastMessage: lastMessage,
      lastMessageAt: lastMessageAt,
      unreadCount: unreadCount,
    );
  }
}
