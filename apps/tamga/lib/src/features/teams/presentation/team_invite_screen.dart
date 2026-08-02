/// Гишүүн урих дэлгэц.
///
/// Утас эсвэл имэйлээр урилга илгээх. Дүр сонгох боломжтой.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../application/team_providers.dart';
import '../domain/team_invitation.dart';
import '../domain/team_member.dart';

/// Гишүүн урих дэлгэц.
class TeamInviteScreen extends ConsumerStatefulWidget {
  const TeamInviteScreen({super.key});

  @override
  ConsumerState<TeamInviteScreen> createState() => _TeamInviteScreenState();
}

class _TeamInviteScreenState extends ConsumerState<TeamInviteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contactController = TextEditingController();
  TeamRole _selectedRole = TeamRole.viewer;
  bool _isSending = false;

  @override
  void dispose() {
    _contactController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Гишүүн урих')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Instruction ──
              Text(
                'Утасны дугаар эсвэл имэйл хаяг оруулан шинэ гишүүн урина уу.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),

              // ── Contact Input ──
              TextFormField(
                controller: _contactController,
                decoration: InputDecoration(
                  labelText: 'Утас эсвэл имэйл',
                  hintText: '99112233 эсвэл email@example.com',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Утас эсвэл имэйл оруулна уу';
                  }
                  if (!_isValidContact(value.trim())) {
                    return 'Зөв утас эсвэл имэйл хаяг оруулна уу';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.xl),

              // ── Role Selection ──
              Text(
                'Дүр',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              ...TeamRole.values.map((role) {
                final roleColor = switch (role) {
                  TeamRole.owner => colorScheme.primary,
                  TeamRole.manager => colorScheme.tertiary,
                  TeamRole.vet => const Color(0xFF2E7D32),
                  TeamRole.groom => const Color(0xFFE65100),
                  TeamRole.viewer => colorScheme.outline,
                };

                final roleIcon = switch (role) {
                  TeamRole.owner => Icons.star,
                  TeamRole.manager => Icons.admin_panel_settings,
                  TeamRole.vet => Icons.medical_services_outlined,
                  TeamRole.groom => Icons.pets,
                  TeamRole.viewer => Icons.visibility,
                };

                final isSelected = _selectedRole == role;

                return Card(
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: InkWell(
                    onTap: () => setState(() => _selectedRole = role),
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Row(
                        children: [
                          // Custom radio indicator using container
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? roleColor
                                    : colorScheme.outline,
                                width: isSelected ? 7 : 2,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Icon(roleIcon, color: roleColor, size: 24),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  role.displayName,
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  role.defaultPermissions
                                      .map((p) => p.displayName)
                                      .join(', '),
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(Icons.check_circle, color: roleColor),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: AppSpacing.xl),

              // ── Send Invite Button ──
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  onPressed: _isSending ? null : _sendInvite,
                  icon: _isSending
                      ? LoadingIndicator(
                          size: 18,
                          color: theme.colorScheme.onPrimary,
                        )
                      : const Icon(Icons.send_outlined),
                  label: Text(_isSending ? 'Илгээж байна...' : 'Урих'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _isValidContact(String value) {
    // Allow email or phone (Mongolian phone: 8 digits)
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    final phoneRegex = RegExp(r'^\+?\d{8,15}$');
    return emailRegex.hasMatch(value) || phoneRegex.hasMatch(value);
  }

  Future<void> _sendInvite() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSending = true);

    try {
      final team = ref.read(currentTeamProvider).valueOrNull;
      if (team == null) {
        if (mounted) {
          TamgaToast.showError(context, 'Баг олдсонгүй');
        }
        return;
      }

      final authAsync = ref.read(authStateProvider);
      final currentUserId = authAsync.valueOrNull?.userId;
      if (currentUserId == null) {
        if (mounted) {
          TamgaToast.showError(context, 'Нэвтрэх шаардлагатай');
        }
        return;
      }

      final repo = ref.read(teamRepositoryProvider);
      final invitation = TeamInvitation(
        id: '',
        teamId: team.id,
        teamName: team.name,
        invitedUserId: _contactController.text.trim(),
        invitedByUserId: currentUserId,
        role: _selectedRole,
        createdAt: DateTime.now(),
      );

      final result = await repo.createInvitation(invitation);

      if (mounted) {
        if (result.isSuccess) {
          ref.invalidate(pendingInvitationsProvider);
          TamgaToast.showSuccess(context, 'Урилга илгээгдлээ');
          Navigator.of(context).pop();
        } else {
          TamgaToast.showError(context, 'Урилга илгээхэд алдаа гарлаа');
        }
      }
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'Урилга илгээхэд алдаа гарлаа');
      }
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }
}
