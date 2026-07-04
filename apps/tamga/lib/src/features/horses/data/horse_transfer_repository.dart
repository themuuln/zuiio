/// Морины эзэмшил шилжүүлэх repository.
library;

import '../../../core/error/result.dart';
import '../domain/horse_transfer.dart';

/// Морины эзэмшил шилжүүлэх repository interface.
abstract interface class HorseTransferRepository {
  /// Морины шилжүүлгийн түүхийг авах.
  Future<Result<HorseTransferHistory>> fetchTransferHistory(String horseId);

  /// Шинэ шилжүүлэг бүртгэх.
  Future<Result<HorseTransfer>> createTransfer(HorseTransfer transfer);

  /// Шилжүүлгийг баталгаажуулах.
  Future<Result<HorseTransfer>> verifyTransfer({
    required String transferId,
    required String verifiedBy,
  });

  /// Морины одоогийн эзнийг авах.
  Future<Result<String?>> getCurrentOwnerId(String horseId);
}
