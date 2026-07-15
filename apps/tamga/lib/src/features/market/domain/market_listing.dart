import 'package:freezed_annotation/freezed_annotation.dart';

part 'market_listing.freezed.dart';

// ── Enums (keep exactly as they are) ──
enum MarketSaleType { sale, lease, trade, stud }

extension MarketSaleTypeLabel on MarketSaleType {
  String get label => switch (this) {
    MarketSaleType.sale => 'Зарна',
    MarketSaleType.lease => 'Түрээс',
    MarketSaleType.trade => 'Солилцоо',
    MarketSaleType.stud => 'Ороо / Хээлтүүлэг',
  };
}

enum BoostLevel { none, standard, premium }

extension BoostLevelLabel on BoostLevel {
  String get label => switch (this) {
    BoostLevel.none => 'Энгийн',
    BoostLevel.standard => 'Сурталчилгаа',
    BoostLevel.premium => 'Дээд зэрэглэл',
  };
  int get priceMnt => switch (this) {
    BoostLevel.none => 0,
    BoostLevel.standard => 2000,
    BoostLevel.premium => 5000,
  };
  Duration get duration => switch (this) {
    BoostLevel.none => Duration.zero,
    BoostLevel.standard => const Duration(hours: 24),
    BoostLevel.premium => const Duration(hours: 72),
  };
  int get priority => switch (this) {
    BoostLevel.none => 0,
    BoostLevel.standard => 1,
    BoostLevel.premium => 2,
  };
}

enum VipLevel { none, standard, premium }

extension VipLevelLabel on VipLevel {
  String get label => switch (this) {
    VipLevel.none => 'Энгийн',
    VipLevel.standard => 'VIP',
    VipLevel.premium => 'VIP Premium',
  };
  int get priceMnt => switch (this) {
    VipLevel.none => 0,
    VipLevel.standard => 5000,
    VipLevel.premium => 15000,
  };
  Duration get duration => switch (this) {
    VipLevel.none => Duration.zero,
    VipLevel.standard => const Duration(days: 7),
    VipLevel.premium => const Duration(days: 30),
  };
  int get priority => switch (this) {
    VipLevel.none => 0,
    VipLevel.standard => 3,
    VipLevel.premium => 4,
  };
}

enum SellerBadgeType { none, shop }

extension SellerBadgeTypeLabel on SellerBadgeType {
  String get label => switch (this) {
    SellerBadgeType.none => 'Энгийн',
    SellerBadgeType.shop => 'Дэлгүүр',
  };
  int get priceMnt => switch (this) {
    SellerBadgeType.none => 0,
    SellerBadgeType.shop => 10000,
  };
  Duration get duration => switch (this) {
    SellerBadgeType.none => Duration.zero,
    SellerBadgeType.shop => const Duration(days: 365),
  };
}

enum MarketListingStatus {
  active,
  pendingVerification,
  sold,
  expired,
  rejected,
}

extension MarketListingStatusLabel on MarketListingStatus {
  String get label => switch (this) {
    MarketListingStatus.active => 'Идэвхтэй',
    MarketListingStatus.pendingVerification => 'Баталгаажуулалт хүлээж буй',
    MarketListingStatus.sold => 'Борлуулсан',
    MarketListingStatus.expired => 'Хугацаа дууссан',
    MarketListingStatus.rejected => 'Татгалзсан',
  };
}

MarketListingStatus _statusFromName(String name) {
  return switch (name) {
    'published' || 'active' => MarketListingStatus.active,
    'draft' ||
    'pending_verification' => MarketListingStatus.pendingVerification,
    'withdrawn' || 'expired' => MarketListingStatus.expired,
    'rejected' => MarketListingStatus.rejected,
    'sold' => MarketListingStatus.sold,
    _ => MarketListingStatus.pendingVerification,
  };
}

// ── Main Model ──

@freezed
class MarketListing with _$MarketListing {
  const MarketListing._();

