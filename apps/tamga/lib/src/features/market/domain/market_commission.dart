/// Default commission rate (5%).
const double kDefaultCommissionRate = 0.05;

/// Комисс (Commission) домэйн загвар.
///
/// Зарын гүйлгээний комиссын хувь хэмжээ болон дүнг хадгална.
class MarketCommission {
  const MarketCommission({required this.commissionRate, this.commissionAmount});

  /// Комиссын хувь хэмжээ (аравтын бутархай, жишээ нь 0.05 = 5%).
  final double commissionRate;

  /// Комиссын дүн (MNT) — сонголттой.
  final int? commissionAmount;

  // ── CopyWith ──────────────────────────────────────────────────

  MarketCommission copyWith({
    double? commissionRate,
    Object? commissionAmount = _sentinel,
  }) {
    return MarketCommission(
      commissionRate: commissionRate ?? this.commissionRate,
      commissionAmount: commissionAmount == _sentinel
          ? this.commissionAmount
          : commissionAmount as int?,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory MarketCommission.fromJson(Map<String, dynamic> json) {
    return MarketCommission(
      commissionRate: (json['commissionRate'] as num?)?.toDouble() ?? 0.0,
      commissionAmount: json['commissionAmount'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'commissionRate': commissionRate,
      'commissionAmount': commissionAmount,
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MarketCommission &&
          runtimeType == other.runtimeType &&
          commissionRate == other.commissionRate &&
          commissionAmount == other.commissionAmount;

  @override
  int get hashCode => Object.hash(commissionRate, commissionAmount);

  @override
  String toString() =>
      'MarketCommission(commissionRate: $commissionRate, commissionAmount: $commissionAmount)';
}

const _sentinel = Object();
