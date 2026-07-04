/// Захиалгын provider-ууд.
///
/// Хэрэглэгчийн захиалгын жагсаалт, шинэ захиалга үүсгэх,
/// захиалгыг цуцлах зэрэг үйлдлүүдийг гүйцэтгэнэ.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../auth/application/auth_providers.dart';
import '../data/services_repository.dart';
import '../domain/service_booking.dart';
import '../domain/service_booking_status.dart';
import '../domain/service_provider_type.dart';
import 'services_providers.dart';

// ── Booking list providers ───────────────────────────────────────

/// Тодорхой хэрэглэчийн захиалгууд.
final bookingsByUserProvider =
    createListFamilyProvider<ServiceBooking, ServiceBookingRepository, String>(
  (ref) => ref.watch(serviceBookingRepositoryProvider.future),
  (repo, userId) => repo.fetchBookings(userId),
);

/// Одоогийн нэвтэрсэн хэрэглэчийн захиалгууд.
final myBookingsProvider = FutureProvider<List<ServiceBooking>>((ref) async {
  final authValue = ref.watch(authStateProvider);
  final authState = authValue.valueOrNull;
  final userId = authState?.userId;
  if (userId == null) return [];

  final repository = await ref.watch(serviceBookingRepositoryProvider.future);
  final result = await repository.fetchBookings(userId);
  return result.getOrThrow();
});

/// Ирээдүйн (идэвхтэй) захиалгууд.
final upcomingBookingsProvider = FutureProvider<List<ServiceBooking>>((ref) async {
  final bookings = await ref.watch(myBookingsProvider.future);
  return bookings.where((b) => b.isActive).toList();
});

/// Өнгөрсөн (дууссан/цуцлагдсан) захиалгууд.
final pastBookingsProvider = FutureProvider<List<ServiceBooking>>((ref) async {
  final bookings = await ref.watch(myBookingsProvider.future);
  return bookings.where((b) => !b.isActive).toList();
});

// ── Create booking state ──────────────────────────────────────────

/// Шинэ захиалга үүсгэх төлөв.
enum CreateBookingState { idle, submitting, success, error }

/// Шинэ захиалга үүсгэх StateNotifier.
class CreateBookingNotifier extends StateNotifier<CreateBookingState> {
  CreateBookingNotifier(this._repository) : super(CreateBookingState.idle);

  final ServiceBookingRepository _repository;
  String? _errorMessage;

  String? get errorMessage => _errorMessage;

  /// Шинэ захиалга үүсгэх.
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
    _errorMessage = null;

    final now = DateTime.now();
    final booking = ServiceBooking(
      id: '',
      userId: userId,
      providerId: providerId,
      providerType: providerType,
      serviceType: serviceType,
      horseIds: horseIds,
      locationAimag: locationAimag,
      locationSum: locationSum,
      address: address,
      bookingDate: bookingDate,
      status: ServiceBookingStatus.pending,
      totalAmount: totalAmount,
      notes: notes,
      createdAt: now,
      updatedAt: now,
    );

    final result = await _repository.createBooking(booking);

    result.when(
      onSuccess: (_) {
        state = CreateBookingState.success;
      },
      onFailure: (error) {
        _errorMessage = error.message;
        state = CreateBookingState.error;
      },
    );
  }

  /// Төлөвийг анхны байдалд буцаах.
  void reset() {
    state = CreateBookingState.idle;
    _errorMessage = null;
  }
}

/// Шинэ захиалга үүсгэх provider.
final createBookingProvider =
    StateNotifierProvider<CreateBookingNotifier, CreateBookingState>((ref) {
      final repository = ref.read(localServiceBookingRepositoryProvider);
      return CreateBookingNotifier(repository);
    });

// ── Cancel booking ────────────────────────────────────────────────

/// Захиалгыг цуцлах provider.
final cancelBookingProvider = FutureProvider.family<ServiceBooking, String>((
  ref,
  bookingId,
) async {
  final repository = await ref.watch(serviceBookingRepositoryProvider.future);
  final result = await repository.cancelBooking(bookingId);
  return result.getOrThrow();
});


