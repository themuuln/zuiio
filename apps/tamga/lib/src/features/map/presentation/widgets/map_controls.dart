import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';

/// Floating map controls — zoom, my location, layer switcher.
class MapControls extends StatelessWidget {
  const MapControls({
    super.key,
    required this.onZoomIn,
    required this.onZoomOut,
    required this.onMyLocation,
  });

  final VoidCallback onZoomIn;
  final VoidCallback onZoomOut;
  final VoidCallback onMyLocation;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Zoom in
        _ControlButton(icon: Icons.add, onTap: onZoomIn, colors: colors),
        const SizedBox(height: TamgaSpacing.xs),

        // Zoom out
        _ControlButton(icon: Icons.remove, onTap: onZoomOut, colors: colors),
        const SizedBox(height: TamgaSpacing.sm),

        // My location
        _ControlButton(
          icon: Icons.my_location,
          onTap: onMyLocation,
          colors: colors,
        ),
      ],
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.onTap,
    required this.colors,
  });

  final IconData icon;
  final VoidCallback onTap;
  final TamgaColors colors;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
          border: Border.all(color: colors.outline),
        ),
        child: Icon(icon, size: 20, color: colors.onSurface),
      ),
    );
  }
}
