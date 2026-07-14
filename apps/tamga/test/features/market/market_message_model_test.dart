import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/market/domain/market_message.dart';

void main() {
  group('MarketMessage', () {
    // ── Helpers ────────────────────────────────────────────────────

    MarketMessage createMessage({
      String id = 'msg-1',
      String conversationId = 'conv-1',
      String senderId = 'buyer-1',
      String? listingId = 'listing-1',
      String? reportId,
      String text = 'Сайн байна уу?',
      DateTime? timestamp,
      bool read = false,
    }) {
      return MarketMessage(
        id: id,
        conversationId: conversationId,
        senderId: senderId,
        listingId: listingId,
        reportId: reportId,
        text: text,
        timestamp: timestamp ?? DateTime(2026, 6, 1, 12, 0, 0),
        read: read,
      );
    }

    // ── Construction ───────────────────────────────────────────────

    group('construction', () {
      test('creates message with all required fields', () {
        final message = createMessage();

        expect(message.id, 'msg-1');
        expect(message.conversationId, 'conv-1');
        expect(message.senderId, 'buyer-1');
        expect(message.listingId, 'listing-1');
        expect(message.reportId, isNull);
        expect(message.text, 'Сайн байна уу?');
        expect(message.timestamp, DateTime(2026, 6, 1, 12, 0, 0));
        expect(message.read, isFalse);
      });

      test('creates message with reportId', () {
        final message = MarketMessage(
          id: 'msg-report-1',
          conversationId: 'conv-1',
          senderId: 'buyer-1',
          reportId: 'report-1',
          text: 'Сайн уу?',
          timestamp: DateTime(2026, 6, 1, 12, 0, 0),
        );
        expect(message.reportId, 'report-1');
        expect(message.listingId, isNull);
      });

      test('defaults read to false', () {
        final message = MarketMessage(
          id: 'msg-2',
          conversationId: 'conv-1',
          senderId: 'seller-1',
          listingId: 'listing-1',
          text: 'Баяртай',
          timestamp: DateTime(2026, 6, 1, 13, 0, 0),
        );
        expect(message.read, isFalse);
      });
    });

    // ── copyWith ───────────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final original = createMessage(text: 'Hello', read: false);
        final copied = original.copyWith(text: 'Hi', read: true);

        expect(copied.text, 'Hi');
        expect(copied.read, isTrue);
        expect(copied.id, original.id);
        expect(copied.conversationId, original.conversationId);
      });

      test('copyWith sets listingId to null', () {
        final original = createMessage(listingId: 'listing-1');
        final copied = original.copyWith(listingId: null);
        expect(copied.listingId, isNull);
      });

      test('copyWith sets reportId', () {
        final original = createMessage(listingId: 'listing-1');
        final copied = original.copyWith(reportId: 'report-1');
        expect(copied.reportId, 'report-1');
        expect(copied.listingId, 'listing-1');
      });

      test('returns same values when no overrides', () {
        final original = createMessage();
        final copied = original.copyWith();

        expect(copied.id, original.id);
        expect(copied.text, original.text);
        expect(copied.read, original.read);
      });
    });

    // ── Serialization ──────────────────────────────────────────────

    group('serialization', () {
      test('toJson produces correct map', () {
        final now = DateTime(2026, 6, 1, 12, 0, 0);
        final message = createMessage(timestamp: now, read: true);

        final json = message.toJson();

        expect(json['id'], 'msg-1');
        expect(json['conversationId'], 'conv-1');
        expect(json['senderId'], 'buyer-1');
        expect(json['listingId'], 'listing-1');
        expect(json['text'], 'Сайн байна уу?');
        expect(json['timestamp'], now.toIso8601String());
        expect(json['read'], true);
      });

      test('toJson omits null listingId and reportId', () {
        final message = MarketMessage(
          id: 'msg-report-1',
          conversationId: 'conv-1',
          senderId: 'buyer-1',
          reportId: 'report-1',
          text: 'Сайн уу?',
          timestamp: DateTime(2026, 6, 1, 12, 0, 0),
        );
        final json = message.toJson();
        expect(json.containsKey('listingId'), isFalse);
        expect(json['reportId'], 'report-1');
      });

      test('fromJson round-trips correctly', () {
        final now = DateTime(2026, 6, 1, 10, 30, 0);
        final original = createMessage(
          id: 'msg-2',
          conversationId: 'conv-2',
          senderId: 'seller-1',
          listingId: 'listing-2',
          text: 'Төлбөрийн нөхцөл?',
          timestamp: now,
          read: true,
        );

        final json = original.toJson();
        final restored = MarketMessage.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.conversationId, original.conversationId);
        expect(restored.senderId, original.senderId);
        expect(restored.listingId, original.listingId);
        expect(restored.text, original.text);
        expect(restored.timestamp, original.timestamp);
        expect(restored.read, original.read);
      });

      test('fromJson round-trips with reportId', () {
        final original = MarketMessage(
          id: 'msg-report-1',
          conversationId: 'conv-1',
          senderId: 'buyer-1',
          reportId: 'report-1',
          text: 'Сайн уу?',
          timestamp: DateTime(2026, 6, 1, 12, 0, 0),
        );
        final json = original.toJson();
        final restored = MarketMessage.fromJson(json);
        expect(restored.reportId, original.reportId);
        expect(restored.listingId, isNull);
      });

      test('fromJson defaults read to false when missing', () {
        final json = {
          'id': 'msg-3',
          'conversationId': 'conv-3',
          'senderId': 'buyer-1',
          'listingId': 'listing-3',
          'text': 'Default read',
          'timestamp': '2026-06-01T12:00:00.000',
        };

        final message = MarketMessage.fromJson(json);
        expect(message.read, isFalse);
      });
    });

    // ── Equality ───────────────────────────────────────────────────

    group('equality', () {
      test('equal messages are equal', () {
        final a = createMessage();
        final b = createMessage();
        expect(a, equals(b));
      });

      test('different messages are not equal', () {
        final a = createMessage(id: 'msg-a');
        final b = createMessage(id: 'msg-b');
        expect(a, isNot(equals(b)));
      });

      test('messages with different reportId are not equal', () {
        final a = createMessage(id: 'msg-a', reportId: 'report-1');
        final b = createMessage(id: 'msg-a', reportId: 'report-2');
        expect(a, isNot(equals(b)));
      });

      test('hashCode is consistent', () {
        final a = createMessage();
        final b = createMessage();
        expect(a.hashCode, equals(b.hashCode));
      });
    });
  });
}
