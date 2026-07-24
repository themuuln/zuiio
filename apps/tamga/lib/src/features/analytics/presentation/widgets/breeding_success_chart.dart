import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

/// Төллөлтийн амжилтын хувийн donut chart widget.
///
/// [successRate] -аар төллөлтийн амжилтын тойрог диаграммыг харуулна.
/// Ачаалалт, алдаа, хоосон төлөвүүдийг дэмжинэ.
class BreedingSuccessChart extends StatelessWidget {
  const BreedingSuccessChart({super.key, required this.successRate});

  /// Ачаалалт төлөв.
  const BreedingSuccessChart.loading({super.key}) : successRate = null;

  /// Амжилтын хувь (0.0 – 100.0).
  final double? successRate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (successRate == null) return _buildLoadingState(theme);

    final rate = successRate!;
    final displayRate = rate.toStringAsFixed(1);

    // Өнгөнүүдийг амжилтын хувь тус бүрт тохируулах
    final Color successColor;
    if (rate >= 70) {
      successColor = Colors.green;
    } else if (rate >= 40) {
      successColor = Colors.orange;
    } else {
      successColor = Colors.red;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Expanded(
          child: Stack(
            alignment: Alignment.center,
            children: [
              PieChart(
                PieChartData(
                  sectionsSpace: 0,
                  centerSpaceRadius: 44,
                  sections: [
                    PieChartSectionData(
                      value: rate,
                      color: successColor,
                      radius: 20,
                      showTitle: false,
                    ),
                    PieChartSectionData(
                      value: rate < 100 ? 100 - rate : 0,
                      color: theme.colorScheme.surfaceContainerHighest,
                      radius: 20,
                      showTitle: false,
                    ),
                  ],
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$displayRate%',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: successColor,
                    ),
                  ),
                  Text(
                    'Амжилт',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _LegendItem(color: successColor, label: 'Төллөсөн'),
            const SizedBox(width: 16),
            _LegendItem(
              color: theme.colorScheme.surfaceContainerHighest,
              label: 'Бусад',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLoadingState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(
            strokeWidth: 2,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(height: 12),
          Text(
            'Амжилтын хувь тооцоолж байна...',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}
