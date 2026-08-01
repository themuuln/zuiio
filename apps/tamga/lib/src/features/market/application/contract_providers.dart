import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:uuid/uuid.dart';

import '../domain/market_contract.dart';
import '../domain/market_listing.dart';
import '../domain/market_offer.dart';
import 'market_providers.dart';

// ══════════════════════════════════════════════════════════════════
// Гэрээ үүсгэх / Contract Generation Providers
// ══════════════════════════════════════════════════════════════════

/// Гэрээ үүсгэх үйлдлүүд.
final contractActionsProvider = Provider<ContractActions>((ref) {
  return const ContractActions();
});

/// Гэрээний үйлдлүүдийг агуулах класс.
class ContractActions {
  const ContractActions();

  /// Зарын мэдээллээр гэрээ үүсгэх.
  ///
  /// [listing] — зарын мэдээлэл
  /// [buyerName] — худалдан авагчийн нэр
  /// [offer] — хүлээн зөвшөөрөгдсөн санал (optional)
  MarketContract generateContract({
    required MarketListing listing,
    required String buyerName,
    MarketOffer? offer,
    String? horseName,
    String? horseDescription,
  }) {
    final sellerName = _getSellerDisplayName(listing);

    return MarketContract(
      id: const Uuid().v4(),
      listingId: listing.id,
      horseName: horseName ?? listing.title,
      horseDescription: horseDescription ?? listing.description,
      sellerName: sellerName,
      buyerName: buyerName,
      price: offer?.amount ?? listing.priceAmount,
      currency: listing.currency,
      date: DateTime.now(),
    );
  }

  /// Гэрээг системийн share sheet ашиглан хуваалцах.
  Future<void> shareContract(MarketContract contract) async {
    final text = contract.toPlainText();
    await SharePlus.instance.share(
      ShareParams(
        text: text,
        subject: 'Худалдааны гэрээ / Bill of Sale - ${contract.horseName}',
      ),
    );
  }

  /// Худалдагчийн дэлгэцэнд харуулах нэрийг авах.
  String _getSellerDisplayName(MarketListing listing) {
    // In a real app, this would fetch the seller's profile
    return listing.sellerId == localMarketBuyerId
        ? 'Та (You)'
        : 'Худалдагч #${listing.sellerId.substring(0, 8)}';
  }
}

/// Тодорхой зарын гэрээний үйлдлүүдийн provider.
final contractForListingProvider =
    Provider.family<ContractForListingActions, String>((ref, listingId) {
      return ContractForListingActions(ref, listingId);
    });

/// Зарын гэрээ үүсгэх туслах класс.
class ContractForListingActions {
  ContractForListingActions(this._ref, this.listingId);

  final Ref _ref;
  final String listingId;

  /// Гэрээ үүсгэх.
  Future<MarketContract?> generate({
    required String buyerName,
    MarketOffer? offer,
  }) async {
    final catalog = await _ref.watch(marketCatalogProvider.future);
    final listingsMap = {
      for (final vm in catalog.listings) vm.listing.id: vm.listing,
    };
    final listing = listingsMap[listingId];
    if (listing == null) return null;

    final actions = _ref.read(contractActionsProvider);
    final horseName = listing.title;
    final horseDescription = listing.description;

    return actions.generateContract(
      listing: listing,
      buyerName: buyerName,
      offer: offer,
      horseName: horseName,
      horseDescription: horseDescription,
    );
  }
}
