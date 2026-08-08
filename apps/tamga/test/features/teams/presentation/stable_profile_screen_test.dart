import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/payments/application/payment_providers.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';
import 'package:tamga/src/features/teams/application/team_providers.dart';
import 'package:tamga/src/features/teams/data/team_repository.dart';
import 'package:tamga/src/features/teams/domain/team.dart';
import 'package:tamga/src/features/teams/domain/team_invitation.dart';
import 'package:tamga/src/features/teams/domain/team_member.dart';
import 'package:tamga/src/features/teams/presentation/stable_profile_screen.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

// ── Fake Auth State Notifier ────────────────────────────────────────

class _FakeAuthStateNotifier extends AuthStateNotifier {
  _FakeAuthStateNotifier(this._state);

  final AuthState _state;

  @override
  Stream<AuthState> build() async* {
    yield _state;
  }
}

// ── Mock Team Repository ───────────────────────────────────────────

class _MockTeamRepository implements TeamRepository {
  Team? team;
  List<TeamMember> members = [];
  List<Team> userTeams = [];

  @override
  Future<Result<Team>> createTeam(Team team) async => Result.ok(team);

  @override
  Future<Result<Team>> getTeam(String teamId) async {
    if (team == null) {
      return Result.fail(
        AppException(message: 'Not found', code: 'TEAM_NOT_FOUND'),
      );
    }
    return Result.ok(team!);
  }

  @override
  Future<Result<List<TeamMember>>> getMembers(String teamId) async {
    return Result.ok(members);
  }

  @override
  Future<Result<TeamMember>> inviteMember(TeamMember member) async {
    return Result.ok(member);
  }

  @override
  Future<Result<void>> removeMember(String teamId, String userId) async {
    return const Result.ok(null);
  }

  @override
  Future<Result<TeamMember>> updateRole(
    String teamId,
    String userId,
    TeamRole newRole, {
    List<TeamPermission>? permissions,
  }) async {
    return Result.ok(
      TeamMember(
        id: 'm1',
        teamId: teamId,
        userId: userId,
        role: newRole,
        joinedAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<Result<List<Team>>> getUserTeams(String userId) async {
    return Result.ok(userTeams);
  }

  // ── Invitation Methods (unused in these tests) ──

  @override
  Future<Result<TeamInvitation>> createInvitation(
    TeamInvitation invitation,
  ) async {
    return Result.ok(invitation);
  }

  @override
  Future<Result<List<TeamInvitation>>> getPendingInvitations(
    String userId,
  ) async {
    return const Result.ok([]);
  }

  @override
  Future<Result<TeamMember>> acceptInvitation(String invitationId) async {
    return Result.fail(
      AppException(message: 'Not implemented', code: 'NOT_IMPLEMENTED'),
    );
  }

  @override
  Future<Result<void>> declineInvitation(String invitationId) async {
    return const Result.ok(null);
  }

  @override
  Future<Result<void>> addHorseToTeam(
    String teamId,
    String horseId, {
    String? addedBy,
  }) async => const Result.ok(null);

  @override
  Future<Result<void>> removeHorseFromTeam(
    String teamId,
    String horseId,
  ) async => const Result.ok(null);
}

// ── Test Helpers ───────────────────────────────────────────────────

final _now = DateTime(2026, 6, 18);

final _testTeam = Team(
  id: 'team-1',
  name: 'Миний жүчээ',
  ownerUserId: 'user-1',
  memberCount: 3,
  horseCount: 10,
  createdAt: _now,
);

final _testMembers = [
  TeamMember(
    id: 'm1',
    teamId: 'team-1',
    userId: 'user-1',
    role: TeamRole.owner,
    joinedAt: _now,
  ),
  TeamMember(
    id: 'm2',
    teamId: 'team-1',
    userId: 'user-2',
    role: TeamRole.manager,
    joinedAt: _now,
  ),
  TeamMember(
    id: 'm3',
    teamId: 'team-1',
    userId: 'user-3',
    role: TeamRole.vet,
    joinedAt: _now,
  ),
];

Widget createStableProfileScreen({
  Team? team,
  List<TeamMember>? members,
  bool simulateError = false,
  bool isStableTier = true,
  bool hasNoTeam = false,
}) {
  final mockRepo = _MockTeamRepository();
  mockRepo.team = team ?? _testTeam;
  mockRepo.members = members ?? _testMembers;
  mockRepo.userTeams = hasNoTeam ? [] : [team ?? _testTeam];
  mockRepo.team = hasNoTeam ? null : (team ?? _testTeam);

  const authState = AuthState.authenticated(userId: 'user-1');

  return ProviderScope(
    overrides: [
      teamRepositoryProvider.overrideWithValue(mockRepo),
      authStateProvider.overrideWith(() => _FakeAuthStateNotifier(authState)),
      subscriptionTierProvider.overrideWith(
        (ref) async =>
            isStableTier ? SubscriptionTier.stable : SubscriptionTier.free,
      ),
    ],
    child: MaterialApp(
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: const StableProfileScreen(),
    ),
  );
}

void main() {
  group('StableProfileScreen', () {
    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-007: Stable profile shows member list and horse count
    // ══════════════════════════════════════════════════════════
    testWidgets('shows stable name and member/horse count', (tester) async {
      await tester.pumpWidget(createStableProfileScreen());
      await tester.pumpAndSettle();

      expect(find.text('Миний жүчээ'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
      expect(find.text('гишүүд'), findsOneWidget);
      expect(find.text('10'), findsOneWidget);
      expect(find.text('морьд'), findsOneWidget);
    });

    testWidgets('shows member list with roles', (tester) async {
      await tester.pumpWidget(createStableProfileScreen());
      await tester.pumpAndSettle();

      expect(find.text('Эзэмшигч'), findsOneWidget);
      expect(find.text('Менежер'), findsOneWidget);
      expect(find.text('Эмч'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-007: Tier gated behind Stable
    // ══════════════════════════════════════════════════════════
    testWidgets('shows content for Stable tier', (tester) async {
      await tester.pumpWidget(createStableProfileScreen(isStableTier: true));
      await tester.pumpAndSettle();

      expect(find.text('Миний жүчээ'), findsOneWidget);
    });

    testWidgets('shows upgrade prompt for non-Stable tier', (tester) async {
      await tester.pumpWidget(createStableProfileScreen(isStableTier: false));
      await tester.pumpAndSettle();

      expect(find.text('Stable захиалга шаардлагатай'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-007: Role-based display
    // ══════════════════════════════════════════════════════════
    testWidgets('shows role labels for each member', (tester) async {
      await tester.pumpWidget(createStableProfileScreen());
      await tester.pumpAndSettle();

      // All role badges should be visible
      expect(find.text('Эзэмшигч'), findsOneWidget);
      expect(find.text('Менежер'), findsOneWidget);
      expect(find.text('Эмч'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // Empty state
    // ══════════════════════════════════════════════════════════
    testWidgets('shows empty state when user has no team', (tester) async {
      await tester.pumpWidget(createStableProfileScreen(hasNoTeam: true));
      await tester.pumpAndSettle();

      expect(find.text('Жүчээ байхгүй байна'), findsOneWidget);
    });
  });
}
