import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/horses/domain/horse_transfer.dart';

HorseTransfer _transfer({
  String id = 't1',
  String horseId = 'h1',
  String fromOwnerId = 'o1',
  String fromOwnerName = 'Эзэмшигч 1',
  String toOwnerId = 'o2',
  String toOwnerName = 'Эзэмшигч 2',
  DateTime? transferDate,
  double? price,
  String notes = '',
  bool isVerified = false,
  DateTime? verifiedAt,
  String? verifiedBy,
}) {
  return HorseTransfer(
    id: id,
    horseId: horseId,
    fromOwnerId: fromOwnerId,
    fromOwnerName: fromOwnerName,
    toOwnerId: toOwnerId,
    toOwnerName: toOwnerName,
    transferDate: transferDate ?? DateTime(2026, 6, 1),
    price: price,
    notes: notes,
    isVerified: isVerified,
    verifiedAt: verifiedAt,
    verifiedBy: verifiedBy,
  );
}

void main() {
  group('HorseTransfer', () {
    test('constructs with required fields', () {
      final t = _transfer();

      expect(t.id, 't1');
      expect(t.horseId, 'h1');
      expect(t.fromOwnerId, 'o1');
      expect(t.fromOwnerName, 'Эзэмшигч 1');
      expect(t.toOwnerId, 'o2');
      expect(t.toOwnerName, 'Эзэмшигч 2');
      expect(t.transferDate, DateTime(2026, 6, 1));
    });

    test('optional fields default to empty/unset', () {
      final t = _transfer();

      expect(t.price, isNull);
      expect(t.notes, '');
      expect(t.isVerified, false);
      expect(t.verifiedAt, isNull);
      expect(t.verifiedBy, isNull);
    });

    test('copyWith updates selected fields and preserves the rest', () {
      final original = _transfer(price: 5000000, notes: 'Худалдаа');

      final updated = original.copyWith(
        toOwnerName: 'Шинэ эзэмшигч',
        price: 6000000,
        notes: 'Худалдаа — шинэ',
        isVerified: true,
        verifiedBy: 'user-1',
        verifiedAt: DateTime(2026, 7, 1),
      );

      expect(updated.toOwnerName, 'Шинэ эзэмшигч');
      expect(updated.price, 6000000);
      expect(updated.notes, 'Худалдаа — шинэ');
      expect(updated.isVerified, true);
      expect(updated.verifiedBy, 'user-1');
      expect(updated.verifiedAt, DateTime(2026, 7, 1));
      expect(updated.id, original.id);
      expect(updated.horseId, original.horseId);
      expect(updated.fromOwnerId, original.fromOwnerId);
      expect(updated.transferDate, original.transferDate);
    });

    test('copyWith clearPrice nulls the price', () {
      final original = _transfer(price: 1000000);

      final cleared = original.copyWith(clearPrice: true);

      expect(cleared.price, isNull);
      expect(cleared.notes, original.notes);
      expect(cleared.transferDate, original.transferDate);
    });

    test('copyWith clearVerifiedAt and clearVerifiedBy null both', () {
      final original = _transfer(
        isVerified: true,
        verifiedAt: DateTime(2026, 5, 1),
        verifiedBy: 'user-1',
      );

      final cleared = original.copyWith(
        clearVerifiedAt: true,
        clearVerifiedBy: true,
      );

      expect(cleared.verifiedAt, isNull);
      expect(cleared.verifiedBy, isNull);
      expect(cleared.isVerified, true);
    });

    test('isCertified is false when not verified', () {
      expect(_transfer().isCertified, false);
    });

    test('isCertified is false when verified but missing verifiedAt', () {
      final t = _transfer(isVerified: true);

      expect(t.isCertified, false);
    });

    test('isCertified is true when verified with a verifiedAt date', () {
      final t = _transfer(isVerified: true, verifiedAt: DateTime(2026, 6, 2));

      expect(t.isCertified, true);
    });

    test('toJson uses snake_case keys', () {
      final json = _transfer(
        price: 5000000,
        notes: 'Тэмдэглэл',
        isVerified: true,
        verifiedAt: DateTime(2026, 6, 2),
        verifiedBy: 'user-1',
      ).toJson();

      expect(json['id'], 't1');
      expect(json['horse_id'], 'h1');
      expect(json['from_owner_id'], 'o1');
      expect(json['from_owner_name'], 'Эзэмшигч 1');
      expect(json['to_owner_id'], 'o2');
      expect(json['to_owner_name'], 'Эзэмшигч 2');
      expect(json['transfer_date'], DateTime(2026, 6, 1).toIso8601String());
      expect(json['price'], 5000000);
      expect(json['notes'], 'Тэмдэглэл');
      expect(json['is_verified'], true);
      expect(json['verified_at'], DateTime(2026, 6, 2).toIso8601String());
      expect(json['verified_by'], 'user-1');
    });

    test('fromJson restores every field (roundtrip)', () {
      final original = _transfer(
        price: 5000000,
        notes: 'Худалдаа',
        isVerified: true,
        verifiedAt: DateTime(2026, 6, 2),
        verifiedBy: 'user-1',
      );

      final restored = HorseTransfer.fromJson(original.toJson());

      expect(restored.id, original.id);
      expect(restored.horseId, original.horseId);
      expect(restored.fromOwnerId, original.fromOwnerId);
      expect(restored.fromOwnerName, original.fromOwnerName);
      expect(restored.toOwnerId, original.toOwnerId);
      expect(restored.toOwnerName, original.toOwnerName);
      expect(restored.transferDate, original.transferDate);
      expect(restored.price, original.price);
      expect(restored.notes, original.notes);
      expect(restored.isVerified, original.isVerified);
      expect(restored.verifiedAt, original.verifiedAt);
      expect(restored.verifiedBy, original.verifiedBy);
    });

    test('fromJson defaults missing optional fields', () {
      final t = HorseTransfer.fromJson({
        'id': 't1',
        'horse_id': 'h1',
        'from_owner_id': 'o1',
        'to_owner_id': 'o2',
        'transfer_date': '2026-06-01T00:00:00.000',
      });

      expect(t.fromOwnerName, '');
      expect(t.toOwnerName, '');
      expect(t.price, isNull);
      expect(t.notes, '');
      expect(t.isVerified, false);
      expect(t.verifiedAt, isNull);
      expect(t.verifiedBy, isNull);
    });
  });

  group('HorseTransferHistory', () {
    test('empty history has no owners and reports no transfers', () {
      const history = HorseTransferHistory(horseId: 'h1', transfers: []);

      expect(history.horseId, 'h1');
      expect(history.currentOwner, isNull);
      expect(history.firstOwner, isNull);
      expect(history.transferCount, 0);
      expect(history.summaryText, 'Шилжүүлгийн түүх байхгүй');
    });

    test('currentOwner is the last transfer, firstOwner the first', () {
      final first = _transfer(id: 't1');
      final middle = _transfer(id: 't2');
      final last = _transfer(id: 't3', toOwnerName: 'Эцсийн эзэн');
      final history = HorseTransferHistory(
        horseId: 'h1',
        transfers: [first, middle, last],
      );

      expect(history.transferCount, 3);
      expect(history.firstOwner?.id, 't1');
      expect(history.currentOwner?.id, 't3');
      expect(history.currentOwner?.toOwnerName, 'Эцсийн эзэн');
      expect(history.summaryText, '3 удаа шилжүүлсэн');
    });
  });
}
