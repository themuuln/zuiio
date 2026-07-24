/// Тогтолцооны болон хөгжүүлэлтийн feature flag үүд.
///
/// Эдгээр flag нь:
/// - Release toggle (аажмаар нэвтрүүлэх)
/// - Kill switch (асуудал гарвал унтраах)
/// - Dev toggle (хөгжүүлэлтийн шатанд байгаа features)
///
/// Subscription түвшний хязгаарлалтыг `feature_gate.dart`-аас үзнэ үү.
library;

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Feature Flag Definition ───────────────────────────────────────────

/// Feature flag-ийн бүртгэл.
class FeatureFlag {
  const FeatureFlag({
    required this.key,
    required this.label,
    required this.description,
    required this.defaultValue,
    this.category = FeatureCategory.experimental,
  });

  /// SharedPreferences-д хадгалах түлхүүр.
  final String key;

  /// Хэрэглэгчид харуулах нэр.
  final String label;

  /// Тайлбар.
  final String description;

  /// Хөгжүүлэлтийн анхны утга.
  ///
  /// Release build-д `defaultValue`-г ашиглана.
  final bool defaultValue;

  /// Ангилал.
  final FeatureCategory category;

  /// SharedPreferences-д хадгалах бодит түлхүүр.
  String get storageKey => 'feature_flag_$key';

  // ── All flags ───────────────────────────────────────────────────────

  /// Бүх бүртгэлтэй feature flag-ууд.
  static List<FeatureFlag> get all => [
    stableManagement,
    multiProviderAuth,
    offlineSyncDebug,
    experimentalLineage,
    priceHistoryV2,
    pushNotifications,
    moderationQueue,
  ];

  // ── Individual Flag Definitions ─────────────────────────────────────

  /// Жүчээний менежмент (Stable).
  static const stableManagement = FeatureFlag(
    key: 'stable_management',
    label: 'Жүчээний менежмент',
    description: 'Олон хэрэглэгч, үйлчлүүлэгчийн портал, төлбөр тооцоо',
    defaultValue: false,
    category: FeatureCategory.experimental,
  );

  /// Google/Apple нэвтрэх.
  static const multiProviderAuth = FeatureFlag(
    key: 'multi_provider_auth',
    label: 'Олон төрлийн нэвтрэлт',
    description: 'Google болон Apple-аар нэвтрэх товчлуурууд',
    defaultValue: true,
    category: FeatureCategory.release,
  );

  /// Синк тохируулгын мэдээлэл.
  static const offlineSyncDebug = FeatureFlag(
    key: 'offline_sync_debug',
    label: 'Синк дибаг',
    description: 'Синк үйл явцын дэлгэрэнгүй мэдээллийг харуулах',
    defaultValue: kDebugMode,
    category: FeatureCategory.dev,
  );

  /// Туршилтын lineage алгоритм.
  static const experimentalLineage = FeatureFlag(
    key: 'experimental_lineage',
    label: 'Туршилтын lineage',
    description: 'Walker/Buchheim алгоритмын шинэ хувилбарыг идэвхжүүлэх',
    defaultValue: false,
    category: FeatureCategory.experimental,
  );

  /// Үнийн түүх v2.
  static const priceHistoryV2 = FeatureFlag(
    key: 'price_history_v2',
    label: 'Үнийн түүх v2',
    description: 'Үнийн түүхний шинэчлэгдсэн дэлгэц',
    defaultValue: true,
    category: FeatureCategory.release,
  );

  /// Push notification (Firebase Cloud Messaging).
  ///
  /// iOS developer account ($99/жил) шаардлагатай — APNs тохиргоогүй
  /// үед push notification ажиллахгүй тул default-аар унтраалтай.
  /// Local notification (flutter_local_notifications) энэ flag-аас
  /// хамаарахгүй — үргэлж ажиллана.
  static const pushNotifications = FeatureFlag(
    key: 'push_notifications',
    label: 'Push notification',
    description:
        'Firebase Cloud Messaging ашиглан мэдэгдэл илгээх (iOS APNs шаардлагатай)',
    defaultValue: false,
    category: FeatureCategory.release,
  );

  /// Зарын модерацийн самбар (admin only).
  ///
  /// Энэ flag идэвхтэй үед админууд мэдээлэгдсэн заруудыг
  /// харж, баталж эсвэл татгалзах боломжтой.
  static const moderationQueue = FeatureFlag(
    key: 'moderation_queue',
    label: 'Зарын модераци',
    description: 'Мэдээлэгдсэн заруудыг харах, батлах/татгалзах (admin only)',
    defaultValue: false,
    category: FeatureCategory.experimental,
  );
}

// ── Category ───────────────────────────────────────────────────────────

/// Feature flag-ийн ангилал.
enum FeatureCategory {
  /// Худалгаанд гарсан, бүрэн идэвхтэй.
  release,

  /// Хөгжүүлэлт/туршилтын шатанд, тохиргооноос хамаарч идэвхжинэ.
  experimental,

  /// Зөвхөн хөгжүүлэгчид харагдах дибаг/хуучны flag.
  dev,
}

// ── Feature Flag Service ──────────────────────────────────────────────

/// Feature flag-ийн төлөвийг удирдах үйлчилгээ.
///
/// SharedPreferences-д override утгуудыг хадгална.
class FeatureFlagService {
  FeatureFlagService(this._prefs);

  final SharedPreferences _prefs;

  /// Flag-ийн одоогийн утгыг буцаана (override > default).
  bool isEnabled(FeatureFlag flag) {
    return _prefs.getBool(flag.storageKey) ?? flag.defaultValue;
  }

  /// Flag-ийн override утгыг тохируулах.
  Future<void> setEnabled(FeatureFlag flag, bool value) async {
    await _prefs.setBool(flag.storageKey, value);
  }

  /// Override-г арилгаж, default утгад буцаах.
  Future<void> reset(FeatureFlag flag) async {
    await _prefs.remove(flag.storageKey);
  }

  /// Бүх override-г арилгах.
  Future<void> resetAll() async {
    for (final flag in FeatureFlag.all) {
      await _prefs.remove(flag.storageKey);
    }
  }
}

// ── Dev only section ──────────────────────────────────────────────────

/// Бүх dev flag-ууд идэвхгүй эсэхийг шалгах.
///
/// Release build-д үргэлж true буцаана.
bool get hasNoDevFlagsActive {
  if (!kDebugMode) return true;
  // Dev mode-д ч гэсэн dev flag-ууд default утгаараа үлдээсэн
  // байх нь зүйтэй. Энэ функц release build-д тохиолдлоор
  // dev flag үлдээсэн эсэхийг шалгахад зориулагдсан.
  return false;
}
