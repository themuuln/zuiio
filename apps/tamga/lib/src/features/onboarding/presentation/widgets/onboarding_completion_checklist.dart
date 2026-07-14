import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/onboarding_providers.dart';
import '../../domain/onboarding_data.dart';
import '../pages/pedigree_preview_page.dart';
import '../pages/profile_setup_page.dart';

/// Post-onboarding progressive profile checklist.
///
/// Keeps first-run onboarding short while giving users a clear path
/// to enrich their setup after they already experienced value.
class OnboardingCompletionChecklist extends ConsumerWidget {
  const OnboardingCompletionChecklist({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final onboardingAsync = ref.watch(onboardingProvider);

    return onboardingAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (data) {
        if (!data.isCompleted) return const SizedBox.shrink();

        final items = _buildItems(data);
        final completedCount = items.where((item) => item.isDone).length;

        if (completedCount == items.length) {
          return const SizedBox.shrink();
        }

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.checklist_rounded,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Профайлаа гүйцээе',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$completedCount/${items.length} алхам дууссан',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    minHeight: 8,
                    value: completedCount / items.length,
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Анхны үнэ цэнийг та авсан. Одоо үлдсэн тохиргоогоо бага багаар нэмбэл илүү хувийн туршлага авна.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                ...items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _ChecklistTile(item: item),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  List<_ChecklistItem> _buildItems(OnboardingData data) {
    return [
      _ChecklistItem(
        title: 'Анхны зорилгоо харах',
        subtitle: 'Ямар ажлыг түрүүлж хийхээ сануулж, flow-г тааруулна.',
        isDone: data.firstGoal != null,
        ctaLabel: 'Lineage руу',
        icon: Icons.flag_outlined,
        route: '/lineage',
      ),
      _ChecklistItem(
        title: 'Профайлын нэр, бүсээ гүйцээх',
        subtitle: 'Нэр, аймаг, утсаа оруулбал хамтын ажиллагаа амар болно.',
        isDone: data.displayName != null && data.region != null,
        ctaLabel: 'Оруулах',
        icon: Icons.person_outline,
        action: (context, ref, currentData) async {
          await Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => Scaffold(
                appBar: AppBar(title: const Text('Профайлаа гүйцээх')),
                body: ProfileSetupPage(
                  initialDisplayName: currentData.displayName,
                  initialRegion: currentData.region,
                  initialPhone: currentData.phone,
                  onContinue: (displayName, region, phone) async {
                    await ref
                        .read(onboardingProvider.notifier)
                        .updateProfileDetails(
                          displayName: displayName,
                          region: region,
                          phone: phone,
                        );
                    if (context.mounted) {
                      Navigator.of(context).pop();
                    }
                  },
                ),
              ),
            ),
          );
        },
      ),
      _ChecklistItem(
        title: 'Удам судраа нэмэх',
        subtitle: 'Эцэг, эхийн мэдээлэл нь үржүүлэг болон lineage-д хэрэгтэй.',
        isDone: data.sireName != null || data.damName != null,
        ctaLabel: 'Оруулах',
        icon: Icons.account_tree_outlined,
        action: (context, ref, currentData) async {
          await Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => Scaffold(
                appBar: AppBar(title: const Text('Удам судар нэмэх')),
                body: PedigreePreviewPage(
                  horseName: currentData.horseName,
                  hasHorseEntry:
                      currentData.horseName != null &&
                      !currentData.horseEntrySkipped,
                  sireName: currentData.sireName,
                  damName: currentData.damName,
                  onContinue: (sire, dam) async {
                    await ref
                        .read(onboardingProvider.notifier)
                        .updatePedigree(sireName: sire, damName: dam);
                    if (context.mounted) {
                      Navigator.of(context).pop();
                    }
                  },
                  onSkip: () => Navigator.of(context).pop(),
                ),
              ),
            ),
          );
        },
      ),
      _ChecklistItem(
        title: 'Мэдэгдлээ асаах',
        subtitle: 'Вакцин, эмчилгээ, эвентийн сануулгаа алдахгүй.',
        isDone: data.notificationsEnabled,
        ctaLabel: 'Тохиргоо',
        icon: Icons.notifications_outlined,
        route: '/profile/notifications',
      ),
      _ChecklistItem(
        title: 'Анхны морь нэмэх',
        subtitle:
            'Профайл үүсгэвэл health, lineage, reminder бүгд үнэ цэнтэй болно.',
        isDone: data.horseName != null && !data.horseEntrySkipped,
        ctaLabel: 'Морьд руу',
        icon: Icons.pets_outlined,
        route: '/horses',
      ),
    ];
  }
}

class _ChecklistTile extends ConsumerWidget {
  const _ChecklistTile({required this.item});

  final _ChecklistItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final onboardingData = ref.watch(onboardingProvider).valueOrNull;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: item.isDone
            ? theme.colorScheme.tertiaryContainer.withValues(alpha: 0.45)
            : theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: item.isDone
              ? theme.colorScheme.tertiary.withValues(alpha: 0.35)
              : theme.colorScheme.outlineVariant,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: item.isDone
                  ? theme.colorScheme.tertiaryContainer
                  : theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              item.isDone ? Icons.check_circle : item.icon,
              color: item.isDone
                  ? theme.colorScheme.tertiary
                  : theme.colorScheme.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: item.isDone
                      ? Chip(
                          visualDensity: VisualDensity.compact,
                          label: const Text('Дууссан'),
                          avatar: Icon(
                            Icons.verified_rounded,
                            size: 18,
                            color: theme.colorScheme.tertiary,
                          ),
                        )
                      : item.action != null && onboardingData != null
                      ? TextButton.icon(
                          onPressed: () =>
                              item.action!(context, ref, onboardingData),
                          icon: const Icon(Icons.edit_outlined),
                          label: Text(item.ctaLabel),
                        )
                      : item.route != null
                      ? TextButton.icon(
                          onPressed: () => context.push(item.route!),
                          icon: const Icon(Icons.arrow_forward_rounded),
                          label: Text(item.ctaLabel),
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

typedef _ChecklistAction =
    Future<void> Function(
      BuildContext context,
      WidgetRef ref,
      OnboardingData data,
    );

class _ChecklistItem {
  const _ChecklistItem({
    required this.title,
    required this.subtitle,
    required this.isDone,
    required this.ctaLabel,
    required this.icon,
    this.route,
    this.action,
  });

  final String title;
  final String subtitle;
  final bool isDone;
  final String ctaLabel;
  final IconData icon;
  final String? route;
  final _ChecklistAction? action;
}
