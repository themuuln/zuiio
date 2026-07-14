import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Reusable empty state widget for lists with no items.
///
/// Shows an icon, title, description, and optional action button.
///
/// ## Usage
/// ```dart
/// EmptyState(
///   icon: Icons.pets,
///   title: 'No horses yet',
///   description: 'Add your first horse to get started.',
///   actionLabel: 'Add Horse',
///   onAction: () => context.push('/horses/add'),
/// )
/// ```
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.description,
    this.actionLabel,
    this.onAction,
    this.iconSize = 64,
    this.iconColor,
    this.compact = false,
  });

  final IconData icon;
  final String title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;
  final double iconSize;
  final Color? iconColor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final effectiveIconColor =
        iconColor ?? colors.primary.withValues(alpha: 0.5);
    final effectiveSpacing = compact ? TamgaSpacing.lg : TamgaSpacing.xxxl;

    return Center(
      child: Padding(
        padding: EdgeInsets.all(effectiveSpacing),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: iconSize, color: effectiveIconColor),
            SizedBox(height: effectiveSpacing),
            Text(
              title,
              style: TamgaTypography.title3(color: colors.onSurface),
              textAlign: TextAlign.center,
            ),
            if (description != null) ...[
              SizedBox(height: TamgaSpacing.sm),
              Text(
                description!,
                style: TamgaTypography.body(color: colors.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              SizedBox(height: effectiveSpacing),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Empty state with illustration for onboarding screens.
class EmptyStateIllustration extends StatelessWidget {
  const EmptyStateIllustration({
    super.key,
    required this.illustration,
    required this.title,
    this.description,
    this.actionLabel,
    this.onAction,
  });

  final Widget illustration;
  final String title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(TamgaSpacing.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 240, maxHeight: 240),
              child: illustration,
            ),
            const SizedBox(height: TamgaSpacing.xxxl),
            Text(
              title,
              style: TamgaTypography.title2(color: colors.onSurface),
              textAlign: TextAlign.center,
            ),
            if (description != null) ...[
              const SizedBox(height: TamgaSpacing.md),
              Text(
                description!,
                style: TamgaTypography.body(color: colors.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: TamgaSpacing.xxl),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Inline empty state for lists.
class InlineEmptyState extends StatelessWidget {
  const InlineEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.description,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: icon,
      title: title,
      description: description,
      actionLabel: actionLabel,
      onAction: onAction,
      compact: true,
      iconSize: 48,
    );
  }
}
