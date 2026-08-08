/// Өдөр тутмын тэжээлийн бүртгэлийн дэлгэц.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/nutrition_providers.dart';
import '../domain/feed_schedule.dart';
import '../domain/feed_log.dart';

// ═══════════════════════════════════════════════════════════════════════
// FeedLogScreen
// ═══════════════════════════════════════════════════════════════════════

/// Морины өдөр тутмын тэжээлийн бүртгэлийн жагсаалт.
class FeedLogScreen extends ConsumerWidget {
  const FeedLogScreen({required this.horseId, super.key});

  /// Морины ID.
  final String horseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _FeedLogBody(horseId: horseId);
  }
}

class _FeedLogBody extends ConsumerStatefulWidget {
  const _FeedLogBody({required this.horseId});

  final String horseId;

  @override
  ConsumerState<_FeedLogBody> createState() => _FeedLogBodyState();
}

class _FeedLogBodyState extends ConsumerState<_FeedLogBody> {
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Огноо сонгох',
      cancelText: 'Болих',
      confirmText: 'Сонгох',
    );
    if (picked != null && mounted) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dayStart = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
    );
    final dayEnd = dayStart.add(
      const Duration(hours: 23, minutes: 59, seconds: 59),
    );

    // Watch both schedules and logs simultaneously
    final schedulesAsync = ref.watch(feedSchedulesProvider(widget.horseId));
    final logsAsync = ref.watch(
      feedLogsByDateRangeProvider((
        horseId: widget.horseId,
        startDate: dayStart,
        endDate: dayEnd,
      )),
    );

    return Column(
      children: [
        // ── Date selector ──
        _DateSelector(
          selectedDate: _selectedDate,
          onDateTap: _pickDate,
          onPreviousDay: () {
            setState(() {
              _selectedDate = _selectedDate.subtract(const Duration(days: 1));
            });
          },
          onNextDay: () {
            setState(() {
              _selectedDate = _selectedDate.add(const Duration(days: 1));
            });
          },
        ),

        // ── Content ──
        Expanded(
          child: schedulesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => TamgaErrorWidget(
              message: 'Тэжээлийн мэдээлэл авахад алдаа гарлаа: $err',
              onRetry: () {
                ref.invalidate(feedSchedulesProvider(widget.horseId));
              },
            ),
            data: (schedules) {
              // Filter active schedules (those covering the selected date)
              final activeSchedules = schedules.where((s) {
                if (s.startDate.isAfter(dayEnd)) return false;
                if (s.endDate != null && s.endDate!.isBefore(dayStart)) {
                  return false;
                }
                return true;
              }).toList();

              return logsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => TamgaErrorWidget(
                  message: 'Тэжээлийн бүртгэл авахад алдаа гарлаа: $err',
                  onRetry: () {
                    ref.invalidate(
                      feedLogsByDateRangeProvider((
                        horseId: widget.horseId,
                        startDate: dayStart,
                        endDate: dayEnd,
                      )),
                    );
                  },
                ),
                data: (logs) {
                  if (activeSchedules.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(AppSpacing.lg),
                        child: EmptyState(
                          icon: Icons.event_busy_outlined,
                          title: 'Энэ өдөр тэжээлийн хуваарь байхгүй',
                          description: 'Эхлээд тэжээлийн хуваарь үүсгэнэ үү.',
                          compact: true,
                        ),
                      ),
                    );
                  }

                  return _FeedLogChecklist(
                    horseId: widget.horseId,
                    schedules: activeSchedules,
                    logs: logs,
                    selectedDate: _selectedDate,
                    onLogChanged: () {
                      ref.invalidate(
                        feedLogsByDateRangeProvider((
                          horseId: widget.horseId,
                          startDate: dayStart,
                          endDate: dayEnd,
                        )),
                      );
                      ref.invalidate(feedLogsProvider(widget.horseId));
                    },
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── DateSelector ──────────────────────────────────────────────────────

class _DateSelector extends StatelessWidget {
  const _DateSelector({
    required this.selectedDate,
    required this.onDateTap,
    required this.onPreviousDay,
    required this.onNextDay,
  });

  final DateTime selectedDate;
  final VoidCallback onDateTap;
  final VoidCallback onPreviousDay;
  final VoidCallback onNextDay;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final theme = Theme.of(context);
    final isToday = _isSameDay(selectedDate, DateTime.now());

    final dayNames = ['Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям', 'Ням'];
    final monthNames = [
      '1-р сар',
      '2-р сар',
      '3-р сар',
      '4-р сар',
      '5-р сар',
      '6-р сар',
      '7-р сар',
      '8-р сар',
      '9-р сар',
      '10-р сар',
      '11-р сар',
      '12-р сар',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        border: Border(
          bottom: BorderSide(color: colors.outlineVariant, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          // ── Previous day ──
          IconButton(
            icon: Icon(Icons.chevron_left, color: colors.primary),
            onPressed: onPreviousDay,
            tooltip: 'Өмнөх өдөр',
          ),

          // ── Date display ──
          Expanded(
            child: GestureDetector(
              onTap: onDateTap,
              child: Column(
                children: [
                  Text(
                    '${dayNames[selectedDate.weekday - 1]}, '
                    '${monthNames[selectedDate.month - 1]} '
                    '${selectedDate.day}',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (isToday)
                    Text(
                      'Өнөөдөр',
                      style: TextStyle(
                        fontSize: 11,
                        color: colors.tertiary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ── Next day ──
          IconButton(
            icon: Icon(Icons.chevron_right, color: colors.primary),
            onPressed: onNextDay,
            tooltip: 'Дараагийн өдөр',
          ),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

// ── FeedLogChecklist ──────────────────────────────────────────────────

class _FeedLogChecklist extends ConsumerStatefulWidget {
  const _FeedLogChecklist({
    required this.horseId,
    required this.schedules,
    required this.logs,
    required this.selectedDate,
    required this.onLogChanged,
  });

  final String horseId;
  final List<FeedSchedule> schedules;
  final List<FeedLog> logs;
  final DateTime selectedDate;
  final VoidCallback onLogChanged;

  @override
  ConsumerState<_FeedLogChecklist> createState() => _FeedLogChecklistState();
}

class _FeedLogChecklistState extends ConsumerState<_FeedLogChecklist> {
  bool _isProcessing = false;

  /// Find an existing log for a given schedule.
  FeedLog? _findLogForSchedule(String scheduleId) {
    try {
      return widget.logs.firstWhere((l) => l.scheduleId == scheduleId);
    } catch (_) {
      return null;
    }
  }

  Future<void> _toggleFed(FeedSchedule schedule) async {
    final existingLog = _findLogForSchedule(schedule.id);

    if (existingLog != null) {
      // Update existing log: if currently skipped, mark as fed with correct amount
      final updatedLog = existingLog.copyWith(
        skipped: false,
        amountGiven: schedule.quantityKg,
      );
      await _saveLog(updatedLog);
    } else {
      // Create new log entry for fed
      final log = FeedLog(
        id: DateTime.now().microsecondsSinceEpoch.toString(),
        scheduleId: schedule.id,
        horseId: widget.horseId,
        date: widget.selectedDate,
        amountGiven: schedule.quantityKg,
        skipped: false,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _saveLog(log);
    }
  }

  Future<void> _toggleSkipped(FeedSchedule schedule) async {
    final existingLog = _findLogForSchedule(schedule.id);

    if (existingLog != null) {
      // Toggle skipped state
      final updatedLog = existingLog.copyWith(
        skipped: !existingLog.skipped,
        amountGiven: existingLog.skipped ? schedule.quantityKg : 0,
      );
      await _saveLog(updatedLog);
    } else {
      // Create new log entry for skipped
      final log = FeedLog(
        id: DateTime.now().microsecondsSinceEpoch.toString(),
        scheduleId: schedule.id,
        horseId: widget.horseId,
        date: widget.selectedDate,
        amountGiven: 0,
        skipped: true,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _saveLog(log);
    }
  }

  Future<void> _saveLog(FeedLog log) async {
    setState(() => _isProcessing = true);

    final repo = ref.read(nutritionRepositoryProvider);
    final result = await repo.saveLog(log);

    if (!mounted) return;

    setState(() => _isProcessing = false);

    result.when(
      onSuccess: (_) {
        widget.onLogChanged();
      },
      onFailure: (error) {
        TamgaToast.showError(context, 'Алдаа: ${error.message}');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = TamgaColors.of(context);

    return RefreshIndicator(
      onRefresh: () async => widget.onLogChanged(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.md,
          AppSpacing.lg,
          AppSpacing.xxl,
        ),
        itemCount: widget.schedules.length,
        itemBuilder: (context, index) {
          final schedule = widget.schedules[index];
          final existingLog = _findLogForSchedule(schedule.id);
          final status = _getStatus(existingLog);

          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Schedule info ──
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: colors.primaryContainer,
                          radius: 18,
                          child: Icon(
                            _feedTypeIcon(schedule.feedType),
                            color: colors.onPrimaryContainer,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                schedule.feedType.displayName,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                '${schedule.quantityKg.toStringAsFixed(1)} кг · ${schedule.frequency}',
                                style: TextStyle(
                                  color: colors.onSurfaceVariant,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // ── Status badge ──
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: _statusColor(
                              status,
                              colors,
                            ).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(
                              AppSpacing.cornerRadiusSmall,
                            ),
                          ),
                          child: Text(
                            _statusLabel(status),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: _statusColor(status, colors),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // ── Action buttons ──
                    Row(
                      children: [
                        Expanded(
                          child: _ActionButton(
                            icon: Icons.check_circle_outline,
                            label: 'Тэжээсэн',
                            isActive: status == FeedStatus.fed,
                            activeColor: colors.tertiary,
                            onPressed: _isProcessing
                                ? null
                                : () => _toggleFed(schedule),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: _ActionButton(
                            icon: Icons.cancel_outlined,
                            label: 'Алгассан',
                            isActive: status == FeedStatus.skipped,
                            activeColor: colors.error,
                            onPressed: _isProcessing
                                ? null
                                : () => _toggleSkipped(schedule),
                          ),
                        ),
                      ],
                    ),

                    // ── Notes field (when fed/skipped) ──
                    if (existingLog != null &&
                        existingLog.notes.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        existingLog.notes,
                        style: TextStyle(
                          fontSize: 12,
                          color: colors.onSurfaceVariant,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  FeedStatus _getStatus(FeedLog? log) {
    if (log == null) return FeedStatus.pending;
    if (log.skipped) return FeedStatus.skipped;
    return FeedStatus.fed;
  }

  String _statusLabel(FeedStatus status) => switch (status) {
    FeedStatus.fed => 'Тэжээсэн',
    FeedStatus.skipped => 'Алгассан',
    FeedStatus.pending => 'Хүлээгдэж буй',
  };

  Color _statusColor(FeedStatus status, TamgaColors colors) => switch (status) {
    FeedStatus.fed => colors.tertiary,
    FeedStatus.skipped => colors.error,
    FeedStatus.pending => colors.onSurfaceVariant,
  };
}

enum FeedStatus { fed, skipped, pending }

IconData _feedTypeIcon(FeedType type) => switch (type) {
  FeedType.hay => Icons.grass_outlined,
  FeedType.grain => Icons.grain_outlined,
  FeedType.supplement => Icons.medication_outlined,
};

// ── ActionButton ──────────────────────────────────────────────────────

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.activeColor,
    this.onPressed,
  });

  final IconData icon;
  final String label;
  final bool isActive;
  final Color activeColor;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return SizedBox(
      height: 40,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(
          icon,
          size: 18,
          color: isActive ? colors.onPrimary : colors.onSurfaceVariant,
        ),
        label: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            color: isActive ? colors.onPrimary : colors.onSurfaceVariant,
          ),
        ),
        style: OutlinedButton.styleFrom(
          backgroundColor: isActive ? activeColor : null,
          side: BorderSide(color: isActive ? activeColor : colors.outline),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
        ),
      ),
    );
  }
}
