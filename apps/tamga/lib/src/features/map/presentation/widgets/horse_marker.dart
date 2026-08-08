import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../../domain/map_enums.dart';

/// Horse marker displayed on the map.
/// Color-coded: green=normal, red=lost, blue=located.
class HorseMarker extends StatelessWidget {
  const HorseMarker({
    super.key,
    required this.name,
    required this.type,
    this.isPulsing = false,
  });

  final String name;
  final HorseMarkerType type;
  final bool isPulsing;

  Color _markerColor(TamgaColors colors) {
    return switch (type) {
      HorseMarkerType.normal => colors.primary,
      HorseMarkerType.lost => colors.error,
      HorseMarkerType.located => const Color(0xFF4A90D9),
    };
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final color = _markerColor(colors);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Marker pin
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: isPulsing ? 12 : 4,
                spreadRadius: isPulsing ? 4 : 0,
              ),
            ],
          ),
          child: const Icon(Icons.pets, size: 18, color: Colors.white),
        ),

        // Label
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: TamgaSpacing.xs,
            vertical: 2,
          ),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            name,
            style: TamgaTypography.caption1(color: colors.onSurface),
          ),
        ),
      ],
    );
  }
}
