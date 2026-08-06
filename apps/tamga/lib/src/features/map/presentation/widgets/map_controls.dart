import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';
import '../geofence_alerts_screen.dart';
import '../geofence_setup_screen.dart';
import '../herd_tracking_screen.dart';
import '../nearby_horses_screen.dart';
import '../pasture_management_screen.dart';

/// Floating map controls — zoom, my location, extra tools.
///
/// Rendered as one rounded surface so the controls read as a single
/// chrome group over the map instead of floating orphan buttons.
/// The "more" button opens a bottom sheet with the full tool list so
/// the otherwise-unreachable map screens stay discoverable.
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

    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
        border: Border.all(color: colors.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.12),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ControlButton(
            icon: Icons.add,
            tooltip: 'Томруулах',
            onTap: onZoomIn,
          ),
          const _ControlDivider(),
          _ControlButton(
            icon: Icons.remove,
            tooltip: 'Жижигрүүлэх',
            onTap: onZoomOut,
          ),
          const _ControlDivider(),
          _ControlButton(
            icon: Icons.my_location,
            tooltip: 'Байршил',
            onTap: onMyLocation,
          ),
          const _ControlDivider(),
          _ControlButton(
            icon: Icons.more_horiz,
            tooltip: 'Нэмэлт хэрэгслүүд',
            onTap: () => _openToolsSheet(context),
          ),
        ],
      ),
    );
  }

  void _openToolsSheet(BuildContext context) {
    final colors = TamgaColors.of(context);
    final navigator = Navigator.of(context);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: TamgaSpacing.horizontalInset,
              child: Text('Хэрэгслүүд', style: TamgaTypography.title3()),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            _ToolTile(
              icon: Icons.radar_outlined,
              iconColor: colors.primary,
              title: 'Хайх талбай үүсгэх',
              subtitle: 'Геохашааны бүс үүсгэж анхааруулга авах',
              onTap: () {
                Navigator.pop(sheetContext);
                navigator.push(
                  MaterialPageRoute(
                    builder: (_) => const GeofenceSetupScreen(),
                  ),
                );
              },
            ),
            _ToolTile(
              icon: Icons.pets_outlined,
              iconColor: colors.secondary,
              title: 'Ойрхон морьд',
              subtitle: 'Байршлаа хуваалцсан морьдыг харах',
              onTap: () {
                Navigator.pop(sheetContext);
                navigator.push(
                  MaterialPageRoute(builder: (_) => const NearbyHorsesScreen()),
                );
              },
            ),
            _ToolTile(
              icon: Icons.gps_fixed_outlined,
              iconColor: colors.tertiary,
              title: 'Мал Сүрэг',
              subtitle: 'Морьдын GPS мөрдөлтийн төлөв',
              onTap: () {
                Navigator.pop(sheetContext);
                navigator.push(
                  MaterialPageRoute(builder: (_) => const HerdTrackingScreen()),
                );
              },
            ),
            _ToolTile(
              icon: Icons.park_outlined,
              iconColor: const Color(0xFF2E8B57),
              title: 'Бэлчээрийн удирдлага',
              subtitle: 'Бэлчээр үүсгэх, морь хамааруулах',
              onTap: () {
                Navigator.pop(sheetContext);
                navigator.push(
                  MaterialPageRoute(
                    builder: (_) => const PastureManagementScreen(),
                  ),
                );
              },
            ),
            _ToolTile(
              icon: Icons.notifications_active_outlined,
              iconColor: colors.destructive,
              title: 'Анхааруулгууд',
              subtitle: 'Геохашаа, бэлчээрийн түүх',
              onTap: () {
                Navigator.pop(sheetContext);
                navigator.push(
                  MaterialPageRoute(
                    builder: (_) => const GeofenceAlertsScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: TamgaSpacing.md),
          ],
        ),
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Semantics(
      button: true,
      label: tooltip,
      child: Tooltip(
        message: tooltip,
        child: InkWell(
          onTap: onTap,
          child: SizedBox(
            width: 48,
            height: 44,
            child: Icon(icon, size: 22, color: colors.onSurface),
          ),
        ),
      ),
    );
  }
}

class _ControlDivider extends StatelessWidget {
  const _ControlDivider();

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Container(height: 1, width: 28, color: colors.outlineVariant);
  }
}

class _ToolTile extends StatelessWidget {
  const _ToolTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: TamgaSpacing.listCellPadding,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(
                  TamgaSpacing.cornerRadiusSmall,
                ),
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: TamgaSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TamgaTypography.body(weight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TamgaTypography.footnote(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, size: 20, color: colors.outline),
          ],
        ),
      ),
    );
  }
}
