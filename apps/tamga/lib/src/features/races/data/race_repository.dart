import '../../../core/error/result.dart';
import '../domain/race.dart';

/// Result-д суурилсан RaceRepository interface.
abstract class RaceRepository {
  /// Бүх уралдааныг авах.
  Future<Result<List<Race>>> fetchAll();

  /// ID-гаар нэг уралдаан авах.
  Future<Result<Race>> fetchById(String id);

  /// Төрлөөр шүүж авах.
  Future<Result<List<Race>>> fetchByType(RaceType type);

  /// Шинэ уралдаан үүсгэх.
  Future<Result<Race>> create(Race race);

  /// Уралдааны мэдээллийг шинэчлэх.
  Future<Result<Race>> update(Race race);

  /// Уралдааныг устгах.
  Future<Result<void>> delete(String id);
}
