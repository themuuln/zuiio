import 'package:isar/isar.dart';

import '../../../market/domain/market_message.dart';

part 'isar_market_message.g.dart';

@collection
class IsarMarketMessage {
  IsarMarketMessage();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String conversationId;
  @Index()
  late String senderId;
  String? listingId;
  String? reportId;
  late String text;
  @Index()
  late DateTime timestamp;
  late bool read;

  factory IsarMarketMessage.fromDomain(MarketMessage message) {
    return IsarMarketMessage()
      ..domainId = message.id
      ..conversationId = message.conversationId
      ..senderId = message.senderId
      ..listingId = message.listingId
      ..reportId = message.reportId
      ..text = message.text
      ..timestamp = message.timestamp
      ..read = message.read;
  }

  MarketMessage toDomain() {
    return MarketMessage(
      id: domainId,
      conversationId: conversationId,
      senderId: senderId,
      listingId: listingId,
      reportId: reportId,
      text: text,
      timestamp: timestamp,
      read: read,
    );
  }
}
