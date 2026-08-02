/// Гүйцэтгэлийн үзүүлэлтүүдийн дэлгэц.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/training_providers.dart';
import '../domain/performance_record.dart';
import 'widgets/performance_chart.dart';

/// Морины гүйцэтгэлийн үзүүлэлтүүд ба тренд график.
class PerformanceScreen extends ConsumerStatefulWidget {
  const PerformanceScreen({required this.horseId, super.key});

  /// Морины ID.
  final String horseId;

  @override
  ConsumerState<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends ConsumerState<PerformanceScreen> {
  MetricType? _selectedMetric;

  @override
  Widget build(BuildContext context) {
    final recordsAsync = ref.watch(performanceRecordsProvider(widget.horseId));

    return Scaffold(
      body: recordsAsync.when(
        loading: () =>
            const TamgaLoadingView(message: 'Гүйцэтгэлийг ачаалж байна'),
        error: (err, _) => TamgaErrorWidget(
          message: 'Гүйцэтгэлийн мэдээлэл авахад алдаа гарлаа: $err',
          onRetry: () =>
              ref.invalidate(performanceRecordsProvider(widget.horseId)),
        ),
        data: (records) => _PerformanceContent(
          horseId: widget.horseId,
          records: records,
          selectedMetric: _selectedMetric,
          onMetricChanged: (metric) => setState(() => _selectedMetric = metric),
          onRefresh: () =>
              ref.invalidate(performanceRecordsProvider(widget.horseId)),
        ),
      ),
      bottomNavigationBar: TamgaBottomAction(
        label: 'Хэмжилт нэмэх',
        icon: Icons.add,
        onTap: () => _showAddMeasurementDialog(context),
      ),
    );
  }

  /// Шинэ хэмжилт нэмэх dialog.
  Future<void> _showAddMeasurementDialog(BuildContext context) async {
    final result = await showDialog<PerformanceRecord>(
      context: context,
      builder: (ctx) => _NewMeasurementDialog(horseId: widget.horseId),
    );

    if (result == null || !mounted) return;

    final repo = ref.read(trainingRepositoryProvider);
    final saveResult = await repo.savePerformance(result);

    if (!mounted) return;

    saveResult.when(
      onSuccess: (_) {
        ref.invalidate(performanceRecordsProvider(widget.horseId));
        TamgaToast.showSuccess(context, 'Хэмжилт амжилттай нэмэгдлээ');
      },
      onFailure: (error) {
        TamgaToast.showError(context, 'Алдаа: ${error.message}');
      },
    );
  }
}

/// Гүйцэтгэлийн агуулга.
class _PerformanceContent extends StatelessWidget {
  const _PerformanceContent({
    required this.horseId,
    required this.records,
    required this.selectedMetric,
    required this.onMetricChanged,
    required this.onRefresh,
  });

  final String horseId;
  final List<PerformanceRecord> records;
  final MetricType? selectedMetric;
  final ValueChanged<MetricType?> onMetricChanged;
  final VoidCallback onRefresh;

  List<PerformanceRecord> get _filteredRecords {
    if (selectedMetric == null) return records;
    return records.where((r) => r.metric == selectedMetric).toList();
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final filtered = _filteredRecords;

    if (records.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            _MetricFilterRow(
              selectedMetric: selectedMetric,
              onMetricChanged: onMetricChanged,
            ),
            const Expanded(
              child: EmptyState(
                icon: Icons.show_chart_outlined,
                title: 'Гүйцэтгэлийн үзүүлэлт байхгүй',
                description:
                    'Гүйцэтгэлийн шинэ үзүүлэлт нэмэхийн тулд доорх товчийг дарна уу.',
                compact: true,
              ),
            ),
          ],
        ),
      );
    }

    final sorted = List<PerformanceRecord>.from(records)
      ..sort((a, b) {
        final ad = a.date ?? DateTime(2020);
        final bd = b.date ?? DateTime(2020);
        return ad.compareTo(bd);
      });
    final chartData = sorted
        .map(
          (r) => DataPoint(
            x: (r.date ?? DateTime(2020)).millisecondsSinceEpoch.toDouble(),
            y: r.value,
          ),
        )
        .toList();
    final xLabels = sorted.map((r) {
      final d = r.date ?? DateTime(2020);
      return '${d.month}/${d.day}';
    }).toList();

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: _MetricFilterRow(
                selectedMetric: selectedMetric,
                onMetricChanged: onMetricChanged,
              ),
            ),
          ),
          if (filtered.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: TamgaCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.trending_up,
                            size: 18,
                            color: colors.primary,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            'Тренд',
                            style: TamgaTypography.headline(fontSize: 15),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      PerformanceTrendChart(
                        dataPoints: chartData,
                        xLabels: xLabels,
                        yLabel: filtered.first.unit != null
                            ? filtered.first.unit!
                            : '',
                        height: 200,
                        lineColor: colors.primary,
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            const SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(
                icon: Icons.filter_alt_outlined,
                title: 'Шүүлтэд тохирох үзүүлэлт байхгүй',
                compact: true,
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.sm)),
          if (filtered.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Text(
                  selectedMetric?.displayName ?? 'Бүх үзүүлэлт',
                  style: TamgaTypography.headline(fontSize: 15),
                ),
              ),
            ),
          if (filtered.isNotEmpty)
            SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final record = filtered[index];
                return _MeasurementTile(record: record);
              }, childCount: filtered.length),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),
        ],
      ),
    );
  }
}

