/// Үржүүлгийн шинжилгээний үр дүнгийн карт.
///
/// Өнгөөр ялгасан цус ойртолтын эрсдэл (ногоон/шар/улаан),
/// эрүүл мэндийн тэмдэглэл, өнгөний таамаглал, үүлдрийн зөвлөмжийг харуулна.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../domain/breeding_advice.dart';

/// Цус ойртолтын эрсдэлийг өнгөөр ялгасан карт.
class BreedingResultCard extends StatelessWidget {
  const BreedingResultCard({super.key, required this.advice});

  /// Шинжилгээний үр дүн.
  final BreedingAdvice advice;

  // ── Өнгөний тодорхойлолт ──────────────────────────────────────────────

  Color _riskColor(ThemeData theme) {
    switch (advice.inbreedingRisk) {
      case InbreedingRisk.low:
        return Colors.green;
      case InbreedingRisk.medium:
        return Colors.orange;
      case InbreedingRisk.high:
        return Colors.red;
    }
  }

  Color _riskBgColor(ThemeData theme) {
    return _riskColor(theme).withValues(alpha: 0.12);
  }

  IconData _riskIcon(ThemeData theme) {
    switch (advice.inbreedingRisk) {
      case InbreedingRisk.low:
        return Icons.check_circle_outline;
      case InbreedingRisk.medium:
        return Icons.warning_amber_outlined;
      case InbreedingRisk.high:
        return Icons.error_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final riskColor = _riskColor(theme);
    final riskBgColor = _riskBgColor(theme);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Эрсдэлийн түвшин ──
        _buildRiskSection(theme, riskColor, riskBgColor),
        const SizedBox(height: AppSpacing.lg),

        // ── Эрүүл мэндийн тэмдэглэл ──
        if (advice.healthNotes.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Эрүүл мэндийн тэмдэглэл',
            Icons.health_and_safety_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          Card(
            elevation: 0,
            color: theme.colorScheme.surfaceContainerHighest,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Text(
                advice.healthNotes,
                style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],

        // ── Өнгөний таамаглал ──
        if (advice.colorPredictions.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Өнгөний таамаглал',
            Icons.palette_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: advice.colorPredictions
                .map(
                  (color) => Chip(
                    label: Text(color, style: theme.textTheme.labelMedium),
                    backgroundColor: theme.colorScheme.secondaryContainer,
                    side: BorderSide.none,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],

        // ── Үүлдрийн зөвлөмж ──
        if (advice.breedSuggestions.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Үүлдрийн зөвлөмж',
            Icons.lightbulb_outline,
          ),
          const SizedBox(height: AppSpacing.sm),
          ...advice.breedSuggestions.asMap().entries.map((entry) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: entry.key < advice.breedSuggestions.length - 1
                    ? AppSpacing.sm
                    : 0,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Icon(
                      Icons.check_circle,
                      size: 18,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      entry.value,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ],
    );
  }

  // ── Эрсдэлийн хэсэг ──────────────────────────────────────────────────

  Widget _buildRiskSection(
    ThemeData theme,
    Color riskColor,
    Color riskBgColor,
  ) {
    return Card(
      elevation: 0,
      color: riskBgColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(color: riskColor.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          children: [
            // ── Эрсдэлийн дүрс ба түвшин ──
            Row(
              children: [
                Icon(_riskIcon(theme), color: riskColor, size: 28),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Цус ойртолтын эрсдэл',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        advice.inbreedingRisk.displayName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: riskColor,
                        ),
                      ),
                    ],
                  ),
                ),
                // ── Эрсдэлийн оноо ──
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: riskColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusPill,
                    ),
                    border: Border.all(color: riskColor.withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    '${advice.riskScore}/100',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: riskColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Эрсдэлийн progress bar ──
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: advice.riskScore / 100.0,
                backgroundColor: riskColor.withValues(alpha: 0.15),
                valueColor: AlwaysStoppedAnimation<Color>(riskColor),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),

            // ── Эрсдэлийн тайлбар ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Эрсдэлгүй',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  advice.riskScoreLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: riskColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Өндөр эрсдэл',
                  style: theme.textTheme.labelSmall?.copyWith(
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

  // ── Хэсгийн гарчиг ──────────────────────────────────────────────────

  Widget _buildSectionHeader(ThemeData theme, String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.primary),
        const SizedBox(width: AppSpacing.sm),
        Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
