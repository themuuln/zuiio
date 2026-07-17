import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

/// Орлогын хандлагын line chart widget.
///
/// [revenueData] -аар цаг хугацааны орлогын шугаман диаграммыг харуулна.
/// Ачаалалт, алдаа, хоосон төлөвүүдийг дэмжинэ.
class RevenueChart extends StatelessWidget {
  const RevenueChart({super.key, required this.revenueData});

  /// Ачаалалт төлөв.
  const RevenueChart.loading({super.key}) : revenueData = null;

  /// Орлогын өгөгдөл (огоноо -> орлого).
  final List<RevenuePoint>? revenueData;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (revenueData == null) return _buildLoadingState(theme);
    if (revenueData!.isEmpty) return _buildEmptyState(theme);

    final data = revenueData!;
    final maxY = data.fold<double>(
      0,
      (max, d) => d.amount > max ? d.amount : max,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: LineChart(
            LineChartData(
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: _calcInterval(maxY),
                getDrawingHorizontalLine: (value) => FlLine(
                  color: theme.colorScheme.outlineVariant,
                  strokeWidth: 0.5,
                ),
              ),
              titlesData: FlTitlesData(
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 50,
                    getTitlesWidget: (value, meta) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 4),
                        child: Text(
                          _formatAmount(value),
                          style: theme.textTheme.labelSmall,
                        ),
                      );
                    },
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 28,
                    interval: _calcLabelInterval(data.length),
                    getTitlesWidget: (value, meta) {
                      final idx = value.toInt();
                      if (idx < 0 || idx >= data.length) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          data[idx].label,
                          style: theme.textTheme.labelSmall,
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: List.generate(
                    data.length,
                    (i) => FlSpot(i.toDouble(), data[i].amount),
                  ),
                  isCurved: true,
                  color: theme.colorScheme.primary,
                  barWidth: 2.5,
                  dotData: FlDotData(
                    show: true,
                    getDotPainter: (spot, _, _, _) => FlDotCirclePainter(
                      radius: 3,
                      color: theme.colorScheme.primary,
                      strokeWidth: 1.5,
                      strokeColor: theme.colorScheme.surface,
                    ),
                  ),
                  belowBarData: BarAreaData(
                    show: true,
                    color: theme.colorScheme.primary.withValues(alpha: 0.1),
                  ),
                ),
              ],
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (touchedSpots) {
                    return touchedSpots.map((spot) {
                      final idx = spot.x.toInt();
                      return LineTooltipItem(
                        '${data[idx].label}\n₮${_formatAmount(spot.y)}',
                        TextStyle(
                          color: theme.colorScheme.onPrimary,
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
      ],
    );
  }

  double _calcInterval(double maxVal) {
    if (maxVal <= 0) return 1;
    final rough = maxVal / 4;
    final magnitude = _pow10(rough.ceil());
    return (rough / magnitude).ceilToDouble() * magnitude;
  }

  double _calcLabelInterval(int totalLabels) {
    if (totalLabels <= 6) return 1;
    return (totalLabels / 6).ceilToDouble();
  }

  double _pow10(int n) {
    var result = 1.0;
    for (var i = 0; i < n; i++) {
      result *= 10;
    }
    return result;
  }

  String _formatAmount(double value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    }
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(0)}K';
    }
    return value.toStringAsFixed(0);
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
            'Орлогын мэдээлэл ачаалж байна...',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.attach_money_outlined,
            size: 48,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 12),
          Text(
            'Орлогын мэдээлэл байхгүй',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Орлогын цэг.
class RevenuePoint {
  const RevenuePoint({required this.label, required this.amount});

  /// Тэмдэглэгээ (сар, улирал гэх мэт).
  final String label;

  /// Орлогын дүн (₮).
  final double amount;
}
