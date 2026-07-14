import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/market_listing.dart';
import '../domain/market_offer.dart';
import '../domain/saved_search.dart';
import '../domain/seller_rating.dart';
import '../domain/seller_verification.dart';
import '../domain/trial_booking.dart';
import '../domain/trial_slot.dart';

/// Supabase cloud implementation for the market_listings table.
///
/// Maps [MarketListing] ↔ Supabase row via the domain model's built-in
/// `fromSupabaseJson` / `toSupabaseJson`.
class SupabaseMarketRepository with SupabaseRepositoryMixin {
  SupabaseMarketRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────────

  /// Хуудаслалттайгаар нийтэлсэн заруудыг авах.
  Future<Result<PaginatedResult<MarketListing>>> listPublishedPaginated({
    required int page,
    required int limit,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok(PaginatedResult(items: [], totalCount: 0));
      }

      final offset = page * limit;
      final response = await client
          .from('market_listings')
          .select()
          .eq('status', 'published')
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);

      final listings = (response as List<dynamic>)
          .map(
            (row) =>
                MarketListing.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      // Get total count
      final countResponse = await client
          .from('market_listings')
          .select('id')
          .eq('status', 'published')
          .count();
      final totalCount = countResponse.count;

      return Result.ok(
        PaginatedResult(items: listings, totalCount: totalCount),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// List all published listings.
  Future<Result<List<MarketListing>>> listPublished() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('market_listings')
          .select()
          .eq('status', 'published')
          .order('created_at', ascending: false);

      final listings = (response as List<dynamic>)
          .map(
            (row) =>
                MarketListing.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(listings);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// List all listings for a given seller.
  Future<Result<List<MarketListing>>> listBySeller(String sellerId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('market_listings')
          .select()
          .eq('seller_id', sellerId)
          .order('created_at', ascending: false);

      final listings = (response as List<dynamic>)
          .map(
            (row) =>
                MarketListing.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(listings);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Create or update a listing.
  Future<Result<MarketListing>> create(MarketListing listing) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final data = listing.toSupabaseJson();
      await client.from('market_listings').upsert(data);

      return Result.ok(listing);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Update an existing listing.
  Future<Result<MarketListing>> update(MarketListing listing) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final data = listing.toSupabaseJson();
      await client.from('market_listings').upsert(data);

      return Result.ok(listing);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Delete a listing by id.
  Future<Result<void>> delete(String id) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client.from('market_listings').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Boost Operations ────────────────────────────────────────

  /// Boost a listing with a specific level and expiry.
  Future<Result<void>> boostListing({
    required String listingId,
    required BoostLevel level,
    required DateTime expiresAt,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client
          .from('market_listings')
          .update({
            'boost_level': level.name,
            'boost_expires_at': expiresAt.toIso8601String(),
          })
          .eq('id', listingId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Set VIP level on a listing.
  Future<Result<void>> setVipLevel({
    required String listingId,
    required VipLevel level,
    required DateTime expiresAt,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client
          .from('market_listings')
          .update({
            'vip_level': level.name,
            'vip_expires_at': expiresAt.toIso8601String(),
          })
          .eq('id', listingId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Set seller badge on a listing.
  Future<Result<void>> setSellerBadge({
    required String listingId,
    required SellerBadgeType badge,
    required DateTime expiresAt,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client
          .from('market_listings')
          .update({
            'seller_badge': badge.name,
            'seller_badge_expires_at': expiresAt.toIso8601String(),
          })
          .eq('id', listingId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Seller Ratings (Cloud) ───────────────────────────────────

  /// Худалдагчид үнэлгээ өгөх.
  Future<Result<SellerRating>> submitSellerRating({
    required String listingId,
    required String sellerId,
    required String buyerId,
    required int rating,
    required String review,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final now = DateTime.now();
      final id = 'rating-${now.millisecondsSinceEpoch}';
      final data = {
        'id': id,
        'listing_id': listingId,
        'seller_id': sellerId,
        'buyer_id': buyerId,
        'rating': rating.clamp(1, 5),
        'review': review,
        'created_at': now.toIso8601String(),
      };

      await client.from('seller_ratings').insert(data);

      return Result.ok(
        SellerRating(
          id: id,
          listingId: listingId,
          sellerId: sellerId,
          buyerId: buyerId,
          rating: rating.clamp(1, 5),
          review: review,
          createdAt: now,
        ),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн бүх үнэлгээг авах.
  Future<Result<List<SellerRating>>> fetchSellerRatings(String sellerId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('seller_ratings')
          .select()
          .eq('seller_id', sellerId)
          .order('created_at', ascending: false);

      final ratings = (response as List<dynamic>)
          .map((row) => _ratingFromRow(row as Map<String, dynamic>))
          .toList();

      return Result.ok(ratings);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн үнэлгээний хураангуйг авах.
  Future<Result<SellerRatingSummary>> fetchSellerRatingSummary(
    String sellerId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok(
          SellerRatingSummary(
            averageRating: 0.0,
            totalCount: 0,
            distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
          ),
        );
      }

      final response = await client
          .from('seller_ratings')
          .select()
          .eq('seller_id', sellerId);

      final ratings = (response as List<dynamic>)
          .map((row) => _ratingFromRow(row as Map<String, dynamic>))
          .toList();

      return Result.ok(SellerRatingSummary.fromRatings(ratings));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагч үнэлгээнд хариу өгөх.
  Future<Result<void>> respondToReview({
    required String ratingId,
    required String response,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client
          .from('seller_ratings')
          .update({
            'seller_response': response,
            'response_at': DateTime.now().toIso8601String(),
          })
          .eq('id', ratingId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Seller Verification (cloud stubs) ────────────────────────────

  /// Утасны дугаар баталгаажуулалтыг Supabase-д хадгалах.
  Future<Result<SellerPhoneVerification>> savePhoneVerification(
    SellerPhoneVerification verification,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client.from('seller_phone_verifications').upsert({
        'id': verification.id,
        'seller_id': verification.sellerId,
        'phone': verification.phone,
        'is_verified': verification.isVerified,
        'verified_at': verification.verifiedAt?.toIso8601String(),
      });
      return Result.ok(verification);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн утасны баталгаажуулалтын төлөвийг авах.
  Future<Result<SellerPhoneVerification?>> fetchPhoneVerification(
    String sellerId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok(null);

      final response = await client
          .from('seller_phone_verifications')
          .select()
          .eq('seller_id', sellerId)
          .maybeSingle();

      if (response == null) return const Result.ok(null);

      return Result.ok(
        SellerPhoneVerification(
          id: response['id'] as String,
          sellerId: response['seller_id'] as String,
          phone: response['phone'] as String,
          isVerified: response['is_verified'] as bool? ?? false,
          verifiedAt: response['verified_at'] != null
              ? DateTime.parse(response['verified_at'] as String)
              : null,
        ),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн бүх зарыг баталгаажуулсан болгох.
  Future<Result<void>> markSellerListingsVerified(String sellerId) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client
          .from('market_listings')
          .update({'is_seller_verified': true})
          .eq('seller_id', sellerId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн бүх зарыг баталгаажаагүй болгох.
  Future<Result<void>> markSellerListingsUnverified(String sellerId) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client
          .from('market_listings')
          .update({'is_seller_verified': false})
          .eq('seller_id', sellerId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// E-Mongolia баталгаажуулалтыг Supabase-д хадгалах.
  Future<Result<EMongoliaVerification>> saveEMongoliaVerification(
    EMongoliaVerification verification,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client.from('e_mongolia_verifications').upsert({
        'id': verification.id,
        'seller_id': verification.sellerId,
        'e_mongolia_id': verification.eMongoliaId,
        'full_name': verification.fullName,
        'is_verified': verification.isVerified,
        'verified_at': verification.verifiedAt?.toIso8601String(),
        'submitted_at': verification.submittedAt?.toIso8601String(),
        'document_urls': verification.documentUrls,
        'error_message': verification.errorMessage,
      });
      return Result.ok(verification);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн E-Mongolia баталгаажуулалтын төлөвийг авах.
  Future<Result<EMongoliaVerification?>> fetchEMongoliaVerification(
    String sellerId,
  ) async {
    return const Result.ok(
      null,
    ); // Stub — implemented when E-Mongolia API is available
  }

  /// Худалдагчийн баталгаажуулалтын хураангуй төлөвийг авах.
  Future<Result<SellerVerificationStatusSummary>>
  fetchSellerVerificationSummary(String sellerId) async {
    final phone = await fetchPhoneVerification(sellerId);
    final eMongolia = await fetchEMongoliaVerification(sellerId);

    return Result.ok(
      SellerVerificationStatusSummary(
        phoneVerified: phone.getOrThrow()?.isVerified ?? false,
        eMongoliaVerified: eMongolia.getOrThrow()?.isVerified ?? false,
        phone: phone.getOrThrow()?.phone,
        eMongoliaVerification: eMongolia.getOrThrow(),
      ),
    );
  }

  /// Supabase row-оос SellerRating үүсгэх.
  SellerRating _ratingFromRow(Map<String, dynamic> row) {
    return SellerRating(
      id: row['id'] as String,
      listingId: row['listing_id'] as String,
      sellerId: row['seller_id'] as String,
      buyerId: row['buyer_id'] as String,
      rating: row['rating'] as int,
      review: row['review'] as String,
      createdAt: DateTime.parse(row['created_at'] as String),
      sellerResponse: row['seller_response'] as String?,
      responseAt: row['response_at'] != null
          ? DateTime.parse(row['response_at'] as String)
          : null,
    );
  }

  // ============================================================
  // Saved Searches (Cloud)
  // ============================================================

  /// Хадгалсан хайлтыг Supabase-д хадгалах (create/update).
  Future<Result<SavedSearch>> saveSavedSearch(SavedSearch search) async {
    try {
      final client = safeClient;
      if (client == null) return Result.ok(search);

      final data = _savedSearchToRow(search);
      await client.from('saved_searches').upsert(data).select();
      return Result.ok(search);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Хадгалсан хайлтыг устгах.
  Future<Result<void>> deleteSavedSearch(String id) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok(null);

      await client.from('saved_searches').delete().eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Хэрэглэгчийн хадгалсан хайлтуудыг авах.
  Future<Result<List<SavedSearch>>> fetchSavedSearches(String userId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('saved_searches')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final rows = response as List<dynamic>;
      final searches = rows
          .map((row) => _savedSearchFromRow(row as Map<String, dynamic>))
          .toList();
      return Result.ok(searches);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Хадгалсан хайлтын нэрийг шинэчлэх.
  Future<Result<SavedSearch>> updateSavedSearchName(
    String id,
    String newName,
  ) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(
          AppException(
            message: 'Supabase холбогдоогүй',
            code: 'SUPABASE_NOT_CONNECTED',
          ),
        );
      }

      final response = await client
          .from('saved_searches')
          .update({'name': newName})
          .eq('id', id)
          .select()
          .single();

      return Result.ok(_savedSearchFromRow(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Хадгалсан хайлтын lastNotifiedAt-г шинэчлэх.
  Future<Result<void>> updateSavedSearchLastNotifiedAt(
    String id,
    DateTime notifiedAt,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok(null);

      await client
          .from('saved_searches')
          .update({'last_notified_at': notifiedAt.toIso8601String()})
          .eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Бүх хэрэглэгчийн хадгалсан хайлтуудыг авах.
  Future<Result<List<SavedSearch>>> fetchAllSavedSearches() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);
      final response = await client
          .from('saved_searches')
          .select()
          .order('created_at', ascending: false);
      final rows = response as List<dynamic>;
      final searches = rows
          .map((row) => _savedSearchFromRow(row as Map<String, dynamic>))
          .toList();
      return Result.ok(searches);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Offer Operations ────────────────────────────────────────

  /// Шинэ үнийн санал үүсгэх.
  Future<Result<MarketOffer>> createOffer(MarketOffer offer) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client.from('offers').insert({
        'id': offer.id,
        'listing_id': offer.listingId,
        'buyer_id': offer.buyerId,
        'seller_id': offer.sellerId,
        'amount': offer.amount,
        'status': offer.status.name,
        'counter_amount': offer.counterAmount,
        'message': offer.message,
        'created_at': offer.createdAt.toIso8601String(),
        'responded_at': offer.respondedAt?.toIso8601String(),
      });

      return Result.ok(offer);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Саналд хариу өгөх.
  Future<Result<MarketOffer>> respondToOffer({
    required String offerId,
    required MarketOfferStatus status,
    int? counterAmount,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final data = <String, dynamic>{
        'status': status.name,
        'responded_at': DateTime.now().toUtc().toIso8601String(),
      };
      if (counterAmount != null) {
        data['counter_amount'] = counterAmount;
      }

      final response = await client
          .from('offers')
          .update(data)
          .eq('id', offerId)
          .select()
          .single();

      return Result.ok(_offerFromRow(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Зарын бүх саналыг авах.
  Future<Result<List<MarketOffer>>> fetchOffersForListing(
    String listingId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('offers')
          .select()
          .eq('listing_id', listingId)
          .order('created_at', ascending: false);

      final rows = response as List<dynamic>;
      return Result.ok(
        rows.map((row) => _offerFromRow(row as Map<String, dynamic>)).toList(),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Хэрэглэгчийн оролцсон бүх саналыг авах.
  Future<Result<List<MarketOffer>>> fetchOffersForUser(String userId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('offers')
          .select()
          .or('buyer_id.eq.$userId,seller_id.eq.$userId')
          .order('created_at', ascending: false);

      final rows = response as List<dynamic>;
      return Result.ok(
        rows.map((row) => _offerFromRow(row as Map<String, dynamic>)).toList(),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /// SavedSearch-ийг Supabase row болгох.
  Map<String, dynamic> _savedSearchToRow(SavedSearch search) {
    return {
      'id': search.id,
      'user_id': search.userId,
      'filters': search.filters,
      'name': search.name,
      'created_at': search.createdAt.toIso8601String(),
      'last_notified_at': search.lastNotifiedAt?.toIso8601String(),
    };
  }

  /// Supabase row-оос SavedSearch үүсгэх.
  SavedSearch _savedSearchFromRow(Map<String, dynamic> row) {
    return SavedSearch(
      id: row['id'] as String,
      userId: row['user_id'] as String,
      filters: Map<String, dynamic>.from(
        (row['filters'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      ),
      name: row['name'] as String,
      createdAt: DateTime.parse(row['created_at'] as String),
      lastNotifiedAt: row['last_notified_at'] != null
          ? DateTime.parse(row['last_notified_at'] as String)
          : null,
    );
  }

  /// Supabase row-оос MarketOffer үүсгэх.
  MarketOffer _offerFromRow(Map<String, dynamic> row) {
    return MarketOffer(
      id: row['id'] as String,
      listingId: row['listing_id'] as String,
      buyerId: row['buyer_id'] as String,
      sellerId: row['seller_id'] as String,
      amount: row['amount'] as int,
      status: MarketOfferStatus.fromString(
        row['status'] as String? ?? 'pending',
      ),
      counterAmount: row['counter_amount'] as int?,
      message: row['message'] as String?,
      createdAt: DateTime.parse(row['created_at'] as String),
      respondedAt: row['responded_at'] != null
          ? DateTime.parse(row['responded_at'] as String)
          : null,
    );
  }

  // ============================================================
  // Trial Slots
  // ============================================================

  /// Шинэ туршилтын цагийн цонх үүсгэх.
  Future<Result<TrialSlot>> createTrialSlot(TrialSlot slot) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());
      await client.from('trial_slots').insert({
        'id': slot.id,
        'listing_id': slot.listingId,
        'seller_id': slot.sellerId,
        'date': slot.date.toIso8601String(),
        'start_time': slot.startTime,
        'end_time': slot.endTime,
        'status': slot.status.name,
        'buyer_id': slot.buyerId,
        'notes': slot.notes,
        'created_at': slot.createdAt.toIso8601String(),
      });
      return Result.ok(slot);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Зарын бүх туршилтын цагийн цонхыг авах.
  Future<Result<List<TrialSlot>>> fetchTrialSlotsForListing(
    String listingId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);
      final response = await client
          .from('trial_slots')
          .select()
          .eq('listing_id', listingId)
          .order('date', ascending: true);
      final list = (response as List<dynamic>).cast<Map<String, dynamic>>();
      return Result.ok(list.map((row) => _trialSlotFromRow(row)).toList());
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Цагийн цонхны төлөвийг шинэчлэх.
  Future<Result<TrialSlot>> updateTrialSlot(TrialSlot slot) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());
      await client
          .from('trial_slots')
          .update({
            'date': slot.date.toIso8601String(),
            'start_time': slot.startTime,
            'end_time': slot.endTime,
            'status': slot.status.name,
            'buyer_id': slot.buyerId,
            'notes': slot.notes,
          })
          .eq('id', slot.id);
      return Result.ok(slot);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Цагийн цонх устгах.
  Future<Result<void>> deleteTrialSlot(String slotId) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());
      await client.from('trial_slots').delete().eq('id', slotId);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ============================================================
  // Trial Bookings
  // ============================================================

  /// Туршилтын захиалга үүсгэх.
  Future<Result<TrialBooking>> createTrialBooking(TrialBooking booking) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());
      await client.from('trial_bookings').insert({
        'id': booking.id,
        'listing_id': booking.listingId,
        'slot_id': booking.slotId,
        'buyer_id': booking.buyerId,
        'seller_id': booking.sellerId,
        'status': booking.status.name,
        'notes': booking.notes,
        'requested_at': booking.requestedAt.toIso8601String(),
        'responded_at': booking.respondedAt?.toIso8601String(),
      });
      return Result.ok(booking);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Захиалгын төлөвийг шинэчлэх.
  Future<Result<TrialBooking>> updateTrialBookingStatus({
    required String bookingId,
    required TrialBookingStatus status,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      // Fetch the booking to get the slotId before updating
      final bookingResponse =
          await client
                  .from('trial_bookings')
                  .select('slot_id')
                  .eq('id', bookingId)
                  .single()
              as Map<String, dynamic>?;
      final slotId = bookingResponse?['slot_id'] as String?;

      final updates = <String, dynamic>{'status': status.name};
      if (status == TrialBookingStatus.confirmed ||
          status == TrialBookingStatus.cancelled) {
        updates['responded_at'] = DateTime.now().toIso8601String();
      }
      await client.from('trial_bookings').update(updates).eq('id', bookingId);

      // If cancelled, revert the slot back to available
      if (status == TrialBookingStatus.cancelled && slotId != null) {
        await client
            .from('trial_slots')
            .update({'status': 'available', 'buyer_id': null})
            .eq('id', slotId);
      }

      // Return a minimal booking object
      final booking = TrialBooking(
        id: bookingId,
        listingId: '',
        slotId: '',
        buyerId: '',
        sellerId: '',
        status: status,
        requestedAt: DateTime.now(),
        respondedAt:
            status == TrialBookingStatus.confirmed ||
                status == TrialBookingStatus.cancelled
            ? DateTime.now()
            : null,
      );
      return Result.ok(booking);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Зарын бүх захиалгыг авах.
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForListing(
    String listingId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);
      final response = await client
          .from('trial_bookings')
          .select()
          .eq('listing_id', listingId)
          .order('requested_at', ascending: false);
      final list = (response as List<dynamic>).cast<Map<String, dynamic>>();
      return Result.ok(list.map((row) => _trialBookingFromRow(row)).toList());
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдан авагчийн бүх захиалгыг авах.
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForBuyer(
    String buyerId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);
      final response = await client
          .from('trial_bookings')
          .select()
          .eq('buyer_id', buyerId)
          .order('requested_at', ascending: false);
      final list = (response as List<dynamic>).cast<Map<String, dynamic>>();
      return Result.ok(list.map((row) => _trialBookingFromRow(row)).toList());
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Худалдагчийн бүх захиалгыг авах.
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForSeller(
    String sellerId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);
      final response = await client
          .from('trial_bookings')
          .select()
          .eq('seller_id', sellerId)
          .order('requested_at', ascending: false);
      final list = (response as List<dynamic>).cast<Map<String, dynamic>>();
      return Result.ok(list.map((row) => _trialBookingFromRow(row)).toList());
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  /// Захиалгыг ID-аар авах.
  Future<Result<TrialBooking?>> fetchTrialBookingById(String bookingId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok(null);
      final response = await client
          .from('trial_bookings')
          .select()
          .eq('id', bookingId)
          .single();
      final row = response;
      return Result.ok(_trialBookingFromRow(row));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Row Mappers ──────────────────────────────────────────────────

  TrialSlot _trialSlotFromRow(Map<String, dynamic> row) {
    return TrialSlot(
      id: row['id'] as String,
      listingId: row['listing_id'] as String,
      sellerId: row['seller_id'] as String,
      date: DateTime.parse(row['date'] as String),
      startTime: row['start_time'] as String,
      endTime: row['end_time'] as String,
      status: TrialSlotStatus.fromString(
        row['status'] as String? ?? 'available',
      ),
      buyerId: row['buyer_id'] as String?,
      notes: row['notes'] as String?,
      createdAt: DateTime.parse(row['created_at'] as String),
    );
  }

  TrialBooking _trialBookingFromRow(Map<String, dynamic> row) {
    return TrialBooking(
      id: row['id'] as String,
      listingId: row['listing_id'] as String,
      slotId: row['slot_id'] as String,
      buyerId: row['buyer_id'] as String,
      sellerId: row['seller_id'] as String,
      status: TrialBookingStatus.fromString(
        row['status'] as String? ?? 'requested',
      ),
      notes: row['notes'] as String?,
      requestedAt: DateTime.parse(row['requested_at'] as String),
      respondedAt: row['responded_at'] != null
          ? DateTime.parse(row['responded_at'] as String)
          : null,
    );
  }
}
