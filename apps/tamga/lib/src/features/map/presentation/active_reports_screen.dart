import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/horse_coat_colors.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/lost_horse_filters.dart';
import '../application/lost_horse_providers.dart';
import '../application/map_providers.dart';
import '../domain/animal_enums.dart';
import '../domain/map_enums.dart';
import 'widgets/lost_horse_card.dart';

/// List of active lost horse reports with filter controls.
///
/// Filters: Аймаг, animal type, coat color, status.
/// Filters combine with AND logic. Sorted by recency (newest first).
class ActiveReportsScreen extends ConsumerWidget {
  const ActiveReportsScreen({super.key, this.showAppBar = true});

  final bool showAppBar;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(lostHorseFilterProvider);
    final reportsAsync = ref.watch(filteredActiveLostHorsesProvider);
    final currentPos = ref.watch(currentPositionProvider).valueOrNull;

    final body = Column(
      children: [
        // ── Filter bar ──
        _FilterBar(filter: filter, ref: ref),
        // ── Reports list / empty state ──
        Expanded(
          child: reportsAsync.when(
            data: (reports) {
              if (reports.isEmpty) {
                return filter.hasAnyFilter
                    ? _EmptyFilterResult(ref: ref)
                    : Center(
                        child: EmptyState(
                          icon: Icons.pets_outlined,
                          title: 'Хаяж морь байхгүй байна',
                          description: 'Одоогоор хаяж морийн мэдээлэл байхгүй',
                        ),
                      );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(activeLostHorsesProvider);
                  ref.invalidate(activeLostHorsesStreamProvider);
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(TamgaSpacing.lg),
                  itemCount: reports.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: TamgaSpacing.md),
                  itemBuilder: (context, index) {
                    final report = reports[index];
                    final distanceKm = currentPos == null
                        ? null
                        : report.distanceTo(
                                currentPos.latitude,
                                currentPos.longitude,
                              ) /
                              1000;
                    return LostHorseCard(
                      report: report,
                      distanceKm: distanceKm,
                    );
                  },
                ),
              );
            },
            loading: () => SkeletonLoader(
              items: 4,
              itemBuilder: (ctx, i) => const SkeletonCardTile(),
            ),
            error: (e, _) => Center(
              child: TamgaErrorWidget(
                message: 'Мэдээлэл ачаалахад алдаа гарлаа',
                onRetry: () {
                  ref.invalidate(activeLostHorsesProvider);
                  ref.invalidate(activeLostHorsesStreamProvider);
                },
              ),
            ),
          ),
        ),
      ],
    );

    if (!showAppBar) return body;

    return Scaffold(
      appBar: AppBar(
        title: Text('Хаяж морьд', style: TamgaTypography.headline()),
        backgroundColor: TamgaColors.of(context).surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: body,
    );
  }
}

// ── Filter Bar ─────────────────────────────────────────────────────────

