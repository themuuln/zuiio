import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tamga/src/features/stable/data/stable_repository.dart';
import 'package:tamga/src/features/stable/domain/boarding_assignment.dart';
import 'package:tamga/src/features/stable/domain/stable_invoice.dart';
import 'package:tamga/src/features/stable/domain/stable_member.dart';

void main() {
  late LocalStableRepository repo;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    repo = LocalStableRepository(prefs);
  });

  // ── Members ───────────────────────────────────────────────────

  group('Members', () {
    test('fetchMembers returns seed data on first call', () async {
      final result = await repo.fetchMembers();

      expect(result.isSuccess, isTrue);
      expect(result.value.length, 3);
      expect(result.value[0].displayName, 'Өөрөө (Та)');
      expect(result.value[0].role, StableRole.owner);
    });

    test('fetchMembers returns persistent data on second call', () async {
      await repo.fetchMembers(); // seed
      final result = await repo.fetchMembers();

      expect(result.isSuccess, isTrue);
      expect(result.value.length, 3);
    });

    test('saveMember adds a new member', () async {
      await repo.fetchMembers(); // seed

      final newMember = StableMember(
        id: 'member-new',
        stableId: 'stable-1',
        displayName: 'Шинэ хэрэглэгч',
        phone: '99990000',
        role: StableRole.staff,
        joinedAt: DateTime(2025, 7, 1),
      );
      final saveResult = await repo.saveMember(newMember);
      expect(saveResult.isSuccess, isTrue);

      final fetchResult = await repo.fetchMembers();
      expect(fetchResult.value.length, 4);
      expect(fetchResult.value.any((m) => m.id == 'member-new'), isTrue);
    });

    test('saveMember updates an existing member', () async {
      await repo.fetchMembers(); // seed

      final updated = StableMember(
        id: 'member-1',
        stableId: 'stable-1',
        displayName: 'Шинэ нэр',
        phone: '99112233',
        role: StableRole.owner,
        joinedAt: DateTime(2025, 1, 1),
      );
      await repo.saveMember(updated);

      final result = await repo.fetchMembers();
      final found = result.value.firstWhere((m) => m.id == 'member-1');
      expect(found.displayName, 'Шинэ нэр');
      expect(result.value.length, 3); // not added
    });

    test('deleteMember removes a member', () async {
      await repo.fetchMembers(); // seed
      await repo.deleteMember('member-2');

      final result = await repo.fetchMembers();
      expect(result.value.length, 2);
      expect(result.value.any((m) => m.id == 'member-2'), isFalse);
    });

    test('deleteMember with unknown id does nothing', () async {
      await repo.fetchMembers(); // seed
      await repo.deleteMember('nonexistent');

      final result = await repo.fetchMembers();
      expect(result.value.length, 3);
    });
  });

  // ── Assignments ───────────────────────────────────────────────

  group('Assignments', () {
    test('fetchAssignments returns seed data on first call', () async {
      final result = await repo.fetchAssignments();

      expect(result.isSuccess, isTrue);
      expect(result.value.length, 3);
      expect(result.value[0].horseName, 'Хан Хүлэг');
    });

    test('saveAssignment adds a new assignment', () async {
      await repo.fetchAssignments(); // seed

      final newAssignment = BoardingAssignment(
        id: 'board-new',
        stableId: 'stable-1',
        horseId: 'horse-new',
        horseName: 'Шинэ морь',
        ownerId: 'member-1',
        ownerName: 'Эзэн',
        startedAt: DateTime(2025, 7, 1),
        status: BoardingStatus.active,
        monthlyFee: 200000,
      );
      await repo.saveAssignment(newAssignment);

      final result = await repo.fetchAssignments();
      expect(result.value.length, 4);
      expect(result.value.any((a) => a.id == 'board-new'), isTrue);
    });

    test('saveAssignment updates an existing assignment', () async {
      await repo.fetchAssignments(); // seed

      await repo.saveAssignment(
        BoardingAssignment(
          id: 'board-1',
          stableId: 'stable-1',
          horseId: 'horse-1',
          horseName: 'Хан Хүлэг',
          ownerId: 'member-1',
          ownerName: 'Өөрөө (Та)',
          startedAt: DateTime(2025, 1, 1),
          status: BoardingStatus.ended,
          endedAt: DateTime(2025, 7, 1),
        ),
      );

      final result = await repo.fetchAssignments();
      final updated = result.value.firstWhere((a) => a.id == 'board-1');
      expect(updated.status, BoardingStatus.ended);
      expect(updated.endedAt, DateTime(2025, 7, 1));
    });

    test('deleteAssignment removes an assignment', () async {
      await repo.fetchAssignments(); // seed
      await repo.deleteAssignment('board-1');

      final result = await repo.fetchAssignments();
      expect(result.value.length, 2);
      expect(result.value.any((a) => a.id == 'board-1'), isFalse);
    });
  });

  // ── Invoices ──────────────────────────────────────────────────

  group('Invoices', () {
    test('fetchInvoices returns seed data on first call', () async {
      final result = await repo.fetchInvoices();

      expect(result.isSuccess, isTrue);
      expect(result.value.length, 3);
      expect(result.value[0].clientName, 'Дуламсүрэн');
    });

    test('fetchInvoices sorts line items correctly', () async {
      final result = await repo.fetchInvoices();

      final inv = result.value.firstWhere((i) => i.id == 'inv-1');
      expect(inv.totalAmount, 350000); // 300000 + 50000
    });

    test('saveInvoice adds a new invoice', () async {
      await repo.fetchInvoices(); // seed

      final newInvoice = StableInvoice(
        id: 'inv-new',
        stableId: 'stable-1',
        clientId: 'member-new',
        clientName: 'Шинэ хэрэглэгч',
        issuedAt: DateTime(2025, 7, 1),
        status: InvoiceStatus.unpaid,
        lineItems: [
          const InvoiceLineItem(
            description: '7-р сарын байршил',
            amount: 300000,
          ),
        ],
      );
      await repo.saveInvoice(newInvoice);

      final result = await repo.fetchInvoices();
      expect(result.value.length, 4);
      expect(result.value.any((i) => i.id == 'inv-new'), isTrue);
    });

    test('saveInvoice updates existing invoice status', () async {
      await repo.fetchInvoices(); // seed

      await repo.saveInvoice(
        StableInvoice(
          id: 'inv-1',
          stableId: 'stable-1',
          clientId: 'member-3',
          clientName: 'Дуламсүрэн',
          issuedAt: DateTime(2025, 6, 1),
          status: InvoiceStatus.paid,
          paidAt: DateTime(2025, 6, 10),
          lineItems: [
            const InvoiceLineItem(
              description: '6-р сарын байршил',
              amount: 300000,
            ),
          ],
        ),
      );

      final result = await repo.fetchInvoices();
      final updated = result.value.firstWhere((i) => i.id == 'inv-1');
      expect(updated.status, InvoiceStatus.paid);
      expect(updated.paidAt, DateTime(2025, 6, 10));
      expect(updated.totalAmount, 300000);
    });

    test('deleteInvoice removes an invoice', () async {
      await repo.fetchInvoices(); // seed
      await repo.deleteInvoice('inv-2');

      final result = await repo.fetchInvoices();
      expect(result.value.length, 2);
      expect(result.value.any((i) => i.id == 'inv-2'), isFalse);
    });
  });

  // ── Error handling ────────────────────────────────────────────

  group('Error handling', () {
    test(
      'fetchMembers returns success even with empty SharedPreferences',
      () async {
        SharedPreferences.setMockInitialValues({'stable_members': ''});
        final prefs = await SharedPreferences.getInstance();
        final emptyRepo = LocalStableRepository(prefs);

        final result = await emptyRepo.fetchMembers();
        expect(result.isSuccess, isTrue);
      },
    );
  });
}
