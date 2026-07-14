import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

/// Дэлгэц дүүрэн pagination алдааны төлөв.
///
/// Ачаалахад алдаа гарсан үед дахин оролдох товчтой дэлгэцийг харуулна.
class PaginationErrorState extends StatelessWidget {
  const PaginationErrorState({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Ачаалахад алдаа гарлаа',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Failed to load',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton.tonalIcon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Дахин оролдох'),
            ),
          ],
        ),
      ),
    );
  }
}
