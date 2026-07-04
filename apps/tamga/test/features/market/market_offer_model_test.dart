import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_offer.dart';

void main() {
  group('MarketOffer', () {
    // ── Helpers ────────────────────────────────────────────────────

    MarketOffer createOffer({
      String id = 'offer-1',
      String listingId = 'listing-1',
      String buyerId = 'buyer-1',
      String sellerId = 'seller-1',
      int amount = 500000,
      MarketOfferStatus status = MarketOfferStatus.pending,
      int? counterAmount,
      String? message,
      DateTime? createdAt,
      DateTime? respondedAt,
    }) {
      return MarketOffer(
        id: id,
        listingId: listingId,
        buyerId: buyerId,
        sellerId: sellerId,
        amount: amount,
        status: status,
        counterAmount: counterAmount,
        message: message,
        createdAt: createdAt ?? DateTime(2026, 6, 10, 10, 0, 0),
        respondedAt: respondedAt,
      );
    }

    // ── MarketOfferStatus ─────────────────────────────────────────

    group('MarketOfferStatus', () {
      test('fromString returns correct status', () {
        expect(MarketOfferStatus.fromString('pending'),
            MarketOfferStatus.pending);
        expect(MarketOfferStatus.fromString('accepted'),
            MarketOfferStatus.accepted);
        expect(MarketOfferStatus.fromString('declined'),
            MarketOfferStatus.declined);
        expect(MarketOfferStatus.fromString('countered'),
            MarketOfferStatus.countered);
      });

      test('fromString defaults to pending for unknown values', () {
        expect(MarketOfferStatus.fromString('unknown'),
            MarketOfferStatus.pending);
      });

      test('displayName is not empty', () {
        for (final status in MarketOfferStatus.values) {
          expect(status.displayName.isNotEmpty, isTrue);
        }
      });
    });

    // ── Construction ───────────────────────────────────────────────

    group('construction', () {
      test('creates offer with all required fields', () {
        final offer = createOffer();

        expect(offer.id, 'offer-1');
        expect(offer.listingId, 'listing-1');
        expect(offer.buyerId, 'buyer-1');
        expect(offer.sellerId, 'seller-1');
        expect(offer.amount, 500000);
        expect(offer.status, MarketOfferStatus.pending);
        expect(offer.counterAmount, isNull);
        expect(offer.message, isNull);
        expect(offer.createdAt, DateTime(2026, 6, 10, 10, 0, 0));
        expect(offer.respondedAt, isNull);
      });

      test('creates offer with optional fields', () {
        final now = DateTime(2026, 6, 10, 12, 0, 0);
        final offer = createOffer(
          status: MarketOfferStatus.countered,
          counterAmount: 600000,
          message: 'Үнээ бууруулж болох уу?',
          respondedAt: now,
        );

        expect(offer.status, MarketOfferStatus.countered);
        expect(offer.counterAmount, 600000);
        expect(offer.message, 'Үнээ бууруулж болох уу?');
        expect(offer.respondedAt, now);
      });

      test('isActive returns true for pending and countered', () {
        final pendingOffer = createOffer(status: MarketOfferStatus.pending);
        final counteredOffer = createOffer(status: MarketOfferStatus.countered);
        final acceptedOffer = createOffer(status: MarketOfferStatus.accepted);
        final declinedOffer = createOffer(status: MarketOfferStatus.declined);

        expect(pendingOffer.isActive, isTrue);
        expect(counteredOffer.isActive, isTrue);
        expect(acceptedOffer.isActive, isFalse);
        expect(declinedOffer.isActive, isFalse);
      });
    });

    // ── copyWith ───────────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final original = createOffer(amount: 500000);
        final copied = original.copyWith(amount: 600000, message: 'Шинэ санал');

        expect(copied.amount, 600000);
        expect(copied.message, 'Шинэ санал');
        expect(copied.id, original.id);
        expect(copied.listingId, original.listingId);
      });

      test('copyWith sets counterAmount to null', () {
        final original = createOffer(counterAmount: 700000);
        final copied = original.copyWith(counterAmount: null);
        expect(copied.counterAmount, isNull);
      });

      test('copyWith sets respondedAt to null', () {
        final original = createOffer(respondedAt: DateTime(2026, 6, 10));
        final copied = original.copyWith(respondedAt: null);
        expect(copied.respondedAt, isNull);
      });

      test('returns same values when no overrides', () {
        final original = createOffer();
        final copied = original.copyWith();
        expect(copied, equals(original));
      });
    });

    // ── Serialization ──────────────────────────────────────────────

    group('serialization', () {
      test('toJson produces correct map', () {
        final now = DateTime(2026, 6, 10, 12, 0, 0);
        final offer = createOffer(
          amount: 500000,
          message: 'Сайн уу? Үнэ тохиролцох боломжтой юу?',
          createdAt: now,
        );

        final json = offer.toJson();

        expect(json['id'], 'offer-1');
        expect(json['listingId'], 'listing-1');
        expect(json['buyerId'], 'buyer-1');
        expect(json['sellerId'], 'seller-1');
        expect(json['amount'], 500000);
        expect(json['status'], 'pending');
        expect(json['counterAmount'], isNull);
        expect(json['message'], 'Сайн уу? Үнэ тохиролцох боломжтой юу?');
        expect(json['createdAt'], now.toIso8601String());
        expect(json['respondedAt'], isNull);
      });

      test('toJson includes counter data when countered', () {
        final now = DateTime(2026, 6, 10, 14, 0, 0);
        final offer = createOffer(
          status: MarketOfferStatus.countered,
          counterAmount: 450000,
          respondedAt: now,
        );

        final json = offer.toJson();
        expect(json['status'], 'countered');
        expect(json['counterAmount'], 450000);
        expect(json['respondedAt'], now.toIso8601String());
      });

      test('fromJson round-trips correctly', () {
        final now = DateTime(2026, 6, 10, 10, 30, 0);
        final original = createOffer(
          id: 'offer-2',
          listingId: 'listing-5',
          buyerId: 'buyer-2',
          sellerId: 'seller-2',
          amount: 1000000,
          status: MarketOfferStatus.countered,
          counterAmount: 900000,
          message: '900,000 MNT болбол болох уу?',
          createdAt: now,
          respondedAt: now.add(const Duration(hours: 2)),
        );

        final json = original.toJson();
        final restored = MarketOffer.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.listingId, original.listingId);
        expect(restored.buyerId, original.buyerId);
        expect(restored.sellerId, original.sellerId);
        expect(restored.amount, original.amount);
        expect(restored.status, original.status);
        expect(restored.counterAmount, original.counterAmount);
        expect(restored.message, original.message);
        expect(restored.createdAt, original.createdAt);
        expect(restored.respondedAt, original.respondedAt);
      });

      test('fromJson defaults optional fields when missing', () {
        final json = {
          'id': 'offer-3',
          'listingId': 'listing-3',
          'buyerId': 'buyer-3',
          'sellerId': 'seller-3',
          'amount': 300000,
          'createdAt': '2026-06-10T10:00:00.000',
        };

        final offer = MarketOffer.fromJson(json);
        expect(offer.status, MarketOfferStatus.pending);
        expect(offer.counterAmount, isNull);
        expect(offer.message, isNull);
        expect(offer.respondedAt, isNull);
      });
    });

    // ── Equality ───────────────────────────────────────────────────

    group('equality', () {
      test('equal offers are equal', () {
        final a = createOffer();
        final b = createOffer();
        expect(a, equals(b));
      });

      test('different offers are not equal', () {
        final a = createOffer(id: 'offer-a');
        final b = createOffer(id: 'offer-b');
        expect(a, isNot(equals(b)));
      });

      test('hashCode is consistent', () {
        final a = createOffer();
        final b = createOffer();
        expect(a.hashCode, equals(b.hashCode));
      });
    });

    // ── Status display names ───────────────────────────────────────

    group('status display names', () {
      test('all statuses have Mongolian display names', () {
        expect(MarketOfferStatus.pending.displayName, 'Хүлээгдэж буй');
        expect(MarketOfferStatus.accepted.displayName, 'Зөвшөөрсөн');
        expect(MarketOfferStatus.declined.displayName, 'Татгалзсан');
        expect(MarketOfferStatus.countered.displayName,
            'Саналын үнэ өөрчилсөн');
      });
    });
  });
}
