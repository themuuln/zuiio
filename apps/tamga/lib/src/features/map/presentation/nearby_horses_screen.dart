import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/error_helpers.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/map_providers.dart';
import '../application/nearby_horses_provider.dart';
import '../domain/horse_location.dart';
import 'lost_horse_detail_screen.dart';

/// Nearby horses discovery screen.
class NearbyHorsesScreen extends ConsumerStatefulWidget {
  const NearbyHorsesScreen({super.key});

  @override
  ConsumerState<NearbyHorsesScreen> createState() => _NearbyHorsesScreenState();
}

class _NearbyHorsesScreenState extends ConsumerState<NearbyHorsesScreen> {
  double _radiusKm = 25.0;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final horsesAsync = ref.watch(nearbyHorsesProvider(_radiusKm));

    return Scaffold(
      appBar: AppBar(
        title: Text('Ойрхон морьд', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // ── Radius selector ────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: TamgaSpacing.lg),
            child: Row(
              children: [5.0, 10.0, 25.0, 50.0].map((r) {
                final isSelected = r == _radiusKm;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: TamgaSpacing.xs,
                    ),
                    child: TamgaChoicePill(
                      label: '${r.toStringAsFixed(0)} км',
                      selected: isSelected,
                      onTap: () => setState(() => _radiusKm = r),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: TamgaSpacing.md),

          // ── Horse list ─────────────────────────────────────────
          Expanded(
            child: horsesAsync.when(
              data: (horses) {
                if (horses.isEmpty) {
                  return Center(
                    child: EmptyState(
                      icon: Icons.pets_outlined,
                      title: 'Ойрхон морь байхгүй байна',
                      description:
                          'Одоогоор ойролцоо бүртгэлтэй морь байхгүй байна. '
                          'Эзэд нь байршлаа хуваалцсан тохиолдолд энд харагдана.',
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(
                    TamgaSpacing.lg,
                    TamgaSpacing.xs,
                    TamgaSpacing.lg,
                    TamgaSpacing.lg,
                  ),
                  itemCount: horses.length,
                  itemBuilder: (context, index) {
                    final horse = horses[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: TamgaSpacing.sm),
                      child: _NearbyHorseTile(
                        horse: horse,
                        onTap: () => _openHorseDetail(context, horse),
                      ),
                    );
                  },
                );
              },
              loading: () => SkeletonLoader(
                items: 4,
                itemBuilder: (ctx, i) => const SkeletonCardTile(),
              ),
              error: (e, _) => Center(
                child: TamgaErrorWidget(
                  message: 'Ойролцоо морьд ачаалахад алдаа гарлаа',
                  onRetry: () =>
                      ref.invalidate(nearbyHorsesProvider(_radiusKm)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Opens the lost-horse report for this horse when one exists.
  Future<void> _openHorseDetail(
    BuildContext context,
    HorseLocation horse,
  ) async {
    final result = await ref
        .read(lostHorseRepositoryProvider)
        .browseActiveReports();
    if (!mounted || !context.mounted) return;
    result.when(
      onSuccess: (reports) {
        final report = reports
            .where((r) => r.horseId == horse.horseId)
            .firstOrNull;
        if (report != null) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => LostHorseDetailScreen(report: report),
            ),
          );
        } else {
          TamgaToast.show(
            context,
            '${horse.horseName} — зар байхгүй, байршлаа хуваалцсан',
          );
        }
      },
      onFailure: (error) =>
          TamgaToast.showError(context, friendlyErrorMessage(error)),
    );
  }
}

/// List row for one nearby horse — photo placeholder, identity, live badges.
class _NearbyHorseTile extends StatelessWidget {
  const _NearbyHorseTile({required this.horse, required this.onTap});

  final HorseLocation horse;
  final VoidCallback onTap;

  String _timeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'сая';
    if (diff.inMinutes < 60) return '${diff.inMinutes}м өмнө';
    if (diff.inHours < 24) return '${diff.inHours}ц өмнө';
    return '${diff.inDays}ө өмнө';
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return TamgaCard(
      onTap: onTap,
      padding: TamgaSpacing.listCellPadding,
      child: Row(
        children: [
          // Avatar — green ring signals a live shared location
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: colors.primary, width: 2),
            ),
            child: TamgaAvatar(name: horse.horseName, size: 44),
          ),
          const SizedBox(width: TamgaSpacing.md),

          // Identity
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  horse.horseName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TamgaTypography.body(weight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  horse.ownerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TamgaTypography.caption1(
                    color: colors.onSurfaceVariant,
                  ),
                ),
                if (horse.coatColor != null) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: TamgaSpacing.sm,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: colors.primaryContainer,
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadiusSmall,
                      ),
                    ),
                    child: Text(
                      horse.coatColor!,
                      style: TamgaTypography.caption1(
                        color: colors.onPrimaryContainer,
                        weight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Live indicator + last update
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: colors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: TamgaSpacing.xs),
                  Text(
                    'Шууд',
                    style: TamgaTypography.caption1(
                      color: colors.primary,
                      weight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                _timeAgo(horse.lastUpdated),
                style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(width: TamgaSpacing.sm),
          Icon(Icons.chevron_right, size: 20, color: colors.outline),
        ],
      ),
    );
  }
}
