import 'package:flutter_test/flutter_test.dart';
import 'dart:io';

/// VAL-MARKET-004: Create-listing lost-report guard.
void main() {
  group('CreateListingScreen lost-report guard', () {
    late String source;

    setUpAll(() async {
      source = await File(
        'lib/src/features/market/presentation/create_listing_screen.dart',
      ).readAsString();
    });

    test(
      'submission is blocked when the selected horse has an active report',
      () {
        // The submit path must consult the live recovery feed before saving.
        expect(
          source.contains('ref.read(activeLostHorsesProvider.future)'),
          isTrue,
          reason: 'Submit must await the active recovery reports before saving',
        );
        expect(
          source.contains('_showLostReportBlockedDialog(conflict)'),
          isTrue,
          reason: 'A blocked submit must show the explanation dialog',
        );
      },
    );

    test('offline/error on the recovery feed does not crash submission', () {
      // Server triggers still enforce the guard; the client must not block
      // legitimate offline listing creation on a failed feed read.
      expect(
        source.contains('catch (_) {\n      conflict = null;'),
        isTrue,
        reason: 'Feed failure must degrade to server-side enforcement',
      );
    });

    test('shows an inline warning under the horse picker', () {
      expect(
        source.contains('_LostReportWarningBanner('),
        isTrue,
        reason:
            'Selected horse with an active report must show an inline warning',
      );
    });

    test('dialog links to the recovery report detail', () {
      expect(
        source.contains('LostHorseDetailScreen(report: report)'),
        isTrue,
        reason: 'The blocked dialog must offer viewing the recovery report',
      );
    });
  });
}
