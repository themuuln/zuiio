import 'dart:math' show Point;

import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../../../app/theme/app_spacing.dart';

/// A MapLibre map widget that lets the user pick a location by tapping or
/// long-pressing on the map.
///
/// Displays a draggable marker at the selected coordinates. When
/// [initialLatitude] and [initialLongitude] are provided, the map centers on
/// that position and shows the marker there.
///
/// The [onLocationChanged] callback is fired whenever the selected coordinates
/// change, so the parent form can capture the lat/lng into its state.
class EventLocationPicker extends StatefulWidget {
  const EventLocationPicker({
    super.key,
    this.initialLatitude,
    this.initialLongitude,
    this.onLocationChanged,
  });

  /// Initial latitude (from an existing event being edited).
  final double? initialLatitude;

  /// Initial longitude (from an existing event being edited).
  final double? initialLongitude;

  /// Called whenever the selected location changes.
  final void Function(double latitude, double longitude)? onLocationChanged;

  @override
  State<EventLocationPicker> createState() => _EventLocationPickerState();
}

class _EventLocationPickerState extends State<EventLocationPicker> {
  MapLibreMapController? _controller;
  double? _latitude;
  double? _longitude;
  bool _mapInitialized = false;

  static const _defaultLat = 47.9;
  static const _defaultLng = 106.9;
  static const _defaultZoom = 11.0;

  @override
  void initState() {
    super.initState();
    _latitude = widget.initialLatitude;
    _longitude = widget.initialLongitude;
  }

  @override
  void dispose() {
    _controller = null;
    super.dispose();
  }

  void _onMapCreated(MapLibreMapController controller) {
    _controller = controller;
    _mapInitialized = true;
    _addMarkerIfNeeded();
  }

  void _onStyleLoaded() {
    _addMarkerIfNeeded();
  }

  Future<void> _addMarkerIfNeeded() async {
    if (!_mapInitialized || _controller == null) return;
    if (_latitude != null && _longitude != null) {
      await _setMarker(_latitude!, _longitude!);
    }
  }

  Future<void> _setMarker(double lat, double lng) async {
    final controller = _controller;
    if (controller == null) return;

    try {
      // Remove existing marker source and layer first.
      await _removeMarker();
    } catch (_) {
      // Ignore if they don't exist yet.
    }

    try {
      await controller.addSource(
        'event-marker-source',
        GeojsonSourceProperties(
          data: {
            'type': 'FeatureCollection',
            'features': [
              {
                'type': 'Feature',
                'geometry': {
                  'type': 'Point',
                  'coordinates': [lng, lat],
                },
                'properties': <String, dynamic>{},
              },
            ],
          },
        ),
      );

      await controller.addSymbolLayer(
        'event-marker-layer',
        'event-marker-source',
        SymbolLayerProperties(
          iconImage: 'marker-15',
          iconSize: 2.0,
          iconColor: '#E8532E',
          iconAnchor: 'bottom',
        ),
      );
    } catch (_) {
      // Layer/source may already exist; silently handle.
    }
  }

  Future<void> _removeMarker() async {
    final controller = _controller;
    if (controller == null) return;

    try {
      await controller.removeLayer('event-marker-layer');
      await controller.removeSource('event-marker-source');
    } catch (_) {
      // Ignore if they don't exist.
    }
  }

  void _onMapClick(Point<double> point, LatLng latLng) {
    _setLocation(latLng.latitude, latLng.longitude);
  }

  void _onMapLongClick(Point<double> point, LatLng latLng) {
    _setLocation(latLng.latitude, latLng.longitude);
  }

  Future<void> _setLocation(double lat, double lng) async {
    setState(() {
      _latitude = lat;
      _longitude = lng;
    });

    await _setMarker(lat, lng);

    widget.onLocationChanged?.call(lat, lng);
  }

  void _clearLocation() {
    _removeMarker();
    setState(() {
      _latitude = null;
      _longitude = null;
    });
    // Notify parent with null — we don't call onLocationChanged since
    // the parent should handle null separately.
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasLocation = _latitude != null && _longitude != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text('Байршил сонгох', style: theme.textTheme.titleMedium),
        const SizedBox(height: AppSpacing.sm),

        // ── Map ──
        Container(
          height: 240,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          clipBehavior: Clip.antiAlias,
          child: MapLibreMap(
            styleString: 'https://tiles.openfreemap.org/styles/liberty',
            initialCameraPosition: CameraPosition(
              target: LatLng(
                _latitude ?? _defaultLat,
                _longitude ?? _defaultLng,
              ),
              zoom: _latitude != null ? 14.0 : _defaultZoom,
            ),
            onMapCreated: _onMapCreated,
            onStyleLoadedCallback: _onStyleLoaded,
            onMapClick: _onMapClick,
            onMapLongClick: _onMapLongClick,
          ),
        ),

        // ── Coordinates display ──
        if (hasLocation)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Lat: ${_latitude!.toStringAsFixed(6)}, '
                    'Lng: ${_longitude!.toStringAsFixed(6)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                TextButton.icon(
                  onPressed: _clearLocation,
                  icon: const Icon(Icons.clear, size: 16),
                  label: const Text('Арилгах'),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.error,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                    ),
                  ),
                ),
              ],
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Text(
              'Газрын зураг дээр дарж байршлаа тэмдэглээрэй',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ],
    );
  }
}
