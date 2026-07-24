import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/services/domain/vet_profile.dart';

void main() {
  group('VetProfile', () {
    VetProfile createTestProfile({
      String id = 'vet-1',
      String providerId = 'provider-1',
      List<String> specialization = const ['general', 'dentistry'],
      String? licenseNumber = 'LIC-001',
      String? education = 'Хөдөө аж ахуйн их сургууль',
      int? experienceYears = 10,
      int? consultationFee = 30000,
      int? travelSurcharge = 15000,
      List<String> availableDays = const ['mon', 'tue', 'wed', 'thu', 'fri'],
    }) {
      return VetProfile(
        id: id,
        providerId: providerId,
        specialization: specialization,
        licenseNumber: licenseNumber,
        education: education,
        experienceYears: experienceYears,
        consultationFee: consultationFee,
        travelSurcharge: travelSurcharge,
        availableDays: availableDays,
      );
    }

    test('creates VetProfile with all fields', () {
      final profile = createTestProfile();

      expect(profile.id, 'vet-1');
      expect(profile.providerId, 'provider-1');
      expect(profile.specialization, ['general', 'dentistry']);
      expect(profile.licenseNumber, 'LIC-001');
      expect(profile.education, 'Хөдөө аж ахуйн их сургууль');
      expect(profile.experienceYears, 10);
      expect(profile.consultationFee, 30000);
      expect(profile.travelSurcharge, 15000);
      expect(profile.availableDays, ['mon', 'tue', 'wed', 'thu', 'fri']);
    });

    test('creates VetProfile with default values', () {
      final profile = VetProfile(id: 'vet-2', providerId: 'provider-2');

      expect(profile.specialization, []);
      expect(profile.licenseNumber, null);
      expect(profile.education, null);
      expect(profile.experienceYears, null);
      expect(profile.consultationFee, null);
      expect(profile.travelSurcharge, null);
      expect(profile.availableDays, []);
    });

    test('JSON serialization round-trips correctly', () {
      final profile = createTestProfile();
      final json = profile.toJson();
      final restored = VetProfile.fromJson(json);

      expect(restored.id, profile.id);
      expect(restored.providerId, profile.providerId);
      expect(restored.specialization, profile.specialization);
      expect(restored.licenseNumber, profile.licenseNumber);
      expect(restored.education, profile.education);
      expect(restored.experienceYears, profile.experienceYears);
      expect(restored.consultationFee, profile.consultationFee);
      expect(restored.travelSurcharge, profile.travelSurcharge);
      expect(restored.availableDays, profile.availableDays);
    });

    test('Supabase JSON serialization round-trips correctly', () {
      final profile = createTestProfile();
      final supabaseJson = profile.toSupabaseJson();
      final restored = VetProfile.fromSupabaseJson(supabaseJson);

      expect(restored.id, profile.id);
      expect(restored.providerId, profile.providerId);
      expect(restored.specialization, profile.specialization);
      expect(restored.licenseNumber, profile.licenseNumber);
      expect(restored.education, profile.education);
      expect(restored.experienceYears, profile.experienceYears);
      expect(restored.consultationFee, profile.consultationFee);
      expect(restored.travelSurcharge, profile.travelSurcharge);
      expect(restored.availableDays, profile.availableDays);
    });

    test('fromSupabaseJson handles snake_case keys', () {
      final row = {
        'id': 'vet-sb-1',
        'provider_id': 'provider-sb-1',
        'specialization': ['general', 'reproduction'],
        'license_number': 'LIC-002',
        'education': 'Мал эмнэлгийн их сургууль',
        'experience_years': 5,
        'consultation_fee': 25000,
        'travel_surcharge': 10000,
        'available_days': ['mon', 'wed', 'fri'],
        'created_at': '2026-06-21T10:00:00.000',
      };

      final profile = VetProfile.fromSupabaseJson(row);

      expect(profile.id, 'vet-sb-1');
      expect(profile.providerId, 'provider-sb-1');
      expect(profile.specialization, ['general', 'reproduction']);
      expect(profile.licenseNumber, 'LIC-002');
      expect(profile.experienceYears, 5);
      expect(profile.consultationFee, 25000);
      expect(profile.travelSurcharge, 10000);
      expect(profile.availableDays, ['mon', 'wed', 'fri']);
    });

    test('toSupabaseJson produces snake_case keys', () {
      final profile = createTestProfile();
      final json = profile.toSupabaseJson();

      expect(json.containsKey('id'), true);
      expect(json.containsKey('provider_id'), true);
      expect(json.containsKey('specialization'), true);
      expect(json.containsKey('license_number'), true);
      expect(json.containsKey('experience_years'), true);
      expect(json.containsKey('consultation_fee'), true);
      expect(json.containsKey('travel_surcharge'), true);
      expect(json.containsKey('available_days'), true);

      expect(json.containsKey('providerId'), false);
      expect(json.containsKey('licenseNumber'), false);
    });
  });
}
