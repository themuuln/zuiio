import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../../../app/theme/app_spacing.dart';

/// A small, non-interactive MapLibre map preview showing a marker at the
/// event's [latitude] / [longitude].
///
/// The map is centred on the marker and zoomed in. User interaction is limited
/// to prevent accidental pan/zoom away from the event location.
///
/// Returns `SizedBox.shrink()` when either coordinate is `null`.
class EventMapPreview extends StatefulWidget {
  const EventMapPreview({
    super.key,
    this.latitude,
    this.longitude,
    this.height = 180,
  });

  /// The event's latitude. When `null` the widget renders nothing.
  final double? latitude;

  /// The event's longitude. When `null` the widget renders nothing.
  final double? longitude;

  /// Height of the map preview. Defaults to 180.
  final double height;

  @override
  State<EventMapPreview> createState() => _EventMapPreviewState();
}

class _EventMapPreviewState extends State<EventMapPreview> {
  MapLibreMapController? _controller;
  bool _mapInitialized = false;

  @override
  void dispose() {
    _controller = null;
    super.dispose();
  }

  void _onMapCreated(MapLibreMapController controller) {
    _controller = controller;
    _mapInitialized = true;
    _addMarker();
  }

  void _onStyleLoaded() {
    _addMarker();
  }

  Future<void> _addMarker() async {
    if (!_mapInitialized || _controller == null) return;
    if (widget.latitude == null || widget.longitude == null) return;

    final controller = _controller!;

    try {
      await controller.addSource(
        'preview-marker-source',
        GeojsonSourceProperties(
          data: {
            'type': 'FeatureCollection',
            'features': [
              {
                'type': 'Feature',
                'geometry': {
                  'type': 'Point',
                  'coordinates': [widget.longitude, widget.latitude],
                },
                'properties': <String, dynamic>{},
              },
            ],
          },
        ),
      );

      await controller.addSymbolLayer(
        'preview-marker-layer',
        'preview-marker-source',
        SymbolLayerProperties(
          iconImage: 'marker-15',
          iconSize: 2.0,
          iconColor: '#E8532E',
          iconAnchor: 'bottom',
        ),
      );
    } catch (_) {
      // Silently handle if layer/source already exist.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.latitude == null || widget.longitude == null) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Байршил', style: theme.textTheme.titleMedium),
        const SizedBox(height: AppSpacing.sm),
        Container(
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          clipBehavior: Clip.antiAlias,
          child: MapLibreMap(
            styleString: 'https://tiles.openfreemap.org/styles/liberty',
            initialCameraPosition: CameraPosition(
              target: LatLng(widget.latitude!, widget.longitude!),
              zoom: 14.0,
            ),
            onMapCreated: _onMapCreated,
            onStyleLoadedCallback: _onStyleLoaded,
            // Disable most interactions so it behaves like a static preview.
            scrollGesturesEnabled: false,
            zoomGesturesEnabled: false,
            rotateGesturesEnabled: false,
            tiltGesturesEnabled: false,
            doubleClickZoomEnabled: false,
          ),
        ),
      ],
    );
  }
}
