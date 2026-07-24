/// Үржүүлгийн шинжилгээний үр дүнгийн карт.
///
/// Gemini-ий структуртай хариуг харуулна:
/// - Нийцлийн оноо (прогресс хүрээ)
/// - Цус ойртолтын эрсдэл (ногоон/шар/улаан)
/// - Өнгөний таамаглал (өнгөт чипүүд + магадлал)
/// - Эрүүл мэндийн эрсдэлүүд
/// - Үржүүлгийн цонх
/// - Нийт зөвлөмж (карт)
/// - Монгол үүлдрийн зөвлөмж
/// - Нийтлэг өвгүүд
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../domain/breeding_advice.dart';

/// Үржүүлгийн шинжилгээний үр дүнгийн карт.
class BreedingResultCard extends StatelessWidget {
  const BreedingResultCard({super.key, required this.advice});

  /// Шинжилгээний үр дүн.
  final BreedingAdvice advice;

  // ── Өнгөний тодорхойлолт ──────────────────────────────────────────────

  Color _riskColor() {
    switch (advice.inbreedingRisk) {
      case InbreedingRisk.low:
        return Colors.green;
      case InbreedingRisk.medium:
        return Colors.orange;
      case InbreedingRisk.high:
        return Colors.red;
    }
  }

  Color _recommendationColor() {
    switch (advice.overallRecommendation) {
      case OverallRecommendation.breed:
        return Colors.green;
      case OverallRecommendation.avoid:
        return Colors.red;
      case OverallRecommendation.consultVet:
        return Colors.orange;
    }
  }

  IconData _recommendationIcon() {
    switch (advice.overallRecommendation) {
      case OverallRecommendation.breed:
        return Icons.check_circle;
      case OverallRecommendation.avoid:
        return Icons.cancel;
      case OverallRecommendation.consultVet:
        return Icons.medical_services;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Нийт зөвлөмж (дээр нь) ──
        _buildOverallRecommendationCard(theme),
        const SizedBox(height: AppSpacing.lg),

        // ── Нийцлийн оноо ──
        _buildCompatibilityGauge(theme),
        const SizedBox(height: AppSpacing.lg),

        // ── Эрсдэлийн хэсэг ──
        _buildRiskSection(theme),
        const SizedBox(height: AppSpacing.lg),

        // ── Нийтлэг өвгүүд ──
        if (advice.commonAncestors.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Нийтлэг өвгүүд',
            Icons.account_tree_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          ...advice.commonAncestors.map((ancestor) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: Row(
                children: [
                  Icon(
                    Icons.person_outline,
                    size: 16,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(ancestor.name, style: theme.textTheme.bodyMedium),
                  const Spacer(),
                  Text(
                    '${ancestor.generationsApart} үе',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: AppSpacing.lg),
        ],

        // ── Өнгөний таамаглал ──
        if (advice.coatColorPredictions.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Өнгөний таамаглал',
            Icons.palette_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: advice.coatColorPredictions.map((prediction) {
              return _buildColorChip(theme, prediction);
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],

        // ── Эрүүл мэндийн эрсдэлүүд ──
        if (advice.healthRisks.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Эрүүл мэндийн эрсдэл',
            Icons.warning_amber_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          ...advice.healthRisks.map((risk) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.info_outline,
                    size: 16,
                    color: Colors.orange,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      risk,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: AppSpacing.lg),
        ],

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

        // ── Үржүүлгийн цонх ──
        if (advice.breedingWindow.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Үржүүлгийн цонх',
            Icons.calendar_today_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          Card(
            elevation: 0,
            color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Icon(
                    Icons.wb_sunny_outlined,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      advice.breedingWindow,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],

        // ── Монгол үүлдрийн зөвлөмж ──
        if (advice.mongolianBreedNotes.isNotEmpty) ...[
          _buildSectionHeader(
            theme,
            'Монгол үүлдрийн зөвлөмж',
            Icons.pets_outlined,
          ),
          const SizedBox(height: AppSpacing.sm),
          Card(
            elevation: 0,
            color: theme.colorScheme.tertiaryContainer.withValues(alpha: 0.3),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Text(
                advice.mongolianBreedNotes,
                style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
              ),
            ),
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

        // ── Кэш тэмдэг ──
        if (advice.cached) ...[
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Icon(
                Icons.cached,
                size: 14,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Кэшээс авсан (24 цагийн дотор)',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  // ── Нийт зөвлөмжийн карт ──────────────────────────────────────────────

  Widget _buildOverallRecommendationCard(ThemeData theme) {
    final color = _recommendationColor();
    final icon = _recommendationIcon();

    return Card(
      elevation: 0,
      color: color.withValues(alpha: 0.12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(color: color.withValues(alpha: 0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Row(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Нийт зөвлөмж',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    advice.overallRecommendation.displayName,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Нийцлийн оноо ─────────────────────────────────────────────────────

  Widget _buildCompatibilityGauge(ThemeData theme) {
    final score = advice.compatibilityScore;
    final color = score >= 70
        ? Colors.green
        : score >= 40
        ? Colors.orange
        : Colors.red;

    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$score',
                  style: theme.textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  '/100',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              advice.compatibilityLabel,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: score / 100.0,
                backgroundColor: color.withValues(alpha: 0.15),
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 8,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Эрсдэлийн хэсэг ──────────────────────────────────────────────────

  Widget _buildRiskSection(ThemeData theme) {
    final riskColor = _riskColor();
    final riskBgColor = riskColor.withValues(alpha: 0.12);

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
            Row(
              children: [
                Icon(_riskIcon(), color: riskColor, size: 28),
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

  IconData _riskIcon() {
    switch (advice.inbreedingRisk) {
      case InbreedingRisk.low:
        return Icons.check_circle_outline;
      case InbreedingRisk.medium:
        return Icons.warning_amber_outlined;
      case InbreedingRisk.high:
        return Icons.error_outline;
    }
  }

  // ── Өнгөний чип ──────────────────────────────────────────────────────

  Widget _buildColorChip(ThemeData theme, CoatColorPrediction prediction) {
    // Магадлалаар өнгөний тод байдлыг тохируулах
    final opacity = (prediction.probability / 100).clamp(0.4, 1.0);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer.withValues(alpha: opacity),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(prediction.color, style: theme.textTheme.labelMedium),
          const SizedBox(width: AppSpacing.xs),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xs,
              vertical: 2,
            ),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '${prediction.probability}%',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
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
