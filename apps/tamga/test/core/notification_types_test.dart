import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/services/notification_types.dart';

void main() {
  group('NotificationType', () {
    test('geofenceAlert has correct key', () {
      expect(NotificationType.geofenceAlert.key, 'geofence_alert');
    });

    test('geofenceAlert has correct channel id', () {
      expect(NotificationType.geofenceAlert.channelId, 'geofence_alerts');
    });

    test('geofenceAlert has Mongolian label', () {
      expect(NotificationType.geofenceAlert.label, 'Геоференцийн мэдэгдэл');
    });

    test('geofenceAlert has English label', () {
      expect(NotificationType.geofenceAlert.labelEn, 'Geofence Alert');
    });

    test('fromKey returns geofenceAlert for correct key', () {
      final type = NotificationTypeX.fromKey('geofence_alert');
      expect(type, NotificationType.geofenceAlert);
    });

    test('lostHorseRenewal has correct properties', () {
      expect(NotificationType.lostHorseRenewal.key, 'lost_horse_renewal');
      expect(NotificationType.lostHorseRenewal.channelId, 'lost_horse_renewals');
      expect(NotificationType.lostHorseRenewal.label, 'Хаяж морийн зар');
      expect(NotificationType.lostHorseRenewal.labelEn, 'Lost Horse Renewal');
    });

    test('all types have non-empty properties', () {
      for (final type in NotificationType.values) {
        expect(type.key, isNotEmpty);
        expect(type.label, isNotEmpty);
        expect(type.labelEn, isNotEmpty);
        expect(type.channelId, isNotEmpty);
        expect(type.channelName, isNotEmpty);
        expect(type.channelDescription, isNotEmpty);
      }
    });
  });

  group('NotificationPayload', () {
    test('toPayloadString and fromPayloadString round-trip', () {
      const payload = NotificationPayload(
        type: NotificationType.healthReminder,
        source: NotificationSource.local,
        referenceId: 'horse-123',
        referenceType: 'horse',
      );

      final str = payload.toPayloadString();
      final restored = NotificationPayload.fromPayloadString(str);

      expect(restored.type, payload.type);
      expect(restored.source, payload.source);
      expect(restored.referenceId, payload.referenceId);
      expect(restored.referenceType, payload.referenceType);
    });

    test('fromPayloadString handles remote source', () {
      const str = 'type=breeding_due&source=remote&referenceId=breed-1';
      final payload = NotificationPayload.fromPayloadString(str);

      expect(payload.type, NotificationType.breedingDue);
      expect(payload.source, NotificationSource.remote);
      expect(payload.referenceId, 'breed-1');
    });

    test('fromPayloadString defaults to healthReminder for unknown type', () {
      const str = 'type=unknown_type&source=local';
      final payload = NotificationPayload.fromPayloadString(str);

      expect(payload.type, NotificationType.healthReminder);
    });
  });
}
