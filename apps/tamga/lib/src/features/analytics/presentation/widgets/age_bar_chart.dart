import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../domain/herd_analytics.dart';

/// Насны хуваарилалтын бар chart widget.
///
/// [ageDistribution] -аар насны баганан диаграммыг харуулна.
/// Ачаалалт, алдаа, хоосон төлөвүүдийг дэмжинэ.
class AgeBarChart extends StatelessWidget {
  const AgeBarChart({
    super.key,
    required this.ageDistribution,
    this.maxBars = 10,
  });

  /// Ачаалалт төлөв.
  const AgeBarChart.loading({super.key})
    : ageDistribution = null,
      maxBars = 10;

  /// Насны хуваарилалт.
  final List<AgeBucket>? ageDistribution;

  /// Хамгийн их баганын тоо.
  final int maxBars;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Ачаалалт төлөв
    if (ageDistribution == null) {
      return _buildLoadingState(theme);
    }

    // Хоосон төлөв
    if (ageDistribution!.isEmpty) {
      return _buildEmptyState(theme);
    }

    final data = ageDistribution!.take(maxBars).toList();
    final maxCount = data.fold<int>(
      0,
      (max, d) => d.count > max ? d.count : max,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Насны хуваарилалт',
          style: theme.textTheme.titleSmall,
        ),
        const SizedBox(height: 16),
        Expanded(
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: (maxCount * 1.2).ceilToDouble().clamp(1, double.infinity),
              barGroups: _buildBarGroups(data),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: _calcInterval(maxCount),
              ),
              titlesData: FlTitlesData(
                show: true,
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 || index >= data.length) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          data[index].label,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 10,
                          ),
                        ),
                      );
                    },
                    reservedSize: 28,
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 32,
                    getTitlesWidget: (value, meta) {
                      return Text(
                        value.toInt().toString(),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 10,
                        ),
                      );
                    },
                  ),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
              ),
              borderData: FlBorderData(show: false),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    final index = group.x.toInt();
                    if (index < 0 || index >= data.length) {
                      return null;
                    }
                    return BarTooltipItem(
                      '${data[index].label}: ${data[index].count}',
                      TextStyle(
                        color: theme.colorScheme.onPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<BarChartGroupData> _buildBarGroups(List<AgeBucket> data) {
    return data.asMap().entries.map((entry) {
      final index = entry.key;
      final bucket = entry.value;
      return BarChartGroupData(
        x: index,
        barRods: [
          BarChartRodData(
            toY: bucket.count.toDouble(),
            color: _barColor(index),
            width: 16,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(4),
            ),
          ),
        ],
      );
    }).toList();
  }

  Color _barColor(int index) {
    const colors = [
      Colors.blue,
      Colors.teal,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.indigo,
      Colors.cyan,
      Colors.amber,
      Colors.pink,
      Colors.brown,
    ];
    return colors[index % colors.length];
  }

  double _calcInterval(int maxCount) {
    if (maxCount <= 5) return 1;
    if (maxCount <= 20) return 5;
    if (maxCount <= 100) return 20;
    return (maxCount / 5).ceilToDouble();
  }

  Widget _buildLoadingState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(
            'Насны хуваарилалт ачааллаж байна...',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bar_chart, size: 48, color: theme.colorScheme.outline),
          const SizedBox(height: 8),
          Text(
            'Насны мэдээлэл байхгүй',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
