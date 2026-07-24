import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../../../../core/widgets/tamga_summary_card.dart';

/// Статистик үзүүлэлтийн карт widget.
///
/// Метрик нэр, утга, хандлага (өсөлт/бууралт) бүхий карт харуулна.
/// Ачаалалт, алдаа, хоосон төлөвүүдийг дэмжинэ.
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.trend,
    this.trendIcon,
    this.trendColor,
    this.icon,
    this.color,
  });

  const StatCard._({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.color,
  }) : trend = null,
       trendIcon = null,
       trendColor = null;

  /// Метрикийн нэр.
  final String label;

  /// Метрикийн утга (текст хэлбэрээр).
  final String value;

  /// Хандлагын текст (жишээ нь "+12%", "-5%").
  final String? trend;

  /// Хандлагын дүрс.
  final IconData? trendIcon;

  /// Хандлагын өнгө.
  final Color? trendColor;

  /// Метрикийн дүрс.
  final IconData? icon;

  /// Метрикийн өнгө.
  final Color? color;

  // ── Төлөвүүд ────────────────────────────────────────────────────────

  /// Ачаалалт төлөв.
  factory StatCard.loading({Key? key}) => StatCard._(
    key: key,
    label: 'Уншиж байна...',
    value: '---',
  );

  /// Алдаа төлөв.
  factory StatCard.error({
    Key? key,
    String message = 'Алдаа гарлаа',
  }) =>
      StatCard._(
        key: key,
        label: message,
        value: '!',
        color: Colors.red,
        icon: Icons.error_outline,
      );

  /// Хоосон төлөв.
  factory StatCard.empty({Key? key, String label = 'Мэдээлэл байхгүй'}) =>
      StatCard._(
        key: key,
        label: label,
        value: '0',
      );

  @override
  Widget build(BuildContext context) {
    // Map trendIcon to trendUp for TamgaSummaryCard
    bool? mappedTrendUp;
    if (trendIcon != null) {
      mappedTrendUp = trendIcon == Icons.trending_up;
    }

    // Provide fallback TamgaColors for environments (e.g. tests) that
    // don't set up the full Tamga theme extension.
    final existingColors = Theme.of(context).extension<TamgaColors>();
    final theme = Theme.of(context).copyWith(
      extensions: [existingColors ?? TamgaColors.light],
    );

    return Theme(
      data: theme,
      child: TamgaSummaryCard(
        label: label,
        value: value,
        icon: icon,
        valueColor: color,
        trend: trend,
        trendUp: mappedTrendUp,
        padding: const EdgeInsets.all(16),
      ),
    );
  }
}
