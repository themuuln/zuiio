import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/teams/data/supabase_team_repository.dart';
import 'package:tamga/src/features/teams/data/team_repository.dart';
import 'package:tamga/src/features/teams/domain/team.dart';
import 'package:tamga/src/features/teams/domain/team_invitation.dart';
import 'package:tamga/src/features/teams/domain/team_member.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// Postgrest builders are immutable and execute a real HTTP request when
// awaited, so the chain is replaced with lightweight fakes that record the
// calls the repository makes and deliver canned rows through a real `then`
// implementation (the await machinery relies on `Future.then`).

class FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  FakeQueryBuilder(this.rows, this.calls, {this.totalCount});

  final List<Map<String, dynamic>> rows;
  final List<String> calls;
  final int? totalCount;

  @override
  PostgrestFilterBuilder<PostgrestList> select([String columns = '*']) {
    calls.add('select($columns)');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> insert(
    Object values, {
    bool defaultToNull = true,
  }) {
    calls.add('insert');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) {
    calls.add('upsert');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> update(Map values) {
    calls.add('update:${values.keys.join(',')}');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> delete() {
    calls.add('delete');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }
}

class FakeFilterBuilder extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  FakeFilterBuilder(this.rows, this.calls, {this.totalCount});

  final List<Map<String, dynamic>> rows;
  final List<String> calls;
  final int? totalCount;

  @override
  PostgrestFilterBuilder<PostgrestList> eq(String column, Object value) {
    calls.add('eq:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> gte(String column, Object value) {
    calls.add('gte:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> lte(String column, Object value) {
    calls.add('lte:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> gt(String column, Object value) {
    calls.add('gt:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> or(
    String filters, {
    String? referencedTable,
  }) {
    calls.add('or:$filters');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) {
    calls.add('order:$column:asc=$ascending');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> range(
    int from,
    int to, {
    String? referencedTable,
  }) {
    calls.add('range:$from-$to');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> select([String columns = '*']) {
    calls.add('select($columns)');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestMap> single() {
    calls.add('single');
    return FakeMapBuilder(rows.first);
  }

  @override
  PostgrestTransformBuilder<PostgrestMap?> maybeSingle() {
    calls.add('maybeSingle');
    return FakeMaybeMapBuilder(rows.isEmpty ? null : rows.first);
  }

  @override
  ResponsePostgrestBuilder<
    PostgrestResponse<PostgrestList>,
    PostgrestList,
    PostgrestList
  >
  count([CountOption count = CountOption.exact]) {
    calls.add('count');
    return FakeCountBuilder(rows, totalCount ?? rows.length);
  }

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestList value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(rows));
  }
}

class FakeMapBuilder extends Fake
    implements PostgrestTransformBuilder<PostgrestMap> {
  FakeMapBuilder(this.row);

  final Map<String, dynamic> row;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestMap value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(row));
  }
}

class FakeMaybeMapBuilder extends Fake
    implements PostgrestTransformBuilder<PostgrestMap?> {
  FakeMaybeMapBuilder(this.row);

  final Map<String, dynamic>? row;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestMap? value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(row));
  }
}

class FakeCountBuilder extends Fake
    implements
        ResponsePostgrestBuilder<
          PostgrestResponse<PostgrestList>,
          PostgrestList,
          PostgrestList
        > {
  FakeCountBuilder(this.rows, this.totalCount);

  final List<Map<String, dynamic>> rows;
  final int totalCount;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestResponse<PostgrestList> value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(
      () => onValue(PostgrestResponse(data: rows, count: totalCount)),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> teamRow({
  String id = 'team-1',
  String name = 'Хурдан морьд',
  String ownerUserId = 'user-1',
  int horseCount = 3,
}) {
  return {
    'id': id,
    'name': name,
    'owner_user_id': ownerUserId,
    'horse_count': horseCount,
    'created_at': '2026-01-01T00:00:00.000',
  };
}

Map<String, dynamic> memberRow({
  String id = 'm-1',
  String teamId = 'team-1',
  String userId = 'user-1',
  String role = 'owner',
  List<String> permissions = const ['inviteMembers', 'removeMembers'],
}) {
  return {
    'id': id,
    'team_id': teamId,
    'user_id': userId,
    'role': role,
    'permissions': permissions,
    'joined_at': '2026-01-01T00:00:00.000',
  };
}

Map<String, dynamic> invitationRow({
  String id = 'inv-1',
  String teamId = 'team-1',
  String teamName = 'Хурдан морьд',
  String invitedUserId = 'user-2',
  String invitedByUserId = 'user-1',
  String role = 'viewer',
  String status = 'pending',
}) {
  return {
    'id': id,
    'team_id': teamId,
    'team_name': teamName,
    'invited_user_id': invitedUserId,
    'invited_by_user_id': invitedByUserId,
    'role': role,
    'status': status,
    'created_at': '2026-01-01T00:00:00.000',
  };
}

Team sampleTeam() {
  return Team(
    id: 'team-1',
    name: 'Хурдан морьд',
    ownerUserId: 'user-1',
    horseCount: 3,
    createdAt: DateTime(2026, 1, 1),
  );
}

void main() {
  group('SupabaseTeamRepository implements TeamRepository', () {
    test('class exists and implements TeamRepository', () {
      final repo = SupabaseTeamRepository(client: null);
      expect(repo, isA<TeamRepository>());
    });
  });

  group('createTeam', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.createTeam(sampleTeam());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('inserts team and owner member, returns the team', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('teams'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));
      when(
        () => mockClient.from('team_members'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.createTeam(sampleTeam());

      expect(result.isSuccess, isTrue);
      final team = result.value;
      expect(team.id, 'team-1');
      expect(team.name, 'Хурдан морьд');
      expect(team.ownerUserId, 'user-1');
      expect(team.horseCount, 3);
      expect(team.createdAt, DateTime.parse('2026-01-01T00:00:00.000'));
      expect(calls, containsAllInOrder(['insert', 'insert']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.createTeam(sampleTeam());

      expect(result.isFailure, isTrue);
    });
  });

  group('getTeam', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.getTeam('team-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('maps the single row to a Team', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('teams'),
      ).thenAnswer((_) => FakeQueryBuilder([teamRow()], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getTeam('team-1');

      expect(result.isSuccess, isTrue);
      final team = result.value;
      expect(team.id, 'team-1');
      expect(team.name, 'Хурдан морьд');
      expect(team.ownerUserId, 'user-1');
      expect(team.horseCount, 3);
      // member_count column was removed; the repository hardcodes 0.
      expect(team.memberCount, 0);
      expect(
        calls,
        containsAllInOrder(['select(*)', 'eq:id=team-1', 'single']),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getTeam('team-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('getMembers', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.getMembers('team-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('maps member rows field by field', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      final rows = [
        memberRow(),
        memberRow(
          id: 'm-2',
          userId: 'user-2',
          role: 'viewer',
          permissions: const [],
        ),
      ];
      when(
        () => mockClient.from('team_members'),
      ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getMembers('team-1');

      expect(result.isSuccess, isTrue);
      final members = result.value;
      expect(members, hasLength(2));

      final first = members[0];
      expect(first.id, 'm-1');
      expect(first.teamId, 'team-1');
      expect(first.userId, 'user-1');
      expect(first.role, TeamRole.owner);
      expect(first.permissions, [
        TeamPermission.inviteMembers,
        TeamPermission.removeMembers,
      ]);
      expect(first.joinedAt, DateTime.parse('2026-01-01T00:00:00.000'));

      final second = members[1];
      expect(second.role, TeamRole.viewer);
      expect(second.permissions, isEmpty);
      expect(second.effectivePermissions, [
        TeamPermission.viewHealth,
        TeamPermission.viewTraining,
      ]);

      expect(calls, containsAllInOrder(['select(*)', 'eq:team_id=team-1']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getMembers('team-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('inviteMember', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.inviteMember(
        TeamMember(
          id: 'm-3',
          teamId: 'team-1',
          userId: 'user-3',
          role: TeamRole.groom,
          joinedAt: DateTime(2026, 1, 1),
        ),
      );
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('inserts the member and returns it', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_members'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final member = TeamMember(
        id: 'm-3',
        teamId: 'team-1',
        userId: 'user-3',
        role: TeamRole.groom,
        joinedAt: DateTime(2026, 1, 1),
      );
      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.inviteMember(member);

      expect(result.isSuccess, isTrue);
      expect(result.value.id, 'm-3');
      expect(result.value.role, TeamRole.groom);
      expect(calls, containsAllInOrder(['insert']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.inviteMember(
        TeamMember(
          id: 'm-3',
          teamId: 'team-1',
          userId: 'user-3',
          role: TeamRole.groom,
          joinedAt: DateTime(2026, 1, 1),
        ),
      );

      expect(result.isFailure, isTrue);
    });
  });

  group('removeMember', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.removeMember('team-1', 'user-2');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('deletes the matching member row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_members'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.removeMember('team-1', 'user-2');

      expect(result.isSuccess, isTrue);
      expect(
        calls,
        containsAllInOrder([
          'delete',
          'eq:team_id=team-1',
          'eq:user_id=user-2',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.removeMember('team-1', 'user-2');

      expect(result.isFailure, isTrue);
    });
  });

  group('updateRole', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.updateRole(
        'team-1',
        'user-2',
        TeamRole.manager,
      );
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('updates the role and returns the refreshed member', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('team_members')).thenAnswer(
        (_) => FakeQueryBuilder([
          memberRow(userId: 'user-2', role: 'manager'),
        ], calls),
      );

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.updateRole(
        'team-1',
        'user-2',
        TeamRole.manager,
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.userId, 'user-2');
      expect(result.value.role, TeamRole.manager);
      expect(
        calls,
        containsAllInOrder([
          'update:role',
          'eq:team_id=team-1',
          'eq:user_id=user-2',
          'select(*)',
          'eq:team_id=team-1',
          'eq:user_id=user-2',
          'single',
        ]),
      );
    });

    test('includes permissions in the update when provided', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('team_members')).thenAnswer(
        (_) =>
            FakeQueryBuilder([memberRow(userId: 'user-2', role: 'vet')], calls),
      );

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.updateRole(
        'team-1',
        'user-2',
        TeamRole.vet,
        permissions: [TeamPermission.viewHealth],
      );

      expect(result.isSuccess, isTrue);
      expect(calls, contains('update:role,permissions'));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.updateRole(
        'team-1',
        'user-2',
        TeamRole.manager,
      );

      expect(result.isFailure, isTrue);
    });
  });

  group('getUserTeams', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.getUserTeams('user-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns empty list when the user is in no teams', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_members'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getUserTeams('user-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
      expect(
        calls,
        containsAllInOrder(['select(team_id)', 'eq:user_id=user-1']),
      );
      // No second query when there are no team ids.
      expect(calls.where((c) => c.startsWith('or:')), isEmpty);
    });

    test('fetches teams by the user\'s member team ids', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('team_members')).thenAnswer(
        (_) => FakeQueryBuilder(const [
          {'team_id': 'team-1'},
          {'team_id': 'team-2'},
        ], calls),
      );
      when(() => mockClient.from('teams')).thenAnswer(
        (_) => FakeQueryBuilder([
          teamRow(id: 'team-1'),
          teamRow(id: 'team-2', name: 'Сүрэг'),
        ], calls),
      );

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getUserTeams('user-1');

      expect(result.isSuccess, isTrue);
      final teams = result.value;
      expect(teams, hasLength(2));
      expect(teams[0].id, 'team-1');
      expect(teams[1].name, 'Сүрэг');
      expect(calls, contains('or:id.eq.team-1,id.eq.team-2'));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getUserTeams('user-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('createInvitation', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.createInvitation(
        TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Хурдан морьд',
          invitedUserId: 'user-2',
          invitedByUserId: 'user-1',
          role: TeamRole.viewer,
          createdAt: DateTime(2026, 1, 1),
        ),
      );
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('inserts the invitation and returns it', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_invitations'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final invitation = TeamInvitation(
        id: 'inv-1',
        teamId: 'team-1',
        teamName: 'Хурдан морьд',
        invitedUserId: 'user-2',
        invitedByUserId: 'user-1',
        role: TeamRole.viewer,
        createdAt: DateTime(2026, 1, 1),
      );
      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.createInvitation(invitation);

      expect(result.isSuccess, isTrue);
      expect(result.value.id, 'inv-1');
      expect(result.value.status, InvitationStatus.pending);
      expect(calls, containsAllInOrder(['insert']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.createInvitation(
        TeamInvitation(
          id: 'inv-1',
          teamId: 'team-1',
          teamName: 'Хурдан морьд',
          invitedUserId: 'user-2',
          invitedByUserId: 'user-1',
          role: TeamRole.viewer,
          createdAt: DateTime(2026, 1, 1),
        ),
      );

      expect(result.isFailure, isTrue);
    });
  });

  group('getPendingInvitations', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.getPendingInvitations('user-2');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('maps pending invitation rows', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_invitations'),
      ).thenAnswer((_) => FakeQueryBuilder([invitationRow()], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getPendingInvitations('user-2');

      expect(result.isSuccess, isTrue);
      final invitations = result.value;
      expect(invitations, hasLength(1));
      final invitation = invitations.first;
      expect(invitation.id, 'inv-1');
      expect(invitation.teamId, 'team-1');
      expect(invitation.teamName, 'Хурдан морьд');
      expect(invitation.invitedUserId, 'user-2');
      expect(invitation.invitedByUserId, 'user-1');
      expect(invitation.role, TeamRole.viewer);
      expect(invitation.status, InvitationStatus.pending);
      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:invited_user_id=user-2',
          'eq:status=pending',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.getPendingInvitations('user-2');

      expect(result.isFailure, isTrue);
    });
  });

  group('acceptInvitation', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.acceptInvitation('inv-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('creates the member and marks the invitation accepted', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_invitations'),
      ).thenAnswer((_) => FakeQueryBuilder([invitationRow()], calls));
      when(
        () => mockClient.from('team_members'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.acceptInvitation('inv-1');

      expect(result.isSuccess, isTrue);
      final member = result.value;
      expect(member.id, 'inv-1');
      expect(member.teamId, 'team-1');
      expect(member.userId, 'user-2');
      expect(member.role, TeamRole.viewer);
      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:id=inv-1',
          'single',
          'insert',
          'update:status',
          'eq:id=inv-1',
        ]),
      );
    });

    test('fails with INVITATION_NOT_PENDING when already processed', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from('team_invitations')).thenAnswer(
        (_) =>
            FakeQueryBuilder([invitationRow(status: 'declined')], <String>[]),
      );

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.acceptInvitation('inv-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'INVITATION_NOT_PENDING');
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.acceptInvitation('inv-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('declineInvitation', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTeamRepository(client: null);
      final result = await repo.declineInvitation('inv-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('marks the invitation declined', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('team_invitations'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.declineInvitation('inv-1');

      expect(result.isSuccess, isTrue);
      expect(calls, containsAllInOrder(['update:status', 'eq:id=inv-1']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTeamRepository(client: mockClient);
      final result = await repo.declineInvitation('inv-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('addHorseToTeam / removeHorseFromTeam', () {
    test(
      'addHorseToTeam is not implemented and returns success no-op',
      () async {
        // These methods are documented TODO stubs that never touch the client.
        final repo = SupabaseTeamRepository(client: null);
        final result = await repo.addHorseToTeam('team-1', 'horse-1');
        expect(result.isSuccess, isTrue);
      },
    );

    test(
      'removeHorseFromTeam is not implemented and returns success no-op',
      () async {
        final repo = SupabaseTeamRepository(client: null);
        final result = await repo.removeHorseFromTeam('team-1', 'horse-1');
        expect(result.isSuccess, isTrue);
      },
    );
  });
}
