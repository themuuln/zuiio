import '../../../core/error/result.dart';
import '../domain/feed_schedule.dart';
import '../domain/feed_log.dart';

/// Тэжээлийн бүртгэлийн repository interface.
///
/// [Result<T>] ашиглан амжилт/алдааг илэрхийлнэ.
abstract class NutritionRepository {
  /// Морины тэжээлийн хуваарийг авах.
  Future<Result<List<FeedSchedule>>> fetchSchedules(String horseId);

  /// Тэжээлийн хуваарь хадгалах (шинээр үүсгэх эсвэл шинэчлэх).
  Future<Result<FeedSchedule>> saveSchedule(FeedSchedule schedule);

  /// Тэжээлийн хуваарь устгах.
  Future<Result<void>> deleteSchedule(String id);

  /// Морины тэжээлийн бүртгэлийг авах.
  Future<Result<List<FeedLog>>> fetchLogs(String horseId);

  /// Морины тэжээлийн бүртгэлийг огнооны мужаар авах.
  Future<Result<List<FeedLog>>> fetchLogsByDateRange(
    String horseId,
    DateTime startDate,
    DateTime endDate,
  );

  /// Тэжээлийн бүртгэл хадгалах (шинээр үүсгэх эсвэл шинэчлэх).
  Future<Result<FeedLog>> saveLog(FeedLog log);

  /// Тэжээлийн бүртгэл устгах.
  Future<Result<void>> deleteLog(String id);
}
