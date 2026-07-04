import '../../../core/error/result.dart';
import '../domain/service_booking.dart';
import '../domain/service_provider.dart';
import '../domain/vet_profile.dart';

/// Үйлчилгээний захиалгын репозиторийн интерфейс.
abstract class ServiceBookingRepository {
  /// Хэрэглэгчийн бүх захиалгыг авах.
  Future<Result<List<ServiceBooking>>> fetchBookings(String userId);

  /// Захиалгыг ID-аар авах.
  Future<Result<ServiceBooking?>> fetchBookingById(String id);

  /// Шинэ захиалга үүсгэх.
  Future<Result<ServiceBooking>> createBooking(ServiceBooking booking);

  /// Захиалгын төлөвийг шинэчлэх.
  Future<Result<ServiceBooking>> updateBooking(ServiceBooking booking);

  /// Захиалгыг цуцлах.
  Future<Result<ServiceBooking>> cancelBooking(String bookingId);

  /// Захиалгыг устгах.
  Future<Result<void>> deleteBooking(String id);
}

/// Мал эмнэлгийн профайлын репозиторийн интерфейс.
abstract class VetProfileRepository {
  /// Бүх мал эмчийн профайлыг авах.
  Future<Result<List<VetProfile>>> fetchAll();

  /// Аймгаар шүүж мал эмчийн профайлыг авах.
  Future<Result<List<VetProfile>>> fetchByAimag(String aimag);

  /// Мал эмчийн профайлыг ID-аар авах.
  Future<Result<VetProfile?>> fetchById(String id);
}

/// Үйлчилгээ үзүүлэгчийн репозиторийн интерфейс.
abstract class ServiceProviderRepository {
  /// Бүх үйлчилгээ үзүүлэгчийг авах.
  Future<Result<List<ServiceProvider>>> fetchAll();

  /// Төрлөөр шүүж үйлчилгээ үзүүлэгчийг авах.
  Future<Result<List<ServiceProvider>>> fetchByType(String providerType);

  /// Үйлчилгээ үзүүлэгчийг ID-аар авах.
  Future<Result<ServiceProvider?>> fetchById(String id);
}
