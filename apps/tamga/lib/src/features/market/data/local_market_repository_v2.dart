import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
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
import '../../shared/data/isar_schemas/isar_listing_report.dart';
import '../../shared/data/isar_schemas/isar_market_inquiry.dart';
import '../../shared/data/isar_schemas/isar_market_listing.dart';
import '../../shared/data/isar_schemas/isar_market_offer.dart';
import '../../shared/data/isar_schemas/isar_saved_search.dart';
import '../../shared/data/isar_schemas/isar_seller_rating.dart';
import '../../shared/data/isar_schemas/isar_seller_profile.dart';
import '../../shared/data/isar_schemas/isar_seller_verification.dart';
import '../../shared/data/isar_schemas/isar_trial_booking.dart';
import '../../shared/data/isar_schemas/isar_trial_slot.dart';
import '../../shared/data/pagination/paginated_result.dart';
import 'market_repository.dart';

/// Local-first MarketRepository implementation with SyncQueue, backed by Isar.
class LocalMarketRepositoryV2
    extends LocalRepository<MarketListing, IsarMarketListing>
    implements MarketRepository {
  LocalMarketRepositoryV2({required super.storage, required super.syncQueue});

  @override
  IsarCollection<IsarMarketListing> get collection => storage.marketListings;

  @override
  String get entityType => 'market';

  @override
  MarketListing toDomain(IsarMarketListing entity) => entity.toDomain();

  @override
  IsarMarketListing fromDomain(MarketListing entity) =>
      IsarMarketListing.fromDomain(entity);

  @override
  String domainIdOf(MarketListing entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(MarketListing entity) => entity.toJson();

  // ============================================================
  // CRUD (Result-based)
  // ============================================================

  @override
  Future<Result<List<MarketListing>>> fetchListings() async {
    return Result.tryFuture(() async {
      final stored = await storage.marketListings.where().findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<PaginatedResult<MarketListing>>> fetchListingsPaginated({
    required int page,
    required int limit,
  }) async {
    return Result.tryFuture(() async {
      final stored = await storage.marketListings
          .where()
          .offset(page * limit)
          .limit(limit)
          .findAll();
      final totalCount = await storage.marketListings.where().count();
      return PaginatedResult(
        items: stored.map((e) => e.toDomain()).toList(),
        totalCount: totalCount,
      );
    });
  }

  @override
  Future<Result<List<MarketListing>>> fetchListingsBySeller(
    String sellerId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.marketListings
          .filter()
          .sellerIdEqualTo(sellerId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<MarketListing>> saveListing(MarketListing listing) async {
    return Result.tryFuture(() async {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listing.id)
          .findFirst();
      final isNew = existing == null;

      final isarListing = IsarMarketListing.fromDomain(listing);
      if (!isNew) {
        isarListing.id = existing.id;
        // Preserve favorite state from existing record
        isarListing.isFavorite = existing.isFavorite;
      }
      await storage.marketListings.isar.writeTxn(() async {
        await storage.marketListings.put(isarListing);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listing.id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: listing.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return listing;
    });
  }

  @override
  Future<Result<void>> deleteListing(String id) async {
    return Result.tryFuture(() async {
      final toDelete = await storage.marketListings
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      if (toDelete != null) {
        await storage.marketListings.isar.writeTxn(() async {
          await storage.marketListings.delete(toDelete.id);
        });
        syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'market',
            entityId: id,
            action: SyncAction.delete,
            data: {},
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }

  @override
  Future<Result<MarketListing?>> fetchListingById(String id) async {
    return Result.tryFuture(() async {
      final stored = await storage.marketListings
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      return stored?.toDomain();
    });
  }

  @override
  Future<Result<void>> incrementViewsCount(String listingId) async {
    return Result.tryFuture(() async {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listingId)
          .findFirst();
      if (existing == null) return;

      final updated = IsarMarketListing()
        ..id = existing.id
        ..domainId = existing.domainId
        ..horseId = existing.horseId
        ..sellerId = existing.sellerId
        ..title = existing.title
        ..description = existing.description
        ..priceAmount = existing.priceAmount
        ..currency = existing.currency
        ..saleType = existing.saleType
        ..status = existing.status
        ..locationLabel = existing.locationLabel
        ..disciplineTags = existing.disciplineTags
        ..documentTags = existing.documentTags
        ..mediaUrls = existing.mediaUrls
        ..isSellerVerified = existing.isSellerVerified
        ..createdAt = existing.createdAt
        ..updatedAt = DateTime.now()
        ..viewsCount = existing.viewsCount + 1
        ..isFavorite = existing.isFavorite
        ..isFeatured = existing.isFeatured
        ..boostLevel = existing.boostLevel
        ..boostExpiresAt = existing.boostExpiresAt
        ..vipLevel = existing.vipLevel
        ..vipExpiresAt = existing.vipExpiresAt
        ..sellerBadge = existing.sellerBadge
        ..sellerBadgeExpiresAt = existing.sellerBadgeExpiresAt;

      await storage.marketListings.isar.writeTxn(() async {
        await storage.marketListings.put(updated);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listingId,
          action: SyncAction.update,
          data: updated.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  @override
  Future<Result<void>> markAsSold(String listingId) async {
    return _updateStatus(listingId, MarketListingStatus.sold);
  }

  @override
  Future<Result<void>> renewListing(String listingId) async {
    return _updateStatus(listingId, MarketListingStatus.active);
  }

  Future<Result<void>> _updateStatus(
    String listingId,
    MarketListingStatus newStatus,
  ) async {
    return Result.tryFuture(() async {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listingId)
          .findFirst();
      if (existing == null) return;

      final updated = IsarMarketListing()
        ..id = existing.id
        ..domainId = existing.domainId
        ..horseId = existing.horseId
        ..sellerId = existing.sellerId
        ..title = existing.title
        ..description = existing.description
        ..priceAmount = existing.priceAmount
        ..currency = existing.currency
        ..saleType = existing.saleType
        ..status = newStatus
        ..locationLabel = existing.locationLabel
        ..disciplineTags = existing.disciplineTags
        ..documentTags = existing.documentTags
        ..mediaUrls = existing.mediaUrls
        ..isSellerVerified = existing.isSellerVerified
        ..createdAt = existing.createdAt
        ..updatedAt = DateTime.now()
        ..viewsCount = existing.viewsCount
        ..isFavorite = existing.isFavorite
        ..isFeatured = existing.isFeatured
        ..boostLevel = existing.boostLevel
        ..boostExpiresAt = existing.boostExpiresAt
        ..vipLevel = existing.vipLevel
        ..vipExpiresAt = existing.vipExpiresAt
        ..sellerBadge = existing.sellerBadge
        ..sellerBadgeExpiresAt = existing.sellerBadgeExpiresAt;

      await storage.marketListings.isar.writeTxn(() async {
        await storage.marketListings.put(updated);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listingId,
          action: SyncAction.update,
          data: updated.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  // ============================================================
  // Favorites
  // ============================================================

  @override
  Future<Result<List<String>>> fetchFavoriteListingIds() async {
    try {
      final favorites = await storage.marketListings
          .filter()
          .isFavoriteEqualTo(true)
          .findAll();
      return Result.ok(favorites.map((e) => e.domainId).toList());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_FAVORITES_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<String>>> toggleFavorite(String listingId) async {
    try {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listingId)
          .findFirst();
      if (existing == null) return const Result.ok([]);

      await storage.marketListings.isar.writeTxn(() async {
        existing.isFavorite = !existing.isFavorite;
        await storage.marketListings.put(existing);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listingId,
          action: SyncAction.update,
          data: existing.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return fetchFavoriteListingIds();
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'TOGGLE_FAVORITE_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  // ============================================================
  // Seller / Safety
  // ============================================================

  @override
  Future<Result<SellerProfile?>> fetchSellerProfile(String sellerId) async {
    try {
      final count = await storage.sellerProfiles.where().count();
      if (count == 0) {
        await _seedSellerProfiles();
      }

      final existing = await storage.sellerProfiles
          .filter()
          .domainIdEqualTo(sellerId)
          .findFirst();
      return Result.ok(existing?.toDomain());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_SELLER_PROFILE_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  Future<void> _seedSellerProfiles() async {
    final profiles = [
      IsarSellerProfile()
        ..domainId = 'seller-tamga'
        ..displayName = 'Б. Бат-Эрдэнэ'
        ..stableName = 'Адуучин өрхийн жүчээ'
        ..locationLabel = 'Архангай, Эрдэнэбулган'
        ..verificationStatus = SellerVerificationStatus.trustedStable
        ..verificationLabel = 'Trusted stable \u2022 docs verified'
        ..responseNote = 'Ихэвчлэн 1 өдрийн дотор хариулна.'
        ..bio =
            'Өрхийн удам, уралдааны түүх, вакцин болон Coggins бүртгэлээ marketplace дээр ил тод хадгалдаг.'
        ..averageRating = 0.0
        ..ratingCount = 0
        ..reviews = [],
      IsarSellerProfile()
        ..domainId = 'seller-external'
        ..displayName = 'Г. Энхтүвшин'
        ..stableName = 'Хутаг-Өндөр адуу'
        ..locationLabel = 'Булган, Хутаг-Өндөр'
        ..verificationStatus = SellerVerificationStatus.unverified
        ..verificationLabel = 'Community seller \u2022 docs pending'
        ..responseNote = 'Trade санал болон үзлэгийн цаг тохирно.'
        ..bio =
            'Гаднах бүртгэлтэй адууны заруудыг lineage evidence-тэй холбон оруулж байна.'
        ..averageRating = 0.0
        ..ratingCount = 0
        ..reviews = [],
    ];
    await storage.sellerProfiles.isar.writeTxn(() async {
      await storage.sellerProfiles.putAll(profiles);
    });
  }

  @override
  Future<Result<List<MarketInquiry>>> fetchInquiries(String listingId) async {
    try {
      final stored = await storage.marketInquiries
          .filter()
          .listingIdEqualTo(listingId)
          .findAll();
      return Result.ok(stored.map((e) => e.toDomain()).toList());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_INQUIRIES_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<MarketInquiry>> createInquiry({
    required String listingId,
    required String buyerId,
    required String sellerId,
  }) async {
    try {
      final now = DateTime.now();
      final inquiry = MarketInquiry(
        id: 'inquiry-${now.millisecondsSinceEpoch}',
        listingId: listingId,
        buyerId: buyerId,
        sellerId: sellerId,
        status: MarketInquiryStatus.newInquiry,
        createdAt: now,
        updatedAt: now,
      );

      final isarInquiry = IsarMarketInquiry()
        ..domainId = inquiry.id
        ..listingId = inquiry.listingId
        ..buyerId = inquiry.buyerId
        ..sellerId = inquiry.sellerId
        ..status = inquiry.status
        ..createdAt = inquiry.createdAt
        ..updatedAt = inquiry.updatedAt;

      await storage.marketInquiries.isar.writeTxn(() async {
        await storage.marketInquiries.put(isarInquiry);
      });

      return Result.ok(inquiry);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'CREATE_INQUIRY_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<ListingReport>>> fetchReports(String listingId) async {
    try {
      final stored = await storage.listingReports
          .filter()
          .listingIdEqualTo(listingId)
          .findAll();
      return Result.ok(stored.map((e) => e.toDomain()).toList());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_REPORTS_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<ListingReport>>> fetchAllReports() async {
    try {
      final stored = await storage.listingReports.where().findAll();
      return Result.ok(stored.map((e) => e.toDomain()).toList());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_ALL_REPORTS_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<void>> resolveReport(
    String reportId,
    ListingReportStatus newStatus,
  ) async {
    try {
      final existing = await storage.listingReports
          .filter()
          .domainIdEqualTo(reportId)
          .findFirst();
      if (existing == null) {
        return Result.fail(
          AppException(
            message: 'Report not found: $reportId',
            code: 'REPORT_NOT_FOUND',
          ),
        );
      }

      final updated = IsarListingReport()
        ..id = existing.id
        ..domainId = existing.domainId
        ..listingId = existing.listingId
        ..reporterId = existing.reporterId
        ..reason = existing.reason
        ..status = newStatus
        ..createdAt = existing.createdAt;

      await storage.listingReports.isar.writeTxn(() async {
        await storage.listingReports.put(updated);
      });

      return const Result.ok(null);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'RESOLVE_REPORT_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<ListingReport>> createReport({
    required String listingId,
    required String reporterId,
    required String reason,
  }) async {
    try {
      final now = DateTime.now();
      final report = ListingReport(
        id: 'report-${now.millisecondsSinceEpoch}',
        listingId: listingId,
        reporterId: reporterId,
        reason: reason,
        status: ListingReportStatus.submitted,
        createdAt: now,
      );

      final isarReport = IsarListingReport()
        ..domainId = report.id
        ..listingId = report.listingId
        ..reporterId = report.reporterId
        ..reason = report.reason
        ..status = report.status
        ..createdAt = report.createdAt;

      await storage.listingReports.isar.writeTxn(() async {
        await storage.listingReports.put(isarReport);
      });

      return Result.ok(report);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'CREATE_REPORT_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<SellerRating>> submitSellerRating({
    required String listingId,
    required String sellerId,
    required String buyerId,
    required int rating,
    required String review,
  }) async {
    try {
      final now = DateTime.now();
      final domainRating = SellerRating(
        id: 'rating-${now.millisecondsSinceEpoch}',
        listingId: listingId,
        sellerId: sellerId,
        buyerId: buyerId,
        rating: rating.clamp(1, 5),
        review: review,
        createdAt: now,
      );

      final isarRating = IsarSellerRating.fromDomain(domainRating);
      await storage.sellerRatings.isar.writeTxn(() async {
        await storage.sellerRatings.put(isarRating);
      });

      // Update seller profile average rating
      await _updateSellerAverageRating(sellerId);

      // Enqueue sync
      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'seller_rating',
          entityId: domainRating.id,
          action: SyncAction.create,
          data: domainRating.toJson(),
          timestamp: now,
        ),
      );

      return Result.ok(domainRating);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SUBMIT_RATING_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<SellerRating>>> fetchSellerRatings(String sellerId) async {
    try {
      final stored = await storage.sellerRatings
          .filter()
          .sellerIdEqualTo(sellerId)
          .sortByCreatedAtDesc()
          .findAll();
      return Result.ok(stored.map((e) => e.toDomain()).toList());
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_RATINGS_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<SellerRatingSummary>> fetchSellerRatingSummary(
    String sellerId,
  ) async {
    try {
      final stored = await storage.sellerRatings
          .filter()
          .sellerIdEqualTo(sellerId)
          .findAll();
      final ratings = stored.map((e) => e.toDomain()).toList();
      return Result.ok(SellerRatingSummary.fromRatings(ratings));
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_RATING_SUMMARY_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<void>> respondToReview({
    required String ratingId,
    required String response,
  }) async {
    try {
      final existing = await storage.sellerRatings
          .filter()
          .domainIdEqualTo(ratingId)
          .findFirst();
      if (existing == null) {
        return Result.fail(
          AppException(
            message: 'Үнэлгээ олдсонгүй: $ratingId',
            code: 'RATING_NOT_FOUND',
          ),
        );
      }

      final now = DateTime.now();
      final updated = IsarSellerRating()
        ..id = existing.id
        ..domainId = existing.domainId
        ..listingId = existing.listingId
        ..sellerId = existing.sellerId
        ..buyerId = existing.buyerId
        ..rating = existing.rating
        ..review = existing.review
        ..createdAt = existing.createdAt
        ..sellerResponse = response
        ..responseAt = now;

      await storage.sellerRatings.isar.writeTxn(() async {
        await storage.sellerRatings.put(updated);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'seller_rating',
          entityId: ratingId,
          action: SyncAction.update,
          data: updated.toDomain().toJson(),
          timestamp: now,
        ),
      );

      return const Result.ok(null);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'RESPOND_REVIEW_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  // ── Rating helpers ────────────────────────────────────────────────

  /// Худалдагчийн дундаж үнэлгээг шинэчлэх.
  Future<void> _updateSellerAverageRating(String sellerId) async {
    final stored = await storage.sellerRatings
        .filter()
        .sellerIdEqualTo(sellerId)
        .findAll();
    final summary = SellerRatingSummary.fromRatings(
      stored.map((e) => e.toDomain()).toList(),
    );

    final profile = await storage.sellerProfiles
        .filter()
        .domainIdEqualTo(sellerId)
        .findFirst();

    if (profile == null) return;

    final updated = IsarSellerProfile()
      ..id = profile.id
      ..domainId = profile.domainId
      ..displayName = profile.displayName
      ..stableName = profile.stableName
      ..locationLabel = profile.locationLabel
      ..verificationStatus = profile.verificationStatus
      ..verificationLabel = profile.verificationLabel
      ..responseNote = profile.responseNote
      ..bio = profile.bio
      ..averageRating = summary.averageRating
      ..ratingCount = summary.totalCount
      ..reviews = stored.map((e) => '[${e.rating}★] ${e.review}').toList();

    await storage.sellerProfiles.isar.writeTxn(() async {
      await storage.sellerProfiles.put(updated);
    });
  }

  // ============================================================
  // Phase 3 stubs
  // ============================================================

  final Map<String, DigitalCertificate> _certificates = {};

  @override
  Future<Result<DigitalCertificate?>> fetchCertificateForHorse(
    String horseId,
  ) async {
    try {
      if (horseId == 'altan-shuurga') {
        return Result.ok(
          DigitalCertificate(
            id: 'cert-altan',
            horseId: 'altan-shuurga',
            ownerId: 'seller-tamga',
            issuer: 'Tamga Official Registrar',
            issueDate: DateTime(2025, 1, 15),
            certificateHash: 'seed-hash-altan',
            isVerified: true,
          ),
        );
      }
      return Result.ok(_certificates[horseId]);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_CERTIFICATE_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<DigitalCertificate>> issueCertificate({
    required String horseId,
    required String ownerId,
    required String issuer,
  }) async {
    try {
      final now = DateTime.now();
      final cert = DigitalCertificate(
        id: 'cert-${now.millisecondsSinceEpoch}',
        horseId: horseId,
        ownerId: ownerId,
        issuer: issuer,
        issueDate: now,
        certificateHash: 'hash-${now.millisecondsSinceEpoch}',
        isVerified: true,
      );
      _certificates[horseId] = cert;
      return Result.ok(cert);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'ISSUE_CERTIFICATE_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<DigitalCertificate>> transferCertificate({
    required String horseId,
    required String newOwnerId,
  }) async {
    try {
      final cert = _certificates[horseId];
      if (cert == null) {
        return Result.fail(
          AppException(
            message: 'Certificate not found for horse: $horseId',
            code: 'CERTIFICATE_NOT_FOUND',
            details: {'horseId': horseId},
          ),
        );
      }
      final updated = cert.copyWith(ownerId: newOwnerId);
      _certificates[horseId] = updated;
      return Result.ok(updated);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'TRANSFER_CERTIFICATE_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<PriceHistoryRecord>>> fetchPriceHistory() async {
    try {
      return Result.ok([
        PriceHistoryRecord(
          id: 'ph-1',
          horseName: 'Алтан Шуурга',
          lineageRootId: 'khan-khuleg',
          priceAmount: 18500000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          date: DateTime(2025, 8, 15),
          region: 'Архангай',
        ),
        PriceHistoryRecord(
          id: 'ph-2',
          horseName: 'Үүлэн Бор',
          lineageRootId: 'uulen-bor',
          priceAmount: 9200000,
          currency: 'MNT',
          saleType: MarketSaleType.lease,
          date: DateTime(2025, 9, 1),
          region: 'Төв',
        ),
        PriceHistoryRecord(
          id: 'ph-3',
          horseName: 'Шандас Гал',
          lineageRootId: 'shandas-gal',
          priceAmount: 12500000,
          currency: 'MNT',
          saleType: MarketSaleType.trade,
          date: DateTime(2025, 10, 10),
          region: 'Булган',
        ),
        PriceHistoryRecord(
          id: 'ph-4',
          horseName: 'Хан Хүлэг',
          lineageRootId: 'khan-khuleg',
          priceAmount: 25000000,
          currency: 'MNT',
          saleType: MarketSaleType.stud,
          date: DateTime(2025, 6, 20),
          region: 'Архангай',
        ),
        PriceHistoryRecord(
          id: 'ph-5',
          horseName: 'Хөх Сүлд',
          lineageRootId: 'khukh-suld',
          priceAmount: 15000000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          date: DateTime(2025, 11, 5),
          region: 'Өвөрхангай',
        ),
        PriceHistoryRecord(
          id: 'ph-6',
          horseName: 'Мөнгөн Хийморь',
          lineageRootId: 'munguun-khiimor',
          priceAmount: 8000000,
          currency: 'MNT',
          saleType: MarketSaleType.sale,
          date: DateTime(2026, 1, 12),
          region: 'Дархан-Уул',
        ),
      ]);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_PRICE_HISTORY_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  // ============================================================
  // Boost / VIP / Badge
  // ============================================================

  @override
  Future<Result<void>> boostListing({
    required String listingId,
    required BoostLevel level,
    required DateTime expiresAt,
  }) async {
    try {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listingId)
          .findFirst();
      if (existing == null) return const Result.ok(null);

      await storage.marketListings.isar.writeTxn(() async {
        existing.boostLevel = level;
        existing.boostExpiresAt = expiresAt;
        await storage.marketListings.put(existing);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listingId,
          action: SyncAction.update,
          data: existing.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'BOOST_LISTING_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<void>> setVipLevel({
    required String listingId,
    required VipLevel level,
    required DateTime expiresAt,
  }) async {
    try {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listingId)
          .findFirst();
      if (existing == null) return const Result.ok(null);

      await storage.marketListings.isar.writeTxn(() async {
        existing.vipLevel = level;
        existing.vipExpiresAt = expiresAt;
        await storage.marketListings.put(existing);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listingId,
          action: SyncAction.update,
          data: existing.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SET_VIP_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<void>> setSellerBadge({
    required String listingId,
    required SellerBadgeType badge,
    required DateTime expiresAt,
  }) async {
    try {
      final existing = await storage.marketListings
          .filter()
          .domainIdEqualTo(listingId)
          .findFirst();
      if (existing == null) return const Result.ok(null);

      await storage.marketListings.isar.writeTxn(() async {
        existing.sellerBadge = badge;
        existing.sellerBadgeExpiresAt = expiresAt;
        await storage.marketListings.put(existing);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market',
          entityId: listingId,
          action: SyncAction.update,
          data: existing.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SET_BADGE_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  // ============================================================
  // Seller Verification
  // ============================================================

  @override
  Future<Result<SellerPhoneVerification>> savePhoneVerification(
    SellerPhoneVerification verification,
  ) async {
    return Result.tryFuture(() async {
      final existing = await storage.sellerPhoneVerifications
          .filter()
          .domainIdEqualTo(verification.id)
          .findFirst();

      final isarRecord = IsarSellerPhoneVerification.fromDomain(verification);
      if (existing != null) {
        isarRecord.id = existing.id;
      }

      await storage.sellerPhoneVerifications.isar.writeTxn(() async {
        await storage.sellerPhoneVerifications.put(isarRecord);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'seller_phone_verification',
          entityId: verification.id,
          action: existing == null ? SyncAction.create : SyncAction.update,
          data: verification.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return verification;
    });
  }

  @override
  Future<Result<SellerPhoneVerification?>> fetchPhoneVerification(
    String sellerId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.sellerPhoneVerifications
          .filter()
          .sellerIdEqualTo(sellerId)
          .findFirst();
      return stored?.toDomain();
    });
  }

  @override
  Future<Result<void>> markSellerListingsVerified(String sellerId) async {
    return Result.tryFuture(() async {
      final listings = await storage.marketListings
          .filter()
          .sellerIdEqualTo(sellerId)
          .findAll();

      if (listings.isEmpty) return;

      await storage.marketListings.isar.writeTxn(() async {
        for (final listing in listings) {
          listing.isSellerVerified = true;
          await storage.marketListings.put(listing);
        }
      });

      for (final listing in listings) {
        syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'market',
            entityId: listing.domainId,
            action: SyncAction.update,
            data: listing.toDomain().toJson(),
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }

  @override
  Future<Result<void>> markSellerListingsUnverified(String sellerId) async {
    return Result.tryFuture(() async {
      final listings = await storage.marketListings
          .filter()
          .sellerIdEqualTo(sellerId)
          .findAll();

      if (listings.isEmpty) return;

      await storage.marketListings.isar.writeTxn(() async {
        for (final listing in listings) {
          listing.isSellerVerified = false;
          await storage.marketListings.put(listing);
        }
      });

      for (final listing in listings) {
        syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'market',
            entityId: listing.domainId,
            action: SyncAction.update,
            data: listing.toDomain().toJson(),
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }

  @override
  Future<Result<EMongoliaVerification>> saveEMongoliaVerification(
    EMongoliaVerification verification,
  ) async {
    return Result.tryFuture(() async {
      final existing = await storage.eMongoliaVerifications
          .filter()
          .domainIdEqualTo(verification.id)
          .findFirst();

      final isarRecord = IsarEMongoliaVerification.fromDomain(verification);
      if (existing != null) {
        isarRecord.id = existing.id;
      }

      await storage.eMongoliaVerifications.isar.writeTxn(() async {
        await storage.eMongoliaVerifications.put(isarRecord);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'e_mongolia_verification',
          entityId: verification.id,
          action: existing == null ? SyncAction.create : SyncAction.update,
          data: verification.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return verification;
    });
  }

  @override
  Future<Result<EMongoliaVerification?>> fetchEMongoliaVerification(
    String sellerId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.eMongoliaVerifications
          .filter()
          .sellerIdEqualTo(sellerId)
          .findFirst();
      return stored?.toDomain();
    });
  }

  @override
  Future<Result<SellerVerificationStatusSummary>>
  fetchSellerVerificationSummary(String sellerId) async {
    return Result.tryFuture(() async {
      final phoneVerification = await storage.sellerPhoneVerifications
          .filter()
          .sellerIdEqualTo(sellerId)
          .findFirst();

      final eMongoliaVerification = await storage.eMongoliaVerifications
          .filter()
          .sellerIdEqualTo(sellerId)
          .findFirst();

      return SellerVerificationStatusSummary(
        phoneVerified: phoneVerification?.isVerified ?? false,
        eMongoliaVerified: eMongoliaVerification?.isVerified ?? false,
        phone: phoneVerification?.phone,
        eMongoliaVerification: eMongoliaVerification?.toDomain(),
      );
    });
  }

  // ============================================================
  // Saved Searches
  // ============================================================

  @override
  Future<Result<SavedSearch>> saveSavedSearch(SavedSearch search) async {
    return Result.tryFuture(() async {
      final existing = await storage.savedSearches
          .filter()
          .domainIdEqualTo(search.id)
          .findFirst();
      final isNew = existing == null;

      final isarSearch = IsarSavedSearch.fromDomain(search);
      if (!isNew) {
        isarSearch.id = existing.id;
      }

      await storage.savedSearches.isar.writeTxn(() async {
        await storage.savedSearches.put(isarSearch);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'saved_search',
          entityId: search.id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: search.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return search;
    });
  }

  @override
  Future<Result<void>> deleteSavedSearch(String id) async {
    return Result.tryFuture(() async {
      final toDelete = await storage.savedSearches
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      if (toDelete != null) {
        await storage.savedSearches.isar.writeTxn(() async {
          await storage.savedSearches.delete(toDelete.id);
        });

        syncQueue.enqueue(
          SyncQueueItem(
            entityType: 'saved_search',
            entityId: id,
            action: SyncAction.delete,
            data: {},
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }

  @override
  Future<Result<List<SavedSearch>>> fetchSavedSearches(String userId) async {
    return Result.tryFuture(() async {
      final stored = await storage.savedSearches
          .filter()
          .userIdEqualTo(userId)
          .sortByCreatedAtDesc()
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<SavedSearch>> updateSavedSearchName(
    String id,
    String newName,
  ) async {
    return Result.tryFuture(() async {
      final existing = await storage.savedSearches
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      if (existing == null) {
        throw AppException(
          message: 'Хадгалсан хайлт олдсонгүй: $id',
          code: 'SAVED_SEARCH_NOT_FOUND',
        );
      }

      final updated = IsarSavedSearch()
        ..id = existing.id
        ..domainId = existing.domainId
        ..userId = existing.userId
        ..filtersJson = existing.filtersJson
        ..name = newName
        ..createdAt = existing.createdAt
        ..lastNotifiedAt = existing.lastNotifiedAt;

      await storage.savedSearches.isar.writeTxn(() async {
        await storage.savedSearches.put(updated);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'saved_search',
          entityId: id,
          action: SyncAction.update,
          data: updated.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return updated.toDomain();
    });
  }

  @override
  Future<Result<void>> updateSavedSearchLastNotifiedAt(
    String id,
    DateTime notifiedAt,
  ) async {
    return Result.tryFuture(() async {
      final existing = await storage.savedSearches
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      if (existing == null) return;

      final updated = IsarSavedSearch()
        ..id = existing.id
        ..domainId = existing.domainId
        ..userId = existing.userId
        ..filtersJson = existing.filtersJson
        ..name = existing.name
        ..createdAt = existing.createdAt
        ..lastNotifiedAt = notifiedAt;

      await storage.savedSearches.isar.writeTxn(() async {
        await storage.savedSearches.put(updated);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'saved_search',
          entityId: id,
          action: SyncAction.update,
          data: updated.toDomain().toJson(),
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  @override
  Future<Result<List<SavedSearch>>> fetchAllSavedSearches() async {
    return Result.tryFuture(() async {
      final stored = await storage.savedSearches.where().findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  // ============================================================
  // Offers
  // ============================================================

  @override
  Future<Result<MarketOffer>> createOffer(MarketOffer offer) async {
    return Result.tryFuture(() async {
      final isarOffer = IsarMarketOffer.fromDomain(offer);
      await storage.marketOffers.isar.writeTxn(() async {
        await storage.marketOffers.put(isarOffer);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'offer',
          entityId: offer.id,
          action: SyncAction.create,
          data: offer.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return offer;
    });
  }

  @override
  Future<Result<MarketOffer>> respondToOffer({
    required String offerId,
    required MarketOfferStatus status,
    int? counterAmount,
  }) async {
    return Result.tryFuture(() async {
      final existing = await storage.marketOffers
          .filter()
          .domainIdEqualTo(offerId)
          .findFirst();

      if (existing == null) {
        throw AppException(message: 'Санал олдсонгүй', code: 'OFFER_NOT_FOUND');
      }

      await storage.marketOffers.isar.writeTxn(() async {
        existing.status = status.name;
        existing.counterAmount = counterAmount;
        existing.respondedAt = DateTime.now();
        await storage.marketOffers.put(existing);
      });

      final domain = existing.toDomain();

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'offer',
          entityId: offerId,
          action: SyncAction.update,
          data: domain.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return domain;
    });
  }

  @override
  Future<Result<List<MarketOffer>>> fetchOffersForListing(
    String listingId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.marketOffers
          .filter()
          .listingIdEqualTo(listingId)
          .findAll();

      stored.sort(
        (a, b) => (b.createdAt ?? DateTime(2000)).compareTo(
          a.createdAt ?? DateTime(2000),
        ),
      );

      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<MarketOffer>>> fetchOffersForUser(String userId) async {
    return Result.tryFuture(() async {
      final stored = await storage.marketOffers
          .filter()
          .group((q) => q.buyerIdEqualTo(userId).or().sellerIdEqualTo(userId))
          .findAll();

      stored.sort(
        (a, b) => (b.createdAt ?? DateTime(2000)).compareTo(
          a.createdAt ?? DateTime(2000),
        ),
      );

      return stored.map((e) => e.toDomain()).toList();
    });
  }

  // ============================================================
  // Trial Slots
  // ============================================================

  @override
  Future<Result<TrialSlot>> createTrialSlot(TrialSlot slot) async {
    return Result.tryFuture(() async {
      final isarSlot = IsarTrialSlot.fromDomain(slot);
      await storage.trialSlots.isar.writeTxn(() async {
        await storage.trialSlots.put(isarSlot);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'trial_slot',
          entityId: slot.id,
          action: SyncAction.create,
          data: slot.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return slot;
    });
  }

  @override
  Future<Result<List<TrialSlot>>> fetchTrialSlotsForListing(
    String listingId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.trialSlots
          .filter()
          .listingIdEqualTo(listingId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<TrialSlot>> updateTrialSlot(TrialSlot slot) async {
    return Result.tryFuture(() async {
      final existing = await storage.trialSlots
          .filter()
          .domainIdEqualTo(slot.id)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Цагийн цонх олдсонгүй',
          code: 'TRIAL_SLOT_NOT_FOUND',
        );
      }

      final updated = IsarTrialSlot.fromDomain(slot);
      updated.id = existing.id;
      await storage.trialSlots.isar.writeTxn(() async {
        await storage.trialSlots.put(updated);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'trial_slot',
          entityId: slot.id,
          action: SyncAction.update,
          data: slot.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return slot;
    });
  }

  @override
  Future<Result<void>> deleteTrialSlot(String slotId) async {
    return Result.tryFuture(() async {
      final existing = await storage.trialSlots
          .filter()
          .domainIdEqualTo(slotId)
          .findFirst();

      if (existing != null) {
        await storage.trialSlots.isar.writeTxn(() async {
          await storage.trialSlots.delete(existing.id);
        });
      }

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'trial_slot',
          entityId: slotId,
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  // ============================================================
  // Trial Bookings
  // ============================================================

  @override
  Future<Result<TrialBooking>> createTrialBooking(TrialBooking booking) async {
    return Result.tryFuture(() async {
      final isarBooking = IsarTrialBooking.fromDomain(booking);
      await storage.trialBookings.isar.writeTxn(() async {
        await storage.trialBookings.put(isarBooking);
      });

      // Update the trial slot status to booked
      final existingSlot = await storage.trialSlots
          .filter()
          .domainIdEqualTo(booking.slotId)
          .findFirst();
      if (existingSlot != null) {
        await storage.trialSlots.isar.writeTxn(() async {
          existingSlot.status = TrialSlotStatus.booked.name;
          existingSlot.buyerId = booking.buyerId;
          await storage.trialSlots.put(existingSlot);
        });
      }

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'trial_booking',
          entityId: booking.id,
          action: SyncAction.create,
          data: booking.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return booking;
    });
  }

  @override
  Future<Result<TrialBooking>> updateTrialBookingStatus({
    required String bookingId,
    required TrialBookingStatus status,
  }) async {
    return Result.tryFuture(() async {
      final existing = await storage.trialBookings
          .filter()
          .domainIdEqualTo(bookingId)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Захиалга олдсонгүй',
          code: 'TRIAL_BOOKING_NOT_FOUND',
        );
      }

      await storage.trialBookings.isar.writeTxn(() async {
        existing.status = status.name;
        if (status == TrialBookingStatus.confirmed ||
            status == TrialBookingStatus.cancelled) {
          existing.respondedAt = DateTime.now();
        }
        await storage.trialBookings.put(existing);
      });

      // If cancelled, revert the associated trial slot back to available
      if (status == TrialBookingStatus.cancelled) {
        final existingSlot = await storage.trialSlots
            .filter()
            .domainIdEqualTo(existing.slotId)
            .findFirst();
        if (existingSlot != null) {
          await storage.trialSlots.isar.writeTxn(() async {
            existingSlot.status = TrialSlotStatus.available.name;
            existingSlot.buyerId = null;
            await storage.trialSlots.put(existingSlot);
          });

          syncQueue.enqueue(
            SyncQueueItem(
              entityType: 'trial_slot',
              entityId: existing.slotId,
              action: SyncAction.update,
              data: existingSlot.toDomain().toJson(),
              timestamp: DateTime.now(),
            ),
          );
        }
      }

      final domain = existing.toDomain();

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'trial_booking',
          entityId: bookingId,
          action: SyncAction.update,
          data: domain.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return domain;
    });
  }

  @override
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForListing(
    String listingId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.trialBookings
          .filter()
          .listingIdEqualTo(listingId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForBuyer(
    String buyerId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.trialBookings
          .filter()
          .buyerIdEqualTo(buyerId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<TrialBooking>>> fetchTrialBookingsForSeller(
    String sellerId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await storage.trialBookings
          .filter()
          .sellerIdEqualTo(sellerId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<TrialBooking?>> fetchTrialBookingById(String bookingId) async {
    return Result.tryFuture(() async {
      final stored = await storage.trialBookings
          .filter()
          .domainIdEqualTo(bookingId)
          .findFirst();
      return stored?.toDomain();
    });
  }
}
