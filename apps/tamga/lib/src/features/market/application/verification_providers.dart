import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/local_market_repository_v2.dart';
import '../data/market_repository.dart';
import '../domain/seller_verification.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../shared/data/isar_storage.dart';
import '../../../core/sync/sync_queue.dart';
import 'market_providers.dart';

// ── Verification Repository ─────────────────────────────────────────

/// Provider for the verification repository.
final verificationRepositoryProvider = FutureProvider<MarketRepository>((
  ref,
) async {
  return LocalMarketRepositoryV2(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

// ── Verification Summary ─────────────────────────────────────────────

/// Provider that fetches the seller verification summary for the current user.
final sellerVerificationSummaryProvider =
    FutureProvider<SellerVerificationStatusSummary>((ref) async {
      final userId = currentSupabaseUserId() ?? 'anonymous';
      final repository = await ref.watch(verificationRepositoryProvider.future);
      final result = await repository.fetchSellerVerificationSummary(userId);
      return result.getOrThrow();
    });

// ── Phone Verification ─────────────────────────────────────────────

/// Provider that fetches phone verification status for the current user.
final phoneVerificationProvider = FutureProvider<SellerPhoneVerification?>((
  ref,
) async {
  final userId = currentSupabaseUserId() ?? 'anonymous';
  final repository = await ref.watch(verificationRepositoryProvider.future);
  final result = await repository.fetchPhoneVerification(userId);
  return result.getOrThrow();
});

/// Notifier for performing phone verification actions.
final phoneVerificationNotifierProvider = Provider<PhoneVerificationNotifier>((
  ref,
) {
  return PhoneVerificationNotifier(ref);
});

class PhoneVerificationNotifier {
  PhoneVerificationNotifier(this._ref);

  final Ref _ref;

  /// Хэрэглэгчийн утасны баталгаажуулалтыг хадгалаад,
  /// түүний бүх зарыг баталгаажуулсан болгоно.
  Future<void> completePhoneVerification({required String phone}) async {
    final userId = currentSupabaseUserId() ?? 'anonymous';
    final repository = await _ref.read(verificationRepositoryProvider.future);
    final now = DateTime.now();

    // Save phone verification record
    final verification = SellerPhoneVerification(
      id: 'phone-vrf-${now.millisecondsSinceEpoch}',
      sellerId: userId,
      phone: phone,
      isVerified: true,
      verifiedAt: now,
    );

    await repository.savePhoneVerification(verification);

    // Mark all seller's listings as verified
    await repository.markSellerListingsVerified(userId);

    // Refresh related providers
    _ref.invalidate(marketListingsProvider);
    _ref.invalidate(marketCatalogProvider);
    _ref.invalidate(sellerVerificationSummaryProvider);
    _ref.invalidate(phoneVerificationProvider);
    _ref.invalidate(myListingsProvider);
  }
}

// ── E-Mongolia Verification ────────────────────────────────────────

/// Provider that fetches E-Mongolia verification status for the current user.
final eMongoliaVerificationProvider = FutureProvider<EMongoliaVerification?>((
  ref,
) async {
  final userId = currentSupabaseUserId() ?? 'anonymous';
  final repository = await ref.watch(verificationRepositoryProvider.future);
  final result = await repository.fetchEMongoliaVerification(userId);
  return result.getOrThrow();
});

/// Notifier for E-Mongolia verification actions.
final eMongoliaVerificationNotifierProvider =
    Provider<EMongoliaVerificationNotifier>((ref) {
      return EMongoliaVerificationNotifier(ref);
    });

class EMongoliaVerificationNotifier {
  EMongoliaVerificationNotifier(this._ref);

  final Ref _ref;

  /// E-Mongolia баталгаажуулалтыг илгээх (API scaffold).
  ///
  /// Энэ нь зөвхөн E-Mongolia API-н бэлтгэл хэсэг:
  /// хүсэлтийг хадгалах боловч API дуудалт хараахан хэрэгжээгүй.
  Future<void> submitEMongoliaVerification({
    required String eMongoliaId,
    required String fullName,
    List<String> documentUrls = const [],
  }) async {
    final userId = currentSupabaseUserId() ?? 'anonymous';
    final repository = await _ref.read(verificationRepositoryProvider.future);
    final now = DateTime.now();

    final verification = EMongoliaVerification(
      id: 'emongolia-${now.millisecondsSinceEpoch}',
      sellerId: userId,
      eMongoliaId: eMongoliaId,
      fullName: fullName,
      isVerified: false, // Will be verified by E-Mongolia API
      submittedAt: now,
      documentUrls: documentUrls,
    );

    await repository.saveEMongoliaVerification(verification);

    // Refresh
    _ref.invalidate(eMongoliaVerificationProvider);
    _ref.invalidate(sellerVerificationSummaryProvider);

    // TODO: Call E-Mongolia API to verify identity
    // This is a scaffold for future implementation.
    // When E-Mongolia API is ready:
    // 1. Call API with eMongoliaId
    // 2. If response is successful, update verification.isVerified = true
    // 3. Call repository.markSellerListingsVerified(userId)
    // 4. Refresh providers
  }

  /// E-Mongolia баталгаажуулалтын сэргээх (API дуудалтын загвар).
  ///
  /// E-Mongolia API бэлэн болсон үед энэ метод нь:
  /// 1. E-Mongolia API руу хүсэлт илгээнэ
  /// 2. Хариуг баталгаажуулна
  /// 3. Баталгаажуулсан бол заруудыг verified болгоно
  Future<void> verifyWithEMongoliaApi({
    required String eMongoliaId,
    required String fullName,
  }) async {
    // TODO: E-Mongolia API integration
    // const apiUrl = 'https://api.e-mongolia.mn/verify';
    // final client = http.Client();
    // try {
    //   final response = await client.post(
    //     Uri.parse(apiUrl),
    //     headers: {'Content-Type': 'application/json'},
    //     body: jsonEncode({
    //       'eMongoliaId': eMongoliaId,
    //       'fullName': fullName,
    //     }),
    //   );
    //   if (response.statusCode == 200) {
    //     final data = jsonDecode(response.body);
    //     if (data['verified'] == true) {
    //       // Success — mark as verified
    //       final userId = currentSupabaseUserId() ?? 'anonymous';
    //       final repository = await _ref.read(verificationRepositoryProvider.future);
    //       await repository.markSellerListingsVerified(userId);
    //     }
    //   }
    // } catch (e) {
    //   // Handle API errors
    //   throw Exception('E-Mongolia verification failed: $e');
    // }
    throw UnimplementedError(
      'E-Mongolia API integration is not yet implemented. '
      'This is a scaffolding placeholder for future integration.',
    );
  }
}
