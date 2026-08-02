import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/map/application/map_providers.dart';
import 'package:tamga/src/features/map/data/map_repository.dart';
import 'package:tamga/src/features/map/domain/search_area.dart';
import 'package:tamga/src/features/map/presentation/geofence_setup_screen.dart';

// ── Mock classes ─────────────────────────────────────────────────────

class MockMapRepository extends Mock implements MapRepository {}

// ── Platform channel mock ───────────────────────────────────────────

void _setupMapLibreMock() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('plugins.flutter.io/maplibre_gl'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'map#waitForMap') return null;
          if (methodCall.method == 'map#create') return 1; // map ID
          if (methodCall.method == 'style#addSource') return null;
          if (methodCall.method == 'style#addLayer') return null;
          if (methodCall.method == 'style#removeLayer') return null;
          if (methodCall.method == 'style#removeSource') return null;
          return null;
        },
      );
}

// ── Test helpers ─────────────────────────────────────────────────────

void main() {
  late MockMapRepository repo;

  setUpAll(() {
    _setupMapLibreMock();
    registerFallbackValue(
      SearchArea(
        id: '',
        name: '',
        centerLat: 47.9,
        centerLng: 106.9,
        radiusKm: 10,
        color: 0xFFF06A2E,
        createdBy: '',
        createdAt: DateTime(2026, 1, 1),
      ),
    );
  });

  setUp(() {
    repo = MockMapRepository();
  });

  // Tall viewport so every section (map picker, save button) is laid out.
  Future<void> useTallViewport(WidgetTester tester) async {
    tester.view.physicalSize = const Size(800, 1800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
  }

  Widget buildApp() {
    return ProviderScope(
      overrides: [mapRepositoryProvider.overrideWithValue(repo)],
      child: MaterialApp(
        theme: AppTheme.light(),
        home: const GeofenceSetupScreen(),
      ),
    );
  }

  group('GeofenceSetupScreen', () {
    testWidgets('renders title, fields, color swatches, map picker and save', (
      tester,
    ) async {
      await useTallViewport(tester);
      await tester.pumpWidget(buildApp());
      await tester.pump();

      expect(find.text('Хайх талбай үүсгэх'), findsOneWidget);
      expect(find.text('Нэр'), findsOneWidget);
      expect(find.text('Радиус: 10 км'), findsOneWidget);
      expect(find.text('Байршил'), findsOneWidget);
      expect(find.text('Хадгалах'), findsOneWidget);
      // 5 preset color swatches
      expect(find.bySemanticsLabel('Өнгө сонгох'), findsNWidgets(5));
      // MapLibre picker is embedded
      expect(find.byType(MapLibreMap), findsOneWidget);
    });

    testWidgets('empty name shows toast and keeps the screen open', (
      tester,
    ) async {
      await useTallViewport(tester);
      await tester.pumpWidget(buildApp());
      await tester.pump();

      await tester.tap(find.text('Хадгалах'));
      await tester.pump();

      expect(find.text('Талбайн нэр оруулна уу'), findsOneWidget);
      expect(find.byType(GeofenceSetupScreen), findsOneWidget);
      verifyNever(() => repo.saveSearchArea(any()));
    });

    testWidgets(
      'saving with a name persists the geofence with UB fallback coords',
      (tester) async {
        await useTallViewport(tester);
        when(() => repo.saveSearchArea(any())).thenAnswer(
          (invocation) async =>
              Result.ok(invocation.positionalArguments.first as SearchArea),
        );

        await tester.pumpWidget(buildApp());
        await tester.pump();

        await tester.enterText(find.byType(TextFormField), 'Гэрийн ойролцоо');
        await tester.tap(find.text('Хадгалах'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 300));

        final saved =
            verify(() => repo.saveSearchArea(captureAny())).captured.single
                as SearchArea;
        expect(saved.name, 'Гэрийн ойролцоо');
        expect(saved.centerLat, 47.9);
        expect(saved.centerLng, 106.9);
        expect(saved.radiusKm, 10.0);
        expect(saved.color, 0xFFF06A2E);
      },
    );

    testWidgets('slider changes the radius shown', (tester) async {
      await useTallViewport(tester);
      await tester.pumpWidget(buildApp());
      await tester.pump();

      // Drag the slider to the right (max radius 50 km)
      await tester.drag(find.byType(Slider), const Offset(400, 0));
      await tester.pump();

      expect(find.text('Радиус: 50 км'), findsOneWidget);
    });
  });
}
