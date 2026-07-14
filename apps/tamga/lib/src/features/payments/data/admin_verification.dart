import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';

/// Админ төлбөр баталгаажуулах туслагч.
///
/// Энэ нь бүрэн admin panel биш — зөвхөн Supabase RPC функцийг дуудаж,
/// Khan Bank-ийн гүйлгээг гартаа шалгасны дараа ашиглана.
///
/// Админтай хамтран ажиллах процесс:
/// 1. Хэрэглэгч төлбөрийн хүсэлт үүсгэнэ (код авна)
/// 2. Хэрэглэгч кодоо банкны шилжүүлгийн тэмдэглэлд бичиж мөнгө шилжүүлнэ
/// 3. Админ Khan Bank-ийн гүйлгээний түүхийг гартаа шалгана
/// 4. Код олдвол verifyPayment() RPC-г дуудана
class AdminPaymentVerification {
  AdminPaymentVerification({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  /// Төлбөрийг баталгаажуулах.
  ///
  /// [paymentId] — Баталгаажуулах төлбөрийн ID.
  /// [adminNotes] — Админы тэмдэглэл (жишээ: "Khan Bank гүйлгээ #12345").
  Future<Result<VerificationResult>> verifyPayment({
    required String paymentId,
    String? adminNotes,
  }) async {
    try {
      final client = _client;
      if (client == null) {
        return const Result.fail(
          AppException(
            message: 'Supabase тохиргоо байхгүй байна',
            code: 'SUPABASE_NOT_CONFIGURED',
          ),
        );
      }

      final response = await client.rpc(
        'verify_payment',
        params: {'p_payment_id': paymentId, 'p_admin_notes': adminNotes},
      );

      final data = response as Map<String, dynamic>;
      if (data['success'] == true) {
        return Result.ok(
          VerificationResult(
            success: true,
            tier: data['tier'] as String,
            expiresAt: DateTime.parse(data['expires_at'] as String),
            userId: data['user_id'] as String,
          ),
        );
      }

      return Result.fail(
        AppException(
          message: data['error'] as String? ?? 'Баталгаажуулалт амжилтгүй',
          code: 'VERIFICATION_FAILED',
        ),
      );
    } catch (e) {
      return Result.fail(
        AppException(message: e.toString(), code: 'VERIFICATION_ERROR'),
      );
    }
  }

  /// Төлбөрийг татгалзах.
  Future<Result<void>> rejectPayment({
    required String paymentId,
    String? adminNotes,
  }) async {
    try {
      final client = _client;
      if (client == null) {
        return const Result.fail(
          AppException(
            message: 'Supabase тохиргоо байхгүй байна',
            code: 'SUPABASE_NOT_CONFIGURED',
          ),
        );
      }

      final response = await client.rpc(
        'reject_payment',
        params: {'p_payment_id': paymentId, 'p_admin_notes': adminNotes},
      );

      final data = response as Map<String, dynamic>;
      if (data['success'] == true) {
        return const Result.ok(null);
      }

      return Result.fail(
        AppException(
          message: data['error'] as String? ?? 'Татгалзал амжилтгүй',
          code: 'REJECTION_FAILED',
        ),
      );
    } catch (e) {
      return Result.fail(
        AppException(message: e.toString(), code: 'REJECTION_ERROR'),
      );
    }
  }
}

/// Баталгаажуулалтын үр дүн.
class VerificationResult {
  const VerificationResult({
    required this.success,
    required this.tier,
    required this.expiresAt,
    required this.userId,
  });

  final bool success;
  final String tier;
  final DateTime expiresAt;
  final String userId;
}
