import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

/// Platform-adaptive activity indicator.
///
/// Uses [CupertinoActivityIndicator] which looks clean and neutral on all
/// platforms — avoids the distinctly Android look of [CircularProgressIndicator].
///
/// ## Usage
/// ```dart
/// // Default spinner
/// const TamgaSpinner()
///
/// // Larger with custom color
/// TamgaSpinner(size: 32, color: Colors.white)
///
/// // Inline in a button
/// FilledButton(
///   onPressed: null,
///   child: TamgaSpinner(size: 16),
/// )
/// ```
class TamgaSpinner extends StatelessWidget {
  const TamgaSpinner({
    this.size = 20.0,
    this.color,
    this.animating = true,
    super.key,
  });

  /// Diameter of the spinner. Default 20.
  final double size;

  /// Override color. Falls back to `primary` from the theme.
  final Color? color;

  /// Whether the spinner is animating. Set to false to show a static ring.
  final bool animating;

  @override
  Widget build(BuildContext context) {
    final resolvedColor = color ?? TamgaColors.of(context).primary;

    return CupertinoActivityIndicator(
      radius: size / 2,
      color: resolvedColor,
      animating: animating,
    );
  }
}

/// Centered spinner — convenience widget for full-screen loading states.
///
/// Replaces the common pattern:
/// ```dart
/// Center(child: CircularProgressIndicator())
/// ```
class TamgaLoadingView extends StatelessWidget {
  const TamgaLoadingView({this.message, super.key});

  /// Optional loading message shown below the spinner.
  final String? message;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const TamgaSpinner(size: 28),
          if (message != null) ...[
            const SizedBox(height: TamgaSpacing.lg),
            Text(
              message!,
              style: TamgaTypography.subheadline(
                color: colors.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}
