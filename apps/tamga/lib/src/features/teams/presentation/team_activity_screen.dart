/// Багийн үйлдлийн түүхийн дэлгэц (audit trail).
///
/// Багийн бүх үйлдлийг хугацааны дарааллаар харуулна.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/team_providers.dart';
import '../domain/team_activity.dart';

/// Багийн үйлдлийн түүхийн дэлгэц.
class TeamActivityScreen extends ConsumerWidget {
  const TeamActivityScreen({super.key, required this.teamId});

  final String teamId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activityAsync = ref.watch(teamActivityProvider(teamId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Үйлдлийн түүх'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Шинэчлэх',
            onPressed: () => ref.invalidate(teamActivityProvider(teamId)),
          ),
        ],
      ),
      body: activityAsync.when(
        loading: () => const Center(child: LoadingIndicator(size: 28)),
        error: (err, _) => TamgaErrorWidget(
          message: 'Үйлдлийн түүхийг ачаалахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(teamActivityProvider(teamId)),
        ),
        data: (activities) {
          if (activities.isEmpty) {
            return _EmptyActivity(
              onRefresh: () => ref.invalidate(teamActivityProvider(teamId)),
            );
          }
          return _ActivityList(activities: activities);
        },
      ),
    );
  }
}

/// Хоосон төлвийн дэлгэц.
class _EmptyActivity extends StatelessWidget {
  const _EmptyActivity({required this.onRefresh});

  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.history,
      title: 'Үйлдлийн түүх хоосон байна',
      description: 'Багийн үйлдлүүд энд гарч ирнэ',
      actionLabel: 'Шинэчлэх',
      onAction: onRefresh,
    );
  }
}

/// Үйлдлийн жагсаалт.
class _ActivityList extends StatelessWidget {
  const _ActivityList({required this.activities});

  final List<TeamActivity> activities;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      itemCount: activities.length,
      itemBuilder: (context, index) {
        final activity = activities[index];
        return _ActivityTile(activity: activity);
      },
    );
  }
}

/// Нэг үйлдлийн элемент.
class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.activity});

  final TeamActivity activity;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final (icon, label) = _actionInfo(activity.action);

    return ListTile(
      contentPadding: TamgaSpacing.listCellPadding,
      leading: CircleAvatar(
        backgroundColor: colors.secondaryContainer,
        child: Icon(icon, size: 20, color: colors.onSecondaryContainer),
      ),
      title: Text(
        label,
        style: TamgaTypography.body(),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        _formatDateTime(activity.createdAt),
        style: TamgaTypography.subheadline(color: colors.onSurfaceVariant),
      ),
    );
  }

  (IconData, String) _actionInfo(String action) {
    return switch (action) {
      'team_created' => (Icons.group_add, 'Баг үүсгэсэн'),
      'member_joined' => (Icons.person_add, 'Гишүүн нэгдсэн'),
      'member_left' => (Icons.person_remove, 'Гишүүн гарсан'),
      'horse_added' => (Icons.pets, 'Морь нэмсэн'),
      'horse_removed' => (Icons.pets, 'Морь хассан'),
      'role_changed' => (Icons.admin_panel_settings, 'Дүр өөрчилсөн'),
      _ => (Icons.info, action),
    };
  }

  String _formatDateTime(DateTime dt) {
    final hour = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    final day = dt.day.toString().padLeft(2, '0');
    return '${dt.year}-$month-$day $hour:$min';
  }
}
