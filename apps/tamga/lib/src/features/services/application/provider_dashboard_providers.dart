/// Үйлчилгээ үзүүлэгчийн хяналтын самбарын provider-ууд.
///
/// Үйлчилгээ үзүүлэгчийн удахгүй болох болон өнгөрсөн захиалгуудыг
/// харуулах, захиалгыг дуусгах үйлдлүүдийг гүйцэтгэнэ.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_providers.dart';
import '../domain/service_booking.dart';
import '../domain/service_provider.dart';
import 'booking_providers.dart';
import 'services_providers.dart';

/// Одоогийн хэрэглэгчийн үйлчилгээ үзүүлэгчийн профайл.
final myServiceProviderProfileProvider = FutureProvider<ServiceProvider?>((
  ref,
) async {
  final authState = await ref.watch(authStateProvider.future);
  final userId = authState.userId;
  if (userId == null) return null;

  final repository = await ref.watch(serviceProviderRepositoryProvider.future);
  final result = await repository.fetchAll();

  final providers = result.getOrThrow();
  return providers.where((p) => p.userId == userId).firstOrNull;
});

/// Үйлчилгээ үзүүлэгчийн ирээдүйн захиалгууд.
final providerUpcomingBookingsProvider = FutureProvider<List<ServiceBooking>>((
  ref,
) async {
  final provider = await ref.watch(myServiceProviderProfileProvider.future);
  if (provider == null) return [];

  final bookings = await ref.watch(myBookingsProvider.future);
  return bookings
      .where((b) => b.providerId == provider.id && b.isActive)
      .toList();
});

/// Үйлчилгээ үзүүлэгчийн өнгөрсөн захиалгууд.
final providerPastBookingsProvider = FutureProvider<List<ServiceBooking>>((
  ref,
) async {
  final provider = await ref.watch(myServiceProviderProfileProvider.future);
  if (provider == null) return [];

  final bookings = await ref.watch(myBookingsProvider.future);
  return bookings
      .where((b) => b.providerId == provider.id && !b.isActive)
      .toList();
});
