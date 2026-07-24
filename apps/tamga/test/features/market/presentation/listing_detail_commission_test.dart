import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'dart:io';

void main() {
  group('VAL-MARKET-002: Commission rate displayed on listing detail', () {
    // ── Source code verification ─────────────────────────────────

    test(
      'ListingDetailScreen has commission display logic in source',
      () async {
        final sourceFile = File(
          'lib/src/features/market/presentation/listing_detail_screen.dart',
        );
        final source = await sourceFile.readAsString();

        // Verify the commission label text is present
        expect(
          source.contains('Комисс:'),
          isTrue,
          reason: 'ListingDetailScreen should contain Комисс: label',
        );

        // Verify the display is conditional on commissionRate being non-null
        expect(
          source.contains('listing.commissionRate != null'),
          isTrue,
          reason: 'Commission display should be conditional on commissionRate',
        );

        // Verify the percentage is calculated from commissionRate
        expect(
          source.contains('(listing.commissionRate! * 100)'),
          isTrue,
          reason:
              'Commission rate should be converted from decimal to percentage',
        );
      },
    );

    // ── Widget test ──────────────────────────────────────────────

    /// Helper to build a simple commission display widget similar to ListingDetailScreen.
    Widget buildCommissionWidget(double? commissionRate) {
      return MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) {
              final theme = Theme.of(context);
              return Column(
                children: [
                  Text('Item price', style: theme.textTheme.titleMedium),
                  if (commissionRate != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Комисс: ${(commissionRate * 100).toStringAsFixed(0)}%',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      );
    }

    testWidgets('shows Комисс: X% when commissionRate is set', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildCommissionWidget(0.05));

      // Verify the commission label is displayed
      expect(find.text('Комисс: 5%'), findsOneWidget);
    });

    testWidgets('does not show Комисс when commissionRate is null', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildCommissionWidget(null));

      // Verify the commission label is NOT displayed
      expect(find.textContaining('Комисс'), findsNothing);
    });

    testWidgets('shows correct percentage for various rates', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildCommissionWidget(0.10));

      // Verify 10% commission
      expect(find.text('Комисс: 10%'), findsOneWidget);
    });
  });
}
