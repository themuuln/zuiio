import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../data/gestation_calculator.dart';
import '../../domain/breeding_record.dart';

/// Visual progress bar showing gestation progress with milestone markers.
///
/// Displays days elapsed/remaining, color-coded status, and milestone
/// markers at key gestation points (30, 90, 180, 300 days).
class GestationTrackerWidget extends StatelessWidget {
  const GestationTrackerWidget({
    super.key,
    required this.record,
    this.showMilestones = true,
    this.showDetails = true,
    this.compact = false,
  });

  final BreedingRecord record;
  final bool showMilestones;
  final bool showDetails;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final progress = record.gestationProgress.clamp(0.0, 1.0);
    final daysElapsed = record.daysElapsed;
    final daysRemaining = record.daysRemaining;
    final statusCategory = record.statusCategory;

    // Determine colors based on status
    final (progressColor, backgroundColor, statusText) = _getStatusColors(
      statusCategory,
      colorScheme,
      daysRemaining,
    );

    if (compact) {
      return _CompactTracker(
        progress: progress,
        progressColor: progressColor,
        backgroundColor: backgroundColor,
        statusText: statusText,
        daysElapsed: daysElapsed,
        daysRemaining: daysRemaining,
        theme: theme,
      );
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(color: colorScheme.outlineVariant, width: 1),
      ),
      child: Padding(
        padding: AppSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with status
            Row(
              children: [
                Icon(
                  _getStatusIcon(statusCategory),
                  color: progressColor,
                  size: 20,
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  statusText,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: progressColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                if (record.isOverdue)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadiusSmall,
                      ),
                    ),
                    child: Text(
                      'Хугацаа хэтэрсэн',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onErrorContainer,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
              child: Stack(
                children: [
                  // Background
                  Container(height: compact ? 8 : 12, color: backgroundColor),
                  // Progress fill
                  FractionallySizedBox(
                    widthFactor: progress,
                    child: Container(
                      height: compact ? 8 : 12,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            progressColor.withValues(alpha: 0.7),
                            progressColor,
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Milestone markers
                  if (showMilestones)
                    Positioned.fill(
                      child: _MilestoneMarkers(
                        gestationDays: GestationCalculator.gestationDays,
                        progressColor: progressColor,
                      ),
                    ),
                ],
              ),
            ),

            if (showDetails) ...[
              const SizedBox(height: AppSpacing.md),

              // Days info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _DaysInfo(
                    label: 'Өнгөрсөн',
                    value: '$daysElapsed хоног',
                    theme: theme,
                  ),
                  _DaysInfo(
                    label: 'Үлдсэн',
                    value: daysRemaining > 0
                        ? '$daysRemaining хоног'
                        : 'Дууссан',
                    theme: theme,
                    isHighlighted: daysRemaining <= 30,
                    color: daysRemaining <= 30 ? colorScheme.error : null,
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.sm),

              // Progress percentage
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Прогресс',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.outline,
                    ),
                  ),
                  Text(
                    '${(progress * 100).toInt()}%',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: progressColor,
                    ),
                  ),
                ],
              ),

              // Milestone labels
              if (showMilestones) ...[
                const SizedBox(height: AppSpacing.md),
                _MilestoneLabels(daysElapsed: daysElapsed, theme: theme),
              ],
            ],
          ],
        ),
      ),
    );
  }

  (Color, Color, String) _getStatusColors(
    GestationStatusCategory category,
    ColorScheme colorScheme,
    int daysRemaining,
  ) {
    return switch (category) {
      GestationStatusCategory.healthy => (
        colorScheme.primary,
        colorScheme.surfaceContainerHighest,
        'Эрүүл хээлт',
      ),
      GestationStatusCategory.approaching => (
        Colors.orange,
        colorScheme.surfaceContainerHighest,
        'Төллөхөд ойрхон',
      ),
      GestationStatusCategory.overdue => (
        colorScheme.error,
        colorScheme.errorContainer.withValues(alpha: 0.3),
        'Хугацаа хэтэрсэн',
      ),
      GestationStatusCategory.foaled => (
        Colors.green,
        colorScheme.surfaceContainerHighest,
        'Төллөсөн',
      ),
      GestationStatusCategory.aborted => (
        colorScheme.outline,
        colorScheme.surfaceContainerHighest,
        'Хээл хаясан',
      ),
    };
  }

  IconData _getStatusIcon(GestationStatusCategory category) {
    return switch (category) {
      GestationStatusCategory.healthy => Icons.check_circle_outline,
      GestationStatusCategory.approaching => Icons.schedule,
      GestationStatusCategory.overdue => Icons.warning_amber_rounded,
      GestationStatusCategory.foaled => Icons.child_care,
      GestationStatusCategory.aborted => Icons.cancel_outlined,
    };
  }
}

class _CompactTracker extends StatelessWidget {
  const _CompactTracker({
    required this.progress,
    required this.progressColor,
    required this.backgroundColor,
    required this.statusText,
    required this.daysElapsed,
    required this.daysRemaining,
    required this.theme,
  });

  final double progress;
  final Color progressColor;
  final Color backgroundColor;
  final String statusText;
  final int daysElapsed;
  final int daysRemaining;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              statusText,
              style: theme.textTheme.labelMedium?.copyWith(
                color: progressColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '${(progress * 100).toInt()}%',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: backgroundColor,
            valueColor: AlwaysStoppedAnimation<Color>(progressColor),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          '$daysElapsed / ${GestationCalculator.gestationDays} хоног',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.outline,
          ),
        ),
      ],
    );
  }
}

class _MilestoneMarkers extends StatelessWidget {
  const _MilestoneMarkers({
    required this.gestationDays,
    required this.progressColor,
  });

  final int gestationDays;
  final Color progressColor;

  static const List<int> milestones = [30, 90, 180, 300];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: milestones.map((days) {
        final position = days / gestationDays;
        return Expanded(
          flex: 1,
          child: Align(
            alignment: Alignment(position * 2 - 1, 0),
            child: Container(
              width: 2,
              height: 12,
              color: progressColor.withValues(alpha: 0.5),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _DaysInfo extends StatelessWidget {
  const _DaysInfo({
    required this.label,
    required this.value,
    required this.theme,
    this.isHighlighted = false,
    this.color,
  });

  final String label;
  final String value;
  final ThemeData theme;
  final bool isHighlighted;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.outline,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: isHighlighted ? FontWeight.bold : FontWeight.w500,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _MilestoneLabels extends StatelessWidget {
  const _MilestoneLabels({required this.daysElapsed, required this.theme});

  final int daysElapsed;
  final ThemeData theme;

  static const List<(int, String)> milestones = [
    (30, 'Эхний сар'),
    (90, '3 сар'),
    (180, '6 сар'),
    (300, '10 сар'),
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.xs,
      children: milestones.map((entry) {
        final (days, label) = entry;
        final isPassed = daysElapsed >= days;
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: isPassed
                ? theme.colorScheme.primaryContainer.withValues(alpha: 0.3)
                : theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
            border: Border.all(
              color: isPassed
                  ? theme.colorScheme.primary.withValues(alpha: 0.3)
                  : theme.colorScheme.outlineVariant,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isPassed)
                Icon(Icons.check, size: 12, color: theme.colorScheme.primary)
              else
                const SizedBox(width: 12),
              const SizedBox(width: AppSpacing.xs),
              Text(
                '$label ($days хоног)',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: isPassed
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outline,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
