import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Section header with title and optional action button.
///
/// Used above grouped lists and card sections.
///
/// ## Usage
/// ```dart
/// TamgaSectionHeader(
///   title: 'Recent Activity',
///   actionLabel: 'See All',
///   onAction: () => navigateToAll(),
/// )
/// ```
class TamgaSectionHeader extends StatelessWidget {
  const TamgaSectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.padding,
    this.titleStyle,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final EdgeInsetsGeometry? padding;
  final TextStyle? titleStyle;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Padding(
      padding:
          padding ??
          const EdgeInsets.fromLTRB(
            TamgaSpacing.lg,
            TamgaSpacing.xxl,
            TamgaSpacing.lg,
            TamgaSpacing.sm,
          ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style:
                  titleStyle ??
                  TamgaTypography.footnote(
                    weight: FontWeight.w600,
                    color: colors.onSurfaceVariant,
                  ),
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: TamgaSpacing.sm),
            Semantics(
              button: true,
              label: actionLabel,
              onTap: onAction,
              child: TextButton(
                onPressed: onAction,
                style: TextButton.styleFrom(
                  foregroundColor: colors.primary,
                  minimumSize: const Size(44, 44),
                  padding: const EdgeInsets.symmetric(
                    horizontal: TamgaSpacing.sm,
                  ),
                  tapTargetSize: MaterialTapTargetSize.padded,
                ),
                child: Text(
                  actionLabel!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
