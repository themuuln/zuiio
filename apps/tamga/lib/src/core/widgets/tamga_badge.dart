import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Pill-shaped badge for status labels, counts, and tags.
///
/// Supports solid and outlined variants with semantic color presets.
///
/// ## Usage
/// ```dart
/// TamgaBadge(label: 'Active', variant: TamgaBadgeVariant.success)
/// TamgaBadge(label: '3', variant: TamgaBadgeVariant.primary)
/// ```
enum TamgaBadgeVariant { primary, success, warning, destructive, info, neutral }

class TamgaBadge extends StatelessWidget {
  const TamgaBadge({
    super.key,
    required this.label,
    this.variant = TamgaBadgeVariant.neutral,
    this.size = TamgaBadgeSize.medium,
    this.outlined = false,
    this.icon,
  });

  final String label;
  final TamgaBadgeVariant variant;
  final TamgaBadgeSize size;
  final bool outlined;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final palette = _resolvePalette(colors);

    final bgColor = outlined ? palette.bg.withValues(alpha: 0.1) : palette.bg;
    final fgColor = palette.fg;
    final borderColor = outlined ? palette.fg : Colors.transparent;

    final (fontSize, horizontalPad, verticalPad, iconSize) = switch (size) {
      TamgaBadgeSize.small => (11.0, 8.0, 2.0, 12.0),
      TamgaBadgeSize.medium => (13.0, 10.0, 4.0, 14.0),
      TamgaBadgeSize.large => (15.0, 12.0, 6.0, 16.0),
    };

    return Semantics(
      label: label,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: horizontalPad,
          vertical: verticalPad,
        ),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusPill),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: iconSize, color: fgColor),
              SizedBox(width: horizontalPad * 0.4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: fontSize,
                fontWeight: FontWeight.w600,
                color: fgColor,
                letterSpacing: 0.02,
              ),
            ),
          ],
        ),
      ),
    );
  }

  _Palette _resolvePalette(TamgaColors colors) {
    return switch (variant) {
      TamgaBadgeVariant.primary => _Palette(
        bg: colors.primary,
        fg: colors.onPrimary,
      ),
      TamgaBadgeVariant.success => _Palette(
        bg: const Color(0xFF6B8F6B),
        fg: Colors.white,
      ),
      TamgaBadgeVariant.warning => _Palette(
        bg: const Color(0xFFD4884A),
        fg: Colors.white,
      ),
      TamgaBadgeVariant.destructive => _Palette(
        bg: colors.error,
        fg: colors.onError,
      ),
      TamgaBadgeVariant.info => _Palette(
        bg: const Color(0xFF6B8FB8),
        fg: Colors.white,
      ),
      TamgaBadgeVariant.neutral => _Palette(
        bg: colors.surfaceContainerHigh,
        fg: colors.onSurface,
      ),
    };
  }
}

enum TamgaBadgeSize { small, medium, large }

class _Palette {
  const _Palette({required this.bg, required this.fg});
  final Color bg;
  final Color fg;
}
