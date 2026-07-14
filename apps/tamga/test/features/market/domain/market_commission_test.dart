import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_commission.dart';

void main() {
  group('MarketCommission', () {
    // ── Helpers ────────────────────────────────────────────────────

    MarketCommission createCommission({
      double commissionRate = 0.05,
      int? commissionAmount,
    }) {
      return MarketCommission(
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
      );
    }

    // ── Constants ───────────────────────────────────────────────────

    test('kDefaultCommissionRate is 0.05', () {
      expect(kDefaultCommissionRate, 0.05);
    });

    // ── Construction ──────────────────────────────────────────────

    group('construction', () {
      test('creates commission with rate only', () {
        final commission = createCommission(commissionRate: 0.05);

        expect(commission.commissionRate, 0.05);
        expect(commission.commissionAmount, isNull);
      });

      test('creates commission with rate and amount', () {
        final commission = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );

        expect(commission.commissionRate, 0.05);
        expect(commission.commissionAmount, 25000);
      });

      test('const constructor works', () {
        const commission = MarketCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );

        expect(commission.commissionRate, 0.05);
        expect(commission.commissionAmount, 25000);
      });

      test('commissionAmount can be zero', () {
        final commission = createCommission(
          commissionRate: 0.05,
          commissionAmount: 0,
        );

        expect(commission.commissionAmount, 0);
      });

      test('commissionRate can be zero', () {
        final commission = createCommission(commissionRate: 0.0);

        expect(commission.commissionRate, 0.0);
      });

      test('commissionRate can be greater than 1', () {
        final commission = createCommission(commissionRate: 1.0);

        expect(commission.commissionRate, 1.0);
      });
    });

    // ── copyWith ───────────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden rate', () {
        final original = createCommission(commissionRate: 0.05);
        final copied = original.copyWith(commissionRate: 0.10);

        expect(copied.commissionRate, 0.10);
        expect(copied.commissionAmount, isNull);
      });

      test('copies with overridden amount', () {
        final original = createCommission(commissionRate: 0.05);
        final copied = original.copyWith(commissionAmount: 50000);

        expect(copied.commissionRate, 0.05);
        expect(copied.commissionAmount, 50000);
      });

      test('copyWith sets commissionAmount to null', () {
        final original = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final copied = original.copyWith(commissionAmount: null);

        expect(copied.commissionRate, 0.05);
        expect(copied.commissionAmount, isNull);
      });

      test('returns same values when no overrides', () {
        final original = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final copied = original.copyWith();

        expect(copied.commissionRate, original.commissionRate);
        expect(copied.commissionAmount, original.commissionAmount);
      });
    });

    // ── Serialization ──────────────────────────────────────────────

    group('serialization', () {
      test('toJson produces correct map with rate only', () {
        final commission = createCommission(commissionRate: 0.05);
        final json = commission.toJson();

        expect(json['commissionRate'], 0.05);
        expect(json['commissionAmount'], isNull);
      });

      test('toJson includes amount when set', () {
        final commission = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final json = commission.toJson();

        expect(json['commissionRate'], 0.05);
        expect(json['commissionAmount'], 25000);
      });

      test('fromJson round-trips correctly with rate only', () {
        final original = createCommission(commissionRate: 0.05);
        final json = original.toJson();
        final restored = MarketCommission.fromJson(json);

        expect(restored.commissionRate, original.commissionRate);
        expect(restored.commissionAmount, original.commissionAmount);
      });

      test('fromJson round-trips correctly with rate and amount', () {
        final original = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final json = original.toJson();
        final restored = MarketCommission.fromJson(json);

        expect(restored.commissionRate, original.commissionRate);
        expect(restored.commissionAmount, original.commissionAmount);
      });

      test('fromJson defaults commissionAmount to null when missing', () {
        final json = {'commissionRate': 0.05};
        final commission = MarketCommission.fromJson(json);

        expect(commission.commissionRate, 0.05);
        expect(commission.commissionAmount, isNull);
      });
    });

    // ── Equality ───────────────────────────────────────────────────

    group('equality', () {
      test('equal commissions are equal', () {
        final a = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final b = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );

        expect(a, equals(b));
        expect(a.hashCode, equals(b.hashCode));
      });

      test('different rates are not equal', () {
        final a = createCommission(commissionRate: 0.05);
        final b = createCommission(commissionRate: 0.10);

        expect(a, isNot(equals(b)));
      });

      test('different amounts are not equal', () {
        final a = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final b = createCommission(
          commissionRate: 0.05,
          commissionAmount: 50000,
        );

        expect(a, isNot(equals(b)));
      });

      test('null vs present amount are not equal', () {
        final a = createCommission(commissionRate: 0.05);
        final b = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );

        expect(a, isNot(equals(b)));
      });

      test('hashCode is consistent', () {
        final a = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final b = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );

        expect(a.hashCode, equals(b.hashCode));
      });
    });

    // ── toString ───────────────────────────────────────────────────

    group('toString', () {
      test('includes rate and amount', () {
        final commission = createCommission(
          commissionRate: 0.05,
          commissionAmount: 25000,
        );
        final str = commission.toString();

        expect(str, contains('0.05'));
        expect(str, contains('25000'));
        expect(str, contains('MarketCommission'));
      });
    });
  });
}
