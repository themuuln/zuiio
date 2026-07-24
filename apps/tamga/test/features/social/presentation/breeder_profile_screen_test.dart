import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-001: Breeder public profile screen exists with required info
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-001: BreederProfileScreen source verification', () {
    late String source;

    setUp(() async {
      source = await File(
        'lib/src/features/social/presentation/breeder_profile_screen.dart',
      ).readAsString();
    });

    test('BreederProfileScreen class exists', () {
      expect(
        source.contains('class BreederProfileScreen extends ConsumerWidget'),
        isTrue,
        reason: 'BreederProfileScreen class should exist as ConsumerWidget',
      );
    });

    test('BreederProfileScreen has sellerId parameter', () {
      expect(
        source.contains('required this.sellerId'),
        isTrue,
        reason: 'BreederProfileScreen should require sellerId',
      );
    });

    test('AppBar title is Үржүүлэгчийн профайл', () {
      expect(
        source.contains("'Үржүүлэгчийн профайл'"),
        isTrue,
        reason: 'AppBar title should be Үржүүлэгчийн профайл',
      );
    });

    // ── 7 required sections ────────────────────────────────────

    test('1. Shows breeder name (displayName)', () {
      expect(
        source.contains('profile.displayName'),
        isTrue,
        reason: 'Screen should display breeder name',
      );
    });

    test('2. Shows location (locationLabel)', () {
      expect(
        source.contains('profile.locationLabel'),
        isTrue,
        reason: 'Screen should display location',
      );
    });

    test('3. Shows member since label', () {
      expect(
        source.contains('profile.memberSinceLabel'),
        isTrue,
        reason: 'Screen should display member since info',
      );
    });

    test('4. Shows total horses count', () {
      expect(
        source.contains('profile.totalHorses'),
        isTrue,
        reason: 'Screen should display total horses count',
      );
    });

    test('5. Shows achievements/badges', () {
      expect(
        source.contains('profile.achievements'),
        isTrue,
        reason: 'Screen should display achievements/badges',
      );
    });

    test('6. Shows recent marketplace listings', () {
      expect(
        source.contains('profile.recentListings'),
        isTrue,
        reason: 'Screen should display recent marketplace listings',
      );
    });

    test('7. Shows average seller rating', () {
      expect(
        source.contains('profile.averageRating'),
        isTrue,
        reason: 'Screen should display average seller rating',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-002: Breeder profile accessible from marketplace seller profile
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-002: Seller profile link to breeder profile', () {
    late String sellerSource;

    setUp(() async {
      sellerSource = await File(
        'lib/src/features/market/presentation/seller_profile_screen.dart',
      ).readAsString();
    });

    test('Seller profile screen has Үржүүлэгчийн профайл харах text', () {
      expect(
        sellerSource.contains('Үржүүлэгчийн профайл харах'),
        isTrue,
        reason: 'Seller profile should have Үржүүлэгчийн профайл харах link',
      );
    });

    test('Seller profile screen has go_router import', () {
      expect(
        sellerSource.contains("import 'package:go_router/go_router.dart'"),
        isTrue,
        reason: 'Seller profile screen should import go_router for navigation',
      );
    });

    test('Seller profile screen navigates to breeder-profile route', () {
      expect(
        sellerSource.contains('/market/breeder-profile'),
        isTrue,
        reason:
            'Seller profile should navigate to /market/breeder-profile route',
      );
    });

    test('Seller profile passes sellerId to breeder profile', () {
      expect(
        sellerSource.contains("'sellerId': profile.sellerId"),
        isTrue,
        reason: 'Seller profile should pass sellerId to breeder profile screen',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-SOCIAL-002: Route registered in app_router
  // ══════════════════════════════════════════════════════════════════

  group('VAL-SOCIAL-002: Breeder profile route in app_router', () {
    late String routerSource;

    setUp(() async {
      routerSource = await File(
        'lib/src/app/router/app_router.dart',
      ).readAsString();
    });

    test('breeder-profile route exists', () {
      expect(
        routerSource.contains('breeder-profile'),
        isTrue,
        reason: 'Router should have breeder-profile route',
      );
    });

    test('BreederProfileScreen is imported in router', () {
      expect(
        routerSource.contains('breeder_profile_screen.dart'),
        isTrue,
        reason: 'Router should import BreederProfileScreen',
      );
    });

    test('BreederProfileScreen is constructed in route builder', () {
      expect(
        routerSource.contains('BreederProfileScreen('),
        isTrue,
        reason: 'Router should construct BreederProfileScreen in route',
      );
    });
  });
}
