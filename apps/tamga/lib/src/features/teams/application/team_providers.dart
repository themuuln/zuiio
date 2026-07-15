import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../features/payments/domain/payment_request.dart';
import '../../../features/shared/data/isar_storage.dart';
import '../../auth/application/auth_providers.dart';
import '../data/local_team_repository.dart';
import '../data/team_repository.dart';
import '../domain/team.dart';
import '../domain/team_invitation.dart';
import '../domain/team_member.dart';

// ── Repository ─────────────────────────────────────────────────────

/// Багийн repository provider.
///
/// Offline-first approach: always uses [LocalTeamRepository].
final teamRepositoryProvider = Provider<TeamRepository>((ref) {
  return LocalTeamRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

// ── User Teams ─────────────────────────────────────────────────────

/// Одоогийн хэрэглэгчийн бүх багууд.
final userTeamsProvider = FutureProvider<List<Team>>((ref) async {
  final authState = ref.watch(authStateProvider).valueOrNull;
  final userId = authState?.userId;
  if (userId == null) return [];

  final repo = ref.watch(teamRepositoryProvider);
  final result = await repo.getUserTeams(userId);
  return result.getOrThrow();
});

/// Одоогийн хэрэглэгчийн анхны баг (жүчээ).
final currentTeamProvider = FutureProvider<Team?>((ref) async {
  final teams = await ref.watch(userTeamsProvider.future);
  return teams.isNotEmpty ? teams.first : null;
});

// ── Team Members ──────────────────────────────────────────────────

/// Багийн бүх гишүүд.
final teamMembersProvider =
    createListFamilyProvider<TeamMember, TeamRepository, String>(
      (ref) async => ref.watch(teamRepositoryProvider),
      (repo, teamId) => repo.getMembers(teamId),
    );

// ── Current User's Role ───────────────────────────────────────────

/// Одоогийн хэрэглэгчийн баг доторх дүр.
final currentUserTeamRoleProvider = Provider.family<TeamRole?, String>((
  ref,
  teamId,
) {
  final authState = ref.watch(authStateProvider).valueOrNull;
  final userId = authState?.userId;
  if (userId == null) return null;

  final members = ref.watch(teamMembersProvider(teamId)).valueOrNull ?? [];
  return members.where((m) => m.userId == userId).firstOrNull?.role;
});

// ── Is Owner ──────────────────────────────────────────────────────

/// Одоогийн хэрэглэгч багийн эзэн эсэх.
final isTeamOwnerProvider = Provider.family<bool, String>((ref, teamId) {
  final role = ref.watch(currentUserTeamRoleProvider(teamId));
  return role == TeamRole.owner;
});

// ── Multi-User Gate ───────────────────────────────────────────────

/// Олон хэрэглэгчийн удирдлагын хаалга (Stable түвшинд нээлттэй).
///
/// `TierLimits.maxMultiUsers > 1` үед зөвшөөрнө.
final hasMultiUsersGateProvider = Provider<GateCheck>((ref) {
  final limits = ref.watch(tierLimitsProvider);
  if (limits.maxMultiUsers != null && limits.maxMultiUsers! > 1) {
    return const GateAllowed();
  }
  return const GateDenied(
    reason:
        'Олон хэрэглэгчийн удирдлага нь Stable захиалгын боломж юм. '
        'Stable захиалгаар 10 хүртэл хамтын хэрэглэгчтэй ажиллах боломжтой.',
    requiredTier: SubscriptionTier.stable,
  );
});

/// Олон хэрэглэгчийн боломж нээлттэй эсэх.
final hasMultiUsersProvider = Provider<bool>((ref) {
  final gate = ref.watch(hasMultiUsersGateProvider);
  return gate is GateAllowed;
});

// ── Invitation Providers ───────────────────────────────────────────

/// Одоогийн хэрэглэгчийн хүлээгдэж буй урилгууд.
final pendingInvitationsProvider = FutureProvider<List<TeamInvitation>>((
  ref,
) async {
  final authState = ref.watch(authStateProvider).valueOrNull;
  final userId = authState?.userId;
  if (userId == null) return [];

  final repo = ref.watch(teamRepositoryProvider);
  final result = await repo.getPendingInvitations(userId);
  return result.getOrThrow();
});

/// Хүлээгдэж буй урилгуудын тоо.
final pendingInvitationsCountProvider = Provider<int>((ref) {
  final invitations = ref.watch(pendingInvitationsProvider).valueOrNull ?? [];
  return invitations.length;
});

/// Тодорхой багийн нэрийг урилгаар авах туслах.
final teamNameByIdProvider = FutureProvider.family<String?, String>((
  ref,
  teamId,
) async {
  final repo = ref.watch(teamRepositoryProvider);
  final result = await repo.getTeam(teamId);
  return result.isSuccess ? result.value.name : null;
});
