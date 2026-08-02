/// Морины удмын шугам модон хэлбэр.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../application/pedigree_layout.dart';
import 'full_screen_tree_page.dart';
import 'pedigree_tree_view.dart';

/// Модон хэлбэр харуулах хэсэг.
class LineageTreeSection extends StatelessWidget {
  const LineageTreeSection({
    required this.treeLayout,
    required this.selectedNode,
    required this.selectedNodeId,
    required this.onNodeTap,
    this.hasMoreAncestors = false,
    this.hasMoreDescendants = false,
    this.onLoadMoreAncestors,
    this.onLoadMoreDescendants,
    super.key,
  });

  /// Модон хэлбэрийн тооцоо.
  final PedigreeLayoutResult? treeLayout;

  /// Сонгосон зангилаа.
  final PedigreeNodeVm? selectedNode;

  /// Сонгосон зангилааны ID.
  final String? selectedNodeId;

  /// Зангилаа дээр дарсан үед.
  final ValueChanged<PedigreeNodeVm> onNodeTap;

  /// Whether there are more ancestor generations beyond the currently
  /// displayed range. When true, a "load more" prompt is shown above the tree.
  final bool hasMoreAncestors;

  /// Whether there are more descendant generations beyond the currently
  /// displayed range. When true, a "load more" prompt is shown below the tree.
  final bool hasMoreDescendants;

  /// Called when the user taps "load more ancestors".
  final VoidCallback? onLoadMoreAncestors;

  /// Called when the user taps "load more descendants".
  final VoidCallback? onLoadMoreDescendants;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeNode = selectedNode;

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.65),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Удмын мод', style: theme.textTheme.titleLarge),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            'Хуруугаараа томруулж, чирж байрлуулаад, зангилааг сонгоно.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    IconButton(
                      onPressed: treeLayout == null
                          ? null
                          : () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => FullScreenTreePage(
                                    layout: treeLayout!,
                                    selectedNodeId: selectedNodeId,
                                    onNodeTap: onNodeTap,
                                  ),
                                ),
                              );
                            },
                      icon: const Icon(Icons.fullscreen_rounded, size: 20),
                      tooltip: 'Бүтэн дэлгэцээр харах',
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                // ── Load more ancestors prompt ──
                if (treeLayout != null && hasMoreAncestors)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _LoadMorePrompt(
                      label: 'Өвөг дээдсийг харах',
                      onTap: onLoadMoreAncestors,
                    ),
                  ),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final viewportHeight = MediaQuery.of(context).size.height;
                    final targetHeight = (viewportHeight * 0.55).clamp(
                      380.0,
                      700.0,
                    );
                    return SizedBox(
                      height: targetHeight,
                      child: treeLayout == null
                          ? const Center(child: CircularProgressIndicator())
                          : PedigreeTreeView(
                              layout: treeLayout!,
                              selectedNodeId: selectedNodeId,
                              onNodeTap: onNodeTap,
                            ),
                    );
                  },
                ),
                // ── Load more descendants prompt ──
                if (treeLayout != null && hasMoreDescendants)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.sm),
                    child: _LoadMorePrompt(
                      label: 'Үр удмыг харах',
                      onTap: onLoadMoreDescendants,
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.08),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
              child: child,
            ),
          ),
          child: activeNode != null
              ? SelectedNodeCard(key: ValueKey(activeNode.id), node: activeNode)
              : const SizedBox.shrink(),
        ),
      ],
    );
  }
}

/// Ачаалах товч — илүү үеийн мэдээллийг харуулах.
class _LoadMorePrompt extends StatelessWidget {
  const _LoadMorePrompt({required this.label, required this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: onTap,
        icon: Icon(
          Icons.unfold_more_rounded,
          size: 18,
          color: colorScheme.primary,
        ),
        label: Text(
          label,
          style: theme.textTheme.labelMedium?.copyWith(
            color: colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: TextButton.styleFrom(
          backgroundColor: colorScheme.primaryContainer.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}

/// Сонгосон морины мэдээлэл.
class SelectedNodeCard extends StatelessWidget {
  const SelectedNodeCard({required this.node, super.key});

  /// Сонгосон зангилаа.
  final PedigreeNodeVm node;

  bool get _isStallion => node.sex == 'stallion';
  bool get _isMare => node.sex == 'mare';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.65),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──
            Row(
              children: [
                // Аватар
                if (node.photoUrl != null && node.photoUrl!.isNotEmpty)
                  CircleAvatar(
                    radius: 22,
                    backgroundImage: NetworkImage(node.photoUrl!),
                  )
                else
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: _isStallion
                        ? colorScheme.primaryContainer
                        : _isMare
                        ? colorScheme.tertiaryContainer
                        : colorScheme.surfaceContainerHighest,
                    child: Icon(
                      _isStallion
                          ? Icons.male
                          : _isMare
                          ? Icons.female
                          : Icons.pets_outlined,
                      color: colorScheme.primary,
                      size: 22,
                    ),
                  ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        node.name,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '${node.relationLabel} • ${node.coat} • ${node.birthYear}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                _OwnedBadge(isOwnedByHousehold: node.isOwnedByHousehold),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Stat chips ──
            Row(
              children: [
                _StatChip(label: 'Шагнал', value: '${node.awardCount}'),
                const SizedBox(width: AppSpacing.sm),
                _StatChip(label: 'Үр төл', value: '${node.offspringCount}'),
                if (node.tamgaNo != null) ...[
                  const SizedBox(width: AppSpacing.sm),
                  _StatChip(label: 'Тамга', value: node.tamgaNo!),
                ],
                if (node.speedIndex != null) ...[
                  const SizedBox(width: AppSpacing.sm),
                  _StatChip(
                    label: 'Хурд',
                    value: '${node.speedIndex!.toStringAsFixed(1)} км/мин',
                  ),
                ],
              ],
            ),

            // ── Extra info ──
            if (node.hiddenBranchCount > 0 || node.region != null) ...[
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  if (node.hiddenBranchCount > 0)
                    _InfoChip(
                      label: 'Нуусан салаа',
                      value: '+${node.hiddenBranchCount}',
                    ),
                  if (node.region != null)
                    _InfoChip(label: 'Нутаг', value: node.region!),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Эзэмшигчийн тэмдэг.
class _OwnedBadge extends StatelessWidget {
  const _OwnedBadge({required this.isOwnedByHousehold});

  final bool isOwnedByHousehold;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: isOwnedByHousehold
            ? colorScheme.primaryContainer.withValues(alpha: 0.72)
            : colorScheme.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isOwnedByHousehold
              ? colorScheme.primary.withValues(alpha: 0.35)
              : colorScheme.outlineVariant.withValues(alpha: 0.65),
        ),
      ),
      child: Text(
        isOwnedByHousehold ? 'Өрхийн' : 'Гаднах',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: isOwnedByHousehold
              ? colorScheme.onPrimaryContainer
              : colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

/// Стат чип (label дээр, value доор).
class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: colorScheme.outlineVariant.withValues(alpha: 0.55),
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Мэдээллийн чип.
class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.55),
        ),
      ),
      child: Text(
        '$label: $value',
        style: Theme.of(context).textTheme.labelMedium,
      ),
    );
  }
}
