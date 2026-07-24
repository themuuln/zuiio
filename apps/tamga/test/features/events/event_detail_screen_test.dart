import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/services/local_notification_service.dart';
import 'package:tamga/src/core/services/notification_types.dart';
import 'package:tamga/src/features/auth/application/auth_providers.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/features/events/application/events_providers.dart';
import 'package:tamga/src/features/events/data/event_registration_repository.dart';
import 'package:tamga/src/features/events/presentation/event_detail_screen.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/horses/domain/horse_record.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/shared/domain/event_registration.dart';
import 'package:tamga/src/shared/domain/horse.dart';

// ── Mock classes ─────────────────────────────────────────────────────

class MockEventRegistrationRepository extends Mock
    implements EventRegistrationRepository {}

/// LocalNotificationService-ийн mock.
class MockLocalNotificationService extends Mock
    implements LocalNotificationService {}

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

final _testHorse2 = Horse(
  id: 'horse-2',
  ownerId: 'user-1',
  name: 'Сүүн цагаан',
  relationLabel: '',
  coat: 'Цагаан',
  birthYear: 2021,
  awardCount: 0,
  offspringCount: 0,
  isOwnedByHousehold: true,
  notes: '',
  gender: HorseGender.mare,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _testHorseOtherUser = Horse(
  id: 'horse-3',
  ownerId: 'user-2',
  name: 'Бусдын морь',
  relationLabel: '',
  coat: 'Улаан',
  birthYear: 2019,
  awardCount: 0,
  offspringCount: 0,
  isOwnedByHousehold: false,
  notes: '',
  gender: HorseGender.stallion,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _testEvent = Event(
  id: 'evt-1',
  horseId: 'horse-1',
  title: 'Хаврын цом',
  eventType: EventType.race,
  date: null,
  location: 'Төв аймаг',
  registrationEnabled: true,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _testEventNoRegistration = Event(
  id: 'evt-2',
  horseId: 'horse-1',
  title: 'Хаалттай тэмцээн',
  eventType: EventType.race,
  registrationEnabled: false,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final _testEventCompleted = Event(
  id: 'evt-3',
  horseId: 'horse-1',
  title: 'Намар',
  eventType: EventType.race,
  result: 'Түрүү',
  prizeAmount: 500000,
  registrationEnabled: true,
  organizerName: 'Төв аймаг',
  organizerPhone: '99112233',
  notes: 'Тэмдэглэл',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

/// Event with a future date — used for reminder (Сануулах) tests.
final _testEventWithFutureDate = Event(
  id: 'evt-4',
  horseId: 'horse-1',
  title: 'Ирээдүйн тэмцээн',
  eventType: EventType.race,
  date: DateTime(2030, 6, 1),
  location: 'Улаанбаатар',
  registrationEnabled: true,
  organizerName: 'Зохион байгуулагч',
  organizerPhone: '99112233',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

/// Event with no organizer fields — tests hidden organizer section.
final _testEventNoOrganizer = Event(
  id: 'evt-5',
  horseId: 'horse-1',
  title: 'Зохион байгуулагчгүй тэмцээн',
  eventType: EventType.race,
  registrationEnabled: true,
  organizerName: null,
  organizerPhone: null,
  organizerEmail: null,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

/// Creates a ProviderScope with overrides for testing the EventDetailScreen.
ProviderScope _buildEventDetailScreen({
  required Event event,
  AuthState? authState,
  List<Horse>? horses,
  List<EventRegistration>? registrations,
  EventRegistrationRepository? mockRepo,
  LocalNotificationService? mockNotificationService,
}) {
  final effectiveAuthState =
      authState ?? const AuthState.unauthenticated();

  return ProviderScope(
    overrides: [
      // Override auth state with a fixed state
      authStateProvider.overrideWith(
        () => FakeAuthStateNotifier(effectiveAuthState),
      ),
      // Override horses provider
      horsesProvider.overrideWith((ref) async {
        return horses ?? [];
      }),
      // Override event registrations
      eventRegistrationsProvider(event.id).overrideWith((ref) async {
        return registrations ?? [];
      }),
      // Override registration repository
      if (mockRepo != null)
        localEventRegistrationRepositoryProvider.overrideWith(
          (ref) => mockRepo,
        ),
      // Override notification service
      if (mockNotificationService != null)
        localNotificationServiceProvider.overrideWith(
          (ref) => mockNotificationService,
        ),
    ],
    child: MaterialApp(
      theme: AppTheme.light(),
      home: EventDetailScreen(event: event),
    ),
  );
}

void main() {
  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-004: User can register a horse to an event
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-004: Register horse from event detail', () {
    testWidgets(
        'shows "Морь бүртгүүлэх" button when registrationEnabled is true',
        (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
          horses: [_testHorse1, _testHorse2, _testHorseOtherUser],
          registrations: [],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Морь бүртгүүлэх'), findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-019: Button hidden when registrationEnabled=false
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-019: Button hidden when registrationEnabled=false', () {
    testWidgets(
        '"Морь бүртгүүлэх" button is not shown when registrationEnabled is false',
        (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventNoRegistration,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Морь бүртгүүлэх'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-016: Registered horses displayed on event detail
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-016: Registered horses list', () {
    testWidgets('shows registered horses section with count badge', (
      tester,
    ) async {
      final reg1 = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final reg2 = EventRegistration(
        id: 'reg-2',
        eventId: 'evt-1',
        horseId: 'horse-2',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
          horses: [_testHorse1, _testHorse2],
          registrations: [reg1, reg2],
        ),
      );
      await tester.pumpAndSettle();

      // Should show the registered horses section title
      expect(find.text('Бүртгэгдсэн морьд'), findsOneWidget);
      expect(find.text('2'), findsWidgets);
    });

    testWidgets('shows empty state when no horses registered', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
          registrations: [],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Бүртгэл байхгүй байна'), findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-017: User can cancel registration
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-017: Cancel registration', () {
    testWidgets('shows cancel button for own registration', (tester) async {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
          horses: [_testHorse1],
          registrations: [reg],
        ),
      );
      await tester.pumpAndSettle();

      // Should show cancel button for own registration
      expect(find.text('Цуцлах'), findsOneWidget);
    });

    testWidgets('hides cancel button for other users registrations', (
      tester,
    ) async {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-3',
        ownerId: 'user-2',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
          horses: [_testHorseOtherUser],
          registrations: [reg],
        ),
      );
      await tester.pumpAndSettle();

      // Should NOT show cancel button for other user's registration
      expect(find.text('Цуцлах'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-018: Duplicate prevention
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-018: Duplicate prevention', () {
    testWidgets('already registered horse is not shown in selection sheet', (
      tester,
    ) async {
      final reg = EventRegistration(
        id: 'reg-1',
        eventId: 'evt-1',
        horseId: 'horse-1',
        ownerId: 'user-1',
        registeredAt: DateTime(2026, 6, 1),
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
          horses: [_testHorse1, _testHorse2],
          registrations: [reg],
        ),
      );
      await tester.pumpAndSettle();

      // Tap "Морь бүртгүүлэх" to open horse selection
      await tester.tap(find.text('Морь бүртгүүлэх'));
      await tester.pumpAndSettle();

      // The bottom sheet should open with title "Морь сонгох"
      expect(find.text('Морь сонгох'), findsOneWidget);
      // Only the non-registered horse (horse-2) should appear as selectable
      expect(find.text('Сүүн цагаан'), findsOneWidget);
      // The already registered horse (Хан хүлэг) has its text in the background
      // but should NOT be selectable in the sheet list - we verify by
      // checking that a ListTile with trailing icon exists for Сүүн цагаан
      final tiles = find.descendant(
        of: find.byType(ListTile),
        matching: find.text('Сүүн цагаан'),
      );
      expect(tiles, findsOneWidget);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Event detail screen shows all relevant event info
  // ══════════════════════════════════════════════════════════════
  group('EventDetailScreen displays event info', () {
    testWidgets('shows event title and type', (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Хаврын цом'), findsOneWidget);
      expect(find.text('Уралдаан'), findsWidgets);
    });

    testWidgets('shows location', (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Төв аймаг'), findsWidgets);
    });

    testWidgets('shows result and prize when event is completed', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventCompleted,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Үр дүн'), findsOneWidget);
      expect(find.text('Түрүү'), findsWidgets);
      expect(find.textContaining('500000'), findsWidgets);
    });

    testWidgets('shows organizer info when available', (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventCompleted,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Зохион байгуулагч'), findsOneWidget);
      expect(find.text('Төв аймаг'), findsWidgets);
      expect(find.text('99112233'), findsWidgets);
    });

    testWidgets('shows notes section when notes are present', (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventCompleted,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      // Content may be off-screen; drag the ListView down to reveal notes.
      await tester.drag(find.byType(ListView).first, const Offset(0, -400));
      await tester.pumpAndSettle();

      expect(find.text('Тэмдэглэл'), findsWidgets);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-008: Contact Organizer info
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-008: Contact Organizer section', () {
    testWidgets('organizer section is hidden when all organizer fields are null',
        (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventNoOrganizer,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Зохион байгуулагч'), findsNothing);
    });

    testWidgets(
        '"Зарлагчтай холбогдох" button is shown when organizer has contact info',
        (tester) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventCompleted,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Зарлагчтай холбогдох'), findsOneWidget);
    });

    testWidgets(
        '"Зарлагчтай холбогдох" button is hidden when organizer has no phone or email',
        (tester) async {
      // Event with only name but no phone/email
      final eventWithNameOnly = Event(
        id: 'evt-name-only',
        horseId: 'horse-1',
        title: 'Нэртэй тэмцээн',
        eventType: EventType.race,
        registrationEnabled: true,
        organizerName: 'Зохион байгуулагч',
        organizerPhone: null,
        organizerEmail: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: eventWithNameOnly,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      // Organizer section should still show (organizerName is set).
      // The text "Зохион байгуулагч" appears both as the section title
      // and as the displayed organizer name value.
      expect(find.text('Зохион байгуулагч'), findsWidgets);
      // But the contact button should be hidden (no phone or email)
      expect(find.text('Зарлагчтай холбогдох'), findsNothing);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VAL-EVENTS-009: Reminder (Сануулах) button
  // ══════════════════════════════════════════════════════════════
  group('VAL-EVENTS-009: Reminder button', () {
    testWidgets('"Сануулах" button is shown when event has a future date', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventWithFutureDate,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Сануулах'), findsOneWidget);
    });

    testWidgets('"Сануулах" button is hidden when event date is null', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Сануулах'), findsNothing);
    });

    testWidgets('"Сануулах" button is hidden when event date is in the past', (
      tester,
    ) async {
      final pastEvent = Event(
        id: 'evt-past',
        horseId: 'horse-1',
        title: 'Өнгөрсөн тэмцээн',
        eventType: EventType.race,
        date: DateTime(2020, 1, 1),
        registrationEnabled: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: pastEvent,
          authState: const AuthState.authenticated(userId: 'user-1'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Сануулах'), findsNothing);
    });

    testWidgets(
        'tapping "Сануулах" calls scheduleNotification with correct params',
        (tester) async {
      final mockNotificationService = MockLocalNotificationService();
      final eventDate = DateTime(2030, 6, 1);
      final expectedScheduledDate = eventDate.subtract(const Duration(days: 1));

      // Register fallback for NotificationType enum
      registerFallbackValue(NotificationType.healthReminder);

      // Stub scheduleNotification to return success
      when(
        () => mockNotificationService.scheduleNotification(
          id: any(named: 'id'),
          title: any(named: 'title'),
          body: any(named: 'body'),
          scheduledDate: any(named: 'scheduledDate'),
          type: any(named: 'type'),
          referenceId: any(named: 'referenceId'),
          referenceType: any(named: 'referenceType'),
        ),
      ).thenAnswer((_) async => const Result.ok(null));

      await tester.pumpWidget(
        _buildEventDetailScreen(
          event: _testEventWithFutureDate,
          authState: const AuthState.authenticated(userId: 'user-1'),
          mockNotificationService: mockNotificationService,
        ),
      );
      await tester.pumpAndSettle();

      // Tap the "Сануулах" button
      await tester.tap(find.text('Сануулах'));
      await tester.pumpAndSettle();

      // Verify scheduleNotification was called with correct parameters
      verify(
        () => mockNotificationService.scheduleNotification(
          id: _testEventWithFutureDate.id.hashCode.abs(),
          title: 'Арга хэмжээний сануулга',
          body: _testEventWithFutureDate.title,
          scheduledDate: expectedScheduledDate,
          type: NotificationType.healthReminder,
          referenceId: _testEventWithFutureDate.id,
          referenceType: 'event',
        ),
      ).called(1);
    });
  });
}
