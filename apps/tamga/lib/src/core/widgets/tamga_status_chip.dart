import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';
import 'tamga_badge.dart';

/// Colored status chip for horse/event/health statuses.
///
/// Maps a [TamgaStatus] to a badge with appropriate color.
///
/// ## Usage
/// ```dart
/// TamgaStatusChip(status: TamgaStatus.healthy)
/// TamgaStatusChip(status: TamgaStatus.inTreatment)
/// ```
enum TamgaStatus {
  healthy,
  inTreatment,
  pregnant,
  sold,
  deceased,
  pending,
  active,
  inactive,
  verified,
  unverified,
}

class TamgaStatusChip extends StatelessWidget {
  const TamgaStatusChip({
    super.key,
    required this.status,
    this.size = TamgaBadgeSize.medium,
  });

  final TamgaStatus status;
  final TamgaBadgeSize size;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      TamgaStatus.healthy => ('Эрүүл', const Color(0xFF6B8F6B)),
      TamgaStatus.inTreatment => ('Эмчлэлтэй', const Color(0xFFD4884A)),
      TamgaStatus.pregnant => ('Үүлдэртэй', const Color(0xFF8B6BB0)),
      TamgaStatus.sold => ('Зарсан', const Color(0xFF8E8E8E)),
      TamgaStatus.deceased => ('Нас барсан', const Color(0xFFD4442A)),
      TamgaStatus.pending => ('Хүлээгдэж буй', const Color(0xFFD4884A)),
      TamgaStatus.active => ('Идэвхтэй', const Color(0xFF6B8F6B)),
      TamgaStatus.inactive => ('Идэвхгүй', const Color(0xFF8E8E8E)),
      TamgaStatus.verified => ('Баталгаажсан', const Color(0xFF6B8F6B)),
      TamgaStatus.unverified => ('Баталгаажаагүй', const Color(0xFFD4884A)),
    };

    return _StatusChip(label: label, color: color, size: size);
  }
}

/// Custom colored chip — when you need a specific label + color.
class TamgaColorChip extends StatelessWidget {
  const TamgaColorChip({
    super.key,
    required this.label,
    required this.color,
    this.size = TamgaBadgeSize.medium,
    this.icon,
  });

  final String label;
  final Color color;
  final TamgaBadgeSize size;
  final IconData? icon;

  @override
  Widget build(BuildContext context) =>
      _StatusChip(label: label, color: color, size: size, icon: icon);
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.color,
    required this.size,
    this.icon,
  });

  final String label;
  final Color color;
  final TamgaBadgeSize size;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final (fontSize, horizontalPad, verticalPad, iconSize) = switch (size) {
      TamgaBadgeSize.small => (11.0, 8.0, 2.0, 12.0),
      TamgaBadgeSize.medium => (13.0, 10.0, 4.0, 14.0),
      TamgaBadgeSize.large => (15.0, 12.0, 6.0, 16.0),
    };

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPad,
        vertical: verticalPad,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: iconSize, color: color),
            SizedBox(width: horizontalPad * 0.4),
          ],
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          SizedBox(width: horizontalPad * 0.4),
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              color: color,
              letterSpacing: 0.02,
            ),
          ),
        ],
      ),
    );
  }
}
