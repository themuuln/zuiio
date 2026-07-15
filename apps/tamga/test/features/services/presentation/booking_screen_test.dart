import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/services/application/booking_providers.dart';
import 'package:tamga/src/features/services/data/services_repository.dart';
import 'package:tamga/src/features/services/presentation/booking_screen.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';

/// Helper to create a ProviderScope wrapping BookingScreen.
Widget createBookingScreen({
  ServiceProviderType? providerType,
  String? providerId,
}) {
  return ProviderScope(
    overrides: [
      createBookingProvider.overrideWith((ref) {
        return _TestCreateBookingNotifier();
      }),
    ],
    child: MaterialApp(
      theme: AppTheme.light(),
      home: BookingScreen(providerType: providerType, providerId: providerId),
    ),
  );
}

/// A test notifier that starts in idle state.
class _TestCreateBookingNotifier extends CreateBookingNotifier {
  _TestCreateBookingNotifier() : super(_MockServiceBookingRepository());

  @override
  Future<void> createBooking({
    required String userId,
    String? providerId,
    required ServiceProviderType providerType,
    required String serviceType,
    List<String> horseIds = const [],
    String? locationAimag,
    String? locationSum,
    String? address,
    required DateTime bookingDate,
    int? totalAmount,
    String? notes,
  }) async {
    state = CreateBookingState.submitting;
    // Simulate success after a short delay
    await Future.delayed(const Duration(milliseconds: 50));
    state = CreateBookingState.success;
  }

  @override
  void reset() {
    state = CreateBookingState.idle;
  }
}

/// A minimal stub repository used for the test notifier.
class _MockServiceBookingRepository implements ServiceBookingRepository {
  @override
  Future<Result<List<ServiceBooking>>> fetchBookings(String userId) async {
    return const Result.ok([]);
  }

  @override
  Future<Result<ServiceBooking?>> fetchBookingById(String id) async {
    return const Result.ok(null);
  }

  @override
  Future<Result<ServiceBooking>> createBooking(ServiceBooking booking) async {
    return Result.ok(booking);
  }

  @override
  Future<Result<ServiceBooking>> updateBooking(ServiceBooking booking) async {
    return Result.ok(booking);
  }

  @override
  Future<Result<ServiceBooking>> cancelBooking(String bookingId) async {
    throw UnimplementedError();
  }

  @override
  Future<Result<void>> deleteBooking(String id) async {
    return const Result.ok(null);
  }
}

void main() {
  group('BookingScreen', () {
    testWidgets('renders booking form with all required fields', (
      tester,
    ) async {
      await tester.pumpWidget(createBookingScreen());
      await tester.pumpAndSettle();

      // Verify title
      expect(find.text('Захиалга / Booking'), findsOneWidget);

      // Verify service type selector (segmented button)
      expect(find.text('Гэрэл зурагчин'), findsOneWidget);
      expect(find.text('Мал эмнэлэг'), findsOneWidget);

      // Verify service detail label
      expect(
        find.text('Үйлчилгээний дэлгэрэнгүй / Service Detail'),
        findsOneWidget,
      );

      // Verify date selector
      expect(find.text('Огноо / Date'), findsOneWidget);

      // Verify location
      expect(find.text('Байршил / Location'), findsOneWidget);
    });

    testWidgets('switching service type changes available options', (
      tester,
    ) async {
      await tester.pumpWidget(createBookingScreen());
      await tester.pumpAndSettle();

      // Initially photographer is selected
      expect(find.text('Гэрэл зурагчин'), findsOneWidget);

      // Tap vet option
      await tester.tap(find.text('Мал эмнэлэг'));
      await tester.pumpAndSettle();

      // Now the segmented button should be on vet
      // Verify both options still visible
      expect(find.text('Гэрэл зурагчин'), findsOneWidget);
      expect(find.text('Мал эмнэлэг'), findsOneWidget);
    });

    testWidgets('shows pricing breakdown', (tester) async {
      await tester.pumpWidget(createBookingScreen());
      await tester.pumpAndSettle();

      // Scroll down to the pricing section
      await tester.scrollUntilVisible(
        find.text('Үнийн мэдээлэл / Pricing'),
        200.0,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();

      // Verify pricing section is now visible
      expect(find.text('Үнийн мэдээлэл / Pricing'), findsOneWidget);
    });

    testWidgets('horse count can be adjusted', (tester) async {
      await tester.pumpWidget(createBookingScreen());
      await tester.pumpAndSettle();

      // Initially shows 0 horses
      expect(find.text('0'), findsOneWidget);
      expect(find.text('Морьдын тоо / Number of Horses'), findsOneWidget);

      // Add a horse
      await tester.tap(find.byIcon(Icons.add_circle_outline));
      await tester.pumpAndSettle();

      // Should show 1 horse
      expect(find.text('1'), findsOneWidget);
    });

    testWidgets('renders aimag dropdown', (tester) async {
      await tester.pumpWidget(createBookingScreen());
      await tester.pumpAndSettle();

      // Tap the aimag dropdown
      await tester.tap(find.text('Аймаг / Aimag'));
      await tester.pumpAndSettle();

      // Verify some aimags are in the list
      expect(find.text('Архангай'), findsWidgets);
      expect(find.text('Баян-Өлгий'), findsWidgets);
    });
  });
}
