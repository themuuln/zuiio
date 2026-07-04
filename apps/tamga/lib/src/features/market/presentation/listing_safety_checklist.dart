/// Зарын аюулгүй худалдан авалтын жагсаалт.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

/// Аюулгүй худалдан авалтын жагсаалт.
class ListingSafetyChecklist extends StatelessWidget {
  const ListingSafetyChecklist({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Safe buying checklist', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            const _SafetyItem('In-app message ашиглаж эхэл.'),
            const _SafetyItem('Pre-purchase vet exam захиал.'),
            const _SafetyItem('Бичиг баримтын эх хувийг шалга.'),
            const _SafetyItem('Off-platform урьдчилгаа төлбөрөөс болгоомжил.'),
          ],
        ),
      ),
    );
  }
}

class _SafetyItem extends StatelessWidget {
  const _SafetyItem(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.shield_outlined),
      title: Text(label),
    );
  }
}
