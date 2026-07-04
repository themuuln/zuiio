import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/map_providers.dart';
import '../application/lost_horse_providers.dart';
import '../application/geofence_providers.dart';
import '../application/geofence_monitor.dart';
import '../application/nearby_horses_provider.dart';
import '../domain/lost_horse_report.dart';
import '../domain/search_area.dart';
import '../domain/horse_location.dart';
import 'report_lost_horse_screen.dart';
import 'widgets/map_controls.dart';

/// Main map screen — renders lost horse markers + geofence circles + nearby horses.
class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapLibreMapController? _controller;

  @override
  void initState() {
    super.initState();
    // Start geofence monitoring when map screen is first built.
    ref.read(geofenceMonitorProvider);
  }

  @override
  Widget build(BuildContext context) {
    final currentPos = ref.watch(currentPositionProvider);

    // ── Error listeners: surface errors to user ──
    ref.listen<
      AsyncValue<List<LostHorseReport>>
    >(activeLostHorsesStreamProvider, (prev, next) {
      next.whenData((_) => _renderAllCircles());
      final err = next.error;
      if (err != null) {
        debugPrint('[MapScreen] activeLostHorsesStreamProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Хаяж морийн мэдээлэл ачаалахад алдаа гарлаа / Failed to load lost horse reports',
          );
        }
      }
    });

    // Listen to geofences and refresh circles when data changes
    ref.listen<AsyncValue<List<SearchArea>>>(activeGeofencesProvider, (
      prev,
      next,
    ) {
      next.whenData((_) => _renderAllCircles());
      final err = next.error;
      if (err != null) {
        debugPrint('[MapScreen] activeGeofencesProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Геохашааны мэдээлэл ачаалахад алдаа гарлаа / Failed to load geofences',
          );
        }
      }
    });

    // Listen to nearby horses (real-time) and refresh markers
    ref.listen<AsyncValue<List<HorseLocation>>>(nearbyHorsesStreamProvider, (
      prev,
      next,
    ) {
      next.whenData((_) => _renderAllCircles());
      final err = next.error;
      if (err != null) {
        debugPrint('[MapScreen] nearbyHorsesStreamProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Ойролцоо морьд ачаалахад алдаа гарлаа / Failed to load nearby horses',
          );
        }
      }
    });

    // Listen to offline style errors
    ref.listen<AsyncValue<String>>(offlineStyleProvider, (prev, next) {
      final err = next.error;
      if (err != null) {
        debugPrint('[MapScreen] offlineStyleProvider error: $err');
        // Don't show toast — style fallback is handled upstream
      }
    });

    // ── Track map data errors for inline error UI ──
    // Watching these providers reactively updates hasMapDataError on state change.
    final lostHorsesAsync = ref.watch(activeLostHorsesStreamProvider);
    final geofencesAsync = ref.watch(activeGeofencesProvider);
    final nearbyAsync = ref.watch(nearbyHorsesStreamProvider);

    // Resolve offline/online style
    final styleAsync = ref.watch(offlineStyleProvider);

    /// Whether any map data provider has an error. When true, an error
    /// overlay is shown on the map so users see inline error feedback
    /// instead of silently missing circles/pins.
    final hasMapDataError =
        lostHorsesAsync.hasError ||
        geofencesAsync.hasError ||
        nearbyAsync.hasError ||
        styleAsync.hasError;

    return Scaffold(
      body: Stack(
        children: [
          // ── Map ────────────────────────────────────────────────
          MapLibreMap(
            styleString:
                styleAsync.valueOrNull ??
                'https://tiles.openfreemap.org/styles/liberty',
            initialCameraPosition: const CameraPosition(
              target: LatLng(47.9, 106.9),
              zoom: 11,
            ),
            onMapCreated: _onMapCreated,
            onStyleLoadedCallback: _onStyleLoaded,
            myLocationEnabled: true,
            myLocationTrackingMode: MyLocationTrackingMode.tracking,
          ),

          // ── Error overlay ─────────────────────────────────────
          // Shows inline error feedback instead of silently swallowing
          // data failures (VAL-ERR-011).
          if (hasMapDataError)
            Positioned(
              left: TamgaSpacing.md,
              top: MediaQuery.of(context).padding.top + TamgaSpacing.md,
              right: TamgaSpacing.md,
              child: Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: Padding(
                  padding: const EdgeInsets.all(TamgaSpacing.sm),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 20,
                        color: Theme.of(context).colorScheme.onErrorContainer,
                      ),
                      const SizedBox(width: TamgaSpacing.sm),
                      Expanded(
                        child: Text(
                          'Өгөгдөл ачаалахад алдаа гарлаа / Failed to load map data',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onErrorContainer,
                              ),
                        ),
                      ),
                      const SizedBox(width: TamgaSpacing.xs),
                      InkWell(
                        onTap: _retryLoadMapData,
                        child: Padding(
                          padding: const EdgeInsets.all(TamgaSpacing.xs),
                          child: Icon(
                            Icons.refresh,
                            size: 18,
                            color: Theme.of(
                              context,
                            ).colorScheme.onErrorContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // ── Controls ──────────────────────────────────────────
          Positioned(
            right: TamgaSpacing.md,
            bottom: TamgaSpacing.xxxl + 80,
            child: MapControls(
              onZoomIn: () => _controller?.animateCamera(CameraUpdate.zoomIn()),
              onZoomOut: () =>
                  _controller?.animateCamera(CameraUpdate.zoomOut()),
              onMyLocation: () {
                final pos = currentPos.value;
                if (pos != null) {
                  _controller?.animateCamera(
                    CameraUpdate.newLatLng(LatLng(pos.latitude, pos.longitude)),
                  );
                }
              },
            ),
          ),

          // ── FAB: Report lost horse ────────────────────────────
          Positioned(
            right: TamgaSpacing.md,
            bottom: TamgaSpacing.lg,
            child: FloatingActionButton.extended(
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ReportLostHorseScreen(),
                  ),
                );
                _refreshMarkers();
              },
              backgroundColor: TamgaColors.of(context).error,
              foregroundColor: TamgaColors.of(context).onError,
              icon: const Icon(Icons.search_off, size: 20),
              label: Text(
                'Хаяж морь',
                style: TamgaTypography.subheadline(
                  color: TamgaColors.of(context).onError,
                  weight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Map lifecycle ──────────────────────────────────────────────

  void _onMapCreated(MapLibreMapController controller) {
    _controller = controller;
    // Register circle tap handler
    controller.onCircleTapped.add(_onCircleTapped);
  }

  void _onStyleLoaded() {
    _refreshMarkers();
  }

  Future<void> _refreshMarkers() async {
    _renderAllCircles();
  }

  /// Retry loading all map data providers after an error.
  /// Invalidates providers so they re-fetch from the repository.
  void _retryLoadMapData() {
    ref.invalidate(activeLostHorsesStreamProvider);
    ref.invalidate(activeLostHorsesProvider);
    ref.invalidate(activeGeofencesProvider);
    ref.invalidate(nearbyHorsesStreamProvider);
    ref.invalidate(nearbyHorsesProvider(20.0));
    ref.invalidate(offlineStyleProvider);
  }

  // ── Unified circle renderer ────────────────────────────────────

  Future<void> _renderAllCircles() async {
    final controller = _controller;
    if (controller == null) return;

    await controller.clearCircles();
    await controller.clearSymbols();

    final allCircles = <CircleOptions>[];
    final allCircleData = <Map<String, dynamic>>[];

    // ── Lost horse search radius circles (red) ──────────────────
    final reports =
        ref.read(activeLostHorsesStreamProvider).valueOrNull ??
        ref.read(activeLostHorsesProvider).valueOrNull ??
        [];
    for (final report in reports) {
      allCircles.add(
        CircleOptions(
          geometry: LatLng(report.lastSeenLat, report.lastSeenLng),
          circleRadius: _kmToCircleRadius(report.searchRadiusKm),
          circleColor: '#D4442A',
          circleOpacity: 15,
          circleStrokeWidth: 2,
          circleStrokeColor: '#D4442A',
          circleStrokeOpacity: 60,
        ),
      );
      allCircleData.add({
        'type': 'lost_horse',
        'reportId': report.id,
        'horseName': report.horseName,
      });
    }

    // ── Geofence circles (user-chosen color) ───────────────────
    final areas = ref.read(activeGeofencesProvider).valueOrNull ?? [];
    for (final area in areas) {
      final colorHex =
          '#${area.color.toRadixString(16).padLeft(8, '0').substring(2)}';
      allCircles.add(
        CircleOptions(
          geometry: LatLng(area.centerLat, area.centerLng),
          circleRadius: _kmToCircleRadius(area.radiusKm),
          circleColor: colorHex,
          circleOpacity: 12,
          circleStrokeWidth: 2,
          circleStrokeColor: colorHex,
          circleStrokeOpacity: 80,
        ),
      );
      allCircleData.add({
        'type': 'geofence',
        'areaId': area.id,
        'areaName': area.name,
      });
    }

    // ── Nearby horses (green) ──────────────────────────────────
    final nearby =
        ref.read(nearbyHorsesStreamProvider).valueOrNull ??
        ref.read(nearbyHorsesProvider(20.0)).valueOrNull ??
        [];
    for (final horse in nearby) {
      allCircles.add(
        CircleOptions(
          geometry: LatLng(horse.lat, horse.lng),
          circleRadius: 8,
          circleColor: '#2E8B57',
          circleOpacity: 80,
          circleStrokeWidth: 2,
          circleStrokeColor: '#1a5c38',
          circleStrokeOpacity: 100,
        ),
      );
      allCircleData.add({
        'type': 'nearby',
        'horseId': horse.horseId,
        'horseName': horse.horseName,
      });
    }

    // Render all circles at once (data is positional, not named)
    if (allCircles.isNotEmpty) {
      await controller.addCircles(allCircles, allCircleData);
    }

    // Also add red symbols at lost horse locations for visibility
    if (reports.isNotEmpty) {
      final symbols = <SymbolOptions>[];
      for (final report in reports) {
        symbols.add(
          SymbolOptions(
            geometry: LatLng(report.lastSeenLat, report.lastSeenLng),
            iconSize: 1.2,
          ),
        );
      }
      if (symbols.isNotEmpty) {
        await controller.addSymbols(symbols);
      }
    }
  }

  // ── Circle tap handler ─────────────────────────────────────────

  void _onCircleTapped(Circle circle) {
    final data = circle.data;
    if (data == null) return;

    final type = data['type'] as String?;
    final name = data['horseName'] as String? ?? data['areaName'] as String?;

    if (name == null || !mounted) return;

    final message = type == 'nearby'
        ? '$name — ойрхон байна'
        : type == 'lost_horse'
        ? '$name — хаяж морь'
        : name;
    TamgaToast.show(context, message, duration: const Duration(seconds: 2));
  }

  /// Convert km radius to circle radius in pixels (approximate).
  double _kmToCircleRadius(double km) {
    return km * 2.0;
  }
}
