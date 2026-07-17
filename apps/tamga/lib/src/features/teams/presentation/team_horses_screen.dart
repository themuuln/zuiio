/// Багийн морины удирдлагын дэлгэц.
///
/// Багтай холбогдсон морь бүрийг харуулж, морь нэмэх/хасах боломжтой.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../application/team_providers.dart';
import '../domain/team_horse.dart';

/// Багийн морины жагсаалтын дэлгэц.
class TeamHorsesScreen extends ConsumerWidget {
  const TeamHorsesScreen({super.key, required this.teamId});

  final String teamId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamHorsesAsync = ref.watch(teamHorsesProvider(teamId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Багийн морь'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Морь нэмэх',
            onPressed: () => _showAddHorseSheet(context, ref),
          ),
        ],
      ),
      body: teamHorsesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Морийг ачаалахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(teamHorsesProvider(teamId)),
        ),
        data: (teamHorses) {
          if (teamHorses.isEmpty) {
            return _EmptyState(
              onAddHorse: () => _showAddHorseSheet(context, ref),
            );
          }
          return _TeamHorseList(
            teamHorses: teamHorses,
            onRemove: (teamHorse) => _removeHorse(context, ref, teamHorse),
          );
        },
      ),
    );
  }

  void _showAddHorseSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _AddHorseSheet(teamId: teamId),
    );
  }

  Future<void> _removeHorse(
    BuildContext context,
    WidgetRef ref,
    TeamHorse teamHorse,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Морийг хасах уу?'),
        content: const Text('Энэ морийг багаас хасах гэж байна.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Цуцлах'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Хасах'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final repo = ref.read(teamRepositoryProvider);
      await repo.removeHorseFromTeam(teamId, teamHorse.horseId);
      ref.invalidate(teamHorsesProvider(teamId));
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Морийг багаас хассан')));
      }
    }
  }
}

/// Хоосон төлвийн дэлгэц.
class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onAddHorse});

  final VoidCallback onAddHorse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.pets,
              size: 64,
              color: theme.colorScheme.primary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Багт морь байхгүй байна', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Багийн морийг энд нэмнэ',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton.icon(
              onPressed: onAddHorse,
              icon: const Icon(Icons.add),
              label: const Text('Морь нэмэх'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Морийн жагсаалт.
class _TeamHorseList extends StatelessWidget {
  const _TeamHorseList({required this.teamHorses, required this.onRemove});

  final List<TeamHorse> teamHorses;
  final void Function(TeamHorse) onRemove;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      itemCount: teamHorses.length,
      itemBuilder: (context, index) {
        final teamHorse = teamHorses[index];
        return _TeamHorseCard(
          teamHorse: teamHorse,
          onRemove: () => onRemove(teamHorse),
        );
      },
    );
  }
}

/// Морийн карт.
class _TeamHorseCard extends StatelessWidget {
  const _TeamHorseCard({required this.teamHorse, required this.onRemove});

  final TeamHorse teamHorse;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: theme.colorScheme.primaryContainer,
          child: const Icon(Icons.pets),
        ),
        title: Text(
          'Морийн ID: ${teamHorse.horseId.substring(0, 8)}…',
          style: theme.textTheme.bodyLarge,
        ),
        subtitle: Text(
          'Нэмсэн: ${_formatDate(teamHorse.addedAt)}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.remove_circle_outline),
          color: theme.colorScheme.error,
          tooltip: 'Хасах',
          onPressed: onRemove,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

/// Морь нэмэх bottom sheet.
class _AddHorseSheet extends ConsumerStatefulWidget {
  const _AddHorseSheet({required this.teamId});

  final String teamId;

  @override
  ConsumerState<_AddHorseSheet> createState() => _AddHorseSheetState();
}

class _AddHorseSheetState extends ConsumerState<_AddHorseSheet> {
  bool _isAdding = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final teamHorsesAsync = ref.watch(teamHorsesProvider(widget.teamId));
    final existingHorseIds =
        teamHorsesAsync.valueOrNull?.map((th) => th.horseId).toSet() ?? {};

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: AppSpacing.sm),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Text('Морь сонгох', style: theme.textTheme.titleMedium),
              ),
              const Divider(height: 1),
              Expanded(
                child: _isAdding
                    ? const Center(child: CircularProgressIndicator())
                    : _HorsePickerList(
                        scrollController: scrollController,
                        existingHorseIds: existingHorseIds,
                        onHorseSelected: (horseId) =>
                            _addHorse(context, horseId),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _addHorse(BuildContext context, String horseId) async {
    setState(() => _isAdding = true);

    final repo = ref.read(teamRepositoryProvider);
    final userId = ref.read(authStateProvider).valueOrNull?.userId;

    final result = await repo.addHorseToTeam(
      widget.teamId,
      horseId,
      addedBy: userId,
    );

    if (mounted) {
      setState(() => _isAdding = false);

      if (result.isSuccess) {
        ref.invalidate(teamHorsesProvider(widget.teamId));
        if (context.mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Морийг багт нэмлээ')));
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Алдаа: ${result.error.message}')),
          );
        }
      }
    }
  }
}

/// Морь сонгох жагсаалт.
class _HorsePickerList extends StatelessWidget {
  const _HorsePickerList({
    required this.scrollController,
    required this.existingHorseIds,
    required this.onHorseSelected,
  });

  final ScrollController scrollController;
  final Set<String> existingHorseIds;
  final void Function(String horseId) onHorseSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // NOTE: In a real implementation, this would fetch the user's horses
    // from the horses repository. For now, show a placeholder message.
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        ListTile(
          leading: CircleAvatar(
            backgroundColor: theme.colorScheme.primaryContainer,
            child: const Icon(Icons.pets),
          ),
          title: const Text('Хэрэглэгчийн морь бүхнийг сонгох'),
          subtitle: const Text('Хэрэглэгчийн эзэмшлийн мориудаас сонгоно'),
          onTap: () {
            // TODO(team-horses): Implement horse picker from user's horses
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Морийн жагсаалт удахгүй нэмэгдэнэ'),
              ),
            );
          },
        ),
      ],
    );
  }
}
