import 'market_listing.dart';

class PriceHistoryRecord {
  const PriceHistoryRecord({
    required this.id,
    required this.horseName,
    required this.lineageRootId,
    required this.priceAmount,
    required this.currency,
    required this.saleType,
    required this.date,
    required this.region,
  });

  final String id;
  final String horseName;
  final String lineageRootId;
  final int priceAmount;
  final String currency;
  final MarketSaleType saleType;
  final DateTime date;
  final String region;

  factory PriceHistoryRecord.fromJson(Map<String, dynamic> json) {
    return PriceHistoryRecord(
      id: json['id'] as String,
      horseName: json['horseName'] as String,
      lineageRootId: json['lineageRootId'] as String,
      priceAmount: json['priceAmount'] as int,
      currency: json['currency'] as String,
      saleType: MarketSaleType.values.byName(json['saleType'] as String),
      date: DateTime.parse(json['date'] as String),
      region: json['region'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseName': horseName,
      'lineageRootId': lineageRootId,
      'priceAmount': priceAmount,
      'currency': currency,
      'saleType': saleType.name,
      'date': date.toIso8601String(),
      'region': region,
    };
  }
}
