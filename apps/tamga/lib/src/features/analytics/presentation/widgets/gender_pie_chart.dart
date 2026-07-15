import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../shared/domain/horse.dart';

/// Хүйсээр хуваарилалтын pie chart widget.
///
/// [genderSplit] -аар хүйсний тойрог диаграммыг харуулна.
/// Ачаалалт, алдаа, хоосон төлөвүүдийг дэмжинэ.
class GenderPieChart extends StatelessWidget {
  const GenderPieChart({super.key, required this.genderSplit});

  /// Ачаалалт төлөв.
  const GenderPieChart.loading({super.key}) : genderSplit = null;

  /// Хүйсээр хуваарилалт (HorseGender -> тоо).
  final Map<HorseGender, int>? genderSplit;

  static final _genderColors = <HorseGender, Color>{
    HorseGender.stallion: Colors.brown,
    HorseGender.mare: Colors.pink,
    HorseGender.gelding: Colors.blueGrey,
    HorseGender.foal: Colors.amber,
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Ачаалалт төлөв
    if (genderSplit == null) {
      return _buildLoadingState(theme);
    }

    // Хоосон төлөв
    if (genderSplit!.isEmpty) {
      return _buildEmptyState(theme);
    }

    // Зөвхөн 0-ээс их утгатай хүйсүүдийг харуулах
    final sections = genderSplit!.entries
        .where((e) => e.value > 0)
        .map(
          (e) => PieChartSectionData(
            color: _genderColors[e.key] ?? Colors.grey,
            value: e.value.toDouble(),
            title: '${e.value}',
            radius: 40,
            titleStyle: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onPrimary,
            ),
          ),
        )
        .toList();

    if (sections.isEmpty) {
      return _buildEmptyState(theme);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Хүйсний харьцаа', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        Expanded(
          child: Row(
            children: [
              Expanded(
                child: PieChart(
                  PieChartData(
                    sections: sections,
                    centerSpaceRadius: 20,
                    sectionsSpace: 2,
                  ),
                ),
              ),
              // Легенд
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: genderSplit!.entries
                      .where((e) => e.value > 0)
                      .map(
                        (e) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: _genderColors[e.key] ?? Colors.grey,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${e.key.displayName} (${e.value})',
                                style: theme.textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(
            'Хүйсний мэдээлэл ачааллаж байна...',
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
          Icon(Icons.pie_chart, size: 48, color: theme.colorScheme.outline),
          const SizedBox(height: 8),
          Text(
            'Хүйсний мэдээлэл байхгүй',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
