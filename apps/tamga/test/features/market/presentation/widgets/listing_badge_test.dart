import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/presentation/widgets/listing_badge.dart';

void main() {
  MarketListing createTestListing({
    BoostLevel boostLevel = BoostLevel.none,
    DateTime? boostExpiresAt,
    VipLevel vipLevel = VipLevel.none,
    DateTime? vipExpiresAt,
    SellerBadgeType sellerBadge = SellerBadgeType.none,
    DateTime? sellerBadgeExpiresAt,
  }) {
    return MarketListing(
      id: 'test-1',
      horseId: 'horse-1',
      sellerId: 'seller-1',
      title: 'Test Listing',
      description: 'Test description',
      priceAmount: 1000000,
      currency: 'MNT',
      saleType: MarketSaleType.sale,
      status: MarketListingStatus.active,
      locationLabel: 'Улаанбаатар',
      disciplineTags: const [],
      documentTags: const [],
      mediaUrls: const [],
      isSellerVerified: false,
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime(2026, 1, 1),
      boostLevel: boostLevel,
      boostExpiresAt: boostExpiresAt,
      vipLevel: vipLevel,
      vipExpiresAt: vipExpiresAt,
      sellerBadge: sellerBadge,
      sellerBadgeExpiresAt: sellerBadgeExpiresAt,
    );
  }

  group('ListingBadge', () {
    testWidgets('shows nothing when no active boost/VIP', (tester) async {
      final listing = createTestListing();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ListingBadge(listing: listing)),
        ),
      );

      expect(find.byType(SizedBox), findsOneWidget);
    });

    testWidgets('shows VIP badge when VIP is active', (tester) async {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ListingBadge(listing: listing)),
        ),
      );

      expect(find.text('VIP'), findsOneWidget);
      expect(find.byIcon(Icons.workspace_premium), findsOneWidget);
    });

    testWidgets('shows boost badge when boost is active', (tester) async {
      final listing = createTestListing(
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ListingBadge(listing: listing)),
        ),
      );

      expect(find.text('Сурталчилгаа'), findsOneWidget);
      expect(find.byIcon(Icons.rocket_launch), findsOneWidget);
    });

    testWidgets('shows VIP over boost when both active', (tester) async {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ListingBadge(listing: listing)),
        ),
      );

      // VIP takes priority
      expect(find.text('VIP'), findsOneWidget);
      expect(find.byIcon(Icons.workspace_premium), findsOneWidget);
    });

    testWidgets('can show compact badge', (tester) async {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ListingBadge(listing: listing, compact: true)),
        ),
      );

      expect(find.text('VIP'), findsOneWidget);
    });

    testWidgets('shows verified badge when seller verified', (tester) async {
      final listing = MarketListing(
        id: 'test-2',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test Listing',
        description: 'Test description',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ListingBadge(listing: listing)),
        ),
      );

      expect(find.text('Verified'), findsOneWidget);
      expect(find.byIcon(Icons.verified_outlined), findsOneWidget);
    });
  });

  group('SellerBadge', () {
    testWidgets('shows nothing when no seller badge', (tester) async {
      final listing = createTestListing();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: SellerBadge(listing: listing)),
        ),
      );

      expect(find.byType(SizedBox), findsOneWidget);
    });

    testWidgets('shows seller badge when active', (tester) async {
      final listing = createTestListing(
        sellerBadge: SellerBadgeType.shop,
        sellerBadgeExpiresAt: DateTime.now().add(const Duration(days: 300)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: SellerBadge(listing: listing)),
        ),
      );

      expect(find.text('Дэлгүүр'), findsOneWidget);
      expect(find.byIcon(Icons.store), findsOneWidget);
    });

    testWidgets('can show compact badge', (tester) async {
      final listing = createTestListing(
        sellerBadge: SellerBadgeType.shop,
        sellerBadgeExpiresAt: DateTime.now().add(const Duration(days: 300)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: SellerBadge(listing: listing, compact: true)),
        ),
      );

      expect(find.text('Дэлгүүр'), findsOneWidget);
    });
  });

  group('ListingBadgeOverlay', () {
    testWidgets('shows nothing when no badges', (tester) async {
      final listing = createTestListing();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.byType(SizedBox), findsOneWidget);
    });

    testWidgets('shows VIP badge overlay', (tester) async {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.text('VIP'), findsOneWidget);
    });

    testWidgets('shows boost badge overlay', (tester) async {
      final listing = createTestListing(
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.text('Сурталчилгаа'), findsOneWidget);
    });

    testWidgets('shows seller badge overlay', (tester) async {
      final listing = createTestListing(
        sellerBadge: SellerBadgeType.shop,
        sellerBadgeExpiresAt: DateTime.now().add(const Duration(days: 300)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.text('Дэлгүүр'), findsOneWidget);
    });

    testWidgets('shows verified badge overlay when seller verified', (
      tester,
    ) async {
      final listing = MarketListing(
        id: 'test-3',
        horseId: 'horse-1',
        sellerId: 'seller-1',
        title: 'Test Listing',
        description: 'Test description',
        priceAmount: 1000000,
        currency: 'MNT',
        saleType: MarketSaleType.sale,
        status: MarketListingStatus.active,
        locationLabel: 'Улаанбаатар',
        disciplineTags: const [],
        documentTags: const [],
        mediaUrls: const [],
        isSellerVerified: true,
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.text('Verified'), findsOneWidget);
    });

    testWidgets('shows all badges when all active', (tester) async {
      final listing = createTestListing(
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
        boostLevel: BoostLevel.standard,
        boostExpiresAt: DateTime.now().add(const Duration(hours: 12)),
        sellerBadge: SellerBadgeType.shop,
        sellerBadgeExpiresAt: DateTime.now().add(const Duration(days: 300)),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.text('VIP'), findsOneWidget);
      expect(find.text('Сурталчилгаа'), findsOneWidget);
      expect(find.text('Дэлгүүр'), findsOneWidget);
    });
  });
}
