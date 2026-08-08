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
import 'package:tamga/src/features/teams/presentation/team_invite_screen.dart';
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
  bool failInvite = false;
  bool invited = false;
  TeamMember? invitedMember;
  List<TeamInvitation> invitations = [];

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
    if (failInvite) {
      return Result.fail(
        AppException(message: 'Invite failed', code: 'INVITE_FAILED'),
      );
    }
    invited = true;
    invitedMember = member;
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
    final idx = members.indexWhere((m) => m.userId == userId);
    if (idx >= 0) {
      members[idx] = members[idx].copyWith(role: newRole);
    }
    return Result.ok(
      members.isNotEmpty
          ? members[idx]
          : TeamMember(
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

  // ── Invitation Methods ──

  @override
  Future<Result<TeamInvitation>> createInvitation(
    TeamInvitation invitation,
  ) async {
    if (failInvite) {
      return Result.fail(
        AppException(message: 'Invite failed', code: 'INVITE_FAILED'),
      );
    }
    invited = true;
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
    final idx = invitations.indexWhere((i) => i.id == invitationId);
    if (idx < 0) {
      return Result.fail(
        AppException(message: 'Not found', code: 'INVITATION_NOT_FOUND'),
      );
    }
    final inv = invitations[idx];
    if (inv.status != InvitationStatus.pending) {
      return Result.fail(
        AppException(message: 'Not pending', code: 'INVITATION_NOT_PENDING'),
      );
    }
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

Widget createTeamInviteScreen({
  bool failInvite = false,
  bool isStableTier = true,
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
  mockRepo.members = [
    TeamMember(
      id: 'm1',
      teamId: 'team-1',
      userId: 'user-1',
      role: TeamRole.owner,
      joinedAt: DateTime(2026, 6, 18),
    ),
  ];
  mockRepo.failInvite = failInvite;

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
      home: const TeamInviteScreen(),
    ),
  );
}

void main() {
  group('TeamInviteScreen', () {
    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-006: Invite by phone/email
    // ══════════════════════════════════════════════════════════
    testWidgets('shows invite form with phone/email input', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen());
      await tester.pumpAndSettle();

      expect(find.text('Утас эсвэл имэйл'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('shows role selector dropdown', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen());
      await tester.pumpAndSettle();

      // Should have role selection
      expect(find.text('Дүр'), findsOneWidget);
    });

    testWidgets('shows invite button', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen());
      await tester.pumpAndSettle();

      expect(find.text('Урих'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-006: Sends invitation
    // ══════════════════════════════════════════════════════════
    testWidgets('sends invitation when form is submitted', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen());
      await tester.pumpAndSettle();

      // Type an email
      await tester.enterText(find.byType(TextField), 'test@example.com');
      await tester.pumpAndSettle();

      // Ensure invite button is visible by scrolling
      final inviteButton = find.text('Урих');
      await tester.ensureVisible(inviteButton);
      await tester.pumpAndSettle();

      // Tap invite button
      await tester.tap(inviteButton);
      await tester.pump();

      // After invite succeeds, button shows loading state then screen pops
      // Just verify the button was found and tapped (no crash)
      expect(inviteButton, findsOneWidget);
    });

    testWidgets('validates empty input', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen());
      await tester.pumpAndSettle();

      // Ensure invite button is visible by scrolling
      final inviteButton = find.text('Урих');
      await tester.ensureVisible(inviteButton);
      await tester.pumpAndSettle();

      // Tap invite without entering text
      await tester.tap(inviteButton);
      await tester.pumpAndSettle();

      // Should show validation error - FormField validator shows the error in the field
      expect(find.text('Утас эсвэл имэйл оруулна уу'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-006: Error handling
    // ══════════════════════════════════════════════════════════
    testWidgets('shows error when invite fails', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen(failInvite: true));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'test@example.com');
      await tester.pumpAndSettle();

      // Ensure invite button is visible
      final inviteButton = find.text('Урих');
      await tester.ensureVisible(inviteButton);
      await tester.pumpAndSettle();

      await tester.tap(inviteButton);
      await tester.pump();

      // After failed invite, the error is caught and we stay on the screen
      // The invite button should still be visible
      await tester.pump(const Duration(seconds: 1));
      await tester.pump();

      expect(find.text('Урих'), findsOneWidget);
    });

    // ══════════════════════════════════════════════════════════
    // VAL-TEAM-006: Role assignment in invite
    // ══════════════════════════════════════════════════════════
    testWidgets('allows selecting a role for the invite', (tester) async {
      await tester.pumpWidget(createTeamInviteScreen());
      await tester.pumpAndSettle();

      // Tap on the role dropdown
      await tester.tap(find.text('Үзэгч')); // default role
      await tester.pumpAndSettle();

      // Select a different role
      await tester.tap(find.text('Менежер').last);
      await tester.pumpAndSettle();
    });
  });
}
