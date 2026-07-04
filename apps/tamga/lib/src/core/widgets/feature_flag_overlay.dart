import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/feature_flags.dart';
import '../features/feature_flags_providers.dart';

/// Feature flag-уудыг харах, тохируулах overlay panel.
///
/// Dev mode-д л хандах боломжтой. Release build-д хаагдана.
class FeatureFlagOverlay extends ConsumerStatefulWidget {
  const FeatureFlagOverlay({super.key});

  /// Overlay-г нээх туслах функц.
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => const FeatureFlagOverlay(),
    );
  }

  @override
  ConsumerState<FeatureFlagOverlay> createState() => _FeatureFlagOverlayState();
}

class _FeatureFlagOverlayState extends ConsumerState<FeatureFlagOverlay> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            // ── Handle ──
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 4),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // ── Title ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(
                    Icons.flag_outlined,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Feature Flags',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () => _handleResetAll(),
                    icon: const Icon(Icons.restart_alt, size: 16),
                    label: const Text('Бүгдийг reset'),
                    style: TextButton.styleFrom(
                      foregroundColor: theme.colorScheme.error,
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // ── List ──
            Expanded(
              child: ListView.separated(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: ref.watch(allFeatureFlagsProvider).length + 1,
                separatorBuilder: (_, _) =>
                    const Divider(height: 1, indent: 16, endIndent: 16),
                itemBuilder: (context, index) {
                  if (index == 0) return _buildCategoryHeader(theme);
                  return _buildFlagTile(
                    theme,
                    ref.watch(allFeatureFlagsProvider)[index - 1],
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCategoryHeader(ThemeData theme) {
    // Group by category
    final flags = ref.watch(allFeatureFlagsProvider);
    final categories = <FeatureCategory, int>{};
    for (final f in flags) {
      categories[f.category] = (categories[f.category] ?? 0) + 1;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 4,
        children: categories.entries.map((entry) {
          return Chip(
            label: Text(
              '${_categoryLabel(entry.key)} (${entry.value})',
              style: const TextStyle(fontSize: 12),
            ),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFlagTile(ThemeData theme, FeatureFlag flag) {
    final isActive = ref.watch(featureFlagProvider(flag));

    return ListTile(
      dense: true,
      leading: Icon(
        isActive ? Icons.check_circle : Icons.circle_outlined,
        size: 20,
        color: isActive ? Colors.green : theme.colorScheme.onSurfaceVariant,
      ),
      title: Text(
        flag.label,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
      subtitle: Text(flag.description, style: const TextStyle(fontSize: 12)),
      trailing: Switch(
        value: isActive,
        onChanged: (value) => _handleToggle(flag, value),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
    );
  }

  Future<void> _handleToggle(FeatureFlag flag, bool value) async {
    final service = ref.read(featureFlagInitProvider).requireValue;
    await service.setEnabled(flag, value);
    ref.invalidate(featureFlagProvider(flag));
  }

  Future<void> _handleResetAll() async {
    final service = ref.read(featureFlagInitProvider).requireValue;
    await service.resetAll();
    for (final flag in FeatureFlag.all) {
      ref.invalidate(featureFlagProvider(flag));
    }
  }

  String _categoryLabel(FeatureCategory category) {
    switch (category) {
      case FeatureCategory.release:
        return 'Release';
      case FeatureCategory.experimental:
        return 'Туршилт';
      case FeatureCategory.dev:
        return 'Dev';
    }
  }
}
