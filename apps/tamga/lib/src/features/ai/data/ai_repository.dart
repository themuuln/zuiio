import '../../../core/error/result.dart';
import '../domain/breeding_advice.dart';
import '../domain/breeding_query.dart';

/// Үржүүлгийн шинжилгээний репозиторийн интерфейс.
abstract class AiRepository {
  /// Үржүүлгийн шинжилгээний дүнг авах.
  ///
  /// [query] — аав/ээж морины ID-г агуулсан асуулт.
  /// Амжилттай бол [BreedingAdvice], алдаа гарвал [AppException] буцаана.
  Future<Result<BreedingAdvice>> getBreedingAdvice(BreedingQuery query);
}
