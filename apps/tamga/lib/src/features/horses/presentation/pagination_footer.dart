import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../shared/data/pagination/pagination_state.dart';
import '../domain/horse_record.dart';

/// Морьдын жагсаалтын доод хэсгийн pagination төлөв.
///
/// Ачаалж байгаа, алдаа гарсан, бүгд ачаалагдсан гэх мэт төлөвүүдийг харуулна.
class PaginationFooter extends StatelessWidget {
  const PaginationFooter({super.key, required this.state, this.onRetry});

  final PaginationState<HorseRecord> state;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // ── Error state ──
    if (state.hasError) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Card(
          color: theme.colorScheme.errorContainer,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 32,
                  color: theme.colorScheme.onErrorContainer,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Ачаалахад алдаа гарлаа',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Failed to load',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onErrorContainer.withValues(
                      alpha: 0.8,
                    ),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.md),
                FilledButton.tonalIcon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Дахин оролдох'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // ── Loading state ──
    if (state.isLoading) {
      return const Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    // ── All loaded ──
    if (!state.hasMore && state.items.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
        child: Center(
          child: Text(
            'Бүх морьд ачаалагдлаа',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
