import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/services/application/provider_dashboard_providers.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_booking_status.dart';
import 'package:tamga/src/features/services/domain/service_provider.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';
import 'package:tamga/src/features/services/presentation/provider_dashboard_screen.dart';

/// Helper to create a ProviderScope wrapping ProviderDashboardScreen.
Widget createProviderDashboardScreen({
  ServiceProvider? provider,
  List<ServiceBooking> upcomingBookings = const [],
  List<ServiceBooking> pastBookings = const [],
}) {
  return ProviderScope(
    overrides: [
      myServiceProviderProfileProvider.overrideWith((ref) async {
        return provider;
      }),
      providerUpcomingBookingsProvider.overrideWith((ref) async {
        return upcomingBookings;
      }),
      providerPastBookingsProvider.overrideWith((ref) async {
        return pastBookings;
      }),
    ],
    child: MaterialApp(
      theme: AppTheme.light(),
      home: const ProviderDashboardScreen(),
    ),
  );
}

void main() {
  group('ProviderDashboardScreen', () {
    final now = DateTime(2026, 6, 21);

    ServiceBooking createTestBooking({
      String id = 'booking-1',
      String providerId = 'provider-1',
      ServiceBookingStatus status = ServiceBookingStatus.pending,
      bool isUpcoming = true,
    }) {
      return ServiceBooking(
        id: id,
        userId: 'user-1',
        providerId: providerId,
        providerType: ServiceProviderType.photographer,
        serviceType: 'photo_session',
        horseIds: ['horse-1'],
        locationAimag: 'Архангай',
        bookingDate: isUpcoming ? DateTime(2026, 7, 1) : DateTime(2026, 5, 1),
        status: status,
        totalAmount: 50000,
        notes: 'Test booking',
        createdAt: now,
        updatedAt: now,
      );
    }

    testWidgets('shows not-a-provider card when no provider profile', (
      tester,
    ) async {
      await tester.pumpWidget(createProviderDashboardScreen(provider: null));
      await tester.pumpAndSettle();

      // Verify not-a-provider message
      expect(
        find.text('Үйлчилгээ үзүүлэгч биш / Not a Provider'),
        findsOneWidget,
      );
    });

    testWidgets('shows provider card when profile exists', (tester) async {
      final provider = ServiceProvider(
        id: 'provider-1',
        userId: 'user-1',
        providerType: ServiceProviderType.photographer,
        businessName: 'Test Photo Studio',
        isVerified: true,
      );

      await tester.pumpWidget(
        createProviderDashboardScreen(provider: provider),
      );
      await tester.pumpAndSettle();

      // Verify provider info is shown
      expect(find.text('Test Photo Studio'), findsOneWidget);
    });

    testWidgets('shows upcoming bookings section', (tester) async {
      final provider = ServiceProvider(
        id: 'provider-1',
        userId: 'user-1',
        providerType: ServiceProviderType.photographer,
      );

      final upcoming = [
        createTestBooking(id: 'b1', isUpcoming: true),
        createTestBooking(id: 'b2', isUpcoming: true),
      ];

      await tester.pumpWidget(
        createProviderDashboardScreen(
          provider: provider,
          upcomingBookings: upcoming,
        ),
      );
      await tester.pumpAndSettle();

      // Verify upcoming section title
      expect(find.text('Удахгүй болох / Upcoming Bookings'), findsOneWidget);

      // Verify mark complete buttons
      expect(find.text('Дуусгах / Mark Complete'), findsNWidgets(2));
    });

    testWidgets('shows empty state for upcoming bookings', (tester) async {
      final provider = ServiceProvider(
        id: 'provider-1',
        userId: 'user-1',
        providerType: ServiceProviderType.photographer,
      );

      await tester.pumpWidget(
        createProviderDashboardScreen(provider: provider),
      );
      await tester.pumpAndSettle();

      // Verify empty state message
      expect(
        find.text('Удахгүй болох захиалга байхгүй / No upcoming bookings'),
        findsOneWidget,
      );
    });

    testWidgets('shows past bookings section', (tester) async {
      final provider = ServiceProvider(
        id: 'provider-1',
        userId: 'user-1',
        providerType: ServiceProviderType.photographer,
      );

      final past = [
        createTestBooking(
          id: 'b1',
          status: ServiceBookingStatus.completed,
          isUpcoming: false,
        ),
      ];

      await tester.pumpWidget(
        createProviderDashboardScreen(provider: provider, pastBookings: past),
      );
      await tester.pumpAndSettle();

      // Verify past section title
      expect(find.text('Өнгөрсөн / Past Bookings'), findsOneWidget);

      // Past bookings should not have mark complete buttons
      expect(find.text('Дуусгах / Mark Complete'), findsNothing);
    });

    testWidgets('shows status badge on booking cards', (tester) async {
      final provider = ServiceProvider(
        id: 'provider-1',
        userId: 'user-1',
        providerType: ServiceProviderType.photographer,
      );

      final upcoming = [
        createTestBooking(
          id: 'b1',
          status: ServiceBookingStatus.confirmed,
          isUpcoming: true,
        ),
      ];

      await tester.pumpWidget(
        createProviderDashboardScreen(
          provider: provider,
          upcomingBookings: upcoming,
        ),
      );
      await tester.pumpAndSettle();

      // Verify status badge
      expect(find.text('Баталгаажсан / Confirmed'), findsOneWidget);
    });
  });
}
