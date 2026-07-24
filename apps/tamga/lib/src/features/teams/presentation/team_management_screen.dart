/// Багийн удирдлагын дэлгэц.
///
/// Гишүүдийн жагсаалт, дүрийн тэмдэглэгээ, урих/хасах/дүр өөрчлөх үйлдлүүд
/// (зөвхөн эзэмшигчид). Дүрд суурилсан UI.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../application/team_providers.dart';
import '../data/team_repository.dart';
import '../domain/team.dart';
import '../domain/team_member.dart';
import 'team_invite_screen.dart';

/// Багийн удирдлагын дэлгэц.
class TeamManagementScreen extends ConsumerWidget {
  const TeamManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // Check multi-users gate
    final gateCheck = ref.watch(hasMultiUsersGateProvider);
    if (gateCheck is GateDenied) {
      return Scaffold(
        appBar: AppBar(title: const Text('Багийн удирдлага')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.lock_outline,
                  size: 64,
                  color: colorScheme.outlineVariant,
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Stable захиалга шаардлагатай',
                  style: theme.textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  gateCheck.reason,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xl),
                FilledButton(
                  onPressed: () => context.push('/payment'),
                  child: const Text('Захиалга шинэчлэх'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Show team management content
    return _TeamManagementContent();
  }
}

class _TeamManagementContent extends ConsumerWidget {
  const _TeamManagementContent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(currentTeamProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Багийн удирдлага')),
      body: teamAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Багийн мэдээлэл ачаалахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(currentTeamProvider),
        ),
        data: (team) {
          if (team == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.xxl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.group_outlined,
                      size: 64,
                      color: colorScheme.outlineVariant,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'Жүчээ байхгүй байна',
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Жүчээ үүсгэхдээ профайлаа тохируулна уу',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }
          return _TeamDetail(team: team);
        },
      ),
    );
  }
}

class _TeamDetail extends ConsumerWidget {
  const _TeamDetail({required this.team});
  final Team team;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(teamMembersProvider(team.id));
    final isOwner = ref.watch(isTeamOwnerProvider(team.id));
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      children: [
        // ── Team Info Header ──
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(color: colorScheme.surfaceContainerLow),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Team name
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
                    child: Icon(
                      Icons.home_outlined,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          team.name,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          '${team.memberCount} гишүүд • ${team.horseCount} морьд',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // ── Members Section ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: Row(
            children: [
              Text(
                'Гишүүд',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (isOwner)
                FilledButton.tonalIcon(
                  onPressed: () => _navigateToInvite(context),
                  icon: const Icon(Icons.person_add_alt_1, size: 18),
                  label: const Text('Гишүүн урих'),
                ),
            ],
          ),
        ),

        // ── Members List ──
        Expanded(
          child: membersAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => TamgaErrorWidget(
              message: 'Гишүүдийн мэдээлэл ачаалахад алдаа гарлаа',
              onRetry: () => ref.invalidate(teamMembersProvider(team.id)),
            ),
            data: (members) {
              if (members.isEmpty) {
                return Center(
                  child: Text(
                    'Гишүүд байхгүй байна',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: members.length,
                itemBuilder: (context, index) {
                  final member = members[index];
                  return _MemberTile(
                    member: member,
                    isOwner: isOwner,
                    teamId: team.id,
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  void _navigateToInvite(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const TeamInviteScreen()));
  }
}

class _MemberTile extends ConsumerWidget {
  const _MemberTile({
    required this.member,
    required this.isOwner,
    required this.teamId,
  });

  final TeamMember member;
  final bool isOwner;
  final String teamId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isMemberOwner = member.role == TeamRole.owner;

    // Role badge color
    final roleColor = switch (member.role) {
      TeamRole.owner => colorScheme.primary,
      TeamRole.manager => colorScheme.tertiary,
      TeamRole.vet => const Color(0xFF2E7D32), // green
      TeamRole.groom => const Color(0xFFE65100), // orange
      TeamRole.viewer => colorScheme.outline,
    };

    // Role-specific icon
    final roleIcon = switch (member.role) {
      TeamRole.owner => Icons.star,
      TeamRole.manager => Icons.admin_panel_settings,
      TeamRole.vet => Icons.medical_services_outlined,
      TeamRole.groom => Icons.pets,
      TeamRole.viewer => Icons.visibility,
    };

    // Role-specific description (for role-based UI)
    final roleDescription = switch (member.role) {
      TeamRole.owner => 'Бүх эрхтэй',
      TeamRole.manager => 'Бүх үйлдэл хийх боломжтой',
      TeamRole.vet => 'Эрүүл мэндийн бичлэг харах',
      TeamRole.groom => 'Эрүүл мэнд, сургалтын үйлдэл',
      TeamRole.viewer => 'Зөвхөн харах эрхтэй',
    };

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              backgroundColor: roleColor.withValues(alpha: 0.15),
              child: Icon(roleIcon, color: roleColor, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),

            // Name and role
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        member.userId,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      // Role badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                        decoration: BoxDecoration(
                          color: roleColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(roleIcon, size: 12, color: roleColor),
                            const SizedBox(width: 4),
                            Text(
                              member.role.displayName,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: roleColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    roleDescription,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),

            // Actions (only for owner, not for owner member itself)
            if (isOwner && !isMemberOwner)
              PopupMenuButton<_MemberAction>(
                icon: Icon(
                  Icons.more_vert,
                  color: colorScheme.onSurfaceVariant,
                ),
                onSelected: (action) =>
                    _handleAction(context, ref, action, member),
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: _MemberAction.changeRole,
                    child: ListTile(
                      leading: Icon(Icons.swap_horiz),
                      title: Text('Дүр өөрчлөх'),
                      contentPadding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                  const PopupMenuItem(
                    value: _MemberAction.remove,
                    child: ListTile(
                      leading: Icon(Icons.person_remove_outlined),
                      title: Text('Гишүүн хасах'),
                      contentPadding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleAction(
    BuildContext context,
    WidgetRef ref,
    _MemberAction action,
    TeamMember member,
  ) async {
    switch (action) {
      case _MemberAction.changeRole:
        _showRoleChangeSheet(context, ref, member);
      case _MemberAction.remove:
        _confirmRemoveMember(context, ref, member);
    }
  }

  void _showRoleChangeSheet(
    BuildContext context,
    WidgetRef ref,
    TeamMember member,
  ) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _RoleChangeSheet(
        member: member,
        teamId: teamId,
        onRoleChanged: () {
          Navigator.of(ctx).pop();
          ref.invalidate(teamMembersProvider(teamId));
        },
      ),
    );
  }

  Future<void> _confirmRemoveMember(
    BuildContext context,
    WidgetRef ref,
    TeamMember member,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Гишүүн хасах'),
        content: Text(
          '${member.userId} гишүүнийг багаас хасахдаа итгэлтэй байна уу?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Хасах'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final repo = ref.read(teamRepositoryProvider);
      final result = await repo.removeMember(teamId, member.userId);
      if (context.mounted) {
        if (result.isSuccess) {
          ref.invalidate(teamMembersProvider(teamId));
          ref.invalidate(currentTeamProvider);
          TamgaToast.showSuccess(context, 'Гишүүн амжилттай хасагдлаа');
        } else {
          TamgaToast.showError(context, 'Гишүүн хасахад алдаа гарлаа');
        }
      }
    }
  }
}

enum _MemberAction { changeRole, remove }

/// Дүр өөрчлөх bottom sheet.
class _RoleChangeSheet extends StatefulWidget {
  const _RoleChangeSheet({
    required this.member,
    required this.teamId,
    required this.onRoleChanged,
  });

  final TeamMember member;
  final String teamId;
  final VoidCallback onRoleChanged;

  @override
  State<_RoleChangeSheet> createState() => _RoleChangeSheetState();
}

class _RoleChangeSheetState extends State<_RoleChangeSheet> {
  TeamRole? _selectedRole;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.member.role;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: AppSpacing.sheetPadding,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.3,
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Дүр өөрчлөх — ${widget.member.userId}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Role options
          ...TeamRole.values.map((role) {
            final isCurrentRole = role == widget.member.role;
            final isSelected = _selectedRole == role;

            return InkWell(
              onTap: _isSaving
                  ? null
                  : () => setState(() => _selectedRole = role),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: AppSpacing.sm,
                  horizontal: AppSpacing.sm,
                ),
                child: Row(
                  children: [
                    // Custom radio indicator
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected
                              ? theme.colorScheme.primary
                              : theme.colorScheme.outline,
                          width: isSelected ? 7 : 2,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(role.displayName),
                              if (isCurrentRole) ...[
                                const SizedBox(width: AppSpacing.sm),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: theme
                                        .colorScheme
                                        .surfaceContainerHighest,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Одоогийн',
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            role.defaultPermissions.length > 3
                                ? '${role.defaultPermissions.length} зөвшөөрөл'
                                : role.defaultPermissions
                                      .map((p) => p.displayName)
                                      .join(', '),
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: AppSpacing.lg),

          // Save button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _isSaving ? null : _saveRole,
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Хадгалах'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    );
  }

  Future<void> _saveRole() async {
    if (_selectedRole == null || _selectedRole == widget.member.role) {
      Navigator.of(context).pop();
      return;
    }

    setState(() => _isSaving = true);

    final repo = context.read<TeamRepository>();
    final result = await repo.updateRole(
      widget.teamId,
      widget.member.userId,
      _selectedRole!,
    );

    if (mounted) {
      setState(() => _isSaving = false);
      if (result.isSuccess) {
        widget.onRoleChanged();
        TamgaToast.showSuccess(context, 'Дүр амжилттай шинэчлэгдлээ');
      } else {
        TamgaToast.showError(context, 'Дүр шинэчлэхэд алдаа гарлаа');
      }
    }
  }
}

/// Helper extension to read repository from context.
extension _RepoReader on BuildContext {
  TeamRepository read<T>() {
    final ref = ProviderScope.containerOf(this);
    return ref.read(teamRepositoryProvider);
  }
}
