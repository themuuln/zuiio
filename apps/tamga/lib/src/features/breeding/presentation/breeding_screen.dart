import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../application/breeding_providers.dart';
import '../data/gestation_calculator.dart';
import '../domain/breeding_record.dart';
import 'widgets/gestation_tracker.dart';
import 'breeding_creator_sheet.dart';
import 'foal_registration_sheet.dart';

class BreedingScreen extends ConsumerWidget {
  const BreedingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final breedingRecords = ref.watch(breedingRecordsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openBreedingCreator(context, ref),
        icon: const Icon(Icons.add_circle_outline),
        label: const Text('Хээлтүүлэг бүртгэх'),
      ),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList.list(
              children: [
                // Header card
                Card(
                  color: theme.colorScheme.primaryContainer.withValues(
                    alpha: 0.2,
                  ),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(
                      color: theme.colorScheme.primaryContainer,
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Хээлтүүлэг & Үржүүлэг',
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Адуун сүргийн хээлтүүлэг, төллөх хугацаа (gestation tracking) болон унаганы бүртгэлийг хөтлөх хэсэг.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Breeding records list
                breedingRecords.when(
                  data: (records) {
                    if (records.isEmpty) {
                      return const EmptyState(
                        icon: Icons.pets_outlined,
                        title: 'Хээлтүүлгийн бүртгэл байхгүй',
                        description: 'Хээлтүүлгийн бүртгэл одоогоор байхгүй байна.',
                      );
                    }

                    return Column(
                      children: [
                        for (final record in records) ...[
                          _BreedingRecordCard(record: record),
                          const SizedBox(height: AppSpacing.md),
                        ],
                      ],
                    );
                  },
                  loading: () => SkeletonLoader(
                    items: 3,
                    itemBuilder: (ctx, i) => const SkeletonCard(height: 200),
                  ),
                  error: (error, _) => TamgaErrorWidget(
                    message: 'Хээлтүүлгийн бүртгэл ачаалахад алдаа гарлаа',
                    onRetry: () => ref.invalidate(breedingRecordsProvider),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openBreedingCreator(BuildContext context, WidgetRef ref) async {
    final horsesAsync = ref.read(horsesProvider);
    final horses = horsesAsync.valueOrNull ?? [];

    if (horses.isEmpty) {
      if (context.mounted) {
        TamgaToast.show(
          context,
          'Хээлтүүлэг бүртгэхийн тулд эхлээд морьд бүртгэнэ үү.',
        );
      }
      return;
    }

    final result = await showModalBottomSheet<BreedingRecord>(
      context: context,
      isScrollControlled: true,
      builder: (context) => BreedingCreatorSheet(horses: horses),
    );

    if (result == null) return;

    final repo = await ref.read(breedingRepositoryProvider.future);
    final saveResult = await repo.saveBreedingRecord(result);
    saveResult.when(
      onSuccess: (_) => ref.invalidate(breedingRecordsProvider),
      onFailure: (error) {
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Хээлтүүлэг хадгалахад алдаа гарлаа: ${error.message}',
          );
        }
      },
    );
  }
}

// ── Туслах дүрсүүд ──────────────────────────────────────────────────

class _BreedingRecordCard extends ConsumerWidget {
  const _BreedingRecordCard({required this.record});

  final BreedingRecord record;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final statusCategory = record.statusCategory;

    // Төлөвийн өнгө
    final statusColor = switch (statusCategory) {
      GestationStatusCategory.healthy => colorScheme.primary,
      GestationStatusCategory.approaching => TamgaColors.of(context).primary,
      GestationStatusCategory.overdue => colorScheme.error,
      GestationStatusCategory.foaled => Colors.green,
      GestationStatusCategory.aborted => colorScheme.outline,
    };

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(color: colorScheme.outlineVariant, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // нэр болон төлөв
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${record.damName} × ${record.sireName}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Сүрэг: ${record.herdLabel}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusPill,
                    ),
                    border: Border.all(color: statusColor, width: 1.5),
                  ),
                  child: Text(
                    record.status,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: AppSpacing.xxl),

            // Хээлтүүлгийн огноо
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Хээлтсэн огноо',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.outline,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      GestationCalculator.formatDate(record.breedingDate),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                if (record.statusCategory != GestationStatusCategory.aborted)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Төллөх хугацаа',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: colorScheme.outline,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        GestationCalculator.formatDate(
                          record.expectedFoalingDate,
                        ),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // Progress bar
            if (record.statusCategory != GestationStatusCategory.aborted)
              GestationTrackerWidget(record: record),

            const SizedBox(height: AppSpacing.lg),

            // Үйлдлүүд
            Row(
              children: [
                if (record.statusCategory == GestationStatusCategory.foaled)
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _registerFoal(context, ref),
                      icon: const Icon(Icons.child_care),
                      label: const Text('Унага бүртгэх'),
                    ),
                  ),
                if (record.statusCategory == GestationStatusCategory.aborted)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _deleteRecord(context, ref),
                      icon: const Icon(Icons.delete_outline),
                      label: const Text('Устгах'),
                    ),
                  ),
              ],
            ),

            // Тэмдэглэл
            if (record.notes.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(
                    AppSpacing.cornerRadiusSmall,
                  ),
                ),
                child: Text(
                  record.notes,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _registerFoal(BuildContext context, WidgetRef ref) async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => FoalRegistrationSheet(
        sireName: record.sireName,
        damName: record.damName,
      ),
    );

    if (result != null && context.mounted) {
      // Төлбөрийг шинэчлэх
      final updated = record.copyWith(
        status: 'Төлсөн',
        notes: '${record.notes}\n\nУнага: ${result['name']}',
      );
      final repo = await ref.read(breedingRepositoryProvider.future);
      final saveResult = await repo.saveBreedingRecord(updated);
      saveResult.when(
        onSuccess: (_) => ref.invalidate(breedingRecordsProvider),
        onFailure: (error) {
          if (context.mounted) {
            TamgaToast.showError(
              context,
              'Унага бүртгэхэд алдаа гарлаа: ${error.message}',
            );
          }
        },
      );
    }
  }

  Future<void> _deleteRecord(BuildContext context, WidgetRef ref) async {
    // Тэмдэглэлийг устгах (төлөвийг өөрчлөх)
    final updated = record.copyWith(status: 'Цуцалсан');
    final repo = await ref.read(breedingRepositoryProvider.future);
    final saveResult = await repo.saveBreedingRecord(updated);
    saveResult.when(
      onSuccess: (_) => ref.invalidate(breedingRecordsProvider),
      onFailure: (error) {
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Устгахад алдаа гарлаа: ${error.message}',
          );
        }
      },
    );
  }
}

// ── Хувь нэмэрчид ──────────────────────────────────────────────────

/// Морийг ID-аар нь олох.
HorseRecord? findHorseById(List<HorseRecord> horses, String id) {
  for (final horse in horses) {
    if (horse.id == id) return horse;
  }
  return null;
}
