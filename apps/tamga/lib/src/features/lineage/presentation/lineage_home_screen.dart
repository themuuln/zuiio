import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../payments/presentation/widgets/paywall_widget.dart';
import '../../payments/domain/payment_request.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/horse.dart';
import '../../events/application/events_providers.dart';
import '../../events/presentation/event_detail_screen.dart';
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
    final theme = Theme.of(context);
    final roots = ref.watch(lineageRootsProvider);
    final selectedSnapshot = ref.watch(lineageSnapshotProvider);
    final selectedRootId = ref.watch(selectedLineageRootIdProvider);
    final homeView = ref.watch(lineageHomeViewProvider);
    final treeDepth = ref.watch(lineageTreeDepthProvider);
    final treeLayout = ref.watch(pedigreeLayoutProvider);
    final selectedNode = ref.watch(selectedPedigreeNodeProvider);

    return CustomScrollView(
      slivers: [
        // ── Minimal header ──
        SliverAppBar(
          title: const Text('Угшил'),
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
                    if (items.isEmpty) return const SizedBox.shrink();
                    return SizedBox(
                      height: AppSpacing.xxxxl,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: items.length,
                        separatorBuilder: (_, _) =>
                            const SizedBox(width: AppSpacing.sm),
                        itemBuilder: (ctx, index) {
                          final root = items[index];
                          final isSelected = root.id == selectedRootId;
                          return GestureDetector(
                            onTap: () {
                              ref
                                  .read(selectedPedigreeNodeIdProvider.notifier)
                                  .state = root
                                  .id;
                              ref.read(lineageHomeViewProvider.notifier).state =
                                  LineageHomeView.tree;
                              ref
                                  .read(selectedLineageRootIdProvider.notifier)
                                  .state = root
                                  .id;
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.lg,
                                vertical: AppSpacing.sm,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? theme.colorScheme.primary
                                    : theme.colorScheme.surfaceContainerHighest
                                          .withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                root.name,
                                style: theme.textTheme.labelLarge?.copyWith(
                                  color: isSelected
                                      ? theme.colorScheme.onPrimary
                                      : theme.colorScheme.onSurface,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
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
                    // ── Root info (clean, no card) ──
                    StaggeredFadeIn(
                      index: 0,
                      child: Text(
                        snapshot.root.name,
                        style: theme.textTheme.headlineSmall,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    StaggeredFadeIn(
                      index: 1,
                      child: Text(
                        '${snapshot.root.coat} • ${snapshot.root.birthYear}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // ── Stats row ──
                    StaggeredFadeIn(
                      index: 2,
                      child: _StatsRow(
                        offspring: snapshot.root.offspringCount,
                        awards: snapshot.root.awardCount,
                        nodes: snapshot.treeNodes.length,
                      ),
                    ),

                    if (snapshot.root.notes.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.lg),
                      StaggeredFadeIn(
                        index: 3,
                        child: Text(
                          snapshot.root.notes,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: AppSpacing.xxl),

                    // ── Depth selector (for tree view) ──
                    if (homeView == LineageHomeView.tree) ...[
                      StaggeredFadeIn(
                        index: 4,
                        child: _DepthSelector(
                          selectedDepth: treeDepth,
                          onDepthSelected: (depth) {
                            ref.read(lineageTreeDepthProvider.notifier).state =
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
                                  .state =
                              node.id;
                        },
                        treeDepth: treeDepth,
                        onLoadMoreAncestors: treeDepth != LineageTreeDepth.full
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
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
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

    return Row(
      children: [
        for (final view in LineageHomeView.values) ...[
          if (view != LineageHomeView.values.first) ...[
            const SizedBox(width: AppSpacing.xs),
            Container(
              width: 3,
              height: 3,
              decoration: BoxDecoration(
                color: theme.colorScheme.outlineVariant,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          GestureDetector(
            onTap: () => onSelect(view),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.xs,
              ),
              child: Text(
                view.label,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: selected == view
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurfaceVariant,
                  fontWeight: selected == view
                      ? FontWeight.w600
                      : FontWeight.w400,
                ),
              ),
            ),
          ),
        ],
      ],
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
    final theme = Theme.of(context);
    final style = theme.textTheme.labelMedium?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );

    return Row(
      children: [
        _Stat(label: 'Үр төл', value: offspring, style: style),
        const SizedBox(width: AppSpacing.lg),
        _Stat(label: 'Шагнал', value: awards, style: style),
        const SizedBox(width: AppSpacing.lg),
        _Stat(label: 'Node', value: nodes, style: style),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.style});

  final String label;
  final int value;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text('$value', style: style?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(width: AppSpacing.xs),
        Text(label, style: style),
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

    return SizedBox(
      height: AppSpacing.xxxl,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: LineageTreeDepth.values.length,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (ctx, index) {
          final depth = LineageTreeDepth.values[index];
          final isSelected = depth == selectedDepth;
          final isLocked = _isDepthLocked(depth, maxGen);

          return GestureDetector(
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
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: isSelected
                    ? theme.colorScheme.primaryContainer
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outlineVariant,
                  width: 1,
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
                    ),
                  ),
                  if (isLocked) ...[
                    const SizedBox(width: AppSpacing.xs),
                    Icon(
                      Icons.lock_outline,
                      size: 12,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
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
                    width: 420,
                    child: EventCard(
                      event: event,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => EventDetailScreen(event: event),
                          ),
                        );
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
