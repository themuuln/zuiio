import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/nearby_horses_provider.dart';

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
                    child: ChoiceChip(
                      label: Text('${r.toStringAsFixed(0)} км'),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _radiusKm = r),
                      selectedColor: colors.primary,
                      labelStyle: TamgaTypography.caption1(
                        color: isSelected ? colors.onPrimary : colors.onSurface,
                      ),
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
                      description: 'Бусад эзэн нарт харагдах тохиолдолд',
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
                            style: TamgaTypography.body(
                              weight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            horse.ownerName,
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
                  onRetry: () => ref.invalidate(nearbyHorsesProvider(_radiusKm)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
