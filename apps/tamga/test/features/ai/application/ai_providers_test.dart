import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/ai/application/ai_providers.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';

void main() {
  group('kBreedingQueryLimits', () {
    test('free tier has 5 queries per month (VAL-AI-003)', () {
      final limit = kBreedingQueryLimits[SubscriptionTier.free];
      expect(limit, 5);
    });

    test('pro tier has 50 queries per month (VAL-AI-003)', () {
      final limit = kBreedingQueryLimits[SubscriptionTier.pro];
      expect(limit, 50);
    });

    test('breeder tier has unlimited queries', () {
      final limit = kBreedingQueryLimits[SubscriptionTier.breeder];
      expect(limit, isNull);
    });

    test('stable tier has unlimited queries', () {
      final limit = kBreedingQueryLimits[SubscriptionTier.stable];
      expect(limit, isNull);
    });
  });

  group('canPerformBreedingQuery', () {
    test('free tier allows within limit', () {
      expect(canPerformBreedingQuery(SubscriptionTier.free, 0), isTrue);
      expect(canPerformBreedingQuery(SubscriptionTier.free, 4), isTrue);
    });

    test('free tier blocks at limit (VAL-AI-003)', () {
      expect(canPerformBreedingQuery(SubscriptionTier.free, 5), isFalse);
      expect(canPerformBreedingQuery(SubscriptionTier.free, 10), isFalse);
    });

    test('pro tier allows within limit', () {
      expect(canPerformBreedingQuery(SubscriptionTier.pro, 0), isTrue);
      expect(canPerformBreedingQuery(SubscriptionTier.pro, 49), isTrue);
    });

    test('pro tier blocks at limit', () {
      expect(canPerformBreedingQuery(SubscriptionTier.pro, 50), isFalse);
      expect(canPerformBreedingQuery(SubscriptionTier.pro, 100), isFalse);
    });

    test('breeder tier always allows', () {
      expect(canPerformBreedingQuery(SubscriptionTier.breeder, 0), isTrue);
      expect(canPerformBreedingQuery(SubscriptionTier.breeder, 100), isTrue);
      expect(canPerformBreedingQuery(SubscriptionTier.breeder, 1000), isTrue);
    });

    test('stable tier always allows', () {
      expect(canPerformBreedingQuery(SubscriptionTier.stable, 0), isTrue);
      expect(canPerformBreedingQuery(SubscriptionTier.stable, 100), isTrue);
      expect(canPerformBreedingQuery(SubscriptionTier.stable, 1000), isTrue);
    });
  });

  group('BreedingQuotaInfo', () {
    test('constructs with required fields', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 3,
      );
      expect(info.tier, SubscriptionTier.free);
      expect(info.limit, 5);
      expect(info.used, 3);
    });

    test('remaining is limit minus used', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 3,
      );
      expect(info.remaining, 2);
    });

    test('remaining is null for unlimited tiers', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.breeder,
        limit: null,
        used: 100,
      );
      expect(info.remaining, isNull);
    });

    test('isExhausted returns true when used >= limit', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 5,
      );
      expect(info.isExhausted, isTrue);
    });

    test('isExhausted returns false when under limit', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 3,
      );
      expect(info.isExhausted, isFalse);
    });

    test('isExhausted returns false for unlimited tiers', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.breeder,
        limit: null,
        used: 100,
      );
      expect(info.isExhausted, isFalse);
    });

    test('isNearLimit returns true when used >= limit - 1', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 4,
      );
      expect(info.isNearLimit, isTrue);
    });

    test('isNearLimit returns false when comfortably under limit', () {
      final info = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 2,
      );
      expect(info.isNearLimit, isFalse);
    });
  });
}
