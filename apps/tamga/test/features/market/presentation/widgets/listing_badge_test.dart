import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/presentation/widgets/listing_badge.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';

void main() {
  MarketListing createTestListing({
    BoostLevel boostLevel = BoostLevel.none,
    DateTime? boostExpiresAt,
    VipLevel vipLevel = VipLevel.none,
    DateTime? vipExpiresAt,
    SellerBadgeType sellerBadge = SellerBadgeType.none,
    DateTime? sellerBadgeExpiresAt,
    bool lostReportConflict = false,
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
      lostReportConflict: lostReportConflict,
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

    testWidgets('shows lost-report conflict badge and takes priority', (
      tester,
    ) async {
      final listing = createTestListing(
        lostReportConflict: true,
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('mn'),
          home: Scaffold(body: ListingBadge(listing: listing)),
        ),
      );

      // Safety signal wins over VIP badge.
      expect(find.text('Эрэл хайгуул бүртгэлтэй морь'), findsOneWidget);
      expect(find.byIcon(Icons.warning_amber_rounded), findsOneWidget);
      expect(find.byIcon(Icons.workspace_premium), findsNothing);
    });

    testWidgets('shows conflict badge in compact mode', (tester) async {
      final listing = createTestListing(lostReportConflict: true);

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('mn'),
          home: Scaffold(body: ListingBadge(listing: listing, compact: true)),
        ),
      );

      expect(find.byIcon(Icons.warning_amber_rounded), findsOneWidget);
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
    testWidgets('shows lost-report conflict chip in overlay', (tester) async {
      final listing = createTestListing(
        lostReportConflict: true,
        vipLevel: VipLevel.standard,
        vipExpiresAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('mn'),
          home: Scaffold(
            body: Stack(children: [ListingBadgeOverlay(listing: listing)]),
          ),
        ),
      );

      expect(find.byIcon(Icons.warning_amber_rounded), findsOneWidget);
    });

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