// ── Metric Filter Row ─────────────────────────────────────────────────

class _MetricFilterRow extends StatelessWidget {
  const _MetricFilterRow({
    required this.selectedMetric,
    required this.onMetricChanged,
  });

  final MetricType? selectedMetric;
  final ValueChanged<MetricType?> onMetricChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _FilterChip2(
            label: 'Бүгд',
            selected: selectedMetric == null,
            onTap: () => onMetricChanged(null),
          ),
          const SizedBox(width: AppSpacing.sm),
          for (final metric in MetricType.values)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: _FilterChip2(
                label: metric.displayName,
                selected: selectedMetric == metric,
                onTap: () => onMetricChanged(metric),
              ),
            ),
        ],
      ),
    );
  }
}

class _FilterChip2 extends StatelessWidget {
  const _FilterChip2({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TamgaChoicePill(label: label, selected: selected, onTap: onTap);
  }
}

// ── Measurement Tile ──────────────────────────────────────────────────

class _MeasurementTile extends StatelessWidget {
  const _MeasurementTile({required this.record});

  final PerformanceRecord record;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final effectiveDate = record.date ?? DateTime.now();
    final dateStr =
        '${effectiveDate.year}-${effectiveDate.month.toString().padLeft(2, '0')}-${effectiveDate.day.toString().padLeft(2, '0')}';

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
      child: TamgaCard(
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: colors.secondaryContainer,
              radius: 20,
              child: Icon(
                _metricIcon(record.metric),
                color: colors.onSecondaryContainer,
                size: 20,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    record.metric.displayName,
                    style: TamgaTypography.headline(fontSize: 15),
                  ),
                  Text(
                    '${record.value.toStringAsFixed(1)}${record.unit != null ? ' ${record.unit}' : ''}',
                    style: TamgaTypography.caption1(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  if (record.notes.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      record.notes,
                      style: TamgaTypography.caption2(
                        color: colors.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            Text(
              dateStr,
              style: TamgaTypography.caption2(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

IconData _metricIcon(MetricType metric) => switch (metric) {
  MetricType.speed => Icons.speed,
  MetricType.endurance => Icons.timer_outlined,
  MetricType.weight => Icons.monitor_weight_outlined,
  MetricType.condition => Icons.favorite_outline,
};

// ── New Measurement Dialog ────────────────────────────────────────────

class _NewMeasurementDialog extends StatefulWidget {
  const _NewMeasurementDialog({required this.horseId});

  final String horseId;

  @override
  State<_NewMeasurementDialog> createState() => _NewMeasurementDialogState();
}

class _NewMeasurementDialogState extends State<_NewMeasurementDialog> {
  final _formKey = GlobalKey<FormState>();
  late MetricType _selectedMetric;
  late TextEditingController _valueController;
  late TextEditingController _unitController;
  late TextEditingController _notesController;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedMetric = MetricType.speed;
    _selectedDate = DateTime.now();
    _valueController = TextEditingController();
    _unitController = TextEditingController();
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _valueController.dispose();
    _unitController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Огноо сонгох',
      cancelText: 'Болих',
      confirmText: 'Сонгох',
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Шинэ хэмжилт'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── Metric type ──
              DropdownButtonFormField<MetricType>(
                initialValue: _selectedMetric,
                decoration: InputDecoration(
                  labelText: 'Үзүүлэлт',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                ),
                items: MetricType.values.map((m) {
                  return DropdownMenuItem(value: m, child: Text(m.displayName));
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedMetric = v);
                },
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Value ──
              TextFormField(
                controller: _valueController,
                decoration: InputDecoration(
                  labelText: 'Утга',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                ),
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Заавал бөглөнө үү';
                  if (double.tryParse(v) == null) return 'Тоо оруулна уу';
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Date ──
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Огноо',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
                    suffixIcon: const Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Unit ──
              TextFormField(
                controller: _unitController,
                decoration: InputDecoration(
                  labelText: 'Нэгж (нэмэлт, жишээ нь: км/ц, кг)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Notes ──
              TextFormField(
                controller: _notesController,
                decoration: InputDecoration(
                  labelText: 'Тэмдэглэл (нэмэлт)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Болих'),
        ),
        FilledButton(
          onPressed: () {
            if (!_formKey.currentState!.validate()) return;
            final value = double.parse(_valueController.text);
            final unit = _unitController.text.trim().isEmpty
                ? null
                : _unitController.text.trim();
            final notes = _notesController.text.trim();

            Navigator.of(context).pop(
              PerformanceRecord(
                id: DateTime.now().microsecondsSinceEpoch.toString(),
                horseId: widget.horseId,
                metric: _selectedMetric,
                value: value,
                date: _selectedDate,
                unit: unit,
                notes: notes,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            );
          },
          child: const Text('Хадгалах'),
        ),
      ],
    );
  }
}
