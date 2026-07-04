/// Зарын бичиг баримтын жагсаалт.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

/// Бичиг баримтын жагсаалт.
class ListingDocumentChecklist extends StatelessWidget {
  const ListingDocumentChecklist({required this.documents, super.key});

  /// Бичиг баримтуудын жагсаалт.
  final List<String> documents;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Бичиг баримтын checklist', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            if (documents.isEmpty)
              const Text('Одоогоор баталгаажсан бичиг баримтгүй.')
            else
              for (final document in documents)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.verified_outlined),
                  title: Text(document),
                  subtitle: const Text('Seller provided'),
                ),
          ],
        ),
      ),
    );
  }
}
