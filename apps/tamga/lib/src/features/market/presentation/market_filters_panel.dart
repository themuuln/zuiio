/// Захын шүүлтүүрийн самбар.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../auth/application/auth_providers.dart';
import '../application/market_providers.dart';
import '../application/saved_search_providers.dart';
import '../domain/market_listing.dart';

/// Захын шүүлтүүрийн самбар.
class MarketFiltersPanel extends ConsumerWidget {
  const MarketFiltersPanel({required this.filters, super.key});

  /// Одоогийн шүүлтүүр.
  final MarketFilters filters;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final notifier = ref.read(marketFiltersProvider.notifier);

    return Card(
      child: Padding(
        padding: AppSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('Шүүлтүүр', style: theme.textTheme.titleMedium),
                ),
                TextButton.icon(
                  onPressed: () => _saveCurrentSearch(context, ref),
                  icon: const Icon(Icons.save_outlined, size: 18),
                  label: const Text('Хайлт хадгалах'),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // зарын төрөл
            Text('Зарын төрөл', style: theme.textTheme.labelLarge),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                ChoiceChip(
                  label: const Text('Бүгд'),
                  selected: filters.saleType == null,
                  onSelected: (_) {
                    notifier.state = filters.copyWith(clearSaleType: true);
                  },
                ),
                for (final value in MarketSaleType.values)
                  ChoiceChip(
                    label: Text(value.label),
                    selected: filters.saleType == value,
                    onSelected: (_) {
                      notifier.state = filters.copyWith(saleType: value);
                    },
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // баталгаажсан худалдагч
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: filters.verifiedOnly,
              title: const Text('Зөвхөн баталгаажсан худалдагч'),
              onChanged: (value) {
                notifier.state = filters.copyWith(verifiedOnly: value);
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // байршил
            TextField(
              decoration: const InputDecoration(
                labelText: 'Байршил (аймаг, сум)',
                hintText: 'Жишээ: Архангай',
                isDense: true,
              ),
              onChanged: (value) {
                notifier.state = filters.copyWith(
                  location: value,
                  clearLocation: value.isEmpty,
                );
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // үнийн хязгаар
            Row(
              children: [
                Expanded(
                  child: TextField(
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Доод үнэ (₮)',
                      isDense: true,
                    ),
                    onChanged: (value) {
                      final price = int.tryParse(value);
                      notifier.state = filters.copyWith(
                        minPrice: price,
                        clearMinPrice: price == null,
                      );
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Дээд үнэ (₮)',
                      isDense: true,
                    ),
                    onChanged: (value) {
                      final price = int.tryParse(value);
                      notifier.state = filters.copyWith(
                        maxPrice: price,
                        clearMaxPrice: price == null,
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // үүл
            TextField(
              decoration: const InputDecoration(
                labelText: 'Үүл (зүс)',
                hintText: 'Жишээ: Хонгор',
                isDense: true,
              ),
              onChanged: (value) {
                notifier.state = filters.copyWith(
                  breed: value,
                  clearBreed: value.isEmpty,
                );
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // эрэмбэлэх
            DropdownButtonFormField<MarketSort>(
              initialValue: filters.sort,
              decoration: const InputDecoration(
                labelText: 'Эрэмбэлэх',
                isDense: true,
              ),
              items: MarketSort.values
                  .map(
                    (sort) =>
                        DropdownMenuItem(value: sort, child: Text(sort.label)),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  notifier.state = filters.copyWith(sort: value);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Одоогийн шүүлтүүрийг хадгалсан хайлт болгон хадгалах dialog харуулах.
Future<void> _saveCurrentSearch(BuildContext context, WidgetRef ref) async {
  final filters = ref.read(marketFiltersProvider);
  final controller = TextEditingController();

  final name = await showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Хайлт хадгалах'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Одоогийн шүүлтүүрийн тохиргоог хадгална уу.'),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: controller,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Хайлтын нэр',
              hintText: 'Жишээ: Хонгор азарга',
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Цуцлах'),
        ),
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
          child: const Text('Хадгалах'),
        ),
      ],
    ),
  );

  if (name != null && name.isNotEmpty) {
    final authAsync = ref.read(authStateProvider);
    final userId = authAsync.valueOrNull?.userId ?? 'local-user';

    final filtersMap = <String, dynamic>{
      if (filters.saleType != null) 'saleType': filters.saleType!.name,
      if (filters.verifiedOnly) 'verifiedOnly': true,
      if (filters.location.isNotEmpty) 'location': filters.location,
      if (filters.minPrice != null) 'minPrice': filters.minPrice,
      if (filters.maxPrice != null) 'maxPrice': filters.maxPrice,
      if (filters.breed.isNotEmpty) 'breed': filters.breed,
      'sort': filters.sort.name,
      if (filters.query.isNotEmpty) 'query': filters.query,
    };

    await ref.read(
      saveSavedSearchProvider(
        SaveSavedSearchParams(
          userId: userId,
          name: name,
          filters: filtersMap,
        ),
      ).future,
    );

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"$name" хайлт хадгалагдлаа')),
      );
    }
  }
}
