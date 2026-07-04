import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/lost_horse_report.dart';
import '../../domain/map_enums.dart';
import '../lost_horse_detail_screen.dart';

/// Compact card for lost horse reports in list view.
class LostHorseCard extends StatelessWidget {
  const LostHorseCard({super.key, required this.report, this.distanceKm});

  final LostHorseReport report;
  final double? distanceKm;

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    final minutes = diff.inMinutes.clamp(0, double.maxFinite.toInt());
    final hours = diff.inHours.clamp(0, double.maxFinite.toInt());
    final days = diff.inDays.clamp(0, double.maxFinite.toInt());
    if (minutes < 60) return '$minutesм';
    if (hours < 24) return '$hoursц';
    return '$daysх';
  }

  String _formatDistance(double km) {
    if (km < 1) return '${(km * 1000).round()} м';
    if (km < 10) return '${km.toStringAsFixed(1)} км';
    return '${km.round()} км';
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isRecent = DateTime.now().difference(report.lastSeenAt).inHours < 24;
    final description = report.description?.trim();

    return TamgaCard(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => LostHorseDetailScreen(report: report),
          ),
        );
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TamgaAvatar(name: report.horseName ?? '', size: 40),
          const SizedBox(width: TamgaSpacing.md),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        report.horseName ?? '',
                        style: TamgaTypography.body(weight: FontWeight.w600),
                      ),
                    ),
                    if (isRecent)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: colors.error,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'Сүүлд үзсэн: ${_timeAgo(report.lastSeenAt)} өмнө',
                  style: TamgaTypography.caption1(
                    color: colors.onSurfaceVariant,
                  ),
                ),
                if (description != null && description.isNotEmpty) ...[
                  const SizedBox(height: TamgaSpacing.xs),
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TamgaTypography.caption1(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
                const SizedBox(height: TamgaSpacing.sm),
                Wrap(
                  spacing: TamgaSpacing.xs,
                  runSpacing: TamgaSpacing.xs,
                  children: [
                    if (distanceKm != null)
                      TamgaBadge(
                        label: _formatDistance(distanceKm!),
                        variant: TamgaBadgeVariant.info,
                        size: TamgaBadgeSize.small,
                        icon: Icons.near_me_outlined,
                      ),
                    if (report.coatColor != null)
                      TamgaBadge(
                        label: report.coatColor!,
                        variant: TamgaBadgeVariant.neutral,
                        size: TamgaBadgeSize.small,
                      ),
                    if (report.locationAimag != null)
                      TamgaBadge(
                        label: report.locationAimag!,
                        variant: TamgaBadgeVariant.neutral,
                        size: TamgaBadgeSize.small,
                      ),
                    if (report.ages.isNotEmpty)
                      TamgaBadge(
                        label: report.ages
                            .map((a) => a.displayName)
                            .join(', '),
                        variant: TamgaBadgeVariant.info,
                        size: TamgaBadgeSize.small,
                      ),
                    TamgaBadge(
                      label:
                          '${report.searchRadiusKm.toStringAsFixed(0)} км бүс',
                      variant: TamgaBadgeVariant.neutral,
                      size: TamgaBadgeSize.small,
                      icon: Icons.radar_outlined,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: TamgaSpacing.sm),

          TamgaBadge(
            label: report.status.label,
            variant: report.status == LostHorseStatus.active
                ? TamgaBadgeVariant.destructive
                : TamgaBadgeVariant.success,
            size: TamgaBadgeSize.small,
          ),
        ],
      ),
    );
  }
}
