/// Жүчээний өгөгдлийн repository (local-first).
library;

import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/boarding_assignment.dart';
import '../domain/stable_invoice.dart';
import '../domain/stable_member.dart';

// ── Repository Interface ──────────────────────────────────────────────

/// Жүчээний үйл ажиллагааны repository.
abstract class StableRepository {
  /// Багийн гишүүд.
  Future<Result<List<StableMember>>> fetchMembers();

  /// Байршиж буй адуу.
  Future<Result<List<BoardingAssignment>>> fetchAssignments();

  /// Нэхэмжлэхүүд.
  Future<Result<List<StableInvoice>>> fetchInvoices();

  /// Гишүүн нэмэх/шинэчлэх.
  Future<Result<void>> saveMember(StableMember member);

  /// Байршил нэмэх/шинэчлэх.
  Future<Result<void>> saveAssignment(BoardingAssignment assignment);

  /// Нэхэмжлэх нэмэх/шинэчлэх.
  Future<Result<void>> saveInvoice(StableInvoice invoice);

  /// Гишүүн устгах.
  Future<Result<void>> deleteMember(String id);

  /// Байршил устгах.
  Future<Result<void>> deleteAssignment(String id);

  /// Нэхэмжлэх устгах.
  Future<Result<void>> deleteInvoice(String id);
}

// ── Local Implementation ──────────────────────────────────────────────

/// SharedPreferences-д суурилсан локал repository.
class LocalStableRepository implements StableRepository {
  LocalStableRepository(this._prefs);

  final SharedPreferences _prefs;

  static const _membersKey = 'stable_members';
  static const _assignmentsKey = 'stable_assignments';
  static const _invoicesKey = 'stable_invoices';

  // ── Members ──

