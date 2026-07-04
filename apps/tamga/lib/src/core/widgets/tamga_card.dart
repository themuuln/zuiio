import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';
import 'tamga_tappable.dart';

/// Flat card with iOS styling — no elevation, rounded corners, optional padding.
///
/// Wraps content with the design system's corner radius and flat surface.
/// Uses [TamgaTappable] for iOS-style opacity-dim press feedback.
class TamgaCard extends StatelessWidget {
  const TamgaCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.color,
    this.border,
    this.onTap,
    this.borderRadius,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final BoxBorder? border;
  final VoidCallback? onTap;
  final double? borderRadius;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final radius = borderRadius ?? TamgaSpacing.cornerRadius;

    Widget card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? colors.surface,
        borderRadius: BorderRadius.circular(radius),
        border: border,
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: padding ?? TamgaSpacing.cardPadding,
        child: child,
      ),
    );

    if (onTap != null) {
      card = Semantics(
        button: true,
        enabled: true,
        child: TamgaTappable(onTap: onTap, child: card),
      );
    }

    return card;
  }
}

/// Card with leading icon, title, subtitle, and optional trailing widget.
///
/// iOS-style list cell that can be used standalone or inside a [Column].
class TamgaIconCard extends StatelessWidget {
  const TamgaIconCard({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.iconColor,
    this.onTap,
    this.padding,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final Color? iconColor;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return TamgaCard(
      onTap: onTap,
      padding: padding ?? TamgaSpacing.listCellPadding,
      child: Semantics(
        button: onTap != null,
        label: subtitle != null ? '$title, $subtitle' : title,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: (iconColor ?? colors.primary).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(
                  TamgaSpacing.cornerRadiusSmall,
                ),
              ),
              child: Icon(icon, size: 20, color: iconColor ?? colors.primary),
            ),
            const SizedBox(width: TamgaSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TamgaTypography.body()),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: TamgaSpacing.sm),
              trailing!,
            ] else if (onTap != null) ...[
              const SizedBox(width: TamgaSpacing.sm),
              Icon(
                Icons.chevron_right,
                size: 20,
                color: colors.onSurfaceVariant,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
