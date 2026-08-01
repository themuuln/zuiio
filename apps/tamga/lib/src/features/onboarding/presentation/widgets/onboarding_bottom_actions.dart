import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';

/// Shared bottom navigation actions used by the onboarding wizard pages.
class OnboardingBottomActions extends StatelessWidget {
  /// Creates the onboarding bottom action bar.
  const OnboardingBottomActions({
    required this.onBack,
    required this.primaryLabel,
    required this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
    this.padding = const EdgeInsets.fromLTRB(
      AppSpacing.lg,
      AppSpacing.sm,
      AppSpacing.lg,
      AppSpacing.lg,
    ),
    super.key,
  });

  /// Called when the back button is pressed.
  final VoidCallback onBack;

  /// Label for the primary action.
  final String primaryLabel;

  /// Called when the primary action is pressed. Null disables it.
  final VoidCallback? onPrimary;

  /// Optional label for the secondary text action.
  final String? secondaryLabel;

  /// Called when the secondary action is pressed.
  final VoidCallback? onSecondary;

  /// Outer spacing around the action bar.
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    final hasSecondaryAction = secondaryLabel != null && onSecondary != null;

    return SafeArea(
      top: false,
      child: Padding(
        padding: padding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 56,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  IconButton(
                    onPressed: onBack,
                    icon: Icon(Icons.chevron_left, color: tc.primary),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      side: BorderSide(color: tc.outline, width: 1),
                      minimumSize: const Size.square(56),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: FilledButton(
                      onPressed: onPrimary,
                      child: Text(
                        primaryLabel,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (hasSecondaryAction) ...[
              const SizedBox(height: AppSpacing.sm),
              Semantics(
                button: true,
                container: true,
                label: secondaryLabel,
                child: SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: TextButton(
                    onPressed: onSecondary,
                    child: ExcludeSemantics(
                      child: Text(
                        secondaryLabel!,
                        style: TextStyle(
                          fontSize: 17,
                          color: tc.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
