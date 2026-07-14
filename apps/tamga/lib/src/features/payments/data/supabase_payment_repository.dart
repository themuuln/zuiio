import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/payment_request.dart';
import 'payment_repository.dart';

/// Supabase cloud implementation for payment requests.
class SupabasePaymentRepository with SupabaseRepositoryMixin implements PaymentRepository {
  SupabasePaymentRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────────

  @override
  Future<Result<PaymentRequest>> createPaymentRequest(
    PaymentRequest request,
  ) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final data = request.toSupabaseJson(userId: request.userId);
      final response = await client
          .from('payment_requests')
          .insert(data)
          .select()
          .single();

      return Result.ok(PaymentRequest.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<PaymentRequest>> getPaymentStatus(String requestId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final response = await client
          .from('payment_requests')
          .select()
          .eq('id', requestId)
          .maybeSingle();

      if (response == null) {
        return const Result.fail(
          AppException(
            message: 'Төлбөрийн хүсэлт олдсонгүй',
            code: 'PAYMENT_NOT_FOUND',
          ),
        );
      }

      return Result.ok(PaymentRequest.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<PaymentRequest>>> listUserPayments(String userId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final response = await client
          .from('payment_requests')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final payments = (response as List<dynamic>)
          .map(
            (e) => PaymentRequest.fromSupabaseJson(e as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(payments);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<PaymentRequest>> updatePaymentStatus({
    required String requestId,
    required PaymentStatus newStatus,
    String? adminNotes,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final updateData = <String, dynamic>{'status': newStatus.name};
      if (adminNotes != null) {
        updateData['admin_notes'] = adminNotes;
      }
      if (newStatus == PaymentStatus.verified) {
        updateData['verified_at'] = DateTime.now().toUtc().toIso8601String();
      }

      final response = await client
          .from('payment_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single();

      return Result.ok(PaymentRequest.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<PaymentRequest?>> getActivePaymentRequest(String userId) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final response = await client
          .from('payment_requests')
          .select()
          .eq('user_id', userId)
          .eq('status', 'pending')
          .gt('expires_at', DateTime.now().toUtc().toIso8601String())
          .order('created_at', ascending: false)
          .maybeSingle();

      if (response == null) {
        return const Result.ok(null);
      }

      return Result.ok(PaymentRequest.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
