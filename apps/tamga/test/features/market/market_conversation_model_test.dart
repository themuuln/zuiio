import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_conversation.dart';

void main() {
  group('MarketConversation', () {
    // ── Helpers ────────────────────────────────────────────────────

    MarketConversation createConversation({
      String id = 'conv-1',
      String listingId = 'listing-1',
      String? reportId,
      String buyerId = 'buyer-1',
      String sellerId = 'seller-1',
      String lastMessage = 'Сайн байна уу?',
      DateTime? lastMessageAt,
      int unreadCount = 0,
    }) {
      return MarketConversation(
        id: id,
        listingId: listingId,
        reportId: reportId,
        buyerId: buyerId,
        sellerId: sellerId,
        lastMessage: lastMessage,
        lastMessageAt: lastMessageAt ?? DateTime(2026, 6, 1, 12, 0, 0),
        unreadCount: unreadCount,
      );
    }

    // ── Construction ───────────────────────────────────────────────

    group('construction', () {
      test('creates conversation with all required fields', () {
        final conversation = createConversation();

        expect(conversation.id, 'conv-1');
        expect(conversation.listingId, 'listing-1');
        expect(conversation.reportId, isNull);
        expect(conversation.buyerId, 'buyer-1');
        expect(conversation.sellerId, 'seller-1');
        expect(conversation.lastMessage, 'Сайн байна уу?');
        expect(conversation.lastMessageAt,
            DateTime(2026, 6, 1, 12, 0, 0));
        expect(conversation.unreadCount, 0);
      });

      test('creates conversation with reportId instead of listingId', () {
        final conversation = MarketConversation(
          id: 'conv-report-1',
          reportId: 'report-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );
        expect(conversation.reportId, 'report-1');
        expect(conversation.listingId, isNull);
        expect(conversation.lastMessage, '');
        expect(conversation.lastMessageAt, isNull);
        expect(conversation.unreadCount, 0);
      });

      test('defaults lastMessage to empty string', () {
        final conversation = MarketConversation(
          id: 'conv-2',
          listingId: 'listing-2',
          buyerId: 'buyer-2',
          sellerId: 'seller-2',
        );
        expect(conversation.lastMessage, '');
        expect(conversation.lastMessageAt, isNull);
        expect(conversation.unreadCount, 0);
      });
    });

    // ── copyWith ───────────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final original = createConversation(
          lastMessage: 'Hello',
          unreadCount: 1,
        );
        final copied = original.copyWith(
          lastMessage: 'Hi',
          unreadCount: 0,
        );

        expect(copied.lastMessage, 'Hi');
        expect(copied.unreadCount, 0);
        expect(copied.id, original.id);
        expect(copied.listingId, original.listingId);
      });

      test('copyWith sets listingId to null', () {
        final original = createConversation(listingId: 'listing-1');
        final copied = original.copyWith(listingId: null);
        expect(copied.listingId, isNull);
      });

      test('copyWith sets reportId', () {
        final original = createConversation(listingId: 'listing-1');
        final copied = original.copyWith(reportId: 'report-1');
        expect(copied.reportId, 'report-1');
        expect(copied.listingId, 'listing-1');
      });

      test('copyWith sets lastMessageAt to null', () {
        final original = createConversation(
          lastMessageAt: DateTime(2026, 6, 1),
        );
        final copied = original.copyWith(lastMessageAt: null);
        expect(copied.lastMessageAt, isNull);
      });

      test('returns same values when no overrides', () {
        final original = createConversation();
        final copied = original.copyWith();

        expect(copied.id, original.id);
        expect(copied.lastMessage, original.lastMessage);
        expect(copied.unreadCount, original.unreadCount);
      });
    });

    // ── Serialization ──────────────────────────────────────────────

    group('serialization', () {
      test('toJson produces correct map', () {
        final now = DateTime(2026, 6, 1, 12, 0, 0);
        final conversation = createConversation(
          lastMessageAt: now,
          unreadCount: 3,
        );

        final json = conversation.toJson();

        expect(json['id'], 'conv-1');
        expect(json['listingId'], 'listing-1');
        expect(json['buyerId'], 'buyer-1');
        expect(json['sellerId'], 'seller-1');
        expect(json['lastMessage'], 'Сайн байна уу?');
        expect(json['lastMessageAt'], now.toIso8601String());
        expect(json['unreadCount'], 3);
      });

      test('toJson omits null listingId and reportId', () {
        final conversation = MarketConversation(
          id: 'conv-report-1',
          reportId: 'report-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );
        final json = conversation.toJson();
        expect(json.containsKey('listingId'), isFalse);
        expect(json['reportId'], 'report-1');
      });

      test('toJson omits null reportId', () {
        final conversation = createConversation();
        final json = conversation.toJson();
        expect(json.containsKey('reportId'), isFalse);
      });

      test('fromJson round-trips correctly', () {
        final now = DateTime(2026, 6, 1, 10, 30, 0);
        final original = createConversation(
          id: 'conv-2',
          listingId: 'listing-2',
          buyerId: 'buyer-2',
          sellerId: 'seller-2',
          lastMessage: 'Үнэ тохиролцох боломжтой юу?',
          lastMessageAt: now,
          unreadCount: 5,
        );

        final json = original.toJson();
        final restored = MarketConversation.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.listingId, original.listingId);
        expect(restored.buyerId, original.buyerId);
        expect(restored.sellerId, original.sellerId);
        expect(restored.lastMessage, original.lastMessage);
        expect(restored.lastMessageAt, original.lastMessageAt);
        expect(restored.unreadCount, original.unreadCount);
      });

      test('fromJson round-trips with reportId', () {
        final original = MarketConversation(
          id: 'conv-report-1',
          reportId: 'report-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );
        final json = original.toJson();
        final restored = MarketConversation.fromJson(json);
        expect(restored.id, original.id);
        expect(restored.reportId, original.reportId);
        expect(restored.listingId, isNull);
      });

      test('fromJson defaults optional fields when missing', () {
        final json = {
          'id': 'conv-3',
          'listingId': 'listing-3',
          'buyerId': 'buyer-3',
          'sellerId': 'seller-3',
        };

        final conversation = MarketConversation.fromJson(json);
        expect(conversation.lastMessage, '');
        expect(conversation.lastMessageAt, isNull);
        expect(conversation.unreadCount, 0);
      });
    });

    // ── Equality ───────────────────────────────────────────────────

    group('equality', () {
      test('equal conversations are equal', () {
        final a = createConversation();
        final b = createConversation();
        expect(a, equals(b));
      });

      test('different conversations are not equal', () {
        final a = createConversation(id: 'conv-a');
        final b = createConversation(id: 'conv-b');
        expect(a, isNot(equals(b)));
      });

      test('conversations with different reportId are not equal', () {
        final a = createConversation(id: 'conv-a', reportId: 'report-1');
        final b = createConversation(id: 'conv-a', reportId: 'report-2');
        expect(a, isNot(equals(b)));
      });

      test('hashCode is consistent', () {
        final a = createConversation();
        final b = createConversation();
        expect(a.hashCode, equals(b.hashCode));
      });
    });
  });
}
