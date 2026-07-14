import 'dart:io';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_spacing.dart';

/// A button labelled "Байршилд очих" that launches an external maps app with
/// directions to the given [latitude] / [longitude].
///
/// On Android it opens Google Maps; on iOS it opens Apple Maps. When neither
/// coordinate is provided the button is not rendered.
class NavigateToLocationButton extends StatelessWidget {
  const NavigateToLocationButton({
    super.key,
    this.latitude,
    this.longitude,
    this.label = 'Байршилд очих',
  });

  /// Target latitude.
  final double? latitude;

  /// Target longitude.
  final double? longitude;

  /// Custom label. Defaults to 'Байршилд очих'.
  final String label;

  @override
  Widget build(BuildContext context) {
    if (latitude == null || longitude == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: OutlinedButton.icon(
        onPressed: () => _openMapsApp(context),
        icon: const Icon(Icons.navigation_outlined),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
        ),
      ),
    );
  }

  Future<void> _openMapsApp(BuildContext context) async {
    if (latitude == null || longitude == null) return;

    final lat = latitude!;
    final lng = longitude!;
    Uri uri;

    if (Platform.isAndroid) {
      uri = Uri.parse(
        'https://maps.google.com/maps?q=$lat,$lng',
      );
    } else if (Platform.isIOS) {
      uri = Uri.parse(
        'https://maps.apple.com/?ll=$lat,$lng&q=$lat,$lng',
      );
    } else {
      // Fallback for desktop / other platforms
      uri = Uri.parse('https://www.openstreetmap.org/?mlat=$lat&mlon=$lng');
    }

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Газрын зураг нээхэд алдаа гарлаа / Failed to open maps app',
            ),
          ),
        );
      }
    }
  }
}
