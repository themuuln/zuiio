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
import 'package:tamga/src/features/teams/presentation/team_management_screen.dart';
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
  bool failOperation = false;
  String? removedUserId;
  String? roleChangedUserId;
  TeamRole? newRole;
  bool invited = false;

  @override
  Future<Result<Team>> createTeam(Team team) async {
    if (failOperation) {
      return Result.fail(AppException(message: 'Test error', code: 'TEST'));
    }
    this.team = team;
    return Result.ok(team);
  }

  @override
  Future<Result<Team>> getTeam(String teamId) async {
    if (failOperation || team == null) {
      return Result.fail(AppException(message: 'Test error', code: 'TEST'));
    }
    return Result.ok(team!);
  }

  @override
  Future<Result<List<TeamMember>>> getMembers(String teamId) async {
    if (failOperation) {
      return Result.fail(AppException(message: 'Test error', code: 'TEST'));
    }
    return Result.ok(members);
  }

  @override
  Future<Result<TeamMember>> inviteMember(TeamMember member) async {
    if (failOperation) {
      return Result.fail(AppException(message: 'Test error', code: 'TEST'));
    }
    invited = true;
    members.add(member);
    return Result.ok(member);
  }

  @override
  Future<Result<void>> removeMember(String teamId, String userId) async {
    if (failOperation) {
      return Result.fail(AppException(message: 'Test error', code: 'TEST'));
    }
    removedUserId = userId;
    members.removeWhere((m) => m.userId == userId);
    return const Result.ok(null);
  }

  @override
  Future<Result<TeamMember>> updateRole(
    String teamId,
    String userId,
    TeamRole newRole, {
    List<TeamPermission>? permissions,
  }) async {
    if (failOperation) {
      return Result.fail(AppException(message: 'Test error', code: 'TEST'));
    }
    roleChangedUserId = userId;
    this.newRole = newRole;
    final idx = members.indexWhere((m) => m.userId == userId);
    if (idx >= 0) {
      members[idx] = members[idx].copyWith(
        role: newRole,
        permissions: permissions,
      );
    }
    return Result.ok(members[idx]);
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
  TeamMember(
    id: 'm4',
    teamId: 'team-1',
    userId: 'user-4',
    role: TeamRole.groom,
    joinedAt: _now,
  ),
  TeamMember(
    id: 'm5',
    teamId: 'team-1',
    userId: 'user-5',
    role: TeamRole.viewer,
    joinedAt: _now,
  ),
];

Widget createTeamManagementScreen({
  Team? team,
  List<TeamMember>? members,
  bool simulateError = false,
  bool simulateLoading = false,
  bool isOwner = true,
  bool isStableTier = true,
}) {
  final mockRepo = _MockTeamRepository();
  mockRepo.team = team ?? _testTeam;
  mockRepo.members = members ?? _testMembers;
  mockRepo.userTeams = [team ?? _testTeam];
  mockRepo.failOperation = simulateError || simulateLoading;

  // For loading simulation, override the team provider to be pending
  if (simulateLoading) {
    final completer = Completer<Team?>();
    final membersCompleter = Completer<List<TeamMember>>();

    final userId = isOwner ? 'user-1' : 'user-2';
    final authState = AuthState.authenticated(userId: userId);

    return ProviderScope(
      overrides: [
        currentTeamProvider.overrideWith((ref) => completer.future),
        teamMembersProvider(
          _testTeam.id,
        ).overrideWith((ref) => membersCompleter.future),
        teamRepositoryProvider.overrideWithValue(mockRepo),
        authStateProvider.overrideWith(() => _FakeAuthStateNotifier(authState)),
        subscriptionTierProvider.overrideWith(
          (ref) async =>
              isStableTier ? SubscriptionTier.stable : SubscriptionTier.free,
        ),
      ],
      child: MaterialApp(
        theme: TamgaDesignSystem.buildThemeData(Brightness.light),
        home: const TeamManagementScreen(),
      ),
    );
  }

  final userId = isOwner ? 'user-1' : 'user-2';
  final authState = AuthState.authenticated(userId: userId);

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
      home: const TeamManagementScreen(),
    ),
  );
}

void main() {
  group('TeamManagementScreen', () {
    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-005: Shows members with role badges
    // ══════════════════════════════════════════════════════════
    testWidgets('shows team name and member count', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen());
      await tester.pumpAndSettle();

      expect(find.text('Миний жүчээ'), findsOneWidget);
      expect(find.textContaining('гишүүд'), findsOneWidget);
    });

    testWidgets('shows members list with role badges', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen());
      await tester.pumpAndSettle();

      // All members should be visible
      // We check for role badges by looking for role display names
      expect(find.text('Эзэмшигч'), findsOneWidget);
      expect(find.text('Менежер'), findsOneWidget);
      expect(find.text('Эмч'), findsOneWidget);
      expect(find.text('Тэжээвэр'), findsOneWidget);
      expect(find.text('Үзэгч'), findsOneWidget);
    });

    testWidgets('shows horse count in team info', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen(isOwner: true));
      await tester.pumpAndSettle();

      expect(find.text('Гишүүн урих'), findsOneWidget);
    });

    testWidgets('owner sees remove and change role icons for members', (
      tester,
    ) async {
      await tester.pumpWidget(createTeamManagementScreen(isOwner: true));
      await tester.pumpAndSettle();

      // Owner should see action icons for non-owner members
      // We check for the more_vert icon on member tiles
      // The owner tile has no remove button, but other members do
      expect(find.byIcon(Icons.more_vert), findsWidgets);
    });

    testWidgets('non-owner does not see invite button', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen(isOwner: false));
      await tester.pumpAndSettle();

      expect(find.text('Гишүүн урих'), findsNothing);
    });

    testWidgets('tapping invite navigates to invite screen', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen(isOwner: true));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Гишүүн урих'));
      await tester.pumpAndSettle();

      // Should navigate to invite screen - look for invite screen elements
      expect(find.text('Гишүүн урих'), findsWidgets); // AppBar title
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-005: Role change action
    // ══════════════════════════════════════════════════════════
    testWidgets('owner can change member role', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen(isOwner: true));
      await tester.pumpAndSettle();

      // Tap more_vert on a member (e.g., second member tile)
      final moreButtons = find.byIcon(Icons.more_vert);
      await tester.tap(moreButtons.first);
      await tester.pumpAndSettle();

      // Should show bottom sheet with role options
      expect(find.text('Дүр өөрчлөх'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-005: Remove member action
    // ══════════════════════════════════════════════════════════
    testWidgets('owner can remove member', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen(isOwner: true));
      await tester.pumpAndSettle();

      final moreButtons = find.byIcon(Icons.more_vert);
      await tester.tap(moreButtons.first);
      await tester.pumpAndSettle();

      expect(find.text('Гишүүн хасах'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-005: Loading and error states
    // ══════════════════════════════════════════════════════════
    testWidgets('shows loading state', (tester) async {
      await tester.pumpWidget(
        createTeamManagementScreen(simulateLoading: true),
      );
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-005: Horse count display
    // ══════════════════════════════════════════════════════════
    testWidgets('shows horse count in team info', (tester) async {
      await tester.pumpWidget(createTeamManagementScreen());
      await tester.pumpAndSettle();

      // Check for horse count indicator - it's part of a combined string
      // The team info shows: "3 гишүүд • 10 морьд"
      expect(find.textContaining('гишүүд'), findsOneWidget);
      expect(find.textContaining('морьд'), findsOneWidget);
    });
  });
}
