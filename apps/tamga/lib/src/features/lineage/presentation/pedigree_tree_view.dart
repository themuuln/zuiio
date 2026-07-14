import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../application/pedigree_layout.dart';
import 'pedigree_tree_content.dart';

/// Renders a pedigree tree inside [InteractiveViewer] with viewport-culled
/// node rendering for large pedigrees (50+ nodes).
///
/// Uses a [TransformationController] to determine which nodes are visible
/// in the viewport. Off-screen nodes are culled from the widget tree.
class PedigreeTreeView extends StatefulWidget {
  const PedigreeTreeView({
    super.key,
    required this.layout,
    required this.selectedNodeId,
    required this.onNodeTap,
    this.onNodeDoubleTap,
  });

  final PedigreeLayoutResult layout;
  final String? selectedNodeId;
  final ValueChanged<PedigreeNodeVm> onNodeTap;
  final ValueChanged<PedigreeNodeVm>? onNodeDoubleTap;

  static const padding = 24.0;

  @override
  State<PedigreeTreeView> createState() => _PedigreeTreeViewState();
}

class _PedigreeTreeViewState extends State<PedigreeTreeView> {
  final TransformationController _transformController =
      TransformationController();
  Size _viewportSize = Size.zero;

  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.layout.nodes.isEmpty) {
      return const SizedBox.shrink();
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        // Capture the viewport size for viewport culling.
        // Schedule a post-frame callback to update the stored size since
        // setState during build is not allowed.
        if (constraints.hasBoundedWidth && constraints.hasBoundedHeight) {
          final newSize = Size(constraints.maxWidth, constraints.maxHeight);
          if (_viewportSize != newSize) {
            _viewportSize = newSize;
          }
        }

        return ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
            ),
            child: InteractiveViewer(
              transformationController: _transformController,
              constrained: false,
              boundaryMargin: const EdgeInsets.all(AppSpacing.xxxxl * 3),
              maxScale: 2.8,
              minScale: 0.45,
              child: PedigreeTreeContent(
                layout: widget.layout,
                selectedNodeId: widget.selectedNodeId,
                onNodeTap: widget.onNodeTap,
                onNodeDoubleTap: widget.onNodeDoubleTap,
                padding: PedigreeTreeView.padding,
                transformationController: _transformController,
                viewportSize: _viewportSize,
              ),
            ),
          ),
        );
      },
    );
  }
}
