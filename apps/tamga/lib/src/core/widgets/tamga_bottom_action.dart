import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

/// iOS-style full-width bottom action button — replaces [FloatingActionButton].
///
/// Renders a full-width rounded button pinned to the bottom of the screen,
/// similar to Apple's prominent action pattern (e.g., "Add to Cart" in App Store).
///
/// ## Usage
/// ```dart
/// Scaffold(
///   body: ...,
///   bottomNavigationBar: TamgaBottomAction(
///     label: 'Морь нэмэх',
///     icon: Icons.add,
///     onTap: () => _addHorse(),
///   ),
/// )
/// ```
class TamgaBottomAction extends StatelessWidget {
  const TamgaBottomAction({
    required this.label,
    required this.onTap,
    this.icon,
    this.isLoading = false,
    this.isDestructive = false,
    super.key,
  });

  /// Button label text.
  final String label;

  /// Called when tapped.
  final VoidCallback? onTap;

  /// Optional leading icon.
  final IconData? icon;

  /// Shows a spinner instead of the label when true.
  final bool isLoading;

  /// Uses destructive color when true.
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isDisabled = onTap == null || isLoading;

    final bgColor = isDestructive
        ? colors.destructive
        : isDisabled
        ? colors.surfaceContainerHigh
        : colors.primary;
    final fgColor = isDestructive
        ? colors.onError
        : isDisabled
        ? colors.onSurfaceVariant
        : colors.onPrimary;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          TamgaSpacing.lg,
          TamgaSpacing.sm,
          TamgaSpacing.lg,
          TamgaSpacing.sm,
        ),
        child: GestureDetector(
          onTap: isDisabled ? null : onTap,
          child: AnimatedContainer(
            duration: TamgaMotion.durationNormal,
            curve: TamgaMotion.easingStandard,
            width: double.infinity,
            height: 50,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
            ),
            child: Center(
              child: isLoading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: fgColor,
                      ),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[
                          Icon(icon, color: fgColor, size: 20),
                          const SizedBox(width: TamgaSpacing.sm),
                        ],
                        Text(
                          label,
                          style: TamgaTypography.headline(color: fgColor),
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
