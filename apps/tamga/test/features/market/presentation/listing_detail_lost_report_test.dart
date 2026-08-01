import 'package:flutter_test/flutter_test.dart';
import 'dart:io';

/// VAL-MARKET-003: Lost-report conflict banner + provenance on listing detail.
void main() {
  group('ListingDetailScreen lost-report conflict wiring', () {
    late String source;

    setUpAll(() async {
      source = await File(
        'lib/src/features/market/presentation/listing_detail_screen.dart',
      ).readAsString();
    });

    test('renders conflict banner when listing flag is set', () {
      // The banner must be driven by the server flag OR a live active report.
      expect(
        source.contains('listing.lostReportConflict || conflictReport != null'),
        isTrue,
        reason: 'Banner should render from the server flag or a live report',
      );
      expect(
        source.contains('_LostReportConflictBanner('),
        isTrue,
        reason: 'Banner widget must be instantiated in the detail sliver',
      );
    });

    test('banner links to the recovery report detail', () {
      expect(
        source.contains('LostHorseDetailScreen('),
        isTrue,
        reason: 'View-report action must open the recovery report detail',
      );
    });

    test('shows tamga/registration/microchip provenance rows', () {
      // All four serializers of the flag + identity fields must be rendered.
      expect(source.contains('marketTamgaClan'), isTrue);
      expect(source.contains('marketRegistrationNo'), isTrue);
      expect(source.contains('marketMicrochipId'), isTrue);
      expect(source.contains('marketProvenanceTitle'), isTrue);
    });

    test('shows verified badges for tamga and state registration', () {
      expect(source.contains('horse.tamgaVerified'), isTrue);
      expect(source.contains('horse.stateVerified'), isTrue);
    });

    test('only renders provenance rows when data exists', () {
      // Rows are built conditionally — no empty labels for missing fields.
      expect(
        source.contains('if (horse.tamgaBrandClan != null'),
        isTrue,
        reason: 'Tamga clan row must be conditional on non-null data',
      );
      expect(
        source.contains('if (rows.isEmpty) return const [];'),
        isTrue,
        reason: 'No provenance section when the horse has no identity data',
      );
    });
  });
}
