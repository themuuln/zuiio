import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_queue.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../shared/application/sync_providers.dart';
import '../../shared/data/isar_storage.dart';
import '../data/admin_verification.dart';
import '../data/local_payment_repository.dart';
import '../data/payment_repository.dart';
import '../data/payment_service.dart';
import '../domain/payment_request.dart';

/// Төлбөрийн repository provider.
///
/// Offline-first approach: always uses [LocalPaymentRepository] for local
/// persistence and sync queue enqueuing. The [CloudSyncCoordinator] handles
/// pushing changes to Supabase when connectivity is available.
final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return LocalPaymentRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
    syncStorage: ref.watch(isarSyncStorageProvider),
  );
});

/// Төлбөрийн үйлчилгээ provider.
final paymentServiceProvider = Provider<PaymentService>((ref) {
  final repository = ref.watch(paymentRepositoryProvider);
  return PaymentService(repository);
});

/// Админ баталгаажуулах туслагч provider.
final adminVerificationProvider = Provider<AdminPaymentVerification>((ref) {
  return AdminPaymentVerification();
});

/// Одоогийн хэрэглэгчийн идэвхтэй төлбөрийн хүсэлт.
final activePaymentProvider = FutureProvider<PaymentRequest?>((ref) async {
  final userId = currentSupabaseUserId();
  if (userId == null) return null;

  final service = ref.watch(paymentServiceProvider);
  final result = await service.getActivePaymentRequest(userId);
  return result.isSuccess ? result.value : null;
});

/// Одоогийн хэрэглэгчийн subscription түвшин.
final subscriptionTierProvider = FutureProvider<SubscriptionTier>((ref) async {
  final userId = currentSupabaseUserId();
  if (userId == null) return SubscriptionTier.free;

  final client = getConfiguredSupabaseClient();
  if (client == null) return SubscriptionTier.free;

  try {
    final response = await client
        .from('profiles')
        .select('subscription_tier')
        .eq('owner_id', userId)
        .maybeSingle();

    if (response == null) return SubscriptionTier.free;
    return SubscriptionTier.fromString(
      response['subscription_tier'] as String? ?? 'free',
    );
  } catch (e, st) {
    debugPrint('[Payment] Failed to fetch subscription tier: $e');
    debugPrint('  Stack: $st');
    return SubscriptionTier.free;
  }
});

/// Одоогийн хэрэглэгчийн бүх төлбөрийн түүх.
final paymentHistoryProvider = FutureProvider<List<PaymentRequest>>((
  ref,
) async {
  final userId = currentSupabaseUserId();
  if (userId == null) return [];

  final service = ref.watch(paymentServiceProvider);
  final result = await service.listUserPayments(userId);
  return result.isSuccess ? result.value : [];
});
