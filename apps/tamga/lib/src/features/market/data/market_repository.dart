import '../../../core/error/result.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/digital_certificate.dart';
import '../domain/market_listing.dart';
import '../domain/market_offer.dart';
import '../domain/market_safety.dart';
import '../domain/price_history.dart';
import '../domain/saved_search.dart';
import '../domain/seller_rating.dart';
import '../domain/seller_verification.dart';
import '../domain/trial_booking.dart';
import '../domain/trial_slot.dart';

/// Бүрэн MarketRepository interface.
///
/// Result-д суурилсан шинэ + хуучны бүх методыг нэгтгэв.
abstract class MarketRepository {
  // ============================================================
  // CRUD
  // ============================================================
  Future<Result<List<MarketListing>>> fetchListings();

  /// Хуудаслалттайгаар заруудыг авах.
  ///
  /// [page] — хуудасны дугаар (0-ээс эхэлнэ)
  /// [limit] — хуудас бүрийн элементийн тоо
  Future<Result<PaginatedResult<MarketListing>>> fetchListingsPaginated({
    required int page,
    required int limit,
  });
  Future<Result<List<MarketListing>>> fetchListingsBySeller(String sellerId);
  Future<Result<MarketListing>> saveListing(MarketListing listing);
  Future<Result<void>> deleteListing(String id);

  /// Нэг зарыг ID-аар авах.
  Future<Result<MarketListing?>> fetchListingById(String id);

  /// Зарын үзэлтийн тоог нэмэх.
  Future<Result<void>> incrementViewsCount(String listingId);

  /// Зарыг борлуулсан болгох.
  Future<Result<void>> markAsSold(String listingId);

  /// Зарыг сэргээх (хугацаа дууссан -> идэвхтэй).
  Future<Result<void>> renewListing(String listingId);

  // ============================================================
  // Favorites
  // ============================================================
  Future<Result<List<String>>> fetchFavoriteListingIds();
  Future<Result<List<String>>> toggleFavorite(String listingId);

  // ============================================================
  // Seller / Safety
  // ============================================================
  Future<Result<SellerProfile?>> fetchSellerProfile(String sellerId);
  Future<Result<List<MarketInquiry>>> fetchInquiries(String listingId);
  Future<Result<MarketInquiry>> createInquiry({
    required String listingId,
    required String buyerId,
    required String sellerId,
  });
  Future<Result<List<ListingReport>>> fetchReports(String listingId);
  Future<Result<ListingReport>> createReport({
    required String listingId,
    required String reporterId,
    required String reason,
  });
  /// Худалдагчид үнэлгээ өгөх (1-5 од + сэтгэгдэл).
  Future<Result<SellerRating>> submitSellerRating({
    required String listingId,
    required String sellerId,
    required String buyerId,
    required int rating,
    required String review,
  });

  /// Худалдагчийн бүх үнэлгээг авах.
  Future<Result<List<SellerRating>>> fetchSellerRatings(String sellerId);

  /// Худалдагчийн үнэлгээний хураангуйг авах.
  Future<Result<SellerRatingSummary>> fetchSellerRatingSummary(
    String sellerId,
  );

  /// Бүх мэдээлэгдсэн зарын жагсаалтыг авах (moderation queue-д зориулагдсан).
  Future<Result<List<ListingReport>>> fetchAllReports();

  /// Мэдээллийн төлөвийг шинэчлэх (жишээ нь: resolved).
  Future<Result<void>> resolveReport(
    String reportId,
    ListingReportStatus newStatus,
  );

  /// Худалдагч үнэлгээнд хариу өгөх.
  Future<Result<void>> respondToReview({
    required String ratingId,
    required String response,
  });

  // ============================================================
  // Digital Certificate (Phase 3)
  // ============================================================
  Future<Result<DigitalCertificate?>> fetchCertificateForHorse(String horseId);
  Future<Result<DigitalCertificate>> issueCertificate({
    required String horseId,
    required String ownerId,
    required String issuer,
  });
  Future<Result<DigitalCertificate>> transferCertificate({
    required String horseId,
    required String newOwnerId,
  });

  // ============================================================
  // Boost / VIP / Badge
  // ============================================================
  Future<Result<void>> boostListing({
    required String listingId,
    required BoostLevel level,
    required DateTime expiresAt,
  });
  Future<Result<void>> setVipLevel({
    required String listingId,
    required VipLevel level,
    required DateTime expiresAt,
  });
  Future<Result<void>> setSellerBadge({
    required String listingId,
    required SellerBadgeType badge,
    required DateTime expiresAt,
  });

  // ============================================================
  // Price History
  // ============================================================
  Future<Result<List<PriceHistoryRecord>>> fetchPriceHistory();

  // ============================================================
  // Seller Verification
  // ============================================================

