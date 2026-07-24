import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/analytics_providers.dart';
import 'export_service.dart';
import 'widgets/age_bar_chart.dart';
import 'widgets/gender_pie_chart.dart';
import 'widgets/health_timeline_chart.dart';
import 'widgets/revenue_chart.dart';
import 'widgets/breeding_success_chart.dart';
import 'widgets/stat_card.dart';

/// Аналитик хянах самбарын хуудас.
///
/// Сүрэг, эрүүл мэнд, санхүү, үржүүлгийн үзүүлэлтүүдийг
/// таб хэлбэрээр харуулна. Хугацааны шүүлтүүр (30d/90d/1y),
/// CSV болон PDF экспорт дэмжинэ.
class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  /// Хугацааны шүүлтүүр: 0 = 30 хоног, 1 = 90 хоног, 2 = 1 жил.
  int _selectedPeriodIndex = 0;

  final _exportService = AnalyticsExportService();
  bool _isExporting = false;

  static const _periodLabels = ['30 хоног', '90 хоног', '1 жил'];
  static const _tabLabels = ['Сүрэг', 'Эрүүл мэнд', 'Санхүү', 'Үржүүлэг'];

  Duration get _selectedDuration {
    switch (_selectedPeriodIndex) {
      case 0:
        return const Duration(days: 30);
      case 1:
        return const Duration(days: 90);
      default:
        return const Duration(days: 365);
    }
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabLabels.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Аналитик'),
        actions: [
          // CSV Export
          IconButton(
            icon: _isExporting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.file_download_outlined),
            tooltip: 'CSV экспорт',
            onPressed: _isExporting ? null : () => _exportCsv(),
          ),
          // PDF Export
          IconButton(
            icon: _isExporting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.picture_as_pdf_outlined),
            tooltip: 'PDF экспорт',
            onPressed: _isExporting ? null : () => _exportPdf(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: _tabLabels.map((label) => Tab(text: label)).toList(),
        ),
      ),
      body: Column(
        children: [
          // ── Хугацааны шүүлтүүр ──
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
            child: SegmentedButton<int>(
              segments: List.generate(
                _periodLabels.length,
                (i) => ButtonSegment(value: i, label: Text(_periodLabels[i])),
              ),
              selected: {_selectedPeriodIndex},
              onSelectionChanged: (selected) {
                setState(() {
                  _selectedPeriodIndex = selected.first;
                });
              },
            ),
          ),

          // ── Табын агуулга ──
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(herdAnalyticsProvider);
                ref.invalidate(healthAnalyticsProvider);
                ref.invalidate(financialAnalyticsProvider);
                ref.invalidate(breedingAnalyticsProvider);
              },
              child: TabBarView(
                controller: _tabController,
                children: [
                  _HerdTab(period: _selectedDuration),
                  _HealthTab(period: _selectedDuration),
                  _FinancialTab(period: _selectedDuration),
                  _BreedingTab(period: _selectedDuration),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _exportCsv() async {
    setState(() => _isExporting = true);
    try {
      final herd = await ref.read(herdAnalyticsProvider.future);
      final health = await ref.read(healthAnalyticsProvider.future);
      final financial = await ref.read(financialAnalyticsProvider.future);
      final breeding = await ref.read(breedingAnalyticsProvider.future);
      await _exportService.exportToCsv(
        herd: herd,
        health: health,
        financial: financial,
        breeding: breeding,
      );
      if (mounted) {
        TamgaToast.showSuccess(context, 'CSV амжилттай экспортлогдлоо');
      }
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'CSV экспортлоход алдаа гарлаа');
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _exportPdf() async {
    setState(() => _isExporting = true);
    try {
      final herd = await ref.read(herdAnalyticsProvider.future);
      final health = await ref.read(healthAnalyticsProvider.future);
      final financial = await ref.read(financialAnalyticsProvider.future);
      final breeding = await ref.read(breedingAnalyticsProvider.future);
      await _exportService.exportToPdf(
        herd: herd,
        health: health,
        financial: financial,
        breeding: breeding,
      );
      if (mounted) {
        TamgaToast.showSuccess(context, 'PDF амжилттай экспортлогдлоо');
      }
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'PDF экспортлоход алдаа гарлаа');
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }
}

// ── Сүргийн таб ───────────────────────────────────────────────

class _HerdTab extends StatelessWidget {
  const _HerdTab({required this.period});

  final Duration period;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        _StatCards(period: period),
        const SizedBox(height: AppSpacing.lg),

        // ── Насны хуваарилалт ──
        _ChartSection(
          title: 'Насны хуваарилалт',
          child: Consumer(
            builder: (context, ref, _) {
              final herdAsync = ref.watch(herdAnalyticsProvider);
              return herdAsync.when(
                data: (herd) => SizedBox(
                  height: 250,
                  child: AgeBarChart(ageDistribution: herd.ageDistribution),
                ),
                loading: () =>
                    const SizedBox(height: 250, child: AgeBarChart.loading()),
                error: (err, _) => _ErrorWidget(
                  message: 'Насны мэдээлэл ачаалахад алдаа гарлаа',
                ),
              );
            },
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Хүйсний харьцаа ──
        _ChartSection(
          title: 'Хүйсний харьцаа',
          child: Consumer(
            builder: (context, ref, _) {
              final herdAsync = ref.watch(herdAnalyticsProvider);
              return herdAsync.when(
                data: (herd) => SizedBox(
                  height: 220,
                  child: GenderPieChart(genderSplit: herd.genderSplit),
                ),
                loading: () => const SizedBox(
                  height: 220,
                  child: GenderPieChart.loading(),
                ),
                error: (_, _) => _ErrorWidget(
                  message: 'Хүйсний мэдээлэл ачаалахад алдаа гарлаа',
                ),
              );
            },
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Үүлдрийн хуваарилалт ──
        _BreedBreakdownCard(),
      ],
    );
  }
}

// ── Эрүүл мэндийн таб ────────────────────────────────────────

class _HealthTab extends StatelessWidget {
  const _HealthTab({required this.period});

  final Duration period;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Эрүүл мэндийн статистик картууд ──
        _HealthStatCards(),
        const SizedBox(height: AppSpacing.lg),

        // ── Вакцинжуулалтын хувь + удахгүй хийх зүйлс ──
        _VaccinationAndDueItems(),
        const SizedBox(height: AppSpacing.lg),

        // ── Эрүүл мэндийн хандлага ──
        _ChartSection(
          title: 'Эрүүл мэндийн хандлага',
          child: Consumer(
            builder: (context, ref, _) {
              final healthAsync = ref.watch(healthAnalyticsProvider);
              return healthAsync.when(
                data: (health) => SizedBox(
                  height: 250,
                  child: HealthTimelineChart(healthTrends: health.healthTrends),
                ),
                loading: () => const SizedBox(
                  height: 250,
                  child: HealthTimelineChart.loading(),
                ),
                error: (_, _) => _ErrorWidget(
                  message: 'Эрүүл мэндийн мэдээлэл ачаалахад алдаа гарлаа',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Санхүүгийн таб ────────────────────────────────────────────

class _FinancialTab extends StatelessWidget {
  const _FinancialTab({required this.period});

  final Duration period;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Санхүүгийн статистик ──
        _FinancialStats(),
        const SizedBox(height: AppSpacing.lg),

        // ── Орлогын хандлага ──
        _ChartSection(
          title: 'Орлогын хандлага',
          child: Consumer(
            builder: (context, ref, _) {
              final financialAsync = ref.watch(financialAnalyticsRpcProvider);
              return financialAsync.when(
                data: (data) {
                  // RPC өгөгдлөөс орлогын мэдээлэл гаргах
                  final revenueByType = data['revenue_by_type'];
                  if (revenueByType is Map && revenueByType.isNotEmpty) {
                    final points = revenueByType.entries
                        .map(
                          (e) => RevenuePoint(
                            label: e.key.toString(),
                            amount: (e.value as num).toDouble(),
                          ),
                        )
                        .toList();
                    return SizedBox(
                      height: 250,
                      child: RevenueChart(revenueData: points),
                    );
                  }
                  return SizedBox(
                    height: 250,
                    child: RevenueChart(revenueData: const []),
                  );
                },
                loading: () =>
                    const SizedBox(height: 250, child: RevenueChart.loading()),
                error: (_, _) => _ErrorWidget(
                  message: 'Орлогын мэдээлэл ачаалахад алдаа гарлаа',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Үржүүлгийн таб (Breeder+ түвшин) ──────────────────────────

class _BreedingTab extends StatelessWidget {
  const _BreedingTab({required this.period});

  final Duration period;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Үржүүлгийн статистик картууд ──
        _BreedingStatCards(),
        const SizedBox(height: AppSpacing.lg),

        // ── Төллөлтийн амжилтын хувь ──
        _ChartSection(
          title: 'Төллөлтийн амжилт',
          child: Consumer(
            builder: (context, ref, _) {
              final breedingAsync = ref.watch(breedingAnalyticsProvider);
              return breedingAsync.when(
                data: (breeding) => SizedBox(
                  height: 220,
                  child: BreedingSuccessChart(
                    successRate: breeding.foalingSuccessRate,
                  ),
                ),
                loading: () => const SizedBox(
                  height: 220,
                  child: BreedingSuccessChart.loading(),
                ),
                error: (_, _) => _ErrorWidget(
                  message: 'Үржүүлгийн мэдээлэл ачаалахад алдаа гарлаа',
                ),
              );
            },
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Хээлтүүлгийн жагсаалт ──
        _BreedingRecordsList(),
      ],
    );
  }
}

// ── Эрүүл мэндийн статистик картууд ──────────────────────────

class _HealthStatCards extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final healthAsync = ref.watch(healthAnalyticsProvider);
    final totalHorses = healthAsync.valueOrNull?.totalHorses ?? 0;
    final vaccinationRate = healthAsync.valueOrNull?.vaccinationRate ?? 0.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 600 ? 4 : 2;
        return GridView.count(
          crossAxisCount: crossAxisCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppSpacing.sm,
          crossAxisSpacing: AppSpacing.sm,
          childAspectRatio: 1.4,
          children: [
            if (healthAsync.isLoading)
              StatCard.loading()
            else if (healthAsync.hasError)
              StatCard.error()
            else ...[
              StatCard(
                label: 'Нийт морьд',
                value: '$totalHorses',
                icon: Icons.pets,
                color: Theme.of(context).colorScheme.primary,
              ),
              StatCard(
                label: 'Вакцинжуулалтын хувь',
                value: '${(vaccinationRate * 100).toStringAsFixed(0)}%',
                icon: Icons.vaccines_outlined,
                color: vaccinationRate >= 0.7 ? Colors.green : Colors.orange,
              ),
              StatCard(
                label: 'Бүртгэлийн тоо',
                value: '${healthAsync.valueOrNull?.healthLogs.length ?? 0}',
                icon: Icons.healing_outlined,
                color: Theme.of(context).colorScheme.tertiary,
              ),
              StatCard(
                label: 'Удахгүй вакцин',
                value:
                    '${healthAsync.valueOrNull?.upcomingDueItems.length ?? 0}',
                icon: Icons.schedule,
                color: Theme.of(context).colorScheme.secondary,
              ),
            ],
          ],
        );
      },
    );
  }
}

// ── Үржүүлгийн статистик картууд ──────────────────────────────

class _BreedingStatCards extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final breedingAsync = ref.watch(breedingAnalyticsProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 600 ? 4 : 2;
        return GridView.count(
          crossAxisCount: crossAxisCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppSpacing.sm,
          crossAxisSpacing: AppSpacing.sm,
          childAspectRatio: 1.4,
          children: [
            if (breedingAsync.isLoading)
              StatCard.loading()
            else if (breedingAsync.hasError)
              StatCard.error()
            else ...[
              StatCard(
                label: 'Идэвхтэй хээлтүүлэг',
                value: '${breedingAsync.value?.activeBreedings ?? 0}',
                icon: Icons.child_care_outlined,
                color: Theme.of(context).colorScheme.primary,
              ),
              StatCard(
                label: 'Нийт хээлтүүлэг',
                value: '${breedingAsync.value?.totalBreedings ?? 0}',
                icon: Icons.pets,
                color: Theme.of(context).colorScheme.secondary,
              ),
              StatCard(
                label: 'Төллөлтийн амжилт',
                value:
                    '${(breedingAsync.value?.foalingSuccessRate ?? 0).toStringAsFixed(1)}%',
                icon: Icons.star_outline,
                color: Colors.green,
              ),
            ],
          ],
        );
      },
    );
  }
}

// ── Статистик картуудын хэсэг ────────────────────────────────

class _StatCards extends ConsumerWidget {
  const _StatCards({required this.period});

  final Duration period;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final herdAsync = ref.watch(herdAnalyticsProvider);
    final healthAsync = ref.watch(healthAnalyticsProvider);
    final financialAsync = ref.watch(financialAnalyticsProvider);
    final totalHorses = herdAsync.valueOrNull?.totalHorses ?? 0;
    final vaccinationRate = healthAsync.valueOrNull?.vaccinationRate ?? 0.0;
    final totalRevenue = financialAsync.valueOrNull?.totalRevenue ?? 0;
    final totalExpenses = financialAsync.valueOrNull?.totalExpenses ?? 0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 600 ? 4 : 2;
        return GridView.count(
          crossAxisCount: crossAxisCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppSpacing.sm,
          crossAxisSpacing: AppSpacing.sm,
          childAspectRatio: 1.4,
          children: [
            if (herdAsync.isLoading)
              StatCard.loading()
            else if (herdAsync.hasError)
              StatCard.error()
            else ...[
              // Нийт морьд
              StatCard(
                label: 'Нийт морьд',
                value: '$totalHorses',
                icon: Icons.pets,
                color: Theme.of(context).colorScheme.primary,
              ),
              // Вакцинжуулалтын хувь
              StatCard(
                label: 'Вакцинжуулалтын хувь',
                value: '${(vaccinationRate * 100).toStringAsFixed(0)}%',
                icon: Icons.vaccines_outlined,
                color: vaccinationRate >= 0.7 ? Colors.green : Colors.orange,
              ),
              // Нийт орлого
              StatCard(
                label: 'Нийт орлого',
                value: '$totalRevenue ₮',
                icon: Icons.trending_up,
                color: Colors.green,
              ),
              // Нийт зарлага
              StatCard(
                label: 'Нийт зарлага',
                value: '$totalExpenses ₮',
                icon: Icons.trending_down,
                color: Colors.red,
              ),
            ],
          ],
        );
      },
    );
  }
}

// ── Үүлдрийн хуваарилалтын карт ──────────────────────────────

class _BreedBreakdownCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final herdAsync = ref.watch(herdAnalyticsProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Үүлдэр / Өнгөний хуваарилалт',
              style: theme.textTheme.titleSmall,
            ),
            const SizedBox(height: AppSpacing.md),
            herdAsync.when(
              data: (herd) {
                if (herd.breedBreakdown.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Text(
                        'Үүлдрийн мэдээлэл байхгүй',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  );
                }
                final total = herd.breedBreakdown.values.fold<int>(
                  0,
                  (a, b) => a + b,
                );
                return Column(
                  children: herd.breedBreakdown.entries.map((entry) {
                    final fraction = entry.value / total;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 100,
                            child: Text(
                              entry.key,
                              style: theme.textTheme.bodySmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: fraction,
                                minHeight: 12,
                                backgroundColor:
                                    theme.colorScheme.surfaceContainerHighest,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          SizedBox(
                            width: 40,
                            child: Text(
                              '${entry.value}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              textAlign: TextAlign.right,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.lg),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (_, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Text(
                    'Үүлдрийн мэдээлэл ачаалахад алдаа гарлаа',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Вакцинжуулалтын хувь ба удахгүй хийх зүйлсийн хэсэг ───

class _VaccinationAndDueItems extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final healthAsync = ref.watch(healthAnalyticsProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Вакцинжуулалт ба удахгүй хийх зүйлс',
              style: theme.textTheme.titleSmall,
            ),
            const SizedBox(height: AppSpacing.md),
            healthAsync.when(
              data: (health) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Вакцинжуулалтын хувь
                  Row(
                    children: [
                      Text(
                        'Вакцинжуулалтын хувь:',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        '${(health.vaccinationRate * 100).toStringAsFixed(0)}%',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: health.vaccinationRate >= 0.7
                              ? Colors.green
                              : Colors.orange,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: health.vaccinationRate,
                      minHeight: 8,
                      backgroundColor:
                          theme.colorScheme.surfaceContainerHighest,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),

                  // Удахгүй хийх шаардлагатай зүйлс
                  if (health.upcomingDueItems.isNotEmpty) ...[
                    Text(
                      'Удахгүй хийх шаардлагатай:',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    ...health.upcomingDueItems.map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            Icon(
                              Icons.schedule,
                              size: 16,
                              color: item.daysUntilDue <= 7
                                  ? Colors.red
                                  : Colors.orange,
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            Expanded(
                              child: Text(
                                '${item.horseName} — ${item.logType.displayName}',
                                style: theme.textTheme.bodySmall,
                              ),
                            ),
                            Text(
                              '${item.daysUntilDue} хоног',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: item.daysUntilDue <= 7
                                    ? Colors.red
                                    : theme.colorScheme.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ] else ...[
                    Text(
                      'Удахгүй хийх зүйлс байхгүй',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.lg),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (_, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Text(
                    'Эрүүл мэндийн мэдээлэл ачаалахад алдаа гарлаа',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Санхүүгийн статистик хэсэг ───────────────────────────────

class _FinancialStats extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final financialAsync = ref.watch(financialAnalyticsProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Санхүүгийн статистик', style: theme.textTheme.titleSmall),
            const SizedBox(height: AppSpacing.md),
            financialAsync.when(
              data: (financial) => Column(
                children: [
                  _FinancialRow(
                    label: 'Нийт орлого',
                    value: '${financial.totalRevenue} ₮',
                    icon: Icons.trending_up,
                    color: Colors.green,
                  ),
                  const Divider(height: 24),
                  _FinancialRow(
                    label: 'Нийт зарлага',
                    value: '${financial.totalExpenses} ₮',
                    icon: Icons.trending_down,
                    color: Colors.red,
                  ),
                  const Divider(height: 24),
                  _FinancialRow(
                    label: 'Хөрөнгө оруулалтын өгөөж',
                    value: financial.roi.isFinite
                        ? '${financial.roi.toStringAsFixed(1)}%'
                        : '—',
                    icon: Icons.percent,
                    color: financial.roi >= 0 ? Colors.green : Colors.red,
                  ),
                  const Divider(height: 24),
                  _FinancialRow(
                    label: 'Идэвхтэй зарууд',
                    value: '${financial.activeListings}',
                    icon: Icons.shopping_bag_outlined,
                    color: theme.colorScheme.primary,
                  ),
                  const Divider(height: 24),
                  _FinancialRow(
                    label: 'Борлуулсан зарууд',
                    value: '${financial.soldListings}',
                    icon: Icons.check_circle_outline,
                    color: Colors.green,
                  ),
                  const Divider(height: 24),
                  _FinancialRow(
                    label: 'Дундаж үнэ',
                    value: '${financial.averageSalePrice} ₮',
                    icon: Icons.attach_money,
                    color: theme.colorScheme.primary,
                  ),
                ],
              ),
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.lg),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (_, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Text(
                    'Санхүүгийн мэдээлэл ачаалахад алдаа гарлаа',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Санхүүгийн мэдээллийн нэг мөр ───────────────────────────

class _FinancialRow extends StatelessWidget {
  const _FinancialRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

// ── Үржүүлгийн хээлтүүлгийн жагсаалт ────────────────────────

class _BreedingRecordsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final breedingAsync = ref.watch(breedingAnalyticsProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Хээлтүүлгийн бүртгэлүүд', style: theme.textTheme.titleSmall),
            const SizedBox(height: AppSpacing.md),
            breedingAsync.when(
              data: (breeding) {
                if (breeding.recentBreedings.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Text(
                        'Хээлтүүлгийн бүртгэл байхгүй',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  );
                }
                return Column(
                  children: breeding.recentBreedings.map((record) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${record.sireName} × ${record.damName}',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Хээлтсэн: ${record.breedingDate.day}/${record.breedingDate.month}/${record.breedingDate.year}',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _statusColor(
                                record.status,
                              ).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              record.statusDisplayName,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: _statusColor(record.status),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.lg),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (_, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Text(
                    'Хээлтүүлгийн мэдээлэл ачаалахад алдаа гарлаа',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'active':
        return Colors.blue;
      case 'foaled':
        return Colors.green;
      case 'aborted':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

// ── Диаграммын хэсгийн wrapper ───────────────────────────────

class _ChartSection extends StatelessWidget {
  const _ChartSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleSmall),
            const SizedBox(height: AppSpacing.md),
            child,
          ],
        ),
      ),
    );
  }
}

// ── Алдааны widget ───────────────────────────────────────────

class _ErrorWidget extends StatelessWidget {
  const _ErrorWidget({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.error,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
