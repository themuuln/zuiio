import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Summary card for dashboards and overview screens.
///
/// Displays a metric with label, value, optional trend, and icon.
///
/// ## Usage
/// ```dart
/// TamgaSummaryCard(
///   label: 'Нийт морь',
///   value: '24',
///   icon: Icons.pets,
///   trend: '+3 сард',
///   trendUp: true,
/// )
/// ```
class TamgaSummaryCard extends StatelessWidget {
  const TamgaSummaryCard({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.trend,
    this.trendUp,
    this.valueColor,
    this.onTap,
    this.padding,
  });

  final String label;
  final String value;
  final IconData? icon;
  final String? trend;
  final bool? trendUp; // null = neutral, true = up, false = down
  final Color? valueColor;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    Widget card = Container(
      padding: padding ?? TamgaSpacing.cardPadding,
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Label
              Expanded(
                child: Text(
                  label,
                  style: TamgaTypography.footnote(
                    color: colors.onSurfaceVariant,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              // Icon
              if (icon != null)
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: colors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadiusSmall,
                    ),
                  ),
                  child: Icon(icon, size: 18, color: colors.primary),
                ),
            ],
          ),

          const SizedBox(height: TamgaSpacing.sm),

          // Value
          Text(
            value,
            style: TamgaTypography.title1(
              color: valueColor ?? colors.onSurface,
            ),
          ),

          // Trend
          if (trend != null) ...[
            const SizedBox(height: TamgaSpacing.xs),
            Row(
              children: [
                if (trendUp != null)
                  Icon(
                    trendUp! ? Icons.trending_up : Icons.trending_down,
                    size: 14,
                    color: trendUp! ? const Color(0xFF6B8F6B) : colors.error,
                  ),
                if (trendUp != null) const SizedBox(width: 4),
                Text(
                  trend!,
                  style: TamgaTypography.caption1(
                    color: trendUp != null
                        ? (trendUp! ? const Color(0xFF6B8F6B) : colors.error)
                        : colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      card = GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Semantics(button: true, label: '$label: $value', child: card),
      );
    }

    return card;
  }
}

/// Row of summary cards for dashboard layout.
class TamgaSummaryRow extends StatelessWidget {
  const TamgaSummaryRow({
    super.key,
    required this.children,
    this.spacing = TamgaSpacing.md,
  });

  final List<TamgaSummaryCard> children;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) SizedBox(width: spacing),
          Expanded(child: children[i]),
        ],
      ],
    );
  }
}
