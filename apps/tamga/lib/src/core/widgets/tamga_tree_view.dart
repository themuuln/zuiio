import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Tree view for lineage/pedigree visualization.
///
/// Displays a hierarchical list with expand/collapse controls.
///
/// ## Usage
/// ```dart
/// TamgaTreeView(
///   nodes: [
///     TamgaTreeNode(
///       id: '1',
///       label: 'Алтан',
///       subtitle: 'Эцэг: Зүүлдэр',
///       children: [
///         TamgaTreeNode(id: '2', label: 'Зүүлдэр'),
///         TamgaTreeNode(id: '3', label: 'Бүртэл'),
///       ],
///     ),
///   ],
///   onNodeTap: (node) => navigateToHorse(node.id),
/// )
/// ```
class TamgaTreeView extends StatefulWidget {
  const TamgaTreeView({
    super.key,
    required this.nodes,
    this.onNodeTap,
    this.onExpandToggle,
    this.initiallyExpanded = const {},
    this.indent = 24,
    this.showConnectorLines = true,
  });

  final List<TamgaTreeNode> nodes;
  final ValueChanged<TamgaTreeNode>? onNodeTap;
  final ValueChanged<TamgaTreeNode>? onExpandToggle;
  final Set<String> initiallyExpanded;
  final double indent;
  final bool showConnectorLines;

  @override
  State<TamgaTreeView> createState() => _TamgaTreeViewState();
}

class _TamgaTreeViewState extends State<TamgaTreeView> {
  late Set<String> _expandedIds;

  @override
  void initState() {
    super.initState();
    _expandedIds = Set<String>.from(widget.initiallyExpanded);
  }

  void _toggle(String id) {
    setState(() {
      if (_expandedIds.contains(id)) {
        _expandedIds.remove(id);
      } else {
        _expandedIds.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final node in widget.nodes)
          _TreeNodeWidget(
            node: node,
            depth: 0,
            expandedIds: _expandedIds,
            onToggle: _toggle,
            onTap: widget.onNodeTap,
            indent: widget.indent,
            showConnectorLines: widget.showConnectorLines,
          ),
      ],
    );
  }
}

class TamgaTreeNode {
  const TamgaTreeNode({
    required this.id,
    required this.label,
    this.subtitle,
    this.icon,
    this.children = const [],
    this.trailing,
  });

  final String id;
  final String label;
  final String? subtitle;
  final IconData? icon;
  final List<TamgaTreeNode> children;
  final Widget? trailing;

  bool get hasChildren => children.isNotEmpty;
}

class _TreeNodeWidget extends StatelessWidget {
  const _TreeNodeWidget({
    required this.node,
    required this.depth,
    required this.expandedIds,
    required this.onToggle,
    this.onTap,
    required this.indent,
    required this.showConnectorLines,
  });

  final TamgaTreeNode node;
  final int depth;
  final Set<String> expandedIds;
  final ValueChanged<String> onToggle;
  final ValueChanged<TamgaTreeNode>? onTap;
  final double indent;
  final bool showConnectorLines;

  bool get isExpanded => expandedIds.contains(node.id);

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Node Row ──────────────────────────────────────────────
        GestureDetector(
          onTap: () {
            if (node.hasChildren) {
              onToggle(node.id);
            }
            onTap?.call(node);
          },
          behavior: HitTestBehavior.opaque,
          child: Semantics(
            button: node.hasChildren,
            expanded: node.hasChildren ? isExpanded : null,
            label:
                '${node.label}${node.subtitle != null ? ', ${node.subtitle}' : ''}',
            child: Padding(
              padding: EdgeInsets.only(
                left: depth * indent,
                top: TamgaSpacing.sm,
                bottom: TamgaSpacing.sm,
              ),
              child: Row(
                children: [
                  // Expand/collapse chevron
                  if (node.hasChildren)
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_down
                          : Icons.keyboard_arrow_right,
                      size: 20,
                      color: colors.onSurfaceVariant,
                    )
                  else
                    SizedBox(width: 20),

                  // Connector line indicator
                  if (showConnectorLines && depth > 0) ...[
                    Container(width: 12, height: 2, color: colors.border),
                  ],

                  // Icon
                  if (node.icon != null) ...[
                    const SizedBox(width: TamgaSpacing.sm),
                    Icon(node.icon, size: 18, color: colors.primary),
                  ],

                  const SizedBox(width: TamgaSpacing.sm),

                  // Label + subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          node.label,
                          style: TamgaTypography.body(
                            color: colors.onSurface,
                            weight: depth == 0
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                        if (node.subtitle != null)
                          Text(
                            node.subtitle!,
                            style: TamgaTypography.caption1(
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Trailing
                  if (node.trailing != null) node.trailing!,
                ],
              ),
            ),
          ),
        ),

        // ── Children ──────────────────────────────────────────────
        if (node.hasChildren && isExpanded)
          for (final child in node.children)
            _TreeNodeWidget(
              node: child,
              depth: depth + 1,
              expandedIds: expandedIds,
              onToggle: onToggle,
              onTap: onTap,
              indent: indent,
              showConnectorLines: showConnectorLines,
            ),
      ],
    );
  }
}
