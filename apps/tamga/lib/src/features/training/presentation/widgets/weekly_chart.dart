/// Долоо хоногийн дасгалжуулалтын баганан график.
library;

import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';

/// [WeeklyBarChart] — долоо хоногийн дасгалжуулалтын минут харуулах баганан график.
///
/// Долоо хоногийн өдөр бүрийн нийт дасгалжуулалтын минутыг багана хэлбэрээр
/// харуулна. [data] параметрт өдөр тус бүрийн (Даваа-Ням) минутыг дамжуулна.
/// Долоо хоног Даваа гарагаас эхэлнэ (index 0 = Monday).
class WeeklyBarChart extends StatelessWidget {
  const WeeklyBarChart({
    super.key,
    required this.data,
    this.height = 160,
    this.barColor,
    this.backgroundColor,
  });

  /// Долоо хоногийн өдөр тус бүрийн минут. Урт нь 7 байх ёстой
  /// (index 0 = Monday, 6 = Sunday).
  final List<double> data;

  /// Графикийн өндөр.
  final double height;

  /// Баганын өнгө. [null] бол primary өнгө ашиглана.
  final Color? barColor;

  /// Графикийн дэвсгэр өнгө.
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final effectiveBarColor = barColor ?? colors.primary;

    return Container(
      height: height,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: backgroundColor ?? colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
      ),
      child: ClipRect(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final maxVal = data.reduce((a, b) => a > b ? a : b);
            final effectiveMax = maxVal > 0 ? maxVal : 1.0;
            // Reserve space for value label + date label + gaps
            final availableBarHeight = (constraints.maxHeight - 44).clamp(
              0.0,
              double.infinity,
            );

            return Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (i) {
                final value = i < data.length ? data[i] : 0.0;
                final barHeight = (value / effectiveMax) * availableBarHeight;
                final dayLabel = _dayLabels[i];

                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (value > 0)
                        Text(
                          '${value.toInt()}',
                          style: TextStyle(
                            fontSize: 9,
                            color: colors.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      const SizedBox(height: 2),
                      Container(
                        width: 20,
                        height: barHeight.clamp(0.0, availableBarHeight),
                        decoration: BoxDecoration(
                          color: effectiveBarColor.withValues(alpha: 0.7),
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dayLabel,
                        style: TextStyle(
                          fontSize: 10,
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            );
          },
        ),
      ),
    );
  }
}

/// Долоо хоногийн өдрүүдийн товч нэрс (Даваа-Ням).
const _dayLabels = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];
