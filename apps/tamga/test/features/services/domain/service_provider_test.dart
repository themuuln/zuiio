import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/services/domain/service_provider.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';

void main() {
  group('ServiceProvider', () {
    ServiceProvider createTestProvider({
      String id = 'sp-1',
      String userId = 'user-1',
      ServiceProviderType providerType = ServiceProviderType.photographer,
      String? businessName = 'Tamga Photos',
      String? phone = '+97699111111',
      String? locationAimag = 'Архангай',
      String? locationSum = 'Эрдэнэбулган',
      bool isVerified = true,
      double rating = 4.5,
    }) {
      return ServiceProvider(
        id: id,
        userId: userId,
        providerType: providerType,
        businessName: businessName,
        phone: phone,
        locationAimag: locationAimag,
        locationSum: locationSum,
        isVerified: isVerified,
        rating: rating,
      );
    }

    test('creates ServiceProvider with all fields', () {
      final provider = createTestProvider();

      expect(provider.id, 'sp-1');
      expect(provider.userId, 'user-1');
      expect(provider.providerType, ServiceProviderType.photographer);
      expect(provider.businessName, 'Tamga Photos');
      expect(provider.phone, '+97699111111');
      expect(provider.locationAimag, 'Архангай');
      expect(provider.locationSum, 'Эрдэнэбулган');
      expect(provider.isVerified, true);
      expect(provider.rating, 4.5);
    });

    test('creates ServiceProvider with default values', () {
      final provider = ServiceProvider(
        id: 'sp-2',
        userId: 'user-2',
        providerType: ServiceProviderType.vet,
      );

      expect(provider.businessName, null);
      expect(provider.phone, null);
      expect(provider.isVerified, false);
      expect(provider.rating, 0);
    });

    test('JSON serialization round-trips correctly', () {
      final provider = createTestProvider();
      final json = provider.toJson();
      final restored = ServiceProvider.fromJson(json);

      expect(restored.id, provider.id);
      expect(restored.userId, provider.userId);
      expect(restored.providerType, provider.providerType);
      expect(restored.businessName, provider.businessName);
      expect(restored.phone, provider.phone);
      expect(restored.locationAimag, provider.locationAimag);
      expect(restored.locationSum, provider.locationSum);
      expect(restored.isVerified, provider.isVerified);
      expect(restored.rating, provider.rating);
    });

    test('Supabase JSON serialization round-trips correctly', () {
      final provider = createTestProvider();
      final supabaseJson = provider.toSupabaseJson();
      final restored = ServiceProvider.fromSupabaseJson(supabaseJson);

      expect(restored.id, provider.id);
      expect(restored.userId, provider.userId);
      expect(restored.providerType, provider.providerType);
      expect(restored.businessName, provider.businessName);
      expect(restored.phone, provider.phone);
      expect(restored.locationAimag, provider.locationAimag);
      expect(restored.locationSum, provider.locationSum);
      expect(restored.isVerified, provider.isVerified);
      expect(restored.rating, provider.rating);
    });

    test('fromSupabaseJson handles snake_case keys', () {
      final row = {
        'id': 'sp-sb-1',
        'user_id': 'user-sb-1',
        'provider_type': 'vet',
        'business_name': 'Архангай мал эмнэлэг',
        'phone': '+97699222222',
        'location_aimag': 'Архангай',
        'location_sum': 'Цэцэрлэг',
        'is_verified': true,
        'rating': 4.8,
      };

      final provider = ServiceProvider.fromSupabaseJson(row);

      expect(provider.id, 'sp-sb-1');
      expect(provider.userId, 'user-sb-1');
      expect(provider.providerType, ServiceProviderType.vet);
      expect(provider.locationAimag, 'Архангай');
      expect(provider.rating, 4.8);
    });
  });
}
