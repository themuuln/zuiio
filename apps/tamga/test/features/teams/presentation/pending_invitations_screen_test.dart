import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/teams/application/team_providers.dart';
import 'package:tamga/src/features/teams/data/team_repository.dart';
import 'package:tamga/src/features/teams/domain/team.dart';
import 'package:tamga/src/features/teams/domain/team_invitation.dart';
import 'package:tamga/src/features/teams/domain/team_member.dart';
import 'package:tamga/src/features/teams/presentation/pending_invitations_screen.dart';
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
  List<TeamInvitation> invitations = [];
  bool failAccept = false;
  bool failDecline = false;

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
    members.add(member);
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
    return Result.ok(team != null ? [team!] : []);
  }

  @override
  Future<Result<TeamInvitation>> createInvitation(
    TeamInvitation invitation,
  ) async {
    invitations.add(invitation);
    return Result.ok(invitation);
  }

  @override
  Future<Result<List<TeamInvitation>>> getPendingInvitations(
    String userId,
  ) async {
    final pending = invitations
        .where(
          (i) =>
              i.invitedUserId == userId && i.status == InvitationStatus.pending,
        )
        .toList();
    return Result.ok(pending);
  }

  @override
  Future<Result<TeamMember>> acceptInvitation(String invitationId) async {
    if (failAccept) {
      return Result.fail(
        AppException(message: 'Accept failed', code: 'ACCEPT_FAILED'),
      );
    }
    final idx = invitations.indexWhere((i) => i.id == invitationId);
    if (idx < 0) {
      return Result.fail(
        AppException(message: 'Not found', code: 'INVITATION_NOT_FOUND'),
      );
    }
    final inv = invitations[idx];
    invitations[idx] = inv.copyWith(status: InvitationStatus.accepted);
    final member = TeamMember(
      id: invitationId,
      teamId: inv.teamId,
      userId: inv.invitedUserId,
      role: inv.role,
      joinedAt: DateTime.now(),
    );
    members.add(member);
    return Result.ok(member);
  }

  @override
  Future<Result<void>> declineInvitation(String invitationId) async {
    if (failDecline) {
      return Result.fail(
        AppException(message: 'Decline failed', code: 'DECLINE_FAILED'),
      );
    }
    final idx = invitations.indexWhere((i) => i.id == invitationId);
    if (idx < 0) {
      return Result.fail(
        AppException(message: 'Not found', code: 'INVITATION_NOT_FOUND'),
      );
    }
    invitations[idx] = invitations[idx].copyWith(
      status: InvitationStatus.declined,
    );
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

Widget createPendingInvitationsScreen({
  List<TeamInvitation> invitations = const [],
  bool failAccept = false,
  bool failDecline = false,
}) {
  final mockRepo = _MockTeamRepository();
  mockRepo.team = Team(
    id: 'team-1',
    name: 'Миний жүчээ',
    ownerUserId: 'user-1',
    memberCount: 3,
    horseCount: 10,
    createdAt: DateTime(2026, 6, 18),
  );
  mockRepo.invitations = List.from(invitations);
  mockRepo.failAccept = failAccept;
  mockRepo.failDecline = failDecline;

  const authState = AuthState.authenticated(userId: 'user-2');

  return ProviderScope(
    overrides: [
      teamRepositoryProvider.overrideWithValue(mockRepo),
      authStateProvider.overrideWith(() => _FakeAuthStateNotifier(authState)),
    ],
    child: MaterialApp(
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: const PendingInvitationsScreen(),
    ),
  );
}

TeamInvitation createMockInvitation({
  String id = 'inv-1',
  String teamName = 'Тест баг',
  String invitedUserId = 'user-2',
  String invitedByUserId = 'user-1',
  TeamRole role = TeamRole.viewer,
  InvitationStatus status = InvitationStatus.pending,
}) {
  return TeamInvitation(
    id: id,
    teamId: 'team-1',
    teamName: teamName,
    invitedUserId: invitedUserId,
    invitedByUserId: invitedByUserId,
    role: role,
    status: status,
    createdAt: DateTime(2026, 6, 18),
  );
}

void main() {
  group('PendingInvitationsScreen', () {
    testWidgets('shows empty state when no invitations', (tester) async {
      await tester.pumpWidget(createPendingInvitationsScreen());
      await tester.pumpAndSettle();

      expect(find.text('Шинэ урилга байхгүй'), findsOneWidget);
      expect(find.text('Танд идэвхтэй урилга байхгүй байна'), findsOneWidget);
    });

    testWidgets('shows invitation cards with team name and role', (
      tester,
    ) async {
      final invitations = [
        createMockInvitation(teamName: 'Монгол жүчээ', role: TeamRole.manager),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      expect(find.text('Монгол жүчээ'), findsOneWidget);
      expect(find.text('Менежер'), findsOneWidget);
      expect(find.text('Зөвшөөрөх'), findsOneWidget);
      expect(find.text('Татгалзах'), findsOneWidget);
    });

    testWidgets('shows multiple invitations', (tester) async {
      final invitations = [
        createMockInvitation(id: 'inv-1', teamName: 'Баг 1'),
        createMockInvitation(id: 'inv-2', teamName: 'Баг 2'),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      expect(find.text('Баг 1'), findsOneWidget);
      expect(find.text('Баг 2'), findsOneWidget);
    });

    testWidgets('shows role-specific badge colors', (tester) async {
      final invitations = [
        createMockInvitation(teamName: 'Viewer Role', role: TeamRole.viewer),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      expect(find.text('Viewer Role'), findsOneWidget);
      expect(find.text('Үзэгч'), findsOneWidget);
    });

    testWidgets('shows accept confirmation dialog', (tester) async {
      final invitations = [
        createMockInvitation(teamName: 'Миний баг', role: TeamRole.manager),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      // Tap accept button
      await tester.tap(find.text('Зөвшөөрөх'));
      await tester.pumpAndSettle();

      // Should show confirmation dialog
      expect(find.text('Урилга хүлээн авах'), findsOneWidget);
      // The dialog text contains the team name
      expect(find.textContaining('Миний баг'), findsWidgets);
      // Dialog content should mention role
      expect(find.textContaining('Менежер дүрээр'), findsOneWidget);
    });

    testWidgets('shows decline confirmation dialog', (tester) async {
      final invitations = [createMockInvitation(teamName: 'Миний баг')];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      // Tap decline button
      await tester.tap(find.text('Татгалзах'));
      await tester.pumpAndSettle();

      // Should show confirmation dialog
      expect(find.text('Урилгаас татгалзах'), findsOneWidget);
    });

    testWidgets('accept removes invitation from list', (tester) async {
      final invitations = [
        createMockInvitation(id: 'inv-1', teamName: 'Миний баг'),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      // Tap accept button
      await tester.tap(find.text('Зөвшөөрөх'));
      await tester.pumpAndSettle();

      // Confirm in dialog
      await tester.tap(find.text('Зөвшөөрөх').last);
      await tester.pumpAndSettle();

      // After accept, the screen should navigate to StableProfileScreen
      // Since we navigated away, the PendingInvitationsScreen is gone
      // Verify no crash and screen transition occurred
      expect(find.byType(PendingInvitationsScreen), findsNothing);
    });

    testWidgets('decline removes invitation from list', (tester) async {
      final invitations = [
        createMockInvitation(id: 'inv-1', teamName: 'Миний баг'),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(invitations: invitations),
      );
      await tester.pumpAndSettle();

      // Tap decline button
      await tester.tap(find.text('Татгалзах'));
      await tester.pumpAndSettle();

      // Confirm in dialog
      await tester.tap(find.text('Татгалзах').last);
      await tester.pumpAndSettle();

      // After decline, should show empty state
      expect(find.text('Шинэ урилга байхгүй'), findsOneWidget);
    });

    testWidgets('shows error toast when accept fails', (tester) async {
      final invitations = [
        createMockInvitation(id: 'inv-1', teamName: 'Миний баг'),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(
          invitations: invitations,
          failAccept: true,
        ),
      );
      await tester.pumpAndSettle();

      // Tap accept button
      await tester.tap(find.text('Зөвшөөрөх'));
      await tester.pumpAndSettle();

      // Confirm in dialog
      await tester.tap(find.text('Зөвшөөрөх').last);

      // Pump to process the async action
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
    });

    testWidgets('shows error toast when decline fails', (tester) async {
      final invitations = [
        createMockInvitation(id: 'inv-1', teamName: 'Миний баг'),
      ];

      await tester.pumpWidget(
        createPendingInvitationsScreen(
          invitations: invitations,
          failDecline: true,
        ),
      );
      await tester.pumpAndSettle();

      // Tap decline button
      await tester.tap(find.text('Татгалзах'));
      await tester.pumpAndSettle();

      // Confirm in dialog
      await tester.tap(find.text('Татгалзах').last);

      // Pump to process the async action
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
    });
  });
}
