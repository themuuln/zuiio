import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/domain/notification_preferences.dart';

void main() {
  group('NotificationPreferences', () {
    group('defaults', () {
      test('all notifications enabled by default', () {
        const prefs = NotificationPreferences.defaults;

        expect(prefs.notificationsEnabled, true);
        expect(prefs.healthRemindersEnabled, true);
        expect(prefs.breedingAlertsEnabled, true);
        expect(prefs.marketUpdatesEnabled, true);
        expect(prefs.geofenceAlertsEnabled, true);
      });
    });

    group('isTypeEnabled', () {
      test('returns true when all notifications enabled', () {
        const prefs = NotificationPreferences.defaults;

        expect(prefs.isTypeEnabled(NotificationPreferenceType.health), true);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.breeding), true);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.market), true);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.geofence), true);
      });

      test('returns false when master toggle is off', () {
        const prefs = NotificationPreferences(notificationsEnabled: false);

        expect(prefs.isTypeEnabled(NotificationPreferenceType.health), false);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.breeding), false);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.market), false);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.geofence), false);
      });

      test('returns false when specific type is disabled', () {
        const prefs = NotificationPreferences(
          healthRemindersEnabled: false,
          breedingAlertsEnabled: true,
          marketUpdatesEnabled: true,
          geofenceAlertsEnabled: true,
        );

        expect(prefs.isTypeEnabled(NotificationPreferenceType.health), false);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.breeding), true);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.market), true);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.geofence), true);
      });

      test('returns false when specific type disabled but master on', () {
        const prefs = NotificationPreferences(
          notificationsEnabled: true,
          marketUpdatesEnabled: false,
        );

        expect(prefs.isTypeEnabled(NotificationPreferenceType.health), true);
        expect(prefs.isTypeEnabled(NotificationPreferenceType.market), false);
      });
    });

    group('copyWith', () {
      test('copies with new values', () {
        const original = NotificationPreferences.defaults;
        final modified = original.copyWith(
          healthRemindersEnabled: false,
          breedingAlertsEnabled: false,
        );

        expect(modified.notificationsEnabled, true);
        expect(modified.healthRemindersEnabled, false);
        expect(modified.breedingAlertsEnabled, false);
        expect(modified.marketUpdatesEnabled, true);
        expect(modified.geofenceAlertsEnabled, true);
      });

      test('preserves existing values when not overridden', () {
        const original = NotificationPreferences(
          notificationsEnabled: false,
          healthRemindersEnabled: false,
          breedingAlertsEnabled: false,
          marketUpdatesEnabled: false,
          geofenceAlertsEnabled: false,
        );

        final modified = original.copyWith(notificationsEnabled: true);

        expect(modified.notificationsEnabled, true);
        expect(modified.healthRemindersEnabled, false);
        expect(modified.breedingAlertsEnabled, false);
        expect(modified.marketUpdatesEnabled, false);
        expect(modified.geofenceAlertsEnabled, false);
      });
    });

    group('JSON serialization', () {
      test('toJson produces correct keys', () {
        const prefs = NotificationPreferences(
          notificationsEnabled: true,
          healthRemindersEnabled: false,
          breedingAlertsEnabled: true,
          marketUpdatesEnabled: false,
          geofenceAlertsEnabled: true,
        );

        final json = prefs.toJson();

        expect(json['notifications_enabled'], true);
        expect(json['health_reminders_enabled'], false);
        expect(json['breeding_alerts_enabled'], true);
        expect(json['market_updates_enabled'], false);
        expect(json['geofence_alerts_enabled'], true);
      });

      test('fromJson restores preferences correctly', () {
        final json = {
          'notifications_enabled': false,
          'health_reminders_enabled': true,
          'breeding_alerts_enabled': false,
          'market_updates_enabled': true,
          'geofence_alerts_enabled': false,
        };

        final prefs = NotificationPreferences.fromJson(json);

        expect(prefs.notificationsEnabled, false);
        expect(prefs.healthRemindersEnabled, true);
        expect(prefs.breedingAlertsEnabled, false);
        expect(prefs.marketUpdatesEnabled, true);
        expect(prefs.geofenceAlertsEnabled, false);
      });

      test('fromJson uses defaults for missing keys', () {
        final prefs = NotificationPreferences.fromJson({});

        expect(prefs.notificationsEnabled, true);
        expect(prefs.healthRemindersEnabled, true);
        expect(prefs.breedingAlertsEnabled, true);
        expect(prefs.marketUpdatesEnabled, true);
        expect(prefs.geofenceAlertsEnabled, true);
      });

      test('round-trip preserves values', () {
        const original = NotificationPreferences(
          notificationsEnabled: false,
          healthRemindersEnabled: true,
          breedingAlertsEnabled: false,
          marketUpdatesEnabled: true,
          geofenceAlertsEnabled: false,
        );

        final restored = NotificationPreferences.fromJson(original.toJson());

        expect(restored.notificationsEnabled, original.notificationsEnabled);
        expect(
          restored.healthRemindersEnabled,
          original.healthRemindersEnabled,
        );
        expect(restored.breedingAlertsEnabled, original.breedingAlertsEnabled);
        expect(restored.marketUpdatesEnabled, original.marketUpdatesEnabled);
        expect(restored.geofenceAlertsEnabled, original.geofenceAlertsEnabled);
      });
    });
  });
}
