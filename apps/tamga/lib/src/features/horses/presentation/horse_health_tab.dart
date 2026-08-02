/// Морины эрүүл мэнд tab.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../shared/domain/health_log.dart';
import '../data/local_health_repository.dart';

/// Морины эрүүл мэнд tab.
class HorseHealthTab extends ConsumerWidget {
  const HorseHealthTab({required this.horseId, super.key});

  /// Морины ID.
  final String horseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final medicalAsync = ref.watch(medicalLogsProvider(horseId));

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.xxxxl,
      ),
      children: [
        // эрүүл мэндийн товч
        _HealthSummarySection(medicalAsync: medicalAsync),
        const SizedBox(height: AppSpacing.xl),

        // вакцин & эмчилгээ
        Text(
          'Вакцин & Эмчилгээ',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        medicalAsync.when(
          data: (logs) {
            if (logs.isEmpty) {
              return const _EmptyState(
                icon: Icons.medical_services_outlined,
                message: 'Эрүүл мэндийн бүртгэл байхгүй байна.',
              );
            }
            return Column(
              children: [
                for (final log in logs) ...[
                  _MedicalLogTile(log: log),
                  const SizedBox(height: AppSpacing.sm),
                ],
              ],
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (err, _) => Center(child: Text('Алдаа гарлаа: $err')),
        ),
      ],
    );
  }
}

// ── Туслах дүрсүүд ──────────────────────────────────────────────────

class _HealthSummarySection extends StatelessWidget {
  const _HealthSummarySection({required this.medicalAsync});
  final AsyncValue<List<HealthLog>> medicalAsync;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final medicalCount = medicalAsync.maybeWhen(
      data: (logs) => logs.length,
      orElse: () => 0,
    );

    final lastMedical = medicalAsync.maybeWhen(
      data: (logs) => logs.isEmpty ? null : logs.first.date,
      orElse: () => null,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.monitor_heart_outlined,
                  size: 20,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Эрүүл мэндийн товч',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                _MiniStat(
                  icon: Icons.vaccines,
                  label: 'Бүртгэл',
                  value: '$medicalCount',
                  color: colorScheme.primaryContainer,
                ),
              ],
            ),
            if (lastMedical != null) ...[
              const SizedBox(height: AppSpacing.md),
              const Divider(),
              const SizedBox(height: AppSpacing.sm),
              _LastEventRow(label: 'Сүүлийн эмчилгээ:', date: lastMedical),
            ],
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: theme.colorScheme.onSurface),
            const SizedBox(width: AppSpacing.sm),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LastEventRow extends StatelessWidget {
  const _LastEventRow({required this.label, required this.date});
  final String label;
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final daysAgo = now.difference(date).inDays;

    return Wrap(
      spacing: AppSpacing.xs,
      runSpacing: AppSpacing.xs,
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Text(
          _formatDate(date),
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        if (daysAgo > 0)
          Text(
            '($daysAgo хоногийн өмнө)',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
      ],
    );
  }
}

class _MedicalLogTile extends StatelessWidget {
  const _MedicalLogTile({required this.log});
  final HealthLog log;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: theme.colorScheme.primaryContainer,
          child: Icon(
            _medicalIcon(log.logType),
            color: theme.colorScheme.onPrimaryContainer,
            size: 20,
          ),
        ),
        title: Text(
          log.logType.displayName,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              log.date != null ? _formatDate(log.date!) : '',
              style: theme.textTheme.bodySmall,
            ),
            if (log.medicament != null && log.medicament!.isNotEmpty)
              Text(
                'Эм: ${log.medicament}',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
        isThreeLine: log.medicament != null && log.medicament!.isNotEmpty,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message});
  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: theme.colorScheme.outline),
            const SizedBox(height: AppSpacing.md),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Тусламжит функциуд ──────────────────────────────────────────────

IconData _medicalIcon(LogType type) => switch (type) {
  LogType.vaccination => Icons.vaccines,
  LogType.deworming => Icons.bug_report_outlined,
  LogType.treatment => Icons.healing,
  LogType.vetVisit => Icons.medical_services_outlined,
  LogType.shoeing => Icons.construction,
  LogType.trimming => Icons.content_cut,
};

String _formatDate(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
