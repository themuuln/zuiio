import '../../../core/error/result.dart';
import '../domain/training_log.dart';
import '../domain/performance_record.dart';

/// Дасгалжуулалтын бүртгэлийн repository interface.
///
/// [Result<T>] ашиглан амжилт/алдааг илэрхийлнэ.
abstract class TrainingRepository {
  /// Морины бүх дасгалжуулалтын бүртгэлийг авах.
  Future<Result<List<TrainingLog>>> fetchByHorse(String horseId);

  /// Дасгалжуулалтын бүртгэл хадгалах (шинээр үүсгэх эсвэл шинэчлэх).
  Future<Result<TrainingLog>> save(TrainingLog log);

  /// Дасгалжуулалтын бүртгэл устгах.
  Future<Result<void>> delete(String id);

  /// Морины бүх гүйцэтгэлийн үзүүлэлтийг авах.
  Future<Result<List<PerformanceRecord>>> fetchPerformanceByHorse(
    String horseId,
  );

  /// Гүйцэтгэлийн үзүүлэлт хадгалах.
  Future<Result<PerformanceRecord>> savePerformance(PerformanceRecord record);

  /// Гүйцэтгэлийн үзүүлэлт устгах.
  Future<Result<void>> deletePerformance(String id);
}
