import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/payments/application/payment_providers.dart';
import '../../features/payments/domain/payment_request.dart';

// ── Tier Limits ───────────────────────────────────────────────────────

/// Тухайн subscription түвшний хязгаарууд.
class TierLimits {
  const TierLimits({
    required this.maxHorses,
    required this.storageBytes,
    required this.maxPedigreeGenerations,
    required this.hasInbreedingCalc,
    required this.hasBreedingTools,
    required this.maxMultiUsers,
    required this.hasClientPortal,
    required this.hasBoost,
    required this.hasSellerBadge,
    required this.hasAiBreeding,
    required this.hasAnalytics,
  });

  /// Морь нэмэх дээд хязгаар. `null` = хязгааргүй.
  final int? maxHorses;

  /// Хадгалах зай (bytes). `null` = хязгааргүй.
  final int? storageBytes;

  /// Удам модны үеийн хязгаар. `null` = бүгд.
  final int? maxPedigreeGenerations;

  /// Цус ойртолтын тооцоолуур эсэх.
  final bool hasInbreedingCalc;

  /// Үржүүлэлтийн хэрэгсэл эсэх.
  final bool hasBreedingTools;

  /// Хамтын хэрэглэгчийн хязгаар. `null` = хязгааргүй.
  final int? maxMultiUsers;

  /// Захын portal эсэх.
  final bool hasClientPortal;

  /// Сурталчилгаа (boost) ашиглах боломжтой эсэх.
  final bool hasBoost;

  /// Дэлгүүрийн тэмдэг (seller badge) ашиглах боломжтой эсэх.
  final bool hasSellerBadge;

  /// AI үржүүлэгчийн зөвлөх ашиглах боломжтой эсэх.
  final bool hasAiBreeding;

  /// Аналитик хянах самбар ашиглах боломжтой эсэх.
  final bool hasAnalytics;

  String get storageLabel {
    if (storageBytes == null) return 'Хязгааргүй';
    if (storageBytes! >= 1024 * 1024 * 1024) {
      return '${(storageBytes! / (1024 * 1024 * 1024)).toStringAsFixed(0)} GB';
    }
    return '${(storageBytes! / (1024 * 1024)).toStringAsFixed(0)} MB';
  }

  String get horsesLabel => maxHorses == null ? 'Хязгааргүй' : '$maxHorses';
}

/// Түвшин бүрийн хязгаарууд.
const kTierLimits = <SubscriptionTier, TierLimits>{
  SubscriptionTier.free: TierLimits(
    maxHorses: 1,
    storageBytes: 50 * 1024 * 1024, // 50 MB
    maxPedigreeGenerations: 3,
    hasInbreedingCalc: false,
    hasBreedingTools: false,
    maxMultiUsers: 1,
    hasClientPortal: false,
    hasBoost: false,
    hasSellerBadge: false,
    hasAiBreeding: false,
    hasAnalytics: false,
  ),
  SubscriptionTier.pro: TierLimits(
    maxHorses: null, // хязгааргүй
    storageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    maxPedigreeGenerations: 5,
    hasInbreedingCalc: true,
    hasBreedingTools: false,
    maxMultiUsers: 1,
    hasClientPortal: false,
    hasBoost: true,
    hasSellerBadge: true,
    hasAiBreeding: true,
    hasAnalytics: true,
  ),
  SubscriptionTier.breeder: TierLimits(
    maxHorses: null,
    storageBytes: 20 * 1024 * 1024 * 1024, // 20 GB
    maxPedigreeGenerations: null, // бүгд
    hasInbreedingCalc: true,
    hasBreedingTools: true,
    maxMultiUsers: 1,
    hasClientPortal: false,
    hasBoost: true,
    hasSellerBadge: true,
    hasAiBreeding: true,
    hasAnalytics: true,
  ),
  SubscriptionTier.stable: TierLimits(
    maxHorses: null,
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxPedigreeGenerations: null, // бүгд
    hasInbreedingCalc: true,
    hasBreedingTools: true,
    maxMultiUsers: 10,
    hasClientPortal: true,
    hasBoost: true,
    hasSellerBadge: true,
    hasAiBreeding: true,
    hasAnalytics: true,
  ),
};

// ── Gate Check Result ─────────────────────────────────────────────────

/// Үйлдлийн хязгаарлалтын үр дүн.
sealed class GateCheck {
  const GateCheck();

