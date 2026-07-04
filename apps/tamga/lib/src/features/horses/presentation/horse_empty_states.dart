import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import 'add_horse_screen.dart';

/// Морь бүртгэгдээгүй үеийн хоосон төлөв.
class EmptyHorsesState extends StatelessWidget {
  const EmptyHorsesState({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.pets,
                size: 48,
                color: colorScheme.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Морь бүртгэгдээгүй байна',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Эхний морио нэмж эхлээрэй.\nТаны морьдын бүртгэл энд гарч ирнэ.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AddHorseScreen()),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('Морь нэмэх'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Хайлтын үр дүн олдоогүй үеийн төлөв.
class NoSearchResults extends StatelessWidget {
  const NoSearchResults({super.key, required this.query});
  final String query;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 48, color: colorScheme.outline),
            const SizedBox(height: AppSpacing.md),
            Text(
              '"$query" илэрцгүй',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Өөр нэрээр хайна уу эсвэл шүүлтийг өөрчилнө үү.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
