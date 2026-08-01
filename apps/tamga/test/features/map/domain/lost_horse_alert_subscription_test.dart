import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/lost_horse_alert_subscription.dart';

void main() {
  test(
    'serializes a regional opt-in without storing unsupported distance data',
    () {
      const subscription = LostHorseAlertSubscription(
        userId: 'user-1',
        locationAimag: 'Архангай',
        locationSum: 'Цэцэрлэг',
        pushEnabled: true,
      );

      final json = subscription.toJson();

      expect(json['user_id'], 'user-1');
      expect(json['location_aimag'], 'Архангай');
      expect(json['location_sum'], 'Цэцэрлэг');
      expect(json['push_enabled'], isTrue);
      expect(json.containsKey('radius_km'), isFalse);
    },
  );

  test('restores revoked state and optional region fields', () {
    final subscription = LostHorseAlertSubscription.fromJson({
      'id': 'sub-1',
      'user_id': 'user-1',
      'location_aimag': 'Төв',
      'location_sum': null,
      'location_bag': null,
      'push_enabled': false,
      'sms_enabled': true,
      'revoked_at': '2026-07-31T00:00:00Z',
    });

    expect(subscription.id, 'sub-1');
    expect(subscription.locationSum, isNull);
    expect(subscription.locationBag, isNull);
    expect(subscription.pushEnabled, isFalse);
    expect(subscription.smsEnabled, isTrue);
    expect(subscription.isActive, isFalse);
  });
}