  /// Зөвшөөрөгдсөн.
  const factory GateCheck.allowed() = GateAllowed;

  /// Хязгаардсан — түвшин ахиулалт шаардлагатай.
  const factory GateCheck.denied({
    required String reason,
    required SubscriptionTier requiredTier,
  }) = GateDenied;
}

class GateAllowed extends GateCheck {
  const GateAllowed();
}

class GateDenied extends GateCheck {
  const GateDenied({required this.reason, required this.requiredTier});

  final String reason;
  final SubscriptionTier requiredTier;
}

// ── Feature Gate Provider ─────────────────────────────────────────────

/// Тухайн хэрэглэгчийн subscription түвшний хязгаарууд.
final tierLimitsProvider = Provider<TierLimits>((ref) {
  final tier =
      ref.watch(subscriptionTierProvider).valueOrNull ?? SubscriptionTier.free;
  return kTierLimits[tier]!;
});

/// Тухайн хэрэглэгчийн subscription түвшин.
final currentTierProvider = Provider<SubscriptionTier>((ref) {
  return ref.watch(subscriptionTierProvider).valueOrNull ??
      SubscriptionTier.free;
});

// ── Gate Checks ───────────────────────────────────────────────────────

/// Морь нэмэх боломжтой эсэх.
Provider<GateCheck> horseCreationGateProvider(int currentHorseCount) {
  return Provider<GateCheck>((ref) {
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

/// Хадгалах зай шалгах (bytes ашигласан).
Provider<GateCheck> storageGateProvider(int usedBytes) {
  return Provider<GateCheck>((ref) {
    final limits = ref.watch(tierLimitsProvider);
    if (limits.storageBytes == null) return const GateAllowed();
    if (usedBytes < limits.storageBytes!) return const GateAllowed();
    final nextTier = SubscriptionTier.pro;
    return GateDenied(
      reason:
          'Хадгалах зай дүүрсэн (${limits.storageLabel}). '
          'Pro захиалгаар ${kTierLimits[nextTier]!.storageLabel} хүртэл ашиглах боломжтой.',
      requiredTier: nextTier,
    );
  });
}

/// Удам модны үеийн хязгаар шалгах.
Provider<GateCheck> pedigreeDepthGateProvider(int requestedGenerations) {
  return Provider<GateCheck>((ref) {
    final limits = ref.watch(tierLimitsProvider);
    if (limits.maxPedigreeGenerations == null) return const GateAllowed();
    if (requestedGenerations <= limits.maxPedigreeGenerations!) {
      return const GateAllowed();
    }
    return GateDenied(
      reason:
          'Үнэгүй түвшинд ${limits.maxPedigreeGenerations} үе хүртэл харах боломжтой. '
          'Pro захиалгаар 5 үе, Breeder+ бүгдийг харна.',
      requiredTier: SubscriptionTier.pro,
    );
  });
}

/// Цус ойртолтын тооцоолуур ашиглах боломжтой эсэх.
Provider<GateCheck> inbreedingCalcGateProvider = Provider<GateCheck>((ref) {
  final limits = ref.watch(tierLimitsProvider);
  if (limits.hasInbreedingCalc) return const GateAllowed();
  return const GateDenied(
    reason: 'Цус ойртолтын тооцоолуур нь Pro захиалгын боломж юм.',
    requiredTier: SubscriptionTier.pro,
  );
});

/// Зар сурталчилгаа (boost) ашиглах боломжтой эсэх.
Provider<GateCheck> boostGateProvider = Provider<GateCheck>((ref) {
  final limits = ref.watch(tierLimitsProvider);
  if (limits.hasBoost) return const GateAllowed();
  return const GateDenied(
    reason: 'Зар сурталчилгаа нь Pro захиалгын боломж юм.',
    requiredTier: SubscriptionTier.pro,
  );
});

/// Дэлгүүрийн тэмдэг (seller badge) ашиглах боломжтой эсэх.
Provider<GateCheck> sellerBadgeGateProvider = Provider<GateCheck>((ref) {
  final limits = ref.watch(tierLimitsProvider);
  if (limits.hasSellerBadge) return const GateAllowed();
  return const GateDenied(
    reason: 'Дэлгүүрийн тэмдэг нь Pro захиалгын боломж юм.',
    requiredTier: SubscriptionTier.pro,
  );
});
