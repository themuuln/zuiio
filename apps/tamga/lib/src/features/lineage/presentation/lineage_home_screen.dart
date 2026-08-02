import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../payments/presentation/widgets/paywall_widget.dart';
import '../../payments/domain/payment_request.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/horse.dart';
import '../../events/application/events_providers.dart';
import '../../events/presentation/widgets/event_card.dart';
import '../application/lineage_roots_provider.dart';
import '../application/pedigree_layout.dart';
import '../domain/lineage_snapshot.dart';
import '../domain/lineage_tree_node.dart';
import 'lineage_tree_section.dart';
import 'staggered_fade_in.dart';

class LineageHomeScreen extends ConsumerWidget {
  const LineageHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final baseTheme = Theme.of(context);
    final systemTextTheme = AppTypography.textTheme().apply(
      bodyColor: baseTheme.colorScheme.onSurface,
      displayColor: baseTheme.colorScheme.onSurface,
    );
    final theme = baseTheme.copyWith(
      textTheme: systemTextTheme,
      primaryTextTheme: systemTextTheme,
    );
    final roots = ref.watch(lineageRootsProvider);
    final selectedSnapshot = ref.watch(lineageSnapshotProvider);
    final selectedRootId = ref.watch(selectedLineageRootIdProvider);
    final homeView = ref.watch(lineageHomeViewProvider);
    final treeDepth = ref.watch(lineageTreeDepthProvider);
    final treeLayout = ref.watch(pedigreeLayoutProvider);
    final selectedNode = ref.watch(selectedPedigreeNodeProvider);

