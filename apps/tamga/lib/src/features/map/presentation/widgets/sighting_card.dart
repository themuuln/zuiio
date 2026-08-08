import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/sighting_report.dart';

/// Compact card for displaying a sighting in a list feed.
class SightingCard extends StatelessWidget {
  const SightingCard({super.key, required this.sighting});

  final SightingReport sighting;

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    final minutes = diff.inMinutes.clamp(0, double.maxFinite.toInt());
    final hours = diff.inHours.clamp(0, double.maxFinite.toInt());
    final days = diff.inDays.clamp(0, double.maxFinite.toInt());
    if (minutes < 60) return '$minutesм';
    if (hours < 24) return '$hoursц';
    return '$daysх';
  }

  TamgaBadgeVariant _statusVariant() {
    switch (sighting.status) {
      case SightingStatus.pending:
        return TamgaBadgeVariant.destructive;
      case SightingStatus.confirmed:
        return TamgaBadgeVariant.success;
      case SightingStatus.dismissed:
        return TamgaBadgeVariant.neutral;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final reporterName = sighting.isAnonymous
        ? 'Нууцлаг хэрэглэгч'
        : sighting.reporterId;
    final description = sighting.description?.trim();

    return TamgaCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Reporter avatar ──
          TamgaAvatar(name: reporterName, size: 40),
          const SizedBox(width: TamgaSpacing.md),

          // ── Content ──
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Reporter name + time ago ──
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        reporterName,
                        style: TamgaTypography.footnote(
                          weight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: TamgaSpacing.sm),
                    Text(
                      _timeAgo(sighting.createdAt),
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: TamgaSpacing.xs),

                // ── Location ──
                if (sighting.locationName != null) ...[
                  Row(
                    children: [
                      Icon(
                        Icons.place_outlined,
                        size: 14,
                        color: colors.onSurfaceVariant,
                      ),
                      const SizedBox(width: TamgaSpacing.xs),
                      Expanded(
                        child: Text(
                          sighting.locationName!,
                          style: TamgaTypography.caption1(
                            color: colors.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  Row(
                    children: [
                      Icon(
                        Icons.place_outlined,
                        size: 14,
                        color: colors.onSurfaceVariant,
                      ),
                      const SizedBox(width: TamgaSpacing.xs),
                      Text(
                        '${sighting.lat.toStringAsFixed(4)}, '
                        '${sighting.lng.toStringAsFixed(4)}',
                        style: TamgaTypography.caption1(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],

                // ── Description ──
                if (description != null && description.isNotEmpty) ...[
                  const SizedBox(height: TamgaSpacing.xs),
                  Text(
                    description,
                    style: TamgaTypography.body(color: colors.onSurface),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

                // ── Photo thumbnail ──
                if (sighting.photoUrl != null) ...[
                  const SizedBox(height: TamgaSpacing.sm),
                  GestureDetector(
                    onTap: () => _showFullPhoto(context, colors),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadiusSmall,
                      ),
                      child: CachedNetworkImage(
                        imageUrl: sighting.photoUrl!,
                        height: 80,
                        width: 120,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(
                          height: 80,
                          width: 120,
                          color: colors.surfaceContainerLow,
                          child: const LoadingIndicator(size: 16),
                        ),
                        errorWidget: (_, _, _) => Container(
                          height: 80,
                          width: 120,
                          color: colors.surfaceContainerLow,
                          child: Icon(
                            Icons.broken_image_outlined,
                            color: colors.onSurfaceVariant,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: TamgaSpacing.sm),

          // ── Status badge ──
          TamgaBadge(
            label: sighting.status.label,
            variant: _statusVariant(),
            size: TamgaBadgeSize.small,
          ),
        ],
      ),
    );
  }

  void _showFullPhoto(BuildContext context, TamgaColors colors) {
    if (sighting.photoUrl == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(TamgaSpacing.cornerRadius),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Handle bar ──
            Container(
              margin: const EdgeInsets.only(top: TamgaSpacing.sm),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colors.outline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // ── Image ──
            Flexible(
              child: Padding(
                padding: const EdgeInsets.all(TamgaSpacing.md),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadius,
                  ),
                  child: CachedNetworkImage(
                    imageUrl: sighting.photoUrl!,
                    fit: BoxFit.contain,
                    placeholder: (_, _) =>
                        const Center(child: LoadingIndicator(size: 24)),
                    errorWidget: (_, _, _) => Center(
                      child: Icon(
                        Icons.broken_image_outlined,
                        color: colors.onSurfaceVariant,
                        size: 48,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
