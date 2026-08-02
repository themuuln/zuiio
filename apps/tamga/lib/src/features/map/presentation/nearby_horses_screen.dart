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

                return GridView.builder(
                  padding: const EdgeInsets.all(TamgaSpacing.lg),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: TamgaSpacing.md,
                    crossAxisSpacing: TamgaSpacing.md,
                    childAspectRatio: 1.2,
                  ),
                  itemCount: horses.length,
                  itemBuilder: (context, index) {
                    final horse = horses[index];
                    return TamgaCard(
                      onTap: () => _openHorseDetail(context, horse),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          TamgaAvatar(
                            name: horse.horseName,
                            size: 48,
                            placeholder: Icons.pets,
                          ),
                          const SizedBox(height: TamgaSpacing.sm),
                          Text(
                            horse.horseName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TamgaTypography.body(
                              weight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            horse.ownerName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TamgaTypography.caption1(
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                        ],
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
        final match = reports
            .where((report) => report.horseId == horse.horseId)
            .firstOrNull;
        if (match == null) {
          TamgaToast.showError(
            context,
            'Энэ морины зар олдсонгүй. Одоогоор идэвхтэй зар байхгүй байна.',
          );
          return;
        }
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => LostHorseDetailScreen(report: match),
          ),
        );
      },
      onFailure: (error) =>
          TamgaToast.showError(context, friendlyErrorMessage(error)),
    );
  }
}
