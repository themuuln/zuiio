/// Дасгалжуулалтын жагсаалтын дэлгэц.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/training_providers.dart';
import '../domain/training_log.dart';
import 'training_form_screen.dart';
import 'widgets/weekly_chart.dart';

/// Морины дасгалжуулалтын жагсаалт ба долоо хоногийн график.
class TrainingScreen extends ConsumerWidget {
  const TrainingScreen({required this.horseId, super.key});

  /// Морины ID.
  final String horseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(trainingLogsProvider(horseId));

    return Scaffold(
      body: logsAsync.when(
        loading: () =>
            const TamgaLoadingView(message: 'Дасгалжуулалтыг ачаалж байна'),
        error: (err, _) => TamgaErrorWidget(
          message: 'Дасгалжуулалтын мэдээлэл авахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(trainingLogsProvider(horseId)),
        ),
        data: (logs) => _TrainingLogList(
          horseId: horseId,
          logs: logs,
          onRefresh: () => ref.invalidate(trainingLogsProvider(horseId)),
        ),
      ),
      bottomNavigationBar: TamgaBottomAction(
        label: 'Дасгал нэмэх',
        icon: Icons.add,
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => TrainingFormScreen(horseId: horseId),
            ),
          );
        },
      ),
    );
  }
}

/// Дасгалжуулалтын жагсаалт.
class _TrainingLogList extends ConsumerStatefulWidget {
  const _TrainingLogList({
    required this.horseId,
    required this.logs,
    required this.onRefresh,
  });

  final String horseId;
  final List<TrainingLog> logs;
  final VoidCallback onRefresh;

  @override
  ConsumerState<_TrainingLogList> createState() => _TrainingLogListState();
}

class _TrainingLogListState extends ConsumerState<_TrainingLogList> {
  TrainingLogType? _selectedFilter;

  List<TrainingLog> get _filteredLogs {
    if (_selectedFilter == null) return widget.logs;
    return widget.logs.where((l) => l.type == _selectedFilter).toList();
  }

  /// Долоо хоногийн минутыг тооцоолох.
  Map<int, double> _computeWeeklyMinutes() {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekEnd = weekStart.add(const Duration(days: 7));

    final weekly = <int, double>{};
    for (var i = 0; i < 7; i++) {
      weekly[i] = 0.0;
    }

    for (final log in widget.logs) {
      if (log.date.isAfter(weekStart.subtract(const Duration(days: 1))) &&
          log.date.isBefore(weekEnd)) {
        // weekday: 1=Mon, 7=Sun → index: 0=Mon
        final dayIndex = log.date.weekday - 1;
        weekly[dayIndex] = (weekly[dayIndex] ?? 0) + log.durationMinutes;
      }
    }

    return weekly;
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final weeklyData = _computeWeeklyMinutes();

    if (widget.logs.isEmpty) {
      return SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.xxxl,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TamgaCard(
              child: _WeeklyChartSection(
                weeklyData: weeklyData,
                colors: colors,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const EmptyState(
              icon: Icons.fitness_center_outlined,
              title: 'Дасгалжуулалтын бүртгэл байхгүй',
              description:
                  'Доорх "Дасгал нэмэх" товчийг дарж шинэ бүртгэл үүсгэнэ үү.',
              compact: true,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => widget.onRefresh(),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: TamgaCard(
                child: _WeeklyChartSection(
                  weeklyData: weeklyData,
                  colors: colors,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _FilterChip(
                      label: 'Бүгд',
                      selected: _selectedFilter == null,
                      onTap: () => setState(() => _selectedFilter = null),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    for (final type in TrainingLogType.values)
                      Padding(
                        padding: const EdgeInsets.only(right: AppSpacing.sm),
                        child: _FilterChip(
                          label: type.displayName,
                          selected: _selectedFilter == type,
                          onTap: () => setState(() => _selectedFilter = type),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.sm)),
          if (_filteredLogs.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(
                icon: Icons.filter_alt_outlined,
                title: 'Шүүлтэд тохирох бүртгэл байхгүй',
                compact: true,
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final log = _filteredLogs[index];
                return _TrainingLogTile(
                  log: log,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => TrainingFormScreen(
                          horseId: widget.horseId,
                          existingLog: log,
                        ),
                      ),
                    );
                  },
                );
              }, childCount: _filteredLogs.length),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),
        ],
      ),
    );
  }
}

// ── Weekly Chart Section ──────────────────────────────────────────────

class _WeeklyChartSection extends StatelessWidget {
  const _WeeklyChartSection({required this.weeklyData, required this.colors});

  final Map<int, double> weeklyData;
  final TamgaColors colors;

  @override
  Widget build(BuildContext context) {
    final hasData = weeklyData.values.any((v) => v > 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.bar_chart, size: 18, color: colors.primary),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Энэ долоо хоног',
              style: TamgaTypography.headline(fontSize: 15),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        WeeklyBarChart(
          data: List.generate(7, (i) => weeklyData[i] ?? 0),
          height: 140,
          barColor: colors.primary,
        ),
        if (!hasData)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.xs),
            child: Text(
              'Энэ долоо хоногт дасгалжуулалт бүртгэгдээгүй',
              style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
            ),
          ),
      ],
    );
  }
}

// ── Filter Chip ───────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TamgaChoicePill(label: label, selected: selected, onTap: onTap);
  }
}

// ── Training Log Tile ─────────────────────────────────────────────────

class _TrainingLogTile extends StatelessWidget {
  const _TrainingLogTile({required this.log, required this.onTap});

  final TrainingLog log;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
      child: TamgaCard(
        padding: EdgeInsets.zero,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: colors.primaryContainer,
                radius: 20,
                child: Icon(
                  _typeIcon(log.type),
                  color: colors.onPrimaryContainer,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      log.type.displayName,
                      style: TamgaTypography.headline(fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${log.durationMinutes} мин'
                      '${log.distanceKm != null ? ' · ${log.distanceKm!.toStringAsFixed(1)} км' : ''}',
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    if (log.notes.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        log.notes,
                        style: TamgaTypography.caption2(
                          color: colors.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              Text(
                '${log.date.month.toString().padLeft(2, '0')}/${log.date.day.toString().padLeft(2, '0')}',
                style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
              ),
              const SizedBox(width: AppSpacing.xs),
              Icon(Icons.chevron_right, size: 18, color: colors.outline),
            ],
          ),
        ),
      ),
    );
  }
}

IconData _typeIcon(TrainingLogType type) => switch (type) {
  TrainingLogType.gallop => Icons.speed,
  TrainingLogType.sprint => Icons.flash_on,
  TrainingLogType.endurance => Icons.directions_run,
  TrainingLogType.rest => Icons.bedtime_outlined,
};