  const factory MarketListing({
    required String id,
    required String horseId,
    required String sellerId,
    required String title,
    @Default('') String description,
    @Default(0) int priceAmount,
    @Default('MNT') String currency,
    required MarketSaleType saleType,
    required MarketListingStatus status,
    @Default('') String locationLabel,
    @Default([]) List<String> disciplineTags,
    @Default([]) List<String> documentTags,
    @Default([]) List<String> mediaUrls,
    @Default(false) bool isSellerVerified,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default(0) int viewsCount,
    @Default(false) bool isFavorite,
    @Deprecated('Use boostLevel/vipLevel instead')
    @Default(false)
    bool isFeatured,
    @Default(BoostLevel.none) BoostLevel boostLevel,
    DateTime? boostExpiresAt,
    @Default(VipLevel.none) VipLevel vipLevel,
    DateTime? vipExpiresAt,
    @Default(SellerBadgeType.none) SellerBadgeType sellerBadge,
    DateTime? sellerBadgeExpiresAt,
    double? commissionRate,
    int? commissionAmount,
  }) = _MarketListing;

  factory MarketListing.fromJson(Map<String, dynamic> json) {
    return MarketListing(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      sellerId: json['sellerId'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      priceAmount: json['priceAmount'] as int,
      currency: json['currency'] as String,
      saleType: MarketSaleType.values.byName(json['saleType'] as String),
      status: _statusFromName(json['status'] as String),
      locationLabel: json['locationLabel'] as String,
      disciplineTags: List<String>.from(json['disciplineTags'] as List),
      documentTags: List<String>.from(json['documentTags'] as List),
      mediaUrls: List<String>.from(json['mediaUrls'] as List),
      isSellerVerified: json['isSellerVerified'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      viewsCount: json['viewsCount'] as int? ?? 0,
      isFavorite: json['isFavorite'] as bool? ?? false,
      isFeatured: json['isFeatured'] as bool? ?? false,
      boostLevel: BoostLevel.values.byName(
        json['boostLevel'] as String? ?? 'none',
      ),
      boostExpiresAt: json['boostExpiresAt'] != null
          ? DateTime.parse(json['boostExpiresAt'] as String)
          : null,
      vipLevel: VipLevel.values.byName(json['vipLevel'] as String? ?? 'none'),
      vipExpiresAt: json['vipExpiresAt'] != null
          ? DateTime.parse(json['vipExpiresAt'] as String)
          : null,
      sellerBadge: SellerBadgeType.values.byName(
        json['sellerBadge'] as String? ?? 'none',
      ),
      sellerBadgeExpiresAt: json['sellerBadgeExpiresAt'] != null
          ? DateTime.parse(json['sellerBadgeExpiresAt'] as String)
          : null,
      commissionRate: (json['commissionRate'] as num?)?.toDouble(),
      commissionAmount: json['commissionAmount'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'sellerId': sellerId,
      'title': title,
      'description': description,
      'priceAmount': priceAmount,
      'currency': currency,
      'saleType': saleType.name,
      'status': status.name,
      'locationLabel': locationLabel,
      'disciplineTags': disciplineTags,
      'documentTags': documentTags,
      'mediaUrls': mediaUrls,
      'isSellerVerified': isSellerVerified,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'viewsCount': viewsCount,
      'isFavorite': isFavorite,
      'isFeatured': isFeatured,
      'boostLevel': boostLevel.name,
      'boostExpiresAt': boostExpiresAt?.toIso8601String(),
      'vipLevel': vipLevel.name,
      'vipExpiresAt': vipExpiresAt?.toIso8601String(),
      'sellerBadge': sellerBadge.name,
      'sellerBadgeExpiresAt': sellerBadgeExpiresAt?.toIso8601String(),
      'commissionRate': commissionRate,
      'commissionAmount': commissionAmount,
    };
  }

  // ── Derived ──
  bool get isActive => status == MarketListingStatus.active;
  bool get isPending => status == MarketListingStatus.pendingVerification;
  bool get isSold => status == MarketListingStatus.sold;
  bool get isExpired => status == MarketListingStatus.expired;
  bool get isPublished => isActive || isPending;

  int get trustScore =>
      (isSellerVerified ? 35 : 0) +
      (documentTags.length * 12).clamp(0, 45) +
      (mediaUrls.isNotEmpty ? 20 : 0);

  bool get isBoosted =>
      boostLevel != BoostLevel.none &&
      boostExpiresAt != null &&
      DateTime.now().isBefore(boostExpiresAt!);

  bool get isVip =>
      vipLevel != VipLevel.none &&
      vipExpiresAt != null &&
      DateTime.now().isBefore(vipExpiresAt!);

  bool get hasSellerBadge =>
      sellerBadge != SellerBadgeType.none &&
      sellerBadgeExpiresAt != null &&
      DateTime.now().isBefore(sellerBadgeExpiresAt!);

  int get sortPriority =>
      (isVip ? vipLevel.priority * 10 : 0) +
      (isBoosted ? boostLevel.priority : 0);

  // ── Supabase Serialization ──
  factory MarketListing.fromSupabaseJson(Map<String, dynamic> row) {
    return MarketListing(
      id: row['id'] as String,
      horseId: row['horse_id'] as String,
      sellerId: row['seller_id'] as String,
      title: row['title'] as String,
      description: row['description'] as String? ?? '',
      priceAmount: row['price_amount'] as int? ?? 0,
      currency: row['currency'] as String? ?? 'MNT',
      saleType: MarketSaleType.values.byName(
        row['sale_type'] as String? ?? 'sale',
      ),
      status: _statusFromName(row['status'] as String? ?? 'draft'),
      locationLabel: row['location_label'] as String? ?? '',
      disciplineTags:
          (row['discipline_tags'] as List<dynamic>?)?.cast<String>() ?? [],
      documentTags:
          (row['document_tags'] as List<dynamic>?)?.cast<String>() ?? [],
      mediaUrls: (row['media_urls'] as List<dynamic>?)?.cast<String>() ?? [],
      isSellerVerified: row['is_seller_verified'] as bool? ?? false,
      boostLevel: BoostLevel.values.byName(
        row['boost_level'] as String? ?? 'none',
      ),
      boostExpiresAt: row['boost_expires_at'] != null
          ? DateTime.tryParse(row['boost_expires_at'] as String)
          : null,
      vipLevel: VipLevel.values.byName(row['vip_level'] as String? ?? 'none'),
      vipExpiresAt: row['vip_expires_at'] != null
          ? DateTime.tryParse(row['vip_expires_at'] as String)
          : null,
      sellerBadge: SellerBadgeType.values.byName(
        row['seller_badge'] as String? ?? 'none',
      ),
      sellerBadgeExpiresAt: row['seller_badge_expires_at'] != null
          ? DateTime.tryParse(row['seller_badge_expires_at'] as String)
          : null,
      createdAt:
          DateTime.tryParse(row['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(row['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'horse_id': horseId,
      'seller_id': sellerId,
      'title': title,
      'description': description,
      'price_amount': priceAmount,
      'currency': currency,
      'sale_type': saleType.name,
      'status': status.name,
      'location_label': locationLabel,
      'discipline_tags': disciplineTags,
      'document_tags': documentTags,
      'media_urls': mediaUrls,
      'is_seller_verified': isSellerVerified,
      'boost_level': boostLevel.name,
      'boost_expires_at': boostExpiresAt?.toIso8601String(),
      'vip_level': vipLevel.name,
      'vip_expires_at': vipExpiresAt?.toIso8601String(),
      'seller_badge': sellerBadge.name,
      'seller_badge_expires_at': sellerBadgeExpiresAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}