  @override
  Future<Result<List<StableMember>>> fetchMembers() async {
    try {
      final data = await _readList<StableMember>(
        _membersKey,
        StableMember.fromJson,
        _seedMembers,
      );
      return Result.ok(data);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<void>> saveMember(StableMember member) async {
    try {
      await _saveItem<StableMember>(
        _membersKey,
        member,
        (e) => e.id,
        (e) => e.toJson(),
      );
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<void>> deleteMember(String id) async {
    try {
      await _deleteItem<StableMember>(
        _membersKey,
        id,
        (e) => e.id,
        (e) => e.toJson(),
      );
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  // ── Assignments ──

  @override
  Future<Result<List<BoardingAssignment>>> fetchAssignments() async {
    try {
      final data = await _readList<BoardingAssignment>(
        _assignmentsKey,
        BoardingAssignment.fromJson,
        _seedAssignments,
      );
      return Result.ok(data);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<void>> saveAssignment(BoardingAssignment assignment) async {
    try {
      await _saveItem<BoardingAssignment>(
        _assignmentsKey,
        assignment,
        (e) => e.id,
        (e) => e.toJson(),
      );
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<void>> deleteAssignment(String id) async {
    try {
      await _deleteItem<BoardingAssignment>(
        _assignmentsKey,
        id,
        (e) => e.id,
        (e) => e.toJson(),
      );
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  // ── Invoices ──

  @override
  Future<Result<List<StableInvoice>>> fetchInvoices() async {
    try {
      final data = await _readList<StableInvoice>(
        _invoicesKey,
        StableInvoice.fromJson,
        _seedInvoices,
      );
      return Result.ok(data);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<void>> saveInvoice(StableInvoice invoice) async {
    try {
      await _saveItem<StableInvoice>(
        _invoicesKey,
        invoice,
        (e) => e.id,
        (e) => e.toJson(),
      );
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<void>> deleteInvoice(String id) async {
    try {
      await _deleteItem<StableInvoice>(
        _invoicesKey,
        id,
        (e) => e.id,
        (e) => e.toJson(),
      );
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  // ── Generic helpers ──

  Future<List<T>> _readList<T>(
    String key,
    T Function(Map<String, dynamic>) fromJson,
    List<T> seed,
  ) async {
    final raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) {
      // Эхний удаа — seed өгөгдлийг хадгална.
      await _prefs.setString(
        key,
        jsonEncode(seed.map((e) => (e as dynamic).toJson()).toList()),
      );
      return seed;
    }
    final decoded = jsonDecode(raw) as List;
    return decoded.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> _saveItem<T>(
    String key,
    T item,
    String Function(T) getId,
    Map<String, dynamic> Function(T) toJson,
  ) async {
    final raw = _prefs.getString(key);
    final items = raw != null && raw.isNotEmpty
        ? (jsonDecode(raw) as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList()
        : <Map<String, dynamic>>[];

    final index = items.indexWhere((e) => e['id'] == getId(item));
    if (index >= 0) {
      items[index] = toJson(item);
    } else {
      items.add(toJson(item));
    }
    await _prefs.setString(key, jsonEncode(items));
  }

  Future<void> _deleteItem<T>(
    String key,
    String id,
    String Function(T) getId,
    Map<String, dynamic> Function(T) toJson,
  ) async {
    final raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) return;
    final items = (jsonDecode(raw) as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .where((e) => e['id'] != id)
        .toList();
    await _prefs.setString(key, jsonEncode(items));
  }

  AppException _wrap(Object e) => AppException(
    message: 'Жүчээний өгөгдөлд алдаа гарлаа',
    code: 'STABLE_ERROR',
    details: {'original': e.toString()},
  );
}

// ── Seed Data ─────────────────────────────────────────────────────────

List<StableMember> get _seedMembers => [
  StableMember(
    id: 'member-1',
    stableId: 'stable-1',
    displayName: 'Өөрөө (Та)',
    phone: '99112233',
    role: StableRole.owner,
    joinedAt: DateTime(2025, 1, 1),
    horseIds: ['khan-khuleg'],
  ),
  StableMember(
    id: 'member-2',
    stableId: 'stable-1',
    displayName: 'Баттулга',
    phone: '99445566',
    role: StableRole.staff,
    joinedAt: DateTime(2025, 3, 1),
    horseIds: ['altan-shuurga'],
  ),
  StableMember(
    id: 'member-3',
    stableId: 'stable-1',
    displayName: 'Дуламсүрэн',
    phone: '88776655',
    role: StableRole.client,
    joinedAt: DateTime(2025, 5, 15),
    horseIds: ['uulen-bor'],
  ),
];

List<BoardingAssignment> get _seedAssignments => [
  BoardingAssignment(
    id: 'board-1',
    stableId: 'stable-1',
    horseId: 'khan-khuleg',
    horseName: 'Хан Хүлэг',
    ownerId: 'member-1',
    ownerName: 'Өөрөө (Та)',
    startedAt: DateTime(2025, 1, 1),
    status: BoardingStatus.active,
    monthlyFee: 0,
  ),
  BoardingAssignment(
    id: 'board-2',
    stableId: 'stable-1',
    horseId: 'altan-shuurga',
    horseName: 'Алтан Шуурга',
    ownerId: 'member-2',
    ownerName: 'Баттулга',
    startedAt: DateTime(2025, 3, 1),
    status: BoardingStatus.active,
    monthlyFee: 300000,
  ),
  BoardingAssignment(
    id: 'board-3',
    stableId: 'stable-1',
    horseId: 'uulen-bor',
    horseName: 'Үүлэн Бор',
    ownerId: 'member-3',
    ownerName: 'Дуламсүрэн',
    startedAt: DateTime(2025, 5, 15),
    status: BoardingStatus.active,
    monthlyFee: 300000,
  ),
];

List<StableInvoice> get _seedInvoices => [
  StableInvoice(
    id: 'inv-1',
    stableId: 'stable-1',
    clientId: 'member-3',
    clientName: 'Дуламсүрэн',
    issuedAt: DateTime(2025, 6, 1),
    dueAt: DateTime(2025, 6, 15),
    status: InvoiceStatus.unpaid,
    lineItems: [
      const InvoiceLineItem(
        description: 'Үүлэн Бор — 6-р сарын байршил',
        amount: 300000,
      ),
      const InvoiceLineItem(description: 'Тэжээлийн нэмэгдэл', amount: 50000),
    ],
  ),
  StableInvoice(
    id: 'inv-2',
    stableId: 'stable-1',
    clientId: 'member-2',
    clientName: 'Баттулга',
    issuedAt: DateTime(2025, 6, 1),
    dueAt: DateTime(2025, 6, 15),
    status: InvoiceStatus.paid,
    paidAt: DateTime(2025, 6, 5),
    lineItems: [
      const InvoiceLineItem(
        description: 'Алтан Шуурга — 6-р сарын байршил',
        amount: 300000,
      ),
    ],
  ),
  StableInvoice(
    id: 'inv-3',
    stableId: 'stable-1',
    clientId: 'member-3',
    clientName: 'Дуламсүрэн',
    issuedAt: DateTime(2025, 5, 1),
    dueAt: DateTime(2025, 5, 15),
    paidAt: DateTime(2025, 5, 10),
    status: InvoiceStatus.paid,
    lineItems: [
      const InvoiceLineItem(
        description: 'Үүлэн Бор — 5-р сарын байршил',
        amount: 300000,
      ),
    ],
  ),
];
