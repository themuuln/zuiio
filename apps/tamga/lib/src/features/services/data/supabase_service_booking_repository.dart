import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/service_booking.dart';
import '../domain/service_booking_status.dart';
import 'services_repository.dart';

/// Supabase cloud implementation for the service_bookings table.
class SupabaseServiceBookingRepository
    with SupabaseRepositoryMixin
    implements ServiceBookingRepository {
  SupabaseServiceBookingRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  @override
  Future<Result<List<ServiceBooking>>> fetchBookings(String userId) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('service_bookings')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final bookings = (response as List<dynamic>)
          .map(
            (row) =>
                ServiceBooking.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(bookings);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<ServiceBooking?>> fetchBookingById(String id) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok(null);

      final response = await client
          .from('service_bookings')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return const Result.ok(null);

      return Result.ok(ServiceBooking.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<ServiceBooking>> createBooking(ServiceBooking booking) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final data = booking.toSupabaseJson();
      await client.from('service_bookings').insert(data);

      return Result.ok(booking);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<ServiceBooking>> updateBooking(ServiceBooking booking) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final data = booking.toSupabaseJson();
      await client.from('service_bookings').upsert(data);

      return Result.ok(booking);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<ServiceBooking>> cancelBooking(String bookingId) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      // Fetch current booking to check if already cancelled
      final existing = await fetchBookingById(bookingId);
      if (existing.isFailure) {
        return Result.fail(existing.error);
      }

      final booking = existing.value;
      if (booking == null) {
        return Result.fail(
          AppException(
            message: 'Захиалга олдсонгүй',
            code: 'BOOKING_NOT_FOUND',
          ),
        );
      }

      if (booking.status == ServiceBookingStatus.cancelled) {
        return Result.fail(
          AppException(
            message: 'Захиалга аль хэдийн цуцлагдсан',
            code: 'BOOKING_ALREADY_CANCELLED',
          ),
        );
      }

      final cancelled = booking.cancel();
      await client
          .from('service_bookings')
          .update({
            'status': ServiceBookingStatus.cancelled.name,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', bookingId);

      return Result.ok(cancelled);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deleteBooking(String id) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      await client.from('service_bookings').delete().eq('id', id);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
