import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/payments/application/payment_providers.dart';
import '../../features/payments/domain/payment_request.dart';
import '../../features/payments/domain/subscription_state.dart';
import 'feature_gate.dart';

// ── Subscription State ──────────────────────────────────────────────

/// Одоогийн хэрэглэгчийн subscription-ийн идэвхтэй төлөв.
///
/// `subscriptionTierProvider`-ээс tier-г уншиж, `SubscriptionState`-ийг үүсгэнэ.
final subscriptionStateProvider = Provider<SubscriptionState>((ref) {
  final tier =
      ref.watch(subscriptionTierProvider).valueOrNull ?? SubscriptionTier.free;
  return SubscriptionState(currentTier: tier);
});

// ── Subscription Gate ───────────────────────────────────────────────

/// Subscription идэвхтэй эсэхийг шалгах gate.
///
/// Free түвшин бол үргэлж идэвхтэй.
/// Төлбөртэй түвшинд хугацаа болон grace period-ийг шалгана.
Provider<GateCheck> subscriptionGateProvider = Provider<GateCheck>((ref) {
  final state = ref.watch(subscriptionStateProvider);
  if (state.isActive) return const GateAllowed();
  return GateDenied(
    requiredTier: SubscriptionTier.pro,
    reason: state.statusMessage,
  );
});

// ── Expiry Warning ──────────────────────────────────────────────────

/// Захиалгын хугацаа дуусахад 7-оос дутуу хоног үлдсэн эсэхийг шалгах.
///
/// `true` буцаавал хэрэглэгчэд анхааруулга харуулах ёстой.
final expiryWarningProvider = Provider<bool>((ref) {
  final state = ref.watch(subscriptionStateProvider);
  return state.showsExpiryWarning;
});

/// Grace period-д байгаа эсэхийг шалгах.
///
/// `true` буцаавал хэрэглэгчийн access хязгаарлагдсан мэт харуулах ёстой.
final gracePeriodProvider = Provider<bool>((ref) {
  final state = ref.watch(subscriptionStateProvider);
  return state.isGracePeriod;
});

/// Хүлээгдэж буй төлбөрийн хүсэлт байгаа эсэхийг шалгах.
///
/// Шинэ түвшин сонгоод, төлбөр хүлээгдэж буй бол `true`.
final pendingUpgradeProvider = Provider<bool>((ref) {
  final activePayment = ref.watch(activePaymentProvider).valueOrNull;
  if (activePayment == null) return false;
  return activePayment.status == PaymentStatus.pending;
});

// ── Enhanced Gate Checks ────────────────────────────────────────────

/// Морь нэмэх боломжтой эсэх — subscription идэвхтэй байх ёстой.
Provider<GateCheck> subscriptionAwareHorseCreationGateProvider(
  int currentHorseCount,
) {
  return Provider<GateCheck>((ref) {
    // Subscription идэвхтэй эсэхийг эхлээд шалгана.
    final subGate = ref.watch(subscriptionGateProvider);
    if (subGate is GateDenied) return subGate;

    // Түвшний хязгаарыг шалгана.
    final limits = ref.watch(tierLimitsProvider);
    if (limits.maxHorses == null) return const GateAllowed();
    if (currentHorseCount < limits.maxHorses!) return const GateAllowed();
    return GateDenied(
      reason:
          'Үнэгүй түвшинд ${limits.maxHorses} морь нэмэх боломжтой. '
          'Pro захиалгаар хязгааргүй морь нэмэх боломжтой.',
      requiredTier: SubscriptionTier.pro,
    );
  });
}

/// Хадгалах зай шалгах — subscription идэвхтэй байх ёстой.
Provider<GateCheck> subscriptionAwareStorageGateProvider(int usedBytes) {
  return Provider<GateCheck>((ref) {
    final subGate = ref.watch(subscriptionGateProvider);
    if (subGate is GateDenied) return subGate;

    final limits = ref.watch(tierLimitsProvider);
    if (limits.storageBytes == null) return const GateAllowed();
    if (usedBytes < limits.storageBytes!) return const GateAllowed();
    const nextTier = SubscriptionTier.pro;
    return GateDenied(
      reason:
          'Хадгалах зай дүүрсэн (${limits.storageLabel}). '
          'Pro захиалгаар ${kTierLimits[nextTier]!.storageLabel} хүртэл '
          'ашиглах боломжтой.',
      requiredTier: nextTier,
    );
  });
}

/// Цус ойртолтын тооцоолуур — subscription идэвхтэй байх ёстой.
Provider<GateCheck> subscriptionAwareInbreedingCalcGateProvider =
    Provider<GateCheck>((ref) {
      final subGate = ref.watch(subscriptionGateProvider);
      if (subGate is GateDenied) return subGate;

      final limits = ref.watch(tierLimitsProvider);
      if (limits.hasInbreedingCalc) return const GateAllowed();
      return const GateDenied(
        reason: 'Цус ойртолтын тооцоолуур нь Pro захиалгын боломж юм.',
        requiredTier: SubscriptionTier.pro,
      );
    });

/// Зар сурталчилгаа (boost) — subscription идэвхтэй байх ёстой.
Provider<GateCheck> subscriptionAwareBoostGateProvider = Provider<GateCheck>((
  ref,
) {
  final subGate = ref.watch(subscriptionGateProvider);
  if (subGate is GateDenied) return subGate;

  final limits = ref.watch(tierLimitsProvider);
  if (limits.hasBoost) return const GateAllowed();
  return const GateDenied(
    reason: 'Зар сурталчилгаа нь Pro захиалгын боломж юм.',
    requiredTier: SubscriptionTier.pro,
  );
});
