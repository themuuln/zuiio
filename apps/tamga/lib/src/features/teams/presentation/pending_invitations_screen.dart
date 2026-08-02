/// Хүлээгдэж буй урилгуудын дэлгэц.
///
/// Хэрэглэгчийн хүлээгдэж буй багийн урилгуудыг харуулж,
/// хүлээн зөвшөөрөх эсвэл татгалзах боломжтой.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/team_providers.dart';
import '../domain/team_invitation.dart';
import '../domain/team_member.dart';
import 'stable_profile_screen.dart';

/// Хүлээгдэж буй урилгуудын дэлгэц.
class PendingInvitationsScreen extends ConsumerWidget {
  const PendingInvitationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invitationsAsync = ref.watch(pendingInvitationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Урилгууд')),
      body: invitationsAsync.when(
        loading: () => const Center(child: LoadingIndicator(size: 28)),
        error: (err, _) => TamgaErrorWidget(
          message: 'Урилгуудыг ачаалахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(pendingInvitationsProvider),
        ),
        data: (invitations) {
          if (invitations.isEmpty) {
            return EmptyState(
              icon: Icons.mail_outline,
              title: 'Шинэ урилга байхгүй',
              description: 'Танд идэвхтэй урилга байхгүй байна',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: invitations.length,
            itemBuilder: (context, index) {
              final invitation = invitations[index];
              return _InvitationCard(invitation: invitation);
            },
          );
        },
      ),
    );
  }
}

/// Урилгын карт.
class _InvitationCard extends ConsumerWidget {
  const _InvitationCard({required this.invitation});
  final TeamInvitation invitation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final roleColor = switch (invitation.role) {
      TeamRole.owner => colorScheme.primary,
      TeamRole.manager => colorScheme.tertiary,
      TeamRole.vet => const Color(0xFF2E7D32),
      TeamRole.groom => const Color(0xFFE65100),
      TeamRole.viewer => colorScheme.outline,
    };

    final roleIcon = switch (invitation.role) {
      TeamRole.owner => Icons.star,
      TeamRole.manager => Icons.admin_panel_settings,
      TeamRole.vet => Icons.medical_services_outlined,
      TeamRole.groom => Icons.pets,
      TeamRole.viewer => Icons.visibility,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──
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
                  child: const Icon(Icons.group_outlined),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        invitation.teamName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Row(
                        children: [
                          Icon(roleIcon, size: 14, color: roleColor),
                          const SizedBox(width: 4),
                          Text(
                            invitation.role.displayName,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: roleColor,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Date ──
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  size: 14,
                  color: colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  'Илгээсэн: ${_formatDate(invitation.createdAt)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Action Buttons ──
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _acceptInvitation(context, ref),
                    icon: const Icon(Icons.check, size: 18),
                    label: const Text('Зөвшөөрөх'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _declineInvitation(context, ref),
                    icon: const Icon(Icons.close, size: 18),
                    label: const Text('Татгалзах'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  Future<void> _acceptInvitation(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Урилга хүлээн авах'),
        content: Text(
          'Та "${invitation.teamName}" багт ${invitation.role.displayName}'
          ' дүрээр нэгдэхдээ итгэлтэй байна уу?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Зөвшөөрөх'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final repo = ref.read(teamRepositoryProvider);
      final result = await repo.acceptInvitation(invitation.id);

      if (context.mounted) {
        if (result.isSuccess) {
          ref.invalidate(pendingInvitationsProvider);
          ref.invalidate(userTeamsProvider);
          ref.invalidate(currentTeamProvider);
          TamgaToast.showSuccess(
            context,
            'Та "${invitation.teamName}" багт нэгдлээ!',
          );
          // Navigate to the team's stable profile
          // ignore: use_build_context_synchronously
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const StableProfileScreen()),
          );
        } else {
          TamgaToast.showError(
            context,
            'Урилга хүлээн авахад алдаа гарлаа: ${result.error.message}',
          );
        }
      }
    }
  }

  Future<void> _declineInvitation(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Урилгаас татгалзах'),
        content: Text(
          'Та "${invitation.teamName}" багийн урилгаас татгалзахдаа'
          ' итгэлтэй байна уу?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Татгалзах'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final repo = ref.read(teamRepositoryProvider);
      final result = await repo.declineInvitation(invitation.id);

      if (context.mounted) {
        if (result.isSuccess) {
          ref.invalidate(pendingInvitationsProvider);
          TamgaToast.showSuccess(context, 'Урилгаас татгалзлаа');
        } else {
          TamgaToast.showError(
            context,
            'Татгалзахад алдаа гарлаа: ${result.error.message}',
          );
        }
      }
    }
  }
}
