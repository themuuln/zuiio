import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// State for stamp conversion process.
class StampConversionState {
  const StampConversionState({
    this.isLoading = false,
    this.svgResult,
    this.error,
  });

  final bool isLoading;
  final String? svgResult;
  final String? error;

  StampConversionState copyWith({
    bool? isLoading,
    String? svgResult,
    String? error,
  }) {
    return StampConversionState(
      isLoading: isLoading ?? this.isLoading,
      svgResult: svgResult ?? this.svgResult,
      error: error,
    );
  }
}

/// Notifier for handling stamp image → SVG conversion.
class StampConversionNotifier extends StateNotifier<StampConversionState> {
  StampConversionNotifier() : super(const StampConversionState());

  final _supabase = Supabase.instance.client;

  /// Convert a stamp image file to SVG using the Edge Function.
  Future<String?> convertStampImage(File imageFile) async {
    state = const StampConversionState(isLoading: true);

    try {
      // Read image and encode to base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Determine mime type from extension
      final extension = imageFile.path.split('.').last.toLowerCase();
      final mimeType = switch (extension) {
        'jpg' || 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'heic' => 'image/heic',
        'heif' => 'image/heif',
        _ => 'image/jpeg',
      };

      // Call Edge Function
      final response = await _supabase.functions.invoke(
        'convert-stamp',
        body: {'image_base64': base64Image, 'mime_type': mimeType},
      );

      if (response.status != 200) {
        final errorData = response.data;
        throw Exception(errorData?['error'] ?? 'Conversion failed');
      }

      final svg = response.data['svg'] as String?;
      if (svg == null || svg.isEmpty) {
        throw Exception('No SVG returned from conversion');
      }

      state = StampConversionState(svgResult: svg);
      return svg;
    } catch (e) {
      state = StampConversionState(error: e.toString());
      return null;
    }
  }

  /// Clear the current result.
  void clear() {
    state = const StampConversionState();
  }
}

/// Provider for stamp conversion.
final stampConversionProvider =
    StateNotifierProvider<StampConversionNotifier, StampConversionState>(
      (ref) => StampConversionNotifier(),
    );
