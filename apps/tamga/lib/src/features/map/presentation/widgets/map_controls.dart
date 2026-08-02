import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../geofence_alerts_screen.dart';
import '../geofence_setup_screen.dart';
import '../herd_tracking_screen.dart';
import '../nearby_horses_screen.dart';
import '../pasture_management_screen.dart';

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
        _ControlButton(
          icon: Icons.add,
          label: 'Томруулах',
          onTap: onZoomIn,
          colors: colors,
        ),
        const SizedBox(height: TamgaSpacing.xs),

        // Zoom out
        _ControlButton(
          icon: Icons.remove,
          label: 'Жижигрүүлэх',
          onTap: onZoomOut,
          colors: colors,
        ),
        const SizedBox(height: TamgaSpacing.sm),

        // My location
        _ControlButton(
          icon: Icons.my_location,
          label: 'Байршил',
          onTap: onMyLocation,
          colors: colors,
        ),
        const SizedBox(height: TamgaSpacing.sm),

        // Extra tools — opens the otherwise-unreachable map screens
        PopupMenuButton<String>(
          tooltip: 'Нэмэлт хэрэгслүүд',
          onSelected: (value) => _openExtraTool(context, value),
          itemBuilder: (context) => const [
            PopupMenuItem(value: 'geofence', child: Text('Хайх талбай үүсгэх')),
            PopupMenuItem(value: 'herd', child: Text('Мал Сүрэг')),
            PopupMenuItem(value: 'nearby', child: Text('Ойрхон морьд')),
            PopupMenuItem(
              value: 'pasture',
              child: Text('Бэлчээрийн удирдлага'),
            ),
            PopupMenuItem(value: 'alerts', child: Text('Анхааруулгууд')),
          ],
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
              border: Border.all(color: colors.outline),
            ),
            child: Icon(Icons.more_vert, size: 20, color: colors.onSurface),
          ),
        ),
      ],
    );
  }

  void _openExtraTool(BuildContext context, String value) {
    final Widget screen = switch (value) {
      'geofence' => const GeofenceSetupScreen(),
      'herd' => const HerdTrackingScreen(),
      'nearby' => const NearbyHorsesScreen(),
      'pasture' => const PastureManagementScreen(),
      _ => const GeofenceAlertsScreen(),
    };
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.colors,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final TamgaColors colors;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Semantics(
        label: label,
        button: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
              border: Border.all(color: colors.outline),
            ),
            child: Icon(icon, size: 20, color: colors.onSurface),
          ),
        ),
      ),
    );
  }
}
