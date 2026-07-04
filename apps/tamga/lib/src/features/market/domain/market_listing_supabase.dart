import 'market_listing.dart';

MarketListingStatus _statusFromName(String name) {
  return switch (name) {
    'published' || 'active' => MarketListingStatus.active,
    'draft' || 'pending_verification' => MarketListingStatus.pendingVerification,
    'withdrawn' || 'expired' => MarketListingStatus.expired,
    'rejected' => MarketListingStatus.rejected,
    'sold' => MarketListingStatus.sold,
    _ => MarketListingStatus.pendingVerification,
  };
}

/// Extension adding Supabase-specific (snake_case) serialization to [MarketListing].
extension MarketListingSupabase on MarketListing {
  /// Deserializes a [MarketListing] from a Supabase JSON row (snake_case keys).
  static MarketListing fromSupabaseJson(Map<String, dynamic> row) {
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
      vipLevel: VipLevel.values.byName(
        row['vip_level'] as String? ?? 'none',
      ),
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

  /// Serializes this [MarketListing] to a Supabase-compatible map (snake_case keys).
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
