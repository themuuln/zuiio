import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/data/event_registration_repository.dart';
import 'package:tamga/src/features/events/presentation/add_event_screen.dart';
import 'package:tamga/src/features/events/presentation/event_detail_screen.dart';
import 'package:tamga/src/features/events/presentation/widgets/event_location_picker.dart';
import 'package:tamga/src/features/events/presentation/widgets/event_map_preview.dart';
import 'package:tamga/src/features/events/presentation/widgets/navigate_to_location_button.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/shared/domain/horse.dart';

// ── Mock classes ─────────────────────────────────────────────────────

class MockEventRegistrationRepository extends Mock
    implements EventRegistrationRepository {}

/// A fake AuthStateNotifier that emits a fixed state.
class FakeAuthStateNotifier extends AuthStateNotifier {
  FakeAuthStateNotifier(this._state);

  final AuthState _state;

  @override
  Stream<AuthState> build() async* {
    yield _state;
  }
}

// ── Test helpers ─────────────────────────────────────────────────────

final _testHorse1 = Horse(
  id: 'horse-1',
  ownerId: 'user-1',
  name: 'Хан хүлэг',
  relationLabel: '',
  coat: 'Халиун',
  birthYear: 2020,
  awardCount: 0,
  offspringCount: 0,
  isOwnedByHousehold: true,
  notes: '',
  gender: HorseGender.gelding,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _testEventWithLocation = Event(
  id: 'event-1',
  horseId: 'horse-1',
  title: 'Тест уралдаан',
  eventType: EventType.race,
  date: DateTime(2026, 7, 15),
  location: 'Төв цэнгэлдэх',
  latitude: 47.92,
  longitude: 106.92,
  result: '1-р байр',
  prizeAmount: 500000,
  organizerName: 'Тест зохион байгуулагч',
  organizerPhone: '+976 9911-2233',
  organizerEmail: 'test@example.com',
  isFeatured: false,
  registrationEnabled: true,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _testEventWithoutLocation = Event(
  id: 'event-2',
  horseId: 'horse-1',
  title: 'Тест уралдаан 2',
  eventType: EventType.race,
  date: DateTime(2026, 8, 1),
  location: 'Баянхонгор',
  latitude: null,
  longitude: null,
  isFeatured: false,
  registrationEnabled: false,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

// ── Platform channel mock ───────────────────────────────────────────

void _setupMapLibreMock() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('plugins.flutter.io/maplibre_gl'),
        (MethodCall methodCall) async {
          // Return a simple map creation result
          if (methodCall.method == 'map#waitForMap') {
            return null;
          }
          if (methodCall.method == 'map#create') {
            return 1; // map ID
          }
          if (methodCall.method == 'style#addSource') {
            return null;
          }
          if (methodCall.method == 'style#addLayer') {
            return null;
          }
          if (methodCall.method == 'style#removeLayer') {
            return null;
          }
          if (methodCall.method == 'style#removeSource') {
            return null;
          }
          return null;
        },
      );
}

// ── Overrides builder ───────────────────────────────────────────────

Widget _buildTestApp(Widget child) {
  return ProviderScope(
    overrides: [
      authStateProvider.overrideWith(
        () => FakeAuthStateNotifier(
          const AuthState.authenticated(
            userId: 'user-1',
            email: 'user@test.com',
          ),
        ),
      ),
      localEventRegistrationRepositoryProvider.overrideWithValue(
        MockEventRegistrationRepository(),
      ),
      horsesProvider.overrideWith((ref) async => [_testHorse1]),
      eventRegistrationsProvider(
        _testEventWithLocation.id,
      ).overrideWith((ref) async => []),
      eventRegistrationsProvider(
        _testEventWithoutLocation.id,
      ).overrideWith((ref) async => []),
    ],
    child: MaterialApp(theme: AppTheme.light(), home: child),
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

void main() {
  setUpAll(() {
    _setupMapLibreMock();
  });

  // ══════════════════════════════════════════════════════════════
  // NavigateToLocationButton
  // ══════════════════════════════════════════════════════════════

  group('NavigateToLocationButton', () {
    testWidgets('renders button when lat/lng are provided', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: NavigateToLocationButton(latitude: 47.92, longitude: 106.92),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Байршилд очих'), findsOneWidget);
      expect(find.byIcon(Icons.navigation_outlined), findsOneWidget);
    });

    testWidgets('renders nothing when lat is null', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: NavigateToLocationButton(latitude: null, longitude: 106.92),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Байршилд очих'), findsNothing);
    });

    testWidgets('renders nothing when lng is null', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: NavigateToLocationButton(latitude: 47.92, longitude: null),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Байршилд очих'), findsNothing);
    });

    testWidgets('renders nothing when both are null', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: NavigateToLocationButton(latitude: null, longitude: null),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Байршилд очих'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // EventMapPreview
  // ══════════════════════════════════════════════════════════════

  group('EventMapPreview', () {
    testWidgets('renders MapLibreMap when lat/lng provided', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: EventMapPreview(latitude: 47.92, longitude: 106.92),
          ),
        ),
      );
      await tester.pump();

      // Should render the map
      expect(find.byType(MapLibreMap), findsOneWidget);
      expect(find.text('Байршил'), findsOneWidget);
    });

    testWidgets('renders nothing when lat is null', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: EventMapPreview(latitude: null, longitude: 106.92),
          ),
        ),
      );
      await tester.pump();

      expect(find.byType(MapLibreMap), findsNothing);
      expect(find.text('Байршил'), findsNothing);
    });

    testWidgets('renders nothing when lng is null', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: EventMapPreview(latitude: 47.92, longitude: null),
          ),
        ),
      );
      await tester.pump();

      expect(find.byType(MapLibreMap), findsNothing);
      expect(find.text('Байршил'), findsNothing);
    });

    testWidgets('renders nothing when both are null', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: EventMapPreview(latitude: null, longitude: null),
          ),
        ),
      );
      await tester.pump();

      expect(find.byType(MapLibreMap), findsNothing);
      expect(find.text('Байршил'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // EventLocationPicker
  // ══════════════════════════════════════════════════════════════

  group('EventLocationPicker', () {
    testWidgets('renders MapLibreMap', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(const Scaffold(body: EventLocationPicker())),
      );
      await tester.pump();

      expect(find.byType(MapLibreMap), findsOneWidget);
      expect(
        find.text('Газрын зураг дээр дарж байршлаа тэмдэглээрэй'),
        findsOneWidget,
      );
    });

    testWidgets('shows initial marker when lat/lng provided', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          const Scaffold(
            body: EventLocationPicker(
              initialLatitude: 47.92,
              initialLongitude: 106.92,
            ),
          ),
        ),
      );
      await tester.pump();

      // Should show coordinates and clear button
      expect(find.textContaining('Lat: 47.92'), findsOneWidget);
      expect(find.textContaining('Lng: 106.92'), findsOneWidget);
      expect(find.text('Арилгах'), findsOneWidget);
    });

    testWidgets('shows placeholder text when no location set', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(const Scaffold(body: EventLocationPicker())),
      );
      await tester.pump();

      expect(
        find.text('Газрын зураг дээр дарж байршлаа тэмдэглээрэй'),
        findsOneWidget,
      );
      expect(find.text('Арилгах'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-023: Event form includes location picker
  // ══════════════════════════════════════════════════════════════

  group('VAL-EVENTS-023: AddEventScreen location picker', () {
    testWidgets('location picker is present in event form', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          AddEventScreen(horseId: 'horse-1', horseName: 'Хан хүлэг'),
        ),
      );
      await tester.pump();

      // The location picker section should be visible
      expect(find.text('Байршил сонгох'), findsOneWidget);
      expect(find.byType(EventLocationPicker), findsOneWidget);
      expect(find.byType(MapLibreMap), findsOneWidget);
    });

    testWidgets(
      'location picker preserves initial lat/lng when editing event',
      (tester) async {
        await tester.pumpWidget(
          _buildTestApp(
            AddEventScreen(
              horseId: 'horse-1',
              horseName: 'Хан хүлэг',
              initialEvent: _testEventWithLocation,
            ),
          ),
        );
        await tester.pump();

        // Should show coordinates from the initial event
        expect(find.text('Байршил сонгох'), findsOneWidget);
        expect(find.textContaining('Lat:'), findsOneWidget);
      },
    );
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-007: Event detail shows map preview with marker
  // ══════════════════════════════════════════════════════════════

  group('VAL-EVENTS-007: EventDetailScreen map preview', () {
    testWidgets('shows map preview and nav button when lat/lng present', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildTestApp(EventDetailScreen(event: _testEventWithLocation)),
      );
      // Allow providers to resolve
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Scroll down to find the map preview and navigation button
      await tester.scrollUntilVisible(
        find.text('Байршилд очих'),
        200,
        scrollable: find.byType(Scrollable).first,
      );

      // Map preview should be present
      expect(find.byType(EventMapPreview), findsOneWidget);
      expect(find.byType(MapLibreMap), findsOneWidget);
      expect(find.text('Байршил'), findsOneWidget);
      // Navigation button should be present
      expect(find.text('Байршилд очих'), findsOneWidget);
    });

    testWidgets('hides map preview and nav button when lat/lng null', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildTestApp(EventDetailScreen(event: _testEventWithoutLocation)),
      );
      await tester.pump();

      // Map preview should NOT be present
      expect(find.byType(EventMapPreview), findsNothing);
      expect(find.byType(MapLibreMap), findsNothing);
      expect(find.text('Байршил'), findsNothing);
      // Navigation button should NOT be present
      expect(find.text('Байршилд очих'), findsNothing);
    });
  });
}
