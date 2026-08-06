import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/lost_horse_report.dart';
import '../../domain/map_enums.dart';
import '../lost_horse_detail_screen.dart';

/// Compact card for lost horse reports in list view.
///
/// Photo-first layout: when a report photo exists it leads the card, making
/// the animal instantly recognizable in the feed. Urgent reports (last seen
/// within 24h) get an error-tinted accent so the most time-sensitive items
/// stand out while scrolling.
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
    final isUrgent = DateTime.now().difference(report.lastSeenAt).inHours < 24;
    final description = report.description?.trim();
    final photo = report.photoUrls.isNotEmpty ? report.photoUrls.first : null;
    final isActive = report.status == LostHorseStatus.active;

    return TamgaCard(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => LostHorseDetailScreen(report: report),
          ),
        );
      },
      padding: EdgeInsets.zero,
      margin: EdgeInsets.zero,
      showTopAccent: isActive,
      accentColor: isUrgent ? colors.error : colors.primary,
      accentHeight: 3,
      child: Padding(
        padding: const EdgeInsets.all(TamgaSpacing.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Photo / identity avatar ─────────────────────────
            _CardMedia(photoPath: photo, name: report.horseName ?? ''),
            const SizedBox(width: TamgaSpacing.md),

            // ── Identity column ─────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          report.horseName ?? report.animalType.displayName,
                          style: TamgaTypography.body(
                            weight: FontWeight.w700,
                            color: colors.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (!isActive) ...[
                        const SizedBox(width: TamgaSpacing.xs),
                        TamgaBadge(
                          label: report.status.label,
                          variant: report.status == LostHorseStatus.found
                              ? TamgaBadgeVariant.success
                              : TamgaBadgeVariant.neutral,
                          size: TamgaBadgeSize.small,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),

                  // Last-seen line — urgent color when fresh
                  Row(
                    children: [
                      Icon(
                        isUrgent ? Icons.schedule : Icons.history_outlined,
                        size: 14,
                        color: isUrgent
                            ? colors.error
                            : colors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Сүүлд үзсэн: ${_timeAgo(report.lastSeenAt)} өмнө',
                        style: TamgaTypography.caption1(
                          color: isUrgent
                              ? colors.error
                              : colors.onSurfaceVariant,
                          weight: isUrgent ? FontWeight.w700 : FontWeight.w400,
                        ),
                      ),
                    ],
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

                  // ── Identity chips ────────────────────────────
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
                      if (report.ages.isNotEmpty)
                        TamgaBadge(
                          label: report.ages
                              .map((a) => a.displayName)
                              .join(', '),
                          variant: TamgaBadgeVariant.info,
                          size: TamgaBadgeSize.small,
                        ),
                      if (report.travelDirection != null)
                        TamgaBadge(
                          label: report.travelDirection!.displayName,
                          variant: TamgaBadgeVariant.neutral,
                          size: TamgaBadgeSize.small,
                          icon: Icons.navigation_outlined,
                        ),
                      if (report.locationAimag != null)
                        TamgaBadge(
                          label: report.locationAimag!,
                          variant: TamgaBadgeVariant.neutral,
                          size: TamgaBadgeSize.small,
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: TamgaSpacing.xs),
            Icon(Icons.chevron_right, size: 20, color: colors.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

/// Leading media tile — photo when available, avatar fallback otherwise.
class _CardMedia extends StatelessWidget {
  const _CardMedia({required this.photoPath, required this.name});

  final String? photoPath;
  final String name;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    const size = 64.0;

    if (photoPath == null || photoPath!.isEmpty) {
      return TamgaAvatar(
        name: name,
        size: size,
        placeholder: Icons.pets_outlined,
      );
    }

    final localFile = File(photoPath!);
    final image = localFile.existsSync()
        ? Image.file(localFile, width: size, height: size, fit: BoxFit.cover)
        : CachedNetworkImage(
            imageUrl: photoPath!,
            width: size,
            height: size,
            fit: BoxFit.cover,
            placeholder: (_, _) => Container(
              width: size,
              height: size,
              color: colors.surfaceContainerHighest,
              child: const Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
            errorWidget: (_, _, _) => TamgaAvatar(
              name: name,
              size: size,
              placeholder: Icons.pets_outlined,
            ),
          );

    return ClipRRect(
      borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
      child: image,
    );
  }
}
