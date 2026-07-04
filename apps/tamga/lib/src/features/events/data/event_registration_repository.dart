import '../../../core/error/result.dart';
import '../../../shared/domain/event_registration.dart';

/// Result-д суурилсан EventRegistrationRepository interface.
abstract class EventRegistrationRepository {
  /// Өгөгдсөн арга хэмжээний бүх бүртгэлийг авах.
  Future<Result<List<EventRegistration>>> fetchRegistrations(String eventId);

  /// Өгөгдсөн морины бүх бүртгэлийг авах.
  Future<Result<List<EventRegistration>>> fetchRegistrationsByHorse(
    String horseId,
  );

  /// Морийг арга хэмжээнд бүртгүүлэх.
  Future<Result<EventRegistration>> registerHorse({
    required String eventId,
    required String horseId,
    required String ownerId,
  });

  /// Бүртгэлийг цуцлах.
  Future<Result<EventRegistration>> cancelRegistration(String id);
}
