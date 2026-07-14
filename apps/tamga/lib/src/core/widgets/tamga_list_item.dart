import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// iOS-style list tile with leading icon, title, subtitle, and trailing widget.
///
/// Wraps Material [ListTile] with design system defaults.
///
/// ## Usage
/// ```dart
/// TamgaListItem(
///   icon: Icons.person,
///   title: 'Profile',
///   subtitle: 'Edit your info',
///   onTap: () => context.push('/profile'),
/// )
/// ```
class TamgaListItem extends StatelessWidget {
  const TamgaListItem({
    super.key,
    this.icon,
    this.iconColor,
    this.iconBackground,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.showChevron = false,
    this.dense = false,
    this.divider = false,
  });

  final IconData? icon;
  final Color? iconColor;
  final Color? iconBackground;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showChevron;
  final bool dense;
  final bool divider;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          onTap: onTap,
          dense: dense,
          contentPadding: TamgaSpacing.listCellPadding,
          leading: icon != null
              ? Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color:
                        iconBackground ??
                        (iconColor ?? colors.primary).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadiusSmall,
                    ),
                  ),
                  child: Icon(
                    icon,
                    size: 20,
                    color: iconColor ?? colors.primary,
                  ),
                )
              : null,
          title: Text(title, style: TamgaTypography.body()),
          subtitle: subtitle != null
              ? Text(
                  subtitle!,
                  style: TamgaTypography.subheadline(
                    color: colors.onSurfaceVariant,
                  ),
                )
              : null,
          trailing:
              trailing ??
              (showChevron
                  ? Icon(
                      Icons.chevron_right,
                      size: 20,
                      color: colors.onSurfaceVariant,
                    )
                  : null),
          shape: const RoundedRectangleBorder(),
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

/// Group of [TamgaListItem] with iOS grouped background styling.
class TamgaListGroup extends StatelessWidget {
  const TamgaListGroup({
    super.key,
    this.header,
    required this.children,
    this.margin,
  });

  final String? header;
  final List<Widget> children;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Padding(
      padding:
          margin ?? const EdgeInsets.symmetric(horizontal: TamgaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (header != null)
            Padding(
              padding: const EdgeInsets.only(
                left: TamgaSpacing.lg,
                bottom: TamgaSpacing.sm,
              ),
              child: Text(
                header!,
                style: TamgaTypography.footnote(color: colors.onSurfaceVariant),
              ),
            ),
          Container(
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(mainAxisSize: MainAxisSize.min, children: children),
          ),
        ],
      ),
    );
  }
}
