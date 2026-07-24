import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/connection_status.dart';
import '../../market/application/market_providers.dart';
import '../../search/application/search_providers.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import 'co_ownership_sheet.dart';
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
    final certificateAsync = ref.watch(digitalCertificateProvider(horse.id));

    return Card(
      clipBehavior: Clip.hardEdge,
      child: InkWell(
        onTap: () {
          Navigator.of(ctx).push(
            MaterialPageRoute(builder: (_) => HorseDetailScreen(horse: horse)),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header row: name + badges ──
              Row(
                children: [
                  // Horse avatar
                  HorseAvatar(horse: horse, colorScheme: colorScheme),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(horse.name, style: theme.textTheme.titleLarge),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          '${horse.relationLabel} • ${horse.coat} • ${horse.birthYear}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
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
                    icon: const Icon(Icons.edit_outlined, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Badges row ──
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  BadgeChip(
                    label: horse.isOwnedByHousehold ? 'Өрхийн' : 'Гаднах',
                    color: horse.isOwnedByHousehold
                        ? colorScheme.tertiaryContainer
                        : colorScheme.secondaryContainer,
                  ),
                  BadgeChip(
                    label: horse.gender.displayName,
                    color: colorScheme.secondaryContainer,
                  ),
                  BadgeChip(
                    label: 'Шагнал ${horse.awardCount}',
                    color: colorScheme.primaryContainer,
                  ),
                  BadgeChip(
                    label: 'Үр төл ${horse.offspringCount}',
                    color: colorScheme.surfaceContainerHighest,
                  ),
                  certificateAsync.maybeWhen(
                    data: (cert) {
                      if (cert != null) {
                        return BadgeChip(
                          label: 'Certified',
                          color: colorScheme.tertiaryContainer,
                        );
                      }
                      return const SizedBox.shrink();
                    },
                    orElse: () => const SizedBox.shrink(),
                  ),
                  if (horse.lineageRootId != null)
                    BadgeChip(
                      label: 'Root ${horse.lineageRootId}',
                      color: colorScheme.surfaceContainerLow,
                    ),
                ],
              ),

              // ── Owner stamp ──
              if (horse.ownerStampSvg != null &&
                  horse.ownerStampSvg!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    SvgPicture.string(
                      horse.ownerStampSvg!,
                      width: 32,
                      height: 32,
                      placeholderBuilder: (_) => const SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Тамга',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],

              // ── Notes preview ──
              if (horse.notes.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  horse.notes,
                  style: theme.textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              // ── Footer actions ──
              const Divider(height: AppSpacing.xl),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () {
                      showModalBottomSheet(
                        context: ctx,
                        isScrollControlled: true,
                        builder: (_) => CoOwnershipSheet(
                          horseId: horse.id,
                          horseName: horse.name,
                        ),
                      );
                    },
                    icon: const Icon(Icons.people_outline, size: 18),
                    label: const Text('Хамтран эзэмшигчид'),
                  ),
                ],
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

/// Бага бүртгэлийн дугуй.
class BadgeChip extends StatelessWidget {
  const BadgeChip({super.key, required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext ctx) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs + 2,
        ),
        child: Text(
          label,
          style: Theme.of(
            ctx,
          ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
