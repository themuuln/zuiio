import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/result.dart';
import '../domain/market_offer.dart';
import 'market_notifications.dart';
import 'market_providers.dart';

// ══════════════════════════════════════════════════════════════════
// Үнийн санал (Offer) Providers
// ══════════════════════════════════════════════════════════════════

/// Зарын бүх саналыг авах.
final offersForListingProvider =
    FutureProvider.family<List<MarketOffer>, String>((ref, listingId) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchOffersForListing(listingId);
  return result.getOrThrow();
});

/// Хэрэглэгчийн оролцсон бүх саналыг авах.
final offersForUserProvider = FutureProvider<List<MarketOffer>>((ref) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  // Fetch all offers for the current user as buyer
  final result = await repository.fetchOffersForUser(localMarketBuyerId);
  return result.getOrThrow();
});

/// Offer үйлдлүүд (create, respond).
final offerActionsProvider = Provider<OfferActions>((ref) {
  return OfferActions(ref);
});

/// Offer үйлдлүүдийг агуулах класс.
class OfferActions {
  OfferActions(this._ref);

  final Ref _ref;

  /// Шинэ үнийн санал үүсгэх.
  ///
  /// [listingId] — зарын ID
  /// [sellerId] — худалдагчийн ID
  /// [amount] — санал болгож буй үнэ
  /// [message] — нэмэлт мессеж (optional)
  Future<Result<MarketOffer>> createOffer({
    required String listingId,
    required String sellerId,
    required int amount,
    String? message,
  }) async {
    final repository = await _ref.read(marketRepositoryProvider.future);

    final offer = MarketOffer(
      id: const Uuid().v4(),
      listingId: listingId,
      buyerId: localMarketBuyerId,
      sellerId: sellerId,
      amount: amount,
      message: message,
      createdAt: DateTime.now(),
    );

    final result = await repository.createOffer(offer);

    if (result.isSuccess) {
      _ref.invalidate(offersForListingProvider(listingId));
      _ref.invalidate(offersForUserProvider);

      // Send notification to seller about the new offer
      try {
        final notifications = await _ref.read(
          marketNotificationsProvider.future,
        );
        await notifications.onNewOffer(
          listingId: listingId,
          offerId: offer.id,
          buyerId: localMarketBuyerId,
          amount: amount,
        );
      } catch (e) {
        // Notification failure should not block the offer creation
        debugPrint('[OfferActions] Notification failed: $e');
      }
    }

    return result;
  }

  /// Саналд хариу өгөх.
  Future<Result<MarketOffer>> respondToOffer({
    required String offerId,
    required MarketOfferStatus status,
    int? counterAmount,
    required String listingId,
  }) async {
    final repository = await _ref.read(marketRepositoryProvider.future);

    final result = await repository.respondToOffer(
      offerId: offerId,
      status: status,
      counterAmount: counterAmount,
    );

    if (result.isSuccess) {
      _ref.invalidate(offersForListingProvider(listingId));
      _ref.invalidate(offersForUserProvider);
    }

    return result;
  }
}
