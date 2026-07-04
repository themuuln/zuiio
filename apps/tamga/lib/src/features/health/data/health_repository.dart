import '../../../core/error/result.dart';
import '../../../shared/domain/health_log.dart';
import '../../shared/data/pagination/paginated_result.dart';

/// Result-д суурилсан HealthRepository interface.
abstract class HealthRepository {
  /// Бүх эрүүл мэндийн бүртгэлийг авах.
  Future<Result<List<HealthLog>>> fetchAll();

  /// Малын эмнэлгийн бүртгэлүүдийг авах.
  Future<Result<List<HealthLog>>> fetchMedicalLogs(String horseId);

  /// Тухайн морины бүх төрлийн бүртгэлийг авах.
  Future<Result<List<HealthLog>>> fetchAllByHorse(String horseId);

  /// Хуудаслалттайгаар морины эрүүл мэндийн бүртгэлийг авах.
  Future<Result<PaginatedResult<HealthLog>>> fetchAllByHorsePaginated({
    required String horseId,
    required int page,
    required int limit,
  });

  /// Эрүүл мэндийн бүртгэл хадгалах.
  Future<Result<HealthLog>> saveHealthLog(HealthLog log);

  /// Бүртгэл устгах.
  Future<Result<void>> deleteHealthLog(String horseId, String logId);
}
