import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../application/pedigree_layout.dart';
import '../domain/lineage_tree_edge.dart';

/// Buffer zone around the visible viewport (in logical pixels) within which
/// nodes are still rendered. Prevents flickering when panning or zooming.
const double _kCullingMargin = 300.0;

/// Pure tree rendering (Stack of nodes + edge painter) — no InteractiveViewer.
/// Reused by both the inline [PedigreeTreeView] and [FullScreenTreePage].
///
/// When [transformationController] is provided, nodes outside the visible
/// viewport (plus a margin) are culled — they are not built, laid out, or
/// painted. This keeps the widget tree small for large pedigrees (50+ nodes).
class PedigreeTreeContent extends StatelessWidget {
  const PedigreeTreeContent({
    super.key,
    required this.layout,
    required this.selectedNodeId,
    required this.onNodeTap,
    required this.padding,
    this.onNodeDoubleTap,
    this.transformationController,
    this.viewportSize,
  });

  final PedigreeLayoutResult layout;
  final String? selectedNodeId;
  final ValueChanged<PedigreeNodeVm> onNodeTap;
  final double padding;
  final ValueChanged<PedigreeNodeVm>? onNodeDoubleTap;

  /// Optional controller from the parent [InteractiveViewer].
  /// When provided, off-screen nodes are culled.
  final TransformationController? transformationController;

  /// The viewport size (pixel dimensions of the [InteractiveViewer]).
  /// When provided along with [transformationController], only nodes
  /// within the visible viewport (plus margin) are built.
  final Size? viewportSize;

