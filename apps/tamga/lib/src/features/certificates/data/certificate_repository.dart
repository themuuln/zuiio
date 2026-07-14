import '../../../core/error/result.dart';
import '../domain/ownership_certificate.dart';

/// Дижитал эзэмшлийн гэрчилгээний интерфейс.
abstract interface class CertificateRepository {
  /// Шинэ гэрчилгээ үүсгэх.
  Future<Result<OwnershipCertificate>> createCertificate({
    required String horseId,
    required String ownerId,
    required String ownerName,
    String? horseName,
  });

  /// Гэрчилгээг шалгах (ID эсвэл QR кодоор).
  Future<Result<CertificateVerification>> verifyCertificate(
    String certificateId,
  );

  /// Гэрчилгээг шинэ эзэмшигчид шилжүүлэх.
  Future<Result<OwnershipCertificate>> transferCertificate({
    required String certificateId,
    required String newOwnerId,
    required String newOwnerName,
  });

  /// Морины гэрчилгээг авах (хамгийн сүүлийнх).
  Future<Result<OwnershipCertificate?>> getCertificateByHorse(String horseId);

  /// Хэрэглэгчийн бүх гэрчилгээний жагсаалт.
  Future<Result<List<OwnershipCertificate>>> getCertificatesByOwner(
    String ownerId,
  );
}