    return Theme(
      data: theme,
      child: CustomScrollView(
        slivers: [
          // ── Minimal header ──
          TamgaSliverHeader(
            title: 'Угшил',
            subtitle: 'Удам угсаа ба холбоо',
            actions: [
              IconButton(
                onPressed: () => context.go('/lineage/coi'),
                icon: const Icon(Icons.calculate_outlined, size: 20),
                tooltip: 'Цус ойртолтын тооцоолуур',
              ),
            ],
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              0,
              AppSpacing.lg,
              AppSpacing.xxl,
            ),
            sliver: SliverList.list(
              children: [
                // ── Root selector ──
                StaggeredFadeIn(
                  index: 0,
                  child: roots.when(
                    data: (items) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Удам угсааны шугам',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          SizedBox(
                            height: 44,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: items.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(width: AppSpacing.sm),
                              itemBuilder: (ctx, index) {
                                final root = items[index];
                                final isSelected = root.id == selectedRootId;
                                return GestureDetector(
                                  behavior: HitTestBehavior.opaque,
                                  onTap: () {
                                    ref
                                            .read(
                                              selectedPedigreeNodeIdProvider
                                                  .notifier,
                                            )
                                            .state =
                                        root.id;
                                    ref
                                        .read(lineageHomeViewProvider.notifier)
                                        .state = LineageHomeView
                                        .tree;
                                    ref
                                            .read(
                                              selectedLineageRootIdProvider
                                                  .notifier,
                                            )
                                            .state =
                                        root.id;
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.md,
                                      vertical: AppSpacing.sm,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? theme.colorScheme.primaryContainer
                                          : theme
                                                .colorScheme
                                                .surfaceContainerLowest,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSelected
                                            ? theme.colorScheme.primary
                                                  .withValues(alpha: 0.45)
                                            : theme.colorScheme.outlineVariant
                                                  .withValues(alpha: 0.7),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.account_tree_rounded,
                                          size: 16,
                                          color: isSelected
                                              ? theme
                                                    .colorScheme
                                                    .onPrimaryContainer
                                              : theme
                                                    .colorScheme
                                                    .onSurfaceVariant,
                                        ),
                                        const SizedBox(width: AppSpacing.sm),
                                        Text(
                                          root.name,
                                          style: theme.textTheme.labelLarge
                                              ?.copyWith(
                                                color: isSelected
                                                    ? theme
                                                          .colorScheme
                                                          .onPrimaryContainer
                                                    : theme
                                                          .colorScheme
                                                          .onSurface,
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      );
                    },
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
                      child: SkeletonLoader(
                        items: 3,
                        itemBuilder: _rootChipSkeletonBuilder,
                      ),
                    ),
                    error: (error, _) => Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.xxl,
                      ),
                      child: TamgaErrorWidget(
                        message: 'Удам угсааны мэдээлэл ачаалахад алдаа гарлаа',
                        onRetry: () => ref.invalidate(lineageRootsProvider),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: AppSpacing.lg),

                // ── View tabs (minimal) ──
                StaggeredFadeIn(
                  index: 1,
                  child: _MinimalViewTabs(
                    selected: homeView,
                    onSelect: (view) {
                      ref.read(lineageHomeViewProvider.notifier).state = view;
                    },
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                // ── Featured events section ──
                _FeaturedEventsSection(),

                const SizedBox(height: AppSpacing.xxl),

                // ── Active content ──
                selectedSnapshot.when(
                  data: (snapshot) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      StaggeredFadeIn(
                        index: 0,
                        child: _RootOverview(snapshot: snapshot),
                      ),

                      const SizedBox(height: AppSpacing.xxl),

                      // ── Depth selector (for tree view) ──
                      if (homeView == LineageHomeView.tree) ...[
                        StaggeredFadeIn(
                          index: 4,
                          child: _DepthSelector(
                            selectedDepth: treeDepth,
                            onDepthSelected: (depth) {
                              ref
                                      .read(lineageTreeDepthProvider.notifier)
                                      .state =
                                  depth;
                            },
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                      ],

                      // ── Content ──
                      StaggeredFadeIn(
                        index: 5,
                        child: _ActiveContent(
                          snapshot: snapshot,
                          selectedView: homeView,
                          treeLayout: treeLayout,
                          selectedNode: selectedNode,
                          selectedNodeId: selectedNode?.id ?? selectedRootId,
                          onNodeTap: (node) {
                            ref
                                .read(selectedPedigreeNodeIdProvider.notifier)
                                .state = node
                                .id;
                          },
                          treeDepth: treeDepth,
                          onLoadMoreAncestors:
                              treeDepth != LineageTreeDepth.full
                              ? () {
                                  ref
                                      .read(lineageTreeDepthProvider.notifier)
                                      .state = _nextDepth(
                                    treeDepth,
                                  );
                                }
                              : null,
                          onLoadMoreDescendants:
                              treeDepth != LineageTreeDepth.full
                              ? () {
                                  ref
                                      .read(lineageTreeDepthProvider.notifier)
                                      .state = _nextDepth(
                                    treeDepth,
                                  );
                                }
                              : null,
                        ),
                      ),
                    ],
                  ),
                  loading: () => const SkeletonLoader(
                    items: 3,
                    itemBuilder: _snapshotSkeletonBuilder,
                  ),
                  error: (error, _) => Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.xxl,
                    ),
                    child: TamgaErrorWidget(
                      message: 'Удам угсааны мэдээлэл ачаалахад алдаа гарлаа',
                      onRetry: () => ref.invalidate(lineageSnapshotProvider),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Minimal view tabs ──
class _MinimalViewTabs extends StatelessWidget {
  const _MinimalViewTabs({required this.selected, required this.onSelect});

  final LineageHomeView selected;
  final ValueChanged<LineageHomeView> onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xs),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.7),
        ),
      ),
      child: Row(
        children: [
          for (final view in LineageHomeView.values)
            Expanded(
              child: Semantics(
                button: true,
                selected: selected == view,
                label: _viewLabel(view),
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onSelect(view),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOut,
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.xs,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      color: selected == view
                          ? theme.colorScheme.primaryContainer
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _viewIcon(view),
                          size: 16,
                          color: selected == view
                              ? theme.colorScheme.onPrimaryContainer
                              : theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.center,
                            child: Text(
                              _viewLabel(view),
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: selected == view
                                    ? theme.colorScheme.onPrimaryContainer
                                    : theme.colorScheme.onSurfaceVariant,
                                fontWeight: selected == view
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

String _viewLabel(LineageHomeView view) {
  return switch (view) {
    LineageHomeView.tree => 'Мод',
    LineageHomeView.list => 'Жагсаалт',
    LineageHomeView.timeline => 'Цагийн шугам',
  };
}

IconData _viewIcon(LineageHomeView view) {
  return switch (view) {
    LineageHomeView.tree => Icons.account_tree_rounded,
    LineageHomeView.list => Icons.view_list_rounded,
    LineageHomeView.timeline => Icons.timeline_rounded,
  };
}

// ── Selected root overview ──
class _RootOverview extends StatelessWidget {
  const _RootOverview({required this.snapshot});

  final LineageSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final root = snapshot.root;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.65),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.account_tree_rounded,
                  color: theme.colorScheme.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      root.name,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      '${root.coat} • ${root.birthYear}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (root.notes.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              root.notes,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                height: 1.5,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          Divider(
            height: 1,
            thickness: 0.5,
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.65),
          ),
          const SizedBox(height: AppSpacing.md),
          _StatsRow(
            offspring: root.offspringCount,
            awards: root.awardCount,
            nodes: snapshot.treeNodes.length,
          ),
        ],
      ),
    );
  }
}

// ── Stats row ──
class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.offspring,
    required this.awards,
    required this.nodes,
  });

  final int offspring;
  final int awards;
  final int nodes;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _Stat(label: 'Үр төл', value: offspring),
        ),
        const _StatDivider(),
        Expanded(
          child: _Stat(label: 'Шагнал', value: awards),
        ),
        const _StatDivider(),
        Expanded(
          child: _Stat(label: 'Зангилаа', value: nodes),
        ),
      ],
    );
  }
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 32,
      color: Theme.of(context).colorScheme.outlineVariant,
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Text(
          '$value',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          label,
          style: theme.textTheme.labelMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ── Depth selector ──
class _DepthSelector extends ConsumerWidget {
  const _DepthSelector({
    required this.selectedDepth,
    required this.onDepthSelected,
  });

  final LineageTreeDepth selectedDepth;
  final ValueChanged<LineageTreeDepth> onDepthSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final limits = ref.watch(tierLimitsProvider);
    final maxGen = limits.maxPedigreeGenerations;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Харах үе',
          style: theme.textTheme.labelMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: LineageTreeDepth.values.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
            itemBuilder: (ctx, index) {
              final depth = LineageTreeDepth.values[index];
              final isSelected = depth == selectedDepth;
              final isLocked = _isDepthLocked(depth, maxGen);

              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  if (isLocked) {
                    PaywallWidget.show(
                      context,
                      denied: GateDenied(
                        reason:
                            'Үнэгүй түвшинд ${maxGen ?? "бүгд"} үе хүртэл харах боломжтой.',
                        requiredTier: SubscriptionTier.pro,
                      ),
                    );
                    return;
                  }
                  onDepthSelected(depth);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  curve: Curves.easeOut,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? theme.colorScheme.primaryContainer
                        : theme.colorScheme.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? theme.colorScheme.primary.withValues(alpha: 0.45)
                          : theme.colorScheme.outlineVariant.withValues(
                              alpha: 0.7,
                            ),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        depth.label,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: isSelected
                              ? theme.colorScheme.onPrimaryContainer
                              : theme.colorScheme.onSurfaceVariant,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                      if (isLocked) ...[
                        const SizedBox(width: AppSpacing.xs),
                        Icon(
                          Icons.lock_outline,
                          size: 12,
                          color: isSelected
                              ? theme.colorScheme.onPrimaryContainer
                              : theme.colorScheme.onSurfaceVariant,
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  bool _isDepthLocked(LineageTreeDepth depth, int? maxGen) {
    if (maxGen == null) return false;
    final depthGen = depth.maxGeneration;
    if (depthGen == null) return false;
    return depthGen > maxGen;
  }
}

// ── Active content ──
class _ActiveContent extends StatelessWidget {
  const _ActiveContent({
    required this.snapshot,
    required this.selectedView,
    required this.treeLayout,
    required this.selectedNode,
    required this.selectedNodeId,
    required this.onNodeTap,
    this.treeDepth,
    this.onLoadMoreAncestors,
    this.onLoadMoreDescendants,
  });

  final LineageSnapshot snapshot;
  final LineageHomeView selectedView;
  final PedigreeLayoutResult? treeLayout;
  final PedigreeNodeVm? selectedNode;
  final String? selectedNodeId;
  final ValueChanged<PedigreeNodeVm> onNodeTap;
  final LineageTreeDepth? treeDepth;
  final VoidCallback? onLoadMoreAncestors;
  final VoidCallback? onLoadMoreDescendants;

  @override
  Widget build(BuildContext context) {
    // Determine if there are hidden generations beyond the current depth.
    final hasMoreAncestors = _hasMoreHiddenGenerations(
      snapshot.treeNodes,
      treeDepth?.maxGeneration,
      isAncestor: true,
    );
    final hasMoreDescendants = _hasMoreHiddenGenerations(
      snapshot.treeNodes,
      treeDepth?.maxGeneration,
      isAncestor: false,
    );

    return switch (selectedView) {
      LineageHomeView.tree => LineageTreeSection(
        treeLayout: treeLayout,
        selectedNode: selectedNode,
        selectedNodeId: selectedNodeId,
        onNodeTap: onNodeTap,
        hasMoreAncestors: hasMoreAncestors,
        hasMoreDescendants: hasMoreDescendants,
        onLoadMoreAncestors: onLoadMoreAncestors,
        onLoadMoreDescendants: onLoadMoreDescendants,
      ),
      LineageHomeView.list => _RelatedHorsesList(
        horses: snapshot.relatedHorses,
      ),
      LineageHomeView.timeline => _TimelineList(snapshot: snapshot),
    };
  }
}

/// Returns true if there are tree nodes whose generation falls outside
/// the current [maxGeneration] range.
bool _hasMoreHiddenGenerations(
  List<LineageTreeNode> nodes,
  int? maxGeneration, {
  required bool isAncestor,
}) {
  if (maxGeneration == null) return false; // Already showing everything.
  for (final node in nodes) {
    if (isAncestor &&
        node.generation < 0 &&
        node.generation.abs() > maxGeneration) {
      return true;
    }
    if (!isAncestor && node.generation > 0 && node.generation > maxGeneration) {
      return true;
    }
  }
  return false;
}

/// Returns the next depth level. 3 → 5, 5 → full.
LineageTreeDepth _nextDepth(LineageTreeDepth current) {
  return switch (current) {
    LineageTreeDepth.three => LineageTreeDepth.five,
    LineageTreeDepth.five => LineageTreeDepth.full,
    LineageTreeDepth.full => LineageTreeDepth.full,
  };
}

// ── Related horses (minimal list) ──
class _RelatedHorsesList extends StatelessWidget {
  const _RelatedHorsesList({required this.horses});

  final List<Horse> horses;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (horses.isEmpty) {
      return const EmptyState(
        compact: true,
        icon: Icons.group_outlined,
        title: 'Холбоотой морьд байхгүй',
        description: 'Энэ шугаманд холбоотой морьд бүртгэгдээгүй байна.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final horse in horses) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.lg),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                CircleAvatar(
                  radius: 20,
                  backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  child: Text(
                    horse.name[0],
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              horse.name,
                              style: theme.textTheme.titleSmall,
                            ),
                          ),
                          if (horse.isOwnedByHousehold)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: AppSpacing.xs,
                              ),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Өрхийн',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.onPrimaryContainer,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '${horse.relationLabel} • ${horse.coat} • ${horse.birthYear}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ── Timeline (minimal) ──
class _TimelineList extends StatelessWidget {
  const _TimelineList({required this.snapshot});

  final LineageSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (snapshot.timeline.isEmpty) {
      return const EmptyState(
        compact: true,
        icon: Icons.timeline_outlined,
        title: 'Цагийн шугам байхгүй',
        description: 'Энэ шугаманд тэмдэглэл хараахан нэмэгдээгүй байна.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final entry in snapshot.timeline) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.lg),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Year
                SizedBox(
                  width: AppSpacing.section,
                  child: Text(
                    entry.year.toString(),
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Dot
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.title, style: theme.textTheme.titleSmall),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        entry.description,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ── Featured events section ─────────────────────────────────

/// Онцлох арга хэмжээнүүдийн хэвтээ гүйлгэлттэй хэсэг.
///
/// Зөвхөн `isFeatured = true` бүхий үйл явдлуудыг харуулна.
/// Онцлох үйл явдал байхгүй үед энэ хэсэг нуугдана.
class _FeaturedEventsSection extends ConsumerWidget {
  const _FeaturedEventsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featuredAsync = ref.watch(featuredEventsProvider);

    return featuredAsync.when(
      data: (events) {
        if (events.isEmpty) return const SizedBox.shrink();

        final theme = Theme.of(context);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section title
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Text(
                'Онцлох арга хэмжээ',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            // Horizontal scrollable list
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: events.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(width: AppSpacing.sm),
                itemBuilder: (ctx, index) {
                  final event = events[index];
                  return SizedBox(
                    // Card width = viewport minus a peek margin so the next
                    // card is visible and the card never exceeds the screen.
                    width: MediaQuery.sizeOf(ctx).width - 80,
                    child: EventCard(
                      event: event,
                      onTap: () {
                        // go_router push (no /events/:id route exists yet;
                        // the events list is the routed entry point).
                        ctx.push('/events');
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

// ── Skeleton builders ─────────────────────────────────────────

Widget _snapshotSkeletonBuilder(BuildContext context, int index) =>
    const SkeletonListTile();

Widget _rootChipSkeletonBuilder(BuildContext context, int index) =>
    const SkeletonCard(height: 36, width: 80);
