import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/market_providers.dart';

class PriceHistoryScreen extends ConsumerStatefulWidget {
  const PriceHistoryScreen({super.key});

  @override
  ConsumerState<PriceHistoryScreen> createState() => _PriceHistoryScreenState();
}

class _PriceHistoryScreenState extends ConsumerState<PriceHistoryScreen> {
  String _selectedRegion = 'Бүгд';
  String _selectedLineage = 'Бүгд';

  final List<String> _regions = ['Бүгд', 'Архангай', 'Төв', 'Хэнтий'];
  final List<Map<String, String>> _lineages = [
    {'id': 'Бүгд', 'name': 'Бүх удам'},
    {'id': 'altan-shuurga', 'name': 'Алтан Шуурга'},
    {'id': 'uulen-bor', 'name': 'Үүлэн Бор'},
    {'id': 'shandas-gal', 'name': 'Шандас Гал'},
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final historyAsync = ref.watch(priceHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Үнийн Түүх')),
      body: historyAsync.when(
        data: (records) {
          final filtered = records.where((rec) {
            final matchesRegion =
                _selectedRegion == 'Бүгд' || rec.region == _selectedRegion;
            final matchesLineage =
                _selectedLineage == 'Бүгд' ||
                rec.lineageRootId == _selectedLineage;
            return matchesRegion && matchesLineage;
          }).toList();

          // Calculate statistics
          final count = filtered.length;
          final avgPrice = count > 0
              ? (filtered.map((e) => e.priceAmount).reduce((a, b) => a + b) /
                        count)
                    .round()
              : 0;
          final maxPrice = count > 0
              ? filtered
                    .map((e) => e.priceAmount)
                    .reduce((a, b) => a > b ? a : b)
              : 0;

          return CustomScrollView(
            slivers: [
              SliverPadding(
                padding: AppSpacing.screenPadding,
                sliver: SliverList.list(
                  children: [
                    // Intro Card
                    Card(
                      elevation: 0,
                      color: theme.colorScheme.primaryContainer.withValues(
                        alpha: 0.4,
                      ),
                      child: Padding(
                        padding: AppSpacing.cardPadding,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Зах зээлийн үнийн хандлага',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.onPrimaryContainer,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              'Бүс нутаг болон баталгаат удам зүйн шугамаар урьд өмнө зарагдсан адуунуудын үнийн харьцуулалт.',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onPrimaryContainer
                                    .withValues(alpha: 0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Filter Card
                    Card(
                      child: Padding(
                        padding: AppSpacing.cardPadding,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Шүүлтүүрүүд',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: AppSpacing.md),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedRegion,
                              decoration: const InputDecoration(
                                labelText: 'Бүс нутаг',
                              ),
                              items: _regions.map((region) {
                                return DropdownMenuItem(
                                  value: region,
                                  child: Text(region),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() => _selectedRegion = value);
                                }
                              },
                            ),
                            const SizedBox(height: AppSpacing.md),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedLineage,
                              decoration: const InputDecoration(
                                labelText: 'Удмын шугам',
                              ),
                              items: _lineages.map((lineage) {
                                return DropdownMenuItem(
                                  value: lineage['id']!,
                                  child: Text(lineage['name']!),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() => _selectedLineage = value);
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Summary Stats Card
                    Row(
                      children: [
                        Expanded(
                          child: Card(
                            child: Padding(
                              padding: AppSpacing.cardPadding,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Дундаж үнэ',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.xs),
                                  Text(
                                    count > 0
                                        ? _formatCurrency(avgPrice)
                                        : '0 MNT',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Card(
                            child: Padding(
                              padding: AppSpacing.cardPadding,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Хамгийн өндөр',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.xs),
                                  Text(
                                    count > 0
                                        ? _formatCurrency(maxPrice)
                                        : '0 MNT',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: theme.colorScheme.tertiary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Premium Custom Chart Card
                    if (count > 0)
                      Card(
                        child: Padding(
                          padding: EdgeInsets.all(AppSpacing.xl),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ханшны график үзүүлэлт',
                                style: theme.textTheme.titleMedium,
                              ),
                              const SizedBox(height: AppSpacing.xxl),
                              SizedBox(
                                height: 160,
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    for (final rec in filtered)
                                      Expanded(
                                        child: Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.end,
                                          children: [
                                            Text(
                                              '${(rec.priceAmount / 1000000).toStringAsFixed(1)}M',
                                              style: theme.textTheme.bodySmall
                                                  ?.copyWith(fontSize: 9),
                                            ),
                                            const SizedBox(
                                              height: AppSpacing.xs,
                                            ),
                                            Container(
                                              height:
                                                  (rec.priceAmount /
                                                          maxPrice *
                                                          100)
                                                      .clamp(5, 100),
                                              margin:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: AppSpacing.xs,
                                                  ),
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [
                                                    theme.colorScheme.primary,
                                                    theme.colorScheme.primary
                                                        .withValues(alpha: 0.5),
                                                  ],
                                                  begin: Alignment.topCenter,
                                                  end: Alignment.bottomCenter,
                                                ),
                                                borderRadius:
                                                    const BorderRadius.vertical(
                                                      top: Radius.circular(
                                                        AppSpacing
                                                            .cornerRadiusSmall,
                                                      ),
                                                    ),
                                              ),
                                            ),
                                            const SizedBox(
                                              height: AppSpacing.xs,
                                            ),
                                            Text(
                                              rec.horseName,
                                              style: theme.textTheme.bodySmall
                                                  ?.copyWith(fontSize: 9),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: AppSpacing.md),

                    // History Logs List
                    Text(
                      'Борлуулалтын түүх (${filtered.length})',
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),

                    if (filtered.isEmpty)
                      Card(
                        child: Padding(
                          padding: EdgeInsets.all(AppSpacing.xl),
                          child: const Center(
                            child: Text('Таарах борлуулалтын түүх олдсонгүй.'),
                          ),
                        ),
                      )
                    else
                      for (final rec in filtered) ...[
                        Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor:
                                  theme.colorScheme.primaryContainer,
                              child: Icon(
                                Icons.history,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                            title: Text(
                              rec.horseName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Text(
                              '${rec.region} • ${rec.date.toLocal().toString().split(' ')[0]}\n'
                              'Удам: ${_getLineageName(rec.lineageRootId)}',
                            ),
                            trailing: Text(
                              _formatCurrency(rec.priceAmount),
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                            isThreeLine: true,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                      ],
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const SkeletonLoader(
          items: 4,
          itemBuilder: _priceHistoryItemBuilder,
        ),
        error: (err, stack) => TamgaErrorWidget(
          message: 'Үнийн түүх ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(priceHistoryProvider),
        ),
      ),
    );
  }

  String _getLineageName(String lineageId) {
    for (final lin in _lineages) {
      if (lin['id'] == lineageId) {
        return lin['name']!;
      }
    }
    return lineageId;
  }

  String _formatCurrency(int amount) {
    final value = amount.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '$value MNT';
  }
}

Widget _priceHistoryItemBuilder(BuildContext context, int index) =>
    const SkeletonCardTile();
