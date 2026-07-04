import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Key-value info display row — label on left, value on right.
///
/// Useful for detail screens showing structured data.
///
/// ## Usage
/// ```dart
/// TamgaInfoRow(label: 'Нас', value: '5'),
/// TamgaInfoRow(label: 'Үүлдэр', value: 'Алтан'),
/// ```
class TamgaInfoRow extends StatelessWidget {
  const TamgaInfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.divider = true,
    this.icon,
    this.padding,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final bool divider;
  final IconData? icon;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: padding ?? TamgaSpacing.listCellPadding,
          child: Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: colors.onSurfaceVariant),
                const SizedBox(width: TamgaSpacing.sm),
              ],
              Text(
                label,
                style: TamgaTypography.body(color: colors.onSurfaceVariant),
              ),
              const Spacer(),
              Flexible(
                child: Text(
                  value,
                  style: TamgaTypography.body(
                    color: valueColor ?? colors.onSurface,
                  ),
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),
        ),
        if (divider)
          const Divider(
            indent: TamgaSpacing.lg,
            height: 0,
            thickness: TamgaSpacing.hairline,
          ),
      ],
    );
  }
}

/// Grid of [TamgaInfoRow] for compact detail views.
class TamgaInfoGrid extends StatelessWidget {
  const TamgaInfoGrid({
    super.key,
    required this.rows,
    this.columns = 2,
    this.spacing = TamgaSpacing.md,
  });

  final List<({String label, String value, IconData? icon})> rows;
  final int columns;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Wrap(
      spacing: spacing,
      runSpacing: spacing,
      children: rows.map((row) {
        return SizedBox(
          width:
              (MediaQuery.sizeOf(context).width -
                  TamgaSpacing.lg * 2 -
                  spacing * (columns - 1)) /
              columns,
          child: Container(
            padding: const EdgeInsets.all(TamgaSpacing.md),
            decoration: BoxDecoration(
              color: colors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    if (row.icon != null) ...[
                      Icon(row.icon, size: 14, color: colors.onSurfaceVariant),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      row.label,
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(row.value, style: TamgaTypography.headline(fontSize: 15)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
