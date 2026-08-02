import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

/// A branded single-select pill with an explicit 44dp touch target.
///
/// Unlike the stock chip, this keeps the visual density and hit area stable
/// across platforms while exposing selected state to assistive technologies.
class TamgaChoicePill extends StatelessWidget {
  /// Creates a selectable pill.
  const TamgaChoicePill({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  /// Visible and semantic label.
  final String label;

  /// Whether this option is currently selected.
  final bool selected;

  /// Called when the option is activated.
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final backgroundColor = selected
        ? colors.primaryContainer
        : colors.surfaceContainerLow;
    final foregroundColor = selected
        ? colors.onPrimaryContainer
        : colors.onSurfaceVariant;

    return Semantics(
      container: true,
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: Material(
        color: backgroundColor,
        shape: StadiumBorder(
          side: BorderSide(
            color: selected ? colors.primary : colors.outlineVariant,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusPill),
          child: SizedBox(
            height: 44,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    label,
                    maxLines: 1,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: foregroundColor,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
