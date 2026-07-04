import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/features/services/application/provider_dashboard_providers.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_provider.dart';

void main() {
  group('provider_dashboard_providers', () {
    test('providerUpcomingBookingsProvider is a FutureProvider', () {
      expect(
        providerUpcomingBookingsProvider,
        isA<FutureProvider<List<ServiceBooking>>>(),
      );
    });

    test('providerPastBookingsProvider is a FutureProvider', () {
      expect(
        providerPastBookingsProvider,
        isA<FutureProvider<List<ServiceBooking>>>(),
      );
    });

    test('myServiceProviderProfileProvider is a FutureProvider', () {
      expect(
        myServiceProviderProfileProvider,
        isA<FutureProvider<ServiceProvider?>>(),
      );
    });
  });
}
