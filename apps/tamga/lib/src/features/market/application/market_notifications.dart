import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/services/local_notification_service.dart';
import '../../../core/services/notification_types.dart';
import '../data/market_repository.dart';
import '../domain/market_listing.dart';
import '../domain/market_safety.dart';
import '../domain/saved_search.dart';
import 'market_providers.dart';

/// Зах зээлийн шинэчлэлийн notification handler.
///
/// Хэрэглэгчийн зар дээр шинэ сонирхол ирсэн үед notification илгээх.
/// Зарын байдал шинэчлэгдсэн үед ч notification илгээх боломжтой.
class MarketNotifications {
  MarketNotifications({
    required LocalNotificationService localNotification,
    required MarketRepository marketRepository,
  }) : _localNotification = localNotification,
       _marketRepository = marketRepository;

  final LocalNotificationService _localNotification;
  final MarketRepository _marketRepository;

  // ── Inquiry Notifications ───────────────────────────────────

  /// Хэрэглэгчийн зарууд дээрх шинэ сонирхлуудыг шалгах.
  ///
  /// [lastCheckedAt] — өмнөх шалгалтын цаг. Үүнээс хойшхи шинэ сонирхлуудыг олно.
  /// Returns the number of notifications sent.
  Future<int> checkNewInquiries({DateTime? lastCheckedAt}) async {
    final userId = currentSupabaseUserId();
    if (userId == null) return 0;

    int notificationsSent = 0;

    try {
      // Хэрэглэгчийн зарын жагсаалтыг авах.
      final listingsResult = await _marketRepository.fetchListingsBySeller(
        userId,
      );
      if (listingsResult.isFailure) return 0;

      final cutoff =
          lastCheckedAt ?? DateTime.now().subtract(const Duration(hours: 6));

      for (final listing in listingsResult.value) {
        final sent = await _checkListingInquiries(listing, cutoff);
        notificationsSent += sent;
      }
    } catch (e) {
      debugPrint('[MarketNotifications] Inquiry check failed: $e');
    }

    debugPrint(
      '[MarketNotifications] New inquiry notifications sent: $notificationsSent',
    );
    return notificationsSent;
  }

  /// Нэг зарын шинэ сонирхлуудыг шалгах.
  Future<int> _checkListingInquiries(
    MarketListing listing,
    DateTime cutoff,
  ) async {
    int sent = 0;

    final inquiriesResult = await _marketRepository.fetchInquiries(listing.id);
    final inquiries = inquiriesResult.getOrThrow();

    // Шинэ сонирхлуудыг шүүх.
    final newInquiries = inquiries.where((inquiry) {
      return inquiry.createdAt.isAfter(cutoff) &&
          inquiry.status == MarketInquiryStatus.newInquiry;
    }).toList();

    for (final inquiry in newInquiries) {
      final title = 'Танай зард сонирхсон хүн байна';
      final body = '"${listing.title}" зард шинэ сонирхол ирлээ.';

      await _localNotification.showNotification(
        title: title,
        body: body,
        type: NotificationType.marketListingUpdate,
        referenceId: listing.id,
        referenceType: 'market_listing',
      );

      debugPrint(
        '[MarketNotifications] Inquiry notification sent: '
        'listing=${listing.id}, buyer=${inquiry.buyerId}',
      );
      sent++;
    }

    return sent;
  }

  // ── Listing Status Notifications ────────────────────────────

