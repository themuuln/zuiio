import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';
import '../../../../core/widgets/tamga_card.dart';
import '../../../../shared/domain/event.dart';

/// Displays an [Event] summary: type badge with color, date, location,
/// result preview, and tap handler.
class EventCard extends StatelessWidget {
  const EventCard({required this.event, this.onTap, super.key});

  final Event event;
  final VoidCallback? onTap;

  // ── Derived helpers ──────────────────────────────────────────────

  IconData get _typeIcon {
    switch (event.eventType) {
      case EventType.race:
        return Icons.speed;
      case EventType.auction:
        return Icons.gavel;
      case EventType.expo:
        return Icons.storefront;
      case EventType.training:
        return Icons.school;
    }
  }

  Color _typeBadgeColor(BuildContext context) {
    final tc = TamgaColors.of(context);
    switch (event.eventType) {
      case EventType.race:
        return tc.primary;
      case EventType.auction:
        return tc.tertiary;
      case EventType.expo:
        return tc.secondary;
      case EventType.training:
        return AppColors.systemPurple;
    }
  }

  Color _typeBadgeIconColor(BuildContext context) {
    return Colors.white;
  }

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
                backgroundColor: _typeBadgeColor(context),
                radius: 22,
                child: Icon(
                  _typeIcon,
                  color: _typeBadgeIconColor(context),
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),

              // ── Content ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title + status badge
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            event.title,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        _StatusBadge(isUpcoming: event.isUpcoming),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),

                    // Date
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          event.date != null
                              ? '${event.date!.year}-${event.date!.month.toString().padLeft(2, '0')}-${event.date!.day.toString().padLeft(2, '0')}'
                              : 'Тодорхойгүй',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.xs,
                            vertical: AppSpacing.xs,
                          ),
                          decoration: BoxDecoration(
                            color: _typeBadgeColor(
                              context,
                            ).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(
                              AppSpacing.cornerRadiusSmall,
                            ),
                          ),
                          child: Text(
                            event.eventType.displayName,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: _typeBadgeColor(context),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Location
                    if ((event.location ?? '').isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Row(
                        children: [
                          Icon(
                            Icons.place_outlined,
                            size: 14,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: Text(
                              event.location!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],

                    // Result preview
                    if ((event.result ?? '').isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.sm),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        decoration: BoxDecoration(
                          color: colorScheme.tertiaryContainer.withValues(
                            alpha: 0.5,
                          ),
                          borderRadius: BorderRadius.circular(
                            AppSpacing.cornerRadiusSmall,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.emoji_events_outlined,
                              size: 14,
                              color: colorScheme.onTertiaryContainer,
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            Expanded(
                              child: Text(
                                event.result ?? '',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onTertiaryContainer,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // ── Chevron ──
              const SizedBox(width: AppSpacing.sm),
              Icon(
                Icons.chevron_right,
                color: colorScheme.onSurfaceVariant,
                size: 20,
              ),
            ],
          ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.isUpcoming});

  final bool isUpcoming;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tc = TamgaColors.of(context);

    final badgeColor = isUpcoming ? tc.primary : tc.tertiary;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        child: Text(
          isUpcoming ? 'Upcoming' : 'Completed',
          style: theme.textTheme.labelSmall?.copyWith(
            color: badgeColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
