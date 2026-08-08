import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/connection_status.dart';
import '../../market/application/market_providers.dart';
import '../../search/application/search_providers.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../../../core/theme/design_tokens.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import 'horse_detail_screen.dart';
import 'horse_editor_sheet.dart';

/// Морийн жагсаалтын нэг карт.
class HorseCard extends ConsumerWidget {
  const HorseCard({super.key, required this.horse});
  final HorseRecord horse;

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final theme = Theme.of(ctx);
    final colorScheme = theme.colorScheme;
    final tamgaColors = TamgaColors.of(ctx);
    final certificateAsync = ref.watch(digitalCertificateProvider(horse.id));

    return InkWell(
      onTap: () {
        Navigator.of(ctx).push(
          MaterialPageRoute(builder: (_) => HorseDetailScreen(horse: horse)),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: tamgaColors.surfaceContainerLowest,
          border: Border(
            bottom: BorderSide(color: tamgaColors.border, width: 0.5),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.md,
            AppSpacing.sm,
            AppSpacing.md,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Avatar ──
              HorseAvatar(horse: horse, colorScheme: colorScheme),
              const SizedBox(width: AppSpacing.md),
              // ── Content ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name row
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            horse.name,
                            style: TamgaTypography.headline(
                              weight: FontWeight.w600,
                              color: tamgaColors.foreground,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        if (certificateAsync.maybeWhen(
                          data: (cert) => cert != null,
                          orElse: () => false,
                        ))
                          Icon(
                            Icons.verified,
                            size: 16,
                            color: tamgaColors.primary,
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    // Detail line
                    Text(
                      '${horse.gender.displayName} · ${horse.coat} · ${horse.birthYear}',
                      style: TamgaTypography.callout(
                        color: tamgaColors.mutedForeground,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    // Compact badges
                    Wrap(
                      spacing: AppSpacing.xs,
                      runSpacing: AppSpacing.xs,
                      children: [
                        _CompactBadge(
                          label: horse.isOwnedByHousehold ? 'Өрх' : 'Гаднах',
                          color: tamgaColors.primary.withValues(alpha: 0.1),
                          textColor: tamgaColors.primary,
                        ),
                        _CompactBadge(
                          label: 'Шагнал ${horse.awardCount}',
                          color: tamgaColors.primaryContainer.withValues(
                            alpha: 0.5,
                          ),
                          textColor: tamgaColors.onPrimaryContainer,
                        ),
                        _CompactBadge(
                          label: 'Үр төл ${horse.offspringCount}',
                          color: tamgaColors.surfaceContainerHighest.withValues(
                            alpha: 0.5,
                          ),
                          textColor: tamgaColors.onSurfaceVariant,
                        ),
                        if (horse.breedLineage != null)
                          _CompactBadge(
                            label: horse.breedLineage!.displayName,
                            color: tamgaColors.tertiary.withValues(alpha: 0.1),
                            textColor: tamgaColors.tertiary,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              // ── Edit button ──
              IconButton(
                tooltip: '${horse.name} засах',
                onPressed: () async {
                  final result = await showModalBottomSheet<HorseRecord>(
                    context: ctx,
                    isScrollControlled: true,
                    builder: (_) => HorseEditorSheet(initialHorse: horse),
                  );
                  if (result != null) {
                    final repo = await ref.read(
                      horsesRepositoryProvider.future,
                    );
                    await repo.saveHorse(result);
                    ref.invalidate(horsesProvider);
                    ref.invalidate(searchCatalogProvider);
                    if (ctx.mounted) {
                      showOfflineAwareSaveFeedback(
                        ctx,
                        ConnectionMonitor.instance.current,
                      );
                    }
                  }
                },
                icon: Icon(
                  Icons.edit_outlined,
                  size: 18,
                  color: tamgaColors.mutedForeground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Морийн аватар — зураг эсвэл үсгийн эхний үсэг.
class HorseAvatar extends StatelessWidget {
  const HorseAvatar({
    super.key,
    required this.horse,
    required this.colorScheme,
  });
  final HorseRecord horse;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    // Show photo if available, else initials
    if (horse.photoUrls.isNotEmpty) {
      return Hero(
        tag: 'horse-image-${horse.id}',
        child: CircleAvatar(
          radius: 24,
          backgroundColor: colorScheme.primaryContainer,
          child: ClipOval(
            child: CachedNetworkImage(
              imageUrl: horse.photoUrls.first,
              width: 48,
              height: 48,
              fit: BoxFit.cover,
              placeholder: (_, _) => Container(
                width: 48,
                height: 48,
                color: colorScheme.primaryContainer,
                child: Icon(
                  Icons.pets,
                  color: colorScheme.onPrimaryContainer.withValues(alpha: 0.4),
                ),
              ),
              errorWidget: (_, _, _) => Container(
                width: 48,
                height: 48,
                color: colorScheme.primaryContainer,
                child: Icon(
                  Icons.pets,
                  color: colorScheme.onPrimaryContainer.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),
        ),
      );
    }

    final initials = horse.name.isNotEmpty ? horse.name[0] : '?';
    return CircleAvatar(
      radius: 24,
      backgroundColor: colorScheme.primaryContainer,
      child: Text(
        initials,
        style: TextStyle(
          color: colorScheme.onPrimaryContainer,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
      ),
    );
  }
}

/// Compact inline badge for horse cards.
class _CompactBadge extends StatelessWidget {
  const _CompactBadge({
    required this.label,
    required this.color,
    required this.textColor,
  });

  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext ctx) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}