  /// Зарын байдал шинэчлэгдсэн үед notification илгээх.
  ///
  /// [reason] — татгалзсан шалтгаан (зөвхөн [MarketListingStatus.rejected] үед хамааралтай).
  Future<void> onListingStatusChanged({
    required String listingId,
    required MarketListingStatus oldStatus,
    required MarketListingStatus newStatus,
    String? reason,
  }) async {
    if (oldStatus == newStatus) return;

    String title;
    String body;

    switch (newStatus) {
      case MarketListingStatus.active:
        title = 'Зар идэвхжлээ';
        body = 'Танай зар баталгаажин идэвхжлээ.';
      case MarketListingStatus.pendingVerification:
        title = 'Зар баталгаажуулалт хүлээж буй';
        body = 'Танай зар баталгаажуулалтад илгээгдлээ.';
      case MarketListingStatus.sold:
        title = 'Зар борлуулсан';
        body = 'Танай зар борлуулсан боллоо.';
      case MarketListingStatus.expired:
        title = 'Зарын хугацаа дууссан';
        body = 'Танай зарын хугацаа дууссан. Сэргээх боломжтой.';
      case MarketListingStatus.rejected:
        title = 'Зар татгалзсан';
        body = reason != null && reason.isNotEmpty
            ? 'Танай зар дараах шалтгаанаар татгалзагдлаа: $reason'
            : 'Танай зар татгалзагдсан. Шалтгааныг шалгана уу.';
    }

    final notificationBody = body;

    await _localNotification.showNotification(
      title: title,
      body: notificationBody,
      type: NotificationType.marketListingUpdate,
      referenceId: listingId,
      referenceType: 'market_listing',
    );

    debugPrint(
      '[MarketNotifications] Listing status notification: '
      '$listingId → ${newStatus.name}${reason != null ? ' (reason: $reason)' : ''}',
    );
  }

  // ── Boost / VIP Notifications ───────────────────────────────

