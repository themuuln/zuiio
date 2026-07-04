import 'package:isar/isar.dart';

import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_listing_report.dart';
import '../../shared/data/isar_schemas/isar_market_inquiry.dart';
import '../../shared/data/isar_schemas/isar_market_listing.dart';
import '../../shared/data/isar_schemas/isar_seller_profile.dart';
import '../domain/digital_certificate.dart';
import '../domain/market_listing.dart';
import '../domain/market_safety.dart';
import '../domain/price_history.dart';

/// Legacy local market repository with non-Result methods and no sync support.
///
/// Replaced by [LocalMarketRepositoryV2] which implements [MarketRepository],
/// returns [Result] types consistently, and integrates with the sync queue.
/// This class is retained only for backward compatibility during migration
/// and should not be used in new code.
@Deprecated('Use LocalMarketRepositoryV2')
class LocalMarketRepository {
  LocalMarketRepository(this._storage);

  final IsarStorage _storage;

  static final _now = DateTime(2026, 4, 24);

  static final _seed = [
    MarketListing(
      id: 'listing-altan-shuurga',
      horseId: 'altan-shuurga',
      sellerId: 'seller-tamga',
      title: 'Алтан Шуурга - уралдааны туршлагатай хээр үрээ',
      description:
          'Өрхийн удам, performance history, Coggins болон вакцины бүртгэлтэй. Туршлагатай унаачид тохиромжтой.',
      priceAmount: 18500000,
      currency: 'MNT',
      saleType: MarketSaleType.sale,
      status: MarketListingStatus.active,
      locationLabel: 'Архангай, Эрдэнэбулган',
      disciplineTags: ['Уралдаан', 'Наадам', 'Lineage verified'],
      documentTags: ['Coggins', 'Vaccination', 'Pedigree'],
      mediaUrls: ['market://altan-shuurga/cover'],
      isSellerVerified: true,
      createdAt: _now.subtract(const Duration(days: 8)),
      updatedAt: _now.subtract(const Duration(days: 1)),
    ),
    MarketListing(
      id: 'listing-uulen-bor',
      horseId: 'uulen-bor',
      sellerId: 'seller-tamga',
      title: 'Үүлэн Бор - гүүний шугамын баталгаатай бүртгэл',
      description:
          'Өрхийн бүртгэлтэй, тайван зан араншинтай. Үржүүлэг болон удам үргэжлүүлэхэд тохиромжтой.',
      priceAmount: 9200000,
      currency: 'MNT',
      saleType: MarketSaleType.lease,
      status: MarketListingStatus.active,
      locationLabel: 'Төв, Сэргэлэн',
      disciplineTags: ['Үржүүлэг', 'Өрхийн', 'Beginner-safe'],
      documentTags: ['Pedigree', 'Vet note'],
      mediaUrls: ['market://uulen-bor/cover'],
      isSellerVerified: true,
      createdAt: _now.subtract(const Duration(days: 5)),
      updatedAt: _now.subtract(const Duration(hours: 12)),
    ),
    MarketListing(
      id: 'listing-shandas-gal',
      horseId: 'shandas-gal',
      sellerId: 'seller-external',
      title: 'Шандас Гал - trade санал сонсоно',
      description:
          'Гаднах бүртгэлтэй ч lineage болон events дээр холбогдсон. Солилцоо болон private treaty санал авна.',
      priceAmount: 12500000,
      currency: 'MNT',
      saleType: MarketSaleType.trade,
      status: MarketListingStatus.active,
      locationLabel: 'Булган, Хутаг-Өндөр',
      disciplineTags: ['Уралдаан', 'Trade', 'External'],
      documentTags: ['Pedigree'],
      mediaUrls: const [],
      isSellerVerified: false,
      createdAt: _now.subtract(const Duration(days: 2)),
      updatedAt: _now.subtract(const Duration(days: 2)),
    ),
  ];

  static const _profileSeed = [
    SellerProfile(
      sellerId: 'seller-tamga',
      displayName: 'Б. Бат-Эрдэнэ',
      stableName: 'Адуучин өрхийн жүчээ',
      locationLabel: 'Архангай, Эрдэнэбулган',
      verificationStatus: SellerVerificationStatus.trustedStable,
      verificationLabel: 'Trusted stable • docs verified',
      responseNote: 'Ихэвчлэн 1 өдрийн дотор хариулна.',
      bio:
          'Өрхийн удам, уралдааны түүх, вакцин болон Coggins бүртгэлээ marketplace дээр ил тод хадгалдаг.',
    ),
    SellerProfile(
      sellerId: 'seller-external',
      displayName: 'Г. Энхтүвшин',
      stableName: 'Хутаг-Өндөр адуу',
      locationLabel: 'Булган, Хутаг-Өндөр',
      verificationStatus: SellerVerificationStatus.unverified,
      verificationLabel: 'Community seller • docs pending',
      responseNote: 'Trade санал болон үзлэгийн цаг тохирно.',
      bio:
          'Гаднах бүртгэлтэй адууны заруудыг lineage evidence-тэй холбон оруулж байна.',
    ),
    SellerProfile(
      sellerId: 'seller-local',
      displayName: 'Local seller',
      stableName: 'My stable',
      locationLabel: 'Улаанбаатар',
      verificationStatus: SellerVerificationStatus.verified,
      verificationLabel: 'Local profile • self verified',
      responseNote: 'Local-first demo profile.',
      bio: 'Төхөөрөмж дээр хадгалагдсан local marketplace seller profile.',
    ),
  ];

  Future<List<MarketListing>> fetchListings() => _readListings();