/// Horizontal scrollable row of filter chips.
class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.filter, required this.ref});

  final LostHorseFilterState filter;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border(bottom: BorderSide(color: colors.outline.withAlpha(60))),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: TamgaSpacing.md,
        vertical: TamgaSpacing.sm,
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip(
              context: context,
              label: filter.aimag ?? 'Аймаг',
              isActive: filter.aimag != null,
              onTap: () => _showAimagPicker(context),
              onClear: filter.aimag != null
                  ? () => ref
                        .read(lostHorseFilterProvider.notifier)
                        .setAimag(null)
                  : null,
            ),
            const SizedBox(width: TamgaSpacing.sm),
            _buildFilterChip(
              context: context,
              label: filter.animalType?.displayName ?? 'Төрөл',
              isActive: filter.animalType != null,
              onTap: () => _showAnimalTypePicker(context),
              onClear: filter.animalType != null
                  ? () => ref
                        .read(lostHorseFilterProvider.notifier)
                        .setAnimalType(null)
                  : null,
            ),
            const SizedBox(width: TamgaSpacing.sm),
            _buildFilterChip(
              context: context,
              label: filter.coatColor ?? 'Зүс',
              isActive: filter.coatColor != null,
              onTap: () => _showCoatColorPicker(context),
              onClear: filter.coatColor != null
                  ? () => ref
                        .read(lostHorseFilterProvider.notifier)
                        .setCoatColor(null)
                  : null,
            ),
            const SizedBox(width: TamgaSpacing.sm),
            _buildFilterChip(
              context: context,
              label: filter.status?.label ?? 'Статус',
              isActive: filter.status != null,
              onTap: () => _showStatusPicker(context),
              onClear: filter.status != null
                  ? () => ref
                        .read(lostHorseFilterProvider.notifier)
                        .setStatus(null)
                  : null,
            ),
            if (filter.hasAnyFilter) ...[
              const SizedBox(width: TamgaSpacing.sm),
              _buildClearAllButton(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip({
    required BuildContext context,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    VoidCallback? onClear,
  }) {
    final colors = TamgaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: TamgaSpacing.md,
            vertical: TamgaSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: isActive
                ? colors.primaryContainer
                : colors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isActive
                  ? colors.primary.withAlpha(80)
                  : colors.outline.withAlpha(60),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TamgaTypography.caption1(
                  color: isActive
                      ? colors.onPrimaryContainer
                      : colors.onSurfaceVariant,
                  weight: isActive ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                isActive ? Icons.check_circle : Icons.expand_more,
                size: 16,
                color: isActive ? colors.primary : colors.onSurfaceVariant,
              ),
              if (onClear != null) ...[
                const SizedBox(width: 2),
                GestureDetector(
                  onTap: onClear,
                  child: Icon(
                    Icons.close,
                    size: 14,
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildClearAllButton(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => ref.read(lostHorseFilterProvider.notifier).clearAll(),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: TamgaSpacing.md,
            vertical: TamgaSpacing.xs,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colors.error.withAlpha(100)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.clear_all, size: 16, color: colors.error),
              const SizedBox(width: 4),
              Text(
                'Бүгд',
                style: TamgaTypography.caption1(
                  color: colors.error,
                  weight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Filter picker sheets ──

  void _showAimagPicker(BuildContext context) {
    _showPickerSheet<String?>(
      context: context,
      title: 'Аймаг',
      currentValue: filter.aimag,
      items: [null, ...kAimags],
      itemLabel: (item) => item ?? 'Бүгд',
      onSelected: (item) {
        ref.read(lostHorseFilterProvider.notifier).setAimag(item);
      },
    );
  }

  void _showAnimalTypePicker(BuildContext context) {
    _showPickerSheet<AnimalType?>(
      context: context,
      title: 'Малын төрөл',
      currentValue: filter.animalType,
      items: [null, ...AnimalType.values],
      itemLabel: (item) => item?.displayName ?? 'Бүгд',
      onSelected: (item) {
        ref.read(lostHorseFilterProvider.notifier).setAnimalType(item);
      },
    );
  }

  void _showCoatColorPicker(BuildContext context) {
    _showPickerSheet<String?>(
      context: context,
      title: 'Зүс',
      currentValue: filter.coatColor,
      items: [null, ...horseCoatColors],
      itemLabel: (item) => item ?? 'Бүгд',
      onSelected: (item) {
        ref.read(lostHorseFilterProvider.notifier).setCoatColor(item);
      },
    );
  }

  void _showStatusPicker(BuildContext context) {
    _showPickerSheet<LostHorseStatus?>(
      context: context,
      title: 'Статус',
      currentValue: filter.status,
      items: [null, ...LostHorseStatus.values],
      itemLabel: (item) => item?.label ?? 'Бүгд',
      onSelected: (item) {
        ref.read(lostHorseFilterProvider.notifier).setStatus(item);
      },
    );
  }

  void _showPickerSheet<T>({
    required BuildContext context,
    required String title,
    required T currentValue,
    required List<T> items,
    required String Function(T) itemLabel,
    required ValueChanged<T> onSelected,
  }) {
    final colors = TamgaColors.of(context);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 8),
                width: 32,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.onSurfaceVariant.withAlpha(80),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Title
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TamgaTypography.title3(color: colors.onSurface),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Options list
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: items.length,
                  itemBuilder: (ctx, index) {
                    final item = items[index];
                    final isSelected = item == currentValue;

                    return InkWell(
                      onTap: () {
                        onSelected(item);
                        Navigator.of(sheetContext).pop();
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                itemLabel(item),
                                style: TamgaTypography.body(
                                  color: isSelected
                                      ? colors.primary
                                      : colors.onSurface,
                                  weight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check,
                                size: 20,
                                color: colors.primary,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── Empty Filter Result ────────────────────────────────────────────────

/// Shown when filters are active but no reports match.
class _EmptyFilterResult extends StatelessWidget {
  const _EmptyFilterResult({required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: EmptyState(
        icon: Icons.search_off_rounded,
        title: 'Илэрц олдсонгүй',
        description: 'Шүүлтүүрт тохирох хаяж морийн мэдээлэл байхгүй байна.',
        actionLabel: 'Шүүлтүүр арилгах',
        onAction: () => ref.read(lostHorseFilterProvider.notifier).clearAll(),
      ),
    );
  }
}
