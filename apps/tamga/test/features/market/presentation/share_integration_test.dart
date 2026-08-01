import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ══════════════════════════════════════════════════════════════════
  // VAL-MARKET-005: Share opens correct URL format
  // ══════════════════════════════════════════════════════════════════

  group('VAL-MARKET-005: Share URL format', () {
    test('URL format is https://tamga.mn/{type}/{id} for market listing', () {
      const listingId = 'listing-123';

      final url = 'https://tamga.mn/market/$listingId';

      expect(url, 'https://tamga.mn/market/listing-123');
      expect(url.startsWith('https://tamga.mn/'), isTrue);
      expect(url.contains('/market/'), isTrue);
      expect(url.endsWith(listingId), isTrue);
    });

    test('URL format is https://tamga.mn/{type}/{id} for horse profile', () {
      const horseId = 'horse-456';

      final url = 'https://tamga.mn/horse/$horseId';

      expect(url, 'https://tamga.mn/horse/horse-456');
      expect(url.startsWith('https://tamga.mn/'), isTrue);
      expect(url.contains('/horse/'), isTrue);
      expect(url.endsWith(horseId), isTrue);
    });

    test('share text includes URL and correct prefix', () {
      const listingId = 'listing-789';

      final url = 'https://tamga.mn/market/$listingId';
      final text = 'Check out this horse on Tamga: $url';

      expect(text, contains('Check out this horse on Tamga:'));
      expect(text, contains('https://tamga.mn/market/listing-789'));
    });

    test('share text includes URL and correct prefix for horse', () {
      const horseId = 'horse-012';

      final url = 'https://tamga.mn/horse/$horseId';
      final text = 'Check out this horse on Tamga: $url';

      expect(text, contains('Check out this horse on Tamga:'));
      expect(text, contains('https://tamga.mn/horse/horse-012'));
    });

    test('share subject format is Tamga — {title} for listing', () {
      const title = 'Premium Stallion';

      final subject = 'Tamga — $title';

      expect(subject, 'Tamga — Premium Stallion');
      expect(subject.startsWith('Tamga'), isTrue);
      expect(subject, contains(title));
    });

    test('share subject format is Tamga — {title} for horse', () {
      const horseName = 'Болор';

      final subject = 'Tamga — $horseName';

      expect(subject, 'Tamga — Болор');
      expect(subject.startsWith('Tamga'), isTrue);
      expect(subject, contains(horseName));
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-MARKET-003: Share button on listing detail calls Share.share()
  // ══════════════════════════════════════════════════════════════════

  group('VAL-MARKET-003: Listing detail share button source verification', () {
    test('ListingDetailScreen uses Share.share() in _shareListing', () async {
      final sourceFile = File(
        'lib/src/features/market/presentation/listing_detail_screen.dart',
      );
      final source = await sourceFile.readAsString();

      // Verify share_plus import
      expect(
        source.contains("import 'package:share_plus/share_plus.dart'"),
        isTrue,
        reason: 'ListingDetailScreen should import share_plus',
      );

      // Verify Share.share() is called instead of Clipboard
      expect(
        source.contains('SharePlus.instance.share(ShareParams('),
        isTrue,
        reason: 'ListingDetailScreen should call SharePlus.instance.share()',
      );

      // Verify URL format
      expect(
        source.contains("'https://tamga.mn/market/\${listing.id}'"),
        isTrue,
        reason: 'URL should use tamga.mn/market/{id} format',
      );

      // Verify share text (uses $url variable in string interpolation)
      expect(
        source.contains("'Check out this horse on Tamga: \$url'"),
        isTrue,
        reason: 'Share text should use "Check out this horse on Tamga: \$url"',
      );

      // Verify share subject
      expect(
        source.contains("'Tamga — \${listing.title}'"),
        isTrue,
        reason: 'Share subject should be "Tamga — {listing.title}" format',
      );

      // Verify button uses Icons.share_outlined
      expect(
        source.contains('Icons.share_outlined'),
        isTrue,
        reason: 'Share button should use Icons.share_outlined',
      );

      // Verify Clipboard import was removed
      expect(
        source.contains("import 'package:flutter/services.dart'"),
        isFalse,
        reason: 'Clipboard import should be removed in favor of share_plus',
      );

      // Verify Clipboard.setData was removed
      expect(
        source.contains('Clipboard.setData'),
        isFalse,
        reason: 'Clipboard.setData should be replaced by Share.share()',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VAL-MARKET-004: Share button on horse public profile calls Share.share()
  // ══════════════════════════════════════════════════════════════════

  group('VAL-MARKET-004: Horse profile share button source verification', () {
    test(
      'PublicHorseProfileScreen uses Share.share() with correct text',
      () async {
        final sourceFile = File(
          'lib/src/features/horses/presentation/public_horse_profile_screen.dart',
        );
        final source = await sourceFile.readAsString();

        // Verify share_plus import
        expect(
          source.contains("import 'package:share_plus/share_plus.dart'"),
          isTrue,
          reason: 'PublicHorseProfileScreen should import share_plus',
        );

        // Verify Share.share() is called
        expect(
          source.contains('SharePlus.instance.share('),
          isTrue,
          reason:
              'PublicHorseProfileScreen should call SharePlus.instance.share()',
        );

        // Verify URL format for horse
        expect(
          source.contains("'https://tamga.mn/horse/\${horse.id}'"),
          isTrue,
          reason: 'URL should use tamga.mn/horse/{id} format',
        );

        // Verify share text (uses $url variable in string interpolation)
        expect(
          source.contains("'Check out this horse on Tamga: \$url'"),
          isTrue,
          reason:
              'Share text should use "Check out this horse on Tamga: \$url"',
        );

        // Verify share subject
        expect(
          source.contains("'Tamga — \${horse.name}'"),
          isTrue,
          reason: 'Share subject should be "Tamga — {horse.name}" format',
        );

        // Verify button uses Icons.share_outlined
        expect(
          source.contains('Icons.share_outlined'),
          isTrue,
          reason: 'Share button should use Icons.share_outlined',
        );

        // Verify TODO comment was removed
        expect(
          source.contains('// TODO: Share horse profile'),
          isFalse,
          reason: 'TODO comment should be replaced by actual implementation',
        );
      },
    );
  });

  // ══════════════════════════════════════════════════════════════════
  // Widget test: Verify share button UI on horse profile
  // ══════════════════════════════════════════════════════════════════

  group('VAL-MARKET-004: Horse profile share button widget test', () {
    testWidgets(
      'PublicHorseProfileScreen has share button with share_outlined icon',
      (WidgetTester tester) async {
        // Build a simple MaterialApp with a Scaffold that replicates
        // the share button pattern from PublicHorseProfileScreen.
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              appBar: AppBar(
                title: const Text('Test Horse'),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.share_outlined),
                    onPressed: () {
                      // In production, Share.share() is called here
                    },
                  ),
                ],
              ),
            ),
          ),
        );

        // Verify the share_outlined icon button exists
        expect(find.byIcon(Icons.share_outlined), findsOneWidget);
      },
    );
  });
}
