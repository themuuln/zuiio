import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/services/domain/service_pricing.dart';

void main() {
  group('ServicePricing', () {
    test('calculates total with default horse count', () {
      final pricing = ServicePricing(
        consultationFee: 30000,
        perHorseFee: 5000,
        travelSurcharge: 10000,
      );

      final total = pricing.total();
      expect(total, 45000); // 30000 + (1 * 5000) + 10000
    });

    test('calculates total with multiple horses', () {
      final pricing = ServicePricing(
        consultationFee: 30000,
        perHorseFee: 5000,
        travelSurcharge: 10000,
      );

      final total = pricing.total(horseCount: 3);
      expect(total, 55000); // 30000 + (3 * 5000) + 10000
    });

    test('calculates total with zero travel surcharge', () {
      final pricing = ServicePricing(
        consultationFee: 25000,
        perHorseFee: 0,
        travelSurcharge: 0,
      );

      final total = pricing.total();
      expect(total, 25000);
    });

    test('calculates total with zero consultation fee', () {
      final pricing = ServicePricing(
        consultationFee: 0,
        perHorseFee: 10000,
        travelSurcharge: 5000,
      );

      final total = pricing.total(horseCount: 2);
      expect(total, 25000); // 0 + (2 * 10000) + 5000
    });

    test('JSON serialization round-trips correctly', () {
      final pricing = ServicePricing(
        consultationFee: 30000,
        perHorseFee: 5000,
        travelSurcharge: 10000,
      );

      final json = pricing.toJson();
      final restored = ServicePricing.fromJson(json);

      expect(restored.consultationFee, pricing.consultationFee);
      expect(restored.perHorseFee, pricing.perHorseFee);
      expect(restored.travelSurcharge, pricing.travelSurcharge);
    });
  });
}
