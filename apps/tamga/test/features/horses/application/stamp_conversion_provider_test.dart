import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tamga/src/features/horses/application/stamp_conversion_provider.dart';

/// Writes a tiny valid-enough image file so [StampConversionNotifier]
/// can read bytes from it (the edge-function call itself is what fails in
/// the test environment, not the file read).
Future<File> _writeTempImage() async {
  final file = File(
    '${Directory.systemTemp.path}/stamp_'
    '${DateTime.now().microsecondsSinceEpoch}.png',
  );
  await file.writeAsBytes([0x89, 0x50, 0x4E, 0x47]);
  return file;
}

void main() {
  setUpAll(() async {
    // StampConversionNotifier reads Supabase.instance.client at construction.
    // Initialize with a throwaway project and an inert local storage so no
    // platform channels or network are touched.
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: 'https://test.supabase.co',
      publishableKey: 'test-key',
      authOptions: const FlutterAuthClientOptions(
        autoRefreshToken: false,
        detectSessionInUri: false,
        localStorage: EmptyLocalStorage(),
      ),
    );
  });

  group('StampConversionState', () {
    test('defaults to idle with no result or error', () {
      const state = StampConversionState();

      expect(state.isLoading, false);
      expect(state.svgResult, isNull);
      expect(state.error, isNull);
    });

    test('copyWith updates isLoading in both directions', () {
      const state = StampConversionState();

      expect(state.copyWith(isLoading: true).isLoading, true);
      expect(state.copyWith(isLoading: false).isLoading, false);
    });

    test('copyWith sets and preserves svgResult', () {
      const state = StampConversionState();

      final withSvg = state.copyWith(svgResult: '<svg/>');

      expect(withSvg.svgResult, '<svg/>');
      // Copying other fields must not clobber the result.
      expect(withSvg.copyWith(isLoading: true).svgResult, '<svg/>');
      // Passing null intentionally does NOT clear svgResult (uses ??).
      expect(withSvg.copyWith(svgResult: null).svgResult, '<svg/>');
    });

    test('copyWith sets and clears error', () {
      const state = StampConversionState();

      final withError = state.copyWith(error: 'Conversion failed');

      expect(withError.error, 'Conversion failed');
      // Passing null clears the error (unconditional assignment).
      expect(withError.copyWith(error: null).error, isNull);
    });
  });

  group('StampConversionNotifier', () {
    test('starts in the idle state', () {
      final notifier = StampConversionNotifier();

      expect(notifier.state.isLoading, false);
      expect(notifier.state.svgResult, isNull);
      expect(notifier.state.error, isNull);
    });

    test('clear is idempotent and keeps the default state', () {
      final notifier = StampConversionNotifier();

      notifier.clear();
      notifier.clear();

      expect(notifier.state.isLoading, false);
      expect(notifier.state.svgResult, isNull);
      expect(notifier.state.error, isNull);
    });

    test('convertStampImage reports an error and returns null when the '
        'edge function call fails', () async {
      final imageFile = await _writeTempImage();
      addTearDown(() => imageFile.delete());

      final notifier = StampConversionNotifier();

      final svg = await notifier.convertStampImage(imageFile);

      expect(svg, isNull);
      // The failure must leave the notifier out of the loading state with
      // the error surfaced and no partial SVG result.
      expect(notifier.state.isLoading, false);
      expect(notifier.state.error, isNotNull);
      expect(notifier.state.svgResult, isNull);
    });

    test(
      'convertStampImage resets state before starting a conversion',
      () async {
        final imageFile = await _writeTempImage();
        addTearDown(() => imageFile.delete());

        final notifier = StampConversionNotifier();

        // Prime state, then start a conversion: the first thing the notifier
        // does is flip to the loading state (clearing any stale result).
        final future = notifier.convertStampImage(imageFile);

        expect(notifier.state.isLoading, true);
        expect(notifier.state.error, isNull);

        // Drain the pending async work so the test runner sees no leaks.
        await future.then<void>((_) {}, onError: (_) {});
      },
    );
  });

  group('stampConversionProvider', () {
    test('exposes a notifier in the default state', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = container.read(stampConversionProvider);

      expect(state.isLoading, false);
      expect(state.svgResult, isNull);
      expect(state.error, isNull);
    });
  });
}
