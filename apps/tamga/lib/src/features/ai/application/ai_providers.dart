import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../payments/application/payment_providers.dart';
import '../../payments/domain/payment_request.dart';
import '../data/ai_repository.dart';
import '../data/supabase_ai_repository.dart';
import '../domain/breeding_advice.dart';
import '../domain/breeding_query.dart';

// ── Repository Provider ───────────────────────────────────────────────

/// AI репозиторийн provider.
final aiRepositoryProvider = Provider<AiRepository>((ref) {
  return SupabaseAiRepository();
});

// ── Breeding Advice Provider ──────────────────────────────────────────

/// Үржүүлгийн шинжилгээний үр дүнг авах FutureProvider.
///
/// [sireId] ба [damId] параметрээр тодорхой хос морины шинжилгээг дуудах.
final breedingAdviceProvider =
    FutureProvider.family<BreedingAdvice, BreedingQuery>((ref, query) async {
      final repository = ref.watch(aiRepositoryProvider);
      final result = await repository.getBreedingAdvice(query);

      if (result.isSuccess) {
        return result.value;
      }

      throw result.error;
    });

// ── Rate Limit Configuration ─────────────────────────────────────────

/// Түвшин бүрийн AI шинжилгээний сарын хязгаар.
///
/// `null` = хязгааргүй.
const Map<SubscriptionTier, int?> kBreedingQueryLimits = {
  SubscriptionTier.free: 5,
  SubscriptionTier.pro: 50,
  SubscriptionTier.breeder: null, // хязгааргүй
  SubscriptionTier.stable: null, // хязгааргүй
};

// ── Query Count State ──────────────────────────────────────────────────

/// Өдрийн туршид ашигласан AI шинжилгээний тоог хянах.
///
/// Session-д зориулсан энгийн тоолуур. Edge Function нь Supabase-д
/// бодит тоог хадгалдаг боловч UI-ийн хувьд session тоолуур хангалттай.
final breedingQueryCountProvider = StateProvider<int>((ref) => 0);

// ── Quota Provider ────────────────────────────────────────────────────

/// Хэрэглэгчийн үлдэгдэл AI шинжилгээний квотын мэдээлэл.
class BreedingQuotaInfo {
  const BreedingQuotaInfo({required this.tier, this.limit, required this.used});

  /// Хэрэглэгчийн түвшин.
  final SubscriptionTier tier;

  /// Сарын нийт хязгаар. `null` = хязгааргүй.
  final int? limit;

  /// Сарын ашигласан тоо.
  final int used;

  /// Үлдсэн тоо. `null` = хязгааргүй.
  int? get remaining => limit != null ? limit! - used : null;

  /// Хязгаарт хүрсэн эсэх.
  bool get isExhausted {
    if (limit == null) return false; // хязгааргүй
    return used >= limit!;
  }

  /// Хязгаарт ойртсон эсэх (үлдэгдэл 1-ээс бага).
  bool get isNearLimit {
    if (limit == null) return false;
    return used >= limit! - 1;
  }

  @override
  String toString() =>
      'BreedingQuotaInfo(tier: ${tier.name}, limit: $limit, used: $used)';
}

/// Одоогийн хэрэглэгчийн AI шинжилгээний үлдэгдэл квотыг буцаана.
///
/// Хэрэглэгчийн subscription түвшин болон сарын ашигласан тоог харгалзан
/// үлдэгдэл квотыг тооцоолно.
final breedingQuotaProvider = FutureProvider<BreedingQuotaInfo>((ref) async {
  // Get current user's subscription tier
  final tier =
      ref.watch(subscriptionTierProvider).valueOrNull ?? SubscriptionTier.free;
  final limit = kBreedingQueryLimits[tier];
  final used = ref.watch(breedingQueryCountProvider);

  // For unlimited tiers, return max value quickly
  if (limit == null) {
    return BreedingQuotaInfo(tier: tier, limit: null, used: 0);
  }

  return BreedingQuotaInfo(tier: tier, limit: limit, used: used);
});

/// Тухайн түвшинд AI шинжилгээ хийх боломжтой эсэхийг шалгах.
///
/// Хэрэв хязгааргүй бол `null` буцаана.
/// Хэрэв хязгаартай бөгөөд хүрсэн бол `true`, эсвэл `false`.
bool canPerformBreedingQuery(SubscriptionTier tier, int used) {
  final limit = kBreedingQueryLimits[tier];
  if (limit == null) return true; // unlimited
  return used < limit;
}
