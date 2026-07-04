import '../../../core/error/result.dart';
import '../domain/race_entry.dart';

/// Result-д суурилсан RaceEntryRepository interface.
abstract class RaceEntryRepository {
  /// Уралдааны бүх бүртгэлийг авах.
  Future<Result<List<RaceEntry>>> fetchByRace(String raceId);

  /// Морины бүх бүртгэлийг авах.
  Future<Result<List<RaceEntry>>> fetchByHorse(String horseId);

  /// Морийг уралдаанд бүртгүүлэх.
  Future<Result<RaceEntry>> register({
    required String raceId,
    required String horseId,
    required String ownerId,
    required String jockeyName,
  });

  /// Бүртгэлийг цуцлах (төлөвийг scratched болгох, устгахгүй).
  Future<Result<RaceEntry>> cancel(String id);

  /// Бүртгэлийн үр дүнг шинэчлэх (төлөвийг competed болгоно).
  Future<Result<RaceEntry>> updateResult({
    required String id,
    required String result,
    required int placement,
    required int prize,
  });
}
