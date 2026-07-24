import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../domain/health_analytics.dart';

/// Эрүүл мэндийн хандлагын line chart widget.
///
/// [healthTrends] -аар цаг хугацааны шугаман диаграммыг харуулна.
/// Ачаалалт, алдаа, хоосон төлөвүүдийг дэмжинэ.
class HealthTimelineChart extends StatelessWidget {
  const HealthTimelineChart({super.key, required this.healthTrends});

  /// Ачаалалт төлөв.
  const HealthTimelineChart.loading({super.key}) : healthTrends = null;

  /// Эрүүл мэндийн хандлагын цэгүүд.
  final List<HealthTrendPoint>? healthTrends;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Ачаалалт төлөв
    if (healthTrends == null) {
      return _buildLoadingState(theme);
    }

    // Хоосон төлөв
    if (healthTrends!.isEmpty) {
      return _buildEmptyState(theme);
    }

    // LogType-аар бүлэглэх
    final grouped = <String, List<_TrendEntry>>{};
    final dateSet = <DateTime>{};

    for (final point in healthTrends!) {
      final key = point.logType.displayName;
      grouped.putIfAbsent(key, () => []);
      grouped[key]!.add(_TrendEntry(date: point.date, count: point.count));
      dateSet.add(point.date);
    }

    // Цагийн тэнхлэгийг эрэмбэлэх
    final sortedDates = dateSet.toList()..sort();
    final dateLabels = sortedDates
        .map((d) => '${d.year}-${d.month.toString().padLeft(2, '0')}')
        .toList();

    // Хамгийн их утга
    final maxCount = healthTrends!.fold<int>(
      0,
      (max, p) => p.count > max ? p.count : max,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Эрүүл мэндийн хандлага', style: theme.textTheme.titleSmall),
        const SizedBox(height: 16),
        Expanded(
          child: LineChart(
            LineChartData(
              minX: 0,
              maxX: (sortedDates.length - 1).toDouble().clamp(
                1,
                double.infinity,
              ),
              minY: 0,
              maxY: (maxCount * 1.2).ceilToDouble().clamp(1, double.infinity),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: _calcInterval(maxCount),
              ),
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 32,
                    interval: _calcLabelInterval(sortedDates.length),
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 || index >= dateLabels.length) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          dateLabels[index],
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 9,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 28,
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
              borderData: FlBorderData(
                show: true,
                border: Border(
                  bottom: BorderSide(color: theme.colorScheme.outlineVariant),
                  left: BorderSide(color: theme.colorScheme.outlineVariant),
                ),
              ),
              lineBarsData: _buildLineBars(grouped, sortedDates, theme),
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (touchedSpots) {
                    return touchedSpots.map((spot) {
                      final logType = spot.barIndex < grouped.keys.length
                          ? grouped.keys.elementAt(spot.barIndex)
                          : '';
                      return LineTooltipItem(
                        '$logType: ${spot.y.toInt()}',
                        TextStyle(
                          color: theme.colorScheme.onPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      );
                    }).toList();
                  },
                ),
              ),
            ),
          ),
        ),
        // Легенд
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Wrap(
            spacing: 12,
            runSpacing: 4,
            children: grouped.keys.toList().map((key) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: _lineColor(key),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(key, style: theme.textTheme.bodySmall),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  List<LineChartBarData> _buildLineBars(
    Map<String, List<_TrendEntry>> grouped,
    List<DateTime> sortedDates,
    ThemeData theme,
  ) {
    return grouped.keys.toList().asMap().entries.map((entry) {
      final key = entry.value;
      final data = grouped[key]!;

      final spots = sortedDates.asMap().entries.map((dateEntry) {
        final dateIndex = dateEntry.key;
        final date = dateEntry.value;
        final matching = data.where(
          (d) => d.date.year == date.year && d.date.month == date.month,
        );
        final count = matching.isEmpty ? 0 : matching.first.count;
        return FlSpot(dateIndex.toDouble(), count.toDouble());
      }).toList();

      return LineChartBarData(
        spots: spots,
        isCurved: true,
        color: _lineColor(key),
        barWidth: 2,
        isStrokeCapRound: true,
        dotData: FlDotData(
          show: true,
          getDotPainter: (spot, percent, barData, index) {
            return FlDotCirclePainter(
              radius: 3,
              color: _lineColor(key),
              strokeWidth: 0,
            );
          },
        ),
        belowBarData: BarAreaData(
          show: true,
          color: _lineColor(key).withAlpha(30),
        ),
      );
    }).toList();
  }

  Color _lineColor(String label) {
    const colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.red,
      Colors.purple,
      Colors.teal,
    ];
    final keys = [
      'Вакцинжуулалт',
      'Туулгалт',
      'Эмчилгээ',
      'Эмчийн үзлэг',
      'Эмээл',
      'Тайралт',
    ];
    final idx = keys.indexOf(label);
    return colors[idx >= 0
        ? idx % colors.length
        : label.hashCode % colors.length];
  }

  double _calcInterval(int maxCount) {
    if (maxCount <= 5) return 1;
    if (maxCount <= 20) return 5;
    if (maxCount <= 100) return 20;
    return (maxCount / 5).ceilToDouble();
  }

  double _calcLabelInterval(int totalLabels) {
    if (totalLabels <= 6) return 1;
    if (totalLabels <= 12) return 2;
    return (totalLabels / 6).ceilToDouble();
  }

  Widget _buildLoadingState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(
            'Эрүүл мэндийн хандлага ачааллаж байна...',
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
          Icon(Icons.show_chart, size: 48, color: theme.colorScheme.outline),
          const SizedBox(height: 8),
          Text(
            'Эрүүл мэндийн бүртгэл байхгүй',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Туслах класс: огноо-тоо хослол.
class _TrendEntry {
  const _TrendEntry({required this.date, required this.count});
  final DateTime date;
  final int count;
}
