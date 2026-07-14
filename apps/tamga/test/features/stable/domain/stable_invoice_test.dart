import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/stable/domain/stable_invoice.dart';

void main() {
  // ── Helpers ────────────────────────────────────────────────────

  InvoiceLineItem createItem({
    String description = 'Байршил',
    int amount = 300000,
    int quantity = 1,
  }) {
    return InvoiceLineItem(
      description: description,
      amount: amount,
      quantity: quantity,
    );
  }

  StableInvoice createInvoice({
    String id = 'inv-1',
    String clientName = 'Дуламсүрэн',
    InvoiceStatus status = InvoiceStatus.unpaid,
    List<InvoiceLineItem> lineItems = const [
      InvoiceLineItem(description: 'Байршил', amount: 300000),
    ],
  }) {
    return StableInvoice(
      id: id,
      stableId: 'stable-1',
      clientId: 'member-1',
      clientName: clientName,
      issuedAt: DateTime(2025, 6, 1),
      dueAt: DateTime(2025, 6, 15),
      status: status,
      lineItems: lineItems,
    );
  }

  // ── InvoiceLineItem ───────────────────────────────────────────

  group('InvoiceLineItem', () {
    group('total', () {
      test('calculates amount * quantity', () {
        final item = createItem(amount: 300000, quantity: 2);
        expect(item.total, 600000);
      });

      test('defaults quantity to 1', () {
        final item = InvoiceLineItem(description: 'Тэжээл', amount: 50000);
        expect(item.total, 50000);
      });

      test('single quantity equals amount', () {
        final item = createItem(amount: 300000);
        expect(item.total, 300000);
      });
    });

    group('JSON serialization', () {
      test('round-trips correctly', () {
        final item = createItem(
          description: 'Тэжээл',
          amount: 50000,
          quantity: 3,
        );
        final json = item.toJson();
        final restored = InvoiceLineItem.fromJson(json);

        expect(restored.description, 'Тэжээл');
        expect(restored.amount, 50000);
        expect(restored.quantity, 3);
        expect(restored.total, 150000);
      });

      test('handles null quantity default', () {
        final json = {'description': 'Test', 'amount': 100000};
        final restored = InvoiceLineItem.fromJson(json);

        expect(restored.quantity, 1);
      });
    });
  });

  // ── StableInvoice construction ────────────────────────────────

  group('StableInvoice construction', () {
    test('creates with required fields', () {
      final inv = createInvoice();

      expect(inv.id, 'inv-1');
      expect(inv.clientName, 'Дуламсүрэн');
      expect(inv.status, InvoiceStatus.unpaid);
      expect(inv.lineItems.length, 1);
      expect(inv.notes, '');
    });

    test('defaults paidAt to null', () {
      final inv = createInvoice();
      expect(inv.paidAt, isNull);
    });

    test('defaults lineItems to empty list', () {
      final inv = StableInvoice(
        id: 'inv-0',
        stableId: 's1',
        clientId: 'm1',
        clientName: 'Test',
        issuedAt: DateTime(2025, 1, 1),
      );

      expect(inv.lineItems, isEmpty);
    });
  });

  // ── totalAmount ───────────────────────────────────────────────

  group('totalAmount', () {
    test('sums all line item totals', () {
      final inv = createInvoice(
        lineItems: [
          createItem(description: 'Байршил', amount: 300000),
          createItem(description: 'Тэжээл', amount: 50000),
          createItem(description: 'Сургуулилт', amount: 100000, quantity: 2),
        ],
      );

      expect(inv.totalAmount, 550000); // 300k + 50k + 200k
    });

    test('returns 0 for empty line items', () {
      final inv = StableInvoice(
        id: 'inv-0',
        stableId: 's1',
        clientId: 'm1',
        clientName: 'Test',
        issuedAt: DateTime(2025, 1, 1),
      );

      expect(inv.totalAmount, 0);
    });

    test('single line item', () {
      final inv = createInvoice(lineItems: [createItem(amount: 300000)]);

      expect(inv.totalAmount, 300000);
    });
  });

  // ── outstandingAmount ─────────────────────────────────────────

  group('outstandingAmount', () {
    test('equals totalAmount when unpaid', () {
      final inv = createInvoice(
        status: InvoiceStatus.unpaid,
        lineItems: [createItem(amount: 300000)],
      );

      expect(inv.outstandingAmount, 300000);
    });

    test('equals totalAmount when partial', () {
      final inv = createInvoice(
        status: InvoiceStatus.partial,
        lineItems: [createItem(amount: 500000)],
      );

      expect(inv.outstandingAmount, 500000);
    });

    test('returns 0 when paid', () {
      final inv = createInvoice(
        status: InvoiceStatus.paid,
        lineItems: [createItem(amount: 300000)],
      );

      expect(inv.outstandingAmount, 0);
    });

    test('returns 0 when cancelled', () {
      final inv = createInvoice(
        status: InvoiceStatus.cancelled,
        lineItems: [createItem(amount: 300000)],
      );

      expect(inv.outstandingAmount, 0);
    });
  });

  // ── statusLabel ───────────────────────────────────────────────

  group('statusLabel', () {
    test('unpaid returns correct label', () {
      expect(InvoiceStatus.unpaid.label, 'Төлөгдөөгүй');
    });

    test('partial returns correct label', () {
      expect(InvoiceStatus.partial.label, 'Хэсэгчилсэн');
    });

    test('paid returns correct label', () {
      expect(InvoiceStatus.paid.label, 'Төлөгдсөн');
    });

    test('cancelled returns correct label', () {
      expect(InvoiceStatus.cancelled.label, 'Цуцлагдсан');
    });
  });

  // ── copyWith ──────────────────────────────────────────────────

  group('copyWith', () {
    test('remains identical with no arguments', () {
      final inv = createInvoice();
      final copy = inv.copyWith();

      expect(copy.id, inv.id);
      expect(copy.clientName, inv.clientName);
      expect(copy.totalAmount, inv.totalAmount);
    });

    test('overrides specified fields', () {
      final inv = createInvoice(status: InvoiceStatus.unpaid);
      final copy = inv.copyWith(
        status: InvoiceStatus.paid,
        paidAt: DateTime(2025, 6, 5),
      );

      expect(copy.status, InvoiceStatus.paid);
      expect(copy.paidAt, DateTime(2025, 6, 5));
      expect(copy.id, inv.id); // unchanged
    });

    test('does not mutate original', () {
      final inv = createInvoice(status: InvoiceStatus.unpaid);
      inv.copyWith(status: InvoiceStatus.paid);

      expect(inv.status, InvoiceStatus.unpaid);
    });
  });

  // ── JSON serialization ────────────────────────────────────────

  group('JSON serialization', () {
    test('round-trips with all fields', () {
      final inv = createInvoice(
        id: 'inv-2',
        clientName: 'Баттулга',
        status: InvoiceStatus.paid,
        lineItems: [createItem(description: 'Байршил', amount: 300000)],
      ).copyWith(paidAt: DateTime(2025, 6, 5));
      final json = inv.toJson();
      final restored = StableInvoice.fromJson(json);

      expect(restored.id, inv.id);
      expect(restored.clientName, inv.clientName);
      expect(restored.status, inv.status);
      expect(restored.paidAt, inv.paidAt);
      expect(restored.lineItems.length, inv.lineItems.length);
      expect(restored.totalAmount, inv.totalAmount);
      expect(restored.notes, '');
    });

    test('handles null dueAt and paidAt', () {
      final inv = StableInvoice(
        id: 'inv-0',
        stableId: 's1',
        clientId: 'm1',
        clientName: 'Test',
        issuedAt: DateTime(2025, 1, 1),
      );
      final json = inv.toJson();
      final restored = StableInvoice.fromJson(json);

      expect(restored.dueAt, isNull);
      expect(restored.paidAt, isNull);
    });

    test('handles status default (null)', () {
      final json = {
        'id': 'inv-1',
        'stableId': 's1',
        'clientId': 'm1',
        'clientName': 'Test',
        'issuedAt': '2025-01-01T00:00:00.000',
      };
      final restored = StableInvoice.fromJson(json);

      expect(restored.status, InvoiceStatus.unpaid);
    });

    test('handles empty lineItems', () {
      final inv = StableInvoice(
        id: 'inv-0',
        stableId: 's1',
        clientId: 'm1',
        clientName: 'Test',
        issuedAt: DateTime(2025, 1, 1),
      );
      final json = inv.toJson();
      final restored = StableInvoice.fromJson(json);

      expect(restored.lineItems, isEmpty);
    });
  });
}

// ── Extension for label getter ────────────────────────────────────────

/// Test-д statusLabel-г хялбархан ашиглахад зориулсан extension.
extension InvoiceStatusLabel on InvoiceStatus {
  String get label {
    switch (this) {
      case InvoiceStatus.unpaid:
        return 'Төлөгдөөгүй';
      case InvoiceStatus.partial:
        return 'Хэсэгчилсэн';
      case InvoiceStatus.paid:
        return 'Төлөгдсөн';
      case InvoiceStatus.cancelled:
        return 'Цуцлагдсан';
    }
  }
}