  /// Boost эсвэл VIP хугацаа дуусах сануулга.
  Future<void> checkExpiringBoosts() async {
    final userId = currentSupabaseUserId();
    if (userId == null) return;

    try {
      final listingsResult = await _marketRepository.fetchListingsBySeller(
        userId,
      );
      if (listingsResult.isFailure) return;

      final now = DateTime.now();

      for (final listing in listingsResult.value) {
        // Boost хугацаа дуусах 24 цагийн өмнө.
        if (listing.isBoosted && listing.boostExpiresAt != null) {
          final hoursUntilExpiry = listing.boostExpiresAt!
              .difference(now)
              .inHours;
          if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0) {
            await _localNotification.showNotification(
              title: 'Сурталчилгаа дуусах гэж байна',
              body:
                  '"${listing.title}" зарын сурталчилгаа '
                  '$hoursUntilExpiry цагийн дараа дуусна.',
              type: NotificationType.marketListingUpdate,
              referenceId: listing.id,
              referenceType: 'market_listing',
            );
          }
        }

        // VIP хугацаа дуусах 24 цагийн өмнө.
        if (listing.isVip && listing.vipExpiresAt != null) {
          final hoursUntilExpiry = listing.vipExpiresAt!
              .difference(now)
              .inHours;
          if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0) {
            await _localNotification.showNotification(
              title: 'VIP хугацаа дуусах гэж байна',
              body:
                  '"${listing.title}" зарын VIP '
                  '$hoursUntilExpiry цагийн дараа дуусна.',
              type: NotificationType.marketListingUpdate,
              referenceId: listing.id,
              referenceType: 'market_listing',
            );
          }
        }
      }
    } catch (e) {
      debugPrint('[MarketNotifications] Boost check failed: $e');
    }
  }

  // ── Offer Notifications ────────────────────────────────────

  /// Худалдан авагч үнийн санал илгээх үед худалдагчид мэдэгдэх.
  Future<void> onNewOffer({
    required String listingId,
    required String offerId,
    required String buyerId,
    required int amount,
  }) async {
    // Fetch the listing title for the notification body
    String listingTitle;
    try {
      final listingResult = await _marketRepository.fetchListingById(listingId);
      listingTitle = listingResult.getOrThrow()?.title ?? listingId;
    } catch (_) {
      listingTitle = listingId;
    }

    final title = 'Шинэ үнийн санал ирлээ';
    final body = '"$listingTitle" заранд ₮$amount үнийн санал ирлээ.';

    await _localNotification.showNotification(
      title: title,
      body: body,
      type: NotificationType.marketListingUpdate,
      referenceId: offerId,
      referenceType: 'market_offer',
    );

    debugPrint(
      '[MarketNotifications] New offer notification: '
      '$offerId (buyer: $buyerId, amount: $amount, listing: $listingTitle)',
    );
  }

  // ── Saved Search Matching ──────────────────────────────────

  /// Шинэ заруудыг хадгалсан хайлтуудтай тохируулах.
  ///
  /// [savedSearches] — хэрэглэгчийн хадгалсан хайлтууд
  /// [newListings] — шалгах шинэ зарууд
  ///
  /// Буцаах утга: илгээгдсэн notification-ийн тоо.
  Future<int> checkSavedSearchMatches({
    required List<SavedSearch> savedSearches,
    required List<MarketListing> newListings,
  }) async {
    int sent = 0;

    for (final search in savedSearches) {
      for (final listing in newListings) {
        if (listing.status != MarketListingStatus.active) continue;

        if (_matchesSavedSearch(search.filters, listing)) {
          await _localNotification.showNotification(
            title: 'Шинэ зар таны хайлттай тохирч байна',
            body:
                '"${listing.title}" — "${search.name}" хайлтанд тохирох зар нэмэгдлээ.',
            type: NotificationType.marketListingUpdate,
            referenceId: listing.id,
            referenceType: 'market_listing',
          );

          // Update lastNotifiedAt for this saved search
          await _marketRepository.updateSavedSearchLastNotifiedAt(
            search.id,
            DateTime.now(),
          );

          debugPrint(
            '[MarketNotifications] Saved search match: '
            'search="${search.name}", listing="${listing.id}"',
          );
          sent++;
        }
      }
    }

    return sent;
  }

  /// Шинээр идэвхжсэн зарыг бүх хадгалсан хайлтуудтай тохируулах.
  ///
  /// [listing] — шинэ эсвэл шинэчлэгдсэн зар.
  /// Буцаах утга: илгээгдсэн notification-ийн тоо.
  Future<int> triggerMatchingForListing(MarketListing listing) async {
    final savedSearchesResult = await _marketRepository.fetchAllSavedSearches();
    final savedSearches = savedSearchesResult.getOrThrow();
    if (savedSearches.isEmpty) return 0;

    return checkSavedSearchMatches(
      savedSearches: savedSearches,
      newListings: [listing],
    );
  }

  /// Хадгалсан хайлтын шүүлтүүрт зар тохирч байгаа эсэхийг шалгах.
  bool _matchesSavedSearch(
    Map<String, dynamic> filters,
    MarketListing listing,
  ) {
    // Зарын төрөл
    if (filters.containsKey('saleType')) {
      final saleType = filters['saleType'] as String?;
      if (saleType != null && saleType != listing.saleType.name) {
        return false;
      }
    }

    // Баталгаажсан худалдагч
    if (filters['verifiedOnly'] == true) {
      if (!listing.isSellerVerified) return false;
    }

    // Байршил
    if (filters.containsKey('location')) {
      final location = (filters['location'] as String?).orEmpty.toLowerCase();
      if (location.isNotEmpty &&
          !listing.locationLabel.toLowerCase().contains(location)) {
        return false;
      }
    }

    // Үнийн хязгаар
    if (filters.containsKey('minPrice')) {
      final minPrice = filters['minPrice'] as int? ?? 0;
      if (listing.priceAmount < minPrice) return false;
    }
    if (filters.containsKey('maxPrice')) {
      final maxPrice = filters['maxPrice'] as int?;
      if (maxPrice != null && listing.priceAmount > maxPrice) return false;
    }

    // Текст хайлт
    if (filters.containsKey('query')) {
      final query = (filters['query'] as String?).orEmpty.trim().toLowerCase();
      if (query.isNotEmpty) {
        final haystack = [
          listing.title,
          listing.description,
          listing.locationLabel,
        ].join(' ').toLowerCase();
        if (!haystack.contains(query)) return false;
      }
    }

    // Үүл/зүс (breed) — зарын гарчиг болон тайлбараас шалгах
    if (filters.containsKey('breed')) {
      final breed = (filters['breed'] as String?).orEmpty.toLowerCase();
      if (breed.isNotEmpty) {
        final title = listing.title.toLowerCase();
        final description = listing.description.toLowerCase();
        if (!title.contains(breed) && !description.contains(breed)) {
          return false;
        }
      }
    }

    return true;
  }

  // ── Trial Booking Notifications ────────────────────────────

  /// Туршилтын захиалгын төлөв өөрчлөгдсөн үед notification илгээх.
  Future<void> onTrialBookingStatusChanged({
    required String listingTitle,
    required String bookingId,
    required String oldStatus,
    required String newStatus,
  }) async {
    if (oldStatus == newStatus) return;

    final statusLabels = {
      'requested': 'Хүсэлт илгээсэн',
      'confirmed': 'Баталгаажсан',
      'completed': 'Дууссан',
      'cancelled': 'Цуцлагдсан',
    };

    final newLabel = statusLabels[newStatus] ?? newStatus;
    final oldLabel = statusLabels[oldStatus] ?? oldStatus;

    String title;
    String body;

    switch (newStatus) {
      case 'requested':
        title = 'Туршилтын шинэ хүсэлт';
        body = '"$listingTitle" зарын туршилтад шинэ хүсэлт ирлээ.';
      case 'confirmed':
        title = 'Туршилт баталгаажлаа';
        body = '"$listingTitle" зарын туршилтын хүсэлт баталгаажлаа.';
      case 'completed':
        title = 'Туршилт дууссан';
        body = '"$listingTitle" зарын туршилт дууслаа.';
      case 'cancelled':
        title = 'Туршилт цуцлагдсан';
        body = '"$listingTitle" зарын туршилт цуцлагдлаа.';
      default:
        title = 'Туршилтын төлөв шинэчлэгдсэн';
        body =
            '"$listingTitle" зарын туршилтын төлөв "$oldLabel"-аас "$newLabel" болж өөрчлөгдлөө.';
    }

    await _localNotification.showNotification(
      title: title,
      body: body,
      type: NotificationType.marketListingUpdate,
      referenceId: bookingId,
      referenceType: 'trial_booking',
    );

    debugPrint(
      '[MarketNotifications] Trial booking status notification: '
      '$bookingId → $newStatus',
    );
  }

  /// Шинэ туршилтын захиалга ирсэн үед худалдагчид мэдэгдэх.
  Future<void> onNewTrialBooking({
    required String listingTitle,
    required String bookingId,
    required String buyerId,
  }) async {
    final title = 'Туршилтын шинэ хүсэлт';
    final body = '"$listingTitle" зарын туршилтад шинэ хүсэлт ирлээ.';

    await _localNotification.showNotification(
      title: title,
      body: body,
      type: NotificationType.marketListingUpdate,
      referenceId: bookingId,
      referenceType: 'trial_booking',
    );

    debugPrint(
      '[MarketNotifications] New trial booking notification: '
      '$bookingId (buyer: $buyerId)',
    );
  }
}

/// Туслах extension — nullable string-ийн default утга.
extension _StringOrEmpty on String? {
  String get orEmpty => this ?? '';
}

// ── Riverpod Providers ──────────────────────────────────────────

/// MarketNotifications provider.
final marketNotificationsProvider = FutureProvider<MarketNotifications>((
  ref,
) async {
  return MarketNotifications(
    localNotification: LocalNotificationService.instance,
    marketRepository: await ref.watch(marketRepositoryProvider.future),
  );
});
