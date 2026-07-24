import 'payment_request.dart';

/// Тухайн хэрэглэгчийн subscription-ийн идэвхтэй төлөв.
///
/// Subscription-ийн амьдралын мөчлөгийг илэрхийлнэ:
/// - Идэвхтэй захиалгатай үед `isActive = true`
/// - Хугацаа дууссаны дараа 7 хоногийн grace period байна
/// - Grace period-ийн дараа `free` түвшинд буцна
class SubscriptionState {
  const SubscriptionState({
    required this.currentTier,
    this.expiresAt,
    this.gracePeriodDays = 7,
  });

  /// Одоогийн subscription түвшин.
  final SubscriptionTier currentTier;

  /// Захиалгын хугацаа дуусах хугацаа.
  final DateTime? expiresAt;

  /// Grace period-ийн хоногийн тоо (default: 7 хоног).
  final int gracePeriodDays;

  /// Free түвшин эсэх.
  bool get isFree => currentTier == SubscriptionTier.free;

  /// Төлбөртэй захиалгатай эсэх (Pro, Breeder, эсвэл Stable).
  bool get isPaidTier => currentTier != SubscriptionTier.free;

  /// Subscription идэвхтэй эсэх.
  ///
  /// Идэвхтэй гэдэг нь:
  /// - Free түвшин бол үргэлж идэвхтэй
  /// - Төлбөртэй түвшин бол хугацаа дуусаагүй эсвэл grace period-д байгаа
  bool get isActive {
    if (isFree) return true;
    if (expiresAt == null) return true; // хугацаагүй = идэвхтэй
    return !isExpired || isGracePeriod;
  }

  /// Захиалгын хугацаа дууссан эсэх.
  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  /// Grace period-д байгаа эсэх.
  ///
  /// Хугацаа дууссаны дараа `gracePeriodDays` хоногийн турш
  /// хэрэглэгчийн access-ийг хадгална, гэхдээ сэрүүлэг харуулна.
  bool get isGracePeriod {
    if (!isExpired || expiresAt == null) return false;
    final graceEnd = expiresAt!.add(Duration(days: gracePeriodDays));
    return DateTime.now().isBefore(graceEnd);
  }

  /// Хугацаа хүртэл үлдсэн хоногийн тоо.
  ///
  /// Хугацаа дууссан бол grace period-ийн үлдсэн хоногийг буцаана.
  /// Free түвшин бол `-1` (хугацаагүй гэсэн утга).
  int get daysRemaining {
    if (isFree || expiresAt == null) return -1;
    if (isExpired) {
      if (!isGracePeriod) return 0;
      final graceEnd = expiresAt!.add(Duration(days: gracePeriodDays));
      final remaining = graceEnd.difference(DateTime.now()).inDays;
      return remaining > 0 ? remaining : 0;
    }
    final remaining = expiresAt!.difference(DateTime.now()).inDays;
    return remaining > 0 ? remaining : 0;
  }

  /// Захиалга дуусахад хүртэл үлдсэн өдрийн тоо (grace period ороогүй).
  int get daysUntilExpiry {
    if (expiresAt == null) return -1;
    final remaining = expiresAt!.difference(DateTime.now()).inDays;
    return remaining > 0 ? remaining : 0;
  }

  /// Хугацаа дуусахад 7-оос дутуу хоног үлдсэн эсэх (анхааруулга харуулах).
  bool get showsExpiryWarning {
    if (expiresAt == null) return false;
    if (isExpired) return true;
    return daysUntilExpiry <= 7;
  }

  /// Хэрэглэгчид харуулах нөхцөлийн мессеж.
  String get statusMessage {
    if (isFree) return 'Үнэгүй түвшин';
    if (isExpired && !isGracePeriod) {
      return 'Захиалга дууссан. Захиалгаа шинэчлэнэ үү.';
    }
    if (isGracePeriod) {
      return 'Хугацаа дууссан. $daysRemaining хоногийн дотор шинэчлэнэ үү.';
    }
    if (showsExpiryWarning) {
      return 'Захиалга $daysRemaining хоногийн дотор дуусна.';
    }
    return '${currentTier.displayName} захиалга идэвхтэй байна.';
  }

  /// Free түвшинд буцах (grace period дууссаны дараа).
  SubscriptionState expireGracePeriod() {
    return const SubscriptionState(currentTier: SubscriptionTier.free);
  }

  /// Түвшинг шинэчлэх (upgrade/downgrade).
  SubscriptionState changeTier(
    SubscriptionTier newTier, {
    DateTime? expiresAt,
  }) {
    return SubscriptionState(
      currentTier: newTier,
      expiresAt: expiresAt,
      gracePeriodDays: gracePeriodDays,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SubscriptionState &&
          runtimeType == other.runtimeType &&
          currentTier == other.currentTier &&
          expiresAt == other.expiresAt &&
          gracePeriodDays == other.gracePeriodDays;

  @override
  int get hashCode => Object.hash(currentTier, expiresAt, gracePeriodDays);
}
