/// Жүчээний профайл дэлгэц.
///
/// Багийн мэдээлэл, гишүүдийн жагсаалт, морины тоог харуулна.
/// Stable захиалгын түвшинд нээлттэй (төлбөртэй хэрэглэгчид).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../application/team_providers.dart';
import '../domain/team.dart';
import '../domain/team_member.dart';
import 'team_management_screen.dart';

/// Жүчээний профайл дэлгэц.
class StableProfileScreen extends ConsumerWidget {
  const StableProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // Check multi-users gate
    final gateCheck = ref.watch(hasMultiUsersGateProvider);
    if (gateCheck is GateDenied) {
      return Scaffold(
        appBar: AppBar(title: const Text('Жүчээний профайл')),
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

    return _StableProfileContent();
  }
}

class _StableProfileContent extends ConsumerWidget {
  const _StableProfileContent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(currentTeamProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Жүчээний профайл'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const TeamManagementScreen(),
              ),
            ),
            tooltip: 'Багийн удирдлага',
          ),
        ],
      ),
      body: teamAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Жүчээний мэдээлэл ачаалахад алдаа гарлаа: $err',
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
                      Icons.home_outlined,
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
          return _StableDetail(team: team);
        },
      ),
    );
  }
}

class _StableDetail extends ConsumerWidget {
  const _StableDetail({required this.team});
  final Team team;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(teamMembersProvider(team.id));
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListView(
      children: [
        // ── Stable Info Header ──
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                colorScheme.primaryContainer,
                colorScheme.tertiaryContainer,
              ],
            ),
          ),
          child: Column(
            children: [
              // Stable icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: colorScheme.primary,
                    width: 3,
                  ),
                ),
                child: Icon(
                  Icons.home_outlined,
                  size: 40,
                  color: colorScheme.primary,
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // Stable name
              Text(
                team.name,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              // Stats row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _StatItem(
                    icon: Icons.people_outline,
                    value: '${team.memberCount}',
                    label: 'гишүүд',
                    color: colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(width: AppSpacing.xl),
                  _StatItem(
                    icon: Icons.pets,
                    value: '${team.horseCount}',
                    label: 'морьд',
                    color: colorScheme.onPrimaryContainer,
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
          child: Text(
            'Гишүүд',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Members list
        membersAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (err, _) => Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: TamgaErrorWidget(
              message: 'Гишүүдийн мэдээлэл ачаалахад алдаа гарлаа',
              onRetry: () => ref.invalidate(teamMembersProvider(team.id)),
            ),
          ),
          data: (members) {
            if (members.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Center(
                  child: Text(
                    'Гишүүд байхгүй байна',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              );
            }
            return ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              itemCount: members.length,
              itemBuilder: (context, index) {
                final member = members[index];
                return _StableMemberCard(member: member);
              },
            );
          },
        ),
      ],
    );
  }
}

/// Статистик үзүүлэлт.
class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, color: color.withValues(alpha: 0.8), size: 24),
        const SizedBox(height: AppSpacing.xs),
        Text(
          value,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: color.withValues(alpha: 0.8),
          ),
        ),
      ],
    );
  }
}

/// Гишүүний карт.
class _StableMemberCard extends StatelessWidget {
  const _StableMemberCard({required this.member});
  final TeamMember member;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final roleColor = switch (member.role) {
      TeamRole.owner => colorScheme.primary,
      TeamRole.manager => colorScheme.tertiary,
      TeamRole.vet => const Color(0xFF2E7D32),
      TeamRole.groom => const Color(0xFFE65100),
      TeamRole.viewer => colorScheme.outline,
    };

    final roleIcon = switch (member.role) {
      TeamRole.owner => Icons.star,
      TeamRole.manager => Icons.admin_panel_settings,
      TeamRole.vet => Icons.medical_services_outlined,
      TeamRole.groom => Icons.pets,
      TeamRole.viewer => Icons.visibility,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: roleColor.withValues(alpha: 0.15),
          child: Icon(roleIcon, color: roleColor, size: 20),
        ),
        title: Text(
          member.userId,
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: Container(
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
      ),
    );
  }
}