  Future<List<String>> fetchFavoriteListingIds() async {
    // Favorites stored separately — return empty for now (local-only feature)
    return [];
  }

  Future<SellerProfile?> fetchSellerProfile(String sellerId) async {
    final profiles = await _readProfiles();
    for (final profile in profiles) {
      if (profile.sellerId == sellerId) {
        return profile;
      }
    }
    return null;
  }

  Future<List<MarketInquiry>> fetchInquiries(String listingId) async {
    final inquiries = await _readInquiries();
    return inquiries.where((item) => item.listingId == listingId).toList();
  }

  Future<MarketInquiry> createInquiry({
    required String listingId,
    required String buyerId,
    required String sellerId,
  }) async {
    final inquiries = await _readInquiries();
    for (final inquiry in inquiries) {
      if (inquiry.listingId == listingId &&
          inquiry.buyerId == buyerId &&
          inquiry.sellerId == sellerId) {
        return inquiry;
      }
    }

    final now = DateTime.now();
    final inquiry = MarketInquiry(
      id: 'inquiry-${now.microsecondsSinceEpoch}',
      listingId: listingId,
      buyerId: buyerId,
      sellerId: sellerId,
      status: MarketInquiryStatus.newInquiry,
      createdAt: now,
      updatedAt: now,
    );
    await _storage.marketInquiries.isar.writeTxn(() async {
      await _storage.marketInquiries.put(IsarMarketInquiry.fromDomain(inquiry));
    });
    return inquiry;
  }

  Future<ListingReport> createReport({
    required String listingId,
    required String reporterId,
    required String reason,
  }) async {
    final now = DateTime.now();
    final report = ListingReport(
      id: 'report-${now.microsecondsSinceEpoch}',
      listingId: listingId,
      reporterId: reporterId,
      reason: reason,
      status: ListingReportStatus.submitted,
      createdAt: now,
    );
    await _storage.listingReports.isar.writeTxn(() async {
      await _storage.listingReports.put(IsarListingReport.fromDomain(report));
    });
    return report;
  }

  Future<List<ListingReport>> fetchReports(String listingId) async {
    final reports = await _readReports();
    return reports.where((item) => item.listingId == listingId).toList();
  }

  Future<List<MarketListing>> saveListing(MarketListing listing) async {
    final local = await _readListings();
    final index = local.indexWhere((item) => item.id == listing.id);
    final next = [...local];
    if (index >= 0) {
      next[index] = listing.copyWith(updatedAt: DateTime.now());
    } else {
      next.insert(0, listing);
    }
    await _writeListings(next);
    return next;
  }

  Future<List<MarketListing>> updateListingStatus(
    String listingId,
    MarketListingStatus status,
  ) async {
    final local = await _readListings();
    final next = local
        .map(
          (item) => item.id == listingId
              ? item.copyWith(status: status, updatedAt: DateTime.now())
              : item,
        )
        .toList();
    await _writeListings(next);
    return next;
  }

  Future<List<String>> toggleFavorite(String listingId) async {
    _favoriteIds ??= {};
    if (_favoriteIds!.contains(listingId)) {
      _favoriteIds!.remove(listingId);
    } else {
      _favoriteIds!.add(listingId);
    }
    return _favoriteIds!.toList();
  }

  Set<String>? _favoriteIds;

  Future<List<MarketListing>> _readListings() async {
    final stored = await _storage.marketListings.where().findAll();
    if (stored.isEmpty) {
      // Seed on first read
      await _storage.marketListings.isar.writeTxn(() async {
        await _storage.marketListings.putAll(
          _seed.map(IsarMarketListing.fromDomain).toList(),
        );
      });
      return _seed;
    }
    return stored.map((e) => e.toDomain()).toList();
  }

  Future<void> _writeListings(List<MarketListing> listings) async {
    await _storage.marketListings.isar.writeTxn(() async {
      await _storage.marketListings.where().deleteAll();
      await _storage.marketListings.putAll(
        listings.map(IsarMarketListing.fromDomain).toList(),
      );
    });
  }

  Future<List<SellerProfile>> _readProfiles() async {
    final stored = await _storage.sellerProfiles.where().findAll();
    if (stored.isEmpty) {
      await _storage.sellerProfiles.isar.writeTxn(() async {
        await _storage.sellerProfiles.putAll(
          _profileSeed.map(IsarSellerProfile.fromDomain).toList(),
        );
      });
      return _profileSeed;
    }
    return stored.map((e) => e.toDomain()).toList();
  }

  Future<List<MarketInquiry>> _readInquiries() async {
    final stored = await _storage.marketInquiries.where().findAll();
    return stored.map((e) => e.toDomain()).toList();
  }

  Future<List<ListingReport>> _readReports() async {
    final stored = await _storage.listingReports.where().findAll();
    return stored.map((e) => e.toDomain()).toList();
  }

  // ============================================================
  // Forward-compat methods
  // ============================================================

  Future<Result<List<MarketListing>>> fetchListingsBySeller(
    String sellerId,
  ) async {
    final all = await fetchListings();
    return Result.ok(all.where((l) => l.sellerId == sellerId).toList());
  }

  Future<Result<void>> deleteListing(String id) async {
    final all = await _readListings();
    all.removeWhere((l) => l.id == id);
    await _writeListings(all);
    return const Result.ok(null) as Result<void>;
  }

  Future<DigitalCertificate?> fetchCertificateForHorse(String horseId) async {
    // Phase 3 — stub
    return null;
  }

  Future<List<PriceHistoryRecord>> fetchPriceHistory() async {
    return [];
  }

  Future<void> submitSellerRating({
    required String sellerId,
    required int rating,
    required String review,
  }) async {
    // Phase 3 — stub
  }
}