  @override
  Widget build(BuildContext context) {
    if (layout.nodes.isEmpty) {
      return const SizedBox.shrink();
    }

    final colorScheme = Theme.of(context).colorScheme;
    final shiftedRects = {
      for (final node in layout.nodes)
        node.id: node.rect.shift(Offset(padding, padding)),
    };

    final width = layout.canvasSize.width + (padding * 2);
    final height = layout.canvasSize.height + (padding * 2);

    // ── Compute visible rect for viewport culling ─────────────────
    Rect visibleRect = Offset.zero & Size(width, height);
    if (transformationController != null &&
        viewportSize != null &&
        viewportSize!.width > 0 &&
        viewportSize!.height > 0) {
      visibleRect = _computeVisibleRect(
        transformationController!.value,
        viewportSize!,
      );
    }

    // Filter nodes to only those visible on screen (plus margin).
    final visibleNodes = layout.nodes.where((node) {
      final shifted = shiftedRects[node.id]!;
      return visibleRect.overlaps(shifted.inflate(_kCullingMargin));
    }).toList();

    return SizedBox(
      width: width,
      height: height,
      child: Stack(
        children: [
          // ── Edge painter (RepaintBoundary inside Positioned) ────
          Positioned.fill(
            child: RepaintBoundary(
              child: IgnorePointer(
                child: CustomPaint(
                  painter: PedigreeEdgePainter(
                    edges: layout.edges,
                    nodeRects: shiftedRects,
                    selectedNodeId: selectedNodeId,
                    colorScheme: colorScheme,
                    visibleRect: visibleRect,
                  ),
                ),
              ),
            ),
          ),

          // ── Only build visible nodes (viewport culling) ─────────
          for (final node in visibleNodes)
            Positioned(
              left: node.rect.left + padding,
              top: node.rect.top + padding,
              width: node.rect.width,
              height: node.rect.height,
              child: RepaintBoundary(
                child: PedigreeNodeCard(
                  node: node,
                  isSelected: selectedNodeId == node.id,
                  onTap: () => onNodeTap(node),
                  onDoubleTap: onNodeDoubleTap != null
                      ? () => onNodeDoubleTap!(node)
                      : null,
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Computes the visible area of the canvas in untransformed coordinate
  /// space by applying the inverse of the [InteractiveViewer]'s transform.
  ///
  /// [viewportSize] is the pixel size of the [InteractiveViewer] widget.
  /// The inverse transform maps viewport corners back to canvas coordinates.
  Rect _computeVisibleRect(Matrix4 matrix, Size viewportSize) {
    final inverse = Matrix4.tryInvert(matrix);
    if (inverse == null) return Offset.zero & (viewportSize);

    final canvasTopLeft = MatrixUtils.transformPoint(inverse, Offset.zero);
    final canvasBottomRight = MatrixUtils.transformPoint(
      inverse,
      Offset(viewportSize.width, viewportSize.height),
    );

    return Rect.fromLTRB(
      math.min(canvasTopLeft.dx, canvasBottomRight.dx),
      math.min(canvasTopLeft.dy, canvasBottomRight.dy),
      math.max(canvasTopLeft.dx, canvasBottomRight.dx),
      math.max(canvasTopLeft.dy, canvasBottomRight.dy),
    );
  }
}

// ─── Public versions (formerly private) ──────────────────────────────────────

class PedigreeNodeCard extends StatelessWidget {
  const PedigreeNodeCard({
    super.key,
    required this.node,
    required this.isSelected,
    required this.onTap,
    this.onDoubleTap,
  });

  final PedigreeNodeVm node;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback? onDoubleTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final containerColor = node.isRoot
        ? colorScheme.primaryContainer
        : node.isOwnedByHousehold
        ? colorScheme.surfaceContainerLow
        : colorScheme.secondaryContainer.withValues(alpha: 0.72);
    final borderColor = isSelected
        ? colorScheme.primary
        : node.isRoot
        ? colorScheme.primary
        : colorScheme.outlineVariant;
    final textColor = node.isRoot
        ? colorScheme.onPrimaryContainer
        : theme.colorScheme.onSurface;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        onDoubleTap: onDoubleTap,
        child: Ink(
          decoration: BoxDecoration(
            color: containerColor,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: borderColor,
              width: isSelected ? 2.4 : 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: colorScheme.shadow.withValues(alpha: 0.06),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _NodeAvatar(node: node, colorScheme: colorScheme),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        node.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: textColor,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${node.relationLabel} • ${node.birthYear}',
                  style: theme.textTheme.labelSmall?.copyWith(color: textColor),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Үр төл ${node.offspringCount} • Шагнал ${node.awardCount}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  width: double.infinity,
                  child: Row(
                    children: [
                      NodeBadge(
                        label: node.isOwnedByHousehold ? 'Өрхийн' : 'Гаднах',
                        color: node.isOwnedByHousehold
                            ? colorScheme.tertiaryContainer
                            : colorScheme.secondaryContainer,
                      ),
                      if (node.tamgaNo != null) ...[
                        const SizedBox(width: AppSpacing.xs),
                        NodeBadge(
                          label: node.tamgaNo!,
                          color: colorScheme.primaryContainer,
                          textColor: colorScheme.onPrimaryContainer,
                        ),
                      ],
                      const Spacer(),
                      if (node.hiddenBranchCount > 0)
                        NodeBadge(
                          label: '+${node.hiddenBranchCount}',
                          color: colorScheme.primary,
                          textColor: colorScheme.onPrimary,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class NodeBadge extends StatelessWidget {
  const NodeBadge({
    super.key,
    required this.label,
    required this.color,
    this.textColor,
  });

  final String label;
  final Color color;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        child: Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: textColor ?? theme.colorScheme.onSurface,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

/// Зургийн эсвэл эможи аватар.
class _NodeAvatar extends StatelessWidget {
  const _NodeAvatar({required this.node, required this.colorScheme});

  final PedigreeNodeVm node;
  final ColorScheme colorScheme;

  bool get _isStallion => node.sex == 'stallion';
  bool get _isMare => node.sex == 'mare';

  @override
  Widget build(BuildContext context) {
    // 1. Зурагтай бол зураг харуулна
    if (node.photoUrl != null && node.photoUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 14,
        backgroundColor: colorScheme.surface,
        backgroundImage: NetworkImage(node.photoUrl!),
      );
    }

    // 2. Хүйсээр эможи сонгоно
    if (_isStallion || _isMare) {
      return CircleAvatar(
        radius: 14,
        backgroundColor: _isStallion
            ? colorScheme.primaryContainer
            : colorScheme.tertiaryContainer,
        child: Text(
          _isStallion ? '🐎' : '🐴',
          style: const TextStyle(fontSize: 16),
        ),
      );
    }

    // 3. Аварга байхгүй бол эхний үсэг
    return CircleAvatar(
      radius: 14,
      backgroundColor: colorScheme.surface,
      child: Text(
        node.name.characters.first,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: colorScheme.primary,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class PedigreeEdgePainter extends CustomPainter {
  const PedigreeEdgePainter({
    required this.edges,
    required this.nodeRects,
    required this.selectedNodeId,
    required this.colorScheme,
    this.visibleRect,
  });

  final List<PedigreeEdgeVm> edges;
  final Map<String, Rect> nodeRects;
  final String? selectedNodeId;
  final ColorScheme colorScheme;

  /// When set, edges whose bounding box does not intersect this rect are
  /// skipped during painting (edge culling).
  final Rect? visibleRect;

  @override
  void paint(Canvas canvas, Size size) {
    for (final edge in edges) {
      final fromRect = nodeRects[edge.fromId];
      final toRect = nodeRects[edge.toId];
      if (fromRect == null || toRect == null) continue;

      // ── Edge culling: skip if both endpoints are outside visible rect ──
      if (visibleRect != null) {
        final edgeBounds = fromRect.expandToInclude(toRect);
        if (!visibleRect!.overlaps(edgeBounds.inflate(_kCullingMargin))) {
          continue;
        }
      }

      final isHighlighted =
          selectedNodeId == edge.fromId || selectedNodeId == edge.toId;
      final paint = Paint()
        ..color = _colorFor(edge.type, isHighlighted)
        ..strokeWidth = isHighlighted ? 3 : 2
        ..style = PaintingStyle.stroke;

      final start = Offset(fromRect.center.dx, fromRect.bottom);
      final end = Offset(toRect.center.dx, toRect.top);
      final path = Path()
        ..moveTo(start.dx, start.dy)
        ..cubicTo(start.dx, start.dy + 30, end.dx, end.dy - 30, end.dx, end.dy);

      canvas.drawPath(path, paint);
    }
  }

  Color _colorFor(LineageTreeRelationType type, bool isHighlighted) {
    if (isHighlighted) return colorScheme.primary;

    return switch (type) {
      LineageTreeRelationType.sire => colorScheme.outline,
      LineageTreeRelationType.dam => colorScheme.tertiary,
      LineageTreeRelationType.offspring => colorScheme.primary.withValues(
        alpha: 0.48,
      ),
    };
  }

  @override
  bool shouldRepaint(covariant PedigreeEdgePainter oldDelegate) {
    return oldDelegate.edges != edges ||
        oldDelegate.nodeRects != nodeRects ||
        oldDelegate.selectedNodeId != selectedNodeId ||
        oldDelegate.colorScheme != colorScheme ||
        oldDelegate.visibleRect != visibleRect;
  }
}
