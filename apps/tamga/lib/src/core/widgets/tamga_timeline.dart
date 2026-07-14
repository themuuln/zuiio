import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Vertical timeline for health history, event history, and pedigree.
///
/// Shows a connected vertical line with nodes for each entry.
///
/// ## Usage
/// ```dart
/// TamgaTimeline(
///   items: [
///     TamgaTimelineItem(
///       title: 'Вакцинжуулалт',
///       subtitle: '2026 оны 03 сарын 15',
///       description: 'Энцефалитын вакцин',
///       icon: Icons.medical_services,
///       color: AppColors.primary,
///     ),
///     TamgaTimelineItem(
///       title: 'Үзлэг',
///       subtitle: '2026 оны 01 сарын 10',
///       description: 'Жилийн үзлэг — хэвийн',
///       icon: Icons.check_circle,
///       color: AppColors.success,
///     ),
///   ],
/// )
/// ```
class TamgaTimeline extends StatelessWidget {
  const TamgaTimeline({
    super.key,
    required this.items,
    this.lineColor,
    this.nodeSize = 12,
    this.lineThickness = 2,
    this.padding,
  });

  final List<TamgaTimelineItem> items;
  final Color? lineColor;
  final double nodeSize;
  final double lineThickness;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final effectiveLineColor = lineColor ?? colors.border;

    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < items.length; i++) ...[
            _TimelineNode(
              item: items[i],
              lineColor: effectiveLineColor,
              nodeSize: nodeSize,
              lineThickness: lineThickness,
              isLast: i == items.length - 1,
            ),
          ],
        ],
      ),
    );
  }
}

class TamgaTimelineItem {
  const TamgaTimelineItem({
    required this.title,
    this.subtitle,
    this.description,
    this.icon,
    this.color,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final String? description;
  final IconData? icon;
  final Color? color;
  final Widget? trailing;
}

class _TimelineNode extends StatelessWidget {
  const _TimelineNode({
    required this.item,
    required this.lineColor,
    required this.nodeSize,
    required this.lineThickness,
    required this.isLast,
  });

  final TamgaTimelineItem item;
  final Color lineColor;
  final double nodeSize;
  final double lineThickness;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final nodeColor = item.color ?? colors.primary;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Line + Node ────────────────────────────────────────
          SizedBox(
            width: nodeSize * 2 + TamgaSpacing.md,
            child: Column(
              children: [
                // Node
                Container(
                  width: nodeSize,
                  height: nodeSize,
                  decoration: BoxDecoration(
                    color: nodeColor,
                    shape: BoxShape.circle,
                  ),
                  child: item.icon != null
                      ? Icon(
                          item.icon,
                          size: nodeSize * 0.65,
                          color: Colors.white,
                        )
                      : null,
                ),
                // Line
                if (!isLast)
                  Expanded(
                    child: Container(width: lineThickness, color: lineColor),
                  ),
              ],
            ),
          ),

          // ── Content ────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                bottom: isLast ? 0 : TamgaSpacing.lg,
                top: 0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TamgaTypography.headline(
                            color: colors.onSurface,
                          ),
                        ),
                      ),
                      if (item.trailing != null) item.trailing!,
                    ],
                  ),
                  if (item.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      item.subtitle!,
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                  if (item.description != null) ...[
                    const SizedBox(height: TamgaSpacing.xs),
                    Text(
                      item.description!,
                      style: TamgaTypography.body(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
