import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/tamga_card.dart';
import '../../../../shared/domain/health_log.dart';

/// Card widget that displays a medical health log.
///
/// Shows: type badge with icon, date, notes preview, and optional
/// medicament details. Tap triggers [onTap].
class HealthLogCard extends StatelessWidget {
  const HealthLogCard({required this.log, this.onTap, super.key});

  final HealthLog log;

  /// Called when the card is tapped.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return TamgaCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Type badge ──
              CircleAvatar(
                backgroundColor: colorScheme.primaryContainer,
                radius: 22,
                child: Icon(
                  _medicalIcon(log.logType),
                  color: colorScheme.onPrimaryContainer,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),

              // ── Content ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Type label + date
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            log.logType.displayName,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Text(
                          _formatDate(log.date!),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),

                    // Notes preview
                    if (log.notes.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        log.notes,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],

                    // Medicament
                    if (log.medicament != null &&
                        log.medicament!.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'Эм: ${log.medicament}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w500,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // ── Chevron ──
              Icon(Icons.chevron_right, color: colorScheme.outline, size: 20),
            ],
          ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

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
