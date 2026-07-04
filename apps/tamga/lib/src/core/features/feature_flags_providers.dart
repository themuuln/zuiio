import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'feature_flags.dart';

// ── Service Provider ─────────────────────────────────────────────────

/// SharedPreferences-ээс FeatureFlagService-ийг үүсгэх FutureProvider.
final featureFlagInitProvider = FutureProvider<FeatureFlagService>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return FeatureFlagService(prefs);
});

// ── Individual Flag Providers ────────────────────────────────────────

/// Feature flag тус бүрийн утгыг ажиглах provider.
///
/// `flag` параметрээр ямар flag харахыг заана.
/// Эхний ачааллалтын үед `defaultValue`-г буцаана.
final featureFlagProvider = Provider.family<bool, FeatureFlag>((ref, flag) {
  final asyncService = ref.watch(featureFlagInitProvider);
  return asyncService.valueOrNull?.isEnabled(flag) ?? flag.defaultValue;
});

// ── Dev & Debug ──────────────────────────────────────────────────────

/// Dev overlay-д харуулах бүх flag-ууд.
///
/// Release build-д зөвхөн release болон experimental flag-уудыг харуулна.
final allFeatureFlagsProvider = Provider<List<FeatureFlag>>((ref) {
  if (!kDebugMode) {
    return FeatureFlag.all
        .where((f) => f.category != FeatureCategory.dev)
        .toList();
  }
  return FeatureFlag.all;
});

/// Initialize хийгдсэн эсэхийг ажиглах provider.
///
/// Overlay дээр loading төлөвийг харуулахад ашиглана.
final featureFlagReadyProvider = Provider<bool>((ref) {
  return ref.watch(featureFlagInitProvider).hasValue;
});
