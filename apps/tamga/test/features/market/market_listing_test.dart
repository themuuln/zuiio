import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';

void main() {
  group('MarketListing', () {
    // ── Helpers ────────────────────────────────────────────────────

    MarketListing createListing({
      String id = 'ml-1',
      String horseId = 'h1',
      String sellerId = 's1',
      String title = 'Хан Хүлэг',
      String description = 'Шилдэг азарга',
      int priceAmount = 5000000,
      String currency = 'MNT',
      MarketSaleType saleType = MarketSaleType.sale,
      MarketListingStatus status = MarketListingStatus.active,
      String locationLabel = 'Улаанбаатар',
      List<String> disciplineTags = const ['Уралдаан'],
      List<String> documentTags = const ['Pedigree'],
      List<String> mediaUrls = const [],
      bool isSellerVerified = true,
      DateTime? createdAt,
      DateTime? updatedAt,
      int viewsCount = 0,
      bool isFeatured = false,
    }) {
      final now = DateTime(2026, 5, 1);
      return MarketListing(
        id: id,
        horseId: horseId,
        sellerId: sellerId,
        title: title,
        description: description,
        priceAmount: priceAmount,
        currency: currency,
        saleType: saleType,
        status: status,
        locationLabel: locationLabel,
        disciplineTags: disciplineTags,
        documentTags: documentTags,
        mediaUrls: mediaUrls,
        isSellerVerified: isSellerVerified,
        createdAt: createdAt ?? now,
        updatedAt: updatedAt ?? now,
        viewsCount: viewsCount,
        isFeatured: isFeatured,
      );
    }

    // ── Construction ───────────────────────────────────────────────

    group('construction', () {
      test('creates with all required fields', () {
        final listing = createListing();

        expect(listing.id, 'ml-1');
        expect(listing.horseId, 'h1');
        expect(listing.sellerId, 's1');
        expect(listing.title, 'Хан Хүлэг');
        expect(listing.description, 'Шилдэг азарга');
        expect(listing.priceAmount, 5000000);
        expect(listing.currency, 'MNT');
        expect(listing.saleType, MarketSaleType.sale);
        expect(listing.status, MarketListingStatus.active);
        expect(listing.locationLabel, 'Улаанбаатар');
        expect(listing.isSellerVerified, isTrue);
      });

      test('defaults viewsCount to 0 and isFeatured to false', () {
        final listing = createListing();
        expect(listing.viewsCount, 0);
        expect(listing.isFeatured, isFalse);
      });
    });

    // ── Derived status getters ─────────────────────────────────────

    group('status getters', () {
      test('isActive returns true only for active status', () {
        final active = createListing(status: MarketListingStatus.active);
        final pending = createListing(
          status: MarketListingStatus.pendingVerification,
        );
        final sold = createListing(status: MarketListingStatus.sold);

        expect(active.isActive, isTrue);
        expect(pending.isActive, isFalse);
        expect(sold.isActive, isFalse);
      });

      test('isPending returns true only for pendingVerification', () {
        final pending = createListing(
          status: MarketListingStatus.pendingVerification,
        );
        final active = createListing(status: MarketListingStatus.active);

        expect(pending.isPending, isTrue);
        expect(active.isPending, isFalse);
      });

      test('isSold returns true only for sold status', () {
        final sold = createListing(status: MarketListingStatus.sold);
        final active = createListing(status: MarketListingStatus.active);

        expect(sold.isSold, isTrue);
        expect(active.isSold, isFalse);
      });

      test('isExpired returns true only for expired status', () {
        final expired = createListing(status: MarketListingStatus.expired);
        final active = createListing(status: MarketListingStatus.active);

        expect(expired.isExpired, isTrue);
        expect(active.isExpired, isFalse);
      });

      test('isPublished returns true for active and pending', () {
        final active = createListing(status: MarketListingStatus.active);
        final pending = createListing(
          status: MarketListingStatus.pendingVerification,
        );
        final sold = createListing(status: MarketListingStatus.sold);
        final rejected = createListing(status: MarketListingStatus.rejected);

        expect(active.isPublished, isTrue);
        expect(pending.isPublished, isTrue);
        expect(sold.isPublished, isFalse);
        expect(rejected.isPublished, isFalse);
      });
    });

    // ── Trust score ────────────────────────────────────────────────

    group('trustScore', () {
      test('verified seller gets base 35 points', () {
        final listing = createListing(
          isSellerVerified: true,
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
        );
        expect(listing.trustScore, 35);
      });

      test('unverified seller gets 0 base', () {
        final listing = createListing(
          isSellerVerified: false,
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
        );
        expect(listing.trustScore, 0);
      });

      test('document tags add 12 points each, capped at 45', () {
        final with3Docs = createListing(
          isSellerVerified: false,
          documentTags: ['doc1', 'doc2', 'doc3'],
          disciplineTags: [],
          mediaUrls: [],
        );
        // 3 * 12 = 36
        expect(with3Docs.trustScore, 36);

        final with5Docs = createListing(
          isSellerVerified: false,
          documentTags: ['d1', 'd2', 'd3', 'd4', 'd5'],
          disciplineTags: [],
          mediaUrls: [],
        );
        // 5 * 12 = 60, capped at 45
        expect(with5Docs.trustScore, 45);
      });

      test('mediaUrls present adds 20 points', () {
        final withMedia = createListing(
          isSellerVerified: false,
          disciplineTags: [],
          documentTags: [],
          mediaUrls: ['url1'],
        );
        expect(withMedia.trustScore, 20);

        final noMedia = createListing(
          isSellerVerified: false,
          disciplineTags: [],
          documentTags: [],
          mediaUrls: [],
        );
        expect(noMedia.trustScore, 0);
      });

      test('full trust score combines all factors', () {
        final listing = createListing(
          isSellerVerified: true,
          documentTags: ['d1', 'd2', 'd3'],
          mediaUrls: ['img1'],
        );
        // 35 (verified) + 36 (3 docs) + 20 (media) = 91
        expect(listing.trustScore, 91);
      });
    });

    // ── Serialization (toJson / fromJson) ──────────────────────────

    group('serialization', () {
      test('toJson produces correct map', () {
        final now = DateTime(2026, 5, 1, 12, 0, 0);
        final listing = createListing(
          createdAt: now,
          updatedAt: now,
          viewsCount: 42,
          isFeatured: true,
        );

        final json = listing.toJson();

        expect(json['id'], 'ml-1');
        expect(json['horseId'], 'h1');
        expect(json['sellerId'], 's1');
        expect(json['title'], 'Хан Хүлэг');
        expect(json['description'], 'Шилдэг азарга');
        expect(json['priceAmount'], 5000000);
        expect(json['currency'], 'MNT');
        expect(json['saleType'], 'sale');
        expect(json['status'], 'active');
        expect(json['locationLabel'], 'Улаанбаатар');
        expect(json['disciplineTags'], ['Уралдаан']);
        expect(json['documentTags'], ['Pedigree']);
        expect(json['mediaUrls'], []);
        expect(json['isSellerVerified'], true);
        expect(json['viewsCount'], 42);
        expect(json['isFeatured'], true);
        expect(json['createdAt'], now.toIso8601String());
        expect(json['updatedAt'], now.toIso8601String());
      });

      test('fromJson round-trips correctly', () {
        final now = DateTime(2026, 6, 1, 10, 30);
        final original = createListing(
          priceAmount: 3500000,
          saleType: MarketSaleType.lease,
          status: MarketListingStatus.pendingVerification,
          locationLabel: 'Дархан',
          disciplineTags: ['Тоортой'],
          documentTags: ['Health Cert'],
          mediaUrls: ['img1.jpg', 'img2.jpg'],
          createdAt: now,
          updatedAt: now,
          viewsCount: 15,
          isFeatured: true,
        );

        final json = original.toJson();
        final restored = MarketListing.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.horseId, original.horseId);
        expect(restored.priceAmount, original.priceAmount);
        expect(restored.saleType, MarketSaleType.lease);
        expect(restored.status, MarketListingStatus.pendingVerification);
        expect(restored.locationLabel, 'Дархан');
        expect(restored.disciplineTags, ['Тоортой']);
        expect(restored.documentTags, ['Health Cert']);
        expect(restored.mediaUrls, ['img1.jpg', 'img2.jpg']);
        expect(restored.viewsCount, 15);
        expect(restored.isFeatured, true);
        expect(restored.createdAt, now);
        expect(restored.updatedAt, now);
      });

      test('fromJson handles legacy status names', () {
        final json = {
          'id': 'x',
          'horseId': 'h',
          'sellerId': 's',
          'title': 'T',
          'description': 'D',
          'priceAmount': 1000,
          'currency': 'MNT',
          'saleType': 'sale',
          'status': 'published',
          'locationLabel': 'L',
          'disciplineTags': <String>[],
          'documentTags': <String>[],
          'mediaUrls': <String>[],
          'isSellerVerified': false,
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        };

        final listing = MarketListing.fromJson(json);
        expect(listing.status, MarketListingStatus.active);
      });

      test('fromJson handles draft -> pendingVerification', () {
        final json = {
          'id': 'x',
          'horseId': 'h',
          'sellerId': 's',
          'title': 'T',
          'description': 'D',
          'priceAmount': 1000,
          'currency': 'MNT',
          'saleType': 'sale',
          'status': 'draft',
          'locationLabel': 'L',
          'disciplineTags': <String>[],
          'documentTags': <String>[],
          'mediaUrls': <String>[],
          'isSellerVerified': false,
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        };

        final listing = MarketListing.fromJson(json);
        expect(listing.status, MarketListingStatus.pendingVerification);
      });

      test('fromJson defaults viewsCount to 0 when missing', () {
        final json = {
          'id': 'x',
          'horseId': 'h',
          'sellerId': 's',
          'title': 'T',
          'description': 'D',
          'priceAmount': 1000,
          'currency': 'MNT',
          'saleType': 'sale',
          'status': 'active',
          'locationLabel': 'L',
          'disciplineTags': <String>[],
          'documentTags': <String>[],
          'mediaUrls': <String>[],
          'isSellerVerified': false,
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        };

        final listing = MarketListing.fromJson(json);
        expect(listing.viewsCount, 0);
        expect(listing.isFeatured, isFalse);
      });
    });

    // ── copyWith ───────────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final original = createListing(title: 'Old Title', priceAmount: 1000);
        final copied = original.copyWith(title: 'New Title', priceAmount: 2000);

        expect(copied.title, 'New Title');
        expect(copied.priceAmount, 2000);
        expect(copied.id, original.id);
        expect(copied.sellerId, original.sellerId);
      });

      test('copies with status change', () {
        final original = createListing(status: MarketListingStatus.active);
        final sold = original.copyWith(status: MarketListingStatus.sold);

        expect(sold.status, MarketListingStatus.sold);
        expect(sold.isSold, isTrue);
        expect(original.isActive, isTrue);
      });
    });

    // ── MarketSaleType labels ──────────────────────────────────────

    group('MarketSaleType labels', () {
      test('each sale type has correct Mongolian label', () {
        expect(MarketSaleType.sale.label, 'Зарна');
        expect(MarketSaleType.lease.label, 'Түрээс');
        expect(MarketSaleType.trade.label, 'Солилцоо');
        expect(MarketSaleType.stud.label, 'Ороо / Хээлтүүлэг');
      });
    });

    // ── MarketListingStatus labels ─────────────────────────────────

    group('MarketListingStatus labels', () {
      test('each status has correct Mongolian label', () {
        expect(MarketListingStatus.active.label, 'Идэвхтэй');
        expect(
          MarketListingStatus.pendingVerification.label,
          'Баталгаажуулалт хүлээж буй',
        );
        expect(MarketListingStatus.sold.label, 'Борлуулсан');
        expect(MarketListingStatus.expired.label, 'Хугацаа дууссан');
        expect(MarketListingStatus.rejected.label, 'Татгалзсан');
      });
    });
  });
}
