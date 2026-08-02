import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import 'add_horse_screen.dart';

/// Морь бүртгэгдээгүй үеийн хоосон төлөв.
class EmptyHorsesState extends StatelessWidget {
  const EmptyHorsesState({super.key, this.onAddHorse});

  final VoidCallback? onAddHorse;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: colors.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.pets_outlined,
                size: 40,
                color: colors.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Одоогоор морь бүртгээгүй байна',
              style: TamgaTypography.title3(color: colors.foreground),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Эхний морио нэмээд сүргийн мэдээллээ нэг дор хадгалаарай.',
              style: TamgaTypography.body(color: colors.mutedForeground),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            TextButton.icon(
              onPressed:
                  onAddHorse ??
                  () {
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
  const NoSearchResults({super.key, this.query});

  final String? query;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final hasQuery = query != null && query!.isNotEmpty;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 44, color: colors.mutedForeground),
            const SizedBox(height: AppSpacing.md),
            Text(
              hasQuery ? '"${query!}" илэрцгүй' : 'Энэ шүүлтүүрт морь алга',
              style: TamgaTypography.title3(color: colors.foreground),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              hasQuery
                  ? 'Өөр нэрээр хайна уу эсвэл шүүлтийг өөрчилнө үү.'
                  : 'Өөр шүүлтүүр сонгож үзнэ үү.',
              style: TamgaTypography.body(color: colors.mutedForeground),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
