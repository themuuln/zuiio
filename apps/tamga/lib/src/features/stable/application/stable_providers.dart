/// Жүчээний provider-үүд.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/features/feature_flags.dart';
import '../../../core/features/feature_flags_providers.dart';
import '../data/stable_repository.dart';
import '../domain/boarding_assignment.dart';
import '../domain/stable_invoice.dart';
import '../domain/stable_member.dart';

// ── Repository Provider ───────────────────────────────────────────────

/// Жүчээний repository.
final stableRepositoryProvider = Provider<StableRepository>((ref) {
  throw UnimplementedError('Override in main() or use async init');
});

/// Async init-тэй repository.
final stableRepositoryInitProvider = FutureProvider<StableRepository>((
  ref,
) async {
  final prefs = await SharedPreferences.getInstance();
  return LocalStableRepository(prefs);
});

// ── Feature Gate ──────────────────────────────────────────────────────

/// Жүчээний функц идэвхтэй эсэх.
final stableEnabledProvider = Provider<bool>((ref) {
  return ref.watch(featureFlagProvider(FeatureFlag.stableManagement));
});

// ── Data Providers ────────────────────────────────────────────────────

/// Багийн гишүүд.
final stableMembersProvider = FutureProvider<List<StableMember>>((ref) async {
  final repo = await ref.watch(stableRepositoryInitProvider.future);
  final result = await repo.fetchMembers();
  return result.isSuccess ? result.value : throw result.error;
});

/// Байршиж буй адуу.
final stableAssignmentsProvider = FutureProvider<List<BoardingAssignment>>((
  ref,
) async {
  final repo = await ref.watch(stableRepositoryInitProvider.future);
  final result = await repo.fetchAssignments();
  return result.isSuccess ? result.value : throw result.error;
});

/// Нэхэмжлэхүүд.
final stableInvoicesProvider = FutureProvider<List<StableInvoice>>((ref) async {
  final repo = await ref.watch(stableRepositoryInitProvider.future);
  final result = await repo.fetchInvoices();
  return result.isSuccess ? result.value : throw result.error;
});

// ── Computed Providers ────────────────────────────────────────────────

/// Идэвхтэй байршилтай адууны тоо.
final activeBoardersCountProvider = Provider<int>((ref) {
  final assignments = ref.watch(stableAssignmentsProvider).valueOrNull ?? [];
  return assignments.where((a) => a.status == BoardingStatus.active).length;
});

/// Төлөгдөөгүй нэхэмжлэхийн тоо.
final unpaidInvoicesCountProvider = Provider<int>((ref) {
  final invoices = ref.watch(stableInvoicesProvider).valueOrNull ?? [];
  return invoices.where((inv) => inv.status == InvoiceStatus.unpaid).length;
});

/// Төлөгдөөгүй нэхэмжлэхийн нийт дүн.
final unpaidInvoicesTotalProvider = Provider<int>((ref) {
  final invoices = ref.watch(stableInvoicesProvider).valueOrNull ?? [];
  return invoices
      .where((inv) => inv.status == InvoiceStatus.unpaid)
      .fold(0, (sum, inv) => sum + inv.totalAmount);
});

/// Багийн гишүүдийн тоо.
final teamMemberCountProvider = Provider<int>((ref) {
  final members = ref.watch(stableMembersProvider).valueOrNull ?? [];
  return members.where((m) => m.role != StableRole.client).length;
});