  /// Утасны дугаар баталгаажуулалтыг хадгалах.
  Future<Result<SellerPhoneVerification>> savePhoneVerification(
    SellerPhoneVerification verification,
  );

  /// Худалдагчийн утасны баталгаажуулалтын төлөвийг авах.
  Future<Result<SellerPhoneVerification?>> fetchPhoneVerification(
    String sellerId,
  );

  /// Худалдагчийн бүх зарыг баталгаажуулсан болгох.
  Future<Result<void>> markSellerListingsVerified(String sellerId);

  /// Худалдагчийн бүх зарыг баталгаажаагүй болгох.
  Future<Result<void>> markSellerListingsUnverified(String sellerId);

  /// E-Mongolia баталгаажуулалтыг хадгалах.
  Future<Result<EMongoliaVerification>> saveEMongoliaVerification(
    EMongoliaVerification verification,
  );

  /// Худалдагчийн E-Mongolia баталгаажуулалтын төлөвийг авах.
  Future<Result<EMongoliaVerification?>> fetchEMongoliaVerification(
    String sellerId,
  );

  /// Худалдагчийн баталгаажуулалтын хураангуй төлөвийг авах.
  Future<Result<SellerVerificationStatusSummary>>
      fetchSellerVerificationSummary(String sellerId);

  // ============================================================
  // Saved Searches
  // ============================================================

  /// Шинэ хадгалсан хайлт үүсгэх.
  Future<Result<SavedSearch>> saveSavedSearch(SavedSearch search);

  /// Хадгалсан хайлтыг устгах.
  Future<Result<void>> deleteSavedSearch(String id);

  /// Хэрэглэгчийн бүх хадгалсан хайлтыг авах.
  Future<Result<List<SavedSearch>>> fetchSavedSearches(String userId);

  /// Хадгалсан хайлтын нэрийг шинэчлэх.
  Future<Result<SavedSearch>> updateSavedSearchName(
    String id,
    String newName,
  );

  /// Хадгалсан хайлтын lastNotifiedAt-г шинэчлэх.
  Future<Result<void>> updateSavedSearchLastNotifiedAt(
    String id,
    DateTime notifiedAt,
  );

  /// Бүх хэрэглэгчийн хадгалсан хайлтуудыг авах (шинэ зар нийтлэгдэх үед тохируулахад ашиглана).
  Future<Result<List<SavedSearch>>> fetchAllSavedSearches();

  // ============================================================
  // Offers
  // ============================================================

  /// Шинэ үнийн санал үүсгэх.
  Future<Result<MarketOffer>> createOffer(MarketOffer offer);

  /// Саналд хариу өгөх (зөвшөөрөх/татгалзах/хариу санал).
  ///
  /// [offerId] — саналын ID
  /// [status] — шинэ төлөв (accepted, declined, countered)
  /// [counterAmount] — хэрэв status == countered бол шинэ үнэ
  Future<Result<MarketOffer>> respondToOffer({
    required String offerId,
    required MarketOfferStatus status,
    int? counterAmount,
  });

  /// Зарын бүх саналыг авах.
  Future<Result<List<MarketOffer>>> fetchOffersForListing(String listingId);

  /// Хэрэглэгчийн оролцсон бүх саналыг авах.
  Future<Result<List<MarketOffer>>> fetchOffersForUser(String userId);

  // ============================================================
  // Trial Slots
  // ============================================================

  /// Шинэ туршилтын цагийн цонх үүсгэх.
  Future<Result<TrialSlot>> createTrialSlot(TrialSlot slot);

  /// Зарын бүх туршилтын цагийн цонхыг авах.
  Future<Result<List<TrialSlot>>> fetchTrialSlotsForListing(
    String listingId,
  );

  /// Цагийн цонхны төлөвийг шинэчлэх.
  Future<Result<TrialSlot>> updateTrialSlot(TrialSlot slot);

  /// Цагийн цонх устгах.
  Future<Result<void>> deleteTrialSlot(String slotId);

  // ============================================================
  // Trial Bookings
  // ============================================================

  /// Туршилтын захиалга үүсгэх.
  Future<Result<TrialBooking>> createTrialBooking(TrialBooking booking);

  /// Захиалгын төлөвийг шинэчлэх.
  Future<Result<TrialBooking>> updateTrialBookingStatus({
    required String bookingId,
    required TrialBookingStatus status,
  });

  /// Зарын бүх захиалгыг авах.
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForListing(
    String listingId,
  );

  /// Худалдан авагчийн бүх захиалгыг авах.
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForBuyer(
    String buyerId,
  );

  /// Худалдагчийн бүх захиалгыг авах.
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForSeller(
    String sellerId,
  );

  /// Захиалгыг ID-аар авах.
  Future<Result<TrialBooking?>> fetchTrialBookingById(String bookingId);
}
