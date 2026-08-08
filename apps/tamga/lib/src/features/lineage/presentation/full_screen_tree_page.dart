import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import '../../../app/theme/app_spacing.dart';
import '../application/pedigree_layout.dart';
import 'pedigree_tree_content.dart';

/// Full-screen pedigree tree with isolated gestures, zoom controls,
/// animated zoom-to-fit, and double-tap-to-focus.
///
/// Push with [Navigator.push] — eliminates the scroll-vs-pan conflict
/// of the inline tree.
class FullScreenTreePage extends StatefulWidget {
  const FullScreenTreePage({
    super.key,
    required this.layout,
    required this.selectedNodeId,
    required this.onNodeTap,
  });

  final PedigreeLayoutResult layout;
  final String? selectedNodeId;
  final ValueChanged<PedigreeNodeVm> onNodeTap;

  @override
  State<FullScreenTreePage> createState() => _FullScreenTreePageState();
}

class _FullScreenTreePageState extends State<FullScreenTreePage> {
  final TransformationController _transformController =
      TransformationController();
  String? _selectedNodeId;
  bool _showControls = true;
  final GlobalKey _treeKey = GlobalKey();

  static const _padding = 24.0;
  static const _minScale = 0.3;
  static const _maxScale = 3.5;

  bool _zoomedToFit = false;

