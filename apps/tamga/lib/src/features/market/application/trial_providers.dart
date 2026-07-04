import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/result.dart';
import '../domain/trial_booking.dart';
import '../domain/trial_slot.dart';
import 'market_providers.dart';

// ══════════════════════════════════════════════════════════════════
// Туршилтын цагийн цонх (Trial Slots) Providers
// ══════════════════════════════════════════════════════════════════

/// Зарын туршилтын цагийн цонхны жагсаалт.
final trialSlotsForListingProvider =
    FutureProvider.family<List<TrialSlot>, String>((ref, listingId) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchTrialSlotsForListing(listingId);
  return result.getOrThrow();
});

/// Туршилтын цагийн цонхны үйлдлүүд.
final trialSlotActionsProvider = Provider<TrialSlotActions>((ref) {
  return TrialSlotActions(ref);
});

/// Туршилтын цагийн цонхны үйлдлүүд.
class TrialSlotActions {
  TrialSlotActions(this._ref);

  final Ref _ref;

  /// Шинэ цагийн цонх үүсгэх.
  Future<Result<TrialSlot>> createSlot({
    required String listingId,
    required String sellerId,
    required DateTime date,
    required String startTime,
    required String endTime,
    String? notes,
  }) async {
    final repository = await _ref.read(marketRepositoryProvider.future);

    final slot = TrialSlot(
      id: const Uuid().v4(),
      listingId: listingId,
      sellerId: sellerId,
      date: date,
      startTime: startTime,
      endTime: endTime,
      notes: notes,
      createdAt: DateTime.now(),
    );

    final result = await repository.createTrialSlot(slot);

    if (result.isSuccess) {
      _ref.invalidate(trialSlotsForListingProvider(listingId));
    }

    return result;
  }

  /// Цагийн цонх устгах.
  Future<Result<void>> deleteSlot(String slotId, String listingId) async {
    final repository = await _ref.read(marketRepositoryProvider.future);
    final result = await repository.deleteTrialSlot(slotId);

    if (result.isSuccess) {
      _ref.invalidate(trialSlotsForListingProvider(listingId));
    }

    return result;
  }
}

// ══════════════════════════════════════════════════════════════════
// Туршилтын захиалга (Trial Bookings) Providers
// ══════════════════════════════════════════════════════════════════

/// Зарын туршилтын захиалгын жагсаалт.
final trialBookingsForListingProvider =
    FutureProvider.family<List<TrialBooking>, String>((ref, listingId) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchTrialBookingsForListing(listingId);
  return result.getOrThrow();
});

/// Худалдан авагчийн бүх захиалга.
final trialBookingsForBuyerProvider =
    FutureProvider<List<TrialBooking>>((ref) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchTrialBookingsForBuyer(
    localMarketBuyerId,
  );
  return result.getOrThrow();
});

/// Худалдагчийн бүх захиалга.
final trialBookingsForSellerProvider =
    FutureProvider<List<TrialBooking>>((ref) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final result = await repository.fetchTrialBookingsForSeller(
    localMarketBuyerId,
  );
  return result.getOrThrow();
});

/// Туршилтын захиалгын үйлдлүүд.
final trialBookingActionsProvider = Provider<TrialBookingActions>((ref) {
  return TrialBookingActions(ref);
});

/// Туршилтын захиалгын үйлдлүүд.
class TrialBookingActions {
  TrialBookingActions(this._ref);

  final Ref _ref;

  /// Шинэ захиалга үүсгэх (худалдан авагч).
  Future<Result<TrialBooking>> requestBooking({
    required String listingId,
    required TrialSlot slot,
    required String sellerId,
    String? notes,
  }) async {
    final repository = await _ref.read(marketRepositoryProvider.future);

    final booking = TrialBooking(
      id: const Uuid().v4(),
      listingId: listingId,
      slotId: slot.id,
      buyerId: localMarketBuyerId,
      sellerId: sellerId,
      notes: notes,
      requestedAt: DateTime.now(),
    );

    final result = await repository.createTrialBooking(booking);

    if (result.isSuccess) {
      _ref.invalidate(trialSlotsForListingProvider(listingId));
      _ref.invalidate(trialBookingsForListingProvider(listingId));
      _ref.invalidate(trialBookingsForBuyerProvider);
    }

    return result;
  }

  /// Захиалгын төлөвийг шинэчлэх (худалдагч).
  Future<Result<TrialBooking>> updateStatus({
    required String bookingId,
    required TrialBookingStatus status,
    required String listingId,
  }) async {
    final repository = await _ref.read(marketRepositoryProvider.future);

    final result = await repository.updateTrialBookingStatus(
      bookingId: bookingId,
      status: status,
    );

    if (result.isSuccess) {
      _ref.invalidate(trialBookingsForListingProvider(listingId));
      _ref.invalidate(trialBookingsForBuyerProvider);
      _ref.invalidate(trialBookingsForSellerProvider);

      // If cancelled, also invalidate the slot list so it becomes available again
      if (status == TrialBookingStatus.cancelled) {
        _ref.invalidate(trialSlotsForListingProvider(listingId));
      }
    }

    return result;
  }
}
