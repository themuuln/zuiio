import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/ownership_certificate.dart';
import 'certificate_repository.dart';

/// Supabase cloud implementation for ownership certificates.
class SupabaseCertificateRepository with SupabaseRepositoryMixin implements CertificateRepository {
  SupabaseCertificateRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── CRUD ─────────────────────────────────────────────────

  @override
  Future<Result<OwnershipCertificate>> createCertificate({
    required String horseId,
    required String ownerId,
    required String ownerName,
    String? horseName,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      // Хэрэв моринд active гэрчилгээ байгаа бол цуцална
      final existing = await client
          .from('digital_certificates')
          .select()
          .eq('horse_id', horseId)
          .eq('status', 'active')
          .maybeSingle();

      if (existing != null) {
        await client
            .from('digital_certificates')
            .update({'status': 'revoked'})
            .eq('id', existing['id'] as String);
      }

      // Шинэ гэрчилгээ үүсгэх
      final qrCode =
          'TAMGA-${horseId.substring(0, 8).toUpperCase()}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';

      final data = {
        'horse_id': horseId,
        'owner_id': ownerId,
        'owner_name': ownerName,
        'horse_name': horseName,
        'issue_date': DateTime.now().toUtc().toIso8601String(),
        'expiry_date': DateTime.now()
            .add(const Duration(days: 365))
            .toUtc()
            .toIso8601String(),
        'status': 'active',
        'qr_code': qrCode,
      };

      final response = await client
          .from('digital_certificates')
          .insert(data)
          .select()
          .single();

      return Result.ok(OwnershipCertificate.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<CertificateVerification>> verifyCertificate(
    String certificateId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      // ID эсвэл QR кодоор хайх
      final response = await client
          .from('digital_certificates')
          .select()
          .or('id.eq.$certificateId,qr_code.eq.$certificateId')
          .maybeSingle();

      if (response == null) {
        return Result.fail(
          const AppException(
            message: 'Гэрчилгээ олдсонгүй',
            code: 'CERTIFICATE_NOT_FOUND',
          ),
        );
      }

      final cert = OwnershipCertificate.fromSupabaseJson(response);

      String message;
      bool isValid;

      if (cert.isExpired) {
        message = 'Гэрчилгээний хугацаа дууссан';
        isValid = false;
      } else if (cert.status == CertificateStatus.revoked) {
        message = 'Гэрчилгээ цуцалсан';
        isValid = false;
      } else if (cert.status == CertificateStatus.transferred) {
        message = 'Гэрчилгээ шилжүүлсэн — шинэ гэрчилгээ шалгана уу';
        isValid = false;
      } else {
        message = 'Гэрчилгээ идэвхтэй — ${cert.ownerName}';
        isValid = true;
      }

      return Result.ok(
        CertificateVerification(
          isValid: isValid,
          certificate: cert,
          message: message,
        ),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<OwnershipCertificate>> transferCertificate({
    required String certificateId,
    required String newOwnerId,
    required String newOwnerName,
  }) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      // Одоогийн гэрчилгээг авах
      final current = await client
          .from('digital_certificates')
          .select()
          .eq('id', certificateId)
          .eq('status', 'active')
          .maybeSingle();

      if (current == null) {
        return Result.fail(
          const AppException(
            message: 'Идэвхтэй гэрчилгээ олдсонгүй',
            code: 'ACTIVE_CERTIFICATE_NOT_FOUND',
          ),
        );
      }

      final currentCert = OwnershipCertificate.fromSupabaseJson(current);

      // Одоогийн гэрчилгээг 'transferred' болгох
      await client
          .from('digital_certificates')
          .update({'status': 'transferred'})
          .eq('id', certificateId);

      // Шинэ гэрчилгээ үүсгэх
      final qrCode =
          'TAMGA-${currentCert.horseId.substring(0, 8).toUpperCase()}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';

      final data = {
        'horse_id': currentCert.horseId,
        'owner_id': newOwnerId,
        'owner_name': newOwnerName,
        'horse_name': currentCert.horseName,
        'issue_date': DateTime.now().toUtc().toIso8601String(),
        'expiry_date': DateTime.now()
            .add(const Duration(days: 365))
            .toUtc()
            .toIso8601String(),
        'status': 'active',
        'qr_code': qrCode,
        'previous_owner_id': currentCert.ownerId,
      };

      final response = await client
          .from('digital_certificates')
          .insert(data)
          .select()
          .single();

      return Result.ok(OwnershipCertificate.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<OwnershipCertificate?>> getCertificateByHorse(
    String horseId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final response = await client
          .from('digital_certificates')
          .select()
          .eq('horse_id', horseId)
          .eq('status', 'active')
          .order('issue_date', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response == null) return Result.ok(null);

      return Result.ok(OwnershipCertificate.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<OwnershipCertificate>>> getCertificatesByOwner(
    String ownerId,
  ) async {
    try {
      final client = safeClient;
      if (client == null) return Result.fail(noClientError());

      final response = await client
          .from('digital_certificates')
          .select()
          .eq('owner_id', ownerId)
          .order('issue_date', ascending: false);

      final certificates = (response as List<dynamic>)
          .map(
            (e) => OwnershipCertificate.fromSupabaseJson(
              e as Map<String, dynamic>,
            ),
          )
          .toList();

      return Result.ok(certificates);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
