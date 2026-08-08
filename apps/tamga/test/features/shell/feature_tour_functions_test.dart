import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:tamga/src/features/shell/presentation/feature_tour.dart';
import 'package:tamga/src/features/shell/presentation/quick_actions.dart';

void main() {
  group('Feature tour functions', () {
    test('isFeatureTourCompleted returns false by default', () async {
      SharedPreferences.setMockInitialValues({});

      final completed = await isFeatureTourCompleted();
      expect(completed, isFalse);
    });

    test(
      'markFeatureTourCompleted persists and isFeatureTourCompleted returns true',
      () async {
        SharedPreferences.setMockInitialValues({});

        await markFeatureTourCompleted();
        final completed = await isFeatureTourCompleted();
        expect(completed, isTrue);
      },
    );

    test('isFeatureTourCompleted returns true when previously set', () async {
      SharedPreferences.setMockInitialValues({'feature_tour_completed': true});

      final completed = await isFeatureTourCompleted();
      expect(completed, isTrue);
    });
  });

  group('Quick actions dismiss functions', () {
    test('isQuickActionsDismissed returns false by default', () async {
      SharedPreferences.setMockInitialValues({});

      final dismissed = await isQuickActionsDismissed();
      expect(dismissed, isFalse);
    });

    test(
      'markQuickActionsDismissed persists and isQuickActionsDismissed returns true',
      () async {
        SharedPreferences.setMockInitialValues({});

        await markQuickActionsDismissed();
        final dismissed = await isQuickActionsDismissed();
        expect(dismissed, isTrue);
      },
    );

    test('isQuickActionsDismissed returns true when previously set', () async {
      SharedPreferences.setMockInitialValues({'quick_actions_dismissed': true});

      final dismissed = await isQuickActionsDismissed();
      expect(dismissed, isTrue);
    });
  });
}