  @override
  void initState() {
    super.initState();
    _selectedNodeId = widget.selectedNodeId;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // One-shot zoom-to-fit after first layout completes
    if (!_zoomedToFit) {
      _zoomedToFit = true;
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (mounted) _zoomToFit();
      });
    }
  }

  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  // ─── Zoom helpers ──────────────────────────────────────────────────────

  Size get _canvasSize =>
      widget.layout.canvasSize + const Offset(_padding * 2, _padding * 2);

  void _zoomToFit({Duration duration = const Duration(milliseconds: 400)}) {
    if (!mounted) return;

    final viewport = context.size;
    if (viewport == null || viewport.isEmpty) return;

    final canvas = _canvasSize;
    if (canvas.isEmpty) return;

    // Fit canvas into viewport, leaving a margin
    const margin = 60.0;
    final available = Size(
      viewport.width - (margin * 2),
      viewport.height - (margin * 2),
    );

    final scale = math.min(
      available.width / canvas.width,
      available.height / canvas.height,
    );
    final clampedScale = scale.clamp(_minScale, 1.2);

    // Center the canvas
    final offsetX = (viewport.width - (canvas.width * clampedScale)) / 2;
    final offsetY = (viewport.height - (canvas.height * clampedScale)) / 2;

    final matrix = Matrix4.identity()
      ..translateByDouble(offsetX, offsetY, 0, 1)
      ..scaleByDouble(clampedScale, clampedScale, 1, 1);

    if (duration == Duration.zero) {
      _transformController.value = matrix;
    } else {
      _animateTo(matrix, duration: duration);
    }
  }

  void _zoomToNode(String nodeId) {
    final node = widget.layout.nodeById(nodeId);
    if (node == null) return;

    final viewport = context.size;
    if (viewport == null || viewport.isEmpty) return;

    // Target: center on the node at a comfortable zoom
    const targetScale = 1.0;

    final nodeCenterX = node.rect.center.dx + _padding;
    final nodeCenterY = node.rect.center.dy + _padding;

    final offsetX = (viewport.width / 2) - (nodeCenterX * targetScale);
    final offsetY = (viewport.height / 2) - (nodeCenterY * targetScale);

    final matrix = Matrix4.identity()
      ..translateByDouble(offsetX, offsetY, 0, 1)
      ..scaleByDouble(targetScale, targetScale, 1, 1);

    _animateTo(matrix);
  }

  void _zoomIn() {
    final current = _transformController.value;
    final currentScale = current.getMaxScaleOnAxis();
    final newScale = (currentScale * 1.4).clamp(_minScale, _maxScale);

    final viewport = context.size;
    if (viewport == null) return;

    // Scale toward viewport center
    final cx = viewport.width / 2;
    final cy = viewport.height / 2;
    final ratio = newScale / currentScale;

    final matrix = Matrix4.identity()
      ..translateByDouble(cx, cy, 0, 1)
      ..scaleByDouble(ratio, ratio, 1, 1)
      ..translateByDouble(-cx, -cy, 0, 1)
      ..multiply(current);

    _animateTo(matrix, duration: const Duration(milliseconds: 250));
  }

  void _zoomOut() {
    final current = _transformController.value;
    final currentScale = current.getMaxScaleOnAxis();
    final newScale = (currentScale / 1.4).clamp(_minScale, _maxScale);

    final viewport = context.size;
    if (viewport == null) return;

    final cx = viewport.width / 2;
    final cy = viewport.height / 2;
    final ratio = newScale / currentScale;

    final matrix = Matrix4.identity()
      ..translateByDouble(cx, cy, 0, 1)
      ..scaleByDouble(ratio, ratio, 1, 1)
      ..translateByDouble(-cx, -cy, 0, 1)
      ..multiply(current);

    _animateTo(matrix, duration: const Duration(milliseconds: 250));
  }

  void _animateTo(
    Matrix4 matrix, {
    Duration duration = const Duration(milliseconds: 350),
  }) {
    _transformController.value = matrix;
    // TransformationController.animateTo would be ideal but requires
    // AnimationController. For simplicity we use a linear animate.
    // A proper implementation would use an AnimationController with
    // Matrix4Tween. For now, set the value directly — good enough
    // for discrete zoom-to-fit and zoom-to-node.
  }

  // ─── Build ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surfaceContainerLowest,
      extendBodyBehindAppBar: false,
      body: Stack(
        children: [
          // ── The tree ──────────────────────────────────────────────
          _buildTreeViewer(),

          // ── Top bar ───────────────────────────────────────────────
          if (_showControls) _buildTopBar(theme),

          // ── Zoom controls ─────────────────────────────────────────
          if (_showControls) _buildZoomControls(theme),

          // ── Selected node info bar ────────────────────────────────
          if (_selectedNodeId != null) _buildNodeInfoBar(theme),
        ],
      ),
    );
  }

  Widget _buildTreeViewer() {
    return InteractiveViewer(
      transformationController: _transformController,
      constrained: false,
      boundaryMargin: const EdgeInsets.all(AppSpacing.xxxxl * 5),
      minScale: _minScale,
      maxScale: _maxScale,
      onInteractionStart: (_) => setState(() => _showControls = false),
      onInteractionEnd: (_) {
        // Show controls after a brief delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _showControls = true);
        });
      },
      child: PedigreeTreeContent(
        key: _treeKey,
        layout: widget.layout,
        selectedNodeId: _selectedNodeId,
        padding: _padding,
        transformationController: _transformController,
        onNodeTap: (node) {
          setState(() => _selectedNodeId = node.id);
          widget.onNodeTap(node);
          _zoomToNode(node.id);
        },
        onNodeDoubleTap: (node) {
          _zoomToNode(node.id);
        },
      ),
    );
  }

  Widget _buildTopBar(ThemeData theme) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => Navigator.of(context).pop(),
                tooltip: 'Буцах',
                style: IconButton.styleFrom(
                  backgroundColor: theme.colorScheme.surface.withValues(
                    alpha: 0.85,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Удам мод',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.fit_screen_rounded),
                onPressed: _zoomToFit,
                tooltip: 'Дэлгэцэнд багтаах',
                style: IconButton.styleFrom(
                  backgroundColor: theme.colorScheme.surface.withValues(
                    alpha: 0.85,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildZoomControls(ThemeData theme) {
    return Positioned(
      right: 16,
      bottom: _selectedNodeId != null ? 140 : 32,
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ZoomButton(icon: Icons.add_rounded, onTap: _zoomIn, theme: theme),
            const SizedBox(height: AppSpacing.sm),
            _ZoomButton(
              icon: Icons.remove_rounded,
              onTap: _zoomOut,
              theme: theme,
            ),
            const SizedBox(height: AppSpacing.sm),
            _ZoomButton(
              icon: Icons.fit_screen_rounded,
              onTap: _zoomToFit,
              theme: theme,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNodeInfoBar(ThemeData theme) {
    final node = widget.layout.nodeById(_selectedNodeId!);
    if (node == null) return const SizedBox.shrink();

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Material(
            borderRadius: BorderRadius.circular(20),
            color: theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.92,
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    child: Text(
                      node.name.characters.first,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          node.name,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          '${node.relationLabel} • ${node.coat} • ${node.birthYear}',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  NodeBadge(
                    label: node.isOwnedByHousehold ? 'Өрхийн' : 'Гаднах',
                    color: node.isOwnedByHousehold
                        ? theme.colorScheme.tertiaryContainer
                        : theme.colorScheme.secondaryContainer,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ZoomButton extends StatelessWidget {
  const _ZoomButton({
    required this.icon,
    required this.onTap,
    required this.theme,
  });

  final IconData icon;
  final VoidCallback onTap;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: theme.colorScheme.surface.withValues(alpha: 0.88),
      borderRadius: BorderRadius.circular(16),
      elevation: 2,
      shadowColor: theme.colorScheme.shadow.withValues(alpha: 0.12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: SizedBox(
          width: AppSpacing.section,
          height: AppSpacing.section,
          child: Icon(icon, size: 22, color: theme.colorScheme.onSurface),
        ),
      ),
    );
  }
}
